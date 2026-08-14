# WE-CON-CRM Business JavaScript Map

Generated from the largest remaining inline application script on `project-context`.

- Script size: **465,598 bytes**
- Function declarations found: **466**

## Comment/section markers

| Line | Section marker |
|---:|---|
| 8 | Kart/tabela fotoğrafını okuyan VE anomali analizini yapan ortak Cloudflare Worker adresi. |
| 9 | Kurulum rehberindeki adımları tamamladıktan sonra buraya kendi Worker URL'ini yapıştır. |
| 10 | Örn: "https://weicon-ai.SENIN-KULLANICI-ADIN.workers.dev" |
| 58 | Haftada bir, uygulama açıldığında sessizce (kullanıcıyı rahatsız etmeden) |
| 59 | Firebase Storage'a otomatik yedek alır. Elle indirilen yedeğin yerini tutmaz, |
| 60 | ek bir güvenlik ağıdır — "yanlışlıkla bir şey sildim" durumunda geri dönüş sağlar. |
| 108 | R003.2 State Manager |
| 123 | R003.3 Performance |
| 139 | KİLİT: Bugünün araç KM kaydı girilmeden, KM sayfası ve giriş/kilit ekranları |
| 140 | DIŞINDA hiçbir tıklama işlev görmesin. switchTab() zaten programatik geçişleri |
| 141 | KM sayfasına yönlendiriyor; bu dinleyici switchTab'e uğramayan doğrudan popup/ |
| 142 | fonksiyon çağıran tuşları (Hızlı Hesapla, Yeni Müşteri, Menü içi kısayollar vb.) yakalar. |
| 155 | Tüm popup'ları (id'si "Modal" ile biten div'ler) otomatik izler ve her açılışını |
| 156 | KRONOLOJİK SIRAYLA modalYigini listesine ekler. "Geri" tuşu bu geçmişi adım adım |
| 157 | geri sararak önceki adımı olduğu gibi tekrar görünür kılar. Bir popup kendi Kapat |
| 158 | tuşuyla (Geri'ye uğramadan) kapatılırsa, yığının tepesindeyse oradan da düşürülür — |
| 159 | aksi halde çok sonra alakasız bir ekrandayken Geri o eski popup'ı canlandırabilirdi. |
| 170 | Bu popup kapatıldı. "Geri" tuşuyla kapatıldıysa geriGit() zaten kendi |
| 171 | popladığı için burada yığının tepesi artık bu id'yle eşleşmez (ardışık |
| 172 | aynı id yığına asla eklenmediğinden). Ama kullanıcı bu popup'ı KENDİ Kapat |
| 173 | tuşuyla (Geri'ye hiç uğramadan) kapattıysa, o popup hâlâ yığının tepesinde |
| 174 | durur — bu durumda onu da yığından düşürüyoruz ki "Geri" tuşu çok sonra, |
| 175 | alakasız bir ekrandayken bu kapatılmış popup'ı tekrar canlandırmasın. |
| 183 | Tarih göster |
| 192 | Bugünün araç KM kaydı girilip girilmediğini (kilit kontrolü için) önce yerel |
| 193 | önbellekten anında oku — Firebase senkronizasyonu biraz sonra bunu tazeleyecek. |
| 210 | Kur otomatik güncelleme |
| 212 | Eski kayıtlara (kod alanı olmayan) geriye dönük benzersiz kod atama — bir kereye mahsus |
| 215 | Firebase hazır olunca müşteri ve arşiv verilerini çek |
| 218 | Müşteri listesi - gerçek zamanlı dinle, tüm cihazlar anında güncellenir |
| 227 | Müşteri verisi (dolayısıyla şehir bilgisi) güncellenince Son İşlemler |
| 228 | tablosundaki şehir sütunu da tazelensin — önceden bu eksikti, bu yüzden |
| 229 | tablo müşteri listesi henüz gelmeden çizildiyse şehir hep "-" kalıyordu. |
| 232 | Arşiv - gerçek zamanlı dinle |
| 248 | Araç KM kaydı - gerçek zamanlı dinle (kilit kontrolü bu veriye bakıyor) |
| 251 | GÜVENLİK AĞI: Sunucudan gelen veri, bu cihazda (telefonda) hâlihazırda |
| 252 | bilinen günlerden BELİRGİN ŞEKİLDE AZ ise (örn. sunucu boş/eksik bir |
| 253 | anlık görüntü döndürdüyse), bunu ŞÜPHELİ sayıp kabul ETMİYORUZ — |
| 254 | telefondaki bilinen veriyi koruyoruz. Bu, geçmişte yaşanan "sunucudan |
| 255 | gelen eksik veri, telefondaki sağlam geçmişin üzerine yazıldı" türü bir |
| 256 | kaybı BİR DAHA yaşamamak için eklendi. Normal küçük farklar (1-2 gün) |
| 257 | sorun değil, sadece büyük/ani düşüşler reddediliyor. |
| 272 | Kur - gerçek zamanlı dinle, bir cihazda değişen kur tüm cihazlara anında yansır |
| 324 | ============================================================ |
| 332 | Zaten varsa başa taşı |
| 335 | Son 10 aramayı tut |
| 340 | "En Çok Aranan Ürünler" tablosu için sıklık sayacı (küçük/büyük harf duyarsız) |
| 371 | HİT ÜRÜNLER — tüm SİPARİŞ kayıtlarından ürünlerin toplam satılan adedini hesaplayıp |
| 372 | en çok satılandan aza doğru sıralar. |
| 389 | Hit Ürünler listesinden bir ürüne dokununca — Hesapla ekranını açmadan |
| 390 | doğrudan sepete ekler, popup açık kalır (art arda birden fazla ürün eklenebilsin). |
| 433 | EN ÇOK ARANAN — arama kutusuna yazılan terimlerin sıklığını gösterir. |
| 460 | SON KULLANILAN ÜRÜNLER (en son sepete eklenen 20 ürün, tekrar tıklayınca direkt sepete eklenir) |
| 501 | ============================================================ |
| 512 | Sepetteki tüm ürünleri topluİskonto ile hareket listesine ekle |
| 526 | Zaten hareketListesinde varsa güncelle |
| 545 | Tüm sepet toplu olarak işlendiği için sepeti temizle |
| 563 | İki cihaz aynı anda FARKLI müşterileri düzenlerse/silerse birbirinin |
| 564 | değişikliğini kaybetmesin diye: Firebase'e yazmadan hemen önce sunucudaki |
| 565 | EN GÜNCEL listeyi çekip, sadece BU işlemin değişikliğini (eklenen/güncellenen |
| 566 | bir müşteri ve/veya silinen bir müşteri ID'si) o güncel listenin içine |
| 567 | uygulayıp öyle yazıyoruz. Eskiden bu cihazdaki (bayat olabilecek) local |
| 568 | musteriListesi komple üzerine yazılıyordu ve diğer cihazın az önce yaptığı |
| 569 | değişiklik sessizce kaybolabiliyordu. |
| 593 | Sunucudan taze veri çekilemezse (yetki/ağ hatası vb.), işlemi tamamen |
| 594 | kaybetmemek için kuyruğa alıyoruz — bir sonraki senkronda güvenli |
| 595 | birleştirme ile tekrar denenecek (komple liste ile üzerine yazmıyoruz). |
| 628 | Şehirleri topla |
| 704 | ============================================================ |
| 705 | KARTTAN/TABELADAN DOLDUR — fotoğrafı Cloud Function'a gönderir, |
| 706 | dönen bilgileri Yeni Müşteri formuna doldurur. Otomatik kaydetmez, |
| 707 | kullanıcı kontrol edip kendisi "KAYDET"e basar. |
| 708 | ============================================================ |
| 729 | Genel amaçlı: bir dosyayı Cloud Function'a gönderip AI ile okunan bilgileri döndürür. |
| 730 | hedef: "firma" \| "yetkiliIletisim" \| "teslimatAdresi" — sunucu tarafında isteme metnini yönlendirmek için. |
| 739 | Fotoğrafı (hangi formatta gelirse gelsin — HEIC, WEBP, vs.) her zaman JPEG'e |
| 740 | çevirerek gönderiyoruz; Anthropic API sadece jpeg/png/gif/webp kabul ediyor. |
| 756 | basariCB, anlamlı bir veri bulunamadıysa false döndürebilir — bu durumda |
| 757 | otomatik "başarılı" mesajı yerine uyarı gösteriyoruz (alanlar boşken bile |
| 758 | yanlışlıkla "✓ Bilgiler dolduruldu" denmesin diye). |
| 763 | basariCB, sadece bazı alanların bulunduğunu belirtmek için özel bir mesaj döndürmüş |
| 764 | (ör. saat bulundu ama tarih fotoğrafta görünmüyordu) — genel mesaj yerine bunu göster. |
| 780 | Herhangi bir görsel dosyasını (HEIC/HEIF, WEBP, PNG, vs.) canvas üzerinden |
| 781 | JPEG'e çevirip base64 olarak döndürür. Böylece Anthropic API'nin kabul |
| 782 | etmediği formatlarda (özellikle iPhone/bazı Android HEIC fotoğrafları) hata alınmaz. |
| 783 | Tarayıcı görseli çözemezse (ör. desteklenmeyen HEIC varyantı), sessizce |
| 784 | orijinal dosyayı olduğu gibi göndermeye düşer — tamamen durup hata vermek yerine. |
| 848 | "Yetkili İletişim Bilgileri" alanını fotoğraf/ekran görüntüsünden doldurur (Telefon + E-posta + varsa isim) |
| 867 | Teslimat Adresi alanını fotoğraf/ekran görüntüsünden doldurur |
| 893 | ============================================================ |
| 894 | YENİ ÜRÜN EKLE — stoğa yeni giren ama Ürün Bul listesinde henüz |
| 895 | olmayan tekil ürünleri, tüm listeyi değiştirmeden ekler. |
| 896 | ============================================================ |
| 922 | Aynı Berta+Abas kombinasyonu zaten listede varsa uyar (mükerrer kayıt önle) |
| 958 | --- Müşteri kalıcı ID sistemi ------------------------------------------- |
| 959 | Firma adı yerine kalıcı bir ID: isim değişse/iki firma aynı adı taşısa bile |
| 960 | kayıtlar birbirine karışmaz. Eski kayıtlarda id yoksa burada otomatik |
| 961 | tamamlanır (geriye dönük uyumlu — mevcut veriler kaybolmaz). |
| 962 | Görünür, sıralı müşteri kodu üretir (M-0001, M-0002, ...). Mevcut listedeki |
| 963 | en yüksek numaranın bir fazlasını verir. |
| 980 | Eskiden rastgele (CUS-...) üretilmiş kodlar varsa, görünür/sıralı yeni |
| 981 | biçime (M-0001) geçiriyoruz — en eski müşteri (listenin sonunda, çünkü |
| 982 | yeni müşteriler unshift ile başa ekleniyor) en küçük numarayı alsın diye |
| 983 | ters sırada numaralandırıyoruz. |
| 995 | -------------------------------------------------------------------------- |
| 997 | --- Mükerrer müşteri tespiti ------------------------------------------- |
| 1050 | -------------------------------------------------------------------------- |
| 1052 | --- Müşteri Birleştir ------------------------------------------------ |
| 1117 | 1) İletişim kişilerini birleştir (aynı isimde tekrar eklenmesin) |
| 1126 | 2) Temas (ziyaret) geçmişini birleştir |
| 1135 | 3) Görevleri taşı |
| 1139 | 4) Arşivdeki sipariş/teklif/proforma/numune kayıtlarını taşı — ID varsa ID |
| 1140 | ile, yoksa (eski kayıtlar) isimle eşleştirilir; hepsi ana kaydın ID+adına taşınır. |
| 1152 | 5) Diğer müşteri kaydını sil |
| 1164 | -------------------------------------------------------------------------- |
| 1190 | Kaydedildikten sonra doğrudan müşteri kartını aç — siz kapatana kadar ekranda kalır. |
| 1195 | Önce Firebase'deki EN GÜNCEL listeyi çek, sonra üzerine ekle |
| 1196 | (başka bir cihazın az önce eklediği müşteriyi silmemek için) |
| 1250 | Sadece kullanıcı 🔄 Kur butonuna bastığında çalışır |
| 1297 | Kayıtlı kur varsa hemen göster (Firebase'den gelen gerçek zamanlı veri az sonra bunun üzerine yazacak) |
| 1302 | NOT: Artık her cihaz kendi başına otomatik kur ÇEKMİYOR ve Firebase'e YAZMIYOR. |
| 1303 | Kur artık SADECE Firebase'den okunuyor (fbDinle ile) ve sadece 🔄 butonuna |
| 1304 | basıldığında güncelleniyor. Böylece cihazlar birbirinin kurunu ezmiyor, |
| 1305 | hepsi her zaman aynı, tek/ortak kuru gösteriyor. |
| 1376 | Doğrudan İşlemler menüsü yerine önce "Müşteri Kartı / İşlemler" seçim ekranı açılır. |
| 1384 | Müşterinin toplam işlem sayısı ve toplam € tutarını hesaplar (id varsa id ile, |
| 1385 | yoksa isim ile eşleştirir — musteriIslemSayisiGetir ile aynı mantık). |
| 1404 | "📇 MÜŞTERİ KARTI" — salt-okunur cari bilgiler (adres/vade/fatura/kargo/özet/son temas). |
| 1439 | İLETİŞİM KİŞİLERİ — firmanın farklı departman/kişilerini yönetme |
| 1487 | Temas Kaydı ekranından "kiminle görüştünüz?" için çağrılır |
| 1502 | Müşteri kartından "Yetkili Kişi" seçmek için çağrılır — bu işlem/mail boyunca kullanılacak kişi |
| 1506 | Eski "Yetkili" metin alanı doluysa ve İletişim Kişileri hiç eklenmemişse, otomatik ilk kişi olarak senkronize et |
| 1552 | Varsayılan olarak "yeni kişi ekle" moduna sıfırla — yetkiliKisiDuzenleAc bu |
| 1553 | çağrıdan HEMEN SONRA kendi düzenleme durumunu ayarlayıp üzerine yazıyor. |
| 1678 | Kalıcı ID ile eşleştir (isim değişmiş/aynı isimde başka müşteri olsa bile şaşmaz). |
| 1679 | ID yoksa (çok eski kayıt) isimle, o da olmazsa index'e düş. |
| 1706 | Artık kişi eklendiğinde otomatik seçip işlemi kapatmıyoruz — kullanıcı |
| 1707 | "Kişiler" listesine dönüyor, istediği kadar kişi daha ekleyebiliyor, |
| 1708 | hangisini kullanmak istiyorsa ona dokunarak seçiyor. |
| 1763 | BİLDİRİM SİSTEMİ — 15/30/33 günlük hatırlatma: açık (siparişe dönmemiş) NUMUNE/TEKLİF/PROFORMA'lar |
| 1780 | ZİYARET HATIRLATMASI — 15+ gündür ziyaret edilmeyen firmalar |
| 1797 | ============================================================ |
| 1798 | GÖREV SİSTEMİ — müşteri kartından "Görev Gir" ile hatırlatma |
| 1799 | tarih/saat + açıklama tanımlama, "Görevlerim" listesinden takip. |
| 1800 | ============================================================ |
| 1875 | haftalikAcikFaturaListesi'nin aksine durum atanmış kayıtları da döndürür (durum bilgisiyle birlikte) — |
| 1876 | birleşik Görevlerim ekranında Tamamlanan/Kapanan sekmelerinde göstermek için gerekli. |
| 1897 | haftalikAcikZiyaretListesi'nin aksine durum atanmış kayıtları da döndürür |
| 1917 | Haftalık takip (teklif/numune/ziyaret) durumunu, Bekleyen/Tamamlanan/Kapanan kategorisine çevirir |
| 1924 | "SON HAREKET" — bir müşteri için Temas geçmişi + Arşiv kayıtlarını (teklif/ |
| 1925 | proforma/numune/sipariş) BİRLEŞTİRİP tarihe göre sıralar. Tamamen sistemden |
| 1926 | otomatik çekilir, elle veri girilmez. |
| 1980 | Görevlerim'deki bir açık-süreç kartındaki "📅 SON HAREKET" etiketine dokununca açılır. |
| 2026 | ---- 1) Manuel görevler ---- |
| 2033 | ---- 2) Fiyat teklifi / Numune takibi ---- |
| 2041 | ---- 3) Ziyaret hatırlatmaları ---- |
| 2047 | ---- Tarih aralığı filtresi (kaydın oluşturulma/hedef tarihine göre) ---- |
| 2060 | ---- Özet satırı (filtre öncesi, seçili müşteri bazında) ---- |
| 2065 | ---- Aktif sekmeye göre filtrele ---- |
| 2121 | Müşteri adı + etiket birleşimini TEK SATIRDA tutmak için, metin uzunluğuna göre |
| 2122 | mümkün olan en büyük (ama taşırmayan) yazı boyutunu hesaplar. |
| 2133 | Fiyat Teklifi / Numune kartlarında tıklama, o işlemin kendisini (fatura önizlemesini) |
| 2134 | açar. Ziyaret hatırlatması gibi bir belgeye bağlı olmayan kartlarda ise müşteri kartı açılır. |
| 2152 | Kartın altındaki tek tıklanabilir "SON HAREKET" etiketi — o müşterinin en |
| 2153 | güncel (Temas geçmişi + Arşiv) hareketini özet gösterir, dokununca sonHareketAc |
| 2154 | ile tam kronolojik geçmiş popup'ı açılır. |
| 2190 | Müşteri kartındaki "Görev Gir" rozetini günceller (o müşterinin bekleyen görev sayısı) |
| 2201 | Zamanı gelmiş ve henüz tamamlanmamış görevleri döndürür (bildirim rozeti/listesi için) |
| 2208 | Süresi geçmiş görevler için: ilk hatırlatmadan itibaren 1 hafta boyunca |
| 2209 | 2 günde bir toast ile tekrar hatırlatır, 1 haftadan sonra sessizce listede kalır. |
| 2258 | Günde bir kez toast ile de hatırlat |
| 2351 | ============================================================ |
| 2352 | HAFTALIK TAKİP RAPORU — Ziyaret, Fiyat Teklifi ve Numune işlemleri için |
| 2353 | haftada bir (en az Pazartesi) hatırlatma. Kullanıcı bir kayda durum |
| 2354 | (Tamamlandı / İzleniyor / Sona Erdi / Kapat) verene kadar her hafta tekrar listelenir. |
| 2355 | Not: mevcut 15/30/33 günlük bildirim sisteminden (bildirimBanner) tamamen ayrı, yeni ve ek bir özelliktir. |
| 2356 | ============================================================ |
| 2374 | Not: eski tek-timestamp'lık "İzleniyor" sayaç fonksiyonu (haftalikIzlemeEkle) kaldırıldı; |
| 2375 | yerine not girişi de alan gorevTakipNotKaydet() fonksiyonu geldi. |
| 2377 | Açık (siparişe dönmemiş) TEKLİF veya NUMUNE kayıtlarının tamamını döndürür (PROFORMA dahil değil) |
| 2399 | 15+ gündür temas edilmemiş ve henüz durum verilmemiş ziyaret hatırlatmaları |
| 2424 | Uygulama açıldığında haftada bir kez (ilk açılışta, en az Pazartesi'den itibaren) otomatik kontrol |
| 2468 | ---- GÖREV TAKİP NOTU (👁 Takip butonu) ---- |
| 2469 | Basınca not girme ekranı açılır; kaydedilince hem o görevin kendi takip |
| 2470 | sayacına/geçmişine (izlemeLog) işlenir, hem de ilgili müşterinin kartındaki |
| 2471 | Temas geçmişine gerçek bir temas kaydı olarak düşer. Önceki notlar aynı |
| 2472 | ekranda listelenir; her biri düzenlenebilir veya silinebilir. |
| 2502 | Modal içindeki "Önceki Takip Notları" listesini (düzenle/sil butonlarıyla) çizer. |
| 2535 | Geçmiş listesinden bir notu düzenleme moduna alır: metni forma doldurur, |
| 2536 | "Kaydet" düğmesi artık yeni kayıt eklemek yerine bu notu günceller. |
| 2564 | Geçmişteki bir takip notunu tamamen kaldırır: hem görevin kendi |
| 2565 | takip sayacından/geçmişinden, hem de müşteri kartındaki Temas kaydından. |
| 2595 | DÜZENLEME MODU: yeni kayıt eklemek yerine mevcut notu günceller. |
| 2612 | YENİ NOT MODU |
| 2664 | Var olan bir takip temas kaydının notunu günceller (ts + tur:"takip" ile eşleştirilir). |
| 2665 | Kayıt bulunamazsa (örn. daha önce elle silinmişse) yeni bir kayıt olarak ekler. |
| 2701 | Bir takip temas kaydını müşteri kartından tamamen kaldırır (ts + tur:"takip" ile eşleştirilir). |
| 2740 | Artık ayrı bir popup değil — birleşik "Görevlerim" ekranını açar (Haftalık Takip Raporu bu ekrana taşındı) |
| 2746 | Bu müşterinin en son NUMUNE/TEKLİF/PROFORMA'sından sonra SİPARİŞ verilmemişse tam kaydı döndürür, yoksa null |
| 2788 | Açık süreci bir sonraki aşamaya taşır: NUMUNE→TEKLİF, TEKLİF→PROFORMA, PROFORMA→SİPARİŞ |
| 2810 | Müşteriyi aktif seç |
| 2817 | Sepeti/hareketi temizleyip önceki belgenin ürünlerini "hesaplanmış" olarak yükle |
| 2841 | Bir popup açıkken, o popup'a başka bir popup'tan (ör. Müşteri Kartı'ndan |
| 2842 | "İşlemler'e Git" ile) geçilmişse, "Kapat" tuşuna basınca en başa değil bir |
| 2843 | önceki popup'a dönülsün diye kullanılan tekil hafıza. Her açılışta bir |
| 2844 | sonraki popup için ayarlanır, kullanılınca (Kapat'ta) sıfırlanır — yani |
| 2845 | sadece TEK bir adım geri gider, çok seviyeli bir yığın değildir. |
| 2858 | Müşteri Kartı popup'ından "⚡ İşlemler'e Git" ile İşlemler menüsüne |
| 2859 | geçerken, dönüş adresini (oncekiPopupId) işaretler. |
| 2866 | Seçim ekranından ("Müşteri Kartı / İşlemler") doğrudan İşlemler'e geçerken |
| 2867 | de aynı şekilde dönüş adresini işaretler. |
| 2874 | Müşteri Kartı popup'ının kendi Kapat'ı — eğer seçim ekranından buraya |
| 2875 | gelinmişse (oncekiPopupId), bir önceki adıma (seçim ekranına) döner; |
| 2876 | değilse (doğrudan açılmışsa) normal şekilde kapatır. |
| 3040 | Mail/Mesaj (WhatsApp) temaslarında: yazılan metni ilgili uygulamada açar, |
| 3041 | ardından temas kaydını otomatik olarak (tarih/saatiyle) kaydeder. |
| 3055 | Not alanı boşsa, gönderilen metni otomatik olarak nota da yazalım (kayıt için) |
| 3058 | Tarih/saati "şimdi" olarak güncelle, sonra otomatik kaydet |
| 3097 | SÜREÇ TAKİBİ — aynı müşteri+ürün için NUMUNE→TEKLİF→PROFORMA→SİPARİŞ zincirini manuel bağlama |
| 3109 | secililer: [{tip, ts}, ...] |
| 3180 | Depolanan "23 Tem 2026 - 14:24" formatını "23.07.26 / 14-24" (2 satır) olarak kısaltır — sadece görünüm için, veri değişmez |
| 3188 | Bir kaydın "🔄 REVİZE" etiketine dokununca, o kaydın revize geçmişini |
| 3189 | (her revizeden önceki fiyat/ürün sayısı anlık görüntüsü) listeler. |
| 3233 | Uzun basma tetiklendiyse, aynı dokunuşun sonundaki normal "click"i yut (satır popup'ı açılmasın) |
| 3238 | Ürün ismine 600ms uzun basınca, ürünü doğrudan WEICON Türkiye'nin kendi site içi |
| 3239 | arama motorunda arar (weicon.com.tr/search?search=...). |
| 3240 | Abas kodu WEICON'un kendi ürün numarasıyla birebir aynı olduğu için (doğrulandı), |
| 3241 | varsa Abas koduyla aranır — bu kesin/birebir eşleşme sağlar. Abas yoksa isimle aranır. |
| 3329 | Alt kısımdaki tekli Revize butonu, listede en üstteki (en güncel) işlemi hedef alır |
| 3350 | Son ürün de silindiyse, artık boş kalan kaydın tamamını kaldır |
| 3618 | Önce kalıcı ID ile eşleştir, olmazsa isimle (başka cihaz sıralamayı değiştirmiş olabilir), o da olmazsa index'e düş |
| 3644 | Düzenlenen bilgi (özellikle şehir) İstatistik sayfasındaki Son İşlemler |
| 3645 | tablosuna da hemen yansısın — Firebase'in geri dönüşünü beklemeden. |
| 3919 | Son 10 işlem listesini de güncelle (müşteri filtresinden bağımsız) |
| 3934 | Arama yapılırken tüm eşleşen sonuçlar gösterilir, en son görüntülenen en üstte |
| 3939 | "Tüm Müşteriler" butonu ile açılan mod: hiçbir sınır yok, alfabetik sırayla tüm müşteriler listelenir (kaydırılabilir). |
| 3943 | Arama yokken sadece en son kayıt edilen 12 müşteri gösterilir (yeni kayıtlar listenin başına eklenir). |
| 3944 | Diğer tüm müşteriler sistemde kayıtlı kalmaya devam eder, sadece bu görünümde listelenmez. |
| 3957 | Ziyaret uyarısı |
| 4012 | Bu ay "kacan" (durum='kacan') olarak işaretlenmiş tüm kayıtların (tip fark |
| 4013 | etmeksizin — SİPARİŞ/TEKLİF/PROFORMA/NUMUNE) toplam kaybedilen tutarı. |
| 4045 | Arşiv kaydı, oluşturulduğu andaki müşteri ismini SABİT bir metin olarak saklar |
| 4046 | (kayit.musteri) — müşteri adı SONRADAN değiştirilirse/kısaltılırsa arşivdeki |
| 4047 | eski kayıtlar hâlâ ESKİ ismi gösterirdi. Şehir'de yaptığımız gibi, kaydın |
| 4048 | musteriId'si varsa GÜNCEL müşteri adını göstermek için bir harita kuruyoruz. |
| 4058 | "kacan" tüm türlerde olabilir, tip filtresi uygulanmaz |
| 4123 | Şehir hücresini "İlçe" (üst) / "İL" (alt, kalın) olarak iki satıra böler. |
| 4124 | Ham veri "ANKARA-Yenimahalle" gibi boşluksuz ve İL-önce sırayla kayıtlı |
| 4125 | olabiliyor — bu yüzden basit " - " ayırma yerine sehirFormatla ile aynı |
| 4126 | mantığı (TUM_ILLER listesinden hangi parça gerçek il, onu buluyoruz) kullanıp |
| 4127 | istenen sırada (önce ilçe, altta İL) gösteriyoruz. |
| 4143 | ÖNEMLİ: Sadece isme göre eşleştirme yapılırsa, bir müşterinin adı sonradan |
| 4144 | düzenlenip kısaltıldığında (örn. "Kozanoğlu Kozmaksan Hidrolik Pompa Ve Ara |
| 4145 | Sansıman..." → "Kozanoğlu Kozmaksan Hidrolik") arşivdeki eski kayıtlar hâlâ |
| 4146 | ESKİ ismi taşıdığı için eşleşme bozulur ve şehir "-" görünür. Bu yüzden önce |
| 4147 | müşteri ID'sine göre eşleştiriyoruz (ID isim değişse bile sabit kalır), |
| 4148 | sadece ID yoksa (çok eski kayıtlarda) isme düşüyoruz. |
| 4158 | BAĞLANTI TESPİTİ: aynı müşteri + en az bir ortak ürün (Berta kodu) paylaşan, bu kayıttan ÖNCEKİ bir kayıt var mı? |
| 4181 | İsim tam eşleşmedi (muhtemelen isim sonradan kısaltıldı/değiştirildi) — |
| 4182 | biri diğerinin başlangıcı mı diye kısmi eşleştirme dene, son çare. |
| 4215 | Artık her hücrenin etrafında renkli kutu değil — sadece satırın EN BAŞINDA |
| 4216 | (hareket/kod hücresinin sol kenarında) kalın, hareket türüne göre renkli |
| 4217 | tek bir çizgi var. Diğer hücreler ince, nötr gri çizgiyle ayrılıyor. |
| 4264 | Şu an hangi sayfada olduğumu gösteren şerit (Ana Sayfa'dayken zaten üstteki buton bunu gösterdiği için tekrar etmesin) |
| 4269 | Ana Sayfa'dayken bu şerit tamamen kaldırılır (sadece Ana Sayfa'ya özel): |
| 4270 | Geri \| Ana Sayfa (tam orta) \| Menü şeklinde 3 sütuna geçilir. |
| 4275 | Diğer tüm sayfalarda normal 4 eşit sütunlu düzen aynen çalışır. |
| 4282 | Sepet sayaçlarını yeniden doldur (dinamik olarak yeniden oluşturulduğu için) |
| 4302 | SAYFA GEÇMİŞİ — Geri tuşu için, hangi sayfalarda gezildiğini sırayla tutar |
| 4308 | Önce açık popup geçmişi var mı bak — varsa son adımı kapatıp bir önceki adımı |
| 4309 | (o an başka bir popup tarafından gizlenmiş olsa bile) olduğu gibi geri getirir. |
| 4350 | Extra action bar |
| 4403 | Önce localStorage'daki varsa göster (hız için) |
| 4408 | Firebase'den taze yükle + gerçek zamanlı dinle |
| 4450 | Basit şema kontrolü: ürün alanlarından hiç değilse biri her satırda olmalı |
| 4477 | Aynı dosyayı tekrar seçebilmek için sıfırla |
| 4486 | Kök dizinde eski ürün index'lerini bulup temizle, musteriler/arsiv'e dokunma |
| 4500 | Yeni ürünleri yaz |
| 4515 | Arama geçmişine kaydet |
| 4560 | ÖNEMLİ: id artık kataloğun benzersiz global index'inden üretiliyor (p+catalogIdx). |
| 4561 | Eskiden berta/abas kodu kullanılıyordu; katalogda mükerrer kod varsa farklı |
| 4562 | ürünler aynı id'yi paylaşıp sepette birbirinin yerine geçiyordu (toplu iskonto bug'ı). |
| 4583 | Zaten sepette — "EKLENDİ"ye tekrar dokunulunca seçim iptal olur, sepetten çıkar |
| 4595 | Arama kutusunu ve sonuç listesini sıfırla, bir sonraki ürünü hemen aramaya başlayabilsin |
| 4623 | Aynı ürün Hareket (Sepet) listesine de aktarılmışsa oradan da kaldır |
| 4634 | SEPET FİYAT GEÇMİŞİ UYARISI — sepetteki ürünlerden hangileri bu müşteriye daha önce satılmış/teklif edilmiş |
| 4678 | TABLO KAYDIRMA İKAZI — tablo yatayda sığmıyorsa sağda titreşen ok gösterir, sona kaydırılınca kaybolur |
| 4697 | Hareket listesinde henüz olmayan (bekleyen) sepet ürünlerini bul |
| 4718 | Önce HESAPLANDI (koyu yeşil) grup başlığı + satırlar |
| 4741 | Sonra HESAPLANACAK (sarı/bekleyen) grup başlığı + satırlar |
| 4836 | Mail/WhatsApp göndermeden, doğrudan arşive kaydetmek için — Gönder ile |
| 4837 | aynı ön kontrolleri (boş sepet, işlem türü seçilmedi, anomali) uygular. |
| 4857 | Kaydet öncesi son bir onay — yanlışlıkla tek dokunuşla kayıt gitmesin diye. |
| 4876 | ============================================================ |
| 4877 | ANOMALİ KONTROLÜ — Gönder'e basmadan önce kural tabanlı, anında, |
| 4878 | internetsiz kontrol: aşırı iskonto, zararına satış, son 7 günde |
| 4879 | aynı müşteriye aynı ürün tekrarı, alışılmadık yüksek adet. |
| 4880 | ============================================================ |
| 4956 | ============================================================ |
| 4957 | DERİN AI ANALİZİ — kural tabanlı kontrolün ötesinde, Gemini'ye |
| 4958 | "bu işlem ticari açıdan normal mi?" diye sorar. Sadece istenirse |
| 4959 | çalışır (otomatik değil), Cloudflare Worker kurulumu gerektirir. |
| 4960 | ============================================================ |
| 5016 | "🧹 Temizle" — Hesaplama ekranındaki tüm alanları ve aktarılan ürün bağını |
| 5017 | sıfırlar, böylece bir önceki ürünün liste/dip/iskonto/adet değerleri |
| 5018 | yanlışlıkla bir sonraki işleme karışmaz. |
| 5038 | HIZLI HESAPLA — müşteri/işlem türü seçmeden, direkt Hesapla ekranını açar; ürün arama o ekranın içinden yapılır |
| 5041 | SATIŞ MENÜSÜ — Müşteri / Ziyaret Takvimi / İstatistikler / Görevlerim tek buton altında |
| 5203 | Sepette bu ürünü gönderildi olarak işaretle |
| 5211 | Dip maliyet otomatik = liste × %36,35 |
| 5213 | Önceki üründen kalan iskonto oranı yeni ürüne sızmasın diye her yeni ürün aktarımında sıfırlanır. |
| 5240 | Otomatik dip maliyet = liste × %36,35 |
| 5247 | MÜŞTERİ BAZLI FİYAT GEÇMİŞİ — bu müşteriye bu ürün daha önce satılmış mı, en son kaça? |
| 5306 | Müşteri bazlı fiyat geçmişi uyarısı |
| 5329 | Fiyat geçmişi uyarısındaki "O Kaydı Görüntüle" bağlantısı: Hesaplama popup'ını |
| 5330 | kapatıp o ürünün daha önce daha yüksek fiyata satıldığı kaydı açar. |
| 5340 | "LİSTEYE EKLE" butonuna basılınca çağrılır: eğer bu ürün bu müşteriye daha |
| 5341 | önce daha yüksek fiyata satılmışsa, direkt eklemek yerine önce onay ister |
| 5342 | (Kapat = geri dön düzenle, Devam Et = yine de bu fiyatla ekle). |
| 5394 | Bekleyen ürün kalmadı - Ürün Bul sepetini de otomatik temizle |
| 5448 | Eşleşen sepet ürünü varsa "beklemede" durumuna geri al |
| 5468 | Aynı ürün Hesapla sayfasındaki bekleyen sepette (basket) de varsa oradan da kaldır |
| 5543 | KAYITLI (arşivlenmiş) bir işlem görüntüleniyorsa (tip/idx verilmişse) bu kaydın kendisi burada |
| 5544 | tek seferde tutulur — aşağıdaki tüm alanlar (yetkili dahil) buradan okunur, aksi halde o an aktif |
| 5545 | "Hesapla" ekranında başka bir müşteri için seçili duran bir yetkili kişi buraya sızabilir. |
| 5559 | Dinamik müşteri bilgileri (Yetkili Kişi/Telefon/E-Posta/Teslimat Adresi/Vade/Fatura/Kargo) — |
| 5560 | KAYITLI (arşivlenmiş) bir işlem görüntüleniyorsa aşağıdaki aktifKayit'ten okunur. |
| 5568 | Telefon/e-posta arşivde ayrı saklanmıyor — o kaydın ait olduğu müşterinin kişi listesinden, |
| 5569 | isim eşleşmesiyle bulunur. Eşleşme yoksa boş bırakılır (yanlış kişinin bilgisini göstermemek için). |
| 5707 | --- Kaçan Sipariş işaretleme ------------------------------------------- |
| 5765 | -------------------------------------------------------------------------- |
| 5767 | Kaydı İptal veya İade olarak işaretler (kayıt SİLİNMEZ, listede üzeri çizili görünür). |
| 5768 | Aynı duruma tekrar dokunulursa işaret kaldırılır (normale döner). |
| 5816 | Açık süreç bannerındaki tarih/tip satırına dokununca o kaydın fatura önizlemesini İlerlet butonuyla birlikte açar |
| 5903 | --- Mesaj Şablonları (kullanıcı özelleştirebilir) ------------------------- |
| 5945 | ----------------------------------------------------------------------- |
| 6000 | HTML önizleme - başlıkları kırmızı kalın, ürün isimlerini kalın+%30 büyük yap |
| 6037 | Mail metnini "ÜRÜN LİSTESİ VE DETAYLARI" kısmından önce kes - o kısmın yerini PNG alacak |
| 6068 | Kod üzerinden bu belgenin revize edilip edilmediğini arşivden bul |
| 6109 | Alt çizgili (underline) etiket+değer kutusu — referans görseldeki gibi |
| 6259 | TABLOYU KOPYALA / İNDİR — müşteriden gelen bir maile aynı zincir üzerinden |
| 6260 | yanıt vermek için, hareket tablosunu resim olarak panoya kopyalama veya |
| 6261 | PNG olarak indirme imkânı sağlar (yeni mail göndermeden, mevcut yanıt |
| 6262 | penceresine yapıştırılabilir/eklenebilir). |
| 6381 | MAIL ve WHATSAPP: telefonun paylaşım penceresi kullanılıyor — PNG resim |
| 6382 | otomatik ekleniyor, "title" olarak Konu da gönderiliyor (Gmail çoğunlukla |
| 6383 | bunu Konu alanına yazar). Web paylaşım penceresinde "Kime" diye bir alan |
| 6384 | olmadığı için o kısım (ofis@weicon.com.tr) mail uygulamasında elle girilmeli. |
| 6386 | Paylaşım penceresi HEMEN tetiklenmeli (kullanıcı dokunuşu izni süresi kısa). |
| 6387 | Arşivleme, paylaşımın sonucunu beklemeden hemen arkasından (ufak bir gecikmeyle) çalışır; |
| 6388 | böylece ne paylaşım penceresi engellenir ne de arşivleme arka plana atılınca kaybolur. |
| 6400 | Paylaşım desteklenmiyorsa, en son çare olarak indir + wa.me/mailto ile aç |
| 6418 | ============================================================ |
| 6421 | ŞEHİR FORMATLAMA — nasıl girilmiş olursa olsun İl her zaman büyük harf ve başta gösterilir |
| 6446 | İki cihaz aynı anda FARKLI arşiv kayıtlarını değiştirirse/silerse/eklerse |
| 6447 | birbirinin işlemini kaybetmesin diye: Firebase'e yazmadan hemen önce |
| 6448 | sunucudaki EN GÜNCEL arşivi çekip, sadece BU işlemin değişikliklerini |
| 6449 | (bir veya daha fazla tip içinde eklenen/güncellenen/silinen kayıtlar) o |
| 6450 | güncel arşivin içine "kod" (veya kod yoksa "ts") ile eşleştirerek |
| 6451 | uygulayıp öyle yazıyoruz. Eskiden bu cihazdaki (bayat olabilecek) local |
| 6452 | arsivData komple üzerine yazılıyordu ve diğer cihazın az önce farklı bir |
| 6453 | tipe/kayda yaptığı değişiklik sessizce kaybolabiliyordu. |
| 6454 | degisiklikler: {tip, kayit} \| {tip, silinecekKod} \| {tip, silinecekTs} \| dizi |
| 6490 | Sunucudan taze veri çekilemezse (yetki/ağ hatası vb.), işlemi tamamen |
| 6491 | kaybetmemek için kuyruğa alıyoruz — bir sonraki senkronda güvenli |
| 6492 | birleştirme ile tekrar denenecek (komple arşiv ile üzerine yazmıyoruz). |
| 6516 | Tüm kategorilerde ara |
| 6652 | "İş günü" penceresi: her gün sabah 09:00'da sıfırlanır, ertesi gün sabah 06:00'a |
| 6653 | kadar o günün verilerini göstermeye devam eder. 06:00-09:00 arası (yeni gün henüz |
| 6654 | başlamadan önceki geçiş aralığı) hiçbir iş günü aktif değildir, gösterge boş kalır. |
| 6734 | Diğer panelleri (Ziyaret Takvimi, Ajanda) kapat |
| 6750 | ============ ARAÇ KM TAKİBİ ============ |
| 6754 | Değişen günleri biriktirir — debounce'lu kmAylikTabloKaydet çağrılmadan hemen |
| 6755 | önce hangi TEK günün/günlerin değiştiğini işaretlemek için kullanılır, böylece |
| 6756 | güvenli-birleştirme fonksiyonu tüm ayı değil sadece bu günleri uygular. |
| 6763 | KM Takip — güvenli birleştirme (müşteri/arşiv'de kullandığımız aynı desen): |
| 6764 | yazmadan önce sunucudaki EN GÜNCEL tüm ay verisini çekip, sadece BU an |
| 6765 | değişen günü/günleri onun içine uygulayıp öyle yazıyoruz. ESKİDEN cihazın |
| 6766 | belleğindeki (kmTakipKayitlariObj) TÜM ay ham olarak üzerine yazılıyordu — |
| 6767 | bellek eksik/bayat olduğunda (örn. sayfa yeni açılmışken Firebase henüz tam |
| 6768 | senkron olmadan bir alana dokunulursa) diğer günlerin verisi sessizce |
| 6769 | TAMAMEN kaybolabiliyordu. Bu fonksiyon tek bir günü bile asla toptan silmez. |
| 6790 | Sunucudan taze veri çekilemezse (yetki/ağ hatası vb.), işlemi tamamen |
| 6791 | kaybetmemek için kuyruğa alıyoruz — bir sonraki senkronda güvenli |
| 6792 | birleştirme ile tekrar denenecek (komple ay ile üzerine yazmıyoruz). |
| 6812 | Bugünün araç KM kaydı girilip "Günü Kaydet" ile onaylanmış mı? Girilmediyse |
| 6813 | uygulamanın geri kalanı kilitlenir — kullanıcı önce KM fotoğrafını çekip |
| 6814 | kaydetmeden başka hiçbir işlev kullanamaz. |
| 6821 | "1 Saat Ertele" — araç şu an yanında değilse kilidi geçici olarak (60 dk) askıya alır. |
| 6822 | Süre dolunca kilit otomatik geri döner. |
| 6903 | Aylık tabloda bu arada değişiklik yapılmış olabilir (KM/Saat) — güncel |
| 6904 | veriyle yeniden yükle ki BAŞLANGIÇ/BİTİŞ KM kutuları hemen yansısın. |
| 6921 | YENİ MANTIK: Bir günün fotoğraflanan KM'si O GÜNÜN BAŞLANGICI'dır (istisnasız). |
| 6922 | Bir günün BİTİŞ KM'si ise SONRAKİ günün fotoğraflanan (başlangıç) değeridir. |
| 6923 | Bu yüzden "bitiş" için artık ileri yönlü arama gerekiyor. |
| 6936 | "Bir önceki tarih" burada TAKVİMDE dünü değil, kayıtlı olan EN YAKIN önceki |
| 6937 | günü ifade eder (araya boş — fotoğrafsız — günler girse bile). Sistem sadece |
| 6938 | fotoğrafın çekildiği günleri baz alır, aradaki tarihler tabloda hiç yer almaz. |
| 6940 | "YYYY-MM-DD" formatındaki bir tarih anahtarını N gün kaydırıp yeni anahtarı döndürür. |
| 6948 | Bitiş KM - Başlangıç KM farkını verir. Değerlerden biri boş/geçersizse null döner. |
| 6957 | Bir günün kaydını, otomatik kurallara göre yeniden hesaplar: |
| 6958 | 1) Başlangıç KM boşsa, bir önceki günün Bitiş KM'si otomatik yazılır. |
| 6959 | 2) Bitiş KM - Başlangıç KM farkı, o gün için seçili kategoriye (İş/Özel) |
| 6960 | göre ilgili alana otomatik yazılır, diğer alan temizlenir. |
| 6978 | Bir günün Bitiş KM'si girildiğinde/değiştiğinde, bir SONRAKİ günün Başlangıç |
| 6979 | KM'sini otomatik olarak bu değere eşitler (araç kilometresi fiziksel olarak |
| 6980 | süreklidir: bugünün bitişi = yarının başlangıcı). |
| 6997 | YENİ MANTIKTA ARTIK GEREKSİZ: her gün kendi fotoğrafıyla kendi başlangıcını taşıyor, |
| 6998 | önceki bir kayda bağımlı değil. Fonksiyon geriye dönük uyumluluk için duruyor ama hep false döner. |
| 7039 | Kayıt henüz oluşturulmamışsa: Pazartesi-Cuma (hafta içi) "Normal İş Günü", |
| 7040 | Cumartesi/Pazar "Hafta Sonu Tatil" olarak otomatik seçilir. |
| 7052 | TARİH kutusu artık sistem tarihini değil, "Tarih ve Saat Gir" ile ÇEKİLEN |
| 7053 | fotoğraftan okunan tarihi gösterir. Henüz fotoğraf çekilmediyse boş kalır. |
| 7074 | Tarih navigasyonunun altında, görüntülenen günden BİR ÖNCEKİ günün |
| 7075 | başlangıç/bitiş/toplam km özetini gösterir. |
| 7107 | Gün zaten kaydedilmiş olsa bile (kilitli görünüm), Gün Tipi değişikliği |
| 7108 | anında sessizce kaydedilir — kullanıcı tekrar "Günü Kaydet"e basmak zorunda kalmaz. |
| 7125 | Artık alanlar arasında zorla sıralama YOK — kullanıcı istediği alana |
| 7126 | istediği sırayla girebilir. Bu fonksiyon sadece görsel/erişilebilirlik |
| 7127 | için tüm alanların açık kaldığından emin olur (geçmiş sürümle uyum için |
| 7128 | tutuluyor, çağıran yerler dokunulmadan bırakıldı). |
| 7143 | Kaydet sırasında eksik çıkan alanları kırmızı çerçeveyle işaretler ve |
| 7144 | ilk eksik alana ekranı kaydırır. Kullanıcı o alana bir şey yazdığı an |
| 7145 | kırmızı çerçeve otomatik kalkar. |
| 7175 | NOT: "kmGunTipiSelect" (Gün Tipi) ve "kmKategoriSelect" (İş/Özel KM) BİLİNÇLİ |
| 7176 | olarak bu kilit listesinde YOK — gün kaydedilse bile bu iki seçim kutusu her |
| 7177 | zaman açık/değiştirilebilir kalır (aşağıdaki onchange'ler değişikliği anında |
| 7178 | sessizce kaydeder, "Günü Kaydet"e tekrar basmaya gerek kalmaz). |
| 7192 | Bugünün kaydı zaten yapılmışsa TÜM alanlar kilitlenir (yanlışlıkla |
| 7193 | bozulmasın diye). Tek bir "Düzenle" tuşu YOK — her alan kendi başına, |
| 7194 | üzerine 5 saniye BASILI TUTULARAK açılır; sadece o hücre aktif olur ve |
| 7195 | elle giriş yapılabilir. Bu kilit, ertesi günün sabah ilk KM girişine |
| 7196 | kadar (yani gün değişip yeni bir kayıt başlayana kadar) geçerlidir. |
| 7212 | Her kilitli alana bir kere bağlanır (sayfa açılışında). Alan disabled |
| 7213 | iken 5 saniye basılı tutulursa sadece o alanın kilidi açılır. |
| 7249 | BAŞLANGIÇ KM artık BUGÜNÜN KENDİ okunan değeri (KM Gir ile girilen/fotoğraflanan) |
| 7254 | BİTİŞ KM artık SONRAKİ günün okunan değeri — henüz o gün gelmediyse "—" |
| 7261 | En son KM kaydı girilmiş günden bir sonraki (boş) günü bulur. Hiç kayıt |
| 7262 | yoksa bugünü döner. Bulunan gün bugünden ileriyse (gelecek), bugüne sabitlenir. |
| 7263 | NOT: Eskiden burada "kmSonrakiBosGunuBul()" adlı bir fonksiyon vardı; okunan KM'yi |
| 7264 | "son kayıtlı günden sonraki ilk BOŞ güne" yerleştiriyordu. Bu YANLIŞTI — fotoğrafsız |
| 7265 | (es geçilen) günleri geçmişe dönük doldurmaya çalışıyor, bugünün okumasını yanlış bir |
| 7266 | güne yazabiliyordu. Artık kmFotoSecildi() doğrudan cihazın GERÇEK bugünkü tarihini |
| 7267 | kullanıyor, bu fonksiyona gerek kalmadı. |
| 7269 | KM/Tarih-Saat fotoğrafından okuma (kartFotoGonder ile aynı Cloud Function, "kmOku" hedefi) |
| 7278 | ÖNEMLİ: Fotoğraf hangi gün çekiliyorsa, okuma HER ZAMAN o günün |
| 7279 | (cihazın GERÇEK bugünkü tarihinin) kaydı olur — "son kayıtlı günden |
| 7280 | sonraki boş gün" gibi bir arayışla GEÇMİŞTEKİ bir güne asla yazılmaz. |
| 7281 | Fotoğrafsız günler otomatik olarak es geçilir (o gün km yapılmamış |
| 7282 | sayılır) — aradaki boşluk hiçbir zaman doldurulmaya çalışılmaz. |
| 7292 | KM okunur okunmaz, diğer alanlar (güzergah, ziyaret vb.) boş kalsa bile |
| 7293 | sessizce kaydet — böylece Aylık Rapor'a KM hemen yansır, geri kalanı |
| 7294 | gün içinde doldurulup normal "KM Kaydet" ile tamamlanabilir. |
| 7311 | KM fotoğrafı çekilip okunduğu ANDAKİ cihaz tarih/saatini TARİH ve SAAT |
| 7312 | kutularına otomatik yazar — bu, km okuma anının kaydıdır. |
| 7327 | KM okuma tuşunu "KM Gir" (fotoğraf çek) durumundan "KM Kaydet" durumuna |
| 7328 | çevirir — km başarıyla okunup alana yazıldıktan sonra çağrılır. |
| 7337 | KM okuma tuşunu tekrar "KM Gir" (fotoğraf çek) durumuna döndürür — |
| 7338 | yeni bir güne geçildiğinde veya kayıt henüz yapılmamışken çağrılır. |
| 7392 | Boş bir gün ise (hiçbir şey girilmemiş, normal tipte) kaydı sil |
| 7414 | Aylık tablo artık Excel çıktısıyla BİREBİR AYNI 8 sütun: Tarih \| Başlangıç-Bitiş |
| 7415 | Saati \| Seyir Güzergahı \| Ziyaret Yerleri \| Başlangıç KM \| Bitiş KM \| İş KM \| Özel KM. |
| 7416 | Gün Tipi seçimi Tarih hücresinin altına küçük bir kutu olarak gömülüdür (ayrı |
| 7417 | sütun DEĞİL). Kategori (İş/Özel) seçimi de İş KM / Özel KM hücresine dokunularak |
| 7418 | yapılır — ayrı bir Kategori sütunu yoktur. Böylece görünen sütunlar Excel ile |
| 7419 | tıpatıp aynıdır; ekstra alanlar sadece hücre içi küçük kontrollerdir. |
| 7439 | Sistem SADECE fotoğrafın çekildiği (kaydın gerçekten girildiği) günleri baz |
| 7440 | alır — takvimde ardışık gitmek zorunda değil. Fotoğraf/kayıt olmayan bir gün |
| 7441 | (bugün dahil) tabloda hiç görünmez, aradaki tarihler tamamen atlanır. |
| 7448 | Excel/tablo görünümüyle birebir: hücreler düz görünür (görünmez kenarlıklı, |
| 7449 | saydam zeminli input), sadece odaklanınca hafif çerçeve belirir. |
| 7473 | OTOMATİK KURALLAR: |
| 7474 | 1) Bir günün Başlangıç KM'si boşsa, bir önceki günün Bitiş KM'si otomatik |
| 7475 | olarak o kutuya yazılır (araç kilometresi süreklidir). |
| 7476 | 2) Bitiş KM - Başlangıç KM farkı, o gün için seçili kategoriye (İş/Özel |
| 7477 | KM hücresine dokunarak seçilir) göre otomatik olarak ilgili hücreye |
| 7478 | yazılır. Kullanıcı isterse üzerine yazıp elle değiştirebilir. |
| 7495 | Elle Bitiş KM girilmemişse: Günlük Kayıt'tan gelen bir sonraki günün |
| 7496 | KENDİ KM okuması otomatik olarak bu günün Bitiş KM'si sayılır |
| 7497 | (araç kilometresi süreklidir — bugünün bitişi = yarının okuması). |
| 7537 | Herhangi bir satıra BASILI TUTULURSA (500ms), o günün tüm bilgilerini tek |
| 7538 | popup'ta düzenleyebileceğimiz ekranı açar. Var olan hücre-içi düzenleme |
| 7539 | (input'a dokunup yazma) de aynen çalışmaya devam eder. |
| 7541 | ÖNEMLİ DÜZELTME: Eskiden dokunma anında tarayıcı hücreyi HEMEN odaklayıp |
| 7542 | klavyeyi açıyordu (native davranış), biz 500ms sonra popup'ı bunun ÜSTÜNE |
| 7543 | açıyorduk — bu da "popup, kutunun içine giriyor ve yanlış yazıma neden |
| 7544 | oluyor" şikayetine yol açıyordu. Artık dokunma anında native odaklanmayı |
| 7545 | BİZ engelliyoruz (preventDefault); basılı tutma tamamlanmadan parmak |
| 7546 | kalkarsa (kısa/normal dokunuş) hücreyi KENDİMİZ odaklıyoruz — yani tek |
| 7547 | dokunuşla düzenleme aynen çalışır ama klavye popup'la asla çakışmaz. |
| 7548 | Sürükleme/scroll varsa basılı tutma iptal edilir. |
| 7568 | Kısa dokunuş — popup açılmadı, normal düzenleme odaklanmasını biz tetikliyoruz. |
| 7579 | Parmağın en ufak titremesinde (gerçek kaydırma olmadan) basılı tutma iptal |
| 7580 | OLMASIN diye 12px'lik bir eşik mesafe var — sadece bu eşiği aşan gerçek |
| 7581 | bir sürükleme/scroll hareketinde basılı tutma iptal edilir. |
| 7592 | Masaüstü/mouse ile test için: burada native odaklanma zaten sorun |
| 7593 | yaratmadığından preventDefault gerekmez, davranış olduğu gibi bırakıldı. |
| 7602 | Düzenleme sırasında odak kaybolmasın diye, aynı hücreye tekrar odaklan |
| 7609 | İş KM / Özel KM hücresine dokunularak o günün kategorisini seçme (ayrı bir |
| 7610 | Kategori sütunu olmadan, Excel'deki 8 sütun görünümünü bozmadan). |
| 7628 | Tablodaki herhangi bir hücre değiştirildiğinde çağrılır: ilgili günün |
| 7629 | kaydını (yoksa oluşturarak) günceller, yerelde ve Firebase'de saklar, |
| 7630 | başlangıç/bitiş KM zincirinin doğru görünmesi için tabloyu yeniden çizer. |
| 7631 | "+ Gün Ekle" kutusu: tablo artık sadece kayıtlı günleri gösterdiği için, izin/tatil |
| 7632 | gibi Günlük Kayıt'tan geçmeyen bir günü elle eklemek istediğinde bu kullanılır. |
| 7633 | Seçilen tarih için (henüz kaydı yoksa) boş bir kayıt oluşturur, gerekiyorsa o ayı |
| 7634 | gösterir ve tabloyu yeniden çizip o günün Başlangıç KM alanına odaklanır. |
| 7687 | Başlangıç/Bitiş KM değiştiyse, o günün İş/Özel KM farkını seçili |
| 7688 | kategoriye göre otomatik yeniden hesapla. |
| 7692 | Bugünün Bitiş KM'si, yarının Başlangıç KM'sine otomatik aktarılır. |
| 7702 | Aynı anda açık olan Günlük Kayıt ekranı bu güne bakıyorsa, orayı da tazele. |
| 7710 | Bu genel kaydetme birden çok yerden (hücre düzenleme, gün ekleme/silme, |
| 7711 | zincirleme bitiş-KM aktarımı) çağrılıyor — hangi günlerin değiştiğini |
| 7712 | kmBekleyenDegisiklikler kuyruğu tutuyor. Kuyrukta bir şey varsa SADECE o |
| 7713 | günleri güvenli birleştirerek yazıyoruz (tüm ayı ham üzerine yazmıyoruz). |
| 7714 | Kuyruk boşsa (bilinmeyen bir çağrı yolu), son çare olarak eski davranışa |
| 7715 | (ham üzerine yazma) düşüyoruz — ama bu artık istisna, kural değil. |
| 7726 | Bir güne BASILI TUTULUNCA açılan tam-detay düzenleme popup'ı — o günün TÜM |
| 7727 | alanlarını (gün tipi, saat, güzergah, ziyaret yerleri, başlangıç/bitiş KM, |
| 7728 | iş/özel KM, kategori) tek ekranda gösterir ve hepsini birden değiştirmeyi |
| 7729 | sağlar. Geçmişe dönük herhangi bir günü (bugün olmasa bile) düzenlemek için. |
| 7784 | "🗑 Bu Günü Tamamen Sil" — önce net bir onay ister (kalıcı silme, geri |
| 7785 | alınamaz), onaylanırsa kaydı tamamen kaldırır ve tabloyu yeniden çizer. |
| 7800 | Ana Sayfa'dan doğrudan Aylık (düzenlenebilir) tabloya geçiş |
| 7886 | Kolon başlıkları satırı (3. satır, 0-index BAS_SATIR-1): açık mavi zemin, kalın, ortalı. |
| 7898 | Veri satırları: tek satır, kenarlıklı, Tarih sola / diğerleri ortaya hizalı. |
| 7918 | ============ ZİYARET TAKVİMİ ============ |
| 7946 | Diğer panelleri (Aylık Özet, Ajanda) kapat |
| 7963 | ============ GÜNLÜK AJANDA ============ |
| 7977 | Diğer panelleri (Aylık Özet, Ziyaret Takvimi) kapat |
| 8082 | Tüm müşterilerin ziyaretGecmisi'ni tek düz listeye toplar: {musteri, sehir, ts, not} |
| 8102 | Pazartesi=0 olacak şekilde haftanın gününü ayarla |
| 8138 | Özet tablo: bu ay toplamı + bu hafta (son 7 gün, tüm ziyaretler üzerinden gerçek zamana göre) |
| 8150 | 15+ gündür ziyaret edilmeyenler (tüm müşteriler üzerinden, ay'dan bağımsız gerçek zaman) |
| 8367 | ❌ Kaçan Siparişler özeti: bu ayki sayı/tutar, kaybedilme sebebi dağılımı, |
| 8368 | rakip firma dağılımı ve Teklif→Sipariş dönüşüm oranı. |
| 8407 | "KAÇAN İŞLEM" kutusuna dokununca — bu ayki kaçan kayıtların listesi (sebep, |
| 8408 | rakip firma, tutar dahil) ayrı bir popup'ta açılır. |
| 8434 | KAYIT DÜZENLEME — geçmişte yanlış kaydedilmiş bir işlemi manuel düzeltmek için |
| 8464 | Bu modalı tetikleyebilecek tüm üst popup'lar kapatılır — aksi halde |
| 8465 | Revize tuşuna basınca bu modal arkada açılır, görünmez kalır. |
| 8627 | Tip veya tarih değiştiyse belge kodu da (SIP/TEK/PRO/NUM + tarih + sıra) |
| 8628 | yeni duruma göre tazelenir, aksi halde eski koddaki tarih/tip yanıltıcı kalır. |
| 8840 | Firebase'e artık TÜM sayaçlar nesnesi komple üzerine yazılmıyor — sadece bu |
| 8841 | tipin sayacı, sunucuda ATOMİK olarak (transaction) en az bu değere yükseltiliyor. |
| 8842 | Böylece iki cihaz aynı anda kod üretse bile birbirinin artışını silmiyor |
| 8843 | (eskiden fbSet ile komple nesne yazıldığında diğer cihazın az önce yaptığı |
| 8844 | artış sessizce kaybolabiliyordu). |
| 8891 | Aynı gün + aynı müşteri + aynı işlem türü + BİREBİR AYNI ürün seti (Berta/Abas |
| 8892 | kodlarına göre — sadece adet/iskonto/fiyat farkı olabilir, ürün eklenip/çıkarılmamış |
| 8893 | olmalı) bulunursa ikinci bir evrak açmak yerine mevcut kaydı güncelleyip REVİZE damgası |
| 8894 | basıyoruz. Böylece unutularak art arda gönderilen aynı sipariş, mükerrer kayıt olmuyor. |
| 8913 | REVİZE GEÇMİŞİ: üzerine yazmadan önce eski hâli (fiyat/ürün seti + zaman) |
| 8914 | revizeGecmisi dizisine ekleniyor — böylece bir teklif/sipariş birden |
| 8915 | fazla kez revize edilse bile önceki fiyatların tamamı kayboluyor değil, |
| 8916 | "v1 → 1.250€, v2 → 1.180€" gibi bir tarihçe olarak saklanıyor. |
| 8944 | "İlerlet" ile (Numune→Teklif→Proforma→Sipariş) hazırlanan bir belgeyse, eski aşamanın |
| 8945 | kaydını arşivden SİL — artık iki ayrı kayıt değil, tek kayıt yeni türe dönüşmüş olur. |
| 8972 | Arşive gitme - sadece bildir |
| 9038 | ============================================================ |
| 9041 | Bir teklif/numune/proforma kaydını "düzenlenebilir" (bekleyen) halde Sepet'e taşır, |
| 9042 | ürünlere dokunup gramaj/ürün değiştirilebilir, hesaplandıktan sonra hedef SİPARİŞ olarak gönderilir. |
| 9043 | ============================================================ |
| 9044 | HAREKET SEÇ — Müşteri kartı / İşlem Geçmişi / İstatistikler'den ulaşılan |
| 9045 | TEK ORTAK akış: bir kaydın (teklif/numune/proforma/sipariş) ürünlerini, |
| 9046 | MEVCUT fiyat/iskonto/adediyle DOĞRUDAN hesaplanmış olarak Sepet'e yükler. |
| 9047 | Hiçbir ürünü yeniden hesaplamaya zorlamaz — değişecek ürün varsa |
| 9048 | kullanıcı sadece o ürüne dokunup düzenler, diğerleri olduğu gibi kalır. |
| 9049 | ============================================================ |
| 9080 | Ürünleri mevcut fiyat/iskonto/adediyle DOĞRUDAN HESAPLANMIŞ (yeşil) olarak yükle. |
| 9130 | Ürünleri HESAPLANMIŞ olarak değil, BEKLEYEN (sarı) olarak sepete koy — |
| 9131 | böylece her ürüne dokunup "✏️ Düzenle" ile farklı bir ürün/gramaj seçilebilir. |
| 9146 | Hedef işlem türünü SİPARİŞ olarak ayarla (teklif/numune/proforma -> sipariş dönüşümü) |
| 9170 | Müşteriyi bul (kayıtlı müşteri listesinde varsa tam profiliyle, yoksa kayıttaki bilgilerle) |
| 9179 | Ürünleri hareket listesine yükle (tarih, gönderim anında otomatik bugünün tarihi olacak) |
| 9184 | İşlem türünü kayıttaki türle eşle |
| 9189 | Vade/Fatura/Kargo/Yetkili'yi kaydın kendi değerleriyle güncelle (müşteri profilindeki genel değerler yerine) |

## Function index

| Line | Function |
|---:|---|
| 17 | `veriYonetimiPopupAc` |
| 21 | `tumVeriyiYedekle` |
| 43 | `yedekHatirlaticiKontrolEt` |
| 61 | `otomatikYedekKontrolEt` |
| 89 | `kdvOraniDegistir` |
| 115 | `validateText` |
| 124 | `debounce` |
| 216 | `firebasdenYukle` |
| 295 | `showToast` |
| 302 | `showUndoToast` |
| 317 | `gizleUndoToast` |
| 329 | `aramaGecmisiKaydet` |
| 349 | `aramaGecmisiniGoster` |
| 366 | `aramaSecGeçmis` |
| 373 | `hitUrunleriHesapla` |
| 391 | `hitUrundenSepeteEkle` |
| 407 | `hitUrunlerAc` |
| 434 | `enCokAranakHesapla` |
| 439 | `enCokAranakAc` |
| 461 | `sonKullanilanKaydet` |
| 470 | `sonKullanilanUrunleriGoster` |
| 494 | `sonKullanilanUrunSecildi` |
| 504 | `topluIskontoUygula` |
| 559 | `musteriListesiniKaydet` |
| 570 | `musteriListesiGuvenliKaydet` |
| 607 | `musteriHepsiniGoster` |
| 625 | `sehirFiltreGoster` |
| 648 | `sehireGoreFiltrele` |
| 658 | `musteriPanelAc` |
| 683 | `turkceBaslikDuzeni` |
| 691 | `yetkiliMetniIletisimeCevir` |
| 709 | `kartFotoAlaniniTemizle` |
| 714 | `kartFotoDurumGoster` |
| 731 | `kartFotoGonder` |
| 785 | `kartFotoJpegeDonustur` |
| 829 | `kartFotoAlaniDoldur` |
| 839 | `kartFotoSecildi` |
| 849 | `yetkiliIletisimFotoSecildi` |
| 868 | `teslimatAdresiFotoSecildi` |
| 879 | `kartFotoAlanDoldurTumu` |
| 897 | `veriYonetimindenUrunEkleAc` |
| 903 | `yeniUrunEklePopupAc` |
| 912 | `yeniUrunKaydet` |
| 964 | `musteriSonrakiKoduBul` |
| 975 | `musteriIdUret` |
| 978 | `musteriIdEksikleriTamamla` |
| 998 | `turkceNormallestir` |
| 1004 | `musteriAdiKelimelere` |
| 1009 | `benzerMusteriBul` |
| 1026 | `musteriKaydet` |
| 1043 | `musteriMukerrerKapat` |
| 1046 | `musteriMukerrerZorlaKaydet` |
| 1053 | `musteriBirlestirAc` |
| 1065 | `musteriBirlestirModalKapat` |
| 1070 | `musteriBirlestirAramaRenderEt` |
| 1096 | `musteriBirlestirHedefSec` |
| 1106 | `musteriBirlestirOnayla` |
| 1166 | `musteriKaydetGercek` |
| 1178 | `kaydiTamamla` |
| 1220 | `kurKaydetVeYayinla` |
| 1233 | `kurGuncelle` |
| 1249 | `kurGuncelleManuel` |
| 1267 | `kurManuelGir` |
| 1274 | `kurManuelKapat` |
| 1278 | `kurManuelKaydet` |
| 1289 | `anaKurDegerGuncelle` |
| 1294 | `kurOtomatikKontrol` |
| 1310 | `musteriIslemSayisiGetir` |
| 1323 | `musteriKartAc` |
| 1386 | `musteriIslemOzetiGetir` |
| 1405 | `musteriCariKartAc` |
| 1446 | `iletisimGonderKontrolluBaslat` |
| 1462 | `iletisimGonderimYap` |
| 1468 | `musteriIletisimAc` |
| 1486 | `musteriIletisimKisiSecmeyeAc` |
| 1501 | `musteriIletisimYetkiliSecmeyeAc` |
| 1525 | `musteriIletisimKapat` |
| 1543 | `musteriIletisimTabSec` |
| 1570 | `musteriIletisimListesiRenderEt` |
| 1609 | `ziyaretKisiSec` |
| 1637 | `yetkiliKisiDuzenleAc` |
| 1652 | `musteriIletisimEkle` |
| 1677 | `guncellemeyiUygula` |
| 1724 | `musteriIletisimSil` |
| 1731 | `guncellemeyiUygula` |
| 1764 | `bildirimleriHesapla` |
| 1781 | `ziyaretHatirlatmalariHesapla` |
| 1801 | `gorevleriYukle` |
| 1817 | `gorevleriKaydet` |
| 1822 | `gorevTanimlaAc` |
| 1835 | `gorevKaydet` |
| 1863 | `gorevFiltreSec` |
| 1877 | `haftalikTumKayitlariGetir` |
| 1898 | `haftalikTumZiyaretleriGetir` |
| 1918 | `haftalikDurumKategorisi` |
| 1927 | `sonHareketGecmisiGetir` |
| 1961 | `sonHareketZamanCizelgesiHTML` |
| 1982 | `sonHareketAc` |
| 1992 | `sonHareketNotEkleAc` |
| 1997 | `sonHareketTamamlandiIsaretle` |
| 2003 | `gorevListesiAcKarttan` |
| 2008 | `gorevListesiAc` |
| 2016 | `gorevSimdiZamanDamgasi` |
| 2021 | `gorevListesiRenderEt` |
| 2091 | `gorevKartHTML` |
| 2123 | `tekSatirFontHesapla` |
| 2130 | `haftalikKartHTML` |
| 2155 | `sonHareketEtiketiHTML` |
| 2170 | `gorevTamamlandiToggle` |
| 2181 | `gorevSil` |
| 2191 | `gorevBadgeGuncelle` |
| 2202 | `gorevBildirimleriHesapla` |
| 2210 | `gorevHatirlatmaKontrolEt` |
| 2240 | `bildirimBannerGuncelle` |
| 2267 | `bildirimListesiAc` |
| 2329 | `bildirimdenIlerlet` |
| 2337 | `bildirimdenSil` |
| 2358 | `isoHaftaAnahtari` |
| 2367 | `haftalikDurumHaritasiGetir` |
| 2368 | `haftalikDurumKaydet` |
| 2378 | `haftalikAcikFaturaListesi` |
| 2400 | `haftalikAcikZiyaretListesi` |
| 2420 | `haftalikTakipToplamSayisi` |
| 2425 | `haftalikTakipOtomatikKontrol` |
| 2435 | `haftalikDurumButonuHTML` |
| 2460 | `haftalikKartDurumSec` |
| 2475 | `gorevTakipEsc` |
| 2477 | `gorevTakipAc` |
| 2497 | `gorevTakipKapat` |
| 2503 | `gorevTakipListesiRenderEt` |
| 2537 | `gorevTakipNotuDuzenle` |
| 2553 | `gorevTakipDuzenlemeIptal` |
| 2566 | `gorevTakipNotuSil` |
| 2588 | `gorevTakipNotKaydet` |
| 2631 | `gorevTakipMusteriTemasEkle` |
| 2634 | `guncellemeyiUygula` |
| 2666 | `gorevTakipMusteriTemasGuncelle` |
| 2669 | `guncellemeyiUygula` |
| 2702 | `gorevTakipMusteriTemasSil` |
| 2703 | `guncellemeyiUygula` |
| 2741 | `haftalikTakipRaporuAc` |
| 2747 | `musteriAcikSurecKaydiGetir` |
| 2769 | `musteriAcikSurecMesajGetir` |
| 2776 | `musteriAcikSurecUyariGoster` |
| 2791 | `acikSureciIlerlet` |
| 2805 | `ilerletAsamaSecildi` |
| 2834 | `ilerletAsamaSecModalKapat` |
| 2848 | `musteriKartKapat` |
| 2860 | `musteriKartModalaGitCariKarttan` |
| 2868 | `musteriKartModalaGitSecimden` |
| 2877 | `musteriCariKartKapat` |
| 2901 | `resimSikistir` |
| 2920 | `ziyaretFotoSecildi` |
| 2949 | `ziyaretFotoSil` |
| 2958 | `ziyaretFotoGaleriOlustur` |
| 2977 | `ziyaretFotoBuyukGoster` |
| 2984 | `yetkiliKisiEtiketGuncelle` |
| 2996 | `yetkiliKisiTemizle` |
| 3003 | `ziyaretKisiEtiketGuncelle` |
| 3014 | `ziyaretKisiTemizle` |
| 3019 | `ziyaretTurSeciciOlustur` |
| 3033 | `ziyaretTurSec` |
| 3042 | `ziyaretMesajGonder` |
| 3065 | `musteriKartZiyaretAc` |
| 3086 | `musteriGecmisIslemleriAc` |
| 3098 | `surecleriGetir` |
| 3099 | `surecleriKaydet` |
| 3101 | `musteriSurecleriniGetir` |
| 3108 | `kayitlariSureceBagla` |
| 3133 | `surecListesiRenderEt` |
| 3161 | `surecAsamaDetayAc` |
| 3181 | `revizeTarihSaatFormatla` |
| 3190 | `revizeGecmisiGoster` |
| 3205 | `tarihKisalt` |
| 3225 | `uzunBasiBaslat` |
| 3229 | `uzunBasiBitir` |
| 3232 | `uzunBasiTikSonrasi` |
| 3242 | `urunAdiniWeiconDaAra` |
| 3250 | `musteriGecmisRenderEt` |
| 3342 | `musteriGecmisUrunSil` |
| 3368 | `musteriGecmisIslemDetayAc` |
| 3377 | `musteriGecmisIslemleriGeriDon` |
| 3382 | `musteriGecmisIslemleriKapat` |
| 3386 | `musteriZiyaretKapat` |
| 3391 | `ziyaretKaydiDuzenle` |
| 3418 | `ziyaretKaydiSil` |
| 3426 | `guncellemeyiUygula` |
| 3455 | `musteriZiyaretKaydet` |
| 3473 | `guncellemeyiUygula` |
| 3518 | `musteriZiyaretGecmisiAc` |
| 3552 | `musteriZiyaretGecmisiGeriDon` |
| 3557 | `musteriZiyaretGecmisiKapat` |
| 3561 | `musteriKartDuzenleAc` |
| 3569 | `musteriKartSilAc` |
| 3579 | `musteriSilOnayEvet` |
| 3585 | `musteriDuzenle` |
| 3602 | `musteriDuzenleKaydet` |
| 3617 | `guncellemeyiUygula` |
| 3661 | `musteriDuzenleKapat` |
| 3665 | `musteriSil` |
| 3683 | `musteriGeriYukle` |
| 3698 | `musteriSecimiTemizle` |
| 3704 | `musteriBilgiKutusu` |
| 3711 | `musteriSeritiGuncelle` |
| 3732 | `islemleriTemizle` |
| 3766 | `anaMenudenZiyaretEkleBaslat` |
| 3775 | `ziyaretGunicinEkleBaslat` |
| 3787 | `musteriSecimBaslat` |
| 3792 | `musteriIslemBaslatKarttan` |
| 3809 | `islemBaslatModalAc` |
| 3823 | `islemBaslatAcikSurecGoster` |
| 3835 | `islemBaslatSecildi` |
| 3860 | `islemBaslatModalKapat` |
| 3864 | `musteriSecimYap` |
| 3910 | `musteriListesiniRenderEt` |
| 3984 | `sonIslemFiltreDegisti` |
| 3989 | `buAyinHareketToplami` |
| 4014 | `buAyinKacanToplami` |
| 4038 | `sonIslemleriRenderEt` |
| 4128 | `sehirIkiSatirHtml` |
| 4159 | `baglantiBul` |
| 4237 | `sonIslemDetayAc` |
| 4241 | `tamSifirla` |
| 4259 | `navTabsGuncelle` |
| 4287 | `updateHareketSayac` |
| 4295 | `navigatePage` |
| 4307 | `geriGit` |
| 4332 | `switchTab` |
| 4402 | `loadCatalogFromMemory` |
| 4410 | `dinlemeyeBasla` |
| 4442 | `processJsonUpload` |
| 4481 | `urunListesiniFirebaseGonder` |
| 4512 | `performFilter` |
| 4577 | `addToBasket` |
| 4604 | `updateBasketCount` |
| 4619 | `removeFromBasket` |
| 4637 | `sepetFiyatGecmisiUyariKapat` |
| 4643 | `sepetFiyatGecmisiUyariGuncelle` |
| 4679 | `hareketTabloKaydirmaKontrol` |
| 4688 | `renderBirlesikTablo` |
| 4777 | `renderBasket` |
| 4778 | `renderHareket` |
| 4780 | `anaMenuPopupAc` |
| 4788 | `yarimKalanIslemUyariGoster` |
| 4793 | `yarimKalanIslemDevamEt` |
| 4798 | `yarimKalanIslemIptalEt` |
| 4811 | `iletisimIslemleriPopupAc` |
| 4830 | `fiyatGorunumuSec` |
| 4838 | `hesaplaKaydetTikla` |
| 4858 | `kaydetOnayPopupAc` |
| 4868 | `kaydetOnayModalKapat` |
| 4871 | `kaydetOnayla` |
| 4881 | `hareketAnomaliKontrolEt` |
| 4925 | `anomaliUyariPopupGoster` |
| 4937 | `anomaliUyariGormezdenGel` |
| 4947 | `anomaliUyariGeriDon` |
| 4951 | `anomaliUyariKapat` |
| 4961 | `anomaliDerinAnalizIste` |
| 5004 | `hesaplaPopupAc` |
| 5019 | `hesaplamaTemizle` |
| 5034 | `listeyeEkleButonGuncelle` |
| 5042 | `satisMenusuAc` |
| 5045 | `satisMenusuKapatVeGit` |
| 5050 | `hizliHesaplaAc` |
| 5069 | `hizliHesaplaUrunAramaAc` |
| 5076 | `hizliHesaplaFiltrele` |
| 5125 | `hizliHesaplaUrunSec` |
| 5144 | `hesaplaPopupKapat` |
| 5154 | `sepetBekleyenModalAc` |
| 5184 | `sepettenSil` |
| 5202 | `sepettenHesaplaAktar` |
| 5225 | `aktarilanUrununSil` |
| 5235 | `fmt` |
| 5237 | `listeFiyatGuncelle` |
| 5249 | `musteriUrunFiyatGecmisiBul` |
| 5272 | `fiyatGecmisiKontrolEt` |
| 5282 | `hesapla` |
| 5331 | `oncekiSatisKaydinaGit` |
| 5343 | `listeyeEkleTikla` |
| 5359 | `fiyatDusuklukOnayKapat` |
| 5364 | `fiyatDusuklukOnayDevamEt` |
| 5370 | `hareketeSaklar` |
| 5407 | `islemTuruModalAc` |
| 5410 | `islemTuruModalKapat` |
| 5414 | `islemTuruRenkGuncelle` |
| 5427 | `modSec` |
| 5444 | `hareketDuzenle` |
| 5465 | `harekettenSil` |
| 5483 | `hareketUrunModalAc` |
| 5510 | `faturaOnizlemeHtmlOlustur` |
| 5683 | `faturaOnizlemePopupGoster` |
| 5708 | `kacanIsaretlePopupAc` |
| 5721 | `kacanIsaretleModalKapat` |
| 5724 | `kacanIsaretleKaydet` |
| 5747 | `kacanIsaretiKaldir` |
| 5769 | `faturaOnizlemedenDurumIsaretle` |
| 5789 | `faturaOnizlemedenSil` |
| 5797 | `faturaOnizlemeAc` |
| 5807 | `faturaOnizlemeKapat` |
| 5817 | `acikSurecKayitOnizlemeAc` |
| 5838 | `faturaOnizlemeIlerletModuAc` |
| 5847 | `faturaOnizlemeIlerletModuKapat` |
| 5856 | `faturaOnizlemedenIlerlet` |
| 5864 | `getDynamicCustomerName` |
| 5865 | `getDynamicCustomerSehir` |
| 5866 | `getDynamicCustomerNameSehirli` |
| 5867 | `getDynamicCustomerVade` |
| 5868 | `getDynamicCustomerFatura` |
| 5870 | `getModLabel` |
| 5877 | `getDynamicCustomerYetkili` |
| 5881 | `getDynamicCustomerYetkiliIletisim` |
| 5887 | `getDynamicCustomerKargo` |
| 5888 | `getDynamicCustomerTeslimatAdresi` |
| 5894 | `custTeslimatToggle` |
| 5907 | `mesajSablonlariniYukle` |
| 5911 | `mesajSablonuUygula` |
| 5917 | `mesajSablonlariAc` |
| 5923 | `mesajSablonlariKaydet` |
| 5933 | `mesajSablonlariVarsayilanaDondur` |
| 5947 | `buildEmailBody` |
| 5967 | `buildWhatsAppBody` |
| 5985 | `hareketBosUyariGoster` |
| 5993 | `generateCommunicationData` |
| 6014 | `cihazMobilMi` |
| 6018 | `sendWhatsAppMessage` |
| 6023 | `copyEmailText` |
| 6029 | `mailOnizlemePopupAc` |
| 6055 | `mailOnizlemeKapat` |
| 6063 | `siparisResmiHtmlOlustur` |
| 6223 | `siparisResmiCanvasOlustur` |
| 6256 | `resimVeEpostaGonder` |
| 6257 | `resimVeWhatsappGonder` |
| 6265 | `tabloKopyalaIndirBaslat` |
| 6295 | `tabloOnizlemeKapat` |
| 6300 | `tabloResmiKopyala` |
| 6316 | `tabloResmiIndir` |
| 6334 | `_resimGonderOrtak` |
| 6363 | `_resimGonderDevamEt` |
| 6424 | `sehirFormatla` |
| 6455 | `arsivGuvenliKaydet` |
| 6501 | `arsivAra` |
| 6569 | `arsivAramaSifirla` |
| 6576 | `arsivSekmeAc` |
| 6598 | `istatistikFiltreButonGuncelle` |
| 6614 | `istatistikFiltreSec` |
| 6621 | `buAyinSiparisVerisi` |
| 6655 | `buGununIsGunuTarihi` |
| 6665 | `buGuneAitSiparisVerisi` |
| 6691 | `anaSayfaRenderEt` |
| 6713 | `anaSayfaSatisDetay` |
| 6717 | `anaSayfaPrimDetay` |
| 6723 | `aylikOzetiAcKapa` |
| 6758 | `kmDegisiklikKaydet` |
| 6770 | `kmGuvenliKaydet` |
| 6805 | `kmFmt` |
| 6806 | `kmTarihAnahtari` |
| 6815 | `kmBugunKayitliMi` |
| 6823 | `kmErtelemeAktifMi` |
| 6827 | `kmKapiAcikMi` |
| 6830 | `kmErtele` |
| 6836 | `kmErtelemeButonuGuncelle` |
| 6855 | `kmTakipSayfasiAc` |
| 6856 | `devamEt` |
| 6869 | `biriTamamlandi` |
| 6880 | `kmAyarlarKaydet` |
| 6889 | `kmTakipGorunumDegistir` |
| 6909 | `kmOncekiKmBul` |
| 6924 | `kmSonrakiKmBul` |
| 6941 | `kmAnahtarKaydir` |
| 6949 | `kmFarkHesapla` |
| 6961 | `kmAylikGunYenidenHesapla` |
| 6981 | `kmAylikBitisKmSonrakiGuneAktar` |
| 6999 | `kmBaslangicGerekliMi` |
| 7003 | `kmAyBasiKontrolEt` |
| 7013 | `kmAyBasiKaydet` |
| 7041 | `kmVarsayilanGunTipi` |
| 7046 | `kmGunKayitYukle` |
| 7076 | `kmOncekiGunOzetiGoster` |
| 7104 | `kmTakipGunTipiDegisti` |
| 7114 | `kmTakipKategoriDegisti` |
| 7120 | `kmKategoriSec` |
| 7129 | `kmAlanKilitleriUygula` |
| 7135 | `kmAlanAyarla` |
| 7153 | `kmEksikAlanlariIsaretle` |
| 7197 | `kmFormKilitleGoster` |
| 7214 | `kmUzunBasinaKilitAcKur` |
| 7246 | `kmTakipHesapla` |
| 7270 | `kmFotoSecildi` |
| 7313 | `kmSuAnTarihSaatDoldur` |
| 7329 | `kmKmFotoBtnKaydetModunaGecir` |
| 7339 | `kmKmFotoBtnOkumaModunaGecir` |
| 7347 | `kmTakipGunDegistir` |
| 7352 | `kmTakipBugun` |
| 7358 | `kmTakipKaydet` |
| 7407 | `kmTakipAyDegistir` |
| 7420 | `kmTakipAylikTabloRenderEt` |
| 7447 | `esc` |
| 7451 | `metinKutu` |
| 7454 | `kmKutu` |
| 7611 | `kmAylikKategoriSec` |
| 7635 | `kmAylikGunEkle` |
| 7660 | `kmAylikHucreDegisti` |
| 7731 | `kmGunDuzenlePopupAc` |
| 7750 | `kmGunDuzenleKapat` |
| 7755 | `kmGunDuzenleKaydet` |
| 7786 | `kmGunDuzenleSilOnay` |
| 7801 | `anaSayfadanAylikKmAc` |
| 7807 | `kmTakipGunTikla` |
| 7814 | `kmTakipExcelIndir` |
| 7923 | `anaSayfadanZiyaretTakvimiAc` |
| 7935 | `ziyaretTakvimiAcKapa` |
| 7966 | `ajandaAcKapa` |
| 7994 | `ajandaGunDegistir` |
| 8001 | `ajandaBugune` |
| 8006 | `ajandaOlustur` |
| 8068 | `musteriKartVeZiyaretGecmisiniAc` |
| 8075 | `ziyaretTakvimAyDegistir` |
| 8083 | `tumZiyaretleriTopla` |
| 8095 | `ziyaretTakvimiOlustur` |
| 8169 | `ziyaretNotGosterGizle` |
| 8175 | `ziyaretGunPopupAc` |
| 8210 | `ziyaretGunKaydiSilHizli` |
| 8215 | `guncellemeyiUygula` |
| 8241 | `musteriKartAcAdIle` |
| 8250 | `ayBazliMudurPrimiGuncelle` |
| 8309 | `tarihIkiSatirFormat` |
| 8323 | `aySiparisleriAc` |
| 8355 | `istatistikHesapla` |
| 8356 | `hesapla` |
| 8369 | `kacanOzetRenderEt` |
| 8409 | `kacanDetayAc` |
| 8437 | `tsToDatetimeLocal` |
| 8443 | `kayitDuzenleAc` |
| 8472 | `kdUrunListesiRenderEt` |
| 8495 | `kdAlanGuncelle` |
| 8505 | `kdUrunSil` |
| 8510 | `kdUrunEkleAramaAcKapat` |
| 8521 | `kdUrunEkleFiltrele` |
| 8570 | `kdUrunEkle` |
| 8582 | `kayitDuzenleKaydetOrtak` |
| 8676 | `kayitDuzenleKaydet` |
| 8681 | `kayitDuzenleKaydetVeGonder` |
| 8688 | `istatistikKayitSil` |
| 8709 | `arsivKayitGeriYukle` |
| 8724 | `arsivGeriDon` |
| 8732 | `arsivSayaclariGuncelle` |
| 8745 | `arsivKategoriAc` |
| 8755 | `arsiveKaydet` |
| 8760 | `arsiveKaydetIletisimden` |
| 8765 | `benzersizKodUretTarihli` |
| 8776 | `eskiKayitlaraKodAta` |
| 8779 | `isle` |
| 8833 | `benzersizKodUret` |
| 8858 | `kodHtmlOlustur` |
| 8870 | `urunSetiImzaOlustur` |
| 8874 | `_arsiveKaydetIslem` |
| 8975 | `arsiveKaydetSonrasiSifirla` |
| 9001 | `arsivKayitSil` |
| 9012 | `renderArsiv` |
| 9052 | `hareketSecPopupAc` |
| 9057 | `hareketSecKapat` |
| 9061 | `hareketSecTuruSecildi` |
| 9116 | `islemiDuzenleVeIlerle` |
| 9164 | `islemiTekrarla` |
| 9202 | `arsivDetayAc` |
| 9210 | `arsivDetayKapat` |

## Refactor rule

Use this map to identify cohesive modules. Do not extract a function solely because it is nearby another function; inspect its callers, shared globals, Firebase/localStorage usage, and DOM dependencies first.
