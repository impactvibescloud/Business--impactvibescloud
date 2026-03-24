import React, { useState, useEffect } from 'react'
import { CModal, CButton } from '@coreui/react'
import './DateRangeModal.css'

const DateRangeModal = ({ visible, onClose, initialFrom, initialTo, onApply }) => {
  const [selectedFromDate, setSelectedFromDate] = useState(null)
  const [selectedToDate, setSelectedToDate] = useState(null)
  const [selectedFromTime, setSelectedFromTime] = useState('00:00')
  const [selectedToTime, setSelectedToTime] = useState('23:59')
  const [baseLeftDate, setBaseLeftDate] = useState(null)
  const [baseRightDate, setBaseRightDate] = useState(null)

  useEffect(() => {
    const now = new Date()
    if (initialFrom) {
      const d = new Date(initialFrom)
      setSelectedFromDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()))
      setSelectedFromTime(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`)
    } else {
      setSelectedFromDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
      setSelectedFromTime('00:00')
    }
    if (initialTo) {
      const d = new Date(initialTo)
      setSelectedToDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()))
      setSelectedToTime(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`)
    } else {
      setSelectedToDate(now)
      setSelectedToTime(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`)
    }
    setBaseLeftDate(null)
    setBaseRightDate(null)
  }, [initialFrom, initialTo, visible])

  const formatDateInput = (d) => {
    if (!d) return ''
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const apply = () => {
    const from = selectedFromDate ? formatDateInput(selectedFromDate) : ''
    const to = selectedToDate ? formatDateInput(selectedToDate) : ''
    if (onApply) onApply({ from, to })
    if (onClose) onClose()
  }

  // Simple CalendarPanel embedded for parity with CallLogs
  const CalendarPanel = ({ valueDate, onSelect, baseDate, onPrev, onNext }) => {
    const today = new Date()
    const base = baseDate ? new Date(baseDate.getFullYear(), baseDate.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1)
    const year = base.getFullYear()
    const month = base.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const weeks = []
    let day = 1 - firstDay
    for (let w = 0; w < 6; w++) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const dt = new Date(year, month, day)
        week.push(dt)
        day++
      }
      weeks.push(week)
    }

    const isSameDate = (a, b) => {
      if (!a || !b) return false
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
    }

    return (
      <div className="calendar-panel">
        <div className="calendar-header d-flex align-items-center justify-content-between">
          <div className="calendar-controls">
            <button type="button" className="month-prev" onClick={onPrev}>◀</button>
            <span className="calendar-month">{base.toLocaleString('en-US', { month: 'long' })} {year}</span>
            <button type="button" className="month-next" onClick={onNext}>▶</button>
          </div>
        </div>
        <div className="calendar-grid">
          {['S','M','T','W','T','F','S'].map((h) => <div key={h} className="calendar-cell calendar-cell-header">{h}</div>)}
          {weeks.map((week,wi)=> week.map((dt,di)=> {
            const inMonth = dt.getMonth() === month
            const selected = valueDate && isSameDate(dt, valueDate)
            return (
              <div key={`${wi}-${di}`} className={`calendar-cell ${inMonth ? 'in-month':''} ${selected ? 'selected':''}`} onClick={() => onSelect(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()))}>
                {dt.getDate()}
              </div>
            )
          }))}
        </div>
      </div>
    )
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg">
      <div className="date-filter-modal date-filter-modal-rich">
        <div className="date-filter-left">
          <h5>Quick Actions</h5>
          <ul>
            {['Last 1 hour','Today','Last 24 hour','Yesterday','This Week','Last 7 days','Last 30 days','Last Month','This Month'].map((q) => (
              <li key={q}><button type="button" className="quick-action" onClick={() => {
                const now = new Date()
                let from = null; let to = now
                switch(q) {
                  case 'Last 1 hour': from = new Date(now.getTime() - 1 * 60 * 60 * 1000); break
                  case 'Last 24 hour': from = new Date(now.getTime() - 24 * 60 * 60 * 1000); break
                  case 'Today': from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); break
                  case 'Yesterday': from = new Date(now.getFullYear(), now.getMonth(), now.getDate()-1); to = new Date(now.getFullYear(), now.getMonth(), now.getDate()-1,23,59,59,999); break
                  case 'This Week': { const day = now.getDay() || 7; from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day - 1)); break }
                  case 'Last 7 days': from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break
                  case 'Last 30 days': from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break
                  case 'Last Month': { const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1); const lastMonthLastDay = new Date(firstDayThisMonth.getTime() - 1); from = new Date(lastMonthLastDay.getFullYear(), lastMonthLastDay.getMonth(), 1); to = new Date(lastMonthLastDay.getFullYear(), lastMonthLastDay.getMonth(), lastMonthLastDay.getDate(), 23,59,59,999); break }
                  case 'This Month': from = new Date(now.getFullYear(), now.getMonth(), 1); break
                  default: from = null
                }
                setSelectedFromDate(from ? new Date(from.getFullYear(), from.getMonth(), from.getDate()) : null)
                setSelectedToDate(to ? new Date(to.getFullYear(), to.getMonth(), to.getDate()) : null)
                setSelectedFromTime(from ? `${String(from.getHours()).padStart(2,'0')}:${String(from.getMinutes()).padStart(2,'0')}` : '00:00')
                setSelectedToTime(to ? `${String(to.getHours()).padStart(2,'0')}:${String(to.getMinutes()).padStart(2,'0')}` : '23:59')
              }}>{q}</button></li>
            ))}
          </ul>
        </div>
        <div className="date-filter-right">
          <div className="date-filter-top">
            <div className="date-display">
              <div className="date-block">
                <div className="date-title">From</div>
                <div className="date-large">{selectedFromDate ? selectedFromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
                <div className="time-large">{selectedFromTime}</div>
              </div>
              <div className="date-block">
                <div className="date-title">To</div>
                <div className="date-large">{selectedToDate ? selectedToDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
                <div className="time-large">{selectedToTime}</div>
              </div>
            </div>
          </div>

          <div className="date-filter-panels-rich">
            <div className="date-panel-rich">
              <div className="calendar-wrapper">
                <CalendarPanel
                  valueDate={selectedFromDate}
                  onSelect={d=>setSelectedFromDate(d)}
                  baseDate={baseLeftDate || selectedFromDate || new Date()}
                  onPrev={() => setBaseLeftDate(prev => {
                    const src = prev || (selectedFromDate || new Date())
                    return new Date(src.getFullYear(), src.getMonth() - 1, 1)
                  })}
                  onNext={() => setBaseLeftDate(prev => {
                    const src = prev || (selectedFromDate || new Date())
                    return new Date(src.getFullYear(), src.getMonth() + 1, 1)
                  })}
                />
              </div>
              <div className="time-row">
                <input type="time" value={selectedFromTime} onChange={e=>setSelectedFromTime(e.target.value)} />
              </div>
            </div>
            <div className="date-panel-rich">
              <div className="calendar-wrapper">
                <CalendarPanel
                  valueDate={selectedToDate}
                  onSelect={d=>setSelectedToDate(d)}
                  baseDate={baseRightDate || selectedToDate || new Date()}
                  onPrev={() => setBaseRightDate(prev => {
                    const src = prev || (selectedToDate || new Date())
                    return new Date(src.getFullYear(), src.getMonth() - 1, 1)
                  })}
                  onNext={() => setBaseRightDate(prev => {
                    const src = prev || (selectedToDate || new Date())
                    return new Date(src.getFullYear(), src.getMonth() + 1, 1)
                  })}
                />
              </div>
              <div className="time-row">
                <input type="time" value={selectedToTime} onChange={e=>setSelectedToTime(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="date-filter-actions-rich">
            <CButton color="warning" onClick={() => {
              setSelectedFromDate(selectedFromDate)
              setSelectedToDate(selectedToDate)
              // apply selected values via callback
              apply()
            }}>APPLY</CButton>
          </div>
        </div>
      </div>
    </CModal>
  )
}

export default DateRangeModal
