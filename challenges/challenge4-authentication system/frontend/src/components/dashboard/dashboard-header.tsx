'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from 'next-themes';
import { Shield, Search, Bell, Sun, Moon, LogOut, User, Settings, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-8 justify-between">
        <div className="flex items-center gap-6 md:gap-10 flex-1">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <span className="inline-block font-bold text-lg">INSA Collab</span>
          </Link>
          <div className="hidden md:flex flex-1 max-w-md items-center space-x-2">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search documents..." className="w-full bg-muted/50 pl-9 border-none focus-visible:ring-1 focus-visible:ring-primary" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-muted-foreground hover:text-foreground">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-2">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20 transition-all hover:ring-primary/50">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/dashboard" className="flex items-center cursor-pointer"><LayoutDashboard className="mr-2 h-4 w-4" /><span>Dashboard</span></Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/settings" className="flex items-center cursor-pointer"><Settings className="mr-2 h-4 w-4" /><span>Settings</span></Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/security" className="flex items-center cursor-pointer"><Shield className="mr-2 h-4 w-4" /><span>Security</span></Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer"><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}