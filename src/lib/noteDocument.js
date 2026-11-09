export function documentFromText(text = '') {
  return {type:'doc',content:String(text ?? '').split('\n').map(line=>({type:'paragraph',...(line?{content:[{type:'text',text:line}]}:{})}))};
}
export function documentText(node) {
  if(!node) return '';
  if(node.type==='text')return node.text ?? '';
  if(node.type==='hardBreak')return '\n';
  return (node.content ?? []).map(documentText).join(['doc','bulletList','orderedList','listItem','blockquote'].includes(node.type)?'\n':'');
}
export function imageWidth(value) {return Math.max(25,Math.min(100,Math.round(Number(value)||100)));}
