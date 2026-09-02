/*
  maas-ozet-veri.js
  ===================
  DOM'a HİÇ dokunmayan, sadece "açık dönem"in HESABA YATACAK tutarını
  hesaplayan paylaşılan modül. Ana Sayfa'daki özet kutucuk bunu kullanır.

  Mantık, maas-hesaplama-render.js içindeki mhHesaplaVeCiz() ile BİREBİR
  aynı olacak şekilde bilerek buraya da (özet/salt-okunur amaçla) taşındı.
  Maaş hesaplama formülü ileride değişirse, aynı değişiklik oradaki
  fonksiyonla birlikte burada da yapılmalı.

  Bağımlılıklar (bu dosyadan ÖNCE yüklenmiş olmalı): KomisyonData,
  AvansKayitData, MaasKayitData, MaasHesaplamaData.
*/

var MaasOzetVeri = (function(){

  function aylarToplamiHesapla(aylar){
    var toplam = 0;
    for(var ay=1; ay<=12; ay++) toplam += parseFloat(aylar && aylar[ay]) || 0;
    return toplam;
  }

  function guncelKomisyonToplami(){
    try{
      var kayitlar = KomisyonData.tumKayitlar();
      if(!kayitlar || !kayitlar.length) return 0;
      return aylarToplamiHesapla(kayitlar[0].aylar);
    }catch(e){ return 0; }
  }

  function referansKomisyonToplamiHesapla(){
    try{
      var maasKayitlari = MaasKayitData.tumKayitlar();
      if(maasKayitlari.length) return maasKayitlari[0].komisyonReferansToplam || 0;
      var komisyonKayitlari = KomisyonData.tumKayitlar();
      if(komisyonKayitlari.length > 1) return aylarToplamiHesapla(komisyonKayitlari[1].aylar);
      return 0;
    }catch(e){ return 0; }
  }

  function brutPrimDizisiOlustur(acikAy, acikYil, acikBrutPrim){
    var dizi = {};
    try{
      MaasKayitData.tumKayitlar().forEach(function(k){
        if(k.yil === acikYil) dizi[k.ay] = k.brutPrim || 0;
      });
    }catch(e){}
    dizi[acikAy] = acikBrutPrim;
    return dizi;
  }

  function matrahBazOku(){
    try{ return JSON.parse(localStorage.getItem("weicon_matrah_baz")||"null"); }catch(e){ return null; }
  }
  function oncekiAyHesapla(ay, yil){
    var oncekiAy = ay - 1, oncekiYil = yil;
    if(oncekiAy < 1){ oncekiAy = 12; oncekiYil -= 1; }
    return {ay:oncekiAy, yil:oncekiYil};
  }
  function matrahOnceOverride(acikAy, acikYil){
    var baz = matrahBazOku();
    if(!baz) return null;
    var onceki = oncekiAyHesapla(acikAy, acikYil);
    if(baz.ay === onceki.ay && baz.yil === onceki.yil) return baz.matrah;
    return null;
  }

  function avansToplamiOku(ay, yil){
    var kapali = null;
    try{ kapali = AvansKayitData.kapaliKaydiBul(ay, yil); }catch(e){}
    var veri;
    if(kapali){
      veri = kapali;
    } else {
      try{ veri = AvansKayitData.taslakOku(ay, yil); }catch(e){ veri = {ozelAvansGirisleri:[], isAvansiGirisleri:[], isAvansiHarcamalar:[]}; }
    }
    var ozelToplam = (veri.ozelAvansGirisleri||[]).reduce(function(s,x){ return s+(x.tutar||0); }, 0);
    var isToplam = (veri.isAvansiGirisleri||[]).reduce(function(s,x){ return s+(x.tutar||0); }, 0);
    var belgelenenToplam = (veri.isAvansiHarcamalar||[]).reduce(function(s,x){ return s+(x.tutar||0); }, 0);
    var isKesilecek = Math.max(0, isToplam - belgelenenToplam);
    return ozelToplam + isKesilecek;
  }

  // Şu an açık (henüz kapatılmamış) dönem için canlı hesap — Maaş + Prim
  // Hesaplama sayfasındaki "HESABA YATACAK MAAŞ" kutusuyla birebir aynı sonuç.
  function acikDonemHesapla(){
    var acik = MaasKayitData.acikDonem();
    var brutSabit = parseFloat(localStorage.getItem("weicon_brut_sabit_maas")) || 0;

    var komisyonToplam = guncelKomisyonToplami();
    var referans = referansKomisyonToplamiHesapla();
    var brutPrim = Math.max(0, komisyonToplam - referans);

    var primDizisi = brutPrimDizisiOlustur(acik.ay, acik.yil, brutPrim);
    var matrahOverride = matrahOnceOverride(acik.ay, acik.yil);
    var sonuc = MaasHesaplamaData.ayHesapla(acik.ay, brutSabit, primDizisi, matrahOverride);

    var avansToplam = avansToplamiOku(acik.ay, acik.yil);
    var hesabaYatacak = sonuc.netToplam - avansToplam;

    return {ay: acik.ay, yil: acik.yil, hesabaYatacak: hesabaYatacak};
  }

  return {
    acikDonemHesapla: acikDonemHesapla
  };

})();
