import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=await createServer({server:{host:'127.0.0.1',port:4208,strictPort:true}});await server.listen();let browser;
try {
 browser=await chromium.launch({headless:true,channel:'chrome'});
 const context=await browser.newContext({viewport:{width:390,height:900},hasTouch:true,isMobile:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:4208/tests/trade-form.html?edit=1';await page.goto(url);
 async function manage(field){await page.getByRole('button',{name:'Manage '+field,exact:true}).click();return page.getByRole('dialog',{name:'Manage '+(field.includes('TF')?'Timeframes':field),exact:true});}
 for(const field of ['Reference TF','Opportunity TF','Entry TF','Trend','Session'])assert.equal(await page.getByRole('button',{name:'Manage '+field,exact:true}).count(),1);
 assert.equal(await page.getByRole('button',{name:'Manage Trade score',exact:true}).count(),0);
 // Done must dismiss only the manager for touch, mouse and keyboard interaction.
 // Keep a draft-only value through repeated closes, then verify it reaches Save.
 await page.getByRole('button',{name:'Reference TF',exact:true}).click();
 await page.getByRole('button',{name:'Select W1',exact:true}).click();
 for(const width of [320,390,1280]){
  await page.setViewportSize({width,height:900});
  for(const field of ['Reference TF','Opportunity TF','Entry TF','Trend','Session']){
   const manager=await manage(field),done=manager.getByRole('button',{name:'Done',exact:true});
   if(width===1280)await done.click();else await done.tap();
   await manager.waitFor({state:'hidden'});
   await page.getByRole('button',{name:'Save Trade',exact:true}).waitFor();
   assert.match(await page.getByRole('button',{name:'Reference TF',exact:true}).innerText(),/W1/,'Done must preserve unsaved trade edits');
   assert.equal(await page.evaluate(()=>window.__tradeSaves),0,'Done must not save the trade');
  }
 }
 const keyboardManager=await manage('Session');
 await keyboardManager.getByRole('button',{name:'Done',exact:true}).focus();await page.keyboard.press('Enter');
 await keyboardManager.waitFor({state:'hidden'});await page.getByRole('button',{name:'Save Trade',exact:true}).waitFor();
 await page.setViewportSize({width:390,height:900});

 let dialog=await manage('Reference TF');await dialog.getByLabel('New option',{exact:true}).fill('M45');await dialog.getByRole('button',{name:'Add',exact:true}).click();assert.equal(await page.evaluate(()=>window.__tradeSaves),0);await dialog.getByRole('button',{name:'Done',exact:true}).tap();
 await page.getByRole('button',{name:'Entry TF',exact:true}).click();await page.getByRole('button',{name:'Favorite M45',exact:true}).click();const star=page.getByRole('button',{name:'Favorite M45',exact:true});assert.equal(await star.evaluate(e=>getComputedStyle(e).color),'rgb(250, 204, 21)');await page.getByRole('button',{name:'Select M45',exact:true}).click();
 assert.equal(await page.getByRole('group',{name:'Reference TF favorites',exact:true}).count(),0);
 await page.getByRole('button',{name:'Reference TF',exact:true}).click();await page.getByRole('button',{name:'Favorite M45',exact:true}).click();await page.getByRole('button',{name:'Select M45',exact:true}).click();
 dialog=await manage('Opportunity TF');await dialog.getByRole('button',{name:'Remove M45',exact:true}).click();await dialog.getByRole('button',{name:'Done',exact:true}).tap();assert.match(await page.getByRole('button',{name:'Reference TF',exact:true}).innerText(),/M45/);assert.equal(await page.getByRole('group',{name:'Reference TF favorites',exact:true}).count(),0);
 dialog=await manage('Trend');await dialog.getByLabel('New option',{exact:true}).fill('Neutral');await dialog.getByRole('button',{name:'Add',exact:true}).click();await dialog.getByRole('button',{name:'Remove Bullish',exact:true}).click();await dialog.getByRole('button',{name:'Done',exact:true}).tap();
 await page.getByRole('combobox',{name:'Trend',exact:true}).click();assert.equal(await page.getByRole('option',{name:'Bullish',exact:true}).count(),0);await page.getByRole('option',{name:'Neutral',exact:true}).click();
 dialog=await manage('Session');await dialog.getByLabel('New option',{exact:true}).fill('After hours');await dialog.getByRole('button',{name:'Add',exact:true}).click();await dialog.getByRole('button',{name:'Done',exact:true}).tap();await page.getByRole('combobox',{name:'Session',exact:true}).click();await page.getByRole('option',{name:'After hours',exact:true}).click();
 await page.getByRole('button',{name:'Star rating',exact:true}).click();await page.getByRole('slider',{name:'Trade quality stars',exact:true}).fill('2.5');
 await mkdir('artifacts/setup-options',{recursive:true});
 for(const width of [320,390,1280]){
  await page.setViewportSize({width,height:900});const stars=page.getByRole('group',{name:'Star rating',exact:true});await stars.scrollIntoViewIfNeeded();
  const geometry=await stars.locator('[data-rating-star]').evaluateAll(elements=>elements.map(e=>{const outline=e.querySelector('svg').getBoundingClientRect(),fill=e.querySelector('[data-rating-fill] svg').getBoundingClientRect();return {x:Math.abs(outline.x-fill.x),y:Math.abs(outline.y-fill.y),width:e.querySelector('[data-rating-fill]').getBoundingClientRect().width,outlineWidth:outline.width};}));
  for(const g of geometry){assert.ok(g.x<.1&&g.y<.1,'Rating fill must overlay its original star');assert.equal(g.outlineWidth,16);}
  assert.deepEqual(geometry.map(g=>g.width),[16,16,8,0,0]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:`artifacts/setup-options/rating-${width}.png`});
 }
 await page.getByRole('button',{name:'Save Trade',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});const payload=await page.evaluate(()=>window.__tradePayload);assert.equal(payload.reference_timeframe,'M45');assert.equal(payload.entry_timeframe,'M45');assert.equal(payload.trend_direction,'Neutral');assert.equal(payload.session,'After hours');assert.equal(payload.trade_score,5);
 await page.reload();await page.getByRole('button',{name:'Manage Trend',exact:true}).waitFor();dialog=await manage('Trend');await dialog.getByText('Neutral',{exact:true}).waitFor();await dialog.getByRole('button',{name:'Restore defaults',exact:true}).click();assert.equal(await dialog.getByText('Neutral',{exact:true}).count(),0);await dialog.getByText('Bullish',{exact:true}).waitFor();await dialog.getByRole('button',{name:'Done',exact:true}).tap();
 assert.deepEqual(errors,[]);console.log('PASS: all Setup managers except score, custom options/save payload, removal without clearing trade values, yellow favorites, persistence/restore, aligned fractional stars on touch at 320/390/1280px.');
} finally {await browser?.close();await server.close();}
