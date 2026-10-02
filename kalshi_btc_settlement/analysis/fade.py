import os, sys, statistics, pickle
from collections import defaultdict
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SP=os.environ.get('PM_DATA', os.path.dirname(os.path.abspath(__file__)))
A=pickle.load(open(f'{SP}/markets_prev.pkl','rb')); B=pickle.load(open(f'{SP}/markets.pkl','rb'))
W={'Sardonic-Mink':'0x84389cfc','Round-Mainstream':'0xeda9247a','Menacing-Mallard':'0x943cea74','Flustered-Weedkiller':'0xb23aeebb','Monthly-Lollipop':'0xa82365c8','Swift-Census':'0xbadb9af9'}
print("1) Before their fills: change in engine P(their side) over prior 60s / 300s; their side's market price change over prior 60s")
for n,pre in W.items():
    d60=[];d300=[];dm=[]
    for m in A+B:
        if not m['path']: continue
        for f in m['fills']:
            if not f['wallet'].startswith(pre): continue
            lu=(f['outcome']=='Up')==(f['side']=='BUY'); t=f['ts']
            g=lambda p: p if lu else 1-p
            if t-60 in m['path'] and t in m['path']: d60.append(g(m['path'][t])-g(m['path'][t-60]))
            if t-300 in m['path'] and t in m['path']: d300.append(g(m['path'][t])-g(m['path'][t-300]))
    print(f"   {n:22s} fills {len(d60):5d}  dP60 {statistics.fmean(d60):+.3f}  dP300 {statistics.fmean(d300):+.3f}  share after adverse 60s move(<-0.1) {statistics.fmean(x<-0.1 for x in d60):.2f}")
print("2) Whole market: engine calibration conditional on the last 60s engine move (mid-window, 120-780s before close)")
for label,ms in (('Sep18-25',A),('Sep25-Oct2',B)):
    b=defaultdict(lambda:[0,0.0,0.0])
    for m in ms:
        if not m['path']: continue
        y=m['winner']=='Up'
        for back in range(780,120,-30):
            t=m['end']-back
            p=m['path'][t]; d=p-m['path'][t-60]
            # express relative to the side that just fell
            if abs(d)<0.05: key='flat (|dP|<.05)'
            else:
                key='after move .05-.15' if abs(d)<0.15 else 'after move .15-.30' if abs(d)<0.3 else 'after move >.30'
            q,yy=(p,y) if d<0 else (1-p,not y)   # probability of the side that just LOST ground
            if abs(d)<0.05: q,yy=p,y
            x=b[key]; x[0]+=1; x[1]+=q; x[2]+=yy
    print('  ',label)
    for k,x in sorted(b.items()): print(f"     {k:20s} n={x[0]:6d} engine P(side that just fell) {x[1]/x[0]:.3f}  actual {x[2]/x[0]:.3f}")
