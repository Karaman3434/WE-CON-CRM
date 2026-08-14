/* WE-CON-CRM Customer Read Bridge
 * Connects the new customer repository to the existing Firebase data source.
 * Read-only by design: no customer write path is enabled here.
 */
(function (global) {
  'use strict';

  const MAX_ATTEMPTS = 50;
  const RETRY_MS = 100;

  function waitForDependencies(attempt) {
    const gateway = global.WEICONFirebaseGateway;
    const repository = global.WEICONCustomerRepository;
    const adapter = global.WEICONLegacyFirebaseReadAdapter;

    if (gateway && repository && adapter && typeof global.fbGet === 'function') {
      gateway.configure(adapter);
      repository.configure({
        async read() {
          const data = await adapter.read('musteriler');
          if (Array.isArray(data)) return data;
          return data && typeof data === 'object' ? Object.values(data) : [];
        },
        async write() {
          throw new Error('READ_ONLY_BRIDGE: customer writes are disabled during migration.');
        },
        async remove() {
          throw new Error('READ_ONLY_BRIDGE: customer deletes are disabled during migration.');
        }
      });

      global.WEICONCustomerReadBridge = {
        status: 'ready',
        source: 'legacy-firebase',
        path: 'musteriler',
        readOnly: true
      };

      global.dispatchEvent(new CustomEvent('weicon:customer-read-ready', {
        detail: global.WEICONCustomerReadBridge
      }));
      return;
    }

    if (attempt >= MAX_ATTEMPTS) {
      global.WEICONCustomerReadBridge = {
        status: 'waiting-for-legacy-firebase',
        source: 'legacy-firebase',
        path: 'musteriler',
        readOnly: true
      };
      return;
    }

    setTimeout(function () {
      waitForDependencies(attempt + 1);
    }, RETRY_MS);
  }

  waitForDependencies(0);
})(window);
