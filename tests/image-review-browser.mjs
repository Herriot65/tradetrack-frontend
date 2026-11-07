import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=await createServer({server:{host:'127.0.0.1',port:4209,strictPort:true}});await server.listen();let browser;
try {
 browser=await chromium.launch({headless:true,channel:'chrome'});
 const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'dark',hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function paste(selector){await page.locator(selector).evaluate(async target=>{
  const canvas=document.createElement('canvas');canvas.width=2400;canvas.height=1350;const ctx=canvas.getContext('2d');ctx.fillStyle='#121b2d';ctx.fillRect(0,0,2400,1350);ctx.strokeStyle='#28344c';for(let y=100;y<1350;y+=150){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(2400,y);ctx.stroke();}ctx.strokeStyle='#5eeab0';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,1200);for(let x=0;x<=2400;x+=40)ctx.lineTo(x,1200-x*.35+Math.sin(x/70)*60);ctx.stroke();ctx.fillStyle='#f4f4f5';ctx.font='48px sans-serif';ctx.fillText('EURUSD · trade plan · complete chart',70,80);ctx.fillText('Entry and risk visible at the far right →',1300,1250);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve));const data=new DataTransfer();data.items.add(new File([blob],'entry-chart.png',{type:'image/png'}));data.items.add(new File([blob],'exit-chart.png',{type:'image/png'}));target.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,clipboardData:data}));
 });}
 await page.goto('http://127.0.0.1:4209/tests/image-review.html');await paste('[role="textbox"][contenteditable]');await page.locator('[data-trade-image] img').nth(1).waitFor();
 assert.equal(await page.locator('[data-trade-image]').count(),2,'Multi-image paste retains every image');
 const figures=page.locator('[data-trade-image]');
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  const sizes=await figures.locator('img').evaluateAll(images=>images.map(i=>({w:i.width,h:i.height,ratio:i.naturalWidth/i.naturalHeight,fit:getComputedStyle(i).objectFit})));for(const size of sizes){assert.ok(Math.abs(size.w/size.h-size.ratio)<.02);assert.equal(size.fit,'contain');assert.ok(size.h>112,'Images should be readable inline, not 112px thumbnails');}
  const a=await figures.nth(0).boundingBox(),b=await figures.nth(1).boundingBox();assert.ok(b.y>=a.y+a.height,'Images stack instead of sharing one small row');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'Review saved trade'}).click();await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'Wide review',exact:true}).click();await page.waitForTimeout(200);assert.ok((await page.getByRole('dialog').boundingBox()).width>1000);
 await mkdir('artifacts/image-review',{recursive:true});await page.locator('[data-slot="sheet-body"]').evaluate(el=>el.scrollTop=el.scrollHeight);await page.screenshot({path:'artifacts/image-review/desktop.png'});
 await page.getByRole('button',{name:/View .*full screen/}).first().click();await page.getByRole('button',{name:'Close image viewer',exact:true}).waitFor();await page.keyboard.press('Escape');await page.getByRole('button',{name:'Close image viewer',exact:true}).waitFor({state:'hidden'});assert.equal(await page.getByRole('dialog').count(),1,'Closing viewer must keep the trade open');await page.keyboard.press('Escape');
 await figures.first().getByRole('button',{name:'Remove entry-chart.png',exact:true}).click();assert.equal(await figures.count(),1);
 // Exercise the actual resizable edit sheet without changing the saved format.
 await page.goto('http://127.0.0.1:4209/tests/trade-form.html?edit=1');await paste('[aria-label^="Notes for Before"][contenteditable]');await page.getByRole('button',{name:'Wide review',exact:true}).scrollIntoViewIfNeeded();await page.getByRole('button',{name:'Wide review',exact:true}).click();await page.waitForTimeout(200);assert.ok((await page.locator('[data-slot="sheet-content"]').boundingBox()).width>1000);
 await page.locator('[data-trade-image]').first().scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/image-review/editor-desktop.png'});await page.setViewportSize({width:390,height:900});await page.locator('[data-trade-image]').first().scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:'artifacts/image-review/editor-mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS: multi-image paste, complete uncropped inline charts, stacked desktop/mobile layouts, wide review, fullscreen keyboard dismissal and image removal.');
} finally {await browser?.close();await server.close();}
