/* WE-CON-CRM data policy
 * Remote Firebase data remains authoritative.
 * localStorage is explicitly limited to UI/cache concerns until the legacy migration is complete.
 */

(function (global) {
  'use strict';

  const REMOTE = 'remote';
  const CACHE = 'cache';

  const policy = Object.freeze({
    REMOTE,
    CACHE,
    isAuthoritative(source) {
      return source === REMOTE;
    },
    canReplaceRemoteFromCache() {
      return false;
    }
  });

  global.WEICONDataPolicy = policy;
})(window);
