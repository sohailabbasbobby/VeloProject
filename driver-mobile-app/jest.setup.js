/**
 * Jest setup for the driver app test suite.
 * Provides an in-memory AsyncStorage mock (the real native module is
 * unavailable in the Node test environment).
 */
let store = new Map();

const AsyncStorageMock = {
  getItem: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
  setItem: jest.fn(async (key, value) => {
    store.set(key, String(value));
    return null;
  }),
  removeItem: jest.fn(async (key) => {
    store.delete(key);
    return null;
  }),
  clear: jest.fn(async () => {
    store.clear();
    return null;
  }),
};

beforeEach(() => {
  store = new Map();
  AsyncStorageMock.getItem.mockClear();
  AsyncStorageMock.setItem.mockClear();
  AsyncStorageMock.removeItem.mockClear();
  AsyncStorageMock.clear.mockClear();
});

module.exports = { AsyncStorageMock };
