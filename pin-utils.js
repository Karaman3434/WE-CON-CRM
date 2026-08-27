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

// GÜVENLİK DÜZELTMESİ (v2 üstü): Kullanıcı henüz kendi PIN'ini belirlememişse
// (localStorage'da özel bir hash yoksa) sistem hâlâ herkesçe bilinen
// varsayılan "1234" PIN'iyle korunuyor demektir. pin-render.js bu durumu
// tespit edip kullanıcıyı zorunlu PIN belirleme adımına yönlendirir.
function pinVarsayilanKullaniliyorMu(){
  try{ return !localStorage.getItem("weicon_pin_hash"); }
  catch(e){ return false; }
}

function pinDogrula(girilenPin){
  return pinHashHesapla(girilenPin).then(function(girilenHash){
    return girilenHash === pinKayitliHashGetir();
  });
}

function pinYeniHashKaydet(yeniHash){
  localStorage.setItem("weicon_pin_hash", yeniHash);
  try{
    firebase.database().ref("pin").set({hash:yeniHash, zaman:Date.now()});
  }catch(e){ console.error("PIN Firebase'e yazılamadı:", e); }
}
