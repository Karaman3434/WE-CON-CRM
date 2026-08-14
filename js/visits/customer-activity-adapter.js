/* WE-CON-CRM Customer Activity Adapter
 * Read-only normalization of activity-like fields embedded in legacy customer records.
 * No Firebase/localStorage writes are performed.
 */
(function (global) {
  'use strict';

  const TYPE_ALIASES = Object.freeze({
    ziyaret: 'ziyaret',
    visit: 'ziyaret',
    mail: 'mail',
    email: 'mail',
    whatsapp: 'WhatsApp',
    'whatsapp': 'WhatsApp',
    numune: 'numune',
    sample: 'numune',
    proforma: 'proforma'
  });

  function normalizeType(value) {
    const raw = String(value == null ? '' : value).trim();
    const key = raw.toLocaleLowerCase('tr-TR');
    return TYPE_ALIASES[key] || raw;
  }

  function normalize(item, customerId, index) {
    const source = item && typeof item === 'object' ? item : {};
    return {
      id: source.id == null ? `${customerId || 'customer'}-activity-${index}` : String(source.id),
      customerId: customerId == null ? '' : String(customerId),
      type: normalizeType(source.type || source.hareket || source.tur || source.tip),
      date: source.date || source.tarih || source.createdAt || '',
      note: source.note || source.not || source.aciklama || source.description || ''
    };
  }

  function fromCustomer(customer) {
    if (!customer || typeof customer !== 'object') return [];
    const customerId = customer.id || customer.musteriId || customer.customerId || '';
    const candidates = [
      customer.activities,
      customer.activity,
      customer.hareketler,
      customer.hareket,
      customer.sonHareketler,
      customer.ziyaretler,
      customer.ziyaretGecmisi
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate.map((item, index) => normalize(item, customerId, index));
      }
    }

    return [];
  }

  global.WEICONCustomerActivityAdapter = Object.freeze({ fromCustomer, normalize, normalizeType });
})(window);
