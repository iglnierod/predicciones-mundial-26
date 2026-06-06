import type { ReactNode } from "react";

type Props = {
  label: ReactNode;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export default function TextField({
  label,
  value,
  placeholder,
  disabled = false,
  onChange,
}: Props) {
  return (
    <div className="space-y-2">
      <label className="block text-[13px] font-bold tracking-wide text-black">
        {label}
      </label>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black shadow-sm transition outline-none placeholder:text-black/35 focus:border-[#2A398D]/40 focus:ring-2 focus:ring-[#2A398D]/10 disabled:cursor-not-allowed disabled:bg-black/5 disabled:text-black/45"
      />
    </div>
  );
}
