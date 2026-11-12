import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {draftStore} from '@/lib/tradeDraftStore';
export function useTradeDraft({open,identity,snapshot,onRestore,getSavedTradeId}) {
  const [status,setStatus]=useState('loading');
  const latest=useRef(snapshot),restore=useRef(onRestore),ready=useRef(false),suppressed=useRef(false),queue=useRef(Promise.resolve()),previous=useRef(null),keyRef=useRef(identity);
  const savedId=useRef(getSavedTradeId);
  useLayoutEffect(()=>{latest.current=snapshot;restore.current=onRestore;savedId.current=getSavedTradeId;});
  function flush() {
    if (!ready.current && open) return Promise.resolve(false);
    if (suppressed.current || !open) return queue.current;
    const value={...latest.current,savedTradeId:savedId.current?.()},key=keyRef.current;
    previous.current=JSON.stringify(latest.current);
    setStatus('saving');
    queue.current=queue.current.catch(()=>{}).then(()=>draftStore(key,'put',{...value,updatedAt:Date.now()})).then(()=>{setStatus('saved');return true;},()=>{setStatus('error');return false;});
    return queue.current;
  }
  const flushRef=useRef(flush);useLayoutEffect(()=>{flushRef.current=flush;});
  useEffect(()=>{
    let cancelled=false;ready.current=false;suppressed.current=false;keyRef.current=identity;previous.current=null;
    if(!open)return;
    draftStore(identity,'get').then(draft=>{
      if(cancelled)return;
      if(draft)restore.current(draft);
      ready.current=true;setStatus(draft?'restored':'ready');
    }).catch(()=>{if(!cancelled){ready.current=true;setStatus('error');}});
    return ()=>{cancelled=true;ready.current=false;};
  },[open,identity]);
  useEffect(()=>{
    if(!open||!ready.current||suppressed.current)return;
    // File metadata and every editable field participate; blobs are stored by IndexedDB.
    const signature=JSON.stringify(snapshot);
    if(signature===previous.current)return;
    const timer=setTimeout(()=>flushRef.current(),300);
    return ()=>clearTimeout(timer);
  },[open,snapshot,status]);
  useEffect(()=>{
    if(!open)return;
    const save=()=>{if(document.visibilityState==='hidden')flushRef.current();};
    const leave=()=>flushRef.current();
    document.addEventListener('visibilitychange',save);window.addEventListener('pagehide',leave);
    return ()=>{document.removeEventListener('visibilitychange',save);window.removeEventListener('pagehide',leave);};
  },[open]);
  async function clear() {
    suppressed.current=true;
    await queue.current.catch(()=>{});
    await draftStore(keyRef.current,'delete');setStatus('ready');
  }
  return {status,flush,clear};
}
