import { useState } from "react";

const storageKey = "zikit-sentinel.admin-token";

function readSessionToken(): string {
  try {
    return window.sessionStorage.getItem(storageKey) ?? "";
  } catch {
    return "";
  }
}

export function useSessionAdminToken() {
  const [token, setTokenState] = useState(readSessionToken);

  const setToken = (nextToken: string) => {
    setTokenState(nextToken);
    try {
      if (nextToken.length === 0) window.sessionStorage.removeItem(storageKey);
      else window.sessionStorage.setItem(storageKey, nextToken);
    } catch {
      // El token sigue disponible en memoria si el navegador bloquea sessionStorage.
    }
  };

  return { token, setToken, authorized: token.trim().length > 0 };
}
