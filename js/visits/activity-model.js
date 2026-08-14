/* WE-CON-CRM Activity Model
 * Canonical shape for Son Hareket / visit records.
 * Legacy data is not modified until the migration is explicitly wired.
 */
(function (global) {
  'use strict';

  const TYPES = Object.freeze(['ziyaret', 'mail', 'WhatsApp', 'numune', 'proforma']);

  function normalize(value) {
    const source = value && typeof value === 'object' ? value : {};
    const type = source.type || source.hareket || '';
    return Object.assign({}, source, {
      id: source.id == null ? '' : String(source.id),
      customerId: source.customerId == null ? '' : String(source.customerId),
      type: TYPES.includes(type) ? type : String(type),
      date: source.date || source.tarih || '',
      note: source.note || source.not || source.aciklama || ''
    });
  }

  global.WEICONActivityModel = Object.freeze({ TYPES, normalize });
})(window);
