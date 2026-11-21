"""Download every series used in the study (idempotent; uses local cache)."""
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ms import data

for t in data.all_daily_tickers():
    try:
        df = data.download_daily(t)
        print(f"{t:10s} {df.index[0].date()} -> {df.index[-1].date()}  n={len(df)}")
    except Exception as e:
        print(f"{t:10s} FAILED: {e}")
    time.sleep(0.5)

for t, interval, period in [("SPY", "1h", "730d"), ("SPY", "5m", "60d"), ("SPY", "1m", "8d"),
                            ("QQQ", "5m", "60d"), ("BTC-USD", "1h", "730d")]:
    try:
        df = data.download_intraday(t, interval, period)
        print(f"{t}_{interval:4s} {df.index[0]} -> {df.index[-1]}  n={len(df)}")
    except Exception as e:
        print(f"{t}_{interval} FAILED: {e}")
    time.sleep(0.5)
