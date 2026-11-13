import { useCallback } from "react";
import { fetchTradeCustomFields, createTradeCustomField, deleteTradeCustomField, updateTradeCustomFieldOptions, renameTradeCustomField } from "@/api/tradeCustomFields.api";
import { useAsyncQuery } from "./useAsyncQuery";
export function useTradeCustomFields(journalId,{enabled=true}={}) {
  const fetchFields=useCallback(()=>fetchTradeCustomFields(journalId),[journalId]);
  const query=useAsyncQuery(fetchFields,[journalId],{enabled:!!journalId&&enabled, retainOnDisable:true});
  const create=async definition=>{const field=await createTradeCustomField(journalId,definition);query.refetch();return field;};
  const remove=async id=>{await deleteTradeCustomField(journalId,id);query.refetch();};
  const updateOptions=async (id,options)=>{const field=await updateTradeCustomFieldOptions(journalId,id,options);query.refetch();return field;};
  const rename=async(id,label)=>{const field=await renameTradeCustomField(journalId,id,label);query.refetch();return field;};
  return {...query,fields:query.data??[],create,remove,updateOptions,rename};
}
