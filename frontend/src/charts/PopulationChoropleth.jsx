import React, { useEffect, useRef, useState } from 'react';
import { useGetAllPopulationQuery } from "../store/api";
import * as d3 from 'd3';

const PopulationChoropleth = () => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [year, setYear] = useState(2023);
  const [populationData, setPopulationData] = useState({});
  const [topCountries, setTopCountries] = useState([]);
  
  const { data: populationRawData, isLoading, isError } = useGetAllPopulationQuery();

  const countryNameMap = {
    "USA": "United States",
    "UK": "United Kingdom",
    "DEU": "Germany",
    "CAN": "Canada",
    "AUS": "Australia",
    // Add more mappings if needed
  };

  useEffect(() => {
    if (!populationRawData) return;

    const nestedPopulation = {};
    populationRawData.forEach(item => {
      const countryName = countryNameMap[item.Country] || item.Country;
      if (!nestedPopulation[countryName]) {
        nestedPopulation[countryName] = {};
      }
      nestedPopulation[countryName][item.Year] = Math.round(item.Population / 1_000_000);
    });

    setPopulationData(nestedPopulation);

    const topList = Object.entries(nestedPopulation)
      .map(([country, years]) => ({
        country,
        population: years[year] || 0,
      }))
      .sort((a, b) => b.population - a.population)
      .slice(0, 300) // Top 20 countries
      .map(item => item.country);

    setTopCountries(topList);
  }, [populationRawData, year]);

  useEffect(() => {
    if (!svgRef.current || !populationData) return;

    const svg = d3.select(svgRef.current);
    const container = svgRef.current.parentNode;
    const width = container ? container.clientWidth : window.innerWidth;
    const height = window.innerHeight * 0.8;

    svg.attr('width', width).attr('height', height).style('background-color', '#f5f5f5');
    svg.selectAll('*').remove();

    const projection = d3.geoMercator()
      .scale((width / 2.5) / Math.PI)
      .translate([width / 2, height / 1.5]);

    const pathGenerator = d3.geoPath().projection(projection);

    const allPopulations = Object.values(populationData)
      .map(country => country[year])
      .filter(val => val !== undefined);

    const minPop = d3.min(allPopulations) ?? 0;
    const maxPop = d3.max(allPopulations) ?? 1;

    const colorScale = d3.scaleSequential()
      .domain([minPop, maxPop])
      .interpolator(d3.interpolateBlues);

    d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then(geoData => {
        geoData.features = geoData.features.filter(f => f.properties && f.properties.name !== "Antarctica");

        svg.selectAll('path')
          .data(geoData.features)
          .join('path')
          .attr('d', pathGenerator)
          .attr('stroke', d => topCountries.includes(d.properties.name) ? '#333' : '#aaa')
          .attr('stroke-width', d => topCountries.includes(d.properties.name) ? 1.5 : 0.5)
          .attr('fill', d => {
            const countryName = d.properties?.name;
            const val = populationData[countryName]?.[year];
            return val !== undefined ? colorScale(val) : '#ccc';
          })
          .on('mouseover', function (event, d) {
            const countryName = d.properties?.name;
            const val = populationData[countryName]?.[year];

            d3.select(this)
              .raise()
              .transition()
              .duration(200)
              .attr('stroke', '#111')
              .attr('stroke-width', 2);

            d3.select(tooltipRef.current)
              .style('opacity', 1)
              .html(`
                <div class="text-blue-800 font-bold">${countryName}</div>
                <div>Population: ${val ? `${val.toLocaleString()}M` : "N/A"}</div>
              `)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px');
          })
          .on('mouseout', function () {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('stroke', d => topCountries.includes(d.properties.name) ? '#333' : '#aaa')
              .attr('stroke-width', d => topCountries.includes(d.properties.name) ? 1.5 : 0.5);

            d3.select(tooltipRef.current)
              .transition()
              .duration(300)
              .style('opacity', 0);
          });

        // Legend
        const legendWidth = 300;
        const legendHeight = 10;
        const legendX = 80;
        const legendY = height - 100;

        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient")
          .attr("id", "legend-gradient")
          .attr("x1", "0%")
          .attr("x2", "100%");

        linearGradient.selectAll("stop")
          .data(d3.range(0, 1.01, 0.1))
          .enter()
          .append("stop")
          .attr("offset", d => `${d * 100}%`)
          .attr("stop-color", d => colorScale(minPop + d * (maxPop - minPop)));

        svg.append("rect")
          .attr("x", legendX - 10)
          .attr("y", legendY - 15)
          .attr("width", legendWidth + 20)
          .attr("height", 40)
          .attr("rx", 6)
          .attr("fill", "white")
          .attr("stroke", "#ccc")
          .attr("stroke-width", 0.5)
          .style("filter", "drop-shadow(0px 0px 5px rgba(0,0,0,0.15))");

        svg.append("g")
          .attr("transform", `translate(${legendX}, ${legendY})`)
          .append("rect")
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .style("fill", "url(#legend-gradient)");

        const legendScale = d3.scaleLinear()
          .domain([minPop, maxPop])
          .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
          .ticks(5)
          .tickFormat(d => `${d}M`);

        svg.append("g")
          .attr("transform", `translate(${legendX}, ${legendY + 15})`)
          .call(legendAxis)
          .selectAll("text")
          .attr("class", "text-xs text-gray-700");
      })
      .catch(err => console.error('Error loading GeoJSON:', err));
  }, [populationData, year, topCountries]);

  if (isLoading) return <div>Loading population data...</div>;
  if (isError) return <div>Error loading population data.</div>;

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef}></svg>
      <div ref={tooltipRef} className="absolute pointer-events-none bg-white text-xs p-2 rounded shadow opacity-0"></div>
      <div className="absolute top-4 right-4 bg-white p-2 rounded shadow">
        <input
          type="range"
          min={2000}
          max={2023}
          value={year}
          onChange={e => setYear(parseInt(e.target.value))}
          className="w-32"
        />
        <span className="ml-2 font-semibold text-lg">{year}</span>
      </div>
    </div>
  );
};

export default PopulationChoropleth;
