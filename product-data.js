/*
  product-data.js
  ===============
  TEK görevi: ürün kataloğunu Firebase'den çekmek (eski uygulamayla AYNI yol
  ve önbellek anahtarı: kök "/" yolu, "wemosa_v8_catalog" localStorage
  anahtarı) ve sepet (basket) durumunu yönetmek. DOM'a dokunmaz.
*/

var ProductData = (function(){

  var firebaseConfig = {
    apiKey: "AIzaSyC08Oe1LE7TdQl8gG2H9raZQek211Dxd60",
    authDomain: "weicon-asist.firebaseapp.com",
    databaseURL: "https://weicon-asist-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "weicon-asist",
    storageBucket: "weicon-asist.firebasestorage.app",
    messagingSenderId: "673730415323",
    appId: "1:673730415323:web:29c817e05a281261a61afe"
  };

  var STORAGE_KEY = "wemosa_v8_catalog";
  var SEPET_KEY = "weiconv2_sepet";

  var katalog = [];
  var sepet = [];
  var katalogDinleyicileri = [];

  // --- Sepet: localStorage'dan yükle (eski aramadan kalan seçim varsa korunsun) ---
  try{
    var kayitliSepet = localStorage.getItem(SEPET_KEY);
    if(kayitliSepet) sepet = JSON.parse(kayitliSepet);
  }catch(e){ sepet = []; }

  function sepetiKaydet(){
    try{ localStorage.setItem(SEPET_KEY, JSON.stringify(sepet)); }catch(e){}
  }

  function baslat(){
    try{
      if(!firebase.apps.length){ firebase.initializeApp(firebaseConfig); }
      var db = firebase.database();

      // Önce localStorage önbelleğini göster (hız için)
      try{
        var local = localStorage.getItem(STORAGE_KEY);
        if(local){
          katalog = JSON.parse(local);
          katalogDinleyicileri.forEach(function(fn){ fn(); });
        }
      }catch(e){}

      db.ref("/").on("value", function(snap){
        var tumData = snap.val();
        if(!tumData) return;
        var urunler = [];
        if(Array.isArray(tumData)){
          urunler = tumData.filter(function(x){ return x && x.urun; });
        } else if(typeof tumData === "object"){
          Object.keys(tumData).forEach(function(k){
            if(!isNaN(parseInt(k)) && tumData[k] && tumData[k].urun){
              urunler.push(tumData[k]);
            }
          });
        }
        if(urunler.length > 0){
          katalog = urunler;
          try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(urunler)); }catch(e){}
          katalogDinleyicileri.forEach(function(fn){ fn(); });
        }
      }, function(err){
        console.error("Katalog okuma hatası:", err);
      });
    }catch(e){
      console.error("Firebase başlatma hatası:", e);
    }
  }

  function katalogDegistiginde(fn){
    katalogDinleyicileri.push(fn);
  }

  function ara(sorgu){
    var q = (sorgu||"").trim().toLocaleLowerCase("tr-TR");
    var kelimeler = q.split(/\s+/).filter(function(k){ return k.length>0; });
    var sonuc = [];
    for(var i=0;i<katalog.length;i++){
      var item = katalog[i];
      var b = (item.berta||item.BERTA||"").toString().toLocaleLowerCase("tr-TR");
      var a = (item.abas||item.ABAS||"").toString().toLocaleLowerCase("tr-TR");
      var n = (item.name||item.NAME||item.urun||item.URUN||"").toString().toLocaleLowerCase("tr-TR");
      var araMetin = b+" "+a+" "+n;
      if(kelimeler.length===0){ sonuc.push({item:item, idx:i}); continue; }
      var eslesme = true;
      for(var k=0;k<kelimeler.length;k++){
        if(araMetin.indexOf(kelimeler[k])<0){ eslesme=false; break; }
      }
      if(eslesme) sonuc.push({item:item, idx:i});
    }
    return sonuc;
  }

  function urunBilgisi(item){
    var bt = item.berta||item.BERTA||"";
    var at = item.abas||item.ABAS||"";
    var nt = item.name||item.NAME||item.urun||item.URUN||"";
    if(bt.toString().toLowerCase()==="nan") bt="";
    if(at.toString().toLowerCase()==="nan") at="";
    var pt = (item.fiyat!==undefined) ? item.fiyat :
             (item.price!==undefined) ? item.price :
             (item.PRICE!==undefined) ? item.PRICE :
             (item.euro!==undefined) ? item.euro :
             (item.Euro!==undefined) ? item.Euro : 0;
    var cp = 0;
    if(pt!==null && pt!==undefined && pt!==""){
      var pf = parseFloat(String(pt).replace(",","."));
      if(!isNaN(pf)) cp = pf;
    }
    return {berta:bt, abas:at, ad:nt, fiyat:cp};
  }

  function sepetteMi(idx){
    for(var i=0;i<sepet.length;i++){ if(sepet[i].idx===idx) return true; }
    return false;
  }

  function sepeteEkleCikar(idx){
    var mevcutIdx = -1;
    for(var i=0;i<sepet.length;i++){ if(sepet[i].idx===idx){ mevcutIdx=i; break; } }
    if(mevcutIdx !== -1){
      sepet.splice(mevcutIdx, 1);
      sepetiKaydet();
      return false; // çıkarıldı
    }
    var bilgi = urunBilgisi(katalog[idx]);
    sepet.push({idx:idx, ad:bilgi.ad, berta:bilgi.berta, abas:bilgi.abas, listeFiyat:bilgi.fiyat, dipFiyat:0, iskonto:0, adet:1, hesaplandi:false});
    sepetiKaydet();
    return true; // eklendi
  }

  function sepetSayisi(){ return sepet.length; }

  // Eski uygulamanın yeniUrunKaydet() ile AYNI mantık: katalog kök dizinde
  // sayısal index'lerle duruyor (0,1,2...). Yeni ürün için MEVCUT en büyük
  // sayısal index'i bulup +1'e yazıyoruz — başka HİÇBİR anahtara dokunmadan,
  // tek bir yeni key set ediyoruz, bu yüzden veri kaybı riski yok.
  function yeniUrunEkle(bilgi, geriBildir){
    try{
      var ad = (bilgi.ad||"").trim().slice(0,200);
      var berta = (bilgi.berta||"").trim().slice(0,60);
      var abas = (bilgi.abas||"").trim().slice(0,60);
      var fiyat = parseFloat(bilgi.fiyat);
      if(!ad){ geriBildir(false, "Ürün adı zorunlu."); return; }
      if(isNaN(fiyat) || fiyat<=0){ geriBildir(false, "Geçerli bir fiyat girin."); return; }

      if(berta && abas){
        var mukerrer = katalog.some(function(it){
          var b=(it.berta||it.BERTA||"").toString().trim();
          var a=(it.abas||it.ABAS||"").toString().trim();
          return b===berta && a===abas;
        });
        if(mukerrer){ geriBildir(false, "Bu Berta/Abas kodu zaten listede kayıtlı."); return; }
      }

      var db = firebase.database();
      db.ref("/").once("value").then(function(snap){
        var tumData = snap.val() || {};
        var maxIndex = -1;
        Object.keys(tumData).forEach(function(k){
          var n = parseInt(k, 10);
          if(!isNaN(n) && String(n)===k && n>maxIndex) maxIndex = n;
        });
        var yeniIndex = maxIndex + 1;
        var yeniUrun = {urun:ad, berta:berta, abas:abas, fiyat:fiyat};
        return db.ref(String(yeniIndex)).set(yeniUrun);
      }).then(function(){
        geriBildir(true);
      }).catch(function(err){ geriBildir(false, err); });
    }catch(e){ geriBildir(false, e); }
  }

  return {
    baslat: baslat,
    katalogDegistiginde: katalogDegistiginde,
    ara: ara,
    urunBilgisi: urunBilgisi,
    sepetteMi: sepetteMi,
    sepeteEkleCikar: sepeteEkleCikar,
    sepetSayisi: sepetSayisi,
    katalogUzunluk: function(){ return katalog.length; },
    yeniUrunEkle: yeniUrunEkle
  };

})();

ProductData.baslat();
