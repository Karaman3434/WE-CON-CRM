/*
  ziyaret-render.js
  =================
  Aylık takvim görünümü: Pazartesi başlangıç, Cmt/Paz kırmızı. Güne
  dokununca o günün kayıtları + yeni kayıt ekleme paneli açılır.
  Sayfa açıldığında bugüne ait hatırlatmalar varsa uyarı popup'ı gösterilir.
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

var AY_ADLARI = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
var GUN_ADLARI = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];

function tarihiGuncelle(){
  try{
    var el = document.getElementById("gunTarihi");
    if(!el) return;
    var d = new Date();
    el.textContent = GUN_ADLARI[d.getDay()] + ", " + d.getDate() + " " + AY_ADLARI[d.getMonth()] + " " + d.getFullYear();
  }catch(e){ hataGoster("Tarih güncellenemedi: " + e.message); }
}

function htmlEsc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function gunAnahtari(yil, ay, gun){
  return yil + "-" + String(ay+1).padStart(2,"0") + "-" + String(gun).padStart(2,"0");
}

var goruntulenenYil, goruntulenenAy; // ay: 0-11
var seciliGunAnahtari = null;
var seciliFirma = null;
var seciliTur = "ziyaret";

function takvimiCiz(){
  try{
    document.getElementById("ziyAyBaslik").textContent = AY_ADLARI[goruntulenenAy] + " " + goruntulenenYil;

    var kayitlar = CustomerData.tumZiyaretTemaslar();
    var gunSayilari = {};
    kayitlar.forEach(function(k){
      var d = new Date(k.ts);
      var anahtar = gunAnahtari(d.getFullYear(), d.getMonth(), d.getDate());
      gunSayilari[anahtar] = (gunSayilari[anahtar]||0) + 1;
    });

    var ilkGun = new Date(goruntulenenYil, goruntulenenAy, 1);
    // JS: Pazar=0..Cumartesi=6 → Pazartesi başlangıçlı indekse çevir
    var bosluk = (ilkGun.getDay() + 6) % 7;
    var gunSayisi = new Date(goruntulenenYil, goruntulenenAy+1, 0).getDate();
    var bugun = new Date();
    var bugunAnahtar = gunAnahtari(bugun.getFullYear(), bugun.getMonth(), bugun.getDate());

    var html = "";
    for(var b=0; b<bosluk; b++) html += "<div class='ziy-gun-hucre ziy-gun-hucre--bos'></div>";
    for(var g=1; g<=gunSayisi; g++){
      var anahtar = gunAnahtari(goruntulenenYil, goruntulenenAy, g);
      var haftaGunu = new Date(goruntulenenYil, goruntulenenAy, g).getDay();
      var tatilMi = haftaGunu===0 || haftaGunu===6;
      var sayi = gunSayilari[anahtar] || 0;
      var siniflar = "ziy-gun-hucre";
      if(tatilMi) siniflar += " ziy-gun-hucre--tatil";
      if(anahtar===bugunAnahtar) siniflar += " ziy-gun-hucre--bugun";
      if(anahtar===seciliGunAnahtari) siniflar += " ziy-gun-hucre--secili";
      html += "<div class='" + siniflar + "' data-anahtar='" + anahtar + "'>"
        + g
        + (sayi>0 ? "<span class='ziy-gun-rozet'>" + sayi + "</span>" : "")
        + "</div>";
    }
    document.getElementById("ziyTakvimGrid").innerHTML = html;

    document.querySelectorAll(".ziy-gun-hucre:not(.ziy-gun-hucre--bos)").forEach(function(hucre){
      hucre.onclick = function(){
        seciliGunAnahtari = this.getAttribute("data-anahtar");
        takvimiCiz();
        gunPaneliniAc(seciliGunAnahtari, kayitlar);
      };
    });
  }catch(e){ hataGoster("Takvim çizilemedi: " + e.message); }
}

function gunPaneliniAc(anahtar, tumKayitlar){
  try{
    var parca = anahtar.split("-");
    var gosterimTarih = parca[2] + " " + AY_ADLARI[parseInt(parca[1],10)-1] + " " + parca[0];
    document.getElementById("ziyGunPanelBaslik").textContent = gosterimTarih + " — seçili gün";

    var buGununKayitlari = tumKayitlar.filter(function(k){
      var d = new Date(k.ts);
      return gunAnahtari(d.getFullYear(), d.getMonth(), d.getDate()) === anahtar;
    });

    var kapsayici = document.getElementById("ziyGunKayitListesi");
    var bos = document.getElementById("ziyGunKayitBos");
    if(buGununKayitlari.length === 0){
      kapsayici.innerHTML = "";
      bos.hidden = false;
    } else {
      bos.hidden = true;
      kapsayici.innerHTML = buGununKayitlari.map(function(k){
        var turEtiket = k.tur==="temas" ? "☎ Temas" : "📍 Ziyaret";
        var turRenk = k.tur==="temas" ? "#8e44ad" : "#0e6b34";
        return "<div class='ziy-kayit-karti'>"
          + "<div class='ziy-kayit-musteri'>" + htmlEsc(k.musteri) + "</div>"
          + "<div class='ziy-kayit-tur' style='color:" + turRenk + "'>" + turEtiket + (k.not ? " — " + htmlEsc(k.not) : "") + "</div>"
          + "</div>";
      }).join("");
    }

    seciliFirma = null;
    seciliTur = "ziyaret";
    document.getElementById("ziySeciliFirma").hidden = true;
    document.getElementById("ziyFirmaAra").value = "";
    document.getElementById("ziyFirmaSonuclari").innerHTML = "";
    document.getElementById("ziyNot").value = "";
    document.getElementById("ziyHatirlatmaCheck").checked = false;
    document.getElementById("ziyHatirlatmaTarih").hidden = true;
    document.getElementById("ziyHatirlatmaTarih").value = anahtar;
    turSecimGuncelle();

    document.getElementById("ziyGunPanel").hidden = false;
    document.getElementById("ziyGunPanel").scrollIntoView({behavior:"smooth", block:"start"});
  }catch(e){ hataGoster("Gün paneli açılamadı: " + e.message); }
}

function turSecimGuncelle(){
  document.getElementById("btnTurZiyaret").classList.toggle("ziy-tur-btn--secili", seciliTur==="ziyaret");
  document.getElementById("btnTurTemas").classList.toggle("ziy-tur-btn--secili", seciliTur==="temas");
}

function firmaAramaCiz(){
  var q = document.getElementById("ziyFirmaAra").value;
  var kapsayici = document.getElementById("ziyFirmaSonuclari");
  if(!q || q.trim().length===0){ kapsayici.innerHTML = ""; return; }
  var sonuclar = CustomerData.ara(q).slice(0, 8);
  kapsayici.innerHTML = sonuclar.map(function(m){
    return "<div class='ziy-firma-satir' data-ad='" + htmlEsc(m.ad) + "' data-sehir='" + htmlEsc(m.sehir||"") + "'>" + htmlEsc(m.ad) + " <span class='ziy-firma-sehir'>" + htmlEsc(m.sehir||"") + "</span></div>";
  }).join("");
  kapsayici.querySelectorAll(".ziy-firma-satir").forEach(function(satir){
    satir.onclick = function(){
      seciliFirma = {ad: this.getAttribute("data-ad"), sehir: this.getAttribute("data-sehir")};
      document.getElementById("ziySeciliFirma").hidden = false;
      document.getElementById("ziySeciliFirma").textContent = "✓ " + seciliFirma.ad;
      kapsayici.innerHTML = "";
      document.getElementById("ziyFirmaAra").value = "";
    };
  });
}

function hatirlatmalariKontrolEt(){
  try{
    var liste = CustomerData.hatirlatmalarBugun();
    if(liste.length === 0) return;
    document.getElementById("ziyHatirlatmaListesi").innerHTML = liste.map(function(z){
      var turEtiket = z.tur==="temas" ? "☎ Temas" : "📍 Ziyaret";
      return "<div class='ziy-kayit-karti'>"
        + "<div class='ziy-kayit-musteri'>" + htmlEsc(z.musteri) + "</div>"
        + "<div class='ziy-kayit-tur'>" + turEtiket + (z.not ? " — " + htmlEsc(z.not) : "") + "</div>"
        + "</div>";
    }).join("");
    document.getElementById("ziyHatirlatmaOverlay").hidden = false;
  }catch(e){ hataGoster("Hatırlatmalar kontrol edilemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  var simdi = new Date();
  goruntulenenYil = simdi.getFullYear();
  goruntulenenAy = simdi.getMonth();

  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  document.getElementById("btnOncekiAy").onclick = function(){
    goruntulenenAy--;
    if(goruntulenenAy<0){ goruntulenenAy=11; goruntulenenYil--; }
    seciliGunAnahtari = null;
    document.getElementById("ziyGunPanel").hidden = true;
    takvimiCiz();
  };
  document.getElementById("btnSonrakiAy").onclick = function(){
    goruntulenenAy++;
    if(goruntulenenAy>11){ goruntulenenAy=0; goruntulenenYil++; }
    seciliGunAnahtari = null;
    document.getElementById("ziyGunPanel").hidden = true;
    takvimiCiz();
  };
  document.getElementById("btnZiyGunKapat").onclick = function(){
    document.getElementById("ziyGunPanel").hidden = true;
    seciliGunAnahtari = null;
    takvimiCiz();
  };

  document.getElementById("ziyFirmaAra").addEventListener("input", firmaAramaCiz);
  document.getElementById("btnTurZiyaret").onclick = function(){ seciliTur = "ziyaret"; turSecimGuncelle(); };
  document.getElementById("btnTurTemas").onclick = function(){ seciliTur = "temas"; turSecimGuncelle(); };
  document.getElementById("ziyHatirlatmaCheck").addEventListener("change", function(){
    document.getElementById("ziyHatirlatmaTarih").hidden = !this.checked;
  });

  document.getElementById("btnZiyKaydet").onclick = function(){
    if(!seciliFirma){ hataGoster("Önce bir firma seç."); return; }
    var not = document.getElementById("ziyNot").value;
    var hatirlatma = document.getElementById("ziyHatirlatmaCheck").checked
      ? document.getElementById("ziyHatirlatmaTarih").value
      : null;
    var btn = document.getElementById("btnZiyKaydet");
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";
    CustomerData.ziyaretEkle(seciliFirma.ad, not, seciliTur, hatirlatma, function(basarili, err){
      btn.disabled = false;
      btn.textContent = "✓ Kaydet";
      if(basarili){
        document.getElementById("ziyGunPanel").hidden = true;
        takvimiCiz();
      } else {
        hataGoster("Kaydedilemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
      }
    });
  };

  document.getElementById("btnZiyHatirlatmaKapat").onclick = function(){
    document.getElementById("ziyHatirlatmaOverlay").hidden = true;
  };

  CustomerData.listeDegistiginde(function(){ if(seciliGunAnahtari===null) takvimiCiz(); });
  takvimiCiz();
  hatirlatmalariKontrolEt();
});
