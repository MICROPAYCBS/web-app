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

## Notes

- Create flow loads per-product options via `GET /loanproducts/{productId}/productmix?template=true`.
- Create template for product picker: `GET /loanproducts/template?isProductMixTemplate=true`.
