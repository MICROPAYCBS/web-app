/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ContextHelpContent } from '@/lib/context-help/types';

export const organizationManageCurrenciesHelp: ContextHelpContent = {
  title: 'Manage currencies',
  summary:
    'Choose which currencies your organization can use on accounts, products, and reports. Changes apply immediately across the system.',
  sections: [
    {
      id: 'overview',
      title: 'About this screen',
      body: [
        'This screen controls the list of currencies enabled for your organization—not individual exchange rates or decimal settings.',
        'Adding or removing a currency saves right away. Use Done when you are finished to return to the currency list.'
      ]
    },
    {
      id: 'currency-picker',
      title: 'Currency',
      body: [
        'Open the picker and type a name or code to search the catalog. Only currencies not already enabled are listed.',
        'Select one and click Add currency to enable it for your organization. Each currency uses a standard three-letter code (for example UGX or USD).'
      ]
    },
    {
      id: 'add-currency',
      title: 'Add currency',
      body: [
        'Pick a currency and submit to add it to your organization. The change is saved immediately—there is no separate Save step on this screen.',
        'If you add a currency that is already enabled, it is ignored.'
      ]
    },
    {
      id: 'selected-currencies',
      title: 'Selected currencies',
      body: [
        'Lists every currency currently enabled for your organization.',
        'At least one currency should remain enabled so accounts and products can be denominated correctly.'
      ]
    },
    {
      id: 'remove-currency',
      title: 'Remove a currency',
      body: [
        'Click Remove on a row to take that currency off your organization. You will be asked to confirm before the change is saved.',
        'Removing a currency does not delete historical transactions that used it, but new activity should use currencies that remain enabled.'
      ]
    }
  ]
};
