"use client"

import { useAuth } from "@/contexts/auth-context"
import { AuthService } from "@/lib/auth"
import { api } from "@/lib/api"
import { Home, LogOut, Settings, Users, Building2, Key, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@workspace/ui/components/sidebar"
import { Button } from "@workspace/ui/components/button"
import { NavUser } from "@/components/nav-user"

interface Committee {
  id: number;
  name: string;
  chair?: {
    id: number;
    name: string;
    role: string;
  };
  members: Array<{
    id: number;
    name: string;
    role: string;
  }>;
  member_count: number;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  permissions?: string[];
  items?: NavItem[];
}

const baseNavigationItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    permissions: [AuthService.PERMISSIONS.TIME_TRACKING.VIEW_OWN_LOGS],
  }
]

const adminItems: NavItem[] = [
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
    permissions: [AuthService.PERMISSIONS.ADMIN.MANAGE_USERS],
  },
  {
    title: "Committees",
    url: "/admin/committees",
    icon: Building2,
    permissions: [AuthService.PERMISSIONS.ADMIN.MANAGE_COMMITTEES],
  },
  {
    title: "Access Codes",
    url: "/admin/access-codes",
    icon: Key,
    permissions: [AuthService.PERMISSIONS.ADMIN.MANAGE_ACCESS_CODES],
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
    permissions: [AuthService.PERMISSIONS.ADMIN.VIEW_SYSTEM_STATS],
  },
]

export function AppSidebar() {
  const { user, logout, loading } = useAuth()
  const pathname = usePathname()
  const [committees, setCommittees] = useState<Committee[]>([])
  const [navigationItems, setNavigationItems] = useState<NavItem[]>(baseNavigationItems)
  const [teamExpanded, setTeamExpanded] = useState(false)

  // Auto-expand team menu when user is on a team-related page
  useEffect(() => {
    if (pathname.startsWith('/team')) {
      setTeamExpanded(true)
    }
  }, [pathname])

  // Load committees and build navigation
  useEffect(() => {
    if (!user) return
    
    const buildNavigation = async () => {
      let teamNavItem: NavItem | null = null
      
      if (user.role === 'admin') {
        teamNavItem = {
          title: "Team",
          url: "/team",
          icon: Users,
          permissions: [AuthService.PERMISSIONS.TEAM_MANAGEMENT.VIEW_TEAM],
          items: [
            {
              title: "All Members",
              url: "/team",
              icon: Users,
            }
          ]
        }
      } else if (user.role === 'chair') {
        try {
          const userCommittees = await api.getMyCommittees()
          // Sort committees by name for consistent navigation ordering
          const sortedCommittees = [...userCommittees].sort((a, b) => a.name.localeCompare(b.name))
          setCommittees(sortedCommittees)
          
          if (sortedCommittees.length > 0) {
            teamNavItem = {
              title: "Team",
              url: "/team",
              icon: Users,
              permissions: [AuthService.PERMISSIONS.TEAM_MANAGEMENT.VIEW_TEAM],
              items: sortedCommittees.map((committee: Committee) => ({
                title: committee.name,
                url: `/team/committee/${committee.id}`,
                icon: Building2,
              }))
            }
          }
        } catch (error) {
          console.error("Failed to load committees:", error)
        }
      }
      
      // Build final navigation items
      const finalNavItems = [...baseNavigationItems]
      if (teamNavItem) {
        finalNavItems.push(teamNavItem)
      }
      
      setNavigationItems(finalNavItems)
    }
    
    buildNavigation()
  }, [user])

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <Sidebar>
        <SidebarContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        </SidebarContent>
      </Sidebar>
    )
  }

  // Don't show sidebar if user is not authenticated
  if (!user) return null

  // Filter navigation items based on user permissions
  const filteredNavItems = navigationItems.filter((item: NavItem) => {
    const hasPermission = !item.permissions || AuthService.hasAllPermissions(user.role, item.permissions)
    return hasPermission
  })

  // Filter admin items based on user permissions
  const filteredAdminItems = adminItems.filter((item: NavItem) => {
    const hasPermission = !item.permissions || AuthService.hasAllPermissions(user.role, item.permissions)
    return hasPermission
  })
  
  const handleLogout = async () => {
    await logout()
  }

  return (
    <Sidebar className="top-(--header-height) h-[calc(100svh-var(--header-height))]!">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items && item.items.length > 0 ? (
                    // Collapsible menu item with sub-items
                    <>
                      <SidebarMenuButton 
                        onClick={() => setTeamExpanded(!teamExpanded)}
                        isActive={false}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {teamExpanded ? (
                          <ChevronDown className="ml-auto h-4 w-4" />
                        ) : (
                          <ChevronRight className="ml-auto h-4 w-4" />
                        )}
                      </SidebarMenuButton>
                      {teamExpanded && (
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                <Link href={subItem.url}>
                                  <subItem.icon className="h-4 w-4" />
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </>
                  ) : (
                    // Regular menu item
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredAdminItems.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredAdminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname === item.url}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <NavUser
          user={{
            name: user.name,
            avatar: ""
          }}
        />
        <Button variant="ghost" size="sm" className="w-full flex items-center justify-start gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
