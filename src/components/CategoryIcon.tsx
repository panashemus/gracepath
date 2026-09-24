import {
  HandCoins, Waves, HeartPulse, Users, Compass, Briefcase,
  Bird, Flame, type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  HandCoins,
  Waves,
  HeartPulse,
  Users,
  Compass,
  Briefcase,
  Bird,
  Flame,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Waves;
  return <Icon className={className} />;
}
