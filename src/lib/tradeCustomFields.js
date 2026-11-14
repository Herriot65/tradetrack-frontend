export const TRADE_SECTIONS = [
  {value:"execution",label:"EXECUTION"}, {value:"performance",label:"PERFORMANCE"},
  {value:"setup",label:"SETUP"}, {value:"psychology",label:"PSYCHOLOGY"},
  {value:"notes",label:"NOTES"},
];
export const CUSTOM_FIELD_TYPES = [
  {value:"text",label:"Text"}, {value:"number",label:"Number"},
  {value:"select",label:"Dropdown"}, {value:"boolean",label:"Yes / no"},
];
export function customFieldOptions(text) {
  return [...new Set(text.split(/[\n,]/).map(value=>value.trim()).filter(Boolean))];
}
