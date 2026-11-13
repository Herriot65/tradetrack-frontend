import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=await createServer({server:{host:'127.0.0.1',port:4222,strictPort:true}});await server.listen();let browser;
try {
 browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:390,height:900},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:4222/tests/trade-form.html?edit=1&custom=1';await page.goto(url);
 const sections=[['execution','Execution'],['performance','Performance'],['setup','Setup'],['psychology','Psychology'],['notes','Notes'],['trade_notes','Trade Notes']];
 await page.evaluate(sections=>localStorage.setItem('fixture-custom-definitions',JSON.stringify(sections.map(([section,title],i)=>({id:i+1,section,label:title+' extra',field_type:'text',options:[]})))),sections);
 await page.reload();await page.getByRole('textbox',{name:'Execution extra',exact:true}).fill('Keep this unsaved value');
 for(const [width,height] of [[320,844],[390,900],[1280,900]]) {
  await page.setViewportSize({width,height});
  for(const [,title] of sections) {
   assert.equal(await page.getByRole('button',{name:`Edit ${title} extra field`,exact:true}).count(),0,'Field actions are hidden outside section editing');
   await page.getByRole('button',{name:`Customize ${title}`,exact:true}).click();
   await page.getByRole('button',{name:`Edit ${title} extra field`,exact:true}).waitFor();await page.getByRole('button',{name:`Remove ${title} extra field`,exact:true}).waitFor();
   const edit=page.getByRole('button',{name:`Edit ${title} extra field`,exact:true});await edit.tap();const dialog=page.getByRole('dialog',{name:'Edit field',exact:true});await dialog.getByRole('button',{name:'Cancel',exact:true}).tap();await page.getByRole('button',{name:`Done customizing ${title}`,exact:true}).click();
  }
 }
 await page.getByRole('button',{name:'Customize Execution',exact:true}).click();await page.getByRole('button',{name:'Edit Execution extra field',exact:true}).click();let dialog=page.getByRole('dialog',{name:'Edit field',exact:true});await dialog.getByRole('textbox',{name:'Field name',exact:true}).fill('Confidence');await page.keyboard.press('Enter');await dialog.waitFor({state:'hidden'});assert.equal(await page.getByRole('textbox',{name:'Confidence',exact:true}).inputValue(),'Keep this unsaved value');assert.equal(await page.evaluate(()=>window.__tradeSaves),0);
 await page.getByRole('button',{name:'Edit Confidence field',exact:true}).click();dialog=page.getByRole('dialog',{name:'Edit field',exact:true});await dialog.getByRole('textbox',{name:'Field name',exact:true}).fill('Rejected rename');await page.evaluate(()=>window.__failFieldRename=true);await dialog.getByRole('button',{name:'Save name',exact:true}).click();await dialog.getByRole('alert').waitFor();assert.equal(await page.locator('#custom-1').inputValue(),'Keep this unsaved value');await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Done customizing Execution',exact:true}).click();
 await page.reload();await page.getByRole('status').filter({hasText:'Draft restored'}).waitFor();assert.equal(await page.getByRole('textbox',{name:'Confidence',exact:true}).inputValue(),'Keep this unsaved value');assert.equal(await page.getByRole('button',{name:'Remove Confidence field',exact:true}).count(),0);
 await page.getByRole('button',{name:'Customize Execution',exact:true}).click();await page.getByRole('button',{name:'Remove Confidence field',exact:true}).click();dialog=page.getByRole('dialog',{name:'Delete custom field?',exact:true});await dialog.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await page.getByRole('textbox',{name:'Confidence',exact:true}).count(),1);
 await mkdir('artifacts/custom-field-actions',{recursive:true});for(const width of [320,390,1280]){await page.setViewportSize({width,height:900});await page.getByRole('button',{name:'Edit Confidence field',exact:true}).scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:`artifacts/custom-field-actions/section-edit-${width}.png`});}
 await page.getByRole('button',{name:'Remove Confidence field',exact:true}).click();dialog=page.getByRole('dialog',{name:'Delete custom field?',exact:true});await dialog.getByRole('button',{name:'Delete field',exact:true}).click();await page.getByRole('textbox',{name:'Confidence',exact:true}).waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>window.__tradeSaves),0);await page.reload();assert.equal(await page.getByRole('textbox',{name:'Confidence',exact:true}).count(),0);assert.deepEqual(errors,[]);
 console.log('PASS: all six section edit flows at 320/390/1280; no standalone deletes; shared rename/remove controls, typed value preservation, Enter, failed rename, reload persistence, cancel and confirmed deletion, no parent trade submission.');
} finally {await browser?.close();await server.close();}
