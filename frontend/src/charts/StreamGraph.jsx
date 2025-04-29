import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  useGetAllGDPQuery,
  useGetMedalsQuery, // Use the medals query
} from "../store/api";

const StreamGraph = () => {
  const { data: gdpData, isLoading: loadingGDP, error: gdpError } = useGetAllGDPQuery();
  const { data: medalsData, isLoading: loadingMedals, error: medalsError } = useGetMedalsQuery();
  const svgRef = useRef();

  const [mergedData, setMergedData] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]); // To store selected countries

  // 1) Wait for both queries
  useEffect(() => {
    if (loadingGDP || loadingMedals) return;
    if (gdpError || medalsError) return console.error(gdpError || medalsError);
    if (!gdpData || !medalsData) return;

    // 2) Merge on Country-Year
    const mapGDP = new Map();
    gdpData.forEach(d => mapGDP.set(`${d.Country}-${d.Year}`, +d.GDP));

    const temp = [];
    medalsData.forEach(d => {
      const key = `${d.Country}-${d.Year}`;
      if (mapGDP.has(key)) {
        temp.push({
          country: d.Country,
          year: +d.Year,
          GDP: mapGDP.get(key),
          gold: +d.Gold,
          silver: +d.Silver,
          bronze: +d.Bronze,
        });
      }
    });

    // 3) Drop Kosovo and fill missing medals with zero
    const filtered = temp
      .filter(d => d.country !== "Kosovo")
      .map(d => ({
        ...d,
        gold: isNaN(d.gold) ? 0 : d.gold,
        silver: isNaN(d.silver) ? 0 : d.silver,
        bronze: isNaN(d.bronze) ? 0 : d.bronze,
      }));

    setMergedData(filtered);
  }, [gdpData, medalsData, loadingGDP, loadingMedals, gdpError, medalsError]);

  // 4) Draw
  useEffect(() => {
    if (!mergedData.length || !selectedCountries.length) return;

    const data = mergedData.filter(d => selectedCountries.includes(d.country));
    const years = Array.from(new Set(data.map(d => d.year))).sort((a, b) => a - b);

    // prepare stack input for medals
    const stackInput = years.map(year => {
      const row = { year };
      selectedCountries.forEach(country => {
        const rec = data.find(d => d.year === year && d.country === country);
        row[country] = rec ? rec.GDP : 0;
      });
      return row;
    });

    const stackInputMedals = years.map(year => {
      const row = { year };
      selectedCountries.forEach(country => {
        const rec = data.find(d => d.year === year && d.country === country);
        row[country] = rec ? rec.gold + rec.silver + rec.bronze : 0; // Combine all medals into one value
      });
      return row;
    });

    // scales
    const width = 960, height = 500;
    const margin = { top: 20, right: 30, bottom: 50, left: 150 }; // Increase left margin for the legend
    const x = d3.scaleLinear()
      .domain(d3.extent(years))
      .range([margin.left, width - margin.right]);
    const stack = d3.stack()
      .keys(selectedCountries)
      .offset(d3.stackOffsetWiggle);
    const seriesGDP = stack(stackInput);
    const seriesMedals = stack(stackInputMedals);
    const y = d3.scaleLinear()
      .domain([ 
        d3.min(seriesGDP.concat(seriesMedals), s => d3.min(s, d => d[0])),
        d3.max(seriesGDP.concat(seriesMedals), s => d3.max(s, d => d[1]))
      ])
      .range([height - margin.bottom, margin.top]);

    // Dark theme colors
    const color = d3.scaleOrdinal(selectedCountries, d3.schemeSet3);

    const area = d3.area()
      .x(d => x(d.data.year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveCatmullRom);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg
      .attr("viewBox", [0, 0, width, height])
      .style("background", "#333");

    // GDP layers
    svg.append("g")
      .selectAll("path")
      .data(seriesGDP)
      .join("path")
      .attr("fill", d => color(d.key))
      .attr("opacity", 0.9)
      .attr("d", area)
      .on("mouseover", function(event, d) {
        const [xPos, yPos] = d3.pointer(event);
        const tooltip = d3.select("#tooltip");
        tooltip.style("visibility", "visible")
          .style("top", `${yPos}px`)
          .style("left", `${xPos}px`)
          .html(`<strong>Country:</strong> ${d.key}<br/><strong>GDP:</strong> ${d.data[d.key]}`);
      })
      .on("mouseout", function() {
        d3.select("#tooltip").style("visibility", "hidden");
      });

    // Medal layers
    svg.append("g")
      .selectAll("path")
      .data(seriesMedals)
      .join("path")
      .attr("fill", d => color(d.key))
      .attr("opacity", 0.6)
      .attr("d", area)
      .on("mouseover", function(event, d) {
        const [xPos, yPos] = d3.pointer(event);
        const tooltip = d3.select("#tooltip");
        tooltip.style("visibility", "visible")
          .style("top", `${yPos}px`)
          .style("left", `${xPos}px`)
          .html(`<strong>Country:</strong> ${d.key}<br/><strong>Medals:</strong> ${d.data[d.key]}`);
      })
      .on("mouseout", function() {
        d3.select("#tooltip").style("visibility", "hidden");
      });

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(years.length).tickFormat(d3.format("d")))
      .selectAll("text").style("fill", "white");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .selectAll("text").style("fill", "white");

    // Add Axis Labels
    svg.append("text")
      .attr("transform", `translate(${width / 2}, ${height - margin.bottom + 30})`)
      .style("fill", "white")
      .style("text-anchor", "middle")
      .text("Year");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", margin.left - 40)
      .style("fill", "white")
      .style("text-anchor", "middle")
      .text("GDP / Medals");

    // Move legend to the left of the graph
    const legend = svg.append("g")
      .attr("transform", `translate(10,${margin.top})`) // Position legend to the left side
      .selectAll("g")
      .data(selectedCountries)
      .join("g")
      .attr("transform", (_, i) => `translate(0,${i * 20})`);
    legend.append("rect")
      .attr("x", -10)
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", d => color(d));
    legend.append("text")
      .attr("x", 10)
      .attr("y", 9)
      .attr("dy", "0.35em")
      .style("fill", "white")
      .text(d => d);

  }, [mergedData, selectedCountries]);

  // Handle country selection changes
  const handleCountryChange = (e) => {
    const value = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedCountries(value);
  };

  // Handle select all countries
  const handleSelectAll = () => {
    const allCountries = Array.from(new Set(mergedData.map(d => d.country)));
    setSelectedCountries(allCountries);
  };

  if (loadingGDP || loadingMedals) return <p style={{ color: "white" }}>Loading...</p>;
  if (gdpError || medalsError) return <p style={{ color: "white" }}>Error loading data.</p>;

  return (
    <div style={{ padding: 20, backgroundColor: "#222", display: 'flex' }}>
      <div style={{ flex: 1 }}>
        <h2 style={{ textAlign: "center", color: "white" }}>GDP vs Medal Counts StreamGraph</h2>

        {/* Country selection filter */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ color: "white" }}>Select Countries:</label>
          <select multiple={true} onChange={handleCountryChange} style={{ width: "200px" }}>
            {Array.from(new Set(mergedData.map(d => d.country))).map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        {/* Select All countries button */}
        <div>
          <button onClick={handleSelectAll} style={{ padding: "10px", backgroundColor: "#444", color: "white" }}>
            Select All Countries
          </button>
        </div>
      </div>

      {/* The SVG container now has a flexible layout with room for the legend */}
      <svg ref={svgRef} width="80%" height="500px" />
      
      {/* Tooltip for displaying country data on hover */}
      <div id="tooltip" style={{
        position: 'absolute',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        visibility: 'hidden'
      }} />
    </div>
  );
};

export default StreamGraph;
