import type { JwtPayload } from "@/types";

/**
 * Manually decode a JWT payload without any external package.
 * Does NOT verify the signature — for display/gate purposes only.
 */
export function decodeJwt(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  // Base64url → base64 → decode
  const base64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const decoded = atob(padded);
  return JSON.parse(decoded) as JwtPayload;
}

/**
 * Returns true if the token has NOT expired (i.e. is still valid).
 */
export function isTokenExpired(payload: JwtPayload): boolean {
  return payload.exp * 1000 <= Date.now();
}
