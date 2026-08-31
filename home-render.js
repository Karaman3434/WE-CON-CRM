/*
  home-render.js
  ==============
  Bu dosyanın TEK görevi: WeiconData'dan veriyi okuyup ekrana (DOM'a) yazmak.
  Hiçbir hesaplama yapmaz, hiçbir Firebase çağrısı içermez.

  GÜVENLİK AĞI: Her fonksiyon try/catch ile korunuyor ve herhangi bir hata
  ekranda görünür bir uyarı olarak gösteriliyor — "sessiz bozulma" olmasın.
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
  }catch(e){ hataGoster("Tarih güncellenemedi: " + e.message); }
}

function kartlariGuncelle(){
  try{
    var ay = WeiconData.buAyinVerisi();
    var bugun = WeiconData.bugununVerisi();

    setText("anaSayfaSatisToplam", WeiconData.fmt(ay.toplamEuro));
    setText("anaSayfaSatisToplamTl", "≈ " + WeiconData.fmt(ay.toplamEuroTl) + " TL");
    setText("anaSayfaPrimToplam", WeiconData.fmt(ay.toplamPrim));
    setText("anaSayfaAyEtiketi", "EUR · " + ay.ayAd + " " + ay.yil);

    setText("anaSayfaBugunSatis", WeiconData.fmt(bugun.toplamEuro));
    setText("anaSayfaBugunSatisTl", "≈ " + WeiconData.fmt(bugun.toplamEuroTl) + " TL");
    setText("anaSayfaBugunPrim", WeiconData.fmt(bugun.toplamPrim));

  }catch(e){ hataGoster("Kartlar güncellenemedi: " + e.message); }
}

function setText(id, deger){
  var el = document.getElementById(id);
  if(el) el.textContent = deger;
  else console.warn("Element bulunamadı:", id);
}

function butonlariBagla(){
  try{
    var atlaBaglantisi = function(ad){
      return function(){ alert(ad + " — sonraki adımda bağlanacak."); };
    };
    document.getElementById("btnGeri").onclick = atlaBaglantisi("Geri");
    document.getElementById("btnAnaSayfa").onclick = function(){ kartlariGuncelle(); };
  }catch(e){ hataGoster("Butonlar bağlanamadı: " + e.message); }
}

function bildirimBanneriGuncelle(){
  try{
    var ozet = WeiconData.bildirimOzetiHesapla();
    var banner = document.getElementById("bildirimBanner");
    if(ozet.toplam === 0){
      banner.hidden = true;
      return;
    }
    banner.hidden = false;
    var parcalar = [];
    if(ozet.acikSurecSayisi > 0) parcalar.push(ozet.acikSurecSayisi + " açık süreç (15+ gün)");
    if(ozet.gecikmisGorevSayisi > 0) parcalar.push(ozet.gecikmisGorevSayisi + " gecikmiş görev");
    document.getElementById("bildirimBannerAlt").textContent = parcalar.join(" · ");
  }catch(e){ hataGoster("Bildirim banner'ı güncellenemedi: " + e.message); }
}

function kmDurumuGuncelle(){
  try{
    var el = document.getElementById("kmDurumAlt");
    if(!el || typeof KmData === "undefined") return;
    var bugun = KmData.kaydiOku(KmData.bugunAnahtari());
    if(bugun && bugun.km!=null && bugun.km!==""){
      el.textContent = "✓ Bugün: " + bugun.km + " km girildi";
      el.classList.add("menu-alt--basarili");
    } else {
      el.textContent = "TAKİP";
      el.classList.remove("menu-alt--basarili");
    }
  }catch(e){ hataGoster("KM durumu güncellenemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

function kurSeridiniGuncelle(){
  try{
    var el = document.getElementById("anasayfaKurSerit");
    if(!el) return;
    var kur = parseFloat(localStorage.getItem("weicon_kur"));
    document.getElementById("anasayfaKurDeger").textContent = isNaN(kur) ? "—" : WeiconData.fmt(kur) + " TL";

    var zaman = parseFloat(localStorage.getItem("weicon_kur_zaman"));
    var kaynak = localStorage.getItem("weicon_kur_kaynak");
    var kaynakAdi = kaynak==="tcmb" ? "TCMB" : (kaynak==="yedek" ? "yedek kaynak" : (kaynak==="frankfurter" ? "Frankfurter" : ""));
    var zamanEl = document.getElementById("anasayfaKurZaman");
    var bayatMi = typeof AyarlarSync !== "undefined" && AyarlarSync.kurBayatMi();
    if(isNaN(zaman) || zaman<=0){
      zamanEl.textContent = "hiç güncellenmedi";
    } else {
      var farkDk = Math.round((Date.now() - zaman) / 60000);
      var zamanMetni;
      if(farkDk < 1) zamanMetni = "az önce";
      else if(farkDk < 60) zamanMetni = farkDk + " dk önce";
      else zamanMetni = Math.floor(farkDk/60) + " sa " + (farkDk%60) + " dk önce";
      zamanEl.textContent = zamanMetni + (kaynakAdi ? " · " + kaynakAdi : "");
    }
    el.classList.toggle("anasayfa-kur-serit--bayat", !!bayatMi);
  }catch(e){}
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  butonlariBagla();
  WeiconData.veriDegistiginde(kartlariGuncelle);
  WeiconData.bildirimDegistiginde(bildirimBanneriGuncelle);
  WeiconData.bildirimVerisiDinlemeyeBasla();
  document.getElementById("bildirimBanner").onclick = function(){ window.location.href = "bildirimler.html"; };
  // Firebase verisi henüz gelmemiş olabilir; ilk anda da bir kez dene.
  kartlariGuncelle();
  if(typeof KmData !== "undefined"){ KmData.degistiginde(kmDurumuGuncelle); kmDurumuGuncelle(); }

  // Ana Sayfa'daki kur şeridi — sayfa her açıldığında güncel bilgiyi
  // gösterir; "🔄" tuşuyla elle de tazelenebilir.
  kurSeridiniGuncelle();
  if(typeof AyarlarSync !== "undefined"){
    AyarlarSync.degistiginde(kurSeridiniGuncelle);
    setInterval(kurSeridiniGuncelle, 60000); // sayfa açık kalırsa "X dk önce" yazısını da tazele
  }
  document.getElementById("btnAnasayfaKurYenile").onclick = function(){
    var btn = this;
    btn.disabled = true;
    btn.textContent = "⏳";
    if(typeof AyarlarSync === "undefined"){ btn.disabled = false; btn.textContent = "🔄"; return; }
    AyarlarSync.otomatikKurGetir(true, function(basarili){
      kurSeridiniGuncelle();
      btn.disabled = false;
      btn.textContent = basarili ? "✓" : "✕";
      setTimeout(function(){ btn.textContent = "🔄"; }, 1500);
    });
  };
});
