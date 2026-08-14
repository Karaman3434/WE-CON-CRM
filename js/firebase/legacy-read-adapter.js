/* WE-CON-CRM Legacy Firebase Read Adapter
 * Read-only bridge from the existing index.html Firebase helpers into the new architecture.
 * IMPORTANT: this adapter deliberately refuses every write operation.
 */
(function (global) {
  'use strict';

  function getLegacyReader() {
    if (typeof global.fbGet !== 'function') {
      throw new Error('Legacy Firebase reader (fbGet) is not ready.');
    }
    return global.fbGet;
  }

  const adapter = {
    async read(path) {
      const reader = getLegacyReader();
      return reader(path);
    },

    async write() {
      throw new Error('READ_ONLY_BRIDGE: Firebase write is disabled during migration.');
    },

    async update() {
      throw new Error('READ_ONLY_BRIDGE: Firebase update is disabled during migration.');
    },

    async remove() {
      throw new Error('READ_ONLY_BRIDGE: Firebase remove is disabled during migration.');
    }
  };

  global.WEICONLegacyFirebaseReadAdapter = adapter;
})(window);
