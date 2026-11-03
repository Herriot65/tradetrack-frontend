import React from "react";
import {createRoot} from "react-dom/client";
import {JournalContext} from "../src/journals/JournalContext";
import TradesTab from "../src/components/journal/TradesTab";
import api from "../src/api/axios";
import "../src/index.css";
const rows=Array.from({length:65},(_,i)=>({id:i+1,asset:{id:i%3+1,symbol:["EURUSD","GBPUSD","USDJPY"][i%3]},side:"BUY",entry_datetime:new Date(Date.UTC(2026,9,30-i,10)).toISOString(),exit_datetime:new Date(Date.UTC(2026,9,30-i,11)).toISOString(),pnl_r:String(i<40?-1:i-39),status:null,effective_status:i<40?"LOSS":"WIN",emotions:[],mistakes:[]}));
window.__tradeRequests=[];
api.defaults.adapter=async config=>{
 const reply=data=>({data,status:200,statusText:"OK",headers:{},config});
 if(config.url.endsWith("/trades/")) {
  const params=config.params??{};window.__tradeRequests.push(params);
  await new Promise(resolve=>setTimeout(resolve,120));
  const filtered=rows.filter(row=>(!params.status||row.effective_status===params.status)&&(!params.search||row.asset.symbol.toLowerCase().includes(params.search.toLowerCase())));
  const order=params.ordering||"-entry_datetime";const field=order.split(",")[0];const desc=field.startsWith("-");const key=desc?field.slice(1):field;
  filtered.sort((a,b)=>{const value=row=>key==="pnl_r"?Number(row.pnl_r):key==="asset__symbol"?row.asset.symbol:row[key];const first=value(a),second=value(b);return (first<second?-1:first>second?1:0)*(desc?-1:1);});
  const start=((params.page||1)-1)*20;return reply({count:filtered.length,results:filtered.slice(start,start+20)});
 }
 if(config.url.endsWith("/assets/")) return reply([{id:1,symbol:"EURUSD"},{id:2,symbol:"GBPUSD"},{id:3,symbol:"USDJPY"}]);
 if(config.url.endsWith("/emotion-tags/"))return reply([{id:1,label:"Calm"}]);
 return reply([]);
};
createRoot(document.getElementById("root")).render(<JournalContext.Provider value={{activeWorkspace:{id:1},activeJournal:{id:1}}}><main style={{padding:16,maxWidth:1280,margin:"auto"}}><TradesTab journalId={1} /></main></JournalContext.Provider>);
