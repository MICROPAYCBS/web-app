'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormLabel } from '@/components/composites/form-label';
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
  label: string;
  keywords?: string[];
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
  hideLabel = false
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const displayLabel = selected?.label ?? null;

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
        <Popover open={open} onOpenChange={setOpen}>
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
                  !displayLabel && 'text-muted-foreground'
                )}
              />
            }
          >
            <span className="flex-1 truncate text-left">{displayLabel ?? placeholder}</span>
            <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-[var(--anchor-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />
              <CommandList>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={[option.label, ...(option.keywords ?? [])].join(' ')}
                      onSelect={() => {
                        onValueChange(option.value);
                        setOpen(false);
                      }}
                    >
                      <span className="flex-1 truncate">{option.label}</span>
                      {value === option.value ? (
                        <CheckIcon className="size-4 shrink-0 opacity-100" />
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <FieldError>{error}</FieldError>
      </FieldContent>
    </Field>
  );
}
