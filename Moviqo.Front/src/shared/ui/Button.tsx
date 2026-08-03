import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export const Button = ({ children, className, ...props }: ButtonProps) => {
  return (
    <button className={className ? `button ${className}` : "button"} {...props}>
      {children}
    </button>
  );
};
