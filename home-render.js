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

function karsilamaGuncelle(bugunVerisi){
  try{
    var el = document.getElementById("anaSayfaKarsilama");
    if(!el) return;
    var saat = new Date().getHours();
    var varMi = bugunVerisi && bugunVerisi.toplamEuro > 0;
    var mesaj;
    if(saat < 10) mesaj = varMi ? "Günaydın! Erken bir başlangıç yapmışsın bile." : "Günaydın! Güzel bir gün seni bekliyor.";
    else if(saat < 13) mesaj = varMi ? "Öğlene doğru güzel gidiyor, devam." : "Öğleye kadar bir fırsat daha var.";
    else if(saat < 18) mesaj = varMi ? "Bugün iyi iş çıkarıyorsun." : "Öğleden sonra hâlâ zaman var.";
    else if(saat < 21) mesaj = varMi ? "Günü güzel kapatıyorsun." : "Gün yavaş yavaş kapanıyor — yarın yeni bir fırsat.";
    else mesaj = "Günün sonu — dinlenmeyi hak ettin.";
    el.textContent = mesaj;
  }catch(e){ hataGoster("Karşılama güncellenemedi: " + e.message); }
}

function kartlariGuncelle(){
  try{
    var ay = WeiconData.buAyinVerisi();
    var bugun = WeiconData.bugununVerisi();

    setText("anaSayfaSatisToplam", WeiconData.fmt(ay.toplamEuro));
    setText("anaSayfaPrimToplam", WeiconData.fmt(ay.toplamPrim));
    setText("anaSayfaAyEtiketi", "EUR · " + ay.ayAd + " " + ay.yil);

    setText("anaSayfaBugunSatis", WeiconData.fmt(bugun.toplamEuro));
    setText("anaSayfaBugunPrim", WeiconData.fmt(bugun.toplamPrim));

    karsilamaGuncelle(bugun);
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
    document.getElementById("btnMenu").onclick = atlaBaglantisi("Menü");
    document.getElementById("btnHizliHesapla").onclick = atlaBaglantisi("Hızlı Hesapla");
    document.getElementById("btnRaporlar").onclick = atlaBaglantisi("Raporlar");
    document.getElementById("btnAracKm").onclick = atlaBaglantisi("Araç KM Takip");
  }catch(e){ hataGoster("Butonlar bağlanamadı: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  butonlariBagla();
  WeiconData.veriDegistiginde(kartlariGuncelle);
  // Firebase verisi henüz gelmemiş olabilir; ilk anda da bir kez dene.
  kartlariGuncelle();
});
