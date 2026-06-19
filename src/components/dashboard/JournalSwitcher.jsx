import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Check, ChevronDown, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useJournal } from "@/journals/useJournal";

import JournalFormDialog from "./JournalFormDialog";

export default function JournalSwitcher() {
  const navigate = useNavigate();
  const {
    journals,
    activeJournal,
    selectJournal,
    createJournal,
    deleteJournal,
  } = useJournal();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleCreate = async (payload) => {
    const created = await createJournal(payload);
    navigate(`/journal/${created.id}`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteJournal(activeJournal.id);
      setDeleteOpen(false);
      navigate("/dashboard");
    } catch (err) {
      setDeleteError(err?.response?.data?.detail ?? err.message ?? "Failed to delete journal");
    } finally {
      setDeleting(false);
    }
  };

  if (!activeJournal) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-3.5" />
          New Journal
        </Button>
        <JournalFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSubmit={handleCreate}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="max-w-[220px] gap-1.5"
            aria-label="Switch journal"
          >
            <BookOpen className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{activeJournal.name}</span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Journals</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {journals.map((j) => (
            <DropdownMenuItem
              key={j.id}
              onClick={() => {
                selectJournal(j);
                navigate(`/journal/${j.id}`);
              }}
              className="gap-2"
            >
              <Check
                className={cn(
                  "size-3.5 shrink-0",
                  activeJournal.id === j.id ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="truncate">{j.name}</span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            New journal
          </DropdownMenuItem>

          {journals.length > 1 && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                setDeleteError(null);
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="size-3.5" />
              Delete this journal
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <JournalFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{activeJournal.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              All trades and analytics in this journal will be permanently deleted.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
