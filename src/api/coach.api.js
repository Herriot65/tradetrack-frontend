import api from "./axios";
import { BASE_URL } from "./session";
import { getAccessToken } from "../auth/tokenService";
const base = (id) => `/journals/${id}/coach`;
export const coachStatus = async (id) => (await api.get(`${base(id)}/chat/`)).data;
export const askCoach = async (id, payload, signal, onDelta = () => {}) => {
  const url = `${BASE_URL}${base(id)}/chat/stream/`;
  const request = () => fetch(url, { method: "POST", credentials: "include", signal, headers: { "Content-Type": "application/json", ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}) }, body: JSON.stringify(payload) });
  let response = await request();
  if (response.status === 401) {
    // Let the shared Axios client refresh the cookie backed session, then retry once.
    await coachStatus(id);
    response = await request();
  }
  if (!response.ok) {
    let data = {};
    try { data = await response.json(); } catch { /* Non-JSON server error. */ }
    if (!data.detail) data.detail = "The coach's server couldn't finish this request. Your question is still here; please try again shortly.";
    throw { response: { status: response.status, data } };
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Streaming responses are unavailable in this browser.");
  const decoder = new TextDecoder();
  let buffer = "", result = null;
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const events = buffer.split("\n\n"); buffer = events.pop() || "";
    for (const event of events) {
      const line = event.split("\n").find(item => item.startsWith("data: "));
      if (!line) continue;
      const data = JSON.parse(line.slice(6));
      if (data.type === "delta") {
        // Keep the answer visibly progressive even when the server flushes several
        // small SSE frames together into one browser read.
        for (let offset = 0; offset < data.text.length && !signal?.aborted; offset += 18) {
          onDelta(data.text.slice(offset, offset + 18));
          await new Promise(resolve => setTimeout(resolve, 12));
        }
      } else if (data.type === "reset") onDelta("\u0000RESET\u0000");
      else if (data.type === "done") result = data.result;
      else if (data.type === "error") throw { response: { status: 503, data: { detail: data.detail, code: data.code } } };
    }
    if (done) break;
  }
  if (!result) throw new Error("The coach stream ended before the answer was complete.");
  return result;
};
export const listCoachTasks = async (id) => (await api.get(`${base(id)}/tasks/`)).data;
export const saveCoachTask = async (id, payload, taskId) => (await api[taskId ? "patch" : "post"](`${base(id)}/tasks/${taskId ? `${taskId}/` : ""}`, payload)).data;
export const deleteCoachTask = async (id, taskId) => api.delete(`${base(id)}/tasks/${taskId}/`);
export const runCoachTask = async (id, taskId) => (await api.post(`${base(id)}/tasks/${taskId}/run/`, {}, { timeout: 300000 })).data;
export const coachTaskHistory = async (id, taskId) => (await api.get(`${base(id)}/tasks/${taskId}/history/`)).data;
const requireCoachSettings = (data) => {
  if (!data || !Array.isArray(data.providers) || typeof data.provider !== "string") throw new Error("Invalid AI settings response");
  return data;
};
export const getCoachSettings = async (signal) => requireCoachSettings((await api.get("/auth/coach-settings/", { signal })).data);
export const saveCoachSettings = async (payload) => requireCoachSettings((await api.patch("/auth/coach-settings/", payload)).data);
export const testCoachConnection = async () => (await api.post("/auth/coach-settings/connection-test/", {}, { timeout: 20000 })).data;
