// WE-CON-CRM — Visit photo and contact UI helpers
// Extracted without changing the existing global API.

function resimSikistir(file, callback){
  var reader = new FileReader();
  reader.onload = function(e){
    var img = new Image();
    img.onload = function(){
      var maxW = 1000;
      var scale = Math.min(1, maxW/img.width);
      var canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width*scale);
      canvas.height = Math.round(img.height*scale);
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function ziyaretFotoSecildi(inputEl){
  var files = inputEl.files;
  if(!files || files.length===0) return;
  for(var i=0;i<files.length;i++){
    (function(file){
      resimSikistir(file, function(dataUrl){
        var geciciIdx = ziyaretSeciliFotolar.length;
        ziyaretSeciliFotolar.push({durum:"yukleniyor", onizleme:dataUrl});
        ziyaretFotoGaleriOlustur();
        if(window.fbUploadFoto){
          window.fbUploadFoto(dataUrl).then(function(url){
            ziyaretSeciliFotolar[geciciIdx] = {durum:"hazir", url:url, onizleme:dataUrl};
            ziyaretFotoGaleriOlustur();
          }).catch(function(e){
            console.error("Foto yükleme hatası", e);
            ziyaretSeciliFotolar[geciciIdx] = {durum:"hata", onizleme:dataUrl};
            ziyaretFotoGaleriOlustur();
            showToast("⚠️ Fotoğraf yüklenemedi, internet bağlantınızı kontrol edip tekrar deneyin.", 5000);
          });
        } else {
          ziyaretSeciliFotolar[geciciIdx] = {durum:"hazir", url:dataUrl, onizleme:dataUrl};
          ziyaretFotoGaleriOlustur();
        }
      });
    })(files[i]);
  }
  inputEl.value = "";
}

function ziyaretFotoSil(idx){
  var f = ziyaretSeciliFotolar[idx];
  ziyaretSeciliFotolar.splice(idx,1);
  ziyaretFotoGaleriOlustur();
  if(f && f.durum==="hazir" && f.url && storage && f.url.indexOf("firebasestorage")>=0){
    try{ storage.refFromURL(f.url).delete().catch(function(e){ console.error("Firebase yazma hatası:", e); }); }catch(e){}
  }
}

function ziyaretFotoGaleriOlustur(){
  var el = document.getElementById("ziyaretFotoGalerisi");
  if(!el) return;
  if(ziyaretSeciliFotolar.length===0){ el.innerHTML=""; return; }
  var html = "";
  ziyaretSeciliFotolar.forEach(function(f, idx){
    var gosterilecekSrc = f.url || f.onizleme;
    var overlay = "";
    if(f.durum==="yukleniyor") overlay = "<div style='position:absolute;inset:0;background:rgba(0,0,0,.45);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800;text-align:center;'>Yükleniyor...</div>";
    if(f.durum==="hata") overlay = "<div style='position:absolute;inset:0;background:rgba(224,82,74,.55);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800;text-align:center;'>Hata!</div>";
    html += "<div style='position:relative;'>"
      +"<img src='"+gosterilecekSrc+"' onclick=\"ziyaretFotoBuyukGoster("+idx+")\" style='width:90px;height:90px;object-fit:cover;border-radius:8px;border:1px solid #ccc;cursor:pointer;display:block;'>"
      +overlay
      +"<button type='button' onclick='event.stopPropagation();ziyaretFotoSil("+idx+")' style='position:absolute;top:-8px;right:-8px;background:#e0524a;color:#fff;border:2px solid #fff;border-radius:50%;width:26px;height:26px;font-size:16px;font-weight:bold;cursor:pointer;line-height:1;'>×</button>"
      +"</div>";
  });
  el.innerHTML = html;
}

function ziyaretFotoBuyukGoster(idx){
  var f = ziyaretSeciliFotolar[idx];
  if(!f) return;
  document.getElementById("fotoBuyukGosterImg").src = f.url || f.onizleme;
  document.getElementById("fotoBuyukGosterModal").style.display="flex";
}

function yetkiliKisiEtiketGuncelle(){
  var btn = document.getElementById("yetkiliKisiSecBtn");
  if(!btn) return;
  if(seciliYetkiliKisi && seciliYetkiliKisi.isim){
    var m = musteriListesi[musteriKartIdx];
    var firmaAdi = m ? (m.ad||"") : "";
    btn.innerHTML = (firmaAdi ? firmaAdi+" - " : "")+"<b>"+seciliYetkiliKisi.isim+"</b> <span style='float:right;color:#e0524a;font-weight:900;' onclick='event.stopPropagation();yetkiliKisiTemizle();'>✕</span>";
  } else {
    btn.innerHTML = "👥 Yetkilileri Gör";
  }
}

function yetkiliKisiTemizle(){
  seciliYetkiliKisi = null;
  localStorage.removeItem("weicon_secili_yetkili");
  yetkiliKisiEtiketGuncelle();
  if(typeof musteriSeritiGuncelle==="function") musteriSeritiGuncelle();
}

function ziyaretKisiEtiketGuncelle(){
  var btn = document.getElementById("ziyaretKisiSecBtn");
  if(!btn) return;
  if(ziyaretSeciliKisi && ziyaretSeciliKisi.isim){
    var altBilgi = [ziyaretSeciliKisi.bolum, ziyaretSeciliKisi.gorev].filter(Boolean).join(" · ");
    btn.innerHTML = "👤 <b>"+ziyaretSeciliKisi.isim+"</b>"+(altBilgi ? " <span style='font-weight:400;color:#667;font-size:0.8em;'>("+altBilgi+")</span>" : "")+" <span style='float:right;color:#e0524a;font-weight:900;' onclick='event.stopPropagation();ziyaretKisiTemizle();'>✕</span>";
  } else {
    btn.innerHTML = "👤 Kişi Seç";
  }
}

function ziyaretKisiTemizle(){
  ziyaretSeciliKisi = null;
  ziyaretKisiEtiketGuncelle();
}
