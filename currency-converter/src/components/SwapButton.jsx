function SwapButton({
  fromCurrency,
  toCurrency,
  setFromCurrency,
  setToCurrency,
}) {
  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <button
      type="button"
      className="swap-btn"
      onClick={handleSwap}
    >
      ⇅ Swap
    </button>
  );
}

export default SwapButton;