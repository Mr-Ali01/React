function CurrencySelect({
  label,
  value,
  onChange,
  currencies,
}) {
  return (
    <div className="form-group">
      <label>{label}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {currencies.map((currency) => (
          <option
            key={currency.code}
            value={currency.code}
          >
            {currency.code} - {currency.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CurrencySelect;