// lorebook.js — 世界书管理
// 依赖：db.js 必须先加载

function lbEscapeHTML(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ===== 加载所有世界书数据 =====
async function loadLorebooks() {
  const row = await db.config.get('lorebooks')
  return row ? (row.value || []) : []
}

// ===== 保存世界书数组到db =====
async function saveLorebooks(books) {
  await db.config.put({ key: 'lorebooks', value: books })
}

// ===== 条目注入时机/顺序 =====
// position: 'before'（人设之前）| 'middle'（默认位置）| 'after'（内容之后、规则之前）
// injectOrder: 同一时机分组内部排序用，缺省视为 100，数字小的在前
const LB_DEFAULT_INJECT_ORDER = 100

function lbNormalizePosition(pos) {
  return pos === 'before' || pos === 'after' ? pos : 'middle'
}

// 命中条目分组排序，返回 { before, middle, after } 三段完整文本
window.buildLorebookSegments = function(matchedEntries) {
  const groups = { before: [], middle: [], after: [] }
  matchedEntries.forEach(entry => {
    groups[lbNormalizePosition(entry.position)].push(entry)
  })
  const sortGroup = arr => arr
    .map((e, i) => ({ e, i }))
    .sort((a, b) => {
      const oa = Number.isFinite(Number(a.e.injectOrder)) && a.e.injectOrder !== '' && a.e.injectOrder != null ? Number(a.e.injectOrder) : LB_DEFAULT_INJECT_ORDER
      const ob = Number.isFinite(Number(b.e.injectOrder)) && b.e.injectOrder !== '' && b.e.injectOrder != null ? Number(b.e.injectOrder) : LB_DEFAULT_INJECT_ORDER
      return oa - ob || a.i - b.i
    })
    .map(x => x.e.content || '')
  return {
    before: sortGroup(groups.before).filter(Boolean).join('\n\n'),
    middle: sortGroup(groups.middle).filter(Boolean).join('\n\n'),
    after: sortGroup(groups.after).filter(Boolean).join('\n\n')
  }
}

// 条目标题以「[线上]」或「[线下]」开头时，只在对应场景使用（也兼容【线上】【线下】）
// scene: 'online'（微信聊天/通话）| 'offline'（想见你）| 不传（不过滤）；没写前缀的条目两边都用
function lbEntryMatchesScene(entry, scene) {
  if (!scene) return true
  const m = String(entry?.title || '').match(/^\s*[\[【]\s*(线上|线下)\s*[\]】]/)
  if (!m) return true
  return (m[1] === '线上') === (scene !== 'offline')
}

// 收集命中的条目对象（含 position/injectOrder）
async function collectLorebookEntries(charId, recentMessages, options) {
  const books = await loadLorebooks()
  if (!books.length) return []

  const dialogText = recentMessages.map(m => m.content || '').join(' ')
  const matched = []

  for (const book of books) {
    if (!book.enabled) continue
    const ids = book.charIds || []
    if (book.scope === 'personal' && !ids.includes(charId)) continue
    for (const entry of book.entries || []) {
      if (!entry.enabled) continue
      if (!lbEntryMatchesScene(entry, options?.scene)) continue
      const noKeywords = !entry.keywords || entry.keywords.length === 0
      const keywordHit = entry.keywords?.some(kw => kw && dialogText.includes(kw))
      if (noKeywords || keywordHit) matched.push(entry)
    }
  }
  return matched
}

// ===== 全局注入函数（分段版，供 wechat.js / miss-you.js 调用） =====
window.getLorebookContextSegments = async function(charId, recentMessages, options) {
  const matched = await collectLorebookEntries(charId, recentMessages, options)
  return window.buildLorebookSegments(matched)
}

// ===== 全局注入函数（合并串，行为兼容旧调用点） =====
window.getLorebookContext = async function(charId, recentMessages, options) {
  const seg = await window.getLorebookContextSegments(charId, recentMessages, options)
  return [seg.before, seg.middle, seg.after].filter(Boolean).join('\n\n')
}

// ===== 页面入口 =====
window.showLorebookPage = function() {
  const page = buildLorebookListPage()
  window.openPage(page)
}

// ===== 构建书列表页 =====
function buildLorebookListPage() {
  const page = document.createElement('div')
  page.id = 'lorebook-page'
  page.className = 'full-page'
  page.innerHTML = `
    <div class="page-header">
      <button class="header-back" onclick="window.closePage('lorebook-page')">
        <i class="fa fa-angle-left"></i>
      </button>
      <span class="header-title">世界书</span>
      <div style="display:flex;gap:8px">
        <button class="btn-icon" id="btn-import-lb" title="导入JSON"><i class="fa fa-upload"></i></button>
        <button class="btn-icon" id="btn-new-lb"><i class="fa fa-plus"></i></button>
        <input type="file" id="lb-import-input" accept=".json,application/json,text/plain" multiple style="display:none">
      </div>
    </div>
    <!-- 作用域Tab -->
    <div class="lb-scope-tabs">
      <button class="scope-tab active" data-scope="all">全部</button>
      <button class="scope-tab" data-scope="global">全局</button>
      <button class="scope-tab" data-scope="personal">单人</button>
    </div>
    <div class="lb-list" id="lb-list"></div>
  `
  bindLbListEvents(page)
  loadLbList(page, 'all')
  return page
}

// ===== 渲染书列表 =====
async function loadLbList(page, scope) {
  const list = page.querySelector('#lb-list')
  if (!list) return
  const token = (page._lbListLoadToken || 0) + 1
  page._lbListLoadToken = token
  page.dataset.lbScope = scope || 'all'

  if (page._lbListState) {
    renderLbListFromState(page, page._lbListState.books, scope)
  } else {
    list.innerHTML = '<div class="list-loading"><i class="fa fa-spinner fa-spin"></i></div>'
  }

  const books = await loadLorebooks()
  if (page._lbListLoadToken !== token) return
  page._lbListState = { books }
  renderLbListFromState(page, books, scope)
}

function renderLbListFromState(page, books, scope) {
  const list = page.querySelector('#lb-list')
  if (!list) return
  const filtered = scope === 'all' ? books : books.filter(b => b.scope === scope)

  if (!filtered.length) {
    list.innerHTML = '<div class="list-empty">暂无世界书，点击右上角+新建</div>'
    return
  }

  list.innerHTML = filtered.map(b => `
    <div class="lb-card" data-id="${b.id}">
      <div class="lb-card-info">
        <div class="lb-name">${b.name || '未命名'}</div>
        <div class="lb-meta">
          <span class="lb-scope-tag tag-${b.scope}">${b.scope === 'global' ? '全局' : '单人'}</span>
          <span class="lb-entry-count">${(b.entries || []).length} 条条目</span>
        </div>
      </div>
      <label class="toggle-wrap lb-toggle" data-id="${b.id}" onclick="event.stopPropagation()">
        <input type="checkbox" ${b.enabled ? 'checked' : ''}>
        <div class="toggle-track"></div>
        <div class="toggle-thumb"></div>
      </label>
    </div>
  `).join('')

  bindLbCardEvents(list, page)
}

// ===== 绑定书卡片事件 =====
function bindLbCardEvents(list, page) {
  // 点击进入条目列表
  list.querySelectorAll('.lb-card').forEach(card => {
    card.addEventListener('click', async () => {
      const books = await loadLorebooks()
      const book = books.find(b => b.id === card.dataset.id)
      if (book) openLbEntries(page, book)
    })
  })

  // 开关切换
  list.querySelectorAll('.lb-toggle').forEach(toggle => {
    toggle.querySelector('input').addEventListener('change', async (e) => {
      const books = await loadLorebooks()
      const book = books.find(b => b.id === toggle.dataset.id)
      if (book) { book.enabled = e.target.checked; await saveLorebooks(books) }
    })
  })
}

// ===== 列表页事件绑定 =====
function bindLbListEvents(page) {
  page.querySelectorAll('.scope-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      page.querySelectorAll('.scope-tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      loadLbList(page, tab.dataset.scope)
    })
  })

  page.querySelector('#btn-new-lb').addEventListener('click', () => showNewLbModal(page))

  const importBtn = page.querySelector('#btn-import-lb')
  const importInput = page.querySelector('#lb-import-input')
  importBtn.addEventListener('click', () => importInput.click())
  importInput.addEventListener('change', async () => {
    const files = [...importInput.files]
    importInput.value = ''
    if (files.length) await importLorebookFiles(page, files)
  })
}

// ===== 新建世界书弹窗 =====
async function showNewLbModal(listPage) {
  const allChars = await db.characters.toArray()
  const bindableChars = allChars.filter(c => c.type === 'char' || c.type === 'npc')
  const overlay = lbCreateOverlay()
  const sheet = lbCreateSheet(`
    <div class="sheet-title">新建世界书</div>
    <div style="padding:0 16px 8px;display:flex;flex-direction:column;gap:10px">
      <input class="input-field" id="new-lb-name" placeholder="书名">
      <select class="input-field" id="new-lb-scope">
        <option value="global">全局（所有对话注入）</option>
        <option value="personal">单人（指定角色）</option>
      </select>
      <div id="new-lb-chars-wrap" style="display:none">
        <div style="font-size:12px;color:var(--c-sub);margin-bottom:6px">选择关联角色（可多选）</div>
        <div id="new-lb-chars-list" style="max-height:160px;overflow-y:auto;display:flex;flex-direction:column;gap:4px">
          ${bindableChars.map(c => `
            <label style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:var(--r-sm);cursor:pointer">
              <input type="checkbox" value="${c.id}" class="lb-char-cb">
              <span style="font-size:14px;color:var(--c-text)">${c.name}</span>
              <span style="font-size:11px;color:var(--c-hint);margin-left:auto">${c.type.toUpperCase()}</span>
            </label>
          `).join('')}
          ${!bindableChars.length ? '<div style="font-size:12px;color:var(--c-hint)">暂无可绑定角色</div>' : ''}
        </div>
      </div>
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-confirm-new-lb">创建</button>
    </div>
  `)
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(sheet)
  requestAnimationFrame(() => { overlay.classList.add('show'); sheet.classList.add('show') })

  const close = () => {
    overlay.classList.remove('show'); sheet.classList.remove('show')
    setTimeout(() => { overlay.remove(); sheet.remove() }, 200)
  }
  overlay.addEventListener('click', close)

  // 切换作用域时显示/隐藏角色选择
  sheet.querySelector('#new-lb-scope').addEventListener('change', e => {
    sheet.querySelector('#new-lb-chars-wrap').style.display = e.target.value === 'personal' ? 'block' : 'none'
  })

  sheet.querySelector('#btn-confirm-new-lb').addEventListener('click', async () => {
    const name = sheet.querySelector('#new-lb-name').value.trim()
    if (!name) { window.toast('请填写书名'); return }
    const scope = sheet.querySelector('#new-lb-scope').value
    const charIds = scope === 'personal'
      ? [...sheet.querySelectorAll('.lb-char-cb:checked')].map(cb => parseInt(cb.value))
      : []

    const books = await loadLorebooks()
    books.push({ id: lbGenId(), name, scope, charIds, enabled: true, entries: [] })
    await saveLorebooks(books)
    close()
    loadLbList(listPage, 'all')
  })
}

// ===== 打开条目列表页 =====
function openLbEntries(listPage, book) {
  const entryPage = buildLbEntryPage(book)
  window.openPage(entryPage)
  entryPage.querySelector('.header-back').addEventListener('click', () => {
    window.closePage('lb-entry-page')
    loadLbList(listPage, 'all')
  })
}

// ===== 构建条目列表页 =====
function buildLbEntryPage(book) {
  if (!book.charIds) book.charIds = []

  const page = document.createElement('div')
  page.id = 'lb-entry-page'
  page.className = 'full-page'
  page.innerHTML = `
    <div class="page-header">
      <button class="header-back"><i class="fa fa-angle-left"></i></button>
      <input class="header-title-input" id="lb-name-edit" value="${book.name}" style="flex:1;background:none;border:none;font-size:17px;font-weight:500">
      <div style="display:flex;gap:4px;flex-shrink:0">
        <button class="btn-icon" id="btn-import-entries" title="导入JSON条目"><i class="fa fa-upload"></i></button>
        <button class="btn-icon" id="btn-export-lb" title="导出"><i class="fa fa-download"></i></button>
        <button class="btn-icon" id="btn-delete-lb" title="删除书"><i class="fa fa-trash"></i></button>
        <button class="btn-icon" id="btn-add-entry" title="添加条目"><i class="fa fa-plus"></i></button>
        <input type="file" id="lb-entries-import-input" accept=".json,application/json,text/plain" multiple style="display:none">
      </div>
    </div>
    ${book.scope === 'personal' ? `
    <div class="lb-binding-bar" id="lb-binding-bar">
      <span style="font-size:12px;color:var(--c-sub);flex-shrink:0">绑定角色</span>
      <div class="lb-binding-tags" id="lb-binding-tags"></div>
      <button class="btn-ghost btn-sm" id="btn-edit-binding" style="flex-shrink:0">编辑</button>
    </div>` : ''}
    <div class="lb-entry-list" id="lb-entry-list"></div>
  `
  renderEntryList(page, book)
  if (book.scope === 'personal') renderBindingTags(page, book)
  bindEntryPageEvents(page, book)
  return page
}

// ===== 渲染条目列表 =====
function renderEntryList(page, book) {
  const list = page.querySelector('#lb-entry-list')
  if (!book.entries?.length) {
    list.innerHTML = '<div class="list-empty">暂无条目，点击右上角+添加</div>'
    return
  }
  list.innerHTML = book.entries.map(e => `
    <div class="entry-card" data-id="${e.id}">
      <div class="entry-card-main">
        <div class="entry-title">${lbEscapeHTML(e.title) || '未命名条目'}</div>
        <div class="entry-keywords">
          ${e.position === 'before' ? '<span class="kw-tag" style="opacity:.75">注入·前</span>' : ''}
          ${e.position === 'after' ? '<span class="kw-tag" style="opacity:.75">注入·后</span>' : ''}
          ${(e.keywords || []).map(k => `<span class="kw-tag">${lbEscapeHTML(k)}</span>`).join('')}
          ${!e.keywords?.length ? '<span class="entry-no-kw">无关键词（始终注入）</span>' : ''}
        </div>
        <div class="entry-preview">${lbEscapeHTML((e.content || '').slice(0, 60))}${e.content?.length > 60 ? '...' : ''}</div>
      </div>
      <div class="entry-card-right">
        <label class="toggle-wrap entry-toggle" data-id="${e.id}" onclick="event.stopPropagation()">
          <input type="checkbox" ${e.enabled ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
        <button class="btn-icon entry-edit-btn" data-id="${e.id}"><i class="fa fa-pencil"></i></button>
      </div>
    </div>
  `).join('')

  bindEntryCardEvents(list, page, book)
}

// ===== 绑定条目卡片事件 =====
function bindEntryCardEvents(list, page, book) {
  // 编辑按钮
  list.querySelectorAll('.entry-edit-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const entry = book.entries.find(e => e.id === btn.dataset.id)
      if (entry) showEntryEditSheet(page, book, entry)
    })
  })

  // 开关
  list.querySelectorAll('.entry-toggle').forEach(toggle => {
    toggle.querySelector('input').addEventListener('change', async (e) => {
      const entry = book.entries.find(en => en.id === toggle.dataset.id)
      if (entry) {
        entry.enabled = e.target.checked
        const books = await loadLorebooks()
        const b = books.find(bk => bk.id === book.id)
        if (b) { b.entries = book.entries; await saveLorebooks(books) }
      }
    })
  })
}

// ===== 条目页事件绑定 =====
function bindEntryPageEvents(page, book) {
  page.querySelector('#btn-add-entry').addEventListener('click', () => {
    showEntryEditSheet(page, book, null)
  })

  const entriesImportBtn = page.querySelector('#btn-import-entries')
  const entriesImportInput = page.querySelector('#lb-entries-import-input')
  entriesImportBtn.addEventListener('click', () => entriesImportInput.click())
  entriesImportInput.addEventListener('change', async () => {
    const files = [...entriesImportInput.files]
    entriesImportInput.value = ''
    if (files.length) await importEntriesIntoBook(page, book, files)
  })

  page.querySelector('#btn-export-lb').addEventListener('click', async () => {
    const books = await loadLorebooks()
    const b = books.find(bk => bk.id === book.id)
    if (b) {
      lbDownloadJSON(b, `lorebook-${b.name}-${Date.now()}.json`)
      window.toast('世界书已导出')
    }
  })

  page.querySelector('#btn-delete-lb').addEventListener('click', async () => {
    if (!confirm(`确认删除世界书"${book.name}"？`)) return
    const books = await loadLorebooks()
    await saveLorebooks(books.filter(b => b.id !== book.id))
    window.toast('世界书已删除')
    page.querySelector('.header-back').click()
  })

  // 书名实时保存
  page.querySelector('#lb-name-edit').addEventListener('blur', async (e) => {
    const books = await loadLorebooks()
    const b = books.find(bk => bk.id === book.id)
    if (b) { b.name = e.target.value.trim() || b.name; await saveLorebooks(books) }
  })

  // 编辑绑定角色
  const btnEditBinding = page.querySelector('#btn-edit-binding')
  if (btnEditBinding) {
    btnEditBinding.addEventListener('click', () => showEditBindingModal(page, book))
  }
}

// ===== 条目编辑独立页面 =====
function showEntryEditSheet(entryPage, book, entry) {
  const isNew = !entry
  const e = entry || { id: lbGenId(), title: '', content: '', keywords: [], enabled: true }

  const existing = document.getElementById('lb-entry-edit-page')
  if (existing) existing.remove()

  const page = document.createElement('div')
  page.id = 'lb-entry-edit-page'
  page.className = 'full-page'
  page.innerHTML = buildEntryEditHTML(e, isNew)
  window.openPage(page)

  const close = () => window.closePage('lb-entry-edit-page')
  page.querySelector('.header-back').addEventListener('click', close)

  bindEntryEditEvents(page, entryPage, book, e, isNew, entry, close)
}

// ===== 条目编辑HTML =====
function buildEntryEditHTML(e, isNew) {
  const pos = e.position === 'before' || e.position === 'after' ? e.position : 'middle'
  const order = (e.injectOrder === 0 || e.injectOrder) && Number.isFinite(Number(e.injectOrder)) ? e.injectOrder : ''
  return `
    <div class="page-header">
      <button class="header-back"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">${isNew ? '新建条目' : '编辑条目'}</span>
    </div>
    <div class="entry-edit-form" style="flex:1;overflow-y:auto;padding:12px 16px;gap:12px">
      <div class="cs-section">
        <div class="cs-section-label">条目标题</div>
        <input class="input-field" id="entry-title" placeholder="条目标题" value="${lbEscapeHTML(e.title)}">
      </div>
      <div class="cs-section">
        <div class="cs-section-label">关键词</div>
        <div class="cs-section-sub">无关键词时始终注入；有关键词时聊天内容命中才注入</div>
        <div class="kw-tags-area" id="kw-tags-area" style="min-height:0">
          ${(e.keywords || []).map(k => `
            <span class="kw-tag removable">${lbEscapeHTML(k)}<button class="kw-del" data-kw="${lbEscapeHTML(k)}">×</button></span>
          `).join('')}
        </div>
        <div class="input-with-btn">
          <input class="input-field" id="kw-input" placeholder="输入关键词后回车添加">
          <button class="btn-ghost btn-sm" id="btn-add-kw">添加</button>
        </div>
      </div>
      <div class="cs-section">
        <div class="cs-section-label">注入设置</div>
        <div style="display:flex;gap:10px">
          <div style="flex:1;display:flex;flex-direction:column;gap:4px">
            <span class="field-label" style="white-space:nowrap">注入时机</span>
            <select class="input-field" id="entry-position">
              <option value="middle" ${pos === 'middle' ? 'selected' : ''}>中（默认位置）</option>
              <option value="before" ${pos === 'before' ? 'selected' : ''}>前（人设之前）</option>
              <option value="after" ${pos === 'after' ? 'selected' : ''}>后（人设之后）</option>
            </select>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:4px">
            <span class="field-label" style="white-space:nowrap">注入顺序</span>
            <input class="input-field" id="entry-order" type="number" placeholder="默认100" value="${order}">
          </div>
        </div>
      </div>
      <div class="cs-section">
        <div class="desc-import-row" style="margin:0">
          <span class="cs-section-label">条目内容</span>
          <button class="btn-ghost btn-sm" id="btn-import-entry-file" type="button">
            <i class="fa-solid fa-upload"></i> 导入doc/txt
          </button>
        </div>
        <textarea class="input-field entry-content" id="entry-content" placeholder="条目内容" style="min-height:160px">${lbEscapeHTML(e.content)}</textarea>
      </div>
      <input type="file" id="entry-import-input" accept=".doc,.docx,.txt,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword" style="display:none">
    </div>
    <div class="sheet-actions" style="padding-bottom:calc(20px + env(safe-area-inset-bottom))">
      <button class="btn-pill btn-full" id="btn-save-entry">保存</button>
      ${!isNew ? `<button class="btn-ghost btn-full" id="btn-delete-entry" style="color:var(--c-red)">删除条目</button>` : ''}
    </div>
  `
}

// ===== 条目编辑事件绑定 =====
function bindEntryEditEvents(sheet, entryPage, book, e, isNew, entry, close) {
  const tagsArea = sheet.querySelector('#kw-tags-area')

  // 添加关键词标签
  const addKw = (kw) => {
    kw = kw.trim()
    if (!kw) return
    const span = document.createElement('span')
    span.className = 'kw-tag removable'
    span.innerHTML = `${lbEscapeHTML(kw)}<button class="kw-del" data-kw="${lbEscapeHTML(kw)}">×</button>`
    span.querySelector('.kw-del').addEventListener('click', () => span.remove())
    tagsArea.appendChild(span)
  }

  // 绑定已有删除按钮
  tagsArea.querySelectorAll('.kw-del').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.kw-tag').remove())
  })

  const kwInput = sheet.querySelector('#kw-input')
  kwInput.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') { addKw(kwInput.value); kwInput.value = '' }
  })
  sheet.querySelector('#btn-add-kw').addEventListener('click', () => {
    addKw(kwInput.value); kwInput.value = ''
  })

  const entryImportBtn = sheet.querySelector('#btn-import-entry-file')
  const entryImportInput = sheet.querySelector('#entry-import-input')
  if (entryImportBtn && entryImportInput) {
    entryImportBtn.addEventListener('click', () => entryImportInput.click())
    entryImportInput.addEventListener('change', async ev => {
      const file = ev.target.files[0]
      ev.target.value = ''
      if (!file) return
      await importEntryContentFromFile(file, sheet)
    })
  }

  // 保存条目
  sheet.querySelector('#btn-save-entry').addEventListener('click', async () => {
    await saveEntry(sheet, entryPage, book, e, isNew, entry, close)
  })

  // 删除条目
  const btnDel = sheet.querySelector('#btn-delete-entry')
  if (btnDel) btnDel.addEventListener('click', async () => {
    await deleteEntry(entryPage, book, e, close)
  })
}

async function importEntryContentFromFile(file, sheet) {
  const contentInput = sheet.querySelector('#entry-content')
  if (!contentInput) return

  try {
    const text = await readLorebookEntryFile(file)
    const clean = normalizeLorebookEntryContent(text)
    if (!clean) {
      window.toast('文件中没有识别到文字内容')
      return
    }
    contentInput.value = clean
    contentInput.dispatchEvent(new Event('input', { bubbles: true }))
    window.toast('条目内容已导入')
  } catch (e) {
    window.toast('导入失败：' + (e.message || '无法读取文件'))
  }
}

async function readLorebookEntryFile(file) {
  if (typeof readCharacterDescriptionFile === 'function') return readCharacterDescriptionFile(file)
  const name = (file.name || '').toLowerCase()
  if (name.endsWith('.docx')) return lbReadDocxText(file)
  if (name.endsWith('.txt')) return file.text()
  if (name.endsWith('.doc')) return lbReadLegacyDocText(file)
  throw new Error('仅支持 doc、docx、txt 文件')
}

async function lbReadDocxText(file) {
  if (typeof readDocxText === 'function') return readDocxText(file)
  if (!window.JSZip) throw new Error('DOCX解析组件未加载')
  const zip = await window.JSZip.loadAsync(file)
  const targets = Object.keys(zip.files).filter(name => {
    if (!/^word\/.+\.xml$/i.test(name)) return false
    return /^word\/(document|footnotes|endnotes|comments|header\d+|footer\d+)\.xml$/i.test(name)
  })
  const ordered = targets.sort((a, b) => {
    const rank = name => name === 'word/document.xml' ? 0 : name.includes('/header') ? 1 : name.includes('/footer') ? 2 : 3
    return rank(a) - rank(b) || a.localeCompare(b)
  })

  const parts = []
  for (const path of ordered) {
    const xml = await zip.file(path).async('text')
    const text = typeof extractWordXmlText === 'function' ? extractWordXmlText(xml) : lbExtractWordXmlText(xml)
    if (text) parts.push(text)
  }
  return parts.join('\n\n')
}

function lbExtractWordXmlText(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) throw new Error('DOCX内容解析失败')
  const chunks = []
  const pushNewline = () => {
    if (chunks.length && chunks[chunks.length - 1] !== '\n') chunks.push('\n')
  }
  const walk = node => {
    if (node.nodeType !== 1) return
    const name = node.localName
    if (name === 't') {
      chunks.push(node.textContent || '')
      return
    }
    if (name === 'tab') {
      chunks.push('\t')
      return
    }
    if (name === 'br' || name === 'cr') {
      pushNewline()
      return
    }
    Array.from(node.childNodes).forEach(walk)
    if (name === 'p') pushNewline()
  }
  walk(doc.documentElement)
  return chunks.join('')
}

async function lbReadLegacyDocText(file) {
  if (typeof readLegacyDocText === 'function') return readLegacyDocText(file)
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  const utf16 = lbExtractUtf16LeRuns(bytes)
  if (utf16.length > 20) return utf16
  const decoded = await file.text()
  return decoded.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]+/g, ' ')
}

function lbExtractUtf16LeRuns(bytes) {
  const runs = []
  for (let offset = 0; offset < 2; offset++) {
    let current = ''
    for (let i = offset; i + 1 < bytes.length; i += 2) {
      const code = bytes[i] | (bytes[i + 1] << 8)
      if (lbIsReadableDocChar(code)) {
        current += String.fromCharCode(code)
      } else {
        if (current.trim().length >= 4) runs.push(current)
        current = ''
      }
    }
    if (current.trim().length >= 4) runs.push(current)
  }
  return runs.join('\n')
}

function lbIsReadableDocChar(code) {
  return code === 9 ||
    code === 10 ||
    code === 13 ||
    (code >= 32 && code <= 0xd7ff) ||
    (code >= 0xe000 && code <= 0xfffd)
}

function normalizeLorebookEntryContent(text) {
  if (typeof normalizeImportedDescription === 'function') return normalizeImportedDescription(text)
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ===== 保存条目逻辑 =====
async function saveEntry(sheet, entryPage, book, e, isNew, entry, close) {
  const title = sheet.querySelector('#entry-title').value.trim()
  const content = sheet.querySelector('#entry-content').value.trim()
  if (!content) { window.toast('请填写条目内容'); return }

  const tagsArea = sheet.querySelector('#kw-tags-area')
  const keywords = [...tagsArea.querySelectorAll('.kw-tag')].map(tag => {
    return tag.childNodes[0].textContent.trim()
  }).filter(Boolean)

  const position = sheet.querySelector('#entry-position')?.value || 'middle'
  const orderRaw = (sheet.querySelector('#entry-order')?.value || '').trim()
  const updatedEntry = { ...e, title, content, keywords, position, enabled: entry ? entry.enabled : true }
  if (orderRaw !== '' && Number.isFinite(Number(orderRaw))) updatedEntry.injectOrder = Number(orderRaw)
  else delete updatedEntry.injectOrder

  const books = await loadLorebooks()
  const b = books.find(bk => bk.id === book.id)
  if (!b) return

  if (isNew) { b.entries.push(updatedEntry) }
  else {
    const idx = b.entries.findIndex(en => en.id === e.id)
    if (idx >= 0) b.entries[idx] = updatedEntry
  }
  book.entries = b.entries
  await saveLorebooks(books)

  renderEntryList(entryPage, book)
  window.toast('条目已保存')
  close()
}

// ===== 删除条目逻辑 =====
async function deleteEntry(entryPage, book, e, close) {
  const books = await loadLorebooks()
  const b = books.find(bk => bk.id === book.id)
  if (b) {
    b.entries = b.entries.filter(en => en.id !== e.id)
    book.entries = b.entries
    await saveLorebooks(books)
    renderEntryList(entryPage, book)
    window.toast('条目已删除')
  }
  close()
}

// ===== 渲染绑定角色标签 =====
async function renderBindingTags(page, book) {
  const tagsEl = page.querySelector('#lb-binding-tags')
  if (!tagsEl) return
  const ids = book.charIds || []
  if (!ids.length) {
    tagsEl.innerHTML = '<span style="font-size:12px;color:var(--c-hint)">未绑定角色</span>'
    return
  }
  const allChars = await db.characters.toArray()
  tagsEl.innerHTML = ids.map(id => {
    const c = allChars.find(ch => ch.id === id)
    return c ? `<span class="kw-tag">${c.name}</span>` : ''
  }).join('')
}

// ===== 编辑绑定角色弹窗 =====
async function showEditBindingModal(page, book) {
  const allChars = await db.characters.toArray()
  const bindable = allChars.filter(c => c.type === 'char' || c.type === 'npc')
  const ids = book.charIds || []
  const overlay = lbCreateOverlay()
  const modal = lbCreateSheet(`
    <div class="sheet-title">编辑绑定角色</div>
    <div style="padding:0 16px 8px">
      <div style="font-size:12px;color:var(--c-sub);margin-bottom:6px">选择关联角色（可多选，仅CHAR/NPC）</div>
      <div id="bind-chars-list" style="max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:4px">
        ${bindable.map(c => `
          <label style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:var(--r-sm);cursor:pointer">
            <input type="checkbox" value="${c.id}" class="bind-char-cb" ${ids.includes(c.id) ? 'checked' : ''}>
            <span style="font-size:14px;color:var(--c-text)">${c.name}</span>
            <span style="font-size:11px;color:var(--c-hint);margin-left:auto">${c.type.toUpperCase()}</span>
          </label>
        `).join('')}
        ${!bindable.length ? '<div style="font-size:12px;color:var(--c-hint)">暂无可绑定角色</div>' : ''}
      </div>
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-save-binding">保存</button>
    </div>
  `)
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(() => { overlay.classList.add('show'); modal.classList.add('show') })

  const close = () => {
    overlay.classList.remove('show'); modal.classList.remove('show')
    setTimeout(() => { overlay.remove(); modal.remove() }, 200)
  }
  overlay.addEventListener('click', close)

  modal.querySelector('#btn-save-binding').addEventListener('click', async () => {
    const newIds = [...modal.querySelectorAll('.bind-char-cb:checked')].map(cb => parseInt(cb.value))
    book.charIds = newIds
    const books = await loadLorebooks()
    const b = books.find(bk => bk.id === book.id)
    if (b) { b.charIds = newIds; await saveLorebooks(books) }
    renderBindingTags(page, book)
    close()
  })
}

// ===== 生成短ID =====
function lbGenId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ===== 创建遮罩层 =====
function lbCreateOverlay() {
  const el = document.createElement('div')
  el.className = 'sheet-overlay'
  el.style.zIndex = '200'
  return el
}

// ===== 创建居中弹窗 =====
function lbCreateSheet(html) {
  const el = document.createElement('div')
  el.className = 'center-modal'
  el.style.zIndex = '201'
  el.innerHTML = html
  return el
}

// ===== 下载JSON文件 =====
function lbDownloadJSON(data, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  a.download = filename
  a.click()
}

// ===== JSON 导入（整本世界书 / 多条条目） =====
// 支持：本页「导出」生成的整本 JSON、多本书组成的数组、或只有条目的数组；可一次选多个文件
function lbCleanKeywords(v) {
  const arr = Array.isArray(v) ? v : (typeof v === 'string' ? v.split(/[,，、\n]/) : [])
  return [...new Set(arr.map(k => String(k ?? '').trim()).filter(Boolean))]
}

function lbNormalizeImportedEntry(raw) {
  if (!raw || typeof raw !== 'object') return null
  const content = String(raw.content ?? '').trim()
  if (!content) return null
  const entry = {
    ...raw,
    id: lbGenId(),
    title: String(raw.title ?? '').trim(),
    content,
    keywords: lbCleanKeywords(raw.keywords),
    position: lbNormalizePosition(raw.position),
    enabled: raw.enabled !== false
  }
  const order = raw.injectOrder
  if (order !== '' && order != null && Number.isFinite(Number(order))) entry.injectOrder = Number(order)
  else delete entry.injectOrder
  return entry
}

// 读取并解析一个 JSON 文件，返回 { books: [原始书对象], loose: [原始条目对象], baseName }
async function lbReadImportJSON(file) {
  let text = await file.text()
  text = text.replace(/^\uFEFF/, '')
  let data
  try { data = JSON.parse(text) } catch (_) { throw new Error('不是有效的 JSON 文件') }
  const books = []
  const loose = []
  const collect = node => {
    if (Array.isArray(node)) { node.forEach(collect); return }
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node.entries)) books.push(node)
    else if (Array.isArray(node.books)) node.books.forEach(collect)
    else if (typeof node.content === 'string') loose.push(node)
  }
  collect(data)
  if (!books.length && !loose.length) throw new Error('文件里没有找到世界书或条目')
  return { books, loose, baseName: (file.name || '').replace(/\.json$/i, '') || '导入的世界书' }
}

// 列表页：导入整本世界书（每本都会新建，不会覆盖已有的书）
async function importLorebookFiles(listPage, files) {
  try {
    const existing = await loadLorebooks()
    const chars = await db.characters.toArray()
    const validCharIds = new Set(chars.map(c => c.id))
    const names = new Set(existing.map(b => b.name))
    const added = []
    let entryCount = 0
    let personalNoChar = 0

    for (const file of files) {
      const { books, loose, baseName } = await lbReadImportJSON(file)
      const sources = [...books]
      if (loose.length) sources.push({ name: baseName, scope: 'global', entries: loose })
      for (const raw of sources) {
        const entries = (raw.entries || []).map(lbNormalizeImportedEntry).filter(Boolean)
        let name = String(raw.name || baseName || '导入的世界书').trim()
        if (names.has(name)) name += '（导入）'
        names.add(name)
        const scope = raw.scope === 'personal' ? 'personal' : 'global'
        const charIds = scope === 'personal'
          ? (Array.isArray(raw.charIds) ? raw.charIds : []).filter(id => validCharIds.has(id))
          : []
        if (scope === 'personal' && !charIds.length) personalNoChar++
        added.push({ id: lbGenId(), name, scope, charIds, enabled: raw.enabled !== false, entries })
        entryCount += entries.length
      }
    }

    if (!added.length) { window.toast('没有可导入的内容'); return }
    await saveLorebooks([...existing, ...added])
    window.toast(`已导入 ${added.length} 本世界书，共 ${entryCount} 条条目`)
    if (personalNoChar) {
      setTimeout(() => window.toast('有单人书没有对应的绑定角色，请进入书里点「编辑」重新绑定'), 1800)
    }
    loadLbList(listPage, listPage.dataset.lbScope || 'all')
  } catch (e) {
    window.toast('导入失败：' + (e.message || '无法读取文件'))
  }
}

// 条目页：把 JSON 里的多条条目追加到当前这本书（标题和内容都相同的会跳过）
async function importEntriesIntoBook(entryPage, book, files) {
  try {
    const books = await loadLorebooks()
    const b = books.find(bk => bk.id === book.id)
    if (!b) { window.toast('找不到这本世界书'); return }
    const seen = new Set((b.entries || []).map(e => `${e.title || ''}\n${e.content || ''}`))
    let added = 0
    let skipped = 0

    for (const file of files) {
      const { books: srcBooks, loose } = await lbReadImportJSON(file)
      const rawEntries = [...srcBooks.flatMap(sb => sb.entries || []), ...loose]
      for (const raw of rawEntries) {
        const entry = lbNormalizeImportedEntry(raw)
        if (!entry) continue
        const key = `${entry.title}\n${entry.content}`
        if (seen.has(key)) { skipped++; continue }
        seen.add(key)
        b.entries.push(entry)
        added++
      }
    }

    if (!added && !skipped) { window.toast('没有可导入的条目'); return }
    book.entries = b.entries
    await saveLorebooks(books)
    renderEntryList(entryPage, book)
    window.toast(skipped ? `已导入 ${added} 条，跳过 ${skipped} 条重复` : `已导入 ${added} 条条目`)
  } catch (e) {
    window.toast('导入失败：' + (e.message || '无法读取文件'))
  }
}
