import { useRef, useState } from "react";

import CurrencyInput from "./CurrencyInput";
import CurrencySelect from "./CurrencySelect";
import SwapButton from "./SwapButton";
import ConversionResult from "./ConversionResult";

import { currencies } from "../utils/currencies";
import useCurrencyInfo from "../hooks/useCurrencyInfo";

function CurrencyConverter() {
  const [amount, setAmount] = useState(1);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("INR");
  const [result, setResult] = useState(null);

  const amountRef = useRef(null);

  const {
    data: rates,
    loading,
    error,
  } = useCurrencyInfo(fromCurrency);

  const handleConvert = () => {
    if (!amount || Number(amount) <= 0) {
      setResult(null);
      return;
    }

    if (fromCurrency === toCurrency) {
      setResult(Number(amount).toFixed(2));
      return;
    }

    const rate = rates[toCurrency];

    if (!rate) {
      setResult(null);
      return;
    }

    const converted = Number(amount) * rate;

    setResult(converted.toFixed(2));
  };

  return (
    <section className="converter-section">
      <div className="converter-card">

        <h2>Currency Converter</h2>

        <CurrencyInput
          amount={amount}
          setAmount={setAmount}
          inputRef={amountRef}
        />

        <CurrencySelect
          label="From"
          value={fromCurrency}
          onChange={setFromCurrency}
          currencies={currencies}
        />

        <SwapButton
          fromCurrency={fromCurrency}
          toCurrency={toCurrency}
          setFromCurrency={setFromCurrency}
          setToCurrency={setToCurrency}
        />

        <CurrencySelect
          label="To"
          value={toCurrency}
          onChange={setToCurrency}
          currencies={currencies}
        />

        <button
          type="button"
          className="convert-btn"
          onClick={handleConvert}
          disabled={loading}
        >
          {loading ? "Loading..." : "Convert"}
        </button>

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        <ConversionResult
          result={result}
          amount={amount}
          fromCurrency={fromCurrency}
          toCurrency={toCurrency}
        />

      </div>
    </section>
  );
}

export default CurrencyConverter;