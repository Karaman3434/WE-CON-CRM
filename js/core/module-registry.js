/* WE-CON-CRM — Core Module Registry
 * Safe foundation for incremental modularization.
 * This file is intentionally standalone until index.html is switched to module loading.
 */
(function (global) {
  'use strict';

  const registry = Object.create(null);

  function register(name, module) {
    if (!name || !module) throw new Error('Module adı ve modül zorunludur.');
    if (registry[name]) throw new Error(`Modül zaten kayıtlı: ${name}`);
    registry[name] = module;
    return module;
  }

  function get(name) {
    return registry[name] || null;
  }

  function has(name) {
    return Object.prototype.hasOwnProperty.call(registry, name);
  }

  function list() {
    return Object.keys(registry);
  }

  global.WEICONCRM = global.WEICONCRM || {};
  global.WEICONCRM.modules = { register, get, has, list };
})(window);
