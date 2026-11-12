import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const server=await createServer({server:{host:'127.0.0.1',port:4213,strictPort:true}});
await server.listen();
const output='artifacts/landing-motion';await mkdir(`${output}/frames`,{recursive:true});
let browser;
try {
 browser=await chromium.launch({headless:true,channel:'chrome'});
 const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'dark'});
 await context.addInitScript(()=>localStorage.setItem('nexora-theme','dark'));
 await context.route(url=>url.pathname.startsWith('/api/'),route=>route.fulfill({json:[]}));
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:4213/');await page.getByRole('heading',{level:1}).waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(800);
 const orbit=page.locator('.nx-orbit-system');
 const before=await orbit.evaluate(el=>getComputedStyle(el).transform);await page.waitForTimeout(200);assert.notEqual(await orbit.evaluate(el=>getComputedStyle(el).transform),before,'Orbit must actually move');
 await page.mouse.move(1150,350);await page.waitForTimeout(500);
 assert.notEqual(await page.locator('.nx-orbit-camera').evaluate(el=>getComputedStyle(el).transform),'matrix(1, 0, 0, 1, 0, 0)');
 await page.screenshot({path:`${output}/desktop.png`});
 // Capture a real browser sequence for an animated preview.
 for(let i=0;i<(process.env.CAPTURE_MOTION_FRAMES === '0' ? 0 : 48);i++) {
  await page.mouse.move(1000+Math.sin(i/8)*180,350+Math.cos(i/8)*110);
  await page.screenshot({path:`${output}/frames/${String(i).padStart(3,'0')}.png`});
  await page.waitForTimeout(80);
 }
 await page.getByRole('button',{name:'Pause animation',exact:true}).click();
 const stopped=await orbit.evaluate(el=>getComputedStyle(el).transform);await page.waitForTimeout(250);assert.equal(await orbit.evaluate(el=>getComputedStyle(el).transform),stopped);
 await page.getByRole('button',{name:'Play animation',exact:true}).click();
 await page.getByRole('link',{name:'Explore Nexora',exact:true}).click();await page.waitForTimeout(800);
 assert.equal(await page.locator('#features [data-revealed="true"]').count(),4);
 await page.getByRole('link',{name:'Get started',exact:true}).first().click();await page.waitForURL('**/register');
 for(const theme of ['dark','light']) {
  await page.goto('http://127.0.0.1:4213/');
  await page.evaluate(value=>{localStorage.setItem('nexora-theme',value);document.documentElement.classList.toggle('light',value==='light');document.documentElement.classList.toggle('dark',value==='dark');},theme);
  for(const width of [320,390,768,1024,1440]) {
   await page.setViewportSize({width,height:900});await page.waitForTimeout(300);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Overflow at ${width}/${theme}`);
   if(width===390 || (width===1440&&theme==='light')) { await page.waitForTimeout(800); await page.screenshot({path:`${output}/${theme}-${width}.png`}); }
  }
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.getByRole('heading',{level:1}).waitFor();
 assert.equal(await orbit.evaluate(el=>getComputedStyle(el).animationName),'none');
 await page.locator('#features').scrollIntoViewIfNeeded();assert.equal(await page.locator('#features article').first().evaluate(el=>getComputedStyle(el).opacity),'1');
 assert.deepEqual(errors,[]);
 console.log('PASS: moving orbit, pointer response, pause/resume, reveals, CTA, dark/light at 320–1440, reduced motion, no runtime errors.');
 await context.close();
}finally{await browser?.close();await server.close();}
