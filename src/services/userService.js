import { getToken } from "../auth";

const API_URL = import.meta.env.VITE_API_URL || "https://localhost:7080/api/users";

async function parseError(response, fallback) {
  try {
    const data = await response.json();
    if (data.errors) {
      const messages = Object.values(data.errors).flat();
      if (messages.length) return messages.join(" ");
    }
    return data.message || data.title || fallback;
  } catch {
    return fallback;
  }
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) throw new Error(await parseError(response, `Request failed (${response.status}).`));
  if (response.status === 204) return null;
  return response.json();
}

export const getUsers = () => request(API_URL);
export const getUser = (id) => request(`${API_URL}/${id}`);
export const createUser = (user) => request(API_URL, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(user)
});
export const updateUser = (id, user) => request(`${API_URL}/${id}`, {
  method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...user, id: Number(id) })
});
export const deleteUser = (id) => request(`${API_URL}/${id}`, { method: "DELETE" });
