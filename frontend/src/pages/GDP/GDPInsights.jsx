import React from "react";
import GDPScatterPlot from "../../charts/GDPScatterPlot";
import BubbleChart from "../../charts/BubbleChart";

const GDPInsights = () => {
  return (
    <div className="p-6 space-y-8">
      <h2 className="text-3xl font-semibold mb-8 text-olympiq-blue">
        GDP Insight
      </h2>
      <BubbleChart/>

    </div>
  );
};

export default GDPInsights;