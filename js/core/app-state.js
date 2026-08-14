/* WE-CON-CRM — Shared Application State
 * Firebase remains the authoritative data source.
 * This store is an in-memory UI state layer only; it never persists data by itself.
 */
(function (global) {
  'use strict';

  const state = {
    activeView: null,
    selectedCustomerId: null,
    selectedProductId: null,
    customerFilter: '',
    productFilter: '',
    loading: false,
    initialized: false
  };

  const listeners = new Set();

  function snapshot() {
    return Object.freeze({ ...state });
  }

  function get(key) {
    return state[key];
  }

  function set(key, value) {
    if (!Object.prototype.hasOwnProperty.call(state, key)) {
      throw new Error(`Bilinmeyen state anahtarı: ${key}`);
    }
    if (Object.is(state[key], value)) return;
    state[key] = value;
    const current = snapshot();
    listeners.forEach((listener) => {
      try { listener(current, key, value); } catch (error) { console.error(error); }
    });
  }

  function update(values) {
    Object.keys(values || {}).forEach((key) => set(key, values[key]));
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  global.WEICONCRM = global.WEICONCRM || {};
  global.WEICONCRM.state = { get, set, update, snapshot, subscribe };
})(window);
