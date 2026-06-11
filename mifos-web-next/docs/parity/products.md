# Parity: Products

Reference: `openMF/web-app` → `src/app/products/`

## Product mix

| Route | Method | web-app screen | Fineract API | Schema ID | E2E | Status |
|-------|--------|----------------|--------------|-----------|-----|--------|
| `/products/products-mix` | GET | ProductsMixComponent | `GET /loanproducts?associations=productMixes` | — | — | done |
| `/products/products-mix?create=1` | POST | CreateProductMixComponent | `POST /loanproducts/{productId}/productmix` | `products.mix.create` | — | done |
| `/products/products-mix/[productId]` | GET | ViewProductMixComponent | `GET /loanproducts/{productId}/productmix` | — | — | done |
| `/products/products-mix/[productId]?edit=1` | PUT | EditProductMixComponent | `PUT /loanproducts/{productId}/productmix` | `products.mix.update` | — | done |
| `/products/products-mix/[productId]` | DELETE | ViewProductMixComponent | `DELETE /loanproducts/{productId}/productmix` | — | — | done |

## Tax configurations

| Route | Method | web-app screen | Fineract API | Schema ID | E2E | Status |
|-------|--------|----------------|--------------|-----------|-----|--------|
| `/products/tax-configurations` | GET | ManageTaxConfigurationsComponent | — | — | — | done |
| `/products/tax-configurations/tax-components` | GET | ManageTaxComponentsComponent | `GET /taxes/component` | — | — | done |
| `/products/tax-configurations/tax-components?create=1` | POST | CreateTaxComponentComponent | `POST /taxes/component` | `products.tax-component.create` | — | done |
| `/products/tax-configurations/tax-components/[id]` | GET | ViewTaxComponentComponent | `GET /taxes/component/{id}` | — | — | done |
| `/products/tax-configurations/tax-components/[id]?edit=1` | PUT | EditTaxComponentComponent | `PUT /taxes/component/{id}` | `products.tax-component.update` | — | done |
| `/products/tax-configurations/tax-groups` | GET | ManageTaxGroupsComponent | `GET /taxes/group` | — | — | done |
| `/products/tax-configurations/tax-groups/create` | POST | CreateTaxGroupComponent | `POST /taxes/group` | `products.tax-group.create` | — | done |
| `/products/tax-configurations/tax-groups/[id]` | GET | ViewTaxGroupComponent | `GET /taxes/group/{id}` | — | — | done |
| `/products/tax-configurations/tax-groups/[id]/edit` | PUT | EditTaxGroupComponent | `PUT /taxes/group/{id}` | `products.tax-group.update` | — | done |

## Delinquency bucket configurations

| Route | Method | web-app screen | Fineract API | Schema ID | E2E | Status |
|-------|--------|----------------|--------------|-----------|-----|--------|
| `/products/delinquency-bucket-configurations` | GET | ManageDelinquencyBucketsComponent | — | — | — | done |
| `/products/delinquency-bucket-configurations/ranges` | GET | DelinquencyRangeComponent | `GET /delinquency/ranges` | — | — | done |
| `/products/delinquency-bucket-configurations/ranges?create=1` | POST | CreateRangeComponent | `POST /delinquency/ranges` | `products.delinquency-range.create` | — | done |
| `/products/delinquency-bucket-configurations/ranges/[id]` | GET | ViewRangeComponent | `GET /delinquency/ranges/{id}` | — | — | done |
| `/products/delinquency-bucket-configurations/ranges/[id]?edit=1` | PUT | EditRangeComponent | `PUT /delinquency/ranges/{id}` | `products.delinquency-range.update` | — | done |
| `/products/delinquency-bucket-configurations/ranges/[id]` | DELETE | ViewRangeComponent | `DELETE /delinquency/ranges/{id}` | — | — | done |
| `/products/delinquency-bucket-configurations/buckets` | GET | DelinquencyBucketComponent | `GET /delinquency/buckets` | — | — | done |
| `/products/delinquency-bucket-configurations/buckets/create` | POST | CreateBucketComponent | `POST /delinquency/buckets` | `products.delinquency-bucket.create` | — | done |
| `/products/delinquency-bucket-configurations/buckets/[id]` | GET | ViewBucketComponent | `GET /delinquency/buckets/{id}` | — | — | done |
| `/products/delinquency-bucket-configurations/buckets/[id]/edit` | PUT | EditBucketComponent | `PUT /delinquency/buckets/{id}` | `products.delinquency-bucket.update` | — | done |
| `/products/delinquency-bucket-configurations/buckets/[id]` | DELETE | ViewBucketComponent | `DELETE /delinquency/buckets/{id}` | — | — | done |

## Notes

- Product mix create flow loads per-product options via `GET /loanproducts/{productId}/productmix?template=true`.
- Product mix create template for product picker: `GET /loanproducts/template?isProductMixTemplate=true`.
- Tax component create template: `GET /taxes/component/template`.
- Tax group create template: `GET /taxes/group/template`; edit loads `GET /taxes/group/{id}?template=true`.
- Delinquency bucket create/edit for working capital loads `GET /delinquency/buckets/template`; regular buckets use `GET /delinquency/ranges` for range picker options.
- Bucket detail and edit links carry `?bucketType=regular|workingcapital` to match legacy navigation.
