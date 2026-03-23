import React from "react";
import { useUser } from "@clerk/clerk-react";
import { User } from "lucide-react";
import { SIDE_MENU_DATA } from "../assets/data";
import { useNavigate, useLocation } from "react-router-dom";

const SideMenu = ({activeMenu}) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="w-64 h-[calc(100vh-61px)] bg-white border-r border-gray-200/50 p-5 sticky top-[61px] z-20">
      {/* Profile */}
      <div className="flex flex-col items-center justify-center gap-3 mt-3 mb-7">
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <User className="w-20 h-20 text-gray-400" />
        )}

        <h5 className="text-gray-950 font-medium leading-6">
          {user?.fullName || ""}
        </h5>
      </div>

      {/* Menu */}
      {SIDE_MENU_DATA.map((item) => {
        const isActive = location.pathname === item.path;

        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`
              w-full flex items-center gap-4 text-[15px]
              py-3 px-6 rounded-lg mb-3
              transition-all duration-200
              ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"}
            `}
          >
            <item.icon className="text-xl" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default SideMenu;
