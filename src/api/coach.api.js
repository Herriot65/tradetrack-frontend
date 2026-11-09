import api from "./axios";
const base = (id) => `/journals/${id}/coach`;
export const coachStatus = async (id) => (await api.get(`${base(id)}/chat/`)).data;
export const askCoach = async (id, payload, signal) => (await api.post(`${base(id)}/chat/`, payload, { timeout: 300000, signal })).data;
export const listCoachTasks = async (id) => (await api.get(`${base(id)}/tasks/`)).data;
export const saveCoachTask = async (id, payload, taskId) => (await api[taskId ? "patch" : "post"](`${base(id)}/tasks/${taskId ? `${taskId}/` : ""}`, payload)).data;
export const deleteCoachTask = async (id, taskId) => api.delete(`${base(id)}/tasks/${taskId}/`);
export const runCoachTask = async (id, taskId) => (await api.post(`${base(id)}/tasks/${taskId}/run/`, {}, { timeout: 300000 })).data;
export const coachTaskHistory = async (id, taskId) => (await api.get(`${base(id)}/tasks/${taskId}/history/`)).data;
