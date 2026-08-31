/*
  reports-data.js — WG250826.02
  ===============
  TEK görevi: arşiv kayıtlarını ("arsiv/numune|teklif|proforma|siparis") ve
  görevleri ("gorevler") Firebase'den okumak/yazmak. Eski uygulamayla AYNI
  yollar — ayrı veri girmeye gerek yok.
*/

var ReportsData = (function(){

  var firebaseConfig = {
    apiKey: "AIzaSyC08Oe1LE7TdQl8gG2H9raZQek211Dxd60",
    authDomain: "weicon-asist.firebaseapp.com",
    databaseURL: "https://weicon-asist-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "weicon-asist",
    storageBucket: "weicon-asist.firebasestorage.app",
    messagingSenderId: "673730415323",
    appId: "1:673730415323:web:29c817e05a281261a61afe"
  };

  var arsiv = {numune:[], teklif:[], proforma:[], siparis:[]};
  var gorevler = [];
  var arsivDinleyicileri = [];
  var gorevDinleyicileri = [];

  function baslat(){
    try{
      if(!firebase.apps.length){ firebase.initializeApp(firebaseConfig); }
      var db = firebase.database();

      db.ref("arsiv").on("value", function(snap){
        var data = snap.val();
        if(data){
          arsiv = data;
          ["numune","teklif","proforma","siparis"].forEach(function(t){
            if(!arsiv[t]) arsiv[t] = [];
            else if(!Array.isArray(arsiv[t])) arsiv[t] = Object.values(arsiv[t]);
          });
        }
        arsivDinleyicileri.forEach(function(fn){ fn(); });
      });

      db.ref("gorevler").on("value", function(snap){
        var data = snap.val();
        gorevler = data ? (Array.isArray(data) ? data.filter(Boolean) : Object.values(data)) : [];
        gorevDinleyicileri.forEach(function(fn){ fn(); });
      });
    }catch(e){
      console.error("Firebase başlatma hatası:", e);
    }
  }

  function arsivDegistiginde(fn){ arsivDinleyicileri.push(fn); }
  function gorevDegistiginde(fn){ gorevDinleyicileri.push(fn); }

  function sonIslemler(limit){
    var hepsi = [];
    ["numune","teklif","proforma","siparis"].forEach(function(tip){
      arsiv[tip].forEach(function(k){
        hepsi.push(Object.assign({tip:tip}, k));
      });
    });
    hepsi.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
    return limit ? hepsi.slice(0, limit) : hepsi;
  }

  function gorevleriGetir(){
    return gorevler.slice().sort(function(a,b){
      if(a.tamamlandi !== b.tamamlandi) return a.tamamlandi ? 1 : -1;
      return (a.olusturmaZamani||0) - (b.olusturmaZamani||0);
    });
  }

  function gorevEkle(musteriAd, aciklama, tarih, saat){
    var yeni = {
      id: "gorev_" + Date.now() + "_" + Math.floor(Math.random()*10000),
      musteriAd: musteriAd, aciklama: aciklama,
      tarih: tarih, saat: saat,
      tamamlandi: false, tamamlanmaZamani: null,
      olusturmaZamani: Date.now()
    };
    guvenliGorevYaz(function(tazeGorevler){ tazeGorevler.push(yeni); });
  }

  function gorevTamamlandiToggle(id){
    guvenliGorevYaz(function(tazeGorevler){
      var g = tazeGorevler.find(function(x){ return x.id===id; });
      if(!g) return;
      g.tamamlandi = !g.tamamlandi;
      g.tamamlanmaZamani = g.tamamlandi ? Date.now() : null;
    });
  }

  // Görevler için de GÜVENLİ YAZMA DESENİ: yazmadan hemen önce sunucudan taze
  // veri okunur, değişiklik sadece o taze veri üzerine uygulanır.
  function guvenliGorevYaz(mutateFn){
    try{
      var db = firebase.database();
      db.ref("gorevler").once("value").then(function(snap){
        var data = snap.val();
        var tazeGorevler = data ? (Array.isArray(data) ? data.filter(Boolean) : Object.values(data)) : [];
        mutateFn(tazeGorevler);
        return db.ref("gorevler").set(tazeGorevler);
      }).catch(function(err){ console.error("Görev kaydetme hatası:", err); });
    }catch(e){ console.error("Görev kaydetme hatası:", e); }
  }

  function tumSiparisler(){
    return arsiv.siparis || [];
  }

  // Bir müşterinin bugüne kadar aldığı (SİPARİŞ olarak kaydedilmiş) tüm
  // ürünleri, ürün adına göre gruplayıp her ürünün tarih tarih fiyat/
  // iskonto geçmişini döndürür. Müşteri Kartı'ndaki "📦 Ürün Geçmişi"
  // ekranı bunu kullanır.
  function musteriUrunGecmisi(musteriAd, musteriId){
    var gruplar = {}; // ürün adı -> [{tarih, listeFiyat, iskonto, netFiyat, adet, ts}]
    tumSiparisler().forEach(function(k){
      var ayniMusteriMi = musteriId && k.musteriId ? (k.musteriId===musteriId) : (k.musteri===musteriAd);
      if(!ayniMusteriMi) return;
      (k.urunler||[]).forEach(function(u){
        var ad = u.ad || "İsimsiz Ürün";
        if(!gruplar[ad]) gruplar[ad] = [];
        gruplar[ad].push({
          tarih: k.tarih, ts: k.ts,
          listeFiyat: u.listeFiyat||0, iskonto: u.iskonto||0,
          netFiyat: u.iskBirim!=null?u.iskBirim:(u.listeFiyat||0),
          adet: u.adet||0
        });
      });
    });
    var sonuc = Object.keys(gruplar).map(function(ad){
      var kayitlar = gruplar[ad].sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
      return {ad: ad, kayitlar: kayitlar, sonAlisTs: kayitlar[0].ts};
    });
    sonuc.sort(function(a,b){ return (b.sonAlisTs||0)-(a.sonAlisTs||0); });
    return sonuc;
  }

  function kaydiKacanIsaretle(tip, ts, sebep, rakip, geriBildir){
    try{
      var db = firebase.database();
      db.ref("arsiv/" + tip).once("value").then(function(snap){
        var mevcut = snap.val();
        var liste = mevcut ? (Array.isArray(mevcut) ? mevcut.filter(Boolean) : Object.values(mevcut)) : [];
        var idx = liste.findIndex(function(k){ return k.ts === ts; });
        if(idx === -1){ geriBildir(false, "Kayıt bulunamadı"); return; }
        liste[idx].durum = "kacan";
        liste[idx].kacanSebep = sebep || "";
        liste[idx].kacanRakip = rakip || "";
        return db.ref("arsiv/" + tip).set(liste).then(function(){ geriBildir(true); });
      }).catch(function(err){ geriBildir(false, err); });
    }catch(e){ geriBildir(false, e); }
  }

  function kacanOzetBuAy(){
    var aylar = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
    var now = new Date();
    var buAyAd = aylar[now.getMonth()];
    var buYil = now.getFullYear().toString();
    var kacanlar = [];
    var teklifSayisi = 0;
    ["siparis","teklif","proforma","numune"].forEach(function(tip){
      (arsiv[tip]||[]).forEach(function(k){
        if(!k.tarih) return;
        var parca = k.tarih.split(" ");
        if((parca[1]||"")!==buAyAd || (parca[2]||"")!==buYil) return;
        if(tip==="teklif") teklifSayisi++;
        if(k.durum==="kacan"){
          var tutar = (k.urunler||[]).reduce(function(s,u){ return s+(u.toplamEuro||0); }, 0);
          kacanlar.push({tip:tip, kayit:k, tutar:tutar});
        }
      });
    });
    var toplamTutar = kacanlar.reduce(function(s,k){ return s+k.tutar; }, 0);
    return {kacanlar:kacanlar, toplamTutar:toplamTutar, teklifSayisi:teklifSayisi, ayAd:buAyAd, yil:buYil};
  }

  function ayToplami(ayOfset){
    var now = new Date();
    var hedefAy = new Date(now.getFullYear(), now.getMonth()-ayOfset, 1);
    var aylar = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
    var ayAd = aylar[hedefAy.getMonth()];
    var yil = hedefAy.getFullYear().toString();
    var toplam = 0, toplamTl = 0, prim = 0, primTl = 0, sayi = 0;
    tumSiparisler().forEach(function(k){
      if(!k.tarih) return;
      var parca = k.tarih.split(" ");
      if((parca[1]||"")!==ayAd || (parca[2]||"")!==yil) return;
      sayi++;
      var kKuru = k.kur || guncelKurYedek();
      (k.urunler||[]).forEach(function(u){
        toplam += u.toplamEuro||0;
        toplamTl += (u.toplamEuro||0) * kKuru; // satış tutarı işlemin YAPILDIĞI günün kuruyla TL'ye çevrilir
        var mk = (u.iskBirim||0)-(u.dipFiyat||0);
        var satirPrimi = ((u.iskonto||0) > 60) ? 0 : mk*(u.adet||1)*0.22;
        if(satirPrimi>0){
          prim += satirPrimi; // eski uygulamayla aynı: negatif primli satırlar toplama katılmaz
          primTl += satirPrimi * kKuru; // müdür primi işlemin YAPILDIĞI günün kuruyla TL'ye çevrilir
        }
      });
    });
    return {ayAd:ayAd, yil:yil, toplam:toplam, toplamTl:toplamTl, prim:prim, primTl:primTl, sayi:sayi};
  }

  function guncelKurYedek(){
    var v = parseFloat(localStorage.getItem("weicon_kur"));
    return isNaN(v) ? 0 : v;
  }

  // Eski uygulamanın "Aylık Sipariş & Prim Özeti" tablosuyla BİREBİR aynı:
  // son 12 ay, AY|SATIŞ|PRİM|TL PRİM sütunları. TL PRİM artık her işlemin
  // KENDİ kaydettiği kurla hesaplanıyor (bkz. ayToplami) — tüm ayı tek bir
  // güncel kurla çarpmak yerine, merkez ofisin o günkü faturasıyla tutarlı.
  function aylikPrimOzeti12(){
    var sonuc = [];
    for(var i=0;i<12;i++){ sonuc.push(ayToplami(i)); }
    return {aylar: sonuc, kur: guncelKurYedek()};
  }

  function son6Ay(){
    var sonuc = [];
    for(var i=0;i<6;i++){ sonuc.push(ayToplami(i)); }
    return sonuc;
  }

  // Eski uygulamanın bildirimleriHesapla() ile AYNI mantık: her müşterinin
  // en son teklif/proforma/numune kaydı, eğer ondan SONRA bir sipariş
  // gelmemişse "açık süreç" sayılır. 15+ gün ⏳, 30+ gün ⚠️, 33+ gün 🔴.
  // YENİ ÖZELLİK (eski uygulamada yoktu, senin isteğinle eklendi): son 3
  // yılın (bu yıl dahil) toplam satış ve prim özeti.
  function yillikOzet(){
    var simdi = new Date();
    var buYil = simdi.getFullYear();
    var sonuc = [];
    for(var y=0; y<3; y++){
      var hedefYil = (buYil - y).toString();
      var toplam = 0, prim = 0, primTl = 0, sayi = 0;
      tumSiparisler().forEach(function(k){
        if(!k.tarih) return;
        var parca = k.tarih.split(" ");
        if((parca[2]||"") !== hedefYil) return;
        sayi++;
        var kKuru = k.kur || guncelKurYedek();
        (k.urunler||[]).forEach(function(u){
          toplam += u.toplamEuro||0;
          var mk = (u.iskBirim||0)-(u.dipFiyat||0);
          var sp = ((u.iskonto||0) > 60) ? 0 : mk*(u.adet||1)*0.22;
          if(sp>0){ prim += sp; primTl += sp*kKuru; }
        });
      });
      sonuc.push({yil:hedefYil, toplam:toplam, prim:prim, primTl:primTl, sayi:sayi});
    }
    return sonuc;
  }

  function acikSurecleriHesapla(){
    var tumu = sonIslemler();
    var siparisler = tumu.filter(function(k){ return k.tip==="siparis"; });
    var bekleyenTipler = ["teklif","proforma","numune"];
    var musteriMap = {};

    tumu.filter(function(k){ return bekleyenTipler.indexOf(k.tip)>=0; }).forEach(function(k){
      var anahtar = (k.musteri||"").toLocaleLowerCase("tr-TR");
      if(!musteriMap[anahtar] || (k.ts||0) > musteriMap[anahtar].ts){
        musteriMap[anahtar] = k;
      }
    });

    var bugun = Date.now();
    var sonuc = [];
    Object.keys(musteriMap).forEach(function(anahtar){
      var k = musteriMap[anahtar];
      var sonrasindaSiparisVar = siparisler.some(function(s){
        return (s.musteri||"").toLocaleLowerCase("tr-TR")===anahtar && (s.ts||0) > (k.ts||0);
      });
      if(sonrasindaSiparisVar) return;
      var gun = Math.floor((bugun-(k.ts||0))/86400000);
      if(gun < 15) return;
      var seviye = gun>=33 ? "kritik" : (gun>=30 ? "ikinci" : "ilk");
      sonuc.push({musteri:k.musteri, sehir:k.sehir||"", tip:k.tip, ts:k.ts, tarih:k.tarih, gun:gun, seviye:seviye, urunSayisi:(k.urunler||[]).length});
    });
    sonuc.sort(function(a,b){ return b.gun-a.gun; });
    return sonuc;
  }

  function enCokSatisYapilanMusteriler(limit){
    var haritalar = {};
    tumSiparisler().forEach(function(k){
      var ad = k.musteri || "Bilinmeyen";
      if(!haritalar[ad]) haritalar[ad] = 0;
      (k.urunler||[]).forEach(function(u){ haritalar[ad] += u.toplamEuro||0; });
    });
    return Object.keys(haritalar)
      .map(function(ad){ return {ad:ad, toplam:haritalar[ad]}; })
      .sort(function(a,b){ return b.toplam-a.toplam; })
      .slice(0, limit||5);
  }

  function kaydiSil(tip, ts, geriBildir){
    try{
      var db = firebase.database();
      db.ref("arsiv/" + tip).once("value").then(function(snap){
        var mevcut = snap.val();
        var liste = mevcut ? (Array.isArray(mevcut) ? mevcut.filter(Boolean) : Object.values(mevcut)) : [];
        var yeniListe = liste.filter(function(k){ return k.ts !== ts; });
        return db.ref("arsiv/" + tip).set(yeniListe);
      }).then(function(){ geriBildir(true); }).catch(function(err){ geriBildir(false, err); });
    }catch(e){ geriBildir(false, e); }
  }

  // Müşteri Birleştirme'nin devamı: CustomerData.musterileriBirlestir()
  // müşteri kaydını taşıdıktan sonra çağrılır — arşivdeki (sipariş/teklif/
  // proforma/numune) kayıtları ve görevleri "diger"den "ana"ya taşır.
  // Her koleksiyon kendi taze-oku-sonra-yaz adımıyla, sırayla işlenir.
  function kayitlariBirlestir(digerAd, digerId, anaAd, anaId, geriBildir){
    var db = firebase.database();
    var tipler = ["siparis","teklif","proforma","numune"];
    var i = 0;

    function sonrakiTipeGec(){
      if(i >= tipler.length){ gorevleriTasi(); return; }
      var tip = tipler[i]; i++;
      db.ref("arsiv/" + tip).once("value").then(function(snap){
        var mevcut = snap.val();
        var liste = mevcut ? (Array.isArray(mevcut) ? mevcut.filter(Boolean) : Object.values(mevcut)) : [];
        var degistiMi = false;
        liste.forEach(function(k){
          var buNaAitMi = (digerId && k.musteriId) ? (k.musteriId===digerId) : (k.musteri===digerAd);
          if(buNaAitMi){ k.musteri = anaAd; k.musteriId = anaId; degistiMi = true; }
        });
        if(!degistiMi) return sonrakiTipeGec();
        return db.ref("arsiv/" + tip).set(liste).then(sonrakiTipeGec);
      }).catch(function(err){ geriBildir(false, err); });
    }

    function gorevleriTasi(){
      db.ref("gorevler").once("value").then(function(snap){
        var mevcut = snap.val();
        var liste = mevcut ? (Array.isArray(mevcut) ? mevcut.filter(Boolean) : Object.values(mevcut)) : [];
        var degistiMi = false;
        liste.forEach(function(g){ if(g.musteriAd===digerAd){ g.musteriAd=anaAd; degistiMi=true; } });
        if(!degistiMi) return geriBildir(true);
        return db.ref("gorevler").set(liste).then(function(){ geriBildir(true); });
      }).catch(function(err){ geriBildir(false, err); });
    }

    sonrakiTipeGec();
  }

  function kaydiGuncelle(tip, ts, yeniUrunler, geriBildir){
    try{
      var db = firebase.database();
      db.ref("arsiv/" + tip).once("value").then(function(snap){
        var mevcut = snap.val();
        var liste = mevcut ? (Array.isArray(mevcut) ? mevcut.filter(Boolean) : Object.values(mevcut)) : [];
        var idx = liste.findIndex(function(k){ return k.ts === ts; });
        if(idx === -1){ throw new Error("Kayıt bulunamadı"); }
        liste[idx].urunler = yeniUrunler;
        liste[idx].revizeZamani = Date.now();
        return db.ref("arsiv/" + tip).set(liste);
      }).then(function(){ geriBildir(true); }).catch(function(err){ geriBildir(false, err); });
    }catch(e){ geriBildir(false, e); }
  }

  // Revize/İlerletme mekanizması: Numune → Proforma veya Teklif;
  // Teklif → Proforma veya Sipariş; Proforma → sadece Sipariş (tek seçenek,
  // soru sorulmadan otomatik ilerler). Sipariş'ten sonrası yok (nihai aşama).
  var SONRAKI_ASAMALAR = {
    numune: ["proforma","teklif"],
    teklif: ["proforma","siparis"],
    proforma: ["siparis"]
  };

  // Bir kaydı (numune/teklif/proforma) düzenlenebilir Sepet'e yükler.
  // secenekler.length===1 ise otomatik o aşamaya, >1 ise send.html'de
  // Gönder anında Proforma/Sipariş (veya Proforma/Teklif) seçim popup'ı
  // çıkar. Kayıt başarıyla kaydedilince eski kayıt otomatik silinir.
  function revizeBaslat(kayit){
    var secenekler = SONRAKI_ASAMALAR[kayit.tip];
    if(!secenekler){ return false; }
    // Eski kayıtta Dip Fiyat 0/boş kalmışsa (geçmiş bir hata nedeniyle),
    // sessizce 0 olarak taşımak yerine — %36,35 kuralıyla öner AMA
    // "hesaplandı" sayma; kullanıcı Sepet'te bu ürüne dokunup Hesapla
    // ekranında gözden geçirip onaylamadan Kaydet/Gönder'e giremesin.
    var DIP_ORANI = 0.3635;
    var sepet = (kayit.urunler||[]).map(function(u, i){
      var dipEksikMi = !u.dipFiyat;
      var dipFiyat = dipEksikMi ? Math.round((u.listeFiyat||0)*DIP_ORANI*100)/100 : u.dipFiyat;
      return {
        idx:i, ad: u.ad || "İsimsiz Ürün", berta: u.berta||"", abas: u.abas||"",
        listeFiyat: u.listeFiyat||0, dipFiyat: dipFiyat, iskonto: u.iskonto||0, adet: u.adet||0,
        hesaplandi: !dipEksikMi
      };
    });
    localStorage.setItem("weiconv2_sepet", JSON.stringify(sepet));
    localStorage.setItem("weicon_secili_musteri", JSON.stringify({ad:kayit.musteri, sehir:kayit.sehir||"", id:kayit.musteriId||null}));
    localStorage.setItem("weiconv2_ilerlet_kaynak", JSON.stringify({tip:kayit.tip, ts:kayit.ts, kod:kayit.kod||null, sonrakiAsamaSecenekleri:secenekler}));
    if(secenekler.length === 1){
      localStorage.setItem("weiconv2_onceden_secilen_tip", secenekler[0]);
    } else {
      localStorage.removeItem("weiconv2_onceden_secilen_tip");
    }
    window.location.href = "cart.html";
    return true;
  }

  return {
    baslat: baslat,
    arsivDegistiginde: arsivDegistiginde,
    gorevDegistiginde: gorevDegistiginde,
    sonIslemler: sonIslemler,
    gorevleriGetir: gorevleriGetir,
    gorevEkle: gorevEkle,
    gorevTamamlandiToggle: gorevTamamlandiToggle,
    ayToplami: ayToplami,
    son6Ay: son6Ay,
    acikSurecleriHesapla: acikSurecleriHesapla,
    yillikOzet: yillikOzet,
    aylikPrimOzeti12: aylikPrimOzeti12,
    enCokSatisYapilanMusteriler: enCokSatisYapilanMusteriler,
    kaydiKacanIsaretle: kaydiKacanIsaretle,
    kacanOzetBuAy: kacanOzetBuAy,
    kaydiSil: kaydiSil,
    kayitlariBirlestir: kayitlariBirlestir,
    musteriUrunGecmisi: musteriUrunGecmisi,
    kaydiGuncelle: kaydiGuncelle,
    SONRAKI_ASAMALAR: SONRAKI_ASAMALAR,
    revizeBaslat: revizeBaslat
  };

})();

ReportsData.baslat();
