import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import Select from "react-select";
import { useGetAllHealthExpenditureQuery } from "../store/api";

const HealthExpenditureChart = () => {
  const { data: healthDataRaw, isLoading, isError } = useGetAllHealthExpenditureQuery();
  const svgRef = useRef();

  const [processedData, setProcessedData] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [compareAll, setCompareAll] = useState(false);

  useEffect(() => {
    if (!healthDataRaw) return;

    const parsed = healthDataRaw.map(d => ({
      country: d.Country,
      year: +d.Year,
      value: d["Health Exp (%GDP)"] ? +d["Health Exp (%GDP)"] : null
    }));

    const filled = [];
    const grouped = d3.group(parsed, d => d.country);

    grouped.forEach((values, country) => {
      values.sort((a, b) => a.year - b.year);
      for (let i = 0; i < values.length; i++) {
        if (values[i].value === null) {
          const prev = values[i - 1]?.value;
          const next = values[i + 1]?.value;
          values[i].value = (prev && next) ? (prev + next) / 2 : prev ?? next ?? 0;
        }
      }
      filled.push(...values);
    });

    setProcessedData(filled);
    const uniqueCountries = Array.from(new Set(filled.map(d => d.country)));
    setAvailableCountries(uniqueCountries.map(c => ({ value: c, label: c })));
    setSelectedCountries(uniqueCountries.slice(0, 3).map(c => ({ value: c, label: c })));
  }, [healthDataRaw]);

  useEffect(() => {
    if (!processedData.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 928;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 30, left: 30 };

    const selected = new Set((compareAll ? availableCountries : selectedCountries).map(c => c.value));
    const filtered = processedData.filter(d => selected.has(d.country));
    const points = filtered.map(d => [d.year, d.value, d.country]);

    const x = d3.scaleLinear()
      .domain(d3.extent(filtered, d => d.year))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(filtered, d => d.value)]).nice()
      .range([height - margin.bottom, margin.top]);

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; overflow: visible; background-color: transparent");

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")).tickSizeOuter(0))
      .selectAll("text")
      .style("fill", "#ccc");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .call(g => g.selectAll(".tick line")
        .clone()
        .attr("x2", width - margin.left - margin.right)
        .attr("stroke-opacity", 0.1))
      .call(g => g.selectAll("text").style("fill", "#ccc"))
      .call(g => g.append("text")
        .attr("x", -margin.left)
        .attr("y", 10)
        .attr("fill", "#ccc")
        .attr("text-anchor", "start")
        .text("↑ Health Exp (% GDP)"));

    const color = d3.scaleOrdinal(d3.schemeSet2);

    const groups = d3.rollup(points, v => v, d => d[2]);

    const line = d3.line()
      .x(d => x(d[0]))
      .y(d => y(d[1]));

    const path = svg.append("g")
      .attr("fill", "none")
      .attr("stroke-width", 2)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .selectAll("path")
      .data(groups.values())
      .join("path")
      .attr("stroke", d => color(d[0][2]))
      .style("mix-blend-mode", "screen")
      .attr("d", line);

    const dot = svg.append("g")
      .attr("display", "none");

    dot.append("circle").attr("r", 4).attr("fill", "#fff");
    dot.append("text").attr("text-anchor", "middle").attr("y", -10).attr("fill", "#fff");

    svg
      .on("pointerenter", () => {
        path.style("mix-blend-mode", null).style("stroke", "#444");
        dot.attr("display", null);
      })
      .on("pointermove", event => {
        const [xm, ym] = d3.pointer(event);
        const i = d3.leastIndex(points, ([xVal, yVal]) => Math.hypot(x(xVal) - xm, y(yVal) - ym));
        const [xVal, yVal, country] = points[i];
        path.style("stroke", d => d[0][2] === country ? null : "#444")
            .filter(d => d[0][2] === country)
            .raise();
        dot.attr("transform", `translate(${x(xVal)},${y(yVal)})`);
        dot.select("text").text(`${country} (${yVal.toFixed(2)}%)`);
      })
      .on("pointerleave", () => {
        path.style("mix-blend-mode", "screen").style("stroke", null);
        dot.attr("display", "none");
      });

    // Add Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 20}, 50)`);

    legend.selectAll("rect")
      .data(groups.keys())
      .enter().append("rect")
      .attr("x", 0)
      .attr("y", (d, i) => i * 20)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", d => color(d));

    legend.selectAll("text")
      .data(groups.keys())
      .enter().append("text")
      .attr("x", 20)
      .attr("y", (d, i) => i * 20 + 12)
      .attr("fill", "white")
      .style("font-size", "12px")
      .text(d => d);
  }, [processedData, selectedCountries, compareAll]);

  const customStyles = {
    control: (styles) => ({ ...styles, backgroundColor: "#222", color: "#fff" }),
    menu: (styles) => ({ ...styles, backgroundColor: "#222" }),
    option: (styles, { isFocused, isSelected }) => ({
      ...styles,
      backgroundColor: isSelected ? "#555" : isFocused ? "#333" : "#222",
      color: "#fff",
    }),
    input: (styles) => ({ ...styles, color: "#fff" }),
    singleValue: (styles) => ({ ...styles, color: "#fff" }),
    multiValue: (styles) => ({ ...styles, backgroundColor: "#444" }),
    multiValueLabel: (styles) => ({ ...styles, color: "#fff" }),
    multiValueRemove: (styles) => ({ ...styles, color: "#fff", ":hover": { backgroundColor: "#666", color: "white" } }),
  };

  if (isLoading) return <p className="text-white">Loading...</p>;
  if (isError) return <p className="text-red-400">Error loading data</p>;

  return (
    <div>
      <h2 className="text-xl text-white font-bold mb-4">Health Expenditure (% GDP) Over Time</h2>
      <div className="mb-4">
        <Select
          isMulti
          isDisabled={compareAll}
          options={availableCountries}
          value={selectedCountries}
          onChange={setSelectedCountries}
          styles={customStyles}
        />
        <label className="mt-2 inline-flex items-center text-white">
          <input
            type="checkbox"
            className="form-checkbox"
            checked={compareAll}
            onChange={e => setCompareAll(e.target.checked)}
          />
          <span className="ml-2">Compare all countries</span>
        </label>
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default HealthExpenditureChart;
