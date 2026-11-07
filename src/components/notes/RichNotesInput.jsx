import {useEffect} from 'react';
import {useEditor,EditorContent,useEditorState} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {TextStyle,Color} from '@tiptap/extension-text-style';
import {Bold,Italic,Underline,Strikethrough,List,ListOrdered,Quote,Undo2,Redo2,RemoveFormatting} from 'lucide-react';
import {documentFromText,documentText} from '@/lib/noteDocument';
import {translate as t} from '@/i18n/language';
import {useLanguage} from '@/i18n/useLanguage';
import './rich-notes.css';
export default function RichNotesEditor({value,onChange,label}) {
  useLanguage();
  const editor=useEditor({extensions:[StarterKit.configure({heading:{levels:[1,2,3]},link:false,codeBlock:false,horizontalRule:false}),TextStyle,Color],
    content:value ?? documentFromText(),
    onUpdate:({editor})=>onChange(editor.getJSON(),documentText(editor.getJSON())),
    editorProps:{attributes:{role:'textbox','aria-label':label,'aria-multiline':'true',class:'rich-notes-content outline-none'}},
  });
  useEffect(()=>{if(editor&&JSON.stringify(editor.getJSON())!==JSON.stringify(value??documentFromText()))editor.commands.setContent(value??documentFromText(),{emitUpdate:false});},[editor,value]);
  const state=useEditorState({editor,selector:({editor})=>editor?{bold:editor.isActive('bold'),italic:editor.isActive('italic'),underline:editor.isActive('underline'),strike:editor.isActive('strike'),bulletList:editor.isActive('bulletList'),orderedList:editor.isActive('orderedList'),blockquote:editor.isActive('blockquote'),heading:editor.isActive('heading')?String(editor.getAttributes('heading').level):'paragraph',color:editor.getAttributes('textStyle').color??'#f4f4f5'}:{}});
  if(!editor)return null;
  const actions=[['Bold',Bold,'toggleBold','bold'],['Italic',Italic,'toggleItalic','italic'],['Underline',Underline,'toggleUnderline','underline'],['Strikethrough',Strikethrough,'toggleStrike','strike'],['Bulleted list',List,'toggleBulletList','bulletList'],['Numbered list',ListOrdered,'toggleOrderedList','orderedList'],['Quote',Quote,'toggleBlockquote','blockquote']];
  return <div className="rich-notes-editor min-w-0 rounded-md border border-border bg-card">
    <div role="group" aria-label={t('{field} formatting',{field:label})} className="flex flex-wrap items-center gap-1 border-b border-border p-1.5">
      <select aria-label={t('Text style')} value={state.heading} onChange={e=>e.target.value==='paragraph'?editor.chain().focus().setParagraph().run():editor.chain().focus().setHeading({level:Number(e.target.value)}).run()} className="h-9 max-w-full rounded-md border border-border bg-background px-2 text-xs"><option value="paragraph">{t('Paragraph')}</option>{[1,2,3].map(n=><option key={n} value={n}>{t('Heading {number}',{number:n})}</option>)}</select>
      {actions.map(([name,Icon,command,active])=><button key={name} type="button" title={t(name)} aria-label={t(name)} aria-pressed={!!state[active]} onMouseDown={e=>e.preventDefault()} onClick={()=>editor.chain().focus()[command]().run()} className={`flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-secondary ${state[active]?'bg-primary/10 text-primary':'text-muted-foreground'}`}><Icon className="size-4"/></button>)}
      <label className="flex h-9 items-center gap-1 rounded-md px-1 text-xs text-muted-foreground"><span>{t('Text color')}</span><input type="color" aria-label={t('Text color')} value={state.color} onChange={e=>editor.chain().focus().setColor(e.target.value).run()} className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"/></label>
      <button type="button" title={t('Clear formatting')} aria-label={t('Clear formatting')} onClick={()=>editor.chain().focus().unsetAllMarks().clearNodes().run()} className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"><RemoveFormatting className="size-4"/></button>
      <button type="button" aria-label={t('Undo')} onClick={()=>editor.chain().focus().undo().run()} className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"><Undo2 className="size-4"/></button>
      <button type="button" aria-label={t('Redo')} onClick={()=>editor.chain().focus().redo().run()} className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"><Redo2 className="size-4"/></button>
    </div>
    <EditorContent editor={editor}/>
  </div>;
}
