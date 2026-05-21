import React from 'react';
import { useUser } from '@clerk/clerk-react';
import NavBar from '../components/NavBar';
import SideMenu from '../components/SideMenu';

const DashboardLayout = ({children,activeMenu}) => {
    const {user}=useUser();
  return (
    <div className="app-shell-bg min-h-screen">
        <NavBar activeMenu={activeMenu} />
        {user && (
            <div className="mx-auto flex w-full max-w-[1440px] gap-4 px-4 pb-6 pt-4 md:px-6 md:pt-6">
                <div className="hidden lg:block">
                  <SideMenu activeMenu={activeMenu} />
                </div>
                <main className="min-w-0 flex-1">{children}</main>
            </div>
        )}
    </div>
  );
}
export default DashboardLayout;