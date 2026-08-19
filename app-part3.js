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
// TEK KAYNAK: Fatura/Teslimat/Yetkili'nin hazır olup olmadığını kontrol eder
// VE mümkünse otomatik seçer (tek seçenek varsa). Ürün Bul ön-kontrolü, Kaydet
// ve Gönder akışlarının HEPSİ bu TEK fonksiyona bakar — böylece "bazen soruyor
// bazen sormuyor" tutarsızlığı ortadan kalkar.
function belgeBilgileriHazirlaVeKontrolEt(){
  if(musteriKartIdx===null) return {faturaVar:false, teslimatVar:false, yetkiliVar:false, hepsiTam:false};
  var m = musteriListesi[musteriKartIdx];
  if(!m) return {faturaVar:false, teslimatVar:false, yetkiliVar:false, hepsiTam:false};

  var faturaListesi = musteriAdresListesiGetir(m, "fatura");
  var teslimatListesi = musteriAdresListesiGetir(m, "teslimat");
  var yetkiliListesi = m.iletisimler || [];
  if(!seciliFaturaAdresi && faturaListesi.length===1){ seciliFaturaAdresi = faturaListesi[0]; localStorage.setItem("weicon_secili_fatura", JSON.stringify(seciliFaturaAdresi)); }
  if(!seciliTeslimatAdresi && teslimatListesi.length===1){ seciliTeslimatAdresi = teslimatListesi[0]; localStorage.setItem("weicon_secili_teslimat", JSON.stringify(seciliTeslimatAdresi)); }
  // SORUN 1 DÜZELTİLDİ: Yetkili için de artık aynı otomatik seçim kuralı var —
  // müşterinin tek bir yetkilisi varsa elle seçmeye gerek kalmıyor.
  if(!seciliYetkililer.length && yetkiliListesi.length===1){
    var tekYetkili = yetkiliListesi[0];
    seciliYetkililer = [{isim:tekYetkili.isim, bolum:tekYetkili.bolum||"", gorev:tekYetkili.gorev||"", telefon:tekYetkili.telefon||"", eposta:tekYetkili.eposta||""}];
    localStorage.setItem("weicon_secili_yetkililer", JSON.stringify(seciliYetkililer));
    if(typeof yetkiliKisiEtiketGuncelle==="function") yetkiliKisiEtiketGuncelle();
  }

  var faturaVar = !!(seciliFaturaAdresi && seciliFaturaAdresi.adres);
  var teslimatVar = !!(seciliTeslimatAdresi && seciliTeslimatAdresi.adres);
  var yetkiliVar = seciliYetkililer.length>0;
  return {faturaVar:faturaVar, teslimatVar:teslimatVar, yetkiliVar:yetkiliVar, hepsiTam: faturaVar && teslimatVar && yetkiliVar};
}

// Ön-kontrol ekranı KAPANDIĞINDA nereye devam edileceğini tutar — bu sayede
// aynı ekran hem "Ürün Bul" hem "Gönder" hem "Kaydet" akışları için TEK ORTAK
// kapı olarak kullanılabiliyor (SORUN 2'nin kökten çözümü).
var onKontrolSonrasiAksiyon = "urunBul"; // 'urunBul' | 'gonder' | 'kaydet'

// Gönder/Kaydet akışlarının BAŞINDA çağrılır. Bilgiler eksikse ön-kontrol
// ekranını açar ve true döner (çağıran fonksiyon burada durmalı). Bilgiler
// tamsa hiçbir şey yapmadan false döner (çağıran fonksiyon normal akışına devam eder).
function belgeBilgileriEksikMi(sonrakiAksiyon){
  if(musteriKartIdx===null) return false; // müşteri kartı bağlamı yoksa bu kapıyı devre dışı bırak
  var durum = belgeBilgileriHazirlaVeKontrolEt();
  if(durum.hepsiTam) return false;
  onKontrolSonrasiAksiyon = sonrakiAksiyon;
  urunBulKontrolAktif = false;
  var m = musteriListesi[musteriKartIdx];
  document.getElementById("ubkMusteriAdi").textContent = m ? (m.ad||"") : "";
  urunBulOnKontrolRenderEt();
  var iim = document.getElementById("iletisimIslemleriModal"); if(iim) iim.style.display="none";
  document.getElementById("urunBulOnKontrolModal").style.display="flex";
  return true;
}

// ÖNERİ C — Sepet ekranının üstündeki her-zaman-görünen mini özet çubuğu.
// Hem Kaydet hem Gönder'in baktığı belgeBilgileriHazirlaVeKontrolEt() ile
// AYNI veriye bakar — burada gördüğün ile Kaydet/Gönder'de karşılaşacağın
// durum HER ZAMAN birebir aynıdır.
function belgeBilgileriOzetGuncelle(){
  var el = document.getElementById("belgeBilgileriOzetCubugu");
  if(!el) return;
  if(musteriKartIdx===null){ el.style.display="none"; return; }
  var durum = belgeBilgileriHazirlaVeKontrolEt();
  var parcalar = [];
  if(durum.yetkiliVar) parcalar.push("👤 "+seciliYetkililer.map(function(k){return k.isim;}).join(", "));
  if(durum.faturaVar) parcalar.push("🧾 "+(seciliFaturaAdresi.gecici?"Geçici Adres":seciliFaturaAdresi.etiket));
  if(durum.teslimatVar && teslimatDahilEt) parcalar.push("🚚 "+(seciliTeslimatAdresi.gecici?"Geçici Adres":seciliTeslimatAdresi.etiket));
  var tamMi = durum.hepsiTam;
  el.style.display = "flex";
  el.style.background = tamMi ? "linear-gradient(135deg,#f0f7ff,#dbe9f9)" : "linear-gradient(135deg,#fff6ec,#ffe8d1)";
  el.style.border = "2.5px solid "+(tamMi?"#3569b8":"#b7601f");
  var metin = parcalar.length ? parcalar.join(" · ") : "Fatura/Teslimat/Yetkili seçilmedi";
  el.innerHTML = "<span style='font-size:14px;font-weight:800;color:"+(tamMi?"#003a70":"#a8590c")+";overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>"+(tamMi?"✅ ":"⚠️ ")+safeText(metin)+"</span>"
    +"<span style='font-size:13px;font-weight:900;color:#fff;background:"+(tamMi?"#003a70":"#b7601f")+";padding:5px 12px;border-radius:6px;flex-shrink:0;'>Değiştir</span>";
}
// Özet çubuğuna dokununca — Gönder/Kaydet'in kullandığı AYNI ekranı, AYNI
// verilerle açar. "Devam Et" onKontrolSonrasiAksiyon="ozet" olduğu için sadece
// ekranı kapatıp sepete geri döner (gönder/kaydet'i otomatik tetiklemez).
function belgeBilgileriOzetDuzenle(){
  if(musteriKartIdx===null) return;
  urunBulKontrolAktif = false;
  onKontrolSonrasiAksiyon = "ozet";
  var m = musteriListesi[musteriKartIdx];
  document.getElementById("ubkMusteriAdi").textContent = m ? (m.ad||"") : "";
  urunBulOnKontrolRenderEt();
  document.getElementById("urunBulOnKontrolModal").style.display="flex";
}

function urunBulOnKontrolAc(){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  urunBulKontrolAktif = true;
  onKontrolSonrasiAksiyon = "urunBul";
  document.getElementById("musteriKartModal").style.display="none";
  document.getElementById("ubkMusteriAdi").textContent = m.ad||"";
  var durum = belgeBilgileriHazirlaVeKontrolEt();
  // ÖNERİ A — AKILLI ATLAMA: fatura+teslimat+yetkili otomatik seçilip hepsi
  // tamsa, kullanıcıya HİÇ soru sormadan doğrudan Ürün Bul'a geçiyoruz.
  if(durum.hepsiTam){
    urunBulOnKontrolDevamEt();
    return;
  }
  urunBulOnKontrolRenderEt();
  document.getElementById("urunBulOnKontrolModal").style.display="flex";
}

function urunBulOnKontrolKapat(){
  urunBulKontrolAktif = false;
  document.getElementById("urunBulOnKontrolModal").style.display="none";
  // Sadece "Ürün Bul" akışından açıldıysa Müşteri Kartı'na geri dön — Gönder/
  // Kaydet/Özet çubuğundan açıldıysa (o an Sepet ekranındayız) kart açmaya gerek yok.
  if((onKontrolSonrasiAksiyon||"urunBul")==="urunBul"){
    document.getElementById("musteriKartModal").style.display="flex";
  }
  if(typeof belgeBilgileriOzetGuncelle==="function") belgeBilgileriOzetGuncelle();
  onKontrolSonrasiAksiyon = "urunBul";
}

function urunBulOnKontrolRenderEt(){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;

  var durum = belgeBilgileriHazirlaVeKontrolEt();
  var faturaVar = durum.faturaVar;
  var teslimatVar = durum.teslimatVar;
  var yetkiliVar = durum.yetkiliVar;
  var hepsiTam = durum.hepsiTam;

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

  html += satirOlustur(yetkiliVar, "YETKİLİ KİŞİ", yetkiliVar?safeText(seciliYetkililer.map(function(k){return k.isim;}).join(", ")):"Seçilmedi", yetkiliVar?"Değiştir":"+ Seç", "musteriIletisimYetkiliSecmeyeAc()");

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
  var aksiyon = onKontrolSonrasiAksiyon || "urunBul";
  onKontrolSonrasiAksiyon = "urunBul";
  if(typeof belgeBilgileriOzetGuncelle==="function") belgeBilgileriOzetGuncelle();
  if(aksiyon==="gonder"){ iletisimIslemleriPopupAc(); return; }
  if(aksiyon==="kaydet"){ hesaplaKaydetTikla(); return; }
  if(aksiyon==="ozet"){ return; } // sadece kapat, sepete geri dön — otomatik gönder/kaydet YOK
  // "Ürün Bul" akışı: işlem türü (Numune/Teklif/Proforma/Sipariş) artık BURADA,
  // ürünleri seçmeden ÖNCE soruluyor — eskiden Gönder anında sorulurdu. Zaten
  // seçilmişse (aynı oturumda daha önce seçildiyse) tekrar sorulmaz, doğrudan
  // Ürün Bul'a geçilir — bu sayede Gönder anında bir daha çıkmaz.
  if(!secilenMod){
    islemTuruSeciminSonrasiAksiyon = "urunBul";
    islemTuruModalAc();
    return;
  }
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
  seciliYetkililer = [];
  localStorage.removeItem("weicon_secili_yetkililer");
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
  seciliYetkililer = [];
  localStorage.removeItem("weicon_secili_yetkililer");
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
      bilgiNotu = "<div style='font-size:20px;color:#8a97a6;font-weight:700;margin-bottom:8px;'>En son kayıt edilen 12 müşteri gösteriliyor · toplam "+toplamSayi+" müşteri
