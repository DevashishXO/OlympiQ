import { useState } from "react";
import { useGetCorrelationQuery } from "../../store/api";

export default function Report4() {
  const [factor, setFactor] = useState("gdp");
  const [medalType, setMedalType] = useState("Gold");
  const [method, setMethod] = useState("pearson");

  const { data, error, isLoading } = useGetCorrelationQuery({
    factor,
    medal_type: medalType,
    method,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl text-gray-400 animate-pulse">Loading data, please wait...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center text-red-400">
          <p className="text-2xl font-semibold mb-2">Error fetching data</p>
          <p className="text-md">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 bg-neutral-900 shadow-2xl rounded-2xl">
      <h3 className="text-4xl font-bold text-white mb-8 text-center">
        Correlation between <span className="text-[color:var(--olympiq-blue)]">{data.factor}</span> and{" "}
        <span className="text-[color:var(--olympiq-blue)]">{data.medal_type}</span>
      </h3>

      {/* Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Factor */}
        <div className="flex flex-col">
          <label className="text-gray-300 text-sm mb-1">Select Factor</label>
          <select
            value={factor}
            onChange={(e) => setFactor(e.target.value)}
            className="bg-neutral-800 text-white p-3 rounded-lg border border-gray-700 focus:outline-none focus:border-[color:var(--olympiq-blue)] transition"
          >
            <option value="gdp">GDP</option>
            <option value="gdp_per_capita">GDP per Capita</option>
            <option value="education_exp">Education Expenditure</option>
            <option value="health_exp">Health Expenditure</option>
            <option value="life_expectancy">Life Expectancy</option>
            <option value="literacy_rate">Literacy Rate</option>
            <option value="political_stability">Political Stability</option>
            <option value="population">Population</option>
            <option value="urban_population">Urban Population</option>
          </select>
        </div>

        {/* Medal Type */}
        <div className="flex flex-col">
          <label className="text-gray-300 text-sm mb-1">Select Medal Type</label>
          <select
            value={medalType}
            onChange={(e) => setMedalType(e.target.value)}
            className="bg-neutral-800 text-white p-3 rounded-lg border border-gray-700 focus:outline-none focus:border-[color:var(--olympiq-blue)] transition"
          >
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Bronze">Bronze</option>
            <option value="Total">Total</option>
          </select>
        </div>

        {/* Method */}
        <div className="flex flex-col">
          <label className="text-gray-300 text-sm mb-1">Select Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="bg-neutral-800 text-white p-3 rounded-lg border border-gray-700 focus:outline-none focus:border-[color:var(--olympiq-blue)] transition"
          >
            <option value="pearson">Pearson</option>
            <option value="kendall">Kendall</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="mt-6 p-6 bg-neutral-800 rounded-xl text-white space-y-4 shadow-lg">
        <div className="flex justify-between">
          <span className="text-gray-400">Correlation Coefficient:</span>
          <span className="font-semibold">{data.correlation_coefficient}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">P-value:</span>
          <span className="font-semibold">{data.p_value}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Number of Samples:</span>
          <span className="font-semibold">{data.n_samples}</span>
        </div>
      </div>
    </div>
  );
}
