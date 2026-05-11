const store = new Map();

function createMMKV() {
  return {
    getString: (key) => store.get(key),
    set: (key, value) => store.set(key, value),
    remove: (key) => store.delete(key),
  };
}

module.exports = { createMMKV };
