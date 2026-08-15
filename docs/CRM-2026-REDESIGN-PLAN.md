# WE-CON-CRM — 2026 CRM Yeniden Tasarım Planı

## Ana bilgi mimarisi
ANA EKRAN → SATIŞ → MÜŞTERİ / İŞLEMLER

### MÜŞTERİ
- Müşteri Kartı
- Yetkililer (çoklu)
- Ürün hafızası
- Son hareket / son satış / açık görevler

### İŞLEMLER
- Geçmiş İşlemler
  - Sipariş
  - Teklif
  - Proforma
  - Numune
- Müşteri ile Temas
  - Ziyaret
  - Telefon
  - Mail
  - WhatsApp
  - Tümü / filtre
  - Temas notu + tarih/saat + yetkili + sonraki aksiyon
- Görevler
  - Müşteriye bağlı görev
  - Başlık / açıklama
  - Tarih / saat
  - Hatırlatma
  - Açık / tamamlandı

### SATIŞ AKIŞI
Müşteri seç → bir veya daha fazla yetkili seç → Ürün Bul → ürün seç → mevcut Hesapla akışına aktar → sonuç.

## Veri güvenliği
- Eski müşteri, yetkili, sipariş, teklif, proforma, numune, temas ve görev verileri silinmeyecek.
- Yeni model önce read-only/adaptör katmanı üzerinden legacy veriyi okuyacak.
- Yeni kayıtlar yeni modele yazılacak; geçiş sürecinde eski veri kaynakları korunacak.
- Her yeni kayıt customerId ile müşteriye bağlanacak.
- Eski isim bazlı kayıtlar mümkün olduğunda müşteri ID'sine normalize edilecek; eşleşmeyen kayıtlar silinmeyecek, migration queue olarak işaretlenecek.

## UX prensipleri
- Mobile-first, saha kullanımı.
- Tek elle kullanım ve büyük dokunma hedefleri.
- Müşteri ekranında kısa karar bilgileri; detay gerektiğinde açılır.
- İşlemler ekranında kronolojik timeline + hızlı filtreler.
- Görevlerde tarih/saat ve hatırlatma görünür.
- Ürün Bul ve Hesapla mevcut çalışan akış olarak korunur.

## Referans yaklaşımı
- 2026 mobil CRM örnekleri: aksiyon odaklı dashboard, kart/timeline, görev filtreleme ve mobil öncelikli kullanım.
- SuperOffice Mobile CRM: şirket/kontakt/satış/aktivite ayrımı, action bar ve hızlı görev oluşturma.
- SAP Customer Experience Q1/2026: kart tabanlı günlük catch-up ve önceliklendirilmiş aksiyonlar.
- Servis.ai Mobile Timeline: kayıt bazlı kronolojik aktivite akışı.
- Field-sales CRM örnekleri: mobile-first, offline erişim, ziyaret/not/görev bağlamı ve sync güvenliği.
