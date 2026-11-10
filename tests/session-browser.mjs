// Real auth provider and HTTP interceptors; no live accounts or API writes.
import assert from 'node:assert/strict';
import {preview} from 'vite';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=await preview({preview:{host:'127.0.0.1',port:4197,strictPort:true}});
let browser;
const user={id:1,email:'session@example.test',first_name:'Session',last_name:'Test',timezone:'UTC'};
try {
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{channel:'chrome'})});
 async function scenario(tokens,handler,check){
  const context=await browser.newContext();
  await context.addInitScript(tokens=>{
   // Seed once per context so reloads exercise the application's persisted
   // session rather than silently restoring credentials after sign-out.
   if(localStorage.getItem('__session_test_seeded'))return;
   for(const [key,value] of Object.entries(tokens))localStorage.setItem(key,value);
   localStorage.setItem('__session_test_seeded','1');
  },tokens);
  const page=await context.newPage();page.setDefaultTimeout(60000);page.on('pageerror',e=>console.log('PAGE ERROR:',e.message));
  await page.route('**/api/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname;
   const headers={'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,OPTIONS'};
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
   const reply=(status,data)=>route.fulfill({status,json:data,headers});
   if(await handler({route,req,path,reply}))return;
   if(path==='/api/auth/me/')return reply(200,user);
   return reply(200,[]);
  });
  try{console.log('Checking session scenario');await page.goto('http://127.0.0.1:4197/dashboard',{waitUntil:'domcontentloaded'});await check(page);console.log('Scenario passed');}
  catch(error){console.log('FAILED PAGE:',page.url(),(await page.locator('body').innerText()).slice(0,1500));throw error;}
  finally{await context.close();}
 }
 await scenario({access:'expired',refresh:'invalid'},async({path,reply})=>{
  if(path==='/api/auth/me/'||path==='/api/auth/refresh/'){await reply(401,{detail:'Expired'});return true;}
 },async page=>{
  await page.getByText('Your session has expired. Please sign in again to continue.',{exact:true}).waitFor();
  assert.match(page.url(),/login\?reason=session-expired/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('access')),null);
 });
 await scenario({access:'expired'},async({path,reply})=>{
  if(path==='/api/auth/me/'){await reply(401,{});return true;}
 },async page=>{await page.getByText('Your session has expired. Please sign in again to continue.',{exact:true}).waitFor();});
 let refreshes=0;
 await scenario({access:'expired',refresh:'valid'},async({path,req,reply})=>{
  if(path==='/api/auth/me/'&&req.headers().authorization!=='Bearer renewed'){await reply(401,{});return true;}
  if(path==='/api/auth/refresh/'){refreshes++;await reply(200,{access:'renewed',refresh:'rotated'});return true;}
 },async page=>{
  await page.getByRole('heading',{name:'Welcome, Session!'}).waitFor();
  assert.equal(refreshes,1);
  assert.equal(await page.evaluate(()=>localStorage.getItem('refresh')),'rotated');
 });
 let attempts=0;
 await scenario({access:'saved',refresh:'saved-refresh'},async({path,reply})=>{
  if(path==='/api/auth/me/' && ++attempts < 3){await reply(503,{});return true;}
 },async page=>{
  await page.getByRole('heading',{name:'Welcome, Session!'}).waitFor();
  assert.equal(attempts,3);
  assert.equal(await page.getByText('Reconnecting to your account…',{exact:true}).count(),0);
  assert.equal(await page.evaluate(()=>localStorage.getItem('refresh')),'saved-refresh');
  await page.reload();
  await page.getByRole('heading',{name:'Welcome, Session!'}).waitFor();
 });
 await scenario({},async({path,reply})=>{
  if(path==='/api/auth/login/'){
   attempts++;
   await reply(attempts===1?503:200,attempts===1?{}:{access:'new',refresh:'new-refresh',user});return true;
  }
 },async page=>{
  attempts=0;
  await page.getByLabel('Email',{exact:true}).fill('session@example.test');
  await page.getByLabel('Password',{exact:true}).fill('Example123!');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByRole('heading',{name:'Welcome, Session!'}).waitFor();
  assert.equal(attempts,2);
 });
 let offline=true, checks=0;
 await scenario({access:'saved',refresh:'saved-refresh',nexora_session_user:JSON.stringify(user)},async({route,path,reply})=>{
  if(path==='/api/auth/me/'){
   checks++;
   if(offline){await route.abort('failed');return true;}
   await reply(200,{...user,first_name:'Restored'});return true;
  }
 },async page=>{
  await page.getByRole('heading',{name:'Welcome, Session!'}).waitFor();
  await page.waitForFunction(()=>localStorage.getItem('access')==='saved');
  // Exhaust the short request retries while the saved account stays visible.
  await new Promise(resolve=>setTimeout(resolve,2500));
  assert.ok(checks>=3);
  await page.getByRole('heading',{name:'Welcome, Session!'}).waitFor();
  assert.equal(await page.getByRole('alert').count(),0);
  offline=false;
  // No button or user action is needed for background recovery.
  await page.getByRole('heading',{name:'Welcome, Restored!'}).waitFor();
  assert.equal(JSON.parse(await page.evaluate(()=>localStorage.getItem('nexora_session_user'))).first_name,'Restored');
 });
 let refreshAttempts=0;
 await scenario({access:'expired',refresh:'valid',nexora_session_user:JSON.stringify(user)},async({path,reply})=>{
  if(path==='/api/auth/me/'){await reply(401,{});return true;}
  if(path==='/api/auth/refresh/'){refreshAttempts++;return true;}
 },async page=>{
  await page.getByRole('heading',{name:'Welcome, Session!'}).waitFor();
  // Verify timeout recovery remains invisible through a complete retry cycle.
  const deadline=Date.now()+55000;
  while(refreshAttempts<4 && Date.now()<deadline) await new Promise(resolve=>setTimeout(resolve,500));
  assert.ok(refreshAttempts>=4);
  await page.getByRole('heading',{name:'Welcome, Session!'}).waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('refresh')),'valid');
  assert.equal(await page.getByRole('alert').count(),0);
 });
 await scenario({access:'expired',refresh:'valid'},async({path,reply})=>{
  if(path==='/api/auth/me/'){await reply(401,{});return true;}
  if(path==='/api/auth/refresh/'){await reply(200,{access:'still-invalid',refresh:'rotated'});return true;}
 },async page=>{await page.getByText('Your session has expired. Please sign in again to continue.',{exact:true}).waitFor();});
 await scenario({access:'valid'},async()=>{},async page=>{
  await page.getByRole('heading',{name:'Welcome, Session!'}).waitFor();
  await page.getByRole('button',{name:'Account menu',exact:true}).click();
  await page.getByRole('menuitem',{name:'Sign out',exact:true}).click();
  await page.getByRole('button',{name:'Sign in',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('access')),null);
  assert.equal(await page.evaluate(()=>localStorage.getItem('nexora_session_user')),null);
  await page.reload();
  await page.getByRole('button',{name:'Sign in',exact:true}).waitFor();
 });
 console.log('PASS: access-only logout, expired refresh, missing refresh, silent refresh with rotation, network recovery, stalled refresh timeout, rejected renewed token.');
}finally{await browser?.close();await new Promise(resolve=>server.httpServer.close(resolve));}
