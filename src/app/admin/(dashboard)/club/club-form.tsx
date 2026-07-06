"use client";

import { useEffect, type ReactNode } from "react";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { SubmitBar } from "@/components/admin/SubmitBar";

import { updateClub, type UpdateClubResult } from "./action";
import { ClubAssetField } from "./club-asset-field";
import { KeywordsInput } from "./keywords-input";
import {
  DEFAULT_THEME_COLOR,
  SEO_DESCRIPTION_SOFT_MAX,
  SEO_TITLE_SOFT_MAX,
  clubSchema,
  type ClubFormValues,
} from "./schema";

type ClubFormProps = Readonly<{
  initialValues: ClubFormValues;
}>;

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_INPUT: "Some fields are invalid. Please review and try again.",
  CLUB_NOT_FOUND: "Club record was not found.",
  SAVE_FAILED: "Could not save changes. Please try again.",
};

function resultErrorMessage(result: Extract<UpdateClubResult, { ok: false }>) {
  return ERROR_MESSAGES[result.error] ?? "Could not save changes.";
}

type SectionProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}>;

function FormSection({ eyebrow, title, description, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">
          {eyebrow}
        </p>
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {title}
        </h2>
        <p className="text-sm text-white/60">{description}</p>
      </div>
      <Separator className="bg-white/10" />
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

type CounterProps = Readonly<{ current: number; soft: number }>;

function SoftCounter({ current, soft }: CounterProps) {
  const over = current > soft;
  return (
    <span
      className={over ? "font-mono text-amber-300" : "font-mono text-white/50"}
    >
      {current}/{soft}
    </span>
  );
}

type ThemeColorFieldProps = Readonly<{
  field: ControllerRenderProps<ClubFormValues, "themeColor">;
}>;

function ThemeColorField({ field }: ThemeColorFieldProps) {
  const swatch = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(field.value)
    ? field.value
    : DEFAULT_THEME_COLOR;
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        aria-label="Theme color picker"
        value={swatch}
        onChange={(event) => field.onChange(event.target.value)}
        className="size-12 shrink-0 cursor-pointer rounded-2xl border border-white/10 bg-transparent"
      />
      <Input
        {...field}
        type="text"
        inputMode="text"
        autoComplete="off"
        placeholder={DEFAULT_THEME_COLOR}
        className="font-mono"
      />
    </div>
  );
}

export function ClubForm({ initialValues }: ClubFormProps) {
  const form = useForm<ClubFormValues>({
    resolver: zodResolver(clubSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  const { isDirty, isSubmitting } = form.formState;

  useEffect(() => {
    if (!isDirty) {
      return;
    }
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    globalThis.window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      globalThis.window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await updateClub(values);
    if (result.ok) {
      form.reset(values);
      toast.success("Changes saved", {
        description: "Public metadata and branding updated.",
      });
      return;
    }
    toast.error(resultErrorMessage(result));
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-10" noValidate>
        <FormSection
          eyebrow="Identity"
          title="Branding"
          description="Name, crest, and theme color used across the public site."
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Club name</FormLabel>
                <FormControl>
                  <Input {...field} type="text" placeholder="Bester Football Club" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shortName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short name</FormLabel>
                <FormControl>
                  <Input {...field} type="text" placeholder="Bester FC" />
                </FormControl>
                <FormDescription>
                  Shown in the top bar and metadata template.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="crestUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crest</FormLabel>
                <ClubAssetField
                  kind="crest"
                  field={field}
                  label="Crest"
                  uploadDescription="Club logo / crest. Resized and compressed on upload."
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="themeColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Theme color</FormLabel>
                <FormControl>
                  <ThemeColorField field={field} />
                </FormControl>
                <FormDescription>Hex color, e.g. #0b1124.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection
          eyebrow="Social"
          title="Social links"
          description="Profiles linked from the public header. Leave empty to hide."
        >
          <FormField
            control={form.control}
            name="facebookUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Facebook URL</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="url"
                    inputMode="url"
                    placeholder="https://facebook.com/…"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="instagramUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram URL</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="url"
                    inputMode="url"
                    placeholder="https://instagram.com/…"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection
          eyebrow="SEO / Metadata"
          title="Search &amp; sharing"
          description="Controls the page title, description, keywords, and share card."
        >
          <FormField
            control={form.control}
            name="siteUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site URL</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="url"
                    inputMode="url"
                    placeholder="https://bester.fc"
                  />
                </FormControl>
                <FormDescription>
                  Canonical/base URL for metadata.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="seoTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="justify-between">
                  SEO title
                  <SoftCounter
                    current={field.value.length}
                    soft={SEO_TITLE_SOFT_MAX}
                  />
                </FormLabel>
                <FormControl>
                  <Input {...field} type="text" placeholder="Bester FC — Results" />
                </FormControl>
                <FormDescription>
                  Around {SEO_TITLE_SOFT_MAX} characters reads best.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="seoDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="justify-between">
                  SEO description
                  <SoftCounter
                    current={field.value.length}
                    soft={SEO_DESCRIPTION_SOFT_MAX}
                  />
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={3}
                    className="min-h-24 rounded-2xl border-white/10 bg-[#0b1224]/60 px-4 py-3 text-base text-white"
                    placeholder="Official Bester FC dashboard…"
                  />
                </FormControl>
                <FormDescription>
                  Around {SEO_DESCRIPTION_SOFT_MAX} characters reads best.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="seoKeywords"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="seoKeywords">Keywords</FormLabel>
                <KeywordsInput
                  id="seoKeywords"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
                <FormDescription>
                  Press Enter or comma to add each keyword.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ogImageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Open Graph image</FormLabel>
                <ClubAssetField
                  kind="og"
                  field={field}
                  label="Open Graph image"
                  uploadDescription="Shown when the site is shared (1200×630)."
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <SubmitBar
          pending={isSubmitting}
          disabled={!isDirty}
          saveLabel="Save changes"
          pendingLabel="Saving…"
        />
      </form>
    </Form>
  );
}
