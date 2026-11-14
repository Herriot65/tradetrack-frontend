import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=await createServer({server:{host:'127.0.0.1',port:4224,strictPort:true}});await server.listen();let browser;
try{
 browser=await chromium.launch({headless:true,channel:'chrome'});
 for(const [width,brokenStorage] of [[390,false],[1280,false],[390,true]]){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:true});
  if(brokenStorage)await context.addInitScript(()=>{indexedDB.open=()=>{throw new Error('Storage unavailable');};});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4224/tests/trade-form.html?custom=1');
  const save=page.getByRole('button',{name:'Save Trade',exact:true});assert.equal(await save.isDisabled(),true);assert.equal(await page.evaluate(()=>window.__tradeSaves),0);
  await page.getByRole('combobox',{name:'Asset',exact:true}).click();await page.getByRole('option',{name:'EURUSD',exact:true}).click();await page.getByRole('button',{name:'Entry date/time',exact:true}).click();await page.getByRole('button',{name:'Now',exact:true}).click();await page.getByRole('button',{name:'Done',exact:true}).click();
  await page.getByRole('textbox',{name:'General trade notes',exact:true}).fill('A valid new entry');
  assert.equal(await save.isEnabled(),true);assert.equal(await page.getByRole('button',{name:'More formatting',exact:true}).count(),width<768?1:0);if(width<768)await page.getByRole('button',{name:'More formatting',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Italic',exact:true}).count(),1);assert.equal(await page.getByRole('button',{name:'Undo notes change',exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:/^Annotate /}).count(),0);
  assert.equal(await page.getByRole('heading',{name:'Trade Notes',exact:true}).count(),0);
  await page.getByRole('button',{name:'Save Trade',exact:true}).click();await page.locator('[data-slot="sheet-content"]').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>window.__tradeSaves),1);
  await page.getByRole('button',{name:'New trade',exact:true}).click();await page.getByRole('textbox',{name:'General trade notes',exact:true}).fill('Discard this entry');
  if(!brokenStorage)await page.getByRole('status').filter({hasText:'Draft saved'}).waitFor();assert.equal(await page.getByText('Draft saved on this device',{exact:true}).count(),0);
  await page.getByRole('button',{name:'Discard',exact:true}).click();await page.getByRole('dialog',{name:'Discard draft?',exact:true}).getByRole('button',{name:'Discard draft',exact:true}).click();await page.locator('[data-slot="sheet-content"]').waitFor({state:'hidden'});
  await page.getByRole('button',{name:'New trade',exact:true}).click();await page.getByRole('textbox',{name:'General trade notes',exact:true}).waitFor();assert.doesNotMatch(await page.getByRole('textbox',{name:'General trade notes',exact:true}).innerText(),/Discard this entry/);assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS: new entries keep Save disabled until required fields are valid, save and discard on mobile/desktop and with unavailable IndexedDB; mobile formatting uses More while desktop actions stay visible.');
}finally{await browser?.close();await server.close();}
