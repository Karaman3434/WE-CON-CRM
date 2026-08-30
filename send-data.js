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
    projectId: "weicon-asist",
    storageBucket: "weicon-asist.firebasestorage.app",
    messagingSenderId: "673730415323",
    appId: "1:673730415323:web:29c817e05a281261a61afe"
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

  // Belge kodu formatı (v2): {ÖNEK}.{GGAAYY}.{SSDD} — örn. "SİP.010126.1300"
  // (01.01.26 günü, saat 13:00'te oluşturulan sipariş). Önekler:
  // Numune→NUM, Fiyat Teklifi→F.TEK, Proforma Fatura→P.FAT, Sipariş→SİP.
  // Bu önek, belgenin O ANKİ türünü gösterir; bir belge Numune'den
  // Teklif'e, Teklif'ten Sipariş'e İLERLEDİKÇE tarih.saat kısmı SABİT
  // kalır (bkz. reports-data.js revizeBaslat/ilerletmeyiTamamla), sadece
  // önek güncellenir — böylece aynı iş fırsatı hep aynı "numara" ile
  // takip edilebilir.
  var KOD_ONEK = {numune:"NUM", teklif:"F.TEK", proforma:"P.FAT", siparis:"SİP"};

  // varTarihSaatKismi verilirse (bir önceki aşamadan devralınan belge),
  // yeni tarih/saat üretmek yerine onu aynen korur — sadece önek değişir.
  function kodUret(tip, varTarihSaatKismi){
    var onek = KOD_ONEK[tip] || "KY";
    var tarihSaatKismi = varTarihSaatKismi;
    if(!tarihSaatKismi){
      var d = new Date();
      var tarihKismi = String(d.getDate()).padStart(2,"0") + String(d.getMonth()+1).padStart(2,"0") + String(d.getFullYear()).slice(-2);
      var saatKismi = String(d.getHours()).padStart(2,"0") + String(d.getMinutes()).padStart(2,"0");
      tarihSaatKismi = tarihKismi + "." + saatKismi;
    }
    return onek + "." + tarihSaatKismi;
  }

  // Bir kod string'inden ("F.TEK.010126.1300") tarih.saat kısmını
  // ("010126.1300") ayıklar — önekin kaç parça olduğuna bakmaksızın,
  // son iki noktalı parçayı alır (GGAAYY ve SSDD her zaman sabit
  // uzunlukta: 6 ve 4 rakam).
  function kodTarihSaatKismiAyikla(kod){
    if(!kod) return null;
    var parcalar = kod.split(".");
    if(parcalar.length < 2) return null;
    return parcalar[parcalar.length-2] + "." + parcalar[parcalar.length-1];
  }

  function urunSetiImzaOlustur(urunler){
    return (urunler||[]).map(function(u){ return (u.berta||"")+"|"+(u.abas||""); }).sort().join(",");
  }

  function fiyatGecmisiKontrolEt(musteri, sepet, geriBildir){
    try{
      var db = firebase.database();
      db.ref("arsiv").once("value").then(function(snap){
        var arsiv = snap.val() || {};
        var uyarilar = [];
        ["teklif","proforma","siparis"].forEach(function(tip){
          var liste = arsiv[tip];
          if(!liste) return;
          liste = Array.isArray(liste) ? liste : Object.values(liste);
          liste.forEach(function(kayit){
            if((kayit.musteri||"").trim().toLocaleLowerCase("tr-TR") !== (musteri.ad||"").trim().toLocaleLowerCase("tr-TR")) return;
            (kayit.urunler||[]).forEach(function(u){
              sepet.forEach(function(su){
                if(!su.berta && !su.abas) return;
                if(u.berta !== su.berta || u.abas !== su.abas) return;
                var eskiFiyat = u.iskBirim || 0;
                var yeniFiyat = parseFloat(su.listeFiyat)||0;
                var yeniIskontolu = yeniFiyat - (yeniFiyat*(parseFloat(su.iskonto)||0)/100);
                if(yeniIskontolu < eskiFiyat){
                  uyarilar.push({urun:su.ad, eskiFiyat:eskiFiyat, yeniFiyat:yeniIskontolu, eskiTarih:kayit.tarih});
                }
              });
            });
          });
        });
        geriBildir(uyarilar);
      }).catch(function(){ geriBildir([]); });
    }catch(e){ geriBildir([]); }
  }

  function ayniGunMu(ts1, ts2){
    var d1 = new Date(ts1), d2 = new Date(ts2);
    return d1.getFullYear()===d2.getFullYear() && d1.getMonth()===d2.getMonth() && d1.getDate()===d2.getDate();
  }

  function normalizeListe(data){
    return data ? (Array.isArray(data) ? data.filter(Boolean) : Object.values(data)) : [];
  }

  function kaydet(tip, musteri, sepetUrunleri, kur, kdv, adresler, devralinanKod, geriBildir){
    var cb = typeof geriBildir === "function" ? geriBildir : function(){};
    try{
      var urunlerKaydi = (sepetUrunleri||[]).map(function(u){
        var h = CartData.hesapla(u, kur, kdv);
        return {
          ad: u.ad || "İsimsiz Ürün",
          berta: u.berta || "",
          abas: u.abas || "",
          listeFiyat: parseFloat(u.listeFiyat)||0,
          dipFiyat: parseFloat(u.dipFiyat)||0,
          iskonto: parseFloat(u.iskonto)||0,
          adet: parseFloat(u.adet)||0,
          iskBirim: h.iskontoluFiyat || 0,
          toplamEuro: h.toplamEuro || 0
        };
      });
      if(!musteri || !musteri.ad) throw new Error("Müşteri bilgisi eksik.");
      if(!tip || ["numune","teklif","proforma","siparis"].indexOf(tip)===-1) throw new Error("Geçersiz belge türü.");
      if(!urunlerKaydi.length) throw new Error("Sepette kayıt edilecek ürün yok.");

      var yeniImza = urunSetiImzaOlustur(urunlerKaydi);
      var simdi = Date.now();
      var devralinanTarihSaat = devralinanKod ? kodTarihSaatKismiAyikla(devralinanKod) : null;
      var db = firebase.database();
      var otomatikRevizeMi = false;
      var kaydedilenKayit = null;
      var ref = db.ref("arsiv/" + tip);
      var mutateHatasi = null;

      return ref.transaction(function(currentData){
        var liste = normalizeListe(currentData);
        otomatikRevizeMi = false;
        kaydedilenKayit = null;
        mutateHatasi = null;
        try{
          // Aynı gün + aynı müşteri + aynı ürün seti ise mevcut kaydı revize et.
          var eslesenIdx = -1;
          for(var i=0;i<liste.length;i++){
            var aday = liste[i];
            if(!aday || !aday.ts) continue;
            var ayniMusteriMi = musteri.id && aday.musteriId
              ? (aday.musteriId===musteri.id)
              : ((aday.musteri||"").trim().toLocaleLowerCase("tr-TR") === (musteri.ad||"").trim().toLocaleLowerCase("tr-TR"));
            if(!ayniMusteriMi) continue;
            if(!ayniGunMu(aday.ts, simdi)) continue;
            if(urunSetiImzaOlustur(aday.urunler) !== yeniImza) continue;
            eslesenIdx = i;
            break;
          }

          if(eslesenIdx >= 0){
            var eskiKayit = liste[eslesenIdx];
            var eskiToplam = (eskiKayit.urunler||[]).reduce(function(s,u){ return s+(parseFloat(u.toplamEuro)||0); }, 0);
            if(!eskiKayit.revizeGecmisi) eskiKayit.revizeGecmisi = [];
            eskiKayit.revizeGecmisi.push({
              ts: eskiKayit.revizeZamani||eskiKayit.ts,
              toplamEuro: eskiToplam,
              urunSayisi: (eskiKayit.urunler||[]).length
            });
            eskiKayit.urunler = urunlerKaydi;
            eskiKayit.revizeZamani = simdi;
            eskiKayit.kur = parseFloat(kur)||0;
            eskiKayit.kdv = parseFloat(kdv)||0;
            if(adresler && adresler.faturaAdresi) eskiKayit.faturaAdresi = adresler.faturaAdresi;
            if(adresler && adresler.teslimatAdresi) eskiKayit.teslimatAdresi = adresler.teslimatAdresi;
            if(!eskiKayit.musteriId && musteri.id) eskiKayit.musteriId = musteri.id;
            otomatikRevizeMi = true;
            kaydedilenKayit = eskiKayit;
          } else {
            kaydedilenKayit = {
              tarih: tarihStr(),
              ts: simdi,
              kod: kodUret(tip, devralinanTarihSaat),
              musteri: musteri.ad,
              musteriId: musteri.id || null,
              sehir: musteri.sehir || "",
              mod: tip,
              kur: parseFloat(kur)||0,
              kdv: parseFloat(kdv)||0,
              urunler: urunlerKaydi,
              faturaAdresi: (adresler && adresler.faturaAdresi) || null,
              teslimatAdresi: (adresler && adresler.teslimatAdresi) || null
            };
            liste.unshift(kaydedilenKayit);
          }
          liste.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
          return liste;
        }catch(e){
          mutateHatasi = e;
          return;
        }
      }).then(function(result){
        if(mutateHatasi){ cb(false, mutateHatasi); return false; }
        if(!result || !result.committed){
          var err = new Error("İşlem kaydı Firebase'e yazılamadı. Lütfen tekrar deneyin.");
          cb(false, err);
          return false;
        }
        cb(true, kaydedilenKayit, otomatikRevizeMi);
        return true;
      }).catch(function(err){
        console.error("Arşive transaction kaydetme hatası:", err);
        cb(false, err);
        return false;
      });
    }catch(e){
      console.error("Kaydet başlatma hatası:", e);
      cb(false, e);
    }
  }

  function kaynakSil(tip, ts, geriBildir){
    var cb = typeof geriBildir === "function" ? geriBildir : function(){};
    try{
      var ref = firebase.database().ref("arsiv/" + tip);
      var mutateHatasi = null;
      return ref.transaction(function(currentData){
        try{
          var liste = normalizeListe(currentData);
          var yeniListe = liste.filter(function(k){ return k && k.ts !== ts; });
          if(yeniListe.length === liste.length) return;
          return yeniListe;
        }catch(e){
          mutateHatasi = e;
          return;
        }
      }).then(function(result){
        if(mutateHatasi){ cb(false, mutateHatasi); return false; }
        if(!result || !result.committed){ cb(false, new Error("Silinecek kayıt bulunamadı veya işlem iptal edildi.")); return false; }
        cb(true);
        return true;
      }).catch(function(err){
        console.error("Arşiv kayıt silme hatası:", err);
        cb(false, err);
        return false;
      });
    }catch(e){ cb(false, e); }
  }

  return { baslat: baslat, kaydet: kaydet, kaynakSil: kaynakSil, fiyatGecmisiKontrolEt: fiyatGecmisiKontrolEt };

})();

SendData.baslat();
