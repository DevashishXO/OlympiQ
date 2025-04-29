import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Select from "react-select";
import {
  useGetAllHealthExpenditureQuery,
  useGetAllEducationExpenditureQuery,
  useGetMedalsQuery,
} from "../store/api";

const BubbleChart = () => {
  const { data: healthData } = useGetAllHealthExpenditureQuery();
  const { data: eduData } = useGetAllEducationExpenditureQuery();
  const { data: medalsData } = useGetMedalsQuery();
  const svgRef = useRef();
  const [joinedData, setJoinedData] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [yearRange, setYearRange] = useState({ from: null, to: null });

  const parseFloatSafe = (val) => (val ? parseFloat(val) : null);

  const joinData = () => {
    if (!healthData || !eduData || !medalsData) return;

    const health = healthData.map((d) => ({
      country: d.Country,
      year: +d.Year,
      health: parseFloatSafe(d["Health Exp (%GDP)"]),
    }));

    const education = eduData.map((d) => ({
      country: d.Country,
      year: +d.Year,
      education: parseFloatSafe(d["Education Exp (%GDP)"]),
    }));

    const medals = medalsData.map((d) => ({
      country: d.Country,
      year: +d.Year,
      medals: (d.Gold ?? 0) + (d.Silver ?? 0) + (d.Bronze ?? 0),
    }));

    const combined = d3
      .rollups(
        [...health, ...education, ...medals],
        (v) => ({
          country: v[0].country,
          year: v[0].year,
          health: d3.mean(v.map((d) => d.health)),
          education: d3.mean(v.map((d) => d.education)),
          medals: d3.sum(v.map((d) => d.medals)),
        }),
        (d) => `${d.country}-${d.year}`
      )
      .map(([_, val]) => val);

    const grouped = d3.group(combined, (d) => d.country);
    const filled = fillMissingValues(grouped);
    setJoinedData(filled);
  };

  const fillMissingValues = (grouped) => {
    const filled = [];
    grouped.forEach((values) => {
      const sorted = values.sort((a, b) => a.year - b.year);
      sorted.forEach((item, idx) => {
        if (!item.health) item.health = getInterpolatedValue(sorted, idx, "health");
        if (!item.education) item.education = getInterpolatedValue(sorted, idx, "education");
      });
      filled.push(...sorted);
    });
    return filled;
  };

  const getInterpolatedValue = (sorted, idx, key) => {
    const prev = sorted[idx - 1]?.[key];
    const next = sorted[idx + 1]?.[key];
    return prev && next ? (prev + next) / 2 : prev ?? next ?? 0;
  };

  useEffect(() => {
    joinData();
  }, [healthData, eduData, medalsData]);

  const filterData = () => {
    return joinedData.filter((d) => {
      const yearOk =
        (!yearRange.from || d.year >= yearRange.from) &&
        (!yearRange.to || d.year <= yearRange.to);
      const countryOk = !selectedCountries.length || selectedCountries.includes(d.country);
      return yearOk && countryOk;
    });
  };

  useEffect(() => {
    if (!joinedData.length) return;
    const data = filterData();
    renderChart(data);
  }, [joinedData, selectedCountries, yearRange]);

  const renderChart = (data) => {
    const margin = { top: 50, right: 150, bottom: 70, left: 60 },
      width = 900 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .html("")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .style("background", "#1e1e1e")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain(d3.extent(data, (d) => d.education)).range([0, width]);
    const y = d3.scaleLinear().domain(d3.extent(data, (d) => d.health)).range([height, 0]);
    const z = d3.scaleSqrt().domain([0, d3.max(data, (d) => d.medals)]).range([2, 30]);

    appendAxes(svg, x, y, width, height);
    appendLabels(svg, x, y, width, height);
    appendBubbles(svg, data, x, y, z);
  };

  const appendAxes = (svg, x, y, width, height) => {
    svg.append("g")
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
      .selectAll("line")
      .attr("stroke", "#444")
      .attr("stroke-dasharray", "2,2");

    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(6))
      .selectAll("text")
      .style("fill", "#ccc");

    svg.append("g")
      .call(d3.axisLeft(y).ticks(6))
      .selectAll("text")
      .style("fill", "#ccc");
  };

  const appendLabels = (svg, x, y, width, height) => {
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .style("fill", "#ccc")
      .style("font-size", "14px")
      .text("Education Expenditure (% of GDP)");

    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -40)
      .style("fill", "#ccc")
      .style("font-size", "14px")
      .text("Health Expenditure (% of GDP)");
  };

  const appendBubbles = (svg, data, x, y, z) => {
    const colorScale = d3
      .scaleOrdinal()
      .domain(Array.from(new Set(data.map((d) => d.country))))
      .range(d3.schemeSet2);

    const tooltip = d3.select(svgRef.current)
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background-color", "black")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style("color", "white")
      .style("pointer-events", "none");

    const showTooltip = (event, d) => {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip
        .html(`<strong>${d.country}</strong><br/>Year: ${d.year}<br/>Health: ${d.health?.toFixed(1)}%<br/>Edu: ${d.education?.toFixed(1)}%<br/>Medals: ${d.medals}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 40) + "px");
    };

    const hideTooltip = () => {
      tooltip.transition().duration(200).style("opacity", 0);
    };

    svg.append("g")
      .selectAll("circle")
      .data(data, (d) => d.country + d.year)
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("cx", (d) => x(d.education))
            .attr("cy", (d) => y(d.health))
            .attr("r", 0)
            .style("fill", (d) => colorScale(d.country))
            .style("opacity", 0.85)
            .attr("stroke", "#fff")
            .on("mouseover", showTooltip)
            .on("mousemove", showTooltip)
            .on("mouseleave", hideTooltip)
            .transition()
            .duration(1200)
            .ease(d3.easeBounceOut)
            .attr("r", (d) => z(d.medals)),

        (update) =>
          update
            .transition()
            .duration(1000)
            .ease(d3.easeCubicInOut)
            .attr("cx", (d) => x(d.education))
            .attr("cy", (d) => y(d.health))
            .attr("r", (d) => z(d.medals))
            .style("fill", (d) => colorScale(d.country)),

        (exit) =>
          exit
            .transition()
            .duration(600)
            .attr("r", 0)
            .style("opacity", 0)
            .remove()
      );
  };

  const countryOptions = Array.from(new Set(joinedData.map((d) => d.country)))
    .sort()
    .map((c) => ({ value: c, label: c }));

  const yearOptions = Array.from(new Set(joinedData.map((d) => d.year)))
    .sort((a, b) => a - b)
    .map((year) => ({ value: year, label: year }));

  const customSelectStyles = {
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
  };

  return (
    <div className="max-w-5xl flex flex-col justify-center items-center">
      <div className="mx-auto my-4 text-white w-full">
        <label className="font-bold mb-2 block">Filter Countries:</label>
        <Select
          isMulti
          options={countryOptions}
          onChange={(selected) => setSelectedCountries(selected.map((d) => d.value))}
          placeholder="Select countries..."
          styles={customSelectStyles}
        />
      </div>

      <div className="mx-auto my-4 flex gap-3 w-full">
        <div className="flex-1">
          <label className="text-white font-bold mb-2 block">From Year:</label>
          <Select
            options={yearOptions}
            onChange={(selected) =>
              setYearRange((prev) => ({ ...prev, from: selected?.value }))
            }
            placeholder="Select From Year..."
            styles={customSelectStyles}
          />
        </div>
        <div className="flex-1">
          <label className="text-white font-bold mb-2 block">To Year:</label>
          <Select
            options={yearOptions}
            onChange={(selected) =>
              setYearRange((prev) => ({ ...prev, to: selected?.value }))
            }
            placeholder="Select To Year..."
            styles={customSelectStyles}
          />
        </div>
      </div>
      <div ref={svgRef}></div>

    </div>
  );
};

export default BubbleChart;
