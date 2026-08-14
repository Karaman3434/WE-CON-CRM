/* WE-CON-CRM Price Service
 * Price calculations stay isolated from UI and product rendering.
 */
(function (global) {
  'use strict';

  function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  const service = {
    withDiscount(price, discountPercent) {
      const base = toNumber(price);
      const discount = toNumber(discountPercent);
      return base * (1 - discount / 100);
    },

    withMarkup(price, markupPercent) {
      const base = toNumber(price);
      const markup = toNumber(markupPercent);
      return base * (1 + markup / 100);
    },

    round(value, decimals = 2) {
      const factor = 10 ** Math.max(0, Number(decimals) || 0);
      return Math.round(toNumber(value) * factor) / factor;
    }
  };

  global.WEICONPriceService = Object.freeze(service);
})(window);
