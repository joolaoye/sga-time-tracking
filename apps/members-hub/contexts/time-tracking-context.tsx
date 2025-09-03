"use client"

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { api } from '@/lib/api'
import { DashboardService } from '@/lib/dashboard-service'
import type { DashboardStats } from '@/lib/dashboard-service'
import type { TimeEntry } from '@/lib/api'

interface TimeTrackingContextType {
  timeEntries: TimeEntry[]
  stats: DashboardStats | null
  displayTicker: number
  activeSession: TimeEntry | null
  displayedHours: number
  loading: boolean
  refreshData: () => Promise<void>
  formatHMS: (hours: number) => string
  getWeeklyHours: (weekOffset?: number) => number
  getHoursForDay: (date: Date) => string
  calculateWeeklyStats: (weekOffset: number, targetHours: number) => WeeklyStats
}

export interface WeeklyStats {
  totalHours: number
  daysWorked: number
  averageDaily: number
  progress: number
  trend: 'up' | 'down' | 'stable'
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined)

export function TimeTrackingProvider({ children }: { children: React.ReactNode }) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [displayTicker, setDisplayTicker] = useState(0)
  const [loading, setLoading] = useState(true)
  const activeSessionRef = useRef<TimeEntry | null>(null)
  const displayIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Single source of "now" for all calculations in a render cycle
  const currentTime = useMemo(() => new Date(), [displayTicker])

  const formatHMS = useCallback((hours: number) => {
    const totalSeconds = Math.round(hours * 3600)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return `${h}h ${m}m ${s}s`
  }, [])

  const refreshData = useCallback(async () => {
    try {
      const response = await api.getTimeEntries()
      const entries = Array.isArray(response) ? response : response.results
      
      // Only update if data has changed
      setTimeEntries(prevEntries => {
        if (JSON.stringify(prevEntries) === JSON.stringify(entries)) {
          return prevEntries
        }
        return entries
      })
      
      // Calculate stats with a consistent timestamp
      const now = new Date()
      const calculatedStats = {
        ...DashboardService.calculateStats(entries, now),
        recentActivity: entries.slice(0, 5),
        weeklyBreakdown: [],
        productivityInsights: []
      }
      
      setStats(prevStats => {
        // Only update if core stats have changed
        if (prevStats) {
          // Compare only the essential fields
          const coreChanged = 
            prevStats.totalHours !== calculatedStats.totalHours ||
            prevStats.daysLogged !== calculatedStats.daysLogged ||
            prevStats.weeklyTrend !== calculatedStats.weeklyTrend
          
          if (!coreChanged) {
            return prevStats
          }
        }
        return calculatedStats
      })
      
      // Handle active session
      const activeEntry = entries.find(e => e.is_active && !e.clock_out)
      const hadActive = activeSessionRef.current !== null
      const hasActive = activeEntry !== null
      
      activeSessionRef.current = activeEntry || null
      
      // Manage display ticker
      if (hasActive && !displayIntervalRef.current) {
        // Reset ticker when starting a new session
        setDisplayTicker(0)
        displayIntervalRef.current = setInterval(() => {
          setDisplayTicker(prev => prev + 1)
        }, 1000)
      } else if (!hasActive && displayIntervalRef.current) {
        clearInterval(displayIntervalRef.current)
        displayIntervalRef.current = null
        setDisplayTicker(0)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Failed to refresh time tracking data:', error)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial load
    refreshData()
    
    // Refresh every 10 seconds to check for changes
    const interval = setInterval(refreshData, 10000)
    
    return () => {
      clearInterval(interval)
      if (displayIntervalRef.current) {
        clearInterval(displayIntervalRef.current)
      }
    }
  }, [refreshData])

  // Centralized function to get weekly hours with real-time updates for active sessions
  const getWeeklyHours = useCallback((weekOffset: number = 0) => {
    const now = currentTime  // Use consistent timestamp
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + (weekOffset * 7))
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    let totalHours = 0
    
    for (const entry of timeEntries) {
      const clockIn = new Date(entry.clock_in)
      const clockOut = entry.clock_out ? new Date(entry.clock_out) : null
      
      if (clockOut) {
        // Completed session: check for overlap with week
        if (clockIn <= weekEnd && clockOut >= weekStart) {
          if (typeof entry.duration === 'number') {
            // For sessions entirely within the week, use full duration
            if (clockIn >= weekStart && clockOut <= weekEnd) {
              totalHours += entry.duration / 3600
            } else {
              // Prorate for sessions spanning multiple weeks
              const overlapStart = clockIn > weekStart ? clockIn : weekStart
              const overlapEnd = clockOut < weekEnd ? clockOut : weekEnd
              const overlapSeconds = (overlapEnd.getTime() - overlapStart.getTime()) / 1000
              const sessionSeconds = entry.duration
              const ratio = overlapSeconds / sessionSeconds
              totalHours += (entry.duration / 3600) * ratio
            }
          }
        }
      } else if (entry.is_active && !entry.clock_out) {
        // Active session: calculate real-time duration
        if (clockIn >= weekStart && clockIn <= weekEnd) {
          const seconds = Math.max(0, (now.getTime() - clockIn.getTime()) / 1000)
          totalHours += seconds / 3600
        }
      }
    }
    
    return Math.round(totalHours * 100) / 100
  }, [timeEntries, currentTime]) // displayTicker ensures updates for active sessions

  // Centralized function to get hours for a specific day
  const getHoursForDay = useCallback((date: Date) => {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    let totalHours = 0
    const now = currentTime  // Use consistent timestamp
    
    for (const entry of timeEntries) {
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
              const sessionSeconds = entry.duration
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
  }, [timeEntries, currentTime, formatHMS]) // displayTicker ensures updates for active sessions

  // Centralized function to calculate weekly stats
  const calculateWeeklyStats = useCallback((weekOffset: number, targetHours: number): WeeklyStats => {
    const now = currentTime  // Use consistent timestamp
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + (weekOffset * 7))
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const totalHours = getWeeklyHours(weekOffset)

    // Calculate unique days worked
    const weekEntries = timeEntries.filter(entry => {
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

    const uniqueDays = new Set(
      weekEntries.map(entry => new Date(entry.clock_in).toDateString())
    )
    const daysWorked = uniqueDays.size
    const averageDaily = daysWorked > 0 ? totalHours / daysWorked : 0
    const progress = (totalHours / targetHours) * 100

    // Calculate trend by comparing with previous week
    const prevWeekHours = getWeeklyHours(weekOffset - 1)
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (totalHours > prevWeekHours + 2) trend = 'up'
    else if (totalHours < prevWeekHours - 2) trend = 'down'

    return {
      totalHours,
      daysWorked,
      averageDaily: Math.round(averageDaily * 100) / 100,
      progress: Math.round(progress),
      trend
    }
  }, [timeEntries, getWeeklyHours, currentTime])

  // Calculate displayed hours using the centralized getWeeklyHours function
  const displayedHours = useMemo(() => {
    // Always use the centralized getWeeklyHours for consistency
    // This ensures dashboard and timesheet show the same values
    return getWeeklyHours(0) // 0 = current week
  }, [getWeeklyHours])

  // Recalculate stats in real-time to include active session updates
  const realtimeStats = useMemo(() => {
    if (!stats) return null
    
    // Recalculate stats with consistent timestamp
    const updatedStats = DashboardService.calculateStats(timeEntries, currentTime)
    
    return {
      ...stats,
      totalHours: updatedStats.totalHours,
      daysLogged: updatedStats.daysLogged,
      weeklyTrend: updatedStats.weeklyTrend,
      averageHoursPerDay: updatedStats.averageHoursPerDay,
      productivityScore: updatedStats.productivityScore
    }
  }, [stats, timeEntries, currentTime])  // Use currentTime instead of displayTicker

  const value = {
    timeEntries,
    stats: realtimeStats || stats, // Use real-time stats when available
    displayTicker,
    activeSession: activeSessionRef.current,
    displayedHours,
    loading,
    refreshData,
    formatHMS,
    getWeeklyHours,
    getHoursForDay,
    calculateWeeklyStats
  }

  return (
    <TimeTrackingContext.Provider value={value}>
      {children}
    </TimeTrackingContext.Provider>
  )
}

export function useTimeTracking() {
  const context = useContext(TimeTrackingContext)
  if (!context) {
    throw new Error('useTimeTracking must be used within TimeTrackingProvider')
  }
  return context
}
