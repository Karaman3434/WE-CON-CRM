/* WE-CON-CRM Product Model */
(function (global) {
  'use strict';

  function normalize(value) {
    const source = value && typeof value === 'object' ? value : {};
    return Object.assign({}, source, {
      id: source.id == null ? '' : String(source.id),
      name: source.name || source.urun || source.ürün || '',
      bertaCode: source.bertaCode || source.berta || '',
      abasCode: source.abasCode || source.abas || '',
      price: source.price == null ? null : Number(source.price)
    });
  }

  global.WEICONProductModel = Object.freeze({ normalize });
})(window);
