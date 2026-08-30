/*
  customer-data.js
  ================
  Müşteri listesini Firebase'in "musteriler" yolundan okur/yazar.

  GÜVENLİ YAZMA DESENİ — ÇOK ÖNEMLİ:
  Eski uygulama, geçmişte TAM olarak bu hataya düşmüştü: cihazın belleğindeki
  (muhtemelen bayat) tüm müşteri dizisini doğrudan Firebase'in üzerine
  yazıyordu. Sayfa yeni açılmışken ya da başka bir cihaz/sekme bir değişiklik
  yaptıysa, bu bayat veri sunucudaki GÜNCEL veriyi SESSİZCE silebiliyordu.
  Bunu tekrarlamamak için: her yazma işleminden HEMEN ÖNCE sunucudan TAZE
  veri okunur, değişiklik SADECE o taze veri üzerine uygulanır, sonra öyle
  yazılır. Yerel önbellek (liste) SADECE okuma/görüntüleme için kullanılır,
  YAZMA için asla doğrudan kullanılmaz.
*/

var CustomerData = (function(){

  var firebaseConfig = {
    apiKey: "AIzaSyC08Oe1LE7TdQl8gG2H9raZQek211Dxd60",
    authDomain: "weicon-asist.firebaseapp.com",
    databaseURL: "https://weicon-asist-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "weicon-asist",
    storageBucket: "weicon-asist.firebasestorage.app",
    messagingSenderId: "673730415323",
    appId: "1:673730415323:web:29c817e05a281261a61afe"
  };

  var SECILI_MUSTERI_KEY = "weicon_secili_musteri";

  var liste = [];
  var dinleyiciler = [];

  function baslat(){
    try{
      if(!firebase.apps.length){ firebase.initializeApp(firebaseConfig); }
      var db = firebase.database();
      db.ref("musteriler").on("value", function(snap){
        var data = snap.val();
        liste = data ? (Array.isArray(data) ? data.filter(Boolean) : Object.values(data)) : [];
        dinleyiciler.forEach(function(fn){ fn(); });
      }, function(err){
        console.error("Müşteri okuma hatası:", err);
      });
    }catch(e){
      console.error("Firebase başlatma hatası:", e);
    }
  }

  function listeDegistiginde(fn){ dinleyiciler.push(fn); }

  function ara(sorgu){
    var q = (sorgu||"").trim().toLocaleLowerCase("tr-TR");
    if(!q) return liste;
    return liste.filter(function(m){
      var ad = (m.ad||"").toLocaleLowerCase("tr-TR");
      var sehir = (m.sehir||"").toLocaleLowerCase("tr-TR");
      return ad.indexOf(q)>=0 || sehir.indexOf(q)>=0;
    });
  }

  function sec(musteri){
    try{ localStorage.setItem(SECILI_MUSTERI_KEY, JSON.stringify(musteri)); }catch(e){}
  }

  function seciliyiOku(){
    try{
      var v = localStorage.getItem(SECILI_MUSTERI_KEY);
      return v ? JSON.parse(v) : null;
    }catch(e){ return null; }
  }

  function musteriBul(ad){
    return liste.find(function(m){ return (m.ad||"").toLocaleLowerCase("tr-TR")===(ad||"").toLocaleLowerCase("tr-TR"); }) || null;
  }

  // ---- GÜVENLİ YAZMA ÇEKİRDEĞİ ----
  // DOĞRULAMALI YAZMA: yazdıktan hemen sonra Firebase'den TEKRAR okuyup
  // gönderdiğimiz veriyle karşılaştırıyoruz. Bu, "başarılı" denip aslında
  // sunucuya işlemeyen sessiz hataları yakalamak için — böyle bir durum
  // olursa kullanıcı net bir hata görür, yanlışlıkla "kaydedildi" sanmaz.
  function guvenliYaz(mutateFn, geriBildir){
    try{
      var db = firebase.database();
      var beklenenSonuc = null;
      db.ref("musteriler").once("value").then(function(snap){
        var data = snap.val();
        var tazeListe = data ? (Array.isArray(data) ? data.filter(Boolean) : Object.values(data)) : [];
        var sonuc = mutateFn(tazeListe);
        var yazilacak = (sonuc !== undefined) ? sonuc : tazeListe;
        beklenenSonuc = yazilacak;
        return db.ref("musteriler").set(yazilacak).then(function(){ return db.ref("musteriler").once("value"); });
      }).then(function(dogrulamaSnap){
        var dogrulananVeri = dogrulamaSnap.val();
        var dogrulananListe = dogrulananVeri ? (Array.isArray(dogrulananVeri) ? dogrulananVeri.filter(Boolean) : Object.values(dogrulananVeri)) : [];
        if(JSON.stringify(dogrulananListe) !== JSON.stringify(beklenenSonuc)){
          geriBildir(false, new Error("Yazma doğrulanamadı — sunucudaki veri gönderilenle eşleşmiyor. Lütfen tekrar deneyin."));
          return;
        }
        geriBildir(true, beklenenSonuc);
      }).catch(function(err){
        console.error("Müşteri yazma hatası:", err);
        geriBildir(false, err);
      });
    }catch(e){ geriBildir(false, e); }
  }

  function musteriIndexBul(tazeListe, musteriAd){
    return tazeListe.findIndex(function(m){ return (m.ad||"").toLocaleLowerCase("tr-TR")===(musteriAd||"").toLocaleLowerCase("tr-TR"); });
  }

  function gunFarkiHesapla(ts){
    return Math.floor((Date.now() - ts) / 86400000);
  }

  function ziyaretHatirlatmalari(){
    var sonuc = [];
    liste.forEach(function(m){
      var gecmis = m.ziyaretGecmisi || [];
      var enSonTs = gecmis.length ? Math.max.apply(null, gecmis.map(function(z){ return z.ts||0; })) : null;
      var gun = enSonTs ? gunFarkiHesapla(enSonTs) : null;
      sonuc.push({musteri:m.ad, sehir:m.sehir||"", gun:gun, hicZiyaretYok: gecmis.length===0});
    });
    sonuc.sort(function(a,b){
      if(a.hicZiyaretYok !== b.hicZiyaretYok) return a.hicZiyaretYok ? -1 : 1;
      return (b.gun||0)-(a.gun||0);
    });
    return sonuc;
  }

  function ziyaretEkle(musteriAd, not, tur, hatirlatmaTarihi, geriBildir){
    // Geriye uyumluluk: eski çağrılar ziyaretEkle(ad, not, geriBildir) şeklindeydi.
    if(typeof tur === "function"){ geriBildir = tur; tur = "ziyaret"; hatirlatmaTarihi = null; }
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      if(!tazeListe[idx].ziyaretGecmisi) tazeListe[idx].ziyaretGecmisi = [];
      var kayit = {ts:Date.now(), not: not || "", tur: tur || "ziyaret"};
      if(hatirlatmaTarihi) kayit.hatirlatmaTarihi = hatirlatmaTarihi;
      tazeListe[idx].ziyaretGecmisi.push(kayit);
      tazeListe[idx].ziyaretGecmisi.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
      tazeListe[idx].sonZiyaret = tazeListe[idx].ziyaretGecmisi[0].ts;
      tazeListe[idx].sonZiyaretNot = tazeListe[idx].ziyaretGecmisi[0].not;
    }, geriBildir);
  }

  // Takvim görünümü için: tüm müşterilerin tüm ziyaret/temas kayıtlarını,
  // hangi müşteriye ait olduğu bilgisiyle birlikte tek listede döner.
  function tumZiyaretTemaslar(){
    var sonuc = [];
    liste.forEach(function(m){
      (m.ziyaretGecmisi||[]).forEach(function(z, i){
        sonuc.push({
          musteri: m.ad, sehir: m.sehir||"", ts: z.ts, not: z.not||"",
          tur: z.tur||"ziyaret", hatirlatmaTarihi: z.hatirlatmaTarihi||null, kayitIndex: i
        });
      });
    });
    return sonuc;
  }

  // Bugün sabahı hatırlatılması gereken kayıtlar (hatirlatmaTarihi bugüne eşit).
  function hatirlatmalarBugun(){
    var bugun = new Date();
    var bugunStr = bugun.getFullYear() + "-" + String(bugun.getMonth()+1).padStart(2,"0") + "-" + String(bugun.getDate()).padStart(2,"0");
    return tumZiyaretTemaslar().filter(function(z){ return z.hatirlatmaTarihi === bugunStr; });
  }

  // Türkiye il plaka kodları — şehir adından 2 haneli kodu bulmak için.
  // Müşteri kodu formatı: M{ilKodu:2}{sıra:3} — örn. Ankara'da 1. müşteri
  // "M06001", Samsun'da 3. müşteri "M55003". Şehir tanınmazsa "M00xxx" kullanılır.
  var IL_KODLARI = {
    "adana":"01","adıyaman":"02","afyonkarahisar":"03","afyon":"03","ağrı":"04","amasya":"05",
    "ankara":"06","antalya":"07","artvin":"08","aydın":"09","balıkesir":"10","bilecik":"11",
    "bingöl":"12","bitlis":"13","bolu":"14","burdur":"15","bursa":"16","çanakkale":"17",
    "çankırı":"18","çorum":"19","denizli":"20","diyarbakır":"21","edirne":"22","elazığ":"23",
    "erzincan":"24","erzurum":"25","eskişehir":"26","gaziantep":"27","giresun":"28","gümüşhane":"29",
    "hakkari":"30","hatay":"31","ısparta":"32","isparta":"32","mersin":"33","içel":"33",
    "istanbul":"34","i̇stanbul":"34","izmir":"35","i̇zmir":"35","kars":"36","kastamonu":"37",
    "kayseri":"38","kırklareli":"39","kırşehir":"40","kocaeli":"41","konya":"42","kütahya":"43",
    "malatya":"44","manisa":"45","kahramanmaraş":"46","maraş":"46","mardin":"47","muğla":"48",
    "muş":"49","nevşehir":"50","niğde":"51","ordu":"52","rize":"53","sakarya":"54",
    "samsun":"55","siirt":"56","sinop":"57","sivas":"58","tekirdağ":"59","tokat":"60",
    "trabzon":"61","tunceli":"62","şanlıurfa":"63","urfa":"63","uşak":"64","van":"65",
    "yozgat":"66","zonguldak":"67","aksaray":"68","bayburt":"69","karaman":"70","kırıkkale":"71",
    "batman":"72","şırnak":"73","bartın":"74","ardahan":"75","ığdır":"76","yalova":"77",
    "karabük":"78","kilis":"79","osmaniye":"80","düzce":"81"
  };

  function ilKoduBul(sehirMetni){
    if(!sehirMetni) return "00";
    var temiz = sehirMetni.trim().toLocaleLowerCase("tr-TR").split("-")[0].split("/")[0].trim();
    return IL_KODLARI[temiz] || "00";
  }

  function musteriIdUret(tazeListe, sehir){
    var ilKodu = ilKoduBul(sehir);
    var maxNo = 0;
    var yeniDesen = new RegExp("^M" + ilKodu + "(\\d{3})$");
    tazeListe.forEach(function(m){
      var eslesme = m.id && m.id.match(yeniDesen);
      if(eslesme){
        var no = parseInt(eslesme[1], 10);
        if(no > maxNo) maxNo = no;
      }
    });
    return "M" + ilKodu + String(maxNo+1).padStart(3, "0");
  }

  function benzerMusterileriBul(ad){
    var q = (ad||"").trim().toLocaleLowerCase("tr-TR");
    if(!q) return [];
    return liste.filter(function(m){
      var mevcut = (m.ad||"").trim().toLocaleLowerCase("tr-TR");
      if(!mevcut) return false;
      return mevcut === q || mevcut.indexOf(q) >= 0 || q.indexOf(mevcut) >= 0;
    });
  }

  function yeniMusteriKaydet(bilgi, geriBildir){
    if(!bilgi.ad || !bilgi.ad.trim()){ geriBildir(false, "Müşteri adı girin."); return; }
    var yeniKayit = null;
    guvenliYaz(function(tazeListe){
      yeniKayit = {
        id: musteriIdUret(tazeListe, bilgi.sehir),
        ad: bilgi.ad.trim(),
        sehir: (bilgi.sehir||"").trim(),
        acikAdres: (bilgi.acikAdres||"").trim(),
        vade: (bilgi.vade||"").trim(),
        fatura: (bilgi.fatura||"").trim(),
        telefon: (bilgi.telefon||"").trim(),
        eposta: (bilgi.eposta||"").trim(),
        kargo: (bilgi.kargo||"").trim(),
        ziyaretGecmisi: [],
        iletisimler: [],
        faturaAdresleri: [],
        teslimatAdresleri: (bilgi.teslimatAdresi && bilgi.teslimatAdresi.trim())
          ? [{etiket:"Teslimat Adresi", adres: bilgi.teslimatAdresi.trim()}]
          : []
      };
      tazeListe.unshift(yeniKayit);
    }, function(basarili, err){
      geriBildir(basarili, basarili ? yeniKayit : err);
    });
  }

  function musteriGuncelle(musteriAd, guncelBilgi, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      // Ticari isim değişikliği burada YAPILMAZ — sipariş/rapor/görev
      // kayıtlarının da eşzamanlı taşınması gerekir (bkz.
      // ReportsData.kayitlariBirlestir); cari-kart-render.js bu ikisini
      // birlikte, doğru sırayla çağırır.
      if(guncelBilgi.ad !== undefined) tazeListe[idx].ad = guncelBilgi.ad;
      if(guncelBilgi.vade !== undefined) tazeListe[idx].vade = guncelBilgi.vade;
      if(guncelBilgi.fatura !== undefined) tazeListe[idx].fatura = guncelBilgi.fatura;
      if(guncelBilgi.kargo !== undefined) tazeListe[idx].kargo = guncelBilgi.kargo;
      if(guncelBilgi.sehir !== undefined) tazeListe[idx].sehir = guncelBilgi.sehir;
    }, geriBildir);
  }

  function musteriAdresEkle(musteriAd, tip, etiket, adres, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      var alan = tip==="fatura" ? "faturaAdresleri" : "teslimatAdresleri";
      if(!tazeListe[idx][alan]) tazeListe[idx][alan] = [];
      tazeListe[idx][alan].push({etiket: etiket || (tip==="fatura"?"Fatura Adresi":"Teslimat Adresi"), adres: adres});
    }, geriBildir);
  }

  function musteriAdresSil(musteriAd, tip, adresIdx, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      var alan = tip==="fatura" ? "faturaAdresleri" : "teslimatAdresleri";
      if(!tazeListe[idx][alan]) tazeListe[idx][alan] = [];
      tazeListe[idx][alan].splice(adresIdx, 1);
    }, geriBildir);
  }

  function musteriAdresGuncelle(musteriAd, tip, adresIdx, etiket, adres, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      var alan = tip==="fatura" ? "faturaAdresleri" : "teslimatAdresleri";
      if(!tazeListe[idx][alan] || !tazeListe[idx][alan][adresIdx]) throw new Error("Adres bulunamadı");
      tazeListe[idx][alan][adresIdx] = {etiket: etiket, adres: adres};
    }, geriBildir);
  }

  function yetkiliEkle(musteriAd, kisi, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      if(!tazeListe[idx].iletisimler) tazeListe[idx].iletisimler = [];
      tazeListe[idx].iletisimler.push(kisi);
    }, geriBildir);
  }

  function yetkiliSil(musteriAd, kisiIdx, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      if(!tazeListe[idx].iletisimler) tazeListe[idx].iletisimler = [];
      tazeListe[idx].iletisimler.splice(kisiIdx, 1);
    }, geriBildir);
  }

  function yetkiliGuncelle(musteriAd, kisiIdx, kisi, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      if(!tazeListe[idx].iletisimler || !tazeListe[idx].iletisimler[kisiIdx]) throw new Error("Kişi bulunamadı");
      tazeListe[idx].iletisimler[kisiIdx] = kisi;
    }, geriBildir);
  }

  // --- Sadeleştirilmiş "tek kayıt" modeli (yeni Cari Kart tasarımı) ---
  // Her müşterinin TEK fatura adresi, TEK teslimat adresi, TEK yetkilisi
  // ve opsiyonel TEK notu olur (liste değil). Var olan diziyi her zaman
  // tek elemanlı [obje] ile değiştirir; böylece eski çoklu-kayıt verisi
  // varsa bile ilk kayıt korunur, üzerine yazınca dizi sadeleşir.
  function musteriTekAdresKaydet(musteriAd, tip, adres, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      var alan = tip==="fatura" ? "faturaAdresleri" : "teslimatAdresleri";
      tazeListe[idx][alan] = [{etiket: tip==="fatura"?"Fatura Adresi":"Teslimat Adresi", adres: adres||""}];
    }, geriBildir);
  }

  function musteriTekAdresSil(musteriAd, tip, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      var alan = tip==="fatura" ? "faturaAdresleri" : "teslimatAdresleri";
      tazeListe[idx][alan] = [];
    }, geriBildir);
  }

  function musteriTekYetkiliKaydet(musteriAd, kisi, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      tazeListe[idx].iletisimler = [kisi];
    }, geriBildir);
  }

  function musteriTekYetkiliSil(musteriAd, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      tazeListe[idx].iletisimler = [];
    }, geriBildir);
  }

  function musteriNotKaydet(musteriAd, not, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      tazeListe[idx].not = not||"";
    }, geriBildir);
  }

  function musteriNotSil(musteriAd, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      tazeListe[idx].not = "";
    }, geriBildir);
  }

  // --- Çoklu NOT desteği (Cari Kart v4) ---
  // Her müşterinin birden fazla notu olabilir: notlar: [{baslik, metin}].
  // Geriye dönük uyumluluk için tazeListe[idx].not alanı HER ZAMAN
  // notlar dizisindeki tüm metinlerin birleşimiyle senkron tutulur —
  // send-render.js gibi eski tüketiciler hâlâ musteri.not okuyabilir.
  function notlarSenkronizeEt(kayit){
    var notlar = kayit.notlar || [];
    kayit.not = notlar.map(function(n){ return n.metin; }).filter(Boolean).join("\n");
  }

  function notEkle(musteriAd, not, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      if(!tazeListe[idx].notlar) tazeListe[idx].notlar = [];
      tazeListe[idx].notlar.push(not);
      notlarSenkronizeEt(tazeListe[idx]);
    }, geriBildir);
  }

  function notSil(musteriAd, notIdx, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      if(!tazeListe[idx].notlar) tazeListe[idx].notlar = [];
      tazeListe[idx].notlar.splice(notIdx, 1);
      notlarSenkronizeEt(tazeListe[idx]);
    }, geriBildir);
  }

  function notGuncelle(musteriAd, notIdx, not, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      if(!tazeListe[idx].notlar || !tazeListe[idx].notlar[notIdx]) throw new Error("Not bulunamadı");
      tazeListe[idx].notlar[notIdx] = not;
      notlarSenkronizeEt(tazeListe[idx]);
    }, geriBildir);
  }

  function musteriSil(musteriAd, geriBildir){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) throw new Error("Müşteri bulunamadı");
      tazeListe.splice(idx, 1);
    }, geriBildir);
  }

  // Eski uygulamanın musteriBirlestirOnayla() ile AYNI mantık: "diger"
  // müşterinin iletişim/ziyaret bilgileri "ana"ya taşınır, "diger" silinir.
  // Arşiv (sipariş/teklif/proforma/numune) ve görev taşıma AYRICA
  // ReportsData.kayitlariBirlestir() ile yapılır (bkz. reports-data.js) —
  // her koleksiyon kendi güvenli-yaz mekanizmasıyla, taze veri üzerinden.
  function musterileriBirlestir(anaAd, digerAd, geriBildir){
    var sonucBilgi = null;
    guvenliYaz(function(tazeListe){
      var anaIdx = musteriIndexBul(tazeListe, anaAd);
      var digerIdx = musteriIndexBul(tazeListe, digerAd);
      if(anaIdx===-1 || digerIdx===-1) throw new Error("Müşterilerden biri bulunamadı");
      var ana = tazeListe[anaIdx];
      var diger = tazeListe[digerIdx];
      if(!ana.id) ana.id = musteriIdUret(tazeListe, ana.sehir);

      var mevcutIsimler = (ana.iletisimler||[]).map(function(k){ return (k.isim||"").toLocaleLowerCase("tr-TR"); });
      (diger.iletisimler||[]).forEach(function(k){
        if(mevcutIsimler.indexOf((k.isim||"").toLocaleLowerCase("tr-TR"))===-1){
          if(!ana.iletisimler) ana.iletisimler = [];
          ana.iletisimler.push(k);
        }
      });

      if(diger.ziyaretGecmisi && diger.ziyaretGecmisi.length){
        if(!ana.ziyaretGecmisi) ana.ziyaretGecmisi = [];
        ana.ziyaretGecmisi = ana.ziyaretGecmisi.concat(diger.ziyaretGecmisi);
        ana.ziyaretGecmisi.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
        ana.sonZiyaret = ana.ziyaretGecmisi[0].ts;
        ana.sonZiyaretNot = ana.ziyaretGecmisi[0].not;
      }

      sonucBilgi = {anaAd: ana.ad, anaId: ana.id, digerAd: diger.ad, digerId: diger.id||null};
      // digerIdx, anaIdx'ten büyükse önce onu silmek indexleri bozmaz;
      // güvenli olmak için isimle tekrar bulup öyle çıkarıyoruz.
      var silinecekIdx = musteriIndexBul(tazeListe, digerAd);
      tazeListe.splice(silinecekIdx, 1);
    }, function(basarili, err){
      geriBildir(basarili, basarili ? sonucBilgi : err);
    });
  }

  // Bir müşteri kartı açıldığında çağrılır — eski uygulamayla aynı: arama
  // sonuçlarını "en son görüntülenen üstte" sıralayabilmek için.
  function sonGoruntulendi(musteriAd){
    guvenliYaz(function(tazeListe){
      var idx = musteriIndexBul(tazeListe, musteriAd);
      if(idx===-1) return;
      tazeListe[idx].sonGoruntuleme = Date.now();
    }, function(){});
  }

  return {
    baslat: baslat,
    listeDegistiginde: listeDegistiginde,
    ara: ara,
    sec: sec,
    seciliyiOku: seciliyiOku,
    uzunluk: function(){ return liste.length; },
    ziyaretHatirlatmalari: ziyaretHatirlatmalari,
    ziyaretEkle: ziyaretEkle,
    tumZiyaretTemaslar: tumZiyaretTemaslar,
    hatirlatmalarBugun: hatirlatmalarBugun,
    gunFarkiHesapla: gunFarkiHesapla,
    yeniMusteriKaydet: yeniMusteriKaydet,
    benzerMusterileriBul: benzerMusterileriBul,
    musteriGuncelle: musteriGuncelle,
    musteriBul: musteriBul,
    musteriAdresEkle: musteriAdresEkle,
    musteriAdresSil: musteriAdresSil,
    musteriAdresGuncelle: musteriAdresGuncelle,
    yetkiliEkle: yetkiliEkle,
    yetkiliSil: yetkiliSil,
    yetkiliGuncelle: yetkiliGuncelle,
    musteriTekAdresKaydet: musteriTekAdresKaydet,
    musteriTekAdresSil: musteriTekAdresSil,
    musteriTekYetkiliKaydet: musteriTekYetkiliKaydet,
    musteriTekYetkiliSil: musteriTekYetkiliSil,
    musteriNotKaydet: musteriNotKaydet,
    musteriNotSil: musteriNotSil,
    notEkle: notEkle,
    notSil: notSil,
    notGuncelle: notGuncelle,
    musteriSil: musteriSil,
    musterileriBirlestir: musterileriBirlestir,
    sonGoruntulendi: sonGoruntulendi
  };

})();

CustomerData.baslat();
