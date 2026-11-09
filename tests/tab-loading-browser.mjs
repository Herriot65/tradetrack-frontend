import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const server=await createServer({server:{host:'127.0.0.1',port:4185}});
await server.listen();
let browser;
try {
 browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage();
 page.setDefaultTimeout(5000);
 await page.goto('http://127.0.0.1:4185/tests/tab-loading.html');
 const data=page.getByTestId('data');
 await data.filter({hasText:'journal-1-read-1'}).waitFor();
 for(let index=0;index<3;index++){
  await page.getByText('Toggle tab',{exact:true}).click();
  await page.getByText('Toggle tab',{exact:true}).click();
  assert.equal(await page.getByTestId('loading').textContent(),'false');
  assert.equal(await data.textContent(),'journal-1-read-1');
 }
 assert.equal(await page.getByTestId('calls').textContent(),'1');
 await page.getByText('Edit while hidden',{exact:true}).click();
 await page.getByText('Toggle tab',{exact:true}).click();
 await data.filter({hasText:'journal-1-read-2'}).waitFor();
 await page.getByText('Switch journal',{exact:true}).click();
 await page.getByText('Toggle tab',{exact:true}).click();
 await data.filter({hasText:'journal-2-read-3'}).waitFor();
 await page.getByText('Refresh',{exact:true}).click();
 await data.filter({hasText:'journal-2-read-4'}).waitFor();
 await page.getByText('Toggle error',{exact:true}).click();
 await page.getByTestId('error').filter({hasText:'offline'}).waitFor();
 await page.getByText('Toggle error',{exact:true}).click();
 await data.filter({hasText:'journal-2-read-6'}).waitFor();
 console.log('Passed: repeated tab switches make zero additional reads; edits, journal changes, refresh and error recovery fetch fresh data.');
} finally {await browser?.close();await server.close();}
