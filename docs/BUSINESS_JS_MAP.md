# WE-CON-CRM Business JavaScript Map

Generated from the largest remaining inline application script on `project-context`.

- Script size: **421,551 bytes**
- Function declarations found: **423**

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
| 2084 | Mail/Mesaj (WhatsApp) temaslarında: yazılan metni ilgili uygulamada açar, |
| 2085 | ardından temas kaydını otomatik olarak (tarih/saatiyle) kaydeder. |
| 2099 | Not alanı boşsa, gönderilen metni otomatik olarak nota da yazalım (kayıt için) |
| 2102 | Tarih/saati "şimdi" olarak güncelle, sonra otomatik kaydet |
| 2141 | SÜREÇ TAKİBİ — aynı müşteri+ürün için NUMUNE→TEKLİF→PROFORMA→SİPARİŞ zincirini manuel bağlama |
| 2153 | secililer: [{tip, ts}, ...] |
| 2224 | Depolanan "23 Tem 2026 - 14:24" formatını "23.07.26 / 14-24" (2 satır) olarak kısaltır — sadece görünüm için, veri değişmez |
| 2232 | Bir kaydın "🔄 REVİZE" etiketine dokununca, o kaydın revize geçmişini |
| 2233 | (her revizeden önceki fiyat/ürün sayısı anlık görüntüsü) listeler. |
| 2277 | Uzun basma tetiklendiyse, aynı dokunuşun sonundaki normal "click"i yut (satır popup'ı açılmasın) |
| 2282 | Ürün ismine 600ms uzun basınca, ürünü doğrudan WEICON Türkiye'nin kendi site içi |
| 2283 | arama motorunda arar (weicon.com.tr/search?search=...). |
| 2284 | Abas kodu WEICON'un kendi ürün numarasıyla birebir aynı olduğu için (doğrulandı), |
| 2285 | varsa Abas koduyla aranır — bu kesin/birebir eşleşme sağlar. Abas yoksa isimle aranır. |
| 2373 | Alt kısımdaki tekli Revize butonu, listede en üstteki (en güncel) işlemi hedef alır |
| 2394 | Son ürün de silindiyse, artık boş kalan kaydın tamamını kaldır |
| 2662 | Önce kalıcı ID ile eşleştir, olmazsa isimle (başka cihaz sıralamayı değiştirmiş olabilir), o da olmazsa index'e düş |
| 2688 | Düzenlenen bilgi (özellikle şehir) İstatistik sayfasındaki Son İşlemler |
| 2689 | tablosuna da hemen yansısın — Firebase'in geri dönüşünü beklemeden. |
| 2963 | Son 10 işlem listesini de güncelle (müşteri filtresinden bağımsız) |
| 2978 | Arama yapılırken tüm eşleşen sonuçlar gösterilir, en son görüntülenen en üstte |
| 2983 | "Tüm Müşteriler" butonu ile açılan mod: hiçbir sınır yok, alfabetik sırayla tüm müşteriler listelenir (kaydırılabilir). |
| 2987 | Arama yokken sadece en son kayıt edilen 12 müşteri gösterilir (yeni kayıtlar listenin başına eklenir). |
| 2988 | Diğer tüm müşteriler sistemde kayıtlı kalmaya devam eder, sadece bu görünümde listelenmez. |
| 3001 | Ziyaret uyarısı |
| 3056 | Bu ay "kacan" (durum='kacan') olarak işaretlenmiş tüm kayıtların (tip fark |
| 3057 | etmeksizin — SİPARİŞ/TEKLİF/PROFORMA/NUMUNE) toplam kaybedilen tutarı. |
| 3089 | Arşiv kaydı, oluşturulduğu andaki müşteri ismini SABİT bir metin olarak saklar |
| 3090 | (kayit.musteri) — müşteri adı SONRADAN değiştirilirse/kısaltılırsa arşivdeki |
| 3091 | eski kayıtlar hâlâ ESKİ ismi gösterirdi. Şehir'de yaptığımız gibi, kaydın |
| 3092 | musteriId'si varsa GÜNCEL müşteri adını göstermek için bir harita kuruyoruz. |
| 3102 | "kacan" tüm türlerde olabilir, tip filtresi uygulanmaz |
| 3167 | Şehir hücresini "İlçe" (üst) / "İL" (alt, kalın) olarak iki satıra böler. |
| 3168 | Ham veri "ANKARA-Yenimahalle" gibi boşluksuz ve İL-önce sırayla kayıtlı |
| 3169 | olabiliyor — bu yüzden basit " - " ayırma yerine sehirFormatla ile aynı |
| 3170 | mantığı (TUM_ILLER listesinden hangi parça gerçek il, onu buluyoruz) kullanıp |
| 3171 | istenen sırada (önce ilçe, altta İL) gösteriyoruz. |
| 3187 | ÖNEMLİ: Sadece isme göre eşleştirme yapılırsa, bir müşterinin adı sonradan |
| 3188 | düzenlenip kısaltıldığında (örn. "Kozanoğlu Kozmaksan Hidrolik Pompa Ve Ara |
| 3189 | Sansıman..." → "Kozanoğlu Kozmaksan Hidrolik") arşivdeki eski kayıtlar hâlâ |
| 3190 | ESKİ ismi taşıdığı için eşleşme bozulur ve şehir "-" görünür. Bu yüzden önce |
| 3191 | müşteri ID'sine göre eşleştiriyoruz (ID isim değişse bile sabit kalır), |
| 3192 | sadece ID yoksa (çok eski kayıtlarda) isme düşüyoruz. |
| 3202 | BAĞLANTI TESPİTİ: aynı müşteri + en az bir ortak ürün (Berta kodu) paylaşan, bu kayıttan ÖNCEKİ bir kayıt var mı? |
| 3225 | İsim tam eşleşmedi (muhtemelen isim sonradan kısaltıldı/değiştirildi) — |
| 3226 | biri diğerinin başlangıcı mı diye kısmi eşleştirme dene, son çare. |
| 3259 | Artık her hücrenin etrafında renkli kutu değil — sadece satırın EN BAŞINDA |
| 3260 | (hareket/kod hücresinin sol kenarında) kalın, hareket türüne göre renkli |
| 3261 | tek bir çizgi var. Diğer hücreler ince, nötr gri çizgiyle ayrılıyor. |
| 3308 | Şu an hangi sayfada olduğumu gösteren şerit (Ana Sayfa'dayken zaten üstteki buton bunu gösterdiği için tekrar etmesin) |
| 3313 | Ana Sayfa'dayken bu şerit tamamen kaldırılır (sadece Ana Sayfa'ya özel): |
| 3314 | Geri \| Ana Sayfa (tam orta) \| Menü şeklinde 3 sütuna geçilir. |
| 3319 | Diğer tüm sayfalarda normal 4 eşit sütunlu düzen aynen çalışır. |
| 3326 | Sepet sayaçlarını yeniden doldur (dinamik olarak yeniden oluşturulduğu için) |
| 3346 | SAYFA GEÇMİŞİ — Geri tuşu için, hangi sayfalarda gezildiğini sırayla tutar |
| 3352 | Önce açık popup geçmişi var mı bak — varsa son adımı kapatıp bir önceki adımı |
| 3353 | (o an başka bir popup tarafından gizlenmiş olsa bile) olduğu gibi geri getirir. |
| 3394 | Extra action bar |
| 3447 | Önce localStorage'daki varsa göster (hız için) |
| 3452 | Firebase'den taze yükle + gerçek zamanlı dinle |
| 3494 | Basit şema kontrolü: ürün alanlarından hiç değilse biri her satırda olmalı |
| 3521 | Aynı dosyayı tekrar seçebilmek için sıfırla |
| 3530 | Kök dizinde eski ürün index'lerini bulup temizle, musteriler/arsiv'e dokunma |
| 3544 | Yeni ürünleri yaz |
| 3559 | Arama geçmişine kaydet |
| 3604 | ÖNEMLİ: id artık kataloğun benzersiz global index'inden üretiliyor (p+catalogIdx). |
| 3605 | Eskiden berta/abas kodu kullanılıyordu; katalogda mükerrer kod varsa farklı |
| 3606 | ürünler aynı id'yi paylaşıp sepette birbirinin yerine geçiyordu (toplu iskonto bug'ı). |
| 3627 | Zaten sepette — "EKLENDİ"ye tekrar dokunulunca seçim iptal olur, sepetten çıkar |
| 3639 | Arama kutusunu ve sonuç listesini sıfırla, bir sonraki ürünü hemen aramaya başlayabilsin |
| 3667 | Aynı ürün Hareket (Sepet) listesine de aktarılmışsa oradan da kaldır |
| 3678 | SEPET FİYAT GEÇMİŞİ UYARISI — sepetteki ürünlerden hangileri bu müşteriye daha önce satılmış/teklif edilmiş |
| 3722 | TABLO KAYDIRMA İKAZI — tablo yatayda sığmıyorsa sağda titreşen ok gösterir, sona kaydırılınca kaybolur |
| 3741 | Hareket listesinde henüz olmayan (bekleyen) sepet ürünlerini bul |
| 3762 | Önce HESAPLANDI (koyu yeşil) grup başlığı + satırlar |
| 3785 | Sonra HESAPLANACAK (sarı/bekleyen) grup başlığı + satırlar |
| 3880 | Mail/WhatsApp göndermeden, doğrudan arşive kaydetmek için — Gönder ile |
| 3881 | aynı ön kontrolleri (boş sepet, işlem türü seçilmedi, anomali) uygular. |
| 3901 | Kaydet öncesi son bir onay — yanlışlıkla tek dokunuşla kayıt gitmesin diye. |
| 3920 | ============================================================ |
| 3921 | ANOMALİ KONTROLÜ — Gönder'e basmadan önce kural tabanlı, anında, |
| 3922 | internetsiz kontrol: aşırı iskonto, zararına satış, son 7 günde |
| 3923 | aynı müşteriye aynı ürün tekrarı, alışılmadık yüksek adet. |
| 3924 | ============================================================ |
| 4000 | ============================================================ |
| 4001 | DERİN AI ANALİZİ — kural tabanlı kontrolün ötesinde, Gemini'ye |
| 4002 | "bu işlem ticari açıdan normal mi?" diye sorar. Sadece istenirse |
| 4003 | çalışır (otomatik değil), Cloudflare Worker kurulumu gerektirir. |
| 4004 | ============================================================ |
| 4060 | "🧹 Temizle" — Hesaplama ekranındaki tüm alanları ve aktarılan ürün bağını |
| 4061 | sıfırlar, böylece bir önceki ürünün liste/dip/iskonto/adet değerleri |
| 4062 | yanlışlıkla bir sonraki işleme karışmaz. |
| 4082 | HIZLI HESAPLA — müşteri/işlem türü seçmeden, direkt Hesapla ekranını açar; ürün arama o ekranın içinden yapılır |
| 4085 | SATIŞ MENÜSÜ — Müşteri / Ziyaret Takvimi / İstatistikler / Görevlerim tek buton altında |
| 4247 | Sepette bu ürünü gönderildi olarak işaretle |
| 4255 | Dip maliyet otomatik = liste × %36,35 |
| 4257 | Önceki üründen kalan iskonto oranı yeni ürüne sızmasın diye her yeni ürün aktarımında sıfırlanır. |
| 4284 | Otomatik dip maliyet = liste × %36,35 |
| 4291 | MÜŞTERİ BAZLI FİYAT GEÇMİŞİ — bu müşteriye bu ürün daha önce satılmış mı, en son kaça? |
| 4350 | Müşteri bazlı fiyat geçmişi uyarısı |
| 4373 | Fiyat geçmişi uyarısındaki "O Kaydı Görüntüle" bağlantısı: Hesaplama popup'ını |
| 4374 | kapatıp o ürünün daha önce daha yüksek fiyata satıldığı kaydı açar. |
| 4384 | "LİSTEYE EKLE" butonuna basılınca çağrılır: eğer bu ürün bu müşteriye daha |
| 4385 | önce daha yüksek fiyata satılmışsa, direkt eklemek yerine önce onay ister |
| 4386 | (Kapat = geri dön düzenle, Devam Et = yine de bu fiyatla ekle). |
| 4438 | Bekleyen ürün kalmadı - Ürün Bul sepetini de otomatik temizle |
| 4492 | Eşleşen sepet ürünü varsa "beklemede" durumuna geri al |
| 4512 | Aynı ürün Hesapla sayfasındaki bekleyen sepette (basket) de varsa oradan da kaldır |
| 4587 | KAYITLI (arşivlenmiş) bir işlem görüntüleniyorsa (tip/idx verilmişse) bu kaydın kendisi burada |
| 4588 | tek seferde tutulur — aşağıdaki tüm alanlar (yetkili dahil) buradan okunur, aksi halde o an aktif |
| 4589 | "Hesapla" ekranında başka bir müşteri için seçili duran bir yetkili kişi buraya sızabilir. |
| 4603 | Dinamik müşteri bilgileri (Yetkili Kişi/Telefon/E-Posta/Teslimat Adresi/Vade/Fatura/Kargo) — |
| 4604 | KAYITLI (arşivlenmiş) bir işlem görüntüleniyorsa aşağıdaki aktifKayit'ten okunur. |
| 4612 | Telefon/e-posta arşivde ayrı saklanmıyor — o kaydın ait olduğu müşterinin kişi listesinden, |
| 4613 | isim eşleşmesiyle bulunur. Eşleşme yoksa boş bırakılır (yanlış kişinin bilgisini göstermemek için). |
| 4751 | --- Kaçan Sipariş işaretleme ------------------------------------------- |
| 4809 | -------------------------------------------------------------------------- |
| 4811 | Kaydı İptal veya İade olarak işaretler (kayıt SİLİNMEZ, listede üzeri çizili görünür). |
| 4812 | Aynı duruma tekrar dokunulursa işaret kaldırılır (normale döner). |
| 4860 | Açık süreç bannerındaki tarih/tip satırına dokununca o kaydın fatura önizlemesini İlerlet butonuyla birlikte açar |
| 4947 | --- Mesaj Şablonları (kullanıcı özelleştirebilir) ------------------------- |
| 4989 | ----------------------------------------------------------------------- |
| 5044 | HTML önizleme - başlıkları kırmızı kalın, ürün isimlerini kalın+%30 büyük yap |
| 5081 | Mail metnini "ÜRÜN LİSTESİ VE DETAYLARI" kısmından önce kes - o kısmın yerini PNG alacak |
| 5112 | Kod üzerinden bu belgenin revize edilip edilmediğini arşivden bul |
| 5153 | Alt çizgili (underline) etiket+değer kutusu — referans görseldeki gibi |
| 5303 | TABLOYU KOPYALA / İNDİR — müşteriden gelen bir maile aynı zincir üzerinden |
| 5304 | yanıt vermek için, hareket tablosunu resim olarak panoya kopyalama veya |
| 5305 | PNG olarak indirme imkânı sağlar (yeni mail göndermeden, mevcut yanıt |
| 5306 | penceresine yapıştırılabilir/eklenebilir). |
| 5425 | MAIL ve WHATSAPP: telefonun paylaşım penceresi kullanılıyor — PNG resim |
| 5426 | otomatik ekleniyor, "title" olarak Konu da gönderiliyor (Gmail çoğunlukla |
| 5427 | bunu Konu alanına yazar). Web paylaşım penceresinde "Kime" diye bir alan |
| 5428 | olmadığı için o kısım (ofis@weicon.com.tr) mail uygulamasında elle girilmeli. |
| 5430 | Paylaşım penceresi HEMEN tetiklenmeli (kullanıcı dokunuşu izni süresi kısa). |
| 5431 | Arşivleme, paylaşımın sonucunu beklemeden hemen arkasından (ufak bir gecikmeyle) çalışır; |
| 5432 | böylece ne paylaşım penceresi engellenir ne de arşivleme arka plana atılınca kaybolur. |
| 5444 | Paylaşım desteklenmiyorsa, en son çare olarak indir + wa.me/mailto ile aç |
| 5462 | ============================================================ |
| 5465 | ŞEHİR FORMATLAMA — nasıl girilmiş olursa olsun İl her zaman büyük harf ve başta gösterilir |
| 5490 | İki cihaz aynı anda FARKLI arşiv kayıtlarını değiştirirse/silerse/eklerse |
| 5491 | birbirinin işlemini kaybetmesin diye: Firebase'e yazmadan hemen önce |
| 5492 | sunucudaki EN GÜNCEL arşivi çekip, sadece BU işlemin değişikliklerini |
| 5493 | (bir veya daha fazla tip içinde eklenen/güncellenen/silinen kayıtlar) o |
| 5494 | güncel arşivin içine "kod" (veya kod yoksa "ts") ile eşleştirerek |
| 5495 | uygulayıp öyle yazıyoruz. Eskiden bu cihazdaki (bayat olabilecek) local |
| 5496 | arsivData komple üzerine yazılıyordu ve diğer cihazın az önce farklı bir |
| 5497 | tipe/kayda yaptığı değişiklik sessizce kaybolabiliyordu. |
| 5498 | degisiklikler: {tip, kayit} \| {tip, silinecekKod} \| {tip, silinecekTs} \| dizi |
| 5534 | Sunucudan taze veri çekilemezse (yetki/ağ hatası vb.), işlemi tamamen |
| 5535 | kaybetmemek için kuyruğa alıyoruz — bir sonraki senkronda güvenli |
| 5536 | birleştirme ile tekrar denenecek (komple arşiv ile üzerine yazmıyoruz). |
| 5560 | Tüm kategorilerde ara |
| 5696 | "İş günü" penceresi: her gün sabah 09:00'da sıfırlanır, ertesi gün sabah 06:00'a |
| 5697 | kadar o günün verilerini göstermeye devam eder. 06:00-09:00 arası (yeni gün henüz |
| 5698 | başlamadan önceki geçiş aralığı) hiçbir iş günü aktif değildir, gösterge boş kalır. |
| 5778 | Diğer panelleri (Ziyaret Takvimi, Ajanda) kapat |
| 5794 | ============ ARAÇ KM TAKİBİ ============ |
| 5798 | Değişen günleri biriktirir — debounce'lu kmAylikTabloKaydet çağrılmadan hemen |
| 5799 | önce hangi TEK günün/günlerin değiştiğini işaretlemek için kullanılır, böylece |
| 5800 | güvenli-birleştirme fonksiyonu tüm ayı değil sadece bu günleri uygular. |
| 5807 | KM Takip — güvenli birleştirme (müşteri/arşiv'de kullandığımız aynı desen): |
| 5808 | yazmadan önce sunucudaki EN GÜNCEL tüm ay verisini çekip, sadece BU an |
| 5809 | değişen günü/günleri onun içine uygulayıp öyle yazıyoruz. ESKİDEN cihazın |
| 5810 | belleğindeki (kmTakipKayitlariObj) TÜM ay ham olarak üzerine yazılıyordu — |
| 5811 | bellek eksik/bayat olduğunda (örn. sayfa yeni açılmışken Firebase henüz tam |
| 5812 | senkron olmadan bir alana dokunulursa) diğer günlerin verisi sessizce |
| 5813 | TAMAMEN kaybolabiliyordu. Bu fonksiyon tek bir günü bile asla toptan silmez. |
| 5834 | Sunucudan taze veri çekilemezse (yetki/ağ hatası vb.), işlemi tamamen |
| 5835 | kaybetmemek için kuyruğa alıyoruz — bir sonraki senkronda güvenli |
| 5836 | birleştirme ile tekrar denenecek (komple ay ile üzerine yazmıyoruz). |
| 5856 | Bugünün araç KM kaydı girilip "Günü Kaydet" ile onaylanmış mı? Girilmediyse |
| 5857 | uygulamanın geri kalanı kilitlenir — kullanıcı önce KM fotoğrafını çekip |
| 5858 | kaydetmeden başka hiçbir işlev kullanamaz. |
| 5865 | "1 Saat Ertele" — araç şu an yanında değilse kilidi geçici olarak (60 dk) askıya alır. |
| 5866 | Süre dolunca kilit otomatik geri döner. |
| 5947 | Aylık tabloda bu arada değişiklik yapılmış olabilir (KM/Saat) — güncel |
| 5948 | veriyle yeniden yükle ki BAŞLANGIÇ/BİTİŞ KM kutuları hemen yansısın. |
| 5965 | YENİ MANTIK: Bir günün fotoğraflanan KM'si O GÜNÜN BAŞLANGICI'dır (istisnasız). |
| 5966 | Bir günün BİTİŞ KM'si ise SONRAKİ günün fotoğraflanan (başlangıç) değeridir. |
| 5967 | Bu yüzden "bitiş" için artık ileri yönlü arama gerekiyor. |
| 5980 | "Bir önceki tarih" burada TAKVİMDE dünü değil, kayıtlı olan EN YAKIN önceki |
| 5981 | günü ifade eder (araya boş — fotoğrafsız — günler girse bile). Sistem sadece |
| 5982 | fotoğrafın çekildiği günleri baz alır, aradaki tarihler tabloda hiç yer almaz. |
| 5984 | "YYYY-MM-DD" formatındaki bir tarih anahtarını N gün kaydırıp yeni anahtarı döndürür. |
| 5992 | Bitiş KM - Başlangıç KM farkını verir. Değerlerden biri boş/geçersizse null döner. |
| 6001 | Bir günün kaydını, otomatik kurallara göre yeniden hesaplar: |
| 6002 | 1) Başlangıç KM boşsa, bir önceki günün Bitiş KM'si otomatik yazılır. |
| 6003 | 2) Bitiş KM - Başlangıç KM farkı, o gün için seçili kategoriye (İş/Özel) |
| 6004 | göre ilgili alana otomatik yazılır, diğer alan temizlenir. |
| 6022 | Bir günün Bitiş KM'si girildiğinde/değiştiğinde, bir SONRAKİ günün Başlangıç |
| 6023 | KM'sini otomatik olarak bu değere eşitler (araç kilometresi fiziksel olarak |
| 6024 | süreklidir: bugünün bitişi = yarının başlangıcı). |
| 6041 | YENİ MANTIKTA ARTIK GEREKSİZ: her gün kendi fotoğrafıyla kendi başlangıcını taşıyor, |
| 6042 | önceki bir kayda bağımlı değil. Fonksiyon geriye dönük uyumluluk için duruyor ama hep false döner. |
| 6083 | Kayıt henüz oluşturulmamışsa: Pazartesi-Cuma (hafta içi) "Normal İş Günü", |
| 6084 | Cumartesi/Pazar "Hafta Sonu Tatil" olarak otomatik seçilir. |
| 6096 | TARİH kutusu artık sistem tarihini değil, "Tarih ve Saat Gir" ile ÇEKİLEN |
| 6097 | fotoğraftan okunan tarihi gösterir. Henüz fotoğraf çekilmediyse boş kalır. |
| 6118 | Tarih navigasyonunun altında, görüntülenen günden BİR ÖNCEKİ günün |
| 6119 | başlangıç/bitiş/toplam km özetini gösterir. |
| 6151 | Gün zaten kaydedilmiş olsa bile (kilitli görünüm), Gün Tipi değişikliği |
| 6152 | anında sessizce kaydedilir — kullanıcı tekrar "Günü Kaydet"e basmak zorunda kalmaz. |
| 6169 | Artık alanlar arasında zorla sıralama YOK — kullanıcı istediği alana |
| 6170 | istediği sırayla girebilir. Bu fonksiyon sadece görsel/erişilebilirlik |
| 6171 | için tüm alanların açık kaldığından emin olur (geçmiş sürümle uyum için |
| 6172 | tutuluyor, çağıran yerler dokunulmadan bırakıldı). |
| 6187 | Kaydet sırasında eksik çıkan alanları kırmızı çerçeveyle işaretler ve |
| 6188 | ilk eksik alana ekranı kaydırır. Kullanıcı o alana bir şey yazdığı an |
| 6189 | kırmızı çerçeve otomatik kalkar. |
| 6219 | NOT: "kmGunTipiSelect" (Gün Tipi) ve "kmKategoriSelect" (İş/Özel KM) BİLİNÇLİ |
| 6220 | olarak bu kilit listesinde YOK — gün kaydedilse bile bu iki seçim kutusu her |
| 6221 | zaman açık/değiştirilebilir kalır (aşağıdaki onchange'ler değişikliği anında |
| 6222 | sessizce kaydeder, "Günü Kaydet"e tekrar basmaya gerek kalmaz). |
| 6236 | Bugünün kaydı zaten yapılmışsa TÜM alanlar kilitlenir (yanlışlıkla |
| 6237 | bozulmasın diye). Tek bir "Düzenle" tuşu YOK — her alan kendi başına, |
| 6238 | üzerine 5 saniye BASILI TUTULARAK açılır; sadece o hücre aktif olur ve |
| 6239 | elle giriş yapılabilir. Bu kilit, ertesi günün sabah ilk KM girişine |
| 6240 | kadar (yani gün değişip yeni bir kayıt başlayana kadar) geçerlidir. |
| 6256 | Her kilitli alana bir kere bağlanır (sayfa açılışında). Alan disabled |
| 6257 | iken 5 saniye basılı tutulursa sadece o alanın kilidi açılır. |
| 6293 | BAŞLANGIÇ KM artık BUGÜNÜN KENDİ okunan değeri (KM Gir ile girilen/fotoğraflanan) |
| 6298 | BİTİŞ KM artık SONRAKİ günün okunan değeri — henüz o gün gelmediyse "—" |
| 6305 | En son KM kaydı girilmiş günden bir sonraki (boş) günü bulur. Hiç kayıt |
| 6306 | yoksa bugünü döner. Bulunan gün bugünden ileriyse (gelecek), bugüne sabitlenir. |
| 6307 | NOT: Eskiden burada "kmSonrakiBosGunuBul()" adlı bir fonksiyon vardı; okunan KM'yi |
| 6308 | "son kayıtlı günden sonraki ilk BOŞ güne" yerleştiriyordu. Bu YANLIŞTI — fotoğrafsız |
| 6309 | (es geçilen) günleri geçmişe dönük doldurmaya çalışıyor, bugünün okumasını yanlış bir |
| 6310 | güne yazabiliyordu. Artık kmFotoSecildi() doğrudan cihazın GERÇEK bugünkü tarihini |
| 6311 | kullanıyor, bu fonksiyona gerek kalmadı. |
| 6313 | KM/Tarih-Saat fotoğrafından okuma (kartFotoGonder ile aynı Cloud Function, "kmOku" hedefi) |
| 6322 | ÖNEMLİ: Fotoğraf hangi gün çekiliyorsa, okuma HER ZAMAN o günün |
| 6323 | (cihazın GERÇEK bugünkü tarihinin) kaydı olur — "son kayıtlı günden |
| 6324 | sonraki boş gün" gibi bir arayışla GEÇMİŞTEKİ bir güne asla yazılmaz. |
| 6325 | Fotoğrafsız günler otomatik olarak es geçilir (o gün km yapılmamış |
| 6326 | sayılır) — aradaki boşluk hiçbir zaman doldurulmaya çalışılmaz. |
| 6336 | KM okunur okunmaz, diğer alanlar (güzergah, ziyaret vb.) boş kalsa bile |
| 6337 | sessizce kaydet — böylece Aylık Rapor'a KM hemen yansır, geri kalanı |
| 6338 | gün içinde doldurulup normal "KM Kaydet" ile tamamlanabilir. |
| 6355 | KM fotoğrafı çekilip okunduğu ANDAKİ cihaz tarih/saatini TARİH ve SAAT |
| 6356 | kutularına otomatik yazar — bu, km okuma anının kaydıdır. |
| 6371 | KM okuma tuşunu "KM Gir" (fotoğraf çek) durumundan "KM Kaydet" durumuna |
| 6372 | çevirir — km başarıyla okunup alana yazıldıktan sonra çağrılır. |
| 6381 | KM okuma tuşunu tekrar "KM Gir" (fotoğraf çek) durumuna döndürür — |
| 6382 | yeni bir güne geçildiğinde veya kayıt henüz yapılmamışken çağrılır. |
| 6436 | Boş bir gün ise (hiçbir şey girilmemiş, normal tipte) kaydı sil |
| 6458 | Aylık tablo artık Excel çıktısıyla BİREBİR AYNI 8 sütun: Tarih \| Başlangıç-Bitiş |
| 6459 | Saati \| Seyir Güzergahı \| Ziyaret Yerleri \| Başlangıç KM \| Bitiş KM \| İş KM \| Özel KM. |
| 6460 | Gün Tipi seçimi Tarih hücresinin altına küçük bir kutu olarak gömülüdür (ayrı |
| 6461 | sütun DEĞİL). Kategori (İş/Özel) seçimi de İş KM / Özel KM hücresine dokunularak |
| 6462 | yapılır — ayrı bir Kategori sütunu yoktur. Böylece görünen sütunlar Excel ile |
| 6463 | tıpatıp aynıdır; ekstra alanlar sadece hücre içi küçük kontrollerdir. |
| 6483 | Sistem SADECE fotoğrafın çekildiği (kaydın gerçekten girildiği) günleri baz |
| 6484 | alır — takvimde ardışık gitmek zorunda değil. Fotoğraf/kayıt olmayan bir gün |
| 6485 | (bugün dahil) tabloda hiç görünmez, aradaki tarihler tamamen atlanır. |
| 6492 | Excel/tablo görünümüyle birebir: hücreler düz görünür (görünmez kenarlıklı, |
| 6493 | saydam zeminli input), sadece odaklanınca hafif çerçeve belirir. |
| 6517 | OTOMATİK KURALLAR: |
| 6518 | 1) Bir günün Başlangıç KM'si boşsa, bir önceki günün Bitiş KM'si otomatik |
| 6519 | olarak o kutuya yazılır (araç kilometresi süreklidir). |
| 6520 | 2) Bitiş KM - Başlangıç KM farkı, o gün için seçili kategoriye (İş/Özel |
| 6521 | KM hücresine dokunarak seçilir) göre otomatik olarak ilgili hücreye |
| 6522 | yazılır. Kullanıcı isterse üzerine yazıp elle değiştirebilir. |
| 6539 | Elle Bitiş KM girilmemişse: Günlük Kayıt'tan gelen bir sonraki günün |
| 6540 | KENDİ KM okuması otomatik olarak bu günün Bitiş KM'si sayılır |
| 6541 | (araç kilometresi süreklidir — bugünün bitişi = yarının okuması). |
| 6581 | Herhangi bir satıra BASILI TUTULURSA (500ms), o günün tüm bilgilerini tek |
| 6582 | popup'ta düzenleyebileceğimiz ekranı açar. Var olan hücre-içi düzenleme |
| 6583 | (input'a dokunup yazma) de aynen çalışmaya devam eder. |
| 6585 | ÖNEMLİ DÜZELTME: Eskiden dokunma anında tarayıcı hücreyi HEMEN odaklayıp |
| 6586 | klavyeyi açıyordu (native davranış), biz 500ms sonra popup'ı bunun ÜSTÜNE |
| 6587 | açıyorduk — bu da "popup, kutunun içine giriyor ve yanlış yazıma neden |
| 6588 | oluyor" şikayetine yol açıyordu. Artık dokunma anında native odaklanmayı |
| 6589 | BİZ engelliyoruz (preventDefault); basılı tutma tamamlanmadan parmak |
| 6590 | kalkarsa (kısa/normal dokunuş) hücreyi KENDİMİZ odaklıyoruz — yani tek |
| 6591 | dokunuşla düzenleme aynen çalışır ama klavye popup'la asla çakışmaz. |
| 6592 | Sürükleme/scroll varsa basılı tutma iptal edilir. |
| 6612 | Kısa dokunuş — popup açılmadı, normal düzenleme odaklanmasını biz tetikliyoruz. |
| 6623 | Parmağın en ufak titremesinde (gerçek kaydırma olmadan) basılı tutma iptal |
| 6624 | OLMASIN diye 12px'lik bir eşik mesafe var — sadece bu eşiği aşan gerçek |
| 6625 | bir sürükleme/scroll hareketinde basılı tutma iptal edilir. |
| 6636 | Masaüstü/mouse ile test için: burada native odaklanma zaten sorun |
| 6637 | yaratmadığından preventDefault gerekmez, davranış olduğu gibi bırakıldı. |
| 6646 | Düzenleme sırasında odak kaybolmasın diye, aynı hücreye tekrar odaklan |
| 6653 | İş KM / Özel KM hücresine dokunularak o günün kategorisini seçme (ayrı bir |
| 6654 | Kategori sütunu olmadan, Excel'deki 8 sütun görünümünü bozmadan). |
| 6672 | Tablodaki herhangi bir hücre değiştirildiğinde çağrılır: ilgili günün |
| 6673 | kaydını (yoksa oluşturarak) günceller, yerelde ve Firebase'de saklar, |
| 6674 | başlangıç/bitiş KM zincirinin doğru görünmesi için tabloyu yeniden çizer. |
| 6675 | "+ Gün Ekle" kutusu: tablo artık sadece kayıtlı günleri gösterdiği için, izin/tatil |
| 6676 | gibi Günlük Kayıt'tan geçmeyen bir günü elle eklemek istediğinde bu kullanılır. |
| 6677 | Seçilen tarih için (henüz kaydı yoksa) boş bir kayıt oluşturur, gerekiyorsa o ayı |
| 6678 | gösterir ve tabloyu yeniden çizip o günün Başlangıç KM alanına odaklanır. |
| 6731 | Başlangıç/Bitiş KM değiştiyse, o günün İş/Özel KM farkını seçili |
| 6732 | kategoriye göre otomatik yeniden hesapla. |
| 6736 | Bugünün Bitiş KM'si, yarının Başlangıç KM'sine otomatik aktarılır. |
| 6746 | Aynı anda açık olan Günlük Kayıt ekranı bu güne bakıyorsa, orayı da tazele. |
| 6754 | Bu genel kaydetme birden çok yerden (hücre düzenleme, gün ekleme/silme, |
| 6755 | zincirleme bitiş-KM aktarımı) çağrılıyor — hangi günlerin değiştiğini |
| 6756 | kmBekleyenDegisiklikler kuyruğu tutuyor. Kuyrukta bir şey varsa SADECE o |
| 6757 | günleri güvenli birleştirerek yazıyoruz (tüm ayı ham üzerine yazmıyoruz). |
| 6758 | Kuyruk boşsa (bilinmeyen bir çağrı yolu), son çare olarak eski davranışa |
| 6759 | (ham üzerine yazma) düşüyoruz — ama bu artık istisna, kural değil. |
| 6770 | Bir güne BASILI TUTULUNCA açılan tam-detay düzenleme popup'ı — o günün TÜM |
| 6771 | alanlarını (gün tipi, saat, güzergah, ziyaret yerleri, başlangıç/bitiş KM, |
| 6772 | iş/özel KM, kategori) tek ekranda gösterir ve hepsini birden değiştirmeyi |
| 6773 | sağlar. Geçmişe dönük herhangi bir günü (bugün olmasa bile) düzenlemek için. |
| 6828 | "🗑 Bu Günü Tamamen Sil" — önce net bir onay ister (kalıcı silme, geri |
| 6829 | alınamaz), onaylanırsa kaydı tamamen kaldırır ve tabloyu yeniden çizer. |
| 6844 | Ana Sayfa'dan doğrudan Aylık (düzenlenebilir) tabloya geçiş |
| 6930 | Kolon başlıkları satırı (3. satır, 0-index BAS_SATIR-1): açık mavi zemin, kalın, ortalı. |
| 6942 | Veri satırları: tek satır, kenarlıklı, Tarih sola / diğerleri ortaya hizalı. |
| 6962 | ============ ZİYARET TAKVİMİ ============ |
| 6990 | Diğer panelleri (Aylık Özet, Ajanda) kapat |
| 7007 | ============ GÜNLÜK AJANDA ============ |
| 7021 | Diğer panelleri (Aylık Özet, Ziyaret Takvimi) kapat |
| 7126 | Tüm müşterilerin ziyaretGecmisi'ni tek düz listeye toplar: {musteri, sehir, ts, not} |
| 7146 | Pazartesi=0 olacak şekilde haftanın gününü ayarla |
| 7182 | Özet tablo: bu ay toplamı + bu hafta (son 7 gün, tüm ziyaretler üzerinden gerçek zamana göre) |
| 7194 | 15+ gündür ziyaret edilmeyenler (tüm müşteriler üzerinden, ay'dan bağımsız gerçek zaman) |
| 7411 | ❌ Kaçan Siparişler özeti: bu ayki sayı/tutar, kaybedilme sebebi dağılımı, |
| 7412 | rakip firma dağılımı ve Teklif→Sipariş dönüşüm oranı. |
| 7451 | "KAÇAN İŞLEM" kutusuna dokununca — bu ayki kaçan kayıtların listesi (sebep, |
| 7452 | rakip firma, tutar dahil) ayrı bir popup'ta açılır. |
| 7478 | KAYIT DÜZENLEME — geçmişte yanlış kaydedilmiş bir işlemi manuel düzeltmek için |
| 7508 | Bu modalı tetikleyebilecek tüm üst popup'lar kapatılır — aksi halde |
| 7509 | Revize tuşuna basınca bu modal arkada açılır, görünmez kalır. |
| 7671 | Tip veya tarih değiştiyse belge kodu da (SIP/TEK/PRO/NUM + tarih + sıra) |
| 7672 | yeni duruma göre tazelenir, aksi halde eski koddaki tarih/tip yanıltıcı kalır. |
| 7884 | Firebase'e artık TÜM sayaçlar nesnesi komple üzerine yazılmıyor — sadece bu |
| 7885 | tipin sayacı, sunucuda ATOMİK olarak (transaction) en az bu değere yükseltiliyor. |
| 7886 | Böylece iki cihaz aynı anda kod üretse bile birbirinin artışını silmiyor |
| 7887 | (eskiden fbSet ile komple nesne yazıldığında diğer cihazın az önce yaptığı |
| 7888 | artış sessizce kaybolabiliyordu). |
| 7935 | Aynı gün + aynı müşteri + aynı işlem türü + BİREBİR AYNI ürün seti (Berta/Abas |
| 7936 | kodlarına göre — sadece adet/iskonto/fiyat farkı olabilir, ürün eklenip/çıkarılmamış |
| 7937 | olmalı) bulunursa ikinci bir evrak açmak yerine mevcut kaydı güncelleyip REVİZE damgası |
| 7938 | basıyoruz. Böylece unutularak art arda gönderilen aynı sipariş, mükerrer kayıt olmuyor. |
| 7957 | REVİZE GEÇMİŞİ: üzerine yazmadan önce eski hâli (fiyat/ürün seti + zaman) |
| 7958 | revizeGecmisi dizisine ekleniyor — böylece bir teklif/sipariş birden |
| 7959 | fazla kez revize edilse bile önceki fiyatların tamamı kayboluyor değil, |
| 7960 | "v1 → 1.250€, v2 → 1.180€" gibi bir tarihçe olarak saklanıyor. |
| 7988 | "İlerlet" ile (Numune→Teklif→Proforma→Sipariş) hazırlanan bir belgeyse, eski aşamanın |
| 7989 | kaydını arşivden SİL — artık iki ayrı kayıt değil, tek kayıt yeni türe dönüşmüş olur. |
| 8016 | Arşive gitme - sadece bildir |
| 8082 | ============================================================ |
| 8085 | Bir teklif/numune/proforma kaydını "düzenlenebilir" (bekleyen) halde Sepet'e taşır, |
| 8086 | ürünlere dokunup gramaj/ürün değiştirilebilir, hesaplandıktan sonra hedef SİPARİŞ olarak gönderilir. |
| 8087 | ============================================================ |
| 8088 | HAREKET SEÇ — Müşteri kartı / İşlem Geçmişi / İstatistikler'den ulaşılan |
| 8089 | TEK ORTAK akış: bir kaydın (teklif/numune/proforma/sipariş) ürünlerini, |
| 8090 | MEVCUT fiyat/iskonto/adediyle DOĞRUDAN hesaplanmış olarak Sepet'e yükler. |
| 8091 | Hiçbir ürünü yeniden hesaplamaya zorlamaz — değişecek ürün varsa |
| 8092 | kullanıcı sadece o ürüne dokunup düzenler, diğerleri olduğu gibi kalır. |
| 8093 | ============================================================ |
| 8124 | Ürünleri mevcut fiyat/iskonto/adediyle DOĞRUDAN HESAPLANMIŞ (yeşil) olarak yükle. |
| 8174 | Ürünleri HESAPLANMIŞ olarak değil, BEKLEYEN (sarı) olarak sepete koy — |
| 8175 | böylece her ürüne dokunup "✏️ Düzenle" ile farklı bir ürün/gramaj seçilebilir. |
| 8190 | Hedef işlem türünü SİPARİŞ olarak ayarla (teklif/numune/proforma -> sipariş dönüşümü) |
| 8214 | Müşteriyi bul (kayıtlı müşteri listesinde varsa tam profiliyle, yoksa kayıttaki bilgilerle) |
| 8223 | Ürünleri hareket listesine yükle (tarih, gönderim anında otomatik bugünün tarihi olacak) |
| 8228 | İşlem türünü kayıttaki türle eşle |
| 8233 | Vade/Fatura/Kargo/Yetkili'yi kaydın kendi değerleriyle güncelle (müşteri profilindeki genel değerler yerine) |

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
| 1945 | `resimSikistir` |
| 1964 | `ziyaretFotoSecildi` |
| 1993 | `ziyaretFotoSil` |
| 2002 | `ziyaretFotoGaleriOlustur` |
| 2021 | `ziyaretFotoBuyukGoster` |
| 2028 | `yetkiliKisiEtiketGuncelle` |
| 2040 | `yetkiliKisiTemizle` |
| 2047 | `ziyaretKisiEtiketGuncelle` |
| 2058 | `ziyaretKisiTemizle` |
| 2063 | `ziyaretTurSeciciOlustur` |
| 2077 | `ziyaretTurSec` |
| 2086 | `ziyaretMesajGonder` |
| 2109 | `musteriKartZiyaretAc` |
| 2130 | `musteriGecmisIslemleriAc` |
| 2142 | `surecleriGetir` |
| 2143 | `surecleriKaydet` |
| 2145 | `musteriSurecleriniGetir` |
| 2152 | `kayitlariSureceBagla` |
| 2177 | `surecListesiRenderEt` |
| 2205 | `surecAsamaDetayAc` |
| 2225 | `revizeTarihSaatFormatla` |
| 2234 | `revizeGecmisiGoster` |
| 2249 | `tarihKisalt` |
| 2269 | `uzunBasiBaslat` |
| 2273 | `uzunBasiBitir` |
| 2276 | `uzunBasiTikSonrasi` |
| 2286 | `urunAdiniWeiconDaAra` |
| 2294 | `musteriGecmisRenderEt` |
| 2386 | `musteriGecmisUrunSil` |
| 2412 | `musteriGecmisIslemDetayAc` |
| 2421 | `musteriGecmisIslemleriGeriDon` |
| 2426 | `musteriGecmisIslemleriKapat` |
| 2430 | `musteriZiyaretKapat` |
| 2435 | `ziyaretKaydiDuzenle` |
| 2462 | `ziyaretKaydiSil` |
| 2470 | `guncellemeyiUygula` |
| 2499 | `musteriZiyaretKaydet` |
| 2517 | `guncellemeyiUygula` |
| 2562 | `musteriZiyaretGecmisiAc` |
| 2596 | `musteriZiyaretGecmisiGeriDon` |
| 2601 | `musteriZiyaretGecmisiKapat` |
| 2605 | `musteriKartDuzenleAc` |
| 2613 | `musteriKartSilAc` |
| 2623 | `musteriSilOnayEvet` |
| 2629 | `musteriDuzenle` |
| 2646 | `musteriDuzenleKaydet` |
| 2661 | `guncellemeyiUygula` |
| 2705 | `musteriDuzenleKapat` |
| 2709 | `musteriSil` |
| 2727 | `musteriGeriYukle` |
| 2742 | `musteriSecimiTemizle` |
| 2748 | `musteriBilgiKutusu` |
| 2755 | `musteriSeritiGuncelle` |
| 2776 | `islemleriTemizle` |
| 2810 | `anaMenudenZiyaretEkleBaslat` |
| 2819 | `ziyaretGunicinEkleBaslat` |
| 2831 | `musteriSecimBaslat` |
| 2836 | `musteriIslemBaslatKarttan` |
| 2853 | `islemBaslatModalAc` |
| 2867 | `islemBaslatAcikSurecGoster` |
| 2879 | `islemBaslatSecildi` |
| 2904 | `islemBaslatModalKapat` |
| 2908 | `musteriSecimYap` |
| 2954 | `musteriListesiniRenderEt` |
| 3028 | `sonIslemFiltreDegisti` |
| 3033 | `buAyinHareketToplami` |
| 3058 | `buAyinKacanToplami` |
| 3082 | `sonIslemleriRenderEt` |
| 3172 | `sehirIkiSatirHtml` |
| 3203 | `baglantiBul` |
| 3281 | `sonIslemDetayAc` |
| 3285 | `tamSifirla` |
| 3303 | `navTabsGuncelle` |
| 3331 | `updateHareketSayac` |
| 3339 | `navigatePage` |
| 3351 | `geriGit` |
| 3376 | `switchTab` |
| 3446 | `loadCatalogFromMemory` |
| 3454 | `dinlemeyeBasla` |
| 3486 | `processJsonUpload` |
| 3525 | `urunListesiniFirebaseGonder` |
| 3556 | `performFilter` |
| 3621 | `addToBasket` |
| 3648 | `updateBasketCount` |
| 3663 | `removeFromBasket` |
| 3681 | `sepetFiyatGecmisiUyariKapat` |
| 3687 | `sepetFiyatGecmisiUyariGuncelle` |
| 3723 | `hareketTabloKaydirmaKontrol` |
| 3732 | `renderBirlesikTablo` |
| 3821 | `renderBasket` |
| 3822 | `renderHareket` |
| 3824 | `anaMenuPopupAc` |
| 3832 | `yarimKalanIslemUyariGoster` |
| 3837 | `yarimKalanIslemDevamEt` |
| 3842 | `yarimKalanIslemIptalEt` |
| 3855 | `iletisimIslemleriPopupAc` |
| 3874 | `fiyatGorunumuSec` |
| 3882 | `hesaplaKaydetTikla` |
| 3902 | `kaydetOnayPopupAc` |
| 3912 | `kaydetOnayModalKapat` |
| 3915 | `kaydetOnayla` |
| 3925 | `hareketAnomaliKontrolEt` |
| 3969 | `anomaliUyariPopupGoster` |
| 3981 | `anomaliUyariGormezdenGel` |
| 3991 | `anomaliUyariGeriDon` |
| 3995 | `anomaliUyariKapat` |
| 4005 | `anomaliDerinAnalizIste` |
| 4048 | `hesaplaPopupAc` |
| 4063 | `hesaplamaTemizle` |
| 4078 | `listeyeEkleButonGuncelle` |
| 4086 | `satisMenusuAc` |
| 4089 | `satisMenusuKapatVeGit` |
| 4094 | `hizliHesaplaAc` |
| 4113 | `hizliHesaplaUrunAramaAc` |
| 4120 | `hizliHesaplaFiltrele` |
| 4169 | `hizliHesaplaUrunSec` |
| 4188 | `hesaplaPopupKapat` |
| 4198 | `sepetBekleyenModalAc` |
| 4228 | `sepettenSil` |
| 4246 | `sepettenHesaplaAktar` |
| 4269 | `aktarilanUrununSil` |
| 4279 | `fmt` |
| 4281 | `listeFiyatGuncelle` |
| 4293 | `musteriUrunFiyatGecmisiBul` |
| 4316 | `fiyatGecmisiKontrolEt` |
| 4326 | `hesapla` |
| 4375 | `oncekiSatisKaydinaGit` |
| 4387 | `listeyeEkleTikla` |
| 4403 | `fiyatDusuklukOnayKapat` |
| 4408 | `fiyatDusuklukOnayDevamEt` |
| 4414 | `hareketeSaklar` |
| 4451 | `islemTuruModalAc` |
| 4454 | `islemTuruModalKapat` |
| 4458 | `islemTuruRenkGuncelle` |
| 4471 | `modSec` |
| 4488 | `hareketDuzenle` |
| 4509 | `harekettenSil` |
| 4527 | `hareketUrunModalAc` |
| 4554 | `faturaOnizlemeHtmlOlustur` |
| 4727 | `faturaOnizlemePopupGoster` |
| 4752 | `kacanIsaretlePopupAc` |
| 4765 | `kacanIsaretleModalKapat` |
| 4768 | `kacanIsaretleKaydet` |
| 4791 | `kacanIsaretiKaldir` |
| 4813 | `faturaOnizlemedenDurumIsaretle` |
| 4833 | `faturaOnizlemedenSil` |
| 4841 | `faturaOnizlemeAc` |
| 4851 | `faturaOnizlemeKapat` |
| 4861 | `acikSurecKayitOnizlemeAc` |
| 4882 | `faturaOnizlemeIlerletModuAc` |
| 4891 | `faturaOnizlemeIlerletModuKapat` |
| 4900 | `faturaOnizlemedenIlerlet` |
| 4908 | `getDynamicCustomerName` |
| 4909 | `getDynamicCustomerSehir` |
| 4910 | `getDynamicCustomerNameSehirli` |
| 4911 | `getDynamicCustomerVade` |
| 4912 | `getDynamicCustomerFatura` |
| 4914 | `getModLabel` |
| 4921 | `getDynamicCustomerYetkili` |
| 4925 | `getDynamicCustomerYetkiliIletisim` |
| 4931 | `getDynamicCustomerKargo` |
| 4932 | `getDynamicCustomerTeslimatAdresi` |
| 4938 | `custTeslimatToggle` |
| 4951 | `mesajSablonlariniYukle` |
| 4955 | `mesajSablonuUygula` |
| 4961 | `mesajSablonlariAc` |
| 4967 | `mesajSablonlariKaydet` |
| 4977 | `mesajSablonlariVarsayilanaDondur` |
| 4991 | `buildEmailBody` |
| 5011 | `buildWhatsAppBody` |
| 5029 | `hareketBosUyariGoster` |
| 5037 | `generateCommunicationData` |
| 5058 | `cihazMobilMi` |
| 5062 | `sendWhatsAppMessage` |
| 5067 | `copyEmailText` |
| 5073 | `mailOnizlemePopupAc` |
| 5099 | `mailOnizlemeKapat` |
| 5107 | `siparisResmiHtmlOlustur` |
| 5267 | `siparisResmiCanvasOlustur` |
| 5300 | `resimVeEpostaGonder` |
| 5301 | `resimVeWhatsappGonder` |
| 5309 | `tabloKopyalaIndirBaslat` |
| 5339 | `tabloOnizlemeKapat` |
| 5344 | `tabloResmiKopyala` |
| 5360 | `tabloResmiIndir` |
| 5378 | `_resimGonderOrtak` |
| 5407 | `_resimGonderDevamEt` |
| 5468 | `sehirFormatla` |
| 5499 | `arsivGuvenliKaydet` |
| 5545 | `arsivAra` |
| 5613 | `arsivAramaSifirla` |
| 5620 | `arsivSekmeAc` |
| 5642 | `istatistikFiltreButonGuncelle` |
| 5658 | `istatistikFiltreSec` |
| 5665 | `buAyinSiparisVerisi` |
| 5699 | `buGununIsGunuTarihi` |
| 5709 | `buGuneAitSiparisVerisi` |
| 5735 | `anaSayfaRenderEt` |
| 5757 | `anaSayfaSatisDetay` |
| 5761 | `anaSayfaPrimDetay` |
| 5767 | `aylikOzetiAcKapa` |
| 5802 | `kmDegisiklikKaydet` |
| 5814 | `kmGuvenliKaydet` |
| 5849 | `kmFmt` |
| 5850 | `kmTarihAnahtari` |
| 5859 | `kmBugunKayitliMi` |
| 5867 | `kmErtelemeAktifMi` |
| 5871 | `kmKapiAcikMi` |
| 5874 | `kmErtele` |
| 5880 | `kmErtelemeButonuGuncelle` |
| 5899 | `kmTakipSayfasiAc` |
| 5900 | `devamEt` |
| 5913 | `biriTamamlandi` |
| 5924 | `kmAyarlarKaydet` |
| 5933 | `kmTakipGorunumDegistir` |
| 5953 | `kmOncekiKmBul` |
| 5968 | `kmSonrakiKmBul` |
| 5985 | `kmAnahtarKaydir` |
| 5993 | `kmFarkHesapla` |
| 6005 | `kmAylikGunYenidenHesapla` |
| 6025 | `kmAylikBitisKmSonrakiGuneAktar` |
| 6043 | `kmBaslangicGerekliMi` |
| 6047 | `kmAyBasiKontrolEt` |
| 6057 | `kmAyBasiKaydet` |
| 6085 | `kmVarsayilanGunTipi` |
| 6090 | `kmGunKayitYukle` |
| 6120 | `kmOncekiGunOzetiGoster` |
| 6148 | `kmTakipGunTipiDegisti` |
| 6158 | `kmTakipKategoriDegisti` |
| 6164 | `kmKategoriSec` |
| 6173 | `kmAlanKilitleriUygula` |
| 6179 | `kmAlanAyarla` |
| 6197 | `kmEksikAlanlariIsaretle` |
| 6241 | `kmFormKilitleGoster` |
| 6258 | `kmUzunBasinaKilitAcKur` |
| 6290 | `kmTakipHesapla` |
| 6314 | `kmFotoSecildi` |
| 6357 | `kmSuAnTarihSaatDoldur` |
| 6373 | `kmKmFotoBtnKaydetModunaGecir` |
| 6383 | `kmKmFotoBtnOkumaModunaGecir` |
| 6391 | `kmTakipGunDegistir` |
| 6396 | `kmTakipBugun` |
| 6402 | `kmTakipKaydet` |
| 6451 | `kmTakipAyDegistir` |
| 6464 | `kmTakipAylikTabloRenderEt` |
| 6491 | `esc` |
| 6495 | `metinKutu` |
| 6498 | `kmKutu` |
| 6655 | `kmAylikKategoriSec` |
| 6679 | `kmAylikGunEkle` |
| 6704 | `kmAylikHucreDegisti` |
| 6775 | `kmGunDuzenlePopupAc` |
| 6794 | `kmGunDuzenleKapat` |
| 6799 | `kmGunDuzenleKaydet` |
| 6830 | `kmGunDuzenleSilOnay` |
| 6845 | `anaSayfadanAylikKmAc` |
| 6851 | `kmTakipGunTikla` |
| 6858 | `kmTakipExcelIndir` |
| 6967 | `anaSayfadanZiyaretTakvimiAc` |
| 6979 | `ziyaretTakvimiAcKapa` |
| 7010 | `ajandaAcKapa` |
| 7038 | `ajandaGunDegistir` |
| 7045 | `ajandaBugune` |
| 7050 | `ajandaOlustur` |
| 7112 | `musteriKartVeZiyaretGecmisiniAc` |
| 7119 | `ziyaretTakvimAyDegistir` |
| 7127 | `tumZiyaretleriTopla` |
| 7139 | `ziyaretTakvimiOlustur` |
| 7213 | `ziyaretNotGosterGizle` |
| 7219 | `ziyaretGunPopupAc` |
| 7254 | `ziyaretGunKaydiSilHizli` |
| 7259 | `guncellemeyiUygula` |
| 7285 | `musteriKartAcAdIle` |
| 7294 | `ayBazliMudurPrimiGuncelle` |
| 7353 | `tarihIkiSatirFormat` |
| 7367 | `aySiparisleriAc` |
| 7399 | `istatistikHesapla` |
| 7400 | `hesapla` |
| 7413 | `kacanOzetRenderEt` |
| 7453 | `kacanDetayAc` |
| 7481 | `tsToDatetimeLocal` |
| 7487 | `kayitDuzenleAc` |
| 7516 | `kdUrunListesiRenderEt` |
| 7539 | `kdAlanGuncelle` |
| 7549 | `kdUrunSil` |
| 7554 | `kdUrunEkleAramaAcKapat` |
| 7565 | `kdUrunEkleFiltrele` |
| 7614 | `kdUrunEkle` |
| 7626 | `kayitDuzenleKaydetOrtak` |
| 7720 | `kayitDuzenleKaydet` |
| 7725 | `kayitDuzenleKaydetVeGonder` |
| 7732 | `istatistikKayitSil` |
| 7753 | `arsivKayitGeriYukle` |
| 7768 | `arsivGeriDon` |
| 7776 | `arsivSayaclariGuncelle` |
| 7789 | `arsivKategoriAc` |
| 7799 | `arsiveKaydet` |
| 7804 | `arsiveKaydetIletisimden` |
| 7809 | `benzersizKodUretTarihli` |
| 7820 | `eskiKayitlaraKodAta` |
| 7823 | `isle` |
| 7877 | `benzersizKodUret` |
| 7902 | `kodHtmlOlustur` |
| 7914 | `urunSetiImzaOlustur` |
| 7918 | `_arsiveKaydetIslem` |
| 8019 | `arsiveKaydetSonrasiSifirla` |
| 8045 | `arsivKayitSil` |
| 8056 | `renderArsiv` |
| 8096 | `hareketSecPopupAc` |
| 8101 | `hareketSecKapat` |
| 8105 | `hareketSecTuruSecildi` |
| 8160 | `islemiDuzenleVeIlerle` |
| 8208 | `islemiTekrarla` |
| 8246 | `arsivDetayAc` |
| 8254 | `arsivDetayKapat` |

## Refactor rule

Use this map to identify cohesive modules. Do not extract a function solely because it is nearby another function; inspect its callers, shared globals, Firebase/localStorage usage, and DOM dependencies first.
