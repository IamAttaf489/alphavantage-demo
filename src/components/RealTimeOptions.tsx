import React, { useEffect, useState } from 'react';
import AlphaVantageJSON from "../json/AlphaVantage.json";

interface TimeSeriesData {
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

interface RealTimeOptionsData {
  [timestamp: string]: TimeSeriesData;
}

interface AlphaVantageResponse {
  "Time Series (5min)": {
    [timestamp: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
    };
  };
}

const RealTimeOptions: React.FC = () => {
  const [data, setData] = useState<RealTimeOptionsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const apiKey = "RIBXT3XYLI69PC0Q";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Attempt to retrieve cached data from local storage to avoid unnecessary API calls
        const cachedData = localStorage.getItem('realTimeOptionsData');
        if (cachedData) {
          setData(JSON.parse(cachedData));
          setLoading(false);
          return;
        }

        // Fetch data from AlphaVantage API
        const response = await fetch(`https://www.alphavantage.co/query?function=REALTIME_OPTIONS&symbol=IBM&apikey=${apiKey}`);
        if (!response.ok) {
          throw new Error('Something went wrong');
        }

        // Check for fallback data scenario when API limit complet
        const apiResponse: AlphaVantageResponse | { Information: string } = await response.json();
        let jsonData: AlphaVantageResponse;

        if ('Information' in apiResponse) {
          // Use JSON data from a local file when API limit is exceeded
          jsonData = AlphaVantageJSON as AlphaVantageResponse;
        } else {
          jsonData = apiResponse;
        }

        // Transform API data into a simpler format
        const transformedData: RealTimeOptionsData = {};

        for (const [timestamp, values] of Object.entries(jsonData['Time Series (5min)'])) {
          transformedData[timestamp] = {
            open: values['1. open'],
            high: values['2. high'],
            low: values['3. low'],
            close: values['4. close'],
            volume: values['5. volume'],
          };
        }

        // Update state and cache data for future use
        setData(transformedData);
        localStorage.setItem('realTimeOptionsData', JSON.stringify(transformedData));
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      {data ? (
        <div className="bg-white shadow-md rounded p-4 overflow-x-auto">
          <h1 className="text-xl font-bold mb-4">Real-Time Options for IBM</h1>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                {['Timestamp', 'Open', 'High', 'Low', 'Close', 'Volume'].map((header) => (
                  <th key={header} className="text-left py-2 border-b">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([timestamp, values], index) => (
                <tr key={timestamp} className={index % 2 === 0 ? "bg-gray-100" : "bg-gray-200"}>
                  <td className="py-2 border-b">{timestamp}</td>
                  {Object.values(values).map((value, i) => (
                    <td key={i} className="py-2 border-b">{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center">No data available</div>
      )}
    </div>
  );
};

export default RealTimeOptions;
