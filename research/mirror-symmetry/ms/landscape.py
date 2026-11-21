"""Price-space ("landscape") tools: band crossings, dwell profiles, volume-at-price."""
from __future__ import annotations
import numpy as np
from numba import njit


@njit(cache=True)
def band_crossings(x, a, b):
    """Crossing segments of band [a, b] by the discrete path x (log prices).

    Returns array of (start_idx, end_idx, direction) where an up-crossing starts at the last
    index with x <= a before the first subsequent index with x >= b (direction +1), and a
    down-crossing starts at the last index with x >= b before the first index with x <= a (-1).
    """
    n = len(x)
    out = np.empty((n, 3), dtype=np.int64)
    k = 0
    state = 0          # 0 unknown, -1 last touched a-side, +1 last touched b-side
    last_a = -1
    last_b = -1
    for i in range(n):
        xi = x[i]
        if xi <= a:
            if state == 1 and last_b >= 0:
                out[k, 0] = last_b; out[k, 1] = i; out[k, 2] = -1; k += 1
            state = -1
            last_a = i
        elif xi >= b:
            if state == -1 and last_a >= 0:
                out[k, 0] = last_a; out[k, 1] = i; out[k, 2] = 1; k += 1
            state = 1
            last_b = i
    return out[:k]


@njit(cache=True)
def dwell_profile(x, s, e, a, b, m):
    """Time spent (in steps) in each of m equal sub-bins of [a, b] between indices s..e,
    using linear interpolation of the path between consecutive observations."""
    prof = np.zeros(m)
    w = (b - a) / m
    for i in range(s, e):
        x0 = x[i]; x1 = x[i + 1]
        lo = min(x0, x1); hi = max(x0, x1)
        if hi - lo < 1e-15:
            j = int((x0 - a) / w)
            if 0 <= j < m:
                prof[j] += 1.0
            continue
        for j in range(m):
            blo = a + j * w; bhi = blo + w
            ov = min(hi, bhi) - max(lo, blo)
            if ov > 0:
                prof[j] += ov / (hi - lo)
    return prof


def volume_at_price(low, high, vol, edges, weights=None):
    """Distribute each bar's volume uniformly over [low, high] onto price-bin edges."""
    nb = len(edges) - 1
    vap = np.zeros(nb)
    w = np.ones(len(vol)) if weights is None else weights
    for lo, hi, v, wi in zip(low, high, vol, w):
        if not np.isfinite(v) or v <= 0:
            continue
        if hi <= lo:
            j = np.searchsorted(edges, lo) - 1
            if 0 <= j < nb:
                vap[j] += v * wi
            continue
        i0 = max(np.searchsorted(edges, lo) - 1, 0)
        i1 = min(np.searchsorted(edges, hi), nb)
        for j in range(i0, i1):
            ov = min(hi, edges[j + 1]) - max(lo, edges[j])
            if ov > 0:
                vap[j] += v * wi * ov / (hi - lo)
    return vap


def expected_crossing_shape(m):
    """Expected occupation density of a homogeneous diffusion crossing a band, per sub-bin:
    proportional to (y-a)(b-y) (Green function of the h-transformed process)."""
    y = (np.arange(m) + 0.5) / m
    g = y * (1 - y)
    return g / g.sum()


@njit(cache=True)
def crossing_weights(x, s, e, a, b):
    """Per-step weights (for steps s+1..e) giving the in-band fraction of the first/last step,
    so that durations measure only the time spent inside [a, b] (no overshoot)."""
    n = e - s
    w = np.ones(n)
    for k in range(n):
        i = s + k            # step from x[i] to x[i+1]
        x0 = x[i]; x1 = x[i + 1]
        lo = min(x0, x1); hi = max(x0, x1)
        if hi - lo < 1e-15:
            w[k] = 1.0 if (a <= x0 <= b) else 0.0
            continue
        ov = min(hi, b) - max(lo, a)
        w[k] = max(ov, 0.0) / (hi - lo)
    return w


@njit(cache=True)
def clipped_durations(x, cr, a, b, r2n, vn, has_vol):
    """For each crossing row (s, e, dir): in-band calendar, variance and volume durations."""
    m = cr.shape[0]
    out = np.zeros((m, 3))
    for j in range(m):
        s = cr[j, 0]; e = cr[j, 1]
        w = crossing_weights(x, s, e, a, b)
        tc = 0.0; tv = 0.0; tq = 0.0
        for k in range(e - s):
            i = s + k          # step i -> i+1 corresponds to return index i (x has a leading 0)
            tc += w[k]
            tv += w[k] * r2n[i]
            if has_vol:
                tq += w[k] * vn[i]
        out[j, 0] = tc; out[j, 1] = tv; out[j, 2] = tq
    return out
