/*
  reports-data.js
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
    projectId: "weicon-asist"
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
    gorevler.push(yeni);
    kaydet();
  }

  function gorevTamamlandiToggle(id){
    var g = gorevler.find(function(x){ return x.id===id; });
    if(!g) return;
    g.tamamlandi = !g.tamamlandi;
    g.tamamlanmaZamani = g.tamamlandi ? Date.now() : null;
    kaydet();
  }

  function kaydet(){
    try{ firebase.database().ref("gorevler").set(gorevler); }catch(e){ console.error("Görev kaydetme hatası:", e); }
  }

  function tumSiparisler(){
    return arsiv.siparis || [];
  }

  function ayToplami(ayOfset){
    var now = new Date();
    var hedefAy = new Date(now.getFullYear(), now.getMonth()-ayOfset, 1);
    var aylar = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
    var ayAd = aylar[hedefAy.getMonth()];
    var yil = hedefAy.getFullYear().toString();
    var toplam = 0, sayi = 0;
    tumSiparisler().forEach(function(k){
      if(!k.tarih) return;
      var parca = k.tarih.split(" ");
      if((parca[1]||"")!==ayAd || (parca[2]||"")!==yil) return;
      sayi++;
      (k.urunler||[]).forEach(function(u){ toplam += u.toplamEuro||0; });
    });
    return {ayAd:ayAd, yil:yil, toplam:toplam, sayi:sayi};
  }

  function son6Ay(){
    var sonuc = [];
    for(var i=0;i<6;i++){ sonuc.push(ayToplami(i)); }
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
    enCokSatisYapilanMusteriler: enCokSatisYapilanMusteriler
  };

})();

ReportsData.baslat();
