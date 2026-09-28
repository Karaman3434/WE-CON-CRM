/*
  mesaj-data.js
  =============
  Mesaj Ayarları — TAMAMEN MANUEL sistem (WG.210926.1603.585).

  Kural: Mesaj Ayarları ekranında yazılan mail ve WhatsApp metinleri,
  otomatik "Merhaba," satırı veya otomatik "NOT:" ekleme OLMADAN, YAZILDIĞI
  GİBİ Gönder ekranında görünür ve gönderilir. Boş bırakmak da serbesttir.
  TEK İSTİSNA (WG.210926.1603.585): metnin içine büyük harfle HAREKET yazılırsa,
  gönderirken işleme göre SİPARİŞ / FİYAT TEKLİFİ / PROFORMA FATURA / NUMUNE
  olarak değişir. Başka hiçbir kelime/işaret değiştirilmez.

  GÜNCELLEME (26.09.2026, Abdullah'ın isteğiyle): HAREKET artık çıplak isim
  değil, "-in" hâli ekiyle (siparişin / fiyat teklifinin / numunenin /
  proforma faturanın) değişiyor — "HAREKET işleme alınmasını rica ederim"
  gibi kalıplarda cümle eksik/anlamsız kalmasın diye.

  Saklama: localStorage + Firebase (mesajSablonlari/metinler — mevcut
  Firebase kuralı zaten bu yolu kapsıyor, kural değişikliği gerekmez).
  Eski sistemin {FIRMA}/{BELGE} yer tutuculu kayıtları KULLANILMAZ (temiz
  başlangıç); yeni kayıt yolu eski kayıtlara dokunmaz.
*/
var MesajData = (function(){

  var ANAHTAR = "weiconv2_mesaj_metinleri";
  var YOL = "mesajSablonlari/metinler";
  // "numune" (28.09.2026, Abdullah'ın isteğiyle eklendi): NUMUNE gönderiminde
  // artık genel mail/WhatsApp şablonu değil, bu AYRI sabit metin kullanılır —
  // kanal fark etmeksizin (bkz. send-render.js mesajMetniOlustur).
  var KANALLAR = ["mail", "whatsapp", "numune"];

  // Hiç kayıt yapılmamışken başlangıç metni — sadece bir başlangıç noktası,
  // Mesaj Ayarları'nda istenildiği gibi değiştirilip kaydedilir.
  var VARSAYILAN = {
    mail: "Merhaba,\nBilgilerini paylaştığım Firma için HAREKET bilgi formu ektedir. BİLGİNİZE.",
    whatsapp: "Merhaba,\nİstediğiniz ürün için fiyat bilgisi ektedir.",
    numune: "Merhaba,\nSöyleyeceğini paylaştım Firma için bilgi formu ektedir.\nFirmaya numune gönderimi yapmanızı rica ederim."
  };

  function yerelOku(){
    try{ var v = JSON.parse(localStorage.getItem(ANAHTAR)||"{}"); return (v && typeof v==="object") ? v : {}; }
    catch(e){ return {}; }
  }
  function yerelYaz(v){
    try{ localStorage.setItem(ANAHTAR, JSON.stringify(v)); }catch(e){}
  }
  function fbHazirla(){
    if(typeof firebase === "undefined") return null;
    if(!firebase.apps.length && typeof WEICON_FIREBASE_CONFIG !== "undefined"){ firebase.initializeApp(WEICON_FIREBASE_CONFIG); }
    return firebase.apps.length ? firebase.database() : null;
  }

  var HAREKET_ADLARI = {siparis:"siparişin", teklif:"fiyat teklifinin", proforma:"proforma faturanın", numune:"numunenin"};

  // Metindeki (büyük harf, birebir) HAREKET kelimesini işlem adıyla değiştirir.
  function uygula(metin, tip){
    var ad = HAREKET_ADLARI[tip];
    if(!ad) return metin;
    return String(metin).split("HAREKET").join(ad);
  }

  // Kaydedilmiş metin varsa (boş bile olsa) onu, hiç kayıt yoksa başlangıç metnini döndürür.
  function oku(kanal){
    var y = yerelOku();
    return Object.prototype.hasOwnProperty.call(y, kanal) ? String(y[kanal]) : VARSAYILAN[kanal];
  }

  // Metni OLDUĞU GİBİ (kırpmadan, değiştirmeden) kaydeder. sonuc(fbBasarili, hata)
  function kaydet(kanal, metin, sonuc){
    var y = yerelOku(); y[kanal] = String(metin); yerelYaz(y);
    try{
      var db = fbHazirla();
      if(!db){ if(sonuc) sonuc(false, new Error("Firebase yok")); return; }
      db.ref(YOL + "/" + kanal).set({t: String(metin), z: Date.now()}).then(
        function(){ if(sonuc) sonuc(true); },
        function(e){ if(sonuc) sonuc(false, e); }
      );
    }catch(e){ if(sonuc) sonuc(false, e); }
  }

  // Firebase'deki güncel metinleri yerele çeker (başka cihazda yapılan değişiklik gelsin diye).
  function tazele(bitince){
    var bitti = false;
    function son(){ if(bitti) return; bitti = true; if(bitince) bitince(); }
    try{
      var db = fbHazirla();
      if(!db){ son(); return; }
      var gorev = false;
      var kapat = firebase.auth().onAuthStateChanged(function(u){
        if(!u || gorev) return;
        gorev = true;
        try{ if(typeof kapat === "function") kapat(); }catch(e){}
        db.ref(YOL).once("value").then(function(snap){
          var v = snap.val() || {};
          var y = yerelOku();
          KANALLAR.forEach(function(k){
            if(v[k] && typeof v[k] === "object"){ y[k] = (v[k].t == null) ? "" : String(v[k].t); }
          });
          yerelYaz(y);
          son();
        }, function(){ son(); });
      });
      setTimeout(son, 6000);
    }catch(e){ son(); }
  }

  return { oku: oku, uygula: uygula, kaydet: kaydet, tazele: tazele, VARSAYILAN: VARSAYILAN };
})();
