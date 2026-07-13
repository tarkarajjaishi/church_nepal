import {
  Church, Sunrise, Users, BookOpen, Flower2, HandHelping, Baby, Flame,
  Music, HandHeart, Handshake, Video, GraduationCap, Globe,
  Clock, Shirt, Car, Coffee, Cross, Sparkles, type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  Church, Sunrise, Users, BookOpen, Flower2, HandHelping, Baby, Flame,
  Music, HandHeart, Handshake, Video, GraduationCap, Globe,
  Clock, Shirt, Car, Coffee, Cross, Sparkles,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = map[name] ?? Church;
  return <Cmp className={className} />;
}
