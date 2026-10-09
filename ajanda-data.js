/*
  ajanda-data.js — VERSİYON: WG.091026.1540.755
  =================================================
  09.10.2026, Abdullah'ın isteğiyle: günlük kağıt ajandasının (not
  defteri) sayfa fotoğraflarını tarihe göre saklayıp hızlıca geri
  bulabilmek için. Gün başına birden fazla sayfa/fotoğraf olabilir.

  MİMARİ KARARI — Firebase STORAGE kullanılıyor (RTDB'ye base64 GÖMME
  değil): uygulamanın geri kalanı (Komisyon fotoğrafları dahil) küçük,
  sabit sayıda görseli doğrudan Realtime Database'e base64 olarak
  yazıyor — ama orası en fazla "2 slot". Ajanda ise zamanla yüzlerce
  sayfa biriktirecek bir arşiv; hepsini her sayfa açılışında istemciye
  tam olarak indirmek (RTDB'nin "value" dinleyicisi tüm ağacı bir kerede
  getirir) hem yavaş hem gereksiz veri kullanımı olurdu. Bunun yerine:
    - Gerçek JPEG dosyası Firebase STORAGE'a yüklenir (ajanda/{tarih}/…)
    - Realtime Database'de SADECE hafif bir kayıt tutulur:
      ajanda/{YYYY-MM-DD}/{pushId} = {yol, url, zaman}
  Böylece takvimdeki gün rozetleri (kaç sayfa var) ve kronolojik liste
  anında, görselleri hiç indirmeden hesaplanır; görsel sadece o gün
  açıldığında veya görüntüleyicide sırası geldiğinde (tarayıcının kendi
  <img>/background-image yüklemesiyle) çekilir.

  Fotoğraf, yüklenmeden ÖNCE ajanda-render.js'teki resimSikistir() ile
  (Ödenebilir Komisyon'daki AYNI yöntem: canvas'a çizip küçültüp %60
  kaliteli JPEG'e çevirme) sıkıştırılıp sonra buraya "data:image/jpeg;
  base64,..." olarak verilir.
*/

var AjandaData = (function(){

  var veri = {}; // { "YYYY-MM-DD": { pushId: {yol, url, zaman} } }
  var dinleyiciler = [];
  var yuklendi = false;

  function baslat(){
    try{
      if(!firebase.apps.length){ firebase.initializeApp(WEICON_FIREBASE_CONFIG); }
      firebase.database().ref("ajanda").on("value", function(snap){
        veri = snap.val() || {};
        yuklendi = true;
        dinleyiciler.forEach(function(fn){
          try{ fn(); }catch(e){ console.error("Ajanda dinleyici hatası:", e); }
        });
      }, function(err){
        console.error("Ajanda okunamadı:", err);
      });
    }catch(e){ console.error("AjandaData başlatılamadı:", e); }
  }

  function degistiginde(fn){
    if(typeof fn === "function" && dinleyiciler.indexOf(fn)===-1) dinleyiciler.push(fn);
  }

  function yuklendiMi(){ return yuklendi; }

  // Takvim gün rozetleri için: {"YYYY-MM-DD": sayi}
  function gunSayilari(){
    var sonuc = {};
    Object.keys(veri).forEach(function(tarih){
      sonuc[tarih] = Object.keys(veri[tarih] || {}).length;
    });
    return sonuc;
  }

  // Bir günün kayıtları, saat sırasına göre.
  function gununKayitlari(tarih){
    var gun = veri[tarih] || {};
    return Object.keys(gun).map(function(id){
      var kayit = gun[id];
      return {id: id, tarih: tarih, yol: kayit.yol, url: kayit.url, zaman: kayit.zaman};
    }).sort(function(a, b){ return a.zaman - b.zaman; });
  }

  // TÜM fotoğrafları kronolojik sırayla tek dizi halinde döndürür — tam
  // ekran görüntüleyici gün sınırını fark ettirmeden bunun üstünde
  // kaydırarak (swipe) gezinir.
  function tumKayitlarKronolojik(){
    var liste = [];
    Object.keys(veri).sort().forEach(function(tarih){
      gununKayitlari(tarih).forEach(function(k){ liste.push(k); });
    });
    return liste;
  }

  // dataUrl: "data:image/jpeg;base64,..." — önceden sıkıştırılmış olmalı.
  function fotografEkle(tarih, dataUrl, geriBildir){
    var cb = typeof geriBildir === "function" ? geriBildir : function(){};
    try{
      var zaman = Date.now();
      var yol = "ajanda/" + tarih + "/" + zaman + "_" + Math.random().toString(36).slice(2, 8) + ".jpg";
      firebase.storage().ref(yol).putString(dataUrl, "data_url")
        .then(function(gorev){ return gorev.ref.getDownloadURL(); })
        .then(function(url){
          return firebase.database().ref("ajanda/" + tarih).push({yol: yol, url: url, zaman: zaman});
        })
        .then(function(){ cb(true); })
        .catch(function(err){ cb(false, err); });
    }catch(e){ cb(false, e); }
  }

  function fotografSil(tarih, id, yol, geriBildir){
    var cb = typeof geriBildir === "function" ? geriBildir : function(){};
    try{
      firebase.database().ref("ajanda/" + tarih + "/" + id).remove()
        .then(function(){
          if(yol) return firebase.storage().ref(yol).delete().catch(function(){});
        })
        .then(function(){ cb(true); })
        .catch(function(err){ cb(false, err); });
    }catch(e){ cb(false, e); }
  }

  baslat();

  return {
    degistiginde: degistiginde,
    yuklendiMi: yuklendiMi,
    gunSayilari: gunSayilari,
    gununKayitlari: gununKayitlari,
    tumKayitlarKronolojik: tumKayitlarKronolojik,
    fotografEkle: fotografEkle,
    fotografSil: fotografSil
  };

})();
