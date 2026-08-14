/* WE-CON-CRM Customer Repository
 * Migration boundary for customer data.
 * Not wired into index.html yet: this keeps the legacy CRM untouched while
 * defining the contract used by the future migration.
 */

(function (global) {
  'use strict';

  function assertAdapter(adapter) {
    if (!adapter || typeof adapter.read !== 'function' || typeof adapter.write !== 'function') {
      throw new TypeError('Customer adapter must implement read() and write().');
    }
  }

  function clone(value) {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  const repository = {
    adapter: null,

    configure(adapter) {
      assertAdapter(adapter);
      this.adapter = adapter;
      return this;
    },

    async list() {
      if (!this.adapter) throw new Error('Customer repository is not configured.');
      const data = await this.adapter.read();
      return Array.isArray(data) ? clone(data) : [];
    },

    async save(customer) {
      if (!this.adapter) throw new Error('Customer repository is not configured.');
      if (!customer || typeof customer !== 'object') {
        throw new TypeError('Customer must be an object.');
      }
      return this.adapter.write(clone(customer));
    },

    async remove(customerId) {
      if (!this.adapter) throw new Error('Customer repository is not configured.');
      if (!customerId) throw new TypeError('Customer id is required.');
      return this.adapter.remove ? this.adapter.remove(customerId) : this.adapter.write({ id: customerId, _deleted: true });
    }
  };

  global.WEICONCustomerRepository = repository;
})(window);
