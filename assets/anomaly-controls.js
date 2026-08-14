// WE-CON-CRM — Anomaly / commercial sanity controls
// Extracted from the main application script without changing the existing global API.

// ============================================================
// ANOMALİ KONTROLÜ — Gönder'e basmadan önce kural tabanlı, anında,
// internetsiz kontrol: aşırı iskonto, zararına satış, son 7 günde
// aynı müşteriye aynı ürün tekrarı, alışılmadık yüksek adet.
// ============================================================
function hareketAnomaliKontrolEt(){
  var uyarilar = [];
  var musteriAdi = (seciliMusteri && seciliMusteri.ad) ? seciliMusteri.ad : "";
  var simdi = Date.now();
  var yediGun = 7*24*60*60*1000;
  var arsiv = lsGet("weicon_arsiv", {});

  for(var i=0;i<hareketListesi.length;i++){
    var item = hareketListesi[i];

    if(item.iskonto && item.iskonto > 50){
      uyarilar.push("⚠️ <b>"+item.name+"</b> için iskonto %"+item.iskonto+" — çok yüksek görünüyor.");
    }

    if(item.dipFiyat && item.iskBirim!==undefined && item.iskBirim < item.dipFiyat){
      uyarilar.push("🔴 <b>"+item.name+"</b> dip maliyetin ("+fmt(item.dipFiyat)+" €) altında satılıyor (net: "+fmt(item.iskBirim)+" €) — zararına satış olabilir.");
    }

    if(musteriAdi){
      var tekrarVar = false;
      ["numune","teklif","proforma","siparis"].forEach(function(tip){
        var liste = arsiv[tip] || [];
        for(var j=0;j<liste.length;j++){
          var k = liste[j];
          if(!k.musteri || k.musteri.toLocaleLowerCase("tr-TR")!==musteriAdi.toLocaleLowerCase("tr-TR")) continue;
          if((simdi - (k.ts||0)) > yediGun) continue;
          (k.urunler||[]).forEach(function(u){
            if(u.berta===item.berta && u.abas===item.abas) tekrarVar = true;
          });
        }
      });
      if(tekrarVar){
        uyarilar.push("🔁 <b>"+item.name+"</b> bu müşteriye son 7 gün içinde zaten satılmış/teklif edilmiş — mükerrer olabilir.");
      }
    }

    if(item.adet && item.adet > 100){
      uyarilar.push("📦 <b>"+item.name+"</b> için adet ("+item.adet+") alışılmadık derecede yüksek — kontrol edin.");
    }
  }
  return uyarilar;
}

var anomaliUyariKaynagi = null; // 'gonder' | 'kaydet' — "Yine de..." tuşuna basınca doğru akışa devam etmek için
function anomaliUyariPopupGoster(uyarilar, kaynak){
  anomaliUyariKaynagi = kaynak || 'gonder';
  var liste = "";
  for(var i=0;i<uyarilar.length;i++){
    liste += "<div style='background:#fff3cd;border:2px solid #f2994a;border-radius:8px;padding:14px 16px;margin-bottom:10px;font-size:24px;color:#7a5210;font-weight:700;line-height:1.4;'>"+uyarilar[i]+"</div>";
  }
  document.getElementById("anomaliUyariIcerik").innerHTML = liste;
  var btn = document.getElementById("anomaliYineDeBtn");
  if(btn) btn.textContent = (anomaliUyariKaynagi==='kaydet') ? "Yine de Kaydet" : "Yine de Gönder";
  document.getElementById("anomaliUyariModal").style.display = "flex";
}

function anomaliUyariGormezdenGel(){
  document.getElementById("anomaliUyariModal").style.display = "none";
  if(anomaliUyariKaynagi==='kaydet'){
    kaydetOnayPopupAc();
  } else {
    document.getElementById("fiyatGorunumuModal").style.display = "flex";
  }
  anomaliUyariKaynagi = null;
}

function anomaliUyariGeriDon(){
  document.getElementById("anomaliUyariModal").style.display = "none";
}

function anomaliUyariKapat(){
  document.getElementById("anomaliUyariModal").style.display = "none";
  anomaliUyariKaynagi = null;
}
