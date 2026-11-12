// Authorized temporary account. Credentials/tokens stay in runner memory only.
import {randomUUID, randomBytes} from 'node:crypto';
import {appendFile,mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const base=process.env.PROBE_APP_URL||'https://tradetrack-frontend-psi.vercel.app';
const api=process.env.PROBE_API_URL||'https://tradetrack-backend-sx8d.onrender.com/api';
const rounds=Number(process.env.PROBE_ROUNDS||6);
if(!Number.isInteger(rounds)||rounds<1||rounds>10)throw new Error('Invalid round count');
const email=`latency-probe-${randomUUID()}@example.invalid`, password=randomBytes(30).toString('base64url');
if(process.env.GITHUB_ACTIONS)console.log(`::add-mask::${password}`);
const account={email,registered:false,userId:null,requiresDatabaseDeletion:true};
// Identity must survive a crashed test so the account can always be cleaned up.
console.log('TEMPORARY_PROBE_ACCOUNT '+JSON.stringify(account));
const r=x=>Number.isFinite(x)?Math.round(x*10)/10:null;
const safeUrl=url=>{const u=new URL(url);return u.origin+u.pathname;};
const redact=error=>String(error.message||error).replaceAll(password,'[redacted]').slice(0,600);
const samples=[],logoutResults=[];
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
let context;
try{
 const registration=await browser.newContext();
 try{
  const response=await registration.request.post(`${api}/auth/register/`,{data:{email,password,first_name:'Latency',last_name:'Probe'},timeout:60000});
  if(response.status()!==201)throw new Error(`Registration returned ${response.status()}`);
  account.registered=true;
  console.log('TEMPORARY_PROBE_ACCOUNT '+JSON.stringify(account));
 }finally{await registration.close();}
 for(let i=0;i<rounds;i++){
  const fresh=i%2===0;
  if(fresh){await context?.close();context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});}
  const page=await context.newPage();page.setDefaultTimeout(60000);
  const sample={round:i+1,browserCache:fresh?'fresh':'reused',requests:[]};
  const session=await context.newCDPSession(page),requests=new Map();
  await session.send('Network.enable');
  session.on('Network.requestWillBeSent',e=>{
   const u=new URL(e.request.url);
   if(u.origin===new URL(api).origin && (u.pathname.endsWith('/auth/login/')||u.pathname.endsWith('/journals/')||u.pathname.endsWith('/auth/me/')))
    requests.set(e.requestId,{url:safeUrl(e.request.url),method:e.request.method,start:e.timestamp});
  });
  session.on('Network.responseReceived',e=>{
   const q=requests.get(e.requestId);if(!q)return;
   const t=e.response.timing||{},headers=Object.fromEntries(Object.entries(e.response.headers).map(([k,v])=>[k.toLowerCase(),v]));
   Object.assign(q,{status:e.response.status,responseHeadersMs:r((e.timestamp-q.start)*1000),waitingForResponseMs:r(t.receiveHeadersStart>=0&&t.sendEnd>=0?t.receiveHeadersStart-t.sendEnd:NaN),serverTiming:headers['server-timing']||null});
  });
  session.on('Network.loadingFinished',e=>{const q=requests.get(e.requestId);if(q)q.totalMs=r((e.timestamp-q.start)*1000);});
  try{
   const opened=performance.now();
   await page.goto(new URL('/login',base).href,{waitUntil:'domcontentloaded',timeout:60000});
   await page.getByRole('button',{name:'Sign in',exact:true}).waitFor();
   sample.loginReadyMs=r(performance.now()-opened);
   await page.getByLabel('Email',{exact:true}).fill(email);
   await page.getByLabel('Password',{exact:true}).fill(password);
   await page.evaluate(()=>{
    document.querySelector('form').addEventListener('submit',()=>window.__probeStart=performance.now(),{once:true});
    const observer=new MutationObserver(()=>{
     if(!window.__probeStart)return;
     if(location.pathname==='/dashboard'&&document.querySelector('#main-content')&&!window.__probeShell)
      window.__probeShell=performance.now()-window.__probeStart;
     if(location.pathname==='/dashboard'&&document.body.innerText.includes('Welcome, Latency!')){
      window.__probeReady=performance.now()-window.__probeStart;observer.disconnect();
     }
    });
    observer.observe(document.body,{childList:true,subtree:true});
   });
   await page.getByRole('button',{name:'Sign in',exact:true}).click();
   await page.waitForFunction(()=>Number.isFinite(window.__probeReady),{},{timeout:60000});
   const timing=await page.evaluate(()=>({shell:window.__probeShell,ready:window.__probeReady}));
   sample.submitToDashboardShellMs=r(timing.shell);sample.submitToDashboardReadyMs=r(timing.ready);
   sample.success=true;
   // Record only the synthetic account ID, never JWTs or the user response.
   account.userId=await page.evaluate(()=>JSON.parse(localStorage.getItem('nexora_session_user')).id);
   // Measure the authenticated profile round trip independently of navigation.
   const access=await page.evaluate(()=>localStorage.getItem('access'));
   const start=performance.now();
   const response=await context.request.get(`${api}/auth/me/`,{headers:{Authorization:`Bearer ${access}`},timeout:20000});
   sample.profile={status:response.status(),totalMs:r(performance.now()-start),serverTiming:response.headers()['server-timing']||null};
   if(response.status()!==200)throw new Error('Authenticated profile check failed');
  }catch(error){sample.error=redact(error);}
  finally{
   // Revoke every issued refresh token before discarding browser credentials.
   const tokens=await page.evaluate(()=>({access:localStorage.getItem('access'),refresh:localStorage.getItem('refresh')})).catch(()=>({}));
   if(tokens.access&&tokens.refresh){
    try{
     const response=await context.request.post(`${api}/auth/logout/`,{headers:{Authorization:`Bearer ${tokens.access}`},data:{refresh:tokens.refresh},timeout:20000});
     logoutResults.push({round:i+1,status:response.status()});
    }catch(error){logoutResults.push({round:i+1,error:redact(error)});}
   }
   await page.evaluate(()=>{localStorage.removeItem('access');localStorage.removeItem('refresh');localStorage.removeItem('nexora_session_user');}).catch(()=>{});
   sample.requests=[...requests.values()].map(({start,...q})=>q);
   samples.push(sample);console.log(JSON.stringify(sample));await page.close();
  }
  if(sample.error)break;
 }
}catch(error){console.log('PROBE_ERROR '+redact(error));process.exitCode=1;}
finally{await browser.close();}
const times=samples.filter(s=>s.success&&!s.error).map(s=>s.submitToDashboardReadyMs).sort((a,b)=>a-b);
const report={measuredAt:new Date().toISOString(),app:base,api,account,successfulLoginMeasured:times.length>0,
 method:'Real Chromium, mobile viewport, no CPU/network emulation; fresh/reused browser cache does not establish server cold/warm state. Temporary empty account; does not measure a populated journal.',
 runner:process.env.GITHUB_ACTIONS?'GitHub-hosted ubuntu-24.04; geographic placement not controlled':'local',samples,logoutResults,
 summary:{samples:times.length,medianSubmitToDashboardReadyMs:times.length?r((times[Math.floor((times.length-1)/2)]+times[Math.ceil((times.length-1)/2)])/2):null,minMs:times[0]??null,maxMs:times.at(-1)??null}};
const output=process.env.PROBE_OUTPUT||'artifacts/production-latency';await mkdir(output,{recursive:true});await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));
console.log('PRODUCTION_SUCCESS_REPORT '+JSON.stringify(report));
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`## Successful sign-in measurements\n\n\`\`\`json\n${JSON.stringify(report,null,2)}\n\`\`\`\n`);
if(times.length!==rounds)process.exitCode=1;
