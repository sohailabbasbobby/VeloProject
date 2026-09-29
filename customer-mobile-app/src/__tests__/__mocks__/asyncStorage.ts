/**
 * In-memory AsyncStorage mock for the Node test environment
 * (the real native module is unavailable under jest).
 * Mapped over `@react-native-async-storage/async-storage` in jest.config.js.
 */
const store = new Map();

export const AsyncStorageMock = {
  getItem: async (key: string) => (store.has(key) ? (store.get(key) as string) : null),
  setItem: async (key: string, value: string) => {
    store.set(key, String(value));
    return null;
  },
  removeItem: async (key: string) => {
    store.delete(key);
    return null;
  },
  clear: async () => {
    store.clear();
    return null;
  },
};

export const __resetAsyncStorage = (): void => {
  store.clear();
};

export default AsyncStorageMock;
