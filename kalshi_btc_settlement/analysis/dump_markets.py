"""Collect two weeks of Polymarket BTC 15m markets for the analysis scripts.

    PM_DATA=/some/dir python kalshi_btc_settlement/analysis/dump_markets.py
writes markets.pkl (last 7 days) and markets_prev.pkl (the 7 days before).
"""
import os, pickle, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
from kalshi_btc_settlement import polymarket as pm

SP = os.environ.get('PM_DATA', os.path.dirname(os.path.abspath(__file__)))
for name, ago in (('markets.pkl', 0), ('markets_prev.pkl', 7)):
    pickle.dump(pm.collect(7, end_days_ago=ago), open(os.path.join(SP, name), 'wb'))
