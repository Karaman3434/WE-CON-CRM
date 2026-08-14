# WE-CON-CRM Business JavaScript Map

Generated from the largest remaining inline application script on `project-context`.

- Script size: **41,339 bytes**
- Function declarations found: **40**

## Comment/section markers

| Line | Section marker |
|---:|---|
| 9 | Kart/tabela fotoğrafını okuyan VE anomali analizini yapan ortak Cloudflare Worker adresi. |
| 10 | Kurulum rehberindeki adımları tamamladıktan sonra buraya kendi Worker URL'ini yapıştır. |
| 11 | Örn: "https://weicon-ai.SENIN-KULLANICI-ADIN.workers.dev" |
| 59 | Haftada bir, uygulama açıldığında sessizce (kullanıcıyı rahatsız etmeden) |
| 60 | Firebase Storage'a otomatik yedek alır. Elle indirilen yedeğin yerini tutmaz, |
| 61 | ek bir güvenlik ağıdır — "yanlışlıkla bir şey sildim" durumunda geri dönüş sağlar. |
| 109 | R003.2 State Manager |
| 124 | R003.3 Performance |
| 140 | KİLİT: Bugünün araç KM kaydı girilmeden, KM sayfası ve giriş/kilit ekranları |
| 141 | DIŞINDA hiçbir tıklama işlev görmesin. switchTab() zaten programatik geçişleri |
| 142 | KM sayfasına yönlendiriyor; bu dinleyici switchTab'e uğramayan doğrudan popup/ |
| 143 | fonksiyon çağıran tuşları (Hızlı Hesapla, Yeni Müşteri, Menü içi kısayollar vb.) yakalar. |
| 156 | Tüm popup'ları (id'si "Modal" ile biten div'ler) otomatik izler ve her açılışını |
| 157 | KRONOLOJİK SIRAYLA modalYigini listesine ekler. "Geri" tuşu bu geçmişi adım adım |
| 158 | geri sararak önceki adımı olduğu gibi tekrar görünür kılar. Bir popup kendi Kapat |
| 159 | tuşuyla (Geri'ye uğramadan) kapatılırsa, yığının tepesindeyse oradan da düşürülür — |
| 160 | aksi halde çok sonra alakasız bir ekrandayken Geri o eski popup'ı canlandırabilirdi. |
| 171 | Bu popup kapatıldı. "Geri" tuşuyla kapatıldıysa geriGit() zaten kendi |
| 172 | popladığı için burada yığının tepesi artık bu id'yle eşleşmez (ardışık |
| 173 | aynı id yığına asla eklenmediğinden). Ama kullanıcı bu popup'ı KENDİ Kapat |
| 174 | tuşuyla (Geri'ye hiç uğramadan) kapattıysa, o popup hâlâ yığının tepesinde |
| 175 | durur — bu durumda onu da yığından düşürüyoruz ki "Geri" tuşu çok sonra, |
| 176 | alakasız bir ekrandayken bu kapatılmış popup'ı tekrar canlandırmasın. |
| 184 | Tarih göster |
| 193 | Bugünün araç KM kaydı girilip girilmediğini (kilit kontrolü için) önce yerel |
| 194 | önbellekten anında oku — Firebase senkronizasyonu biraz sonra bunu tazeleyecek. |
| 211 | Kur otomatik güncelleme |
| 213 | Eski kayıtlara (kod alanı olmayan) geriye dönük benzersiz kod atama — bir kereye mahsus |
| 216 | Firebase hazır olunca müşteri ve arşiv verilerini çek |
| 219 | Müşteri listesi - gerçek zamanlı dinle, tüm cihazlar anında güncellenir |
| 228 | Müşteri verisi (dolayısıyla şehir bilgisi) güncellenince Son İşlemler |
| 229 | tablosundaki şehir sütunu da tazelensin — önceden bu eksikti, bu yüzden |
| 230 | tablo müşteri listesi henüz gelmeden çizildiyse şehir hep "-" kalıyordu. |
| 233 | Arşiv - gerçek zamanlı dinle |
| 249 | Araç KM kaydı - gerçek zamanlı dinle (kilit kontrolü bu veriye bakıyor) |
| 252 | GÜVENLİK AĞI: Sunucudan gelen veri, bu cihazda (telefonda) hâlihazırda |
| 253 | bilinen günlerden BELİRGİN ŞEKİLDE AZ ise (örn. sunucu boş/eksik bir |
| 254 | anlık görüntü döndürdüyse), bunu ŞÜPHELİ sayıp kabul ETMİYORUZ — |
| 255 | telefondaki bilinen veriyi koruyoruz. Bu, geçmişte yaşanan "sunucudan |
| 256 | gelen eksik veri, telefondaki sağlam geçmişin üzerine yazıldı" türü bir |
| 257 | kaybı BİR DAHA yaşamamak için eklendi. Normal küçük farklar (1-2 gün) |
| 258 | sorun değil, sadece büyük/ani düşüşler reddediliyor. |
| 273 | Kur - gerçek zamanlı dinle, bir cihazda değişen kur tüm cihazlara anında yansır |
| 325 | ============================================================ |
| 333 | Zaten varsa başa taşı |
| 336 | Son 10 aramayı tut |
| 341 | "En Çok Aranan Ürünler" tablosu için sıklık sayacı (küçük/büyük harf duyarsız) |
| 372 | HİT ÜRÜNLER — tüm SİPARİŞ kayıtlarından ürünlerin toplam satılan adedini hesaplayıp |
| 373 | en çok satılandan aza doğru sıralar. |
| 390 | Hit Ürünler listesinden bir ürüne dokununca — Hesapla ekranını açmadan |
| 391 | doğrudan sepete ekler, popup açık kalır (art arda birden fazla ürün eklenebilsin). |
| 434 | EN ÇOK ARANAN — arama kutusuna yazılan terimlerin sıklığını gösterir. |
| 461 | SON KULLANILAN ÜRÜNLER (en son sepete eklenen 20 ürün, tekrar tıklayınca direkt sepete eklenir) |
| 502 | ============================================================ |
| 513 | Sepetteki tüm ürünleri topluİskonto ile hareket listesine ekle |
| 527 | Zaten hareketListesinde varsa güncelle |
| 546 | Tüm sepet toplu olarak işlendiği için sepeti temizle |
| 564 | İki cihaz aynı anda FARKLI müşterileri düzenlerse/silerse birbirinin |
| 565 | değişikliğini kaybetmesin diye: Firebase'e yazmadan hemen önce sunucudaki |
| 566 | EN GÜNCEL listeyi çekip, sadece BU işlemin değişikliğini (eklenen/güncellenen |
| 567 | bir müşteri ve/veya silinen bir müşteri ID'si) o güncel listenin içine |
| 568 | uygulayıp öyle yazıyoruz. Eskiden bu cihazdaki (bayat olabilecek) local |
| 569 | musteriListesi komple üzerine yazılıyordu ve diğer cihazın az önce yaptığı |
| 570 | değişiklik sessizce kaybolabiliyordu. |
| 594 | Sunucudan taze veri çekilemezse (yetki/ağ hatası vb.), işlemi tamamen |
| 595 | kaybetmemek için kuyruğa alıyoruz — bir sonraki senkronda güvenli |
| 596 | birleştirme ile tekrar denenecek (komple liste ile üzerine yazmıyoruz). |
| 629 | Şehirleri topla |
| 705 | ============================================================ |
| 706 | KARTTAN/TABELADAN DOLDUR — fotoğrafı Cloud Function'a gönderir, |
| 707 | dönen bilgileri Yeni Müşteri formuna doldurur. Otomatik kaydetmez, |
| 708 | kullanıcı kontrol edip kendisi "KAYDET"e basar. |
| 709 | ============================================================ |
| 730 | Genel amaçlı: bir dosyayı Cloud Function'a gönderip AI ile okunan bilgileri döndürür. |
| 731 | hedef: "firma" \| "yetkiliIletisim" \| "teslimatAdresi" — sunucu tarafında isteme metnini yönlendirmek için. |
| 740 | Fotoğrafı (hangi formatta gelirse gelsin — HEIC, WEBP, vs.) her zaman JPEG'e |
| 741 | çevirerek gönderiyoruz; Anthropic API sadece jpeg/png/gif/webp kabul ediyor. |
| 757 | basariCB, anlamlı bir veri bulunamadıysa false döndürebilir — bu durumda |
| 758 | otomatik "başarılı" mesajı yerine uyarı gösteriyoruz (alanlar boşken bile |
| 759 | yanlışlıkla "✓ Bilgiler dolduruldu" denmesin diye). |
| 764 | basariCB, sadece bazı alanların bulunduğunu belirtmek için özel bir mesaj döndürmüş |
| 765 | (ör. saat bulundu ama tarih fotoğrafta görünmüyordu) — genel mesaj yerine bunu göster. |
| 781 | Herhangi bir görsel dosyasını (HEIC/HEIF, WEBP, PNG, vs.) canvas üzerinden |
| 782 | JPEG'e çevirip base64 olarak döndürür. Böylece Anthropic API'nin kabul |
| 783 | etmediği formatlarda (özellikle iPhone/bazı Android HEIC fotoğrafları) hata alınmaz. |
| 784 | Tarayıcı görseli çözemezse (ör. desteklenmeyen HEIC varyantı), sessizce |
| 785 | orijinal dosyayı olduğu gibi göndermeye düşer — tamamen durup hata vermek yerine. |
| 849 | "Yetkili İletişim Bilgileri" alanını fotoğraf/ekran görüntüsünden doldurur (Telefon + E-posta + varsa isim) |
| 868 | Teslimat Adresi alanını fotoğraf/ekran görüntüsünden doldurur |
| 894 | ============================================================ |

## Function index

| Line | Function |
|---:|---|
| 18 | `veriYonetimiPopupAc` |
| 22 | `tumVeriyiYedekle` |
| 44 | `yedekHatirlaticiKontrolEt` |
| 62 | `otomatikYedekKontrolEt` |
| 90 | `kdvOraniDegistir` |
| 116 | `validateText` |
| 125 | `debounce` |
| 217 | `firebasdenYukle` |
| 296 | `showToast` |
| 303 | `showUndoToast` |
| 318 | `gizleUndoToast` |
| 330 | `aramaGecmisiKaydet` |
| 350 | `aramaGecmisiniGoster` |
| 367 | `aramaSecGeçmis` |
| 374 | `hitUrunleriHesapla` |
| 392 | `hitUrundenSepeteEkle` |
| 408 | `hitUrunlerAc` |
| 435 | `enCokAranakHesapla` |
| 440 | `enCokAranakAc` |
| 462 | `sonKullanilanKaydet` |
| 471 | `sonKullanilanUrunleriGoster` |
| 495 | `sonKullanilanUrunSecildi` |
| 505 | `topluIskontoUygula` |
| 560 | `musteriListesiniKaydet` |
| 571 | `musteriListesiGuvenliKaydet` |
| 608 | `musteriHepsiniGoster` |
| 626 | `sehirFiltreGoster` |
| 649 | `sehireGoreFiltrele` |
| 659 | `musteriPanelAc` |
| 684 | `turkceBaslikDuzeni` |
| 692 | `yetkiliMetniIletisimeCevir` |
| 710 | `kartFotoAlaniniTemizle` |
| 715 | `kartFotoDurumGoster` |
| 732 | `kartFotoGonder` |
| 786 | `kartFotoJpegeDonustur` |
| 830 | `kartFotoAlaniDoldur` |
| 840 | `kartFotoSecildi` |
| 850 | `yetkiliIletisimFotoSecildi` |
| 869 | `teslimatAdresiFotoSecildi` |
| 880 | `kartFotoAlanDoldurTumu` |

## Refactor rule

Use this map to identify cohesive modules. Do not extract a function solely because it is nearby another function; inspect its callers, shared globals, Firebase/localStorage usage, and DOM dependencies first.
