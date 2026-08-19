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
      // Bugünün Bitiş KM'si, yarının Başlangıç KM'sine otomatik a
