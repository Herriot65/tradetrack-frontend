import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=await createServer({server:{host:'127.0.0.1',port:4215,strictPort:true}});await server.listen();let browser;
try {
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:900},hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4215/tests/trade-form.html?edit=1&options=1');
 async function open(label){const trigger=page.getByRole(/TF/.test(label)?'button':'combobox',{name:label,exact:true});await trigger.click();return page.getByRole('dialog',{name:label+' options',exact:true});}
 let popup=await open('Asset');
 await popup.getByRole('option',{name:'GBPUSD',exact:true}).tap();
 assert.match(await page.getByRole('combobox',{name:'Asset',exact:true}).innerText(),/GBPUSD/);
 popup=await open('Asset');await popup.getByRole('combobox',{name:'Search Asset'}).fill('eurusd');assert.equal(await popup.getByRole('button',{name:/Create/}).count(),0);await page.keyboard.press('Enter');
 popup=await open('Asset');await popup.getByRole('combobox',{name:'Search Asset'}).fill('eur');await popup.getByRole('button',{name:'Create “EUR”',exact:true}).waitFor();await page.keyboard.press('Enter');
 assert.match(await page.getByRole('combobox',{name:'Asset',exact:true}).innerText(),/^EUR$/,'Enter must create a partial match, not select EURUSD');
 for(const label of ['Reference TF','Opportunity TF','Entry TF','Trend','Session']) {
   popup=await open(label);const search=popup.getByRole('combobox',{name:'Search '+label,exact:true});
   const next=label.includes('TF')?'M45':label==='Trend'?'Neutral':'After hours';
   await search.fill(next);if(await popup.getByRole('button',{name:`Create “${next}”`,exact:true}).count())await popup.getByRole('button',{name:`Create “${next}”`,exact:true}).tap();else await page.keyboard.press('Enter');
   assert.equal(await popup.count(),0);
 }
 popup=await open('Trend');await popup.getByRole('button',{name:'Actions for Neutral',exact:true}).tap();await popup.getByRole('textbox',{name:'Option name'}).fill('Sideways');await page.keyboard.press('Enter');
 await popup.getByRole('option',{name:'Sideways',exact:true}).waitFor();await page.keyboard.press('Escape');assert.match(await page.getByRole('combobox',{name:'Trend',exact:true}).innerText(),/Sideways/);
 popup=await open('Trend');await popup.getByRole('button',{name:'Actions for Sideways',exact:true}).tap();await popup.getByRole('button',{name:'Delete',exact:true}).tap();assert.equal(await popup.getByRole('option',{name:'Sideways',exact:true}).count(),0);await page.keyboard.press('Escape');
 for(const label of ['Setup','Emotion','Mistake']) {
   popup=await open(label);await popup.getByRole('combobox',{name:'Search '+label,exact:true}).fill('Fresh '+label);await page.keyboard.press('Enter');
   if(label==='Setup')assert.match(await page.getByRole('combobox',{name:label,exact:true}).innerText(),/Fresh Setup/);
   else {await page.keyboard.press('Escape');await page.getByRole('button',{name:'Deselect Fresh '+label,exact:true}).waitFor();}
 }

 // A rejected catalog mutation stays open and never selects a nonexistent value.
 popup=await open('Asset');await popup.getByRole('combobox',{name:'Search Asset'}).fill('FAILED');await page.evaluate(()=>window.__failOptionSave=true);await page.keyboard.press('Enter');await popup.getByRole('alert').waitFor();await page.keyboard.press('Escape');
 assert.doesNotMatch(await page.getByRole('combobox',{name:'Asset',exact:true}).innerText(),/FAILED/);
 popup=await open('Asset');await popup.getByRole('button',{name:'Actions for EUR',exact:true}).tap();await popup.getByRole('textbox',{name:'Option name'}).fill('GBPUSD');assert.equal(await popup.getByRole('button',{name:'Save',exact:true}).isDisabled(),true);await popup.getByRole('textbox',{name:'Option name'}).fill('EURCAD');await popup.getByRole('button',{name:'Save',exact:true}).tap();await popup.getByRole('option',{name:'EURCAD',exact:true}).waitFor();await popup.getByRole('button',{name:'Actions for EURCAD',exact:true}).tap();await popup.getByRole('button',{name:'Delete',exact:true}).tap();assert.equal(await popup.getByRole('option',{name:'EURCAD',exact:true}).count(),0);await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(()=>window.__tradeSaves),0,'Dropdown actions must never submit the trade');
 // Newly added setup options survive a reload, and all popup geometry fits narrow screens.
 await page.reload();popup=await open('Session');await popup.getByRole('option',{name:'After hours',exact:true}).waitFor();await page.keyboard.press('Escape');
 await mkdir('artifacts/dropdown-options',{recursive:true});
 for(const width of [320,390,768,1280]) {
   await page.setViewportSize({width,height:740});
   for(const label of ['Asset','Reference TF','Trend','Emotion']) {
     popup=await open(label);await popup.scrollIntoViewIfNeeded();const box=await popup.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1,`${label} popup fits ${width}`);assert.ok(box.y>=0&&box.y+box.height<=741);
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
     if(label==='Reference TF')await page.screenshot({path:`artifacts/dropdown-options/options-${width}.png`});
     await page.keyboard.press('Escape');
   }
 }

 await page.evaluate(()=>localStorage.setItem('fixture-custom-definitions',JSON.stringify([{id:1,section:'setup',label:'Market condition',field_type:'select',options:['Trending','Ranging']}])));
 await page.goto('http://127.0.0.1:4215/tests/trade-form.html?edit=1&custom=1&options=1');
 popup=await open('Market condition');await popup.getByRole('combobox',{name:'Search Market condition'}).fill('Volatile');await page.keyboard.press('Enter');
 popup=await open('Market condition');await popup.getByRole('button',{name:'Actions for Volatile',exact:true}).click();await popup.getByRole('textbox',{name:'Option name'}).fill('Choppy');await popup.getByRole('button',{name:'Save',exact:true}).click();await popup.getByRole('option',{name:'Choppy',exact:true}).waitFor();await page.keyboard.press('Escape');
 await page.reload();popup=await open('Market condition');await popup.getByRole('option',{name:'Choppy',exact:true}).waitFor();await popup.getByRole('button',{name:'Actions for Choppy',exact:true}).click();await popup.getByRole('button',{name:'Delete',exact:true}).click();await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.__tradeSaves),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: direct selection, case-insensitive exact match, Enter/button create, partial-match creation, option rename/delete, multi-select, persistence, no form submission, responsive popup bounds at 320/390/768/1280.');
} finally {await browser?.close();await server.close();}
