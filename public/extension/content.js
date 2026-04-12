// FocusLens content.js — injected on every page
// Tracks: idle time, re-scrolls, reading speed → sends to background worker

const API_BASE = 'http://localhost:3000' // change to production URL when deployed

let idleTimer      = 0
let lastActivity   = Date.now()
let reScrollCount  = 0
let lastScrollY    = window.scrollY
let wordsRead      = 0
let sessionStart   = Date.now()
let enabled        = false
let sessionId      = null

// ── Check if user is logged in ──────────────────────────────────
async function checkAuth() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
    if (!res.ok) {
      // Not logged in → open landing page
      chrome.runtime.sendMessage({ type: 'NOT_LOGGED_IN' })
      return false
    }
    return true
  } catch { return false }
}

// ── Activity listeners ─────────────────────────────────────────
function resetIdle() { lastActivity = Date.now() }
document.addEventListener('mousemove', resetIdle, { passive: true })
document.addEventListener('keydown',   resetIdle, { passive: true })
document.addEventListener('click',     resetIdle, { passive: true })

document.addEventListener('scroll', () => {
  const curr = window.scrollY
  if (curr < lastScrollY - 50) reScrollCount++ // scrolled up = re-read
  lastScrollY = curr
  resetIdle()
}, { passive: true })

// Estimate words read via visible text
function countVisibleWords() {
  const text = document.body.innerText || ''
  return text.trim().split(/\s+/).length
}

// ── Compute focus score (0-100) ─────────────────────────────────
function computeScore(idleSecs, reScrolls, readingSpeed) {
  const idlePenalty   = Math.min(idleSecs / 120, 1) * 40   // up to -40 for 2+ min idle
  const scrollPenalty = Math.min(reScrolls / 10, 1) * 30   // up to -30 for 10+ re-scrolls
  const speedBonus    = Math.min(readingSpeed / 200, 1) * 30 // up to +30 for good speed
  return Math.round(Math.max(0, Math.min(100, 100 - idlePenalty - scrollPenalty + speedBonus)))
}

// ── Send signal to backend ──────────────────────────────────────
async function sendSignal() {
  if (!enabled) return
  const now           = Date.now()
  const idleSeconds   = Math.round((now - lastActivity) / 1000)
  const totalSeconds  = Math.round((now - sessionStart) / 1000)
  const currentWords  = countVisibleWords()
  const readingSpeed  = totalSeconds > 0 ? Math.round((currentWords / totalSeconds) * 60) : 0
  const focusScore    = computeScore(idleSeconds, reScrollCount, readingSpeed)

  try {
    const res = await fetch(`${API_BASE}/api/session`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        idleSeconds,
        reScrolls: reScrollCount,
        readingSpeed,
        focusScore,
        pageTitle: document.title,
        pageUrl:   location.href,
        platform:  location.hostname,
        topic:     document.title,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      sessionId = data.sessionId
      reScrollCount = 0 // reset per interval

      // Notify background of current score
      chrome.runtime.sendMessage({ type: 'SCORE_UPDATE', score: focusScore, pageTitle: document.title })

      // Trigger overlay if score < 60
      if (focusScore < 60) {
        chrome.runtime.sendMessage({ type: 'SHOW_OVERLAY', score: focusScore, pageTitle: document.title })
      }
    }
  } catch (err) { console.log('FocusLens: signal send failed', err) }
}

// ── Init ────────────────────────────────────────────────────────
chrome.storage.local.get(['fl_enabled'], async ({ fl_enabled }) => {
  enabled = fl_enabled || false
  if (!enabled) return

  const authed = await checkAuth()
  if (!authed) return

  sessionStart = Date.now()
  wordsRead    = countVisibleWords()
  setInterval(sendSignal, 15000) // every 15 seconds
})

// Listen for enable/disable from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SET_ENABLED') {
    enabled = msg.enabled
    chrome.storage.local.set({ fl_enabled: enabled })
    if (enabled) { sessionStart = Date.now(); checkAuth() }
  }
})

// End session on unload
window.addEventListener('beforeunload', () => {
  if (sessionId) {
    navigator.sendBeacon(`${API_BASE}/api/session`, JSON.stringify({ sessionId, _method: 'PATCH' }))
  }
})
