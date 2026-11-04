// Real auth provider and HTTP interceptors; no live accounts or API writes.
import assert from 'node:assert/strict';
import {preview} from 'vite';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=await preview({preview:{host:'127.0.0.1',port:4197,strictPort:true}});
let browser;
const user={id:1,email:'session@example.test',first_name:'Session',last_name:'Test',timezone:'UTC'};
try {
 browser=await chromium.launch({headless:true,channel:'chrome'});
 async function scenario(tokens,handler,check){
  const context=await browser.newContext();
  await context.addInitScript(tokens=>{for(const [key,value] of Object.entries(tokens))localStorage.setItem(key,value);},tokens);
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
 let offline=true;
 await scenario({access:'saved',refresh:'saved-refresh'},async({route,path})=>{
  if(path==='/api/auth/me/'&&offline){await route.abort('failed');return true;}
 },async page=>{
  await page.getByRole('heading',{name:'Unable to restore your session'}).waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('access')),'saved');
  offline=false;await page.getByRole('button',{name:'Try again',exact:true}).click();
  await page.getByRole('heading',{name:'Welcome, Session!'}).waitFor();
 });
 await scenario({access:'expired',refresh:'valid'},async({path,reply})=>{
  if(path==='/api/auth/me/'){await reply(401,{});return true;}
  if(path==='/api/auth/refresh/')return true; // Intentionally never reply: exercise the real timeout.
 },async page=>{
  await page.getByRole('heading',{name:'Unable to restore your session'}).waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('refresh')),'valid');
  await page.getByRole('button',{name:'Back to sign in',exact:true}).click();
  await page.getByRole('button',{name:'Sign in',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('refresh')),null);
 });
 await scenario({access:'expired',refresh:'valid'},async({path,reply})=>{
  if(path==='/api/auth/me/'){await reply(401,{});return true;}
  if(path==='/api/auth/refresh/'){await reply(200,{access:'still-invalid',refresh:'rotated'});return true;}
 },async page=>{await page.getByText('Your session has expired. Please sign in again to continue.',{exact:true}).waitFor();});
 console.log('PASS: expired refresh, missing refresh, silent refresh with rotation, network recovery, stalled refresh timeout, rejected renewed token.');
}finally{await browser?.close();await new Promise(resolve=>server.httpServer.close(resolve));}
