import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import TradeNotesEditor from '../src/components/journal/TradeNotesEditor';
import TradeDetailPanel from '../src/components/journal/TradeDetailPanel';
import {JournalContext} from '../src/journals/JournalContext';
import '../src/index.css';
import '../src/lib/theme';
function App(){
 const [sections,setSections]=useState([{id:'before',title:'Before / Market Entry',text:'',images:[]}]);
 const [detail,setDetail]=useState(false);
 const [trade,setTrade]=useState(null);
 return <JournalContext.Provider value={{activeJournal:{display_unit:'R'}}}><main className="mx-auto max-w-[1100px] p-6">
  <h1>Trade image review</h1>
  <TradeNotesEditor sections={sections} onChange={setSections}/>
  <button type="button" onClick={()=>{setTrade({id:1,asset:'EURUSD',side:'BUY',screenshots:sections.flatMap(section=>section.images.map(image=>({id:image.id,image_url:image.preview,section:section.title})))});setDetail(true);}}>Review saved trade</button>
  <TradeDetailPanel trade={trade} open={detail} onClose={()=>setDetail(false)}/>
 </main></JournalContext.Provider>;
}
createRoot(document.getElementById('root')).render(<App/>);
