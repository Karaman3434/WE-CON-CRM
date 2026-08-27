# HATA-003 / send-data.js transaction test plan

## Scope
- send-data.js archive save transaction
- send-data.js archive delete transaction

## Safety
- main is not modified
- test branch: fix-003-send-transaction
- change commit: 76b1d07fd42a91021ba403d773ca356edcc722c9

## Static checks
- JavaScript syntax: pending external browser/runtime check
- Dependency names retained: CartData, firebase, SendData public API
- Public API retained: baslat, kaydet, kaynakSil, fiyatGecmisiKontrolEt

## Required functional checks before merge
1. New teklif record saves.
2. New proforma record saves.
3. New siparis record saves.
4. New numune record saves.
5. Same-day same-customer same-product-set revision remains a revision.
6. Different product set creates a new record.
7. Archive delete removes only requested timestamp.
8. Two concurrent writes do not overwrite each other.
9. Existing Firebase data remains readable.
10. UI callback receives success/error exactly once.

## Merge gate
Do not merge to main until browser/Firebase functional tests are observed and pass.
