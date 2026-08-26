/*
  cari-kart-render.js
  ====================
  Cari Kart — dört blok (Fatura Adresi, Yetkili Kişi, Teslimat Adresi,
  Not). Alanlar HER ZAMAN doğrudan düzenlenebilir; gizle/göster geçişi
  yok, bu yüzden "hidden CSS çakışması" hata sınıfı burada oluşamaz.
  Kaydet basılmadan hiçbir değişiklik kalıcı olmaz.
*/

function hataGoster(mesaj){
  console.error(mesaj);
  var kutu = document.createElement("div");
  kutu.textContent = "⚠️ " + mesaj;
  kutu.style.cssText = "position:fixed;top:8px;left:8px;right:8px;background:#c0392b;color:#fff;padding:10px;border-radius:8px;font-size:13px;z-index:99999;";
  document.body.appendChild(kutu);
  setTimeout(function(){ kutu.remove(); }, 8000);
}

var seciliMusteriAdi = null;

function alanlariDoldur(musteri){
  document.getElementById("cariKartAd").textContent = musteri.ad;
  var altBaslikParcalar = [];
  if(musteri.id) altBaslikParcalar.push("🏷 " + musteri.id);
  if(musteri.sehir) altBaslikParcalar.push(musteri.sehir);
  document.getElementById("cariKartAltBaslik").textContent = altBaslikParcalar.join(" · ");

  document.getElementById("ckVadeInput").value = musteri.vade || "";
  document.getElementById("ckFaturaTuruInput").value = musteri.fatura || "";
  document.getElementById("ckKargoInput").value = musteri.kargo || "";
  var faturaAdr = (musteri.faturaAdresleri && musteri.faturaAdresleri[0]) ? musteri.faturaAdresleri[0].adres : "";
  document.getElementById("ckFaturaAdresInput").value = faturaAdr;

  var yetkili = (musteri.iletisimler && musteri.iletisimler[0]) || {};
  document.getElementById("ckYetkiliIsimInput").value = yetkili.isim || "";
  document.getElementById("ckYetkiliGorevInput").value = yetkili.gorev || "";
  document.getElementById("ckYetkiliTelInput").value = yetkili.telefon || "";
  document.getElementById("ckYetkiliEpostaInput").value = yetkili.eposta || "";

  var teslimatAdr = (musteri.teslimatAdresleri && musteri.teslimatAdresleri[0]) ? musteri.teslimatAdresleri[0].adres : "";
  document.getElementById("ckTeslimatInput").value = teslimatAdr;

  document.getElementById("ckNotInput").value = musteri.not || "";
}

function kaydetButonuBagla(btnId, isFn){
  var btn = document.getElementById(btnId);
  btn.onclick = function(){
    var eskiMetin = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";
    isFn(function(basarili, err){
      btn.disabled = false;
      btn.textContent = eskiMetin;
      if(!basarili) hataGoster("Kaydedilemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
    });
  };
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
  alanlariDoldur(secili);

  // "Düzenle" tuşları — hiçbir şeyi göstermez/gizlemez, sadece o bloğun
  // ilk alanına odaklanıp klavyeyi açar (alanlar zaten her zaman yazılabilir).
  document.querySelectorAll(".ck-duzenle-btn[data-odak]").forEach(function(btn){
    btn.onclick = function(){
      var el = document.getElementById(this.getAttribute("data-odak"));
      if(el){ el.focus(); if(el.select) el.select(); }
    };
  });

  // --- FATURA ADRESİ Kaydet ---
  kaydetButonuBagla("btnFaturaKaydet", function(geriBildir){
    var guncelBilgi = {
      vade: document.getElementById("ckVadeInput").value.trim(),
      fatura: document.getElementById("ckFaturaTuruInput").value.trim(),
      kargo: document.getElementById("ckKargoInput").value.trim()
    };
    var adres = document.getElementById("ckFaturaAdresInput").value.trim();
    CustomerData.musteriGuncelle(seciliMusteriAdi, guncelBilgi, function(b1, e1){
      if(!b1){ geriBildir(false, e1); return; }
      CustomerData.musteriTekAdresKaydet(seciliMusteriAdi, "fatura", adres, geriBildir);
    });
  });
  document.getElementById("btnFaturaSil").onclick = function(){
    if(!confirm("Fatura adresi silinsin mi? (Vade/Fatura/Kargo ayarları kalır.)")) return;
    document.getElementById("ckFaturaAdresInput").value = "";
    CustomerData.musteriTekAdresSil(seciliMusteriAdi, "fatura", function(basarili, err){
      if(!basarili) hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
    });
  };

  // --- YETKİLİ KİŞİ Kaydet ---
  kaydetButonuBagla("btnYetkiliKaydet", function(geriBildir){
    var isim = document.getElementById("ckYetkiliIsimInput").value.trim();
    if(!isim){ geriBildir(false, {message:"Yetkili ismi boş olamaz."}); return; }
    var kisi = {
      isim: isim,
      gorev: document.getElementById("ckYetkiliGorevInput").value.trim(),
      telefon: document.getElementById("ckYetkiliTelInput").value.trim(),
      eposta: document.getElementById("ckYetkiliEpostaInput").value.trim()
    };
    CustomerData.musteriTekYetkiliKaydet(seciliMusteriAdi, kisi, geriBildir);
  });
  document.getElementById("btnYetkiliSil").onclick = function(){
    if(!confirm("Yetkili kişi silinsin mi?")) return;
    ["ckYetkiliIsimInput","ckYetkiliGorevInput","ckYetkiliTelInput","ckYetkiliEpostaInput"].forEach(function(id){
      document.getElementById(id).value = "";
    });
    CustomerData.musteriTekYetkiliSil(seciliMusteriAdi, function(basarili, err){
      if(!basarili) hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
    });
  };

  // --- TESLİMAT ADRESİ Kaydet ---
  kaydetButonuBagla("btnTeslimatKaydet", function(geriBildir){
    var adres = document.getElementById("ckTeslimatInput").value.trim();
    CustomerData.musteriTekAdresKaydet(seciliMusteriAdi, "teslimat", adres, geriBildir);
  });
  document.getElementById("btnTeslimatSil").onclick = function(){
    if(!confirm("Teslimat adresi silinsin mi?")) return;
    document.getElementById("ckTeslimatInput").value = "";
    CustomerData.musteriTekAdresSil(seciliMusteriAdi, "teslimat", function(basarili, err){
      if(!basarili) hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
    });
  };

  // --- NOT Kaydet ---
  kaydetButonuBagla("btnNotKaydet", function(geriBildir){
    var not = document.getElementById("ckNotInput").value.trim();
    CustomerData.musteriNotKaydet(seciliMusteriAdi, not, geriBildir);
  });
  document.getElementById("btnNotSil").onclick = function(){
    if(!confirm("Not silinsin mi?")) return;
    document.getElementById("ckNotInput").value = "";
    CustomerData.musteriNotSil(seciliMusteriAdi, function(basarili, err){
      if(!basarili) hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
    });
  };

  // --- İşlem Yap akışı (değişmedi) ---
  var akistanGeldiMi = localStorage.getItem("weiconv2_islem_yap_akisi") === "1";
  var islemeDevamBtn = document.getElementById("btnIslemeDevam");
  if(akistanGeldiMi){
    islemeDevamBtn.hidden = false;
    islemeDevamBtn.onclick = function(){ document.getElementById("tipSecimOverlay").hidden = false; };
    document.getElementById("btnTipSecimVazgec").onclick = function(){ document.getElementById("tipSecimOverlay").hidden = true; };
    document.getElementById("tipSecimOverlay").querySelectorAll(".tip-btn").forEach(function(btn2){
      btn2.onclick = function(){
        localStorage.setItem("weiconv2_onceden_secilen_tip", this.getAttribute("data-tip"));
        localStorage.removeItem("weiconv2_islem_yap_akisi");
        window.location.href = "product.html";
      };
    });
  }

  ["cariKapatBtn","cariGeriOk"].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener("click", function(){ localStorage.removeItem("weiconv2_islem_yap_akisi"); });
  });

  // Firebase'den taze veri gelince alanları güncelle — kullanıcı o an bir
  // alanı yazıyorsa (odaktaysa) o ALANA dokunmadan diğerlerini tazeler,
  // yazdığı yarım veri üzerine yazılıp kaybolmasın diye.
  CustomerData.listeDegistiginde(function(){
    var taze = CustomerData.musteriBul(seciliMusteriAdi);
    if(!taze) return;
    var aktifId = document.activeElement ? document.activeElement.id : null;
    var tumInputlar = ["ckVadeInput","ckFaturaTuruInput","ckKargoInput","ckFaturaAdresInput","ckYetkiliIsimInput","ckYetkiliGorevInput","ckYetkiliTelInput","ckYetkiliEpostaInput","ckTeslimatInput","ckNotInput"];
    if(tumInputlar.indexOf(aktifId) !== -1) return; // yazarken üzerine yazma
    alanlariDoldur(taze);
  });
});
