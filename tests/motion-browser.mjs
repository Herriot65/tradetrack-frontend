// Real app/providers and routes; intercepted synthetic API responses only.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const server = await createServer({define:{'import.meta.env.VITE_USE_MOCK':JSON.stringify('false')},server:{host:'127.0.0.1',port:4212,strictPort:true}});
await server.listen();
const base='http://127.0.0.1:4212', output=process.env.MOTION_OUTPUT || 'artifacts/motion';
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
 async function contextFor({empty=false,fail=false,openOnly=false,...options}={}){
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
    const source=openOnly?[rows.at(-1)]:isSecond?rows.slice(0,12):rows;
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
 await page.goto(`${base}/dashboard`);await page.getByRole('heading',{name:'Trading accounts',exact:true}).waitFor();
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(700);
 await page.screenshot({path:`${output}/accounts-desktop.png`});
 await page.goto(`${base}/journal/1?tab=overview`);await page.getByText('Trade status',{exact:true}).waitFor();await page.waitForTimeout(700);
 await page.screenshot({path:`${output}/overview-desktop.png`,fullPage:true});
 // Interactive depth stays on account cards, never on data panels.
 await page.goto(`${base}/dashboard`);await page.getByRole('heading',{name:'Trading accounts',exact:true}).waitFor();
 const card=page.locator('.nx-account-card').first();await card.hover();await page.waitForTimeout(400);
 assert.notEqual(await card.evaluate(el=>getComputedStyle(el).transform),'none');
 await page.screenshot({path:`${output}/accounts-hover.png`});
 await page.mouse.move(0,0);
 await page.getByRole('button',{name:'Main account',exact:true}).click();
 await page.getByText('Trade status',{exact:true}).waitFor();
 await page.locator('#app-navigation').getByRole('link',{name:'Analytics',exact:true}).click();
 await page.getByRole('group',{name:'Date range',exact:true}).getByRole('button',{name:'All',exact:true}).click();
 await page.locator('#app-navigation').getByRole('link',{name:'Overview',exact:true}).click();
 await page.getByText('Trade status',{exact:true}).waitFor();
 await page.locator('#app-navigation').getByRole('link',{name:'Analytics',exact:true}).click();
 assert.equal(await page.getByRole('group',{name:'Date range',exact:true}).getByRole('button',{name:'All',exact:true}).getAttribute('aria-pressed'),'true');
 await page.waitForTimeout(500);await page.screenshot({path:`${output}/analytics-desktop.png`});
 await context.close();
 for(const theme of ['dark','light']) {
  const mobile=await contextFor({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),touch=await mobile.newPage();
  await mobile.addInitScript(value=>localStorage.setItem('nexora-theme',value),theme);
  await touch.goto(`${base}/dashboard`);await touch.getByRole('heading',{name:'Trading accounts',exact:true}).waitFor();
  await touch.waitForTimeout(1000);
  await touch.screenshot({path:`${output}/accounts-mobile-${theme}.png`,fullPage:true});
  for(const width of [320,390,600,768,1024]) {
   await touch.setViewportSize({width,height:844});
   assert.ok(await touch.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Accounts overflow at ${width}`);
   assert.equal(await touch.locator('.nx-account-card').first().evaluate(el=>getComputedStyle(el).transform),'none','Touch must not tilt cards');
   const heading=await touch.getByRole('heading',{name:'Trading accounts',exact:true}).boundingBox();
   const scene=await touch.locator('.nx-depth-scene').boundingBox();
   assert.ok(heading.x+heading.width<=scene.x || heading.y>=scene.y+scene.height || heading.y+heading.height<=scene.y,`Sculpture overlaps heading at ${width}`);
  }
  await touch.setViewportSize({width:390,height:844});
  await touch.goto(`${base}/journal/1?tab=overview`);await touch.getByText('Trade status',{exact:true}).waitFor();await touch.waitForTimeout(500);
  await touch.screenshot({path:`${output}/overview-mobile-${theme}.png`,fullPage:true});
  await mobile.close();
 }
 const reduced=await contextFor({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),quiet=await reduced.newPage();
 await quiet.goto(`${base}/dashboard`);await quiet.getByRole('heading',{name:'Trading accounts',exact:true}).waitFor();
 await quiet.locator('.nx-account-card').first().hover();
 assert.equal(await quiet.locator('.nx-account-card').first().evaluate(el=>getComputedStyle(el).transform),'none');
 assert.equal(await quiet.locator('.nx-depth-stage').evaluate(el=>getComputedStyle(el).animationName),'none');
 assert.equal(await quiet.locator('#main-content').evaluate(el=>el.getAnimations({subtree:true}).length),0);
 await reduced.close();
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 console.log('PASS: screenshots; card hover; stable touch layouts at 320/390/600/768/1024; dark/light; navigation retains filters; reduced motion disables animations; no runtime errors or API writes.');
}finally{await browser?.close();await server.close();}
