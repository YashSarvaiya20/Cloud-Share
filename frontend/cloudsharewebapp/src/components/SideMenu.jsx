import React from "react";
import { useUser } from "@clerk/clerk-react";
import { User, Sparkles } from "lucide-react";
import { SIDE_MENU_DATA } from "../assets/data";
import { useNavigate, useLocation } from "react-router-dom";

const SideMenu = ({activeMenu, isMobile = false, onNavigate}) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className={`${isMobile ? "h-full" : "sticky top-[86px] h-[calc(100vh-110px)]"} w-72 glass-card p-4`}> 
      <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-4">
        <div className="flex items-center gap-3">
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt="Profile"
            className="h-12 w-12 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
            <User className="h-6 w-6 text-slate-500" />
          </div>
        )}

          <div className="min-w-0">
            <h5 className="truncate text-sm font-semibold text-slate-900">{user?.fullName || "Your Workspace"}</h5>
            <p className="truncate text-xs text-slate-500">{user?.primaryEmailAddress?.emailAddress || "Personal plan"}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 px-3 py-2 text-xs font-medium text-indigo-700">
          <Sparkles size={14} />
          CloudShare SaaS Workspace
        </div>
      </div>

      <nav className="space-y-1.5">
        {SIDE_MENU_DATA.map((item) => {
        const isActive = location.pathname === item.path;

        return (
          <button
            key={item.id}
            onClick={() => {
              navigate(item.path);
              if (onNavigate) onNavigate();
            }}
            className={`
              w-full group flex items-center gap-3 text-sm
              px-3 py-2.5 rounded-xl
              transition-all duration-200
              ${isActive
                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 text-white shadow-lg shadow-indigo-500/25"
                : "text-slate-700 hover:bg-slate-100"}
            `}
          >
            <item.icon className={`h-[18px] w-[18px] ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"}`} />
            <span className="font-medium">{item.label}</span>
          </button>
        );
      })}
      </nav>
    </aside>
  );
};

export default SideMenu;
