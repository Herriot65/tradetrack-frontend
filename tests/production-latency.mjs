// Measures the deployed UI with intentionally invalid synthetic credentials.
// No real account, auth token, request body, or full HAR is collected.
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base = process.env.PROBE_APP_URL || 'https://tradetrack-frontend-psi.vercel.app';
const rounds = Number(process.env.PROBE_ROUNDS || 6);
if (!Number.isInteger(rounds) || rounds < 1 || rounds > 10) throw new Error('PROBE_ROUNDS must be 1–10');
const destination = process.env.PROBE_OUTPUT || 'artifacts/production-latency';
const safeUrl = url => { const u = new URL(url); return u.origin + u.pathname; };
const rounded = x => Number.isFinite(x) ? Math.round(x * 10) / 10 : null;
const results = [];
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}) });
let context;
try {
  for (let i = 0; i < rounds; i++) {
    // New contexts discard browser cache; paired warm runs reuse it. This does
    // not force the hosting platform to sleep or establish a server cold start.
    const fresh = i % 2 === 0;
    if (fresh) {
      await context?.close();
      context = await browser.newContext({ viewport: {width:390,height:844}, isMobile:true, hasTouch:true });
    }
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    const sample = { round:i+1, browserCache:fresh?'fresh':'reused', api:[], failures:[] };
    const session = await context.newCDPSession(page);
    const requests = new Map();
    await session.send('Network.enable');
    session.on('Network.requestWillBeSent', e => {
      if (e.request.url.includes('/auth/login/')) requests.set(e.requestId, {url:safeUrl(e.request.url),method:e.request.method,start:e.timestamp});
    });
    session.on('Network.responseReceived', e => {
      const request = requests.get(e.requestId);
      if (!request) return;
      const timing = e.response.timing || {};
      const headers = Object.fromEntries(Object.entries(e.response.headers).map(([k,v])=>[k.toLowerCase(),v]));
      Object.assign(request, {
        status:e.response.status,
        responseHeadersMs:rounded((e.timestamp-request.start)*1000),
        waitingForResponseMs:rounded(timing.receiveHeadersStart >= 0 && timing.sendEnd >= 0 ? timing.receiveHeadersStart-timing.sendEnd : NaN),
        dnsMs:rounded(timing.dnsStart>=0 ? timing.dnsEnd-timing.dnsStart : NaN),
        connectMs:rounded(timing.connectStart>=0 ? timing.connectEnd-timing.connectStart : NaN),
        tlsMs:rounded(timing.sslStart>=0 ? timing.sslEnd-timing.sslStart : NaN),
        serverTiming:headers['server-timing'] || null,
      });
    });
    session.on('Network.loadingFinished', e => {
      const request=requests.get(e.requestId);
      if(request)request.totalMs=rounded((e.timestamp-request.start)*1000);
    });
    page.on('requestfailed', request => sample.failures.push({url:safeUrl(request.url()),error:request.failure()?.errorText}));
    try {
      const opened=performance.now();
      const response=await page.goto(new URL('/login',base).href,{waitUntil:'domcontentloaded',timeout:60000});
      sample.pageStatus=response.status();
      await page.getByRole('button',{name:'Sign in',exact:true}).waitFor();
      sample.loginReadyMs=rounded(performance.now()-opened);
      sample.navigation=await page.evaluate(()=>{
        const n=performance.getEntriesByType('navigation')[0];
        return {documentTtfbMs:Math.round(n.responseStart-n.requestStart),domContentLoadedMs:Math.round(n.domContentLoadedEventEnd),firstContentfulPaintMs:performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null};
      });
      await page.getByLabel('Email',{exact:true}).fill(`latency-probe-${i}@example.invalid`);
      await page.getByLabel('Password',{exact:true}).fill('SyntheticMeasurement123!');
      // Timestamp in the browser itself, avoiding automation/transport latency.
      await page.evaluate(()=>{
        document.querySelector('form').addEventListener('submit',()=>window.__probeStart=performance.now(),{once:true});
        const observer=new MutationObserver(()=>{
          if(window.__probeStart && document.querySelector('[role="alert"]')) {
            window.__probeElapsed=performance.now()-window.__probeStart;
            observer.disconnect();
          }
        });
        observer.observe(document.body,{childList:true,subtree:true});
      });
      await page.getByRole('button',{name:'Sign in',exact:true}).click();
      await page.waitForFunction(()=>Number.isFinite(window.__probeElapsed),{},{timeout:60000});
      sample.submitToErrorMs=rounded(await page.evaluate(()=>window.__probeElapsed));
      sample.expectedRejection=await page.getByRole('alert').innerText().then(text=>/Invalid email or password/i.test(text));
      await page.getByRole('button',{name:'Sign in',exact:true}).waitFor({state:'visible'});
    } catch(error) {
      sample.error=String(error.message).slice(0,600);
    } finally {
      sample.api=[...requests.values()].map(({start,...rest})=>rest);
      results.push(sample);
      console.log(JSON.stringify(sample));
      await page.close();
    }
    if(sample.error) break;
  }
} finally { await browser.close(); }
const successfulMeasurements=results.filter(r=>r.expectedRejection && Number.isFinite(r.submitToErrorMs));
const durations=successfulMeasurements.map(r=>r.submitToErrorMs).sort((a,b)=>a-b);
const report={
  measuredAt:new Date().toISOString(), app:base,
  method:'Real Chromium, mobile viewport, no CPU/network emulation. Synthetic rejected login only. Browser-cache labels do not imply hosting cold/warm state.',
  runner:process.env.GITHUB_ACTIONS?'GitHub-hosted ubuntu-24.04; geographic placement not controlled':'local',
  successfulLoginMeasured:false,results,
  summary:{samples:durations.length,medianRejectedLoginMs:durations.length?rounded((durations[Math.floor((durations.length-1)/2)]+durations[Math.ceil((durations.length-1)/2)])/2):null,minMs:durations[0]??null,maxMs:durations.at(-1)??null},
};
await mkdir(destination,{recursive:true});
await writeFile(`${destination}/report.json`,JSON.stringify(report,null,2));
console.log('PRODUCTION_LATENCY_REPORT '+JSON.stringify(report));
if(process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY,`## Production latency\n\n${report.method}\n\n\`\`\`json\n${JSON.stringify(report,null,2)}\n\`\`\`\n`);
if(successfulMeasurements.length !== rounds)process.exitCode=1;
