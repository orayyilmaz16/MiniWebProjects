export type PasswordDigest = { saltB64: string; hashB64: string; iterations: number };

function b64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function unb64(s: string) {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export async function hashPassword(password: string, iterations = 120_000): Promise<PasswordDigest> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return { saltB64: b64(salt.buffer), hashB64: b64(bits), iterations };
}

export async function verifyPassword(password: string, digest: PasswordDigest): Promise<boolean> {
  const salt = new Uint8Array(unb64(digest.saltB64));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: digest.iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return b64(bits) === digest.hashB64;
}
