import { useRef, useState } from 'react'
import { ArrowDown, ChevronDown, ArrowUp, ImagePlus, RotateCcw, Trash2, Upload } from 'lucide-react'
import { toast } from '@/components/toast'
import { LAYOUTS, INTERVALS, MAX_SLIDES, TRANSITIONS, addSlide, moveSlide, readImage, removeSlide, replaceSlide, resetBranding, setBranding, useBranding } from './branding'
import './branding.css'

const saved = (ok, title) => {
  if (ok) toast({ title, duration: 2200 })
  else toast({ title: 'Could not save', text: 'The browser has no room left. Remove an image and try again.', tone: 'error', duration: 4000 })
}
const failed = (e) => toast({ title: 'That image was not used', text: e.message, tone: 'error', duration: 4000 })

// One hidden file input behind a normal button: onPick gets the chosen File
function Picker({ accept, onPick, children, label, className = 'sp-btn', icon: Icon = Upload }) {
  const ref = useRef(null)
  return (
    <>
      <button type="button" className={className} aria-label={label} onClick={() => ref.current?.click()}><Icon size={16} strokeWidth={1.75} aria-hidden="true" />{children}</button>
      <input ref={ref} type="file" accept={accept} hidden tabIndex={-1} aria-hidden="true" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onPick(f) }} />
    </>
  )
}

const LAYOUT_INFO = { left: ['Left aligned', 'form on the left, banner on the right'], center: ['Center aligned', 'form in a card over the banner'], right: ['Right aligned', 'form on the right, banner on the left (standard)'] }
// shows the light-theme logo on a light page and the dark-theme logo on a dark one (swapped by CSS, so it follows the portal theme)
const Logo = ({ b }) => (<><img className="br-lg lt" src={b.logoLight} alt="" /><img className="br-lg dk" src={b.logoDark} alt="" /></>)
const ACCEPT_IMG = 'image/png,image/jpeg,image/webp'
const ACCEPT_LOGO = 'image/png,image/jpeg,image/webp,image/svg+xml'
const ACCEPT_ICON = 'image/png,image/svg+xml,image/x-icon,image/jpeg,image/webp'

function AssetCard({ title, desc, hint, kind, field, src, isCustom, dark, accept, noun, tile }) {
  const upload = async (file) => {
    try { saved(setBranding({ [field]: await readImage(file, kind) }), `${title} updated`) } catch (e) { failed(e) }
  }
  return (
    <section className={`br-card${dark ? ' dark' : ''}`} aria-label={title}>
      <h3>{title}</h3>
      <p>{desc}</p>
      <div className={`br-asset ${kind}${tile ? ` on-${tile}` : ''}`}>{src ? <img src={src} alt={`${title} preview`} /> : <span>No {noun} set</span>}</div>
      <small>{hint}</small>
      <div className="br-actions">
        <Picker accept={accept} onPick={upload} label={`Upload ${noun}`}>Upload {noun}</Picker>
        {isCustom && <button type="button" className="sp-btn danger" onClick={() => saved(resetBranding([field]), `${title} reset to default`)}><Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />Remove {noun}</button>}
      </div>
    </section>
  )
}

export default function BrandingSection() {
  const b = useBranding()
  const slides = b.slides
  const [sel, setSel] = useState(0)
  const shown = Math.min(sel, slides.length - 1)

  const commit = (list, title) => saved(setBranding({ slides: list }), title)
  const upload = (file, i) => readImage(file, 'banner').then((src) => commit(i == null ? addSlide(slides, src) : replaceSlide(slides, i, src), i == null ? 'Banner added' : 'Banner replaced')).catch(failed)

  return (
    <div className="br">
      <section className="br-card wide" aria-label="Login banner images">
        <header>
          <div>
            <h3>Login banner images</h3>
            <p>Shown beside the sign-in form, one after another. Upload banners that already include their text: the login page shows the image as it is.</p>
          </div>
          {b.custom.slides && <button type="button" className="sp-btn" onClick={() => saved(resetBranding(['slides']), 'Banners reset to default')}><RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />Reset to default</button>}
        </header>

        <table className="br-set" aria-label="Banner slideshow settings">
          <tbody>
            <tr>
              <th scope="row"><b id="br-auto-l">Slide automatically</b><small id="br-auto-d">Move to the next banner by itself. Visitors can still use the dots and arrows.</small></th>
              <td><button type="button" role="switch" aria-checked={b.autoplay} aria-labelledby="br-auto-l" aria-describedby="br-auto-d" className="br-sw" onClick={() => saved(setBranding({ autoplay: !b.autoplay }), b.autoplay ? 'Automatic sliding off' : 'Automatic sliding on')}><i /></button></td>
            </tr>
            <tr className={b.autoplay ? '' : 'off'}>
              <th scope="row"><label htmlFor="br-int">Time between banners</label></th>
              <td><div className="br-dd"><select id="br-int" value={b.interval} disabled={!b.autoplay} onChange={(e) => saved(setBranding({ interval: Number(e.target.value) }), 'Slide timing saved')}>{INTERVALS.map((n) => <option key={n} value={n}>{n} seconds</option>)}</select><ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" /></div></td>
            </tr>
            <tr>
              <th scope="row"><label htmlFor="br-tr">Animation</label></th>
              <td><div className="br-dd"><select id="br-tr" value={b.transition} onChange={(e) => saved(setBranding({ transition: e.target.value }), 'Animation saved')}>{TRANSITIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select><ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" /></div></td>
            </tr>
            <tr className={b.autoplay ? '' : 'off'}>
              <th scope="row"><b id="br-ph-l">Pause on hover</b><small id="br-ph-d">Stops sliding while the pointer is over the banner.</small></th>
              <td><button type="button" role="switch" aria-checked={b.pauseOnHover} aria-labelledby="br-ph-l" aria-describedby="br-ph-d" disabled={!b.autoplay} className="br-sw" onClick={() => saved(setBranding({ pauseOnHover: !b.pauseOnHover }), b.pauseOnHover ? 'Pause on hover off' : 'Pause on hover on')}><i /></button></td>
            </tr>
          </tbody>
        </table>

        <div className="br-banners">
          <div className="br-stage">
            <span className="br-cap">Preview · banner {shown + 1} of {slides.length}</span>
            <div className="br-preview" aria-label="Login screen preview">
              <div className="br-pimg">
                <img src={slides[shown]} alt={`Banner ${shown + 1} on the login screen`} />
                {slides.length > 1 && <i className="br-pdots" aria-hidden="true">{slides.map((_, i) => <b key={i} className={i === shown ? 'on' : ''} />)}</i>}
              </div>
              <div className="br-form" aria-hidden="true"><Logo b={b} /><em>Email</em><i /><em>Password</em><i /><i className="btn" /></div>
            </div>
            <small>Recommended 1600×1000 px (16:10) or larger, PNG, JPG or WebP, up to 5 MB. Keep key content away from the edges: the image is cropped to fit the screen.</small>
          </div>

          <div className="br-list">
            <ul className="br-slides" aria-label="Banner slides">
              {slides.map((src, i) => (
                <li key={`${i}-${src.slice(-20)}`} className={i === shown ? 'on' : ''}>
                  <button type="button" className="br-thumb" aria-label={`Preview banner ${i + 1}`} aria-pressed={i === shown} onClick={() => setSel(i)}><img src={src} alt={`Banner ${i + 1}`} /></button>
                  <div className="br-meta"><b>Banner {i + 1}</b><small>{i === 0 ? 'Shown first' : `Shown ${i + 1}${['st', 'nd', 'rd'][i] || 'th'}`}</small></div>
                  <div className="br-slide-actions">
                    <button type="button" className="br-ic" aria-label={`Move banner ${i + 1} earlier`} disabled={i === 0} onClick={() => { commit(moveSlide(slides, i, -1), 'Order updated'); if (i === shown) setSel(i - 1) }}><ArrowUp size={16} strokeWidth={1.75} aria-hidden="true" /></button>
                    <button type="button" className="br-ic" aria-label={`Move banner ${i + 1} later`} disabled={i === slides.length - 1} onClick={() => { commit(moveSlide(slides, i, 1), 'Order updated'); if (i === shown) setSel(i + 1) }}><ArrowDown size={16} strokeWidth={1.75} aria-hidden="true" /></button>
                    <Picker accept={ACCEPT_IMG} onPick={(f) => upload(f, i)} label={`Replace banner ${i + 1}`} className="sp-btn sm">Replace</Picker>
                    <button type="button" className="br-ic danger" aria-label={`Remove banner ${i + 1}`} disabled={slides.length <= 1} onClick={() => { const before = slides; if (setBranding({ slides: removeSlide(slides, i) })) toast({ title: 'Banner removed', text: `Banner ${i + 1} is no longer on the login page.`, duration: 8000, action: { label: 'Undo', run: () => setBranding({ slides: before }) } }) }}><Trash2 size={16} strokeWidth={1.75} aria-hidden="true" /></button>
                  </div>
                </li>
              ))}
              {slides.length < MAX_SLIDES && (
                <li className="add">
                  <Picker accept={ACCEPT_IMG} onPick={(f) => upload(f, null)} label="Add banner" className="br-add" icon={ImagePlus}>Add image <small>{slides.length} of {MAX_SLIDES} used</small></Picker>
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>

      <section className="br-card wide" aria-label="Login page layout">
        <header>
          <div>
            <h3>Login page layout</h3>
            <p>Choose where the sign-in form sits next to your banner.</p>
            <p className="br-layout-desc"><b>{LAYOUT_INFO[b.layout][0]}</b> — {LAYOUT_INFO[b.layout][1]}</p>
          </div>
        </header>
        <div className="br-layouts" role="radiogroup" aria-label="Login page layout">
          {LAYOUTS.map((k) => (
            <label key={k} className={`br-lo${b.layout === k ? ' on' : ''}`}>
              <input type="radio" name="login-layout" value={k} checked={b.layout === k} onChange={() => saved(setBranding({ layout: k }), `${LAYOUT_INFO[k][0]} layout saved`)} />
              <span className={`br-mini ${k}`} aria-hidden="true">
                <i className="br-mini-img" style={{ backgroundImage: `url("${slides[0]}")` }} />
                <span className="br-mini-form"><Logo b={b} /><u /><u /><u className="btn" /></span>
              </span>
              <span className="br-lo-name"><span className="br-radio" aria-hidden="true" />{k === 'left' ? 'Left aligned' : k === 'center' ? 'Center aligned' : 'Right aligned'}</span>
            </label>
          ))}
        </div>
      </section>

      <div className="br-grid">
        <AssetCard title="Company logo" desc="Shown on the login page and in the portal header." hint="300×100 px, PNG or SVG." kind="logo" field="logoLight" src={b.logoLight} isCustom={b.custom.logoLight} accept={ACCEPT_LOGO} noun="logo" tile="light" />
        <AssetCard title="Dark theme logo" desc="Used when the dark theme is on. Use a light-coloured version." hint="300×100 px, PNG or SVG." kind="logo" field="logoDark" src={b.logoDark} isCustom={b.custom.logoDark} dark accept={ACCEPT_LOGO} noun="dark logo" tile="dark" />
        <AssetCard title="Favicon" desc="The icon that appears in browser tabs." hint="32×32 or 64×64 px, PNG, SVG or ICO." kind="favicon" field="favicon" src={b.favicon || '/favicon-32.png'} isCustom={b.custom.favicon} accept={ACCEPT_ICON} noun="favicon" />
      </div>
      <p className="br-note">Changes apply as soon as you upload them. They are kept in this browser; a real deployment would store them against the account.</p>
    </div>
  )
}
