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
  var sayi = gorevListesi.filter(function(g){ return g.musteriAd
