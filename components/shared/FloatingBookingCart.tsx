'use client'

import '@/lib/utils/register-icons'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
import {
  FaTimes, FaShoppingCart, FaCalendarAlt, FaClock,
  FaArrowRight, FaTrashAlt, FaCheckCircle,
} from 'react-icons/fa'
import { useBookingCart } from '@/lib/contexts/booking-cart-context'

function isLoggedIn() {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some(c => c.trim().startsWith('mediwyz_userType='))
}

export default function FloatingBookingCart() {
  const { selection, clear, openLoginModal } = useBookingCart()
  const [open, setOpen] = useState(false)

  function handleBookNow() {
    if (!selection) return
    if (!isLoggedIn()) {
      openLoginModal(() => {
        const { role, service, date, time } = selection
        window.location.href = `/search/${role.slug}?service=${service.id}&date=${date}&time=${time}`
      })
      return
    }
    const { role, service, date, time } = selection
    window.location.href = `/search/${role.slug}?service=${service.id}&date=${date}&time=${time}`
  }

  const hasSelection = !!selection

  return (
    <>
      {/* "" Expanded panel (slides in from bottom-right) """"""""""" */}
      <AnimatePresence>
        {open && hasSelection && selection && (
          <>
            <motion.div
              key="cart-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[55] bg-black/30 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="cart-panel"
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed bottom-[340px] sm:bottom-[264px] right-4 sm:right-5 z-[60] w-[300px] sm:w-[320px] bg-surface rounded-2xl shadow-2xl overflow-hidden"
              style={{ boxShadow: '0 24px 60px rgba(0,30,64,0.25)' }}
            >
              {/* Panel header */}
              <div className="px-4 pt-4 pb-3 border-b border-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaShoppingCart className="text-[#0C6780] text-sm" />
                  <span className="text-sm font-bold text-fg">Booking Summary</span>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 text-faint hover:text-soft rounded-lg -mr-1">
                  <FaTimes className="text-xs" />
                </button>
              </div>

              {/* Provider row */}
              <div className="px-4 pt-3 pb-2 space-y-2.5">
                <div className="flex items-center gap-3 p-2.5 bg-subtle rounded-xl">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${selection.role.color}1a` }}>
                    {selection.role.iconKey && (
                      <Icon icon={selection.role.iconKey} width={18} height={18} color={selection.role.color} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-faint uppercase tracking-wide font-medium">Provider type</p>
                    <p className="text-xs font-bold text-fg">{selection.role.singularLabel}</p>
                  </div>
                </div>

                {/* Service row */}
                <div className="p-2.5 rounded-xl border-2 border-dashed"
                  style={{ borderColor: `${selection.role.color}40`, background: `${selection.role.color}08` }}>
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${selection.role.color}20` }}>
                      {selection.service.iconKey ? (
                        <Icon icon={selection.service.iconKey} width={18} height={18} color={selection.role.color} />
                      ) : (
                        <span className="text-sm">{selection.service.emoji ?? ''}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-fg leading-tight">{selection.service.serviceName}</p>
                      {selection.service.description && (
                        <p className="text-[10px] text-soft mt-0.5 line-clamp-2 leading-relaxed">
                          {selection.service.description}
                        </p>
                      )}
                      <p className="text-[10px] text-faint mt-1">{selection.service.category}</p>
                    </div>
                    <p className="text-sm font-black flex-shrink-0" style={{ color: selection.role.color }}>
                      Rs {selection.service.defaultPrice.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Date + time */}
                <div className="flex items-center gap-2 px-2.5 py-2 bg-subtle rounded-xl">
                  <FaCalendarAlt className="text-[#0C6780] text-xs flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-fg">{selection.dateLabel}</p>
                    <p className="text-[10px] text-faint flex items-center gap-1">
                      <FaClock className="text-[8px]" /> {selection.timeLabel}
                    </p>
                  </div>
                  <FaCheckCircle className="text-emerald-500 text-xs flex-shrink-0" />
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 pt-1 space-y-2">
                <button
                  onClick={handleBookNow}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-opacity hover:opacity-90"
                  style={{ backgroundColor: selection.role.color, boxShadow: `0 8px 24px ${selection.role.color}40` }}
                >
                  Book Now <FaArrowRight className="text-xs" />
                </button>
                <button
                  onClick={() => { clear(); setOpen(false) }}
                  className="w-full py-1.5 text-xs text-faint hover:text-red-500 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FaTrashAlt className="text-[9px]" /> Clear selection
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* "" FAB button - slot 3 """""""""""""""""""""""""""""""""""" */}
      {hasSelection ? (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setOpen(v => !v)}
          className="fixed bottom-[276px] sm:bottom-[200px] right-4 sm:right-5 z-[150]
            h-12 w-12 justify-center rounded-full shadow-lg shadow-black/25
            text-white flex items-center text-sm font-semibold
            transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: selection?.role.color ?? '#0C6780',
            boxShadow: `0 8px 24px ${selection?.role.color ?? '#0C6780'}50`,
          }}
          aria-label="My Booking"
          title="My Booking"
        >
          <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            <FaCalendarAlt className="text-base" />
          </span>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">1</span>
        </motion.button>
      ) : (
        <button
          onClick={() => setOpen(v => !v)}
          className="fixed bottom-[276px] sm:bottom-[200px] right-4 sm:right-5 z-[150]
            h-12 w-12 justify-center rounded-full shadow-lg
            bg-surface dark:bg-surface border-2 border-line dark:border-line
            flex items-center text-sm font-semibold
            text-faint dark:text-soft hover:border-[#0C6780] hover:text-[#0C6780] dark:hover:text-accent transition-all hover:scale-105 active:scale-95"
          aria-label="My Booking"
          title="My Booking"
        >
          <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            <FaCalendarAlt className="text-base" />
          </span>
        </button>
      )}

      {/* Empty cart tooltip */}
      <AnimatePresence>
        {open && !hasSelection && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-[340px] sm:bottom-[264px] right-4 sm:right-5 z-[150] bg-surface border border-line rounded-xl shadow-lg px-4 py-3 w-52 text-center"
          >
            <p className="text-xs font-semibold text-soft">No service selected</p>
            <p className="text-[10px] text-faint mt-0.5">Pick a date & service from the booking widget above</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
