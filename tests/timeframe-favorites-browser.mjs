import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=await createServer({server:{host:'127.0.0.1',port:4207,strictPort:true}});await server.listen();let browser;
try {
 browser=await chromium.launch({headless:true,channel:'chrome'});
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:4207/tests/trade-form.html?edit=1';
 await page.goto(url);
 const trigger=page.getByRole('button',{name:'Reference TF',exact:true});await trigger.waitFor();
 assert.equal(await page.getByRole('group',{name:'Reference TF favorites',exact:true}).count(),0);
 await trigger.click();const chooser=page.getByRole('dialog',{name:'Reference TF options',exact:true});await chooser.waitFor();
 for(const tf of ['H4','M5'])await chooser.getByRole('button',{name:'Favorite '+tf,exact:true}).click();
 assert.equal(await chooser.isVisible(),true,'Starring must keep the chooser open');
 assert.match(await trigger.innerText(),/D1/,'Starring must not change the trade value');
 assert.equal(await page.evaluate(()=>window.__tradeSaves),0,'Starring must not submit the trade');
 await page.keyboard.press('Escape');
 for(const field of ['Reference TF','Opportunity TF','Entry TF']){
  const favorites=page.getByRole('group',{name:field+' favorites',exact:true});
  assert.deepEqual(await favorites.getByRole('button').allTextContents(),['M5','H4']);
 }
 const shortcuts=page.getByRole('group',{name:'Reference TF favorites',exact:true});
 await shortcuts.getByRole('button',{name:'M5',exact:true}).click();
 assert.match(await trigger.innerText(),/M5/);assert.equal(await shortcuts.getByRole('button',{name:'M5',exact:true}).getAttribute('aria-pressed'),'true');
 await page.getByRole('group',{name:'Entry TF favorites',exact:true}).getByRole('button',{name:'H4',exact:true}).click();
 await trigger.click();await chooser.getByRole('button',{name:'Select W1',exact:true}).click();assert.match(await trigger.innerText(),/W1/,'Non-favorites must remain selectable');
 await page.getByRole('button',{name:'Save Trade',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 const payload=await page.evaluate(()=>window.__tradePayload);assert.equal(payload.reference_timeframe,'W1');assert.equal(payload.entry_timeframe,'H4');
 await page.getByRole('button',{name:'Edit saved trade',exact:true}).click();
 await trigger.click();await chooser.getByRole('button',{name:'Favorite H4',exact:true}).click();await page.keyboard.press('Escape');
 assert.deepEqual(await shortcuts.getByRole('button').allTextContents(),['M5']);
 assert.match(await page.getByRole('button',{name:'Entry TF',exact:true}).innerText(),/H4/,'Removing a favorite must preserve selected trade values');
 await page.reload();await trigger.waitFor();await shortcuts.getByRole('button',{name:'M5',exact:true}).waitFor();
 const second=await context.newPage();await second.goto(url);await second.getByRole('button',{name:'Reference TF',exact:true}).click();
 await second.getByRole('button',{name:'Favorite M15',exact:true}).click();
 await shortcuts.getByRole('button',{name:'M15',exact:true}).waitFor();await second.close();
 await mkdir('artifacts/timeframe-favorites',{recursive:true});
 for(const width of [1280,390,320]){
  await page.setViewportSize({width,height:900});await trigger.click();await chooser.waitFor();
  const box=await chooser.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1,`Chooser overflows at ${width}`);
  await page.screenshot({path:`artifacts/timeframe-favorites/chooser-${width}.png`});
  if(width===1280) await page.screenshot({path:'artifacts/timeframe-favorites/preview.png',clip:{x:720,y:300,width:560,height:600}});await page.keyboard.press('Escape');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await shortcuts.getByRole('button',{name:'M15',exact:true}).focus();await page.keyboard.press('Enter');assert.match(await trigger.innerText(),/M15/);
 }
 // Invalid preferences and unavailable storage must not block the trade form.
 await page.evaluate(()=>localStorage.setItem('nexora_timeframe_favorites:browser','not JSON'));
 await page.reload();await trigger.waitFor();assert.equal(await shortcuts.count(),0);
 const blocked=await browser.newContext();await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('blocked')};Storage.prototype.setItem=()=>{throw Error('blocked')};});
 const fallback=await blocked.newPage();await fallback.goto(url);await fallback.getByRole('button',{name:'Reference TF',exact:true}).click();await fallback.getByRole('button',{name:'Favorite H1',exact:true}).click();await fallback.keyboard.press('Escape');await fallback.getByRole('group',{name:'Entry TF favorites',exact:true}).getByRole('button',{name:'H1',exact:true}).click();assert.match(await fallback.getByRole('button',{name:'Entry TF',exact:true}).innerText(),/H1/);await blocked.close();
 assert.deepEqual(errors,[]);console.log('PASS: stars, shared shortcuts, unchanged trade values, save payload, persistence, cross-tab sync, keyboard, 320/390/1280 layouts, malformed/unavailable storage.');
} finally {await browser?.close();await server.close();}
