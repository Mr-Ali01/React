function CurrencyInput({ amount, setAmount }) {
  return (
    <div className="form-group">
      <label>Amount</label>

      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount"
      />
    </div>
  );
}

export default CurrencyInput;