/* WE-CON-CRM Customer Memory UI Bridge
 * Exposes a safe, read-only API for the legacy UI to request a customer snapshot.
 * It does not manipulate the DOM and never writes customer data.
 */
(function (global) {
  'use strict';

  async function getSnapshot(customerId) {
    const service = global.WEICONCustomerMemoryReadService;
    if (!service || typeof service.getCustomerSnapshot !== 'function') {
      throw new Error('Customer memory read service is not ready.');
    }
    return service.getCustomerSnapshot(customerId);
  }

  function getCustomerId(value) {
    if (value == null) return '';
    if (typeof value === 'object') {
      return value.id || value.musteriId || value.customerId || '';
    }
    return String(value);
  }

  global.WEICONCustomerMemoryUIBridge = Object.freeze({
    getSnapshot,
    getCustomerId
  });
})(window);
