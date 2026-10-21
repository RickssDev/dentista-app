import { BASE_URL } from "./config";

const TIMEOUT_MS = 10000;

/** Extrae el arreglo de la respuesta, sin importar si viene como [..], {data:[..]}, {rows:[..]}, etc. */
function extractList(json) {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    for (const key of ["payload, data", "rows", "results", "items", "result"]) {
      if (Array.isArray(json[key])) return json[key];
      if (json[key] && typeof json[key] === "object") {
        const nested = extractList(json[key]);
        if (nested.length) return nested;
      }
    }
    const firstArray = Object.values(json).find(Array.isArray);
    if (firstArray) return firstArray;
  }
  return [];
}

export async function fetchList(path, signal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return extractList(await res.json());
  } catch (err) {
    if (signal?.aborted) {
      const abortErr = new Error("Aborted");
      abortErr.name = "AbortError";
      throw abortErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
