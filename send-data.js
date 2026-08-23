/*
  send-data.js
  ============
  TEK görevi: sepeti + seçili müşteriyi + belge türünü alıp Firebase
  arşivine ESKİ UYGULAMAYLA UYUMLU bir kayıt yazmak. Uyumluluk önemli:
  Ana Sayfa'daki "Bu Ay Satışım" hesaplaması bu kayıtları okuyor
  (bkz. home-data.js -> buAyinVerisi).

  NOT: Eski uygulamadaki "aynı gün + aynı ürün seti ise revize say" ve
  "revizeGecmisi" mantığı bu ilk sürümde YOK — her kayıt yeni bir satır
  olarak eklenir. Bu basitleştirme bilinçli: önce akışın uçtan uca sağlam
  çalıştığından emin olunuyor, revize birleştirme sonraki pakette eklenir.
*/

var SendData = (function(){

  var firebaseConfig = {
    apiKey: "AIzaSyC08Oe1LE7TdQl8gG2H9raZQek211Dxd60",
    authDomain: "weicon-asist.firebaseapp.com",
    databaseURL: "https://weicon-asist-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "weicon-asist"
  };

  function baslat(){
    try{
      if(!firebase.apps.length){ firebase.initializeApp(firebaseConfig); }
    }catch(e){ console.error("Firebase başlatma hatası:", e); }
  }

  function tarihStr(){
    var aylar = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
    var d = new Date();
    return d.getDate() + " " + aylar[d.getMonth()] + " " + d.getFullYear() + " " + 
      String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
  }

  function kodUret(tip){
    var onEk = {numune:"NUM", teklif:"TEK", proforma:"PRO", siparis:"SIP"}[tip] || "KYT";
    var d = new Date();
    return onEk + "-" + d.getFullYear() + String(d.getMonth()+1).padStart(2,"0") + String(d.getDate()).padStart(2,"0") + "-" + Math.floor(Math.random()*9000+1000);
  }

  function kaydet(tip, musteri, sepetUrunleri, kur, kdv, geriBildir){
    try{
      var urunlerKaydi = sepetUrunleri.map(function(u){
        var h = CartData.hesapla(u, kur, kdv);
        return {
          ad: u.ad, berta: u.berta, abas: u.abas,
          listeFiyat: u.listeFiyat, dipFiyat: u.dipFiyat, iskonto: u.iskonto, adet: u.adet,
          iskBirim: h.iskontoluFiyat, // eski uygulamayla aynı alan adı — prim hesabı bunu okuyor
          toplamEuro: h.toplamEuro
        };
      });

      var kayit = {
        tarih: tarihStr(),
        ts: Date.now(),
        kod: kodUret(tip),
        musteri: musteri.ad,
        musteriId: musteri.id || null,
        sehir: musteri.sehir || "",
        mod: tip,
        urunler: urunlerKaydi
      };

      var db = firebase.database();
      db.ref("arsiv/" + tip).once("value").then(function(snap){
        var mevcut = snap.val();
        var liste = mevcut ? (Array.isArray(mevcut) ? mevcut.filter(Boolean) : Object.values(mevcut)) : [];
        liste.unshift(kayit);
        return db.ref("arsiv/" + tip).set(liste);
      }).then(function(){
        geriBildir(true, kayit);
      }).catch(function(err){
        console.error("Arşive kaydetme hatası:", err);
        geriBildir(false, err);
      });
    }catch(e){
      console.error("Kaydet hatası:", e);
      geriBildir(false, e);
    }
  }

  return { baslat: baslat, kaydet: kaydet };

})();

SendData.baslat();
