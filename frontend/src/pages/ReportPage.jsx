import React from "react";
import { Outlet, useOutlet } from "react-router-dom";
import SidebarReport from "../components/SidebarReport";

const ReportPage = () => {
  const outlet = useOutlet();

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <SidebarReport />

      {/* Main Report Content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {outlet || (
          <div className="flex flex-col items-center justify-center h-full text-center text-white">
            <h1 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-[var(--olympiq-blue)] to-sky-400 bg-clip-text text-transparent animate-pulse">
              Welcome to Reports!
            </h1>
            <p className="text-lg text-neutral-400">
              Select an Report from the sidebar to explore the data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;
