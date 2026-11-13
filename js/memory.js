// memory.js — 长期记忆 / 轻量海马体
// 依赖：db.js, settings.js, wechat.js 可选

(function() {
  var DEFAULT_SETTINGS = {
    enabled: true,
    summarizeEvery: 30,
    injectLimit: 12,
    embeddingEnabled: false,
    decayStrength: 'medium',
    lastSummarizedMessageId: 0
  }
  var LAMBDA_MAP = { low: 0.02, medium: 0.04, high: 0.08 }
  var STATUS_LABEL = { active: '活跃', sleeping: '沉睡', archived: '归档' }
  var ROLE_SUBTITLE_DEFAULT = '于是我们建立羁绊'
  var _launchFilter = null

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function clamp(n, min, max, fallback) {
    var v = parseFloat(n)
    if (!Number.isFinite(v)) return fallback
    return Math.max(min, Math.min(max, v))
  }

  function normalizeSettings(value) {
    return Object.assign({}, DEFAULT_SETTINGS, value || {}, {
      enabled: value?.enabled !== false,
      summarizeEvery: Math.max(1, parseInt(value?.summarizeEvery || DEFAULT_SETTINGS.summarizeEvery, 10) || DEFAULT_SETTINGS.summarizeEvery),
      injectLimit: Math.max(1, parseInt(value?.injectLimit || DEFAULT_SETTINGS.injectLimit, 10) || DEFAULT_SETTINGS.injectLimit),
      embeddingEnabled: !!value?.embeddingEnabled,
      decayStrength: LAMBDA_MAP[value?.decayStrength] ? value.decayStrength : DEFAULT_SETTINGS.decayStrength,
      lastSummarizedMessageId: parseInt(value?.lastSummarizedMessageId || 0, 10) || 0
    })
  }

  async function getSettings(chatId) {
    var row = await db.config.get('chatLongMemory_' + chatId)
    return normalizeSettings(row && row.value)
  }

  async function saveSettings(chatId, patch) {
    var current = await getSettings(chatId)
    var next = normalizeSettings(Object.assign({}, current, patch || {}))
    await db.config.put({ key: 'chatLongMemory_' + chatId, value: next })
    return next
  }

  function formatTime(ts) {
    if (!ts) return '从未'
    var d = new Date(ts)
    if (isNaN(d.getTime())) return '未知'
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  function isValidTimestamp(value) {
    var timestamp = Number(value)
    return Number.isFinite(timestamp) && timestamp > 0
  }

  function formatDateTimeLocal(ts) {
    if (!isValidTimestamp(ts)) return ''
    var d = new Date(Number(ts))
    var pad = function(value) { return String(value).padStart(2, '0') }
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
  }

  function getInitial(name) {
    var text = String(name || '').trim()
    return text ? Array.from(text)[0] : '?'
  }

  function getCharName(c, fallback) {
    return (c && (c.wechatName || c.nick || c.name)) || fallback || '未知'
  }

  function getCharAvatar(c) {
    return (c && (c.wechatAvatar || c.avatar)) || ''
  }

  function buildRoundAvatar(avatar, name, className) {
    var safeName = esc(name || '')
    var inner = avatar
      ? '<img src="' + esc(avatar) + '" alt="' + safeName + '">'
      : '<span class="memory-avatar-placeholder">' + esc(getInitial(name)) + '</span>'
    return '<span class="' + (className || 'memory-avatar') + '">' + inner + '</span>'
  }

  async function getMemorySelfProfile(uid) {
    if (!uid) return { avatar: '' }
    var row = await db.config.get('wechatSelfProfile_' + uid)
    return Object.assign({ avatar: '' }, row && row.value || {})
  }

  function tokenize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\u4e00-\u9fa5]+/gu, ' ')
      .split(/\s+/)
      .filter(function(w) { return w && w.length > 1 })
  }

  function cosineSimilarity(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || !a.length || a.length !== b.length) return 0
    var dot = 0, an = 0, bn = 0
    for (var i = 0; i < a.length; i++) {
      dot += a[i] * b[i]
      an += a[i] * a[i]
      bn += b[i] * b[i]
    }
    if (!an || !bn) return 0
    return dot / (Math.sqrt(an) * Math.sqrt(bn))
  }

  function getDecayScore(memory, settings) {
    if (memory.status === 'archived') return 0
    var now = Date.now()
    var last = memory.lastAccessedAt || memory.updatedAt || memory.createdAt || now
    var days = Math.max(0, (now - last) / 86400000)
    var lambda = LAMBDA_MAP[settings?.decayStrength] || LAMBDA_MAP.medium
    var importance = clamp(memory.importance, 1, 10, 5)
    var accessCount = parseInt(memory.accessCount || 0, 10) || 0
    var arousal = clamp(memory.arousal, 0, 1, 0)
    return importance * Math.pow(accessCount + 1, 0.3) * Math.exp(-lambda * days) * (1 + arousal * 0.5)
  }

  function getKeywordScore(memory, queryText) {
    var text = String(queryText || '').toLowerCase()
    var keywords = Array.isArray(memory.keywords) ? memory.keywords : []
    var keywordHits = keywords.filter(function(k) { return k && text.includes(String(k).toLowerCase()) }).length
    var queryTokens = tokenize(queryText)
    var memoryTokens = new Set(tokenize([memory.title, memory.content, keywords.join(' ')].join(' ')))
    var tokenHits = queryTokens.filter(function(t) { return memoryTokens.has(t) }).length
    return Math.min(1, keywordHits * 0.35 + tokenHits * 0.12)
  }

  function getEmotionScore(memory) {
    var valence = Math.abs(clamp(memory.valence, -1, 1, 0))
    var arousal = clamp(memory.arousal, 0, 1, 0)
    return Math.min(1, valence * 0.4 + arousal * 0.6)
  }
// ===== 粘贴位置：memory.js 里，"async function getEmbeddingConfig() {" 这一行的正上方 =====
// （旧的 getEmbeddingConfig 先不删，只把它的名字改成 getEmbeddingConfigOld，见说明）

// 向量专用 API：优先使用在记忆长廊里单独配置的；没配的话，退回旧的读取方式
async function getEmbeddingConfig() {
  var rows = await Promise.all([
    db.config.get('embeddingApiBaseUrl'),
    db.config.get('embeddingApiKey'),
    db.config.get('embeddingApiModel')
  ])
  var own = {
    url: rows[0] && rows[0].value || '',
    key: rows[1] && rows[1].value || '',
    model: rows[2] && rows[2].value || '',
    source: '向量专用 API'
  }
  if (own.url && own.key && own.model) return own
  return await getEmbeddingConfigOld()
}

// 向量 API 配置页
async function openEmbeddingApiConfigPage(memoryPage) {
  var oldPage = document.getElementById('memory-embedding-config-page')
  if (oldPage) oldPage.remove()
  var rows = await Promise.all([
    db.config.get('embeddingApiBaseUrl'),
    db.config.get('embeddingApiKey'),
    db.config.get('embeddingApiModel')
  ])
  var cfg = {
    url: rows[0] && rows[0].value || '',
    key: rows[1] && rows[1].value || '',
    model: rows[2] && rows[2].value || ''
  }
  var html = `
    <div class="setting-section">
      <div class="api-form memory-api-form">
        <div class="memory-api-desc">
          向量专用 API，只用来给记忆生成向量。需要支持 /embeddings 接口，填 embedding 模型（例如 qwen3-embedding-8b）。Base URL 一般以 /v1 结尾。
        </div>
        <label class="form-label">Base URL</label>
        <input class="input-field" id="emb-api-base-url" placeholder="https://xxx.com/v1" value="${esc(cfg.url)}">
        <label class="form-label">API Key</label>
        <div class="input-with-toggle">
          <input class="input-field" id="emb-api-key" type="password" autocomplete="off" placeholder="sk-..." value="${esc(cfg.key)}">
          <button class="btn-text-toggle" id="emb-api-key-toggle" type="button">显示</button>
        </div>
        <label class="form-label">向量模型</label>
        <input class="input-field" id="emb-api-model" placeholder="例如 qwen3-embedding-8b" value="${esc(cfg.model)}">
        <button class="btn-pill btn-full" id="emb-api-save" type="button">保存并测试</button>
        <button class="btn-ghost btn-full btn-text-danger memory-api-clear" id="emb-api-clear" type="button">清除配置</button>
      </div>
    </div>`
  var page = buildSubPage('memory-embedding-config-page', '向量 API', html)
  openSubPage(page)

  var keyInput = page.querySelector('#emb-api-key')
  var keyToggle = page.querySelector('#emb-api-key-toggle')
  keyToggle.addEventListener('click', function() {
    var hidden = keyInput.type === 'password'
    keyInput.type = hidden ? 'text' : 'password'
    keyToggle.textContent = hidden ? '隐藏' : '显示'
  })
  page.querySelector('#emb-api-save').addEventListener('click', async function(e) {
    var btn = e.currentTarget
    var url = String(page.querySelector('#emb-api-base-url').value || '').trim().replace(/\/+$/, '')
    var key = String(keyInput.value || '').trim()
    var model = String(page.querySelector('#emb-api-model').value || '').trim()
    if (!url || !key || !model) { window.toast && window.toast('请把 Base URL、Key、模型都填上'); return }
    btn.disabled = true
    try {
      await Promise.all([
        db.config.put({ key: 'embeddingApiBaseUrl', value: url }),
        db.config.put({ key: 'embeddingApiKey', value: key }),
        db.config.put({ key: 'embeddingApiModel', value: model })
      ])
      await testEmbedding()
      await renderMemoryPage(memoryPage)
    } finally {
      btn.disabled = false
    }
  })
  page.querySelector('#emb-api-clear').addEventListener('click', async function() {
    if (!confirm('清除向量专用 API 配置？')) return
    await Promise.all([
      db.config.delete('embeddingApiBaseUrl'),
      db.config.delete('embeddingApiKey'),
      db.config.delete('embeddingApiModel')
    ])
    page.querySelector('#emb-api-base-url').value = ''
    keyInput.value = ''
    page.querySelector('#emb-api-model').value = ''
    window.toast && window.toast('已清除')
    await renderMemoryPage(memoryPage)
  })
}

// ===== 粘贴位置：memory.js 里，"async function getEmbeddingConfig() {" 这一行的正上方 =====
// （旧的 getEmbeddingConfig 先不删，只把它的名字改成 getEmbeddingConfigOld，见说明）

// 向量专用 API：优先使用在记忆长廊里单独配置的；没配的话，退回旧的读取方式
async function getEmbeddingConfig() {
  var rows = await Promise.all([
    db.config.get('embeddingApiBaseUrl'),
    db.config.get('embeddingApiKey'),
    db.config.get('embeddingApiModel')
  ])
  var own = {
    url: rows[0] && rows[0].value || '',
    key: rows[1] && rows[1].value || '',
    model: rows[2] && rows[2].value || '',
    source: '向量专用 API'
  }
  if (own.url && own.key && own.model) return own
  return await getEmbeddingConfigOld()
}

// 向量 API 配置页
async function openEmbeddingApiConfigPage(memoryPage) {
  var oldPage = document.getElementById('memory-embedding-config-page')
  if (oldPage) oldPage.remove()
  var rows = await Promise.all([
    db.config.get('embeddingApiBaseUrl'),
    db.config.get('embeddingApiKey'),
    db.config.get('embeddingApiModel')
  ])
  var cfg = {
    url: rows[0] && rows[0].value || '',
    key: rows[1] && rows[1].value || '',
    model: rows[2] && rows[2].value || ''
  }
  var html = `
    <div class="setting-section">
      <div class="api-form memory-api-form">
        <div class="memory-api-desc">
          向量专用 API，只用来给记忆生成向量。需要支持 /embeddings 接口，填 embedding 模型（例如 qwen3-embedding-8b）。Base URL 一般以 /v1 结尾。
        </div>
        <label class="form-label">Base URL</label>
        <input class="input-field" id="emb-api-base-url" placeholder="https://xxx.com/v1" value="${esc(cfg.url)}">
        <label class="form-label">API Key</label>
        <div class="input-with-toggle">
          <input class="input-field" id="emb-api-key" type="password" autocomplete="off" placeholder="sk-..." value="${esc(cfg.key)}">
          <button class="btn-text-toggle" id="emb-api-key-toggle" type="button">显示</button>
        </div>
        <label class="form-label">向量模型</label>
        <input class="input-field" id="emb-api-model" placeholder="例如 qwen3-embedding-8b" value="${esc(cfg.model)}">
        <button class="btn-pill btn-full" id="emb-api-save" type="button">保存并测试</button>
        <button class="btn-ghost btn-full btn-text-danger memory-api-clear" id="emb-api-clear" type="button">清除配置</button>
      </div>
    </div>`
  var page = buildSubPage('memory-embedding-config-page', '向量 API', html)
  openSubPage(page)

  var keyInput = page.querySelector('#emb-api-key')
  var keyToggle = page.querySelector('#emb-api-key-toggle')
  keyToggle.addEventListener('click', function() {
    var hidden = keyInput.type === 'password'
    keyInput.type = hidden ? 'text' : 'password'
    keyToggle.textContent = hidden ? '隐藏' : '显示'
  })
  page.querySelector('#emb-api-save').addEventListener('click', async function(e) {
    var btn = e.currentTarget
    var url = String(page.querySelector('#emb-api-base-url').value || '').trim().replace(/\/+$/, '')
    var key = String(keyInput.value || '').trim()
    var model = String(page.querySelector('#emb-api-model').value || '').trim()
    if (!url || !key || !model) { window.toast && window.toast('请把 Base URL、Key、模型都填上'); return }
    btn.disabled = true
    try {
      await Promise.all([
        db.config.put({ key: 'embeddingApiBaseUrl', value: url }),
        db.config.put({ key: 'embeddingApiKey', value: key }),
        db.config.put({ key: 'embeddingApiModel', value: model })
      ])
      await testEmbedding()
      await renderMemoryPage(memoryPage)
    } finally {
      btn.disabled = false
    }
  })
  page.querySelector('#emb-api-clear').addEventListener('click', async function() {
    if (!confirm('清除向量专用 API 配置？')) return
    await Promise.all([
      db.config.delete('embeddingApiBaseUrl'),
      db.config.delete('embeddingApiKey'),
      db.config.delete('embeddingApiModel')
    ])
    page.querySelector('#emb-api-base-url').value = ''
    keyInput.value = ''
    page.querySelector('#emb-api-model').value = ''
    window.toast && window.toast('已清除')
    await renderMemoryPage(memoryPage)
  })
}

// ===== 同样粘贴在 memory.js 里（放在上面两个函数的下面就行）：给旧记忆补算向量 =====
// 只处理未归档、还没有向量的记忆；范围跟随当前页面选中的账号 / 角色。
// 每条记忆请求一次向量接口；连续失败 3 次会自动停止，已算好的会保留。
async function backfillEmbeddings(page, btn) {
  var state = page._memoryState || {}
  if (!state.ownerUid || page._memoryBackfilling) return
  var rows = await db.memories.where('ownerUid').equals(state.ownerUid).filter(function(m) {
    if (m.status === 'archived') return false
    if (state.charId && parseInt(m.charId, 10) !== parseInt(state.charId, 10)) return false
    return !Array.isArray(m.embedding) || !m.embedding.length
  }).toArray()
  if (!rows.length) { window.toast && window.toast('没有需要补算的记忆'); return }
  if (!confirm('将给 ' + rows.length + ' 条记忆补算向量，每条会请求一次向量接口。继续？')) return
  page._memoryBackfilling = true
  var oldHtml = btn.innerHTML
  btn.disabled = true
  var done = 0
  var failedInRow = 0
  var lastError = ''
  for (var i = 0; i < rows.length; i++) {
    btn.textContent = '补算中 ' + (i + 1) + '/' + rows.length
    try {
      var emb = await createEmbedding(rows[i].title + '\n' + rows[i].content)
      await db.memories.update(rows[i].id, { embedding: emb })
      done++
      failedInRow = 0
    } catch (e) {
      failedInRow++
      lastError = e.message || String(e)
      if (failedInRow >= 3) break
    }
  }
  page._memoryBackfilling = false
  btn.disabled = false
  btn.innerHTML = oldHtml
  window.toast && window.toast('已补算 ' + done + ' 条' + (failedInRow >= 3 ? '，连续失败已停止：' + lastError.slice(0, 80) : ''))
  await renderMemoryPage(page)
}


  async function getEmbeddingConfigOld() {
    var rows = await Promise.all([
      db.config.get('subapiBaseUrl'), db.config.get('subapiKey'), db.config.get('subapiModel'),
      db.config.get('apiBaseUrl'), db.config.get('apiKey'), db.config.get('apiModel')
    ])
    var sub = { url: rows[0]?.value || '', key: rows[1]?.value || '', model: rows[2]?.value || '' }
    var primary = { url: rows[3]?.value || '', key: rows[4]?.value || '', model: rows[5]?.value || '' }
        return (sub.url && sub.key && sub.model)
      ? Object.assign(sub, { source: '副API' })
      : Object.assign(primary, { source: '主API（聊天模型）' })
  }

  async function createEmbedding(input) {
    var cfg = await getEmbeddingConfig()
    if (!cfg.url || !cfg.key || !cfg.model) throw new Error('向量 API 未配置')
       var endpoint = String(cfg.url).replace(/\/$/, '') + '/embeddings'
    var where = '（' + (cfg.source || '') + ' · ' + endpoint + ' · 模型 ' + cfg.model + '）'
    var res
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.key },
        body: JSON.stringify({ model: cfg.model, input: input })
      })
    } catch (netErr) {
      throw new Error('请求失败，可能是网络或跨域：' + (netErr.message || netErr) + where)
    }
    var text = await res.text()
    var json = {}
    try { json = text ? JSON.parse(text) : {} } catch (_) {}
    if (!res.ok) throw new Error((json?.error?.message || json?.message || ('HTTP ' + res.status + ' ' + String(text).slice(0, 80))) + where)
    var embedding = json?.data?.[0]?.embedding
    if (!Array.isArray(embedding)) throw new Error('向量接口未返回 embedding 数组')
    await db.config.put({ key: 'memoryEmbeddingStatus', value: { ok: true, testedAt: Date.now(), dim: embedding.length, error: '' } })
    return embedding
  }

  async function testEmbedding() {
    try {
      var embedding = await createEmbedding('弯弯长期记忆向量测试')
      window.toast && window.toast('向量接口可用：' + embedding.length + ' 维')
      return true
    } catch (e) {
      await db.config.put({ key: 'memoryEmbeddingStatus', value: { ok: false, testedAt: Date.now(), error: e.message || String(e) } })
      window.toast && window.toast('向量不可用：' + String(e.message || e).slice(0, 120))
      return false
    }
  }

  function normalizeMemoryApiUrl(url) {
    return String(url || '').trim().replace(/\/+$/, '')
  }

  function readMemoryApiForm(page) {
    var get = function(id) {
      var el = page.querySelector('#' + id)
      return el ? String(el.value || '').trim() : ''
    }
    var cfg = {
      url: normalizeMemoryApiUrl(get('memory-api-base-url')),
      key: get('memory-api-key'),
      model: get('memory-api-model-input')
    }
    cfg.complete = !!(cfg.url && cfg.key && cfg.model)
    return cfg
  }

  function validateMemoryApiForm(cfg) {
    var missing = []
    if (!cfg.url) missing.push('Base URL')
    if (!cfg.key) missing.push('API Key')
    if (!cfg.model) missing.push('模型')
    if (missing.length) throw new Error('请填写：' + missing.join('、'))
  }

  async function refreshMemoryApiStatus(page) {
    if (!page || !page.isConnected) return
    await renderMemoryPage(page)
  }

  async function openMemoryApiConfigPage(memoryPage) {
    var oldPage = document.getElementById('memory-api-config-page')
    if (oldPage) oldPage.remove()
    var cfg = window.loadMemoryApiConfig
      ? await window.loadMemoryApiConfig()
      : { url: '', key: '', model: '', complete: false }
    var html = `
      <div class="setting-section">
        <div class="api-form memory-api-form">
          <div class="memory-api-desc">
            专属记忆总结 API，仅用于微信聊天记忆总结、线下见面记忆总结。
          </div>
          <label class="form-label">Base URL</label>
          <input class="input-field" id="memory-api-base-url" placeholder="https://api.openai.com/v1" value="${esc(cfg.url)}">
          <label class="form-label">API Key</label>
          <div class="input-with-toggle">
            <input class="input-field" id="memory-api-key" type="password" autocomplete="off" placeholder="sk-..." value="${esc(cfg.key)}">
            <button class="btn-text-toggle" id="memory-api-key-toggle" type="button">显示</button>
          </div>
          <label class="form-label">模型</label>
          <input class="input-field" id="memory-api-model-input" placeholder="手动输入模型名，例如 gpt-4o-mini" value="${esc(cfg.model)}">
          <div class="model-row">
            <select class="input-field" id="memory-api-model">
              <option value="">拉取后选择模型</option>
              ${cfg.model ? `<option value="${esc(cfg.model)}" selected>${esc(cfg.model)}</option>` : ''}
            </select>
            <button class="btn-ghost btn-sm" id="memory-api-load-models" type="button">获取</button>
          </div>
          <div class="api-test-row">
            <button class="btn-ghost" id="memory-api-test" type="button">连接测试</button>
          </div>
          <button class="btn-pill btn-full" id="memory-api-save" type="button">保存记忆 API</button>
          <button class="btn-ghost btn-full btn-text-danger memory-api-clear" id="memory-api-clear" type="button">清除配置并使用默认 API</button>
        </div>
      </div>`
    var page = buildSubPage('memory-api-config-page', '记忆 API', html)
    openSubPage(page)

    var keyInput = page.querySelector('#memory-api-key')
    var keyToggle = page.querySelector('#memory-api-key-toggle')
    keyToggle.addEventListener('click', function() {
      var hidden = keyInput.type === 'password'
      keyInput.type = hidden ? 'text' : 'password'
      keyToggle.textContent = hidden ? '隐藏' : '显示'
    })
    page.querySelector('#memory-api-model').addEventListener('change', function(e) {
      if (e.target.value) page.querySelector('#memory-api-model-input').value = e.target.value
    })
    page.querySelector('#memory-api-load-models').addEventListener('click', async function(e) {
      var btn = e.currentTarget
      var formCfg = readMemoryApiForm(page)
      if (!formCfg.url) { window.toast && window.toast('请先填写 Base URL'); return }
      btn.disabled = true
      btn.textContent = '获取中...'
      try {
        var res = await fetch(formCfg.url + '/models', {
          headers: { Authorization: 'Bearer ' + formCfg.key }
        })
        var text = await res.text()
        var json = text ? JSON.parse(text) : {}
        if (!res.ok) throw new Error(json?.error?.message || json?.message || ('HTTP ' + res.status))
        var models = Array.isArray(json.data)
          ? json.data.map(function(item) { return item && item.id }).filter(Boolean)
          : []
        var current = page.querySelector('#memory-api-model-input').value.trim()
        var select = page.querySelector('#memory-api-model')
        var options = ['<option value="">拉取后选择模型</option>']
        models.forEach(function(model) {
          options.push(`<option value="${esc(model)}" ${model === current ? 'selected' : ''}>${esc(model)}</option>`)
        })
        if (current && models.indexOf(current) < 0) {
          options.push(`<option value="${esc(current)}" selected>${esc(current)}</option>`)
        }
        select.innerHTML = options.join('')
        window.toast && window.toast('已加载 ' + models.length + ' 个模型')
      } catch (e2) {
        window.toast && window.toast('获取模型失败：' + (e2.message || String(e2)))
      } finally {
        btn.disabled = false
        btn.textContent = '获取'
      }
    })
    page.querySelector('#memory-api-test').addEventListener('click', async function(e) {
      var btn = e.currentTarget
      var oldText = btn.textContent
      btn.disabled = true
      btn.textContent = '测试中...'
      try {
        var formCfg = readMemoryApiForm(page)
        validateMemoryApiForm(formCfg)
        var json = await window.runTrackedChatCompletion(formCfg, {
          model: formCfg.model,
          messages: [{ role: 'user', content: '请只回复：连接成功' }]
        }, '记忆专属 API 连接测试')
        var message = json?.choices?.[0]?.message
        if (!message || (message.content == null && !message.reasoning_content)) {
          throw new Error('接口已响应，但没有返回有效的聊天内容')
        }
        window.toast && window.toast('记忆 API 连接成功')
      } catch (e2) {
        window.toast && window.toast('连接测试失败：' + (e2.message || String(e2)))
      } finally {
        btn.disabled = false
        btn.textContent = oldText
      }
    })
    page.querySelector('#memory-api-save').addEventListener('click', async function(e) {
      var btn = e.currentTarget
      try {
        var formCfg = readMemoryApiForm(page)
        validateMemoryApiForm(formCfg)
        btn.disabled = true
        await Promise.all([
          db.config.put({ key: 'memoryApiBaseUrl', value: formCfg.url }),
          db.config.put({ key: 'memoryApiKey', value: formCfg.key }),
          db.config.put({ key: 'memoryApiModel', value: formCfg.model })
        ])
        window._memoryApiConfigCache = null
        window.toast && window.toast('记忆 API 已保存')
        await refreshMemoryApiStatus(memoryPage)
      } catch (e2) {
        window.toast && window.toast('保存失败：' + (e2.message || String(e2)))
      } finally {
        btn.disabled = false
      }
    })
    page.querySelector('#memory-api-clear').addEventListener('click', async function(e) {
      if (!confirm('清除记忆专属 API 配置并恢复使用默认 API？')) return
      var btn = e.currentTarget
      btn.disabled = true
      try {
        await Promise.all([
          db.config.delete('memoryApiBaseUrl'),
          db.config.delete('memoryApiKey'),
          db.config.delete('memoryApiModel')
        ])
        window._memoryApiConfigCache = null
        page.querySelector('#memory-api-base-url').value = ''
        page.querySelector('#memory-api-key').value = ''
        page.querySelector('#memory-api-model-input').value = ''
        page.querySelector('#memory-api-model').innerHTML = '<option value="">拉取后选择模型</option>'
        window.toast && window.toast('已恢复使用默认 API')
        await refreshMemoryApiStatus(memoryPage)
      } catch (e2) {
        window.toast && window.toast('清除失败：' + (e2.message || String(e2)))
      } finally {
        btn.disabled = false
      }
    })
  }

  function getMemoryApiStatusText(cfg) {
    return cfg && cfg.complete
      ? '专属 API · ' + cfg.model
      : '未配置专属 API'
  }

  function buildSummaryPrompt(messages) {
    var lines = messages.map(function(m) {
      var speaker = m.role === 'assistant' ? '角色' : '用户'
      return speaker + '：' + String(m.content || '').replace(/\s+/g, ' ').slice(0, 800)
    }).join('\n')
    return `你是一个长期记忆整理器。请根据下面的聊天记录，提取适合长期保存的记忆。

要求：
1. 使用第三人称叙述。
2. 客观平实：只陈述发生了什么、谁表达了什么、双方形成了什么关系信息或偏好信息。
3. 禁止使用强烈情绪词汇，例如“极度愤怒”“痛彻心扉”“欣喜若狂”等。
4. 不要价值升华，不要写感悟，不要总结人生意义。
5. 禁止加入聊天记录中没有出现的信息。
6. 标题应尽量简短；内容应控制在150字以内，适合未来角色回复时参考。

请返回合法 JSON，不要输出 Markdown，不要输出 JSON 以外的文字。

JSON 格式：
{
  "memories": [
    {
      "title": "简短标题",
      "content": "第三人称、客观平实的记忆内容，150字以内",
      "keywords": ["关键词1", "关键词2"],
      "valence": 0,
      "arousal": 0.3,
      "importance": 5
    }
  ]
}

字段说明：
- title：尽量简短，用于快速识别这条记忆。
- content：第三人称客观陈述，150字以内，禁止夸张、抒情、升华。
- keywords：用于后续检索的关键词。
- valence：情感效价，-1 到 1。负数表示负向，0 表示中性，正数表示正向。
- arousal：唤醒度，0 到 1。越接近平静越低，越涉及冲突、紧张、强烈偏好越高。
- importance：重要度，1 到 10。长期关系事实、稳定偏好、身份背景更高；临时闲聊更低。

聊天记录：
${lines}`
  }

  function buildMeetingSummaryPrompt(messages) {
    var lines = messages.map(function(m) {
      var speaker = m.role === 'assistant' ? '角色' : '用户'
      return speaker + '：' + String(m.content || '').replace(/\s+/g, ' ').slice(0, 800)
    }).join('\n')
    return `你是一个线下见面记忆整理器。请根据下面的见面记录，提取适合长期保存的记忆。

要求：
1. 使用第三人称叙述。
2. 客观平实：只记录双方在线下发生的重要事件、表达的偏好、形成的约定或关系变化。
3. 区分已经发生的事件和尚未完成的计划，不要将计划写成事实。
4. 禁止使用强烈情绪词汇，不要进行文学化描写。
5. 不要价值升华，不要写感悟，不要总结人生意义。
6. 禁止加入见面记录中没有出现的信息。
7. 不同事件或信息应拆分为多条记忆。
8. 标题应尽量简短；内容应控制在150字以内，适合未来互动时参考。

请返回合法 JSON，不要输出 Markdown，不要输出 JSON 以外的文字。

JSON 格式：
{
  "memories": [
    {
      "title": "简短标题",
      "content": "第三人称、客观平实的记忆内容，150字以内",
      "keywords": ["关键词1", "关键词2"],
      "valence": 0,
      "arousal": 0.3,
      "importance": 5
    }
  ]
}

字段说明：
- title：尽量简短，用于快速识别这条记忆。
- content：第三人称客观陈述，150字以内，禁止夸张、抒情、升华。
- keywords：用于后续检索的关键词。
- valence：情感效价，-1 到 1。负数表示负向，0 表示中性，正数表示正向。
- arousal：唤醒度，0 到 1。越接近平静越低，越涉及冲突、紧张、强烈偏好越高。
- importance：重要度，1 到 10。长期关系事实、稳定偏好、身份背景更高；临时闲聊更低。

见面记录：
${lines}`
  }

  function extractJson(text) {
    var s = String(text || '').trim()
    var match = s.match(/\{[\s\S]*\}/)
    if (match) s = match[0]
    return JSON.parse(s)
  }

  // 提示词让模型写 150 字以内，但模型常常略超；这里放宽上限，避免句子写到一半被截断。手动编辑同样适用
  var MEMORY_CONTENT_MAX = 600

  function normalizeMemory(raw, meta) {
    var title = String(raw?.title || '').trim().slice(0, 30) || '未命名记忆'
    var content = String(raw?.content || '').trim().slice(0, MEMORY_CONTENT_MAX)
    if (!content) return null
    var now = isValidTimestamp(meta.createdAt) ? Number(meta.createdAt) : Date.now()
    return {
      ownerUid: meta.ownerUid,
      charId: meta.charId,
      chatId: meta.chatId,
      title: title,
      content: content,
      keywords: Array.isArray(raw.keywords) ? raw.keywords.map(function(k) { return String(k).trim() }).filter(Boolean).slice(0, 8) : [],
      valence: clamp(raw.valence, -1, 1, 0),
      arousal: clamp(raw.arousal, 0, 1, 0.3),
      importance: clamp(raw.importance, 1, 10, 5),
      embedding: null,
      status: 'active',
      sourceMsgStartId: meta.fromMsgId,
      sourceMsgEndId: meta.toMsgId,
      sourceAt: isValidTimestamp(meta.sourceAt) ? Number(meta.sourceAt) : null,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: null,
      accessCount: 0
    }
  }

  async function runSummary(chatId, charId, ownerUid, options) {
    options = options || {}
    if (!window.callMemoryAI || !db.memories || !ownerUid || !chatId || !charId) {
      return { ok: false, skipped: true, reason: '记忆系统未就绪', memoryCount: 0, messageCount: 0 }
    }
    var settings = await getSettings(chatId)
    if (!options.force && !settings.enabled) {
      return { ok: false, skipped: true, reason: '自动总结未开启', memoryCount: 0, messageCount: 0 }
    }
    var msgs = await db.messages.where('chatId').equals(chatId).sortBy('createdAt')
    var fresh = msgs.filter(function(m) { return m.id > settings.lastSummarizedMessageId && !m.callRecordId })
    if (!fresh.length) {
      return { ok: false, skipped: true, reason: '没有可总结的新消息', memoryCount: 0, messageCount: 0 }
    }
    if (!options.force && fresh.length < settings.summarizeEvery) {
      return { ok: false, skipped: true, reason: '未达到自动总结条数', memoryCount: 0, messageCount: fresh.length }
    }
    var fromMsgId = fresh[0].id
    var toMsgId = fresh[fresh.length - 1].id
    var sourceAt = isValidTimestamp(fresh[fresh.length - 1].createdAt) ? Number(fresh[fresh.length - 1].createdAt) : null
    var prompt = buildSummaryPrompt(fresh)
    var raw = await window.callMemoryAI([{ role: 'user', content: prompt }], { responseFormat: 'json_object', temperature: await window.getAITemperaturePreset('summaryMode') })
    var parsed = extractJson(raw)
    var memories = Array.isArray(parsed.memories) ? parsed.memories : []
    var rows = []
    var embeddingFailed = false
    for (var i = 0; i < memories.length; i++) {
      var row = normalizeMemory(memories[i], {
        ownerUid: ownerUid, charId: charId, chatId: chatId,
        fromMsgId: fromMsgId, toMsgId: toMsgId,
        sourceAt: sourceAt
      })
      if (!row) continue
      row.sourceType = 'wechat'
      if (settings.embeddingEnabled) {
        try { row.embedding = await createEmbedding(row.title + '\n' + row.content) }
        catch (e) {
          embeddingFailed = true
          console.warn('[memory] 生成向量失败，降级保存：', e)
        }
      }
      rows.push(row)
    }
    if (rows.length) await db.memories.bulkAdd(rows)
    await db.memoryRuns.add({
      ownerUid: ownerUid,
      charId: charId,
      chatId: chatId,
      fromMsgId: fromMsgId,
      toMsgId: toMsgId,
      sourceType: 'wechat',
      sourceAt: sourceAt,
      createdAt: Date.now(),
      memoryCount: rows.length,
      mode: options.force ? 'manual' : 'auto'
    })
    await saveSettings(chatId, { lastSummarizedMessageId: toMsgId })
    await db.config.put({ key: 'memoryLastSummaryAt', value: Date.now() })
    return { ok: true, skipped: false, memoryCount: rows.length, messageCount: fresh.length, embeddingFailed: embeddingFailed }
  }

  async function summarizeIfNeeded(chatId, charId, ownerUid) {
    try {
      return await runSummary(chatId, charId, ownerUid, { force: false })
    } catch (e) {
      console.warn('[memory] 自动总结失败：', e)
      await db.config.put({ key: 'memoryLastError', value: e.message || String(e) })
      return { ok: false, skipped: false, error: e.message || String(e), memoryCount: 0, messageCount: 0 }
    }
  }

  async function summarizeNow(chatId, charId, ownerUid) {
    return await runSummary(chatId, charId, ownerUid, { force: true })
  }

  async function summarizeMeeting(chatId, charId, ownerUid, sessionId, messages, endedAt) {
    if (!window.callMemoryAI || !db.memories || !db.memoryRuns || !ownerUid || !chatId || !charId || !sessionId) {
      throw new Error('记忆系统未就绪')
    }
    var source = Array.isArray(messages) ? messages.filter(function(m) { return String(m.content || '').trim() }) : []
    if (!source.length) throw new Error('没有可总结的见面记录')

    var existingRun = await db.memoryRuns.where('chatId').equals(chatId).filter(function(run) {
      return run.ownerUid === ownerUid && run.charId === charId && run.sourceSessionId === sessionId && run.mode === 'meet'
    }).first()
    if (existingRun) {
      return { ok: true, skipped: true, alreadySummarized: true, memoryCount: existingRun.memoryCount || 0, messageCount: source.length }
    }
    var existingMemories = await db.memories.where('chatId').equals(chatId).filter(function(memory) {
      return memory.ownerUid === ownerUid && memory.charId === charId && memory.sourceSessionId === sessionId
    }).toArray()
    if (existingMemories.length) {
      return { ok: true, skipped: true, alreadySummarized: true, memoryCount: existingMemories.length, messageCount: source.length }
    }

    var settings = await getSettings(chatId)
    var fromMsgId = source[0].id || 0
    var toMsgId = source[source.length - 1].id || fromMsgId
    var raw = await window.callMemoryAI([{ role: 'user', content: buildMeetingSummaryPrompt(source) }], { responseFormat: 'json_object', temperature: await window.getAITemperaturePreset('summaryMode') })
    var parsed = extractJson(raw)
    var memories = Array.isArray(parsed.memories) ? parsed.memories : []
    var rows = []
    var embeddingFailed = false
    for (var i = 0; i < memories.length; i++) {
      var row = normalizeMemory(memories[i], {
        ownerUid: ownerUid, charId: charId, chatId: chatId,
        fromMsgId: fromMsgId, toMsgId: toMsgId,
        sourceAt: Number(endedAt) || null
      })
      if (!row) continue
      row.sourceSessionId = sessionId
      row.sourceType = 'offlineMeet'
      row.sourceEndedAt = Number(endedAt) || null
      if (settings.embeddingEnabled) {
        try { row.embedding = await createEmbedding(row.title + '\n' + row.content) }
        catch (e) {
          embeddingFailed = true
          console.warn('[memory] 见面记忆生成向量失败，降级保存：', e)
        }
      }
      rows.push(row)
    }
    if (rows.length) await db.memories.bulkAdd(rows)
    await db.memoryRuns.add({
      ownerUid: ownerUid,
      charId: charId,
      chatId: chatId,
      fromMsgId: fromMsgId,
      toMsgId: toMsgId,
      sourceSessionId: sessionId,
      sourceEndedAt: Number(endedAt) || null,
      sourceType: 'offlineMeet',
      sourceAt: Number(endedAt) || null,
      createdAt: Date.now(),
      memoryCount: rows.length,
      mode: 'meet'
    })
    await db.config.put({ key: 'memoryLastSummaryAt', value: Date.now() })
    return { ok: true, skipped: false, memoryCount: rows.length, messageCount: source.length, embeddingFailed: embeddingFailed }
  }
  function buildCallSummaryPrompt(lines) {
    var text = lines.map(function(l) {
      return (l.role === 'assistant' ? '角色' : '用户') + '：' + String(l.text || '').replace(/\s+/g, ' ').slice(0, 800)
    }).join('\n')
    return `你是一个通话记忆整理器。请根据下面的电话通话记录，提取适合长期保存的记忆。

要求：
1. 使用第三人称叙述，注明这是电话里说的。
2. 客观平实：只记录通话中谈到的重要事情、表达的偏好、形成的约定或关系变化；日常寒暄不用记。
3. 禁止使用强烈情绪词汇，不要价值升华，不要写感悟。
4. 禁止加入通话记录中没有出现的信息。
5. 通话内容较多时可拆成多条，每条只讲一件事；标题尽量简短；内容150字以内。

请返回合法 JSON，不要输出 Markdown，不要输出 JSON 以外的文字。

JSON 格式：
{
  "memories": [
    {
      "title": "简短标题",
      "content": "第三人称、客观平实的记忆内容，150字以内",
      "keywords": ["关键词1", "关键词2"],
      "valence": 0,
      "arousal": 0.3,
      "importance": 5
    }
  ]
}

字段说明：
- valence：情感效价，-1 到 1。
- arousal：唤醒度，0 到 1。
- importance：重要度，1 到 10。长期关系事实、约定、重要事情更高；临时闲聊更低。

通话记录：
${text}`
  }

  // 给一通电话单独生成记忆；同一通电话内容没变就不重复生成，内容变了（续接通话）就重做
  async function summarizeCall(chatId, charId, ownerUid, recordId, options) {
    options = options || {}
    if (!window.callMemoryAI || !db.memories || !db.memoryRuns || !window.getCallRecordLines || !db.callRecords) {
      return { ok: false, skipped: true, reason: '记忆系统未就绪', memoryCount: 0 }
    }
    var record = await db.callRecords.get(Number(recordId))
    if (!record || !ownerUid) return { ok: false, skipped: true, reason: '没有通话记录', memoryCount: 0 }
    var settings = await getSettings(chatId)
    if (!options.force && !settings.enabled) return { ok: false, skipped: true, reason: '自动总结未开启', memoryCount: 0 }
    var lines = window.getCallRecordLines(record)
    if (lines.length < 2) return { ok: false, skipped: true, reason: '通话内容太少', memoryCount: 0 }
    var callId = Number(record.id)
    var oldRuns = await db.memoryRuns.where('chatId').equals(chatId).filter(function(run) {
      return Number(run.ownerUid) === Number(ownerUid) && Number(run.charId) === Number(charId) && Number(run.sourceCallId) === callId
    }).toArray()
    if (oldRuns.some(function(run) { return run.sourceCallLineCount === lines.length })) {
      return { ok: true, skipped: true, alreadySummarized: true, memoryCount: 0 }
    }
    var raw = await window.callMemoryAI([{ role: 'user', content: buildCallSummaryPrompt(lines) }], { responseFormat: 'json_object', temperature: await window.getAITemperaturePreset('summaryMode') })
    var parsed = extractJson(raw)
    var memories = Array.isArray(parsed.memories) ? parsed.memories : []
    var sourceAt = isValidTimestamp(record.createdAt) ? Number(record.createdAt) : null
    var rows = []
    for (var i = 0; i < memories.length; i++) {
      var row = normalizeMemory(memories[i], { ownerUid: ownerUid, charId: charId, chatId: chatId, fromMsgId: 0, toMsgId: 0, sourceAt: sourceAt })
      if (!row) continue
      row.sourceType = 'call'
      row.sourceCallId = callId
      if (settings.embeddingEnabled) {
        try { row.embedding = await createEmbedding(row.title + '\n' + row.content) }
        catch (e) { console.warn('[memory] 通话记忆生成向量失败，降级保存：', e) }
      }
      rows.push(row)
    }
    if (oldRuns.length) {
      var oldMems = await db.memories.filter(function(m) { return Number(m.sourceCallId) === callId && Number(m.ownerUid) === Number(ownerUid) }).toArray()
      if (oldMems.length) await db.memories.bulkDelete(oldMems.map(function(m) { return m.id }))
      await db.memoryRuns.bulkDelete(oldRuns.map(function(r) { return r.id }))
    }
    if (rows.length) await db.memories.bulkAdd(rows)
    await db.memoryRuns.add({
      ownerUid: ownerUid, charId: charId, chatId: chatId,
      fromMsgId: 0, toMsgId: 0,
      sourceCallId: callId, sourceCallLineCount: lines.length,
      sourceType: 'call', sourceAt: sourceAt,
      createdAt: Date.now(), memoryCount: rows.length, mode: 'call'
    })
    await db.config.put({ key: 'memoryLastSummaryAt', value: Date.now() })
    return { ok: true, skipped: false, memoryCount: rows.length }
  }

  // 补总结：把这个聊天里所有还没总结过的旧通话逐通补上
  async function backfillCallMemories(ownerUid, charId, chatId, onProgress) {
    var rows = (await db.callRecords.where('chatId').equals(chatId).toArray()).filter(function(r) {
      return Number(r.ownerUid) === Number(ownerUid) && Array.isArray(r.messages) && r.messages.length
    }).sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0) })
    var made = 0, skipped = 0, failed = 0
    for (var i = 0; i < rows.length; i++) {
      try {
        var res = await summarizeCall(chatId, charId, ownerUid, rows[i].id, { force: true })
        if (res.skipped) skipped++; else made += res.memoryCount
      } catch (e) { failed++; console.warn('[memory] 补总结通话失败：', e) }
      if (onProgress) onProgress(i + 1, rows.length)
    }
    return { total: rows.length, made: made, skipped: skipped, failed: failed }
  }
  function getMemoryInjectionSourceAt(memory) {
    var sourceAt = Number(memory && memory.sourceAt)
    return isValidTimestamp(sourceAt) ? sourceAt : null
  }

  async function getMemoryContext(chatId, charId, ownerUid, recentMessages) {
    if (!db.memories || !ownerUid || !chatId || !charId) return ''
    var settings = await getSettings(chatId)
    if (!settings.enabled) return ''
    var rows = await db.memories.where('chatId').equals(chatId).filter(function(m) {
      return m.ownerUid === ownerUid && m.charId === charId && m.status !== 'archived'
    }).toArray()
    if (!rows.length) return ''
    var queryText = (recentMessages || []).map(function(m) { return m.content || '' }).join(' ')
    var queryEmbedding = null
    if (settings.embeddingEnabled && rows.some(function(m) { return Array.isArray(m.embedding) })) {
      try { queryEmbedding = await createEmbedding(String(queryText || '').slice(-1500) || '当前聊天') }
      catch (e) { console.warn('[memory] 查询向量失败，降级检索：', e) }
    }
    var scored = rows.map(function(m) {
      var semanticScore = queryEmbedding ? Math.max(0, cosineSimilarity(queryEmbedding, m.embedding)) : 0
      var keywordScore = getKeywordScore(m, queryText)
      var importanceScore = clamp(m.importance, 1, 10, 5) / 10
      var emotionScore = getEmotionScore(m)
      var decayScore = Math.min(1, getDecayScore(m, settings) / 10)
      return {
        memory: m,
        score: semanticScore * 4 + keywordScore * 3 + importanceScore * 2 + emotionScore * 1.5 + decayScore
      }
    }).sort(function(a, b) { return b.score - a.score })
    var selected = scored.slice(0, settings.injectLimit).filter(function(x) { return x.score > 0.15 || x.memory.status === 'active' })
    var now = Date.now()
    await Promise.all(selected.map(function(x) {
      return db.memories.update(x.memory.id, {
        lastAccessedAt: now,
        accessCount: (parseInt(x.memory.accessCount || 0, 10) || 0) + 1,
        status: x.memory.status === 'sleeping' ? 'active' : x.memory.status
      })
    }))
    var sleepUpdates = []
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].status === 'active' && getDecayScore(rows[i], settings) < 0.8) {
        sleepUpdates.push(db.memories.update(rows[i].id, { status: 'sleeping' }))
      }
    }
    if (sleepUpdates.length) await Promise.all(sleepUpdates)
    if (!selected.length) return ''
    var orderedForInjection = selected.map(function(x, index) {
      return {
        item: x,
        originalIndex: index,
        sourceAt: getMemoryInjectionSourceAt(x.memory)
      }
    }).sort(function(a, b) {
      var aHasSourceAt = a.sourceAt != null
      var bHasSourceAt = b.sourceAt != null
      if (aHasSourceAt !== bHasSourceAt) return aHasSourceAt ? 1 : -1
      if (!aHasSourceAt) return a.originalIndex - b.originalIndex
      if (a.sourceAt !== b.sourceAt) return a.sourceAt - b.sourceAt
      return a.originalIndex - b.originalIndex
    }).map(function(entry) {
      return entry.item
    })
    return orderedForInjection.map(function(x, i) {
      var m = x.memory
      var isMeet = m.sourceType ? m.sourceType === 'offlineMeet' : !!m.sourceSessionId
      var memoryTime = getMemoryInjectionSourceAt(m)
      var sourceTime = isMeet
        ? `【线下见面｜发生时间：${memoryTime ? formatMemoryDateTime(memoryTime) : '未知'}】`
                : (m.sourceType === 'call'
          ? `【语音通话｜发生时间：${memoryTime ? formatMemoryDateTime(memoryTime) : '未知'}】`
          : `【微信聊天｜发生时间：${memoryTime ? formatMemoryDateTime(memoryTime) : '未知'}】`)
      return `${i + 1}. ${sourceTime}${m.title}：${m.content}`
    }).join('\n')
  }

  function formatMemoryDateTime(ts) {
    if (!isValidTimestamp(ts)) return '未知时间'
    var d = new Date(Number(ts))
    if (isNaN(d.getTime())) return '未知时间'
    return d.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    })
  }

  async function listMemories(filter) {
    filter = filter || {}
    var ownerUid = filter.ownerUid ? parseInt(filter.ownerUid, 10) : 0
    var charId = filter.charId ? parseInt(filter.charId, 10) : 0
    var chatId = filter.chatId ? parseInt(filter.chatId, 10) : 0
    var rows = await db.memories.toArray()
    return rows.filter(function(m) {
      if (ownerUid && parseInt(m.ownerUid, 10) !== ownerUid) return false
      if (charId && parseInt(m.charId, 10) !== charId) return false
      if (chatId && parseInt(m.chatId, 10) !== chatId) return false
      if (filter.status && m.status !== filter.status) return false
      if (filter.q) {
        var q = String(filter.q).toLowerCase()
        var hay = [m.title, m.content, (m.keywords || []).join(' ')].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    }).sort(function(a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0) })
  }

  async function openEditor(memory, page, identity) {
    var isNew = !memory
    var m = memory || {
      title: '', content: '', keywords: [], valence: 0, arousal: 0.3, importance: 5,
      status: 'active', sourceType: 'wechat', sourceAt: Date.now()
    }
    var overlay = document.createElement('div')
    overlay.className = 'sheet-overlay'
    var modal = document.createElement('div')
    modal.className = 'center-modal memory-edit-modal'
    modal.innerHTML = `
      <div class="sheet-title">${isNew ? '新增记忆' : '编辑记忆'}</div>
      <div class="memory-edit-form">
        <input class="input-field" id="mem-edit-title" placeholder="标题" value="${esc(m.title)}">
        <textarea class="input-field" id="mem-edit-content" placeholder="内容（建议 150 字以内，最多 ${MEMORY_CONTENT_MAX} 字）">${esc(m.content)}</textarea>
        <input class="input-field" id="mem-edit-keywords" placeholder="关键词，用逗号分隔" value="${esc((m.keywords || []).join(','))}">
        <label class="memory-edit-label">发生时间
          <input class="input-field" id="mem-edit-source-at" type="datetime-local" step="1" value="${esc(formatDateTimeLocal(m.sourceAt))}">
        </label>
        <div class="memory-edit-select-grid">
          <label class="memory-edit-label">来源
            <select class="input-field" id="mem-edit-source-type">
              <option value="wechat" ${m.sourceType !== 'offlineMeet' && m.sourceType !== 'call' ? 'selected' : ''}>微信</option>
              <option value="call" ${m.sourceType === 'call' ? 'selected' : ''}>通话</option>
              <option value="offlineMeet" ${m.sourceType === 'offlineMeet' ? 'selected' : ''}>线下见面</option>
            </select>
          </label>
          <label class="memory-edit-label">状态
            <select class="input-field" id="mem-edit-status">
              ${['active','sleeping','archived'].map(function(status) { return `<option value="${status}" ${m.status === status ? 'selected' : ''}>${STATUS_LABEL[status]}</option>` }).join('')}
            </select>
          </label>
        </div>
        <div class="memory-edit-grid">
          <label>效价<input class="input-field" id="mem-edit-valence" type="number" min="-1" max="1" step="0.1" value="${m.valence || 0}"></label>
          <label>唤醒<input class="input-field" id="mem-edit-arousal" type="number" min="0" max="1" step="0.1" value="${m.arousal || 0.3}"></label>
          <label>重要度<input class="input-field" id="mem-edit-importance" type="number" min="1" max="10" step="1" value="${m.importance || 5}"></label>
        </div>
      </div>
      <div class="sheet-actions">
        <button class="btn-pill btn-full" id="mem-edit-save">保存</button>
        <button class="btn-ghost btn-full" id="mem-edit-cancel">取消</button>
      </div>`
    document.getElementById('app').appendChild(overlay)
    document.getElementById('app').appendChild(modal)
    requestAnimationFrame(function() { overlay.classList.add('show'); modal.classList.add('show') })
    var close = function() {
      overlay.classList.remove('show'); modal.classList.remove('show')
      setTimeout(function() { overlay.remove(); modal.remove() }, 200)
    }
    overlay.addEventListener('click', close)
    modal.querySelector('#mem-edit-cancel').addEventListener('click', close)
    modal.querySelector('#mem-edit-save').addEventListener('click', async function() {
      var sourceAtInput = modal.querySelector('#mem-edit-source-at').value
      var sourceAt = sourceAtInput ? new Date(sourceAtInput).getTime() : null
      var patch = {
        title: modal.querySelector('#mem-edit-title').value.trim().slice(0, 30) || '未命名记忆',
        content: modal.querySelector('#mem-edit-content').value.trim().slice(0, MEMORY_CONTENT_MAX),
        keywords: modal.querySelector('#mem-edit-keywords').value.split(/[,，]/).map(function(k) { return k.trim() }).filter(Boolean),
        valence: clamp(modal.querySelector('#mem-edit-valence').value, -1, 1, 0),
        arousal: clamp(modal.querySelector('#mem-edit-arousal').value, 0, 1, 0.3),
        importance: clamp(modal.querySelector('#mem-edit-importance').value, 1, 10, 5),
        sourceAt: sourceAt,
        sourceType: ['offlineMeet', 'call'].indexOf(modal.querySelector('#mem-edit-source-type').value) >= 0 ? modal.querySelector('#mem-edit-source-type').value : 'wechat',
        status: STATUS_LABEL[modal.querySelector('#mem-edit-status').value] ? modal.querySelector('#mem-edit-status').value : 'active',
        updatedAt: Date.now()
      }
      if (!patch.content) { window.toast && window.toast('请填写内容'); return }
      if (sourceAtInput && !isValidTimestamp(sourceAt)) { window.toast && window.toast('请选择有效的发生时间'); return }
      if (m.id) {
        await db.memories.update(m.id, patch)
      } else {
        var now = Date.now()
        await db.memories.add(Object.assign({
          ownerUid: identity.ownerUid,
          charId: identity.charId,
          chatId: identity.chatId,
          embedding: null,
          sourceMsgStartId: null,
          sourceMsgEndId: null,
          createdAt: now,
          lastAccessedAt: null,
          accessCount: 0
        }, patch))
      }
      close()
      await renderMemoryPage(page)
    })
  }

  async function buildNameMaps() {
    var chars = await db.characters.toArray()
    var map = {}
    chars.forEach(function(c) { map[c.id] = c })
    return map
  }

  function getUserAccountAtText(user) {
    var account = user && user.identity && user.identity.account
    return account ? '@' + account : '@未设置微信号'
  }

  async function getMemoryUsers(chars, allRows) {
    var users = Object.values(chars).filter(function(c) { return c.type === 'user' })
    var latestByOwner = {}
    allRows.forEach(function(m) {
      if (!m.ownerUid) return
      latestByOwner[m.ownerUid] = Math.max(latestByOwner[m.ownerUid] || 0, m.updatedAt || m.createdAt || 0)
    })
    var enriched = []
    for (var i = 0; i < users.length; i++) {
      var profile = await getMemorySelfProfile(users[i].id)
      enriched.push(Object.assign({}, users[i], {
        _memoryAvatar: profile.avatar || users[i].avatar || '',
        _memoryLatestAt: latestByOwner[users[i].id] || 0,
        _memoryCount: allRows.filter(function(m) { return parseInt(m.ownerUid, 10) === users[i].id }).length
      }))
    }
    return enriched.sort(function(a, b) {
      return (b._memoryLatestAt || 0) - (a._memoryLatestAt || 0) ||
        getCharName(a).localeCompare(getCharName(b), 'zh-CN')
    })
  }

  async function getMemoryRoleItems(ownerUid, chars, ownerRows) {
    var user = chars[ownerUid]
    var profile = await getMemorySelfProfile(ownerUid)
    var selfName = getCharName(user, '我')
    var items = [{
      type: 'self',
      name: 'Memories',
      fallbackName: selfName,
      avatar: profile.avatar || getCharAvatar(user),
      time: ownerRows.reduce(function(max, m) { return Math.max(max, m.updatedAt || m.createdAt || 0) }, 0),
      count: ownerRows.length
    }]
    var latestByChar = {}
    var countByChar = {}
    ownerRows.forEach(function(m) {
      if (!m.charId) return
      latestByChar[m.charId] = Math.max(latestByChar[m.charId] || 0, m.updatedAt || m.createdAt || 0)
      countByChar[m.charId] = (countByChar[m.charId] || 0) + 1
    })
    var chatTimeByChar = {}
    var chats = (await db.chats.toArray()).filter(function(chat) {
      return parseInt(chat.ownerUid, 10) === parseInt(ownerUid, 10)
    })
    for (var c = 0; c < chats.length; c++) {
      var chat = chats[c]
      var lastMsg = await db.messages.where('chatId').equals(chat.id).last()
      if (!lastMsg) continue
      var cid = parseInt(chat.charId, 10)
      if (!cid) continue
      chatTimeByChar[cid] = Math.max(chatTimeByChar[cid] || 0, lastMsg.createdAt || chat.createdAt || 0)
    }
    var charIds = Array.from(new Set(Object.keys(chatTimeByChar).concat(Object.keys(latestByChar))
      .map(function(id) { return parseInt(id, 10) })
      .filter(Boolean)))
    for (var i = 0; i < charIds.length; i++) {
      var base = chars[charIds[i]]
      if (!base || base.type === 'user') continue
      var display = base
      if (window.getWechatDisplayCharacter) {
        try { display = await window.getWechatDisplayCharacter(charIds[i], ownerUid) || base }
        catch (e) { display = base }
      } else if (window.getWechatProfile) {
        try {
          var wxProfile = await window.getWechatProfile(ownerUid, charIds[i])
          display = Object.assign({}, base, {
            wechatName: (wxProfile.remark || '').trim() || base.nick || base.name,
            wechatAvatar: wxProfile.avatar || base.avatar || ''
          })
        } catch (e) {}
      }
      items.push({
        type: 'role',
        charId: charIds[i],
        name: getCharName(display),
        fallbackName: base.nick || base.name || '',
        avatar: getCharAvatar(display),
        time: latestByChar[charIds[i]] || chatTimeByChar[charIds[i]] || 0,
        count: countByChar[charIds[i]] || 0
      })
    }
    return items.sort(function(a, b) {
      if (a.type === 'self') return -1
      if (b.type === 'self') return 1
      return (b.time || 0) - (a.time || 0) || a.name.localeCompare(b.name, 'zh-CN')
    })
  }

  async function renderAccountPicker(page) {
    var chars = await buildNameMaps()
    var allRows = await db.memories.toArray()
    var users = await getMemoryUsers(chars, allRows)
    var memoryApi = window.loadMemoryApiConfig ? await window.loadMemoryApiConfig() : null
    page.querySelector('.header-title').textContent = 'Memories'
    page.querySelector('#memory-content').innerHTML = `
      <div class="memory-account-hero">
        <div class="memory-account-title">选择登录账号</div>
        <div class="memory-account-sub">选择账号查看记忆长廊</div>
      </div>
      <div class="memory-account-list">
        ${users.length ? users.map(buildMemoryAccountHTML).join('') : '<div class="memory-empty">暂无可登录的微信账号</div>'}
      </div>
      <div class="memory-panel memory-api-status-panel">
        <div>
          <div class="memory-panel-title">记忆设置</div>
          <div class="memory-panel-sub">总结 API：${esc(getMemoryApiStatusText(memoryApi))}</div>
        </div>
        <button class="btn-ghost btn-sm" id="btn-memory-api-config-empty" type="button">配置</button>
      </div>`
    page.querySelector('#btn-memory-api-config-empty')?.addEventListener('click', function() {
      openMemoryApiConfigPage(page)
    })
    page.querySelectorAll('.memory-account-row').forEach(function(row) {
      row.addEventListener('click', function() {
        var ownerUid = parseInt(row.dataset.ownerUid, 10)
        page._memoryState = { ownerUid: ownerUid, charId: 0, status: '', q: '' }
        renderMemoryPage(page)
      })
    })
  }

  function buildMemoryAccountHTML(user) {
    var name = getCharName(user, '微信用户')
    var countText = (user._memoryCount || 0) + ' 条记忆'
    var latestText = user._memoryLatestAt ? '最近总结 ' + formatTime(user._memoryLatestAt) : '暂无总结'
    return `
      <button class="memory-account-row" type="button" data-owner-uid="${user.id}">
        ${buildRoundAvatar(user._memoryAvatar, name, 'memory-account-avatar')}
        <span class="memory-account-info">
          <span class="memory-account-name">${esc(name)}</span>
          <span class="memory-account-id">${esc(getUserAccountAtText(user))}</span>
        </span>
        <span class="memory-account-meta">
          <span>${esc(countText)}</span>
          <small>${esc(latestText)}</small>
        </span>
        <i class="fa fa-angle-right"></i>
      </button>`
  }

  function buildMemoryStoryRail(items, activeCharId) {
    return `
      <div class="memory-story-rail" id="memory-story-rail">
        ${items.map(function(item) {
          var isSelf = item.type === 'self'
          var active = isSelf ? !activeCharId : activeCharId === item.charId
          var name = item.name || item.fallbackName || ''
          return `
            <button class="memory-story-item${isSelf ? ' is-self' : ''}${active ? ' active' : ''}" type="button" data-type="${item.type}" data-char-id="${item.charId || ''}">
              <span class="memory-story-avatar-shell">
                ${buildRoundAvatar(item.avatar, item.fallbackName || name, 'memory-story-avatar')}
                ${isSelf ? '<span class="memory-story-add"><i class="fa fa-plus"></i></span>' : ''}
              </span>
              <span class="memory-story-name">${esc(name)}</span>
            </button>`
        }).join('')}
      </div>`
  }

  async function renderMemoryPage(page) {
    if (!page) return
    var state = page._memoryState || {}
    if (!state.ownerUid) return renderAccountPicker(page)
    var chars = await buildNameMaps()
    var rows = await listMemories(state)
    var allRows = await db.memories.toArray()
    var ownerRows = allRows.filter(function(m) { return parseInt(m.ownerUid, 10) === parseInt(state.ownerUid, 10) })
    var statRows = ownerRows.filter(function(m) {
      return !state.charId || parseInt(m.charId, 10) === parseInt(state.charId, 10)
    })
    var roleItems = await getMemoryRoleItems(state.ownerUid, chars, ownerRows)
    var owner = chars[state.ownerUid]
    var status = (await db.config.get('memoryEmbeddingStatus'))?.value || null
    var lastSummary = (await db.config.get('memoryLastSummaryAt'))?.value || ''
    var memoryApi = window.loadMemoryApiConfig ? await window.loadMemoryApiConfig() : null
    var embeddingText = !status ? '未测试' : (status.ok ? '可用' : '不可用' + (status.error ? '：' + String(status.error).slice(0, 100) : ''))
    var activeRole = state.charId ? chars[state.charId] : null
    var listTitle = activeRole ? getCharName(activeRole) + '的回忆' : '全部回忆'
    var roleSubtitle = (await db.config.get('memoryRoleSubtitle'))?.value || ROLE_SUBTITLE_DEFAULT
    var subtitleHtml = activeRole
      ? `<button class="memory-corridor-subtitle memory-role-subtitle" id="btn-memory-role-subtitle" type="button">${esc(roleSubtitle)}</button>`
      : `<div class="memory-corridor-subtitle">${esc(getUserAccountAtText(owner))}</div>`
    page.querySelector('.header-title').textContent = '记忆长廊'
    page.querySelector('#memory-content').innerHTML = `
      ${buildMemoryStoryRail(roleItems, state.charId)}
      <div class="memory-corridor-head">
        <div>
          <div class="memory-corridor-title">${esc(listTitle)}</div>
          ${subtitleHtml}
        </div>
        ${activeRole ? '' : '<button class="btn-ghost btn-sm memory-switch-owner-btn" id="btn-memory-switch-owner">切换账号</button>'}
      </div>
      <div class="memory-overview">
        ${buildMemoryStats(statRows)}
      </div>
      <div class="memory-panel">
        <div class="memory-panel-head">
          <div>
            <div class="memory-panel-title">搜索与状态</div>
            <div class="memory-panel-sub">向量状态：${esc(embeddingText)} · 最近总结：${esc(formatTime(lastSummary))}</div>
          </div>
                 <span class="memory-panel-actions"><button class="btn-ghost btn-sm" id="btn-memory-embedding-config" type="button">向量 API</button><button class="btn-ghost btn-sm" id="btn-memory-test-embedding">测试</button><button class="btn-ghost btn-sm" id="btn-memory-backfill" type="button">补算</button></span>
        </div>
        <div class="memory-filter-grid memory-filter-grid-compact">
          <select class="input-field" id="memory-filter-status">
            <option value="">全部状态</option>
            ${['active','sleeping','archived'].map(function(s) { return `<option value="${s}" ${state.status === s ? 'selected' : ''}>${STATUS_LABEL[s]}</option>` }).join('')}
          </select>
          <input class="input-field" id="memory-filter-q" placeholder="搜索记忆" value="${esc(state.q || '')}">
        </div>
      </div>
      <div class="memory-panel">
        <div class="memory-panel-head">
          <div class="memory-panel-title">记忆列表</div>
          <div class="memory-panel-actions">
            <span class="memory-panel-sub">${rows.length} 条</span>
            ${activeRole ? '<button class="btn-ghost btn-sm"   id="btn-memory-add" type="button"><i class="fa fa-plus"></i> 新增记忆</button><button class="btn-ghost btn-sm" id="btn-memory-backfill-call" type="button"><i class="fa fa-phone"></i> 补总结通话</button>' : ''}
          </div>
        </div>
        <div class="memory-list">
          ${rows.length ? rows.map(function(m) { return buildMemoryCard(m, chars) }).join('') : '<div class="memory-empty">暂无记忆</div>'}
        </div>
      </div>
      <div class="memory-panel memory-api-status-panel">
        <div>
          <div class="memory-panel-title">记忆设置</div>
          <div class="memory-panel-sub">总结 API：${esc(getMemoryApiStatusText(memoryApi))}</div>
          <div class="memory-panel-sub">每个聊天可在聊天设置中单独调整总结阈值和读取数量。</div>
        </div>
        <button class="btn-ghost btn-sm" id="btn-memory-api-config" type="button">配置</button>
      </div>`
    bindPageEvents(page)
  }

  function buildMemoryStats(rows) {
    rows = rows || []
    var items = [
      { label: 'TOTAL', value: rows.length },
      { label: 'ACTIVE', value: rows.filter(function(m) { return m.status === 'active' }).length },
      { label: 'SLEEP', value: rows.filter(function(m) { return m.status === 'sleeping' }).length }
    ]
    return items.map(function(item) {
      return `<div class="memory-metric"><strong>${esc(item.value)}</strong><span>${esc(item.label)}</span></div>`
    }).join('')
  }

  function buildMemoryCard(m, chars) {
    var owner = chars[m.ownerUid]
    var role = chars[m.charId]
    var decay = getDecayScore(m, DEFAULT_SETTINGS).toFixed(2)
    var isMeet = m.sourceType ? m.sourceType === 'offlineMeet' : !!m.sourceSessionId
    var sourceLabel = isMeet ? '见面' : (m.sourceType === 'call' ? '通话' : '微信')
    var sourceClass = sourceLabel === '见面' ? 'is-meet' : 'is-wechat'
    return `
      <div class="memory-card" data-id="${m.id}">
        <div class="memory-card-top">
          <div>
            <div class="memory-title-row">
              <div class="memory-title">${esc(m.title)}</div>
              <span class="memory-source-badge ${sourceClass}">${sourceLabel}</span>
            </div>
            <div class="memory-meta">${esc(owner?.nick || owner?.name || '未知账号')} · ${esc(role?.nick || role?.name || '未知角色')} · ${STATUS_LABEL[m.status] || m.status}</div>
          </div>
          <span class="memory-score">遗忘分 ${decay}</span>
        </div>
        <div class="memory-content-text">${esc(m.content)}</div>
        <div class="memory-tags">
          <span>重要度 ${esc(m.importance || 5)}</span>
          <span>效价 ${esc(m.valence || 0)}</span>
          <span>唤醒 ${esc(m.arousal || 0)}</span>
          <span>读取 ${esc(m.accessCount || 0)} 次</span>
          <span>发生时间 ${esc(isValidTimestamp(m.sourceAt) ? formatMemoryDateTime(m.sourceAt) : '未知')}</span>
          <span>上次读取 ${esc(formatTime(m.lastAccessedAt))}</span>
        </div>
        <div class="memory-actions">
          <button class="btn-ghost btn-sm" data-action="edit">编辑</button>
          <button class="btn-ghost btn-sm" data-action="toggle">${m.status === 'archived' ? '恢复' : '归档'}</button>
          <button class="btn-ghost btn-sm btn-text-danger" data-action="delete">删除</button>
        </div>
      </div>`
  }

  function bindPageEvents(page) {
    page.querySelector('#btn-memory-api-config')?.addEventListener('click', function() {
      openMemoryApiConfigPage(page)
    })
    page.querySelector('#btn-memory-switch-owner')?.addEventListener('click', function() {
      page._memoryState = {}
      renderAccountPicker(page)
    })
    page.querySelector('#btn-memory-role-subtitle')?.addEventListener('click', async function() {
      var current = (await db.config.get('memoryRoleSubtitle'))?.value || ROLE_SUBTITLE_DEFAULT
      var next = prompt('修改角色回忆文案', current)
      if (next == null) return
      next = next.trim().slice(0, 30) || ROLE_SUBTITLE_DEFAULT
      await db.config.put({ key: 'memoryRoleSubtitle', value: next })
      await renderMemoryPage(page)
    })
    page.querySelectorAll('.memory-story-item').forEach(function(item) {
      item.addEventListener('click', function() {
        delete page._memoryState.chatId
        if (item.dataset.type === 'self') page._memoryState.charId = 0
        else page._memoryState.charId = parseInt(item.dataset.charId, 10) || 0
        renderMemoryPage(page)
      })
    })
        page.querySelector('#btn-memory-embedding-config')?.addEventListener('click', function() {
      openEmbeddingApiConfigPage(page)
    })
        page.querySelector('#btn-memory-backfill')?.addEventListener('click', function(e) {
      backfillEmbeddings(page, e.currentTarget)
    })
    page.querySelector('#btn-memory-test-embedding')?.addEventListener('click', async function() {
      await testEmbedding()
      await renderMemoryPage(page)
    })
          page.querySelector('#btn-memory-backfill-call')?.addEventListener('click', async function(e) {
        var btn = e.currentTarget
        var state = page._memoryState || {}
        if (!state.ownerUid || !state.charId) return
        var chat = await db.chats.where('[ownerUid+charId]').equals([state.ownerUid, state.charId]).first()
        if (!chat) { window.toast && window.toast('未找到对应聊天'); return }
        btn.disabled = true
        try {
          var r = await backfillCallMemories(state.ownerUid, state.charId, chat.id, function(done, total) {
            btn.textContent = '补总结中 ' + done + '/' + total
          })
          window.toast && window.toast('补总结完成：新增 ' + r.made + ' 条记忆，跳过 ' + r.skipped + ' 通' + (r.failed ? '，失败 ' + r.failed + ' 通' : ''))
        } catch (err) { window.toast && window.toast('补总结失败：' + (err.message || err)) }
        btn.disabled = false
        await renderMemoryPage(page)
      })
    page.querySelector('#btn-memory-add')?.addEventListener('click', async function() {
      var state = page._memoryState || {}
      if (!state.ownerUid || !state.charId) return
      var chat = await db.chats.where('[ownerUid+charId]').equals([state.ownerUid, state.charId]).first()
      if (!chat) { window.toast && window.toast('未找到对应聊天，无法新增记忆'); return }
      await openEditor(null, page, { ownerUid: state.ownerUid, charId: state.charId, chatId: chat.id })
    })
    ;['status'].forEach(function(k) {
      page.querySelector('#memory-filter-' + k)?.addEventListener('change', function(e) {
        var key = 'status'
        var value = e.target.value
        page._memoryState[key] = value
        renderMemoryPage(page)
      })
    })
    page.querySelector('#memory-filter-q')?.addEventListener('input', function(e) {
      clearTimeout(page._memorySearchTimer)
      page._memorySearchTimer = setTimeout(function() {
        page._memoryState.q = e.target.value.trim()
        renderMemoryPage(page)
      }, 200)
    })
    page.querySelectorAll('.memory-card').forEach(function(card) {
      card.querySelectorAll('[data-action]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
          var id = parseInt(card.dataset.id, 10)
          var m = await db.memories.get(id)
          if (!m) return
          var action = btn.dataset.action
          if (action === 'edit') return openEditor(m, page)
          if (action === 'toggle') await db.memories.update(id, { status: m.status === 'archived' ? 'active' : 'archived', updatedAt: Date.now() })
          if (action === 'delete') await db.memories.delete(id)
          await renderMemoryPage(page)
        })
      })
    })
  }

  window.showMemoryPage = function(filter) {
    _launchFilter = filter || _launchFilter || {}
    var page = document.createElement('div')
    page.id = 'memory-page'
    page.className = 'full-page memory-page'
    page._memoryState = Object.assign({}, _launchFilter)
    _launchFilter = null
    page.innerHTML = `
      <div class="page-header">
        <button class="header-back" id="btn-memory-back"><i class="fa fa-angle-left"></i></button>
        <span class="header-title">记忆</span>
      </div>
      <div class="memory-scroll" id="memory-content"><div class="list-loading"><i class="fa fa-spinner fa-spin"></i></div></div>`
    window.openPage(page)
    page.querySelector('#btn-memory-back').addEventListener('click', function() { window.closePage('memory-page') })
    renderMemoryPage(page)
  }

  window.WanWanMemory = {
    getSettings: getSettings,
    saveSettings: saveSettings,
    summarizeIfNeeded: summarizeIfNeeded,
    summarizeNow: summarizeNow,
    summarizeMeeting: summarizeMeeting,
    summarizeCall: summarizeCall,
    getMemoryContext: getMemoryContext,
    listMemories: listMemories,
    testEmbedding: testEmbedding,
    getDecayScore: getDecayScore
  }
})()
