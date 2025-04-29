import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Select from "react-select";
import { useGetAllPopulationQuery, useGetAllStabilityQuery, useGetMedalsQuery } from "../store/api";

const PCAPlotOlympics = () => {
  const { data: populationData } = useGetAllPopulationQuery();
  const { data: stabilityData } = useGetAllStabilityQuery();
  const { data: medalsData } = useGetMedalsQuery();
  const svgRef = useRef();
  const [mergedData, setMergedData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2000);
  const [selectedCountries, setSelectedCountries] = useState([]);

  const handleYearChange = (e) => setSelectedYear(+e.target.value);
  const handleCountryChange = (opts) =>
    setSelectedCountries(opts ? opts.map((o) => o.value) : []);

  useEffect(() => {
    if (!populationData || !stabilityData || !medalsData) return;

    const parse = (v) => (isNaN(+v) ? NaN : +v);
    const popMap = d3.group(populationData, (d) => d.Country + ":" + d.Year);
    const stabMap = d3.group(stabilityData, (d) => d.Country + ":" + d.Year);
    const medalMap = d3.rollup(
      medalsData,
      (v) => d3.sum(v, (d) => d.Gold + d.Silver + d.Bronze),
      (d) => d.Country + ":" + d.Year
    );

    const avgPSI = d3.rollup(
      stabilityData.filter((d) => !isNaN(parse(d["Political Stability Index"]))),
      (v) => d3.mean(v, (d) => parse(d["Political Stability Index"])),
      (d) => d.Country
    );

    const avgPop = d3.rollup(
      populationData.filter((d) => !isNaN(parse(d.Population))),
      (v) => d3.mean(v, (d) => parse(d.Population)),
      (d) => d.Country
    );

    const final = [];
    new Set(populationData.map((d) => d.Country)).forEach((country) => {
      const key = country + ":" + selectedYear;
      const popEntry = popMap.get(key)?.[0];
      const stabEntry = stabMap.get(key)?.[0];
      const population = popEntry ? parse(popEntry.Population) : avgPop.get(country) || 0;
      const psi = stabEntry
        ? parse(stabEntry["Political Stability Index"])
        : avgPSI.get(country) || 0;
      const medals = medalMap.get(key) || 0;
      if (!isNaN(population) && !isNaN(psi)) {
        final.push({ country, population, psi, medals });
      }
    });
    console.log(final);

    // Call the PCA API to get PCA results
    fetch("http://localhost:8000/api/dimensionality-reduction/pca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(final),
    })
      .then((res) => res.json())
      .then((pcaResult) => {
        const filtered = selectedCountries.length > 0
          ? pcaResult.filter((d) => selectedCountries.includes(d.country))
          : pcaResult;
        setMergedData(filtered);
      })
      .catch(console.error);
  }, [populationData, stabilityData, medalsData, selectedYear, selectedCountries]);

  useEffect(() => {
    if (!mergedData.length) return;

    const width = 800;
    const height = 600;
    const margin = { top: 60, right: 40, bottom: 80, left: 80 };

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("background", "black");
    svg.selectAll("*").remove();

    const container = svg.append("g");

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scaleLinear()
      .domain(d3.extent(mergedData, (d) => d.pca1)).nice()
      .range([0, innerWidth]);
    const y = d3.scaleLinear()
      .domain(d3.extent(mergedData, (d) => d.pca2)).nice()
      .range([innerHeight, 0]);
    const size = d3.scaleSqrt()
      .domain([0, d3.max(mergedData, (d) => d.medals)])
      .range([4, 20]);
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const chart = container.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add X and Y axis labels
    chart.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 50)
      .attr("fill", "white")
      .style("font-size", "14px")
      .style("text-anchor", "middle")
      .text("PCA1");

    chart.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -50)
      .attr("fill", "white")
      .style("font-size", "14px")
      .style("text-anchor", "middle")
      .text("PCA2");

    // Axes
    chart.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll("text").attr("fill", "white");

    chart.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text").attr("fill", "white");

    // Points
    chart.selectAll("circle")
      .data(mergedData, (d) => d.country)
      .join(
        (enter) => enter.append("circle")
          .attr("cx", (d) => x(d.pca1))
          .attr("cy", (d) => y(d.pca2))
          .attr("r", 0)
          .attr("fill", (d) => color(d.cluster))
          .attr("opacity", 0.7)
          .transition()
          .duration(800)
          .attr("r", (d) => size(d.medals)),
        (update) => update
          .transition()
          .duration(800)
          .attr("cx", (d) => x(d.pca1))
          .attr("cy", (d) => y(d.pca2))
          .attr("r", (d) => size(d.medals))
          .attr("fill", (d) => color(d.cluster))
      )
      .append("title")
      .text((d) =>
        `${d.country}\nPCA1: ${d.pca1}\nPCA2: ${d.pca2}\nMedals: ${d.medals}\nCluster: ${d.cluster}`
      );

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 10])
      .translateExtent([[0, 0], [width, height]])
      .on("zoom", (event) => {
        chart.attr("transform", `translate(${margin.left},${margin.top})` + event.transform);
      });

    svg.call(zoom);
  }, [mergedData]);

  const countryOptions = populationData
    ? Array.from(new Set(populationData.map((d) => d.Country))).map((c) => ({ label: c, value: c }))
    : [];

  return (
    <div style={{ backgroundColor: "black", padding: "1rem" }}>
      <h2 style={{ color: "white", textAlign: "center", marginBottom: "1rem" }}>
        PCA Plot of Countries (Olympics)
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
          control: (base) => ({
            ...base,
            backgroundColor: '#333',
            borderColor: '#555',
            color: 'white',
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: '#333',
            color: 'white',
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? '#555' : '#333',
            color: 'white',
          }),
          singleValue: (base) => ({
            ...base,
            color: 'white',
          }),
          multiValue: (base) => ({
            ...base,
            backgroundColor: '#555',
          }),
          multiValueLabel: (base) => ({
            ...base,
            color: 'white',
          }),
          multiValueRemove: (base) => ({
            ...base,
            color: 'white',
            ':hover': {
              backgroundColor: '#444',
              color: 'red',
            },
          }),
          input: (base) => ({
            ...base,
            color: 'white',
          }),
          placeholder: (base) => ({
            ...base,
            color: '#aaa',
          }),
        }}
        className="mb-4"
      />
      <svg ref={svgRef} width={800} height={600} />
    </div>
  );
};

export default PCAPlotOlympics;
