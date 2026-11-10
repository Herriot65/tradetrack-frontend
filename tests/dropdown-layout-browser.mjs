import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=await createServer({server:{host:'127.0.0.1',port:4219,strictPort:true}});await server.listen();let browser;
try {
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4219/tests/trade-form.html?edit=1&options=1');
 await page.evaluate(()=>{
  localStorage.setItem('fixture-custom-definitions',JSON.stringify([
   {id:1,section:'psychology',label:'Psychology dropdown',field_type:'select',options:Array.from({length:35},(_,i)=>`Choice ${i+1}`)},
   {id:2,section:'psychology',label:'Followed plan',field_type:'boolean',options:[]},
  ]));
  localStorage.setItem('fixture-option-lists',JSON.stringify({assets:['EURUSD','GBPUSD'],setups:['Breakout','Pullback'],emotionTags:Array.from({length:30},(_,i)=>`Emotion ${i+1}`),mistakeTags:Array.from({length:30},(_,i)=>`Mistake ${i+1}`)}));
 });
 await page.goto('http://127.0.0.1:4219/tests/trade-form.html?edit=1&options=1&custom=1');
 await page.locator('.rich-notes-editor').first().waitFor();
 const labels=['Asset','Reference TF','Opportunity TF','Entry TF','Trend','Session','Setup','Emotion','Mistake','Psychology dropdown','Followed plan'];
 async function open(label) {
  const trigger=page.getByRole(label.includes('TF')?'button':'combobox',{name:label,exact:true});await trigger.click();
  const panel=page.getByRole('dialog',{name:label+' options',exact:true});await panel.waitFor();return panel;
 }
 async function checkLayout(label) {
  const result=await page.evaluate(label=>{
   const picker=[...document.querySelectorAll('[data-option-picker]')].find(e=>e.dataset.optionPicker===label),panel=picker.querySelector('[data-option-panel]'),r=panel.getBoundingClientRect();
   const overlap=[...document.querySelectorAll('[data-option-picker],.rich-notes-editor,input,textarea')].filter(e=>!picker.contains(e)&&!e.contains(picker)).filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.height&&Math.min(b.right,r.right)-Math.max(b.left,r.left)>1&&Math.min(b.bottom,r.bottom)-Math.max(b.top,r.top)>1;}).map(e=>e.dataset.optionPicker||e.getAttribute('aria-label')||e.className);
   const body=panel.closest('[data-slot="sheet-body"]'),section=panel.closest('section'),s=section.getBoundingClientRect(),b=body.getBoundingClientRect();
   return {overlap,position:getComputedStyle(panel).position,insideSection:r.bottom<=s.bottom+1,h:r.height,available:innerHeight*.55,overflow:document.documentElement.scrollWidth>innerWidth+1,clippedByFooter:r.top<b.bottom && Math.min(r.bottom,b.bottom)>b.bottom+1,panels:document.querySelectorAll('[data-option-panel]').length};
  },label);
  assert.deepEqual(result.overlap,[],`${label} must reserve its own space`);assert.equal(result.position,'static');assert.equal(result.insideSection,true);assert.ok(result.h<=Math.min(360,result.available)+1);assert.equal(result.overflow,false);assert.equal(result.panels,1);
 }
 await mkdir('artifacts/dropdown-layout',{recursive:true});
 for(const [width,height] of [[320,740],[390,844],[768,900],[1280,900],[390,480]]) {
  await page.setViewportSize({width,height});
  for(const label of labels) {
   const panel=await open(label);await checkLayout(label);
   const list=panel.getByRole('listbox');
   if(['Emotion','Mistake','Psychology dropdown'].includes(label)) {
    assert.ok(await list.evaluate(e=>e.scrollHeight>e.clientHeight),'Long option lists scroll internally');
    await list.evaluate(e=>e.scrollTop=e.scrollHeight);assert.ok(await list.evaluate(e=>e.scrollTop>0));
    await list.evaluate(e=>e.scrollTop=0);
    if(width===390&&height===844)await page.screenshot({path:`artifacts/dropdown-layout/${label.replaceAll(' ','-').toLowerCase()}-390.png`});
   }
   if(label==='Mistake') {
    await panel.getByRole('button',{name:'Actions for Mistake 1',exact:true}).click();await checkLayout(label);await panel.getByRole('button',{name:'Cancel',exact:true}).click();await checkLayout(label);
   }
   await page.keyboard.press('Escape');assert.equal(await panel.count(),0);assert.equal(await page.getByRole('button',{name:'Save Trade',exact:true}).isVisible(),true,'Escape closes the list and preserves the trade dialog');
  }
 }
 // Opening another picker closes the previous one; it never covers the editor.
 await page.setViewportSize({width:390,height:844});await open('Emotion');await open('Mistake');assert.equal(await page.locator('[data-option-panel]').count(),1);await checkLayout('Mistake');
 await page.keyboard.press('Escape');
 const editor=page.locator('.rich-notes-editor .tiptap').first();await editor.fill('Notes remain editable after using the psychology fields.');assert.match(await editor.innerText(),/Notes remain editable/);
 assert.equal(await page.evaluate(()=>window.__tradeSaves),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: all 11 journal dropdowns reserve layout space; no intersections with sibling fields or TipTap; bounded scrolling, edit actions, one open list, keyboard dismissal and editable notes at 320/390/768/1280 and short mobile heights.');
} finally {await browser?.close();await server.close();}
