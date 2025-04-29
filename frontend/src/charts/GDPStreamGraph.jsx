import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Select from "react-select";
import { useGetAllGDPPerCapitaQuery } from "../store/api";

const GDPStreamGraph = () => {
  const { data: gdpData, isLoading, isError } = useGetAllGDPPerCapitaQuery();
  const svgRef = useRef();
  const [selectedCountries, setSelectedCountries] = useState([]);
  
  const width = 928;
  const height = 500;
  const marginTop = 10;
  const marginRight = 160; 
  const marginBottom = 30;
  const marginLeft = 50;

  useEffect(() => {
    if (!gdpData) return;

    // Process data
    const parsedData = gdpData.map(d => ({
      year: new Date(d.Year, 0, 1), // Convert year to Date
      country: d.Country,
      gdpPerCapita: +d["GDP per capita"] || 0,
    }));

    // Group by year and country
    const dataByYearAndCountry = d3.index(
      parsedData,
      d => d.year,
      d => d.country
    );

    // Use selected countries or default to top 10
    const countries = selectedCountries.length > 0 ? selectedCountries : Array.from(new Set(parsedData.map(d => d.country))).slice(0, 10);
    const years = Array.from(new Set(parsedData.map(d => d.year))).sort(d3.ascending);

    // Create series
    const stack = d3.stack()
      .keys(countries)
      .offset(d3.stackOffsetWiggle)
      .order(d3.stackOrderInsideOut)
      .value(([, countryData], key) => countryData.get(key)?.gdpPerCapita || 0);

    const series = stack(dataByYearAndCountry);

    // Create scales
    const x = d3.scaleUtc()
      .domain(d3.extent(years))
      .range([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
      .domain([d3.min(series.flat(2)), d3.max(series.flat(2))])
      .rangeRound([height - marginBottom, marginTop]);

    const color = d3.scaleOrdinal()
      .domain(countries)
      .range(d3.schemeTableau10);

    const area = d3.area()
      .x(d => x(d.data[0]))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]));

    // Create SVG
    const svg = d3.select(svgRef.current)
      .html("") // clear previous
      .append("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .style("max-width", "100%")
      .style("height", "auto")
      .style("background", "#1a1a1a");

    // Y Axis
    svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(height / 80))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
        .attr("x2", width - marginLeft - marginRight)
        .attr("stroke-opacity", 0.1))
      .call(g => g.append("text")
        .attr("x", -marginLeft)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("↑ GDP per Capita"));

    // X Axis
    svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
      .call(g => g.select(".domain").remove());

    // Draw Areas
    svg.append("g")
      .selectAll("path")
      .data(series)
      .join("path")
      .attr("fill", d => color(d.key))
      .attr("d", area)
      .append("title")
      .text(d => d.key);

    // Create the Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - marginRight + 20}, 50)`);

    legend.selectAll("rect")
      .data(countries)
      .enter().append("rect")
      .attr("x", 0)
      .attr("y", (d, i) => i * 20)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", d => color(d));

    legend.selectAll("text")
      .data(countries)
      .enter().append("text")
      .attr("x", 20)
      .attr("y", (d, i) => i * 20 + 12)
      .attr("fill", "white")
      .style("font-size", "12px")
      .text(d => d);

  }, [gdpData, selectedCountries]);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading data.</div>;

  const countryOptions = Array.from(new Set(gdpData.map(d => d.Country)))
    .map(c => ({ value: c, label: c }));

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: "white", textAlign: "center" }}>GDP Per Capita StreamGraph</h2>
      
      {/* Filter for Countries */}
      <div style={{ width: 400, margin: "20px auto", color: "white" }}>
        <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>
          Select Countries:
        </label>
        <Select
          isMulti
          options={[{ value: 'All', label: 'All Countries' }, ...countryOptions]}
          onChange={selected => {
            if (selected.some(option => option.value === 'All')) {
              setSelectedCountries([]); // Show all countries when 'All' is selected
            } else {
              setSelectedCountries(selected.map(d => d.value)); // Set selected countries
            }
          }}
          placeholder="Select countries..."
          styles={{
            control: (provided) => ({
              ...provided,
              backgroundColor: "#2c2c2c",
              borderColor: "#555",
              color: "white",
            }),
            menu: (provided) => ({
              ...provided,
              backgroundColor: "#2c2c2c",
            }),
            option: (provided, state) => ({
              ...provided,
              backgroundColor: state.isFocused ? "#444" : "#2c2c2c",
              color: "white",
              cursor: "pointer",
            }),
            singleValue: (provided) => ({
              ...provided,
              color: "white",
            }),
            multiValue: (provided) => ({
              ...provided,
              backgroundColor: "#444",
            }),
            multiValueLabel: (provided) => ({
              ...provided,
              color: "white",
            }),
          }}
        />
      </div>

      <div ref={svgRef}></div>
    </div>
  );
};

export default GDPStreamGraph;
