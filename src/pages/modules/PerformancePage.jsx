import { useState } from 'react'
import { Plus, Sparkles, Target, Users } from 'lucide-react'
import { Empty, PageHead, Section, Tabs } from './ModuleKit'

const SKILLS = [['Total skills', '0'], ['Skill categories', '0'], ['Pending requests', '0']]

export default function PerformancePage({ initial = 'goals' }) {
  const [tab, setTab] = useState(initial)
  const [scope, setScope] = useState('me')

  return (
    <div className="mp">
      <PageHead title="Performance" desc="Goals, one-to-one meetings and skills.">
        {tab === 'goals' && <button type="button" className="mp-btn primary"><Plus size={16} strokeWidth={1.75} aria-hidden="true" />Add goal</button>}
        {tab === 'meetings' && <button type="button" className="mp-btn primary"><Plus size={16} strokeWidth={1.75} aria-hidden="true" />Schedule 1:1</button>}
      </PageHead>
      <Tabs label="Performance sections" value={tab} onChange={setTab} items={[['goals', 'Goals'], ['meetings', '1:1 meetings'], ['skills', 'Skills']]} />

      {tab === 'goals' && (
        <Section>
          <Tabs label="Goal scope" value={scope} onChange={setScope} items={[['me', 'Me'], ['dept', 'Department'], ['company', 'Company']]} />
          <div className="mp-card mp-pad">
            <Empty icon={Target} title="Welcome to Goals" text={scope === 'me' ? 'There are no goals available. Add goals to align and track progress.' : `No ${scope === 'dept' ? 'department' : 'company'} goals are available yet.`}>
              {scope === 'me' && <button type="button" className="mp-btn primary"><Plus size={16} strokeWidth={1.75} aria-hidden="true" />Add goal</button>}
            </Empty>
          </div>
        </Section>
      )}

      {tab === 'meetings' && (
        <Section>
          <Tabs label="Meeting views" value="my" onChange={() => {}} items={[['my', 'My meetings'], ['actions', 'Action items'], ['templates', 'Agenda templates']]} />
          <div className="mp-card mp-pad">
            <Empty icon={Users} title="No meetings scheduled" text="Meetings in this date range will show here. Adjust the range to see others." />
          </div>
        </Section>
      )}

      {tab === 'skills' && (
        <Section>
          <div className="mp-grid3">
            {SKILLS.map(([k, v]) => <div key={k} className="mp-card mp-stat"><span className="mp-lbl">{k}</span><b>{v}</b></div>)}
          </div>
          <div className="mp-card mp-pad">
            <Empty icon={Sparkles} title="No skills added yet" text="Add your skills, certifications and ratings to share them with your manager." />
          </div>
        </Section>
      )}
    </div>
  )
}
