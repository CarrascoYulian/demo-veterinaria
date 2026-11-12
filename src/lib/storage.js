export const KEYS = {
  config: 'vetdemo:config',
  data: 'vetdemo:data',
  admin: 'vetdemo:admin',
}

export function load(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* sin almacenamiento disponible */
  }
}

export function sessionGet(key) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

export function sessionSet(key, value) {
  try {
    if (value === null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, value)
  } catch {
    /* sin almacenamiento disponible */
  }
}
