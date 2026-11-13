// Real pages and providers; all API calls stay inside the synthetic fixture.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { chooseOption, chooseDate } from './picker-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const server = await createServer({define:{'import.meta.env.VITE_USE_MOCK':JSON.stringify('false')},server:{host:'127.0.0.1',port:4225,strictPort:true}});
await server.listen();
let browser;
try {
  browser = await chromium.launch({headless:true,channel:'chrome'});
  const context = await browser.newContext({viewport:{width:1440,height:1000},timezoneId:'America/Los_Angeles'});
  await context.addInitScript(() => { localStorage.setItem('access','picker-test');localStorage.setItem('last_journal_id','1');localStorage.setItem('nexora-theme','dark'); });
  const journals = [{id:1,name:'Picker test',starting_capital:10000,currency:'USD',break_even_method:'ratio',break_even_value:0}];
  const writes=[], errors=[];
  await context.route(url=>url.pathname.startsWith('/api/'), async route => {
    const request=route.request(),path=new URL(request.url()).pathname,method=request.method();
    const headers={'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PATCH,OPTIONS'};
    const reply=json=>route.fulfill({json,headers});
    if(method==='OPTIONS')return route.fulfill({status:204,headers});
    if(method!=='GET')writes.push({path,body:request.postDataJSON()});
    if(path==='/api/auth/me/')return reply({id:1,email:'picker@example.test',first_name:'Alex',timezone:'America/Los_Angeles'});
    if(path==='/api/journals/'){
      if(method==='POST'){const journal={id:2,...request.postDataJSON()};journals.push(journal);return reply(journal);}
      return reply(journals);
    }
    if(/^\/api\/journals\/\d+\/$/.test(path)){const journal=journals.find(j=>path.endsWith(`/${j.id}/`));if(method==='PATCH')Object.assign(journal,request.postDataJSON());return reply(journal);}
    if(path.endsWith('/coach/chat/'))return reply({configured:true});
    return reply([]);
  });
  const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4225/dashboard');
  await page.locator('#main-content').getByRole('button',{name:'New Journal',exact:true}).click();
  await page.getByLabel('Journal Name',{exact:true}).fill('Styled controls');
  await chooseOption(page,page.getByRole('combobox',{name:'Journal Type',exact:true}),'Backtest Journal');
  await page.getByLabel('Starting Capital',{exact:true}).fill('25000');
  // Keyboard typeahead and Enter select the currency in the custom list.
  await page.getByRole('combobox',{name:'Currency',exact:true}).focus();
  await page.keyboard.press('Enter');await page.getByRole('option',{name:'USD',exact:true}).waitFor();
  await page.keyboard.press('e');await page.waitForFunction(()=>document.activeElement?.textContent==='EUR');await page.keyboard.press('Enter');
  await chooseOption(page,page.getByRole('combobox',{name:'Break-Even Method',exact:true}),'Profit Based');
  await page.getByLabel('BE Threshold (currency)',{exact:true}).fill('12');
  await page.getByRole('button',{name:'Create Journal',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  assert.equal(writes.at(-1).body.break_even_method,'profit');assert.equal(writes.at(-1).body.break_even_value,12);
  // Currency and journal type have always been browser metadata; check that too.
  const stored=await page.evaluate(()=>Object.values(localStorage).join('\n'));
  assert.match(stored,/EUR/);assert.match(stored,/backtest/);
  await page.goto('http://127.0.0.1:4225/journal/2?tab=settings');
  await page.getByRole('button',{name:'Edit account settings',exact:true}).click();
  await chooseOption(page,page.getByRole('combobox',{name:'Type',exact:true}),'Trading Journal');
  await chooseOption(page,page.getByRole('combobox',{name:'Break-Even Method',exact:true}),'Ratio Based');
  await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
  assert.equal(writes.at(-1).body.break_even_method,'ratio');
  await page.goto('http://127.0.0.1:4225/journal/2?tab=breakdown');
  await chooseOption(page,page.getByRole('combobox',{name:'Breakdown period',exact:true}),'Last 3 months');
  assert.match(await page.getByRole('combobox',{name:'Breakdown period',exact:true}).innerText(),/Last 3 months/);
  await page.goto('http://127.0.0.1:4225/coach');
  await page.getByRole('button',{name:'Adjust output',exact:true}).click();
  await chooseOption(page,page.getByRole('combobox',{name:'Data period',exact:true}),'Custom dates');
  await chooseDate(page,page.getByRole('button',{name:'From',exact:true}),'2026-03-08');
  await chooseDate(page,page.getByRole('button',{name:'Through',exact:true}),'2026-03-10');
  await page.getByRole('button',{name:'Through',exact:true}).click();
  assert.equal(await page.locator('[data-day="2026-03-07"] button').isDisabled(),true);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'From',exact:true}).click();
  assert.equal(await page.locator('[data-day="2026-03-11"] button').isDisabled(),true);
  // March 8 is the US DST boundary: a date-only field must stay on March 8.
  assert.equal(await page.locator('[data-day="2026-03-08"]').getAttribute('data-selected'),'true');
  await page.keyboard.press('Escape');
  await page.locator('.trade-date-popover').waitFor({state:'hidden'});
  await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='From');
  await mkdir('artifacts/pickers',{recursive:true});
  for(const theme of ['dark','light']) {
    await page.evaluate(async theme => { const {setTheme}=await import('/src/lib/theme.js');setTheme(theme); },theme);
    for(const width of [1440,390,320]) {
      await page.setViewportSize({width,height:900});
      await page.getByRole('button',{name:'From',exact:true}).click();
      const popup=page.locator('.trade-date-popover');await popup.waitFor();
      await page.waitForTimeout(180);
      const box=await popup.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1,`Calendar fits ${theme} ${width}`);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.screenshot({path:`artifacts/pickers/calendar-${theme}-${width}.png`});
      await page.keyboard.press('Escape');
    }
  }
  assert.equal(await page.locator('input[type=date],input[type=time],input[type=datetime-local],input[type=color],datalist,select:visible').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: journal creation/settings payloads, keyboard dropdowns, Breakdown, DST-safe custom dates, date bounds, focus return, and light/dark calendars at 320/390/1440px.');
} finally {await browser?.close();await server.close();}
