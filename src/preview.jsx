// Dev-only preview of the shadcn components themed with Untitled UI tokens.
// Open /preview.html while `npm run dev` is running. Not part of the production build.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Plus, Download, Trash2, Check } from 'lucide-react'
import './index.css'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

function Preview() {
  const [dark, setDark] = useState(false)
  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-background p-8 font-sans text-foreground">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">VoltusWave UI kit</h1>
              <p className="text-sm text-muted-foreground">shadcn components themed with Untitled UI tokens · brand #3377FF</p>
            </div>
            <Button variant="outline" onClick={() => setDark((d) => !d)}>{dark ? 'Light' : 'Dark'} mode</Button>
          </div>

          <Section title="Buttons: variants">
            <Button><Plus data-icon="inline-start" />Primary</Button>
            <Button variant="outline"><Download data-icon="inline-start" />Secondary</Button>
            <Button variant="secondary">Soft brand</Button>
            <Button variant="ghost">Tertiary</Button>
            <Button variant="destructive"><Trash2 data-icon="inline-start" />Destructive</Button>
            <Button variant="link">Link</Button>
            <Button disabled>Disabled</Button>
          </Section>
          <Section title="Buttons: sizes 32 / 36 / 40 / 44">
            <Button size="xs">Extra small</Button>
            <Button size="sm">Small</Button>
            <Button>Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" variant="outline" aria-label="Add"><Plus /></Button>
          </Section>

          <Section title="Badges: pill, 22px">
            <Badge>Brand</Badge>
            <Badge variant="secondary">Gray</Badge>
            <Badge variant="success"><Check data-icon="inline-start" />Approved</Badge>
            <Badge variant="warning">Pending</Badge>
            <Badge variant="destructive">Rejected</Badge>
            <Badge variant="outline">Outline</Badge>
          </Section>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Request leave</CardTitle>
                <CardDescription>Fill in the details and submit for approval.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5"><Label htmlFor="n">Reason</Label><Input id="n" placeholder="Personal work" /></div>
                <div className="flex flex-col gap-1.5"><Label htmlFor="t">Notes</Label><Textarea id="t" placeholder="Anything else?" /></div>
                <div className="flex items-center justify-between"><Label htmlFor="s">Notify my manager</Label><Switch id="s" defaultChecked /></div>
                <div className="flex items-center gap-2"><Checkbox id="c" defaultChecked /><Label htmlFor="c">I have handed over my work</Label></div>
                <div className="flex justify-end gap-2"><Button variant="outline">Cancel</Button><Button>Submit</Button></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>This week</CardTitle>
                <CardDescription>35h 33m of 40h target</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <Progress value={89} />
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="leave">Leave</TabsTrigger>
                    <TabsTrigger value="wfh">WFH</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex items-center gap-3">
                  <Avatar size="lg"><AvatarFallback>VK</AvatarFallback></Avatar>
                  <div><p className="text-sm font-semibold">Venkatesh K.</p><p className="text-sm text-muted-foreground">Software Engineer</p></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Type</TableHead><TableHead>From</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell className="px-4 font-medium">Paid Leave</TableCell><TableCell className="px-4">21 Sep</TableCell><TableCell className="px-4">1</TableCell><TableCell className="px-4"><Badge variant="success">Approved</Badge></TableCell></TableRow>
                <TableRow><TableCell className="px-4 font-medium">Comp Off</TableCell><TableCell className="px-4">12 May</TableCell><TableCell className="px-4">1</TableCell><TableCell className="px-4"><Badge variant="warning">Pending</Badge></TableCell></TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<Preview />)
