// FocusLens content.js
const API_BASE = 'http://localhost:3000'

let lastActivity  = Date.now()
let reScrollCount = 0
let lastScrollY   = window.scrollY
let sessionStart  = Date.now()
let enabled       = false
let sessionId     = null
let authCheckDone = false
let intervalId    = null

const LEARNING_SITES = [
  'youtube.com', 'youtu.be',
  'coursera.org', 'udemy.com',
  'khanacademy.org', 'edx.org',
  'linkedin.com', 'skillshare.com',
  'pluralsight.com', 'egghead.io',
  'frontendmasters.com', 'vimeo.com',
  'geeksforgeeks.org', 'leetcode.com',
]

// Never treat our own site as a learning platform
// This is what was causing the infinite tab loop
function isLearningPlatform() {
  const host = location.hostname
  if (
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    host.includes('focuslens.app') ||
    host.includes('vercel.app')
  ) return false
  return LEARNING_SITES.some(s => host.includes(s))
}

async function checkAuth() {
  if (authCheckDone) return true
  authCheckDone = true
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: 'include',
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      if (isLearningPlatform()) {
        chrome.runtime.sendMessage({ type: 'NOT_LOGGED_IN' })
      }
      return false
    }
    return true
  } catch {
    return false
  }
}

function resetIdle() { lastActivity = Date.now() }
document.addEventListener('mousemove', resetIdle, { passive: true })
document.addEventListener('keydown',   resetIdle, { passive: true })
document.addEventListener('click',     resetIdle, { passive: true })

document.addEventListener('scroll', () => {
  const curr = window.scrollY
  if (curr < lastScrollY - 50) reScrollCount++
  lastScrollY = curr
  resetIdle()
}, { passive: true })

function countVisibleWords() {
  return (document.body.innerText || '').trim().split(/\s+/).length
}

function computeScore(idleSecs, reScrolls, readingSpeed) {
  const idlePenalty   = Math.min(idleSecs / 120,  1) * 40
  const scrollPenalty = Math.min(reScrolls / 10,   1) * 30
  const speedBonus    = Math.min(readingSpeed / 200, 1) * 30
  return Math.round(Math.max(0, Math.min(100, 100 - idlePenalty - scrollPenalty + speedBonus)))
}

async function sendSignal() {
  if (!enabled) return
  const now          = Date.now()
  const idleSeconds  = Math.round((now - lastActivity) / 1000)
  const totalSeconds = Math.round((now - sessionStart) / 1000)
  const currentWords = countVisibleWords()
  const readingSpeed = totalSeconds > 0 ? Math.round((currentWords / totalSeconds) * 60) : 0
  const focusScore   = computeScore(idleSeconds, reScrollCount, readingSpeed)

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
      const data    = await res.json()
      sessionId     = data.sessionId
      reScrollCount = 0
      chrome.storage.local.set({ fl_score: focusScore })
      chrome.runtime.sendMessage({ type: 'SCORE_UPDATE', score: focusScore, pageTitle: document.title })
      if (focusScore < 60) {
        chrome.runtime.sendMessage({ type: 'SHOW_OVERLAY', score: focusScore, pageTitle: document.title })
      }
    }
  } catch (err) {
    console.log('FocusLens: signal send failed', err)
  }
}

async function startTracking() {
  if (intervalId) return
  const authed = await checkAuth()
  if (!authed) return
  sessionStart = Date.now()
  intervalId   = setInterval(sendSignal, 15000)
  console.log('FocusLens: tracking started on', location.hostname)
}

chrome.storage.local.get(['fl_enabled'], ({ fl_enabled }) => {
  enabled = fl_enabled || false
  if (!enabled) return
  startTracking()
})

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SET_ENABLED') {
    enabled = msg.enabled
    chrome.storage.local.set({ fl_enabled: enabled })
    if (enabled) {
      startTracking()
    } else {
      if (intervalId) { clearInterval(intervalId); intervalId = null }
    }
  }
})

window.addEventListener('beforeunload', () => {
  if (sessionId) {
    navigator.sendBeacon(`${API_BASE}/api/session`, JSON.stringify({ sessionId, _method: 'PATCH' }))
  }
})