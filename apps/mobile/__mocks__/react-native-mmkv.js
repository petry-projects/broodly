function createMMKV() {
  const store = new Map();
  return {
    getString: (key) => store.get(key),
    set: (key, value) => store.set(key, value),
    remove: (key) => store.delete(key),
    clearAll: () => store.clear(),
  };
}

module.exports = { createMMKV };
