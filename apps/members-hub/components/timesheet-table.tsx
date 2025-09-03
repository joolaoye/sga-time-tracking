"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import type { TimeEntry } from "@/lib/api"
import { api } from "@/lib/api"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Download, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { format, startOfWeek, addDays, addWeeks } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { useTimeTracking, type WeeklyStats } from "@/contexts/time-tracking-context"

interface TimesheetTableProps {
  userId?: string
  title?: string
}

export const TimesheetTable = memo(function TimesheetTable({ userId, title = "Weekly Timesheet" }: TimesheetTableProps) {
  // Get shared time tracking data from context
  const { 
    timeEntries: sharedTimeEntries, 
    displayTicker, 
    formatHMS, 
    loading: contextLoading,
    getWeeklyHours,
    getHoursForDay: getHoursForDayFromContext,
    calculateWeeklyStats: calculateWeeklyStatsFromContext
  } = useTimeTracking()
  const { user } = useAuth()
  
  // Local state for team member view or additional data
  const [memberTimeEntries, setMemberTimeEntries] = useState<TimeEntry[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [loading, setLoading] = useState(false)

  // Use shared entries for current user, or member entries for team view
  const timeEntries = useMemo(() => {
    return userId ? memberTimeEntries : sharedTimeEntries
  }, [userId, memberTimeEntries, sharedTimeEntries])

  // Calculate currentWeekStart and weekDays (memoized)
  const currentWeekStart = useMemo(() => 
    addWeeks(startOfWeek(new Date()), weekOffset), 
    [weekOffset]
  )
  
  const weekDays = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  )

  // Helper function for team member stats calculation (only used when userId is provided)
  const calculateMemberWeeklyStats = useCallback((entries: TimeEntry[], offset: number, targetHours: number): WeeklyStats => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + (offset * 7))
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const weekEntries = entries.filter(entry => {
      const clockIn = new Date(entry.clock_in)
      const clockOut = entry.clock_out ? new Date(entry.clock_out) : null
      if (clockOut) {
        return (clockIn <= weekEnd && clockOut >= weekStart)
      }
      if (entry.is_active && !entry.clock_out) {
        return clockIn >= weekStart && clockIn <= weekEnd
      }
      return false
    })

    const totalHours = weekEntries.reduce((total, entry) => {
      if (entry.clock_in && entry.clock_out && typeof entry.duration === 'number') {
        // Use duration field (in seconds) when available
        return total + (entry.duration / 3600)
      } else if (entry.is_active && !entry.clock_out) {
        // For active sessions, calculate from clock_in to now
        const clockIn = new Date(entry.clock_in)
        const seconds = Math.max(0, (now.getTime() - clockIn.getTime()) / 1000)
        return total + (seconds / 3600)
      }
      return total
    }, 0)

    const uniqueDays = new Set(
      weekEntries.map(entry => new Date(entry.clock_in).toDateString())
    )
    const daysWorked = uniqueDays.size
    const averageDaily = daysWorked > 0 ? totalHours / daysWorked : 0
    const progress = (totalHours / targetHours) * 100

    // Calculate trend
    const prevWeekStart = new Date(weekStart)
    prevWeekStart.setDate(weekStart.getDate() - 7)
    const prevWeekEnd = new Date(weekEnd)
    prevWeekEnd.setDate(weekEnd.getDate() - 7)

    const prevWeekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.clock_in)
      return entryDate >= prevWeekStart && entryDate <= prevWeekEnd
    })

    const prevWeekHours = prevWeekEntries.reduce((sum, entry) => {
      if (entry.duration) {
        return sum + (entry.duration / 3600)
      }
      return sum
    }, 0)

    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (totalHours > prevWeekHours + 2) trend = 'up'
    else if (totalHours < prevWeekHours - 2) trend = 'down'

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      daysWorked,
      averageDaily: Math.round(averageDaily * 100) / 100,
      progress: Math.round(progress),
      trend
    }
  }, [displayTicker]) // Include displayTicker for real-time updates

  // Load member timesheet if userId is provided
  useEffect(() => {
    if (userId) {
      async function loadMemberTimesheet() {
        if (!userId) return
        try {
          setLoading(true)
          const entries = await api.getMemberTimesheet(userId)
          setMemberTimeEntries(entries)
        } catch (error) {
          console.error('Failed to load member timesheet:', error)
        } finally {
          setLoading(false)
        }
      }
      loadMemberTimesheet()
    }
  }, [userId])

  // Calculate stats when data or week changes
  useEffect(() => {
    const targetHours = user?.target_hours_per_week || 2
    
    if (userId) {
      // For team member view, use local calculation with member entries
      const stats = calculateMemberWeeklyStats(memberTimeEntries, weekOffset, targetHours)
      setWeeklyStats(stats)
    } else {
      // For current user, use centralized calculation from context
      const stats = calculateWeeklyStatsFromContext(weekOffset, targetHours)
      setWeeklyStats(stats)
    }
  }, [timeEntries, memberTimeEntries, weekOffset, user?.target_hours_per_week, calculateMemberWeeklyStats, calculateWeeklyStatsFromContext, displayTicker, userId]) // Include displayTicker to update on active session changes

  // Get hours for a specific day - updates with displayTicker for active sessions
  const getHoursForDay = useCallback((date: Date) => {
    if (!userId) {
      // For current user, use centralized function from context
      return getHoursForDayFromContext(date)
    }
    
    // For team member view, calculate locally with member entries
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    let totalHours = 0
    const now = new Date() // Recalculate now for active sessions
    
    for (const entry of memberTimeEntries) {
      const clockIn = new Date(entry.clock_in)
      const clockOut = entry.clock_out ? new Date(entry.clock_out) : null

      if (clockIn <= dayEnd && (!clockOut || clockOut >= dayStart)) {
        const overlapStart = clockIn > dayStart ? clockIn : dayStart
        const overlapEnd = clockOut ? (clockOut < dayEnd ? clockOut : dayEnd) : dayEnd
        
        if (overlapStart < overlapEnd) {
          if (entry.clock_in && entry.clock_out && typeof entry.duration === 'number' && clockOut) {
            // Use the API's duration for completed sessions
            if (clockIn >= dayStart && clockOut <= dayEnd) {
              totalHours += entry.duration / 3600
            } else {
              // Prorate if session spans multiple days
              const sessionSeconds = entry.duration  // duration is already in seconds
              const overlapSeconds = (overlapEnd.getTime() - overlapStart.getTime()) / 1000
              const ratio = overlapSeconds / sessionSeconds
              totalHours += (entry.duration / 3600) * ratio
            }
          } else if (entry.is_active && !entry.clock_out) {
            // For active sessions, calculate real-time duration
            const overlapEndNow = now < dayEnd ? now : dayEnd
            const seconds = Math.max(0, (overlapEndNow.getTime() - overlapStart.getTime()) / 1000)
            totalHours += seconds / 3600
          }
        }
      }
    }
    
    return formatHMS(totalHours)
  }, [userId, memberTimeEntries, getHoursForDayFromContext, displayTicker, formatHMS]) // displayTicker ensures updates for active sessions

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const handleExportCSV = useCallback(() => {
    // Prepare CSV header
    let csv = "Day,Date,Daily Time Spent\n";
    weekDays.forEach((day) => {
      csv += `${format(day, "EEEE")},${format(day, "MMM d yyyy")},${getHoursForDay(day)}\n`;
    });
    // Create blob and download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    // Format filename
    const weekOf = format(currentWeekStart, "MMM_d_yyyy");
    
    // Use team member's name if viewing their timesheet, otherwise use current user's name
    let safeName = "user";
    
    if (userId && title && title.includes("'s Timesheet")) {
      // Viewing a team member's timesheet - extract name from title
      const memberName = title.replace("'s Timesheet", "");
      safeName = memberName.replace(/\s+/g, "_");
    } else if (user?.name) {
      // Viewing own timesheet - use current user's name
      safeName = user.name.replace(/\s+/g, "_");
    }
    
    const filename = `${safeName}_timesheet_week_of_${weekOf}.csv`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, [currentWeekStart, weekDays, getHoursForDay, user?.name, userId, title])

  // Show loading state
  const isLoading = userId ? loading : contextLoading

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
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
              {title}
            </CardTitle>
            <CardDescription>
              Week of {format(currentWeekStart, "MMM d, yyyy")}
            </CardDescription>
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
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Daily Time Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weekDays.map((day) => (
                <TableRow key={day.toISOString()}>
                  <TableCell className="font-medium">{format(day, "EEEE")}</TableCell>
                  <TableCell>{format(day, "MMM d")}</TableCell>
                  <TableCell className="text-right">{getHoursForDay(day)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return prevProps.userId === nextProps.userId && prevProps.title === nextProps.title
})