'use client';
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
}