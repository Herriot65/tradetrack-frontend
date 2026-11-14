import { useState } from "react";
import { useAuth } from "@/auth/useAuth";
export const fields = {
 execution: [["asset","Asset"],["side","Side"],["entry_datetime","Entry date/time"],["exit_datetime","Exit date/time"],["risk_percent","Risk"]],
 performance: [["pnl_r","PnL"],["status","Status"],["commission","Commission"],["swap","Swap"]],
 notes: [["notes","General trade notes"]],
 setup: [['reference_timeframe','Reference TF'],['trade_score','Trade score'],['opportunity_timeframe','Opportunity TF'],['entry_timeframe','Entry TF'],['trend_direction','Trend'],['session','Session'],['setup','Setup']],
 psychology: [['emotions','Emotion'],['mistakes','Mistake']],
};
export const removableFields = new Set([...fields.setup, ...fields.psychology, ["commission"], ["swap"]].map(([id]) => id));
export function useEntryFieldPreferences(journalId) {
 const auth = useAuth();
 const owner = auth?.user?.id ?? auth?.user?.email ?? 'browser';
 const legacyKey = `nexora_entry_fields:${owner}`;
 const key = `${legacyKey}:journal:${journalId ?? 'none'}`;
 const [stored, setStored] = useState({});
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState('');
 const account = auth?.user?.entry_configuration ?? {};
 const read = storageKey => {
  try {
   const value = JSON.parse(localStorage.getItem(storageKey) || 'null');
   return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch { return null; }
 };
 const savedKey = `${key}:saved`;
 const baseline = (auth?.updatePreferences ? account.journals?.[String(journalId)] ?? account.defaults : read(savedKey)) ?? read(legacyKey) ?? {};
 const normalize = value => Object.fromEntries(Object.values(fields).flat().map(([id, label]) => {
  const item = value[id] ?? {};
  return [id, {label: typeof item.label === 'string' ? item.label.trim() || label : label, visible: !removableFields.has(id) || item.visible !== false}];
 }));
 const cached = Object.hasOwn(stored, key) ? stored[key] : read(key);
 const preferences = cached ?? baseline;
 const dirty = JSON.stringify(normalize(preferences)) !== JSON.stringify(normalize(baseline));
 const clearDraft = () => {
  setStored(previous => ({...previous,[key]:null}));
  try { localStorage.removeItem(key); } catch { /* Session state still updates. */ }
 };
 const discard = () => { clearDraft();setError(''); };
 const update = next => {
  setStored(previous => ({...previous, [key]: next}));
  setError('');
  try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Session preferences still work. */ }
 };
 const save = async scope => {
  setSaving(true);setError('');
  try {
   if (!auth?.updatePreferences || !journalId) {
    // Isolated previews and offline drafts remain usable without an account.
    try { localStorage.setItem(savedKey, JSON.stringify(preferences)); } catch { throw new Error('Storage unavailable'); }
    if (scope === 'future') {
     try { localStorage.setItem(legacyKey, JSON.stringify(preferences)); } catch { throw new Error('Storage unavailable'); }
    }
    clearDraft();
    return true;
   }
   await auth.updatePreferences({entry_configuration_update:{scope,journal_id:Number(journalId),fields:preferences}});
   clearDraft();
   return true;
  } catch {
   setError('Could not save your configuration. Your edits are kept here. Please try again.');
   return false;
  } finally { setSaving(false); }
 };
 return {preferences, dirty, discard, save, saving, error, accountBacked:!!auth?.updatePreferences,
  label: (id, fallback) => typeof preferences[id]?.label === 'string' && preferences[id].label.trim() || fallback,
  visible: id => !removableFields.has(id) || preferences[id]?.visible !== false,
  change: (id, patch) => update({...preferences, [id]: {...preferences[id], ...patch, ...(!removableFields.has(id) ? {visible:true} : {})}}),
  reset: section => update(Object.fromEntries(Object.entries(preferences).filter(([id]) => !fields[section].some(([field]) => field === id)))),
 };
}
