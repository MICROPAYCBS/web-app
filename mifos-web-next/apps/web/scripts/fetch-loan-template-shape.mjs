/**
 * Dump charge-related fields from GET /loans/template for local Fineract.
 * Usage: node scripts/fetch-loan-template-shape.mjs [clientId] [productId]
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const base = process.env.FINERACT_API_URL ?? 'https://localhost:8443/fineract-provider/api/v1';
const tenant = process.env.FINERACT_TENANT_ID ?? 'default';
const username = process.env.E2E_USERNAME ?? 'mifos';
const password = process.env.E2E_PASSWORD ?? 'password';
const clientId = process.argv[2] ?? '1';
const productId = process.argv[3] ?? '1';

async function waitForFineract(maxAttempts = 60) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const healthUrl = base.replace(/\/api\/v1$/, '') + '/actuator/health';
      const res = await fetch(healthUrl);
      if (res.ok) {
        return;
      }
    } catch {
      // keep polling
    }
    process.stderr.write(`Waiting for Fineract (${attempt}/${maxAttempts})...\n`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error('Fineract did not become ready in time.');
}

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
    'Fineract-Platform-TenantId': tenant,
    Authorization: `Basic ${data.base64EncodedAuthenticationKey}`
  };
}

function pickChargeShape(value) {
  if (value == null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.slice(0, 2) : [];
  }
  return value;
}

async function main() {
  await waitForFineract();
  const headers = await authHeaders();

  const params = new URLSearchParams({
    templateType: 'individual',
    clientId,
    productId,
    activeOnly: 'true',
    staffInSelectedOfficeOnly: 'true'
  });

  const res = await fetch(`${base}/loans/template?${params}`, { headers });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Template fetch failed (${res.status}): ${body}`);
  }

  const template = JSON.parse(body);
  const summary = {
    clientId: template.clientId,
    product: template.product ?? {
      id: template.loanProductId,
      name: template.loanProductName
    },
    currency: template.currency,
    chargesCount: Array.isArray(template.charges) ? template.charges.length : null,
    chargeOptionsCount: Array.isArray(template.chargeOptions) ? template.chargeOptions.length : null,
    overdueChargesCount: Array.isArray(template.overdueCharges) ? template.overdueCharges.length : null,
    charges: pickChargeShape(template.charges),
    chargeOptions: pickChargeShape(template.chargeOptions),
    overdueCharges: pickChargeShape(template.overdueCharges),
    chargeFieldKeys: {
      charges: template.charges?.[0] ? Object.keys(template.charges[0]) : [],
      chargeOptions: template.chargeOptions?.[0] ? Object.keys(template.chargeOptions[0]) : [],
      overdueCharges: template.overdueCharges?.[0] ? Object.keys(template.overdueCharges[0]) : []
    }
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
