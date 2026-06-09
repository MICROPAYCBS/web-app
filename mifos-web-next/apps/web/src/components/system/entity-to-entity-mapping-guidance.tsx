'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { InfoIcon } from 'lucide-react';
import { AppLink } from '@/components/routes/app-link';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger
} from '@/components/ui/popover';
import { ENTITY_MAPPING_REQUIRED_GLOBAL_CONFIGS } from '@/lib/fineract/entity-mapping-display';

export function EntityToEntityMappingGuidance() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            aria-label="About global configurations for entity mappings"
          />
        }
      >
        <InfoIcon className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96" align="start" side="bottom">
        <PopoverHeader>
          <PopoverTitle>Mappings work with global configurations</PopoverTitle>
          <PopoverDescription>
            Rules you add here define which offices or roles can access loan products, savings
            products, and charges. They only take effect when the related settings are enabled
            under{' '}
            <AppLink
              route="sysConfigurations"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Global configurations
            </AppLink>
            .
          </PopoverDescription>
        </PopoverHeader>
        <ul className="list-disc space-y-1.5 pl-4 text-sm text-muted-foreground">
          {ENTITY_MAPPING_REQUIRED_GLOBAL_CONFIGS.map((config) => (
            <li key={config.name}>
              <span className="font-medium text-foreground">{config.label}</span>{' '}
              <span className="text-xs">({config.name})</span> — {config.description}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Both settings must be enabled for these restrictions to apply.
        </p>
      </PopoverContent>
    </Popover>
  );
}
