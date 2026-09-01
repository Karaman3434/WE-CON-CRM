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

  function dunAnahtari(){
    var d = new Date();
    d.setDate(d.getDate()-1);
    return tarihAnahtari(d);
  }

  function kaydiOku(anahtar){ return kayitlar[anahtar] || null; }

  // Bugünden ÖNCEKİ en son GERÇEK kilometre kaydını bulur — tam olarak
  // "dün" (1 gün önce) değil, aradaki boş günler (araç hiç çıkmamış hafta
  // sonu/tatil/izin günleri) kaç tane olursa olsun, kronolojik olarak en
  // son girilmiş kaydı esas alır. `haricAnahtar` verilirse o gün hariç
  // tutulur (bugünün kendisini "önceki kayıt" saymamak için).
  function sonKayitliGunAnahtari(haricAnahtar){
    var enSon = null;
    Object.keys(kayitlar).forEach(function(k){
      if(k === haricAnahtar) return;
      if(!kayitlar[k] || kayitlar[k].km===undefined || kayitlar[k].km===null || kayitlar[k].km==="") return;
      if(!enSon || k > enSon) enSon = k;
    });
    return enSon;
  }

  function farkHesapla(bitis, baslangic){
    if(bitis===undefined||bitis===null||bitis===""||baslangic===undefined||baslangic===null||baslangic==="") return null;
    var b = parseFloat(bitis), a = parseFloat(baslangic);
    if(isNaN(b)||isNaN(a)) return null;
    var f = b-a;
    return f<0 ? 0 : f;
  }

  // Bir önceki tarihte yapılan kilometre: [en son kayıtlı günün KM'si] →
  // [BUGÜN GİRİLEN — henüz kaydedilmemiş olsa bile] KM'si = mesafe.
  // "Bugünün başlangıç KM'si = önceki tarihin bitiş KM'si" mantığıyla,
  // bugün yazdığın değerden en son kayıtlı tarihin KM'sini çıkararak, O
  // ÖNCEKİ TARİHTE yapılan mesafeyi CANLI (kaydetmeden önce) gösterir.
  function oncekiTarihinMesafesi(bugunkuGirilenDeger){
    var bugun = bugunAnahtari();
    var oncekiKayitliGun = sonKayitliGunAnahtari(bugun);
    if(!oncekiKayitliGun) return null;
    var oncekiKayit = kayitlar[oncekiKayitliGun];
    var oncekiKm = oncekiKayit.km;
    var mesafe = farkHesapla(bugunkuGirilenDeger, oncekiKm);
    return {tarihAnahtari: oncekiKayitliGun, oncekiKm: oncekiKm, bugunkuDeger: bugunkuGirilenDeger, mesafe: mesafe};
  }

  function gununKmGir(bugunkuKm, kategori, saat, guzergah, geriBildir){
    try{
      var db = firebase.database();
      var bugun = bugunAnahtari();

      var bugunKaydi = Object.assign({}, kayitlar[bugun]||{}, {
        km: bugunkuKm,
        kmKategori: kategori,
        saat: saat || "",
        guzergah: guzergah || ""
      });

      var guncellemeler = {};
      guncellemeler["kmTakip/" + bugun] = bugunKaydi;

      // "Dün" (tam 1 gün önce) yerine, kronolojik olarak en son kilometre
      // girilmiş günü buluyoruz — araç günlerdir çıkmamış olsa bile
      // (hafta sonu, tatil, izin) doğru önceki kayda bağlanır.
      var oncekiKayitliGun = sonKayitliGunAnahtari(bugun);
      var oncekiKayit = oncekiKayitliGun ? kayitlar[oncekiKayitliGun] : null;
      if(oncekiKayit && oncekiKayit.km!==undefined && oncekiKayit.km!==null && oncekiKayit.km!==""){
        var fark = farkHesapla(bugunkuKm, oncekiKayit.km);
        var oncekiKategori = oncekiKayit.kmKategori || "is";
        var yeniOncekiKayit = Object.assign({}, oncekiKayit, {
          bitisKm: bugunkuKm,
          isKm: oncekiKategori==="is" ? fark : null,
          ozelKm: oncekiKategori==="ozel" ? fark : null
        });
        guncellemeler["kmTakip/" + oncekiKayitliGun] = yeniOncekiKayit;
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
  // BİLİNÇLİ OLARAK hiçbir otomatik yeniden hesaplama YAPMAZ — kullanıcı
  // hangi hücreyi ne yazarsa o kalır, başka hiçbir hücreyi tetiklemez.
  // (Otomatik İş/Özel hesaplaması SADECE "Günü Kaydet" ile günlük giriş
  // yapılırken olur — bkz. gununKmGir.)
  var ALAN_HARITA = {
    saat: "saat", baslangic: "km", bitis: "bitisKm",
    guzergah: "guzergah", ziyaret: "ziyaretYerleri", isKm: "isKm", ozelKm: "ozelKm"
  };
  function hucreGuncelle(anahtar, alanAdi, deger, geriBildir){
    try{
      var firebaseAlan = ALAN_HARITA[alanAdi];
      if(!firebaseAlan){ geriBildir(false, "Bilinmeyen alan"); return; }
      var sayisalMi = (firebaseAlan==="km" || firebaseAlan==="bitisKm" || firebaseAlan==="isKm" || firebaseAlan==="ozelKm");
      var yaziliDeger = sayisalMi ? (parseFloat(deger)||0) : (deger||"");
      firebase.database().ref("kmTakip/" + anahtar + "/" + firebaseAlan).set(yaziliDeger).then(function(){
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

  // Belirli bir "YYYY-MM" ayının kayıtlarını döndürür — Ağustos ayının
  // takvim değişse bile ARŞİVDEN kaybolmaması, istendiğinde geriye dönüp
  // görüntülenebilmesi/Excel'e aktarılabilmesi için.
  function ayinKayitlari(yilAy){
    return Object.keys(kayitlar)
      .filter(function(k){ return k.indexOf(yilAy)===0; })
      .sort()
      .reverse()
      .map(function(k){ return Object.assign({anahtar:k}, kayitlar[k]); });
  }

  // Kayıt bulunan TÜM ayları ("YYYY-MM") en yeniden en eskiye sıralı
  // döndürür — ay seçici menüsünü doldurmak için. Bu ayda hiç kayıt
  // olmasa bile mevcut ay listeye eklenir (seçenek olarak görünsün diye).
  function kayitliAylar(){
    var aySeti = {};
    Object.keys(kayitlar).forEach(function(k){ aySeti[k.slice(0,7)] = true; });
    var simdi = new Date();
    aySeti[simdi.getFullYear()+"-"+("0"+(simdi.getMonth()+1)).slice(-2)] = true;
    return Object.keys(aySeti).sort().reverse();
  }

  function ayAdiUret(yilAy){
    var AYLAR2 = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
    var parca = yilAy.split("-");
    return AYLAR2[parseInt(parca[1],10)-1] + " " + parca[0];
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
    sonKayitliGunAnahtari: sonKayitliGunAnahtari,
    kaydiOku: kaydiOku,
    farkHesapla: farkHesapla,
    oncekiTarihinMesafesi: oncekiTarihinMesafesi,
    gununKmGir: gununKmGir,
    ziyaretYerleriniKaydet: ziyaretYerleriniKaydet,
    hucreGuncelle: hucreGuncelle,
    buAyinKayitlari: buAyinKayitlari,
    ayinKayitlari: ayinKayitlari,
    kayitliAylar: kayitliAylar,
    ayAdiUret: ayAdiUret,
    ayarlarOku: ayarlarOku,
    ayarlarKaydet: ayarlarKaydet,
    baslangicGerekliMi: baslangicGerekliMi,
    baslangicKaydet: baslangicKaydet
  };

})();

KmData.baslat();
