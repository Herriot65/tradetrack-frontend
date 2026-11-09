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
 assert.equal(await page.getByRole('button',{name:'Full screen',exact:true}).count(),0,'Image click is the only fullscreen action');
 assert.equal(await page.getByText('entry-chart.png',{exact:true}).count(),0,'Filenames must not consume editor space');
 assert.equal(await figures.first().evaluate(el=>getComputedStyle(el).borderTopWidth),'0px','Images have no separate card border');
 assert.equal(await page.locator('.rich-notes-editor').evaluate(el=>getComputedStyle(el).borderTopWidth),'0px','Text shares the section canvas');
 async function width(name,value){await page.getByRole('button',{name:'Resize '+name,exact:true}).tap();await page.getByRole('slider',{name:'Width of '+name,exact:true}).fill(value);await page.keyboard.press('Escape');}
 for(const viewport of [1440,390,320]){
  await page.setViewportSize({width:viewport,height:1000});await width('entry-chart.png','43');await width('exit-chart.png','43');
  const first=await figures.nth(0).boundingBox(),second=await figures.nth(1).boundingBox();
  assert.ok(Math.abs(first.y-second.y)<1,'Resized screenshots should share a row when they fit');
  assert.ok(second.x>=first.x+first.width,'Resized screenshots must not overlap');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await mkdir('artifacts/image-review',{recursive:true});await figures.first().scrollIntoViewIfNeeded();await page.screenshot({path:`artifacts/image-review/paired-${viewport}.png`});
  if(viewport===390){
   const handle=page.getByRole('button',{name:'Drag to resize exit-chart.png',exact:true});await handle.scrollIntoViewIfNeeded();const hit=await handle.boundingBox();
   await page.mouse.move(hit.x+hit.width/2,hit.y+hit.height/2);await page.mouse.down();await page.mouse.move(hit.x+hit.width/2+65,hit.y+hit.height/2,{steps:6});await page.mouse.up();
   await page.getByRole('button',{name:'Resize exit-chart.png',exact:true}).tap();const resized=Number(await page.getByRole('slider',{name:'Width of exit-chart.png',exact:true}).inputValue());await page.keyboard.press('Escape');
   assert.ok(resized>=60&&resized<75,'Dragging a wrapping image must change width smoothly without jumping to full width');
  }
  await width('entry-chart.png','100');await width('exit-chart.png','100');
 }

 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  const sizes=await figures.locator('img').evaluateAll(images=>images.map(i=>({w:i.width,h:i.height,ratio:i.naturalWidth/i.naturalHeight,fit:getComputedStyle(i).objectFit})));for(const size of sizes){assert.ok(Math.abs(size.w/size.h-size.ratio)<.02);assert.equal(size.fit,'contain');assert.ok(size.h>112,'Images should be readable inline, not 112px thumbnails');}
  const a=await figures.nth(0).boundingBox(),b=await figures.nth(1).boundingBox();assert.ok(b.y>=a.y+a.height,'Images stack instead of sharing one small row');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'Review saved trade'}).click();await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'Wide review',exact:true}).click();await page.waitForTimeout(200);assert.ok((await page.getByRole('dialog').boundingBox()).width>1000);
 await mkdir('artifacts/image-review',{recursive:true});await page.locator('[data-slot="sheet-body"]').evaluate(el=>el.scrollTop=el.scrollHeight);await page.screenshot({path:'artifacts/image-review/desktop.png'});
 await page.getByRole('button',{name:/View .*full screen/}).first().tap();await page.getByRole('button',{name:'Close image viewer',exact:true}).tap();await page.getByRole('button',{name:'Close image viewer',exact:true}).waitFor({state:'hidden'});assert.equal(await page.getByRole('dialog').count(),1,'Touch dismissal must keep the trade open');await page.getByRole('button',{name:/View .*full screen/}).first().tap();await page.getByRole('button',{name:'Close image viewer',exact:true}).waitFor();await page.keyboard.press('Escape');await page.getByRole('button',{name:'Close image viewer',exact:true}).waitFor({state:'hidden'});assert.equal(await page.getByRole('dialog').count(),1,'Closing viewer must keep the trade open');await page.keyboard.press('Escape');
 await figures.first().getByRole('button',{name:'Remove entry-chart.png',exact:true}).click();assert.equal(await figures.count(),1);
 // Exercise the actual resizable edit sheet without changing the saved format.
 await page.goto('http://127.0.0.1:4209/tests/trade-form.html?edit=1');await paste('[aria-label^="Notes for Before"][contenteditable]');await page.getByRole('button',{name:'Wide review',exact:true}).scrollIntoViewIfNeeded();await page.getByRole('button',{name:'Wide review',exact:true}).click();await page.waitForTimeout(200);assert.ok((await page.locator('[data-slot="sheet-content"]').boundingBox()).width>1000);
 await page.locator('[data-trade-image]').first().scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/image-review/editor-desktop.png'});await page.setViewportSize({width:390,height:900});await page.locator('[data-trade-image]').first().scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:'artifacts/image-review/editor-mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS: unified notes canvas, hidden filenames/no fullscreen buttons, resized image wrapping, multi-image paste, complete uncropped inline charts, stacked desktop/mobile layouts, wide review, fullscreen keyboard dismissal and image removal.');
} finally {await browser?.close();await server.close();}
