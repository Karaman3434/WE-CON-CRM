/* WE-CON-CRM Customer Service
 * Business rules for customer operations live here before UI migration.
 */
(function (global) {
  'use strict';

  function requireRepository() {
    if (!global.WEICONCustomerRepository) {
      throw new Error('Customer repository is not loaded.');
    }
    return global.WEICONCustomerRepository;
  }

  const service = {
    async getAll() {
      return requireRepository().list();
    },

    async create(customer) {
      return requireRepository().save(customer);
    },

    async update(customer) {
      if (!customer || !customer.id) {
        throw new TypeError('Updated customer must have an id.');
      }
      return requireRepository().save(customer);
    },

    async remove(customerId) {
      return requireRepository().remove(customerId);
    }
  };

  global.WEICONCustomerService = service;
})(window);
