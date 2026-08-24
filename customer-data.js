/*
  customer-data.js
  ================
  Müşteri listesini Firebase'in "musteriler" yolundan okur/yazar.

  GÜVENLİ YAZMA DESENİ — ÇOK ÖNEMLİ:
  Eski uygulama, geçmişte TAM olarak bu hataya düşmüştü: cihazın belleğindeki
  (muhtemelen bayat) tüm müşteri dizisini doğrudan Firebase'in üzerine
  yazıyordu. Sayfa yeni açılmışken ya da başka bir cihaz/sekme bir değişiklik
  yaptıysa, bu bayat veri sunucudaki GÜNCEL veriyi SESSİZCE silebiliyordu.
  Bunu tekrarlamamak için: her yazma işleminden HEMEN ÖNCE sunucudan TAZE
  veri okunur, değişiklik SADECE o taze veri üzerine uygulanır, sonra öyle
  yazılır. Yerel önbellek (liste) SADECE okuma/görüntüleme için kullanılır,
  YAZMA için asla doğrudan kullanılmaz.
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

  var SECILI_MUSTERI_KEY = "weicon_secili_musteri";

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

  function musteriBul(ad){
    return liste.find(function(m){ return (m.ad||"").toLocaleLowerCase("tr-TR")===(ad||"").toLocaleLowerCase("tr-TR"); }) || null;
  }

  // ---- GÜVENLİ YAZMA ÇEKİRDEĞİ ----
  function guvenliYaz(mutateFn, geriBildir){
    try{
      var db = firebase.database();
      db.ref("musteriler").once("value").then(function(snap){
        var data = snap.val();
        var tazeListe = data ? (Array.isArray(data) ? data.filter(Boolean) : Object.values(data)) : [];
        var sonuc = mutateFn(tazeListe);
        var yazilacak = (sonuc !== undefined) ? sonuc : tazeListe;
        return db.ref("musteriler").set(yazilacak).then(function(){ return sonuc; });
      }).then(function(sonuc){
        geriBildir(true, sonuc);
      }).catch(function(err){
        console.error("Müşteri yazma hatası:", err);
        geriBildir(false, err);
      });
    }catch(e){ geriBildir(false, e); }
  }

  function musteriIndexBul(tazeListe, musteriAd){
    return tazeListe.findIndex(function(m){ return (m.ad||"").toLocaleLowerCase("tr-TR")===(musteriAd||"").toLocaleLowerCase("tr-TR"); });
  }

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
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      if(!tazeListe[idx].ziyaretGecmisi) tazeListe[idx].ziyaretGecmisi = [];
      var kayit = {ts:Date.now(), not: not || "Ziyaret edildi, not girilmedi.", tur:"ziyaret"};
      tazeListe[idx].ziyaretGecmisi.push(kayit);
      tazeListe[idx].ziyaretGecmisi.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
      tazeListe[idx].sonZiyaret = tazeListe[idx].ziyaretGecmisi[0].ts;
      tazeListe[idx].sonZiyaretNot = tazeListe[idx].ziyaretGecmisi[0].not;
    }, geriBildir);
  }

  function musteriIdUret(tazeListe){
    var maxNo = 0;
    tazeListe.forEach(function(m){
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
    if(!bilgi.ad || !bilgi.ad.trim()){ geriBildir(false, "Müşteri adı girin."); return; }
    var yeniKayit = null;
    guvenliYaz(function(tazeListe){
      yeniKayit = {
        id: musteriIdUret(tazeListe),
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
      tazeListe.unshift(yeniKayit);
    }, function(basarili, err){
      geriBildir(basarili, basarili ? yeniKayit : err);
    });
  }

  function musteriGuncelle(musteriAd, guncelBilgi, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      tazeListe[idx].vade = guncelBilgi.vade;
      tazeListe[idx].fatura = guncelBilgi.fatura;
      tazeListe[idx].kargo = guncelBilgi.kargo;
    }, geriBildir);
  }

  function musteriAdresEkle(musteriAd, tip, etiket, adres, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      var alan = tip==="fatura" ? "faturaAdresleri" : "teslimatAdresleri";
      if(!tazeListe[idx][alan]) tazeListe[idx][alan] = [];
      tazeListe[idx][alan].push({etiket: etiket || (tip==="fatura"?"Fatura Adresi":"Teslimat Adresi"), adres: adres});
    }, geriBildir);
  }

  function musteriAdresSil(musteriAd, tip, adresIdx, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      var alan = tip==="fatura" ? "faturaAdresleri" : "teslimatAdresleri";
      if(!tazeListe[idx][alan]) tazeListe[idx][alan] = [];
      tazeListe[idx][alan].splice(adresIdx, 1);
    }, geriBildir);
  }

  function musteriAdresGuncelle(musteriAd, tip, adresIdx, etiket, adres, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      var alan = tip==="fatura" ? "faturaAdresleri" : "teslimatAdresleri";
      if(!tazeListe[idx][alan] || !tazeListe[idx][alan][adresIdx]) throw new Error("Adres bulunamadı");
      tazeListe[idx][alan][adresIdx] = {etiket: etiket, adres: adres};
    }, geriBildir);
  }

  function yetkiliEkle(musteriAd, kisi, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      if(!tazeListe[idx].iletisimler) tazeListe[idx].iletisimler = [];
      tazeListe[idx].iletisimler.push(kisi);
    }, geriBildir);
  }

  function yetkiliSil(musteriAd, kisiIdx, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      if(!tazeListe[idx].iletisimler) tazeListe[idx].iletisimler = [];
      tazeListe[idx].iletisimler.splice(kisiIdx, 1);
    }, geriBildir);
  }

  function yetkiliGuncelle(musteriAd, kisiIdx, kisi, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      if(!tazeListe[idx].iletisimler || !tazeListe[idx].iletisimler[kisiIdx]) throw new Error("Kişi bulunamadı");
      tazeListe[idx].iletisimler[kisiIdx] = kisi;
    }, geriBildir);
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
    musteriAdresGuncelle: musteriAdresGuncelle,
    yetkiliEkle: yetkiliEkle,
    yetkiliSil: yetkiliSil,
    yetkiliGuncelle: yetkiliGuncelle
  };

})();

CustomerData.baslat();
