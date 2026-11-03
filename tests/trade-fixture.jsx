import React, {useState} from "react";
import {createRoot} from "react-dom/client";
import TradePanel from "../src/components/journal/TradePanel";
import {createTrade,updateTrade} from "../src/api/trades.api";
import api from "../src/api/axios";
import "../src/index.css";
const catalog={loading:false,assets:["EURUSD","GBPUSD"],setups:["Breakout","Pullback"],emotionTags:["Calm","Focused"],mistakeTags:["Overtraded"],assetMap:new Map([["EURUSD",1],["GBPUSD",2]]),setupMap:new Map([["Breakout",1],["Pullback",2]]),emotionMap:new Map([["Calm",1],["Focused",2]]),mistakeMap:new Map([["Overtraded",1]])};
for(const kind of ["Asset","Setup","EmotionTag","MistakeTag"]) {catalog[`add${kind}`]=()=>{};catalog[`remove${kind}`]=()=>{};catalog[`update${kind}`]=()=>{};}
let stored={id:1,asset:{id:1,symbol:"EURUSD"},side:"BUY",entry_datetime:"2026-11-03T10:45:32.123Z",exit_datetime:"2026-11-03T11:30:00Z",reference_timeframe:"D1",trade_score:0,emotions:[{id:1,label:"Calm"}],mistakes:[],screenshots:[],status:null};
const customMode=new URLSearchParams(location.search).has("custom");
let definitions=customMode?JSON.parse(localStorage.getItem("fixture-custom-definitions")||"[]"):[];
if(customMode&&localStorage.getItem("fixture-custom-trade")) stored=JSON.parse(localStorage.getItem("fixture-custom-trade"));
window.__tradeSaves=0;window.__definitionWrites=0;
api.defaults.adapter=async config=>{
 const reply=data=>({data,status:200,statusText:"OK",headers:{},config});
 if(config.url.endsWith("/custom-fields/")) {
  if(config.method!=="get") {
   const definition={...JSON.parse(config.data),id:definitions.length+1};definitions.push(definition);window.__definitionWrites++;
   if(customMode)localStorage.setItem("fixture-custom-definitions",JSON.stringify(definitions));
   return reply(definition);
  }
  return reply(definitions);
 }
 if(config.method!=="get") {
  const payload=JSON.parse(config.data);window.__tradePayload=payload;window.__tradeSaves++;
  stored={...stored,...payload,asset:{id:payload.asset_id,symbol:"EURUSD"},emotions:payload.emotion_ids.map(id=>({id,label:id===1?"Calm":"Focused"})),mistakes:[]};
  if(customMode)localStorage.setItem("fixture-custom-trade",JSON.stringify(stored));
 }
 return reply(stored);
};

function App(){
 const [open,setOpen]=useState(true);const [mode,setMode]=useState(new URLSearchParams(location.search).has("edit")?"edit":"new");const [trade,setTrade]=useState(stored);
 return <><button onClick={()=>{setMode("new");setOpen(true);}}>New trade</button><button onClick={()=>{setMode("edit");setOpen(true);}}>Edit saved trade</button><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}} data-testid="saved-trade">{JSON.stringify(trade)}</pre><TradePanel mode={mode} trade={mode==="edit"?trade:null} open={open} onClose={()=>setOpen(false)} onSave={async payload=>{const result=mode==="edit"?await updateTrade(1,trade.id,payload):await createTrade(1,payload);setTrade(result);return result;}} catalog={catalog} journalId={1}/></>;
}
createRoot(document.getElementById("root")).render(<App/>);
