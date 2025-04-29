import React, { useState } from "react";
import {
  Home,
  TrendingUp,
  Activity,
  Users,
  Shield,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const SidebarInsight = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { label: "Medals Insight", icon: <Home size={18} />, route: "/insights/medals" },
    { label: "GDP Insight", icon: <TrendingUp size={18} />, route: "/insights/gdp" },
    { label: "Education Insight", icon: <TrendingUp size={18} />, route: "/insights/education" },
    { label: "Health Expenditure", icon: <Activity size={18} />, route: "/insights/health" },
    { label: "Population Insight", icon: <Users size={18} />, route: "/insights/population" },
    { label: "Political Stability", icon: <Shield size={18} />, route: "/insights/stability" },
    { label: "Literacy Rate", icon: <BookOpen size={18} />, route: "/insights/literacy" },
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

export default SidebarInsight;
