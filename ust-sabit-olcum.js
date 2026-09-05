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

      // Sol kanat: tarih. Logo bu kanadın DIŞINA, iki kanadın arasına
      // konur — böylece iki taraf da flex:1 olduğundan logo satırın tam
      // ortasında sabit kalır (05.09.2026).
      var solKanat = document.createElement("div");
      solKanat.className = "header-tarih-kanat";
      header.insertBefore(solKanat, tarih);
      solKanat.appendChild(tarih);
      header.appendChild(logo);

      var kurBlok = document.createElement("div");
      kurBlok.className = "header-kur-blok";
      kurBlok.innerHTML = "<span class='header-kur-deger-grup'><span class='header-kur-etiket'>Döviz Kuru</span><span class='header-kur-deger' id='headerKurDeger'>-</span></span>";
      // Elle yenileme butonu — sadece AyarlarSync bu sayfada yüklüyse
      // eklenir (Ayarlar'daki "Şimdi Dene" ile birebir aynı işlevi çağırır).
      if(typeof AyarlarSync !== "undefined"){
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "header-kur-yenile-btn";
        btn.id = "headerKurYenileBtn";
        btn.setAttribute("aria-label", "Döviz kurunu yenile");
        btn.textContent = "🔄";
        btn.onclick = function(){
          btn.disabled = true;
          btn.textContent = "⏳";
          AyarlarSync.otomatikKurGetir(true, function(basarili){
            headerKuruGuncelle();
            btn.disabled = false;
            btn.textContent = basarili ? "✓" : "✕";
            setTimeout(function(){ btn.textContent = "🔄"; }, 1500);
          });
        };
        kurBlok.appendChild(btn);
      }
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
