// Real portraits (Unsplash, bundled in /public/avatars). A person always gets the same photo, on every page and in every session:
// the known team members have a fixed one (matched to the name), anyone else gets one from their name.
export const PHOTOS = 14
export const ROSTER = {
  'Venkatesh Korlapati': 6, 'Charla Venkatesh': 9, 'Anita Rao': 5, 'Mohan Pillai': 3, 'Vinod Pasupuleti': 10, 'Kalyani Devarapalli': 1,
  'Aasritha Samudrala': 13, 'Samudrala Aasritha': 14, 'Gaurav Bhadani': 7, 'Diviti Tejesh': 8, 'Abishek Aare': 2, 'Priya Raman': 11, 'Sofia Marin': 12,
}
export const photoNo = (name) => ROSTER[name] ?? ([...String(name)].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0) % PHOTOS + 1
export const photoOf = (name) => (name ? `${import.meta.env.BASE_URL}avatars/p${photoNo(name)}.jpg` : undefined)

