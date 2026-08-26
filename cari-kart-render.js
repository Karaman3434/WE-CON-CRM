/*
  cari-kart-render.js
  ====================
  Cari Kart sayfasının mantığı — yeni sadeleştirilmiş tasarım: TEK
  FATURA ADRESİ bloğu (müşteri adı+şehir+vade/fatura/kargo+yetkili+açık
  adres), TEK TESLİMAT ADRESİ bloğu (açık adres), TEK opsiyonel NOT
  bloğu — hepsi satır içi (popup değil) Düzenle/Kaydet/Sil ile yönetilir.
*/

function hataGoster(mesaj){
  console.error(mesaj);
  var kutu = document.createElement("div");
  kutu.textContent = "⚠️ " + mesaj;
  kutu.style.cssText = "position:fixed;top:8px;left:8px;right:8px;background:#c0392b;color:#fff;padding:10px;border-radius:8px;font-size:13px;z-index:99999;";
  document.body.appendChild(kutu);
  setTimeout(function(){ kutu.remove(); }, 8000);
}

function htmlEsc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

var seciliMusteriAdi = null;

function faturaBlokCiz(musteri){
  document.getElementById("ckMusteriAd").textContent = musteri.ad;
  document.getElementById("ckMusteriSehir").textContent = musteri.sehir || "";
  document.getElementById("ckVadeGoster").textContent = musteri.vade || "-";
  document.getElementById("ckFaturaTuruGoster").textContent = musteri.fatura || "-";
  document.getElementById("ckKargoGoster").textContent = musteri.kargo || "-";

  var yetkili = (musteri.iletisimler && musteri.iletisimler[0]) || null;
  if(yetkili && yetkili.isim){
    document.getElementById("ckYetkiliIsimGoster").textContent = "👤 " + yetkili.isim + (yetkili.gorev ? " (" + yetkili.gorev + ")" : "");
    var detaylar = [yetkili.telefon, yetkili.eposta].filter(Boolean).join(" · ");
    document.getElementById("ckYetkiliDetayGoster").textContent = detaylar;
  } else {
    document.getElementById("ckYetkiliIsimGoster").textContent = "👤 Yetkili eklenmedi";
    document.getElementById("ckYetkiliDetayGoster").textContent = "";
  }

  var faturaAdr = (musteri.faturaAdresleri && musteri.faturaAdresleri[0]) ? musteri.faturaAdresleri[0].adres : "";
  document.getElementById("ckFaturaAdresGoster").textContent = faturaAdr || "Adres eklenmedi.";

  // Düzenle formunun alanlarını da güncel tut (Düzenle'ye her basıldığında taze değer görünsün)
  document.getElementById("ckVadeInput").value = musteri.vade || "";
  document.getElementById("ckFaturaTuruInput").value = musteri.fatura || "";
  document.getElementById("ckKargoInput").value = musteri.kargo || "";
  document.getElementById("ckYetkiliIsimInput").value = yetkili ? (yetkili.isim||"") : "";
  document.getElementById("ckYetkiliGorevInput").value = yetkili ? (yetkili.gorev||"") : "";
  document.getElementById("ckYetkiliTelInput").value = yetkili ? (yetkili.telefon||"") : "";
  document.getElementById("ckYetkiliEpostaInput").value = yetkili ? (yetkili.eposta||"") : "";
  document.getElementById("ckFaturaAdresInput").value = faturaAdr;
}

function faturaDuzenleModunaGec(acikMi){
  document.getElementById("ckFaturaGoruntule").hidden = acikMi;
  document.getElementById("ckFaturaDuzenle").hidden = !acikMi;
  document.getElementById("btnFaturaDuzenle").hidden = acikMi;
  document.getElementById("btnFaturaKaydet").hidden = !acikMi;
}

function faturaKaydetTiklandi(){
  var guncelBilgi = {
    vade: document.getElementById("ckVadeInput").value.trim(),
    fatura: document.getElementById("ckFaturaTuruInput").value.trim(),
    kargo: document.getElementById("ckKargoInput").value.trim()
  };
  var yetkiliIsim = document.getElementById("ckYetkiliIsimInput").value.trim();
  var adres = document.getElementById("ckFaturaAdresInput").value.trim();
  var btn = document.getElementById("btnFaturaKaydet");
  btn.disabled = true;
  btn.textContent = "Kaydediliyor...";

  CustomerData.musteriGuncelle(seciliMusteriAdi, guncelBilgi, function(basarili1, err1){
    if(!basarili1){
      btn.disabled = false; btn.textContent = "✓ Kaydet";
      hataGoster("Kaydedilemedi: " + (err1 && err1.message ? err1.message : "bilinmeyen hata"));
      return;
    }
    var sonrakiAdim = function(){
      CustomerData.musteriTekAdresKaydet(seciliMusteriAdi, "fatura", adres, function(basarili3, err3){
        btn.disabled = false; btn.textContent = "✓ Kaydet";
        if(basarili3) faturaDuzenleModunaGec(false);
        else hataGoster("Adres kaydedilemedi: " + (err3 && err3.message ? err3.message : "bilinmeyen hata"));
      });
    };
    if(yetkiliIsim){
      var kisi = {
        isim: yetkiliIsim,
        gorev: document.getElementById("ckYetkiliGorevInput").value.trim(),
        telefon: document.getElementById("ckYetkiliTelInput").value.trim(),
        eposta: document.getElementById("ckYetkiliEpostaInput").value.trim()
      };
      CustomerData.musteriTekYetkiliKaydet(seciliMusteriAdi, kisi, function(basarili2, err2){
        if(!basarili2){
          btn.disabled = false; btn.textContent = "✓ Kaydet";
          hataGoster("Yetkili kaydedilemedi: " + (err2 && err2.message ? err2.message : "bilinmeyen hata"));
          return;
        }
        sonrakiAdim();
      });
    } else {
      sonrakiAdim();
    }
  });
}

function teslimatBlokCiz(musteri){
  var adr = (musteri.teslimatAdresleri && musteri.teslimatAdresleri[0]) ? musteri.teslimatAdresleri[0].adres : "";
  document.getElementById("ckTeslimatGoster").textContent = adr || "Adres eklenmedi.";
  document.getElementById("ckTeslimatInput").value = adr;
}

function teslimatDuzenleModunaGec(acikMi){
  document.getElementById("ckTeslimatGoster").hidden = acikMi;
  document.getElementById("ckTeslimatInput").hidden = !acikMi;
  document.getElementById("btnTeslimatDuzenle").hidden = acikMi;
  document.getElementById("btnTeslimatKaydet").hidden = !acikMi;
}

function notBlokCiz(musteri){
  var not = musteri.not || "";
  document.getElementById("ckNotGoster").textContent = not || "Not eklenmedi.";
  document.getElementById("ckNotInput").value = not;
}

function notDuzenleModunaGec(acikMi){
  document.getElementById("ckNotGoster").hidden = acikMi;
  document.getElementById("ckNotInput").hidden = !acikMi;
  document.getElementById("btnNotDuzenle").hidden = acikMi;
  document.getElementById("btnNotKaydet").hidden = !acikMi;
}

function islemeDevamAkisiniKur(){
  var akistanGeldiMi = localStorage.getItem("weiconv2_islem_yap_akisi") === "1";
  var btn = document.getElementById("btnIslemeDevam");
  if(!akistanGeldiMi){ btn.hidden = true; return; }
  btn.hidden = false;
  btn.onclick = function(){
    document.getElementById("tipSecimOverlay").hidden = false;
  };
  document.getElementById("btnTipSecimVazgec").onclick = function(){
    document.getElementById("tipSecimOverlay").hidden = true;
  };
  document.getElementById("tipSecimOverlay").querySelectorAll(".tip-btn").forEach(function(btn2){
    btn2.onclick = function(){
      localStorage.setItem("weiconv2_onceden_secilen_tip", this.getAttribute("data-tip"));
      localStorage.removeItem("weiconv2_islem_yap_akisi");
      window.location.href = "product.html";
    };
  });
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  var secili = CustomerData.seciliyiOku();
  if(!secili){
    hataGoster("Müşteri seçilmemiş, listeye dönülüyor.");
    setTimeout(function(){ window.location.href = "customer.html"; }, 1500);
    return;
  }
  seciliMusteriAdi = secili.ad;

  function tazeVeriyiCiz(musteri){
    faturaBlokCiz(musteri);
    teslimatBlokCiz(musteri);
    notBlokCiz(musteri);
  }
  tazeVeriyiCiz(secili);

  // --- FATURA bloğu ---
  document.getElementById("btnFaturaDuzenle").onclick = function(){ faturaDuzenleModunaGec(true); };
  document.getElementById("btnFaturaKaydet").onclick = faturaKaydetTiklandi;
  document.getElementById("btnFaturaSil").onclick = function(){
    if(!confirm("Fatura adresi ve yetkili bilgisi silinsin mi? (Vade/Fatura/Kargo ayarları kalır.)")) return;
    CustomerData.musteriTekAdresSil(seciliMusteriAdi, "fatura", function(b1, e1){
      if(!b1){ hataGoster("Silinemedi: " + (e1&&e1.message?e1.message:"bilinmeyen hata")); return; }
      CustomerData.musteriTekYetkiliSil(seciliMusteriAdi, function(b2, e2){
        if(!b2) hataGoster("Yetkili silinemedi: " + (e2&&e2.message?e2.message:"bilinmeyen hata"));
      });
    });
  };

  // --- TESLİMAT bloğu ---
  document.getElementById("btnTeslimatDuzenle").onclick = function(){ teslimatDuzenleModunaGec(true); };
  document.getElementById("btnTeslimatKaydet").onclick = function(){
    var adres = document.getElementById("ckTeslimatInput").value.trim();
    var btn = document.getElementById("btnTeslimatKaydet");
    btn.disabled = true; btn.textContent = "Kaydediliyor...";
    CustomerData.musteriTekAdresKaydet(seciliMusteriAdi, "teslimat", adres, function(basarili, err){
      btn.disabled = false; btn.textContent = "✓ Kaydet";
      if(basarili) teslimatDuzenleModunaGec(false);
      else hataGoster("Kaydedilemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
    });
  };
  document.getElementById("btnTeslimatSil").onclick = function(){
    if(!confirm("Teslimat adresi silinsin mi?")) return;
    CustomerData.musteriTekAdresSil(seciliMusteriAdi, "teslimat", function(basarili, err){
      if(!basarili) hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
    });
  };

  // --- NOT bloğu ---
  document.getElementById("btnNotDuzenle").onclick = function(){ notDuzenleModunaGec(true); };
  document.getElementById("btnNotKaydet").onclick = function(){
    var not = document.getElementById("ckNotInput").value.trim();
    var btn = document.getElementById("btnNotKaydet");
    btn.disabled = true; btn.textContent = "Kaydediliyor...";
    CustomerData.musteriNotKaydet(seciliMusteriAdi, not, function(basarili, err){
      btn.disabled = false; btn.textContent = "✓ Kaydet";
      if(basarili) notDuzenleModunaGec(false);
      else hataGoster("Kaydedilemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
    });
  };
  document.getElementById("btnNotSil").onclick = function(){
    if(!confirm("Not silinsin mi?")) return;
    CustomerData.musteriNotSil(seciliMusteriAdi, function(basarili, err){
      if(!basarili) hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
    });
  };

  islemeDevamAkisiniKur();

  ["cariKapatBtn","cariGeriOk"].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener("click", function(){ localStorage.removeItem("weiconv2_islem_yap_akisi"); });
  });

  CustomerData.listeDegistiginde(function(){
    var taze = CustomerData.musteriBul(seciliMusteriAdi);
    if(taze) tazeVeriyiCiz(taze);
  });
});
