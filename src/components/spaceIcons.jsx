import { Bot, Briefcase, Calculator, Compass, Cpu, Flag, Globe, Heart, Landmark, Layers, Lightbulb, Package, Palette, Rocket, Shield, Ship, Star, Truck, Users, Warehouse, Wrench, Zap } from 'lucide-react'

export const SPACE_ICONS = { Rocket, Briefcase, Compass, Layers, Globe, Zap, Heart, Star, Flag, Cpu, Package, Palette, Shield, Truck, Wrench, Lightbulb, Users, Calculator, Bot, Landmark, Ship, Warehouse }
export const SPACE_TONES = ['blue', 'amber', 'green', 'violet', 'pink', 'teal']

// icons for the spaces that existed before the wizard, by project key
const DEFAULT_ICON = { ACC: 'Calculator', AAC: 'Bot', BLU: 'Layers', EPI: 'Wrench', FLM: 'Heart', HEN: 'Cpu', HRM: 'Users', ICE: 'Shield', ITF: 'Globe', LAT: 'Landmark', MCP: 'Zap', OAS: 'Compass', POR: 'Briefcase', RFM: 'Truck', SAM: 'Flag', SAP: 'Shield', UIX: 'Palette', VFR: 'Ship', WMS: 'Warehouse', WEH: 'Package' }

// Real brand logos (in /public/logos) for the spaces that have one.
const LOGO = { HRM: 'voltuswave.png', VFR: 'voltusfreight.jpg', WEH: 'wehouse.png' }

// A space's icon: the chosen glyph, else a default for its key, else its initials.
export function SpaceGlyph({ p, size = 16 }) {
  const logo = !p.icon && LOGO[p.key]
  if (logo) return <img className="sg-logo" src={`${import.meta.env.BASE_URL}logos/${logo}`} alt="" style={{ width: Math.round(size * 1.5), height: Math.round(size * 1.5) }} />
  const G = SPACE_ICONS[p.icon || DEFAULT_ICON[p.key]]
  return G ? <G size={size} strokeWidth={1.75} aria-hidden="true" /> : <>{p.ini}</>
}
