import {Fragment} from 'react';
import './rich-notes.css';
function renderNode(node,index=0) {
  if(!node||typeof node!=='object')return null;
  if(node.type==='text'){
    let text=typeof node.text==='string'?node.text:'';
    for(const mark of node.marks??[]) {
      const key=`${index}-${mark.type}`;
      if(mark.type==='textStyle'&&/^#[0-9a-f]{6}$/i.test(mark.attrs?.color??''))text=<span key={key} style={{color:mark.attrs.color}}>{text}</span>;
      const tags={bold:'strong',italic:'em',underline:'u',strike:'s',code:'code'};
      const Tag=tags[mark.type];if(Tag)text=<Tag key={key}>{text}</Tag>;
    }
    return <span key={index}>{text}</span>;
  }
  if(node.type==='hardBreak')return <br key={index}/>;
  const children=(node.content??[]).map(renderNode);
  const Tag=node.type==='heading'?({1:'h1',2:'h2',3:'h3'}[node.attrs?.level]??'p'):({paragraph:'p',bulletList:'ul',orderedList:'ol',listItem:'li',blockquote:'blockquote'}[node.type]);
  return Tag?<Tag key={index}>{children}</Tag>:<Fragment key={index}>{children}</Fragment>;
}
export default function RichNotesContent({document}) {return <div className="rich-notes-content">{renderNode(document)}</div>;}
