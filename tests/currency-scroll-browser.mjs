import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=await createServer({server:{host:'127.0.0.1',port:4186}});await server.listen();
let browser;
try{
 browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1280,height:900}});page.setDefaultTimeout(10000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await mkdir('artifacts/currency-scroll',{recursive:true});
 for(const width of [320,390,768,1280,1920]) {
  await page.setViewportSize({width,height:900});
  await page.goto('http://127.0.0.1:4186/tests/analytics.html?dense');
  await page.getByRole('group',{name:'Date range',exact:true}).getByRole('button',{name:'All',exact:true}).click();
  for(const label of ['$', 'R', '%', '$']) {
   await page.evaluate(()=>scrollTo(0,0));
   const selector=page.getByRole('group',{name:'Display unit',exact:true});
   await selector.getByRole('button',{name:label,exact:true}).click();
   await page.waitForFunction(label=>document.querySelector('[aria-label="Display unit"] button[aria-pressed="true"]')?.textContent===label,label);
   const kpis=page.getByTestId('analytics-kpis');
   assert.equal(await kpis.count(),1);
   const value=await kpis.locator('.analytics-kpi-value').first().textContent();
   assert.ok(label==='$'?value.includes('$'):label==='%'?value.includes('%'):value.includes('R'),value);
   for(const y of [0,400,800,1200,2400,3200,800,0]) {
    await page.evaluate(async y=>{scrollTo(0,y);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));},y);
    const problems=await page.evaluate(()=>{
     const toolbar=document.querySelector('.analytics-filters');
     const cards=[...document.querySelectorAll('[data-testid="analytics-kpis"] .analytics-card')];
     const bar=toolbar.getBoundingClientRect();
     const overlap=cards.some(card=>{const r=card.getBoundingClientRect();return r.top<bar.bottom&&r.bottom>bar.top&&r.left<bar.right&&r.right>bar.left;});
     const units=[...document.querySelectorAll('.analytics-page > *')].filter(el=>el.getBoundingClientRect().height>0);
     const sectionsOverlap=units.some((el,i)=>i>0&&el.getBoundingClientRect().top<units[i-1].getBoundingClientRect().bottom-1);
     return {overlap,sectionsOverlap,position:getComputedStyle(toolbar).position,overflow:document.documentElement.scrollWidth>innerWidth+1};
    });
    assert.deepEqual(problems,{overlap:false,sectionsOverlap:false,position:'static',overflow:false},`${width}px ${label} scroll ${y}`);
    assert.equal(await kpis.count(),1);
    assert.equal(await kpis.locator('.analytics-kpi-value').count(),4);
   }
  }
  await page.evaluate(()=>scrollTo(0,600));
  await page.screenshot({path:`artifacts/currency-scroll/scroll-${width}.png`});
 }
 assert.deepEqual(errors,[]);
 console.log('Passed: R/$/% toggles, one KPI block, no toolbar/card intersections or section overlap, no horizontal overflow, bidirectional scrolling at 5 viewport widths.');
}finally{await browser?.close();await server.close();}
