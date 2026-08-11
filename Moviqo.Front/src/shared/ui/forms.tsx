import type {
  ChangeEventHandler,
  ComponentPropsWithRef,
  ReactNode
} from "react";

export type FormGridSpan = "full" | "wide" | "half" | "third" | "quarter" | "compact" | "auto";

type FormGridProps = {
  children: ReactNode;
};

type FormGridItemProps = {
  children: ReactNode;
  span?: FormGridSpan;
};

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  titleId: string;
};

type FormFieldProps = {
  id: string;
  label: string;
  helpText?: string;
  errorMessage?: string;
  required?: boolean;
  children: ReactNode;
};

type TextInputProps = Omit<ComponentPropsWithRef<"input">, "className" | "id"> & {
  id: string;
  label: string;
  helpText?: string;
  errorMessage?: string;
};

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectFieldProps = Omit<ComponentPropsWithRef<"select">, "className" | "id"> & {
  id: string;
  label: string;
  helpText?: string;
  errorMessage?: string;
  options: readonly SelectOption[];
};

type CheckboxFieldProps = Omit<ComponentPropsWithRef<"input">, "className" | "id" | "type"> & {
  id: string;
  label: ReactNode;
  helpText?: string;
  errorMessage?: string;
};

const spanClasses: Record<FormGridSpan, string> = {
  full: "col-span-1 tablet:col-span-12",
  wide: "col-span-1 tablet:col-span-12 desktop:col-span-8",
  half: "col-span-1 tablet:col-span-6",
  third: "col-span-1 tablet:col-span-6 desktop:col-span-4",
  quarter: "col-span-1 tablet:col-span-6 desktop:col-span-3",
  compact: "col-span-1 tablet:col-span-4 desktop:col-span-3",
  auto: "col-span-1 tablet:col-span-6 desktop:col-span-auto"
};

const fieldControlClasses =
  "min-h-11 w-full rounded-moviqo-field border border-moviqo-control-border bg-moviqo-surface-raised px-moviqo-3 text-moviqo-body text-moviqo-ink-primary placeholder:text-moviqo-ink-disabled hover:border-moviqo-ink-primary focus-visible:border-moviqo-focus focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-moviqo-focus disabled:cursor-not-allowed disabled:bg-moviqo-surface-soft disabled:text-moviqo-ink-disabled";

const passwordControlClasses =
  "min-h-11 w-full rounded-moviqo-field border border-moviqo-control-border bg-moviqo-surface-raised px-moviqo-3 pr-12 text-moviqo-body text-moviqo-ink-primary placeholder:text-moviqo-ink-disabled hover:border-moviqo-ink-primary focus-visible:border-moviqo-focus focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-moviqo-focus disabled:cursor-not-allowed disabled:bg-moviqo-surface-soft disabled:text-moviqo-ink-disabled";

const describedBy = (id: string, helpText?: string, errorMessage?: string) => {
  const ids = [];
  if (helpText) {
    ids.push(`${id}-help`);
  }
  if (errorMessage) {
    ids.push(`${id}-error`);
  }
  return ids.length > 0 ? ids.join(" ") : undefined;
};

const mergeIds = (...values: Array<string | undefined>) => {
  const ids = values.flatMap((value) => value?.split(/\s+/).filter(Boolean) ?? []);
  return ids.length > 0 ? [...new Set(ids)].join(" ") : undefined;
};

export const FormGrid = ({ children }: FormGridProps) => {
  return <div className="grid grid-cols-1 gap-moviqo-4 tablet:grid-cols-12">{children}</div>;
};

export const FormGridItem = ({ children, span = "full" }: FormGridItemProps) => {
  return (
    <div className={spanClasses[span]} data-layout-span={span}>
      {children}
    </div>
  );
};

export const FormSection = ({ title, description, children, titleId }: FormSectionProps) => {
  return (
    <section className="grid gap-moviqo-4 border-0 border-t border-moviqo-border pt-moviqo-5 first:border-t-0 first:pt-0" aria-labelledby={titleId}>
      <div className="grid gap-moviqo-1">
        <h2 className="m-0 text-moviqo-heading font-semibold text-moviqo-ink-primary" id={titleId}>
          {title}
        </h2>
        {description ? <p className="m-0 text-moviqo-body text-moviqo-ink-secondary">{description}</p> : null}
      </div>
      {children}
    </section>
  );
};

export const FormField = ({
  id,
  label,
  helpText,
  errorMessage,
  required,
  children
}: FormFieldProps) => {
  return (
    <div className="grid min-w-0 gap-moviqo-2">
      <label className="text-moviqo-label font-semibold text-moviqo-ink-primary" htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {helpText ? <p className="m-0 text-sm text-moviqo-ink-secondary" id={`${id}-help`}>{helpText}</p> : null}
      {children}
      {errorMessage ? (
        <p className="m-0 flex items-start gap-moviqo-1 text-sm font-semibold text-moviqo-error" id={`${id}-error`}>
          <span aria-hidden="true">!</span>
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

export const TextInput = ({
  id,
  label,
  helpText,
  errorMessage,
  required,
  ref,
  "aria-describedby": externalDescribedBy,
  "aria-invalid": externalInvalid,
  ...inputProps
}: TextInputProps) => {
  return (
    <FormField id={id} label={label} helpText={helpText} errorMessage={errorMessage} required={required}>
      <input
        {...inputProps}
        className={fieldControlClasses}
        id={id}
        ref={ref}
        required={required}
        aria-describedby={mergeIds(externalDescribedBy, describedBy(id, helpText, errorMessage))}
        aria-invalid={errorMessage ? true : externalInvalid}
      />
    </FormField>
  );
};

export const SelectField = ({
  id,
  label,
  helpText,
  errorMessage,
  required,
  options,
  ref,
  "aria-describedby": externalDescribedBy,
  "aria-invalid": externalInvalid,
  ...selectProps
}: SelectFieldProps) => {
  return (
    <FormField id={id} label={label} helpText={helpText} errorMessage={errorMessage} required={required}>
      <select
        {...selectProps}
        className={fieldControlClasses}
        id={id}
        ref={ref}
        required={required}
        aria-describedby={mergeIds(externalDescribedBy, describedBy(id, helpText, errorMessage))}
        aria-invalid={errorMessage ? true : externalInvalid}
      >
        {options.map((option) => (
          <option disabled={option.disabled} key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};

export const CheckboxField = ({
  id,
  label,
  helpText,
  errorMessage,
  required,
  ref,
  "aria-describedby": externalDescribedBy,
  "aria-invalid": externalInvalid,
  ...inputProps
}: CheckboxFieldProps) => {
  return (
    <div className="grid gap-moviqo-2">
      <label className="grid min-h-11 grid-cols-[auto_minmax(0,1fr)] items-start gap-moviqo-3 text-moviqo-body text-moviqo-ink-primary" htmlFor={id}>
        <input
          {...inputProps}
          className="mt-moviqo-1 size-5 accent-moviqo-primary focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-moviqo-focus"
          id={id}
          ref={ref}
          type="checkbox"
          required={required}
          aria-describedby={mergeIds(externalDescribedBy, describedBy(id, helpText, errorMessage))}
          aria-invalid={errorMessage ? true : externalInvalid}
        />
        <span>
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </span>
      </label>
      {helpText ? <p className="m-0 text-sm text-moviqo-ink-secondary" id={`${id}-help`}>{helpText}</p> : null}
      {errorMessage ? <p className="m-0 text-sm font-semibold text-moviqo-error" id={`${id}-error`}>{errorMessage}</p> : null}
    </div>
  );
};

export type PasswordFieldInputProps = Omit<
  ComponentPropsWithRef<"input">,
  "className" | "id" | "type" | "pattern" | "minLength" | "maxLength"
>;

export type PasswordFieldProps = PasswordFieldInputProps & {
  id: string;
  label: string;
  helperText: string;
  revealLabel: string;
  hideLabel: string;
  isRevealed: boolean;
  onRevealToggle: () => void;
  errorMessage?: string;
};

const EyeIcon = () => {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M2.1 12a10.9 10.9 0 0 1 19.8 0 10.9 10.9 0 0 1-19.8 0Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
};

const EyeOffIcon = () => {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 5.6A11.7 11.7 0 0 1 12 5.5c5.1 0 8.6 2.6 9.9 6.5a10.8 10.8 0 0 1-2.4 3.8" />
      <path d="M6.2 6.2A10.6 10.6 0 0 0 2.1 12c1.3 3.9 4.8 6.5 9.9 6.5 1.5 0 2.8-.2 4-.7" />
    </svg>
  );
};

export const PasswordFieldControl = ({
  id,
  label,
  helperText,
  revealLabel,
  hideLabel,
  isRevealed,
  onRevealToggle,
  errorMessage,
  autoComplete = "new-password",
  spellCheck = false,
  disabled,
  required,
  ref,
  "aria-describedby": externalDescribedBy,
  "aria-invalid": externalInvalid,
  ...inputProps
}: PasswordFieldProps) => {
  return (
    <FormField id={id} label={label} helpText={helperText} errorMessage={errorMessage} required={required}>
      <div className="relative">
        <input
          {...inputProps}
          className={passwordControlClasses}
          id={id}
          ref={ref}
          type={isRevealed ? "text" : "password"}
          autoComplete={autoComplete}
          spellCheck={spellCheck}
          disabled={disabled}
          required={required}
          aria-describedby={mergeIds(externalDescribedBy, describedBy(id, helperText, errorMessage))}
          aria-invalid={errorMessage ? true : externalInvalid}
        />
        <button
          className="absolute inset-y-0 right-0 inline-flex min-h-11 min-w-11 items-center justify-center rounded-r-moviqo-field text-moviqo-ink-secondary hover:bg-moviqo-surface-soft hover:text-moviqo-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-moviqo-focus disabled:cursor-not-allowed disabled:text-moviqo-ink-disabled"
          type="button"
          aria-label={isRevealed ? hideLabel : revealLabel}
          aria-pressed={isRevealed}
          disabled={disabled}
          onClick={onRevealToggle}
          title={isRevealed ? hideLabel : revealLabel}
        >
          {isRevealed ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </FormField>
  );
};

export type FieldChangeHandler = ChangeEventHandler<HTMLInputElement>;
