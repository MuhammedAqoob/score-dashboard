const ADMIN_SESSION_KEY = "scoreboard_admin_session";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

export function getAdminSession() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function loginAdmin(username: string, password: string) {
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    throw new Error("Invalid admin credentials.");
  }

  window.localStorage.setItem(ADMIN_SESSION_KEY, "true");
}

export function logoutAdmin() {
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
}
