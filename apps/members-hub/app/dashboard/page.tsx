"use client"

import { useAuth } from "@/contexts/auth-context"
import { useTimeTracking } from "@/contexts/time-tracking-context"
import { ProtectedRoute } from "@/components/protected-route"
import { TimesheetTable } from "@/components/timesheet-table"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Clock, Calendar, TrendingUp, Users, Key, Settings, Building2, UserPlus, BarChart3 } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { Progress } from "@workspace/ui/components/progress"
import { api } from "@/lib/api"
import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"

export default function DashboardPage() {
  const { user } = useAuth()
  const { stats, displayedHours, formatHMS, loading, displayTicker } = useTimeTracking()
  const [localStats, setLocalStats] = useState(stats)
  const [adminStats, setAdminStats] = useState<{
    totalUsers: number
    totalCommittees: number
    recentAccessCodes: number
  } | null>(null)
  const [chairStats, setChairStats] = useState<{
    myCommittees: any[]
    totalTeamMembers: number
  } | null>(null)

  // Fetch role-specific data
  useEffect(() => {
    async function fetchRoleData() {
      if (user?.role === 'admin') {
        try {
          const [users, committees] = await Promise.all([
            api.getAllUsers(),
            api.getCommittees()
          ])
          
          // Handle both array and paginated response formats
          const userCount = Array.isArray(users) ? users.length : (users as any)?.results?.length || 0
          const committeeCount = Array.isArray(committees) ? committees.length : (committees as any)?.results?.length || 0
          
          setAdminStats({
            totalUsers: userCount,
            totalCommittees: committeeCount,
            recentAccessCodes: 0
          })
        } catch (error) {
          console.error("Failed to load admin stats:", error)
          setAdminStats({
            totalUsers: 0,
            totalCommittees: 0,
            recentAccessCodes: 0
          })
        }
      } else if (user?.role === 'chair') {
        try {
          const [myCommittees, teamMembers] = await Promise.all([
            api.getMyCommittees(),
            api.getTeamMembers()
          ])
          // Sort committees by name for consistent ordering
          const sortedCommittees = Array.isArray(myCommittees) ? [...myCommittees].sort((a, b) => a.name.localeCompare(b.name)) : []
          setChairStats({
            myCommittees: sortedCommittees,
            totalTeamMembers: Array.isArray(teamMembers) ? teamMembers.length : 0
          })
        } catch (error) {
          console.error("Failed to load chair stats:", error)
        }
      }
    }
    
    fetchRoleData()
  }, [user])

  // Calculate weekly target progress using displayed hours (includes active session)
  const weeklyTarget = user?.target_hours_per_week || 2 // Default to 2 hours if not available
  const progress = useMemo(() => 
    localStats ? Math.min(100, Math.round((displayedHours / weeklyTarget) * 100)) : 0,
    [displayedHours, weeklyTarget, localStats]
  )

  useEffect(() => {
    setLocalStats(stats)
  }, [stats, displayTicker])

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground">
            {user?.role === 'admin' && "Manage your organization and track system performance"}
            {user?.role === 'chair' && "Oversee your teams and track member progress"}
            {user?.role === 'member' && "Track your time and monitor your productivity"}
          </p>
        </div>

        {/* Time Tracking Stats - For All Users */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Spent This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{localStats ? formatHMS(displayedHours) : "--"}</div>
              <p className="text-xs text-muted-foreground">+{localStats ? (localStats.weeklyTrend === 'up' ? 'Up' : localStats.weeklyTrend === 'down' ? 'Down' : 'No change') : "--"} from last week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Days Logged</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{localStats ? localStats.daysLogged : "--"}</div>
              <p className="text-xs text-muted-foreground">Out of 7 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Target</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progress}%</div>
              <Progress value={progress} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-2">Target: {weeklyTarget}h</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin-Specific Dashboard */}
        {user?.role === 'admin' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Administration Overview</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{adminStats?.totalUsers || "--"}</div>
                    <Button asChild variant="outline" size="sm" className="mt-2">
                      <Link href="/admin/users">Manage Users</Link>
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Committees</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{adminStats?.totalCommittees || "--"}</div>
                    <Button asChild variant="outline" size="sm" className="mt-2">
                      <Link href="/admin/committees">Manage Committees</Link>
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Access Codes</CardTitle>
                    <Key className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Active</div>
                    <Button asChild variant="outline" size="sm" className="mt-2">
                      <Link href="/admin/access-codes">Manage Access</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Admin Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/users">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/committees">
                      <Building2 className="h-4 w-4 mr-2" />
                      Create Committee
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      System Settings
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chair-Specific Dashboard */}
        {user?.role === 'chair' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Team Management</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">My Committees</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{chairStats?.myCommittees.length || 0}</div>
                    <div className="mt-2 space-y-1">
                      {chairStats?.myCommittees.map((committee) => (
                        <Badge key={committee.id} variant="outline" className="mr-1">
                          {committee.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{chairStats?.totalTeamMembers || "--"}</div>
                    <Button asChild variant="outline" size="sm" className="mt-2">
                      <Link href="/team">View Team</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {chairStats?.myCommittees && chairStats.myCommittees.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Committee Quick Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {chairStats.myCommittees.map((committee) => (
                      <div key={committee.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{committee.name}</span>
                          <p className="text-sm text-muted-foreground">
                            {committee.member_count} members
                          </p>
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/team/committee/${committee.id}`}>
                            <Users className="h-4 w-4 mr-2" />
                            View Team
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <TimesheetTable />
      </div>
    </ProtectedRoute>
  )
}
