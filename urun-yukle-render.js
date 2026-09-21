/*
  urun-yukle-render.js (21.09.2026)
  ==================================
  Kök nedeni: Abdullah Firebase Console'da "Import JSON"ı urunler/ düğümünün
  İÇİNE değil, veritabanının EN KÖKÜNE uyguladı — bu da musteriler/arsiv gibi
  her şeyin üzerine yazılmasına yol açtı. Bu ekran o riski TAMAMEN ortadan
  kaldırıyor: kod her zaman db.ref("urunler") yoluna, başka hiçbir yere
  yazamaz — path sabit, elle Firebase Console'a hiç girilmiyor.

  Ayrıca yüklenen dosyanın gerçekten bir ürün listesi olduğu (berta/abas +
  urun + fiyat alanları) doğrulanmadan hiçbir yazma yapılmıyor — yanlış
  dosya (örn. tam yedek dosyası) seçilirse net bir hatayla reddediliyor.
*/
var secilenUrunler = null;

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

function sonucGoster(basariMi, mesaj){
  var kutu = document.getElementById("sonucKutu");
  kutu.hidden = false;
  kutu.style.background = basariMi ? "#eafaf0" : "#fdeaea";
  kutu.style.color = basariMi ? "#0e6b34" : "#c0392b";
  kutu.textContent = (basariMi ? "✓ " : "⚠️ ") + mesaj;
}

function dosyaSecildi(dosya){
  document.getElementById("onizlemeKutu").hidden = true;
  document.getElementById("sonucKutu").hidden = true;
  secilenUrunler = null;
  if(!dosya) return;
  var okuyucu = new FileReader();
  okuyucu.onload = function(e){
    var veri;
    try{ veri = JSON.parse(e.target.result); }
    catch(err){ sonucGoster(false, "Bu dosya geçerli bir JSON değil."); return; }

    if(!Array.isArray(veri)){
      sonucGoster(false, "Bu dosya bir ürün LİSTESİ (dizi/array) değil — yanlış dosya seçmiş olabilirsin.");
      return;
    }
    if(veri.length === 0){
      sonucGoster(false, "Liste boş, hiç ürün yok.");
      return;
    }
    var geçersizSayisi = 0;
    veri.forEach(function(u){
      var kodVar = !!(u && (u.berta || u.abas));
      var adVar = !!(u && u.urun);
      var fiyatVar = u && typeof u.fiyat === "number";
      if(!kodVar || !adVar || !fiyatVar) geçersizSayisi++;
    });
    if(geçersizSayisi > 0){
      sonucGoster(false, geçersizSayisi + " kayıt ürün formatına uymuyor (berta/abas, urun, fiyat alanları eksik) — bu dosya bir ürün listesi olmayabilir.");
      return;
    }

    secilenUrunler = veri;
    document.getElementById("onizlemeOzet").textContent = veri.length + " ürün bulundu.";
    var ilkUc = veri.slice(0, 3).map(function(u){
      return "• " + (u.urun||"") + " — " + (u.fiyat!=null?u.fiyat.toFixed(2):"?") + " EUR (Berta: " + (u.berta||"-") + ", Abas: " + (u.abas||"-") + ")";
    }).join("<br>");
    document.getElementById("onizlemeListe").innerHTML = ilkUc + (veri.length>3 ? "<br>…ve " + (veri.length-3) + " ürün daha" : "");
    document.getElementById("onizlemeKutu").hidden = false;
  };
  okuyucu.onerror = function(){ sonucGoster(false, "Dosya okunamadı."); };
  okuyucu.readAsText(dosya, "UTF-8");
}

function onayVeYukle(){
  if(!secilenUrunler || !secilenUrunler.length) return;
  var btn = document.getElementById("btnOnayYukle");
  var eskiMetin = btn.textContent;
  btn.disabled = true;
  btn.textContent = "⏳ Yükleniyor...";
  try{
    // KASITLI OLARAK sabit ve tek yol: sadece "urunler". Başka hiçbir
    // db.ref() çağrısı bu dosyada yok.
    firebase.database().ref("urunler").set(secilenUrunler).then(function(){
      sonucGoster(true, secilenUrunler.length + " ürün başarıyla yüklendi. Sadece 'urunler' güncellendi, başka hiçbir veriye dokunulmadı.");
      document.getElementById("onizlemeKutu").hidden = true;
      btn.disabled = false;
      btn.textContent = eskiMetin;
    }).catch(function(err){
      sonucGoster(false, "Yükleme başarısız: " + (err && err.message ? err.message : "bilinmeyen hata"));
      btn.disabled = false;
      btn.textContent = eskiMetin;
    });
  }catch(e){
    sonucGoster(false, "Yükleme başlatılamadı: " + e.message);
    btn.disabled = false;
    btn.textContent = eskiMetin;
  }
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  document.getElementById("btnDosyaSec").onclick = function(){ document.getElementById("jsonFileInput").click(); };
  document.getElementById("jsonFileInput").onchange = function(e){ dosyaSecildi(e.target.files[0]); };
  document.getElementById("btnOnayYukle").onclick = onayVeYukle;
  document.documentElement.style.visibility = 'visible';
});
