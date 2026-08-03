# IFKB Internet Image Seed v0.11.3

This release contains the reviewed, licence-tracked internet-image seed for the Iranian Food Knowledge Base.

## Coverage

- Iranian prepared-food canon: 261 concepts
- P0 image scope: 60 classes
- packaged licensed assets: 58
- P0 classes with any accepted image role: 43
- P0 classes with served/product identity role: 38
- auxiliary context/process-only classes: 5
- unresolved P0 classes: 17
- Nutrition Gold images: 0

## Assets

- Wave 1: 12 Wikimedia Commons originals or documented 1600px fallback files
- Wave 2: 30 visually reviewed 1024px Commons thumbnails
- Wave 3: 5 visually reviewed 1024px Commons thumbnails
- paced rate-limit retry: 11 visually reviewed 1024px Commons thumbnails

Every asset retains the Commons page, original URL, licence, author/credit, Commons SHA1 when supplied, local SHA-256, image role, visual-review result and split-group metadata.

## Why some assets are thumbnails

Bulk source-original requests from GitHub Actions were blocked by Wikimedia with HTTP 429 / robot policy. No partial original-file release was published. The already audited Commons 1024px thumbnails were packaged transparently instead, while the original URLs remain in the manifest. Future source-original acquisition must use small paced batches.

## Safety and evidence limits

- Search ranking never automatically establishes food identity.
- Context, preparation-process and regional-variant images have distinct roles.
- Near-duplicate servings remain in one split group.
- No internet image is Nutrition Gold without a measured serving, component weights and a locked IFKB recipe version.
- CC BY and CC BY-SA attribution must accompany distribution; CC BY-SA assets remain explicitly tracked.

## Still unresolved

قیمه بادمجان، چلو سفید، باقالی‌پلو با ماهیچه، عدسی، کله‌پاچه، سمبوسه، شامی، خوراک لوبیا چیتی، الویه، ماست، ماست چکیده، قلیه ماهی، دیزی سنگی، اکبرجوجه، دنده کباب، آش شله قلمکار و کوکو سیب‌زمینی.
