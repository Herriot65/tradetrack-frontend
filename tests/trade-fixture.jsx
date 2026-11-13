import { AuthContext } from "../src/auth/AuthContext";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import TradeDetailPanel from "../src/components/journal/TradeDetailPanel";
import TradePanel from "../src/components/journal/TradePanel";
import { createTrade, updateTrade } from "../src/api/trades.api";
import api from "../src/api/axios";
import "../src/index.css";
import { JournalContext } from "../src/journals/JournalContext";
import { setUserTimezone } from "../src/lib/timezone";
setUserTimezone("UTC");
const catalog = {
  loading: false,
  assets: ["EURUSD", "GBPUSD"],
  setups: ["Breakout", "Pullback"],
  emotionTags: ["Calm", "Focused"],
  mistakeTags: ["Overtraded"],
  assetMap: new Map([
    ["EURUSD", 1],
    ["GBPUSD", 2],
  ]),
  setupMap: new Map([
    ["Breakout", 1],
    ["Pullback", 2],
  ]),
  emotionMap: new Map([
    ["Calm", 1],
    ["Focused", 2],
  ]),
  mistakeMap: new Map([["Overtraded", 1]]),
};
for (const kind of ["Asset", "Setup", "EmotionTag", "MistakeTag"]) {
  catalog[`add${kind}`] = () => {};
  catalog[`remove${kind}`] = () => {};
  catalog[`update${kind}`] = () => {};
}
let stored = {
  id: 1,
  asset: { id: 1, symbol: "EURUSD" },
  side: "BUY",
  entry_datetime: "2026-11-03T10:45:32.123Z",
  exit_datetime: "2026-11-03T11:30:00Z",
  reference_timeframe: "D1",
  trade_score: 0,
  emotions: [{ id: 1, label: "Calm" }],
  mistakes: [],
  screenshots: [],
  status: null,
};
const customMode = new URLSearchParams(location.search).has("custom");
let definitions = customMode
  ? JSON.parse(localStorage.getItem("fixture-custom-definitions") || "[]")
  : [];
if (customMode && localStorage.getItem("fixture-custom-trade"))
  stored = JSON.parse(localStorage.getItem("fixture-custom-trade"));
window.__tradeSaves = 0;
window.__imageUploads = 0;
window.__imageDeletes = 0;
window.__uploadAttempts=[];window.__uploadedFileSizes=[];
window.__uploadedImages = [];
window.__definitionWrites = 0;
api.defaults.adapter = async (config) => {
  const reply = (data) => ({ data, status: 200, statusText: "OK", headers: {}, config });
  if(config.url.includes('/drafts/')) {
    if(!new URLSearchParams(location.search).has('cloud')){const error=new Error('Cloud offline in this fixture');error.response={status:503};throw error;}
    const response=await fetch('/__cloud'+config.url,{method:config.method.toUpperCase(),body:config.method==='get'?undefined:config.data,headers:config.data instanceof FormData?undefined:{'Content-Type':'application/json'}});
    const data=config.responseType==='blob'?await response.blob():await response.json();
    if(!response.ok){const error=new Error(data.detail??'Cloud request failed');error.response={status:response.status,data};throw error;}
    return reply(data);
  }
  const customDetail=config.url.match(/\/custom-fields\/(\d+)\/$/);
  if(customDetail && config.method==='delete') {
    const id=Number(customDetail[1]);definitions=definitions.filter(field=>field.id!==id);
    if(stored.custom_fields)delete stored.custom_fields[String(id)];
    localStorage.setItem('fixture-custom-definitions',JSON.stringify(definitions));
    if(customMode)localStorage.setItem('fixture-custom-trade',JSON.stringify(stored));
    return reply(null);
  }
  if (customDetail && config.method==='patch') {
    const id=Number(customDetail[1]),field=definitions.find(field=>field.id===id),changes=JSON.parse(config.data);
    if(changes.label && (window.__failFieldRename || definitions.some(other=>other.id!==id && other.section===field.section && other.label.toLowerCase()===changes.label.trim().toLowerCase()))) {
      window.__failFieldRename=false;const error=new Error('Unable to rename field.');error.response={data:{label:['A field with this name already exists in this section.']}};throw error;
    }
    Object.assign(field,changes);
    localStorage.setItem('fixture-custom-definitions',JSON.stringify(definitions));
    return reply(field);
  }
  if (config.url.endsWith("/custom-fields/")) {
    if (config.url.includes('/screenshots/')) {
    if(config.method==='delete') {
      window.__imageDeletes++;
      const id=Number(config.url.match(/screenshots\/([^/]+)\//)?.[1]);
      stored.screenshots=(stored.screenshots??[]).filter(image=>Number(image.id)!==id);
      if(customMode)localStorage.setItem('fixture-custom-trade',JSON.stringify(stored));
      return reply(null);
    }
    if (config.method === 'post') {
      const file=config.data.get('file');window.__uploadAttempts.push(file.name);window.__uploadedFileSizes.push({name:file.name,size:file.size,type:file.type});
      config.onUploadProgress?.({loaded:Math.floor(file.size/2),total:file.size});
      if(window.__slowUploads)await new Promise(resolve=>setTimeout(resolve,800));
      if(window.__failUploadName===file.name){window.__failUploadName=null;throw new Error('Synthetic individual upload failure');}
      config.onUploadProgress?.({loaded:file.size,total:file.size});
      window.__imageUploads++;
      const image={id:Date.now()+Math.random(),image_url:await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(config.data.get('file'));}),section:config.data.get('section'),display_width:Number(config.data.get('display_width')||100)};
      window.__uploadedImages.push({name:config.data.get('file').name,id:image.id});stored.screenshots=[...(stored.screenshots??[]),image];if(customMode)localStorage.setItem("fixture-custom-trade",JSON.stringify(stored));return reply(image);
    }
    if(config.method==='patch') {
      if(window.__failImageWidthOnce){window.__failImageWidthOnce=false;throw new Error('Synthetic image metadata failure');}
      const changes=JSON.parse(config.data);const image=stored.screenshots.find(image=>config.url.includes('/'+image.id+'/'));Object.assign(image,changes);if(customMode)localStorage.setItem("fixture-custom-trade",JSON.stringify(stored));return reply(image);
    }
  }
  if (config.method !== "get") {
      const definition = { ...JSON.parse(config.data), id: definitions.length + 1 };
      definitions.push(definition);
      window.__definitionWrites++;
      if (customMode)
        localStorage.setItem("fixture-custom-definitions", JSON.stringify(definitions));
      return reply(definition);
    }
    return reply(definitions);
  }
  if (config.url.includes('/screenshots/')) {
    if(config.method==='delete') {
      window.__imageDeletes++;
      const id=Number(config.url.match(/screenshots\/([^/]+)\//)?.[1]);
      stored.screenshots=(stored.screenshots??[]).filter(image=>Number(image.id)!==id);
      if(customMode)localStorage.setItem('fixture-custom-trade',JSON.stringify(stored));
      return reply(null);
    }
    if (config.method === 'post') {
      const file=config.data.get('file');window.__uploadAttempts.push(file.name);window.__uploadedFileSizes.push({name:file.name,size:file.size,type:file.type});
      config.onUploadProgress?.({loaded:Math.floor(file.size/2),total:file.size});
      if(window.__slowUploads)await new Promise(resolve=>setTimeout(resolve,800));
      if(window.__failUploadName===file.name){window.__failUploadName=null;throw new Error('Synthetic individual upload failure');}
      config.onUploadProgress?.({loaded:file.size,total:file.size});
      window.__imageUploads++;
      const image={id:Date.now()+Math.random(),image_url:await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(config.data.get('file'));}),section:config.data.get('section'),display_width:Number(config.data.get('display_width')||100)};
      window.__uploadedImages.push({name:config.data.get('file').name,id:image.id});stored.screenshots=[...(stored.screenshots??[]),image];if(customMode)localStorage.setItem("fixture-custom-trade",JSON.stringify(stored));return reply(image);
    }
    if(config.method==='patch') {
      if(window.__failImageWidthOnce){window.__failImageWidthOnce=false;throw new Error('Synthetic image metadata failure');}
      const changes=JSON.parse(config.data);const image=stored.screenshots.find(image=>config.url.includes('/'+image.id+'/'));Object.assign(image,changes);if(customMode)localStorage.setItem("fixture-custom-trade",JSON.stringify(stored));return reply(image);
    }
  }
  if (config.method !== "get") {
    const payload = JSON.parse(config.data);
    if (Object.keys(payload).length === 1 && payload.notes_document) {
      if (window.__failImageLayoutOnce) {window.__failImageLayoutOnce=false;throw new Error('Synthetic image layout failure');}
      stored={...stored,notes_document:payload.notes_document};
      if(customMode)localStorage.setItem('fixture-custom-trade',JSON.stringify(stored));
      return reply(stored);
    }
    window.__tradePayload = payload;
    window.__tradeSaves++;
    stored = {
      ...stored,
      ...payload,
      asset: { id: payload.asset_id, symbol: "EURUSD" },
      emotions: payload.emotion_ids.map((id) => ({ id, label: id === 1 ? "Calm" : "Focused" })),
      mistakes: [],
    };
    if (customMode) localStorage.setItem("fixture-custom-trade", JSON.stringify(stored));
  }
  return reply(stored);
};

function App() {
  const [open, setOpen] = useState(true);
  const [optionLists,setOptionLists] = useState(() => JSON.parse(localStorage.getItem('fixture-option-lists') || 'null') || {assets:catalog.assets,setups:catalog.setups,emotionTags:catalog.emotionTags,mistakeTags:catalog.mistakeTags});
  const liveCatalog={...catalog,...optionLists};
  for (const [kind,list] of [['Asset','assets'],['Setup','setups'],['EmotionTag','emotionTags'],['MistakeTag','mistakeTags']]) {
    const change=transform=>{
      if(window.__failOptionSave) {window.__failOptionSave=false;throw new Error('Synthetic option save failure');}
      setOptionLists(previous=>{const next={...previous,[list]:transform(previous[list])};localStorage.setItem('fixture-option-lists',JSON.stringify(next));return next;});
    };
    liveCatalog[`add${kind}`]=async value=>change(previous=>[...previous,value]);
    liveCatalog[`update${kind}`]=async (old,value)=>change(previous=>previous.map(item=>item===old?value:item));
    liveCatalog[`remove${kind}`]=async value=>change(previous=>previous.filter(item=>item!==value));
  }
  const [review, setReview] = useState(false);
  const [mode, setMode] = useState(
    new URLSearchParams(location.search).has("edit") ? "edit" : "new",
  );
  const [trade, setTrade] = useState(stored);
  return (
    <>
      <button
        onClick={() => {
          setMode("new");
          setOpen(true);
        }}
      >
        New trade
      </button>
      <button
        onClick={() => {
          setMode("edit");
          setOpen(true);
        }}
      >
        Edit saved trade
      </button>
      <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }} data-testid="saved-trade">
        {JSON.stringify(trade)}
      </pre>
      <button type="button" onClick={()=>setReview(true)}>Review saved details</button>
      <TradeDetailPanel trade={trade} open={review} onClose={()=>setReview(false)}/>
      <TradePanel
        mode={mode}
        trade={mode === "edit" ? trade : null}
        open={open}
        onClose={() => setOpen(false)}
        onSave={async (payload,savedDraftId) => {
          const result =
            savedDraftId || mode === "edit"
              ? await updateTrade(1, savedDraftId ?? trade.id, payload)
              : await createTrade(1, payload);
          setTrade(result);
          return result;
        }}
        catalog={new URLSearchParams(location.search).has("options")?liveCatalog:catalog}
        journalId={Number(new URLSearchParams(location.search).get("journal") || 1)}
      />
    </>
  );
}
function AccountFixture({children}) {
 const [user, setUser] = useState(() => ({id:42,entry_configuration:JSON.parse(localStorage.getItem('fixture-account-configuration') || '{}')}));
 if (!new URLSearchParams(location.search).has('account')) return children;
 return <AuthContext.Provider value={{user,updatePreferences:async payload => {
  window.__configurationPayload = payload;
  if (window.__failConfigurationSave) throw new Error('Synthetic save failure');
  const change = payload.entry_configuration_update;
  const config = structuredClone(user.entry_configuration);
  config.journals ??= {};
  if (change.scope === 'future') {
   for (const id of [1,2]) config.journals[id] ??= structuredClone(config.defaults ?? {});
   config.defaults = change.fields;
  }
  config.journals[change.journal_id] = change.fields;
  localStorage.setItem('fixture-account-configuration',JSON.stringify(config));
  setUser({...user,entry_configuration:config});
  return {...user,entry_configuration:config};
 }}}>{children}</AuthContext.Provider>;
}
createRoot(document.getElementById("root")).render(
  <JournalContext.Provider value={{ activeJournal: { id: 1, startingCapital: 10000 } }}>
    <AccountFixture><App /></AccountFixture>
  </JournalContext.Provider>,
);
