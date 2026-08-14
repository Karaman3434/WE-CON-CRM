# WE-CON-CRM — Modülerleştirme Yol Haritası

Bu çalışma mevcut CRM davranışını koruyarak `index.html` içindeki tek parça yapıyı aşamalı olarak modüllere ayırmak için hazırlanmıştır.

## Hedef mimari

- `index.html`: yalnızca uygulama kabuğu, temel HTML ve modül giriş noktası
- `css/`: görsel katman
- `js/core/`: uygulama başlatma, ortak yardımcılar ve durum yönetimi
- `js/firebase/`: Firebase bağlantısı ve veri senkronizasyonu
- `js/customers/`: müşteri listesi, müşteri detayları ve müşteri hafızası
- `js/products/`: ürün/katalog işlemleri
- `js/pricelist/`: fiyat listesi ve fiyat hesaplama
- `js/visits/`: ziyaretler ve Son Hareket
- `js/reports/`: raporlar
- `js/settings/`: ayarlar

## Veri prensibi

Firebase ana veri kaynağıdır. `localStorage` yalnızca UI/cache (arayüz/önbellek) amacıyla kullanılacaktır; Firebase verisinin üzerine istemeden yazmayacaktır.

## Güvenli taşıma sırası

1. Mevcut davranışı ve bağımlılıkları koru.
2. Ortak yardımcıları ayır.
3. Firebase erişimini tek bir katmanda topla.
4. Müşteri, ürün, fiyat, ziyaret ve rapor fonksiyonlarını tek tek taşı.
5. Her taşıma sonrasında uygulama davranışını doğrula.
6. En son `index.html` içindeki eski JavaScript'i kaldır.

## Kritik kural

Mevcut CRM'in çalışma mantığı, Firebase veri yapısı, PWA davranışı ve mobil arayüzü korunmadan toplu yeniden yazım yapılmayacaktır. Her değişiklik geri alınabilir küçük bir adım olarak tutulacaktır.
