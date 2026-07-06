"use client";

import type { Control } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { PlayerFormValues } from "./schema";

type NumericFieldName =
  | "matchesPlayed"
  | "goals"
  | "assists"
  | "cleanSheets"
  | "sortOrder";

type NumberFieldProps = Readonly<{
  control: Control<PlayerFormValues>;
  name: NumericFieldName;
  label: string;
}>;

/**
 * Numeric form field bound to React Hook Form. Keeps `field.value` a real
 * number (native `type=number`, `inputMode=numeric`, `text-base` from Input to
 * defeat iOS zoom). Empty / invalid input coerces to 0 so the control stays
 * controlled; Zod still enforces the ≥ 0 integer rule.
 */
export function NumberField({ control, name, label }: NumberFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              name={field.name}
              ref={field.ref}
              value={field.value}
              onBlur={field.onBlur}
              onChange={(event) => {
                const next = event.target.valueAsNumber;
                field.onChange(Number.isNaN(next) ? 0 : next);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
