import { useCallback } from "react";
import { fetchTradeCustomFields, createTradeCustomField } from "@/api/tradeCustomFields.api";
import { useAsyncQuery } from "./useAsyncQuery";
export function useTradeCustomFields(journalId,{enabled=true}={}) {
  const fetchFields=useCallback(()=>fetchTradeCustomFields(journalId),[journalId]);
  const query=useAsyncQuery(fetchFields,[journalId],{enabled:!!journalId&&enabled});
  const create=async definition=>{const field=await createTradeCustomField(journalId,definition);query.refetch();return field;};
  return {...query,fields:query.data??[],create};
}
