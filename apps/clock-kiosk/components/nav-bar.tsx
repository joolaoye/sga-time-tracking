import { Button } from "@workspace/ui/components/button";
import { LogOut } from "lucide-react";
import type { User } from "@/lib/api";

interface NavBarProps {
  user: User;
  onLogout: () => void;
}

export function NavBar({ user, onLogout }: NavBarProps) {
  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
        </div>
        
        <nav className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.full_name}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="size-9 hover:bg-muted"
              onClick={onLogout}
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}