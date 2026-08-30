# WEICON ASİST — CRM

Firebase (Authentication + Realtime Database) tabanlı, çok sayfalı (her
modül kendi `.html` sayfası) çalışan dahili şirket CRM uygulaması / PWA.

## Firebase Realtime Database güvenlik kuralları

Bu depoda `database.rules.json` dosyası bulunur. Bu dosya sadece **giriş
yapmış (auth != null) kullanıcıların** veritabanını okuyup yazabilmesini
sağlar. Firebase projeleri varsayılan olarak ya tamamen kapalı ya da
test modunda tamamen açık kurallarla başlar — bu dosya olmadan veritabanı
yanlışlıkla herkese açık kalabilir.

Kuralları Firebase konsoluna uygulamak için:

1. Firebase Console (console.firebase.google.com) → proje
   (`weicon-asist`) → **Realtime Database → Rules** sekmesine gidin.
2. `database.rules.json` içeriğini kopyalayıp yapıştırın, **Yayınla**
   (Publish) butonuna basın.

Veya Firebase CLI kuruluysa proje kökünde:

```
firebase deploy --only database
```

## Oturum kilidi hakkında not

`auth.js` içindeki 30 dakika/3 saat hareketsizlik kilidi (PIN ekranı /
tam giriş) **sadece cihaz üzerinde bir hızlı-kilit (UX) katmanıdır**,
`localStorage`'a dayandığı için tarayıcı konsolundan değiştirilebilir.
Asıl güvenlik sınırı Firebase Authentication + yukarıdaki veritabanı
kurallarıdır; PIN/oturum kilidi bunun yerini tutmaz, sadece paylaşılan
bir cihazda hızlı erişimi engeller.

## Değişiklik Geçmişi

### W260830.2345.01
- **Kritik kayıt hatası düzeltildi:** `cart-render.js` içindeki `AyarlarSync.kurBayatMi()` / `otomatikKurGetir()` çağrıları ile `ayarlar-sync.js` arasındaki API uyumsuzluğu giderildi.
- **Müşteri kayıt güvenliği:** `customer-data.js` müşteri yazmalarında Realtime Database transaction (işlemsel güncelleme) kullanıyor; eşzamanlı cihaz değişikliklerinin birbirini ezme riski azaltıldı.
- **İşlem kayıt güvenliği:** `send-data.js` arşiv yazma/silme işlemlerinde transaction kullanıyor.
- **Tarihsel kur doğruluğu:** Yeni/revize işlem kayıtlarına `kur` ve `kdv` değerleri kaydediliyor.
- **Merkezi kur senkronu:** Firebase'deki merkezi kur ve kur zaman damgası ile kayıt öncesi kur kontrolü güvenli hale getirildi.

### W230826.0824.09
- **Yeni belge kodu formatı:** `ÖNEK.GGAAYY.SSDD` — örn. `SİP.010126.1300`.
  Önekler: Numune→**NUM**, Fiyat Teklifi→**F.TEK**, Proforma Fatura→
  **P.FAT**, Sipariş→**SİP**. Bu kod artık Son İşlemler'deki rozette
  görünen ile arka planda saklanan tek ve aynı değer (önceden ikisi
  birbirinden bağımsızdı).
- **Belge zincirleme:** Bir belge "İlerlet" ile Numune→Teklif→Sipariş
  aşamalarından geçerken artık **tarih.saat kısmı sabit kalıyor**,
  sadece önek güncelleniyor (örn. `NUM.010126.1300` →
  `F.TEK.010126.1300` → `SİP.010126.1300`). Liste her zaman son hâli
  gösteriyor (önceki aşama otomatik silindiği için — bu davranış zaten
  vardı, sadece kod artık kalıcı).
- **Ay Toplamı düzeltildi:** Raporlar → aylık "[Ay] [Yıl] Kayıtları"
  ekranındaki toplam ve liste artık **sadece Sipariş**'leri sayıyor;
  Numune/Fiyat Teklifi/Proforma bu toplama dahil edilmiyor.
- **Belge kodu müşteriden gizlendi:** Mail ve WhatsApp'a giden sipariş/
  teklif görselinde belge kodu artık hiç görünmüyor — sadece uygulama
  içinde (Son İşlemler, aylık kayıtlar, dahili Belgeyi Görüntüle)
  gösteriliyor.

### W230826.0824.08
- **Cari Kart yeniden tasarlandı (akordiyon):** Ana sayfa artık tamamen
  salt-görüntüleme — Vade/Fatura/Kargo yan yana (grid, artık her
  ekranda doğru görünüyor), Fatura Adresi/Yetkili Kişi/Teslimat Adresi/
  Not blokları sadece kart listesi, hiçbir buton yok. Tek eylem butonu:
  **"✏️ Bilgiyi Düzenle"** — açtığı ekran 4 katlanır (akordiyon) bölüm
  sunuyor: CARİ BİLGİLERİ, YETKİLİ KİŞİ, TESLİMAT ADRESİ, NOT. Bir
  başlığa dokununca açılıp Ekle/Düzenle/Sil butonlarını gösteriyor.
- **CARİ BİLGİLERİ** özel bölüm: Şehir/Vade/Fatura/Kargo + fatura adresi
  listesini bir arada tutuyor. Ekle → yeni fatura adresi; Düzenle →
  "Temel Bilgiler" veya belirli bir fatura adresi seçimi; Sil → hangi
  fatura adresinin silineceğini soruyor.
- Yetkili Kişi ve Not formlarından ayrı "başlık/etiket" alanı kaldırıldı
  — sadece gerekli bilgi giriliyor. Fatura/Teslimat Adresi formunda
  etiket alanı kaldı (örn. "Fabrika 2 Fatura Adresi").
- Şehir artık Cari Kart'tan düzenlenebiliyor (`musteriGuncelle` güncellendi).
- **Bilinçli olarak eklenmedi:** Müşteri ADI değiştirme. Uygulamada
  sipariş/rapor/görev/km kayıtları müşteri adını anahtar olarak
  kullanıyor — isim değişikliği bu bağlantıları koparabilir. Güvenli bir
  "yeniden adlandırma" (geçmiş kayıtları da güncelleyen) ayrı bir
  özellik olarak talep edilirse eklenebilir.

### W230826.0824.07
- **Ürün kodu tek satırda:** Ürün Bilgisi sütunu genişletildi (SIRA %9→%6,
  ÜRÜN BİLGİSİ %28→%34), kod fontu 9px→8px ve `nowrap` yapıldı — "B
  12345678 A 87654321" artık hiçbir tabloda alt satıra kaymıyor.
- **WhatsApp'a giden tablo sadeleşti:** WhatsApp'a gönderilen sipariş
  tablosunda artık sadece SIRA / ÜRÜN BİLGİSİ / ADET / NET / TOPLAM var —
  LİSTE, İSKONTO ve PRİM (iç bilgi) müşteriye gönderilmiyor. Mail
  değişmedi, tam tablo gitmeye devam ediyor.
- **WhatsApp Önizleme ekranı eklendi:** Mail Önizleme'nin eşleniği —
  WhatsApp Gönder'e basınca, mesaj + sade tablo bir arada gösterilip son
  kontrol yapılabiliyor.
- **WhatsApp mesaj metni artık mail'den bağımsız:** Tek ürün / birden
  fazla ürün durumuna göre otomatik "ürünümüzün" / "ürünlerimizin" gibi
  değişen, WhatsApp'a özel bir şablon kullanılıyor (bu fonksiyon zaten
  vardı, sadece devreye alınmamıştı — artık gerçekten kullanılıyor).
- **Tarih göstergesi küçültüldü:** Belge/form başlığındaki büyük ayrı
  "TARİH" kutulu tablo kaldırıldı; tarih artık WEICON + form adıyla aynı
  satırda, sağda, sade küçük bir metin olarak duruyor (Belgeyi Görüntüle,
  Mail/WhatsApp'a giden görsel — hepsinde).

### W230826.0824.06
- **Ürün kodu gösterimi sadeleştirildi:** Programdaki tüm tablolarda
  (Sepet, Belge/Gönder önizlemesi, Ürün Listesi, Hit Ürünler, Müşteri
  Geçmişi) "Berta:" / "Abas:" kelimeleri kaldırıldı. Yerine tek harf
  rozeti kullanılıyor: **B** (kalın, kırmızı) Berta kodunun önünde,
  **A** (kalın, mavi) Abas kodunun önünde — böylece dar mobil sütunlarda
  daha az yer kaplıyor ve kodlar daha hızlı ayırt ediliyor.

### W230826.0824.05
- **Kritik hata düzeltildi:** Cari Kart'ta sabit (fixed) konumlu "Yeni
  Bilgi Ekle" butonu, sayfanın alt kısmındaki "Kapat" ve "İşleme Devam
  Et" butonlarının ÜZERİNE biniyor, onları görsel olarak gizliyordu — bu
  yüzden "İşlem Yap" akışından gelindiğinde ilerlemek mümkün olmuyordu.
  Üç buton da artık normal sayfa akışında (fixed değil), bu sırayla:
  Kapat → Yeni Bilgi Ekle → İşleme Devam Et.
- **Cari Kart yeniden düzenlendi:** Fatura Adresi / Yetkili Kişi /
  Teslimat Adresi / Not bloklarının altındaki ayrı "⚙️ Yönet" butonları
  kaldırıldı — bloklar artık sadece görüntüleme amaçlı. Tüm Ekle/Sil/
  Düzenle işlemleri tek "➕ Yeni Bilgi Ekle" popup'ında toplandı: her
  kategori satırında (örn. "🧾 Fatura Adresi") yan yana Ekle/Sil/Düzenle
  butonları var.

### W230826.0824.04
- **KM Excel'e Aktar:** İş KM / Özel KM sütunları artık her export'ta
  (Bitiş KM − Başlangıç KM) taze hesaplanıp doğru sütuna yazılıyor,
  saklanan eski değerlere güvenilmiyor.
- **Son İşlemler:** Belgeyi Görüntüle / Düzenle / Sil tek satırda 3 buton;
  toplam tutar tarih-saat satırının sonuna taşındı.
- **Ürün listesi:** İşlevsiz "En Çok Aranan" butonu kaldırıldı (zaten Hit
  Ürünler ile aynı listeyi gösteriyordu); "Yeni Ürün Ekle" onun yerine
  Hit Ürünler'in yanına taşındı.
- **Sepet tablosu:** Sil butonu PRİM sütunundan SIRA sütununa taşındı
  (sıra numarasına dokununca 🗑️ çıkıyor); ÜRÜN BİLGİSİ sütunu genişletildi.
- **Okunabilirlik:** Programdaki tüm tablolarda (Sepet, KM, Raporlar,
  Ürün Listesi, Belge/Gönder, Müşteri Geçmişi) yazı fontu kalınlaştırıldı.
- **Sipariş formu:** Fatura adresi artık her zaman gösteriliyor (boşsa
  "Girilmemiş" yazıyor); mail konu başlığındaki sabit "WEICON" hatası
  düzeltildi; **Mail Önizleme ekranı** eklendi — Mail Gönder'e basınca
  konu/alıcı/mesaj/sipariş tablosu tek ekranda gösterilip son kontrol
  yapılabiliyor, gönder onaylanınca gerçek mail açılıyor.
- **KM sayfası:** "Bugünün Kilometresi — [tarih]" başlığı ilgili alanla
  birleştirildi; Seyir Güzergahı / Ziyaret Edilen Yerler yan yana alındı.

### W230826.0824.03
- **Cari Kart yeniden tasarlandı:** Fatura Adresi, Yetkili Kişi, Teslimat
  Adresi ve Not blokları artık **çoklu kayıt** destekliyor (liste + kart
  görünümü). Her blokta önceki 3 buton (Düzenle/Kaydet/Sil) kaldırılıp
  tek bir **"⚙️ Yönet"** butonuna indirildi — tıklanınca Düzenle/Sil
  seçimi, birden fazla kayıt varsa "hangisi?" seçici açılıyor.
- Sayfa altına **"➕ Yeni Bilgi Ekle"** butonu eklendi — kategori seçtirip
  (Fatura Adresi / Yetkili / Teslimat Adresi / Not) ilgili formu açıyor.
- `customer-data.js`'e çoklu **Not** desteği eklendi (`notEkle`, `notSil`,
  `notGuncelle`) — Fatura Adresi ve Yetkili Kişi zaten çoklu kayıt
  destekliyordu, arayüz artık bunu tam olarak kullanıyor. Eski tekil
  `not` alanı geriye dönük uyumluluk için (`send-render.js` gibi diğer
  sayfalar için) otomatik senkron tutuluyor.

### W230826.0824.02
- **Güvenlik:** Varsayılan PIN ("1234") ile giriş yapıldığında artık
  uygulamaya geçmeden önce kullanıcıdan zorunlu olarak yeni bir PIN
  belirlemesi isteniyor (`pin-utils.js`, `pin-render.js`).
- **Güvenlik:** `database.rules.json` eklendi — Realtime Database artık
  sadece giriş yapmış kullanıcılara açık olacak şekilde kısıtlanabiliyor
  (önceden depoda hiç kural dosyası yoktu).
- **Temizlik:** `ui-render-fix.js` kaldırıldı — hiçbir sayfada
  yüklenmiyordu ve yamaladığı `switchTab()` fonksiyonu, uygulamanın artık
  kullanmadığı eski tek-sayfalı (SPA) sürümden kalma bir kalıntıydı.
- **Temizlik:** `_backups/` klasörü ve unutulmuş `weicon-v2-anasayfa.zip`
  kaynak dosyalarından çıkarıldı.
- Ayarlar sayfasına görünür sürüm numarası eklendi.
