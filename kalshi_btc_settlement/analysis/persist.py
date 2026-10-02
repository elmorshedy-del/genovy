import os, sys, statistics, pickle, math
from collections import defaultdict, Counter
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SP=os.environ.get('PM_DATA', os.path.dirname(os.path.abspath(__file__)))
A=pickle.load(open(f'{SP}/markets_prev.pkl','rb')); B=pickle.load(open(f'{SP}/markets.pkl','rb'))
def pnl(f,w):
    won=f['outcome']==w
    g=f['size']*(won-f['price']) if f['side']=='BUY' else f['size']*(f['price']-won)
    return g-(0.07*f['size']*f['price']*(1-f['price']) if f['taker'] else 0)
def agg(ms):
    r=defaultdict(lambda: {'pnl':0.0,'mk':set(),'name':None})
    for m in ms:
        for f in m['fills']:
            x=r[f['wallet']]; x['pnl']+=pnl(f,m['winner']); x['mk'].add(m['condition']); x['name']=x['name'] or f['name']
    return r
RA,RB=agg(A),agg(B)
both=[w for w in RA if w in RB and RA[w]['pnl']>0 and RB[w]['pnl']>0 and len(RA[w]['mk'])>=50 and len(RB[w]['mk'])>=50]
both.sort(key=lambda w: min(RA[w]['pnl'],RB[w]['pnl']), reverse=True)
print('wallets profitable both weeks (>=50 mkts each):', len(both))
allm=A+B
for w in both[:12]:
    rows=[]; per=defaultdict(lambda:[0.0,0.0,0.0])  # net shares, gross shares, pnl
    for m in allm:
        for f in m['fills']:
            if f['wallet']!=w: continue
            lu=(f['outcome']=='Up')==(f['side']=='BUY')
            pu=f['price'] if f['outcome']=='Up' else 1-f['price']
            pb=pu if lu else 1-pu
            p=m['path'].get(f['ts']) if m['path'] else None
            rows.append(dict(t=m['end']-f['ts'],tk=f['taker'],pb=pb,pe=None if p is None else (p if lu else 1-p),pnl=pnl(f,m['winner']),usd=f['size']*pb))
            k=per[m['condition']]; k[0]+=f['size']*(1 if lu else -1); k[1]+=f['size']; k[2]+=pnl(f,m['winner'])
    usd=sum(r['usd'] for r in rows)
    hedge=statistics.median(abs(v[0])/v[1] for v in per.values() if v[1])
    mk=[r for r in rows if not r['tk']]; tk=[r for r in rows if r['tk']]
    lock=[r for r in rows if r['pb']>=0.95]
    e=[r for r in rows if r['pe'] is not None]
    print(f"{RB[w]['name'] or w[:10]:30s} {w[:10]} pnl prior ${RA[w]['pnl']:>7,.0f} sel ${RB[w]['pnl']:>7,.0f} | mkts {len(per)} | ROI {sum(r['pnl'] for r in rows)/usd:+.3f} on ${usd:,.0f}"
          f"\n     maker share {len(mk)/len(rows):.2f} (maker pnl ${sum(r['pnl'] for r in mk):,.0f}, taker pnl ${sum(r['pnl'] for r in tk):,.0f}) | median s-to-close {statistics.median(r['t'] for r in rows):.0f} | final-60s share {statistics.fmean(0<r['t']<=60 for r in rows):.2f}"
          f"\n     avg price {statistics.fmean(r['pb'] for r in rows):.2f} | fills>=0.95: {len(lock)/len(rows):.2f} (pnl ${sum(r['pnl'] for r in lock):,.0f}) | net/gross per mkt {hedge:.2f} | engine edge at fill {statistics.fmean(r['pe']-r['pb'] for r in e):+.3f}")
