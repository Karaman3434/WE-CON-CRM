/* WE-CON-CRM Customer Selection Bridge
 * Safe event bridge for the legacy UI. It does not alter existing handlers.
 * A legacy UI integration can call select(customer) when its real customer-card
 * selection point is known; until then it remains passive.
 */
(function (global) {
  'use strict';

  function select(customer) {
    const id = customer && typeof customer === 'object'
      ? (customer.id || customer.musteriId || customer.customerId || '')
      : String(customer || '');
    if (!id || typeof global.CustomEvent !== 'function') return false;

    global.dispatchEvent(new CustomEvent('weicon:customer-selected', {
      detail: { customerId: String(id), customer: customer }
    }));
    return true;
  }

  global.WEICONCustomerSelectionBridge = Object.freeze({ select });
})(window);
