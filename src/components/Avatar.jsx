import { Avatar as ShAvatar, AvatarFallback, AvatarGroup as ShAvatarGroup, AvatarGroupCount, AvatarImage } from '@/components/ui/avatar'
import { Plus } from 'lucide-react'
import './avatar.css'
import { photoOf } from './avatarPhotos'

// Tint pairs (background, initials colour): strong enough to read, distinct per person.
const TINTS = [['#F4C7C3', '#8A2C25'], ['#C3D5F3', '#1E4F9C'], ['#CFE5BC', '#3B6A1D'], ['#F2DDA6', '#7A5410'], ['#DCC8F0', '#5B2C95'], ['#B9E4DE', '#146C61']]
const tint = (name) => TINTS[[...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length]
const initialsOf = (name) => String(name).replace(/\(.*\)/, '').trim().split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase()

// shadcn <Avatar> + <AvatarImage> + <AvatarFallback>. With no `src` the fallback is the person's initials on a tint.
// `online` adds a status dot. Sizes: xs 24 · sm 32 · md 40 · lg 48 · xl 56 · 2xl 64.
export default function Avatar({ name = '', src, size = 32, online, className = '' }) {
  const photo = src ?? photoOf(name)
  return (
    <ShAvatar className={`uav ${className}`} style={{ width: size, height: size }} aria-label={name || undefined}>
      {photo && <AvatarImage src={photo} alt={name} />}
      <AvatarFallback className="uav-fb" style={{ background: tint(name)[0], color: tint(name)[1], fontSize: Math.max(9, Math.round(size * 0.38)) }}>{initialsOf(name) || '?'}</AvatarFallback>
      {online !== undefined && <i className={`uav-dot${online ? ' on' : ''}`} style={{ width: Math.max(8, size / 4), height: Math.max(8, size / 4) }} aria-hidden="true" />}
    </ShAvatar>
  )
}

// shadcn <AvatarGroup>: overlapping avatars with a ring, then an <AvatarGroupCount> "+N".
// names: people to show. max: how many avatars before the counter. total: real headcount if larger than names.
export function AvatarGroup({ names, max = 4, size = 32, total, grayscale = false, onAdd, addLabel = 'Add people', className = '' }) {
  const shown = names.slice(0, max)
  const more = (total ?? names.length) - shown.length
  return (
    <ShAvatarGroup className={`uag${grayscale ? ' grayscale' : ''} ${className}`} role="group" aria-label={`${total ?? names.length} people`}>
      {shown.map((n) => <Avatar key={n} name={n} size={size} />)}
      {more > 0 && <AvatarGroupCount className="uag-more" style={{ width: size, height: size, fontSize: Math.round(size * 0.375) }}>+{more}</AvatarGroupCount>}
      {onAdd && <AvatarGroupCount className="uag-more uag-add" style={{ width: size, height: size }} render={<button type="button" aria-label={addLabel} title={addLabel} onClick={onAdd} />}><Plus size={Math.round(size * 0.5)} strokeWidth={1.75} /></AvatarGroupCount>}
    </ShAvatarGroup>
  )
}
