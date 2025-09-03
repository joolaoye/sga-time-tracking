"use client"

import { use, useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { TimesheetTable } from "@/components/timesheet-table"
import { Button } from "@workspace/ui/components/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"

interface TeamMemberPageProps {
  params: Promise<{ userId: string }>
}

export default function TeamMemberPage({ params }: TeamMemberPageProps) {
  const { userId } = use(params)
  const [memberName, setMemberName] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMemberName = async () => {
      try {
        // Get all team members to find the one with matching ID
        const teamMembers = await api.getTeamMembers()
        const member = teamMembers.find((m: any) => m.id === userId)
        if (member) {
          setMemberName(member.name)
        } else {
          setMemberName("Unknown Member")
        }
      } catch (error) {
        console.error("Failed to fetch member name:", error)
        setMemberName("Unknown Member")
      } finally {
        setLoading(false)
      }
    }

    fetchMemberName()
  }, [userId])

  return (
    <ProtectedRoute requiredRole="chair">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/team">
              <ArrowLeft />
            </Link>
          </Button>
        </div>

        <TimesheetTable userId={userId} title={`${memberName}'s Timesheet`} />
      </div>
    </ProtectedRoute>
  )
}
