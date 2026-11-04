import { test } from "node:test";
import assert from "node:assert/strict";
import { getUserTimezone, setUserTimezone } from "../src/lib/timezone.js";
import { riskDisplayAmount } from "../src/lib/analytics.js";
import { readFileSync, readdirSync } from "node:fs";
import { computeAnalytics, assertBreakdownTotals, availableUnits, effectiveStatus, breakEvenThresholdR, tradeAmount, filterTrades, getRangeBounds, niceTicks, buildDonutSegments, heatmapTone, buildCalendarGrid, buildCalendarWeeks, rangeMonthBounds, formatValue, sessionBands } from "../src/lib/analytics.js";

const trade = (r, index, extra={}) => ({id:index, pnl_r:r, entry_datetime:`2025-01-${String(index+1).padStart(2,"0")}T10:00:00`,asset:index%2?"EURUSD":"USDJPY",risk_percent:2,...extra});
const fixture = [2,-1,0,3,-2,-1,0,4].map((r,i)=>trade(r,i));
const close = (a,b) => assert.ok(Math.abs(a-b)<0.000001, `${a} != ${b}`);

test("saved conversion basis preserves risk and PnL independently of current capital",()=>{
 const saved={pnl_r:"2.000000",risk_percent:"1.000000",capital_basis:"10000",risk_amount:"100",pnl_amount:"200"};
 for(const currentCapital of [5000,10000,25000]) {
  assert.equal(tradeAmount(saved,"R",currentCapital),2);
  assert.equal(tradeAmount(saved,"USD",currentCapital),200);
  assert.equal(tradeAmount(saved,"PCT",currentCapital),2);
  assert.equal(riskDisplayAmount(saved,"R",currentCapital),1);
  assert.equal(riskDisplayAmount(saved,"USD",currentCapital),100);
  assert.equal(riskDisplayAmount(saved,"PCT",currentCapital),1);
 }
 const imported={...saved,pnl_r:"0.2",pnl_amount:"20",risk_amount:null,risk_percent:null};
 assert.equal(tradeAmount(imported,"R"),null);
 assert.equal(tradeAmount(imported,"USD"),20);
 assert.equal(tradeAmount(imported,"PCT"),0.2);
 assert.equal(riskDisplayAmount(imported,"USD"),null);
});

test("calendar and timing use the saved timezone without changing trade instants",()=>{
 const previous=getUserTimezone();
 try {
  setUserTimezone("Africa/Tunis");
  const instant="2026-11-03T23:45:00Z";
  const result=computeAnalytics([trade(1,0,{entry_datetime:instant})]);
  assert.equal(result.rows[0].dateKey,"2026-11-04");
  assert.equal(result.rows[0].date.getHours(),0);
  assert.equal(result.rows[0].date.getTime(),Date.parse(instant));
 } finally {setUserTimezone(previous);}
});

test("all metric formulas, baseline, ordering and BE-preserving streaks",()=>{
 const a=computeAnalytics([...fixture].reverse()); const s=a.summary;
 assert.equal(s.net,5); assert.equal(s.closedCount,8);
 assert.deepEqual([s.wins,s.losses,s.breakEven],[3,3,2]);
 assert.equal(s.winRate,37.5); assert.equal(s.decidedWinRate,50);
 assert.equal(s.grossProfit,9); assert.equal(s.grossLoss,-4);
 assert.equal(s.expectancy,0.63);assert.equal(s.avgWin,3);assert.equal(s.avgLoss,-1.33);
 assert.equal(s.payoff,2.25);assert.equal(s.profitFactor,2.25);
 assert.deepEqual(a.equityCurve.map(p=>p.equity),[0,2,1,1,4,2,1,1,5]);
 assert.deepEqual(a.drawdownCurve.map(p=>p.drawdown),[0,0,-1,-1,0,-2,-3,-3,0]);
 assert.equal(s.maxDrawdown,-3);assert.equal(s.recoveryFactor,1.7);
 assert.equal(s.maxWinStreak,1);assert.equal(s.maxLossStreak,2);
 assert.equal(s.avgWinStreak,1);assert.equal(s.avgLossStreak,1.5);
 const streak=computeAnalytics([1,0,2,-1,0,-1,3].map((r,i)=>trade(r,i))).summary;
 assert.equal(streak.maxWinStreak,2);assert.equal(streak.maxLossStreak,2);
 assert.equal(streak.avgWinStreak,1.5);assert.equal(streak.avgLossStreak,2);
});
test("journal BE threshold and explicit overrides match backend rules",()=>{
 assert.equal(breakEvenThresholdR({break_even_method:"ratio",break_even_value:"0.2"}),0.2);
 assert.equal(breakEvenThresholdR({breakEvenMethod:"profit",breakEvenValue:1,startingCapital:50}),2);
 assert.equal(effectiveStatus({pnl_r:0.2},0.2),"BE");
 assert.equal(effectiveStatus({pnl_r:-0.2},0.2),"BE");
 assert.equal(effectiveStatus({pnl_r:0.2,status:"WIN"},0.2),"WIN");
 assert.equal(effectiveStatus({pnl_r:null}),"OPEN");
 assert.equal(computeAnalytics([trade(0.1,0),trade(2,1)],{breakEvenThreshold:0.2}).summary.grossProfit,2);
});
test("unit conversions use each trade risk; unavailable units stay hidden",()=>{
 assert.equal(tradeAmount(trade(2,0),"USD",50),2);
 assert.equal(tradeAmount(trade(2,0),"PCT",50),4);
 assert.equal(tradeAmount({pnl_r:2,risk_amount:3},"USD"),6);
 assert.equal(tradeAmount({pnl_r:2},"USD",50),null);
 assert.deepEqual(availableUnits([{pnl_r:2}],50).map(o=>o.value),["R"]);
 assert.deepEqual(availableUnits(fixture,50).map(o=>o.value),["R","USD","PCT"]);
 assert.equal(computeAnalytics(fixture,{unit:"USD",startingCapital:50}).summary.net,5);
});
test("every breakdown reconciles for every preset and custom year",()=>{
 const now=new Date();const rows=Array.from({length:400},(_,i)=>({...trade((i%5)-2,0),id:i,entry_datetime:new Date(now.getFullYear()-1,0,i+1, i%24).toISOString()}));
 for(const range of ["YTD","3M","12M","ALL","CUSTOM"]){
   const selected=filterTrades(rows,{range,customRange:{start:"2025-01-01",end:"2025-12-31"}});
   for(const unit of ["R","USD","PCT"]) assertBreakdownTotals(computeAnalytics(selected,{unit,startingCapital:100}));
 }
 const filtered=filterTrades(fixture,{range:"CUSTOM",customRange:{start:"2025-01-02",end:"2025-01-04"},assets:["EURUSD"]});
 assert.equal(filtered.length,2); assertBreakdownTotals(computeAnalytics(filtered));
 const bounds=rangeMonthBounds(getRangeBounds("CUSTOM",{start:"2025-01-01",end:"2025-12-31"}),fixture);
 assert.equal(bounds.maxYear,2025);assert.equal(bounds.maxMonth,11);
});
test("nice ticks cover both signs, flat ranges, and expected round steps",()=>{
 assert.deepEqual(niceTicks(0,96.52,5),[0,20,40,60,80,100]);
 for(const [min,max] of [[-0.1,100],[-4.65,0],[-4,4],[0,0],[2,2]]){
  const t=niceTicks(min,max,5);assert.ok(t.length>1);assert.ok(t[0]<=min);assert.ok(t.at(-1)>=max);
  for(let i=2;i<t.length;i++) close(t[i]-t[i-1],t[1]-t[0]);
 }
});
test("donut dash geometry has a 2.5px gap and clockwise start at twelve",()=>{
 const c=2*Math.PI*50;const s=buildDonutSegments([67,49,10]);
 assert.equal(s[0].start,0);close(s.at(-1).end,1);
 s.forEach(x=>close((x.ratio-x.length)*c,2.5));
 assert.deepEqual(buildDonutSegments([0,0]),[]);
 assert.equal(buildDonutSegments([0,1])[0].length,0);
});
test("heatmap distinguishes empty and traded flat; color scales use full range",()=>{
 assert.equal(heatmapTone(0,10,0).background,"var(--surface-raised)");
 assert.equal(heatmapTone(0,10,1).intensity,0.18);
 assert.equal(heatmapTone(10,10,1).intensity,1);
 assert.match(heatmapTone(-5,10).background,/--loss/);
 close(heatmapTone(0,10,5,"trades").intensity,0.575);
 assert.match(heatmapTone(0,10,5,"trades").background,/--ink-muted/);
});
test("Monday calendar alignment, leading blanks and week totals",()=>{
 const grid=buildCalendarGrid(2025,0);assert.equal(grid.mondayOffset,2);
 assert.equal(grid.cells[0].inMonth,false);assert.equal(grid.cells[2].day,1);
 const a=computeAnalytics(fixture);const weeks=buildCalendarWeeks(2025,0,a.calendar);
 assert.equal(weeks.reduce((n,w)=>n+w.count,0),8);close(weeks.reduce((n,w)=>n+w.net,0),5);
 assert.equal(buildCalendarGrid(2024,1).cells.filter(c=>c.inMonth).length,29);
});
test("distribution lower bounds and BE are mutually exclusive and exhaustive",()=>{
 const a=computeAnalytics([-2,-1,-0.5,0,0.2,0.5,1,1.5,2,2.5,3,3.5,6].map((r,i)=>trade(r,i)));
 assert.equal(a.distribution.reduce((n,b)=>n+b.count,0),13);
 assert.deepEqual(a.distribution.map(b=>b.count),[1,1,1,1,1,1,1,1,1,1,1,2]);
});
test("session bands follow London and New York DST",()=>{
 const winter=sessionBands(new Date(2025,0,15),"UTC");const summer=sessionBands(new Date(2025,6,15),"UTC");
 assert.equal(winter.find(b=>b.label==="LDN + NY").start,13);
 assert.equal(summer.find(b=>b.label==="LDN + NY").start,12);
});
test("empty, all-winning, all-losing data and true minus formatting",()=>{
 const s=computeAnalytics([]).summary;assert.equal(s.net,0);assert.equal(s.payoff,null);
 assert.equal(computeAnalytics([trade(2,0)]).summary.profitFactor,null);
 assert.equal(computeAnalytics([trade(-2,0)]).summary.maxDrawdown,-2);
 assert.equal(formatValue(-4.65),"\u22124.65R");
});

test("analytics widgets contain no literal colors, smoothing, gradients or independent queries",()=>{
 for(const name of readdirSync(new URL("../src/components/analytics/",import.meta.url))){
  const source=readFileSync(new URL(`../src/components/analytics/${name}`,import.meta.url),"utf8");
  assert.doesNotMatch(source,/#[0-9a-f]{6}|linearGradient|type="monotone"|type="basis"|shadow-xl|uppercase|useAsyncQuery|fetchHubTrades/i,name);
 }
});
