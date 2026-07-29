'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { api, SecurityDashboard } from '@/lib/api';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen, Trophy, Megaphone, FolderOpen, Users,
  ShieldCheck, ArrowRight, CheckCircle2, Clock,
  MapPin, Monitor, Mail, Star, Cpu, Bell,
  TrendingUp, Award, Calendar, Zap, ChevronRight,
  UserCircle, Globe, KeyRound,
} from 'lucide-react';
