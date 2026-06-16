import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

function SheetOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/60",
        "data-open:animate-in data-open:fade-in-0",
        "data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  );
}

function SheetContent({ className, children, ...props }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-[560px] flex-col",
          "border-l border-zinc-800 bg-zinc-950 shadow-2xl",
          "duration-200",
          "data-open:animate-in data-open:slide-in-from-right",
          "data-closed:animate-out data-closed:slide-out-to-right",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, children, onClose, ...props }) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "flex shrink-0 items-start justify-between border-b border-zinc-800 px-6 py-4",
        className
      )}
      {...props}
    >
      <div className="flex-1">{children}</div>
      <DialogPrimitive.Close asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-2 mt-0.5 shrink-0"
          onClick={onClose}
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </Button>
      </DialogPrimitive.Close>
    </div>
  );
}

function SheetBody({ className, ...props }) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("flex-1 overflow-y-auto px-6 py-5", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-t border-zinc-800 px-6 py-4",
        className
      )}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-base font-semibold", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("mt-0.5 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
