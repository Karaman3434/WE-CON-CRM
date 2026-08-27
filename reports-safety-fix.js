/* WE-CON-CRM — reports safety layer
   HATA-004: Replaces stale read -> set writes with Realtime Database transactions.
   Loaded AFTER reports-data.js so existing UI/data contracts remain unchanged.
*/
(function(){
  if(typeof ReportsData === 'undefined' || typeof firebase === 'undefined') return;

  function normalizeList(value){
    return value ? (Array.isArray(value) ? value.filter(Boolean) : Object.values(value)) : [];
  }

  function transactionList(path, mutate, done){
    try{
      var ref = firebase.database().ref(path);
      return ref.transaction(function(currentData){
        var list = normalizeList(currentData);
        var result = mutate(list);
        if(result === false) return;
        return list;
      }).then(function(result){
        if(!result.committed){
          if(done) done(false, 'İşlem commit edilmedi.');
          return false;
        }
        if(done) done(true);
        return true;
      }).catch(function(err){
        console.error('WE-CON-CRM transaction hatası:', path, err);
        if(done) done(false, err);
        return false;
      });
    }catch(e){
      console.error('WE-CON-CRM transaction başlatma hatası:', path, e);
      if(done) done(false, e);
      return Promise.resolve(false);
    }
  }

  ReportsData.gorevEkle = function(musteriAd, aciklama, tarih, saat){
    var yeni = {
      id: 'gorev_' + Date.now() + '_' + Math.floor(Math.random()*10000),
      musteriAd: musteriAd,
      aciklama: aciklama,
      tarih: tarih,
      saat: saat,
      tamamlandi: false,
      tamamlanmaZamani: null,
      olusturmaZamani: Date.now()
    };
    return transactionList('gorevler', function(list){ list.push(yeni); return true; });
  };

  ReportsData.gorevTamamlandiToggle = function(id){
    return transactionList('gorevler', function(list){
      var g = list.find(function(x){ return x.id === id; });
      if(!g) return false;
      g.tamamlandi = !g.tamamlandi;
      g.tamamlanmaZamani = g.tamamlandi ? Date.now() : null;
      return true;
    });
  };

  ReportsData.kaydiKacanIsaretle = function(tip, ts, sebep, rakip, geriBildir){
    return transactionList('arsiv/' + tip, function(list){
      var idx = list.findIndex(function(k){ return k.ts === ts; });
      if(idx === -1){ if(geriBildir) geriBildir(false, 'Kayıt bulunamadı'); return false; }
      list[idx].durum = 'kacan';
      list[idx].kacanSebep = sebep || '';
      list[idx].kacanRakip = rakip || '';
      return true;
    }, geriBildir);
  };

  ReportsData.kaydiSil = function(tip, ts, geriBildir){
    return transactionList('arsiv/' + tip, function(list){
      var yeni = list.filter(function(k){ return k.ts !== ts; });
      if(yeni.length === list.length){ if(geriBildir) geriBildir(false, 'Kayıt bulunamadı'); return false; }
      list.splice(0, list.length);
      Array.prototype.push.apply(list, yeni);
      return true;
    }, geriBildir);
  };

  ReportsData.kaydiGuncelle = function(tip, ts, yeniUrunler, geriBildir){
    return transactionList('arsiv/' + tip, function(list){
      var idx = list.findIndex(function(k){ return k.ts === ts; });
      if(idx === -1){ if(geriBildir) geriBildir(false, 'Kayıt bulunamadı'); return false; }
      list[idx].urunler = yeniUrunler;
      list[idx].revizeZamani = Date.now();
      return true;
    }, geriBildir);
  };

  ReportsData.kayitlariBirlestir = function(digerAd, digerId, anaAd, anaId, geriBildir){
    var tipler = ['siparis','teklif','proforma','numune'];
    var i = 0;

    function sonraki(){
      if(i >= tipler.length){
        return transactionList('gorevler', function(list){
          var degisti = false;
          list.forEach(function(g){
            if(g.musteriAd === digerAd || (digerId && g.musteriId === digerId)){
              g.musteriAd = anaAd;
              if(digerId || g.musteriId) g.musteriId = anaId;
              degisti = true;
            }
          });
          return degisti ? true : false;
        }, geriBildir);
      }
      var tip = tipler[i++];
      return transactionList('arsiv/' + tip, function(list){
        var degisti = false;
        list.forEach(function(k){
          var eslesme = (digerId && k.musteriId) ? k.musteriId === digerId : k.musteri === digerAd;
          if(eslesme){
            k.musteri = anaAd;
            k.musteriId = anaId;
            degisti = true;
          }
        });
        return degisti ? true : false;
      }).then(sonraki);
    }

    return sonraki();
  };
})();
