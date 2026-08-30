const createProxy = (key) => new Proxy([], {
  get: (target, prop) => {
    if (!window.MOCK_DATA || !window.MOCK_DATA[key]) return [][prop];
    const actual = window.MOCK_DATA[key];
    const val = actual[prop];
    return typeof val === 'function' ? val.bind(actual) : val;
  },
  ownKeys: (target) => {
    return window.MOCK_DATA && window.MOCK_DATA[key] ? Reflect.ownKeys(window.MOCK_DATA[key]) : [];
  },
  getOwnPropertyDescriptor: (target, prop) => {
    return window.MOCK_DATA && window.MOCK_DATA[key] ? Reflect.getOwnPropertyDescriptor(window.MOCK_DATA[key], prop) : undefined;
  }
});

const createObjProxy = (key) => new Proxy({}, {
  get: (target, prop) => {
    if (!window.MOCK_DATA || !window.MOCK_DATA[key]) return {}[prop];
    const actual = window.MOCK_DATA[key];
    const val = actual[prop];
    return typeof val === 'function' ? val.bind(actual) : val;
  },
  ownKeys: (target) => {
    return window.MOCK_DATA && window.MOCK_DATA[key] ? Reflect.ownKeys(window.MOCK_DATA[key]) : [];
  },
  getOwnPropertyDescriptor: (target, prop) => {
    return window.MOCK_DATA && window.MOCK_DATA[key] ? Reflect.getOwnPropertyDescriptor(window.MOCK_DATA[key], prop) : undefined;
  }
});

export const MOCK_VEHICLES = createProxy('MOCK_VEHICLES');
export const MOCK_CHAUFFEURS = createProxy('MOCK_CHAUFFEURS');
export const MOCK_CORP_CLIENTS = createProxy('MOCK_CORP_CLIENTS');
export const MOCK_PRIV_CLIENTS = createProxy('MOCK_PRIV_CLIENTS');
export const MOCK_LEDGER = createProxy('MOCK_LEDGER');
export const MOCK_ACTIVE_TASKS = createProxy('MOCK_ACTIVE_TASKS');
export const MOCK_STAFF = createProxy('MOCK_STAFF');
export const MOCK_THREADS = createProxy('MOCK_THREADS');
export const MOCK_FINANCIALS = createObjProxy('MOCK_FINANCIALS');
export const MOCK_WHITELABEL = createObjProxy('MOCK_WHITELABEL');
export const MOCK_GLOBAL_SETTINGS = createObjProxy('MOCK_GLOBAL_SETTINGS');
