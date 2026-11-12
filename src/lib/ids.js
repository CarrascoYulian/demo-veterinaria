const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

/** Código legible de la cita, por ejemplo VET-A7F3. `rand` permite usar un generador con semilla. */
export function makeCode(existing, rand = Math.random) {
  const used = new Set(existing)
  for (;;) {
    let c = 'VET-'
    for (let i = 0; i < 4; i++) c += ALPHABET[Math.floor(rand() * ALPHABET.length)]
    if (!used.has(c)) return c
  }
}

/** Generador pseudoaleatorio con semilla (mulberry32), para datos demo reproducibles. */
export function seededRandom(seed) {
  let a = (Number(seed) || 1) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
