import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getMyBookings, getAllBookings } from '../../api/bookingApi'

/* ─── config ──────────────────────────────────────────────────────────────── */

const TYPE_CONFIG = {
  LECTURE_HALL:       { label: 'Lecture Hall',       icon: '🏛️', bar: 'bg-blue-500',   light: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   pill: 'bg-blue-100 text-blue-700'   },
  COMPUTER_LAB:       { label: 'Computer Lab',       icon: '🖥️', bar: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', pill: 'bg-violet-100 text-violet-700' },
  SPORTS_FACILITY:    { label: 'Sports / Gym',       icon: '🏋️', bar: 'bg-emerald-500',light: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200',pill: 'bg-emerald-100 text-emerald-700'},
  MEETING_ROOM:       { label: 'Meeting Room',       icon: '🪑', bar: 'bg-sky-500',    light: 'bg-sky-50',    text: 'text-sky-700',    border: 'border-sky-200',    pill: 'bg-sky-100 text-sky-700'      },
  VEHICLE:            { label: 'Vehicle',            icon: '🚌', bar: 'bg-amber-500',  light: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  pill: 'bg-amber-100 text-amber-700'  },
  LIBRARY_STUDY_ROOM: { label: 'Library Study Room', icon: '📚', bar: 'bg-teal-500',   light: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   pill: 'bg-teal-100 text-teal-700'    },
}

const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',    badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400',  ring: 'ring-amber-200'  },
  APPROVED:   { label: 'Approved',   badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200' },
  REJECTED:   { label: 'Rejected',   badge: 'bg-red-100 text-red-700',      dot: 'bg-red-500',    ring: 'ring-red-200'    },
  CHECKED_IN: { label: 'Checked In', badge: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500',   ring: 'ring-blue-200'   },
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function toDateKey(dt) {
  if (!dt) return ''
  if (Array.isArray(dt)) {
    const [y, m, d] = dt
    return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }
  const d = new Date(dt)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function buildKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

function fmtTime(dt) {
  if (!dt) return '—'
  const d = Array.isArray(dt)
    ? new Date(dt[0], dt[1]-1, dt[2], dt[3]||0, dt[4]||0)
    : new Date(dt)
  return d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12: false })
}

function fmtDuration(start, end) {
  const s = Array.isArray(start) ? new Date(start[0],start[1]-1,start[2],start[3]||0,start[4]||0) : new Date(start)
  const e = Array.isArray(end)   ? new Date(end[0],end[1]-1,end[2],end[3]||0,end[4]||0)           : new Date(end)
  const mins = Math.round((e - s) / 60000)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins/60), m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

/* ─── sub-components ──────────────────────────────────────────────────────── */

function EventBar({ booking, selected }) {
  const tc = TYPE_CONFIG[booking.resourceType] ?? { bar:'bg-gray-400', light:'bg-gray-50', text:'text-gray-600' }
  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs truncate w-full
                     ${selected ? 'bg-white/20 text-white' : `${tc.light} ${tc.text}`}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selected ? 'bg-white' : tc.bar}`} />
      <span className="truncate font-medium">{booking.resourceName}</span>
      <span className={`flex-shrink-0 ml-auto opacity-70 text-[10px] ${selected ? 'text-white/80' : ''}`}>
        {fmtTime(booking.startTime)}
      </span>
    </div>
  )
}


function TimelineCard({ booking }) {
  const tc = TYPE_CONFIG[booking.resourceType] ?? { label: booking.resourceType, icon:'📦', light:'bg-gray-50', text:'text-gray-600', border:'border-gray-200', pill:'bg-gray-100 text-gray-600', bar:'bg-gray-400' }
  const sc = STATUS_CONFIG[booking.status]    ?? { label: booking.status, badge:'bg-gray-100 text-gray-600', dot:'bg-gray-400', ring:'ring-gray-200' }

  return (
    <div className={`relative rounded-2xl border ${tc.border} overflow-hidden hover:shadow-md transition-shadow`}>
      {/* Colored accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${tc.bar}`} />

      <div className="pl-4 pr-4 py-3.5">
        {/* Top row: resource name + status */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm ${tc.light}`}>
              {tc.icon}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{booking.resourceName}</p>
              <p className={`text-xs mt-0.5 ${tc.text} font-medium`}>{tc.label}</p>
            </div>
          </div>
          <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            {sc.label}
          </span>
        </div>

        {/* Time row */}
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
            <svg className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span className="text-sm font-semibold text-gray-800">
              {fmtTime(booking.startTime)} – {fmtTime(booking.endTime)}
            </span>
            <span className="text-xs text-gray-400 ml-1">({fmtDuration(booking.startTime, booking.endTime)})</span>
          </div>
        </div>

        {/* Booker + purpose row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {(booking.userName || booking.userEmail) && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              {booking.userName || booking.userEmail}
            </span>
          )}
          {booking.purpose && (
            <span className="flex items-center gap-1 truncate max-w-xs">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
              </svg>
              {booking.purpose}
            </span>
          )}
        </div>

        {/* Admin note */}
        {booking.adminNote && booking.status === 'REJECTED' && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            {booking.adminNote}
          </div>
        )}

        {/* View link */}
        <div className="mt-2.5 flex justify-end">
          <Link
            to={`/bookings/${booking.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View full details
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── main component ──────────────────────────────────────────────────────── */

export default function SmartCalendar() {
  const { isAdmin } = useAuth()
  const [bookings, setBookings]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [currentDate, setCurrentDate]   = useState(new Date())
  const [selectedDay, setSelectedDay]   = useState(null)

  useEffect(() => { fetchBookings() }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const { data } = isAdmin ? await getAllBookings() : await getMyBookings()
      setBookings(Array.isArray(data) ? data : [])
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  /* group bookings by date */
  const bookingsByDate = bookings.reduce((acc, b) => {
    const k = toDateKey(b.startTime)
    if (k) { acc[k] = acc[k] ? [...acc[k], b] : [b] }
    return acc
  }, {})

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDow    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const today    = new Date()
  const todayKey = buildKey(today.getFullYear(), today.getMonth(), today.getDate())

  const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const prevMonth  = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth  = () => setCurrentDate(new Date(year, month + 1, 1))
  const jumpToday  = () => { setCurrentDate(new Date()); setSelectedDay(todayKey) }

  const handleDayClick = (day) => {
    const k = buildKey(year, month, day)
    setSelectedDay(p => p === k ? null : k)
  }

  /* selected day bookings, sorted */
  const selectedBookings = selectedDay
    ? [...(bookingsByDate[selectedDay] || [])].sort((a, b) => {
        const ta = Array.isArray(a.startTime)
          ? new Date(a.startTime[0],a.startTime[1]-1,a.startTime[2],a.startTime[3]||0,a.startTime[4]||0)
          : new Date(a.startTime)
        const tb = Array.isArray(b.startTime)
          ? new Date(b.startTime[0],b.startTime[1]-1,b.startTime[2],b.startTime[3]||0,b.startTime[4]||0)
          : new Date(b.startTime)
        return ta - tb
      })
    : []

  /* month stats */
  const pfx = `${year}-${String(month+1).padStart(2,'0')}`
  const monthBkgs   = Object.entries(bookingsByDate).filter(([k]) => k.startsWith(pfx)).flatMap(([,v]) => v)
  const mApproved   = monthBkgs.filter(b => b.status === 'APPROVED' || b.status === 'CHECKED_IN').length
  const mPending    = monthBkgs.filter(b => b.status === 'PENDING').length
  const mRejected   = monthBkgs.filter(b => b.status === 'REJECTED').length

  /* calendar cells */
  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  /* ─── render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-0">

      {/* ── Gradient header ───────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 60%, #1a4a7a 100%)' }}>

        {/* Nav + stats row */}
        <div className="flex items-center gap-4 px-5 py-3">
          <button onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10
                       hover:bg-white/20 text-white transition-colors flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <div className="flex-1">
            <h2 className="text-base font-bold text-white leading-tight">{monthLabel}</h2>
            {!loading && (
              <p className="text-blue-300 text-xs">{monthBkgs.length} booking{monthBkgs.length !== 1 ? 's' : ''} this month</p>
            )}
          </div>

          {!loading && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="flex items-center gap-1 text-xs text-white/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />{mApproved}
              </span>
              <span className="flex items-center gap-1 text-xs text-white/80">
                <span className="w-2 h-2 rounded-full bg-amber-400" />{mPending}
              </span>
              <span className="flex items-center gap-1 text-xs text-white/80">
                <span className="w-2 h-2 rounded-full bg-red-400" />{mRejected}
              </span>
              <button onClick={jumpToday}
                className="ml-1 px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white
                           text-xs font-medium border border-white/20 transition-colors">
                Today
              </button>
            </div>
          )}

          <button onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10
                       hover:bg-white/20 text-white transition-colors flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 px-1 border-t border-white/10">
          {WEEKDAYS.map(d => (
            <div key={d} className={`py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider
                                     ${d === 'Sun' || d === 'Sat' ? 'text-blue-300/50' : 'text-blue-200/70'}`}>
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* ── Calendar grid ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 border-t-0 rounded-b-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading calendar…</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
            {cells.map((day, i) => {
              if (day === null) {
                return (
                  <div key={`e-${i}`}
                    className={`min-h-[110px] bg-gray-50/50 ${i % 7 === 0 || i % 7 === 6 ? 'bg-gray-50' : ''}`}
                  />
                )
              }

              const k         = buildKey(year, month, day)
              const dayBkgs   = bookingsByDate[k] || []
              const isToday   = k === todayKey
              const isSel     = k === selectedDay
              const isWeekend = (firstDow + day - 1) % 7 === 0 || (firstDow + day - 1) % 7 === 6
              const visible   = dayBkgs.slice(0, 1)
              const overflow  = dayBkgs.length - 1

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`relative min-h-[72px] p-1 text-left flex flex-col gap-0.5
                              transition-all duration-150 group
                    ${isSel
                      ? 'bg-indigo-700'
                      : isWeekend
                      ? 'bg-gray-50/70 hover:bg-indigo-50/40'
                      : 'bg-white hover:bg-indigo-50/40'
                    }`}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between px-0.5 mb-0.5">
                    <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full
                                      text-xs font-semibold transition-colors
                      ${isSel     ? 'bg-white text-indigo-700'
                      : isToday   ? 'bg-indigo-600 text-white'
                      : isWeekend ? 'text-gray-400'
                      : 'text-gray-700 group-hover:text-indigo-700'}`}>
                      {day}
                    </span>
                    {dayBkgs.length > 0 && !isSel && (
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 rounded-full w-3.5 h-3.5 flex items-center justify-center">
                        {dayBkgs.length}
                      </span>
                    )}
                    {isSel && dayBkgs.length > 0 && (
                      <span className="text-[9px] font-bold text-white/80">{dayBkgs.length}</span>
                    )}
                  </div>

                  {/* Event bars */}
                  <div className="flex flex-col gap-0.5 w-full">
                    {visible.map((b, idx) => (
                      <EventBar key={b.id ?? idx} booking={b} selected={isSel} />
                    ))}
                    {overflow > 0 && (
                      <span className={`text-[9px] font-medium px-1 leading-tight
                                        ${isSel ? 'text-white/70' : 'text-indigo-400'}`}>
                        +{overflow} more
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          {Object.entries(TYPE_CONFIG).map(([, tc]) => (
            <span key={tc.label} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`w-2.5 h-2.5 rounded-sm ${tc.bar}`} />
              {tc.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Day detail panel ──────────────────────────────────────────────── */}
      {selectedDay && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

          {/* Panel header */}
          <div className="flex items-center justify-between px-6 py-4"
               style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 60%, #1a4a7a 100%)' }}>
            <div>
              <p className="text-blue-300 text-xs font-medium uppercase tracking-wider mb-0.5">
                Selected Day
              </p>
              <h3 className="text-white font-bold text-base">
                {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                })}
              </h3>
              <p className="text-blue-200 text-xs mt-0.5">
                {selectedBookings.length === 0
                  ? 'No bookings'
                  : `${selectedBookings.length} booking${selectedBookings.length !== 1 ? 's' : ''} scheduled`}
              </p>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10
                         hover:bg-white/20 text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Booking type summary chips */}
          {selectedBookings.length > 0 && (
            <div className="flex flex-wrap gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50/50">
              {[...new Set(selectedBookings.map(b => b.resourceType))].map(type => {
                const tc = TYPE_CONFIG[type] ?? { icon:'📦', label: type, pill:'bg-gray-100 text-gray-600' }
                const cnt = selectedBookings.filter(b => b.resourceType === type).length
                return (
                  <span key={type} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${tc.pill}`}>
                    {tc.icon} {tc.label} <span className="opacity-60">×{cnt}</span>
                  </span>
                )
              })}
            </div>
          )}

          {/* Booking list */}
          {selectedBookings.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl mb-4">
                📅
              </div>
              <p className="text-base font-semibold text-gray-700 mb-1">No bookings on this day</p>
              <p className="text-sm text-gray-400">Try clicking a day with coloured dots</p>
            </div>
          ) : (
            <div className="p-5">
              {/* Timeline */}
              <div className="space-y-3">
                {selectedBookings.map((booking, idx) => (
                  <div key={booking.id ?? idx} className="flex gap-4">
                    {/* Time label column */}
                    <div className="flex-shrink-0 w-14 pt-3.5 text-right">
                      <span className="text-xs font-bold text-gray-500 leading-none">
                        {fmtTime(booking.startTime)}
                      </span>
                      {/* Connector line */}
                      {idx < selectedBookings.length - 1 && (
                        <div className="mt-2 ml-auto w-px h-6 bg-gray-200" />
                      )}
                    </div>
                    {/* Card */}
                    <div className="flex-1 min-w-0">
                      <TimelineCard booking={booking} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
