import Modal from './Modal'
import './announcement.css'

// Birthday card artwork drawn in SVG (no external image needed).
function cardArt(name) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='400' viewBox='0 0 300 400'>
  <rect width='300' height='400' fill='#0b0b0b'/>
  <g fill='#d4a93a'><ellipse cx='70' cy='36' rx='24' ry='30'/><ellipse cx='125' cy='28' rx='26' ry='32'/><ellipse cx='205' cy='40' rx='26' ry='32'/><ellipse cx='250' cy='30' rx='22' ry='28'/></g>
  <g fill='#e9e4dc'><ellipse cx='18' cy='70' rx='20' ry='26'/><ellipse cx='286' cy='68' rx='18' ry='24'/></g>
  <g fill='#e2c14a' opacity='.8'><circle cx='40' cy='120' r='3'/><circle cx='260' cy='110' r='3'/><circle cx='90' cy='90' r='2'/><circle cx='220' cy='95' r='2'/><circle cx='150' cy='70' r='2'/></g>
  <g transform='rotate(-4 150 190)'><rect x='52' y='78' width='196' height='216' rx='4' fill='#f7f5f0'/><rect x='66' y='92' width='168' height='150' fill='#8a8f7c'/><circle cx='150' cy='150' r='36' fill='#d9a77c'/><path d='M84 242c8-44 33-56 66-56s58 12 66 56z' fill='#a9b78f'/><text x='150' y='275' font-family='Inter,Arial' font-weight='700' font-size='20' text-anchor='middle' fill='#111'>${name.toUpperCase()}</text></g>
  <text x='150' y='330' font-family='Inter,Arial' font-size='11' letter-spacing='4' text-anchor='middle' fill='#e2c98a'>HAPPY</text>
  <text x='150' y='362' font-family='Georgia,serif' font-style='italic' font-size='34' text-anchor='middle' fill='#e2c98a'>Birthday</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// Announcement popup: title + author/date, tag, media card, message, author footer.
// a = { title, author, date, tag, name?, image? ('birthday'), text }
export default function AnnouncementModal({ a, onClose }) {
  const ini = (a?.author || '').split(' ').map((x) => x[0]).join('').slice(0, 2)
  return (
    <Modal open={!!a} title={a?.title || ''} onClose={onClose} width={672}>
      {a && (
        <div className="an">
          <p className="an-by">{a.author} · {a.date}</p>
          <span className="an-tag">{a.tag || 'General'}</span>
          {a.image === 'birthday' && <div className="an-img"><img src={cardArt(a.name || 'Team')} alt={`Birthday card for ${a.name}`} /></div>}
          <p className="an-text">{a.text}</p>
          <div className="an-foot"><i>{ini}</i><span>{a.author}</span><em>·</em><span>{a.date}</span></div>
        </div>
      )}
    </Modal>
  )
}
