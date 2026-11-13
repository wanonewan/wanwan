// love-diary.js - 恋爱记 (loveDiary) 时间轴
// 依赖：db.js, main.js (openPage/closePage/toast)；AI 回复需要 window.callAI
// 入口：window.showLoveDiaryPage()
// 数据：db.config 里每对 (ownerUid, charId) 一条，key = loveDiary_{ownerUid}_{charId}
//       value = { events: [{ id, date:'YYYY-MM-DD', text, authorType:'self'|'role', createdAt, notes:[...] }] }

(function() {
  const LD_KEY_PREFIX = 'loveDiary_'
  const LD_DAY_START_HOUR = 5      // 凌晨 5 点前算前一天
  const LD_SORT_DESC = true        // true：新的在上；false：旧的在上
  const LD_MAX_EVENT_LEN = 300
  const LD_MEMORY_CANDIDATES = 30  // “翻记忆”时，每次最多给 TA 看多少条候选记忆
  const LD_COMMENT_CANDIDATES = 8  // “翻记忆”顺便让 TA 看的、还没有任何备注的事（最近的 N 条）
  const ldLocks = {}

  // ===== 通用小工具 =====
  function pad2(n) { return n < 10 ? '0' + n : String(n) }

  function ldEsc(str) {
    if (str === null || str === undefined) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function ldInitial(name) {
    return String(name || '?').trim().charAt(0) || '?'
  }

  function ldAvatarHTML(src, name) {
    return src
      ? `<img src="${ldEsc(src)}" alt="${ldEsc(name)}">`
      : `<span>${ldEsc(ldInitial(name))}</span>`
  }

  function ldMakeId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  function ldToast(msg) {
    if (window.toast) window.toast(msg)
  }

  // ===== 日期：只记年月日，凌晨 5 点前算前一天 =====
  function ldDayOf(ts) {
    const d = new Date(ts)
    if (d.getHours() < LD_DAY_START_HOUR) d.setDate(d.getDate() - 1)
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
  }

  // 某一天对应的时间区间：当天 5:00 ~ 次日 5:00
  function ldDayRange(day) {
    const [y, m, d] = String(day).split('-').map(Number)
    return [
      new Date(y, m - 1, d, LD_DAY_START_HOUR, 0, 0, 0).getTime(),
      new Date(y, m - 1, d + 1, LD_DAY_START_HOUR, 0, 0, 0).getTime()
    ]
  }

  // createdAt 可能是数字，也可能是日期字符串
  function ldTs(value) {
    const n = Number(value)
    if (Number.isFinite(n) && n > 0) return n
    const t = new Date(value).getTime()
    return Number.isFinite(t) ? t : 0
  }

  function ldIsDay(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) }
  function ldShortDay(day) { return String(day).replace(/-/g, '.') }
  function ldLongDay(day) {
    const [y, m, d] = String(day).split('-').map(Number)
    return `${y}年${m}月${d}日`
  }

  // 给以后"日记联动"用：传入时间戳，得到事件应记的日期
  window.getLoveDiaryDay = ldDayOf

  // ===== 数据读写 =====
  function ldKey(ownerUid, charId) { return LD_KEY_PREFIX + ownerUid + '_' + charId }

  function ldNormalizeEvents(list) {
    if (!Array.isArray(list)) return []
    return list
      .map(ev => {
        const createdAt = Number(ev?.createdAt) || Date.now()
        const notes = Array.isArray(ev?.notes) ? ev.notes : []
        return {
          id: ev?.id || ldMakeId('ev'),
          date: ldIsDay(ev?.date) ? ev.date : ldDayOf(createdAt),
          text: String(ev?.text || '').trim(),
          authorType: ev?.authorType === 'role' ? 'role' : 'self',
          fromMemoryId: ev?.fromMemoryId ?? null,
          createdAt,
          notes: notes
            .map(n => {
              const nCreatedAt = Number(n?.createdAt) || Date.now()
              return {
                id: n?.id || ldMakeId('note'),
                comment: String(n?.comment || '').trim(),
                fromType: n?.fromType === 'role' ? 'role' : 'self',
                fromName: String(n?.fromName || '').trim(),
                fromId: n?.fromId ?? null,
                replyToId: n?.replyToId || null,
                createdAt: nCreatedAt
              }
            })
            .filter(n => n.comment)
            .sort((a, b) => a.createdAt - b.createdAt)
        }
      })
      .filter(ev => ev.text)
  }

  async function ldLoad(ownerUid, charId) {
    const row = await db.config.get(ldKey(ownerUid, charId))
    return ldNormalizeEvents(row?.value?.events)
  }

  // 读-改-写串行执行，避免"AI 回复回来"和"用户新增备注"互相覆盖
  function ldUpdate(ownerUid, charId, mutator) {
    const k = ldKey(ownerUid, charId)
    const run = (ldLocks[k] || Promise.resolve()).then(async () => {
      const events = await ldLoad(ownerUid, charId)
      await mutator(events)
      const next = ldNormalizeEvents(events)
      await db.config.put({ key: k, value: { events: next } })
      return next
    })
    ldLocks[k] = run.catch(() => {})
    return run
  }

  function ldSortEvents(events) {
    const arr = events.slice().sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
    return LD_SORT_DESC ? arr.reverse() : arr
  }

  function ldMakeNote(comment, fromType, fromName, replyToId, fromId) {
    return {
      id: ldMakeId('note'),
      comment: String(comment || '').trim(),
      fromType,
      fromName,
      fromId: fromId ?? null,
      replyToId: replyToId || null,
      createdAt: Date.now()
    }
  }

  // ===== 账号 / 好友资料 =====
  async function ldSelfProfile(uid) {
    if (!uid) return {}
    const row = await db.config.get(`wechatSelfProfile_${uid}`)
    return row?.value || {}
  }

  async function ldFriendProfile(ownerUid, charId) {
    if (!ownerUid || !charId) return {}
    const row = await db.config.get(`wechatProfile_${ownerUid}_${charId}`)
    return row?.value || {}
  }

  function ldCharDisplayName(char, profile) {
    return (profile?.remark || '').trim() || char?.nick || char?.name || '未知'
  }

  async function ldLoadFriends(ownerUid) {
    const cfg = await db.config.get(`friends_${ownerUid}`)
    const ids = Array.isArray(cfg?.value) ? cfg.value : []
    if (!ids.length) return []
    const rows = await Promise.all(ids.map(async id => {
      const char = await db.characters.get(parseInt(id, 10))
      if (!char || char.type === 'user') return null
      const profile = await ldFriendProfile(ownerUid, char.id)
      return {
        id: char.id,
        name: ldCharDisplayName(char, profile),
        avatar: profile?.avatar || char.avatar || '',
        count: (await ldLoad(ownerUid, char.id)).length
      }
    }))
    return rows.filter(Boolean).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  }

  // ===== 页面骨架 =====
  window.showLoveDiaryPage = async function() {
    if (document.getElementById('love-diary-page')) return
    const page = document.createElement('div')
    page.id = 'love-diary-page'
    page.className = 'full-page miss-page ld-page'
    page.innerHTML = `
      <div class="page-header miss-header">
        <button class="header-back" id="ld-back" type="button"><i class="fa fa-angle-left"></i></button>
        <span class="header-title" id="ld-title">恋爱记</span>
        <button class="ld-header-action" id="ld-add" type="button" aria-label="新增事件" hidden>
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>
      <div class="miss-body" id="ld-body"></div>
    `
    page._ld = { view: 'accounts', multiOwner: true }
    page._ldPending = {}
    page.querySelector('#ld-back').addEventListener('click', () => ldHandleBack(page))
    page.querySelector('#ld-add').addEventListener('click', () => ldOpenEditor(page, null))
    window.openPage(page)
    await ldShowAccounts(page)
  }

  function ldSetTitle(page, title) {
    const el = page.querySelector('#ld-title')
    if (el) el.textContent = title
  }

  function ldSetAddVisible(page, visible) {
    const btn = page.querySelector('#ld-add')
    if (btn) btn.hidden = !visible
  }

  function ldHandleBack(page) {
    const st = page._ld || {}
    if (st.view === 'timeline') {
      ldShowRoles(page, st.ownerUid)
      return
    }
    if (st.view === 'roles' && st.multiOwner) {
      ldShowAccounts(page)
      return
    }
    window.closePage('love-diary-page')
  }

  async function ldShowAccounts(page) {
    page._ld = { view: 'accounts', multiOwner: true }
    ldSetTitle(page, '恋爱记')
    ldSetAddVisible(page, false)
    const body = page.querySelector('#ld-body')
    body.innerHTML = '<div class="miss-loading"><i class="fa fa-spinner fa-spin"></i></div>'

    const users = (await db.characters.where('type').equals('user').toArray())
      .sort((a, b) => (b.id || 0) - (a.id || 0))
    if (!users.length) {
      body.innerHTML = `
        <div class="miss-empty">
          <i class="fa fa-user"></i>
          <div>暂无微信账号</div>
          <span>请先在微信里登录或创建 USER 角色</span>
        </div>`
      return
    }
    if (users.length === 1) {
      await ldShowRoles(page, users[0].id, false)
      return
    }
    const items = []
    for (const user of users) {
      const profile = await ldSelfProfile(user.id)
      items.push({
        user,
        name: user.nick || user.name || '我',
        avatar: profile.avatar || user.avatar || ''
      })
    }
    body.innerHTML = `
      <div class="miss-section-title">选择微信账号</div>
      <div class="miss-list">
        ${items.map(it => `
          <button class="miss-row" data-owner-uid="${it.user.id}" type="button">
            <div class="miss-avatar">${ldAvatarHTML(it.avatar, it.name)}</div>
            <div class="miss-row-main">
              <div class="miss-row-title">${ldEsc(it.name)}</div>
              <div class="miss-row-sub">${ldEsc(it.user.identity?.account ? '@' + it.user.identity.account : '微信账号')}</div>
            </div>
            <i class="fa fa-angle-right"></i>
          </button>`).join('')}
      </div>`
    body.querySelectorAll('.miss-row').forEach(row => {
      row.addEventListener('click', () => ldShowRoles(page, parseInt(row.dataset.ownerUid, 10), true))
    })
  }

  async function ldShowRoles(page, ownerUid, multiOwner) {
    const prevMulti = page._ld?.multiOwner
    page._ld = {
      view: 'roles',
      ownerUid,
      multiOwner: multiOwner === undefined ? prevMulti : multiOwner
    }
    ldSetTitle(page, '恋爱记')
    ldSetAddVisible(page, false)
    const body = page.querySelector('#ld-body')
    body.innerHTML = '<div class="miss-loading"><i class="fa fa-spinner fa-spin"></i></div>'
    const friends = await ldLoadFriends(ownerUid)
    if (page._ld.view !== 'roles' || page._ld.ownerUid !== ownerUid) return
    if (!friends.length) {
      body.innerHTML = `
        <div class="miss-empty">
          <i class="fa fa-heart"></i>
          <div>暂无好友</div>
          <span>当前微信号还没有添加好友</span>
        </div>`
      return
    }
    body.innerHTML = `
      <div class="miss-section-title">选择想翻开的人</div>
      <div class="miss-list">
        ${friends.map(f => `
          <button class="miss-row" data-char-id="${f.id}" type="button">
            <div class="miss-avatar">${ldAvatarHTML(f.avatar, f.name)}</div>
            <div class="miss-row-main">
              <div class="miss-row-title">${ldEsc(f.name)}</div>
              <div class="miss-row-sub">${f.count ? f.count + ' 件事' : '还没有记录'}</div>
            </div>
            <i class="fa fa-angle-right"></i>
          </button>`).join('')}
      </div>`
    body.querySelectorAll('.miss-row').forEach(row => {
      row.addEventListener('click', () => ldShowTimeline(page, ownerUid, parseInt(row.dataset.charId, 10)))
    })
  }

  async function ldShowTimeline(page, ownerUid, charId) {
    const char = await db.characters.get(charId)
    const owner = await db.characters.get(ownerUid)
    if (!char || !owner) {
      ldToast('角色不存在')
      return
    }
    const cProfile = await ldFriendProfile(ownerUid, charId)
    const uProfile = await ldSelfProfile(ownerUid)
    page._ldChar = {
      id: charId,
      name: ldCharDisplayName(char, cProfile),
      avatar: cProfile?.avatar || char.avatar || ''
    }
    page._ldUser = {
      id: ownerUid,
      name: owner.nick || owner.name || '我',
      avatar: uProfile.avatar || owner.avatar || ''
    }
    page._ld = { view: 'timeline', ownerUid, charId, multiOwner: page._ld?.multiOwner }
    ldSetTitle(page, '恋爱记')
    ldSetAddVisible(page, true)
    await ldRenderTimeline(page)
  }

  // ===== 时间轴 =====
  async function ldRenderTimeline(page) {
    const st = page._ld
    if (!st || st.view !== 'timeline') return
    const body = page.querySelector('#ld-body')
    if (!body) return
    const token = (page._ldTimelineToken || 0) + 1
    page._ldTimelineToken = token
    const events = ldSortEvents(await ldLoad(st.ownerUid, st.charId))
    const autoOn = await ldAutoEnabled(st.ownerUid, st.charId)
    const lastCheck = await ldGetCheck(st.ownerUid, st.charId)
    if (page._ldTimelineToken !== token || page._ld.view !== 'timeline') return

    const ch = page._ldChar
    const us = page._ldUser
    const people = `
      <div class="ld-people">
        <div class="ld-person">
          <span class="ld-person-avatar">${ldAvatarHTML(ch.avatar, ch.name)}</span>
          <span class="ld-person-name">${ldEsc(ch.name)}</span>
        </div>
        <div class="ld-person">
          <span class="ld-person-avatar">${ldAvatarHTML(us.avatar, us.name)}</span>
          <span class="ld-person-name">${ldEsc(us.name)}</span>
        </div>
      </div>
      <div class="ld-auto-row">
        <span class="ld-auto-text">${ldEsc(ch.name)} 写完自己的日记后，可以自己决定要不要在这里记一件事</span>
        <button class="ld-switch${autoOn ? ' is-on' : ''}" id="ld-auto-switch" type="button" role="switch" aria-checked="${autoOn}"><i></i></button>
      </div>
      <div class="ld-check-row">
        <button class="ld-check-line" id="ld-check-line" type="button">${ldEsc(ldCheckLabel(lastCheck))}</button>
        <button class="ld-check-run" id="ld-check-run" type="button">用最近一篇日记检定一次</button>
      </div>
      <button class="ld-pick-btn" id="ld-pick-memory" type="button"><i class="fa-solid fa-book-open"></i> 让 TA 翻翻记忆，挑一件最重要的事记下来</button>`

    if (!events.length) {
      body.innerHTML = `
        ${people}
        <div class="miss-empty ld-empty">
          <i class="fa fa-heart"></i>
          <div>还没有记录</div>
          <span>点右上角“+”，记下你们的第一件事</span>
        </div>`
      ldBindAuto(page)
      return
    }

    body.innerHTML = `
      ${people}
      <div class="ld-timeline">
        ${events.map(ev => {
          const isRole = ev.authorType === 'role'
          const card = `
            <div class="ld-card" data-event-id="${ldEsc(ev.id)}">
              <div class="ld-card-date">${ldEsc(ldShortDay(ev.date))}</div>
              <div class="ld-card-text">${ldEsc(ev.text).replace(/\n/g, '<br>')}</div>
              ${ev.notes.length ? `<div class="ld-card-foot"><i class="fa-regular fa-note-sticky"></i> ${ev.notes.length}</div>` : ''}
            </div>`
          return `
            <div class="ld-item ${isRole ? 'ld-left' : 'ld-right'}">
              <div class="ld-side ld-side-left">${isRole ? card : ''}</div>
              <div class="ld-dot"></div>
              <div class="ld-side ld-side-right">${isRole ? '' : card}</div>
            </div>`
        }).join('')}
      </div>`
    ldBindAuto(page)
    body.querySelectorAll('.ld-card').forEach(el => {
      el.addEventListener('click', () => ldOpenDetail(page, el.dataset.eventId))
    })
  }

  // ===== 新增 / 编辑事件 =====
  function ldOpenModal(innerHTML, className, sticky) {
    const overlay = document.createElement('div')
    overlay.className = 'sheet-overlay ld-overlay'
    const modal = document.createElement('div')
    modal.className = 'center-modal ' + className
    modal.innerHTML = innerHTML
    const app = document.getElementById('app') || document.body
    app.appendChild(overlay)
    app.appendChild(modal)
    requestAnimationFrame(() => {
      overlay.classList.add('show')
      modal.classList.add('show')
    })
    const close = () => {
      overlay.classList.remove('show')
      modal.classList.remove('show')
      setTimeout(() => {
        overlay.remove()
        modal.remove()
      }, 220)
    }
    if (!sticky) overlay.addEventListener('click', close)

    // 弹窗太高、被键盘或小窗口挡住底部按钮时，标题右上角还有一个“确认”图标可用
    const okBtn = modal.querySelector('.ld-actions:not(.ld-actions-one) .ld-btn-ok')
    const titleEl = modal.querySelector('.ld-modal-title')
    if (okBtn && titleEl) {
      titleEl.classList.add('ld-title-row')
      const quick = document.createElement('button')
      quick.type = 'button'
      quick.className = 'ld-title-ok'
      quick.setAttribute('aria-label', '确认')
      quick.innerHTML = '<i class="fa-solid fa-check"></i>'
      quick.disabled = okBtn.disabled
      quick.addEventListener('click', () => { if (!okBtn.disabled) okBtn.click() })
      titleEl.appendChild(quick)
      new MutationObserver(() => { quick.disabled = okBtn.disabled })
        .observe(okBtn, { attributes: true, attributeFilter: ['disabled'] })
    }
    return { modal, close }
  }

  function ldOpenEditor(page, ev, detail) {
    if (document.getElementById('ld-editor-modal')) return
    const st = page._ld
    if (!st || !st.ownerUid || !st.charId) return
    const isEdit = !!ev
    const { modal, close } = ldOpenModal(`
      <div class="ld-modal-title">${isEdit ? '编辑事件' : '记一件事'}</div>
      <label class="ld-field-label">日期</label>
      <input class="ld-date-input" id="ld-edit-date" type="date" value="${ldEsc(ev ? ev.date : ldDayOf(Date.now()))}">
      <div class="ld-field-hint">只记年月日。默认取“今天”，凌晨 5 点前算前一天；事情发生在别的日子，请手动改。</div>
      <label class="ld-field-label">发生了什么</label>
      <textarea class="ld-text-input" id="ld-edit-text" maxlength="${LD_MAX_EVENT_LEN}" placeholder="例如：第一次一起看海">${ldEsc(ev ? ev.text : '')}</textarea>
      <div class="ld-actions">
        <button class="ld-btn-cancel" type="button">取消</button>
        <button class="ld-btn-ok" id="ld-edit-save" type="button">保存</button>
      </div>`, 'ld-modal')
    modal.id = 'ld-editor-modal'
    const dateInput = modal.querySelector('#ld-edit-date')
    const textInput = modal.querySelector('#ld-edit-text')
    modal.querySelector('.ld-btn-cancel').addEventListener('click', close)
    setTimeout(() => { if (!isEdit) textInput.focus() }, 260)
    modal.querySelector('#ld-edit-save').addEventListener('click', async () => {
      const date = dateInput.value
      const text = textInput.value.trim()
      if (!ldIsDay(date)) { ldToast('请选择日期'); return }
      if (!text) { ldToast('请写点什么'); return }
      close()
      await ldUpdate(st.ownerUid, st.charId, events => {
        if (isEdit) {
          const target = events.find(e => e.id === ev.id)
          if (target) { target.date = date; target.text = text }
        } else {
          events.push({
            id: ldMakeId('ev'),
            date,
            text,
            authorType: 'self',
            createdAt: Date.now(),
            notes: []
          })
        }
      })
      await ldRenderTimeline(page)
      if (detail && document.body.contains(detail)) ldRenderDetail(page, detail)
    })
  }

  // ===== 详情页（事件 + 备注） =====
  async function ldOpenDetail(page, eventId) {
    if (document.getElementById('love-diary-detail')) return
    const detail = document.createElement('div')
    detail.id = 'love-diary-detail'
    detail.className = 'full-page miss-page ld-page ld-detail-page'
    detail.innerHTML = `
      <div class="page-header miss-header">
        <button class="header-back" id="ld-detail-back" type="button"><i class="fa fa-angle-left"></i></button>
        <span class="header-title">恋爱记·详情</span>
        <span class="ld-header-spacer"></span>
      </div>
      <div class="miss-body ld-detail-body" id="ld-detail-body"></div>
    `
    detail._ldEventId = eventId
    window.openPage(detail)
    detail.querySelector('#ld-detail-back').addEventListener('click', () => {
      window.closePage('love-diary-detail')
      ldRenderTimeline(page)
    })
    await ldRenderDetail(page, detail)
  }

  function ldNameOf(page, type) {
    return type === 'role' ? page._ldChar.name : page._ldUser.name
  }

  async function ldRenderDetail(page, detail) {
    const st = page._ld
    const body = detail.querySelector('#ld-detail-body')
    if (!body || !st) return
    const token = (detail._ldToken || 0) + 1
    detail._ldToken = token
    const events = await ldLoad(st.ownerUid, st.charId)
    if (!document.body.contains(detail) || detail._ldToken !== token) return
    const ev = events.find(e => e.id === detail._ldEventId)
    if (!ev) {
      window.closePage('love-diary-detail')
      ldRenderTimeline(page)
      return
    }
    const author = ev.authorType === 'role' ? page._ldChar : page._ldUser
    const pending = (page._ldPending[ev.id] || [])
    const notesById = new Map(ev.notes.map(n => [String(n.id), n]))
    const answered = new Set(
      ev.notes.filter(n => n.fromType === 'role' && n.replyToId).map(n => String(n.replyToId))
    )
    const pendingKeys = new Set(pending.map(p => p.key))

    const noteHTML = note => {
      const name = ldNameOf(page, note.fromType)
      const parent = note.replyToId ? notesById.get(String(note.replyToId)) : null
      const meta = parent
        ? `${ldEsc(name)} <span class="ld-note-reply-word">回复</span> ${ldEsc(ldNameOf(page, parent.fromType))}：${ldEsc(parent.comment)}`
        : ldEsc(name)
      const canAsk = note.fromType === 'self' && !answered.has(String(note.id)) && !pendingKeys.has(String(note.id))
      return `
        <div class="ld-note" data-ld-note-id="${ldEsc(note.id)}">
          <div class="ld-note-main">
            <div class="ld-note-meta">
              <span>${meta}</span>
              <span class="ld-note-btns">
                ${canAsk ? `<button type="button" data-ld-ai-reply="${ldEsc(note.id)}">让 TA 回复</button>` : ''}
                <button type="button" data-ld-reply-note="${ldEsc(note.id)}">回复</button>
              </span>
            </div>
            <div class="ld-note-comment">${ldEsc(note.comment)}</div>
          </div>
          <div class="ld-note-action-menu" aria-hidden="true">
            <button type="button" data-ld-note-action="copy">复制</button>
            <button type="button" data-ld-note-action="delete">删除</button>
          </div>
        </div>`
    }
    const typingHTML = pending.map(() => `
      <div class="ld-note ld-note-typing">
        <div class="ld-note-main">
          <div class="ld-note-meta"><span>${ldEsc(page._ldChar.name)}</span></div>
          <div class="ld-typing"><i></i><i></i><i></i></div>
        </div>
      </div>`).join('')

    const askEventBusy = pendingKeys.has('event')
    body.innerHTML = `
      <div class="ld-detail-card">
        <div class="ld-detail-head">
          <span class="ld-detail-avatar">${ldAvatarHTML(author.avatar, author.name)}</span>
          <span class="ld-detail-author">
            <span class="ld-detail-name">${ldEsc(author.name)}</span>
            <span class="ld-detail-date">${ldEsc(ldLongDay(ev.date))}</span>
          </span>
        </div>
        <div class="ld-detail-content">${ldEsc(ev.text).replace(/\n/g, '<br>')}</div>
      </div>
      <div class="ld-notes">
        <div class="ld-notes-title">备注</div>
        ${ev.notes.length || pending.length
          ? ev.notes.map(noteHTML).join('') + typingHTML
          : '<div class="ld-notes-empty">还没有备注</div>'}
      </div>
      <div class="ld-detail-actions">
        <button class="ld-detail-action" type="button" data-ld-note-root><i class="fa-regular fa-pen-to-square"></i><span>写备注</span></button>
        <span class="ld-detail-divider"></span>
        <button class="ld-detail-action" type="button" data-ld-ai-event ${askEventBusy ? 'disabled' : ''}><i class="fa-regular fa-comment-dots"></i><span>让 TA 评论</span></button>
        <span class="ld-detail-divider"></span>
        <button class="ld-detail-action ld-detail-action-more" type="button" data-ld-more><i class="fa-solid fa-ellipsis"></i></button>
      </div>`

    body.querySelector('[data-ld-note-root]').addEventListener('click', () => ldShowNoteInput(page, detail, ev, null))
    body.querySelector('[data-ld-ai-event]').addEventListener('click', () => ldGenerate(page, detail, ev.id, null))
    body.querySelector('[data-ld-more]').addEventListener('click', e => ldShowMoreMenu(e.currentTarget, page, detail, ev))
    body.querySelectorAll('[data-ld-reply-note]').forEach(btn => {
      btn.addEventListener('click', () => ldShowNoteInput(page, detail, ev, btn.dataset.ldReplyNote))
    })
    body.querySelectorAll('[data-ld-ai-reply]').forEach(btn => {
      btn.addEventListener('click', () => ldGenerate(page, detail, ev.id, btn.dataset.ldAiReply))
    })
    ldBindNoteLongPress(page, detail, ev)
  }

  // ===== 备注：弹出输入、长按复制/删除（仿 iCity 小纸条） =====
  function ldShowNoteInput(page, detail, ev, replyToId) {
    if (document.getElementById('ld-note-modal')) return
    const { modal, close } = ldOpenModal(`
      <div class="ld-modal-title">${replyToId ? '回复备注' : '写备注'}</div>
      <textarea class="ld-text-input ld-note-input" placeholder="写一句备注…"></textarea>
      <div class="ld-actions">
        <button class="ld-btn-cancel" type="button">取消</button>
        <button class="ld-btn-ok ld-note-send" type="button" disabled>发送</button>
      </div>`, 'ld-modal')
    modal.id = 'ld-note-modal'
    const input = modal.querySelector('.ld-note-input')
    const send = modal.querySelector('.ld-note-send')
    input.addEventListener('input', () => { send.disabled = !input.value.trim() })
    modal.querySelector('.ld-btn-cancel').addEventListener('click', close)
    send.addEventListener('click', async () => {
      const comment = input.value.trim()
      if (!comment) return
      close()
      const st = page._ld
      await ldUpdate(st.ownerUid, st.charId, events => {
        const target = events.find(e => e.id === ev.id)
        if (!target) return
        if (replyToId && !target.notes.some(n => String(n.id) === String(replyToId))) return
        target.notes.push(ldMakeNote(comment, 'self', page._ldUser.name, replyToId || null, st.ownerUid))
      })
      await ldRenderDetail(page, detail)
      ldRenderTimeline(page)
      ldToast('备注已添加')
    })
    setTimeout(() => input.focus(), 260)
  }

  function ldCloseMenus(scope = document) {
    scope.querySelectorAll?.('.ld-action-menu').forEach(m => m.remove())
    scope.querySelectorAll?.('.ld-note.show-note-menu').forEach(n => n.classList.remove('show-note-menu'))
  }

  function ldBindNoteLongPress(page, detail, ev) {
    const body = detail.querySelector('#ld-detail-body')
    if (!body) return
    let timer = null
    let start = null
    const clear = () => {
      if (timer) { clearTimeout(timer); timer = null }
      start = null
    }
    const showMenu = noteEl => {
      ldCloseMenus(detail)
      noteEl.classList.add('show-note-menu')
      setTimeout(() => document.addEventListener('click', () => ldCloseMenus(detail), { once: true }), 100)
    }

    body.querySelectorAll('.ld-note[data-ld-note-id]').forEach(noteEl => {
      noteEl.addEventListener('pointerdown', e => {
        if (e.target.closest('[data-ld-reply-note]') || e.target.closest('[data-ld-ai-reply]') || e.target.closest('[data-ld-note-action]')) return
        if (e.button !== undefined && e.button !== 0) return
        clear()
        start = { x: e.clientX, y: e.clientY, row: e.currentTarget }
        timer = setTimeout(() => {
          showMenu(start.row)
          timer = null
        }, 520)
      })
      noteEl.addEventListener('pointermove', e => {
        if (!start) return
        if (Math.abs(e.clientX - start.x) > 8 || Math.abs(e.clientY - start.y) > 8) clear()
      })
      noteEl.addEventListener('pointerup', clear)
      noteEl.addEventListener('pointercancel', clear)
      noteEl.addEventListener('contextmenu', e => {
        e.preventDefault()
        if (!e.target.closest('button')) showMenu(e.currentTarget)
      })
    })

    body.querySelectorAll('[data-ld-note-action]').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation()
        const action = e.currentTarget.dataset.ldNoteAction
        const noteId = e.currentTarget.closest('.ld-note')?.dataset.ldNoteId
        const note = ev.notes.find(n => String(n.id) === String(noteId))
        ldCloseMenus(detail)
        if (!noteId || !note) return
        if (action === 'copy') await ldCopy(note.comment)
        if (action === 'delete') await ldDeleteNote(page, detail, ev, noteId)
      })
    })
    body.querySelector('.ld-notes')?.addEventListener('selectstart', e => {
      if (e.target.closest('.ld-note')) e.preventDefault()
    })
  }

  async function ldCopy(text) {
    const value = String(text || '')
    try {
      await navigator.clipboard.writeText(value)
      ldToast('已复制')
    } catch (_) {
      const input = document.createElement('textarea')
      input.value = value
      input.style.position = 'fixed'
      input.style.left = '-9999px'
      document.body.appendChild(input)
      input.select()
      const ok = document.execCommand?.('copy')
      input.remove()
      ldToast(ok ? '已复制' : '复制失败')
    }
  }

  async function ldDeleteNote(page, detail, ev, noteId) {
    const st = page._ld
    await ldUpdate(st.ownerUid, st.charId, events => {
      const target = events.find(e => e.id === ev.id)
      if (!target) return
      // 删除某条备注时，连带删掉它名下的所有回复
      const ids = new Set([String(noteId)])
      let changed = true
      while (changed) {
        changed = false
        target.notes.forEach(n => {
          if (n.replyToId && ids.has(String(n.replyToId)) && !ids.has(String(n.id))) {
            ids.add(String(n.id))
            changed = true
          }
        })
      }
      target.notes = target.notes.filter(n => !ids.has(String(n.id)))
    })
    await ldRenderDetail(page, detail)
    ldRenderTimeline(page)
    ldToast('备注已删除')
  }

  // ===== 事件的“更多”菜单：编辑 / 删除 =====
  function ldShowMoreMenu(anchorEl, page, detail, ev) {
    ldCloseMenus()
    const menu = document.createElement('div')
    menu.className = 'ld-action-menu'
    menu.innerHTML = `
      <button type="button" data-action="edit"><i class="fa fa-pen"></i><span>编辑</span></button>
      <button type="button" data-action="delete"><i class="fa fa-trash"></i><span>删除</span></button>`
    ;(document.getElementById('app') || document.body).appendChild(menu)
    const rect = anchorEl.getBoundingClientRect()
    const mRect = menu.getBoundingClientRect()
    const left = Math.min(Math.max(rect.right - mRect.width, 8), window.innerWidth - mRect.width - 8)
    menu.style.left = left + 'px'
    menu.style.top = Math.max(8, rect.top - mRect.height - 8) + 'px'
    menu.querySelector('[data-action="edit"]').addEventListener('click', () => {
      menu.remove()
      ldOpenEditor(page, ev, detail)
    })
    menu.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      menu.remove()
      if (!confirm('删除这件事和它下面的所有备注？')) return
      const st = page._ld
      await ldUpdate(st.ownerUid, st.charId, events => {
        const idx = events.findIndex(e => e.id === ev.id)
        if (idx >= 0) events.splice(idx, 1)
      })
      window.closePage('love-diary-detail')
      ldRenderTimeline(page)
      ldToast('已删除')
    })
    setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 100)
  }

  // ===== 让 TA 回复：收集上下文 =====
  function ldResolvePlaceholders(text, ctx) {
    return String(text || '')
      .replace(/\{\{\s*(?:user|用户)\s*\}\}/gi, ctx.userName || '她')
      .replace(/\{\{\s*(?:char|角色)\s*\}\}/gi, ctx.charName || '我')
  }

  // 只读，不碰记忆的读取计数
  async function ldCollectContext(ownerUid, charId, ev) {
    const char = await db.characters.get(charId)
    if (!char) throw new Error('角色不存在')
    const owner = await db.characters.get(ownerUid)
    const profile = await ldFriendProfile(ownerUid, charId)
    const friendName = ldCharDisplayName(char, profile)
    const userName = String(owner?.nick || owner?.name || '').trim() || '她'
    const charName = String(char.nick || char.name || '').trim() || '我'
    const ph = { userName, charName }
    const resolve = t => ldResolvePlaceholders(t, ph).trim()
    const [dayStart, dayEnd] = ldDayRange(ev.date)
    const inDay = ts => Number(ts) >= dayStart && Number(ts) < dayEnd

    const persona = resolve(char.description)
    const charRole = String(char.role || '').trim()

    // 世界书：只取绑定该角色的单人世界书
    const lorebooks = (await db.config.get('lorebooks'))?.value || []
    const loreEntries = []
    for (const book of lorebooks) {
      if (book.enabled === false || book.scope !== 'personal') continue
      if (!(book.charIds || []).map(Number).includes(Number(charId))) continue
      for (const entry of (book.entries || [])) {
        if (entry.enabled === false) continue
        const c = resolve(entry.content)
        if (c) loreEntries.push(c)
      }
    }

    const fmtLine = (speaker, content, tag) => {
      const t = resolve(String(content == null ? '' : content)).replace(/\s+/g, ' ')
      if (!t || /^(data:|blob:)/i.test(t)) return ''
      return `${tag || ''}${speaker}: ${t.slice(0, 200)}`
    }

    // 线上聊天：事件当天 + 最近
    let dayChat = []
    let recentChat = []
    const chat = await db.chats.where('[ownerUid+charId]').equals([ownerUid, charId]).first()
    if (chat) {
      const dayMsgs = await db.messages.where('[chatId+createdAt]')
        .between([chat.id, dayStart], [chat.id, dayEnd], true, false).toArray()
      const dayIds = new Set(dayMsgs.map(m => m.id))
      dayChat = dayMsgs.slice(-40)
      const recent = await db.messages.where('[chatId+createdAt]')
        .between([chat.id, Dexie.minKey], [chat.id, Dexie.maxKey]).reverse().limit(20).toArray()
      recentChat = recent.reverse().filter(m => !dayIds.has(m.id))
    }
    const chatLines = list => list
      .map(m => fmtLine(m.role === 'user' ? userName : friendName, m.content))
      .filter(Boolean)

    // 线下见面：口径和 iCity 一致（同账号、同聊天、排除 script 模式，去掉 <status>）
    let dayOffline = []
    let recentOffline = []
    try {
      if (chat) {
        const rows = (await db.offlineChats.where('charId').equals(charId).toArray())
          .filter(r => Number(r.ownerUid) === Number(ownerUid) &&
            Number(r.chatId) === Number(chat.id) &&
            r.mode !== 'script' &&
            String(r.content || '').trim())
          .map(r => ({ ...r, _ts: ldTs(r.createdAt) }))
          .sort((a, b) => a._ts - b._ts)
        dayOffline = rows.filter(r => inDay(r._ts)).slice(-30)
        const dayIds = new Set(dayOffline.map(r => r.id))
        recentOffline = rows.filter(r => !dayIds.has(r.id)).slice(-10)
      }
    } catch (e) {
      console.warn('[loveDiary] 读取线下见面记录失败：', e)
    }
    const offlineLines = list => list
      .map(r => fmtLine(
        r.role === 'user' ? userName : friendName,
        String(r.content || '').replace(/<status>[\s\S]*?<\/status>/gi, '').replace(/\n+/g, ' '),
        '【线下】'
      ))
      .filter(Boolean)

    // 自动生成的记忆：当天的优先，再补高重要度的
    let memLines = []
    try {
      const mems = await db.memories.where('[ownerUid+charId]').equals([ownerUid, charId])
        .filter(m => m.status !== 'archived').toArray()
      const dayMems = mems.filter(m => inDay(m.sourceAt))
      const dayMemIds = new Set(dayMems.map(m => m.id))
      const others = mems.filter(m => !dayMemIds.has(m.id))
        .sort((a, b) => (Number(b.importance) || 0) - (Number(a.importance) || 0) || (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, Math.max(0, 10 - dayMems.length))
      memLines = dayMems.concat(others)
        .sort((a, b) => (Number(a.sourceAt) || Infinity) - (Number(b.sourceAt) || Infinity))
        .map(m => {
          const when = Number(m.sourceAt) > 0 ? `【${ldDayOf(m.sourceAt)}】` : ''
          const t = resolve(`${m.title || ''}：${m.content || ''}`)
          return t ? `${when}${t}` : ''
        })
        .filter(Boolean)
    } catch (e) {
      console.warn('[loveDiary] 读取记忆失败：', e)
    }

    return {
      ownerUid, charId, userName, charName, friendName, persona, charRole,
      loreText: loreEntries.join('\n\n'),
      dayChat: chatLines(dayChat),
      recentChat: chatLines(recentChat),
      dayOffline: offlineLines(dayOffline),
      recentOffline: offlineLines(recentOffline),
      memLines,
      resolve
    }
  }

  function ldBuildPrompt(ctx, ev, target) {
    const systemPrompt = `现在你就是「${ctx.friendName}」这个人${ctx.charRole ? `，${ctx.charRole}` : ''}。这是你的设定：
${ctx.persona || '暂无额外设定。'}
${ctx.loreText ? `\n这是和你相关的背景设定（世界书），请把它当成你所处世界的事实：\n${ctx.loreText}\n` : ''}
你和「${ctx.userName}」一起维护着一本“恋爱记”，按日期记下你们之间发生过的事，每件事下面可以留备注。现在你要在这本恋爱记里留一条备注。要求：
· 用「我」的口吻，像平时和${ctx.userName}说话那样，自然、简短，一两句话，最多 80 字。
· 只输出这条备注的正文，不要名字前缀、引号、标题、日期，也不要任何解释。
· 要贴着这件事本身。下面给你的聊天、见面、记忆里确实出现过的细节可以用，没出现过的事不要编。
· 不要重复这件事下已有备注的说法，不要套话，不要总结升华。
· 不要输出任何双花括号包裹的模板占位符。`

    const evAuthor = ev.authorType === 'role' ? ctx.friendName : ctx.userName
    const parts = [`【这件事】\n日期：${ldLongDay(ev.date)}\n记录人：${evAuthor}\n内容：${ctx.resolve(ev.text)}`]

    if (ev.notes.length) {
      const nameOf = n => (n.fromType === 'role' ? ctx.friendName : ctx.userName)
      parts.push('【这件事下已有的备注】（按时间先后）\n' + ev.notes.map(n => {
        const parent = n.replyToId ? ev.notes.find(x => String(x.id) === String(n.replyToId)) : null
        return `- ${nameOf(n)}${parent ? ` 回复 ${nameOf(parent)}` : ''}：${ctx.resolve(n.comment)}`
      }).join('\n'))
    }

    if (target) {
      const targetName = target.fromType === 'role' ? ctx.friendName : ctx.userName
      parts.push(target.fromType === 'role'
        ? `【任务】接着你自己之前的这条备注，再补一句：「${ctx.resolve(target.comment)}」`
        : `【任务】回复${targetName}的这条备注：「${ctx.resolve(target.comment)}」`)
    } else {
      parts.push('【任务】对这件事本身留一条备注。')
    }

    const refs = []
    if (ctx.dayChat.length) refs.push(`【事件当天的线上聊天】\n${ctx.dayChat.join('\n')}`)
    if (ctx.dayOffline.length) refs.push(`【事件当天的线下见面】\n${ctx.dayOffline.join('\n')}`)
    if (ctx.memLines.length) refs.push(`【相关记忆】\n${ctx.memLines.join('\n')}`)
    if (ctx.recentChat.length) refs.push(`【最近的线上聊天】\n${ctx.recentChat.join('\n')}`)
    if (ctx.recentOffline.length) refs.push(`【最近的线下见面】\n${ctx.recentOffline.join('\n')}`)
    if (refs.length) parts.push('以下只是供你参考的背景，别照搬原文：\n\n' + refs.join('\n\n'))

    return { systemPrompt, userPrompt: parts.join('\n\n') }
  }

  function ldCleanReply(raw, ctx) {
    let t = String(raw == null ? '' : raw)
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .trim()
    if (t.startsWith('```')) t = t.replace(/^```(?:\w+)?\s*/, '').replace(/\s*```$/, '').trim()
    const names = [ctx.friendName, ctx.charName].filter(Boolean).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    if (names.length) t = t.replace(new RegExp('^(?:' + names.join('|') + ')\\s*[:：]\\s*'), '')
    t = t.replace(/^["“「『]+|["”」』]+$/g, '').trim()
    return ldResolvePlaceholders(t, ctx).trim().slice(0, 300)
  }

  async function ldGenerate(page, detail, eventId, targetNoteId) {
    const st = page._ld
    const ownerUid = st.ownerUid
    const charId = st.charId
    if (!window.callAI) {
      ldToast('请先在设置里配置 API')
      return
    }
    const pendingMap = page._ldPending
    const list = (pendingMap[eventId] = pendingMap[eventId] || [])
    const pkey = targetNoteId ? String(targetNoteId) : 'event'
    if (list.some(p => p.key === pkey)) return
    list.push({ key: pkey })
    ldRenderDetail(page, detail)

    try {
      const events = await ldLoad(ownerUid, charId)
      const ev = events.find(e => e.id === eventId)
      if (!ev) return
      const target = targetNoteId ? ev.notes.find(n => String(n.id) === String(targetNoteId)) : null
      if (targetNoteId && !target) return

      const ctx = await ldCollectContext(ownerUid, charId, ev)
      const prompt = ldBuildPrompt(ctx, ev, target)
      const opts = { system: prompt.systemPrompt }
      if (window.getAITemperaturePreset) {
        const temp = await window.getAITemperaturePreset('icityDiary')
        if (temp !== undefined && temp !== null) opts.temperature = temp
      }
      const raw = await window.callAI([{ role: 'user', content: prompt.userPrompt }], opts)
      const text = ldCleanReply(raw, ctx)
      if (!text) throw new Error('AI 没有返回内容，请重试')

      await ldUpdate(ownerUid, charId, events2 => {
        const e2 = events2.find(e => e.id === eventId)
        if (!e2) return
        if (target && !e2.notes.some(n => String(n.id) === String(target.id))) return
        e2.notes.push(ldMakeNote(text, 'role', ctx.friendName, target ? target.id : null, charId))
      })
    } catch (e) {
      const msg = e?.message || String(e)
      const isConfigError = /API|配置|Base URL|Key|模型/.test(msg)
      ldShowError({
        title: '恋爱记回复失败',
        message: isConfigError ? '请先检查设置里的 API 配置。' : msg,
        detail: msg
      })
    } finally {
      pendingMap[eventId] = (pendingMap[eventId] || []).filter(p => p.key !== pkey)
      if (document.body.contains(detail)) ldRenderDetail(page, detail)
      if (document.body.contains(page)) ldRenderTimeline(page)
    }
  }

  // 必须点“我已知晓”才能关闭的报错弹窗（和 iCity 一致）
  function ldShowError({ title, message, detail }) {
    if (document.getElementById('ld-error-modal')) return
    const { modal, close } = ldOpenModal(`
      <div class="ld-modal-title">${ldEsc(title)}</div>
      <div class="ld-error-msg">${ldEsc(message)}</div>
      ${detail ? `<details class="ld-error-detail"><summary>查看更多</summary><pre>${ldEsc(detail)}</pre></details>` : ''}
      <div class="ld-actions ld-actions-one">
        <button class="ld-btn-ok" type="button">我已知晓</button>
      </div>`, 'ld-modal', true)
    modal.id = 'ld-error-modal'
    modal.querySelector('.ld-btn-ok').addEventListener('click', close)
  }

  // ===== 日记联动：角色写完日记后，自己决定要不要记一件事 =====
  // 由 icity.js 在“日记保存成功”之后调用：
  //   window.LoveDiary?.afterDiaryGenerated({ ownerUid, charId, diaryText, createdAt })
  // 约束（防止被逼着写纪念日 / 一次生成一大串）：
  //   · 默认回答“无”，大多数日子不记
  //   · 一次最多记 1 件；同一天角色最多自己记 1 件
  //   · 只记已发生、两人都参与的事；计划、感想、纪念日不算
  //   · 开关可在时间轴顶部关掉（按每个角色单独存）
  async function ldAutoEnabled(ownerUid, charId) {
    const row = await db.config.get(`loveDiaryAuto_${ownerUid}_${charId}`)
    return row?.value !== false
  }

  function ldBindAuto(page) {
    const pick = page.querySelector('#ld-pick-memory')
    if (pick) pick.addEventListener('click', () => ldPickFromMemory(page, pick))
    const runCheck = page.querySelector('#ld-check-run')
    if (runCheck) runCheck.addEventListener('click', () => ldRunCheckNow(page, runCheck))
    const checkLine = page.querySelector('#ld-check-line')
    if (checkLine) {
      checkLine.addEventListener('click', async () => {
        const st = page._ld
        if (!st) return
        const c = await ldGetCheck(st.ownerUid, st.charId)
        ldShowError({
          title: '最近一次检定',
          message: ldCheckLabel(c),
          detail: c && c.raw ? '模型原始回复：\n' + c.raw : ''
        })
      })
    }
    const btn = page.querySelector('#ld-auto-switch')
    if (!btn) return
    btn.addEventListener('click', async () => {
      const st = page._ld
      if (!st || !st.ownerUid || !st.charId) return
      const next = !btn.classList.contains('is-on')
      await db.config.put({ key: `loveDiaryAuto_${st.ownerUid}_${st.charId}`, value: next })
      btn.classList.toggle('is-on', next)
      btn.setAttribute('aria-checked', String(next))
    })
  }

  function ldShiftDay(day, n) {
    const [y, m, d] = String(day).split('-').map(Number)
    const t = new Date(y, m - 1, d - n)
    return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`
  }

  // 记录最近一次“日记联动检定”的结果，方便在时间轴上看到它有没有跑、为什么没记
  async function ldSaveCheck(ownerUid, charId, status, detail, raw) {
    try {
      await db.config.put({
        key: `loveDiaryCheck_${ownerUid}_${charId}`,
        value: { at: Date.now(), status, detail: detail || '', raw: raw || '' }
      })
    } catch (_) {}
  }

  async function ldGetCheck(ownerUid, charId) {
    const row = await db.config.get(`loveDiaryCheck_${ownerUid}_${charId}`)
    return row?.value || null
  }

  function ldCheckLabel(c) {
    if (!c) return '还没有检定记录。生成日记后这里会出现结果；如果生成了日记这里仍然是空的，说明 iCity 那边还没接上。'
    const t = new Date(c.at)
    const time = `${pad2(t.getMonth() + 1)}-${pad2(t.getDate())} ${pad2(t.getHours())}:${pad2(t.getMinutes())}`
    const map = {
      running: '检定进行中，或上次没有跑完',
      none: 'TA 看了日记，觉得没有值得记的事',
      recorded: '记了一件：' + (c.detail || ''),
      format: '模型回复的格式不对，被当作“不记”',
      error: '出错：' + (c.detail || ''),
      skip: '跳过：' + (c.detail || ''),
      off: '联动开关是关着的'
    }
    return `最近一次检定（${time}）：${map[c.status] || c.status}`
  }

  function ldLatestRoleDiary(ownerUid, charId) {
    try {
      const list = JSON.parse(localStorage.getItem('wanwan_icity_posts_' + ownerUid) || '[]')
      return list
        .filter(p => p && p.authorType === 'role' && Number(p.authorId) === Number(charId) && String(p.text || '').trim())
        .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0))[0] || null
    } catch (_) {
      return null
    }
  }

  async function ldAfterDiary(opts) {
    const ownerUid = Number(opts?.ownerUid)
    const charId = Number(opts?.charId)
    if (!ownerUid || !charId) return
    let rawAnswer = ''
    try {
      await ldSaveCheck(ownerUid, charId, 'running', '')
      const diaryText = String(opts?.diaryText || '').trim()
      if (diaryText.length < 20) { await ldSaveCheck(ownerUid, charId, 'skip', '日记内容太短'); return }
      if (!window.callAI) { await ldSaveCheck(ownerUid, charId, 'skip', 'API 未配置'); return }
      if (!(await ldAutoEnabled(ownerUid, charId))) { await ldSaveCheck(ownerUid, charId, 'off', ''); return }

      const ts = Number(opts?.createdAt) || Date.now()
      const today = ldDayOf(ts)
      const events = await ldLoad(ownerUid, charId)
      // 同一天角色最多自己记一件，已经记过就不再调用 AI（手动“检定一次”时不受这条限制）
      if (!opts?.force && events.some(e => e.authorType === 'role' && ldDayOf(e.createdAt) === today)) {
        await ldSaveCheck(ownerUid, charId, 'skip', '这一天 TA 已经自己记过一件事了')
        return
      }

      const ctx = await ldCollectContext(ownerUid, charId, { date: today, text: '', notes: [], authorType: 'role' })
      const systemPrompt = `现在你就是「${ctx.friendName}」这个人${ctx.charRole ? `，${ctx.charRole}` : ''}。这是你的设定：
${ctx.persona || '暂无额外设定。'}
${ctx.loreText ? `\n这是和你相关的背景设定（世界书），请把它当成你所处世界的事实：\n${ctx.loreText}\n` : ''}
你刚写完今天的日记。你和「${ctx.userName}」一起维护着一本“恋爱记”，只记你们两个人之间真正发生过、值得留下的事，例如：第一次一起做某件事、一次难忘的见面、一场重要的对话、一个约定的达成。
大多数日子并没有值得记的事，这时只回复“无”就好，不要为了记而记。
规则：
· 只记已经发生、并且你和「${ctx.userName}」都参与了的事。计划、打算、心情、感想都不算。
· 不要因为是纪念日、周年、节日就记，除非那天你们真的一起做了什么。
· 不要重复恋爱记里已经有的事。
· 最多只记一件，写成一句话，30 字以内，用你自己的口吻，可以用“我们”。
· 站在你（${ctx.friendName}）的视角写，“我”指你自己，对方用你平时对${ctx.userName}的称呼或直接用名字，不要用对方的口吻写。
· 发生的日子如果不是今天，请写出是几天前（0 表示今天，最多 7）。
· 只输出一行，格式严格如下，不要任何解释：
  无
  或
  记｜几天前的数字｜这件事
· 不要输出任何双花括号包裹的模板占位符。`

      const parts = [`【你今天的日记】\n${ctx.resolve(diaryText).slice(0, 2500)}`]
      const recentEvents = ldSortEvents(events).slice(0, 8)
      if (recentEvents.length) {
        parts.push('【恋爱记里已有的事（最近）】\n' + recentEvents.map(e =>
          `- ${e.date} ${e.authorType === 'role' ? ctx.friendName : ctx.userName}：${ctx.resolve(e.text)}`
        ).join('\n'))
      }
      const refs = []
      if (ctx.dayChat.length) refs.push(`【今天的线上聊天】\n${ctx.dayChat.join('\n')}`)
      if (ctx.dayOffline.length) refs.push(`【今天的线下见面】\n${ctx.dayOffline.join('\n')}`)
      if (ctx.memLines.length) refs.push(`【相关记忆】\n${ctx.memLines.join('\n')}`)
      if (ctx.recentChat.length) refs.push(`【最近的线上聊天】\n${ctx.recentChat.join('\n')}`)
      if (ctx.recentOffline.length) refs.push(`【最近的线下见面】\n${ctx.recentOffline.join('\n')}`)
      if (refs.length) parts.push('以下是用来核对“事情是否真的发生过”的背景：\n\n' + refs.join('\n\n'))
      parts.push('现在判断：今天有没有一件值得记进恋爱记的事？')

      const callOpts = { system: systemPrompt }
      if (window.getAITemperaturePreset) {
        const temp = await window.getAITemperaturePreset('icityDiary')
        if (temp !== undefined && temp !== null) callOpts.temperature = temp
      }
      const raw = await window.callAI([{ role: 'user', content: parts.join('\n\n') }], callOpts)
      const answer = String(raw == null ? '' : raw).replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
      rawAnswer = answer
      const lines = answer.split('\n').map(x => x.trim()).filter(Boolean)
      const hit = lines.map(l => l.match(/^记\s*[｜|]\s*(\d+)\s*[｜|]\s*(.+)$/)).find(Boolean)
      if (!hit) {
        if (lines.some(l => /^无/.test(l))) {
          await ldSaveCheck(ownerUid, charId, 'none', '', answer)
        } else {
          await ldSaveCheck(ownerUid, charId, 'format', '', answer)
        }
        return
      }

      const daysAgo = Math.min(7, Math.max(0, parseInt(hit[1], 10) || 0))
      const date = ldShiftDay(today, daysAgo)
      const text = ldResolvePlaceholders(hit[2], ctx).replace(/^["“「『]+|["”」』]+$/g, '').trim().slice(0, 60)
      if (!text) { await ldSaveCheck(ownerUid, charId, 'format', '', answer); return }

      let added = false
      await ldUpdate(ownerUid, charId, list => {
        if (list.some(e => e.date === date && e.text === text)) return
        if (!opts?.force && list.some(e => e.authorType === 'role' && ldDayOf(e.createdAt) === today)) return
        list.push({
          id: ldMakeId('ev'),
          date,
          text,
          authorType: 'role',
          createdAt: Date.now(),
          notes: []
        })
        added = true
      })
      await ldSaveCheck(ownerUid, charId, added ? 'recorded' : 'skip', added ? `${ldShortDay(date)} ${text}` : '和已有的事重复，没有重复记录', answer)
    } catch (e) {
      console.warn('[loveDiary] 日记联动失败：', e)
      await ldSaveCheck(ownerUid, charId, 'error', e?.message || String(e), rawAnswer)
    }
  }

  async function ldRunCheckNow(page, btn) {
    const st = page._ld
    if (!st || st.view !== 'timeline' || page._ldChecking) return
    const post = ldLatestRoleDiary(st.ownerUid, st.charId)
    if (!post) {
      ldToast('这个角色还没有写过日记')
      return
    }
    page._ldChecking = true
    const html = btn.innerHTML
    btn.disabled = true
    btn.innerHTML = '检定中…'
    try {
      await ldAfterDiary({
        ownerUid: st.ownerUid,
        charId: st.charId,
        diaryText: post.text,
        createdAt: post.createdAt,
        force: true
      })
    } finally {
      page._ldChecking = false
      if (document.body.contains(page)) await ldRenderTimeline(page)
    }
  }

  // ===== 翻记忆：从记忆长廊里挑一条最值得记的 =====
  // · 候选：该账号和该角色未归档的记忆，排除已经被挑过的；按重要度、时间排序取前 LD_MEMORY_CANDIDATES 条
  // · 一次只挑一条；再点一次会自动换下一条（已挑过的不会再出现）
  // · 事件日期 = 该记忆的发生时间（sourceAt）所在的那天，凌晨 5 点前算前一天
  async function ldPickFromMemory(page, btn) {
    const st = page._ld
    if (!st || st.view !== 'timeline' || page._ldPicking) return
    if (!window.callAI) {
      ldToast('请先在设置里配置 API')
      return
    }
    const ownerUid = st.ownerUid
    const charId = st.charId
    page._ldPicking = true
    const btnHTML = btn.innerHTML
    btn.disabled = true
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> TA 正在翻记忆、看帖子…'
    try {
      const events = await ldLoad(ownerUid, charId)
      const used = new Set(events.filter(e => e.fromMemoryId != null).map(e => String(e.fromMemoryId)))
      const mems = (await db.memories.where('[ownerUid+charId]').equals([ownerUid, charId])
        .filter(m => m.status !== 'archived' && !used.has(String(m.id))).toArray())
        .sort((a, b) =>
          (Number(b.importance) || 0) - (Number(a.importance) || 0) ||
          (ldTs(b.sourceAt) || ldTs(b.createdAt)) - (ldTs(a.sourceAt) || ldTs(a.createdAt)))
      const cands = mems.slice(0, LD_MEMORY_CANDIDATES)
      // 用户自己记的、还没有任何备注的事，取最近的几条，让 TA 顺便决定要不要评论（同一次请求里完成）
      const postCands = events.slice()
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || (ldTs(b.createdAt) - ldTs(a.createdAt)))
        .filter(e => e.authorType === 'self' && !(e.notes && e.notes.length))
        .slice(0, LD_COMMENT_CANDIDATES)
      if (!cands.length && !postCands.length) {
        ldToast('记忆库里没有可以挑的新记忆，也没有还没评论的事')
        return
      }

      const ctx = await ldCollectContext(ownerUid, charId, { date: ldDayOf(Date.now()), text: '', notes: [], authorType: 'role' })
      const tasks = []
      if (cands.length) {
        tasks.push(`【任务一：记一件事】从下面编号的记忆里，挑出最值得记进恋爱记的一件事，只挑一条。
· 优先挑：关系的转折、第一次、重要的约定、难忘的见面或对话。日常闲聊和琐碎信息不挑。
· 不要挑和“恋爱记里已有的事”重复或几乎一样的。
· 把它写成一句话，30 字以内，用你自己的口吻，可以用“我们”。只写记忆里确实有的内容，不要添油加醋。
· 这是你自己心里记得的重要日子：站在你（${ctx.friendName}）的视角写，“我”指你自己，对方用你平时对${ctx.userName}的称呼或直接用名字；记忆原文如果是从对方视角写的（比如把你写成“你”），要换成你的视角改写，不要照抄。
· 输出一行：选｜记忆编号｜这件事
· 如果这些记忆都不值得记，输出一行：无`)
      }
      if (postCands.length) {
        tasks.push(`【任务${cands.length ? '二' : '一'}：看看还没有备注的事】下面有几件${ctx.userName}记下、还没有任何备注的事。想留备注的就留，不想留的不用留，也可以一条都不留。
· 每件事最多留一条，用「我」的口吻，像平时和${ctx.userName}说话那样，一两句话，最多 80 字，贴着这件事本身，别套话，别总结升华。
· 聊天、见面、记忆里确实出现过的细节可以用，没出现过的事不要编。
· 每条备注单独输出一行：评｜事件编号｜备注正文（备注正文里不要换行，不要带名字前缀和引号）`)
      }
      const systemPrompt = `现在你就是「${ctx.friendName}」这个人${ctx.charRole ? `，${ctx.charRole}` : ''}。这是你的设定：
${ctx.persona || '暂无额外设定。'}
${ctx.loreText ? `\n这是和你相关的背景设定（世界书），请把它当成你所处世界的事实：\n${ctx.loreText}\n` : ''}
你和「${ctx.userName}」一起维护着一本“恋爱记”，按日期记录你们之间发生过、值得留下的事。这一次有下面的任务：

${tasks.join('\n\n')}

总规则：
· 只输出上面规定格式的行，每行一条，不要任何解释、标题或多余文字。
· 不要输出任何双花括号包裹的模板占位符。`

      const parts = []
      const recentEvents = ldSortEvents(events).slice(0, 12)
      if (recentEvents.length) {
        parts.push('【恋爱记里已有的事】\n' + recentEvents.map(e =>
          `- ${e.date} ${e.authorType === 'role' ? ctx.friendName : ctx.userName}：${ctx.resolve(e.text)}`
        ).join('\n'))
      }
      if (cands.length) {
        parts.push('【可以挑的记忆】\n' + cands.map((m, i) => {
          const ts = ldTs(m.sourceAt)
          const when = ts ? ldDayOf(ts) : '时间未知'
          const src = (m.sourceType ? m.sourceType === 'offlineMeet' : !!m.sourceSessionId) ? '线下' : '线上'
          return `#${i + 1} [${when}｜${src}｜重要度${m.importance || 5}] ${ctx.resolve(`${m.title || ''}：${m.content || ''}`)}`
        }).join('\n'))
      }
      if (postCands.length) {
        parts.push('【还没有备注的事】\n' + postCands.map((e, i) =>
          `E${i + 1} [${e.date}｜${ctx.userName}记的] ${ctx.resolve(e.text)}`
        ).join('\n'))
        const refs = []
        if (ctx.memLines.length) refs.push(`【相关记忆】\n${ctx.memLines.join('\n')}`)
        if (ctx.recentChat.length) refs.push(`【最近的线上聊天】\n${ctx.recentChat.join('\n')}`)
        if (ctx.recentOffline.length) refs.push(`【最近的线下见面】\n${ctx.recentOffline.join('\n')}`)
        if (refs.length) parts.push('以下只是供你参考的背景，别照搬原文：\n\n' + refs.join('\n\n'))
      }
      parts.push('请按规定的格式输出。')

      const callOpts = { system: systemPrompt }
      if (window.getAITemperaturePreset) {
        const temp = await window.getAITemperaturePreset('icityDiary')
        if (temp !== undefined && temp !== null) callOpts.temperature = temp
      }
      const raw = await window.callAI([{ role: 'user', content: parts.join('\n\n') }], callOpts)
      const answer = String(raw == null ? '' : raw).replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
      const lines = answer.split('\n').map(x => x.trim()).filter(Boolean)
      const pickHit = cands.length ? lines.map(l => l.match(/^选\s*[｜|]\s*#?(\d+)\s*[｜|]\s*(.+)$/)).find(Boolean) : null
      const commentHits = postCands.length ? lines.map(l => l.match(/^评\s*[｜|]\s*#?E?(\d+)\s*[｜|]\s*(.+)$/i)).filter(Boolean) : []
      const saidNone = lines.some(l => /^无/.test(l))
      if (!pickHit && !commentHits.length && !saidNone) {
        const err = new Error('没有从模型的返回里读到可用的结果，请重试')
        err.rawOutput = answer
        throw err
      }

      // 两件事各自独立：一边的内容不可用，不影响另一边
      let mem = null
      let text = ''
      if (pickHit) {
        mem = cands[parseInt(pickHit[1], 10) - 1] || null
        text = ldResolvePlaceholders(pickHit[2], ctx).replace(/^["“「『]+|["”」』]+$/g, '').trim().slice(0, 60)
        if (!mem || !text) mem = null
      }
      const notesToAdd = []
      const usedEv = new Set()
      commentHits.forEach(h => {
        const ev = postCands[parseInt(h[1], 10) - 1]
        if (!ev || usedEv.has(ev.id)) return
        const t = ldCleanReply(h[2], ctx)
        if (!t) return
        usedEv.add(ev.id)
        notesToAdd.push({ eventId: ev.id, text: t })
      })
      if (!mem && !notesToAdd.length) {
        if (!pickHit && !commentHits.length) {
          ldToast('TA 觉得暂时没有新的值得记的事，也没有想评论的')
          return
        }
        const err = new Error('模型返回的编号不存在或内容为空，请重试')
        err.rawOutput = answer
        throw err
      }

      const memTs = mem ? (ldTs(mem.sourceAt) || ldTs(mem.createdAt) || Date.now()) : 0
      const date = mem ? ldDayOf(memTs) : ''
      await ldUpdate(ownerUid, charId, list => {
        if (mem && !list.some(e => e.fromMemoryId != null && String(e.fromMemoryId) === String(mem.id))) {
          list.push({
            id: ldMakeId('ev'),
            date,
            text,
            authorType: 'role',
            fromMemoryId: mem.id,
            createdAt: Date.now(),
            notes: []
          })
        }
        notesToAdd.forEach(n => {
          const e2 = list.find(e => e.id === n.eventId)
          if (e2 && !(e2.notes && e2.notes.length)) {
            e2.notes = e2.notes || []
            e2.notes.push(ldMakeNote(n.text, 'role', ctx.friendName, null, charId))
          }
        })
      })
      const done = []
      if (mem) done.push(`记下了一件事（${ldShortDay(date)}）`)
      if (notesToAdd.length) done.push(`评论了 ${notesToAdd.length} 件事`)
      ldToast(`${ctx.friendName}${done.join('，')}`)
      if (document.body.contains(page)) await ldRenderTimeline(page)
    } catch (e) {
      const msg = e?.message || String(e)
      const isConfigError = /API|配置|Base URL|Key|模型/.test(msg) && !e?.rawOutput
      ldShowError({
        title: '翻记忆 / 评论失败',
        message: isConfigError ? '请先检查设置里的 API 配置。' : msg,
        detail: msg + (e?.rawOutput ? '\n\n模型原始返回：\n' + String(e.rawOutput).slice(0, 2000) : '')
      })
    } finally {
      page._ldPicking = false
      if (btn.isConnected) {
        btn.disabled = false
        btn.innerHTML = btnHTML
      }
    }
  }

  window.LoveDiary = {
    afterDiaryGenerated: ldAfterDiary,
    runCheckNow: ldRunCheckNow,
    dayOf: ldDayOf
  }
})()
