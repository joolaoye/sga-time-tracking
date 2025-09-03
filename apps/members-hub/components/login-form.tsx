"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { useAuth } from "@/contexts/auth-context"

interface LoginFormProps {
  onLogin?: (accessCode: string) => Promise<void>
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const { login } = useAuth()
  const [accessCode, setAccessCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Basic MVP validation
    if (!accessCode.trim()) {
      setError("Please enter an access code.")
      setIsLoading(false)
      return
    }

    if (!/^\d{6}$/.test(accessCode.trim())) {
      setError("Access code must be exactly 6 digits.")
      setIsLoading(false)
      return
    }

    try {
      // Use the provided onLogin callback or fall back to auth context
      if (onLogin) {
        await onLogin(accessCode)
      } else {
        await login(accessCode)
      }
    } catch (error) {
      // Provide specific error messages for MVP scenarios
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          setError("Network error. Please check your connection.")
        } else if (error.message.includes('Invalid credentials')) {
          setError("Invalid access code. Please try again.")
        } else if (error.message.includes('500')) {
          setError("Server error. Please try again later.")
        } else {
          setError("Login failed. Please try again.")
        }
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Enter access code"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          disabled={isLoading}
        />
      </div>
      {error && (
        <div className="text-sm text-red-600 text-center">{error}</div>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Signing in...
          </div>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  )
}
