# Financial reports — parity (mifos-web-next)

Dedicated sidebar entry points for core financial statement stretchy reports.
They resolve by **exact Fineract report name** (not tenant report id) and reuse the
standard report run UI (`ReportRunPageContent`). Further special treatment will
build on `apps/web/src/lib/fineract/financial-reports.ts`.

**Registry:** `packages/routes/src/admin-nav-routes.ts` (`finReportBalanceSheet` …
`finReportTrialBalance`), nav group `financialReports`.

---

## Master checklist

| ID       | Route                                   | Label            | Fineract report name       | Status   | Notes |
| -------- | --------------------------------------- | ---------------- | -------------------------- | -------- | ----- |
| FIN-010  | `/financial-reports/balance-sheet`      | Balance sheet    | Balance Sheet Table        | **Done** | Name lookup → same run UI as `/reports/{id}` |
| FIN-020  | `/financial-reports/income-statement`   | Income statement | Income Statement Table     | **Done** | Same |
| FIN-030  | `/financial-reports/trial-balance`      | Trial balance    | Trial Balance Table        | **Done** | Same |

---

## Follow-ups (special treatment)

- Statement-specific layout / formatting beyond the generic results table
- Optional stricter RBAC (`READ_Balance Sheet Table`, etc.) for nav visibility
