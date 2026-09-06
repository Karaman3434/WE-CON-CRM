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

function hesabaYatacakGuncelle(){
  try{
    var el = document.getElementById("anasayfaYatacakDeger");
    if(!el || typeof MaasOzetVeri === "undefined") return;
    var ozet = MaasOzetVeri.acikDonemHesapla();
    el.textContent = ozet.hesabaYatacak.toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2}) + " TL";
  }catch(e){ hataGoster("Hesaba yatacak güncellenemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

// Ana Sayfa'daki eski ayrı kur şeridi kaldırıldı — döviz kuru artık global
// header'da gösteriliyor (bkz. ust-sabit-olcum.js: dovizKuruHeaderaEkle).

function motivasyonuGuncelle(){
  try{
    if(typeof MOTIVASYON_SOZLERI === "undefined") return;
    var simdi = new Date();
    var selamEl = document.getElementById("motivasyonSelam");
    var sozEl = document.getElementById("motivasyonSoz");
    if(selamEl) selamEl.textContent = motivasyonSelamlamaGetir(simdi.getHours()) + ", Abdullah";
    if(sozEl) sozEl.textContent = "\u201c" + motivasyonSozunuGetir(simdi) + "\u201d";
  }catch(e){}
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  motivasyonuGuncelle();
  // Saat başı/2 saatte bir değişimi yakalamak için hafif bir dakika
  // kontrolü yeterli — saniyede bir çalışan gereksiz bir zamanlayıcı
  // kurulmuyor (60 sn'de bir küçük bir metin güncellemesi, performansa
  // etkisi yok).
  setInterval(motivasyonuGuncelle, 60000);
  butonlariBagla();
  WeiconData.veriDegistiginde(kartlariGuncelle);
  WeiconData.bildirimDegistiginde(bildirimBanneriGuncelle);
  WeiconData.bildirimVerisiDinlemeyeBasla();
  document.getElementById("bildirimBanner").onclick = function(){ window.location.href = "bildirimler.html"; };
  // Firebase verisi henüz gelmemiş olabilir; ilk anda da bir kez dene.
  kartlariGuncelle();
  if(typeof KmData !== "undefined"){ KmData.degistiginde(kmDurumuGuncelle); kmDurumuGuncelle(); }

  // Ana Sayfa'daki "HESABA YATACAK" kutusu — Maaş + Prim Hesaplama
  // sayfasındaki açık dönem kartıyla aynı canlı rakamı gösterir.
  hesabaYatacakGuncelle();
  try{ KomisyonData.degistiginde(hesabaYatacakGuncelle); }catch(e){}
  try{ AvansKayitData.degistiginde(hesabaYatacakGuncelle); }catch(e){}
  try{ MaasKayitData.degistiginde(hesabaYatacakGuncelle); }catch(e){}

  // Döviz kuru artık global header'da gösteriliyor; Ana Sayfa'nın kendi
  // ayrı kur şeridi ve yenile butonu kaldırıldı (Ayarlar'daki "Şimdi Dene"
  // ile manuel tazeleme hâlâ mümkün).
});
