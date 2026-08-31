/*
  belge-render.js
  ===============
  "weiconv2_goruntulenen_belge" localStorage anahtarından {tip, ts} okur,
  ReportsData.sonIslemler() içinden o kaydı bulur, eski uygulamanın
  faturaOnizlemeHtmlOlustur() düzenini BİREBİR üreten HTML'i çizer.
*/

function hataGoster(mesaj){
  console.error(mesaj);
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
var DURUM_ETIKET = {
  iptal: {ikon:"🚫", ad:"İPTAL EDİLDİ", renk:"#c0392b", bg:"#fdeceb"},
  iade: {ikon:"↩️", ad:"İADE EDİLDİ", renk:"#6a1b9a", bg:"#f3e5f5"},
  kacan: {ikon:"❌", ad:"KAÇAN SİPARİŞ", renk:"#c0392b", bg:"#fff4e5"}
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
      var satirPrimTl = satirPrim * kaydinKuru;
      if(satirPrim > 0){ toplamPrim += satirPrim; toplamPrimTl += satirPrimTl; }
      return "<tr>"
        + "<td class='belge-td-sira'>" + (i+1) + "</td>"
        + "<td class='belge-td-urun'><div class='belge-td-urun-kod'><span class='kod-harf kod-harf--b'>B</span> " + htmlEsc(item.berta||"-") + " <span class='kod-harf kod-harf--a'>A</span> " + htmlEsc(item.abas||"-") + "</div><div class='belge-td-urun-ad'>" + htmlEsc(item.ad) + "</div></td>"
        + "<td>" + (item.adet||0) + "</td>"
        + "<td>" + fmt(item.listeFiyat||0) + " €</td>"
        + "<td class='belge-td-isk'>%" + (item.iskonto||0) + "</td>"
        + "<td>" + fmt(item.iskBirim!==undefined?item.iskBirim:(item.listeFiyat||0)) + " €</td>"
        + "<td class='belge-td-toplam'>" + fmt(toplamEuro) + " €</td>"
        + "<td class='belge-td-prim'>" + (ozelFiyatMi ? "ÖZEL FİYAT" : (satirPrim<0 ? "Yok" : fmt(satirPrimTl)+" TL")) + "</td>"
        + "</tr>";
    }).join("");

    var durum = kayit.durum;
    var sorunluMu = durum==="iptal" || durum==="iade" || durum==="kacan";
    var durumRozetHtml = (durum && DURUM_ETIKET[durum])
      ? "<div class='belge-durum-rozet' style='background:" + DURUM_ETIKET[durum].bg + ";color:" + DURUM_ETIKET[durum].renk + ";'>" + DURUM_ETIKET[durum].ikon + " BU KAYIT " + DURUM_ETIKET[durum].ad + (durum==="kacan" && kayit.kacanRakip ? " — → "+htmlEsc(kayit.kacanRakip) : "") + "</div>"
      : "";

    var vade = (musteri && musteri.vade) || "";
    var faturaTuru = (musteri && musteri.fatura) || "";
    var kargo = (musteri && musteri.kargo) || "";
    var faturaAdr = kayit.faturaAdresi ? (kayit.faturaAdresi.adres || "") : "";
    var teslimatAdr = kayit.teslimatAdresi ? (kayit.teslimatAdresi.adres || "") : "";
    var yetkililer = (musteri && musteri.iletisimler) || [];

    var ustBaslikHtml = "<div class='belge-ust-baslik belge-ust-baslik--logo-tek'>"
      + "<span class='belge-logo-mini'>WEICON</span>"
      + "</div>";

    var sehir = (musteri && musteri.sehir) || "";
    var yetkiliBilgiHtml = yetkililer.map(function(k){ return yetkiliSatiriHtml(k.isim, k.telefon, k.eposta); }).join("");

    var musteriBlokHtml = "<div class='belge-musteri-baslik'>CARİ BİLGİ</div>"
      + "<div class='belge-musteri-govde'>"
      + "<div class='belge-musteri-ad'>" + htmlEsc(kayit.musteri) + "</div>"
      + ((vade||faturaTuru||kargo) ? "<div class='belge-kosul-grid'>" + kosulKutusuHtml("📅","VADE",vade) + kosulKutusuHtml("📄","FATURA",faturaTuru) + kosulKutusuHtml("🚚","KARGO",kargo) + "</div>" : "")
      + (faturaAdr ? "<div class='belge-adres-blok'><b class='belge-adres-etiket-fatura'>🧾 FATURA ADRESİ</b>" + htmlEsc(faturaAdr) + (sehir?", "+htmlEsc(sehir):"") + "</div>" : "")
      + (teslimatAdr ? "<div class='belge-adres-blok-teslimat'><b class='belge-adres-etiket-teslimat'>🚚 TESLİMAT ADRESİ</b>" + htmlEsc(teslimatAdr) + (sehir?", "+htmlEsc(sehir):"") + "</div>" : "")
      + (yetkiliBilgiHtml ? "<div class='belge-yetkili-blok'><b class='belge-adres-etiket-yetkili'>👤 YETKİLİ BİLGİSİ</b>" + yetkiliBilgiHtml + "</div>" : "")
      + "</div>";

    var belgeBaslikMetni = (TIP_ETIKET_BELGE[kayit.tip]||"SİPARİŞ") + (kayit.kod ? " · " + kayit.kod : "") + " · " + htmlEsc(kayit.tarih) + (kayit.revizeZamani ? " · 🔄 REVİZE" : "");

    var html = "<div class='belge-kutu" + (sorunluMu?" belge-kutu--sorunlu":"") + "'>"
      + durumRozetHtml
      + ustBaslikHtml
      + musteriBlokHtml
      + "<div class='belge-belge-baslik-serit'>" + htmlEsc(belgeBaslikMetni) + "</div>"
      + "<div class='data-table-container'><table class='belge-urun-tablo'>"
      + "<thead><tr><th style='width:6%;'>SIRA</th><th style='width:34%;'>ÜRÜN BİLGİSİ</th><th>ADET</th><th>LİSTE</th><th>İSK</th><th>NET</th><th>TOPLAM</th><th>PRİM</th></tr></thead>"
      + "<tbody>" + satirlarHtml + "</tbody>"
      + "</table></div>"
      + "<div class='belge-genel-toplam-serit'>"
      + (kayit.kur ? "<span class='belge-gt-kur'>Hesaplanan Kur<br>" + fmt(kayit.kur) + " Euro</span>" : "")
      + "<span class='belge-gt-etiket'>GENEL TOPLAM</span>"
      + "<span class='belge-gt-deger'>" + fmt(netEuro) + " €</span>"
      + "</div>"
      + "<div class='belge-prim-serit'>"
      + "<span class='belge-prim-etiket'>MÜDÜR PRİMİ (TOPLAM)</span><span class='belge-prim-deger'>" + (toplamPrim<0?"Prim yok":fmt(toplamPrimTl)+" TL") + "</span>"
      + "</div>"
      + "</div>";

    document.getElementById("belgeIcerik").innerHTML = html;
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

document.addEventListener("DOMContentLoaded", function(){
  akilliGeriBagla("reports.html");
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  document.getElementById("btnYazdir").onclick = function(){ window.print(); };
  document.getElementById("btnBelgeSil").onclick = function(){
    if(!ref) return;
    if(!confirm("Bu kayıt tamamen silinsin mi? Bu geri alınamaz.")) return;
    var btn = document.getElementById("btnBelgeSil");
    btn.disabled = true;
    btn.textContent = "Siliniyor...";
    ReportsData.kaydiSil(ref.tip, ref.ts, function(basarili, err){
      if(basarili){
        alert("✓ Kayıt silindi.");
        window.location.href = "reports.html";
      } else {
        btn.disabled = false;
        btn.textContent = "🗑️ Kaydı Sil";
        hataGoster("Silinemedi: " + (err && err.message ? err.message : "bilinmeyen hata"));
      }
    });
  };

  var ref = null;
  try{ ref = JSON.parse(localStorage.getItem("weiconv2_goruntulenen_belge")||"null"); }catch(e){}
  if(!ref){
    hataGoster("Görüntülenecek belge bulunamadı.");
    return;
  }

  var sonCizilenKayit = null;

  function denemeCiz(){
    var liste = ReportsData.sonIslemler();
    var kayit = liste.find(function(k){ return k.tip===ref.tip && k.ts===ref.ts; });
    if(!kayit) return false;
    sonCizilenKayit = kayit;
    var musteri = CustomerData.musteriBul(kayit.musteri);
    belgeyiCiz(kayit, musteri);
    belgeGecmisiniCiz(kayit);

    var revizeBtn = document.getElementById("btnRevizeEt");
    revizeBtn.hidden = !ReportsData.SONRAKI_ASAMALAR[kayit.tip];
    return true;
  }

  document.getElementById("btnRevizeEt").onclick = function(){
    if(!sonCizilenKayit) return;
    var secenekler = ReportsData.SONRAKI_ASAMALAR[sonCizilenKayit.tip] || [];
    var TIP_ETIKET_KISA = {numune:"Numune", teklif:"Teklif", proforma:"Proforma", siparis:"Sipariş"};
    var mesaj = sonCizilenKayit.musteri + " için " + (sonCizilenKayit.urunler||[]).length + " ürün düzenlenmek üzere Sepet'e yüklenecek";
    mesaj += secenekler.length>1
      ? " (Gönder aşamasında " + secenekler.map(function(s){return TIP_ETIKET_KISA[s];}).join(" veya ") + " seçebileceksin)."
      : (" ve " + TIP_ETIKET_KISA[secenekler[0]] + " olarak ilerletilecek.");
    mesaj += " Devam edilsin mi?";
    if(!confirm(mesaj)) return;
    ReportsData.revizeBaslat(sonCizilenKayit);
  };

  ReportsData.arsivDegistiginde(denemeCiz);
  CustomerData.listeDegistiginde(denemeCiz);
  denemeCiz();
});
