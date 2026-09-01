/*
  odenebilir-komisyon-render.js
  ===============================
  1) Fotoğraf/ekran görüntüsü seçildiğinde Tesseract.js (cihaz üzerinde,
     sunucuya/hesaba bağımlı olmayan OCR) ile metni okur.
  2) Ham metinden "Ay" (1-12) + o satırdaki SON parasal sayıyı (tablo
     düzeninde en sağdaki sütun = Ödenebilir Komisyon) ayıklar.
  3) Sonucu düzenlenebilir bir forma doldurur — kullanıcı onaylamadan
     HİÇBİR ŞEY kaydedilmez (OCR asla %100 güvenilmez, özellikle eksi
     işaretini kaçırabilir).
  4) İki kayıt arasında ay ay fark hesaplayıp karşılaştırma gösterir.
*/

function hataGoster(mesaj){
  console.error(mesaj);
  if(typeof HataLog !== "undefined") HataLog.kaydet(mesaj);
  var kutu = document.createElement("div");
  kutu.textContent = "⚠️ " + mesaj;
  kutu.style.cssText = "position:fixed;top:8px;left:8px;right:8px;background:#c0392b;color:#fff;padding:10px;border-radius:8px;font-size:13px;z-index:99999;";
  document.body.appendChild(kutu);
  setTimeout(function(){ kutu.remove(); }, 8000);
}

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

var AY_ADLARI = ["","Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function fmtTL(n){
  return (n||0).toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2});
}

function bugununTarihAnahtari(){
  var d = new Date();
  return d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0"+d.getDate()).slice(-2);
}

function tarihAnahtariniOku(anahtar){
  var p = anahtar.split("-");
  return p[2] + " " + AY_ADLARI[parseInt(p[1],10)] + " " + p[0];
}

// Tesseract'ın ham metninden Ay -> Ödenebilir Komisyon eşleşmesini çıkarır.
// Kural: satırın İLK BİRKAÇ kelimesi içinde (OCR bazen satır başına "aa",
// "ra", "@" gibi gürültü ekleyebiliyor — bu yüzden SADECE satırın tam
// başına bakmak yetersiz) 1-12 arası TEK BAŞINA bir sayı varsa, ondan
// SONRAKİ tüm parasal görünümlü sayılardan (1.234,56 kalıbı) SONUNCUSU
// alınır — merkez tablosunda "Ödenebilir Komisyon" her zaman EN SAĞDAKİ
// (dolayısıyla satırda en son geçen) sütundur.
function ocrMetniniAyristir(metin){
  var sonuc = {};
  var sayiKalibi = /-?\d{1,3}(?:\.\d{3})*,\d{2}/g;
  metin.split("\n").forEach(function(satir){
    var tokenlar = satir.trim().split(/\s+/).filter(Boolean);
    var ay = null, ayIndex = -1;
    for(var i=0; i<Math.min(tokenlar.length, 3); i++){
      if(/^\d{1,2}$/.test(tokenlar[i])){
        var aday = parseInt(tokenlar[i], 10);
        if(aday>=1 && aday<=12){ ay = aday; ayIndex = i; break; }
      }
    }
    if(ay===null) return;
    var kalanMetin = tokenlar.slice(ayIndex+1).join(" ");
    var sayilar = kalanMetin.match(sayiKalibi);
    if(!sayilar || sayilar.length === 0) return;
    var sonSayiStr = sayilar[sayilar.length - 1];
    var sayisalDeger = parseFloat(sonSayiStr.replace(/\./g, "").replace(",", "."));
    if(isNaN(sayisalDeger)) return;
    sonuc[ay] = sayisalDeger;
  });
  return sonuc;
}

function girisTablosunuDoldur(aylar){
  var govde = document.getElementById("okGirisTabloGovde");
  govde.innerHTML = "";
  for(var ay=1; ay<=12; ay++){
    var deger = (aylar && aylar[ay]!==undefined) ? aylar[ay] : "";
    var tr = document.createElement("tr");
    tr.innerHTML = "<td class='ok-giris-ay-hucre'>" + ay + " · " + AY_ADLARI[ay] + "</td>"
      + "<td><input type='text' inputmode='decimal' data-ay='" + ay + "' value='" + (deger===""?"":fmtTL(deger)) + "' placeholder='0,00'></td>";
    govde.appendChild(tr);
  }
  document.getElementById("okFormAlani").hidden = false;
  document.getElementById("okTarihGiris").value = bugununTarihAnahtari();
}

function ocrCalistir(dosya){
  var durumEl = document.getElementById("okOcrDurum");
  durumEl.hidden = false;
  durumEl.className = "ok-ocr-durum ok-ocr-durum--calisiyor";
  durumEl.textContent = "⏳ Metin okunuyor (cihaz üzerinde, birkaç saniye sürebilir)...";

  if(typeof Tesseract === "undefined"){
    durumEl.className = "ok-ocr-durum ok-ocr-durum--hata";
    durumEl.textContent = "✕ OCR modülü yüklenemedi (internet bağlantısını kontrol et). Elle de doldurabilirsin:";
    girisTablosunuDoldur({});
    return;
  }

  Tesseract.recognize(dosya, "eng")
    .then(function(sonuc){
      var aylar = ocrMetniniAyristir(sonuc.data.text);
      var bulunanSayisi = Object.keys(aylar).length;
      if(bulunanSayisi === 0){
        durumEl.className = "ok-ocr-durum ok-ocr-durum--hata";
        durumEl.textContent = "✕ Hiçbir satır okunamadı — görüntü net değil olabilir. Aşağıdan elle doldurabilirsin.";
      } else {
        durumEl.className = "ok-ocr-durum ok-ocr-durum--basarili";
        durumEl.textContent = "✓ " + bulunanSayisi + "/12 satır okundu — aşağıda MUTLAKA kontrol edip onayla (özellikle eksi işaretli/negatif değerler OCR tarafından kaçırılabilir).";
      }
      girisTablosunuDoldur(aylar);
    })
    .catch(function(err){
      durumEl.className = "ok-ocr-durum ok-ocr-durum--hata";
      durumEl.textContent = "✕ Okuma başarısız: " + (err.message||"bilinmeyen hata") + " — elle doldurabilirsin.";
      girisTablosunuDoldur({});
    });
}

function onaylaTiklandi(){
  try{
    var tarihAnahtari = document.getElementById("okTarihGiris").value;
    if(!tarihAnahtari){ alert("Lütfen bir tarih seç."); return; }
    var aylar = {};
    document.querySelectorAll("#okGirisTabloGovde input").forEach(function(inp){
      var ay = inp.getAttribute("data-ay");
      var deger = parseFloat((inp.value||"0").replace(/\./g,"").replace(",","."));
      aylar[ay] = isNaN(deger) ? 0 : deger;
    });
    var btn = document.getElementById("btnOkOnayla");
    btn.disabled = true; btn.textContent = "Kaydediliyor...";
    KomisyonData.kaydet(tarihAnahtari, aylar, function(basarili, err){
      btn.disabled = false; btn.textContent = "✓ Bu Kaydı Onayla ve Kaydet";
      if(!basarili){ hataGoster("Kaydedilemedi: " + (err && err.message ? err.message : "bilinmeyen hata")); return; }
      document.getElementById("okFormAlani").hidden = true;
      document.getElementById("okOcrDurum").hidden = true;
      document.getElementById("okDosyaSecici").value = "";
      alert("✓ Kaydedildi.");
    });
  }catch(e){ hataGoster("Onaylama başarısız: " + e.message); }
}

function secicileriDoldur(){
  var kayitlar = KomisyonData.tumKayitlar();
  var oncekiSecim = document.getElementById("okOncekiSecim");
  var sonrakiSecim = document.getElementById("okSonrakiSecim");
  if(kayitlar.length < 2){
    document.getElementById("okKarsilastirmaBos").hidden = false;
    document.getElementById("okKarsilastirmaSonuc").innerHTML = "";
    oncekiSecim.innerHTML = ""; sonrakiSecim.innerHTML = "";
    return;
  }
  document.getElementById("okKarsilastirmaBos").hidden = true;
  var secenekler = kayitlar.map(function(k){ return "<option value='" + k.anahtar + "'>" + tarihAnahtariniOku(k.anahtar) + "</option>"; }).join("");
  oncekiSecim.innerHTML = secenekler;
  sonrakiSecim.innerHTML = secenekler;
  // Varsayılan: en son iki kayıt (kayitlar[0]=en yeni, kayitlar[1]=ondan önceki)
  sonrakiSecim.value = kayitlar[0].anahtar;
  oncekiSecim.value = kayitlar[1].anahtar;
  karsilastirmayiCiz();
}

function karsilastirmayiCiz(){
  try{
    var oncekiAnahtar = document.getElementById("okOncekiSecim").value;
    var sonrakiAnahtar = document.getElementById("okSonrakiSecim").value;
    var sonucEl = document.getElementById("okKarsilastirmaSonuc");
    if(!oncekiAnahtar || !sonrakiAnahtar){ sonucEl.innerHTML = ""; return; }
    var onceki = KomisyonData.kaydiOku(oncekiAnahtar);
    var sonraki = KomisyonData.kaydiOku(sonrakiAnahtar);
    if(!onceki || !sonraki){ sonucEl.innerHTML = ""; return; }

    var gunFarki = Math.round((new Date(sonrakiAnahtar) - new Date(oncekiAnahtar)) / 86400000);
    var satirlar = "";
    var toplamFark = 0;
    for(var ay=1; ay<=12; ay++){
      var oncekiDeger = (onceki.aylar && onceki.aylar[ay]) || 0;
      var sonrakiDeger = (sonraki.aylar && sonraki.aylar[ay]) || 0;
      var fark = sonrakiDeger - oncekiDeger;
      toplamFark += fark;
      if(Math.abs(fark) < 0.01) continue; // değişmeyen aylar gösterilmez
      var farkSinif = fark >= 0 ? "ok-fark-pozitif" : "ok-fark-negatif";
      var farkIsareti = fark >= 0 ? "+" : "";
      satirlar += "<tr><td>" + ay + " · " + AY_ADLARI[ay] + "</td><td>" + fmtTL(oncekiDeger) + "</td><td>" + fmtTL(sonrakiDeger) + "</td><td class='" + farkSinif + "'>" + farkIsareti + fmtTL(fark) + "</td></tr>";
    }

    if(!satirlar){
      sonucEl.innerHTML = "<p class='bos-mesaj'>Bu iki tarih arasında hiçbir ayda değişiklik yok.</p>";
      return;
    }

    sonucEl.innerHTML = "<div class='ok-fark-tarih-araligi'>" + tarihAnahtariniOku(oncekiAnahtar) + " → " + tarihAnahtariniOku(sonrakiAnahtar) + " (" + gunFarki + " gün)</div>"
      + "<table class='ok-fark-tablo'><thead><tr><th>AY</th><th>ÖNCE</th><th>SONRA</th><th>FARK</th></tr></thead><tbody>" + satirlar + "</tbody></table>"
      + "<div class='ok-fark-toplam-serit'><span>TOPLAM FARK</span><span>" + (toplamFark>=0?"+":"") + fmtTL(toplamFark) + " TL</span></div>";
  }catch(e){ hataGoster("Karşılaştırma çizilemedi: " + e.message); }
}

function gecmisiCiz(){
  try{
    var kayitlar = KomisyonData.tumKayitlar();
    var kapsayici = document.getElementById("okGecmisListesi");
    var bos = document.getElementById("okGecmisBos");
    if(kayitlar.length === 0){
      kapsayici.innerHTML = "";
      bos.hidden = false;
      return;
    }
    bos.hidden = true;
    kapsayici.innerHTML = kayitlar.map(function(k){
      var toplam = 0;
      for(var ay=1; ay<=12; ay++){ toplam += (k.aylar && k.aylar[ay]) || 0; }
      return "<div class='ok-gecmis-karti'>"
        + "<div><div class='ok-gecmis-tarih'>" + tarihAnahtariniOku(k.anahtar) + "</div><div class='ok-gecmis-toplam'>Toplam: " + fmtTL(toplam) + " TL</div></div>"
        + "<button class='ok-gecmis-sil-btn' data-sil='" + k.anahtar + "'>🗑️</button>"
        + "</div>";
    }).join("");
    kapsayici.querySelectorAll(".ok-gecmis-sil-btn").forEach(function(btn){
      btn.onclick = function(){
        var anahtar = this.getAttribute("data-sil");
        if(!confirm(tarihAnahtariniOku(anahtar) + " tarihli kayıt silinsin mi?")) return;
        KomisyonData.kaydiSil(anahtar, function(basarili, err){
          if(!basarili) hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
        });
      };
    });
  }catch(e){ hataGoster("Geçmiş çizilemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  document.getElementById("okDosyaSecici").addEventListener("change", function(){
    if(this.files && this.files[0]) ocrCalistir(this.files[0]);
  });
  document.getElementById("btnOkOnayla").onclick = onaylaTiklandi;
  document.getElementById("okOncekiSecim").onchange = karsilastirmayiCiz;
  document.getElementById("okSonrakiSecim").onchange = karsilastirmayiCiz;

  KomisyonData.degistiginde(function(){ secicileriDoldur(); gecmisiCiz(); });
  secicileriDoldur();
  gecmisiCiz();
});
