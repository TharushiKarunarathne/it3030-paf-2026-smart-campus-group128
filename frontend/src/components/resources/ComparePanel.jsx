import { Link } from 'react-router-dom'

const STATUS_CONFIG = {
  AVAILABLE:   { label: 'Available',   dot: 'bg-green-500', badge: 'bg-green-50 text-green-700' },
  MAINTENANCE: { label: 'Maintenance', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' },
  UNAVAILABLE: { label: 'Unavailable', dot: 'bg-red-500',   badge: 'bg-red-50 text-red-700' },
}

const TYPE_CONFIG = {
  LECTURE_HALL:       { label: 'Lecture Hall',       icon: '🏛️' },
  COMPUTER_LAB:       { label: 'Computer Lab',       icon: '🖥️' },
  SPORTS_FACILITY:    { label: 'Sports / Gym',       icon: '🏋️' },
  MEETING_ROOM:       { label: 'Meeting Room',       icon: '🪑' },
  VEHICLE:            { label: 'Vehicle',            icon: '🚌' },
  LIBRARY_STUDY_ROOM: { label: 'Library Study Room', icon: '📚' },
}

function formatKey(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()
}

// Collect all comparable fields from both resources
function buildRows(a, b) {
  const rows = []

  // Core fields
  if (a.location || b.location)
    rows.push({ label: 'Location', aVal: a.location, bVal: b.location, type: 'text' })

  if (a.capacity || b.capacity)
    rows.push({ label: 'Capacity', aVal: a.capacity ? `${a.capacity} people` : null, bVal: b.capacity ? `${b.capacity} people` : null, type: 'text', compareNum: true, aNum: a.capacity, bNum: b.capacity })

  // Details fields — union of both
  const allDetailKeys = new Set([
    ...Object.keys(a.details ?? {}),
    ...Object.keys(b.details ?? {}),
  ])

  allDetailKeys.forEach(key => {
    const aVal = a.details?.[key]
    const bVal = b.details?.[key]
    const isBool = typeof aVal === 'boolean' || typeof bVal === 'boolean'
    rows.push({
      label: formatKey(key),
      aVal,
      bVal,
      type: isBool ? 'bool' : 'text',
    })
  })

  return rows
}

function CellValue({ val, type, isBetter }) {
  if (val === undefined || val === null || val === '') {
    return <span className="text-gray-300 text-sm">—</span>
  }
  if (type === 'bool') {
    return val
      ? <span className="text-green-600 font-medium text-sm flex items-center gap-1">
          <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-xs">✓</span> Yes
        </span>
      : <span className="text-gray-300 text-sm flex items-center gap-1">
          <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">✗</span> No
        </span>
  }
  return (
    <span className={`text-sm ${isBetter ? 'font-semibold text-indigo-700' : 'text-gray-700'}`}>
      {String(val)}
    </span>
  )
}

export default function ComparePanel({ resources, onRemove, onClear }) {
  if (resources.length < 2) return null

  const [a, b] = resources
  const rows = buildRows(a, b)
  const typeA = TYPE_CONFIG[a.type] ?? { label: a.type, icon: '📦' }
  const typeB = TYPE_CONFIG[b.type] ?? { label: b.type, icon: '📦' }
  const statusA = STATUS_CONFIG[a.status] ?? { label: a.status, dot: 'bg-gray-400', badge: 'bg-gray-50 text-gray-600' }
  const statusB = STATUS_CONFIG[b.status] ?? { label: b.status, dot: 'bg-gray-400', badge: 'bg-gray-50 text-gray-600' }

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 mb-8 shadow-sm">

      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between"
           style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}>
        <div className="flex items-center gap-3">
          <span className="text-white font-medium text-sm">
            Side-by-side comparison
          </span>
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
            2 resources
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-white/70 hover:text-white text-xs border border-white/20
                     hover:border-white/40 px-3 py-1.5 rounded-lg transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Comparison grid */}
      <div className="bg-white">
        <div className="grid"
             style={{ gridTemplateColumns: '160px minmax(0,1fr) minmax(0,1fr)' }}>

          {/* Resource headers */}
          <div className="p-4 border-b border-gray-100" />

          {/* Resource A header */}
          <div className="p-4 border-l border-b border-gray-100">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-2xl">{typeA.icon}</span>
                <h3 className="font-semibold text-gray-900 text-sm mt-1">{a.name}</h3>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{typeA.label}</p>
              </div>
              <button
                onClick={() => onRemove(a.id)}
                className="text-gray-300 hover:text-gray-500 text-xs ml-2 mt-0.5"
              >
                ✕
              </button>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1
                             rounded-full text-xs font-medium ${statusA.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusA.dot}`} />
              {statusA.label}
            </div>
          </div>

          {/* Resource B header */}
          <div className="p-4 border-l border-b border-gray-100">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-2xl">{typeB.icon}</span>
                <h3 className="font-semibold text-gray-900 text-sm mt-1">{b.name}</h3>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{typeB.label}</p>
              </div>
              <button
                onClick={() => onRemove(b.id)}
                className="text-gray-300 hover:text-gray-500 text-xs ml-2 mt-0.5"
              >
                ✕
              </button>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1
                             rounded-full text-xs font-medium ${statusB.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusB.dot}`} />
              {statusB.label}
            </div>
          </div>

          {/* Data rows */}
          {rows.map((row, i) => {
            // Highlight the better numeric value
            const aBetter = row.compareNum && row.aNum > row.bNum
            const bBetter = row.compareNum && row.bNum > row.aNum

            // Highlight differences for bool
            const isDiff = row.type === 'bool' && row.aVal !== row.bVal

            return (
              <>
                <div key={`label-${i}`}
                  className="px-5 py-3 flex items-center border-t border-gray-50">
                  <span className="text-xs text-gray-400">{row.label}</span>
                </div>
                <div key={`a-${i}`}
                  className={`px-4 py-3 flex items-center border-t border-l border-gray-50
                               ${aBetter ? 'bg-indigo-50/50' : ''}
                               ${isDiff && row.aVal ? 'bg-green-50/40' : ''}
                               ${isDiff && !row.aVal ? 'bg-gray-50/60' : ''}`}>
                  <CellValue val={row.aVal} type={row.type} isBetter={aBetter} />
                </div>
                <div key={`b-${i}`}
                  className={`px-4 py-3 flex items-center border-t border-l border-gray-50
                               ${bBetter ? 'bg-indigo-50/50' : ''}
                               ${isDiff && row.bVal ? 'bg-green-50/40' : ''}
                               ${isDiff && !row.bVal ? 'bg-gray-50/60' : ''}`}>
                  <CellValue val={row.bVal} type={row.type} isBetter={bBetter} />
                </div>
              </>
            )
          })}

          {/* Book row */}
          <div className="px-5 py-3 flex items-center border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-400">Book</span>
          </div>
          <div className="px-4 py-3 border-t border-l border-gray-100 bg-gray-50/50">
            {a.status === 'AVAILABLE' ? (
              <Link
                to={`/bookings/new?resourceId=${a.id}&resourceName=${encodeURIComponent(a.name)}`}
                className="block w-full text-center text-xs font-medium py-2 rounded-xl
                           bg-indigo-700 text-white hover:bg-indigo-800 transition-colors"
              >
                📅 Book {a.name.split(' ').slice(-1)[0]}
              </Link>
            ) : (
              <div className="w-full text-center text-xs py-2 rounded-xl
                              bg-gray-100 text-gray-400">
                Not available
              </div>
            )}
          </div>
          <div className="px-4 py-3 border-t border-l border-gray-100 bg-gray-50/50">
            {b.status === 'AVAILABLE' ? (
              <Link
                to={`/bookings/new?resourceId=${b.id}&resourceName=${encodeURIComponent(b.name)}`}
                className="block w-full text-center text-xs font-medium py-2 rounded-xl
                           bg-indigo-700 text-white hover:bg-indigo-800 transition-colors"
              >
                📅 Book {b.name.split(' ').slice(-1)[0]}
              </Link>
            ) : (
              <div className="w-full text-center text-xs py-2 rounded-xl
                              bg-gray-100 text-gray-400">
                Not available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}