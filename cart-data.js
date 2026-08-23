/*
  cart-data.js
  ============
  TEK görevi: sepet verisini (product-data.js ile PAYLAŞILAN localStorage
  anahtarı üzerinden) okumak/güncellemek ve fiyat hesaplama formüllerini
  uygulamak. Formüller eski app-part3.js -> hesapla() fonksiyonundan BİREBİR
  taşındı, iş mantığı değişmedi.
*/

var CartData = (function(){

  var SEPET_KEY = "weiconv2_sepet";
  var KDV_KEY = "weicon_kdv_orani"; // eski uygulamayla PAYLAŞILAN anahtar
  var KUR_KEY = "weicon_kur"; // eski uygulamayla PAYLAŞILAN anahtar

  var sepet = [];
  try{
    var kayitli = localStorage.getItem(SEPET_KEY);
    if(kayitli) sepet = JSON.parse(kayitli);
  }catch(e){ sepet = []; }

  function kaydet(){
    try{ localStorage.setItem(SEPET_KEY, JSON.stringify(sepet)); }catch(e){}
  }

  function liste(){ return sepet; }

  function sil(idx){
    var i = sepet.findIndex(function(u){ return u.idx === idx; });
    if(i>=0){ sepet.splice(i,1); kaydet(); }
  }

  function alaniGuncelle(idx, alan, deger){
    var u = sepet.find(function(u){ return u.idx === idx; });
    if(u){ u[alan] = deger; kaydet(); }
  }

  function kurOku(){
    var v = parseFloat(localStorage.getItem(KUR_KEY));
    return isNaN(v) ? 0 : v;
  }
  function kurKaydet(v){
    localStorage.setItem(KUR_KEY, v);
  }
  function kdvOku(){
    var v = parseFloat(localStorage.getItem(KDV_KEY));
    return isNaN(v) ? 20 : v;
  }

  // ---- Formüller: eski hesapla() ile birebir aynı ----
  function hesapla(urun, kur, kdv){
    var listeFiyat = parseFloat(urun.listeFiyat)||0;
    var dipFiyat = parseFloat(urun.dipFiyat)||0;
    var iskonto = parseFloat(urun.iskonto)||0;
    var adet = parseFloat(urun.adet)||1;

    var iskontoluFiyat = listeFiyat - (listeFiyat*iskonto/100);
    var tlBirimFiyat = iskontoluFiyat * kur;
    var maliyetKar = iskontoluFiyat - dipFiyat;
    var toplamMaliyetKar = maliyetKar * adet;
    var mudurPrim = toplamMaliyetKar * 0.22;
    var mudurPrimTL = mudurPrim * kur;
    var toplamEuro = adet * iskontoluFiyat;
    var faturaToplam = adet * tlBirimFiyat * (1 + kdv/100);

    return {
      iskontoluFiyat: iskontoluFiyat,
      tlBirimFiyat: tlBirimFiyat,
      maliyetKar: maliyetKar,
      toplamMaliyetKar: toplamMaliyetKar,
      mudurPrim: mudurPrim,
      mudurPrimTL: mudurPrimTL,
      toplamEuro: toplamEuro,
      faturaToplam: faturaToplam
    };
  }

  function genelToplam(kur, kdv){
    var toplamEuro = 0, toplamPrim = 0;
    sepet.forEach(function(u){
      var h = hesapla(u, kur, kdv);
      toplamEuro += h.toplamEuro;
      if(h.mudurPrim > 0) toplamPrim += h.mudurPrim;
    });
    return {toplamEuro:toplamEuro, toplamPrim:toplamPrim};
  }

  function fmt(n){
    return (n||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  return {
    liste: liste,
    sil: sil,
    alaniGuncelle: alaniGuncelle,
    kurOku: kurOku,
    kurKaydet: kurKaydet,
    kdvOku: kdvOku,
    hesapla: hesapla,
    genelToplam: genelToplam,
    fmt: fmt
  };

})();
