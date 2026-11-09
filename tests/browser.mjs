import assert from "node:assert/strict";
import { createServer } from "vite";
import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
// Install playwright locally or supply PLAYWRIGHT_MODULE pointing to its index.mjs.
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
const server=await createServer({define:{"import.meta.env.VITE_USE_MOCK":JSON.stringify("false")},server:{host:"127.0.0.1",port:4179}});
await server.listen();
let browser;
try {
 browser=await chromium.launch({headless:true,channel:"chrome", timeout:15000});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.setDefaultTimeout(10000);
 const errors=[];page.on("pageerror",error=>errors.push(error.message));
 await page.goto("http://127.0.0.1:4179/tests/analytics.html");
 await page.getByRole("button",{name:"All",exact:true}).click();
 await page.getByRole("heading",{name:"Equity and drawdown"}).waitFor();
 assert.equal(await page.getByRole("heading",{name:"Monthly net R"}).count(),1);
 // Repeated analytics reads share one request, including simultaneous tab mounts.
 await page.evaluate(async () => {
  const {default: api} = await import('/src/api/axios.js');
  const {fetchHubTrades} = await import('/src/api/hub.api.js');
  const {clearQueryCache} = await import('/src/lib/queryCache.js');
  const adapter = api.defaults.adapter;
  let calls = 0;
  api.defaults.adapter = async config => { calls++; return adapter(config); };
  try {
   clearQueryCache();
   const [first, second] = await Promise.all([fetchHubTrades(1), fetchHubTrades(1)]);
   if (calls !== 1 || first !== second) throw new Error('Tab requests were not shared');
   await fetchHubTrades(1);
   if (calls !== 1) throw new Error('Tab revisit fetched history again');
   await api.patch('/journals/1/', {break_even_value:0});
   await fetchHubTrades(1);
   if (calls !== 3) throw new Error('Mutation failed to invalidate analytics');
  } finally { api.defaults.adapter = adapter; clearQueryCache(); }
 });

 await page.getByRole("button",{name:"Custom",exact:true}).click();
 await page.locator("#analytics-start").fill("2025-01-01");
 await page.locator("#analytics-end").fill("2025-12-31");
 await page.getByText("8 trades",{exact:true}).first().waitFor();
 assert.equal(await page.getByTestId("analytics-kpis").getByText("+0.63R",{exact:true}).count(),1);
 assert.equal(await page.getByText("Recovery factor 1.7",{exact:true}).count(),1);
 for(const value of ["+5.00R","+0.63R","2.25","\u22123.00R","+3.00R","\u22121.33R"]) assert.ok(await page.getByTestId("analytics-kpis").getByText(value,{exact:true}).count()>=1,`Preserved metric value ${value}`);
 assert.equal(await page.getByText("50.0% excluding break-even",{exact:true}).count(),1);
 for(const value of ["+9.00R","\u22124.00R"]) assert.equal(await page.getByText(value,{exact:true}).count(),1);
 assert.equal(await page.getByRole("heading",{name:"Monthly net R"}).count(),0);
 assert.equal(await page.getByText("December 2025",{exact:true}).count(),1);
 const bars=page.locator("section").filter({has:page.getByRole("heading",{name:"By asset",exact:true})});
 assert.equal(await bars.locator(".left-1\\/2").count(),4);
 assert.ok(await bars.locator(".bg-loss").count()>0);
 assert.equal(await page.getByRole("button",{name:"Next month"}).isVisible(),false);
 // Focus drives the same readouts as hover.
 await page.getByRole("button",{name:"Wins: 37.5%"}).focus();
 assert.equal(await page.getByText("Wins",{exact:true}).count(),2);
 await page.getByRole("img",{name:/Equity and drawdown across/}).focus();
 await page.keyboard.press("ArrowRight");
 await page.getByText(/Trade #1 .*Equity/).waitFor();
 await page.getByRole("button",{name:"Open trade #1: +2.00R"}).click();
 await page.getByRole("dialog").waitFor();
 await page.getByText("Full notes loaded on demand",{exact:true}).waitFor();
 await page.keyboard.press("Escape");
 await page.getByRole("button",{name:"Distribution",exact:true}).click();
 await page.getByText("How your R-multiples are distributed, in 0.5R buckets").waitFor();
 await page.getByRole("button",{name:"Sequence",exact:true}).click();
 const cell=page.getByRole("button",{name:/Mon, 10:00/}).first();await cell.focus();
 await page.getByText(/Mon, 10:00.*trades.*win/).waitFor();
 await mkdir("artifacts/analytics",{recursive:true});
 for(const width of [1440,1024,390]) {
   await page.setViewportSize({width,height:1000});await page.waitForTimeout(150);await page.evaluate(()=>window.scrollTo(0,0));
   const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
   if(size.scroll>size.client) console.log(await page.evaluate(()=>[...document.querySelectorAll("body *")].filter(e=>e.getBoundingClientRect().right>innerWidth).filter(e=>!e.closest(".overflow-x-auto")).slice(0,20).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right,html:e.outerHTML.slice(0,150)}))));
   await page.screenshot({path:`artifacts/analytics/${width}.png`,fullPage:true});
   assert.ok(size.scroll<=size.client,`Page overflows at ${width}: ${JSON.stringify(size)}`);
 }
 // Navigate to the first month and open a real calendar trade.
 for(let i=0;i<11;i++) await page.getByRole("button",{name:"Previous month"}).click();
 assert.equal(await page.getByRole("button",{name:"Previous month"}).isVisible(),false);
 await page.getByRole("button",{name:"Open trades for 2025-01-01",exact:true}).click();
 await page.getByRole("button").filter({hasText:"GBPJPY"}).last().click();
 await page.getByRole("dialog").waitFor();await page.keyboard.press("Escape");
 await page.getByRole("button",{name:"Filter",exact:true}).click();
 await page.getByRole("menuitem").filter({hasText:"EURUSD"}).click();
 await page.keyboard.press("Escape");
 await page.getByText("4 trades",{exact:true}).first().waitFor();
 await page.locator("#analytics-start").fill("2024-01-01");
 await page.locator("#analytics-end").fill("2024-12-31");
 await page.getByText("No trades in this range",{exact:true}).waitFor();
 assert.equal(await page.getByRole("heading",{name:"Equity and drawdown"}).count(),0);
 await page.getByRole("button",{name:"Reset filters",exact:true}).click();
 await page.getByText("9 trades",{exact:true}).first().waitFor();
 // Check the new visual hierarchy with a realistic trade density as well.
 await page.goto("http://127.0.0.1:4179/tests/analytics.html?dense=1");
 await page.getByRole("button",{name:"All",exact:true}).click();
 await page.getByText("126 trades",{exact:true}).first().waitFor();
 for(const width of [320,360,375,390,430,600,768,899,900,901,1024,1199,1200,1280,1440,1920,2560]) {
   console.log(`Checking responsive width ${width}`);
   await page.setViewportSize({width,height:1000});
   await page.locator("main").evaluate((element, width) => { element.style.maxWidth = "1440px"; element.style.width = `${width >= 768 ? width - 224 : width}px`; element.style.padding = "24px"; }, width);
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.waitForTimeout(150);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `Dense layout overflows at ${width}`);
   const clipped = await page.locator("section").evaluateAll(sections => sections.flatMap(section => [...section.querySelectorAll("span,p,button,input")].filter(el => {
     if(el.closest(".overflow-x-auto") || el.classList.contains("sr-only") || !el.getClientRects().length) return false;
     const r=el.getBoundingClientRect(), card=section.getBoundingClientRect();
     return r.width > 1 && (r.right > card.right+1 || r.left < card.left-1);
   }).map(el=>({text:el.textContent,tag:el.tagName,cls:el.className}))));
   assert.deepEqual(clipped,[], `Clipped card contents at ${width}: ${JSON.stringify(clipped)}`);
   const layout=await page.evaluate(()=>{
     const columns=selector=>getComputedStyle(document.querySelector(selector)).gridTemplateColumns.split(" ").length;
     return {width:document.querySelector(".analytics-page").clientWidth,outcomes:columns(".analytics-outcomes-grid"),kpis:columns(".analytics-hero-grid")};
   });
   assert.equal(layout.outcomes,layout.width>=900&&layout.width<1100?2:1,`Outcome columns at ${width}`);
   assert.equal(layout.kpis,layout.width>=760?4:2,`KPI columns at ${width}`);
   if([320,390,768,900,1024,1440,1920].includes(width)) await page.screenshot({path:`artifacts/analytics/modern-${width}.png`,fullPage:true});
 }
 console.log("Responsive widths passed");
 // Landscape and browser zoom both reduce the available CSS viewport.
 for(const [width,height] of [[844,390],[667,375],[320,568],[640,480]]) {
   await page.setViewportSize({width,height});
   await page.locator("main").evaluate(element=>{element.style.width="100%";});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `Overflow at ${width}x${height}`);
   if(height<=500) assert.equal(await page.locator(".analytics-filters").evaluate(el=>getComputedStyle(el).position),"static");
 }
 // Touch input exercises the actual cards, the scrolled heatmap and calendar.
 console.log("Landscape passed; checking touch");
 const touchContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const touchPage=await touchContext.newPage();
 touchPage.setDefaultTimeout(10000);
 touchPage.on("pageerror",error=>errors.push(error.message));
 await touchPage.goto("http://127.0.0.1:4179/tests/analytics.html?dense=1");
 await touchPage.getByRole("button",{name:"All",exact:true}).tap();
 console.log("Touch fixture ready");
 const winSegment=touchPage.getByRole("button",{name:/^Wins:/});
 const ringBox=await winSegment.boundingBox();
 await winSegment.tap({position:{x:ringBox.width-2,y:ringBox.height/2}});
 assert.equal(await touchPage.getByText("Wins",{exact:true}).count(),2);
 await touchPage.getByRole("button",{name:"Distribution",exact:true}).tap();
 await touchPage.getByText("How your R-multiples are distributed, in 0.5R buckets").waitFor();
 const heatmap=touchPage.getByRole("group",{name:"Trade performance by day and hour"});
 await heatmap.evaluate(el=>{el.scrollLeft=250;});
 const pinned=await heatmap.locator(".sticky").first().evaluate(el=>{
   const wrapper=el.closest(".overflow-x-auto");return Math.abs(el.getBoundingClientRect().left-wrapper.getBoundingClientRect().left)<32;
 });
 assert.ok(pinned,"Day labels should remain pinned when the heatmap scrolls");
 await touchPage.getByRole("button",{name:/Open trades for/}).first().tap();
 await touchPage.getByRole("dialog").waitFor();
 await touchContext.close();
 assert.deepEqual(errors,[]);
 console.log("Browser checks passed: filters, KPI text, donuts, crosshair, trade detail, distribution, heatmap, calendar, empty reset, 17 widths from 320px to 2560px, sidebar-aware layouts, landscape, and touch input.");
} finally {await browser?.close();await server.close();}
