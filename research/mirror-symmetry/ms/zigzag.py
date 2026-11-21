"""Zigzag pivots on high/low series with a log-distance threshold."""
import numpy as np
from numba import njit


@njit(cache=True)
def zigzag(lh, ll, h):
    """lh, ll: log high / log low arrays. Returns pivots (idx, type) with type +1 = swing high,
    -1 = swing low, confirmed when price moves h (log) away from the extreme. Also returns the
    confirmation index for each pivot."""
    n = len(lh)
    piv = np.empty((n, 3), np.int64)
    k = 0
    mode = 0
    ext_i = 0
    hi_i = 0; lo_i = 0
    for i in range(1, n):
        if mode == 0:
            if lh[i] > lh[hi_i]: hi_i = i
            if ll[i] < ll[lo_i]: lo_i = i
            if lh[hi_i] - ll[i] >= h and hi_i < i:
                piv[k, 0] = hi_i; piv[k, 1] = 1; piv[k, 2] = i; k += 1; mode = -1; ext_i = i
                lo_i = i
            elif lh[i] - ll[lo_i] >= h and lo_i < i:
                piv[k, 0] = lo_i; piv[k, 1] = -1; piv[k, 2] = i; k += 1; mode = 1; ext_i = i
                hi_i = i
        elif mode == 1:      # looking for a swing high
            if lh[i] >= lh[ext_i]: ext_i = i
            elif lh[ext_i] - ll[i] >= h:
                piv[k, 0] = ext_i; piv[k, 1] = 1; piv[k, 2] = i; k += 1; mode = -1; ext_i = i
        else:                # looking for a swing low
            if ll[i] <= ll[ext_i]: ext_i = i
            elif lh[i] - ll[ext_i] >= h:
                piv[k, 0] = ext_i; piv[k, 1] = -1; piv[k, 2] = i; k += 1; mode = 1; ext_i = i
    return piv[:k]
