import os, sys, statistics, math, pickle, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
from kalshi_btc_settlement import polymarket as pm
SP=os.environ.get('PM_DATA', os.path.dirname(os.path.abspath(__file__)))
pk=f'{SP}/markets.pkl'
if os.path.exists(pk): markets=pickle.load(open(pk,'rb'))
else:
    markets=pm.collect(7); pickle.dump(markets,open(pk,'wb'))
print(len(markets))
def mkt_price(m,t):
    # last trade-implied P(Up) at or before t
    best=None
    for f in m['fills']:
        if f['ts']<=t and f['taker']:
            if best is None or f['ts']>=best[0]:
                best=(f['ts'], f['price'] if f['outcome']=='Up' else 1-f['price'])
    return best[1] if best and t-best[0]<60 else None
for back in (840,600,300,120,60,30,10):
    E=[];M=[]
    for m in markets:
        if not m['path']: continue
        y=1 if m['winner']=='Up' else 0
        t=m['end']-back
        p=m['path'][t]; E.append((p,y))
        q=mkt_price(m,t)
        if q is not None: M.append((q,y,p))
    br=lambda L: statistics.fmean((p-y)**2 for p,y,*_ in L)
    print(f"T-{back:3d}s engine brier {br(E):.4f} n={len(E)} | market brier {br(M):.4f} engine-on-same {statistics.fmean((p-y)**2 for q,y,p in M):.4f} n={len(M)}")
# calibration of engine at T-600
for back in (600,300):
    bins={}
    for m in markets:
        if not m['path']: continue
        p=m['path'][m['end']-back]; y=m['winner']=='Up'
        b=min(int(p*5),4); bins.setdefault(b,[0,0]); bins[b][0]+=1; bins[b][1]+=y
    print(back,{f"{k/5:.1f}":(v[0],round(v[1]/v[0],2)) for k,v in sorted(bins.items())})
