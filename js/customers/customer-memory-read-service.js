/* WE-CON-CRM Customer Memory Read Service
 * Builds a read-only customer intelligence snapshot from the modular repositories.
 * Activity history is normalized from the legacy customer record through the activity adapter.
 * No Firebase/localStorage writes are performed here.
 */
(function (global) {
  'use strict';

  async function getCustomerSnapshot(customerId) {
    if (!customerId) throw new TypeError('customerId is required.');
    if (!global.WEICONCustomerRepository) throw new Error('Customer repository is not loaded.');
    if (!global.WEICONCustomerMemory) throw new Error('Customer memory module is not loaded.');

    const customers = await global.WEICONCustomerRepository.list();
    const customer = customers.find(item => String(item.id) === String(customerId)) || null;
    if (!customer) return null;

    const activities = global.WEICONCustomerActivityAdapter
      ? global.WEICONCustomerActivityAdapter.fromCustomer(customer)
      : [];

    const orders = [
      customer.orders,
      customer.siparisler,
      customer.siparisGecmisi,
      customer.orderHistory
    ].find(Array.isArray) || [];

    return global.WEICONCustomerMemory.summarize(customer, activities, orders);
  }

  global.WEICONCustomerMemoryReadService = Object.freeze({
    getCustomerSnapshot
  });
})(window);
