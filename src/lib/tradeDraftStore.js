let database;
function db() {
  if (!database) database = new Promise((resolve,reject)=>{
    const request=indexedDB.open('nexora-trade-drafts',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('drafts');
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  }).catch(error=>{database=null;throw error;});
  return database;
}
export async function draftStore(key,method,value) {
  const database=await db();
  return new Promise((resolve,reject)=>{
    const tx=database.transaction('drafts',method==='get'?'readonly':'readwrite'),store=tx.objectStore('drafts');
    const request=method==='get'?store.get(key):method==='delete'?store.delete(key):store.put(value,key);
    tx.oncomplete=()=>resolve(request.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
}
export function restoreDraftImages(sections) {
  return sections.map(section=>({...section,images:section.images.map(image=>({...image,preview:image.file?URL.createObjectURL(image.file):image.preview}))}));
}
