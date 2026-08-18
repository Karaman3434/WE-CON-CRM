function faturaOnizlemeHtmlOlustur(musteriAdi, musteriSehir, tarihStr, urunler, belgeTipi, tip, idx){
  var primGoster = true; // Uygulama içindeki tüm kayıt detaylarında (SİPARİŞ/TEKLİF/PROFORMA/NUMUNE) prim her zaman gösterilir. NOT: Bu popup sadece uygulama içi görünüm — Mail/WhatsApp'a giden belge (siparisResmiHtmlOlustur) zaten hiç prim sütunu içermiyor.
  var satirlarHtml = "";
  var netEuro = 0, toplamPrim = 0;
  for(var i=0;i<urunler.length;i++){
    var item = urunler[i];
    netEuro += (item.toplamEuro!==undefined ? item.toplamEuro : ((item.iskBirim||0)*(item.adet||0)));
    var satirPrim = 0;
    if(primGoster){
      var mk = (item.iskBirim||0)-(item.dipFiyat||0);
      var hesaplananPrim = mk*(item.adet||0)*0.22;
      satirPrim = hesaplananPrim>0 ? hesaplananPrim : 0; // eksi/negatif primli satırlar toplama hiç katılmaz
      toplamPrim += satirPrim;
    }
    var satirBg = "#ffffff";
    satirlarHtml += "<tr style='background:"+satirBg+";'>"
      +"<td style='border:1px solid #3569b8;padding:5px 2px;text-align:center;color:#3569b8;font-weight:800;font-size:16.5px;'>"+(i+1)+"</td>"
      +"<td style='border:1px solid #3569b8;padding:5px 4px;'><div style='font-size:13.5px;font-weight:800;color:#444;line-height:1.3;word-break:break-word;'><span style='color:#3569b8;'>Berta:</span> "+(item.berta||"-")+" <span style='color:#e0524a;'>Abas:</span> "+(item.abas||"-")+"</div><div style='font-weight:800;margin-top:3px;color:#222;font-size:18px;line-height:1.25;word-break:break-word;'>"+item.name+"</div></td>"
      +"<td style='border:1px solid #3569b8;padding:5px 2px;text-align:center;color:#222;font-weight:800;font-size:16.5px;white-space:nowrap;'>"+item.adet+"</td>"
      +"<td style='border:1px solid #3569b8;padding:5px 2px;text-align:center;color:#222;font-weight:700;font-size:15px;white-space:nowrap;'>"+fmt(item.listeFiyat||0)+" €</td>"
      +"<td style='border:1px solid #3569b8;padding:5px 2px;text-align:center;color:#e0524a;font-weight:900;font-size:15px;white-space:nowrap;'>%"+(item.iskonto||0)+"</td>"
      +"<td style='border:1px solid #3569b8;padding:5px 2px;text-align:center;font-size:15px;font-weight:900;color:#222;white-space:nowrap;'>"+fmt(item.iskBirim!==undefined?item.iskBirim:(item.listeFiyat||0))+" €</td>"
      +"<td style='border:1px solid #3569b8;padding:5px 2px;text-align:center;font-size:15px;font-weight:900;color:#16a085;white-space:nowrap;'>"+fmt(item.toplamEuro!==undefined?item.toplamEuro:((item.iskBirim||0)*(item.adet||0)))+" €</td>"
      +(primGoster ? "<td style='border:1px solid #3569b8;padding:5px 2px;text-align:center;color:#222;font-weight:800;font-size:13.5px;white-space:nowrap;'>"+(satirPrim<0 ? "Yok" : fmt(satirPrim)+" €")+"</td>" : "")
      +"</tr>";
  }

  var hareketSecBtn = (tip!==undefined && tip!==null && idx!==undefined && idx!==null)
    ? "<button onclick=\"faturaIslemlerPopupAc();\" style='width:100%;background:linear-gradient(135deg,#f2994a,#d97e2f);color:#fff;border:none;padding:22px 18px;font-size:28px;font-weight:bold;border-radius:8px;cursor:pointer;margin:0 0 14px;'>⚙️ İşlemler</button>"
    : "";
  var duzenlenebilir = (tip!==undefined && tip!==null && idx!==undefined && idx!==null);
  var badgeOnclick = duzenlenebilir ? " onclick=\"kayitDuzenleAc('"+tip+"',"+idx+")\" title='Dokunarak düzenle'" : "";

  // KAYITLI (arşivlenmiş) bir işlem görüntüleniyorsa (tip/idx verilmişse) bu kaydın kendisi burada
  // tek seferde tutulur — aşağıdaki tüm alanlar (yetkili dahil) buradan okunur, aksi halde o an aktif
  // "Hesapla" ekranında başka bir müşteri için seçili duran bir yetkili kişi buraya sızabilir.
  var kayitVarMi = (tip!==undefined && tip!==null && idx!==undefined && idx!==null && arsivData && arsivData[tip] && arsivData[tip][idx]);
  var aktifKayit = kayitVarMi ? arsivData[tip][idx] : null;

  var kayitKodu = aktifKayit ? aktifKayit.kod : null;
  var kayitRevizeZamani = aktifKayit ? aktifKayit.revizeZamani : null;
  var kayitDurumu = aktifKayit ? aktifKayit.durum : null;
  var kayitKacanRakip = aktifKayit ? aktifKayit.kacanRakip : null;
  var sorunluKayitMi = kayitDurumu==="iptal" || kayitDurumu==="iade" || kayitDurumu==="kacan";
  var DURUM_ETIKET = {iptal:{ikon:"🚫", ad:"İPTAL EDİLDİ", renk:"#c0392b", bg:"#fdeceb"}, iade:{ikon:"↩️", ad:"İADE EDİLDİ", renk:"#6a1b9a", bg:"#f3e5f5"}, kacan:{ikon:"❌", ad:"KAÇAN SİPARİŞ"+(kayitKacanRakip?" — → "+kayitKacanRakip:""), renk:"#c0392b", bg:"#fff4e5"}};
  var durumRozetBlok = (kayitDurumu && DURUM_ETIKET[kayitDurumu])
    ? "<div style='background:"+DURUM_ETIKET[kayitDurumu].bg+";color:"+DURUM_ETIKET[kayitDurumu].renk+";padding:10px 16px;font-size:16px;font-weight:900;text-align:center;letter-spacing:.5px;'>"+DURUM_ETIKET[kayitDurumu].ikon+" BU KAYIT "+DURUM_ETIKET[kayitDurumu].ad+"</div>"
    : "";

  // Dinamik müşteri bilgileri (Yetkili Kişi/Telefon/E-Posta/Teslimat Adresi/Vade/Fatura/Kargo) —
  // KAYITLI (arşivlenmiş) bir işlem görüntüleniyorsa aşağıdaki aktifKayit'ten okunur.
  var vade, faturaTuru, kargo, yetkiliAd, yetkiliTel, yetkiliMail, teslimatAdr, faturaAdr;
  if(aktifKayit){
    vade = aktifKayit.vade || "";
    faturaTuru = aktifKayit.fatura || "";
    kargo = aktifKayit.kargo || "";
    yetkiliAd = aktifKayit.yetkili || "";
    yetkiliTel = ""; yetkiliMail = "";
    // Telefon/e-posta arşivde ayrı saklanmıyor — o kaydın ait olduğu müşterinin kişi listesinden,
    // isim eşleşmesiyle bulunur. Eşleşme yoksa boş bırakılır (yanlış kişinin bilgisini göstermemek için).
    var _sahibiMusteri = null;
    for(var _mi=0;_mi<musteriListesi.length;_mi++){
      if(musteriListesi[_mi].ad===musteriAdi || (musteriSehir && musteriListesi[_mi].ad===musteriAdi.split(" - ")[0])){ _sahibiMusteri = musteriListesi[_mi]; break; }
    }
    if(_sahibiMusteri && _sahibiMusteri.iletisimler && yetkiliAd){
      var _esKisi = _sahibiMusteri.iletisimler.find(function(k){ return k.isim===yetkiliAd; });
      if(_esKisi){ yetkiliTel = _esKisi.telefon||""; yetkiliMail = _esKisi.eposta||""; }
    }
    // Bu belge ilk kaydedildiğinde SEÇİLİ OLAN adresler — sonradan müşterinin
    // adres listesi değişse/silinse bile bu geçmiş belge hep doğru göründüğü
    // hâliyle kalır (aktifKayit.faturaAdresi/teslimatAdresi kaydet anında donuyor).
    teslimatAdr = aktifKayit.teslimatAdresi || "";
    faturaAdr = aktifKayit.faturaAdresi || "";
  } else {
    vade = (typeof getDynamicCustomerVade==="function") ? getDynamicCustomerVade() : "";
    faturaTuru = (typeof getDynamicCustomerFatura==="function") ? getDynamicCustomerFatura() : "";
    kargo = (typeof getDynamicCustomerKargo==="function") ? getDynamicCustomerKargo() : "";
    yetkiliAd = (typeof getDynamicCustomerYetkili==="function") ? getDynamicCustomerYetkili() : "";
    yetkiliTel = (typeof seciliYetkiliKisi!=="undefined" && seciliYetkiliKisi && seciliYetkiliKisi.telefon) || "";
    yetkiliMail = (typeof seciliYetkiliKisi!=="undefined" && seciliYetkiliKisi && seciliYetkiliKisi.eposta) || "";
    teslimatAdr = (typeof getDynamicCustomerTeslimatAdresi==="function") ? getDynamicCustomerTeslimatAdresi() : "";
    faturaAdr = (typeof getDynamicCustomerFaturaAdresi==="function") ? getDynamicCustomerFaturaAdresi() : "";
  }
  var LACIVERT = "#3569b8";

  var bilgiKutusu = function(etiket, deger, wrap){
    return "<div style='min-width:0;'>"
      +"<div style='font-size:11px;font-weight:800;color:"+LACIVERT+";letter-spacing:.3px;'>"+etiket+"</div>"
      +"<div style='font-size:15px;font-weight:700;color:#222;margin-top:4px;padding-bottom:6px;border-bottom:1px solid #d5dce6;"+(wrap?"white-space:pre-wrap;word-break:break-word;":"overflow:hidden;text-overflow:ellipsis;white-space:nowrap;")+"'>"+(deger||"-")+"</div>"
      +"</div>";
  };

  var kosulKutusu = function(ikon, etiket, deger){
    return "<div style='display:flex;align-items:center;gap:8px;min-width:0;'>"
      +"<div style='flex-shrink:0;width:31px;height:31px;border-radius:4px;background:"+LACIVERT+";display:flex;align-items:center;justify-content:center;font-size:17px;'>"+ikon+"</div>"
      +"<div style='min-width:0;'>"
        +"<div style='font-size:12px;font-weight:900;color:#c0392b;'>"+etiket+"</div>"
        +"<div style='font-size:16px;font-weight:800;color:#222;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>"+(deger||"-")+"</div>"
      +"</div>"
    +"</div>";
  };

  var logoSvgKucuk = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 420 70' style='height:22px;width:auto;flex-shrink:0;'>"
    +"<g fill='"+LACIVERT+"'><rect x='3' y='3' width='62' height='64' rx='4' ry='4'/><rect x='73' y='3' width='62' height='64' rx='4' ry='4'/><rect x='143' y='3' width='62' height='64' rx='4' ry='4'/><rect x='213' y='3' width='62' height='64' rx='4' ry='4'/><rect x='283' y='3' width='62' height='64' rx='4' ry='4'/><rect x='353' y='3' width='62' height='64' rx='4' ry='4'/></g>"
    +"<g fill='#fff' font-family='Arial Black,Arial' font-weight='900' font-size='44' text-anchor='middle'><text x='34' y='54'>W</text><text x='104' y='54'>E</text><text x='174' y='54'>I</text><text x='244' y='54'>C</text><text x='314' y='54'>O</text><text x='384' y='54'>N</text></g></svg>";

  var ustBaslikBlok =
    "<div"+badgeOnclick+" style='padding:14px 16px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;border-bottom:2px solid "+LACIVERT+";"+(duzenlenebilir?"cursor:pointer;":"")+"'>"
      +"<div style='display:flex;align-items:center;gap:10px;min-width:0;'>"
        + logoSvgKucuk
        +"<span style='font-size:22px;font-weight:900;color:"+LACIVERT+";white-space:nowrap;'>"+(belgeTipi||"SİPARİŞ")+" FORMU"+(duzenlenebilir?" ✏️":"")+"</span>"
      +"</div>"
      +"<table style='border-collapse:collapse;font-size:12px;flex-shrink:0;'>"
        +"<tr><td style='background:"+LACIVERT+";color:#fff;font-weight:900;padding:4px 8px;border:1px solid "+LACIVERT+";white-space:nowrap;'>TARİH</td><td style='padding:4px 10px;border:1px solid #3569b8;font-weight:800;color:#222;white-space:nowrap;'>"+tarihStr+"</td></tr>"
        +(kayitRevizeZamani?"<tr onclick=\"event.stopPropagation();revizeGecmisiGoster('"+tip+"',"+idx+")\" style='cursor:pointer;'><td style='background:#c0392b;color:#fff;font-weight:900;padding:4px 8px;border:1px solid #c0392b;white-space:nowrap;'>🔄 REVİZE</td><td style='padding:4px 10px;border:1px solid #3569b8;font-weight:800;color:#c0392b;white-space:nowrap;font-size:13px;'>"+revizeTarihSaatFormatla(kayitRevizeZamani)+" (fiyat geçmişi için dokun)</td></tr>":"")
      +"</table>"
    +"</div>";

  var musteriKaydi = (typeof musteriKartIdx!=="undefined" && musteriKartIdx!==null && musteriListesi[musteriKartIdx]) ? musteriListesi[musteriKartIdx] : null;
  var adresGosterilecek = faturaAdr || (musteriKaydi && musteriKaydi.acikAdres) || musteriSehir || "";
  var digerKisiler = (musteriKaydi && musteriKaydi.iletisimler) ? musteriKaydi.iletisimler : [];
  var ikinciKisi = null;
  for(var _fk=0;_fk<digerKisiler.length;_fk++){
    if(digerKisiler[_fk].isim && digerKisiler[_fk].isim!==yetkiliAd){ ikinciKisi = digerKisiler[_fk]; break; }
  }
  var yetkiliSatiriYaz = function(isim, tel, eposta){
    if(!isim && !tel && !eposta) return "";
    var parcalar = [];
    if(tel) parcalar.push("📞 "+tel);
    if(eposta) parcalar.push("✉️ "+eposta);
    return "<div style='font-size:15px;color:#1a2a3a;line-height:1.5;padding-bottom:6px;margin-bottom:6px;border-bottom:1px solid #eef1f4;'>👤 <b style='font-weight:800;'>"+(isim||"-")+"</b>"+(parcalar.length?" — <span style='color:#556;font-size:14px;'>"+parcalar.join(" · ")+"</span>":"")+"</div>";
  };

  var musteriBilgileriBlok =
    "<div style='background:"+LACIVERT+";color:#fff;padding:9px 16px;font-size:16px;font-weight:900;letter-spacing:.5px;'>MÜŞTERİ BİLGİLERİ</div>"
    +"<div style='padding:12px 16px 14px;'>"
    +"<div style='font-size:20px;font-weight:900;color:#1a2a3a;margin-bottom:6px;'>"+musteriAdi+"</div>"
    +(adresGosterilecek ? "<div style='font-size:15px;color:#3a4a5c;font-weight:700;line-height:1.35;padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid #d5dce6;'><b style='color:"+LACIVERT+";font-size:13px;display:block;margin-bottom:2px;font-weight:900;'>🧾 FATURA ADRESİ</b>"+adresGosterilecek+"</div>" : "")
    +(vade||faturaTuru||kargo ? (
      "<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid #d5dce6;'>"
        + kosulKutusu("📅", "VADE", vade)
        + kosulKutusu("📄", "FATURA", faturaTuru)
        + kosulKutusu("🚚", "KARGO", kargo)
      +"</div>"
    ) : "")
    + yetkiliSatiriYaz(yetkiliAd, yetkiliTel, yetkiliMail)
    + (ikinciKisi ? yetkiliSatiriYaz(ikinciKisi.isim, ikinciKisi.telefon, ikinciKisi.eposta) : "")
    +(teslimatAdr ? "<div style='font-size:12.5px;color:#3a4a5c;font-weight:700;line-height:1.35;margin-top:8px;padding-top:8px;border-top:1px dashed #dde3ea;'><b style='color:#c0392b;font-size:16px;display:block;margin-bottom:2px;font-weight:900;'>🚚 TESLİMAT ADRESİ</b>"+teslimatAdr+"</div>" : "")
    +"</div>";

  var belgeGecmisiOnclick = duzenlenebilir ? " onclick=\"belgeGecmisiPopupAc('"+tip+"',"+idx+")\"" : "";
  var belgeBaslikMetni = (belgeTipi||"SİPARİŞ") + (kayitKodu ? " · "+kayitKodu : " DETAYLARI");
  var belgeBaslikSagIkon = duzenlenebilir
    ? "<span style='display:flex;align-items:center;gap:6px;flex-shrink:0;'>"
        +(kayitRevizeZamani ? "<span style='background:#c0392b;color:#fff;font-size:11px;font-weight:900;padding:3px 9px;border-radius:8px;'>REVİZE</span>" : "")
        +"<span style='font-size:11px;font-weight:900;opacity:.85;white-space:nowrap;'>📜 Geçmiş</span>"
      +"</span>"
    : "";

  return "<div style='border:"+(sorunluKayitMi?"4px solid #c0392b":"2px solid "+LACIVERT)+";border-radius:8px;overflow:hidden;box-sizing:border-box;margin-bottom:14px;'>"
    + durumRozetBlok
    + ustBaslikBlok
    + musteriBilgileriBlok
    +(hareketSecBtn?"<div style='padding:0 16px 14px;'>"+hareketSecBtn+"</div>":"")
    +"<div"+belgeGecmisiOnclick+" style='background:"+LACIVERT+";color:#fff;padding:9px 16px;font-size:13px;font-weight:900;letter-spacing:.5px;display:flex;justify-content:space-between;align-items:center;gap:8px;"+(duzenlenebilir?"cursor:pointer;":"")+"'><span style='overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>"+belgeBaslikMetni+"</span>"+belgeBaslikSagIkon+"</div>"
    +"<table style='width:100%;table-layout:fixed;border-collapse:collapse;font-size:12px;'>"
    +"<thead><tr style='background:#cfe2f3;'>"
    +"<th style='border:1px solid #3569b8;color:#3569b8;padding:5px 2px;text-align:center;width:6%;font-size:15px;'>SIRA</th>"
    +"<th style='border:1px solid #3569b8;color:#3569b8;padding:5px 3px;text-align:center;width:"+(primGoster?"25%":"29%")+";font-size:15px;'>ÜRÜN BİLGİSİ</th>"
    +"<th style='border:1px solid #3569b8;color:#3569b8;padding:5px 2px;text-align:center;font-size:15px;'>ADET</th>"
    +"<th style='border:1px solid #3569b8;color:#3569b8;padding:5px 2px;text-align:center;font-size:15px;'>LİSTE</th>"
    +"<th style='border:1px solid #3569b8;color:#3569b8;padding:5px 2px;text-align:center;font-size:15px;'>İSK</th>"
    +"<th style='border:1px solid #3569b8;color:#3569b8;padding:5px 2px;text-align:center;font-size:15px;'>NET</th>"
    +"<th style='border:1px solid #3569b8;color:#3569b8;padding:5px 2px;text-align:center;font-size:15px;'>TOPLAM</th>"
    +(primGoster ? "<th style='border:1px solid #3569b8;color:#3569b8;padding:5px 2px;text-align:center;font-size:15px;'>PRİM</th>" : "")
    +"</tr></thead><tbody>"+satirlarHtml+"</tbody>"
    +"</table>"
    +"<div style='background:"+LACIVERT+";color:#fff;display:flex;justify-content:flex-end;align-items:center;padding:14px 16px;gap:16px;'>"
    +"<span style='font-size:22.5px;font-weight:900;letter-spacing:.5px;'>GENEL TOPLAM</span><span style='width:1px;align-self:stretch;background:rgba(255,255,255,.35);'></span><span style='font-size:31.5px;font-weight:900;'>"+fmt(netEuro)+" €</span>"
    +"</div>"
    +(primGoster ? "<div style='background:#16a085;color:#fff;display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-top:1px solid #cfe2f3;'><span style='font-size:21px;font-weight:900;'>MÜDÜR PRİMİ (TOPLAM)</span><span style='font-size:24px;font-weight:900;'>"+(toplamPrim<0?"Prim yok":fmt(toplamPrim)+" €")+"</span></div>" : "")
    +"</div>";
}

var _faturaOnizlemeAktifTip = null;
var _faturaOnizlemeAktifIdx = null;

// --- Belge Geçmişi (soy ağacı) ---------------------------------------------
// Bir belgenin (Numune/Teklif/Proforma/Sipariş) geriye ve ileriye doğru
// bağlantılı olduğu diğer belgeleri bulur: aynı müşteri + ortak Berta ürün
// kodu eşleşmesiyle. NOT: Belgelerde "bir önceki belgenin kimliği" bilgisi
// AYRICA saklanmadığı için bu tahmine dayalı (best-effort) bir eşleştirmedir;
// bu yüzden tespit edilemeyen ara adımlar zincirde görünmeyebilir.
var TUM_BELGE_TIPLERI = ["numune","teklif","proforma","siparis"];
var TUM_BELGE_TIP_ETIKET = {numune:"Numune", teklif:"Fiyat Teklifi", proforma:"Proforma Fatura", siparis:"Sipariş"};
var TUM_BELGE_TIP_IKON = {numune:"🧪", teklif:"📝", proforma:"🧾", siparis:"📦"};
var TUM_BELGE_TIP_RENK = {numune:"#b7601f", teklif:"#1f9d55", proforma:"#8e44ad", siparis:"#003a70"};

function belgeZinciriBul(tip, idx){
  arsivData = lsGet("weicon_arsiv",{});
  var hepsi = [];
  for(var t=0;t<TUM_BELGE_TIPLERI.length;t++){
    var tt = TUM_BELGE_TIPLERI[t];
    var liste = arsivData[tt]||[];
    for(var k=0;k<liste.length;k++){
      var kayit = liste[k];
      hepsi.push({
        tipKey: tt, tipIdx: k, musteri: kayit.musteri||"-", tarih: kayit.tarih||"", ts: kayit.ts||0,
        kod: kayit.kod||"", durum: kayit.durum||null, revizeZamani: kayit.revizeZamani||null,
        adet: (kayit.urunler||[]).length,
        bertaKodlari: (kayit.urunler||[]).map(function(u){ return u.berta; }).filter(Boolean)
      });
    }
  }
  var mevcut = null;
  for(var i=0;i<hepsi.length;i++){ if(hepsi[i].tipKey===tip && hepsi[i].tipIdx===idx){ mevcut = hepsi[i]; break; } }
  if(!mevcut) return [];

  function bagliMi(a,b){
    if(a.musteri !== b.musteri) return false;
    return a.bertaKodlari.some(function(kod){ return b.bertaKodlari.indexOf(kod)>=0; });
  }

  var zincir = [mevcut];
  var kullanildi = {}; kullanildi[mevcut.tipKey+"_"+mevcut.tipIdx] = true;

  // Geriye doğru: her adımda "şu ana kadarki en eski adımdan önceki, ona bağlı en yakın kayıt"
  var referans = mevcut;
  while(true){
    var enYakinOncesi = null;
    for(var g=0;g<hepsi.length;g++){
      var aday = hepsi[g];
      var anahtar = aday.tipKey+"_"+aday.tipIdx;
      if(kullanildi[anahtar]) continue;
      if(aday.ts >= referans.ts) continue;
      if(!bagliMi(referans, aday)) continue;
      if(!enYakinOncesi || aday.ts > enYakinOncesi.ts) enYakinOncesi = aday;
    }
    if(!enYakinOncesi) break;
    zincir.unshift(enYakinOncesi);
    kullanildi[enYakinOncesi.tipKey+"_"+enYakinOncesi.tipIdx] = true;
    referans = enYakinOncesi;
  }

  // İleriye doğru: aynı mantık, sonrasına bakarak
  referans = mevcut;
  while(true){
    var enYakinSonrasi = null;
    for(var s=0;s<hepsi.length;s++){
      var aday2 = hepsi[s];
      var anahtar2 = aday2.tipKey+"_"+aday2.tipIdx;
      if(kullanildi[anahtar2]) continue;
      if(aday2.ts <= referans.ts) continue;
      if(!bagliMi(referans, aday2)) continue;
      if(!enYakinSonrasi || aday2.ts < enYakinSonrasi.ts) enYakinSonrasi = aday2;
    }
    if(!enYakinSonrasi) break;
    zincir.push(enYakinSonrasi);
    kullanildi[enYakinSonrasi.tipKey+"_"+enYakinSonrasi.tipIdx] = true;
    referans = enYakinSonrasi;
  }

  return zincir;
}

function belgeGecmisiPopupAc(tip, idx){
  var zincir = belgeZinciriBul(tip, idx);
  var html = "<div style='font-size:19px;font-weight:900;color:#003a70;margin-bottom:4px;'>📜 Belge Geçmişi</div>";
  if(zincir.length<=1){
    html += "<div style='font-size:14px;color:#8a97a6;font-weight:700;'>Bu belgeyle bağlantılı başka bir belge bulunamadı.</div>";
  } else {
    html += "<div style='font-size:14px;color:#8a97a6;font-weight:700;margin-bottom:16px;'>"+safeText(zincir[0].musteri)+" — bu iş için "+zincir.length+" belge bulundu</div>";
    for(var i=0;i<zincir.length;i++){
      var adim = zincir[i];
      var renk = TUM_BELGE_TIP_RENK[adim.tipKey] || "#3569b8";
      var aktifMi = (adim.tipKey===tip && adim.tipIdx===idx);
      var sonMu = (i===zincir.length-1);
      html += "<div style='position:relative;padding-left:30px;padding-bottom:"+(sonMu?"0":"20px")+";'>"
        +(sonMu?"":"<div style='position:absolute;left:9px;top:22px;bottom:0;width:3px;background:#c3d7f0;'></div>")
        +"<div style='position:absolute;left:0;top:2px;width:20px;height:20px;border-radius:50%;background:"+renk+";box-shadow:0 0 0 4px #fff;'></div>"
        +"<div style='font-size:12px;font-weight:800;color:#8a97a6;margin-bottom:2px;'>"+tarihKisaltTekSatir(adim.tarih)+"</div>"
        +"<div onclick=\"belgeGecmisiKapat();arsivDetayAc('"+adim.tipKey+"',"+adim.tipIdx+")\" style='cursor:pointer;border-radius:10px;padding:8px 12px;background:"+renk+"18;border:1.5px solid "+renk+"55;'>"
          +"<div style='font-size:16px;font-weight:900;color:"+renk+";'>"+TUM_BELGE_TIP_IKON[adim.tipKey]+" "+TUM_BELGE_TIP_ETIKET[adim.tipKey]
            +(aktifMi ? "<span style='float:right;background:#16a085;color:#fff;font-size:10px;font-weight:900;padding:2px 8px;border-radius:6px;'>ŞU AN BURADASIN</span>" : "")
          +"</div>"
          +"<div style='font-size:12.5px;font-weight:700;color:"+renk+";opacity:.8;margin-top:2px;'>"+safeText(adim.kod)+" · "+adim.adet+" ürün"+(adim.revizeZamani?" · 🔄 revize edildi":"")+(adim.durum==="iptal"?" · 🚫 iptal":adim.durum==="iade"?" · ↩️ iade":adim.durum==="kacan"?" · ❌ kaçtı":"")+"</div>"
        +"</div>"
      +"</div>";
    }
  }
  document.getElementById("belgeGecmisiIcerik").innerHTML = html;
  document.getElementById("belgeGecmisiModal").style.display = "flex";
}
function belgeGecmisiKapat(){
  document.getElementById("belgeGecmisiModal").style.display = "none";
}
// --------------------------------------------------------------------------

function faturaOnizlemePopupGoster(musteriAdi, musteriSehir, tarihStr, urunler, belgeTipi, tip, idx){
  document.getElementById("faturaOnizlemeIcerik").innerHTML = faturaOnizlemeHtmlOlustur(musteriAdi, musteriSehir, tarihStr, urunler, belgeTipi, tip, idx);
  document.getElementById("faturaOnizlemeModal").style.display = "flex";
  var silBtn = document.getElementById("faturaOnizlemeSilBtn");
  var iadeBtn = document.getElementById("faturaOnizlemeIadeBtn");
  var duzenleBtn = document.getElementById("faturaOnizlemeDuzenleBtn");
  var kacanBtn = document.getElementById("faturaOnizlemeKacanBtn");
  if(tip!==undefined && tip!==null && idx!==undefined && idx!==null){
    _faturaOnizlemeAktifTip = tip;
    _faturaOnizlemeAktifIdx = idx;
    if(silBtn) silBtn.style.display = "block";
    if(iadeBtn) iadeBtn.style.display = "block";
    if(duzenleBtn) duzenleBtn.style.display = "block";
    if(kacanBtn) kacanBtn.style.display = "block";
  } else {
    _faturaOnizlemeAktifTip = null;
    _faturaOnizlemeAktifIdx = null;
    if(silBtn) silBtn.style.display = "none";
    if(iadeBtn) iadeBtn.style.display = "none";
    if(duzenleBtn) duzenleBtn.style.display = "none";
    if(kacanBtn) kacanBtn.style.display = "none";
  }
}

// --- Kaçan Sipariş işaretleme -------------------------------------------
function kacanIsaretlePopupAc(){
  if(_faturaOnizlemeAktifTip===null || _faturaOnizlemeAktifIdx===null) return;
  arsivData = lsGet("weicon_arsiv",{});
  var liste = arsivData[_faturaOnizlemeAktifTip];
  if(!liste || !liste[_faturaOnizlemeAktifIdx]) return;
  var kayit = liste[_faturaOnizlemeAktifIdx];
  var zatenKacanMi = kayit.durum==="kacan";
  document.getElementById("kacanSebepSelect").value = kayit.kacanSebep || "Fiyat";
  document.getElementById("kacanRakipInput").value = kayit.kacanRakip || "";
  document.getElementById("kacanNotInput").value = kayit.kacanNot || "";
  document.getElementById("kacanKaldirBtn").style.display = zatenKacanMi ? "block" : "none";
  document.getElementById("kacanIsaretleModal").style.display = "flex";
}
function kacanIsaretleModalKapat(){
  document.getElementById("kacanIsaretleModal").style.display = "none";
}
function kacanIsaretleKaydet(){
  if(_faturaOnizlemeAktifTip===null || _faturaOnizlemeAktifIdx===null) return;
  arsivData = lsGet("weicon_arsiv",{});
  var liste = arsivData[_faturaOnizlemeAktifTip];
  if(!liste || !liste[_faturaOnizlemeAktifIdx]) return;
  var kayit = liste[_faturaOnizlemeAktifIdx];
  kayit.durum = "kacan";
  kayit.kacanSebep = document.getElementById("kacanSebepSelect").value;
  kayit.kacanRakip = document.getElementById("kacanRakipInput").value.trim();
  kayit.kacanNot = document.getElementById("kacanNotInput").value.trim();
  kayit.kacanZamani = Date.now();
  lsSet("weicon_arsiv", arsivData);
  if(window.fbSet){
    arsivGuvenliKaydet({tip:_faturaOnizlemeAktifTip, kayit:kayit}).catch(function(e){
      showToast("⚠️ Firebase HATASI: "+((e&&(e.code||e.message))||"bilinmiyor"), 6000);
    });
  }
  showToast("❌ Kaçan sipariş olarak işaretlendi.");
  kacanIsaretleModalKapat();
  faturaOnizlemePopupGoster(kayit.musteri||"-", "", kayit.tarih||"-", kayit.urunler||[], ISLEM_TURU_ADI[_faturaOnizlemeAktifTip]||_faturaOnizlemeAktifTip.toUpperCase(), _faturaOnizlemeAktifTip, _faturaOnizlemeAktifIdx);
  if(typeof sonIslemleriRenderEt==="function") sonIslemleriRenderEt();
  if(typeof musteriGecmisRenderEt==="function" && musteriKartIdx!==null) musteriGecmisRenderEt();
}
function kacanIsaretiKaldir(){
  if(_faturaOnizlemeAktifTip===null || _faturaOnizlemeAktifIdx===null) return;
  arsivData = lsGet("weicon_arsiv",{});
  var liste = arsivData[_faturaOnizlemeAktifTip];
  if(!liste || !liste[_faturaOnizlemeAktifIdx]) return;
  var kayit = liste[_faturaOnizlemeAktifIdx];
  kayit.durum = null;
  kayit.kacanSebep = null; kayit.kacanRakip = null; kayit.kacanNot = null; kayit.kacanZamani = null;
  lsSet("weicon_arsiv", arsivData);
  if(window.fbSet){
    arsivGuvenliKaydet({tip:_faturaOnizlemeAktifTip, kayit:kayit}).catch(function(e){ console.error("Firebase yazma hatası:", e); });
  }
  showToast("✓ Kaçan işareti kaldırıldı.");
  kacanIsaretleModalKapat();
  faturaOnizlemePopupGoster(kayit.musteri||"-", "", kayit.tarih||"-", kayit.urunler||[], ISLEM_TURU_ADI[_faturaOnizlemeAktifTip]||_faturaOnizlemeAktifTip.toUpperCase(), _faturaOnizlemeAktifTip, _faturaOnizlemeAktifIdx);
  if(typeof sonIslemleriRenderEt==="function") sonIslemleriRenderEt();
  if(typeof musteriGecmisRenderEt==="function" && musteriKartIdx!==null) musteriGecmisRenderEt();
}
// --------------------------------------------------------------------------

// Kaydı İptal veya İade olarak işaretler (kayıt SİLİNMEZ, listede üzeri çizili görünür).
// Aynı duruma tekrar dokunulursa işaret kaldırılır (normale döner).
function faturaOnizlemedenDurumIsaretle(durum){
  if(_faturaOnizlemeAktifTip===null || _faturaOnizlemeAktifIdx===null) return;
  arsivData = lsGet("weicon_arsiv",{});
  var liste = arsivData[_faturaOnizlemeAktifTip];
  if(!liste || !liste[_faturaOnizlemeAktifIdx]) return;
  var kayit = liste[_faturaOnizlemeAktifIdx];
  kayit.durum = (kayit.durum===durum) ? null : durum;
  lsSet("weicon_arsiv", arsivData);
  if(window.fbSet){
    arsivGuvenliKaydet({tip:_faturaOnizlemeAktifTip, kayit:kayit}).catch(function(e){
      showToast("⚠️ Firebase HATASI: "+((e&&(e.code||e.message))||"bilinmiyor"), 6000);
    });
  }
  var etiket = kayit.durum==="iptal" ? "🚫 İptal edildi" : (kayit.durum==="iade" ? "↩️ İade edildi" : "✓ İşaret kaldırıldı");
  showToast(etiket);
  faturaOnizlemePopupGoster(kayit.musteri||"-", "", kayit.tarih||"-", kayit.urunler||[], ISLEM_TURU_ADI[_faturaOnizlemeAktifTip]||_faturaOnizlemeAktifTip.toUpperCase(), _faturaOnizlemeAktifTip, _faturaOnizlemeAktifIdx);
  if(typeof sonIslemleriRenderEt==="function") sonIslemleriRenderEt();
  if(typeof musteriGecmisRenderEt==="function" && musteriKartIdx!==null) musteriGecmisRenderEt();
}

function faturaOnizlemedenSil(){
  if(_faturaOnizlemeAktifTip===null || _faturaOnizlemeAktifIdx===null) return;
  istatistikKayitSil(_faturaOnizlemeAktifTip, _faturaOnizlemeAktifIdx);
  faturaOnizlemeKapat();
  if(typeof musteriGecmisRenderEt==="function" && musteriKartIdx!==null) musteriGecmisRenderEt();
  if(typeof sonIslemleriRenderEt==="function") sonIslemleriRenderEt();
}

function faturaOnizlemeAc(){
  if(hareketListesi.length===0){ showToast("Listede ürün yok."); return; }
  var musteriAdi = seciliMusteri ? (seciliMusteri.ad||"-") : "-";
  var musteriSehir = seciliMusteri ? sehirFormatla(seciliMusteri.sehir||"") : "";
  var bugun = new Date();
  var tarihStr = ("0"+bugun.getDate()).slice(-2)+"."+("0"+(bugun.getMonth()+1)).slice(-2)+"."+bugun.getFullYear();
  var belgeTipi = ISLEM_TURU_ADI[secilenMod] || "SİPARİŞ";
  faturaOnizlemePopupGoster(musteriAdi, musteriSehir, tarihStr, hareketListesi, belgeTipi);
}

// "⚙️ İşlemler" tetikleyicisine dokununca açılır — Hareket Seç, Kaydı Düzenle,
// Kaçan İşaretle, Sil, İade, Yazdır, İlerlet, Kapat hepsi burada toplu.
function faturaIslemlerPopupAc(){
  document.getElementById("faturaIslemlerModal").style.display = "flex";
}

function faturaOnizlemeKapat(){
  document.getElementById("faturaOnizlemeModal").style.display = "none";
  var islemlerModal = document.getElementById("faturaIslemlerModal");
  if(islemlerModal) islemlerModal.style.display = "none";
  faturaOnizlemeIlerletModuKapat();
  if(onizlemeCagrildigiYer==="gonder"){
    onizlemeCagrildigiYer = null;
    document.getElementById("iletisimIslemleriModal").style.display="flex";
  }
}

// Açık süreç bannerındaki tarih/tip satırına dokununca o kaydın fatura önizlemesini İlerlet butonuyla birlikte açar
function acikSurecKayitOnizlemeAc(){
  try{
    if(musteriKartIdx===null){ showToast("Müşteri bulunamadı (kart açık değil)."); return; }
    var m = musteriListesi[musteriKartIdx];
    if(!m){ showToast("Müşteri kaydı bulunamadı."); return; }
    var acikKayit = musteriAcikSurecKaydiGetir(m.ad);
    if(!acikKayit){ showToast("Açık süreç kaydı bulunamadı."); return; }
    var arsiv = lsGet("weicon_arsiv",{});
    var liste = arsiv[acikKayit.tip]||[];
    var idx = -1;
    for(var i=0;i<liste.length;i++){ if(liste[i].ts===acikKayit.ts){ idx=i; break; } }
    var belgeTipi = ISLEM_TURU_ADI[acikKayit.tip] || acikKayit.tip.toUpperCase();
    document.getElementById("musteriKartModal").style.display="none";
    document.getElementById("islemBaslatModal").style.display="none";
    faturaOnizlemePopupGoster(acikKayit.kayit.musteri||m.ad, sehirFormatla(m.sehir||""), acikKayit.kayit.tarih||acikKayit.tarih, acikKayit.kayit.urunler||[], belgeTipi, acikKayit.tip, idx);
    faturaOnizlemeIlerletModuAc();
  } catch(e){
    showToast("⚠️ Hata: "+(e&&e.message?e.message:"bilinmeyen hata"), 6000);
  }
}

function faturaOnizlemeIlerletModuAc(){
  var ilerletBtn = document.getElementById("faturaOnizlemeIlerletBtn");
  var yazdirBtn = document.getElementById("faturaOnizlemeYazdirBtn");
  var kapatBtn = document.getElementById("faturaOnizlemeKapatBtn");
  if(ilerletBtn) ilerletBtn.style.display="flex";
  if(yazdirBtn) yazdirBtn.style.display="none";
  if(kapatBtn) kapatBtn.style.background="#e0524a";
}

function faturaOnizlemeIlerletModuKapat(){
  var ilerletBtn = document.getElementById("faturaOnizlemeIlerletBtn");
  var yazdirBtn = document.getElementById("faturaOnizlemeYazdirBtn");
  var kapatBtn = document.getElementById("faturaOnizlemeKapatBtn");
  if(ilerletBtn) ilerletBtn.style.display="none";
  if(yazdirBtn) yazdirBtn.style.display="flex";
  if(kapatBtn) kapatBtn.style.background="#6c757d";
}

function faturaOnizlemedenIlerlet(){
  document.getElementById("faturaOnizlemeModal").style.display="none";
  faturaOnizlemeIlerletModuKapat();
  document.getElementById("musteriKartModal").style.display="none";
  document.getElementById("islemBaslatModal").style.display="none";
  acikSureciIlerlet();
}

function getDynamicCustomerName(){ return document.getElementById("custNameInput").value.trim()||"Musteri"; }
function getDynamicCustomerSehir(){ var el=document.getElementById("custSehirInput"); return el?el.value.trim():""; }
function getDynamicCustomerNameSehirli(){ var cn=getDynamicCustomerName(); var cs=getDynamicCustomerSehir(); return cs?(cn+" - "+cs):cn; }
function getDynamicCustomerVade(){ return document.getElementById("custVadeInput").value.trim(); }
function getDynamicCustomerFatura(){ return document.getElementById("custFaturaInput").value.trim(); }

function getModLabel(){
  if(secilenMod==="siparis") return "SİPARİŞ";
  if(secilenMod==="proforma") return "PROFORMA FATURA";
  if(secilenMod==="numune") return "NUMUNE";
  return "FİYAT TEKLİFİ";
}

function getDynamicCustomerYetkili(){
  if(seciliYetkiliKisi && seciliYetkiliKisi.isim) return seciliYetkiliKisi.isim;
  return document.getElementById("custYetkiliInput").value.trim()||"";
}
function getDynamicCustomerYetkiliIletisim(){
  if(seciliYetkiliKisi && seciliYetkiliKisi.isim){
    return [seciliYetkiliKisi.telefon, seciliYetkiliKisi.eposta].filter(Boolean).join("  ·  ");
  }
  return "";
}
function getDynamicCustomerKargo(){ return document.getElementById("custKargoInput").value.trim()||""; }
// Artık Yetkili Kişi ile aynı mantık: müşteri kartından/ön-kontrolden SEÇİLEN
// adres (seciliFaturaAdresi/seciliTeslimatAdresi) öncelikli kullanılır. Eski
// checkbox tabanlı manuel giriş (custTeslimatKullanCheckbox), müşteri kartına
// hiç bağlı olmayan serbest/geçici gönderimler için YEDEK olarak duruyor.
function getDynamicCustomerFaturaAdresi(){
  if(seciliFaturaAdresi && seciliFaturaAdresi.adres) return seciliFaturaAdresi.adres;
  var musteriKaydiF = (typeof musteriKartIdx!=="undefined" && musteriKartIdx!==null && musteriListesi[musteriKartIdx]) ? musteriListesi[musteriKartIdx] : null;
  return (musteriKaydiF && musteriKaydiF.acikAdres) || "";
}
function getDynamicCustomerTeslimatAdresi(){
  // "Dahil et" anahtarı KAPALIYSA, bir adres seçili olsa bile belgeye hiç
  // eklenmez — kullanıcı bilinçli olarak "sadece merkeze gönder" demiş demektir.
  if(typeof teslimatDahilEt!=="undefined" && !teslimatDahilEt) return "";
  if(seciliTeslimatAdresi && seciliTeslimatAdresi.adres) return seciliTeslimatAdresi.adres;
  var cb = document.getElementById("custTeslimatKullanCheckbox");
  if(!cb || !cb.checked) return "";
  var el = document.getElementById("custTeslimatAdresiInput");
  return el ? el.value.trim() : "";
}
function custTeslimatToggle(){
  var cb = document.getElementById("custTeslimatKullanCheckbox");
  var ta = document.getElementById("custTeslimatAdresiInput");
  if(!cb || !ta) return;
  ta.style.display = cb.checked ? "block" : "none";
  if(cb.checked) ta.focus();
  generateCommunicationData();
}

// --- Mesaj Şablonları (kullanıcı özelleştirebilir) -------------------------
var VARSAYILAN_MAIL_SABLON = "Bilgilerini paylaştığım Firma için {BELGE} göndermenizi rica ederim. {BELGE} bilgi formu ektedir. BİLGİNİZE.";
var VARSAYILAN_WHATSAPP_SABLON = "İstediğiniz {URUN} için ürün bilgi ve fiyatını ekte tabloda paylaştım.";

function mesajSablonlariniYukle(){
  var s = lsGet("weicon_mesaj_sablonlari", {mail:"", whatsapp:""});
  return s;
}
function mesajSablonuUygula(sablon, urunKelimesi, belgeAdi, firmaAdi){
  return sablon
    .split("{URUN}").join(urunKelimesi)
    .split("{BELGE}").join(belgeAdi)
    .split("{FIRMA}").join(firmaAdi||"");
}
function mesajSablonlariAc(){
  var s = mesajSablonlariniYukle();
  document.getElementById("sablonMailMetni").value = s.mail || "";
  document.getElementById("sablonWhatsappMetni").value = s.whatsapp || "";
  document.getElementById("mesajSablonlariModal").style.display = "flex";
}
function mesajSablonlariKaydet(){
  var s = {
    mail: document.getElementById("sablonMailMetni").value.trim(),
    whatsapp: document.getElementById("sablonWhatsappMetni").value.trim()
  };
  lsSet("weicon_mesaj_sablonlari", s);
  if(window.fbSet) window.fbSet("mesajSablonlari", s).catch(function(e){ console.error("Firebase yazma hatası:", e); });
  showToast("✓ Mesaj şablonları kaydedildi.");
  document.getElementById("mesajSablonlariModal").style.display = "none";
}
function mesajSablonlariVarsayilanaDondur(){
  document.getElementById("sablonMailMetni").value = "";
  document.getElementById("sablonWhatsappMetni").value = "";
  lsSet("weicon_mesaj_sablonlari", {mail:"", whatsapp:""});
  if(window.fbSet) window.fbSet("mesajSablonlari", {mail:"", whatsapp:""}).catch(function(e){ console.error("Firebase yazma hatası:", e); });
  showToast("↺ Varsayılan metinlere döndürüldü.");
}
if(window.fbDinle){
  window.fbDinle("mesajSablonlari", function(data){
    if(data) lsSet("weicon_mesaj_sablonlari", data);
  });
}
// -----------------------------------------------------------------------

function buildEmailBody(){
  var s = mesajSablonlariniYukle();
  var belgeAdi = getModLabel();
  var firmaAdi = (typeof getDynamicCustomerName==="function") ? getDynamicCustomerName() : "";
  if(s.mail){
    return "Merhaba,\n"+mesajSablonuUygula(s.mail, hareketListesi.length===1?"ürün":"ürünler", belgeAdi, firmaAdi)+"\n";
  }
  var body="Merhaba,\n";
  if(secilenMod==="siparis")
    body+="Bilgilerini paylaştığım Firma için SİPARİŞİN\nişleme alınmasını rica ederim.\n";
  else if(secilenMod==="proforma")
    body+="Bilgilerini paylaştığım Firma için PROFORMA FATURA göndermenizi rica ederim.\n";
  else if(secilenMod==="numune")
    body+="Bilgilerini paylaştığım Firma için NUMUNE göndermenizi rica ederim.\n";
  else
    body+="Bilgilerini paylaştığım Firma için FİYAT TEKLİFİ göndermenizi rica ederim.\n";
  body+=getModLabel()+" bilgi formu ektedir. BİLGİNİZE.\n";
  return body;
}

function buildWhatsAppBody(){
  var numuneMi = (secilenMod==="numune");
  var tekUrunMu = hareketListesi.length===1;
  var urunKelimesi = tekUrunMu ? "ürün" : "ürünler";
  var s = mesajSablonlariniYukle();
  if(s.whatsapp){
    var belgeAdi = getModLabel();
    var firmaAdi = (typeof getDynamicCustomerName==="function") ? getDynamicCustomerName() : "";
    return "Merhaba,\n"+mesajSablonuUygula(s.whatsapp, urunKelimesi, belgeAdi, firmaAdi)+"\n";
  }
  var body="Merhaba,\n";
  if(numuneMi)
    body+= tekUrunMu ? "Sizinle paylaştığım ürün ekte tabloda, NUMUNE olarak gönderilecektir.\n" : "Sizinle paylaştığım ürünler ekte tabloda, NUMUNE olarak gönderilecektir.\n";
  else
    body+= tekUrunMu ? "İstediğiniz ürün için ürün bilgi ve fiyatını ekte tabloda paylaştım.\n" : "İstediğiniz ürünler için ürün bilgi ve fiyatını ekte tabloda paylaştım.\n";
  return body;
}

function hareketBosUyariGoster(){
  if(basket.length > 0){
    showToast("⚠️ Sepetinizde "+basket.length+" ürün var ama hiçbiri HESAPLANMAMIŞ. Her ürüne dokunup HESAPLA'ya basın, ya da 'Toplu iskonto uygula' kutusuna bir oran girip Uygula'ya basarak hepsini birden hesaplayın.", 7000);
  } else {
    showToast("⚠️ Sepette hiç ürün yok. Önce Ürün Bul'dan ürün ekleyin.", 5000);
  }
}

function generateCommunicationData(){
  var ta=document.getElementById("emailTemplateTextarea");
  var onizleme=document.getElementById("mailOnizleme");
  if(hareketListesi.length===0){ return; }
  var ml=getModLabel(); var cn=getDynamicCustomerNameSehirli();
  var tamMetin="Gönderen : akaraman3406@gmail.com\nAlıcı    : ofis@weicon.com.tr\nKonu     : *** "+ml+" *** "+cn+"\n\n"+buildEmailBody();
  ta.value=tamMetin;
  // HTML önizleme - başlıkları kırmızı kalın, ürün isimlerini kalın+%30 büyük yap
  var html=tamMetin
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  for(var ci=0;ci<hareketListesi.length;ci++){
    var adi=hareketListesi[ci].name;
    var escAdi=adi.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    var regexSafe=escAdi.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    html=html.replace(new RegExp(regexSafe,"g"), '<strong style="font-size:130%;">'+escAdi+'</strong>');
  }
  onizleme.innerHTML=html;
}

var arsivKaydiIsleniyor = false;

function cihazMobilMi(){
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function sendWhatsAppMessage(){
  window.open("https://api.whatsapp.com/send?text="+encodeURIComponent(buildWhatsAppBody()),"_blank");
  showToast("WhatsApp Web açılıyor...", 2500);
}

function copyEmailText(){
  var ta=document.getElementById("emailTemplateTextarea");
  ta.select(); ta.setSelectionRange(0,99999);
  navigator.clipboard.writeText(ta.value); showToast("Kopyalandı!");
}

function mailOnizlemePopupAc(){
  if(hareketListesi.length===0){ hareketBosUyariGoster(); return; }
  generateCommunicationData();
  var kaynak=document.getElementById("mailOnizleme");
  var icerik=document.getElementById("mailOnizlemeIcerik");
  icerik.innerHTML = "<div style='text-align:center;padding:20px;color:#888;font-size:22px;'>Resim hazırlanıyor...</div>";
  document.getElementById("mailOnizlemeModal").style.display="flex";

  // Mail metnini "ÜRÜN LİSTESİ VE DETAYLARI" kısmından önce kes - o kısmın yerini PNG alacak
  var tamHtml = kaynak.innerHTML;
  var idx = tamHtml.indexOf("ÜRÜN LİSTESİ VE DETAYLARI");
  var ustMetin = tamHtml;
  if(idx > -1){
    var tagBaslangic = tamHtml.lastIndexOf("<strong", idx);
    ustMetin = tamHtml.substring(0, tagBaslangic > -1 ? tagBaslangic : idx);
  }

  var ustMetinStilli = ustMetin
    .replace(/(Gönderen)(\s*:)/, '<b style="color:#0d1b2a;font-weight:800;">$1</b>$2')
    .replace(/(Alıcı)(\s*:)/, '<b style="color:#0d1b2a;font-weight:800;">$1</b>$2')
    .replace(/(Konu)(\s*:)/, '<b style="color:#0d1b2a;font-weight:800;">$1</b>$2');

  siparisResmiCanvasOlustur(function(canvas){
    var resimHtml = "";
    if(canvas){
      resimHtml = "<img src='"+canvas.toDataURL("image/png")+"' style='width:100%;border-radius:0 0 6px 6px;display:block;'>";
    }
    icerik.innerHTML = "<div style='width:100%;padding:12px;font-size:22px;border-radius:6px 6px 0 0;background:#ffffff;font-family:\"Courier New\",monospace;color:#000000;font-weight:700;line-height:1.75;white-space:pre-wrap;box-sizing:border-box;'>"+ustMetinStilli+"</div>"
      + resimHtml;
  }, "mail");
}
function mailOnizlemeKapat(){
  document.getElementById("mailOnizlemeModal").style.display="none";
  if(onizlemeCagrildigiYer==="gonder"){
    onizlemeCagrildigiYer = null;
    document.getElementById("iletisimIslemleriModal").style.display="flex";
  }
}

function siparisResmiHtmlOlustur(musteriAdi, sehir, yetkili, vade, fatura, kargo, urunler, tarihStr, belgeTipi, yetkiliIletisim, sadeMod, kod, teslimatAdresi, netFiyatMi, faturaAdresi){
  var LACIVERT="#3569b8";
  var belgeRengi = ISLEM_TURU_RENK[secilenMod] || "#003a70";
  var esc = function(s){ return (s||"").toString().replace(/</g,"&lt;").replace(/>/g,"&gt;"); };

  // Kod üzerinden bu belgenin revize edilip edilmediğini arşivden bul
  var pngRevizeZamani = null;
  if(kod && arsivData){
    ["siparis","teklif","proforma","numune"].some(function(t){
      var liste = arsivData[t]||[];
      var bulunan = liste.find(function(k){ return k.kod===kod; });
      if(bulunan && bulunan.revizeZamani){ pngRevizeZamani = bulunan.revizeZamani; return true; }
      return false;
    });
  }

  var satirlar = "";
  var gtEuro=0;
  var tdOrtak = "border-bottom:1px solid #e2e8f0;border-right:1px solid #eef2f7;padding:11px;word-break:break-word;";
  for(var i=0;i<urunler.length;i++){
    var item = urunler[i];
    var bg = "#ffffff";
    gtEuro += item.toplamEuro||0;
    var satir = "<tr style='background:"+bg+";'>";
    if(!sadeMod){
      satir += "<td style='"+tdOrtak+"text-align:center;color:#1a1a1a;font-weight:800;'>"+(i+1)+"</td>";
    }
    var elleEtiketPng = item.elleEklendi ? "<div style='display:inline-block;background:#f2994a;color:#fff;font-size:11px;font-weight:900;padding:2px 8px;border-radius:9px;margin-bottom:3px;'>ELLE</div><br>" : "";
    var urunBilgiIcerik = item.elleEklendi
      ? elleEtiketPng+"<div style='font-weight:700;color:#222;'>"+esc(item.name)+"</div>"
      : "<div style='font-size:14px;font-weight:800;color:#444;'><b style='color:#3569b8;'>Berta:</b> "+esc(item.berta||"-")+" <b style='color:#e0524a;margin-left:4px;'>- Abas:</b> "+esc(item.abas||"-")+"</div><div style='font-weight:700;color:#222;margin-top:3px;'>"+esc(item.name)+"</div>";
    satir += "<td style='"+tdOrtak+"'>"+urunBilgiIcerik+"</td>";
    satir += "<td style='"+tdOrtak+"text-align:center;white-space:nowrap;color:#1a1a1a;font-weight:800;'>"+item.adet+"</td>";
    if(!netFiyatMi){
      satir += "<td style='"+tdOrtak+"text-align:right;white-space:nowrap;color:#1a1a1a;font-weight:800;'>"+fmt(item.listeFiyat)+" €</td>";
      satir += "<td style='"+tdOrtak+"text-align:center;color:#e0524a;font-weight:900;white-space:nowrap;'>%"+item.iskonto+"</td>";
    }
    satir += "<td style='"+tdOrtak+"text-align:right;white-space:nowrap;color:#1a1a1a;font-weight:800;'>"+fmt(item.iskBirim)+" €</td>";
    var toplamIcerikPng;
    if(item.elleEklendi && item.not){
      toplamIcerikPng = item.toplamEuro>0
        ? "<span style='font-size:12px;color:#b08040;text-decoration:line-through;'>"+fmt(item.toplamEuro)+" €</span><br><span style='color:#a85d00;font-weight:900;'>🎁 "+esc(item.not)+"</span>"
        : "<span style='color:#a85d00;font-weight:900;font-size:15px;'>🎁 "+esc(item.not)+"</span>";
    } else {
      toplamIcerikPng = fmt(item.toplamEuro)+" €";
    }
    satir += "<td style='border-bottom:1px solid #e2e8f0;padding:11px;text-align:right;font-weight:800;color:#1a1a1a;white-space:nowrap;'>"+toplamIcerikPng+"</td>";
    satir += "</tr>";
    satirlar += satir;
  }

  var yetkiliTel = "", yetkiliMail = "";
  if(yetkiliIletisim){
    yetkiliIletisim.split("  ·  ").forEach(function(p){
      if(p.indexOf("@")>-1) yetkiliMail = p; else if(p) yetkiliTel = p;
    });
  }

  // Alt çizgili (underline) etiket+değer kutusu — referans görseldeki gibi
  var alanKutusu = function(etiket, deger, wrap){
    return "<div style='min-width:0;'>"
      +"<div style='font-size:13px;font-weight:800;color:"+LACIVERT+";letter-spacing:.3px;'>"+etiket+"</div>"
      +"<div style='font-size:18px;font-weight:700;color:#222;margin-top:5px;padding-bottom:8px;border-bottom:1px solid #d5dce6;"+(wrap?"white-space:pre-wrap;word-break:break-word;":"overflow:hidden;text-overflow:ellipsis;white-space:nowrap;")+"'>"+esc(deger||"-")+"</div>"
      +"</div>";
  };

  var kosulKutusu = function(ikon, etiket, deger){
    return "<div style='display:flex;align-items:center;gap:12px;'>"
      +"<div style='flex-shrink:0;width:34px;height:34px;border-radius:4px;background:"+LACIVERT+";display:flex;align-items:center;justify-content:center;font-size:18px;'>"+ikon+"</div>"
      +"<div style='min-width:0;'>"
        +"<div style='font-size:20px;font-weight:900;color:#c0392b;letter-spacing:.3px;'>"+etiket+"</div>"
        +"<div style='font-size:24px;font-weight:800;color:#222;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>"+esc(deger||"-")+"</div>"
      +"</div>"
    +"</div>";
  };

  var logoSvg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 420 70' style='height:34px;width:auto;flex-shrink:0;'>"
    +"<g fill='"+LACIVERT+"'>"
    +"<rect x='3' y='3' width='62' height='64' rx='4' ry='4'/><rect x='73' y='3' width='62' height='64' rx='4' ry='4'/><rect x='143' y='3' width='62' height='64' rx='4' ry='4'/><rect x='213' y='3' width='62' height='64' rx='4' ry='4'/><rect x='283' y='3' width='62' height='64' rx='4' ry='4'/><rect x='353' y='3' width='62' height='64' rx='4' ry='4'/>"
    +"</g>"
    +"<g fill='#fff' font-family='Arial Black,Arial' font-weight='900' font-size='44' text-anchor='middle'>"
    +"<text x='34' y='54'>W</text><text x='104' y='54'>E</text><text x='174' y='54'>I</text><text x='244' y='54'>C</text><text x='314' y='54'>O</text><text x='384' y='54'>N</text>"
    +"</g></svg>";

  var ustBaslikBlok = sadeMod ? "" : (
    "<div style='display:flex;justify-content:space-between;align-items:center;padding:22px 24px;gap:20px;'>"
      +"<div style='display:flex;align-items:center;gap:16px;'>"
        + logoSvg
        +"<div style='font-size:26px;font-weight:900;color:"+LACIVERT+";white-space:nowrap;'>"+(belgeTipi||"SİPARİŞ")+" FORMU</div>"
      +"</div>"
      +"<table style='border-collapse:collapse;font-size:12px;flex-shrink:0;'>"
        +"<tr><td style='background:"+LACIVERT+";color:#fff;font-weight:900;padding:6px 12px;border:1px solid "+LACIVERT+";white-space:nowrap;'>TARİH</td><td style='padding:6px 14px;border:1px solid #d5dce6;font-weight:800;color:#222;white-space:nowrap;'>"+(tarihStr||"-")+"</td></tr>"
        +(pngRevizeZamani?"<tr><td style='background:#c0392b;color:#fff;font-weight:900;padding:6px 12px;border:1px solid #c0392b;white-space:nowrap;'>🔄 REVİZE</td><td style='padding:6px 14px;border:1px solid #d5dce6;font-weight:800;color:#c0392b;white-space:nowrap;font-size:12px;'>"+revizeTarihSaatFormatla(pngRevizeZamani)+"</td></tr>":"")
      +"</table>"
    +"</div>"
  );


  var musteriKaydiPng = (typeof musteriKartIdx!=="undefined" && musteriKartIdx!==null && musteriListesi[musteriKartIdx]) ? musteriListesi[musteriKartIdx] : null;
  var adresGosterilecekPng = faturaAdresi || (musteriKaydiPng && musteriKaydiPng.acikAdres) || sehir || "";
  var digerKisilerPng = (musteriKaydiPng && musteriKaydiPng.iletisimler) ? musteriKaydiPng.iletisimler : [];
  var ikinciKisiPng = null;
  for(var _pk=0;_pk<digerKisilerPng.length;_pk++){
    if(digerKisilerPng[_pk].isim && digerKisilerPng[_pk].isim!==yetkili){ ikinciKisiPng = digerKisilerPng[_pk]; break; }
  }
  var yetkiliSatiriPng = function(isim, tel, eposta){
    if(!isim && !tel && !eposta) return "";
    var parcalar = [];
    if(tel) parcalar.push("📞 "+esc(tel));
    if(eposta) parcalar.push("✉️ "+esc(eposta));
    return "<div style='font-size:21px;color:#1a2a3a;line-height:1.6;padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid #eef1f4;'>👤 <b style='font-weight:800;'>"+esc(isim||"-")+"</b>"+(parcalar.length?" — <span style='color:#556;font-size:20px;'>"+parcalar.join(" · ")+"</span>":"")+"</div>";
  };

  var musteriKarti = sadeMod ? "" : (
    "<div>"
      +"<div style='background:"+LACIVERT+";color:#fff;padding:10px 24px;font-size:26px;font-weight:900;letter-spacing:.5px;'>MÜŞTERİ BİLGİLERİ</div>"
      +"<div style='padding:16px 24px 4px;'>"
      +"<div style='font-size:30px;font-weight:900;color:#1a2a3a;margin-bottom:8px;'>"+esc(musteriAdi)+"</div>"
      +(adresGosterilecekPng ? "<div style='font-size:21px;color:#3a4a5c;font-weight:700;line-height:1.4;padding-bottom:10px;margin-bottom:12px;border-bottom:1px solid #d5dce6;'><b style='color:"+LACIVERT+";font-size:18px;display:block;margin-bottom:3px;font-weight:900;'>🧾 FATURA ADRESİ</b>"+esc(adresGosterilecekPng)+"</div>" : "")
      +(vade||fatura||kargo ? (
        "<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid #d5dce6;'>"
            + kosulKutusu("📅", "VADE", vade)
            + kosulKutusu("📄", "FATURA", fatura)
            + kosulKutusu("🚚", "KARGO", kargo)
          +"</div>"
      ) : "")
      + yetkiliSatiriPng(yetkili, yetkiliTel, yetkiliMail)
      + (ikinciKisiPng ? yetkiliSatiriPng(ikinciKisiPng.isim, ikinciKisiPng.telefon, ikinciKisiPng.eposta) : "")
      +(teslimatAdresi ? (
        "<div style='font-size:21px;color:#3a4a5c;font-weight:700;line-height:1.4;margin-top:10px;padding-top:10px;border-top:1px dashed #dde3ea;'><b style='color:#c0392b;font-size:27px;display:block;margin-bottom:3px;font-weight:900;'>🚚 TESLİMAT ADRESİ</b>"+esc(teslimatAdresi)+"</div>"
      ) : "")
      +"</div>"
    +"</div>"
  );

  var thOrtak = "border-bottom:1px solid #3569b8;border-right:1px solid #a9c4e8;color:#3569b8;padding:11px;";
  var kolonGenislikleri = [];
  var tabloBasi = "<thead><tr style='background:#cfe2f3;'>";
  if(!sadeMod){ tabloBasi += "<th style='"+thOrtak+"width:5%;'>SR</th>"; kolonGenislikleri.push(sadeMod?0:(netFiyatMi?6:5)); }
  tabloBasi += "<th style='"+thOrtak+"text-align:left;'>"+(sadeMod?"ÜRÜN İSMİ":"ÜRÜN BİLGİ")+"</th>";
  kolonGenislikleri.push(sadeMod ? (netFiyatMi?50:34) : (netFiyatMi?50:32));
  tabloBasi += "<th style='"+thOrtak+"'>ADT</th>";
  kolonGenislikleri.push(sadeMod ? (netFiyatMi?12:10) : (netFiyatMi?10:8));
  if(!netFiyatMi){
    tabloBasi += "<th style='"+thOrtak+"'>L.İSTE</th>";
    kolonGenislikleri.push(sadeMod?16:15);
    tabloBasi += "<th style='"+thOrtak+"'>İSK</th>";
    kolonGenislikleri.push(sadeMod?9:8);
  }
  tabloBasi += "<th style='"+thOrtak+"'>NET BİRİM FYT</th>";
  kolonGenislikleri.push(sadeMod ? (netFiyatMi?19:16) : (netFiyatMi?17:15));
  tabloBasi += "<th style='border-bottom:1px solid #3569b8;color:#3569b8;padding:11px;'>TOPLAM</th>";
  kolonGenislikleri.push(sadeMod ? (netFiyatMi?19:15) : (netFiyatMi?17:17));
  tabloBasi += "</tr></thead>";
  var kolonGrup = "<colgroup>"+kolonGenislikleri.map(function(g){ return "<col style='width:"+g+"%;'>"; }).join("")+"</colgroup>";

  return "<div style='width:920px;font-family:Segoe UI,Arial,sans-serif;background:#fff;border:3px solid "+LACIVERT+";border-radius:8px;box-sizing:border-box;overflow:hidden;'>"
    + ustBaslikBlok
    + musteriKarti
    +(sadeMod ? "" : "<div style='background:"+LACIVERT+";color:#fff;padding:10px 24px;font-size:17px;font-weight:900;letter-spacing:.5px;'>"+(belgeTipi||"SİPARİŞ")+" DETAYLARI</div>")
    +"<table style='width:100%;table-layout:fixed;border-collapse:collapse;font-size:20px;'>"
    +kolonGrup
    +tabloBasi
    +"<tbody>"+satirlar+"</tbody>"
    +"</table>"
    +"<div style='background:"+LACIVERT+";color:#fff;display:flex;justify-content:space-between;align-items:center;padding:18px 24px;gap:24px;'>"
      +"<span style='font-size:19px;font-weight:900;letter-spacing:.5px;'>SİPARİŞ TOPLAM</span><span style='font-size:30px;font-weight:900;'>"+fmt(gtEuro)+" €</span>"
    +"</div>"
    +"</div>";
}

function siparisResmiCanvasOlustur(callback, kanal, kod){
  if(hareketListesi.length===0 || typeof html2canvas==="undefined"){ callback(null); return; }
  var hedefKanal = kanal || sonSecilenKanal;
  var sadeMod = (hedefKanal==="whatsapp");
  var musteriAdi = getDynamicCustomerName();
  var sehir = getDynamicCustomerSehir();
  var yetkili = getDynamicCustomerYetkili();
  var yetkiliIletisim = getDynamicCustomerYetkiliIletisim();
  var vade = getDynamicCustomerVade();
  var fatura = getDynamicCustomerFatura();
  var kargo = getDynamicCustomerKargo();
  var teslimatAdresi = getDynamicCustomerTeslimatAdresi();
  var faturaAdresi = getDynamicCustomerFaturaAdresi();
  var bugun = new Date();
  var tarihStr = ("0"+bugun.getDate()).slice(-2)+"."+("0"+(bugun.getMonth()+1)).slice(-2)+"."+bugun.getFullYear();
  var gecici=document.createElement("div");
  gecici.style.position="fixed";
  gecici.style.left="-9999px";
  gecici.style.top="0";
  gecici.style.width="940px";
  gecici.style.background="#fff";
  gecici.style.padding="10px";
  var belgeTipi = (typeof ISLEM_TURU_ADI!=="undefined" && ISLEM_TURU_ADI[secilenMod]) || "SİPARİŞ";
  gecici.innerHTML = siparisResmiHtmlOlustur(musteriAdi, sehir, yetkili, vade, fatura, kargo, hareketListesi, tarihStr, belgeTipi, yetkiliIletisim, sadeMod, kod, teslimatAdresi, gonderimFiyatGorunumu==="net", faturaAdresi);
  document.body.appendChild(gecici);
  html2canvas(gecici, {backgroundColor:"#ffffff", scale:3}).then(function(canvas){
    document.body.removeChild(gecici);
    callback(canvas);
  }).catch(function(){
    document.body.removeChild(gecici);
    callback(null);
  });
}

function resimVeEpostaGonder(){ _resimGonderOrtak("mail"); }
function resimVeWhatsappGonder(){ _resimGonderOrtak("whatsapp"); }

// TABLOYU KOPYALA / İNDİR — müşteriden gelen bir maile aynı zincir üzerinden
// yanıt vermek için, hareket tablosunu resim olarak panoya kopyalama veya
// PNG olarak indirme imkânı sağlar (yeni mail göndermeden, mevcut yanıt
// penceresine yapıştırılabilir/eklenebilir).
var _tabloOnizlemeCanvas = null;

function tabloKopyalaIndirBaslat(){
  if(hareketListesi.length===0){ hareketBosUyariGoster(); return; }
  if(!secilenMod){
    showToast("⚠️ İşlem türü seçilmedi. Önce Numune / Fiyat Teklifi / Proforma / Sipariş seçin.", 4000);
    islemTuruSeciminSonrasiAksiyon = 'iletisim';
    if(typeof islemTuruModalAc==="function") islemTuruModalAc();
    return;
  }
  if(typeof html2canvas==="undefined"){ showToast("Resim modülü yüklenemedi. İnternet bağlantınızı kontrol edin."); return; }

  document.getElementById("iletisimIslemleriModal").style.display="none";
  _tabloOnizlemeCanvas = null;
  document.getElementById("tabloOnizlemeYukleniyor").style.display="block";
  document.getElementById("tabloOnizlemeImg").style.display="none";
  document.getElementById("tabloOnizlemeModal").style.display="flex";

  siparisResmiCanvasOlustur(function(canvas){
    if(!canvas){
      showToast("Tablo oluşturulamadı.");
      document.getElementById("tabloOnizlemeModal").style.display="none";
      return;
    }
    _tabloOnizlemeCanvas = canvas;
    document.getElementById("tabloOnizlemeYukleniyor").style.display="none";
    var img = document.getElementById("tabloOnizlemeImg");
    img.src = canvas.toDataURL("image/png");
    img.style.display="block";
  }, "mail");
}

function tabloOnizlemeKapat(){
  document.getElementById("tabloOnizlemeModal").style.display="none";
  _tabloOnizlemeCanvas = null;
}

function tabloResmiKopyala(){
  if(!_tabloOnizlemeCanvas){ showToast("Tablo henüz hazır değil, lütfen bekleyin."); return; }
  if(!navigator.clipboard || typeof ClipboardItem==="undefined"){
    showToast("Bu tarayıcı panoya resim kopyalamayı desteklemiyor. Lütfen İndir'i kullanın.", 4000);
    return;
  }
  _tabloOnizlemeCanvas.toBlob(function(blob){
    if(!blob){ showToast("Resim oluşturulamadı."); return; }
    navigator.clipboard.write([new ClipboardItem({"image/png": blob})]).then(function(){
      showToast("✅ Tablo panoya kopyalandı! Mail yanıtına yapıştırabilirsiniz.", 3500);
    }).catch(function(){
      showToast("Kopyalama başarısız oldu. Lütfen İndir'i deneyin.", 4000);
    });
  }, "image/png");
}

function tabloResmiIndir(){
  if(!_tabloOnizlemeCanvas){ showToast("Tablo henüz hazır değil, lütfen bekleyin."); return; }
  var musteriAdi = (typeof getDynamicCustomerNameSehirli==="function") ? getDynamicCustomerNameSehirli() : "musteri";
  _tabloOnizlemeCanvas.toBlob(function(blob){
    if(!blob){ showToast("Resim oluşturulamadı."); return; }
    var dosyaAdi = "Hareket_Tablosu_"+String(musteriAdi).replace(/[^a-zA-Z0-9]+/g,"_")+".png";
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url; a.download=dosyaAdi;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("✅ Tablo indirildi. Mail yanıtına dosya olarak ekleyebilirsiniz.", 3500);
  }, "image/png");
}

var sonSecilenKanal = null;
var gonderimFiyatGorunumu = "iskontolu"; // "iskontolu" | "net" — Gönder öncesi sorulan fiyat görünürlüğü tercihi

function _resimGonderOrtak(kanal){
  sonSecilenKanal = kanal;
  if(hareketListesi.length===0){ hareketBosUyariGoster(); return; }
  if(arsivKaydiIsleniyor) return;
  if(typeof html2canvas==="undefined"){ showToast("Resim modülü yüklenemedi. İnternet bağlantınızı kontrol edin."); return; }

  var musteriAdi = getDynamicCustomerNameSehirli();
  var belgeTipi = ISLEM_TURU_ADI[secilenMod] || "SİPARİŞ";
  var belgeRengi = ISLEM_TURU_RENK[secilenMod] || "#003a70";
  var toplamEuro = 0;
  for(var i=0;i<hareketListesi.length;i++) toplamEuro += hareketListesi[i].toplamEuro||0;

  var toplamAdet = 0;
  for(var ai=0;ai<hareketListesi.length;ai++) toplamAdet += hareketListesi[ai].adet||0;

  document.getElementById("gonderimOnayMusteri").textContent = musteriAdi;
  document.getElementById("gonderimOnayIslemTuru").textContent = belgeTipi;
  document.getElementById("gonderimOnayIslemTuru").style.background = belgeRengi;
  document.getElementById("gonderimOnayUrunSayisi").textContent = hareketListesi.length+" kalem";
  document.getElementById("gonderimOnayToplamAdet").textContent = toplamAdet+" adet";
  document.getElementById("gonderimOnayToplam").textContent = fmt(toplamEuro)+" €";
  document.getElementById("gonderimOnayKanal").textContent = kanal==="whatsapp" ? "💬 WhatsApp" : "📧 Mail";

  var btn = document.getElementById("gonderimOnayBtn");
  btn.textContent = "✅ GÖNDER - "+belgeTipi;
  btn.style.background = "linear-gradient(135deg,"+belgeRengi+","+belgeRengi+")";
  btn.onclick = function(){
    document.getElementById("gonderimOnayModal").style.display="none";
    _resimGonderDevamEt(kanal);
  };
  document.getElementById("gonderimOnayModal").style.display="flex";
}

function _resimGonderDevamEt(kanal){
  var musteriAdi = getDynamicCustomerNameSehirli();
  var ml=getModLabel();
  var belgeTipi = ISLEM_TURU_ADI[secilenMod] || "SİPARİŞ";
  var konuMetni = "*** "+ml+" *** "+musteriAdi;
  var govdeMetni = kanal==="whatsapp" ? buildWhatsAppBody() : buildEmailBody();
  var islemKodu = benzersizKodUret(secilenMod);
  showToast("Resim hazırlanıyor...");

  siparisResmiCanvasOlustur(function(canvas){
    if(!canvas){ showToast("Resim oluşturulamadı."); return; }

    canvas.toBlob(function(blob){
      if(!blob){ showToast("Resim oluşturulamadı."); return; }
      var dosyaAdi = belgeTipi.replace(/\s+/g,"_")+"_"+musteriAdi.replace(/[^a-zA-Z0-9]+/g,"_")+".png";
      var dosya = new File([blob], dosyaAdi, {type:"image/png"});
      var paylasimMetni = kanal==="whatsapp" ? govdeMetni : (konuMetni+"\n\n"+govdeMetni);

      // MAIL ve WHATSAPP: telefonun paylaşım penceresi kullanılıyor — PNG resim
      // otomatik ekleniyor, "title" olarak Konu da gönderiliyor (Gmail çoğunlukla
      // bunu Konu alanına yazar). Web paylaşım penceresinde "Kime" diye bir alan
      // olmadığı için o kısım (ofis@weicon.com.tr) mail uygulamasında elle girilmeli.
      if(navigator.canShare && navigator.canShare({files:[dosya]})){
        // Paylaşım penceresi HEMEN tetiklenmeli (kullanıcı dokunuşu izni süresi kısa).
        // Arşivleme, paylaşımın sonucunu beklemeden hemen arkasından (ufak bir gecikmeyle) çalışır;
        // böylece ne paylaşım penceresi engellenir ne de arşivleme arka plana atılınca kaybolur.
        navigator.share({
          files:[dosya],
          title: konuMetni,
          text: paylasimMetni
        }).then(function(){
          showToast("✅ Mesaj gönderildi!", 3000);
        }).catch(function(err){
          if(err && err.name!=="AbortError") showToast("Paylaşım penceresi kapatıldı (kayıt zaten arşivlendi).");
        });
        setTimeout(function(){ _arsiveKaydetIslem(secilenMod, islemKodu, kanal); }, 60);
      } else {
        // Paylaşım desteklenmiyorsa, en son çare olarak indir + wa.me/mailto ile aç
        var url=URL.createObjectURL(blob);
        var a=document.createElement("a");
        a.href=url; a.download=dosyaAdi;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Bu tarayıcıda direkt paylaşım desteklenmiyor, resim indirildi.");
        _arsiveKaydetIslem(secilenMod, islemKodu, kanal);
        if(kanal==="whatsapp"){
          window.open("https://api.whatsapp.com/send?text="+encodeURIComponent(govdeMetni),"_blank");
        } else {
          window.location.href="mailto:ofis@weicon.com.tr?subject="+encodeURIComponent(konuMetni)+"&body="+encodeURIComponent(govdeMetni);
        }
      }
    }, "image/png");
  }, kanal, islemKodu);
}

/* ============================================================
   SAYFA 6: ARŞİV
============================================================ */
// ŞEHİR FORMATLAMA — nasıl girilmiş olursa olsun İl her zaman büyük harf ve başta gösterilir
var TUM_ILLER = ["ADANA","ADIYAMAN","AFYONKARAHİSAR","AĞRI","AKSARAY","AMASYA","ANKARA","ANTALYA","ARDAHAN","ARTVİN","AYDIN","BALIKESİR","BARTIN","BATMAN","BAYBURT","BİLECİK","BİNGÖL","BİTLİS","BOLU","BURDUR","BURSA","ÇANAKKALE","ÇANKIRI","ÇORUM","DENİZLİ","DİYARBAKIR","DÜZCE","EDİRNE","ELAZIĞ","ERZİNCAN","ERZURUM","ESKİŞEHİR","GAZİANTEP","GİRESUN","GÜMÜŞHANE","HAKKARİ","HATAY","IĞDIR","ISPARTA","İSTANBUL","İZMİR","KAHRAMANMARAŞ","KARABÜK","KARAMAN","KARS","KASTAMONU","KAYSERİ","KİLİS","KIRIKKALE","KIRKLARELİ","KIRŞEHİR","KOCAELİ","KONYA","KÜTAHYA","MALATYA","MANİSA","MARDİN","MERSİN","MUĞLA","MUŞ","NEVŞEHİR","NİĞDE","ORDU","OSMANİYE","RİZE","SAKARYA","SAMSUN","SİİRT","SİNOP","SİVAS","ŞANLIURFA","ŞIRNAK","TEKİRDAĞ","TOKAT","TRABZON","TUNCELİ","UŞAK","VAN","YALOVA","YOZGAT","ZONGULDAK"];

function sehirFormatla(sehirStr){
  if(!sehirStr) return "";
  var parcalar = String(sehirStr).split("-").map(function(p){ return p.trim(); }).filter(function(p){ return p.length>0; });
  if(parcalar.length===0) return "";
  if(parcalar.length===1) return parcalar[0].toLocaleUpperCase("tr-TR");
  var ilIdx = -1;
  for(var i=0;i<parcalar.length;i++){
    if(TUM_ILLER.indexOf(parcalar[i].toLocaleUpperCase("tr-TR"))>=0){ ilIdx = i; break; }
  }
  if(ilIdx===-1) ilIdx = parcalar.length-1; // il tespit edilemedi, son parçayı il varsay
  var il = parcalar[ilIdx].toLocaleUpperCase("tr-TR");
  var digerleri = parcalar.filter(function(p,idx){ return idx!==ilIdx; });
  return digerleri.length===0 ? il : (il+" - "+digerleri.join(" - "));
}

var arsivData = {};
if(!arsivData.siparis) arsivData.siparis=[];
if(!arsivData.proforma) arsivData.proforma=[];
if(!arsivData.teklif) arsivData.teklif=[];
if(!arsivData.numune) arsivData.numune=[];
var aktifArsivTab = "siparis";

// İki cihaz aynı anda FARKLI arşiv kayıtlarını değiştirirse/silerse/eklerse
// birbirinin işlemini kaybetmesin diye: Firebase'e yazmadan hemen önce
// sunucudaki EN GÜNCEL arşivi çekip, sadece BU işlemin değişikliklerini
// (bir veya daha fazla tip içinde eklenen/güncellenen/silinen kayıtlar) o
// güncel arşivin içine "kod" (veya kod yoksa "ts") ile eşleştirerek
// uygulayıp öyle yazıyoruz. Eskiden bu cihazdaki (bayat olabilecek) local
// arsivData komple üzerine yazılıyordu ve diğer cihazın az önce farklı bir
// tipe/kayda yaptığı değişiklik sessizce kaybolabiliyordu.
// degisiklikler: {tip, kayit} | {tip, silinecekKod} | {tip, silinecekTs} | dizi
function arsivGuvenliKaydet(degisiklikler){
  if(!window.fbSet) return Promise.reject(new Error("firebase yok"));
  if(!Array.isArray(degisiklikler)) degisiklikler = [degisiklikler];
  if(!window.fbGet || (typeof navigator!=="undefined" && navigator.onLine===false)){
    if(typeof bekleyenIslemKaydet==="function"){
      bekleyenIslemKaydet({tur:"arsiv", degisiklikler:degisiklikler});
      return Promise.resolve();
    }
    return window.fbSet("arsiv", arsivData);
  }
  return window.fbGet("arsiv").then(function(sunucuVerisi){
    var sunucuArsiv = sunucuVerisi ? JSON.parse(JSON.stringify(sunucuVerisi)) : {};
    ["siparis","teklif","proforma","numune"].forEach(function(t){
      if(!sunucuArsiv[t]) sunucuArsiv[t] = [];
    });
    degisiklikler.forEach(function(d){
      if(!d || !d.tip) return;
      var liste = sunucuArsiv[d.tip] || (sunucuArsiv[d.tip]=[]);
      if(d.silinecekKod){
        sunucuArsiv[d.tip] = liste.filter(function(k){ return !(k && k.kod && k.kod===d.silinecekKod); });
      } else if(d.silinecekTs){
        sunucuArsiv[d.tip] = liste.filter(function(k){ return !(k && k.ts===d.silinecekTs); });
      } else if(d.kayit){
        var kod = d.kayit.kod;
        var bulunduMu = false;
        if(kod){
          for(var i=0;i<liste.length;i++){
            if(liste[i] && liste[i].kod===kod){ liste[i] = d.kayit; bulunduMu = true; break; }
          }
        }
        if(!bulunduMu) liste.unshift(d.kayit);
      }
    });
    return window.fbSet("arsiv", sunucuArsiv);
  }).catch(function(){
    // Sunucudan taze veri çekilemezse (yetki/ağ hatası vb.), işlemi tamamen
    // kaybetmemek için kuyruğa alıyoruz — bir sonraki senkronda güvenli
    // birleştirme ile tekrar denenecek (komple arşiv ile üzerine yazmıyoruz).
    if(typeof bekleyenIslemKaydet==="function"){
      bekleyenIslemKaydet({tur:"arsiv", degisiklikler:degisiklikler});
      return Promise.resolve();
    }
    return window.fbSet("arsiv", arsivData);
  });
}

function arsivAra(){
  var q = document.getElementById("arsivAramaInput").value.trim().toLocaleLowerCase("tr-TR");
  var sonucPanel = document.getElementById("arsivAramaSonucPanel");
  var btnPanel   = document.getElementById("arsivBtnPanel");
  var detayPanel = document.getElementById("arsivDetayPanel");
  var sonucListesi = document.getElementById("arsivAramaSonucListesi");
  var sonucBaslik  = document.getElementById("arsivAramaSonucBaslik");

  if(q.length < 1){
    sonucPanel.style.display = "none";
    btnPanel.style.display   = "block";
    detayPanel.style.display = "none";
    return;
  }

  // Tüm kategorilerde ara
  arsivData = lsGet("weicon_arsiv",{});
  if(!arsivData.siparis)  arsivData.siparis=[];
  if(!arsivData.proforma) arsivData.proforma=[];
  if(!arsivData.teklif)   arsivData.teklif=[];
  if(!arsivData.numune)   arsivData.numune=[];

  var kategoriler = [
    {tip:"siparis",  renk:"#003a70", ad:"SİPARİŞ"},
    {tip:"teklif",   renk:"#28a745", ad:"FİYAT TEKLİFİ"},
    {tip:"proforma", renk:"#8e44ad", ad:"PROFORMA"},
    {tip:"numune",   renk:"#e08900", ad:"NUMUNE"}
  ];

  var toplamSonuc = 0;
  sonucListesi.innerHTML = "";

  for(var k=0; k<kategoriler.length; k++){
    var kat = kategoriler[k];
    var liste = arsivData[kat.tip]||[];
    for(var i=0; i<liste.length; i++){
      var kayit = liste[i];
      if(kayit.musteri.toLocaleLowerCase("tr-TR").indexOf(q) >= 0){
        toplamSonuc++;
        var div = document.createElement("div");
        div.className = "arsiv-kayit";
        div.style.borderLeftColor = kat.renk;
        var urunMetin = "";
        for(var j=0; j<kayit.urunler.length; j++){
          var u = kayit.urunler[j];
          urunMetin += "• "+u.adet+"x "+u.name+"\n";
        }
        div.innerHTML =
          "<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;'>"
          +"<span style='font-size:30px;font-weight:bold;color:"+kat.renk+";background:#f0f0f0;padding:8px 16px;border-radius:10px;'>"+kat.ad+"</span>"
          +"<span class='arsiv-kayit-tarih'>"+kayit.tarih+"</span>"
          +"</div>"
          +"<div class='arsiv-kayit-musteri'>"+kayit.musteri+"</div>"
          +"<div class='arsiv-kayit-detay' style='white-space:pre-line;margin-top:4px;'>"+urunMetin+"</div>";
        sonucListesi.appendChild(div);
      }
    }
  }

  btnPanel.style.display   = "none";
  detayPanel.style.display = "none";
  sonucPanel.style.display = "block";
  sonucBaslik.textContent  = "\""+q+"\" için "+toplamSonuc+" kayıt bulundu:";
  if(toplamSonuc === 0){
    sonucListesi.innerHTML = "<div class='placeholder-page'>Kayıt bulunamadı.</div>";
  }
}

function arsivAramaSifirla(){
  document.getElementById("arsivAramaInput").value = "";
  document.getElementById("arsivAramaSonucPanel").style.display = "none";
  document.getElementById("arsivBtnPanel").style.display = "block";
  document.getElementById("arsivDetayPanel").style.display = "none";
}

function arsivSekmeAc(sekme){
  var arsivPanel = document.getElementById("arsivAnaPanel");
  var istatistikPanel = document.getElementById("istatistikPanel");
  var s1 = document.getElementById("arsivSekme1");
  var s2 = document.getElementById("arsivSekme2");
  if(sekme==="arsiv"){
    arsivPanel.style.display="block";
    istatistikPanel.style.display="none";
    s1.style.background="#003a70"; s2.style.background="#6c757d";
  } else {
    arsivPanel.style.display="none";
    istatistikPanel.style.display="block";
    s1.style.background="#6c757d"; s2.style.background="#e67e22";
    istatistikHesapla();
  }
}

var aktifIstatistikFiltre = "siparis";
var istatistikOzelGorunumAktif = false;

var ISTAT_FILTRE_RENK = ISLEM_TURU_RENK;

function istatistikFiltreButonGuncelle(){
  var tipler = ["numune","teklif","proforma","siparis"];
  for(var i=0;i<tipler.length;i++){
    var t = tipler[i];
    var btn = document.getElementById("istatBtn"+t.charAt(0).toUpperCase()+t.slice(1));
    if(!btn) continue;
    if(t===aktifIstatistikFiltre){
      btn.style.background = ISTAT_FILTRE_RENK[t];
      btn.style.opacity = "1";
    } else {
      btn.style.background = "#6c757d";
      btn.style.opacity = "0.6";
    }
  }
}

function istatistikFiltreSec(filtre){
  istatistikOzelGorunumAktif = false;
  aktifIstatistikFiltre = filtre;
  istatistikFiltreButonGuncelle();
  istatistikHesapla();
}

function buAyinSiparisVerisi(){
  var arsiv = lsGet("weicon_arsiv",{});
  var aylar = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  var now = new Date();
  var buAyAd = aylar[now.getMonth()];
  var buYil = now.getFullYear().toString();
  var siparisler = (arsiv&&arsiv.siparis) || [];
  var liste = [];
  var toplamEuro = 0, toplamPrim = 0;
  for(var i=0;i<siparisler.length;i++){
    var k = siparisler[i];
    if(!k.tarih) continue;
    var parca = k.tarih.split(" ");
    var ayAd = parca[1]||""; var yil = parca[2]||"";
    if(ayAd!==buAyAd || yil!==buYil) continue;
    var kEuro = 0, kPrim = 0;
    if(k.urunler) for(var j=0;j<k.urunler.length;j++){
      var u = k.urunler[j];
      kEuro += u.toplamEuro||0;
      var mk = (u.iskBirim||0)-(u.dipFiyat||0);
      var satirPrimi = mk*(u.adet||1)*0.22;
      if(satirPrimi>0) kPrim += satirPrimi; // eksi/negatif primli satırlar toplama hiç katılmaz
    }
    toplamEuro += kEuro;
    toplamPrim += kPrim;
    liste.push({kayit:k, idx:i, toplamEuro:kEuro, toplamPrim:kPrim});
  }
  liste.sort(function(a,b){ return (b.kayit.ts||0)-(a.kayit.ts||0); });
  return {ayAd:buAyAd, yil:buYil, liste:liste, toplamEuro:toplamEuro, toplamPrim:toplamPrim};
}

// "İş günü" penceresi: her gün sabah 09:00'da sıfırlanır, ertesi gün sabah 06:00'a
// kadar o günün verilerini göstermeye devam eder. 06:00-09:00 arası (yeni gün henüz
// başlamadan önceki geçiş aralığı) hiçbir iş günü aktif değildir, gösterge boş kalır.
function buGununIsGunuTarihi(){
  var simdi = new Date();
  var saat = simdi.getHours();
  if(saat >= 6 && saat < 9) return null; // geçiş aralığı — aktif iş günü yok
  var gun = new Date(simdi);
  if(saat < 6) gun.setDate(gun.getDate()-1); // gece yarısı-06:00: hâlâ bir önceki iş günü
  gun.setHours(0,0,0,0);
  return gun;
}

function buGuneAitSiparisVerisi(){
  var isGunu = buGununIsGunuTarihi();
  if(!isGunu) return {toplamEuro:0, toplamPrim:0, aktifMi:false};
  var arsiv = lsGet("weicon_arsiv",{});
  var aylar = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  var gunNo = isGunu.getDate().toString();
  var ayAd = aylar[isGunu.getMonth()];
  var yil = isGunu.getFullYear().toString();
  var siparisler = (arsiv&&arsiv.siparis) || [];
  var toplamEuro = 0, toplamPrim = 0;
  for(var i=0;i<siparisler.length;i++){
    var k = siparisler[i];
    if(!k.tarih) continue;
    var parca = k.tarih.split(" ");
    if((parca[0]||"")!==gunNo || (parca[1]||"")!==ayAd || (parca[2]||"")!==yil) continue;
    if(k.urunler) for(var j=0;j<k.urunler.length;j++){
      var u = k.urunler[j];
      toplamEuro += u.toplamEuro||0;
      var mk = (u.iskBirim||0)-(u.dipFiyat||0);
      var satirPrimi = mk*(u.adet||1)*0.22;
      if(satirPrimi>0) toplamPrim += satirPrimi; // eksi/negatif primli satırlar toplama hiç katılmaz
    }
  }
  return {toplamEuro:toplamEuro, toplamPrim:toplamPrim, aktifMi:true};
}

function anaSayfaRenderEt(){
  var veri = buAyinSiparisVerisi();
  var elSatis = document.getElementById("anaSayfaSatisToplam");
  var elPrim = document.getElementById("anaSayfaPrimToplam");
  var elEtiket = document.getElementById("anaSayfaAyEtiketi1");
  if(elSatis) elSatis.textContent = fmt(veri.toplamEuro);
  if(elPrim) elPrim.textContent = fmt(veri.toplamPrim);
  if(elEtiket) elEtiket.textContent = "EUR · "+veri.ayAd+" "+veri.yil;

  var gunVeri = buGuneAitSiparisVerisi();
  var elBugunSatis = document.getElementById("anaSayfaBugunSatisToplam");
  var elBugunPrim = document.getElementById("anaSayfaBugunPrimToplam");
  var elBugunEtiket = document.getElementById("anaSayfaBugunEtiketi");
  if(elBugunSatis) elBugunSatis.textContent = fmt(gunVeri.toplamEuro);
  if(elBugunPrim) elBugunPrim.textContent = fmt(gunVeri.toplamPrim);
  if(elBugunEtiket) elBugunEtiket.textContent = gunVeri.aktifMi ? "EUR · bugün" : "EUR · 09:00'da başlar";

  var kayitliKur = localStorage.getItem("weicon_kur");
  if(kayitliKur) anaKurDegerGuncelle(kayitliKur);

  anaSayfaKarsilamaGuncelle(gunVeri);
}

// Saat dilimine ve bugünkü performansa göre değişen, sakin bir karşılama
// cümlesi üretir — "biri seni görüyor" hissi vermek için, ama asla suçlayıcı/
// baskı yapan bir tonda değil (akşam satış olmasa bile nazik kalır).
function anaSayfaKarsilamaGuncelle(gunVeri){
  var el = document.getElementById("anaSayfaKarsilama");
  if(!el) return;
  var saat = new Date().getHours();
  var bugunVarMi = gunVeri && gunVeri.toplamEuro > 0;
  var mesaj = "";
  if(saat < 10){
    mesaj = bugunVarMi ? "👋 Günaydın! Erken bir başlangıç yapmışsın bile." : "👋 Günaydın! Güzel bir gün seni bekliyor.";
  } else if(saat < 13){
    mesaj = bugunVarMi ? "☀️ Öğlene doğru güzel gidiyor, devam." : "☀️ Öğleye kadar bir fırsat daha var.";
  } else if(saat < 18){
    mesaj = bugunVarMi ? "💪 Bugün iyi iş çıkarıyorsun." : "💪 Öğleden sonra hâlâ zaman var, bir görüşme fark yaratabilir.";
  } else if(saat < 21){
    mesaj = bugunVarMi ? "🌆 Günü güzel kapatıyorsun." : "🌆 Gün yavaş yavaş kapanıyor — yarın yeni bir fırsat.";
  } else {
    mesaj = "🌙 Günün sonu — dinlenmeyi hak ettin.";
  }
  el.textContent = mesaj;
}
setInterval(anaSayfaRenderEt, 60000); // 09:00/06:00 geçişlerinde gösterge otomatik güncellensin

function anaSayfaSatisDetay(){
  switchTab(6);
}

function anaSayfaPrimDetay(){
  switchTab(6);
}

var AYLAR_KISA = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

function aylikOzetiAcKapa(){
  var wrap = document.getElementById("aylikOzetWrap");
  var btn = document.getElementById("aylikOzetToggleBtn");
  var sonIslemlerWrap = document.getElementById("sonIslemlerWrap");
  if(!wrap || !btn) return;
  var acik = wrap.style.display !== "none";
  if(acik){
    wrap.style.display = "none";
    btn.innerHTML = "📅 Aylık Sipariş &amp; Prim Özetini Göster ▾";
    if(sonIslemlerWrap) sonIslemlerWrap.style.display = "block";
  } else {
    // Diğer panelleri (Ziyaret Takvimi, Ajanda) kapat
    var digerWrap = document.getElementById("ziyaretTakvimWrap");
    var digerBtn = document.getElementById("ziyaretTakvimToggleBtn");
    if(digerWrap) digerWrap.style.display = "none";
    if(digerBtn) digerBtn.innerHTML = "📆 Ziyaret Takvimini Göster ▾";
    var ajWrap = document.getElementById("ajandaWrap");
    var ajBtn = document.getElementById("ajandaToggleBtn");
    if(ajWrap) ajWrap.style.display = "none";
    if(ajBtn) ajBtn.innerHTML = "📓 Günlük Ajanda Göster ▾";

    wrap.style.display = "block";
    btn.innerHTML = "📅 Aylık Sipariş &amp; Prim Özetini Gizle ▴";
    if(sonIslemlerWrap) sonIslemlerWrap.style.display = "none";
  }
}

// ============ ARAÇ KM TAKİBİ ============
var kmTakipAyarlariObj = {adSoyad:"", plaka:""};
var kmTakipKayitlariObj = {}; // {"2026-07-31": {...}}

// Değişen günleri biriktirir — debounce'lu kmAylikTabloKaydet çağrılmadan hemen
// önce hangi TEK günün/günlerin değiştiğini işaretlemek için kullanılır, böylece
// güvenli-birleştirme fonksiyonu tüm ayı değil sadece bu günleri uygular.
var kmBekleyenDegisiklikler = [];
function kmDegisiklikKaydet(anahtar){
  var varMi = !!kmTakipKayitlariObj[anahtar];
  kmBekleyenDegisiklikler.push({anahtar:anahtar, kayit:varMi?kmTakipKayitlariObj[anahtar]:null, silinsinMi:!varMi});
}

// KM Takip — güvenli birleştirme (müşteri/arşiv'de kullandığımız aynı desen):
// yazmadan önce sunucudaki EN GÜNCEL tüm ay verisini çekip, sadece BU an
// değişen günü/günleri onun içine uygulayıp öyle yazıyoruz. ESKİDEN cihazın
// belleğindeki (kmTakipKayitlariObj) TÜM ay ham olarak üzerine yazılıyordu —
// bellek eksik/bayat olduğunda (örn. sayfa yeni açılmışken Firebase henüz tam
// senkron olmadan bir alana dokunulursa) diğer günlerin verisi sessizce
// TAMAMEN kaybolabiliyordu. Bu fonksiyon tek bir günü bile asla toptan silmez.
function kmGuvenliKaydet(degisiklikler){
  if(!Array.isArray(degisiklikler)) degisiklikler = [degisiklikler];
  degisiklikler = degisiklikler.filter(function(d){ return d && d.anahtar; });
  if(degisiklikler.length===0) return Promise.resolve({onaylandi:true, kuyruklandi:false});

  if(!window.fbSet){
    if(typeof bekleyenIslemKaydet==="function") bekleyenIslemKaydet({tur:"km", degisiklikler:degisiklikler});
    return Promise.resolve({onaylandi:false, kuyruklandi:true});
  }
  if(!window.fbGet || (typeof navigator!=="undefined" && navigator.onLine===false)){
    if(typeof bekleyenIslemKaydet==="function"){
      bekleyenIslemKaydet({tur:"km", degisiklikler:degisiklikler});
      return Promise.resolve({onaylandi:false, kuyruklandi:true});
    }
    return window.fbSet("kmTakip", kmTakipKayitlariObj).then(function(){
      return {onaylandi:true, kuyruklandi:false};
    }).catch(function(){
      return {onaylandi:false, kuyruklandi:false};
    });
  }
  return window.fbGet("kmTakip").then(function(sunucuVerisi){
    var sunucuKm = sunucuVerisi ? JSON.parse(JSON.stringify(sunucuVerisi)) : {};
    degisiklikler.forEach(function(d){
      if(d.silinsinMi) delete sunucuKm[d.anahtar];
      else if(d.kayit) sunucuKm[d.anahtar] = d.kayit;
    });
    // window.fbSet burada gerçek Firebase yazma isteğini gönderir ve SADECE
    // sunucudan onay (ack) geldiğinde resolve olur — bu yüzden onaylandi:true
    // dönmesi, verinin fiilen Firebase'e ulaştığının kanıtıdır, bir tahmin değildir.
    return window.fbSet("kmTakip", sunucuKm).then(function(){
      return {onaylandi:true, kuyruklandi:false};
    });
  }).catch(function(){
    // Sunucudan taze veri çekilemezse (yetki/ağ hatası vb.), işlemi tamamen
    // kaybetmemek için kuyruğa alıyoruz — bir sonraki senkronda güvenli
    // birleştirme ile tekrar denenecek (komple ay ile üzerine yazmıyoruz).
    if(typeof bekleyenIslemKaydet==="function"){
      bekleyenIslemKaydet({tur:"km", degisiklikler:degisiklikler});
      return {onaylandi:false, kuyruklandi:true};
    }
    return window.fbSet("kmTakip", kmTakipKayitlariObj).then(function(){
      return {onaylandi:true, kuyruklandi:false};
    }).catch(function(){
      return {onaylandi:false, kuyruklandi:false};
    });
  });
}
var kmAktifTarih = new Date();
var kmAktifAy = new Date().getMonth();
var kmAktifYil = new Date().getFullYear();
var kmTakipYuklendi = false;

function kmFmt(n){ n = Math.round(n||0); return n.toLocaleString("tr-TR"); }
function kmTarihAnahtari(d){
  return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);
}
var KM_GUN_ADLARI = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
var KM_AY_ADLARI = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

// Bugünün araç KM kaydı girilip "Günü Kaydet" ile onaylanmış mı? Girilmediyse
// uygulamanın geri kalanı kilitlenir — kullanıcı önce KM fotoğrafını çekip
// kaydetmeden başka hiçbir işlev kullanamaz.
function kmBugunKayitliMi(){
  var anahtar = kmTarihAnahtari(new Date());
  var kayit = kmTakipKayitlariObj[anahtar];
  return !!(kayit && kayit.km!==undefined && kayit.km!==null && kayit.km!=="");
}

// "1 Saat Ertele" — araç şu an yanında değilse kilidi geçici olarak (60 dk) askıya alır.
// Süre dolunca kilit otomatik geri döner.
function kmErtelemeAktifMi(){
  var bitis = parseInt(localStorage.getItem("weicon_km_ertele_bitis")||"0", 10);
  return bitis > Date.now();
}
function kmKapiAcikMi(){
  return kmBugunKayitliMi() || kmErtelemeAktifMi();
}
function kmErtele(){
  var bitis = Date.now() + 60*60*1000;
  localStorage.setItem("weicon_km_ertele_bitis", String(bitis));
  showToast("⏰ Kilit 1 saatliğine ertelendi. Süre dolunca hatırlatma tekrar aktif olacak.", 4000);
  kmErtelemeButonuGuncelle();
}
function kmErtelemeButonuGuncelle(){
  var el = document.getElementById("kmErteleButonKutusu");
  if(!el) return;
  if(kmBugunKayitliMi()){
    el.style.display = "none";
    return;
  }
  if(kmErtelemeAktifMi()){
    var kalanMs = parseInt(localStorage.getItem("weicon_km_ertele_bitis")||"0",10) - Date.now();
    var kalanDk = Math.max(1, Math.ceil(kalanMs/60000));
    el.style.display = "block";
    el.innerHTML = "<div style='background:#fff4e5;border:2px solid #e8912b;border-radius:10px;padding:14px;text-align:center;font-size:18px;font-weight:800;color:#a85d00;'>⏰ Kilit "+kalanDk+" dk sonra tekrar devreye girecek</div>";
  } else {
    el.style.display = "block";
    el.innerHTML = "<button type='button' onclick='kmErtele()' style='width:100%;background:#fff4e5;color:#a85d00;border:2px solid #e8912b;padding:16px;font-size:20px;font-weight:800;border-radius:10px;cursor:pointer;'>⏰ Aracım Yanımda Değil — 1 Saat Ertele</button>";
  }
}
setInterval(function(){ if(typeof kmErtelemeButonuGuncelle==="function") kmErtelemeButonuGuncelle(); }, 30000);

function kmTakipSayfasiAc(hedefGorunum){
  function devamEt(){
    document.getElementById("kmAdSoyadInput").value = kmTakipAyarlariObj.adSoyad || "";
    document.getElementById("kmPlakaInput").value = kmTakipAyarlariObj.plaka || "";
    if(hedefGorunum==="aylik"){
      kmTakipGorunumDegistir("aylik");
    } else {
      kmTakipGorunumDegistir("gunluk");
      kmGunKayitYukle(kmAktifTarih);
    }
    kmAyBasiKontrolEt();
  }
  if(kmTakipYuklendi){ devamEt(); return; }
  var yuklenecek = 2;
  function biriTamamlandi(){ yuklenecek--; if(yuklenecek<=0){ kmTakipYuklendi=true; devamEt(); } }
  kmTakipAyarlariObj = lsGet("weicon_km_ayarlari", {adSoyad:"", plaka:""});
  kmTakipKayitlariObj = lsGet("weicon_km_kayitlari", {});
  if(window.fbGet){
    window.fbGet("kmTakipAyarlari").then(function(d){ if(d) kmTakipAyarlariObj = d; biriTamamlandi(); }).catch(biriTamamlandi);
    window.fbGet("kmTakip").then(function(d){ if(d) kmTakipKayitlariObj = d; biriTamamlandi(); }).catch(biriTamamlandi);
  } else {
    biriTamamlandi(); biriTamamlandi();
  }
}

function kmAyarlarKaydet(){
  kmTakipAyarlariObj = {
    adSoyad: document.getElementById("kmAdSoyadInput").value.trim(),
    plaka: document.getElementById("kmPlakaInput").value.trim()
  };
  lsSet("weicon_km_ayarlari", kmTakipAyarlariObj);
  if(window.fbSet) window.fbSet("kmTakipAyarlari", kmTakipAyarlariObj).catch(function(e){ console.error("Firebase yazma hatası:", e); });
}

function kmTakipGorunumDegistir(hangi){
  var gBtn = document.getElementById("kmGorunumGunlukBtn");
  var aBtn = document.getElementById("kmGorunumAylikBtn");
  var gView = document.getElementById("kmGunlukView");
  var aView = document.getElementById("kmAylikView");
  if(hangi==="aylik"){
    gView.style.display="none"; aView.style.display="block";
    aBtn.style.background="#003a70"; aBtn.style.color="#fff";
    gBtn.style.background="#e8edf5"; gBtn.style.color="#556";
    kmTakipAylikTabloRenderEt();
  } else {
    gView.style.display="block"; aView.style.display="none";
    gBtn.style.background="#003a70"; gBtn.style.color="#fff";
    aBtn.style.background="#e8edf5"; aBtn.style.color="#556";
    // Aylık tabloda bu arada değişiklik yapılmış olabilir (KM/Saat) — güncel
    // veriyle yeniden yükle ki BAŞLANGIÇ/BİTİŞ KM kutuları hemen yansısın.
    kmGunKayitYukle(kmAktifTarih);
  }
}

function kmOncekiKmBul(anahtarHaric){
  var enYakinAnahtar = null;
  Object.keys(kmTakipKayitlariObj).forEach(function(k){
    if(k >= anahtarHaric) return;
    var kayit = kmTakipKayitlariObj[k];
    if(kayit && kayit.km!==undefined && kayit.km!==null && kayit.km!==""){
      if(!enYakinAnahtar || k > enYakinAnahtar) enYakinAnahtar = k;
    }
  });
  return enYakinAnahtar ? kmTakipKayitlariObj[enYakinAnahtar].km : null;
}

// YENİ MANTIK: Bir günün fotoğraflanan KM'si O GÜNÜN BAŞLANGICI'dır (istisnasız).
// Bir günün BİTİŞ KM'si ise SONRAKİ günün fotoğraflanan (başlangıç) değeridir.
// Bu yüzden "bitiş" için artık ileri yönlü arama gerekiyor.
function kmSonrakiKmBul(anahtarHaric){
  var enYakinAnahtar = null;
  Object.keys(kmTakipKayitlariObj).forEach(function(k){
    if(k <= anahtarHaric) return;
    var kayit = kmTakipKayitlariObj[k];
    if(kayit && kayit.km!==undefined && kayit.km!==null && kayit.km!==""){
      if(!enYakinAnahtar || k < enYakinAnahtar) enYakinAnahtar = k;
    }
  });
  return enYakinAnahtar ? kmTakipKayitlariObj[enYakinAnahtar].km : null;
}

// "Bir önceki tarih" burada TAKVİMDE dünü değil, kayıtlı olan EN YAKIN önceki
// günü ifade eder (araya boş — fotoğrafsız — günler girse bile). Sistem sadece
// fotoğrafın çekildiği günleri baz alır, aradaki tarihler tabloda hiç yer almaz.

// "YYYY-MM-DD" formatındaki bir tarih anahtarını N gün kaydırıp yeni anahtarı döndürür.
function kmAnahtarKaydir(anahtar, deltaGun){
  var p = anahtar.split("-");
  var d = new Date(parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2]));
  d.setDate(d.getDate()+deltaGun);
  return kmTarihAnahtari(d);
}

// Bitiş KM - Başlangıç KM farkını verir. Değerlerden biri boş/geçersizse null döner.
function kmFarkHesapla(bitis, baslangic){
  if(bitis===undefined||bitis===null||bitis===""||baslangic===undefined||baslangic===null||baslangic==="") return null;
  var b = parseFloat(bitis), a = parseFloat(baslangic);
  if(isNaN(b)||isNaN(a)) return null;
  var f = b-a;
  return f<0 ? 0 : f;
}

// Bir günün kaydını, otomatik kurallara göre yeniden hesaplar:
// 1) Başlangıç KM boşsa, bir önceki günün Bitiş KM'si otomatik yazılır.
// 2) Bitiş KM - Başlangıç KM farkı, o gün için seçili kategoriye (İş/Özel)
//    göre ilgili alana otomatik yazılır, diğer alan temizlenir.
function kmAylikGunYenidenHesapla(anahtar){
  var kayit = kmTakipKayitlariObj[anahtar];
  if(!kayit) return;
  if(kayit.km===undefined || kayit.km===null || kayit.km===""){
    var oncekiKayit = kmTakipKayitlariObj[kmAnahtarKaydir(anahtar,-1)];
    if(oncekiKayit && oncekiKayit.bitisKm!==undefined && oncekiKayit.bitisKm!==null && oncekiKayit.bitisKm!==""){
      kayit.km = oncekiKayit.bitisKm;
    }
  }
  var fark = kmFarkHesapla(kayit.bitisKm, kayit.km);
  var kategori = kayit.kmKategori || "is";
  if(fark!==null){
    if(kategori==="is"){ kayit.isKm = fark; kayit.ozelKm = null; }
    else { kayit.ozelKm = fark; kayit.isKm = null; }
  }
}

// Bir günün Bitiş KM'si girildiğinde/değiştiğinde, bir SONRAKİ günün Başlangıç
// KM'sini otomatik olarak bu değere eşitler (araç kilometresi fiziksel olarak
// süreklidir: bugünün bitişi = yarının başlangıcı).
function kmAylikBitisKmSonrakiGuneAktar(anahtar){
  var kayit = kmTakipKayitlariObj[anahtar];
  if(!kayit || kayit.bitisKm===undefined || kayit.bitisKm===null || kayit.bitisKm==="") return;
  var sonrakiAnahtar = kmAnahtarKaydir(anahtar, 1);
  var sonrakiKayit = kmTakipKayitlariObj[sonrakiAnahtar];
  if(!sonrakiKayit){
    var p = sonrakiAnahtar.split("-");
    var tarihObj = new Date(parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2]));
    sonrakiKayit = { tarih: sonrakiAnahtar, gunTipi: kmVarsayilanGunTipi(tarihObj) };
  }
  sonrakiKayit.km = kayit.bitisKm;
  kmTakipKayitlariObj[sonrakiAnahtar] = sonrakiKayit;
  kmAylikGunYenidenHesapla(sonrakiAnahtar);
  if(typeof kmDegisiklikKaydet==="function") kmDegisiklikKaydet(sonrakiAnahtar);
}

// YENİ MANTIKTA ARTIK GEREKSİZ: her gün kendi fotoğrafıyla kendi başlangıcını taşıyor,
// önceki bir kayda bağımlı değil. Fonksiyon geriye dönük uyumluluk için duruyor ama hep false döner.
function kmBaslangicGerekliMi(){
  return false;
}

function kmAyBasiKontrolEt(){
  if(!kmBaslangicGerekliMi()) return;
  var simdi = new Date();
  var ayAdi = KM_AY_ADLARI[simdi.getMonth()];
  document.getElementById("kmAyBasiAciklama").textContent =
    "Sistemde henüz bir başlangıç KM kaydı yok. "+ayAdi+" ayı (veya takip başlangıcı) için aracın güncel kilometresini gir — bu değer, günlük kayıtların otomatik hesaplanabilmesi için gereklidir.";
  document.getElementById("kmAyBasiInput").value = "";
  document.getElementById("kmAyBasiModal").style.display = "flex";
}

function kmAyBasiKaydet(){
  var deger = parseFloat(document.getElementById("kmAyBasiInput").value);
  if(!deger || deger<=0){ showToast("Geçerli bir KM girin."); return; }
  var dun = new Date();
  dun.setDate(dun.getDate()-1);
  var dunAnahtar = kmTarihAnahtari(dun);
  kmTakipKayitlariObj = lsGet("weicon_km_kayitlari", {});
  kmTakipKayitlariObj[dunAnahtar] = kmTakipKayitlariObj[dunAnahtar] || {};
  kmTakipKayitlariObj[dunAnahtar].km = deger;
  if(!kmTakipKayitlariObj[dunAnahtar].saat) kmTakipKayitlariObj[dunAnahtar].saat = "23:59";
  kmTakipKayitlariObj[dunAnahtar].sentetikBaslangic = true;
  lsSet("weicon_km_kayitlari", kmTakipKayitlariObj);
  kmGuvenliKaydet({anahtar:dunAnahtar, kayit:kmTakipKayitlariObj[dunAnahtar]}).catch(function(e){ console.error("Firebase yazma hatası:", e); });
  document.getElementById("kmAyBasiModal").style.display = "none";
  showToast("✓ Başlangıç KM kaydedildi, sistem hazır.");
  kmGunKayitYukle(kmAktifTarih);
}

var KM_GUN_TIPI_ETIKET = {
  hafta_sonu: "HAFTA SONU TATİL",
  resmi_tatil: "RESMİ TATİL",
  tam_izin: "TAM GÜN İZİN",
  yarim_izin: "YARIM GÜN İZİN",
  bayram: "BAYRAM TATİLİ"
};

// Kayıt henüz oluşturulmamışsa: Pazartesi-Cuma (hafta içi) "Normal İş Günü",
// Cumartesi/Pazar "Hafta Sonu Tatil" olarak otomatik seçilir.
function kmVarsayilanGunTipi(tarihObj){
  var gun = tarihObj.getDay(); // 0=Pazar, 6=Cumartesi
  return (gun===0 || gun===6) ? "hafta_sonu" : "normal";
}

// Formdaki 5 alanın (KM / Tarih / Saat / Güzergah / Ziyaret) o an DOLU olup
// olmadığını gösteren tamamlanma çubuğu. Kullanıcı gün içinde neyi
// unuttuğunu tek bakışta görsün diye her input değiştikçe anında güncellenir.
// SADECE görsel bir hatırlatıcıdır — kaydetme zorunluluğu koymaz.
function kmDurumCubuguGuncelle(){
  var el = document.getElementById("kmDurumCubugu");
  if(!el) return;
  var kmDolu = !!(document.getElementById("kmBitisKmInput").value||"").trim();
  var tarihDolu = !!(document.getElementById("kmTarihGosterInput").value||"").trim();
  var saatDolu = !!(document.getElementById("kmSaatInput").value||"").trim();
  var guzergahDolu = !!(document.getElementById("kmGuzergahInput").value||"").trim();
  var ziyaretDolu = !!(document.getElementById("kmZiyaretYerleriInput").value||"").trim();

  var alanlar = [
    {ad:"KM", dolu:kmDolu},
    {ad:"Tarih", dolu:tarihDolu},
    {ad:"Saat", dolu:saatDolu},
    {ad:"Güzergah", dolu:guzergahDolu},
    {ad:"Ziyaret", dolu:ziyaretDolu}
  ];

  var chipsHtml = alanlar.map(function(a){
    if(a.dolu){
      return "<span style='display:inline-flex;align-items:center;gap:4px;padding:7px 12px;border-radius:20px;font-size:14px;font-weight:800;background:#e3f7ef;color:#0e7c63;border:1.5px solid #7dcdb3;'>✅ "+a.ad+"</span>";
    }
    return "<span style='display:inline-flex;align-items:center;gap:4px;padding:7px 12px;border-radius:20px;font-size:14px;font-weight:800;background:#fdf1e0;color:#9a6a10;border:1.5px solid #f0c880;'>⬜ "+a.ad+"</span>";
  }).join(" ");

  var tumuTam = alanlar.every(function(a){ return a.dolu; });
  var baslikRenk = tumuTam ? "#0e7c63" : "#8a97a6";
  var baslikMetin = tumuTam ? "📋 BUGÜNÜN KAYDI TAMAM" : "📋 BUGÜNÜN TAMAMLANMA DURUMU";

  el.innerHTML = "<div style='background:#fff;border:2px solid #e2e8f0;border-radius:12px;padding:12px 14px;'>"
    + "<div style='font-size:13px;font-weight:900;color:"+baslikRenk+";letter-spacing:.3px;margin-bottom:8px;'>"+baslikMetin+"</div>"
    + "<div style='display:flex;flex-wrap:wrap;gap:6px;'>"+chipsHtml+"</div>"
    + "</div>";
}

// Firebase'e yazma İŞLEMİNİN GERÇEKTEN tamamlanıp tamamlanmadığını (sunucudan
// onay gelip gelmediğini) gösteren banner. "Kaydediliyor" → "Kaydedildi" geçişi
// SADECE gerçek yazma onayı (kmGuvenliKaydet'in resolve ettiği {onaylandi:true})
// geldiğinde olur. Çevrimdışıysa "kuyruğa alındı" denir, ASLA "kaydedildi" denmez —
// yanlış/iyimser bir bilgi kullanıcıya asla gösterilmez.
function kmExcelBannerGoster(durum, ekMetin){
  var el = document.getElementById("kmExcelKayitBanner");
  if(!el) return;
  el.style.display = "block";
  var stil, icerik;
  if(durum==="kaydediliyor"){
    stil = "background:#fff8e6;color:#8a6a10;border:1.5px solid #f0d78c;";
    icerik = "<span style='display:inline-block;width:14px;height:14px;border-radius:50%;border:3px solid #f0d78c;border-top-color:#8a6a10;animation:kmSpin .8s linear infinite;vertical-align:middle;margin-right:8px;'></span>Excel'e kaydediliyor, lütfen bekleyin...";
  } else if(durum==="onaylandi"){
    stil = "background:#e3f7ef;color:#0e7c63;border:1.5px solid #7dcdb3;";
    icerik = "✅ Excel'e kaydedildi"+(ekMetin?(" — "+ekMetin):"");
  } else if(durum==="kuyrukta"){
    stil = "background:#fdf1e0;color:#9a6a10;border:1.5px solid #f0c880;";
    icerik = "📶 Bağlantı yok — kayıt kuyruğa alındı, bağlantı gelince otomatik gönderilecek (henüz Excel'e işlenmedi)";
  } else if(durum==="hata"){
    stil = "background:#fdeaea;color:#a3312a;border:1.5px solid #eab3ae;";
    icerik = "❌ Excel'e KAYDEDİLEMEDİ — internet bağlantınızı kontrol edip tekrar deneyin";
  } else {
    el.style.display = "none";
    return;
  }
  el.innerHTML = "<div style='"+stil+"border-radius:12px;padding:14px 16px;font-size:15px;font-weight:800;'>"+icerik+"</div>"
    + "<style>@keyframes kmSpin{to{transform:rotate(360deg);}}</style>";
}

function kmGunKayitYukle(tarihObj){
  var anahtar = kmTarihAnahtari(tarihObj);
  var kayit = kmTakipKayitlariObj[anahtar] || {};

  kmKmFotoBtnOkumaModunaGecir();

  // TARİH kutusu artık sistem tarihini değil, "Tarih ve Saat Gir" ile ÇEKİLEN
  // fotoğraftan okunan tarihi gösterir. Henüz fotoğraf çekilmediyse boş kalır.
  var tarihGosterEl = document.getElementById("kmTarihGosterInput");
  if(tarihGosterEl) tarihGosterEl.value = kayit.tarihGosterim || "";

  document.getElementById("kmGunTipiSelect").value = kayit.gunTipi || kmVarsayilanGunTipi(tarihObj);
  document.getElementById("kmBitisKmInput").value = (kayit.km!==undefined && kayit.km!==null) ? kayit.km : "";
  document.getElementById("kmSaatInput").value = kayit.saat || "";
  document.getElementById("kmGuzergahInput").value = kayit.guzergah || "";
  document.getElementById("kmZiyaretYerleriInput").value = kayit.ziyaretYerleri || "";
  document.getElementById("kmOzelKmInput").value = (kayit.ozelKm!==undefined && kayit.ozelKm!==null) ? kayit.ozelKm : "";
  kmKategoriSec(kayit.kmKategori || "is");

  document.getElementById("kmKmFotoDurum").style.display = "none";

  kmOncekiGunOzetiGoster(tarihObj);
  kmTakipHesapla();
  kmFormKilitleGoster(kayit.km!==undefined && kayit.km!==null && kayit.km!=="");
  if(typeof kmErtelemeButonuGuncelle==="function") kmErtelemeButonuGuncelle();
  kmUzunBasinaKilitAcKur();
  kmDurumCubuguGuncelle();
  kmExcelBannerGoster(null);
}

// Tarih navigasyonunun altında, görüntülenen günden BİR ÖNCEKİ günün
// başlangıç/bitiş/toplam km özetini gösterir.
function kmOncekiGunOzetiGoster(tarihObj){
  var el = document.getElementById("kmOncekiGunOzeti");
  if(!el) return;
  var oncekiGun = new Date(tarihObj);
  oncekiGun.setDate(oncekiGun.getDate()-1);
  var oncekiAnahtar = kmTarihAnahtari(oncekiGun);
  var oncekiKayit = kmTakipKayitlariObj[oncekiAnahtar];
  var oncekiGunEtiket = oncekiGun.getDate()+" "+KM_AY_ADLARI[oncekiGun.getMonth()];

  if(!oncekiKayit || oncekiKayit.km===undefined || oncekiKayit.km===null || oncekiKayit.km===""){
    el.innerHTML = "<div style='text-align:center;color:#8a97a6;font-size:24px;padding:16px;'>"+oncekiGunEtiket+" için kayıt yok.</div>";
    return;
  }
  var oncekiBaslangic = parseFloat(oncekiKayit.km); // D-1'in KENDİ okuması = D-1'in başlangıcı
  var oncekiBitis = kmSonrakiKmBul(oncekiAnahtar); // bir sonraki (bugünkü) okuma = D-1'in bitişi
  var toplam = (oncekiBitis!==null && !isNaN(oncekiBaslangic)) ? Math.abs(oncekiBitis-oncekiBaslangic) : null;

  el.innerHTML = "<div style='padding:8px 16px;'>"
    + "<div style='font-size:19px;font-weight:900;color:#3569b8;margin-bottom:8px;letter-spacing:.2px;'>📅 "+oncekiGunEtiket+" ÖZETİ</div>"
    + "<div style='display:flex;justify-content:space-around;align-items:center;flex-wrap:wrap;gap:4px;'>"
      + "<div style='text-align:center;'><div style='font-size:14px;color:#8a97a6;font-weight:800;letter-spacing:.3px;'>BAŞLANGIÇ</div><div style='font-size:25px;font-weight:900;color:#003a70;margin-top:2px;'>"+kmFmt(oncekiBaslangic)+"</div></div>"
      + "<div style='font-size:20px;color:#b7c1cc;'>→</div>"
      + "<div style='text-align:center;'><div style='font-size:14px;color:#8a97a6;font-weight:800;letter-spacing:.3px;'>BİTİŞ</div><div style='font-size:25px;font-weight:900;color:#003a70;margin-top:2px;'>"+(oncekiBitis!==null?kmFmt(oncekiBitis):"—")+"</div></div>"
      + "<div style='text-align:center;'><div style='font-size:14px;color:#8a97a6;font-weight:800;letter-spacing:.3px;'>YAPILAN KM</div><div style='font-size:25px;font-weight:900;color:#16a085;margin-top:2px;'>"+(toplam!==null?("= "+kmFmt(toplam)+" km"):"—")+"</div></div>"
    + "</div>"
  + "</div>";
}

function kmTakipGunTipiDegisti(){
  kmTakipHesapla();
  kmAlanKilitleriUygula();
  // Gün zaten kaydedilmiş olsa bile (kilitli görünüm), Gün Tipi değişikliği
  // anında sessizce kaydedilir — kullanıcı tekrar "Günü Kaydet"e basmak zorunda kalmaz.
  if(document.getElementById("kmDuzenlemeBar") && document.getElementById("kmDuzenlemeBar").innerHTML.indexOf("tamamlandı")!==-1){
    kmTakipKaydet(true);
  }
}

function kmTakipKategoriDegisti(){
  if(document.getElementById("kmDuzenlemeBar") && document.getElementById("kmDuzenlemeBar").innerHTML.indexOf("tamamlandı")!==-1){
    kmTakipKaydet(true);
  }
}

function kmKategoriSec(kategori){
  var sel = document.getElementById("kmKategoriSelect");
  if(sel) sel.value = kategori || "is";
}

// Artık alanlar arasında zorla sıralama YOK — kullanıcı istediği alana
// istediği sırayla girebilir. Bu fonksiyon sadece görsel/erişilebilirlik
// için tüm alanların açık kaldığından emin olur (geçmiş sürümle uyum için
// tutuluyor, çağıran yerler dokunulmadan bırakıldı).
function kmAlanKilitleriUygula(){
  ["kmSaatFotoBtn","kmTarihGosterInput","kmSaatInput","kmGuzergahInput","kmZiyaretYerleriInput","kmKategoriSelect"].forEach(function(id){
    kmAlanAyarla(id, true, id==="kmSaatFotoBtn");
  });
}

function kmAlanAyarla(id, acikMi, butonMu){
  var el = document.getElementById(id);
  if(!el) return;
  el.disabled = !acikMi;
  el.style.opacity = acikMi ? "1" : "0.4";
  el.style.cursor = acikMi ? (butonMu ? "pointer" : "text") : "not-allowed";
}

// Kaydet sırasında eksik çıkan alanları kırmızı çerçeveyle işaretler ve
// ilk eksik alana ekranı kaydırır. Kullanıcı o alana bir şey yazdığı an
// kırmızı çerçeve otomatik kalkar.
var KM_EKSIK_ALAN_ID = {
  "KM": "kmBitisKmInput",
  "Tarih": "kmTarihGosterInput",
  "Saat": "kmSaatInput",
  "Seyir Güzergahı": "kmGuzergahInput",
  "Kategori (İş/Özel KM)": "kmKategoriSelect"
};
function kmEksikAlanlariIsaretle(eksikler){
  var ilkEl = null;
  eksikler.forEach(function(etiket){
    var id = KM_EKSIK_ALAN_ID[etiket];
    var el = id && document.getElementById(id);
    if(!el) return;
    el.style.border = "3px solid #e0524a";
    el.style.boxShadow = "0 0 0 3px rgba(224,82,74,0.15)";
    if(!ilkEl) ilkEl = el;
    var temizle = function(){
      el.style.border = "";
      el.style.boxShadow = "";
      el.removeEventListener("input", temizle);
      el.removeEventListener("change", temizle);
    };
    el.addEventListener("input", temizle);
    el.addEventListener("change", temizle);
  });
  if(ilkEl && ilkEl.scrollIntoView) ilkEl.scrollIntoView({behavior:"smooth", block:"center"});
}

var KM_KILIT_ALAN_ID = ["kmKmFotoBtn","kmSaatFotoBtn","kmBitisKmInput","kmTarihGosterInput","kmSaatInput"];
// NOT: "kmGunTipiSelect" (Gün Tipi) ve "kmKategoriSelect" (İş/Özel KM) BİLİNÇLİ
// olarak bu kilit listesinde YOK — gün kaydedilse bile bu iki seçim kutusu her
// zaman açık/değiştirilebilir kalır (aşağıdaki onchange'ler değişikliği anında
// sessizce kaydeder, "Günü Kaydet"e tekrar basmaya gerek kalmaz).

var KM_ALAN_ETIKET = {
  kmKmFotoBtn: "KM fotoğrafı",
  kmSaatFotoBtn: "Tarih/Saat fotoğrafı",
  kmBitisKmInput: "KM",
  kmTarihGosterInput: "Tarih",
  kmSaatInput: "Saat",
  kmGuzergahInput: "Seyir Güzergahı",
  kmZiyaretYerleriInput: "Ziyaret Yerleri",
  kmGunTipiSelect: "Gün Tipi",
  kmKategoriSelect: "Kategori"
};

// Bugünün kaydı zaten yapılmışsa TÜM alanlar kilitlenir (yanlışlıkla
// bozulmasın diye). Tek bir "Düzenle" tuşu YOK — her alan kendi başına,
// üzerine 5 saniye BASILI TUTULARAK açılır; sadece o hücre aktif olur ve
// elle giriş yapılabilir. Bu kilit, ertesi günün sabah ilk KM girişine
// kadar (yani gün değişip yeni bir kayıt başlayana kadar) geçerlidir.
function kmFormKilitleGoster(kilitliMi){
  KM_KILIT_ALAN_ID.forEach(function(id){
    var el = document.getElementById(id);
    if(!el) return;
    el.disabled = kilitliMi;
    el.style.opacity = kilitliMi ? "0.55" : "1";
    el.style.cursor = kilitliMi ? "not-allowed" : (el.tagName==="BUTTON" ? "pointer" : "text");
  });
  var bar = document.getElementById("kmDuzenlemeBar");
  if(!bar) return;
  bar.innerHTML = kilitliMi
    ? "<div style='background:#eafaf3;border:2px solid #16a085;border-radius:8px;padding:12px;text-align:center;'><span style='font-size:24px;font-weight:900;color:#0e5c47;letter-spacing:.2px;'>✅ Bugünün kaydı tamamlandı</span></div>"
    : "";
}

// Her kilitli alana bir kere bağlanır (sayfa açılışında). Alan disabled
// iken 5 saniye basılı tutulursa sadece o alanın kilidi açılır.
function kmUzunBasinaKilitAcKur(){
  KM_KILIT_ALAN_ID.forEach(function(id){
    var el = document.getElementById(id);
    if(!el || el.dataset.kmUzunBasKurulu) return;
    el.dataset.kmUzunBasKurulu = "1";
    var zamanlayici = null;
    var baslat = function(){
      if(!el.disabled) return;
      zamanlayici = setTimeout(function(){
        el.disabled = false;
        el.style.opacity = "1";
        el.style.cursor = (el.tagName==="BUTTON") ? "pointer" : "text";
        el.style.boxShadow = "0 0 0 3px rgba(22,160,133,0.4)";
        setTimeout(function(){ el.style.boxShadow=""; }, 1200);
        if(typeof showToast==="function") showToast("✏️ "+(KM_ALAN_ETIKET[el.id]||"Alan")+" düzenlemeye açıldı.");
        if(el.tagName==="INPUT" || el.tagName==="TEXTAREA") el.focus();
        zamanlayici = null;
      }, 5000);
    };
    var iptal = function(){
      if(zamanlayici){ clearTimeout(zamanlayici); zamanlayici = null; }
    };
    el.addEventListener("touchstart", baslat, {passive:true});
    el.addEventListener("touchend", iptal);
    el.addEventListener("touchcancel", iptal);
    el.addEventListener("touchmove", iptal);
    el.addEventListener("mousedown", baslat);
    el.addEventListener("mouseup", iptal);
    el.addEventListener("mouseleave", iptal);
  });
}

// Fotoğraf-okuma kaldırıldığı için Tarih/Saat artık otomatik dolmuyordu — KM
// kutusuna bir şey yazılınca, Tarih/Saat kutuları hâlâ BOŞSA, cihazın o anki
// tarih/saatini otomatik yazıyoruz. Kullanıcı isterse üzerine yazıp değiştirebilir
// (bu yüzden SADECE boşken dolduruyoruz, doluyken üzerine yazmıyoruz).
function kmTarihSaatOtomatikDoldur(){
  var kmEl = document.getElementById("kmBitisKmInput");
  if(!kmEl || kmEl.value==="") return;
  var tarihEl = document.getElementById("kmTarihGosterInput");
  var saatEl = document.getElementById("kmSaatInput");
  var simdi = new Date();
  if(tarihEl && !tarihEl.value){
    var gg = ("0"+simdi.getDate()).slice(-2);
    var aa = ("0"+(simdi.getMonth()+1)).slice(-2);
    tarihEl.value = gg+"."+aa+"."+simdi.getFullYear();
  }
  if(saatEl && !saatEl.value){
    saatEl.value = ("0"+simdi.getHours()).slice(-2)+":"+("0"+simdi.getMinutes()).slice(-2);
  }
  kmAlanKilitleriUygula();
}

function kmTakipHesapla(){
  var anahtar = kmTarihAnahtari(kmAktifTarih);

  // BAŞLANGIÇ KM artık BUGÜNÜN KENDİ okunan değeri (KM Gir ile girilen/fotoğraflanan)
  var kendiKm = parseFloat(document.getElementById("kmBitisKmInput").value);
  var baslangicEl = document.getElementById("kmBaslangicKmEtiket");
  baslangicEl.textContent = !isNaN(kendiKm) ? kmFmt(kendiKm) : "—";

  // BİTİŞ KM artık SONRAKİ günün okunan değeri — henüz o gün gelmediyse "—"
  var sonrakiKm = kmSonrakiKmBul(anahtar);
  var isKmEl = document.getElementById("kmIsKmEtiket");
  isKmEl.textContent = (sonrakiKm!==null) ? kmFmt(sonrakiKm) : "—";
  kmAlanKilitleriUygula();
}

// En son KM kaydı girilmiş günden bir sonraki (boş) günü bulur. Hiç kayıt
// yoksa bugünü döner. Bulunan gün bugünden ileriyse (gelecek), bugüne sabitlenir.
// NOT: Eskiden burada "kmSonrakiBosGunuBul()" adlı bir fonksiyon vardı; okunan KM'yi
// "son kayıtlı günden sonraki ilk BOŞ güne" yerleştiriyordu. Bu YANLIŞTI — fotoğrafsız
// (es geçilen) günleri geçmişe dönük doldurmaya çalışıyor, bugünün okumasını yanlış bir
// güne yazabiliyordu. Artık kmFotoSecildi() doğrudan cihazın GERÇEK bugünkü tarihini
// kullanıyor, bu fonksiyona gerek kalmadı.

// KM/Tarih-Saat fotoğrafından okuma (kartFotoGonder ile aynı Cloud Function, "kmOku" hedefi)
function kmFotoSecildi(input, hangi){
  var dosya = input.files && input.files[0];
  if(!dosya) return;
  var durumElId = hangi==="km" ? "kmKmFotoDurum" : "kmSaatFotoDurum";
  var hedef = hangi==="km" ? "kmOkuKm" : "kmOkuTarihSaat";
  kartFotoGonder(dosya, hedef, durumElId, function(data){
    if(hangi==="km"){
      if(data.km){
        // ÖNEMLİ: Fotoğraf hangi gün çekiliyorsa, okuma HER ZAMAN o günün
        // (cihazın GERÇEK bugünkü tarihinin) kaydı olur — "son kayıtlı günden
        // sonraki boş gün" gibi bir arayışla GEÇMİŞTEKİ bir güne asla yazılmaz.
        // Fotoğrafsız günler otomatik olarak es geçilir (o gün km yapılmamış
        // sayılır) — aradaki boşluk hiçbir zaman doldurulmaya çalışılmaz.
        var bugun = new Date();
        if(kmTarihAnahtari(bugun) !== kmTarihAnahtari(kmAktifTarih)){
          kmAktifTarih = bugun;
          kmGunKayitYukle(kmAktifTarih);
        }
        document.getElementById("kmBitisKmInput").value = data.km;
        kmTakipHesapla();
        kmSuAnTarihSaatDoldur();
        kmKmFotoBtnKaydetModunaGecir();
        // KM okunur okunmaz, diğer alanlar (güzergah, ziyaret vb.) boş kalsa bile
        // sessizce kaydet — böylece Aylık Rapor'a KM hemen yansır, geri kalanı
        // gün içinde doldurulup normal "KM Kaydet" ile tamamlanabilir.
        kmTakipKaydet(true);
      }
      if(!data.km) return false;
    } else {
      var saatVarMi = !!data.saat, tarihVarMi = !!data.tarih;
      if(data.saat) document.getElementById("kmSaatInput").value = data.saat;
      if(data.tarih) document.getElementById("kmTarihGosterInput").value = data.tarih;
      kmAlanKilitleriUygula();
      if(!saatVarMi && !tarihVarMi) return false;
      if(saatVarMi && !tarihVarMi) return "✓ Saat okundu — tarih fotoğrafta görünmüyor, lütfen elle girin.";
      if(!saatVarMi && tarihVarMi) return "✓ Tarih okundu — saat fotoğrafta görünmüyor, lütfen elle girin.";
    }
  });
  input.value = "";
}

// KM fotoğrafı çekilip okunduğu ANDAKİ cihaz tarih/saatini TARİH ve SAAT
// kutularına otomatik yazar — bu, km okuma anının kaydıdır.