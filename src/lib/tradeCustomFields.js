export const TRADE_SECTIONS = [
  {value:"execution",label:"Execution"}, {value:"performance",label:"Performance"},
  {value:"setup",label:"Setup"}, {value:"psychology",label:"Psychology"},
  {value:"notes",label:"Notes"}, {value:"trade_notes",label:"Trade notes"},
];
export const CUSTOM_FIELD_TYPES = [
  {value:"text",label:"Text"}, {value:"number",label:"Number"},
  {value:"select",label:"Dropdown"}, {value:"boolean",label:"Yes / no"},
];
export function customFieldOptions(text) {
  return [...new Set(text.split(/[\n,]/).map(value=>value.trim()).filter(Boolean))];
}
