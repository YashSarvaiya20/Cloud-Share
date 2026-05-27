import { Link } from "react-router-dom";
import { MenuIcon, Moon, Share2, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import React from "react";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import SideMenu from "./SideMenu";
import CreditsDisplay from "./CreditsDisplay";
import { useContext } from "react";
import { UserCreditsContext } from "../context/UserCreditsContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
const NavBar = ({activeMenu}) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);
  const {credits,fetchUserCredits} = useContext(UserCreditsContext);
  const { isDark, toggleTheme } = useTheme();
  const headerClass = isDark
    ? "sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 px-4 py-3 backdrop-blur-xl md:px-6"
    : "sticky top-0 z-40 border-b border-white/50 bg-white/70 px-4 py-3 backdrop-blur-xl md:px-6";
  const iconButtonClass = isDark
    ? "rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-100 transition-colors hover:bg-slate-800"
    : "rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition-colors hover:bg-slate-50";
  const userWrapClass = isDark
    ? "rounded-full border border-slate-700 bg-slate-900 p-1.5 shadow-sm"
    : "rounded-full border border-slate-200 bg-white p-1.5 shadow-sm";

    useEffect(() => {
      fetchUserCredits();
      },[fetchUserCredits]);

  useEffect(() => {
    document.body.style.overflow = openSideMenu ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [openSideMenu]);

  return (
    <header className={headerClass}>
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        <button
          onClick={() => setOpenSideMenu(!openSideMenu)}
          className={`${iconButtonClass} lg:hidden`}
          aria-label="Toggle menu"
        >
          {openSideMenu ? <X size={22} /> : <MenuIcon size={22} />}
        </button>

        <Link to="/dashboard" className="group flex min-w-0 items-center gap-2.5">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 p-2 text-white shadow-lg shadow-indigo-500/30 transition-transform duration-200 group-hover:scale-105">
            <Share2 size={16} />
          </div>
          <span className={`truncate text-lg font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Cloud Share
          </span>
        </Link>
      </div>

      <SignedIn>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className={iconButtonClass}
          aria-label="Toggle theme"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <Link to="/subscription" className="hidden sm:block">
          <CreditsDisplay credits={credits} />
        </Link>
        <div className={userWrapClass}>
            <UserButton />
        </div>
      </div>
      </SignedIn>   

        {openSideMenu && (
              <>
                <button
                  className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
                  onClick={() => setOpenSideMenu(false)}
                  aria-label="Close menu overlay"
                />
                <div className="fixed left-0 top-[65px] z-40 h-[calc(100vh-65px)] w-[86%] max-w-[320px] lg:hidden">
                  <SideMenu activeMenu={activeMenu} isMobile onNavigate={() => setOpenSideMenu(false)} />
                </div>
              </>
        )}
      </div>
    </header>
  );
};

export default NavBar;
