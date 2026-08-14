// KARTTAN/TABELADAN DOLDUR — fotoğrafı Cloud Function'a gönderir,
// dönen bilgileri Yeni Müşteri formuna doldurur. Otomatik kaydetmez,
// kullanıcı kontrol edip kendisi "KAYDET"e basar.
// ============================================================
function kartFotoAlaniniTemizle(){
  var inp=document.getElementById("kartFotoInput");
  if(inp) inp.value="";
}

function kartFotoDurumGoster(mesaj, tip, durumElId){
  var el=document.getElementById(durumElId||"kartFotoDurum");
  if(!el) return;
  var renkler = {
    yukleniyor:{bg:"#eef4fb",fg:"#003a70"},
    basarili:{bg:"#e7f8ee",fg:"#1e7145"},
    hata:{bg:"#fdeceb",fg:"#c0392b"}
  };
  var r = renkler[tip]||renkler.yukleniyor;
  el.style.background=r.bg;
  el.style.color=r.fg;
  el.textContent=mesaj;
  el.style.display="block";
}

// Genel amaçlı: bir dosyayı Cloud Function'a gönderip AI ile okunan bilgileri döndürür.
// hedef: "firma" | "yetkiliIletisim" | "teslimatAdresi" — sunucu tarafında isteme metnini yönlendirmek için.
function kartFotoGonder(dosya, hedef, durumElId, basariCB, hataCB){
  var workerUrl = WEICON_AI_WORKER_URL || KART_OKUMA_URL;
  if(!workerUrl){
    kartFotoDurumGoster("⚠️ Bu özellik henüz kurulmadı (WEICON_AI_WORKER_URL boş). Kurulum rehberine bakın.", "hata", durumElId);
    return;
  }
  kartFotoDurumGoster("⏳ Fotoğraf okunuyor, lütfen bekleyin...", "yukleniyor", durumElId);

  // Fotoğrafı (hangi formatta gelirse gelsin — HEIC, WEBP, vs.) her zaman JPEG'e
  // çevirerek gönderiyoruz; Anthropic API sadece jpeg/png/gif/webp kabul ediyor.
  kartFotoJpegeDonustur(dosya, function(base64, mediaType){
    fetch(workerUrl, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({action:"kartOku", image: base64, mediaType: mediaType, hedef: hedef||"firma"})
    })
    .then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(data){
        return {ok:r.ok, status:r.status, data:data};
      });
    })
    .then(function(sonuc){
      if(!sonuc.ok || sonuc.data.error){
        throw new Error(sonuc.data.error || ("Sunucu hatası ("+sonuc.status+")"));
      }
      // basariCB, anlamlı bir veri bulunamadıysa false döndürebilir — bu durumda
      // otomatik "başarılı" mesajı yerine uyarı gösteriyoruz (alanlar boşken bile
      // yanlışlıkla "✓ Bilgiler dolduruldu" denmesin diye).
      var bulunduMu = basariCB(sonuc.data);
      if(bulunduMu === false){
        kartFotoDurumGoster("⚠️ Fotoğrafta aranan bilgi bulunamadı — bilgileri elle girebilirsiniz.", "hata", durumElId);
      } else if(typeof bulunduMu === "string"){
        // basariCB, sadece bazı alanların bulunduğunu belirtmek için özel bir mesaj döndürmüş
        // (ör. saat bulundu ama tarih fotoğrafta görünmüyordu) — genel mesaj yerine bunu göster.
        kartFotoDurumGoster(bulunduMu, "basarili", durumElId);
      } else {
        kartFotoDurumGoster("✓ Bilgiler dolduruldu — lütfen kontrol edip kaydet.", "basarili", durumElId);
      }
    })
    .catch(function(err){
      kartFotoDurumGoster("⚠️ Okunamadı: "+err.message+" — bilgileri elle girebilirsiniz.", "hata", durumElId);
      if(hataCB) hataCB(err);
    });
  }, function(){
    kartFotoDurumGoster("⚠️ Fotoğraf okunamadı/işlenemedi, tekrar deneyin.", "hata", durumElId);
    if(hataCB) hataCB(new Error("Dosya işlenemedi"));
  });
}

// Herhangi bir görsel dosyasını (HEIC/HEIF, WEBP, PNG, vs.) canvas üzerinden
// JPEG'e çevirip base64 olarak döndürür. Böylece Anthropic API'nin kabul
// etmediği formatlarda (özellikle iPhone/bazı Android HEIC fotoğrafları) hata alınmaz.
// Tarayıcı görseli çözemezse (ör. desteklenmeyen HEIC varyantı), sessizce
// orijinal dosyayı olduğu gibi göndermeye düşer — tamamen durup hata vermek yerine.
function kartFotoJpegeDonustur(dosya, basariCB, hataCB){
  var yedekPlanaGec = function(){
    var reader = new FileReader();
    reader.onload = function(e){
      var base64 = e.target.result.split(",")[1];
      basariCB(base64, dosya.type || "image/jpeg");
    };
    reader.onerror = function(){ hataCB(); };
    reader.readAsDataURL(dosya);
  };

  var img = new Image();
  var url = URL.createObjectURL(dosya);
  img.onload = function(){
    try{
      var MAKS_KENAR = 2000; // AI okumasında küçük dijital rakamların net kalması için
      var genislik = img.naturalWidth, yukseklik = img.naturalHeight;
      if(genislik > MAKS_KENAR || yukseklik > MAKS_KENAR){
        var oran = Math.min(MAKS_KENAR/genislik, MAKS_KENAR/yukseklik);
        genislik = Math.round(genislik*oran);
        yukseklik = Math.round(yukseklik*oran);
      }
      var canvas = document.createElement("canvas");
      canvas.width = genislik;
      canvas.height = yukseklik;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0,0,genislik,yukseklik);
      ctx.drawImage(img, 0, 0, genislik, yukseklik);
      var dataUrl = canvas.toDataURL("image/jpeg", 0.93);
      URL.revokeObjectURL(url);
      basariCB(dataUrl.split(",")[1], "image/jpeg");
    }catch(e){
      URL.revokeObjectURL(url);
      yedekPlanaGec();
    }
  };
  img.onerror = function(){
    URL.revokeObjectURL(url);
    yedekPlanaGec();
  };
  img.src = url;
}

function kartFotoAlaniDoldur(id, deger){
  if(!deger) return;
  var el=document.getElementById(id);
  if(!el) return;
  el.value = deger;
  el.style.transition="background 0.3s";
  el.style.background="#fff3cd";
  setTimeout(function(){ el.style.background=""; }, 2500);
}

function kartFotoSecildi(input){
  var dosya = input.files && input.files[0];
  if(!dosya) return;
  kartFotoGonder(dosya, "firma", "kartFotoDurum", function(data){
    return kartFotoAlanDoldurTumu(data);
  });
  kartFotoAlaniniTemizle();
}

// "Yetkili İletişim Bilgileri" alanını fotoğraf/ekran görüntüsünden doldurur (Telefon + E-posta + varsa isim)
function yetkiliIletisimFotoSecildi(input, prefix){
  var dosya = input.files && input.files[0];
  if(!dosya) return;
  var durumElId = prefix+"YetkiliIletisimFotoDurum";
  kartFotoGonder(dosya, "yetkiliIletisim", durumElId, function(data){
    var isimEl = document.getElementById(prefix+"Yetkili");
    var telEl = document.getElementById(prefix+"YetkiliTelefon");
    var epostaEl = document.getElementById(prefix+"YetkiliEposta");
    if(data.yetkili && isimEl && !isimEl.value.trim()) kartFotoAlaniDoldur(prefix+"Yetkili", data.yetkili);
    if(data.telefon && telEl) kartFotoAlaniDoldur(prefix+"YetkiliTelefon", data.telefon);
    if(data.eposta && epostaEl) kartFotoAlaniDoldur(prefix+"YetkiliEposta", data.eposta);
    if(!data.telefon && !data.eposta && !data.yetkili){
      return false;
    }
  });
  input.value = "";
}

// Teslimat Adresi alanını fotoğraf/ekran görüntüsünden doldurur
function teslimatAdresiFotoSecildi(input, hedefFieldId){
  var dosya = input.files && input.files[0];
  if(!dosya) return;
  var durumElId = hedefFieldId+"FotoDurum";
  kartFotoGonder(dosya, "teslimatAdresi", durumElId, function(data){
    if(data.adres) kartFotoAlaniDoldur(hedefFieldId, data.adres);
    else return false;
  });
  input.value = "";
}

function kartFotoAlanDoldurTumu(data){
  var buluduMu = false;
  if(data.firmaAdi){ kartFotoAlaniDoldur("yeniMusteriAdi", turkceBaslikDuzeni(data.firmaAdi)); buluduMu = true; }
  if(data.sehir){ kartFotoAlaniDoldur("yeniMusteriSehir", turkceBaslikDuzeni(data.sehir)); buluduMu = true; }
  if(data.adres){ kartFotoAlaniDoldur("yeniMusteriAcikAdres", data.adres); buluduMu = true; }
  if(data.telefon){ kartFotoAlaniDoldur("yeniMusteriYetkiliTelefon", data.telefon); buluduMu = true; }
  if(data.eposta){ kartFotoAlaniDoldur("yeniMusteriYetkiliEposta", data.eposta); buluduMu = true; }
  if(data.vergiDairesi || data.vergiNo){
    kartFotoAlaniDoldur("yeniMusteriFatura", [data.vergiDairesi, data.vergiNo].filter(Boolean).join(" / "));
    buluduMu = true;
  }
  return buluduMu;
}
