"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { TeamTable } from "@/components/team-table"

export default function TeamPage() {
  return (
    <ProtectedRoute requiredRole="chair">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">All Members</h1>
          <p className="text-muted-foreground">
            View and manage timesheets for all members
          </p>
        </div>

        <TeamTable />
      </div>
    </ProtectedRoute>
  )
}
