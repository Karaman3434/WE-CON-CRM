/*
  cari-kart-render.js
  ====================
  Cari Kart v4 — dört blok (Fatura Adresi, Yetkili Kişi, Teslimat Adresi,
  Not), her biri ÇOKLU KAYIT destekler. Her blok bir kart listesi + tek
  bir "Yönet" butonu gösterir. Yönet → Düzenle/Sil seçimi → (birden
  fazla kayıt varsa) "hangisi?" seçici → form / silme onayı.
  Sayfa altındaki "Yeni Bilgi Ekle" butonu 4 kategoriden birini
  seçtirip aynı formu "ekle" modunda açar.
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
var musteriVerisi = null;

var TIP_META = {
  fatura:   {baslik:"Fatura Adresi",   tekil:"fatura adresi",   ikon:"🧾"},
  teslimat: {baslik:"Teslimat Adresi", tekil:"teslimat adresi", ikon:"🚚"},
  yetkili:  {baslik:"Yetkili Kişi",    tekil:"yetkili kişi",    ikon:"👤"},
  not:      {baslik:"Not",             tekil:"not",             ikon:"📝"}
};

var aktifTip = null, aktifEylem = null, aktifIndex = null;
var silTip = null, silIndex = null;

function escapeText(s){ var d = document.createElement("div"); d.textContent = s||""; return d.innerHTML; }

function kayitlariGetir(musteri, tip){
  if(tip === "fatura") return musteri.faturaAdresleri || [];
  if(tip === "teslimat") return musteri.teslimatAdresleri || [];
  if(tip === "yetkili") return musteri.iletisimler || [];
  // not: yeni "notlar" dizisi varsa onu kullan; yoksa eski tekil "not"
  // alanını tek elemanlı liste gibi göster (veri kaybı olmasın diye).
  if(musteri.notlar && musteri.notlar.length) return musteri.notlar;
  if(musteri.not && musteri.not.trim()) return [{baslik:"Not", metin: musteri.not.trim()}];
  return [];
}

function kayitBaslik(tip, kayit){
  if(tip === "yetkili") return kayit.isim || "(isimsiz)";
  if(tip === "not") return kayit.baslik || "Not";
  return kayit.etiket || TIP_META[tip].baslik;
}
function kayitAltMetin(tip, kayit){
  if(tip === "yetkili") return [kayit.gorev, kayit.telefon, kayit.eposta].filter(Boolean).join(" · ");
  if(tip === "not") return kayit.metin || "";
  return kayit.adres || "";
}

function listeleriRenderEt(){
  var m = musteriVerisi;
  ["fatura","teslimat","yetkili","not"].forEach(function(tip){
    var liste = kayitlariGetir(m, tip);
    var kapsayici = document.getElementById(tip + "Listesi");
    document.getElementById(tip + "Sayac").textContent = liste.length;
    if(liste.length === 0){
      kapsayici.innerHTML = "<div class='ck-kart-bos'>Henüz " + TIP_META[tip].tekil + " eklenmemiş.</div>";
      return;
    }
    kapsayici.innerHTML = liste.map(function(k){
      return "<div class='ck-kart'><div class='ck-kart-ust'>" + escapeText(kayitBaslik(tip,k)) + "</div><div class='ck-kart-alt'>" + escapeText(kayitAltMetin(tip,k)) + "</div></div>";
    }).join("");
  });
}

function alanlariDoldur(musteri){
  musteriVerisi = musteri;
  document.getElementById("cariKartAd").textContent = musteri.ad;
  var altBaslikParcalar = [];
  if(musteri.id) altBaslikParcalar.push("🏷 " + musteri.id);
  if(musteri.sehir) altBaslikParcalar.push(musteri.sehir);
  document.getElementById("cariKartAltBaslik").textContent = altBaslikParcalar.join(" · ");

  document.getElementById("ckVadeInput").value = musteri.vade || "";
  document.getElementById("ckFaturaTuruInput").value = musteri.fatura || "";
  document.getElementById("ckKargoInput").value = musteri.kargo || "";

  listeleriRenderEt();
}

var toastZamanlayici;
function toastGoster(msg){
  var t = document.getElementById("ckToast");
  t.textContent = msg;
  t.classList.add("gorunur");
  clearTimeout(toastZamanlayici);
  toastZamanlayici = setTimeout(function(){ t.classList.remove("gorunur"); }, 1800);
}

function ac(id){ document.getElementById(id).hidden = false; }
function kapat(id){ document.getElementById(id).hidden = true; }

// ---- "Yönet" (bölüm bazlı) ----
function yonetAc(tip){
  aktifTip = tip;
  document.getElementById("yonetBaslik").textContent = TIP_META[tip].ikon + " " + TIP_META[tip].baslik + " — Yönet";
  ac("yonetOverlay");
}

function pickerAc(eylem){
  kapat("yonetOverlay");
  aktifEylem = eylem;
  var liste = kayitlariGetir(musteriVerisi, aktifTip);
  if(liste.length === 0){ toastGoster("Henüz kayıtlı " + TIP_META[aktifTip].tekil + " yok."); return; }
  if(liste.length === 1){
    if(eylem === "duzenle") formAc(aktifTip, "duzenle", 0);
    else silSor(aktifTip, 0);
    return;
  }
  document.getElementById("pickerBaslik").textContent = (eylem==="duzenle" ? "✏️ Hangisini düzenlemek istiyorsun?" : "🗑️ Hangisini silmek istiyorsun?");
  document.getElementById("pickerAlt").textContent = TIP_META[aktifTip].baslik + " — bir kayıt seç";
  document.getElementById("pickerListesi").innerHTML = liste.map(function(k,i){
    return "<button class='picker-item' data-idx='" + i + "'><div class='ust'>" + escapeText(kayitBaslik(aktifTip,k)) + "</div><div class='alt'>" + escapeText(kayitAltMetin(aktifTip,k)) + "</div></button>";
  }).join("");
  document.getElementById("pickerListesi").querySelectorAll(".picker-item").forEach(function(btn){
    btn.onclick = function(){
      var i = parseInt(this.getAttribute("data-idx"), 10);
      kapat("pickerOverlay");
      if(aktifEylem === "duzenle") formAc(aktifTip, "duzenle", i);
      else silSor(aktifTip, i);
    };
  });
  ac("pickerOverlay");
}

function silSor(tip, i){
  silTip = tip; silIndex = i;
  var kayit = kayitlariGetir(musteriVerisi, tip)[i];
  document.getElementById("silOnayMetin").textContent = "\"" + kayitBaslik(tip, kayit) + "\" kalıcı olarak silinecek.";
  ac("silOnayOverlay");
}

function silOnayla(){
  var btn = document.getElementById("silOnaylaBtn");
  btn.disabled = true;
  function tamamla(basarili, err){
    btn.disabled = false;
    if(!basarili){ hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata")); return; }
    kapat("silOnayOverlay");
    toastGoster("Silindi.");
  }
  if(silTip === "fatura" || silTip === "teslimat"){
    CustomerData.musteriAdresSil(seciliMusteriAdi, silTip, silIndex, tamamla);
  } else if(silTip === "yetkili"){
    CustomerData.yetkiliSil(seciliMusteriAdi, silIndex, tamamla);
  } else if(silTip === "not"){
    if(musteriVerisi.notlar && musteriVerisi.notlar.length){
      CustomerData.notSil(seciliMusteriAdi, silIndex, tamamla);
    } else {
      // eski tekil "not" alanından geliyor — legacy silme fonksiyonuyla temizle
      CustomerData.musteriNotSil(seciliMusteriAdi, tamamla);
    }
  }
}

// ---- Ekle / Düzenle formu ----
function formAlanlariHtml(tip){
  if(tip === "fatura" || tip === "teslimat"){
    return "<div class='form-etiket'>ETİKET (ör. Merkez Ofis, Depo)</div><input class='form-input' id='fBaslik' placeholder='Etiket'>"
      + "<div class='form-etiket'>AÇIK ADRES</div><textarea class='form-textarea' id='fDetay' rows='3' placeholder='Açık adres'></textarea>";
  }
  if(tip === "yetkili"){
    return "<div class='form-satir-2'>"
      + "<div><div class='form-etiket'>İSİM SOYİSİM</div><input class='form-input' id='fIsim' placeholder='İsim Soyisim'></div>"
      + "<div><div class='form-etiket'>GÖREV</div><input class='form-input' id='fGorev' placeholder='Görev'></div>"
      + "</div><div class='form-satir-2' style='margin-top:10px'>"
      + "<div><div class='form-etiket'>TELEFON</div><input class='form-input' id='fTel' placeholder='Telefon' type='tel'></div>"
      + "<div><div class='form-etiket'>E-POSTA</div><input class='form-input' id='fEposta' placeholder='E-posta' type='email'></div>"
      + "</div>";
  }
  return "<div class='form-etiket'>BAŞLIK</div><input class='form-input' id='fBaslik' placeholder='ör. Teslimat Kısıtı'>"
    + "<div class='form-etiket'>NOT METNİ</div><textarea class='form-textarea' id='fDetay' rows='3' placeholder='Not metni'></textarea>";
}

function formAc(tip, eylem, index){
  aktifTip = tip; aktifEylem = eylem; aktifIndex = (index===undefined?null:index);
  kapat("yeniBilgiOverlay");
  var meta = TIP_META[tip];
  document.getElementById("formBaslik").textContent = (eylem==="ekle" ? "➕ Yeni " + meta.baslik + " Ekle" : "✏️ " + meta.baslik + " Düzenle");
  document.getElementById("formIcerik").innerHTML = formAlanlariHtml(tip);

  if(eylem === "duzenle"){
    var kayit = kayitlariGetir(musteriVerisi, tip)[index];
    if(tip === "yetkili"){
      document.getElementById("fIsim").value = kayit.isim || "";
      document.getElementById("fGorev").value = kayit.gorev || "";
      document.getElementById("fTel").value = kayit.telefon || "";
      document.getElementById("fEposta").value = kayit.eposta || "";
    } else if(tip === "not"){
      document.getElementById("fBaslik").value = kayit.baslik || "";
      document.getElementById("fDetay").value = kayit.metin || "";
    } else {
      document.getElementById("fBaslik").value = kayit.etiket || "";
      document.getElementById("fDetay").value = kayit.adres || "";
    }
  }
  ac("formOverlay");
}

function formKaydet(){
  var tip = aktifTip;
  var btn = document.getElementById("formKaydetBtn");

  function tamamla(basarili, err){
    btn.disabled = false;
    btn.textContent = "✓ Kaydet";
    if(!basarili){ hataGoster("Kaydedilemedi: " + (err && err.message ? err.message : "bilinmeyen hata")); return; }
    kapat("formOverlay");
    toastGoster(aktifEylem==="ekle" ? "Eklendi." : "Güncellendi.");
  }

  if(tip === "yetkili"){
    var isim = document.getElementById("fIsim").value.trim();
    if(!isim){ toastGoster("İsim boş olamaz."); return; }
    var kisi = {
      isim: isim,
      gorev: document.getElementById("fGorev").value.trim(),
      telefon: document.getElementById("fTel").value.trim(),
      eposta: document.getElementById("fEposta").value.trim()
    };
    btn.disabled = true; btn.textContent = "Kaydediliyor...";
    if(aktifEylem === "ekle") CustomerData.yetkiliEkle(seciliMusteriAdi, kisi, tamamla);
    else CustomerData.yetkiliGuncelle(seciliMusteriAdi, aktifIndex, kisi, tamamla);
    return;
  }

  var baslik = document.getElementById("fBaslik").value.trim();
  var detay = document.getElementById("fDetay").value.trim();
  if(!baslik){ toastGoster("Etiket/başlık boş olamaz."); return; }

  btn.disabled = true; btn.textContent = "Kaydediliyor...";

  if(tip === "fatura" || tip === "teslimat"){
    if(aktifEylem === "ekle") CustomerData.musteriAdresEkle(seciliMusteriAdi, tip, baslik, detay, tamamla);
    else CustomerData.musteriAdresGuncelle(seciliMusteriAdi, tip, aktifIndex, baslik, detay, tamamla);
  } else if(tip === "not"){
    var notObj = {baslik: baslik, metin: detay};
    if(aktifEylem === "ekle") CustomerData.notEkle(seciliMusteriAdi, notObj, tamamla);
    else CustomerData.notGuncelle(seciliMusteriAdi, aktifIndex, notObj, tamamla);
  }
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

  // Vade / Fatura / Kargo — tek değerli özet alanları, ayrı kaydet butonu
  document.getElementById("btnOzetKaydet").onclick = function(){
    var btn = this;
    var eskiMetin = btn.textContent;
    btn.disabled = true; btn.textContent = "Kaydediliyor...";
    var guncelBilgi = {
      vade: document.getElementById("ckVadeInput").value.trim(),
      fatura: document.getElementById("ckFaturaTuruInput").value.trim(),
      kargo: document.getElementById("ckKargoInput").value.trim()
    };
    CustomerData.musteriGuncelle(seciliMusteriAdi, guncelBilgi, function(basarili, err){
      btn.disabled = false; btn.textContent = eskiMetin;
      if(!basarili) hataGoster("Kaydedilemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
      else toastGoster("Kaydedildi.");
    });
  };

  // "Yeni Bilgi Ekle" ana buton + kategori seçim sheet'i
  document.getElementById("btnYeniBilgiAc").onclick = function(){ ac("yeniBilgiOverlay"); };
  document.getElementById("yeniBilgiOverlay").querySelectorAll(".sheet-secenek[data-tip]").forEach(function(btn){
    btn.onclick = function(){ formAc(this.getAttribute("data-tip"), "ekle"); };
  });

  // Her bloğun "Yönet" butonu
  document.querySelectorAll(".ck-yonet-btn[data-tip]").forEach(function(btn){
    btn.onclick = function(){ yonetAc(this.getAttribute("data-tip")); };
  });

  // Yönet sheet'i içindeki Düzenle/Sil
  document.getElementById("yonetDuzenleBtn").onclick = function(){ pickerAc("duzenle"); };
  document.getElementById("yonetSilBtn").onclick = function(){ pickerAc("sil"); };

  // Form Kaydet + Sil Onayla
  document.getElementById("formKaydetBtn").onclick = formKaydet;
  document.getElementById("silOnaylaBtn").onclick = silOnayla;

  // Tüm overlay'lerin kapatma tuşları (dışarı tıklama + "Vazgeç" tuşları)
  document.querySelectorAll("[data-kapat]").forEach(function(el){
    el.onclick = function(){ kapat(this.getAttribute("data-kapat")); };
  });
  document.querySelectorAll(".overlay").forEach(function(ov){
    ov.addEventListener("click", function(ev){
      if(ev.target === ov) kapat(ov.id);
    });
  });

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

  // Firebase'den taze veri gelince listeleri güncelle — Vade/Fatura/Kargo
  // alanlarından biri o an odaktaysa (kullanıcı yazıyorsa) o üçüne
  // dokunmadan sadece kart listelerini tazeler.
  CustomerData.listeDegistiginde(function(){
    var taze = CustomerData.musteriBul(seciliMusteriAdi);
    if(!taze) return;
    musteriVerisi = taze;
    var aktifId = document.activeElement ? document.activeElement.id : null;
    var ozetInputlar = ["ckVadeInput","ckFaturaTuruInput","ckKargoInput"];
    document.getElementById("cariKartAd").textContent = taze.ad;
    if(ozetInputlar.indexOf(aktifId) === -1){
      document.getElementById("ckVadeInput").value = taze.vade || "";
      document.getElementById("ckFaturaTuruInput").value = taze.fatura || "";
      document.getElementById("ckKargoInput").value = taze.kargo || "";
    }
    listeleriRenderEt();
  });
});
