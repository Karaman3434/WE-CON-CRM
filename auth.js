/*
  auth.js
  =======
  TÜM sayfalar tarafından paylaşılan tek görevi: Firebase oturumunun açık
  olup olmadığını kontrol etmek. Oturum yoksa login.html'e yönlendirir.
  Oturum varsa sayfa içeriğini gösterir (body başta gizli tutulur — kısa
  bir an için "giriş yapılmamış" hâlinin görünmesini engellemek için).

  Her sayfanın <head> içine şu satır eklenmeli (diğer script'lerden ÖNCE):
    <script>document.documentElement.style.visibility='hidden';</script>
  ve body sonuna:
    <script src="auth.js"></script>
*/

(function(){

  if(!firebase.apps.length){ firebase.initializeApp(WEICON_FIREBASE_CONFIG); }

  // PIN KİLİDİ (WG.210926.1613.587): 1 dakika kullanılmazsa PIN istenir.
  // "Kullanılmama" = ekrana son dokunuş/kaydırma/tuş vuruşundan beri geçen
  // süre (aşağıdaki etkileşim dinleyicileri zaman damgasını taze tutar).
  var PIN_KILIT_ESIK_MS = 60*1000;
  var TAM_GIRIS_ESIK_MS = 3*60*60*1000; // 3 saat hareketsizlik -> tam e-posta/şifre girişi

  // ---- CİHAZ ENGELLEME (bkz. cihaz-data.js / cihazlar.html) ----
  // Bu bölüm KASITLI OLARAK cihaz-data.js'e bağımlı değil — auth.js zaten
  // TÜM sayfalarda yükleniyor, 28 ayrı HTML dosyasına yeni bir <script>
  // eklemek yerine gereken minimum mantık burada kendi başına duruyor.
  function cihazIdOku(){
    try{
      var id = localStorage.getItem("weicon_cihaz_id");
      if(!id){
        id = "c" + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
        localStorage.setItem("weicon_cihaz_id", id);
      }
      return id;
    }catch(e){ return "bilinmeyen"; }
  }
  function cihazKaydiGuncelle(){
    try{
      var veri = { sonGorulme: Date.now() };
      var yerelAd = localStorage.getItem("weicon_cihaz_adi");
      if(yerelAd) veri.ad = yerelAd;
      firebase.database().ref("cihazlar/" + cihazIdOku()).update(veri).catch(function(){});
    }catch(e){}
  }
  // Çevrimdışıyken veya okuma başarısız olduğunda erişimi ENGELLEME —
  // sadece Firebase açıkça "engelli:true" derse kilitle.
  function cihazEngelliMi(geriBildir){
    try{
      firebase.database().ref("cihazlar/" + cihazIdOku() + "/engelli").once("value")
        .then(function(snap){ geriBildir(snap.val() === true); })
        .catch(function(){ geriBildir(false); });
    }catch(e){ geriBildir(false); }
  }

  var yol = window.location.pathname;
  var buSayfaLogin = yol.indexOf("login.html") >= 0;
  var buSayfaPin = yol.indexOf("pin.html") >= 0;
  var buSayfaCihazEngelli = yol.indexOf("cihaz-engelli.html") >= 0;

  function aktiviteZamaniniGuncelle(){
    try{ localStorage.setItem("weicon_son_aktivite", Date.now().toString()); }catch(e){}
  }

  function gecenSureDurumu(){
    try{
      var son = parseInt(localStorage.getItem("weicon_son_aktivite")||"0", 10);
      // Kayıt yoksa (tarayıcı verisi silinmiş / yeni cihaz / bozuk kayıt)
      // eskiden "kilit yok" sayılıyordu — bu, bazı cihazlarda PIN'in hiç
      // sorulmamasının nedenlerinden biriydi. Artık KİLİTLİ sayılır.
      if(!son) return 1;
      var fark = Date.now() - son;
      if(fark < 0) return 1;                 // saat geri alınmışsa da kilitli say
      if(fark > TAM_GIRIS_ESIK_MS) return 2;
      if(fark > PIN_KILIT_ESIK_MS) return 1;
      return 0;
    }catch(e){ return 0; }
  }

  // SAYFA YÜKLENMEDEN GERİ DÖNÜŞ KONTROLÜ: Uygulama arka plana atılıp (başka
  // uygulamaya geçme, ekran kilidi) geri gelindiğinde tarayıcı bazen sayfayı
  // YENİDEN YÜKLEMEZ (telefonun belleğine ve tarayıcıya göre değişir — S22,
  // iPhone ve iPad'de farklı davranır). Eskiden PIN kontrolü SADECE sayfa
  // yüklenirken yapıldığı için, sayfa yenilenmeyen cihazda PIN hiç sorulmuyordu.
  // Şimdi sayfa tekrar görünür olduğunda da aynı kontrol yapılır.
  var kilitleniyor = false;
  function geriDonusKilitKontrolu(){
    if(kilitleniyor || buSayfaLogin || buSayfaPin || buSayfaCihazEngelli) return;
    try{ if(!firebase.auth().currentUser) return; }catch(e){ return; }
    var durum = gecenSureDurumu();
    if(durum === 0) return;
    kilitleniyor = true;
    document.documentElement.style.visibility = "hidden"; // içerik bir an bile görünmesin
    if(durum === 2){ firebase.auth().signOut(); }
    else { window.location.replace("pin.html"); }
  }
  document.addEventListener("visibilitychange", function(){
    if(!document.hidden) geriDonusKilitKontrolu();
  });
  window.addEventListener("pageshow", function(ev){
    if(ev.persisted) geriDonusKilitKontrolu();   // geri/ileri önbelleğinden dönüş
  });
  window.addEventListener("focus", geriDonusKilitKontrolu);

  // GERÇEK KULLANIM TAKİBİ: Zaman damgası eskiden sadece sayfa açılırken
  // yenileniyordu. Artık ekrana dokunma/kaydırma/tuş vuruşu da (en fazla 2 sn'de
  // bir yazılarak) yeniler. PIN ekranında yenilenmez — aksi hâlde PIN ekranına
  // dokunmak kilidi kırardı.
  if(!buSayfaPin){
    var sonEtkilesimYazimi = 0;
    var etkilesimKaydet = function(){
      var t = Date.now();
      if(t - sonEtkilesimYazimi < 2000) return;
      if(kilitleniyor) return;
      sonEtkilesimYazimi = t;
      aktiviteZamaniniGuncelle();
    };
    ["touchstart","pointerdown","mousedown","keydown","scroll","input"].forEach(function(ad){
      window.addEventListener(ad, etkilesimKaydet, {passive:true, capture:true});
    });
  }

  // ÇEVRİMDIŞI FARKINDALIK BANNER'I — Firebase Realtime Database yazma
  // işlemlerini bağlantı kesikken de otomatik kuyruğa alıp bağlantı gelince
  // gönderir (SDK'nın kendi varsayılan davranışı), ama kullanıcı bunun
  // farkında olmalı — aksi hâlde "kaydettim ama gitti mi gitmedi mi" belirsizliği
  // yaşanır. Bu yüzden basit bir banner ile durumu her sayfada gösteriyoruz.
  function cevrimdisiBannerOlustur(){
    if(document.getElementById("cevrimdisiBanner")) return;
    var b = document.createElement("div");
    b.id = "cevrimdisiBanner";
    b.textContent = "📴 Çevrimdışısın — kayıtların bağlantı gelince otomatik gönderilecek.";
    b.style.cssText = "display:none;position:fixed;top:0;left:0;right:0;background:#f2994a;color:#fff;text-align:center;padding:8px 12px;font-size:12px;font-weight:800;z-index:99998;";
    document.body.insertBefore(b, document.body.firstChild);
  }

  function cevrimdisiDurumGuncelle(){
    cevrimdisiBannerOlustur();
    var b = document.getElementById("cevrimdisiBanner");
    if(b) b.style.display = navigator.onLine ? "none" : "block";
  }

  window.addEventListener("online", cevrimdisiDurumGuncelle);
  window.addEventListener("offline", cevrimdisiDurumGuncelle);
  document.addEventListener("DOMContentLoaded", cevrimdisiDurumGuncelle);

  function normalAkisiIsle(user){
    if(user){
      // Giriş sayfasındaysak (yeni tamamlanmış bir giriş demektir), bayat
      // "son aktivite" zaman damgası yüzünden yanlışlıkla anında çıkışa
      // zorlamayı önlemek için aktiviteyi HEMEN tazeleyip durum kontrolünü
      // hiç uygulamadan doğrudan Ana Sayfa'ya geç.
      if(buSayfaLogin){
        aktiviteZamaniniGuncelle();
        window.location.href = "home.html";
        return;
      }
      var durum = gecenSureDurumu();
      if(durum === 2){
        firebase.auth().signOut();
        return; // signOut tekrar tetikleyecek (user=null dalı çalışacak)
      }
      if(durum === 1 && !buSayfaPin){
        window.location.href = "pin.html";
        return;
      }
      if(!buSayfaCihazEngelli){
        cihazEngelliMi(function(engelli){
          if(engelli){
            firebase.auth().signOut().then(function(){
              window.location.href = "cihaz-engelli.html";
            });
            return;
          }
          document.documentElement.style.visibility = "visible";
          if(!buSayfaPin) aktiviteZamaniniGuncelle();
          cihazKaydiGuncelle();
          window.dispatchEvent(new CustomEvent("weiconAuthHazir", {detail:{user:user}}));
        });
        return;
      }
      document.documentElement.style.visibility = "visible";
      if(!buSayfaPin) aktiviteZamaniniGuncelle();
      window.dispatchEvent(new CustomEvent("weiconAuthHazir", {detail:{user:user}}));
    } else {
      if(buSayfaCihazEngelli){
        document.documentElement.style.visibility = "visible";
      } else if(!buSayfaLogin){
        window.location.href = "login.html";
      } else {
        document.documentElement.style.visibility = "visible";
      }
    }
  }

  firebase.auth().onAuthStateChanged(function(user){
    normalAkisiIsle(user);
  });

})();
