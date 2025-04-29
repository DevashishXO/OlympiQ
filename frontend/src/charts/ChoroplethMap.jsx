import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const ChoroplethMap = () => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [year, setYear] = useState(2023);
  const [geoData, setGeoData] = useState(null);
  const [gdpData, setGdpData] = useState(null);

  // Sample GDP data
  const sampleGDP = {
    USA: { 2020: 63000, 2021: 65000, 2022: 67000, 2023: 69000 },
    IND: { 2020: 2100, 2021: 2200, 2022: 2300, 2023: 2400 },
    CHN: { 2020: 10000, 2021: 11000, 2022: 12000, 2023: 13000 },
    BRA: { 2020: 8700, 2021: 8800, 2022: 8900, 2023: 9000 },
    ZAF: { 2020: 6000, 2021: 6100, 2022: 6200, 2023: 6300 },
    RUS: { 2020: 11500, 2021: 11600, 2022: 11700, 2023: 11800 },
    AUS: { 2020: 55000, 2021: 56000, 2022: 57000, 2023: 58000 },
    CAN: { 2020: 45000, 2021: 46000, 2022: 47000, 2023: 48000 },
    FRA: { 2020: 42000, 2021: 43000, 2022: 44000, 2023: 45000 },
    JPN: { 2020: 40000, 2021: 41000, 2022: 42000, 2023: 43000 },
  };

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const container = svgRef.current.parentNode;
    const width = container.clientWidth;
    const height = window.innerHeight * 0.8;

    svg
      .attr('width', width)
      .attr('height', height)
      .style('background-color', '#f5f5f5');

    svg.selectAll('*').remove();

    const projection = d3.geoMercator()
      .scale((width / 3.1) / Math.PI)
      .translate([width / 2, height / 1.4]);

    const pathGenerator = d3.geoPath().projection(projection);

    const colorScale = d3.scaleSequential()
      .domain([1000, 70000])
      .interpolator(d3.interpolateReds);

    d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then((geo) => {
        geo.features = geo.features.filter(f => f.properties.name !== "Antarctica");

        setGeoData(geo);
        setGdpData(sampleGDP);

        svg.selectAll('path')
          .data(geo.features)
          .join('path')
          .attr('d', pathGenerator)
          .attr('stroke', '#000')
          .attr('stroke-width', 0.5)
          .attr('fill', '#ccc')
          .on('mouseover', function (event, d) {
            const currentYear = d3.select('#yearSlider').property('value');
            const val = sampleGDP[d.id]?.[currentYear];

            d3.selectAll('path').transition().duration(200).style('opacity', 0.3);

            d3.select(this)
              .raise()
              .transition()
              .duration(200)
              .style('opacity', 1)
              .style('stroke', '#111')
              .style('stroke-width', 2);

            const tooltip = d3.select(tooltipRef.current);
            tooltip
              .transition()
              .duration(200)
              .style('opacity', 1)
              .html(`<div class="text-red-800 font-bold">${d.properties.name}</div><div>GDP: $${val ? val.toLocaleString() : "N/A"}</div>`)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px');
          })
          .on('mouseout', function () {
            d3.selectAll('path').transition().duration(200).style('opacity', 1);
            d3.select(this)
              .transition()
              .duration(200)
              .style('stroke', '#000')
              .style('stroke-width', 0.5);

            d3.select(tooltipRef.current).transition().duration(500).style('opacity', 0);
          });

        // Legend
        const legendWidth = 300;
        const legendHeight = 10;
        const legendX = 80;
        const legendY = height - 120;

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
          .attr("stop-color", d => colorScale(d * 70000));

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
          .domain([1000, 70000])
          .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
          .ticks(6)
          .tickFormat(d => `$${d / 1000}k`);

        svg.append("g")
          .attr("transform", `translate(${legendX}, ${legendY + 15})`)
          .call(legendAxis)
          .selectAll("text")
          .attr("class", "text-sm text-gray-700");
      })
      .catch(error => {
        console.error('Error loading GeoJSON:', error);
      });

  }, []);

  useEffect(() => {
    if (!geoData || !gdpData) return;

    const svg = d3.select(svgRef.current);
    const colorScale = d3.scaleSequential()
      .domain([1000, 70000])
      .interpolator(d3.interpolateReds);

    svg.selectAll('path')
      .transition()
      .duration(600)
      .ease(d3.easeCubic)
      .attr('fill', d => {
        if (!d || !d.id) return "#ccc";
        const val = gdpData[d.id]?.[year];
        return val ? colorScale(val) : "#ccc";
      });

  }, [year, geoData, gdpData]);

  return (
    <div className="relative w-full">
      <h2 className="text-center text-2xl font-bold text-red-800 mt-4 mb-6">GDP per Capita (USD)</h2>

      <div id="map" className="w-full h-[80vh]">
        <svg ref={svgRef} className="w-full h-full"></svg>
      </div>

      {/* Year Slider */}
      <div className="w-[90%] mx-auto my-8 text-center">
        <input
          id="yearSlider"
          type="range"
          min="2020"
          max="2023"
          step="1"
          value={year}
          onChange={e => setYear(+e.target.value)}
          className="w-full accent-red-700"
        />
        <div className="mt-3 font-bold text-red-800 text-xl">
          Selected Year (GDP): {year}
        </div>

        {/* Year Labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2 px-4">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i}>{2020 + i}</span>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      <div ref={tooltipRef} className="absolute p-2 bg-white border border-gray-300 rounded-md shadow-md text-gray-800 text-sm pointer-events-none opacity-0"></div>
    </div>
  );
};

export default ChoroplethMap;
