import os, sys, statistics, pickle, math, random
from collections import defaultdict
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SP=os.environ.get('PM_DATA', os.path.dirname(os.path.abspath(__file__)))
A=pickle.load(open(f'{SP}/markets_prev.pkl','rb'))  # Sep 18-25
B=pickle.load(open(f'{SP}/markets.pkl','rb'))       # Sep 25-Oct 2
def pnl(f,w):
    won=f['outcome']==w
    g=f['size']*(won-f['price']) if f['side']=='BUY' else f['size']*(f['price']-won)
    return g-(0.07*f['size']*f['price']*(1-f['price']) if f['taker'] else 0)
def stats(ms):
    per=defaultdict(lambda: defaultdict(float)); vol=defaultdict(float); net=defaultdict(lambda: defaultdict(float)); tk=defaultdict(lambda:[0,0])
    win={}
    for m in ms:
        win[m['condition']]=m['winner']
        for f in m['fills']:
            per[f['wallet']][m['condition']]+=pnl(f,m['winner'])
            vol[f['wallet']]+=f['size']*f['price']
            net[f['wallet']][m['condition']]+=f['size']*(1 if (f['outcome']=='Up')==(f['side']=='BUY') else -1)
            tk[f['wallet']][0]+=f['taker']; tk[f['wallet']][1]+=1
    out={}
    for w,d in per.items():
        v=list(d.values()); n=len(v); mu=statistics.fmean(v); sd=statistics.pstdev(v) if n>1 else 0
        nw=[(net[w][c]>0)==(win[c]=='Up') for c in d if abs(net[w][c])>1]
        out[w]={'n':n,'pnl':sum(v),'t':mu/(sd/math.sqrt(n)) if sd else 0,'vol':vol[w],'netwin':statistics.fmean(nw) if nw else None,'taker':tk[w][0]/tk[w][1]}
    return out
SA,SB=stats(A),stats(B)
def evaluate(sel,test,label):
    ws=[w for w in sel if w in test]
    tp=sum(test[w]['pnl'] for w in ws)
    nw=[test[w]['netwin'] for w in ws if test[w]['netwin'] is not None]
    print(f"  {label}: {len(sel)} picked, {len(ws)} active in test week | test P&L ${tp:,.0f} | profitable {sum(test[w]['pnl']>0 for w in ws)}/{len(ws)} | median net-side win {statistics.median(nw) if nw else float('nan'):.3f}")
for (name,S,T) in (("select Sep18-25 -> test Sep25-Oct2",SA,SB),("select Sep25-Oct2 -> test Sep18-25",SB,SA)):
    print(name)
    elig=[w for w,r in S.items() if r['n']>=30 and r['vol']>=5000]
    base=[w for w in elig if w in T]
    print(f"  baseline: {len(base)} eligible wallets active both weeks | test P&L ${sum(T[w]['pnl'] for w in base):,.0f} | profitable {sum(T[w]['pnl']>0 for w in base)}/{len(base)}")
    for key in ('t','pnl'):
        for k in (10,25,50):
            top=sorted(elig,key=lambda w:S[w][key],reverse=True)[:k]
            evaluate(top,T,f"top {k:2d} by {key:3s}")
    # directional takers: early entrants with high netwin
    dirs=[w for w in elig if S[w]['netwin'] and S[w]['taker']>0.5]
    top=sorted(dirs,key=lambda w:S[w]['netwin'],reverse=True)[:25]
    evaluate(top,T,"top 25 taker-heavy by net-side win")
names={'Sardonic-Mink':'0x84389cfc','Pricey-Standard':'0x9cbc68db','Acrobatic-Lifetime':'0x9a4cbaf3','Spotted-Facility':'0x18368993','Sardonic-Presidency':'0x22a4827c','Impolite-Sister':'0xc2ad03f7','Rural-Wharf':'0x3725d52f','Amazing-Mail':'0x32ed2e54'}
print("named wallets, Sep18-25 (prior, unseen) vs Sep25-Oct2:")
for n,pre in names.items():
    wa=[w for w in SA if w.startswith(pre)]; wb=[w for w in SB if w.startswith(pre)]
    fmt=lambda S,ws: "inactive" if not ws else f"mkts {S[ws[0]]['n']:3d} pnl ${S[ws[0]]['pnl']:>8,.0f} t {S[ws[0]]['t']:+.1f} netwin {S[ws[0]]['netwin'] if S[ws[0]]['netwin'] is None else round(S[ws[0]]['netwin'],2)}"
    print(f"  {n:18s} prior: {fmt(SA,wa)} | selected week: {fmt(SB,wb)}")
