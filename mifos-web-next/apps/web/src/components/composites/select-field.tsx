'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { VariantProps } from 'class-variance-authority';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormLabel } from '@/components/composites/form-label';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Field, FieldContent, FieldError } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  /** Primary line — shown in the trigger and option list. */
  label: string;
  /** Secondary line below the primary text in the option list. */
  description?: string;
  /** Compact label shown as a badge beside the primary text. */
  badge?: string | { text: string; variant?: VariantProps<typeof badgeVariants>['variant'] };
  keywords?: string[];
}

function resolveSelectOptionBadge(option: SelectOption) {
  if (!option.badge) {
    return null;
  }
  if (typeof option.badge === 'string') {
    return { text: option.badge, variant: 'outline' as const };
  }
  return { text: option.badge.text, variant: option.badge.variant ?? 'outline' };
}

function normalizeSelectSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_]+/g, ' ');
}

function filterSelectOptions(options: SelectOption[], query: string): SelectOption[] {
  const normalizedQuery = normalizeSelectSearchText(query);
  if (!normalizedQuery) {
    return options;
  }

  const compactQuery = normalizedQuery.replace(/\s/g, '');

  return options.filter((option) => {
    const badge = resolveSelectOptionBadge(option);
    const parts = [
      option.value,
      option.label,
      option.description,
      badge?.text,
      ...(option.keywords ?? [])
    ].filter((value): value is string => Boolean(value?.trim()));

    return parts.some((part) => {
      const normalizedPart = normalizeSelectSearchText(part);
      const compactPart = normalizedPart.replace(/\s/g, '');
      return (
        normalizedPart.includes(normalizedQuery) ||
        compactPart.includes(compactQuery)
      );
    });
  });
}

function hasRichSelectOption(option: SelectOption): boolean {
  return Boolean(option.description || option.badge);
}

function SelectOptionContent({
  option,
  layout = 'list'
}: {
  option: SelectOption;
  layout?: 'list' | 'trigger';
}) {
  const badge = resolveSelectOptionBadge(option);

  if (!hasRichSelectOption(option)) {
    return <span className="flex-1 truncate">{option.label}</span>;
  }

  if (layout === 'trigger') {
    return (
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate">{option.label}</span>
        {badge ? (
          <Badge variant={badge.variant} className="shrink-0">
            {badge.text}
          </Badge>
        ) : null}
      </span>
    );
  }

  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate font-medium">{option.label}</span>
        {badge ? (
          <Badge variant={badge.variant} className="shrink-0">
            {badge.text}
          </Badge>
        ) : null}
      </span>
      {option.description ? (
        <span className="truncate text-xs text-muted-foreground">{option.description}</span>
      ) : null}
    </span>
  );
}

export interface SelectFieldProps {
  id?: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  value?: string;
  onValueChange: (value: string | undefined) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
  hint?: string;
  hintAriaLabel?: string;
  contextHelpSectionId?: string;
  /** Visually hide the label (kept for screen readers and combobox search). */
  hideLabel?: boolean;
  /** Max height class for the options list (defaults to a scrollable panel). */
  listClassName?: string;
}

const triggerClassName = cn(
  'flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
  'dark:bg-input/30'
);

/**
 * Searchable combobox for Fineract lookups (Command + Popover). Full width, label shows text not id.
 */
export function SelectField({
  id,
  label,
  required = false,
  optional,
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  error,
  disabled = false,
  className,
  emptyMessage = 'No results found.',
  hint,
  hintAriaLabel,
  contextHelpSectionId,
  hideLabel = false,
  listClassName
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selected = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(
    () => filterSelectOptions(options, searchQuery),
    [options, searchQuery]
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchQuery('');
    }
  }

  return (
    <Field className={className} data-invalid={!!error}>
      <FormLabel
        htmlFor={id}
        required={required}
        optional={hideLabel ? false : (optional ?? !required)}
        hint={hint}
        hintAriaLabel={hintAriaLabel}
        contextHelpSectionId={contextHelpSectionId}
        className={hideLabel ? 'sr-only' : undefined}
      >
        {label}
      </FormLabel>
      <FieldContent>
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger
            render={
              <Button
                id={id}
                type="button"
                variant="outline"
                disabled={disabled}
                aria-invalid={!!error}
                className={cn(
                  triggerClassName,
                  !selected && 'text-muted-foreground'
                )}
              />
            }
          >
            {selected ? (
              <SelectOptionContent option={selected} layout="trigger" />
            ) : (
              <span className="flex-1 truncate text-left">{placeholder}</span>
            )}
            <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
          </PopoverTrigger>
          <PopoverContent
            className="flex w-[var(--anchor-width)] max-h-[min(20rem,var(--available-height,20rem))] flex-col overflow-hidden p-0"
            align="start"
            side="bottom"
          >
            <Command shouldFilter={false} className="min-h-0 flex-1">
              <CommandInput
                placeholder={`Search ${label.toLowerCase()}…`}
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList className={cn('max-h-64', listClassName)}>
                {filteredOptions.length === 0 ? (
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {filteredOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        className={option.description ? 'items-start py-2' : undefined}
                        onSelect={() => {
                          onValueChange(option.value);
                          handleOpenChange(false);
                        }}
                      >
                        <SelectOptionContent option={option} />
                        {value === option.value ? (
                          <CheckIcon className="size-4 shrink-0 opacity-100" />
                        ) : null}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <FieldError>{error}</FieldError>
      </FieldContent>
    </Field>
  );
}
