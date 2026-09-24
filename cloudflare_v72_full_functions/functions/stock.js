
export async function onRequest(context){
  const { request } = context;
  const url = new URL(request.url);
  const code = (url.searchParams.get('code')||'').trim().toUpperCase().replace('.TW','').replace('.TWO','');
  const stats = (url.searchParams.get('stats')||'').trim();
  
  const NAME_MAP={'0050':'元大台灣50','0056':'元大高股息','00690':'兆豐台灣藍籌30','00878':'國泰永續高股息','00918':'大華優利高填息30','00919':'群益台灣精選高息','00929':'復華台灣科技優息','00982A':'主動群益台灣強棒','009813':'貝萊德寶利優越50','2330':'台積電','VOO':'S&P500 ETF'};
  
  const headers={'Access-Control-Allow-Origin':'*','Content-Type':'application/json','Cache-Control':'no-cache'};
  
  async function getTWSEName(c){
    try{
      const r=await fetch('https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL');
      if(r.ok){ const arr=await r.json(); if(Array.isArray(arr)){ for(const it of arr){ if(String(it.Code).toUpperCase()===c && it.Name) return it.Name.trim(); } } }
    }catch(e){}
    return null;
  }
  
  async function fetchHistoryStats(c, range){
    const syms=[`${c}.TW`, `${c}.TWO`, c];
    for(const sym of syms){
      try{
        const yUrl=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1mo&range=${range}`;
        const r=await fetch(yUrl,{headers:{'User-Agent':'Mozilla/5.0'}});
        if(!r.ok) continue;
        const j=await r.json();
        const closes=j?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
        if(!closes || closes.length<24) continue;
        const prices=closes.filter(v=>v!=null&&v>0);
        if(prices.length<24) continue;
        const rets=[]; for(let i=1;i<prices.length;i++) rets.push(Math.log(prices[i]/prices[i-1]));
        const mean=rets.reduce((a,b)=>a+b,0)/rets.length;
        let vari=0; for(const x of rets) vari+=(x-mean)*(x-mean); vari/=(rets.length-1);
        const mu=mean*12*100; const sigma=Math.sqrt(vari)*Math.sqrt(12)*100;
        const cagr=(Math.pow(prices[prices.length-1]/prices[0],1/(prices.length/12))-1)*100;
        return {mu,sigma,cagr,years:prices.length/12,points:prices.length,symbol:sym};
      }catch(e){ continue; }
    }
    return null;
  }
  
  if(!code) return new Response(JSON.stringify({error:'no code'}),{status:400,headers});
  
  if(stats){
    const h=await fetchHistoryStats(code, stats);
    if(h){
      let name=await getTWSEName(code); if(!name) name=NAME_MAP[code]||code;
      return new Response(JSON.stringify({code,name,symbol:h.symbol,mu:h.mu,sigma:h.sigma,cagr:h.cagr,years:h.years,points:h.points,range:stats,source:'Yahoo'}),{headers});
    }
    return new Response(JSON.stringify({error:'not found'}),{status:404,headers});
  }
  
  // Price
  try{
    const r=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${code}.TW?interval=1d&range=1d`,{headers:{'User-Agent':'Mozilla/5.0'}});
    if(r.ok){ const j=await r.json(); const meta=j?.chart?.result?.[0]?.meta; const pr=meta&&(meta.regularMarketPrice||meta.previousClose); if(pr){ let name=await getTWSEName(code); if(!name) name=NAME_MAP[code]||code; return new Response(JSON.stringify({price:Number(pr),name,source:`Yahoo:${code}.TW`}),{headers}); } }
  }catch(e){}
  try{
    const r=await fetch('https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL');
    if(r.ok){ const arr=await r.json(); for(const it of arr){ if(String(it.Code).toUpperCase()===code && it.ClosingPrice && it.ClosingPrice!=='-'){ const p=parseFloat(String(it.ClosingPrice).replace(/,/g,'')); const n=it.Name||NAME_MAP[code]||code; return new Response(JSON.stringify({price:p,name:n,source:'TWSE'}),{headers}); } } }
  }catch(e){}
  return new Response(JSON.stringify({error:'not found',code}),{status:404,headers});
}
