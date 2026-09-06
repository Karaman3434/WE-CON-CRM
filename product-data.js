/*
  product-data.js
  ===============
  TEK görevi: ürün kataloğunu Firebase'den çekmek ve sepet (basket)
  durumunu yönetmek. DOM'a dokunmaz.

  Ürünler "urunler/" yolunda tutulur (06.09.2026'dan itibaren — eskiden
  kök "/" yolu kullanılıyordu, bkz. urunlerYoluHazirla() içindeki not).
  Önbellek anahtarı: "wemosa_v8_catalog" (eski uygulamayla aynı, değişmedi).
*/

var ProductData = (function(){

  var firebaseConfig = {
    apiKey: "AIzaSyC08oE1LE7TdQl8gG2H9raZQek211Dxd60",
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
  var katalogDinleyiciBagli = false;

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

      try{
        var local = localStorage.getItem(STORAGE_KEY);
        if(local){
          katalog = JSON.parse(local);
          katalogDinleyicileri.forEach(function(fn){ fn(); });
        }
      }catch(e){}

      urunlerYoluHazirla(db);
    }catch(e){
      console.error("Firebase başlatma hatası:", e);
    }
  }

  // ============================================================
  // GÜVENLİK/PERFORMANS DÜZELTMESİ (06.09.2026) — Son Sürüm İnceleme
  // Raporu madde 2'ye karşılık: ürünler artık kökte ("/") değil, ayrı
  // "urunler/" yolunda tutulur. Eskiden db.ref("/").on("value") sadece
  // ürün aramak için TÜM veritabanını (müşteriler, arşiv, maaş kayıtları
  // dahil) indiriyordu — Firebase kullanım grafiğindeki anormal yüksek
  // indirme miktarının sebebi de buydu.
  //
  // Geçiş CANLI VERİYE DOKUNMADAN, otomatik ve tek seferlik yapılır:
  // "urunler/" zaten doluysa doğrudan oradan okunur. Boşsa, kökteki
  // eski ürün kayıtları (sayısal anahtarlı, "urun" alanı olan objeler)
  // "urunler/" altına KOPYALANIR — kökteki eski kayıtlar GÜVENLİK İÇİN
  // SİLİNMEZ (bir sorun çıkarsa geri dönülebilsin diye). Kopyalama bir
  // kez yapıldıktan sonra tüm cihazlar artık sadece "urunler/"yi okur.
  // ============================================================
  function urunlerYoluHazirla(db){
    db.ref("urunler").once("value").then(function(snap){
      if(snap.exists() && snap.val()){
        urunlerDinlemeyeBasla(db);
        return;
      }
      // "urunler/" boş — kökteki eskileri bir kereye mahsus taşı.
      db.ref("/").once("value").then(function(kokSnap){
        var tumData = kokSnap.val();
        var tasinacak = {};
        if(tumData && typeof tumData === "object" && !Array.isArray(tumData)){
          Object.keys(tumData).forEach(function(k){
            if(!isNaN(parseInt(k,10)) && tumData[k] && typeof tumData[k]==="object" && tumData[k].urun){
              tasinacak[k] = tumData[k];
            }
          });
        }
        if(Object.keys(tasinacak).length > 0){
          db.ref("urunler").set(tasinacak).then(function(){
            urunlerDinlemeyeBasla(db);
          }).catch(function(err){
            console.error("Ürünler urunler/ yoluna taşınamadı, geçici olarak kökten okunuyor:", err);
            urunlerKoktenOku(db); // yedek yol — taşıma başarısız olursa eski yöntem
          });
        } else {
          urunlerDinlemeyeBasla(db); // hiç ürün yok, boş urunler/ dinlenir
        }
      }).catch(function(err){ console.error("Kök okuma hatası:", err); });
    }).catch(function(err){ console.error("urunler/ kontrol hatası:", err); });
  }

  function katalogGuncelle(tumData){
    var urunler = [];
    if(Array.isArray(tumData)){
      urunler = tumData.filter(function(x){ return x && x.urun; });
    } else if(tumData && typeof tumData === "object"){
      Object.keys(tumData).forEach(function(k){
        if(tumData[k] && tumData[k].urun) urunler.push(tumData[k]);
      });
    }
    katalog = urunler;
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(urunler)); }catch(e){}
    katalogDinleyicileri.forEach(function(fn){ fn(); });
  }

  function urunlerDinlemeyeBasla(db){
    db.ref("urunler").on("value", function(snap){
      katalogGuncelle(snap.val());
    }, function(err){
      console.error("Katalog okuma hatası:", err);
    });
  }

  // Sadece taşıma işlemi başarısız olursa devreye giren, eski davranışı
  // koruyan yedek yol (kalıcı çözüm değildir).
  function urunlerKoktenOku(db){
    db.ref("/").on("value", function(snap){
      katalogGuncelle(snap.val());
    }, function(err){
      console.error("Katalog okuma hatası:", err);
    });
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
      return false;
    }
    var bilgi = urunBilgisi(katalog[idx]);
    sepet.push({idx:idx, ad:bilgi.ad, berta:bilgi.berta, abas:bilgi.abas, listeFiyat:bilgi.fiyat, dipFiyat:0, iskonto:0, adet:1, hesaplandi:false});
    sepetiKaydet();
    return true;
  }

  function sepetSayisi(){ return sepet.length; }

  function yeniUrunEkle(bilgi, geriBildir){
    try{
      var ad = (bilgi.ad||"").trim().slice(0,200);
      var berta = (bilgi.berta||"").trim().slice(0,60);
      var abas = (bilgi.abas||"").trim().slice(0,60);
      var fiyat = parseFloat(bilgi.fiyat);
      if(!ad){ geriBildir(false, "Ürün adı zorunlu."); return; }
      if(isNaN(fiyat) || fiyat<=0){ geriBildir(false, "Geçerli bir fiyat girin."); return; }

      var db = firebase.database();
      db.ref("urunler").transaction(function(tumData){
        tumData = tumData || {};
        var veri = (typeof tumData === "object" && !Array.isArray(tumData)) ? tumData : {};
        var mukerrer = false;
        var maxIndex = -1;
        Object.keys(veri).forEach(function(k){
          var n = parseInt(k, 10);
          if(!isNaN(n) && String(n)===k && n>maxIndex) maxIndex = n;
          var it = veri[k];
          if(it && typeof it === "object"){
            var b=(it.berta||it.BERTA||"").toString().trim();
            var a=(it.abas||it.ABAS||"").toString().trim();
            if(berta && abas && b===berta && a===abas) mukerrer = true;
          }
        });
        if(mukerrer) return;
        veri[String(maxIndex + 1)] = {urun:ad, berta:berta, abas:abas, fiyat:fiyat};
        return veri;
      }).then(function(result){
        if(!result.committed){ geriBildir(false, "Ürün ekleme işlemi iptal edildi."); return; }
        if(berta && abas){
          var yeni = result.snapshot.val() || {};
          var bulundu = Object.keys(yeni).some(function(k){
            var it=yeni[k];
            return it && (it.berta||it.BERTA||"").toString().trim()===berta && (it.abas||it.ABAS||"").toString().trim()===abas;
          });
          if(!bulundu){ geriBildir(false, "Ürün kaydı doğrulanamadı."); return; }
        }
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
