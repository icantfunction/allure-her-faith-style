export function base64url(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function randomString(len = 96) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return base64url(arr.buffer);
}
export async function sha256(input: string) {
  const enc = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return base64url(hash);
}
