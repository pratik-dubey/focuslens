// FocusLens overlay.js — injected into page when score < 60 or user clicks "Ask AI"
;(function() {
  if (document.getElementById('fl-overlay')) return // already injected

  const API = 'http://localhost:3000'
  let chatHistory = []
  let isOpen      = false
  let sessionScore = 60

  // ── Build overlay DOM ────────────────────────────────────────
  const overlay = document.createElement('div')
  overlay.id    = 'fl-overlay'
  overlay.innerHTML = `
<style>
  #fl-overlay * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Space Mono','Courier New',monospace; }
  #fl-fab { position: fixed; bottom: 24px; right: 24px; width: 48px; height: 48px; background: #FFE500; border: 3px solid #0A0A0A; box-shadow: 4px 4px 0 #0A0A0A; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; z-index: 999999; transition: all 0.1s; }
  #fl-fab:hover { transform: translate(2px,2px); box-shadow: 2px 2px 0 #0A0A0A; }
  #fl-panel { position: fixed; bottom: 84px; right: 24px; width: 320px; background: #FAFAFA; border: 3px solid #0A0A0A; box-shadow: 6px 6px 0 #0A0A0A; z-index: 999999; display: none; flex-direction: column; max-height: 480px; }
  #fl-panel.open { display: flex; }
  #fl-header { background: #FFE500; border-bottom: 3px solid #0A0A0A; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; }
  #fl-title { font-size: 12px; font-weight: 700; color: #0A0A0A; }
  #fl-score-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border: 2px solid #0A0A0A; background: #FAFAFA; color: #0A0A0A; }
  #fl-close { background: none; border: none; font-size: 16px; cursor: pointer; font-weight: 700; line-height: 1; color: #0A0A0A; }
  #fl-alert { background: #FFB3C6; border-bottom: 3px solid #0A0A0A; padding: 8px 12px; font-size: 11px; font-weight: 700; display: none; color: #0A0A0A; }
  #fl-chips { padding: 8px 12px; display: flex; flex-wrap: wrap; gap: 5px; border-bottom: 2px solid #0A0A0A; }
  .fl-chip { font-size: 10px; font-weight: 700; padding: 4px 8px; border: 2px solid #0A0A0A; background: #FAFAFA; cursor: pointer; color: #0A0A0A; }
  .fl-chip:hover { background: #FFE500; color: #0A0A0A; }
  #fl-messages { flex: 1; overflow-y: auto; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; min-height: 120px; max-height: 260px; }
  .fl-msg { font-size: 11px; line-height: 1.5; padding: 8px 10px; max-width: 90%; color: #0A0A0A; }
  .fl-msg-ai { background: #F1EFE8; border: 2px solid #0A0A0A; align-self: flex-start; color: #0A0A0A !important; }
  .fl-msg-user { background: #0A0A0A; color: #FFE500 !important; align-self: flex-end; }
  .fl-msg-ai.streaming::after { content: '▋'; animation: blink 0.7s infinite; color: #0A0A0A; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  #fl-input-row { display: flex; border-top: 3px solid #0A0A0A; }
  #fl-input { flex: 1; border: none; outline: none; padding: 10px 12px; font-family: inherit; font-size: 11px; background: #FAFAFA; color: #0A0A0A; }
  #fl-input::placeholder { color: #888; }
  #fl-send { background: #0A0A0A; color: #FFE500; border: none; padding: 10px 14px; font-family: inherit; font-size: 11px; font-weight: 700; cursor: pointer; border-left: 3px solid #0A0A0A; }
  #fl-send:hover { background: #534AB7; color: #FFE500; }
</style>

<div id="fl-fab" title="FocusLens AI Tutor">🧠</div>

<div id="fl-panel">
  <div id="fl-header">
    <div id="fl-title">FocusLens AI Tutor</div>
    <div style="display:flex;align-items:center;gap:8px;">
      <span id="fl-score-badge">Score —</span>
      <button id="fl-close">✕</button>
    </div>
  </div>
  <div id="fl-alert">⚠ Focus score dropped! Let me help you get back on track.</div>
  <div id="fl-chips">
    <button class="fl-chip" data-msg="Explain this topic simply">Explain simply</button>
    <button class="fl-chip" data-msg="Quiz me on what I'm studying">Quiz me</button>
    <button class="fl-chip" data-msg="Summarize this page in 5 bullets">Summarize page</button>
    <button class="fl-chip" data-msg="I'm stuck, help me">I'm stuck</button>
  </div>
  <div id="fl-messages">
    <div class="fl-msg fl-msg-ai">Hey! I'm your AI tutor. I can explain concepts, quiz you, or summarize what you're reading. What do you need?</div>
  </div>
  <div id="fl-input-row">
    <input id="fl-input" placeholder="Ask anything about what you're studying..." />
    <button id="fl-send">Send</button>
  </div>
</div>
`
  document.body.appendChild(overlay)

  // ── Logic ────────────────────────────────────────────────────
  const fab      = document.getElementById('fl-fab')
  const panel    = document.getElementById('fl-panel')
  const closeBtn = document.getElementById('fl-close')
  const input    = document.getElementById('fl-input')
  const sendBtn  = document.getElementById('fl-send')
  const messages = document.getElementById('fl-messages')
  const alert    = document.getElementById('fl-alert')
  const badge    = document.getElementById('fl-score-badge')

  fab.addEventListener('click', () => { isOpen = !isOpen; panel.classList.toggle('open', isOpen) })
  closeBtn.addEventListener('click', () => { isOpen = false; panel.classList.remove('open') })

  document.querySelectorAll('.fl-chip').forEach(chip => {
    chip.addEventListener('click', () => sendMessage(chip.dataset.msg))
  })

  sendBtn.addEventListener('click', () => { if (input.value.trim()) sendMessage(input.value.trim()) })
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && input.value.trim()) sendMessage(input.value.trim()) })

  function addMessage(text, role) {
    const div = document.createElement('div')
    div.className = `fl-msg fl-msg-${role}`
    div.textContent = text
    messages.appendChild(div)
    messages.scrollTop = messages.scrollHeight
    return div
  }

  async function sendMessage(text) {
    input.value = ''
    addMessage(text, 'user')
    chatHistory.push({ role: 'user', content: text })

    const aiDiv = addMessage('', 'ai')
    aiDiv.classList.add('streaming')

    try {
       console.log('🔵 Sending to:', `${API}/api/chat`)
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          pageTitle: document.title,
          focusScore: sessionScore,
        }),
      })
      console.log('🟢 Response status:', res.status)

            if (!res.ok) {
        const errText = await res.text()
        console.error('🔴 API Error:', res.status, errText)
        aiDiv.textContent = `Error ${res.status}: ${errText}`
        aiDiv.classList.remove('streaming')
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const { text } = JSON.parse(line.slice(6))
              fullText += text
              aiDiv.textContent = fullText
              aiDiv.classList.add('streaming')
              messages.scrollTop = messages.scrollHeight
            } catch {}
          }
        }
      }

      aiDiv.classList.remove('streaming')
      chatHistory.push({ role: 'assistant', content: fullText })
    } catch (err) {
      console.error('🔴 Fetch failed:', err)
      aiDiv.textContent = 'Could not reach AI tutor. Check your connection.'
      aiDiv.classList.remove('streaming')
    }
  }

  // Auto-open if score is low
  chrome.storage.local.get(['fl_score'], ({ fl_score }) => {
    if (fl_score && fl_score < 60) {
      isOpen = true
      panel.classList.add('open')
      alert.style.display = 'block'
      badge.textContent = `Score ${fl_score}`
      sessionScore = fl_score
    }
  })

  chrome.storage.onChanged.addListener(({ fl_score }) => {
    if (fl_score) {
      badge.textContent = `Score ${fl_score.newValue}`
      sessionScore = fl_score.newValue
    }
  })
})()
