import { chooseOption } from "./picker-helpers.mjs";
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=await createServer({server:{host:'127.0.0.1',port:4218,strictPort:true}});await server.listen();let browser;
try {
 browser=await chromium.launch({headless:true,channel:'chrome'});
 const context=await browser.newContext({viewport:{width:1280,height:1000},hasTouch:true,isMobile:true,colorScheme:'dark'}),page=await context.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:4218/tests/trade-form.html?edit=1&custom');
 const before=page.locator('[data-note-section="before"]'),during=page.locator('[data-note-section="during"]');
 await page.getByRole('textbox',{name:'Notes for Before / Market Entry',exact:true}).fill('Before context');
 await page.getByRole('textbox',{name:'Notes for During',exact:true}).fill('During context');
 await page.getByRole('textbox',{name:'Notes for Before / Market Entry',exact:true}).evaluate(async element=>{
  const data=new DataTransfer();
  for(const [name,color] of [['alpha.png','#184438'],['beta.png','#26385b'],['gamma.png','#533b63']]){
   const canvas=document.createElement('canvas');canvas.width=800;canvas.height=400;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,800,400);ctx.fillStyle='white';ctx.font='42px sans-serif';ctx.fillText(name.replace('.png','')+' · trade chart',32,64);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve));data.items.add(new File([blob],name,{type:'image/png'}));
  }
  element.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,clipboardData:data}));
 });
 await before.locator('[data-trade-image]').nth(2).waitFor();
 const option=name=>page.getByRole('button',{name:'Image options for '+name,exact:true});
 async function width(name,value){await option(name).click();await page.getByRole('slider',{name:'Width of '+name,exact:true}).fill(String(value));await page.keyboard.press('Escape');}
 async function move(name,target,placement,keyboard=false){if(keyboard){await option(name).focus();await page.keyboard.press('Enter');}else await option(name).click();await chooseOption(page, page.getByRole('combobox',{name:'Move to',exact:true}), target);if(placement)await chooseOption(page, page.getByRole('combobox',{name:'Placement',exact:true}), {above:'Above',below:'Below',left:'Beside on the left',right:'Beside on the right'}[placement]);if(keyboard){await page.getByRole('button',{name:'Move image',exact:true}).focus();await page.keyboard.press('Enter');}else await page.getByRole('button',{name:'Move image',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('[data-slot="popover-content"]'));}
 const names=section=>section.locator('[data-trade-image] img').evaluateAll(images=>images.map(image=>image.alt));
 const ids=async section=>section.locator('[data-trade-image]').evaluateAll(images=>images.map(image=>image.dataset.noteImageId));
 async function drag(source,target,placement){
  const sourceSection=page.locator(`[data-note-section="${source.section}"]`),targetSection=page.locator(`[data-note-section="${target.section}"]`);
  const sourceFigure=sourceSection.locator('[data-trade-image]').filter({has:page.getByRole('img',{name:source.name,exact:true})});
  const sourceButton=sourceFigure.getByRole('button',{name:'Image options for '+source.name,exact:true});await sourceButton.scrollIntoViewIfNeeded();const start=await sourceButton.boundingBox();
  await page.mouse.move(start.x+start.width/2,start.y+start.height/2);await page.mouse.down();await page.mouse.move(start.x+start.width/2+9,start.y+start.height/2,{steps:3});
  const targetFigure=targetSection.locator('[data-trade-image]').filter({has:page.getByRole('img',{name:target.name,exact:true})});
  const zone=targetFigure.locator(`[data-image-drop][data-placement="${placement}"]`);await zone.waitFor();const end=await zone.boundingBox();
  await page.mouse.move(end.x+end.width/2,end.y+end.height/2,{steps:10});await page.mouse.up();await page.waitForFunction(()=>!document.querySelector('[data-image-drop]'));
 }
 for(const name of ['alpha.png','beta.png','gamma.png'])await width(name,30);
 await drag({section:'before',name:'gamma.png'},{section:'before',name:'alpha.png'},'below');
 let figures=before.locator('[data-trade-image]');let a=await figures.nth(0).boundingBox(),c=await figures.nth(2).boundingBox();assert.ok(c.y>a.y+a.height,'Below creates a separate row even when images would fit beside each other');
 await drag({section:'before',name:'gamma.png'},{section:'before',name:'beta.png'},'right');
 a=await figures.nth(0).boundingBox();c=await figures.nth(2).boundingBox();assert.ok(Math.abs(c.y-a.y)<1,'Right places the image beside its target');
 await drag({section:'before',name:'beta.png'},{section:'before',name:'alpha.png'},'left');assert.deepEqual(await names(before),['beta.png','alpha.png','gamma.png']);
 // Tap/keyboard menu offers the same operations and supports empty sections.
 await move('gamma.png','During · End of section',undefined,true);assert.deepEqual(await names(during),['gamma.png']);
 await width('beta.png',43);await width('alpha.png',43);await width('gamma.png',70);
 await move('alpha.png','Before / Market Entry · Image 1','below');
 figures=before.locator('[data-trade-image]');a=await figures.nth(0).boundingBox();c=await figures.nth(1).boundingBox();assert.ok(c.y>a.y+a.height);
 // Auto-scroll a long trade sheet while dragging, then cancel without closing it.
 await before.evaluate(element=>element.scrollIntoView({block:'start'}));const grip=option('beta.png');await grip.scrollIntoViewIfNeeded();const hit=await grip.boundingBox();
 await page.mouse.move(hit.x+22,hit.y+22);await page.mouse.down();await page.mouse.move(hit.x+32,hit.y+22);
 const body=page.locator('[data-slot="sheet-body"]'),bounds=await body.boundingBox(),previous=await body.evaluate(element=>element.scrollTop);
 await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height-8,{steps:5});
 await page.waitForFunction(previous=>document.querySelector('[data-slot="sheet-body"]').scrollTop>previous+10,previous,{timeout:5000});
 await mkdir('artifacts/image-placement',{recursive:true});await page.screenshot({path:'artifacts/image-placement/drop-zones-desktop.png'});
 await page.keyboard.press('Escape');await page.mouse.up();assert.equal(await page.locator('[data-slot="sheet-content"]').count(),1);assert.deepEqual(await names(before),['beta.png','alpha.png']);
 // New upload IDs must be finalized, and failures must not duplicate uploads.
 await page.evaluate(()=>window.__failImageLayoutOnce=true);await page.getByRole('button',{name:'Save Trade',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'their layout could not be saved'}).waitFor();assert.equal(await page.evaluate(()=>window.__imageUploads),3);assert.deepEqual(await names(before),['beta.png','alpha.png']);
 const uploaded=await page.evaluate(()=>window.__uploadedImages);const idFor=name=>String(uploaded.find(item=>item.name===name).id);
 await page.getByRole('button',{name:'Save Trade',exact:true}).click();await page.locator('[data-slot="sheet-content"]').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>window.__imageUploads),3);
 let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fixture-custom-trade')));
 assert.deepEqual(saved.notes_document.sections.find(section=>section.id==='before').image_layout,[[idFor('beta.png')],[idFor('alpha.png')]]);
 assert.deepEqual(saved.notes_document.sections.find(section=>section.id==='during').image_layout,[[idFor('gamma.png')]]);
 assert.equal(saved.screenshots.length,3);assert.ok(saved.notes.includes('Before context'));assert.ok(saved.notes.includes('During context'));
 // Deliberately scramble API order: document references must restore the user's order.
 await page.evaluate(()=>{const data=JSON.parse(localStorage.getItem('fixture-custom-trade'));data.screenshots.reverse();localStorage.setItem('fixture-custom-trade',JSON.stringify(data));});
 await page.reload();await before.waitFor();assert.deepEqual(await ids(before),[idFor('beta.png'),idFor('alpha.png')]);
 figures=before.locator('[data-trade-image]');a=await figures.nth(0).boundingBox();c=await figures.nth(1).boundingBox();assert.ok(c.y>a.y+a.height,'Manual rows survive reload');
 await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Review saved details',exact:true}).click();
 const review=page.locator('[data-slot="sheet-content"]');assert.equal(await review.locator('[data-trade-image]').count(),3);
 const actual=await review.locator('[data-trade-image] img').evaluateAll(images=>images.map(image=>image.src));
 const expected=['beta.png','alpha.png','gamma.png'].map(name=>saved.screenshots.find(image=>String(image.id)===idFor(name)).image_url);assert.deepEqual(actual,expected,'Read-only review preserves manual section/image order');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Edit saved trade',exact:true}).click();await page.setViewportSize({width:390,height:844});
 await before.evaluate(element=>element.scrollIntoView({block:'start'}));
 // Actual touch pointer events: drag the first small image beside the second.
 const touchGrip=option('screenshot-'+idFor('beta.png'));await touchGrip.scrollIntoViewIfNeeded();const start=await touchGrip.boundingBox();const client=await context.newCDPSession(page);
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start.x+22,y:start.y+22}]});
 await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+32,y:start.y+22}]});
 const target=before.locator(`[data-note-image-id="${idFor('alpha.png')}"] [data-image-drop][data-placement="right"]`);await target.waitFor();const destination=await target.boundingBox();
 const end={x:destination.x+destination.width/2,y:destination.y+destination.height/2};
 for(let i=1;i<=12;i++){await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+32+(end.x-start.x-32)*i/12,y:start.y+22+(end.y-start.y-22)*i/12}]});await new Promise(resolve=>setTimeout(resolve,20));}
 await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForFunction(()=>!document.querySelector('[data-image-drop]'));
 assert.deepEqual(await ids(before),[idFor('alpha.png'),idFor('beta.png')]);figures=before.locator('[data-trade-image]');a=await figures.nth(0).boundingBox();c=await figures.nth(1).boundingBox();assert.ok(Math.abs(c.y-a.y)<1,'Touch can place images beside one another');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await before.scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/image-placement/arranged-mobile.png'});
 await page.getByRole('button',{name:'Save Trade',exact:true}).click();await page.locator('[data-slot="sheet-content"]').waitFor({state:'hidden'});saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fixture-custom-trade')));assert.deepEqual(saved.notes_document.sections.find(section=>section.id==='before').image_layout,[[idFor('alpha.png'),idFor('beta.png')]]);
 // Section IDs, rather than display titles, own image layouts and text.
 await page.evaluate(()=>{const data=JSON.parse(localStorage.getItem('fixture-custom-trade'));for(const section of data.notes_document.sections){if(['before','during'].includes(section.id))section.title='Shared notes';}for(const image of data.screenshots)image.section='Shared notes';localStorage.setItem('fixture-custom-trade',JSON.stringify(data));});
 await page.reload();await before.waitFor();await during.waitFor();assert.deepEqual(await ids(before),[idFor('alpha.png'),idFor('beta.png')]);assert.deepEqual(await ids(during),[idFor('gamma.png')]);
 assert.match(await before.getByRole('textbox',{name:'Notes for Shared notes',exact:true}).innerText(),/Before context/);assert.match(await during.getByRole('textbox',{name:'Notes for Shared notes',exact:true}).innerText(),/During context/);
 await option('screenshot-'+idFor('alpha.png')).click();await page.getByRole('combobox',{name:'Move to',exact:true}).click();await page.getByRole('option',{name:'Shared notes · Section 2 · End of section',exact:true}).waitFor();await page.keyboard.press('Escape');await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);console.log('PASS: mouse/touch drag, beside/below rows, reordering, section moves, keyboard/tap alternatives, auto-scroll/Escape cancel, stable upload IDs, failure/retry without duplicate uploads, save/reload and read-only layout.');
}finally{await browser?.close();await server.close();}
