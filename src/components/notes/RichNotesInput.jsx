import {useContext,useEffect,useState} from 'react';
import {useEditor,EditorContent,useEditorState} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {TextStyle,Color} from '@tiptap/extension-text-style';
import {MoreHorizontal,Bold,Italic,Underline,Strikethrough,List,ListOrdered,Quote,Undo2,Redo2,RemoveFormatting} from 'lucide-react';
import {createPortal} from 'react-dom';
import {documentFromText,documentText} from '@/lib/noteDocument';
import {translate as t} from '@/i18n/language';
import {useLanguage} from '@/i18n/useLanguage';
import './rich-notes.css';
import {RichNotesScope} from './richNotesScope';
export default function RichNotesEditor({value,onChange,label,embedded=false,hasImages=false,focusRequest,onFocusRequestHandled,continuation=false,readOnly=false}) {
  useLanguage();
  const scope=useContext(RichNotesScope);
  const [expanded,setExpanded]=useState(false);
  const setActiveEditor=scope?.setActiveEditor;
  const editable=!(readOnly||scope?.readOnly);
  const editor=useEditor({extensions:[StarterKit.configure({heading:{levels:[1,2,3]},link:false,codeBlock:false,horizontalRule:false}),TextStyle,Color],
    content:value ?? documentFromText(),
    onFocus:({editor})=>scope?.setActiveEditor(editor),
    onUpdate:({editor})=>onChange(editor.getJSON(),documentText(editor.getJSON())),
    editorProps:{attributes:{role:'textbox','aria-label':label,'aria-multiline':'true',class:'rich-notes-content outline-none'}},
  });
  useEffect(()=>{if(editor&&editor.isEditable!==editable)editor.setEditable(editable,false);},[editor,editable]);
  useEffect(()=>{if(editor&&JSON.stringify(editor.getJSON())!==JSON.stringify(value??documentFromText()))editor.commands.setContent(value??documentFromText(),{emitUpdate:false});},[editor,value]);
  useEffect(()=>{if(editor&&focusRequest){editor.commands.focus('end');onFocusRequestHandled?.();}},[editor,focusRequest,onFocusRequestHandled]);
  useEffect(()=>()=>setActiveEditor?.(current=>current===editor?null:current),[editor,setActiveEditor]);
  const toolbarEditor=scope?.activeEditor && !scope.activeEditor.isDestroyed ? scope.activeEditor : editor;
  const empty=useEditorState({editor,selector:({editor})=>editor?.isEmpty ?? true});
  const state=useEditorState({editor:toolbarEditor,selector:({editor})=>editor?{bold:editor.isActive('bold'),italic:editor.isActive('italic'),underline:editor.isActive('underline'),strike:editor.isActive('strike'),bulletList:editor.isActive('bulletList'),orderedList:editor.isActive('orderedList'),blockquote:editor.isActive('blockquote'),heading:editor.isActive('heading')?String(editor.getAttributes('heading').level):'paragraph',color:editor.getAttributes('textStyle').color??'#f4f4f5'}:{}});
  if(!editor)return null;
  const actions=[['Bold',Bold,'toggleBold','bold'],['Italic',Italic,'toggleItalic','italic'],['Underline',Underline,'toggleUnderline','underline'],['Strikethrough',Strikethrough,'toggleStrike','strike'],['Bulleted list',List,'toggleBulletList','bulletList'],['Numbered list',ListOrdered,'toggleOrderedList','orderedList'],['Quote',Quote,'toggleBlockquote','blockquote']];
  const toolbar=<div role="group" aria-label={t('{field} formatting',{field:label})} className="rich-notes-toolbar border-b border-border bg-card p-1.5">
    <div className="flex min-w-0 items-center gap-1">
      <select aria-label={t('Text style')} value={state.heading} onChange={e=>e.target.value==='paragraph'?toolbarEditor.chain().focus().setParagraph().run():toolbarEditor.chain().focus().setHeading({level:Number(e.target.value)}).run()} className="h-9 w-20 min-w-0 shrink-0 rounded-md border border-border bg-background px-1 text-xs"><option value="paragraph">{t('Paragraph')}</option>{[1,2,3].map(n=><option key={n} value={n}>{t('Heading {number}',{number:n})}</option>)}</select>
      <button type="button" title={t('Bold')} aria-label={t('Bold')} aria-pressed={!!state.bold} onMouseDown={e=>e.preventDefault()} onClick={()=>toolbarEditor.chain().focus().toggleBold().run()} className={`flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-secondary ${state.bold?'bg-primary/10 text-primary':'text-muted-foreground'}`}><Bold className="size-4"/></button>
      <button type="button" title={t('Undo')} aria-label={t('Undo')} onMouseDown={e=>e.preventDefault()} onClick={()=>toolbarEditor.chain().focus().undo().run()} className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"><Undo2 className="size-4"/></button>
      <button type="button" title={t('Redo')} aria-label={t('Redo')} onMouseDown={e=>e.preventDefault()} onClick={()=>toolbarEditor.chain().focus().redo().run()} className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"><Redo2 className="size-4"/></button>
      <button type="button" title={t('More formatting')} aria-label={t('More formatting')} aria-expanded={expanded} onMouseDown={e=>e.preventDefault()} onClick={()=>setExpanded(value=>!value)} className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"><MoreHorizontal className="size-4"/></button>
    </div>
    {expanded&&<div className="mt-1 flex flex-wrap items-center gap-1 border-t border-border pt-1">
      {actions.filter(([, , ,active])=>active!=='bold').map(([name,Icon,command,active])=><button key={name} type="button" title={t(name)} aria-label={t(name)} aria-pressed={!!state[active]} onMouseDown={e=>e.preventDefault()} onClick={()=>toolbarEditor.chain().focus()[command]().run()} className={`flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-secondary ${state[active]?'bg-primary/10 text-primary':'text-muted-foreground'}`}><Icon className="size-4"/></button>)}
      <label className="flex h-9 items-center gap-1 rounded-md px-1 text-xs text-muted-foreground"><span>{t('Text color')}</span><input type="color" aria-label={t('Text color')} value={state.color} onChange={e=>toolbarEditor.chain().focus().setColor(e.target.value).run()} className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"/></label>
      <button type="button" title={t('Clear formatting')} aria-label={t('Clear formatting')} onMouseDown={e=>e.preventDefault()} onClick={()=>toolbarEditor.chain().focus().unsetAllMarks().clearNodes().run()} className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"><RemoveFormatting className="size-4"/></button>
    </div>}
  </div>;
  return <div data-embedded={embedded || undefined} data-has-images={hasImages || undefined} data-empty={empty || undefined} className={`rich-notes-editor min-w-0 ${continuation ? 'rich-notes-continuation' : ''} ${embedded ? '' : 'rounded-md border border-border bg-card'}`}>
    {!continuation&&(scope?.toolbarHost?createPortal(toolbar,scope.toolbarHost):toolbar)}
    <EditorContent editor={editor}/>
  </div>;
}
