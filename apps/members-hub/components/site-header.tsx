"use client"

import React from "react"
import { SidebarIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { useSidebar } from "@workspace/ui/components/sidebar"

// Helper function to generate breadcrumbs from pathname
function getBreadcrumbs(pathname: string, userRole?: string) {
  const segments = pathname.split('/').filter(Boolean)
  
  if (segments.length === 0 || segments[0] === 'dashboard') {
    return [{ label: 'Navigation' }, { label: 'Dashboard' }]
  }

  const breadcrumbs: { label: string }[] = []
  
  // Build breadcrumbs based on route segments
  if (segments[0] === 'admin') {
    breadcrumbs.push({ label: 'Administration' })
    
    if (segments[1] === 'users') {
      breadcrumbs.push({ label: 'Users' })
    } else if (segments[1] === 'committees') {
      breadcrumbs.push({ label: 'Committees' })
    } else if (segments[1] === 'access-codes') {
      breadcrumbs.push({ label: 'Access Codes' })
    } else if (segments[1] === 'settings') {
      breadcrumbs.push({ label: 'Settings' })
    }
  } else if (segments[0] === 'team') {
    breadcrumbs.push({ label: 'Navigation' })
    breadcrumbs.push({ label: 'Team' })
    
    if (segments[1] === 'committee' && segments[2]) {
      breadcrumbs.push({ label: 'Committee' })
    } else {
      // For /team route (All Members for admin)
      breadcrumbs.push({ label: 'All Members' })
    }
  }
  
  return breadcrumbs
}

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const { user } = useAuth()
  
  const breadcrumbs = getBreadcrumbs(pathname, user?.role)
  const currentPage = breadcrumbs[breadcrumbs.length - 1] || { label: 'Dashboard' }
  const parentCrumbs = breadcrumbs.slice(0, -1)

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            {parentCrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </React.Fragment>
            ))}
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPage.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
