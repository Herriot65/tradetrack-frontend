import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useState } from "react";
import { Pencil, Plus, Trash2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TagManager({
  open,
  onClose,
  title,
  tags,
  onAdd,
  onRemove,
  onUpdate,
}) {
  useLanguage();
  const [editing,   setEditing]   = useState(null); // { name, value }
  const [newTag,    setNewTag]    = useState("");
  const [confirmDel, setConfirmDel] = useState(null); // tag name pending delete

  function startEdit(name) {
    setEditing({ name, value: name });
  }

  const [busy,setBusy] = useState(false), [error,setError] = useState("");
  async function run(action) {
    if (busy) return;
    setBusy(true);setError("");
    try {await action();} catch (err) {setError(err.message || "Unable to save option. Please try again.");}
    finally {setBusy(false);}
  }

  async function commitEdit() {
    if (!editing) return;
    const trimmed = editing.value.trim();
    await run(async()=>{if (trimmed && trimmed !== editing.name) await onUpdate(editing.name, trimmed);setEditing(null);});
  }

  async function handleAdd() {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    await run(async()=>{await onAdd(trimmed);setNewTag("");});
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t(title)}</DialogTitle>
          <DialogDescription className="sr-only">{t("Add, rename, or delete tags.")}</DialogDescription>
        </DialogHeader>

        {error&&<p role="alert" className="text-xs text-red-400">{t(error)}</p>}
        <fieldset disabled={busy} className="min-w-0 space-y-3">
        {/* Tag list */}
        <div className="max-h-64 space-y-1 overflow-y-auto py-1">
          {tags.length === 0 && (
            <p className="py-4 text-center text-xs text-zinc-600">{t("No tags yet.")}</p>
          )}
          {tags.map((tag) => (
            <div key={tag} className="flex items-center gap-2 rounded-md px-1">
              {editing?.name === tag ? (
                <>
                  <Input
                    autoFocus
                    value={editing.value}
                    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit();
                      if (e.key === "Escape") setEditing(null);
                    }}
                    className="h-7 flex-1 border-zinc-700 bg-zinc-900 text-sm focus-visible:ring-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={commitEdit}
                    className="rounded p-1 text-emerald-400 hover:bg-zinc-800"
                  >
                    <Check className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-800"
                  >
                    <X className="size-3.5" />
                  </button>
                </>
              ) : confirmDel === tag ? (
                <>
                  <span className="flex-1 truncate text-sm text-red-400">{tag}</span>
                  <span className="text-xs text-zinc-500">{t("Remove?")}</span>
                  <button
                    type="button"
                    onClick={() => run(async()=>{ await onRemove(tag); setConfirmDel(null); })}
                    className="rounded p-1 text-red-400 hover:bg-red-500/10"
                  >
                    <Check className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDel(null)}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-800"
                  >
                    <X className="size-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-sm text-zinc-200">{tag}</span>
                  <button
                    type="button"
                    onClick={() => startEdit(tag)}
                    className="rounded p-1 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDel(tag)}
                    className="rounded p-1 text-zinc-600 hover:bg-zinc-800 hover:text-red-400"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add new */}
        <div className="flex gap-2 border-t border-zinc-800/60 pt-3">
          <Input
            placeholder={t("New tag name…")}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="h-8 flex-1 border-zinc-800 bg-zinc-900/60 text-sm focus-visible:ring-emerald-500/50"
          />
          <Button type="button" size="sm" onClick={handleAdd} disabled={!newTag.trim()}>
            <Plus className="size-3.5" />{t("Add")}</Button>
        </div>
        </fieldset>
      </DialogContent>
    </Dialog>
  );
}
