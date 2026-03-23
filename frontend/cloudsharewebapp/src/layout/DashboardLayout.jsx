import React from 'react';
import { useUser } from '@clerk/clerk-react';
import NavBar from '../components/NavBar';
import SideMenu from '../components/SideMenu';

const DashboardLayout = ({children,activeMenu}) => {
    const {user}=useUser();
  return (
    <div>
        {/* navnavbar */}
        <NavBar activeMenu={activeMenu} />
        {user && (
            <div className="flex">
                <div className="max-[1080px]:hidden">
                    {/* sidemenu */}
                  <SideMenu activeMenu={activeMenu} />
                </div>
                <div className="grow mx-5">{children}</div>
            </div>
        )}
    </div>
  );
}
export default DashboardLayout;