import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import * as d3 from "d3";
import Select from "react-select";
import { useGetAllEducationExpenditureQuery } from "../store/api";

const EducationExpenditureChart = () => {
  const {
    data: eduDataRaw,
    isLoading,
    isError,
  } = useGetAllEducationExpenditureQuery();
  const svgRef = useRef(null);

  const [selectedCountries, setSelectedCountries] = useState([]);
  const [compareAll, setCompareAll] = useState(false);

  const { processedData, availableCountries } = useMemo(() => {
    if (!eduDataRaw) return { processedData: [], availableCountries: [] };

    const parsed = eduDataRaw.map((d) => ({
      country: d.Country,
      year: +d.Year,
      value: d["Education Exp (%GDP)"] ? +d["Education Exp (%GDP)"] : null,
    }));

    const filled = [];
    const grouped = d3.group(parsed, (d) => d.country);

    grouped.forEach((values) => {
      values.sort((a, b) => a.year - b.year);
      for (let i = 0; i < values.length; i++) {
        if (values[i].value === null) {
          const prev = values[i - 1]?.value;
          const next = values[i + 1]?.value;
          values[i].value = prev && next ? (prev + next) / 2 : prev ?? next ?? 0;
        }
      }
      filled.push(...values);
    });

    const uniqueCountries = Array.from(new Set(filled.map((d) => d.country)));
    return {
      processedData: filled,
      availableCountries: uniqueCountries.map((c) => ({ value: c, label: c })),
    };
  }, [eduDataRaw]);

  useEffect(() => {
    if (availableCountries.length) {
      setSelectedCountries(availableCountries.slice(0, 3));
    }
  }, [availableCountries]);

  const drawChart = useCallback(() => {
    if (!svgRef.current || processedData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 950;
    const height = 550;
    const margin = { top: 40, right: 30, bottom: 70, left: 70 };

    const selectedSet = new Set(
      (compareAll ? availableCountries : selectedCountries).map((d) => d.value)
    );
    const filtered = processedData.filter((d) => selectedSet.has(d.country));

    const x = d3.scaleLinear()
      .domain(d3.extent(filtered, (d) => d.year) || [0, 1])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(filtered, (d) => d.value) || 1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("background", "transparent")
      .style("overflow", "visible");

    // X-axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")))
      .call((g) => g.selectAll("text").style("fill", "#ccc"))
      .append("text")
      .attr("x", (width - margin.left - margin.right) / 2 + margin.left)
      .attr("y", 50)
      .attr("fill", "#ccc")
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .text("Year");

    // Y-axis
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .call((g) =>
        g.selectAll(".tick line")
          .clone()
          .attr("x2", width - margin.left - margin.right)
          .attr("stroke-opacity", 0.1)
      )
      .call((g) => g.selectAll("text").style("fill", "#ccc"))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height - margin.top - margin.bottom) / 2 - margin.top)
      .attr("y", -45)
      .attr("fill", "#ccc")
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .text("Education Expenditure (% GDP)");

    const color = d3.scaleOrdinal(d3.schemeSet2);
    const points = filtered.map((d) => [d.year, d.value, d.country]);
    const groups = d3.rollup(points, (v) => v, (d) => d[2]);

    const line = d3.line()
      .x((d) => x(d[0]))
      .y((d) => y(d[1]));

    const path = svg.append("g")
      .attr("fill", "none")
      .attr("stroke-width", 2.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .selectAll("path")
      .data(groups.values())
      .join("path")
      .attr("stroke", (d) => color(d[0][2]))
      .style("mix-blend-mode", "screen")
      .attr("d", line);

    const dot = svg.append("g").attr("display", "none");
    dot.append("circle").attr("r", 5).attr("fill", "#fff");
    dot.append("text")
      .attr("text-anchor", "middle")
      .attr("y", -15)
      .attr("fill", "#fff")
      .attr("font-size", 12);

    svg.on("pointerenter", () => {
      path.style("mix-blend-mode", null).style("stroke", "#444");
      dot.attr("display", null);
    })
      .on("pointermove", (event) => {
        const [xm, ym] = d3.pointer(event);
        const i = d3.leastIndex(points, ([xVal, yVal]) =>
          Math.hypot(x(xVal) - xm, y(yVal) - ym)
        );
        if (i === undefined) return;
        const [xVal, yVal, country] = points[i];

        path.style("stroke", (d) => (d[0][2] === country ? null : "#444"))
          .filter((d) => d[0][2] === country)
          .raise();

        dot.attr("transform", `translate(${x(xVal)},${y(yVal)})`);
        dot.select("text").text(`${country}: ${yVal.toFixed(2)}%`);
      })
      .on("pointerleave", () => {
        path.style("mix-blend-mode", "screen").style("stroke", null);
        dot.attr("display", "none");
      });

  }, [processedData, selectedCountries, compareAll, availableCountries]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const customStyles = {
    control: (styles) => ({
      ...styles,
      backgroundColor: "#1f2937", // bg-neutral-900
      borderColor: "#374151", // border-neutral-800
      color: "#fff",
      minHeight: "44px",
    }),
    menu: (styles) => ({ ...styles, backgroundColor: "#1f2937" }),
    option: (styles, { isFocused, isSelected }) => ({
      ...styles,
      backgroundColor: isSelected
        ? "#2563eb"
        : isFocused
        ? "#374151"
        : "#1f2937",
      color: "#fff",
    }),
    input: (styles) => ({ ...styles, color: "#fff" }),
    multiValue: (styles) => ({ ...styles, backgroundColor: "#374151" }),
    multiValueLabel: (styles) => ({ ...styles, color: "#fff" }),
    multiValueRemove: (styles) => ({
      ...styles,
      color: "#f87171",
      ":hover": { backgroundColor: "#ef4444", color: "white" },
    }),
    singleValue: (styles) => ({ ...styles, color: "#fff" }),
  };

  if (isLoading) {
    return (
      <p className="text-center text-gray-300 text-lg">Loading chart...</p>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-red-400 text-lg">Failed to load data.</p>
    );
  }

  return (
    <div className="max-w-5xl bg-neutral-900 rounded-2xl shadow-lg p-6">
      <h2 className="text-3xl font-bold text-white mb-8">
        Education Expenditure (% of GDP) Trends
      </h2>

      <div className="flex flex-col items-center justify-between mb-6 gap-4">
        <div className="w-full max-w-5xl">
          <Select
            isMulti
            isDisabled={compareAll}
            options={availableCountries}
            value={selectedCountries}
            onChange={setSelectedCountries}
            styles={customStyles}
            placeholder="Select countries..."
            className="bg-neutral-900"
          />
        </div>

        <label className="flex items-center gap-2 text-white">
          <input
            type="checkbox"
            className="form-checkbox text-blue-600"
            checked={compareAll}
            onChange={(e) => setCompareAll(e.target.checked)}
          />
          <span>Compare all countries</span>
        </label>
      </div>

      <div className="overflow-x-auto">
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default EducationExpenditureChart;
