type Option = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  value: string;
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
};

export default function OptionSelectField({
  label,
  value,
  options,
  placeholder = "Selecciona una opción",
  onChange,
}: Props) {
  return (
    <div className="space-y-2">
      <label className="block text-[13px] font-bold tracking-wide text-black">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full cursor-pointer rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black shadow-sm transition outline-none focus:border-[#2A398D]/40 focus:ring-2 focus:ring-[#2A398D]/10"
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
