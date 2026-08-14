/* WE-CON-CRM Modular Runtime
 * Loads the new architecture after the legacy page has initialized.
 * No legacy function is replaced here; this is the first runtime integration step.
 */
(function (global) {
  'use strict';

  const MODULES = [
    'js/core/app-state.js',
    'js/core/event-bus.js',
    'js/core/module-registry.js',
    'js/firebase/firebase-gateway.js',
    'js/firebase/storage-policy.js',
    'js/customers/customer-model.js',
    'js/customers/customer-repository.js',
    'js/customers/customer-service.js',
    'js/customers/customer-memory.js',
    'js/visits/activity-model.js',
    'js/visits/activity-repository.js',
    'js/products/product-model.js',
    'js/products/product-repository.js',
    'js/pricelist/price-service.js',
    'js/reports/report-model.js'
  ];

  const state = global.WEICONModularRuntime = {
    status: 'loading',
    loaded: [],
    failed: [],
    startedAt: Date.now()
  };

  function load(src) {
    return new Promise(function (resolve, reject) {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error('Module load failed: ' + src)); };
      document.head.appendChild(script);
    });
  }

  async function boot() {
    for (const src of MODULES) {
      try {
        await load(src);
        state.loaded.push(src);
      } catch (error) {
        state.failed.push({ src: src, message: error.message });
      }
    }

    state.status = state.failed.length ? 'degraded' : 'ready';
    state.finishedAt = Date.now();

    if (global.WEICONModuleRegistry && typeof global.WEICONModuleRegistry.register === 'function') {
      global.WEICONModuleRegistry.register('modular-runtime', {
        status: state.status,
        loaded: state.loaded.length,
        failed: state.failed.length
      });
    }

    global.dispatchEvent(new CustomEvent('weicon:modular-ready', { detail: state }));
    console.info('[WE-CON-CRM] Modular runtime:', state.status, state.loaded.length + '/' + MODULES.length);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})(window);
