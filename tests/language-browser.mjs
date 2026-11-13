import { chooseOption } from "./picker-helpers.mjs";
// Uses the built app and stubbed API responses; never writes to live accounts.
import assert from 'node:assert/strict';
import { preview } from 'vite';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const server = await preview({preview:{host:'127.0.0.1',port:4198,strictPort:true}});
let browser;
try {
  browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {channel:'chrome'})});
  const context = await browser.newContext({locale:'en-US'});
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors=[];
  let savedJournals=[];
  page.on('pageerror', error=>errors.push(error.message));
  await page.route('**/api/**', route => {
    const path=new URL(route.request().url()).pathname;
    return route.fulfill({json:path==='/api/auth/me/' ? {id:1,first_name:'Alice',email:'alice@example.test',timezone:'UTC'} : path==='/api/journals/' ? savedJournals : [],headers:{'access-control-allow-origin':'*'}});
  });
  await page.goto('http://127.0.0.1:4198');
  await chooseOption(page, page.getByRole('combobox',{name:'Select language'}), 'Français (FR)');
  await page.getByRole('link',{name:'Fonctionnalités',exact:true}).first().waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'),'fr-FR');
  assert.equal(await page.evaluate(()=>localStorage.getItem('nexora_language')),'fr-FR');
  await page.goto('http://127.0.0.1:4198/login');
  await page.getByRole('button',{name:'Se connecter',exact:true}).waitFor();
  await page.getByLabel('E-mail',{exact:true}).fill('keep@example.test');
  await chooseOption(page, page.getByRole('combobox',{name:'Choisir la langue'}), 'English (US)');
  assert.equal(await page.getByLabel('Email',{exact:true}).inputValue(),'keep@example.test');
  await chooseOption(page, page.getByRole('combobox',{name:'Select language'}), 'Français (FR)');
  await page.reload();
  await page.getByRole('button',{name:'Se connecter',exact:true}).waitFor();
  await page.getByRole('button',{name:'Se connecter',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'Saisissez une adresse e-mail valide'}).waitFor();
  await page.evaluate(()=>localStorage.setItem('access','test-token'));
  await page.goto('http://127.0.0.1:4198/dashboard');
  await page.getByRole('heading',{name:'Bienvenue, Alice !'}).waitFor();
  await page.getByRole('button',{name:'Menu du compte',exact:true}).click();
  await page.getByRole('menuitem',{name:'Paramètres',exact:true}).click();
  await page.getByRole('heading',{name:'Paramètres du compte'}).waitFor();
  await page.getByRole('button',{name:'Annuler',exact:true}).click();
  for(const width of [320,390,768,1280]) {
    await page.setViewportSize({width,height:900});
    const selector=page.getByRole('combobox',{name:'Choisir la langue'});
    await selector.waitFor({state:'visible'});
    await page.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth+1,{},{timeout:3000});
    const box=await selector.boundingBox();
    assert(box.x>=0 && box.x+box.width<=width,`Selector fits at ${width}px`);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`No overflow at ${width}px: ${JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll("body *")].filter(el=>el.getBoundingClientRect().right>innerWidth+1 && getComputedStyle(el).position!=="fixed").map(el=>({tag:el.tagName,text:el.textContent.slice(0,80),right:el.getBoundingClientRect().right})).slice(0,8)))}`);
  }
  await chooseOption(page, page.getByRole('combobox',{name:'Choisir la langue'}), 'English (US)');
  await page.getByRole('heading',{name:'Welcome, Alice!'}).waitFor();
  // Another tab's preference changes the current UI as well.
  const other=await context.newPage();
  await other.goto('http://127.0.0.1:4198/login');
  await chooseOption(other, other.getByRole('combobox',{name:'Select language'}), 'Français (FR)');
  await page.getByRole('heading',{name:'Bienvenue, Alice !'}).waitFor();
  // User content that happens to match a translation key must keep its spelling.
  savedJournals=[{id:1,name:'Dashboard',journalType:'trading',startingCapital:10000,starting_capital:10000,currency:'USD',breakEvenMethod:'ratio',breakEvenValue:0}];
  await page.goto('http://127.0.0.1:4198/dashboard');
  await page.getByRole('button',{name:'Dashboard',exact:true}).click();
  await page.getByRole('heading',{name:'Vue d’ensemble',exact:true}).waitFor();
  await page.getByRole('button',{name:'Changer de journal',exact:true}).getByText('Dashboard',{exact:true}).waitFor();
  await page.locator('#app-navigation').getByRole('link',{name:'Journal',exact:true}).click();
  await page.getByRole('button',{name:'Nouveau trade',exact:true}).click();
  await page.getByRole('button',{name:'UT de référence',exact:true}).waitFor();
  await page.getByRole('button',{name:'Date et heure d’entrée',exact:true}).click();
  await page.getByText('Heure (format 24 h)',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Terminé',exact:true}).click();
  await page.keyboard.press('Escape');
  assert.deepEqual(errors,[]);
  await context.close();
  // A stale/invalid preference must fall back to English.
  const invalid=await browser.newContext();
  await invalid.addInitScript(()=>localStorage.setItem('nexora_language','de-DE'));
  const fallback=await invalid.newPage();
  await fallback.goto('http://127.0.0.1:4198/login');
  await fallback.getByRole('button',{name:'Sign in',exact:true}).waitFor();
  assert.equal(await fallback.locator('html').getAttribute('lang'),'en-US');
  await invalid.close();
  console.log('PASS: FR/US selection, navigation/reload persistence, preserved form input, French validation, settings, responsive header, cross-tab sync and invalid preference fallback.');
} finally {
  await browser?.close();
  await new Promise(resolve=>server.httpServer.close(resolve));
}
