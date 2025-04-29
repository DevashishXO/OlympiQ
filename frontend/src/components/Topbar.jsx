import React, { useState } from "react";
import { Search, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Topbar = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const navigate = useNavigate();

  const tabs = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Insights", path: "/insights" },
    { name: "Reports", path: "/reports" },
    { name: "Settings", path: "/settings" },
  ];

  return (
    <header className="flex items-center justify-between px-6 bg-neutral-900 shadow-sm border-b border-neutral-700 h-20">
      {/* Logo */}
      <div className="flex items-center h-full overflow-hidden">
        <img
          src="/logoname.png"
          alt="logo"
          className="w-42 object-contain scale-110"
        />
      </div>

      {/* Center Tabs */}
      <nav className="hidden md:flex items-center justify-center gap-2 px-2 bg  rounded-full py-2 shadow-inner min-w-md">
        <span className="">{`<`}</span>
        {tabs.map((tab) => (
          <button
            key={tab.name}
            className={`text-md font-semibold px-4 py-2 rounded-full transition-colors duration-300 hover:bg-neutral-700 ${
              activeTab === tab.name
                ? "text-(--olympiq-blue) bg-neutral-700"
                : "text-white hover:text-(--olympiq-blue)"
            }`}
            onClick={() => {
              setActiveTab(tab.name);
              navigate(tab.path);
            }}
          >
            {tab.name}
          </button>
        ))}
        <span>{`>`}</span>
      </nav>

      {/* Right Icons */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-neutral-700 rounded-full hover:bg-neutral-600 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95">
          <Search size={18} />
        </div>
      </div>
    </header>
  );
};

export default Topbar;
