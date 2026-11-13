import SelectField from "./select-field";

export default function CalendarDropdown({ options, value, onChange, "aria-label": label, disabled }) {
  return <SelectField value={value} onValueChange={next => onChange?.({ target: { value: next } })} options={options} label={label} disabled={disabled} allowClear={false} className="h-8 w-auto shrink-0 border-transparent bg-transparent px-2" />;
}
