"use client"

import { useAuth } from "@/contexts/auth-context"
import { SiteHeader } from "@/components/site-header"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@workspace/ui/components/sidebar"

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, loading } = useAuth()

  // Don't render authenticated layout if user is not logged in or still loading
  if (loading || !user) {
    return <>{children}</>
  }

  // Render full authenticated layout with sidebar and header
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset className="flex-1 px-6 py-4">
            {children}
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
} 