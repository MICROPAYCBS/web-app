# Financial reports — parity (mifos-web-next)

Dedicated sidebar entry points for core financial statement stretchy reports.
They resolve by **exact Fineract report name** (not tenant report id), run through
`ReportRunPageContent`, then render a statement preview (print, PDF, CSV) from
`apps/web/src/lib/fineract/financial-statement.ts`. The catalog route `/reports/{id}`
stays on the generic results table.

**Registry:** `packages/routes/src/admin-nav-routes.ts` (`finReportBalanceSheet` …
`finReportTrialBalance`), nav group `financialReports`.

---

## Master checklist

| ID       | Route                                   | Label            | Fineract report name       | Status   | Notes |
| -------- | --------------------------------------- | ---------------- | -------------------------- | -------- | ----- |
| FIN-010  | `/financial-reports/balance-sheet`      | Balance sheet    | Balance Sheet Table        | **Done** | Statement preview, print, PDF, CSV |
| FIN-020  | `/financial-reports/income-statement`   | Income statement | Income Statement Table     | **Done** | Same, plus net surplus / (deficit) |
| FIN-030  | `/financial-reports/trial-balance`      | Trial balance    | Trial Balance Table        | **Done** | Debit/credit preview; note when out of balance |

---

## Follow-ups

- Optional stricter RBAC (`READ_Balance Sheet Table`, etc.) for nav visibility
