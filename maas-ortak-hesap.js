/*
  maas-ortak-hesap.js — VERSİYON: WG.270926.2200.650
  ======================================================
  27.09.2026 mimari bölünmesi: Maaş Hesaplama tek sayfaydı, artık üç
  bağımsız sayfaya bölündü (Brüt Maaş→Net Maaş / Ödenebilir Komisyon'daki
  Brüt Prim→Net Prim / Maaş Hesaplama özet). Hesaplama KURALLARI hiç
  değişmedi (maas-hesaplama-data.js'e dokunulmadı) — ama o dosyadaki
  ayHesapla() fonksiyonu PRİM ve SABİT MAAŞ'ı TEK bir paylaşılan kümülatif
  vergi matrahı üzerinden hesaplıyor (PRİM istisnasız önce eklenir, SABİT
  MAAŞ istisnalı sonra eklenir). Bu yüzden Net Maaş'ı doğru hesaplamak için
  o ayın Brüt Prim'ini de bilmek gerekiyor — iki sayfa birbirinden habersiz
  ayrı ayrı hesaplarsa rakamlar TUTARSIZ çıkar.

  Bu modül, o paylaşılan girdi hazırlama + hesaplama mantığını TEK yerde
  toplar. Hem net-maas-hesaplama-render.js (Net Maaş sayfası) hem
  odenebilir-komisyon-render.js (Brüt/Net Prim bölümü) hem de
  maas-hesaplama-render.js (özet sayfası) AYNI MaasOrtakHesap.hesapla()
  çağrısını kullanır — sonuç nesnesi aynıdır, her sayfa sadece kendi
  ilgilendiği alanı (netSabitMaas veya netPrim) ekrana yazar.
*/

var MaasOrtakHesap = (function(){

  function aylarToplamiHesapla(aylar){
    var toplam = 0;
    for(var ay=1; ay<=12; ay++) toplam += parseFloat(aylar && aylar[ay]) || 0;
    return toplam;
  }

  // Ödenebilir Komisyon'un EN GÜNCEL kaydındaki 12 ayın toplamı + o kaydın
  // tarih anahtarı (ay eşleşme uyarısı için gerekli).
  function guncelKomisyonToplami(){
    try{
      var kayitlar = KomisyonData.tumKayitlar();
      if(!kayitlar || !kayitlar.length) return {toplam:0, tarih:null};
      return {toplam: aylarToplamiHesapla(kayitlar[0].aylar), tarih: kayitlar[0].anahtar};
    }catch(e){ return {toplam:0, tarih:null}; }
  }

  // Brüt Prim'in referans noktası: son kapatılan maaş döneminde geçerli olan
  // komisyon toplamı. Hiç maaş kaydı yoksa, en güncel Ödenebilir Komisyon
  // kaydından BİR ÖNCEKİ kaydın toplamı referans alınır.
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

  // Ay eşleşme uyarısı: en güncel Ödenebilir Komisyon kaydının tarihi,
  // hesaplanan ay/yılın İÇİNDE ya da SONRASINDA değilse (yani bu ay için
  // henüz güncel fotoğraf yüklenmediyse) true döner.
  function komisyonAyUyumsuzMu(acikAy, acikYil, komisyonTarihAnahtari){
    if(!komisyonTarihAnahtari) return true;
    var p = komisyonTarihAnahtari.split("-");
    var kYil = parseInt(p[0],10), kAy = parseInt(p[1],10);
    if(isNaN(kYil) || isNaN(kAy)) return true;
    if(kYil > acikYil) return false;
    if(kYil === acikYil && kAy >= acikAy) return false;
    return true;
  }

  function brutSabitOku(){
    return parseFloat(localStorage.getItem("weicon_brut_sabit_maas")) || 0;
  }

  // Açık/canlı dönem için TAM hesaplama — Net Maaş sayfası, Ödenebilir
  // Komisyon'un Brüt/Net Prim bölümü ve Maaş Hesaplama özeti hepsi bunu
  // çağırır, hepsi AYNI sonuç nesnesinden kendi ilgili alanını okur.
  function hesapla(acikAy, acikYil){
    var brutSabit = brutSabitOku();
    var komisyon = guncelKomisyonToplami();
    var referans = referansKomisyonToplamiHesapla();
    var brutPrim = Math.max(0, komisyon.toplam - referans);
    var primDizisi = brutPrimDizisiOlustur(acikAy, acikYil, brutPrim);
    var matrahOverride = matrahOnceOverride(acikAy, acikYil);
    var sonuc = MaasHesaplamaData.ayHesapla(acikAy, brutSabit, primDizisi, matrahOverride);
    return {
      ay: acikAy, yil: acikYil,
      brutSabit: brutSabit,
      komisyonToplam: komisyon.toplam,
      komisyonTarih: komisyon.tarih,
      komisyonAyUyumsuz: komisyonAyUyumsuzMu(acikAy, acikYil, komisyon.tarih),
      referans: referans,
      brutPrim: brutPrim,
      matrahOverride: matrahOverride,
      sonuc: sonuc
    };
  }

  return {
    hesapla: hesapla,
    oncekiAyHesapla: oncekiAyHesapla,
    matrahBazOku: matrahBazOku
  };

})();
