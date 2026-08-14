# WE-CON-CRM Business JavaScript Map

Generated from the largest remaining inline application script on `project-context`.

- Script size: **96,498 bytes**
- Function declarations found: **108**

## Comment/section markers

| Line | Section marker |
|---:|---|
| 2 | --- Müşteri kalıcı ID sistemi ------------------------------------------- |
| 3 | Firma adı yerine kalıcı bir ID: isim değişse/iki firma aynı adı taşısa bile |
| 4 | kayıtlar birbirine karışmaz. Eski kayıtlarda id yoksa burada otomatik |
| 5 | tamamlanır (geriye dönük uyumlu — mevcut veriler kaybolmaz). |
| 6 | Görünür, sıralı müşteri kodu üretir (M-0001, M-0002, ...). Mevcut listedeki |
| 7 | en yüksek numaranın bir fazlasını verir. |
| 24 | Eskiden rastgele (CUS-...) üretilmiş kodlar varsa, görünür/sıralı yeni |
| 25 | biçime (M-0001) geçiriyoruz — en eski müşteri (listenin sonunda, çünkü |
| 26 | yeni müşteriler unshift ile başa ekleniyor) en küçük numarayı alsın diye |
| 27 | ters sırada numaralandırıyoruz. |
| 39 | -------------------------------------------------------------------------- |
| 41 | --- Mükerrer müşteri tespiti ------------------------------------------- |
| 94 | -------------------------------------------------------------------------- |
| 96 | --- Müşteri Birleştir ------------------------------------------------ |
| 161 | 1) İletişim kişilerini birleştir (aynı isimde tekrar eklenmesin) |
| 170 | 2) Temas (ziyaret) geçmişini birleştir |
| 179 | 3) Görevleri taşı |
| 183 | 4) Arşivdeki sipariş/teklif/proforma/numune kayıtlarını taşı — ID varsa ID |
| 184 | ile, yoksa (eski kayıtlar) isimle eşleştirilir; hepsi ana kaydın ID+adına taşınır. |
| 196 | 5) Diğer müşteri kaydını sil |
| 208 | -------------------------------------------------------------------------- |
| 234 | Kaydedildikten sonra doğrudan müşteri kartını aç — siz kapatana kadar ekranda kalır. |
| 239 | Önce Firebase'deki EN GÜNCEL listeyi çek, sonra üzerine ekle |
| 240 | (başka bir cihazın az önce eklediği müşteriyi silmemek için) |
| 294 | Sadece kullanıcı 🔄 Kur butonuna bastığında çalışır |
| 341 | Kayıtlı kur varsa hemen göster (Firebase'den gelen gerçek zamanlı veri az sonra bunun üzerine yazacak) |
| 346 | NOT: Artık her cihaz kendi başına otomatik kur ÇEKMİYOR ve Firebase'e YAZMIYOR. |
| 347 | Kur artık SADECE Firebase'den okunuyor (fbDinle ile) ve sadece 🔄 butonuna |
| 348 | basıldığında güncelleniyor. Böylece cihazlar birbirinin kurunu ezmiyor, |
| 349 | hepsi her zaman aynı, tek/ortak kuru gösteriyor. |
| 420 | Doğrudan İşlemler menüsü yerine önce "Müşteri Kartı / İşlemler" seçim ekranı açılır. |
| 428 | Müşterinin toplam işlem sayısı ve toplam € tutarını hesaplar (id varsa id ile, |
| 429 | yoksa isim ile eşleştirir — musteriIslemSayisiGetir ile aynı mantık). |
| 448 | "📇 MÜŞTERİ KARTI" — salt-okunur cari bilgiler (adres/vade/fatura/kargo/özet/son temas). |
| 483 | İLETİŞİM KİŞİLERİ — firmanın farklı departman/kişilerini yönetme |
| 531 | Temas Kaydı ekranından "kiminle görüştünüz?" için çağrılır |
| 546 | Müşteri kartından "Yetkili Kişi" seçmek için çağrılır — bu işlem/mail boyunca kullanılacak kişi |
| 550 | Eski "Yetkili" metin alanı doluysa ve İletişim Kişileri hiç eklenmemişse, otomatik ilk kişi olarak senkronize et |
| 596 | Varsayılan olarak "yeni kişi ekle" moduna sıfırla — yetkiliKisiDuzenleAc bu |
| 597 | çağrıdan HEMEN SONRA kendi düzenleme durumunu ayarlayıp üzerine yazıyor. |
| 722 | Kalıcı ID ile eşleştir (isim değişmiş/aynı isimde başka müşteri olsa bile şaşmaz). |
| 723 | ID yoksa (çok eski kayıt) isimle, o da olmazsa index'e düş. |
| 750 | Artık kişi eklendiğinde otomatik seçip işlemi kapatmıyoruz — kullanıcı |
| 751 | "Kişiler" listesine dönüyor, istediği kadar kişi daha ekleyebiliyor, |
| 752 | hangisini kullanmak istiyorsa ona dokunarak seçiyor. |
| 807 | BİLDİRİM SİSTEMİ — 15/30/33 günlük hatırlatma: açık (siparişe dönmemiş) NUMUNE/TEKLİF/PROFORMA'lar |
| 824 | ZİYARET HATIRLATMASI — 15+ gündür ziyaret edilmeyen firmalar |
| 841 | ============================================================ |
| 842 | GÖREV SİSTEMİ — müşteri kartından "Görev Gir" ile hatırlatma |
| 843 | tarih/saat + açıklama tanımlama, "Görevlerim" listesinden takip. |
| 844 | ============================================================ |
| 919 | haftalikAcikFaturaListesi'nin aksine durum atanmış kayıtları da döndürür (durum bilgisiyle birlikte) — |
| 920 | birleşik Görevlerim ekranında Tamamlanan/Kapanan sekmelerinde göstermek için gerekli. |
| 941 | haftalikAcikZiyaretListesi'nin aksine durum atanmış kayıtları da döndürür |
| 961 | Haftalık takip (teklif/numune/ziyaret) durumunu, Bekleyen/Tamamlanan/Kapanan kategorisine çevirir |
| 968 | "SON HAREKET" — bir müşteri için Temas geçmişi + Arşiv kayıtlarını (teklif/ |
| 969 | proforma/numune/sipariş) BİRLEŞTİRİP tarihe göre sıralar. Tamamen sistemden |
| 970 | otomatik çekilir, elle veri girilmez. |
| 1024 | Görevlerim'deki bir açık-süreç kartındaki "📅 SON HAREKET" etiketine dokununca açılır. |
| 1070 | ---- 1) Manuel görevler ---- |
| 1077 | ---- 2) Fiyat teklifi / Numune takibi ---- |
| 1085 | ---- 3) Ziyaret hatırlatmaları ---- |
| 1091 | ---- Tarih aralığı filtresi (kaydın oluşturulma/hedef tarihine göre) ---- |
| 1104 | ---- Özet satırı (filtre öncesi, seçili müşteri bazında) ---- |
| 1109 | ---- Aktif sekmeye göre filtrele ---- |
| 1165 | Müşteri adı + etiket birleşimini TEK SATIRDA tutmak için, metin uzunluğuna göre |
| 1166 | mümkün olan en büyük (ama taşırmayan) yazı boyutunu hesaplar. |
| 1177 | Fiyat Teklifi / Numune kartlarında tıklama, o işlemin kendisini (fatura önizlemesini) |
| 1178 | açar. Ziyaret hatırlatması gibi bir belgeye bağlı olmayan kartlarda ise müşteri kartı açılır. |
| 1196 | Kartın altındaki tek tıklanabilir "SON HAREKET" etiketi — o müşterinin en |
| 1197 | güncel (Temas geçmişi + Arşiv) hareketini özet gösterir, dokununca sonHareketAc |
| 1198 | ile tam kronolojik geçmiş popup'ı açılır. |
| 1234 | Müşteri kartındaki "Görev Gir" rozetini günceller (o müşterinin bekleyen görev sayısı) |
| 1245 | Zamanı gelmiş ve henüz tamamlanmamış görevleri döndürür (bildirim rozeti/listesi için) |
| 1252 | Süresi geçmiş görevler için: ilk hatırlatmadan itibaren 1 hafta boyunca |
| 1253 | 2 günde bir toast ile tekrar hatırlatır, 1 haftadan sonra sessizce listede kalır. |
| 1302 | Günde bir kez toast ile de hatırlat |
| 1395 | ============================================================ |
| 1396 | HAFTALIK TAKİP RAPORU — Ziyaret, Fiyat Teklifi ve Numune işlemleri için |
| 1397 | haftada bir (en az Pazartesi) hatırlatma. Kullanıcı bir kayda durum |
| 1398 | (Tamamlandı / İzleniyor / Sona Erdi / Kapat) verene kadar her hafta tekrar listelenir. |
| 1399 | Not: mevcut 15/30/33 günlük bildirim sisteminden (bildirimBanner) tamamen ayrı, yeni ve ek bir özelliktir. |
| 1400 | ============================================================ |
| 1418 | Not: eski tek-timestamp'lık "İzleniyor" sayaç fonksiyonu (haftalikIzlemeEkle) kaldırıldı; |
| 1419 | yerine not girişi de alan gorevTakipNotKaydet() fonksiyonu geldi. |
| 1421 | Açık (siparişe dönmemiş) TEKLİF veya NUMUNE kayıtlarının tamamını döndürür (PROFORMA dahil değil) |
| 1443 | 15+ gündür temas edilmemiş ve henüz durum verilmemiş ziyaret hatırlatmaları |
| 1468 | Uygulama açıldığında haftada bir kez (ilk açılışta, en az Pazartesi'den itibaren) otomatik kontrol |
| 1512 | ---- GÖREV TAKİP NOTU (👁 Takip butonu) ---- |
| 1513 | Basınca not girme ekranı açılır; kaydedilince hem o görevin kendi takip |
| 1514 | sayacına/geçmişine (izlemeLog) işlenir, hem de ilgili müşterinin kartındaki |
| 1515 | Temas geçmişine gerçek bir temas kaydı olarak düşer. Önceki notlar aynı |
| 1516 | ekranda listelenir; her biri düzenlenebilir veya silinebilir. |
| 1546 | Modal içindeki "Önceki Takip Notları" listesini (düzenle/sil butonlarıyla) çizer. |
| 1579 | Geçmiş listesinden bir notu düzenleme moduna alır: metni forma doldurur, |
| 1580 | "Kaydet" düğmesi artık yeni kayıt eklemek yerine bu notu günceller. |
| 1608 | Geçmişteki bir takip notunu tamamen kaldırır: hem görevin kendi |
| 1609 | takip sayacından/geçmişinden, hem de müşteri kartındaki Temas kaydından. |
| 1639 | DÜZENLEME MODU: yeni kayıt eklemek yerine mevcut notu günceller. |
| 1656 | YENİ NOT MODU |
| 1708 | Var olan bir takip temas kaydının notunu günceller (ts + tur:"takip" ile eşleştirilir). |
| 1709 | Kayıt bulunamazsa (örn. daha önce elle silinmişse) yeni bir kayıt olarak ekler. |
| 1745 | Bir takip temas kaydını müşteri kartından tamamen kaldırır (ts + tur:"takip" ile eşleştirilir). |
| 1784 | Artık ayrı bir popup değil — birleşik "Görevlerim" ekranını açar (Haftalık Takip Raporu bu ekrana taşındı) |
| 1790 | Bu müşterinin en son NUMUNE/TEKLİF/PROFORMA'sından sonra SİPARİŞ verilmemişse tam kaydı döndürür, yoksa null |
| 1832 | Açık süreci bir sonraki aşamaya taşır: NUMUNE→TEKLİF, TEKLİF→PROFORMA, PROFORMA→SİPARİŞ |
| 1854 | Müşteriyi aktif seç |
| 1861 | Sepeti/hareketi temizleyip önceki belgenin ürünlerini "hesaplanmış" olarak yükle |
| 1885 | Bir popup açıkken, o popup'a başka bir popup'tan (ör. Müşteri Kartı'ndan |
| 1886 | "İşlemler'e Git" ile) geçilmişse, "Kapat" tuşuna basınca en başa değil bir |
| 1887 | önceki popup'a dönülsün diye kullanılan tekil hafıza. Her açılışta bir |
| 1888 | sonraki popup için ayarlanır, kullanılınca (Kapat'ta) sıfırlanır — yani |
| 1889 | sadece TEK bir adım geri gider, çok seviyeli bir yığın değildir. |
| 1902 | Müşteri Kartı popup'ından "⚡ İşlemler'e Git" ile İşlemler menüsüne |
| 1903 | geçerken, dönüş adresini (oncekiPopupId) işaretler. |
| 1910 | Seçim ekranından ("Müşteri Kartı / İşlemler") doğrudan İşlemler'e geçerken |
| 1911 | de aynı şekilde dönüş adresini işaretler. |
| 1918 | Müşteri Kartı popup'ının kendi Kapat'ı — eğer seçim ekranından buraya |
| 1919 | gelinmişse (oncekiPopupId), bir önceki adıma (seçim ekranına) döner; |
| 1920 | değilse (doğrudan açılmışsa) normal şekilde kapatır. |

## Function index

| Line | Function |
|---:|---|
| 8 | `musteriSonrakiKoduBul` |
| 19 | `musteriIdUret` |
| 22 | `musteriIdEksikleriTamamla` |
| 42 | `turkceNormallestir` |
| 48 | `musteriAdiKelimelere` |
| 53 | `benzerMusteriBul` |
| 70 | `musteriKaydet` |
| 87 | `musteriMukerrerKapat` |
| 90 | `musteriMukerrerZorlaKaydet` |
| 97 | `musteriBirlestirAc` |
| 109 | `musteriBirlestirModalKapat` |
| 114 | `musteriBirlestirAramaRenderEt` |
| 140 | `musteriBirlestirHedefSec` |
| 150 | `musteriBirlestirOnayla` |
| 210 | `musteriKaydetGercek` |
| 222 | `kaydiTamamla` |
| 264 | `kurKaydetVeYayinla` |
| 277 | `kurGuncelle` |
| 293 | `kurGuncelleManuel` |
| 311 | `kurManuelGir` |
| 318 | `kurManuelKapat` |
| 322 | `kurManuelKaydet` |
| 333 | `anaKurDegerGuncelle` |
| 338 | `kurOtomatikKontrol` |
| 354 | `musteriIslemSayisiGetir` |
| 367 | `musteriKartAc` |
| 430 | `musteriIslemOzetiGetir` |
| 449 | `musteriCariKartAc` |
| 490 | `iletisimGonderKontrolluBaslat` |
| 506 | `iletisimGonderimYap` |
| 512 | `musteriIletisimAc` |
| 530 | `musteriIletisimKisiSecmeyeAc` |
| 545 | `musteriIletisimYetkiliSecmeyeAc` |
| 569 | `musteriIletisimKapat` |
| 587 | `musteriIletisimTabSec` |
| 614 | `musteriIletisimListesiRenderEt` |
| 653 | `ziyaretKisiSec` |
| 681 | `yetkiliKisiDuzenleAc` |
| 696 | `musteriIletisimEkle` |
| 721 | `guncellemeyiUygula` |
| 768 | `musteriIletisimSil` |
| 775 | `guncellemeyiUygula` |
| 808 | `bildirimleriHesapla` |
| 825 | `ziyaretHatirlatmalariHesapla` |
| 845 | `gorevleriYukle` |
| 861 | `gorevleriKaydet` |
| 866 | `gorevTanimlaAc` |
| 879 | `gorevKaydet` |
| 907 | `gorevFiltreSec` |
| 921 | `haftalikTumKayitlariGetir` |
| 942 | `haftalikTumZiyaretleriGetir` |
| 962 | `haftalikDurumKategorisi` |
| 971 | `sonHareketGecmisiGetir` |
| 1005 | `sonHareketZamanCizelgesiHTML` |
| 1026 | `sonHareketAc` |
| 1036 | `sonHareketNotEkleAc` |
| 1041 | `sonHareketTamamlandiIsaretle` |
| 1047 | `gorevListesiAcKarttan` |
| 1052 | `gorevListesiAc` |
| 1060 | `gorevSimdiZamanDamgasi` |
| 1065 | `gorevListesiRenderEt` |
| 1135 | `gorevKartHTML` |
| 1167 | `tekSatirFontHesapla` |
| 1174 | `haftalikKartHTML` |
| 1199 | `sonHareketEtiketiHTML` |
| 1214 | `gorevTamamlandiToggle` |
| 1225 | `gorevSil` |
| 1235 | `gorevBadgeGuncelle` |
| 1246 | `gorevBildirimleriHesapla` |
| 1254 | `gorevHatirlatmaKontrolEt` |
| 1284 | `bildirimBannerGuncelle` |
| 1311 | `bildirimListesiAc` |
| 1373 | `bildirimdenIlerlet` |
| 1381 | `bildirimdenSil` |
| 1402 | `isoHaftaAnahtari` |
| 1411 | `haftalikDurumHaritasiGetir` |
| 1412 | `haftalikDurumKaydet` |
| 1422 | `haftalikAcikFaturaListesi` |
| 1444 | `haftalikAcikZiyaretListesi` |
| 1464 | `haftalikTakipToplamSayisi` |
| 1469 | `haftalikTakipOtomatikKontrol` |
| 1479 | `haftalikDurumButonuHTML` |
| 1504 | `haftalikKartDurumSec` |
| 1519 | `gorevTakipEsc` |
| 1521 | `gorevTakipAc` |
| 1541 | `gorevTakipKapat` |
| 1547 | `gorevTakipListesiRenderEt` |
| 1581 | `gorevTakipNotuDuzenle` |
| 1597 | `gorevTakipDuzenlemeIptal` |
| 1610 | `gorevTakipNotuSil` |
| 1632 | `gorevTakipNotKaydet` |
| 1675 | `gorevTakipMusteriTemasEkle` |
| 1678 | `guncellemeyiUygula` |
| 1710 | `gorevTakipMusteriTemasGuncelle` |
| 1713 | `guncellemeyiUygula` |
| 1746 | `gorevTakipMusteriTemasSil` |
| 1747 | `guncellemeyiUygula` |
| 1785 | `haftalikTakipRaporuAc` |
| 1791 | `musteriAcikSurecKaydiGetir` |
| 1813 | `musteriAcikSurecMesajGetir` |
| 1820 | `musteriAcikSurecUyariGoster` |
| 1835 | `acikSureciIlerlet` |
| 1849 | `ilerletAsamaSecildi` |
| 1878 | `ilerletAsamaSecModalKapat` |
| 1892 | `musteriKartKapat` |
| 1904 | `musteriKartModalaGitCariKarttan` |
| 1912 | `musteriKartModalaGitSecimden` |
| 1921 | `musteriCariKartKapat` |

## Refactor rule

Use this map to identify cohesive modules. Do not extract a function solely because it is nearby another function; inspect its callers, shared globals, Firebase/localStorage usage, and DOM dependencies first.
