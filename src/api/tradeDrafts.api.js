import api from './axios';
import {prepareImage} from '@/lib/prepareImage';
export function cloudDraftTransport(journalId,scope) {
  const root=`/journals/${journalId}/drafts/${scope}/`,uploaded=new Map();
  return {
    resetImages(){uploaded.clear();},
    async get(timeout=12000){return (await api.get(root,{timeout})).data;},
    async clear(revision){return (await api.delete(root,{data:{revision},timeout:12000})).data;},
    async hydrate(record) {
      if(!record?.data)return null;
      const data=structuredClone(record.data);
      data.sections=await Promise.all(data.sections.map(async section=>({...section,images:await Promise.all(section.images.map(async image=>{
        if(!image.cloudFile)return image;
        const {digest,name,type,lastModified}=image.cloudFile;
        const response=await api.get(root+`images/${digest}/`,{responseType:'blob',timeout:12000});
        return {...image,file:new File([response.data],name,{type,lastModified}),preview:undefined};
      }))})));
      return {...data,cloudRevision:record.revision,syncedAt:data.updatedAt};
    },
    async put(record,revision) {
      const data={...record};delete data.cloudRevision;delete data.syncedAt;
      data.sections=await Promise.all(record.sections.map(async section=>({...section,images:await Promise.all(section.images.map(async image=>{
        const result={...image,file:null};delete result.cloudFile;
        if(image.file) {
          const {file}=image.cloudFile?{file:image.file}:await prepareImage(image.file);
          const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer())),byte=>byte.toString(16).padStart(2,'0')).join('');
          if(!uploaded.has(digest)) {
            const body=new FormData();body.append('file',file);
            uploaded.set(digest,api.put(root+`images/${digest}/`,body,{timeout:20000}).catch(error=>{uploaded.delete(digest);throw error;}));
          }
          await uploaded.get(digest);
          result.cloudFile={digest,name:file.name,type:file.type,lastModified:file.lastModified};delete result.preview;
        }
        if(result.preview?.startsWith('blob:'))delete result.preview;
        return result;
      }))})));
      try {return (await api.put(root,{revision,data},{timeout:12000})).data;}
      catch(error){if(error?.response?.status===400)uploaded.clear();throw error;}
    },
  };
}
