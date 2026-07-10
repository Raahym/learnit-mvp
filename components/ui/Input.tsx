import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, id, className = "", ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  if (label) {
    return (
      <div className="field">
        <label htmlFor={inputId}>{label}</label>
        <input id={inputId} className={`input ${className}`.trim()} {...props} />
      </div>
    );
  }

  return <input className={`input ${className}`.trim()} {...props} />;
}
