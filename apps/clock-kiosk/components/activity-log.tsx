"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { TimeEntry, PaginatedResponse } from "@/lib/api"
import { Card, CardHeader, CardContent, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { ChevronLeft, ChevronRight, Activity } from "lucide-react"

interface ActivityEvent {
  type: "Clocked In" | "Clocked Out";
  time: string;
  date: string;
}

const ITEMS_PER_PAGE = 10

export function ActivityLog() {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showAll, setShowAll] = useState(false)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getTimeEntries()
      let entries: TimeEntry[]
      if (Array.isArray(response)) {
        entries = response
      } else {
        entries = (response as PaginatedResponse<TimeEntry>).results || []
      }

      // Transform each log into two events
      const allEvents: ActivityEvent[] = []
      entries.forEach((log) => {
        allEvents.push({
          type: "Clocked In",
          time: log.clock_in,
          date: log.clock_in,
        })
        if (log.clock_out) {
          allEvents.push({
            type: "Clocked Out",
            time: log.clock_out,
            date: log.clock_out,
          })
        }
      })

      // Sort by time (most recent first)
      allEvents.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      setEvents(allEvents)
    } catch (err: any) {
      setError(err.message || "Failed to fetch logs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  // Pagination logic
  const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentEvents = showAll ? events : events.slice(startIndex, endIndex)

  const handleViewAll = () => {
    setShowAll(true)
    setCurrentPage(1)
  }

  const handleViewPaginated = () => {
    setShowAll(false)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-light flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
            Loading...
          </div>
        ) : error ? (
          <div className="text-destructive text-sm mb-2 text-center py-4">{error}</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No activity found
                    </TableCell>
                  </TableRow>
                ) : (
                  currentEvents.map((event, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/50">
                      <TableCell className="text-sm font-medium">
                        {new Date(event.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          event.type === "Clocked In" 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        }`}>
                          {event.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(event.time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {events.length > 0 && (
              <div className="mt-6 flex flex-col gap-4">
                {/* View All / Paginated Toggle */}
                <div className="flex items-center justify-between">
                  {!showAll ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleViewAll}
                      className="flex items-center gap-2"
                    >
                      <Activity className="h-4 w-4" />
                      View All Activity
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleViewPaginated}
                      className="flex items-center gap-2"
                    >
                      Show Recent Only
                    </Button>
                  )}
                  
                  <span className="text-xs text-muted-foreground">
                    {showAll 
                      ? `Showing all ${events.length} activities`
                      : `Showing ${currentEvents.length} of ${events.length} activities`
                    }
                  </span>
                </div>

                {/* Pagination Controls */}
                {!showAll && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="h-8 w-8 p-0"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
