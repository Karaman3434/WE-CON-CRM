// WEICON ASİST VERSİYON: W230826.1822.552 — app-part2.js
var APP_PART2_VERSION = "W230826.1822.552";
function gorevKaydet(){
  if(musteriKartIdx===null || !musteriListesi[musteriKartIdx]) return;
  var aciklama = document.getElementById("gorevAciklamaInput").value.trim();
  var baslangicTarihi = document.getElementById("gorevBaslangicTarihInput").value;
  var bitisTarihi = document.getElementById("gorevBitisTarihInput").value;
  var saat = document.getElementById("gorevSaatInput").value;
  if(!aciklama){ showToast("Açıklama girin."); return; }
  if(!baslangicTarihi || !bitisTarihi || !saat){ showToast("Başlangıç/Bitiş tarihi ve saati girin."); return; }
  if(bitisTarihi < baslangicTarihi){ showToast("Bitiş tarihi, başlangıçtan önce olamaz."); return; }
  var yeniGorev = {
    id: "gorev_"+Date.now()+"_"+Math.floor(Math.random()*10000),
    musteriAd: musteriListesi[musteriKartIdx].ad,
    aciklama: aciklama,
    baslangicTarihi: baslangicTarihi,
    bitisTarihi: bitisTarihi,
    saat: saat,
    tamamlandi: false,
    tamamlanmaZamani: null,
    olusturmaZamani: Date.now()
  };
  gorevListesi.push(yeniGorev);
  gorevleriKaydet();
  document.getElementById("gorevTanimlaModal").style.display="none";
  showToast("✓ Görev kaydedildi.");
  gorevBadgeGuncelle();
  bildirimBannerGuncelle();
}

function gorevFiltreSec(hangi){
  gorevAktifFiltre = hangi;
  ["bekleyen","tamamlanan","kapanan","tumu"].forEach(function(f){
    var btn = document.getElementById("gorevFiltre"+f.charAt(0).toUpperCase()+f.slice(1)+"Btn");
    if(btn){
      if(f===hangi){ btn.style.background="#b7601f"; btn.style.color="#fff"; }
      else { btn.style.background="transparent"; btn.style.color="#b7601f"; }
    }
  });
  gorevListesiRenderEt();
}

// haftalikAcikFaturaListesi'nin aksine durum atanmış kayıtları da döndürür (durum bilgisiyle birlikte) —
// birleşik Görevlerim ekranında Tamamlanan/Kapanan sekmelerinde göstermek için gerekli.
function haftalikTumKayitlariGetir(tip){
  var arsiv = lsGet("weicon_arsiv", {});
  var liste = arsiv[tip] || [];
  var siparisListesi = arsiv.siparis || [];
  var durumHaritasi = haftalikDurumHaritasiGetir();
  var sonuc = [];
  for(var i=0;i<liste.length;i++){
    var k = liste[i];
    var anahtar = tip+"_"+(k.ts||0);
    var sonrasindaSiparisVar = siparisListesi.some(function(s){
      return (s.musteri||"").toLocaleLowerCase("tr-TR")===(k.musteri||"").toLocaleLowerCase("tr-TR") && (s.ts||0) > (k.ts||0);
    });
    if(sonrasindaSiparisVar) continue;
    var gunFarki = Math.floor((Date.now() - (k.ts||0)) / 86400000);
    sonuc.push({anahtar:anahtar, musteri:k.musteri||"", musteriId:k.musteriId||null, tarih:k.tarih||"", ts:k.ts||0, gun:gunFarki, urunSayisi:(k.urunler||[]).length, durum:(durumHaritasi[anahtar]?durumHaritasi[anahtar].durum:null)});
  }
  sonuc.sort(function(a,b){ return b.gun-a.gun; });
  return sonuc;
}

// haftalikAcikZiyaretListesi'nin aksine durum atanmış kayıtları da döndürür
function haftalikTumZiyaretleriGetir(){
  var durumHaritasi = haftalikDurumHaritasiGetir();
  var sonuc = [];
  for(var i=0;i<musteriListesi.length;i++){
    var m = musteriListesi[i];
    var liste = m.ziyaretGecmisi || [];
    if(liste.length===0) continue;
    var enSon = liste[0];
    for(var k=1;k<liste.length;k++){ if((liste[k].ts||0) > (enSon.ts||0)) enSon = liste[k]; }
    var enSonTs = enSon.ts || 0;
    var gunFarki = Math.floor((Date.now() - enSonTs) / 86400000);
    if(gunFarki < 15) continue;
    var anahtar = "ziyaret_"+m.ad+"_"+enSonTs;
    sonuc.push({anahtar:anahtar, musteri:m.ad, musteriId:m.id||null, sehir:m.sehir||"", not:enSon.not||"", ts:enSonTs, gun:gunFarki, durum:(durumHaritasi[anahtar]?durumHaritasi[anahtar].durum:null)});
  }
  sonuc.sort(function(a,b){ return b.gun-a.gun; });
  return sonuc;
}

// Haftalık takip (teklif/numune/ziyaret) durumunu, Bekleyen/Tamamlanan/Kapanan kategorisine çevirir
function haftalikDurumKategorisi(durum){
  if(durum==="tamamlandi") return "tamamlanan";
  if(durum==="sonaerdi" || durum==="kapatildi") return "kapanan";
  return "bekleyen"; // durum yok veya "izleniyor"
}

// "SON HAREKET" — bir müşteri için Temas geçmişi + Arşiv kayıtlarını (teklif/
// proforma/numune/sipariş) BİRLEŞTİRİP tarihe göre sıralar. Tamamen sistemden
// otomatik çekilir, elle veri girilmez.
function sonHareketGecmisiGetir(musteriAd, musteriId){
  var liste = [];
  var m = null;
  for(var i=0;i<musteriListesi.length;i++){
    if(musteriId && musteriListesi[i].id===musteriId){ m = musteriListesi[i]; break; }
    if(!musteriId && musteriListesi[i].ad===musteriAd){ m = musteriListesi[i]; break; }
  }
  if(m && m.ziyaretGecmisi){
    var temasMetin = {ziyaret:"Ziyaret edildi", telefon:"Arandı", mail:"Mail atıldı", mesaj:"Mesaj gönderildi", takip:"Takip notu"};
    m.ziyaretGecmisi.forEach(function(z){
      var t = TEMAS_TURLERI[z.tur] || TEMAS_TURLERI.ziyaret;
      var metin = temasMetin[z.tur] || "Temas kuruldu";
      liste.push({ts:z.ts||0, renk:t.renk, ikon:t.ikon, etiket:metin+(z.not?" — "+safeText(z.not):"")});
    });
  }
  var arsiv = lsGet("weicon_arsiv", {});
  var tipBilgi = {
    teklif:  {ikon:"💬", ad:"Fiyat teklifi verildi", renk:"#28a745"},
    proforma:{ikon:"🧾", ad:"Proforma verildi", renk:"#2563eb"},
    numune:  {ikon:"📮", ad:"Numune bırakıldı", renk:"#f2994a"},
    siparis: {ikon:"📦", ad:"Sipariş alındı", renk:"#0e7c63"}
  };
  ["teklif","proforma","numune","siparis"].forEach(function(tip){
    (arsiv[tip]||[]).forEach(function(k){
      var eslesiyorMu = (musteriId && k.musteriId) ? (k.musteriId===musteriId) : ((k.musteri||"").toLocaleLowerCase("tr-TR")===(musteriAd||"").toLocaleLowerCase("tr-TR"));
      if(!eslesiyorMu) return;
      var bilgi = tipBilgi[tip];
      liste.push({ts:k.ts||0, renk:bilgi.renk, ikon:bilgi.ikon, etiket:bilgi.ad+" ("+(k.urunler||[]).length+" ürün)"});
    });
  });
  liste.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
  return liste;
}

function sonHareketZamanCizelgesiHTML(liste){
  if(liste.length===0){
    return "<div style='color:#888;font-size:30px;padding:14px 0;'>Henüz kayıtlı hareket yok.</div>";
  }
  var html = "<div style='position:relative;padding-left:28px;border-left:2px solid #e3e8ef;'>";
  liste.forEach(function(h, idx){
    var d = new Date(h.ts);
    var tarihStr = d.getDate()+" "+["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"][d.getMonth()]+" "+d.getFullYear();
    var saatStr = ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2);
    html += "<div style='margin-bottom:"+(idx===liste.length-1?"0":"26px")+";position:relative;'>"
      + "<div style='position:absolute;left:-34px;top:4px;width:14px;height:14px;border-radius:50%;background:"+h.renk+";'></div>"
      + "<div style='font-size:28px;font-weight:800;color:#333;'>"+h.ikon+" "+h.etiket+"</div>"
      + "<div style='font-size:24px;color:#8a94a3;'>"+tarihStr+" · "+saatStr+"</div>"
      + "</div>";
  });
  html += "</div>";
  return html;
}

// Görevlerim'deki bir açık-süreç kartındaki "📅 SON HAREKET" etiketine dokununca açılır.
var sonHareketAktifAnahtar = null, sonHareketAktifMusteriAdi = null, sonHareketAktifBaslik = null;
function sonHareketAc(anahtar, musteriAdi, baslik){
  sonHareketAktifAnahtar = anahtar;
  sonHareketAktifMusteriAdi = musteriAdi;
  sonHareketAktifBaslik = baslik;
  document.getElementById("sonHareketMusteriAd").textContent = "🏢 "+(musteriAdi||"");
  var liste = sonHareketGecmisiGetir(musteriAdi, null);
  document.getElementById("sonHareketZamanCizelgesi").innerHTML = sonHareketZamanCizelgesiHTML(liste);
  document.getElementById("sonHareketModal").style.display = "flex";
}

function sonHareketNotEkleAc(){
  document.getElementById("sonHareketModal").style.display = "none";
  gorevTakipAc(sonHareketAktifAnahtar, sonHareketAktifMusteriAdi, sonHareketAktifBaslik);
}

function sonHareketTamamlandiIsaretle(){
  if(!sonHareketAktifAnahtar) return;
  document.getElementById("sonHareketModal").style.display = "none";
  haftalikKartDurumSec(sonHareketAktifAnahtar, "tamamlandi");
}

// Görevlerim popup'ının içindeki "+ Görev Gir" butonu — eskiden İşlemler
// ekranında ayrı bir kart olarak duruyordu, artık buraya taşındı. Görev her
// zaman bir müşteriye bağlı olmak zorunda (gorevTanimlaAc bunu kullanıyor):
// - Görevlerim BİR müşterinin Kartı'ndan açıldıysa (musteriKartIdx dolu),
//   direkt o müşteri için görev formu açılır.
// - Görevlerim GENEL listesi olarak (Raporlar'dan) açıldıysa, önce müşteri
//   seçtirilir, seçilince otomatik o müşterinin görev formuna geçilir.
function gorevListesiGorevGirTikla(){
  document.getElementById("gorevListesiModal").style.display = "none";
  if(musteriKartIdx!==null && musteriListesi[musteriKartIdx]){
    gorevTanimlaAc();
    return;
  }
  showToast("📌 Görev eklemek için önce bir müşteri seçin.", 3500);
  musteriSecimHedefSayfa = "gorevGir";
  switchTab(7);
}

function gorevListesiAcKarttan(){
  if(musteriKartIdx===null || !musteriListesi[musteriKartIdx]) return;
  gorevListesiAc(musteriListesi[musteriKartIdx].ad);
}

function gorevListesiAc(filtreMusteriAd){
  gorevAktifMusteriFiltre = filtreMusteriAd || null;
  gorevAktifFiltre = "bekleyen";
  gorevFiltreSec("bekleyen");
  document.getElementById("gorevListesiAltBaslik").textContent = gorevAktifMusteriFiltre ? ("Sadece: "+gorevAktifMusteriFiltre) : "Tüm müşteriler";
  document.getElementById("gorevListesiModal").style.display="flex";
}

function gorevSimdiZamanDamgasi(g){
  var tarih = g.bitisTarihi || g.tarih || "1970-01-01"; // g.tarih: eski kayıtlarla uyumluluk
  return new Date(tarih+"T"+(g.saat||"00:00")).getTime();
}

function gorevListesiRenderEt(){
  var icerik = document.getElementById("gorevListesiIcerik");
  var ozetEl = document.getElementById("gorevListesiOzet");
  var simdi = Date.now();

  // ---- 1) Manuel görevler ----
  var birlesikListe = [];
  gorevListesi.forEach(function(g){
    if(gorevAktifMusteriFiltre && g.musteriAd !== gorevAktifMusteriFiltre) return;
    birlesikListe.push({tur:"gorev", kategori:(g.tamamlandi?"tamamlanan":"bekleyen"), sirala:gorevSimdiZamanDamgasi(g), tarihTs:gorevSimdiZamanDamgasi(g), veri:g});
  });

  // ---- 2) Fiyat teklifi / Numune takibi ----
  ["teklif","numune"].forEach(function(tip){
    haftalikTumKayitlariGetir(tip).forEach(function(k){
      if(gorevAktifMusteriFiltre && k.musteri !== gorevAktifMusteriFiltre) return;
      birlesikListe.push({tur:tip, kategori:haftalikDurumKategorisi(k.durum), sirala:-k.gun, tarihTs:k.ts||0, veri:k});
    });
  });

  // ---- 3) Ziyaret hatırlatmaları ----
  haftalikTumZiyaretleriGetir().forEach(function(z){
    if(gorevAktifMusteriFiltre && z.musteri !== gorevAktifMusteriFiltre) return;
    birlesikListe.push({tur:"ziyaret", kategori:haftalikDurumKategorisi(z.durum), sirala:-z.gun, tarihTs:z.ts||0, veri:z});
  });

  // ---- Tarih aralığı filtresi (kaydın oluşturulma/hedef tarihine göre) ----
  var baslangicEl = document.getElementById("gorevFiltreBaslangicInput");
  var bitisEl = document.getElementById("gorevFiltreBitisInput");
  var baslangicTs = (baslangicEl && baslangicEl.value) ? new Date(baslangicEl.value+"T00:00:00").getTime() : null;
  var bitisTs = (bitisEl && bitisEl.value) ? new Date(bitisEl.value+"T23:59:59").getTime() : null;
  if(baslangicTs || bitisTs){
    birlesikListe = birlesikListe.filter(function(x){
      if(baslangicTs && x.tarihTs < baslangicTs) return false;
      if(bitisTs && x.tarihTs > bitisTs) return false;
      return true;
    });
  }

  // ---- Özet satırı (filtre öncesi, seçili müşteri bazında) ----
  var gorevSayisi = birlesikListe.filter(function(x){ return x.tur==="gorev" && x.kategori==="bekleyen"; }).length;
  var takipSayisi = birlesikListe.filter(function(x){ return x.tur!=="gorev" && x.kategori==="bekleyen"; }).length;
  if(ozetEl) ozetEl.textContent = gorevSayisi+" manuel görev · "+takipSayisi+" açık teklif/ziyaret takibi";

  // ---- Aktif sekmeye göre filtrele ----
  var liste = birlesikListe.filter(function(x){
    if(gorevAktifFiltre==="tumu") return true;
    return x.kategori===gorevAktifFiltre;
  }).sort(function(a,b){ return a.sirala-b.sirala; });

  if(liste.length===0){
    icerik.innerHTML = "<div style='color:#888;font-size:21px;padding:20px 0;text-align:center;'>Bu filtrede kayıt yok.</div>";
    return;
  }

  var html = "";
  liste.forEach(function(item){
    if(item.tur==="gorev"){
      html += gorevKartHTML(item.veri, simdi);
    } else if(item.tur==="ziyaret"){
      html += haftalikKartHTML("ziyaret", "📆 ZİYARET HATIRLATMASI", "#8e44ad", item.veri.musteri, item.veri.sehir?" - "+sehirFormatla(item.veri.sehir):"", "Son ziyaret üzerinden "+item.veri.gun+" gün geçti"+(item.veri.not?" · \""+item.veri.not+"\"":""), item.veri.gun, item.veri.anahtar, null, item.veri.musteriId);
    } else {
      var tipEt = item.tur==="teklif" ? "💬 FİYAT TEKLİFİ" : "📮 NUMUNE";
      var renk = item.tur==="teklif" ? "#28a745" : "#f2994a";
      html += haftalikKartHTML(item.tur, tipEt, renk, item.veri.musteri, "", item.veri.tarih+" · "+item.veri.urunSayisi+" ürün", item.veri.gun, item.veri.anahtar, item.veri.ts, item.veri.musteriId);
    }
  });
  icerik.innerHTML = html;
}

function gorevKartHTML(g, simdi){
  var zamanDamgasi = gorevSimdiZamanDamgasi(g);
  var suresiGecmis = !g.tamamlandi && zamanDamgasi <= simdi;
  var tarihGosterim;
  if(g.baslangicTarihi && g.bitisTarihi && g.baslangicTarihi!==g.bitisTarihi){
    tarihGosterim = g.baslangicTarihi.split("-").reverse().join(".") + " - " + g.bitisTarihi.split("-").reverse().join(".");
  } else {
    var tekTarih = g.bitisTarihi || g.tarih; // g.tarih: eski kayıtlarla uyumluluk
    tarihGosterim = tekTarih ? tekTarih.split("-").reverse().join(".") : "";
  }
  var durumRengi = g.tamamlandi ? "#0e7c63" : (suresiGecmis ? "#e0524a" : "#b7601f");
  var gorevEtiket = "📌 GÖREV";
  var fontBoyu = tekSatirFontHesapla((g.musteriAd+gorevEtiket).length + 6);
  return "<div style='background:"+(g.tamamlandi?"#f7f9fc":(suresiGecmis?"#fdf1e8":"#fff"))+";border:1px solid "+(suresiGecmis&&!g.tamamlandi?"#eab98a":"#d5dce6")+";border-left:5px solid "+durumRengi+";border-radius:8px;padding:14px 16px;margin-bottom:10px;'>"
    +"<div style='display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px;'>"
    +"<div onclick=\"musteriKartAcAdIle('"+g.musteriAd.replace(/'/g,"&#39;")+"')\" style='cursor:pointer;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'>"
      +"<span style='font-size:"+fontBoyu+"px;font-weight:900;color:#003a70;text-decoration:underline;"+(g.tamamlandi?"opacity:.6;":"")+"'>🏢 "+g.musteriAd+"</span>"
      +" <span style='font-size:"+fontBoyu+"px;font-weight:900;color:#b7601f;letter-spacing:.3px;'>— "+gorevEtiket+"</span>"
    +"</div>"
    +"<div style='font-size:32px;font-weight:900;color:"+durumRengi+";white-space:nowrap;flex-shrink:0;'>"+(g.tamamlandi?"✓ TAMAMLANDI":(suresiGecmis?"⏰ ZAMANI GEÇTİ":"⏳ BEKLİYOR"))+"</div>"
    +"</div>"
    +"<div style='font-size:48px;color:#333;margin-bottom:8px;line-height:1.5;'>"+g.aciklama+"</div>"
    +"<div style='font-size:34px;color:#222;font-weight:700;margin-bottom:10px;'>📅 "+tarihGosterim+" · 🕐 "+(g.saat||"")+"</div>"
    +"<div style='display:flex;gap:8px;'>"
    +"<button onclick=\"gorevTamamlandiToggle('"+g.id+"')\" style='flex:1;background:"+(g.tamamlandi?"#eef1f2":"#eafaf3")+";color:"+(g.tamamlandi?"#556":"#0e7c63")+";border:2px solid "+(g.tamamlandi?"#c3c9ce":"#7dcdb3")+";padding:18px;font-size:48px;font-weight:800;border-radius:6px;cursor:pointer;'>"+(g.tamamlandi?"↩ Geri Al":"✓ Tamamlandı")+"</button>"
    +"<button onclick=\"gorevSil('"+g.id+"')\" style='background:#fdeceb;color:#c0392b;border:2px solid #ea9d95;padding:9px 16px;font-size:36px;font-weight:800;border-radius:6px;cursor:pointer;'>🗑</button>"
    +"</div>"
    +"</div>";
}

// Müşteri adı + etiket birleşimini TEK SATIRDA tutmak için, metin uzunluğuna göre
// mümkün olan en büyük (ama taşırmayan) yazı boyutunu hesaplar.
function tekSatirFontHesapla(toplamKarakter){
  var f = Math.floor(6800 / toplamKarakter);
  if(f > 30) f = 30;
  if(f < 14) f = 14;
  return f;
}

function haftalikKartHTML(tur, etiket, renk, musteriAd, musteriEk, altBilgi, gun, anahtar, ts, musteriId){
  var aktifRenk = gun>=21 ? "#e0524a" : renk;
  var fontBoyu = tekSatirFontHesapla((musteriAd+etiket).length + 6);
  // Fiyat Teklifi / Numune kartlarında tıklama, o işlemin kendisini (fatura önizlemesini)
  // açar. Ziyaret hatırlatması gibi bir belgeye bağlı olmayan kartlarda ise müşteri kartı açılır.
  var tiklamaOlayi = (tur==="teklif" || tur==="numune")
    ? "surecAsamaDetayAc('"+tur+"',"+(ts||0)+")"
    : "musteriKartAcAdIle('"+musteriAd.replace(/'/g,"&#39;")+"')";
  return "<div style='background:#fff;border:1px solid #d5dce6;border-left:5px solid "+aktifRenk+";border-radius:8px;padding:14px 16px;margin-bottom:10px;'>"
    +"<div style='display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px;'>"
    +"<div onclick=\""+tiklamaOlayi+"\" style='cursor:pointer;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'>"
      +"<span style='font-size:"+fontBoyu+"px;font-weight:900;color:#003a70;text-decoration:underline;'>🏢 "+musteriAd+"</span>"
      +(musteriId ? "<span style='font-size:19px;font-weight:800;color:#7ea6d6;margin-left:6px;'>🏷 "+musteriId+"</span>" : "")
      +" <span style='font-size:"+fontBoyu+"px;font-weight:900;color:"+aktifRenk+";letter-spacing:.3px;'>— "+etiket+"</span>"
    +"</div>"
    +"<div style='font-size:52px;font-weight:900;color:"+aktifRenk+";white-space:nowrap;flex-shrink:0;'>"+gun+" gün</div>"
    +"</div>"
    +"<div style='font-size:36px;color:#222;font-weight:700;margin-bottom:10px;'>"+altBilgi+"</div>"
    +sonHareketEtiketiHTML(anahtar, musteriAd, etiket, musteriId)
    +"</div>";
}

// Kartın altındaki tek tıklanabilir "SON HAREKET" etiketi — o müşterinin en
// güncel (Temas geçmişi + Arşiv) hareketini özet gösterir, dokununca sonHareketAc
// ile tam kronolojik geçmiş popup'ı açılır.
function sonHareketEtiketiHTML(anahtar, musteriAd, etiket, musteriId){
  var gecmis = sonHareketGecmisiGetir(musteriAd, musteriId||null);
  var ozet = "Henüz hareket kaydı yok";
  if(gecmis.length>0){
    var en = gecmis[0];
    var d = new Date(en.ts);
    var tarihStr = ("0"+d.getDate()).slice(-2)+" "+["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"][d.getMonth()]+" "+("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2);
    ozet = tarihStr+" · "+en.etiket;
  }
  var anahtarEsc = anahtar.replace(/'/g,"&#39;");
  var musteriEsc = musteriAd.replace(/'/g,"&#39;");
  var etiketEsc = (etiket||"").replace(/'/g,"&#39;");
  return "<div onclick=\"sonHareketAc('"+anahtarEsc+"','"+musteriEsc+"','"+etiketEsc+"')\" style='cursor:pointer;background:#eef4fe;color:#2563eb;border-radius:8px;padding:10px;text-align:center;font-size:28px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:6px;'>📅 SON HAREKET: "+ozet+" <span style='margin-left:2px;'>›</span></div>";
}

function gorevTamamlandiToggle(id){
  var g = gorevListesi.find(function(x){ return x.id===id; });
  if(!g) return;
  g.tamamlandi = !g.tamamlandi;
  g.tamamlanmaZamani = g.tamamlandi ? Date.now() : null;
  gorevleriKaydet();
  gorevListesiRenderEt();
  gorevBadgeGuncelle();
  bildirimBannerGuncelle();
}

function gorevSil(id){
  if(!confirm("Bu görevi silmek istediğinize emin misiniz?")) return;
  gorevListesi = gorevListesi.filter(function(x){ return x.id!==id; });
  gorevleriKaydet();
  gorevListesiRenderEt();
  gorevBadgeGuncelle();
  bildirimBannerGuncelle();
}

// Görevlerim rozetini günceller (o müşterinin bekleyen görev sayısı) —
// eskiden ayrı "Görev Gir" kartının rozetiydi de, artık sadece Görevlerim'in.
function gorevBadgeGuncelle(){
  var badge2 = document.getElementById("badgeGorevlerim");
  if(musteriKartIdx===null || !musteriListesi[musteriKartIdx]) return;
  var ad = musteriListesi[musteriKartIdx].ad;
  var sayi = gorevListesi.filter(function(g){ return g.musteriAd===ad && !g.tamamlandi; }).length;
  if(badge2) badge2.textContent = sayi;
}

// Zamanı gelmiş ve henüz tamamlanmamış görevleri döndürür (bildirim rozeti/listesi için)
function gorevBildirimleriHesapla(){
  var simdi = Date.now();
  return gorevListesi.filter(function(g){ return !g.tamamlandi && gorevSimdiZamanDamgasi(g) <= simdi; })
    .sort(function(a,b){ return gorevSimdiZamanDamgasi(a) - gorevSimdiZamanDamgasi(b); });
}

// Süresi geçmiş görevler için: ilk hatırlatmadan itibaren 1 hafta boyunca
// 2 günde bir toast ile tekrar hatırlatır, 1 haftadan sonra sessizce listede kalır.
function gorevHatirlatmaKontrolEt(){
  var gecmisGorevler = gorevBildirimleriHesapla();
  if(gecmisGorevler.length===0) return;
  var simdi = Date.now();
  var IKI_GUN_MS = 2*24*60*60*1000;
  var BIR_HAFTA_MS = 7*24*60*60*1000;
  var sonToastlar = lsGet("weicon_gorev_son_toast", {});
  var hatirlatilacaklar = [];
  gecmisGorevler.forEach(function(g){
    var vade = gorevSimdiZamanDamgasi(g);
    if((simdi - vade) > BIR_HAFTA_MS) return; // 1 haftadan eski, artık sessizce beklesin
    var sonToast = sonToastlar[g.id] || 0;
    if((simdi - sonToast) >= IKI_GUN_MS || sonToast===0){
      hatirlatilacaklar.push(g);
      sonToastlar[g.id] = simdi;
    }
  });
  if(hatirlatilacaklar.length>0){
    lsSet("weicon_gorev_son_toast", sonToastlar);
    setTimeout(function(){
      if(hatirlatilacaklar.length===1){
        showToast("📌 Görev hatırlatması: "+hatirlatilacaklar[0].musteriAd+" — "+hatirlatilacaklar[0].aciklama, 6000);
      } else {
        showToast("📌 "+hatirlatilacaklar.length+" görevin zamanı geçti, tamamlamayı unutma.", 6000);
      }
    }, 2200);
  }
}


function bildirimBannerGuncelle(){
  var banner = document.getElementById("bildirimBanner");
  if(!banner) return;
  var liste = bildirimleriHesapla();
  var ziyaretListe = ziyaretHatirlatmalariHesapla();
  var gorevListe = gorevBildirimleriHesapla();
  var toplamSayi = liste.length + ziyaretListe.length + gorevListe.length;
  if(toplamSayi===0){ banner.style.display="none"; return; }
  var kritikSayisi = liste.filter(function(b){ return b.seviye==="kritik"; }).length;
  document.getElementById("bildirimBannerSayac").textContent = toplamSayi;

  var altYaziParcalari = [];
  if(liste.length>0) altYaziParcalari.push(liste.length+" açık süreç" + (kritikSayisi>0 ? " ("+kritikSayisi+" kritik)" : ""));
  if(gorevListe.length>0) altYaziParcalari.push(gorevListe.length+" görev");
  if(ziyaretListe.length>0) altYaziParcalari.push(ziyaretListe.length+" temas hatırlatması");
  document.getElementById("bildirimBannerAltYazi").textContent = altYaziParcalari.join(" · ");
  banner.style.display="flex";

  // Günde bir kez toast ile de hatırlat
  var bugunStr = new Date().toDateString();
  var sonToastGun = lsGet("weicon_bildirim_son_toast", "");
  if(sonToastGun !== bugunStr){
    lsSet("weicon_bildirim_son_toast", bugunStr);
    setTimeout(function(){ showToast("🔔 "+toplamSayi+" konu takip gerektiriyor.", 5000); }, 1500);
  }
}

function bildirimListesiAc(){
  var liste = bildirimleriHesapla();
  var ziyaretListe = ziyaretHatirlatmalariHesapla();
  var gorevListe = gorevBildirimleriHesapla();
  var icerik = document.getElementById("bildirimListesiIcerik");
  var tipEtiket = {teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA", numune:"NUMUNE"};
  var seviyeEtiket = {ilk:"⏳ 15+ gün", ikinci:"⚠️ 30+ gün", kritik:"🔴 33+ gün — İNCELE"};
  var seviyeRenk = {ilk:"#f2994a", ikinci:"#e0524a", kritik:"#c0392b"};
  var html = "";

  if(liste.length>0){
    html += "<div style='font-size:30px;font-weight:900;color:#003a70;margin-bottom:12px;'>▶️ Açık Süreçler</div>";
    for(var i=0;i<liste.length;i++){
      var b = liste[i];
      html += "<div style='background:#f7f9fc;border:1px solid #d5dce6;border-left:6px solid "+seviyeRenk[b.seviye]+";border-radius:8px;padding:16px 16px;margin-bottom:14px;'>";
      html += "<div style='display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:8px;'>";
      html += "<div style='font-size:26px;font-weight:900;color:#222;'>"+b.musteri+(b.sehir?" - "+sehirFormatla(b.sehir):"")+"</div>";
      html += "<div style='font-size:18px;font-weight:900;color:"+seviyeRenk[b.seviye]+";'>"+seviyeEtiket[b.seviye]+"</div>";
      html += "</div>";
      html += "<div style='font-size:20px;color:#555;line-height:1.35;'>"+tipEtiket[b.tip]+" · "+b.tarih+" · "+b.urunSayisi+" ürün · <b>"+b.gun+" gün önce</b></div>";
      html += "<div style='display:flex;gap:8px;margin-top:12px;'>";
      html += "<button onclick=\"document.getElementById('bildirimListesiModal').style.display='none';bildirimdenIlerlet('"+b.musteri.replace(/'/g,"&#39;")+"');\" style='flex:1;background:#003a70;color:#fff;border:none;padding:18px;font-size:24px;font-weight:800;border-radius:6px;cursor:pointer;'>▶️ İlerlet</button>";
      if(b.seviye==="kritik"){
        html += "<button onclick=\"bildirimdenSil('"+b.tip+"',"+b.ts+",this)\" style='flex:1;background:#e0524a;color:#fff;border:none;padding:18px;font-size:24px;font-weight:800;border-radius:6px;cursor:pointer;'>🗑 Sil</button>";
      }
      html += "</div></div>";
    }
  }

  if(ziyaretListe.length>0){
    html += "<div style='font-size:22px;font-weight:900;color:#003a70;margin:20px 0 12px;'>📆 Ziyaret Hatırlatmaları</div>";
    for(var j=0;j<ziyaretListe.length;j++){
      var z = ziyaretListe[j];
      html += "<div onclick=\"document.getElementById('bildirimListesiModal').style.display='none';musteriKartAcAdIle('"+z.musteri.replace(/'/g,"&#39;")+"');\" style='background:#fdf1e8;border:1px solid #f2d9c2;border-left:6px solid #e0524a;border-radius:8px;padding:16px 16px;margin-bottom:14px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;'>";
      html += "<div style='font-size:26px;font-weight:900;color:#222;'>🏢 "+z.musteri+(z.sehir?" - "+sehirFormatla(z.sehir):"")+"</div>";
      html += "<div style='font-size:18px;font-weight:800;color:#a34a1e;white-space:nowrap;'>"+z.gun+" gündür yok</div>";
      html += "</div>";
    }
  }

  if(gorevListe.length>0){
    html += "<div style='font-size:22px;font-weight:900;color:#003a70;margin:20px 0 12px;'>📌 Görevler</div>";
    for(var k=0;k<gorevListe.length;k++){
      var g = gorevListe[k];
      html += "<div style='background:#fdf1e8;border:1px solid #f2d9c2;border-left:6px solid #b7601f;border-radius:8px;padding:16px 16px;margin-bottom:14px;'>";
      html += "<div style='font-size:26px;font-weight:900;color:#222;margin-bottom:8px;'>🏢 "+g.musteriAd+"</div>";
      html += "<div style='font-size:20px;color:#555;margin-bottom:12px;line-height:1.4;'>"+g.aciklama+"</div>";
      html += "<div style='display:flex;gap:10px;'>";
      html += "<button onclick=\"gorevTamamlandiToggle('"+g.id+"');bildirimListesiAc();\" style='flex:1;background:#eafaf3;color:#0e7c63;border:2px solid #7dcdb3;padding:18px;font-size:24px;font-weight:800;border-radius:6px;cursor:pointer;'>✓ Tamamlandı</button>";
      html += "<button onclick=\"document.getElementById('bildirimListesiModal').style.display='none';musteriKartAcAdIle('"+g.musteriAd.replace(/'/g,"&#39;")+"');\" style='flex:1;background:#eef4fb;color:#003a70;border:2px solid #7ea6d6;padding:18px;font-size:24px;font-weight:800;border-radius:6px;cursor:pointer;'>🔍 Müşteriye Git</button>";
      html += "</div></div>";
    }
  }

  if(liste.length===0 && ziyaretListe.length===0 && gorevListe.length===0){
    html = "<div style='color:#888;font-size:20px;padding:10px 0;'>Takip gerektiren konu yok.</div>";
  }

  icerik.innerHTML = html;
  document.getElementById("bildirimListesiModal").style.display="flex";
}

function bildirimdenIlerlet(musteriAdi){
  var idx = -1;
  for(var i=0;i<musteriListesi.length;i++){ if(musteriListesi[i].ad===musteriAdi){ idx=i; break; } }
  if(idx===-1) return;
  musteriKartIdx = idx;
  acikSureciIlerlet();
}

function bildirimdenSil(tip, ts, btn){
  var arsivData = lsGet("weicon_arsiv",{});
  var liste = arsivData[tip]||[];
  var idx = -1;
  for(var i=0;i<liste.length;i++){ if(liste[i].ts===ts){ idx=i; break; } }
  if(idx===-1){ showToast("Kayıt bulunamadı."); return; }
  var silinen = liste[idx];
  liste.splice(idx,1);
  lsSet("weicon_arsiv", arsivData);
  showToast("Kayıt silindi: "+(silinen.musteri||""));
  document.getElementById("bildirimListesiModal").style.display="none";
  bildirimBannerGuncelle();
}

// ============================================================
// HAFTALIK TAKİP RAPORU — Ziyaret, Fiyat Teklifi ve Numune işlemleri için
// haftada bir (en az Pazartesi) hatırlatma. Kullanıcı bir kayda durum
// (Tamamlandı / İzleniyor / Sona Erdi / Kapat) verene kadar her hafta tekrar listelenir.
// Not: mevcut 15/30/33 günlük bildirim sisteminden (bildirimBanner) tamamen ayrı, yeni ve ek bir özelliktir.
// ============================================================

function isoHaftaAnahtari(d){
  var date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  var gunNo = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - gunNo + 3);
  var ilkPersembe = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  var haftaNo = 1 + Math.round(((date - ilkPersembe) / 86400000 - 3 + ((ilkPersembe.getUTCDay() + 6) % 7)) / 7);
  return date.getUTCFullYear() + "-W" + haftaNo;
}

function haftalikDurumHaritasiGetir(){ return lsGet("weicon_haftalik_durum", {}); }
function haftalikDurumKaydet(anahtar, durum){
  var harita = haftalikDurumHaritasiGetir();
  var mevcut = harita[anahtar] || {};
  harita[anahtar] = {durum:durum, ts:Date.now(), izlemeLog:mevcut.izlemeLog||[]};
  lsSet("weicon_haftalik_durum", harita);
}
// Not: eski tek-timestamp'lık "İzleniyor" sayaç fonksiyonu (haftalikIzlemeEkle) kaldırıldı;
// yerine not girişi de alan gorevTakipNotKaydet() fonksiyonu geldi.

// Açık (siparişe dönmemiş) TEKLİF veya NUMUNE kayıtlarının tamamını döndürür (PROFORMA dahil değil)
function haftalikAcikFaturaListesi(tip){
  var arsiv = lsGet("weicon_arsiv", {});
  var liste = arsiv[tip] || [];
  var siparisListesi = arsiv.siparis || [];
  var durumHaritasi = haftalikDurumHaritasiGetir();
  var sonuc = [];
  for(var i=0;i<liste.length;i++){
    var k = liste[i];
    var anahtar = tip+"_"+(k.ts||0);
    if(durumHaritasi[anahtar]) continue;
    var sonrasindaSiparisVar = siparisListesi.some(function(s){
      return (s.musteri||"").toLocaleLowerCase("tr-TR")===(k.musteri||"").toLocaleLowerCase("tr-TR") && (s.ts||0) > (k.ts||0);
    });
    if(sonrasindaSiparisVar) continue;
    var gunFarki = Math.floor((Date.now() - (k.ts||0)) / 86400000);
    sonuc.push({anahtar:anahtar, musteri:k.musteri||"", tarih:k.tarih||"", ts:k.ts||0, gun:gunFarki, urunSayisi:(k.urunler||[]).length});
  }
  sonuc.sort(function(a,b){ return b.gun-a.gun; });
  return sonuc;
}

// 15+ gündür temas edilmemiş ve henüz durum verilmemiş ziyaret hatırlatmaları
function haftalikAcikZiyaretListesi(){
  var durumHaritasi = haftalikDurumHaritasiGetir();
  var sonuc = [];
  for(var i=0;i<musteriListesi.length;i++){
    var m = musteriListesi[i];
    var liste = m.ziyaretGecmisi || [];
    if(liste.length===0) continue;
    var enSon = liste[0];
    for(var k=1;k<liste.length;k++){ if((liste[k].ts||0) > (enSon.ts||0)) enSon = liste[k]; }
    var enSonTs = enSon.ts || 0;
    var gunFarki = Math.floor((Date.now() - enSonTs) / 86400000);
    if(gunFarki < 15) continue;
    var anahtar = "ziyaret_"+m.ad+"_"+enSonTs;
    if(durumHaritasi[anahtar]) continue;
    sonuc.push({anahtar:anahtar, musteri:m.ad, sehir:m.sehir||"", not:enSon.not||"", ts:enSonTs, gun:gunFarki});
  }
  sonuc.sort(function(a,b){ return b.gun-a.gun; });
  return sonuc;
}

function haftalikTakipToplamSayisi(){
  return haftalikAcikZiyaretListesi().length + haftalikAcikFaturaListesi("teklif").length + haftalikAcikFaturaListesi("numune").length;
}

// Uygulama açıldığında haftada bir kez (ilk açılışta, en az Pazartesi'den itibaren) otomatik kontrol
function haftalikTakipOtomatikKontrol(){
  var buHafta = isoHaftaAnahtari(new Date());
  var sonGosterilen = lsGet("weicon_haftalik_son_gosterim", "");
  if(sonGosterilen === buHafta) return;
  var toplam = haftalikTakipToplamSayisi();
  if(toplam === 0) return;
  lsSet("weicon_haftalik_son_gosterim", buHafta);
  haftalikTakipRaporuAc();
}

function haftalikDurumButonuHTML(anahtar, musteriAd, baslik){
  var harita = haftalikDurumHaritasiGetir();
  var kayit = harita[anahtar] || {};
  var izlemeLog = kayit.izlemeLog || [];
  var musteriAdEsc = (musteriAd||"").replace(/'/g,"&#39;");
  var baslikEsc = (baslik||"").replace(/'/g,"&#39;");
  var html = "<div style='display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:10px;'>";
  html += "<div onclick=\"haftalikKartDurumSec('"+anahtar.replace(/'/g,"&#39;")+"','tamamlandi')\" style='background:#28a745;color:#fff;border-radius:8px;padding:12px 6px;font-size:24px;font-weight:800;text-align:center;cursor:pointer;line-height:1.25;'>✓ Tamamlandı</div>";
  html += "<div onclick=\"gorevTakipAc('"+anahtar.replace(/'/g,"&#39;")+"','"+musteriAdEsc+"','"+baslikEsc+"')\" style='background:#f2994a;color:#fff;border-radius:8px;padding:12px 6px;font-size:24px;font-weight:800;text-align:center;cursor:pointer;line-height:1.25;'>👁 Takip"+(izlemeLog.length>0?" ("+izlemeLog.length+")":"")+"</div>";
  html += "</div>";
  if(izlemeLog.length>0){
    var sirali = izlemeLog.slice().sort(function(a,b){ return (b.ts||b)-(a.ts||a); });
    html += "<div style='margin-top:8px;padding:8px 10px;background:#fdf3e8;border-radius:6px;font-size:26px;color:#8a5a12;line-height:1.6;'><b>Takip geçmişi:</b><br>"
      + sirali.map(function(kayitLog){
          var ts = (typeof kayitLog==="object") ? kayitLog.ts : kayitLog;
          var not = (typeof kayitLog==="object") ? kayitLog.not : "";
          var d = new Date(ts);
          var tarihSaat = ("0"+d.getDate()).slice(-2)+"."+("0"+(d.getMonth()+1)).slice(-2)+"."+d.getFullYear()+" "+("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2);
          return "• "+tarihSaat+(not?" — "+not:"");
        }).join("<br>")
      + "</div>";
  }
  return html;
}

function haftalikKartDurumSec(anahtar, durum){
  haftalikDurumKaydet(anahtar, durum);
  showToast("✓ Tamamlandı olarak işaretlendi.");
  gorevListesiRenderEt();
  gorevBadgeGuncelle();
  bildirimBannerGuncelle();
}

// ---- GÖREV TAKİP NOTU (👁 Takip butonu) ----
// Basınca not girme ekranı açılır; kaydedilince hem o görevin kendi takip
// sayacına/geçmişine (izlemeLog) işlenir, hem de ilgili müşterinin kartındaki
// Temas geçmişine gerçek bir temas kaydı olarak düşer. Önceki notlar aynı
// ekranda listelenir; her biri düzenlenebilir veya silinebilir.
var gorevTakipAnahtar = null, gorevTakipMusteriAdi = null, gorevTakipBaslikMetni = null, gorevTakipDuzenlenenTs = null;

function gorevTakipEsc(v){ return (v===undefined||v===null) ? "" : String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

function gorevTakipAc(anahtar, musteriAdi, baslik){
  gorevTakipAnahtar = anahtar;
  gorevTakipMusteriAdi = musteriAdi;
  gorevTakipBaslikMetni = baslik;
  gorevTakipDuzenlenenTs = null;
  var simdi = new Date();
  var tarihSaatEl = document.getElementById("gorevTakipNotTarih");
  if(tarihSaatEl) tarihSaatEl.textContent = ("0"+simdi.getDate()).slice(-2)+"."+("0"+(simdi.getMonth()+1)).slice(-2)+"."+simdi.getFullYear()+" "+("0"+simdi.getHours()).slice(-2)+":"+("0"+simdi.getMinutes()).slice(-2);
  var inputEl = document.getElementById("gorevTakipNotInput");
  if(inputEl) inputEl.value = "";
  var etiketEl = document.getElementById("gorevTakipMusteriEtiket");
  if(etiketEl) etiketEl.textContent = "🏢 "+(musteriAdi||"")+(baslik?" — "+baslik:"");
  var kaydetBtn = document.getElementById("gorevTakipKaydetBtn");
  if(kaydetBtn) kaydetBtn.textContent = "✓ Kaydet";
  var iptalWrap = document.getElementById("gorevTakipDuzenlemeIptalWrap");
  if(iptalWrap) iptalWrap.style.display = "none";
  gorevTakipListesiRenderEt();
  document.getElementById("gorevTakipModal").style.display = "flex";
}

function gorevTakipKapat(){
  document.getElementById("gorevTakipModal").style.display = "none";
  gorevTakipDuzenlenenTs = null;
}

// Modal içindeki "Önceki Takip Notları" listesini (düzenle/sil butonlarıyla) çizer.
function gorevTakipListesiRenderEt(){
  var el = document.getElementById("gorevTakipGecmisListesi");
  if(!el || !gorevTakipAnahtar) return;
  var harita = haftalikDurumHaritasiGetir();
  var kayit = harita[gorevTakipAnahtar] || {};
  var log = (kayit.izlemeLog || []).slice().sort(function(a,b){
    var tsA = (typeof a==="object") ? a.ts : a;
    var tsB = (typeof b==="object") ? b.ts : b;
    return tsB - tsA;
  });
  if(log.length===0){
    el.innerHTML = "<div style='color:#888;font-size:32px;padding:8px 0;'>Henüz takip notu yok.</div>";
    return;
  }
  var html = "";
  log.forEach(function(item){
    var ts = (typeof item==="object") ? item.ts : item;
    var not = (typeof item==="object") ? (item.not||"") : "";
    var d = new Date(ts);
    var tarihSaat = ("0"+d.getDate()).slice(-2)+"."+("0"+(d.getMonth()+1)).slice(-2)+"."+d.getFullYear()+" "+("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2);
    var duzenleniyorMu = gorevTakipDuzenlenenTs===ts;
    html += "<div style='background:"+(duzenleniyorMu?"#fff8ee":"#f7f9fc")+";border:1px solid "+(duzenleniyorMu?"#f2994a":"#d5dce6")+";border-radius:8px;padding:10px 12px;margin-bottom:8px;'>"
      + "<div style='font-size:28px;font-weight:800;color:#8a5a12;margin-bottom:4px;'>🕐 "+tarihSaat+(duzenleniyorMu?" — <span style='color:#f2994a;'>düzenleniyor</span>":"")+"</div>"
      + "<div style='font-size:32px;color:#333;margin-bottom:8px;word-break:break-word;'>"+(not?gorevTakipEsc(not):"<i style='color:#aaa;'>Not girilmedi</i>")+"</div>"
      + "<div style='display:flex;gap:8px;'>"
      + "<button onclick='gorevTakipNotuDuzenle("+ts+")' style='flex:1;background:#eef4fb;color:#003a70;border:1px solid #7ea6d6;padding:18px;border-radius:6px;font-size:48px;font-weight:800;cursor:pointer;'>✏️ Düzenle</button>"
      + "<button onclick='gorevTakipNotuSil("+ts+")' style='flex:1;background:#fdeceb;color:#c0392b;border:1px solid #e0524a;padding:18px;border-radius:6px;font-size:48px;font-weight:800;cursor:pointer;'>🗑 Sil</button>"
      + "</div></div>";
  });
  el.innerHTML = html;
}

// Geçmiş listesinden bir notu düzenleme moduna alır: metni forma doldurur,
// "Kaydet" düğmesi artık yeni kayıt eklemek yerine bu notu günceller.
function gorevTakipNotuDuzenle(ts){
  var harita = haftalikDurumHaritasiGetir();
  var kayit = harita[gorevTakipAnahtar] || {};
  var log = kayit.izlemeLog || [];
  var entry = log.find(function(e){ return (typeof e==="object"?e.ts:e) === ts; });
  if(!entry) return;
  gorevTakipDuzenlenenTs = ts;
  var inputEl = document.getElementById("gorevTakipNotInput");
  if(inputEl){ inputEl.value = (typeof entry==="object") ? (entry.not||"") : ""; inputEl.focus(); }
  var kaydetBtn = document.getElementById("gorevTakipKaydetBtn");
  if(kaydetBtn) kaydetBtn.textContent = "✓ Notu Güncelle";
  var iptalWrap = document.getElementById("gorevTakipDuzenlemeIptalWrap");
  if(iptalWrap) iptalWrap.style.display = "block";
  gorevTakipListesiRenderEt();
}

function gorevTakipDuzenlemeIptal(){
  gorevTakipDuzenlenenTs = null;
  var inputEl = document.getElementById("gorevTakipNotInput");
  if(inputEl) inputEl.value = "";
  var kaydetBtn = document.getElementById("gorevTakipKaydetBtn");
  if(kaydetBtn) kaydetBtn.textContent = "✓ Kaydet";
  var iptalWrap = document.getElementById("gorevTakipDuzenlemeIptalWrap");
  if(iptalWrap) iptalWrap.style.display = "none";
  gorevTakipListesiRenderEt();
}

// Geçmişteki bir takip notunu tamamen kaldırır: hem görevin kendi
// takip sayacından/geçmişinden, hem de müşteri kartındaki Temas kaydından.
function gorevTakipNotuSil(ts){
  if(!confirm("Bu takip notunu silmek istediğinize emin misiniz?")) return;
  var harita = haftalikDurumHaritasiGetir();
  var kayit = harita[gorevTakipAnahtar];
  if(kayit){
    var log = kayit.izlemeLog || [];
    var idx = log.findIndex(function(e){ return (typeof e==="object"?e.ts:e) === ts; });
    if(idx>-1){
      log.splice(idx,1);
      harita[gorevTakipAnahtar] = {durum:kayit.durum, ts:kayit.ts, izlemeLog:log};
      lsSet("weicon_haftalik_durum", harita);
    }
  }
  if(gorevTakipDuzenlenenTs===ts) gorevTakipDuzenlemeIptal();
  if(gorevTakipMusteriAdi) gorevTakipMusteriTemasSil(gorevTakipMusteriAdi, ts);
  showToast("🗑 Takip notu silindi.");
  gorevTakipListesiRenderEt();
  gorevListesiRenderEt();
  gorevBadgeGuncelle();
  bildirimBannerGuncelle();
}

function gorevTakipNotKaydet(){
  var anahtar = gorevTakipAnahtar, musteriAdi = gorevTakipMusteriAdi, baslik = gorevTakipBaslikMetni;
  if(!anahtar){ gorevTakipKapat(); return; }
  var notEl = document.getElementById("gorevTakipNotInput");
  var not = notEl ? notEl.value.trim() : "";

  if(gorevTakipDuzenlenenTs){
    // DÜZENLEME MODU: yeni kayıt eklemek yerine mevcut notu günceller.
    var duzenlenenTs = gorevTakipDuzenlenenTs;
    var harita = haftalikDurumHaritasiGetir();
    var kayit = harita[anahtar];
    if(kayit){
      var log = kayit.izlemeLog || [];
      var idx = log.findIndex(function(e){ return (typeof e==="object"?e.ts:e) === duzenlenenTs; });
      if(idx>-1){
        log[idx] = {ts:duzenlenenTs, not:not};
        harita[anahtar] = {durum:kayit.durum, ts:kayit.ts, izlemeLog:log};
        lsSet("weicon_haftalik_durum", harita);
      }
    }
    if(musteriAdi) gorevTakipMusteriTemasGuncelle(musteriAdi, duzenlenenTs, not, baslik);
    showToast("✓ Takip notu güncellendi.");
    gorevTakipDuzenlemeIptal();
  } else {
    // YENİ NOT MODU
    var ts = Date.now();
    var harita2 = haftalikDurumHaritasiGetir();
    var mevcut = harita2[anahtar] || {izlemeLog:[]};
    var log2 = mevcut.izlemeLog || [];
    log2.push({ts:ts, not:not});
    harita2[anahtar] = {durum:"izleniyor", ts:ts, izlemeLog:log2};
    lsSet("weicon_haftalik_durum", harita2);
    if(musteriAdi) gorevTakipMusteriTemasEkle(musteriAdi, ts, not, baslik);
    showToast("✓ Takip notu kaydedildi ve müşteri kartına eklendi.");
    if(notEl) notEl.value = "";
    gorevTakipListesiRenderEt();
  }

  gorevListesiRenderEt();
  gorevBadgeGuncelle();
  bildirimBannerGuncelle();
}

function gorevTakipMusteriTemasEkle(musteriAdi, ts, not, baslik){
  var tamNot = (baslik ? "["+baslik+" takibi] " : "[Takip] ") + (not || "Takip edildi, not girilmedi.");

  function guncellemeyiUygula(guncelListe){
    var hedefIdx = guncelListe.findIndex(function(m){ return (m.ad||"").toLocaleLowerCase("tr-TR")===(musteriAdi||"").toLocaleLowerCase("tr-TR"); });
    if(hedefIdx===-1) return; // müşteri bulunamadıysa sessizce geç
    if(!guncelListe[hedefIdx].ziyaretGecmisi) guncelListe[hedefIdx].ziyaretGecmisi = [];
    var liste = guncelListe[hedefIdx].ziyaretGecmisi;
    liste.push({ts:ts, not:tamNot, tur:"takip", fotolar:[], kisi:null, kod:benzersizKodUret("takip")});
    liste.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
    guncelListe[hedefIdx].sonZiyaret = liste[0].ts;
    guncelListe[hedefIdx].sonZiyaretNot = liste[0].not;
    musteriListesi = guncelListe;
    lsSet("weicon_musteriler", musteriListesi);
    if(window.fbSet){
      musteriListesiGuvenliKaydet(musteriListesi[hedefIdx]).catch(function(e){
        showToast("⚠️ Firebase HATASI: "+((e&&(e.code||e.message))||"bilinmiyor"), 6000);
      });
    }
    if(typeof musteriListesiniRenderEt==="function") musteriListesiniRenderEt();
    if(typeof musteriGecmisRenderEt==="function" && musteriKartIdx===hedefIdx) musteriGecmisRenderEt();
  }

  if(window.fbGet){
    window.fbGet("musteriler").then(function(data){
      var guncelListe = data ? (Array.isArray(data)?data:Object.values(data)) : [];
      guncellemeyiUygula(guncelListe);
    }).catch(function(){ guncellemeyiUygula(lsGet("weicon_musteriler",[])); });
  } else {
    guncellemeyiUygula(lsGet("weicon_musteriler",[]));
  }
}

// Var olan bir takip temas kaydının notunu günceller (ts + tur:"takip" ile eşleştirilir).
// Kayıt bulunamazsa (örn. daha önce elle silinmişse) yeni bir kayıt olarak ekler.
function gorevTakipMusteriTemasGuncelle(musteriAdi, ts, not, baslik){
  var tamNot = (baslik ? "["+baslik+" takibi] " : "[Takip] ") + (not || "Takip edildi, not girilmedi.");

  function guncellemeyiUygula(guncelListe){
    var hedefIdx = guncelListe.findIndex(function(m){ return (m.ad||"").toLocaleLowerCase("tr-TR")===(musteriAdi||"").toLocaleLowerCase("tr-TR"); });
    if(hedefIdx===-1) return;
    if(!guncelListe[hedefIdx].ziyaretGecmisi) guncelListe[hedefIdx].ziyaretGecmisi = [];
    var liste = guncelListe[hedefIdx].ziyaretGecmisi;
    var idx = liste.findIndex(function(z){ return z.ts===ts && z.tur==="takip"; });
    if(idx>-1){ liste[idx].not = tamNot; }
    else { liste.push({ts:ts, not:tamNot, tur:"takip", fotolar:[], kisi:null, kod:benzersizKodUret("takip")}); }
    liste.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
    guncelListe[hedefIdx].ziyaretGecmisi = liste;
    guncelListe[hedefIdx].sonZiyaret = liste[0].ts;
    guncelListe[hedefIdx].sonZiyaretNot = liste[0].not;
    musteriListesi = guncelListe;
    lsSet("weicon_musteriler", musteriListesi);
    if(window.fbSet){
      musteriListesiGuvenliKaydet(musteriListesi[hedefIdx]).catch(function(e){
        showToast("⚠️ Firebase HATASI: "+((e&&(e.code||e.message))||"bilinmiyor"), 6000);
      });
    }
    if(typeof musteriGecmisRenderEt==="function" && musteriKartIdx===hedefIdx) musteriGecmisRenderEt();
  }

  if(window.fbGet){
    window.fbGet("musteriler").then(function(data){
      var guncelListe = data ? (Array.isArray(data)?data:Object.values(data)) : [];
      guncellemeyiUygula(guncelListe);
    }).catch(function(){ guncellemeyiUygula(lsGet("weicon_musteriler",[])); });
  } else {
    guncellemeyiUygula(lsGet("weicon_musteriler",[]));
  }
}

// Bir takip temas kaydını müşteri kartından tamamen kaldırır (ts + tur:"takip" ile eşleştirilir).
function gorevTakipMusteriTemasSil(musteriAdi, ts){
  function guncellemeyiUygula(guncelListe){
    var hedefIdx = guncelListe.findIndex(function(m){ return (m.ad||"").toLocaleLowerCase("tr-TR")===(musteriAdi||"").toLocaleLowerCase("tr-TR"); });
    if(hedefIdx===-1) return;
    var liste = guncelListe[hedefIdx].ziyaretGecmisi || [];
    var idx = liste.findIndex(function(z){ return z.ts===ts && z.tur==="takip"; });
    if(idx===-1) return;
    liste.splice(idx,1);
    guncelListe[hedefIdx].ziyaretGecmisi = liste;
    if(liste.length>0){
      var sirali = liste.slice().sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
      guncelListe[hedefIdx].sonZiyaret = sirali[0].ts;
      guncelListe[hedefIdx].sonZiyaretNot = sirali[0].not;
    } else {
      guncelListe[hedefIdx].sonZiyaret = null;
      guncelListe[hedefIdx].sonZiyaretNot = null;
    }
    musteriListesi = guncelListe;
    lsSet("weicon_musteriler", musteriListesi);
    if(window.fbSet){
      musteriListesiGuvenliKaydet(musteriListesi[hedefIdx]).catch(function(e){
        showToast("⚠️ Firebase HATASI: "+((e&&(e.code||e.message))||"bilinmiyor"), 6000);
      });
    }
    if(typeof musteriListesiniRenderEt==="function") musteriListesiniRenderEt();
    if(typeof musteriGecmisRenderEt==="function" && musteriKartIdx===hedefIdx) musteriGecmisRenderEt();
  }

  if(window.fbGet){
    window.fbGet("musteriler").then(function(data){
      var guncelListe = data ? (Array.isArray(data)?data:Object.values(data)) : [];
      guncellemeyiUygula(guncelListe);
    }).catch(function(){ guncellemeyiUygula(lsGet("weicon_musteriler",[])); });
  } else {
    guncellemeyiUygula(lsGet("weicon_musteriler",[]));
  }
}

// Artık ayrı bir popup değil — birleşik "Görevlerim" ekranını açar (Haftalık Takip Raporu bu ekrana taşındı)
function haftalikTakipRaporuAc(){
  gorevListesiAc();
}


// Bu müşterinin en son NUMUNE/TEKLİF/PROFORMA'sından sonra SİPARİŞ verilmemişse tam kaydı döndürür, yoksa null
function musteriAcikSurecKaydiGetir(musteriAdi){
  var arsiv = lsGet("weicon_arsiv",{});
  var bekleyenTipler = ["teklif","proforma","numune"];
  var enSonBekleyen = null;
  for(var t=0;t<bekleyenTipler.length;t++){
    var liste = arsiv[bekleyenTipler[t]]||[];
    for(var i=0;i<liste.length;i++){
      if((liste[i].musteri||"").toLocaleLowerCase("tr-TR") !== (musteriAdi||"").toLocaleLowerCase("tr-TR")) continue;
      if(!enSonBekleyen || (liste[i].ts||0) > enSonBekleyen.ts){
        enSonBekleyen = {ts:liste[i].ts||0, tarih:liste[i].tarih||"", tip:bekleyenTipler[t], kayit:liste[i]};
      }
    }
  }
  if(!enSonBekleyen) return null;
  var siparisListesi = arsiv.siparis||[];
  var sonrasindaSiparisVar = siparisListesi.some(function(s){
    return (s.musteri||"").toLocaleLowerCase("tr-TR")===(musteriAdi||"").toLocaleLowerCase("tr-TR") && (s.ts||0) > enSonBekleyen.ts;
  });
  if(sonrasindaSiparisVar) return null;
  return enSonBekleyen;
}

function musteriAcikSurecMesajGetir(musteriAdi){
  var enSonBekleyen = musteriAcikSurecKaydiGetir(musteriAdi);
  if(!enSonBekleyen) return null;
  var tipEtiket = {teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA", numune:"NUMUNE"};
  return "⏳ Bu müşteriye "+enSonBekleyen.tarih+" tarihinde bir "+tipEtiket[enSonBekleyen.tip]+" gönderilmişti, henüz siparişe dönmemiş.";
}

function musteriAcikSurecUyariGoster(musteriAdi){
  var uyariDiv = document.getElementById("musteriKartAcikSurecUyari");
  if(!uyariDiv) return;
  var enSonBekleyen = musteriAcikSurecKaydiGetir(musteriAdi);
  if(!enSonBekleyen){ uyariDiv.style.display="none"; return; }
  var tipEtiket = {teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA", numune:"NUMUNE"};
  uyariDiv.innerHTML = "<span style='font-size:28px;'>⏳</span> <span style='color:#222;'>Açık süreç bulundu</span>"
    +"<span onclick=\"acikSurecKayitOnizlemeAc()\" style='display:block;color:#ff2d2d;margin:8px 0 4px;text-decoration:underline;cursor:pointer;'>"+enSonBekleyen.tarih+" · "+tipEtiket[enSonBekleyen.tip]+"</span>"
    +"<div style='color:#222;line-height:1.4;'>Henüz siparişe dönmemiş. Aynı süreçten mi devam edeceksiniz?</div>";
  uyariDiv.style.display="block";
}

// Açık süreci bir sonraki aşamaya taşır: NUMUNE→TEKLİF, TEKLİF→PROFORMA, PROFORMA→SİPARİŞ
var ilerletilecekKayit = null; // "İlerlet" popup'ı açıkken hangi kayıttan ilerletildiği burada tutulur

function acikSureciIlerlet(){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  var acikKayit = musteriAcikSurecKaydiGetir(m.ad);
  if(!acikKayit){ showToast("Açık süreç bulunamadı."); return; }
  ilerletilecekKayit = acikKayit;
  var tipEtiket = {numune:"NUMUNE", teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA"};
  document.getElementById("ilerletAsamaOzet").textContent = m.ad+" — şu an: "+tipEtiket[acikKayit.tip]+" ("+acikKayit.tarih+")";
  document.getElementById("musteriKartModal").style.display="none";
  document.getElementById("ilerletAsamaSecModal").style.display="flex";
}

function ilerletAsamaSecildi(mod){
  if(!ilerletilecekKayit || musteriKartIdx===null){ ilerletAsamaSecModalKapat(); return; }
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;

  // Müşteriyi aktif seç
  seciliMusteri = m;
  seciliMusteri.sonGoruntuleme = Date.now();
  musteriListesiniKaydet();
  lsSet("weicon_secili_musteri", seciliMusteri);
  musteriSeritiGuncelle();

  // Sepeti/hareketi temizleyip önceki belgenin ürünlerini "hesaplanmış" olarak yükle
  basket = [];
  hareketListesi = JSON.parse(JSON.stringify(ilerletilecekKayit.kayit.urunler||[]));
  updateBasketCount();

  secilenMod = mod;
  if(typeof islemTuruRenkGuncelle==="function") islemTuruRenkGuncelle();

  ilerletilenSurecKaynagi = {tip:ilerletilecekKayit.tip, ts:ilerletilecekKayit.ts};

  document.getElementById("ilerletAsamaSecModal").style.display="none";
  switchTab(5);
  var tipEtiket = {numune:"NUMUNE", teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA", siparis:"SİPARİŞ"};
  showToast("✓ "+hareketListesi.length+" ürün "+tipEtiket[mod]+" için hazırlandı. Kontrol edip gönderebilirsiniz.", 5000);
  ilerletilecekKayit = null;
}

function ilerletAsamaSecModalKapat(){
  document.getElementById("ilerletAsamaSecModal").style.display="none";
  ilerletilecekKayit = null;
}



// Bir popup açıkken, o popup'a başka bir popup'tan (ör. Müşteri Kartı'ndan
// "İşlemler'e Git" ile) geçilmişse, "Kapat" tuşuna basınca en başa değil bir
// önceki popup'a dönülsün diye kullanılan tekil hafıza. Her açılışta bir
// sonraki popup için ayarlanır, kullanılınca (Kapat'ta) sıfırlanır — yani
// sadece TEK bir adım geri gider, çok seviyeli bir yığın değildir.
var oncekiPopupId = null;

function musteriKartKapat(){
  document.getElementById("musteriKartModal").style.display="none";
  if(oncekiPopupId){
    var geriDonulecek = oncekiPopupId;
    oncekiPopupId = null;
    var el = document.getElementById(geriDonulecek);
    if(el) el.style.display="flex";
  }
}

// Müşteri Kartı popup'ından "⚡ İşlemler'e Git" ile İşlemler menüsüne
// geçerken, dönüş adresini (oncekiPopupId) işaretler.
function musteriKartModalaGitCariKarttan(){
  oncekiPopupId = "musteriCariKartModal";
  document.getElementById("musteriCariKartModal").style.display="none";
  document.getElementById("musteriKartModal").style.display="flex";
}

// Müşteri Kartı popup'ının kendi Kapat'ı — eğer seçim ekranından buraya
// gelinmişse (oncekiPopupId), bir önceki adıma (seçim ekranına) döner;
// değilse (doğrudan açılmışsa) normal şekilde kapatır.
function musteriCariKartKapat(){
  document.getElementById("musteriCariKartModal").style.display="none";
  if(oncekiPopupId){
    var geriDonulecek = oncekiPopupId;
    oncekiPopupId = null;
    var el = document.getElementById(geriDonulecek);
    if(el) el.style.display="flex";
  }
}

var ziyaretDuzenlenenTs = null; // null = yeni ziyaret ekleniyor; dolu ise mevcut kaydı düzenliyoruz
var ziyaretEklenecekTs = null;  // takvimden "+ Ziyaret Ekle" ile gelen hedef tarih

var TEMAS_TURLERI = {
  ziyaret: {ad:"Ziyaret", ikon:"🏠", renk:"#16a085"},
  telefon: {ad:"Telefon", ikon:"📞", renk:"#003a70"},
  mail:    {ad:"Mail",    ikon:"✉️", renk:"#f2994a"},
  mesaj:   {ad:"Mesaj",   ikon:"💬", renk:"#8e44ad"},
  takip:   {ad:"Takip",   ikon:"👁", renk:"#f2994a"}
};
var ziyaretSeciliTur = "ziyaret";
var ziyaretSeciliFotolar = [];
var ziyaretSeciliKisi = null; // Temas kaydı için seçilen iletişim kişisi {isim,bolum,gorev}

function resimSikistir(file, callback){
  var reader = new FileReader();
  reader.onload = function(e){
    var img = new Image();
    img.onload = function(){
      var maxW = 1000;
      var scale = Math.min(1, maxW/img.width);
      var canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width*scale);
      canvas.height = Math.round(img.height*scale);
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function ziyaretFotoSecildi(inputEl){
  var files = inputEl.files;
  if(!files || files.length===0) return;
  for(var i=0;i<files.length;i++){
    (function(file){
      resimSikistir(file, function(dataUrl){
        var geciciIdx = ziyaretSeciliFotolar.length;
        ziyaretSeciliFotolar.push({durum:"yukleniyor", onizleme:dataUrl});
        ziyaretFotoGaleriOlustur();
        if(window.fbUploadFoto){
          window.fbUploadFoto(dataUrl).then(function(url){
            ziyaretSeciliFotolar[geciciIdx] = {durum:"hazir", url:url, onizleme:dataUrl};
            ziyaretFotoGaleriOlustur();
          }).catch(function(e){
            console.error("Foto yükleme hatası", e);
            ziyaretSeciliFotolar[geciciIdx] = {durum:"hata", onizleme:dataUrl};
            ziyaretFotoGaleriOlustur();
            showToast("⚠️ Fotoğraf yüklenemedi, internet bağlantınızı kontrol edip tekrar deneyin.", 5000);
          });
        } else {
          ziyaretSeciliFotolar[geciciIdx] = {durum:"hazir", url:dataUrl, onizleme:dataUrl};
          ziyaretFotoGaleriOlustur();
        }
      });
    })(files[i]);
  }
  inputEl.value = "";
}

function ziyaretFotoSil(idx){
  var f = ziyaretSeciliFotolar[idx];
  ziyaretSeciliFotolar.splice(idx,1);
  ziyaretFotoGaleriOlustur();
  if(f && f.durum==="hazir" && f.url && storage && f.url.indexOf("firebasestorage")>=0){
    try{ storage.refFromURL(f.url).delete().catch(function(e){ console.error("Firebase yazma hatası:", e); }); }catch(e){}
  }
}

function ziyaretFotoGaleriOlustur(){
  var el = document.getElementById("ziyaretFotoGalerisi");
  if(!el) return;
  if(ziyaretSeciliFotolar.length===0){ el.innerHTML=""; return; }
  var html = "";
  ziyaretSeciliFotolar.forEach(function(f, idx){
    var gosterilecekSrc = f.url || f.onizleme;
    var overlay = "";
    if(f.durum==="yukleniyor") overlay = "<div style='position:absolute;inset:0;background:rgba(0,0,0,.45);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800;text-align:center;'>Yükleniyor...</div>";
    if(f.durum==="hata") overlay = "<div style='position:absolute;inset:0;background:rgba(224,82,74,.55);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800;text-align:center;'>Hata!</div>";
    html += "<div style='position:relative;'>"
      +"<img src='"+gosterilecekSrc+"' onclick=\"ziyaretFotoBuyukGoster("+idx+")\" style='width:90px;height:90px;object-fit:cover;border-radius:8px;border:1px solid #ccc;cursor:pointer;display:block;'>"
      +overlay
      +"<button type='button' onclick='event.stopPropagation();ziyaretFotoSil("+idx+")' style='position:absolute;top:-8px;right:-8px;background:#e0524a;color:#fff;border:2px solid #fff;border-radius:50%;width:26px;height:26px;font-size:16px;font-weight:bold;cursor:pointer;line-height:1;'>×</button>"
      +"</div>";
  });
  el.innerHTML = html;
}

function ziyaretFotoBuyukGoster(idx){
  var f = ziyaretSeciliFotolar[idx];
  if(!f) return;
  document.getElementById("fotoBuyukGosterImg").src = f.url || f.onizleme;
  document.getElementById("fotoBuyukGosterModal").style.display="flex";
}

function yetkiliKisiEtiketGuncelle(){
  var altEl = document.getElementById("islemAltYetkili");
  if(!altEl) return;
  var m = musteriListesi[musteriKartIdx];
  var kisiSayisi = m ? ((m.iletisimler||[]).length) : 0;
  if(seciliYetkililer.length){
    var isimler = seciliYetkililer.map(function(k){return safeText(k.isim);}).join(", ");
    altEl.innerHTML = "Seçili: <b>"+isimler+"</b> <span style='color:#e0524a;font-weight:900;' onclick=\"event.stopPropagation();yetkiliKisiTemizle();\">✕</span>";
  } else {
    altEl.textContent = kisiSayisi+" kişi kayıtlı";
  }
}

function yetkiliKisiTemizle(){
  seciliYetkililer = [];
  localStorage.removeItem("weicon_secili_yetkililer");
  localStorage.removeItem("weicon_secili_yetkili");
  yetkiliKisiEtiketGuncelle();
  if(typeof musteriSeritiGuncelle==="function") musteriSeritiGuncelle();
}

function ziyaretKisiEtiketGuncelle(){
  var btn = document.getElementById("ziyaretKisiSecBtn");
  if(!btn) return;
  if(ziyaretSeciliKisi && ziyaretSeciliKisi.isim){
    var altBilgi = [ziyaretSeciliKisi.bolum, ziyaretSeciliKisi.gorev].filter(Boolean).join(" · ");
    btn.innerHTML = "👤 <b>"+ziyaretSeciliKisi.isim+"</b>"+(altBilgi ? " <span style='font-weight:400;color:#667;font-size:0.8em;'>("+altBilgi+")</span>" : "")+" <span style='float:right;color:#e0524a;font-weight:900;' onclick='event.stopPropagation();ziyaretKisiTemizle();'>✕</span>";
  } else {
    btn.innerHTML = "👤 Kişi Seç";
  }
}

function ziyaretKisiTemizle(){
  ziyaretSeciliKisi = null;
  ziyaretKisiEtiketGuncelle();
}

function ziyaretTurSeciciOlustur(){
  var el = document.getElementById("ziyaretTurSecici");
  if(!el) return;
  var html = "";
  Object.keys(TEMAS_TURLERI).forEach(function(key){
    var t = TEMAS_TURLERI[key];
    var secili = (key===ziyaretSeciliTur);
    html += "<button type='button' onclick=\"ziyaretTurSec('"+key+"')\" style='cursor:pointer;border-radius:8px;padding:18px 6px;font-size:24px;font-weight:800;text-align:center;border:2px solid "+t.renk+";background:"+(secili?t.renk:"#fff")+";color:"+(secili?"#fff":t.renk)+";'>"
      +"<div style='font-size:26px;'>"+t.ikon+"</div>"+t.ad
      +"</button>";
  });
  el.innerHTML = html;
}

function ziyaretTurSec(tur){
  ziyaretSeciliTur = tur;
  ziyaretTurSeciciOlustur();
  var mesajAlani = document.getElementById("ziyaretMesajAlani");
  if(mesajAlani) mesajAlani.style.display = (tur==="mail"||tur==="mesaj") ? "block" : "none";
}

// Mail/Mesaj (WhatsApp) temaslarında: yazılan metni ilgili uygulamada açar,
// ardından temas kaydını otomatik olarak (tarih/saatiyle) kaydeder.
function ziyaretMesajGonder(){
  var metin = document.getElementById("ziyaretMesajIcerigi").value.trim();
  if(!metin){ showToast("Önce göndereceğiniz metni yazın."); return; }
  var kisi = ziyaretSeciliKisi;
  if(ziyaretSeciliTur==="mail"){
    var eposta = (kisi && kisi.eposta) ? kisi.eposta.trim() : "";
    var mailUrl = "mailto:"+encodeURIComponent(eposta)+"?subject="+encodeURIComponent("WEICON")+"&body="+encodeURIComponent(metin);
    window.open(mailUrl, "_blank");
  } else if(ziyaretSeciliTur==="mesaj"){
    var telefon = (kisi && kisi.telefon) ? kisi.telefon.replace(/[^0-9]/g,"") : "";
    var waUrl = telefon ? ("https://wa.me/"+telefon+"?text="+encodeURIComponent(metin)) : ("https://api.whatsapp.com/send?text="+encodeURIComponent(metin));
    window.open(waUrl, "_blank");
  }
  // Not alanı boşsa, gönderilen metni otomatik olarak nota da yazalım (kayıt için)
  var notEl = document.getElementById("ziyaretNotu");
  if(notEl && !notEl.value.trim()) notEl.value = metin;
  // Tarih/saati "şimdi" olarak güncelle, sonra otomatik kaydet
  var now = new Date();
  var pad=function(n){ return n.toString().padStart(2,"0"); };
  document.getElementById("ziyaretTarihSaat").value = now.getFullYear()+"-"+pad(now.getMonth()+1)+"-"+pad(now.getDate())+"T"+pad(now.getHours())+":"+pad(now.getMinutes());
  musteriZiyaretKaydet();
}

function musteriKartZiyaretAc(){
  if(musteriKartIdx===null) return;
  ziyaretDuzenlenenTs = null;
  ziyaretSeciliTur = "ziyaret";
  ziyaretSeciliFotolar = [];
  ziyaretSeciliKisi = null;
  ziyaretTurSeciciOlustur();
  ziyaretFotoGaleriOlustur();
  ziyaretKisiEtiketGuncelle();
  var now = new Date();
  var pad=function(n){ return n.toString().padStart(2,"0"); };
  var localVal = now.getFullYear()+"-"+pad(now.getMonth()+1)+"-"+pad(now.getDate())+"T"+pad(now.getHours())+":"+pad(now.getMinutes());
  document.getElementById("ziyaretTarihSaat").value = localVal;
  document.getElementById("ziyaretNotu").value = "";
  document.getElementById("ziyaretModalBaslik").textContent = "📍 Temas Kaydı";
  document.getElementById("musteriKartModal").style.display="none";
  document.getElementById("musteriZiyaretModal").style.display="flex";
  var silBtn = document.getElementById("ziyaretSilBtn");
  if(silBtn) silBtn.style.display="none";
}

function musteriGecmisIslemleriAc(){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  document.getElementById("gecmisIslemlerBaslik").textContent = "🕘 İşlem Geçmişi";
  document.getElementById("gecmisIslemlerMusteriAd").textContent = m.ad||"";
  // Müşteri Kartı'nda gösterilen "İşlem Özeti" artık burada — İşlemler'de zaten
  // müşteri geçmişi olduğu için Kart'ta tekrar göstermeye gerek yoktu.
  var ozet = musteriIslemOzetiGetir(m);
  document.getElementById("gecmisIslemSayisi").textContent = ozet.sayi;
  document.getElementById("gecmisToplamTutar").textContent = ozet.toplamEuro.toFixed(2).replace(".",",")+" €";
  musteriGecmisRenderEt();
  document.getElementById("musteriKartModal").style.display="none";
  document.getElementById("musteriGecmisIslemlerModal").style.display="flex";
}

// SÜREÇ TAKİBİ — aynı müşteri+ürün için NUMUNE→TEKLİF→PROFORMA→SİPARİŞ zincirini manuel bağlama
function surecleriGetir(){ return lsGet("weicon_surecler", []); }
function surecleriKaydet(liste){ lsSet("weicon_surecler", liste); }

function musteriSurecleriniGetir(musteriAdi){
  var tumSurecler = surecleriGetir();
  return tumSurecler.filter(function(s){
    return (s.musteri||"").toLocaleLowerCase("tr-TR") === (musteriAdi||"").toLocaleLowerCase("tr-TR");
  });
}

function kayitlariSureceBagla(musteriAdi, secililer){
  // secililer: [{tip, ts}, ...]
  var surecler = surecleriGetir();
  var hedefSurec = null;
  for(var i=0;i<surecler.length && !hedefSurec;i++){
    var s = surecler[i];
    for(var j=0;j<secililer.length;j++){
      var eslesme = s.asamalar.some(function(a){ return a.tip===secililer[j].tip && a.ts===secililer[j].ts; });
      if(eslesme){ hedefSurec = s; break; }
    }
  }
  if(!hedefSurec){
    hedefSurec = {id:"surec_"+Date.now(), musteri:musteriAdi, olusturmaTs:Date.now(), durum:"acik", asamalar:[]};
    surecler.push(hedefSurec);
  }
  for(var k=0;k<secililer.length;k++){
    var varMi = hedefSurec.asamalar.some(function(a){ return a.tip===secililer[k].tip && a.ts===secililer[k].ts; });
    if(!varMi) hedefSurec.asamalar.push(secililer[k]);
  }
  hedefSurec.asamalar.sort(function(a,b){ return (a.ts||0)-(b.ts||0); });
  if(hedefSurec.asamalar.some(function(a){ return a.tip==="siparis"; })) hedefSurec.durum="tamamlandi";
  surecleriKaydet(surecler);
  return hedefSurec;
}

function surecListesiRenderEt(musteriAdi){
  var div = document.getElementById("surecListesiDiv");
  if(!div) return;
  var surecler = musteriSurecleriniGetir(musteriAdi);
  if(surecler.length===0){ div.innerHTML=""; return; }
  var arsiv = lsGet("weicon_arsiv",{});
  var tipEtiket = {siparis:"SİPARİŞ", teklif:"TEKLİF", proforma:"PROFORMA", numune:"NUMUNE"};
  var tipRenk = ISLEM_TURU_RENK;
  var html = "<div style='font-size:16px;font-weight:900;color:#003a70;margin-bottom:8px;'>🔗 Süreçler</div>";
  for(var i=0;i<surecler.length;i++){
    var s = surecler[i];
    var durumRenk = s.durum==="tamamlandi" ? "#16a085" : "#f2994a";
    var durumEtiket = s.durum==="tamamlandi" ? "✅ Tamamlandı" : "🔄 Devam Ediyor";
    html += "<div style='background:#f7f9fc;border:1px solid #d5dce6;border-left:5px solid "+durumRenk+";border-radius:8px;padding:10px 14px;margin-bottom:8px;'>";
    html += "<div style='font-size:13px;font-weight:900;color:"+durumRenk+";margin-bottom:6px;'>"+durumEtiket+"</div>";
    html += "<div style='display:flex;flex-wrap:wrap;gap:6px;align-items:center;'>";
    for(var j=0;j<s.asamalar.length;j++){
      var a = s.asamalar[j];
      var kayit = (arsiv[a.tip]||[]).find(function(k){ return k.ts===a.ts; });
      var tarihKisa = kayit ? (kayit.tarih||"").split(" - ")[0] : "";
      html += "<span onclick=\"surecAsamaDetayAc('"+a.tip+"',"+a.ts+")\" style='cursor:pointer;background:#fff;border:1px solid "+tipRenk[a.tip]+";color:"+tipRenk[a.tip]+";padding:4px 10px;border-radius:14px;font-size:12px;font-weight:800;white-space:nowrap;'>"+tipEtiket[a.tip]+" · "+tarihKisa+"</span>";
      if(j<s.asamalar.length-1) html += "<span style='color:#aab;'>→</span>";
    }
    html += "</div></div>";
  }
  div.innerHTML = html;
}

function surecAsamaDetayAc(tip, ts){
  try{
    var arsiv = lsGet("weicon_arsiv",{});
    var liste = arsiv[tip]||[];
    var kayit = null, idx=-1;
    for(var i=0;i<liste.length;i++){ if(liste[i].ts===ts){ kayit=liste[i]; idx=i; break; } }
    if(!kayit){ showToast("Kayıt bulunamadı (tip:"+tip+", ts:"+ts+")."); return; }
    document.getElementById("musteriGecmisIslemlerModal").style.display="none";
    document.getElementById("musteriKartModal").style.display="none";
    var gorevModal = document.getElementById("gorevListesiModal");
    if(gorevModal) gorevModal.style.display="none";
    var belgeTipi = ISLEM_TURU_ADI[tip] || tip.toUpperCase();
    faturaOnizlemePopupGoster(kayit.musteri||"-", "", kayit.tarih||"-", kayit.urunler||[], belgeTipi, tip, idx);
  } catch(e){
    showToast("⚠️ Hata: "+(e&&e.message?e.message:"bilinmeyen hata"), 6000);
  }
}

// Depolanan "23 Tem 2026 - 14:24" formatını "23.07.26 / 14-24" (2 satır) olarak kısaltır — sadece görünüm için, veri değişmez
function revizeTarihSaatFormatla(ts){
  if(!ts) return "";
  var d = new Date(ts);
  var pad = function(n){ return ("0"+n).slice(-2); };
  return pad(d.getDate())+"."+pad(d.getMonth()+1)+"."+String(d.getFullYear()).slice(-2)+" "+pad(d.getHours())+":"+pad(d.getMinutes());
}

// Bir kaydın "🔄 REVİZE" etiketine dokununca, o kaydın revize geçmişini
// (her revizeden önceki fiyat/ürün sayısı anlık görüntüsü) listeler.
function revizeGecmisiGoster(tip, idx){
  var kayit = arsivData[tip] && arsivData[tip][idx];
  if(!kayit){ showToast("Kayıt bulunamadı."); return; }
  var guncelToplam = (kayit.urunler||[]).reduce(function(s,u){ return s+(u.toplamEuro||0); }, 0);
  if(!kayit.revizeGecmisi || kayit.revizeGecmisi.length===0){
    alert("🔄 REVİZE GEÇMİŞİ — "+(kayit.kod||"")+"\n\nBu kayıt revize edilmiş ama ayrıntılı fiyat geçmişi tutulmaya bu güncellemeden (V437) sonra başlandı, bu yüzden önceki fiyat bilgisi yok.\n\nGüncel: "+guncelToplam.toFixed(2)+" € ("+(kayit.urunler||[]).length+" ürün)");
    return;
  }
  var satirlar = kayit.revizeGecmisi.map(function(g, i){
    return "v"+(i+1)+" · "+revizeTarihSaatFormatla(g.ts)+" → "+g.toplamEuro.toFixed(2)+" € ("+g.urunSayisi+" ürün)";
  });
  satirlar.push("v"+(kayit.revizeGecmisi.length+1)+" · GÜNCEL → "+guncelToplam.toFixed(2)+" € ("+(kayit.urunler||[]).length+" ürün)");
  alert("🔄 REVİZE GEÇMİŞİ — "+(kayit.kod||"")+"\n\n"+satirlar.join("\n"));
}

function tarihKisalt(tarihStr){
  if(!tarihStr) return "-";
  var parcalar = tarihStr.split(" - ");
  var tarihKismi = parcalar[0]||"";
  var saatKismi = parcalar[1]||"";
  var dp = tarihKismi.split(" ");
  if(dp.length<3) return tarihStr;
  var aylar=["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  var ayIdx = aylar.indexOf(dp[1]);
  var ayNo = ayIdx>=0 ? (ayIdx+1) : 1;
  var gun = ("0"+dp[0]).slice(-2);
  var ayStr = ("0"+ayNo).slice(-2);
  var yil2 = (dp[2]||"").slice(-2);
  var kisaTarih = gun+"."+ayStr+"."+yil2;
  var kisaSaat = saatKismi.replace(":","-");
  return "<div>"+kisaTarih+"</div><div style='margin-top:2px;'>"+kisaSaat+"</div>";
}

// Kart tasarımlarında (Son İşlemler / Aylık Sipariş Özeti) tarih ve saatin YAN
// YANA, TEK SATIRDA gösterilmesi için — tarihKisalt'ın alt-alta (iki satır)
// halinden farklı olarak, burada "17.08.26 · 14:39" şeklinde tek satır döner.
function tarihKisaltTekSatir(tarihStr){
  if(!tarihStr) return "-";
  var parcalar = tarihStr.split(" - ");
  var tarihKismi = parcalar[0]||"";
  var saatKismi = parcalar[1]||"";
  var dp = tarihKismi.split(" ");
  if(dp.length<3) return tarihStr;
  var aylar=["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  var ayIdx = aylar.indexOf(dp[1]);
  var ayNo = ayIdx>=0 ? (ayIdx+1) : 1;
  var gun = ("0"+dp[0]).slice(-2);
  var ayStr = ("0"+ayNo).slice(-2);
  var yil2 = (dp[2]||"").slice(-2);
  var kisaTarih = gun+"."+ayStr+"."+yil2;
  return kisaTarih + (saatKismi ? " · "+saatKismi : "");
}

var _uzunBasiZamanlayici = null;
var _uzunBasiTetiklendi = false;
function uzunBasiBaslat(fn){
  _uzunBasiTetiklendi = false;
  _uzunBasiZamanlayici = setTimeout(function(){ _uzunBasiTetiklendi = true; fn(); }, 600);
}
function uzunBasiBitir(){
  if(_uzunBasiZamanlayici){ clearTimeout(_uzunBasiZamanlayici); _uzunBasiZamanlayici = null; }
}
function uzunBasiTikSonrasi(){
  // Uzun basma tetiklendiyse, aynı dokunuşun sonundaki normal "click"i yut (satır popup'ı açılmasın)
  if(_uzunBasiTetiklendi){ _uzunBasiTetiklendi = false; return true; }
  return false;
}

// Ürün ismine 600ms uzun basınca, ürünü doğrudan WEICON Türkiye'nin kendi site içi
// arama motorunda arar (weicon.com.tr/search?search=...).
// Abas kodu WEICON'un kendi ürün numarasıyla birebir aynı olduğu için (doğrulandı),
// varsa Abas koduyla aranır — bu kesin/birebir eşleşme sağlar. Abas yoksa isimle aranır.
function urunAdiniWeiconDaAra(urunAdi, abasKodu){
  if(!urunAdi && !abasKodu) return;
  var sorgu = (abasKodu && String(abasKodu).trim() && String(abasKodu).trim().toLowerCase()!=="nan")
    ? String(abasKodu).trim()
    : urunAdi;
  window.open("https://www.weicon.com.tr/search?search="+encodeURIComponent(sorgu), "_blank");
}

// İşlem Geçmişi ekranı iki görünüm sunar: "liste" (mevcut, işlem bazlı tam
// döküm) ve "urunOzeti" (YENİ — bu müşteriye satılan HER ÜRÜN sadece bir kez,
// en son verilen fiyat/iskontoyla). SAP Business One'daki "Last Selling
// Price" mantığı — salt-okunur, hiçbir yeni veri kaydetmez.
var musteriGecmisGorunum = "liste"; // "liste" | "urunOzeti"
function musteriGecmisGorunumDegistir(mod){
  musteriGecmisGorunum = mod;
  musteriGecmisRenderEt();
}

function musteriGecmisRenderEt(){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  surecListesiRenderEt(m.ad);
  var tipEtiket = {siparis:"SİP", teklif:"FİYTEK", proforma:"PROFAT", numune:"NUM"};
  var tipRenk = ISLEM_TURU_RENK;
  var tipler = ["numune","teklif","proforma","siparis"];

  var arsiv = lsGet("weicon_arsiv",{});
  var islemler = [];
  for(var t=0;t<tipler.length;t++){
    var liste = arsiv[tipler[t]]||[];
    for(var k=0;k<liste.length;k++){
      var buKayitBuMusteriyeMi = (m.id && liste[k].musteriId)
        ? (liste[k].musteriId===m.id)
        : ((liste[k].musteri||"").toLocaleLowerCase("tr-TR") === (m.ad||"").toLocaleLowerCase("tr-TR"));
      if(buKayitBuMusteriyeMi){
        islemler.push({kayit:liste[k], idx:k, tip:tipler[t]});
      }
    }
  }
  islemler.sort(function(a,b){ return (b.kayit.ts||0)-(a.kayit.ts||0); });

  var el = document.getElementById("gecmisIslemlerListesi");
  if(islemler.length===0){
    el.innerHTML = "<div style='color:#888;font-size:33px;padding:24px 0;'>Bu müşteri için kayıtlı sipariş/fiyat teklifi geçmişi yok.</div>";
    return;
  }

  // "İşlem Listesi / Ürün Özeti" sekme kutucukları kaldırıldı — artık bu ekran
  // her zaman tek, sade bir İşlem Listesi tablosu gösteriyor.
  var gorunumSekmeleri = "";

  if(musteriGecmisGorunum==="urunOzeti"){
    // Aynı ürün (berta+abas) birden fazla işlemde geçmiş olabilir — sadece
    // EN SON (islemler zaten ts'ye göre azalan sırada) görülen kaydı tutuyoruz.
    var urunOzet = {};
    var siraNo = [];
    for(var oi=0; oi<islemler.length; oi++){
      var okayit = islemler[oi].kayit;
      if(!okayit.urunler) continue;
      for(var oj=0; oj<okayit.urunler.length; oj++){
        var ou = okayit.urunler[oj];
        var anahtar = (ou.berta||"")+"|"+(ou.abas||"")+"|"+(ou.name||"");
        if(!urunOzet[anahtar]){
          urunOzet[anahtar] = {name:ou.name, berta:ou.berta, abas:ou.abas, tarih:okayit.tarih, adet:ou.adet, iskBirim:ou.iskBirim, iskonto:ou.iskonto, tip:islemler[oi].tip};
          siraNo.push(anahtar);
        }
      }
    }
    var ozetHtml = gorunumSekmeleri;
    if(siraNo.length===0){
      ozetHtml += "<div style='color:#8a97a6;font-size:20px;padding:24px 0;text-align:center;'>Bu müşteriye henüz ürün satılmamış/teklif edilmemiş.</div>";
    } else {
      var TIP_ETIKET2 = {siparis:"SİP", teklif:"TEK", proforma:"PRO", numune:"NUM"};
      var TIP_RENK2 = {siparis:"#003a70", teklif:"#1f9d55", proforma:"#8e44ad", numune:"#b7601f"};
      ozetHtml += "<div style='font-size:13px;color:#8a97a6;font-weight:700;margin-bottom:8px;'>"+siraNo.length+" farklı ürün — her biri EN SON verilen fiyatla, tek satır</div>";
      ozetHtml += "<div style='border:1px solid #eef1f5;border-radius:10px;overflow:hidden;'>";
      siraNo.forEach(function(anahtar, i){
        var o = urunOzet[anahtar];
        var zebra = (i%2===1) ? "background:#f7f9fc;" : "background:#fff;";
        ozetHtml += "<div style='padding:12px 14px;border-bottom:1.5px solid #eef1f5;"+zebra+"'>"
          +"<div style='display:flex;align-items:center;gap:6px;'><span style='font-size:11px;font-weight:900;color:#fff;background:"+(TIP_RENK2[o.tip]||"#556170")+";padding:2px 6px;border-radius:5px;flex-shrink:0;'>"+(TIP_ETIKET2[o.tip]||"")+"</span><span style='font-size:19px;font-weight:900;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>"+safeText(o.name)+"</span></div>"
          +"<div style='display:flex;justify-content:space-between;align-items:baseline;margin-top:4px;padding-left:2px;'>"
          +"<span style='font-size:12px;color:#374151;font-weight:700;'>Son: "+tarihKisaltTekSatir(o.tarih)+" · "+o.adet+" adet</span>"
          +"<span style='font-size:17px;font-weight:900;color:#003a70;'>"+fmt(o.iskBirim)+"€ <span style='font-size:12px;color:#c0392b;'>(%"+o.iskonto+")</span></span>"
          +"</div>"
          +"</div>";
      });
      ozetHtml += "</div>";
    }
    el.innerHTML = ozetHtml;
    return;
  }

  var html = gorunumSekmeleri;
  html += "<div style='overflow-x:hidden;'>";
  html += "<table style='border-collapse:collapse;width:100%;table-layout:fixed;font-size:21px;'>";
  html += "<thead><tr style='background:#cfe2f3;'>"
    +"<th style='padding:5px 2px;text-align:center;white-space:nowrap;border:1px solid #3569b8;color:#111827;width:12%;'>KOD</th>"
    +"<th style='padding:5px 2px;text-align:center;white-space:nowrap;border:1px solid #3569b8;color:#111827;width:9%;font-size:15px;font-weight:800;letter-spacing:.3px;'>TARİH</th>"
    +"<th style='padding:5px 2px;text-align:left;border:1px solid #3569b8;color:#111827;width:19%;'>ÜRÜN İSMİ</th>"
    +"<th style='padding:5px 1px;text-align:center;white-space:nowrap;border:1px solid #3569b8;color:#111827;width:7%;'>ADET</th>"
    +"<th style='padding:5px 1px;text-align:center;white-space:nowrap;border:1px solid #3569b8;color:#111827;width:11%;'>LİSTE</th>"
    +"<th style='padding:5px 1px;text-align:center;white-space:nowrap;border:1px solid #3569b8;color:#111827;width:9%;'>İSK</th>"
    +"<th style='padding:5px 1px;text-align:center;white-space:nowrap;border:1px solid #3569b8;color:#111827;width:11%;'>NET</th>"
    +"<th style='padding:5px 1px;text-align:center;white-space:nowrap;border:1px solid #3569b8;color:#111827;width:11%;'>TOPLAM</th>"
    +"<th style='padding:5px 1px;text-align:center;white-space:nowrap;border:1px solid #3569b8;color:#111827;width:11%;'>PRİM</th>"
    +"</tr></thead><tbody>";

  for(var i=0;i<islemler.length;i++){
    var kayit = islemler[i].kayit;
    var idx = islemler[i].idx;
    var tip = islemler[i].tip;
    var renk = tipRenk[tip];
    var TIP_ZEMIN2 = {siparis:"#dbe9f9", teklif:"#cdf3de", proforma:"#e5cdf7", numune:"#ffe3bf"};
    var sorunluMu2 = kayit.durum==="iptal" || kayit.durum==="iade" || kayit.durum==="kacan";
    var satirBg = sorunluMu2 ? "#fac9c5" : (TIP_ZEMIN2[tip]||"#ffffff");
    var kayitSilCagri = "istatistikKayitSil('"+tip+"',"+idx+");musteriGecmisRenderEt();";
    if(kayit.urunler) for(var j=0;j<kayit.urunler.length;j++){
      var u = kayit.urunler[j];
      var urunSilCagri = "musteriGecmisUrunSil('"+tip+"',"+idx+","+j+")";
      var uMk = (u.iskBirim||0)-(u.dipFiyat||0);
      var uPrim = uMk*(u.adet||0)*0.22;
      if(uPrim<0) uPrim = 0;
      html += "<tr onclick=\"if(uzunBasiTikSonrasi())return;musteriGecmisIslemDetayAc('"+tip+"',"+idx+")\" style='background:"+satirBg+";cursor:pointer;'>";
      html += "<td onclick=\"event.stopPropagation();if(uzunBasiTikSonrasi())return;hareketHucresiPopupAc('"+tip+"',"+idx+")\" oncontextmenu='return false;' onmousedown=\"event.stopPropagation();uzunBasiBaslat(function(){"+kayitSilCagri+"})\" onmouseup='uzunBasiBitir()' onmouseleave='uzunBasiBitir()' ontouchstart=\"event.stopPropagation();uzunBasiBaslat(function(){"+kayitSilCagri+"})\" ontouchend='uzunBasiBitir()' ontouchmove='uzunBasiBitir()' style='padding:5px 2px;border:1px solid #3569b8;text-align:center;-webkit-user-select:none;user-select:none;overflow-wrap:break-word;cursor:pointer;'>"+(j===0?(kodHtmlOlustur(kayit.kod,16,11,kayit.kanal)+(kayit.durum?"<div style='font-size:10px;font-weight:900;color:"+(kayit.durum==="iptal"||kayit.durum==="kacan"?"#c0392b":"#6a1b9a")+";margin-top:3px;'>"+(kayit.durum==="iptal"?"🚫 İPTAL":kayit.durum==="iade"?"↩️ İADE":kayit.durum==="kacan"?("❌ KAÇTI"+(kayit.kacanRakip?"<br><span style='font-size:9px;font-weight:700;'>→ "+kayit.kacanRakip+"</span>":"")):"")+"</div>":"")+(kayit.revizeZamani?"<div style='font-size:10px;font-weight:900;color:#c0392b;margin-top:3px;'>🔄 REVİZE<br>"+revizeTarihSaatFormatla(kayit.revizeZamani)+"</div>":"")):"")+"</td>";
      html += "<td style='padding:5px 2px;border:1px solid #3569b8;text-align:center;color:#374151;font-size:16px;font-weight:700;'>"+(j===0?tarihKisalt(kayit.tarih):"")+"</td>";
      html += "<td oncontextmenu='return false;' onmousedown=\"event.stopPropagation();uzunBasiBaslat(function(){"+urunSilCagri+"})\" onmouseup='uzunBasiBitir()' onmouseleave='uzunBasiBitir()' ontouchstart=\"event.stopPropagation();uzunBasiBaslat(function(){"+urunSilCagri+"})\" ontouchend='uzunBasiBitir()' ontouchmove='uzunBasiBitir()' style='padding:5px 2px;border:1px solid #3569b8;-webkit-user-select:none;user-select:none;overflow-wrap:break-word;'><div style='font-size:12px;font-weight:800;color:#111827;'><span style='color:#003a70;'>B:</span>"+(u.berta||"-")+" <span style='color:#e0524a;'>A:</span>"+(u.abas||"-")+"</div><div style='font-weight:900;color:#111827;margin-top:4px;font-size:15px;'>"+u.name+"</div></td>";
      html += "<td style='padding:5px 1px;border:1px solid #3569b8;color:#111827;font-weight:900;text-align:center;white-space:nowrap;'>"+u.adet+"</td>";
      html += "<td style='padding:5px 1px;border:1px solid #3569b8;font-size:14px;font-weight:800;color:#111827;text-align:center;white-space:nowrap;'>"+fmt(u.listeFiyat)+" €</td>";
      html += "<td style='padding:5px 1px;border:1px solid #3569b8;font-size:13px;font-weight:900;color:#c0392b;text-align:center;white-space:nowrap;'>%"+u.iskonto+"</td>";
      html += "<td style='padding:5px 1px;border:1px solid #3569b8;font-size:16px;font-weight:900;color:"+renk+";text-align:center;white-space:nowrap;'>"+fmt(u.iskBirim)+" €</td>";
      html += "<td style='padding:5px 1px;border:1px solid #3569b8;font-size:15px;font-weight:900;color:#0e6b34;text-align:center;white-space:nowrap;'>"+fmt(u.toplamEuro)+" €</td>";
      html += "<td style='padding:5px 1px;border:1px solid #3569b8;font-size:14px;font-weight:800;color:#0e7c63;text-align:center;white-space:nowrap;'>"+fmt(uPrim)+" €</td>";
      html += "</tr>";
    }
  }
  html += "</tbody></table></div>";
  html += "<div style='font-size:15px;color:#888;text-align:center;margin-top:8px;'>💡 Kod etiketine uzun basarsan tüm işlem, ürüne uzun basarsan sadece o ürün silinir.</div>";
  el.innerHTML = html;
}

function musteriGecmisUrunSil(tip, idx, urunIdx){
  if(!confirm("Bu ürünü teklif/siparişten çıkarmak istediğinize emin misiniz?")) return;
  var arsivData = lsGet("weicon_arsiv",{});
  if(!arsivData[tip] || !arsivData[tip][idx] || !arsivData[tip][idx].urunler) return;
  var kayit = arsivData[tip][idx];
  kayit.urunler.splice(urunIdx,1);
  var kayitTamamenSilindi = false;
  if(kayit.urunler.length===0){
    // Son ürün de silindiyse, artık boş kalan kaydın tamamını kaldır
    arsivData[tip].splice(idx,1);
    kayitTamamenSilindi = true;
  }
  lsSet("weicon_arsiv", arsivData);
  if(window.fbSet){
    var degisiklik = kayitTamamenSilindi ? {tip:tip, silinecekKod:kayit.kod} : {tip:tip, kayit:kayit};
    arsivGuvenliKaydet(degisiklik).then(function(){
      showToast("✓ Ürün kayıttan çıkarıldı ve Firebase'e yazıldı.");
    }).catch(function(e){
      showToast("⚠️ Firebase HATASI: "+((e&&(e.code||e.message))||"bilinmiyor"), 6000);
    });
  } else {
    showToast("✓ Ürün kayıttan çıkarıldı (yerel).");
  }
  musteriGecmisRenderEt();
}

function musteriGecmisIslemDetayAc(tip, idx){
  document.getElementById("musteriGecmisIslemlerModal").style.display="none";
  var data = lsGet("weicon_arsiv",{});
  var kayit = data[tip] ? data[tip][idx] : null;
  if(!kayit){ showToast("Kayıt bulunamadı."); return; }
  var belgeTipi = ISLEM_TURU_ADI[tip] || (tip?tip.toUpperCase():"SİPARİŞ");
  faturaOnizlemePopupGoster(kayit.musteri||"-", "", kayit.tarih||"-", kayit.urunler||[], belgeTipi, tip, idx);
}

// HAREKET HÜCRESİ POPUP'I — İşlem Geçmişi tablosunda bir satırın KOD hücresine
// dokununca açılır. "Revize Et" artık HER satır için ayrı ayrı buradan
// başlatılıyor (eskiden ekranın en altında sadece EN GÜNCEL işlem için tek
// bir buton olarak duruyordu). Revize Et, zaten var olan kayitDuzenleAc
// mekanizmasını kullanır — o da "Kaydet" / "Kaydet ve Gönder" seçenekleriyle
// (Kaydet ve Gönder → belge önizleme → 🔁 Hareket Seç → mail gönderim) aynı
// mevcut rotaya bağlanıyor, hiçbir yeni altyapı kurmaya gerek kalmadı.
function hareketHucresiPopupAc(tip, idx){
  var arsiv = lsGet("weicon_arsiv",{});
  var kayit = arsiv[tip] ? arsiv[tip][idx] : null;
  if(!kayit){ showToast("Kayıt bulunamadı."); return; }
  document.getElementById("hareketHucresiBaslik").textContent = safeText(kayit.kod||"-") + " — " + safeText(kayit.musteri||"");
  document.getElementById("hareketHucresiAltBaslik").textContent = (kayit.tarih||"") + (kayit.revizeZamani ? " · 🔄 Daha önce revize edilmiş" : "");
  var btn = document.getElementById("hareketHucresiRevizeBtn");
  btn.onclick = function(){
    document.getElementById("hareketHucresiModal").style.display = "none";
    kayitDuzenleAc(tip, idx);
  };
  document.getElementById("hareketHucresiModal").style.display = "flex";
}

function musteriGecmisIslemleriGeriDon(){
  document.getElementById("musteriGecmisIslemlerModal").style.display="none";
  document.getElementById("musteriKartModal").style.display="flex";
}

function musteriGecmisIslemleriKapat(){
  document.getElementById("musteriGecmisIslemlerModal").style.display="none";
}

function musteriZiyaretKapat(){
  ziyaretDuzenlenenTs = null;
  document.getElementById("musteriZiyaretModal").style.display="none";
}

function ziyaretKaydiDuzenle(ts){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  var z = (m.ziyaretGecmisi||[]).find(function(x){ return x.ts===ts; });
  if(!z) return;
  ziyaretDuzenlenenTs = ts;
  ziyaretSeciliTur = z.tur || "ziyaret";
  ziyaretSeciliFotolar = (z.fotolar || []).map(function(u){ return {durum:"hazir", url:u}; });
  ziyaretSeciliKisi = z.kisi || null;
  ziyaretTurSeciciOlustur();
  ziyaretFotoGaleriOlustur();
  ziyaretKisiEtiketGuncelle();
  var mesajAlaniDuzenle = document.getElementById("ziyaretMesajAlani");
  if(mesajAlaniDuzenle) mesajAlaniDuzenle.style.display = (ziyaretSeciliTur==="mail"||ziyaretSeciliTur==="mesaj") ? "block" : "none";
  var d = new Date(z.ts);
  var pad=function(n){ return n.toString().padStart(2,"0"); };
  var localVal = d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes());
  document.getElementById("ziyaretTarihSaat").value = localVal;
  document.getElementById("ziyaretNotu").value = z.not||"";
  document.getElementById("ziyaretModalBaslik").textContent = "✏️ Temas Kaydını Düzenle";
  var silBtn = document.getElementById("ziyaretSilBtn");
  if(silBtn) silBtn.style.display="block";
  document.getElementById("musteriZiyaretGecmisiModal").style.display="none";
  document.getElementById("musteriZiyaretModal").style.display="flex";
}

function ziyaretKaydiSil(){
  if(musteriKartIdx===null || ziyaretDuzenlenenTs===null) return;
  if(!confirm("Bu ziyaret kaydını silmek istediğinize emin misiniz?")) return;
  var idx = musteriKartIdx;
  var orijinalAd = musteriListesi[idx].ad;
  var orijinalId = musteriListesi[idx].id || null;
  var silinecekTs = ziyaretDuzenlenenTs;

  function guncellemeyiUygula(guncelListe){
    var hedefIdx = orijinalId ? guncelListe.findIndex(function(m){ return m.id===orijinalId; }) : -1;
    if(hedefIdx===-1) hedefIdx = guncelListe.findIndex(function(m){ return m.ad===orijinalAd; });
    if(hedefIdx===-1) hedefIdx = idx;
    if(!guncelListe[hedefIdx] || !guncelListe[hedefIdx].ziyaretGecmisi) return;
    guncelListe[hedefIdx].ziyaretGecmisi = guncelListe[hedefIdx].ziyaretGecmisi.filter(function(z){ return z.ts!==silinecekTs; });
    guncelListe[hedefIdx].ziyaretGecmisi.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
    if(guncelListe[hedefIdx].ziyaretGecmisi.length>0){
      guncelListe[hedefIdx].sonZiyaret = guncelListe[hedefIdx].ziyaretGecmisi[0].ts;
      guncelListe[hedefIdx].sonZiyaretNot = guncelListe[hedefIdx].ziyaretGecmisi[0].not;
    }
    musteriListesi = guncelListe;
    lsSet("weicon_musteriler", musteriListesi);
    if(window.fbSet) musteriListesiGuvenliKaydet(musteriListesi[hedefIdx]).catch(function(e){ console.error("Firebase yazma hatası:", e); });
    musteriListesiniRenderEt();
    showToast("🗑 Ziyaret kaydı silindi.");
  }

  ziyaretDuzenlenenTs = null;
  musteriZiyaretKapat();
  if(window.fbGet){
    window.fbGet("musteriler").then(function(data){
      guncellemeyiUygula(data ? (Array.isArray(data)?data:Object.values(data)) : []);
    }).catch(function(){ guncellemeyiUygula(lsGet("weicon_musteriler",[])); });
  } else {
    guncellemeyiUygula(lsGet("weicon_musteriler",[]));
  }
}

function musteriZiyaretKaydet(){
  if(musteriKartIdx===null) return;
  var idx = musteriKartIdx;
  if(!musteriListesi[idx]) return;
  var orijinalAd = musteriListesi[idx].ad;
  var orijinalId = musteriListesi[idx].id || null;
  var tarihSaatVal = document.getElementById("ziyaretTarihSaat").value;
  var not = document.getElementById("ziyaretNotu").value.trim();
  var tur = ziyaretSeciliTur || "ziyaret";
  if(ziyaretSeciliFotolar.some(function(f){ return f.durum==="yukleniyor"; })){
    showToast("⏳ Fotoğraf(lar) hâlâ yükleniyor, birkaç saniye bekleyip tekrar deneyin.", 4000);
    return;
  }
  var fotolar = ziyaretSeciliFotolar.filter(function(f){ return f.durum==="hazir" && f.url; }).map(function(f){ return f.url; });
  var kisi = ziyaretSeciliKisi || null;
  var ts = tarihSaatVal ? new Date(tarihSaatVal).getTime() : Date.now();
  var duzenlenenEskiTs = ziyaretDuzenlenenTs;

  function guncellemeyiUygula(guncelListe){
    var hedefIdx = orijinalId ? guncelListe.findIndex(function(m){ return m.id===orijinalId; }) : -1;
    if(hedefIdx===-1) hedefIdx = guncelListe.findIndex(function(m){ return m.ad===orijinalAd; });
    if(hedefIdx===-1) hedefIdx = idx;
    if(!guncelListe[hedefIdx]) return;
    if(!guncelListe[hedefIdx].ziyaretGecmisi) guncelListe[hedefIdx].ziyaretGecmisi = [];
    var liste = guncelListe[hedefIdx].ziyaretGecmisi;
    if(duzenlenenEskiTs!==null){
      var mevcutIdx = liste.findIndex(function(z){ return z.ts===duzenlenenEskiTs; });
      if(mevcutIdx>=0){ liste[mevcutIdx] = {ts:ts, not:not, tur:tur, fotolar:fotolar, kisi:kisi, kod:liste[mevcutIdx].kod||benzersizKodUret(tur)}; }
      else { liste.push({ts:ts, not:not, tur:tur, fotolar:fotolar, kisi:kisi, kod:benzersizKodUret(tur)}); }
    } else {
      liste.push({ts:ts, not:not, tur:tur, fotolar:fotolar, kisi:kisi, kod:benzersizKodUret(tur)});
    }
    liste.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
    guncelListe[hedefIdx].sonZiyaret = liste[0].ts;
    guncelListe[hedefIdx].sonZiyaretNot = liste[0].not;
    musteriListesi = guncelListe;
    lsSet("weicon_musteriler", musteriListesi);
    if(window.fbSet){
      musteriListesiGuvenliKaydet(musteriListesi[hedefIdx]).then(function(){
        showToast((TEMAS_TURLERI[tur]?TEMAS_TURLERI[tur].ikon:"📍")+" Temas kaydedildi ve Firebase'e yazıldı ✓");
      }).catch(function(e){
        showToast("⚠️ Firebase HATASI: "+((e&&(e.code||e.message))||"bilinmiyor"), 6000);
      });
    } else {
      showToast((TEMAS_TURLERI[tur]?TEMAS_TURLERI[tur].ikon:"📍")+" Temas kaydedildi (yerel)!");
    }
    musteriListesiniRenderEt();
  }

  ziyaretDuzenlenenTs = null;
  musteriZiyaretKapat();
  if(window.fbGet){
    window.fbGet("musteriler").then(function(data){
      var guncelListe = data ? (Array.isArray(data)?data:Object.values(data)) : [];
      guncellemeyiUygula(guncelListe);
    }).catch(function(){
      guncellemeyiUygula(lsGet("weicon_musteriler",[]));
    });
  } else {
    guncellemeyiUygula(lsGet("weicon_musteriler",[]));
  }
}

function musteriZiyaretGecmisiAc(){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  document.getElementById("ziyaretGecmisiMusteriAd").innerHTML = safeText(m.ad||"")+(m.id?" <span style='font-size:16px;font-weight:800;color:#7ea6d6;'>🏷 "+safeText(m.id)+"</span>":"");
  var liste = (m.ziyaretGecmisi||[]).slice().sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
  var el = document.getElementById("ziyaretGecmisiListesi");
  if(liste.length===0){
    el.innerHTML = "<div style='color:#888;font-size:22px;padding:16px 0;'>Bu müşteri için kayıtlı temas geçmişi yok.</div>";
  } else {
    var html = "<div style='position:relative;padding-left:24px;border-left:2px solid #e3e8ef;'>";
    for(var i=0;i<liste.length;i++){
      var z = liste[i];
      var t = TEMAS_TURLERI[z.tur||"ziyaret"] || TEMAS_TURLERI.ziyaret;
      var tarihStr = z.ts ? new Date(z.ts).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "-";
      html += "<div onclick='ziyaretKaydiDuzenle("+z.ts+")' style='cursor:pointer;position:relative;margin-bottom:"+(i===liste.length-1?"0":"20px")+";padding-bottom:"+(i===liste.length-1?"0":"20px")+";"+(i===liste.length-1?"":"border-bottom:1px solid #eee;")+"'>"
        +"<div style='position:absolute;left:-30px;top:4px;width:12px;height:12px;border-radius:50%;background:"+t.renk+";border:2px solid #fff;box-shadow:0 0 0 1px "+t.renk+";'></div>"
        +"<div style='display:flex;justify-content:space-between;align-items:center;'>"
        +"<div style='font-size:22px;font-weight:900;color:#003a70;'>"+t.ikon+" "+t.ad+"</div>"
        +"<div style='font-size:15px;color:#999;'>✏️ düzenle</div>"
        +"</div>"
        +"<div style='font-size:17px;color:#8a94a3;font-weight:700;margin-top:2px;'>"+tarihStr+"</div>"
        +(z.kisi && z.kisi.isim ? "<div style='font-size:18px;color:#1a4d8f;margin-top:6px;font-weight:700;'>👤 "+safeText(z.kisi.isim)+(z.kisi.gorev||z.kisi.bolum ? " ("+safeText([z.kisi.bolum,z.kisi.gorev].filter(Boolean).join(" · "))+")" : "")+"</div>" : "")
        +(z.not ? "<div style='font-size:19px;color:#333;margin-top:6px;line-height:1.4;'>"+safeText(z.not)+"</div>" : "")
        +((z.fotolar && z.fotolar.length>0) ? "<div style='display:flex;gap:4px;margin-top:8px;flex-wrap:wrap;'>"+z.fotolar.map(function(f){ return "<img src='"+f+"' style='width:50px;height:50px;object-fit:cover;border-radius:6px;border:1px solid #ccc;'>"; }).join("")+"</div>" : "")
        +"</div>";
    }
    html += "</div>";
    el.innerHTML = html;
  }
  document.getElementById("musteriZiyaretModal").style.display="none";
  document.getElementById("musteriZiyaretGecmisiModal").style.display="flex";
}

function musteriZiyaretGecmisiGeriDon(){
  document.getElementById("musteriZiyaretGecmisiModal").style.display="none";
  document.getElementById("musteriZiyaretModal").style.display="flex";
}

function musteriZiyaretGecmisiKapat(){
  document.getElementById("musteriZiyaretGecmisiModal").style.display="none";
}

function musteriKartDuzenleAc(){
  if(musteriKartIdx===null) return;
  var idx = musteriKartIdx;
  document.getElementById("musteriKartModal").style.display="none";
  document.getElementById("musteriCariKartModal").style.display="none";
  musteriDuzenle(idx);
}

function musteriKartSilAc(){
  if(musteriKartIdx===null) return;
  var m = musteriListesi[musteriKartIdx];
  if(!m) return;
  document.getElementById("musteriKartModal").style.display="none";
  document.getElementById("musteriCariKartModal").style.display="none";
  document.getElementById("musteriSilOnayAd").textContent = m.ad + (m.id ? " ("+m.id+")" : "");
  document.getElementById("musteriSilOnayModal").style.display="flex";
}

function musteriSilOnayEvet(){
  document.getElementById("musteriSilOnayModal").style.display="none";
  if(musteriKartIdx===null) return;
  musteriSil(musteriKartIdx);
}

function musteriDuzenle(idx){
  var m = musteriListesi[idx];
  if(!m) return;
  document.getElementById("duzenleIdx").value = idx;
  document.getElementById("duzenleOrijinalAd").value = m.ad||"";
  document.getElementById("duzenleMusteriAdi").value = m.ad||"";
  document.getElementById("duzenleSehir").value = m.sehir||"";
  // ŞEMA STABİLİZASYONU: artık yeni dizinin ilk kaydından okunuyor (m.acikAdres/
  // m.teslimatAdresi ARTIK YENİ VERİDE YAZILMIYOR — sadece çok eski kayıtlarda
  // bulunabilir; musteriAdresListesiGetir zaten o eski değeri de otomatik
  // diziye taşıyıp buradan okunabilir hâle getiriyor).
  var faturaListesiAcilis = (typeof musteriAdresListesiGetir==="function") ? musteriAdresListesiGetir(m, "fatura") : [];
  var teslimatListesiAcilis = (typeof musteriAdresListesiGetir==="function") ? musteriAdresListesiGetir(m, "teslimat") : [];
  if(document.getElementById("duzenleAcikAdres")) document.getElementById("duzenleAcikAdres").value = (faturaListesiAcilis[0] && faturaListesiAcilis[0].adres) || "";
  document.getElementById("duzenleVade").value = m.vade||"";
  document.getElementById("duzenleFatura").value = m.fatura||"";
  document.getElementById("duzenleYetkiliTelefon").value = m.telefon || "";
  document.getElementById("duzenleYetkiliEposta").value = m.eposta || "";
  document.getElementById("duzenleKargo").value = m.kargo||"";
  document.getElementById("duzenleTeslimatAdresi").value = (teslimatListesiAcilis[0] && teslimatListesiAcilis[0].adres) || "";
  document.getElementById("musteriDuzenleModal").style.display="flex";
}

function musteriDuzenleKaydet(){
  var idx = parseInt(document.getElementById("duzenleIdx").value);
  var orijinalAd = document.getElementById("duzenleOrijinalAd").value;
  var orijinalId = musteriListesi[idx] ? musteriListesi[idx].id : null;
  var yeniAd = turkceBaslikDuzeni(document.getElementById("duzenleMusteriAdi").value.trim());
  var yeniSehir = turkceBaslikDuzeni(document.getElementById("duzenleSehir").value.trim());
  var yeniAcikAdres = document.getElementById("duzenleAcikAdres") ? document.getElementById("duzenleAcikAdres").value.trim() : "";
  var yeniVade = document.getElementById("duzenleVade").value.trim();
  var yeniFatura = document.getElementById("duzenleFatura").value.trim();
  var yeniYetkiliTelefon = document.getElementById("duzenleYetkiliTelefon").value.trim();
  var yeniYetkiliEposta = document.getElementById("duzenleYetkiliEposta").value.trim();
  var yeniKargo = document.getElementById("duzenleKargo").value.trim();
  var yeniTeslimatAdresi = document.getElementById("duzenleTeslimatAdresi").value.trim();
  musteriDuzenleKapat();

  function guncellemeyiUygula(guncelListe){
    // Önce kalıcı ID ile eşleştir, olmazsa isimle (başka cihaz sıralamayı değiştirmiş olabilir), o da olmazsa index'e düş
    var hedefIdx = orijinalId ? guncelListe.findIndex(function(m){ return m.id===orijinalId; }) : -1;
    if(hedefIdx===-1) hedefIdx = guncelListe.findIndex(function(m){ return m.ad===orijinalAd; });
    if(hedefIdx===-1) hedefIdx = idx;
    if(!guncelListe[hedefIdx]) return;
    guncelListe[hedefIdx].ad = yeniAd;
    guncelListe[hedefIdx].sehir = yeniSehir;
    guncelListe[hedefIdx].vade = yeniVade;
    guncelListe[hedefIdx].fatura = yeniFatura;
    guncelListe[hedefIdx].telefon = yeniYetkiliTelefon;
    guncelListe[hedefIdx].eposta = yeniYetkiliEposta;
    guncelListe[hedefIdx].kargo = yeniKargo;
    // ŞEMA STABİLİZASYONU: bu ekran hâlâ TEK bir fatura/teslimat adresi alıyor
    // (basit metin kutusu) — ama artık eski acikAdres/teslimatAdresi'ne değil,
    // yeni dizinin İLK kaydına yazıyor (tek gerçek kaynak orası). Birden fazla
    // adres eklemek/yönetmek için Müşteri Kartı'ndaki tam liste kullanılmalı.
    if(typeof musteriAdresListesiGetir==="function"){
      var faturaListesiDuzenle = musteriAdresListesiGetir(guncelListe[hedefIdx], "fatura");
      if(yeniAcikAdres){
        if(faturaListesiDuzenle.length) faturaListesiDuzenle[0].adres = yeniAcikAdres;
        else faturaListesiDuzenle.push({etiket:"Fatura Adresi", adres:yeniAcikAdres});
      }
      var teslimatListesiDuzenle = musteriAdresListesiGetir(guncelListe[hedefIdx], "teslimat");
      if(yeniTeslimatAdresi){
        if(teslimatListesiDuzenle.length) teslimatListesiDuzenle[0].adres = yeniTeslimatAdresi;
        else teslimatListesiDuzenle.push({etiket:"Teslimat Adresi", adres:yeniTeslimatAdresi});
      }
    }
    musteriListesi = guncelListe;
    lsSet("weicon_musteriler", musteriListesi);
    if(window.fbSet){
      musteriListesiGuvenliKaydet(musteriListesi[hedefIdx]).then(function(){
        showToast("✅ Müşteri güncellendi ve Firebase'e yazıldı ✓");
      }).catch(function(e){
        showToast("⚠️ Firebase HATASI: "+((e&&(e.code||e.message))||"bilinmiyor"), 6000);
      });
    } else {
      showToast("✅ Müşteri güncellendi (yerel)!");
    }
    musteriListesiniRenderEt();
    // Düzenlenen bilgi (özellikle şehir) İstatistik sayfasındaki Son İşlemler
    // tablosuna da hemen yansısın — Firebase'in geri dönüşünü beklemeden.
    if(activeCurrentPage===6 && typeof sonIslemleriRenderEt==="function") sonIslemleriRenderEt();
  }

  if(window.fbGet){
    window.fbGet("musteriler").then(function(data){
      var guncelListe = data ? (Array.isArray(data)?data:Object.values(data)) : [];
      guncellemeyiUygula(guncelListe);
    }).catch(function(){
      guncellemeyiUygula(lsGet("weicon_musteriler",[]));
    });
  } else {
    guncellemeyiUygula(lsGet("weicon_musteriler",[]));
  }
}

function musteriDuzenleKapat(){
  document.getElementById("musteriDuzenleModal").style.display="none";
}

function musteriSil(idx){
  var silinenMusteri = musteriListesi[idx] ? JSON.parse(JSON.stringify(musteriListesi[idx])) : null;
  musteriListesi.splice(idx,1);
  lsSet("weicon_musteriler", musteriListesi);
  musteriListesiniRenderEt();
  if(window.fbSet && silinenMusteri && silinenMusteri.id){
    musteriListesiGuvenliKaydet(null, silinenMusteri.id).then(function(){
      showUndoToast("Müşteri silindi: "+silinenMusteri.ad, function(){ musteriGeriYukle(silinenMusteri); });
    }).catch(function(e){
      showToast("⚠️ Firebase HATASI: "+((e&&(e.code||e.message))||"bilinmiyor"), 6000);
    });
  } else if(silinenMusteri){
    showUndoToast("Müşteri silindi: "+silinenMusteri.ad, function(){ musteriGeriYukle(silinenMusteri); });
  } else {
    showToast("🗑 Müşteri silindi (yerel)!");
  }
}

function musteriGeriYukle(musteri){
  musteriListesi = lsGet("weicon_musteriler",[]);
  musteriListesi.push(musteri);
  lsSet("weicon_musteriler", musteriListesi);
  if(window.fbSet){
    musteriListesiGuvenliKaydet(musteri).then(function(){
      showToast("↩️ Müşteri geri yüklendi.");
      musteriListesiniRenderEt();
    });
  } else {
    showToast("↩️ Müşteri geri yüklendi.");
    musteriListesiniRenderEt();
  }
}

function musteriSecimiTemizle(){
  seciliMusteri = null;
  localStorage.removeItem("weicon_secili_musteri");
  musteriSeritiGuncelle();
}

function musteriBilgiKutusu(deger, etiket){
  return "<div style='flex:1;min-width:0;'>"
    +"<label style='font-size:16px;font-weight:bold;color:#6a3fa0;display:block;margin-bottom:3px;'>"+safeText(etiket)+"</label>"
    +"<div style='background:#fff;border:1px solid #d8c8ec;border-radius:6px;padding:10px 8px;font-size:22px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>"+safeText(deger||"-")+"</div>"
    +"</div>";
}

function musteriSeritiGuncelle(){
  var alan = document.getElementById("iletisimMusteriAlani");
  if(!alan) return;
  if(seciliMusteri && seciliMusteri.ad){
    var gosterilecekAd = safeText(seciliMusteri.ad) + (seciliYetkililer.length ? " - "+safeText(seciliYetkililer.map(function(k){return k.isim;}).join(", ")) : "");
    alan.innerHTML =
      "<div style='border:1px solid #ddd;border-radius:12px;padding:2px 16px;'>"
      +"<div style='display:flex;justify-content:space-between;align-items:center;padding:16px 2px;flex-wrap:wrap;gap:8px;'>"
      +"<div onclick=\"document.getElementById('musteriBilgiPopupModal').style.display='flex';\" style='font-size:38px;font-weight:800;color:#222;cursor:pointer;'>👤 "+gosterilecekAd+"</div>"
      +"<button onclick=\"musteriSecimBaslat(5)\" style='background:none;border:none;color:#999;font-size:30px;font-weight:700;cursor:pointer;white-space:nowrap;'>Değiştir ›</button>"
      +"</div></div>";
  } else {
    alan.innerHTML =
      "<div style='border:1px dashed #bbb;border-radius:12px;padding:18px;text-align:center;'>"
      +"<div style='font-size:44px;'>👤</div>"
      +"<div style='font-size:28px;color:#666;margin:8px 0 12px;'><b>Henüz müşteri seçilmedi.</b><br>Mail/WhatsApp göndermeden önce müşteriyi seçin.</div>"
      +"<button onclick=\"musteriSecimBaslat(5)\" style='background:#003a70;color:#fff;border:none;border-radius:8px;padding:22px 20px;font-size:28px;font-weight:800;width:100%;cursor:pointer;'>🔍 Müşteri Seç</button>"
      +"</div>";
  }
}

function islemleriTemizle(){
  if(!confirm("İşlemin tamamı iptal edilecek:\n• Seçilen müşteri\n• Sepetteki ürünler\n• Hesaplanan/gönderilen ürünler\n\nDevam etmek istiyor musunuz?")) return;
  basket = [];
  hareketListesi = [];
  aktarilanUrun = null;
  seciliMusteri = null;
  secilenMod = null;
  seciliYetkililer = [];
  localStorage.removeItem("weicon_secili_yetkililer");
  localStorage.removeItem("weicon_secili_yetkili");
  seciliFaturaAdresi = null;
  localStorage.removeItem("weicon_secili_fatura");
  seciliTeslimatAdresi = null;
  localStorage.removeItem("weicon_secili_teslimat");
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
  if(typeof renderBasket==="function") renderBasket();
  if(typeof renderHareket==="function") renderHareket();
  musteriSeritiGuncelle();
  if(typeof generateCommunicationData==="function") generateCommunicationData();
  showToast("✓ İşlem tamamen iptal edildi, temiz sayfa açıldı!");
  document.getElementById("hesaplaPopupModal").style.display="none";
  switchTab(8);
}

var musteriSecimHedefSayfa = null;

function anaMenudenZiyaretEkleBaslat(){
  var now = new Date();
  ziyaretTakvimYil = now.getFullYear();
  ziyaretTakvimAy = now.getMonth();
  ziyaretEklenecekTs = now.getTime();
  showToast("Bu ziyareti hangi müşteri için ekleyeceğinizi seçin.", 4000);
  musteriSecimBaslat("ziyaretEkleGun");
}
