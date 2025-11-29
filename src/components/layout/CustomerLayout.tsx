import React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { CustomerSidebar } from "@/components/CustomerSidebar";
import { cn } from "@/lib/utils";
type CustomerLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
};
export function CustomerLayout({ children, container = false, className, contentClassName }: CustomerLayoutProps): JSX.Element {
  return (
    <SidebarProvider defaultOpen={false}>
      <CustomerSidebar />
      <SidebarInset className={className}>
        <div className="absolute left-2 top-2 z-20 md:hidden">
          <SidebarTrigger />
        </div>
        {container ? (
          <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12", contentClassName)}>
            {children}
          </div>
        ) : (
          children
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}