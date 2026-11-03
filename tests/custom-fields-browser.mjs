import assert from "node:assert/strict";
import {createServer} from "vite";
import {pathToFileURL} from "node:url";
import {mkdir} from "node:fs/promises";
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:"playwright");
const server=await createServer({define:{"import.meta.env.VITE_USE_MOCK":JSON.stringify("false")},server:{host:"127.0.0.1",port:4181}});
await server.listen();let browser;
try {
 browser=await chromium.launch({headless:true,channel:"chrome",timeout:15000});
 const page=await browser.newPage({viewport:{width:1280,height:900}});page.setDefaultTimeout(10000);
 const errors=[];page.on("pageerror",error=>errors.push(error.message));
 await page.goto("http://127.0.0.1:4181/tests/trade-form.html?custom=1&edit=1");
 assert.equal(await page.getByRole("button",{name:/Add custom field to/}).count(),6);
 async function add(section,label,type,options="") {
  await page.getByRole("button",{name:`Add custom field to ${section}`,exact:true}).click();
  await page.getByLabel("Field name",{exact:true}).fill(label);
  await page.getByRole("combobox",{name:"Field type",exact:true}).click();
  await page.getByRole("option",{name:type,exact:true}).click();
  if(options)await page.getByLabel("Options",{exact:true}).fill(options);
  await page.getByRole("button",{name:"Add field",exact:true}).click();
  await page.getByRole("heading",{name:`Add field to ${section}`,exact:true}).waitFor({state:"hidden"});
  assert.equal(await page.evaluate(()=>window.__tradeSaves),0,"Adding a field must not submit its parent trade form");
 }
 await add("Setup","Market condition","Dropdown","Trending\nRanging");
 await page.getByRole("combobox",{name:"Market condition",exact:true}).click();
 await page.getByRole("option",{name:"Trending",exact:true}).click();
 await add("Execution","Confidence","Number");await page.getByRole("spinbutton",{name:"Confidence",exact:true}).fill("0");
 await add("Psychology","Followed plan","Yes / no");
 await page.getByRole("combobox",{name:"Followed plan",exact:true}).click();await page.getByRole("option",{name:"No",exact:true}).click();
 await add("Notes","Review tag","Text");await page.getByRole("textbox",{name:"Review tag",exact:true}).fill("Patient");
 await add("Performance","Risk plan","Text");await page.getByRole("textbox",{name:"Risk plan",exact:true}).fill("Fixed risk");
 await add("Trade notes","Reviewer","Text");await page.getByRole("textbox",{name:"Reviewer",exact:true}).fill("Self");
 await page.getByRole("button",{name:"Save Trade",exact:true}).click();await page.getByRole("dialog").waitFor({state:"hidden"});
 const saved=await page.evaluate(()=>window.__tradePayload.custom_fields);
 assert.deepEqual(saved,{"1":"Trending","2":0,"3":false,"4":"Patient","5":"Fixed risk","6":"Self"});
 await page.reload();
 assert.equal(await page.getByRole("textbox",{name:"Review tag",exact:true}).inputValue(),"Patient");
 assert.equal(await page.getByRole("spinbutton",{name:"Confidence",exact:true}).inputValue(),"0");
 assert.match(await page.getByRole("combobox",{name:"Followed plan",exact:true}).innerText(),/No/);
 await page.getByRole("button",{name:"Cancel",exact:true}).click();await page.getByRole("button",{name:"New trade",exact:true}).click();
 assert.equal(await page.getByRole("textbox",{name:"Review tag",exact:true}).inputValue(),"");
 assert.match(await page.getByRole("combobox",{name:"Market condition",exact:true}).innerText(),/Select an option/);
 await page.setViewportSize({width:320,height:844});
 await page.getByRole("button",{name:"Add custom field to Setup",exact:true}).click();
 await mkdir("artifacts/trade-form",{recursive:true});await page.screenshot({path:"artifacts/trade-form/custom-field-320.png",fullPage:true});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);
 console.log("Custom field checks passed: all six sections, typed values, persistence/reopen, reusable definitions, independent drafts, no parent-form submission, and 320px layout.");
}finally{await browser?.close();await server.close();}
