// The icons the system uses, from the Lucide set. Importing them one by one lets bundlers drop the rest.
import {
  ArrowDown, ArrowLeftRight, ArrowUp, Check, ChartLine, ChevronDown, ChevronLeft, Download, GitBranch, Info, LayoutGrid,
  ExternalLink, MapPin, Menu, MessageSquare, Search, SendHorizontal, SlidersHorizontal, Square, Table, Table2, TrendingUp, TriangleAlert, X,
} from 'lucide-react';

export const icons = {
  overview: LayoutGrid,
  country: MapPin,
  historical: ChartLine,
  forecasts: TrendingUp,
  scenarios: GitBranch,
  explorer: Table2,
  ask: MessageSquare,
  collapse: ChevronLeft,
  up: ArrowUp,
  down: ArrowDown,
  info: Info,
  warning: TriangleAlert,
  chevron: ChevronDown,
  table: Table,
  download: Download,
  menu: Menu,
  filters: SlidersHorizontal,
  switcher: ArrowLeftRight,
  close: X,
  check: Check,
  external: ExternalLink,
  search: Search,
  send: SendHorizontal,
  stop: Square,
} as const;

export type IconName = keyof typeof icons;
