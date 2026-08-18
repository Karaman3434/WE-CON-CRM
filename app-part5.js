function kmSuAnTarihSaatDoldur(){
  var simdi = new Date();
  var gg = String(simdi.getDate()).padStart(2,"0");
  var aa = String(simdi.getMonth()+1).padStart(2,"0");
  var yyyy = simdi.getFullYear();
  var ss = String(simdi.getHours()).padStart(2,"0");
  var dd = String(simdi.getMinutes()).padStart(2,"0");
  var tarihEl = document.getElementById("kmTarihGosterInput");
  var saatEl = document.getElementById("kmSaatInput");
  if(tarihEl) tarihEl.value = gg+"."+aa+"."+yyyy;
  if(saatEl) saatEl.value = ss+":"+dd;
  kmAlanKilitleriUygula();
}

// KM okuma tuşunu "KM Gir" (fotoğraf çek) durumundan "KM Kaydet" durumuna
// çevirir — km başarıyla okunup alana yazıldıktan sonra çağrılır.
function kmKmFotoBtnKaydetModunaGecir(){
  var btn = document.getElementById("kmKmFotoBtn");
  if(!btn) return;
  btn.innerHTML = "<div style='width:80px;height:80px;flex-shrink:0;display:flex;align-items:center;justify-content:center;'><span style='font-size:80px;line-height:1;position:relative;top:-4px;'>💾</span></div><span style='font-size:26px;line-height:1;letter-spacing:.2px;'>KM Kaydet</span>";
  btn.style.background = "linear-gradient(135deg,#16a085,#0e8a72)";
  btn.onclick = function(){ kmTakipKaydet(); };
}

// KM okuma tuşunu tekrar "KM Gir" (fotoğraf çek) durumuna döndürür —
// yeni bir güne geçildiğinde veya kayıt henüz yapılmamışken çağrılır.
function kmKmFotoBtnOkumaModunaGecir(){
  var btn = document.getElementById("kmKmFotoBtn");
  if(!btn) return;
  btn.innerHTML = "<div style='width:80px;height:80px;flex-shrink:0;display:flex;align-items:center;justify-content:center;'><span style='font-size:80px;line-height:1;position:relative;top:-4px;'>📷</span></div><span style='font-size:26px;line-height:1;letter-spacing:.2px;'>KM Gir</span>";
  btn.style.background = "linear-gradient(135deg,#3d76a3,#2c5a80)";
  btn.onclick = function(){ document.getElementById("kmKmFotoInput").click(); };
}

function kmTakipGunDegistir(fark){
  kmTakipKaydet(true);
  kmAktifTarih.setDate(kmAktifTarih.getDate()+fark);
  kmGunKayitYukle(kmAktifTarih);
}
function kmTakipBugun(){
  kmTakipKaydet(true);
  kmAktifTarih = new Date();
  kmGunKayitYukle(kmAktifTarih);
}

function kmTakipKaydet(sessiz){
  if(kmBaslangicGerekliMi()){
    kmAyBasiKontrolEt();
    return;
  }
  var gunTipiKontrol = document.getElementById("kmGunTipiSelect").value;
  if(!sessiz && gunTipiKontrol === "normal"){
    // SADECE Sayaçtaki KM zorunlu — Güzergah/Ziyaret/Kategori gün içinde
    // sonradan doldurulabilir (kullanıcının istediği akış: sabah tek başına
    // KM gir → kaydet; güzergah/ziyaret/kategori günün ilerleyen saatlerinde
    // ayrıca girilir). Tarih/Saat zaten otomatik dolduğu için pratikte hiç
    // eksik çıkmaz, yine de güvenlik amacıyla kontrolde tutuluyor.
    var eksikler = [];
    if(!(document.getElementById("kmBitisKmInput").value||"").trim()) eksikler.push("KM");
    if(!(document.getElementById("kmTarihGosterInput").value||"").trim()) eksikler.push("Tarih");
    if(!(document.getElementById("kmSaatInput").value||"").trim()) eksikler.push("Saat");
    if(eksikler.length){
      var mesaj = "⚠️ Eksik bilgi(ler): " + eksikler.join(", ") + " — lütfen doldurup tekrar kaydedin.";
      if(typeof showToast==="function") showToast(mesaj); else alert(mesaj);
      kmEksikAlanlariIsaretle(eksikler);
      return;
    }
  }
  var anahtar = kmTarihAnahtari(kmAktifTarih);
  var gunTipi = document.getElementById("kmGunTipiSelect").value;
  var kmDeger = document.getElementById("kmBitisKmInput").value ? parseFloat(document.getElementById("kmBitisKmInput").value) : null;
  var kayit = {
    tarih: anahtar,
    gunTipi: gunTipi,
    km: kmDeger,
    saat: document.getElementById("kmSaatInput").value.trim(),
    tarihGosterim: document.getElementById("kmTarihGosterInput").value.trim(),
    guzergah: document.getElementById("kmGuzergahInput").value.trim(),
    ziyaretYerleri: document.getElementById("kmZiyaretYerleriInput").value.trim(),
    ozelKm: document.getElementById("kmOzelKmInput").value ? parseFloat(document.getElementById("kmOzelKmInput").value) : null,
    kmKategori: document.getElementById("kmKategoriSelect").value || "is"
  };
  // Boş bir gün ise (hiçbir şey girilmemiş, normal tipte) kaydı sil
  var bosMu = gunTipi==="normal" && !kayit.km && !kayit.guzergah && !kayit.ziyaretYerleri && !kayit.ozelKm;
  if(bosMu){ delete kmTakipKayitlariObj[anahtar]; }
  else { kmTakipKayitlariObj[anahtar] = kayit; }

  lsSet("weicon_km_kayitlari", kmTakipKayitlariObj);
  kmDurumCubuguGuncelle();

  // "Excel'e kaydedildi" mesajı ARTIK sadece Firebase'den GERÇEK yazma onayı
  // geldikten sonra gösterilir. Buton basılır basılmaz "kaydediliyor" gösterilir;
  // sonuç ne olursa olsun (onaylandı / kuyruğa alındı / hata) doğru durum
  // kullanıcıya yansıtılır — asla iyimser/yanlış bir "kaydedildi" mesajı verilmez.
  if(!sessiz) kmExcelBannerGoster("kaydediliyor");

  kmGuvenliKaydet({anahtar:anahtar, kayit:bosMu?null:kayit, silinsinMi:bosMu}).then(function(sonuc){
    sonuc = sonuc || {};
    if(!bosMu) kmFormKilitleGoster(true);
    if(!sessiz){
      if(sonuc.onaylandi){
        var simdi = new Date();
        var simdiSaat = ("0"+simdi.getHours()).slice(-2)+":"+("0"+simdi.getMinutes()).slice(-2);
        kmExcelBannerGoster("onaylandi", simdiSaat+"'te doğrulandı");
        if(typeof showToast==="function") showToast("✓ Gün kaydedildi ve Excel'e işlendi.");
      } else if(sonuc.kuyruklandi){
        kmExcelBannerGoster("kuyrukta");
        if(typeof showToast==="function") showToast("⚠️ Bağlantı yok, kayıt kuyruğa alındı — Excel'e henüz işlenmedi.");
      } else {
        kmExcelBannerGoster("hata");
        if(typeof showToast==="function") showToast("❌ Excel'e kaydedilemedi, tekrar deneyin.");
      }
      localStorage.removeItem("weicon_km_ertele_bitis");
      if(typeof kmErtelemeButonuGuncelle==="function") kmErtelemeButonuGuncelle();
    }
  }).catch(function(e){
    console.error("Firebase yazma hatası:", e);
    if(!sessiz){
      kmExcelBannerGoster("hata");
      if(typeof showToast==="function") showToast("❌ Excel'e kaydedilemedi, tekrar deneyin.");
    }
  });
}

function kmTakipAyDegistir(fark){
  kmAktifAy += fark;
  if(kmAktifAy>11){ kmAktifAy=0; kmAktifYil++; }
  if(kmAktifAy<0){ kmAktifAy=11; kmAktifYil--; }
  kmTakipAylikTabloRenderEt();
}

// Aylık tablo artık Excel çıktısıyla BİREBİR AYNI 8 sütun: Tarih | Başlangıç-Bitiş
// Saati | Seyir Güzergahı | Ziyaret Yerleri | Başlangıç KM | Bitiş KM | İş KM | Özel KM.
// Gün Tipi seçimi Tarih hücresinin altına küçük bir kutu olarak gömülüdür (ayrı
// sütun DEĞİL). Kategori (İş/Özel) seçimi de İş KM / Özel KM hücresine dokunularak
// yapılır — ayrı bir Kategori sütunu yoktur. Böylece görünen sütunlar Excel ile
// tıpatıp aynıdır; ekstra alanlar sadece hücre içi küçük kontrollerdir.
function kmTakipAylikTabloRenderEt(){
  document.getElementById("kmAyBasligiEtiket").textContent = KM_AY_ADLARI[kmAktifAy]+" "+kmAktifYil;
  var donemInput = document.getElementById("kmDonemEtiketInput");
  if(!donemInput.value || donemInput.dataset.oto==="1"){
    donemInput.value = KM_AY_ADLARI[kmAktifAy]+" "+kmAktifYil;
    donemInput.dataset.oto = "1";
  }

  var aktifEl = document.activeElement;
  var odakAnahtar = (aktifEl && aktifEl.dataset && aktifEl.dataset.anahtar) ? aktifEl.dataset.anahtar : null;
  var odakAlan = (aktifEl && aktifEl.dataset && aktifEl.dataset.alan) ? aktifEl.dataset.alan : null;

  var gunSayisi = new Date(kmAktifYil, kmAktifAy+1, 0).getDate();
  var bugunAnahtari = kmTarihAnahtari(new Date());
  var satirlar = [];
  for(var g=1; g<=gunSayisi; g++){
    var d = new Date(kmAktifYil, kmAktifAy, g);
    var anahtar = kmTarihAnahtari(d);
    var kayitVarMi = !!kmTakipKayitlariObj[anahtar];
    // Sistem SADECE fotoğrafın çekildiği (kaydın gerçekten girildiği) günleri baz
    // alır — takvimde ardışık gitmek zorunda değil. Fotoğraf/kayıt olmayan bir gün
    // (bugün dahil) tabloda hiç görünmez, aradaki tarihler tamamen atlanır.
    if(!kayitVarMi) continue;
    var kayit = kmTakipKayitlariObj[anahtar] || {};
    satirlar.push({tarih:d, anahtar:anahtar, kayit:kayit});
  }

  function esc(v){ return (v===undefined||v===null) ? "" : String(v).replace(/"/g,"&quot;"); }
  // Excel/tablo görünümüyle birebir: hücreler düz görünür (görünmez kenarlıklı,
  // saydam zeminli input), sadece odaklanınca hafif çerçeve belirir.
  var HUCRE_STIL = "width:100%;border:none;background:transparent;font-size:15px;font-weight:600;color:#111;padding:6px 4px;box-sizing:border-box;text-align:center;outline:none;";
  function metinKutu(anahtar, alan, deger){
    return "<input type='text' data-anahtar='"+anahtar+"' data-alan='"+alan+"' value=\""+esc(deger)+"\" onchange=\"kmAylikHucreDegisti(this)\" style='"+HUCRE_STIL+"'>";
  }
  function kmKutu(anahtar, alan, deger){
    return "<input type='number' data-anahtar='"+anahtar+"' data-alan='"+alan+"' value=\""+esc(deger)+"\" onchange=\"kmAylikHucreDegisti(this)\" style='"+HUCRE_STIL+"'>";
  }

  var TH_STIL = "padding:8px 6px;border:1px solid #3569b8;background:#cfe2f3;color:#3569b8;font-weight:700;font-size:15px;text-align:center;";
  var TD_STIL = "padding:0;border:1px solid #3569b8;text-align:center;";

  var tablo = document.getElementById("kmRaporTablo");
  var html = "<thead><tr>"
    +"<th style='"+TH_STIL+"text-align:left;padding-left:6px;width:13%;'>Tarih</th>"
    +"<th style='"+TH_STIL+"width:12%;'>Saat</th>"
    +"<th style='"+TH_STIL+"width:15%;'>Güzergah</th>"
    +"<th style='"+TH_STIL+"width:15%;'>Ziyaret</th>"
    +"<th style='"+TH_STIL+"width:12%;'>Başl. KM</th>"
    +"<th style='"+TH_STIL+"width:12%;'>Bitiş KM</th>"
    +"<th style='"+TH_STIL+"width:11%;'>İş KM</th>"
    +"<th style='"+TH_STIL+"width:10%;'>Özel KM</th>"
    +"</tr></thead><tbody>";

  // OTOMATİK KURALLAR:
  // 1) Bir günün Başlangıç KM'si boşsa, bir önceki günün Bitiş KM'si otomatik
  //    olarak o kutuya yazılır (araç kilometresi süreklidir).
  // 2) Bitiş KM - Başlangıç KM farkı, o gün için seçili kategoriye (İş/Özel
  //    KM hücresine dokunarak seçilir) göre otomatik olarak ilgili hücreye
  //    yazılır. Kullanıcı isterse üzerine yazıp elle değiştirebilir.
  satirlar.forEach(function(s){
    var tarihStr = ("0"+s.tarih.getDate()).slice(-2)+"."+("0"+(s.tarih.getMonth()+1)).slice(-2)+"."+s.tarih.getFullYear();
    var gunAdiStr = KM_GUN_ADLARI[s.tarih.getDay()];

    var baslangicKm;
    if(s.kayit.km!==undefined && s.kayit.km!==null && s.kayit.km!==""){
      baslangicKm = s.kayit.km;
    } else {
      var oncekiKm = kmOncekiKmBul(s.anahtar);
      baslangicKm = (oncekiKm!==null && oncekiKm!==undefined) ? oncekiKm : "";
    }

    var bitisKmDeger;
    if(s.kayit.bitisKm!==undefined && s.kayit.bitisKm!==null){
      bitisKmDeger = s.kayit.bitisKm;
    } else {
      // Elle Bitiş KM girilmemişse: Günlük Kayıt'tan gelen bir sonraki günün
      // KENDİ KM okuması otomatik olarak bu günün Bitiş KM'si sayılır
      // (araç kilometresi süreklidir — bugünün bitişi = yarının okuması).
      var otomBitis = kmSonrakiKmBul(s.anahtar);
      bitisKmDeger = (otomBitis!==null && otomBitis!==undefined) ? otomBitis : "";
    }
    var fark = kmFarkHesapla(bitisKmDeger, baslangicKm);
    var kategori = s.kayit.kmKategori || "is";

    var isKmDeger;
    if(s.kayit.isKm!==undefined && s.kayit.isKm!==null){
      isKmDeger = s.kayit.isKm;
    } else {
      isKmDeger = (fark!==null && kategori==="is") ? fark : "";
    }
    var ozelKmDeger;
    if(s.kayit.ozelKm!==undefined && s.kayit.ozelKm!==null){
      ozelKmDeger = s.kayit.ozelKm;
    } else {
      ozelKmDeger = (fark!==null && kategori==="ozel") ? fark : "";
    }

    var ozelKmVarMi = ozelKmDeger!==undefined && ozelKmDeger!==null && ozelKmDeger!=="";
    var ozelKmSatirBg = ozelKmVarMi ? "background:#fdf8e0;" : "";
    var tarihHucre = "<td style='"+TD_STIL+ozelKmSatirBg+"text-align:left;padding:6px 4px 6px 10px;white-space:nowrap;font-weight:700;font-size:14px;line-height:1.3;'>"+tarihStr+"<br><span style='font-weight:600;color:#667;font-size:12px;'>"+gunAdiStr+"</span></td>";

    html += "<tr"+(ozelKmVarMi?" style='"+ozelKmSatirBg+"'":"")+">"
      + tarihHucre
      + "<td style='"+TD_STIL+ozelKmSatirBg+"'>"+metinKutu(s.anahtar,"saat",s.kayit.saat)+"</td>"
      + "<td style='"+TD_STIL+ozelKmSatirBg+"'>"+metinKutu(s.anahtar,"guzergah",s.kayit.guzergah)+"</td>"
      + "<td style='"+TD_STIL+ozelKmSatirBg+"'>"+metinKutu(s.anahtar,"ziyaretYerleri",s.kayit.ziyaretYerleri)+"</td>"
      + "<td style='"+TD_STIL+ozelKmSatirBg+"'>"+kmKutu(s.anahtar,"km",baslangicKm)+"</td>"
      + "<td style='"+TD_STIL+ozelKmSatirBg+"'>"+kmKutu(s.anahtar,"bitisKm",bitisKmDeger)+"</td>"
      + "<td onclick=\"kmAylikKategoriSec('"+s.anahtar+"','is')\" style='"+TD_STIL+ozelKmSatirBg+"'>"+kmKutu(s.anahtar,"isKm",isKmDeger)+"</td>"
      + "<td onclick=\"kmAylikKategoriSec('"+s.anahtar+"','ozel')\" style='"+TD_STIL+ozelKmSatirBg+"'>"+kmKutu(s.anahtar,"ozelKm",ozelKmDeger)+"</td>"
      + "</tr>";
  });

  html += "</tbody>";
  tablo.innerHTML = html;
  tablo.style.borderCollapse = "collapse";

  // Herhangi bir satıra BASILI TUTULURSA (500ms), o günün tüm bilgilerini tek
  // popup'ta düzenleyebileceğimiz ekranı açar. Var olan hücre-içi düzenleme
  // (input'a dokunup yazma) de aynen çalışmaya devam eder.
  //
  // ÖNEMLİ DÜZELTME: Eskiden dokunma anında tarayıcı hücreyi HEMEN odaklayıp
  // klavyeyi açıyordu (native davranış), biz 500ms sonra popup'ı bunun ÜSTÜNE
  // açıyorduk — bu da "popup, kutunun içine giriyor ve yanlış yazıma neden
  // oluyor" şikayetine yol açıyordu. Artık dokunma anında native odaklanmayı
  // BİZ engelliyoruz (preventDefault); basılı tutma tamamlanmadan parmak
  // kalkarsa (kısa/normal dokunuş) hücreyi KENDİMİZ odaklıyoruz — yani tek
  // dokunuşla düzenleme aynen çalışır ama klavye popup'la asla çakışmaz.
  // Sürükleme/scroll varsa basılı tutma iptal edilir.
  var satirElemanlari = tablo.querySelectorAll("tbody tr");
  satirElemanlari.forEach(function(trEl, i){
    var s = satirlar[i];
    if(!s) return;
    var zamanlayici = null;
    var dokunmaHedefi = null;
    var baslangicX = 0, baslangicY = 0;
    var basiliTutBaslat = function(e){
      dokunmaHedefi = e.target;
      if(e.touches && e.touches[0]){ baslangicX = e.touches[0].clientX; baslangicY = e.touches[0].clientY; }
      if(e.cancelable) e.preventDefault(); // native odaklanma/klavye açılmasını erteliyoruz
      zamanlayici = setTimeout(function(){
        zamanlayici = null;
        dokunmaHedefi = null;
        kmGunDuzenlePopupAc(s.anahtar);
      }, 500);
    };
    var basiliTutBirak = function(){
      if(zamanlayici){
        // Kısa dokunuş — popup açılmadı, normal düzenleme odaklanmasını biz tetikliyoruz.
        clearTimeout(zamanlayici);
        zamanlayici = null;
        if(dokunmaHedefi && dokunmaHedefi.focus) dokunmaHedefi.focus();
        dokunmaHedefi = null;
      }
    };
    var basiliTutIptal = function(){
      if(zamanlayici){ clearTimeout(zamanlayici); zamanlayici = null; }
      dokunmaHedefi = null;
    };
    // Parmağın en ufak titremesinde (gerçek kaydırma olmadan) basılı tutma iptal
    // OLMASIN diye 12px'lik bir eşik mesafe var — sadece bu eşiği aşan gerçek
    // bir sürükleme/scroll hareketinde basılı tutma iptal edilir.
    var basiliTutHareket = function(e){
      if(!zamanlayici || !e.touches || !e.touches[0]) return;
      var dx = e.touches[0].clientX - baslangicX;
      var dy = e.touches[0].clientY - baslangicY;
      if(Math.sqrt(dx*dx + dy*dy) > 12) basiliTutIptal();
    };
    trEl.addEventListener("touchstart", basiliTutBaslat, {passive:false});
    trEl.addEventListener("touchend", basiliTutBirak);
    trEl.addEventListener("touchmove", basiliTutHareket, {passive:true});
    trEl.addEventListener("touchcancel", basiliTutIptal);
    // Masaüstü/mouse ile test için: burada native odaklanma zaten sorun
    // yaratmadığından preventDefault gerekmez, davranış olduğu gibi bırakıldı.
    trEl.addEventListener("mousedown", function(e){
      dokunmaHedefi = e.target;
      zamanlayici = setTimeout(function(){ zamanlayici=null; dokunmaHedefi=null; kmGunDuzenlePopupAc(s.anahtar); }, 500);
    });
    trEl.addEventListener("mouseup", basiliTutIptal);
    trEl.addEventListener("mouseleave", basiliTutIptal);
  });

  // Düzenleme sırasında odak kaybolmasın diye, aynı hücreye tekrar odaklan
  if(odakAnahtar && odakAlan){
    var yeniden = tablo.querySelector("[data-anahtar='"+odakAnahtar+"'][data-alan='"+odakAlan+"']");
    if(yeniden) yeniden.focus();
  }
}

// İş KM / Özel KM hücresine dokunularak o günün kategorisini seçme (ayrı bir
// Kategori sütunu olmadan, Excel'deki 8 sütun görünümünü bozmadan).
function kmAylikKategoriSec(anahtar, kategori){
  var kayit = kmTakipKayitlariObj[anahtar];
  if(!kayit){
    var parcalar = anahtar.split("-");
    var tarihObj = new Date(parseInt(parcalar[0]), parseInt(parcalar[1])-1, parseInt(parcalar[2]));
    kayit = { tarih: anahtar, gunTipi: kmVarsayilanGunTipi(tarihObj) };
  }
  kayit.kmKategori = kategori;
  kayit.isKm = null;
  kayit.ozelKm = null;
  kmTakipKayitlariObj[anahtar] = kayit;
  kmAylikGunYenidenHesapla(anahtar);
  kmDegisiklikKaydet(anahtar);
  kmAylikTabloKaydet();
  kmTakipAylikTabloRenderEt();
}

// Tablodaki herhangi bir hücre değiştirildiğinde çağrılır: ilgili günün
// kaydını (yoksa oluşturarak) günceller, yerelde ve Firebase'de saklar,
// başlangıç/bitiş KM zincirinin doğru görünmesi için tabloyu yeniden çizer.
// "+ Gün Ekle" kutusu: tablo artık sadece kayıtlı günleri gösterdiği için, izin/tatil
// gibi Günlük Kayıt'tan geçmeyen bir günü elle eklemek istediğinde bu kullanılır.
// Seçilen tarih için (henüz kaydı yoksa) boş bir kayıt oluşturur, gerekiyorsa o ayı
// gösterir ve tabloyu yeniden çizip o günün Başlangıç KM alanına odaklanır.
function kmAylikGunEkle(){
  var girdi = document.getElementById("kmGunEkleTarihInput");
  if(!girdi || !girdi.value){ showToast("Önce bir tarih seçin."); return; }
  var parcalar = girdi.value.split("-"); // "YYYY-MM-DD"
  var yil = parseInt(parcalar[0]), ay = parseInt(parcalar[1])-1, gun = parseInt(parcalar[2]);
  var tarihObj = new Date(yil, ay, gun);
  var anahtar = kmTarihAnahtari(tarihObj);

  if(!kmTakipKayitlariObj[anahtar]){
    kmTakipKayitlariObj[anahtar] = { tarih: anahtar, gunTipi: kmVarsayilanGunTipi(tarihObj) };
    kmDegisiklikKaydet(anahtar);
    kmAylikTabloKaydet();
  }

  kmAktifYil = yil;
  kmAktifAy = ay;
  kmTakipAylikTabloRenderEt();
  girdi.value = "";
  showToast("✓ "+("0"+gun).slice(-2)+"."+("0"+(ay+1)).slice(-2)+"."+yil+" tabloya eklendi.");
  setTimeout(function(){
    var hedef = document.querySelector("[data-anahtar='"+anahtar+"'][data-alan='km']");
    if(hedef) hedef.focus();
  }, 50);
}

function kmAylikHucreDegisti(el){
  var anahtar = el.dataset.anahtar;
  var alan = el.dataset.alan;
  var deger = el.value;

  var kayit = kmTakipKayitlariObj[anahtar];
  if(!kayit){
    var parcalar = anahtar.split("-");
    var tarihObj = new Date(parseInt(parcalar[0]), parseInt(parcalar[1])-1, parseInt(parcalar[2]));
    kayit = { tarih: anahtar, gunTipi: kmVarsayilanGunTipi(tarihObj), kmKategori:"is" };
  }

  if(alan==="km" || alan==="ozelKm" || alan==="bitisKm" || alan==="isKm"){
    kayit[alan] = (deger==="") ? null : parseFloat(deger.replace(",", "."));
  } else if(alan==="gunTipi"){
    kayit.gunTipi = deger;
  } else {
    kayit[alan] = deger.trim();
  }

  var bosMu = !kayit.km && !kayit.bitisKm && !kayit.isKm && !kayit.ozelKm
    && !kayit.guzergah && !kayit.ziyaretYerleri && !kayit.saat && !kayit.tarihGosterim;
  if(bosMu){ delete kmTakipKayitlariObj[anahtar]; }
  else { kmTakipKayitlariObj[anahtar] = kayit; }

  if(!bosMu){
    if(alan==="km" || alan==="bitisKm"){
      // Başlangıç/Bitiş KM değiştiyse, o günün İş/Özel KM farkını seçili
      // kategoriye göre otomatik yeniden hesapla.
      kmAylikGunYenidenHesapla(anahtar);
    }
    if(alan==="bitisKm"){
      // Bugünün Bitiş KM'si, yarının Başlangıç KM'sine otomatik aktarılır.
      kmAylikBitisKmSonrakiGuneAktar(anahtar);
    }
    if(alan==="isKm"){ kayit.kmKategori="is"; kayit.ozelKm=null; }
    if(alan==="ozelKm"){ kayit.kmKategori="ozel"; kayit.isKm=null; }
  }

  kmDegisiklikKaydet(anahtar);
  kmAylikTabloKaydet();
  kmTakipAylikTabloRenderEt();
  // Aynı anda açık olan Günlük Kayıt ekranı bu güne bakıyorsa, orayı da tazele.
  if(kmTarihAnahtari(kmAktifTarih)===anahtar && document.getElementById("kmGunlukView").style.display!=="none"){
    kmGunKayitYukle(kmAktifTarih);
  }
}

var kmAylikTabloKaydet = debounce(function(){
  lsSet("weicon_km_kayitlari", kmTakipKayitlariObj);
  // Bu genel kaydetme birden çok yerden (hücre düzenleme, gün ekleme/silme,
  // zincirleme bitiş-KM aktarımı) çağrılıyor — hangi günlerin değiştiğini
  // kmBekleyenDegisiklikler kuyruğu tutuyor. Kuyrukta bir şey varsa SADECE o
  // günleri güvenli birleştirerek yazıyoruz (tüm ayı ham üzerine yazmıyoruz).
  // Kuyruk boşsa (bilinmeyen bir çağrı yolu), son çare olarak eski davranışa
  // (ham üzerine yazma) düşüyoruz — ama bu artık istisna, kural değil.
  var degisiklikler = kmBekleyenDegisiklikler.slice();
  kmBekleyenDegisiklikler = [];
  if(degisiklikler.length>0){
    kmGuvenliKaydet(degisiklikler).catch(function(e){ console.error("Firebase yazma hatası:", e); });
  } else if(window.fbSet){
    window.fbSet("kmTakip", kmTakipKayitlariObj).catch(function(e){ console.error("Firebase yazma hatası:", e); });
  }
  if(typeof showToast==="function") showToast("✓ Kaydedildi.", 1200);
}, 600);

// Bir güne BASILI TUTULUNCA açılan tam-detay düzenleme popup'ı — o günün TÜM
// alanlarını (gün tipi, saat, güzergah, ziyaret yerleri, başlangıç/bitiş KM,
// iş/özel KM, kategori) tek ekranda gösterir ve hepsini birden değiştirmeyi
// sağlar. Geçmişe dönük herhangi bir günü (bugün olmasa bile) düzenlemek için.
var kmGunDuzenleAktifAnahtar = null;
function kmGunDuzenlePopupAc(anahtar){
  kmGunDuzenleAktifAnahtar = anahtar;
  var kayit = kmTakipKayitlariObj[anahtar] || {};
  var parcalar = anahtar.split("-");
  var tarihObj = new Date(parseInt(parcalar[0]), parseInt(parcalar[1])-1, parseInt(parcalar[2]));
  var tarihStr = ("0"+tarihObj.getDate()).slice(-2)+"."+("0"+(tarihObj.getMonth()+1)).slice(-2)+"."+tarihObj.getFullYear();
  document.getElementById("kmGunDuzenleBaslik").textContent = "📅 "+tarihStr+" — "+KM_GUN_ADLARI[tarihObj.getDay()];
  document.getElementById("kmGunDuzenleGunTipi").value = kayit.gunTipi || kmVarsayilanGunTipi(tarihObj);
  document.getElementById("kmGunDuzenleSaat").value = kayit.saat || "";
  document.getElementById("kmGunDuzenleGuzergah").value = kayit.guzergah || "";
  document.getElementById("kmGunDuzenleZiyaret").value = kayit.ziyaretYerleri || "";
  document.getElementById("kmGunDuzenleBaslangicKm").value = (kayit.km!==undefined && kayit.km!==null) ? kayit.km : "";
  document.getElementById("kmGunDuzenleBitisKm").value = (kayit.bitisKm!==undefined && kayit.bitisKm!==null) ? kayit.bitisKm : "";
  document.getElementById("kmGunDuzenleKategori").value = kayit.kmKategori || "is";
  document.getElementById("kmGunDuzenleIsKm").value = (kayit.isKm!==undefined && kayit.isKm!==null) ? kayit.isKm : "";
  document.getElementById("kmGunDuzenleOzelKm").value = (kayit.ozelKm!==undefined && kayit.ozelKm!==null) ? kayit.ozelKm : "";
  document.getElementById("kmGunDuzenleModal").style.display="flex";
}

function kmGunDuzenleKapat(){
  document.getElementById("kmGunDuzenleModal").style.display="none";
  kmGunDuzenleAktifAnahtar = null;
}

function kmGunDuzenleKaydet(){
  if(!kmGunDuzenleAktifAnahtar) return;
  var anahtar = kmGunDuzenleAktifAnahtar;
  var parcalar = anahtar.split("-");
  var tarihObj = new Date(parseInt(parcalar[0]), parseInt(parcalar[1])-1, parseInt(parcalar[2]));
  var numara = function(id){
    var v = document.getElementById(id).value;
    return (v==="" || v===null) ? null : parseFloat(String(v).replace(",", "."));
  };
  var kayit = {
    tarih: anahtar,
    gunTipi: document.getElementById("kmGunDuzenleGunTipi").value || kmVarsayilanGunTipi(tarihObj),
    saat: document.getElementById("kmGunDuzenleSaat").value.trim(),
    guzergah: document.getElementById("kmGunDuzenleGuzergah").value.trim(),
    ziyaretYerleri: document.getElementById("kmGunDuzenleZiyaret").value.trim(),
    km: numara("kmGunDuzenleBaslangicKm"),
    bitisKm: numara("kmGunDuzenleBitisKm"),
    kmKategori: document.getElementById("kmGunDuzenleKategori").value || "is",
    isKm: numara("kmGunDuzenleIsKm"),
    ozelKm: numara("kmGunDuzenleOzelKm")
  };
  kmTakipKayitlariObj[anahtar] = kayit;
  kmDegisiklikKaydet(anahtar);
  kmAylikTabloKaydet();
  kmGunDuzenleKapat();
  kmTakipAylikTabloRenderEt();
  if(typeof showToast==="function") showToast("✓ Gün güncellendi.");
}

// "🗑 Bu Günü Tamamen Sil" — önce net bir onay ister (kalıcı silme, geri
// alınamaz), onaylanırsa kaydı tamamen kaldırır ve tabloyu yeniden çizer.
function kmGunDuzenleSilOnay(){
  if(!kmGunDuzenleAktifAnahtar) return;
  var anahtar = kmGunDuzenleAktifAnahtar;
  var parcalar = anahtar.split("-");
  var tarihStr = parcalar[2]+"."+parcalar[1]+"."+parcalar[0];
  if(!confirm("📅 "+tarihStr+" tarihli kaydı TAMAMEN silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.")) return;
  delete kmTakipKayitlariObj[anahtar];
  kmDegisiklikKaydet(anahtar);
  kmAylikTabloKaydet();
  kmGunDuzenleKapat();
  kmTakipAylikTabloRenderEt();
  if(typeof showToast==="function") showToast("🗑 "+tarihStr+" silindi.");
}

// Ana Sayfa'dan doğrudan Aylık (düzenlenebilir) tabloya geçiş
function anaSayfadanAylikKmAc(ev){
  if(ev) ev.stopPropagation();
  window.kmSonrakiHedefGorunum = "aylik";
  switchTab(10);
}

function kmTakipGunTikla(anahtar){
  var parcalar = anahtar.split("-");
  kmAktifTarih = new Date(parseInt(parcalar[0]), parseInt(parcalar[1])-1, parseInt(parcalar[2]));
  kmTakipGorunumDegistir("gunluk");
  kmGunKayitYukle(kmAktifTarih);
}

function kmTakipExcelIndir(){
  if(typeof XLSX === "undefined"){
    alert("Excel kütüphanesi yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.");
    return;
  }
  var gunSayisi = new Date(kmAktifYil, kmAktifAy+1, 0).getDate();
  var satirlar = [];
  for(var g=1; g<=gunSayisi; g++){
    var d = new Date(kmAktifYil, kmAktifAy, g);
    var anahtar = kmTarihAnahtari(d);
    var kayit = kmTakipKayitlariObj[anahtar];
    if(!kayit) continue;
    satirlar.push({tarih:d, anahtar:anahtar, kayit:kayit});
  }

  var veriSatirlari = [];
  var BAS_SATIR = 3; // aoa: 0=başlık satırı,1=boş,2=kolon başlıkları -> veri 3. satırdan (0-index) başlıyor
  var i = 0;
  while(i < satirlar.length){
    var s = satirlar[i];
    var normalMi = (s.kayit.gunTipi||"normal") === "normal";
    var tarihStr = ("0"+s.tarih.getDate()).slice(-2)+"."+("0"+(s.tarih.getMonth()+1)).slice(-2)+"."+s.tarih.getFullYear()+"\n"+KM_GUN_ADLARI[s.tarih.getDay()];
    var baslangicKm;
    if(s.kayit.km!==undefined && s.kayit.km!==null && s.kayit.km!==""){
      baslangicKm = s.kayit.km;
    } else {
      var oncekiKayitEx = kmTakipKayitlariObj[kmAnahtarKaydir(s.anahtar,-1)];
      baslangicKm = (oncekiKayitEx && oncekiKayitEx.bitisKm!==undefined && oncekiKayitEx.bitisKm!==null && oncekiKayitEx.bitisKm!=="") ? oncekiKayitEx.bitisKm : "";
    }
    var bitisKm;
    if(s.kayit.bitisKm!==undefined && s.kayit.bitisKm!==null){
      bitisKm = s.kayit.bitisKm;
    } else {
      var otomBitisEx = kmSonrakiKmBul(s.anahtar);
      bitisKm = (otomBitisEx!==null && otomBitisEx!==undefined) ? otomBitisEx : "";
    }
    var farkEx = kmFarkHesapla(bitisKm, baslangicKm);
    var kategoriEx = s.kayit.kmKategori || "is";
    var isKm;
    if(s.kayit.isKm!==undefined && s.kayit.isKm!==null){
      isKm = s.kayit.isKm;
    } else {
      isKm = (farkEx!==null && kategoriEx==="is") ? farkEx : "";
    }
    var ozelKmYazilacak;
    if(s.kayit.ozelKm!==undefined && s.kayit.ozelKm!==null){
      ozelKmYazilacak = s.kayit.ozelKm;
    } else {
      ozelKmYazilacak = (farkEx!==null && kategoriEx==="ozel") ? farkEx : "";
    }

    var guzergahYazilacak = s.kayit.guzergah || (normalMi ? "" : (KM_GUN_TIPI_ETIKET[s.kayit.gunTipi] || ""));
    veriSatirlari.push([tarihStr, s.kayit.saat||"", guzergahYazilacak, s.kayit.ziyaretYerleri||"", baslangicKm, bitisKm, isKm, ozelKmYazilacak]);
    i++;
  }

  var donemEtiket = document.getElementById("kmDonemEtiketInput").value.trim() || (KM_AY_ADLARI[kmAktifAy]+" "+kmAktifYil);
  var basliklar = ["Tarih","Başlangıç-Bitiş Saati","Seyir Güzergahı","Ziyaret Yerleri","Başlangıç KM","Bitiş KM","İş KM","Özel KM"];

  var aoa = [
    ["AD SOYAD", kmTakipAyarlariObj.adSoyad||"", "", "", "DÖNEM", donemEtiket, "PLAKA", kmTakipAyarlariObj.plaka||""],
    [],
    basliklar
  ].concat(veriSatirlari);

  var ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{wch:20},{wch:16},{wch:22},{wch:22},{wch:12},{wch:12},{wch:10},{wch:10}];

  var INCE_KENAR = { style:"thin", color:{rgb:"3569B8"} };
  var TUM_KENAR = { top:INCE_KENAR, bottom:INCE_KENAR, left:INCE_KENAR, right:INCE_KENAR };
  var SUTUN_SAYISI = 8;

  // Kolon başlıkları satırı (3. satır, 0-index BAS_SATIR-1): açık mavi zemin, kalın, ortalı.
  for(var hc=0; hc<SUTUN_SAYISI; hc++){
    var basAdr = XLSX.utils.encode_cell({r:BAS_SATIR-1, c:hc});
    if(!ws[basAdr]) ws[basAdr] = { t:"s", v:"" };
    ws[basAdr].s = {
      fill: { patternType:"solid", fgColor:{rgb:"CFE2F3"}, bgColor:{rgb:"CFE2F3"} },
      font: { bold:true, color:{rgb:"3569B8"} },
      alignment: { horizontal:"center", vertical:"center", wrapText:true },
      border: TUM_KENAR
    };
  }

  // Veri satırları: tek satır, kenarlıklı, Tarih sola / diğerleri ortaya hizalı.
  for(var vr=0; vr<veriSatirlari.length; vr++){
    var mutlakSatir = BAS_SATIR + vr;
    for(var vc=0; vc<SUTUN_SAYISI; vc++){
      var vAdr = XLSX.utils.encode_cell({r:mutlakSatir, c:vc});
      if(!ws[vAdr]) ws[vAdr] = { t:"s", v:"" };
      ws[vAdr].s = {
        alignment: { horizontal: (vc===0?"left":"center"), vertical:"center", wrapText:(vc===0) },
        border: TUM_KENAR
      };
    }
  }

  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "KM Takip");
  var dosyaAdi = ((kmTakipAyarlariObj.plaka||"KM").replace(/\s/g,"_"))+"_"+donemEtiket.replace(/\s/g,"_")+".xlsx";
  XLSX.writeFile(wb, dosyaAdi);
  if(typeof showToast==="function") showToast("✓ Excel dosyası indirildi.");
}

// ============ ZİYARET TAKVİMİ ============
var ziyaretTakvimYil, ziyaretTakvimAy; // ay: 0-11
(function(){ var d=new Date(); ziyaretTakvimYil=d.getFullYear(); ziyaretTakvimAy=d.getMonth(); })();
var AY_ADLARI = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function anaSayfadanZiyaretTakvimiAc(){
  switchTab(9);
  setTimeout(function(){
    var wrap = document.getElementById("ziyaretTakvimWrap");
    if(wrap && wrap.style.display==="none"){
      ziyaretTakvimiAcKapa();
    }
    var btn = document.getElementById("ziyaretTakvimToggleBtn");
    if(btn) btn.scrollIntoView({behavior:"smooth", block:"start"});
  }, 150);
}

function ziyaretTakvimiAcKapa(){
  var wrap = document.getElementById("ziyaretTakvimWrap");
  var btn = document.getElementById("ziyaretTakvimToggleBtn");
  var sonIslemlerWrap = document.getElementById("sonIslemlerWrap");
  if(!wrap || !btn) return;
  var acik = wrap.style.display !== "none";
  if(acik){
    wrap.style.display = "none";
    btn.innerHTML = "📆 Ziyaret Takvimini Göster ▾";
    if(sonIslemlerWrap) sonIslemlerWrap.style.display = "block";
  } else {
    // Diğer panelleri (Aylık Özet, Ajanda) kapat
    var digerWrap = document.getElementById("aylikOzetWrap");
    var digerBtn = document.getElementById("aylikOzetToggleBtn");
    if(digerWrap) digerWrap.style.display = "none";
    if(digerBtn) digerBtn.innerHTML = "📅 Aylık Sipariş &amp; Prim Özetini Göster ▾";
    var ajWrap = document.getElementById("ajandaWrap");
    var ajBtn = document.getElementById("ajandaToggleBtn");
    if(ajWrap) ajWrap.style.display = "none";
    if(ajBtn) ajBtn.innerHTML = "📓 Günlük Ajanda Göster ▾";

    wrap.style.display = "block";
    btn.innerHTML = "📆 Ziyaret Takvimini Gizle ▴";
    if(sonIslemlerWrap) sonIslemlerWrap.style.display = "none";
    ziyaretTakvimiOlustur();
  }
}

// ============ GÜNLÜK AJANDA ============
var ajandaGosterilenTs = new Date().setHours(0,0,0,0);

function ajandaAcKapa(){
  var wrap = document.getElementById("ajandaWrap");
  var btn = document.getElementById("ajandaToggleBtn");
  var sonIslemlerWrap = document.getElementById("sonIslemlerWrap");
  if(!wrap || !btn) return;
  var acik = wrap.style.display !== "none";
  if(acik){
    wrap.style.display = "none";
    btn.innerHTML = "📓 Günlük Ajanda Göster ▾";
    if(sonIslemlerWrap) sonIslemlerWrap.style.display = "block";
  } else {
    // Diğer panelleri (Aylık Özet, Ziyaret Takvimi) kapat
    var digerWrap1 = document.getElementById("aylikOzetWrap");
    var digerBtn1 = document.getElementById("aylikOzetToggleBtn");
    if(digerWrap1) digerWrap1.style.display = "none";
    if(digerBtn1) digerBtn1.innerHTML = "📅 Aylık Sipariş &amp; Prim Özetini Göster ▾";
    var digerWrap2 = document.getElementById("ziyaretTakvimWrap");
    var digerBtn2 = document.getElementById("ziyaretTakvimToggleBtn");
    if(digerWrap2) digerWrap2.style.display = "none";
    if(digerBtn2) digerBtn2.innerHTML = "📆 Ziyaret Takvimini Göster ▾";

    wrap.style.display = "block";
    btn.innerHTML = "📓 Günlük Ajanda Gizle ▴";
    if(sonIslemlerWrap) sonIslemlerWrap.style.display = "none";
    ajandaOlustur();
  }
}

function ajandaGunDegistir(fark){
  var d = new Date(ajandaGosterilenTs);
  d.setDate(d.getDate()+fark);
  ajandaGosterilenTs = d.setHours(0,0,0,0);
  ajandaOlustur();
}

function ajandaBugune(){
  ajandaGosterilenTs = new Date().setHours(0,0,0,0);
  ajandaOlustur();
}

function ajandaOlustur(){
  var baslikEl = document.getElementById("ajandaTarihBasligi");
  var listeEl = document.getElementById("ajandaListesi");
  if(!baslikEl || !listeEl) return;
  var gununBasi = new Date(ajandaGosterilenTs);
  var GUN_ADLARI = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
  baslikEl.textContent = GUN_ADLARI[gununBasi.getDay()]+", "+("0"+gununBasi.getDate()).slice(-2)+" "+AY_ADLARI[gununBasi.getMonth()]+" "+gununBasi.getFullYear();

  var tumTemaslar = tumZiyaretleriTopla();
  var gununTemaslari = tumTemaslar.filter(function(z){
    var d = new Date(z.ts);
    return d.getFullYear()===gununBasi.getFullYear() && d.getMonth()===gununBasi.getMonth() && d.getDate()===gununBasi.getDate();
  }).map(function(z){ return {tur:"temas", ts:z.ts, musteri:z.musteri, veri:z}; });

  var arsiv = lsGet("weicon_arsiv",{});
  var tipler = ["numune","teklif","proforma","siparis"];
  var gununIslemleri = [];
  tipler.forEach(function(tip){
    (arsiv[tip]||[]).forEach(function(kayit){
      var d = new Date(kayit.ts||0);
      if(d.getFullYear()===gununBasi.getFullYear() && d.getMonth()===gununBasi.getMonth() && d.getDate()===gununBasi.getDate()){
        gununIslemleri.push({tur:"islem", tip:tip, ts:kayit.ts||0, musteri:kayit.musteri||"-", veri:kayit});
      }
    });
  });

  var gununTumKayitlari = gununTemaslari.concat(gununIslemleri).sort(function(a,b){ return a.ts-b.ts; });

  if(gununTumKayitlari.length===0){
    listeEl.innerHTML = "<div style='padding:30px;text-align:center;color:#999;font-size:26px;'>Bu gün için kayıtlı temas veya işlem yok.</div>";
    return;
  }

  var html = "";
  gununTumKayitlari.forEach(function(kayit){
    var saat = new Date(kayit.ts);
    var saatStr = ("0"+saat.getHours()).slice(-2)+":"+("0"+saat.getMinutes()).slice(-2);
    if(kayit.tur==="temas"){
      var z = kayit.veri;
      html += "<div onclick=\"musteriKartVeZiyaretGecmisiniAc('"+z.musteri.replace(/'/g,"\\'")+"')\" style='cursor:pointer;padding:16px 18px;border-bottom:1px dashed #ddd;display:flex;gap:14px;align-items:flex-start;'>"
        +"<div style='flex-shrink:0;white-space:nowrap;'>"+kodHtmlOlustur(z.kod,23,14)+"</div>"
        +"<div style='font-size:26px;color:#888;font-weight:700;min-width:60px;'>"+saatStr+"</div>"
        +"<div style='flex:1;'><div style='font-size:29px;font-weight:800;color:#003a70;'>🏢 "+safeText(z.musteri)+"</div>"
        +(z.kisi && z.kisi.isim ? "<div style='font-size:23px;color:#1a4d8f;font-weight:700;margin-top:1px;'>👤 "+safeText(z.kisi.isim)+"</div>" : "")
        +(z.not ? "<div style='font-size:26px;color:#444;margin-top:2px;'>"+safeText(z.not)+"</div>" : "<div style='font-size:24px;color:#bbb;margin-top:2px;'>(not girilmemiş)</div>")
        +"</div></div>";
    } else {
      var k = kayit.veri;
      var urunSayisi = (k.urunler||[]).length;
      var toplamEuro = 0;
      (k.urunler||[]).forEach(function(u){ toplamEuro += u.toplamEuro||0; });
      html += "<div onclick=\"musteriGecmisIslemDetayAc('"+kayit.tip+"',"+(arsiv[kayit.tip]||[]).indexOf(k)+")\" style='cursor:pointer;padding:16px 18px;border-bottom:1px dashed #ddd;display:flex;gap:14px;align-items:flex-start;'>"
        +"<div style='flex-shrink:0;white-space:nowrap;'>"+kodHtmlOlustur(k.kod,23,14,k.kanal)+"</div>"
        +"<div style='font-size:26px;color:#888;font-weight:700;min-width:60px;'>"+saatStr+"</div>"
        +"<div style='flex:1;'><div style='font-size:29px;font-weight:800;color:#003a70;'>🏢 "+k.musteri+"</div>"
        +"<div style='font-size:24px;color:#444;margin-top:2px;'>"+urunSayisi+" ürün · "+fmt(toplamEuro)+" €</div>"
        +"</div></div>";
    }
  });
  listeEl.innerHTML = html;
}

function musteriKartVeZiyaretGecmisiniAc(musteriAdi){
  var idx = musteriListesi.findIndex(function(m){ return m.ad===musteriAdi; });
  if(idx===-1) return;
  musteriKartIdx = idx;
  musteriZiyaretGecmisiAc();
}

function ziyaretTakvimAyDegistir(fark){
  ziyaretTakvimAy += fark;
  if(ziyaretTakvimAy < 0){ ziyaretTakvimAy = 11; ziyaretTakvimYil--; }
  if(ziyaretTakvimAy > 11){ ziyaretTakvimAy = 0; ziyaretTakvimYil++; }
  ziyaretTakvimiOlustur();
}

// Tüm müşterilerin ziyaretGecmisi'ni tek düz listeye toplar: {musteri, sehir, ts, not}
function tumZiyaretleriTopla(){
  var sonuc = [];
  for(var i=0;i<musteriListesi.length;i++){
    var m = musteriListesi[i];
    var liste = m.ziyaretGecmisi||[];
    for(var k=0;k<liste.length;k++){
      sonuc.push({musteri:m.ad, sehir:m.sehir||"", ts:liste[k].ts||0, not:liste[k].not||"", tur:liste[k].tur||"ziyaret", fotolar:liste[k].fotolar||[], kisi:liste[k].kisi||null, kod:liste[k].kod||null});
    }
  }
  return sonuc;
}

function ziyaretTakvimiOlustur(){
  var baslikEl = document.getElementById("ziyaretTakvimAyBasligi");
  if(baslikEl) baslikEl.textContent = AY_ADLARI[ziyaretTakvimAy]+" "+ziyaretTakvimYil;

  var tumZiyaretler = tumZiyaretleriTopla();
  var ayBasi = new Date(ziyaretTakvimYil, ziyaretTakvimAy, 1);
  var ayGunSayisi = new Date(ziyaretTakvimYil, ziyaretTakvimAy+1, 0).getDate();
  // Pazartesi=0 olacak şekilde haftanın gününü ayarla
  var ilkGunHaftaIndeks = (ayBasi.getDay()+6)%7;

  var gunSayilari = {};
  var buAyinZiyaretleri = [];
  tumZiyaretler.forEach(function(z){
    var d = new Date(z.ts);
    if(d.getFullYear()===ziyaretTakvimYil && d.getMonth()===ziyaretTakvimAy){
      var gun = d.getDate();
      gunSayilari[gun] = (gunSayilari[gun]||0)+1;
      buAyinZiyaretleri.push(z);
    }
  });

  var bugun = new Date();
  var buAyBugunMu = bugun.getFullYear()===ziyaretTakvimYil && bugun.getMonth()===ziyaretTakvimAy;

  var html = "";
  ["Pt","Sa","Ça","Pe","Cu","Ct","Pz"].forEach(function(g){
    html += "<div style='text-align:center;font-size:17px;font-weight:900;color:#003a70;padding-bottom:4px;'>"+g+"</div>";
  });
  for(var i=0;i<ilkGunHaftaIndeks;i++) html += "<div></div>";
  for(var g=1; g<=ayGunSayisi; g++){
    var sayi = gunSayilari[g]||0;
    var buGunBugunMu = buAyBugunMu && bugun.getDate()===g;
    var haftaGunIndeksi = (ilkGunHaftaIndeks + (g-1)) % 7; // 0=Pt ... 5=Ct, 6=Pz
    var haftaSonuMu = (haftaGunIndeksi===5 || haftaGunIndeksi===6);
    var zeminRenk = haftaSonuMu ? "#fff6d9" : (sayi===0 ? "#fdeceb" : "#e2f7e8");
    var kenar = buGunBugunMu ? "border:4px solid #e0524a;" : "border:1px solid #e4e8ee;";
    html += "<div onclick='ziyaretGunPopupAc("+g+")' style='position:relative;aspect-ratio:1;box-sizing:border-box;border-radius:8px;background:"+zeminRenk+";"+kenar+"display:flex;align-items:center;justify-content:center;cursor:pointer;'>"
      +"<div style='font-size:33px;font-weight:700;color:#333;'>"+g+"</div>"
      +(sayi>0 ? "<div style='position:absolute;top:-8px;right:-8px;background:"+(sayi>=3?"#e0524a":"#16a085")+";color:#fff;font-size:23px;font-weight:900;min-width:32px;height:32px;border-radius:16px;display:flex;align-items:center;justify-content:center;padding:0 5px;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.25);'>"+sayi+"</div>" : "")
      +"</div>";
  }
  document.getElementById("ziyaretTakvimGrid").innerHTML = html;

  // Özet tablo: bu ay toplamı + bu hafta (son 7 gün, tüm ziyaretler üzerinden gerçek zamana göre)
  var simdiTs = Date.now();
  var buHaftaSayisi = tumZiyaretler.filter(function(z){ return (simdiTs - z.ts) <= 7*86400000 && z.ts<=simdiTs; }).length;
  var buAySayisi = buAyinZiyaretleri.length;
  var gunlukOrt = buAyBugunMu ? (buAySayisi / bugun.getDate()).toFixed(1) : (buAySayisi/ayGunSayisi).toFixed(1);
  document.getElementById("ziyaretOzetTablosu").innerHTML =
    "<table style='width:100%;border-collapse:collapse;font-size:14px;'>"
    +"<tr style='background:#cfe2f3;color:#3569b8;'><th style='padding:8px;border:1px solid #3569b8;font-size:39px;'>Son 7 Gün</th><th style='padding:8px;border:1px solid #3569b8;font-size:39px;'>"+AY_ADLARI[ziyaretTakvimAy]+"</th><th style='padding:8px;border:1px solid #3569b8;font-size:39px;'>Günlük Ort.</th></tr>"
    +"<tr><td style='padding:10px;border:1px solid #3569b8;text-align:center;font-size:66px;font-weight:900;color:#16a085;'>"+buHaftaSayisi+"</td>"
    +"<td style='padding:10px;border:1px solid #3569b8;text-align:center;font-size:66px;font-weight:900;color:#003a70;'>"+buAySayisi+"</td>"
    +"<td style='padding:10px;border:1px solid #3569b8;text-align:center;font-size:66px;font-weight:900;color:#16a085;'>"+gunlukOrt+"</td></tr></table>";

  // 15+ gündür ziyaret edilmeyenler (tüm müşteriler üzerinden, ay'dan bağımsız gerçek zaman)
  var hatirlatmaHtml = "";
  var varMi = false;
  for(var mi=0; mi<musteriListesi.length; mi++){
    var m = musteriListesi[mi];
    var liste = m.ziyaretGecmisi||[];
    if(liste.length===0) continue;
    var enSonTs = Math.max.apply(null, liste.map(function(z){ return z.ts||0; }));
    var farkGun = Math.floor((simdiTs - enSonTs)/86400000);
    if(farkGun >= 15){
      varMi = true;
      hatirlatmaHtml += "<div onclick=\"musteriKartAcAdIle('"+m.ad.replace(/'/g,"&#39;")+"')\" style='display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:8px;background:#fdf1e8;margin-bottom:8px;border-left:4px solid #e0524a;cursor:pointer;'>"
        +"<div style='font-weight:800;color:#222;font-size:15px;'>🏢 "+safeText(m.ad)+"</div>"
        +"<div style='font-size:13px;color:#a34a1e;font-weight:800;white-space:nowrap;'>"+farkGun+" gündür yok</div></div>";
    }
  }
  document.getElementById("ziyaretHatirlatmaAlani").innerHTML = varMi ? hatirlatmaHtml : "<div style='color:#888;text-align:center;padding:10px;font-size:14px;'>15 günü aşan firma yok 👍</div>";
}

function ziyaretNotGosterGizle(el){
  var not = el.querySelector(".zv-not");
  if(!not) return;
  not.style.display = (not.style.display==="none" || !not.style.display) ? "block" : "none";
}

function ziyaretGunPopupAc(gun){
  ziyaretGunPopupGoruntulenenGun = gun;
  var tumZiyaretler = tumZiyaretleriTopla();
  var kayitlar = tumZiyaretler.filter(function(z){
    var d = new Date(z.ts);
    return d.getFullYear()===ziyaretTakvimYil && d.getMonth()===ziyaretTakvimAy && d.getDate()===gun;
  }).sort(function(a,b){ return a.ts-b.ts; });

  document.getElementById("ziyaretGunModalBaslik").textContent = gun+" "+AY_ADLARI[ziyaretTakvimAy]+" "+ziyaretTakvimYil+" — "+kayitlar.length+" ziyaret";
  var icerik = "";
  if(kayitlar.length===0){
    icerik = "<div style='color:#888;text-align:center;padding:14px;font-size:28px;'>Bu gün temas kaydı yok.</div>";
  } else {
    kayitlar.forEach(function(z){
      var saat = new Date(z.ts);
      var saatStr = ("0"+saat.getHours()).slice(-2)+":"+("0"+saat.getMinutes()).slice(-2);
      var t = TEMAS_TURLERI[z.tur||"ziyaret"] || TEMAS_TURLERI.ziyaret;
      icerik += "<div onclick='ziyaretNotGosterGizle(this)' style='position:relative;padding:10px 12px;border:1px solid #ddd;border-radius:8px;margin-bottom:8px;cursor:pointer;background:#f9fafc;'>"
        +"<div style='display:flex;justify-content:space-between;align-items:flex-start;gap:10px;'>"
        +"<div style='font-weight:800;color:#003a70;font-size:30px;display:flex;align-items:center;gap:8px;'><span style='display:inline-block;background:"+t.renk+";color:#fff;font-size:16px;font-weight:900;padding:3px 8px;border-radius:5px;white-space:nowrap;'>"+t.ikon+" "+t.ad+"</span>"+safeText(z.musteri)+"</div>"
        +"<button onclick='event.stopPropagation();ziyaretGunKaydiSilHizli(\""+z.musteri.replace(/"/g,"&quot;")+"\","+z.ts+")' style='flex-shrink:0;background:#fdeceb;color:#e0524a;border:1px solid #e0524a;border-radius:6px;padding:6px 12px;font-size:20px;font-weight:800;cursor:pointer;'>🗑 Sil</button>"
        +"</div>"
        +"<div style='font-size:24px;color:#888;'>"+saatStr+(z.sehir?" · "+safeText(sehirFormatla(z.sehir)):"")+" — dokunarak konuşulanı gör</div>"
        +"<div class='zv-not' style='display:none;font-size:28px;color:#333;background:#eef4fb;border-radius:8px;padding:10px;margin-top:6px;line-height:1.5;'>"+(z.kisi && z.kisi.isim ? "<div style='font-size:0.75em;color:#1a4d8f;font-weight:700;margin-bottom:4px;'>👤 "+safeText(z.kisi.isim)+"</div>" : "")+"💬 "+safeText(z.not||"(not girilmemiş)")+((z.fotolar && z.fotolar.length>0) ? "<div style='display:flex;gap:4px;margin-top:8px;flex-wrap:wrap;'>"+z.fotolar.map(function(f){ return "<img src='"+f+"' style='width:70px;height:70px;object-fit:cover;border-radius:6px;border:1px solid #ccc;'>"; }).join("")+"</div>" : "")+"</div>"
        +"</div>";
    });
  }
  document.getElementById("ziyaretGunModalIcerik").innerHTML = icerik;
  document.getElementById("ziyaretGunModal").style.display="flex";
  var ekleBtn = document.getElementById("ziyaretGunEkleBtn");
  if(ekleBtn) ekleBtn.setAttribute("data-gun", gun);
}

var ziyaretGunPopupGoruntulenenGun = null;

function ziyaretGunKaydiSilHizli(musteriAdi, ts){
  if(!confirm(musteriAdi+" — bu ziyaret kaydını silmek istediğinize emin misiniz?")) return;
  var musteriIdx = musteriListesi.findIndex(function(m){ return m.ad===musteriAdi; });
  if(musteriIdx===-1) return;

  function guncellemeyiUygula(guncelListe){
    var hedefIdx = guncelListe.findIndex(function(m){ return m.ad===musteriAdi; });
    if(hedefIdx===-1 || !guncelListe[hedefIdx].ziyaretGecmisi) return;
    guncelListe[hedefIdx].ziyaretGecmisi = guncelListe[hedefIdx].ziyaretGecmisi.filter(function(z){ return z.ts!==ts; });
    guncelListe[hedefIdx].ziyaretGecmisi.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
    if(guncelListe[hedefIdx].ziyaretGecmisi.length>0){
      guncelListe[hedefIdx].sonZiyaret = guncelListe[hedefIdx].ziyaretGecmisi[0].ts;
      guncelListe[hedefIdx].sonZiyaretNot = guncelListe[hedefIdx].ziyaretGecmisi[0].not;
    }
    musteriListesi = guncelListe;
    lsSet("weicon_musteriler", musteriListesi);
    if(window.fbSet) musteriListesiGuvenliKaydet(musteriListesi[hedefIdx]).catch(function(e){ console.error("Firebase yazma hatası:", e); });
    showToast("🗑 Ziyaret kaydı silindi.");
    if(ziyaretGunPopupGoruntulenenGun!==null) ziyaretGunPopupAc(ziyaretGunPopupGoruntulenenGun);
    if(typeof ziyaretTakvimiOlustur==="function") ziyaretTakvimiOlustur();
  }

  if(window.fbGet){
    window.fbGet("musteriler").then(function(data){
      guncellemeyiUygula(data ? (Array.isArray(data)?data:Object.values(data)) : []);
    }).catch(function(){ guncellemeyiUygula(lsGet("weicon_musteriler",[])); });
  } else {
    guncellemeyiUygula(lsGet("weicon_musteriler",[]));
  }
}

function musteriKartAcAdIle(ad){
  var idx = -1;
  for(var i=0;i<musteriListesi.length;i++){ if(musteriListesi[i].ad===ad){ idx=i; break; } }
  if(idx===-1) return;
  musteriKartIdx = idx;
  document.getElementById("ziyaretGunModal").style.display="none";
  musteriKartAc(idx);
}

function ayBazliMudurPrimiGuncelle(arsiv){
  var el = document.getElementById("aylikOzetTablosu");
  if(!el) return;
  var siparisler = (arsiv&&arsiv.siparis) || [];
  var now = new Date();
  var aylikVeri = [];
  for(var m=0;m<12;m++){
    var d = new Date(now.getFullYear(), now.getMonth()-m, 1);
    aylikVeri.push({ayAd:AYLAR_KISA[d.getMonth()], yil:d.getFullYear().toString(), toplam:0, prim:0, kayitlar:[]});
  }
  for(var i=0;i<siparisler.length;i++){
    var k = siparisler[i];
    if(!k.tarih) continue;
    var parca = k.tarih.split(" ");
    var ayAd = parca[1]||""; var yil = parca[2]||"";
    for(var m=0;m<12;m++){
      if(aylikVeri[m].ayAd===ayAd && aylikVeri[m].yil===yil){
        var kToplam=0, kPrim=0;
        if(k.urunler) for(var j=0;j<k.urunler.length;j++){
          var u=k.urunler[j];
          kToplam += u.toplamEuro||0;
          var mk=(u.iskBirim||0)-(u.dipFiyat||0);
          var satirPrimi = mk*(u.adet||1)*0.22;
          if(satirPrimi>0) kPrim += satirPrimi; // eksi/negatif primli satırlar toplama hiç katılmaz
        }
        aylikVeri[m].toplam += kToplam;
        aylikVeri[m].prim += kPrim;
        aylikVeri[m].kayitlar.push({kayit:k, idx:i, toplam:kToplam, prim:kPrim});
        break;
      }
    }
  }
  window._aylikOzetVeri = aylikVeri;

  // Güncel EUR/TL kuru (Kur Ayarları'ndan senkronize edilen, localStorage'da
  // tutulan değer) — Müdür Primi (EUR) bu kurla çarpılıp TL karşılığı gösterilir.
  var guncelKur = parseFloat(localStorage.getItem("weicon_kur")) || 0;

  var genelToplam=0, genelPrim=0, genelPrimTl=0;
  var satirlar="";
  for(var m=0;m<12;m++){
    var ay=aylikVeri[m];
    var primTl = ay.prim * guncelKur;
    genelToplam+=ay.toplam; genelPrim+=ay.prim; genelPrimTl+=primTl;
    satirlar += "<tr onclick=\"aySiparisleriAc("+m+")\" style='cursor:pointer;"+(m===0?"background:#cfe2f3;border-left:4px solid #3569b8;":"")+"'>"
      +"<td style='padding:6px;border:1px solid #3569b8;font-weight:bold;color:#003a70;font-size:32px;text-align:center;'>"+ay.ayAd+" "+ay.yil+"</td>"
      +"<td style='padding:6px;border:1px solid #3569b8;text-align:center;font-size:32px;'>"+fmt(ay.toplam)+" €</td>"
      +"<td style='padding:6px;border:1px solid #3569b8;text-align:center;font-weight:bold;color:#16a085;font-size:32px;'>"+fmt(ay.prim)+" €</td>"
      +"<td style='padding:6px;border:1px solid #3569b8;text-align:center;font-weight:bold;color:#a8790a;font-size:32px;'>"+fmt(primTl)+" ₺</td>"
      +"</tr>";
  }
  var html = "<table style='width:100%;table-layout:fixed;border-collapse:collapse;font-size:32px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.1);'>"
    +"<thead><tr style='background:#cfe2f3;color:#3569b8;'>"
    +"<th style='padding:7px;border:1px solid #3569b8;text-align:center;font-size:28px;width:25%;'>AY</th>"
    +"<th style='padding:7px;border:1px solid #3569b8;text-align:center;font-size:28px;width:25%;'>SATIŞ</th>"
    +"<th style='padding:7px;border:1px solid #3569b8;text-align:center;font-size:28px;width:25%;'>PRİM</th>"
    +"<th style='padding:7px;border:1px solid #3569b8;text-align:center;font-size:28px;width:25%;'>TL PRİM</th>"
    +"</tr></thead><tbody>"+satirlar+"</tbody>"
    +"<tfoot><tr style='background:#cfe2f3;font-weight:900;border-top:2px solid #16a085;'>"
    +"<td style='padding:7px;border:1px solid #3569b8;font-size:26px;text-align:center;'>TOPLAM (12 Ay)</td>"
    +"<td style='padding:7px;border:1px solid #3569b8;text-align:center;font-size:26px;'>"+fmt(genelToplam)+" €</td>"
    +"<td style='padding:7px;border:1px solid #3569b8;text-align:center;color:#16a085;font-size:26px;'>"+fmt(genelPrim)+" €</td>"
    +"<td style='padding:7px;border:1px solid #3569b8;text-align:center;color:#a8790a;font-size:26px;'>"+fmt(genelPrimTl)+" ₺</td>"
    +"</tr></tfoot></table>"
    +(guncelKur ? "<div style='text-align:center;font-size:18px;color:#8a97a6;font-weight:700;margin-top:6px;'>Kur: 1 € = "+fmt(guncelKur)+" ₺ üzerinden hesaplandı</div>" : "<div style='text-align:center;font-size:18px;color:#c0392b;font-weight:800;margin-top:6px;'>⚠️ Güncel kur bulunamadı, TL Prim hesaplanamadı</div>");
  el.innerHTML = html;
}

function tarihIkiSatirFormat(tarihStr){
  if(!tarihStr) return "-";
  var parcalar = tarihStr.split(" - ");
  var datePart = parcalar[0]||"";
  var saat = parcalar[1]||"";
  var dp = datePart.split(" ");
  if(dp.length<3) return tarihStr;
  var gun = ("0"+dp[0]).slice(-2);
  var ayIndex = AYLAR_KISA.indexOf(dp[1]);
  var ayNo = ayIndex>=0 ? ("0"+(ayIndex+1)).slice(-2) : dp[1];
  var yil2 = dp[2].slice(-2);
  return gun+"."+ayNo+"."+yil2 + (saat ? "<br><span style='font-size:0.82em;color:#667;'>"+saat+"</span>" : "");
}

function aySiparisleriAc(ayIndex){
  var ay = window._aylikOzetVeri ? window._aylikOzetVeri[ayIndex] : null;
  if(!ay || ay.kayitlar.length===0){ showToast("Bu ayda sipariş kaydı yok."); return; }
  var ayToplam = 0;
  ay.kayitlar.forEach(function(it){ ayToplam += it.toplam||0; });
  var satirlar="";
  for(var i=0;i<ay.kayitlar.length;i++){
    var it=ay.kayitlar[i];
    var durum = it.kayit.durum;
    var sorunluMu = durum==="iptal" || durum==="iade" || durum==="kacan";
    var harf = (it.kayit.kod||"").slice(0,3);
    var gerisi = (it.kayit.kod||"").slice(3);
    var renk = KOD_RENK[harf] || "#003a70";
    var kartRenk = sorunluMu ? "#c0392b" : renk;
    var ZEMIN_ACIK = {"#003a70":"#eef4fb,#dbe9f9","#28a745":"#f0fbf3,#dceedf","#8e44ad":"#f6f0fd,#ece0fa","#b7601f":"#fff6ec,#ffe8d1","#16a085":"#f0fbf3,#dceedf","#c0392b":"#fff1f0,#fbdbd8"};
    var zeminGrad = ZEMIN_ACIK[kartRenk] || "#eef4fb,#dbe9f9";
    var kanalOnEk = it.kayit.kanal==="whatsapp" ? "W-" : it.kayit.kanal==="mail" ? "M-" : "";

    var durumEk = "";
    if(durum==="iptal") durumEk = " — 🚫 İPTAL";
    else if(durum==="iade") durumEk = " — ↩️ İADE";
    else if(durum==="kacan") durumEk = " — ❌ KAÇTI"+(it.kayit.kacanRakip?" → "+safeText(it.kayit.kacanRakip):"");
    if(it.kayit.revizeZamani) durumEk += " — 🔄 REVİZE "+revizeTarihSaatFormatla(it.kayit.revizeZamani);

    // G TASARIMI — sıkı tek-blok satır listesi: tip+tarih küçük üst satır,
    // müşteri+tutar·prim alt satırda büyük. Kartlar arası boşluk/yuvarlak kenar
    // yok, ince alt çizgiyle ayrılıyor + çift satırda hafif zebra — ekrana çok
    // daha fazla müşteri sığsın diye (tarih hâlâ HİÇ gizlenmiyor).
    var zebra = (i%2===1) ? "background:#f7f9fc;" : "";
    satirlar += "<div onclick=\"document.getElementById('aySiparisleriModal').style.display='none';arsivDetayAc('siparis',"+it.idx+")\" style='cursor:pointer;padding:10px 14px;border-bottom:1.5px solid #eef1f5;"+zebra+(sorunluMu?"opacity:.85;":"")+"'>"
      +"<div style='display:flex;align-items:center;gap:7px;margin-bottom:3px;flex-wrap:nowrap;overflow:hidden;'>"
        +"<span style='font-size:14px;font-weight:900;padding:2px 8px;border-radius:5px;color:#fff;background:"+kartRenk+";flex-shrink:0;'>"+kanalOnEk+harf+"</span>"
        +"<span style='font-size:15px;font-weight:800;color:#556170;flex-shrink:0;'>"+tarihKisaltTekSatir(it.kayit.tarih)+"</span>"
        +(durumEk ? "<span style='font-size:14px;font-weight:900;color:#c0392b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>"+durumEk+"</span>" : "")
      +"</div>"
      +"<div style='display:flex;align-items:baseline;justify-content:space-between;gap:8px;'>"
        +"<span style='font-size:25px;font-weight:900;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>"+safeText(it.kayit.musteri||"-")+"</span>"
        +"<span style='font-size:22px;font-weight:900;flex-shrink:0;white-space:nowrap;'><span style='color:"+kartRenk+";'>"+fmt(it.toplam)+"€</span><span style='color:#8a97a6;font-size:15px;'> · </span><span style='color:"+(sorunluMu?kartRenk:"#0e6b34")+";font-size:16px;'>"+fmt(it.prim)+"€</span></span>"
      +"</div>"
      +"</div>";
  }
  var html = "<div style='font-size:29px;font-weight:900;color:#003a70;margin-bottom:12px;text-align:center;border-bottom:3px solid #f2994a;padding-bottom:10px;'>📅 "+ay.ayAd+" "+ay.yil+" Siparişleri</div>"
    +"<div style='background:linear-gradient(135deg,#0a1628,#132840);border-radius:14px;padding:16px 18px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;'>"
      +"<span style='font-size:20px;font-weight:800;color:#7fd6ff;'>🧮 AY TOPLAMI ("+ay.kayitlar.length+" sipariş)</span>"
      +"<span style='font-size:28px;font-weight:900;color:#00d9ff;'>"+fmt(ayToplam)+" €</span>"
    +"</div>"
    +"<div style='border:1.5px solid #eef1f5;border-radius:10px;overflow:hidden;'>"+satirlar+"</div>";
  document.getElementById("aySiparisleriIcerik").innerHTML = html;
  document.getElementById("aySiparisleriModal").style.display="flex";
}

function istatistikHesapla(){
  function hesapla(arsiv){
    arsiv = arsiv||{};
    window._istatistikArsiv = arsiv;
    ayBazliMudurPrimiGuncelle(arsiv);
    kacanOzetRenderEt(arsiv);
  }
  if(window.fbGet){
    window.fbGet("arsiv").then(function(data){ if(data) arsivData=data; hesapla(arsivData); });
  } else { hesapla(arsivData); }
}

// ❌ Kaçan Siparişler özeti: bu ayki sayı/tutar, kaybedilme sebebi dağılımı,
// rakip firma dağılımı ve Teklif→Sipariş dönüşüm oranı.
function kacanOzetRenderEt(arsiv){
  var el = document.getElementById("kacanOzetKutusu");
  if(!el) return;
  arsiv = arsiv||{};
  var aylarKisa = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  var now = new Date();
  var buAyAd = aylarKisa[now.getMonth()];
  var buYil = now.getFullYear().toString();

  var kacanlar = [];
  var teklifSayisi = 0, siparisOlanSayisi = 0;
  ["siparis","teklif","proforma","numune"].forEach(function(tipKey){
    (arsiv[tipKey]||[]).forEach(function(k){
      if(!k.tarih) return;
      var parca = k.tarih.split(" ");
      var ayAd = parca[1]||"", yil = parca[2]||"";
      if(ayAd!==buAyAd || yil!==buYil) return;
      if(tipKey==="teklif") teklifSayisi++;
      if(k.durum==="kacan"){
        var kEuro=0;
        if(k.urunler) k.urunler.forEach(function(u){ kEuro += u.toplamEuro||0; });
        kacanlar.push({kayit:k, tutar:kEuro});
      }
    });
  });

  window._kacanKayitlariBuAy = kacanlar;

  el.innerHTML =
    "<div style='font-size:24px;font-weight:bold;color:#c0392b;margin-bottom:10px;border-bottom:3px solid #c0392b;padding-bottom:6px;'>❌ Kaçan Siparişler — "+buAyAd+" "+buYil+"</div>"
    +"<div style='display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;'>"
      +"<div onclick=\"kacanDetayAc()\" style='cursor:pointer;background:linear-gradient(135deg,#e0524a,#a83228);color:#fff;border-radius:10px;padding:14px;text-align:center;'><div style='font-size:15px;font-weight:800;opacity:.9;'>KAÇAN İŞLEM</div><div style='font-size:30px;font-weight:900;margin-top:4px;'>"+kacanlar.length+"</div><div style='font-size:11px;font-weight:700;opacity:.85;margin-top:3px;'>Detay için dokunun ›</div></div>"
      +"<div style='background:linear-gradient(135deg,#e0524a,#a83228);color:#fff;border-radius:10px;padding:14px;text-align:center;'><div style='font-size:15px;font-weight:800;opacity:.9;'>KAYBEDİLEN TUTAR</div><div style='font-size:26px;font-weight:900;margin-top:4px;'>"+fmt(toplamTutar)+" €</div></div>"
    +"</div>"
    +"<div style='background:#eef4fb;border-radius:10px;padding:14px;margin-bottom:14px;text-align:center;'><div style='font-size:16px;font-weight:800;color:#003a70;'>Bu ay verilen Fiyat Teklifi</div><div style='font-size:24px;font-weight:900;color:#003a70;margin-top:2px;'>"+teklifSayisi+" adet</div></div>"
    +(kacanlar.length===0 ? "<div style='color:#888;font-size:17px;padding:6px 0;'>Bu ay kaçan işaretli kayıt yok.</div>" : "");
}

// "KAÇAN İŞLEM" kutusuna dokununca — bu ayki kaçan kayıtların listesi (sebep,
// rakip firma, tutar dahil) ayrı bir popup'ta açılır.
function kacanDetayAc(){
  var kacanlar = window._kacanKayitlariBuAy || [];
  var el = document.getElementById("kacanDetayIcerik");
  if(!el) return;
  if(kacanlar.length===0){
    el.innerHTML = "<div style='color:#888;font-size:20px;padding:14px 0;text-align:center;'>Bu ay kaçan işaretli kayıt yok.</div>";
  } else {
    var siraliListe = kacanlar.slice().sort(function(a,b){ return (b.kayit.kacanZamani||b.kayit.ts||0)-(a.kayit.kacanZamani||a.kayit.ts||0); });
    var html = "";
    siraliListe.forEach(function(x){
      var k = x.kayit;
      html += "<div style='background:#fff8f6;border:1px solid #f0d0c8;border-left:5px solid #c0392b;border-radius:8px;padding:14px 16px;margin-bottom:12px;'>"
        + "<div style='font-size:20px;font-weight:900;color:#222;margin-bottom:4px;'>"+(k.musteri||"-")+"</div>"
        + "<div style='font-size:15px;color:#666;margin-bottom:8px;'>"+(k.tarih||"-")+"</div>"
        + "<div style='display:flex;justify-content:space-between;font-size:16px;padding:4px 0;border-top:1px solid #f0d0c8;'><span style='color:#888;'>Sebep</span><b style='color:#a83228;'>"+(k.kacanSebep||"Belirtilmemiş")+"</b></div>"
        + (k.kacanRakip ? "<div style='display:flex;justify-content:space-between;font-size:16px;padding:4px 0;border-top:1px solid #f0d0c8;'><span style='color:#888;'>Rakip Firma</span><b style='color:#a83228;'>"+k.kacanRakip+"</b></div>" : "")
        + (k.kacanNot ? "<div style='font-size:15px;color:#555;margin-top:6px;padding-top:6px;border-top:1px solid #f0d0c8;'>"+k.kacanNot+"</div>" : "")
        + "<div style='display:flex;justify-content:space-between;font-size:18px;font-weight:900;padding-top:8px;margin-top:6px;border-top:1px solid #f0d0c8;'><span>Kaybedilen Tutar</span><span style='color:#c0392b;'>"+fmt(x.tutar)+" €</span></div>"
        + "</div>";
    });
    el.innerHTML = html;
  }
  document.getElementById("kacanDetayModal").style.display="flex";
}

// KAYIT DÜZENLEME — geçmişte yanlış kaydedilmiş bir işlemi manuel düzeltmek için
var kdTip = null, kdIdx = null, kdUrunler = [];

function tsToDatetimeLocal(ts){
  var d = new Date(ts||Date.now());
  var pad = function(n){ return ("0"+n).slice(-2); };
  return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes());
}

function kayitDuzenleAc(tip, idx){
  var arsiv = lsGet("weicon_arsiv",{});
  var liste = arsiv[tip]||[];
  var kayit = liste[idx];
  if(!kayit){ showToast("Kayıt bulunamadı."); return; }
  kdTip = tip; kdIdx = idx;
  kdUrunler = JSON.parse(JSON.stringify(kayit.urunler||[]));
  document.getElementById("kdMusteriAdi").value = kayit.musteri||"";
  var tipSel = document.getElementById("kdHareketTipiSelect");
  if(tipSel) tipSel.value = tip;
  var tarihEl = document.getElementById("kdTarihInput");
  if(tarihEl) tarihEl.value = tsToDatetimeLocal(kayit.ts);
  var yetkiliEl = document.getElementById("kdYetkiliInput");
  if(yetkiliEl) yetkiliEl.value = kayit.yetkili||"";
  var vadeEl = document.getElementById("kdVadeInput");
  if(vadeEl) vadeEl.value = kayit.vade||"";
  var kargoEl = document.getElementById("kdKargoInput");
  if(kargoEl) kargoEl.value = kayit.kargo||"";
  var faturaEl = document.getElementById("kdFaturaInput");
  if(faturaEl) faturaEl.value = kayit.fatura||"";
  kdUrunListesiRenderEt();
  // Bu modalı tetikleyebilecek tüm üst popup'lar kapatılır — aksi halde
  // Revize tuşuna basınca bu modal arkada açılır, görünmez kalır.
  var fom = document.getElementById("faturaOnizlemeModal"); if(fom) fom.style.display="none";
  var mgm = document.getElementById("musteriGecmisIslemlerModal"); if(mgm) mgm.style.display="none";
  var im = document.getElementById("istatistiklerModal"); if(im) im.style.display="none";
  document.getElementById("kayitDuzenleModal").style.display="flex";
}

function kdUrunListesiRenderEt(){
  var el = document.getElementById("kdUrunListesi");
  if(!el) return;
  var html = "";
  for(var i=0;i<kdUrunler.length;i++){
    var u = kdUrunler[i];
    html += "<div style='background:#f7f9fc;border:1px solid #d5dce6;border-radius:8px;padding:14px;margin-bottom:10px;'>"
      +"<div style='font-weight:900;font-size:20px;color:#222;margin-bottom:10px;'>"+u.name+"</div>"
      +"<div style='display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;'>"
      +"<div><label style='font-size:14px;font-weight:700;color:#888;display:block;margin-bottom:3px;'>Liste Fiyat</label><input type='number' step='0.01' value='"+u.listeFiyat+"' onchange='kdAlanGuncelle("+i+",\"listeFiyat\",this.value)' style='width:100%;padding:13px;border:2px solid #003a70;border-radius:6px;font-size:22px;font-weight:800;box-sizing:border-box;'></div>"
      +"<div><label style='font-size:14px;font-weight:700;color:#888;display:block;margin-bottom:3px;'>İskonto %</label><input type='number' step='1' value='"+u.iskonto+"' onchange='kdAlanGuncelle("+i+",\"iskonto\",this.value)' style='width:100%;padding:13px;border:2px solid #003a70;border-radius:6px;font-size:22px;font-weight:800;box-sizing:border-box;'></div>"
      +"<div><label style='font-size:14px;font-weight:700;color:#888;display:block;margin-bottom:3px;'>Adet</label><input type='number' step='1' min='1' value='"+u.adet+"' onchange='kdAlanGuncelle("+i+",\"adet\",this.value)' style='width:100%;padding:13px;border:2px solid #003a70;border-radius:6px;font-size:22px;font-weight:800;box-sizing:border-box;'></div>"
      +"</div>"
      +"<div style='display:flex;justify-content:space-between;align-items:center;margin-top:10px;'>"
      +"<div style='font-size:17px;color:#555;'>Net: <b style='color:#003a70;'>"+fmt(u.iskBirim)+" €</b> &nbsp;·&nbsp; Toplam: <b style='color:#f2994a;'>"+fmt(u.toplamEuro)+" €</b></div>"
      +"<button onclick='kdUrunSil("+i+")' style='background:#f8d7da;color:#e0524a;border:1px solid #e0524a;padding:8px 16px;border-radius:6px;font-weight:bold;font-size:15px;cursor:pointer;'>🗑 Sil</button>"
      +"</div>"
      +"</div>";
  }
  if(kdUrunler.length===0) html = "<div style='color:#888;font-size:18px;padding:14px 0;'>Ürün kalmadı — kaydetmeden önce en az bir ürün olmalı.</div>";
  el.innerHTML = html;
}

function kdAlanGuncelle(i, alan, deger){
  var v = parseFloat(String(deger).replace(",","."));
  if(isNaN(v)) v=0;
  kdUrunler[i][alan] = v;
  var lf = kdUrunler[i].listeFiyat||0, isk = kdUrunler[i].iskonto||0, adet = kdUrunler[i].adet||0;
  kdUrunler[i].iskBirim = lf - (lf*isk/100);
  kdUrunler[i].toplamEuro = kdUrunler[i].iskBirim*adet;
  kdUrunListesiRenderEt();
}

function kdUrunSil(i){
  kdUrunler.splice(i,1);
  kdUrunListesiRenderEt();
}

function kdUrunEkleAramaAcKapat(){
  var kutu = document.getElementById("kdUrunEkleAramaKutusu");
  var acikMi = kutu.style.display==="block";
  kutu.style.display = acikMi ? "none" : "block";
  if(!acikMi){
    document.getElementById("kdUrunEkleAramaInput").value="";
    document.getElementById("kdUrunEkleSonuclar").innerHTML="";
    setTimeout(function(){ document.getElementById("kdUrunEkleAramaInput").focus(); }, 50);
  }
}

function kdUrunEkleFiltrele(){
  var q = document.getElementById("kdUrunEkleAramaInput").value.trim().toLocaleLowerCase("tr-TR");
  var sonucDiv = document.getElementById("kdUrunEkleSonuclar");
  var kelimeler = q.split(/\s+/).filter(function(k){ return k.length>0; });
  if(!globalProductCatalog || globalProductCatalog.length===0){
    sonucDiv.innerHTML = "<div style='color:#888;padding:14px 0;text-align:center;'>Katalog yüklenemedi.</div>";
    return;
  }
  if(kelimeler.length===0){
    sonucDiv.innerHTML = "";
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
    html += "<div onclick=\"kdUrunEkle('"+safeName+"',"+cp+",'"+safeBerta+"','"+safeAbas+"')\" style='background:#f7f9fc;border:1px solid #d5dce6;border-radius:8px;padding:12px 14px;margin-bottom:8px;cursor:pointer;'>"
      +"<div style='font-size:14px;font-weight:800;color:#444;'><span style=\"color:#003a70;\">Berta:</span> "+bt+" <span style=\"color:#e0524a;\">- Abas:</span> "+at+"</div>"
      +"<div style='font-size:19px;font-weight:800;color:#222;margin-top:3px;'>"+nt+"</div>"
      +"<div style='font-size:16px;font-weight:900;color:#0e7c63;margin-top:3px;'>"+fmt(cp)+" €</div>"
      +"</div>";
  }
  sonucDiv.innerHTML = html;
}

function kdUrunEkle(name, listeFiyat, berta, abas){
  var yeni = {
    name: name, berta: berta, abas: abas,
    listeFiyat: listeFiyat, iskonto: 0, adet: 1,
    iskBirim: listeFiyat, toplamEuro: listeFiyat
  };
  kdUrunler.push(yeni);
  document.getElementById("kdUrunEkleAramaKutusu").style.display="none";
  kdUrunListesiRenderEt();
  showToast("✓ \""+name+"\" listeye eklendi.");
}

function kayitDuzenleKaydetOrtak(){
  if(kdTip===null || kdIdx===null) return false;
  if(kdUrunler.length===0){ showToast("En az bir ürün kalmalı, kaydı silmek için Sil butonunu kullanın."); return false; }
  var arsivData2 = lsGet("weicon_arsiv",{});
  if(!arsivData2[kdTip] || !arsivData2[kdTip][kdIdx]){ showToast("Kayıt artık mevcut değil."); return false; }
  var yeniAd = document.getElementById("kdMusteriAdi").value.trim();
  if(!yeniAd){ showToast("Müşteri adı boş olamaz."); return false; }

  var kayit = arsivData2[kdTip][kdIdx];
  var eskiTip = kdTip;
  var eskiKod = kayit.kod;

  var tipSel = document.getElementById("kdHareketTipiSelect");
  var yeniTip = (tipSel && tipSel.value) ? tipSel.value : kdTip;

  var yeniTs = kayit.ts;
  var tarihEl = document.getElementById("kdTarihInput");
  if(tarihEl && tarihEl.value){
    var parcalanmisTarih = new Date(tarihEl.value);
    if(!isNaN(parcalanmisTarih.getTime())) yeniTs = parcalanmisTarih.getTime();
  }

  var tipDegisti = (yeniTip !== eskiTip);
  var tarihDegisti = (yeniTs !== kayit.ts);

  kayit.musteri = yeniAd;
  kayit.urunler = kdUrunler;
  kayit.ts = yeniTs;
  kayit.mod = yeniTip;
  var yetkiliEl2 = document.getElementById("kdYetkiliInput");
  if(yetkiliEl2) kayit.yetkili = yetkiliEl2.value.trim();
  var vadeEl2 = document.getElementById("kdVadeInput");
  if(vadeEl2) kayit.vade = vadeEl2.value.trim();
  var kargoEl2 = document.getElementById("kdKargoInput");
  if(kargoEl2) kayit.kargo = kargoEl2.value.trim();
  var faturaEl2 = document.getElementById("kdFaturaInput");
  if(faturaEl2) kayit.fatura = faturaEl2.value.trim();
  var aylar = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  var td = new Date(yeniTs);
  var saatStr = ("0"+td.getHours()).slice(-2)+":"+("0"+td.getMinutes()).slice(-2);
  kayit.tarih = td.getDate()+" "+aylar[td.getMonth()]+" "+td.getFullYear()+" - "+saatStr;
  kayit.revizeZamani = Date.now(); // her kaydetmede revize damgası tazelenir

  var sayaclar = null;
  if(tipDegisti || tarihDegisti){
    // Tip veya tarih değiştiyse belge kodu da (SIP/TEK/PRO/NUM + tarih + sıra)
    // yeni duruma göre tazelenir, aksi halde eski koddaki tarih/tip yanıltıcı kalır.
    sayaclar = lsGet("weicon_sayaclar", {});
    kayit.kod = benzersizKodUretTarihli(yeniTip, yeniTs, sayaclar);
    lsSet("weicon_sayaclar", sayaclar);
  }

  if(tipDegisti){
    arsivData2[eskiTip].splice(kdIdx,1);
    if(!arsivData2[yeniTip]) arsivData2[yeniTip]=[];
    arsivData2[yeniTip].push(kayit);
    arsivData2[yeniTip].sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
    kdIdx = arsivData2[yeniTip].indexOf(kayit);
    kdTip = yeniTip;
  } else if(tarihDegisti){
    arsivData2[eskiTip].sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
    kdIdx = arsivData2[eskiTip].indexOf(kayit);
  }

  lsSet("weicon_arsiv", arsivData2);
  arsivData = arsivData2;
  if(window.fbSet){
    var arsivDegisiklikleri = [{tip:yeniTip, kayit:kayit}];
    if(tipDegisti) arsivDegisiklikleri.push({tip:eskiTip, silinecekKod:eskiKod});
    var fbIslemler = [ arsivGuvenliKaydet(arsivDegisiklikleri) ];
    if(sayaclar){
      if(window.fbTransaction){
        fbIslemler.push(window.fbTransaction("sayaclar/"+yeniTip, function(sunucuDegeri){
          return Math.max(sunucuDegeri||0, sayaclar[yeniTip]);
        }));
      } else {
        fbIslemler.push(window.fbSet("sayaclar", sayaclar));
      }
    }
    Promise.all(fbIslemler).then(function(){
      showToast("✓ Kayıt güncellendi (tüm cihazlarda görünecek).");
    }).catch(function(e){
      showToast("⚠️ Firebase HATASI: "+((e&&(e.code||e.message))||"bilinmiyor"), 6000);
    });
  } else {
    showToast("✓ Kayıt güncellendi.");
  }
  if(typeof musteriGecmisRenderEt==="function") musteriGecmisRenderEt();
  if(typeof sonIslemleriRenderEt==="function") sonIslemleriRenderEt();
  if(typeof istatistikHesapla==="function") istatistikHesapla();
  if(typeof bildirimBannerGuncelle==="function") bildirimBannerGuncelle();
  return true;
}

function kayitDuzenleKaydet(){
  if(!kayitDuzenleKaydetOrtak()) return;
  document.getElementById("kayitDuzenleModal").style.display="none";
}

function kayitDuzenleKaydetVeGonder(){
  if(!kayitDuzenleKaydetOrtak()) return;
  var tip = kdTip, idx = kdIdx; // kayitDuzenleKaydetOrtak, tip değiştiyse bunları güncel konuma taşır
  document.getElementById("kayitDuzenleModal").style.display="none";
  musteriGecmisIslemDetayAc(tip, idx);
}

function istatistikKayitSil(tip, idx){
  if(!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
  arsivData = lsGet("weicon_arsiv",{});
  if(!arsivData[tip]) return;
  var silinenKayit = JSON.parse(JSON.stringify(arsivData[tip][idx]));
  arsivData[tip].splice(idx,1);
  lsSet("weicon_arsiv", arsivData);
  if(window.fbSet){
    arsivGuvenliKaydet({tip:tip, silinecekKod:silinenKayit.kod}).then(function(){
      showUndoToast("Kayıt silindi: "+(silinenKayit.musteri||""), function(){ arsivKayitGeriYukle(tip, silinenKayit); });
    }).catch(function(e){
      showToast("⚠️ Firebase HATASI: "+((e&&(e.code||e.message))||"bilinmiyor"), 6000);
    });
  } else {
    showUndoToast("Kayıt silindi: "+(silinenKayit.musteri||""), function(){ arsivKayitGeriYukle(tip, silinenKayit); });
  }
  istatistikHesapla();
  if(typeof sonIslemleriRenderEt==="function") sonIslemleriRenderEt();
  if(typeof musteriGecmisRenderEt==="function") musteriGecmisRenderEt();
}

function arsivKayitGeriYukle(tip, kayit){
  arsivData = lsGet("weicon_arsiv",{});
  if(!arsivData[tip]) arsivData[tip]=[];
  arsivData[tip].push(kayit);
  lsSet("weicon_arsiv", arsivData);
  var tamamla = function(){
    showToast("↩️ Kayıt geri yüklendi.");
    istatistikHesapla();
    if(typeof sonIslemleriRenderEt==="function") sonIslemleriRenderEt();
    if(typeof musteriGecmisRenderEt==="function") musteriGecmisRenderEt();
  };
  if(window.fbSet) arsivGuvenliKaydet({tip:tip, kayit:kayit}).then(tamamla).catch(tamamla);
  else tamamla();
}

function arsivGeriDon(){
  document.getElementById("arsivDetayPanel").style.display="none";
  document.getElementById("arsivAramaSonucPanel").style.display="none";
  document.getElementById("arsivFaturaPanel").style.display="none";
  document.getElementById("arsivBtnPanel").style.display="block";
  arsivSayaclariGuncelle();
}

function arsivSayaclariGuncelle(){
  arsivData = lsGet("weicon_arsiv",{});
  if(!arsivData.siparis) arsivData.siparis=[];
  if(!arsivData.proforma) arsivData.proforma=[];
  if(!arsivData.teklif) arsivData.teklif=[];
  if(!arsivData.numune) arsivData.numune=[];
  document.getElementById("arsivSayac-siparis").textContent = arsivData.siparis.length;
  document.getElementById("arsivSayac-teklif").textContent  = arsivData.teklif.length;
  document.getElementById("arsivSayac-proforma").textContent= arsivData.proforma.length;
  var numuneSayac = document.getElementById("arsivSayac-numune");
  if(numuneSayac) numuneSayac.textContent = arsivData.numune.length;
}

function arsivKategoriAc(tip){
  aktifArsivTab=tip;
  var basliklar={siparis:"📦 SİPARİŞLER", teklif:"💬 FİYAT TEKLİFLERİ", proforma:"🧾 PROFORMA FATURALAR", numune:"📮 NUMUNELER"};
  document.getElementById("arsivKategoriBaslik").textContent = basliklar[tip];
  document.getElementById("arsivBtnPanel").style.display="none";
  document.getElementById("arsivFaturaPanel").style.display="none";
  document.getElementById("arsivDetayPanel").style.display="block";
  renderArsiv();
}

function arsiveKaydet(){
  if(hareketListesi.length===0){ hareketBosUyariGoster(); return; }
  _arsiveKaydetIslem(secilenMod);
}

function arsiveKaydetIletisimden(){
  if(hareketListesi.length===0){ hareketBosUyariGoster(); return; }
  _arsiveKaydetIslem(secilenMod);
}

function benzersizKodUretTarihli(tip, tarihMs, sayaclar){
  var prefixMap = {siparis:"SIP", teklif:"TEK", proforma:"PRO", numune:"NUM", ziyaret:"ZIY", telefon:"TLF", mail:"MEL", mesaj:"MSJ", takip:"TKP"};
  var prefix = prefixMap[tip] || "GEN";
  var mevcut = (sayaclar[tip]||0) + 1;
  sayaclar[tip] = mevcut;
  var d = new Date(tarihMs || Date.now());
  var tarihKisim = ("0"+d.getDate()).slice(-2)+("0"+(d.getMonth()+1)).slice(-2)+d.getFullYear().toString().slice(-2);
  var siraStr = ("000"+mevcut).slice(-4);
  return prefix+tarihKisim+"-"+siraStr;
}

function eskiKayitlaraKodAta(){
  if(localStorage.getItem("weicon_kod_migrasyon_v1")) return;

  function isle(arsivDataYerel, musteriListesiVerisi){
    var sayaclar = lsGet("weicon_sayaclar", {});
    var tipler = ["siparis","teklif","proforma","numune"];
    var degisti = false;
    var toplamAtanan = 0;
    tipler.forEach(function(tip){
      var liste = (arsivDataYerel[tip]||[]).slice().sort(function(a,b){ return (a.ts||0)-(b.ts||0); });
      liste.forEach(function(kayit){
        if(!kayit.kod){
          kayit.kod = benzersizKodUretTarihli(tip, kayit.ts, sayaclar);
          degisti = true; toplamAtanan++;
        }
      });
    });
    (musteriListesiVerisi||[]).forEach(function(m){
      var liste = (m.ziyaretGecmisi||[]).slice().sort(function(a,b){ return (a.ts||0)-(b.ts||0); });
      liste.forEach(function(z){
        if(!z.kod){
          z.kod = benzersizKodUretTarihli(z.tur||"ziyaret", z.ts, sayaclar);
          degisti = true; toplamAtanan++;
        }
      });
    });
    localStorage.setItem("weicon_kod_migrasyon_v1", "1");
    if(degisti){
      lsSet("weicon_arsiv", arsivDataYerel);
      lsSet("weicon_musteriler", musteriListesiVerisi);
      lsSet("weicon_sayaclar", sayaclar);
      musteriListesi = musteriListesiVerisi;
      arsivData = arsivDataYerel;
      if(window.fbSet){
        window.fbSet("arsiv", arsivDataYerel).catch(function(e){ console.error("Firebase yazma hatası:", e); });
        window.fbSet("musteriler", musteriListesiVerisi).catch(function(e){ console.error("Firebase yazma hatası:", e); });
        window.fbSet("sayaclar", sayaclar).catch(function(e){ console.error("Firebase yazma hatası:", e); });
      }
      if(typeof sonIslemleriRenderEt==="function") sonIslemleriRenderEt();
      if(typeof musteriGecmisRenderEt==="function") musteriGecmisRenderEt();
      showToast("✓ "+toplamAtanan+" eski kayda kod atandı.", 4000);
    }
  }

  if(window.fbGet){
    Promise.all([window.fbGet("arsiv"), window.fbGet("musteriler")]).then(function(results){
      var arsivDataYerel = results[0] || {};
      var musteriListesiVerisi = results[1] ? (Array.isArray(results[1])?results[1]:Object.values(results[1])) : [];
      isle(arsivDataYerel, musteriListesiVerisi);
    }).catch(function(){
      isle(lsGet("weicon_arsiv",{}), lsGet("weicon_musteriler",[]));
    });
  } else {
    isle(lsGet("weicon_arsiv",{}), lsGet("weicon_musteriler",[]));
  }
}

function benzersizKodUret(tip){
  var prefixMap = {siparis:"SIP", teklif:"TEK", proforma:"PRO", numune:"NUM", ziyaret:"ZIY", telefon:"TLF", mail:"MEL", mesaj:"MSJ", takip:"TKP"};
  var prefix = prefixMap[tip] || "GEN";
  var sayaclar = lsGet("weicon_sayaclar", {});
  var mevcut = (sayaclar[tip]||0) + 1;
  sayaclar[tip] = mevcut;
  lsSet("weicon_sayaclar", sayaclar);
  // Firebase'e artık TÜM sayaçlar nesnesi komple üzerine yazılmıyor — sadece bu
  // tipin sayacı, sunucuda ATOMİK olarak (transaction) en az bu değere yükseltiliyor.
  // Böylece iki cihaz aynı anda kod üretse bile birbirinin artışını silmiyor
  // (eskiden fbSet ile komple nesne yazıldığında diğer cihazın az önce yaptığı
  // artış sessizce kaybolabiliyordu).
  if(window.fbTransaction){
    window.fbTransaction("sayaclar/"+tip, function(sunucuDegeri){
      return Math.max(sunucuDegeri||0, mevcut);
    });
  } else if(window.fbSet){
    window.fbSet("sayaclar", sayaclar).catch(function(e){ console.error("Firebase yazma hatası:", e); });
  }
  var d = new Date();
  var tarihKisim = ("0"+d.getDate()).slice(-2)+("0"+(d.getMonth()+1)).slice(-2)+d.getFullYear().toString().slice(-2);
  var siraStr = ("000"+mevcut).slice(-4);
  return prefix+tarihKisim+"-"+siraStr;
}
var KOD_RENK = {SIP:"#003a70", TEK:"#28a745", PRO:"#8e44ad", NUM:"#b7601f", ZIY:"#16a085", TLF:"#003a70", MEL:"#b7601f", MSJ:"#8e44ad", TKP:"#b7601f"};
function kodHtmlOlustur(kod, fontBuyuk, fontKucuk, kanal){
  if(!kod) return "-";
  var harf = kod.slice(0,3);
  var gerisi = kod.slice(3);
  var renk = KOD_RENK[harf] || "#333";
  var buyukPx = Math.round((fontBuyuk||16)*1.2);
  var kanalOnEk = "";
  if(kanal==="whatsapp") kanalOnEk = "<span style='color:#1a8a4a;font-weight:900;'>W</span><span style='color:#9aa5b1;font-weight:700;'> - </span>";
  else if(kanal==="mail") kanalOnEk = "<span style='color:#1a5aad;font-weight:900;'>M</span><span style='color:#9aa5b1;font-weight:700;'> - </span>";
  return "<div style='font-family:monospace;line-height:1.2;white-space:nowrap;'><div style='font-size:"+buyukPx+"px;font-weight:900;color:"+renk+";'>"+kanalOnEk+harf+"</div><div style='font-size:"+(fontKucuk||11)+"px;font-weight:900;color:#e0524a;background:#fff;'>"+gerisi+"</div></div>";
}

function urunSetiImzaOlustur(urunler){
  return (urunler||[]).map(function(u){ return (u.berta||"")+"|"+(u.abas||""); }).sort().join(",");
}

function _arsiveKaydetIslem(tip, kod, kanal){
  if(arsivKaydiIsleniyor) return;
  if(hareketListesi.length===0) return;
  arsivKaydiIsleniyor = true;
  arsivData = lsGet("weicon_arsiv",{});
  if(!arsivData.siparis) arsivData.siparis=[];
  if(!arsivData.proforma) arsivData.proforma=[];
  if(!arsivData.teklif) arsivData.teklif=[];
  if(!arsivData.numune) arsivData.numune=[];
  var cn=getDynamicCustomerName(); var cv=getDynamicCustomerVade(); var cf=getDynamicCustomerFatura();
  var cy=getDynamicCustomerYetkili(); var ck=getDynamicCustomerKargo();
  var cFaturaAdr = (typeof getDynamicCustomerFaturaAdresi==="function") ? getDynamicCustomerFaturaAdresi() : "";
  var cTeslimatAdr = (typeof getDynamicCustomerTeslimatAdresi==="function") ? getDynamicCustomerTeslimatAdresi() : "";
  var bugun=new Date();
  var aylar=["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  var saat=bugun.getHours().toString().padStart(2,"0")+":"+bugun.getMinutes().toString().padStart(2,"0");
  var tarih=bugun.getDate()+" "+aylar[bugun.getMonth()]+" "+bugun.getFullYear()+" - "+saat;
  var ts=bugun.getTime();

  // Aynı gün + aynı müşteri + aynı işlem türü + BİREBİR AYNI ürün seti (Berta/Abas
  // kodlarına göre — sadece adet/iskonto/fiyat farkı olabilir, ürün eklenip/çıkarılmamış
  // olmalı) bulunursa ikinci bir evrak açmak yerine mevcut kaydı güncelleyip REVİZE damgası
  // basıyoruz. Böylece unutularak art arda gönderilen aynı sipariş, mükerrer kayıt olmuyor.
  var yeniImza = urunSetiImzaOlustur(hareketListesi);
  var aktifMusteriId = (typeof seciliMusteri!=="undefined" && seciliMusteri && seciliMusteri.id) || null;
  var eslesenKayit = null;
  for(var ei=0; ei<arsivData[tip].length; ei++){
    var aday = arsivData[tip][ei];
    if(!aday || !aday.ts) continue;
    var ayniMusteriMi = aktifMusteriId && aday.musteriId ? (aday.musteriId===aktifMusteriId) : (aday.musteri===cn);
    if(!ayniMusteriMi) continue;
    var adayTarihObj = new Date(aday.ts);
    if(adayTarihObj.getFullYear()!==bugun.getFullYear() || adayTarihObj.getMonth()!==bugun.getMonth() || adayTarihObj.getDate()!==bugun.getDate()) continue;
    if(urunSetiImzaOlustur(aday.urunler) !== yeniImza) continue;
    eslesenKayit = aday;
    break;
  }

  var otomatikRevizeMi = false;
  var kaydedilenKayit = null;
  if(eslesenKayit){
    // REVİZE GEÇMİŞİ: üzerine yazmadan önce eski hâli (fiyat/ürün seti + zaman)
    // revizeGecmisi dizisine ekleniyor — böylece bir teklif/sipariş birden
    // fazla kez revize edilse bile önceki fiyatların tamamı kayboluyor değil,
    // "v1 → 1.250€, v2 → 1.180€" gibi bir tarihçe olarak saklanıyor.
    var eskiToplamEuro = (eslesenKayit.urunler||[]).reduce(function(s,u){ return s+(u.toplamEuro||0); }, 0);
    if(!eslesenKayit.revizeGecmisi) eslesenKayit.revizeGecmisi = [];
    eslesenKayit.revizeGecmisi.push({
      ts: eslesenKayit.revizeZamani || eslesenKayit.ts,
      toplamEuro: eskiToplamEuro,
      urunSayisi: (eslesenKayit.urunler||[]).length
    });
    eslesenKayit.urunler = JSON.parse(JSON.stringify(hareketListesi));
    eslesenKayit.vade=cv; eslesenKayit.fatura=cf; eslesenKayit.yetkili=cy; eslesenKayit.kargo=ck;
    eslesenKayit.faturaAdresi=cFaturaAdr; eslesenKayit.teslimatAdresi=cTeslimatAdr;
    if(kanal) eslesenKayit.kanal = kanal;
    if(!eslesenKayit.musteriId && aktifMusteriId) eslesenKayit.musteriId = aktifMusteriId; // eski kayıtta ID yoksa şimdi tamamla
    eslesenKayit.revizeZamani = ts;
    otomatikRevizeMi = true;
    kaydedilenKayit = eslesenKayit;
  } else {
    var kayit={
      tarih:tarih, ts:ts, kod:kod||benzersizKodUret(tip),
      musteri:cn, musteriId:(typeof seciliMusteri!=="undefined" && seciliMusteri && seciliMusteri.id) || null,
      vade:cv, fatura:cf, yetkili:cy, kargo:ck,
      faturaAdresi:cFaturaAdr, teslimatAdresi:cTeslimatAdr,
      mod:tip, kanal:(kanal||null),
      urunler:JSON.parse(JSON.stringify(hareketListesi))
    };
    arsivData[tip].unshift(kayit);
    kaydedilenKayit = kayit;
  }
  arsivData[tip].sort(function(a,b){ return (b.ts||0)-(a.ts||0); });

  // "İlerlet" ile (Numune→Teklif→Proforma→Sipariş) hazırlanan bir belgeyse, eski aşamanın
  // kaydını arşivden SİL — artık iki ayrı kayıt değil, tek kayıt yeni türe dönüşmüş olur.
  var kaynakSilindiTip = null, kaynakSilindiTs = null;
  if(ilerletilenSurecKaynagi){
    var kaynakTip = ilerletilenSurecKaynagi.tip;
    var kaynakTs = ilerletilenSurecKaynagi.ts;
    if(arsivData[kaynakTip]){
      arsivData[kaynakTip] = arsivData[kaynakTip].filter(function(k){ return k.ts !== kaynakTs; });
    }
    kaynakSilindiTip = kaynakTip; kaynakSilindiTs = kaynakTs;
    ilerletilenSurecKaynagi = null;
  }

  lsSet("weicon_arsiv", arsivData);
  if(window.fbSet){
    var arsivDegisiklikleri = [{tip:tip, kayit:kaydedilenKayit}];
    if(kaynakSilindiTip) arsivDegisiklikleri.push({tip:kaynakSilindiTip, silinecekTs:kaynakSilindiTs});
    arsivGuvenliKaydet(arsivDegisiklikleri).then(function(){
      showToast(otomatikRevizeMi ? "🔄 Aynı ürünlerle mevcut kayıt bulundu — ikinci evrak açılmadı, REVİZE olarak güncellendi." : "✓ Firebase'e kaydedildi (tüm cihazlarda görünecek)", otomatikRevizeMi?5000:3000);
    }).catch(function(e){
      showToast("⚠️ Firebase HATASI: "+((e&&(e.code||e.message))||"bilinmiyor"), 6000);
    });
  } else {
    showToast(otomatikRevizeMi ? "🔄 Aynı ürünlerle mevcut kayıt bulundu — ikinci evrak açılmadı, REVİZE olarak güncellendi." : "✓ Arşive kaydedildi (yerel)", otomatikRevizeMi?5000:3000);
  }
  arsiveKaydetSonrasiSifirla();
  bildirimBannerGuncelle();
  setTimeout(function(){ arsivKaydiIsleniyor = false; }, 1500);
  // Arşive gitme - sadece bildir
}

function arsiveKaydetSonrasiSifirla(){
  basket = [];
  hareketListesi = [];
  aktarilanUrun = null;
  seciliMusteri = null;
  secilenMod = null;
  if(typeof islemTuruRenkGuncelle==="function") islemTuruRenkGuncelle();
  localStorage.removeItem("weicon_secili_musteri");
  updateBasketCount();
  var kartEl = document.getElementById("aktarilanKart");
  if(kartEl) kartEl.style.display="none";
  var lfEl = document.getElementById("listeFiyat");
  var dfEl = document.getElementById("dipFiyat");
  var isEl = document.getElementById("iskonto");
  var adEl = document.getElementById("adet");
  if(lfEl) lfEl.value="0";
  if(dfEl) dfEl.value="0";
  if(isEl) isEl.value="0";
  if(adEl) adEl.value="1";
  hesapla();
  musteriSeritiGuncelle();
  if(typeof renderBasket==="function") renderBasket();
  if(typeof renderHareket==="function") renderHareket();
  if(activeCurrentPage===5 && typeof generateCommunicationData==="function") generateCommunicationData();
}

function arsivKayitSil(tip, idx){
  arsivData = lsGet("weicon_arsiv",{});
  if(!arsivData[tip]) return;
  arsivData[tip].splice(idx,1);
  lsSet("weicon_arsiv", arsivData);
  renderArsiv();
  if(typeof sonIslemleriRenderEt==="function") sonIslemleriRenderEt();
  if(typeof musteriGecmisRenderEt==="function") musteriGecmisRenderEt();
  showToast("Kayıt silindi.");
}

function renderArsiv(){
  arsivData = lsGet("weicon_arsiv",{});
  if(!arsivData.siparis) arsivData.siparis=[];
  if(!arsivData.proforma) arsivData.proforma=[];
  if(!arsivData.teklif) arsivData.teklif=[];
  if(!arsivData.numune) arsivData.numune=[];
  var c=document.getElementById("arsivListesiDiv");
  var e=document.getElementById("arsivBosMsg");
  c.innerHTML="";
  var liste=arsivData[aktifArsivTab]||[];
  if(liste.length===0){ e.style.display="block"; return; }
  e.style.display="none";
  for(var i=0;i<liste.length;i++){
    var k=liste[i];
    var div=document.createElement("div"); div.className="arsiv-kayit";
    div.style.cursor="pointer";
    var urunSayisi=k.urunler.length;
    div.innerHTML="<button class=\"btn-arsiv-sil\" onclick=\"event.stopPropagation();arsivKayitSil('"+aktifArsivTab+"',"+i+")\">Sil</button>"
      +"<div class=\"arsiv-kayit-tarih\">"+k.tarih+"</div>"
      +"<div class=\"arsiv-kayit-musteri\">"+k.musteri+"</div>"
      +"<div class=\"arsiv-kayit-detay\" style=\"margin-top:4px;color:#16a085;font-weight:bold;\">"+urunSayisi+" ürün — Detayı görmek için dokunun →</div>";
    div.onclick=(function(tip,idx){ return function(){ arsivDetayAc(tip,idx); }; })(aktifArsivTab,i);
    c.appendChild(div);
  }
}

/* ============================================================
   ARŞİV DETAY / FATURA GÖRÜNÜMÜ
============================================================ */
// Bir teklif/numune/proforma kaydını "düzenlenebilir" (bekleyen) halde Sepet'e taşır,
// ürünlere dokunup gramaj/ürün değiştirilebilir, hesaplandıktan sonra hedef SİPARİŞ olarak gönderilir.
// ============================================================
// HAREKET SEÇ — Müşteri kartı / İşlem Geçmişi / İstatistikler'den ulaşılan
// TEK ORTAK akış: bir kaydın (teklif/numune/proforma/sipariş) ürünlerini,
// MEVCUT fiyat/iskonto/adediyle DOĞRUDAN hesaplanmış olarak Sepet'e yükler.
// Hiçbir ürünü yeniden hesaplamaya zorlamaz — değişecek ürün varsa
// kullanıcı sadece o ürüne dokunup düzenler, diğerleri olduğu gibi kalır.
// ============================================================
var hareketSecKaynak = null;

function hareketSecPopupAc(tip, idx){
  hareketSecKaynak = {tip:tip, idx:idx};
  document.getElementById("hareketSecModal").style.display = "flex";
}

function hareketSecKapat(){
  document.getElementById("hareketSecModal").style.display = "none";
}

function hareketSecTuruSecildi(hedefTur){
  if(!hareketSecKaynak) return;
  var tip = hareketSecKaynak.tip, idx = hareketSecKaynak.idx;
  hareketSecKaynak = null;
  document.getElementById("hareketSecModal").style.display = "none";

  var arsiv = lsGet("weicon_arsiv", {});
  var kayit = arsiv[tip] ? arsiv[tip][idx] : null;
  if(!kayit){ showToast("Kayıt bulunamadı."); return; }
  if(!kayit.urunler || kayit.urunler.length===0){ showToast("Bu işlemde ürün bulunamadı."); return; }

  musteriListesi = lsGet("weicon_musteriler", []);
  var bulunanMusteri = null;
  for(var i=0;i<musteriListesi.length;i++){
    if(musteriListesi[i].ad === kayit.musteri){ bulunanMusteri = musteriListesi[i]; break; }
  }
  seciliMusteri = bulunanMusteri || {ad: kayit.musteri||"-", sehir:"", vade:kayit.vade||"", fatura:kayit.fatura||"", yetkili:kayit.yetkili||"", kargo:kayit.kargo||""};
  lsSet("weicon_secili_musteri", seciliMusteri);

  // Ürünleri mevcut fiyat/iskonto/adediyle DOĞRUDAN HESAPLANMIŞ (yeşil) olarak yükle.
  hareketListesi = kayit.urunler.map(function(item, i){
    return {
      id: item.id || ("hs"+Date.now()+i),
      name: item.name || "Ürün",
      berta: item.berta || "-",
      abas: item.abas || "-",
      listeFiyat: item.listeFiyat!==undefined ? item.listeFiyat : (item.price||0),
      dipFiyat: item.dipFiyat!==undefined ? item.dipFiyat : 0,
      iskonto: item.iskonto!==undefined ? item.iskonto : 0,
      adet: item.adet||1,
      kur: item.kur,
      iskBirim: item.iskBirim!==undefined ? item.iskBirim : (item.listeFiyat||0),
      toplamEuro: item.toplamEuro!==undefined ? item.toplamEuro : ((item.listeFiyat||0)*(item.adet||1))
    };
  });
  basket = [];
  aktarilanUrun = null;

  secilenMod = hedefTur;

  switchTab(5);

  var vEl=document.getElementById("custVadeInput"); if(vEl && kayit.vade) vEl.value = kayit.vade;
  var fEl=document.getElementById("custFaturaInput"); if(fEl && kayit.fatura) fEl.value = kayit.fatura;
  var yEl=document.getElementById("custYetkiliInput"); if(yEl && kayit.yetkili) yEl.value = kayit.yetkili;
  var kEl=document.getElementById("custKargoInput"); if(kEl && kayit.kargo) kEl.value = kayit.kargo;
  var tEl=document.getElementById("custTeslimatAdresiInput"); if(tEl) tEl.value = kayit.teslimatAdresi||"";

  updateBasketCount();
  if(typeof islemTuruRenkGuncelle==="function") islemTuruRenkGuncelle();
  generateCommunicationData();
  if(typeof renderBirlesikTablo==="function") renderBirlesikTablo();
  showToast("✓ "+kayit.musteri+" — "+(ISLEM_TURU_ADI[hedefTur]||hedefTur)+" olarak hazır. Değişecek ürün varsa dokunup düzenleyin, diğerleri aynen kalır.", 5500);
}

function islemiDuzenleVeIlerle(tip, idx){
  var arsiv = lsGet("weicon_arsiv",{});
  var kayit = arsiv[tip] ? arsiv[tip][idx] : null;
  if(!kayit){ showToast("Kayıt bulunamadı."); return; }
  if(!kayit.urunler || kayit.urunler.length===0){ showToast("Bu işlemde ürün bulunamadı."); return; }

  musteriListesi = lsGet("weicon_musteriler",[]);
  var bulunanMusteri = null;
  for(var i=0;i<musteriListesi.length;i++){
    if(musteriListesi[i].ad === kayit.musteri){ bulunanMusteri = musteriListesi[i]; break; }
  }
  seciliMusteri = bulunanMusteri || {ad: kayit.musteri||"-", sehir:"", vade:kayit.vade||"", fatura:kayit.fatura||"", yetkili:kayit.yetkili||"", kargo:kayit.kargo||""};
  lsSet("weicon_secili_musteri", seciliMusteri);

  // Ürünleri HESAPLANMIŞ olarak değil, BEKLEYEN (sarı) olarak sepete koy —
  // böylece her ürüne dokunup "✏️ Düzenle" ile farklı bir ürün/gramaj seçilebilir.
  hareketListesi = [];
  basket = kayit.urunler.map(function(item, i){
    return {
      id: item.id || ("duz"+Date.now()+i),
      name: item.name || "Ürün",
      price: item.listeFiyat!==undefined ? item.listeFiyat : (item.price||0),
      berta: item.berta||"-",
      abas: item.abas||"-",
      quantity: 1,
      asilAdet: item.adet||1
    };
  });
  aktarilanUrun = null;

  // Hedef işlem türünü SİPARİŞ olarak ayarla (teklif/numune/proforma -> sipariş dönüşümü)
  secilenMod = "siparis";

  switchTab(5);

  var vEl=document.getElementById("custVadeInput"); if(vEl && kayit.vade) vEl.value = kayit.vade;
  var fEl=document.getElementById("custFaturaInput"); if(fEl && kayit.fatura) fEl.value = kayit.fatura;
  var yEl=document.getElementById("custYetkiliInput"); if(yEl && kayit.yetkili) yEl.value = kayit.yetkili;
  var kEl=document.getElementById("custKargoInput"); if(kEl && kayit.kargo) kEl.value = kayit.kargo;
  var tEl=document.getElementById("custTeslimatAdresiInput"); if(tEl) tEl.value = kayit.teslimatAdresi||"";

  updateBasketCount();
  if(typeof islemTuruRenkGuncelle==="function") islemTuruRenkGuncelle();
  generateCommunicationData();
  if(typeof renderBirlesikTablo==="function") renderBirlesikTablo();
  showToast("✏️ "+kayit.musteri+" için düzenleme modu açıldı. Ürüne dokunup ✏️ Düzenle ile gramajı/ürünü değiştirin, sonra SİPARİŞ olarak gönderin.", 6000);
}

function islemiTekrarla(tip, idx){
  var arsiv = lsGet("weicon_arsiv",{});
  var kayit = arsiv[tip] ? arsiv[tip][idx] : null;
  if(!kayit){ showToast("Kayıt bulunamadı."); return; }
  if(!kayit.urunler || kayit.urunler.length===0){ showToast("Bu işlemde ürün bulunamadı."); return; }

  // Müşteriyi bul (kayıtlı müşteri listesinde varsa tam profiliyle, yoksa kayıttaki bilgilerle)
  musteriListesi = lsGet("weicon_musteriler",[]);
  var bulunanMusteri = null;
  for(var i=0;i<musteriListesi.length;i++){
    if(musteriListesi[i].ad === kayit.musteri){ bulunanMusteri = musteriListesi[i]; break; }
  }
  seciliMusteri = bulunanMusteri || {ad: kayit.musteri||"-", sehir:"", vade:kayit.vade||"", fatura:kayit.fatura||"", yetkili:kayit.yetkili||"", kargo:kayit.kargo||""};
  lsSet("weicon_secili_musteri", seciliMusteri);

  // Ürünleri hareket listesine yükle (tarih, gönderim anında otomatik bugünün tarihi olacak)
  hareketListesi = JSON.parse(JSON.stringify(kayit.urunler));
  basket = [];
  aktarilanUrun = null;

  // İşlem türünü kayıttaki türle eşle
  secilenMod = tip;

  switchTab(5);

  // Vade/Fatura/Kargo/Yetkili'yi kaydın kendi değerleriyle güncelle (müşteri profilindeki genel değerler yerine)
  var vEl=document.getElementById("custVadeInput"); if(vEl && kayit.vade) vEl.value = kayit.vade;
  var fEl=document.getElementById("custFaturaInput"); if(fEl && kayit.fatura) fEl.value = kayit.fatura;
  var yEl=document.getElementById("custYetkiliInput"); if(yEl && kayit.yetkili) yEl.value = kayit.yetkili;
  var kEl=document.getElementById("custKargoInput"); if(kEl && kayit.kargo) kEl.value = kayit.kargo;
  var tEl=document.getElementById("custTeslimatAdresiInput"); if(tEl) tEl.value = kayit.teslimatAdresi||"";

  updateBasketCount();
  if(typeof islemTuruRenkGuncelle==="function") islemTuruRenkGuncelle();
  generateCommunicationData();
  showToast("✓ "+kayit.musteri+" için işlem tekrarlandı — SEPET'te düzenleyip gönderebilirsiniz.");
}

function arsivDetayAc(tip, idx){
  arsivData = lsGet("weicon_arsiv",{});
  var kayit = arsivData[tip] ? arsivData[tip][idx] : null;
  if(!kayit) return;
  var belgeTipi = ISLEM_TURU_ADI[tip] || (tip?tip.toUpperCase():"SİPARİŞ");
  faturaOnizlemePopupGoster(kayit.musteri||"-", "", kayit.tarih||"-", kayit.urunler||[], belgeTipi, tip, idx);
}

function arsivDetayKapat(){
  document.getElementById("arsivFaturaPanel").style.display="none";
  document.getElementById("arsivAnaPanel").style.display="none";
  document.getElementById("istatistikPanel").style.display="block";
  istatistikHesapla();
}