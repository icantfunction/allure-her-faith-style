import { randomString, sha256 } from "./pkce";

const REGION = import.meta.env.VITE_AWS_REGION as string;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID as string;
const DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN as string;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI as string;
const LOGOUT_URI = import.meta.env.VITE_LOGOUT_URI as string;

const LS = {
  codeVerifier: "cg_code_verifier",
  idToken: "cg_id_token",
  accessToken: "cg_access_token",
  expiresAt: "cg_expires_at",
};

export function getIdToken() {
  const t = localStorage.getItem(LS.idToken);
  const exp = Number(localStorage.getItem(LS.expiresAt) || "0");
  if (!t || Date.now() >= exp) return null;
  return t;
}

export function signIn() {
  const verifier = randomString(96);
  localStorage.setItem(LS.codeVerifier, verifier);
  sha256(verifier).then((challenge) => {
    const url = new URL(`https://${DOMAIN}/oauth2/authorize`);
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", challenge);
    window.location.href = url.toString();
  });
}

export function signOut() {
  localStorage.removeItem(LS.idToken);
  localStorage.removeItem(LS.accessToken);
  localStorage.removeItem(LS.expiresAt);

  const url = new URL(`https://${DOMAIN}/logout`);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("logout_uri", LOGOUT_URI);
  window.location.href = url.toString();
}

export async function handleCallback(code: string) {
  const verifier = localStorage.getItem(LS.codeVerifier);
  if (!verifier) throw new Error("Missing PKCE verifier");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });

  const resp = await fetch(`https://${DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!resp.ok) throw new Error(`Token exchange failed: ${resp.status}`);

  const json = await resp.json();
  const now = Date.now();
  localStorage.setItem(LS.idToken, json.id_token);
  localStorage.setItem(LS.accessToken, json.access_token);
  localStorage.setItem(LS.expiresAt, String(now + (json.expires_in - 30) * 1000));
}

export function requireAuth(): string | null {
  const token = getIdToken();
  if (!token) signIn();
  return token;
}
