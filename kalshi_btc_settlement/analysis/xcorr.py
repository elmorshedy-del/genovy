import os, sys, statistics, pickle, os, math
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SP=os.environ.get('PM_DATA', os.path.dirname(os.path.abspath(__file__)))
markets=pickle.load(open(f'{SP}/markets.pkl','rb'))
lags=[-120,-60,-30,-20,-10,-5,-2,0,2,5,10,20,30,60,120]
acc={k:[0,0,0,0,0] for k in lags}
for m in markets:
    if not m['path']: continue
    s,e=m['start'],m['end']
    mp={}
    for f in sorted(m['fills'],key=lambda f:f['ts']):
        if f['taker']: mp[f['ts']]=f['price'] if f['outcome']=='Up' else 1-f['price']
    last=None; series={}
    for t in range(s,e):
        last=mp.get(t,last); series[t]=last
    for t in range(s+130,e-130,5):
        a,b=series.get(t),series.get(t+5)
        if a is None or b is None: continue
        dm=b-a
        for k in lags:
            # engine move over same 5s window shifted by k (engine at t+k)
            de=m['path'][t+k+5]-m['path'][t+k]
            x=acc[k]; x[0]+=dm*de; x[1]+=dm*dm; x[2]+=de*de
for k,x in acc.items(): print(f"engine shifted {k:+4d}s corr {x[0]/math.sqrt(x[1]*x[2]):.3f}")
