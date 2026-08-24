/*
  customer-data.js
  ================
  TEK görevi: müşteri listesini Firebase'in "musteriler" yolundan çekmek
  (eski uygulamayla AYNI yol) ve seçilen müşteriyi (bir sonraki sayfaya
  geçirmek üzere) localStorage'a yazmak.
*/

var CustomerData = (function(){

  var firebaseConfig = {
    apiKey: "AIzaSyC08Oe1LE7TdQl8gG2H9raZQek211Dxd60",
    authDomain: "weicon-asist.firebaseapp.com",
    databaseURL: "https://weicon-asist-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "weicon-asist",
    storageBucket: "weicon-asist.firebasestorage.app",
    messagingSenderId: "673730415323",
    appId: "1:673730415323:web:29c817e05a281261a61afe"
  };

  var SECILI_MUSTERI_KEY = "weicon_secili_musteri"; // eski uygulamayla PAYLAŞILAN anahtar

  var liste = [];
  var dinleyiciler = [];

  function baslat(){
    try{
      if(!firebase.apps.length){ firebase.initializeApp(firebaseConfig); }
      var db = firebase.database();
      db.ref("musteriler").on("value", function(snap){
        var data = snap.val();
        liste = data ? (Array.isArray(data) ? data.filter(Boolean) : Object.values(data)) : [];
        dinleyiciler.forEach(function(fn){ fn(); });
      }, function(err){
        console.error("Müşteri okuma hatası:", err);
      });
    }catch(e){
      console.error("Firebase başlatma hatası:", e);
    }
  }

  function listeDegistiginde(fn){ dinleyiciler.push(fn); }

  function ara(sorgu){
    var q = (sorgu||"").trim().toLocaleLowerCase("tr-TR");
    if(!q) return liste;
    return liste.filter(function(m){
      var ad = (m.ad||"").toLocaleLowerCase("tr-TR");
      var sehir = (m.sehir||"").toLocaleLowerCase("tr-TR");
      return ad.indexOf(q)>=0 || sehir.indexOf(q)>=0;
    });
  }

  function sec(musteri){
    try{ localStorage.setItem(SECILI_MUSTERI_KEY, JSON.stringify(musteri)); }catch(e){}
  }

  function seciliyiOku(){
    try{
      var v = localStorage.getItem(SECILI_MUSTERI_KEY);
      return v ? JSON.parse(v) : null;
    }catch(e){ return null; }
  }

  // ---- Ziyaret takibi: eski uygulamayla AYNI veri yapısı (ziyaretGecmisi
  // dizisi, her müşteri kaydının içinde) ----
  function gunFarkiHesapla(ts){
    return Math.floor((Date.now() - ts) / 86400000);
  }

  function ziyaretHatirlatmalari(){
    var sonuc = [];
    liste.forEach(function(m){
      var gecmis = m.ziyaretGecmisi || [];
      var enSonTs = gecmis.length ? Math.max.apply(null, gecmis.map(function(z){ return z.ts||0; })) : null;
      var gun = enSonTs ? gunFarkiHesapla(enSonTs) : null;
      sonuc.push({musteri:m.ad, sehir:m.sehir||"", gun:gun, hicZiyaretYok: gecmis.length===0});
    });
    sonuc.sort(function(a,b){
      if(a.hicZiyaretYok !== b.hicZiyaretYok) return a.hicZiyaretYok ? -1 : 1;
      return (b.gun||0)-(a.gun||0);
    });
    return sonuc;
  }

  function ziyaretEkle(musteriAd, not, geriBildir){
    try{
      var idx = liste.findIndex(function(m){ return (m.ad||"").toLocaleLowerCase("tr-TR")===(musteriAd||"").toLocaleLowerCase("tr-TR"); });
      if(idx===-1){ geriBildir(false, "Müşteri bulunamadı"); return; }
      if(!liste[idx].ziyaretGecmisi) liste[idx].ziyaretGecmisi = [];
      var kayit = {ts:Date.now(), not: not || "Ziyaret edildi, not girilmedi.", tur:"ziyaret"};
      liste[idx].ziyaretGecmisi.push(kayit);
      liste[idx].ziyaretGecmisi.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
      liste[idx].sonZiyaret = liste[idx].ziyaretGecmisi[0].ts;
      liste[idx].sonZiyaretNot = liste[idx].ziyaretGecmisi[0].not;

      firebase.database().ref("musteriler").set(liste).then(function(){
        geriBildir(true);
      }).catch(function(err){
        geriBildir(false, err);
      });
    }catch(e){ geriBildir(false, e); }
  }

  function musteriIdUret(){
    var maxNo = 0;
    liste.forEach(function(m){
      if(m.id && /^M-\d+$/.test(m.id)){
        var no = parseInt(m.id.slice(2), 10);
        if(no > maxNo) maxNo = no;
      }
    });
    return "M-" + String(maxNo+1).padStart(4, "0");
  }

  function benzerMusterileriBul(ad){
    var q = (ad||"").trim().toLocaleLowerCase("tr-TR");
    if(!q) return [];
    return liste.filter(function(m){
      var mevcut = (m.ad||"").trim().toLocaleLowerCase("tr-TR");
      if(!mevcut) return false;
      return mevcut === q || mevcut.indexOf(q) >= 0 || q.indexOf(mevcut) >= 0;
    });
  }

  function yeniMusteriKaydet(bilgi, geriBildir){
    try{
      if(!bilgi.ad || !bilgi.ad.trim()){ geriBildir(false, "Müşteri adı girin."); return; }
      var yeni = {
        id: musteriIdUret(),
        ad: bilgi.ad.trim(),
        sehir: (bilgi.sehir||"").trim(),
        vade: (bilgi.vade||"").trim(),
        fatura: (bilgi.fatura||"").trim(),
        telefon: (bilgi.telefon||"").trim(),
        eposta: (bilgi.eposta||"").trim(),
        kargo: (bilgi.kargo||"").trim(),
        ziyaretGecmisi: [],
        iletisimler: []
      };
      var yeniListe = [yeni].concat(liste);
      firebase.database().ref("musteriler").set(yeniListe).then(function(){
        geriBildir(true, yeni);
      }).catch(function(err){
        geriBildir(false, err);
      });
    }catch(e){ geriBildir(false, e); }
  }

  function musteriGuncelle(musteriAd, guncelBilgi, geriBildir){
    try{
      var idx = liste.findIndex(function(m){ return (m.ad||"").toLocaleLowerCase("tr-TR")===(musteriAd||"").toLocaleLowerCase("tr-TR"); });
      if(idx===-1){ geriBildir(false, "Müşteri bulunamadı"); return; }
      liste[idx].vade = guncelBilgi.vade;
      liste[idx].fatura = guncelBilgi.fatura;
      liste[idx].kargo = guncelBilgi.kargo;
      firebase.database().ref("musteriler").set(liste).then(function(){
        geriBildir(true);
      }).catch(function(err){ geriBildir(false, err); });
    }catch(e){ geriBildir(false, e); }
  }

  function musteriBul(ad){
    return liste.find(function(m){ return (m.ad||"").toLocaleLowerCase("tr-TR")===(ad||"").toLocaleLowerCase("tr-TR"); }) || null;
  }

  function musteriAdresEkle(musteriAd, tip, etiket, adres, geriBildir){
    try{
      var idx = liste.findIndex(function(m){ return (m.ad||"").toLocaleLowerCase("tr-TR")===(musteriAd||"").toLocaleLowerCase("tr-TR"); });
      if(idx===-1){ geriBildir(false, "Müşteri bulunamadı"); return; }
      var alan = tip==="fatura" ? "faturaAdresleri" : "teslimatAdresleri";
      if(!liste[idx][alan]) liste[idx][alan] = [];
      liste[idx][alan].push({etiket: etiket || (tip==="fatura"?"Fatura Adresi":"Teslimat Adresi"), adres: adres});
      firebase.database().ref("musteriler").set(liste).then(function(){ geriBildir(true); }).catch(function(err){ geriBildir(false, err); });
    }catch(e){ geriBildir(false, e); }
  }

  function musteriAdresSil(musteriAd, tip, adresIdx, geriBildir){
    try{
      var idx = liste.findIndex(function(m){ return (m.ad||"").toLocaleLowerCase("tr-TR")===(musteriAd||"").toLocaleLowerCase("tr-TR"); });
      if(idx===-1){ geriBildir(false, "Müşteri bulunamadı"); return; }
      var alan = tip==="fatura" ? "faturaAdresleri" : "teslimatAdresleri";
      if(!liste[idx][alan]) liste[idx][alan] = [];
      liste[idx][alan].splice(adresIdx, 1);
      firebase.database().ref("musteriler").set(liste).then(function(){ geriBildir(true); }).catch(function(err){ geriBildir(false, err); });
    }catch(e){ geriBildir(false, e); }
  }

  function yetkiliEkle(musteriAd, kisi, geriBildir){
    try{
      var idx = liste.findIndex(function(m){ return (m.ad||"").toLocaleLowerCase("tr-TR")===(musteriAd||"").toLocaleLowerCase("tr-TR"); });
      if(idx===-1){ geriBildir(false, "Müşteri bulunamadı"); return; }
      if(!liste[idx].iletisimler) liste[idx].iletisimler = [];
      liste[idx].iletisimler.push(kisi);
      firebase.database().ref("musteriler").set(liste).then(function(){ geriBildir(true); }).catch(function(err){ geriBildir(false, err); });
    }catch(e){ geriBildir(false, e); }
  }

  function yetkiliSil(musteriAd, kisiIdx, geriBildir){
    try{
      var idx = liste.findIndex(function(m){ return (m.ad||"").toLocaleLowerCase("tr-TR")===(musteriAd||"").toLocaleLowerCase("tr-TR"); });
      if(idx===-1){ geriBildir(false, "Müşteri bulunamadı"); return; }
      if(!liste[idx].iletisimler) liste[idx].iletisimler = [];
      liste[idx].iletisimler.splice(kisiIdx, 1);
      firebase.database().ref("musteriler").set(liste).then(function(){ geriBildir(true); }).catch(function(err){ geriBildir(false, err); });
    }catch(e){ geriBildir(false, e); }
  }

  return {
    baslat: baslat,
    listeDegistiginde: listeDegistiginde,
    ara: ara,
    sec: sec,
    seciliyiOku: seciliyiOku,
    uzunluk: function(){ return liste.length; },
    ziyaretHatirlatmalari: ziyaretHatirlatmalari,
    ziyaretEkle: ziyaretEkle,
    gunFarkiHesapla: gunFarkiHesapla,
    yeniMusteriKaydet: yeniMusteriKaydet,
    benzerMusterileriBul: benzerMusterileriBul,
    musteriGuncelle: musteriGuncelle,
    musteriBul: musteriBul,
    musteriAdresEkle: musteriAdresEkle,
    musteriAdresSil: musteriAdresSil,
    yetkiliEkle: yetkiliEkle,
    yetkiliSil: yetkiliSil
  };

})();

CustomerData.baslat();
