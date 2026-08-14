/* WE-CON-CRM Product Repository */
(function (global) {
  'use strict';

  const repository = {
    adapter: null,

    configure(adapter) {
      if (!adapter || typeof adapter.list !== 'function') {
        throw new TypeError('Product adapter must implement list().');
      }
      this.adapter = adapter;
      return this;
    },

    async list() {
      if (!this.adapter) throw new Error('Product repository is not configured.');
      const result = await this.adapter.list();
      return Array.isArray(result) ? result.slice() : [];
    }
  };

  global.WEICONProductRepository = repository;
})(window);
