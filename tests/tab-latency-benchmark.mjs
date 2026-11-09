// Controlled browser benchmark: production app, synthetic records, explicit API delay.
import {preview} from 'vite';
import {pathToFileURL} from 'node:url';
import {writeFile, mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const delayMs=Number(process.env.BENCH_API_DELAY_MS ?? 150);
const count=Number(process.env.BENCH_TRADES ?? 126);
const rounds=Number(process.env.BENCH_ROUNDS ?? 20);
const rows=Array.from({length:count},(_,i)=>({id:i+1,asset:{id:1,symbol:'EURUSD'},setup:{id:1,label:'Breakout'},side:'BUY',entry_datetime:new Date(Date.UTC(2026,0,1,10+i)).toISOString(),exit_datetime:new Date(Date.UTC(2026,0,1,11+i)).toISOString(),risk_percent:1,capital_basis:10000,risk_amount:100,pnl_r:i%3===0?-1:2,pnl_amount:i%3===0?-100:200,status:null,effective_status:i%3===0?'LOSS':'WIN',session:'London',emotions:[],mistakes:[],notes:'Synthetic journal note. '.repeat(100),custom_fields:{},screenshots:[],commission:0,swap:0,trade_score:5}));
const journal={id:1,name:'Latency benchmark',starting_capital:10000,break_even_method:'ratio',break_even_value:0,currency:'USD',display_unit:'R'};
const tabs=['Trades','Analytics','Breakdown','Custom Fields'];
const percentile=(values,p)=>[...values].sort((a,b)=>a-b)[Math.ceil(values.length*p)-1];
const summarize=values=>({samples:values.length,median_ms:+percentile(values,.5).toFixed(1),p95_ms:+percentile(values,.95).toFixed(1)});
const results={measured_at:new Date().toISOString(),environment:'Local headless Chromium, production builds, synthetic API responses',api_delay_ms:delayMs,trades:count,rounds,results:[]};
let browser;
try {
 browser=await chromium.launch({headless:true,channel:'chrome'});
 for(const [label,directory,port] of [['main','/tmp/tradetrack-latency-baseline-dist',4191],['optimized',new URL('../dist',import.meta.url).pathname,4192]]) {
  const server=await preview({build:{outDir:directory},preview:{host:'127.0.0.1',port,strictPort:true}});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(()=>{localStorage.setItem('access','synthetic-benchmark');localStorage.setItem('last_journal_id','1');});
  const page=await context.newPage();page.setDefaultTimeout(15000);
  let reads=0,bytes=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/api/**',async route=>{
   const request=route.request();const url=new URL(request.url());
   const headers={'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,OPTIONS'};
   if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
   reads++;
   let data=[];
   if(url.pathname==='/api/auth/me/')data={id:1,email:'benchmark@example.test',first_name:'Benchmark',timezone:'UTC'};
   else if(url.pathname==='/api/journals/')data=[journal];
   else if(url.pathname.endsWith('/trades/')){
    const compact=label==='optimized'&&url.searchParams.get('compact')==='1';
    const size=Math.min(Number(url.searchParams.get('page_size')??20),compact?1000:100);
    const start=(Number(url.searchParams.get('page')??1)-1)*size;
    const records=rows.slice(start,start+size).map(row=>{
     if(!compact)return row;
     const {notes,screenshots,custom_fields,...rest}=row;
     void notes;void screenshots;void custom_fields;
     return {...rest,analytics_only:true};
    });
    data={count:rows.length,next:start+size<rows.length?'next':null,previous:null,results:records};
   }
   const body=JSON.stringify(data);bytes+=Buffer.byteLength(body);
   await new Promise(resolve=>setTimeout(resolve,delayMs));
   await route.fulfill({status:200,body,headers:{...headers,'content-type':'application/json'}});
  });
  await page.goto(`http://127.0.0.1:${port}/dashboard`,{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Latency benchmark',exact:true}).waitFor();
  const navigationStart=performance.now();
  await page.getByRole('button',{name:'Latency benchmark',exact:true}).click();
  try { await page.locator('tbody tr').first().waitFor(); } catch(error) { console.log('DIAGNOSTIC',label,errors,await page.locator('body').innerText()); throw error; }
  const firstTradesMs=performance.now()-navigationStart;
  // Let eager history fetches settle; measure tab switches independently of navigation.
  await page.waitForFunction(()=>document.querySelector('.analytics-page')&&!document.querySelector('[aria-label="Loading performance"]'));
  const measurements={},requests={};
  async function switchTab(name){
   const before=reads;
   const elapsed=await page.evaluate(async name=>{
    const nav=document.querySelector('nav[aria-label="Journal sections"]');
    const button=[...nav.querySelectorAll('button')].find(el=>el.textContent.trim()===name);
    const index=[...nav.querySelectorAll('button')].indexOf(button);
    const start=performance.now();button.click();
    return await new Promise((resolve,reject)=>{
     let stableFrames=0;
     function check(){
      const panel=nav.nextElementSibling?.children[index];
      const ready=button.getAttribute('aria-current')==='page'&&panel&&getComputedStyle(panel).display!=='none'&&!panel.querySelector('[role="status"], [aria-busy="true"]')&&panel.textContent.trim().length>0&&!/Loading/i.test(panel.textContent);
      if(performance.now()-start>10000)return reject(new Error('Tab readiness timed out: '+name));
      stableFrames = ready ? stableFrames + 1 : 0;
      if(stableFrames >= 3)resolve(performance.now()-start);
      else requestAnimationFrame(check);
     }
     requestAnimationFrame(check);
    });
   },name);
   return {ms:elapsed,reads:reads-before};
  }
  const firstVisits={};
  for(const name of tabs.slice(1))firstVisits[name]=await switchTab(name);
  for(let round=0;round<rounds;round++)for(const name of tabs){
   const {ms,reads:n}=await switchTab(name);
   (measurements[name]??=[]).push(ms);requests[name]=(requests[name]??0)+n;
  }
  if(errors.length)throw new Error(errors.join('\n'));
  const result={label,journal_navigation_ms:+firstTradesMs.toFixed(1),first_tab_visits:firstVisits,repeat_tab_switches:Object.fromEntries(tabs.map(name=>[name,{...summarize(measurements[name]),extra_reads:requests[name]}])),total_api_reads:reads,total_response_bytes:bytes};
  if(label === 'optimized') {
   const direct = await context.newPage();
   const directErrors=[];direct.on('pageerror', error=>directErrors.push(error.message));
   await direct.goto(`http://127.0.0.1:${port}/journal/1?tab=trades`);
   await direct.locator('tbody tr').first().waitFor({timeout:15000});
   if(directErrors.length)throw new Error(directErrors.join('\n'));
   result.direct_load_regression = 'passed with asynchronous auth/journal responses';
   await direct.close();
  }
  results.results.push(result);console.log(JSON.stringify(result,null,2));
  await context.close();await new Promise(resolve=>server.httpServer.close(resolve));
 }
 await mkdir('artifacts/latency',{recursive:true});
 await writeFile('artifacts/latency/tab-latency.json',JSON.stringify(results,null,2));
}finally{await browser?.close();}
