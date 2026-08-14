/* WE-CON-CRM Firebase Gateway
 * Single boundary for remote data access.
 * This module intentionally does not replace the existing Firebase implementation yet.
 * It provides a safe contract for the later migration from index.html.
 */

(function (global) {
  'use strict';

  const gateway = {
    status: 'unconfigured',
    getStatus() {
      return this.status;
    },
    configure(adapter) {
      if (!adapter || typeof adapter !== 'object') {
        throw new TypeError('Firebase adapter is required.');
      }
      this.adapter = adapter;
      this.status = 'configured';
      return this;
    },
    async read(path) {
      if (!this.adapter || typeof this.adapter.read !== 'function') {
        throw new Error('Firebase gateway is not configured.');
      }
      return this.adapter.read(path);
    },
    async write(path, value) {
      if (!this.adapter || typeof this.adapter.write !== 'function') {
        throw new Error('Firebase gateway is not configured.');
      }
      return this.adapter.write(path, value);
    },
    async update(path, value) {
      if (!this.adapter || typeof this.adapter.update !== 'function') {
        throw new Error('Firebase gateway is not configured.');
      }
      return this.adapter.update(path, value);
    },
    async remove(path) {
      if (!this.adapter || typeof this.adapter.remove !== 'function') {
        throw new Error('Firebase gateway is not configured.');
      }
      return this.adapter.remove(path);
    }
  };

  global.WEICONFirebaseGateway = gateway;
})(window);
