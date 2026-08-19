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
    yetkiliTel = (seciliYetkililer[0] && seciliYetkililer[0].telefon) || "";
    yetkiliMail = (seciliYetkililer[0] && seciliYetkililer[0].eposta) || "";
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
  var yetkiliSatiriYaz = function(isim, tel, eposta){
    if(!isim && !tel && !eposta) return "";
    var parcalar = [];
    if(tel) parcalar.push("📞 "+tel);
    if(eposta) parcalar.push("✉️ "+eposta);
    return "<div style='font-size:15px;color:#1a2a3a;line-height:1.5;padding-bottom:6px;margin-bottom:6px;border-bottom:1px solid #eef1f4;'>👤 <b style='font-weight:800;'>"+(isim||"-")+"</b>"+(parcalar.length?" — <span style='color:#556;font-size:14px;'>"+parcalar.join(" · ")+"</span>":"")+"</div>";
  };
  // Belge üzerinde gösterilecek TÜM yetkililer — artık heuristik ("iletisim
  // listesindeki ilk farklı kişi") DEĞİL, gerçekten seçilmiş kişi listesi.
  // Arşivden görüntülenirken o belge kaydedildiği andaki liste (aktifKayit.yetkililer)
  // kullanılır; canlı derlemede o an seçili olan seciliYetkililer kullanılır.
  var yetkiliListesiGoster = [];
  if(aktifKayit){
    if(aktifKayit.yetkililer && aktifKayit.yetkililer.length){
      yetkiliListesiGoster = aktifKayit.yetkililer;
    } else if(yetkiliAd){
      // Eski (bu özellikten önce) kaydedilmiş belgeler için geriye dönük uyumluluk
      yetkiliListesiGoster = [{isim:yetkiliAd, telefon:yetkiliTel, eposta:yetkiliMail}];
    }
  } else {
    yetkiliListesiGoster = seciliYetkililer;
  }

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
    + yetkiliListesiGoster.map(function(k){ return yetkiliSatiriYaz(k.isim, k.telefon, k.eposta); }).join("")
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

  retur
