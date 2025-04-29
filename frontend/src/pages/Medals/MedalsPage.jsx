import React from "react";
import TopCountriesCard from "../../components/MedalsPage/TopCountriesCard";
import BestYearCard from "../../components/MedalsPage/BestYearCard";
import FirstMedalCard from "../../components/MedalsPage/FirstMedalCard";
import HighestMedalYearCard from "../../components/MedalsPage/HighestMedalYearCard";
import AverageMedalsCard from "../../components/MedalsPage/AverageMedalsCard";

const MedalsPage = () => {
  return (
    <div className="p-6 space-y-8">
      <h2 className="text-3xl font-semibold mb-8 text-olympiq-blue">
        Medals Overview
      </h2>

      {/* Card Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BestYearCard />
        <FirstMedalCard />
        <HighestMedalYearCard />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <AverageMedalsCard />
        <TopCountriesCard />
      </div>

    </div>
  );
};

export default MedalsPage;