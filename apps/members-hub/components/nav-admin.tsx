"use client"

import { Building2, Key, Settings, Users } from "lucide-react"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@workspace/ui/components/sidebar"

const adminItems = [
    {
      title: "Users",
      url: "/admin/users",
      icon: Users,
    },
    {
              title: "Committees",
        url: "/admin/committees",
      icon: Building2,
    },
    {
      title: "Access Codes",
      url: "/admin/access-codes",
      icon: Key,
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings,
    },
  ]

export function NavAdmin() {
    return (
        <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
                <SidebarMenu>
                    {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                        <a href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                        </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
    )
}