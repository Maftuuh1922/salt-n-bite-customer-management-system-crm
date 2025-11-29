import React from "react";
import { User, Calendar, Gift, LogOut, LayoutDashboard } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, setAuthToken } from "@/lib/auth";
const SaltNSpicesLogo = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
      <path d="M12 6C11.45 6 11 6.45 11 7V11H7C6.45 11 6 11.45 6 12C6 12.55 6.45 13 7 13H11V17C11 17.55 11.45 18 12 18C12.55 18 13 17.55 13 17V13H17C17.55 13 18 12.55 18 12C18 11.45 17.55 11 17 11H13V7C13 6.45 12.55 6 12 6Z" fill="currentColor" fillOpacity="0.8"/>
    </svg>
  );
export function CustomerSidebar(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCustomer } = useAuth();
  const handleLogout = () => {
    setAuthToken(null);
    navigate('/customer/login');
  };
  if (!isCustomer) return <></>;
  const isActive = (path: string) => location.pathname === path;
  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/customer/dashboard" className="flex items-center gap-2 px-2 py-1">
          <div className="h-8 w-8 rounded-lg bg-[#F38020] flex items-center justify-center">
            <SaltNSpicesLogo />
          </div>
          <span className="text-lg font-display font-semibold">My Salt N Bite</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/customer/dashboard')}>
              <Link to="/customer/dashboard"><LayoutDashboard /> <span>Dashboard</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/customer/profile')}>
              <Link to="/customer/profile"><User /> <span>Profile</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/customer/reservations')}>
              <Link to="/customer/reservations"><Calendar /> <span>Reservations</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/customer/promos')}>
              <Link to="/customer/promos"><Gift /> <span>Promos & Points</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut /> <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}