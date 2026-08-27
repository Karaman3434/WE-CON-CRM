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
