"""Settlement engine for Kalshi BTC hourly / 15-minute markets.

Kalshi settles these markets on the simple average of the 60 one-second
CF Benchmarks BRTI readings in the minute before close. Once that minute
starts, every observed second permanently fixes 1/60 of the result, so the
question stops being "where will BTC be" and becomes "how extreme do the
remaining seconds have to be to flip the outcome".

This module is pure math with no I/O so it can be driven by the live Kalshi
`cfbenchmarks_value` feed, a replay of historical ticks, or tests.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

WINDOW_SECONDS = 60


def normal_cdf(x: float) -> float:
    return 0.5 * math.erfc(-x / math.sqrt(2.0))


def remaining_average_std(sigma_per_sec: float, remaining: int) -> float:
    """Std-dev of the average of the next `remaining` one-second prints of a
    random walk with per-second std `sigma_per_sec`, measured from the latest
    print.

    With X_t = e_1 + ... + e_t, mean(X_1..X_m) = (1/m) * sum_k (m-k+1) e_k, so
    Var = sigma^2 * (m+1)(2m+1) / (6m). Later seconds count less than a full
    price move because they only appear in the tail of the average.
    """
    if remaining <= 0:
        return 0.0
    m = remaining
    return sigma_per_sec * math.sqrt((m + 1) * (2 * m + 1) / (6.0 * m))


@dataclass
class WindowState:
    observed: int
    remaining: int
    running_sum: float
    running_average: float | None
    last_price: float | None
    # Average the unobserved seconds must hit for the final value to land exactly on the strike.
    required_remaining_average: float | None
    # How far the remaining seconds must average away from the latest print to reach the strike.
    required_move: float | None
    required_move_sigmas: float | None
    p_yes: float
    status: str  # "open", "locked_yes", "locked_no", "settled_yes", "settled_no"
    final_value: float | None


@dataclass
class SettlementWindow:
    """One settlement minute for one market.

    strike: the threshold from the market (floor_strike on Kalshi).
    strike_type: "greater" (above strike) or "greater_or_equal" (at least strike).
    close_ts: unix seconds of market close. The 60 counted seconds are
        close_ts-59 .. close_ts inclusive (Kalshi's feed numbers them :01 -> 1
        ... :59 -> 59 and the close tick -> 60).
    sigma_per_sec: per-second std of BRTI moves, estimated from recent ticks.
    round_to_cents: KXBTC15M rounds the final average to 2 decimals before comparing.
    lock_sigmas: report a market as locked once the remaining seconds would need a
        move this many standard deviations away from the latest print.
    value_noise: extra std ($) on the final average for uncertainty outside the
        random-walk model, e.g. when replaying a proxy instead of real BRTI.
        Leave at 0 on the live BRTI feed.
    """

    strike: float
    close_ts: int
    sigma_per_sec: float
    strike_type: str = "greater"
    round_to_cents: bool = False
    lock_sigmas: float = 4.0
    value_noise: float = 0.0
    prices: dict[int, float] = field(default_factory=dict)

    @property
    def start_ts(self) -> int:
        """First counted second."""
        return self.close_ts - WINDOW_SECONDS + 1

    def in_window(self, ts: int) -> bool:
        return self.start_ts <= ts <= self.close_ts

    def add_tick(self, ts: float, price: float) -> bool:
        """Record a BRTI print. Returns False if it falls outside the window.

        Only the first print per second counts, matching the "duplicate or
        out-of-order source timestamps are ignored" rule of Kalshi's feed.
        """
        second = int(math.floor(ts))
        if not self.in_window(second) or second in self.prices:
            return False
        self.prices[second] = float(price)
        return True

    def _yes(self, value: float) -> bool:
        if self.round_to_cents:
            value = round(value, 2)
        if self.strike_type == "greater_or_equal":
            return value >= self.strike
        return value > self.strike

    def state(self) -> WindowState:
        n = len(self.prices)
        remaining = WINDOW_SECONDS - n
        total = sum(self.prices.values())
        last_price = self.prices[max(self.prices)] if self.prices else None
        running_average = total / n if n else None

        if remaining == 0:
            final_value = total / WINDOW_SECONDS
            yes = self._yes(final_value)
            return WindowState(
                observed=n, remaining=0, running_sum=total, running_average=running_average,
                last_price=last_price, required_remaining_average=None, required_move=None,
                required_move_sigmas=None, p_yes=1.0 if yes else 0.0,
                status="settled_yes" if yes else "settled_no", final_value=final_value,
            )

        required_avg = (WINDOW_SECONDS * self.strike - total) / remaining
        if last_price is None:
            # Nothing fixed yet: caller must supply a reference price via forecast().
            return WindowState(
                observed=0, remaining=remaining, running_sum=0.0, running_average=None,
                last_price=None, required_remaining_average=required_avg, required_move=None,
                required_move_sigmas=None, p_yes=float("nan"), status="open", final_value=None,
            )

        required_move = required_avg - last_price
        # Uncertainty of the final 60s average: remaining seconds weigh remaining/60.
        sd_final = math.hypot(remaining_average_std(self.sigma_per_sec, remaining) * remaining / WINDOW_SECONDS,
                              self.value_noise)
        # Distance of the expected final average from the strike, in sigmas.
        gap = required_move * remaining / WINDOW_SECONDS
        z = gap / sd_final if sd_final > 0 else math.copysign(math.inf, gap or 1.0)
        p_yes = 1.0 - normal_cdf(z)
        status = "open"
        if z <= -self.lock_sigmas:
            status = "locked_yes"
        elif z >= self.lock_sigmas:
            status = "locked_no"
        return WindowState(
            observed=n, remaining=remaining, running_sum=total, running_average=running_average,
            last_price=last_price, required_remaining_average=required_avg,
            required_move=required_move, required_move_sigmas=z, p_yes=p_yes,
            status=status, final_value=None,
        )

    def forecast(self, reference_price: float, seconds_until_window: int = 0) -> float:
        """P(yes) before any settlement second has printed, from a spot price
        `seconds_until_window` seconds before the window opens."""
        m = WINDOW_SECONDS
        var = self.sigma_per_sec ** 2 * (seconds_until_window + (m + 1) * (2 * m + 1) / (6.0 * m))
        sd = math.hypot(math.sqrt(var), self.value_noise)
        return 1.0 - normal_cdf((self.strike - reference_price) / sd)


def estimate_sigma_per_sec(prices: list[float], method: str = "rms", floor: float = 0.5) -> float:
    """Per-second std from consecutive one-second prices.

    "rms" is realized volatility (the default: fat tails are real and the
    engine should not understate them). "mad" is a robust alternative that
    ignores a few bad prints. The floor stops a flat stretch of identical
    prints from making every market look locked.
    """
    diffs = [b - a for a, b in zip(prices, prices[1:])]
    if len(diffs) < 10:
        return floor
    if method == "mad":
        ordered = sorted(diffs)
        median = ordered[len(ordered) // 2]
        mad = sorted(abs(d - median) for d in diffs)[len(diffs) // 2]
        return max(1.4826 * mad, floor)
    return max(math.sqrt(sum(d * d for d in diffs) / len(diffs)), floor)
