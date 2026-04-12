// FocusLens background.js — service worker
const DASHBOARD_URL = 'http://localhost:3000/dashboard'
const LANDING_URL   = 'http://localhost:3000/login'

let currentScore = 100
let overlayShown = false

chrome.runtime.onMessage.addListener((msg, sender) => {
  switch (msg.type) {
    case 'SCORE_UPDATE':
      currentScore = msg.score
      // Update badge
      chrome.action.setBadgeText({ text: String(msg.score) })
      chrome.action.setBadgeBackgroundColor({
        color: msg.score > 70 ? '#639922' : msg.score > 50 ? '#BA7517' : '#A32D2D'
      })
      break

    case 'SHOW_OVERLAY':
      if (!overlayShown && sender.tab?.id) {
        overlayShown = true
        chrome.scripting.executeScript({
          target: { tabId: sender.tab.id },
          files:  ['overlay.js'],
        })
        // Reset after 2 minutes
        setTimeout(() => { overlayShown = false }, 120000)
      }
      break

    case 'NOT_LOGGED_IN':
      chrome.tabs.create({ url: LANDING_URL })
      break

    case 'OPEN_DASHBOARD':
      chrome.tabs.create({ url: DASHBOARD_URL })
      break

    case 'GET_SCORE':
      return { score: currentScore }
  }
})
