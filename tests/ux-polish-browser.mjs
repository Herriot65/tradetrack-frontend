// Real app/providers and routes; intercepted synthetic API responses only.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const server = await createServer({define:{'import.meta.env.VITE_USE_MOCK':JSON.stringify('false')},server:{host:'127.0.0.1',port:4215,strictPort:true}});
await server.listen();
const base='http://127.0.0.1:4215', output='artifacts/ux-polish';
await mkdir(output,{recursive:true});
let browser;
const journals=[{id:1,name:'Main account',currency:'USD',starting_capital:'10000',journalType:'trading',break_even_method:'ratio',break_even_value:'0'},{id:2,name:'Strategy backtest',currency:'USD',starting_capital:'25000',journalType:'backtest',break_even_method:'ratio',break_even_value:'0'}];
const rows=Array.from({length:48},(_,i)=>{
 const r=i%7===0?0:i%3===0?-1:1.5,date=new Date();date.setUTCDate(date.getUTCDate()-i);date.setUTCHours(10,15,0,0);
 return {id:i+1,asset:{id:i%3+1,symbol:['EURUSD','GBPUSD','XAUUSD'][i%3]},side:i%2?'SELL':'BUY',entry_datetime:date.toISOString(),exit_datetime:new Date(+date+3600000).toISOString(),pnl_r:String(r),pnl_amount:String(r*100),risk_amount:'100',risk_percent:'1',capital_basis:'10000',effective_status:r===0?'BE':r>0?'WIN':'LOSS',status:null,setup:{id:1,label:'Breakout'},session:'London',emotions:[{id:1,label:'Calm'}],mistakes:[],screenshots:[],custom_fields:{},notes:'A documented trading decision.',trade_score:8};
});
const openDate=new Date();openDate.setUTCHours(12,15,0,0);
rows.push({...rows[0],id:49,entry_datetime:openDate.toISOString(),exit_datetime:null,pnl_r:null,pnl_amount:null,effective_status:'OPEN'});
try{
 browser=await chromium.launch({headless:true,channel:'chrome'});
 const errors=[],writes=[];
 async function contextFor({empty=false,fail=false,openOnly=false,noTrades=false,...options}={}){
  const context=await browser.newContext({colorScheme:'dark',...options});
  await context.addInitScript(()=>{if(location.protocol.startsWith('http')){localStorage.setItem('access','navigation-test-access');localStorage.setItem('nexora-theme','dark');}});
  context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
  await context.route(url=>url.pathname.startsWith('/api/'),async route=>{
   const request=route.request(),url=new URL(request.url()),path=url.pathname;
   const headers={'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS'};
   const reply=(data,status=200)=>route.fulfill({json:data,status,headers});
   if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
   if(request.method()!=='GET')writes.push(path);
   if(path==='/api/auth/me/')return reply({id:1,email:'navigation@example.test',first_name:'Alex',timezone:'UTC',theme:'dark'});
   if(path==='/api/journals/')return reply(empty?[]:journals);
   if(path.endsWith('/trades/')){
    if(fail)return reply({detail:'Temporary test outage'},503);
    const params=Object.fromEntries(url.searchParams),isSecond=path.includes('/2/');
    const source=noTrades?[]:openOnly?[rows.at(-1)]:isSecond?rows.slice(0,12):rows;
    const filtered=source.filter(row=>(!params.search||row.asset.symbol.includes(params.search.toUpperCase()))&&(!params.status||row.effective_status===params.status));
    const size=Number(params.page_size||20),start=(Number(params.page||1)-1)*size;
    return reply({count:filtered.length,results:filtered.slice(start,start+size)});
   }
   if(/\/trades\/\d+\/$/.test(path)){
    const row=rows.find(row=>path.endsWith(`/trades/${row.id}/`))||rows[0];
    if(request.method()==='PATCH'){
     Object.assign(row,request.postDataJSON());row.pnl_amount=String(Number(row.pnl_r)*100);row.effective_status=Number(row.pnl_r)>0?'WIN':Number(row.pnl_r)<0?'LOSS':'BE';
    }
    return reply(row);
   }
   if(path.endsWith('/assets/'))return reply([{id:1,symbol:'EURUSD'},{id:2,symbol:'GBPUSD'},{id:3,symbol:'XAUUSD'}]);
   if(path.endsWith('/emotion-tags/'))return reply([{id:1,label:'Calm'}]);
   if(path.endsWith('/setup-tags/'))return reply([{id:1,label:'Breakout'}]);
   if(path.endsWith('/custom-fields/'))return reply([{id:1,section:'setup',label:'Market condition',field_type:'text',options:[]}]);
   return reply([]);
  });
  return context;
 }
 const context=await contextFor({viewport:{width:1440,height:1000}}),page=await context.newPage();
 await page.goto(`${base}/journal/1?tab=overview`);await page.getByText('Trade status',{exact:true}).waitFor();
 await page.keyboard.press('Control+k');
 const dialog=page.getByRole('dialog',{name:'Quick navigation',exact:true});await dialog.waitFor();
 await page.getByLabel('Find a section',{exact:true}).fill('zzzz');await page.getByText('No sections found',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Clear search',exact:true}).click();
 await page.getByLabel('Find a section',{exact:true}).fill('ana');await page.keyboard.press('ArrowDown');
 assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Analytics');
 await page.keyboard.press('Enter');await page.waitForURL(/tab=analytics/);await dialog.waitFor({state:'hidden'});
 await page.getByRole('button',{name:'Quick navigation',exact:true}).click();await dialog.waitFor();
 await page.screenshot({path:`${output}/quick-navigation.png`});
 await page.keyboard.press('Escape');assert.equal(await page.getByRole('button',{name:'Quick navigation',exact:true}).evaluate(el=>el===document.activeElement),true);
 await page.locator('#app-navigation').getByRole('link',{name:'Journal',exact:true}).click();
 const search=page.getByLabel('Search assets',{exact:true});await search.fill('UNKNOWN');
 await page.getByText('No trades match your filters',{exact:true}).waitFor();
 await page.keyboard.press('Control+k');assert.equal(await dialog.count(),0,'Editing shortcuts must not open navigation');
 await page.getByRole('group',{name:'Trade status',exact:true}).getByRole('button',{name:'Wins',exact:true}).click();
 await page.screenshot({path:`${output}/filtered-empty.png`});
 await page.getByRole('button',{name:'Reset filters',exact:true}).click();
 assert.equal(await search.inputValue(),'');
 assert.equal(await page.getByRole('group',{name:'Trade status',exact:true}).getByRole('button',{name:'All',exact:true}).getAttribute('aria-pressed'),'true');
 await page.getByRole('row',{name:'Open trade 1',exact:true}).waitFor();
 assert.equal(await search.evaluate(el=>el===document.activeElement),true);
 // Reset also cancels a search that has not yet finished debouncing.
 await page.getByRole('group',{name:'Trade status',exact:true}).getByRole('button',{name:'Wins',exact:true}).click();
 await search.fill('EURUSD');await page.getByRole('button',{name:'Clear filters',exact:true}).click();await page.waitForTimeout(500);
 assert.equal(await search.inputValue(),'');assert.equal(await page.getByText('Filtered by',{exact:true}).count(),0);
 await page.setViewportSize({width:390,height:844});
 await search.fill('ZZZ');await page.getByText('No trades match your filters',{exact:true}).waitFor();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:`${output}/filtered-mobile.png`});
 await page.getByRole('button',{name:'Open navigation',exact:true}).click();
 await page.keyboard.press('Control+k');assert.equal(await dialog.count(),0,'Quick navigation must not compete with the mobile drawer focus trap');
 await context.close();
 const empty=await contextFor({noTrades:true,viewport:{width:390,height:844}}),emptyPage=await empty.newPage();
 await emptyPage.goto(`${base}/journal/1?tab=trades`);await emptyPage.getByText('No trades yet',{exact:true}).waitFor();
 await emptyPage.screenshot({path:`${output}/first-trade.png`});
 await emptyPage.getByRole('button',{name:'Log your first trade',exact:true}).click();await emptyPage.getByRole('button',{name:'Save Trade',exact:true}).waitFor();
 await emptyPage.getByRole('button',{name:'Cancel',exact:true}).click();await empty.close();
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 console.log('PASS: quick navigation shortcut/search/keyboard/Escape focus; no shortcut hijacking in inputs; reset filters cancels debounce and restores focus; mobile layout; first-trade CTA; zero API writes.');
}finally{await browser?.close();await server.close();}
