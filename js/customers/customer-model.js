/* WE-CON-CRM Customer Model
 * Normalizes customer records without changing the legacy data source.
 */
(function (global) {
  'use strict';

  function normalize(value) {
    const source = value && typeof value === 'object' ? value : {};
    return Object.assign({}, source, {
      id: source.id == null ? '' : String(source.id),
      ad: source.ad == null ? '' : String(source.ad),
      firma: source.firma == null ? '' : String(source.firma),
      telefon: source.telefon == null ? '' : String(source.telefon)
    });
  }

  global.WEICONCustomerModel = Object.freeze({ normalize });
})(window);
