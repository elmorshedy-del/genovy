"""Rebuild the Nasdaq order book for one symbol from itch_filter records (ITCH 5.0).

Outputs per day (npz):
  trades : ts_ns, price (1e-4 $), size, sign (+1 buyer-initiated, -1 seller-initiated), kind
           kind 0 = displayed execution (E), 1 = execution with price (C, printable), 2 = hidden (P)
  quotes : 1-second grid during 09:30-16:00: best bid, best ask, size at best bid/ask
  snaps  : 1-minute snapshots of displayed depth (shares) per price tick within +-W ticks of mid
  adds   : 1-minute counts of shares added per price tick (latent liquidity supply)
Aggressor side: an execution against a resting BUY order is seller-initiated (sign -1), and vice versa.
"""
from __future__ import annotations
import numpy as np
from numba import njit, types
from numba.typed import Dict

REC = np.dtype([('ts', '<u8'), ('ref', '<u8'), ('ref2', '<u8'), ('shares', '<u4'), ('price', '<u4'),
                ('locate', '<u2'), ('type', 'S1'), ('side', 'S1'), ('extra', '<u4')])

OPEN_NS = 34200 * 10**9      # 09:30:00
CLOSE_NS = 57600 * 10**9     # 16:00:00


def load_symbol(path_prefix: str, symbol: str) -> np.ndarray:
    loc = None
    for line in open(path_prefix + ".symbols.txt"):
        a, b = line.split()
        if b == symbol:
            loc = int(a)
    if loc is None:
        raise KeyError(symbol)
    rec = np.fromfile(path_prefix + ".events.bin", dtype=REC)
    return rec[rec['locate'] == loc]


@njit(cache=True)
def _rebuild(ts, ref, ref2, shares, price, typ, side, tick_base, nlev, snap_halfwidth):
    # typ / side are uint8 codes
    cap = 1 << 25
    o_price = np.zeros(cap, np.int64)
    o_shares = np.zeros(cap, np.int64)
    o_side = np.zeros(cap, np.int8)      # +1 buy, -1 sell
    nslot = 0
    idx = Dict.empty(key_type=types.int64, value_type=types.int64)
    bid = np.zeros(nlev, np.int64)
    ask = np.zeros(nlev, np.int64)
    best_b = -1
    best_a = nlev
    n = len(ts)
    tr_ts = np.zeros(n, np.int64); tr_px = np.zeros(n, np.int64); tr_sz = np.zeros(n, np.int64)
    tr_sg = np.zeros(n, np.int8); tr_kind = np.zeros(n, np.int8)
    ntr = 0
    nsec = (CLOSE_NS - OPEN_NS) // 10**9
    q_bid = np.full(nsec, -1, np.int64); q_ask = np.full(nsec, -1, np.int64)
    q_bsz = np.zeros(nsec, np.int64); q_asz = np.zeros(nsec, np.int64)
    nmin = nsec // 60
    W = snap_halfwidth
    snaps = np.zeros((nmin, 2 * W + 1), np.int64)      # signed: +bid depth, -ask depth (by level)
    snap_mid = np.zeros(nmin, np.int64)
    add_cnt = np.zeros((nmin, 2 * W + 1), np.int64)
    next_sec = 0
    next_min = 0
    for i in range(n):
        t = ts[i]
        # emit 1-second quotes / 1-minute snapshots for all grid points passed
        while next_sec < nsec and t >= OPEN_NS + (next_sec + 1) * 10**9:
            if best_b >= 0 and best_a < nlev:
                q_bid[next_sec] = best_b; q_ask[next_sec] = best_a
                q_bsz[next_sec] = bid[best_b]; q_asz[next_sec] = ask[best_a]
            if (next_sec + 1) % 60 == 0 and next_min < nmin:
                if best_b >= 0 and best_a < nlev:
                    mid = (best_b + best_a) // 2
                    snap_mid[next_min] = mid
                    for j in range(-W, W + 1):
                        lv = mid + j
                        if 0 <= lv < nlev:
                            snaps[next_min, j + W] = bid[lv] - ask[lv]
                next_min += 1
            next_sec += 1
        c = typ[i]
        if c == 65 or c == 70:            # 'A' / 'F' add
            lv = np.int64(price[i]) // 100 - tick_base
            sd = 1 if side[i] == 66 else -1
            if nslot >= cap:
                continue
            slot = nslot; nslot += 1
            idx[np.int64(ref[i])] = slot
            o_price[slot] = lv; o_shares[slot] = shares[i]; o_side[slot] = sd
            if 0 <= lv < nlev:
                if sd == 1:
                    bid[lv] += shares[i]
                    if lv > best_b: best_b = lv
                else:
                    ask[lv] += shares[i]
                    if lv < best_a: best_a = lv
                if t >= OPEN_NS and t < CLOSE_NS and next_min < nmin and snap_mid[max(next_min - 1, 0)] > 0:
                    mid0 = snap_mid[max(next_min - 1, 0)]
                    j = lv - mid0
                    if -W <= j <= W:
                        add_cnt[next_min, j + W] += shares[i]
        elif c == 69 or c == 67 or c == 88 or c == 68:   # 'E','C','X','D'
            r = np.int64(ref[i])
            if r not in idx:
                continue
            slot = idx[r]
            lv = o_price[slot]; sd = o_side[slot]
            if c == 68:
                q = o_shares[slot]
            else:
                q = min(np.int64(shares[i]), o_shares[slot])
            o_shares[slot] -= q
            if 0 <= lv < nlev:
                if sd == 1:
                    bid[lv] -= q
                    if bid[lv] < 0: bid[lv] = 0
                else:
                    ask[lv] -= q
                    if ask[lv] < 0: ask[lv] = 0
            if c == 69 or c == 67:
                tr_ts[ntr] = t; tr_sz[ntr] = q; tr_sg[ntr] = -sd
                if c == 69:
                    tr_px[ntr] = lv; tr_kind[ntr] = 0
                else:
                    tr_px[ntr] = np.int64(price[i]) // 100 - tick_base; tr_kind[ntr] = 1
                ntr += 1
            if o_shares[slot] <= 0:
                del idx[r]
            # repair best quotes
            while best_b >= 0 and bid[best_b] <= 0: best_b -= 1
            while best_a < nlev and ask[best_a] <= 0: best_a += 1
        elif c == 85:                      # 'U' replace
            r = np.int64(ref[i])
            if r not in idx:
                continue
            slot = idx[r]
            lv = o_price[slot]; sd = o_side[slot]; q = o_shares[slot]
            if 0 <= lv < nlev:
                if sd == 1:
                    bid[lv] -= q
                    if bid[lv] < 0: bid[lv] = 0
                else:
                    ask[lv] -= q
                    if ask[lv] < 0: ask[lv] = 0
            del idx[r]
            nlv = np.int64(price[i]) // 100 - tick_base
            if nslot < cap:
                s2 = nslot; nslot += 1
                idx[np.int64(ref2[i])] = s2
                o_price[s2] = nlv; o_shares[s2] = shares[i]; o_side[s2] = sd
                if 0 <= nlv < nlev:
                    if sd == 1:
                        bid[nlv] += shares[i]
                        if nlv > best_b: best_b = nlv
                    else:
                        ask[nlv] += shares[i]
                        if nlv < best_a: best_a = nlv
            while best_b >= 0 and bid[best_b] <= 0: best_b -= 1
            while best_a < nlev and ask[best_a] <= 0: best_a += 1
        elif c == 80:                      # 'P' hidden execution
            sd = 1 if side[i] == 66 else -1
            tr_ts[ntr] = t; tr_sz[ntr] = shares[i]; tr_sg[ntr] = -sd
            tr_px[ntr] = np.int64(price[i]) // 100 - tick_base; tr_kind[ntr] = 2
            ntr += 1
    return (tr_ts[:ntr], tr_px[:ntr], tr_sz[:ntr], tr_sg[:ntr], tr_kind[:ntr],
            q_bid, q_ask, q_bsz, q_asz, snaps, snap_mid, add_cnt)


def rebuild(rec: np.ndarray, snap_halfwidth: int = 600):
    px = rec['price'][np.isin(rec['type'], [b'A', b'F'])]
    ref_px = int(np.median(px)) // 100 if len(px) else 70000
    tick_base = ref_px - 20000                   # +-$200 window around the median add price
    nlev = 40000
    typ = rec['type'].view(np.uint8)
    side = rec['side'].view(np.uint8)
    out = _rebuild(rec['ts'].astype(np.int64), rec['ref'].astype(np.int64), rec['ref2'].astype(np.int64),
                   rec['shares'].astype(np.int64), rec['price'].astype(np.int64), typ, side,
                   tick_base, nlev, snap_halfwidth)
    names = ['tr_ts', 'tr_px', 'tr_sz', 'tr_sg', 'tr_kind', 'q_bid', 'q_ask', 'q_bsz', 'q_asz',
             'snaps', 'snap_mid', 'add_cnt']
    d = dict(zip(names, out))
    d['tick_base'] = tick_base
    return d
