import React from "react";
import OlympicPerformanceChart from "../../charts/OlympicPerformanceChart"

const MedalsPage = () => {
  return (
    <div className="p-6 space-y-8">
      <h2 className="text-3xl font-semibold mb-8 text-olympiq-blue">
        Medals Insight
      </h2>
      <OlympicPerformanceChart/>

    </div>
  );
};

export default MedalsPage;