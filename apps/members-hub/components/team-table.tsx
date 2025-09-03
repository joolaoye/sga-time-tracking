"use client"

import { useState, useEffect } from "react"
import type { TeamMember } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { createRoleBasedApi } from "@/lib/role-based-api"
import { api } from "@/lib/api"
import { DashboardService } from "@/lib/dashboard-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Eye, Download, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { format, startOfWeek, addDays, addWeeks } from "date-fns"
import { Progress } from "@workspace/ui/components/progress"

// Helper to format seconds as h:m:s
function formatHMS(hours: number) {
  const totalSeconds = Math.round(hours * 3600)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${h}h ${m}m ${s}s`
}

interface TeamTableProps {
  committeeId?: string;
  committeeName?: string;
}

export function TeamTable({ committeeId, committeeName }: TeamTableProps) {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [weeklyTotals, setWeeklyTotals] = useState<Record<string, number>>({})

  useEffect(() => {
    if (user) {
      loadTeamMembers()
    }
  }, [user, committeeId])

  useEffect(() => {
    if (teamMembers.length > 0) {
      loadWeeklyTotals()
    }
    // eslint-disable-next-line
  }, [teamMembers, weekOffset])

  const loadTeamMembers = async () => {
    if (!user) return
    try {
      setError(null)
      // Use direct API call with committee filtering
      const members = await api.getTeamMembers(committeeId)
      setTeamMembers(members)
    } catch (error) {
      console.error("Failed to load team members:", error)
      setError("Failed to load team members. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // For each member, fetch their timesheet and calculate stats using the same method as dashboard
  const loadWeeklyTotals = async () => {
    setWeeklyTotals({})
    const totals: Record<string, number> = {}
    
    await Promise.all(
      teamMembers.map(async (member) => {
        try {
          // Get all time entries for this member (same as dashboard)
          const timeEntriesResp = await api.getMemberTimesheet(member.id)
          const allEntries = Array.isArray(timeEntriesResp) ? timeEntriesResp : (timeEntriesResp as any).results || timeEntriesResp
          
          // Use the exact same calculation as dashboard
          const stats = DashboardService.calculateStats(allEntries, new Date())
          
          totals[member.id] = stats.totalHours
        } catch (e) {
          totals[member.id] = 0
        }
      })
    )
    setWeeklyTotals(totals)
  }

  const handleExportCSV = () => {
    // Prepare CSV header
    let csv = "Name,Target Hours,Time Spent,Progress %\n";
    
    // Add each team member's data
    teamMembers.forEach((member) => {
      const timeSpent = weeklyTotals[member.id] || 0;
      const targetHours = member.target_hours_per_week || 2;
      const progress = Math.min(100, Math.round((timeSpent / targetHours) * 100));
      csv += `"${member.name}","${targetHours}","${formatHMS(timeSpent)}","${progress}%"\n`;
    });
    
    // Create blob and download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    
    // Format filename
    const weekOf = format(weekStart, "MMM_d_yyyy");
    const filename = `team_week_of_${weekOf}.csv`;
    
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // Add week navigation UI
  const weekStart = addWeeks(startOfWeek(new Date()), weekOffset)
  const weekEnd = addDays(weekStart, 6)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={loadTeamMembers} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {committeeName ? `${committeeName} Members` : 
               user?.role === 'admin' ? 'All Team Members' : 'Team Members'}
            </CardTitle>
            <CardDescription>
            Week of {format(weekStart, "MMM d, yyyy")} - {format(weekEnd, "MMM d, yyyy")}
            </CardDescription>
            <div className="flex items-center gap-2 mt-2">
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(weekOffset - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(weekOffset + 1)}
              disabled={weekOffset >= 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Target</TableHead>
              <TableHead className="text-right">Time Spent</TableHead>
              <TableHead className="text-right">Progress</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No team members found
                </TableCell>
              </TableRow>
            ) : (
              teamMembers.map((member) => {
                const timeSpent = weeklyTotals[member.id] || 0
                const targetHours = member.target_hours_per_week || 2
                const progress = Math.min(100, Math.round((timeSpent / targetHours) * 100))
                
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-right">{targetHours}h</TableCell>
                    <TableCell className="text-right">{formatHMS(timeSpent)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-medium">{progress}%</span>
                        <div className="w-16">
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/team/${member.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        <div className="flex gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
