"""Run with: python -m unittest kalshi_btc_settlement.test_engine"""

import json
import math
import random
import unittest

from kalshi_btc_settlement.engine import (
    SettlementWindow, estimate_sigma_per_sec, remaining_average_std,
)
from kalshi_btc_settlement.live import parse_cf_message

CLOSE = 1_790_000_100


def window(**kw):
    defaults = dict(strike=100.0, close_ts=CLOSE, sigma_per_sec=1.0, strike_type="greater")
    defaults.update(kw)
    return SettlementWindow(**defaults)


class SettlementMathTest(unittest.TestCase):
    def test_window_is_59_seconds_before_close_through_close(self):
        w = window()
        self.assertFalse(w.add_tick(CLOSE - 60, 1.0))
        self.assertTrue(w.add_tick(CLOSE - 58.5, 1.0))
        self.assertTrue(w.add_tick(CLOSE, 1.0))
        self.assertFalse(w.add_tick(CLOSE + 1, 1.0))

    def test_first_print_in_a_second_wins(self):
        w = window()
        w.add_tick(CLOSE - 10.9, 101.0)
        self.assertFalse(w.add_tick(CLOSE - 10.1, 500.0))
        self.assertEqual(w.state().last_price, 101.0)

    def test_required_average_for_remaining_seconds(self):
        w = window()
        for s in range(30):
            w.add_tick(w.start_ts + s, 99.0)  # 30 seconds at 99 -> remaining 30 must average 101
        st = w.state()
        self.assertEqual(st.remaining, 30)
        self.assertAlmostEqual(st.running_average, 99.0)
        self.assertAlmostEqual(st.required_remaining_average, 101.0)
        self.assertAlmostEqual(st.required_move, 2.0)

    def test_settles_on_simple_average_with_strike_type(self):
        for strike_type, expected in (("greater", "settled_no"), ("greater_or_equal", "settled_yes")):
            w = window(strike_type=strike_type)
            for s in range(60):
                w.add_tick(w.start_ts + s, 99.0 if s % 2 else 101.0)
            st = w.state()
            self.assertAlmostEqual(st.final_value, 100.0)
            self.assertEqual(st.status, expected)

    def test_rounds_to_cents_before_comparing(self):
        w = window(strike=100.0, strike_type="greater_or_equal", round_to_cents=True)
        for s in range(60):
            w.add_tick(w.start_ts + s, 99.996)
        self.assertEqual(w.state().status, "settled_yes")

    def test_lock_when_remaining_seconds_cannot_plausibly_flip_it(self):
        w = window(sigma_per_sec=1.0)
        for s in range(55):
            w.add_tick(w.start_ts + s, 120.0)  # last 5s would need to average ~ -120
        st = w.state()
        self.assertEqual(st.status, "locked_yes")
        self.assertGreater(st.p_yes, 0.999999)

    def test_value_noise_widens_uncertainty(self):
        a, b = window(), window(value_noise=5.0)
        for w in (a, b):
            for s in range(50):
                w.add_tick(w.start_ts + s, 100.5)
        self.assertGreater(a.state().p_yes, b.state().p_yes)
        self.assertGreater(b.state().p_yes, 0.5)

    def test_remaining_average_std_matches_simulation(self):
        rng = random.Random(1)
        m, sigma, trials = 20, 3.0, 20000
        means = []
        for _ in range(trials):
            x, total = 0.0, 0.0
            for _ in range(m):
                x += rng.gauss(0, sigma)
                total += x
            means.append(total / m)
        sim = math.sqrt(sum(v * v for v in means) / trials)
        self.assertAlmostEqual(sim, remaining_average_std(sigma, m), delta=0.05 * sim)

    def test_p_yes_is_calibrated_on_simulated_random_walks(self):
        rng = random.Random(7)
        hits, total_p, n = 0, 0.0, 3000
        for _ in range(n):
            w = window(sigma_per_sec=2.0, strike=0.0)
            x = rng.gauss(0, 5)
            for s in range(60):
                if s == 40:
                    total_p += w.state().p_yes
                w.add_tick(w.start_ts + s, x)
                x += rng.gauss(0, 2.0)
            hits += w.state().status == "settled_yes"
        self.assertAlmostEqual(hits / n, total_p / n, delta=0.02)

    def test_sigma_estimators(self):
        rng = random.Random(3)
        xs = [0.0]
        for _ in range(5000):
            xs.append(xs[-1] + rng.gauss(0, 4.0))
        self.assertAlmostEqual(estimate_sigma_per_sec(xs), 4.0, delta=0.2)
        self.assertAlmostEqual(estimate_sigma_per_sec(xs, method="mad"), 4.0, delta=0.3)
        self.assertEqual(estimate_sigma_per_sec([1.0] * 100), 0.5)


class LiveFeedParsingTest(unittest.TestCase):
    def test_parses_documented_cfbenchmarks_frame(self):
        frame = {
            "type": "cfbenchmarks_value", "sending_ts_ms": 1669149841234, "sid": 1, "seq": 42,
            "msg": {
                "index_id": "BRTI", "received_at": 1710000000123,
                "data": "{\"type\":\"value\",\"id\":\"BRTI\",\"time\":1710000000123,\"value\":\"68000.12\"}",
                "avg_60s_data": {"value": "68000.12000000", "window_size": 3},
                "last_60s_windowed_average_15min": {"value": "68000.23000000", "window_size": 14},
            },
        }
        tick = parse_cf_message(json.dumps(frame))
        self.assertEqual(tick["index_id"], "BRTI")
        self.assertAlmostEqual(tick["ts"], 1710000000.123)
        self.assertEqual(tick["price"], 68000.12)
        self.assertEqual(tick["kalshi_window_avg"], 68000.23)
        self.assertEqual(tick["kalshi_window_size"], 14)

    def test_ignores_other_channels(self):
        self.assertIsNone(parse_cf_message({"type": "subscribed", "msg": {}}))


if __name__ == "__main__":
    unittest.main()
