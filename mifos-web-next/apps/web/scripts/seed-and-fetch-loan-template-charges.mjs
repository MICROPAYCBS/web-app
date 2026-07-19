/**
 * Create sample loan charges via Fineract API, attach to product 1,
 * then dump charge-related template fields (no DB access).
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const base = process.env.FINERACT_API_URL ?? 'https://localhost:8443/fineract-provider/api/v1';
const tenant = process.env.FINERACT_TENANT_ID ?? 'default';
const username = process.env.E2E_USERNAME ?? 'mifos';
const password = process.env.E2E_PASSWORD ?? 'password';
const clientId = process.argv[2] ?? '1';
const productId = process.argv[3] ?? '1';

async function authHeaders() {
  const res = await fetch(`${base}/authentication`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Fineract-Platform-TenantId': tenant
    },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    throw new Error(`Auth failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return {
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': tenant,
    Authorization: `Basic ${data.base64EncodedAuthenticationKey}`
  };
}

async function json(method, path, headers, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} failed (${res.status}): ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

function pickChargeShape(value) {
  if (value == null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 3);
  }
  return value;
}

async function main() {
  const headers = await authHeaders();

  const product = await json('GET', `/loanproducts/${productId}`, headers);
  const currencyCode = product.currency?.code ?? 'USD';

  const fee = await json('POST', '/charges', headers, {
    name: `E2E Processing Fee ${Date.now()}`,
    chargeAppliesTo: 1,
    chargeTimeType: 1,
    chargeCalculationType: 1,
    amount: 50,
    currencyCode,
    active: true,
    locale: 'en',
    dateFormat: 'dd MMMM yyyy'
  });

  const penalty = await json('POST', '/charges', headers, {
    name: `E2E Overdue Penalty ${Date.now()}`,
    chargeAppliesTo: 1,
    chargeTimeType: 9,
    chargeCalculationType: 1,
    amount: 25,
    currencyCode,
    penalty: true,
    active: true,
    locale: 'en',
    dateFormat: 'dd MMMM yyyy'
  });

  await json('PUT', `/loanproducts/${productId}`, headers, {
    ...product,
    charges: [
      { id: fee.resourceId, chargeId: fee.resourceId },
      { id: penalty.resourceId, chargeId: penalty.resourceId }
    ],
    locale: 'en',
    dateFormat: 'dd MMMM yyyy'
  });

  const params = new URLSearchParams({
    templateType: 'individual',
    clientId,
    productId,
    activeOnly: 'true',
    staffInSelectedOfficeOnly: 'true'
  });

  const template = await json('GET', `/loans/template?${params}`, headers);

  const summary = {
    endpoint: `/loans/template?${params}`,
    topLevelChargeKeys: ['charges', 'chargeOptions', 'overdueCharges'],
    counts: {
      charges: template.charges?.length ?? 0,
      chargeOptions: template.chargeOptions?.length ?? 0,
      overdueCharges: template.overdueCharges?.length ?? 0
    },
    charges: pickChargeShape(template.charges),
    chargeOptions: pickChargeShape(template.chargeOptions),
    overdueCharges: pickChargeShape(template.overdueCharges),
    chargeFieldKeys: {
      charges: template.charges?.[0] ? Object.keys(template.charges[0]).sort() : [],
      chargeOptions: template.chargeOptions?.[0] ? Object.keys(template.chargeOptions[0]).sort() : [],
      overdueCharges: template.overdueCharges?.[0] ? Object.keys(template.overdueCharges[0]).sort() : []
    }
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
