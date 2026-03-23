import { Link } from "react-router-dom";
import { MenuIcon, Share2, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";
import React from "react";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import SideMenu from "./SideMenu";
import CreditsDisplay from "./CreditsDisplay";
import { useContext } from "react";
import { UserCreditsContext } from "../context/UserCreditsContext.jsx";
const NavBar = ({activeMenu}) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);
  const {credits,fetchUserCredits} = useContext(UserCreditsContext);

    useEffect(() => {
      fetchUserCredits;
      },[fetchUserCredits]);
  return (
    <div className="flex items-center justify-between bg-white border-b border-gray-200/50 backdrop-blur-[2px] py-4 px-4 sm:px-7 sticky top-0 z-30">
      
      {/* left side */}
      <div className="flex items-center gap-5 min-w-0">
        <button
          onClick={() => setOpenSideMenu(!openSideMenu)}
          className="lg:hidden text-black hover:bg-gray-100 p-1 rounded transition-colors"
        >
          {openSideMenu ? <X size={22} /> : <MenuIcon size={22} />}
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <Share2 className="text-blue-600" size={22} />
          <span className="text-lg font-medium text-black truncate">
            Cloud Share
          </span>
        </div>
      </div>

      {/* right side */}
      <SignedIn>
      <div className="flex items-center gap-4">
        <Link to="/subscription">
          <CreditsDisplay credits={credits} />
        </Link>
        <div className="relative">
            <UserButton />
        </div>
      </div>
      </SignedIn>   
      {/* mobile side menu */}
        {openSideMenu && (
              <div className="fixed top-[73px] left-0 right-0 bg-white border-b border-gray-200 lg:hidden -20">
                {/* side menu items */}
               <SideMenu activeMenu={activeMenu} />
              </div>
        )}
    </div>
  );
};

export default NavBar;
