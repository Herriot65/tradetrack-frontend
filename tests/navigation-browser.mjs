// Real app/providers and routes; intercepted synthetic API responses only.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const server = await createServer({define:{'import.meta.env.VITE_USE_MOCK':JSON.stringify('false')},server:{host:'127.0.0.1',port:4212,strictPort:true}});
await server.listen();
const base='http://127.0.0.1:4212', output='artifacts/navigation';
await mkdir(output,{recursive:true});
let browser;
const journals=[{id:1,name:'Main account',currency:'USD',starting_capital:'10000',journalType:'trading',break_even_method:'ratio',break_even_value:'0'},{id:2,name:'Strategy backtest',currency:'USD',starting_capital:'25000',journalType:'backtest',break_even_method:'ratio',break_even_value:'0'}];
const rows=Array.from({length:48},(_,i)=>{
 const r=i%7===0?0:i%3===0?-1:1.5,date=new Date();date.setUTCDate(date.getUTCDate()-i);date.setUTCHours(10,15,0,0);
 return {id:i+1,asset:{id:i%3+1,symbol:['EURUSD','GBPUSD','XAUUSD'][i%3]},side:i%2?'SELL':'BUY',entry_datetime:date.toISOString(),exit_datetime:new Date(+date+3600000).toISOString(),pnl_r:String(r),pnl_amount:String(r*100),risk_amount:'100',risk_percent:'1',capital_basis:'10000',effective_status:r===0?'BE':r>0?'WIN':'LOSS',status:null,setup:{id:1,label:'Breakout'},session:'London',emotions:[{id:1,label:'Calm'}],mistakes:[],screenshots:[],custom_fields:{},notes:'A documented trading decision.',trade_score:8};
});
try{
 browser=await chromium.launch({headless:true,channel:'chrome'});
 const errors=[],writes=[];
 async function contextFor({empty=false,fail=false,...options}={}){
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
    const source=isSecond?rows.slice(0,12):rows;
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
 const context=await contextFor({viewport:{width:1440,height:1050}}),page=await context.newPage();
 const main=page.locator('#main-content'),nav=page.getByRole('navigation',{name:'Main sections',exact:true});
 const go=async name=>{await page.locator('#app-navigation').getByRole('link',{name,exact:true}).click();await main.getByRole('heading',{name,exact:true,level:1}).waitFor();};
 const capture=async name=>{await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`${output}/${name}.png`,fullPage:false});};
 await page.goto(`${base}/journal/1?tab=overview`);await main.getByText('Performance summary',{exact:true}).waitFor();
 assert.equal(await nav.getByRole('link').count(),3);
 assert.equal(await main.getByRole('navigation').count(),0,'Overview has no unrelated local tabs');
 assert.equal(await main.getByRole('heading',{name:'Win / loss',exact:true}).count(),0,'Overview stays compact without detailed donut charts');
 await capture('overview-desktop');
 await go('Analytics');await main.getByRole('navigation',{name:'Analytics sections'}).waitFor();
 await main.getByRole('group',{name:'Date range',exact:true}).getByRole('button',{name:'All',exact:true}).click();
 await main.getByRole('group',{name:'Display unit',exact:true}).getByRole('button',{name:'$',exact:true}).click();
 await main.getByRole('button',{name:'Breakdown',exact:true}).click();await page.waitForURL(/tab=breakdown/);await main.getByRole('heading',{name:'Breakdown',exact:true}).waitFor();
 assert.match(page.url(),/tab=breakdown/);
 await main.getByRole('button',{name:'Performance',exact:true}).click();
 assert.equal(await main.getByRole('group',{name:'Date range',exact:true}).getByRole('button',{name:'All',exact:true}).getAttribute('aria-pressed'),'true');
 assert.equal(await main.getByRole('group',{name:'Display unit',exact:true}).getByRole('button',{name:'$',exact:true}).getAttribute('aria-pressed'),'true');
 await main.locator('[data-testid="analytics-kpis"]:visible').waitFor();await capture('analytics-desktop');
 await go('Journal');await main.getByLabel('Search assets',{exact:true}).fill('GBPUSD');
 await go('Analytics');await go('Journal');assert.equal(await main.getByLabel('Search assets',{exact:true}).inputValue(),'GBPUSD');
 await main.getByLabel('Search assets',{exact:true}).fill('');await capture('journal-desktop');
 await main.getByRole('button',{name:'New Trade',exact:true}).click();await page.locator('[data-slot="sheet-content"]').waitFor();
 await page.getByRole('button',{name:'Manage Reference TF',exact:true}).click();await page.getByRole('dialog',{name:'Manage Timeframes',exact:true}).getByRole('button',{name:'Done',exact:true}).click();
 await page.getByRole('button',{name:'Save Trade',exact:true}).waitFor();await page.getByRole('button',{name:'Cancel',exact:true}).click();
 // Saving a trade must update mounted Overview/Analytics without resetting their filters.
 await main.getByRole('row',{name:'Open trade 1',exact:true}).click();
 await page.getByRole('spinbutton',{name:'PnL (R)',exact:true}).fill('2');
 await page.getByRole('button',{name:'Save Trade',exact:true}).click();await page.locator('[data-slot="sheet-content"]').waitFor({state:'hidden'});
 await go('Overview');await main.locator('[data-testid="analytics-kpis"]:visible').getByText('+31.00R',{exact:true}).waitFor();
 await go('Analytics');await main.locator('[data-testid="analytics-kpis"]:visible .analytics-hero-grid').getByText('+$3,100',{exact:true}).waitFor();
 await go('Settings');await main.getByRole('button',{name:'Custom Fields',exact:true}).click();await main.getByText('Market condition',{exact:true}).waitFor();await capture('custom-fields-desktop');
 await main.getByRole('button',{name:'Account',exact:true}).click();await main.getByRole('button',{name:'Edit account settings',exact:true}).click();await page.getByRole('dialog',{name:'Journal Settings',exact:true}).getByRole('button',{name:'Cancel',exact:true}).click();
 await main.getByRole('button',{name:'Import MT5 Report',exact:true}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');
 await capture('settings-desktop');
 await go('Analytics');await main.getByRole('button',{name:'Breakdown',exact:true}).click();await page.waitForURL(/tab=breakdown/);await main.getByRole('heading',{name:'Breakdown',exact:true}).waitFor();
 await page.getByRole('button',{name:'Switch journal',exact:true}).click();await page.getByRole('menuitem',{name:'Strategy backtest',exact:true}).click();
 await page.waitForURL(/journal\/2\?tab=breakdown/);
 assert.match(page.url(),/journal\/2\?tab=breakdown/,'Switching account preserves section');
 await page.reload();await main.getByRole('button',{name:'Breakdown',exact:true}).waitFor();assert.match(page.url(),/journal\/2\?tab=breakdown/);
 await page.getByRole('button',{name:'Collapse sidebar',exact:true}).click();
 await page.locator('.nx-shell[data-collapsed="true"]').waitFor();await page.locator('#app-navigation').getByRole('link',{name:'Overview',exact:true}).click();await main.getByText('Performance summary',{exact:true}).waitFor();
 await capture('collapsed-desktop');await page.getByRole('button',{name:'Expand sidebar',exact:true}).click();
 await context.close();
 // Mobile drawer, all destinations, and layouts at narrow widths.
 const mobile=await contextFor({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),touch=await mobile.newPage();
 await touch.goto(`${base}/journal/1?tab=overview`);await touch.getByText('Performance summary',{exact:true}).waitFor();await touch.screenshot({path:`${output}/overview-mobile.png`,fullPage:true});
 for(const width of [320,390,768]){
  await touch.setViewportSize({width,height:844});
  for(const name of ['Overview','Journal','Analytics','Settings']){
   if(width<768){await touch.getByRole('button',{name:'Open navigation',exact:true}).tap();await touch.waitForFunction(()=>document.getElementById('app-navigation').getBoundingClientRect().left>=-1);}
   if(name==='Overview'&&width===390)await touch.screenshot({path:`${output}/drawer-mobile.png`});
   await touch.locator('#app-navigation').getByRole('link',{name,exact:true}).tap();
   await touch.locator('#main-content').getByRole('heading',{name,level:1,exact:true}).waitFor();
   assert.ok(await touch.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name} overflows at ${width}`);
   if(name==='Analytics'){const donut=touch.locator('#main-content .analytics-outcomes-grid:visible'),equity=touch.locator('#main-content .analytics-featured-equity:visible');await donut.waitFor();assert.ok((await donut.boundingBox()).y<(await equity.boundingBox()).y,'Outcome charts must precede equity on narrow layouts');}
   if(width===390)await touch.screenshot({path:`${output}/${name.toLowerCase()}-mobile.png`,fullPage:false});
  }
 }
 await mobile.close();
 const empty=await contextFor({empty:true}),emptyPage=await empty.newPage();await emptyPage.goto(`${base}/dashboard`);await emptyPage.getByRole('heading',{name:'Welcome, Alex!',exact:true}).waitFor();await empty.close();
 const failed=await contextFor({fail:true}),failedPage=await failed.newPage();await failedPage.goto(`${base}/journal/1?tab=overview`);await failedPage.getByRole('alert').getByText('Failed to load analytics',{exact:true}).waitFor();await failed.close();
 assert.deepEqual(writes,['/api/journals/1/trades/1/'],'Only the explicit trade-edit scenario may write to the synthetic API');assert.deepEqual(errors,[]);
 console.log('PASS: real providers/deep links/reload; scalable sidebar/local tabs; account switching; retained analytics and trade filters; collapse/drawer; 320/390/768/1440 layouts; account/custom-field/import controls; trade manager Done; empty/error states. Only one intentional edit to the intercepted test API; no live account access.');
}catch(error){for(const context of browser?.contexts()??[])for(const page of context.pages()){console.log('PAGE',page.url(),(await page.locator('body').innerText()).slice(0,2500));await page.screenshot({path:`${output}/failure.png`});}throw error;}finally{await browser?.close();await server.close();}
