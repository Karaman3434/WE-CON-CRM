/*
  km-data.js
  ==========
  Eski uygulamanın GERÇEK mantığı: her gün TEK bir kilometre okuması girilir
  ("fotoğraflanan KM"). Bu değer aynı anda hem O GÜNÜN başlangıcı, hem de
  BİR ÖNCEKİ GÜNÜN bitişidir. Yani iki ayrı "başlangıç/bitiş" alanı YOKTUR —
  art arda gelen günlerin tek okumaları arasındaki fark, önceki günün kat
  ettiği mesafedir.

  gununKmGir() çağrıldığında:
    1) Bugünün kaydına bu KM değeri + saat/güzergah/kategori yazılır.
    2) DÜNÜN kaydı varsa, dünün "bitisKm"si bu değere eşitlenir ve dünün
       mesafesi (bitisKm - km) hesaplanıp dünün kategorisine yazılır.
  Ziyaret Edilen Yerler, gün içinde ayrıca (KM girmeden) eklenip güncellenebilir.
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
        bozukIsOzelDegerleriniOnar();
      }, function(err){
        console.error("KM okuma hatası:", err);
      });
    }catch(e){
      console.error("Firebase başlatma hatası:", e);
    }
  }

  // Kendi kendini onarma: Başlangıç/Bitiş KM'si dolu olduğu halde İş/Özel
  // KM'si (kategoriye göre) yanlış/eksik kalmış kayıtları (ör. hücreler
  // eski bir sürümde doğrudan düzenlenmiş de yeniden hesaplanmamışsa)
  // sessizce düzeltir. Sayfa her açıldığında ve veri her değiştiğinde
  // çalışır, sadece gerçekten YANLIŞ olan kayıtları yazar (gereksiz
  // Firebase trafiği olmasın diye).
  var onarimCalisiyorMu = false;
  function bozukIsOzelDegerleriniOnar(){
    if(onarimCalisiyorMu) return;
    var guncellemeler = {};
    Object.keys(kayitlar).forEach(function(anahtar){
      var k = kayitlar[anahtar];
      if(!k || k.km==null || k.km==="" || k.bitisKm==null || k.bitisKm==="") return;
      var fark = farkHesapla(k.bitisKm, k.km);
      var kategori = k.kmKategori || "is";
      var beklenenIs = kategori==="is" ? fark : null;
      var beklenenOzel = kategori==="ozel" ? fark : null;
      var mevcutIs = (k.isKm===undefined) ? null : k.isKm;
      var mevcutOzel = (k.ozelKm===undefined) ? null : k.ozelKm;
      if(mevcutIs !== beklenenIs) guncellemeler["kmTakip/"+anahtar+"/isKm"] = beklenenIs;
      if(mevcutOzel !== beklenenOzel) guncellemeler["kmTakip/"+anahtar+"/ozelKm"] = beklenenOzel;
    });
    if(Object.keys(guncellemeler).length === 0) return;
    onarimCalisiyorMu = true;
    firebase.database().ref().update(guncellemeler).catch(function(err){
      console.error("KM onarım hatası:", err);
    }).then(function(){ onarimCalisiyorMu = false; });
  }

  function degistiginde(fn){ dinleyiciler.push(fn); }

  function tarihAnahtari(d){
    return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
  }

  function bugunAnahtari(){ return tarihAnahtari(new Date()); }

  function dunAnahtari(){
    var d = new Date();
    d.setDate(d.getDate()-1);
    return tarihAnahtari(d);
  }

  function kaydiOku(anahtar){ return kayitlar[anahtar] || null; }

  function farkHesapla(bitis, baslangic){
    if(bitis===undefined||bitis===null||bitis===""||baslangic===undefined||baslangic===null||baslangic==="") return null;
    var b = parseFloat(bitis), a = parseFloat(baslangic);
    if(isNaN(b)||isNaN(a)) return null;
    var f = b-a;
    return f<0 ? 0 : f;
  }

  // Dünün özet bilgisi: [önceki günün KM'si] → [dünün KM'si] = mesafe.
  // Sadece görüntüleme/referans amaçlı, bugünün girişine bağımlı DEĞİL.
  function dunOzeti(){
    var dun = dunAnahtari();
    var dunKaydi = kayitlar[dun];
    if(!dunKaydi || dunKaydi.km===undefined || dunKaydi.km===null || dunKaydi.km===""){
      return null;
    }
    var oncekiAnahtar = null;
    Object.keys(kayitlar).forEach(function(k){
      if(k >= dun) return;
      if(kayitlar[k] && kayitlar[k].km!==undefined && kayitlar[k].km!==null && kayitlar[k].km!==""){
        if(!oncekiAnahtar || k > oncekiAnahtar) oncekiAnahtar = k;
      }
    });
    var baslangic = oncekiAnahtar ? kayitlar[oncekiAnahtar].km : null;
    var bitis = dunKaydi.km;
    var mesafe = farkHesapla(bitis, baslangic);
    return {baslangic:baslangic, bitis:bitis, mesafe:mesafe};
  }

  function gununKmGir(bugunkuKm, kategori, saat, guzergah, geriBildir){
    try{
      var db = firebase.database();
      var bugun = bugunAnahtari();
      var dun = dunAnahtari();

      var bugunKaydi = Object.assign({}, kayitlar[bugun]||{}, {
        km: bugunkuKm,
        kmKategori: kategori,
        saat: saat || "",
        guzergah: guzergah || ""
      });

      var guncellemeler = {};
      guncellemeler["kmTakip/" + bugun] = bugunKaydi;

      var dunKaydi = kayitlar[dun];
      if(dunKaydi && dunKaydi.km!==undefined && dunKaydi.km!==null && dunKaydi.km!==""){
        var fark = farkHesapla(bugunkuKm, dunKaydi.km);
        var dunKategori = dunKaydi.kmKategori || "is";
        var yeniDunKaydi = Object.assign({}, dunKaydi, {
          bitisKm: bugunkuKm,
          isKm: dunKategori==="is" ? fark : null,
          ozelKm: dunKategori==="ozel" ? fark : null
        });
        guncellemeler["kmTakip/" + dun] = yeniDunKaydi;
      }

      db.ref().update(guncellemeler).then(function(){
        geriBildir(true);
      }).catch(function(err){
        console.error("KM kaydetme hatası:", err);
        geriBildir(false, err);
      });
    }catch(e){ geriBildir(false, e); }
  }

  function ziyaretYerleriniKaydet(anahtar, ziyaretYerleri, geriBildir){
    try{
      var mevcut = kayitlar[anahtar];
      if(!mevcut){ geriBildir(false, "Önce günün kilometresini girin."); return; }
      var db = firebase.database();
      db.ref("kmTakip/" + anahtar + "/ziyaretYerleri").set(ziyaretYerleri || "").then(function(){
        geriBildir(true);
      }).catch(function(err){ geriBildir(false, err); });
    }catch(e){ geriBildir(false, e); }
  }

  // Tablodaki bir hücreye dokunup manuel düzeltme yapmak için genel alan
  // güncelleyici (Tarih, Saat, Başl., Bitiş, Güzergah, Ziyaret, İş, Özel).
  // Başlangıç veya Bitiş KM elle değiştirilince İş/Özel KM o günün kendi
  // kategorisine göre YENİDEN hesaplanır — aksi halde tabloda eski/yanlış
  // İş-Özel değeri kalır. Başlangıç KM değişikliği ayrıca BİR ÖNCEKİ günün
  // Bitiş KM'sine otomatik yansır (iş kuralı: bugünün başlangıcı = dünün
  // bitişi) ve dünün İş/Özel'i de buna göre yeniden hesaplanır.
  var ALAN_HARITA = {
    saat: "saat", baslangic: "km", bitis: "bitisKm",
    guzergah: "guzergah", ziyaret: "ziyaretYerleri", isKm: "isKm", ozelKm: "ozelKm"
  };

  function oncekiGunAnahtari(anahtar){
    var parca = anahtar.split("-").map(Number);
    var d = new Date(parca[0], parca[1]-1, parca[2]);
    d.setDate(d.getDate()-1);
    return tarihAnahtari(d);
  }

  function gununIsOzelYenidenHesapla(anahtar, guncelleyecekObje){
    var kayit = Object.assign({}, kayitlar[anahtar]||{}, guncelleyecekObje);
    if(kayit.km!=null && kayit.km!=="" && kayit.bitisKm!=null && kayit.bitisKm!==""){
      var fark = farkHesapla(kayit.bitisKm, kayit.km);
      var kategori = kayit.kmKategori || "is";
      guncelleyecekObje.isKm = kategori==="is" ? fark : null;
      guncelleyecekObje.ozelKm = kategori==="ozel" ? fark : null;
    }
    return guncelleyecekObje;
  }

  function hucreGuncelle(anahtar, alanAdi, deger, geriBildir){
    try{
      var firebaseAlan = ALAN_HARITA[alanAdi];
      if(!firebaseAlan){ geriBildir(false, "Bilinmeyen alan"); return; }
      var sayisalMi = (firebaseAlan==="km" || firebaseAlan==="bitisKm" || firebaseAlan==="isKm" || firebaseAlan==="ozelKm");
      var yaziliDeger = sayisalMi ? (parseFloat(deger)||0) : (deger||"");
      var db = firebase.database();
      var guncellemeler = {};

      if(alanAdi === "baslangic" || alanAdi === "bitis"){
        var buGuncelleme = {};
        buGuncelleme[firebaseAlan] = yaziliDeger;
        buGuncelleme = gununIsOzelYenidenHesapla(anahtar, buGuncelleme);
        Object.keys(buGuncelleme).forEach(function(k){
          guncellemeler["kmTakip/" + anahtar + "/" + k] = buGuncelleme[k];
        });

        if(alanAdi === "baslangic"){
          var oncekiAnahtar = oncekiGunAnahtari(anahtar);
          if(kayitlar[oncekiAnahtar]){
            var oncekiGuncelleme = {bitisKm: yaziliDeger};
            oncekiGuncelleme = gununIsOzelYenidenHesapla(oncekiAnahtar, oncekiGuncelleme);
            Object.keys(oncekiGuncelleme).forEach(function(k){
              guncellemeler["kmTakip/" + oncekiAnahtar + "/" + k] = oncekiGuncelleme[k];
            });
          }
        }
      } else {
        guncellemeler["kmTakip/" + anahtar + "/" + firebaseAlan] = yaziliDeger;
      }

      db.ref().update(guncellemeler).then(function(){
        geriBildir(true);
      }).catch(function(err){ geriBildir(false, err); });
    }catch(e){ geriBildir(false, e); }
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

  // Eski uygulamanın kmAyBasiKontrolEt() ile AYNI mantık: sistemde HİÇ KM
  // kaydı yoksa (ilk kullanım), günlük hesaplamanın çalışabilmesi için bir
  // başlangıç değeri gerekir — sessizce atlamak yerine kullanıcıdan iste.
  function baslangicGerekliMi(){
    var herhangiKayitVarMi = Object.keys(kayitlar).some(function(k){
      return kayitlar[k] && kayitlar[k].km!==undefined && kayitlar[k].km!==null && kayitlar[k].km!=="";
    });
    return !herhangiKayitVarMi;
  }

  function baslangicKaydet(deger, geriBildir){
    try{
      var dun = dunAnahtari();
      var yeniKayit = Object.assign({}, kayitlar[dun]||{}, {km: deger, saat: (kayitlar[dun]&&kayitlar[dun].saat)||"23:59", sentetikBaslangic: true});
      firebase.database().ref("kmTakip/" + dun).set(yeniKayit).then(function(){
        geriBildir(true);
      }).catch(function(err){ geriBildir(false, err); });
    }catch(e){ geriBildir(false, e); }
  }

  return {
    baslat: baslat,
    degistiginde: degistiginde,
    tarihAnahtari: tarihAnahtari,
    bugunAnahtari: bugunAnahtari,
    dunAnahtari: dunAnahtari,
    kaydiOku: kaydiOku,
    farkHesapla: farkHesapla,
    dunOzeti: dunOzeti,
    gununKmGir: gununKmGir,
    ziyaretYerleriniKaydet: ziyaretYerleriniKaydet,
    hucreGuncelle: hucreGuncelle,
    buAyinKayitlari: buAyinKayitlari,
    ayarlarOku: ayarlarOku,
    ayarlarKaydet: ayarlarKaydet,
    baslangicGerekliMi: baslangicGerekliMi,
    baslangicKaydet: baslangicKaydet
  };

})();

KmData.baslat();
