import { CreditCard } from "react-feather";
import React from "react";

const CreditsDisplay = ({ credits }) => {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 px-3.5 py-1.5 text-indigo-700 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow">
      <CreditCard size={14} />
      <span className="text-sm font-semibold">{credits}</span>
      <span className="text-xs font-medium text-indigo-500">Credits</span>
    </div>
  );
};

export default CreditsDisplay;
