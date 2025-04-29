import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  useGetAllEducationExpenditureQuery
} from "../store/api";

const StackedNormalizedAreaChart = () => {
  const { data: eduData, isLoading: eduLoading, isError: eduError } = useGetAllEducationExpenditureQuery();
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [selectedCountries, setSelectedCountries] = useState([]);

  const width = 960;
  const height = 500;
  const marginTop = 20;
  const marginRight = 220;
  const marginBottom = 50;
  const marginLeft = 60;

  useEffect(() => {
    if (!eduData || selectedCountries.length === 0) return;

    const mergedData = eduData.map(d => ({
      country: d.Country,
      year: +d.Year,
      educationExp: +d["Education Exp (%GDP)"]
    }));

    const filteredData = mergedData.filter(d => selectedCountries.includes(d.country));
    const years = Array.from(new Set(filteredData.map(d => d.year))).sort((a, b) => a - b);

    const seriesData = years.map(year => {
      const entry = { year };
      selectedCountries.forEach(country => {
        const record = filteredData.find(d => d.year === year && d.country === country);
        entry[country] = record ? record.educationExp : 0;
      });
      return entry;
    });

    const stack = d3.stack()
      .keys(selectedCountries)
      .offset(d3.stackOffsetExpand);

    const series = stack(seriesData);

    const x = d3.scaleLinear()
      .domain(d3.extent(years))
      .range([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([height - marginBottom, marginTop]);

    const color = d3.scaleOrdinal()
      .domain(selectedCountries)
      .range(d3.schemeTableau10);

    const area = d3.area()
      .x(d => x(d.data.year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveCatmullRom);

    const svg = d3.select(svgRef.current)
      .html("") // Clear previous
      .append("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .style("max-width", "100%")
      .style("height", "auto");

    const tooltip = d3.select(tooltipRef.current)
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "#333")
      .style("color", "#fff")
      .style("padding", "6px 12px")
      .style("border-radius", "6px")
      .style("font-size", "14px")
      .style("pointer-events", "none");

    // Draw X Axis
svg.append("g")
.attr("transform", `translate(0,${height - marginBottom})`)
.call(d3.axisBottom(x).ticks(width / 80).tickFormat(d3.format("d")))
.call(g => g.selectAll("text").attr("fill", "white"))
.call(g => g.select(".domain").remove());

// X Axis Label
svg.append("text")
  .attr("x", width / 2)
  .attr("y", height - 5)
  .attr("text-anchor", "middle")
  .style("font-size", "16px")
  .attr("fill", "white")  // <- ADD THIS
  .text("Year");

// Draw Y Axis
svg.append("g")
  .attr("transform", `translate(${marginLeft},0)`)
  .call(d3.axisLeft(y).ticks(10, "%"))
  .call(g => g.selectAll("text").attr("fill", "white"))
  .call(g => g.select(".domain").remove());

  
  // Y Axis Label
svg.append("text")
.attr("transform", "rotate(-90)")
.attr("x", -(height / 2))
.attr("y", 20)
.attr("text-anchor", "middle")
.style("font-size", "16px")
.attr("fill", "white")  // <- ADD THIS
.text("Education Expenditure (% of GDP, Normalized)");

    // Draw areas
    svg.append("g")
      .selectAll("path")
      .data(series)
      .join("path")
      .attr("fill", d => color(d.key))
      .attr("d", area)
      .on("mousemove", (event, d) => {
        const [xm] = d3.pointer(event);
        const year = Math.round(x.invert(xm));

        const entry = d.find(segment => segment.data.year === year);
        if (entry) {
          const contribution = ((entry[1] - entry[0]) * 100).toFixed(2);
          tooltip
            .style("visibility", "visible")
            .html(`<b>${d.key}</b><br>Year: ${year}<br>Contribution: ${contribution}%`)
            .style("top", (event.pageY - 50) + "px")
            .style("left", (event.pageX + 15) + "px");
        }
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      })
      .transition()
      .duration(1500)
      .attrTween("d", function(d) {
        const i = d3.interpolate(d.map(pt => [pt[0], pt[0]]), d);
        return function(t) {
          return area(i(t));
        };
      });

      // Legend
const legend = svg.append("g")
.attr("transform", `translate(${width - marginRight + 30}, ${marginTop})`);

selectedCountries.forEach((country, i) => {
const g = legend.append("g")
  .attr("transform", `translate(0, ${i * 25})`);

g.append("rect")
  .attr("width", 20)
  .attr("height", 20)
  .attr("fill", color(country));

g.append("text")
  .attr("x", 26)
  .attr("y", 15)
  .style("font-size", "14px")
  .attr("fill", "white") 
  .text(country);
});


  }, [eduData, selectedCountries]);

  if (eduLoading) return <div>Loading...</div>;
  if (eduError) return <div>Error loading data.</div>;

  const allCountries = Array.from(new Set(eduData.map(d => d.Country))).sort();

  const handleCountryChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedCountries(selected);
  };

  const selectAllCountries = () => {
    setSelectedCountries(allCountries);
  };

  return (
    <div style={{ padding: 20, position: "relative" }}>
      <h2 style={{ color: "white" }}>Stacked Normalized Area Chart: Education Expenditure</h2>

      {/* Country selection */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ color: "white", fontSize: "16px", marginRight: "10px" }}>
          Select Countries:
        </label>
        <select multiple onChange={handleCountryChange} style={{ padding: 8, width: 300, height: 100 }}>
          {allCountries.map(country => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
        <button
          onClick={selectAllCountries}
          style={{ marginLeft: 20, padding: "8px 16px", background: "#4CAF50", color: "white", border: "none", borderRadius: 6 }}
        >
          Select All Countries
        </button>
        <p style={{ color: "white", fontSize: "14px" }}>
          (Hold Ctrl/Command to select multiple countries)
        </p>
      </div>

      <div ref={svgRef}></div>
      <div ref={tooltipRef}></div> {/* Tooltip */}
    </div>
  );
};

export default StackedNormalizedAreaChart;


