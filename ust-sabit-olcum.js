/*
  ust-sabit-olcum.js
  ====================
  TEK görevi: sabit (sticky) üst şeridin (.app-ust-sabit — logo/tarih +
  Geri/Ana Sayfa/Menü) o an ekranda kapladığı GERÇEK yüksekliği ölçüp bir CSS
  değişkenine (--ust-sabit-yukseklik) yazmak. Popup'lar (.overlay, vb.) bu
  değişkeni kullanarak üst şeridin TAM ALTINDAN açılır — sabit bir piksel
  tahmini değil, o anki gerçek render'dan alınan değer.

  Bilerek İZOLE ve KIRILGAN OLMAYAN bir dosya: her şey try/catch içinde,
  hata olursa CSS zaten güvenli bir varsayılana (100px) düşer — bu dosya asla
  sayfanın geri kalanını bozamaz.
*/
(function(){
  function olc(){
    try{
      var el = document.querySelector(".app-ust-sabit");
      if(!el) return;
      var h = el.getBoundingClientRect().height;
      if(h > 0) document.documentElement.style.setProperty("--ust-sabit-yukseklik", h + "px");
    }catch(e){}
  }

  // Döviz Kuru — artık global üst header'ın sağında, tek kaynaktan
  // (localStorage "weicon_kur", Ayarlar'daki otomatik senkron mantığı ile
  // aynı) besleniyor. Ana Sayfa ve Hızlı Hesapla'daki eski ayrı satırlar
  // kaldırıldı (05.09.2026).
  function headerKuruGuncelle(){
    try{
      var el = document.getElementById("headerKurDeger");
      if(!el) return;
      var kur = parseFloat(localStorage.getItem("weicon_kur"));
      el.textContent = isNaN(kur) ? "-" : kur.toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:4});
    }catch(e){}
  }
  function dovizKuruHeaderaEkle(){
    try{
      var header = document.querySelector(".app-header");
      if(!header || header.querySelector(".header-kur-blok")) { headerKuruGuncelle(); return; }
      var logo = header.querySelector(".logo");
      var tarih = header.querySelector(".tarih");
      if(!logo || !tarih) return;
      var solGrup = document.createElement("div");
      solGrup.className = "header-sol-grup";
      header.insertBefore(solGrup, logo);
      solGrup.appendChild(logo);
      solGrup.appendChild(tarih);
      var kurBlok = document.createElement("div");
      kurBlok.className = "header-kur-blok";
      kurBlok.innerHTML = "<span class='header-kur-etiket'>Döviz Kuru</span><span class='header-kur-deger' id='headerKurDeger'>-</span>";
      header.appendChild(kurBlok);
      headerKuruGuncelle();
    }catch(e){}
  }

  function hazirlik(){ olc(); dovizKuruHeaderaEkle(); }

  try{
    document.addEventListener("DOMContentLoaded", hazirlik);
    window.addEventListener("resize", olc);
    window.addEventListener("load", hazirlik);
    window.addEventListener("weiconAuthHazir", hazirlik);
    window.addEventListener("storage", function(ev){ if(ev.key === "weicon_kur") headerKuruGuncelle(); });
  }catch(e){}
})();
