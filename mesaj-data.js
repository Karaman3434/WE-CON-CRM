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

  GÜNCELLEME (28.09.2026, Abdullah'ın isteğiyle — merkez ofis/Satış Destek'e
  giden mailin daha kurumsal/doğru Türkçe olması için): metin artık İKİ ayrı
  yer tutucu tanıyor — HAREKET (belirtme hâli: "Siparişi/Proforma faturayı/
  Fiyat teklifini/Numuneyi göndermenizi rica ederim" gibi kalıplarda) ve
  BELGE (yalın hâl: "Sipariş/Proforma fatura/Fiyat teklifi/Numune formu
  ektedir" gibi kalıplarda). NUMUNE artık ayrı bir metin DEĞİL — diğer 3 tür
  gibi aynı ortak "mail" şablonunu (HAREKET/BELGE ile) kullanıyor.

  Saklama: localStorage + Firebase (mesajSablonlari/metinler — mevcut
  Firebase kuralı zaten bu yolu kapsıyor, kural değişikliği gerekmez).
  Eski sistemin {FIRMA}/{BELGE_ESKI} yer tutuculu kayıtları KULLANILMAZ
  (temiz başlangıç); yeni kayıt yolu eski kayıtlara dokunmaz.
*/
var MesajData = (function(){

  var ANAHTAR = "weiconv2_mesaj_metinleri";
  var YOL = "mesajSablonlari/metinler";
  var KANALLAR = ["mail", "whatsapp"];

  // Hiç kayıt yapılmamışken başlangıç metni — sadece bir başlangıç noktası,
  // Mesaj Ayarları'nda istenildiği gibi değiştirilip kaydedilir.
  var VARSAYILAN = {
    mail: "Merhaba,\nBilgilerini paylaştığım Firma için HAREKET göndermenizi rica ederim. BELGE formu ektedir.",
    whatsapp: "Merhaba,\nİstediğiniz ürün için fiyat bilgisi ektedir."
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

  // HAREKET = belirtme hâli ("...HAREKET göndermenizi rica ederim" -> "...Siparişi göndermenizi rica ederim")
  // BELGE   = yalın hâl     ("BELGE formu ektedir" -> "Sipariş formu ektedir")
  var HAREKET_ADLARI = {siparis:"Siparişi", teklif:"Fiyat teklifini", proforma:"Proforma faturayı", numune:"Numuneyi"};
  var BELGE_ADLARI = {siparis:"Sipariş", teklif:"Fiyat teklifi", proforma:"Proforma fatura", numune:"Numune"};

  // Metindeki (büyük harf, birebir) HAREKET/BELGE kelimelerini işlem adıyla değiştirir.
  function uygula(metin, tip){
    var hareket = HAREKET_ADLARI[tip];
    var belge = BELGE_ADLARI[tip];
    var sonuc = String(metin);
    if(hareket) sonuc = sonuc.split("HAREKET").join(hareket);
    if(belge) sonuc = sonuc.split("BELGE").join(belge);
    return sonuc;
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
