/*
  pin-utils.js
  ============
  PIN'i düz metin olarak HİÇBİR YERDE saklamayan SHA-256 hash yardımcıları.
  Hem pin.html (doğrulama) hem menu.html (PIN belirleme/değiştirme)
  tarafından paylaşılır. Eski uygulamayla AYNI hash yöntemi ve
  localStorage/Firebase anahtarları kullanılıyor.
*/

var VARSAYILAN_PIN_HASH = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"; // sha256("1234")

function pinHashHesapla(pinStr){
  var enc = new TextEncoder().encode(String(pinStr));
  return crypto.subtle.digest("SHA-256", enc).then(function(buf){
    var arr = Array.from(new Uint8Array(buf));
    return arr.map(function(b){ return b.toString(16).padStart(2,"0"); }).join("");
  });
}

function pinKayitliHashGetir(){
  return localStorage.getItem("weicon_pin_hash") || VARSAYILAN_PIN_HASH;
}

// KÖK NEDEN DÜZELTMESİ (15.09.2026): pinDogrula() SADECE localStorage'a
// bakıyordu. Cihazın localStorage'ı (Android'in "kullanılmayan uygulama
// verilerini temizle" davranışı, tarayıcı verisi silme, vb. nedenlerle)
// boşalırsa, kullanıcı kendi belirlediği PIN'i (örn. 4967) doğru girse
// bile sistem sessizce varsayılan "1234" hash'iyle karşılaştırıp
// "PIN hatalı" diyordu — oysa gerçek PIN Firebase'de (pin/hash) hâlâ
// güvenle duruyordu, sadece hiç okunmuyordu. Artık localStorage boşsa
// Firebase'deki yedeğe bakılıyor ve bulunursa localStorage'a geri
// yazılıyor (bir daha bu cihazda kaybolmasın diye).
function pinKayitliHashGetirAsync(){
  var lokal = localStorage.getItem("weicon_pin_hash");
  if(lokal) return Promise.resolve(lokal);
  try{
    return firebase.database().ref("pin").once("value").then(function(snap){
      var val = snap.val();
      if(val && val.hash){
        try{ localStorage.setItem("weicon_pin_hash", val.hash); }catch(e){}
        return val.hash;
      }
      return VARSAYILAN_PIN_HASH;
    }).catch(function(){ return VARSAYILAN_PIN_HASH; });
  }catch(e){ return Promise.resolve(VARSAYILAN_PIN_HASH); }
}

// GÜVENLİK DÜZELTMESİ (v2 üstü): Kullanıcı henüz kendi PIN'ini belirlememişse
// (localStorage'da özel bir hash yoksa) sistem hâlâ herkesçe bilinen
// varsayılan "1234" PIN'iyle korunuyor demektir. pin-render.js bu durumu
// tespit edip kullanıcıyı zorunlu PIN belirleme adımına yönlendirir.
function pinVarsayilanKullaniliyorMu(){
  try{ return !localStorage.getItem("weicon_pin_hash"); }
  catch(e){ return false; }
}

function pinDogrula(girilenPin){
  return Promise.all([pinHashHesapla(girilenPin), pinKayitliHashGetirAsync()]).then(function(sonuc){
    return sonuc[0] === sonuc[1];
  });
}

function pinYeniHashKaydet(yeniHash){
  localStorage.setItem("weicon_pin_hash", yeniHash);
  try{
    firebase.database().ref("pin").set({hash:yeniHash, zaman:Date.now()});
  }catch(e){ console.error("PIN Firebase'e yazılamadı:", e); }
}
