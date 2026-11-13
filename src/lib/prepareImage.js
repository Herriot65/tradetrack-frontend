const prepared=new WeakMap();
// Keep chart labels readable; skip small files, and only keep an optimization if smaller.
export function prepareImage(file) {
  if(!prepared.has(file))prepared.set(file,(async()=>{
    if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Use PNG, JPEG or WebP images.');
    let bitmap;
    try {
      bitmap=await createImageBitmap(file);
      const scale=Math.min(1,2560/Math.max(bitmap.width,bitmap.height));
      if(scale===1&&file.size<1024*1024)return {file,originalSize:file.size};
      const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
      canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.92));
      if(blob&&blob.size<file.size*.9)return {file:new File([blob],file.name.replace(/\.[^.]+$/,'')+'.webp',{type:'image/webp',lastModified:file.lastModified}),originalSize:file.size};
      return {file,originalSize:file.size};
    } catch {return {file,originalSize:file.size};} finally {bitmap?.close();}
  })());
  return prepared.get(file);
}
