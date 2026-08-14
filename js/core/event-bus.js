/* WE-CON-CRM — Lightweight Event Bus */
(function (global) {
  'use strict';

  const events = new Map();

  function on(name, handler) {
    if (!events.has(name)) events.set(name, new Set());
    events.get(name).add(handler);
    return () => events.get(name)?.delete(handler);
  }

  function emit(name, payload) {
    events.get(name)?.forEach((handler) => {
      try { handler(payload); } catch (error) { console.error(error); }
    });
  }

  function off(name, handler) {
    events.get(name)?.delete(handler);
  }

  global.WEICONCRM = global.WEICONCRM || {};
  global.WEICONCRM.events = { on, off, emit };
})(window);
