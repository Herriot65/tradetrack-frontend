import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {draftStore} from '@/lib/tradeDraftStore';
import {cloudDraftTransport} from '@/api/tradeDrafts.api';
export function useTradeDraft({open,identity,snapshot,onRestore,getSavedTradeId,cloudEnabled=false,journalId,scope,getHasChanges}) {
  const [status,setStatus]=useState('loading'),[cloudStatus,setCloudStatus]=useState('disabled'),[cloudError,setCloudError]=useState('');
  const latest=useRef(snapshot),restore=useRef(onRestore),savedId=useRef(getSavedTradeId),hasChanges=useRef(getHasChanges),session=useRef(null),localQueue=useRef(Promise.resolve());
  useLayoutEffect(()=>{latest.current=snapshot;restore.current=onRestore;savedId.current=getSavedTradeId;hasChanges.current=getHasChanges;});
  const cloudState=(s,value)=>{if(session.current===s){setCloudStatus(value);if(['syncing','synced'].includes(value))setCloudError('');}};
  function writeLocal(action) {localQueue.current=localQueue.current.catch(()=>{}).then(action);return localQueue.current;}
  async function sync(s) {
    if(!s.transport||s.conflict||s.suppressed)return;
    if(s.syncing){s.again=true;return s.syncing;}
    s.syncing=(async()=>{
      cloudState(s,'syncing');
      try {
        const record=await draftStore(s.key,'get');if(!record)return;
        if(s.revision==null) {
          const remote=await s.transport.get();s.revision=remote.revision;
          if(remote.revision>(record.cloudRevision??0)) {s.conflict=remote;cloudState(s,'conflict');return;}
        }
        const response=record.deleted?await s.transport.clear(s.revision):await s.transport.put(record,s.revision);
        s.revision=response.revision;s.syncedAt=record.updatedAt;
        await writeLocal(async()=>{
          const current=await draftStore(s.key,'get');
          if(current?.updatedAt===record.updatedAt) {
            if(record.deleted)await draftStore(s.key,'delete');
            else await draftStore(s.key,'put',{...current,cloudRevision:s.revision,syncedAt:record.updatedAt});
          }
        });
        cloudState(s,'synced');
      } catch(error) {
        if(error?.response?.status===409){s.transport.resetImages();s.conflict=error.response.data;cloudState(s,'conflict');}
        else if([400,413].includes(error?.response?.status)){cloudState(s,'attention');const data=error.response.data;if(session.current===s)setCloudError(typeof data==='string'?data:Object.values(data??{}).flat().join(' '));}
        else cloudState(s,'offline');
      }
    })();
    await s.syncing;s.syncing=null;
    if(s.again){s.again=false;return sync(s);}
  }
  function schedule(s,immediate=false) {
    if(!s.transport||s.suppressed)return;
    clearTimeout(s.timer);s.timer=setTimeout(()=>sync(s),immediate?0:1000);
  }
  async function flush(immediate=true) {
    const s=session.current;
    if(!s?.ready&&open)return false;
    if(!s||s.suppressed||s.deleted||!open)return localQueue.current;
    if(hasChanges.current && !hasChanges.current())return true;
    const value={...latest.current,savedTradeId:savedId.current?.(),updatedAt:Date.now(),cloudRevision:s.revision??s.localRevision??0,syncedAt:s.syncedAt??0};
    s.previous=JSON.stringify(latest.current);setStatus('saving');
    try {await writeLocal(()=>draftStore(s.key,'put',value));if(session.current===s)setStatus('saved');schedule(s,immediate);return true;}
    catch {if(session.current===s)setStatus('error');return false;}
  }
  const flushRef=useRef(flush),syncRef=useRef(sync),scheduleRef=useRef(schedule);useLayoutEffect(()=>{flushRef.current=flush;syncRef.current=sync;scheduleRef.current=schedule;});
  useEffect(()=>{
    if(!open)return;
    const s={key:identity,ready:false,transport:cloudEnabled?cloudDraftTransport(journalId,scope):null,revision:null};session.current=s;
    let cancelled=false;
    queueMicrotask(()=>{if(!cancelled)setStatus('loading');});
    (async()=>{
      let local=null,remote=null;
      try {local=await draftStore(identity,'get');}catch{setStatus('error');}
      if(s.transport) {
        cloudState(s,'syncing');
        try {remote=await s.transport.get();s.revision=remote.revision;cloudState(s,'synced');}
        catch {cloudState(s,'offline');}
      }
      if(cancelled)return;
      let selected=local;
      try {
        const pending=local && local.updatedAt>(local.syncedAt??0);
        if(remote&&remote.revision>(local?.cloudRevision??0)) {
          if(local&&pending){s.conflict=remote;cloudState(s,'conflict');}
          else {selected=await s.transport.hydrate(remote);if(selected)await writeLocal(()=>draftStore(identity,'put',selected));else await writeLocal(()=>draftStore(identity,'delete'));}
        } else if(!local&&remote?.data){selected=await s.transport.hydrate(remote);await writeLocal(()=>draftStore(identity,'put',selected));}
        if(cancelled)return;
        s.skipBaseline=true;
        if(selected&&!selected.deleted)restore.current(selected);
        s.localRevision=selected?.cloudRevision??0;s.syncedAt=selected?.syncedAt??0;s.ready=true;
        setStatus(selected&&!selected.deleted?'restored':'ready');
        if(selected?.deleted || (selected && selected.updatedAt>(selected.syncedAt??0) && !s.conflict))scheduleRef.current(s,true);
      }catch{if(!cancelled){s.ready=true;setStatus('error');cloudState(s,'offline');}}
    })();
    return ()=>{cancelled=true;};
  },[open,identity,cloudEnabled,journalId,scope]);
  useEffect(()=>{
    const s=session.current;if(!open||!s?.ready||s.suppressed||s.deleted)return;
    if(s.skipBaseline){s.skipBaseline=false;s.previous=JSON.stringify(snapshot);return;}
    if(JSON.stringify(snapshot)===s.previous)return;
    const timer=setTimeout(()=>flushRef.current(false),300);return()=>clearTimeout(timer);
  },[open,snapshot,status]);
  useEffect(()=>{
    const hidden=()=>{if(open&&document.visibilityState==='hidden')flushRef.current();};
    const leave=()=>{if(open)flushRef.current();};
    const online=()=>{const s=session.current;if(s)syncRef.current(s);};
    document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',leave);window.addEventListener('online',online);
    return()=>{document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',leave);window.removeEventListener('online',online);};
  },[open]);
  async function resolveCloud(useCloud) {
    const s=session.current;if(!s?.transport)return;
    try {
      const remote=await s.transport.get();s.revision=remote.revision;s.conflict=null;
      if(useCloud) {
        const data=await s.transport.hydrate(remote);
        s.skipBaseline=true;
        if(data){restore.current(data);await writeLocal(()=>draftStore(s.key,'put',data));setStatus('restored');}
        else {restore.current(null);await writeLocal(()=>draftStore(s.key,'delete'));setStatus('ready');}
        cloudState(s,'synced');
      } else await flush();
    }catch{cloudState(s,'offline');}
  }
  async function clear() {
    const s=session.current;if(!s)return;
    s.suppressed=true;clearTimeout(s.timer);await localQueue.current.catch(()=>{});await s.syncing;
    let deferred=false;
    if(s.transport&&!s.conflict) {
      try {if(s.revision==null)s.revision=(await s.transport.get()).revision;await s.transport.clear(s.revision);}
      catch(error){deferred=![404,409].includes(error?.response?.status);}
    }
    await writeLocal(()=>deferred?draftStore(s.key,'put',{deleted:true,updatedAt:Date.now(),cloudRevision:s.revision??0}):draftStore(s.key,'delete'));if(deferred){s.deleted=true;s.suppressed=false;}setStatus('ready');
  }
  return {status,cloudStatus,cloudError,flush,clear,loadCloud:()=>resolveCloud(true),keepLocal:()=>resolveCloud(false),retrySync:()=>sync(session.current)};
}
