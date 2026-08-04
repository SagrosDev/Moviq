import type { InputHTMLAttributes } from "react";

import { Button } from "./Button";

type PasswordFieldInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "pattern" | "minLength" | "maxLength"
>;

type PasswordFieldProps = PasswordFieldInputProps & {
  label: string;
  helperText: string;
  revealLabel: string;
  hideLabel: string;
  isRevealed: boolean;
  onRevealToggle?: () => void;
  errorMessage?: string;
};

const buildDescribedBy = (helperId: string, errorId?: string) => {
  return errorId ? `${helperId} ${errorId}` : helperId;
};

export const PasswordField = ({
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
  ...inputProps
}: PasswordFieldProps) => {
  const helperId = `${id}-help`;
  const errorId = errorMessage ? `${id}-error` : undefined;

  return (
    <div className="password-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-field__control">
        <input
          {...inputProps}
          id={id}
          type={isRevealed ? "text" : "password"}
          autoComplete={autoComplete}
          spellCheck={spellCheck}
          aria-describedby={buildDescribedBy(helperId, errorId)}
          aria-invalid={errorMessage ? true : undefined}
        />
        <Button
          type="button"
          aria-label={isRevealed ? hideLabel : revealLabel}
          aria-pressed={isRevealed}
          onClick={onRevealToggle}
        >
          {isRevealed ? hideLabel : revealLabel}
        </Button>
      </div>
      <p id={helperId}>{helperText}</p>
      {errorMessage ? <p id={errorId}>{errorMessage}</p> : null}
    </div>
  );
};
