import { CreditCard } from "react-feather";
import React from "react";
import { useTheme } from "../context/ThemeContext.jsx";

const CreditsDisplay = ({ credits }) => {
  const { isDark } = useTheme();
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 shadow-sm transition-all duration-200 hover:shadow ${isDark ? 'border-slate-700 bg-slate-900 text-indigo-200 hover:border-indigo-500/50' : 'border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 hover:border-indigo-200'}`}>
      <CreditCard size={14} />
      <span className="text-sm font-semibold">{credits}</span>
      <span className={`text-xs font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-500'}`}>Credits</span>
    </div>
  );
};

export default CreditsDisplay;
