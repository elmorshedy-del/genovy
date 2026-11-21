"""Download and cache daily / intraday prices from Yahoo Finance.

Raw data is cached under research/mirror-symmetry/data/ (gitignored) as pickles.
All analysis uses dividend- and split-adjusted closes (auto_adjust=True).
"""
from __future__ import annotations

import os
import time
import pickle
import numpy as np
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")

UNIVERSE = {
    # asset class -> tickers
    "us_equity_index": ["SPY", "QQQ", "IWM", "DIA", "^GSPC"],
    "intl_equity_index": ["EFA", "EEM", "^N225", "^FTSE", "^GDAXI", "^HSI"],
    "us_sector": ["XLK", "XLF", "XLE", "XLV", "XLY", "XLP", "XLI", "XLU", "XLB"],
    "single_stock": ["AAPL", "MSFT", "AMZN", "JPM", "XOM", "JNJ", "PG", "KO", "WMT",
                     "GE", "IBM", "INTC", "NVDA", "CSCO", "BA", "CAT", "MRK", "PFE", "HD", "DIS"],
    "bond": ["TLT", "IEF", "HYG"],
    "commodity": ["GLD", "SLV", "USO", "DBC", "GC=F", "CL=F", "HG=F"],
    "fx": ["EURUSD=X", "JPY=X", "GBPUSD=X", "AUDUSD=X", "AUDJPY=X"],
    "crypto": ["BTC-USD", "ETH-USD"],
    "volatility": ["^VIX"],
}

ASSET_CLASS = {t: k for k, v in UNIVERSE.items() for t in v}


def _path(name: str) -> str:
    safe = name.replace("^", "IDX_").replace("=", "_").replace("/", "_")
    return os.path.join(DATA_DIR, f"{safe}.pkl")


def download_daily(ticker: str, start: str = "1927-01-01", force: bool = False) -> pd.DataFrame:
    import yfinance as yf

    p = _path(ticker)
    if os.path.exists(p) and not force:
        return pd.read_pickle(p)
    for attempt in range(5):
        try:
            df = yf.download(ticker, start=start, auto_adjust=True, progress=False, threads=False)
            if df is not None and len(df) > 0:
                break
        except Exception as e:  # network hiccup / rate limit
            print(f"  {ticker}: attempt {attempt} failed: {e}")
        time.sleep(2 + 3 * attempt)
    else:
        raise RuntimeError(f"download failed for {ticker}")
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df = df[["Open", "High", "Low", "Close", "Volume"]].dropna(subset=["Close"])
    df = df[df["Close"] > 0]
    df.index = pd.to_datetime(df.index).tz_localize(None)
    os.makedirs(DATA_DIR, exist_ok=True)
    df.to_pickle(p)
    return df


def download_intraday(ticker: str, interval: str, period: str, force: bool = False) -> pd.DataFrame:
    import yfinance as yf

    p = _path(f"{ticker}_{interval}")
    if os.path.exists(p) and not force:
        return pd.read_pickle(p)
    df = yf.download(ticker, period=period, interval=interval, auto_adjust=True,
                     progress=False, threads=False, prepost=False)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df = df[["Open", "High", "Low", "Close", "Volume"]].dropna(subset=["Close"])
    os.makedirs(DATA_DIR, exist_ok=True)
    df.to_pickle(p)
    return df


def load(ticker: str) -> pd.DataFrame:
    return pd.read_pickle(_path(ticker))


def load_close(ticker: str, start: str | None = None, end: str | None = None) -> pd.Series:
    df = load(ticker)
    s = df["Close"].astype(float)
    # drop stale duplicates (e.g. FX/crypto weekend prints, holiday repeats)
    s = s[~s.index.duplicated(keep="last")]
    if start:
        s = s[s.index >= start]
    if end:
        s = s[s.index <= end]
    return s


def log_returns(close: pd.Series) -> pd.Series:
    r = np.log(close).diff().dropna()
    return r[np.isfinite(r)]


def all_daily_tickers() -> list[str]:
    return [t for v in UNIVERSE.values() for t in v]


def download_daily_raw(ticker: str, start: str = "1927-01-01", force: bool = False) -> pd.DataFrame:
    """Split-adjusted but NOT dividend-adjusted OHLCV (the prices traders actually saw/quoted)."""
    import yfinance as yf

    p = _path(ticker + "_raw")
    if os.path.exists(p) and not force:
        return pd.read_pickle(p)
    for attempt in range(5):
        try:
            df = yf.download(ticker, start=start, auto_adjust=False, progress=False, threads=False)
            if df is not None and len(df) > 0:
                break
        except Exception as e:
            print(f"  {ticker}: attempt {attempt} failed: {e}")
        time.sleep(2 + 3 * attempt)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df = df[["Open", "High", "Low", "Close", "Adj Close", "Volume"]].dropna(subset=["Close"])
    df = df[df["Close"] > 0]
    df.index = pd.to_datetime(df.index).tz_localize(None)
    df.to_pickle(p)
    return df


def load_raw(ticker: str) -> pd.DataFrame:
    """Raw (unadjusted for dividends) OHLCV with an 'Adj Close' column; falls back to adjusted data
    for series without dividends (indices, FX, futures, crypto)."""
    p = _path(ticker + "_raw")
    if os.path.exists(p):
        df = pd.read_pickle(p)
    else:
        df = load(ticker).copy()
        df["Adj Close"] = df["Close"]
    df = df[~df.index.duplicated(keep="last")]
    return df
