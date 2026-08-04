const fs = require('fs');
const path = require('path');

const dir = 'src/components/dashboard';
fs.mkdirSync(dir, { recursive: true });

const components = {
  'dashboard-header.tsx': `'use client';
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
}`,
  'welcome-hero.tsx': `'use client';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export function WelcomeHero({ firstName, isFirstLogin }: { firstName: string, isFirstLogin: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 space-y-2">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {isFirstLogin ? \`🎉 Welcome to the INSA Summer Camp Collaboration Platform, \${firstName}!\` : \`👋 Welcome back, \${firstName}!\`}
      </h1>
      <p className="text-muted-foreground text-lg">Collaborate, create, and manage documents with your team in real time.</p>
      <div className="pt-4 text-sm font-medium text-muted-foreground">{format(new Date(), 'EEEE, MMMM do, yyyy')} • {format(new Date(), 'h:mm a')}</div>
    </motion.div>
  );
}`,
  'stats-grid.tsx': `'use client';
import { FileText, Users, Clock, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

export function StatsGrid() {
  const stats = [
    { title: 'My Documents', value: '12', icon: FileText, trend: '+2 this week' },
    { title: 'Shared With Me', value: '8', icon: Share2, trend: '3 updated recently' },
    { title: 'Recently Opened', value: '4', icon: Clock, trend: 'Last 24 hours' },
    { title: 'Collaborators', value: '15', icon: Users, trend: '+5 new' },
  ];
  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {stats.map((stat, i) => (
        <motion.div key={i} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}`,
  'document-sections.tsx': `'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { DocumentCard } from './document-card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function DocumentSections() {
  const [activeTab, setActiveTab] = useState<'my-docs' | 'shared' | 'recent'>('my-docs');
  const myDocs = [{ id: '1', title: 'Sprint Planning Q3', lastModified: '2 hours ago', owner: 'Me', status: 'Draft' }, { id: '2', title: 'Architecture Overview', lastModified: 'Yesterday', owner: 'Me', status: 'Final' }];
  const sharedDocs = [{ id: '3', title: 'Weekly Sync Notes', lastModified: '3 hours ago', sharedBy: 'Sarah Connor', permission: 'Editor' }];
  const recentDocs = [...myDocs, ...sharedDocs].sort(() => Math.random() - 0.5);
  const docs = activeTab === 'my-docs' ? myDocs : activeTab === 'shared' ? sharedDocs : recentDocs;

  return (
    <div className="space-y-4 mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[{ id: 'my-docs', label: 'My Documents' }, { id: 'shared', label: 'Shared With Me' }, { id: 'recent', label: 'Recently Opened' }].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={\`px-4 py-2 text-sm font-medium rounded-md transition-all \${activeTab === tab.id ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10'}\`}>{tab.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Filter documents..." className="pl-9 bg-background" />
          </div>
          <Button><PlusCircle className="h-4 w-4 mr-2" />New Document</Button>
        </div>
      </div>
      {docs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc, idx) => <DocumentCard key={doc.id} doc={doc} index={idx} tab={activeTab} />)}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-background/50 text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4"><FileText className="h-10 w-10 text-primary" /></div>
          <h3 className="text-xl font-bold mb-2">No documents yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">Get started by creating your first document and collaborating with your team in real time.</p>
          <Button size="lg"><PlusCircle className="h-5 w-5 mr-2" />Create Your First Document</Button>
        </motion.div>
      )}
    </div>
  );
}`,
  'document-card.tsx': `'use client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, MoreVertical, Clock, Users, Shield } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export function DocumentCard({ doc, index, tab }: { doc: any, index: number, tab: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
      <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/50">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 p-2 rounded-lg mt-1"><FileText className="h-5 w-5 text-primary" /></div>
            <div>
              <CardTitle className="text-base line-clamp-1">{doc.title}</CardTitle>
              <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-2"><Clock className="h-3 w-3" /><span>{doc.lastModified}</span></div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Open in Editor</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex flex-wrap gap-2 mt-2">
            {tab === 'my-docs' && <Badge variant="outline" className="bg-background">{doc.status}</Badge>}
            {tab === 'shared' && <><Badge variant="secondary" className="flex items-center"><Users className="h-3 w-3 mr-1" />{doc.sharedBy}</Badge><Badge variant="outline" className="flex items-center"><Shield className="h-3 w-3 mr-1" />{doc.permission}</Badge></>}
            {tab === 'recent' && <Badge variant="outline">Recent</Badge>}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-3 flex justify-end">
          <Button variant="secondary" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">Open Document</Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}`,
  'activity-timeline.tsx': `'use client';
import { FileText, UserPlus, MessageSquare, History, LogIn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';

export function ActivityTimeline() {
  const activities = [
    { id: 1, title: 'Document Created', desc: 'You created "Sprint Planning"', time: '2 hours ago', icon: FileText, color: 'text-blue-500' },
    { id: 2, title: 'Document Shared', desc: 'Sarah shared "Weekly Notes"', time: '3 hours ago', icon: UserPlus, color: 'text-green-500' },
    { id: 3, title: 'New Login', desc: 'Login from new device', time: '2 days ago', icon: LogIn, color: 'text-red-500' },
  ];
  return (
    <Card className="h-full">
      <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-6">
            {activities.map((activity, i) => (
              <motion.div key={activity.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="relative flex gap-4">
                {i !== activities.length - 1 && <div className="absolute left-4 top-10 bottom-0 w-[2px] -ml-px bg-border" />}
                <div className="relative flex-shrink-0 z-10"><div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border-2 border-background shadow-sm"><activity.icon className={\`h-4 w-4 \${activity.color}\`} /></div></div>
                <div className="flex-1 space-y-1 pb-1"><p className="text-sm font-medium leading-none">{activity.title}</p><p className="text-sm text-muted-foreground">{activity.desc}</p><p className="text-xs text-muted-foreground pt-1">{activity.time}</p></div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}`,
  'profile-summary.tsx': `'use client';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Mail, User, ShieldCheck } from 'lucide-react';

export function ProfileSummary() {
  const { user } = useAuth();
  if (!user) return null;
  const initials = user.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'U';
  return (
    <Card className="overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-primary/40 to-primary/10" />
      <CardContent className="relative pt-0 pb-6">
        <div className="flex justify-center -mt-12 mb-4">
          <Avatar className="h-24 w-24 border-4 border-background shadow-md"><AvatarFallback className="text-2xl bg-muted text-primary">{initials}</AvatarFallback></Avatar>
        </div>
        <div className="text-center space-y-1 mb-6">
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-sm text-muted-foreground flex items-center justify-center"><Mail className="h-3 w-3 mr-1" />{user.email}</p>
          <div className="flex justify-center mt-2"><Badge variant="secondary" className="font-normal">Member</Badge></div>
        </div>
      </CardContent>
    </Card>
  );
}`,
  'security-card.tsx': `'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, MonitorSmartphone, MailCheck, Globe } from 'lucide-react';
import Link from 'next/link';

export function SecurityCard() {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg flex items-center"><Shield className="h-5 w-5 mr-2 text-primary" />Security</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" className="w-full" asChild><Link href="/security">Manage Security</Link></Button>
      </CardContent>
    </Card>
  );
}`,
  'announcement-card.tsx': `'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';

export function AnnouncementCard() {
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center text-primary"><Megaphone className="h-5 w-5 mr-2" />Announcements</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1"><p className="text-sm font-medium">🚀 Week 3 Challenge</p><p className="text-xs text-muted-foreground">Collab engine released.</p></div>
      </CardContent>
    </Card>
  );
}`,
  'right-sidebar.tsx': `'use client';
import { ProfileSummary } from './profile-summary';
import { SecurityCard } from './security-card';
import { AnnouncementCard } from './announcement-card';

export function RightSidebar() {
  return (
    <div className="space-y-6">
      <ProfileSummary />
      <AnnouncementCard />
      <SecurityCard />
    </div>
  );
}`
};

for (const [file, content] of Object.entries(components)) {
  fs.writeFileSync(path.join(dir, file), content, 'utf8');
}
console.log('Created components safely.');
