'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from 'next-themes';
import { Shield, Search, Bell, Sun, Moon, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-5xl mx-auto flex h-14 items-center px-4 md:px-0 justify-between">
        <div className="flex items-center gap-6 md:gap-8 flex-1">
          <Link href="/dashboard" className="flex items-center space-x-2.5 transition-opacity hover:opacity-80">
            <div className="bg-foreground p-1.5 rounded-md flex items-center justify-center">
              <Shield className="h-4 w-4 text-background" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-sm tracking-tight text-foreground">CollabDocs</span>
          </Link>
          <div className="hidden md:flex flex-1 max-w-sm items-center space-x-2">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input type="search" placeholder="Search..." className="w-full h-8 bg-muted/40 hover:bg-muted/60 pl-8 border-transparent focus-visible:ring-1 focus-visible:ring-ring text-sm transition-colors rounded-md" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex h-8 w-8 text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-1 p-0 overflow-hidden outline-none ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-muted text-foreground font-medium text-xs border">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal px-2 py-1.5">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none tracking-tight">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer"><Link href="/dashboard" className="flex items-center"><LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" /><span>Dashboard</span></Link></DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer"><Link href="/settings" className="flex items-center"><Settings className="mr-2 h-4 w-4 text-muted-foreground" /><span>Settings</span></Link></DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer"><Link href="/security" className="flex items-center"><Shield className="mr-2 h-4 w-4 text-muted-foreground" /><span>Security</span></Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}