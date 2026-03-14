import { useState, useMemo } from 'react'
import { generateDummyData } from '../lib/adminDummyData'
import type {
  AdminDummyData,
  DummyUser,
  DummyCouple,
  DummyQuestion,
  DummyGift,
  DummyMilestone,
  DummyRating,
} from '../lib/adminDummyData'

type Tab = 'users' | 'couples' | 'questions' | 'gifts' | 'milestones'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str
}

function HeartsVisual({ rating, max = 5 }: { rating: number; max?: number }) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.3
  const hearts: string[] = []
  for (let i = 0; i < full; i++) hearts.push('❤️')
  if (hasHalf && hearts.length < max) hearts.push('🩷')
  while (hearts.length < max) hearts.push('🤍')
  return <span className="text-sm">{hearts.join('')}</span>
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
      title="Delete"
    >
      ✕
    </button>
  )
}

// ─── Login ──────────────────────────────────────────────────────────────────

function LoginCard({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username === 'admin' && password === 'surprisemineadminisme') {
      onLogin()
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-body">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm space-y-5"
      >
        <h1 className="text-2xl font-bold text-center text-gray-800">Surprise Mine Admin</h1>
        <p className="text-center text-gray-500 text-sm">Sign in to access the dashboard</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">
            Invalid username or password
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(false) }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            autoFocus
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false) }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          Sign In
        </button>
      </form>
    </div>
  )
}

// ─── Users Tab ──────────────────────────────────────────────────────────────

function UsersTab({
  users,
  onDelete,
}: {
  users: DummyUser[]
  onDelete: (id: string) => void
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }, [users, search])

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 sticky top-0">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold">Email</th>
              <th className="text-left px-4 py-3 font-semibold">Stage</th>
              <th className="text-left px-4 py-3 font-semibold">Partner</th>
              <th className="text-left px-4 py-3 font-semibold">Invite Code</th>
              <th className="text-right px-4 py-3 font-semibold">Hearts</th>
              <th className="text-right px-4 py-3 font-semibold">Streak</th>
              <th className="text-left px-4 py-3 font-semibold">Joined</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="group relative border-t border-gray-100 even:bg-gray-50 hover:bg-indigo-50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="capitalize bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                    {u.relationship_stage.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.partner_name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.invite_code}</td>
                <td className="px-4 py-3 text-right text-gray-800">{u.hearts}</td>
                <td className="px-4 py-3 text-right text-gray-800">{u.streak}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.created_at)}</td>
                <td className="relative">
                  <DeleteButton onClick={() => onDelete(u.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Couples Tab ────────────────────────────────────────────────────────────

function CouplesTab({
  couples,
  gifts,
  milestones,
  onDelete,
}: {
  couples: DummyCouple[]
  gifts: DummyGift[]
  milestones: DummyMilestone[]
  onDelete: (id: string) => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {couples.map((c) => {
        const isExpanded = expandedId === c.id
        const coupleNames = `${c.user1.name} & ${c.user2.name}`
        const coupleGifts = gifts.filter(
          (g) =>
            (g.sender_name === c.user1.name && g.recipient_name === c.user2.name) ||
            (g.sender_name === c.user2.name && g.recipient_name === c.user1.name),
        )
        const coupleMilestones = milestones.filter((m) => m.couple_names === coupleNames)

        return (
          <div
            key={c.id}
            className="group relative bg-white rounded-xl border border-gray-200 shadow-sm p-5 cursor-pointer hover:shadow-md transition"
            onClick={() => setExpandedId(isExpanded ? null : c.id)}
          >
            <DeleteButton onClick={() => onDelete(c.id)} />

            <h3 className="font-bold text-gray-800 text-lg pr-8">{coupleNames}</h3>
            <p className="text-sm text-gray-500 mt-1">
              <span className="capitalize">{c.user1.relationship_stage.replace('_', ' ')}</span>
              {' · '}Together since {formatDate(c.created_at)}
            </p>
            <div className="flex gap-4 mt-3 text-sm text-gray-600">
              <span>🏆 {c.milestone_count} milestones</span>
              <span>🎁 {c.gifts_exchanged} gifts</span>
            </div>

            {isExpanded && (
              <div className="mt-4 border-t border-gray-100 pt-4 space-y-3 text-sm">
                {coupleMilestones.length > 0 && (
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">Milestones</p>
                    <ul className="space-y-1">
                      {coupleMilestones.map((m) => (
                        <li key={m.id} className="text-gray-600">
                          {m.type_emoji} {m.title} — {formatDate(m.date)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {coupleGifts.length > 0 && (
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">Gifts</p>
                    <ul className="space-y-1">
                      {coupleGifts.map((g) => (
                        <li key={g.id} className="text-gray-600">
                          {g.gift_emoji} {g.sender_name} → {g.recipient_name}: {truncate(g.message, 40)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {coupleMilestones.length === 0 && coupleGifts.length === 0 && (
                  <p className="text-gray-400 italic">No inline data to display.</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Questions Tab ──────────────────────────────────────────────────────────

type QuestionSort = 'avg_rating' | 'most_answered' | 'category'

function QuestionsTab({
  questions,
  onDelete,
}: {
  questions: DummyQuestion[]
  onDelete: (id: string) => void
}) {
  const [sort, setSort] = useState<QuestionSort>('avg_rating')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sorted = useMemo(() => {
    const copy = [...questions]
    switch (sort) {
      case 'avg_rating':
        return copy.sort((a, b) => b.avg_rating - a.avg_rating)
      case 'most_answered':
        return copy.sort((a, b) => b.answers.length - a.answers.length)
      case 'category':
        return copy.sort((a, b) => a.category.localeCompare(b.category))
    }
  }, [questions, sort])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600 font-medium">Sort by:</span>
        {(['avg_rating', 'most_answered', 'category'] as QuestionSort[]).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              sort === s
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'avg_rating' ? 'Avg Rating' : s === 'most_answered' ? 'Most Answered' : 'Category'}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {sorted.map((q) => (
          <div
            key={q.id}
            className="group relative bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition cursor-pointer"
            onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
          >
            <DeleteButton onClick={() => onDelete(q.id)} />

            <p className="font-medium text-gray-800 pr-8">{q.text}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
              <span>
                {q.category_emoji} {q.category}
              </span>
              <span className="capitalize bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {q.intensity}
              </span>
              <HeartsVisual rating={q.avg_rating} />
              <span className="text-xs">({q.avg_rating})</span>
              <span className="text-xs">{q.total_ratings} ratings</span>
              <span className="text-xs">{q.answers.length} answers</span>
            </div>

            {expandedId === q.id && q.answers.length > 0 && (
              <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                {q.answers.map((a, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-medium text-gray-700">{a.user_name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{formatDate(a.date)}</span>
                    <p className="text-gray-600 mt-0.5">{a.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Gifts Tab ──────────────────────────────────────────────────────────────

function GiftsTab({
  gifts,
  onDelete,
}: {
  gifts: DummyGift[]
  onDelete: (id: string) => void
}) {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [openedFilter, setOpenedFilter] = useState<string>('all')

  const giftTypes = useMemo(() => {
    const types = new Set(gifts.map((g) => g.gift_type))
    return ['all', ...Array.from(types)]
  }, [gifts])

  const filtered = useMemo(() => {
    return gifts.filter((g) => {
      if (typeFilter !== 'all' && g.gift_type !== typeFilter) return false
      if (openedFilter === 'opened' && !g.opened) return false
      if (openedFilter === 'unopened' && g.opened) return false
      return true
    })
  }, [gifts, typeFilter, openedFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 font-medium">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {giftTypes.map((t) => (
              <option key={t} value={t}>
                {t === 'all' ? 'All Types' : t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 font-medium">Status:</span>
          <select
            value={openedFilter}
            onChange={(e) => setOpenedFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="all">All</option>
            <option value="opened">Opened</option>
            <option value="unopened">Unopened</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 sticky top-0">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Sender</th>
              <th className="text-left px-4 py-3 font-semibold">Recipient</th>
              <th className="text-left px-4 py-3 font-semibold">Type</th>
              <th className="text-left px-4 py-3 font-semibold">Message</th>
              <th className="text-left px-4 py-3 font-semibold">Date</th>
              <th className="text-center px-4 py-3 font-semibold">Opened</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr
                key={g.id}
                className="group relative border-t border-gray-100 even:bg-gray-50 hover:bg-indigo-50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-800">{g.sender_name}</td>
                <td className="px-4 py-3 text-gray-600">{g.recipient_name}</td>
                <td className="px-4 py-3">
                  <span>
                    {g.gift_emoji} {g.gift_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs">{truncate(g.message, 50)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(g.date)}</td>
                <td className="px-4 py-3 text-center">
                  {g.opened ? (
                    <span className="text-green-600 text-xs font-medium">Opened</span>
                  ) : (
                    <span className="text-amber-500 text-xs font-medium">Pending</span>
                  )}
                </td>
                <td className="relative">
                  <DeleteButton onClick={() => onDelete(g.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Milestones Tab ─────────────────────────────────────────────────────────

function MilestonesTab({
  milestones,
  onDelete,
}: {
  milestones: DummyMilestone[]
  onDelete: (id: string) => void
}) {
  const [sortBy, setSortBy] = useState<'date' | 'type'>('date')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const types = useMemo(() => {
    const t = new Set(milestones.map((m) => m.milestone_type))
    return ['all', ...Array.from(t)]
  }, [milestones])

  const processed = useMemo(() => {
    let list = [...milestones]
    if (typeFilter !== 'all') list = list.filter((m) => m.milestone_type === typeFilter)
    if (sortBy === 'date') list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    else list.sort((a, b) => a.milestone_type.localeCompare(b.milestone_type))
    return list
  }, [milestones, sortBy, typeFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 font-medium">Sort:</span>
          <button
            onClick={() => setSortBy('date')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              sortBy === 'date' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Date
          </button>
          <button
            onClick={() => setSortBy('type')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              sortBy === 'type' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Type
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 font-medium">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t === 'all' ? 'All Types' : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 sticky top-0">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Couple</th>
              <th className="text-left px-4 py-3 font-semibold">Type</th>
              <th className="text-left px-4 py-3 font-semibold">Title</th>
              <th className="text-left px-4 py-3 font-semibold">Date</th>
              <th className="text-left px-4 py-3 font-semibold">Note</th>
              <th className="text-center px-4 py-3 font-semibold">Photo</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {processed.map((m) => (
              <tr
                key={m.id}
                className="group relative border-t border-gray-100 even:bg-gray-50 hover:bg-indigo-50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-800">{m.couple_names}</td>
                <td className="px-4 py-3">
                  <span>
                    {m.type_emoji} {m.milestone_type}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{m.title}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(m.date)}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs">{truncate(m.note, 50)}</td>
                <td className="px-4 py-3 text-center">{m.has_photo ? '📷' : '—'}</td>
                <td className="relative">
                  <DeleteButton onClick={() => onDelete(m.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const [data, setData] = useState<AdminDummyData>(() => generateDummyData())
  const [activeTab, setActiveTab] = useState<Tab>('users')

  const resetData = () => setData(generateDummyData())

  const deleteUser = (id: string) =>
    setData((prev) => ({ ...prev, users: prev.users.filter((u) => u.id !== id) }))

  const deleteCouple = (id: string) =>
    setData((prev) => ({ ...prev, couples: prev.couples.filter((c) => c.id !== id) }))

  const deleteQuestion = (id: string) =>
    setData((prev) => ({ ...prev, questions: prev.questions.filter((q) => q.id !== id) }))

  const deleteGift = (id: string) =>
    setData((prev) => ({ ...prev, gifts: prev.gifts.filter((g) => g.id !== id) }))

  const deleteMilestone = (id: string) =>
    setData((prev) => ({ ...prev, milestones: prev.milestones.filter((m) => m.id !== id) }))

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'users', label: 'Users', count: data.users.length },
    { key: 'couples', label: 'Couples', count: data.couples.length },
    { key: 'questions', label: 'Questions & Feedback', count: data.questions.length },
    { key: 'gifts', label: 'Gifts', count: data.gifts.length },
    { key: 'milestones', label: 'Milestones', count: data.milestones.length },
  ]

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Surprise Mine Admin</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={resetData}
              className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Reset Data
            </button>
            <button
              onClick={onSignOut}
              className="px-4 py-2 text-sm font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition ${
                activeTab === tab.key
                  ? 'bg-white border border-gray-200 border-b-white text-indigo-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}{' '}
              <span
                className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'users' && <UsersTab users={data.users} onDelete={deleteUser} />}
        {activeTab === 'couples' && (
          <CouplesTab
            couples={data.couples}
            gifts={data.gifts}
            milestones={data.milestones}
            onDelete={deleteCouple}
          />
        )}
        {activeTab === 'questions' && <QuestionsTab questions={data.questions} onDelete={deleteQuestion} />}
        {activeTab === 'gifts' && <GiftsTab gifts={data.gifts} onDelete={deleteGift} />}
        {activeTab === 'milestones' && <MilestonesTab milestones={data.milestones} onDelete={deleteMilestone} />}
      </div>
    </div>
  )
}

// ─── Admin Root ─────────────────────────────────────────────────────────────

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false)

  if (!authenticated) {
    return <LoginCard onLogin={() => setAuthenticated(true)} />
  }

  return <Dashboard onSignOut={() => setAuthenticated(false)} />
}
