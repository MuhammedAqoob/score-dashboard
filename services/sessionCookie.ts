const SESSION_COOKIE_NAME = "scoreboard_username";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function getSessionUsername() {
  if (typeof document === "undefined") {
    return "";
  }

  const cookies = document.cookie.split("; ");
  const sessionCookie = cookies.find((cookie) =>
    cookie.startsWith(`${SESSION_COOKIE_NAME}=`),
  );

  if (!sessionCookie) {
    return "";
  }

  return decodeURIComponent(sessionCookie.split("=")[1] ?? "");
}

export function setSessionUsername(username: string) {
  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(
    username,
  )}; path=/; max-age=${MAX_AGE_SECONDS}; sameSite=lax`;
}

export function clearSessionUsername() {
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; sameSite=lax`;
}
