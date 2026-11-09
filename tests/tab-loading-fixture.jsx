import {useCallback, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {useAsyncQuery} from '../src/hooks/useAsyncQuery';
import {clearQueryCache} from '../src/lib/queryCache';
let calls = 0;
function Fixture() {
 const [active,setActive]=useState(true);
 const [journal,setJournal]=useState(1);
 const [failing,setFailing]=useState(false);
 const fetch=useCallback(async()=>{
  calls++; await new Promise(resolve=>setTimeout(resolve,40));
  if(failing) throw new Error('offline');
  return `journal-${journal}-read-${calls}`;
 },[journal,failing]);
 const query=useAsyncQuery(fetch,[journal,failing],{enabled:active,retainOnDisable:true});
 return <>
  <button onClick={()=>setActive(value=>!value)}>Toggle tab</button>
  <button onClick={()=>{clearQueryCache();setActive(false);}}>Edit while hidden</button>
  <button onClick={()=>{setJournal(value=>value+1);setActive(false);}}>Switch journal</button>
  <button onClick={()=>setFailing(value=>!value)}>Toggle error</button>
  <button onClick={query.refetch}>Refresh</button>
  <output data-testid="calls">{calls}</output>
  <div hidden={!active}><output data-testid="data">{query.data}</output><output data-testid="loading">{String(query.loading)}</output><output data-testid="error">{query.error}</output></div>
 </>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
