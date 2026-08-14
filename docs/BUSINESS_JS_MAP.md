# WE-CON-CRM Business JavaScript Map

Generated from the largest remaining inline application script on `project-context`.

- Script size: **416,116 bytes**
- Function declarations found: **413**

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
| 3921 | DERİN AI ANALİZİ — kural tabanlı kontrolün ötesinde, Gemini'ye |
| 3922 | "bu işlem ticari açıdan normal mi?" diye sorar. Sadece istenirse |
| 3923 | çalışır (otomatik değil), Cloudflare Worker kurulumu gerektirir. |
| 3924 | ============================================================ |
| 3980 | "🧹 Temizle" — Hesaplama ekranındaki tüm alanları ve aktarılan ürün bağını |
| 3981 | sıfırlar, böylece bir önceki ürünün liste/dip/iskonto/adet değerleri |
| 3982 | yanlışlıkla bir sonraki işleme karışmaz. |
| 4002 | HIZLI HESAPLA — müşteri/işlem türü seçmeden, direkt Hesapla ekranını açar; ürün arama o ekranın içinden yapılır |
| 4005 | SATIŞ MENÜSÜ — Müşteri / Ziyaret Takvimi / İstatistikler / Görevlerim tek buton altında |
| 4167 | Sepette bu ürünü gönderildi olarak işaretle |
| 4175 | Dip maliyet otomatik = liste × %36,35 |
| 4177 | Önceki üründen kalan iskonto oranı yeni ürüne sızmasın diye her yeni ürün aktarımında sıfırlanır. |
| 4204 | Otomatik dip maliyet = liste × %36,35 |
| 4211 | MÜŞTERİ BAZLI FİYAT GEÇMİŞİ — bu müşteriye bu ürün daha önce satılmış mı, en son kaça? |
| 4270 | Müşteri bazlı fiyat geçmişi uyarısı |
| 4293 | Fiyat geçmişi uyarısındaki "O Kaydı Görüntüle" bağlantısı: Hesaplama popup'ını |
| 4294 | kapatıp o ürünün daha önce daha yüksek fiyata satıldığı kaydı açar. |
| 4304 | "LİSTEYE EKLE" butonuna basılınca çağrılır: eğer bu ürün bu müşteriye daha |
| 4305 | önce daha yüksek fiyata satılmışsa, direkt eklemek yerine önce onay ister |
| 4306 | (Kapat = geri dön düzenle, Devam Et = yine de bu fiyatla ekle). |
| 4358 | Bekleyen ürün kalmadı - Ürün Bul sepetini de otomatik temizle |
| 4412 | Eşleşen sepet ürünü varsa "beklemede" durumuna geri al |
| 4432 | Aynı ürün Hesapla sayfasındaki bekleyen sepette (basket) de varsa oradan da kaldır |
| 4507 | KAYITLI (arşivlenmiş) bir işlem görüntüleniyorsa (tip/idx verilmişse) bu kaydın kendisi burada |
| 4508 | tek seferde tutulur — aşağıdaki tüm alanlar (yetkili dahil) buradan okunur, aksi halde o an aktif |
| 4509 | "Hesapla" ekranında başka bir müşteri için seçili duran bir yetkili kişi buraya sızabilir. |
| 4523 | Dinamik müşteri bilgileri (Yetkili Kişi/Telefon/E-Posta/Teslimat Adresi/Vade/Fatura/Kargo) — |
| 4524 | KAYITLI (arşivlenmiş) bir işlem görüntüleniyorsa aşağıdaki aktifKayit'ten okunur. |
| 4532 | Telefon/e-posta arşivde ayrı saklanmıyor — o kaydın ait olduğu müşterinin kişi listesinden, |
| 4533 | isim eşleşmesiyle bulunur. Eşleşme yoksa boş bırakılır (yanlış kişinin bilgisini göstermemek için). |
| 4671 | --- Kaçan Sipariş işaretleme ------------------------------------------- |
| 4729 | -------------------------------------------------------------------------- |
| 4731 | Kaydı İptal veya İade olarak işaretler (kayıt SİLİNMEZ, listede üzeri çizili görünür). |
| 4732 | Aynı duruma tekrar dokunulursa işaret kaldırılır (normale döner). |
| 4780 | Açık süreç bannerındaki tarih/tip satırına dokununca o kaydın fatura önizlemesini İlerlet butonuyla birlikte açar |
| 4920 | HTML önizleme - başlıkları kırmızı kalın, ürün isimlerini kalın+%30 büyük yap |
| 4957 | Mail metnini "ÜRÜN LİSTESİ VE DETAYLARI" kısmından önce kes - o kısmın yerini PNG alacak |
| 4988 | Kod üzerinden bu belgenin revize edilip edilmediğini arşivden bul |
| 5029 | Alt çizgili (underline) etiket+değer kutusu — referans görseldeki gibi |
| 5179 | TABLOYU KOPYALA / İNDİR — müşteriden gelen bir maile aynı zincir üzerinden |
| 5180 | yanıt vermek için, hareket tablosunu resim olarak panoya kopyalama veya |
| 5181 | PNG olarak indirme imkânı sağlar (yeni mail göndermeden, mevcut yanıt |
| 5182 | penceresine yapıştırılabilir/eklenebilir). |
| 5301 | MAIL ve WHATSAPP: telefonun paylaşım penceresi kullanılıyor — PNG resim |
| 5302 | otomatik ekleniyor, "title" olarak Konu da gönderiliyor (Gmail çoğunlukla |
| 5303 | bunu Konu alanına yazar). Web paylaşım penceresinde "Kime" diye bir alan |
| 5304 | olmadığı için o kısım (ofis@weicon.com.tr) mail uygulamasında elle girilmeli. |
| 5306 | Paylaşım penceresi HEMEN tetiklenmeli (kullanıcı dokunuşu izni süresi kısa). |
| 5307 | Arşivleme, paylaşımın sonucunu beklemeden hemen arkasından (ufak bir gecikmeyle) çalışır; |
| 5308 | böylece ne paylaşım penceresi engellenir ne de arşivleme arka plana atılınca kaybolur. |
| 5320 | Paylaşım desteklenmiyorsa, en son çare olarak indir + wa.me/mailto ile aç |
| 5338 | ============================================================ |
| 5341 | ŞEHİR FORMATLAMA — nasıl girilmiş olursa olsun İl her zaman büyük harf ve başta gösterilir |
| 5366 | İki cihaz aynı anda FARKLI arşiv kayıtlarını değiştirirse/silerse/eklerse |
| 5367 | birbirinin işlemini kaybetmesin diye: Firebase'e yazmadan hemen önce |
| 5368 | sunucudaki EN GÜNCEL arşivi çekip, sadece BU işlemin değişikliklerini |
| 5369 | (bir veya daha fazla tip içinde eklenen/güncellenen/silinen kayıtlar) o |
| 5370 | güncel arşivin içine "kod" (veya kod yoksa "ts") ile eşleştirerek |
| 5371 | uygulayıp öyle yazıyoruz. Eskiden bu cihazdaki (bayat olabilecek) local |
| 5372 | arsivData komple üzerine yazılıyordu ve diğer cihazın az önce farklı bir |
| 5373 | tipe/kayda yaptığı değişiklik sessizce kaybolabiliyordu. |
| 5374 | degisiklikler: {tip, kayit} \| {tip, silinecekKod} \| {tip, silinecekTs} \| dizi |
| 5410 | Sunucudan taze veri çekilemezse (yetki/ağ hatası vb.), işlemi tamamen |
| 5411 | kaybetmemek için kuyruğa alıyoruz — bir sonraki senkronda güvenli |
| 5412 | birleştirme ile tekrar denenecek (komple arşiv ile üzerine yazmıyoruz). |
| 5436 | Tüm kategorilerde ara |
| 5572 | "İş günü" penceresi: her gün sabah 09:00'da sıfırlanır, ertesi gün sabah 06:00'a |
| 5573 | kadar o günün verilerini göstermeye devam eder. 06:00-09:00 arası (yeni gün henüz |
| 5574 | başlamadan önceki geçiş aralığı) hiçbir iş günü aktif değildir, gösterge boş kalır. |
| 5654 | Diğer panelleri (Ziyaret Takvimi, Ajanda) kapat |
| 5670 | ============ ARAÇ KM TAKİBİ ============ |
| 5674 | Değişen günleri biriktirir — debounce'lu kmAylikTabloKaydet çağrılmadan hemen |
| 5675 | önce hangi TEK günün/günlerin değiştiğini işaretlemek için kullanılır, böylece |
| 5676 | güvenli-birleştirme fonksiyonu tüm ayı değil sadece bu günleri uygular. |
| 5683 | KM Takip — güvenli birleştirme (müşteri/arşiv'de kullandığımız aynı desen): |
| 5684 | yazmadan önce sunucudaki EN GÜNCEL tüm ay verisini çekip, sadece BU an |
| 5685 | değişen günü/günleri onun içine uygulayıp öyle yazıyoruz. ESKİDEN cihazın |
| 5686 | belleğindeki (kmTakipKayitlariObj) TÜM ay ham olarak üzerine yazılıyordu — |
| 5687 | bellek eksik/bayat olduğunda (örn. sayfa yeni açılmışken Firebase henüz tam |
| 5688 | senkron olmadan bir alana dokunulursa) diğer günlerin verisi sessizce |
| 5689 | TAMAMEN kaybolabiliyordu. Bu fonksiyon tek bir günü bile asla toptan silmez. |
| 5710 | Sunucudan taze veri çekilemezse (yetki/ağ hatası vb.), işlemi tamamen |
| 5711 | kaybetmemek için kuyruğa alıyoruz — bir sonraki senkronda güvenli |
| 5712 | birleştirme ile tekrar denenecek (komple ay ile üzerine yazmıyoruz). |
| 5732 | Bugünün araç KM kaydı girilip "Günü Kaydet" ile onaylanmış mı? Girilmediyse |
| 5733 | uygulamanın geri kalanı kilitlenir — kullanıcı önce KM fotoğrafını çekip |
| 5734 | kaydetmeden başka hiçbir işlev kullanamaz. |
| 5741 | "1 Saat Ertele" — araç şu an yanında değilse kilidi geçici olarak (60 dk) askıya alır. |
| 5742 | Süre dolunca kilit otomatik geri döner. |
| 5823 | Aylık tabloda bu arada değişiklik yapılmış olabilir (KM/Saat) — güncel |
| 5824 | veriyle yeniden yükle ki BAŞLANGIÇ/BİTİŞ KM kutuları hemen yansısın. |
| 5841 | YENİ MANTIK: Bir günün fotoğraflanan KM'si O GÜNÜN BAŞLANGICI'dır (istisnasız). |
| 5842 | Bir günün BİTİŞ KM'si ise SONRAKİ günün fotoğraflanan (başlangıç) değeridir. |
| 5843 | Bu yüzden "bitiş" için artık ileri yönlü arama gerekiyor. |
| 5856 | "Bir önceki tarih" burada TAKVİMDE dünü değil, kayıtlı olan EN YAKIN önceki |
| 5857 | günü ifade eder (araya boş — fotoğrafsız — günler girse bile). Sistem sadece |
| 5858 | fotoğrafın çekildiği günleri baz alır, aradaki tarihler tabloda hiç yer almaz. |
| 5860 | "YYYY-MM-DD" formatındaki bir tarih anahtarını N gün kaydırıp yeni anahtarı döndürür. |
| 5868 | Bitiş KM - Başlangıç KM farkını verir. Değerlerden biri boş/geçersizse null döner. |
| 5877 | Bir günün kaydını, otomatik kurallara göre yeniden hesaplar: |
| 5878 | 1) Başlangıç KM boşsa, bir önceki günün Bitiş KM'si otomatik yazılır. |
| 5879 | 2) Bitiş KM - Başlangıç KM farkı, o gün için seçili kategoriye (İş/Özel) |
| 5880 | göre ilgili alana otomatik yazılır, diğer alan temizlenir. |
| 5898 | Bir günün Bitiş KM'si girildiğinde/değiştiğinde, bir SONRAKİ günün Başlangıç |
| 5899 | KM'sini otomatik olarak bu değere eşitler (araç kilometresi fiziksel olarak |
| 5900 | süreklidir: bugünün bitişi = yarının başlangıcı). |
| 5917 | YENİ MANTIKTA ARTIK GEREKSİZ: her gün kendi fotoğrafıyla kendi başlangıcını taşıyor, |
| 5918 | önceki bir kayda bağımlı değil. Fonksiyon geriye dönük uyumluluk için duruyor ama hep false döner. |
| 5959 | Kayıt henüz oluşturulmamışsa: Pazartesi-Cuma (hafta içi) "Normal İş Günü", |
| 5960 | Cumartesi/Pazar "Hafta Sonu Tatil" olarak otomatik seçilir. |
| 5972 | TARİH kutusu artık sistem tarihini değil, "Tarih ve Saat Gir" ile ÇEKİLEN |
| 5973 | fotoğraftan okunan tarihi gösterir. Henüz fotoğraf çekilmediyse boş kalır. |
| 5994 | Tarih navigasyonunun altında, görüntülenen günden BİR ÖNCEKİ günün |
| 5995 | başlangıç/bitiş/toplam km özetini gösterir. |
| 6027 | Gün zaten kaydedilmiş olsa bile (kilitli görünüm), Gün Tipi değişikliği |
| 6028 | anında sessizce kaydedilir — kullanıcı tekrar "Günü Kaydet"e basmak zorunda kalmaz. |
| 6045 | Artık alanlar arasında zorla sıralama YOK — kullanıcı istediği alana |
| 6046 | istediği sırayla girebilir. Bu fonksiyon sadece görsel/erişilebilirlik |
| 6047 | için tüm alanların açık kaldığından emin olur (geçmiş sürümle uyum için |
| 6048 | tutuluyor, çağıran yerler dokunulmadan bırakıldı). |
| 6063 | Kaydet sırasında eksik çıkan alanları kırmızı çerçeveyle işaretler ve |
| 6064 | ilk eksik alana ekranı kaydırır. Kullanıcı o alana bir şey yazdığı an |
| 6065 | kırmızı çerçeve otomatik kalkar. |
| 6095 | NOT: "kmGunTipiSelect" (Gün Tipi) ve "kmKategoriSelect" (İş/Özel KM) BİLİNÇLİ |
| 6096 | olarak bu kilit listesinde YOK — gün kaydedilse bile bu iki seçim kutusu her |
| 6097 | zaman açık/değiştirilebilir kalır (aşağıdaki onchange'ler değişikliği anında |
| 6098 | sessizce kaydeder, "Günü Kaydet"e tekrar basmaya gerek kalmaz). |
| 6112 | Bugünün kaydı zaten yapılmışsa TÜM alanlar kilitlenir (yanlışlıkla |
| 6113 | bozulmasın diye). Tek bir "Düzenle" tuşu YOK — her alan kendi başına, |
| 6114 | üzerine 5 saniye BASILI TUTULARAK açılır; sadece o hücre aktif olur ve |
| 6115 | elle giriş yapılabilir. Bu kilit, ertesi günün sabah ilk KM girişine |
| 6116 | kadar (yani gün değişip yeni bir kayıt başlayana kadar) geçerlidir. |
| 6132 | Her kilitli alana bir kere bağlanır (sayfa açılışında). Alan disabled |
| 6133 | iken 5 saniye basılı tutulursa sadece o alanın kilidi açılır. |
| 6169 | BAŞLANGIÇ KM artık BUGÜNÜN KENDİ okunan değeri (KM Gir ile girilen/fotoğraflanan) |
| 6174 | BİTİŞ KM artık SONRAKİ günün okunan değeri — henüz o gün gelmediyse "—" |
| 6181 | En son KM kaydı girilmiş günden bir sonraki (boş) günü bulur. Hiç kayıt |
| 6182 | yoksa bugünü döner. Bulunan gün bugünden ileriyse (gelecek), bugüne sabitlenir. |
| 6183 | NOT: Eskiden burada "kmSonrakiBosGunuBul()" adlı bir fonksiyon vardı; okunan KM'yi |
| 6184 | "son kayıtlı günden sonraki ilk BOŞ güne" yerleştiriyordu. Bu YANLIŞTI — fotoğrafsız |
| 6185 | (es geçilen) günleri geçmişe dönük doldurmaya çalışıyor, bugünün okumasını yanlış bir |
| 6186 | güne yazabiliyordu. Artık kmFotoSecildi() doğrudan cihazın GERÇEK bugünkü tarihini |
| 6187 | kullanıyor, bu fonksiyona gerek kalmadı. |
| 6189 | KM/Tarih-Saat fotoğrafından okuma (kartFotoGonder ile aynı Cloud Function, "kmOku" hedefi) |
| 6198 | ÖNEMLİ: Fotoğraf hangi gün çekiliyorsa, okuma HER ZAMAN o günün |
| 6199 | (cihazın GERÇEK bugünkü tarihinin) kaydı olur — "son kayıtlı günden |
| 6200 | sonraki boş gün" gibi bir arayışla GEÇMİŞTEKİ bir güne asla yazılmaz. |
| 6201 | Fotoğrafsız günler otomatik olarak es geçilir (o gün km yapılmamış |
| 6202 | sayılır) — aradaki boşluk hiçbir zaman doldurulmaya çalışılmaz. |
| 6212 | KM okunur okunmaz, diğer alanlar (güzergah, ziyaret vb.) boş kalsa bile |
| 6213 | sessizce kaydet — böylece Aylık Rapor'a KM hemen yansır, geri kalanı |
| 6214 | gün içinde doldurulup normal "KM Kaydet" ile tamamlanabilir. |
| 6231 | KM fotoğrafı çekilip okunduğu ANDAKİ cihaz tarih/saatini TARİH ve SAAT |
| 6232 | kutularına otomatik yazar — bu, km okuma anının kaydıdır. |
| 6247 | KM okuma tuşunu "KM Gir" (fotoğraf çek) durumundan "KM Kaydet" durumuna |
| 6248 | çevirir — km başarıyla okunup alana yazıldıktan sonra çağrılır. |
| 6257 | KM okuma tuşunu tekrar "KM Gir" (fotoğraf çek) durumuna döndürür — |
| 6258 | yeni bir güne geçildiğinde veya kayıt henüz yapılmamışken çağrılır. |
| 6312 | Boş bir gün ise (hiçbir şey girilmemiş, normal tipte) kaydı sil |
| 6334 | Aylık tablo artık Excel çıktısıyla BİREBİR AYNI 8 sütun: Tarih \| Başlangıç-Bitiş |
| 6335 | Saati \| Seyir Güzergahı \| Ziyaret Yerleri \| Başlangıç KM \| Bitiş KM \| İş KM \| Özel KM. |
| 6336 | Gün Tipi seçimi Tarih hücresinin altına küçük bir kutu olarak gömülüdür (ayrı |
| 6337 | sütun DEĞİL). Kategori (İş/Özel) seçimi de İş KM / Özel KM hücresine dokunularak |
| 6338 | yapılır — ayrı bir Kategori sütunu yoktur. Böylece görünen sütunlar Excel ile |
| 6339 | tıpatıp aynıdır; ekstra alanlar sadece hücre içi küçük kontrollerdir. |
| 6359 | Sistem SADECE fotoğrafın çekildiği (kaydın gerçekten girildiği) günleri baz |
| 6360 | alır — takvimde ardışık gitmek zorunda değil. Fotoğraf/kayıt olmayan bir gün |
| 6361 | (bugün dahil) tabloda hiç görünmez, aradaki tarihler tamamen atlanır. |
| 6368 | Excel/tablo görünümüyle birebir: hücreler düz görünür (görünmez kenarlıklı, |
| 6369 | saydam zeminli input), sadece odaklanınca hafif çerçeve belirir. |
| 6393 | OTOMATİK KURALLAR: |
| 6394 | 1) Bir günün Başlangıç KM'si boşsa, bir önceki günün Bitiş KM'si otomatik |
| 6395 | olarak o kutuya yazılır (araç kilometresi süreklidir). |
| 6396 | 2) Bitiş KM - Başlangıç KM farkı, o gün için seçili kategoriye (İş/Özel |
| 6397 | KM hücresine dokunarak seçilir) göre otomatik olarak ilgili hücreye |
| 6398 | yazılır. Kullanıcı isterse üzerine yazıp elle değiştirebilir. |
| 6415 | Elle Bitiş KM girilmemişse: Günlük Kayıt'tan gelen bir sonraki günün |
| 6416 | KENDİ KM okuması otomatik olarak bu günün Bitiş KM'si sayılır |
| 6417 | (araç kilometresi süreklidir — bugünün bitişi = yarının okuması). |
| 6457 | Herhangi bir satıra BASILI TUTULURSA (500ms), o günün tüm bilgilerini tek |
| 6458 | popup'ta düzenleyebileceğimiz ekranı açar. Var olan hücre-içi düzenleme |
| 6459 | (input'a dokunup yazma) de aynen çalışmaya devam eder. |
| 6461 | ÖNEMLİ DÜZELTME: Eskiden dokunma anında tarayıcı hücreyi HEMEN odaklayıp |
| 6462 | klavyeyi açıyordu (native davranış), biz 500ms sonra popup'ı bunun ÜSTÜNE |
| 6463 | açıyorduk — bu da "popup, kutunun içine giriyor ve yanlış yazıma neden |
| 6464 | oluyor" şikayetine yol açıyordu. Artık dokunma anında native odaklanmayı |
| 6465 | BİZ engelliyoruz (preventDefault); basılı tutma tamamlanmadan parmak |
| 6466 | kalkarsa (kısa/normal dokunuş) hücreyi KENDİMİZ odaklıyoruz — yani tek |
| 6467 | dokunuşla düzenleme aynen çalışır ama klavye popup'la asla çakışmaz. |
| 6468 | Sürükleme/scroll varsa basılı tutma iptal edilir. |
| 6488 | Kısa dokunuş — popup açılmadı, normal düzenleme odaklanmasını biz tetikliyoruz. |
| 6499 | Parmağın en ufak titremesinde (gerçek kaydırma olmadan) basılı tutma iptal |
| 6500 | OLMASIN diye 12px'lik bir eşik mesafe var — sadece bu eşiği aşan gerçek |
| 6501 | bir sürükleme/scroll hareketinde basılı tutma iptal edilir. |
| 6512 | Masaüstü/mouse ile test için: burada native odaklanma zaten sorun |
| 6513 | yaratmadığından preventDefault gerekmez, davranış olduğu gibi bırakıldı. |
| 6522 | Düzenleme sırasında odak kaybolmasın diye, aynı hücreye tekrar odaklan |
| 6529 | İş KM / Özel KM hücresine dokunularak o günün kategorisini seçme (ayrı bir |
| 6530 | Kategori sütunu olmadan, Excel'deki 8 sütun görünümünü bozmadan). |
| 6548 | Tablodaki herhangi bir hücre değiştirildiğinde çağrılır: ilgili günün |
| 6549 | kaydını (yoksa oluşturarak) günceller, yerelde ve Firebase'de saklar, |
| 6550 | başlangıç/bitiş KM zincirinin doğru görünmesi için tabloyu yeniden çizer. |
| 6551 | "+ Gün Ekle" kutusu: tablo artık sadece kayıtlı günleri gösterdiği için, izin/tatil |
| 6552 | gibi Günlük Kayıt'tan geçmeyen bir günü elle eklemek istediğinde bu kullanılır. |
| 6553 | Seçilen tarih için (henüz kaydı yoksa) boş bir kayıt oluşturur, gerekiyorsa o ayı |
| 6554 | gösterir ve tabloyu yeniden çizip o günün Başlangıç KM alanına odaklanır. |
| 6607 | Başlangıç/Bitiş KM değiştiyse, o günün İş/Özel KM farkını seçili |
| 6608 | kategoriye göre otomatik yeniden hesapla. |
| 6612 | Bugünün Bitiş KM'si, yarının Başlangıç KM'sine otomatik aktarılır. |
| 6622 | Aynı anda açık olan Günlük Kayıt ekranı bu güne bakıyorsa, orayı da tazele. |
| 6630 | Bu genel kaydetme birden çok yerden (hücre düzenleme, gün ekleme/silme, |
| 6631 | zincirleme bitiş-KM aktarımı) çağrılıyor — hangi günlerin değiştiğini |
| 6632 | kmBekleyenDegisiklikler kuyruğu tutuyor. Kuyrukta bir şey varsa SADECE o |
| 6633 | günleri güvenli birleştirerek yazıyoruz (tüm ayı ham üzerine yazmıyoruz). |
| 6634 | Kuyruk boşsa (bilinmeyen bir çağrı yolu), son çare olarak eski davranışa |
| 6635 | (ham üzerine yazma) düşüyoruz — ama bu artık istisna, kural değil. |
| 6646 | Bir güne BASILI TUTULUNCA açılan tam-detay düzenleme popup'ı — o günün TÜM |
| 6647 | alanlarını (gün tipi, saat, güzergah, ziyaret yerleri, başlangıç/bitiş KM, |
| 6648 | iş/özel KM, kategori) tek ekranda gösterir ve hepsini birden değiştirmeyi |
| 6649 | sağlar. Geçmişe dönük herhangi bir günü (bugün olmasa bile) düzenlemek için. |
| 6704 | "🗑 Bu Günü Tamamen Sil" — önce net bir onay ister (kalıcı silme, geri |
| 6705 | alınamaz), onaylanırsa kaydı tamamen kaldırır ve tabloyu yeniden çizer. |
| 6720 | Ana Sayfa'dan doğrudan Aylık (düzenlenebilir) tabloya geçiş |
| 6806 | Kolon başlıkları satırı (3. satır, 0-index BAS_SATIR-1): açık mavi zemin, kalın, ortalı. |
| 6818 | Veri satırları: tek satır, kenarlıklı, Tarih sola / diğerleri ortaya hizalı. |
| 6838 | ============ ZİYARET TAKVİMİ ============ |
| 6866 | Diğer panelleri (Aylık Özet, Ajanda) kapat |
| 6883 | ============ GÜNLÜK AJANDA ============ |
| 6897 | Diğer panelleri (Aylık Özet, Ziyaret Takvimi) kapat |
| 7002 | Tüm müşterilerin ziyaretGecmisi'ni tek düz listeye toplar: {musteri, sehir, ts, not} |
| 7022 | Pazartesi=0 olacak şekilde haftanın gününü ayarla |
| 7058 | Özet tablo: bu ay toplamı + bu hafta (son 7 gün, tüm ziyaretler üzerinden gerçek zamana göre) |
| 7070 | 15+ gündür ziyaret edilmeyenler (tüm müşteriler üzerinden, ay'dan bağımsız gerçek zaman) |
| 7287 | ❌ Kaçan Siparişler özeti: bu ayki sayı/tutar, kaybedilme sebebi dağılımı, |
| 7288 | rakip firma dağılımı ve Teklif→Sipariş dönüşüm oranı. |
| 7327 | "KAÇAN İŞLEM" kutusuna dokununca — bu ayki kaçan kayıtların listesi (sebep, |
| 7328 | rakip firma, tutar dahil) ayrı bir popup'ta açılır. |
| 7354 | KAYIT DÜZENLEME — geçmişte yanlış kaydedilmiş bir işlemi manuel düzeltmek için |
| 7384 | Bu modalı tetikleyebilecek tüm üst popup'lar kapatılır — aksi halde |
| 7385 | Revize tuşuna basınca bu modal arkada açılır, görünmez kalır. |
| 7547 | Tip veya tarih değiştiyse belge kodu da (SIP/TEK/PRO/NUM + tarih + sıra) |
| 7548 | yeni duruma göre tazelenir, aksi halde eski koddaki tarih/tip yanıltıcı kalır. |
| 7760 | Firebase'e artık TÜM sayaçlar nesnesi komple üzerine yazılmıyor — sadece bu |
| 7761 | tipin sayacı, sunucuda ATOMİK olarak (transaction) en az bu değere yükseltiliyor. |
| 7762 | Böylece iki cihaz aynı anda kod üretse bile birbirinin artışını silmiyor |
| 7763 | (eskiden fbSet ile komple nesne yazıldığında diğer cihazın az önce yaptığı |
| 7764 | artış sessizce kaybolabiliyordu). |
| 7811 | Aynı gün + aynı müşteri + aynı işlem türü + BİREBİR AYNI ürün seti (Berta/Abas |
| 7812 | kodlarına göre — sadece adet/iskonto/fiyat farkı olabilir, ürün eklenip/çıkarılmamış |
| 7813 | olmalı) bulunursa ikinci bir evrak açmak yerine mevcut kaydı güncelleyip REVİZE damgası |
| 7814 | basıyoruz. Böylece unutularak art arda gönderilen aynı sipariş, mükerrer kayıt olmuyor. |
| 7833 | REVİZE GEÇMİŞİ: üzerine yazmadan önce eski hâli (fiyat/ürün seti + zaman) |
| 7834 | revizeGecmisi dizisine ekleniyor — böylece bir teklif/sipariş birden |
| 7835 | fazla kez revize edilse bile önceki fiyatların tamamı kayboluyor değil, |
| 7836 | "v1 → 1.250€, v2 → 1.180€" gibi bir tarihçe olarak saklanıyor. |
| 7864 | "İlerlet" ile (Numune→Teklif→Proforma→Sipariş) hazırlanan bir belgeyse, eski aşamanın |
| 7865 | kaydını arşivden SİL — artık iki ayrı kayıt değil, tek kayıt yeni türe dönüşmüş olur. |
| 7892 | Arşive gitme - sadece bildir |
| 7958 | ============================================================ |
| 7961 | Bir teklif/numune/proforma kaydını "düzenlenebilir" (bekleyen) halde Sepet'e taşır, |
| 7962 | ürünlere dokunup gramaj/ürün değiştirilebilir, hesaplandıktan sonra hedef SİPARİŞ olarak gönderilir. |
| 7963 | ============================================================ |
| 7964 | HAREKET SEÇ — Müşteri kartı / İşlem Geçmişi / İstatistikler'den ulaşılan |
| 7965 | TEK ORTAK akış: bir kaydın (teklif/numune/proforma/sipariş) ürünlerini, |
| 7966 | MEVCUT fiyat/iskonto/adediyle DOĞRUDAN hesaplanmış olarak Sepet'e yükler. |
| 7967 | Hiçbir ürünü yeniden hesaplamaya zorlamaz — değişecek ürün varsa |
| 7968 | kullanıcı sadece o ürüne dokunup düzenler, diğerleri olduğu gibi kalır. |
| 7969 | ============================================================ |
| 8000 | Ürünleri mevcut fiyat/iskonto/adediyle DOĞRUDAN HESAPLANMIŞ (yeşil) olarak yükle. |
| 8050 | Ürünleri HESAPLANMIŞ olarak değil, BEKLEYEN (sarı) olarak sepete koy — |
| 8051 | böylece her ürüne dokunup "✏️ Düzenle" ile farklı bir ürün/gramaj seçilebilir. |
| 8066 | Hedef işlem türünü SİPARİŞ olarak ayarla (teklif/numune/proforma -> sipariş dönüşümü) |
| 8090 | Müşteriyi bul (kayıtlı müşteri listesinde varsa tam profiliyle, yoksa kayıttaki bilgilerle) |
| 8099 | Ürünleri hareket listesine yükle (tarih, gönderim anında otomatik bugünün tarihi olacak) |
| 8104 | İşlem türünü kayıttaki türle eşle |
| 8109 | Vade/Fatura/Kargo/Yetkili'yi kaydın kendi değerleriyle güncelle (müşteri profilindeki genel değerler yerine) |

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
| 3925 | `anomaliDerinAnalizIste` |
| 3968 | `hesaplaPopupAc` |
| 3983 | `hesaplamaTemizle` |
| 3998 | `listeyeEkleButonGuncelle` |
| 4006 | `satisMenusuAc` |
| 4009 | `satisMenusuKapatVeGit` |
| 4014 | `hizliHesaplaAc` |
| 4033 | `hizliHesaplaUrunAramaAc` |
| 4040 | `hizliHesaplaFiltrele` |
| 4089 | `hizliHesaplaUrunSec` |
| 4108 | `hesaplaPopupKapat` |
| 4118 | `sepetBekleyenModalAc` |
| 4148 | `sepettenSil` |
| 4166 | `sepettenHesaplaAktar` |
| 4189 | `aktarilanUrununSil` |
| 4199 | `fmt` |
| 4201 | `listeFiyatGuncelle` |
| 4213 | `musteriUrunFiyatGecmisiBul` |
| 4236 | `fiyatGecmisiKontrolEt` |
| 4246 | `hesapla` |
| 4295 | `oncekiSatisKaydinaGit` |
| 4307 | `listeyeEkleTikla` |
| 4323 | `fiyatDusuklukOnayKapat` |
| 4328 | `fiyatDusuklukOnayDevamEt` |
| 4334 | `hareketeSaklar` |
| 4371 | `islemTuruModalAc` |
| 4374 | `islemTuruModalKapat` |
| 4378 | `islemTuruRenkGuncelle` |
| 4391 | `modSec` |
| 4408 | `hareketDuzenle` |
| 4429 | `harekettenSil` |
| 4447 | `hareketUrunModalAc` |
| 4474 | `faturaOnizlemeHtmlOlustur` |
| 4647 | `faturaOnizlemePopupGoster` |
| 4672 | `kacanIsaretlePopupAc` |
| 4685 | `kacanIsaretleModalKapat` |
| 4688 | `kacanIsaretleKaydet` |
| 4711 | `kacanIsaretiKaldir` |
| 4733 | `faturaOnizlemedenDurumIsaretle` |
| 4753 | `faturaOnizlemedenSil` |
| 4761 | `faturaOnizlemeAc` |
| 4771 | `faturaOnizlemeKapat` |
| 4781 | `acikSurecKayitOnizlemeAc` |
| 4802 | `faturaOnizlemeIlerletModuAc` |
| 4811 | `faturaOnizlemeIlerletModuKapat` |
| 4820 | `faturaOnizlemedenIlerlet` |
| 4828 | `getDynamicCustomerName` |
| 4829 | `getDynamicCustomerSehir` |
| 4830 | `getDynamicCustomerNameSehirli` |
| 4831 | `getDynamicCustomerVade` |
| 4832 | `getDynamicCustomerFatura` |
| 4834 | `getModLabel` |
| 4841 | `getDynamicCustomerYetkili` |
| 4845 | `getDynamicCustomerYetkiliIletisim` |
| 4851 | `getDynamicCustomerKargo` |
| 4852 | `getDynamicCustomerTeslimatAdresi` |
| 4858 | `custTeslimatToggle` |
| 4867 | `buildEmailBody` |
| 4887 | `buildWhatsAppBody` |
| 4905 | `hareketBosUyariGoster` |
| 4913 | `generateCommunicationData` |
| 4934 | `cihazMobilMi` |
| 4938 | `sendWhatsAppMessage` |
| 4943 | `copyEmailText` |
| 4949 | `mailOnizlemePopupAc` |
| 4975 | `mailOnizlemeKapat` |
| 4983 | `siparisResmiHtmlOlustur` |
| 5143 | `siparisResmiCanvasOlustur` |
| 5176 | `resimVeEpostaGonder` |
| 5177 | `resimVeWhatsappGonder` |
| 5185 | `tabloKopyalaIndirBaslat` |
| 5215 | `tabloOnizlemeKapat` |
| 5220 | `tabloResmiKopyala` |
| 5236 | `tabloResmiIndir` |
| 5254 | `_resimGonderOrtak` |
| 5283 | `_resimGonderDevamEt` |
| 5344 | `sehirFormatla` |
| 5375 | `arsivGuvenliKaydet` |
| 5421 | `arsivAra` |
| 5489 | `arsivAramaSifirla` |
| 5496 | `arsivSekmeAc` |
| 5518 | `istatistikFiltreButonGuncelle` |
| 5534 | `istatistikFiltreSec` |
| 5541 | `buAyinSiparisVerisi` |
| 5575 | `buGununIsGunuTarihi` |
| 5585 | `buGuneAitSiparisVerisi` |
| 5611 | `anaSayfaRenderEt` |
| 5633 | `anaSayfaSatisDetay` |
| 5637 | `anaSayfaPrimDetay` |
| 5643 | `aylikOzetiAcKapa` |
| 5678 | `kmDegisiklikKaydet` |
| 5690 | `kmGuvenliKaydet` |
| 5725 | `kmFmt` |
| 5726 | `kmTarihAnahtari` |
| 5735 | `kmBugunKayitliMi` |
| 5743 | `kmErtelemeAktifMi` |
| 5747 | `kmKapiAcikMi` |
| 5750 | `kmErtele` |
| 5756 | `kmErtelemeButonuGuncelle` |
| 5775 | `kmTakipSayfasiAc` |
| 5776 | `devamEt` |
| 5789 | `biriTamamlandi` |
| 5800 | `kmAyarlarKaydet` |
| 5809 | `kmTakipGorunumDegistir` |
| 5829 | `kmOncekiKmBul` |
| 5844 | `kmSonrakiKmBul` |
| 5861 | `kmAnahtarKaydir` |
| 5869 | `kmFarkHesapla` |
| 5881 | `kmAylikGunYenidenHesapla` |
| 5901 | `kmAylikBitisKmSonrakiGuneAktar` |
| 5919 | `kmBaslangicGerekliMi` |
| 5923 | `kmAyBasiKontrolEt` |
| 5933 | `kmAyBasiKaydet` |
| 5961 | `kmVarsayilanGunTipi` |
| 5966 | `kmGunKayitYukle` |
| 5996 | `kmOncekiGunOzetiGoster` |
| 6024 | `kmTakipGunTipiDegisti` |
| 6034 | `kmTakipKategoriDegisti` |
| 6040 | `kmKategoriSec` |
| 6049 | `kmAlanKilitleriUygula` |
| 6055 | `kmAlanAyarla` |
| 6073 | `kmEksikAlanlariIsaretle` |
| 6117 | `kmFormKilitleGoster` |
| 6134 | `kmUzunBasinaKilitAcKur` |
| 6166 | `kmTakipHesapla` |
| 6190 | `kmFotoSecildi` |
| 6233 | `kmSuAnTarihSaatDoldur` |
| 6249 | `kmKmFotoBtnKaydetModunaGecir` |
| 6259 | `kmKmFotoBtnOkumaModunaGecir` |
| 6267 | `kmTakipGunDegistir` |
| 6272 | `kmTakipBugun` |
| 6278 | `kmTakipKaydet` |
| 6327 | `kmTakipAyDegistir` |
| 6340 | `kmTakipAylikTabloRenderEt` |
| 6367 | `esc` |
| 6371 | `metinKutu` |
| 6374 | `kmKutu` |
| 6531 | `kmAylikKategoriSec` |
| 6555 | `kmAylikGunEkle` |
| 6580 | `kmAylikHucreDegisti` |
| 6651 | `kmGunDuzenlePopupAc` |
| 6670 | `kmGunDuzenleKapat` |
| 6675 | `kmGunDuzenleKaydet` |
| 6706 | `kmGunDuzenleSilOnay` |
| 6721 | `anaSayfadanAylikKmAc` |
| 6727 | `kmTakipGunTikla` |
| 6734 | `kmTakipExcelIndir` |
| 6843 | `anaSayfadanZiyaretTakvimiAc` |
| 6855 | `ziyaretTakvimiAcKapa` |
| 6886 | `ajandaAcKapa` |
| 6914 | `ajandaGunDegistir` |
| 6921 | `ajandaBugune` |
| 6926 | `ajandaOlustur` |
| 6988 | `musteriKartVeZiyaretGecmisiniAc` |
| 6995 | `ziyaretTakvimAyDegistir` |
| 7003 | `tumZiyaretleriTopla` |
| 7015 | `ziyaretTakvimiOlustur` |
| 7089 | `ziyaretNotGosterGizle` |
| 7095 | `ziyaretGunPopupAc` |
| 7130 | `ziyaretGunKaydiSilHizli` |
| 7135 | `guncellemeyiUygula` |
| 7161 | `musteriKartAcAdIle` |
| 7170 | `ayBazliMudurPrimiGuncelle` |
| 7229 | `tarihIkiSatirFormat` |
| 7243 | `aySiparisleriAc` |
| 7275 | `istatistikHesapla` |
| 7276 | `hesapla` |
| 7289 | `kacanOzetRenderEt` |
| 7329 | `kacanDetayAc` |
| 7357 | `tsToDatetimeLocal` |
| 7363 | `kayitDuzenleAc` |
| 7392 | `kdUrunListesiRenderEt` |
| 7415 | `kdAlanGuncelle` |
| 7425 | `kdUrunSil` |
| 7430 | `kdUrunEkleAramaAcKapat` |
| 7441 | `kdUrunEkleFiltrele` |
| 7490 | `kdUrunEkle` |
| 7502 | `kayitDuzenleKaydetOrtak` |
| 7596 | `kayitDuzenleKaydet` |
| 7601 | `kayitDuzenleKaydetVeGonder` |
| 7608 | `istatistikKayitSil` |
| 7629 | `arsivKayitGeriYukle` |
| 7644 | `arsivGeriDon` |
| 7652 | `arsivSayaclariGuncelle` |
| 7665 | `arsivKategoriAc` |
| 7675 | `arsiveKaydet` |
| 7680 | `arsiveKaydetIletisimden` |
| 7685 | `benzersizKodUretTarihli` |
| 7696 | `eskiKayitlaraKodAta` |
| 7699 | `isle` |
| 7753 | `benzersizKodUret` |
| 7778 | `kodHtmlOlustur` |
| 7790 | `urunSetiImzaOlustur` |
| 7794 | `_arsiveKaydetIslem` |
| 7895 | `arsiveKaydetSonrasiSifirla` |
| 7921 | `arsivKayitSil` |
| 7932 | `renderArsiv` |
| 7972 | `hareketSecPopupAc` |
| 7977 | `hareketSecKapat` |
| 7981 | `hareketSecTuruSecildi` |
| 8036 | `islemiDuzenleVeIlerle` |
| 8084 | `islemiTekrarla` |
| 8122 | `arsivDetayAc` |
| 8130 | `arsivDetayKapat` |

## Refactor rule

Use this map to identify cohesive modules. Do not extract a function solely because it is nearby another function; inspect its callers, shared globals, Firebase/localStorage usage, and DOM dependencies first.
