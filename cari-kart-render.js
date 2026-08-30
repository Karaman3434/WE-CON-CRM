/*
  cari-kart-render.js
  ====================
  Cari Kart v6 — ana sayfa TAMAMEN salt-görüntüleme (isim/şehir,
  Vade/Fatura/Kargo, Fatura Adresi/Yetkili Kişi/Teslimat Adresi/Not
  blokları — hiçbirinde buton yok). Tek eylem: "✏️ Bilgiyi Düzenle" →
  4 bölümlü AKORDİYON ekranı (CARİ BİLGİLERİ / YETKİLİ KİŞİ / TESLİMAT
  ADRESİ / NOT). Bir başlığa dokununca açılır/kapanır; açıkken içerik +
  Ekle/Düzenle/Sil butonları görünür.

  CARİ BİLGİLERİ özel bir bölüm: şehir/vade/fatura/kargo (tekil alanlar)
  + fatura adresi listesini bir arada gösterir.
    Ekle    → yeni fatura adresi ekleme formu
    Düzenle → "Temel Bilgileri Düzenle" mi yoksa hangi fatura adresi mi
              seçimi (birden fazla seçenek varsa picker açılır)
    Sil     → hangi fatura adresinin silineceğini sorar

  Müşteri ADI burada düzenlenemez (bkz. customer-cari-kart.html başındaki
  not — sipariş/rapor/görev/km kayıtları müşteri adını anahtar olarak
  kullanıyor).
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

// Akordiyonda gösterilecek 4 bölüm — "cari" özel bir sanal bölüm (fatura
// adresi listesini + tekil temel bilgileri bir arada tutar).
var AKORDIYON_TANIM = [
  {id:"cari",     ikon:"🏢", baslik:"CARİ BİLGİLERİ"},
  {id:"yetkili",  ikon:"👤", baslik:"YETKİLİ BİLGİSİ"},
  {id:"teslimat", ikon:"🚚", baslik:"TESLİMAT ADRESİ"},
  {id:"not",      ikon:"📝", baslik:"NOT"}
];
var acikBolum = null; // aynı anda tek bölüm açık kalır

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
  if(musteri.not && musteri.not.trim()) return [{baslik:"", metin: musteri.not.trim()}];
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
  var adres = kayit.adres || "";
  var sehir = (musteriVerisi && musteriVerisi.sehir) || "";
  return sehir && adres ? (adres + ", " + sehir) : adres;
}

function anaSayfayiRenderEt(){
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

  document.getElementById("ozetVadeDeger").textContent = musteri.vade || "—";
  document.getElementById("ozetFaturaDeger").textContent = musteri.fatura || "—";
  document.getElementById("ozetKargoDeger").textContent = musteri.kargo || "—";

  anaSayfayiRenderEt();
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

// ---- Akordiyon ("Bilgiyi Düzenle" ekranı) ----
function akordiyonuRenderEt(){
  var kapsayici = document.getElementById("akordiyonKapsayici");
  kapsayici.innerHTML = AKORDIYON_TANIM.map(function(bolum){
    var acikMi = acikBolum === bolum.id;
    var html = "<div class='akordiyon-baslik" + (acikMi ? " akordiyon-baslik--acik" : "") + "' data-bolum='" + bolum.id + "'>"
      + "<div class='akordiyon-baslik-metin'>" + bolum.ikon + " " + bolum.baslik + "</div>"
      + "<div class='akordiyon-ok'>" + (acikMi ? "▴" : "▾") + "</div>"
      + "</div>";
    if(acikMi) html += akordiyonGovdeHtml(bolum.id);
    return html;
  }).join("");

  kapsayici.querySelectorAll(".akordiyon-baslik").forEach(function(el){
    el.onclick = function(){
      var id = this.getAttribute("data-bolum");
      acikBolum = (acikBolum === id) ? null : id;
      akordiyonuRenderEt();
    };
  });
  kapsayici.querySelectorAll(".akordiyon-buton[data-tip][data-eylem]").forEach(function(btn){
    btn.onclick = function(ev){
      ev.stopPropagation();
      eylemBaslat(this.getAttribute("data-tip"), this.getAttribute("data-eylem"));
    };
  });
}

function akordiyonGovdeHtml(bolumId){
  if(bolumId === "cari"){
    var m = musteriVerisi;
    var faturaListesi = kayitlariGetir(m, "fatura");
    var satirlar = "<div class='satir'><b>Şehir:</b> " + escapeText(m.sehir||"—") + "</div>"
      + "<div class='satir'><b>Vade:</b> " + escapeText(m.vade||"—") + " · <b>Fatura:</b> " + escapeText(m.fatura||"—") + " · <b>Kargo:</b> " + escapeText(m.kargo||"—") + "</div>";
    if(faturaListesi.length === 0){
      satirlar += "<div class='satir-bos'>Henüz fatura adresi eklenmemiş.</div>";
    } else {
      satirlar += faturaListesi.map(function(k){
        return "<div class='satir'><b>Fatura Adresi" + (k.etiket ? " — "+escapeText(k.etiket) : "") + ":</b> " + escapeText(k.adres||"") + "</div>";
      }).join("");
    }
    return "<div class='akordiyon-govde'>"
      + "<div class='akordiyon-govde-icerik'>" + satirlar + "</div>"
      + "<div class='akordiyon-buton-satir'>"
      + "<button class='akordiyon-buton akordiyon-buton--ekle' data-tip='cari' data-eylem='ekle'>➕ Yeni Fatura Adresi</button>"
      + "<button class='akordiyon-buton akordiyon-buton--duzenle' data-tip='cari' data-eylem='duzenle'>✏️ Düzenle</button>"
      + "<button class='akordiyon-buton akordiyon-buton--sil' data-tip='cari' data-eylem='sil'>🗑️ Sil</button>"
      + "</div></div>";
  }

  // yetkili / teslimat / not — ortak liste düzeni
  var liste = kayitlariGetir(musteriVerisi, bolumId);
  var icerik = liste.length === 0
    ? "<div class='satir-bos'>Henüz " + TIP_META[bolumId].tekil + " eklenmemiş.</div>"
    : liste.map(function(k){
        var baslikMetni = kayitBaslik(bolumId, k);
        var altMetni = kayitAltMetin(bolumId, k);
        return "<div class='satir'>" + (baslikMetni && bolumId!=="not" ? "<b>"+escapeText(baslikMetni)+":</b> " : "") + escapeText(altMetni || baslikMetni) + "</div>";
      }).join("");
  return "<div class='akordiyon-govde'>"
    + "<div class='akordiyon-govde-icerik'>" + icerik + "</div>"
    + "<div class='akordiyon-buton-satir'>"
    + "<button class='akordiyon-buton akordiyon-buton--ekle' data-tip='" + bolumId + "' data-eylem='ekle'>➕ Ekle</button>"
    + "<button class='akordiyon-buton akordiyon-buton--duzenle' data-tip='" + bolumId + "' data-eylem='duzenle'>✏️ Düzenle</button>"
    + "<button class='akordiyon-buton akordiyon-buton--sil' data-tip='" + bolumId + "' data-eylem='sil'>🗑️ Sil</button>"
    + "</div></div>";
}

// ---- Genel amaçlı picker (birden fazla kayıt arasından seçim) ----
function pickerGoster(baslikMetni, altMetni, ogeler){
  document.getElementById("pickerBaslik").textContent = baslikMetni;
  document.getElementById("pickerAlt").textContent = altMetni;
  document.getElementById("pickerListesi").innerHTML = ogeler.map(function(o, i){
    return "<button class='picker-item' data-idx='" + i + "'><div class='ust'>" + escapeText(o.baslik) + "</div>" + (o.alt ? "<div class='alt'>" + escapeText(o.alt) + "</div>" : "") + "</button>";
  }).join("");
  document.getElementById("pickerListesi").querySelectorAll(".picker-item").forEach(function(btn, i){
    btn.onclick = function(){ kapat("pickerOverlay"); ogeler[i].onSecim(); };
  });
  ac("pickerOverlay");
}

// ---- "Ekle/Düzenle/Sil" butonlarının eylem başlatıcısı ----
function eylemBaslat(bolumId, eylem){
  if(bolumId === "cari"){
    if(eylem === "ekle"){ formAc("fatura", "ekle"); return; }

    var faturaListesi = kayitlariGetir(musteriVerisi, "fatura");

    if(eylem === "duzenle"){
      // Artık ara bir "Ne düzenlemek istiyorsun?" seçim ekranı YOK —
      // doğrudan tüm cari bilgileri (müşteri adı dahil) tek formda açılır.
      formAc("cari-tam", "duzenle");
      return;
    }

    if(eylem === "sil"){
      if(faturaListesi.length === 0){ toastGoster("Henüz kayıtlı fatura adresi yok."); return; }
      if(faturaListesi.length === 1){ silSor("fatura", 0); return; }
      var silOgeler = faturaListesi.map(function(k, i){
        return {baslik: kayitBaslik("fatura",k), alt: kayitAltMetin("fatura",k), onSecim:function(){ silSor("fatura", i); }};
      });
      pickerGoster("🗑️ Hangi fatura adresini silmek istiyorsun?", "Fatura Adresi — bir kayıt seç", silOgeler);
      return;
    }
    return;
  }

  // yetkili / teslimat / not — ortak akış
  aktifTip = bolumId;
  aktifEylem = eylem;
  if(eylem === "ekle"){ formAc(bolumId, "ekle"); return; }

  var liste = kayitlariGetir(musteriVerisi, bolumId);
  if(liste.length === 0){ toastGoster("Henüz kayıtlı " + TIP_META[bolumId].tekil + " yok."); return; }
  // Yetkili Kişi ve Teslimat Adresi'nde de "cari" ile aynı sadeleştirme:
  // Düzenle her zaman doğrudan ilk (tek) kayda gider — ara "hangisini
  // düzenlemek istiyorsun?" sorusu yok. Birden fazla kayıt varsa bile
  // en son eklenen/ilk kayıt üzerinden devam edilir; farklı bir kayıt
  // için önce Sil, sonra Ekle kullanılabilir. Silme işleminde (birden
  // fazla kayıt olması nadir olduğu için) seçim ekranı hâlâ geçerli.
  if(eylem === "duzenle"){ formAc(bolumId, "duzenle", 0); return; }

  if(liste.length === 1){ silSor(bolumId, 0); return; }
  var ogeler2 = liste.map(function(k, i){
    return {baslik: kayitBaslik(bolumId,k), alt: kayitAltMetin(bolumId,k), onSecim:function(){ silSor(bolumId, i); }};
  });
  pickerGoster("🗑️ Hangisini silmek istiyorsun?", TIP_META[bolumId].baslik + " — bir kayıt seç", ogeler2);
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
      CustomerData.musteriNotSil(seciliMusteriAdi, tamamla);
    }
  }
}

// ---- Ekle / Düzenle formu ----
function formAlanlariHtml(tip){
  if(tip === "cari-tam"){
    var m = musteriVerisi;
    var ilkFatura = (kayitlariGetir(m,"fatura")[0]) || {};
    return "<div class='form-etiket'>MÜŞTERİ (TİCARİ) İSMİ</div><input class='form-input' id='fAd' placeholder='Müşteri ismi' value=\"" + escapeText(m.ad||"") + "\">"
      + "<p class='ck-not-aciklama' style='margin:-6px 0 10px'>Bu ismi değiştirirsen, geçmiş sipariş/teklif/görev kayıtları da otomatik olarak yeni isme taşınır.</p>"
      + "<div class='form-etiket'>ŞEHİR</div><input class='form-input' id='fSehir' placeholder='Şehir' value=\"" + escapeText(m.sehir||"") + "\">"
      + "<div class='form-satir-2'>"
      + "<div><div class='form-etiket'>VADE</div><input class='form-input' id='fVade' placeholder='örn. 60 gün' value=\"" + escapeText(m.vade||"") + "\"></div>"
      + "<div><div class='form-etiket'>FATURA</div><input class='form-input' id='fFatura' placeholder='örn. EURO fatura' value=\"" + escapeText(m.fatura||"") + "\"></div>"
      + "</div>"
      + "<div class='form-etiket'>KARGO</div><input class='form-input' id='fKargo' placeholder='örn. Ücretsiz' value=\"" + escapeText(m.kargo||"") + "\">"
      + "<div class='form-etiket'>FATURA ADRESİ</div><textarea class='form-textarea' id='fDetay' rows='3' placeholder='Açık adres'>" + escapeText(ilkFatura.adres||"") + "</textarea>";
  }
  if(tip === "temel"){
    var m2 = musteriVerisi;
    return "<div class='form-etiket'>ŞEHİR</div><input class='form-input' id='fSehir' placeholder='Şehir' value=\"" + escapeText(m2.sehir||"") + "\">"
      + "<div class='form-etiket'>VADE</div><input class='form-input' id='fVade' placeholder='örn. 60 gün' value=\"" + escapeText(m2.vade||"") + "\">"
      + "<div class='form-etiket'>FATURA</div><input class='form-input' id='fFatura' placeholder='örn. EURO fatura' value=\"" + escapeText(m2.fatura||"") + "\">"
      + "<div class='form-etiket'>KARGO</div><input class='form-input' id='fKargo' placeholder='örn. Ücretsiz' value=\"" + escapeText(m2.kargo||"") + "\">";
  }
  if(tip === "fatura" || tip === "teslimat"){
    return "<div class='form-etiket'>ETİKET (ör. Fabrika 2 Fatura Adresi)</div><input class='form-input' id='fBaslik' placeholder='Etiket'>"
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
  // not — sadece metin, ayrı başlık alanı yok
  return "<div class='form-etiket'>NOT METNİ</div><textarea class='form-textarea' id='fDetay' rows='3' placeholder='Not metni'></textarea>";
}

function formAc(tip, eylem, index){
  aktifTip = tip; aktifEylem = eylem; aktifIndex = (index===undefined?null:index);
  kapat("pickerOverlay");
  var baslikMetni = (tip === "temel" || tip === "cari-tam") ? "Cari Bilgileri" : TIP_META[tip].baslik;
  document.getElementById("formBaslik").textContent = (tip === "temel" ? "⚙️ Temel Bilgileri Düzenle" : (tip === "cari-tam" ? "✏️ Cari Bilgileri Düzenle" : (eylem==="ekle" ? "➕ Yeni " + baslikMetni + " Ekle" : "✏️ " + baslikMetni + " Düzenle")));
  document.getElementById("formIcerik").innerHTML = formAlanlariHtml(tip);

  if(eylem === "duzenle" && tip !== "temel" && tip !== "cari-tam"){
    var kayit = kayitlariGetir(musteriVerisi, tip)[index];
    if(tip === "yetkili"){
      document.getElementById("fIsim").value = kayit.isim || "";
      document.getElementById("fGorev").value = kayit.gorev || "";
      document.getElementById("fTel").value = kayit.telefon || "";
      document.getElementById("fEposta").value = kayit.eposta || "";
    } else if(tip === "not"){
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
    toastGoster(tip === "temel" || tip === "cari-tam" ? "Güncellendi." : (aktifEylem==="ekle" ? "Eklendi." : "Güncellendi."));
  }

  if(tip === "cari-tam"){
    var yeniAd = document.getElementById("fAd").value.trim();
    if(!yeniAd){ toastGoster("Müşteri ismi boş olamaz."); return; }
    var eskiAd = musteriVerisi.ad;
    var adres = document.getElementById("fDetay").value.trim();
    var guncelBilgi2 = {
      ad: yeniAd,
      sehir: document.getElementById("fSehir").value.trim(),
      vade: document.getElementById("fVade").value.trim(),
      fatura: document.getElementById("fFatura").value.trim(),
      kargo: document.getElementById("fKargo").value.trim()
    };
    btn.disabled = true; btn.textContent = "Kaydediliyor...";

    function temelVeAdresiKaydet(){
      CustomerData.musteriGuncelle(seciliMusteriAdi, guncelBilgi2, function(basarili3, err3){
        if(!basarili3){ tamamla(false, err3); return; }
        seciliMusteriAdi = yeniAd; // artık kayıtları bu isimle arayacağız
        var ilkFaturaVarMi = kayitlariGetir(musteriVerisi, "fatura").length > 0;
        if(ilkFaturaVarMi){
          CustomerData.musteriAdresGuncelle(yeniAd, "fatura", 0, "Fatura Adresi", adres, tamamla);
        } else if(adres){
          CustomerData.musteriAdresEkle(yeniAd, "fatura", "Fatura Adresi", adres, tamamla);
        } else {
          tamamla(true);
        }
      });
    }

    if(yeniAd !== eskiAd && typeof ReportsData !== "undefined"){
      // İsim değişti — önce geçmiş sipariş/teklif/proforma/numune ve görev
      // kayıtlarını yeni isme taşı (ReportsData.kayitlariBirlestir zaten
      // musteriId eşleşmesini de destekliyor), SONRA cari kaydın kendisini
      // güncelle. Bu sıra, taşıma sırasında eski kaydın "kaybolmuş" gibi
      // görünmesini engeller.
      ReportsData.kayitlariBirlestir(eskiAd, musteriVerisi.id||null, yeniAd, musteriVerisi.id||null, function(tasindiMi, tasimaErr){
        if(!tasindiMi){ tamamla(false, tasimaErr); return; }
        temelVeAdresiKaydet();
      });
    } else {
      temelVeAdresiKaydet();
    }
    return;
  }

  if(tip === "temel"){
    var guncelBilgi = {
      sehir: document.getElementById("fSehir").value.trim(),
      vade: document.getElementById("fVade").value.trim(),
      fatura: document.getElementById("fFatura").value.trim(),
      kargo: document.getElementById("fKargo").value.trim()
    };
    btn.disabled = true; btn.textContent = "Kaydediliyor...";
    CustomerData.musteriGuncelle(seciliMusteriAdi, guncelBilgi, tamamla);
    return;
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

  if(tip === "not"){
    var metin = document.getElementById("fDetay").value.trim();
    if(!metin){ toastGoster("Not metni boş olamaz."); return; }
    var notObj = {baslik: "", metin: metin};
    btn.disabled = true; btn.textContent = "Kaydediliyor...";
    if(aktifEylem === "ekle") CustomerData.notEkle(seciliMusteriAdi, notObj, tamamla);
    else CustomerData.notGuncelle(seciliMusteriAdi, aktifIndex, notObj, tamamla);
    return;
  }

  // fatura / teslimat
  var baslik = document.getElementById("fBaslik").value.trim();
  var detay = document.getElementById("fDetay").value.trim();
  if(!baslik){ toastGoster("Etiket boş olamaz."); return; }
  btn.disabled = true; btn.textContent = "Kaydediliyor...";
  if(aktifEylem === "ekle") CustomerData.musteriAdresEkle(seciliMusteriAdi, tip, baslik, detay, tamamla);
  else CustomerData.musteriAdresGuncelle(seciliMusteriAdi, tip, aktifIndex, baslik, detay, tamamla);
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

function tarihiGuncelle(){
  try{
    var el = document.getElementById("gunTarihi");
    if(!el) return;
    var gunler = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
    var aylar = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
    var d = new Date();
    el.textContent = gunler[d.getDay()] + ", " + d.getDate() + " " + aylar[d.getMonth()] + " " + d.getFullYear();
  }catch(e){}
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  var secili = CustomerData.seciliyiOku();
  if(!secili){
    hataGoster("Müşteri seçilmemiş, listeye dönülüyor.");
    setTimeout(function(){ window.location.href = "customer.html"; }, 1500);
    return;
  }
  seciliMusteriAdi = secili.ad;
  alanlariDoldur(secili);

  document.getElementById("btnBilgiYonetAc").onclick = function(){
    acikBolum = null;
    akordiyonuRenderEt();
    ac("bilgiYonetOverlay");
  };

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

  // Firebase'den taze veri gelince ana sayfayı ve (açıksa) akordiyonu tazele.
  CustomerData.listeDegistiginde(function(){
    var taze = CustomerData.musteriBul(seciliMusteriAdi);
    if(!taze) return;
    musteriVerisi = taze;
    document.getElementById("cariKartAd").textContent = taze.ad;
    document.getElementById("ozetVadeDeger").textContent = taze.vade || "—";
    document.getElementById("ozetFaturaDeger").textContent = taze.fatura || "—";
    document.getElementById("ozetKargoDeger").textContent = taze.kargo || "—";
    anaSayfayiRenderEt();
    if(!document.getElementById("bilgiYonetOverlay").hidden) akordiyonuRenderEt();
  });
});
