import { useState } from "react"; 
import { NavLink } from "react-router-dom";
import { sidebarConfig } from "../config/sidebarConfig";
import type { Role } from "../config/sidebarConfig";
import { ArrowLeftFromLine, ArrowRightFromLine } from "lucide-react";

interface SidebarProps {
  role: Role;
}

const Sidebar = ({ role }: SidebarProps) => {
  const navItems = sidebarConfig[role];
  
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={`h-screen p-2 flex flex-col border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className={`flex items-center p-4 mb-8 ${isCollapsed ? "justify-center" : "justify-between"}`}>
        
        {!isCollapsed && (
          <div className="flex">
            <img src="/company_logo.png" alt="Logo" className="h-15" />
          </div>
        )}
        
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hover:bg-primary p-1.5 rounded-xl hover:cursor-pointer"
        >
          {isCollapsed ? <ArrowRightFromLine size={22} color="#4B5563"/> : <ArrowLeftFromLine size={22} color="#4B5563"/>}
        </button>
      </div>

      <nav className="flex flex-col space-y-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === `/${role}`}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2 rounded-xl transition-colors
                ${isActive 
                  ? "bg-primary text-tertiary" 
                  : "hover:bg-primary hover:text-tertiary text-gray-600"}
              `}
            >
              <Icon size={28} className="shrink-0" />
              
              {!isCollapsed && (
                <span className="text-md font-semibold overflow-hidden">
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;