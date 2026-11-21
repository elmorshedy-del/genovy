"""Liquidity-Landscape Diffusion (LLD): factorial simulation that checks the theory.

  dp = mu_t dt + sigma_t * s_t(p) dW
  s(p)    : speed landscape (A: static periodic; E: self-written by volume-at-price memory)
  mu(p)   : barrier forces -U'(p) (B: periodic humps => double tops / bottoms)
  sigma_t : C adds path dependence (EGARCH-type leverage: vol rises after down moves)
  mu_t    : D adds drawdown-dependent dip buying (two-way flow during declines)
The same statistics as the empirical work (E1 crossing durations in calendar/variance time,
E2-A dwell-profile mirror, E3 swing-high rejection vs placebo) are computed on each model.
"""
import os, sys, json
import numpy as np
from numba import njit
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.e1_reversibility import crossing_stats, deltas
from scripts.e2_speed_memory import mirror_profile_stat
from scripts.e3_barriers import events

RES = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "results")
SIG = 0.011; MU = 0.0003; LAM = 0.08


@njit(cache=True)
def simulate(n, seed, land_amp, barrier_u0, lev, dip, selfint):
    np.random.seed(seed)
    p = np.zeros(n + 1); r2 = np.zeros(n); vol = np.zeros(n)
    h = np.log(SIG); hbar = np.log(SIG)
    nb = 4000; w = 0.25 * SIG
    vap = np.ones(nb); vtot = float(nb)
    runmax = 0.0
    for t in range(n):
        x = p[t]
        s = np.exp(land_amp * np.sin(2 * np.pi * x / LAM))
        if selfint > 0:
            k = int((x + 2.0) / w)
            if k < 0: k = 0
            if k >= nb: k = nb - 1
            s = (vap[k] / (vtot / nb)) ** (-selfint)
            if s > 3.0: s = 3.0
            if s < 0.33: s = 0.33
        sig = np.exp(h)
        mu = MU - barrier_u0 * (2 * np.pi / LAM) * (-np.sin(2 * np.pi * x / LAM))   # -U'(p), U = u0*cos
        if dip > 0:
            if x > runmax: runmax = x
            dd = runmax - x
            mu += dip * sig * np.tanh(dd / (5 * SIG))
        e = np.random.standard_normal()
        dx = mu + sig * s * e
        p[t + 1] = x + dx
        r2[t] = dx * dx
        v = 1.0 + 0.5 * abs(e)
        vol[t] = v
        if selfint > 0:
            k = int((x + 2.0) / w)
            if 0 <= k < nb:
                vap[k] += v * 0.02
                vtot += v * 0.02
        if lev > 0:
            h = (1 - 0.985) * hbar + 0.985 * h + 0.10 * (abs(e) - 0.798) - lev * e
    return p, r2, vol


CONFIGS = {
    "0_null_bm":            dict(land_amp=0.0, barrier_u0=0.0,   lev=0.0,  dip=0.0, selfint=0.0),
    "A_static_landscape":   dict(land_amp=0.35, barrier_u0=0.0,  lev=0.0,  dip=0.0, selfint=0.0),
    "B_landscape_barriers": dict(land_amp=0.35, barrier_u0=3e-5, lev=0.0,  dip=0.0, selfint=0.0),
    "C_B_plus_leverage":    dict(land_amp=0.35, barrier_u0=3e-5, lev=0.07, dip=0.0, selfint=0.0),
    "D_C_plus_dipbuying":   dict(land_amp=0.35, barrier_u0=3e-5, lev=0.07, dip=0.12, selfint=0.0),
    "E_selfwritten_lev_dip": dict(land_amp=0.0, barrier_u0=0.0,  lev=0.07, dip=0.12, selfint=0.15),
    "F_lev_only":           dict(land_amp=0.0, barrier_u0=0.0,   lev=0.07, dip=0.0, selfint=0.0),
    "G_lev_dip_no_land":    dict(land_amp=0.0, barrier_u0=0.0,   lev=0.07, dip=0.12, selfint=0.0),
    "H_selfwritten_only":   dict(land_amp=0.0, barrier_u0=0.0,   lev=0.0,  dip=0.0, selfint=0.15),
    "I_selfwritten_lev":    dict(land_amp=0.0, barrier_u0=0.0,   lev=0.07, dip=0.0, selfint=0.15),
}

if __name__ == "__main__":
    out = {}
    only = sys.argv[1:] if len(sys.argv) > 1 else list(CONFIGS)
    prev = json.load(open(os.path.join(RES, "model_lld.json"))) if os.path.exists(os.path.join(RES, "model_lld.json")) else {}
    out.update(prev)
    for name, cfg in CONFIGS.items():
        if name not in only: continue
        cal, var, rho_all, rej, rej_pl = [], [], [], [], []
        for seed in range(12):
            p, r2, vol = simulate(9000, 1000 + seed, **cfg)
            st = crossing_stats(p, r2 / SIG ** 2, None, 12 * SIG)
            if st is not None:
                dl = deltas(st)
                if "cal" in dl: cal.append(dl["cal"]); var.append(dl["var"])
            rho, _, _ = mirror_profile_stat(p, 12 * SIG, 6, 12)
            rho_all.extend(rho.tolist())
            lc = p; vrel = np.ones(len(p)); sreg = np.ones(len(p))
            ev = events(lc, lc, lc, vrel, sreg, SIG)
            evp = events(lc, lc, lc, vrel, sreg, SIG, placebo=True, rng_obj=np.random.default_rng(seed))
            if len(ev): rej.extend(ev[ev[:, 0] == 1][:, 1].tolist())
            if len(evp): rej_pl.extend(evp[evp[:, 0] == 1][:, 1].tolist())
        out[name] = {"delta_cal": float(np.mean(cal)), "delta_cal_se": float(np.std(cal) / np.sqrt(len(cal))),
                     "delta_var": float(np.mean(var)), "delta_var_se": float(np.std(var) / np.sqrt(len(var))),
                     "mirror_rho": float(np.mean(rho_all)), "mirror_rho_se": float(np.std(rho_all) / np.sqrt(len(rho_all))),
                     "p_reject_swing_high": float(np.mean(rej)), "p_reject_placebo": float(np.mean(rej_pl)),
                     "n_tests": len(rej), "config": cfg}
        o = out[name]
        print(f"{name:24s} dCal={o['delta_cal']:+.3f}±{o['delta_cal_se']:.3f} dVar={o['delta_var']:+.3f}±{o['delta_var_se']:.3f} "
              f"mirror_rho={o['mirror_rho']:+.3f}±{o['mirror_rho_se']:.3f} reject={o['p_reject_swing_high']:.3f} placebo={o['p_reject_placebo']:.3f} n={o['n_tests']}", flush=True)
    json.dump(out, open(os.path.join(RES, "model_lld.json"), "w"), indent=1)
