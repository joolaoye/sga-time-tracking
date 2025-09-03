"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

interface ClockStatus {
  is_clocked_in: boolean;
  current_session: any;
  last_activity: any;
}

export function PunchClock({ onClockAction }: { onClockAction?: () => void }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [status, setStatus] = useState<ClockStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch current status on mount and after clock in/out
  const fetchStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getTimeEntries()
      // Handle paginated response from Django REST Framework
      const timeEntries = Array.isArray(response) ? response : response.results
      const activeEntry = timeEntries.find((entry: any) => !entry.clock_out)
      const lastActivity = timeEntries[0] // Most recent entry (first in the list)
      
      setStatus({
        is_clocked_in: !!activeEntry,
        current_session: activeEntry,
        last_activity: lastActivity
      })
    } catch (err: any) {
      setError(err.message || "Failed to fetch status")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    void fetchStatus()
    return () => clearInterval(timer)
  }, [])

  const handleClockIn = async () => {
    setLoading(true)
    setError(null)
    try {
      const newEntry = await api.clockIn()
      // Update status immediately without refetching
      setStatus((prev: ClockStatus | null) => ({
        ...prev,
        is_clocked_in: true,
        current_session: newEntry,
        last_activity: newEntry // This becomes the most recent activity
      }))
      if (onClockAction) onClockAction() // Trigger ActivityLog refresh
    } catch (err: any) {
      setError(err.message || "Clock in failed")
    } finally {
      setLoading(false)
    }
  }

  const handleClockOut = async () => {
    setLoading(true)
    setError(null)
    try {
      const updatedEntry = await api.clockOut()
      // Update status immediately without refetching
      setStatus((prev: ClockStatus | null) => ({
        ...prev,
        is_clocked_in: false,
        current_session: null,
        last_activity: updatedEntry // This becomes the most recent activity
      }))
      if (onClockAction) onClockAction() // Trigger ActivityLog refresh
    } catch (err: any) {
      setError(err.message || "Clock out failed")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  const formatTimeZone = (date: Date) => {
    return date
      .toLocaleTimeString("en-US", {
        timeZoneName: "short",
        hour12: true,
      })
      .split(" ")[2]
  }

  // Last punch info - use the most recent activity
  const lastPunch = status?.last_activity
  const lastPunchTime = lastPunch
    ? new Date(lastPunch.clock_in)
    : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-light">Punch</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Last Punch:</span>{" "}
            {lastPunchTime
              ? `${lastPunchTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} on ${lastPunchTime.toLocaleDateString()}`
              : "No recent punch"}
          </div>
        </div>
        
        {/* Time Display */}
        <div className="text-center py-8">
          <div className="text-6xl font-light mb-2">{formatTime(currentTime)}</div>
          <div className="text-lg">PM, {formatTimeZone(currentTime)}</div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            size="lg"
            className="px-8 bg-transparent"
            onClick={handleClockIn}
            disabled={loading || status?.is_clocked_in}
          >
            Clock In
          </Button>
          <Button
            size="lg"
            className="px-8"
            onClick={handleClockOut}
            disabled={loading || !status?.is_clocked_in}
          >
            Clock Out
          </Button>
        </div>

        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </CardContent>
    </Card>
  )
}


