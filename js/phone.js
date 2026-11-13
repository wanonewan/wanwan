// phone.js — 查看记录入口
// 只负责选择微信账号和角色；通话功能在 wechat.js 中维护。

function phoneEscHtml(str) {
  if (window._wechatCallHelpers?.wcEscHtml) return window._wechatCallHelpers.wcEscHtml(str)
  return String(str ?? '').replace(/[&<>"']/g, s => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[s]))
}

function getPhoneInitial(name) {
  const text = String(name || '我').trim()
  return text ? Array.from(text)[0] : '我'
}

function buildPhoneAvatarHTML(src, name) {
  return src
    ? `<img src="${phoneEscHtml(src)}" alt="${phoneEscHtml(name)}">`
    : `<span>${phoneEscHtml(getPhoneInitial(name))}</span>`
}

const PHONE_RECORDS_CUSTOM_KEY_PREFIX = 'phoneRecordsPersonalization_'
const PHONE_RECORDS_PRESETS_KEY = 'phoneRecordsIScreenPresets'
const PHONE_RECORDS_DEFAULT_ICON_COLOR = '#787878'
const PHONE_LOCK_DEFAULT_MESSAGE = '幸福…淡淡的…顺顺的…'

function buildPhoneLockAvatarHTML(src, name) {
  return buildPhoneAvatarHTML(src, name) + '<span class="phone-lock-notif-wechat" aria-hidden="true"><i class="fa-brands fa-weixin"></i></span>'
}

const PHONE_RECORDS_GRID_APPS = [
  { id: 'wechat', label: '微信', icon: 'fa-brands fa-weixin' },
  { id: 'x', label: 'X', icon: 'fa-brands fa-x-twitter' },
  { id: 'instagram', label: 'Instagram', svg: getPhoneInstagramSVG() },
  { id: 'browser', label: '浏览器', icon: 'fa-brands fa-internet-explorer' },
  { id: 'notes', label: '备忘录', icon: 'fa-solid fa-pen-clip' },
  { id: 'photos', label: '相册', icon: 'fa-solid fa-panorama' },
  { id: 'wallet', label: '钱迹', icon: 'fa-brands fa-apple-pay' },
  { id: 'game-center', label: 'Game Center', icon: 'fa-solid fa-chess' },
  { id: 'privacy', label: '隐私空间', svg: getPhonePornhubSVG() },
  { id: 'schedule', label: '日程', icon: 'fa-solid fa-calendar-days' }
]

function createPhoneRecordsPersonalization() {
  return {
    lockWallpaper: '',
    homeWallpaper: '',
    lockMessage: PHONE_LOCK_DEFAULT_MESSAGE,
    wallpaperGallery: [],
    iconGallery: [],
    icons: {}
  }
}

function getPhoneRecordsDockApps() {
  return [
    { id: 'iscreens', label: 'iScreens', icon: 'fa-solid fa-wand-magic-sparkles' },
    { id: 'mail', label: 'Mail', icon: 'fa-solid fa-envelope' },
    { id: 'message', label: '信息', svg: getPhoneMessageSVG() }
  ]
}

function getPhoneRecordsAllApps() {
  const seen = new Set()
  return PHONE_RECORDS_GRID_APPS.concat(getPhoneRecordsDockApps()).filter(app => {
    if (seen.has(app.id)) return false
    seen.add(app.id)
    return true
  })
}

window.getPhoneRecordsAllApps = getPhoneRecordsAllApps

function getPhoneRecordsPersonalizationKey(context) {
  return PHONE_RECORDS_CUSTOM_KEY_PREFIX + phoneEscHtml(context.ownerUid || '0') + '_' + phoneEscHtml(context.charId || '0')
}

async function loadPhoneRecordsPersonalization(context) {
  if (!window.db) return createPhoneRecordsPersonalization()
  const row = await db.config.get(getPhoneRecordsPersonalizationKey(context))
  const value = row?.value && typeof row.value === 'object' ? row.value : {}
  const legacyWallpaper = value.wallpaper || ''
  return {
    lockWallpaper: value.lockWallpaper || legacyWallpaper,
    homeWallpaper: value.homeWallpaper || legacyWallpaper,
    lockMessage: typeof value.lockMessage === 'string' ? value.lockMessage : PHONE_LOCK_DEFAULT_MESSAGE,
    wallpaperGallery: Array.isArray(value.wallpaperGallery) ? value.wallpaperGallery : [],
    iconGallery: Array.isArray(value.iconGallery) ? value.iconGallery : [],
    icons: value.icons && typeof value.icons === 'object' ? value.icons : {}
  }
}

async function savePhoneRecordsPersonalization(context) {
  if (!window.db) return
  await db.config.put({
    key: getPhoneRecordsPersonalizationKey(context),
    value: context.personalization || createPhoneRecordsPersonalization()
  })
}

function clonePhoneRecordsValue(value) {
  if (value == null) return value
  return JSON.parse(JSON.stringify(value))
}

function sanitizePhoneIScreenPreset(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = String(raw.id || '').trim()
  if (!id) return null
  return {
    id,
    name: String(raw.name || '未命名预设').trim() || '未命名预设',
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
    lockWallpaper: typeof raw.lockWallpaper === 'string' ? raw.lockWallpaper : '',
    homeWallpaper: typeof raw.homeWallpaper === 'string' ? raw.homeWallpaper : '',
    icons: raw.icons && typeof raw.icons === 'object' ? clonePhoneRecordsValue(raw.icons) : {}
  }
}

async function loadPhoneIScreenPresets() {
  if (!window.db) return []
  const row = await db.config.get(PHONE_RECORDS_PRESETS_KEY)
  const list = Array.isArray(row?.value) ? row.value : []
  return list.map(sanitizePhoneIScreenPreset).filter(Boolean)
}

async function savePhoneIScreenPresets(presets) {
  if (!window.db) return
  await db.config.put({
    key: PHONE_RECORDS_PRESETS_KEY,
    value: presets.map(sanitizePhoneIScreenPreset).filter(Boolean)
  })
}

function buildPhoneIScreenPresetFromContext(context, name) {
  const personalization = context.personalization || createPhoneRecordsPersonalization()
  return {
    id: 'preset_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    name: String(name || '').trim() || '手机预设',
    createdAt: Date.now(),
    lockWallpaper: personalization.lockWallpaper || '',
    homeWallpaper: personalization.homeWallpaper || '',
    icons: clonePhoneRecordsValue(personalization.icons || {})
  }
}

function getPhoneAppCustom(context, appId) {
  return context.personalization?.icons?.[appId] || {}
}

function buildPhoneIconStyle(custom) {
  return custom?.color ? ` style="--icon-color:${phoneEscHtml(custom.color)}"` : ''
}

function buildPhoneIconContent(app, custom) {
  if (custom?.image) return `<img src="${phoneEscHtml(custom.image)}" alt="">`
  if (app.svg) return app.svg
  if (app.img) return `<img src="${phoneEscHtml(app.img)}" alt="">`
  return `<i class="${phoneEscHtml(app.icon)}"></i>`
}

function getPhoneWallpaper(context, type) {
  return type === 'lock'
    ? context.personalization?.lockWallpaper || ''
    : context.personalization?.homeWallpaper || ''
}

function buildPhoneWallpaperStyle(context, type) {
  const wallpaper = getPhoneWallpaper(context, type)
  return wallpaper ? ` style="background-image:url('${phoneEscHtml(wallpaper)}')"` : ''
}

function getPhoneUserBaseName(user) {
  return user?.nick || user?.name || '我'
}

function getPhoneLockDateParts() {
  const now = new Date()
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return {
    time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
    date: `${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`
  }
}

function buildPhoneAppIconHTML(app, context) {
  const custom = getPhoneAppCustom(context, app.id)
  return `
    <button class="phone-home-app phone-app-${phoneEscHtml(app.id)}" type="button" data-phone-app="${phoneEscHtml(app.id)}">
      <span class="phone-home-app-icon"${buildPhoneIconStyle(custom)}>${buildPhoneIconContent(app, custom)}</span>
      <span class="phone-home-app-label">${phoneEscHtml(app.label)}</span>
    </button>`
}

async function getPhoneSelfProfileFor(uid) {
  if (!uid) return {}
  const row = await db.config.get(`wechatSelfProfile_${uid}`)
  return row?.value || {}
}

async function getPhoneDisplayFor(ownerUid, charId) {
  const helpers = window._wechatCallHelpers || {}
  const char = helpers.getWechatDisplayCharacter
    ? await helpers.getWechatDisplayCharacter(charId, ownerUid)
    : await window.getCharacter(charId)
  const profile = char?.wechatProfile || ((await db.config.get(`wechatProfile_${ownerUid}_${charId}`))?.value || {})
  const name = helpers.getWechatDisplayName?.(char) || (profile.remark || '').trim() || char?.nick || char?.name || '未知'
  const avatar = helpers.getWechatDisplayAvatar?.(char) || profile.avatar || char?.avatar || ''
  return { char, name, avatar }
}

function getPhoneContactProfileStatsKey(ownerUid, charId) {
  return `wechatContactProfileStats_${ownerUid}_${charId}`
}

async function getPhoneContactProfileStats(ownerUid, charId) {
  const key = getPhoneContactProfileStatsKey(ownerUid, charId)
  const row = await db.config.get(key)
  const followers = parseInt(row?.value?.followers, 10)
  const following = parseInt(row?.value?.following, 10)
  if (Number.isFinite(followers) && Number.isFinite(following)) {
    return { followers, following }
  }

  const value = {
    followers: 2 + Math.floor(Math.random() * 999),
    following: 2 + Math.floor(Math.random() * 999)
  }
  await db.config.put({ key, value })
  return value
}

async function getPhoneContactMomentsProfile(ownerUid, charId) {
  if (!ownerUid || !charId) return { coverImage: '', bio: '' }
  const row = await db.config.get(`wechatContactMomentsProfile_${ownerUid}_${charId}`)
  return {
    coverImage: '',
    bio: '',
    ...(row?.value || {})
  }
}

async function getPhoneProfileCardData(context) {
  const display = await getPhoneDisplayFor(context.ownerUid, context.charId)
  const stats = await getPhoneContactProfileStats(context.ownerUid, context.charId)
  const momentsProfile = await getPhoneContactMomentsProfile(context.ownerUid, context.charId)
  const posts = window.countScopedMoments
    ? await window.countScopedMoments(context.charId, context.ownerUid)
    : await db.moments.filter(m => {
      if (String(m.charId) !== String(context.charId)) return false
      if (m.ownerUid !== undefined && m.ownerUid !== null && m.ownerUid !== '') {
        return String(m.ownerUid) === String(context.ownerUid)
      }
      return String(m.charId) === String(context.ownerUid)
    }).count()
  const account = display.char?.identity?.account || '未设置'
  return {
    name: display.name,
    avatar: display.avatar,
    account,
    bio: String(momentsProfile.bio || '').trim(),
    posts,
    followers: stats.followers,
    following: stats.following
  }
}

function buildPhoneProfileCardHTML(context) {
  const profile = context.phoneProfile || {}
  const name = profile.name || context.name || '手机'
  const avatar = profile.avatar || context.avatar || ''
  const account = profile.account || '未设置'
  const bio = String(profile.bio || '').trim()
  const bioHtml = bio ? `<div class="phone-profile-bio">${phoneEscHtml(bio.slice(0, 120))}</div>` : ''

  return `
    <section class="phone-profile-card" aria-label="角色资料">
      <div class="phone-profile-top">
        <div class="phone-profile-avatar">${buildPhoneAvatarHTML(avatar, name)}</div>
        <div class="phone-profile-main">
          <div class="phone-profile-name">${phoneEscHtml(name)}</div>
          <div class="phone-profile-stats">
            <div class="phone-profile-stat"><strong>${phoneEscHtml(profile.posts ?? 0)}</strong><span>Posts</span></div>
            <div class="phone-profile-stat"><strong>${phoneEscHtml(profile.followers ?? 0)}</strong><span>Followers</span></div>
            <div class="phone-profile-stat"><strong>${phoneEscHtml(profile.following ?? 0)}</strong><span>Following</span></div>
          </div>
        </div>
      </div>
      <div class="phone-profile-account">@${phoneEscHtml(account)}</div>
      ${bioHtml}
      <div class="phone-profile-actions">
        <button class="phone-profile-action phone-profile-action-primary" id="phone-profile-edit" type="button">Edit Phone</button>
        <button class="phone-profile-action" id="phone-profile-clean" type="button">Clean Phone</button>
      </div>
    </section>
  `
}

window.showPhonePage = async function() {
  const existing = document.getElementById('phone-records-page')
  if (existing) existing.remove()

  const page = document.createElement('div')
  page.id = 'phone-records-page'
  page.className = 'full-page miss-page phone-records-home-page'
  page.innerHTML = `
    <div class="page-header miss-header">
      <button class="header-back" id="phone-records-back"><i class="fa fa-angle-left"></i></button>
      <span class="header-title" id="phone-records-title">查看记录</span>
      <span class="header-spacer"></span>
    </div>
    <div class="miss-body" id="phone-records-body"></div>
  `
  page._phoneRecordsState = { view: 'accounts' }
  page.querySelector('#phone-records-back').addEventListener('click', () => handlePhoneRecordsBack(page))
  window.openPage(page)
  await renderPhoneAccountPicker(page)
}

function setPhoneRecordsTitle(page, title) {
  const titleEl = page.querySelector('#phone-records-title')
  if (titleEl) titleEl.textContent = title
}

async function handlePhoneRecordsBack(page) {
  const state = page._phoneRecordsState || {}
  if (state.view === 'roles') {
    await renderPhoneAccountPicker(page)
  } else {
    window.closePage('phone-records-page')
  }
}

async function renderPhoneAccountPicker(page) {
  page._phoneRecordsState = { view: 'accounts' }
  setPhoneRecordsTitle(page, '查看记录')
  const body = page.querySelector('#phone-records-body')
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

  const items = []
  for (const user of users) {
    const profile = await getPhoneSelfProfileFor(user.id)
    items.push({
      user,
      name: getPhoneUserBaseName(user),
      avatar: profile.avatar || user.avatar || ''
    })
  }

  body.innerHTML = `
    <div class="miss-section-title">选择微信账号</div>
    <div class="miss-list">
      ${items.map(item => `
        <button class="miss-row" data-owner-uid="${item.user.id}" type="button">
          <div class="miss-avatar">${buildPhoneAvatarHTML(item.avatar, item.name)}</div>
          <div class="miss-row-main">
            <div class="miss-row-title">${phoneEscHtml(item.name)}</div>
            <div class="miss-row-sub">${phoneEscHtml(item.user.identity?.account ? '@' + item.user.identity.account : item.user.description || '微信账号')}</div>
          </div>
          <i class="fa fa-angle-right"></i>
        </button>
      `).join('')}
    </div>`

  body.querySelectorAll('.miss-row').forEach(row => {
    row.addEventListener('click', () => renderPhoneRolePicker(page, parseInt(row.dataset.ownerUid, 10)))
  })
}

async function renderPhoneRolePicker(page, ownerUid) {
  page._phoneRecordsState = { view: 'roles', ownerUid }
  const body = page.querySelector('#phone-records-body')
  const user = await db.characters.get(ownerUid)
  setPhoneRecordsTitle(page, getPhoneUserBaseName(user))
  body.innerHTML = '<div class="miss-loading"><i class="fa fa-spinner fa-spin"></i></div>'

  const chats = (await db.chats.toArray())
    .filter(c => c.ownerUid === ownerUid)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

  const seen = new Set()
  const items = []
  for (const chat of chats) {
    if (!chat.charId || seen.has(chat.charId)) continue
    seen.add(chat.charId)
    const display = await getPhoneDisplayFor(ownerUid, chat.charId)
    if (!display.char) continue
    items.push({ chat, display })
  }

  if (!items.length) {
    body.innerHTML = `
      <div class="miss-empty">
        <i class="fa fa-comments"></i>
        <div>暂无可选择的角色</div>
        <span>请先用这个微信账号和角色建立私聊</span>
      </div>`
    return
  }

  body.innerHTML = `
    <div class="miss-section-title">选择角色账号</div>
    <div class="miss-list">
      ${items.map(item => `
        <button class="miss-row phone-record-role-row" type="button" data-owner-uid="${ownerUid}" data-char-id="${item.chat.charId}">
          <div class="miss-avatar">${buildPhoneAvatarHTML(item.display.avatar, item.display.name)}</div>
          <div class="miss-row-main">
            <div class="miss-row-title">${phoneEscHtml(item.display.name)}</div>
          </div>
          <i class="fa fa-angle-right"></i>
        </button>
      `).join('')}
    </div>`

  body.querySelectorAll('.phone-record-role-row').forEach((row, index) => {
    const item = items[index]
    row.addEventListener('click', () => {
      showPhoneLockScreen({
        ownerUid,
        charId: item.chat.charId,
        name: item.display.name,
        avatar: item.display.avatar
      })
    })
  })
}

function closePhoneFullscreen() {
  window.closeWechatRolePhonePages?.()
  window.closePhoneAppSnapshotPages?.()
  const el = document.getElementById('phone-fullscreen-overlay')
  if (!el) return
  el.classList.add('is-closing')
  el.classList.remove('show')
  setTimeout(() => el.remove(), 400)
}

async function showPhoneLockScreen(context) {
  const existing = document.getElementById('phone-fullscreen-overlay')
  if (existing) existing.remove()

  context.personalization = await loadPhoneRecordsPersonalization(context)
  context.phoneProfile = await getPhoneProfileCardData(context)
  context.name = context.phoneProfile.name || context.name
  context.avatar = context.phoneProfile.avatar || context.avatar
  const lockMessage = String(context.personalization?.lockMessage || PHONE_LOCK_DEFAULT_MESSAGE).trim() || PHONE_LOCK_DEFAULT_MESSAGE
  const dateParts = getPhoneLockDateParts()

  const overlay = document.createElement('div')
  overlay.id = 'phone-fullscreen-overlay'
  overlay.className = 'phone-fullscreen'

  overlay.innerHTML = `
    <div class="phone-lock-screen" id="phone-lock-view">
      <div class="phone-lock-wallpaper"${buildPhoneWallpaperStyle(context, 'lock')}></div>
      <div class="phone-lock-time">
        <div class="phone-lock-time-digits">${phoneEscHtml(dateParts.time)}</div>
        <div class="phone-lock-date">${phoneEscHtml(dateParts.date)}</div>
      </div>
      <div class="phone-lock-spacer"></div>
      <button class="phone-lock-notification" id="phone-lock-message-card" type="button" aria-label="编辑消息">
        <div class="phone-lock-notif-avatar">${buildPhoneLockAvatarHTML(context.avatar, context.name)}</div>
        <div class="phone-lock-notif-body">
          <div class="phone-lock-notif-name">${phoneEscHtml(context.name || '手机')}</div>
          <div class="phone-lock-notif-hint">${phoneEscHtml(lockMessage)}</div>
        </div>
      </button>
      <div class="phone-fingerprint-area">
        <button class="phone-fingerprint" id="phone-fp-btn" type="button" aria-label="指纹解锁">
          <i class="fa-solid fa-fingerprint"></i>
        </button>
        <div class="phone-fingerprint-hint">轻触解锁</div>
      </div>
      <div class="phone-home-indicator" id="phone-lock-exit">
        <div class="phone-home-indicator-bar"></div>
      </div>
    </div>
  `

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('show'))

  overlay._phoneContext = context

  overlay.querySelector('#phone-fp-btn').addEventListener('click', () => {
    handleFingerprintScan(overlay, context)
  })

  overlay.querySelector('#phone-lock-message-card')?.addEventListener('click', () => {
    openPhoneLockMessageEditor(overlay, context)
  })

  overlay.querySelector('#phone-lock-exit').addEventListener('click', () => {
    closePhoneFullscreen()
  })
}

function openPhoneLockMessageEditor(overlay, context) {
  document.getElementById('phone-lock-message-editor')?.remove()
  document.getElementById('phone-lock-message-editor-overlay')?.remove()

  const value = String(context.personalization?.lockMessage || PHONE_LOCK_DEFAULT_MESSAGE).trim() || PHONE_LOCK_DEFAULT_MESSAGE
  const shade = document.createElement('div')
  shade.id = 'phone-lock-message-editor-overlay'
  shade.className = 'sheet-overlay phone-lock-editor-overlay'
  shade.style.zIndex = '340'

  const modal = document.createElement('div')
  modal.id = 'phone-lock-message-editor'
  modal.className = 'center-modal phone-lock-message-editor'
  modal.style.zIndex = '341'
  modal.innerHTML = `
    <div class="angel-editor-heading">编辑消息</div>
    <div class="angel-editor-form">
      <label>消息<textarea class="input-field" id="phone-lock-message-input" rows="3">${phoneEscHtml(value)}</textarea></label>
      <div class="angel-editor-actions">
        <button class="btn-pill" id="phone-lock-message-cancel" type="button">取消</button>
        <button class="btn-pill angel-editor-save" id="phone-lock-message-save" type="button">保存</button>
      </div>
    </div>
  `

  document.body.appendChild(shade)
  document.body.appendChild(modal)
  requestAnimationFrame(() => {
    shade.classList.add('show')
    modal.classList.add('show')
    modal.querySelector('#phone-lock-message-input')?.focus()
  })

  const close = () => {
    shade.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(() => {
      shade.remove()
      modal.remove()
    }, 220)
  }

  shade.addEventListener('click', close)
  modal.querySelector('#phone-lock-message-cancel')?.addEventListener('click', close)
  modal.querySelector('#phone-lock-message-save')?.addEventListener('click', async () => {
    const input = modal.querySelector('#phone-lock-message-input')
    const next = String(input?.value || '').trim() || PHONE_LOCK_DEFAULT_MESSAGE
    context.personalization = context.personalization || createPhoneRecordsPersonalization()
    context.personalization.lockMessage = next
    await savePhoneRecordsPersonalization(context)
    const hint = overlay.querySelector('.phone-lock-notif-hint')
    if (hint) hint.textContent = next
    window.toast?.('消息已更新')
    close()
  })
}

function handleFingerprintScan(overlay, context) {
  const btn = overlay.querySelector('#phone-fp-btn')
  if (!btn || btn.classList.contains('scanning')) return

  btn.classList.add('scanning')

  setTimeout(() => {
    btn.classList.remove('scanning')
    btn.classList.add('success')

    setTimeout(() => {
      transitionToHomeScreen(overlay, context)
    }, 350)
  }, 600)
}

function transitionToHomeScreen(overlay, context) {
  if (!overlay.querySelector('#phone-home-view')) {
    overlay.insertAdjacentHTML('afterbegin', buildPhoneHomeScreenHTML(context, true))
    bindPhoneHomeEvents(overlay)
  }

  const lockView = overlay.querySelector('#phone-lock-view')
  if (lockView) {
    lockView.classList.add('unlocking')
  }

  setTimeout(() => {
    if (lockView) lockView.remove()
  }, 500)
}

function getPhoneMessageSVG() {
  return '<svg viewBox="0 0 1131 1024" xmlns="http://www.w3.org/2000/svg"><path d="M565.463579 0C253.143579 0 0 213.584842 0 476.267789c0 167.073684 104.394105 321.643789 274.539789 408.090948-22.204632 50.661053-55.888842 98.088421-98.627368 139.641263 83.806316-14.982737 162.762105-45.702737 230.130526-91.405474 51.738947 13.258105 106.010947 19.941053 160.282948 19.941053C878.645895 952.535579 1131.789474 738.896842 1131.789474 476.267789 1130.981053 213.584842 877.837474 0 565.463579 0z"/></svg>'
}

function getPhonePornhubSVG() {
  var pornD = 'M90.86 20.36c-.22-.94-.62-1.8-1.18-2.54-.57-.75-1.4-1.36-2.52-1.84s-2.32-.72-3.66-.72c-2.42-.14-6.36.78-7.54 2.67v-2.16h-5.63v22.9h6.06V28.3c0-2.56.14-4.3.45-5.26.3-.95.88-1.7 1.7-2.3.85-.56 1.8-.85 2.84-.85.8 0 1.5.2 2.1.6.57.4 1 .96 1.25 1.7.26.7.4 2.3.4 4.78v11.68h6.05V24.44c0-1.77-.12-3.13-.34-4.08M62 15.34c-1.8.23-3.5 1.68-4.25 2.6v-2.17h-5.63v22.9h6.06V31.6c0-3.9.17-6.46.5-7.68.34-1.22.8-2.06 1.4-2.53.58-.48 1.3-.7 2.15-.7.88 0 1.82.32 2.84.98l1.88-5.28c-1.28-.76-2.6-1.14-4-1.14-.32 0-.64.03-.95.08m-24.7-.08c-2.25 0-4.28.5-6.1 1.48-1.8 1-3.22 2.43-4.2 4.3-1 1.9-1.5 3.84-1.5 5.86 0 2.63.5 4.86 1.5 6.7.98 1.82 2.43 3.2 4.34 4.16 1.9.95 3.9 1.42 6 1.42 3.4 0 6.2-1.14 8.44-3.4s3.35-5.16 3.35-8.63c0-3.43-1.1-6.27-3.32-8.52-2.2-2.25-5.04-3.37-8.5-3.37m4 17.18c-1.08 1.2-2.4 1.8-3.98 1.8s-2.9-.6-4-1.8c-1.07-1.2-1.6-2.95-1.6-5.22s.53-4 1.6-5.22c1.1-1.2 2.42-1.8 4-1.8s2.9.6 3.98 1.8c1.07 1.2 1.6 2.93 1.6 5.18 0 2.3-.53 4.05-1.6 5.26M17.83 7.54c-1.18-.32-3.7-.48-7.6-.48H0v31.6h6.38V26.74h4.16c2.9 0 5.1-.15 6.62-.45 1.12-.25 2.22-.75 3.3-1.5s2-1.8 2.7-3.12 1.05-2.95 1.05-4.9c0-2.5-.6-4.56-1.82-6.15-1.23-1.6-2.74-2.62-4.55-3.1m-.92 11.8c-.47.7-1.13 1.22-1.98 1.55s-2.53.5-5.05.5h-3.5V12.4h3.1c2.3 0 3.82.08 4.58.23 1.04.18 1.9.65 2.57 1.4.67.74 1 1.7 1 2.84 0 .94-.23 1.76-.7 2.46'
  var hubD = 'M170.05 19.3c-1.22-1.35-2.87-2.22-4.66-2.62-.52-.13-1.1-.23-1.76-.26-2.37-.2-5.4.73-6.82 1.92l.34-9.7h-5.76v30.04h5.35v-1.66c1.23 1 3.2 2.15 6.23 2.15H163.54c2.53 0 4.68-1 6.45-3 1.77-2.02 2.65-4.88 2.65-8.6 0-3.6-.86-6.35-2.6-8.27M165.4 33c-.88 1.08-1.97 1.62-3.24 1.62-1.65 0-2.98-.76-3.97-2.3-.72-1.07-1.08-2.74-1.08-5 0-2.18.46-3.8 1.37-4.88.9-1.07 2.06-1.6 3.44-1.6 1.4 0 2.56.54 3.46 1.64s1.35 2.9 1.35 5.38c0 2.34-.45 4.05-1.34 5.13m-23.28-6.9c0 3.1-.14 5.07-.43 5.87-.3.8-.83 1.47-1.6 2-.8.55-1.67.8-2.65.8-.86 0-1.57-.2-2.13-.6s-.95-.94-1.16-1.63c-.2-.7-.32-2.56-.32-5.63v-10h-5.76v13.8c0 2.04.26 3.64.78 4.8s1.36 2.07 2.52 2.7c1.16.65 2.47.97 3.94.97.22 0 .43 0 .65-.02 3.68-.1 5.6-1.77 6.56-2.87v2.4h5.35V16.9h-5.76zm-18.8-7.05c-.53-.77-1.33-1.4-2.4-1.9-.96-.43-2.03-.67-3.2-.72h-.06c-2.43-.13-5.53.58-6.98 1.97V8.64h-5.76v30.04h5.76v-10.9c0-1.83.17-3.22.52-4.15.35-.94.9-1.64 1.65-2.1.75-.47 1.6-.7 2.56-.7.84 0 1.54.18 2.1.54.54.36.93.85 1.15 1.47.22.6.33 2.06.33 4.34v11.5h5.75V25.9c0-1.94-.1-3.38-.3-4.3-.2-.94-.56-1.8-1.1-2.55'
  var themed = 'fill:var(--icon-color,var(--c-accent-dark))'
  return '<svg viewBox="4 5 92 90" xmlns="http://www.w3.org/2000/svg">'
    + '<g transform="translate(8 1.5) scale(0.921)"><path d="' + pornD + '" style="' + themed + '"/></g>'
    + '<rect x="6" y="45" width="88" height="48" rx="11" style="' + themed + '"/>'
    + '<g transform="translate(-77 47.09) scale(0.915)"><path d="' + hubD + '" style="fill:#ffffff"/></g>'
    + '</svg>'
}

function getPhoneInstagramSVG() {
  return '<svg xmlns="http://www.w3.org/2000/svg" height="800" width="800" viewBox="-24 -24 719.788 719.788"><g fill="#100f0d"><path d="M335.895 0c-91.224 0-102.663.387-138.49 2.021-35.752 1.631-60.169 7.31-81.535 15.612-22.088 8.584-40.82 20.07-59.493 38.743-18.674 18.673-30.16 37.407-38.743 59.495C9.33 137.236 3.653 161.653 2.02 197.405.386 233.232 0 244.671 0 335.895c0 91.222.386 102.661 2.02 138.488 1.633 35.752 7.31 60.169 15.614 81.534 8.584 22.088 20.07 40.82 38.743 59.495 18.674 18.673 37.405 30.159 59.493 38.743 21.366 8.302 45.783 13.98 81.535 15.612 35.827 1.634 47.266 2.021 138.49 2.021 91.222 0 102.661-.387 138.488-2.021 35.752-1.631 60.169-7.31 81.534-15.612 22.088-8.584 40.82-20.07 59.495-38.743 18.673-18.675 30.159-37.407 38.743-59.495 8.302-21.365 13.981-45.782 15.612-81.534 1.634-35.827 2.021-47.266 2.021-138.488 0-91.224-.387-102.663-2.021-138.49-1.631-35.752-7.31-60.169-15.612-81.534-8.584-22.088-20.07-40.822-38.743-59.495-18.675-18.673-37.407-30.159-59.495-38.743-21.365-8.302-45.782-13.981-81.534-15.612C438.556.387 427.117 0 335.895 0zm0 60.521c89.686 0 100.31.343 135.729 1.959 32.75 1.493 50.535 6.965 62.37 11.565 15.68 6.094 26.869 13.372 38.622 25.126 11.755 11.754 19.033 22.944 25.127 38.622 4.6 11.836 10.072 29.622 11.565 62.371 1.616 35.419 1.959 46.043 1.959 135.73 0 89.687-.343 100.311-1.959 135.73-1.493 32.75-6.965 50.535-11.565 62.37-6.094 15.68-13.372 26.869-25.127 38.622-11.753 11.755-22.943 19.033-38.621 25.127-11.836 4.6-29.622 10.072-62.371 11.565-35.413 1.616-46.036 1.959-135.73 1.959-89.694 0-100.315-.343-135.73-1.96-32.75-1.492-50.535-6.964-62.37-11.564-15.68-6.094-26.869-13.372-38.622-25.127-11.754-11.753-19.033-22.943-25.127-38.621-4.6-11.836-10.071-29.622-11.565-62.371-1.616-35.419-1.959-46.043-1.959-135.73 0-89.687.343-100.311 1.959-135.73 1.494-32.75 6.965-50.535 11.565-62.37 6.094-15.68 13.373-26.869 25.126-38.622 11.754-11.755 22.944-19.033 38.622-25.127 11.836-4.6 29.622-10.072 62.371-11.565 35.419-1.616 46.043-1.959 135.73-1.959"/><path d="M335.895 447.859c-61.838 0-111.966-50.128-111.966-111.964 0-61.838 50.128-111.966 111.966-111.966 61.836 0 111.964 50.128 111.964 111.966 0 61.836-50.128 111.964-111.964 111.964zm0-284.451c-95.263 0-172.487 77.224-172.487 172.487 0 95.261 77.224 172.485 172.487 172.485 95.261 0 172.485-77.224 172.485-172.485 0-95.263-77.224-172.487-172.485-172.487m219.608-6.815c0 22.262-18.047 40.307-40.308 40.307-22.26 0-40.307-18.045-40.307-40.307 0-22.261 18.047-40.308 40.307-40.308 22.261 0 40.308 18.047 40.308 40.308"/></g></svg>'
}

function buildPhoneHomeScreenHTML(context, entering) {
  const dockApps = getPhoneRecordsDockApps()

  return `
    <div class="phone-home-screen${entering ? ' entering' : ''}" id="phone-home-view">
      <div class="phone-home-wallpaper"${buildPhoneWallpaperStyle(context, 'home')}></div>
      ${buildPhoneProfileCardHTML(context)}
      <div class="phone-home-grid">
        ${PHONE_RECORDS_GRID_APPS.map(app => buildPhoneAppIconHTML(app, context)).join('')}
      </div>
      <div class="phone-home-dock">
        ${dockApps.map(app => {
          const custom = getPhoneAppCustom(context, app.id)
          return `
            <button class="phone-home-app phone-app-${phoneEscHtml(app.id)}" type="button" data-phone-app="${phoneEscHtml(app.id)}">
              <span class="phone-home-app-icon"${buildPhoneIconStyle(custom)}>${buildPhoneIconContent(app, custom)}</span>
              <span class="phone-home-app-label">${phoneEscHtml(app.label)}</span>
            </button>`
        }).join('')}
      </div>
      <div class="phone-home-indicator" id="phone-home-exit">
        <div class="phone-home-indicator-bar"></div>
      </div>
    </div>
  `
}

function bindPhoneHomeEvents(overlay) {
  overlay.querySelector('#phone-home-exit')?.addEventListener('click', () => {
    closePhoneFullscreen()
  })

  overlay.querySelector('#phone-profile-edit')?.addEventListener('click', () => {
    window.openPhoneEditPanel?.(overlay._phoneContext)
  })

  overlay.querySelector('#phone-profile-clean')?.addEventListener('click', () => {
    window.openPhoneCleanPanel?.(overlay._phoneContext)
  })

  overlay.querySelectorAll('.phone-home-app').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.phoneApp === 'iscreens') {
        showPhoneIScreenPage(overlay, overlay._phoneContext)
      } else if (btn.dataset.phoneApp === 'wechat') {
        window.showWechatRolePhonePage?.(overlay._phoneContext)
      } else if (window.PHONE_GEN_APP_LABELS?.[btn.dataset.phoneApp]) {
        window.openPhoneAppPage?.(btn.dataset.phoneApp, overlay._phoneContext)
      } else {
        window.toast?.('功能暂未开放')
      }
    })
  })
}

function renderPhoneHomeInOverlay(overlay, context) {
  overlay.innerHTML = buildPhoneHomeScreenHTML(context, true)
  bindPhoneHomeEvents(overlay)
}

function refreshPhoneHomePersonalization(overlay, context) {
  const lockWallpaper = getPhoneWallpaper(context, 'lock')
  const homeWallpaper = getPhoneWallpaper(context, 'home')
  overlay.querySelectorAll('.phone-lock-wallpaper').forEach(el => {
    el.style.backgroundImage = lockWallpaper ? `url('${lockWallpaper}')` : ''
  })
  overlay.querySelectorAll('.phone-home-wallpaper').forEach(el => {
    el.style.backgroundImage = homeWallpaper ? `url('${homeWallpaper}')` : ''
  })

  getPhoneRecordsAllApps().forEach(app => {
    const custom = getPhoneAppCustom(context, app.id)
    overlay.querySelectorAll('.phone-home-app').forEach(btn => {
      if (btn.dataset.phoneApp !== app.id) return
      const iconEl = btn.querySelector('.phone-home-app-icon')
      if (!iconEl) return
      iconEl.innerHTML = buildPhoneIconContent(app, custom)
      if (custom.color) iconEl.style.setProperty('--icon-color', custom.color)
      else iconEl.style.removeProperty('--icon-color')
    })
  })
}

function showPhoneIScreenPage(overlay, context) {
  const existing = overlay.querySelector('#phone-iscreen-page')
  if (existing) existing.remove()

  const page = document.createElement('div')
  page.id = 'phone-iscreen-page'
  page.className = 'phone-iscreen-page'
  page.innerHTML = `
    <div class="page-header">
      <button class="header-back" id="phone-iscreen-back" type="button">
        <i class="fa fa-angle-left"></i>
      </button>
      <span class="header-title">iScreen</span>
    </div>
    <div class="phone-iscreen-scroll">
      <section class="phone-iscreen-gallery-section">
        <div class="iscreen-pack-toolbar">
          <div class="phone-iscreen-heading">
            <div class="phone-iscreen-section-title">图库</div>
          </div>
        </div>
        <div class="phone-gallery-grid">
          <div class="phone-gallery-card">
            <div class="phone-gallery-card-head">
              <div class="phone-gallery-card-title">壁纸图库</div>
              <button class="iscreen-reset-all" id="phone-wallpaper-gallery-add" type="button">添加图片</button>
            </div>
            <div class="phone-gallery-thumbs" id="phone-wallpaper-gallery-list"></div>
          </div>
          <div class="phone-gallery-card">
            <div class="phone-gallery-card-head">
              <div class="phone-gallery-card-title">图标图库</div>
              <button class="iscreen-reset-all" id="phone-icon-gallery-add" type="button">添加图片</button>
            </div>
            <div class="phone-gallery-thumbs" id="phone-icon-gallery-list"></div>
          </div>
        </div>
      </section>
      <section class="phone-iscreen-preset-section">
        <div class="iscreen-pack-toolbar">
          <div class="phone-iscreen-heading">
            <div class="phone-iscreen-section-title">预设</div>
            <div class="iscreen-pack-subtitle">保存当前壁纸和图标，所有账号角色通用</div>
          </div>
        </div>
        <div class="phone-preset-panel">
          <div class="phone-preset-save-row">
            <input class="input-field phone-preset-name-input" id="phone-preset-name-input" maxlength="20" placeholder="预设名称">
            <button class="iscreen-action phone-preset-save" id="phone-preset-save" type="button">保存预设</button>
          </div>
          <div class="phone-preset-apply-row">
            <select class="input-field phone-preset-select" id="phone-preset-select"></select>
            <button class="iscreen-action phone-preset-apply" id="phone-preset-apply" type="button">选择预设</button>
          </div>
        </div>
      </section>
      <section class="phone-iscreen-wallpaper-section">
        <div class="iscreen-pack-toolbar">
          <div class="phone-iscreen-heading">
            <div class="phone-iscreen-section-title">壁纸</div>
            <div class="iscreen-pack-subtitle">锁屏和主页面可分别设置</div>
          </div>
          <button class="iscreen-reset-all" id="phone-wallpapers-reset" type="button">全部恢复</button>
        </div>
        <div class="phone-wallpaper-pair">
          <div class="phone-wallpaper-card" data-wallpaper-type="lock">
            <div class="phone-wallpaper-card-title">锁屏壁纸</div>
            <div class="phone-wallpaper-preview phone-wallpaper-preview-lock">
              <div class="phone-wallpaper-preview-bg"></div>
            </div>
            <div class="phone-wallpaper-actions">
              <button class="phone-wallpaper-pick" data-action="pick-wallpaper" data-wallpaper-type="lock" type="button">
                <i class="fa fa-image"></i><span>选择</span>
              </button>
            </div>
          </div>
          <div class="phone-wallpaper-card" data-wallpaper-type="home">
            <div class="phone-wallpaper-card-title">主页面壁纸</div>
            <div class="phone-wallpaper-preview phone-wallpaper-preview-home">
              <div class="phone-wallpaper-preview-bg"></div>
            </div>
            <div class="phone-wallpaper-actions">
              <button class="phone-wallpaper-pick" data-action="pick-wallpaper" data-wallpaper-type="home" type="button">
                <i class="fa fa-image"></i><span>选择</span>
              </button>
            </div>
          </div>
        </div>
      </section>
      <section>
        <div class="iscreen-pack-toolbar">
          <div class="phone-iscreen-heading">
            <div class="phone-iscreen-section-title">图标</div>
            <div class="iscreen-pack-subtitle">替换颜色或图片</div>
          </div>
          <button class="iscreen-reset-all" id="phone-icons-reset" type="button">全部恢复</button>
        </div>
        <div class="iscreen-list" id="phone-iscreen-icon-list"></div>
      </section>
    </div>
  `
  overlay.appendChild(page)
  requestAnimationFrame(() => page.classList.add('show'))

  page.querySelector('#phone-iscreen-back').addEventListener('click', () => closePhoneIScreenPage(page))
  bindPhoneIScreenGallery(page, context)
  bindPhoneIScreenPresets(page, overlay, context)
  bindPhoneIScreenWallpaper(page, overlay, context)
  renderPhoneIScreenIconControls(page, overlay, context)
  renderPhoneWallpaperPreview(page, context)
  renderPhoneGalleries(page, context)
  renderPhoneIScreenPresets(page)
}

function closePhoneIScreenPage(page) {
  page.classList.remove('show')
  page.classList.add('is-closing')
  setTimeout(() => page.remove(), 280)
}

function bindPhoneIScreenWallpaper(page, overlay, context) {
  page.querySelectorAll('[data-action="pick-wallpaper"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.wallpaperType === 'lock' ? 'lock' : 'home'
      window.showImagePicker(async imageUrl => {
        context.personalization = context.personalization || createPhoneRecordsPersonalization()
        if (type === 'lock') context.personalization.lockWallpaper = imageUrl
        else context.personalization.homeWallpaper = imageUrl
        await savePhoneRecordsPersonalization(context)
        refreshPhoneHomePersonalization(overlay, context)
        renderPhoneWallpaperPreview(page, context)
        window.toast?.('壁纸已更新')
      })
    })
  })

  page.querySelector('#phone-wallpapers-reset').addEventListener('click', async () => {
    context.personalization = context.personalization || createPhoneRecordsPersonalization()
    context.personalization.lockWallpaper = ''
    context.personalization.homeWallpaper = ''
    await savePhoneRecordsPersonalization(context)
    refreshPhoneHomePersonalization(overlay, context)
    renderPhoneWallpaperPreview(page, context)
    window.toast?.('已恢复默认壁纸')
  })
}

function renderPhoneWallpaperPreview(page, context) {
  const lockBg = page.querySelector('.phone-wallpaper-preview-lock .phone-wallpaper-preview-bg')
  const homeBg = page.querySelector('.phone-wallpaper-preview-home .phone-wallpaper-preview-bg')
  if (lockBg) lockBg.style.backgroundImage = getPhoneWallpaper(context, 'lock') ? `url('${getPhoneWallpaper(context, 'lock')}')` : ''
  if (homeBg) homeBg.style.backgroundImage = getPhoneWallpaper(context, 'home') ? `url('${getPhoneWallpaper(context, 'home')}')` : ''
}

function bindPhoneIScreenGallery(page, context) {
  page.querySelector('#phone-wallpaper-gallery-add').addEventListener('click', () => {
    window.showImagePicker(async imageUrl => {
      context.personalization = context.personalization || createPhoneRecordsPersonalization()
      context.personalization.wallpaperGallery = context.personalization.wallpaperGallery || []
      context.personalization.wallpaperGallery.push(imageUrl)
      await savePhoneRecordsPersonalization(context)
      renderPhoneGalleries(page, context)
      window.toast?.('已添加到壁纸图库')
    })
  })

  page.querySelector('#phone-icon-gallery-add').addEventListener('click', () => {
    window.showImagePicker(async imageUrl => {
      context.personalization = context.personalization || createPhoneRecordsPersonalization()
      context.personalization.iconGallery = context.personalization.iconGallery || []
      context.personalization.iconGallery.push(imageUrl)
      await savePhoneRecordsPersonalization(context)
      renderPhoneGalleries(page, context)
      window.toast?.('已添加到图标图库')
    })
  })
}

function renderPhoneGalleries(page, context) {
  renderPhoneGalleryList(page.querySelector('#phone-wallpaper-gallery-list'), context.personalization?.wallpaperGallery || [])
  renderPhoneGalleryList(page.querySelector('#phone-icon-gallery-list'), context.personalization?.iconGallery || [])
}

function renderPhoneGalleryList(list, images) {
  if (!list) return
  if (!images.length) {
    list.innerHTML = '<div class="phone-gallery-empty">暂无图片</div>'
    return
  }
  list.innerHTML = images.map(src => `<span class="phone-gallery-thumb"><img src="${phoneEscHtml(src)}" alt=""></span>`).join('')
}

async function renderPhoneIScreenPresets(page) {
  const select = page.querySelector('#phone-preset-select')
  if (!select) return
  const presets = await loadPhoneIScreenPresets()
  if (!presets.length) {
    select.innerHTML = '<option value="">暂无预设</option>'
    select.disabled = true
    page.querySelector('#phone-preset-apply')?.setAttribute('disabled', 'disabled')
    return
  }
  select.disabled = false
  page.querySelector('#phone-preset-apply')?.removeAttribute('disabled')
  select.innerHTML = presets
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .map(preset => `<option value="${phoneEscHtml(preset.id)}">${phoneEscHtml(preset.name)}</option>`)
    .join('')
}

function bindPhoneIScreenPresets(page, overlay, context) {
  page.querySelector('#phone-preset-save')?.addEventListener('click', async () => {
    const input = page.querySelector('#phone-preset-name-input')
    const presets = await loadPhoneIScreenPresets()
    const name = String(input?.value || '').trim() || `手机预设 ${presets.length + 1}`
    presets.push(buildPhoneIScreenPresetFromContext(context, name))
    await savePhoneIScreenPresets(presets)
    if (input) input.value = ''
    await renderPhoneIScreenPresets(page)
    window.toast?.('预设已保存')
  })

  page.querySelector('#phone-preset-apply')?.addEventListener('click', async () => {
    const select = page.querySelector('#phone-preset-select')
    const presetId = select?.value || ''
    if (!presetId) return
    const presets = await loadPhoneIScreenPresets()
    const preset = presets.find(item => item.id === presetId)
    if (!preset) {
      window.toast?.('预设不存在')
      await renderPhoneIScreenPresets(page)
      return
    }

    context.personalization = context.personalization || createPhoneRecordsPersonalization()
    context.personalization.lockWallpaper = preset.lockWallpaper || ''
    context.personalization.homeWallpaper = preset.homeWallpaper || ''
    context.personalization.icons = clonePhoneRecordsValue(preset.icons || {})
    await savePhoneRecordsPersonalization(context)
    refreshPhoneHomePersonalization(overlay, context)
    renderPhoneWallpaperPreview(page, context)
    renderPhoneIScreenIconControls(page, overlay, context)
    window.toast?.('预设已应用')
  })
}

function renderPhoneIScreenIconControls(page, overlay, context) {
  const list = page.querySelector('#phone-iscreen-icon-list')
  list.innerHTML = getPhoneRecordsAllApps().map(app => {
    const custom = getPhoneAppCustom(context, app.id)
    const color = custom.color || PHONE_RECORDS_DEFAULT_ICON_COLOR
    return `
      <div class="iscreen-row" data-icon-id="${phoneEscHtml(app.id)}">
        <div class="iscreen-row-icon">
          <div class="phone-home-app-icon"${buildPhoneIconStyle(custom)}>${buildPhoneIconContent(app, custom)}</div>
        </div>
        <div class="iscreen-row-main">
          <div class="iscreen-row-label">${phoneEscHtml(app.label)}</div>
          <div class="iscreen-row-sub">${custom.image ? '已替换图片' : '使用原图标'}</div>
          <div class="iscreen-row-actions">
            <button class="iscreen-action" data-action="replace" type="button">替换图标</button>
            <button class="iscreen-action" data-action="restore-image" type="button">恢复图标</button>
          </div>
        </div>
        <label class="iscreen-color-control" title="图标颜色" aria-label="图标颜色">
          <span class="iscreen-color-swatch" style="background:${phoneEscHtml(color)}"></span>
          <input type="color" value="${phoneEscHtml(color)}" data-action="color">
        </label>
      </div>
    `
  }).join('')

  list.querySelectorAll('.iscreen-row').forEach(row => {
    const iconId = row.dataset.iconId
    row.querySelector('[data-action="replace"]').addEventListener('click', () => {
      window.showImagePicker(async imageUrl => {
        context.personalization = context.personalization || createPhoneRecordsPersonalization()
        context.personalization.icons = context.personalization.icons || {}
        context.personalization.icons[iconId] = Object.assign({}, getPhoneAppCustom(context, iconId), { image: imageUrl })
        await savePhoneRecordsPersonalization(context)
        refreshPhoneHomePersonalization(overlay, context)
        renderPhoneIScreenIconControls(page, overlay, context)
        renderPhoneWallpaperPreviewIcons(page, context)
        window.toast?.('图标已替换')
      })
    })

    row.querySelector('[data-action="restore-image"]').addEventListener('click', async () => {
      const custom = Object.assign({}, getPhoneAppCustom(context, iconId))
      delete custom.image
      context.personalization = context.personalization || createPhoneRecordsPersonalization()
      context.personalization.icons = context.personalization.icons || {}
      if (custom.color) context.personalization.icons[iconId] = custom
      else delete context.personalization.icons[iconId]
      await savePhoneRecordsPersonalization(context)
      refreshPhoneHomePersonalization(overlay, context)
      renderPhoneIScreenIconControls(page, overlay, context)
      renderPhoneWallpaperPreviewIcons(page, context)
      window.toast?.('已恢复原图标')
    })

    row.querySelector('[data-action="color"]').addEventListener('input', async e => {
      context.personalization = context.personalization || createPhoneRecordsPersonalization()
      context.personalization.icons = context.personalization.icons || {}
      context.personalization.icons[iconId] = Object.assign({}, getPhoneAppCustom(context, iconId), { color: e.target.value })
      await savePhoneRecordsPersonalization(context)
      refreshPhoneHomePersonalization(overlay, context)
      row.querySelector('.phone-home-app-icon')?.style.setProperty('--icon-color', e.target.value)
      const swatch = row.querySelector('.iscreen-color-swatch')
      if (swatch) swatch.style.background = e.target.value
      renderPhoneWallpaperPreviewIcons(page, context)
    })
  })

  page.querySelector('#phone-icons-reset').onclick = async () => {
    context.personalization = context.personalization || createPhoneRecordsPersonalization()
    context.personalization.icons = {}
    await savePhoneRecordsPersonalization(context)
    refreshPhoneHomePersonalization(overlay, context)
    renderPhoneIScreenIconControls(page, overlay, context)
    renderPhoneWallpaperPreviewIcons(page, context)
    window.toast?.('已恢复默认图标')
  }
}

function renderPhoneWallpaperPreviewIcons(page, context) {
}
