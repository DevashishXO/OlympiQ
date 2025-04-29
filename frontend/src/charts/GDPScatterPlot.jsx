import React, { useEffect, useRef, useState } from "react";
import { useGetAllGDPQuery, useGetAllGDPPerCapitaQuery } from "../store/api";
import * as d3 from "d3";

const GDPScatterPlot = () => {
  const [selectedYear, setSelectedYear] = useState(2020);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);  // Tooltip reference

  const {
    data: gdpData,
    error: gdpError,
    isLoading: isLoadingGDP,
  } = useGetAllGDPQuery();

  const {
    data: gdpPerCapitaData,
    error: gdpPerCapitaError,
    isLoading: isLoadingGDPPerCapita,
  } = useGetAllGDPPerCapitaQuery();

  const [mergedData, setMergedData] = useState([]);

  useEffect(() => {
    if (gdpData && gdpPerCapitaData) {
      const gdpDataByYear = gdpData.filter((item) => item.Year === selectedYear);
      const gdpPerCapitaDataByYear = gdpPerCapitaData.filter(
        (item) => item.Year === selectedYear
      );

      const merged = gdpDataByYear
        .map((gdp) => {
          const gdpPerCapita = gdpPerCapitaDataByYear.find(
            (item) => item.Country === gdp.Country
          );
          if (
            gdpPerCapita &&
            gdp["GDP (total)"] != null &&
            gdpPerCapita["GDP per capita"] != null
          ) {
            const gdp_total = gdp["GDP (total)"];
            const gdp_per_capita = gdpPerCapita["GDP per capita"];
            const color = gdp_total > 1e13 || gdp_per_capita > 50000 ? "#ff0000" : `hsl(${Math.random() * 360}, 100%, 50%)`; // Outlier color red

            return {
              country: gdp.Country,
              gdp_total,
              gdp_per_capita,
              color,
            };
          }
          return null;
        })
        .filter((item) => item !== null)
        .filter((item) => item.gdp_total > 0 && item.gdp_per_capita > 0);

      setMergedData(merged);
    }
  }, [gdpData, gdpPerCapitaData, selectedYear]);

  useEffect(() => {
    if (mergedData.length > 0) {
      const svg = d3.select(svgRef.current);
      const width = svg.node().getBoundingClientRect().width;
      const height = svg.node().getBoundingClientRect().height;

      svg.selectAll("*").remove(); // Clear previous render

      // Set up scales
      const xScale = d3.scaleLog()
        .domain([d3.min(mergedData, d => d.gdp_total) || 1e12, d3.max(mergedData, d => d.gdp_total)])
        .range([50, width - 50]);

      const yScale = d3.scaleLog()
        .domain([d3.min(mergedData, d => d.gdp_per_capita) || 1000, d3.max(mergedData, d => d.gdp_per_capita)])
        .range([height - 50, 50]);

      // Set up axes with custom ticks
      const xAxis = d3.axisBottom(xScale)
        .ticks(6)
        .tickFormat(d => `$${(d / 1e12).toFixed(1)}T`);

      const yAxis = d3.axisLeft(yScale)
        .ticks(6)
        .tickFormat(d => `$${(d / 1000).toFixed(1)}K`);

      svg.append("g")
        .attr("transform", `translate(0, ${height - 50})`)
        .call(xAxis);

      svg.append("g")
        .attr("transform", `translate(50, 0)`)
        .call(yAxis);

      // Add axis labels
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("GDP Total ($)");

      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 20)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("GDP Per Capita ($)");

      // Create scatter plot points
      const circles = svg.selectAll(".dot")
        .data(mergedData)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d.gdp_total))
        .attr("cy", d => yScale(d.gdp_per_capita))
        .attr("r", 5)
        .style("fill", d => d.color)
        .on("mouseover", function (event, d) {
          // Display tooltip on hover
          d3.select(tooltipRef.current)
            .style("opacity", 1)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 40}px`)
            .html(`
              <strong>${d.country}</strong><br/>
              GDP Total: $${(d.gdp_total / 1e9).toFixed(1)}B<br/>
              GDP Per Capita: $${d.gdp_per_capita.toLocaleString()}
            `);

          d3.select(this).transition().duration(200).attr("r", 8);  // Increase dot size on hover
        })
        .on("mouseout", function () {
          // Hide tooltip
          d3.select(tooltipRef.current).style("opacity", 0);
          d3.select(this).transition().duration(200).attr("r", 5);  // Reset dot size
        });
    }
  }, [mergedData]);

  if (isLoadingGDP || isLoadingGDPPerCapita) return <div className="loader">Loading...</div>;
  if (gdpError || gdpPerCapitaError) return <p>Error fetching data</p>;

  return (
    <div className="gdp-scatter-plot-container" style={{ position: "relative" }}>
      <div className="year-select-container">
        <label htmlFor="year-select" className="year-select-label">
          Select Year:
        </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="year-select-dropdown"
        >
          {[...Array(25).keys()].map((i) => (
            <option key={i} value={2000 + i}>
              {2000 + i}
            </option>
          ))}
        </select>
      </div>

      <svg ref={svgRef} width="100%" height={600} />

      {/* Tooltip for displaying information on hover */}
      <div
        ref={tooltipRef}
        className="tooltip"
        style={{
          position: "absolute",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "#fff",
          padding: "10px",
          borderRadius: "4px",
          pointerEvents: "none",
          opacity: 0,
          transition: "opacity 0.2s ease",
        }}
      />
    </div>
  );
};

export default GDPScatterPlot;
