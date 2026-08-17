declare module 'lucide-react' {
  import * as React from 'react'

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number
    color?: string
    strokeWidth?: string | number
    className?: string
  }

  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >

  export type Icon = LucideIcon

  export const Play: LucideIcon
  export const Pause: LucideIcon
  export const Heart: LucideIcon
  export const Bookmark: LucideIcon
  export const Star: LucideIcon
  export const Flame: LucideIcon
  export const Search: LucideIcon
  export const SearchX: LucideIcon
  export const SlidersHorizontal: LucideIcon
  export const Filter: LucideIcon
  export const Mic: LucideIcon
  export const MicOff: LucideIcon
  export const Volume2: LucideIcon
  export const VolumeX: LucideIcon
  export const Maximize: LucideIcon
  export const Minimize: LucideIcon
  export const SkipForward: LucideIcon
  export const SkipBack: LucideIcon
  export const RotateCcw: LucideIcon
  export const Clapperboard: LucideIcon
  export const Film: LucideIcon
  export const Tv: LucideIcon
  export const TvMinimal: LucideIcon
  export const Clock: LucideIcon
  export const Calendar: LucideIcon
  export const User: LucideIcon
  export const Users: LucideIcon
  export const LogOut: LucideIcon
  export const Settings: LucideIcon
  export const Shield: LucideIcon
  export const ShieldAlert: LucideIcon
  export const ShieldCheck: LucideIcon
  export const LayoutDashboard: LucideIcon
  export const MessageCircle: LucideIcon
  export const MessageSquare: LucideIcon
  export const Send: LucideIcon
  export const Trash2: LucideIcon
  export const Edit3: LucideIcon
  export const Pencil: LucideIcon
  export const Plus: LucideIcon
  export const X: LucideIcon
  export const Check: LucideIcon
  export const CheckCircle2: LucideIcon
  export const AlertCircle: LucideIcon
  export const ArrowLeft: LucideIcon
  export const ArrowRight: LucideIcon
  export const ArrowUpRight: LucideIcon
  export const ChevronRight: LucideIcon
  export const ChevronLeft: LucideIcon
  export const ChevronDown: LucideIcon
  export const ChevronUp: LucideIcon
  export const Sparkles: LucideIcon
  export const Bot: LucideIcon
  export const Bell: LucideIcon
  export const Moon: LucideIcon
  export const Sun: LucideIcon
  export const Home: LucideIcon
  export const Layers: LucideIcon
  export const Upload: LucideIcon
  export const Loader2: LucideIcon
  export const LoaderCircle: LucideIcon
  export const Activity: LucideIcon
  export const Terminal: LucideIcon
  export const KeyRound: LucideIcon
  export const Mail: LucideIcon
  export const SortAsc: LucideIcon

  const icons: { [key: string]: LucideIcon }
  export default icons
}
