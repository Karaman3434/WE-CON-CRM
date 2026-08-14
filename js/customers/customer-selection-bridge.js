/* WE-CON-CRM Customer Selection Bridge
 * Non-invasive bridge for the legacy UI. Existing click handlers are preserved.
 * If a clicked customer element exposes a customer ID, the standard selection
 * event is emitted for the new Customer Memory UI layer.
 */
(function (global) {
  'use strict';

  function getIdFromElement(element) {
    if (!element || !element.getAttribute) return '';
    return element.getAttribute('data-customer-id') ||
      element.getAttribute('data-musteri-id') ||
      element.getAttribute('data-customerid') || '';
  }

  function select(customer, target) {
    const id = customer && typeof customer === 'object'
      ? (customer.id || customer.musteriId || customer.customerId || '')
      : String(customer || '');
    if (!id || typeof global.CustomEvent !== 'function') return false;

    global.dispatchEvent(new CustomEvent('weicon:customer-selected', {
      detail: { customerId: String(id), customer: customer, target: target || null }
    }));
    return true;
  }

  function findCustomerElement(start) {
    let node = start;
    while (node && node !== document.body) {
      const id = getIdFromElement(node);
      if (id) return { element: node, id: id };
      node = node.parentElement;
    }
    return null;
  }

  function boot() {
    document.addEventListener('click', function (event) {
      const found = findCustomerElement(event.target);
      if (found) select(found.id, found.element);
    }, true);
  }

  global.WEICONCustomerSelectionBridge = Object.freeze({
    select,
    getIdFromElement,
    findCustomerElement
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})(window);
