function ConversionResult({
  result,
  amount,
  fromCurrency,
  toCurrency,
}) {
  if (result === null) {
    return null;
  }

  return (
    <div className="result">
      <p>
        {amount} {fromCurrency}
      </p>

      <h2>
        {result} {toCurrency}
      </h2>
    </div>
  );
}

export default ConversionResult;