/**
 * Gera um UUID v4. Usa crypto.randomUUID quando disponível;
 * fallback para ambientes onde não existe (HTTP, navegadores antigos, Linux sem contexto seguro).
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = "0123456789abcdef";
  const randomBytes = (n: number) => {
    const arr = new Uint8Array(n);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(arr);
    } else {
      for (let i = 0; i < n; i++) arr[i] = (Math.random() * 256) | 0;
    }
    return arr;
  };
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  return [...bytes]
    .map((b, i) => {
      const s = hex[b! >> 4] + hex[b! & 15];
      return i === 4 || i === 6 || i === 8 || i === 10 ? `-${s}` : s;
    })
    .join("");
}
