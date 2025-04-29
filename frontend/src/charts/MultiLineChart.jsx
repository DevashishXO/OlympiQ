import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import {
  useGetAllPopulationQuery,
  useGetAllHealthExpenditureQuery,
} from "../store/api";

const MultiLineChart = () => {
  const { data: populationData } = useGetAllPopulationQuery();
  const { data: healthData } = useGetAllHealthExpenditureQuery();

  const [selectedCountries, setSelectedCountries] = useState([]);
  const [allCountries, setAllCountries] = useState([]);
  const [attributes, setAttributes] = useState(["Population"]); // Default to "Population"
  const [chartData, setChartData] = useState([]);

  // Populate the country list from both health and population data
  useEffect(() => {
    const allCountrySources = [populationData, healthData];
    const all = allCountrySources.flatMap((data) => (data ? data.map((d) => d.Country) : []));
    const uniqueCountries = [...new Set(all)].sort();
    setAllCountries(uniqueCountries);
  }, [populationData, healthData]);

  // Update chart data whenever selected countries or attributes change
  useEffect(() => {
    if (!selectedCountries.length) return;

    let rawData = [];
    let attributeKeys = attributes.map(attr => {
      if (attr === "Population") return "Population";
      if (attr === "Health Expenditure") return "Health Exp (%GDP)";
      return "";
    });

    const grouped = selectedCountries.map((country) => {
      const countryData = attributeKeys.map((attributeKey) => {
        let rawAttributeData = [];
        if (attributeKey === "Population") rawAttributeData = populationData;
        else if (attributeKey === "Health Exp (%GDP)") rawAttributeData = healthData;

        return {
          country,
          values: rawAttributeData
            .filter((d) => d.Country === country)
            .map((d) => ({
              year: +d.Year,
              value: +d[attributeKey] || 0,
              attribute: attributeKey,
            })),
        };
      });
      return countryData;
    });

    setChartData(grouped.flat());
  }, [selectedCountries, attributes, populationData, healthData]);

  // D3 chart rendering
  useEffect(() => {
    if (!chartData.length) return;

    d3.select("#multi-line-chart").selectAll("*").remove();

    const width = 1200; // increased width
    const height = 500;
    const margin = { top: 50, right: 180, bottom: 50, left: 80 }; // increased right margin
    

    const svg = d3
      .select("#multi-line-chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3
      .scaleLinear()
      .domain([
        d3.min(chartData, (d) => d3.min(d.values, (v) => v.year)),
        d3.max(chartData, (d) => d3.max(d.values, (v) => v.year)),
      ])
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(chartData, (d) => d3.max(d.values, (v) => v.value)),
      ])
      .nice()
      .range([innerHeight, 0]);

    const line = d3
      .line()
      .x((d) => x(d.year))
      .y((d) => y(d.value));

    chart
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    chart.append("g").call(d3.axisLeft(y));

    chartData.forEach((data, i) => {
      chart
        .append("path")
        .datum(data.values)
        .attr("fill", "none")
        .attr("stroke", d3.schemeCategory10[i % 10])
        .attr("stroke-width", 2)
        .attr("d", line);

      chart
        .append("text")
        .attr("x", innerWidth + 5)
        .attr("y", y(data.values[data.values.length - 1].value))
        .attr("fill", d3.schemeCategory10[i % 10])
        .text(`${data.country} (${data.values[0].attribute})`);
    });
  }, [chartData]);

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <select
          multiple
          className="border p-2 rounded w-1/2 text-black bg-white"
          onChange={(e) =>
            setSelectedCountries(Array.from(e.target.selectedOptions, (opt) => opt.value))
          }
        >
          {allCountries.map((c) => (
            <option key={c} value={c} className="text-black">
              {c}
            </option>
          ))}
        </select>
        <select
          multiple
          value={attributes}
          onChange={(e) => setAttributes(Array.from(e.target.selectedOptions, (opt) => opt.value))}
          className="border p-2 rounded text-black bg-white"
        >
          <option value="Population">Population</option>
          <option value="Health Expenditure">Health Expenditure</option>
        </select>
      </div>
      <div id="multi-line-chart"></div>
    </div>
  );
};

export default MultiLineChart;
