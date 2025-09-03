"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { TeamTable } from "@/components/team-table"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { useParams } from "next/navigation"

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

export default function CommitteeTeamPage() {
  const params = useParams()
  const committeeId = params.committeeId as string
  const [committee, setCommittee] = useState<Committee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCommittee = async () => {
      try {
        const committees = await api.getMyCommittees()
        const foundCommittee = committees.find((c: Committee) => c.id === parseInt(committeeId))
        
        if (foundCommittee) {
          setCommittee(foundCommittee)
        } else {
          setError("Committee not found or access denied")
        }
      } catch (err) {
        console.error("Failed to load committee:", err)
        setError("Failed to load committee")
      } finally {
        setLoading(false)
      }
    }

    if (committeeId) {
      loadCommittee()
    }
  }, [committeeId])

  if (loading) {
    return (
      <ProtectedRoute requiredRole="chair">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !committee) {
    return (
      <ProtectedRoute requiredRole="chair">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-red-600">Error</h1>
            <p className="text-muted-foreground">{error || "Committee not found"}</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="chair">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{committee.name}</h1>
          <p className="text-muted-foreground">
            View and manage timesheets for {committee.name} committee members
          </p>
        </div>

        <TeamTable 
          committeeId={committeeId} 
          committeeName={committee.name}
        />
      </div>
    </ProtectedRoute>
  )
} 