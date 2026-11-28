// Built frontend with API stubs only; no live accounts or data are changed.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {preview} from 'vite';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const origin='http://127.0.0.1:4186';
const server=await preview({preview:{host:'127.0.0.1',port:4186,strictPort:true}});
let browser;
try {
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{channel:'chrome'})});
 await mkdir('artifacts/design',{recursive:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light'});
 const errors=[], mutations=[];
 let signedIn=false;
 context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 await context.route('**/api/**',route=>{
  const req=route.request(),path=new URL(req.url()).pathname;
  if(req.method()!=='GET')mutations.push(path);
  if(path.includes('/auth/me/')||path.includes('/auth/refresh/'))return route.fulfill(signedIn?{json:{id:72,email:'design@example.test',first_name:'Design',timezone:'UTC'}}:{status:401,json:{detail:'Not authenticated'}});
  return route.fulfill({json:path==='/api/journals/'?[{id:7,name:'Design journal',journalType:'trading',startingCapital:10000,currency:'USD'}]:[]});
 });
 const page=await context.newPage();page.setDefaultTimeout(15000);
 const choose=async(target,label)=>{await target.getByRole('button',{name:'Theme',exact:true}).click();await target.getByRole('menuitemradio',{name:label,exact:true}).click();};
 const design=async(target,value)=>target.waitForFunction(value=>document.documentElement.dataset.design===value,value);
 await page.goto(origin);await design(page,'3d');await page.locator('.nx-immersive-scene').waitFor();
 await choose(page,'Classic');await design(page,'classic');
 const classic=await page.locator('h1').evaluate(el=>({size:getComputedStyle(el).fontSize,color:getComputedStyle(el).color}));
 assert.equal(await page.locator('.nx-immersive-scene').count(),0);
 await choose(page,'Graphite');await design(page,'3d');await page.locator('.nx-immersive-scene').waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('nexora-design')),'3d');
 await page.getByRole('button',{name:'Pause animation',exact:true}).click();
 assert.equal(await page.locator('.nx-immersive-scene').getAttribute('data-running'),'false');
 await page.screenshot({animations:'disabled',path:'artifacts/design/landing-3d.png'});
 await choose(page,'Dark');assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('dark')),true);
 assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--background').trim()),'225 22% 5%');
 await design(page,'3d');await page.reload();await design(page,'3d');await page.locator('.nx-immersive-scene').waitFor();
 const second=await context.newPage();await second.goto(origin);await design(second,'3d');
 await choose(page,'Classic');await design(second,'classic');await choose(page,'Light');
 await page.locator('.nx-immersive-scene').waitFor({state:'detached'});
 assert.deepEqual(await page.locator('h1').evaluate(el=>({size:getComputedStyle(el).fontSize,color:getComputedStyle(el).color})),classic,'Classic styling is restored after switching back');
 await page.screenshot({animations:'disabled',path:'artifacts/design/landing-classic.png'});
 await page.reload();await design(page,'classic');assert.equal(await page.locator('.nx-immersive-scene').count(),0,'saved Classic choice survives reload');
 // Switching design does not remount a sign-in form or clear its values.
 await page.goto(origin+'/login');await page.getByLabel('Email',{exact:true}).fill('draft@example.test');
 await page.getByLabel('Password',{exact:true}).fill('Unsubmitted-draft-123!');
 await choose(page,'Graphite');assert.equal(await page.getByLabel('Email',{exact:true}).inputValue(),'draft@example.test');assert.equal(await page.getByLabel('Password',{exact:true}).inputValue(),'Unsubmitted-draft-123!');
 await choose(page,'Classic');assert.equal(await page.getByLabel('Email',{exact:true}).inputValue(),'draft@example.test');
 // Reduced motion and mobile access both work with the original 3D scene.
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto(origin);await choose(page,'Graphite');
 await page.locator('.nx-immersive-scene').waitFor();
 assert.equal(await page.locator('.nx-immersive-scene').getAttribute('data-running'),'false');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.equal(await page.locator('.nx-orbit-system').evaluate(el=>getComputedStyle(el).animationName),'none');
 await page.screenshot({animations:'disabled',path:'artifacts/design/mobile-3d.png'});
 // Verified account routes keep the same data, form state and portal theme.
 signedIn=true;await page.setViewportSize({width:1440,height:1000});await page.goto(origin+'/dashboard');
 await page.getByRole('heading',{name:'Trading accounts',exact:true}).waitFor();await page.locator('.nx-depth-scene').waitFor();
 await page.getByRole('button',{name:'Theme',exact:true}).click();assert.equal(await page.getByRole('menuitemradio',{name:'Graphite',exact:true}).getAttribute('aria-checked'),'true');await page.keyboard.press('Escape');
 await page.screenshot({animations:'disabled',path:'artifacts/design/dashboard-3d.png'});
 await choose(page,'Classic');assert.equal(await page.locator('.nx-depth-scene').count(),0);assert.equal(await page.getByRole('button',{name:'Design journal',exact:true}).count(),1);
 await page.getByRole('button',{name:'New Journal',exact:true}).last().click();
 const dialog=page.getByRole('dialog');await dialog.waitFor();
 const input=dialog.locator('input').first();await input.fill('Keep this draft');
 await choose(second,'Graphite');await design(page,'3d');assert.equal(await input.inputValue(),'Keep this draft');
 assert.equal(await dialog.evaluate(el=>getComputedStyle(el).backgroundImage!=='none'),true,'body-mounted dialog receives 3D styling');
 await choose(second,'Classic');await design(page,'classic');assert.equal(await input.inputValue(),'Keep this draft');
 assert.deepEqual(mutations.filter(path=>path!=='/api/auth/refresh/'),[],'design changes never write account or trade data');assert.deepEqual(errors,[]);
 await context.close();
 // Invalid or unavailable storage still permits an in-memory design choice.
 for(const blocked of [false,true]){
  const c=await browser.newContext();await c.addInitScript(blocked=>{if(blocked){Storage.prototype.getItem=()=>{throw Error('Unavailable')};Storage.prototype.setItem=()=>{throw Error('Unavailable')};}else localStorage.setItem('nexora-design','invalid');},blocked);
  await c.route('**/api/**',r=>r.fulfill({status:401,json:{detail:'Not authenticated'}}));const p=await c.newPage();await p.goto(origin);await design(p,'3d');await p.locator('.nx-immersive-scene').waitFor();await choose(p,'Classic');await design(p,'classic');await choose(p,'Graphite');await p.locator('.nx-immersive-scene').waitFor();await c.close();
 }
 console.log('PASS: Classic/3D switching, color modes, reload, cross-tab sync, mobile, reduced motion, draft retention, portal styling and unavailable storage.');
} finally {await browser?.close();await server.close();}
