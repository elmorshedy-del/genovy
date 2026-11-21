"""Null-model surrogates that preserve some properties of a return series and destroy others.

sign_randomize : keeps the exact |r_t| sequence (vol path, clustering, timing, fat tails) and the
                 mean; destroys direction memory, skew, leverage and any price-level structure.
block_shuffle  : keeps within-block dependence; destroys longer memory and level structure.
iid_bootstrap  : keeps the marginal distribution only.
"""
from __future__ import annotations
import numpy as np


def sign_randomize(r: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    m = r.mean()
    s = rng.choice(np.array([-1.0, 1.0]), size=r.shape)
    return m + s * np.abs(r - m)


def block_shuffle(r: np.ndarray, rng: np.random.Generator, block: int = 20) -> np.ndarray:
    n = len(r)
    nb = int(np.ceil(n / block))
    starts = rng.integers(0, n - block, size=nb)
    out = np.concatenate([r[s:s + block] for s in starts])[:n]
    return out


def iid_bootstrap(r: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    return r[rng.integers(0, len(r), size=len(r))]
