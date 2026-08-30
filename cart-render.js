/*
  cart-render.js
  ==============
  Sepeti HESAPLANACAK (sarı) / HESAPLANDI (yeşil) belge-tablosu gruplarıyla
  çizer; HESAPLANDI grubunun etiketinde artık EURO KUR rozeti de var.
  Bir ürüne dokununca calc.html'e gidilir (hesapla/düzenle). Kaydet/Gönder
  artık GERÇEKTEN kaydeder (kur tazelik kontrolü + anomali uyarısı + varsa
  aşama seçimi dahil) — ikinci bir onay ekranına gerek yok; başarılı kayıt
  sonrası doğrudan send.html'e (mail/WhatsApp gönderme paneli) geçilir.
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

function htmlEsc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

var TIP_ETIKET_ROZET = {numune:"NUMUNE", teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA FATURA", siparis:"SİPARİŞ"};
var secilenTip = "siparis";
var seciliAdresler = {};
var revizeSecimBekleniyor = null;

function adresleriBelirle(musteri){
  seciliAdresler = {};
  if(musteri.faturaAdresleri && musteri.faturaAdresleri.length) seciliAdresler.faturaAdresi = musteri.faturaAdresleri[0];
  if(musteri.teslimatAdresleri && musteri.teslimatAdresleri.length) seciliAdresler.teslimatAdresi = musteri.teslimatAdresleri[0];
}

function urunuHesaplamayaGonder(idx){
  localStorage.setItem("weiconv2_hesapla_duzenle_idx", idx);
  window.location.href = "calc.html";
}

// Cari Bilgi bilgisi artık ayrı bir üst kutuda değil, HESAPLANDI grubunun
// etiket satırında (firma+şehir solda, işlem türü rozeti sağda) gösterilir
// — mobilde yer kazanmak için. Bu yüzden grup HTML'ini kendimiz üretip
// HareketTablo.grupHtml'in ürettiği hücreleri içine alıyoruz.
function cariBilgiOzetiHtml(musteri){
  var sehir = musteri.sehir ? " <span class='sepet-cari-bilgi-sehir'>— " + htmlEsc(musteri.sehir) + "</span>" : "";
  return "<div class='sepet-cari-bilgi'>"
    + "<div><div class='sepet-cari-bilgi-etiket'>CARİ BİLGİ</div><div class='sepet-cari-bilgi-ad'>" + htmlEsc(musteri.ad) + sehir + "</div></div>"
    + "<span class='sepet-cari-bilgi-tip-rozet'>" + (TIP_ETIKET_ROZET[secilenTip]||"") + "</span>"
    + "</div>";
}

function sayfayiCiz(){
  try{
    var liste = CartData.liste();
    var bosMesaj = document.getElementById("sepetBosMesaj");
    var altButonSatiri = document.getElementById("sepetAltButonSatiri");
    var devamUyari = document.getElementById("devamUyari");
    var grupSariAlani = document.getElementById("grupSariAlani");
    var grupYesilAlani = document.getElementById("grupYesilAlani");
    var musteri = CustomerData.seciliyiOku();

    if(liste.length === 0 || !musteri){
      grupSariAlani.innerHTML = "";
      grupYesilAlani.innerHTML = "";
      bosMesaj.hidden = false;
      bosMesaj.textContent = !musteri ? "Önce bir müşteri seçmelisiniz." : "Sepetiniz boş. Önce Ürün Bul'dan ürün seçin.";
      altButonSatiri.hidden = true;
      document.getElementById("btnSepetIptal").hidden = true;
      devamUyari.hidden = true;
      return;
    }
    bosMesaj.hidden = true;
    altButonSatiri.hidden = false;
    document.getElementById("btnSepetIptal").hidden = false;
    adresleriBelirle(musteri);

    var kur = CartData.kurOku();
    var kdv = CartData.kdvOku();
    var hesapla = function(u){ return CartData.hesapla(u, kur, kdv); };

    var bekleyenler = liste.filter(function(u){ return !u.hesaplandi; });
    var hesaplananlar = liste.filter(function(u){ return u.hesaplandi; });

    grupSariAlani.innerHTML = bekleyenler.length === 0 ? "" : HareketTablo.grupHtml({
      etiket: "🟡 HESAPLANACAK",
      urunler: bekleyenler,
      hesapla: function(){ return null; },
      zeminSinifi: "hareket-satir--sari"
    });

    var hesaplananToplam = 0;
    hesaplananlar.forEach(function(u){ hesaplananToplam += hesapla(u).toplamEuro; });
    // CARİ BİLGİ (firma+şehir+işlem türü) HESAPLANDI grubunun HEMEN üstüne,
    // tabloyla birlikte tek görsel blok gibi görünecek şekilde ekleniyor.
    grupYesilAlani.innerHTML = hesaplananlar.length === 0 ? "" : (
      cariBilgiOzetiHtml(musteri) +
      HareketTablo.grupHtml({
        etiket: "🟢 HESAPLANDI",
        urunler: hesaplananlar,
        hesapla: hesapla,
        zeminSinifi: "hareket-satir--yesil",
        genelToplam: hesaplananToplam,
        kur: kur
      })
    );

    function siraHucresineSilTiklamasiEkle(tr, urun){
      var siraHucre = tr.querySelector("td.belge-td-sira");
      if(!siraHucre) return;
      var orijinalSira = siraHucre.textContent;
      function numaraHalineGetir(){
        siraHucre.innerHTML = "<span class='sepet-sira-numara'>" + orijinalSira + "</span>";
        siraHucre.querySelector(".sepet-sira-numara").onclick = function(e){
          e.stopPropagation();
          silButonuHalineGetir();
        };
      }
      function silButonuHalineGetir(){
        siraHucre.innerHTML = "<button class='sepet-sira-sil-btn' title='Sil'>🗑️</button>";
        siraHucre.querySelector("button").onclick = function(e){
          e.stopPropagation();
          if(!confirm(urun.ad + " sepetten kaldırılsın mı?")){ numaraHalineGetir(); return; }
          CartData.sil(urun.idx);
          sayfayiCiz();
        };
      }
      numaraHalineGetir();
    }
    grupSariAlani.querySelectorAll("tbody tr").forEach(function(tr, i){
      tr.style.cursor = "pointer";
      var urun = bekleyenler[i];
      tr.onclick = function(){ urunuHesaplamayaGonder(urun.idx); };
      siraHucresineSilTiklamasiEkle(tr, urun);
    });
    grupYesilAlani.querySelectorAll("tbody tr").forEach(function(tr, i){
      tr.style.cursor = "pointer";
      var urun = hesaplananlar[i];
      tr.onclick = function(){ urunuHesaplamayaGonder(urun.idx); };
      siraHucresineSilTiklamasiEkle(tr, urun);
    });

    var tamamMi = CartData.tamamHesaplandiMi();
    document.getElementById("btnSepetKaydet").disabled = !tamamMi;
    document.getElementById("btnSepetGonder").disabled = !tamamMi;
    devamUyari.hidden = tamamMi;
  }catch(e){ hataGoster("Sepet çizilemedi: " + e.message); }
}

// ---------- Kaydetme mantığı (eskiden send-render.js'deydi) ----------

function anomaliUyarilariniTopla(sepet, kur, kdv){
  var uyarilar = [];
  sepet.forEach(function(u){
    if(u.iskonto && u.iskonto > 50){
      uyarilar.push("⚠️ " + u.ad + " için iskonto %" + u.iskonto + " — çok yüksek görünüyor.");
    }
    var h = CartData.hesapla(u, kur, kdv);
    if(u.dipFiyat && h.iskontoluFiyat < u.dipFiyat){
      uyarilar.push("🔴 " + u.ad + " dip maliyetin (" + CartData.fmt(u.dipFiyat) + " €) altında satılıyor (net: " + CartData.fmt(h.iskontoluFiyat) + " €) — zararına satış olabilir.");
    }
  });
  return uyarilar;
}

function kurTazeligeGetir(devamFn){
  // Savunmacı kontrol: AyarlarSync herhangi bir sebeple (eksik dosya, eski
  // sürüm, yükleme sırası hatası) beklenen fonksiyonları sağlamıyorsa,
  // Kaydet/Gönder akışı SESSİZCE bir JS hatasıyla kırılmasın — mevcut
  // kur geçerliyse onunla devam et, değilse kullanıcıdan elle iste.
  if(typeof AyarlarSync === "undefined" || typeof AyarlarSync.kurBayatMi !== "function"){
    if(CartData.kurOku() > 0){ devamFn(); return; }
    hataGoster("EUR/TL kuru bulunamadı. Ayarlar sayfasından kur girin.");
    return;
  }
  if(!AyarlarSync.kurBayatMi()){ devamFn(); return; }
  if(typeof AyarlarSync.otomatikKurGetir !== "function"){
    kurElleSorVeDevamEt(devamFn);
    return;
  }
  AyarlarSync.otomatikKurGetir(true, function(basarili){
    if(basarili && CartData.kurOku() > 0){ sayfayiCiz(); devamFn(); return; }
    kurElleSorVeDevamEt(devamFn);
  });
}

function kurElleSorVeDevamEt(devamFn){
  var girilen = prompt("⚠️ Güncel kur otomatik çekilemedi (internet bağlantısını kontrol et).\n\nBu satışın merkez ofisle tutarlı olması için bugünün EUR→TL kurunu elle gir:", CartData.kurOku()||"");
  var sayisalDeger = parseFloat((girilen||"").replace(",","."));
  if(!girilen || isNaN(sayisalDeger) || sayisalDeger<=0){
    hataGoster("Geçerli bir kur girilmeden kayıt/gönderim yapılamaz.");
    return;
  }
  try{
    AyarlarSync.kurKaydet(sayisalDeger);
  }catch(e){
    hataGoster("Kur kaydedilemedi: " + e.message);
    return;
  }
  sayfayiCiz();
  devamFn();
}

function ilerletKaynagiOku(){
  try{
    var v = localStorage.getItem("weiconv2_ilerlet_kaynak");
    return v ? JSON.parse(v) : null;
  }catch(e){ return null; }
}

function ilerletKaynagiVarsaSekmeAyarla(){
  var kaynak = ilerletKaynagiOku();
  if(!kaynak || !kaynak.sonrakiAsamaSecenekleri || kaynak.sonrakiAsamaSecenekleri.length===0) return;
  var secenekler = kaynak.sonrakiAsamaSecenekleri;
  var uyari = document.createElement("div");
  uyari.className = "ilerlet-bilgi-kutu";
  if(secenekler.length === 1){
    secilenTip = secenekler[0];
    uyari.textContent = "▶️ İlerletiliyor — kayıt tamamlanınca önceki aşamanın belgesi otomatik silinecek.";
  } else {
    revizeSecimBekleniyor = secenekler;
    uyari.textContent = "🔄 Revize ediliyor — Kaydet/Gönder'e basınca hangi aşamaya (" + secenekler.map(function(s){return TIP_ETIKET_ROZET[s];}).join(" / ") + ") dönüşeceğini seçeceksin.";
  }
  document.getElementById("ilerletBilgiAlani").appendChild(uyari);
}

function asamaSecimPopupunuAc(devamFn){
  var overlay = document.getElementById("asamaSecimOverlay");
  var kapsayici = document.getElementById("asamaSecimButonlari");
  kapsayici.innerHTML = revizeSecimBekleniyor.map(function(s){
    return "<button class='tip-btn tip-btn--" + s + "' data-secim='" + s + "'>" + TIP_ETIKET_ROZET[s] + "</button>";
  }).join("");
  kapsayici.querySelectorAll("[data-secim]").forEach(function(btn){
    btn.onclick = function(){
      secilenTip = this.getAttribute("data-secim");
      revizeSecimBekleniyor = null;
      overlay.hidden = true;
      sayfayiCiz();
      devamFn();
    };
  });
  document.getElementById("btnAsamaSecimVazgec").onclick = function(){ overlay.hidden = true; };
  overlay.hidden = false;
}

function oncedenSecilenTipVarsaUygula(){
  try{
    var tip = localStorage.getItem("weiconv2_onceden_secilen_tip");
    if(tip) secilenTip = tip;
  }catch(e){}
}

function kaydetGercekIslem(niyet){
  try{
    var musteri = CustomerData.seciliyiOku();
    var sepet = CartData.liste();
    if(!musteri || sepet.length === 0) return;

    var kur = CartData.kurOku();
    var kdv = CartData.kdvOku();

    var uyarilar = anomaliUyarilariniTopla(sepet, kur, kdv);
    if(uyarilar.length > 0){
      if(!confirm("⚠️ Anomali Uyarısı\n\n" + uyarilar.join("\n\n") + "\n\nYine de kaydetmek istiyor musunuz?")) return;
    }

    document.getElementById("btnSepetKaydet").disabled = true;
    document.getElementById("btnSepetGonder").disabled = true;
    document.getElementById("btnSepetKaydet").textContent = "Kaydediliyor...";

    var kaynak = ilerletKaynagiOku();
    var devralinanKod = (kaynak && kaynak.kod) ? kaynak.kod : null;
    SendData.kaydet(secilenTip, musteri, sepet, kur, kdv, seciliAdresler, devralinanKod, function(basarili, sonuc, revizeMi){
      if(basarili){
        if(kaynak){
          SendData.kaynakSil(kaynak.tip, kaynak.ts, function(){});
          localStorage.removeItem("weiconv2_ilerlet_kaynak");
        }
        // send.html'e taşınacak bağlam — sepeti/müşteriyi BURADA boşaltmıyoruz,
        // "Geri — Sepete Dön ve Düzelt" hâlâ çalışabilsin diye (aynı gün+
        // müşteri+ürün seti eşleşmesiyle SendData.kaydet zaten revize eder).
        localStorage.setItem("weiconv2_son_kaydedilen_belge", JSON.stringify({
          musteri: musteri, sepet: sepet, tip: secilenTip, kur: kur, kdv: kdv,
          kayit: sonuc, revizeMi: !!revizeMi, niyet: niyet
        }));
        window.location.href = "send.html";
      } else {
        document.getElementById("btnSepetKaydet").disabled = false;
        document.getElementById("btnSepetGonder").disabled = false;
        document.getElementById("btnSepetKaydet").textContent = "✓ Kaydet";
        hataGoster("Kaydetme başarısız: " + (sonuc && sonuc.message ? sonuc.message : "bilinmeyen hata"));
      }
    });
  }catch(e){ hataGoster("Kaydet işlemi başarısız: " + e.message); }
}

function kaydetTiklandi(niyet){
  if(!CartData.tamamHesaplandiMi()) return;
  var devam = function(){ kurTazeligeGetir(function(){ kaydetGercekIslem(niyet); }); };
  if(revizeSecimBekleniyor){ asamaSecimPopupunuAc(devam); return; }
  devam();
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  oncedenSecilenTipVarsaUygula();
  ilerletKaynagiVarsaSekmeAyarla();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  document.getElementById("btnSepetKaydet").onclick = function(){ kaydetTiklandi("kaydet"); };
  document.getElementById("btnSepetGonder").onclick = function(){ kaydetTiklandi("gonder"); };
  document.getElementById("btnSepetIptal").onclick = function(){
    if(!confirm("Bu işlemi iptal edip sepetteki TÜM ürünleri kaldırmak istediğinden emin misin? Bu geri alınamaz.")) return;
    localStorage.setItem("weiconv2_sepet", "[]");
    window.location.href = "home.html";
  };

  CustomerData.listeDegistiginde(sayfayiCiz);
  sayfayiCiz();
});
