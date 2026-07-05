import '@testing-library/jest-dom'

// jsdom under vitest does not always ship a working Storage implementation;
// install a spec-shaped in-memory fallback so cart persistence is testable.
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.clear !== 'function') {
  const store = new Map<string, string>()
  const mockStorage: Storage = {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, String(value)),
    removeItem: (key) => void store.delete(key),
    key: (index) => [...store.keys()][index] ?? null,
  }
  Object.defineProperty(globalThis, 'localStorage', { value: mockStorage, writable: true })
  Object.defineProperty(window, 'localStorage', { value: mockStorage, writable: true })
}
