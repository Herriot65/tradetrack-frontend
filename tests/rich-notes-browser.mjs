import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=await createServer({server:{host:'127.0.0.1',port:4210,strictPort:true}});await server.listen();let browser;
try{
 browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4210/tests/trade-form.html?edit=1&custom');
 const general=page.getByRole('textbox',{name:'General trade notes',exact:true}),tools=page.getByRole('group',{name:'General trade notes formatting',exact:true});
 assert.equal(await page.getByRole('button',{name:'Customize Trade Notes',exact:true}).count(),0);assert.equal(await page.getByRole('heading',{name:'Trade Notes',exact:true}).count(),0);
 assert.equal(await page.getByRole('button',{name:'More formatting',exact:true}).count(),0);
 await general.fill('Trading plan');await tools.getByRole('combobox',{name:'Text style'}).selectOption('2');
 await general.click();await page.keyboard.press('End');await page.keyboard.press('Enter');await tools.getByRole('button',{name:'Bulleted list',exact:true}).click();await page.keyboard.type('Wait for setup');await page.keyboard.press('Enter');await page.keyboard.type('Limit risk');await page.keyboard.press('ControlOrMeta+a');await tools.getByLabel('Text color',{exact:true}).fill('#facc15');
 await page.getByRole('button',{name:'Save Trade',exact:true}).click();await page.locator('[data-slot="sheet-content"]').waitFor({state:'hidden'});
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fixture-custom-trade')));assert.equal(saved.notes_document.version,1);assert.ok(JSON.stringify(saved.notes_document.general).includes('bulletList'));assert.ok(JSON.stringify(saved.notes_document.general).includes('#facc15'));assert.ok(saved.notes_document.general.content.some(node=>node.type==='heading'&&node.attrs.level===2));assert.match(saved.notes,/Trading plan/);
 await page.getByRole('button',{name:'Review saved details',exact:true}).click();await page.getByRole('heading',{name:'Trading plan',exact:true}).waitFor();await page.getByRole('listitem').filter({hasText:'Wait for setup'}).waitFor();const color=await page.getByText('Wait for setup',{exact:true}).evaluate(element=>getComputedStyle(element).color);assert.equal(color,'rgb(250, 204, 21)');await page.keyboard.press('Escape');
 await page.reload();await general.waitFor();assert.equal(await general.getByRole('heading',{name:'Trading plan',exact:true}).count(),1);
 await mkdir('artifacts/rich-notes',{recursive:true});await general.scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/rich-notes/desktop.png'});await page.locator('[data-slot="sheet-content"]').screenshot({path:'artifacts/rich-notes/editor-preview.png'});
 for(const viewport of [390,320]){await page.setViewportSize({width:viewport,height:900});await general.scrollIntoViewIfNeeded();assert.equal(await page.getByRole('button',{name:'More formatting',exact:true}).count(),1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:`artifacts/rich-notes/mobile-${viewport}.png`});}
 assert.deepEqual(errors,[]);console.log('PASS: the single Notes editor supports headings, colored lists, structured/plaintext save, reload, read-only rendering and mobile wrapping; Trade Notes is absent.');
}finally{await browser?.close();await server.close();}
