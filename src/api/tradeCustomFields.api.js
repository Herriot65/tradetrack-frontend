import api from "./axios";
import { USE_MOCK } from "@/mocks/mockData";
const key = journalId => `journal_custom_fields_${journalId}`;
export async function deleteTradeCustomField(journalId,id) {
  if(USE_MOCK) {
    localStorage.setItem(key(journalId),JSON.stringify(read(journalId).filter(field=>String(field.id)!==String(id))));
    return;
  }
  await api.delete(`/journals/${journalId}/custom-fields/${id}/`);
}
function read(journalId) {
  try { return JSON.parse(localStorage.getItem(key(journalId)) || "[]"); } catch { return []; }
}
export async function fetchTradeCustomFields(journalId) {
  if(USE_MOCK) return read(journalId);
  const {data} = await api.get(`/journals/${journalId}/custom-fields/`);
  return Array.isArray(data) ? data : data.results ?? [];
}
export async function createTradeCustomField(journalId,payload) {
  if(USE_MOCK) {
    const fields=read(journalId);
    if(fields.some(field=>field.section===payload.section && field.label.toLowerCase()===payload.label.trim().toLowerCase())) throw new Error("A field with this name already exists in this section.");
    const field={...payload,label:payload.label.trim(),id:Math.max(Date.now(),...fields.map(field=>Number(field.id)+1)),created_at:new Date().toISOString()};
    localStorage.setItem(key(journalId),JSON.stringify([...fields,field]));return field;
  }
  const {data}=await api.post(`/journals/${journalId}/custom-fields/`,payload);return data;
}

export async function updateTradeCustomFieldOptions(journalId,id,options) {
  if(USE_MOCK) {
    const fields=read(journalId), field=fields.find(field=>String(field.id)===String(id));
    if(!field) throw new Error('Field no longer exists.');
    const updated={...field,options};
    localStorage.setItem(key(journalId),JSON.stringify(fields.map(field=>String(field.id)===String(id)?updated:field)));
    return updated;
  }
  const {data}=await api.patch(`/journals/${journalId}/custom-fields/${id}/`,{options});return data;
}

export async function renameTradeCustomField(journalId,id,label) {
  const name=label.trim();
  if(USE_MOCK) {
    const fields=read(journalId),field=fields.find(field=>String(field.id)===String(id));
    if(!field)throw new Error('Field no longer exists.');
    if(!name||name.length>80)throw new Error('Enter a field name of 1–80 characters.');
    if(fields.some(other=>other.id!==field.id && other.section===field.section && other.label.toLowerCase()===name.toLowerCase()))throw new Error('A field with this name already exists in this section.');
    const updated={...field,label:name};
    localStorage.setItem(key(journalId),JSON.stringify(fields.map(item=>item.id===field.id?updated:item)));return updated;
  }
  const {data}=await api.patch(`/journals/${journalId}/custom-fields/${id}/`,{label:name});return data;
}
