/* WE-CON-CRM Customer Memory
 * Read-oriented customer intelligence layer.
 * It deliberately does not write to Firebase or localStorage yet.
 */
(function (global) {
  'use strict';

  function latest(items, selector) {
    return (Array.isArray(items) ? items : [])
      .filter(Boolean)
      .slice()
      .sort((a, b) => {
        const av = selector(a) || '';
        const bv = selector(b) || '';
        return String(bv).localeCompare(String(av));
      })[0] || null;
  }

  const memory = {
    summarize(customer, activities, orders) {
      const acts = Array.isArray(activities) ? activities : [];
      const ords = Array.isArray(orders) ? orders : [];

      const lastActivity = latest(acts, item => item.date || item.tarih);
      const lastOrder = latest(ords, item => item.date || item.tarih);

      return Object.freeze({
        customerId: customer && customer.id ? String(customer.id) : '',
        lastActivity,
        lastOrder,
        activityCount: acts.length,
        orderCount: ords.length
      });
    }
  };

  global.WEICONCustomerMemory = Object.freeze(memory);
})(window);
