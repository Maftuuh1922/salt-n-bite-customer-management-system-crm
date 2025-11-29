import React from "react";
import { Home, Users, Tag, Calendar, BarChart2, Settings, LifeBuoy } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
const SaltNSpicesLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
    <path d="M12 6C11.45 6 11 6.45 11 7V11H7C6.45 11 6 11.45 6 12C6 12.55 6.45 13 7 13H11V17C11 17.55 11.45 18 12 18C12.55 18 13 17.55 13 17V13H17C17.55 13 18 12.55 18 12C18 11.45 17.55 11 17 11H13V7C13 6.45 12.55 6 12 6Z" fill="currentColor" fillOpacity="0.6"/>
  </svg>
);
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);
  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-1">
          <div className="h-8 w-8 rounded-lg bg-[#F38020] text-white flex items-center justify-center">
            <SaltNSpicesLogo />
          </div>
          <span className="text-lg font-display font-semibold">Salt N Bite</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === '/dashboard'}>
              <Link to="/dashboard"><Home /> <span>Dashboard</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/customers')}>
              <Link to="/customers/cust_1"><Users /> <span>Customers</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/promos')}>
              <Link to="/promos"><Tag /> <span>Promotions</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#"><Calendar /> <span>Reservations</span></a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#"><BarChart2 /> <span>Reporting</span></a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#"><LifeBuoy /> <span>Support</span></a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="#"><Settings /> <span>Settings</span></a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}