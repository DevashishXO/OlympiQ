import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import { useGetAllLifeExpectancyQuery } from "../store/api";

const LifeExpectancyMarimekko = () => {
  const {
    data: lifeData = [],
    isLoading,
    isError
  } = useGetAllLifeExpectancyQuery();

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [averageLifeExpectancy, setAverageLifeExpectancy] = useState(0);

  // 1) Initialize year
  useEffect(() => {
    if (lifeData.length) {
      const years = Array.from(new Set(lifeData.map(d => d.Year)))
        .sort((a, b) => b - a);
      setSelectedYear(years[0]);
    }
  }, [lifeData]);

  // 2) Filter by year & countries and calculate average life expectancy
  useEffect(() => {
    if (!lifeData.length || selectedYear == null) return;
    let data = lifeData.filter(d => d.Year === selectedYear);
    if (selectedCountries.length > 0) {
      data = data.filter(d => selectedCountries.includes(d.Country));
    }
    setFilteredData(
      data.map(d => ({ name: d.Country, value: +d["Life Expectancy"] }))
    );
    
    // Calculate average life expectancy for selected countries
    const totalLifeExpectancy = data.reduce((sum, d) => sum + d["Life Expectancy"], 0);
    const avgLifeExpectancy = totalLifeExpectancy / data.length;
    setAverageLifeExpectancy(avgLifeExpectancy);
  }, [lifeData, selectedYear, selectedCountries]);

  // 3) Draw Marimekko
  useEffect(() => {
    if (!filteredData.length) return;

    const width = 800;
    const height = 500;
    const margin = { top: 40, right: 20, bottom: 60, left: 120 };

    const total = d3.sum(filteredData, d => d.value);
    const x = d3.scaleLinear()
      .domain([0, total])
      .range([margin.left, width - margin.right]);
    const y = d3.scaleBand()
      .domain(filteredData.map(d => d.name))
      .range([margin.top, height - margin.bottom])
      .padding(0.1);

    const color = d3.scaleSequential(d3.interpolateCool)
      .domain(d3.extent(filteredData, d => d.value));

    const svg = d3.select("#d3-chart")
      .html("")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Bars
    let cum = 0;
    svg.append("g")
      .selectAll("rect")
      .data(filteredData)
      .join("rect")
      .attr("x", d => {
        const x0 = x(cum);
        cum += d.value;
        return x0;
      })
      .attr("y", d => y(d.name))
      .attr("height", y.bandwidth())
      .attr("width", d => x(d.value) - x(0))
      .attr("fill", d => color(d.value))
      .attr("stroke", "#fff");

    // Labels inside bars
    cum = 0;
    svg.append("g")
      .selectAll("text")
      .data(filteredData)
      .join("text")
      .attr("x", d => {
        const x0 = x(cum) + (x(d.value) - x(0)) / 2;
        cum += d.value;
        return x0;
      })
      .attr("y", d => y(d.name) + y.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", "12px")
      .text(d => `${d.name}: ${d.value.toFixed(1)}`);

    // Axes
    const xAxis = d3.axisBottom(x).ticks(8);
    const yAxis = d3.axisLeft(y);

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .call(g => g.selectAll("text").attr("fill", "white"))
      .call(g => g.select(".domain").attr("stroke", "white"));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .call(g => g.selectAll("text").attr("fill", "white"))
      .call(g => g.select(".domain").attr("stroke", "white"));

    // X axis label
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - margin.bottom + 40)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "14px")
      .text("Cumulative Life Expectancy");

    // Y axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", margin.left - 80)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "14px")
      .text("Country");

    // Average Life Expectancy label
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top - 20)
      .attr("text-anchor", "middle")
      .attr("fill", "yellow")
      .attr("font-size", "16px")
      .text(`Average Life Expectancy: ${averageLifeExpectancy.toFixed(1)} years`);

    // Tooltip
    const tooltip = d3.select("#d3-chart")
      .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "#333")
      .style("color", "#fff")
      .style("padding", "5px 10px")
      .style("border-radius", "4px");

    cum = 0;
    svg.selectAll("rect")
      .on("mouseover", (e, d) => {
        tooltip.html(`<strong>${d.name}</strong><br/>${d.value} years`)
          .style("visibility", "visible");
      })
      .on("mousemove", e => {
        tooltip
          .style("top", (e.pageY - 40) + "px")
          .style("left", (e.pageX + 10) + "px");
      })
      .on("mouseout", () => tooltip.style("visibility", "hidden"));

  }, [filteredData, averageLifeExpectancy]);

  // Loading / error states
  if (isLoading) return <div className="text-white text-center">Loading...</div>;
  if (isError) return <div className="text-red-500 text-center">Failed to load data.</div>;

  // Selectors
  const years = Array.from(new Set(lifeData.map(d => d.Year))).sort((a, b) => b - a);
  const countries = Array.from(new Set(
    lifeData.filter(d => d.Year === selectedYear).map(d => d.Country)
  )).sort();

  return (
    <div className="p-6 bg-neutral-900 text-white rounded-lg border border-neutral-700">
      {/* Year selector */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Select Year</label>
        <select
          className="bg-neutral-800 text-white px-4 py-2 rounded w-full"
          value={selectedYear ?? ""}
          onChange={e => {
            setSelectedYear(Number(e.target.value));
            setSelectedCountries([]);
          }}
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Country multi-select */}
      <div className="mb-6">
        <label className="block mb-1 font-semibold">Select Countries</label>
        <select
          multiple
          value={selectedCountries}
          onChange={e =>
            setSelectedCountries(Array.from(e.target.selectedOptions, o => o.value))
          }
          className="bg-neutral-800 text-white px-4 py-2 rounded w-full h-32"
        >
          {countries.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div id="d3-chart" className="overflow-x-auto" />
    </div>
  );
};

export default LifeExpectancyMarimekko;
