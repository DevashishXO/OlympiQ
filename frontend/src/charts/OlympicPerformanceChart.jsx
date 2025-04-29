import React, { useEffect, useState } from "react";
import { useGetMedalsQuery } from "../store/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from "recharts";

const OlympicPerformanceChart = () => {
  const { data: medalsData, isLoading, error } = useGetMedalsQuery();
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchCountry, setSearchCountry] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSelectedCountries, setModalSelectedCountries] = useState([]);

  useEffect(() => {
    if (medalsData) {
      const years = [...new Set(medalsData.map((item) => item.Year))].sort(
        (a, b) => b - a
      );
      if (!selectedYear) setSelectedYear(years[0]);
    }
  }, [medalsData]);

  useEffect(() => {
    if (medalsData && selectedYear) {
      const yearData = medalsData.filter((item) => item.Year === selectedYear);

      const dataMap = {};
      yearData.forEach(({ Country, Gold, Silver, Bronze }) => {
        dataMap[Country] = {
          country: Country,
          gold: Gold,
          silver: Silver,
          bronze: Bronze,
          total: Gold + Silver + Bronze,
        };
      });

      let formatted = Object.values(dataMap).sort((a, b) => b.total - a.total);
      if (selectedCountries.length > 0) {
        formatted = formatted.filter((item) =>
          selectedCountries.includes(item.country)
        );
      }

      setFilteredData(formatted);
    }
  }, [medalsData, selectedYear, selectedCountries]);

  if (isLoading)
    return <div className="text-center text-white">Loading...</div>;
  if (error)
    return <div className="text-center text-red-500">Error loading data</div>;

  const availableYears = [...new Set(medalsData.map((item) => item.Year))].sort(
    (a, b) => b - a
  );
  const allCountries = [
    ...new Set(
      medalsData
        .filter((item) => item.Year === selectedYear)
        .map((item) => item.Country)
    ),
  ].sort();

  const toggleCountry = (e) => {
    const country = e.target.value;
    setSelectedCountries((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country]
    );
  };

  const handleSelectAll = () => {
    setSelectedCountries(allCountries);
  };

  const handleClearAll = () => {
    setSelectedCountries([]);
  };

  const filteredCountries = allCountries.filter((country) =>
    country.toLowerCase().includes(searchCountry.toLowerCase())
  );

  const handleOpenModal = () => {
    setModalSelectedCountries([...selectedCountries]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleApplyFilters = () => {
    setSelectedCountries([...modalSelectedCountries]);
    handleCloseModal();
  };

  return (
    <div className="min-w-5xl mx-auto p-6 bg-neutral-900 text-white border border-neutral-700 rounded-lg shadow-xl">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-6">
        {/* Year Dropdown */}
        <div className="flex flex-col">
          <label className="mb-1 font-semibold">Select Year</label>
          <select
            className="bg-neutral-800 text-white border border-neutral-600 rounded-full px-3 py-2"
            value={selectedYear ?? ""}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setSelectedCountries([]);
            }}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Button */}
        <button
          onClick={handleOpenModal}
          className="bg-(--olympiq-blue) hover:bg-yellow-500 text-neutral-900 px-4 py-2 rounded-full"
        >
          Filter Countries
        </button>
      </div>

      {/* Chart */}
      <div className="h-[600px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={filteredData}
            margin={{ top: 20, right: 30, left: 10, bottom: 100 }}
          >
            <defs>
              <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFB800" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#FFB800" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSilver" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C0C0C0" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#C0C0C0" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBronze" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#CD7F32" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#CD7F32" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis
              dataKey="country"
              angle={-40}
              textAnchor="end"
              interval={0}
              height={120}
              tick={{ fill: "#ccc", fontSize: 12 }}
            />
            <YAxis tick={{ fill: "#ccc" }}>
              <Label
                value="Medals Count"
                angle={-90}
                position="left"
                fill="#ccc"
                fontSize={14}
              />
            </YAxis>
            <Tooltip
              contentStyle={{ backgroundColor: "#222", borderColor: "#555" }}
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#eee" }}
              formatter={(value, name, props) => {
                const percentage = (
                  (value / props.payload.total) *
                  100
                ).toFixed(2);
                return [
                  `${value} (${percentage}%)`,
                  name.charAt(0).toUpperCase() + name.slice(1),
                ];
              }}
            />
            <Legend wrapperStyle={{ color: "#ccc" }} />
            <Area
              type="monotone"
              dataKey="gold"

              stackId="a"
              fill="#FFB800"  // Gold color 
              animationDuration={500}
            />
            <Area
              type="monotone"
              dataKey="silver"

              stackId="a"
              fill="#C0C0C0"  // Silver color 
              animationDuration={500}
            />
            <Area
              type="monotone"
              dataKey="bronze"

              stackId="a"
              fill="#CD7F32"  // Bronze color 
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Modal for Filtering */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start p-6 z-50">
          <div className="bg-neutral-800 p-6 rounded-lg w-full max-w-3xl animate__animated animate__fadeIn">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-semibold text-white">
                Filter Countries ({modalSelectedCountries.length} selected)
              </span>
              <button
                onClick={handleCloseModal}
                className="text-white text-xl font-semibold"
              >
                &times;
              </button>
            </div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search Country..."
                className="px-2 py-1 rounded bg-neutral-700 text-white border border-neutral-600 text-sm mb-3 w-full"
                value={searchCountry}
                onChange={(e) => setSearchCountry(e.target.value)}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
                {filteredCountries.map((country) => (
                  <label
                    key={country}
                    className="flex items-center gap-2 hover:bg-gray-700 rounded-md"
                  >
                    <input
                      type="checkbox"
                      value={country}
                      checked={modalSelectedCountries.includes(country)}
                      onChange={(e) => {
                        const selected = e.target.checked
                          ? [...modalSelectedCountries, country]
                          : modalSelectedCountries.filter((c) => c !== country);
                        setModalSelectedCountries(selected);
                      }}
                      className="accent-yellow-400"
                    />
                    <span className="truncate">{country}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCloseModal}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyFilters}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OlympicPerformanceChart;
