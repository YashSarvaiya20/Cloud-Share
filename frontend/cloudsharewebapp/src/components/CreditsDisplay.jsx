import { CreditCard } from "react-feather";
import React from "react";

const CreditsDisplay = ({ credits }) => {
  console.log("Rendering CreditsDisplay with credits:", credits);
  return (
    <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full text-blue-700">
      <CreditCard size={16} />
      <span className="text-sm font-medium">{credits}</span>
      <span className="text-xs">Credits</span>
    </div>
  );
};

export default CreditsDisplay;
