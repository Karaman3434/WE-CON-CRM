/*
  ayarlar-sync.js
  ===============
  Kur ve KDV oranı SADECE localStorage'da tutulmuyor — Firebase'in
  "ayarlar/" yoluna da yazılıyor ki bir cihazda (örn. Samsung S22) girilen
  kur, diğer cihazlarda (iPhone 13, iPad) de otomatik görünsün.

  OTOMATİK KUR ÇEKME: Ücretsiz Frankfurter.app servisinden (API anahtarı
  gerektirmez, CORS'a açık) EUR→TRY kuru sayfa her açıldığında ve 2 saatte
  bir otomatik çekilir — ama SADECE mevcut kur 2 saatten eskiyse (elle
  girilmiş taze bir kuru asla ezmez).

  ZORUNLU TAZELİK: Bir satış Kaydet/Gönder edilmeden önce send-render.js
  kurBayatMi()'yi kontrol eder; kur bayatsa önce otomatik çekmeyi dener,
  o da başarısız olursa kullanıcıyı zorunlu elle girişe yönlendirir —
  böylece merkez ofisin kestiği faturayla CRM kaydı arasında kur
  tutarsızlığı oluşmaz.

  Diğer tüm dosyalar (cart-data.js, reports-data.js, calc-render.js,
  veri-render.js) hâlâ aynı localStorage anahtarlarını ("weicon_kur",
  "weicon_kdv_orani") okuyor — bu dosya sadece o anahtarları hem Firebase
  hem dış kur servisiyle canlı senkron tutar.
*/

var AyarlarSync = (function(){

  var firebaseConfig = {
    apiKey: "AIzaSyC08Oe1LE7TdQl8gG2H9raZQek211Dxd60",
    authDomain: "weicon-asist.firebaseapp.com",
    databaseURL: "https://weicon-asist-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "weicon-asist",
    storageBucket: "weicon-asist.firebasestorage.app",
    messagingSenderId: "673730415323",
    appId: "1:673730415323:web:29c817e05a281261a61afe"
  };

  var dinleyiciler = [];
  var IKI_SAAT_MS = 2 * 60 * 60 * 1000;

  function baslat(){
    try{
      if(!firebase.apps.length){ firebase.initializeApp(firebaseConfig); }
      firebase.database().ref("ayarlar").on("value", function(snap){
        var v = snap.val() || {};
        if(v.kur!=null) localStorage.setItem("weicon_kur", v.kur);
        if(v.kdv!=null) localStorage.setItem("weicon_kdv_orani", v.kdv);
        if(v.kurZaman!=null) localStorage.setItem("weicon_kur_zaman", v.kurZaman);
        if(v.kurKaynak!=null) localStorage.setItem("weicon_kur_kaynak", v.kurKaynak);
        dinleyiciler.forEach(function(fn){
          try{ fn(); }catch(e){ console.error("Ayar senkron dinleyicisi hatası:", e); }
        });
      }, function(err){
        console.error("Ayarlar Firebase okuma hatası:", err);
      });
      otomatikKurGuncellemeyiBaslat();
    }catch(e){ console.error("Ayarlar senkronu başlatılamadı:", e); }
  }

  // Kur en son ne zaman girildi/güncellendi — 2 saatten eskiyse VEYA hiç
  // geçerli bir kur yoksa "bayat" sayılır.
  function kurBayatMi(){
    var kur = parseFloat(localStorage.getItem("weicon_kur"));
    if(!isFinite(kur) || kur<=0) return true;
    var zaman = parseFloat(localStorage.getItem("weicon_kur_zaman"));
    if(isNaN(zaman) || zaman<=0) return true;
    return (Date.now() - zaman) > IKI_SAAT_MS;
  }

  // Ücretsiz, API anahtarı gerektirmeyen EUR→TRY kur servislerinden çeker.
  // SIRALAMA (en isabetliden en garantiliye):
  //  1) TCMB (Türkiye Cumhuriyet Merkez Bankası) — merkez ofisin muhtemelen
  //     esas aldığı GERÇEK resmi Türk kuru. Tarayıcıdan (CORS) erişilebilir
  //     mi kesin garanti yok — başarısız olursa (ağ/CORS engeli) otomatik
  //     olarak aşağıdaki kaynaklara düşülür.
  //  2) Frankfurter.dev (ECB/Avrupa Merkez Bankası kaynaklı) — CORS'a açık,
  //     güvenilir ama TCMB'den küçük farklarla ayrılabilir.
  //  3) open.er-api.com — son çare yedek kaynak.
  // Sadece kur bayatsa (2 saatten eski) devreye girer — elle girilmiş taze
  // bir kuru asla ezmez.
  function tekKaynaktanDene(url, ayikla, basariCb, hataCb){
    fetch(url)
      .then(function(r){ if(!r.ok) throw new Error("HTTP " + r.status); return ayikla.xml ? r.text() : r.json(); })
      .then(function(veri){
        var kur = ayikla.xml ? ayikla.xml(veri) : ayikla(veri);
        if(!kur || isNaN(kur) || kur<=0) throw new Error("Kur verisi geçersiz");
        basariCb(kur);
      })
      .catch(hataCb);
  }

  function tcmbXmldenKurAyikla(xmlMetin){
    var dp = new DOMParser();
    var dom = dp.parseFromString(xmlMetin, "text/xml");
    if(dom.querySelector("parsererror")) return null;
    var currencyNode = Array.prototype.find.call(dom.getElementsByTagName("Currency"), function(n){
      return n.getAttribute("Kod") === "EUR" || n.getAttribute("CurrencyCode") === "EUR";
    });
    if(!currencyNode) return null;
    var satisNode = currencyNode.getElementsByTagName("ForexSelling")[0];
    return satisNode ? parseFloat(satisNode.textContent.replace(",",".")) : null;
  }

  function otomatikKurGetir(zorlaMi, geriBildir){
    if(!zorlaMi && !kurBayatMi()){ if(geriBildir) geriBildir(true); return; }
    tekKaynaktanDene(
      "https://www.tcmb.gov.tr/kurlar/today.xml",
      {xml: tcmbXmldenKurAyikla},
      function(kur){ kurKaydet(kur,"tcmb"); if(geriBildir) geriBildir(true, kur, "tcmb"); },
      function(errTcmb){
        console.error("TCMB'den kur çekilemedi (CORS/ağ olabilir), Frankfurter deneniyor:", errTcmb);
        tekKaynaktanDene(
          "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=TRY",
          function(v){ return v && v.rates && v.rates.TRY; },
          function(kur){ kurKaydet(kur,"frankfurter"); if(geriBildir) geriBildir(true, kur, "frankfurter"); },
          function(err1){
            console.error("Frankfurter'dan da kur çekilemedi, yedek kaynak deneniyor:", err1);
            tekKaynaktanDene(
              "https://open.er-api.com/v6/latest/EUR",
              function(v){ return v && v.rates && v.rates.TRY; },
              function(kur){ kurKaydet(kur,"yedek"); if(geriBildir) geriBildir(true, kur, "yedek"); },
              function(err2){
                console.error("Yedek kaynaktan da kur çekilemedi:", err2);
                if(geriBildir) geriBildir(false, null, err2);
              }
            );
          }
        );
      }
    );
  }

  function otomatikKurGuncellemeyiBaslat(){
    otomatikKurGetir(false);
    setInterval(function(){ otomatikKurGetir(false); }, IKI_SAAT_MS);
  }

  function degistiginde(fn){
    if(typeof fn === "function" && dinleyiciler.indexOf(fn)===-1) dinleyiciler.push(fn);
  }

  function kurKaydet(v, kaynak){
    var zaman = Date.now();
    localStorage.setItem("weicon_kur", v);
    localStorage.setItem("weicon_kur_zaman", zaman);
    if(kaynak) localStorage.setItem("weicon_kur_kaynak", kaynak);
    try{
      firebase.database().ref("ayarlar").update({kur:v, kurZaman:zaman, kurKaynak:kaynak||null});
    }catch(e){}
  }

  function kdvKaydet(v){
    localStorage.setItem("weicon_kdv_orani", v);
    try{ firebase.database().ref("ayarlar/kdv").set(v); }catch(e){}
  }

  return {
    baslat: baslat,
    degistiginde: degistiginde,
    kurKaydet: kurKaydet,
    kdvKaydet: kdvKaydet,
    kurBayatMi: kurBayatMi,
    otomatikKurGetir: otomatikKurGetir
  };

})();

AyarlarSync.baslat();
