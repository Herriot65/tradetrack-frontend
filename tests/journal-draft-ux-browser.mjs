import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=await createServer({server:{host:'127.0.0.1',port:4221,strictPort:true}});await server.listen();let browser;
try {
 browser=await chromium.launch({headless:true,channel:'chrome'});
 const context=await browser.newContext({viewport:{width:390,height:900},hasTouch:true}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:4221/tests/trade-form.html?edit=1&custom';
 await page.goto(url);const before=page.locator('[data-note-section="before"]'),notes=page.getByRole('textbox',{name:'Notes for Before / Market Entry',exact:true});
 await page.getByRole('combobox',{name:'Asset',exact:true}).click();await page.getByRole('option',{name:'GBPUSD',exact:true}).click();
 await page.getByRole('button',{name:'SELL',exact:true}).click();await page.getByRole('spinbutton',{name:'Risk (%)',exact:true}).fill('2');await page.getByRole('spinbutton',{name:'PnL (R)',exact:true}).fill('1.5');
 await page.locator('input[name="commission"]').fill('0');await page.locator('input[name="swap"]').fill('-2');
 await page.getByRole('combobox',{name:'Session',exact:true}).click();await page.getByRole('option',{name:'London',exact:true}).click();
 await notes.fill('Keep my unsaved analysis');
 await notes.evaluate(async el=>{const canvas=document.createElement('canvas');canvas.width=800;canvas.height=400;const ctx=canvas.getContext('2d');ctx.fillStyle='#163b33';ctx.fillRect(0,0,800,400);const blob=await new Promise(r=>canvas.toBlob(r));const data=new DataTransfer();data.items.add(new File([blob],'draft.png',{type:'image/png'}));el.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,clipboardData:data}));});
 await page.getByRole('textbox',{name:'Notes after draft.png',exact:true}).fill('A continuation to restore');
 await page.getByRole('button',{name:'Annotate draft.png',exact:true}).tap();
 const dialog=page.getByRole('dialog',{name:'Annotate image',exact:true});const canvas=dialog.getByRole('img',{name:'Annotation canvas',exact:true});await canvas.scrollIntoViewIfNeeded();const rect=await canvas.boundingBox();await page.mouse.move(rect.x+rect.width*.2,rect.y+rect.height*.2);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.7,rect.y+rect.height*.6,{steps:5});await page.mouse.up();
 await dialog.getByRole('button',{name:'Highlight',exact:true}).click();await canvas.focus();await page.keyboard.press('Enter');assert.equal(await canvas.locator('line').count(),1);assert.equal(await canvas.locator('rect').count(),1);
 await dialog.getByRole('button',{name:'Undo annotation',exact:true}).click();assert.equal(await canvas.locator('rect').count(),0);await dialog.getByRole('button',{name:'Redo annotation',exact:true}).click();
 await dialog.getByRole('textbox',{name:'Image caption',exact:true}).fill('Entry rejection at resistance');await dialog.getByRole('button',{name:'Apply annotations',exact:true}).click();
 await before.getByText('Entry rejection at resistance',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Remove draft.png',exact:true}).click();assert.equal(await before.locator('[data-trade-image]').count(),0);await page.getByRole('button',{name:'Undo notes change',exact:true}).click();await page.getByRole('img',{name:'draft.png',exact:true}).waitFor();
 const continuation=page.getByRole('textbox',{name:'Notes after draft.png',exact:true});
 assert.equal(await page.getByRole('button',{name:'Insert text here',exact:true}).count(),0);
 assert.equal(await page.getByRole('button',{name:'Insert image here',exact:true}).count(),0);
 assert.equal(await page.getByRole('button',{name:'Remove text block',exact:true}).count(),0);
 assert.equal(await continuation.getAttribute('data-placeholder'),null);
 await continuation.click();await continuation.press('ControlOrMeta+a');await continuation.press('Backspace');await continuation.press('ControlOrMeta+z');assert.match(await continuation.innerText(),/continuation to restore/);
 // Paste directly into the blank writing space; no insertion controls are needed.
 await continuation.evaluate(async el=>{const canvas=document.createElement('canvas');canvas.width=400;canvas.height=200;const blob=await new Promise(r=>canvas.toBlob(r));const data=new DataTransfer();data.items.add(new File([blob],'inserted.png',{type:'image/png'}));el.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,clipboardData:data}));});
 await before.getByRole('img',{name:'inserted.png',exact:true}).waitFor();
 assert.deepEqual(await before.locator('[data-trade-image] img').evaluateAll(images=>images.map(image=>image.alt)),['draft.png','inserted.png']);
 // Desktop shortcuts also undo/redo structural changes after a removed button loses focus.
 await page.getByRole('button',{name:'Remove inserted.png',exact:true}).click();await page.keyboard.press('Control+z');assert.equal(await before.locator('[data-trade-image]').count(),2);await page.keyboard.press('Control+Shift+z');assert.equal(await before.locator('[data-trade-image]').count(),1);await page.keyboard.press('Meta+z');assert.equal(await before.locator('[data-trade-image]').count(),2);
 // Close immediately without waiting for the debounce; closing flushes the draft.
 await page.locator('[data-slot="sheet-content"]').getByRole('button',{name:'Close',exact:true}).click();await page.locator('[data-slot="sheet-content"]').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>window.__tradeSaves),0);
 await page.getByRole('button',{name:'Edit saved trade',exact:true}).click();await page.getByRole('status').filter({hasText:'Draft restored'}).waitFor();assert.match(await notes.innerText(),/Keep my unsaved analysis/);await page.getByRole('img',{name:'draft.png',exact:true}).waitFor();
 await page.reload();await page.getByRole('status').filter({hasText:'Draft restored'}).waitFor();assert.match(await notes.innerText(),/Keep my unsaved analysis/);assert.match(await page.getByRole('textbox',{name:'Notes after draft.png',exact:true}).innerText(),/continuation to restore/);assert.equal(await before.locator('[data-trade-image] line').count(),1);assert.equal(await before.locator('[data-trade-image] rect').count(),1);assert.ok(await before.getByRole('img',{name:'draft.png',exact:true}).evaluate(img=>img.complete&&img.naturalWidth>0),'Pasted file is restored from IndexedDB, not an expired blob URL');
 assert.match(await page.getByRole('combobox',{name:'Asset',exact:true}).innerText(),/GBPUSD/);assert.equal(await page.getByRole('spinbutton',{name:'Risk (%)',exact:true}).inputValue(),'2');assert.equal(await page.getByRole('spinbutton',{name:'PnL (R)',exact:true}).inputValue(),'1.5');assert.equal(await page.locator('input[name="commission"]').inputValue(),'0');assert.equal(await page.locator('input[name="swap"]').inputValue(),'-2');assert.match(await page.getByRole('combobox',{name:'Session',exact:true}).innerText(),/London/);assert.equal(await page.getByRole('button',{name:'SELL',exact:true}).getAttribute('aria-pressed'),'true');
 const other=await context.newPage();await other.goto(url+'&journal=2');assert.doesNotMatch(await other.getByRole('textbox',{name:'Notes for Before / Market Entry',exact:true}).innerText(),/Keep my unsaved analysis/);await other.close();
 await mkdir('artifacts/journal-draft-ux',{recursive:true});
 for(const width of [320,390,1280]) {await page.setViewportSize({width,height:900});await before.scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:`artifacts/journal-draft-ux/draft-${width}.png`});}
 await page.getByRole('button',{name:'Save Trade',exact:true}).click();await page.locator('[data-slot="sheet-content"]').waitFor({state:'hidden'});const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fixture-custom-trade')));const details=Object.values(saved.notes_document.sections[0].image_details)[0];assert.equal(details.annotations.length,2);assert.equal(details.caption,'Entry rejection at resistance');
 await page.getByRole('button',{name:'Review saved details',exact:true}).click();await page.getByText('Entry rejection at resistance',{exact:true}).waitFor();assert.equal(await page.locator('[data-trade-image] line').count(),1);await page.keyboard.press('Escape');
 await page.reload();await notes.waitFor();assert.equal(await page.getByRole('status').filter({hasText:'Draft restored'}).count(),0,'Explicit save clears the recovery draft');
 // A saved image is not deleted remotely until Save; Undo keeps its backend file.
 await before.getByRole('button',{name:/^Remove screenshot-/}).first().click();assert.equal(await page.evaluate(()=>window.__imageDeletes),0);
 await page.getByRole('button',{name:'Undo notes change',exact:true}).click();assert.equal(await before.locator('[data-trade-image]').count(),2);
 await page.getByRole('button',{name:'Save Trade',exact:true}).click();await page.locator('[data-slot="sheet-content"]').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>window.__imageDeletes),0);
 await page.getByRole('button',{name:'Edit saved trade',exact:true}).click();
 await notes.fill('Intentionally discard this');await page.getByRole('button',{name:'Discard draft',exact:true}).click();const discard=page.getByRole('dialog',{name:'Discard draft?',exact:true});await discard.getByRole('button',{name:'Discard draft',exact:true}).click();await page.locator('[data-slot="sheet-content"]').waitFor({state:'hidden'});await page.getByRole('button',{name:'Edit saved trade',exact:true}).click();assert.doesNotMatch(await notes.innerText(),/Intentionally discard/);
 assert.deepEqual(errors,[]);console.log('PASS: autosaved fields/Files/formatted text/annotations, immediate close and reload recovery, journal isolation, undo image/text deletion, arrow/highlight/caption persistence, mobile layouts and explicit save/discard.');
} finally {await browser?.close();await server.close();}
