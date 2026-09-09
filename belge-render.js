/*
  belge-render.js
  ===============
  "weiconv2_goruntulenen_belge" localStorage anahtarından {tip, ts} okur,
  ReportsData.sonIslemler() içinden o kaydı bulur, eski uygulamanın
  faturaOnizlemeHtmlOlustur() düzenini BİREBİR üreten HTML'i çizer.
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

function htmlEsc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function fmt(n){
  return (n||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
}

var TIP_ETIKET_BELGE = {numune:"NUMUNE", teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA FATURA", siparis:"SİPARİŞ"};
var KOD_ONEK_BELGE = {numune:"NUM", teklif:"F.TEK", proforma:"P.FAT", siparis:"SİP"};
var ONEK_RENK_BELGE = {
  "SİP": {yazi:"#003a70", bg:"#eaf2fc"},
  "F.TEK": {yazi:"#0e6b58", bg:"#eafaf3"},
  "P.FAT": {yazi:"#5b3a86", bg:"#f1ecf9"},
  "NUM": {yazi:"#b7601f", bg:"#fff4e5"}
};
function kodOnekiAyiklaBelge(kod){
  if(!kod) return null;
  var parcalar = kod.split(".");
  if(parcalar.length < 3) return kod;
  return parcalar.slice(0, parcalar.length-2).join(".");
}
function gecmisCipSatiriHtml(kayit){
  if(!kayit.oncekiKod) return "";
  var oncekiOnek = kodOnekiAyiklaBelge(kayit.oncekiKod) || "?";
  var oncekiRenk = ONEK_RENK_BELGE[oncekiOnek] || {yazi:"#556170", bg:"#f1f3f6"};
  var simdikiOnek = KOD_ONEK_BELGE[kayit.tip] || "?";
  var simdikiRenk = ONEK_RENK_BELGE[simdikiOnek] || {yazi:"#003a70", bg:"#eaf2fc"};
  return "<div class='belge-gecmis-cip-satir'>"
    + "<button class='belge-gecmis-cip' id='btnGecmisCip' style='background:" + oncekiRenk.bg + ";'>"
      + "<span class='belge-gecmis-cip-kod' style='color:" + oncekiRenk.yazi + ";'>" + htmlEsc(oncekiOnek) + "</span>"
      + "<span class='belge-gecmis-cip-tarih'>" + htmlEsc(kayit.oncekiTarih || "") + "</span>"
    + "</button>"
    + "<span class='belge-gecmis-ok'>▶</span>"
    + "<div class='belge-gecmis-cip belge-gecmis-cip--simdi' style='background:" + simdikiRenk.yazi + ";'>"
      + "<span class='belge-gecmis-cip-kod' style='color:#fff;'>" + htmlEsc(simdikiOnek) + "</span>"
      + "<span class='belge-gecmis-cip-tarih' style='color:#c9dcf0;'>şu an</span>"
    + "</div>"
    + "</div>";
}
var DURUM_ETIKET = {
  iptal: {ikon:"🚫", ad:"İPTAL EDİLDİ", renk:"#c0392b", bg:"#fdeceb"},
  iade: {ikon:"↩️", ad:"İADE EDİLDİ", renk:"#6a1b9a", bg:"#f3e5f5"},
  kacan: {ikon:"❌", ad:"KAÇAN SİPARİŞ", renk:"#c0392b", bg:"#fff4e5"},
  beklemede: {ikon:"⏳", ad:"BEKLEMEDE", renk:"#633806", bg:"#faeeda"}
};

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

function kosulKutusuHtml(ikon, etiket, deger){
  return "<div class='belge-kosul-alan'>"
    + "<div class='belge-kosul-ikon'>" + ikon + "</div>"
    + "<div><div class='belge-kosul-etiket'>" + etiket + "</div><div class='belge-kosul-deger'>" + htmlEsc(deger||"-") + "</div></div>"
    + "</div>";
}

function yetkiliSatiriHtml(isim, tel, eposta){
  if(!isim && !tel && !eposta) return "";
  var parcalar = [];
  if(tel) parcalar.push("📞 " + tel);
  if(eposta) parcalar.push("✉️ " + eposta);
  return "<div class='belge-yetkili-satir'>👤 <b>" + htmlEsc(isim||"-") + "</b>"
    + (parcalar.length ? " — <span class='belge-yetkili-detay'>" + htmlEsc(parcalar.join(" · ")) + "</span>" : "")
    + "</div>";
}

// Rakamın altına küçük birim satırı ekler (€ / TL) — sayı ile birim aynı
// hücrede iki satıra ayrılır, sütun bu sayede daralabilir (07.09.2026).
function paraHtml(sayiStr, birim){
  return "<span class='belge-para-sayi'>" + sayiStr + "</span><span class='belge-para-birim'>" + birim + "</span>";
}

function belgeyiCiz(kayit, musteri){
  try{
    var urunler = kayit.urunler || [];
    var kaydinKuru = kayit.kur || (parseFloat(localStorage.getItem("weicon_kur"))||0);
    var netEuro = 0, toplamPrim = 0, toplamPrimTl = 0;
    var satirlarHtml = urunler.map(function(item, i){
      var toplamEuro = item.toplamEuro!==undefined ? item.toplamEuro : ((item.iskBirim||0)*(item.adet||0));
      netEuro += toplamEuro;
      var mk = (item.iskBirim||0)-(item.dipFiyat||0);
      var ozelFiyatMi = (item.iskonto||0) > 60;
      var satirPrim = ozelFiyatMi ? 0 : mk*(item.adet||0)*0.22;
      var satirPrimTl = Math.round(satirPrim * kaydinKuru);
      if(satirPrim > 0){ toplamPrim += satirPrim; toplamPrimTl += satirPrimTl; }
      var primHucre = ozelFiyatMi ? "Ö.F" : (satirPrim<0 ? "Yok" : ("<span class='belge-td-prim-tek'>"+paraHtml(satirPrimTl.toLocaleString("tr-TR"),"TL")+"</span>"));
      return "<tr>"
        + "<td class='belge-td-sira'>" + (i+1) + "</td>"
        + "<td class='belge-td-urun'><div class='belge-td-urun-kod'><span class='kod-harf kod-harf--b'>B</span> " + htmlEsc(item.berta||"-") + " - <span class='kod-harf kod-harf--a'>A</span> " + htmlEsc(item.abas||"-") + "</div><div class='belge-td-urun-ad'>" + htmlEsc(item.ad) + "</div></td>"
        + "<td>" + (item.adet||0) + "</td>"
        + "<td>" + paraHtml(fmt(item.listeFiyat||0),"EURO") + "</td>"
        + "<td><span class='rozet-isk'>%" + (item.iskonto||0) + "</span></td>"
        + "<td><span class='rozet-net'>" + paraHtml(fmt(item.iskBirim!==undefined?item.iskBirim:(item.listeFiyat||0)),"EURO") + "</span></td>"
        + "<td class='belge-td-toplam'>" + paraHtml(fmt(toplamEuro),"EURO") + "</td>"
        + "<td class='belge-td-prim'>" + primHucre + "</td>"
        + "</tr>";
    }).join("");

    var durum = kayit.durum;
    var sorunluMu = durum==="iptal" || durum==="iade" || durum==="kacan";
    var beklemedeMi = durum==="beklemede";
    var durumRozetHtml = (durum && DURUM_ETIKET[durum])
      ? (beklemedeMi
          ? "<button type='button' id='beklemedeRozetBtn' class='belge-durum-rozet belge-durum-rozet--tiklanabilir' style='background:" + DURUM_ETIKET[durum].bg + ";color:" + DURUM_ETIKET[durum].renk + ";'>" + DURUM_ETIKET[durum].ikon + " BU KAYIT " + DURUM_ETIKET[durum].ad + "<div class='belge-durum-rozet-not'>" + (kayit.beklemedeNot ? htmlEsc(kayit.beklemedeNot) : "Not eklemek için dokun") + "</div></button>"
          : "<div class='belge-durum-rozet' style='background:" + DURUM_ETIKET[durum].bg + ";color:" + DURUM_ETIKET[durum].renk + ";'>" + DURUM_ETIKET[durum].ikon + " BU KAYIT " + DURUM_ETIKET[durum].ad + (durum==="kacan" && kayit.kacanRakip ? " — → "+htmlEsc(kayit.kacanRakip) : "") + "</div>")
      : "";

    var vade = (musteri && musteri.vade) || "";
    var faturaTuru = (musteri && musteri.fatura) || "";
    var kargo = (musteri && musteri.kargo) || "";
    var faturaAdr = kayit.faturaAdresi ? (kayit.faturaAdresi.adres || "") : "";
    var teslimatAdr = kayit.teslimatAdresi ? (kayit.teslimatAdresi.adres || "") : "";
    var tumYetkililer = (musteri && musteri.iletisimler) || [];
    var yetkililer = kayit.gorunecekYetkililer
      ? tumYetkililer.filter(function(k){ return kayit.gorunecekYetkililer.indexOf(k.isim) !== -1; })
      : tumYetkililer;
    var sehir = (musteri && musteri.sehir) || "";
    var yetkiliBilgiHtml = yetkililer.map(function(k){ return yetkiliSatiriHtml(k.isim, k.telefon, k.eposta); }).join("");

    var musteriBlokHtml = "<div class='belge-musteri-baslik belge-musteri-baslik--logolu'><span>CARİ BİLGİ</span><span class='belge-logo-mini'>WEICON</span></div>"
      + "<div class='belge-musteri-govde'>"
      + "<div class='belge-musteri-ad'>" + htmlEsc(kayit.musteri) + "</div>"
      + ((vade||faturaTuru||kargo) ? "<div class='belge-kosul-grid'>" + kosulKutusuHtml("📅","VADE",vade) + kosulKutusuHtml("📄","FATURA",faturaTuru) + kosulKutusuHtml("🚚","KARGO",kargo) + "</div>" : "")
      + (faturaAdr ? "<div class='belge-adres-blok'><b class='belge-adres-etiket-fatura'>🧾 FATURA ADRESİ</b>" + htmlEsc(faturaAdr) + (sehir?", "+htmlEsc(sehir):"") + "</div>" : "")
      + (teslimatAdr ? "<div class='belge-adres-blok-teslimat'><b class='belge-adres-etiket-teslimat'>🚚 TESLİMAT ADRESİ</b>" + htmlEsc(teslimatAdr) + (sehir?", "+htmlEsc(sehir):"") + "</div>" : "")
      + (yetkiliBilgiHtml ? "<div class='belge-yetkili-blok'><b class='belge-adres-etiket-yetkili'>👤 YETKİLİ BİLGİSİ</b>" + yetkiliBilgiHtml + "</div>" : "")
      + "</div>";

    var belgeBaslikMetni = (TIP_ETIKET_BELGE[kayit.tip]||"SİPARİŞ") + (kayit.kod ? " · " + kayit.kod : "") + " · " + htmlEsc(kayit.tarih) + (kayit.revizeZamani ? " · 🔄 REVİZE" : "");

    var html = gecmisCipSatiriHtml(kayit)
      + "<div class='belge-kart" + (sorunluMu?" belge-kutu--sorunlu":"") + "'>"
      + durumRozetHtml
      + musteriBlokHtml
      + "</div>"
      + "<div class='belge-kart-ayrac'></div>"
      + "<div class='belge-kart'>"
      + "<div class='belge-belge-baslik-serit'>" + htmlEsc(belgeBaslikMetni) + "</div>"
      + "<div class='data-table-container'><table class='belge-urun-tablo'>"
      + "<thead><tr><th style='width:4%;'>SR</th><th style='width:34%;'>ÜRÜN BİLGİSİ</th><th style='width:10%;'>ADET</th><th style='width:10%;'>LİSTE</th><th style='width:10%;'>İSK</th><th style='width:10%;'>NET</th><th style='width:10%;'>TOPLAM</th><th style='width:12%;'>PRİM</th></tr></thead>"
      + "<tbody>" + satirlarHtml + "</tbody>"
      + "</table></div>"
      + "<div class='belge-genel-toplam-serit'>"
      + (kayit.kur ? "<span class='belge-gt-kur'>Hesaplanan Kur<br>" + fmt(kayit.kur) + " Euro</span>" : "")
      + "<span class='belge-gt-etiket'>GENEL TOPLAM</span>"
      + "<span class='belge-gt-deger'>" + fmt(netEuro) + " EURO<span class='belge-gt-deger-alt'>≈ " + Math.round(netEuro*(kayit.kur||0)).toLocaleString("tr-TR") + " TL</span></span>"
      + "</div>"
      + "<div class='belge-prim-serit'>"
      + "<span class='belge-prim-etiket'>MÜDÜR PRİMİ (TOPLAM)</span><span class='belge-prim-deger'>" + (toplamPrim<0?"Prim yok":Math.round(toplamPrimTl).toLocaleString("tr-TR")+" TL") + "</span>"
      + "</div>"
      + "</div>";

    document.getElementById("belgeIcerik").innerHTML = html;
    var beklemedeRozetBtn = document.getElementById("beklemedeRozetBtn");
    if(beklemedeRozetBtn){
      beklemedeRozetBtn.onclick = function(){ beklemedeNotAc(kayit); };
    }
    var gecmisCipBtn = document.getElementById("btnGecmisCip");
    if(gecmisCipBtn){
      gecmisCipBtn.onclick = function(){
        var oncekiOnek = kodOnekiAyiklaBelge(kayit.oncekiKod) || "?";
        alert("Bu belge önceden " + (oncekiOnek) + " · " + (kayit.oncekiKod) + " kodu ile, " + (kayit.oncekiTarih||"bilinmeyen bir tarihte") + " oluşturulmuştu. İlerletilince aynı iş takip numarası korunarak güncel türe dönüştürüldü.");
      };
    }
  }catch(e){ hataGoster("Belge çizilemedi: " + e.message); }
}

var TIP_ETIKET_UZUN = {numune:"Numune", teklif:"Fiyat Teklifi", proforma:"Proforma Fatura", siparis:"Sipariş"};
var TIP_IKON_BELGE = {numune:"🧪", teklif:"📝", proforma:"🧾", siparis:"📦"};
var TIP_RENK_BELGE = {numune:"#b7601f", teklif:"#1f9d55", proforma:"#8e44ad", siparis:"#003a70"};

function belgeZinciriBul(kayit){
  var hepsi = [];
  ["numune","teklif","proforma","siparis"].forEach(function(t){
    ReportsData.sonIslemler().filter(function(k){ return k.tip===t; }).forEach(function(k){
      hepsi.push({
        tip: t, ts: k.ts, musteri: k.musteri, tarih: k.tarih, kod: k.kod,
        durum: k.durum, revizeZamani: k.revizeZamani,
        adet: (k.urunler||[]).length,
        bertaKodlari: (k.urunler||[]).map(function(u){ return u.berta; }).filter(Boolean)
      });
    });
  });
  var mevcut = hepsi.find(function(h){ return h.tip===kayit.tip && h.ts===kayit.ts; });
  if(!mevcut) return [];

  function bagliMi(a,b){
    if(a.musteri !== b.musteri) return false;
    return a.bertaKodlari.some(function(kod){ return b.bertaKodlari.indexOf(kod)>=0; });
  }

  var zincir = [mevcut];
  var kullanildi = {}; kullanildi[mevcut.tip+"_"+mevcut.ts] = true;

  var referans = mevcut;
  while(true){
    var enYakinOncesi = null;
    hepsi.forEach(function(aday){
      var anahtar = aday.tip+"_"+aday.ts;
      if(kullanildi[anahtar]) return;
      if(aday.ts >= referans.ts) return;
      if(!bagliMi(referans, aday)) return;
      if(!enYakinOncesi || aday.ts > enYakinOncesi.ts) enYakinOncesi = aday;
    });
    if(!enYakinOncesi) break;
    zincir.unshift(enYakinOncesi);
    kullanildi[enYakinOncesi.tip+"_"+enYakinOncesi.ts] = true;
    referans = enYakinOncesi;
  }

  referans = mevcut;
  while(true){
    var enYakinSonrasi = null;
    hepsi.forEach(function(aday){
      var anahtar = aday.tip+"_"+aday.ts;
      if(kullanildi[anahtar]) return;
      if(aday.ts <= referans.ts) return;
      if(!bagliMi(referans, aday)) return;
      if(!enYakinSonrasi || aday.ts < enYakinSonrasi.ts) enYakinSonrasi = aday;
    });
    if(!enYakinSonrasi) break;
    zincir.push(enYakinSonrasi);
    kullanildi[enYakinSonrasi.tip+"_"+enYakinSonrasi.ts] = true;
    referans = enYakinSonrasi;
  }

  return zincir;
}

function belgeGecmisiniCiz(kayit){
  var zincir = belgeZinciriBul(kayit);
  var kapsayici = document.getElementById("belgeGecmisiKutu");
  if(zincir.length <= 1){
    kapsayici.hidden = true;
    return;
  }
  kapsayici.hidden = false;
  var html = "<div class='belge-gecmis-baslik'>📜 Belge Geçmişi</div>"
    + "<div class='belge-gecmis-alt'>" + htmlEsc(zincir[0].musteri) + " — bu iş için " + zincir.length + " belge bulundu</div>";
  zincir.forEach(function(adim, i){
    var renk = TIP_RENK_BELGE[adim.tip] || "#3569b8";
    var aktifMi = (adim.tip===kayit.tip && adim.ts===kayit.ts);
    var sonMu = (i===zincir.length-1);
    var durumEk = adim.revizeZamani ? " · 🔄 revize edildi" : "";
    if(adim.durum==="iptal") durumEk += " · 🚫 iptal";
    else if(adim.durum==="iade") durumEk += " · ↩️ iade";
    else if(adim.durum==="kacan") durumEk += " · ❌ kaçtı";
    html += "<div class='belge-gecmis-adim" + (sonMu?"":" belge-gecmis-adim--baglantili") + "'>"
      + "<div class='belge-gecmis-nokta' style='background:" + renk + ";'></div>"
      + "<div class='belge-gecmis-tarih'>" + htmlEsc(adim.tarih) + "</div>"
      + "<div class='belge-gecmis-kart' style='background:" + renk + "18;border-color:" + renk + "55;' data-tip='" + adim.tip + "' data-ts='" + adim.ts + "'>"
      + "<div class='belge-gecmis-kart-baslik' style='color:" + renk + ";'>" + (TIP_IKON_BELGE[adim.tip]||"") + " " + TIP_ETIKET_UZUN[adim.tip]
      + (aktifMi ? "<span class='belge-gecmis-suan'>ŞU AN BURADASIN</span>" : "")
      + "</div>"
      + "<div class='belge-gecmis-kart-alt' style='color:" + renk + ";'>" + htmlEsc(adim.kod||"") + " · " + adim.adet + " ürün" + durumEk + "</div>"
      + "</div>"
      + "</div>";
  });
  kapsayici.innerHTML = html;

  kapsayici.querySelectorAll(".belge-gecmis-kart").forEach(function(el){
    el.onclick = function(){
      var t = this.getAttribute("data-tip");
      var ts = parseFloat(this.getAttribute("data-ts"));
      localStorage.setItem("weiconv2_goruntulenen_belge", JSON.stringify({tip:t, ts:ts}));
      window.location.reload();
    };
  });
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

// Akıllı Geri: bu sayfaya BAŞKA bir sayfadan (Raporlar, Müşteri Kartı vb.)
// gerçek bir tıklamayla gelindiyse, tarayıcı geçmişinde bir adım geri gider
// (kaç adım ileri gidildiyse o kadar geri gelir). Sayfa doğrudan bir
// bağlantıdan/yer imi ile açıldıysa (geçmiş yoksa) Raporlar'a düşer.
function akilliGeriBagla(yedekSayfa){
  var btn = document.getElementById("btnGeriAkilli");
  if(!btn) return;
  btn.onclick = function(){
    if(window.history.length > 1) window.history.back();
    else window.location.href = yedekSayfa;
  };
}

var duzenlenenKayit = null;
var duzenlemeSilinenIndeksler = [];

var duzenlemeUrunDegisiklikleri = {}; // { i: {ad, berta, abas} } — "🔄 Ürünü Değiştir" ile seçilenler

function duzenlemeAc(k){
  duzenlenenKayit = k;
  duzenlemeSilinenIndeksler = [];
  duzenlemeUrunDegisiklikleri = {};
  var kapsayici = document.getElementById("duzenleUrunListesi");
  kapsayici.innerHTML = (k.urunler||[]).map(function(u, i){
    return "<div class='duzenle-urun-satir' id='duzenleSatir-" + i + "'>"
      + "<div class='duzenle-urun-baslik-satir'>"
      + "<div class='duzenle-urun-ad' id='duzenleUrunAd-" + i + "'>" + htmlEsc(u.ad) + "</div>"
      + "<button class='duzenle-urun-sil-btn' data-urun-sil-i='" + i + "'>🗑️</button>"
      + "</div>"
      + "<button type='button' class='duzenle-urun-degistir-link' data-degistir-i='" + i + "'>🔄 Ürünü Değiştir</button>"
      + "<div class='duzenle-urun-arama' id='duzenleUrunArama-" + i + "' hidden>"
      + "<input type='text' class='duzenle-urun-arama-input' data-arama-i='" + i + "' placeholder='Ürün adı veya kod ara...'>"
      + "<div class='duzenle-urun-arama-sonuc' id='duzenleUrunAramaSonuc-" + i + "'></div>"
      + "</div>"
      + "<div class='duzenle-alan-grid'>"
      + "<div class='duzenle-alan'><label class='duzenle-etiket'>Liste Fiyat</label><input type='number' step='0.01' data-alan='listeFiyat' data-i='" + i + "' value='" + (u.listeFiyat||0) + "'></div>"
      + "<div class='duzenle-alan'><label class='duzenle-etiket'>İskonto %</label><input type='number' step='0.1' data-alan='iskonto' data-i='" + i + "' value='" + (u.iskonto||0) + "'></div>"
      + "<div class='duzenle-alan'><label class='duzenle-etiket'>Adet</label><input type='number' step='1' data-alan='adet' data-i='" + i + "' value='" + (u.adet||1) + "'></div>"
      + "<div class='duzenle-alan'><label class='duzenle-etiket'>Dip Fiyat</label><input type='number' step='0.01' data-alan='dipFiyat' data-i='" + i + "' value='" + (u.dipFiyat||0) + "'></div>"
      + "</div>"
      + "</div>";
  }).join("");

  kapsayici.querySelectorAll(".duzenle-urun-sil-btn").forEach(function(btn){
    btn.onclick = function(){
      var i = parseInt(this.getAttribute("data-urun-sil-i"), 10);
      if((duzenlenenKayit.urunler||[]).length - duzenlemeSilinenIndeksler.length <= 1){
        alert("Bir kayıtta en az 1 ürün kalmalı. Tüm ürünleri silmek istiyorsan, kaydı tamamen 'Kaydı Sil' butonuyla kaldır.");
        return;
      }
      duzenlemeSilinenIndeksler.push(i);
      var satir = document.getElementById("duzenleSatir-" + i);
      if(satir) satir.remove();
    };
  });

  // "🔄 Ürünü Değiştir" (WG.090926.196): yanlış girilmiş bir ürünü,
  // kayıt tarihi (ts) değişmeden başka bir ürünle değiştirmek için.
  kapsayici.querySelectorAll(".duzenle-urun-degistir-link").forEach(function(link){
    link.onclick = function(){
      var i = this.getAttribute("data-degistir-i");
      var arama = document.getElementById("duzenleUrunArama-" + i);
      arama.hidden = !arama.hidden;
      if(!arama.hidden) arama.querySelector(".duzenle-urun-arama-input").focus();
    };
  });
  kapsayici.querySelectorAll(".duzenle-urun-arama-input").forEach(function(input){
    input.addEventListener("input", function(){
      var i = this.getAttribute("data-arama-i");
      var sonucKutusu = document.getElementById("duzenleUrunAramaSonuc-" + i);
      var q = this.value.trim();
      if(q.length < 2 || typeof ProductData === "undefined"){ sonucKutusu.innerHTML = ""; return; }
      var sonuclar = ProductData.ara(q).slice(0, 8);
      var aramaCache = {};
      sonucKutusu.innerHTML = sonuclar.map(function(s, sIdx){
        var b = ProductData.urunBilgisi(s.item);
        aramaCache[sIdx] = b;
        return "<div class='duzenle-urun-arama-satir' data-sidx='" + sIdx + "'>"
          + "<div class='duzenle-urun-arama-ad'>" + htmlEsc(b.ad) + "</div>"
          + "<div class='duzenle-urun-arama-kod'>" + htmlEsc(b.berta) + " - " + htmlEsc(b.abas) + " · Liste: " + fmt(b.fiyat) + " EURO</div>"
          + "</div>";
      }).join("") || "<div class='duzenle-urun-arama-bos'>Sonuç yok.</div>";
      sonucKutusu.querySelectorAll(".duzenle-urun-arama-satir").forEach(function(satir){
        satir.onclick = function(){
          var b = aramaCache[this.getAttribute("data-sidx")];
          if(!b) return;
          duzenlemeUrunDegisiklikleri[i] = {ad:b.ad, berta:b.berta, abas:b.abas};
          document.getElementById("duzenleUrunAd-" + i).textContent = b.ad;
          document.querySelector("[data-alan='listeFiyat'][data-i='"+i+"']").value = b.fiyat;
          document.getElementById("duzenleUrunArama-" + i).hidden = true;
        };
      });
    });
  });

  document.getElementById("duzenleOverlay").hidden = false;
}

function duzenlemeKaydet(){
  try{
    if(!duzenlenenKayit) return;
    var yeniUrunler = [];
    (duzenlenenKayit.urunler||[]).forEach(function(u, i){
      if(duzenlemeSilinenIndeksler.indexOf(i) >= 0) return; // silinmiş ürün, atla
      var listeFiyat = parseFloat(document.querySelector("[data-alan='listeFiyat'][data-i='"+i+"']").value)||0;
      var iskonto = parseFloat(document.querySelector("[data-alan='iskonto'][data-i='"+i+"']").value)||0;
      var adet = parseFloat(document.querySelector("[data-alan='adet'][data-i='"+i+"']").value)||1;
      var dipFiyat = parseFloat(document.querySelector("[data-alan='dipFiyat'][data-i='"+i+"']").value)||0;
      var iskontoluFiyat = listeFiyat - (listeFiyat*iskonto/100);
      var degisen = duzenlemeUrunDegisiklikleri[i];
      yeniUrunler.push({
        ad: degisen ? degisen.ad : u.ad,
        berta: degisen ? degisen.berta : u.berta,
        abas: degisen ? degisen.abas : u.abas,
        listeFiyat: listeFiyat, iskonto: iskonto, adet: adet, dipFiyat: dipFiyat,
        iskBirim: iskontoluFiyat,
        toplamEuro: iskontoluFiyat * adet
      });
    });
    var btn = document.getElementById("btnDuzenleKaydet");
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";
    ReportsData.kaydiGuncelle(duzenlenenKayit.tip, duzenlenenKayit.ts, yeniUrunler, function(basarili, err){
      btn.disabled = false;
      btn.textContent = "Kaydet";
      if(basarili){
        document.getElementById("duzenleOverlay").hidden = true;
        duzenlenenKayit = null;
        alert("✓ Güncellendi.");
      } else {
        hataGoster("Güncellenemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
      }
    });
  }catch(e){ hataGoster("Düzenleme kaydedilemedi: " + e.message); }
}

document.addEventListener("DOMContentLoaded", function(){
  akilliGeriBagla("reports.html");
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  document.getElementById("btnBelgeKapat").onclick = function(){
    if(window.history.length > 1) window.history.back();
    else window.location.href = "reports.html";
  };
  document.getElementById("btnIslemlerAc").onclick = function(){ document.getElementById("islemlerOverlay").hidden = false; };
  document.getElementById("msVazgec").onclick = function(){ document.getElementById("islemlerOverlay").hidden = true; };
  document.getElementById("islemlerOverlay").addEventListener("click", function(ev){
    if(ev.target === this) this.hidden = true;
  });

  document.getElementById("msYazdir").onclick = function(){
    document.getElementById("islemlerOverlay").hidden = true;
    window.print();
  };
  document.getElementById("msSil").onclick = function(){
    document.getElementById("islemlerOverlay").hidden = true;
    if(!ref) return;
    var belgeAdi = (sonCizilenKayit ? ((TIP_ETIKET_BELGE[sonCizilenKayit.tip]||"belge") + (sonCizilenKayit.kod ? " · " + sonCizilenKayit.kod : "")) : "bu belge");
    if(!confirm("Sadece bu belge silinecek:\n\n" + belgeAdi + "\n\nMüşteri kartına, adreslere veya yetkili bilgilerine dokunulmayacak — sadece bu tek kayıt kalıcı olarak silinecek. Bu geri alınamaz.")) return;
    var btn = document.getElementById("msSil");
    btn.disabled = true;
    btn.textContent = "Siliniyor...";
    ReportsData.kaydiSil(ref.tip, ref.ts, function(basarili, err){
      if(basarili){
        alert("✓ Sadece bu belge silindi. Müşteri kartı ve diğer bilgiler etkilenmedi.");
        window.location.href = "reports.html";
      } else {
        btn.disabled = false;
        btn.textContent = "🗑️ Kaydı sil";
        hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
      }
    });
  };
  document.getElementById("msKacti").onclick = function(){
    document.getElementById("islemlerOverlay").hidden = true;
    if(!sonCizilenKayit) return;
    var sebep = prompt("Kaçırma sebebi (örn. Fiyat, Termin, Rakip):", "") || "";
    var rakip = prompt("Rakip firma (opsiyonel):", "") || "";
    ReportsData.kaydiKacanIsaretle(sonCizilenKayit.tip, sonCizilenKayit.ts, sebep, rakip, function(basarili, err){
      if(basarili){ alert("✓ İşaretlendi."); denemeCiz(); }
      else hataGoster("İşaretlenemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
    });
  };

  var ref = null;
  try{ ref = JSON.parse(localStorage.getItem("weiconv2_goruntulenen_belge")||"null"); }catch(e){}
  if(!ref){
    hataGoster("Görüntülenecek belge bulunamadı.");
    return;
  }

  var sonCizilenKayit = null;
  var sonCizilenMusteri = null;

  function denemeCiz(){
    var liste = ReportsData.sonIslemler();
    var kayit = liste.find(function(k){ return k.tip===ref.tip && k.ts===ref.ts; });
    if(!kayit) return false;
    sonCizilenKayit = kayit;
    var musteri = CustomerData.musteriBul(kayit.musteri);
    sonCizilenMusteri = musteri;
    belgeyiCiz(kayit, musteri);
    belgeGecmisiniCiz(kayit);

    document.getElementById("msIlerlet").hidden = false;
    document.getElementById("msKacti").hidden = !((kayit.tip==="teklif"||kayit.tip==="proforma") && kayit.durum !== "kacan");
    document.getElementById("msBeklemede").hidden = !!kayit.durum;
    return true;
  }

  document.getElementById("msDuzenle").onclick = function(){
    if(!sonCizilenKayit) return;
    document.getElementById("islemlerOverlay").hidden = true;
    document.getElementById("duzenleMenuOverlay").hidden = false;
  };
  document.getElementById("btnDuzenleMenuKapat").onclick = function(){ document.getElementById("duzenleMenuOverlay").hidden = true; };
  document.getElementById("btnMenuUrunler").onclick = function(){
    document.getElementById("duzenleMenuOverlay").hidden = true;
    duzenlemeAc(sonCizilenKayit);
  };
  document.getElementById("btnDuzenleVazgec").onclick = function(){ document.getElementById("duzenleOverlay").hidden = true; duzenlenenKayit = null; };
  document.getElementById("btnDuzenleKaydet").onclick = duzenlemeKaydet;

  // ---- Yetkili Kişi seçimi (bu belgede kim görünsün) ----
  document.getElementById("btnMenuYetkili").onclick = function(){
    document.getElementById("duzenleMenuOverlay").hidden = true;
    var liste = document.getElementById("yetkiliSecListesi");
    var yetkililer = (sonCizilenMusteri && sonCizilenMusteri.iletisimler) || [];
    var seciliIsimler = sonCizilenKayit.gorunecekYetkililer || null; // null = hepsi
    if(!yetkililer.length){
      liste.innerHTML = "<p class='bos-mesaj'>Bu müşteride kayıtlı yetkili yok. Önce Cari Kart'tan ekleyebilirsin.</p>";
    } else {
      liste.innerHTML = yetkililer.map(function(k, i){
        var isaretli = !seciliIsimler || seciliIsimler.indexOf(k.isim) !== -1;
        return "<label class='yetkili-sec-satir'><input type='checkbox' data-isim='" + (k.isim||"").replace(/'/g,"&#39;") + "'" + (isaretli?" checked":"") + "> " + (k.isim||"(isimsiz)") + (k.gorev?" — "+k.gorev:"") + "</label>";
      }).join("");
    }
    document.getElementById("yetkiliSecOverlay").hidden = false;
  };
  document.getElementById("btnYetkiliSecVazgec").onclick = function(){ document.getElementById("yetkiliSecOverlay").hidden = true; };
  document.getElementById("btnYetkiliSecKaydet").onclick = function(){
    if(!sonCizilenKayit) return;
    var kutular = document.querySelectorAll("#yetkiliSecListesi input[type=checkbox]");
    var toplam = kutular.length;
    var secililer = [];
    kutular.forEach(function(k){ if(k.checked) secililer.push(k.getAttribute("data-isim")); });
    // Hepsi işaretliyse (ya da hiç yetkili yoksa) null kaydet — "hepsini göster" varsayılanına dön.
    var kaydedilecek = (secililer.length === toplam) ? null : secililer;
    var btn = document.getElementById("btnYetkiliSecKaydet");
    btn.disabled = true; btn.textContent = "Kaydediliyor...";
    ReportsData.kaydiAlanGuncelle(sonCizilenKayit.tip, sonCizilenKayit.ts, {gorunecekYetkililer: kaydedilecek}, function(basarili, err){
      btn.disabled = false; btn.textContent = "Kaydet";
      if(!basarili){ hataGoster("Kaydedilemedi: " + (err && err.message)); return; }
      document.getElementById("yetkiliSecOverlay").hidden = true;
    });
  };

  // ---- Fatura / Teslimat Adresi düzenleme ----
  var duzenlenenAdresTuru = null; // "faturaAdresi" | "teslimatAdresi"
  function adresDuzenleAc(tur, baslik){
    duzenlenenAdresTuru = tur;
    document.getElementById("adresDuzenleBaslik").textContent = baslik;
    document.getElementById("adresDuzenleMetni").value = (sonCizilenKayit[tur] && sonCizilenKayit[tur].adres) || "";
    document.getElementById("adresDuzenleOverlay").hidden = false;
  }
  document.getElementById("btnMenuFaturaAdres").onclick = function(){
    document.getElementById("duzenleMenuOverlay").hidden = true;
    adresDuzenleAc("faturaAdresi", "Fatura Adresini Düzenle");
  };
  document.getElementById("btnMenuTeslimatAdres").onclick = function(){
    document.getElementById("duzenleMenuOverlay").hidden = true;
    adresDuzenleAc("teslimatAdresi", "Teslimat Adresini Düzenle");
  };
  document.getElementById("btnAdresDuzenleVazgec").onclick = function(){ document.getElementById("adresDuzenleOverlay").hidden = true; duzenlenenAdresTuru = null; };
  document.getElementById("btnAdresDuzenleKaydet").onclick = function(){
    if(!sonCizilenKayit || !duzenlenenAdresTuru) return;
    var metin = document.getElementById("adresDuzenleMetni").value.trim();
    var btn = document.getElementById("btnAdresDuzenleKaydet");
    btn.disabled = true; btn.textContent = "Kaydediliyor...";
    var alanlar = {};
    alanlar[duzenlenenAdresTuru] = metin ? {etiket: (duzenlenenAdresTuru==="faturaAdresi"?"Fatura Adresi":"Teslimat Adresi"), adres: metin} : null;
    ReportsData.kaydiAlanGuncelle(sonCizilenKayit.tip, sonCizilenKayit.ts, alanlar, function(basarili, err){
      btn.disabled = false; btn.textContent = "Kaydet";
      if(!basarili){ hataGoster("Kaydedilemedi: " + (err && err.message)); return; }
      document.getElementById("adresDuzenleOverlay").hidden = true;
      duzenlenenAdresTuru = null;
    });
  };

  // ---- Belgeye özel not ----
  document.getElementById("btnMenuNot").onclick = function(){
    document.getElementById("duzenleMenuOverlay").hidden = true;
    document.getElementById("notDuzenleMetni").value = sonCizilenKayit.not || "";
    document.getElementById("notDuzenleOverlay").hidden = false;
  };
  document.getElementById("btnNotDuzenleVazgec").onclick = function(){ document.getElementById("notDuzenleOverlay").hidden = true; };
  document.getElementById("btnNotDuzenleKaydet").onclick = function(){
    if(!sonCizilenKayit) return;
    var metin = document.getElementById("notDuzenleMetni").value.trim();
    var btn = document.getElementById("btnNotDuzenleKaydet");
    btn.disabled = true; btn.textContent = "Kaydediliyor...";
    ReportsData.kaydiAlanGuncelle(sonCizilenKayit.tip, sonCizilenKayit.ts, {not: metin || null}, function(basarili, err){
      btn.disabled = false; btn.textContent = "Kaydet";
      if(!basarili){ hataGoster("Kaydedilemedi: " + (err && err.message)); return; }
      document.getElementById("notDuzenleOverlay").hidden = true;
    });
  };

  // ---- İlerlet — hangi aşamaya dönüştürüleceği artık BURADA sorulur
  // (Gönder aşamasında tekrar sorulmaz). Numune → Proforma/Teklif;
  // Teklif → Proforma/Sipariş; Proforma → sadece Sipariş. "Tekrarla"
  // (aynı türde bağımsız yeni kayıt) da aynı popup'ta bir seçenek olarak
  // sunulur — İlerlet her zaman görünür, tip son aşamada (Sipariş) olsa
  // bile en azından Tekrarla seçeneği için açılabilir (07.09.2026).
  var TIP_ETIKET_ILERLET = {numune:"Numune", teklif:"Fiyat Teklifi", proforma:"Proforma Fatura", siparis:"Sipariş"};
  var ilerletSeciliTip = null;
  document.getElementById("msIlerlet").onclick = function(){
    document.getElementById("islemlerOverlay").hidden = true;
    try{
      if(!sonCizilenKayit) return;
      var secenekler = ReportsData.SONRAKI_ASAMALAR[sonCizilenKayit.tip] || [];
      ilerletSeciliTip = null;
      document.getElementById("ilerletDevamSatiri").hidden = true;
      var liste = document.getElementById("ilerletSecenekListesi");
      liste.innerHTML = secenekler.map(function(tip){
        return "<button type='button' class='duzenle-menu-secenek' data-tip='" + tip + "'>" + (TIP_ETIKET_ILERLET[tip]||tip) + "</button>";
      }).join("") + "<button type='button' class='duzenle-menu-secenek' data-tip='tekrarla'>🔁 Tekrarla (aynı türde yeni kayıt)</button>";
      liste.querySelectorAll("[data-tip]").forEach(function(btn){
        btn.onclick = function(){
          ilerletSeciliTip = this.getAttribute("data-tip");
          liste.querySelectorAll("[data-tip]").forEach(function(b){ b.classList.remove("duzenle-menu-secenek--secili"); });
          this.classList.add("duzenle-menu-secenek--secili");
          document.getElementById("btnIlerletDevam").textContent = ilerletSeciliTip==="tekrarla" ? "Tekrarla — Sepete Yükle" : ((TIP_ETIKET_ILERLET[ilerletSeciliTip]||ilerletSeciliTip) + " seçeneğine devam et");
          document.getElementById("ilerletDevamSatiri").hidden = false;
        };
      });
      document.getElementById("ilerletSecOverlay").hidden = false;
    }catch(e){ hataGoster("İlerlet popup'ı açılamadı: " + e.message); }
  };
  document.getElementById("btnIlerletVazgec").onclick = function(){ document.getElementById("ilerletSecOverlay").hidden = true; };
  document.getElementById("btnIlerletDevam").onclick = function(){
    try{
      if(!sonCizilenKayit || !ilerletSeciliTip) return;
      document.getElementById("ilerletSecOverlay").hidden = true;
      if(ilerletSeciliTip === "tekrarla") ReportsData.tekrarBaslat(sonCizilenKayit);
      else ReportsData.revizeBaslat(sonCizilenKayit, ilerletSeciliTip);
    }catch(e){ hataGoster("İlerletilemedi: " + e.message); }
  };

  // ---- Beklemede (sipariş verildi ama stokta yok, tedarik/termin
  // bekleniyor) — İşlemler menüsünden yeni işaretlenebilir, ya da
  // kayıt üzerindeki BEKLEMEDE rozetine dokunarak notu düzenlenebilir/
  // silinebilir. Beklemedeyken bu kayıt hiçbir aylık/günlük toplama
  // (satış, prim) dahil edilmez — bkz. ReportsData.ayToplami,
  // HomeData.buAyinVerisi/bugununVerisi (07.09.2026).
  var beklemedeDuzenlenenKayit = null;
  function beklemedeNotAc(kayit){
    beklemedeDuzenlenenKayit = kayit;
    document.getElementById("beklemedeNotMetni").value = kayit.beklemedeNot || "";
    document.getElementById("beklemedeNotOverlay").hidden = false;
  }
  window.beklemedeNotAc = beklemedeNotAc;
  document.getElementById("msBeklemede").onclick = function(){
    document.getElementById("islemlerOverlay").hidden = true;
    if(!sonCizilenKayit) return;
    beklemedeNotAc(sonCizilenKayit);
  };
  document.getElementById("btnBeklemedeNotVazgec").onclick = function(){ document.getElementById("beklemedeNotOverlay").hidden = true; };
  document.getElementById("btnBeklemedeNotKaydet").onclick = function(){
    if(!beklemedeDuzenlenenKayit) return;
    var metin = document.getElementById("beklemedeNotMetni").value.trim();
    var btn = document.getElementById("btnBeklemedeNotKaydet");
    btn.disabled = true; btn.textContent = "Kaydediliyor...";
    ReportsData.kaydiAlanGuncelle(beklemedeDuzenlenenKayit.tip, beklemedeDuzenlenenKayit.ts, {durum:"beklemede", beklemedeNot: metin}, function(basarili, err){
      btn.disabled = false; btn.textContent = "Kaydet";
      if(!basarili){ hataGoster("Kaydedilemedi: " + (err && err.message)); return; }
      document.getElementById("beklemedeNotOverlay").hidden = true;
      denemeCiz();
    });
  };
  document.getElementById("btnBeklemedeNotSil").onclick = function(){
    if(!beklemedeDuzenlenenKayit) return;
    if(!confirm("Beklemede durumu kaldırılsın mı? Kayıt tekrar normal şekilde toplamlara dahil olacak.")) return;
    var btn = document.getElementById("btnBeklemedeNotSil");
    btn.disabled = true;
    ReportsData.kaydiAlanGuncelle(beklemedeDuzenlenenKayit.tip, beklemedeDuzenlenenKayit.ts, {durum:null, beklemedeNot:null}, function(basarili, err){
      btn.disabled = false;
      if(!basarili){ hataGoster("Kaldırılamadı: " + (err && err.message)); return; }
      document.getElementById("beklemedeNotOverlay").hidden = true;
      denemeCiz();
    });
  };

  ReportsData.arsivDegistiginde(denemeCiz);
  CustomerData.listeDegistiginde(denemeCiz);
  denemeCiz();
});
