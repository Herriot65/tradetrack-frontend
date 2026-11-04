import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBreakdown} from '../src/lib/breakdown.js';
const trade = (pnl_r, extra={}) => ({pnl_r, setup:{label:'Breakout'}, ...extra});
test('category expectancy, payoff, quartiles and manual status use closed measurable trades',()=>{
 const {rows,excluded}=buildBreakdown([trade(2),trade(-1),trade(0),trade(null),trade(3,{status:'BE'}),trade(2,{capital_basis:10000,pnl_amount:100,risk_percent:0})],'setup');
 assert.equal(excluded,2);const row=rows[0];
 assert.equal(row.n,4);assert.equal(row.mean,1);assert.equal(row.total,4);
 assert.equal(row.winRate,25);assert.equal(row.avgWin,2);assert.equal(row.avgLoss,-1);
 assert.equal(row.median,1);assert.equal(row.q1,-.25);assert.equal(row.q3,2.25);
});
test('multi-tag categories deduplicate per trade, preserve overlaps, and omit missing tags',()=>{
 const {rows,unassigned}=buildBreakdown([trade(2,{emotions:[{label:'Calm'},{label:'Calm'},{label:'Focused'}]}),trade(-1,{emotions:[]})],'emotions');
 assert.equal(rows.length,2);assert.equal(unassigned,1);assert.ok(rows.every(row=>row.n===1&&row.total===2));
});
test('journal break-even threshold and capital-based R are respected',()=>{
 const {rows}=buildBreakdown([trade(.1),trade(1,{capital_basis:10000,pnl_amount:200,risk_percent:1,risk_amount:100})],'setup',{breakEvenMethod:'ratio',breakEvenValue:.2});
 assert.equal(rows[0].be,1);assert.equal(rows[0].total,2.1);
});
