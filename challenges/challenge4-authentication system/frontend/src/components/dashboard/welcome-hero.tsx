'use client';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export function WelcomeHero({ firstName, isFirstLogin }: { firstName: string, isFirstLogin: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 space-y-2">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {isFirstLogin ? `🎉 Welcome to the INSA Summer Camp Collaboration Platform, ${firstName}!` : `👋 Welcome back, ${firstName}!`}
      </h1>
      <p className="text-muted-foreground text-lg">Collaborate, create, and manage documents with your team in real time.</p>
      <div className="pt-4 text-sm font-medium text-muted-foreground">{format(new Date(), 'EEEE, MMMM do, yyyy')} • {format(new Date(), 'h:mm a')}</div>
    </motion.div>
  );
}