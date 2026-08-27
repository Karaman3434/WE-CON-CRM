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
    apiKey: "AIzaSyC08eO1LE7TdQl8gG2H9raZQek211Dxd60",
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

  function kodUret(tip, musteriAd, gunIcindekiAyniTurSayisi){
    var onEk = {numune:"NU", teklif:"TK", proforma:"PF", siparis:"SP"}[tip] || "KY";
    var d = new Date();
    var tarihKismi = String(d.getDate()).padStart(2,"0") + String(d.getMonth()+1).padStart(2,"0") + String(d.getFullYear()).slice(-2);
    var sira = (gunIcindekiAyniTurSayisi||0) + 1;
    return onEk + tarihKismi + "." + String(sira).padStart(2,"0");
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

  function kaydet(tip, musteri, sepetUrunleri, kur, kdv, adresler, geriBildir){
    try{
      var urunlerKaydi = sepetUrunleri.map(function(u){
        var h = CartData.hesapla(u, kur, kdv);
        return {
          ad: u.ad || "İsimsiz Ürün",
          berta: u.berta || "",
          abas: u.abas || "",
          listeFiyat: u.listeFiyat || 0,
          dipFiyat: u.dipFiyat || 0,
          iskonto: u.iskonto || 0,
          adet: u.adet || 0,
          iskBirim: h.iskontoluFiyat || 0,
          toplamEuro: h.toplamEuro || 0
        };
      });
      var yeniImza = urunSetiImzaOlustur(urunlerKaydi);
      var simdi = Date.now();
      var db = firebase.database();
      var ref = db.ref("arsiv/" + tip);

      // Transaction kullanılır: iki cihaz aynı anda kayıt yazarsa Firebase
      // güncel değeri alıp callback'i yeniden çalıştırır. Böylece bir cihazın
      // yazdığı kayıt diğer cihazın eski snapshot'ı tarafından ezilmez.
      ref.transaction(function(mevcut){
        var liste = mevcut ? (Array.isArray(mevcut) ? mevcut.filter(Boolean) : Object.values(mevcut)) : [];
        var eslesenIdx = -1;
        for(var i=0;i<liste.length;i++){
          var aday = liste[i];
          if(!aday || !aday.ts) continue;
          var ayniMusteriMi = musteri.id && aday.musteriId ? (aday.musteriId===musteri.id) : (aday.musteri===musteri.ad);
          if(!ayniMusteriMi) continue;
          if(!ayniGunMu(aday.ts, simdi)) continue;
          if(urunSetiImzaOlustur(aday.urunler) !== yeniImza) continue;
          eslesenIdx = i;
          break;
        }

        var eskiKayit = null;
        var otomatikRevizeMi = false;
        if(eslesenIdx >= 0){
          eskiKayit = liste[eslesenIdx];
          var eskiToplam = (eskiKayit.urunler||[]).reduce(function(s,u){ return s+(u.toplamEuro||0); }, 0);
          if(!eskiKayit.revizeGecmisi) eskiKayit.revizeGecmisi = [];
          eskiKayit.revizeGecmisi.push({ts: eskiKayit.revizeZamani||eskiKayit.ts, toplamEuro:eskiToplam, urunSayisi:(eskiKayit.urunler||[]).length});
          eskiKayit.urunler = urunlerKaydi;
          eskiKayit.revizeZamani = simdi;
          if(adresler && adresler.faturaAdresi) eskiKayit.faturaAdresi = adresler.faturaAdresi;
          if(adresler && adresler.teslimatAdresi) eskiKayit.teslimatAdresi = adresler.teslimatAdresi;
          if(!eskiKayit.musteriId && musteri.id) eskiKayit.musteriId = musteri.id;
          otomatikRevizeMi = true;
        } else {
          var buGunAyniMusteriAyniTurSayisi = liste.filter(function(k){
            if(!k || !k.ts) return false;
            var ayniMusteriMi2 = musteri.id && k.musteriId ? (k.musteriId===musteri.id) : (k.musteri===musteri.ad);
            return ayniMusteriMi2 && ayniGunMu(k.ts, simdi);
          }).length;
          liste.unshift({
            tarih: tarihStr(), ts: simdi, kod: kodUret(tip, musteri.ad, buGunAyniMusteriAyniTurSayisi),
            musteri: musteri.ad, musteriId: musteri.id || null, sehir: musteri.sehir || "",
            mod: tip, urunler: urunlerKaydi,
            faturaAdresi: (adresler && adresler.faturaAdresi) || null,
            teslimatAdresi: (adresler && adresler.teslimatAdresi) || null
          });
        }
        liste.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
        return liste;
      }).then(function(result){
        if(!result.committed){
          geriBildir(false, new Error("Firebase kaydı commit edilmedi."));
          return;
        }
        var liste = result.snapshot.val();
        liste = liste ? (Array.isArray(liste) ? liste.filter(Boolean) : Object.values(liste)) : [];
        var kaydedilenKayit = null;
        for(var i=0;i<liste.length;i++){
          var k = liste[i];
          if(k && ((k.ts === simdi) || (k.revizeZamani === simdi)) && k.musteriId === (musteri.id || null) && k.mod === tip){
            kaydedilenKayit = k;
            break;
          }
        }
        if(!kaydedilenKayit){
          geriBildir(false, new Error("Firebase kaydı yazıldı ancak kaydedilen kayıt doğrulanamadı."));
          return;
        }
        var revizeMi = !!(kaydedilenKayit.revizeZamani === simdi);
        geriBildir(true, kaydedilenKayit, revizeMi);
      }).catch(function(err){
        console.error("Arşive kaydetme hatası:", err);
        geriBildir(false, err);
      });
    }catch(e){
      console.error("Kaydet hatası:", e);
      geriBildir(false, e);
    }
  }

  function kaynakSil(tip, ts, geriBildir){
    try{
      var db = firebase.database();
      var ref = db.ref("arsiv/" + tip);
      // Silme de transaction ile yapılır; böylece başka cihazın aynı anda
      // eklediği/güncellediği kayıt eski snapshot tarafından ezilmez.
      ref.transaction(function(mevcut){
        var liste = mevcut ? (Array.isArray(mevcut) ? mevcut.filter(Boolean) : Object.values(mevcut)) : [];
        return liste.filter(function(k){ return k.ts !== ts; });
      }).then(function(result){
        if(!result.committed){ geriBildir(false, new Error("Firebase silme işlemi commit edilmedi.")); return; }
        geriBildir(true);
      }).catch(function(err){
        geriBildir(false, err);
      });
    }catch(e){ geriBildir(false, e); }
  }

  return { baslat: baslat, kaydet: kaydet, kaynakSil: kaynakSil, fiyatGecmisiKontrolEt: fiyatGecmisiKontrolEt };

})();

SendData.baslat();
