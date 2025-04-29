import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";
import MedalsPage from "./pages/Medals/MedalsPage";
import GDPPage from "./pages/GDP/GDPPage";
import HealthExpenditurePage from "./pages/HealthExpenditurePage";
import PopulationPage from "./pages/PopulationPage";
import PoliticalStabilityPage from "./pages/PoliticalStabilityPage";
import LiteracyRatePage from "./pages/LiteracyRatePage";
import InsightPage from "./pages/InsightPage";
import MedalsInsight from "./pages/Medals/MedalsInsight";
import GDPInsights from "./pages/GDP/GDPInsights";
import ReportPage from "./pages/ReportPage";
import Report1 from "./pages/Reports/Report1";
import EducationExpenditureInsights from "./pages/EducationExpenditure/EducationExpenditureInsights"
import Report4 from "./pages/Reports/Report4";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route path="dashboard" element={<DashboardPage />}>
            <Route path="medals" element={<MedalsPage />} />
            <Route path="gdp" element={<GDPPage />} />
            <Route path="education" element={<EducationExpenditureInsights />} />
            <Route path="health" element={<HealthExpenditurePage />} />
            <Route path="population" element={<PopulationPage />} />
            <Route path="stability" element={<PoliticalStabilityPage />} />
            <Route path="literacy" element={<LiteracyRatePage />} />
          </Route>
          <Route path="insights" element={<InsightPage />}>
            <Route path="medals" element={<MedalsInsight />} />
            <Route path="gdp" element={<GDPInsights />} />
            <Route path="education" element={<EducationExpenditureInsights />} />
            <Route path="health" element={<MedalsInsight />} />
            <Route path="population" element={<MedalsInsight />} />
            <Route path="political-stability" element={<MedalsInsight />} />
            <Route path="literacy-rate" element={<MedalsInsight />} />
          </Route>
          <Route path="reports" element={<ReportPage />}>
            <Route path="report1" element={<Report1 />} />
            <Route path="report2" element={<GDPInsights />} />
            <Route path="report3" element={<MedalsInsight />} />
            <Route path="report4" element={<Report4 />} />
          </Route>
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
