// Real app/providers and routes; intercepted synthetic API responses only.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const server = await createServer({define:{'import.meta.env.VITE_USE_MOCK':JSON.stringify('false')},server:{host:'127.0.0.1',port:4214,strictPort:true}});
await server.listen();
const base='http://127.0.0.1:4214', output='artifacts/uniform-style';
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
 for(const theme of ['dark','light']) {
  const context=await contextFor({viewport:{width:1440,height:1000}});
  await context.addInitScript(value=>{if(location.protocol.startsWith('http'))localStorage.setItem('nexora-theme',value);},theme);
  const page=await context.newPage();
  await page.goto(`${base}/journal/1?tab=overview`);await page.getByText('Trade status',{exact:true}).waitFor();
  const tokens=await page.evaluate(()=>({root:getComputedStyle(document.documentElement).getPropertyValue('--card').trim(),shell:getComputedStyle(document.querySelector('.nx-shell')).getPropertyValue('--card').trim()}));
  assert.equal(tokens.root,tokens.shell,'Portals and workspace must inherit the same palette');
  const capture=async name=>{await page.waitForTimeout(450);await page.screenshot({path:`${output}/${theme}-${name}.png`});};
  await capture('overview');
  await page.getByRole('button',{name:'Journal settings',exact:true}).click();
  const menu=page.getByRole('menu');await menu.waitFor();
  assert.equal(await menu.evaluate(el=>getComputedStyle(el).getPropertyValue('--card').trim()),tokens.root);
  await capture('menu');await page.keyboard.press('Escape');
  await page.locator('#app-navigation').getByRole('link',{name:'Journal',exact:true}).click();
  await page.getByRole('button',{name:'New Trade',exact:true}).click();
  const sheet=page.locator('[data-slot="sheet-content"]');await sheet.waitFor();
  assert.equal(await sheet.evaluate(el=>getComputedStyle(el).getPropertyValue('--card').trim()),tokens.root);
  await capture('trade-editor');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.locator('#app-navigation').getByRole('link',{name:'Settings',exact:true}).click();
  await page.getByRole('button',{name:'Edit account settings',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Journal Settings',exact:true});await dialog.waitFor();
  assert.equal(await dialog.evaluate(el=>getComputedStyle(el).getPropertyValue('--card').trim()),tokens.root);
  await capture('settings');await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.goto(`${base}/coach`);await page.getByRole('heading',{name:'AI Coach.',exact:true}).waitFor();await capture('coach');
  await context.close();
  // Public routes use the same palette, including standalone error states.
  const guest=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:theme});
  await guest.addInitScript(value=>{if(location.protocol.startsWith('http'))localStorage.setItem('nexora-theme',value);},theme);
  const publicPage=await guest.newPage();publicPage.on('pageerror',e=>errors.push(e.message));
  for(const route of ['/login','/register','/not-a-page']) {
   await publicPage.goto(base+route);await publicPage.locator('h1, [data-slot="card-title"]').first().waitFor();
   assert.equal(await publicPage.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--card').trim()),tokens.root);
   await publicPage.waitForTimeout(500);await publicPage.screenshot({path:`${output}/${theme}-${route.slice(1)}.png`});
   await publicPage.setViewportSize({width:320,height:844});
   assert.ok(await publicPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Overflow on ${route}/${theme}`);
   await publicPage.screenshot({path:`${output}/${theme}-${route.slice(1)}-mobile.png`});
   await publicPage.setViewportSize({width:1440,height:1000});
  }
  await guest.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 console.log('PASS: shared palette across public routes, workspace, portalled menus, dialogs and trade sheets; 320px public pages; dark/light captures; no API writes or runtime errors.');
}finally{await browser?.close();await server.close();}
