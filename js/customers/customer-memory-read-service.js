/* WE-CON-CRM Customer Memory Read Service
 * Builds a read-only customer intelligence snapshot from the modular repositories.
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

    return global.WEICONCustomerMemory.summarize(customer, [], []);
  }

  global.WEICONCustomerMemoryReadService = Object.freeze({
    getCustomerSnapshot
  });
})(window);
