import os, sys, statistics, pickle, random
from collections import defaultdict
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SP=os.environ.get('PM_DATA', os.path.dirname(os.path.abspath(__file__)))
A=pickle.load(open(f'{SP}/markets_prev.pkl','rb')); B=pickle.load(open(f'{SP}/markets.pkl','rb'))
def ci(v):
    rng=random.Random(0); bs=sorted(statistics.fmean(rng.choices(v,k=len(v))) for _ in range(2000)); return f"{statistics.fmean(v):+.4f} [{bs[50]:+.4f},{bs[1950]:+.4f}]"
def ask_series(m):
    # price a taker paid to BUY each outcome, per second (last taker BUY print, carried 10s max)
    last={'Up':None,'Down':None}; out={}
    fs=sorted([f for f in m['fills'] if f['taker']],key=lambda f:f['ts']); i=0
    for t in range(m['start'],m['end']):
        while i<len(fs) and fs[i]['ts']<=t:
            f=fs[i]; i+=1
            # BUY X at p => X ask ~p ; SELL X at p => other side ask ~ 1-p
            if f['side']=='BUY': last[f['outcome']]=(t,f['price'])
            else: last['Down' if f['outcome']=='Up' else 'Up']=(t,1-f['price'])
        out[t]={k:(v[1] if v and t-v[0]<=10 else None) for k,v in last.items()}
    return out
for label,ms in (('Sep18-25',A),('Sep25-Oct2',B)):
    print(label)
    for thr in (0.10,0.15,0.25):
        for lag in (1,3):
            res=[]; per=defaultdict(list)
            for m in ms:
                if not m['path']: continue
                asks=ask_series(m); cooldown=0
                for t in range(m['end']-780, m['end']-120):
                    if t<cooldown: continue
                    d=m['path'][t]-m['path'][t-60]
                    if abs(d)<thr: continue
                    side='Down' if d>0 else 'Up'      # side that just fell
                    a=asks.get(t+lag,{}).get(side)  # we react `lag` s later
                    if a is None or not 0.05<a<0.95: continue
                    won=m['winner']==side
                    pnl=(1 if won else 0)-a-0.07*a*(1-a)
                    res.append(pnl); per[m['condition']].append(pnl); cooldown=t+60
            mk=[statistics.fmean(v) for v in per.values()]
            print(f"   fade |dP60|>={thr:.2f}, react +{lag}s: trades {len(res):4d} markets {len(per):3d} pnl/contract {ci(res)}  per-market {ci(mk)}")
