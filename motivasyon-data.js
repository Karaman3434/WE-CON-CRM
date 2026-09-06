// motivasyon-data.js
// ==========================================================================
// Ana Sayfa'daki dinamik karşılama/motivasyon alanı için söz havuzu ve
// zamanlama mantığı. KURAL (06.09.2026):
//   - 06:00–20:00 arası HER 2 SAATTE BİR söz değişir (7 dilim: 06-08, 08-10,
//     10-12, 12-14, 14-16, 16-18, 18-20).
//   - 20:00–06:00 arası (gece) söz SABİT kalır, hiç değişmez.
//   - Aynı dilimde sayfa kaç kez yenilenirse yenilensin aynı söz gösterilir
//     (deterministik — rastgele değil).
//   - Gün değiştikçe söz havuzunda ilerlenir, böylece art arda günlerde aynı
//     dilimde hep aynı söz tekrar etmez.
// Bu dosya SADECE veri ve hesaplama içerir; DOM'a yazma işi home-render.js'de.
// ==========================================================================

var MOTIVASYON_SOZLERI = [
  "Başarı, her gün küçük iyi kararların üst üste eklenmesidir.",
  "Bugün attığın küçük adım, yarının büyük farkıdır.",
  "Disiplin, hedefle sen arandaki köprüdür.",
  "İyi bir insan olmak, kimse görmediğinde de doğru olanı yapmaktır.",
  "Zorluklar seni değil, tepkilerin seni tanımlar.",
  "Vazgeçmek istediğin an, genellikle başarıya en yakın olduğun andır.",
  "Karakterin, kimse bakmadığında ne yaptığındır.",
  "Küçük adımlar, büyük sonuçlar doğurur.",
  "Bugünkü çabanın karşılığını yarın alırsın.",
  "En büyük rakibin dündü, bugün onu geçmelisin.",
  "Alçakgönüllülük, gerçek gücün en sessiz halidir.",
  "Emek, şansın buluştuğu yerdir.",
  "Bir müşteriye güven vermek, bin reklamdan değerlidir.",
  "Dürüstlük, en kısa yoldur.",
  "Sabır, acı ama meyvesi tatlıdır.",
  "Her hayır, seni bir sonraki evete hazırlar.",
  "Kaliteli iş, sessizce kendini savunur.",
  "İyilik yaptığını unut, iyilik seni hatırlar.",
  "Bugün öğrendiğin şey, yarın kazandıracağın şeydir.",
  "Güven inşa etmek yıllar, yıkmak bir an sürer.",
  "Planın yoksa, başkasının planının bir parçası olursun.",
  "Yorgunluk geçicidir, pes etmenin sonucu kalıcıdır.",
  "Kendine karşı dürüst olmayan, kimseye karşı dürüst olamaz.",
  "Bir işi iyi yapmak, onu hızlı yapmaktan daha değerlidir.",
  "Başarı bir yarış değil, süreklilik meselesidir.",
  "Bugün ektiğin özen, yarının hasadıdır.",
  "En iyi yatırım, kendi disiplinine yaptığındır.",
  "Zor günler, güçlü insanlar yetiştirir.",
  "Saygı, kazanılır; talep edilmez.",
  "Bir söz verdiysen, güneş doğsa da batsa da tut.",
  "Küçük işleri özenle yapan, büyük işlere layık olur.",
  "Gerçek başarı, kimsenin görmediği çabadadır.",
  "Bugün yorulmazsan, yarın koşamazsın.",
  "İyi niyet, doğru işle buluşunca güç olur.",
  "Bir insanın değeri, zor zamanlarda ortaya çıkar.",
  "Emin adımlarla yürüyen, geç de olsa varır.",
  "Kazanmak isteyen, önce kaybetmeyi göze alır.",
  "Bugünün işini yarına bırakma, yarının kendi yükü olacak.",
  "Doğruluk, en uzun ömürlü itibardır.",
  "Her müşteri, bir güven hikâyesinin başlangıcıdır.",
  "Kendine söz verdiklerini tut, başkalarına verdiklerin de kolaylaşır.",
  "Sabreden, sonunda muradına erer.",
  "Gerçek liderlik, örnek olmaktan geçer.",
  "Bugün gösterdiğin özen, yarının referansıdır.",
  "Az ama öz konuş, çok ve düzgün çalış.",
  "Bir hata seni bitirmez; hatadan ders çıkarmamak bitirir.",
  "Emek veren, er ya da geç hak ettiğini bulur.",
  "İnsanlara değer verirsen, değerin sende kalıcı olur.",
  "Bugünkü terin, yarının gururu olacak.",
  "İyi bir gün, iyi bir niyetle başlar.",
  "Kararlılık, yeteneğin önüne geçer.",
  "Yardım ettiğin kişi seni unutmaz, ama sen unutursan yardım eksik kalır.",
  "En kalıcı reklam, memnun bıraktığın müşteridir.",
  "Kendini geliştirmeyi bırakan, yerinde sayar.",
  "Zorluk anında sakin kalmak, en büyük güçtür.",
  "Bugün bir adım at, yarın koşmana gerek kalmasın.",
  "Vicdanınla barışık olan, gece rahat uyur.",
  "Emeğinin karşılığını beklemeden ver, gerisi zamanla gelir.",
  "Az konuşan, çok iş yapan güvenilir olur.",
  "Bir gülümseme, bazen en iyi satış kapanışıdır.",
  "Kendine saygı duyan, başkasına da saygı duyar.",
  "Hedefsiz çalışmak, pusulasız denize açılmaktır.",
  "Bugün kurduğun disiplin, yarının özgürlüğüdür.",
  "İyi niyetle başlayan iş, hayırla biter.",
  "Sözünün eri olmak, en büyük sermayedir.",
  "Emek veren toprak bile karşılıksız bırakmaz.",
  "Bugün bir kapı kapandıysa, yarın için hazırlan.",
  "Gerçek başarı, başkalarının da başarmasına yardım etmektir.",
  "Kaliteden ödün vermeyen, uzun vadede kazanır.",
  "Bir işi yarım bırakmak, hiç başlamamaktan daha ağırdır.",
  "İyi insan olmak, kolay olanı değil doğru olanı seçmektir.",
  "Bugünkü sabrın, yarının huzurudur.",
  "En güçlü pazarlama, güvenilir bir isimdir.",
  "Kendine dürüst ol, gerisi kendiliğinden düzelir.",
  "Bir müşteriyi kazanmak zordur, kaybetmek bir andır.",
  "Emek her zaman iz bırakır, çabuk olmasa da.",
  "Bugün öğrendiğin bir şey, yarının avantajı olur.",
  "Alçakgönüllü kal, başarı seni bulsun.",
  "Zorluklardan kaçan, büyümekten de kaçmış olur.",
  "İyi bir isim, en değerli mirastır.",
  "Bugün gösterdiğin sabır, yarının meyvesidir.",
  "Kararlı adımlar, kararsız koşulardan daha ileri gider.",
  "Emeğine güvenen, sonucundan korkmaz.",
  "Bir günü boşa geçirmek, bir fırsatı kaçırmaktır.",
  "İyi niyet, doğru emekle buluşunca sonuç verir.",
  "Kendi standardını yüksek tut, başkası düşürmesin.",
  "Bugün attığın doğru adım, yarının güveni olur.",
  "En büyük başarı, dün olduğundan daha iyi olmaktır.",
  "Vicdanlı çalışan, uzun vadede hep kazanır.",
  "Bir söz, bir imzadan daha ağır olabilir.",
  "Emek veren yorulur ama pişman olmaz.",
  "Bugünün zorluğu, yarının tecrübesidir.",
  "İyi bir insan, kazandığında değil kaybettiğinde belli olur.",
  "Kaliteli iş, zamanla kendini kanıtlar.",
  "Bugün bir kişiye iyilik et, yarın sana bin kapı açılsın.",
  "Sabırlı olan, sonunda hep kazanır.",
  "Emeğini küçümseme, her damla ter bir tuğladır.",
  "Bir işi severek yapan, yorulduğunu unutur.",
  "İyi niyetle atılan adım, hep bir yere varır.",
  "Kendine inanmayan, başkasına da inandıramaz.",
  "Bugün gösterdiğin özveri, yarının başarısıdır.",
  "En kalıcı zafer, karakterini koruyarak kazanılandır.",
  "Vaktinde verilen söz, geç kalan yardımdan değerlidir.",
  "Emek her zaman bir gün karşılığını bulur.",
  "Bir gülümseme, bir günü değiştirebilir.",
  "İyi insan olmak, güç değil tercih meselesidir.",
  "Kendine güven, ama çalışmayı bırakma.",
  "Bugün ektiğin, yarın biçeceğindir.",
  "En büyük yatırım, güvenilir bir itibardır.",
  "Sabreden derviş muradına ermiş.",
  "Emeğini gösteren, sözünü de kanıtlamış olur.",
  "Bir işi yarım yapmaktansa, hiç yapma.",
  "İyi niyet, kalıcı başarının temel taşıdır.",
  "Kendi yolunda ilerleyen, başkasıyla yarışmaz.",
  "Bugün verdiğin emek, yarının rahatlığıdır."
];

function motivasyonSelamlamaGetir(saat){
  if(saat >= 5 && saat < 12) return "Günaydın";
  if(saat >= 12 && saat < 18) return "İyi günler";
  if(saat >= 18 && saat < 24) return "İyi akşamlar";
  return "İyi geceler";
}

// 06:00-20:00 arası 2 saatlik 7 dilim (0..6); 20:00-06:00 arası tek sabit
// dilim (7) — gece boyunca söz değişmez.
function motivasyonDilimIndeksi(saat){
  if(saat >= 6 && saat < 20) return Math.floor((saat - 6) / 2);
  return 7;
}

function motivasyonSozunuGetir(simdi){
  var saat = simdi.getHours();
  var dilim = motivasyonDilimIndeksi(saat);
  // Gün bazlı ofset: her gün havuzda bir miktar ilerleriz ki aynı dilimde
  // ardışık günlerde hep aynı söz çıkmasın (deterministik, rastgele değil).
  var gunSirasi = Math.floor(simdi.getTime() / 86400000);
  var indeks = (gunSirasi * 8 + dilim) % MOTIVASYON_SOZLERI.length;
  return MOTIVASYON_SOZLERI[indeks];
}
