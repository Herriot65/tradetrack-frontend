import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { CalendarDays, Clock3 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import SelectField from "./select-field";
import { Button } from "./button";
import { parseTradeDateTime, toTradeDateTimeInput, changeTradeDate, changeTradeTime } from "@/lib/tradeDateTime";
import "react-day-picker/style.css";
import "./date-time-picker.css";

const HOURS=Array.from({length:24},(_,i)=>String(i).padStart(2,"0"));
const MINUTES=Array.from({length:60},(_,i)=>String(i).padStart(2,"0"));

function CalendarDropdown({ options, value, onChange, "aria-label": label, disabled }) {
  return <SelectField value={value} onValueChange={next=>onChange?.({target:{value:next}})} options={options} label={label} disabled={disabled} allowClear={false} className="h-8 w-auto shrink-0 border-transparent bg-transparent px-2" />;
}

export default function DateTimePicker({value, onChange, onBlur, label, id, invalid, ref: triggerRef}) {
  const [open,setOpen]=useState(false);
  const selected=parseTradeDateTime(value);
  const time=value?.split("T")[1] || "00:00:00";
  const [hour,minute]=time.split(":");
  const dateLabel=selected ? new Intl.DateTimeFormat("en-US",{timeZone:"UTC",month:"short",day:"numeric",year:"numeric"}).format(selected) : null;
  return <Popover open={open} onOpenChange={next=>{setOpen(next);if(!next)onBlur?.();}}>
    <PopoverTrigger asChild>
      <button ref={triggerRef} id={id} type="button" aria-label={label} aria-invalid={invalid || undefined} className="flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-left text-[13px] outline-none transition-colors hover:border-zinc-600 focus-visible:ring-2 focus-visible:ring-zinc-400/40 aria-[invalid=true]:border-red-400">
        <CalendarDays className="size-4 shrink-0 text-zinc-500" />
        <span className="min-w-0 flex-1 truncate text-zinc-200">{dateLabel || <span className="text-zinc-500">Select date & time</span>}</span>
        {selected && <span className="shrink-0 text-xs tabular-nums text-zinc-400">{hour}:{minute}</span>}
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" collisionPadding={12} className="trade-date-popover w-[300px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-xl p-3" style={{maxHeight:"var(--radix-popover-content-available-height)"}}>
      <div className="mb-3 flex items-center justify-between px-1 text-xs"><span className="font-medium text-zinc-200">{label}</span><span className="rounded border border-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-400">UTC</span></div>
      <DayPicker mode="single" selected={selected || undefined} defaultMonth={selected || new Date()} onSelect={date=>{if(date)onChange(changeTradeDate(value,date));}} timeZone="UTC" showOutsideDays weekStartsOn={1} captionLayout="dropdown" navLayout="after" startMonth={new Date(1970,0,1)} endMonth={new Date(2100,11,31)} components={{Dropdown:CalendarDropdown}} />
      <div className="mt-3 border-t border-zinc-800 pt-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs text-zinc-400"><Clock3 className="size-3.5"/>Time (24-hour)</div>
        <div className="flex items-center gap-2">
          <SelectField value={hour} onValueChange={next=>onChange(changeTradeTime(value,"hour",next))} options={HOURS} label={`${label} hour`} allowClear={false}/>
          <span className="text-zinc-500">:</span>
          <SelectField value={minute} onValueChange={next=>onChange(changeTradeTime(value,"minute",next))} options={MINUTES} label={`${label} minute`} allowClear={false}/>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-4 text-zinc-500">Dates and times are recorded in UTC.</p>
      <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3">
        <button type="button" className="rounded px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100" onClick={()=>onChange(toTradeDateTimeInput(new Date().toISOString()))}>Now</button>
        <div className="flex items-center gap-2"><button type="button" className="rounded px-2 py-1 text-xs text-zinc-500 hover:text-zinc-100" onClick={()=>{onChange("");setOpen(false);onBlur?.();}}>Clear</button><Button type="button" size="sm" onClick={()=>{setOpen(false);onBlur?.();}}>Done</Button></div>
      </div>
    </PopoverContent>
  </Popover>;
}
