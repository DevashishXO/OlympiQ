import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Select from "react-select";
import {
  useGetAllPopulationQuery,
  useGetAllStabilityQuery,
  useGetMedalsQuery,
} from "../store/api";

const ScatterPlotOlympics = () => {
  const { data: populationData } = useGetAllPopulationQuery();
  const { data: stabilityData } = useGetAllStabilityQuery();
  const { data: medalsData } = useGetMedalsQuery();
  const svgRef = useRef();
  const [mergedData, setMergedData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2000);
  const [selectedCountries, setSelectedCountries] = useState([]);

  const handleYearChange = (e) => setSelectedYear(+e.target.value);
  const handleCountryChange = (opts) => {
    setSelectedCountries(opts ? opts.map(o => o.value) : []);
  };

  // Merge and fill data
  useEffect(() => {
    if (!populationData || !stabilityData || !medalsData) return;
    const parse = v => isNaN(+v) ? NaN : +v;
    const popMap = d3.group(populationData, d => d.Country + ":" + d.Year);
    const stabMap = d3.group(stabilityData, d => d.Country + ":" + d.Year);
    const medalMap = d3.rollup(medalsData,
      v => d3.sum(v, d => d.Gold + d.Silver + d.Bronze),
      d => d.Country + ":" + d.Year
    );

    const avgPSI = d3.rollup(
      stabilityData.filter(d => !isNaN(parse(d["Political Stability Index"]))),
      v => d3.mean(v, d => parse(d["Political Stability Index"])),
      d => d.Country
    );
    const avgPop = d3.rollup(
      populationData.filter(d => !isNaN(parse(d.Population))),
      v => d3.mean(v, d => parse(d.Population)),
      d => d.Country
    );

    const final = [];
    new Set(populationData.map(d => d.Country))
      .forEach(country => {
        const key = country + ":" + selectedYear;
        const popEntry = popMap.get(key)?.[0];
        const stabEntry = stabMap.get(key)?.[0];
        const population = popEntry ? parse(popEntry.Population) : avgPop.get(country) || 0;
        const psi = stabEntry ? parse(stabEntry["Political Stability Index"]) : avgPSI.get(country) || 0;
        const medals = medalMap.get(key) || 0;
        if (!isNaN(population) && !isNaN(psi)) {
          final.push({ country, population, psi, medals });
        }
      });

    setMergedData(
      selectedCountries.length > 0
        ? final.filter(d => selectedCountries.includes(d.country))
        : final
    );
  }, [populationData, stabilityData, medalsData, selectedYear, selectedCountries]);

  // Draw scatter
  useEffect(() => {
    if (!mergedData.length) return;
    const width = 800, height = 600;
    const margin = { top: 60, right: 40, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const plot = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain(d3.extent(mergedData, d => d.population)).nice()
      .range([0, innerWidth]);
    const y = d3.scaleLinear()
      .domain(d3.extent(mergedData, d => d.psi)).nice()
      .range([innerHeight, 0]);
    const size = d3.scaleSqrt()
      .domain([0, d3.max(mergedData, d => d.medals)])
      .range([4, 20]);

    // X Axis
    plot.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll("text").attr("fill", "white");

    // Y Axis
    plot.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text").attr("fill", "white");

    // X Axis Label
    svg.append("text")
      .attr("x", margin.left + innerWidth / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "14px")
      .text("Population");

    // Y Axis Label
    svg.append("text")
      .attr("x", - (margin.top + innerHeight / 2))
      .attr("y", 20)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "14px")
      .text("Political Stability Index");

    // Points
    plot.selectAll("circle")
      .data(mergedData, d => d.country)
      .join("circle")
      .attr("cx", d => x(d.population))
      .attr("cy", d => y(d.psi))
      .attr("r", d => size(d.medals))
      .attr("fill", "#69b3a2")
      .attr("opacity", 0.7)
      .append("title")
      .text(d => `${d.country}\nPop: ${d.population}\nPSI: ${d.psi}\nMedals: ${d.medals}`);
  }, [mergedData]);

  const countryOptions = populationData
    ? Array.from(new Set(populationData.map(d => d.Country)))
        .map(c => ({ label: c, value: c }))
    : [];

  return (
    <div style={{ backgroundColor: "black", padding: "1rem" }}>
      <h2 style={{ color: "white", textAlign: "center", marginBottom: "1rem" }}>
        Olympics Context Scatter Plot
      </h2>
      <h3 style={{ color: "white", textAlign: "center" }}>
        Year: {selectedYear}
      </h3>
      <input
        type="range"
        min="2000"
        max="2024"
        step="4"
        value={selectedYear}
        onChange={handleYearChange}
        className="mb-4 w-full"
      />
      <Select
        isMulti
        options={countryOptions}
        value={countryOptions.filter(o => selectedCountries.includes(o.value))}
        onChange={handleCountryChange}
        placeholder="Select Countries"
        styles={{
          control: base => ({ ...base, backgroundColor: '#333', borderColor: '#555' }),
          menu: base => ({ ...base, backgroundColor: '#333' }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? '#555' : '#333',
            color: 'white'
          }),
          singleValue: base => ({ ...base, color: 'white' }),
          multiValue: base => ({ ...base, backgroundColor: '#555' }),
          multiValueLabel: base => ({ ...base, color: 'white' }),
          input: base => ({ ...base, color: 'white' }),
          placeholder: base => ({ ...base, color: '#aaa' }),
        }}
        className="mb-4"
      />
      <svg ref={svgRef} />
    </div>
  );
};

export default ScatterPlotOlympics;
