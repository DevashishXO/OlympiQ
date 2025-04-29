import React from "react";
import BubbleChart from "../../charts/BubbleChart";

const Report1 = () => {
  return (
    <div className="p-6 space-y-8">
      <h2 className="text-3xl font-semibold mb-8 text-olympiq-blue">
        HealthExpenditure vs EducationExpenditure
      </h2>
      <BubbleChart />
    </div>
  );
};

export default Report1;
