
const configuredApiBase = (import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

const API_BASE_URL = import.meta.env.PROD
  ? `${configuredApiBase || "https://nextshow-backend.onrender.com"}${
      configuredApiBase.endsWith("/api") ? "" : "/api"
    }`
  : "/api";
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("nextshow_token");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;

  return response.json();
}

export function getEvents() {
  return apiFetch("/events");
}

export function getCategories() {
  return apiFetch("/categories");
}

export function getEventsByCategory(categoryId) {
  return apiFetch(`/events/category/${categoryId}`);
}

export function searchEvents(keyword) {
  return apiFetch(`/events/search?keyword=${encodeURIComponent(keyword)}`);
}

export function loginUser(email, password) {
  return apiFetch("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
export function getShowsByEvent(eventId) {
  return apiFetch(`/shows/event/${eventId}`);
}

export function registerUser(userData) {
  return apiFetch("/users/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}