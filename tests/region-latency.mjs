// Read-only behavior checks. All credentials are intentionally invalid;
// blank-password registration must be rejected and never creates an account.
import {mkdir,writeFile,appendFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {request}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin='https://tradetrack-frontend-psi.vercel.app';
const hosts={ohio:'https://tradetrack-backend-sx8d.onrender.com/api',frankfurt:'https://tradetrack-backend-frankfurt-fxf1.onrender.com/api'};
const client=await request.newContext();
const samples=[],checks=[];
const round=n=>Math.round(n*10)/10;
const phases=header=>Object.fromEntries((header||'').split(',').map(s=>s.trim().split(';dur=')).filter(([,n])=>n!==undefined).map(([k,n])=>[k,Number(n)]));
try{
 for(const [region,base] of Object.entries(hosts)){
  const preflight=await client.fetch(`${base}/auth/login/`,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'},timeout:30000});
  if(preflight.status()!==200||preflight.headers()['access-control-allow-origin']!==origin)throw new Error(`${region}: preflight/CORS check failed`);
  const unauth=await client.get(`${base}/auth/me/`,{headers:{Origin:origin},timeout:20000});
  if(unauth.status()!==401)throw new Error(`${region}: unauthenticated access must be rejected`);
  checks.push({region,cors:true,unauthenticatedProfileStatus:unauth.status()});
 }
 for(let i=0;i<6;i++)for(const [region,base] of (i%2?Object.entries(hosts).reverse():Object.entries(hosts))){
  const start=performance.now();
  const response=await client.post(`${base}/auth/login/`,{headers:{Origin:origin},data:{email:'region-probe@example.invalid',password:'SyntheticProbe123!'},timeout:30000});
  const sample={region,sample:i+1,status:response.status(),totalMs:round(performance.now()-start),phases:phases(response.headers()['server-timing'])};
  if(sample.status!==401||!Number.isFinite(sample.phases.password_cpu)||response.headers()['access-control-allow-origin']!==origin)throw new Error(`${region}: login/timing/CORS verification failed`);
  samples.push(sample);
 }
 for(const [region,base] of Object.entries(hosts))for(let i=0;i<3;i++){
  const start=performance.now();
  const response=await client.post(`${base}/auth/register/`,{data:{email:'region-probe@example.invalid',password:''},timeout:30000});
  if(response.status()!==400||!(await response.json()).password)throw new Error(`${region}: blank-password validation did not reject the request`);
  checks.push({region,type:'database_backed_validation',sample:i+1,status:response.status(),totalMs:round(performance.now()-start),phases:phases(response.headers()['server-timing'])});
 }
}finally{await client.dispose();}
const median=values=>{const s=values.toSorted((a,b)=>a-b);return round((s[Math.floor((s.length-1)/2)]+s[Math.ceil((s.length-1)/2)])/2);};
const summary=Object.fromEntries(Object.keys(hosts).map(region=>{
 const s=samples.filter(s=>s.region===region);
 return[region,{samples:s.length,medianTotalMs:median(s.map(s=>s.totalMs)),medianAppMs:median(s.map(s=>s.phases.app)),medianLookupMs:median(s.map(s=>s.phases.user_lookup)),medianPasswordMs:median(s.map(s=>s.phases.password)),medianPasswordCpuMs:median(s.map(s=>s.phases.password_cpu))}];
}));
const report={measuredAt:new Date().toISOString(),method:'Alternating regional API requests on one GitHub runner; no successful login or account creation. Test-runner location is not controlled.',hosts,checks,samples,summary};
await mkdir('artifacts/production-latency',{recursive:true});await writeFile('artifacts/production-latency/report.json',JSON.stringify(report,null,2));
console.log('REGION_LATENCY_REPORT '+JSON.stringify(report));
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`## Regional migration verification\n\n\`\`\`json\n${JSON.stringify(report,null,2)}\n\`\`\`\n`);
