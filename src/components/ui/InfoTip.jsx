import { useState } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export default function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;

  return (
    <Tooltip open={open} onOpenChange={setOpen} delayDuration={300}>
      <TooltipTrigger asChild>
        <span
          className="cursor-default"
          onPointerDown={(e) => {
            // Touch tap: toggle the tooltip; mouse click is handled via hover
            if (e.pointerType !== "mouse") {
              e.preventDefault();
              setOpen((v) => !v);
            }
          }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <Info className="size-3 text-zinc-600 hover:text-zinc-400 transition-colors" />
        </span>
      </TooltipTrigger>
      <TooltipContent onPointerDownOutside={() => setOpen(false)}>
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
