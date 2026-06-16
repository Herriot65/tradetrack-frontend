import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/forms/FieldError";
import { FormErrorBanner } from "@/components/forms/FormErrorBanner";
import { workspaceSchema } from "@/schemas/workspaceSchema";

export default function WorkspaceFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultName = "",
  title,
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: defaultName },
  });

  useEffect(() => {
    if (open) reset({ name: defaultName });
  }, [open, defaultName, reset]);

  const submit = async (values) => {
    try {
      await onSubmit(values.name);
      onOpenChange(false);
    } catch (err) {
      const message =
        err?.response?.data?.name?.[0] ??
        err?.response?.data?.detail ??
        err.message ??
        "Something went wrong";
      setError("root", { message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Enter a name for this workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          {errors.root && <FormErrorBanner message={errors.root.message} />}

          <div className="space-y-1.5">
            <Label htmlFor="workspace-name">Name</Label>
            <Input
              id="workspace-name"
              placeholder="e.g. Forex Live Account"
              autoFocus
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
