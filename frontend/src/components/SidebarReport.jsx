import React, { useState } from "react";
import {
  Home,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const SidebarReport = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    {
      label: "HealthExpenditure vs EducationExpenditure",
      icon: <Home size={18} />,
      route: "/reports/report1",
    },
    { label: "PSI", icon: <TrendingUp size={18} />, route: "/reports/report2" },
    {
      label: "Cluster",
      icon: <Activity size={18} />,
      route: "/reports/report3",
    },
    {
      label: "Correlation",
      icon: <Activity size={18} />,
      route: "/reports/report4",
    },
  ];

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } transition-all duration-200 bg-neutral-900 border-r border-neutral-700 h-full pr-4 flex flex-col`}
    >
      {/* Collapse Button */}
      <div
        className={`${
          collapsed ? "flex justify-center" : "flex justify-end"
        } mb-5`}
      >
        <div
          className="bg-neutral-800 h-10 w-10 rounded-full flex items-center justify-center hover:bg-neutral-700 transition"
          onClick={() => setCollapsed(!collapsed)}
        >
          <button className="text-[var(--olympiq-blue)]">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.route)}
            className="flex items-center gap-3 text-md font-medium text-white px-4 py-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-all duration-200 group"
          >
            <div className="text-[var(--olympiq-blue)]">{item.icon}</div>
            {!collapsed && (
              <span className="group-hover:text-[var(--olympiq-blue)]">
                {item.label}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default SidebarReport;
