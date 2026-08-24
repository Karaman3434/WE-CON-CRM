function hataGoster(mesaj){
  console.error(mesaj);
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
  }catch(e){ hataGoster("Tarih güncellenemedi: " + e.message); }
}

function yedekleTiklandi(){
  try{
    var db = firebase.database();
    Promise.all([
      db.ref("musteriler").once("value"),
      db.ref("arsiv").once("value")
    ]).then(function(sonuclar){
      var musterilerSnap = sonuclar[0].val();
      var arsivSnap = sonuclar[1].val() || {};
      var musteriler = musterilerSnap ? (Array.isArray(musterilerSnap) ? musterilerSnap.filter(Boolean) : Object.values(musterilerSnap)) : [];
      var kdv = parseFloat(localStorage.getItem("weicon_kdv_orani")) || 20;

      var yedek = {
        yedekTarihi: new Date().toISOString(),
        kdvOrani: kdv,
        musteriler: musteriler,
        arsiv: arsivSnap
      };

      var blob = new Blob([JSON.stringify(yedek, null, 2)], {type:"application/json"});
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      var bugun = new Date();
      var tarihStr = bugun.getFullYear()+"-"+String(bugun.getMonth()+1).padStart(2,"0")+"-"+String(bugun.getDate()).padStart(2,"0");
      a.href = url;
      a.download = "WEICON_ASIST_Yedek_"+tarihStr+".json";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      localStorage.setItem("weicon_son_yedek_ts", Date.now());

      var siparisSayisi = ((arsivSnap.siparis||[]).length||0)+((arsivSnap.teklif||[]).length||0)+((arsivSnap.proforma||[]).length||0)+((arsivSnap.numune||[]).length||0);
      alert("✓ Yedek indirildi: " + musteriler.length + " müşteri, " + siparisSayisi + " işlem kaydı.");
    }).catch(function(err){
      hataGoster("Yedekleme başarısız: " + (err && err.message ? err.message : "bilinmeyen hata"));
    });
  }catch(e){ hataGoster("Yedekleme başlatılamadı: " + e.message); }
}

function jsonDosyasiSecildi(dosya){
  if(!dosya) return;
  var okuyucu = new FileReader();
  okuyucu.onload = function(){
    try{
      var yedek = JSON.parse(okuyucu.result);
      if(!yedek.musteriler || !yedek.arsiv){
        hataGoster("Geçersiz yedek dosyası — musteriler/arsiv alanları bulunamadı.");
        return;
      }
      var mesaj = "Bu dosyadan geri yüklenecek:\n"
        + "• " + yedek.musteriler.length + " müşteri\n"
        + "• " + ((yedek.arsiv.siparis||[]).length + (yedek.arsiv.teklif||[]).length + (yedek.arsiv.proforma||[]).length + (yedek.arsiv.numune||[]).length) + " işlem kaydı\n"
        + (yedek.yedekTarihi ? "Yedek tarihi: " + new Date(yedek.yedekTarihi).toLocaleString("tr-TR") + "\n" : "")
        + "\nMEVCUT verilerin ÜZERİNE YAZILACAK. Devam edilsin mi?";
      if(!confirm(mesaj)) return;

      var db = firebase.database();
      Promise.all([
        db.ref("musteriler").set(yedek.musteriler),
        db.ref("arsiv").set(yedek.arsiv)
      ]).then(function(){
        if(yedek.kdvOrani) localStorage.setItem("weicon_kdv_orani", yedek.kdvOrani);
        alert("✓ Geri yükleme tamamlandı.");
      }).catch(function(err){
        hataGoster("Geri yükleme başarısız: " + (err && err.message ? err.message : "bilinmeyen hata"));
      });
    }catch(e){
      hataGoster("Dosya okunamadı: geçerli bir JSON değil.");
    }
  };
  okuyucu.readAsText(dosya);
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  document.getElementById("btnYedekle").onclick = yedekleTiklandi;
  document.getElementById("btnJsonYukle").onclick = function(){ document.getElementById("jsonFileInput").click(); };
  document.getElementById("jsonFileInput").addEventListener("change", function(){
    jsonDosyasiSecildi(this.files[0]);
    this.value = "";
  });
});
