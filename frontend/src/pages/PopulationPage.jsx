import React from "react";
import PopulationChoropleth from "../charts/PopulationChoropleth";

const PopulationPage = () => {
  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4">Population Statistics</h2>
      <p>Population-related visualizations and metrics go here.</p>

      <PopulationChoropleth />
    </div>
  );
};

export default PopulationPage;
