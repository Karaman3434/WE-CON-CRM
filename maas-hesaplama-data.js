/*
  maas-hesaplama-data.js
  =======================
  NET MAAŞ + NET PRİM tahmini hesaplayıcı — 2026 Türkiye bordro kurallarına
  göre KÜMÜLATİF vergi matrahı yöntemiyle çalışır (her ayın vergisi, o aya
  kadar yılbaşından beri BİRİKEN toplam matraha göre belirlenir — sadece o
  ayın kendi ücretine göre değil). Bu yüzden "Ağustos"u hesaplamak için
  Ocak'tan Ağustos'a kadar TÜM ayların brüt primini bilmek gerekir.

  Kaynaklar (Eylül 2026 itibarıyla resmi/güncel bilgiye dayanır):
   - Ücretliler için 2026 gelir vergisi dilimleri: 190.000 / 400.000 /
     1.500.000 / 5.300.000 TL sınırlarıyla %15 / %20 / %27 / %35 / %40.
   - 2026 brüt asgari ücret: 33.030 TL.
   - Asgari ücrete isabet eden GELİR VERGİSİ istisnası: aylık SABİT
     4.211,33 TL (dilim ne olursa olsun, hesaplanan vergiyi aşamaz).
   - Asgari ücrete isabet eden DAMGA VERGİSİ istisnası: aylık SABİT 250,70 TL.
   - SGK işçi payı %14, İşsizlik işçi payı %1, Damga vergisi oranı %0,759.

  ÖNEMLİ — bu bir TAHMİN aracıdır: resmi bordro yazılımları (özellikle bir
  dilim geçiş ayında) küçük farklı sonuçlar üretebilir. Kesin rakam için her
  zaman gerçek bordroyla karşılaştırılmalı; bu değerler mali müşavir görüşü
  yerine geçmez.
*/

var MaasHesaplamaData = (function(){

  var SGK_ORANI = 0.14;
  var ISSIZLIK_ORANI = 0.01;
  var DAMGA_ORANI = 0.00759;
  var AU_GELIR_VERGISI_ISTISNASI = 5615.10; // aylık, sabit — Abdullah'ın 08/2026 bordro pusulasındaki gerçek "Asgari Ücret Gelir Vergisi" rakamı esas alındı (genel GİB kaynaklarındaki 4.211,33 TL değil — WEICON'un bordro sistemi bu rakamı kullanıyor).
  var AU_DAMGA_VERGISI_ISTISNASI = 250.70;  // aylık, sabit (2026)

  // Ücretliler için 2026 kümülatif yıllık matrah dilimleri.
  var DILIMLER = [
    {ust: 190000,        oran: 0.15},
    {ust: 400000,        oran: 0.20},
    {ust: 1500000,       oran: 0.27},
    {ust: 5300000,       oran: 0.35},
    {ust: Infinity,      oran: 0.40}
  ];

  // Verilen kümülatif matrah üzerinden TOPLAM kademeli vergiyi (yılbaşından
  // bu matraha kadar biriken vergi) hesaplar.
  function kademeliVergi(matrah){
    if(!matrah || matrah <= 0) return 0;
    var vergi = 0, altSinir = 0;
    for(var i=0; i<DILIMLER.length; i++){
      var ustSinir = DILIMLER[i].ust;
      var buDilimMatrah = Math.min(matrah, ustSinir) - altSinir;
      if(buDilimMatrah > 0) vergi += buDilimMatrah * DILIMLER[i].oran;
      if(matrah <= ustSinir) break;
      altSinir = ustSinir;
    }
    return vergi;
  }

  function sgkIssizlikSonrasi(brut){
    return brut * (1 - SGK_ORANI - ISSIZLIK_ORANI);
  }

  // ayNo: 1-12 (hesaplanacak ay). brutSabitAylik: her ay aynı varsayılan
  // brüt sabit maaş. brutPrimDizisi: {1:.., 2:.., ..., 12:..} o yılın OCAK'tan
  // itibaren her ayının brüt primi (Ödenebilir Komisyon'dan).
  // "Kalibrasyon": Ocak'tan itibaren tahmini toplamak yerine, gerçek
  // bordrodan alınan kümülatif matrahı doğrudan kullanmak için opsiyonel
  // override. Verilirse, TOPLAM (sabit+prim) akışının "ÖNCE" (bu ay hariç,
  // yılbaşından bir önceki aya kadarki) kümülatif matrahı olarak KULLANILIR
  // — Ocak'tan itibaren tahmini toplama devre dışı kalır. "SADECE SABİT"
  // taban çizgisi (netSabitMaas) hâlâ eski yöntemle hesaplanır (bu bir
  // basitleştirme — kalibrasyon esas olarak TOPLAM/gerçek net rakamı
  // doğrulamak için var).
  function ayHesapla(ayNo, brutSabitAylik, brutPrimDizisi, kumulatifMatrahOnceOverride){
    brutSabitAylik = parseFloat(brutSabitAylik) || 0;
    brutPrimDizisi = brutPrimDizisi || {};

    // --- Kümülatif toplamlar: bu ay dahil (Şimdi) ve bir önceki ay sonuna
    //     kadar (Önce) — ikisinin vergi farkı = bu ayın marjinal vergisi.
    var kumBrutToplamSimdi = 0, kumBrutToplamOnce = 0;
    var kumBrutSadeceSabitSimdi = 0, kumBrutSadeceSabitOnce = 0;
    for(var a=1; a<=ayNo; a++){
      var prim = parseFloat(brutPrimDizisi[a]) || 0;
      kumBrutToplamSimdi += brutSabitAylik + prim;
      kumBrutSadeceSabitSimdi += brutSabitAylik;
      if(a < ayNo){
        kumBrutToplamOnce += brutSabitAylik + prim;
        kumBrutSadeceSabitOnce += brutSabitAylik;
      }
    }

    function marjinalGelirVergisi(kumSimdi, kumOnce){
      var vSimdi = kademeliVergi(sgkIssizlikSonrasi(kumSimdi));
      var vOnce = kademeliVergi(sgkIssizlikSonrasi(kumOnce));
      var istisnasiz = Math.max(0, vSimdi - vOnce);
      var istisna = Math.min(AU_GELIR_VERGISI_ISTISNASI, istisnasiz);
      return Math.max(0, istisnasiz - istisna);
    }

    var buAyPrim = parseFloat(brutPrimDizisi[ayNo]) || 0;
    var buAyBrutToplam = brutSabitAylik + buAyPrim;

    // ---- TOPLAM akış (sabit + prim birlikte, gerçek bordro mantığı) ----
    // "ÖNCE" (bu ay hariç) kümülatif matrah: kalibrasyon varsa ondan, yoksa
    // Ocak'tan tahmini toplamdan. "ŞİMDİ" (bu ay dahil) HER ZAMAN "önce" +
    // bu ayın kendi katkısı olarak kurulur — override sadece "önce"ye değil
    // "şimdi"ye de tutarlı şekilde yansısın diye.
    var kumMatrahOnceToplam = kumulatifMatrahOnceOverride!=null ? kumulatifMatrahOnceOverride : sgkIssizlikSonrasi(kumBrutToplamOnce);
    var kumMatrahSimdiToplam = kumMatrahOnceToplam + sgkIssizlikSonrasi(buAyBrutToplam);
    var vSimdiToplam = kademeliVergi(kumMatrahSimdiToplam);
    var vOnceToplam = kademeliVergi(kumMatrahOnceToplam);
    var gvToplamIstisnasiz = Math.max(0, vSimdiToplam - vOnceToplam);
    var gvToplamIstisna = Math.min(AU_GELIR_VERGISI_ISTISNASI, gvToplamIstisnasiz);
    var gvToplam = Math.max(0, gvToplamIstisnasiz - gvToplamIstisna);
    var dvToplamIstisnasiz = buAyBrutToplam * DAMGA_ORANI;
    var dvToplam = Math.max(0, dvToplamIstisnasiz - AU_DAMGA_VERGISI_ISTISNASI);
    var netToplam = buAyBrutToplam - (buAyBrutToplam*SGK_ORANI) - (buAyBrutToplam*ISSIZLIK_ORANI) - gvToplam - dvToplam;

    // ---- SADECE SABİT akış (prim hiç olmasaydı ne olurdu — taban çizgisi) ----
    var gvSabit = marjinalGelirVergisi(kumBrutSadeceSabitSimdi, kumBrutSadeceSabitOnce);
    var dvSabitIstisnasiz = brutSabitAylik * DAMGA_ORANI;
    var dvSabit = Math.max(0, dvSabitIstisnasiz - AU_DAMGA_VERGISI_ISTISNASI);
    var netSabitMaas = brutSabitAylik - (brutSabitAylik*SGK_ORANI) - (brutSabitAylik*ISSIZLIK_ORANI) - gvSabit - dvSabit;

    // Prim'in marjinal katkısı: toplam net - sadece-sabit net.
    var netPrim = netToplam - netSabitMaas;

    return {
      brutSabitAylik: brutSabitAylik,
      brutPrim: buAyPrim,
      brutToplam: buAyBrutToplam,
      netSabitMaas: netSabitMaas,
      netPrim: netPrim,
      netToplam: netToplam,
      // Bu ay dahil, SGK/işsizlik SONRASI kümülatif vergi matrahı — bir
      // sonraki ayın kalibrasyon referansı olarak kullanılır (bkz.
      // maas-hesaplama-render.js: kapatınca kalibrasyon otomatik ilerler).
      kumulatifMatrahSimdi: kumMatrahSimdiToplam
    };
  }

  return {
    ayHesapla: ayHesapla,
    kademeliVergi: kademeliVergi,
    AU_GELIR_VERGISI_ISTISNASI: AU_GELIR_VERGISI_ISTISNASI,
    AU_DAMGA_VERGISI_ISTISNASI: AU_DAMGA_VERGISI_ISTISNASI
  };

})();
