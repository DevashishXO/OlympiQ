import React, { useState } from "react";
import { Outlet, useOutlet } from "react-router-dom";
import Topbar from "../components/Topbar";

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const outlet = useOutlet(); // 👈 useOutlet to check if there is a child

  return (
    <div className="flex h-screen bg-neutral-900 text-white">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto py-6 px-4">
          {outlet || (
            <div className="flex flex-col items-center justify-center h-full text-center text-white">
              <h1 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-[var(--olympiq-blue)] to-sky-400 bg-clip-text text-transparent animate-pulse">
                Welcome to the OlympIQ Platform!
              </h1>
              <p className="text-lg text-neutral-400">
                Choose a section from the top menu to get started.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
