function ziyaretGunicinEkleBaslat(gun){
  gun = parseInt(gun, 10);
  var now = new Date();
  var saat = 12, dakika = 0;
  var buGunBugunMu = now.getFullYear()===ziyaretTakvimYil && now.getMonth()===ziyaretTakvimAy && now.getDate()===gun;
  if(buGunBugunMu){ saat = now.getHours(); dakika = now.getMinutes(); }
  ziyaretEklenecekTs = new Date(ziyaretTakvimYil, ziyaretTakvimAy, gun, saat, dakika).getTime();
  document.getElementById("ziyaretGunModal").style.display="none";
  showToast("Şimdi bu ziyareti hangi müşteri için ekleyeceğinizi seçin.", 4000);
  musteriSecimBaslat("ziyaretEkleGun");
}

function musteriSecimBaslat(hedefSayfa){
  musteriSecimHedefSayfa = hedefSayfa;
  switchTab(7);
}

// ÜRÜN BUL ÖN-KONTROL — İşlemler ekranındaki "Ürün Bul"a basılınca önce açılır.
// Fatura Adresi / Teslimat Adresi / Yetkili Kişi'yi kontrol eder, eksikse hemen
// tamamlama imkanı sunar. "Eksik bilgiyle devam et" ile atlanabilir (zorunlu değil).
function urunBulOnKontrolAc(){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  urunBulKontrolAktif = true;
  document.getElementById("musteriKartModal").style.display="none";
  document.getElementById("ubkMusteriAdi").textContent = m.ad||"";
  urunBulOnKontrolRenderEt();
  document.getElementById("urunBulOnKontrolModal").style.display="flex";
}

function urunBulOnKontrolKapat(){
  urunBulKontrolAktif = false;
  document.getElementById("urunBulOnKontrolModal").style.display="none";
  document.getElementById("musteriKartModal").style.display="flex";
}

function urunBulOnKontrolRenderEt(){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;

  // Sadece TEK seçenek varsa ve henüz seçim yapılmamışsa otomatik seç —
  // gereksiz bir tıklama istemiyoruz. 2+ adres varsa kullanıcı elle seçmeli.
  var faturaListesi = musteriAdresListesiGetir(m, "fatura");
  var teslimatListesi = musteriAdresListesiGetir(m, "teslimat");
  if(!seciliFaturaAdresi && faturaListesi.length===1){ seciliFaturaAdresi = faturaListesi[0]; localStorage.setItem("weicon_secili_fatura", JSON.stringify(seciliFaturaAdresi)); }
  if(!seciliTeslimatAdresi && teslimatListesi.length===1){ seciliTeslimatAdresi = teslimatListesi[0]; localStorage.setItem("weicon_secili_teslimat", JSON.stringify(seciliTeslimatAdresi)); }

  var faturaVar = !!(seciliFaturaAdresi && seciliFaturaAdresi.adres);
  var teslimatVar = !!(seciliTeslimatAdresi && seciliTeslimatAdresi.adres);
  var yetkiliVar = !!(seciliYetkiliKisi && seciliYetkiliKisi.isim);
  var hepsiTam = faturaVar && teslimatVar && yetkiliVar;

  function satirOlustur(tamamMi, baslik, altYazi, butonYazi, butonOnclick, geciciMi, toggleHtml){
    var renkBg = tamamMi ? "linear-gradient(135deg,#f0fbf3,#dceedf)" : "linear-gradient(135deg,#fff6ec,#ffe8d1)";
    var renkBorder = tamamMi ? "#1f9d55" : "#b7601f";
    var renkYazi = tamamMi ? "#0e6b34" : "#a8590c";
    var ikon = tamamMi ? "✅" : "⚠️";
    var geciciRozet = geciciMi ? "<span style='background:#f2994a;color:#fff;font-size:10px;font-weight:900;padding:2px 8px;border-radius:6px;display:inline-block;margin-bottom:3px;'>GEÇİCİ · SADECE BU SİPARİŞ</span><br>" : "";
    return "<div style='background:"+renkBg+";border:2.5px solid "+renkBorder+";border-radius:10px;padding:14px 16px;margin-bottom:10px;'>"
      +"<div style='display:flex;align-items:center;gap:10px;'>"
      +"<span style='font-size:26px;'>"+ikon+"</span>"
      +"<div style='flex:1;min-width:0;'>"
      +"<div style='font-size:20px;font-weight:900;color:"+renkYazi+";'>"+baslik+"</div>"
      +"<div style='font-size:20px;color:"+renkYazi+";margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>"+geciciRozet+altYazi+"</div>"
      +"</div>"
      +"<button onclick='"+butonOnclick+"' style='background:"+(tamamMi?"#0e7c63":"#f2994a")+";color:#fff;border:none;padding:10px 16px;border-radius:8px;font-size:18px;font-weight:800;cursor:pointer;white-space:nowrap;flex-shrink:0;'>"+butonYazi+"</button>"
      +"</div>"
      + (toggleHtml||"")
      +"</div>";
  }

  function dahilEtAnahtariOlustur(acikMi){
    return "<div onclick='teslimatDahilEtDegistir()' style='cursor:pointer;display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px dashed "+(acikMi?"#7dcdb3":"#d5dce6")+";'>"
      +"<span style='font-size:14px;font-weight:800;color:"+(acikMi?"#0e7c63":"#8a97a6")+";'>📧 Bu belgeye dahil et</span>"
      +"<div style='width:46px;height:26px;border-radius:14px;background:"+(acikMi?"#0e7c63":"#c7cdd6")+";position:relative;flex-shrink:0;'>"
      +"<div style='position:absolute;top:2px;"+(acikMi?"right:2px;":"left:2px;")+"width:22px;height:22px;border-radius:50%;background:#fff;'></div>"
      +"</div></div>";
  }

  var html = "";
  html += satirOlustur(faturaVar, "FATURA ADRESİ", faturaVar?(safeText(seciliFaturaAdresi.gecici?"":seciliFaturaAdresi.etiket)+(seciliFaturaAdresi.gecici?"":" — ")+safeText(seciliFaturaAdresi.adres)):"Seçilmedi", faturaVar?"Değiştir":"+ Seç", "adresYonetimAc('fatura')", faturaVar && seciliFaturaAdresi.gecici);

  var teslimatAltYazi = teslimatVar ? (safeText(seciliTeslimatAdresi.gecici?"":seciliTeslimatAdresi.etiket)+(seciliTeslimatAdresi.gecici?"":" — ")+safeText(seciliTeslimatAdresi.adres)) : "Seçilmedi";
  if(teslimatVar && !teslimatDahilEt) teslimatAltYazi = "Seçili ama belgeye eklenmeyecek";
  html += satirOlustur(teslimatVar && teslimatDahilEt, "TESLİMAT ADRESİ", teslimatAltYazi, teslimatVar?"Değiştir":"+ Seç", "adresYonetimAc('teslimat')", teslimatVar && seciliTeslimatAdresi.gecici, teslimatVar ? dahilEtAnahtariOlustur(teslimatDahilEt) : "");

  html += satirOlustur(yetkiliVar, "YETKİLİ KİŞİ", yetkiliVar?safeText(seciliYetkiliKisi.isim):"Seçilmedi", yetkiliVar?"Değiştir":"+ Seç", "musteriIletisimYetkiliSecmeyeAc()");

  document.getElementById("ubkListesi").innerHTML = html;

  var devamBtn = document.getElementById("ubkDevamBtn");
  if(hepsiTam){
    devamBtn.style.background = "linear-gradient(135deg,#2563eb,#1a4d9e)";
    devamBtn.style.color = "#fff";
    devamBtn.textContent = "✅ Ürün Bul'a Geç →";
  } else {
    devamBtn.style.background = "#eef1f4";
    devamBtn.style.color = "#8a97a6";
    devamBtn.textContent = "⚠️ Eksik Bilgiyle Devam Et →";
  }
}

function urunBulOnKontrolDevamEt(){
  urunBulKontrolAktif = false;
  document.getElementById("urunBulOnKontrolModal").style.display="none";
  musteriIslemBaslatKarttan();
}

function musteriIslemBaslatKarttan(){
  if(musteriKartIdx===null) return;
  musteriListesi = lsGet("weicon_musteriler",[]);
  seciliMusteri = musteriListesi[musteriKartIdx];
  if(!seciliMusteri) return;
  seciliMusteri.sonGoruntuleme = Date.now();
  musteriListesiniKaydet();
  lsSet("weicon_secili_musteri", seciliMusteri);
  // NOT: seciliYetkiliKisi burada ARTIK sıfırlanmıyor — müşteri değiştirildiğinde
  // zaten musteriKartAc() içinde sıfırlanıyor. Burada sıfırlarsak, Ürün Bul
  // ön-kontrol ekranında seçilen yetkili kişi kaybolurdu.
  musteriSeritiGuncelle();
  document.getElementById("musteriKartModal").style.display="none";
  showToast(seciliMusteri.ad+" seçildi — ürün arayın.");
  switchTab(1);
}

function islemBaslatModalAc(){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  document.getElementById("islemBaslatAd").textContent = m.ad||"";
  var bilgiParts = [];
  if(m.sehir) bilgiParts.push(sehirFormatla(m.sehir));
  if(m.vade) bilgiParts.push(m.vade+" vade");
  if(m.yetkili) bilgiParts.push(m.yetkili);
  document.getElementById("islemBaslatBilgi").textContent = bilgiParts.join(" · ");
  islemBaslatAcikSurecGoster(m.ad);
  document.getElementById("islemBaslatModal").style.display="flex";
}

function islemBaslatAcikSurecGoster(musteriAdi){
  var uyariDiv = document.getElementById("islemBaslatAcikSurecUyari");
  if(!uyariDiv) return;
  var enSonBekleyen = musteriAcikSurecKaydiGetir(musteriAdi);
  if(!enSonBekleyen){ uyariDiv.style.display="none"; return; }
  var tipEtiket = {teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA", numune:"NUMUNE"};
  uyariDiv.innerHTML = "<span style='font-size:28px;'>⏳</span> <span style='color:#222;'>Açık süreç bulundu</span>"
    +"<span onclick=\"acikSurecKayitOnizlemeAc()\" style='display:block;color:#ff2d2d;margin:8px 0 4px;text-decoration:underline;cursor:pointer;'>"+enSonBekleyen.tarih+" · "+tipEtiket[enSonBekleyen.tip]+"</span>"
    +"<div style='color:#222;line-height:1.4;'>Henüz siparişe dönmemiş. Aynı süreçten mi devam edeceksiniz?</div>";
  uyariDiv.style.display="block";
}

function islemBaslatSecildi(mod){
  if(musteriKartIdx===null) return;
  musteriListesi = lsGet("weicon_musteriler",[]);
  seciliMusteri = musteriListesi[musteriKartIdx];
  if(!seciliMusteri) return;
  seciliMusteri.sonGoruntuleme = Date.now();
  musteriListesiniKaydet();
  lsSet("weicon_secili_musteri", seciliMusteri);
  seciliYetkiliKisi = null;
  localStorage.removeItem("weicon_secili_yetkili");
  if(typeof yetkiliKisiEtiketGuncelle==="function") yetkiliKisiEtiketGuncelle();
  musteriSeritiGuncelle();
  secilenMod = mod;
  if(typeof islemTuruRenkGuncelle==="function") islemTuruRenkGuncelle();
  document.getElementById("islemBaslatModal").style.display="none";
  showToast(seciliMusteri.ad+" seçildi — "+(ISLEM_TURU_ADI[mod]||mod.toUpperCase())+" için ürün seçin.");
  if(musteriSecimHedefSayfa){
    var hedef = musteriSecimHedefSayfa;
    musteriSecimHedefSayfa = null;
    switchTab(hedef);
  } else {
    switchTab(1);
  }
}

function islemBaslatModalKapat(){
  document.getElementById("islemBaslatModal").style.display="none";
}

function musteriSecimYap(idx){
  if(musteriSecimHedefSayfa === "ziyaretEkleGun"){
    musteriSecimHedefSayfa = null;
    musteriListesi = lsGet("weicon_musteriler",[]);
    if(!musteriListesi[idx]) return;
    musteriKartIdx = idx;
    ziyaretDuzenlenenTs = null;
    ziyaretSeciliTur = "ziyaret";
    ziyaretSeciliFotolar = [];
    ziyaretSeciliKisi = null;
    ziyaretTurSeciciOlustur();
    ziyaretFotoGaleriOlustur();
    ziyaretKisiEtiketGuncelle();
    var pad=function(n){ return n.toString().padStart(2,"0"); };
    var d = new Date(ziyaretEklenecekTs);
    var localVal = d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes());
    document.getElementById("ziyaretTarihSaat").value = localVal;
    document.getElementById("ziyaretNotu").value = "";
    document.getElementById("ziyaretModalBaslik").textContent = "📍 Temas Kaydı — "+musteriListesi[idx].ad;
    var silBtn = document.getElementById("ziyaretSilBtn");
    if(silBtn) silBtn.style.display="none";
    document.getElementById("musteriZiyaretModal").style.display="flex";
    return;
  }
  musteriListesi = lsGet("weicon_musteriler",[]);
  seciliMusteri = musteriListesi[idx];
  if(!seciliMusteri) return;
  seciliMusteri.sonGoruntuleme = Date.now();
  musteriListesiniKaydet();
  lsSet("weicon_secili_musteri", seciliMusteri);
  seciliYetkiliKisi = null;
  localStorage.removeItem("weicon_secili_yetkili");
  if(typeof yetkiliKisiEtiketGuncelle==="function") yetkiliKisiEtiketGuncelle();
  musteriSeritiGuncelle();
  showToast(seciliMusteri.ad+" seçildi!");
  var acikMesaj = musteriAcikSurecMesajGetir(seciliMusteri.ad);
  if(acikMesaj) setTimeout(function(){ showToast(acikMesaj, 5000); }, 900);
  if(musteriSecimHedefSayfa){
    var hedef = musteriSecimHedefSayfa;
    musteriSecimHedefSayfa = null;
    switchTab(hedef);
  } else {
    switchTab(1);
  }
}

function musteriListesiniRenderEt(){
  musteriListesi = lsGet("weicon_musteriler",[]);
  var q = document.getElementById("musteriAramaInput")?document.getElementById("musteriAramaInput").value.trim().toLocaleLowerCase("tr-TR"):"";
  var sehirQ = document.getElementById("musteriSehirAramaInput")?document.getElementById("musteriSehirAramaInput").value.trim().toLocaleLowerCase("tr-TR"):"";
  var c = document.getElementById("musteriListesiDiv");
  var e = document.getElementById("musteriBosMsg");
  if(!c) return;
  c.innerHTML="";

  // Son 10 işlem listesini de güncelle (müşteri filtresinden bağımsız)
  sonIslemleriRenderEt();

  var aramaAktif = !!(q || sehirQ);
  var filtrelenmis = musteriListesi.filter(function(m){
    var isimEsles = !q || m.ad.toLocaleLowerCase("tr-TR").indexOf(q)>=0;
    var sehirEsles = !sehirQ || (m.sehir||"").toLocaleLowerCase("tr-TR").indexOf(sehirQ)>=0;
    return isimEsles && sehirEsles;
  });

  if(filtrelenmis.length===0){ if(e) e.style.display="block"; return; }
  if(e) e.style.display="none";

  var bilgiNotu = "";
  if(aramaAktif){
    // Arama yapılırken tüm eşleşen sonuçlar gösterilir, en son görüntülenen en üstte
    filtrelenmis.sort(function(a,b){
      return (b.sonGoruntuleme||0) - (a.sonGoruntuleme||0);
    });
  } else if(tumMusterilerModuAktif){
    // "Tüm Müşteriler" butonu ile açılan mod: hiçbir sınır yok, alfabetik sırayla tüm müşteriler listelenir (kaydırılabilir).
    filtrelenmis.sort(function(a,b){ return a.ad.localeCompare(b.ad,"tr-TR"); });
    bilgiNotu = "<div style='font-size:20px;color:#0e6b58;font-weight:700;margin-bottom:8px;'>👥 Tüm müşteriler (toplam "+filtrelenmis.length+") — alfabetik sırayla, aşağı kaydırarak görüntüleyin.</div>";
  } else {
    // Arama yokken sadece en son kayıt edilen 12 müşteri gösterilir (yeni kayıtlar listenin başına eklenir).
    // Diğer tüm müşteriler sistemde kayıtlı kalmaya devam eder, sadece bu görünümde listelenmez.
    var toplamSayi = filtrelenmis.length;
    filtrelenmis = filtrelenmis.slice(0, 12);
    if(toplamSayi > 12){
      bilgiNotu = "<div style='font-size:20px;color:#8a97a6;font-weight:700;margin-bottom:8px;'>En son kayıt edilen 12 müşteri gösteriliyor · toplam "+toplamSayi+" müşteri sistemde kayıtlı — aramak için yukarıdaki kutuları kullanın.</div>";
    }
  }

  var satirlar = "";
  for(var i=0;i<filtrelenmis.length;i++){
    var m = filtrelenmis[i];
    var gercekIdx = musteriListesi.indexOf(m);

    // Ziyaret uyarısı
    var ziyaretUyari = "";
    if(m.sonZiyaret){
      var ziyaretGun = Math.floor((Date.now() - m.sonZiyaret) / 86400000);
      if(ziyaretGun > 30) ziyaretUyari = "<div style='margin-top:8px;'><span style='background:#fff3cd;color:#856404;font-size:20px;font-weight:800;padding:5px 14px;border-radius:8px;'>⚠️ "+ziyaretGun+" gün ziyaret yok</span></div>";
      else ziyaretUyari = "<div style='margin-top:8px;'><span style='background:#d4edda;color:#155724;font-size:17px;font-weight:800;padding:5px 14px;border-radius:8px;'>✓ "+ziyaretGun+" gün önce</span></div>";
    }

    // Ana Sayfa/İşlemler kartlarıyla aynı dil: açık degrade zemin + koyu solid
    // kenarlık (WEICON marka lacivert — her müşteri aynı "tür" kayıt olduğu
    // için kategori rengi yerine tutarlı tek marka rengi kullanıyoruz).
    // Kompakt v2 düzen: isim üstte tam satır (uzun firma isimleri rahat sığsın),
    // alt satırda kod solda / ilçe-il sağda — eski 3 satırlık yapıya göre yer kazancı.
    satirlar += "<div onclick=\"musteriKartAc("+gercekIdx+")\" style='cursor:pointer;border-radius:14px;background:linear-gradient(135deg,#f0f7ff,#dbe9f9);border:2.5px solid #3569b8;padding:16px 18px;margin-bottom:12px;'>"
      +"<div style='font-size:26px;font-weight:900;color:#003a70;line-height:1.25;'>"+safeText(m.ad)+"</div>"
      +"<div style='display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-top:8px;'>"
      +(m.id ? "<span style='font-size:19px;font-weight:800;color:#3569b8;letter-spacing:.2px;flex-shrink:0;'>🏷 "+safeText(m.id)+"</span>" : "<span></span>")
      +"<span style='font-size:20px;font-weight:700;color:#5a7ba8;text-align:right;'>"+safeText(sehirFormatla(m.sehir)||"-")+"</span>"
      +"</div>"
      +ziyaretUyari
      +"</div>";
  }

  c.innerHTML = bilgiNotu + satirlar;
}

var sonIslemFiltreTipi = "";

function sonIslemFiltreDegisti(deger){
  sonIslemFiltreTipi = deger;
  sonIslemleriRenderEt();
}

function buAyinHareketToplami(tipKey, kanalFiltre){
  var arsiv = arsivData||{};
  var liste = arsiv[tipKey]||[];
  var aylarKisa = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  var now = new Date();
  var buAyAd = aylarKisa[now.getMonth()];
  var buYil = now.getFullYear().toString();
  var toplam = 0, sayisi = 0;
  for(var i=0;i<liste.length;i++){
    var k = liste[i];
    if(!k.tarih) continue;
    if(kanalFiltre && k.kanal!==kanalFiltre) continue;
    var parca = k.tarih.split(" ");
    var ayAd = parca[1]||""; var yil = parca[2]||"";
    if(ayAd!==buAyAd || yil!==buYil) continue;
    var kEuro=0;
    if(k.urunler) for(var j=0;j<k.urunler.length;j++){ kEuro += k.urunler[j].toplamEuro||0; }
    toplam += kEuro;
    sayisi++;
  }
  return {ayAd:buAyAd, yil:buYil, toplam:toplam, sayisi:sayisi};
}

// Bu ay "kacan" (durum='kacan') olarak işaretlenmiş tüm kayıtların (tip fark
// etmeksizin — SİPARİŞ/TEKLİF/PROFORMA/NUMUNE) toplam kaybedilen tutarı.
function buAyinKacanToplami(){
  var arsiv = arsivData||{};
  var aylarKisa = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  var now = new Date();
  var buAyAd = aylarKisa[now.getMonth()];
  var buYil = now.getFullYear().toString();
  var toplam = 0, sayisi = 0;
  ["siparis","teklif","proforma","numune"].forEach(function(tipKey){
    var liste = arsiv[tipKey]||[];
    for(var i=0;i<liste.length;i++){
      var k = liste[i];
      if(k.durum!=="kacan" || !k.tarih) continue;
      var parca = k.tarih.split(" ");
      var ayAd = parca[1]||""; var yil = parca[2]||"";
      if(ayAd!==buAyAd || yil!==buYil) continue;
      var kEuro=0;
      if(k.urunler) for(var j=0;j<k.urunler.length;j++){ kEuro += k.urunler[j].toplamEuro||0; }
      toplam += kEuro;
      sayisi++;
    }
  });
  return {ayAd:buAyAd, yil:buYil, toplam:toplam, sayisi:sayisi};
}

function sonIslemleriRenderEt(){
  var el = document.getElementById("sonIslemlerDiv");
  if(!el) return;
  var arsivTumVerisi = arsivData || {};
  var tipler = ["numune","teklif","proforma","siparis"];
  var tipEtiket = {numune:"Numune", teklif:"Fiyat Teklif", proforma:"Fatura", siparis:"Sipariş"};
  var tipEtiketBuyuk = {numune:"NUMUNE", teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA FATURA", siparis:"SİPARİŞ"};
  // Arşiv kaydı, oluşturulduğu andaki müşteri ismini SABİT bir metin olarak saklar
  // (kayit.musteri) — müşteri adı SONRADAN değiştirilirse/kısaltılırsa arşivdeki
  // eski kayıtlar hâlâ ESKİ ismi gösterirdi. Şehir'de yaptığımız gibi, kaydın
  // musteriId'si varsa GÜNCEL müşteri adını göstermek için bir harita kuruyoruz.
  var musteriAdMapById = {};
  for(var mi=0;mi<musteriListesi.length;mi++){
    if(musteriListesi[mi].id) musteriAdMapById[musteriListesi[mi].id] = musteriListesi[mi].ad;
  }
  var tumIslemler = [];
  for(var t=0;t<tipler.length;t++){
    if(sonIslemFiltreTipi==="teklif_mail" || sonIslemFiltreTipi==="teklif_whatsapp"){
      if(tipler[t]!=="teklif") continue;
    } else if(sonIslemFiltreTipi==="kacan"){
      // "kacan" tüm türlerde olabilir, tip filtresi uygulanmaz
    } else if(sonIslemFiltreTipi && tipler[t]!==sonIslemFiltreTipi){
      continue;
    }
    var tipListe = (arsivTumVerisi[tipler[t]]||[]);
    for(var k=0;k<tipListe.length;k++){
      var kayit = tipListe[k];
      if(sonIslemFiltreTipi==="teklif_mail" && kayit.kanal!=="mail") continue;
      if(sonIslemFiltreTipi==="teklif_whatsapp" && kayit.kanal!=="whatsapp") continue;
      if(sonIslemFiltreTipi==="kacan" && kayit.durum!=="kacan") continue;
      tumIslemler.push({
        musteri: (kayit.musteriId && musteriAdMapById[kayit.musteriId]) || kayit.musteri || "-",
        musteriId: kayit.musteriId||null,
        tarih: kayit.tarih||"",
        ts: kayit.ts||0,
        tip: tipEtiket[tipler[t]],
        tipKey: tipler[t],
        tipIdx: k,
        kod: kayit.kod,
        kanal: kayit.kanal||null,
        durum: kayit.durum||null,
        kacanSebep: kayit.kacanSebep||null,
        kacanRakip: kayit.kacanRakip||null,
        revizeZamani: kayit.revizeZamani||null,
        bertaKodlari: (kayit.urunler||[]).map(function(u){ return u.berta; }).filter(Boolean)
      });
    }
  }
  tumIslemler.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
  var son10 = tumIslemler; // artık limit yok — tüm kayıtlar listelenir, kutu içeride kaydırılabilir

  var secKutusu = "<select onchange=\"sonIslemFiltreDegisti(this.value)\" style='width:100%;padding:14px 12px;font-size:20px;font-weight:800;border:2.5px solid #3569b8;border-radius:10px;color:#003a70;background:#eef4fb;margin-bottom:14px;'>"
    +"<option value=''"+(sonIslemFiltreTipi===""?" selected":"")+">Tümü</option>"
    +"<option value='siparis'"+(sonIslemFiltreTipi==="siparis"?" selected":"")+">Sipariş</option>"
    +"<option value='teklif'"+(sonIslemFiltreTipi==="teklif"?" selected":"")+">Fiyat Teklifi (Tümü)</option>"
    +"<option value='teklif_mail'"+(sonIslemFiltreTipi==="teklif_mail"?" selected":"")+">📧 Fiyat Teklifi — Mail</option>"
    +"<option value='teklif_whatsapp'"+(sonIslemFiltreTipi==="teklif_whatsapp"?" selected":"")+">💬 Fiyat Teklifi — WhatsApp</option>"
    +"<option value='proforma'"+(sonIslemFiltreTipi==="proforma"?" selected":"")+">Proforma Fatura</option>"
    +"<option value='numune'"+(sonIslemFiltreTipi==="numune"?" selected":"")+">Numune</option>"
    +"<option value='kacan'"+(sonIslemFiltreTipi==="kacan"?" selected":"")+">❌ Kaçan Siparişler</option>"
    +"</select>";

  var toplamKutusu = "";
  if(sonIslemFiltreTipi==="kacan"){
    var kt = buAyinKacanToplami();
    toplamKutusu = "<div style='background:linear-gradient(135deg,#c0392b,#8e2a1f);color:#fff;border-radius:10px;padding:14px 18px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 6px rgba(0,0,0,0.15);'>"
      +"<div style='font-size:18px;font-weight:bold;'>"+kt.ayAd+" "+kt.yil+" · ❌ KAÇAN Toplamı ("+kt.sayisi+")</div>"
      +"<div style='font-size:24px;font-weight:900;white-space:nowrap;'>"+fmt(kt.toplam)+" EUR</div>"
      +"</div>";
  } else if(sonIslemFiltreTipi){
    var kanalFiltreDeger = sonIslemFiltreTipi==="teklif_mail" ? "mail" : (sonIslemFiltreTipi==="teklif_whatsapp" ? "whatsapp" : null);
    var toplamTipKey = (sonIslemFiltreTipi==="teklif_mail"||sonIslemFiltreTipi==="teklif_whatsapp") ? "teklif" : sonIslemFiltreTipi;
    var toplamEtiket = sonIslemFiltreTipi==="teklif_mail" ? "📧 FİYAT TEKLİFİ (MAİL)" : (sonIslemFiltreTipi==="teklif_whatsapp" ? "💬 FİYAT TEKLİFİ (WHATSAPP)" : tipEtiketBuyuk[sonIslemFiltreTipi]);
    var t = buAyinHareketToplami(toplamTipKey, kanalFiltreDeger);
    toplamKutusu = "<div style='background:linear-gradient(135deg,#16a085,#0e7a63);color:#fff;border-radius:10px;padding:14px 18px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 6px rgba(0,0,0,0.15);'>"
      +"<div style='font-size:18px;font-weight:bold;'>"+t.ayAd+" "+t.yil+" · "+toplamEtiket+" Toplamı ("+t.sayisi+")</div>"
      +"<div style='font-size:24px;font-weight:900;white-space:nowrap;'>"+fmt(t.toplam)+" EUR</div>"
      +"</div>";
  }

  if(son10.length===0){
    el.innerHTML = secKutusu + toplamKutusu + "<div style='color:#888;font-size:18px;padding:10px 0;'>Bu filtrede işlem kaydı yok.</div>";
    return;
  }

  // Şehir hücresini "İlçe" (üst) / "İL" (alt, kalın) olarak iki satıra böler.
  // Ham veri "ANKARA-Yenimahalle" gibi boşluksuz ve İL-önce sırayla kayıtlı
  // olabiliyor — bu yüzden basit " - " ayırma yerine sehirFormatla ile aynı
  // mantığı (TUM_ILLER listesinden hangi parça gerçek il, onu buluyoruz) kullanıp
  // istenen sırada (önce ilçe, altta İL) gösteriyoruz.
  // Şehir bilgisini KART tasarımı için tek satırda "İlçe / İL" formatında döner.
  function sehirTekSatir(sehirStr){
    if(!sehirStr || sehirStr==="-") return "-";
    var parcalar = String(sehirStr).split("-").map(function(p){ return p.trim(); }).filter(function(p){ return p.length>0; });
    if(parcalar.length===0) return "-";
    if(parcalar.length===1) return parcalar[0].toLocaleUpperCase("tr-TR");
    var ilIdx = -1;
    for(var i=0;i<parcalar.length;i++){
      if(TUM_ILLER.indexOf(parcalar[i].toLocaleUpperCase("tr-TR"))>=0){ ilIdx = i; break; }
    }
    if(ilIdx===-1) ilIdx = parcalar.length-1;
    var il = parcalar[ilIdx].toLocaleUpperCase("tr-TR");
    var ilce = parcalar.filter(function(p,idx){ return idx!==ilIdx; }).join(" - ");
    return ilce ? (ilce+" / "+il) : il;
  }

  function sehirIkiSatirHtml(sehirStr){
    if(!sehirStr || sehirStr==="-") return "-";
    var parcalar = String(sehirStr).split("-").map(function(p){ return p.trim(); }).filter(function(p){ return p.length>0; });
    if(parcalar.length===0) return "-";
    if(parcalar.length===1) return "<div style='line-height:1.25;'>"+parcalar[0].toLocaleUpperCase("tr-TR")+"</div>";
    var ilIdx = -1;
    for(var i=0;i<parcalar.length;i++){
      if(TUM_ILLER.indexOf(parcalar[i].toLocaleUpperCase("tr-TR"))>=0){ ilIdx = i; break; }
    }
    if(ilIdx===-1) ilIdx = parcalar.length-1;
    var il = parcalar[ilIdx].toLocaleUpperCase("tr-TR");
    var ilce = parcalar.filter(function(p,idx){ return idx!==ilIdx; }).join(" - ");
    return "<div style='line-height:1.3;'>"+ilce+"<br><b>"+il+"</b></div>";
  }

  // ÖNEMLİ: Sadece isme göre eşleştirme yapılırsa, bir müşterinin adı sonradan
  // düzenlenip kısaltıldığında (örn. "Kozanoğlu Kozmaksan Hidrolik Pompa Ve Ara
  // Sansıman..." → "Kozanoğlu Kozmaksan Hidrolik") arşivdeki eski kayıtlar hâlâ
  // ESKİ ismi taşıdığı için eşleşme bozulur ve şehir "-" görünür. Bu yüzden önce
  // müşteri ID'sine göre eşleştiriyoruz (ID isim değişse bile sabit kalır),
  // sadece ID yoksa (çok eski kayıtlarda) isme düşüyoruz.
  var musteriSehirMapById = {};
  var musteriSehirMap = {};
  var musteriListesiKisa = []; // ID de isim de eşleşmezse (çok eski kayıt), kısmi isim eşleştirmesi için
  for(var i=0;i<musteriListesi.length;i++){
    if(musteriListesi[i].id) musteriSehirMapById[musteriListesi[i].id] = musteriListesi[i].sehir||"";
    musteriSehirMap[musteriListesi[i].ad] = musteriListesi[i].sehir||"";
    musteriListesiKisa.push({ad:(musteriListesi[i].ad||"").toLocaleLowerCase("tr-TR"), sehir:musteriListesi[i].sehir||""});
  }

  // BAĞLANTI TESPİTİ: aynı müşteri + en az bir ortak ürün (Berta kodu) paylaşan, bu kayıttan ÖNCEKİ bir kayıt var mı?
  function baglantiBul(idx){
    var kayit = son10[idx];
    for(var j=0;j<son10.length;j++){
      if(j===idx) continue;
      var digeri = son10[j];
      if(digeri.musteri !== kayit.musteri) continue;
      if(digeri.ts >= kayit.ts) continue; // sadece bu kayıttan ÖNCE olanlar
      var ortakUrunVarMi = kayit.bertaKodlari.some(function(b){ return digeri.bertaKodlari.indexOf(b)>=0; });
      if(ortakUrunVarMi) return digeri;
    }
    return null;
  }

  var satirlar = "";
  var birlestirilmisIdxler = {}; // zaten bir "birleşik kart" içinde gösterilmiş kayıtların son10 indeksleri — tekrar ayrı kart olarak basılmasın
  var DONUSUM_ETIKET = {SIP:"SİPARİŞE", TEK:"TEKLİFE", PRO:"PROFORMAYA", NUM:"NUMUNEYE"};

  function tekKartIcerikOlustur(item, sehirDeger){
    var harfX = (item.kod||"").slice(0,3);
    var gerisiX = (item.kod||"").slice(3);
    var renkX = KOD_RENK[harfX] || "#3569b8";
    var sorunluX = item.durum==="iptal" || item.durum==="iade" || item.durum==="kacan";
    var kartRenkX = sorunluX ? "#c0392b" : renkX;
    var kanalOnEkX = item.kanal==="whatsapp" ? "W-" : item.kanal==="mail" ? "M-" : "";
    var durumEkX = "";
    if(item.durum==="iptal") durumEkX = " — 🚫 İPTAL";
    else if(item.durum==="iade") durumEkX = " — ↩️ İADE";
    else if(item.durum==="kacan") durumEkX = " — ❌ KAÇTI"+(item.kacanRakip?" → "+safeText(item.kacanRakip):"");
    if(item.revizeZamani) durumEkX += " — 🔄 REVİZE "+revizeTarihSaatFormatla(item.revizeZamani);
    return {kartRenkX:kartRenkX, html:
      "<div style='display:flex;align-items:baseline;gap:9px;white-space:nowrap;overflow:hidden;margin-bottom:4px;'>"
        +"<span style='font-size:19px;font-weight:900;padding:2px 10px;border-radius:6px;color:#fff;background:"+kartRenkX+";letter-spacing:.2px;flex-shrink:0;'>"+kanalOnEkX+harfX+"</span>"
        +"<span style='font-size:19px;font-weight:700;color:"+kartRenkX+";font-family:monospace;opacity:.75;flex-shrink:0;'>"+gerisiX+"</span>"
        +"<span style='font-size:19px;opacity:.35;flex-shrink:0;'>·</span>"
        +"<span style='font-size:19px;font-weight:800;color:#556170;flex-shrink:0;'>"+tarihKisaltTekSatir(item.tarih)+"</span>"
        +(durumEkX ? "<span style='font-size:17px;font-weight:900;color:#c0392b;overflow:hidden;text-overflow:ellipsis;'>"+durumEkX+"</span>" : "")
      +"</div>"
      +"<div style='display:flex;align-items:baseline;gap:8px;white-space:nowrap;overflow:hidden;'>"
        +(item.musteriId ? "<span style='font-size:20px;font-weight:800;color:"+kartRenkX+";opacity:.85;flex-shrink:0;'>"+safeText(item.musteriId)+"</span>" : "")
        +"<span style='font-size:28px;font-weight:900;color:"+kartRenkX+";overflow:hidden;text-overflow:ellipsis;'>"+safeText(item.musteri)+"</span>"
        +"<span style='font-size:20px;font-weight:700;color:"+kartRenkX+";opacity:.75;flex-shrink:0;margin-left:auto;padding-left:8px;'>"+sehirTekSatir(sehirDeger)+"</span>"
      +"</div>"
    };
  }

  for(var i=0;i<son10.length;i++){
    if(birlestirilmisIdxler[i]) continue; // bu kayıt zaten bir birleşik kartın içinde gösterildi
    var it = son10[i];
    var sehir = "-";
    if(it.musteriId && musteriSehirMapById[it.musteriId]!==undefined){
      sehir = musteriSehirMapById[it.musteriId] || "-";
    } else if(musteriSehirMap[it.musteri]!==undefined){
      sehir = musteriSehirMap[it.musteri] || "-";
    } else {
      // İsim tam eşleşmedi (muhtemelen isim sonradan kısaltıldı/değiştirildi) —
      // biri diğerinin başlangıcı mı diye kısmi eşleştirme dene, son çare.
      var itMusteriKucuk = (it.musteri||"").toLocaleLowerCase("tr-TR");
      for(var q=0;q<musteriListesiKisa.length;q++){
        var adKucuk = musteriListesiKisa[q].ad;
        if(adKucuk && (itMusteriKucuk.indexOf(adKucuk)===0 || adKucuk.indexOf(itMusteriKucuk)===0)){
          sehir = musteriListesiKisa[q].sehir || "-";
          break;
        }
      }
    }
    var bagli = baglantiBul(i);

    // BAĞLANTILI KAYIT: iki kaydı TEK bir kart içinde, "eski hâl (üzeri çizili)
    // → geçiş şeridi → yeni hâl" şeklinde birleştirerek göster (Seçenek A).
    // Böylece "bunlar aslında aynı işin iki durumu" tek bakışta anlaşılır.
    if(bagli){
      var bagliIdx = -1;
      for(var bi=0; bi<son10.length; bi++){ if(son10[bi]===bagli){ bagliIdx=bi; break; } }
      if(bagliIdx>=0) birlestirilmisIdxler[bagliIdx] = true;

      var eskiIcerik = tekKartIcerikOlustur(bagli, sehir);
      var yeniIcerik = tekKartIcerikOlustur(it, sehir);
      var yeniHarf3 = (it.kod||"").slice(0,3);
      var donusumMetni = DONUSUM_ETIKET[yeniHarf3] || "YENİ DURUMA";

      satirlar += "<div style='border-radius:14px;border:3px solid "+yeniIcerik.kartRenkX+";overflow:hidden;margin-bottom:12px;box-shadow:0 3px 10px rgba(0,30,70,.12);'>"
        +"<div onclick=\"sonIslemDetayAc('"+bagli.tipKey+"',"+bagli.tipIdx+")\" style='cursor:pointer;padding:10px 16px;background:linear-gradient(135deg,#f0fbf3,#dceedf);opacity:.7;text-decoration:line-through;text-decoration-color:"+eskiIcerik.kartRenkX+";text-decoration-thickness:2px;'>"+eskiIcerik.html+"</div>"
        +"<div style='background:"+yeniIcerik.kartRenkX+";color:#fff;text-align:center;padding:7px;font-size:15px;font-weight:900;letter-spacing:.3px;'>⬇ "+donusumMetni+" DÖNÜŞTÜ ⬇</div>"
        +"<div onclick=\"sonIslemDetayAc('"+it.tipKey+"',"+it.tipIdx+")\" style='cursor:pointer;padding:10px 16px;background:linear-gradient(135deg,#eef4fb,#dbe9f9);'>"+yeniIcerik.html+"</div>"
        +"</div>";
      continue;
    }

    var harf = (it.kod||"").slice(0,3);
    var gerisi = (it.kod||"").slice(3);
    var renk = KOD_RENK[harf] || "#3569b8";
    var kanalOnEk = it.kanal==="whatsapp" ? "W-" : it.kanal==="mail" ? "M-" : "";

    var sorunluMu = it.durum==="iptal" || it.durum==="iade" || it.durum==="kacan";
    var kartRenk = sorunluMu ? "#c0392b" : renk;
    // Rengin açık degrade zemin karşılığı (Ana Sayfa/Müşteri Kartı ile aynı dil)
    var ZEMIN_ACIK = {"#003a70":"#eef4fb,#dbe9f9","#28a745":"#f0fbf3,#dceedf","#8e44ad":"#f6f0fd,#ece0fa","#b7601f":"#fff6ec,#ffe8d1","#16a085":"#f0fbf3,#dceedf","#c0392b":"#fff1f0,#fbdbd8"};
    var zeminGrad = ZEMIN_ACIK[kartRenk] || "#eef4fb,#dbe9f9";

    // Satır 1'in sonuna eklenecek durum/revize bilgisi (varsa) — kısa
    // metin, gerekirse ellipsis ile kesilir, satır sayısı asla artmaz.
    var durumEk = "";
    if(it.durum==="iptal") durumEk = " — 🚫 İPTAL";
    else if(it.durum==="iade") durumEk = " — ↩️ İADE";
    else if(it.durum==="kacan") durumEk = " — ❌ KAÇTI"+(it.kacanRakip?" → "+safeText(it.kacanRakip):"");
    if(it.revizeZamani) durumEk += " — 🔄 REVİZE "+revizeTarihSaatFormatla(it.revizeZamani);

    // İKİ SATIRLIK sabit düzen — punto boyutları önceki (onaylanmış) ölçülerle
    // birebir aynı, sadece yerleşim sıkıştırıldı. Her iki satır da nowrap +
    // ellipsis ile korunur: içerik ne kadar uzun olursa olsun asla 2 satırı geçmez.
    satirlar += "<div onclick=\"sonIslemDetayAc('"+it.tipKey+"',"+it.tipIdx+")\" style='cursor:pointer;border-radius:12px;background:linear-gradient(135deg,"+zeminGrad+");border:2.5px solid "+kartRenk+";padding:10px 16px;margin-bottom:10px;overflow:hidden;"+(sorunluMu?"opacity:.85;":"")+"'>"
      +"<div style='display:flex;align-items:baseline;gap:9px;white-space:nowrap;overflow:hidden;margin-bottom:4px;'>"
        +"<span style='font-size:19px;font-weight:900;padding:2px 10px;border-radius:6px;color:#fff;background:"+kartRenk+";letter-spacing:.2px;flex-shrink:0;'>"+kanalOnEk+harf+"</span>"
        +"<span style='font-size:19px;font-weight:700;color:"+kartRenk+";font-family:monospace;opacity:.75;flex-shrink:0;'>"+gerisi+"</span>"
        +"<span style='font-size:19px;opacity:.35;flex-shrink:0;'>·</span>"
        +"<span style='font-size:19px;font-weight:800;color:#556170;flex-shrink:0;'>"+tarihKisaltTekSatir(it.tarih)+"</span>"
        +(durumEk ? "<span style='font-size:17px;font-weight:900;color:#c0392b;overflow:hidden;text-overflow:ellipsis;'>"+durumEk+"</span>" : "")
      +"</div>"
      +"<div style='display:flex;align-items:baseline;gap:8px;white-space:nowrap;overflow:hidden;'>"
        +(it.musteriId ? "<span style='font-size:20px;font-weight:800;color:"+kartRenk+";opacity:.85;flex-shrink:0;'>"+safeText(it.musteriId)+"</span>" : "")
        +"<span style='font-size:28px;font-weight:900;color:"+kartRenk+";overflow:hidden;text-overflow:ellipsis;"+(it.durum==="iptal"||it.durum==="iade"?"text-decoration:line-through;":"")+"'>"+safeText(it.musteri)+"</span>"
        +"<span style='font-size:20px;font-weight:700;color:"+kartRenk+";opacity:.75;flex-shrink:0;margin-left:auto;padding-left:8px;'>"+sehirTekSatir(sehir)+"</span>"
      +"</div>"
      +"</div>";
  }
  var html = "<div style='overflow-x:hidden;overflow-y:auto;max-height:65vh;'>"+satirlar+"</div>";
  el.innerHTML = secKutusu + toplamKutusu + html;
}

function sonIslemDetayAc(tip, idx){
  arsivDetayAc(tip, idx);
}

function tamSifirla(){
  basket = [];
  hareketListesi = [];
  aktarilanUrun = null;
  updateBasketCount();
  document.getElementById("aktarilanKart").style.display="none";
  document.getElementById("listeFiyat").value="0";
  document.getElementById("dipFiyat").value="0";
  document.getElementById("iskonto").value="0";
  document.getElementById("adet").value="1";
  hesapla();
  showToast("Yeni işlem için sıfırlandı.");
}

var SAYFA_SIRASI=[7,1,5,6,9];
var SAYFA_ADI={7:"Müşteri",1:"Ürün Bul",5:"SEPET",6:"İstatistik",8:"Ana Sayfa",9:"Ziyaret",10:"Araç KM"};
var SAYFA_IKON={7:"👤",1:"🔍",5:"🛒",6:"📊",8:"🏠",9:"📆",10:"🚗"};

function navTabsGuncelle(){
  var cont=document.getElementById("navTabsContainer");
  if(!cont) return;
  var html="<button class=\"tab-btn"+(activeCurrentPage===8?" active":"")+"\" onclick=\"anaMenuPopupAc()\" style=\"width:100%;border-radius:8px;background:none;color:#556;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;outline:none;filter:none;\"><span style=\"font-size:52px;line-height:1;\">🏠</span><span style=\"font-size:26px;font-weight:900;\">Ana Sayfa</span></button>";
  cont.innerHTML=html;
  // Şu an hangi sayfada olduğumu gösteren şerit (Ana Sayfa'dayken zaten üstteki buton bunu gösterdiği için tekrar etmesin)
  var gosterge=document.getElementById("aktifSayfaGosterge");
  var grid=document.getElementById("ustNavGrid");
  if(gosterge){
    if(activeCurrentPage===8){
      // Ana Sayfa'dayken bu şerit tamamen kaldırılır (sadece Ana Sayfa'ya özel):
      // Geri | Ana Sayfa (tam orta) | Menü şeklinde 3 sütuna geçilir.
      gosterge.style.visibility="hidden";
      gosterge.style.display="none";
      if(grid) grid.style.gridTemplateColumns="1fr auto 1fr";
    } else {
      // Diğer tüm sayfalarda normal 4 eşit sütunlu düzen aynen çalışır.
      gosterge.style.visibility="visible";
      gosterge.style.display="flex";
      gosterge.innerHTML="<span style='font-size:52px;line-height:1;'>"+(SAYFA_IKON[activeCurrentPage]||"📍")+"</span><span style='font-size:26px;font-weight:900;'>"+(SAYFA_ADI[activeCurrentPage]||"")+"</span>";
      if(grid) grid.style.gridTemplateColumns="1fr 1fr 1fr 1fr";
    }
  }
  // Sepet sayaçlarını yeniden doldur (dinamik olarak yeniden oluşturulduğu için)
  if(typeof updateBasketCount==="function") updateBasketCount();
  if(typeof updateHareketSayac==="function") updateHareketSayac();
}

function updateHareketSayac(){
  var sayi = hareketListesi.length;
  var a=document.getElementById("hareketSayacTabA");
  var b=document.getElementById("hareketSayacTabB");
  if(a) a.innerText="("+sayi+")";
  if(b) b.innerText="("+sayi+")";
}

function navigatePage(d){
  var idx=SAYFA_SIRASI.indexOf(activeCurrentPage);
  if(idx===-1) return;
  var yeniIdx=idx+d;
  if(yeniIdx>=0 && yeniIdx<SAYFA_SIRASI.length) switchTab(SAYFA_SIRASI[yeniIdx]);
}

// SAYFA GEÇMİŞİ — Geri tuşu için, hangi sayfalarda gezildiğini sırayla tutar
var sayfaGecmisi = [8];
var geriGidiliyor = false;
var modalYigini = []; // [{id, display}] — açık popup'ları Geri tuşu için sırayla takip eder

function geriGit(){
  // Önce açık popup geçmişi var mı bak — varsa son adımı kapatıp bir önceki adımı
  // (o an başka bir popup tarafından gizlenmiş olsa bile) olduğu gibi geri getirir.
  if(modalYigini.length>0){
    var sonAdim = modalYigini.pop();
    var elSonAdim = document.getElementById(sonAdim.id);
    if(elSonAdim) elSonAdim.style.display = "none";
    while(modalYigini.length>0){
      var oncekiAdim = modalYigini[modalYigini.length-1];
      var elOnceki = document.getElementById(oncekiAdim.id);
      if(elOnceki){
        elOnceki.style.display = oncekiAdim.display || "flex";
        return;
      }
      modalYigini.pop(); // artık DOM'da olmayan bir kayıtsa atla, bir öncekine bak
    }
    return; // popup geçmişi tükendi; bir sonraki Geri'de sayfa geçmişine geçilecek
  }
  if(sayfaGecmisi.length <= 1){ showToast("Geri gidilecek sayfa yok."); return; }
  sayfaGecmisi.pop();
  var onceki = sayfaGecmisi[sayfaGecmisi.length-1];
  geriGidiliyor = true;
  switchTab(onceki);
}

function switchTab(n){
  if(!geriGidiliyor){
    if(sayfaGecmisi[sayfaGecmisi.length-1] !== n){
      sayfaGecmisi.push(n);
      if(sayfaGecmisi.length > 40) sayfaGecmisi.shift();
    }
  }
  geriGidiliyor = false;
  if(n!==7) musteriSecimHedefSayfa = null;
  activeCurrentPage=n;
  navTabsGuncelle();
  var pages=document.querySelectorAll(".content-page");
  for(var i=0;i<pages.length;i++) pages[i].classList.remove("active");
  document.getElementById("page"+n).classList.add("active");
  // Extra action bar
  var extraBar=document.getElementById('extraActionBar');
  extraBar.style.display='none';
  if(n===5){
    extraBar.style.display='flex';
    var btnWhatsappYedek = document.getElementById('btnWhatsappYedek');
    if(btnWhatsappYedek) btnWhatsappYedek.style.display = cihazMobilMi() ? 'none' : 'flex';
    if(typeof islemTuruRenkGuncelle==="function") islemTuruRenkGuncelle();
  }
  if(n===1) performFilter();
  if(n===5){
    renderBasket();
    renderHareket();
    if(seciliMusteri){
      document.getElementById("custNameInput").value = seciliMusteri.ad||"";
      document.getElementById("custSehirInput").value = seciliMusteri.sehir||"";
      document.getElementById("custVadeInput").value = seciliMusteri.vade||"";
      document.getElementById("custFaturaInput").value = seciliMusteri.fatura||"";
      document.getElementById("custYetkiliInput").value = seciliMusteri.yetkili||"";
      document.getElementById("custKargoInput").value = seciliMusteri.kargo||"";
      document.getElementById("custTeslimatAdresiInput").value = seciliMusteri.teslimatAdresi||"";
      document.getElementById("custTeslimatKullanCheckbox").checked = false;
      document.getElementById("custTeslimatAdresiInput").style.display = "none";
    }
    musteriSeritiGuncelle();
    generateCommunicationData();
  }
  if(n===7){
    musteriPanelAc("bul");
  }
  if(n===6){
    document.getElementById("arsivAramaSonucPanel").style.display="none";
    arsivSayaclariGuncelle();
    document.getElementById("arsivBtnPanel").style.display="block";
    document.getElementById("arsivDetayPanel").style.display="none";
    document.getElementById("arsivFaturaPanel").style.display="none";
    document.getElementById("arsivAnaPanel").style.display="none";
    document.getElementById("istatistikPanel").style.display="block";
    istatistikHesapla();
    sonIslemleriRenderEt();
  }
  if(n===8){
    anaSayfaRenderEt();
  }
  if(n===10){
    if(typeof kmTakipSayfasiAc==="function"){
      kmTakipSayfasiAc(window.kmSonrakiHedefGorunum||undefined);
      window.kmSonrakiHedefGorunum = null;
    }
  }
}

function loadCatalogFromMemory(){
  // Önce localStorage'daki varsa göster (hız için)
  var local = localStorage.getItem(STORAGE_KEY);
  if(local){
    try{ globalProductCatalog=JSON.parse(local); performFilter(); }catch(e){}
  }
  // Firebase'den taze yükle + gerçek zamanlı dinle
  var ilkYukleme = true;
  function dinlemeyeBasla(){
    if(!window.fbDinle) return;
    window.fbDinle("/", function(tumData){
      if(!tumData) return;
      var urunler = [];
      if(Array.isArray(tumData)){
        urunler = tumData.filter(function(x){ return x && x.urun; });
      } else if(typeof tumData === "object"){
        var keys = Object.keys(tumData);
        for(var i=0;i<keys.length;i++){
          var k = keys[i];
          if(!isNaN(parseInt(k)) && tumData[k] && tumData[k].urun){
            urunler.push(tumData[k]);
          }
        }
      }
      if(urunler.length > 0){
        globalProductCatalog = urunler;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(urunler));
        performFilter();
        if(!ilkYukleme) showToast(urunler.length+" ürün listesi güncellendi ✓");
      }
      ilkYukleme = false;
    });
  }
  if(window.firebaseHazir){
    dinlemeyeBasla();
  } else {
    window.addEventListener("firebaseHazir", dinlemeyeBasla);
  }
}

function processJsonUpload(event){
  var file=event.target.files[0]; if(!file) return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var p=JSON.parse(e.target.result);
      if(Array.isArray(p)){
        if(p.length===0){ showToast("Hata: Dosya boş."); return; }
        // Basit şema kontrolü: ürün alanlarından hiç değilse biri her satırda olmalı
        var gecerliSayisi=0;
        for(var qi=0;qi<p.length;qi++){
          var it=p[qi];
          var adVar = it && (it.name||it.NAME||it.urun||it.URUN);
          var fiyatVar = it && (it.fiyat!==undefined||it.price!==undefined||it.PRICE!==undefined||it.euro!==undefined||it.Euro!==undefined);
          if(adVar && fiyatVar) gecerliSayisi++;
        }
        if(gecerliSayisi===0){
          showToast("Hata: Dosyada ürün adı/fiyat alanları tanınamadı. Format hatalı olabilir.", 5000);
          return;
        }
        if(gecerliSayisi < p.length){
          showToast("Uyarı: "+p.length+" satırdan "+(p.length-gecerliSayisi)+" tanesi eksik alanlı, yine de yüklendi.", 5000);
        }
        globalProductCatalog=p;
        localStorage.setItem(STORAGE_KEY,JSON.stringify(p));
        performFilter();
        urunListesiniFirebaseGonder(p);
        var vModal = document.getElementById("veriYonetimiModal");
        if(vModal) vModal.style.display="none";
        showToast(gecerliSayisi+" ürün başarıyla yüklendi.", 3000);
        if(typeof switchTab==="function") switchTab(1);
      } else { showToast("Hata: Geçersiz JSON."); }
    }catch(err){ showToast("JSON okunamadı: "+err.message); }
  };
  reader.readAsText(file);
  // Aynı dosyayı tekrar seçebilmek için sıfırla
  event.target.value="";
}

function urunListesiniFirebaseGonder(p){
  if(!window.fbGet || !window.fbUpdate){
    showToast(p.length+" ürün yüklendi! (yalnızca bu cihazda)");
    return;
  }
  // Kök dizinde eski ürün index'lerini bulup temizle, musteriler/arsiv'e dokunma
  window.fbGet("/").then(function(kok){
    var updates = {};
    if(kok && typeof kok === "object" && !Array.isArray(kok)){
      var keys = Object.keys(kok);
      for(var i=0;i<keys.length;i++){
        var k = keys[i];
        if(!isNaN(parseInt(k)) && kok[k] && kok[k].urun !== undefined){
          updates[k] = null; // eski ürün kaydını sil
        }
      }
    } else if(Array.isArray(kok)){
      for(var i=0;i<kok.length;i++){ updates[i] = null; }
    }
    // Yeni ürünleri yaz
    for(var j=0;j<p.length;j++){ updates[j] = p[j]; }
    window.fbUpdate(updates).then(function(){
      showToast(p.length+" ürün yüklendi ve Firebase'e kaydedildi ✓");
    }).catch(function(){
      showToast(p.length+" ürün yüklendi! (Firebase'e gönderilemedi)");
    });
  }).catch(function(){
    showToast(p.length+" ürün yüklendi! (Firebase'e gönderilemedi)");
  });
}

function performFilter(){
  var q=document.getElementById("searchInput").value.trim().toLocaleLowerCase("tr-TR");
  var orijinalQ=document.getElementById("searchInput").value.trim();
  // Arama geçmişine kaydet
  if(orijinalQ.length >= 2) aramaGecmisiKaydet(orijinalQ);
  aramaGecmisiniGoster();
  sonKullanilanUrunleriGoster();
  var kelimeler=q.split(/\s+/).filter(function(k){ return k.length>0; });
  var tb=document.getElementById("productTableBody");
  var ph=document.getElementById("noDataPlaceholder");
  tb.innerHTML="";
  if(!globalProductCatalog||globalProductCatalog.length===0){ ph.style.display="block"; return; }
  var m=[];
  for(var i=0;i<globalProductCatalog.length;i++){
    var item=globalProductCatalog[i];
    var b=(item.berta||item.BERTA||"").toString().toLocaleLowerCase("tr-TR");
    var a=(item.abas||item.ABAS||"").toString().toLocaleLowerCase("tr-TR");
    var nn=(item.name||item.NAME||item.urun||item.URUN||"").toString().toLocaleLowerCase("tr-TR");
    var araMetin=b+" "+a+" "+nn;
    if(kelimeler.length===0){ m.push({item:item, catalogIdx:i}); continue; }
    var eslesme=true;
    for(var k=0;k<kelimeler.length;k++){
      if(araMetin.indexOf(kelimeler[k])<0){ eslesme=false; break; }
    }
    if(eslesme) m.push({item:item, catalogIdx:i});
  }
  if(m.length===0){ ph.style.display="block"; return; }
  ph.style.display="none";
  var htmlEsc = function(s){ return String(s==null?"":s).replace(/[\r\n\t]+/g," ").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); };
  var jsAttrEsc = function(s){ return String(s==null?"":s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\r\n|\r|\n/g,"\\n").replace(/\t/g,"\\t"); };
  for(var i=0;i<m.length;i++){
    var item=m[i].item;
    var bt=item.berta||item.BERTA||"";
    var at=item.abas||item.ABAS||"";
    var nt=item.name||item.NAME||item.urun||item.URUN||"";
    if(bt.toString().toLowerCase()==="nan") bt="";
    if(at.toString().toLowerCase()==="nan") at="";
    if(nt.toString().toLowerCase()==="nan") nt="";
    var pt = (item.fiyat!==undefined) ? item.fiyat :
             (item.price!==undefined) ? item.price :
             (item.PRICE!==undefined) ? item.PRICE :
             (item.euro!==undefined)  ? item.euro  :
             (item.Euro!==undefined)  ? item.Euro  : 0;
    var cp=0;
    if(pt!==null && pt!==undefined && pt!==""){
      var pf=parseFloat(String(pt).replace(",","."));
      if(!isNaN(pf)) cp=pf;
    }
    // ÖNEMLİ: id artık kataloğun benzersiz global index'inden üretiliyor (p+catalogIdx).
    // Eskiden berta/abas kodu kullanılıyordu; katalogda mükerrer kod varsa farklı
    // ürünler aynı id'yi paylaşıp sepette birbirinin yerine geçiyordu (toplu iskonto bug'ı).
    var id="p"+m[i].catalogIdx;
    var domId=id.toString().replace(/\s+/g,"-");
    var inBasket=false;
    for(var j=0;j<basket.length;j++){ if(basket[j].id===id){ inBasket=true; break; } }
    var tr=document.createElement("tr");
    var jsAttrNt = jsAttrEsc(nt);
    var jsAttrAt = jsAttrEsc(at);
    tr.innerHTML="<td class=\"product-cell\" oncontextmenu=\"return false;\" onmousedown=\"uzunBasiBaslat(function(){urunAdiniWeiconDaAra('"+jsAttrNt+"','"+jsAttrAt+"')})\" onmouseup=\"uzunBasiBitir()\" onmouseleave=\"uzunBasiBitir()\" ontouchstart=\"uzunBasiBaslat(function(){urunAdiniWeiconDaAra('"+jsAttrNt+"','"+jsAttrAt+"')})\" ontouchend=\"uzunBasiBitir()\" ontouchmove=\"uzunBasiBitir()\" style=\"-webkit-user-select:none;user-select:none;\"><div class=\"tablo-kod\"><span class=\"tablo-kod-b\">Berta:</span> "+htmlEsc(bt||"-")+" <span class=\"tablo-kod-a\">- Abas:</span> "+htmlEsc(at||"-")+"</div><div class=\"urun-adi\">"+htmlEsc(nt)+"</div></td>"
      +"<td><span class=\"tablo-fiyat\">"+cp.toFixed(2)+" EUR</span></td>"
      +"<td><button class=\"btn-add"+(inBasket?" added":"")+"\" id=\"addbtn-"+domId+"\" onclick=\"addToBasket(this,'"+jsAttrEsc(id)+"','"+jsAttrEsc(nt)+"',"+cp+",'"+jsAttrEsc(bt)+"','"+jsAttrEsc(at)+"')\">"+(inBasket?"EKLENDI":"Seç")+"</button></td>";
    tb.appendChild(tr);
  }
}

function addToBasket(btn,id,name,price,berta,abas){
  var mevcutIdx = -1;
  for(var i=0;i<basket.length;i++){
    if(basket[i].id===id){ mevcutIdx = i; break; }
  }
  if(mevcutIdx !== -1){
    // Zaten sepette — "EKLENDİ"ye tekrar dokunulunca seçim iptal olur, sepetten çıkar
    basket.splice(mevcutIdx, 1);
    updateBasketCount();
    btn.classList.remove("added"); btn.innerText="Seç";
    showToast(name+" sepetten çıkarıldı.");
    return;
  }
  basket.push({id:id,name:name,price:safeNumber(price,0),berta:berta,abas:abas,quantity:1});
  updateBasketCount();
  btn.classList.add("added"); btn.innerText="EKLENDI";
  showToast(name+" sepete eklendi.");
  sonKullanilanKaydet(id,name,safeNumber(price,0),berta,abas);
  // Arama kutusunu ve sonuç listesini sıfırla, bir sonraki ürünü hemen aramaya başlayabilsin
  var arama = document.getElementById("searchInput");
  if(arama){
    arama.value = "";
    performFilter();
    arama.focus();
  }
}

function updateBasketCount(){
  var total=0;
  for(var i=0;i<basket.length;i++) total+=basket[i].quantity;
  var sepetEl = document.getElementById("sepetSayac");
  if(sepetEl) sepetEl.innerText=total;
  var tabSayac = document.getElementById("sepetSayacTab");
  if(tabSayac) tabSayac.innerText="("+total+")";
  var tabSayac2 = document.getElementById("sepetSayacTab2");
  if(tabSayac2) tabSayac2.innerText="("+total+")";
  var urunBulSayac = document.getElementById("urunBulSepetSayac");
  if(urunBulSayac) urunBulSayac.innerText=total;
  var toplamBoxSayac = document.getElementById("sepetSayacToplamBox");
  if(toplamBoxSayac) toplamBoxSayac.innerText=total;
}

function removeFromBasket(id){
  var newb=[];
  for(var i=0;i<basket.length;i++) if(basket[i].id!==id) newb.push(basket[i]);
  basket=newb;
  // Aynı ürün Hareket (Sepet) listesine de aktarılmışsa oradan da kaldır
  var hareketDegisti=false;
  for(var h=hareketListesi.length-1;h>=0;h--){
    if(hareketListesi[h].id===id){ hareketListesi.splice(h,1); hareketDegisti=true; }
  }
  if(aktarilanUrun && aktarilanUrun.id===id) aktarilanUrun=null;
  updateBasketCount(); renderBasket();
  if(hareketDegisti && typeof renderHareket==="function") renderHareket();
  showToast("Ürün sepetten silindi.");
}

// SEPET FİYAT GEÇMİŞİ UYARISI — sepetteki ürünlerden hangileri bu müşteriye daha önce satılmış/teklif edilmiş
var sepetFiyatGecmisiKapatildi = false;

function sepetFiyatGecmisiUyariKapat(){
  sepetFiyatGecmisiKapatildi = true;
  var div = document.getElementById("sepetFiyatGecmisiUyari");
  if(div) div.style.display = "none";
}

function sepetFiyatGecmisiUyariGuncelle(){
  var div = document.getElementById("sepetFiyatGecmisiUyari");
  if(!div) return;

  var tumUrunler = [];
  for(var i=0;i<hareketListesi.length;i++) tumUrunler.push(hareketListesi[i]);
  for(var j=0;j<basket.length;j++){
    var varMi = hareketListesi.some(function(h){ return h.id===basket[j].id; });
    if(!varMi) tumUrunler.push(basket[j]);
  }
  if(tumUrunler.length===0){
    div.style.display="none";
    sepetFiyatGecmisiKapatildi = false; // sepet boşalınca uyarı tekrar aktif olabilir
    return;
  }

  if(sepetFiyatGecmisiKapatildi){ div.style.display="none"; return; }
  if(!seciliMusteri || !seciliMusteri.ad){ div.style.display="none"; return; }

  var tipEtiket = {teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA", siparis:"SİPARİŞ"};
  var satirlar = "";
  for(var k=0;k<tumUrunler.length;k++){
    var urun = tumUrunler[k];
    var gecmis = musteriUrunFiyatGecmisiBul(seciliMusteri.ad, urun.id);
    if(!gecmis) continue;
    satirlar += "<div style='padding:10px 0;border-top:1px solid #f0d9a0;font-size:30px;color:#222;line-height:1.5;'>"
      +"<b>"+(urun.name||"")+"</b><br>"
      +"<span style='color:#ff2d2d;font-weight:900;'>"+gecmis.tarih+" · "+(tipEtiket[gecmis.tip]||gecmis.tip)+"</span> ile <b>"+fmt(gecmis.price)+" €</b>'ya işlem yapılmış."
      +"</div>";
  }
  if(!satirlar){ div.style.display="none"; return; }
  document.getElementById("sepetFiyatGecmisiUyariIcerik").innerHTML = satirlar;
  div.style.display="block";
}

// TABLO KAYDIRMA İKAZI — tablo yatayda sığmıyorsa sağda titreşen ok gösterir, sona kaydırılınca kaybolur
function hareketTabloKaydirmaKontrol(){
  var wrap = document.getElementById("hareketTabloWrap");
  var ikaz = document.getElementById("hareketTabloKaydirmaIkaz");
  if(!wrap || !ikaz) return;
  var tasiyorMu = wrap.scrollWidth > wrap.clientWidth + 2;
  var sonaGeldiMi = wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 2;
  ikaz.style.display = (tasiyorMu && !sonaGeldiMi) ? "flex" : "none";
}

function renderBirlesikTablo(){
  var c=document.getElementById("hareketTabloBody");
  var wrap=document.getElementById("hareketTabloWrap");
  var e=document.getElementById("emptyBasketMsg");
  var tb=document.getElementById("hareketToplamBox");
  var btnFatura=document.getElementById("btnFaturaOnizleme");
  if(!c) return;
  c.innerHTML="";

  // Hareket listesinde henüz olmayan (bekleyen) sepet ürünlerini bul
  var bekleyenler=[];
  for(var i=0;i<basket.length;i++){
    var b=basket[i];
    var varMi=false;
    for(var j=0;j<hareketListesi.length;j++){ if(hareketListesi[j].id===b.id){ varMi=true; break; } }
    if(!varMi) bekleyenler.push(b);
  }

  if(hareketListesi.length===0 && bekleyenler.length===0){
    if(e) e.style.display="block";
    if(wrap) wrap.style.display="none";
    if(tb) tb.style.display="none";
    if(btnFatura) btnFatura.style.display="none";
    if(typeof updateHareketSayac==="function") updateHareketSayac();
    sepetFiyatGecmisiUyariGuncelle();
    return;
  }
  if(e) e.style.display="none";
  if(wrap) wrap.style.display="block";

  // Önce HESAPLANDI (koyu yeşil) grup başlığı + satırlar
  var gtEuro=0;
  if(hareketListesi.length>0){
    var grupBasHesaplandi=document.createElement("tr");
    grupBasHesaplandi.innerHTML="<td colspan='7' style='background:#003a70;color:#fff;font-weight:900;font-size:20px;text-align:left;padding:10px 14px;letter-spacing:0.3px;'>✅ HESAPLANDI ("+hareketListesi.length+")</td>";
    c.appendChild(grupBasHesaplandi);
  }
  for(var k=0;k<hareketListesi.length;k++){
    var item=hareketListesi[k];
    gtEuro+=item.toplamEuro;
    var tr=document.createElement("tr");
    tr.style.cursor="pointer";
    tr.style.background = item.elleEklendi ? "#fdeecb" : "#b8ecc9";
    tr.onclick=(function(idx){ return function(){ hareketUrunModalAc(idx); }; })(k);
    var elleEtiket = item.elleEklendi ? "<span style='display:inline-block;background:#f2994a;color:#fff;font-size:11px;font-weight:900;padding:2px 8px;border-radius:10px;margin-bottom:3px;letter-spacing:.2px;'>ELLE</span><br>" : "";
    var elleNotEsc = (item.not||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    var toplamHucre;
    if(item.elleEklendi && elleNotEsc){
      toplamHucre = item.toplamEuro>0
        ? "<div style='font-size:12px;color:#b08040;text-decoration:line-through;'>"+fmt(item.toplamEuro)+" €</div><div style='color:#a85d00;font-weight:900;font-size:15px;'>🎁 "+elleNotEsc+"</div>"
        : "<div style='color:#a85d00;font-weight:900;font-size:16px;'>🎁 "+elleNotEsc+"</div>";
    } else {
      toplamHucre = fmt(item.toplamEuro)+" €";
    }
    tr.innerHTML="<td style='text-align:center;padding:8px 2px;'><span class='durum-rozet durum-hesaplandi' title='Hesaplandı'>+</span></td>"
      +"<td style='text-align:center;'>"+(item.elleEklendi ? "" : "<div style='font-size:20px;font-weight:900;color:#222;white-space:nowrap;'><span style=\"color:#c0392b;\">B:</span> "+(item.berta||"-")+" <span style=\"color:#003a70;\">- A:</span> "+(item.abas||"-")+"</div>")+"<div class='ht-urun-ad' style='margin-top:4px;text-align:center;'>"+elleEtiket+item.name+"</div></td>"
      +"<td style='text-align:center;white-space:nowrap;'>"+item.adet+"</td>"
      +"<td style='text-align:center;white-space:nowrap;' class='ht-birim'>"+fmt(item.listeFiyat)+" €</td>"
      +"<td style='text-align:center;white-space:nowrap;'><span class='ht-iskonto-rozet'>%"+item.iskonto+"</span></td>"
      +"<td style='text-align:center;white-space:nowrap;'>"+fmt(item.iskBirim)+" €</td>"
      +"<td style='text-align:center;white-space:nowrap;' class='ht-tutar'>"+toplamHucre+"</td>";
    c.appendChild(tr);
  }
  // Sonra HESAPLANACAK (sarı/bekleyen) grup başlığı + satırlar
  if(bekleyenler.length>0){
    var grupBasBekleyen=document.createElement("tr");
    grupBasBekleyen.innerHTML="<td colspan='7' style='background:#6fcf97;color:#0c3d24;font-weight:900;font-size:20px;text-align:left;padding:10px 14px;letter-spacing:0.3px;'>⏳ HESAPLANACAK ("+bekleyenler.length+")</td>";
    c.appendChild(grupBasBekleyen);
  }
  for(var m=0;m<bekleyenler.length;m++){
    var bItem=bekleyenler[m];
    var safeId=bItem.id.toString().replace(/'/g,"&#39;");
    var safeName=bItem.name.replace(/'/g,"&#39;");
    var tr2=document.createElement("tr");
    tr2.style.cursor="pointer";
    tr2.style.background="#e7f8ee";
    tr2.onclick=(function(id,name,price,berta,abas){ return function(){ sepetBekleyenModalAc(id,name,price,berta,abas); }; })(safeId,safeName,bItem.price,bItem.berta,bItem.abas);
    tr2.innerHTML="<td style='text-align:center;padding:8px 2px;'></td>"
      +"<td style='text-align:center;'><div style='font-size:20px;font-weight:900;color:#222;white-space:nowrap;'><span style=\"color:#c0392b;\">B:</span> "+(bItem.berta||"-")+" <span style=\"color:#003a70;\">- A:</span> "+(bItem.abas||"-")+"</div><div class='ht-urun-ad' style='margin-top:4px;text-align:center;'>"+bItem.name+"</div></td>"
      +"<td style='text-align:center;white-space:nowrap;'>1</td>"
      +"<td style='text-align:center;white-space:nowrap;' class='ht-birim'>"+fmt(bItem.price)+" €</td>"
      +"<td style='text-align:center;white-space:nowrap;color:#bbb;'>-</td>"
      +"<td style='text-align:center;white-space:nowrap;color:#bbb;'>-</td>"
      +"<td style='text-align:center;white-space:nowrap;color:#bbb;'>-</td>";
    c.appendChild(tr2);
  }

  if(tb){
    tb.style.display = "flex";
    var toplamEl=document.getElementById("hareketToplamEuro");
    if(toplamEl) toplamEl.textContent=fmt(gtEuro)+" EUR";
    var sayacEl=document.getElementById("hesaplananUrunSayisi");
    if(sayacEl) sayacEl.textContent=hareketListesi.length;
  }
  if(btnFatura) btnFatura.style.display = hareketListesi.length>0 ? "flex" : "none";
  if(typeof updateHareketSayac==="function") updateHareketSayac();
  sepetFiyatGecmisiUyariGuncelle();
  setTimeout(hareketTabloKaydirmaKontrol, 50);
}
function renderBasket(){ renderBirlesikTablo(); }
function renderHareket(){ renderBirlesikTablo(); }

function anaMenuPopupAc(){
  if(hareketListesi.length>0 && seciliMusteri && seciliMusteri.ad){
    yarimKalanIslemUyariGoster();
    return;
  }
  switchTab(8);
}

function yarimKalanIslemUyariGoster(){
  document.getElementById("yarimKalanIslemMusteriAd").textContent = seciliMusteri.ad;
  document.getElementById("yarimKalanIslemModal").style.display="flex";
}

function yarimKalanIslemDevamEt(){
  document.getElementById("yarimKalanIslemModal").style.display="none";
  switchTab(5);
}

function yarimKalanIslemIptalEt(){
  document.getElementById("yarimKalanIslemModal").style.display="none";
  hareketListesi = [];
  seciliMusteri = null;
  localStorage.removeItem("weicon_secili_musteri");
  if(typeof renderBirlesikTablo==="function") renderBirlesikTablo();
  if(typeof updateBasketCount==="function") updateBasketCount();
  if(typeof musteriSeritiGuncelle==="function") musteriSeritiGuncelle();
  switchTab(8);
}

var islemTuruSeciminSonrasiAksiyon = null; // 'iletisim' | 'gonderimOnay' | 'kaydet' | null

function iletisimIslemleriPopupAc(){
  if(hareketListesi.length===0){
    hareketBosUyariGoster();
    return;
  }
  if(!secilenMod){
    showToast("⚠️ İşlem türü seçilmedi. Önce Numune / Fiyat Teklifi / Proforma / Sipariş seçin.", 4000);
    islemTuruSeciminSonrasiAksiyon = 'iletisim';
    if(typeof islemTuruModalAc==="function") islemTuruModalAc();
    return;
  }
  var uyarilar = hareketAnomaliKontrolEt();
  if(uyarilar.length > 0){
    anomaliUyariPopupGoster(uyarilar, 'gonder');
    return;
  }
  document.getElementById("fiyatGorunumuModal").style.display="flex";
}

function fiyatGorunumuSec(secim){
  gonderimFiyatGorunumu = secim; // "iskontolu" | "net"
  document.getElementById("fiyatGorunumuModal").style.display="none";
  document.getElementById("iletisimIslemleriModal").style.display="flex";
}

// Mail/WhatsApp göndermeden, doğrudan arşive kaydetmek için — Gönder ile
// aynı ön kontrolleri (boş sepet, işlem türü seçilmedi, anomali) uygular.
function hesaplaKaydetTikla(){
  if(hareketListesi.length===0){
    hareketBosUyariGoster();
    return;
  }
  if(!secilenMod){
    showToast("⚠️ İşlem türü seçilmedi. Önce Numune / Fiyat Teklifi / Proforma / Sipariş seçin.", 4000);
    islemTuruSeciminSonrasiAksiyon = 'kaydet';
    if(typeof islemTuruModalAc==="function") islemTuruModalAc();
    return;
  }
  var uyarilar = hareketAnomaliKontrolEt();
  if(uyarilar.length > 0){
    anomaliUyariPopupGoster(uyarilar, 'kaydet');
    return;
  }
  kaydetOnayPopupAc();
}

// Kaydet öncesi son bir onay — yanlışlıkla tek dokunuşla kayıt gitmesin diye.
function kaydetOnayPopupAc(){
  var toplam = 0, toplamAdet = 0;
  hareketListesi.forEach(function(it){ toplam += it.toplamEuro||0; toplamAdet += it.adet||0; });
  var ad = (typeof getDynamicCustomerName==="function") ? getDynamicCustomerName() : "-";
  document.getElementById("kaydetOnayIcerik").innerHTML =
    "<div style='font-size:22px;font-weight:800;color:#222;margin-bottom:12px;'>"+ad+"</div>"
    +"<div style='display:flex;justify-content:space-between;align-items:center;font-size:20px;color:#555;padding:10px 0;border-top:1px solid #eee;'><span>Ürün Çeşidi (kalem)</span><span style='font-weight:900;color:#003a70;'>"+hareketListesi.length+"</span></div>"
    +"<div style='display:flex;justify-content:space-between;align-items:center;font-size:20px;color:#555;padding:10px 0;border-top:1px solid #eee;'><span>Toplam Adet</span><span style='font-weight:900;color:#003a70;'>"+toplamAdet+"</span></div>"
    +"<div style='display:flex;justify-content:space-between;align-items:center;font-size:20px;color:#555;padding:10px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;margin-bottom:12px;'><span>Genel Toplam</span><span style='font-weight:900;color:#16a085;font-size:26px;'>"+fmt(toplam)+" €</span></div>";
  document.getElementById("kaydetOnayModal").style.display="flex";
}
function kaydetOnayModalKapat(){
  document.getElementById("kaydetOnayModal").style.display="none";
}
function kaydetOnayla(){
  kaydetOnayModalKapat();
  arsiveKaydet();
}

// ============================================================
// ANOMALİ KONTROLÜ — Gönder'e basmadan önce kural tabanlı, anında,
// internetsiz kontrol: aşırı iskonto, zararına satış, son 7 günde
// aynı müşteriye aynı ürün tekrarı, alışılmadık yüksek adet.
// ============================================================
function hareketAnomaliKontrolEt(){
  var uyarilar = [];
  var musteriAdi = (seciliMusteri && seciliMusteri.ad) ? seciliMusteri.ad : "";
  var simdi = Date.now();
  var yediGun = 7*24*60*60*1000;
  var arsiv = lsGet("weicon_arsiv", {});

  for(var i=0;i<hareketListesi.length;i++){
    var item = hareketListesi[i];

    if(item.iskonto && item.iskonto > 50){
      uyarilar.push("⚠️ <b>"+item.name+"</b> için iskonto %"+item.iskonto+" — çok yüksek görünüyor.");
    }

    if(item.dipFiyat && item.iskBirim!==undefined && item.iskBirim < item.dipFiyat){
      uyarilar.push("🔴 <b>"+item.name+"</b> dip maliyetin ("+fmt(item.dipFiyat)+" €) altında satılıyor (net: "+fmt(item.iskBirim)+" €) — zararına satış olabilir.");
    }

    if(musteriAdi){
      var tekrarVar = false;
      ["numune","teklif","proforma","siparis"].forEach(function(tip){
        var liste = arsiv[tip] || [];
        for(var j=0;j<liste.length;j++){
          var k = liste[j];
          if(!k.musteri || k.musteri.toLocaleLowerCase("tr-TR")!==musteriAdi.toLocaleLowerCase("tr-TR")) continue;
          if((simdi - (k.ts||0)) > yediGun) continue;
          (k.urunler||[]).forEach(function(u){
            if(u.berta===item.berta && u.abas===item.abas) tekrarVar = true;
          });
        }
      });
      if(tekrarVar){
        uyarilar.push("🔁 <b>"+item.name+"</b> bu müşteriye son 7 gün içinde zaten satılmış/teklif edilmiş — mükerrer olabilir.");
      }
    }

    if(item.adet && item.adet > 100){
      uyarilar.push("📦 <b>"+item.name+"</b> için adet ("+item.adet+") alışılmadık derecede yüksek — kontrol edin.");
    }
  }
  return uyarilar;
}

var anomaliUyariKaynagi = null; // 'gonder' | 'kaydet' — "Yine de..." tuşuna basınca doğru akışa devam etmek için
function anomaliUyariPopupGoster(uyarilar, kaynak){
  anomaliUyariKaynagi = kaynak || 'gonder';
  var liste = "";
  for(var i=0;i<uyarilar.length;i++){
    liste += "<div style='background:#fff3cd;border:2px solid #f2994a;border-radius:8px;padding:14px 16px;margin-bottom:10px;font-size:24px;color:#7a5210;font-weight:700;line-height:1.4;'>"+uyarilar[i]+"</div>";
  }
  document.getElementById("anomaliUyariIcerik").innerHTML = liste;
  var btn = document.getElementById("anomaliYineDeBtn");
  if(btn) btn.textContent = (anomaliUyariKaynagi==='kaydet') ? "Yine de Kaydet" : "Yine de Gönder";
  document.getElementById("anomaliUyariModal").style.display = "flex";
}

function anomaliUyariGormezdenGel(){
  document.getElementById("anomaliUyariModal").style.display = "none";
  if(anomaliUyariKaynagi==='kaydet'){
    kaydetOnayPopupAc();
  } else {
    document.getElementById("fiyatGorunumuModal").style.display = "flex";
  }
  anomaliUyariKaynagi = null;
}

function anomaliUyariGeriDon(){
  document.getElementById("anomaliUyariModal").style.display = "none";
}

function anomaliUyariKapat(){
  document.getElementById("anomaliUyariModal").style.display = "none";
  anomaliUyariKaynagi = null;
}

// ============================================================
// DERİN AI ANALİZİ — kural tabanlı kontrolün ötesinde, Gemini'ye
// "bu işlem ticari açıdan normal mi?" diye sorar. Sadece istenirse
// çalışır (otomatik değil), Cloudflare Worker kurulumu gerektirir.
// ============================================================
function anomaliDerinAnalizIste(){
  var workerUrl = WEICON_AI_WORKER_URL;
  var sonucEl = document.getElementById("anomaliDerinAnalizSonuc");
  if(!workerUrl){
    sonucEl.style.display = "block";
    sonucEl.style.background = "#fdeceb";
    sonucEl.style.color = "#c0392b";
    sonucEl.innerHTML = "⚠️ Bu özellik henüz kurulmadı (WEICON_AI_WORKER_URL boş). Kurulum rehberine bakın.";
    return;
  }
  sonucEl.style.display = "block";
  sonucEl.style.background = "#eef4fb";
  sonucEl.style.color = "#003a70";
  sonucEl.innerHTML = "⏳ Gemini analiz ediyor, lütfen bekleyin...";

  var musteriAdi = (seciliMusteri && seciliMusteri.ad) ? seciliMusteri.ad : "-";
  var urunlerOzet = hareketListesi.map(function(item){
    return {name:item.name, adet:item.adet, listeFiyat:item.listeFiyat, iskonto:item.iskonto, iskBirim:item.iskBirim};
  });

  fetch(workerUrl, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({action:"anomaliAnaliz", musteri: musteriAdi, urunler: urunlerOzet})
  })
  .then(function(r){
    if(!r.ok) throw new Error("Sunucu hatası ("+r.status+")");
    return r.json();
  })
  .then(function(data){
    if(data.error) throw new Error(data.error);
    sonucEl.style.background = "#e7f8ee";
    sonucEl.style.color = "#0e7c63";
    var guvenliMetin = (data.analiz||"Analiz alınamadı.").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    sonucEl.innerHTML = "🤖 <b>Gemini Analizi:</b><br>"+guvenliMetin.replace(/\n/g,"<br>");
  })
  .catch(function(err){
    sonucEl.style.background = "#fdeceb";
    sonucEl.style.color = "#c0392b";
    sonucEl.innerHTML = "⚠️ Analiz alınamadı: "+err.message;
  });
}

// Elle ürün ekleme ekranındaki 3 hızlı-not çipinden birine basılınca: metni
// otomatik olarak not kutusuna yazar ve SADECE basılan çipi görsel olarak
// seçili gösterir (diğerleri normale döner). Kullanıcı isterse üzerine kendi
// notunu da yazabilir (elleNotSerbestYazildi bunun için çip seçimini kaldırır).
function elleNotSec(kod){
  var input = document.getElementById("elleUrunNotInput");
  if(input) input.value = kod;
  ["BEDELSİZ","HEDİYE","NUMUNE"].forEach(function(k){
    var chip = document.getElementById("elleNotChip_"+k);
    if(!chip) return;
    if(k===kod){ chip.style.background="#f2994a"; chip.style.color="#fff"; }
    else { chip.style.background="#fff"; chip.style.color="#a85d00"; }
  });
}
function elleNotSerbestYazildi(){
  var input = document.getElementById("elleUrunNotInput");
  var deger = input ? input.value.trim().toUpperCase() : "";
  ["BEDELSİZ","HEDİYE","NUMUNE"].forEach(function(k){
    var chip = document.getElementById("elleNotChip_"+k);
    if(!chip) return;
    if(k===deger){ chip.style.background="#f2994a"; chip.style.color="#fff"; }
    else { chip.style.background="#fff"; chip.style.color="#a85d00"; }
  });
}

function hesaplaPopupAc(){
  document.getElementById("hesaplaPopupModal").style.display="flex";
  hizliHesaplaModu = false;
  elleUrunEkleModu = false;
  var elleKutu = document.getElementById("elleUrunAdiKutusu");
  if(elleKutu) elleKutu.style.display = "none";
  var elleNotKutu = document.getElementById("elleUrunNotKutusu");
  if(elleNotKutu) elleNotKutu.style.display = "none";
  var aramaBtn = document.getElementById("hizliUrunBulBtn");
  if(aramaBtn) aramaBtn.style.display="block";
  listeyeEkleButonGuncelle();
  var btn = document.getElementById("btnListeyeEkle");
  if(btn) btn.style.display="";
  fiyatGecmisiKontrolEt();
  hesapla();
}

// Sepette, kataloğa kayıtlı OLMAYAN bir ürünü (örn. bedelsiz numune/hediye)
// elle eklemek için Hesapla ekranını "manuel mod"da açar: ürün arama kutusu
// gizlenir, yerine serbest yazılabilir bir "Ürün Adı" kutusu çıkar. Liste
// fiyatı 0 (bedelsiz) bırakılabilir — normal akıştaki "liste fiyatı girilmedi"
// engeli bu modda uygulanmaz.
function elleUrunEkleAc(){
  aktarilanUrun = null;
  duzenlenenOrijinalId = null;
  elleUrunEkleModu = true;
  hizliHesaplaModu = false;
  document.getElementById("hesaplaPopupModal").style.display="flex";
  var kart = document.getElementById("aktarilanKart");
  if(kart) kart.style.display = "none";
  var elleKutu = document.getElementById("elleUrunAdiKutusu");
  if(elleKutu) elleKutu.style.display = "block";
  var elleInput = document.getElementById("elleUrunAdiInput");
  if(elleInput) elleInput.value = "";
  var elleNotKutu = document.getElementById("elleUrunNotKutusu");
  if(elleNotKutu) elleNotKutu.style.display = "block";
  var elleNotInput = document.getElementById("elleUrunNotInput");
  if(elleNotInput) elleNotInput.value = "";
  elleNotSec("");
  var aramaBtn = document.getElementById("hizliUrunBulBtn");
  if(aramaBtn) aramaBtn.style.display="none";
  document.getElementById("listeFiyat").value = "0";
  document.getElementById("dipFiyat").value = "0";
  document.getElementById("iskonto").value = "0";
  document.getElementById("adet").value = "1";
  var fgUyari = document.getElementById("fiyatGecmisiUyari");
  if(fgUyari) fgUyari.style.display = "none";
  listeyeEkleButonGuncelle();
  var btn = document.getElementById("btnListeyeEkle");
  if(btn) btn.style.display="";
  hesapla();
  if(elleInput) setTimeout(function(){ elleInput.focus(); }, 200);
}

// "🧹 Temizle" — Hesaplama ekranındaki tüm alanları ve aktarılan ürün bağını
// sıfırlar, böylece bir önceki ürünün liste/dip/iskonto/adet değerleri
// yanlışlıkla bir sonraki işleme karışmaz.
function hesaplamaTemizle(){
  aktarilanUrun = null;
  duzenlenenOrijinalId = null;
  sonMusteriFiyati = null;
  elleUrunEkleModu = false;
  var elleKutu = document.getElementById("elleUrunAdiKutusu");
  if(elleKutu) elleKutu.style.display = "none";
  var elleNotKutuT = document.getElementById("elleUrunNotKutusu");
  if(elleNotKutuT) elleNotKutuT.style.display = "none";
  var aramaBtnT = document.getElementById("hizliUrunBulBtn");
  if(aramaBtnT) aramaBtnT.style.display = "block";
  document.getElementById("listeFiyat").value = "0";
  document.getElementById("dipFiyat").value = "0";
  document.getElementById("iskonto").value = "0";
  document.getElementById("adet").value = "1";
  var kart = document.getElementById("aktarilanKart");
  if(kart) kart.style.display = "none";
  var fgUyari = document.getElementById("fiyatGecmisiUyari");
  if(fgUyari) fgUyari.style.display = "none";
  hesapla();
  showToast("🧹 Hesaplama alanları temizlendi.");
}
function listeyeEkleButonGuncelle(){
  var btn = document.getElementById("btnListeyeEkle");
  if(btn) btn.textContent = "LİSTEYE EKLE ("+hareketListesi.length+")";
}
// HIZLI HESAPLA — müşteri/işlem türü seçmeden, direkt Hesapla ekranını açar; ürün arama o ekranın içinden yapılır
var hizliHesaplaModu = false;

// SATIŞ MENÜSÜ — Müşteri / Ziyaret Takvimi / İstatistikler / Görevlerim tek buton altında
function satisMenusuAc(){
  document.getElementById("satisMenusuModal").style.display = "flex";
}
function satisMenusuKapatVeGit(sekmeNo){
  document.getElementById("satisMenusuModal").style.display = "none";
  switchTab(sekmeNo);
}

function hizliHesaplaAc(){
  hizliHesaplaModu = true;
  aktarilanUrun = null;
  duzenlenenOrijinalId = null;
  elleUrunEkleModu = false;
  var elleKutuH = document.getElementById("elleUrunAdiKutusu");
  if(elleKutuH) elleKutuH.style.display = "none";
  var elleNotKutuH = document.getElementById("elleUrunNotKutusu");
  if(elleNotKutuH) elleNotKutuH.style.display = "none";
  document.getElementById("aktarilanKart").style.display="none";
  document.getElementById("listeFiyat").value = "0";
  document.getElementById("dipFiyat").value = "0";
  document.getElementById("iskonto").value = "0";
  document.getElementById("adet").value = "1";
  var fgUyari = document.getElementById("fiyatGecmisiUyari");
  if(fgUyari) fgUyari.style.display="none";
  hesapla();
  var btn = document.getElementById("btnListeyeEkle");
  if(btn) btn.style.display="none";
  var aramaBtn = document.getElementById("hizliUrunBulBtn");
  if(aramaBtn) aramaBtn.style.display="block";
  document.getElementById("hesaplaPopupModal").style.display="flex";
}

function hizliHesaplaUrunAramaAc(){
  document.getElementById("hizliHesaplaArama").value = "";
  hizliHesaplaFiltrele();
  document.getElementById("hizliHesaplaModal").style.display="flex";
  setTimeout(function(){ document.getElementById("hizliHesaplaArama").focus(); }, 200);
}

function hizliHesaplaFiltrele(){
  var q = document.getElementById("hizliHesaplaArama").value.trim().toLocaleLowerCase("tr-TR");
  var kelimeler = q.split(/\s+/).filter(function(k){ return k.length>0; });
  var sonucDiv = document.getElementById("hizliHesaplaSonuclar");
  if(!globalProductCatalog || globalProductCatalog.length===0){
    sonucDiv.innerHTML = "<div style='color:#888;padding:14px 0;text-align:center;'>Katalog yüklenemedi.</div>";
    return;
  }
  if(kelimeler.length===0){
    sonucDiv.innerHTML = "<div style='color:#888;padding:14px 0;text-align:center;font-size:15px;'>Aramak için ürün adı veya kod yazın.</div>";
    return;
  }
  var eslesenler = [];
  for(var i=0;i<globalProductCatalog.length && eslesenler.length<30;i++){
    var item = globalProductCatalog[i];
    var b=(item.berta||item.BERTA||"").toString().toLocaleLowerCase("tr-TR");
    var a=(item.abas||item.ABAS||"").toString().toLocaleLowerCase("tr-TR");
    var nn=(item.name||item.NAME||item.urun||item.URUN||"").toString().toLocaleLowerCase("tr-TR");
    var araMetin=b+" "+a+" "+nn;
    var eslesme=true;
    for(var k=0;k<kelimeler.length;k++){
      if(araMetin.indexOf(kelimeler[k])<0){ eslesme=false; break; }
    }
    if(eslesme) eslesenler.push(item);
  }
  if(eslesenler.length===0){
    sonucDiv.innerHTML = "<div style='color:#888;padding:14px 0;text-align:center;'>Sonuç bulunamadı.</div>";
    return;
  }
  var html = "";
  for(var j=0;j<eslesenler.length;j++){
    var it = eslesenler[j];
    var bt=it.berta||it.BERTA||"-";
    var at=it.abas||it.ABAS||"-";
    var nt=it.name||it.NAME||it.urun||it.URUN||"";
    var pt = (it.fiyat!==undefined) ? it.fiyat : (it.price!==undefined) ? it.price : (it.PRICE!==undefined) ? it.PRICE : (it.euro!==undefined) ? it.euro : (it.Euro!==undefined) ? it.Euro : 0;
    var cp = parseFloat(String(pt).replace(",","."))||0;
    var safeName = String(nt).replace(/'/g,"&#39;");
    var safeBerta = String(bt).replace(/'/g,"&#39;");
    var safeAbas = String(at).replace(/'/g,"&#39;");
    html += "<div onclick=\"if(uzunBasiTikSonrasi())return;hizliHesaplaUrunSec('"+safeName+"',"+cp+",'"+safeBerta+"','"+safeAbas+"')\" oncontextmenu=\"return false;\" onmousedown=\"uzunBasiBaslat(function(){urunAdiniWeiconDaAra('"+safeName+"','"+safeAbas+"')})\" onmouseup=\"uzunBasiBitir()\" onmouseleave=\"uzunBasiBitir()\" ontouchstart=\"uzunBasiBaslat(function(){urunAdiniWeiconDaAra('"+safeName+"','"+safeAbas+"')})\" ontouchend=\"uzunBasiBitir()\" ontouchmove=\"uzunBasiBitir()\" style='background:#f7f9fc;border:1px solid #d5dce6;border-radius:8px;padding:12px 14px;margin-bottom:8px;cursor:pointer;-webkit-user-select:none;user-select:none;'>"
      +"<div style='font-size:14px;font-weight:800;color:#444;'><span style=\"color:#003a70;\">Berta:</span> "+bt+" <span style=\"color:#e0524a;\">- Abas:</span> "+at+"</div>"
      +"<div style='font-size:19px;font-weight:800;color:#222;margin-top:3px;'>"+nt+"</div>"
      +"<div style='font-size:16px;font-weight:900;color:#0e7c63;margin-top:3px;'>"+fmt(cp)+" €</div>"
      +"</div>";
  }
  sonucDiv.innerHTML = html;
}

function hizliHesaplaUrunSec(name, price, berta, abas){
  document.getElementById("hizliHesaplaModal").style.display="none";
  var korunanId = duzenlenenOrijinalId || ("hizli_"+Date.now());
  aktarilanUrun = {id:korunanId, name:name, price:price, berta:berta, abas:abas};
  duzenlenenOrijinalId = null;
  document.getElementById("listeFiyat").value = parseFloat(price).toFixed(2);
  document.getElementById("dipFiyat").value = (parseFloat(price)*0.3635).toFixed(2);
  document.getElementById("iskonto").value = 0;
  document.getElementById("adet").value = 1;
  document.getElementById("aktarilanKart").style.display="block";
  document.getElementById("kart-urunTekSatir").innerHTML="<div style='white-space:nowrap;'><span style='color:#003a70;'>Berta:</span> "+(berta||"-")+" <span style='color:#e0524a;'>- Abas:</span> "+(abas||"-")+"</div><div style='margin-top:4px;'>"+name+"</div>";
  var fgUyari = document.getElementById("fiyatGecmisiUyari");
  if(fgUyari) fgUyari.style.display="none";
  hesapla();
  if(document.getElementById("hesaplaPopupModal").style.display !== "flex"){
    hesaplaPopupAc();
  }
}

function hesaplaPopupKapat(){
  document.getElementById("hesaplaPopupModal").style.display="none";
  aktarilanUrununSil();
  elleUrunEkleModu = false;
  var elleKutuX = document.getElementById("elleUrunAdiKutusu");
  if(elleKutuX) elleKutuX.style.display = "none";
  var elleNotKutuX = document.getElementById("elleUrunNotKutusu");
  if(elleNotKutuX) elleNotKutuX.style.display = "none";
  if(hizliHesaplaModu){
    hizliHesaplaModu = false;
    var btn = document.getElementById("btnListeyeEkle");
    if(btn) btn.style.display="";
  }
}

function sepetBekleyenModalAc(id,name,price,berta,abas){
  var icerik = document.getElementById("sepetBekleyenModalIcerik");
  var p = parseFloat(price)||0;
  icerik.innerHTML = "<div class='aktarilan-kart' style='display:block;'>"
    +"<div class='aktarilan-kart-baslik'>Hesaplanacak Ürün</div>"
    +"<div style='font-size:32px;font-weight:900;color:#222;'><div style='white-space:nowrap;'><span style='color:#003a70;'>Berta:</span> "+(berta||"-")+" <span style='color:#e0524a;'>- Abas:</span> "+(abas||"-")+"</div><div style='margin-top:4px;'>"+name+"</div></div>"
    +"</div>"
    +"<div class='hesap-section' style='margin-top:10px;'>"
    +"<div class='hesap-section-title'>LİSTE FİYATI (EUR)</div>"
    +"<div style='width:100%;padding:14px 4px;background:#f7f9fc;border:3px solid #003a70;border-radius:8px;font-size:60px;font-weight:900;color:#003a70;text-align:center;box-sizing:border-box;'>"+fmt(p)+"</div>"
    +"</div>"
    +"<div style='margin-top:14px;background:#fdeceb;border:2px solid #e0524a;border-radius:8px;padding:16px 18px;'>"
    +"<div style='font-size:24px;font-weight:900;color:#e0524a;'>⛔ Henüz hesaplanmadı</div>"
    +"<div style='font-size:18px;color:#c0392b;margin-top:4px;'>İskonto ve fiyat belirlemek için Hesapla'ya aktarın.</div>"
    +"</div>";
  document.getElementById("sepetBekleyenModalAktar").onclick = function(){
    document.getElementById("sepetBekleyenModal").style.display="none";
    sepettenHesaplaAktar(id,name,price,berta,abas);
  };
  document.getElementById("sepetBekleyenModalDuzenle").onclick = function(){
    document.getElementById("sepetBekleyenModal").style.display="none";
    sepettenHesaplaAktar(id,name,price,berta,abas);
  };
  document.getElementById("sepetBekleyenModalSil").onclick = function(){
    document.getElementById("sepetBekleyenModal").style.display="none";
    sepettenSil(id,name,price,berta,abas);
  };
  document.getElementById("sepetBekleyenModal").style.display="flex";
}

function sepettenSil(id,name,price,berta,abas){
  var silinenIdx=-1, silinen=null;
  for(var i=0;i<basket.length;i++){
    if(basket[i].id===id){ silinenIdx=i; silinen=basket[i]; break; }
  }
  if(silinenIdx===-1) return;
  basket.splice(silinenIdx,1);
  updateBasketCount();
  renderBasket();
  showUndoToast("Sepetten silindi: "+name, function(){
    basket.push(silinen);
    updateBasketCount();
    renderBasket();
  });
}

var duzenlenenOrijinalId = null;

function sepettenHesaplaAktar(id,name,price,berta,abas){
  // Sepette bu ürünü gönderildi olarak işaretle
  var asilAdet = 1;
  for(var i=0;i<basket.length;i++){
    if(basket[i].id===id){ basket[i].sentToCalc=true; if(basket[i].asilAdet) asilAdet=basket[i].asilAdet; break; }
  }
  duzenlenenOrijinalId = id;
  aktarilanUrun={id:id,name:name,price:safeNumber(price,0),berta:berta,abas:abas};
  document.getElementById("listeFiyat").value=parseFloat(price).toFixed(2);
  // Dip maliyet otomatik = liste × %36,35
  document.getElementById("dipFiyat").value=(parseFloat(price)*0.3635).toFixed(2);
  // Önceki üründen kalan iskonto oranı yeni ürüne sızmasın diye her yeni ürün aktarımında sıfırlanır.
  document.getElementById("iskonto").value=0;
  document.getElementById("adet").value=asilAdet;
  document.getElementById("aktarilanKart").style.display="block";
  document.getElementById("kart-urunTekSatir").innerHTML="<div style='white-space:nowrap;'><span style='color:#003a70;'>Berta:</span> "+(berta||"-")+" <span style='color:#e0524a;'>- Abas:</span> "+(abas||"-")+"</div><div style='margin-top:4px;'>"+name+"</div>";
  var fgUyari = document.getElementById("fiyatGecmisiUyari");
  if(fgUyari) fgUyari.style.display="none";
  hesapla();
  renderBasket();
  hesaplaPopupAc();
}

function aktarilanUrununSil(){
  aktarilanUrun=null;
  document.getElementById("aktarilanKart").style.display="none";
  document.getElementById("listeFiyat").value="0";
  document.getElementById("dipFiyat").value="0";  document.getElementById("iskonto").value="0";
  document.getElementById("adet").value="1";
  var ids=["iskontoluFiyat","tlBirimFiyat","maliyetKar","toplamMaliyetKar","mudurPrim","mudurPrimTL","toplamEuro","faturaToplam"];
  for(var i=0;i<ids.length;i++) document.getElementById(ids[i]).textContent="-";
}

function fmt(n){ return n.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2}); }

function listeFiyatGuncelle(){
  var liste = parseFloat(document.getElementById("listeFiyat").value)||0;
  var dipInput = document.getElementById("dipFiyat");
  // Otomatik dip maliyet = liste × %36,35
  if(liste > 0){
    dipInput.value = (liste * 0.3635).toFixed(2);
  }
  hesapla();
}

// MÜŞTERİ BAZLI FİYAT GEÇMİŞİ — bu müşteriye bu ürün daha önce satılmış mı, en son kaça?
var sonMusteriFiyati = null;
function musteriUrunFiyatGecmisiBul(musteriAdi, urunId){
  if(!musteriAdi || !urunId) return null;
  var arsiv = lsGet("weicon_arsiv",{});
  var tipler = ["teklif","proforma","siparis"]; // numune hariç, gerçek satış değil
  var enSon = null;
  for(var t=0;t<tipler.length;t++){
    var liste = arsiv[tipler[t]]||[];
    for(var i=0;i<liste.length;i++){
      var kayit = liste[i];
      if((kayit.musteri||"").trim().toLocaleLowerCase("tr-TR") !== musteriAdi.trim().toLocaleLowerCase("tr-TR")) continue;
      var urunlerListesi = kayit.urunler||[];
      for(var j=0;j<urunlerListesi.length;j++){
        if(urunlerListesi[j].id === urunId){
          if(!enSon || (kayit.ts||0) > enSon.ts){
            enSon = {ts:kayit.ts||0, tarih:kayit.tarih||"", price:urunlerListesi[j].iskBirim||0, tip:tipler[t], idx:i};
          }
        }
      }
    }
  }
  return enSon;
}

function fiyatGecmisiKontrolEt(){
  var div = document.getElementById("fiyatGecmisiUyari");
  if(!div) return;
  if(!aktarilanUrun || !aktarilanUrun.id){ sonMusteriFiyati=null; div.style.display="none"; return; }
  var musteriAdi = getDynamicCustomerName();
  sonMusteriFiyati = musteriUrunFiyatGecmisiBul(musteriAdi, aktarilanUrun.id);
  if(!sonMusteriFiyati){ div.style.display="none"; }
}

var sonHesaplananIskontoluFiyat = 0;
function hesapla(){
  var kur=parseFloat(document.getElementById("kur").value)||0;
  var listeFiyat=parseFloat(document.getElementById("listeFiyat").value)||0;
  var dipFiyat=parseFloat(document.getElementById("dipFiyat").value)||0;
  var iskonto=parseFloat(document.getElementById("iskonto").value)||0;
  var adet=parseFloat(document.getElementById("adet").value)||1;
  var iskontoluFiyat=listeFiyat-(listeFiyat*iskonto/100);
  var tlBirimFiyat=iskontoluFiyat*kur;
  var maliyetKar=iskontoluFiyat-dipFiyat;
  var toplamMaliyetKar=maliyetKar*adet;
  var mudurPrim=toplamMaliyetKar*0.22;
  var mudurPrimTL=mudurPrim*kur;
  var toplamEuro=adet*iskontoluFiyat;
  var faturaToplam=adet*tlBirimFiyat*(1+KDV_ORANI/100);
  sonHesaplananIskontoluFiyat = iskontoluFiyat;
  document.getElementById("iskontoluFiyat").textContent=fmt(iskontoluFiyat)+" EUR";
  document.getElementById("tlBirimFiyat").textContent=fmt(tlBirimFiyat)+" TL";
  document.getElementById("maliyetKar").textContent=fmt(maliyetKar)+" EUR";
  document.getElementById("toplamMaliyetKar").textContent=fmt(toplamMaliyetKar*kur)+" TL";
  document.getElementById("mudurPrim").textContent = mudurPrim<0 ? "Prim yok" : fmt(mudurPrim)+" EUR";
  document.getElementById("mudurPrimTL").textContent = mudurPrimTL<0 ? "Prim yok" : fmt(mudurPrimTL)+" TL";
  document.getElementById("toplamEuro").textContent=fmt(toplamEuro)+" EUR";
  document.getElementById("faturaToplam").textContent=fmt(faturaToplam)+" TL";

  // Müşteri bazlı fiyat geçmişi uyarısı
  var uyariDiv = document.getElementById("fiyatGecmisiUyari");
  if(uyariDiv && sonMusteriFiyati){
    if(iskontoluFiyat < sonMusteriFiyati.price - 0.001){
      var fark = sonMusteriFiyati.price>0 ? (((sonMusteriFiyati.price-iskontoluFiyat)/sonMusteriFiyati.price)*100) : 0;
      uyariDiv.style.display="block";
      uyariDiv.style.background="#fdeceb";
      uyariDiv.style.border="2px solid #e0524a";
      uyariDiv.style.color="#c0392b";
      uyariDiv.innerHTML="⚠️ Bu müşteriye "+sonMusteriFiyati.tarih+" tarihinde bu üründen <b>"+fmt(sonMusteriFiyati.price)+" €</b>'ya satış yapılmış. Şu anki fiyat <b>%"+fmt(fark)+"</b> daha düşük."
        +"<button onclick=\"oncekiSatisKaydinaGit()\" style='display:block;margin-top:8px;background:#c0392b;color:#fff;border:none;padding:9px 14px;font-size:15px;font-weight:800;border-radius:6px;cursor:pointer;'>🔍 O Kaydı Görüntüle</button>";
    } else {
      uyariDiv.style.display="block";
      uyariDiv.style.background="#e6f7ec";
      uyariDiv.style.border="2px solid #16a085";
      uyariDiv.style.color="#0e7c63";
      uyariDiv.innerHTML="✓ Bu müşteriye son satış: "+sonMusteriFiyati.tarih+" tarihinde <b>"+fmt(sonMusteriFiyati.price)+" €</b>.";
    }
  } else if(uyariDiv){
    uyariDiv.style.display="none";
  }
}

// Fiyat geçmişi uyarısındaki "O Kaydı Görüntüle" bağlantısı: Hesaplama popup'ını
// kapatıp o ürünün daha önce daha yüksek fiyata satıldığı kaydı açar.
function oncekiSatisKaydinaGit(){
  if(!sonMusteriFiyati) return;
  var modal = document.getElementById("hesaplaPopupModal");
  if(modal) modal.style.display = "none";
  var onayModal = document.getElementById("fiyatDusuklukOnayModal");
  if(onayModal) onayModal.style.display = "none";
  arsivDetayAc(sonMusteriFiyati.tip, sonMusteriFiyati.idx);
}

// "LİSTEYE EKLE" butonuna basılınca çağrılır: eğer bu ürün bu müşteriye daha
// önce daha yüksek fiyata satılmışsa, direkt eklemek yerine önce onay ister
// (Kapat = geri dön düzenle, Devam Et = yine de bu fiyatla ekle).
function listeyeEkleTikla(){
  if(sonMusteriFiyati && sonHesaplananIskontoluFiyat < sonMusteriFiyati.price - 0.001){
    var fark = sonMusteriFiyati.price>0 ? (((sonMusteriFiyati.price-sonHesaplananIskontoluFiyat)/sonMusteriFiyati.price)*100) : 0;
    var metinEl = document.getElementById("fiyatDusuklukOnayMetin");
    if(metinEl){
      metinEl.innerHTML = "Bu müşteriye <b>"+sonMusteriFiyati.tarih+"</b> tarihinde bu üründen <b>"+fmt(sonMusteriFiyati.price)+" €</b>'ya satış yapılmış."
        + "<br><br>Şimdi <b>"+fmt(sonHesaplananIskontoluFiyat)+" €</b>'ya (%"+fmt(fark)+" daha düşük) ekliyorsunuz."
        + "<br><br>Yine de devam etmek istiyor musunuz?";
    }
    var modal = document.getElementById("fiyatDusuklukOnayModal");
    if(modal) modal.style.display = "flex";
  } else {
    hareketeSaklar();
  }
}

function fiyatDusuklukOnayKapat(){
  var modal = document.getElementById("fiyatDusuklukOnayModal");
  if(modal) modal.style.display = "none";
}

function fiyatDusuklukOnayDevamEt(){
  var modal = document.getElementById("fiyatDusuklukOnayModal");
  if(modal) modal.style.display = "none";
  hareketeSaklar();
}

function hareketeSaklar(){
  var kur=parseFloat(document.getElementById("kur").value)||0;
  var listeFiyat=parseFloat(document.getElementById("listeFiyat").value)||0;
  var dipFiyat=parseFloat(document.getElementById("dipFiyat").value)||0;
  var iskonto=parseFloat(document.getElementById("iskonto").value)||0;
  var adet=parseFloat(document.getElementById("adet").value)||1;

  var elleAdi = "";
  if(elleUrunEkleModu){
    elleAdi = (document.getElementById("elleUrunAdiInput").value||"").trim();
    if(!elleAdi){
      showToast("⚠️ Ürün adını yazın (elle/bedelsiz ürün için zorunlu).");
      var elleInputOdak = document.getElementById("elleUrunAdiInput");
      if(elleInputOdak) elleInputOdak.focus();
      return;
    }
  }
  // Normal katalog ürününde liste fiyatı zorunludur (hesaplama fiyat üzerinden
  // yapılır). Elle/bedelsiz üründe ise fiyat bilerek 0 bırakılabilir (hediye/numune).
  if(listeFiyat===0 && !elleUrunEkleModu){ showToast("Liste fiyatı girilmemiş!"); return; }

  var iskBirim=listeFiyat-(listeFiyat*iskonto/100);
  var toplamEuro=iskBirim*adet;
  var elleNotu = elleUrunEkleModu ? (document.getElementById("elleUrunNotInput").value||"").trim() : "";
  var urun={
    id: aktarilanUrun ? aktarilanUrun.id : ("m"+Date.now()),
    name: aktarilanUrun ? aktarilanUrun.name : (elleUrunEkleModu ? elleAdi : "Manuel Urun"),
    berta: aktarilanUrun ? (aktarilanUrun.berta||"-") : "-",
    abas: aktarilanUrun ? (aktarilanUrun.abas||"-") : "-",
    listeFiyat:listeFiyat, dipFiyat:dipFiyat, iskonto:iskonto, adet:adet, kur:kur,
    iskBirim:iskBirim, toplamEuro:toplamEuro,
    elleEklendi: elleUrunEkleModu ? true : false,
    not: elleNotu
  };
  hareketListesi.push(urun);
  showToast("✓ "+urun.name+" eklendi — İletişimde toplam "+hareketListesi.length+" ürün var", 3500);
  document.getElementById("hesaplaPopupModal").style.display="none";
  aktarilanUrununSil();
  elleUrunEkleModu = false;
  var elleKutuKapat = document.getElementById("elleUrunAdiKutusu");
  if(elleKutuKapat) elleKutuKapat.style.display = "none";
  var elleNotKutuKapat = document.getElementById("elleUrunNotKutusu");
  if(elleNotKutuKapat) elleNotKutuKapat.style.display = "none";
  var aramaBtnAc = document.getElementById("hizliUrunBulBtn");
  if(aramaBtnAc) aramaBtnAc.style.display = "block";
  var beklenenVar = false;
  for(var i=0;i<basket.length;i++){ if(!basket[i].sentToCalc){ beklenenVar=true; break; } }
  if(!beklenenVar){
    // Bekleyen ürün kalmadı - Ürün Bul sepetini de otomatik temizle
    basket = [];
    updateBasketCount();
  }
  if(typeof renderBasket==="function") renderBasket();
  if(typeof renderHareket==="function") renderHareket();
}

var ISLEM_TURU_ADI = {numune:"NUMUNE", teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA FATURA", siparis:"SİPARİŞ"};
var ISLEM_TURU_KISA = {siparis:"SİP", teklif:"F.TF", proforma:"P.FT", numune:"NUM"};
var ISLEM_TURU_RENK = {numune:"#f2994a", teklif:"#28a745", proforma:"#8e44ad", siparis:"#003a70"};
var ISLEM_TURU_ETIKET_RENK = {numune:"#a3651e", teklif:"#1e7a37", proforma:"#6a3a8f", siparis:"#1a3f70"};

function islemTuruModalAc(){
  document.getElementById("islemTuruModal").style.display="flex";
}
function islemTuruModalKapat(){
  document.getElementById("islemTuruModal").style.display="none";
}

function islemTuruRenkGuncelle(){
  var etiket = document.getElementById("islemTuruEtiket");
  if(!etiket) return;
  if(!secilenMod){
    etiket.style.color = "#e0524a";
    etiket.textContent = "Seçilmedi ⚠️";
    return;
  }
  var renk = ISLEM_TURU_ETIKET_RENK[secilenMod] || "#1a3f70";
  etiket.style.color = renk;
  etiket.textContent = ISLEM_TURU_ADI[secilenMod] || String(secilenMod).toUpperCase();
}

function modSec(mod){
  secilenMod=mod;
  islemTuruRenkGuncelle();
  islemTuruModalKapat();
  generateCommunicationData();
  if(islemTuruSeciminSonrasiAksiyon === 'iletisim'){
    islemTuruSeciminSonrasiAksiyon = null;
    document.getElementById("iletisimIslemleriModal").style.display="flex";
  } else if(islemTuruSeciminSonrasiAksiyon === 'gonderimOnay'){
    islemTuruSeciminSonrasiAksiyon = null;
    if(sonSecilenKanal) _resimGonderOrtak(sonSecilenKanal);
  } else if(islemTuruSeciminSonrasiAksiyon === 'kaydet'){
    islemTuruSeciminSonrasiAksiyon = null;
    hesaplaKaydetTikla();
  }
}

function hareketDuzenle(idx){
  var item = hareketListesi[idx];
  if(!item) return;
  hareketListesi.splice(idx,1);
  // Eşleşen sepet ürünü varsa "beklemede" durumuna geri al
  for(var k=0;k<basket.length;k++){ if(basket[k].id===item.id){ basket[k].sentToCalc=false; break; } }
  aktarilanUrun={id:item.id, name:item.name, price:item.listeFiyat, berta:item.berta, abas:item.abas};
  document.getElementById("kur").value = item.kur;
  document.getElementById("listeFiyat").value = item.listeFiyat.toFixed(2);
  document.getElementById("dipFiyat").value = item.dipFiyat.toFixed(2);
  document.getElementById("iskonto").value = item.iskonto;
  document.getElementById("adet").value = item.adet;
  document.getElementById("aktarilanKart").style.display="block";
  document.getElementById("kart-urunTekSatir").innerHTML="<div style='white-space:nowrap;'><span style='color:#003a70;'>Berta:</span> "+(item.berta||"-")+" <span style='color:#e0524a;'>- Abas:</span> "+(item.abas||"-")+"</div><div style='margin-top:4px;'>"+item.name+"</div>";
  hesapla();
  renderHareket();
  renderBasket();
  showToast(item.name+" düzenlemek için yüklendi.");
  hesaplaPopupAc();
}

function harekettenSil(idx){
  var silinen = hareketListesi[idx];
  hareketListesi.splice(idx,1);
  // Aynı ürün Hesapla sayfasındaki bekleyen sepette (basket) de varsa oradan da kaldır
  if(silinen && silinen.id!==undefined){
    var yeniBasket=[];
    for(var i=0;i<basket.length;i++) if(basket[i].id!==silinen.id) yeniBasket.push(basket[i]);
    if(yeniBasket.length!==basket.length){
      basket=yeniBasket;
      updateBasketCount();
      if(typeof renderBasket==="function") renderBasket();
    }
    if(aktarilanUrun && aktarilanUrun.id===silinen.id) aktarilanUrun=null;
  }
  renderHareket();
  showToast("Ürün listeden silindi.");
}

function hareketUrunModalAc(idx){
  var item = hareketListesi[idx];
  if(!item) return;
  var icerik = document.getElementById("hareketUrunModalIcerik");
  icerik.innerHTML = "<div class='aktarilan-kart' style='display:block;'>"
    +"<div class='aktarilan-kart-baslik'>Hesaplanmış Ürün</div>"
    +"<div style='font-size:32px;font-weight:900;color:#222;'><div style='white-space:nowrap;'><span style='color:#003a70;'>Berta:</span> "+(item.berta||"-")+" <span style='color:#e0524a;'>- Abas:</span> "+(item.abas||"-")+"</div><div style='margin-top:4px;'>"+item.name+"</div></div>"
    +"</div>"
    +"<div class='hesap-section' style='margin-top:10px;'>"
    +"<div class='hesap-section-title'>NET TUTAR (EUR)</div>"
    +"<div style='width:100%;padding:14px 4px;background:#f7f9fc;border:3px solid #003a70;border-radius:8px;font-size:60px;font-weight:900;color:#003a70;text-align:center;box-sizing:border-box;'>"+fmt(item.toplamEuro)+"</div>"
    +"</div>"
    +"<div style='margin-top:14px;background:#e7f8ee;border:2px solid #16a085;border-radius:8px;padding:16px 18px;'>"
    +"<div style='font-size:24px;font-weight:900;color:#0e7c63;'>✅ Hesaplandı</div>"
    +"<div style='font-size:18px;color:#0e7c63;margin-top:4px;'>Adet: "+item.adet+" · İSK: %"+item.iskonto+" · Birim Fiyat: "+fmt(item.listeFiyat)+" €</div>"
    +"</div>";
  document.getElementById("hareketUrunModalDuzenle").onclick = function(){
    document.getElementById("hareketUrunModal").style.display="none";
    hareketDuzenle(idx);
  };
  document.getElementById("hareketUrunModalSil").onclick = function(){
    document.getElementById("hareketUrunModal").style.display="none";
    harekettenSil(idx);
  };
  document.getElementById("hareketUrunModal").style.display="flex";
}
