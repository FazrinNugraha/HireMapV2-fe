type SelectFieldProps = {
  label: string
  value: string
  options: string[]
  disabled?: boolean
  onChange: (value: string) => void
}

export function SelectField({
  label,
  value,
  options,
  disabled = false,
  onChange,
}: SelectFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <select
        className="rounded-[20px] border border-[#141413]/20 bg-white px-4 py-3 font-normal outline-none focus:border-[#141413]"
        value={value}
        disabled={disabled || options.length === 0}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

