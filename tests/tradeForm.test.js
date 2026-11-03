import { test } from "node:test";
import assert from "node:assert/strict";
import { tradeSchema } from "../src/schemas/tradeSchema.js";
import { parseTradeDateTime, toTradeDateTimeInput, fromTradeDateTimeInput, changeTradeDate, changeTradeTime } from "../src/lib/tradeDateTime.js";
const valid = {asset:"EURUSD",side:"BUY",entry_datetime:"2026-11-03T10:00:00.123",exit_datetime:"",emotions:["Calm"],mistakes:[],reference_timeframe:"H4"};

test("trade score accepts zero/ten, optional blanks, and rejects invalid scores",()=>{
 for(const value of [0,10,"7"]){const result=tradeSchema.parse({...valid,trade_score:value});assert.equal(result.trade_score,Number(value));}
 assert.equal(tradeSchema.parse({...valid,trade_score:""}).trade_score,null);
 for(const value of [-1,11,4.5,"invalid"]) assert.equal(tradeSchema.safeParse({...valid,trade_score:value}).success,false);
 assert.equal(tradeSchema.parse(valid).reference_timeframe,"H4");
});
test("date conversion preserves UTC instants, sub-minute precision, and zero P&L",()=>{
 for(const iso of ["2026-11-03T10:45:32.123Z","2026-11-03T00:15:00+05:30","2026-03-08T01:30:00-05:00"]){
  assert.equal(fromTradeDateTimeInput(toTradeDateTimeInput(iso)),new Date(iso).toISOString());
 }
 assert.equal(fromTradeDateTimeInput("2026-11-03T10:45"),"2026-11-03T10:45:00.000Z");
 assert.equal(tradeSchema.parse({...valid,pnl_r:0}).pnl_r,0);
});
test("calendar and time changes retain the other fields including seconds",()=>{
 const value="2026-11-03T10:45:32.123";
 assert.equal(changeTradeDate(value,new Date("2026-11-05T00:00:00Z")),"2026-11-05T10:45:32.123");
 assert.equal(changeTradeTime(value,"hour","08"),"2026-11-03T08:45:32.123");
 assert.equal(changeTradeTime(value,"minute","00"),"2026-11-03T10:00:32.123");
});
test("invalid/rolled-over dates and reversed exit times are rejected",()=>{
 for(const value of ["2026-02-30T10:00","2026-11-03T24:00","2026-11-03T10:65","bad-date"]){
  assert.equal(parseTradeDateTime(value),null);assert.equal(tradeSchema.safeParse({...valid,entry_datetime:value}).success,false);
 }
 assert.equal(tradeSchema.safeParse({...valid,exit_datetime:"2026-11-03T09:00"}).success,false);
 assert.equal(tradeSchema.safeParse({...valid,exit_datetime:valid.entry_datetime}).success,false);
 assert.equal(tradeSchema.safeParse({...valid,exit_datetime:"2026-11-03T11:00"}).success,true);
});
