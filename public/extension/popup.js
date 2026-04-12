const API = 'http://localhost:3000'

const toggle = document.getElementById('toggle')
const scoreVal = document.getElementById('score-val')
const scoreFill = document.getElementById('score-fill')
const scoreSub = document.getElementById('score-sub')
const pill = document.getElementById('status-pill')

// Load saved state
chrome.storage.local.get(['fl_enabled', 'fl_score'], ({ fl_enabled, fl_score }) => {
  toggle.checked = fl_enabled || false
  updateScoreUI(fl_score || null, fl_enabled)
})

// Toggle tracking
toggle.addEventListener('change', () => {
  const enabled = toggle.checked
  chrome.storage.local.set({ fl_enabled: enabled })
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: 'SET_ENABLED', enabled })
  })
  updateScoreUI(null, enabled)
  if (!enabled) { 
    scoreVal.textContent = '—'
    scoreFill.style.width = '0%' 
  }
})

// Listen for score updates from content script via storage
chrome.storage.onChanged.addListener(({ fl_score }) => {
  if (fl_score) updateScoreUI(fl_score.newValue, toggle.checked)
})

function updateScoreUI(score, enabled) {
  pill.textContent = enabled ? 'ON' : 'OFF'
  pill.className = `status-pill ${enabled ? 'pill-on' : 'pill-off'}`
  if (score === null) return
  scoreVal.textContent = score
  scoreFill.style.width = score + '%'
  scoreFill.style.background = score > 70 ? '#3C3489' : score > 50 ? '#7F77DD' : '#E24B4A'
  scoreSub.textContent = score > 70 ? 'Great focus!' : score > 50 ? 'Getting tired...' : 'Fatigue detected!'
}

document.getElementById('btn-dashboard').onclick = () => 
  chrome.tabs.create({ url: `${API}/dashboard` })

document.getElementById('btn-daily').onclick = () => 
  chrome.tabs.create({ url: `${API}/dashboard/daily` })

document.getElementById('btn-ask').onclick = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.scripting.executeScript({ 
      target: { tabId: tab.id }, 
      files: ['overlay.js'] 
    })
  })
}