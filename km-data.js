/*
  km-data.js
  ==========
  TEK görevi: Firebase "kmTakip" yolundan günlük kayıtları okumak/yazmak.
  Formüller (fark hesaplama, önceki günün bitişinin bu günün başlangıcı
  olması) eski app-part4.js'ten birebir taşındı.
*/

var KmData = (function(){

  var firebaseConfig = {
    apiKey: "AIzaSyC08Oe1LE7TdQl8gG2H9raZQek211Dxd60",
    authDomain: "weicon-asist.firebaseapp.com",
    databaseURL: "https://weicon-asist-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "weicon-asist",
    storageBucket: "weicon-asist.firebasestorage.app",
    messagingSenderId: "673730415323",
    appId: "1:673730415323:web:29c817e05a281261a61afe"
  };

  var kayitlar = {};
  var dinleyiciler = [];

  function baslat(){
    try{
      if(!firebase.apps.length){ firebase.initializeApp(firebaseConfig); }
      var db = firebase.database();
      db.ref("kmTakip").on("value", function(snap){
        kayitlar = snap.val() || {};
        dinleyiciler.forEach(function(fn){ fn(); });
      }, function(err){
        console.error("KM okuma hatası:", err);
      });
    }catch(e){
      console.error("Firebase başlatma hatası:", e);
    }
  }

  function degistiginde(fn){ dinleyiciler.push(fn); }

  function tarihAnahtari(d){
    return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
  }

  function bugunAnahtari(){ return tarihAnahtari(new Date()); }

  function kaydiOku(anahtar){ return kayitlar[anahtar] || null; }

  // Önceki günün bitiş KM'sini bul (bugünün başlangıcı için otomatik öneri)
  function oncekiBitisKmBul(anahtarHaric){
    var enYakinAnahtar = null;
    Object.keys(kayitlar).forEach(function(k){
      if(k >= anahtarHaric) return;
      var kayit = kayitlar[k];
      if(kayit && kayit.bitisKm!==undefined && kayit.bitisKm!==null && kayit.bitisKm!==""){
        if(!enYakinAnahtar || k > enYakinAnahtar) enYakinAnahtar = k;
      }
    });
    return enYakinAnahtar ? kayitlar[enYakinAnahtar].bitisKm : null;
  }

  function farkHesapla(bitis, baslangic){
    if(bitis===undefined||bitis===null||bitis===""||baslangic===undefined||baslangic===null||baslangic==="") return null;
    var b = parseFloat(bitis), a = parseFloat(baslangic);
    if(isNaN(b)||isNaN(a)) return null;
    var f = b-a;
    return f<0 ? 0 : f;
  }

  function kaydet(anahtar, baslangicKm, bitisKm, kategori, saat, guzergah, ziyaretYerleri, geriBildir){
    try{
      var fark = farkHesapla(bitisKm, baslangicKm);
      var kayit = {
        km: baslangicKm, bitisKm: bitisKm,
        kmKategori: kategori,
        isKm: kategori==="is" ? fark : null,
        ozelKm: kategori==="ozel" ? fark : null,
        saat: saat || "", guzergah: guzergah || "", ziyaretYerleri: ziyaretYerleri || ""
      };
      var db = firebase.database();
      db.ref("kmTakip/" + anahtar).set(kayit).then(function(){
        geriBildir(true);
      }).catch(function(err){
        console.error("KM kaydetme hatası:", err);
        geriBildir(false, err);
      });
    }catch(e){
      geriBildir(false, e);
    }
  }

  function buAyinKayitlari(){
    var now = new Date();
    var yilAy = now.getFullYear()+"-"+("0"+(now.getMonth()+1)).slice(-2);
    return Object.keys(kayitlar)
      .filter(function(k){ return k.indexOf(yilAy)===0; })
      .sort()
      .reverse()
      .map(function(k){ return Object.assign({anahtar:k}, kayitlar[k]); });
  }

  function ayarlarOku(geriBildir){
    try{
      var db = firebase.database();
      db.ref("kmTakipAyarlari").once("value").then(function(snap){
        geriBildir(snap.val() || {adSoyad:"", plaka:""});
      }).catch(function(){ geriBildir({adSoyad:"", plaka:""}); });
    }catch(e){ geriBildir({adSoyad:"", plaka:""}); }
  }

  function ayarlarKaydet(adSoyad, plaka){
    try{
      var db = firebase.database();
      db.ref("kmTakipAyarlari").set({adSoyad:adSoyad, plaka:plaka});
    }catch(e){ console.error("KM ayarları kaydedilemedi:", e); }
  }

  return {
    baslat: baslat,
    degistiginde: degistiginde,
    tarihAnahtari: tarihAnahtari,
    bugunAnahtari: bugunAnahtari,
    kaydiOku: kaydiOku,
    oncekiBitisKmBul: oncekiBitisKmBul,
    farkHesapla: farkHesapla,
    kaydet: kaydet,
    buAyinKayitlari: buAyinKayitlari,
    ayarlarOku: ayarlarOku,
    ayarlarKaydet: ayarlarKaydet
  };

})();

KmData.baslat();
