import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export default function InfoTip({ text }) {
  if (!text) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default">
          <Info className="size-3 text-zinc-600 hover:text-zinc-400 transition-colors" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}
