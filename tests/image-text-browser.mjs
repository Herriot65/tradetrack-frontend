import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=await createServer({server:{host:'127.0.0.1',port:4220,strictPort:true}});await server.listen();let browser;
try {
 browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1280,height:900},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4220/tests/trade-form.html?edit=1&custom');
 const before=page.locator('[data-note-section="before"]');
 await page.getByRole('textbox',{name:'Notes for Before / Market Entry',exact:true}).evaluate(async el=>{
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=320;const ctx=canvas.getContext('2d');ctx.fillStyle='#24453e';ctx.fillRect(0,0,640,320);ctx.fillStyle='white';ctx.font='25px sans-serif';ctx.fillText('EURUSD entry chart',20,60);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve));const data=new DataTransfer();data.items.add(new File([blob],'entry.png',{type:'image/png'}));data.items.add(new File([blob],'second.png',{type:'image/png'}));el.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,clipboardData:data}));
 });
 assert.equal(await before.getByRole('group',{name:/formatting/}).count(),1,'A section has one existing toolbar');
 await page.getByRole('textbox',{name:'Notes after entry.png',exact:true}).click();
 let editor=page.getByRole('textbox',{name:'Notes after entry.png',exact:true});await editor.waitFor();await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Notes after entry.png');
 await page.keyboard.type('Price rejected the level.');await page.keyboard.press('Enter');await page.keyboard.type('Wait for confirmation.');
 await editor.press('ControlOrMeta+a');await page.getByRole('group',{name:'Notes for Before / Market Entry formatting',exact:true}).getByRole('button',{name:'Bold',exact:true}).click();
 // Paste another screenshot at the continuation cursor, before the following image.
 await editor.evaluate(async el=>{
  const canvas=document.createElement('canvas');canvas.width=400;canvas.height=200;
  const blob=await new Promise(resolve=>canvas.toBlob(resolve));const data=new DataTransfer();data.items.add(new File([blob],'inserted.png',{type:'image/png'}));el.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,clipboardData:data}));
 });
 await before.getByRole('img',{name:'inserted.png',exact:true}).waitFor();
 assert.deepEqual(await before.locator('[data-trade-image] img').evaluateAll(images=>images.map(image=>image.alt)),['entry.png','inserted.png','second.png'],'Paste inserts at the writing space, not the end of the section');
 assert.equal(await before.getByRole('group',{name:/formatting/}).count(),1);
 await page.getByRole('button',{name:'Image options for entry.png',exact:true}).click();await page.getByRole('slider',{name:'Width of entry.png'}).fill('30');await page.keyboard.press('Escape');
 await mkdir('artifacts/image-text',{recursive:true});
 for(const width of [1280,390,320]) {
  await page.setViewportSize({width,height:900});await editor.scrollIntoViewIfNeeded();
  const geometry=await before.evaluate(section=>{const figure=section.querySelector('[data-trade-image]').getBoundingClientRect(),note=section.querySelector('[data-image-note-id]').getBoundingClientRect(),canvas=section.querySelector('.trade-note-images').getBoundingClientRect();return {imageBottom:figure.bottom,noteTop:note.top,noteWidth:note.width,canvasWidth:canvas.width};});
  assert.ok(geometry.noteTop>=geometry.imageBottom-1,'Text is after the image');assert.ok(geometry.noteWidth>geometry.canvasWidth*.8,'Text keeps a readable full-width canvas even for a small image');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:`artifacts/image-text/after-image-${width}.png`});
 }
 await page.getByRole('button',{name:'Image options for entry.png',exact:true}).click();await page.getByRole('combobox',{name:'Move to',exact:true}).selectOption({label:'During · End of section'});await page.getByRole('button',{name:'Move image',exact:true}).click();
 const during=page.locator('[data-note-section="during"]');await during.getByRole('textbox',{name:'Notes after entry.png',exact:true}).waitFor();assert.equal(await before.locator('[data-trade-image]').count(),2);assert.equal(await before.locator('[data-image-note-id]').count(),2,'Remaining image keeps its empty writing space');
 await page.getByRole('button',{name:'Save Trade',exact:true}).click();await page.locator('[data-slot="sheet-content"]').waitFor({state:'hidden'});
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fixture-custom-trade')));const screenshot=saved.screenshots.find(image=>image.section==='During');const section=saved.notes_document.sections.find(s=>s.id==='during');assert.match(JSON.stringify(section.image_notes[String(screenshot.id)]),/Price rejected/);assert.match(JSON.stringify(section.image_notes[String(screenshot.id)]),/bold/);assert.match(saved.notes,/Wait for confirmation/);
 await page.getByRole('button',{name:'Review saved details',exact:true}).click();const text=page.locator('[data-image-note-id]').getByText('Price rejected the level.',{exact:true});await text.waitFor();assert.ok(await text.locator('strong').count() || await page.locator('[data-image-note-id] strong').count());await page.keyboard.press('Escape');
 await page.reload();editor=page.getByRole('textbox',{name:`Notes after screenshot-${screenshot.id}`,exact:true});await editor.waitFor();assert.match(await editor.innerText(),/Wait for confirmation/);assert.equal(await page.locator('[data-note-section="during"] [data-image-note-id]').count(),1);
 await editor.tap();await page.waitForFunction(label=>document.activeElement?.getAttribute('aria-label')===label,`Notes after screenshot-${screenshot.id}`);assert.deepEqual(errors,[]);console.log('PASS: One section toolbar formats text above and after images, continuous writing space, mobile/desktop layout, move with text, save/review/reload.');
} finally {await browser?.close();await server.close();}
