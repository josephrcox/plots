// Share links: the active town is gzipped (pako, loaded globally from
// index.html), base64url-encoded, and put in a `?shareId=` URL. Opening such a
// link stores the town in TEMP storage, which the app shows read-only.
// This file runs before main.js so the store can see the TEMP town on load.

const TEMP_GAME_DB_NAME = "plots_temp_game_db";
const ACTIVE_GAME_DB_NAME = "plots_active_game_db";

function compressAndEncode(data) {
  // @ts-ignore - pako is a global
  const bytes = pako.gzip(JSON.stringify(data));
  // Build the binary string in chunks to avoid call-stack limits.
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeAndDecompress(urlSafeData) {
  const base64Data = urlSafeData.replace(/-/g, "+").replace(/_/g, "/");
  const binaryStr = atob(base64Data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  // @ts-ignore - pako is a global
  return JSON.parse(pako.ungzip(bytes, { to: "string" }));
}

/** Returns a URL that opens the current town read-only. */
export function compressMyGame() {
  // The payload is the saved JSON string (kept for compatibility with
  // links created by earlier versions).
  const json = localStorage.getItem(ACTIVE_GAME_DB_NAME);
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("shareId", compressAndEncode(json));
  return url.toString();
}

const shareId = new URLSearchParams(window.location.search).get("shareId");
if (shareId) {
  try {
    const sharedData = JSON.parse(decodeAndDecompress(shareId));
    localStorage.setItem(TEMP_GAME_DB_NAME, JSON.stringify(sharedData));
  } catch (error) {
    console.error("Could not open shared town", error);
    localStorage.removeItem(TEMP_GAME_DB_NAME);
  }
} else {
  localStorage.removeItem(TEMP_GAME_DB_NAME);
}
