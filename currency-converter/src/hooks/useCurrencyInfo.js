import { useEffect, useState } from "react";

function useCurrencyInfo(currency) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currency) return;

    const fetchRates = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://open.er-api.com/v6/latest/${currency}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch exchange rates");
        }

        const result = await response.json();

        if (result.result !== "success") {
          throw new Error("Unable to fetch exchange rates");
        }

        setData(result.rates);
      } catch (err) {
        setError(err.message);
        setData({});
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, [currency]);

  return {
    data,
    loading,
    error,
  };
}

export default useCurrencyInfo;