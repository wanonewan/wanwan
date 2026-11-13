// wechat.js — 微信聊天模块
// 依赖：db.js 必须先加载

// ===== 常用时区列表 =====
const COMMON_TIMEZONES = [
  { label: '── 亚洲 ──', value: '', disabled: true },
  { label: '(UTC+8) 中国 - 北京/上海', value: 'Asia/Shanghai' },
  { label: '(UTC+8) 中国 - 香港', value: 'Asia/Hong_Kong' },
  { label: '(UTC+8) 中国 - 台北', value: 'Asia/Taipei' },
  { label: '(UTC+8) 新加坡', value: 'Asia/Singapore' },
  { label: '(UTC+9) 日本 - 东京', value: 'Asia/Tokyo' },
  { label: '(UTC+9) 韩国 - 首尔', value: 'Asia/Seoul' },
  { label: '(UTC+7) 泰国 - 曼谷', value: 'Asia/Bangkok' },
  { label: '(UTC+7) 越南 - 胡志明市', value: 'Asia/Ho_Chi_Minh' },
  { label: '(UTC+5:30) 印度 - 加尔各答', value: 'Asia/Kolkata' },
  { label: '(UTC+3) 沙特 - 利雅得', value: 'Asia/Riyadh' },
  { label: '(UTC+4) 阿联酋 - 迪拜', value: 'Asia/Dubai' },
  { label: '── 欧洲 ──', value: '', disabled: true },
  { label: '(UTC+0/+1) 英国 - 伦敦', value: 'Europe/London' },
  { label: '(UTC+1/+2) 法国 - 巴黎', value: 'Europe/Paris' },
  { label: '(UTC+1/+2) 德国 - 柏林', value: 'Europe/Berlin' },
  { label: '(UTC+1/+2) 意大利 - 罗马', value: 'Europe/Rome' },
  { label: '(UTC+1/+2) 西班牙 - 马德里', value: 'Europe/Madrid' },
  { label: '(UTC+2/+3) 希腊 - 雅典', value: 'Europe/Athens' },
  { label: '(UTC+3) 俄罗斯 - 莫斯科', value: 'Europe/Moscow' },
  { label: '── 美洲 ──', value: '', disabled: true },
  { label: '(UTC-5/-4) 美东 - 纽约', value: 'America/New_York' },
  { label: '(UTC-6/-5) 美中 - 芝加哥', value: 'America/Chicago' },
  { label: '(UTC-7/-6) 美山 - 丹佛', value: 'America/Denver' },
  { label: '(UTC-8/-7) 美西 - 洛杉矶', value: 'America/Los_Angeles' },
  { label: '(UTC-3) 巴西 - 圣保罗', value: 'America/Sao_Paulo' },
  { label: '(UTC-5) 秘鲁 - 利马', value: 'America/Lima' },
  { label: '(UTC-4/-3) 加拿大 - 多伦多', value: 'America/Toronto' },
  { label: '(UTC-8/-7) 加拿大 - 温哥华', value: 'America/Vancouver' },
  { label: '── 大洋洲 ──', value: '', disabled: true },
  { label: '(UTC+10/+11) 澳大利亚 - 悉尼', value: 'Australia/Sydney' },
  { label: '(UTC+8) 澳大利亚 - 珀斯', value: 'Australia/Perth' },
  { label: '(UTC+12/+13) 新西兰 - 奥克兰', value: 'Pacific/Auckland' },
  { label: '(UTC+10) 关岛', value: 'Pacific/Guam' },
  { label: '(UTC-10) 夏威夷', value: 'Pacific/Honolulu' },
  { label: '── 非洲 ──', value: '', disabled: true },
  { label: '(UTC+2) 埃及 - 开罗', value: 'Africa/Cairo' },
  { label: '(UTC+1) 尼日利亚 - 拉各斯', value: 'Africa/Lagos' },
  { label: '(UTC+2) 南非 - 约翰内斯堡', value: 'Africa/Johannesburg' },
  { label: '(UTC+3) 肯尼亚 - 内罗毕', value: 'Africa/Nairobi' },
]

function buildTimezoneOptions(selectedValue) {
  return COMMON_TIMEZONES.map(tz =>
    tz.disabled
      ? `<option value="" disabled>${tz.label}</option>`
      : `<option value="${tz.value}"${tz.value === selectedValue ? ' selected' : ''}>${tz.label}</option>`
  ).join('')
}

function getTimeOfDay(h) {
  return h < 6 ? '深夜' : h < 12 ? '上午' : h < 14 ? '中午' : h < 18 ? '下午' : h < 22 ? '晚上' : '夜里'
}

// ===== 登录状态管理 =====
let _wechatUser = null
let _wechatUid  = null
let _wechatRolePhoneSession = null
const WECHAT_SWITCH_UIDS_KEY = 'wanwan_wechat_switch_uids'

const WECHAT_MEMORY_DEFAULT = 100
const WECHAT_MEMORY_MIN = 1
const WECHAT_MEMORY_MAX = 1000
const CHAT_TIME_SETTINGS_DEFAULT = { enabled: true, mode: 'center', awareness: false }
const CHAT_BILINGUAL_DEFAULT = { enabled: false, sourceLang: 'ko', targetLang: 'zh-Hans' }
const CHAT_ACTIVE_REPLY_DEFAULT = {
  enabled: false,
  intervalMinutes: 30,
  dndEnabled: true,
  dndStart: '00:00',
  dndEnd: '08:00'
}
const CHAT_ACTIVE_REPLY_CHECK_MS = 120 * 1000
const CHAT_BILINGUAL_LANGUAGES = [
  { code: 'ko', label: '韩语' },
  { code: 'en', label: '英语' },
  { code: 'ja', label: '日语' },
  { code: 'yue', label: '粤语' },
  { code: 'zh-Hans', label: '简体中文' },
  { code: 'zh-Hant', label: '繁体中文' },
  { code: 'fr', label: '法语' },
  { code: 'de', label: '德语' },
  { code: 'es', label: '西班牙语' },
  { code: 'it', label: '意大利语' },
  { code: 'pt', label: '葡萄牙语' },
  { code: 'ru', label: '俄语' },
  { code: 'th', label: '泰语' },
  { code: 'vi', label: '越南语' },
  { code: 'id', label: '印尼语' },
  { code: 'ar', label: '阿拉伯语' }
]
// 各源语言对应的「原文」示例，让双语 prompt 的示例与所选语言一致，避免写死英语把模型带偏
const CHAT_BILINGUAL_EXAMPLE_SRC = {
  ko: '물론이죠, 좋아요.',
  en: "Of course, I'd love to.",
  ja: 'もちろん、喜んで。',
  yue: '梗係好啦。',
  fr: 'Bien sûr, avec plaisir.',
  de: 'Natürlich, sehr gerne.',
  es: 'Claro, me encantaría.',
  it: 'Certo, con piacere.',
  pt: 'Claro, adoraria.',
  ru: 'Конечно, с удовольствием.',
  th: 'ได้สิ ยินดีเลย',
  vi: 'Tất nhiên rồi, tôi rất vui lòng.',
  id: 'Tentu saja, dengan senang hati.',
  ar: 'بالطبع، يسعدني ذلك.'
}
const CHAT_TIME_GAP_MS = 10 * 60 * 1000
// “重回”版本只在当前页面运行期保留，不写入任何持久化存储。
const _privateReplyVersions = new Map()
const _activeReplyTriggeredFingerprints = new Map()
const _activeReplyFailCount = new Map() // 主动回复连续失败次数（后台失败不弹窗，之前会因此再也不重试）
const _activeReplyRetryAfter = new Map() // 失败后多久之后才允许重试
let _wechatActiveReplyMonitorStarted = false
// 聊天首屏只渲染最近这么多条消息，往上点「加载更早」再补一窗，避免长聊天 DOM 过大致 iOS Safari 内存崩溃
const WECHAT_RENDER_WINDOW = 60
// 反复点「加载历史消息」时，DOM 里已渲染的消息行总数上限；超出后从最下方（当前不可见的一端）裁掉多余部分
const WECHAT_RENDER_MAX_ROWS = WECHAT_RENDER_WINDOW * 4
const WECHAT_BLOB_HYDRATE_BATCH_SIZE = 8
const WECHAT_CHAT_OPEN_DEBUG_KEY = '__wanwanChatOpenDebug'
const CHAT_BEAUTY_BASE_VARS = {
  '--c-bg': '#ffffff',
  '--c-surface': '#fbfbfb',
  '--c-surface-2': '#f3f3f3',
  '--c-border': 'rgba(0, 0, 0, 0.05)',
  '--c-border-m': 'rgba(0, 0, 0, 0.09)',
  '--c-accent': '#8a8a8a',
  '--c-accent-light': '#f3f3f3',
  '--c-accent-dark': '#787878',
  '--c-text': '#3a3a3a',
  '--c-sub': '#888888',
  '--c-hint': '#b8b8b8',
  '--c-rose': '#8c8c8c',
  '--c-green': '#888888',
  '--c-red': '#b05a5a',
  '--c-warn': '#8a7a5a'
}
const CHAT_BEAUTY_CLASS_GROUPS = window.WANWAN_CHAT_BEAUTY_CLASS_GROUPS
const CHAT_BEAUTY_CLASS_TEXT = CHAT_BEAUTY_CLASS_GROUPS.map(group =>
  `${group.label}：\n${group.items.join('\n')}`
).join('\n\n')
const CHAT_BEAUTY_CLASS_HINT = `请在这里输入聊天页面美化 CSS。
可使用以下类名：

${CHAT_BEAUTY_CLASS_TEXT}`

function getWechatChatOpenDebugStore() {
  if (!window[WECHAT_CHAT_OPEN_DEBUG_KEY]) {
    Object.defineProperty(window, WECHAT_CHAT_OPEN_DEBUG_KEY, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: { lastError: null, history: [] }
    })
  }
  return window[WECHAT_CHAT_OPEN_DEBUG_KEY]
}

function logWechatChatOpenIssue(stage, error, extra = {}) {
  const err = error instanceof Error ? error : new Error(String(error || 'Unknown error'))
  const payload = {
    stage,
    chatId: extra.chatId ?? null,
    charId: extra.charId ?? null,
    message: err.message || String(error || ''),
    stack: err.stack || '',
    userAgent: navigator.userAgent || '',
    timestamp: Date.now()
  }
  if (extra.note) payload.note = extra.note
  const store = getWechatChatOpenDebugStore()
  store.lastError = payload
  store.history = [payload].concat(Array.isArray(store.history) ? store.history : []).slice(0, 10)
  console.error('[wechat-chat-open]', payload)
  return payload
}

function waitNextFrame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()))
}

const WECHAT_APP_THEME_CONFIG_KEY = 'wechatAppThemeCss'
const WECHAT_APP_THEME_STYLE_ID = 'wechat-app-theme-style'
const WECHAT_APP_THEME_ROOTS = {
  messages: '.wechat-theme-messages',
  contacts: '.wechat-theme-contacts',
  discovery: '.wechat-theme-discovery',
  moments: '.wechat-theme-moments',
  me: '.wechat-theme-personal-profile'
}
const WECHAT_APP_THEME_CLASS_GROUPS = [
  {
    key: 'messages',
    label: 'Messages',
    root: WECHAT_APP_THEME_ROOTS.messages,
    items: [
      '.wechat-main', '.wechat-header', '.wechat-title-big', '.wechat-header-pill', '.wechat-pill-divider',
      '.btn-icon', '.wechat-search-bar', '.wechat-search-wrap', '.wechat-search-field', '.wechat-search-icon',
      '.wechat-search-input', '.wechat-search-cancel', '.wechat-search-results', '.wechat-search-section-title',
      '.wechat-search-item', '.wechat-search-item-avatar', '.wechat-search-item-info', '.wechat-search-item-name',
      '.wechat-search-item-msg', '.wechat-search-empty', '.wechat-content', '.chat-log-shell', '.chat-compose-card',
      '.chat-compose-input', '.chat-pinned-wrap', '.chat-group-tabs', '.chat-group-tab', '.chat-group-add',
      '.chat-list-wrap', '.chat-list-card', '.chat-empty-card', '.chat-swipe-item', '.chat-pin-action',
      '.chat-list-row', '.chat-avatar-wrap', '.chat-avatar', '.avatar-icon-placeholder', '.unread-badge',
      '.chat-row-info', '.chat-row-top', '.chat-row-name', '.chat-pin-mark', '.chat-row-time', '.chat-row-last',
      '.wechat-tabs', '.wechat-tab', '.wechat-tab-icon', '.list-loading', '.list-empty'
    ]
  },
  {
    key: 'contacts',
    label: 'Contacts',
    root: WECHAT_APP_THEME_ROOTS.contacts,
    items: [
      '.wechat-main', '.wechat-header', '.wechat-title-big', '.wechat-content', '.contacts-story-rail',
      '.contacts-story-item', '.contacts-story-avatar-shell', '.contacts-story-avatar', '.contacts-story-placeholder',
      '.contacts-story-add', '.contacts-story-name', '.contacts-search-wrap', '.contacts-search-field',
      '.contacts-search-icon', '.contacts-search-input', '.contacts-scan-btn', '.contacts-list', '.contact-add-card',
      '.contact-row', '.contact-add-row', '.contact-add-avatar', '.contact-info', '.contact-name', '.contact-nick',
      '.contacts-list-toolbar', '.contacts-total', '.contacts-sort-btn', '.contacts-empty-card', '.contacts-section',
      '.contacts-section-title', '.contacts-section-card', '.chat-avatar', '.wechat-tabs', '.wechat-tab',
      '.wechat-tab-icon', '.list-loading', '.list-empty'
    ]
  },
  {
    key: 'discovery',
    label: 'Discovery',
    root: WECHAT_APP_THEME_ROOTS.discovery,
    items: [
      '.wechat-main', '.wechat-header', '.wechat-title-big', '.wechat-content', '.discover-menu', '.discover-group',
      '.discover-row', '.discover-icon', '.discover-label', '.discover-arrow', '.wechat-tabs', '.wechat-tab',
      '.wechat-tab-icon'
    ]
  },
  {
    key: 'moments',
    label: 'Moments',
    root: WECHAT_APP_THEME_ROOTS.moments,
    items: [
      '.wechat-moments-page', '.wechat-contact-moments-page', '.moments-header', '.header-back', '.header-title',
      '.moments-nav-btn', '.moments-camera-icon', '.moments-ellipsis-icon', '.moments-scroll', '.moments-page',
      '.moments-hero', '.moments-cover', '.moments-profile', '.moments-profile-avatar', '.moments-profile-name',
      '.moments-profile-account', '.moments-profile-bio', '.moments-pinned', '.moments-pinned-item',
      '.moments-pinned-text', '.moments-ai-loading', '.moments-list', '.moment-card', '.moment-avatar',
      '.moment-body', '.moment-card-menu', '.moment-card-menu-danger', '.moment-name', '.moment-text', '.moment-imgs',
      '.moment-img-btn', '.moment-mentioned', '.moment-meta-row', '.moment-meta', '.moment-location-inline',
      '.moment-visibility-icon', '.moment-action-wrap', '.moment-more-btn', '.moment-action-menu',
      '.moment-action-divider', '.moment-social', '.moment-likes', '.moment-comments', '.moment-comment-row',
      '.moment-comment', '.moment-comment-reply-word', '.moment-comment-menu', '.list-loading', '.list-empty'
    ]
  },
  {
    key: 'me',
    label: 'Personal Profile',
    root: WECHAT_APP_THEME_ROOTS.me,
    items: [
      '.wechat-main', '.wechat-header', '.wechat-title-big', '.wechat-content', '.me-profile-page',
      '.contact-profile-scroll', '.me-hero', '.me-hero-top', '.me-avatar', '.me-info-stack', '.me-name',
      '.me-stats', '.me-stat', '.me-wechat-id', '.me-bio', '.me-actions', '.me-action-btn', '.me-action-primary',
      '.me-menu', '.contact-profile-menu', '.me-menu-row', '.contact-group-row', '.me-menu-icon', '.me-menu-label',
      '.me-menu-arrow', '.me-switch-row', '.is-danger-row', '.is-danger', '.wechat-tabs', '.wechat-tab',
      '.wechat-tab-icon', '.list-loading', '.list-empty'
    ]
  }
]
window.WANWAN_WECHAT_APP_THEME_CLASS_GROUPS = WECHAT_APP_THEME_CLASS_GROUPS

function clampWechatMemoryLimit(value) {
  const n = parseInt(value, 10)
  if (!Number.isFinite(n)) return WECHAT_MEMORY_DEFAULT
  return Math.min(WECHAT_MEMORY_MAX, Math.max(WECHAT_MEMORY_MIN, n))
}

function normalizeChatTimeSettings(value) {
  const mode = ['center', 'beside', 'inside'].includes(value?.mode) ? value.mode : CHAT_TIME_SETTINGS_DEFAULT.mode
  return {
    enabled: value?.enabled !== undefined ? !!value.enabled : CHAT_TIME_SETTINGS_DEFAULT.enabled,
    mode,
    awareness: !!value?.awareness
  }
}

const WECHAT_TIME_CONTEXT_GAP_MS = 20 * 60 * 1000
const WECHAT_WEEKDAY_LABELS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function getWechatDateTimeParts(timestamp, timeZone = '') {
  const date = new Date(Number(timestamp))
  if (!Number.isFinite(date.getTime())) return null
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }
  if (timeZone) options.timeZone = timeZone
  try {
    const parts = new Intl.DateTimeFormat('zh-CN', options).formatToParts(date)
    const values = {}
    parts.forEach(part => {
      if (part.type !== 'literal') values[part.type] = part.value
    })
    const rawWeekday = values.weekday || ''
    const weekday = /^星期/.test(rawWeekday)
      ? rawWeekday
      : (/^周[日一二三四五六]$/.test(rawWeekday) ? `星期${rawWeekday.slice(1)}` : WECHAT_WEEKDAY_LABELS[date.getDay()])
    return {
      year: values.year,
      month: values.month,
      day: values.day,
      weekday,
      hour: values.hour === '24' ? '00' : values.hour,
      minute: values.minute
    }
  } catch (_) {
    return {
      year: String(date.getFullYear()),
      month: String(date.getMonth() + 1).padStart(2, '0'),
      day: String(date.getDate()).padStart(2, '0'),
      weekday: WECHAT_WEEKDAY_LABELS[date.getDay()],
      hour: String(date.getHours()).padStart(2, '0'),
      minute: String(date.getMinutes()).padStart(2, '0')
    }
  }
}

function formatWechatFullDateTime(timestamp, timeZone = '') {
  const parts = getWechatDateTimeParts(timestamp, timeZone)
  if (!parts) return ''
  return `${parts.year}-${parts.month}-${parts.day} ${parts.weekday} ${parts.hour}:${parts.minute}`
}

function getWechatCalendarDateKey(timestamp, timeZone = '') {
  const parts = getWechatDateTimeParts(timestamp, timeZone)
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : ''
}

function getWechatTimeContextZones(tzConfig) {
  if (!tzConfig?.enabled || !tzConfig.charTimezone || !tzConfig.userTimezone) {
    return [{ key: 'local', timeZone: '', label: '' }]
  }
  return [
    {
      key: 'char',
      timeZone: tzConfig.charTimezone,
      label: `角色所在地（${tzConfig.charLocation || tzConfig.charTimezone}）`
    },
    {
      key: 'user',
      timeZone: tzConfig.userTimezone,
      label: `用户所在地（${tzConfig.userLocation || tzConfig.userTimezone}）`
    }
  ]
}

function buildWechatTimeContextText(timestamp, tzConfig) {
  const zones = getWechatTimeContextZones(tzConfig)
  if (zones.length === 1) return formatWechatFullDateTime(timestamp, zones[0].timeZone)
  return zones
    .map(zone => `${zone.label}${formatWechatFullDateTime(timestamp, zone.timeZone)}`)
    .join('；')
}

function getWechatTimeContextDateKey(timestamp, tzConfig) {
  return getWechatTimeContextZones(tzConfig)
    .map(zone => `${zone.key}:${getWechatCalendarDateKey(timestamp, zone.timeZone)}`)
    .join('|')
}

async function getChatTimeSettings(chatId) {
  const stored = await db.config.get(`chatTimeSettings_${chatId}`)
  return normalizeChatTimeSettings(stored?.value)
}

function normalizeDayTimeValue(value, fallback = '00:00') {
  const text = String(value || '').trim()
  return /^\d{2}:\d{2}$/.test(text) ? text : fallback
}

function normalizeChatActiveReplySettings(value) {
  const intervalMinutes = parseInt(value?.intervalMinutes, 10)
  return {
    enabled: !!value?.enabled,
    intervalMinutes: Number.isFinite(intervalMinutes) ? Math.max(1, intervalMinutes) : CHAT_ACTIVE_REPLY_DEFAULT.intervalMinutes,
    dndEnabled: value?.dndEnabled !== undefined ? !!value.dndEnabled : CHAT_ACTIVE_REPLY_DEFAULT.dndEnabled,
    dndStart: normalizeDayTimeValue(value?.dndStart, CHAT_ACTIVE_REPLY_DEFAULT.dndStart),
    dndEnd: normalizeDayTimeValue(value?.dndEnd, CHAT_ACTIVE_REPLY_DEFAULT.dndEnd)
  }
}

async function getChatActiveReplySettings(chatId) {
  const stored = await db.config.get(`chatActiveReply_${chatId}`)
  return normalizeChatActiveReplySettings(stored?.value)
}

async function setChatActiveReplyEnabled(chatId, enabled) {
  const cur = await getChatActiveReplySettings(chatId)
  await db.config.put({ key: `chatActiveReply_${chatId}`, value: { ...cur, enabled: !!enabled } })
}

function parseDayMinutes(value) {
  const normalized = normalizeDayTimeValue(value, '')
  if (!normalized) return null
  const [hourText, minuteText] = normalized.split(':')
  const hour = parseInt(hourText, 10)
  const minute = parseInt(minuteText, 10)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return hour * 60 + minute
}

function isNowInQuietHours(config, now = new Date()) {
  const cfg = normalizeChatActiveReplySettings(config)
  if (!cfg.dndEnabled) return false
  const start = parseDayMinutes(cfg.dndStart)
  const end = parseDayMinutes(cfg.dndEnd)
  if (start == null || end == null) return false
  if (start === end) return true
  const current = now.getHours() * 60 + now.getMinutes()
  if (start < end) return current >= start && current < end
  return current >= start || current < end
}

function getChatBilingualLangLabel(code) {
  return CHAT_BILINGUAL_LANGUAGES.find(lang => lang.code === code)?.label || '简体中文'
}

function getChatBilingualExample(sourceLang) {
  return CHAT_BILINGUAL_EXAMPLE_SRC[sourceLang] || `（此处为${getChatBilingualLangLabel(sourceLang)}原文）`
}

function normalizeChatBilingualSettings(value) {
  const sourceCodes = CHAT_BILINGUAL_LANGUAGES.map(lang => lang.code)
  const targetCodes = sourceCodes
  const sourceLang = sourceCodes.includes(value?.sourceLang) ? value.sourceLang : CHAT_BILINGUAL_DEFAULT.sourceLang
  const targetLang = targetCodes.includes(value?.targetLang) ? value.targetLang : CHAT_BILINGUAL_DEFAULT.targetLang
  return {
    enabled: !!value?.enabled,
    sourceLang,
    targetLang
  }
}

async function getChatBilingualSettings(chatId) {
  const stored = await db.config.get(`chatBilingual_${chatId}`)
  return normalizeChatBilingualSettings(stored?.value)
}

function normalizeChatImageGenSettings(value) {
  return {
    enabled: !!value?.enabled,
    charImagePrompt: String(value?.charImagePrompt || '').trim(),
    charReferenceImage: String(value?.charReferenceImage || '').trim()
  }
}

async function getChatImageGenSettings(chatId) {
  const stored = await db.config.get(`chatImageGen_${chatId}`)
  return normalizeChatImageGenSettings(stored?.value)
}

async function getChatStickerImageInputEnabled(chatId) {
  const stored = await db.config.get(`chatStickerImageInput_${chatId}`)
  return !!stored?.value
}

const MSG_NOTIFY_MODES = ['count', 'last', 'first', 'all']
function normalizeChatMsgNotifySettings(value) {
  return {
    enabled: value?.enabled !== false,                 // 默认 true
    mode: MSG_NOTIFY_MODES.includes(value?.mode) ? value.mode : 'count'
  }
}
async function getChatMsgNotifySettings(chatId) {
  const stored = await db.config.get(`chatMsgNotify_${chatId}`)
  return normalizeChatMsgNotifySettings(stored?.value)
}

function getWechatProfileKey(ownerUid, charId) {
  return `wechatProfile_${ownerUid}_${charId}`
}

function getWechatSelfProfileKey(uid = _wechatUid) {
  return `wechatSelfProfile_${uid}`
}

function getWechatContactsSortModeKey(uid = _wechatUid) {
  return `wechatContactsSortMode_${uid}`
}

function getWechatFavoritesKey(uid = _wechatUid) {
  return `wechatFavorites_${uid}`
}

function getWechatContactMomentsProfileKey(ownerUid, charId) {
  return `wechatContactMomentsProfile_${ownerUid}_${charId}`
}

async function getWechatContactMomentsProfileForOwner(ownerUid, charId) {
  if (!ownerUid || !charId) return { coverImage: '', bio: '' }
  const row = await db.config.get(getWechatContactMomentsProfileKey(ownerUid, charId))
  return {
    coverImage: '',
    bio: '',
    ...(row?.value || {})
  }
}

function normalizeWechatContactsSortMode(value) {
  return ['letter', 'group'].includes(value) ? value : 'letter'
}

async function getWechatContactsSortMode(uid = _wechatUid) {
  if (!uid) return 'letter'
  const row = await db.config.get(getWechatContactsSortModeKey(uid))
  return normalizeWechatContactsSortMode(row?.value)
}

async function saveWechatContactsSortMode(mode, uid = _wechatUid) {
  if (!uid) return
  await db.config.put({
    key: getWechatContactsSortModeKey(uid),
    value: normalizeWechatContactsSortMode(mode)
  })
}

async function getWechatFavorites(uid = _wechatUid) {
  if (!uid) return []
  const row = await db.config.get(getWechatFavoritesKey(uid))
  return Array.isArray(row?.value) ? row.value : []
}

async function saveWechatFavorites(items, uid = _wechatUid) {
  if (!uid) return
  await db.config.put({
    key: getWechatFavoritesKey(uid),
    value: Array.isArray(items) ? items : []
  })
}

async function getWechatContactMomentsProfile(charId) {
  return getWechatContactMomentsProfileForOwner(_wechatUid, charId)
}

async function saveWechatContactMomentsProfile(charId, value) {
  if (!_wechatUid || !charId) return
  const current = await getWechatContactMomentsProfile(charId)
  await db.config.put({
    key: getWechatContactMomentsProfileKey(_wechatUid, charId),
    value: { ...current, ...value }
  })
}

async function getWechatProfile(ownerUid, charId) {
  if (!ownerUid || !charId) return {}
  const row = await db.config.get(getWechatProfileKey(ownerUid, charId))
  return row?.value || {}
}
window.getWechatProfile = getWechatProfile

async function getWechatSelfProfile(uid = _wechatUid) {
  if (!uid) return { avatar: '', bio: '', followers: 520, following: 162 }
  const row = await db.config.get(getWechatSelfProfileKey(uid))
  return {
    avatar: '',
    bio: '',
    followers: 520,
    following: 162,
    ...(row?.value || {})
  }
}

async function saveWechatSelfProfile(value, uid = _wechatUid) {
  if (!uid) return
  const current = await getWechatSelfProfile(uid)
  await db.config.put({
    key: getWechatSelfProfileKey(uid),
    value: { ...current, ...value }
  })
}

async function getWechatSelfAvatar() {
  if (_wechatRolePhoneSession?.ownerUid && _wechatRolePhoneSession?.charId) {
    const roleProfile = await getWechatProfile(_wechatRolePhoneSession.ownerUid, _wechatRolePhoneSession.charId)
    if (roleProfile.avatar) return roleProfile.avatar
  }
  const profile = await getWechatSelfProfile()
  return profile.avatar || _wechatUser?.avatar || ''
}

function buildWechatSelfAvatarHTML(avatar, name) {
  return avatar
    ? `<img src="${avatar}" alt="${wcEscHtml(name || '我')}">`
    : `<span>${wcEscHtml(getCharacterInitial(name || '我'))}</span>`
}

async function getWechatDisplayCharacter(charId, ownerUid = _wechatUid) {
  const char = await window.getCharacter(charId)
  if (!char) return null
  const profile = await getWechatProfile(ownerUid, charId)
  const selfProfile = char.type === 'user' ? await getWechatSelfProfile(charId) : {}
  const baseName = char.nick || char.name || ''
  const wechatName = (profile.remark || '').trim() || baseName
  const wechatAvatar = profile.avatar || selfProfile.avatar || char.avatar || ''
  return {
    ...char,
    wechatProfile: profile,
    wechatAvatar,
    wechatName,
    wechatRemark: (profile.remark || '').trim()
  }
}
window.getWechatDisplayCharacter = getWechatDisplayCharacter

function getWechatDisplayName(c) {
  return c?.wechatName || c?.nick || c?.name || '未知'
}

function getWechatDisplayAvatar(c) {
  return c?.wechatAvatar || c?.avatar || ''
}

function getCurrentMomentsOwnerUid() {
  return _wechatRolePhoneSession?.ownerUid || _wechatUid || null
}

function momentBelongsToOwner(moment, ownerUid) {
  if (!moment || !ownerUid) return false
  if (moment.ownerUid !== undefined && moment.ownerUid !== null && moment.ownerUid !== '') {
    return String(moment.ownerUid) === String(ownerUid)
  }
  return String(moment.charId) === String(ownerUid)
}

function canAccessMomentInCurrentContext(moment) {
  return momentBelongsToOwner(moment, getCurrentMomentsOwnerUid())
}

async function getScopedMoments(options = {}) {
  const ownerUid = options.ownerUid || getCurrentMomentsOwnerUid()
  const charId = options.charId
  const limit = options.limit || 50
  if (!ownerUid) return []
  let query = db.moments
    .orderBy('createdAt')
    .reverse()
    .filter(m => momentBelongsToOwner(m, ownerUid))
  if (charId !== undefined && charId !== null && charId !== '') {
    query = query.filter(m => String(m.charId) === String(charId))
  }
  if (options.pinned) query = query.filter(m => !!m.pinned)
  return query.limit(limit).toArray()
}

async function countScopedMoments(charId, ownerUid = getCurrentMomentsOwnerUid()) {
  if (!ownerUid || !charId) return 0
  return db.moments
    .filter(m => momentBelongsToOwner(m, ownerUid) && String(m.charId) === String(charId))
    .count()
}
window.countScopedMoments = countScopedMoments

// ===== AI 生成状态追踪 =====
// scope: 'chat'(私聊) | 'group'(群聊)；id: chatId / groupId
const _pendingAIReplies = new Set()

function _aiKey(scope, id) { return `${scope}:${id}` }

function isAIReplyPending(scope, id) {
  return _pendingAIReplies.has(_aiKey(scope, id))
}

// 找到当前可见的聊天窗口（scope 为 'chat' 或 'group'）；id 不匹配返回 null
function _getVisibleChatWindow(scope, id) {
  const cw = document.getElementById('chat-window')
  if (!cw) return null
  if (scope === 'chat' && parseInt(cw.dataset.chatId) === id) return cw
  if (scope === 'group' && parseInt(cw.dataset.groupId) === id) return cw
  return null
}

// 顶栏「对方正在输入…」开关
function applyTypingUI(scope, id, isTyping) {
  const cw = _getVisibleChatWindow(scope, id)
  if (!cw) return
  const headerName = cw.querySelector('.chat-header-name')
  if (!headerName) return
  if (isTyping) {
    if (!headerName.dataset.origName) {
      headerName.dataset.origName = headerName.textContent
    }
    headerName.textContent = '对方正在输入…'
  } else if (headerName.dataset.origName) {
    headerName.textContent = headerName.dataset.origName
    delete headerName.dataset.origName
  }
}

// 检查session并返回是否已登录
async function checkWechatSession() {
  const stored = localStorage.getItem('wanwan_wechat_uid')
  if (!stored) return false
  try {
    const user = await db.characters.get(parseInt(stored))
    if (user && user.type === 'user') {
      _wechatUid  = user.id
      _wechatUser = user
      ensureWechatActiveReplyMonitorStarted()
      rememberWechatSwitchAccount(user)
      notifyWechatOnlineIdentityChanged()
      return true
    }
  } catch {}
  localStorage.removeItem('wanwan_wechat_uid')
  return false
}

// 登录成功后写入session
function setWechatSession(user) {
  _wechatUid  = user.id
  _wechatUser = user
  ensureWechatActiveReplyMonitorStarted()
  localStorage.setItem('wanwan_wechat_uid', user.id)
  rememberWechatSwitchAccount(user)
  notifyWechatOnlineIdentityChanged()
}

function setWechatRuntimeSession(user) {
  _wechatUid = user?.id || null
  _wechatUser = user || null
  ensureWechatActiveReplyMonitorStarted()
  notifyWechatOnlineIdentityChanged()
}

function notifyWechatOnlineIdentityChanged() {
  document.dispatchEvent(new CustomEvent('wanwan-wechat-identity-changed', {
    detail: { uid: _wechatUid || null }
  }))
}

function isWechatRolePhoneMode(page = document.getElementById('wechat-page')) {
  return !!_wechatRolePhoneSession || page?.dataset?.wechatRolePhone === '1'
}

function getWechatSwitchUidList() {
  const raw = localStorage.getItem(WECHAT_SWITCH_UIDS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return [...new Set(parsed.map(id => parseInt(id)).filter(Number.isFinite))]
    }
  } catch {}
  return raw.split(',')
    .map(id => parseInt(id))
    .filter(Number.isFinite)
}

function saveWechatSwitchUidList(ids) {
  const clean = [...new Set((ids || []).map(id => parseInt(id)).filter(Number.isFinite))]
  localStorage.setItem(WECHAT_SWITCH_UIDS_KEY, JSON.stringify(clean))
  return clean
}

function removeWechatSwitchAccount(uid) {
  const target = parseInt(uid)
  if (!Number.isFinite(target)) return
  saveWechatSwitchUidList(getWechatSwitchUidList().filter(id => id !== target))
}

function rememberWechatSwitchAccount(user) {
  if (!user || user.type !== 'user' || !Number.isFinite(parseInt(user.id))) return
  const ids = getWechatSwitchUidList()
  saveWechatSwitchUidList([user.id, ...ids])
}

async function getWechatUserAccounts() {
  return db.characters.where('type').equals('user').toArray()
}

async function getWechatSwitchAccounts() {
  const users = await getWechatUserAccounts()
  const userById = new Map(users.map(user => [parseInt(user.id), user]))
  const ids = getWechatSwitchUidList().filter(id => {
    const user = userById.get(id)
    return user && user.type === 'user'
  })
  saveWechatSwitchUidList(ids)
  return ids.map(id => userById.get(id)).filter(Boolean)
}

// 退出登录
function clearWechatSession() {
  _wechatUid  = null
  _wechatUser = null
  clearWechatBlobUrlCache()
  clearWechatAvatarBlobCache()
  localStorage.removeItem('wanwan_wechat_uid')
  notifyWechatOnlineIdentityChanged()
}
window.clearWechatSession = clearWechatSession


// ===== 页面入口 =====
window.showWechatPage = async function() {
  const loggedIn = await checkWechatSession()
  if (loggedIn) {
    const page = buildWechatMainPage()
    window.openPage(page)
    enterWechatMainPage(page)
  } else {
    const loginPage = buildWechatLoginPage()
    window.openPage(loginPage)
  }
}

window.showWechatRolePhonePage = async function(context = {}) {
  const ownerUid = parseInt(context.ownerUid, 10)
  const charId = parseInt(context.charId, 10)
  if (!ownerUid || !charId) {
    window.toast && window.toast('角色手机不存在')
    return
  }
  const sourceChat = await db.chats
    .where('[ownerUid+charId]').equals([ownerUid, charId])
    .first()
  if (!sourceChat) {
    window.toast && window.toast('需要先有该角色和当前微信号的聊天框')
    return
  }
  const char = await db.characters.get(charId)
  if (!char) {
    window.toast && window.toast('角色不存在')
    return
  }
  if (!char.identity?.account || !char.identity?.password) {
    window.toast && window.toast('当前角色未设置微信号或微信密码')
  }
  removeWechatPageNow('wechat-login-page')
  const loginPage = buildWechatLoginPage({
    rolePhone: true,
    includeRecover: false,
    ownerUid,
    charId
  })
  window.openPage(loginPage)
}

async function enterWechatRolePhone(char, context) {
  const ownerUid = parseInt(context.ownerUid, 10)
  const charId = parseInt(context.charId, 10)
  const previous = {
    uid: _wechatUid,
    user: _wechatUser
  }
  await syncRolePhoneWechatData(ownerUid, charId)
  _wechatRolePhoneSession = { ownerUid, charId, previous }
  setWechatRuntimeSession(char)
}

function closeWechatRolePhonePages() {
  const hasRolePhonePage = !!document.querySelector('[data-wechat-role-phone="1"], .wechat-role-phone-page')
  if (!_wechatRolePhoneSession && !hasRolePhonePage) return
  ;[
    'wechat-account-switch-page',
    'wechat-login-page',
    'wechat-page',
    'chat-window',
    'phone-snapshot-chat-window',
    'phone-snapshot-wallet-page',
    'phone-snapshot-bank-detail-page',
    'wechat-moments-page',
    'wechat-contact-profile-page'
  ].forEach(removeWechatPageNow)
  document.querySelectorAll('[id^="wechat-contact-moments-page-"]').forEach(page => page.remove())
  endWechatRolePhoneSession()
}

window.closeWechatRolePhonePages = closeWechatRolePhonePages

function endWechatRolePhoneSession() {
  if (!_wechatRolePhoneSession) return
  const previous = _wechatRolePhoneSession.previous || {}
  _wechatRolePhoneSession = null
  _wechatUid = previous.uid || null
  _wechatUser = previous.user || null
  notifyWechatOnlineIdentityChanged()
}

window.endWechatRolePhoneSession = endWechatRolePhoneSession

async function syncRolePhoneWechatData(ownerUid, charId) {
  const sourceChat = await db.chats
    .where('[ownerUid+charId]').equals([ownerUid, charId])
    .first()
  if (!sourceChat) throw new Error('需要先有该角色和当前微信号的聊天框')
  let targetChat = await db.chats
    .where('[ownerUid+charId]').equals([charId, ownerUid])
    .first()
  if (!targetChat) {
    const createdAt = sourceChat.createdAt || Date.now()
    const id = await db.chats.add({
      charId: ownerUid,
      ownerUid: charId,
      createdAt,
      unread: 0
    })
    targetChat = { id, charId: ownerUid, ownerUid: charId, createdAt, unread: 0 }
  } else {
    await db.chats.update(targetChat.id, {
      createdAt: sourceChat.createdAt || targetChat.createdAt || Date.now(),
      unread: 0
    })
  }

  await syncRolePhoneFriendIds(ownerUid, charId)
  await syncRolePhoneMessages(sourceChat.id, targetChat.id, ownerUid)
}

async function syncRolePhoneFriendIds(ownerUid, charId) {
  const ids = await getFriendIds(charId)
  const clean = [...new Set(ids.concat(ownerUid).map(id => parseInt(id, 10)).filter(Number.isFinite))]
  await saveFriendIds(charId, clean)
}

async function syncRolePhoneMessages(sourceChatId, targetChatId, targetCharId) {
  const sourceMessages = await db.messages.where('chatId').equals(sourceChatId).sortBy('createdAt')
  await db.messages.where('chatId').equals(targetChatId).delete()
  if (!sourceMessages.length) return
  const mirrored = sourceMessages.map(message => {
    const copy = { ...message }
    delete copy.id
    copy.chatId = targetChatId
    copy.charId = targetCharId
    if (copy.role === 'user') copy.role = 'assistant'
    else if (copy.role === 'assistant') copy.role = 'user'
    return copy
  })
  await db.messages.bulkAdd(mirrored)
}

// ===== 微信登录页DOM =====
function buildWechatLoginPage(options = {}) {
  const page = document.createElement('div')
  page.id = 'wechat-login-page'
  page.className = 'full-page wechat-login-page'
  if (options.rolePhone) {
    page.classList.add('wechat-role-phone-page')
    page.dataset.wechatRolePhone = '1'
    page.dataset.roleCharId = String(options.charId || '')
    page.dataset.boundOwnerUid = String(options.ownerUid || '')
  }
  page.innerHTML = buildLoginHTML({ includeRecover: options.includeRecover !== false })
  bindLoginPageEvents(page)
  return page
}

// 登录页HTML模板
function buildLoginHTML(options = {}) {
  const includeRecover = options.includeRecover !== false
  return `
    <div class="wl-bg"></div>
    <div class="wl-card">
      <div class="wl-logo-wrap">
        <div class="wl-logo-icon">
          <i class="fa-brands fa-weixin"></i>
        </div>
        <div class="wl-title">登录微信</div>
        <div class="wl-subtitle">弯弯</div>
      </div>
      ${buildLoginFormHTML({ includeRecover })}
    </div>
    ${includeRecover ? buildRecoverModalHTML() : ''}
  `
}


// 登录表单HTML
function buildLoginFormHTML(options = {}) {
  const includeRecover = options.includeRecover !== false
  const bottomLinks = includeRecover
    ? `
      <div class="wl-bottom-links">
        <span class="wl-link" id="wl-recover-link">找回密码</span>
        <span class="wl-link-sep">|</span>
        <span class="wl-link wl-link-dim">更多设置</span>
      </div>`
    : `
      <div class="wl-bottom-links">
        <span class="wl-link wl-link-dim">找回密码</span>
        <span class="wl-link-sep">|</span>
        <span class="wl-link wl-link-dim">更多设置</span>
      </div>`
  return `
    <div class="wl-form-card">
      <div class="wl-field">
        <span class="wl-label">微信号</span>
        <input type="text" id="wl-account" class="wl-input"
               placeholder="请输入微信号"
               autocomplete="off" autocorrect="off" autocapitalize="off">
      </div>
      <div class="wl-divider"></div>
      <div class="wl-field">
        <span class="wl-label">密码</span>
        <input type="password" id="wl-password" class="wl-input"
               placeholder="请输入密码" autocomplete="off"
               onkeydown="if(event.key==='Enter') submitWechatLogin()">
        <button type="button" class="wl-eye-btn" id="wl-eye-btn">
          <i class="fi fi-rr-link" id="wl-eye-icon"></i>
        </button>
      </div>
    </div>
    <div id="wl-error" class="wl-error" style="display:none"></div>
    <div class="wl-agree">我已阅读并同意<span class="wl-agree-link">《弯弯服务协议》</span></div>
    <button class="wl-submit-btn" id="wl-submit-btn" onclick="submitWechatLogin()">登录</button>
    <button class="wl-back-btn" onclick="window.closePage('wechat-login-page')">返回</button>
    ${bottomLinks}
  `
}


// 找回密码弹窗HTML
function buildRecoverModalHTML() {
  return `
    <div id="wl-recover-modal" class="wl-modal-overlay" style="display:none">
      <div class="wl-modal-box">
        <div class="wl-modal-title">找回密码</div>
        <div class="wl-modal-sub">输入微信号查看对应密码</div>
        <input type="text" id="wl-recover-input" class="wl-modal-input" placeholder="请输入微信号">
        <div id="wl-recover-result" class="wl-recover-result" style="display:none"></div>
        <div id="wl-recover-error" class="wl-recover-error" style="display:none"></div>
        <div class="wl-modal-btns">
          <button class="wl-modal-btn-cancel" id="wl-recover-cancel">取消</button>
          <button class="wl-modal-btn-ok" id="wl-recover-ok">查询</button>
        </div>
      </div>
    </div>
  `
}

// ===== 登录页事件绑定 =====
function bindLoginPageEvents(page) {
  // 密码显隐
  page.querySelector('#wl-eye-btn').addEventListener('click', () => {
    const input = page.querySelector('#wl-password')
    const icon  = page.querySelector('#wl-eye-icon')
    const show  = input.type === 'password'
    input.type  = show ? 'text' : 'password'
    icon.className = show ? 'fi fi-rr-broken-chain-link-wrong' : 'fi fi-rr-link'
  })
  if (page.querySelector('#wl-recover-link')) bindRecoverEvents(page)
}


// 找回密码弹窗事件
function bindRecoverEvents(page) {
  page.querySelector('#wl-recover-link').addEventListener('click', () => {
    page.querySelector('#wl-recover-modal').style.display = 'flex'
    page.querySelector('#wl-recover-input').value = ''
    page.querySelector('#wl-recover-result').style.display = 'none'
    page.querySelector('#wl-recover-error').style.display = 'none'
  })
  page.querySelector('#wl-recover-cancel').addEventListener('click', () => {
    page.querySelector('#wl-recover-modal').style.display = 'none'
  })
  page.querySelector('#wl-recover-ok').addEventListener('click', () => doWlRecover(page))
}

// 提交登录
window.submitWechatLogin = async function() {
  const loginPage = document.getElementById('wechat-login-page')
  if (!loginPage) return
  const account  = (loginPage.querySelector('#wl-account')?.value || '').trim()
  const password = (loginPage.querySelector('#wl-password')?.value || '').trim()
  const errorEl  = loginPage.querySelector('#wl-error')
  const submitBtn = loginPage.querySelector('#wl-submit-btn')
  errorEl.style.display = 'none'
  if (!account || !password) {
    errorEl.textContent = '请输入微信号和密码'
    errorEl.style.display = 'block'
    return
  }
  submitBtn.textContent = '登录中...'
  submitBtn.disabled = true
  if (loginPage.dataset.wechatRolePhone === '1') {
    await doRolePhoneLogin(loginPage, account, password, errorEl, submitBtn)
    return
  }
  await doLogin(loginPage, account, password, errorEl, submitBtn)
}

async function doRolePhoneLogin(loginPage, account, password, errorEl, submitBtn) {
  try {
    const charId = parseInt(loginPage.dataset.roleCharId, 10)
    const ownerUid = parseInt(loginPage.dataset.boundOwnerUid, 10)
    const char = await db.characters.get(charId)
    if (!char || !ownerUid) {
      errorEl.textContent = '角色手机不存在'
      errorEl.style.display = 'block'
      submitBtn.textContent = '登录'
      submitBtn.disabled = false
      return
    }
    if (char.identity?.account !== account || char.identity?.password !== password) {
      errorEl.textContent = '微信号或密码错误'
      errorEl.style.display = 'block'
      submitBtn.textContent = '登录'
      submitBtn.disabled = false
      return
    }
    await enterWechatRolePhone(char, { ownerUid, charId })
    loginPage.style.transition = 'opacity 0.2s'
    loginPage.style.opacity = '0'
    setTimeout(() => {
      loginPage.remove()
      const mainPage = buildWechatMainPage({ rolePhone: true })
      window.openPage(mainPage)
      enterWechatMainPage(mainPage)
    }, 200)
  } catch (e) {
    errorEl.textContent = '登录失败，请重试'
    errorEl.style.display = 'block'
    submitBtn.textContent = '登录'
    submitBtn.disabled = false
  }
}


// 执行登录逻辑
async function doLogin(loginPage, account, password, errorEl, submitBtn) {
  try {
    const users = await getWechatUserAccounts()
    const matched = users.find(u =>
      u.identity?.account === account && u.identity?.password === password
    )
    if (!matched) {
      errorEl.textContent = '微信号或密码错误'
      errorEl.style.display = 'block'
      submitBtn.textContent = '登录'
      submitBtn.disabled = false
      return
    }
    setWechatSession(matched)
    loginPage.style.transition = 'opacity 0.2s'
    loginPage.style.opacity = '0'
    setTimeout(() => {
      loginPage.remove()
      const mainPage = buildWechatMainPage()
      window.openPage(mainPage)
      enterWechatMainPage(mainPage)
    }, 200)
  } catch (e) {
    errorEl.textContent = '登录失败，请重试'
    errorEl.style.display = 'block'
    submitBtn.textContent = '登录'
    submitBtn.disabled = false
  }
}

function enterWechatMainPage(page) {
  loadWechatTab(page, 'chats')
  preloadWechatSecondaryTabs(page)
}

function preloadWechatSecondaryTabs(page) {
  if (!page) return
  scheduleWechatPreload(page, 300, preloadWechatContacts)
  scheduleWechatPreload(page, 600, preloadWechatMe)
  scheduleWechatPreload(page, 900, preloadWechatMoments)
}

function scheduleWechatPreload(page, delay, loader) {
  setTimeout(() => {
    if (!page || !document.body.contains(page)) return
    loader(page).catch(() => {})
  }, delay)
}

// 找回密码查询
async function doWlRecover(page) {
  const input    = page.querySelector('#wl-recover-input')
  const resultEl = page.querySelector('#wl-recover-result')
  const errorEl  = page.querySelector('#wl-recover-error')
  const account  = (input?.value || '').trim()
  resultEl.style.display = 'none'
  errorEl.style.display  = 'none'
  if (!account) {
    errorEl.textContent = '请输入微信号'
    errorEl.style.display = 'block'
    return
  }
  const users = await db.characters.where('type').equals('user').toArray()
  const matched = users.find(u => u.identity?.account === account)
  if (!matched) {
    errorEl.textContent = '未找到该微信号'
    errorEl.style.display = 'block'
  } else {
    resultEl.innerHTML = `
      <div class="wl-recover-name">${matched.nick || matched.name}</div>
      <div class="wl-recover-pwd">${matched.identity?.password || '（未设置密码）'}</div>
    `
    resultEl.style.display = 'block'
  }
}


// ===== 微信主页DOM =====
function buildWechatMainPage(options = {}) {
  const page = document.createElement('div')
  page.id = 'wechat-page'
  page.className = 'full-page wechat-main'
  if (options.rolePhone || _wechatRolePhoneSession) {
    page.classList.add('wechat-role-phone-page')
    page.dataset.wechatRolePhone = '1'
  }
  page.innerHTML = buildMainPageHTML()
  setWechatAppThemePageScope(page, 'chats')
  loadWechatAppTheme().catch(err => console.warn('加载微信 APP Theme 失败', err))
  bindMainPageEvents(page)
  return page
}

// 主页HTML模板
function buildMainPageHTML() {
  return `
    <div class="wechat-header" id="wechat-header">
      <span class="wechat-title-big" onclick="window.closePage('wechat-page')">Messages</span>
      <div class="wechat-header-pill">
        <button class="btn-icon" id="btn-wechat-search"><i class="fi fi-rr-search"></i></button>
        <span class="wechat-pill-divider"></span>
        <button class="btn-icon" id="btn-wechat-add"><i class="fi fi-rr-layer-plus"></i></button>
      </div>
    </div>
    <div class="wechat-search-bar" id="wechat-search-bar">
      <div class="wechat-search-wrap">
        <div class="wechat-search-field">
          <i class="fi fi-rr-search wechat-search-icon"></i>
          <input class="wechat-search-input" id="wechat-search-input" placeholder="搜索聊天和聊天记录..." />
        </div>
        <button class="wechat-search-cancel" id="wechat-search-cancel">取消</button>
      </div>
    </div>
    <div class="wechat-search-results" id="wechat-search-results" style="display:none"></div>
    <div class="wechat-content" id="wechat-content"></div>
    <div class="wechat-tabs">
      <button class="wechat-tab active" data-tab="chats">
        <svg class="wechat-tab-icon" viewBox="0 0 1024 1024" aria-hidden="true">
          <path d="M435.2 932.266667l-64-85.333334a16.085333 16.085333 0 0 0-8.96-4.266666H341.333333c-177.92 0-288-48.213333-288-288V341.333333c0-188.586667 99.413333-288 288-288h256a32.213333 32.213333 0 0 1 32 32 32.213333 32.213333 0 0 1-32 32H341.333333C188.586667 117.333333 117.333333 188.586667 117.333333 341.333333v213.333334c0 192.853333 66.133333 224 224 224h21.333334a80.042667 80.042667 0 0 1 59.733333 29.866666l64 85.333334a29.610667 29.610667 0 0 0 51.2 0l64-85.333334a74.752 74.752 0 0 1 59.733333-29.866666h21.333334c152.746667 0 224-71.253333 224-224v-128a32 32 0 0 1 64 0v128c0 188.586667-99.413333 288-288 288h-21.333334a11.136 11.136 0 0 0-8.533333 4.266666l-64 85.333334a92.501333 92.501333 0 0 1-153.6 0z" fill="currentColor"></path>
          <path d="M469.333333 469.333333a42.666667 42.666667 0 1 1 42.666667 42.666667 42.666667 42.666667 0 0 1-42.666667-42.666667zM640 469.333333a42.666667 42.666667 0 1 1 42.666667 42.666667 42.666667 42.666667 0 0 1-42.666667-42.666667zM298.666667 469.333333a42.666667 42.666667 0 1 1 42.666666 42.666667 42.666667 42.666667 0 0 1-42.666666-42.666667zM832 330.666667a138.666667 138.666667 0 1 1 138.666667-138.666667 138.837333 138.837333 0 0 1-138.666667 138.666667z m0-213.333334a74.666667 74.666667 0 1 0 74.666667 74.666667 74.752 74.752 0 0 0-74.666667-74.666667z" fill="currentColor"></path>
        </svg>
        <span>信息</span>
      </button>
      <button class="wechat-tab" data-tab="contacts">
        <svg class="wechat-tab-icon" viewBox="0 0 1024 1024" aria-hidden="true">
          <path d="M512 544A245.333333 245.333333 0 1 1 757.333333 298.666667 245.632 245.632 0 0 1 512 544z m0-426.666667A181.333333 181.333333 0 1 0 693.333333 298.666667 181.546667 181.546667 0 0 0 512 117.333333z" fill="currentColor"></path>
          <path d="M113.493333 938.666667c0-182.186667 178.773333-330.666667 398.506667-330.666667a32.213333 32.213333 0 0 1 32 32 32.213333 32.213333 0 0 1-32 32c-184.32 0-334.506667 119.466667-334.506667 266.666667a32.213333 32.213333 0 0 1-32 32 32.213333 32.213333 0 0 1-32-32zM776.533333 945.066667a168.533333 168.533333 0 1 1 168.533334-168.533334 168.746667 168.746667 0 0 1-168.533334 168.533334z m0-273.066667a104.533333 104.533333 0 1 0 104.533334 104.533333 104.661333 104.661333 0 0 0-104.533334-104.533333z" fill="currentColor"></path>
          <path d="M916.010667 961.28l-42.666667-42.666667a32 32 0 0 1 45.269333-45.226666l42.666667 42.666666a32.213333 32.213333 0 0 1 0 45.226667 31.957333 31.957333 0 0 1-45.226667 0z" fill="currentColor"></path>
        </svg>
        <span>通讯录</span>
      </button>
      <button class="wechat-tab" data-tab="discover">
        <svg class="wechat-tab-icon" viewBox="0 0 1024 1024" aria-hidden="true">
          <path d="M698.410667 971.434667h-0.981334a95.530667 95.530667 0 0 1-91.733333-68.266667l-78.933333-253.781333a96.085333 96.085333 0 0 1 24.448-97.749334 97.237333 97.237333 0 0 1 68.437333-28.202666 95.104 95.104 0 0 1 28.416 4.266666l254.165333 79.018667a96.725333 96.725333 0 0 1 1.706667 184.32l-69.546667 23.466667a31.701333 31.701333 0 0 0-20.522666 20.48l-23.893334 69.973333a95.061333 95.061333 0 0 1-91.562666 66.474667z m-79.317334-384a33.664 33.664 0 0 0-22.613333 9.386666 32.554667 32.554667 0 0 0-8.106667 33.706667l78.890667 253.866667a32 32 0 0 0 31.189333 23.04h0.384a31.786667 31.786667 0 0 0 31.146667-22.613334l23.936-69.973333a97.237333 97.237333 0 0 1 61.013333-61.013333l69.546667-23.466667a31.232 31.232 0 0 0 22.613333-31.146667 31.786667 31.786667 0 0 0-23.04-31.146666l-254.336-78.848a37.077333 37.077333 0 0 0-10.624-1.792z" fill="currentColor"></path>
          <path d="M53.333333 512a458.666667 458.666667 0 0 1 917.333334 0 32 32 0 0 1-64 0A394.666667 394.666667 0 1 0 512 906.666667a32 32 0 0 1 0 64A459.050667 459.050667 0 0 1 53.333333 512z" fill="currentColor"></path>
        </svg>
        <span>发现</span>
      </button>
      <button class="wechat-tab" data-tab="me">
        <svg class="wechat-tab-icon" viewBox="0 0 1024 1024" aria-hidden="true">
          <path d="M480 768v-128a32.213333 32.213333 0 0 1 32-32 32.213333 32.213333 0 0 1 32 32v128a32.213333 32.213333 0 0 1-32 32 32.213333 32.213333 0 0 1-32-32z" fill="currentColor"></path>
          <path d="M750.976 962.56h-477.866667a166.954667 166.954667 0 0 1-161.28-136.106667l-56.746666-340.053333a175.530667 175.530667 0 0 1 58.88-154.453333l295.68-237.013334a162.133333 162.133333 0 0 1 101.674666-34.133333 165.12 165.12 0 0 1 103.125334 34.773333l295.68 236.330667a179.2 179.2 0 0 1 58.922666 154.453333l-56.746666 339.626667a169.642667 169.642667 0 0 1-161.322667 136.576z m-239.36-837.76a100.778667 100.778667 0 0 0-61.866667 20.053333l-295.68 237.226667a114.858667 114.858667 0 0 0-35.882666 93.866667l56.746666 339.626666a104.661333 104.661333 0 0 0 98.133334 82.773334h477.866666a104.746667 104.746667 0 0 0 98.133334-83.2l56.704-339.626667a115.882667 115.882667 0 0 0-35.84-93.866667l-295.68-236.373333a101.546667 101.546667 0 0 0-62.634667-20.48z" fill="currentColor"></path>
        </svg>
        <span>我</span>
      </button>
    </div>
  `
}


// 主页事件绑定
function bindMainPageEvents(page) {
  const titleEl = page.querySelector('.wechat-title-big')
  if (isWechatRolePhoneMode(page) && titleEl) {
    titleEl.onclick = () => closeWechatRolePhonePages()
  }
  page.querySelectorAll('.wechat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      page.querySelectorAll('.wechat-tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      loadWechatTab(page, tab.dataset.tab)
    })
  })
  page.querySelector('#btn-wechat-add').addEventListener('click', () => {
    if (isWechatRolePhoneMode(page)) return
    showWechatAddMenu(page)
  })
  page.querySelector('#btn-wechat-search').addEventListener('click', () => toggleWechatSearch(page, true))
  page.querySelector('#wechat-search-cancel').addEventListener('click', () => toggleWechatSearch(page, false))
  let _searchTimer = null
  page.querySelector('#wechat-search-input').addEventListener('input', e => {
    clearTimeout(_searchTimer)
    const kw = e.target.value.trim()
    _searchTimer = setTimeout(() => doWechatSearch(page, kw), 250)
  })
}

function updateWechatHeaderActions(page, tab) {
  const pill = page.querySelector('.wechat-header-pill')
  if (!pill) return
  pill.style.display = tab === 'chats' ? 'flex' : 'none'
  const addBtn = page.querySelector('#btn-wechat-add')
  const divider = page.querySelector('.wechat-pill-divider')
  if (addBtn) addBtn.style.display = isWechatRolePhoneMode(page) ? 'none' : ''
  if (divider) divider.style.display = isWechatRolePhoneMode(page) ? 'none' : ''
  if (tab !== 'chats') toggleWechatSearch(page, false)
}

// 搜索框展开/收起
function toggleWechatSearch(page, open) {
  const bar = page.querySelector('#wechat-search-bar')
  const results = page.querySelector('#wechat-search-results')
  const content = page.querySelector('#wechat-content')
  const tabs = page.querySelector('.wechat-tabs')
  const input = page.querySelector('#wechat-search-input')
  if (open) {
    bar.classList.add('open')
    results.style.display = 'block'
    content.style.display = 'none'
    tabs.style.display = 'none'
    input.focus()
  } else {
    bar.classList.remove('open')
    results.style.display = 'none'
    results.innerHTML = ''
    content.style.display = ''
    tabs.style.display = ''
    input.value = ''
  }
}

// 搜索聊天和聊天记录
async function doWechatSearch(page, keyword) {
  const results = page.querySelector('#wechat-search-results')
  if (!keyword) { results.innerHTML = ''; return }
  const kw = keyword.toLowerCase()

  // 搜索聊天列表（按名称匹配）
  const allChats = await db.chats.toArray()
  const chats = allChats.filter(c => c.ownerUid === _wechatUid)
  const chatMatches = []
  for (const chat of chats) {
    const char = await getWechatDisplayCharacter(chat.charId)
    if (!char) continue
    const name = getWechatDisplayName(char)
    if (name.toLowerCase().includes(kw)) {
      chatMatches.push({ type: 'private', id: chat.id, charId: chat.charId, name, avatar: getWechatDisplayAvatar(char) })
    }
  }
  const groupChats = await db.groupChats.toArray()
  for (const g of groupChats) {
    if (!isWechatGroupAccessible(g)) continue
    if ((g.name || '群聊').toLowerCase().includes(kw)) {
      chatMatches.push({ type: 'group', id: g.id, name: g.name || '群聊', avatar: g.avatar || '' })
    }
  }

  // 搜索聊天记录（按消息内容匹配）
  const allMsgs = await db.messages.toArray()
  const msgMatches = []
  const seen = new Set()
  for (const msg of allMsgs) {
    if (!msg.content || !msg.content.toLowerCase().includes(kw)) continue
    const chatKey = `private-${msg.chatId}`
    if (seen.has(chatKey)) continue
    seen.add(chatKey)
    const chat = await db.chats.get(msg.chatId)
    if (!chat || chat.ownerUid !== _wechatUid) continue
    const char = await getWechatDisplayCharacter(chat.charId)
    msgMatches.push({
      type: 'private', chatId: msg.chatId, charId: chat.charId,
      name: getWechatDisplayName(char), avatar: getWechatDisplayAvatar(char),
      content: msg.content.slice(0, 50)
    })
  }
  const allGroupMsgs = await db.groupMessages.toArray()
  for (const msg of allGroupMsgs) {
    if (!msg.content || !msg.content.toLowerCase().includes(kw)) continue
    const chatKey = `group-${msg.groupId}`
    if (seen.has(chatKey)) continue
    seen.add(chatKey)
    const g = await db.groupChats.get(msg.groupId)
    if (!g || !isWechatGroupAccessible(g)) continue
    msgMatches.push({
      type: 'group', groupId: msg.groupId,
      name: g?.name || '群聊', avatar: g?.avatar || '',
      content: msg.content.slice(0, 50)
    })
  }

  // 渲染结果
  let html = ''
  if (!chatMatches.length && !msgMatches.length) {
    html = `<div class="wechat-search-empty">没有找到相关结果</div>`
  }
  if (chatMatches.length) {
    html += `<div class="wechat-search-section-title">联系人</div>`
    html += chatMatches.map(m => {
      const av = m.avatar
        ? `<img src="${m.avatar}" alt="${wcEscHtml(m.name)}">`
        : (m.type === 'group' ? `<div class="avatar-icon-placeholder"><i class="fa fa-users"></i></div>` : buildWechatInitialAvatarHTML(m.name))
      return `<div class="wechat-search-item" data-action="open-chat" data-type="${m.type}" data-id="${m.id}" data-char-id="${m.charId || ''}">
        <div class="wechat-search-item-avatar">${av}</div>
        <div class="wechat-search-item-info"><div class="wechat-search-item-name">${wcEscHtml(m.name)}</div></div>
      </div>`
    }).join('')
  }
  if (msgMatches.length) {
    html += `<div class="wechat-search-section-title">聊天记录</div>`
    html += msgMatches.map(m => {
      const av = m.avatar
        ? `<img src="${m.avatar}" alt="${wcEscHtml(m.name)}">`
        : (m.type === 'group' ? `<div class="avatar-icon-placeholder"><i class="fa fa-users"></i></div>` : buildWechatInitialAvatarHTML(m.name))
      return `<div class="wechat-search-item" data-action="open-chat" data-type="${m.type}" data-id="${m.chatId || m.groupId}" data-char-id="${m.charId || ''}">
        <div class="wechat-search-item-avatar">${av}</div>
        <div class="wechat-search-item-info">
          <div class="wechat-search-item-name">${wcEscHtml(m.name)}</div>
          <div class="wechat-search-item-msg">${m.content}</div>
        </div>
      </div>`
    }).join('')
  }
  results.innerHTML = html

  results.querySelectorAll('.wechat-search-item').forEach(item => {
    item.addEventListener('click', () => {
      toggleWechatSearch(page, false)
      if (item.dataset.type === 'private') openPrivateChat(page, parseInt(item.dataset.charId), parseInt(item.dataset.id))
      else openGroupChat(page, parseInt(item.dataset.id))
    })
  })
}

// 根据tab加载对应内容
function loadWechatTab(page, tab) {
  const content = page.querySelector('#wechat-content')
  setWechatAppThemePageScope(page, tab)
  if (tab !== 'chats' && page._flushWechatChatComposeText) {
    page._flushWechatChatComposeText().catch(err => console.warn('保存微信顶部文字失败', err))
  }
  const titleEl = page.querySelector('.wechat-title-big')
  const tabTitles = { chats: 'Messages', contacts: 'Contacts', discover: 'Discovery', me: 'Personal Profile' }
  if (titleEl) titleEl.textContent = tabTitles[tab] || 'Messages'
  updateWechatHeaderActions(page, tab)
  if (tab === 'chats') {
    const hasCachedList = renderCachedWechatChatList(page, content)
    loadChatList(page, content, { showLoading: !hasCachedList })
    return
  }
  if (tab === 'contacts') {
    const hasCachedContacts = renderCachedWechatContacts(page, content)
    if (!hasCachedContacts) {
      content.innerHTML = '<div class="list-loading"><i class="fa fa-spinner fa-spin"></i></div>'
    }
    loadContacts(page, content, { renderCache: false })
    return
  }
  if (tab === 'me') {
    const hasCachedMe = renderCachedWechatMe(page, content)
    if (!hasCachedMe) {
      content.innerHTML = '<div class="list-loading"><i class="fa fa-spinner fa-spin"></i></div>'
    }
    loadMeTab(page, content, { renderCache: false })
    return
  }
  const loaders = { chats: loadChatList, contacts: loadContacts, discover: loadDiscover, me: loadMeTab }
  if (loaders[tab]) loaders[tab](page, content)
}


// ===== Tab1：聊天列表 =====
async function refreshVisibleWechatChatList(options = {}) {
  const wechatPage = document.getElementById('wechat-page')
  if (!wechatPage) return
  const activeTab = wechatPage.querySelector('.wechat-tab.active')?.dataset.tab || 'chats'
  if (activeTab !== 'chats') return
  const content = wechatPage.querySelector('#wechat-content')
  if (!content) return
  await loadChatList(wechatPage, content, { showLoading: false, ...options })
}

window.closeWechatChatWindow = function() {
  const chatPage = document.getElementById('chat-window')
  if (!chatPage) return
  if (chatPage?.dataset.chatId) removeChatBeautyStyle(chatPage.dataset.chatId)
  clearWechatBlobUrlCache()
  clearWechatAvatarBlobCache()
  window.closePage('chat-window')
  refreshVisibleWechatChatList({ showLoading: false })
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return
  const page = document.getElementById('wechat-page')
  page?._flushWechatChatComposeText?.().catch(err => console.warn('保存微信顶部文字失败', err))
})

window.addEventListener('pagehide', () => {
  const page = document.getElementById('wechat-page')
  page?._flushWechatChatComposeText?.().catch(err => console.warn('保存微信顶部文字失败', err))
})

function renderCachedWechatChatList(page, container) {
  const state = page?._wechatChatListState
  if (!state || !container) return false
  const activeGroup = page.dataset.wechatChatGroup || 'Chat Logs'
  renderChatList(page, container, state.items || [], state.groups || [], activeGroup, state.composeText)
  return true
}

function removeWechatPageNow(id) {
  const page = document.getElementById(id)
  if (page) page.remove()
}

function getWechatGroupsKey(uid = _wechatUid) {
  return `wechatChatGroups_${uid}`
}

function getWechatChatMetaKey(uid = _wechatUid) {
  return `wechatChatMeta_${uid}`
}

const WECHAT_CHAT_COMPOSE_DEFAULT_TEXT = '淡淡的就会顺顺的…'

function getWechatChatComposeTextKey(uid = _wechatUid) {
  return `wechatChatComposeText_${uid}`
}

async function getWechatChatComposeText(uid = _wechatUid) {
  if (!uid) return WECHAT_CHAT_COMPOSE_DEFAULT_TEXT
  const row = await db.config.get(getWechatChatComposeTextKey(uid))
  const text = typeof row?.value === 'string' ? row.value.trim() : ''
  return text || WECHAT_CHAT_COMPOSE_DEFAULT_TEXT
}

async function saveWechatChatComposeText(text, uid = _wechatUid) {
  if (!uid) return
  const value = String(text || '').trim() || WECHAT_CHAT_COMPOSE_DEFAULT_TEXT
  await db.config.put({ key: getWechatChatComposeTextKey(uid), value })
}

function getWechatChatItemKey(type, id) {
  return `${type === 'group' ? 'group' : 'private'}:${id}`
}

async function getWechatChatGroups(uid = _wechatUid) {
  if (!uid) return []
  const row = await db.config.get(getWechatGroupsKey(uid))
  return Array.isArray(row?.value) ? row.value.filter(Boolean) : []
}

async function saveWechatChatGroups(groups, uid = _wechatUid) {
  if (!uid) return
  const seen = new Set()
  const clean = (groups || [])
    .map(g => String(g || '').trim())
    .filter(g => g && !seen.has(g) && seen.add(g))
  await db.config.put({ key: getWechatGroupsKey(uid), value: clean })
}

async function addWechatChatGroup(name, uid = _wechatUid) {
  const clean = String(name || '').trim()
  if (!clean) return []
  const groups = await getWechatChatGroups(uid)
  if (!groups.includes(clean)) groups.push(clean)
  await saveWechatChatGroups(groups, uid)
  return groups
}

async function getWechatChatMeta(uid = _wechatUid) {
  if (!uid) return {}
  const row = await db.config.get(getWechatChatMetaKey(uid))
  return row?.value && typeof row.value === 'object' ? row.value : {}
}

async function saveWechatChatMeta(meta, uid = _wechatUid) {
  if (!uid) return
  await db.config.put({ key: getWechatChatMetaKey(uid), value: meta || {} })
}

async function updateWechatChatMeta(itemKey, patch, uid = _wechatUid) {
  if (!itemKey) return {}
  const meta = await getWechatChatMeta(uid)
  meta[itemKey] = { ...(meta[itemKey] || {}), ...(patch || {}) }
  await saveWechatChatMeta(meta, uid)
  return meta[itemKey]
}

async function loadChatList(page, container, options = {}) {
  if (page?._flushWechatChatComposeText) {
    await page._flushWechatChatComposeText()
  }
  if (options.showLoading !== false) {
    container.innerHTML = '<div class="list-loading"><i class="fa fa-spinner fa-spin"></i></div>'
  }
  const allChats = await db.chats.toArray()
  // 仅展示当前账号名下的聊天
  const chats = allChats.filter(c => c.ownerUid === _wechatUid)
  const groupChats = await db.groupChats.toArray()
  const groups = await getWechatChatGroups()
  const meta = await getWechatChatMeta()
  const composeText = await getWechatChatComposeText()
  const activeGroup = page.dataset.wechatChatGroup || 'Chat Logs'
  const items = []
  await buildPrivateChatItems(chats, items, meta)
  await buildGroupChatItems(groupChats, items, meta)
  if (isWechatRolePhoneMode(page) && window.getPhoneSnapshotChatItems) {
    items.push(...await window.getPhoneSnapshotChatItems(_wechatRolePhoneSession))
  }
  items.sort((a, b) => b.time - a.time)
  renderChatList(page, container, items, groups, activeGroup, composeText)
}

// 构建私聊列表项

async function buildPrivateChatItems(chats, items, meta = {}) {
  for (const chat of chats) {
    const char = await getWechatDisplayCharacter(chat.charId)
    if (!char) continue
    const lastMsg = await db.messages.where('chatId').equals(chat.id).last()
    const itemKey = getWechatChatItemKey('private', chat.id)
    const itemMeta = meta[itemKey] || {}
    items.push({
      type: 'private', id: chat.id, charId: chat.charId,
      name: getWechatDisplayName(char), avatar: getWechatDisplayAvatar(char),
      lastMsg: getWechatMessageDisplayPreview(lastMsg, getWechatDisplayName(char)).slice(0, 30),
      time: lastMsg?.createdAt || chat.createdAt || 0,
      unread: chat.unread || 0,
      itemKey,
      groupName: itemMeta.groupName || '',
      pinned: !!itemMeta.pinned,
      pinnedAt: itemMeta.pinnedAt || 0
    })
  }
}

// 构建群聊列表项
async function buildGroupChatItems(groupChats, items, meta = {}) {
  for (const rawGroup of groupChats) {
    if (!isWechatGroupAccessible(rawGroup)) continue
    const g = await normalizeGroupChat(rawGroup)
    const lastMsg = await db.groupMessages.where('groupId').equals(g.id).last()
    const itemKey = getWechatChatItemKey('group', g.id)
    const itemMeta = meta[itemKey] || {}
    items.push({
      type: 'group', id: g.id, name: g.name || '群聊', avatar: g.avatar || '',
      lastMsg: getWechatMessageDisplayPreview(lastMsg).slice(0, 30),
      time: lastMsg?.createdAt || g.createdAt || 0,
      unread: g.unread || 0,
      itemKey,
      groupName: itemMeta.groupName || '',
      pinned: !!itemMeta.pinned,
      pinnedAt: itemMeta.pinnedAt || 0
    })
  }
}


// 渲染聊天列表
function renderChatList(page, container, items, groups = [], activeGroup = 'Chat Logs', composeText = WECHAT_CHAT_COMPOSE_DEFAULT_TEXT) {
  const normalizedComposeText = String(composeText || '').trim() || WECHAT_CHAT_COMPOSE_DEFAULT_TEXT
  page._wechatChatListState = { items, groups, composeText: normalizedComposeText }
  const pinnedItems = items
    .filter(item => item.pinned)
    .sort((a, b) => (b.pinnedAt || 0) - (a.pinnedAt || 0) || b.time - a.time)
  const regularItems = items.filter(item => {
    if (item.pinned) return false
    if (activeGroup === 'Chat Logs') return true
    return item.groupName === activeGroup
  })
  container.innerHTML = `
    <div class="chat-log-shell">
      <div class="chat-compose-card">
        <input class="chat-compose-input" id="chat-compose-entry" value="${wcEscHtml(normalizedComposeText)}" aria-label="聊天页顶部文字">
      </div>
      ${pinnedItems.length
        ? `<div class="chat-pinned-wrap" id="chat-pinned-wrap">${pinnedItems.map(item => buildChatRowHTML(item)).join('')}</div>`
        : ''}
      <div class="chat-group-tabs" id="chat-group-tabs">
        ${buildChatGroupTabHTML('Chat Logs', activeGroup)}
        ${groups.map(group => buildChatGroupTabHTML(group, activeGroup)).join('')}
        <button class="chat-group-add" id="btn-chat-group-add" type="button">Add</button>
      </div>
      <div class="chat-list-wrap" id="chat-list-wrap">
        ${buildChatListBodyHTML(regularItems)}
      </div>
    </div>
  `
  bindChatListShellEvents(page, container)
}

function buildChatListBodyHTML(items) {
  return items.length
    ? `<div class="chat-list-card">${items.map(item => buildChatRowHTML(item)).join('')}</div>`
    : '<div class="chat-empty-card"><div class="list-empty">暂无聊天，从通讯录开始对话吧</div></div>'
}

function bindChatListShellEvents(page, container) {
  const composeEntry = container.querySelector('#chat-compose-entry')
  if (composeEntry) {
    const ownerUid = _wechatUid
    let saveTimer = null
    const persistComposeText = async () => {
      if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = null
      }
      const text = composeEntry.value.trim() || WECHAT_CHAT_COMPOSE_DEFAULT_TEXT
      if (!composeEntry.value.trim()) composeEntry.value = text
      if (page._wechatChatListState) page._wechatChatListState.composeText = text
      await saveWechatChatComposeText(text, ownerUid)
    }
    page._flushWechatChatComposeText = persistComposeText
    composeEntry.addEventListener('input', () => {
      if (page._wechatChatListState) page._wechatChatListState.composeText = composeEntry.value
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        persistComposeText().catch(err => console.warn('保存微信顶部文字失败', err))
      }, 350)
    })
    composeEntry.addEventListener('blur', () => {
      persistComposeText().catch(err => console.warn('保存微信顶部文字失败', err))
    })
  }
  container.querySelectorAll('.chat-group-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      page.dataset.wechatChatGroup = tab.dataset.group || 'Chat Logs'
      refreshChatListGroupView(page, container)
    })
  })
  const addBtn = container.querySelector('#btn-chat-group-add')
  if (addBtn) addBtn.addEventListener('click', () => showAddChatGroupModal(page))
  bindChatSwipeRows(page, container)
  bindChatRowOpenEvents(page, container)
}

function bindChatRowOpenEvents(page, container) {
  container.querySelectorAll('.chat-list-row').forEach(row => {
    row.addEventListener('click', () => {
      if (row.dataset.type === 'phone-npc') {
        window.openPhoneSnapshotChatWindow?.(_wechatRolePhoneSession, decodeURIComponent(row.dataset.id))
      } else if (row.dataset.type === 'private') {
        openPrivateChat(page, parseInt(row.dataset.charId), parseInt(row.dataset.id))
      } else {
        openGroupChat(page, parseInt(row.dataset.id))
      }
    })
  })
}

function buildChatGroupTabHTML(group, activeGroup) {
  return `<button class="chat-group-tab${group === activeGroup ? ' active' : ''}" data-group="${wcEscHtml(group)}" type="button">${wcEscHtml(group)}</button>`
}

function refreshChatListGroupView(page, container) {
  const state = page._wechatChatListState
  if (!state) {
    loadChatList(page, container, { showLoading: false })
    return
  }
  const activeGroup = page.dataset.wechatChatGroup || 'Chat Logs'
  const regularItems = state.items.filter(item => {
    if (item.pinned) return false
    if (activeGroup === 'Chat Logs') return true
    return item.groupName === activeGroup
  })
  container.querySelectorAll('.chat-group-tab').forEach(tab => {
    tab.classList.toggle('active', (tab.dataset.group || 'Chat Logs') === activeGroup)
  })
  const list = container.querySelector('#chat-list-wrap')
  if (!list) return
  list.innerHTML = buildChatListBodyHTML(regularItems)
  bindChatSwipeRows(page, list)
  bindChatRowOpenEvents(page, list)
}

// 单条聊天行HTML
function buildChatRowHTML(item) {
  const avatarInner = item.avatar
    ? `<img src="${item.avatar}" alt="${wcEscHtml(item.name)}">`
    : (item.type === 'group' ? `<div class="avatar-icon-placeholder"><i class="fa fa-users"></i></div>` : buildWechatInitialAvatarHTML(item.name))
  const badge = item.unread > 0
    ? `<span class="unread-badge">${item.unread > 99 ? '99+' : item.unread}</span>` : ''
  // 生成的快照会话（角色手机）：只读，无置顶/删除滑动操作
  const actionsHtml = item.phoneSnapshot ? '' : `
      <div class="chat-row-actions">
        <button class="chat-pin-action" type="button">${item.pinned ? '取消置顶' : '置顶'}</button>
        <button class="chat-delete-action" type="button">删除</button>
      </div>`
  return `
    <div class="chat-swipe-item${item.pinned ? ' is-pinned' : ''}" data-item-key="${wcEscHtml(item.itemKey)}"${item.phoneSnapshot ? ' data-phone-snapshot="1"' : ''}>
      ${actionsHtml}
      <div class="chat-list-row" data-type="${item.type}" data-id="${item.id}" data-char-id="${item.charId || ''}">
        <div class="chat-avatar-wrap">
          <div class="chat-avatar">${avatarInner}</div>
          ${badge}
        </div>
        <div class="chat-row-info">
          <div class="chat-row-top">
            <span class="chat-row-name">${item.pinned ? '<i class="fa-solid fa-thumbtack chat-pin-mark"></i>' : ''}${wcEscHtml(item.name)}</span>
            <span class="chat-row-time">${wcFormatTime(item.time)}</span>
          </div>
          <div class="chat-row-last">${item.lastMsg || '暂无消息'}</div>
        </div>
      </div>
    </div>
  `
}

function closeOpenChatSwipeRows(container) {
  container.querySelectorAll('.chat-swipe-item.is-open').forEach(item => item.classList.remove('is-open'))
}

function bindChatSwipeRows(page, container) {
  container.querySelectorAll('.chat-swipe-item').forEach(item => {
    if (item.dataset.phoneSnapshot === '1') return
    const row = item.querySelector('.chat-list-row')
    const pinBtn = item.querySelector('.chat-pin-action')
    const deleteBtn = item.querySelector('.chat-delete-action')
    let startX = 0
    let startY = 0
    let tracking = false
    let moved = false
    const open = () => {
      closeOpenChatSwipeRows(container)
      item.classList.add('is-open')
    }
    const close = () => item.classList.remove('is-open')
    const start = e => {
      const point = e.touches ? e.touches[0] : e
      startX = point.clientX
      startY = point.clientY
      tracking = true
      moved = false
    }
    const move = e => {
      if (!tracking) return
      const point = e.touches ? e.touches[0] : e
      const dx = point.clientX - startX
      const dy = point.clientY - startY
      if (Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.2) moved = true
    }
    const end = e => {
      if (!tracking) return
      tracking = false
      const point = e.changedTouches ? e.changedTouches[0] : e
      const dx = point.clientX - startX
      const dy = point.clientY - startY
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        if (dx < 0) open()
        else close()
      }
      if (moved) {
        row.dataset.swiped = '1'
        setTimeout(() => { delete row.dataset.swiped }, 0)
      }
    }
    row.addEventListener('touchstart', start, { passive: true })
    row.addEventListener('touchmove', move, { passive: true })
    row.addEventListener('touchend', end)
    row.addEventListener('mousedown', start)
    row.addEventListener('mousemove', move)
    row.addEventListener('mouseup', end)
    row.addEventListener('mouseleave', () => { tracking = false })
    row.addEventListener('click', e => {
      if (row.dataset.swiped) {
        e.preventDefault()
        e.stopImmediatePropagation()
      } else if (item.classList.contains('is-open')) {
        close()
        e.preventDefault()
        e.stopImmediatePropagation()
      } else {
        closeOpenChatSwipeRows(container)
      }
    }, true)
    pinBtn.addEventListener('click', async e => {
      e.preventDefault()
      e.stopPropagation()
      const nextPinned = !item.classList.contains('is-pinned')
      await updateWechatChatMeta(item.dataset.itemKey, {
        pinned: nextPinned,
        pinnedAt: nextPinned ? Date.now() : 0
      })
      const rootContainer = page.querySelector('#wechat-content') || container
      await loadChatList(page, rootContainer, { showLoading: false })
    })
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async e => {
        e.preventDefault()
        e.stopPropagation()
        await confirmDeleteWechatChat(page, item, row)
      })
    }
  })
}

function getWechatChatScopedConfigPrefixes(chatId) {
  return [
    `chatTimeSettings_${chatId}`,
    `chatActiveReply_${chatId}`,
    `chatBilingual_${chatId}`,
    `chatImageGen_${chatId}`,
    `chatStickerImageInput_${chatId}`,
    `chatMsgNotify_${chatId}`,
    `chatLongMemory_${chatId}`,
    `chatAppearance_${chatId}`
  ]
}

async function deleteWechatConfigKeysForChat(chatId) {
  if (!db.config || !chatId) return
  const exactKeys = getWechatChatScopedConfigPrefixes(chatId)
  const allConfig = await db.config.toArray()
  const keys = allConfig
    .map(row => row?.key)
    .filter(key => {
      if (!key) return false
      if (exactKeys.includes(key)) return true
      return String(key).startsWith('offlineMeetSettings_') && String(key).includes(`_${chatId}_`)
    })
  if (keys.length) await db.config.bulkDelete(keys)
}

async function deleteWechatChatRecord(type, id, itemKey, ownerUid = _wechatUid) {
  if (!id) return
  if (type === 'group') {
    const group = await getWechatAccessibleGroup(id, ownerUid)
    if (!group) return
    await db.groupMessages.where('groupId').equals(id).delete()
    if (db.mcpToolTraces) {
      await db.mcpToolTraces.where('[scope+conversationId]').equals(['group', Number(id)]).delete()
    }
    await db.groupChats.delete(id)
  } else {
    const chat = await db.chats.get(id)
    if (!chat || String(chat.ownerUid) !== String(ownerUid)) return
    await db.messages.where('chatId').equals(id).delete()
    if (db.mcpToolTraces) {
      await db.mcpToolTraces.where('[scope+conversationId]').equals(['chat', Number(id)]).delete()
    }
    await db.chats.delete(id)
    if (db.memories) await db.memories.where('chatId').equals(id).delete()
    if (db.memoryRuns) await db.memoryRuns.where('chatId').equals(id).delete()
    if (db.callRecords) await db.callRecords.where('chatId').equals(id).delete()
    if (db.offlineChats) {
      const offlineRows = await db.offlineChats.toArray()
      const offlineIds = offlineRows.filter(row => String(row.chatId) === String(id)).map(row => row.id)
      if (offlineIds.length) await db.offlineChats.bulkDelete(offlineIds)
    }
    await deleteWechatConfigKeysForChat(id)
  }
  if (itemKey) {
    const meta = await getWechatChatMeta(ownerUid)
    if (meta && Object.prototype.hasOwnProperty.call(meta, itemKey)) {
      delete meta[itemKey]
      await saveWechatChatMeta(meta, ownerUid)
    }
  }
}

function confirmDeleteWechatChat(page, item, row) {
  const type = row?.dataset?.type || 'private'
  const id = parseInt(row?.dataset?.id, 10)
  if (!id) return
  const modal = wcMakeSheet(`
    <div class="sheet-title" style="text-align:center">删除聊天</div>
    <div style="padding:0 20px 16px;font-size:13px;color:var(--c-sub);line-height:1.7;text-align:center">
      删除后，此聊天框会从信息页面移除，聊天记录也会清空。此操作不可恢复。
    </div>
    <div class="sheet-actions">
      <button class="btn-ghost btn-pill" id="chat-delete-cancel" type="button" style="flex:1">取消</button>
      <button class="btn-pill" id="chat-delete-confirm" type="button" style="flex:1;background:var(--c-red);color:#fff">删除</button>
    </div>
  `)
  wcShowSheetNoConfirm(modal)
  modal.querySelector('#chat-delete-cancel')?.addEventListener('click', () => closeWcSheet(modal))
  modal.querySelector('#chat-delete-confirm')?.addEventListener('click', async () => {
    await deleteWechatChatRecord(type, id, item?.dataset?.itemKey || getWechatChatItemKey(type, id))
    closeWcSheet(modal)
    const openPage = type === 'group'
      ? document.querySelector(`.chat-window-page[data-group-id="${id}"]`)
      : document.querySelector(`.chat-window-page[data-chat-id="${id}"]`)
    if (openPage) openPage.remove()
    const rootContainer = page.querySelector('#wechat-content')
    if (rootContainer) await loadChatList(page, rootContainer, { showLoading: false })
    window.toast('聊天已删除')
  })
}

function showAddChatGroupModal(page, presetName = '') {
  const sheet = wcMakeSheet(`
    <div class="sheet-title">添加分组</div>
    <div class="chat-group-modal-body">
      <input class="input-field" id="chat-group-name-input" placeholder="输入分组名称" maxlength="20" value="${wcEscHtml(presetName)}">
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-save-chat-group">保存</button>
    </div>
  `)
  wcShowSheet(sheet, async () => {
    const name = sheet.querySelector('#chat-group-name-input').value.trim()
    if (!name) { window.toast && window.toast('请输入分组名称'); return false }
    await addWechatChatGroup(name)
    page.dataset.wechatChatGroup = name
    await loadChatList(page, page.querySelector('#wechat-content'))
  })
  setTimeout(() => sheet.querySelector('#chat-group-name-input')?.focus(), 80)
}

// 格式化时间
function wcFormatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts), now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function getSmartTimeParts(value, timeZone, weekdayStyle = 'short') {
  const opts = {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
    weekday: weekdayStyle
  }
  if (timeZone) opts.timeZone = timeZone
  const raw = new Intl.DateTimeFormat('zh-CN', opts).formatToParts(value)
  const parts = {}
  raw.forEach(part => { if (part.type !== 'literal') parts[part.type] = part.value })
  return {
    year: parseInt(parts.year, 10),
    month: parseInt(parts.month, 10),
    day: parseInt(parts.day, 10),
    hour: parts.hour || '00',
    minute: parts.minute || '00',
    weekday: parts.weekday || ''
  }
}

function smartDayKey(parts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day)
}

function formatWechatSmartTime(ts, options = {}) {
  if (!ts) return ''
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const timeZone = options.timeZone || ''
  const p = getSmartTimeParts(d, timeZone, options.weekdayStyle || 'short')
  const n = getSmartTimeParts(now, timeZone, options.weekdayStyle || 'short')
  const dayDiff = Math.round((smartDayKey(n) - smartDayKey(p)) / 86400000)
  const time = `${p.hour}:${p.minute}`
  if (dayDiff === 0) return options.todayPrefix ? `今天 ${time}` : time
  if (dayDiff === 1) return `昨天 ${time}`
  if (dayDiff > 1 && dayDiff < 7) return `${p.weekday} ${time}`
  return `${p.month}月${p.day}日 ${time}`
}

function formatWechatClockTime(ts, timeZone) {
  if (!ts) return ''
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  const p = getSmartTimeParts(d, timeZone)
  return `${p.hour}:${p.minute}`
}


// ===== 消息类型解析器 =====
function parseMsgType(content, charName, myName) {
  if (!content) return { type: 'text', data: { text: '' } }
  const c = content.trim()
  // 真实照片（特殊前缀）
  if (c.startsWith('__IMG__')) return { type: 'real-photo', data: { src: c.slice(7) } }
  if (c.startsWith('__LINK__')) return { type: 'link', data: parseLinkPayload(c.slice(8)) }
  if (c.startsWith(SHOP_APPROVAL_PREFIX)) return { type: 'shop-approval', data: parseShopApprovalPayload(c.slice(SHOP_APPROVAL_PREFIX.length)) }
  if (c.startsWith('__TBDEAL__')) return { type: 'tb-deal', data: parseTbDealPayload(c.slice(10)) }
  if (c.startsWith('__YUMDEAL__')) return { type: 'yum-deal', data: parseYumDealPayload(c.slice(11)) }
  // 群聊新类型（特殊前缀）
  if (c.startsWith('__REDPACKET__')) return { type: 'red-packet', data: _safeJsonParse(c.slice(13), {}) }
  if (c.startsWith('__POLL__')) return { type: 'poll', data: _safeJsonParse(c.slice(8), {}) }
  if (c.startsWith('__GIFT__')) return { type: 'gift', data: _safeJsonParse(c.slice(8), {}) }
  if (c.startsWith('__SYS__')) return { type: 'system-note', data: { text: c.slice(7) } }
  return parseSpecialMsg(c) || { type: 'text', data: { text: c } }
}

// 仅供会话列表和引用 UI 使用的展示摘要。
// 消息存储、复制、撤回和 API 上下文仍使用 getMsgActionText 及原始 content。
function getWechatMessageDisplayPreview(msg, charName = '') {
  if (!msg || typeof msg.content !== 'string') return ''
  const parsed = parseMsgType(msg.content, charName)
  const data = parsed.data || {}
  switch (parsed.type) {
    case 'text': return data.text || ''
    case 'quote': return data.reply || ''
    case 'voice': return '[语音]'
    case 'photo':
    case 'real-photo': return '[图片]'
    case 'link': return '[链接]'
    case 'shop-approval': return '[购物审批]'
    case 'transfer-recv':
    case 'transfer-resp': return '[转账]'
    case 'location': return '[位置]'
    case 'sticker': return '[表情]'
    case 'initiate-call':
    case 'call-record': return data.callType === '视频通话' ? '[视频通话]' : '[语音通话]'
    case 'red-packet': return '[红包]'
    case 'poll': return '[群投票]'
    case 'gift': return '[礼物]'
    case 'tb-deal':
    case 'tb-deal-resp': return data.dealType === 'gift' ? '[淘宝赠送]' : '[淘宝代付]'
    case 'yum-deal':
    case 'yum-deal-resp': return data.dealType === 'gift' ? '[外卖赠送]' : '[外卖代付]'
    case 'status-update': return '[状态更新]'
    case 'recall': return `${data.actor || charName || '对方'}撤回了一条消息`
    case 'system-note': return data.text || ''
    default: return msg.content || ''
  }
}

// 历史引用内容保存的是给 API 使用的完整摘要，此处只压缩它的 UI 显示。
function getWechatQuotedContentDisplayPreview(content) {
  const text = String(content || '').trim()
  if (!text) return ''
  // 前缀匹配：引用文本会被 normalizeQuoteText 截断到 200 字符，结尾的 ] 可能丢失
  const knownSummaryPatterns = [
    [/^\[语音(?:：|\])/, '[语音]'],
    [/^\[(?:照片|图片)(?:：|\])/, '[图片]'],
    [/^\[链接(?:｜|\])/, '[链接]'],
    [/^\[转账(?:：|\])/, '[转账]'],
    [/^\[位置(?:：|\])/, '[位置]'],
    [/^\[表情包(?:：|\])/, '[表情]'],
    [/^\[淘宝赠送(?:｜|\])/, '[淘宝赠送]'],
    [/^\[淘宝代付(?:请求)?(?:｜|\])/, '[淘宝代付]'],
    [/^\[外卖赠送(?:｜|\])/, '[外卖赠送]'],
    [/^\[外卖代付(?:请求)?(?:｜|\])/, '[外卖代付]']
  ]
  const matched = knownSummaryPatterns.find(([pattern]) => pattern.test(text))
  if (matched) return matched[1]
  return getWechatMessageDisplayPreview({ content: text })
}

function _safeJsonParse(s, fallback = null) {
  try { return JSON.parse(s) } catch { return fallback }
}

function normalizeImageSupplementDesc(desc) {
  const text = String(desc || '').trim()
  return text === '图片' ? '' : text
}

function parseLinkPayload(raw) {
  try {
    const data = JSON.parse(String(raw || '').trim())
    return normalizeLinkPayload(data)
  } catch (_) {
    return normalizeLinkPayload({})
  }
}

function normalizeLinkPayload(data) {
  const url = String(data?.url || '').trim()
  const siteName = String(data?.siteName || '').trim() || getLinkSiteName(url)
  const title = String(data?.title || '').trim() || siteName || '链接'
  const summary = String(data?.summary || '').trim()
  const comments = normalizeLinkComments(data?.comments)
  const finalUrl = String(data?.finalUrl || '').trim()
  const imageUrl = String(data?.imageUrl || '').trim()
  const imageUrls = normalizeLinkImageUrls(data?.imageUrls, imageUrl)
  const mediaType = String(data?.mediaType || '').trim()
  const parseStatus = ['success', 'failed', 'pending'].includes(data?.parseStatus) ? data.parseStatus : (summary || comments.length ? 'success' : 'pending')
  const error = String(data?.error || '').trim()
  return { siteName, title, url, summary, comments, finalUrl, imageUrl: imageUrls[0] || imageUrl, imageUrls, mediaType, parseStatus, error }
}

function normalizeLinkComments(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  return value
    .map(item => ({
      name: String(item?.name || '').trim(),
      text: String(item?.text || '').trim()
    }))
    .filter(item => item.text)
    .filter(item => {
      const key = `${item.name}\n${item.text}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 20)
}

function buildLinkCommentSummary(comments) {
  return normalizeLinkComments(comments)
    .slice(0, 8)
    .map(item => item.name ? `${item.name}：${item.text}` : item.text)
    .join('\n')
}

function normalizeLinkImageUrls(value, fallback = '') {
  const raw = Array.isArray(value) ? value.slice() : []
  if (fallback) raw.unshift(fallback)
  const seen = new Set()
  return raw
    .map(item => String(item || '').trim())
    .filter(src => isWechatVisualImageSrc(src))
    .filter(src => {
      if (seen.has(src)) return false
      seen.add(src)
      return true
    })
}

function buildLinkMessageContent(data) {
  return `__LINK__${JSON.stringify(normalizeLinkPayload(data))}`
}

function buildLinkFallbackText(data) {
  const link = normalizeLinkPayload(data)
  const parts = [
    `网站：${link.siteName || '未知网站'}`,
    `标题：${link.title || link.siteName || '链接'}`,
    `URL：${link.url || ''}`
  ]
  if (link.finalUrl && link.finalUrl !== link.url) parts.push(`最终链接：${link.finalUrl}`)
  if (link.mediaType) parts.push(`类型：${link.mediaType === 'video' ? '视频' : '图片'}`)
  if (link.summary) parts.push(`内容摘要：${link.summary}`)
  const commentSummary = buildLinkCommentSummary(link.comments)
  if (commentSummary) parts.push(`评论区：${commentSummary}`)
  else if (link.parseStatus === 'failed') parts.push('链接内容因网络问题无法读取；不要编造内容，按链接加载失败自然回复')
  else parts.push('请尝试读取该 URL 的内容；如果无法联网访问或无法读取，不要编造内容，按链接加载失败自然回复')
  if (link.imageUrls.length) parts.push(`图片：已附加 ${link.imageUrls.length} 张供视觉模型查看`)
  return `[链接｜${parts.join('｜')}]`
}

// ===== 淘宝代付/赠送 卡片数据 =====
function tbDealMoney(num) { return Math.round((Number(num) || 0) * 100) / 100 }
function tbDealMoneyText(num) { return tbDealMoney(num).toFixed(2).replace(/\.00$/, '') }

function normalizeTbDealPayload(data) {
  const d = data || {}
  const dealType = d.dealType === 'gift' ? 'gift' : 'pay'
  let items = Array.isArray(d.items) ? d.items.map(it => ({
    title: String(it?.title || '').trim() || '商品',
    qty: Math.max(1, parseInt(it?.qty, 10) || 1),
    price: tbDealMoney(it?.price),
    icon: it?.icon || '',
    image: it?.image || '',
    bgColor: it?.bgColor || '',
    tone: it?.tone || 'a'
  })) : []
  let total = d.total !== undefined ? tbDealMoney(d.total)
    : items.reduce((s, it) => s + it.price * it.qty, 0)
  total = tbDealMoney(total)
  const title = String(d.title || '').trim() || (items[0] ? items[0].title : '淘宝订单')
  if (!items.length) items = [{ title, qty: 1, price: total, icon: '', image: '', bgColor: '', tone: 'a' }]
  return {
    dealType,
    siteName: String(d.siteName || '淘宝').trim() || '淘宝',
    title,
    total,
    items,
    orderId: d.orderId || '',
    ownerUid: d.ownerUid != null ? d.ownerUid : null,
    origin: d.origin || 'app'
  }
}

function parseTbDealPayload(raw) {
  try { return normalizeTbDealPayload(JSON.parse(String(raw || '').trim())) }
  catch (_) { return normalizeTbDealPayload({}) }
}

function buildTbDealMessageContent(data) {
  return `__TBDEAL__${JSON.stringify(normalizeTbDealPayload(data))}`
}

function buildTbDealFallbackText(data) {
  const deal = normalizeTbDealPayload(data)
  const itemsText = deal.items.map(it => `${it.title} ×${it.qty}`).join('、')
  if (deal.dealType === 'gift') {
    return `[淘宝赠送｜来源：淘宝｜商品：${itemsText}｜金额：¥${tbDealMoneyText(deal.total)}｜对方已付款赠送给你一份淘宝礼物，你可以选择接收或退回]`
  }
  return `[淘宝代付请求｜来源：淘宝｜商品：${itemsText}｜合计：¥${tbDealMoneyText(deal.total)}｜对方请你帮忙付款，你可以选择付款或拒绝]`
}

// ===== YumYum 外卖 代付/赠送 卡片 =====
function yumDealMoney(num) { return Math.round((Number(num) || 0) * 100) / 100 }
function yumDealMoneyText(num) { return yumDealMoney(num).toFixed(2).replace(/\.00$/, '') }

function normalizeYumDealPayload(data) {
  const d = data || {}
  const dealType = d.dealType === 'gift' ? 'gift' : 'pay'
  let items = Array.isArray(d.items) ? d.items.map(it => ({
    name: String(it?.name || it?.title || '').trim() || '商品',
    qty: Math.max(1, parseInt(it?.qty, 10) || 1),
    price: yumDealMoney(it?.price),
    icon: it?.icon || 'fa-utensils',
    tone: it?.tone || 'a'
  })) : []
  let total = d.total !== undefined ? yumDealMoney(d.total)
    : items.reduce((s, it) => s + it.price * it.qty, 0)
  total = yumDealMoney(total)
  const shopName = String(d.shopName || '').trim()
  const title = String(d.title || '').trim() || (items[0] ? items[0].name : 'YumYum 外卖')
  if (!items.length) items = [{ name: title, qty: 1, price: total, icon: 'fa-utensils', tone: 'a' }]
  return {
    dealType,
    siteName: String(d.siteName || 'YumYum').trim() || 'YumYum',
    title,
    shopName,
    shopIcon: d.shopIcon || 'fa-bowl-food',
    shopTone: d.shopTone || 'a',
    total,
    items,
    address: d.address || null,
    remark: String(d.remark || ''),
    voucherId: d.voucherId || null,
    payMethod: d.payMethod || null,
    etaMinutes: d.etaMinutes || null,
    // 时间线字段（代付付款后或赠送时才有值）
    orderId: d.orderId || '',
    createdAt: d.createdAt || null,
    estDeliverAt: d.estDeliverAt || null,
    state1EndAt: d.state1EndAt || null,
    actualDeliverAt: d.actualDeliverAt || null,
    ownerUid: d.ownerUid != null ? d.ownerUid : null,
    shopId: d.shopId || null,
    origin: d.origin || 'app'
  }
}

function parseYumDealPayload(raw) {
  try { return normalizeYumDealPayload(JSON.parse(String(raw || '').trim())) }
  catch (_) { return normalizeYumDealPayload({}) }
}

window.buildYumDealMessageContent = function(data) {
  return `__YUMDEAL__${JSON.stringify(normalizeYumDealPayload(data))}`
}

// 是否已有时间线（订单号 + 送达时间），用于决定卡片显示形态
function yumDealHasTimeline(deal) {
  return !!(deal && deal.orderId && deal.estDeliverAt && deal.state1EndAt && deal.actualDeliverAt)
}

// 与 yumyum.js yhOrderStatus 同款三段判断
function yumDealOrderStatus(deal) {
  const now = Date.now()
  if (now < deal.state1EndAt) return { state: 'state1', step: 1, label: '商家接单 · 备餐中' }
  if (now < deal.actualDeliverAt) return { state: 'state2', step: 2, label: '骑手配送中' }
  return { state: 'done', step: 3, label: '已送达 · 订单完成' }
}

function yumDealEtaText(deal) {
  if (!deal.estDeliverAt) return ''
  const pad = n => (n < 10 ? '0' + n : '' + n)
  const st = yumDealOrderStatus(deal)
  if (st.state === 'done') {
    const ad = new Date(deal.actualDeliverAt)
    return '已于 ' + pad(ad.getHours()) + ':' + pad(ad.getMinutes()) + ' 送达'
  }
  const ed = new Date(deal.estDeliverAt)
  return '预计 ' + pad(ed.getHours()) + ':' + pad(ed.getMinutes()) + ' 送达'
}

function buildYumDealFallbackText(data) {
  const deal = normalizeYumDealPayload(data)
  const itemsText = deal.items.map(it => `${it.name} ×${it.qty}`).join('、')
  const shop = deal.shopName ? `｜店铺：${deal.shopName}` : ''
  if (deal.dealType === 'gift') {
    return `[外卖赠送｜来源：YumYum${shop}｜商品：${itemsText}｜金额：¥${yumDealMoneyText(deal.total)}｜对方点了一份外卖请你，你可以选择收下或退回。收下请回复「[我收下了你的外卖]」，退回请回复「[我退回了你的外卖]」]`
  }
  return `[外卖代付请求｜来源：YumYum${shop}｜商品：${itemsText}｜合计：¥${yumDealMoneyText(deal.total)}｜对方点了外卖请你帮忙付款，付款后才会生成订单号与送达时间。愿意付款请回复「[我帮你付了外卖代付]」，拒绝请回复「[我拒绝了你的外卖代付]」]`
}

// 解析特殊消息格式
function parseSpecialMsg(c) {
  let m
  // 拍一拍
  m = c.match(/^\[(.+?)拍了拍(.+?)\]$/)
  if (m) return { type: 'system-note', data: { text: `${m[1].trim()} 拍了拍 ${m[2].trim()}` } }
  // 语音
  m = c.match(/^\[.+的语音：(.+)\]$/)
  if (m) return { type: 'voice', data: { text: m[1] } }
  // 照片
  m = c.match(/^\[.+发来的照片：(.+)\]$/)
  if (m) return { type: 'photo', data: { desc: m[1] } }
  // 转账
  m = c.match(/^\[.+的转账：(.+?)元；备注：(.+)\]$/)
  if (m) return { type: 'transfer-recv', data: { amount: m[1], note: m[2] } }
  // 淘宝代付/赠送（角色自由填写：商品名 + 价格）
  m = c.match(/^\[.+的淘宝(代付|赠送)：(.+?)；(?:¥|￥)?\s*([\d.]+)\s*元?\]$/)
  if (m) return { type: 'tb-deal', data: normalizeTbDealPayload({ dealType: m[1] === '赠送' ? 'gift' : 'pay', title: m[2], total: parseFloat(m[3]), origin: 'char-text' }) }
  // YumYum 外卖代付/赠送（角色自由填写：商品名 + 价格）
  m = c.match(/^\[.+的外卖(代付|赠送)：(.+?)；(?:¥|￥)?\s*([\d.]+)\s*元?\]$/)
  if (m) return { type: 'yum-deal', data: normalizeYumDealPayload({ dealType: m[1] === '赠送' ? 'gift' : 'pay', title: m[2], total: parseFloat(m[3]), origin: 'char-text' }) }
  // 表情包
  m = c.match(/^\[.+的表情包：(.*)\]$/)
  if (m) return { type: 'sticker', data: { name: m[1] } }
  return parseResponseMsg(c)
}


// 解析回应类消息
function parseResponseMsg(c) {
  let m
  // 发起通话
  m = c.match(/^\[.+发起(语音通话|视频通话)\]$/)
  if (m) return { type: 'initiate-call', data: { callType: m[1] } }
  // 转账回应
  m = c.match(/^\[.+接收.+的转账\]$/)
  if (m) return { type: 'transfer-resp', data: { accepted: true } }
  m = c.match(/^\[.+退回.+的转账\]$/)
  if (m) return { type: 'transfer-resp', data: { accepted: false } }
  // 淘宝代付/赠送 回应
  m = c.match(/^\[.+帮.+付了淘宝代付\]$/)
  if (m) return { type: 'tb-deal-resp', data: { dealType: 'pay', result: 'paid' } }
  m = c.match(/^\[.+拒绝了.+的淘宝代付\]$/)
  if (m) return { type: 'tb-deal-resp', data: { dealType: 'pay', result: 'rejected' } }
  m = c.match(/^\[.+接收了.+的淘宝礼物\]$/)
  if (m) return { type: 'tb-deal-resp', data: { dealType: 'gift', result: 'accepted' } }
  m = c.match(/^\[.+退回了.+的淘宝礼物\]$/)
  if (m) return { type: 'tb-deal-resp', data: { dealType: 'gift', result: 'returned' } }
  // YumYum 外卖代付/赠送 回应
  m = c.match(/^\[.+帮.+付了外卖代付\]$/)
  if (m) return { type: 'yum-deal-resp', data: { dealType: 'pay', result: 'paid' } }
  m = c.match(/^\[.+拒绝了.+的外卖代付\]$/)
  if (m) return { type: 'yum-deal-resp', data: { dealType: 'pay', result: 'rejected' } }
  m = c.match(/^\[.+收下了.+的外卖\]$/)
  if (m) return { type: 'yum-deal-resp', data: { dealType: 'gift', result: 'accepted' } }
  m = c.match(/^\[.+退回了.+的外卖\]$/)
  if (m) return { type: 'yum-deal-resp', data: { dealType: 'gift', result: 'returned' } }
  // 状态更新
  m = c.match(/^\[.+更新状态为：(.+)\]$/)
  if (m) return { type: 'status-update', data: { status: m[1] } }
  return parseQuoteRecallLocation(c)
}

// 解析引用/撤回/位置/普通消息
function parseQuoteRecallLocation(c) {
  let m
  // 引用回复
  m = c.match(/^\[.+引用"(.+?)：([\s\S]+)"并回复：([\s\S]+)\]$/)
  if (m) return { type: 'quote', data: { speaker: m[1], quoted: m[2], reply: m[3] } }
  m = c.match(/^\[.+引用"([\s\S]+)"并回复：([\s\S]+)\]$/)
  if (m) return { type: 'quote', data: { quoted: m[1], reply: m[2] } }
  // 撤回消息
  m = c.match(/^\[(.+)撤回了一条消息：(.+)\]$/)
  if (m) return { type: 'recall', data: { actor: m[1], recalled: m[2] } }
  // 位置
  m = c.match(/^\[.+的位置：(.+?)(?:；距你约(.+))?\]$/)
  if (m) return { type: 'location', data: { place: m[1], dist: m[2] || '' } }
  // 通话记录
  m = c.match(/^\[(视频通话|语音通话)\s+(\d{2}:\d{2})\]$/)
  if (m) return { type: 'call-record', data: { callType: m[1], duration: m[2] } }
  // 普通消息（带括号格式）
  m = c.match(/^\[.+的消息：(.+)\]$/)
  if (m) return { type: 'text', data: { text: m[1] } }
  return null
}

function stripBilingualOuterBrackets(text) {
  const s = String(text || '').trim()
  if (s.length >= 2 && s.startsWith('[') && s.endsWith(']')) return s.slice(1, -1).trim()
  return s
}

function parseBilingualText(text) {
  const s = stripBilingualOuterBrackets(text)
  const m = s.match(/^([\s\S]*?)「([\s\S]+)」$/)
  if (!m) return { original: s, translation: '' }
  const original = (m[1] || '').trim()
  const translation = (m[2] || '').trim()
  if (!original || !translation) return { original: text || '', translation: '' }
  return { original, translation }
}

function getBilingualDisplayText(text, bilingualSettings) {
  if (!bilingualSettings?.enabled) return { original: text || '', translation: '' }
  return parseBilingualText(text)
}

function buildTranslationCardHTML(translation, hidden = true) {
  if (!translation) return ''
  return `
    <div class="wechat-translation-card" style="${hidden ? 'display:none' : ''}">
      <div class="wechat-translation-text">${wcEscHtml(translation)}</div>
      <div class="wechat-translation-provider">
        <span class="wechat-translation-check">✓</span>
        <span>由微信提供翻译支持</span>
      </div>
    </div>`
}

window.toggleBilingualTranslation = function(bubbleEl) {
  const wrap = bubbleEl.closest('.wechat-bilingual-message')
  if (!wrap) return
  const card = wrap.querySelector('.wechat-translation-card')
  if (!card) return
  const isOpen = wrap.classList.toggle('is-translation-open')
  card.style.display = isOpen ? 'block' : 'none'
}

// ===== 消息气泡渲染 =====
// stickerMap: 本会话已挂载分组下 name → image 的映射（loadChatMessages/refreshChat 注入）
function renderBubbleHTML(msg, isSelf, charName, stickerMap, bilingualSettings) {
  const { type, data } = parseMsgType(msg.content, charName)
  const cls = isSelf ? 'self' : 'other'
  const myName = _wechatUser?.nick || _wechatUser?.name || '我'
  const bilingual = !isSelf ? bilingualSettings : null
  switch (type) {
    case 'text': return renderTextBubble(data.text, cls, '', cls === 'self', bilingual)
    case 'voice': return renderVoiceBubble(data, msg.id, cls, bilingual)
    case 'photo': return renderPhotoBubble(data, cls, msg)
    case 'real-photo': return renderRealPhotoBubble(data, msg)
    case 'transfer-recv': return renderTransferCard(data, msg, isSelf, charName, myName)
    case 'transfer-resp': return renderTransferResp(data, msg, isSelf)
    case 'tb-deal': return renderTbDealCard(data, msg, isSelf, charName, myName)
    case 'tb-deal-resp': return renderTbDealResp(data, msg, isSelf)
    case 'yum-deal': return renderYumDealCard(data, msg, isSelf, charName, myName)
    case 'yum-deal-resp': return renderYumDealResp(data, msg, isSelf)
    case 'status-update': return ''
    case 'quote': return renderQuoteBubble(data, cls, myName, msg)
    case 'recall': return renderRecallRow(data, charName)
    case 'location': return renderLocationCard(data, cls)
    case 'link': return renderLinkCard(data, cls)
    case 'shop-approval': return renderShopApprovalCard(data, msg, isSelf)
    case 'sticker': return renderStickerBubble(data, isSelf, msg, stickerMap)
    case 'call-record': return renderCallRecordBubble(data, cls)
    case 'red-packet': return renderRedPacketCard(data, msg)
    case 'poll': return renderPollCard(data, msg)
    case 'gift': return renderGiftCard(data, msg)
    case 'system-note': return renderSystemNote(data)
    default: return renderTextBubble(msg.content || '', cls)
  }
}

// 文字气泡
function renderTextBubble(text, cls, timeHtml = '', isSelf = cls === 'self', bilingualSettings = null) {
  const bilingual = !isSelf ? getBilingualDisplayText(text, bilingualSettings) : { original: text || '', translation: '' }
  const hasTranslation = !!bilingual.translation
  const clickAttr = hasTranslation ? ' onclick="toggleBilingualTranslation(this)"' : ''
  const extraClass = hasTranslation ? ' wechat-bilingual-source' : ''
  const bubbleText = bilingual.original
  const bubbleHtml = !timeHtml
    ? `<div class="msg-bubble bubble-${cls}${extraClass}"${clickAttr}>${wcEscHtml(bubbleText)}</div>`
    : `<div class="msg-bubble bubble-${cls} msg-text-bubble-with-time ${isSelf ? 'is-self' : 'is-other'}${extraClass}"${clickAttr}><span class="msg-text-main">${wcEscHtml(bubbleText)}</span><span class="msg-text-spacer" aria-hidden="true"></span>${timeHtml}</div>`
  if (!hasTranslation) return bubbleHtml
  return `<div class="wechat-bilingual-message">${bubbleHtml}${buildTranslationCardHTML(bilingual.translation)}</div>`
}

function getVoiceMeta(text) {
  const raw = String(text || '')
  const compactLen = raw.replace(/\s/g, '').length
  const duration = Math.min(60, Math.max(1, Math.ceil(compactLen / 4)))
  const width = Math.min(220, 82 + Math.max(0, duration - 4) * 3)
  return { duration, width }
}

function renderVoiceIcon(cls) {
  const isSelf = cls === 'self'
  const paths = isSelf
    ? [
      'M733.128 391.078258l120.99342 120.850063-120.850063 120.850063c-66.804424-66.661067-66.804424-174.895702-0.143357-241.700126z',
      'm611.277937 753.861805l-60.353353 60.353352c-167.01106-166.867703-167.01106-437.525969 0-604.393672l60.353353 60.49671c-133.608848 133.465491-133.608848 350.078118 0 483.54361z',
      'M430.931164 88.881422c-233.672127 233.672127-233.672127 612.565029 0 846.093798l-60.353353 60.640068c-267.074339-267.074339-267.074339-700.156237 0-967.087219L430.931164 88.881422z'
    ]
    : [
      'M291.01498 391.078258l-120.99342 120.850063 120.850063 120.850063c66.804424-66.661067 66.804424-174.895702 0.143357-241.700126z',
      'm412.865043 753.861805l60.353353 60.353352c167.01106-166.867703 167.01106-437.525969 0-604.393672l-60.353353 60.49671c133.608848 133.465491 133.608848 350.078118 0 483.54361z',
      'M593.211816 88.881422c233.672127 233.672127 233.672127 612.565029 0 846.093798l60.353353 60.640068c267.074339-267.074339 267.074339-700.156237 0-967.087219L593.211816 88.881422z'
    ]
  return `<svg class="voice-signal" viewBox="0 0 1024 1024" width="16" height="16" aria-hidden="true" focusable="false"><path class="voice-signal-path voice-signal-path-1" d="${paths[0]}" fill="currentColor"></path><path class="voice-signal-path voice-signal-path-2" d="${paths[1]}" fill="currentColor"></path><path class="voice-signal-path voice-signal-path-3" d="${paths[2]}" fill="currentColor"></path></svg>`
}

// 语音气泡
function renderVoiceBubble(data, msgId, cls, bilingualSettings = null) {
  const bilingual = cls === 'other' ? getBilingualDisplayText(data.text || '', bilingualSettings) : { original: data.text || '', translation: '' }
  const text = bilingual.original || ''
  const meta = getVoiceMeta(text)
  const durationText = `${meta.duration}"`
  const translationHtml = bilingual.translation ? buildTranslationCardHTML(bilingual.translation) : ''
  return `
    <div class="voice-message voice-${cls}" data-msg-id="${msgId}">
      <div class="msg-bubble voice-bubble bubble-${cls}" style="--voice-width:${meta.width}px" onclick="toggleVoice(this)">
        <div class="voice-main">
          ${cls === 'other' ? renderVoiceIcon(cls) : ''}
          <span class="voice-duration">${durationText}</span>
          ${cls === 'self' ? renderVoiceIcon(cls) : ''}
        </div>
      </div>
      <div class="voice-transcript-bubble" style="display:none">${wcEscHtml(text)}</div>
      ${translationHtml}
    </div>`
}


// 照片卡片
function renderPhotoBubble(data, cls, msg) {
  const ownerUid = msg?.ownerUid || _wechatUid || ''
  const charId = msg?.charId || ''
  const role = msg?.role || ''
  const msgId = msg?.id || ''
  const common = `onclick="showMomentImageViewModal(this.dataset.src, this.dataset.desc, { ownerUid: this.dataset.ownerUid, charId: this.dataset.charId, role: this.dataset.role, msgId: this.dataset.msgId })" data-desc="${wcEscHtml(data.desc)}" data-owner-uid="${wcEscHtml(ownerUid)}" data-char-id="${wcEscHtml(charId)}" data-role="${wcEscHtml(role)}" data-msg-id="${wcEscHtml(msgId)}"`
  // 待生成的 AI 图片（desc 带 [SHOT:...]）：与 real-photo 一致的 200×267 灰色占位 + 加载指示，
  // 不再用 /img 随机图，生成完成后无缝替换，避免占位图与真实图差异造成的视觉跳变。
  if (/\[SHOT:/i.test(String(data?.desc || ''))) {
    return `<div class="msg-real-photo msg-photo-generating" ${common} data-src=""><i class="fa fa-spinner fa-spin"></i></div>`
  }
  const src = getPhotoPlaceholderSrc(msg)
  return `
    <div class="msg-card photo-card card-${cls}" ${common} data-src="${wcEscHtml(src)}">
      <img src="${src}" class="photo-thumb" alt="照片" loading="lazy">
    </div>`
}

// ===== 生成图片 blob 存储引用 =====
// 消息 content 中以 `__IMG__wwblob:<id>` 形式存储引用，二进制存于 db.imageBlobs。
// 渲染时用 URL.createObjectURL() 生成临时 URL，比 base64 data URL 渲染更快。
const WECHAT_BLOB_REF_PREFIX = 'wwblob:'
const _wechatBlobUrlCache = new Map()   // id -> objectURL（同会话内复用，重建 DOM 不闪烁）

function isWechatBlobRef(src) {
  return /^wwblob:\d+$/.test(String(src || ''))
}

function wechatBlobRefId(src) {
  const m = String(src || '').match(/^wwblob:(\d+)$/)
  return m ? parseInt(m[1], 10) : null
}

// 同步读取缓存的 objectURL（命中则渲染时直接带 src，无需异步、无闪烁）
function getWechatBlobUrlCached(src) {
  const id = wechatBlobRefId(src)
  return id != null ? (_wechatBlobUrlCache.get(id) || '') : ''
}

function forgetWechatBlobUrl(src) {
  const id = wechatBlobRefId(src)
  if (id == null || !_wechatBlobUrlCache.has(id)) return
  const url = _wechatBlobUrlCache.get(id)
  try { URL.revokeObjectURL(url) } catch (_) {}
  _wechatBlobUrlCache.delete(id)
}

// 离开聊天窗口时回收所有图片 objectURL，释放内存（图片本体仍在 db.imageBlobs，
// 重开聊天时 hydrateWechatBlobImages 会从本地数据库重新生成句柄，不丢图、不重下载）
function clearWechatBlobUrlCache() {
  for (const url of _wechatBlobUrlCache.values()) {
    try { URL.revokeObjectURL(url) } catch (_) {}
  }
  _wechatBlobUrlCache.clear()
}

// ===== 头像 blob 引用去重 =====
// 头像存的是完整 base64 data URL，若原样拼进每一条消息行的 HTML，
// 头像会在 DOM 里被重复复制 N 份（N=该角色/自己的消息条数），
// 长聊天窗口下这部分重复占用可能达到几 MB～十几 MB，是 iOS 微信内置浏览器
// 随机闪退的主要内存压力来源之一。这里换成同一份 blob URL 引用，头像图片
// 在内存里只解码一份，消息行里只是重复一个几十字符的短字符串。
const _wechatAvatarBlobCache = new Map() // cacheKey -> { url, source }

async function getAvatarBlobUrl(cacheKey, source) {
  const value = String(source || '')
  if (!value || !value.startsWith('data:')) return value
  const cached = _wechatAvatarBlobCache.get(cacheKey)
  if (cached && cached.source === value) return cached.url
  if (cached) {
    try { URL.revokeObjectURL(cached.url) } catch (_) {}
    _wechatAvatarBlobCache.delete(cacheKey)
  }
  try {
    const blob = await (await fetch(value)).blob()
    const url = URL.createObjectURL(blob)
    _wechatAvatarBlobCache.set(cacheKey, { url, source: value })
    return url
  } catch (_) {
    return value
  }
}

function clearWechatAvatarBlobCache() {
  for (const entry of _wechatAvatarBlobCache.values()) {
    try { URL.revokeObjectURL(entry.url) } catch (_) {}
  }
  _wechatAvatarBlobCache.clear()
}

function resolveGeneratedImageRemoteUrl(imageResult, cfg = {}) {
  const value = String(imageResult || '').trim()
  if (!value) throw new Error('图片生成接口返回了空结果')
  let baseUrl = ''
  try {
    baseUrl = typeof getImageGenerationUrl === 'function'
      ? getImageGenerationUrl(cfg.url || '')
      : String(cfg.url || '')
    const parsed = new URL(value, baseUrl || location.href)
    if (!/^https?:$/.test(parsed.protocol)) throw new Error('不支持的图片 URL 协议')
    return parsed.href
  } catch (e) {
    if (e?.message === '不支持的图片 URL 协议') throw e
    throw new Error('图片生成接口返回了无效 URL')
  }
}

function getGeneratedImageDownloadHeaders(imageUrl, cfg = {}) {
  if (!cfg.key || !cfg.url) return {}
  try {
    const apiUrl = typeof getImageGenerationUrl === 'function'
      ? getImageGenerationUrl(cfg.url)
      : String(cfg.url)
    if (new URL(imageUrl).origin === new URL(apiUrl, location.href).origin) {
      return { Authorization: 'Bearer ' + cfg.key }
    }
  } catch (_) {}
  return {}
}

async function validateGeneratedImageBlob(blob) {
  if (!blob || !blob.size) throw new Error('图片下载结果为空')
  const objectUrl = URL.createObjectURL(blob)
  try {
    await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) resolve()
        else reject(new Error('图片内容无法解析'))
      }
      img.onerror = () => reject(new Error('图片内容无法解析'))
      img.src = objectUrl
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
  return blob
}

// 把生图接口的 data URL / 远程 URL 统一转为可持久化 Blob。
// 远程 URL 必须在生成后立即下载，避免签名过期或后续渲染时缺少鉴权。
async function generatedImageResultToBlob(imageResult, cfg = {}) {
  const value = String(imageResult || '').trim()
  if (!value) throw new Error('图片生成接口返回了空结果')
  if (/^data:/i.test(value)) {
    return await validateGeneratedImageBlob(dataURLtoBlob(value))
  }

  const imageUrl = resolveGeneratedImageRemoteUrl(value, cfg)
  let res
  try {
    res = await fetch(imageUrl, { headers: getGeneratedImageDownloadHeaders(imageUrl, cfg) })
  } catch (_) {
    throw new Error('图片下载失败，可能是跨域限制或临时地址已失效')
  }
  if (!res.ok) throw new Error('图片下载失败：HTTP ' + res.status)
  return await validateGeneratedImageBlob(await res.blob())
}

async function storeGeneratedImageResult(imageResult, cfg = {}) {
  if (!db.imageBlobs) throw new Error('当前数据库不支持图片存储')
  const blob = await generatedImageResultToBlob(imageResult, cfg)
  const blobId = await db.imageBlobs.add({ blob, createdAt: Date.now() })
  return WECHAT_BLOB_REF_PREFIX + blobId
}

// 异步把 blob 引用解析为 objectURL，结果缓存
async function resolveWechatBlobUrl(src, options = {}) {
  const id = wechatBlobRefId(src)
  if (id == null) return ''
  if (options.force) forgetWechatBlobUrl(src)
  if (_wechatBlobUrlCache.has(id)) return _wechatBlobUrlCache.get(id)
  if (!db.imageBlobs) return ''
  const rec = await db.imageBlobs.get(id)
  if (!rec || !rec.blob) return ''
  const url = URL.createObjectURL(rec.blob)
  _wechatBlobUrlCache.set(id, url)
  return url
}

// 把 blob 引用解析为 base64 data URL（用于发回 AI 上下文，objectURL 远端不可访问）
async function resolveWechatBlobDataURL(src) {
  const id = wechatBlobRefId(src)
  if (id == null || !db.imageBlobs) return ''
  const rec = await db.imageBlobs.get(id)
  if (!rec || !rec.blob) return ''
  return await new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => resolve('')
    reader.readAsDataURL(rec.blob)
  })
}

// 收藏/导出等需要持久化场景：blob 引用转 data URL，否则保持原样
async function resolveWechatImageForPersistence(src) {
  if (isWechatBlobRef(src)) return await resolveWechatBlobDataURL(src)
  return src || ''
}

function bindWechatBlobImageRecovery(img) {
  if (!img || img.dataset.blobErrorBound === '1') return
  img.dataset.blobErrorBound = '1'
  img.addEventListener('error', () => {
    hydrateWechatBlobImage(img, { force: true, fromError: true })
  })
  img.addEventListener('load', () => {
    img.dataset.blobRecoverAttempts = '0'
  })
}

async function hydrateWechatBlobImage(img, options = {}) {
  if (!img) return
  bindWechatBlobImageRecovery(img)
  const ref = img.dataset.blobRef
  if (!isWechatBlobRef(ref)) return
  if (img.dataset.blobHydrating === '1') return

  const currentSrc = img.getAttribute('src') || ''
  const hasBrokenSrc = !!currentSrc && img.complete && img.naturalWidth === 0
  if (currentSrc && !options.force && !hasBrokenSrc) {
    if (!img.dataset.src) img.dataset.src = currentSrc
    return
  }

  const attempts = parseInt(img.dataset.blobRecoverAttempts || '0', 10)
  if (options.fromError && attempts >= 2) return
  if (options.fromError) img.dataset.blobRecoverAttempts = String(attempts + 1)

  img.dataset.blobHydrating = '1'
  try {
    const url = await resolveWechatBlobUrl(ref, { force: !!options.force || hasBrokenSrc })
    if (!url || !img.isConnected) return
    img.src = url
    img.dataset.src = url   // 供查看大图弹窗使用
    if (!options.fromError) img.dataset.blobRecoverAttempts = '0'
  } finally {
    delete img.dataset.blobHydrating
  }
}

// 渲染后异步填充 blob 图片的 src；若缓存的 objectURL 已失效，则自动重建。
async function hydrateWechatBlobImages(root, options = {}) {
  const scope = root || document
  const imgs = scope.querySelectorAll('img.msg-real-photo[data-blob-ref]')
  const batchSize = Math.max(1, parseInt(options.batchSize, 10) || WECHAT_BLOB_HYDRATE_BATCH_SIZE)
  for (let i = 0; i < imgs.length; i++) {
    if (scope !== document && !scope.isConnected) break
    hydrateWechatBlobImage(imgs[i], options)
    if ((i + 1) % batchSize === 0) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }
}
window.hydrateWechatBlobImages = hydrateWechatBlobImages

function renderRealPhotoBubble(data, msg) {
  const src = data?.src || ''
  const desc = normalizeImageSupplementDesc(msg?.imageDesc)
  const ownerUid = msg?.ownerUid || _wechatUid || ''
  const charId = msg?.charId || ''
  const role = msg?.role || ''
  const common = `class="msg-real-photo" onclick="showMomentImageViewModal(this.dataset.src, this.dataset.desc, { ownerUid: this.dataset.ownerUid, charId: this.dataset.charId, role: this.dataset.role })" data-desc="${wcEscHtml(desc)}" data-owner-uid="${wcEscHtml(ownerUid)}" data-char-id="${wcEscHtml(charId)}" data-role="${wcEscHtml(role)}" alt="图片"`
  if (isWechatBlobRef(src)) {
    // 命中缓存则直接带 src（瞬时、无闪烁）；未命中则留空，靠 CSS 灰色占位，渲染后异步填充
    const cached = getWechatBlobUrlCached(src)
    const srcAttr = cached ? ` src="${wcEscHtml(cached)}"` : ''
    return `<img${srcAttr} data-blob-ref="${wcEscHtml(src)}" data-src="${wcEscHtml(cached)}" ${common}>`
  }
  // data: / http(s): 直接渲染，去掉 loading="lazy"（本地数据无需懒加载）
  return `<img src="${wcEscHtml(src)}" data-src="${wcEscHtml(src)}" ${common}>`
}

function extractPhotoPromptFromContent(content) {
  const m = String(content || '').trim().match(/^\[.+发来的照片：([\s\S]+)\]$/)
  return m ? m[1].trim() : ''
}

async function isImageGenReady() {
  if (typeof loadImageGenConfig !== 'function') return false
  const cfg = await loadImageGenConfig()
  return !!(cfg.url && cfg.key && cfg.model)
}

async function buildEnhancedImagePrompt(rawDesc, chatId) {
  const raw = String(rawDesc || '').trim()
  const shotMatch = raw.match(/\[SHOT:(\w+)(?:\|who=([^\]]+))?\]/i)
  const shotType = shotMatch ? shotMatch[1].toUpperCase() : 'ACTION'
  const cleanDesc = raw.replace(/\[SHOT:[^\]]+\]\s*/i, '').trim()
  const imageGenSettings = await getChatImageGenSettings(chatId)
  const parts = []

  if (imageGenSettings.charImagePrompt && ['PORTRAIT', 'ACTION', 'PAIR', 'GROUP'].includes(shotType)) {
    parts.push(`Character: ${imageGenSettings.charImagePrompt}.`)
  }
  if (cleanDesc) parts.push(cleanDesc)
  return parts.join(' ').trim()
}

async function maybeGenerateImage(msg, chatId) {
  const rawDesc = extractPhotoPromptFromContent(msg?.content)
  if (!rawDesc) return false
  const imageGenSettings = await getChatImageGenSettings(chatId)
  if (!imageGenSettings.enabled || typeof loadImageGenConfig !== 'function' || typeof generateImageWithConfig !== 'function') return false
  const cfg = await loadImageGenConfig()
  if (!cfg.url || !cfg.key || !cfg.model) return false

  try {
    const prompt = await buildEnhancedImagePrompt(rawDesc, chatId)
    if (!prompt) return false
    const imageResult = await generateImageWithConfig(cfg, prompt, {
      referenceImage: imageGenSettings.charReferenceImage || ''
    })
    if (!imageResult) return false
    const blobRef = await storeGeneratedImageResult(imageResult, cfg)
    try {
      await updatePrivateMessageIdempotently(msg.id, {
        content: '__IMG__' + blobRef,
        imageDesc: rawDesc
      })
    } catch (e) {
      const orphanId = wechatBlobRefId(blobRef)
      if (orphanId != null) {
        try { await db.imageBlobs.delete(orphanId) } catch (_) {}
      }
      throw e
    }
    const cw = _getVisibleChatWindow('chat', chatId)
    // force：消息类型从占位照片卡变为 real-photo，需整体重渲染才能换上生成的图片
    if (cw) await refreshChat(cw, { force: true, scrollToBottom: true })
    return true
  } catch (e) {
    console.warn('[ImageGen] failed, keeping placeholder:', e)
    window.toast?.('照片生成失败：' + (e.message || '请检查 IMAGE 图像配置'))
    return false
  }
}

function getPhotoPlaceholderSrc(msg) {
  const raw = String(msg?.id || msg?.createdAt || msg?.content || '')
  let seed = 0
  for (let i = 0; i < raw.length; i++) seed = ((seed * 31) + raw.charCodeAt(i)) >>> 0
  const index = (seed % 6) + 1
  return `img/blank_img${index}.jpg`
}

// 转账卡片
function renderTransferCard(data, msg, isSelf, charName, myName) {
  const status = msg?.cardStatus || 'pending'
  const titleMap = { pending: 'Transfer', accepted: 'Accepted', declined: 'Rejected' }
  const title = titleMap[status] || 'Transfer'
  const noteRaw = (data.note || '').trim()
  const noteText = (!noteRaw || noteRaw === '无备注')
    ? `转账`
    : noteRaw
  return `
    <div class="msg-card transfer-card card-${isSelf ? 'self' : 'other'}" data-msg-id="${msg.id}" data-status="${status}" onclick="showTransferDetailModal(${msg.id})">
      <div class="transfer-body">
        <div class="transfer-title status-${status}">${title}</div>
        <div class="transfer-amount">¥ ${wcEscHtml(data.amount)}</div>
        <div class="transfer-note">${wcEscHtml(noteText)}</div>
        <i class="fi fi-brands-visa transfer-visa"></i>
      </div>
    </div>`
}

window.showTransferDetailModal = async function(msgId) {
  const msg = await db.messages.get(msgId)
  if (!msg) return
  const parsed = parseMsgType(msg.content, '')
  if (parsed.type !== 'transfer-recv') return

  const status = msg.cardStatus || 'pending'
  const isSelf = msg.role === 'user'
  const noteRaw = (parsed.data.note || '').trim()
  const noteText = (!noteRaw || noteRaw === '无备注') ? '转账' : noteRaw
  const statusMap = {
    pending: isSelf ? '待对方收款' : '待收款',
    accepted: isSelf ? '对方已接收' : '已接收转账',
    declined: isSelf ? '对方已退回' : '已退回转账'
  }
  const canRespond = !isSelf && status === 'pending'
  const actionsHtml = canRespond ? `
    <div class="transfer-modal-actions">
      <button class="transfer-modal-btn transfer-modal-btn-decline" id="transfer-modal-decline">退回</button>
      <button class="transfer-modal-btn transfer-modal-btn-accept" id="transfer-modal-accept">接收</button>
    </div>` : ''

  const sheet = wcMakeSheet(`
    <div class="sheet-title transfer-modal-title">微信转账</div>
    <div class="transfer-modal-body">
      <div class="transfer-modal-amount">¥ ${wcEscHtml(parsed.data.amount)}</div>
      <div class="transfer-modal-status">${wcEscHtml(statusMap[status] || '转账')}</div>
      <div class="transfer-modal-note">
        <div class="transfer-modal-note-label">备注</div>
        <div class="transfer-modal-note-text">${wcEscHtml(noteText)}</div>
      </div>
    </div>
    ${actionsHtml}
  `)
  const overlay = wcAttachSheet(sheet)
  const close = () => closeWcSheetCore(overlay, sheet)
  overlay.addEventListener('click', close)

  if (canRespond) {
    sheet.querySelector('#transfer-modal-accept').addEventListener('click', async () => {
      const ok = await respondTransfer(msgId, true)
      if (ok !== false) close()
    })
    sheet.querySelector('#transfer-modal-decline').addEventListener('click', async () => {
      await respondTransfer(msgId, false)
      close()
    })
  }
}


// 转账回应（系统提示）
// isSelf=true：用户对 AI 转账的回应（respondTransfer 已直接更新 AI 卡片，这里仅展示文案）
// isSelf=false：AI 对用户转账的回应（联动更新用户已发出的转账卡）
function renderTransferResp(data, msg, isSelf) {
  const label = isSelf
    ? (data.accepted ? '你已接收转账' : '你已退回转账')
    : (data.accepted ? '对方已接收' : '对方已退回')
  if (!isSelf) {
    setTimeout(() => updateSentTransferStatus(msg.chatId, data.accepted), 100)
  }
  return `<div class="wc-system-tip">${label}</div>`
}

// ===== 淘宝代付/赠送 卡片 =====
function tbDealStatusTitle(dealType, status) {
  if (dealType === 'gift') {
    return ({ pending: '淘宝赠送', accepted: '已收下', returned: '已退回' })[status] || '淘宝赠送'
  }
  return ({ pending: '淘宝代付', paid: '已代付', rejected: '已拒绝' })[status] || '淘宝代付'
}

function renderTbDealCard(data, msg, isSelf, charName, myName) {
  const deal = normalizeTbDealPayload(data)
  const status = msg?.cardStatus || 'pending'
  const title = tbDealStatusTitle(deal.dealType, status)
  const icon = deal.dealType === 'gift' ? 'fa-gift' : 'fa-receipt'
  const desc = deal.items.length > 1
    ? `${deal.items[0].title} 等${deal.items.length}件`
    : (deal.items[0]?.title || deal.title)
  return `
    <div class="msg-card tb-deal-card tb-deal-${deal.dealType} card-${isSelf ? 'self' : 'other'}" data-msg-id="${msg.id}" data-status="${status}" onclick="showTbDealDetail(${msg.id})">
      <div class="tb-deal-body">
        <div class="tb-deal-head">
          <i class="fa-solid ${icon} tb-deal-icon"></i>
          <span class="tb-deal-title status-${status}">${wcEscHtml(title)}</span>
        </div>
        <div class="tb-deal-amount">¥ ${wcEscHtml(tbDealMoneyText(deal.total))}</div>
        <div class="tb-deal-desc">${wcEscHtml(desc)}</div>
        <div class="tb-deal-foot">淘宝</div>
      </div>
    </div>`
}

function tbDealItemsHTML(deal) {
  if (typeof tbOrderItemsHTML === 'function') {
    try { return tbOrderItemsHTML(deal) } catch (_) {}
  }
  return deal.items.map(it => `
    <div class="tb-deal-line">
      <div class="tb-deal-line-title">${wcEscHtml(it.title)}</div>
      <div class="tb-deal-line-sub">×${it.qty}</div>
      <div class="tb-deal-line-price">¥${wcEscHtml(tbDealMoneyText(it.price * it.qty))}</div>
    </div>`).join('')
}

window.showTbDealDetail = async function(msgId) {
  const msg = await db.messages.get(msgId)
  if (!msg) return
  const parsed = parseMsgType(msg.content, '')
  if (parsed.type !== 'tb-deal') return
  const deal = normalizeTbDealPayload(parsed.data)
  const status = msg.cardStatus || 'pending'
  const isSelf = msg.role === 'user'
  const isGift = deal.dealType === 'gift'

  const statusTextMap = isGift
    ? { pending: isSelf ? '等待对方收下' : '对方赠送给你', accepted: isSelf ? '对方已收下' : '你已收下', returned: isSelf ? '对方已退回' : '你已退回' }
    : { pending: isSelf ? '等待对方付款' : '对方请你帮忙付款', paid: isSelf ? '对方已付款' : '你已付款', rejected: isSelf ? '对方已拒绝' : '你已拒绝' }

  const canRespond = !isSelf && status === 'pending'
  const actionsHtml = canRespond
    ? (isGift
        ? `<div class="tb-deal-modal-actions">
             <button class="tb-deal-modal-btn tb-deal-modal-btn-neg" id="tb-deal-return">退回</button>
             <button class="tb-deal-modal-btn tb-deal-modal-btn-pos" id="tb-deal-accept">接收</button>
           </div>`
        : `<div class="tb-deal-modal-actions">
             <button class="tb-deal-modal-btn tb-deal-modal-btn-neg" id="tb-deal-reject">拒绝</button>
             <button class="tb-deal-modal-btn tb-deal-modal-btn-pos" id="tb-deal-pay">付款</button>
           </div>`)
    : ''

  const sheet = wcMakeSheet(`
    <div class="sheet-title tb-deal-modal-title"><i class="fa-solid ${isGift ? 'fa-gift' : 'fa-receipt'}"></i> ${isGift ? '淘宝赠送' : '淘宝代付'}</div>
    <div class="tb-deal-modal-body">
      <div class="tb-deal-modal-amount">¥ ${wcEscHtml(tbDealMoneyText(deal.total))}</div>
      <div class="tb-deal-modal-status">${wcEscHtml(statusTextMap[status] || '淘宝订单')}</div>
      <div class="tb-deal-modal-list">${tbDealItemsHTML(deal)}</div>
    </div>
    ${actionsHtml}
  `)
  const overlay = wcAttachSheet(sheet)
  const close = () => closeWcSheetCore(overlay, sheet)
  overlay.addEventListener('click', close)

  if (canRespond) {
    const bind = (id, action) => {
      const btn = sheet.querySelector('#' + id)
      if (btn) btn.addEventListener('click', async () => {
        const ok = await respondTbDeal(msgId, action)
        if (ok !== false) close()
      })
    }
    if (isGift) { bind('tb-deal-accept', 'accept'); bind('tb-deal-return', 'return') }
    else { bind('tb-deal-pay', 'pay'); bind('tb-deal-reject', 'reject') }
  }
}

// 淘宝代付/赠送 回应（系统提示）
function renderTbDealResp(data, msg, isSelf) {
  const map = {
    paid: isSelf ? '你已帮对方付款' : '对方已帮你付款',
    rejected: isSelf ? '你已拒绝代付' : '对方已拒绝代付',
    accepted: isSelf ? '你已收下礼物' : '对方已收下礼物',
    returned: isSelf ? '你已退回礼物' : '对方已退回礼物'
  }
  if (!isSelf) {
    setTimeout(() => updateSentTbDealStatus(msg.chatId, data.dealType, data.result), 100)
  }
  return `<div class="wc-system-tip">${map[data.result] || '淘宝'}</div>`
}

// ===== YumYum 外卖订单卡片 渲染/详情/回应 =====
function yumDealStatusText(deal, status, isSelf) {
  const isGift = deal.dealType === 'gift'
  if (isGift) {
    if (status === 'accepted') return isSelf ? '对方已收下' : '你已收下'
    if (status === 'returned') return isSelf ? '对方已退回' : '你已退回'
    // 赠送一开始就有时间线 → 显示配送状态
    if (yumDealHasTimeline(deal)) return yumDealOrderStatus(deal).label
    return isSelf ? '已送出' : '对方请你吃外卖'
  }
  if (status === 'paid') return yumDealHasTimeline(deal) ? yumDealOrderStatus(deal).label : '已付款'
  if (status === 'rejected') return isSelf ? '对方已拒绝' : '你已拒绝'
  return isSelf ? '等待对方付款' : '对方请你帮忙付款'
}

function renderYumDealCard(data, msg, isSelf, charName, myName) {
  const deal = normalizeYumDealPayload(data)
  const status = msg?.cardStatus || (deal.dealType === 'gift' ? 'gift' : 'pending')
  const isGift = deal.dealType === 'gift'
  const showOrder = yumDealHasTimeline(deal)
  const st = showOrder ? yumDealOrderStatus(deal) : null
  const stepState = st ? st.state : 'pending'
  const statusText = yumDealStatusText(deal, status, isSelf)
  const badge = isGift ? '赠送' : '代付'

  const itemsHtml = deal.items.slice(0, 3).map(it => `
    <div class="yum-deal-line">
      <div class="yum-deal-line-ic tone-${wcEscHtml(it.tone)}"><i class="fa-solid ${wcEscHtml(it.icon)}"></i></div>
      <div class="yum-deal-line-name">${wcEscHtml(it.name)}</div>
      <div class="yum-deal-line-qty">×${it.qty}</div>
      <div class="yum-deal-line-price">¥${wcEscHtml(yumDealMoneyText(it.price * it.qty))}</div>
    </div>`).join('')
  const moreHtml = deal.items.length > 3
    ? `<div class="yum-deal-more">等${deal.items.length}件商品</div>` : ''

  const deliveryStatusHtml = showOrder
    ? `<div class="yum-deal-delivery"><i class="fa-solid fa-clock"></i> ${wcEscHtml(yumDealEtaText(deal))}</div>`
    : ''

  const addr = deal.address || {}
  const recipientText = [addr.name, addr.phone].filter(Boolean).join(' ')
  const addressInfoHtml = (recipientText || addr.detail)
    ? `<div class="yum-deal-address">
         ${recipientText ? `<div class="yum-deal-address-row"><span>收件人</span><b>${wcEscHtml(recipientText)}</b></div>` : ''}
         ${addr.detail ? `<div class="yum-deal-address-row"><span>地址</span><b>${wcEscHtml(addr.detail)}</b></div>` : ''}
       </div>`
    : ''
  const orderNoHtml = showOrder
    ? `<div class="yum-deal-address-row yum-deal-no"><span>订单号</span><b>${wcEscHtml(String(deal.orderId))}</b></div>`
    : ''
  const orderMetaHtml = (addressInfoHtml || orderNoHtml)
    ? `<div class="yum-deal-meta">${addressInfoHtml}${orderNoHtml}</div>`
    : ''

  return `
    <div class="msg-card yum-deal-card yum-deal-${deal.dealType} yum-deal-state-${stepState} card-${isSelf ? 'self' : 'other'}" data-msg-id="${msg.id}" data-status="${status}" onclick="showYumDealDetail(${msg.id})">
      <div class="yum-deal-top">
        <div class="yum-deal-shop">
          <span class="yum-deal-shop-ic tone-${wcEscHtml(deal.shopTone)}"><i class="fa-solid ${wcEscHtml(deal.shopIcon)}"></i></span>
          <span class="yum-deal-shop-name">${wcEscHtml(deal.shopName || deal.title)}</span>
        </div>
        <span class="yum-deal-badge">${badge}</span>
      </div>
      ${deliveryStatusHtml}
      <div class="yum-deal-items">${itemsHtml}${moreHtml}</div>
      <div class="yum-deal-bottom">
        <span class="yum-deal-status status-${stepState}">${wcEscHtml(statusText)}</span>
        <span class="yum-deal-total">合计 <strong>¥${wcEscHtml(yumDealMoneyText(deal.total))}</strong></span>
      </div>
      ${orderMetaHtml}
      <div class="yum-deal-foot">YumYum 外卖<i class="fa-solid fa-angle-right yum-deal-foot-arrow"></i></div>
    </div>`
}

function yumDealItemsHTML(deal) {
  return deal.items.map(it => `
    <div class="yum-deal-modal-line">
      <div class="yum-deal-line-ic tone-${wcEscHtml(it.tone)}"><i class="fa-solid ${wcEscHtml(it.icon)}"></i></div>
      <div class="yum-deal-modal-line-name">${wcEscHtml(it.name)}</div>
      <div class="yum-deal-modal-line-qty">×${it.qty}</div>
      <div class="yum-deal-modal-line-price">¥${wcEscHtml(yumDealMoneyText(it.price * it.qty))}</div>
    </div>`).join('')
}

window.showYumDealDetail = async function(msgId) {
  const msg = await db.messages.get(msgId)
  if (!msg) return
  const parsed = parseMsgType(msg.content, '')
  if (parsed.type !== 'yum-deal') return
  const deal = normalizeYumDealPayload(parsed.data)
  const status = msg.cardStatus || (deal.dealType === 'gift' ? 'gift' : 'pending')
  const isSelf = msg.role === 'user'
  const isGift = deal.dealType === 'gift'
  const showOrder = yumDealHasTimeline(deal)
  const statusText = yumDealStatusText(deal, status, isSelf)

  const canRespond = !isSelf && (isGift ? (status !== 'accepted' && status !== 'returned') : status === 'pending')
  const actionsHtml = canRespond
    ? (isGift
        ? `<div class="yum-deal-modal-actions">
             <button class="yum-deal-modal-btn yum-deal-modal-btn-neg" id="yum-deal-return">退回</button>
             <button class="yum-deal-modal-btn yum-deal-modal-btn-pos" id="yum-deal-accept">收下</button>
           </div>`
        : `<div class="yum-deal-modal-actions">
             <button class="yum-deal-modal-btn yum-deal-modal-btn-neg" id="yum-deal-reject">拒绝</button>
             <button class="yum-deal-modal-btn yum-deal-modal-btn-pos" id="yum-deal-pay">付款</button>
           </div>`)
    : ''

  const addr = deal.address
  const addrHtml = addr && addr.detail
    ? `<div class="yum-deal-modal-addr"><i class="fa-solid fa-location-dot"></i> ${wcEscHtml(addr.detail)} · ${wcEscHtml(addr.name || '')}</div>`
    : ''
  const orderHtml = showOrder
    ? `<div class="yum-deal-modal-order">
         <div class="yum-deal-modal-order-row"><span>订单状态</span><b>${wcEscHtml(yumDealOrderStatus(deal).label)}</b></div>
         <div class="yum-deal-modal-order-row"><span>${wcEscHtml(yumDealEtaText(deal))}</span></div>
         <div class="yum-deal-modal-order-row"><span>订单号</span><b>${wcEscHtml(String(deal.orderId).replace('yum_order_', ''))}</b></div>
       </div>`
    : ''

  const sheet = wcMakeSheet(`
    <div class="sheet-title yum-deal-modal-title"><i class="fa-solid ${isGift ? 'fa-gift' : 'fa-bowl-food'}"></i> ${isGift ? 'YumYum 赠送' : 'YumYum 代付'}</div>
    <div class="yum-deal-modal-body">
      <div class="yum-deal-modal-shop">${wcEscHtml(deal.shopName || deal.title)}</div>
      <div class="yum-deal-modal-amount">¥ ${wcEscHtml(yumDealMoneyText(deal.total))}</div>
      <div class="yum-deal-modal-status">${wcEscHtml(statusText)}</div>
      <div class="yum-deal-modal-list">${yumDealItemsHTML(deal)}</div>
      ${addrHtml}
      ${orderHtml}
    </div>
    ${actionsHtml}
  `)
  const overlay = wcAttachSheet(sheet)
  const close = () => closeWcSheetCore(overlay, sheet)
  overlay.addEventListener('click', close)

  if (canRespond) {
    const bind = (id, action) => {
      const btn = sheet.querySelector('#' + id)
      if (btn) btn.addEventListener('click', async () => {
        btn.disabled = true
        const ok = await respondYumDeal(msgId, action)
        btn.disabled = false
        if (ok !== false) close()
      })
    }
    if (isGift) { bind('yum-deal-accept', 'accept'); bind('yum-deal-return', 'return') }
    else { bind('yum-deal-pay', 'pay'); bind('yum-deal-reject', 'reject') }
  }
}

// YumYum 代付/赠送 回应（系统提示）
function renderYumDealResp(data, msg, isSelf) {
  const map = {
    paid: isSelf ? '你已帮对方付款' : '对方已帮你付款',
    rejected: isSelf ? '你已拒绝代付' : '对方已拒绝代付',
    accepted: isSelf ? '你已收下外卖' : '对方已收下外卖',
    returned: isSelf ? '你已退回外卖' : '对方已退回外卖'
  }
  if (!isSelf) {
    setTimeout(() => updateSentYumDealStatus(msg.chatId, data.dealType, data.result), 100)
  }
  return `<div class="wc-system-tip">${map[data.result] || 'YumYum'}</div>`
}

// 引用回复气泡
function renderQuoteBubble(data, cls, fallbackName, msg) {
  const quoteName = data.speaker || fallbackName || '我'
  const quoteTime = msg?.createdAt ? formatWechatClockTime(msg.createdAt) : ''
  const timeHtml = quoteTime ? `<span class="quote-ref-time">${wcEscHtml(quoteTime)}</span>` : ''
  const quotedPreview = getWechatQuotedContentDisplayPreview(data.quoted)
  return `<div class="msg-bubble bubble-${cls}">${wcEscHtml(data.reply)}</div><div class="quote-ref quote-ref-${cls}"><div class="quote-ref-clamp"><span class="quote-ref-name">${wcEscHtml(quoteName)}：</span>${timeHtml}<span class="quote-ref-text">${wcEscHtml(quotedPreview)}</span></div></div>`
}

// 撤回消息行
function renderRecallRow(data, charName) {
  const actorName = data.actor || charName
  return `
    <div class="msg-recall-row" onclick="showRecalledContent('${wcEscHtml(data.recalled).replace(/'/g, '&#39;')}')">
      <span class="recall-tip">${wcEscHtml(actorName)} 撤回了一条消息</span>
      <span class="recall-view">查看</span>
    </div>`
}

// 位置卡片
function renderLocationCard(data, cls) {
  const distHtml = data.dist ? `<div class="location-dist">距你约 ${wcEscHtml(data.dist)}</div>` : ''
  return `
    <div class="msg-card location-card card-${cls}">
      <div class="location-header"><i class="fa-solid fa-location-dot"></i> 位置</div>
      <div class="location-place">${wcEscHtml(data.place)}</div>
      ${distHtml}
    </div>`
}

function renderLinkCard(data, cls) {
  const link = normalizeLinkPayload(data)
  const title = link.title || link.siteName || '链接'
  const showSite = link.siteName && link.siteName !== title
  const isTaobaoInternal = /^wanwan:\/\/taobao\/(gift|pay)\//.test(link.url || '')
  const commentSummary = buildLinkCommentSummary(link.comments)
  const statusClass = link.summary || commentSummary ? 'is-loaded' : (link.parseStatus === 'failed' ? 'is-unavailable' : 'is-pending')
  const summaryHtml = link.summary
    ? `<div class="link-card-summary">${wcEscHtml(link.summary)}</div>`
    : ''
  const commentsHtml = commentSummary
    ? `<div class="link-card-summary link-card-comments">${wcEscHtml('评论区：' + commentSummary)}</div>`
    : ''
  const fallbackHtml = !summaryHtml && !commentsHtml
    ? `<div class="link-card-summary">${wcEscHtml(link.parseStatus === 'failed' ? '链接内容因网络问题无法显示' : '链接内容等待对方查看')}</div>`
    : ''
  return `
    <div class="msg-card link-card card-${cls} ${statusClass}${isTaobaoInternal ? ' link-card-taobao' : ''}" ${isTaobaoInternal ? `data-taobao-url="${wcEscHtml(link.url)}"` : ''}>
      <div class="link-card-icon"><i class="fa-solid fa-link"></i></div>
      <div class="link-card-main">
        ${showSite ? `<div class="link-card-site">${wcEscHtml(link.siteName)}</div>` : ''}
        <div class="link-card-title">${wcEscHtml(title)}</div>
        <div class="link-card-url">${wcEscHtml(link.url)}</div>
        ${summaryHtml}
        ${commentsHtml}
        ${fallbackHtml}
      </div>
    </div>`
}

function renderCallRecordBubble(data, cls) {
  const isVideo = data.callType === '视频通话'
  const iconClass = isVideo ? 'fa-video' : 'fa-phone'
  return `
    <div class="msg-bubble bubble-${cls} call-record-bubble">
      <i class="fa-solid ${iconClass} chat-call-record-icon" aria-hidden="true"></i>
      <span class="call-record-text">${wcEscHtml(data.callType)} ${wcEscHtml(data.duration)}</span>
    </div>`
}

// 表情包：优先消息上的 stickerImage；其次按名字在挂载库中查找；都没有则占位
function renderStickerBubble(data, isSelf, msg, stickerMap) {
  const name = data.name || ''
  const image = msg?.stickerImage || (stickerMap && stickerMap[name]) || ''
  if (image) {
    return `
      <div class="msg-sticker ${isSelf ? 'sticker-self' : ''}">
        <img src="${image}" class="sticker-img" alt="${wcEscHtml(name)}" loading="lazy">
      </div>`
  }
  return `
    <div class="msg-sticker ${isSelf ? 'sticker-self' : ''}">
      <div class="sticker-box">
        <i class="fa fa-smile-o sticker-icon"></i>
        <span class="sticker-name">${wcEscHtml(name)}</span>
      </div>
    </div>`
}


// ===== 私聊窗口 =====
async function openPrivateChat(wechatPage, charId, chatId) {
  let char = null
  let chat = null
  const stageMeta = { chatId: chatId || null, charId: charId || null }
  try {
    char = await getWechatDisplayCharacter(charId)
    if (!char) return
    stageMeta.charId = char.id || charId || null
  } catch (error) {
    logWechatChatOpenIssue('resolveCharacter', error, stageMeta)
    window.toast?.('聊天打开失败，请重试')
    return
  }

  try {
    if (chatId) chat = await db.chats.get(chatId)
    if (!chat && _wechatUid) chat = await ensurePrivateChatRecord(charId)
    if (!chat?.id) throw new Error('聊天记录不存在')
    stageMeta.chatId = chat.id
  } catch (error) {
    logWechatChatOpenIssue('resolveChat', error, stageMeta)
    window.toast?.('聊天打开失败，请重试')
    return
  }

  let chatPage = null
  try {
    removeCurrentChatWindowForPopup()
    chatPage = buildChatWindow(char, chat.id)
    window.openPage(chatPage)
  } catch (error) {
    logWechatChatOpenIssue('openShell', error, stageMeta)
    window.toast?.('聊天打开失败，请重试')
    return
  }

  db.chats.update(chat.id, { unread: 0 }).catch(error => {
    logWechatChatOpenIssue('markRead', error, stageMeta)
  })

  ;(async () => {
    await waitNextFrame()
    if (!isPrivateChatPageCurrent(chatPage, chat.id)) return
    try {
      await loadChatMessages(chatPage, chat.id, { initialScrollToBottom: true })
    } catch (error) {
      logWechatChatOpenIssue('loadChatMessages', error, stageMeta)
      const container = chatPage?.querySelector('#chat-messages')
      if (container) container.innerHTML = '<div class="chat-empty">聊天内容加载失败，请返回后重试</div>'
      return
    }
    await waitNextFrame()
    if (!isPrivateChatPageCurrent(chatPage, chat.id)) return
    await enhanceVisibleChat(chatPage, chat.id, char.id)
  })().catch(error => {
    logWechatChatOpenIssue('postOpenPrivateChat', error, stageMeta)
  })
}

function normalizeChatAppearance(value) {
  return {
    avatarSize: parseInt(value?.avatarSize || 34, 10) || 34,
    avatarRadius: parseInt(value?.avatarRadius || 4, 10) || 4,
    backgroundImage: String(value?.backgroundImage || '').trim(),
    hideSelfAvatar: !!value?.hideSelfAvatar,
    hideOtherAvatar: !!value?.hideOtherAvatar
  }
}

function applyChatAppearanceValue(chatPage, value) {
  if (!chatPage || !document.body.contains(chatPage)) return
  const appearance = normalizeChatAppearance(value)
  chatPage.style.setProperty('--avatar-size', appearance.avatarSize + 'px')
  chatPage.style.setProperty('--avatar-radius', appearance.avatarRadius + 'px')
  chatPage.style.setProperty('--chat-bg-image', appearance.backgroundImage ? `url(${JSON.stringify(appearance.backgroundImage)})` : 'none')
  chatPage.classList.toggle('hide-self-avatar', appearance.hideSelfAvatar)
  chatPage.classList.toggle('hide-other-avatar', appearance.hideOtherAvatar)
}

// 读取并应用每会话的外观设置（头像尺寸/圆角/背景/头像显示）
async function applyChatAppearance(chatPage, chatId) {
  const stored = await db.config.get(`chatAppearance_${chatId}`)
  applyChatAppearanceValue(chatPage, stored?.value)
}

// 构建聊天窗口DOM
function buildChatWindow(char, chatId) {
  const page = document.createElement('div')
  page.id = 'chat-window'
  page.className = 'full-page chat-window-page private-chat-window'
  page.dataset.chatId = chatId
  page.dataset.charId = char.id
  page.innerHTML = buildChatWindowHTML(char)
  if (isWechatRolePhoneMode()) {
    page.classList.add('wechat-role-phone-page')
    page.dataset.wechatRolePhone = '1'
  } else {
    page.classList.remove('wechat-role-phone-page')
    delete page.dataset.wechatRolePhone
  }
  if (char.type === 'online_friend') {
    page.classList.add('online-chat-window')
  } else {
    page.classList.remove('online-chat-window')
  }
  const aiBtn = page.querySelector('#btn-chat-reply')
  if (aiBtn) aiBtn.style.display = char.type === 'online_friend' ? 'none' : ''
  // 角色手机模式：不提供聊天设置
  if (isWechatRolePhoneMode()) {
    page.querySelector('#btn-chat-settings')?.remove()
  }
  const messagesEl = page.querySelector('#chat-messages')
  if (messagesEl) messagesEl.innerHTML = '<div class="chat-empty">正在打开聊天…</div>'
  bindChatWindowEvents(page)
  return page
}

function isPrivateChatPageCurrent(page, chatId) {
  if (!page || !page.isConnected) return false
  if (document.getElementById('chat-window') !== page) return false
  return parseInt(page.dataset.chatId) === parseInt(chatId)
}

// 聊天窗口HTML
function buildChatWindowHTML(char) {
  const statusText = wcEscHtml(getCharacterStatusText(char))
  return `
    <div class="page-header chat-header">
      <div class="chat-header-body">
        <button class="header-back" onclick="window.closeWechatChatWindow()">
          <i class="fa fa-angle-left"></i>
        </button>
        <div class="chat-header-info has-status">
          <span class="chat-header-name wechat-pat-target" title="双击拍一拍">${wcEscHtml(getWechatDisplayName(char))}</span>
          <span class="chat-header-status" aria-hidden="false"><span class="chat-status-dot"></span><span class="chat-status-text">${statusText}</span></span>
        </div>
        <button class="btn-icon" id="btn-chat-settings"><i class="fa fa-ellipsis-h"></i></button>
      </div>
    </div>
    <div class="chat-messages" id="chat-messages"></div>
    ${buildChatInputBarHTML()}
    ${buildPlusPanelHTML()}
    ${buildEmojiPanelHTML()}
  `
}

async function getChatStatusDisplayConfig(chatId) {
  const stored = await db.config.get(`chatStatusDisplay_${chatId}`)
  return stored?.value || { enabled: false }
}

function normalizeThoughtTemplateConfig(value) {
  return {
    enabled: !!value?.enabled,
    promptSuffix: String(value?.promptSuffix || ''),
    regexPattern: String(value?.regexPattern || ''),
    replacePattern: String(value?.replacePattern || '')
  }
}

function getDefaultThoughtTemplateConfig(charName) {
  return {
    enabled: true,
    promptSuffix: '',
    regexPattern: '^([\\s\\S]+)$',
    replacePattern:
      '<div class="thought-card">' +
        '<div class="thought-card-top">' +
          '<div class="thought-card-avatar">{charAvatar}</div>' +
          '<div class="thought-card-label">{charName}的心声</div>' +
        '</div>' +
        '<div class="thought-card-divider"></div>' +
        '<div class="thought-card-body">$1</div>' +
      '</div>',
    isDefault: true,
    charName: charName || '角色'
  }
}

function getEffectiveThoughtTemplateConfig(templateConfig, charName) {
  const cfg = normalizeThoughtTemplateConfig(templateConfig)
  if (cfg.enabled && cfg.regexPattern && cfg.replacePattern) {
    return Object.assign(cfg, { charName: charName || '角色' })
  }
  return getDefaultThoughtTemplateConfig(charName)
}

async function getChatThoughtTemplateConfig(chatId) {
  const stored = await db.config.get(`chatThoughtTemplate_${chatId}`)
  const raw = stored?.value || {}
  const enabledVal = stored ? !!raw.enabled : true
  if (raw.presetId) {
    const presets = await getThoughtPresets()
    const preset = presets.find(p => p.id === raw.presetId)
    if (preset) {
      return normalizeThoughtTemplateConfig({
        enabled: enabledVal,
        promptSuffix: preset.promptSuffix,
        regexPattern: preset.regexPattern,
        replacePattern: preset.replacePattern
      })
    }
  }
  return normalizeThoughtTemplateConfig({ ...raw, enabled: enabledVal })
}

async function getThoughtPresets() {
  const stored = await db.config.get('thoughtPresets')
  return Array.isArray(stored?.value) ? stored.value : []
}

async function saveThoughtPresets(presets) {
  await db.config.put({ key: 'thoughtPresets', value: presets })
}

async function addThoughtPreset({ name, promptSuffix, regexPattern, replacePattern }) {
  const presets = await getThoughtPresets()
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const now = Date.now()
  presets.push({ id, name, promptSuffix, regexPattern, replacePattern, createdAt: now, updatedAt: now })
  await saveThoughtPresets(presets)
  return id
}

async function updateThoughtPreset(id, updates) {
  const presets = await getThoughtPresets()
  const idx = presets.findIndex(p => p.id === id)
  if (idx === -1) return false
  Object.assign(presets[idx], updates, { updatedAt: Date.now() })
  await saveThoughtPresets(presets)
  return true
}

async function deleteThoughtPreset(id) {
  const presets = await getThoughtPresets()
  await saveThoughtPresets(presets.filter(p => p.id !== id))
}

async function getChatBeautyPresets() {
  const stored = await db.config.get('chatBeautyPresets')
  return Array.isArray(stored?.value) ? stored.value : []
}

function sanitizeChatBeautyPreset(preset) {
  return {
    id: preset.id,
    name: preset.name || '',
    css: preset.css || '',
    createdAt: preset.createdAt,
    updatedAt: preset.updatedAt
  }
}

async function saveChatBeautyPresets(presets) {
  await db.config.put({ key: 'chatBeautyPresets', value: presets.map(sanitizeChatBeautyPreset) })
}

async function addChatBeautyPreset({ name, css }) {
  const presets = await getChatBeautyPresets()
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const now = Date.now()
  presets.push({ id, name, css, createdAt: now, updatedAt: now })
  await saveChatBeautyPresets(presets)
  return id
}

async function updateChatBeautyPreset(id, updates) {
  const presets = await getChatBeautyPresets()
  const idx = presets.findIndex(p => p.id === id)
  if (idx === -1) return false
  presets[idx] = {
    id: presets[idx].id,
    name: updates.name ?? presets[idx].name,
    css: updates.css ?? presets[idx].css,
    createdAt: presets[idx].createdAt,
    updatedAt: Date.now()
  }
  await saveChatBeautyPresets(presets)
  return true
}

async function deleteChatBeautyPreset(id) {
  const presets = await getChatBeautyPresets()
  await saveChatBeautyPresets(presets.filter(p => p.id !== id))
}

async function getChatBeautyConfig(chatId) {
  const stored = await db.config.get(`chatBeauty_${chatId}`)
  return { presetId: stored?.value?.presetId || '' }
}

function chatBeautyStyleId(chatId) {
  return `chat-beauty-style-${String(chatId).replace(/[^\w-]/g, '-')}`
}

function cssAttrEscape(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function removeChatBeautyStyle(chatId) {
  const style = document.getElementById(chatBeautyStyleId(chatId))
  if (style) style.remove()
}

function setChatBeautyThemeIsolation(chatPage, enabled) {
  if (!chatPage) return
  Object.keys(CHAT_BEAUTY_BASE_VARS).forEach(name => {
    if (enabled) chatPage.style.setProperty(name, CHAT_BEAUTY_BASE_VARS[name])
    else chatPage.style.removeProperty(name)
  })
  chatPage.style.colorScheme = enabled ? 'light' : ''
}

const chatBeautyApplyVersions = new WeakMap()

async function applyChatBeauty(chatPage, chatId) {
  if (!chatPage || !chatId) return
  const version = (chatBeautyApplyVersions.get(chatPage) || 0) + 1
  chatBeautyApplyVersions.set(chatPage, version)
  const isCurrent = () =>
    chatBeautyApplyVersions.get(chatPage) === version &&
    chatPage.isConnected &&
    String(chatPage.dataset.chatId || '') === String(chatId)

  try {
    const config = await getChatBeautyConfig(chatId)
    if (!isCurrent()) return
    const presetId = config.presetId
    let preset = null
    if (presetId) {
      const presets = await getChatBeautyPresets()
      if (!isCurrent()) return
      preset = presets.find(p => p.id === presetId) || null
    }

    if (!preset) {
      removeChatBeautyStyle(chatId)
      setChatBeautyThemeIsolation(chatPage, false)
      delete chatPage.dataset.beautyPreset
      return
    }

    const scope = `#chat-window[data-chat-id="${cssAttrEscape(chatId)}"][data-beauty-preset="${cssAttrEscape(preset.id)}"]`
    const scopedCss = preset.css ? scopeChatBeautyCss(preset.css, scope) : ''
    if (!isCurrent()) return

    const styleId = chatBeautyStyleId(chatId)
    let style = document.getElementById(styleId)
    if (scopedCss) {
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = scopedCss
    } else if (style) {
      style.remove()
    }
    chatPage.dataset.beautyPreset = preset.id
    setChatBeautyThemeIsolation(chatPage, true)
  } catch (error) {
    removeChatBeautyStyle(chatId)
    setChatBeautyThemeIsolation(chatPage, false)
    delete chatPage.dataset.beautyPreset
    console.error('[wechat-chat-beauty]', {
      chatId,
      message: error?.message || String(error || ''),
      stack: error?.stack || ''
    })
  }
}

function findMatchingBrace(text, openIndex) {
  let quote = ''
  let depth = 0
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (quote) {
      if (ch === '\\') { i++; continue }
      if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") { quote = ch; continue }
    if (ch === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2)
      if (end === -1) return -1
      i = end + 1
      continue
    }
    if (ch === '{') depth++
    if (ch === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

function splitCssSelectorList(selectorText) {
  const parts = []
  let current = ''
  let quote = ''
  let parenDepth = 0
  let bracketDepth = 0
  for (let i = 0; i < selectorText.length; i++) {
    const ch = selectorText[i]
    if (quote) {
      current += ch
      if (ch === '\\') {
        current += selectorText[++i] || ''
      } else if (ch === quote) {
        quote = ''
      }
      continue
    }
    if (ch === '"' || ch === "'") { quote = ch; current += ch; continue }
    if (ch === '(') parenDepth++
    if (ch === ')') parenDepth = Math.max(0, parenDepth - 1)
    if (ch === '[') bracketDepth++
    if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1)
    if (ch === ',' && parenDepth === 0 && bracketDepth === 0) {
      parts.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

function scopeSingleChatBeautySelector(selector, scopeSelector) {
  const trimmed = selector.trim()
  if (!trimmed) return ''
  if (/^(:root|html|body)$/i.test(trimmed)) return scopeSelector
  if (/^(:root|html|body)(?=[\s>+~.#[:])/i.test(trimmed)) {
    return trimmed.replace(/^(:root|html|body)/i, scopeSelector)
  }
  if (trimmed.startsWith(scopeSelector)) return trimmed
  return `${scopeSelector} ${trimmed}`
}

function scopeChatBeautyCss(css, scopeSelector) {
  const text = String(css || '')
  let out = ''
  let i = 0
  while (i < text.length) {
    const open = text.indexOf('{', i)
    const semicolon = text.indexOf(';', i)
    if (semicolon !== -1 && (open === -1 || semicolon < open)) {
      const atRule = text.slice(i, semicolon + 1)
      if (atRule.trim().startsWith('@')) {
        out += atRule
        i = semicolon + 1
        continue
      }
    }
    if (open === -1) {
      out += text.slice(i)
      break
    }
    const head = text.slice(i, open).trim()
    const close = findMatchingBrace(text, open)
    if (close === -1) {
      out += text.slice(i)
      break
    }
    const body = text.slice(open + 1, close)
    if (!head) {
      out += text.slice(i, close + 1)
    } else if (/^@(?:media|supports)\b/i.test(head)) {
      out += `${head}{${scopeChatBeautyCss(body, scopeSelector)}}`
    } else if (/^@(?:keyframes|-webkit-keyframes|font-face|page|property)\b/i.test(head)) {
      out += `${head}{${body}}`
    } else if (head.startsWith('@')) {
      out += `${head}{${body}}`
    } else {
      const scoped = splitCssSelectorList(head)
        .map(sel => scopeSingleChatBeautySelector(sel, scopeSelector))
        .filter(Boolean)
        .join(',\n')
      out += `${scoped}{${body}}`
    }
    i = close + 1
  }
  return out
}

function setWechatAppThemePageScope(page, tab) {
  if (!page) return
  Object.values(WECHAT_APP_THEME_ROOTS).forEach(root => page.classList.remove(root.slice(1)))
  const root = tab === 'chats'
    ? WECHAT_APP_THEME_ROOTS.messages
    : tab === 'contacts'
      ? WECHAT_APP_THEME_ROOTS.contacts
      : tab === 'discover'
        ? WECHAT_APP_THEME_ROOTS.discovery
        : tab === 'me'
          ? WECHAT_APP_THEME_ROOTS.me
          : ''
  if (root) page.classList.add(root.slice(1))
}

function getWechatAppThemeLine(text, index) {
  return String(text || '').slice(0, Math.max(0, index)).split('\n').length
}

function skipWechatAppThemeWhitespace(text, start) {
  let i = start
  while (i < text.length) {
    if (/\s/.test(text[i])) { i++; continue }
    if (text[i] === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2)
      if (end === -1) return text.length
      i = end + 2
      continue
    }
    break
  }
  return i
}

function selectorStartsWithWechatThemeRoot(selector) {
  const trimmed = selector.trim()
  return Object.values(WECHAT_APP_THEME_ROOTS).some(root => {
    const escaped = root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`^${escaped}(?=$|[\\s>+~.#:\\[])`).test(trimmed)
  })
}

function selectorEscapesWechatThemeRoot(selector) {
  const trimmed = selector.trim()
  const root = Object.values(WECHAT_APP_THEME_ROOTS).find(item => trimmed.startsWith(item))
  if (!root) return false
  let quote = ''
  let parenDepth = 0
  let bracketDepth = 0
  for (let i = root.length; i < trimmed.length; i++) {
    const ch = trimmed[i]
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") { quote = ch; continue }
    if (ch === '(') { parenDepth++; continue }
    if (ch === ')') { parenDepth = Math.max(0, parenDepth - 1); continue }
    if (ch === '[') { bracketDepth++; continue }
    if (ch === ']') { bracketDepth = Math.max(0, bracketDepth - 1); continue }
    if (parenDepth || bracketDepth) continue
    if (ch === '+' || ch === '~') return true
    if (/\s/.test(ch)) {
      let next = i + 1
      while (next < trimmed.length && /\s/.test(trimmed[next])) next++
      return trimmed[next] === '+' || trimmed[next] === '~'
    }
    if (ch === '>') return false
  }
  return false
}

function validateWechatAppThemeCssBlock(text, errors, offset, context) {
  let i = 0
  while (i < text.length) {
    i = skipWechatAppThemeWhitespace(text, i)
    if (i >= text.length) break

    const open = text.indexOf('{', i)
    const semicolon = text.indexOf(';', i)
    if (semicolon !== -1 && (open === -1 || semicolon < open)) {
      const statement = text.slice(i, semicolon + 1).trim()
      errors.push(`第 ${getWechatAppThemeLine(context.fullText, offset + i)} 行：不允许使用语句型 @ 规则（${statement.slice(0, 40)}）`)
      i = semicolon + 1
      continue
    }
    if (open === -1) {
      const tail = text.slice(i).trim()
      if (tail) errors.push(`第 ${getWechatAppThemeLine(context.fullText, offset + i)} 行：CSS 规则缺少 “{”`)
      break
    }
    const close = findMatchingBrace(text, open)
    if (close === -1) {
      errors.push(`第 ${getWechatAppThemeLine(context.fullText, offset + open)} 行：CSS 规则缺少配对的 “}”`)
      break
    }
    const head = text.slice(i, open).trim()
    const body = text.slice(open + 1, close)
    const line = getWechatAppThemeLine(context.fullText, offset + i)
    if (!head) {
      errors.push(`第 ${line} 行：CSS 选择器为空`)
    } else if (/^@(?:media|supports)\b/i.test(head)) {
      validateWechatAppThemeCssBlock(body, errors, offset + open + 1, context)
    } else if (head.startsWith('@')) {
      errors.push(`第 ${line} 行：仅允许 @media 和 @supports，不能使用 ${head.split(/\s|\{/)[0]}`)
    } else {
      splitCssSelectorList(head).forEach(selector => {
        const trimmed = selector.trim()
        if (!trimmed) return
        if (/(^|[\s>+~,(])(?:html|body|:root)(?=$|[\s>+~.#:\[)])/i.test(trimmed)) {
          errors.push(`第 ${line} 行：不能选择 html、body 或 :root（${trimmed}）`)
        } else if (!selectorStartsWithWechatThemeRoot(trimmed)) {
          errors.push(`第 ${line} 行：选择器必须以允许的页面根类开头（${trimmed}）`)
        } else if (selectorEscapesWechatThemeRoot(trimmed)) {
          errors.push(`第 ${line} 行：页面根类后不能使用相邻兄弟选择器 + 或 ~（${trimmed}）`)
        }
      })
    }
    i = close + 1
  }
}

function validateWechatAppThemeCss(css) {
  const text = String(css || '')
  const errors = []
  validateWechatAppThemeCssBlock(text, errors, 0, { fullText: text })
  return { valid: errors.length === 0, errors }
}

function applyWechatAppThemeCss(css) {
  const text = String(css || '')
  let style = document.getElementById(WECHAT_APP_THEME_STYLE_ID)
  if (!text.trim()) {
    if (style) style.remove()
    return
  }
  if (!style) {
    style = document.createElement('style')
    style.id = WECHAT_APP_THEME_STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = text
}

async function getWechatAppThemeCss() {
  if (!window.db) return ''
  const row = await db.config.get(WECHAT_APP_THEME_CONFIG_KEY)
  return typeof row?.value === 'string' ? row.value : ''
}

async function saveWechatAppThemeCss(css) {
  const text = String(css || '')
  const validation = validateWechatAppThemeCss(text)
  if (!validation.valid) {
    const err = new Error(validation.errors.join('\n'))
    err.validationErrors = validation.errors
    throw err
  }
  if (text.trim()) await db.config.put({ key: WECHAT_APP_THEME_CONFIG_KEY, value: text })
  else await db.config.delete(WECHAT_APP_THEME_CONFIG_KEY)
  applyWechatAppThemeCss(text)
  return text
}

async function loadWechatAppTheme() {
  const css = await getWechatAppThemeCss()
  const validation = validateWechatAppThemeCss(css)
  if (!validation.valid) {
    console.warn('已保存的微信 APP Theme CSS 无效，已停止应用', validation.errors)
    applyWechatAppThemeCss('')
    return ''
  }
  applyWechatAppThemeCss(css)
  return css
}

function getWechatAppThemeClassReferenceText() {
  return WECHAT_APP_THEME_CLASS_GROUPS.map(group => {
    return `${group.label}\n页面根类：${group.root}\n可用类名：\n${(group.items || []).join('\n')}`
  }).join('\n\n')
}

async function showWechatAppThemePage() {
  const old = document.getElementById('wechat-app-theme-page')
  if (old) old.remove()
  const css = await getWechatAppThemeCss()
  const page = document.createElement('div')
  page.id = 'wechat-app-theme-page'
  page.className = 'full-page iscreen-page app-theme-page'
  page.innerHTML = `
    <div class="page-header">
      <button class="header-back" id="btn-app-theme-back" type="button"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">APP Theme</span>
    </div>
    <div class="iscreen-scroll">
      <div class="app-theme-intro">
        仅支持 Messages、Contacts、Discovery、Moments、Personal Profile 五个微信页面。每条规则必须以对应页面根类开头，未限定或指向其他页面的 CSS 将无法保存。
        <div class="app-theme-scope-list">
          ${Object.values(WECHAT_APP_THEME_ROOTS).map(root => `<code>${wcEscHtml(root)}</code>`).join('')}
        </div>
      </div>
      <section class="app-theme-editor-card">
        <div class="app-theme-editor-head">
          <div class="app-theme-editor-title">CSS 代码</div>
          <button class="app-theme-copy-btn" id="btn-app-theme-copy-classes" type="button"><i class="fa-regular fa-clone"></i>复制类名</button>
        </div>
        <textarea class="app-theme-css-input" id="app-theme-css" spellcheck="false" placeholder=".wechat-theme-messages .chat-list-row {\n  background: rgba(255, 255, 255, 0.8);\n}\n\n.wechat-theme-moments .moment-card {\n  border-radius: 16px;\n}">${wcEscHtml(css)}</textarea>
        <div class="app-theme-error" id="app-theme-error" role="alert"></div>
        <div class="app-theme-actions">
          <button class="app-theme-reset" id="btn-app-theme-reset" type="button">恢复默认</button>
          <button class="app-theme-save" id="btn-app-theme-save" type="button">保存主题</button>
        </div>
      </section>
    </div>
  `
  window.openPage(page)
  const input = page.querySelector('#app-theme-css')
  const errorEl = page.querySelector('#app-theme-error')
  const showErrors = errors => {
    errorEl.textContent = Array.isArray(errors) ? errors.join('\n') : String(errors || '')
    errorEl.classList.toggle('show', !!errorEl.textContent)
  }
  page.querySelector('#btn-app-theme-back').addEventListener('click', () => window.closePage('wechat-app-theme-page'))
  page.querySelector('#btn-app-theme-copy-classes').addEventListener('click', () => {
    copyTextToClipboard(getWechatAppThemeClassReferenceText())
      .then(() => window.toast('完整类名已复制'))
      .catch(() => window.toast('复制失败'))
  })
  page.querySelector('#btn-app-theme-save').addEventListener('click', async () => {
    const validation = validateWechatAppThemeCss(input.value)
    if (!validation.valid) { showErrors(validation.errors); return }
    try {
      await saveWechatAppThemeCss(input.value)
      showErrors([])
      window.toast('APP Theme 已保存')
    } catch (err) {
      showErrors(err.validationErrors || err.message || '保存失败')
    }
  })
  page.querySelector('#btn-app-theme-reset').addEventListener('click', async () => {
    input.value = ''
    await saveWechatAppThemeCss('')
    showErrors([])
    window.toast('APP Theme 已恢复默认')
  })
}

window.getWechatAppThemeCss = getWechatAppThemeCss
window.saveWechatAppThemeCss = saveWechatAppThemeCss
window.loadWechatAppTheme = loadWechatAppTheme
window.validateWechatAppThemeCss = validateWechatAppThemeCss
window.showWechatAppThemePage = showWechatAppThemePage

function parseWechatRegexPattern(patternText) {
  let pattern = String(patternText || '')
  let flags = 's'
  const match = pattern.match(/^\/([\s\S]*)\/([a-z]*)$/)
  if (match) {
    pattern = match[1]
    flags = match[2] || 's'
  }
  if (!flags.includes('s')) flags += 's'
  return new RegExp(pattern, flags)
}

function buildThoughtTemplateAvatarHTML(char, charName) {
  const avatar = getWechatDisplayAvatar(char)
  const name = charName || getWechatDisplayName(char)
  if (avatar) {
    return `<img src="${wcEscHtml(avatar)}" alt="${wcEscHtml(name || '角色')}">`
  }
  return `<span>${wcEscHtml(getCharacterInitial(name || '角色'))}</span>`
}

function renderThoughtTemplateHtml(rawThought, templateConfig, charName, char) {
  const cfg = getEffectiveThoughtTemplateConfig(templateConfig, charName)
  const regex = parseWechatRegexPattern(cfg.regexPattern)
  const match = regex.exec(String(rawThought || ''))
  if (!match) return null
  const html = cfg.replacePattern.replace(/\$(\d+)/g, (full, indexText) => {
    const index = parseInt(indexText, 10)
    return match[index] !== undefined ? wcEscHtml(match[index]) : full
  }).replace(/\{charName\}/g, wcEscHtml(cfg.charName || charName || '角色'))
    .replace(/\{charAvatar\}/g, buildThoughtTemplateAvatarHTML(char, cfg.charName || charName || '角色'))
  return {
    thoughtRaw: String(rawThought || ''),
    thoughtHtml: html,
    thoughtSnapshot: {
      regexPattern: cfg.regexPattern,
      replacePattern: cfg.replacePattern
    }
  }
}

function getCharacterStatusText(char) {
  const status = String(char?.status || '').trim()
  return status || 'Active Now'
}

async function applyChatHeaderStatus(chatPage, chatId, charId) {
  if (!chatPage || !document.body.contains(chatPage)) return
  const info = chatPage.querySelector('.chat-header-info')
  const statusEl = chatPage.querySelector('.chat-header-status')
  const statusText = chatPage.querySelector('.chat-status-text')
  if (!info || !statusEl || !statusText) return
  const config = await getChatStatusDisplayConfig(chatId)
  const char = await window.getCharacter(charId)
  const enabled = !!config.enabled
  info.classList.toggle('has-status', enabled)
  statusEl.setAttribute('aria-hidden', enabled ? 'false' : 'true')
  statusText.textContent = getCharacterStatusText(char)
  chatPage.dataset.chatHeaderStatusVisible = enabled ? '1' : '0'
}


// 输入栏图标 SVG
const ICON_VOICE_SVG = `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M544 851.946667V906.666667a32 32 0 0 1-64 0v-54.72C294.688 835.733333 149.333333 680.170667 149.333333 490.666667v-21.333334a32 32 0 0 1 64 0v21.333334c0 164.949333 133.717333 298.666667 298.666667 298.666666s298.666667-133.717333 298.666667-298.666666v-21.333334a32 32 0 0 1 64 0v21.333334c0 189.514667-145.354667 345.066667-330.666667 361.28zM298.666667 298.56C298.666667 180.8 394.165333 85.333333 512 85.333333c117.781333 0 213.333333 95.541333 213.333333 213.226667v192.213333C725.333333 608.533333 629.834667 704 512 704c-117.781333 0-213.333333-95.541333-213.333333-213.226667V298.56z m64 0v192.213333C362.666667 573.12 429.557333 640 512 640c82.496 0 149.333333-66.805333 149.333333-149.226667V298.56C661.333333 216.213333 594.442667 149.333333 512 149.333333c-82.496 0-149.333333 66.805333-149.333333 149.226667z"/></svg>`
const ICON_EMOJI_SVG = `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M512 938.666667C276.362667 938.666667 85.333333 747.637333 85.333333 512S276.362667 85.333333 512 85.333333s426.666667 191.029333 426.666667 426.666667-191.029333 426.666667-426.666667 426.666667z m0-64c200.298667 0 362.666667-162.368 362.666667-362.666667S712.298667 149.333333 512 149.333333 149.333333 311.701333 149.333333 512s162.368 362.666667 362.666667 362.666667zM368.864 684.309333a32 32 0 1 1 40.917333-49.205333A159.189333 159.189333 0 0 0 512 672c37.888 0 73.674667-13.173333 102.186667-36.885333a32 32 0 0 1 40.917333 49.216A223.178667 223.178667 0 0 1 512 736a223.178667 223.178667 0 0 1-143.136-51.690667z"/></svg>`
const ICON_PLUS_SVG = `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M512 938.666667C276.362667 938.666667 85.333333 747.637333 85.333333 512S276.362667 85.333333 512 85.333333s426.666667 191.029333 426.666667 426.666667-191.029333 426.666667-426.666667 426.666667z m0-64c200.298667 0 362.666667-162.368 362.666667-362.666667S712.298667 149.333333 512 149.333333 149.333333 311.701333 149.333333 512s162.368 362.666667 362.666667 362.666667z m32-394.666667h128a32 32 0 0 1 0 64H544v128a32 32 0 0 1-64 0V544H352a32 32 0 0 1 0-64h128V352a32 32 0 0 1 64 0v128z"/></svg>`

// 输入栏HTML
function buildChatInputBarHTML() {
  return `
    <div class="chat-input-area">
      ${buildQuoteComposerHTML()}
      <div class="chat-input-bar">
        <button class="chat-reply-btn chat-action-reply" id="btn-chat-reply" type="button" aria-label="回复">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </button>
        <div class="chat-input-wrap">
          <textarea class="chat-input" id="chat-input" placeholder="发送消息..." rows="1"></textarea>
          <div class="chat-input-actions">
            <button class="chat-input-icon chat-action-voice" id="btn-chat-voice" type="button" aria-label="语音">${ICON_VOICE_SVG}</button>
            <button class="chat-input-icon chat-action-emoji" id="btn-chat-emoji" type="button" aria-label="表情">${ICON_EMOJI_SVG}</button>
            <button class="chat-input-icon chat-action-plus" id="btn-chat-plus" type="button" aria-label="更多">${ICON_PLUS_SVG}</button>
          </div>
        </div>
      </div>
    </div>`
}

function buildQuoteComposerHTML() {
  return `
    <div class="quote-compose" id="quote-compose" style="display:none">
      <div class="quote-compose-line">
        <span class="quote-compose-name" id="quote-compose-name"></span>
        <span class="quote-compose-text" id="quote-compose-text"></span>
      </div>
      <button class="quote-compose-close" id="quote-compose-close" aria-label="取消引用">
        <i class="fa fa-times"></i>
      </button>
    </div>`
}

// 加号面板HTML
function buildPlusPanelHTML() {
  return `
    <div class="chat-plus-panel chat-plus-panel-paged" id="chat-plus-panel" style="display:none">
      <div class="plus-pages" id="chat-plus-pages">
        <div class="plus-page" data-plus-page="0">
          <div class="plus-grid">
            <button class="plus-item" data-type="retry-reply">
              <div class="plus-icon"><i class="fa-solid fa-rotate-left"></i></div><span>重回</span>
            </button>
            <button class="plus-item" data-type="photo-sim">
              <div class="plus-icon"><i class="fa fa-camera"></i></div><span>照片</span>
            </button>
            <button class="plus-item" data-type="photo-real">
              <div class="plus-icon"><i class="fa fa-image"></i></div><span>相册</span>
            </button>
            <button class="plus-item" data-type="location">
              <div class="plus-icon"><i class="fa-solid fa-location-dot"></i></div><span>位置</span>
            </button>
            <button class="plus-item" data-type="voice-call">
              <div class="plus-icon"><i class="fa-solid fa-phone"></i></div><span>语音通话</span>
            </button>
            <button class="plus-item" data-type="video-call">
              <div class="plus-icon"><i class="fa-solid fa-video"></i></div><span>视频通话</span>
            </button>
            <button class="plus-item" data-type="transfer">
              <div class="plus-icon"><i class="fa fa-credit-card"></i></div><span>转账</span>
            </button>
            <button class="plus-item" data-type="reply-history">
              <div class="plus-icon"><i class="fa-solid fa-clock-rotate-left"></i></div><span>历史回复</span>
            </button>
          </div>
        </div>
        <div class="plus-page" data-plus-page="1">
          <div class="plus-grid">
            <button class="plus-item" data-type="link">
              <div class="plus-icon"><i class="fa-solid fa-link"></i></div><span>链接</span>
            </button>
            <button class="plus-item" data-type="shop-approval">
              <div class="plus-icon"><i class="fa-solid fa-cart-shopping"></i></div><span>购物审批</span>
            </button>
          </div>
        </div>
      </div>
      <div class="plus-page-dots" aria-label="加号面板分页">
        <button class="plus-page-dot active" data-plus-page-target="0" type="button" aria-label="第1页" aria-current="page"></button>
        <button class="plus-page-dot" data-plus-page-target="1" type="button" aria-label="第2页"></button>
      </div>
    </div>`
}

// 表情包内联面板HTML（与加号面板同形态，输入栏下方切换显示）
function buildEmojiPanelHTML() {
  return `
    <div class="chat-emoji-panel" id="chat-emoji-panel" style="display:none">
      <div class="ep-tab-row">
        <div class="sp-tabs" id="ep-tabs"></div>
        <button class="ep-mount-btn" id="ep-mount" type="button" aria-label="管理挂载">
          <i class="fa fa-plus"></i>
        </button>
      </div>
      <div class="sp-grid" id="ep-grid"></div>
    </div>`
}

function bindQuoteComposer(page) {
  const closeBtn = page.querySelector('#quote-compose-close')
  if (closeBtn) closeBtn.addEventListener('click', () => clearPendingQuote(page))
  renderQuoteComposer(page)
}

function renderQuoteComposer(page) {
  const box = page.querySelector('#quote-compose')
  if (!box) return
  const state = page._quoteState
  if (!state) {
    box.style.display = 'none'
    return
  }
  const nameEl = page.querySelector('#quote-compose-name')
  const textEl = page.querySelector('#quote-compose-text')
  if (nameEl) nameEl.textContent = state.speaker || '我'
  if (textEl) textEl.textContent = state.previewText || state.text || ''
  box.style.display = 'flex'
}

function setPendingQuote(page, state) {
  if (!page || !state || !state.text) return
  page._quoteState = {
    speaker: state.speaker || '我',
    text: normalizeQuoteText(state.text),
    previewText: normalizeQuoteText(state.previewText || getWechatQuotedContentDisplayPreview(state.text))
  }
  renderQuoteComposer(page)
  const input = page.querySelector('#chat-input')
  if (input) input.focus()
}

function clearPendingQuote(page) {
  if (!page) return
  page._quoteState = null
  renderQuoteComposer(page)
}

function normalizeQuoteText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/"/g, '”')
    .trim()
    .slice(0, 200)
}

function buildQuotedReplyContent(chatPage, quoteState, replyText) {
  const sender = _wechatUser?.nick || _wechatUser?.name || '我'
  const speaker = normalizeQuoteText(quoteState.speaker || '我')
  const quoted = normalizeQuoteText(quoteState.text)
  const reply = String(replyText || '').replace(/\]/g, '］').trim()
  return `[${sender}引用"${speaker}：${quoted}"并回复：${reply}]`
}

function getMsgActionText(msg, charName) {
  const parsed = parseMsgType(msg.content, charName || '')
  switch (parsed.type) {
    case 'text':
      return parsed.data.text || ''
    case 'quote':
      return parsed.data.reply || ''
    case 'voice':
      return `[语音：${parsed.data.text || ''}]`
    case 'photo':
      return `[照片：${parsed.data.desc || ''}]`
    case 'real-photo':
      return normalizeImageSupplementDesc(msg.imageDesc)
        ? `[图片：${normalizeImageSupplementDesc(msg.imageDesc)}]`
        : '[图片]'
    case 'sticker':
      return `[表情包：${parsed.data.name || ''}]`
    case 'transfer-recv':
      return `[转账：${parsed.data.amount || ''}元；备注：${parsed.data.note || ''}]`
    case 'location':
      return parsed.data.dist
        ? `[位置：${parsed.data.place || ''}；距你约${parsed.data.dist}]`
        : `[位置：${parsed.data.place || ''}]`
    case 'link':
      return buildLinkFallbackText(parsed.data)
    case 'shop-approval':
      return buildShopApprovalFallbackText(parsed.data, msg)
    default:
      return msg.content || ''
  }
}

function getMsgNotificationText(msg, charName) {
  const text = String(getMsgActionText(msg, charName) || '').trim()
  return text || '你收到一条新消息'
}

const WECHAT_TOP_MESSAGE_POPUP_MS = 4200

function buildWechatTopPopupAvatarHTML(avatar, title, scope) {
  if (avatar) {
    return `<img src="${wcEscHtml(avatar)}" alt="${wcEscHtml(title || '微信')}">`
  }
  if (scope === 'group') {
    return '<div class="wechat-top-popup-group-icon"><i class="fa fa-users"></i></div>'
  }
  return `<div class="wechat-top-popup-initial">${wcEscHtml(getCharacterInitial(title || '微信'))}</div>`
}

function closeWechatTopMessagePopup() {
  const current = document.getElementById('wechat-top-message-popup')
  if (!current) return
  clearTimeout(current._hideTimer)
  current.classList.remove('show')
  current.classList.add('is-hiding')
  setTimeout(() => current.remove(), 220)
}

function showWechatTopMessagePopup({ scope, id, title, body, avatar, open }) {
  if (document.visibilityState !== 'visible') return
  closeWechatTopMessagePopup()
  const el = document.createElement('button')
  el.id = 'wechat-top-message-popup'
  el.className = 'wechat-top-message-popup'
  el.type = 'button'
  el.dataset.scope = scope || ''
  el.dataset.id = id || ''
  el.innerHTML = `
    <div class="wechat-top-popup-avatar">
      ${buildWechatTopPopupAvatarHTML(avatar, title, scope)}
      <span class="wechat-top-popup-badge"><i class="fa-brands fa-weixin"></i></span>
    </div>
    <div class="wechat-top-popup-body">
      <div class="wechat-top-popup-meta">
        <span class="wechat-top-popup-title">${wcEscHtml(title || '微信')}</span>
        <span class="wechat-top-popup-now">NOW</span>
      </div>
      <div class="wechat-top-popup-text">${wcEscHtml(body || '你收到一条新消息')}</div>
    </div>
  `
  el.addEventListener('click', async () => {
    closeWechatTopMessagePopup()
    if (typeof open === 'function') await open()
  })
  document.body.appendChild(el)
  requestAnimationFrame(() => el.classList.add('show'))
  el._hideTimer = setTimeout(closeWechatTopMessagePopup, WECHAT_TOP_MESSAGE_POPUP_MS)
}

function ensureWechatPageForPopup() {
  let wechatPage = document.getElementById('wechat-page')
  if (wechatPage) return wechatPage
  wechatPage = buildWechatMainPage()
  window.openPage(wechatPage)
  enterWechatMainPage(wechatPage)
  return wechatPage
}

function removeCurrentChatWindowForPopup() {
  const current = document.getElementById('chat-window')
  if (!current) return
  if (current.dataset.chatId) removeChatBeautyStyle(current.dataset.chatId)
  clearWechatBlobUrlCache()
  clearWechatAvatarBlobCache()
  current.remove()
}

async function openPrivateChatFromTopPopup(chatId, charId) {
  removeCurrentChatWindowForPopup()
  const wechatPage = ensureWechatPageForPopup()
  await openPrivateChat(wechatPage, charId, chatId)
}

async function openGroupChatFromTopPopup(groupId) {
  removeCurrentChatWindowForPopup()
  const wechatPage = ensureWechatPageForPopup()
  await openGroupChat(wechatPage, groupId)
}

async function showPrivateAIMessagePopupIfNeeded(chatId, charId, content, createdAt, overrideBody = null) {
  if (_getVisibleChatWindow('chat', chatId)) return
  const displayChar = await getWechatDisplayCharacter(charId)
  const title = getWechatDisplayName(displayChar)
  const body = overrideBody != null ? overrideBody : getMsgNotificationText({
    chatId,
    charId,
    role: 'assistant',
    content,
    createdAt
  }, title)
  showWechatTopMessagePopup({
    scope: 'chat',
    id: chatId,
    title,
    body,
    avatar: getWechatDisplayAvatar(displayChar),
    open: () => openPrivateChatFromTopPopup(chatId, charId)
  })
}

async function showGroupAIMessagePopupIfNeeded(groupId, group, memberId, content, createdAt) {
  if (_getVisibleChatWindow('group', groupId)) return
  const member = await getWechatDisplayCharacter(memberId)
  const memberName = getWechatDisplayName(member)
  const title = group?.name || '群聊'
  const bodyText = getMsgNotificationText({
    groupId,
    senderId: memberId,
    role: 'assistant',
    content,
    createdAt
  }, memberName)
  showWechatTopMessagePopup({
    scope: 'group',
    id: groupId,
    title,
    body: `${memberName}：${bodyText}`,
    avatar: group?.avatar || '',
    open: () => openGroupChatFromTopPopup(groupId)
  })
}

async function notifyPrivateAIMessageIfBackground(chatId, charId, content, createdAt) {
  if (document.visibilityState === 'visible') return
  if (!window.sendWanWanNotification) return
  try {
    const displayChar = await getWechatDisplayCharacter(charId)
    const title = getWechatDisplayName(displayChar)
    const body = getMsgNotificationText({
      chatId,
      charId,
      role: 'assistant',
      content,
      createdAt
    }, title)
    await window.sendWanWanNotification(body, {
      title,
      tag: `wanwan-chat-${chatId}-${createdAt}`,
      data: { url: window.location.href }
    })
  } catch (e) {
    console.warn('[wechat] 后台通知发送失败:', e)
  }
}

function getMsgQuoteInfo(msg, speakerName, charName) {
  const text = getMsgActionText(msg, charName || speakerName)
  return {
    speaker: speakerName || '我',
    text: normalizeQuoteText(text),
    previewText: normalizeQuoteText(getWechatMessageDisplayPreview(msg, charName || speakerName))
  }
}

// Android 中文输入法在确认候选词时可能同时派发 Enter 与 keyCode 229。
// 这些事件只用于结束组合输入，不能当作真正的发送动作。
function isWanWanSendKeyEvent(event) {
  if (!event || event.key !== 'Enter' || event.shiftKey) return false
  if (event.isComposing || event.keyCode === 229 || event.which === 229) return false
  return true
}

// 部分 Android Chromium 在软键盘收起导致按钮位移时会丢失 click。
// 对触屏指针捕获 pointerup，并抑制紧随其后的合成 click；鼠标仍走 click。
function bindWanWanMobileAction(button, handler) {
  if (!button || typeof handler !== 'function') return
  let lastTouchActionAt = 0
  button.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return
    try { button.setPointerCapture(event.pointerId) } catch (_) {}
  })
  button.addEventListener('pointerup', event => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return
    event.preventDefault()
    lastTouchActionAt = Date.now()
    handler(event)
  })
  button.addEventListener('click', event => {
    if (Date.now() - lastTouchActionAt < 500) return
    handler(event)
  })
}

window.isWanWanSendKeyEvent = isWanWanSendKeyEvent
window.bindWanWanMobileAction = bindWanWanMobileAction

function reportWechatSendError(error, label = '消息') {
  console.error(`[wechat] ${label}发送失败:`, error)
  window.toast?.(`${label}发送失败：${error?.message || String(error)}`)
}


// 聊天窗口事件绑定
function bindChatWindowEvents(page) {
  const input = page.querySelector('#chat-input')
  const plusBtn = page.querySelector('#btn-chat-plus')
  bindQuoteComposer(page)

  // 根据输入内容在「加号」与「发送」之间切换右侧按钮
  const updatePlusBtnUI = () => {
    const hasText = input.value.trim().length > 0
    if (hasText && !plusBtn.classList.contains('is-send')) {
      plusBtn.classList.add('is-send', 'chat-action-send')
      plusBtn.classList.remove('chat-action-plus')
      plusBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'
      plusBtn.setAttribute('aria-label', '发送')
    } else if (!hasText && plusBtn.classList.contains('is-send')) {
      plusBtn.classList.remove('is-send', 'chat-action-send')
      plusBtn.classList.add('chat-action-plus')
      plusBtn.innerHTML = ICON_PLUS_SVG
      plusBtn.setAttribute('aria-label', '更多')
    }
  }

  // 仅发送消息，不触发 AI 回复
  const doSend = async () => {
    if (page._textSendPending) return false
    page._textSendPending = true
    try {
      const sent = await sendTextMessage(page)
      input.style.height = 'auto'
      updatePlusBtnUI()
      return sent
    } catch (error) {
      reportWechatSendError(error)
      return false
    } finally {
      page._textSendPending = false
    }
  }

  // 魔法棒：如有文本先发送，再触发 AI 回复
  const doRequestAIReply = async () => {
    const _charId = parseInt(page.dataset.charId)
    const target = await db.characters.get(_charId)
    if (target?.type === 'online_friend') {
      window.toast?.('联机聊天不会触发 AI 回复')
      return
    }
    if (window.isCallActiveWith?.(_charId)) {
      window.toast?.('通话中，无法发送消息')
      return
    }
    if (input.value.trim().length > 0) {
      const sent = await doSend()
      if (!sent) return
    }
    const chatId = parseInt(page.dataset.chatId)
    const charId = parseInt(page.dataset.charId)
    startPrivateAIReply(chatId, charId, { allowMcp: true })
  }

  // 左侧魔法棒按钮：唯一触发 AI 回复的入口
  bindWanWanMobileAction(page.querySelector('#btn-chat-reply'), doRequestAIReply)
  bindWechatPatGesture(page.querySelector('.chat-header-name'), () => {
    const title = page.querySelector('.chat-header-name')
    showWechatPatModal({
      scope: 'chat',
      chatPage: page,
      targetId: parseInt(page.dataset.charId),
      targetName: title?.dataset.origName || title?.textContent || '对方'
    })
  })

  // Enter 仅发送消息（Shift+Enter 换行），不触发 AI
  input.addEventListener('keydown', e => {
    if (!isWanWanSendKeyEvent(e)) return
    e.preventDefault()
    doSend()
  })

  input.addEventListener('input', () => {
    input.style.height = 'auto'
    input.style.height = Math.min(input.scrollHeight, 120) + 'px'
    updatePlusBtnUI()
  })

  // 工具面板 / 表情包面板互斥切换
  const plusPanel = page.querySelector('#chat-plus-panel')
  const plusPages = page.querySelector('#chat-plus-pages')
  const plusPageDots = [...page.querySelectorAll('.plus-page-dot')]
  const emojiPanel = page.querySelector('#chat-emoji-panel')
  const syncPlusPageDots = index => {
    plusPageDots.forEach((dot, dotIndex) => {
      const active = dotIndex === index
      dot.classList.toggle('active', active)
      if (active) dot.setAttribute('aria-current', 'page')
      else dot.removeAttribute('aria-current')
    })
  }
  const setPlusPage = (index, smooth = true) => {
    const pageIndex = Math.max(0, Math.min(index, plusPageDots.length - 1))
    plusPages.scrollTo({ left: plusPages.clientWidth * pageIndex, behavior: smooth ? 'smooth' : 'auto' })
    syncPlusPageDots(pageIndex)
  }
  let plusScrollFrame = 0
  plusPages.addEventListener('scroll', () => {
    cancelAnimationFrame(plusScrollFrame)
    plusScrollFrame = requestAnimationFrame(() => {
      const width = plusPages.clientWidth || 1
      syncPlusPageDots(Math.round(plusPages.scrollLeft / width))
    })
  }, { passive: true })
  plusPageDots.forEach(dot => {
    dot.addEventListener('click', () => setPlusPage(parseInt(dot.dataset.plusPageTarget), true))
  })
  const closeBothPanels = () => {
    plusPanel.style.display = 'none'
    emojiPanel.style.display = 'none'
  }

  // 输入栏右侧语音 / 表情图标
  page.querySelector('#btn-chat-voice').addEventListener('click', () => {
    closeBothPanels()
    handlePlusAction(page, 'voice')
  })
  page.querySelector('#btn-chat-emoji').addEventListener('click', async () => {
    const isOpen = emojiPanel.style.display !== 'none'
    plusPanel.style.display = 'none'
    emojiPanel.style.display = isOpen ? 'none' : 'flex'
    if (!isOpen) {
      input.blur()
      await renderEmojiPanel(page)
    }
  })

  // 加号 / 发送 双态按钮：发送态仅入库，不触发 AI
  bindWanWanMobileAction(plusBtn, () => {
    if (plusBtn.classList.contains('is-send')) { doSend(); return }
    const isOpen = plusPanel.style.display !== 'none'
    emojiPanel.style.display = 'none'
    plusPanel.style.display = isOpen ? 'none' : 'block'
    if (!isOpen) {
      input.blur()
      requestAnimationFrame(() => setPlusPage(0, false))
    }
  })
  page.querySelectorAll('.plus-item').forEach(item => {
    item.addEventListener('click', () => {
      if (item.dataset.type === 'voice-call') {
        closeBothPanels()
        window.startVoiceCall?.(parseInt(page.dataset.chatId), parseInt(page.dataset.charId))
        return
      }
      if (item.dataset.type === 'video-call') {
        closeBothPanels()
        window.startVideoCall?.(parseInt(page.dataset.chatId), parseInt(page.dataset.charId))
        return
      }
      if (item.dataset.type === 'retry-reply') {
        closeBothPanels()
        showRetryReplyModal(page)
        return
      }
      if (item.dataset.type === 'reply-history') {
        closeBothPanels()
        showReplyHistoryModal(page)
        return
      }
      closeBothPanels()
      handlePlusAction(page, item.dataset.type)
    })
  })

  // 输入框获得焦点时收起两个面板，避免遮挡
  input.addEventListener('focus', () => closeBothPanels())

  // 聊天设置（角色手机模式下该按钮已移除）
  page.querySelector('#btn-chat-settings')?.addEventListener('click', () => {
    openChatSettings(parseInt(page.dataset.chatId), parseInt(page.dataset.charId), page)
  })
}


async function getMcpToolTracesForConversation(scope, conversationId, lowerBound = 0, upperBound = Infinity) {
  if (!db.mcpToolTraces) return []
  const rows = await db.mcpToolTraces
    .where('[scope+conversationId]')
    .equals([scope, Number(conversationId)])
    .toArray()
  return rows.filter(row => {
    const createdAt = Number(row.createdAt) || 0
    return createdAt >= lowerBound && createdAt <= upperBound
  }).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0) || (a.id || 0) - (b.id || 0))
}

function formatMcpTraceJson(value) {
  if (value == null) return ''
  try { return JSON.stringify(value, null, 2).slice(0, 30000) } catch (_) { return String(value).slice(0, 30000) }
}

function buildMcpTraceRowHTML(trace) {
  const status = ['running', 'success', 'error', 'cached'].includes(trace?.status) ? trace.status : 'error'
  const statusLabel = {
    running: '正在调用',
    success: '调用完成',
    error: '调用失败',
    cached: '复用结果'
  }[status]
  const icon = status === 'running' ? 'fa-circle-notch fa-spin' :
    (status === 'error' ? 'fa-triangle-exclamation' : (status === 'cached' ? 'fa-copy' : 'fa-check'))
  const title = trace?.toolTitle || trace?.toolName || 'MCP 工具'
  const args = formatMcpTraceJson(trace?.arguments) || '{}'
  const result = formatMcpTraceJson(trace?.result)
  const error = String(trace?.error || '')
  const urls = Array.isArray(trace?.urls) ? trace.urls : []
  const duration = trace?.updatedAt && trace?.createdAt
    ? Math.max(0, Number(trace.updatedAt) - Number(trace.createdAt))
    : 0
  const urlHtml = urls.map(item => {
    const url = String(item?.url || '')
    if (!isValidHttpUrl(url)) return ''
    return `<button class="mcp-trace-link${item.payment ? ' is-payment' : ''}" type="button" data-mcp-url="${wcEscHtml(url)}"><i class="fa-solid fa-arrow-up-right-from-square"></i>${item.payment ? '去付款' : '打开链接'}</button>`
  }).join('')
  return `
    <div class="msg-row msg-system mcp-trace-row" data-mcp-trace-id="${trace.id}">
      <div class="mcp-trace-card is-${status}">
        <button class="mcp-trace-summary" type="button" aria-expanded="false">
          <span class="mcp-trace-state"><i class="fa-solid ${icon}"></i></span>
          <span class="mcp-trace-title">${wcEscHtml(statusLabel)} · ${wcEscHtml(title)}</span>
          <i class="fa-solid fa-angle-down mcp-trace-chevron"></i>
        </button>
        <div class="mcp-trace-details" hidden>
          <div class="mcp-trace-meta"><span>服务</span><strong>${wcEscHtml(trace?.serverName || 'MCP')}</strong></div>
          <div class="mcp-trace-meta"><span>工具</span><strong>${wcEscHtml(trace?.toolName || title)}</strong></div>
          ${duration ? `<div class="mcp-trace-meta"><span>耗时</span><strong>${duration} ms</strong></div>` : ''}
          <div class="mcp-trace-label">调用参数</div>
          <pre>${wcEscHtml(args)}</pre>
          ${result ? `<div class="mcp-trace-label">返回数据</div><pre>${wcEscHtml(result)}</pre>` : ''}
          ${error ? `<div class="mcp-trace-error">${wcEscHtml(error)}</div>` : ''}
          ${urlHtml ? `<div class="mcp-trace-links">${urlHtml}</div>` : ''}
        </div>
      </div>
    </div>`
}

function bindMcpTraceInteractions(container) {
  container.querySelectorAll('.mcp-trace-card').forEach(card => {
    if (card.dataset.mcpBound === '1') return
    card.dataset.mcpBound = '1'
    const summary = card.querySelector('.mcp-trace-summary')
    const details = card.querySelector('.mcp-trace-details')
    summary?.addEventListener('click', () => {
      const expanded = card.classList.toggle('is-expanded')
      summary.setAttribute('aria-expanded', expanded ? 'true' : 'false')
      if (details) details.hidden = !expanded
    })
    card.querySelectorAll('[data-mcp-url]').forEach(button => {
      button.addEventListener('click', event => {
        event.stopPropagation()
        const url = button.dataset.mcpUrl
        if (!isValidHttpUrl(url)) return
        window.open(url, '_blank', 'noopener,noreferrer')
      })
    })
  })
}

function buildWechatRenderTimeline(messages, traces) {
  return (messages || []).map(message => ({
    kind: 'message',
    createdAt: Number(message.createdAt) || 0,
    id: Number(message.id) || 0,
    value: message
  })).concat((traces || []).map(trace => ({
    kind: 'mcp-trace',
    createdAt: Number(trace.createdAt) || 0,
    id: Number(trace.id) || 0,
    value: trace
  }))).sort((a, b) =>
    a.createdAt - b.createdAt ||
    (a.kind === b.kind ? a.id - b.id : (a.kind === 'message' ? -1 : 1))
  )
}

// AI 发的表情包消息只存了名字、没存图片：渲染前按名字从挂载库补图（只补当前窗口里用到的）
const _wechatStickerMapCache = new Map()
async function getStickerMapForMessages(chatId, msgs, charName) {
  const need = new Set()
  for (const m of msgs || []) {
    if (m.stickerImage || !m.content || String(m.content).indexOf('的表情包：') < 0) continue
    const p = parseMsgType(m.content, charName)
    const name = p.type === 'sticker' ? String(p.data?.name || '').trim() : ''
    if (name) need.add(name)
  }
  if (!need.size) return {}
  let hit = _wechatStickerMapCache.get(chatId)
  if (!hit || Date.now() - hit.at > 60000 || [...need].some(n => !(n in hit.map))) {
    hit = { at: Date.now(), map: await getMountedStickerMap(chatId) }
    _wechatStickerMapCache.set(chatId, hit)
  }
  const out = {}
  need.forEach(n => { if (hit.map[n]) out[n] = hit.map[n] })
  return out
}
// 加载并渲染消息
async function loadChatMessages(page, chatId, options = {}) {
  const container = page.querySelector('#chat-messages')
  const charId = parseInt(page.dataset.charId)
  // 搜索跳转：以目标消息为中心渲染一小段历史（jumpWindow），此时列表不是「最新」状态
  const isJumpWindow = !!(options.jumpWindow && Array.isArray(options.pageMessages))
  if (container?._wechatJumpMode && !isJumpWindow) {
    // 正处于搜索跳转的历史位置时，任何普通刷新（发消息、收到回复等）都先回到最新消息再正常渲染
    container._wechatJumpMode = false
    container.querySelector('.chat-jump-latest')?.remove()
    options = { ...options, scrollToBottom: true }
  }
  const [char, timeSettings, bilingualSettings, msgs] = await Promise.all([
    getWechatDisplayCharacter(charId),
    getChatTimeSettings(chatId),
    getChatBilingualSettings(chatId),
    Array.isArray(options.pageMessages)
      ? Promise.resolve(options.pageMessages)
      : getChatRecentMessages(chatId, WECHAT_RENDER_WINDOW)
  ])
  const traceLowerBound = msgs[0]?.createdAt ? Number(msgs[0].createdAt) : 0
  const mcpTraces = await getMcpToolTracesForConversation('chat', chatId, traceLowerBound)
  const charName = getWechatDisplayName(char)
  // 首屏消息已经携带 stickerImage；这里不读取整套挂载表情图片，避免大表情库拖慢聊天打开。
  const stickerMap = await getStickerMapForMessages(chatId, msgs, charName)
  const visibleMsgs = msgs.filter(m => parseMsgType(m.content, charName).type !== 'status-update')
  const oldestVisible = visibleMsgs[0] || null
  const hasEarlier = oldestVisible ? await hasEarlierChatMessages(chatId, oldestVisible) : false
  await renderMessages(container, msgs, charId, charName, stickerMap, timeSettings, {
    char,
    bilingualSettings,
    mcpTraces,
    hasEarlier,
    force: true,
    scrollToBottom: !!options.scrollToBottom,
    initialScrollToBottom: !!options.initialScrollToBottom
  })
  if (isJumpWindow) {
    container._wechatJumpMode = true
    showChatJumpLatestBar(page, container)
  }
  if (isAIReplyPending('chat', chatId)) applyTypingUI('chat', chatId, true)
}

async function enhanceVisibleChat(page, chatId, charId) {
  const stageMeta = { chatId, charId }
  const stages = [
    ['applyChatAppearance', () => applyChatAppearance(page, chatId)],
    ['applyChatBeauty', () => applyChatBeauty(page, chatId)],
    ['applyChatHeaderStatus', () => applyChatHeaderStatus(page, chatId, charId)]
  ]
  for (const [stage, runner] of stages) {
    if (!isPrivateChatPageCurrent(page, chatId)) return
    try {
      await runner()
    } catch (error) {
      logWechatChatOpenIssue(stage, error, stageMeta)
    }
  }
}

async function getChatMessagesByCreatedAtRange(chatId, lowerBound, upperBound, limit = 0) {
  const maxLimit = Math.max(0, parseInt(limit, 10) || 0)
  try {
    const query = db.messages
      .where('[chatId+createdAt]')
      .between(
        [chatId, lowerBound ?? Dexie.minKey],
        [chatId, upperBound ?? Dexie.maxKey],
        true,
        true
      )
      .reverse()
    const rows = maxLimit > 0 ? await query.limit(maxLimit).toArray() : await query.toArray()
    return rows.reverse()
  } catch (error) {
    if (window.isWanWanRecoverableDBError?.(error)) throw error
    const rows = await db.messages.where('chatId').equals(chatId).sortBy('createdAt')
    const filtered = rows.filter(row => {
      const createdAt = Number(row?.createdAt || 0)
      if (lowerBound != null && createdAt < lowerBound) return false
      if (upperBound != null && createdAt > upperBound) return false
      return true
    })
    if (!maxLimit || filtered.length <= maxLimit) return filtered
    return filtered.slice(filtered.length - maxLimit)
  }
}

async function getChatRecentMessages(chatId, limit = WECHAT_RENDER_WINDOW) {
  return await getChatMessagesByCreatedAtRange(chatId, null, null, limit)
}

async function getChatMessagesBefore(chatId, beforeMsg, limit = WECHAT_RENDER_WINDOW) {
  const beforeCreatedAt = Number(beforeMsg?.createdAt || 0)
  if (!beforeCreatedAt) return []
  const maxLimit = Math.max(1, parseInt(limit, 10) || WECHAT_RENDER_WINDOW)
  try {
    const fetchLimit = Math.max(maxLimit * 2, maxLimit + 20)
    const rows = await db.messages
      .where('[chatId+createdAt]')
      .between([chatId, Dexie.minKey], [chatId, beforeCreatedAt], true, true)
      .reverse()
      .limit(fetchLimit)
      .toArray()
    const earlier = rows.filter(row =>
      Number(row?.createdAt || 0) < beforeCreatedAt ||
      (Number(row?.createdAt || 0) === beforeCreatedAt && Number(row?.id || 0) < Number(beforeMsg?.id || 0))
    )
    return earlier.slice(0, maxLimit).reverse()
  } catch (error) {
    if (window.isWanWanRecoverableDBError?.(error)) throw error
    const rows = await db.messages.where('chatId').equals(chatId).sortBy('createdAt')
    const earlier = rows.filter(row =>
      Number(row?.createdAt || 0) < beforeCreatedAt ||
      (Number(row?.createdAt || 0) === beforeCreatedAt && Number(row?.id || 0) < Number(beforeMsg?.id || 0))
    )
    if (!maxLimit || earlier.length <= maxLimit) return earlier
    return earlier.slice(earlier.length - maxLimit)
  }
}

async function hasEarlierChatMessages(chatId, oldestMsg) {
  if (!oldestMsg?.id || !oldestMsg?.createdAt) return false
  const rows = await getChatMessagesBefore(chatId, oldestMsg, 1)
  return rows.length > 0
}

// 渲染消息列表
async function renderMessages(container, msgs, charId, charName, stickerMap, timeSettings, options = {}) {
  if (!container) return
  bindChatScrollIntentTracker(container)
  const visibleMsgs = msgs.filter(m => parseMsgType(m.content, charName).type !== 'status-update')
  const mcpTraces = Array.isArray(options.mcpTraces) ? options.mcpTraces : []
  const traceSignature = mcpTraces.map(trace =>
    `${trace.id}:${trace.status}:${trace.updatedAt || ''}`
  ).join('|')
  if (!visibleMsgs.length && !mcpTraces.length) {
    container.innerHTML = '<div class="chat-empty">开始对话吧</div>'
    container._wechatRenderState = {
      ids: [],
      previousVisibleAt: null,
      oldestRenderedId: null,
      oldestRenderedAt: null,
      hasEarlier: false,
      traceSignature: '',
      signature: getMessageRenderSignature(charId, charName, stickerMap, timeSettings)
    }
    return
  }
  const char = options.char || await getWechatDisplayCharacter(charId)
  const charAvatarSrc = await getAvatarBlobUrl(`char:${charId}`, getWechatDisplayAvatar(char))
  const avatarHtml = options.avatarHtml || (charAvatarSrc
    ? `<img src="${charAvatarSrc}">` : buildWechatInitialAvatarHTML(charName)
  )
  const selfName = _wechatUser?.nick || _wechatUser?.name || '我'
  const selfAvatarHtml = options.selfAvatarHtml || await (async () => {
    const selfAvatarSrc = await getAvatarBlobUrl('self', await getWechatSelfAvatar())
    return selfAvatarSrc
      ? `<img src="${selfAvatarSrc}">`
      : `<span>${wcEscHtml(getCharacterInitial(selfName))}</span>`
  })()
  const tsConfig = normalizeChatTimeSettings(timeSettings)
  const bilingualSettings = normalizeChatBilingualSettings(options.bilingualSettings)
  const signature = getMessageRenderSignature(charId, charName, stickerMap, tsConfig, bilingualSettings)
  const state = container._wechatRenderState
  const windowMsgs = visibleMsgs
  const currentIds = windowMsgs.map(m => m.id)
  const hasEarlier = !!options.hasEarlier

  // 保存「加载更早」需要的渲染上下文（按钮点击时复用，避免重建一堆参数）
  container._wechatRenderCtx = { charId, charName, avatarHtml, selfAvatarHtml, stickerMap, tsConfig, bilingualSettings }

  const canAppend = !options.force &&
    state &&
    state.signature === signature &&
    state.traceSignature === traceSignature &&
    state.ids.length <= currentIds.length &&
    state.ids.every((id, i) => id === currentIds[i]) &&
    container.querySelectorAll('.msg-row[data-id]').length === state.ids.length

  if (canAppend) {
    syncExistingMessageDecorations(container, windowMsgs)
    const newMsgs = windowMsgs.slice(state.ids.length)
    const scrollRequestedAt = options.scrollToBottom && newMsgs.length
      ? createChatAutoScrollRequest(container)
      : null
    if (newMsgs.length) {
      appendMessageRows(container, newMsgs, charName, avatarHtml, selfAvatarHtml, stickerMap, tsConfig, bilingualSettings, state.previousVisibleAt, charId, {
        ...options,
        scrollRequestedAt
      })
      const lastVisible = windowMsgs[windowMsgs.length - 1]
      container._wechatRenderState = {
        ids: currentIds,
        previousVisibleAt: lastVisible?.createdAt || state.previousVisibleAt || null,
        oldestRenderedId: windowMsgs[0]?.id ?? state.oldestRenderedId ?? null,
        oldestRenderedAt: windowMsgs[0]?.createdAt ?? state.oldestRenderedAt ?? null,
        hasEarlier,
        traceSignature,
        signature
      }
    }
    refreshMsgMultiSelectBindings(container)
    if (scrollRequestedAt) scrollChatToBottom(container, { requestedAt: scrollRequestedAt })
    return
  }

  let previousVisibleAt = null
  const rows = []
  if (hasEarlier) rows.push(buildLoadEarlierHTML())
  const renderTimeline = buildWechatRenderTimeline(windowMsgs, mcpTraces)
  renderTimeline.forEach(item => {
    if (item.kind === 'mcp-trace') {
      rows.push(buildMcpTraceRowHTML(item.value))
      return
    }
    const m = item.value
    if (tsConfig.enabled && tsConfig.mode === 'center') {
      const createdAt = m.createdAt || 0
      if (createdAt && (!previousVisibleAt || createdAt - previousVisibleAt >= CHAT_TIME_GAP_MS)) {
        rows.push(buildCenterTimestampHTML(createdAt))
      }
    }
    const row = buildMsgRowHTML(m, charName, avatarHtml, selfAvatarHtml, stickerMap, tsConfig, bilingualSettings)
    if (row) rows.push(row)
    if (m.createdAt) previousVisibleAt = m.createdAt
  })
  container.innerHTML = rows.join('')
  bindMsgLongPress(container, charId)
  bindMcpTraceInteractions(container)
  if (!options.deferBlobHydration) hydrateWechatBlobImages(container)
  refreshMsgMultiSelectBindings(container)
  container._wechatRenderState = {
    ids: currentIds,
    previousVisibleAt,
    oldestRenderedId: windowMsgs[0]?.id ?? null,
    oldestRenderedAt: windowMsgs[0]?.createdAt ?? null,
    hasEarlier,
    traceSignature,
    signature
  }
  const shouldScrollToBottom = !!(options.scrollToBottom || options.initialScrollToBottom)
  const scrollRequestedAt = shouldScrollToBottom ? createChatAutoScrollRequest(container) : null
  watchMessageMediaForBottom(container, container, shouldScrollToBottom, scrollRequestedAt)
  if (scrollRequestedAt) scrollChatToBottom(container, { requestedAt: scrollRequestedAt })
}

// ===== 聊天内搜索：查找聊天记录（按内容 / 按日期），点结果跳到对应消息并高亮 =====
const CHAT_SEARCH_PAGE_SIZE = 50
const CHAT_JUMP_BEFORE = 30
const CHAT_JUMP_AFTER = 40
// 这些类型 getMsgActionText 能给出可读文字；其余类型（红包、通话记录等）用摘要文字
const CHAT_SEARCH_TEXT_TYPES = new Set(['text', 'quote', 'voice', 'photo', 'real-photo', 'sticker', 'transfer-recv', 'location', 'link', 'shop-approval'])

function formatChatSearchTime(ts) {
  const d = new Date(Number(ts) || 0)
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function formatChatSearchDateValue(ts) {
  const d = new Date(Number(ts) || 0)
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// 读取一个聊天的全部消息，只保留「可搜索的轻量文字索引」，不把大图等内容留在内存里
async function buildChatSearchIndex(chatId, charName) {
  const list = []
  const push = m => {
    if (!m || typeof m.content !== 'string' || !m.content) return
    let type = ''
    try { type = parseMsgType(m.content, charName).type } catch (e) { return }
    if (type === 'status-update' || type === 'recall' || type === 'system-note' || type === 'transfer-resp') return
    let text = ''
    try {
      text = CHAT_SEARCH_TEXT_TYPES.has(type)
        ? getMsgActionText(m, charName)
        : getWechatMessageDisplayPreview(m, charName)
    } catch (e) { return }
    text = String(text || '').trim()
    if (!text) return
    let lower = text.toLowerCase()
    if (lower.length !== text.length) lower = text
    list.push({ id: m.id, at: Number(m.createdAt) || 0, self: m.role === 'user', text, lower })
  }
  const run = op => window.runWanWanDBRead ? window.runWanWanDBRead(op) : op()
  await run(async () => {
    list.length = 0
    try {
      await db.messages.where('[chatId+createdAt]').between([chatId, Dexie.minKey], [chatId, Dexie.maxKey]).each(push)
    } catch (e) {
      list.length = 0
      await db.messages.where('chatId').equals(chatId).each(push)
    }
  })
  list.sort((a, b) => a.at - b.at || a.id - b.id)
  return list
}

function buildChatSearchSnippet(text, lower, kw) {
  const flat = text.replace(/[\r\n\t]/g, ' ')
  const idx = lower.indexOf(kw)
  if (idx < 0) return wcEscHtml(flat.slice(0, 80))
  const start = Math.max(0, idx - 18)
  const end = Math.min(flat.length, idx + kw.length + 60)
  return (start > 0 ? '…' : '')
    + wcEscHtml(flat.slice(start, idx))
    + '<mark>' + wcEscHtml(flat.slice(idx, idx + kw.length)) + '</mark>'
    + wcEscHtml(flat.slice(idx + kw.length, end))
    + (end < flat.length ? '…' : '')
}

async function openChatHistorySearch(chatPage, chatId, charId, settingsPage) {
  if (document.getElementById('chat-search-page')) return
  const page = document.createElement('div')
  page.id = 'chat-search-page'
  page.className = 'full-page chat-search-page'
  page.innerHTML = `
    <div class="page-header">
      <button class="header-back" id="cse-back" type="button"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">查找聊天记录</span>
    </div>
    <div class="cse-bar">
      <div class="cse-field">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input id="cse-input" type="search" placeholder="搜索" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false">
      </div>
    </div>
    <label class="cse-date-row">
      <span><i class="fa-regular fa-calendar"></i>按日期查找</span>
      <input id="cse-date" type="date">
    </label>
    <div class="cse-list" id="cse-list"><div class="cse-hint">正在读取聊天记录…</div></div>
  `
  window.openPage(page)
  const listEl = page.querySelector('#cse-list')
  const inputEl = page.querySelector('#cse-input')
  const dateEl = page.querySelector('#cse-date')
  page.querySelector('#cse-back').addEventListener('click', () => window.closePage('chat-search-page'))

  let index = []
  let ready = false
  let matches = []
  let shown = 0
  let kw = ''
  let charName = ''
  const selfName = (typeof _wechatUser !== 'undefined' && (_wechatUser?.nick || _wechatUser?.name)) || '我'

  const showHint = text => { listEl.innerHTML = `<div class="cse-hint">${wcEscHtml(text)}</div>` }
  const idleHint = () => showHint(index.length
    ? `输入关键词搜索这个聊天里的 ${index.length} 条消息，或选择日期直接跳转`
    : '这个聊天还没有可搜索的消息')

  const renderMore = () => {
    const slice = matches.slice(shown, shown + CHAT_SEARCH_PAGE_SIZE)
    shown += slice.length
    listEl.querySelector('.cse-more')?.remove()
    const html = slice.map(r => `
      <button class="cse-item" type="button" data-id="${r.id}">
        <div class="cse-item-top">
          <span class="cse-item-name">${wcEscHtml(r.self ? selfName : charName)}</span>
          <span class="cse-item-time">${formatChatSearchTime(r.at)}</span>
        </div>
        <div class="cse-item-text">${buildChatSearchSnippet(r.text, r.lower, kw)}</div>
      </button>`).join('')
    listEl.insertAdjacentHTML('beforeend', html)
    if (shown < matches.length) {
      listEl.insertAdjacentHTML('beforeend', `<button class="cse-more" type="button">显示更多（还有 ${matches.length - shown} 条）</button>`)
    }
  }

  const runSearch = () => {
    kw = inputEl.value.trim().toLowerCase()
    if (!ready) return
    if (!kw) { matches = []; shown = 0; idleHint(); return }
    matches = []
    for (let i = index.length - 1; i >= 0; i--) {
      if (index[i].lower.indexOf(kw) >= 0) matches.push(index[i])
    }
    shown = 0
    if (!matches.length) { showHint('没有找到相关的聊天记录'); return }
    listEl.innerHTML = `<div class="cse-count">共找到 ${matches.length} 条相关消息</div>`
    renderMore()
    listEl.scrollTop = 0
  }

  let timer = null
  let composing = false
  const schedule = () => { clearTimeout(timer); timer = setTimeout(runSearch, 180) }
  inputEl.addEventListener('compositionstart', () => { composing = true })
  inputEl.addEventListener('compositionend', () => { composing = false; schedule() })
  inputEl.addEventListener('input', () => { if (!composing) schedule() })
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inputEl.blur(); runSearch() } })

  const goTo = id => jumpToChatMessage(chatPage, chatId, id)
  listEl.addEventListener('click', e => {
    const more = e.target.closest('.cse-more')
    if (more) { renderMore(); return }
    const item = e.target.closest('.cse-item')
    if (item) goTo(parseInt(item.dataset.id, 10))
  })
  dateEl.addEventListener('change', () => {
    if (!ready || !dateEl.value) return
    const [y, mo, d] = dateEl.value.split('-').map(Number)
    const start = new Date(y, mo - 1, d).getTime()
    const end = new Date(y, mo - 1, d + 1).getTime()
    const hit = index.find(r => r.at >= start && r.at < end)
    if (!hit) { window.toast?.('这一天没有聊天记录'); return }
    goTo(hit.id)
  })

  try {
    const char = await getWechatDisplayCharacter(charId)
    charName = getWechatDisplayName(char)
    index = await buildChatSearchIndex(chatId, charName)
  } catch (e) {
    console.error('[chat-search] 读取聊天记录失败', e)
    showHint('读取聊天记录失败，请退出再试一次')
    return
  }
  ready = true
  if (index.length) {
    dateEl.min = formatChatSearchDateValue(index[0].at)
    dateEl.max = formatChatSearchDateValue(index[index.length - 1].at)
  }
  if (inputEl.value.trim()) runSearch()
  else idleHint()
}

function centerChatRow(container, row) {
  const cs = getComputedStyle(container)
  const top = parseFloat(cs.paddingTop) || 0
  const bottom = parseFloat(cs.paddingBottom) || 0
  const visibleH = container.clientHeight - top - bottom
  const cr = container.getBoundingClientRect()
  const rr = row.getBoundingClientRect()
  const target = rr.height >= visibleH ? top : top + (visibleH - rr.height) / 2
  container.scrollTop += (rr.top - cr.top) - target
}

function flashChatRow(row) {
  row.classList.remove('msg-jump-flash')
  void row.offsetWidth
  row.classList.add('msg-jump-flash')
  setTimeout(() => row.classList.remove('msg-jump-flash'), 2400)
}

function showChatJumpLatestBar(chatPage, container) {
  container.querySelector('.chat-jump-latest')?.remove()
  const wrap = document.createElement('div')
  wrap.className = 'chat-jump-latest'
  wrap.innerHTML = '<button type="button"><i class="fa-solid fa-angles-down"></i><span>回到最新消息</span></button>'
  wrap.querySelector('button').addEventListener('click', () => {
    refreshChat(chatPage, { scrollToBottom: true })
  })
  container.appendChild(wrap)
}

// 跳到某条消息并高亮：目标在当前列表里就直接滚过去；不在就以它为中心重新渲染一小段历史
async function jumpToChatMessage(chatPage, chatId, msgId) {
  const container = chatPage?.querySelector('#chat-messages')
  if (!container || !chatPage.isConnected || !msgId) return
  const rowSelector = `.msg-row[data-id="${msgId}"]`
  window.closePage('chat-search-page')
  window.closePage('chat-settings-page')
  let row = container.querySelector(rowSelector)
  if (!row) {
    try {
      const target = await db.messages.get(msgId)
      if (!target) { window.toast?.('这条消息已经不存在了'); return }
      const [before, after] = await Promise.all([
        getChatMessagesBefore(chatId, target, CHAT_JUMP_BEFORE),
        db.messages.where('[chatId+createdAt]')
          .between([chatId, target.createdAt], [chatId, Dexie.maxKey], true, true)
          .limit(CHAT_JUMP_AFTER).toArray()
      ])
      const map = new Map()
      before.concat(after).forEach(m => map.set(m.id, m))
      map.set(target.id, target)
      const pageMessages = [...map.values()].sort((a, b) =>
        (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0) || a.id - b.id)
      const load = () => loadChatMessages(chatPage, chatId, { pageMessages, jumpWindow: true })
      await (window.runWanWanDBRead ? window.runWanWanDBRead(load) : load())
    } catch (e) {
      console.error('[chat-search] 跳转失败', e)
      window.toast?.('跳转失败，请再试一次')
      return
    }
    row = container.querySelector(rowSelector)
  }
  if (!row) { window.toast?.('这条消息没有显示在聊天里'); return }
  let touched = false
  const markTouched = () => { touched = true }
  container.addEventListener('touchstart', markTouched, { once: true, passive: true })
  container.addEventListener('wheel', markTouched, { once: true, passive: true })
  centerChatRow(container, row)
  // 页面关闭动画期间位置可能还会变，图片加载后高度也会变：稍后再校正一次并高亮
  setTimeout(() => {
    const r = container.querySelector(rowSelector)
    if (!r) return
    if (!touched) centerChatRow(container, r)
    flashChatRow(r)
  }, 380)
  setTimeout(() => {
    const r = container.querySelector(rowSelector)
    if (r && !touched) centerChatRow(container, r)
  }, 1100)
}

// 点击「加载更早的消息」：往上再补一窗历史，保持当前滚动位置不跳
async function loadEarlierMessages(container) {
  if (!container || container._wechatLoadingEarlier) return
  const state = container._wechatRenderState
  const ctx = container._wechatRenderCtx
  if (!state || !ctx || state.oldestRenderedId == null) return
  const chatPage = document.getElementById('chat-window')
  const chatId = chatPage ? parseInt(chatPage.dataset.chatId) : null
  if (!chatId) return
  container._wechatLoadingEarlier = true
  try {
    const earlierBatch = await getChatMessagesBefore(chatId, {
      id: state.oldestRenderedId,
      createdAt: state.oldestRenderedAt
    }, WECHAT_RENDER_WINDOW)
    const earlier = earlierBatch.filter(m => parseMsgType(m.content, ctx.charName).type !== 'status-update')
    if (!earlier.length) { removeLoadEarlierButton(container); return }
    // 更早的消息里可能有 AI 发的表情包：按名字补图并并入当前映射表
    const extraStickers = await getStickerMapForMessages(chatId, earlier, ctx.charName)
    ctx.stickerMap = Object.assign({}, ctx.stickerMap, extraStickers)
    const earlierTraces = await getMcpToolTracesForConversation(
      'chat',
      chatId,
      Number(earlier[0]?.createdAt) || 0,
      Math.max(0, (Number(state.oldestRenderedAt) || 0) - 1)
    )

    let previousVisibleAt = null
    const rows = []
    buildWechatRenderTimeline(earlier, earlierTraces).forEach(item => {
      if (item.kind === 'mcp-trace') {
        rows.push(buildMcpTraceRowHTML(item.value))
        return
      }
      const m = item.value
      if (ctx.tsConfig.enabled && ctx.tsConfig.mode === 'center') {
        const createdAt = m.createdAt || 0
        if (createdAt && (!previousVisibleAt || createdAt - previousVisibleAt >= CHAT_TIME_GAP_MS)) {
          rows.push(buildCenterTimestampHTML(createdAt))
        }
      }
      const row = buildMsgRowHTML(m, ctx.charName, ctx.avatarHtml, ctx.selfAvatarHtml, ctx.stickerMap, ctx.tsConfig, ctx.bilingualSettings)
      if (row) rows.push(row)
      if (m.createdAt) previousVisibleAt = m.createdAt
    })

    // 记录插入前的滚动高度，插入后补偿，保证视口不跳动
    const prevHeight = container.scrollHeight
    const prevTop = container.scrollTop
    const btn = container.querySelector('.chat-load-earlier')
    const html = rows.join('')
    if (btn) btn.insertAdjacentHTML('afterend', html)
    else container.insertAdjacentHTML('afterbegin', html)
    hydrateWechatBlobImages(container)
    bindMcpTraceInteractions(container)
    earlier.forEach(m => {
      const row = container.querySelector(`.msg-row[data-id="${m.id}"]`)
      if (row) bindMsgLongPress(row, ctx.charId)
    })
    refreshMsgMultiSelectBindings(container)
    container.scrollTop = prevTop + (container.scrollHeight - prevHeight)

    state.ids = earlier.map(m => m.id).concat(state.ids)
    state.oldestRenderedId = earlier[0].id
    state.oldestRenderedAt = earlier[0].createdAt || state.oldestRenderedAt || null
    state.hasEarlier = await hasEarlierChatMessages(chatId, earlier[0])
    if (!state.hasEarlier) removeLoadEarlierButton(container)
    trimWechatRenderedTail(container, state)
  } finally {
    container._wechatLoadingEarlier = false
  }
}

// 「加载历史消息」持续往顶部插入后，若渲染行数超过上限，从底部（当前滚动位置看不到的一端）裁掉多余行，
// 防止长会话里反复翻历史导致 DOM 无上限增长、引发 iOS 微信内置浏览器因内存超限被系统杀掉重载
function trimWechatRenderedTail(container, state) {
  const rows = container.querySelectorAll('.msg-row[data-id]')
  if (rows.length <= WECHAT_RENDER_MAX_ROWS) return
  const overflow = rows.length - WECHAT_RENDER_MAX_ROWS
  const toRemove = Array.from(rows).slice(rows.length - overflow)
  const removeIds = new Set(toRemove.map(row => row.dataset.id))
  toRemove.forEach(row => {
    row.querySelectorAll('img[data-blob-ref]').forEach(img => forgetWechatBlobUrl(img.dataset.blobRef))
    row.remove()
  })
  if (state) state.ids = state.ids.filter(id => !removeIds.has(String(id)))
}

function buildLoadEarlierHTML() {
  return `<div class="chat-load-earlier"><button type="button" onclick="window.wechatLoadEarlier(this)"><i class="fa-solid fa-spinner"></i><span>加载历史消息</span></button></div>`
}

function removeLoadEarlierButton(container) {
  container.querySelector('.chat-load-earlier')?.remove()
}

window.wechatLoadEarlier = function(btn) {
  const container = btn?.closest('.chat-messages') || document.querySelector('#chat-window .chat-messages')
  if (container) loadEarlierMessages(container)
}

// 删除/修改单条消息后的局部 DOM 更新（不再整屏 force 重建，避免触发 iOS Safari 内存崩溃）。
// 命中已渲染行返回 true；行不在当前窗口（罕见）返回 false，调用方回退到整屏渲染。
function rerenderSingleMsgRow(container, msg) {
  const ctx = container?._wechatRenderCtx
  if (!ctx || !msg) return false
  const oldRow = container.querySelector(`.msg-row[data-id="${msg.id}"]`)
  if (!oldRow) return false
  const html = buildMsgRowHTML(msg, ctx.charName, ctx.avatarHtml, ctx.selfAvatarHtml, ctx.stickerMap, ctx.tsConfig, ctx.bilingualSettings)
  if (!html) { removeMsgRowFromDom(container, msg.id); return true }
  oldRow.insertAdjacentHTML('beforebegin', html)
  const newRow = oldRow.previousElementSibling
  oldRow.remove()
  hydrateWechatBlobImages(newRow)
  bindMsgLongPress(newRow, ctx.charId)
  refreshMsgMultiSelectBindings(container)
  return true
}

function removeMsgRowFromDom(container, msgId) {
  const row = container?.querySelector(`.msg-row[data-id="${msgId}"]`)
  if (!row) return false
  row.remove()
  const state = container._wechatRenderState
  if (state) {
    state.ids = state.ids.filter(id => String(id) !== String(msgId))
    state.oldestRenderedId = state.ids.length ? state.ids[0] : null
  }
  refreshMsgMultiSelectBindings(container)
  return true
}

function getMessageRenderSignature(charId, charName, stickerMap, timeSettings, bilingualSettings) {
  const time = normalizeChatTimeSettings(timeSettings)
  const bilingual = normalizeChatBilingualSettings(bilingualSettings)
  const stickerNames = Object.keys(stickerMap || {}).sort().join('|')
  return JSON.stringify({
    charId,
    charName,
    timeEnabled: time.enabled,
    timeMode: time.mode,
    bilingualEnabled: bilingual.enabled,
    bilingualSourceLang: bilingual.sourceLang,
    bilingualTargetLang: bilingual.targetLang,
    stickers: stickerNames
  })
}

function appendMessageRows(container, newMsgs, charName, avatarHtml, selfAvatarHtml, stickerMap, timeSettings, bilingualSettings, previousVisibleAt, charId, options = {}) {
  if (container.querySelector('.chat-empty')) container.innerHTML = ''
  let lastVisibleAt = previousVisibleAt || null
  const rows = []
  newMsgs.forEach(m => {
    if (timeSettings.enabled && timeSettings.mode === 'center') {
      const createdAt = m.createdAt || 0
      if (createdAt && (!lastVisibleAt || createdAt - lastVisibleAt >= CHAT_TIME_GAP_MS)) {
        rows.push(buildCenterTimestampHTML(createdAt))
      }
    }
    const row = buildMsgRowHTML(m, charName, avatarHtml, selfAvatarHtml, stickerMap, timeSettings, bilingualSettings)
    if (row) rows.push(row)
    if (m.createdAt) lastVisibleAt = m.createdAt
  })
  if (!rows.length) return
  container.insertAdjacentHTML('beforeend', rows.join(''))
  hydrateWechatBlobImages(container)
  newMsgs.forEach(m => {
    const row = container.querySelector(`.msg-row[data-id="${m.id}"]`)
    if (!row) return
    bindMsgLongPress(row, charId)
    watchMessageMediaForBottom(row, container, !!options.scrollToBottom, options.scrollRequestedAt)
  })
}

function syncExistingMessageDecorations(container, msgs) {
  msgs.forEach(m => {
    const row = container.querySelector(`.msg-row[data-id="${m.id}"]`)
    const avatarWrap = row?.querySelector('.msg-avatar-wrap[data-action="thoughts"], .msg-avatar-wrap.is-clickable')
    if (avatarWrap) {
      if (m.thought) avatarWrap.dataset.hasThought = '1'
      else delete avatarWrap.dataset.hasThought
    }
  })
}

function getChatScrollNow() {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()
}

function bindChatScrollIntentTracker(container) {
  if (!container || container._chatScrollIntentBound) return
  container._chatScrollIntentBound = true
  const markUserIntent = () => {
    container._chatUserScrollIntentAt = getChatScrollNow()
  }
  container.addEventListener('wheel', markUserIntent, { passive: true })
  container.addEventListener('touchstart', markUserIntent, { passive: true })
  container.addEventListener('pointerdown', markUserIntent, { passive: true })
}

function createChatAutoScrollRequest(container) {
  bindChatScrollIntentTracker(container)
  return getChatScrollNow()
}

function hasUserScrolledSince(container, requestedAt) {
  return !!(container?._chatUserScrollIntentAt && requestedAt && container._chatUserScrollIntentAt > requestedAt)
}

function scrollChatToBottom(container, options = {}) {
  if (!container) return
  const requestedAt = options.requestedAt || createChatAutoScrollRequest(container)
  const apply = () => {
    if (hasUserScrolledSince(container, requestedAt)) return
    container.scrollTop = container.scrollHeight
  }
  apply()
  requestAnimationFrame(apply)
  setTimeout(apply, 80)
  return requestedAt
}

function watchMessageMediaForBottom(root, container, shouldScroll, requestedAt = null) {
  if (!root || !container || !shouldScroll) return
  const scrollRequestedAt = requestedAt || createChatAutoScrollRequest(container)
  root.querySelectorAll('img').forEach(img => {
    if (img.dataset.chatBottomWatch === '1') return
    img.dataset.chatBottomWatch = '1'
    const scroll = () => {
      if (hasUserScrolledSince(container, scrollRequestedAt)) return
      scrollChatToBottom(container, { requestedAt: scrollRequestedAt })
    }
    img.addEventListener('load', scroll, { once: true })
    img.addEventListener('error', scroll, { once: true })
    if (img.complete) requestAnimationFrame(scroll)
  })
}

function buildCenterTimestampHTML(createdAt) {
  return `
    <div class="msg-row msg-time-center-row">
      <span class="msg-time-center">${formatWechatSmartTime(createdAt, { weekdayStyle: 'long' })}</span>
    </div>`
}

// 单条消息行HTML
function buildMsgRowHTML(m, charName, avatarHtml, selfAvatarHtml, stickerMap, timeSettings, bilingualSettings) {
  const isSelf = m.role === 'user'
  const parsed = parseMsgType(m.content, charName)
  if (parsed.type === 'status-update') return ''
  const bubbleHtml = renderBubbleHTML(m, isSelf, charName, stickerMap, bilingualSettings)
  if (!bubbleHtml) return ''
  // 居中系统提示：无头像
  if (parsed.type === 'transfer-resp' || parsed.type === 'recall' || parsed.type === 'system-note') {
    return `
      <div class="msg-row msg-system" data-id="${m.id}">
        ${bubbleHtml}
      </div>`
  }
  const thisAvatar = isSelf ? selfAvatarHtml : avatarHtml
  const allowBubbleTime = parsed.type === 'text'
  const timeHtml = allowBubbleTime ? buildMessageTimeHTML(m, isSelf, timeSettings) : ''
  const contentHtml = allowBubbleTime && timeSettings?.mode === 'inside'
    ? renderTextBubble(parsed.data.text, isSelf ? 'self' : 'other', timeHtml, isSelf, !isSelf ? bilingualSettings : null)
    : buildTimedBubbleHTML(bubbleHtml, timeHtml, isSelf, timeSettings)
  // 非自己消息：头像可点击查看角色心声历史；本轮第一条消息（带 thought 字段）显示提示点
  const avatarExtra = !isSelf
    ? ` data-action="thoughts"${m.thought ? ' data-has-thought="1"' : ''}`
    : ''
  const avatarPart = `<div class="msg-avatar-wrap${!isSelf ? ' is-clickable' : ''}"${avatarExtra}><div class="msg-avatar">${thisAvatar}</div></div>`
  const onlineStatus = isSelf ? buildOnlineMessageStatusHTML(m) : ''
  return `
    <div class="msg-row ${isSelf ? 'msg-self' : 'msg-other'}${getTimeModeClass(timeSettings)}" data-id="${m.id}">
      ${avatarPart}
      <div class="msg-content-wrap">${contentHtml}${onlineStatus}</div>
    </div>`
}

function buildOnlineMessageStatusHTML(message) {
  if (!message?.isOnlineMessage) return ''
  const labels = {
    sending: '发送中',
    sent: '未读',
    delivered: '已读',
    failed: '发送失败'
  }
  const status = message.onlineStatus || 'sending'
  if (status === 'failed') {
    return '<button class="online-message-status is-failed" type="button" ' +
      'onclick="window.WanWanOnline?.retryPendingMessages()">发送失败，点击重试</button>'
  }
  return `<span class="online-message-status is-${wcEscHtml(status)}">${labels[status] || labels.sending}</span>`
}

function getTimeModeClass(timeSettings) {
  if (!timeSettings?.enabled || timeSettings.mode === 'center') return ''
  return ` msg-time-mode-${timeSettings.mode}`
}

function buildMessageTimeHTML(m, isSelf, timeSettings) {
  if (!timeSettings?.enabled || timeSettings.mode === 'center' || !m.createdAt) return ''
  const cls = `msg-bubble-time msg-bubble-time-${timeSettings.mode} ${isSelf ? 'is-self' : 'is-other'}`
  return `<span class="${cls}">${formatWechatClockTime(m.createdAt)}</span>`
}

function buildTimedBubbleHTML(bubbleHtml, timeHtml, isSelf, timeSettings) {
  if (!timeHtml) return bubbleHtml
  if (timeSettings.mode === 'beside') {
    return `
      <div class="msg-time-beside-wrap">
        ${isSelf ? timeHtml : ''}
        ${bubbleHtml}
        ${!isSelf ? timeHtml : ''}
      </div>`
  }
  if (timeSettings.mode === 'inside') {
    return `
      <div class="msg-time-inside-wrap">
        ${bubbleHtml}
        ${timeHtml}
      </div>`
  }
  return bubbleHtml
}


const MSG_ACTION_TARGET_SELECTOR = [
  '.msg-bubble',
  '.quote-ref',
  '.voice-bubble',
  '.msg-card',
  '.msg-real-photo',
  '.msg-sticker'
].join(',')

function bindMessageActionTargets(container, contextFactory) {
  container.querySelectorAll(MSG_ACTION_TARGET_SELECTOR).forEach(target => {
    if (target.dataset.msgActionBound === '1') return
    target.dataset.msgActionBound = '1'
    let pressTimer
    let menuShown = false
    const row = target.closest('.msg-row')
    const msgId = row ? parseInt(row.dataset.id) : null
    if (!msgId || row.classList.contains('msg-system')) return
    const openMenu = () => {
      if (target.closest('.chat-window-page')?._multiSelectState) return
      menuShown = true
      showMsgMenu(target, msgId, contextFactory())
    }
    target.addEventListener('contextmenu', e => {
      e.preventDefault()
      openMenu()
    })
    target.addEventListener('touchstart', () => {
      pressTimer = setTimeout(openMenu, 600)
    }, { passive: false })
    target.addEventListener('touchend', () => clearTimeout(pressTimer))
    target.addEventListener('touchcancel', () => clearTimeout(pressTimer))
    target.addEventListener('touchmove', () => clearTimeout(pressTimer))
    target.addEventListener('click', e => {
      if (!menuShown) return
      menuShown = false
      e.preventDefault()
      e.stopPropagation()
    }, true)
  })
}

// 绑定长按菜单 + 头像点击查看角色心声
function bindMsgLongPress(container, charId) {
  const chatPage = container.closest('.chat-window-page')
  const chatId = chatPage?.dataset?.chatId ? parseInt(chatPage.dataset.chatId, 10) : null
  bindMessageActionTargets(container, () => ({ scope: 'chat', charId, chatId }))
    container.querySelectorAll('.call-record-bubble').forEach(bubble => {
    if (bubble.dataset.callBound === '1') return
    bubble.dataset.callBound = '1'
    bubble.addEventListener('click', () => {
      const msgId = Number(bubble.closest('.msg-row')?.dataset?.id)
      if (msgId) window.openCallRecordFromMessage?.(msgId)
    })
  })
  container.querySelectorAll('.link-card-taobao[data-taobao-url]').forEach(card => {
    if (card.dataset.taobaoBound === '1') return
    card.dataset.taobaoBound = '1'
    card.addEventListener('click', async e => {
      e.preventDefault()
      e.stopPropagation()
      if (!window.openTaobaoInternalLink) return
      const chatPage = card.closest('.chat-window-page')
      let viewerUid = null
      const chatId = chatPage?.dataset?.chatId ? parseInt(chatPage.dataset.chatId, 10) : null
      if (chatId) {
        const chat = await db.chats.get(chatId)
        viewerUid = chat?.ownerUid || null
      }
      await window.openTaobaoInternalLink(card.dataset.taobaoUrl, viewerUid)
    })
  })
  container.querySelectorAll('.msg-avatar-wrap[data-action="thoughts"]').forEach(wrap => {
    if (wrap.dataset.thoughtsBound === '1') return
    wrap.dataset.thoughtsBound = '1'
    wrap.addEventListener('click', () => {
      const cw = container.closest('.chat-window-page') || document.getElementById('chat-window')
      const chatId = cw ? parseInt(cw.dataset.chatId) : null
      if (!chatId) return
      showCharThoughtsHistory(charId, chatId)
    })
  })
}

// 按换行拆分用户输入：每一行 trim 后作为独立消息；空行丢弃
function splitMessageLines(text) {
  if (!text) return []
  return text.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
}

// 多行消息逐条出现的间隔
const SEND_BUBBLE_GAP_MS = 350
const _sleep = ms => new Promise(r => setTimeout(r, ms))

// 发送普通文字：换行 = 换一个气泡，且按节奏一条一条出现
async function sendTextMessage(chatPage) {
  const charId = parseInt(chatPage.dataset.charId)
  if (window.isCallActiveWith?.(charId)) {
    window.toast?.('通话中，无法发送消息')
    return
  }
  const input = chatPage.querySelector('#chat-input')
  const draft = input.value
  const lines = splitMessageLines(draft)
  if (!lines.length) return false
  const quoteState = chatPage._quoteState || null
  const base = Date.now()
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) await _sleep(SEND_BUBBLE_GAP_MS)
    const content = i === 0 && quoteState ? buildQuotedReplyContent(chatPage, quoteState, lines[i]) : lines[i]
    await addUserMsg(chatPage, content, base + i)
    await refreshChat(chatPage, { scrollToBottom: true })
  }
  if (input.value === draft) input.value = ''
  input.style.height = 'auto'
  if (quoteState) clearPendingQuote(chatPage)
  return true
}


// ===== 发送消息核心 =====
// 所有发送类操作（文本/语音/照片/转账/表情包/位置等）都只入库与刷新，
// 不会触发 AI 回复；AI 回复只能由魔法棒按钮显式触发。
function createPrivateMessageOperationId(chatId, role) {
  const random = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `local-${role || 'message'}-${_wechatUid || 'anonymous'}-${chatId}-${random}`
}

async function addPrivateMessageIdempotently(message) {
  const row = { ...(message || {}) }
  if (!row.clientMessageId) {
    row.clientMessageId = createPrivateMessageOperationId(row.chatId, row.role)
  }
  try {
    return await db.messages.add(row)
  } catch (error) {
    if (!window.isWanWanRecoverableDBError?.(error)) throw error
    try {
      await window.recoverWanWanDBConnection(error)
    } catch (recoveryError) {
      throw recoveryError
    }

    let existing = null
    try {
      existing = await db.messages.where('clientMessageId').equals(row.clientMessageId).first()
    } catch (lookupError) {
      if (window.isWanWanRecoverableDBError?.(lookupError)) {
        throw await window.createWanWanDBUnavailableError(lookupError)
      }
      throw lookupError
    }
    if (existing && Number(existing.chatId) === Number(row.chatId)) return existing.id

    try {
      return await db.messages.add(row)
    } catch (retryError) {
      if (!window.isWanWanRecoverableDBError?.(retryError)) throw retryError
      try {
        existing = await db.messages.where('clientMessageId').equals(row.clientMessageId).first()
      } catch (_) {}
      if (existing && Number(existing.chatId) === Number(row.chatId)) return existing.id
      throw await window.createWanWanDBUnavailableError(retryError)
    }
  }
}

async function updatePrivateMessageIdempotently(messageId, changes) {
  const update = () => db.messages.update(messageId, changes)
  return window.runWanWanDBIdempotentWrite
    ? await window.runWanWanDBIdempotentWrite(update)
    : await update()
}

async function addUserMsg(chatPage, content, createdAt, extra = null) {
  // 群聊：写入 db.groupMessages（senderId=用户），不走联机/私聊逻辑
  if (chatPage?.dataset?.groupId) {
    const groupId = parseInt(chatPage.dataset.groupId)
    const row = { groupId, senderId: _wechatUid, role: 'user', content, createdAt: createdAt ?? Date.now() }
    if (extra && typeof extra === 'object') Object.assign(row, extra)
    return await db.groupMessages.add(row)
  }
  const chatId = parseInt(chatPage.dataset.chatId)
  const charId = parseInt(chatPage.dataset.charId)
  const char = await db.characters.get(charId)
  const isOnlineFriend = char?.type === 'online_friend'
  const clientMessageId = isOnlineFriend
    ? (window.WanWanOnline?.createClientMessageId() || `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`)
    : createPrivateMessageOperationId(chatId, 'user')
  const msg = {
    chatId, charId, role: 'user', content, clientMessageId,
    createdAt: createdAt ?? Date.now()
  }
  if (extra && typeof extra === 'object') Object.assign(msg, extra)
  if (isOnlineFriend) {
    Object.assign(msg, {
      isOnlineMessage: true,
      clientMessageId,
      onlineStatus: 'sending',
      remoteWxAccount: char.onlineData?.wxAccount || char.identity?.account || '',
      messageType: getOnlineMessageType(msg),
      onlineExtra: getOnlineMessageExtra(extra)
    })
  }
  const localMessageId = await addPrivateMessageIdempotently(msg)
  clearPrivateReplyVersions(chatId)
  if (isOnlineFriend) {
    try {
      if (!window.WanWanOnline) throw new Error('联机模块未加载')
      await window.WanWanOnline.sendPrivateMessage({
        localMessageId,
        clientMessageId,
        toWxAccount: msg.remoteWxAccount,
        messageType: msg.messageType,
        content,
        extra: msg.onlineExtra,
        clientCreatedAt: msg.createdAt
      })
    } catch (err) {
      window.toast?.(err.message || '联机消息发送失败')
    }
  }
  return localMessageId
}

function getOnlineMessageType(message) {
  if (message?.stickerImage) return 'sticker'
  if (message?.imageUrl || message?.imageBlobId) return 'image'
  if (/语音[：:]/.test(message?.content || '')) return 'voice'
  return 'text'
}

function getOnlineMessageExtra(extra) {
  if (!extra || typeof extra !== 'object') return {}
  const blocked = new Set(['id', 'chatId', 'charId', 'role', 'createdAt', 'clientMessageId', 'serverMessageId'])
  const result = {}
  Object.keys(extra).forEach(key => {
    if (blocked.has(key)) return
    const value = extra[key]
    if (typeof value === 'function' || value instanceof Blob) return
    try {
      JSON.stringify(value)
      result[key] = value
    } catch (e) {}
  })
  return result
}

async function sendUserMsg(chatPage, content, extra = null) {
  await addUserMsg(chatPage, content, undefined, extra)
  await refreshChat(chatPage, { scrollToBottom: true })
}

function clonePrivateReplyMessage(message) {
  const clone = {}
  Object.keys(message || {}).forEach(key => {
    if (['id', 'chatId', 'charId', 'role', 'createdAt'].includes(key)) return
    const value = message[key]
    if (typeof value === 'function' || value instanceof Blob) return
    try { clone[key] = structuredClone(value) } catch (_) {
      try { clone[key] = JSON.parse(JSON.stringify(value)) } catch (_) {}
    }
  })
  return clone
}

function getPrivateReplyVersions(chatId) {
  return _privateReplyVersions.get(Number(chatId)) || []
}

function clearPrivateReplyVersions(chatId) {
  _privateReplyVersions.delete(Number(chatId))
}

function savePrivateReplyVersion(chatId, messages) {
  if (!messages?.length) return null
  const snapshots = messages.map(clonePrivateReplyMessage)
  const fingerprint = JSON.stringify(snapshots)
  const versions = getPrivateReplyVersions(chatId).slice()
  const existing = versions.find(version => version.fingerprint === fingerprint)
  if (existing) return existing
  const version = {
    id: `reply-version-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    savedAt: Date.now(),
    fingerprint,
    messages: snapshots
  }
  versions.push(version)
  _privateReplyVersions.set(Number(chatId), versions)
  return version
}

async function getTrailingAssistantBatch(chatId) {
  const messages = await db.messages.where('chatId').equals(Number(chatId)).sortBy('createdAt')
  if (!messages.length || messages[messages.length - 1].role !== 'assistant') return []
  let start = messages.length - 1
  while (start > 0 && messages[start - 1].role === 'assistant') start--
  return messages.slice(start)
}

async function deleteTrailingAssistantBatch(chatId) {
  const batch = await getTrailingAssistantBatch(chatId)
  if (!batch.length) return []
  await db.messages.bulkDelete(batch.map(message => message.id))
  return batch
}

async function restorePrivateReplyVersion(chatPage, version) {
  const chatId = parseInt(chatPage.dataset.chatId)
  const charId = parseInt(chatPage.dataset.charId)
  if (isAIReplyPending('chat', chatId)) {
    window.toast?.('正在回复中，请稍后再试')
    return false
  }
  await deleteTrailingAssistantBatch(chatId)
  const base = Date.now()
  for (let index = 0; index < version.messages.length; index++) {
    await addPrivateMessageIdempotently({
      ...clonePrivateReplyMessage(version.messages[index]),
      chatId,
      charId,
      role: 'assistant',
      clientMessageId: createPrivateMessageOperationId(chatId, 'assistant-restore'),
      createdAt: base + index
    })
  }
  await refreshChat(chatPage, { scrollToBottom: true })
  return true
}

function showRetryReplyModal(chatPage) {
  const chatId = parseInt(chatPage.dataset.chatId)
  const charId = parseInt(chatPage.dataset.charId)
  ;(async () => {
    if (isAIReplyPending('chat', chatId)) {
      window.toast?.('正在回复中，请稍后再试')
      return
    }
    const currentBatch = await getTrailingAssistantBatch(chatId)
    if (!currentBatch.length) {
      window.toast?.('暂无可重回的角色回复')
      return
    }
    const sheet = wcMakeSheet(`
      <div class="sheet-title">重回</div>
      <div class="retry-reply-body">
        <textarea class="input-field" id="retry-reply-requirement" rows="5" placeholder="输入本次回复要求（可留空）"></textarea>
      </div>
      <div class="sheet-actions">
        <button class="btn-ghost btn-full" id="retry-reply-cancel" type="button">取消</button>
        <button class="btn-pill btn-full" id="retry-reply-confirm" type="button">重新回复</button>
      </div>
    `)
    const overlay = wcAttachSheet(sheet)
    const close = () => closeWcSheetCore(overlay, sheet)
    overlay.addEventListener('click', close)
    sheet.querySelector('#retry-reply-cancel').addEventListener('click', close)
    sheet.querySelector('#retry-reply-confirm').addEventListener('click', async event => {
      if (isAIReplyPending('chat', chatId)) {
        window.toast?.('正在回复中，请稍后再试')
        return
      }
      const confirmButton = event.currentTarget
      confirmButton.disabled = true
      const latestBatch = await getTrailingAssistantBatch(chatId)
      if (!latestBatch.length) {
        window.toast?.('暂无可重回的角色回复')
        close()
        return
      }
      const requirement = sheet.querySelector('#retry-reply-requirement').value.trim()
      savePrivateReplyVersion(chatId, latestBatch)
      await db.messages.bulkDelete(latestBatch.map(message => message.id))
      await refreshChat(chatPage, { scrollToBottom: true })
      close()
      startPrivateAIReply(chatId, charId, {
        replyRequirement: requirement,
        captureReplyVersion: true
      })
    })
    setTimeout(() => sheet.querySelector('#retry-reply-requirement')?.focus(), 80)
  })()
}

function getPrivateReplyPreview(message) {
  const content = String(message?.content || '').trim()
  if (!content) return '（空消息）'
  if (content.startsWith('__IMG__')) return '［图片］'
  return content.length > 180 ? content.slice(0, 180) + '…' : content
}

function showReplyHistoryModal(chatPage) {
  const chatId = parseInt(chatPage.dataset.chatId)
  const versions = getPrivateReplyVersions(chatId).slice().reverse()
  const sheet = wcMakeSheet(`
    <div class="sheet-title">历史回复</div>
    <div class="reply-history-list">
      ${versions.length ? versions.map((version, index) => `
        <div class="reply-history-version">
          <div class="reply-history-heading">版本 ${versions.length - index}</div>
          <div class="reply-history-messages">
            ${version.messages.map(message => `<div class="reply-history-message">${wcEscHtml(getPrivateReplyPreview(message))}</div>`).join('')}
          </div>
          <button class="btn-ghost btn-full reply-history-restore" data-version-id="${version.id}" type="button">替换为此版本</button>
        </div>
      `).join('') : '<div class="reply-history-empty">暂无历史回复</div>'}
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="reply-history-close" type="button">关闭</button>
    </div>
  `)
  sheet.classList.add('reply-history-modal')
  const overlay = wcAttachSheet(sheet)
  const close = () => closeWcSheetCore(overlay, sheet)
  overlay.addEventListener('click', close)
  sheet.querySelector('#reply-history-close').addEventListener('click', close)
  sheet.querySelectorAll('.reply-history-restore').forEach(button => {
    button.addEventListener('click', async () => {
      const version = getPrivateReplyVersions(chatId).find(item => item.id === button.dataset.versionId)
      if (!version) return
      button.disabled = true
      const restored = await restorePrivateReplyVersion(chatPage, version)
      if (restored) close()
      else button.disabled = false
    })
  })
}

// AI "换行 = 独立气泡"渲染：拆分后逐条入库 + 节奏出现
// 同时并行生成"角色心声"，挂在本轮第一条 AI 消息上，供点击头像查看
function startPrivateAIReply(chatId, charId, options = {}) {
  if (isAIReplyPending('chat', chatId)) return null
  const key = _aiKey('chat', chatId)
  _pendingAIReplies.add(key)
  applyTypingUI('chat', chatId, true)
  const task = (async () => {
    let firstMsgId = null
    let popupShown = false
    let notifiableCount = 0
    let lastNotifiable = null
    let errorShown = false
    try {
      if (window.runWanWanDBRead) {
        await window.runWanWanDBRead(() => db.config.limit(1).toArray())
      }
      const notify = await getChatMsgNotifySettings(chatId)
      const thoughtTemplate = await getChatThoughtTemplateConfig(chatId)
      const _aiResult = await generateAIReply(chatId, charId, {
        replyRequirement: options.replyRequirement,
        idleTriggerMode: options.idleTriggerMode,
        idleMinutes: options.idleMinutes,
        impulseHint: options.impulseHint,
        allowMcp: options.allowMcp === true
      })
      let { thought, status, reply } = _aiResult
      if (thoughtTemplate.enabled) {
        if (!thought || !String(thought).trim()) {
          const char = await window.getCharacter(charId)
          const userText = await getLatestUserBatchText(chatId)
          try {
            thought = char
              ? await generateCharThought(char, userText || '（在等你开口。）', thoughtTemplate)
              : '……'
          } catch (e) {
            console.warn('[wechat] 心声补全失败', e)
            thought = '……'
          }
          thought = String(thought || '').trim().slice(0, _WECHAT_THOUGHT_MAX)
        }
      } else {
        thought = null
      }
      await updateCharacterStatusFromAI(chatId, charId, status)
      await applyCharScheduleFromReply(chatId, charId, _aiResult)
      await applyShopApprovalFromReply(chatId, _aiResult)
      _activeReplyFailCount.delete(chatId)
      // 套话句式润色（文风守卫）：特殊消息行 [xx的语音：…] 等原样保留，只改命中的普通文字行，失败就用原文
      if (window.ProseGuard && window.ProseGuard.isEnabled('wechat') && typeof reply === 'string') {
        try {
          const pg = await window.ProseGuard.polishText(reply, { allow: 1, maxUnits: 4, protect: [/^\[[^\n]*\]$/m] })
          if (pg.fixed) reply = pg.text
        } catch (e) { console.warn('[wechat] 文风润色失败，使用原文', e) }
      }
      const lines = splitMessageLines(reply)
      const base = Date.now()
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) await _sleep(SEND_BUBBLE_GAP_MS)
        const parsed = parseMsgType(lines[i])
        if (parsed.type === 'status-update') {
          await updateCharacterStatusFromAI(chatId, charId, parsed.data.status)
          continue
        }
        if (parsed.type === 'initiate-call') {
          const isVideo = parsed.data.callType === '视频通话'
          setTimeout(() => {
            if (isVideo) window.startVideoCall?.(chatId, charId, 'char')
            else window.startVoiceCall?.(chatId, charId, 'char')
          }, 500)
          continue
        }
        const id = await addPrivateMessageIdempotently({
          chatId, charId, role: 'assistant',
          clientMessageId: createPrivateMessageOperationId(chatId, 'assistant'),
          content: lines[i], createdAt: base + i
        })
        if (!firstMsgId) firstMsgId = id
        notifiableCount++
        lastNotifiable = { content: lines[i], createdAt: base + i }
        autoGenerateVoiceIfNeeded(chatId, id, lines[i])
        maybeGenerateImage({ id, content: lines[i] }, chatId)
        await notifyPrivateAIMessageIfBackground(chatId, charId, lines[i], base + i)
        const canPopup = notify.enabled && document.visibilityState === 'visible'
                         && !_getVisibleChatWindow('chat', chatId)
        if (canPopup && notify.mode === 'all') {
          await showPrivateAIMessagePopupIfNeeded(chatId, charId, lines[i], base + i)
        } else if (canPopup && notify.mode === 'first' && !popupShown) {
          popupShown = true
          await showPrivateAIMessagePopupIfNeeded(chatId, charId, lines[i], base + i)
        }
        const cw = _getVisibleChatWindow('chat', chatId)
        if (cw) await refreshChat(cw, { scrollToBottom: true })
      }
      if (notify.enabled && document.visibilityState === 'visible'
          && !_getVisibleChatWindow('chat', chatId) && lastNotifiable) {
        if (notify.mode === 'last') {
          await showPrivateAIMessagePopupIfNeeded(chatId, charId, lastNotifiable.content, lastNotifiable.createdAt)
        } else if (notify.mode === 'count') {
          if (notifiableCount > 1) {
            await showPrivateAIMessagePopupIfNeeded(chatId, charId, null, null, `发来 ${notifiableCount} 条消息`)
          } else {
            await showPrivateAIMessagePopupIfNeeded(chatId, charId, lastNotifiable.content, lastNotifiable.createdAt)
          }
        }
      }
      if (firstMsgId && thought) {
        const thoughtUpdate = { thought, thoughtAt: Date.now() }
        const displayChar = await getWechatDisplayCharacter(charId)
        const renderedThought = renderThoughtForStorage(thought, thoughtTemplate, getWechatDisplayName(displayChar), displayChar)
        if (renderedThought) Object.assign(thoughtUpdate, renderedThought)
        const updateThought = () => db.messages.update(firstMsgId, thoughtUpdate)
        if (window.runWanWanDBIdempotentWrite) await window.runWanWanDBIdempotentWrite(updateThought)
        else await updateThought()
        const cw = _getVisibleChatWindow('chat', chatId)
        if (cw) await refreshChat(cw, { scrollToBottom: true })
      }
      if (options.captureReplyVersion && firstMsgId) {
        const batch = await getTrailingAssistantBatch(chatId)
        if (batch.length) savePrivateReplyVersion(chatId, batch)
      }
      if (window.WanWanMemory?.summarizeIfNeeded) {
        setTimeout(() => {
          window.WanWanMemory.summarizeIfNeeded(chatId, charId, _wechatUid)
        }, 0)
      }
    } catch (e) {
      const cw = _getVisibleChatWindow('chat', chatId)
      if (cw) {
        errorShown = true
        showApiErrorModal(e.message || String(e), e.diagnostic)
      }
      else console.warn('[wechat] AI 回复失败:', e)
      if (e.diagnostic) console.warn('[wechat] AI 回复诊断:', e.diagnostic)
      // 主动回复失败：10 分钟后重试，最多连续 3 次（以前失败后会一直等到下一条新消息才可能再触发）
      if (options.idleTriggerMode) {
        const fails = (_activeReplyFailCount.get(chatId) || 0) + 1
        _activeReplyFailCount.set(chatId, fails)
        if (fails < 3) {
          _activeReplyTriggeredFingerprints.delete(chatId)
          _activeReplyRetryAfter.set(chatId, Date.now() + 10 * 60 * 1000)
        }
        if (options.scheduleDueId) {
          try {
            const d = await charScheduleLoad()
            const ev = d.events.find(x => x.id === options.scheduleDueId)
            if (ev) { delete ev.notifiedAt; await charScheduleSave(d) }
          } catch (_) {}
        }
      }
    } finally {
      _pendingAIReplies.delete(key)
      applyTypingUI('chat', chatId, false)
      const cw = _getVisibleChatWindow('chat', chatId)
      if (cw) {
        try {
          await refreshChat(cw, { scrollToBottom: true })
        } catch (refreshError) {
          console.warn('[wechat] AI 回复结束刷新失败:', refreshError)
          if (!errorShown) showApiErrorModal(refreshError.message || String(refreshError), refreshError.diagnostic)
        }
      }
    }
  })()
  return task
}

async function updateCharacterStatusFromAI(chatId, charId, rawStatus) {
  const status = String(rawStatus || '').trim().slice(0, 15)
  if (!status) return
  const updateStatus = () => db.characters.update(charId, { status, statusUpdatedAt: Date.now() })
  if (window.runWanWanDBIdempotentWrite) await window.runWanWanDBIdempotentWrite(updateStatus)
  else await updateStatus()
  if (window.refreshCharCache) await window.refreshCharCache(charId)
  const cw = _getVisibleChatWindow('chat', chatId)
  if (cw) await applyChatHeaderStatus(cw, chatId, charId)
}

// 取最新一批连续的用户消息（即用户在 AI 上次回复之后说过的全部内容）
async function getLatestUserBatchText(chatId) {
  const batchSize = 50
  let msgs = await readWechatContextRows(() => getChatRecentMessages(chatId, batchSize))
  while (msgs.length === batchSize && msgs[0]?.role === 'user') {
    const older = await readWechatContextRows(() => getChatMessagesBefore(chatId, msgs[0], batchSize))
    if (!older.length) break
    msgs = older.concat(msgs)
    if (older.some(message => message.role !== 'user')) break
  }
  const batch = []
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i]
    if (m.role === 'user') batch.unshift(m.content || '')
    else if (batch.length) break
  }
  return batch.join(' / ').slice(0, 300)
}

// 生成角色心声（基于用户最近发言）
async function generateCharThought(char, userText, templateConfig) {
  const cfg = normalizeThoughtTemplateConfig(templateConfig)
  const charName = char?.nick || char?.name || '角色'
  const templateRule = cfg.enabled && cfg.promptSuffix
    ? `\n\n本次必须按以下要求生成心声原文：${cfg.promptSuffix}\n这些内容只输出为心声本身，不要写进聊天回复。`
    : ''
  const prompt = `你扮演${charName}，性格：${char.description?.slice(0, 200) || ''}。刚才用户回复了"${userText}"，请用第一人称写出${charName}此刻的内心独白（${_WECHAT_THOUGHT_MAX}字以内）。直接给出独白本身，不要加引号、不要加旁白说明。${templateRule}`
  const result = await window.callAI([{ role: 'user', content: prompt }])
  // 去掉 AI 可能附加的引号 / 前缀
  return (result || '').trim().replace(/^["'""''「」]+|["'""''「」]+$/g, '').trim()
}

const _WECHAT_THOUGHT_MAX = 2000

// 供支持 OpenAI 式 strict json_schema 的网关使用
const _WECHAT_AI_JSON_SCHEMA = {
  name: 'wechat_ai_reply',
  schema: {
    type: 'object',
    properties: {
      chain: { type: 'string', description: '思维链；若无则空字符串' },
      thought: { type: 'string', description: '短内心独白' },
      status: { type: 'string', description: '更新当前状态，必须简洁，约1-15字' },
      reply: { type: 'string', description: '发给用户的内容，多行用换行' }
    },
    required: ['reply'],
    additionalProperties: false
  }
}

function _tryParseJsonObject(s) {
  if (!s) return null
  try {
    const o = JSON.parse(s)
    if (o && typeof o === 'object' && !Array.isArray(o)) return o
  } catch (_) {}
  return null
}

// 修复常见 JSON 小错误：字符串字面量内的裸换行/控制字符转义、尾逗号删除
function _wcRepairJsonText(s) {
  let out = ''
  let inString = false
  let escaped = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inString) {
      if (escaped) { out += ch; escaped = false; continue }
      if (ch === '\\') { out += ch; escaped = true; continue }
      if (ch === '"') { out += ch; inString = false; continue }
      if (ch === '\n') { out += '\\n'; continue }
      if (ch === '\r') { out += '\\r'; continue }
      if (ch === '\t') { out += '\\t'; continue }
      if (ch.charCodeAt(0) < 0x20) continue
      out += ch
      continue
    }
    if (ch === '"') { out += ch; inString = true; continue }
    if (ch === ',') {
      let j = i + 1
      while (j < s.length && /\s/.test(s[j])) j++
      if (s[j] === '}' || s[j] === ']') continue
      out += ch
      continue
    }
    out += ch
  }
  return out
}

// 从文本任意位置提取第一个配对完整的 {...} 子串；不完整（被截断）时返回从 { 到结尾的部分
function _wcSliceJsonObject(text) {
  const start = text.indexOf('{')
  if (start < 0) return null
  let inString = false
  let escaped = false
  let depth = 0
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) { escaped = false; continue }
      if (ch === '\\') { escaped = true; continue }
      if (ch === '"') inString = false
      continue
    }
    if (ch === '"') { inString = true; continue }
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return { slice: text.slice(start, i + 1), truncated: false }
    }
  }
  return { slice: text.slice(start), truncated: true }
}

// 补全被截断的 JSON：闭合未结束的字符串、去掉悬空逗号/冒号、补齐右括号
function _wcCompleteTruncatedJson(s) {
  let inString = false
  let escaped = false
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inString) {
      if (escaped) { escaped = false; continue }
      if (ch === '\\') { escaped = true; continue }
      if (ch === '"') inString = false
      continue
    }
    if (ch === '"') { inString = true; continue }
    if (ch === '{' || ch === '[') depth++
    else if (ch === '}' || ch === ']') depth--
  }
  let out = s
  if (escaped) out = out.slice(0, -1)
  if (inString) out += '"'
  out = out.replace(/[\s,:]+$/, '')
  while (depth > 0) { out += '}'; depth-- }
  return out
}

function _wcUnescapeJsonString(s) {
  try {
    return JSON.parse('"' + s.replace(/\r\n|\r|\n/g, '\\n').replace(/\t/g, '\\t') + '"')
  } catch (_) {
    return s
      .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
      .replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  }
}

// 正则字段抢救：JSON 无法解析时直接从文本中抠出各字段值（允许字符串未闭合）
function _wcRegexSalvageFields(text) {
  const pick = key => {
    const m = text.match(new RegExp('"' + key + '"\\s*:\\s*"((?:[^"\\\\]|\\\\[\\s\\S])*)'))
    return m ? _wcUnescapeJsonString(m[1]) : ''
  }
  const reply = pick('reply')
  if (!reply.trim()) return null
  return { reply, thought: pick('thought'), status: pick('status') }
}

function _wcStripCodeFences(s) {
  return s.replace(/```[a-z]*\s*\n?/gi, '').replace(/```/g, '').trim()
}
// 修复 JSON 字符串里未转义的英文双引号（角色用 [引用"我：原话"并回复：…] 格式时极易出现）、
// 裸换行、尾逗号，并补全被截断的结尾；顶层对象结束后的多余文字会被丢掉
function _wcRepairInnerQuotes(text) {
  const start = text.indexOf('{')
  if (start < 0) return null
  let out = ''
  let inString = false
  let escaped = false
  const stack = []
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) { out += ch; escaped = false; continue }
      if (ch === '\\') { out += ch; escaped = true; continue }
      if (ch === '"') {
        // 引号后面第一个非空白字符是 : } ] 或者 ", 下一个键/值" 时，才算字符串真正结束
        let j = i + 1
        while (j < text.length && /\s/.test(text[j])) j++
        const nx = text[j]
        let isEnd = nx === undefined || nx === ':' || nx === '}' || nx === ']'
        if (!isEnd && nx === ',') {
          let k = j + 1
          while (k < text.length && /\s/.test(text[k])) k++
          isEnd = k >= text.length || /["{\[\]}]/.test(text[k])
        }
        if (isEnd) { inString = false; out += ch } else { out += '\\"' }
        continue
      }
      if (ch === '\n') { out += '\\n'; continue }
      if (ch === '\r') continue
      if (ch === '\t') { out += '\\t'; continue }
      if (ch.charCodeAt(0) < 0x20) continue
      out += ch
      continue
    }
    if (ch === '"') { inString = true; out += ch; continue }
    if (ch === '{' || ch === '[') { stack.push(ch); out += ch; continue }
    if (ch === '}' || ch === ']') {
      stack.pop()
      out += ch
      if (!stack.length) break
      continue
    }
    out += ch
  }
  if (inString) out += '"'
  out = out.replace(/[\s,:]+$/, '')
  while (stack.length) out += stack.pop() === '{' ? '}' : ']'
  return out.replace(/,\s*([}\]])/g, '$1')
}
function extractAIJson(text) {
  if (!text) return null
  const s = text.trim()
  // 1. 整段直接解析
  const direct = _tryParseJsonObject(s)
  if (direct) return direct
  // 2. 文本任意位置的代码围栏块
  const candidates = []
  const fenced = s.match(/```(?:json)?\s*\n?([\s\S]*?)```/i)
  if (fenced && fenced[1]) {
    const inner = fenced[1].trim()
    const o = _tryParseJsonObject(inner)
    if (o) return o
    candidates.push(inner)
  }
  candidates.push(s)
 
  // 2.5 字符串里有未转义的英文双引号（引用原话时常见）→ 修复后再解析，避免被后面的“正则抢救”截断
  for (const cand of candidates) {
    const fixed = _wcRepairInnerQuotes(cand)
    const o = fixed && _tryParseJsonObject(fixed)
    if (o) return o
  }

  // 3-5. 括号配对提取 → 修复重试 → 截断补全
  for (const cand of candidates) {
    const sliced = _wcSliceJsonObject(cand)
    if (!sliced) continue
    const repaired = _wcRepairJsonText(sliced.slice)
    const o = _tryParseJsonObject(sliced.slice) || _tryParseJsonObject(repaired)
    if (o) return o
    const completed = _tryParseJsonObject(_wcCompleteTruncatedJson(repaired))
    if (completed) return completed
  }
  // 6. 正则字段抢救
  const salvaged = _wcRegexSalvageFields(s)
  if (salvaged) return salvaged
  // 7. 纯文本兜底：没有 JSON 结构时把整段文本当作 reply；
  //    含 "reply" 键名的 JSON 残骸不能直接当消息发出去
  if (/"reply"/.test(s)) return null
  const plain = _wcStripCodeFences(s)
  if (plain) return { reply: plain }
  return null
}

function _cleanThoughtDecor(s) {
  return (s || '').trim().replace(/^["'""''「」]+|["'""''「」]+$/g, '').trim()
}
// 模型有时会把特殊消息（引用 / 语音 / 位置等）和后面的普通话写在同一行，整行就被当成普通文字显示出来。
// 这里在"一条完整的特殊消息"后面补一个换行，让它们各自成为独立的气泡。
function _wcSeparateTrailingSpecialMessage(line) {
  const s = String(line || '').trim()
  if (!s.startsWith('[')) return s
  let idx = s.indexOf(']')
  while (idx !== -1) {
    const tail = s.slice(idx + 1).trim()
    if (!tail) return s
    const head = s.slice(0, idx + 1)
    // 括号必须成对（引用的原话或回复里可能自带 [笑] 这样的方括号）
    const balanced = (head.match(/\[/g) || []).length === (head.match(/\]/g) || []).length
    if (balanced && parseMsgType(head).type !== 'text') {
      return head + '\n' + _wcSeparateTrailingSpecialMessage(tail)
    }
    idx = s.indexOf(']', idx + 1)
  }
  return s
}
 
// ===== 语音消息格式兜底 =====
// 模型常见的写坏方式：语音块夹在普通文字中间、冒号写成英文、括号全半角混用、结尾漏掉 ]。
// 这里先把每个语音块修回标准的 [某某的语音：内容]，并让它独占一行，再交给后面的拆分逻辑。
const _WC_VOICE_OPEN_RE = /[\[［【(（]\s*([^\s\[\]［］【】()（）:：，。！？、]{1,20}?)\s*的\s*语音\s*[:：︰﹕]\s*/g

// 语音内容里，开头或句末标点后面的 (语气) / （语气） / [语气] 修回 【语气】
function _wcFixVoiceTags(text) {
  return String(text || '').replace(/(^|[。！？!?…~～，,、\s])[(（]\s*([^()（）\[\]【】\n]{1,10}?)\s*[)）]/g, '$1【$2】')
}

function _wcNormalizeVoiceLine(line) {
  const src = String(line || '')
  if (!/的\s*语音\s*[:：︰﹕]/.test(src)) return src
  // 找出所有语音块的起点
  const starts = []
  _WC_VOICE_OPEN_RE.lastIndex = 0
  let m
  while ((m = _WC_VOICE_OPEN_RE.exec(src))) {
    starts.push({ index: m.index, contentStart: m.index + m[0].length, name: m[1] })
  }
  if (!starts.length) return src
  const out = []
  let cursor = 0
  for (let i = 0; i < starts.length; i++) {
    const st = starts[i]
    if (st.index < cursor) continue
    const before = src.slice(cursor, st.index).trim()
    if (before) out.push(before)
    const limit = i + 1 < starts.length ? starts[i + 1].index : src.length
    // 从内容起点往后找结尾的 ]：【】标签内部的括号不算，内容里成对的 [笑] 不算
    let tagOpen = false
    let depth = 0
    let end = -1
    // 外层括号如果写成了 【】 或 ()，对应的右括号也算结尾
    const opener = src[st.index]
    const altClose = opener === '【' ? '】' : opener === '(' ? ')' : opener === '（' ? '）' : ''
    for (let k = st.contentStart; k < limit; k++) {
      const ch = src[k]
      if (altClose && ch === altClose && !tagOpen && depth === 0) { end = k; break }
      if (ch === '【') tagOpen = true
      else if (ch === '】') tagOpen = false
      else if (tagOpen) continue
      else if (ch === '[' || ch === '［') depth++
      else if (ch === ']' || ch === '］') {
        if (depth > 0) depth--
        else { end = k; break }
      }
    }
    let content
    if (end === -1) {
      // 没写结尾 ]：到下一个语音块之前，或到这一行结束
      content = src.slice(st.contentStart, limit)
      cursor = limit
    } else {
      content = src.slice(st.contentStart, end)
      cursor = end + 1
    }
    content = _wcFixVoiceTags(content.trim())
    if (content) out.push(`[${st.name}的语音：${content}]`)
  }
  const tail = src.slice(cursor).trim()
  if (tail) out.push(tail)
  return out.join('\n')
}

function _wcNormalizeVoiceFormat(reply) {
  return String(reply || '').split(/\r?\n/).map(_wcNormalizeVoiceLine).join('\n')
}

function _wcSeparateSpecialMessages(reply) {
  return String(reply || '').split(/\r?\n/).map(_wcSeparateTrailingSpecialMessage).join('\n')
}
function normalizeWechatAIFields(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('AI 返回格式异常，请重新发送一次')
  }
  let reply = parsed.reply
  if (typeof reply !== 'string') {
    throw new Error('AI 返回格式异常，请重新发送一次')
  }
  let thought = typeof parsed.thought === 'string' ? parsed.thought : ''
  let status = typeof parsed.status === 'string' ? parsed.status : ''
  reply = reply.trim()
  reply = _wcNormalizeVoiceFormat(reply)
  reply = _wcSeparateSpecialMessages(reply)
  thought = _cleanThoughtDecor(thought)
  status = status.trim().slice(0, 15)
  if (!reply) throw new Error('AI 返回格式异常，请重新发送一次')
  const visibleLines = splitMessageLines(reply).filter(line => parseMsgType(line).type !== 'status-update')
  if (!visibleLines.length) throw new Error('AI 返回格式异常，请重新发送一次')
  if (thought.length > _WECHAT_THOUGHT_MAX) thought = thought.slice(0, _WECHAT_THOUGHT_MAX)

  let event = null
  if (parsed.event && typeof parsed.event === 'object' && !Array.isArray(parsed.event)) {
    event = {
      title: typeof parsed.event.title === 'string' ? parsed.event.title : '',
      start_in_minutes: parsed.event.start_in_minutes,
      duration_minutes: parsed.event.duration_minutes
    }
  }
  const eventDone = parsed.event_done === true || parsed.event_done === 'true'
  let approval = null
  if (parsed.approval && typeof parsed.approval === 'object' && !Array.isArray(parsed.approval)) {
    approval = { title: String(parsed.approval.title || ''), decision: String(parsed.approval.decision || '') }
  }
  return { thought, status, reply, event, eventDone, approval }
}

// 组装报错诊断信息（结合 fetchAI 记录的最近一次响应元数据）
function buildAIErrorDiagnostic(errMsg, raw) {
  const meta = window._lastAIResponseMeta || {}
  const lines = [
    '时间：' + new Date().toLocaleString(),
    '错误：' + (errMsg || '未知')
  ]
  if (meta.model) lines.push('模型：' + meta.model)
  if (meta.finishReason) {
    let fr = 'finish_reason：' + meta.finishReason
    if (meta.finishReason === 'length') fr += '（输出因长度限制被截断）'
    lines.push(fr)
  }
  if (meta.hasReasoning && !String(raw || '').trim()) {
    lines.push('提示：模型把内容输出在 reasoning_content（思考）里，正文为空；可能是推理占满输出额度，建议换非推理模型或调大 max_tokens。')
  }
  const rawText = String(raw == null ? '' : raw).trim()
  lines.push('AI 原始返回：' + (rawText ? rawText.slice(0, 2000) : '（空）'))
  return lines.join('\n')
}

function parseWechatAIResponse(raw) {
  if (!raw || !String(raw).trim()) {
    const err = new Error('AI 返回了空响应，请检查 API 配置或稍后重试')
    err.diagnostic = buildAIErrorDiagnostic(err.message, raw)
    throw err
  }
  try {
    return normalizeWechatAIFields(extractAIJson(raw))
  } catch (e) {
    if (!e.diagnostic) e.diagnostic = buildAIErrorDiagnostic(e.message, raw)
    throw e
  }
}

function buildActiveReplyTriggerFingerprint(chatId, lastMessage) {
  return [
    Number(chatId) || 0,
    lastMessage?.id ?? '',
    Number(lastMessage?.createdAt) || 0,
    String(lastMessage?.role || '')
  ].join(':')
}

async function runWechatActiveReplyCheck() {
  if (!_wechatUid || !db?.chats || !db?.messages) return
  const chats = (await db.chats.toArray()).filter(chat => String(chat.ownerUid) === String(_wechatUid))
  for (const chat of chats) {
    try {
      const cfg = await getChatActiveReplySettings(chat.id)
      if (!cfg.enabled) continue
      if (isNowInQuietHours(cfg)) continue
      if (isAIReplyPending('chat', chat.id)) continue
      if ((_activeReplyRetryAfter.get(chat.id) || 0) > Date.now()) continue
      if (window.isCallActiveWith?.(chat.charId)) continue
      const char = await db.characters.get(chat.charId)
      if (!char || char.type === 'online_friend') continue
      const lastMessage = await db.messages.where('chatId').equals(chat.id).last()
      if (!lastMessage) continue
      if (lastMessage.role !== 'assistant' && lastMessage.role !== 'user') continue
      const idleMs = Date.now() - (Number(lastMessage.createdAt) || 0)
      if (!Number.isFinite(idleMs)) continue
      // 角色日程：他正在忙（上班/执飞…）就不打扰；到了预计结束时间还没报平安，就提前触发一次
      const sched = await getCharScheduleState(chat.id)
      if (sched.active) continue
      let scheduleDue = null
      if (sched.overdue && !sched.overdue.notifiedAt && Date.now() - sched.overdue.endAt >= 2 * 60000) {
        if ((Number(lastMessage.createdAt) || 0) > sched.overdue.endAt) {
          // 预计结束之后聊天里已经有新消息，不再单独提醒
          sched.overdue.notifiedAt = Date.now()
          await charScheduleSave(sched.data)
        } else {
          scheduleDue = sched.overdue
        }
      }
      if (!scheduleDue && idleMs < cfg.intervalMinutes * 60 * 1000) continue
      const fingerprint = buildActiveReplyTriggerFingerprint(chat.id, lastMessage)
      if (!scheduleDue && _activeReplyTriggeredFingerprints.get(chat.id) === fingerprint) continue
      _activeReplyTriggeredFingerprints.set(chat.id, fingerprint)
      if (scheduleDue) {
        scheduleDue.notifiedAt = Date.now()
        await charScheduleSave(sched.data)
      }
      const triggerMode = lastMessage.role === 'assistant' ? 'followup' : 'auto_reply'
      const impulseHint = (!scheduleDue && triggerMode === 'followup')
        ? await buildActiveReplyImpulse(chat.id, idleMs)
        : ''
      startPrivateAIReply(chat.id, chat.charId, {
        idleTriggerMode: triggerMode,
        idleMinutes: Math.max(1, Math.floor(idleMs / 60000)),
        impulseHint,
        scheduleDueId: scheduleDue ? scheduleDue.id : ''
      })
    } catch (err) {
      console.warn('[wechat] 主动回复巡检失败:', err)
    }
  }
}

function ensureWechatActiveReplyMonitorStarted() {
  if (_wechatActiveReplyMonitorStarted) return
  _wechatActiveReplyMonitorStarted = true
  runWechatActiveReplyCheck().catch(err => console.warn('[wechat] 主动回复首轮巡检异常:', err))
  setInterval(() => {
    runWechatActiveReplyCheck().catch(err => console.warn('[wechat] 主动回复巡检异常:', err))
  }, CHAT_ACTIVE_REPLY_CHECK_MS)
  // 从后台/锁屏回到前台时立刻巡检一次，不用等下一个 2 分钟
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      runWechatActiveReplyCheck().catch(err => console.warn('[wechat] 主动回复巡检异常:', err))
    }
  })
}

async function getChatHistoryLimit(chatId) {
  const read = () => db.config.get(`chatMemory_${chatId}`)
  const stored = window.runWanWanDBRead ? await window.runWanWanDBRead(read) : await read()
  const value = typeof stored?.value === 'object' ? stored.value.historyLimit : stored?.value
  return clampWechatMemoryLimit(value)
}

async function buildWechatAvatarContext(charId) {
  if (!_wechatUid || !charId) return null
  const profile = await getWechatProfile(_wechatUid, charId)
  if (!profile.avatar) return null
  const char = await window.getCharacter(charId)
  const charName = char?.nick || char?.name || '当前角色'
  const userName = _wechatUser?.name || '当前用户'
  const text = `系统提示：当前【${userName}】为角色【${charName}】设置了本地显示头像。图片代表了【${charName}】在微信软件中显示的头像，不代表对方用户【${userName}】的头像、外貌或身份。角色可以知道自己的微信显示头像被对方更换。不要提及或猜测任何微信备注。`
  return {
    imageMessage: {
      role: 'user',
      content: [
        { type: 'text', text },
        { type: 'image_url', image_url: { url: profile.avatar } }
      ]
    },
    textMessage: {
      role: 'user',
      content: `系统提示：当前【${userName}】为角色【${charName}】设置了本地显示头像，但当前接口无法读取图片内容。该头像代表了【${charName}】在微信软件中显示的头像，不代表对方用户【${userName}】的头像、外貌或身份。角色可以知道自己的微信显示头像被对方更换。不要提及或猜测任何微信备注。`
    }
  }
}

async function readWechatContextRows(operation) {
  return window.runWanWanDBRead ? await window.runWanWanDBRead(operation) : await operation()
}

function filterWechatOfflineRowsForWindow(rows, windowStart, windowEnd) {
  return buildWechatOfflineSessions(rows || [])
    .filter(session => session.endAt >= windowStart && session.startAt <= windowEnd)
    .flatMap(session => session.messages)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
}

function filterWechatCallRowsForWindow(rows, windowStart, windowEnd) {
  return (rows || []).filter(record => {
    const startAt = Number(record?.createdAt) || 0
    const durationMs = Math.max(0, Number(record?.duration) || 0) * 1000
    const endAt = startAt + durationMs
    return endAt >= windowStart - CALL_RECORD_MATCH_TOLERANCE_MS && startAt <= windowEnd
  })
}

async function loadWechatContextRoundWindow(chatId, charId, historyLimit, ownerUid) {
  const limit = Math.max(1, Number(historyLimit) || 1)
  const batchSize = Math.min(200, Math.max(50, limit))
  const windowEnd = Date.now()
  const [initialMessages, allOfflineRows, allCallRows] = await Promise.all([
    readWechatContextRows(() => getChatRecentMessages(chatId, batchSize)),
    readWechatContextRows(() => getWechatContextOfflineRows(chatId, charId, 0, windowEnd, ownerUid)),
    readWechatContextRows(() => getWechatContextCallRows(chatId, charId, 0, windowEnd, [], ownerUid))
  ])
  let messages = initialMessages
  let exhausted = initialMessages.length < batchSize

  while (true) {
    const windowStart = exhausted ? 0 : (Number(messages[0]?.createdAt) || 0)
    const offlineRows = filterWechatOfflineRowsForWindow(allOfflineRows, windowStart, windowEnd)
    const callRows = filterWechatCallRowsForWindow(allCallRows, windowStart, windowEnd)
    const roundUnits = buildWechatTimelineRounds(messages, offlineRows, callRows)

    // 多取一个完整回合，避免当前批次从某个连续回合中间开始。
    if (exhausted || roundUnits.length > limit) {
      return { messages, offlineRows, callRows, roundUnits }
    }

    const oldest = messages[0]
    if (!oldest) {
      exhausted = true
      continue
    }
    const older = await readWechatContextRows(() => getChatMessagesBefore(chatId, oldest, batchSize))
    if (!older.length) {
      exhausted = true
      continue
    }
    messages = older.concat(messages)
    if (older.length < batchSize) exhausted = true
  }
}

async function buildUnifiedChatTimeline(chatId, charId, historyLimit, ownerUid = _wechatUid, options = {}) {
  const contextWindow = await loadWechatContextRoundWindow(chatId, charId, historyLimit, ownerUid)
  const msgs = contextWindow.messages
  const offlineRows = contextWindow.offlineRows
  // 重新关联已加载消息中的 callRecordId，同时仍只保留当前时间窗内的通话。
  const linkedCallRows = await readWechatContextRows(() =>
    getWechatContextCallRows(
      chatId,
      charId,
      msgs.length ? (Number(msgs[0]?.createdAt) || 0) : 0,
      Date.now(),
      msgs,
      ownerUid
    )
  )
  const callRowsById = new Map(contextWindow.callRows.map(row => [Number(row.id), row]))
  linkedCallRows.forEach(row => callRowsById.set(Number(row.id), row))
  const callRows = [...callRowsById.values()].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  const roundUnits = buildWechatTimelineRounds(msgs, offlineRows, callRows)
  const normalizedHistoryLimit = Math.max(1, Number(historyLimit) || 0)
  const selectedRoundUnits = roundUnits.slice(-normalizedHistoryLimit)
  const gapTimeline = buildWechatRoundTimeline(roundUnits.slice(-(normalizedHistoryLimit + 1)))
  const timeline = buildWechatRoundTimeline(selectedRoundUnits)
  const stickerImageInputEnabled = options.stickerImageInputEnabled != null
    ? !!options.stickerImageInputEnabled
    : await getChatStickerImageInputEnabled(chatId)
  const stickerMap = options.stickerMap || (stickerImageInputEnabled ? await getMountedStickerMap(chatId) : {})
  const historyOptions = { stickerImageInputEnabled, stickerMap }
  const rawTextHistory = timeline.map(item => ({ role: item.role, content: buildWechatTextFallbackContent(item, historyOptions) }))
  const rawHistory = options.includeMultimodal === false
    ? rawTextHistory
    : await Promise.all(timeline.map(item => buildWechatAIHistoryMessage(item, historyOptions)))
  const shouldInjectTimeAnchors = !!options.injectTimeAnchors
  const textHistory = shouldInjectTimeAnchors
    ? injectWechatHistoryTimeAnchors(rawTextHistory, timeline, options.tzConfig)
    : rawTextHistory
  const history = shouldInjectTimeAnchors
    ? injectWechatHistoryTimeAnchors(rawHistory, timeline, options.tzConfig)
    : rawHistory
  const loreMessages = timeline.map(item => ({ role: item.role, content: buildWechatTextFallbackContent(item) }))
  const onlineWindow = selectedRoundUnits
    .filter(unit => unit.kind === 'online-turn')
    .flatMap(unit => unit.items.map(item => item.message).filter(Boolean))
  const selectedOfflineRows = selectedRoundUnits
    .filter(unit => unit.kind === 'offline-round')
    .flatMap(unit => unit.session?.messages || [])
  const selectedCallRows = selectedRoundUnits
    .filter(unit => unit.kind === 'call-round' && unit.record)
    .map(unit => unit.record)
  return {
    allOnlineMsgs: msgs,
    onlineWindow,
    offlineRows: selectedOfflineRows,
    callRows: selectedCallRows,
    allOfflineRows: offlineRows,
    allCallRows: callRows,
    roundUnits: selectedRoundUnits,
    gapTimeline,
    timeline,
    history,
    textHistory,
    loreMessages,
    hasVisualContent: history.some(item => Array.isArray(item.content))
  }
}

async function buildWechatReplyContext(chatId, charId, historyLimit, tzConfig = null) {
  let resolvedTzConfig = tzConfig
  if (!resolvedTzConfig) {
    const tzStored = await db.config.get(`chatTimezone_${chatId}`)
    resolvedTzConfig = tzStored?.value || {}
  }
  return await buildUnifiedChatTimeline(chatId, charId, historyLimit, _wechatUid, {
    injectTimeAnchors: true,
    tzConfig: resolvedTzConfig
  })
}

function prefixWechatTimeAnchorToContent(content, anchor) {
  if (Array.isArray(content)) {
    return [{ type: 'text', text: anchor }].concat(content.map(part => ({ ...part })))
  }
  return `${anchor}\n${String(content || '')}`
}

// 给时间锚点加上“相对现在”的日期说明：今天 / 昨天 / 前天 / N天前，避免把前一天的事算到今天
function getWechatRelativeDayLabel(timestamp, tzConfig) {
  try {
    const zone = getWechatTimeContextZones(tzConfig)[0]
    const k1 = getWechatCalendarDateKey(timestamp, zone.timeZone)
    const k0 = getWechatCalendarDateKey(Date.now(), zone.timeZone)
    if (!k1 || !k0) return ''
    const toDay = k => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d) / 86400000 }
    const diff = Math.round(toDay(k0) - toDay(k1))
    if (diff === 0) return '今天'
    if (diff === 1) return '昨天'
    if (diff === 2) return '前天'
    if (diff > 2) return `${diff}天前`
  } catch (_) {}
  return ''
}

function injectWechatHistoryTimeAnchors(messages, timeline, tzConfig) {
  const sourceMessages = Array.isArray(messages) ? messages : []
  const sourceTimeline = Array.isArray(timeline) ? timeline : []
  let previousTimestamp = 0
  let previousDateKey = ''

  return sourceMessages.map((message, index) => {
    const timestamp = Number(sourceTimeline[index]?.time) || 0
    if (!timestamp) return { ...message }
    const dateKey = getWechatTimeContextDateKey(timestamp, tzConfig)
    const gapMs = previousTimestamp ? timestamp - previousTimestamp : 0
    const shouldAnchor = !previousTimestamp
      || gapMs > WECHAT_TIME_CONTEXT_GAP_MS
      || (!!previousDateKey && dateKey !== previousDateKey)
    previousTimestamp = timestamp
    previousDateKey = dateKey
    if (!shouldAnchor) return { ...message }
    const timeText = buildWechatTimeContextText(timestamp, tzConfig)
    if (!timeText) return { ...message }
    return {
      ...message,
      content: prefixWechatTimeAnchorToContent(message.content, `[系统时间：${timeText}${getWechatRelativeDayLabel(timestamp, tzConfig) ? `（${getWechatRelativeDayLabel(timestamp, tzConfig)}）` : ''}]`)
    }
  })
}

function countPromptTextChars(text) {
  return String(text || '').length
}

function buildPromptContextEstimateSummary(charCounts) {
  const wechatChars = Math.max(0, Number(charCounts?.wechatChars) || 0)
  const offlineChars = Math.max(0, Number(charCounts?.offlineChars) || 0)
  const callChars = Math.max(0, Number(charCounts?.callChars) || 0)
  const memoryChars = Math.max(0, Number(charCounts?.memoryChars) || 0)
  const loreChars = Math.max(0, Number(charCounts?.loreChars) || 0)
  const personaChars = Math.max(0, Number(charCounts?.personaChars) || 0)
  const totalChars = wechatChars + offlineChars + callChars + memoryChars + loreChars + personaChars
  return {
    wechatChars,
    offlineChars,
    callChars,
    memoryChars,
    loreChars,
    personaChars,
    totalChars,
    estimatedTokens: Math.ceil(totalChars / 1.6)
  }
}

function buildPromptContextEstimateHTML(summary) {
  if (!summary) {
    return `
    <div class="cs-section cs-token-estimate">
      <div class="cs-section-label">Token 预估</div>
      <div class="cs-token-estimate-note">计算中…</div>
    </div>
  `
  }
  const stats = buildPromptContextEstimateSummary(summary)
  const rows = [
    ['fa-brands fa-weixin', '微信聊天记录', stats.wechatChars, 'data-icon-wechat'],
    ['fa-solid fa-fire-flame-curved', '线下见面记录', stats.offlineChars, 'data-icon-miss'],
    ['fa-solid fa-phone', '通话记录', stats.callChars, 'data-icon-other'],
    ['fa-solid fa-brain', 'TA的记忆', stats.memoryChars, 'data-icon-lore'],
    ['fa-solid fa-earth-americas', '世界书', stats.loreChars, 'data-icon-lore'],
    ['fa-solid fa-folder-open', '角色档案', stats.personaChars, 'data-icon-character']
  ]
  return `
    <div class="cs-section cs-token-estimate">
      <div class="cs-section-label">Token 预估</div>
      <div class="data-overview-list cs-token-estimate-list">
        ${rows.map(([icon, label, value, iconClass]) => `
          <div class="data-overview-row cs-token-estimate-item">
            <span class="data-overview-icon ${iconClass}"><i class="${icon}"></i></span>
            <span class="data-overview-name">${label}</span>
            <span class="data-overview-size">${value} 字</span>
          </div>
        `).join('')}
      </div>
      <div class="cs-token-estimate-total">
        <div class="cs-token-estimate-row">
          <span>总字符数</span>
          <strong>${stats.totalChars} 字</strong>
        </div>
        <div class="cs-token-estimate-row cs-token-estimate-row-accent">
          <span>预估 Token</span>
          <strong>${stats.estimatedTokens}</strong>
        </div>
      </div>
      <div class="cs-token-estimate-note">当前只统计文本；若聊天历史中图片、表情包图片、链接图片较多，实际 token 可能更高。</div>
    </div>
  `
}

function joinPromptEstimateParts(parts) {
  return (Array.isArray(parts) ? parts : [])
    .filter(part => part !== undefined && part !== null && String(part) !== '')
    .join('\n')
}

function buildWechatPersonaEstimateText(char, charName, userName, userNick, currentRelationText, userDesc) {
  return joinPromptEstimateParts([
    charName,
    char?.gender ? `性别：${char.gender}` : '',
    char?.role ? `身份：${char.role}` : '',
    char?.description || '(未设定，以普通人逻辑行事)',
    userName ? `对方姓名：${userName}` : '',
    userNick ? `对方微信昵称：${userNick}` : '',
    `与对方的关系：${currentRelationText}`,
    `对方背景：${userDesc || '(未设定)'}`
  ])
}

async function estimateWechatPromptContext(chatId, charId, ownerUid = _wechatUid, historyLimit) {
  const limit = historyLimit || await getChatHistoryLimit(chatId)
  const tzStored = await db.config.get(`chatTimezone_${chatId}`)
  const context = await buildUnifiedChatTimeline(chatId, charId, limit, ownerUid, {
    includeMultimodal: false,
    injectTimeAnchors: true,
    tzConfig: tzStored?.value || {}
  })
  const summary = { wechatChars: 0, offlineChars: 0, callChars: 0, memoryChars: 0, loreChars: 0, personaChars: 0 }
  for (let index = 0; index < (context.timeline || []).length; index += 1) {
    const item = context.timeline[index]
    const text = context.textHistory?.[index]?.content || buildWechatTextFallbackContent(item)
    if (!text) continue
    if (item.kind === 'call') summary.callChars += countPromptTextChars(text)
    else if (item.kind === 'offline') summary.offlineChars += countPromptTextChars(text)
    else summary.wechatChars += countPromptTextChars(text)
  }

  const memoryCtx = window.WanWanMemory?.getMemoryContext
    ? await window.WanWanMemory.getMemoryContext(chatId, charId, ownerUid, context.loreMessages)
    : ''
  summary.memoryChars = countPromptTextChars(memoryCtx)
  const loreCtx = await getChatLorebookContext(chatId, charId, context.loreMessages)
  summary.loreChars = countPromptTextChars(loreCtx)
  const char = await window.getCharacter(charId)
  const charName = char?.nick || char?.name || ''
  const userName = _wechatUser?.name || '用户'
  const userNick = _wechatUser?.nick || ''
  const userDesc = _wechatUser?.description || '(未设定)'
  const currentRelationText = buildCurrentRelationText(char)
  summary.personaChars = countPromptTextChars(buildWechatPersonaEstimateText(char, charName, userName, userNick, currentRelationText, userDesc))

  return buildPromptContextEstimateSummary(summary)
}

function isWechatVisualImageSrc(src) {
  return /^data:|^https?:\/\//i.test(String(src || ''))
}

const MAX_LINK_CONTEXT_IMAGES = 10

function buildStickerImageInputLabel(name) {
  const cleanName = String(name || '').trim()
  return cleanName ? `[(${cleanName})表情包：图片]` : '[表情包：图片]'
}

function getWechatStickerImageSrc(message, name, stickerMap) {
  const directImage = String(message?.stickerImage || '').trim()
  if (isWechatVisualImageSrc(directImage)) return directImage
  const cleanName = String(name || '').trim()
  if (!cleanName) return ''
  const mountedImage = String(stickerMap?.[cleanName] || '').trim()
  return isWechatVisualImageSrc(mountedImage) ? mountedImage : ''
}

async function buildWechatAIHistoryMessage(item, options = {}) {
  if (item.kind !== 'online' || !item.message) return { role: item.role, content: item.content || '' }
  const parsed = parseMsgType(item.message.content || '')
  if (parsed.type === 'shop-approval') {
    return { role: item.role, content: buildShopApprovalFallbackText(parsed.data, item.message) }
  }
  if (parsed.type === 'tb-deal') {
    return { role: item.role, content: buildTbDealFallbackText(parsed.data) }
  }
  if (parsed.type === 'yum-deal') {
    return { role: item.role, content: buildYumDealFallbackText(parsed.data) }
  }
  if (parsed.type === 'link') {
    const link = normalizeLinkPayload(parsed.data)
    const imageUrls = link.imageUrls.slice(0, MAX_LINK_CONTEXT_IMAGES)
    if (!imageUrls.length) return { role: item.role, content: buildLinkFallbackText(link) }
    return {
      role: item.role,
      content: [
        { type: 'text', text: buildLinkFallbackText(link) },
        ...imageUrls.map(src => ({ type: 'image_url', image_url: { url: src } }))
      ]
    }
  }
  if (parsed.type === 'sticker' && options.stickerImageInputEnabled) {
    const label = buildStickerImageInputLabel(parsed.data.name)
    const stickerSrc = getWechatStickerImageSrc(item.message, parsed.data.name, options.stickerMap)
    if (!stickerSrc) return { role: item.role, content: label }
    return {
      role: item.role,
      content: [
        { type: 'text', text: label },
        { type: 'image_url', image_url: { url: stickerSrc } }
      ]
    }
  }
  let photoSrc = parsed.data.src
  if (parsed.type === 'real-photo' && isWechatBlobRef(photoSrc)) {
    photoSrc = await resolveWechatBlobDataURL(photoSrc)
  }
  if (parsed.type !== 'real-photo' || !isWechatVisualImageSrc(photoSrc)) {
    return { role: item.role, content: item.content || '' }
  }
  const parts = [
    { type: 'image_url', image_url: { url: photoSrc } }
  ]
  const desc = normalizeImageSupplementDesc(item.message.imageDesc)
  if (desc) {
    parts.push({ type: 'text', text: `以上图片的图片重点补充：${desc}` })
  }
  return { role: item.role, content: parts }
}

function buildWechatTextFallbackContent(item, options = {}) {
  if (item.kind !== 'online' || !item.message) return item.content || ''
  const parsed = parseMsgType(item.message.content || '')
  if (parsed.type === 'shop-approval') return buildShopApprovalFallbackText(parsed.data, item.message)
  if (parsed.type === 'tb-deal') return buildTbDealFallbackText(parsed.data)
  if (parsed.type === 'yum-deal') return buildYumDealFallbackText(parsed.data)
  if (parsed.type === 'link') return buildLinkFallbackText(parsed.data)
  if (parsed.type === 'sticker' && options.stickerImageInputEnabled) {
    return buildStickerImageInputLabel(parsed.data.name)
  }
  if (parsed.type !== 'real-photo') return item.content || ''
  const desc = normalizeImageSupplementDesc(item.message.imageDesc)
  return desc ? `[图片；图片重点补充：${desc}]` : '[图片]'
}

async function getWechatContextOfflineRows(chatId, charId, windowStart, windowEnd, ownerUid = _wechatUid) {
  if (!ownerUid || !db.offlineChats) return []
  const rows = await db.offlineChats.where('charId').equals(charId).toArray()
  return rows
    .filter(m => m.ownerUid === ownerUid && m.chatId === chatId)
    .filter(m => {
      const ts = m.createdAt || 0
      return ts >= windowStart && ts <= windowEnd
    })
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
}

async function getWechatContextCallRows(chatId, charId, windowStart, windowEnd, onlineMsgs = [], ownerUid = _wechatUid) {
  if (!ownerUid || !db.callRecords) return []
  try {
    const linkedRecordIds = new Set(
      onlineMsgs.map(m => Number(m?.callRecordId)).filter(id => Number.isInteger(id) && id > 0)
    )
    const rows = await db.callRecords.where('charId').equals(charId).toArray()
    return rows
      .filter(r => r.ownerUid === ownerUid && r.chatId === chatId)
      .filter(r => {
        if (linkedRecordIds.has(Number(r.id))) return true
        const startAt = Number(r.createdAt) || 0
        const durationMs = Math.max(0, Number(r.duration) || 0) * 1000
        const endAt = startAt + durationMs
        return endAt >= windowStart - CALL_RECORD_MATCH_TOLERANCE_MS && startAt <= windowEnd
      })
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  } catch (error) {
    if (window.isWanWanRecoverableDBError?.(error)) throw error
    return []
  }
}

function buildWechatMergedTimeline(onlineMsgs, offlineRows, callRows) {
  const events = []
  const callMap = buildCallRecordMap(callRows || [])
  onlineMsgs.forEach(m => {
    events.push({
      kind: 'online',
      time: m.createdAt || 0,
      role: m.role,
      content: m.content || '',
      message: m
    })
  })
  buildWechatOfflineSessions(offlineRows).forEach(session => {
    events.push({
      kind: 'offline-session',
      time: session.startAt,
      endAt: session.endAt,
      session
    })
  })
  events.sort((a, b) => (a.time || 0) - (b.time || 0) || getWechatTimelineKindRank(a.kind) - getWechatTimelineKindRank(b.kind))

  const result = []
  events.forEach((event, index) => {
    if (event.kind === 'online') {
      if (event.content) {
        const callConversion = convertCallMsgToContext(event.content, event.role, event.time, event.message, callMap)
        if (callConversion) {
          result.push({ role: 'user', content: callConversion })
          return
        }
        result.push({
          kind: event.kind,
          time: event.time,
          role: event.role,
          content: event.content,
          message: event.message
        })
      }
      return
    }
    const session = event.session
    if (!session || !session.messages.length) return
    result.push({ role: 'user', content: getWechatOfflineStartPrompt(session) })
    session.messages.forEach(m => {
      const content = formatWechatOfflineMessage(m)
      if (content) result.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content })
    })
    if (session.ended) {
      result.push({ role: 'user', content: '（以上线下见面已经结束，之后你们回到微信聊天。）' })
    } else if (hasLaterOnlineEvent(events, index, session.endAt)) {
      result.push({ role: 'user', content: '（之后你们继续在微信上聊天；线下模式记录仍显示为未结束，请谨慎判断当前状态。）' })
    }
  })
  return result
}

function getWechatPrimitiveEventKindRank(kind) {
  if (kind === 'online-message') return 0
  if (kind === 'call-round') return 1
  if (kind === 'offline-round') return 2
  return 9
}

function getCallRecordDurationLabel(record) {
  const totalSeconds = Math.max(0, Number(record?.duration) || 0)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function buildCallRecordContextFromRecord(record, fallbackRole = 'user') {
  if (!record) return ''
  const callType = record.type === 'video' ? '视频通话' : '语音通话'
  const duration = getCallRecordDurationLabel(record)
  const transcript = buildCallRecordTranscript(record, callType, duration, fallbackRole)
  if (transcript) return transcript
  const userName = _wechatUser?.name || '用户'
  const initiator = record.initiator === 'char' || record.initiator === 'user'
    ? record.initiator
    : (fallbackRole === 'assistant' ? 'char' : 'user')
  const initiatorLabel = initiator === 'char' ? '角色' : userName
  const receiverLabel = initiator === 'char' ? userName : '角色'
  return `（${initiatorLabel}发起了${callType}，${receiverLabel}接听了${callType === '视频通话' ? '视频电话' : '电话'}，通话时长${duration}，${callType}已结束。）`
}

function findCallMessageRecord(message, callMap) {
  const text = String(message?.content || '').trim()
  const matched = text.match(/^\[(视频通话|语音通话)\s+(\d+:[0-5]\d)\]$/)
  if (!matched) return null
  return findCallRecordForMessage(message, matched[1], matched[2], message?.createdAt || 0, callMap)
}

function buildWechatPrimitiveEvents(onlineMsgs, offlineRows, callRows) {
  const events = []
  const callMap = buildCallRecordMap(callRows || [])
  const usedCallRecordIds = new Set()

  for (const message of onlineMsgs || []) {
    const content = String(message?.content || '').trim()
    if (!content) continue
    const matchedCall = findCallMessageRecord(message, callMap)
    if (matchedCall) {
      const recordId = Number(matchedCall.id)
      if (!usedCallRecordIds.has(recordId)) {
        usedCallRecordIds.add(recordId)
        const fallbackRole = matchedCall.initiator === 'char' ? 'assistant' : 'user'
        events.push({
          kind: 'call-round',
          time: Number(matchedCall.createdAt) || (message.createdAt || 0),
          role: 'user',
          content: buildCallRecordContextFromRecord(matchedCall, fallbackRole),
          record: matchedCall,
          sourceMessage: message
        })
      }
      continue
    }

    const callFallback = convertCallMsgToContext(content, message.role, message.createdAt || 0, message, callMap)
    if (callFallback) {
      events.push({
        kind: 'call-round',
        time: message.createdAt || 0,
        role: 'user',
        content: callFallback,
        record: null,
        sourceMessage: message
      })
      continue
    }

    events.push({
      kind: 'online-message',
      time: message.createdAt || 0,
      role: message.role,
      content,
      message
    })
  }

  for (const record of callRows || []) {
    const recordId = Number(record?.id)
    if (!Number.isInteger(recordId) || usedCallRecordIds.has(recordId)) continue
    const fallbackRole = record.initiator === 'char' ? 'assistant' : 'user'
    events.push({
      kind: 'call-round',
      time: Number(record.createdAt) || 0,
      role: 'user',
      content: buildCallRecordContextFromRecord(record, fallbackRole),
      record,
      sourceMessage: null
    })
  }

  for (const session of buildWechatOfflineSessions(offlineRows || [])) {
    events.push({
      kind: 'offline-round',
      time: session.startAt,
      endAt: session.endAt,
      session
    })
  }

  return events.sort((a, b) =>
    (a.time || 0) - (b.time || 0)
    || getWechatPrimitiveEventKindRank(a.kind) - getWechatPrimitiveEventKindRank(b.kind)
  )
}

function buildWechatOnlineTurnUnits(events) {
  const units = []
  let current = null

  const flush = () => {
    if (!current || !current.items.length) return
    units.push({
      kind: 'online-turn',
      time: current.items[0].time || 0,
      endAt: current.items[current.items.length - 1].time || 0,
      items: current.items.slice()
    })
    current = null
  }

  for (const event of events || []) {
    if (event.kind !== 'online-message') {
      flush()
      units.push(event)
      continue
    }

    if (!current) {
      current = { items: [event], firstRole: event.role, secondRole: '' }
      continue
    }

    const lastRole = current.items[current.items.length - 1]?.role
    if (event.role === lastRole) {
      current.items.push(event)
      continue
    }

    if (!current.secondRole) {
      current.secondRole = event.role
      current.items.push(event)
      continue
    }

    if (event.role === current.firstRole) {
      flush()
      current = { items: [event], firstRole: event.role, secondRole: '' }
      continue
    }

    current.items.push(event)
  }

  flush()
  return units
}

function buildWechatRoundTimeline(roundUnits, options = {}) {
  // 已结束且已总结进长期记忆的线下见面，默认只留一句话占位，不再把整段原文发给线上聊天/通话
  const collapseSummarizedOffline = options.collapseSummarizedOffline !== false
  const result = []
  const units = Array.isArray(roundUnits) ? roundUnits : []

  units.forEach((unit, index) => {
    if (unit.kind === 'online-turn') {
      unit.items.forEach(item => {
        result.push({
          kind: 'online',
          time: item.time,
          role: item.role,
          content: item.content,
          message: item.message
        })
      })
      return
    }

    if (unit.kind === 'call-round') {
      if (unit.content) {
        result.push({
          kind: 'call',
          time: unit.time || 0,
          role: 'user',
          content: unit.content,
          record: unit.record || null,
          sourceMessage: unit.sourceMessage || null
        })
      }
      return
    }

    if (unit.kind !== 'offline-round') return
    const session = unit.session
    if (!session || !session.messages?.length) return
    if (collapseSummarizedOffline && session.ended && session.summarized) {
      const d = new Date(session.startAt || session.endAt || Date.now())
      result.push({
        kind: 'offline',
        time: session.endAt || session.startAt || 0,
        role: 'user',
        content: `（之后你们线下见面过一次（${d.getMonth() + 1}月${d.getDate()}日）。这次见面已经结束，并已总结进你的长期记忆，具体经过以长期记忆为准；之后你们回到微信聊天。）`
      })
      return
    }
    result.push({
      kind: 'offline',
      time: session.startAt || 0,
      role: 'user',
      content: getWechatOfflineStartPrompt(session)
    })
    session.messages.forEach(message => {
      const content = formatWechatOfflineMessage(message)
      if (content) {
        result.push({
          kind: 'offline',
          time: message.createdAt || 0,
          role: message.role === 'assistant' ? 'assistant' : 'user',
          content
        })
      }
    })
    if (session.ended) {
      result.push({
        kind: 'offline',
        time: session.endAt || 0,
        role: 'user',
        content: '（以上线下见面已经结束，之后你们回到微信聊天。）'
      })
    } else if (hasLaterOnlineTurnUnit(units, index, session.endAt)) {
      result.push({
        kind: 'offline',
        time: session.endAt || 0,
        role: 'user',
        content: '（之后你们继续在微信上聊天；线下模式记录仍显示为未结束，请谨慎判断当前状态。）'
      })
    }
  })

  return result
}

function buildWechatTimelineRounds(onlineMsgs, offlineRows, callRows) {
  return buildWechatOnlineTurnUnits(buildWechatPrimitiveEvents(onlineMsgs, offlineRows, callRows))
}

function hasLaterOnlineTurnUnit(units, currentIndex, afterTime) {
  return (units || []).slice(currentIndex + 1).some(unit =>
    unit.kind === 'online-turn' && ((unit.endAt || unit.time || 0) >= (afterTime || 0))
  )
}

function buildCallRecordMap(callRows) {
  const byId = new Map()
  for (const r of callRows) {
    if (r?.id != null) byId.set(Number(r.id), r)
  }
  return { byId, rows: callRows }
}

const CALL_RECORD_MATCH_TOLERANCE_MS = 15000

function parseCallDurationSeconds(duration) {
  const m = String(duration || '').match(/^(\d+):([0-5]\d)$/)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

function findCallRecordForMessage(message, callType, duration, time, callMap) {
  const linkedId = Number(message?.callRecordId)
  if (Number.isInteger(linkedId) && linkedId > 0) {
    const linked = callMap.byId.get(linkedId)
    if (linked) return linked
  }

  const expectedType = callType === '视频通话' ? 'video' : 'voice'
  const expectedDuration = parseCallDurationSeconds(duration)
  if (expectedDuration == null) return null
  let best = null
  let bestDistance = Infinity
  for (const record of callMap.rows || []) {
    if ((record.type === 'video' ? 'video' : 'voice') !== expectedType) continue
    if (Number(record.duration) !== expectedDuration) continue
    const expectedEndAt = (Number(record.createdAt) || 0) + expectedDuration * 1000
    const distance = Math.abs((Number(time) || 0) - expectedEndAt)
    if (distance < bestDistance) {
      best = record
      bestDistance = distance
    }
  }
  return bestDistance <= CALL_RECORD_MATCH_TOLERANCE_MS ? best : null
}

function isCallStartControlMessage(message) {
  if (message?.role !== 'user') return false
  const text = String(message.content || '').trim()
  return /发起了(?:语音|视频)通话.*接听了(?:视频电话|电话)/.test(text)
}

function getCallRecordSpokenText(message) {
  if (!message) return { text: '', valid: false }
  if (message.role === 'user') return { text: String(message.content || '').trim(), valid: true }
  const directSpeech = String(message.speech || '').trim()
  if (directSpeech) return { text: directSpeech, valid: true }
  const raw = String(message.content || '').trim()
  if (!raw) return { text: '', valid: true }
  try {
    const parsed = JSON.parse(raw)
    return { text: String(parsed?.speech || '').trim(), valid: true }
  } catch (_) {
    const looksLikeBrokenJson = raw.startsWith('{') || raw.startsWith('[')
    return { text: looksLikeBrokenJson ? '' : raw, valid: !looksLikeBrokenJson }
  }
}
// 把通话记录拆成逐句 [{role, text}]（供日记/记忆使用）
function getCallRecordLines(record) {
  const lines = []
  for (const message of record?.messages || []) {
    if (isCallStartControlMessage(message)) continue
    if (message?.role !== 'assistant' && message?.role !== 'user') continue
    const spoken = getCallRecordSpokenText(message)
    if (!spoken.text) continue
    lines.push({ role: message.role, text: spoken.text })
  }
  return lines
}
window.getCallRecordLines = getCallRecordLines

// 给一批聊天消息，返回 Map(消息id → {type, duration, initiator, lines})
window.getCallLinesForMessages = async function (chatId, msgs) {
  const out = new Map()
  try {
    const re = /^\[(视频通话|语音通话)\s+(\d+:[0-5]\d)\]$/
    const marks = (msgs || []).filter(m => re.test(String(m?.content || '').trim()))
    if (!marks.length || !db.callRecords) return out
    const rows = await db.callRecords.where('chatId').equals(chatId).toArray()
    const callMap = buildCallRecordMap(rows)
    for (const m of marks) {
      const mm = String(m.content).trim().match(re)
      const record = findCallRecordForMessage(m, mm[1], mm[2], m.createdAt || 0, callMap)
      if (!record) continue
      const lines = getCallRecordLines(record)
      if (!lines.length) continue
      out.set(m.id, { type: mm[1], duration: mm[2], initiator: record.initiator, lines })
    }
  } catch (e) { console.warn('展开通话内容失败', e) }
  return out
}

// 通话结束/恢复/续接后，让记忆系统给这通电话单独总结
function triggerCallMemory(chatId, charId, ownerUid, recordId) {
  if (!recordId || !window.WanWanMemory?.summarizeCall) return
  setTimeout(() => {
    window.WanWanMemory.summarizeCall(chatId, charId, ownerUid, recordId)
      .catch(e => console.warn('通话记忆总结失败', e))
  }, 0)
}
function buildCallRecordTranscript(record, callType, duration, fallbackRole) {
  if (!Array.isArray(record?.messages)) return null
  const initiator = record.initiator === 'char' || record.initiator === 'user'
    ? record.initiator
    : (fallbackRole === 'assistant' ? 'char' : 'user')
  const start = initiator === 'char'
    ? `[${callType}开始；角色发起，用户接听]`
    : `[${callType}开始；用户发起，角色接听]`
  const lines = [start]
  for (const message of record.messages || []) {
    if (isCallStartControlMessage(message)) continue
    if (message?.role !== 'assistant' && message?.role !== 'user') continue
    const spoken = getCallRecordSpokenText(message)
    if (!spoken.valid) return null
    if (!spoken.text) continue
    lines.push(`${message.role === 'assistant' ? '角色' : '用户'}：${spoken.text}`)
  }
  lines.push(`[${callType}结束；时长 ${duration}]`)
  return lines.join('\n')
}

function convertCallMsgToContext(content, role, time, message, callMap) {
  const m = String(content).trim().match(/^\[(视频通话|语音通话)\s+(\d+:[0-5]\d)\]$/)
  if (!m) return null
  const callType = m[1]
  const duration = m[2]
  const record = findCallRecordForMessage(message, callType, duration, time, callMap)
  if (record) {
    const transcript = buildCallRecordTranscript(record, callType, duration, role)
    if (transcript) return transcript
  }
  const userName = _wechatUser?.name || '用户'
  const initiatorLabel = role === 'user' ? userName : '角色'
  const receiverLabel = role === 'user' ? '角色' : userName
  return `（${initiatorLabel}发起了${callType}，${receiverLabel}接听了${callType === '视频通话' ? '视频电话' : '电话'}，通话时长${duration}，${callType}已结束。）`
}

function getWechatTimelineKindRank(kind) {
  return kind === 'offline-session' ? 1 : 0
}

function buildWechatOfflineSessions(rows) {
  const groups = new Map()
  rows.forEach(row => {
    const key = getWechatOfflineSessionKey(row)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  })
  return [...groups.values()].map(messages => {
    messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    const ended = messages.some(m => m.endedAt)
    return {
      ended,
      summarized: messages.some(m => m.meetSummaryStatus === 'summarized'),
      startAt: messages[0]?.createdAt || 0,
      endAt: Math.max(...messages.map(m => m.createdAt || 0)),
      messages
    }
  }).sort((a, b) => (a.startAt || 0) - (b.startAt || 0))
}

function getWechatOfflineSessionKey(row) {
  if (row.sessionId) return `session:${row.sessionId}`
  if (row.endedAt) return `ended:${row.mode || 'meet'}:${row.endedAt}`
  return `open:${row.mode || 'meet'}`
}

function getWechatOfflineStartPrompt(session) {
  return session.ended
    ? '（之后你们进入线下见面模式。本段线下见面已经结束，以下是当时发生的线下记录。）'
    : '（之后你们进入线下见面模式。注意：本段线下模式尚未结束，请分辨你们是否仍处于面对面状态，并基于上下文逻辑回复。）'
}

function hasLaterOnlineEvent(events, currentIndex, afterTime) {
  return events.slice(currentIndex + 1).some(event => event.kind === 'online' && (event.time || 0) >= (afterTime || 0))
}

function formatWechatOfflineMessage(row) {
  const speaker = row.role === 'assistant' ? '角色' : '用户'
  const text = String(row.content || '').replace(/线下见面中[，,]\s*(?:角色|用户)\s*[：:]\s*/g, '').trim()
  if (!text) return ''
  return `线下见面中，${speaker}：${text}`
}

async function callWechatAIWithFallback(primaryMessages, fallbackMessages, opts, hasFallbackMessages) {
  const strictOpts = { ...opts, responseJsonSchema: _WECHAT_AI_JSON_SCHEMA }
  const jsonOpts = { ...opts }
  delete jsonOpts.responseJsonSchema
  const attempts = [
    { messages: primaryMessages, opts: strictOpts },
    { messages: hasFallbackMessages ? fallbackMessages : primaryMessages, opts: jsonOpts }
  ]

  let lastError = null
  for (const attempt of attempts) {
    try {
      const raw = await window.callAI(attempt.messages, attempt.opts)
      const normalized = parseWechatAIResponse(raw)
      return { normalized, messages: attempt.messages, opts: attempt.opts }
    } catch (e) {
      lastError = e
    }
  }
  throw lastError
}

// ===== MCP 跑腿助理 =====
// 角色请求全程不带 tools，也不带任何 tool 协议消息。工具由跑腿助理在前置阶段跑完，
// 结果由它自己写成一段中文汇报，再作为纯文本纸条交给角色。
const WECHAT_MCP_ROUTER_SYSTEM = `你是一个后台跑腿助理，正在为一位「正在扮演角色和用户聊天」的同事工作。
用户看不到你，你的输出永远不会直接显示给用户。

# 你能用的工具
{{TOOL_LIST}}

# 任务一：判断要不要调用工具

读最后几条对话，判断用户这句话是否需要外部信息，或者需要你去执行某个操作。

该调用的情况：
- 时效性信息：新闻、价格、天气、排期、最新动态，以及带「现在 / 最近 / 今天」的问题
- 需要核实的具体事实：某个人、某件事、某个产品、某个地点、某个专有名词
- 用户给了网页链接或文档，希望你去读
- 用户明确要求执行操作：下单、预订、发送、创建、查询、搜索
- 出现明确动词：查一下、搜、找、看看、帮我了解、帮我订、帮我发

不该调用的情况：
- 闲聊、情绪陪伴、撒娇、开玩笑
- 问观点、问感受、要建议
- 创作、续写、角色扮演互动
- 你有把握的常识
- 之前的工具结果已经覆盖了用户的需求

拿不准时倾向于调用——工具就是拿来用的。
完全不需要工具时，只输出 NO_TOOLS 这一个词，然后结束。

# 任务二：汇报

所有需要的工具都调完之后，写一段中文汇报，交给正在扮演角色的同事看。

汇报要求：
- 说清楚两件事：你做了什么、结果是什么
- 用日常中文，像同事之间口头交代事情
- 只陈述事实。不要替角色组织语气，不要写任何面向用户的对白，不要用感叹号
- 简短，通常两三句话。信息确实很多时（比如搜到多条结果）分行列要点，但保持精炼
- 没查到、查错了、操作失败，就直说没成，不要编造，不要粉饰
- 如果结果里有需要用户自己点开的付款、确认或授权入口，写明「有一个入口需要用户自己点开」

绝对不能出现在汇报里的东西：
- 工具名、函数名，以及任何 wanwan_mcp_ 开头的字符串
- 参数、JSON、字段名、大括号、引号包裹的键值对
- 接口、API、MCP、服务器、请求、调用、报错码这类技术词
- 「我调用了××工具」「根据返回结果」这类说法

对照：
✗ 我调用了 wanwan_mcp_2 查询天气，返回 {"temp":28,"desc":"多云"}
✓ 我查了上海今天的天气，28 度，多云。

✗ get_weather 接口报错 timeout，调用失败
✓ 天气没查到，那边一直没反应。

✗ 搜索接口返回了 3 条结果，results 数组第一项 title 是……
✓ 搜到三条，最相关的一条是：……`

const WECHAT_MCP_REPORT_HEADER = `[以下是系统在后台查到的信息，交给你参考。
这不是聊天内容，也不是用户说的话，用户看不到这段文字。
请把它当作你自己刚刚知道的事，结合你的性格自然地用出来。
确实查到了才说事情办好了；没查到就按你的性格简短说明这事暂时没办成。
如果其中提到有需要用户自己点开的入口，自然地提醒用户点一下就行。
不要复述本段文字，也不要提到「系统」「查询」「后台」这些词。]`

const WECHAT_MCP_ROUTING_HISTORY_LIMIT = 6
const WECHAT_MCP_REPORT_MAX_CHARS = 4000
const WECHAT_MCP_MAX_TOOL_CALLS = 6

// 取尾部若干条纯文本历史给跑腿助理；不带图片、不带人设
function flattenWechatMcpContent(content) {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content.map(part => (part && part.type === 'text' ? String(part.text || '') : '')).join('\n')
  }
  return String(content ?? '')
}

function buildWechatMcpRoutingMessages(history) {
  return (Array.isArray(history) ? history : [])
    .filter(message => message && (message.role === 'user' || message.role === 'assistant'))
    .slice(-WECHAT_MCP_ROUTING_HISTORY_LIMIT)
    .map(message => ({ role: message.role, content: flattenWechatMcpContent(message.content) }))
    .filter(message => message.content.trim())
}

function buildWechatMcpToolList(tools) {
  return (Array.isArray(tools) ? tools : [])
    .map(tool => `- ${tool?.function?.name || ''}: ${tool?.function?.description || '（无说明）'}`)
    .join('\n')
}

// 把模型侧的匿名工具名换回用户可读的服务名，防止汇报里漏出 wanwan_mcp_N
function stripWechatMcpToolNames(text, bindings) {
  return String(text || '').replace(/wanwan_mcp_\d+/g, name => {
    const target = bindings?.[name]
    return target?.serverName ? `「${target.serverName}」` : '后台服务'
  })
}

function truncateWechatMcpReport(text) {
  const value = String(text || '').trim()
  if (value.length <= WECHAT_MCP_REPORT_MAX_CHARS) return value
  return value.slice(0, WECHAT_MCP_REPORT_MAX_CHARS) + '\n…[已截断]'
}

// 汇报缺失时的保底：直接把工具结果拼成人可读的行，同样不暴露工具名和参数
function buildWechatMcpFallbackReport(records, bindings) {
  return (Array.isArray(records) ? records : []).map(record => {
    const target = bindings?.[record?.name] || {}
    const source = target.serverName ? `来自「${target.serverName}」：` : '查到的信息：'
    return `${source}\n${renderWechatMcpResultText(record?.result)}`
  }).filter(Boolean).join('\n\n')
}

function renderWechatMcpResultText(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return '（没有内容）'
  let parsed = null
  try { parsed = JSON.parse(text) } catch (_) { return text }
  if (!parsed || typeof parsed !== 'object') return text
  const lines = []
  const walk = (value, depth, label) => {
    const indent = '  '.repeat(depth)
    if (value === null || typeof value !== 'object') {
      lines.push(`${indent}${label ? label + '：' : ''}${String(value)}`)
      return
    }
    if (depth >= 3) {
      lines.push(`${indent}${label ? label + '：' : ''}${JSON.stringify(value)}`)
      return
    }
    if (label) lines.push(`${indent}${label}：`)
    const childDepth = label ? depth + 1 : depth
    if (Array.isArray(value)) {
      value.forEach(item => walk(item, childDepth, ''))
      return
    }
    Object.keys(value).forEach(key => walk(value[key], childDepth, key))
  }
  walk(parsed, 0, '')
  const rendered = lines.join('\n').replace(/\s+$/, '')
  return rendered || text
}

const _mcpTraceRefreshTimers = new Map()

function queueMcpTraceRefresh(scope, conversationId) {
  const key = `${scope}:${conversationId}`
  clearTimeout(_mcpTraceRefreshTimers.get(key))
  _mcpTraceRefreshTimers.set(key, setTimeout(async () => {
    _mcpTraceRefreshTimers.delete(key)
    try {
      if (scope === 'chat') {
        const page = _getVisibleChatWindow('chat', conversationId)
        if (page) await refreshChat(page, { scrollToBottom: true })
        return
      }
      const page = _getVisibleChatWindow('group', conversationId)
      if (!page) return
      const group = await getWechatAccessibleGroup(conversationId)
      if (group) await loadGroupMessages(page, conversationId, group, { force: true, scrollToBottom: true })
    } catch (error) {
      console.warn('[wechat] MCP 轨迹刷新失败:', error)
    }
  }, 30))
}

function createWechatMcpTraceObserver(traceContext, binding, turnId) {
  const traceIds = new Map()
  return async event => {
    if (!db.mcpToolTraces || !traceContext?.scope || !traceContext?.conversationId) return
    const callId = String(event.call?.id || `${event.name}-${Date.now()}`)
    const target = binding.bindings?.[event.name] || {}
    const isLimit = event.limit === true
    if (event.phase === 'start') {
      const id = await db.mcpToolTraces.add({
        scope: traceContext.scope,
        conversationId: Number(traceContext.conversationId),
        turnId,
        callId,
        serverId: target.serverId || '',
        serverName: isLimit ? '系统' : (target.serverName || 'MCP'),
        toolName: isLimit ? '调用上限' : (target.toolName || event.name || ''),
        toolTitle: isLimit ? '已达到本轮调用上限' : (target.title || target.toolName || event.name || '工具'),
        arguments: event.arguments || {},
        status: 'running',
        result: null,
        urls: [],
        error: event.parseError || '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      })
      traceIds.set(callId, id)
      queueMcpTraceRefresh(traceContext.scope, traceContext.conversationId)
      return
    }
    if (event.phase !== 'finish') return
    const traceId = traceIds.get(callId)
    if (!traceId) return
    const detail = event.traceData && typeof event.traceData === 'object' ? event.traceData : {}
    await db.mcpToolTraces.update(traceId, {
      status: event.status === 'cached' ? 'cached' : (event.status === 'success' ? 'success' : 'error'),
      result: detail.result !== undefined ? detail.result : (detail.traceData || event.result || null),
      urls: Array.isArray(detail.urls) ? detail.urls : [],
      error: String(event.error || detail.error || ''),
      updatedAt: Date.now()
    })
    queueMcpTraceRefresh(traceContext.scope, traceContext.conversationId)
  }
}

// 前置跑腿：先让小模型判断并跑完工具，再由它把结果写成一段中文汇报。
// 返回的 noticeText 是给角色看的纯文本纸条；角色请求本身不带任何 tools。
async function runWechatMcpPrefetch(allowMcp, traceContext = {}, history = []) {
  const unavailable = { enabled: false, noticeText: '', close: async () => {} }
  if (!allowMcp || !window.WanWanMCP?.createModelToolBinding ||
      !window.WanWanMCP?.executeEnabledToolDetailed || !window.WanWanMCP?.createExecutionRun) {
    return unavailable
  }
  const routingMessages = buildWechatMcpRoutingMessages(history)
  if (!routingMessages.length) return unavailable

  let executionRun = null
  try {
    const binding = await window.WanWanMCP.createModelToolBinding()
    if (!binding?.tools?.length) return unavailable
    executionRun = window.WanWanMCP.createExecutionRun()
    const turnId = `mcp-turn-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const toolSession = { cache: {}, records: [], contextMessages: [], used: false }

    const raw = await window.callMcpAI(routingMessages, {
      system: WECHAT_MCP_ROUTER_SYSTEM.replace('{{TOOL_LIST}}', buildWechatMcpToolList(binding.tools)),
      tools: binding.tools,
      maxToolCalls: WECHAT_MCP_MAX_TOOL_CALLS,
      toolSession,
      toolObserver: createWechatMcpTraceObserver(traceContext, binding, turnId),
      toolExecutor: async (modelName, args) => {
        const target = binding.bindings?.[modelName]
        if (!target) throw new Error('模型请求了未知的 MCP 工具')
        const detailed = await window.WanWanMCP.executeEnabledToolDetailed(target, args, {
          executionRun,
          confirmRisky: false
        })
        return { modelContent: detailed.modelContent, traceData: detailed }
      }
    })

    const close = async () => {
      await window.WanWanMCP.closeExecutionRun?.(executionRun)
    }
    // 一个工具都没调 → 跑腿助理判断本轮不需要外部信息
    if (!toolSession.records.length) {
      await close()
      return unavailable
    }

    let report = stripWechatMcpToolNames(raw, binding.bindings).trim()
    if (!report || /^no_tools$/i.test(report)) {
      report = stripWechatMcpToolNames(
        buildWechatMcpFallbackReport(toolSession.records, binding.bindings),
        binding.bindings
      )
    }
    report = truncateWechatMcpReport(report)
    if (!report) {
      await close()
      return unavailable
    }
    return { enabled: true, noticeText: `${WECHAT_MCP_REPORT_HEADER}\n\n${report}`, close }
  } catch (error) {
    console.warn('[wechat] MCP 跑腿失败，已降级为普通回复:', error)
    if (executionRun) {
      try { await window.WanWanMCP.closeExecutionRun?.(executionRun) } catch (_) {}
    }
    return unavailable
  }
}

function getWechatTimedInteractions(timeline) {
  return (Array.isArray(timeline) ? timeline : [])
    .map(item => ({
      role: item?.role,
      time: Number(item?.time) || 0
    }))
    .filter(item => item.time > 0 && (item.role === 'user' || item.role === 'assistant'))
}

function calculateWechatReplyGap(timeline, options = {}, nowTimestamp = Date.now()) {
  const interactions = getWechatTimedInteractions(timeline)
  if (!interactions.length) return null
  const last = interactions[interactions.length - 1]
  const isIdleTriggered = options?.idleTriggerMode === 'followup' || options?.idleTriggerMode === 'auto_reply'

  if (isIdleTriggered || last.role === 'assistant') {
    const gapMs = Number(nowTimestamp) - last.time
    return gapMs > WECHAT_TIME_CONTEXT_GAP_MS
      ? { gapMs, previousTime: last.time, currentTime: Number(nowTimestamp), mode: 'idle' }
      : null
  }

  if (last.role !== 'user' || interactions.length < 2) return null
  let batchStartIndex = interactions.length - 1
  while (batchStartIndex > 0) {
    const current = interactions[batchStartIndex]
    const previous = interactions[batchStartIndex - 1]
    const adjacentGap = current.time - previous.time
    if (previous.role !== 'user' || adjacentGap > WECHAT_TIME_CONTEXT_GAP_MS) break
    batchStartIndex -= 1
  }
  if (batchStartIndex === 0) return null
  const batchStart = interactions[batchStartIndex]
  const previous = interactions[batchStartIndex - 1]
  const gapMs = batchStart.time - previous.time
  return gapMs > WECHAT_TIME_CONTEXT_GAP_MS
    ? { gapMs, previousTime: previous.time, currentTime: batchStart.time, mode: 'return' }
    : null
}

function formatWechatInteractionGap(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(Number(milliseconds) / 1000))
  if (totalSeconds < 60) return `${totalSeconds}秒`
  const totalMinutes = Math.floor(totalSeconds / 60)
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60
  const parts = []
  if (days) parts.push(`${days}天`)
  if (hours) parts.push(`${hours}小时`)
  if (minutes) parts.push(`${minutes}分钟`)
  return parts.join('') || '0分钟'
}

function buildWechatTransientTimeNotice(gapContext, nowTimestamp, tzConfig) {
  if (!gapContext || gapContext.gapMs <= WECHAT_TIME_CONTEXT_GAP_MS) return ''
  const nowText = buildWechatTimeContextText(nowTimestamp, tzConfig)
  if (!nowText) return ''
  const gapText = formatWechatInteractionGap(gapContext.gapMs)
  return `[系统时间提示：现在是${nowText}，距离上次互动已过去${gapText}。此前话题可能已经中断，请结合人设、当前时段、消息发送时间和对话内容，判断是自然承接还是重新开启话题。不要直接复述本提示。]`
}

function appendWechatTransientTimeNotice(messages, notice) {
  const list = Array.isArray(messages) ? messages.slice() : []
  if (!notice) return list
  list.push({ role: 'user', content: notice })
  return list
}

// 生成AI回复，同时提取角色心声和当前状态，返回 { thought, status, reply }
async function generateAIReply(chatId, charId, options = {}) {
  const historyLimit = await getChatHistoryLimit(chatId)
  const tzStored = await db.config.get(`chatTimezone_${chatId}`)
  const tzConfig = tzStored?.value || {}
  const context = await buildWechatReplyContext(chatId, charId, historyLimit, tzConfig)
  const history = context.history
  const loreSegments = await getChatLorebookContextSegments(chatId, charId, context.loreMessages)
  const char = await window.getCharacter(charId)
  const charName = char?.nick || char?.name || ''
  const userName = _wechatUser?.name || '用户'
  const userNick = _wechatUser?.nick || ''
  const stickerMap = await getMountedStickerMap(chatId)
  const stickerNames = Object.keys(stickerMap)
  const timeSettings = await getChatTimeSettings(chatId)
  const bilingualSettings = await getChatBilingualSettings(chatId)
  const imageGenSettings = await getChatImageGenSettings(chatId)
  const imageGenEnabled = !!imageGenSettings.enabled && await isImageGenReady()
  const thoughtTemplate = await getChatThoughtTemplateConfig(chatId)
  const idleContext = await getPrivateReplyIdleContext(chatId, options)
  const memoryCtx = window.WanWanMemory?.getMemoryContext
    ? await window.WanWanMemory.getMemoryContext(chatId, charId, _wechatUid, context.loreMessages)
    : ''
  const mcp = await runWechatMcpPrefetch(options.allowMcp === true, {
    scope: 'chat',
    conversationId: chatId
  }, context.textHistory || history)
  const system = await buildChatSystem(char, loreSegments, charName, userName, userNick, stickerNames, tzConfig, timeSettings, thoughtTemplate, memoryCtx, bilingualSettings, imageGenEnabled, options.replyRequirement, idleContext, chatId)
  const avatarCtx = await buildWechatAvatarContext(charId)
  const nowTimestamp = Date.now()
  const gapContext = calculateWechatReplyGap(context.gapTimeline || context.timeline, options, nowTimestamp)
  const timeNotice = buildWechatTransientTimeNotice(gapContext, nowTimestamp, tzConfig)
  const baseMessages = avatarCtx ? [avatarCtx.imageMessage].concat(history) : history
  const baseFallbackMessages = avatarCtx
    ? [avatarCtx.textMessage].concat(context.textHistory || history)
    : (context.textHistory || history)
  // 时间提示在前，MCP 汇报在后（离生成点更近）
  const messages = appendWechatTransientTimeNotice(
    appendWechatTransientTimeNotice(baseMessages, timeNotice), mcp.noticeText)
  const fallbackMessages = appendWechatTransientTimeNotice(
    appendWechatTransientTimeNotice(baseFallbackMessages, timeNotice), mcp.noticeText)
  const hasFallbackMessages = !!avatarCtx || !!context.hasVisualContent
  const opts = {
    system,
    responseFormat: 'json_object',
    temperature: await window.getAITemperaturePreset('wechatPrivate')
  }
  try {
    let { normalized, messages: activeMessages, opts: activeOpts } = await callWechatAIWithFallback(messages, fallbackMessages, opts, hasFallbackMessages)
    if (!isBilingualReplyCompliant(normalized.reply, bilingualSettings, charName)) {
      const retryMessages = activeMessages.concat({
        role: 'user',
        content: buildBilingualCorrectionPrompt(bilingualSettings)
      })
      const raw = await window.callAI(retryMessages, activeOpts)
      normalized = parseWechatAIResponse(raw)
    }
    return normalized
  } finally {
    await mcp.close()
  }
}

// 刷新聊天消息列表
async function refreshChat(chatPage, options = {}) {
  const runRead = async operation => window.runWanWanDBRead
    ? await window.runWanWanDBRead(operation)
    : await operation()
  // 群聊窗口：转交群消息加载
  if (chatPage?.dataset?.groupId) {
    const groupId = parseInt(chatPage.dataset.groupId)
    const group = await runRead(() => getWechatAccessibleGroup(groupId))
    if (group) await runRead(() => loadGroupMessages(chatPage, groupId, group, options))
    return
  }
  const chatId = parseInt(chatPage.dataset.chatId)
  await runRead(() => loadChatMessages(chatPage, chatId, options))
}


// 合并全局世界书 + 本对话挂载的局部世界书（分段版：{ before, middle, after }）
// 世界书条目标题以「[线上]」或「[线下]」开头时，只在对应场景使用（也兼容【线上】【线下】）。
// scene: 'online'（微信聊天/通话/群聊）| 'offline'（想见你）；没写前缀的条目两边都用。
function loreEntryMatchesScene(entry, scene) {
  const m = String(entry?.title || '').match(/^\s*[\[【]\s*(线上|线下)\s*[\]】]/)
  if (!m) return true
  return (m[1] === '线上') === (scene !== 'offline')
}

async function getChatLorebookContextSegments(chatId, charId, recentMsgs) {
  const dialogText = recentMsgs.map(m => m.content || '').join(' ')
  const allBooks = (await db.config.get('lorebooks'))?.value || []
  const matched = []

  // 全局函数命中的条目（全局书 + 绑定当前角色的单人书）
  for (const book of allBooks) {
    if (!book.enabled) continue
    const ids = book.charIds || []
    if (book.scope === 'personal' && !ids.includes(charId)) continue
    for (const entry of book.entries || []) {
      if (!entry.enabled) continue
      if (!loreEntryMatchesScene(entry, 'online')) continue
      const hit = !entry.keywords?.length || entry.keywords.some(kw => kw && dialogText.includes(kw))
      if (hit) matched.push(entry)
    }
  }

  // 本会话挂载的单人书条目
  const mounted = await db.config.get(`chatLore_${chatId}`)
  const mountedIds = normalizeChatLoreMountIds(mounted?.value, allBooks, charId)
  if (mountedIds.length) {
    const mountedIdSet = new Set(mountedIds)
    for (const book of allBooks.filter(b =>
      b.scope === 'personal'
      && mountedIdSet.has(String(b.id))
      && b.enabled !== false
      && !(b.charIds || []).includes(charId)
    )) {
      for (const entry of (book.entries || []).filter(e => e.enabled !== false)) {
        if (!loreEntryMatchesScene(entry, 'online')) continue
        const hit = !entry.keywords?.length || entry.keywords.some(kw => dialogText.includes(kw))
        if (hit) matched.push(entry)
      }
    }
  }

  return window.buildLorebookSegments
    ? window.buildLorebookSegments(matched)
    : { before: '', middle: matched.map(e => e.content).filter(Boolean).join('\n\n'), after: '' }
}

// 合并串版本（群聊、语音通话等旧调用点继续使用，行为不变）
async function getChatLorebookContext(chatId, charId, recentMsgs) {
  const seg = await getChatLorebookContextSegments(chatId, charId, recentMsgs)
  return [seg.before, seg.middle, seg.after].filter(Boolean).join('\n\n')
}

async function getPrivateReplyIdleContext(chatId, options = {}) {
  const triggerMode = ['followup', 'auto_reply'].includes(options?.idleTriggerMode)
    ? options.idleTriggerMode
    : ''
  const explicitIdleMinutes = parseInt(options?.idleMinutes, 10)
  if (triggerMode) {
    return {
      enabled: true,
      mode: triggerMode,
      idleMinutes: Number.isFinite(explicitIdleMinutes) ? Math.max(1, explicitIdleMinutes) : 1,
      lastAssistantMessageCreatedAt: 0,
      impulseHint: String(options?.impulseHint || '')
    }
  }
  const messages = await db.messages.where('chatId').equals(Number(chatId)).sortBy('createdAt')
  const lastMessage = messages.length ? messages[messages.length - 1] : null
  if (!lastMessage || lastMessage.role !== 'assistant') {
    return { enabled: false, mode: '', idleMinutes: 0, lastAssistantMessageCreatedAt: 0 }
  }
  const createdAt = Number(lastMessage.createdAt) || 0
  const idleMinutes = Math.max(1, Math.floor((Date.now() - createdAt) / 60000))
  return {
    enabled: true,
    mode: 'followup',
    idleMinutes,
    lastAssistantMessageCreatedAt: createdAt
  }
}


// 构建聊天系统提示词（loreCtx 可为字符串或 { before, middle, after } 分段对象）
async function buildChatSystem(char, loreCtx, charName, userName, userNick, stickerNames, tzConfig, timeSettings, thoughtTemplate, memoryCtx, bilingualSettings, imageGenEnabled, replyRequirement = '', idleContext = null, chatId = null) {
  const loreSeg = (loreCtx && typeof loreCtx === 'object')
    ? loreCtx
    : { before: '', middle: loreCtx || '', after: '' }
  const currentRelationText = buildCurrentRelationText(char)
  const userDesc = _wechatUser?.description || '(未设定)'
  const now = new Date()
  const timeAwarenessEnabled = !!timeSettings?.awareness

  let part2
  if (tzConfig?.enabled && tzConfig.charTimezone && tzConfig.userTimezone) {
    const charTimeStr = formatWechatFullDateTime(now.getTime(), tzConfig.charTimezone)
    const charHour = parseInt(now.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: tzConfig.charTimezone }))
    const charTod = getTimeOfDay(charHour)
    const userTimeStr = formatWechatFullDateTime(now.getTime(), tzConfig.userTimezone)
    const userHour = parseInt(now.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: tzConfig.userTimezone }))
    const userTod = getTimeOfDay(userHour)
    const charLoc = tzConfig.charLocation || tzConfig.charTimezone
    const userLoc = tzConfig.userLocation || tzConfig.userTimezone
    part2 = buildSystemPart2Tz(charName, charLoc, charTimeStr, charTod, userName, userNick, userLoc, userTimeStr, userTod, currentRelationText, userDesc, timeAwarenessEnabled)
  } else {
    const timeStr = formatWechatFullDateTime(now.getTime())
    const h = now.getHours()
    const tod = getTimeOfDay(h)
    part2 = buildSystemPart2(timeStr, tod, userName, userNick, currentRelationText, userDesc, timeAwarenessEnabled)
  }

  try {
    if (window.getMusicTogetherContext) {
      const musicCtx = await window.getMusicTogetherContext()
      if (musicCtx && String(musicCtx.friendId) === String(char?.id)) {
        const songLabel = musicCtx.songName + (musicCtx.artist ? ' - ' + musicCtx.artist : '')
        part2 += '\n[当前和用户在网易云音乐一起听歌，当前歌曲：' + songLabel +
          (musicCtx.lyricLine ? '，当前歌词：' + musicCtx.lyricLine : '') + ']'
      }
    }
  } catch (e) {}

  const loreAfterBlock = loreSeg.after
    ? `# 【补充世界观设定】\n${loreSeg.after}\n\n---\n\n`
    : ''
    let system = buildSystemPart5(charName, userName, thoughtTemplate) +
    buildSystemBilingualPart(bilingualSettings) +
    buildSystemPart1(char, charName, loreSeg.middle, loreSeg.before) +
    loreAfterBlock +
    buildSystemPart3(charName, userName, stickerNames, imageGenEnabled) +
    buildSystemPart4(charName, userName) +
    buildSystemMemoryPart(memoryCtx) +
    part2

  if (imageGenEnabled) system += '\n\n' + buildImagePromptGuide(charName, userName)
  const ttsTagHintChat = await getTTSTagHint('chat', charName)
  if (ttsTagHintChat) system += '\n\n' + ttsTagHintChat
  if (window.ProseGuard && window.ProseGuard.isEnabled('wechat')) system += '\n\n# 【文风】\n' + window.ProseGuard.styleRule({ short: true, prefix: '- ' })
  const scheduleCtxChat = await getScheduleContext()
  if (scheduleCtxChat) system += '\n\n' + scheduleCtxChat
  const charSchedChat = await getCharScheduleContext(chatId, charName)
  if (charSchedChat) system += '\n\n' + charSchedChat
  if (idleContext?.enabled && idleContext.mode === 'followup') system += '\n\n' + buildSystemFollowupPart(idleContext)
  if (idleContext?.enabled && idleContext.mode === 'followup' && idleContext.impulseHint) system += '\n\n' + idleContext.impulseHint
  if (idleContext?.enabled && idleContext.mode === 'auto_reply') system += '\n\n' + buildSystemAutoReplyPart(idleContext)
  const requirement = String(replyRequirement || '').trim()
  if (requirement) {
    system += `\n\n# 【回复要求】\n这是用户对本次回复提出的要求。\n回复要求：${requirement}`
  }
  return system
}

function buildSystemFollowupPart(followupContext) {
  const idleMinutes = Math.max(1, parseInt(followupContext?.idleMinutes, 10) || 1)
  const elapsedText = idleMinutes >= 20 ? '一段时间' : `${idleMinutes} 分钟`
  return `# 【继续追发规则】

当前情景：你上一条微信已经发出${elapsedText}，对方一直没有回复，也没有发来任何新消息，对话此刻停在你这一边。

你这次**必须继续主动发送至少一条微信消息**，像真实聊天里对方暂时没回时的顺势追发。追发有两种自然走向，自行选择更符合当下状态的一种：
- **承接上文**：顺着你上一条消息或当前话题继续说，可以是平静补充、关心追问、提醒催促、试探确认、撒娇埋怨或轻微质问；
- **另起话头**：如果上一个话题已经说完或不适合继续追，也可以像真人一样自然聊起别的，分享刚发生的事、突然想到的东西、你人设生活里的日常等。

无论哪种走向，语气和强弱都由你们的关系亲密度、当前情绪张力、角色性格和当前时间点决定，必须符合人设与上下文。
你可以自然流露“怎么还没回我”之类的情绪（如果符合关系与性格）。不要机械重复你上一条消息的原文，也不要原地打转；无论是承接旧话题还是换新话题，都要让聊天实际往前推进。不要在消息里解释这条消息为什么会出现。`
}

function buildSystemAutoReplyPart(idleContext) {
  const idleMinutes = Math.max(1, parseInt(idleContext?.idleMinutes, 10) || 1)
  const elapsedText = idleMinutes >= 20 ? '一段时间' : `${idleMinutes} 分钟`
  return `# 【自动回复规则】

当前情景：对方的最后一条微信已经发来${elapsedText}，你一直没有回复，对话停在对方那边等你开口。

你这次**必须回复至少一条微信消息**，像真人隔了一会儿才看到消息或忙完才回的样子，并且**必须先回应对方最后一条消息的实际内容**（有问必答、有分享必有反应），之后可顺势延展或抛新话头。
间隔不久或你人设本就回复慢，可直接接话；间隔较久可先自然带一句刚才在做什么再接话，理由要具体、每次不同、符合当前时段与人设作息，禁用“刚没看到手机”式模板句。
判断对方消息的时间逻辑时应以其发送时间为准，不要用当前时间指摘它有“时间矛盾”。注意：不要在消息里解释这条消息为什么会出现。`
}

function buildSystemBilingualPart(bilingualSettings) {
  const cfg = normalizeChatBilingualSettings(bilingualSettings)
  if (!cfg.enabled) return ''
  const sourceLabel = getChatBilingualLangLabel(cfg.sourceLang)
  const targetLabel = getChatBilingualLangLabel(cfg.targetLang)
  const example = `[${getChatBilingualExample(cfg.sourceLang)}「${targetLabel}翻译」]`
  return `# 【双语模式特别指令（最高优先级）】

当前聊天已启用双语模式。原文语言：${sourceLabel}；翻译语言：${targetLabel}。当角色使用外语回复时，**必须且只能使用${sourceLabel}**，禁止使用${sourceLabel}以外的其他外语（例如英语）——除非角色人设另有明确母语设定。每条${sourceLabel}消息都必须在同一条消息内附带${targetLabel}翻译。

普通外语文字消息必须严格使用格式：[{${sourceLabel}原文}「{${targetLabel}翻译}」]，例如：${example}。${targetLabel}翻译文本视为系统自翻译，不视为角色的原话；不要解释“设置”或询问“什么设置”。当你的角色想要说中文时，需要根据你的角色设定自行判断对于中文的熟悉程度来造句，并使用普通消息的标准格式：[{中文消息内容}]，此时不需要附带翻译。**外语语音消息**在双语模式下也须使用相同格式：[{${sourceLabel}原文}「{${targetLabel}翻译}」]，例如：${example}。中文语音消息可使用普通语音格式，不需要附带翻译。这条规则的优先级非常高，请务必遵守。

---

`
}

function isBilingualReplyCompliant(reply, bilingualSettings, charName) {
  const cfg = normalizeChatBilingualSettings(bilingualSettings)
  if (!cfg.enabled) return true
  const lines = splitMessageLines(reply)
  for (const line of lines) {
    const parsed = parseMsgType(line, charName)
    if (parsed.type === 'status-update') continue
    if (parsed.type === 'text' && !isBilingualLineCompliant(parsed.data.text)) return false
    if (parsed.type === 'voice' && !isBilingualLineCompliant(parsed.data.text)) return false
  }
  return true
}

function isBilingualLineCompliant(text) {
  if (parseBilingualText(text).translation) return true
  return containsChineseText(text) && !containsForeignScriptText(text)
}

function containsChineseText(text) {
  return /[\u3400-\u9fff\uf900-\ufaff]/.test(String(text || ''))
}

function containsForeignScriptText(text) {
  return /[A-Za-z\u3040-\u30ff\uac00-\ud7af\u0400-\u04ff\u0e00-\u0e7f\u0600-\u06ff]/.test(String(text || ''))
}

function buildBilingualCorrectionPrompt(bilingualSettings) {
  const cfg = normalizeChatBilingualSettings(bilingualSettings)
  const sourceLabel = getChatBilingualLangLabel(cfg.sourceLang)
  const targetLabel = getChatBilingualLangLabel(cfg.targetLang)
  return `系统纠错：上一条 reply 没有遵守当前聊天已开启的双语模式。请重新输出同一个 JSON 对象结构。reply 字段中，外语普通文字消息和外语语音消息必须使用 [{${sourceLabel}原文}「{${targetLabel}翻译}」] 格式；如果角色按人设主动说中文，可以使用纯中文普通消息或中文语音消息，不需要翻译。禁止解释规则。`
}

function buildSystemMemoryPart(memoryCtx) {
  if (!memoryCtx) return ''
  return `# 【长期记忆】
以下记忆只属于当前微信账号与当前角色之间的关系。请自然参考这些事实，不要机械复述，也不要提到“记忆系统”。

${memoryCtx}

---

`
}

// 系统提示词Part5：输出格式
function buildSystemPart5(charName, userName, thoughtTemplate) {
  const thoughtRule = normalizeThoughtTemplateConfig(thoughtTemplate)
  const thoughtLine = thoughtRule.enabled && thoughtRule.promptSuffix.trim()
    ? `- "thought"：${charName}此刻真实的心声原文，至少10个字，${_WECHAT_THOUGHT_MAX}字以内。**每轮必须更新，不得为空。**必须额外遵守这个心声格式要求：${thoughtRule.promptSuffix.trim()}。这个格式只允许写进 JSON 顶层字段 "thought"，**禁止写进 reply**。若 chain 非空，thought 须与 chain 一致、更短。`
    : `- "thought"：${charName}此刻真实的内心独白，第一人称，至少10个字，${_WECHAT_THOUGHT_MAX}字以内。**每轮必须更新，不得为空。**若 chain 非空，thought 须与 chain 一致、更短。`
  return `# 【输出格式（最高优先级，全程生效）】

⚠️ **每次回复必须且只能输出一个合法 JSON 对象，JSON 外禁止任何文字（含 markdown 代码块）。**禁止依赖第二轮回复补全字段；所有字段必须在当前这一条输出中一次性给齐。

字段说明（四个键都必须出现；无思维链时 chain 用空字符串 ""）：
- "chain"：内心推演与思维链，可较长。**若写 chain，须先在其中推理，再凝练出 thought。**不需要长推理时填 "" 即可。
${thoughtLine}
- "status"：${charName}当前状态，**每轮必须更新**，必须简洁，1-15字左右，例如 "正在聊天"、"刚洗完澡"、"有点困"。不要写长句、不要加标点、不要写成对话。
- "reply"：实际发给${userName}的内容，多条消息之间用 \\n 隔开。**必须至少包含一条可见聊天消息，不得只写状态更新格式。**
- "event"（可选，没有就不要写这个字段）：当${charName}在这一轮消息里说出了一件会占用他一段时间、之后才能回消息的具体安排（上班、执飞、开会、出差、上课、出门办事等），填 {"title":"事件名，10字内","start_in_minutes":从现在起多少分钟后开始（马上开始填0）,"duration_minutes":预计持续多少分钟}。时长按事情的实际情况合理估算（比如执飞按航程），只填数字，不要写“明天”“待会儿”这类相对时间的文字。
- "event_done"（可选）：当${charName}在这一轮消息里表示自己忙完了、落地了、下班了，填 true。
- "approval"（可选）：当聊天记录里有状态为“待审批”的「购物审批」申请，并且你在这一轮回复里已经做出最终决定时，填 {"title":"商品名","decision":"approve 或 reject"}。如果你还想追问、讨价还价、没有最终决定，就不要写这个字段。决定要符合你的人设、你和${userName}的关系，以及价格和理由是否合理；批准或拒绝都要在回复里自然地说出你的理由，不要只写一个字。

✅ 正确：{"chain":"用户语气冲，可能累了…先稳住。","thought":"他今天心情不好，我得小心点…","status":"正在聊天","reply":"怎么了？\\n发生什么事了吗"}
✅ 无长推理：{"chain":"","thought":"他今天心情不好，我得小心点…","status":"有点担心","reply":"怎么了？\\n发生什么事了吗"}
❌ 错误（禁止）：好的，我来回复：{"thought":"…","reply":"…"}

---

`
}

// 构建当前私聊双方关系：只读取当前 AI 角色对登录用户的关系，不读取反向关系。
function buildCurrentRelationText(char) {
  const relations = char?.relations || []
  const rel = relations.find(r => r.charId === _wechatUid)
  if (!rel || !rel.type) return '(未设定)'
  return rel.type + (rel.desc ? `（${rel.desc}）` : '')
}


// 系统提示词Part1：角色设定（loreBefore 为「前」时机的世界书，注入在核心人设之前）
function buildSystemPart1(char, charName, loreCtx, loreBefore = '') {
  const loreBeforeBlock = loreBefore ? `## 前置世界观设定\n${loreBefore}\n\n` : ''
  return `# 【最高指令：沉浸式角色扮演】
你正在进行一场线上微信聊天。每次回复像真实发微信一样：根据情绪和话题自由决定发几条、每条多短，拒绝千篇一律的回复节奏。只能发文字，**禁止任何"*动作*"或旁白叙述**。
**你当前正在微信聊天中回复，不是在输出线下模式内容。**线下见面记录只用于理解已经发生或可能仍在延续的关系状态；最终 reply 必须是微信气泡里的消息。
如果上下文提示“线下见面已经结束”，只能把它当作过去发生过的事参考。如果提示“线下模式尚未结束”，你需要结合后续微信消息判断双方是否仍处于面对面状态，但回复仍然必须发生在微信聊天里。
禁止在 reply 中直接写线下动作、旁白、场景描写，或说“我现在在线下模式”“根据线下记录”等元说明。
**你的真实身份是：${charName}**

---

# 【Part 1: 你是谁】

${loreBeforeBlock}## 核心人设
${char.gender ? `- **性别**：${char.gender}` : ''}
${char.role ? `- **身份**：${char.role}` : ''}

${char.description || '(未设定，以普通人逻辑行事)'}

## 世界观设定
${loreCtx || '(无特殊世界观，以现实生活逻辑为准)'}

---

`
}

// 系统提示词Part2：当前情景
function buildSystemPart2(timeStr, tod, userName, userNick, currentRelationText, userDesc, timeAwarenessEnabled) {
  const nickLine = userNick ? `- **对方微信昵称**：${userNick}\n` : ''
  const timeBlock = timeAwarenessEnabled
    ? `【Priority: Absolute Time Awareness】
当前真实时间：${timeStr}，时段：${tod}。
你需要同时理解当前时间与聊天记录中的历史时间锚点。判断用户是在描述当下、回忆过去还是安排未来时，应结合消息发送时间、上下文语义与当前时间，不要只凭某个时间词武断判断。
执行规则：
1. 你的状态、行为、可能正在做的事情，必须与当前时间段（${tod}）逻辑一致。
2. 只有在用户明确描述“此刻”且内容与当前时间确实冲突时，才可按人设自然表现疑惑或询问；若是在回忆、转述、回复旧话题或讨论计划，不要误判为时间矛盾。
3. 聊天记录里的“[系统时间：…（昨天/前天/N天前）]”标记了其后消息发生的日期。标记为昨天或更早的事（吃过的饭、睡过的觉、做过的事）属于那一天，不要当成今天已经发生的事；今天的饭、觉、活动只按标记为“今天”的内容和当前时间来算。`
    : `- **当前时间**：${timeStr}（${tod}）`
  return `# 【Part 2: 当前情景】

${timeBlock}
- **对方姓名**：${userName}
${nickLine}- **与对方的关系**：${currentRelationText}
- **对方背景**：${userDesc}

---

`
}

function buildSystemPart2Tz(charName, charLoc, charTime, charTod, userName, userNick, userLoc, userTime, userTod, currentRelationText, userDesc, timeAwarenessEnabled) {
  const nickLine = userNick ? `- **对方微信昵称**：${userNick}\n` : ''
  const timeBlock = timeAwarenessEnabled
    ? `【Priority: Absolute Time Awareness】
当前真实时间：${charName}所在地为${charTime}（${charTod}）；${userName}所在地为${userTime}（${userTod}）。
你需要同时理解双方当前时间与聊天记录中的历史时间锚点。判断用户是在描述当下、回忆过去还是安排未来时，应结合消息发送时间、上下文语义与当前时间，不要只凭某个时间词武断判断。
执行规则：
1. ${charName}的状态、行为、可能正在做的事情，必须与${charTod}逻辑一致；判断与${userName}相关的时间逻辑（例如对方是否方便接听、是否在睡觉）时，须以${userTod}为准。
2. 若双方日期或时段存在显著差异，应在确实影响当前话题时自然体现这种差异，不要机械报时。
3. 只有在用户明确描述“此刻”且内容与其所在地当前时间确实冲突时，才可按人设自然表现疑惑或询问；若是在回忆、转述、回复旧话题或讨论计划，不要误判为时间矛盾。
3. 聊天记录里的“[系统时间：…（昨天/前天/N天前）]”标记了其后消息发生的日期。标记为昨天或更早的事（吃过的饭、睡过的觉、做过的事）属于那一天，不要当成今天已经发生的事；今天的饭、觉、活动只按标记为“今天”的内容和当前时间来算。`
    : `- **当前时间**：此时${charName}处于${charLoc}，当前时间为${charTime}（${charTod}）；${userName}处于${userLoc}，当前时间为${userTime}（${userTod}）`
  return `# 【Part 2: 当前情景】

${timeBlock}
- **对方姓名**：${userName}
${nickLine}- **与对方的关系**：${currentRelationText}
- **对方背景**：${userDesc}

---

`
}


// 系统提示词Part3：消息能力
function buildSystemPart3(charName, userName, stickerNames, imageGenEnabled) {
  // 表情包能力：仅当本会话挂载了表情包分组、且分组下有表情时才开放
  const hasStickers = Array.isArray(stickerNames) && stickerNames.length > 0
  const stickerCapability = hasStickers
    ? `**表情包**（**仅可从下列已知名称中挑选发送，禁止虚构、禁止改写名称**）：${stickerNames.join(' ｜ ')}
格式：\`[${charName}的表情包：{从上述名单中精确复制一个名称}]\``
    : `**表情包**：当前会话未挂载任何表情包分组，**禁止使用任何表情包格式**。`
  const photoLine = imageGenEnabled
    ? `**照片** \`[${charName}发来的照片：{English image prompt, 以 [SHOT:XXX] 开头，详见末尾 IMAGE PROMPT GUIDE}]\``
    : `**照片** \`[${charName}发来的照片：{画面描述}]\``

  return `# 【Part 3: 消息能力】

> 普通聊天直接回复文字。
> **想连发多条短消息时，用换行符 \`\\n\` 把它们隔开**——每一行会被渲染成一条独立的微信气泡，就像真人连发好几条消息那样。
> 想发特殊消息（语音 / 照片 / 转账 / 表情包 / 位置 / 引用 / 撤回等）时，直接输出下面的括号格式，**且每条特殊消息必须独占一行**（前后用换行隔开），否则不会被识别。

**语音消息** \`[${charName}的语音：{语音文字}]\`
${photoLine}
${stickerCapability}
**转账** \`[${charName}的转账：{金额}元；备注：{备注文字}]\`
**位置** \`[${charName}的位置：{地点名称}{可选详址}；距你约{距离}{单位}]\`
**引用回复** \`[${charName}引用"${userName}：原句"并回复：{你的回复}]\`
**撤回消息** \`[${charName}撤回了一条消息：{被撤回内容}]\`
**拍一拍** \`[${charName}拍了拍${userName}{可选后缀}]\`，例如 \`[${charName}拍了拍${userName}的肩膀]\`
**接受/退回转账** \`[${charName}接收${userName}的转账]\` 或 \`[${charName}退回${userName}的转账]\`

**淘宝代付**（请对方帮你付款，金额自由填写） \`[${charName}的淘宝代付：{商品名称}；¥{金额}]\`
**淘宝赠送**（你已付款，把礼物送给对方） \`[${charName}的淘宝赠送：{商品名称}；¥{金额}]\`
**回应对方的淘宝代付**：帮TA付款 \`[${charName}帮${userName}付了淘宝代付]\`，或拒绝 \`[${charName}拒绝了${userName}的淘宝代付]\`
**回应对方的淘宝赠送**：收下 \`[${charName}接收了${userName}的淘宝礼物]\`，或退回 \`[${charName}退回了${userName}的淘宝礼物]\`

**回应对方的外卖代付**（YumYum，付款后才会生成订单号与送达时间）：帮TA付款 \`[${charName}帮${userName}付了外卖代付]\`，或拒绝 \`[${charName}拒绝了${userName}的外卖代付]\`
**回应对方的外卖赠送/请客**（YumYum）：收下 \`[${charName}收下了${userName}的外卖]\`，或退回 \`[${charName}退回了${userName}的外卖]\`

**发起语音通话** \`[${charName}发起语音通话]\`
**发起视频通话** \`[${charName}发起视频通话]\`

状态不要写进 reply；请使用 JSON 顶层字段 "status" 每轮更新当前状态。

---

`
}

function buildImagePromptGuide(charName, userName) {
  return `# IMAGE PROMPT GUIDE

照片描述以 [SHOT:XXX] 开头，XXX 选自：
  PORTRAIT - 人物特写/自拍（1人，近景）
  ACTION - 人物动作/全身（1人，中远景）
  PAIR - 两人同框
  GROUP - 三人及以上
  STILL - 物品/静物（无人）
  VISTA - 风景（无人）

规则：
1. 全部用 English
2. 一句流畅英文，40-80 words
3. 顺序：镜头 -> 主体 -> 姿势/动作 -> 表情 -> 环境 -> 光线 -> 氛围
4. 具体生动，禁止空洞：
   bad: "a pretty girl, nice lighting"
   good: "she leans against a doorframe, golden afternoon light, dust motes drifting"
5. 按类型开头：
   PORTRAIT -> "A close-up portrait of..."
   ACTION -> "A full-body shot of..."
   PAIR -> "A wide shot of two people..."
   GROUP -> "A wide environmental shot of several people..."
   STILL -> "A still life of..."
   VISTA -> "A landscape view of..."

示例：
  [${charName}发来的照片：[SHOT:PORTRAIT] A soft close-up selfie, gentle smile at the camera, warm cafe lighting, shallow bokeh, cozy afternoon.]
  [${charName}发来的照片：[SHOT:ACTION] A cinematic side shot walking along a quiet shore, hair lifted by sea breeze, golden-hour rim light, serene.]
  [${charName}发来的照片：[SHOT:STILL] A top-down close-up of a strawberry cake on a white plate, pastel kitchen, soft window light, no people in frame.]
  [${charName}发来的照片：[SHOT:PAIR] A medium shot of ${charName} and ${userName} side by side, autumn park, warm glow, candid smiles.]
  [${charName}发来的照片：[SHOT:GROUP] A wide shot of several friends gathered around a hotpot table, steam rising, warm restaurant lighting, lively.]
  [${charName}发来的照片：[SHOT:VISTA] A wide view of a rain-soaked city skyline at dusk, neon reflections on wet pavement, moody blue-orange gradient sky.]
`
}


// 系统提示词Part4：行为守则
function buildSystemPart4(charName, userName) {
  return `# 【Part 4: 行为守则】

1. 完全沉浸在你的人设里，像真人一样自然聊天。
2. 你有自己的想法、情绪、生活节奏和底线。可以表达不同意见，也可以拒绝不合理请求。
3. 根据你和${userName}的关系调整语气和态度，保持人物一致。
4. 回复要像真人聊天一样，短、快、口语化、少用标点。只在必要时候进行长篇大论的回复。对话要自然、符合上下文逻辑，适当开启新话题。
5. 不要只回答问题，要主动分享、追问、延展话题，让聊天自然继续。
6. 如果对方发送了链接并要求你读取 URL，你可以尝试理解链接内容；如果无法联网访问、无法打开、或无法确认内容，必须自然地说打不开/加载不出来/看不到内容，禁止编造链接内容。
7. 绝对不能透露自己是AI或模型。

---

现在，作为 **${charName}**，给 **${userName}** 回复。`
}


// 输入中动画
function showTypingIndicator(container) {
  const id = 'typing-' + Date.now()
  container.insertAdjacentHTML('beforeend', `
    <div class="msg-row msg-other" id="${id}">
      <div class="msg-bubble bubble-other typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `)
  scrollChatToBottom(container)
  return id
}

function removeTypingIndicator(container, id) {
  const el = document.getElementById(id)
  if (el) el.remove()
}


// ===== 加号菜单分发 =====
function handlePlusAction(chatPage, type) {
  switch (type) {
    case 'voice':      showVoiceInputSheet(chatPage); break
    case 'photo-sim':  showPhotoSimSheet(chatPage); break
    case 'photo-real':
      window.showImagePicker((imageUrl) => {
        if (!imageUrl) return
        showRealImageSendModal({
          src: imageUrl,
          onConfirm: ({ src, desc }) => sendRealPhotoFromUrl(chatPage, src, desc)
        })
      })
      break
    case 'transfer':   showTransferSheet(chatPage); break
    case 'location':   showLocationSheet(chatPage); break
    case 'link':       showVirtualLinkSheet(chatPage); break
    case 'shop-approval': showShopApprovalPage(chatPage); break
  }
}

function getLinkSiteName(url) {
  let host = ''
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch (_) {
    return '链接'
  }
  if (host.includes('douyin.com')) return '抖音'
  if (host.includes('xiaohongshu.com') || host.includes('xhslink.com')) return '小红书'
  if (host.includes('bilibili.com') || host.includes('b23.tv')) return '哔哩哔哩'
  if (host.includes('weibo.com') || host.includes('weibo.cn')) return '微博'
  if (host.includes('kuaishou.com')) return '快手'
  if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube'
  if (host.includes('instagram.com')) return 'Instagram'
  if (host.includes('x.com') || host.includes('twitter.com')) return 'X'
  return host || '链接'
}

function isValidHttpUrl(url) {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch (_) {
    return false
  }
}

// ===== 购物审批 =====
// 用户在聊天加号面板里发起一张“购物审批”卡片；角色在回复里表态（批准/拒绝），卡片状态随之更新。
// 只在聊天里生效：不读取商品链接，不联动钱包、不记账。配图单独存在消息的 shopImage 字段里，不会发给 AI。
const SHOP_APPROVAL_PREFIX = '__SHOPAPPROVAL__'

function normalizeShopApproval(d) {
  d = d && typeof d === 'object' ? d : {}
  return {
    title: String(d.title || '').trim().slice(0, 60),
    price: Number(d.price) > 0 ? Math.round(Number(d.price) * 100) / 100 : 0,
    url: String(d.url || '').trim().slice(0, 300),
    reason: String(d.reason || '').trim().slice(0, 500),
    deadline: Number(d.deadline) > 0 ? Number(d.deadline) : 0
  }
}

function parseShopApprovalPayload(raw) {
  return normalizeShopApproval(_safeJsonParse(raw, {}))
}

function buildShopApprovalContent(d) {
  return SHOP_APPROVAL_PREFIX + JSON.stringify(normalizeShopApproval(d))
}

function shopApprovalStatusLabel(status) {
  return status === 'approved' ? '已批准' : status === 'rejected' ? '已拒绝' : '待审批'
}

function formatShopDeadline(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  const p = n => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}月${d.getDate()}日 ${p(d.getHours())}:${p(d.getMinutes())}`
}

function buildShopApprovalFallbackText(data, msg) {
  const d = normalizeShopApproval(data)
  const status = shopApprovalStatusLabel(msg && msg.shopStatus)
  const me = (typeof _wechatUser !== 'undefined' && _wechatUser && (_wechatUser.nick || _wechatUser.name)) || '用户'
  return `[购物审批申请（${me}想买东西，向你申请）：商品「${d.title}」；价格 ¥${d.price}；理由：${d.reason || '（未写）'}` +
    (d.deadline ? `；截止时间：${formatShopDeadline(d.deadline)}` : '') +
    (d.url ? `；商品链接：${d.url}（系统不会读取链接内容，不要假装看过）` : '') +
    `；当前状态：${status}]`
}

function renderShopApprovalCard(data, msg, isSelf) {
  const d = normalizeShopApproval(data)
  const status = (msg && msg.shopStatus) || 'pending'
  const img = msg && msg.shopImage
    ? `<img src="${wcEscHtml(msg.shopImage)}" alt="">`
    : '<i class="fa-solid fa-cart-shopping"></i>'
  const deadline = d.deadline ? `<div class="shop-card-foot">截止时间：${wcEscHtml(formatShopDeadline(d.deadline))}</div>` : ''
  return `
    <div class="msg-card shop-card card-${isSelf ? 'self' : 'other'}" data-status="${status}">
      <div class="shop-card-head"><span>购物审批</span><span class="shop-card-status status-${status}">${shopApprovalStatusLabel(status)}</span></div>
      <div class="shop-card-body">
        <div class="shop-card-img">${img}</div>
        <div class="shop-card-main">
          <div class="shop-card-title">${wcEscHtml(d.title)}</div>
          <div class="shop-card-price">¥ ${wcEscHtml(d.price.toFixed(2))}</div>
        </div>
      </div>
      <div class="shop-card-reason">${wcEscHtml(d.reason)}</div>
      ${deadline}
    </div>`
}

async function applyShopApprovalFromReply(chatId, result) {
  try {
    const ap = result && result.approval
    if (!ap) return
    const decision = /approve|批准|同意/i.test(ap.decision) ? 'approved' : /reject|拒绝|不同意/i.test(ap.decision) ? 'rejected' : ''
    if (!decision) return
    const rows = await db.messages.where('chatId').equals(Number(chatId)).reverse().limit(80).toArray()
    const pending = rows.filter(r => r.role === 'user' && typeof r.content === 'string' &&
      r.content.startsWith(SHOP_APPROVAL_PREFIX) && (r.shopStatus || 'pending') === 'pending')
    if (!pending.length) return
    const t = String(ap.title || '').trim()
    let target = null
    if (t) {
      target = pending.find(r => {
        const d = parseShopApprovalPayload(r.content.slice(SHOP_APPROVAL_PREFIX.length))
        return d.title && (d.title.includes(t) || t.includes(d.title))
      })
    }
    if (!target) target = pending[0] // 倒序读取，第一条就是最新的待审批
    await db.messages.update(target.id, { shopStatus: decision })
  } catch (e) { console.warn('[wechat] 更新购物审批状态失败', e) }
}

function shopCompressImage(src, maxSize = 240) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      } catch (_) { resolve('') }
    }
    img.onerror = () => resolve('')
    img.src = src
  })
}

function showShopApprovalPage(chatPage) {
  if (chatPage?.dataset?.groupId) { window.toast?.('群聊里暂不支持购物审批'); return }
  if (document.getElementById('shop-approval-page')) return
  const now = new Date()
  const page = document.createElement('div')
  page.id = 'shop-approval-page'
  page.className = 'full-page shop-approval-page'
  page.innerHTML = `
    <div class="shop-form-head">
      <button class="shop-form-back" id="shop-back" type="button" aria-label="返回"><i class="fa-solid fa-angle-left"></i></button>
      <div class="shop-form-titles"><div class="shop-form-title">购物审批</div><div class="shop-form-sub">填写并发起</div></div>
    </div>
    <div class="shop-form-scroll">
      <div class="shop-form-card">
        <div class="shop-form-top"><span>购物审批</span><span>${now.getMonth() + 1}/${now.getDate()}</span></div>
        <div class="shop-form-grid">
          <div class="shop-form-cell shop-form-imgcell">
            <label>配图</label>
            <button class="shop-img-btn" id="shop-img-btn" type="button" aria-label="选择配图"><i class="fa-solid fa-cart-shopping"></i></button>
          </div>
          <div class="shop-form-right">
            <div class="shop-form-cell"><label>商品名称 <b>*</b></label><input id="shop-title" type="text" maxlength="60" autocomplete="off"></div>
            <div class="shop-form-cell"><label>价格 <b>*</b></label><input id="shop-price" type="text" inputmode="decimal" placeholder="0.00" autocomplete="off"></div>
          </div>
        </div>
        <div class="shop-form-cell"><label>商品链接</label><input id="shop-url" type="text" autocomplete="off"></div>
        <div class="shop-form-cell"><label>我为什么想买 <b>*</b></label><textarea id="shop-reason" rows="7" maxlength="500"></textarea></div>
        <div class="shop-form-cell"><label>截止时间</label><input id="shop-deadline" type="datetime-local"></div>
      </div>
    </div>
    <div class="shop-form-foot"><button class="shop-send-btn" id="shop-send" type="button">发起</button></div>`
  let imageData = ''
  page.querySelector('#shop-back').addEventListener('click', () => window.closePage('shop-approval-page'))
  page.querySelector('#shop-img-btn').addEventListener('click', () => {
    window.showImagePicker?.(async url => {
      if (!url) return
      const thumb = await shopCompressImage(url)
      if (!thumb) { window.toast?.('这张图片读取失败'); return }
      imageData = thumb
      const btn = page.querySelector('#shop-img-btn')
      btn.innerHTML = `<img src="${thumb}" alt="">`
    })
  })
  page.querySelector('#shop-send').addEventListener('click', async e => {
    const btn = e.currentTarget
    if (btn.disabled) return
    const title = page.querySelector('#shop-title').value.trim()
    const price = parseFloat(page.querySelector('#shop-price').value.replace(/[^\d.]/g, ''))
    const url = page.querySelector('#shop-url').value.trim()
    const reason = page.querySelector('#shop-reason').value.trim()
    const dl = page.querySelector('#shop-deadline').value
    const deadline = dl ? Date.parse(dl) : 0
    if (!title) { window.toast?.('请填写商品名称'); return }
    if (!(price > 0)) { window.toast?.('请填写价格'); return }
    if (!reason) { window.toast?.('请写一下为什么想买'); return }
    btn.disabled = true
    try {
      await sendUserMsg(chatPage, buildShopApprovalContent({ title, price, url, reason, deadline }), { shopStatus: 'pending', shopImage: imageData || '' })
      window.closePage('shop-approval-page')
      window.toast?.('已发起，点聊天里的魔法棒让对方回复')
    } catch (err) {
      console.warn('[wechat] 发起购物审批失败', err)
      window.toast?.('发起失败，请重试')
      btn.disabled = false
    }
  })
  window.openPage(page)
}

function showVirtualLinkSheet(chatPage) {
  const sheet = wcMakeSheet(`
    <div class="sheet-title">发送虚拟链接</div>
    <div style="padding:0 16px 8px;display:flex;flex-direction:column;gap:10px">
      <input class="input-field" id="virtual-link-url" type="text" autocomplete="off" placeholder="链接（支持虚构网址或 wanwan:// 地址）">
      <input class="input-field" id="virtual-link-site" type="text" autocomplete="off" placeholder="网站名">
      <textarea class="input-field" id="virtual-link-content" rows="4" placeholder="网站内容"></textarea>
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-send-virtual-link" type="button">发送</button>
    </div>
  `)

  wcShowSheet(sheet, async () => {
    const url = sheet.querySelector('#virtual-link-url').value.trim()
    const siteName = sheet.querySelector('#virtual-link-site').value.trim()
    const summary = sheet.querySelector('#virtual-link-content').value.trim()
    if (!url) { window.toast('请填写链接'); return false }
    if (!siteName) { window.toast('请填写网站名'); return false }
    if (!summary) { window.toast('请填写网站内容'); return false }

    await sendUserMsg(chatPage, buildLinkMessageContent({
      url,
      siteName,
      title: siteName,
      summary,
      parseStatus: 'success'
    }))
  })

  setTimeout(() => sheet.querySelector('#virtual-link-url')?.focus(), 80)
}

// 发送语音（模拟）
function showVoiceInputSheet(chatPage) {
  const sheet = wcMakeSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">发送语音消息</div>
    <div style="padding:0 16px 8px">
      <textarea class="input-field" id="voice-text-input" placeholder="输入语音内容" style="min-height:80px"></textarea>
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-send-voice">发送语音</button>
    </div>
  `)
  wcShowSheet(sheet, async () => {
    const text = sheet.querySelector('#voice-text-input').value.trim()
    if (!text) { window.toast('请输入语音内容'); return false }
    const me = _wechatUser
    await sendUserMsg(chatPage, `[${me?.nick || me?.name || '我'}的语音：${text}]`)
  })
}


// 发送照片
function showPhotoSimSheet(chatPage) {
  const sheet = wcMakeSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">拍摄照片</div>
    <div style="padding:0 16px 8px">
      <textarea class="input-field" id="photo-desc-input" rows="3" placeholder="描述照片内容（如：自拍、风景照…）"></textarea>
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-send-photo-sim">发送</button>
    </div>
  `)
  wcShowSheet(sheet, async () => {
    const desc = sheet.querySelector('#photo-desc-input').value.trim()
    if (!desc) { window.toast('请填写描述'); return false }
    const me = _wechatUser
    await sendUserMsg(chatPage, `[${me?.nick || me?.name || '我'}发来的照片：${desc}]`)
  })
}

// 发送真实照片
async function sendRealPhotoFromUrl(chatPage, imageUrl, imageDesc = '') {
  if (chatPage?.dataset?.groupId) {
    await db.groupMessages.add({
      groupId: parseInt(chatPage.dataset.groupId), senderId: _wechatUid, role: 'user',
      content: `__IMG__${imageUrl}`,
      imageDesc: normalizeImageSupplementDesc(imageDesc), createdAt: Date.now()
    })
    await refreshChat(chatPage, { scrollToBottom: true })
    return
  }
  const chatId = parseInt(chatPage.dataset.chatId)
  const charId = parseInt(chatPage.dataset.charId)
  if (window.isCallActiveWith?.(charId)) {
    window.toast?.('通话中，无法发送消息')
    return
  }
  await addPrivateMessageIdempotently({
    chatId, charId, role: 'user',
    content: `__IMG__${imageUrl}`,
    imageDesc: normalizeImageSupplementDesc(imageDesc),
    createdAt: Date.now()
  })
  clearPrivateReplyVersions(chatId)
  await refreshChat(chatPage, { scrollToBottom: true })
}

// 发送转账
function showTransferSheet(chatPage) {
  // 检查花呗状态
  let huabeiInfo = null
  const buildPaySourceHtml = (wechatBal) => {
    let html = `<div style="padding:0 16px 4px">
      <div style="font-size:12px;color:#909090;margin-bottom:6px">支付方式</div>
      <div id="transfer-pay-sources" style="display:flex;gap:8px">`
    html += `<button class="transfer-pay-src is-selected" data-source="wechat" style="flex:1;padding:8px 10px;border-radius:8px;border:1.5px solid #232323;background:#fafafa;font-size:12px;cursor:pointer;text-align:left">
      <div style="font-weight:500;color:#232323">零钱</div>
      <div style="color:#a0a0a0;margin-top:2px">¥${Number(wechatBal||0).toFixed(2)}</div>
    </button>`
    if (huabeiInfo) {
      html += `<button class="transfer-pay-src" data-source="huabei" style="flex:1;padding:8px 10px;border-radius:8px;border:1.5px solid #e0e0e0;background:#fff;font-size:12px;cursor:pointer;text-align:left">
        <div style="font-weight:500;color:#1976d2">花呗</div>
        <div style="color:#a0a0a0;margin-top:2px">可用 ¥${Number(huabeiInfo.available||0).toFixed(2)}</div>
      </button>`
    }
    html += `</div></div>`
    return html
  }

  // 先异步获取花呗信息，再渲染 sheet
  ;(async () => {
    if (window.getHuabeiInfo) {
      huabeiInfo = await window.getHuabeiInfo(_wechatUid)
    }
    const walletDataInit = await getWalletData()
    const wechatBal = walletDataInit ? walletDataInit.wechatBalance : 0

    const sheet = wcMakeSheet(`
      <div class="sheet-handle"></div>
      <div class="sheet-title">转账</div>
      <div style="padding:0 16px 8px;display:flex;flex-direction:column;gap:10px">
        <input class="input-field" id="transfer-amount" placeholder="转账金额（元）" type="number" min="0.01" step="0.01">
        <input class="input-field" id="transfer-note" placeholder="备注">
      </div>
      ${buildPaySourceHtml(wechatBal)}
      <div class="sheet-actions">
        <button class="btn-pill btn-full" id="btn-send-transfer">确认转账</button>
      </div>
    `)

    // 支付方式切换
    let selectedSource = 'wechat'
    sheet.querySelectorAll('.transfer-pay-src').forEach(btn => {
      btn.addEventListener('click', () => {
        sheet.querySelectorAll('.transfer-pay-src').forEach(b => {
          b.style.borderColor = '#e0e0e0'
          b.classList.remove('is-selected')
        })
        btn.style.borderColor = '#232323'
        btn.classList.add('is-selected')
        selectedSource = btn.dataset.source
      })
    })

    wcShowSheet(sheet, async () => {
      const amountStr = sheet.querySelector('#transfer-amount').value.trim()
      const noteInput = sheet.querySelector('#transfer-note').value.trim()
      if (!amountStr) { window.toast('请填写转账金额'); return false }
      const amount = parseFloat(amountStr)
      if (isNaN(amount) || amount <= 0) { window.toast('转账金额无效'); return false }

      const charId = parseInt(chatPage.dataset.charId)
      const char = await window.getCharacter(charId)
      const charName = char?.nick || char?.name || '对方'
      const noteForMsg = noteInput || '无备注'
      const desc = noteInput ? `转账给${charName}：${noteInput}` : `转账给${charName}`

      if (selectedSource === 'huabei') {
        // 花呗支付
        if (!window.huabeiSpend) { window.toast('花呗不可用'); return false }
        const result = await window.huabeiSpend(_wechatUid, amount, desc)
        if (!result.ok) { window.toast(result.msg); return false }
      } else {
        // 零钱支付
        const walletData = await getWalletData()
        if (!walletData || walletData.wechatBalance === undefined) {
          window.toast('请先在微信支付中生成账户余额'); return false
        }
        if (walletData.wechatBalance < amount) {
          window.toast('零钱余额不足，无法转账'); return false
        }
        walletData.wechatBalance = Math.round((walletData.wechatBalance - amount) * 100) / 100
        await saveWalletData(walletData)
        await db.finance.add({
          charId: _wechatUid,
          amount,
          desc,
          type: 'expense',
          source: 'wechat',
          createdAt: Date.now()
        })
      }

      const me = _wechatUser
      await sendUserMsg(chatPage, `[${me?.nick || me?.name || '我'}的转账：${amount}元；备注：${noteForMsg}]`, {
        transferSource: selectedSource,
        transferDesc: desc
      })
    })
  })()
}

// 渲染聊天页内联表情包面板（与"+"工具面板同形态）
// 仅展示当前会话已挂载分组下的表情包；点击表情图直接发送、面板保持打开
async function renderEmojiPanel(chatPage) {
  const panel = chatPage.querySelector('#chat-emoji-panel')
  if (!panel) return
  const isGroup = !!chatPage.dataset.groupId
  const chatId = parseInt(chatPage.dataset.chatId)
  const allCats = await getAllStickerCategories()
  // 群聊无挂载概念：展示全部表情分组；私聊只展示本会话挂载的分组
  const mountedIds = isGroup ? [] : await getMountedStickerCatIds(chatId)
  const cats = isGroup ? allCats : allCats.filter(c => mountedIds.includes(c.id))

  const tabsEl = panel.querySelector('#ep-tabs')
  const gridEl = panel.querySelector('#ep-grid')

  const renderEmpty = (msg) => {
    tabsEl.innerHTML = ''
    gridEl.innerHTML = `<div class="sp-empty">${msg}</div>`
  }

  const renderForCat = async (catId) => {
    const stickers = await getStickersInCategory(catId)
    if (!stickers.length) {
      gridEl.innerHTML = `<div class="sp-empty">该分组暂无表情包</div>`
      return
    }
    gridEl.innerHTML = stickers.map(s => `
      <button class="sp-tile" data-id="${s.id}" type="button" title="${wcEscHtml(s.name)}">
        <img src="${s.image}" alt="${wcEscHtml(s.name)}" loading="lazy">
      </button>
    `).join('')
    gridEl.querySelectorAll('.sp-tile').forEach(btn => {
      bindWanWanMobileAction(btn, async () => {
        if (btn.dataset.sending === '1') return
        const sticker = stickers.find(x => x.id === parseInt(btn.dataset.id))
        if (!sticker) return
        // 第一次点击只选中（下方出现红栏「确认发送」），再点一次才真正发送，避免滑动误触
        if (!btn.classList.contains('sp-armed')) {
          gridEl.querySelectorAll('.sp-tile.sp-armed').forEach(t => t.classList.remove('sp-armed'))
          btn.classList.add('sp-armed')
          return
        }
        btn.classList.remove('sp-armed')
        btn.dataset.sending = '1'
        btn.disabled = true
        try {
          await sendStickerMessage(chatPage, sticker)
        } catch (error) {
          reportWechatSendError(error, '表情包')
        } finally {
          delete btn.dataset.sending
          btn.disabled = false
        }
      })
    })
  }

  const renderTabsAndGrid = async () => {
    if (!cats.length) {
      renderEmpty(isGroup ? '还没有任何表情包分组，请先在表情包管理里添加' : '该聊天还未挂载任何表情包分组')
      return
    }
    let activeId = parseInt(panel.dataset.activeCat)
    if (!activeId || !cats.some(c => c.id === activeId)) activeId = cats[0].id
    panel.dataset.activeCat = activeId
    tabsEl.innerHTML = cats.map(c => `
      <button class="sp-tab ${c.id === activeId ? 'active' : ''}" data-id="${c.id}">
        ${wcEscHtml(c.name)}
      </button>
    `).join('')
    tabsEl.querySelectorAll('.sp-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.dataset.activeCat = btn.dataset.id
        renderTabsAndGrid()
      })
    })
    await renderForCat(activeId)
  }

  await renderTabsAndGrid()

  // 操作按钮事件：每次重渲染都要重新绑定（替换旧节点更稳妥）
  const mountBtn = panel.querySelector('#ep-mount')
  const newMountBtn = mountBtn.cloneNode(true)
  mountBtn.replaceWith(newMountBtn)

  if (isGroup) {
    // 群聊无会话级挂载设置，隐藏挂载管理入口
    newMountBtn.style.display = 'none'
  } else {
    newMountBtn.addEventListener('click', () => {
      panel.style.display = 'none'
      const charId = parseInt(chatPage.dataset.charId)
      openChatSettings(chatId, charId, chatPage)
    })
  }
}

// 实际发送一个表情包消息（带 stickerImage 字段，避免库变更后丢失）
async function sendStickerMessage(chatPage, sticker) {
  if (chatPage?.dataset?.groupId) {
    const me = _wechatUser
    await db.groupMessages.add({
      groupId: parseInt(chatPage.dataset.groupId), senderId: _wechatUid, role: 'user',
      content: `[${me?.nick || me?.name || '我'}的表情包：${sticker.name}]`,
      stickerImage: sticker.image, stickerId: sticker.id, createdAt: Date.now()
    })
    await refreshChat(chatPage, { scrollToBottom: true })
    return
  }
  const chatId = parseInt(chatPage.dataset.chatId)
  const charId = parseInt(chatPage.dataset.charId)
  if (window.isCallActiveWith?.(charId)) {
    window.toast?.('通话中，无法发送消息')
    return
  }
  const me = _wechatUser
  await sendUserMsg(chatPage, `[${me?.nick || me?.name || '我'}的表情包：${sticker.name}]`, {
    stickerImage: sticker.image,
    stickerId: sticker.id
  })
}


// 发送位置
function showLocationSheet(chatPage) {
  const sheet = wcMakeSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">发送位置</div>
    <div style="padding:0 16px 8px;display:flex;flex-direction:column;gap:10px">
      <input class="input-field" id="loc-name" placeholder="地点名称（如：三里屯）">
      <input class="input-field" id="loc-address" placeholder="详细地址">
      <div style="display:flex;gap:8px">
        <input class="input-field" id="loc-dist" placeholder="距离数字" type="number" style="flex:1">
        <select class="input-field" id="loc-unit" style="width:80px">
          <option value="米">米</option>
          <option value="公里" selected>公里</option>
        </select>
      </div>
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-send-loc">发送位置</button>
    </div>
  `)
  wcShowSheet(sheet, async () => {
    const name = sheet.querySelector('#loc-name').value.trim()
    const addr = sheet.querySelector('#loc-address').value.trim()
    const dist = sheet.querySelector('#loc-dist').value.trim()
    const unit = sheet.querySelector('#loc-unit').value
    if (!name) { window.toast('请填写地点名称'); return false }
    const me = _wechatUser
    const distPart = dist ? `；距你约${dist}${unit}` : ''
    await sendUserMsg(chatPage, `[${me?.nick || me?.name || '我'}的位置：${name}${addr || ''}${distPart}]`)
  })
}


// ===== 转账卡片交互 =====
window.respondTransfer = async function(msgId, accept) {
  const msg = await db.messages.get(msgId)
  if (!msg) return false

  if (accept) {
    const parsed = parseMsgType(msg.content, '')
    const amount = parseFloat(parsed.data?.amount || 0)
    const walletData = await getWalletData()
    if (!walletData || walletData.wechatBalance === undefined) {
      window.toast('请先在微信支付中生成账户余额')
      return false
    }
    const senderChar = await window.getCharacter(msg.charId)
    const senderName = senderChar?.nick || senderChar?.name || '对方'
    const noteStr = (parsed.data?.note || '').trim()
    const noteDisplay = noteStr && noteStr !== '无备注' ? `：${noteStr}` : ''
    walletData.wechatBalance = Math.round((walletData.wechatBalance + amount) * 100) / 100
    await saveWalletData(walletData)
    await db.finance.add({
      charId: _wechatUid,
      amount,
      desc: `收到${senderName}的转账${noteDisplay}`,
      type: 'income',
      source: 'wechat',
      createdAt: Date.now()
    })
  }

  await updatePrivateMessageIdempotently(msgId, { cardStatus: accept ? 'accepted' : 'declined' })

  const me = _wechatUser
  const myName = me?.nick || me?.name || '我'
  const char = await window.getCharacter(msg.charId)
  const charName = char?.nick || char?.name || '对方'
  const tipContent = accept
    ? `[${myName}接收${charName}的转账]`
    : `[${myName}退回${charName}的转账]`
  await addPrivateMessageIdempotently({
    chatId: msg.chatId, charId: msg.charId, role: 'user',
    content: tipContent, createdAt: Date.now()
  })
  clearPrivateReplyVersions(msg.chatId)

  const cw = _getVisibleChatWindow('chat', msg.chatId)
  if (cw) await refreshChat(cw, { force: true, scrollToBottom: true })
  return true
}


// 记录转账到finance
async function recordTransferFinance(msg) {
  if (!msg) return
  const parsed = parseMsgType(msg.content, '')
  if (parsed.type !== 'transfer-recv') return
  await db.finance.add({
    charId: msg.charId,
    amount: parseFloat(parsed.data.amount),
    desc: `来自转账：${parsed.data.note}`,
    createdAt: Date.now()
  })
}

// 更新我发出的转账卡片状态
async function updateSentTransferStatus(chatId, accepted) {
  const msgs = await db.messages.where('chatId').equals(chatId).filter(m =>
    m.role === 'user' && m.content?.includes('的转账：') && !m.cardStatus
  ).toArray()
  if (!msgs.length) return
  const last = msgs[msgs.length - 1]
  await updatePrivateMessageIdempotently(last.id, { cardStatus: accepted ? 'accepted' : 'declined' })

  if (!accepted) {
    const parsed = parseMsgType(last.content, '')
    const amount = parseFloat(parsed.data?.amount || 0)
    if (amount > 0) {
      if (last.transferSource === 'huabei') {
        if (window.huabeiRefund) {
          await window.huabeiRefund(_wechatUid, amount, last.transferDesc || '转账被退回')
        }
      } else {
        const walletData = await getWalletData()
        if (walletData && walletData.wechatBalance !== undefined) {
          walletData.wechatBalance = Math.round((walletData.wechatBalance + amount) * 100) / 100
          await saveWalletData(walletData)
          await db.finance.add({
            charId: _wechatUid,
            amount,
            desc: '转账被退回',
            type: 'income',
            source: 'wechat',
            createdAt: Date.now()
          })
        }
      }
    }
  }

  const cw = _getVisibleChatWindow('chat', chatId)
  if (cw) await refreshChat(cw, { force: true })
}

// ===== 淘宝代付/赠送 卡片交互 =====
// 我作为接收方，回应「角色发来」的淘宝代付/赠送卡片
window.respondTbDeal = async function(msgId, action) {
  const msg = await db.messages.get(msgId)
  if (!msg) return false
  const parsed = parseMsgType(msg.content, '')
  if (parsed.type !== 'tb-deal') return false
  const deal = normalizeTbDealPayload(parsed.data)
  const char = await window.getCharacter(msg.charId)
  const charName = char?.nick || char?.name || '对方'
  const me = _wechatUser
  const myName = me?.nick || me?.name || '我'

  let status = ''
  let tip = ''

  if (action === 'pay') {
    // 帮角色的代付付款：从我的微信零钱扣款
    const amount = tbDealMoney(deal.total)
    const walletData = await getWalletData()
    if (!walletData || walletData.wechatBalance === undefined) {
      window.toast('请先在微信支付中生成账户余额'); return false
    }
    if (walletData.wechatBalance < amount) { window.toast('零钱余额不足'); return false }
    walletData.wechatBalance = Math.round((walletData.wechatBalance - amount) * 100) / 100
    await saveWalletData(walletData)
    await db.finance.add({
      charId: _wechatUid, amount, desc: `淘宝代付：${deal.title}`,
      type: 'expense', source: 'wechat', createdAt: Date.now()
    })
    status = 'paid'
    tip = `[${myName}帮${charName}付了淘宝代付]`
  } else if (action === 'reject') {
    status = 'rejected'
    tip = `[${myName}拒绝了${charName}的淘宝代付]`
  } else if (action === 'accept') {
    status = 'accepted'
    tip = `[${myName}接收了${charName}的淘宝礼物]`
  } else if (action === 'return') {
    status = 'returned'
    tip = `[${myName}退回了${charName}的淘宝礼物]`
  } else {
    return false
  }

  await updatePrivateMessageIdempotently(msgId, { cardStatus: status })
  await addPrivateMessageIdempotently({
    chatId: msg.chatId, charId: msg.charId, role: 'user',
    content: tip, createdAt: Date.now()
  })
  clearPrivateReplyVersions(msg.chatId)
  const cw = _getVisibleChatWindow('chat', msg.chatId)
  if (cw) await refreshChat(cw, { force: true, scrollToBottom: true })
  return true
}

// 角色回应了「我发出」的淘宝代付/赠送卡片，联动更新原卡状态
async function updateSentTbDealStatus(chatId, dealType, result) {
  const statusMap = { paid: 'paid', rejected: 'rejected', accepted: 'accepted', returned: 'returned' }
  const status = statusMap[result]
  if (!status) return
  const msgs = await db.messages.where('chatId').equals(chatId).filter(m =>
    m.role === 'user' && typeof m.content === 'string' && m.content.startsWith('__TBDEAL__') && !m.cardStatus
  ).toArray()
  if (!msgs.length) return
  // 找到与该回应类型匹配的最后一张待处理卡
  let target = null
  for (let i = msgs.length - 1; i >= 0; i--) {
    const deal = normalizeTbDealPayload(parseTbDealPayload(msgs[i].content.slice(10)))
    if ((dealType === 'gift') === (deal.dealType === 'gift')) { target = msgs[i]; break }
  }
  if (!target) return
  const targetDeal = normalizeTbDealPayload(parseTbDealPayload(target.content.slice(10)))
  await updatePrivateMessageIdempotently(target.id, { cardStatus: status })

  // 我发的赠送（发送时已预付）被角色退回 → 退款到我的零钱
  if (dealType === 'gift' && result === 'returned') {
    const amount = tbDealMoney(targetDeal.total)
    if (amount > 0) {
      const walletData = await getWalletData()
      if (walletData && walletData.wechatBalance !== undefined) {
        walletData.wechatBalance = Math.round((walletData.wechatBalance + amount) * 100) / 100
        await saveWalletData(walletData)
        await db.finance.add({
          charId: _wechatUid, amount, desc: `淘宝礼物被退回：${targetDeal.title}`,
          type: 'income', source: 'wechat', createdAt: Date.now()
        })
      }
    }
  }

  const cw = _getVisibleChatWindow('chat', chatId)
  if (cw) await refreshChat(cw, { force: true })
}

// ===== YumYum 外卖代付/赠送 卡片交互 =====
// 我作为接收方，回应「角色发来」的外卖代付/赠送卡片
window.respondYumDeal = async function(msgId, action) {
  const msg = await db.messages.get(msgId)
  if (!msg) return false
  const parsed = parseMsgType(msg.content, '')
  if (parsed.type !== 'yum-deal') return false
  const deal = normalizeYumDealPayload(parsed.data)
  const char = await window.getCharacter(msg.charId)
  const charName = char?.nick || char?.name || '对方'
  const me = _wechatUser
  const myName = me?.nick || me?.name || '我'

  let status = ''
  let tip = ''
  let mergedContent = null

  if (action === 'pay') {
    // 帮角色的外卖代付付款：从我的微信零钱扣款，并落地订单生成时间线
    const amount = yumDealMoney(deal.total)
    const walletData = await getWalletData()
    if (!walletData || walletData.wechatBalance === undefined) {
      window.toast('请先在微信支付中生成账户余额'); return false
    }
    if (walletData.wechatBalance < amount) { window.toast('零钱余额不足'); return false }
    walletData.wechatBalance = Math.round((walletData.wechatBalance - amount) * 100) / 100
    await saveWalletData(walletData)
    await db.finance.add({
      charId: _wechatUid, amount, desc: `外卖代付：${deal.shopName || deal.title}`,
      type: 'expense', source: 'wechat', createdAt: Date.now()
    })
    if (typeof window.yumyumFinalizeProxyOrder === 'function' && !yumDealHasTimeline(deal)) {
      const fin = await window.yumyumFinalizeProxyOrder(deal)
      if (fin) {
        const merged = Object.assign({}, deal, fin)
        mergedContent = window.buildYumDealMessageContent(merged)
      }
    }
    status = 'paid'
    tip = `[${myName}帮${charName}付了外卖代付]`
  } else if (action === 'reject') {
    status = 'rejected'
    tip = `[${myName}拒绝了${charName}的外卖代付]`
  } else if (action === 'accept') {
    status = 'accepted'
    tip = `[${myName}收下了${charName}的外卖]`
  } else if (action === 'return') {
    status = 'returned'
    tip = `[${myName}退回了${charName}的外卖]`
  } else {
    return false
  }

  const patch = { cardStatus: status }
  if (mergedContent) patch.content = mergedContent
  await updatePrivateMessageIdempotently(msgId, patch)
  await addPrivateMessageIdempotently({
    chatId: msg.chatId, charId: msg.charId, role: 'user',
    content: tip, createdAt: Date.now()
  })
  clearPrivateReplyVersions(msg.chatId)
  const cw = _getVisibleChatWindow('chat', msg.chatId)
  if (cw) await refreshChat(cw, { force: true, scrollToBottom: true })
  return true
}

// 角色回应了「我发出」的外卖代付/赠送卡片，联动更新原卡状态
async function updateSentYumDealStatus(chatId, dealType, result) {
  const statusMap = { paid: 'paid', rejected: 'rejected', accepted: 'accepted', returned: 'returned' }
  const status = statusMap[result]
  if (!status) return
  const msgs = await db.messages.where('chatId').equals(chatId).filter(m =>
    m.role === 'user' && typeof m.content === 'string' && m.content.startsWith('__YUMDEAL__') && !m.cardStatus
  ).toArray()
  if (!msgs.length) return
  // 找到与该回应类型匹配的最后一张待处理卡
  let target = null
  for (let i = msgs.length - 1; i >= 0; i--) {
    const deal = parseYumDealPayload(msgs[i].content.slice(11))
    if ((dealType === 'gift') === (deal.dealType === 'gift')) { target = msgs[i]; break }
  }
  if (!target) return
  const targetDeal = parseYumDealPayload(target.content.slice(11))
  const patch = { cardStatus: status }

  // 代付被角色付款 → 落地真实订单、生成订单号/送达时间，并回写卡片内容
  if (dealType === 'pay' && result === 'paid' && !yumDealHasTimeline(targetDeal)) {
    if (typeof window.yumyumFinalizeProxyOrder === 'function') {
      const fin = await window.yumyumFinalizeProxyOrder(targetDeal)
      if (fin) {
        const merged = Object.assign({}, targetDeal, fin)
        patch.content = window.buildYumDealMessageContent(merged)
      }
    }
  }

  await updatePrivateMessageIdempotently(target.id, patch)

  // 我发的赠送（发送时已预付）被角色退回 → 退款到我的零钱
  if (dealType === 'gift' && result === 'returned') {
    const amount = yumDealMoney(targetDeal.total)
    if (amount > 0) {
      const walletData = await getWalletData()
      if (walletData && walletData.wechatBalance !== undefined) {
        walletData.wechatBalance = Math.round((walletData.wechatBalance + amount) * 100) / 100
        await saveWalletData(walletData)
        await db.finance.add({
          charId: _wechatUid, amount, desc: `外卖礼物被退回：${targetDeal.shopName || targetDeal.title}`,
          type: 'income', source: 'wechat', createdAt: Date.now()
        })
      }
    }
  }

  const cw = _getVisibleChatWindow('chat', chatId)
  if (cw) await refreshChat(cw, { force: true })
}

// 撤回消息查看
window.showRecalledContent = function(content) {
  const overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '400'
  const box = document.createElement('div')
  box.className = 'recalled-popup'
  box.innerHTML = `
    <div class="recalled-label">已撤回的消息</div>
    <div class="recalled-content">${wcEscHtml(content)}</div>
    <button class="btn-pill btn-full" style="margin-top:12px" id="recalled-close">关闭</button>
  `
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(box)
  requestAnimationFrame(() => overlay.classList.add('show'))
  const close = () => { overlay.remove(); box.remove() }
  overlay.addEventListener('click', close)
  box.querySelector('#recalled-close').addEventListener('click', close)
}

// 展开/收起语音文字
window.toggleVoice = function(bubbleEl) {
  const voice = bubbleEl.closest('.voice-message')
  if (!voice) return
  const textEl = voice.querySelector('.voice-transcript-bubble')
  const isOpen = voice.classList.toggle('is-open')
  if (textEl) textEl.style.display = isOpen ? 'block' : 'none'
}


// ===== 消息操作菜单 =====
async function showMsgMenu(anchorEl, msgId, context) {
  const existing = document.getElementById('msg-menu')
  if (existing) existing.remove()
  const scope = context?.scope || 'chat'
  const msg = scope === 'group'
    ? await db.groupMessages.get(msgId)
    : await db.messages.get(msgId)
  if (!msg) return
  const menu = document.createElement('div')
  menu.id = 'msg-menu'
  menu.className = 'msg-context-menu msg-action-menu'
  const canRecall = canRecallMsg(msg, context)
  const canOpenThoughts = canShowThoughtAction(msg, context)
  menu.innerHTML = `
    <button data-action="copy"><i class="fa fa-copy"></i><span>复制</span></button>
    ${canRecall ? '<button data-action="recall"><i class="fa fa-undo"></i><span>撤回</span></button>' : ''}
    <button data-action="quote"><i class="fa fa-reply"></i><span>引用</span></button>
    <button data-action="favorite"><i class="fa-solid fa-cube"></i><span>收藏</span></button>
    <button data-action="edit"><i class="fa fa-pencil"></i><span>编辑</span></button>
    ${canOpenThoughts ? '<button data-action="thought"><i class="fa-solid fa-heart"></i><span>心声</span></button>' : ''}
    <span class="msg-menu-line-break" aria-hidden="true"></span>
    <button data-action="delete" class="msg-menu-break"><i class="fa fa-trash"></i><span>删除</span></button>
    <button data-action="multi"><i class="fa fa-check-square"></i><span>多选</span></button>
  `
  document.getElementById('app').appendChild(menu)
  positionMsgMenu(menu, anchorEl)
  bindMsgMenuActions(menu, msgId, msg, context || { scope: 'chat' })
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 100)
}

// 定位菜单：始终贴在对应消息的上缘（放不下才放下缘）
// iPhone 弹出输入法时，整页(layout viewport)和看得见的区域(visual viewport)会错开，
// 菜单所在容器也可能被位移。这里不再假设“fixed 的 0,0 就是屏幕左上角”，
// 而是先量出菜单自己的原点、再量出真实可见区域，都和消息气泡用同一套坐标系来算。
function positionMsgMenu(menu, bubbleEl) {
  const rect = bubbleEl.getBoundingClientRect()
  const gap = 8
  const edge = 8
  menu.style.top = '0px'
  menu.style.left = '0px'
  const origin = menu.getBoundingClientRect()
  const menuWidth = menu.offsetWidth || origin.width
  const menuHeight = menu.offsetHeight || origin.height
  // 真实可见区域（和 getBoundingClientRect 同一坐标系）
  const vv = window.visualViewport
  let visTop = 0
  let visLeft = 0
  let visWidth = window.innerWidth
  let visHeight = window.innerHeight
  try {
    const probe = document.createElement('div')
    probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none'
    document.documentElement.appendChild(probe)
    const pr = probe.getBoundingClientRect()
    probe.remove()
    visTop = pr.top + (vv ? vv.offsetTop : 0)
    visLeft = pr.left + (vv ? vv.offsetLeft : 0)
    if (vv) { visWidth = vv.width; visHeight = vv.height }
  } catch (_) {}
  const minLeft = visLeft + edge
  const maxLeft = Math.max(minLeft, visLeft + visWidth - menuWidth - edge)
  const left = Math.min(Math.max(rect.left, minLeft), maxLeft)
  const minTop = visTop + edge
  const maxTop = Math.max(minTop, visTop + visHeight - menuHeight - edge)
  const topAbove = rect.top - menuHeight - gap
  const topBelow = rect.bottom + gap
  let top = topAbove >= minTop ? topAbove : topBelow
  top = Math.min(Math.max(top, minTop), maxTop)
  menu.style.top = (top - origin.top) + 'px'
  menu.style.left = (left - origin.left) + 'px'
}

// 绑定菜单按钮
function bindMsgMenuActions(menu, msgId, msg, context) {
  menu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', async () => {
      menu.remove()
      const action = btn.dataset.action
      if (action === 'quote') await quoteMsg(msg, context)
      if (action === 'copy') copyMsgContent(msg)
      if (action === 'favorite') await favoriteMsg(msg, context)
      if (action === 'recall') await recallMsg(msgId, msg, context)
      if (action === 'edit') await showEditMsgModal(msgId, msg, context)
      if (action === 'thought') await openMsgThoughts(msg, context)
      if (action === 'delete') await deleteMsg(msgId, msg, context)
      if (action === 'multi') enterMsgMultiSelectMode(msgId, msg, context)
    })
  })
}

function canRecallMsg(msg, context = {}) {
  if (context.scope === 'group') return msg?.senderId === _wechatUid
  return msg?.role === 'user'
}

function canShowThoughtAction(msg, context = {}) {
  return context.scope !== 'group' && msg?.role !== 'user'
}

async function openMsgThoughts(msg, context = {}) {
  if (!canShowThoughtAction(msg, context)) return
  const charId = context.charId || msg.charId
  const chatId = context.chatId
  if (!charId || !chatId) return
  await showCharThoughtsHistory(charId, chatId)
}

async function getMsgActorName(msg, context = {}) {
  if (context.scope === 'group') {
    if (msg.senderId === _wechatUid) return _wechatUser?.nick || _wechatUser?.name || '我'
    return getWechatDisplayName(context.charMap?.[msg.senderId]) || '未知'
  }
  if (msg.role === 'user') return _wechatUser?.nick || _wechatUser?.name || '我'
  const char = await getWechatDisplayCharacter(context.charId || msg.charId)
  return getWechatDisplayName(char)
}

async function recallMsg(msgId, msg, context = {}) {
  if (!canRecallMsg(msg, context)) return
  const actor = await getMsgActorName(msg, context)
  const recalled = getMsgActionText(msg, actor) || msg.content || ''
  await updateMsgRecord(msgId, msg, context, {
    content: `[${actor}撤回了一条消息：${sanitizeSpecialMsgText(recalled)}]`
  })
  window.toast && window.toast('已撤回')
}

function sanitizeSpecialMsgText(text) {
  return String(text || '').replace(/\]/g, '］').trim()
}

function getEditMsgInitialType(msg, actorName) {
  const parsed = parseMsgType(msg.content, actorName)
  if (parsed.type === 'transfer-recv') return 'transfer'
  if (parsed.type === 'real-photo') return 'real-photo'
  if (parsed.type === 'recall') return 'text'
  return parsed.type || 'text'
}

function getEditMsgFieldValues(msg, type, actorName) {
  const parsed = parseMsgType(msg.content, actorName)
  const data = parsed.data || {}
  if (type === 'text') return { text: parsed.type === 'text' ? data.text : getMsgActionText(msg, actorName) }
  if (type === 'voice') return { text: data.text || '' }
  if (type === 'photo') return { desc: data.desc || '' }
  if (type === 'real-photo') return { src: data.src || '', desc: normalizeImageSupplementDesc(msg.imageDesc) }
  if (type === 'transfer') return { amount: data.amount || '', note: data.note || '' }
  if (type === 'location') return { place: data.place || '', dist: data.dist || '' }
  if (type === 'link') return {
    siteName: data.siteName || '',
    title: data.title || '',
    url: data.url || ''
  }
  if (type === 'sticker') return { name: data.name || '', image: msg.stickerImage || '' }
  if (type === 'quote') return { speaker: data.speaker || '', quoted: data.quoted || '', reply: data.reply || '' }
  return {}
}

function buildEditMsgFieldsHTML(type, values = {}) {
  switch (type) {
    case 'voice':
      return `<textarea class="input-field" data-field="text" rows="4" placeholder="语音文字">${wcEscHtml(values.text || '')}</textarea>`
    case 'photo':
      return `<textarea class="input-field" data-field="desc" rows="4" placeholder="照片描述">${wcEscHtml(values.desc || '')}</textarea>`
    case 'real-photo':
      return `
        <input class="input-field" data-field="src" placeholder="图片 URL / base64" value="${wcEscHtml(values.src || '')}">
        <textarea class="input-field" data-field="desc" rows="3" placeholder="图片重点补充（选填）">${wcEscHtml(values.desc || '')}</textarea>
        <button class="btn-ghost btn-full edit-msg-pick-image" type="button"><i class="fa fa-image"></i> 从相册选择</button>`
    case 'transfer':
      return `
        <input class="input-field" data-field="amount" type="number" min="0.01" step="0.01" placeholder="金额（元）" value="${wcEscHtml(values.amount || '')}">
        <input class="input-field" data-field="note" placeholder="备注" value="${wcEscHtml(values.note || '')}">`
    case 'location':
      return `
        <input class="input-field" data-field="place" placeholder="地点名称 / 地址" value="${wcEscHtml(values.place || '')}">
        <input class="input-field" data-field="dist" placeholder="距离（如 2.4公里，可选）" value="${wcEscHtml(values.dist || '')}">`
    case 'link':
      return `
        <input class="input-field" data-field="siteName" placeholder="网站名称" value="${wcEscHtml(values.siteName || '')}">
        <input class="input-field" data-field="title" placeholder="标题" value="${wcEscHtml(values.title || '')}">
        <input class="input-field" data-field="url" placeholder="链接" value="${wcEscHtml(values.url || '')}">`
    case 'sticker':
      return `
        <input class="input-field" data-field="name" placeholder="表情包名称" value="${wcEscHtml(values.name || '')}">
        <input class="input-field" data-field="image" placeholder="表情包图片 URL（选填）" value="${wcEscHtml(values.image || '')}">`
    case 'quote':
      return `
        <input class="input-field" data-field="speaker" placeholder="被引用人" value="${wcEscHtml(values.speaker || '')}">
        <textarea class="input-field" data-field="quoted" rows="3" placeholder="引用内容">${wcEscHtml(values.quoted || '')}</textarea>
        <textarea class="input-field" data-field="reply" rows="3" placeholder="回复内容">${wcEscHtml(values.reply || '')}</textarea>`
    default:
      return `<textarea class="input-field" data-field="text" rows="5" placeholder="消息内容">${wcEscHtml(values.text || '')}</textarea>`
  }
}

function readEditMsgFields(sheet) {
  const values = {}
  sheet.querySelectorAll('[data-field]').forEach(el => { values[el.dataset.field] = el.value.trim() })
  return values
}

function buildEditedMsgUpdate(type, values, actor) {
  const cleanActor = actor || '我'
  const update = { content: '' }
  if (type !== 'real-photo') update.imageDesc = ''
  if (type !== 'sticker') {
    update.stickerImage = ''
    update.stickerId = ''
  }
  if (type !== 'transfer') update.cardStatus = ''
  switch (type) {
    case 'voice':
      if (!values.text) return null
      update.content = `[${cleanActor}的语音：${sanitizeSpecialMsgText(values.text)}]`
      return update
    case 'photo':
      if (!values.desc) return null
      update.content = `[${cleanActor}发来的照片：${sanitizeSpecialMsgText(values.desc)}]`
      return update
    case 'real-photo':
      if (!values.src) return null
      update.content = `__IMG__${values.src}`
      update.imageDesc = normalizeImageSupplementDesc(values.desc)
      return update
    case 'transfer':
      if (!values.amount) return null
      update.content = `[${cleanActor}的转账：${values.amount}元；备注：${sanitizeSpecialMsgText(values.note || '无备注')}]`
      update.cardStatus = ''
      return update
    case 'location':
      if (!values.place) return null
      update.content = `[${cleanActor}的位置：${sanitizeSpecialMsgText(values.place)}${values.dist ? `；距你约${sanitizeSpecialMsgText(values.dist)}` : ''}]`
      return update
    case 'link':
      if (!isValidHttpUrl(values.url)) return null
      update.content = buildLinkMessageContent({
        siteName: values.siteName || getLinkSiteName(values.url),
        title: values.title || values.siteName || getLinkSiteName(values.url),
        url: values.url
      })
      return update
    case 'sticker':
      if (!values.name) return null
      update.content = `[${cleanActor}的表情包：${sanitizeSpecialMsgText(values.name)}]`
      update.stickerImage = values.image || ''
      return update
    case 'quote':
      if (!values.quoted || !values.reply) return null
      update.content = `[${cleanActor}引用"${sanitizeSpecialMsgText(values.speaker || '我')}：${sanitizeSpecialMsgText(values.quoted)}"并回复：${sanitizeSpecialMsgText(values.reply)}]`
      return update
    default:
      if (!values.text) return null
      update.content = values.text
      return update
  }
}

async function showEditMsgModal(msgId, msg, context = {}) {
  const actor = await getMsgActorName(msg, context)
  let currentType = getEditMsgInitialType(msg, actor)
  const typeOptions = [
    ['text', '文字', 'fa-font'],
    ['voice', '语音', 'fa-microphone'],
    ['photo', '拍照', 'fa-camera'],
    ['real-photo', '图片', 'fa-image'],
    ['transfer', '转账', 'fa-credit-card'],
    ['location', '位置', 'fa-solid fa-location-dot'],
    ['link', '链接', 'fa-link'],
    ['sticker', '表情', 'fa-solid fa-icons'],
    ['quote', '引用', 'fa-reply']
  ]
  const sheet = wcMakeSheet(`
    <div class="sheet-title">编辑消息</div>
    <div class="edit-msg-body">
      <div class="edit-msg-types">
        ${typeOptions.map(([type, label, icon]) => `
          <button class="edit-msg-type${type === currentType ? ' active' : ''}" data-type="${type}" type="button">
            <i class="fa ${icon}"></i><span>${label}</span>
          </button>
        `).join('')}
      </div>
      <div class="edit-msg-fields"></div>
    </div>
    <div class="sheet-actions">
      <button class="btn-ghost btn-full" id="edit-msg-cancel" type="button">取消</button>
      <button class="btn-pill btn-full" id="edit-msg-save" type="button">保存</button>
    </div>
  `)
  const overlay = wcAttachSheet(sheet)
  const close = () => closeWcSheetCore(overlay, sheet)
  const fields = sheet.querySelector('.edit-msg-fields')
  const renderFields = () => {
    fields.innerHTML = buildEditMsgFieldsHTML(currentType, getEditMsgFieldValues(msg, currentType, actor))
    fields.querySelector('.edit-msg-pick-image')?.addEventListener('click', () => {
      window.showImagePicker?.((imageUrl) => {
        if (!imageUrl) return
        const input = fields.querySelector('[data-field="src"]')
        if (input) input.value = imageUrl
      })
    })
  }
  renderFields()
  overlay.addEventListener('click', close)
  sheet.querySelector('#edit-msg-cancel').addEventListener('click', close)
  sheet.querySelectorAll('.edit-msg-type').forEach(btn => {
    btn.addEventListener('click', () => {
      currentType = btn.dataset.type
      sheet.querySelectorAll('.edit-msg-type').forEach(item => item.classList.toggle('active', item === btn))
      renderFields()
    })
  })
  sheet.querySelector('#edit-msg-save').addEventListener('click', async () => {
    const update = buildEditedMsgUpdate(currentType, readEditMsgFields(sheet), actor)
    if (!update) { window.toast && window.toast('请填写必要内容'); return }
    await updateMsgRecord(msgId, msg, context, update)
    window.toast && window.toast('已保存')
    close()
  })
  setTimeout(() => fields.querySelector('.input-field')?.focus(), 80)
}

async function updateMsgRecord(msgId, msg, context = {}, update = {}) {
  const scope = context.scope === 'group' ? 'group' : 'chat'
  if (scope === 'group' && !await getWechatAccessibleGroup(msg.groupId)) return
  const table = scope === 'group' ? db.groupMessages : db.messages
  const existing = await table.get(msgId)
  if (!existing) return
  const next = { ...existing, ...update }
  ;['imageDesc', 'stickerImage', 'stickerId', 'cardStatus'].forEach(key => {
    if (next[key] === '') delete next[key]
  })
  await table.put(next)
  const chatPage = document.getElementById('chat-window')
  if (!chatPage) return
  if (scope === 'group') {
    const group = context.group || (msg.groupId ? await getWechatAccessibleGroup(msg.groupId) : null)
    if (!group) return
    await loadGroupMessages(chatPage, msg.groupId, group, { force: true })
    return
  }
  const container = chatPage.querySelector('#chat-messages')
  if (!rerenderSingleMsgRow(container, next)) {
    await loadChatMessages(chatPage, msg.chatId, { force: true })
  }
}

async function favoriteMsg(msg, context = {}) {
  if (!_wechatUid) {
    window.toast && window.toast('请先登录')
    return
  }
  const item = await buildWechatFavoriteItem(msg, context)
  if (!item) {
    window.toast && window.toast('收藏失败')
    return
  }
  const items = await getWechatFavorites()
  if (items.some(it => it.id === item.id)) {
    window.toast && window.toast('已收藏')
    return
  }
  await saveWechatFavorites([item, ...items])
  window.toast && window.toast('已收藏')
}

async function buildWechatFavoriteItem(msg, context = {}) {
  if (!msg?.id) return null
  const scope = context.scope === 'group' ? 'group' : 'chat'
  const content = msg.content || ''
  const sourceId = scope === 'group' ? msg.groupId : msg.chatId
  const charName = await getWechatFavoriteParseName(msg, context, scope)
  const parsed = parseMsgType(content, charName)
  return {
    id: `${scope}:${sourceId || 0}:${msg.id}`,
    category: 'chat',
    scope,
    sourceId: sourceId || null,
    messageId: msg.id,
    senderName: await getWechatFavoriteSenderName(msg, context, scope),
    sourceTitle: await getWechatFavoriteSourceTitle(msg, context, scope),
    content,
    parsedType: parsed.type,
    parsedData: parsed.data || {},
    previewImage: await getWechatFavoritePreviewImage(msg, parsed),
    stickerImage: msg.stickerImage || '',
    cardStatus: msg.cardStatus || '',
    createdAt: msg.createdAt || Date.now(),
    favoritedAt: Date.now()
  }
}

async function getWechatFavoriteParseName(msg, context, scope) {
  if (scope === 'group') {
    const char = msg.senderId === _wechatUid ? _wechatUser : context.charMap?.[msg.senderId]
    return msg.senderId === _wechatUid ? (_wechatUser?.nick || _wechatUser?.name || '我') : getWechatDisplayName(char)
  }
  const char = await getWechatDisplayCharacter(context.charId || msg.charId)
  return getWechatDisplayName(char)
}

async function getWechatFavoriteSenderName(msg, context, scope) {
  if (scope === 'group') {
    if (msg.senderId === _wechatUid) return _wechatUser?.nick || _wechatUser?.name || '我'
    return getWechatDisplayName(context.charMap?.[msg.senderId]) || '未知'
  }
  if (msg.role === 'user') return _wechatUser?.nick || _wechatUser?.name || '我'
  const char = await getWechatDisplayCharacter(context.charId || msg.charId)
  return getWechatDisplayName(char)
}

async function getWechatFavoriteSourceTitle(msg, context, scope) {
  if (scope === 'group') {
    const group = context.group || (msg.groupId ? await getWechatAccessibleGroup(msg.groupId) : null)
    if (!group) return
    return group?.name || '群聊'
  }
  const char = await getWechatDisplayCharacter(context.charId || msg.charId)
  return getWechatDisplayName(char)
}

async function getWechatFavoritePreviewImage(msg, parsed) {
  if (parsed.type === 'real-photo') return await resolveWechatImageForPersistence(parsed.data?.src || '')
  if (parsed.type === 'photo') return getPhotoPlaceholderSrc(msg)
  if (parsed.type === 'sticker') return msg.stickerImage || ''
  return ''
}

function enterMsgMultiSelectMode(msgId, msg, context) {
  const chatPage = document.getElementById('chat-window')
  if (!chatPage) return
  const scope = context?.scope || 'chat'
  const selectedIds = new Set()
  if (msgId) selectedIds.add(parseInt(msgId))
  chatPage._multiSelectState = {
    scope,
    context: context || { scope },
    selectedIds
  }
  chatPage.classList.add('is-multi-selecting')
  renderMsgMultiSelectHeader(chatPage)
  bindMsgMultiSelectRows(chatPage)
  syncMsgMultiSelectRows(chatPage)
}

function renderMsgMultiSelectHeader(chatPage) {
  const header = chatPage.querySelector('.chat-header')
  if (!header) return
  header.classList.add('is-multi-selecting')
  let multiHeader = header.querySelector('.chat-multi-select-header')
  if (!multiHeader) {
    multiHeader = document.createElement('div')
    multiHeader.className = 'chat-multi-select-header'
    multiHeader.innerHTML = `
      <button class="chat-multi-header-btn" data-action="cancel" type="button">取消</button>
      <div class="chat-multi-header-title">已选择 <span class="chat-multi-count">0</span> 条</div>
      <button class="chat-multi-header-btn chat-multi-delete" data-action="delete" type="button">删除</button>
    `
    header.appendChild(multiHeader)
    multiHeader.querySelector('[data-action="cancel"]').addEventListener('click', () => exitMsgMultiSelectMode(chatPage))
    multiHeader.querySelector('[data-action="delete"]').addEventListener('click', () => deleteSelectedMessages(chatPage))
  }
  updateMsgMultiSelectHeader(chatPage)
}

function updateMsgMultiSelectHeader(chatPage) {
  const state = chatPage?._multiSelectState
  const count = state?.selectedIds?.size || 0
  const countEl = chatPage.querySelector('.chat-multi-count')
  const deleteBtn = chatPage.querySelector('.chat-multi-delete')
  if (countEl) countEl.textContent = count
  if (deleteBtn) deleteBtn.disabled = count < 1
}

function bindMsgMultiSelectRows(chatPage) {
  chatPage.querySelectorAll('.msg-row[data-id]').forEach(row => {
    if (!row.querySelector('.msg-select-control')) {
      const control = document.createElement('button')
      control.className = 'msg-select-control'
      control.type = 'button'
      control.setAttribute('aria-label', '选择消息')
      control.innerHTML = '<i class="fa fa-check"></i>'
      row.prepend(control)
    }
    if (row._multiSelectClickHandler) return
    row._multiSelectClickHandler = e => {
      const page = row.closest('.chat-window-page')
      if (!page?._multiSelectState) return
      e.preventDefault()
      e.stopPropagation()
      toggleMsgMultiSelectRow(page, row)
    }
    row.addEventListener('click', row._multiSelectClickHandler, true)
  })
}

function toggleMsgMultiSelectRow(chatPage, row) {
  const state = chatPage._multiSelectState
  if (!state) return
  const id = parseInt(row.dataset.id)
  if (!id) return
  if (state.selectedIds.has(id)) state.selectedIds.delete(id)
  else state.selectedIds.add(id)
  syncMsgMultiSelectRows(chatPage)
}

function syncMsgMultiSelectRows(chatPage) {
  const state = chatPage?._multiSelectState
  if (!state) return
  chatPage.querySelectorAll('.msg-row[data-id]').forEach(row => {
    const id = parseInt(row.dataset.id)
    row.classList.toggle('is-selected', state.selectedIds.has(id))
  })
  updateMsgMultiSelectHeader(chatPage)
}

function refreshMsgMultiSelectBindings(container) {
  const chatPage = container?.closest?.('.chat-window-page')
  if (!chatPage?._multiSelectState) return
  bindMsgMultiSelectRows(chatPage)
  syncMsgMultiSelectRows(chatPage)
}

function exitMsgMultiSelectMode(chatPage) {
  if (!chatPage) return
  chatPage.classList.remove('is-multi-selecting')
  const header = chatPage.querySelector('.chat-header')
  if (header) {
    header.classList.remove('is-multi-selecting')
    const multiHeader = header.querySelector('.chat-multi-select-header')
    if (multiHeader) multiHeader.remove()
  }
  chatPage.querySelectorAll('.msg-row[data-id]').forEach(row => {
    row.classList.remove('is-selected')
    const control = row.querySelector('.msg-select-control')
    if (control) control.remove()
    if (row._multiSelectClickHandler) {
      row.removeEventListener('click', row._multiSelectClickHandler, true)
      delete row._multiSelectClickHandler
    }
  })
  delete chatPage._multiSelectState
}

async function deleteSelectedMessages(chatPage) {
  const state = chatPage?._multiSelectState
  if (!state || !state.selectedIds.size) return
  const ids = [...state.selectedIds]
  const scope = state.scope || 'chat'
  if (scope === 'group') {
    const groupId = parseInt(chatPage.dataset.groupId)
    const group = state.context?.group || (groupId ? await getWechatAccessibleGroup(groupId) : null)
    if (!group || !isWechatGroupAccessible(group)) return
    await db.groupMessages.bulkDelete(ids)
    exitMsgMultiSelectMode(chatPage)
    if (groupId && group) await loadGroupMessages(chatPage, groupId, group, { force: true })
    return
  }
  await db.messages.bulkDelete(ids)
  const chatId = parseInt(chatPage.dataset.chatId)
  exitMsgMultiSelectMode(chatPage)
  if (chatId) await loadChatMessages(chatPage, chatId, { force: true })
}

async function quoteMsg(msg, context) {
  const chatPage = document.getElementById('chat-window')
  if (!chatPage) return
  if (context?.scope === 'group') {
    const char = msg.senderId === _wechatUid ? _wechatUser : (context.charMap && context.charMap[msg.senderId])
    const speaker = msg.senderId === _wechatUid ? (_wechatUser?.nick || _wechatUser?.name || '我') : getWechatDisplayName(char)
    setPendingQuote(chatPage, getMsgQuoteInfo(msg, speaker, speaker))
    return
  }
  const char = await getWechatDisplayCharacter(context?.charId || msg.charId)
  const speaker = msg.role === 'user'
    ? (_wechatUser?.nick || _wechatUser?.name || '我')
    : getWechatDisplayName(char)
  setPendingQuote(chatPage, getMsgQuoteInfo(msg, speaker, getWechatDisplayName(char)))
}


// 复制消息内容
function copyMsgContent(msg) {
  const text = getMsgActionText(msg, '')
  copyTextToClipboard(text)
    .then(() => window.toast('已复制'))
    .catch(() => window.toast('复制失败'))
}

function copyTextToClipboard(text) {
  const value = String(text || '')
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value).catch(() => fallbackCopyText(value))
  }
  return fallbackCopyText(value)
}

function fallbackCopyText(text) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  ta.style.top = '0'
  document.body.appendChild(ta)
  try {
    ta.select()
    ta.setSelectionRange(0, ta.value.length)
    const ok = document.execCommand('copy')
    return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'))
  } catch (err) {
    return Promise.reject(err)
  } finally {
    ta.remove()
  }
}

// 删除消息
async function deleteMsg(msgId, msg, context) {
  const chatPage = document.getElementById('chat-window')
  if (context?.scope === 'group') {
    const group = await getWechatAccessibleGroup(msg.groupId)
    if (!group) return
    await db.groupMessages.delete(msgId)
    if (chatPage) loadGroupMessages(chatPage, msg.groupId, group)
    return
  }
  await db.messages.delete(msgId)
  if (!chatPage) return
  const container = chatPage.querySelector('#chat-messages')
  if (!removeMsgRowFromDom(container, msgId)) loadChatMessages(chatPage, msg.chatId)
}

function buildThoughtDisplayHTML(msg, templateConfig, charName, char) {
  if (!msg?.thought) return ''
  const snapshot = msg.thoughtSnapshot?.regexPattern && msg.thoughtSnapshot?.replacePattern
    ? {
        enabled: true,
        regexPattern: msg.thoughtSnapshot.regexPattern,
        replacePattern: msg.thoughtSnapshot.replacePattern
      }
    : null
  const configs = [snapshot, templateConfig, getDefaultThoughtTemplateConfig(charName)].filter(Boolean)
  for (const cfg of configs) {
    try {
      const rendered = renderThoughtTemplateHtml(msg.thought, cfg, charName, char)
      if (rendered?.thoughtHtml) return rendered.thoughtHtml
    } catch (_) {}
  }
  return getDefaultThoughtTemplateConfig(charName).replacePattern
    .replace(/\{charName\}/g, wcEscHtml(charName || '角色'))
    .replace(/\{charAvatar\}/g, buildThoughtTemplateAvatarHTML(char, charName || '角色'))
    .replace(/\$1/g, wcEscHtml(msg.thought))
}

function renderThoughtForStorage(rawThought, templateConfig, charName, char) {
  try {
    const rendered = renderThoughtTemplateHtml(rawThought, templateConfig, charName, char)
    if (rendered) return { thoughtSnapshot: rendered.thoughtSnapshot }
  } catch (_) {}
  try {
    const rendered = renderThoughtTemplateHtml(rawThought, getDefaultThoughtTemplateConfig(charName), charName, char)
    return rendered ? { thoughtSnapshot: rendered.thoughtSnapshot } : null
  } catch (_) {
    return null
  }
}

function buildThoughtCardHTML(msg, templateConfig, charName, char) {
  if (!msg) {
    return `<div class="thought-card-empty">还没有心声记录<br><span>下次回复时会自动生成</span></div>`
  }
  return `
    <div class="thought-card-frame" data-msg-id="${msg.id}">
      <div class="thought-card-meta">${formatThoughtTime(msg.thoughtAt || msg.createdAt)}</div>
      <div class="thought-card-scroll">
        ${buildThoughtDisplayHTML(msg, templateConfig, charName, char)}
      </div>
    </div>
  `
}

async function clearThoughtMessage(msgId, chatId) {
  const msg = await db.messages.get(msgId)
  if (!msg) return
  delete msg.thought
  delete msg.thoughtRaw
  delete msg.thoughtHtml
  delete msg.thoughtStatus
  delete msg.thoughtSnapshot
  delete msg.thoughtAt
  await db.messages.put(msg)
  const chatPage = _getVisibleChatWindow('chat', chatId)
  if (chatPage) await refreshChat(chatPage, { force: true })
}

async function openThoughtTemplateSettingsFromCard(chatId, charId, closePanel) {
  closePanel()
  const chatPage = _getVisibleChatWindow('chat', chatId) || document.getElementById('chat-window')
  await openChatSettings(chatId, charId, chatPage)
  setTimeout(() => {
    const section = document.getElementById('cs-thought-template-enabled')?.closest('.cs-section')
    if (section) section.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, 80)
}

async function isThoughtFavorited(msgId) {
  const items = await getWechatFavorites()
  return items.some(it => it.id === `thought:${msgId}`)
}

function buildThoughtFavBtnHTML(isFav, id) {
  return `<button class="thought-round-btn ${isFav ? 'thought-fav-active' : ''}" id="${id}" title="收藏">${isFav ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>'}</button>`
}

async function toggleThoughtFavorite(msg, charName, char, templateConfig) {
  if (!_wechatUid || !msg) return false
  const favId = `thought:${msg.id}`
  const items = await getWechatFavorites()
  const existing = items.find(it => it.id === favId)
  if (existing) {
    await saveWechatFavorites(items.filter(it => it.id !== favId))
    window.toast && window.toast('已取消收藏')
    return false
  }
  const renderedHtml = buildThoughtDisplayHTML(msg, templateConfig, charName, char)
  const item = {
    id: favId,
    category: 'thought',
    scope: 'thought',
    sourceId: msg.chatId || null,
    messageId: msg.id,
    senderName: charName || '角色',
    sourceTitle: charName || '角色',
    content: msg.thought || '',
    parsedType: 'thought',
    parsedData: { charName, renderedHtml },
    createdAt: msg.thoughtAt || msg.createdAt || Date.now(),
    favoritedAt: Date.now()
  }
  await saveWechatFavorites([item, ...items])
  window.toast && window.toast('已收藏')
  return true
}

// 角色心声：点击 AI 头像打开当前心声卡，可切到历史卡片
async function showCharThoughtsHistory(charId, chatId) {
  const char = await getWechatDisplayCharacter(charId)
  if (!char) return
  const charName = getWechatDisplayName(char)
  const templateConfig = await getChatThoughtTemplateConfig(chatId)
  const thoughts = (await db.messages.where('chatId').equals(chatId).sortBy('createdAt'))
    .filter(m => m.role === 'assistant' && m.thought)
    .sort((a, b) => (b.thoughtAt || b.createdAt) - (a.thoughtAt || a.createdAt))
  const currentThought = thoughts[0] || null
  let historyThoughts = thoughts.slice(1)
  let historyIndex = 0
  const overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '300'
  const sheet = document.createElement('div')
  sheet.className = 'center-modal wc-center-modal thoughts-history-modal thoughts-card-modal'
  sheet.style.zIndex = '301'
  const close = () => {
    overlay.classList.remove('show'); sheet.classList.remove('show')
    setTimeout(() => { overlay.remove(); sheet.remove() }, 300)
  }
  const renderCurrent = async () => {
    const isFav = currentThought ? await isThoughtFavorited(currentThought.id) : false
    sheet.innerHTML = `
      <div class="thought-card-panel">
        ${buildThoughtCardHTML(currentThought, templateConfig, charName, char)}
        <div class="thought-card-actions">
          ${currentThought ? buildThoughtFavBtnHTML(isFav, 'btn-thought-fav') : ''}
          <button class="thought-round-btn" id="btn-thought-history" title="历史"><i class="fa fa-history"></i></button>
          <button class="thought-round-btn" id="btn-thought-close" title="关闭"><i class="fa fa-times"></i></button>
        </div>
      </div>
    `
    const favBtn = sheet.querySelector('#btn-thought-fav')
    if (favBtn) {
      favBtn.addEventListener('click', async () => {
        const nowFav = await toggleThoughtFavorite(currentThought, charName, char, templateConfig)
        favBtn.className = `thought-round-btn ${nowFav ? 'thought-fav-active' : ''}`
        favBtn.innerHTML = nowFav ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>'
      })
    }
    sheet.querySelector('#btn-thought-history').addEventListener('click', renderHistory)
    sheet.querySelector('#btn-thought-close').addEventListener('click', close)
  }
  // 历史卡片只渲染当前这张和前后各一张，避免一次性生成大量卡片（头像、模板 HTML）导致 iPhone 白屏
  const buildHistorySlideInner = (m) => {
    try {
      return buildThoughtCardHTML(m, templateConfig, charName, char)
    } catch (e) {
      console.warn('[wechat] 心声历史卡片渲染失败', e)
      return `<div class="thought-card-frame"><div class="thought-card-scroll"><div class="thought-card"><div class="thought-card-body">${wcEscHtml(m?.thought || '')}</div></div></div></div>`
    }
  }
  const renderHistory = async () => {
    try {
      if (historyThoughts.length && (historyIndex < 0 || historyIndex >= historyThoughts.length)) {
        historyIndex = historyThoughts.length - 1
      }
      const currentFav = historyThoughts.length ? await isThoughtFavorited(historyThoughts[historyIndex].id) : false
      const cardsHtml = historyThoughts.length
        ? historyThoughts.map((m, i) => `<div class="thought-history-slide" data-slide-index="${i}">${Math.abs(i - historyIndex) <= 1 ? buildHistorySlideInner(m) : ''}</div>`).join('')
        : '<div class="thought-history-empty">还没有历史心声</div>'
      sheet.innerHTML = `
        <div class="thought-history-panel">
          <div class="thought-history-slider">${cardsHtml}</div>
          <div class="thought-history-actions">
            <button class="thought-round-btn" id="btn-thought-back" title="返回" aria-label="返回"><i class="fa-solid fa-right-from-bracket"></i></button>
            ${historyThoughts.length ? buildThoughtFavBtnHTML(currentFav, 'btn-thought-hist-fav') : ''}
            <button class="thought-round-btn thought-round-btn-danger" id="btn-thought-delete" title="删除" aria-label="删除" ${historyThoughts.length ? '' : 'disabled'}><i class="fa fa-trash"></i></button>
          </div>
        </div>
      `
      const slider = sheet.querySelector('.thought-history-slider')
      if (slider) {
        // 去掉 rtl + 平滑滚动：iOS Safari 在弹窗里的 rtl 横向吸附滚动不稳定
        slider.style.direction = 'ltr'
        slider.style.scrollBehavior = 'auto'
        if (historyThoughts.length) slider.scrollLeft = historyIndex * (slider.clientWidth || 0)
        const fillSlides = () => {
          for (let i = Math.max(0, historyIndex - 1); i <= Math.min(historyThoughts.length - 1, historyIndex + 1); i++) {
            const slide = slider.querySelector(`.thought-history-slide[data-slide-index="${i}"]`)
            if (slide && !slide.firstElementChild) slide.innerHTML = buildHistorySlideInner(historyThoughts[i])
          }
        }
        let scrollTimer = null
        slider.addEventListener('scroll', () => {
          clearTimeout(scrollTimer)
          scrollTimer = setTimeout(async () => {
            const width = slider.clientWidth || 1
            const newIndex = Math.max(0, Math.min(historyThoughts.length - 1, Math.round(Math.abs(slider.scrollLeft) / width)))
            if (newIndex === historyIndex) return
            historyIndex = newIndex
            fillSlides()
            const histFavBtn = sheet.querySelector('#btn-thought-hist-fav')
            if (histFavBtn && historyThoughts[historyIndex]) {
              const fav = await isThoughtFavorited(historyThoughts[historyIndex].id)
              histFavBtn.className = `thought-round-btn ${fav ? 'thought-fav-active' : ''}`
              histFavBtn.innerHTML = fav ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>'
            }
          }, 80)
        })
      }
      const histFavBtn = sheet.querySelector('#btn-thought-hist-fav')
      if (histFavBtn) {
        histFavBtn.addEventListener('click', async () => {
          const target = historyThoughts[historyIndex]
          if (!target) return
          const nowFav = await toggleThoughtFavorite(target, charName, char, templateConfig)
          histFavBtn.className = `thought-round-btn ${nowFav ? 'thought-fav-active' : ''}`
          histFavBtn.innerHTML = nowFav ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>'
        })
      }
      sheet.querySelector('#btn-thought-back').addEventListener('click', renderCurrent)
      sheet.querySelector('#btn-thought-delete').addEventListener('click', async () => {
        const target = historyThoughts[historyIndex]
        if (!target) return
        await clearThoughtMessage(target.id, chatId)
        historyThoughts = historyThoughts.filter(m => m.id !== target.id)
        if (historyIndex >= historyThoughts.length) historyIndex = Math.max(0, historyThoughts.length - 1)
        renderHistory()
      })
    } catch (error) {
      console.error('[wechat] 心声历史渲染失败', error)
      window.toast && window.toast('历史心声加载失败：' + (error?.message || String(error)))
      renderCurrent()
    }
  }
  renderCurrent()
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(sheet)
  requestAnimationFrame(() => { overlay.classList.add('show'); sheet.classList.add('show') })
  overlay.addEventListener('click', close)
}

// 心声时间显示：今日 -> HH:mm；昨日 -> 昨天 HH:mm；其它 -> M月D日 HH:mm
function formatThoughtTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const yest = new Date(now); yest.setDate(now.getDate() - 1)
  const isYest = d.toDateString() === yest.toDateString()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  if (sameDay) return `今天 ${hh}:${mm}`
  if (isYest) return `昨天 ${hh}:${mm}`
  return `${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}`
}


function getCharacterInitial(name) {
  const text = (name || '').trim()
  return text ? Array.from(text)[0] : '?'
}

function buildWechatInitialAvatarHTML(name) {
  return `<div class="avatar-icon-placeholder avatar-text-placeholder">${wcEscHtml(getCharacterInitial(name || '角色'))}</div>`
}

function buildCharacterAvatarHTML(c) {
  const avatar = getWechatDisplayAvatar(c)
  if (avatar) return `<img src="${avatar}">`
  return buildWechatInitialAvatarHTML(getWechatDisplayName(c))
}

function buildGroupAvatarHTML(group, name = '') {
  const avatar = String(group?.avatar || '').trim()
  if (avatar) return `<img src="${wcEscHtml(avatar)}" alt="${wcEscHtml(name || group?.name || '群聊')}">`
  return '<div class="avatar-icon-placeholder"><i class="fa fa-users"></i></div>'
}

async function normalizeGroupChat(group, options = {}) {
  if (!group) return null
  const members = [...new Set((Array.isArray(group.members) ? group.members : [])
    .map(id => parseInt(id, 10))
    .filter(Number.isFinite))]
  let ownerId = parseInt(group.ownerId, 10)
  if (!Number.isFinite(ownerId) || !members.includes(ownerId)) {
    const chars = (await db.characters.bulkGet(members)).filter(Boolean)
    const userIds = chars.filter(char => char.type === 'user').map(char => char.id)
    ownerId = userIds[0] || members[0] || _wechatUid
  }
  if (Number.isFinite(ownerId) && !members.includes(ownerId)) members.push(ownerId)
  const adminIds = [...new Set((Array.isArray(group.adminIds) ? group.adminIds : [])
    .map(id => parseInt(id, 10))
    .filter(id => Number.isFinite(id) && members.includes(id) && id !== ownerId))]
  const normalized = {
    ...group,
    members,
    ownerId,
    adminIds,
    avatar: String(group.avatar || '').trim()
  }
  const changed = JSON.stringify(group.members || []) !== JSON.stringify(members)
    || parseInt(group.ownerId, 10) !== ownerId
    || JSON.stringify(group.adminIds || []) !== JSON.stringify(adminIds)
    || (group.avatar || '') !== normalized.avatar
  if (changed && options.persist !== false && group.id) {
    await db.groupChats.update(group.id, {
      members: normalized.members,
      ownerId: normalized.ownerId,
      adminIds: normalized.adminIds,
      avatar: normalized.avatar
    })
  }
  return normalized
}

// 新群聊按 ownerUid 隔离；没有 ownerUid 的历史群聊保持所有账号可见。
function isWechatGroupAccessible(group, uid = _wechatUid) {
  if (!group) return false
  const ownerUid = group.ownerUid
  if (ownerUid === undefined || ownerUid === null || ownerUid === '') return true
  if (uid === undefined || uid === null || uid === '') return false
  return String(ownerUid) === String(uid)
}

async function getWechatAccessibleGroup(groupId, uid = _wechatUid) {
  const group = await db.groupChats.get(groupId)
  return isWechatGroupAccessible(group, uid) ? group : null
}

function getGroupMemberRole(group, memberId) {
  const id = parseInt(memberId, 10)
  if (id === parseInt(group?.ownerId, 10)) return 'owner'
  if ((group?.adminIds || []).map(Number).includes(id)) return 'admin'
  return 'member'
}

function canManageGroup(group, memberId = _wechatUid) {
  const role = getGroupMemberRole(group, memberId)
  return role === 'owner' || role === 'admin'
}

function canRemoveGroupMember(group, actorId, targetId) {
  const actorRole = getGroupMemberRole(group, actorId)
  const targetRole = getGroupMemberRole(group, targetId)
  if (targetRole === 'owner' || actorId === targetId) return false
  if (actorRole === 'owner') return true
  return actorRole === 'admin' && targetRole === 'member'
}

// 拼音首字母提取
function getPinyinInitial(str) {
  const c = getCharacterInitial(str)
  if (!c || c === '?') return '#'
  if (/[a-zA-Z]/.test(c)) return c.toUpperCase()
  if (/[0-9]/.test(c)) return '#'
  const code = c.charCodeAt(0)
  if (code < 0x4E00 || code > 0x9FFF) return '#'
  const letters = 'ABCDEFGHJKLMNOPQRSTWXYZ'
  const anchors = '阿八嚓哒妸发旮哈讥咔垃妈拏噢啪期然撒塌穵夕丫匝'
  for (let i = anchors.length - 1; i >= 0; i--) {
    if (c.localeCompare(anchors[i], 'zh-Hans-CN', { sensitivity: 'base' }) >= 0) {
      return letters[i] || '#'
    }
  }
  return '#'
}

// ===== Tab2：通讯录 =====
function renderCachedWechatContacts(page, container) {
  const state = page?._wechatContactsState
  if (!state || !container) return false
  renderContactsPage(page, container, state)
  return true
}

async function preloadWechatContacts(page) {
  if (!page || !document.body.contains(page)) return
  const chars = await loadFriendCharacters()
  const contactItems = await enrichContactGroupNames(chars)
  const storyItems = await loadContactStoryItems()
  const sortMode = await getWechatContactsSortMode()
  if (!document.body.contains(page)) return
  page._wechatContactsState = { contactItems, storyItems, sortMode }
}

async function loadContacts(page, container, options = {}) {
  const hasCachedContacts = options.renderCache !== false ? renderCachedWechatContacts(page, container) : !!page._wechatContactsState
  if (!hasCachedContacts && options.showLoading !== false) {
    container.innerHTML = '<div class="list-loading"><i class="fa fa-spinner fa-spin"></i></div>'
  }
  const token = (page._wechatContactsLoadToken || 0) + 1
  page._wechatContactsLoadToken = token
  const chars = await loadFriendCharacters()
  const contactItems = await enrichContactGroupNames(chars)
  const storyItems = await loadContactStoryItems()
  const sortMode = await getWechatContactsSortMode()
  if (page._wechatContactsLoadToken !== token) return
  const state = { contactItems, storyItems, sortMode }
  page._wechatContactsState = state
  renderContactsPage(page, container, state)
}

function renderContactsPage(page, container, state) {
  const contactItems = state.contactItems || []
  const storyItems = state.storyItems || []
  page.dataset.contactsSortMode = state.sortMode || 'letter'
  container.innerHTML = `
    <div class="contacts-story-rail" id="contacts-story-rail">
      ${storyItems.map(buildContactStoryItemHTML).join('')}
    </div>
    <div class="contacts-search-wrap">
      <div class="contacts-search-field">
        <i class="fi fi-rr-search contacts-search-icon"></i>
        <input class="contacts-search-input" id="contacts-search" placeholder="搜索">
        <button class="contacts-scan-btn" type="button" aria-label="扫一扫">
          <i class="fi fi-rr-qr-scan"></i>
        </button>
      </div>
    </div>
    <div class="contacts-list">
      ${isWechatRolePhoneMode(page) ? '' : `
      <div class="contact-add-card">
        <div class="contact-row contact-add-row" id="btn-add-friend">
          <div class="chat-avatar contact-add-avatar"><i class="fa fa-user-plus"></i></div>
          <div class="contact-info">
            <span class="contact-name">添加好友</span>
            <span class="contact-nick">通过微信号或导入角色添加</span>
          </div>
          <i class="fa fa-angle-right" style="color:var(--c-hint)"></i>
        </div>
      </div>
      `}
      <div class="contacts-list-toolbar">
        <div class="contacts-total">${contactItems.length} Contacts</div>
        <button class="contacts-sort-btn" id="btn-contacts-sort" type="button">
          <span>排序方式</span>
          <i class="fa fa-angle-down"></i>
        </button>
      </div>
      <div id="contacts-list-inner"></div>
    </div>
  `
  const renderContactList = (filter) => renderContacts(page, container, contactItems, filter)
  renderContactList('')
  bindContactStoryRail(page, container)
  container.querySelector('#contacts-search').addEventListener('input', e => renderContactList(e.target.value.trim()))
  container.querySelector('#btn-add-friend')?.addEventListener('click', () => showAddFriendModal(page))
  container.querySelector('#btn-contacts-sort').addEventListener('click', () => {
    const input = container.querySelector('#contacts-search')
    showContactsSortSheet(page, () => renderContactList(input?.value.trim() || ''))
  })
}

async function enrichContactGroupNames(chars) {
  return Promise.all(chars.map(async c => ({
    ...c,
    _contactGroupName: c._phoneSnapshotFriend ? '' : await getPrivateChatGroupName(c.id)
  })))
}

function showContactsSortSheet(page, onChange) {
  const mode = page.dataset.contactsSortMode || 'letter'
  const sheet = wcMakeSheet(`
    <div class="sheet-title">排序方式</div>
    <div class="contact-group-picker contacts-sort-picker">
      ${buildContactsSortOptionHTML('letter', '按字母排序', mode)}
      ${buildContactsSortOptionHTML('group', '按分组排序', mode)}
    </div>
  `)
  wcShowSheetNoConfirm(sheet)
  sheet.querySelectorAll('.contacts-sort-option').forEach(btn => {
    btn.addEventListener('click', async () => {
      const mode = normalizeWechatContactsSortMode(btn.dataset.mode)
      page.dataset.contactsSortMode = mode
      await saveWechatContactsSortMode(mode)
      closeWcSheet(sheet)
      if (typeof onChange === 'function') onChange()
    })
  })
}

function buildContactsSortOptionHTML(mode, label, activeMode) {
  return `
    <button class="contact-group-option contacts-sort-option${mode === activeMode ? ' active' : ''}" data-mode="${mode}" type="button">
      <span>${label}</span>
      <i class="fa fa-check"></i>
    </button>
  `
}

async function loadContactStoryItems() {
  const profile = await getWechatSelfProfile()
  const selfName = _wechatUser?.nick || _wechatUser?.name || '我'
  const items = [{
    type: 'self',
    name: 'My Notes',
    avatar: profile.avatar || _wechatUser?.avatar || '',
    fallbackName: selfName
  }]
  if (!_wechatUid) return items
  const chats = (await db.chats.toArray()).filter(chat => chat.ownerUid === _wechatUid)
  const privateItems = []
  for (const chat of chats) {
    const char = await getWechatDisplayCharacter(chat.charId)
    if (!char || char.type === 'user') continue
    const lastMsg = await db.messages.where('chatId').equals(chat.id).last()
    privateItems.push({
      type: 'private',
      charId: char.id,
      name: getWechatDisplayName(char),
      avatar: getWechatDisplayAvatar(char),
      fallbackName: char.nick || char.name || '',
      time: lastMsg?.createdAt || chat.createdAt || 0
    })
  }
  privateItems.sort((a, b) => b.time - a.time)
  return items.concat(privateItems)
}

function buildContactStoryItemHTML(item) {
  const isSelf = item.type === 'self'
  const avatar = item.avatar
    ? `<img src="${item.avatar}" alt="${wcEscHtml(item.name)}">`
    : `<div class="contacts-story-placeholder">${wcEscHtml(getCharacterInitial(item.fallbackName || item.name))}</div>`
  return `
    <button class="contacts-story-item${isSelf ? ' is-self' : ''}" type="button" data-type="${item.type}" data-char-id="${item.charId || ''}">
      <span class="contacts-story-avatar-shell">
        <span class="contacts-story-avatar">${avatar}</span>
        ${isSelf ? '<span class="contacts-story-add"><i class="fa fa-plus"></i></span>' : ''}
      </span>
      <span class="contacts-story-name">${wcEscHtml(item.name)}</span>
    </button>
  `
}

function bindContactStoryRail(page, container) {
  container.querySelectorAll('.contacts-story-item').forEach(item => {
    item.addEventListener('click', () => {
      if (item.dataset.type === 'self') {
        openWechatSelfProfilePage(page)
        return
      }
      const charId = parseInt(item.dataset.charId)
      if (charId) openWechatContactProfilePage(page, charId)
    })
  })
}

// 读取当前账号好友对应的角色列表
async function loadFriendCharacters() {
  if (!_wechatUid) return []
  const ids = await getFriendIds(_wechatUid)
  const chars = ids.length ? await Promise.all(ids.map(id => getWechatDisplayCharacter(id))) : []
  const result = chars.filter(c => c && (isWechatRolePhoneMode() || c.type !== 'user'))
  if (isWechatRolePhoneMode() && window.getPhoneSnapshotContactEntries) {
    result.push(...await window.getPhoneSnapshotContactEntries(_wechatRolePhoneSession))
  }
  return result
}

async function loadMomentFriendCharacters(ownerUid) {
  if (!ownerUid) return []
  const ids = await getFriendIds(ownerUid)
  if (!ids.length) return []
  const chars = await Promise.all(ids.map(id => getWechatDisplayCharacter(id, ownerUid)))
  return chars.filter(c => c && c.type !== 'user')
}

// 渲染通讯录列表
function renderContacts(page, container, chars, filter) {
  const filtered = filter ? chars.filter(c => (c.name + (c.nick || '') + getWechatDisplayName(c)).includes(filter)) : chars
  const list = container.querySelector('#contacts-list-inner')
  if (!list) return
  if (!chars.length) {
    list.innerHTML = '<div class="contacts-empty-card"><div class="list-empty">还没有好友，点击上方添加</div></div>'
    return
  }
  if (!filtered.length) {
    list.innerHTML = '<div class="contacts-empty-card"><div class="list-empty">未找到匹配的好友</div></div>'
    return
  }
  const groups = (page.dataset.contactsSortMode || 'letter') === 'group'
    ? buildContactsGroupSections(filtered)
    : buildContactsLetterSections(filtered)
  list.innerHTML = groups.map(buildContactSectionHTML).join('')
  list.querySelectorAll('.contact-row').forEach(row => {
    if (row.dataset.phoneSnapshotFriend !== undefined) {
      row.addEventListener('click', e => {
        if (e.target.closest('.phone-snapshot-add-npc')) return
        window.openPhoneSnapshotChatWindow?.(_wechatRolePhoneSession, row.dataset.phoneSnapshotFriend)
      })
      return
    }
    row.addEventListener('click', () => openWechatContactProfilePage(page, parseInt(row.dataset.charId)))
  })
  list.querySelectorAll('.phone-snapshot-add-npc').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const session = _wechatRolePhoneSession
      window.addPhoneSnapshotFriendToCharacters?.(session?.ownerUid, session?.charId, btn.dataset.friendName)
    })
  })
}

function buildContactsLetterSections(chars) {
  const sorted = chars.map(c => ({ ...c, _initial: getPinyinInitial(c.name) }))
  sorted.sort((a, b) => {
    if (a._initial === '#' && b._initial !== '#') return 1
    if (a._initial !== '#' && b._initial === '#') return -1
    return a._initial.localeCompare(b._initial) || a.name.localeCompare(b.name, 'zh-CN')
  })
  const sections = []
  let curLetter = ''
  for (const c of sorted) {
    if (c._initial !== curLetter) {
      curLetter = c._initial
      sections.push({ title: curLetter, showTitle: true, items: [] })
    }
    sections[sections.length - 1].items.push(c)
  }
  return sections
}

function buildContactsGroupSections(chars) {
  const grouped = new Map()
  const ungrouped = []
  chars.forEach(c => {
    const groupName = String(c._contactGroupName || '').trim()
    if (!groupName) {
      ungrouped.push(c)
      return
    }
    if (!grouped.has(groupName)) grouped.set(groupName, [])
    grouped.get(groupName).push(c)
  })
  const sortByName = (a, b) => getWechatDisplayName(a).localeCompare(getWechatDisplayName(b), 'zh-CN')
  const sections = [...grouped.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'zh-CN'))
    .map(([title, items]) => ({ title, showTitle: true, items: items.sort(sortByName) }))
  if (ungrouped.length) {
    sections.push({ title: '未分组', showTitle: false, items: ungrouped.sort(sortByName) })
  }
  return sections
}

function buildContactSectionHTML(section) {
  return `
    <div class="contacts-section">
      ${section.showTitle ? `<div class="contacts-section-title">${wcEscHtml(section.title)}</div>` : ''}
      <div class="contacts-section-card">
        ${section.items.map(buildContactRowHTML).join('')}
      </div>
    </div>
  `
}

// 通讯录单行HTML
function buildContactRowHTML(c) {
  if (c._phoneSnapshotFriend) return buildPhoneSnapshotContactRowHTML(c)
  const avatar = buildCharacterAvatarHTML(c)
  const displayName = getWechatDisplayName(c)
  const fallbackName = c.nick || c.name || ''
  return `
    <div class="contact-row" data-char-id="${c.id}">
      <div class="chat-avatar">${avatar}</div>
      <div class="contact-info">
        <span class="contact-name">${wcEscHtml(displayName)}</span>
        ${displayName !== fallbackName ? `<span class="contact-nick">${wcEscHtml(fallbackName)}</span>` : ''}
      </div>
    </div>
  `
}

// 通讯录单行HTML：角色手机生成的快照好友
function buildPhoneSnapshotContactRowHTML(c) {
  const displayName = c.name || c.nick || ''
  const subParts = []
  if (c.nick && c.nick !== displayName) subParts.push(c.nick)
  if (c._phoneSnapshotRelation) subParts.push(c._phoneSnapshotRelation)
  // 虚构好友（npcId 为空）提供「添加至角色档案」入口；关联NPC本就在档案里
  const addBtn = c._phoneSnapshotNpcId == null
    ? `<button class="phone-snapshot-add-npc" type="button" data-friend-name="${wcEscHtml(c._phoneSnapshotFriendName)}">添加至角色档案</button>`
    : ''
  return `
    <div class="contact-row phone-snapshot-contact-row" data-phone-snapshot-friend="${wcEscHtml(c._phoneSnapshotFriendName)}">
      <div class="chat-avatar">${buildWechatInitialAvatarHTML(displayName)}</div>
      <div class="contact-info">
        <span class="contact-name">${wcEscHtml(displayName)}</span>
        ${subParts.length ? `<span class="contact-nick">${wcEscHtml(subParts.join(' · '))}</span>` : ''}
      </div>
      ${addBtn}
    </div>
  `
}

function getWechatContactProfileStatsKey(ownerUid, charId) {
  return `wechatContactProfileStats_${ownerUid}_${charId}`
}

async function getWechatContactProfileStats(charId) {
  const key = getWechatContactProfileStatsKey(_wechatUid, charId)
  const row = await db.config.get(key)
  if (row?.value && Number.isFinite(parseInt(row.value.followers, 10)) && Number.isFinite(parseInt(row.value.following, 10))) {
    return {
      followers: parseInt(row.value.followers, 10),
      following: parseInt(row.value.following, 10)
    }
  }
  const value = {
    followers: 2 + Math.floor(Math.random() * 999),
    following: 2 + Math.floor(Math.random() * 999)
  }
  await db.config.put({ key, value })
  return value
}

const _privateChatCreationLocks = new Map()

async function ensurePrivateChatRecord(charId) {
  const ownerUid = _wechatUid
  const lockKey = `${ownerUid || ''}:${charId || ''}`
  if (_privateChatCreationLocks.has(lockKey)) return _privateChatCreationLocks.get(lockKey)
  const task = (async () => {
    let chat = await db.chats
      .where('[ownerUid+charId]').equals([ownerUid, charId])
      .first()
    if (!chat) {
      const createdAt = Date.now()
      const id = await db.chats.add({
        charId, ownerUid,
        createdAt, unread: 0
      })
      chat = { id, charId, ownerUid, createdAt, unread: 0 }
    }
    return chat
  })()
  _privateChatCreationLocks.set(lockKey, task)
  try {
    return await task
  } finally {
    if (_privateChatCreationLocks.get(lockKey) === task) {
      _privateChatCreationLocks.delete(lockKey)
    }
  }
}

async function getPrivateChatGroupName(charId) {
  return getPrivateChatGroupNameForOwner(_wechatUid, charId)
}

async function getPrivateChatGroupNameForOwner(ownerUid, charId) {
  const chat = await db.chats
    .where('[ownerUid+charId]').equals([ownerUid, charId])
    .first()
  if (!chat) return ''
  const meta = await getWechatChatMeta(ownerUid)
  return meta[getWechatChatItemKey('private', chat.id)]?.groupName || ''
}

async function openWechatContactProfilePage(wechatPage, charId) {
  const char = await getWechatDisplayCharacter(charId)
  if (!char) return
  const momentsProfile = await getWechatContactMomentsProfile(charId)
  const stats = await getWechatContactProfileStats(charId)
  const posts = await countScopedMoments(charId)
  const groupName = await getPrivateChatGroupName(charId)
  const page = document.createElement('div')
  page.id = 'wechat-contact-profile-page'
  page.className = 'full-page wechat-contact-profile-page'
  if (isWechatRolePhoneMode(wechatPage)) {
    page.classList.add('wechat-role-phone-page')
    page.dataset.wechatRolePhone = '1'
  }
  page.dataset.charId = charId
  page.innerHTML = buildWechatContactProfilePageHTML(char, momentsProfile, stats, posts, groupName)
  window.openPage(page)
  page.querySelector('#btn-wcp-back').addEventListener('click', () => window.closePage('wechat-contact-profile-page'))
  page.querySelector('#btn-wcp-message').addEventListener('click', async () => {
    window.closePage('wechat-contact-profile-page')
    await openPrivateChat(wechatPage, charId, null)
  })
  page.querySelector('#wcp-group-row').addEventListener('click', () => showContactGroupPicker(page, wechatPage, charId))
  page.querySelector('#wcp-call-records')?.addEventListener('click', () => {
    window.openCallRecordsPage?.(charId)
  })
  const openContactMoments = () => openWechatContactMomentsPage(wechatPage, charId)
  page.querySelector('#btn-wcp-following').addEventListener('click', openContactMoments)
  page.querySelector('#wcp-following-stat')?.addEventListener('click', openContactMoments)
}

function buildWechatContactProfilePageHTML(char, momentsProfile, stats, posts, groupName) {
  const name = getWechatDisplayName(char)
  const account = char?.identity?.account || '未设置'
  const avatar = buildCharacterAvatarHTML(char)
  const bio = String(momentsProfile?.bio || '').trim()
  const bioHtml = bio ? `<div class="me-bio">${wcEscHtml(bio.slice(0, 120))}</div>` : ''
  return `
    <div class="page-header">
      <button class="header-back" id="btn-wcp-back"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">Personal Profile</span>
      <span class="header-spacer"></span>
    </div>
    <div class="me-profile-page contact-profile-scroll">
      <div class="me-hero">
        <div class="me-hero-top">
          <div class="me-avatar">${avatar}</div>
          <div class="me-info-stack">
            <div class="me-name">${wcEscHtml(name)}</div>
            <div class="me-stats">
              <div class="me-stat"><strong>${posts}</strong><span>Posts</span></div>
              <div class="me-stat"><strong>${stats.followers}</strong><span>Followers</span></div>
              <button class="me-stat" id="wcp-following-stat" type="button"><strong>${stats.following}</strong><span>Following</span></button>
            </div>
          </div>
        </div>
        <div class="me-wechat-id">@${wcEscHtml(account)}</div>
        ${bioHtml}
        <div class="me-actions">
          <button class="me-action-btn me-action-primary" id="btn-wcp-following" type="button">Following</button>
          <button class="me-action-btn" id="btn-wcp-message" type="button">Message</button>
        </div>
      </div>
      <div class="me-menu contact-profile-menu">
        <button class="me-menu-row contact-group-row" id="wcp-group-row" type="button">
          <span class="me-menu-icon"><i class="fa-solid fa-layer-group"></i></span>
          <span class="me-menu-label">分组</span>
          <span class="contact-group-value" id="wcp-group-value">${wcEscHtml(groupName || '')}</span>
        </button>
        <button class="me-menu-row contact-group-row" id="wcp-call-records" type="button">
          <span class="me-menu-icon"><i class="fa-solid fa-phone"></i></span>
          <span class="me-menu-label">通话记录</span>
          <i class="fa fa-angle-right" style="color:#ccc;margin-left:auto;font-size:18px"></i>
        </button>
      </div>
    </div>
  `
}

async function openWechatContactMomentsPage(wechatPage, charId) {
  const pageId = `wechat-contact-moments-page-${charId}`
  const momentsPage = ensureWechatContactMomentsPage(wechatPage, charId, pageId)
  openReusableWechatMomentsPage(momentsPage)
  await refreshWechatMoments(momentsPage, wechatPage, { mode: 'contact', charId })
}

function buildWechatContactMomentsPageHTML(char, profile, cachedListHTML) {
  const name = getWechatDisplayName(char)
  const account = char?.identity?.account || ''
  const avatarUrl = getWechatDisplayAvatar(char)
  const avatar = avatarUrl ? `<img src="${avatarUrl}" alt="${wcEscHtml(name)}">` : buildWechatInitialAvatarHTML(name)
  const bio = String(profile?.bio || '').trim()
  const accountHtml = `<div class="moments-profile-account">@${wcEscHtml(account || '未设置')}</div>`
  const bioHtml = bio ? `<div class="moments-profile-bio" id="contact-moments-bio">${wcEscHtml(bio)}</div>` : '<div class="moments-profile-bio" id="contact-moments-bio" style="display:none"></div>'
  return `
    <div class="page-header moments-header">
      <button class="header-back" id="btn-contact-moments-back" aria-label="返回">
        <i class="fa fa-angle-left"></i>
      </button>
      <span class="header-title">Moments</span>
      <button class="moments-nav-btn" id="btn-contact-moments-edit" aria-label="编辑朋友圈资料">
        <i class="fa-solid fa-ellipsis-vertical moments-ellipsis-icon"></i>
      </button>
    </div>
    <div class="moments-scroll">
      <div class="moments-page">
        <div class="moments-hero">
          <div class="moments-cover" id="moments-cover" aria-label="朋友圈背景"></div>
          <div class="moments-profile">
            <div class="moments-profile-avatar" id="moments-profile-avatar">${avatar}</div>
            <div class="moments-profile-name" id="moments-profile-name">${wcEscHtml(name)}</div>
            <div class="moments-profile-account" id="moments-profile-account">@${wcEscHtml(account || '未设置')}</div>
            ${bioHtml}
            <div class="moments-pinned" id="moments-pinned"></div>
          </div>
        </div>
        <div class="moments-list" id="moments-list">
          ${cachedListHTML || '<div class="list-loading"><i class="fa fa-spinner fa-spin"></i></div>'}
        </div>
      </div>
    </div>
  `
}

async function showContactMomentsEditSheet(momentsPage, char) {
  const charId = parseInt(momentsPage.dataset.momentsCharId, 10)
  if (!charId) return
  const profile = await getWechatContactMomentsProfile(charId)
  const sheet = wcMakeSheet(`
    <div class="sheet-title">MOMENTS EDITOR</div>
    <div class="contact-moments-editor">
      <label class="me-profile-field">
        <span>背景</span>
        <div class="contact-moments-cover-preview" id="contact-moments-cover-preview"></div>
        <input type="hidden" id="contact-moments-cover-value" value="${wcEscHtml(profile.coverImage || '')}">
        <button class="btn-ghost btn-full" id="btn-contact-moments-pick-cover" type="button"><i class="fa fa-image"></i> 选择背景</button>
      </label>
      <label class="me-profile-field">
        <span>个性签名</span>
        <textarea class="input-field" id="contact-moments-bio-input" rows="4" placeholder="输入个性签名">${wcEscHtml(profile.bio || '')}</textarea>
      </label>
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-save-contact-moments">保存</button>
    </div>
  `)
  wcShowSheetNoConfirm(sheet)
  const coverInput = sheet.querySelector('#contact-moments-cover-value')
  const preview = sheet.querySelector('#contact-moments-cover-preview')
  const syncPreview = () => {
    const coverImage = coverInput.value.trim()
    preview.style.backgroundImage = coverImage ? `url(${JSON.stringify(coverImage)})` : ''
  }
  syncPreview()
  sheet.querySelector('#btn-contact-moments-pick-cover').addEventListener('click', () => {
    window.showImagePicker(imageUrl => {
      coverInput.value = imageUrl || ''
      syncPreview()
    })
  })
  sheet.querySelector('#btn-save-contact-moments').addEventListener('click', async () => {
    const coverImage = coverInput.value.trim()
    const bio = sheet.querySelector('#contact-moments-bio-input').value.trim()
    await saveWechatContactMomentsProfile(charId, { coverImage, bio })
    const state = momentsPage._wechatMomentsState || {}
    momentsPage._wechatMomentsState = { ...state, coverImage, bio }
    applyWechatMomentsProfileState(momentsPage, momentsPage._wechatMomentsState)
    closeWcSheetCore(sheet._wcOverlay, sheet)
    window.toast && window.toast('朋友圈资料已保存')
  })
}

async function showContactGroupPicker(profilePage, wechatPage, charId) {
  const groups = await getWechatChatGroups()
  let selectedGroup = await getPrivateChatGroupName(charId)
  const sheet = wcMakeSheet(`
    <div class="sheet-title">选择分组</div>
    <div class="contact-group-picker" id="contact-group-picker">
      ${groups.length
        ? groups.map(group => buildContactGroupOptionHTML(group, group === selectedGroup)).join('')
        : '<div class="contact-group-empty">暂无分组</div>'}
      <button class="contact-group-option contact-group-add-option" id="contact-group-add-option" type="button">+ADD</button>
      <div class="contact-group-new" id="contact-group-new" style="display:none">
        <input class="input-field" id="contact-group-new-input" placeholder="输入新的分组名称" maxlength="20">
      </div>
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-save-contact-group">保存</button>
    </div>
  `)
  wcShowSheetNoConfirm(sheet)
  const close = () => closeWcSheetCore(sheet._wcOverlay, sheet)
  const markSelected = value => {
    selectedGroup = value
    sheet.querySelectorAll('.contact-group-option[data-group]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.group === value)
    })
  }
  sheet.querySelectorAll('.contact-group-option[data-group]').forEach(btn => {
    btn.addEventListener('click', () => markSelected(btn.dataset.group || ''))
  })
  sheet.querySelector('#contact-group-add-option').addEventListener('click', () => {
    const wrap = sheet.querySelector('#contact-group-new')
    wrap.style.display = 'block'
    const input = sheet.querySelector('#contact-group-new-input')
    input.focus()
    selectedGroup = input.value.trim()
  })
  sheet.querySelector('#contact-group-new-input').addEventListener('input', e => {
    selectedGroup = e.target.value.trim()
    sheet.querySelectorAll('.contact-group-option[data-group]').forEach(btn => btn.classList.remove('active'))
  })
  sheet.querySelector('#btn-save-contact-group').addEventListener('click', async () => {
    const typed = sheet.querySelector('#contact-group-new').style.display !== 'none'
      ? sheet.querySelector('#contact-group-new-input').value.trim()
      : ''
    const groupName = typed || selectedGroup
    if (!groupName) { window.toast && window.toast('请选择或输入分组'); return }
    await addWechatChatGroup(groupName)
    const chat = await ensurePrivateChatRecord(charId)
    await updateWechatChatMeta(getWechatChatItemKey('private', chat.id), { groupName })
    const valueEl = profilePage.querySelector('#wcp-group-value')
    if (valueEl) valueEl.textContent = groupName
    if (wechatPage && document.body.contains(wechatPage)) {
      const content = wechatPage.querySelector('#wechat-content')
      const activeTab = wechatPage.querySelector('.wechat-tab.active')?.dataset.tab
      if (content && activeTab === 'chats') await loadChatList(wechatPage, content)
      if (content && activeTab === 'contacts') await loadContacts(wechatPage, content)
    }
    close()
  })
}

function buildContactGroupOptionHTML(group, active) {
  return `
    <button class="contact-group-option${active ? ' active' : ''}" data-group="${wcEscHtml(group)}" type="button">
      <span>${wcEscHtml(group)}</span>
      <i class="fa fa-check"></i>
    </button>
  `
}


// ===== 添加好友弹窗 =====
async function showAddFriendModal(wechatPage) {
  if (!_wechatUid) { window.toast('请先登录'); return }
  const friendIds = await getFriendIds(_wechatUid)
  const allChars = await db.characters.toArray()
  const rawCandidates = allChars.filter(c =>
    (c.type === 'char' || c.type === 'npc') && !friendIds.includes(c.id)
  )
  const candidates = (await Promise.all(rawCandidates.map(c => getWechatDisplayCharacter(c.id)))).filter(Boolean)
  const sheet = wcMakeSheet(buildAddFriendHTML(candidates))
  bindAddFriendTabs(sheet)
  bindAddFriendSearch(sheet, wechatPage, friendIds)
  bindAddFriendPick(sheet, wechatPage, friendIds)
  wcShowSheetNoConfirm(sheet)
}

// 添加好友弹窗HTML
function buildAddFriendHTML(candidates) {
  return `
    <div class="sheet-handle"></div>
    <div class="sheet-title">添加好友</div>
    <div class="af-tabs">
      <button class="af-tab active" data-pane="search">搜索微信号</button>
      <button class="af-tab" data-pane="pick">导入角色</button>
    </div>
    <div class="af-pane af-pane-search">
      <div style="padding:12px 16px 4px">
        <input class="input-field" id="af-account-input" placeholder="请输入对方微信号">
      </div>
      <div class="af-search-result" id="af-search-result"></div>
      <div class="sheet-actions">
        <button class="btn-pill btn-full" id="btn-af-search">搜索</button>
      </div>
    </div>
    <div class="af-pane af-pane-pick" style="display:none">
      <div class="af-pick-list" id="af-pick-list">
        ${candidates.length === 0
          ? '<div class="list-empty" style="padding:24px 0">已经把所有角色都加为好友啦</div>'
          : candidates.map(c => buildAfCandidateRowHTML(c)).join('')}
      </div>
      <div class="sheet-actions">
        <button class="btn-pill btn-full" id="btn-af-pick-confirm">确认添加（<span id="af-pick-count">0</span>人）</button>
      </div>
    </div>
  `
}

// 候选角色行HTML
function buildAfCandidateRowHTML(c) {
  const avatar = buildCharacterAvatarHTML(c)
  const accountStr = c.identity?.account ? `微信号：${c.identity.account}` : '未设置微信号'
  const displayName = getWechatDisplayName(c)
  const fallbackName = c.nick || c.name || ''
  return `
    <div class="member-select-row af-pick-row" data-id="${c.id}">
      <div class="chat-avatar" style="width:36px;height:36px">${avatar}</div>
      <div class="af-pick-info">
        <span class="af-pick-name">${wcEscHtml(displayName)}${displayName !== fallbackName ? ` <span class="af-pick-nick">${wcEscHtml(fallbackName)}</span>` : ''}</span>
        <span class="af-pick-account">${wcEscHtml(accountStr)}</span>
      </div>
      <i class="fa fa-circle-o member-check"></i>
    </div>
  `
}


// 读取好友id数组
async function getFriendIds(uid) {
  const cfg = await db.config.get(`friends_${uid}`)
  return cfg?.value || []
}

// 写入好友id数组
async function saveFriendIds(uid, ids) {
  await db.config.put({ key: `friends_${uid}`, value: ids })
}

// Tab切换
function bindAddFriendTabs(sheet) {
  sheet.querySelectorAll('.af-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      sheet.querySelectorAll('.af-tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      const pane = tab.dataset.pane
      sheet.querySelector('.af-pane-search').style.display = pane === 'search' ? '' : 'none'
      sheet.querySelector('.af-pane-pick').style.display = pane === 'pick' ? '' : 'none'
    })
  })
}


// 搜索微信号事件
function bindAddFriendSearch(sheet, wechatPage, friendIds) {
  const input = sheet.querySelector('#af-account-input')
  const btn = sheet.querySelector('#btn-af-search')
  const resultEl = sheet.querySelector('#af-search-result')
  const doSearch = async () => {
    const account = (input.value || '').trim()
    if (!account) { resultEl.innerHTML = ''; window.toast('请输入微信号'); return }
    btn.disabled = true
    btn.textContent = '搜索中...'
    const all = await db.characters.toArray()
    const matched = all.find(c => c.identity?.account === account)
    if (!matched) {
      try {
        if (!window.WanWanOnline) throw new Error('联机模块未加载')
        const profile = await window.WanWanOnline.searchUser(account)
        resultEl.innerHTML = renderOnlineSearchHit(profile, false)
        resultEl.querySelector('#af-online-add-btn')?.addEventListener('click', () => {
          doAfAddOnline(sheet, wechatPage, profile)
        })
      } catch (err) {
        resultEl.innerHTML = `<div class="af-search-empty">${wcEscHtml(err.message || '未找到该微信号')}</div>`
      } finally {
        btn.disabled = false
        btn.textContent = '搜索'
      }
      return
    }
    if (matched.type !== 'char' && matched.type !== 'npc' && matched.type !== 'online_friend') {
      resultEl.innerHTML = '<div class="af-search-empty">只能添加角色或联机用户为好友</div>'
      btn.disabled = false
      btn.textContent = '搜索'
      return
    }
    const displayMatched = await getWechatDisplayCharacter(matched.id)
    resultEl.innerHTML = renderAfSearchHit(displayMatched || matched, friendIds.includes(matched.id))
    const addBtn = resultEl.querySelector('#af-add-btn')
    if (addBtn) addBtn.addEventListener('click', () => doAfAddOne(sheet, wechatPage, matched.id))
    btn.disabled = false
    btn.textContent = '搜索'
  }
  btn.addEventListener('click', doSearch)
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doSearch() } })
}

function renderOnlineSearchHit(profile, isFriend) {
  const name = profile?.name || profile?.nick || profile?.wxAccount || '联机用户'
  const avatar = profile?.avatar
    ? `<img src="${wcEscHtml(profile.avatar)}" alt="${wcEscHtml(name)}">`
    : buildWechatInitialAvatarHTML(name)
  return `
    <div class="af-hit-card">
      <div class="chat-avatar" style="width:48px;height:48px">${avatar}</div>
      <div class="af-hit-info">
        <span class="af-hit-name">${wcEscHtml(name)} <span class="online-friend-badge">联机</span></span>
        <span class="af-hit-account">微信号：${wcEscHtml(profile?.wxAccount || '')}</span>
      </div>
      ${isFriend
        ? '<button class="btn-pill af-add-btn af-add-btn-disabled" disabled>已是好友</button>'
        : '<button class="btn-pill af-add-btn" id="af-online-add-btn">创建联机</button>'}
    </div>`
}

async function doAfAddOnline(sheet, wechatPage, profile) {
  const btn = sheet.querySelector('#af-online-add-btn')
  if (btn) {
    btn.disabled = true
    btn.textContent = '创建中...'
  }
  try {
    await window.WanWanOnline.addFriend(profile)
    const friend = await getOrCreateOnlineFriend(profile)
    const ids = await getFriendIds(_wechatUid)
    if (!ids.includes(friend.id)) {
      ids.push(friend.id)
      await saveFriendIds(_wechatUid, ids)
    }
    await ensurePrivateChatRecord(friend.id)
    window.toast('联机已创建')
    closeWcSheet(sheet)
    loadWechatTab(wechatPage, 'chats')
    wechatPage.querySelectorAll('.wechat-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.tab === 'chats')
    )
  } catch (err) {
    window.toast(err.message || '创建联机失败')
    if (btn) {
      btn.disabled = false
      btn.textContent = '创建联机'
    }
  }
}


// 搜索命中结果HTML
function renderAfSearchHit(c, isFriend) {
  const avatar = buildCharacterAvatarHTML(c)
  const displayName = getWechatDisplayName(c)
  const fallbackName = c.nick || c.name || ''
  return `
    <div class="af-hit-card">
      <div class="chat-avatar" style="width:48px;height:48px">${avatar}</div>
      <div class="af-hit-info">
        <span class="af-hit-name">${wcEscHtml(displayName)}${displayName !== fallbackName ? `（${wcEscHtml(fallbackName)}）` : ''}</span>
        <span class="af-hit-account">微信号：${wcEscHtml(c.identity?.account || '')}</span>
      </div>
      ${isFriend
        ? '<button class="btn-pill af-add-btn af-add-btn-disabled" disabled>已是好友</button>'
        : '<button class="btn-pill af-add-btn" id="af-add-btn">加为好友</button>'}
    </div>
  `
}

// 单个添加
async function doAfAddOne(sheet, wechatPage, charId) {
  const ids = await getFriendIds(_wechatUid)
  if (ids.includes(charId)) { window.toast('已是好友'); return }
  ids.push(charId)
  await saveFriendIds(_wechatUid, ids)
  window.toast('已添加好友')
  closeWcSheet(sheet)
  switchToContactsTab(wechatPage)
}

// 切到通讯录Tab并刷新
function switchToContactsTab(wechatPage) {
  loadWechatTab(wechatPage, 'contacts')
  wechatPage.querySelectorAll('.wechat-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === 'contacts')
  )
}


// 从已有角色勾选
function bindAddFriendPick(sheet, wechatPage, friendIds) {
  const selected = new Set()
  const countEl = sheet.querySelector('#af-pick-count')
  sheet.querySelectorAll('.af-pick-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = parseInt(row.dataset.id)
      const checkEl = row.querySelector('.member-check')
      if (selected.has(id)) {
        selected.delete(id)
        checkEl.className = 'fa fa-circle-o member-check'
      } else {
        selected.add(id)
        checkEl.className = 'fa fa-check-circle member-check'
      }
      if (countEl) countEl.textContent = selected.size
    })
  })
  sheet.querySelector('#btn-af-pick-confirm').addEventListener('click', async () => {
    if (selected.size === 0) { window.toast('请至少选择一位'); return }
    const merged = [...new Set([...friendIds, ...selected])]
    await saveFriendIds(_wechatUid, merged)
    window.toast(`已添加 ${selected.size} 位好友`)
    closeWcSheet(sheet)
    switchToContactsTab(wechatPage)
  })
}


// ===== Tab3：发现 =====
function loadDiscover(page, container) {
  container.innerHTML = `
    <div class="discover-menu">
      <div class="discover-group">
        <div class="discover-row" id="discover-moments">
          <div class="discover-icon"><svg viewBox="0 0 1024 1024" width="22" height="22" fill="currentColor"><path d="M541.76 311.637L283.947 54.72c-9.856 4.907-19.542 10.048-28.971 15.51-37.973 21.738-73.75 48.597-106.07 80.789-13.973 13.845-26.666 28.373-38.506 43.221-29.12 36.523-52.523 76.096-70.165 117.483 0 0 485.973-2.56 501.525-0.086zM391.723 348.16H27.093c-3.52 10.197-6.634 20.715-9.536 31.296C6.187 421.504 0 465.686 0 511.36c0 19.52 1.216 38.741 3.435 57.643 5.248 46.378 16.853 90.773 33.813 132.416 0 0 341.717-344.171 354.475-353.259zM970.24 282.432c-4.843-9.664-10.005-19.328-15.488-28.821-21.888-37.718-48.768-73.408-81.173-105.622-13.846-13.781-28.374-26.56-43.35-38.378-36.672-28.992-76.33-52.331-117.866-69.867 0 0 2.581 484.139 0 499.563L970.24 282.432zM676.565 390.336V27.072c-10.304-3.477-20.864-6.656-31.445-9.6C602.965 6.208 558.592 0 512.725 0c-19.605 0-38.869 1.216-57.877 3.413-46.485 5.248-91.05 16.854-132.97 33.643 0 0 345.407 340.608 354.687 353.28zM311.147 482.09L53.419 739.009c4.778 9.835 10.048 19.37 15.488 28.885 21.781 37.782 48.746 73.472 81.173 105.707 13.824 13.803 28.373 26.475 43.35 38.379 36.671 29.056 76.245 52.288 117.866 69.802 0-0.021-2.645-484.16-0.15-499.69zM479.744 714.283L737.621 971.2a612.547 612.547 0 0 0 28.992-15.51c37.782-21.695 73.536-48.49 106.006-80.831 13.781-13.76 26.538-28.203 38.485-43.158 29.056-36.544 52.523-75.989 70.101-117.461-0.042 0-485.888 2.645-501.461 0.043zM1020.544 455.19c-5.312-46.315-16.832-90.753-33.77-132.46 0 0-341.782 344.15-354.56 353.345h364.629a553.476 553.476 0 0 0 9.493-31.339c11.435-42.09 17.664-86.144 17.664-131.84 0-19.541-1.259-38.784-3.456-57.707zM347.456 633.6v363.307c10.347 3.498 20.864 6.656 31.424 9.493 42.219 11.456 86.528 17.6 132.395 17.6 19.541 0 38.848-1.216 57.77-3.435 46.55-5.269 91.051-16.725 132.907-33.6 0.064 0-345.301-340.565-354.496-353.365z"/></svg></div>
          <span class="discover-label">朋友圈</span>
          <i class="fa fa-angle-right discover-arrow"></i>
        </div>
      </div>
      ${isWechatRolePhoneMode(page) ? '' : `
      <div class="discover-group">
        <div class="discover-row" id="discover-channels">
          <div class="discover-icon"><svg viewBox="0 0 1024 1024" width="22" height="22" fill="currentColor"><path d="M361.472 59.904H72.192C32.256 59.904 0 92.16 0 132.096v289.28c0 39.936 32.256 72.192 72.192 72.192h289.28c39.936 0 72.192-32.256 72.192-72.192V132.096c0-39.936-32.256-72.192-72.192-72.192zM361.472 590.336H72.192c-39.936 0-72.192 32.256-72.192 72.192v289.28c0 39.936 32.256 72.192 72.192 72.192h289.28c39.936 0 72.192-32.256 72.192-72.192v-289.28c0-39.936-32.256-72.192-72.192-72.192zM891.904 590.336h-289.28c-39.936 0-72.192 32.256-72.192 72.192v289.28c0 39.936 32.256 72.192 72.192 72.192h289.28c39.936 0 72.192-32.256 72.192-72.192v-289.28c0-39.936-32.256-72.192-72.192-72.192zM1002.496 225.792L798.208 21.504c-28.672-28.16-74.24-28.16-102.4 0L491.52 225.792c-28.16 28.672-28.16 74.24 0 102.4l204.288 204.288c28.672 28.16 74.24 28.16 102.4 0l204.8-204.288c28.16-28.672 28.16-74.24-0.512-102.4z"/></svg></div>
          <span class="discover-label">我的图库</span>
          <i class="fa fa-angle-right discover-arrow"></i>
        </div>
      </div>
      `}
    </div>
  `
  container.querySelector('#discover-moments').addEventListener('click', () => {
    loadMoments(page)
  })
  container.querySelector('#discover-channels')?.addEventListener('click', () => {
    window.toast && window.toast('我的图库功能暂未开放')
  })
}

// ===== 朋友圈 =====
async function loadMoments(page) {
  if (isWechatRolePhoneMode(page)) {
    await loadWechatRolePhoneMoments(page)
    return
  }
  const momentsPage = ensureWechatMainMomentsPage(page)
  openReusableWechatMomentsPage(momentsPage)
  await refreshWechatMoments(momentsPage, page, { mode: 'self' })
}

async function loadWechatRolePhoneMoments(page) {
  const session = _wechatRolePhoneSession
  if (!session?.ownerUid || !session?.charId) return
  const momentsPage = ensureWechatRolePhoneMomentsPage(page)
  openReusableWechatMomentsPage(momentsPage)
  await refreshWechatMoments(momentsPage, page, {
    mode: 'role-phone',
    ownerUid: session.ownerUid,
    charId: session.charId
  })
}

function buildMomentsCameraIcon() {
  return `
    <svg class="moments-camera-icon" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M10.7 8.2 12.4 5h7.2l1.7 3.2h4.2c1.4 0 2.5 1.1 2.5 2.5v12.8c0 1.4-1.1 2.5-2.5 2.5h-19C5.1 26 4 24.9 4 23.5V10.7c0-1.4 1.1-2.5 2.5-2.5h4.2Zm5.3 14.1a5.4 5.4 0 1 0 0-10.8 5.4 5.4 0 0 0 0 10.8Zm0-2.1a3.3 3.3 0 1 1 0-6.6 3.3 3.3 0 0 1 0 6.6Z"/>
    </svg>
  `
}


function applyMomentsCover(container, coverImage) {
  const cover = container.querySelector('#moments-cover')
  if (!cover) return
  cover.style.backgroundImage = coverImage ? `url(${JSON.stringify(coverImage)})` : ''
}

function getWechatMomentsScrollTop(momentsPage) {
  const scroll = momentsPage?.querySelector('.moments-scroll')
  return scroll ? scroll.scrollTop : 0
}

function setWechatMomentsScrollTop(momentsPage, scrollTop) {
  const scroll = momentsPage?.querySelector('.moments-scroll')
  if (!scroll) return
  scroll.scrollTop = Number.isFinite(scrollTop) ? scrollTop : 0
}

function updateWechatMomentsState(momentsPage, patch = {}) {
  const prev = momentsPage?._wechatMomentsState || {}
  const next = { ...prev, ...patch }
  if (patch.listHTML === undefined && prev.listHTML !== undefined) next.listHTML = prev.listHTML
  if (patch.pinnedHTML === undefined && prev.pinnedHTML !== undefined) next.pinnedHTML = prev.pinnedHTML
  momentsPage._wechatMomentsState = next
  return next
}

function renderCachedWechatMoments(momentsPage) {
  const state = momentsPage?._wechatMomentsState
  if (!momentsPage || !state) return false
  applyWechatMomentsProfileState(momentsPage, state)
  const list = momentsPage.querySelector('#moments-list')
  if (list && state.listHTML !== undefined) list.innerHTML = state.listHTML
  const pinned = momentsPage.querySelector('#moments-pinned')
  if (pinned && state.pinnedHTML !== undefined) {
    pinned.innerHTML = state.pinnedHTML
    pinned.style.display = state.pinnedHTML ? '' : 'none'
  }
  setMomentsCharacterPublishing(momentsPage, !!state.isPublishing)
  setWechatMomentsScrollTop(momentsPage, state.scrollTop || 0)
  return true
}

function buildWechatMainMomentsPageHTML(cachedListHTML = '') {
  return `
    <div class="page-header moments-header">
      <button class="header-back" id="btn-moments-back" aria-label="返回">
        <i class="fa fa-angle-left"></i>
      </button>
      <span class="header-title">Moments</span>
      <button class="moments-nav-btn" id="btn-post-moment-top" aria-label="发布动态">
        ${buildMomentsCameraIcon()}
      </button>
    </div>
    <div class="moments-scroll">
      <div class="moments-page">
        <div class="moments-hero">
          <button class="moments-cover" id="moments-cover" type="button" aria-label="更换朋友圈背景"></button>
          <div class="moments-profile">
            <button class="moments-profile-avatar" id="btn-generate-character-moment" type="button" aria-label="选择角色发布动态"></button>
            <div class="moments-profile-name" id="moments-profile-name"></div>
            <div class="moments-profile-account" id="moments-profile-account"></div>
            <div class="moments-profile-bio" id="moments-profile-bio" style="display:none"></div>
            <div class="moments-pinned" id="moments-pinned"></div>
            <div class="moments-ai-loading" id="moments-ai-loading" hidden>
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
        <div class="moments-list" id="moments-list">
          ${cachedListHTML || '<div class="list-loading"><i class="fa fa-spinner fa-spin"></i></div>'}
        </div>
      </div>
    </div>
  `
}

function ensureWechatMainMomentsPage(wechatPage) {
  let momentsPage = wechatPage?._wechatMomentsPageEl || document.getElementById('wechat-moments-page')
  if (momentsPage) return momentsPage
  const cachedList = wechatPage?._wechatMomentsListHTML
  momentsPage = document.createElement('div')
  momentsPage.id = 'wechat-moments-page'
  momentsPage.className = 'full-page wechat-moments-page'
  momentsPage.classList.add('wechat-theme-moments')
  momentsPage.innerHTML = buildWechatMainMomentsPageHTML(cachedList || '')
  momentsPage._wechatPage = wechatPage
  if (wechatPage) wechatPage._wechatMomentsPageEl = momentsPage
  updateWechatMomentsState(momentsPage, {
    listHTML: cachedList,
    scrollTop: 0,
    mode: 'self'
  })
  bindWechatMainMomentsPage(momentsPage, wechatPage)
  renderCachedWechatMoments(momentsPage)
  return momentsPage
}

function bindWechatMainMomentsPage(momentsPage, wechatPage) {
  if (momentsPage.dataset.momentsPageBound === '1') return
  momentsPage.dataset.momentsPageBound = '1'
  momentsPage.querySelector('#btn-post-moment-top')?.addEventListener('click', () => openPostMomentPage(momentsPage, momentsPage._wechatPage || wechatPage))
  momentsPage.querySelector('#btn-generate-character-moment')?.addEventListener('click', () => showCharacterMomentPicker(momentsPage, momentsPage._wechatPage || wechatPage))
  momentsPage.querySelector('#btn-moments-back')?.addEventListener('click', () => closeReusableWechatMomentsPage(momentsPage))
  momentsPage.querySelector('#moments-cover')?.addEventListener('click', () => showMomentsCoverPicker(momentsPage))
  momentsPage.querySelector('.moments-scroll')?.addEventListener('scroll', () => {
    updateWechatMomentsState(momentsPage, { scrollTop: getWechatMomentsScrollTop(momentsPage) })
  }, { passive: true })
}

function ensureWechatContactMomentsPage(wechatPage, charId, pageId) {
  if (wechatPage && !wechatPage._wechatContactMomentsPages) wechatPage._wechatContactMomentsPages = {}
  let momentsPage = wechatPage?._wechatContactMomentsPages?.[charId] || document.getElementById(pageId)
  if (momentsPage) return momentsPage
  const cachedList = wechatPage?._wechatContactMomentsListHTML?.[charId]
  momentsPage = document.createElement('div')
  momentsPage.id = pageId
  momentsPage.className = 'full-page wechat-moments-page wechat-contact-moments-page'
  momentsPage.classList.add('wechat-theme-moments')
  if (isWechatRolePhoneMode(wechatPage)) {
    momentsPage.classList.add('wechat-role-phone-page')
    momentsPage.dataset.wechatRolePhone = '1'
  }
  momentsPage.dataset.momentsCharId = String(charId)
  momentsPage.innerHTML = buildWechatContactMomentsPageHTML({ id: charId, identity: {} }, {}, cachedList)
  momentsPage._wechatPage = wechatPage
  if (wechatPage) wechatPage._wechatContactMomentsPages[charId] = momentsPage
  updateWechatMomentsState(momentsPage, {
    listHTML: cachedList,
    scrollTop: 0,
    mode: 'contact',
    charId
  })
  bindWechatContactMomentsPage(momentsPage, charId, true)
  renderCachedWechatMoments(momentsPage)
  return momentsPage
}

function ensureWechatRolePhoneMomentsPage(wechatPage) {
  const session = _wechatRolePhoneSession
  const pageId = 'wechat-role-phone-moments-page'
  let momentsPage = wechatPage?._wechatRolePhoneMomentsPageEl || document.getElementById(pageId)
  if (momentsPage) return momentsPage
  const cachedList = wechatPage?._wechatRolePhoneMomentsListHTML
  momentsPage = document.createElement('div')
  momentsPage.id = pageId
  momentsPage.className = 'full-page wechat-moments-page wechat-contact-moments-page'
  momentsPage.classList.add('wechat-role-phone-page')
  momentsPage.classList.add('wechat-theme-moments')
  momentsPage.dataset.wechatRolePhone = '1'
  if (session?.charId) momentsPage.dataset.momentsCharId = String(session.charId)
  momentsPage.innerHTML = buildWechatContactMomentsPageHTML({ id: session?.charId, identity: {} }, {}, cachedList)
  momentsPage.querySelector('#btn-contact-moments-edit')?.remove()
  momentsPage._wechatPage = wechatPage
  if (wechatPage) wechatPage._wechatRolePhoneMomentsPageEl = momentsPage
  updateWechatMomentsState(momentsPage, {
    listHTML: cachedList,
    scrollTop: 0,
    mode: 'role-phone',
    ownerUid: session?.ownerUid,
    charId: session?.charId
  })
  bindWechatContactMomentsPage(momentsPage, session?.charId, false)
  renderCachedWechatMoments(momentsPage)
  return momentsPage
}

function bindWechatContactMomentsPage(momentsPage, charId, allowEdit) {
  if (momentsPage.dataset.momentsPageBound === '1') return
  momentsPage.dataset.momentsPageBound = '1'
  momentsPage.querySelector('#btn-contact-moments-back')?.addEventListener('click', () => closeReusableWechatMomentsPage(momentsPage))
  if (allowEdit) {
    momentsPage.querySelector('#btn-contact-moments-edit')?.addEventListener('click', async () => {
      const targetCharId = parseInt(momentsPage.dataset.momentsCharId || charId, 10)
      const char = await getWechatDisplayCharacter(targetCharId)
      if (char) showContactMomentsEditSheet(momentsPage, char)
    })
  }
  momentsPage.querySelector('.moments-scroll')?.addEventListener('scroll', () => {
    updateWechatMomentsState(momentsPage, { scrollTop: getWechatMomentsScrollTop(momentsPage) })
  }, { passive: true })
}

function openReusableWechatMomentsPage(momentsPage) {
  if (!momentsPage) return
  const app = document.getElementById('app')
  if (!app) return
  if (!document.body.contains(momentsPage)) {
    momentsPage.dataset.reusableVisible = '1'
    momentsPage.style.display = ''
    momentsPage.style.pointerEvents = ''
    momentsPage.style.overflow = ''
    window.openPage(momentsPage)
  } else {
    if (momentsPage.parentNode === app) app.appendChild(momentsPage)
    if (momentsPage.dataset.reusableVisible !== '1') {
      momentsPage.dataset.reusableVisible = '1'
      momentsPage.style.display = ''
      momentsPage.style.pointerEvents = ''
      momentsPage.style.overflow = ''
      momentsPage.style.transition = 'none'
      momentsPage.style.transform = 'translateY(100%)'
      requestAnimationFrame(() => {
        momentsPage.style.transition = 'transform 0.3s var(--ease)'
        momentsPage.style.transform = 'translateY(0)'
      })
    }
  }
  renderCachedWechatMoments(momentsPage)
}

function closeReusableWechatMomentsPage(momentsPage) {
  if (!momentsPage || !document.body.contains(momentsPage)) return
  updateWechatMomentsState(momentsPage, { scrollTop: getWechatMomentsScrollTop(momentsPage) })
  momentsPage.dataset.reusableVisible = '0'
  momentsPage.classList.add('is-closing')
  momentsPage.style.pointerEvents = 'none'
  momentsPage.style.overflow = 'hidden'
  momentsPage.style.transition = 'transform 0.3s var(--ease)'
  momentsPage.style.transform = 'translateY(100%)'
  let done = false
  const cleanup = () => {
    if (done) return
    done = true
    momentsPage.removeEventListener('transitionend', cleanup)
    momentsPage.classList.remove('is-closing')
    momentsPage.style.pointerEvents = ''
    momentsPage.style.overflow = ''
    momentsPage.style.transition = ''
    momentsPage.style.transform = ''
    momentsPage.remove()
  }
  momentsPage.addEventListener('transitionend', cleanup)
  setTimeout(cleanup, 350)
}

function applyWechatMomentsProfileState(momentsPage, state = {}) {
  if (!momentsPage) return
  if (state.avatarHTML !== undefined) {
    const avatarEl = momentsPage.querySelector('#btn-generate-character-moment, #moments-profile-avatar')
    if (avatarEl) avatarEl.innerHTML = state.avatarHTML
  }
  const nameEl = momentsPage.querySelector('#moments-profile-name')
  if (nameEl && state.name !== undefined) nameEl.textContent = state.name
  const accountEl = momentsPage.querySelector('#moments-profile-account')
  if (accountEl && state.account !== undefined) accountEl.textContent = `@${state.account || '未设置'}`
  const bioEl = momentsPage.querySelector('#moments-profile-bio, #contact-moments-bio')
  if (bioEl && state.bio !== undefined) {
    bioEl.textContent = state.bio
    bioEl.style.display = state.bio ? '' : 'none'
  }
  if (state.coverImage !== undefined) applyMomentsCover(momentsPage, state.coverImage)
}

async function refreshWechatMoments(momentsPage, wechatPage, options = {}) {
  if (!momentsPage) return
  const token = (momentsPage._wechatMomentsLoadToken || 0) + 1
  momentsPage._wechatMomentsLoadToken = token
  momentsPage._wechatPage = wechatPage || momentsPage._wechatPage
  const statePatch = await buildWechatMomentsProfileState(options)
  if (momentsPage._wechatMomentsLoadToken !== token) return
  if (options.charId !== undefined) momentsPage.dataset.momentsCharId = String(options.charId)
  updateWechatMomentsState(momentsPage, {
    ...statePatch,
    mode: options.mode || momentsPage._wechatMomentsState?.mode,
    ownerUid: options.ownerUid,
    charId: options.charId
  })
  applyWechatMomentsProfileState(momentsPage, momentsPage._wechatMomentsState)
  await renderMomentsList(momentsPage, wechatPage, {
    ownerUid: options.ownerUid,
    charId: options.charId
  })
  if (options.mode === 'role-phone' && wechatPage) {
    wechatPage._wechatRolePhoneMomentsListHTML = momentsPage.querySelector('#moments-list')?.innerHTML || ''
  }
}

async function buildWechatMomentsProfileState(options = {}) {
  if (options.mode === 'self') {
    const coverRow = await db.config.get('momentsCoverImage')
    const coverImage = coverRow?.value || ''
    const profile = await getWechatSelfProfile()
    const name = _wechatUser?.nick || _wechatUser?.name || '我'
    const account = _wechatUser?.identity?.account || ''
    const bio = String(profile?.bio || '').trim()
    const selfAvatar = await getWechatSelfAvatar()
    return {
      coverImage,
      name,
      account,
      bio,
      avatarHTML: buildWechatSelfAvatarHTML(selfAvatar, name)
    }
  }
  const ownerUid = options.ownerUid
  const char = await getWechatDisplayCharacter(options.charId, ownerUid)
  if (!char) return {}
  const profile = options.mode === 'role-phone'
    ? await getWechatContactMomentsProfileForOwner(ownerUid, options.charId)
    : await getWechatContactMomentsProfile(options.charId)
  const name = getWechatDisplayName(char)
  const account = char?.identity?.account || ''
  const avatarUrl = getWechatDisplayAvatar(char)
  return {
    coverImage: profile?.coverImage || '',
    name,
    account,
    bio: String(profile?.bio || '').trim(),
    avatarHTML: avatarUrl ? `<img src="${avatarUrl}" alt="${wcEscHtml(name)}">` : buildWechatInitialAvatarHTML(name)
  }
}

async function showMomentsCoverPicker(momentsPage) {
  window.showImagePicker(async imageUrl => {
    await db.config.put({ key: 'momentsCoverImage', value: imageUrl })
    updateWechatMomentsState(momentsPage, { coverImage: imageUrl })
    applyWechatMomentsProfileState(momentsPage, momentsPage._wechatMomentsState)
    window.toast && window.toast('封面已更新')
  })
}

// 渲染朋友圈列表
async function renderMomentsList(momentsPage, wechatPage, options = {}) {
  const list = momentsPage.querySelector('#moments-list')
  if (!list) return
  const charId = options.charId !== undefined
    ? parseInt(options.charId, 10)
    : parseInt(momentsPage.dataset.momentsCharId || '', 10)
  const filter = Number.isFinite(charId) ? { charId } : {}
  if (options.ownerUid) filter.ownerUid = options.ownerUid
  const mode = momentsPage._wechatMomentsState?.mode || options.mode || 'self'
  if (mode === 'role-phone') {
    filter.phoneSession = {
      ownerUid: options.ownerUid || momentsPage._wechatMomentsState?.ownerUid,
      charId: Number.isFinite(charId) ? charId : momentsPage._wechatMomentsState?.charId
    }
  }
  const html = await buildMomentsListHTML(filter)
  if (wechatPage && mode === 'role-phone') {
    wechatPage._wechatRolePhoneMomentsListHTML = html
  } else if (wechatPage && filter.charId) {
    if (!wechatPage._wechatContactMomentsListHTML) wechatPage._wechatContactMomentsListHTML = {}
    wechatPage._wechatContactMomentsListHTML[filter.charId] = html
  } else if (wechatPage) {
    wechatPage._wechatMomentsListHTML = html
  }
  updateWechatMomentsState(momentsPage, { listHTML: html })
  list.innerHTML = html
  await renderMomentsPinned(momentsPage, filter)
  if (wechatPage) momentsPage._wechatPage = wechatPage
  bindMomentsListActions(momentsPage, wechatPage || momentsPage._wechatPage)
}

async function renderMomentsPinned(momentsPage, filter = {}) {
  const wrap = momentsPage.querySelector('#moments-pinned')
  if (!wrap) return
  const ownerUid = filter.ownerUid || getCurrentMomentsOwnerUid()
  const pinned = await getScopedMoments({
    ownerUid,
    charId: filter.charId || _wechatUid,
    pinned: true,
    limit: 4
  })
  const pinnedHTML = pinned.map(buildPinnedMomentHTML).join('')
  wrap.innerHTML = pinnedHTML
  wrap.style.display = pinned.length ? '' : 'none'
  updateWechatMomentsState(momentsPage, { pinnedHTML })
}

function buildPinnedMomentHTML(m) {
  const imageList = Array.isArray(m.images) ? m.images.map(normalizeMomentImageItem).filter(item => item.src) : []
  const firstImage = imageList[0]?.src || ''
  const content = String(m.content || '').trim()
  const body = firstImage
    ? `<img src="${wcEscHtml(firstImage)}" alt="置顶动态">`
    : `<span>${wcEscHtml(content || '动态')}</span>`
  return `
    <div class="moments-pinned-item${firstImage ? '' : ' moments-pinned-text'}" data-moment-id="${m.id}">
      ${body}
    </div>
  `
}

async function preloadWechatMoments(page) {
  if (!page || !document.body.contains(page)) return
  const html = await buildMomentsListHTML()
  if (!document.body.contains(page)) return
  page._wechatMomentsListHTML = html
}

async function buildMomentsListHTML(filter = {}) {
  const ownerUid = filter.ownerUid || getCurrentMomentsOwnerUid()
  const moments = await getScopedMoments({
    ownerUid,
    charId: filter.charId,
    limit: filter.limit || 50
  })
  // 角色手机模式：合并生成的快照朋友圈（按时间倒序插入真实动态之间）
  const snapshotEntries = filter.phoneSession && window.getPhoneSnapshotMomentEntries
    ? await window.getPhoneSnapshotMomentEntries(filter.phoneSession)
    : []
  if (!moments.length && !snapshotEntries.length) {
    return '<div class="list-empty" style="padding:40px 0">暂无动态</div>'
  }
  const charIds = [...new Set(moments.map(m => m.charId))]
  const chars = await Promise.all(charIds.map(id => getWechatDisplayCharacter(id, ownerUid)))
  const charMap = {}
  chars.forEach(c => { if (c) charMap[c.id] = c })
  const selfAvatar = await getWechatSelfAvatar()
  const selfName = _wechatUser?.nick || _wechatUser?.name || '我'
  const entries = moments.map(m => ({
    ts: m.createdAt || 0,
    html: buildMomentCardHTML(m, charMap[m.charId], selfAvatar, selfName)
  })).concat(snapshotEntries)
  entries.sort((a, b) => b.ts - a.ts)
  return entries.map(entry => entry.html).join('')
}

// 朋友圈单条HTML
function buildMomentCardHTML(m, c, selfAvatar, selfName) {
  const displayName = m.charId === _wechatUid ? selfName : getWechatDisplayName(c)
  const avatarUrl = m.charId === _wechatUid ? selfAvatar : getWechatDisplayAvatar(c)
  const avatar = avatarUrl ? `<img src="${avatarUrl}">` : buildWechatInitialAvatarHTML(displayName)
  const imageList = Array.isArray(m.images) ? m.images.map(normalizeMomentImageItem).filter(item => item.src) : []
  const imgs = imageList.length
    ? `<div class="moment-imgs">${imageList.map((img, index) => `
        <button class="moment-img-btn" type="button" data-src="${wcEscHtml(img.src)}" data-desc="${wcEscHtml(img.desc)}" aria-label="查看图片${index + 1}">
          <img src="${wcEscHtml(img.src)}" alt="图片${index + 1}">
        </button>
      `).join('')}</div>` : ''
  const likes = normalizeMomentLikes(m.likes)
  const comments = normalizeMomentComments(m.comments)
  const social = buildMomentSocialHTML(likes, comments)
  const isLiked = likes.some(like => String(like.uid) === String(_wechatUid))
  const likeText = isLiked ? '取消' : '赞'
  const likeIcon = isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'
  const canPin = String(m.charId) === String(_wechatUid)
  const pinText = m.pinned ? '取消置顶' : '置顶'
  const pinButtonHtml = canPin
    ? `<button type="button" data-moment-action="pin">${pinText}</button>`
    : ''
  const mentionText = normalizeMomentTextValue(m.mentions)
  const mentionHtml = mentionText ? `<div class="moment-mentioned">提到了：${wcEscHtml(mentionText)}</div>` : ''
  const locationText = normalizeMomentTextValue(m.location)
  const visibleGroups = normalizeMomentArrayValue(m.visibilityGroups)
  const visibilityHtml = visibleGroups.length
    ? `<button class="moment-visibility-icon" type="button" data-moment-visibility="${wcEscHtml(visibleGroups.join('、'))}" aria-label="谁可以看"><i class="fa-solid fa-layer-group"></i></button>`
    : ''
  const metaHtml = `${wcFormatTime(m.createdAt)}${locationText ? `<span class="moment-location-inline">${wcEscHtml(locationText)}</span>` : ''}${visibilityHtml}`
  return `
    <div class="moment-card" data-moment-id="${m.id}">
      <div class="moment-avatar">${avatar}</div>
      <div class="moment-body">
        <div class="moment-card-menu" aria-hidden="true">
          <button type="button" data-moment-action="copy">复制</button>
          <button type="button" data-moment-action="generate-comment">生成评论</button>
          <button type="button" data-moment-action="favorite">收藏</button>
          ${pinButtonHtml}
          <button type="button" class="moment-card-menu-danger" data-moment-action="delete">删除</button>
        </div>
        <div class="moment-name">${wcEscHtml(displayName)}</div>
        <div class="moment-text">${wcEscHtml(m.content || '')}</div>
        ${imgs}
        ${mentionHtml}
        <div class="moment-meta-row">
          <div class="moment-meta">${metaHtml}</div>
          <div class="moment-action-wrap">
            <button class="moment-more-btn" type="button" aria-label="点赞或评论" data-moment-action="toggle-menu">
              <span></span><span></span>
            </button>
            <div class="moment-action-menu" aria-hidden="true">
              <button type="button" data-moment-action="like">
                <i class="${likeIcon}"></i><span>${likeText}</span>
              </button>
              <div class="moment-action-divider"></div>
              <button type="button" data-moment-action="comment">
                <i class="fa-regular fa-message"></i><span>评论</span>
              </button>
            </div>
          </div>
        </div>
        ${social}
      </div>
    </div>
  `
}

function normalizeMomentImageItem(item) {
  if (!item || typeof item !== 'object') return { src: '', desc: '' }
  return {
    src: String(item.src || item.url || item.image || ''),
    desc: String(item.desc || item.description || '')
  }
}

function normalizeMomentTextValue(value) {
  if (Array.isArray(value)) return value.map(item => String(item || '').trim()).filter(Boolean).join('、')
  return String(value || '').trim()
}

function normalizeMomentArrayValue(value) {
  return Array.isArray(value) ? value.map(item => String(item || '').trim()).filter(Boolean) : []
}

function normalizeMomentLikes(value) {
  return Array.isArray(value)
    ? value.filter(item => item && item.uid !== undefined).map(item => ({
      uid: item.uid,
      name: item.name || '我',
      createdAt: item.createdAt || Date.now()
    }))
    : []
}

function normalizeMomentComments(value) {
  return Array.isArray(value)
    ? value.filter(item => item && String(item.text || '').trim()).map(item => ({
      id: item.id || `${item.uid || 'u'}_${item.createdAt || Date.now()}`,
      uid: item.uid,
      name: item.name || '我',
      replyToId: item.replyToId || '',
      replyToUid: item.replyToUid,
      replyToName: item.replyToName || '',
      text: String(item.text || '').trim(),
      createdAt: item.createdAt || Date.now()
    }))
    : []
}

function buildMomentSocialHTML(likes, comments) {
  if (!likes.length && !comments.length) return ''
  const likesHtml = likes.length
    ? `<div class="moment-likes"><i class="fa-solid fa-heart"></i>${likes.map(like => wcEscHtml(like.name)).join('、')}</div>`
    : ''
  const commentsHtml = comments.length
    ? `<div class="moment-comments">${comments.map(comment => `
        <div class="moment-comment-row" data-moment-comment-id="${wcEscHtml(comment.id)}">
          <button class="moment-comment" type="button" aria-label="操作评论">
            <span>${wcEscHtml(comment.name)}</span>${comment.replyToName ? `<span class="moment-comment-reply-word"> 回复 </span><span>${wcEscHtml(comment.replyToName)}</span>` : ''}<span>：</span>${wcEscHtml(comment.text)}
          </button>
          <div class="moment-comment-menu" aria-hidden="true">
            <button type="button" data-moment-comment-action="reply">回复</button>
            <button type="button" class="moment-card-menu-danger" data-moment-comment-action="delete">删除</button>
          </div>
        </div>
      `).join('')}</div>`
    : ''
  return `<div class="moment-social">${likesHtml}${commentsHtml}</div>`
}

function bindMomentsListActions(momentsPage, wechatPage) {
  const list = momentsPage.querySelector('#moments-list')
  if (!list || list.dataset.momentActionsBound === '1') return
  list.dataset.momentActionsBound = '1'
  let longPressTimer = null
  let longPressStart = null
  const clearLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    longPressStart = null
  }

  list.addEventListener('pointerdown', e => {
    if (e.button !== undefined && e.button !== 0) return
    if (e.target.closest('[data-moment-action]')) return
    if (e.target.closest('[data-moment-comment-action]')) return
    if (e.target.closest('.moment-img-btn')) return
    if (e.target.closest('.moment-visibility-icon')) return
    if (e.target.closest('.moment-comment')) return
    const card = e.target.closest('.moment-card')
    if (!card || !list.contains(card)) return
    if (card.dataset.phoneSnapshot === '1') return
    clearLongPress()
    longPressStart = { x: e.clientX, y: e.clientY, card }
    longPressTimer = setTimeout(() => {
      closeMomentActionMenus(momentsPage)
      card.classList.add('show-card-menu')
      longPressTimer = null
    }, 520)
  })

  list.addEventListener('pointermove', e => {
    if (!longPressStart) return
    const dx = Math.abs(e.clientX - longPressStart.x)
    const dy = Math.abs(e.clientY - longPressStart.y)
    if (dx > 8 || dy > 8) clearLongPress()
  })
  list.addEventListener('pointerup', clearLongPress)
  list.addEventListener('pointercancel', clearLongPress)
  list.addEventListener('pointerleave', clearLongPress)

  list.addEventListener('click', async e => {
    const visibilityBtn = e.target.closest('.moment-visibility-icon')
    if (visibilityBtn && list.contains(visibilityBtn)) {
      e.stopPropagation()
      clearLongPress()
      closeMomentActionMenus(momentsPage)
      showMomentVisibilityViewModal(visibilityBtn.dataset.momentVisibility || '')
      return
    }
    const imageBtn = e.target.closest('.moment-img-btn')
    if (imageBtn && list.contains(imageBtn)) {
      e.stopPropagation()
      clearLongPress()
      closeMomentActionMenus(momentsPage)
      showMomentImageViewModal(imageBtn.dataset.src || '', imageBtn.dataset.desc || '')
      return
    }
    const card = e.target.closest('.moment-card')
    if (!card || !list.contains(card)) return
    const commentActionBtn = e.target.closest('[data-moment-comment-action]')
    if (commentActionBtn && list.contains(commentActionBtn)) {
      e.stopPropagation()
      clearLongPress()
      const momentId = parseInt(card.dataset.momentId, 10)
      const row = commentActionBtn.closest('.moment-comment-row')
      const commentId = row?.dataset.momentCommentId || ''
      closeMomentActionMenus(momentsPage)
      if (!momentId || !commentId) return
      if (commentActionBtn.dataset.momentCommentAction === 'reply') {
        const comment = await getMomentComment(momentId, commentId)
        if (comment) showMomentCommentSheet(momentId, momentsPage, wechatPage, { replyTo: comment })
      } else if (commentActionBtn.dataset.momentCommentAction === 'delete') {
        await deleteMomentComment(momentId, commentId, momentsPage, wechatPage)
      }
      return
    }
    const commentBtn = e.target.closest('.moment-comment')
    if (commentBtn && list.contains(commentBtn)) {
      e.stopPropagation()
      clearLongPress()
      const row = commentBtn.closest('.moment-comment-row')
      const wasOpen = row?.classList.contains('show-comment-menu')
      closeMomentActionMenus(momentsPage)
      if (row && !wasOpen) row.classList.add('show-comment-menu')
      return
    }
    const actionBtn = e.target.closest('[data-moment-action]')
    if (!actionBtn) {
      closeMomentActionMenus(momentsPage)
      return
    }
    if (!list.contains(actionBtn)) return
    e.stopPropagation()
    const momentId = parseInt(card?.dataset.momentId, 10)
    const action = actionBtn.dataset.momentAction
    if (!card || !momentId) return

    if (action === 'toggle-menu') {
      const wasOpen = card.classList.contains('show-actions')
      closeMomentActionMenus(momentsPage)
      if (!wasOpen) card.classList.add('show-actions')
      return
    }

    closeMomentActionMenus(momentsPage)
    if (action === 'like') {
      await toggleMomentLike(momentId, momentsPage, wechatPage)
    } else if (action === 'comment') {
      showMomentCommentSheet(momentId, momentsPage, wechatPage)
    } else if (action === 'pin') {
      await toggleMomentPinned(momentId, momentsPage, wechatPage)
    } else if (action === 'generate-comment') {
      window.toast && window.toast('正在生成评论…')
      generateMomentComments(momentId, momentsPage, wechatPage)
    } else if (action === 'copy' || action === 'favorite') {
      return
    } else if (action === 'delete') {
      await deleteMoment(momentId, momentsPage, wechatPage)
    }
  })

  if (!momentsPage.dataset.momentOutsideBound) {
    momentsPage.dataset.momentOutsideBound = '1'
    momentsPage.addEventListener('click', e => {
      if (!e.target.closest('.moment-card')) {
        closeMomentActionMenus(momentsPage)
      }
    })
    list.addEventListener('contextmenu', e => {
      if (e.target.closest('.moment-card')) e.preventDefault()
    })
    list.addEventListener('selectstart', e => {
      if (e.target.closest('.moment-card')) e.preventDefault()
    })
  }
}

function showMomentVisibilityViewModal(groupsText) {
  const groups = String(groupsText || '').split('、').map(item => item.trim()).filter(Boolean)
  const sheet = wcMakeSheet(`
    <div class="sheet-title">谁可以看</div>
    <div class="moment-visible-group-list">
      ${groups.length ? groups.map(group => `
        <div class="moment-visible-group-row">
          <i class="fa-solid fa-layer-group"></i>
          <span>${wcEscHtml(group)}</span>
        </div>
      `).join('') : '<div class="contact-group-empty">暂无分组</div>'}
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="moment-visibility-view-ok">我知道了</button>
    </div>
  `)
  const overlay = wcAttachSheet(sheet)
  const close = () => closeWcSheetCore(overlay, sheet)
  overlay.addEventListener('click', close)
  sheet.querySelector('#moment-visibility-view-ok').addEventListener('click', close)
}

function isGeneratedAssistantImageDesc(desc, options) {
  return String(options?.role || '') === 'assistant' && /\[SHOT:/i.test(String(desc || ''))
}

function isWechatGeneratedPlaceholderSrc(src) {
  return /^img\/blank_img\d+\.jpg$/i.test(String(src || '').trim())
}

function getImageDownloadFilename() {
  const stamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
  return `wanwan-image-${stamp}.png`
}

function triggerImageDownload(href, filename) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function imageMimeFromSrc(src) {
  const m = String(src || '').match(/^data:(image\/[^;,]+)/i)
  return m ? m[1] : 'image/png'
}

async function imageBlobFromSrc(src) {
  const imageSrc = String(src || '').trim()
  if (!imageSrc) return null
  try {
    const res = await fetch(imageSrc)
    if (!res.ok) return null
    const blob = await res.blob()
    return blob && blob.size ? blob : null
  } catch (_) {
    return null
  }
}

async function shareImageFile(blob, filename) {
  if (!blob || typeof File !== 'function' || !navigator.share) return false
  const file = new File([blob], filename, { type: blob.type || 'image/png' })
  if (navigator.canShare && !navigator.canShare({ files: [file] })) return false
  await navigator.share({ files: [file], title: '保存图片' })
  return true
}

async function saveImageToDevice(src) {
  const imageSrc = String(src || '').trim()
  if (!imageSrc || isWechatGeneratedPlaceholderSrc(imageSrc)) {
    window.toast?.('图片生成完成后才能保存')
    return false
  }
  const filename = getImageDownloadFilename()
  const blob = await imageBlobFromSrc(imageSrc)
  if (blob) {
    try {
      if (await shareImageFile(blob, filename)) return true
    } catch (e) {
      if (e?.name === 'AbortError') return false
      console.warn('[ImageGen] share image failed:', e)
    }
    const objectUrl = URL.createObjectURL(blob.type ? blob : new Blob([blob], { type: imageMimeFromSrc(imageSrc) }))
    triggerImageDownload(objectUrl, filename)
    setTimeout(() => URL.revokeObjectURL(objectUrl), 30000)
    window.toast?.('已开始保存图片')
    return true
  }
  triggerImageDownload(imageSrc, filename)
  window.toast?.('已打开系统保存')
  return true
}

function showMomentImageViewModal(src, desc, options = {}) {
  const isGenerated = isGeneratedAssistantImageDesc(desc, options)
  const displayDesc = isGenerated ? '' : normalizeImageSupplementDesc(desc)
  const saveDisabled = !src || isWechatGeneratedPlaceholderSrc(src)
  const canRetryImage = isGenerated && saveDisabled && options.msgId
  const generatedImageButtonHtml = canRetryImage
    ? '<i class="fa-solid fa-wand-magic-sparkles"></i>图片生成失败，点击重试'
    : (saveDisabled ? '图片生成中' : '保存图片')
  const sheet = wcMakeSheet(`
    <div class="sheet-title">查看图片</div>
    <div class="moment-image-view">
      ${src ? `<img class="moment-image-view-img" src="${wcEscHtml(src)}" alt="图片">` : ''}
      ${displayDesc ? `<div class="photo-view-desc">${wcEscHtml(displayDesc)}</div>` : ''}
    </div>
    <div class="sheet-actions">
      ${isGenerated ? `<button class="btn-ghost btn-full" id="moment-image-save-phone" type="button" data-msg-id="${wcEscHtml(options.msgId || '')}" ${saveDisabled && !canRetryImage ? 'disabled' : ''}>${generatedImageButtonHtml}</button>` : ''}
      <button class="btn-pill btn-full" id="moment-image-view-ok">我知道了</button>
    </div>
  `)
  const overlay = wcAttachSheet(sheet)
  const close = () => closeWcSheetCore(overlay, sheet)
  overlay.addEventListener('click', close)
  sheet.querySelector('#moment-image-view-ok').addEventListener('click', close)
  sheet.querySelector('#moment-image-save-phone')?.addEventListener('click', async () => {
    if (canRetryImage) {
      const ok = await retryGeneratedImageFromModal(sheet, options.msgId)
      if (ok) close()
      return
    }
    const ok = await saveImageToDevice(src)
    if (ok) close()
  })
}

async function retryGeneratedImageFromModal(sheet, msgId) {
  const btn = sheet.querySelector('#moment-image-save-phone')
  if (!btn || btn.classList.contains('is-loading')) return false
  const id = Number(msgId)
  if (!id) {
    window.toast?.('找不到原图片消息，无法重试')
    return false
  }
  const oldHtml = btn.innerHTML
  btn.classList.add('is-loading')
  btn.disabled = true
  btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 图片生成中'
  try {
    const msg = await db.messages.get(id)
    if (!msg) throw new Error('找不到原图片消息')
    const ok = await maybeGenerateImage(msg, msg.chatId)
    if (!ok) throw new Error('请检查 IMAGE API 设置后重试')
    window.toast?.('图片已生成')
    return true
  } catch (e) {
    window.toast?.('图片生成失败：' + (e.message || '请检查API设置'))
    return false
  } finally {
    btn.classList.remove('is-loading')
    btn.disabled = false
    btn.innerHTML = oldHtml
  }
}

function showRealImageSendModal(options) {
  const src = options?.src || ''
  if (!src) return
  const initialDesc = normalizeImageSupplementDesc(options.initialDesc)
  const sheet = wcMakeSheet(`
    <div class="sheet-title">查看图片</div>
    <div class="moment-image-view real-image-send-view">
      <img class="moment-image-view-img" src="${wcEscHtml(src)}" alt="图片">
      <textarea class="input-field real-image-desc-input" id="real-image-desc-input" rows="3" placeholder="图片重点补充（选填）">${wcEscHtml(initialDesc)}</textarea>
    </div>
    <div class="sheet-actions real-image-send-actions">
      <button class="btn-ghost btn-full" id="real-image-send-cancel" type="button">取消</button>
      <button class="btn-pill btn-full" id="real-image-send-ok" type="button">发送</button>
    </div>
  `)
  const overlay = wcAttachSheet(sheet)
  const close = () => closeWcSheetCore(overlay, sheet)
  overlay.addEventListener('click', close)
  sheet.querySelector('#real-image-send-cancel').addEventListener('click', close)
  sheet.querySelector('#real-image-send-ok').addEventListener('click', async () => {
    const desc = normalizeImageSupplementDesc(sheet.querySelector('#real-image-desc-input')?.value)
    await options.onConfirm?.({ src, desc })
    close()
  })
  setTimeout(() => sheet.querySelector('#real-image-desc-input')?.focus(), 80)
}

function closeMomentActionMenus(momentsPage) {
  momentsPage.querySelectorAll('.moment-card.show-actions').forEach(card => card.classList.remove('show-actions'))
  momentsPage.querySelectorAll('.moment-card.show-card-menu').forEach(card => card.classList.remove('show-card-menu'))
  momentsPage.querySelectorAll('.moment-comment-row.show-comment-menu').forEach(row => row.classList.remove('show-comment-menu'))
}

function getMomentActorName() {
  return _wechatUser?.nick || _wechatUser?.name || '我'
}

async function toggleMomentLike(momentId, momentsPage, wechatPage) {
  if (!_wechatUid) { window.toast && window.toast('请先登录'); return }
  const moment = await db.moments.get(momentId)
  if (!moment) return
  if (!canAccessMomentInCurrentContext(moment)) return
  const likes = normalizeMomentLikes(moment.likes)
  const uid = String(_wechatUid)
  const exists = likes.some(like => String(like.uid) === uid)
  const nextLikes = exists
    ? likes.filter(like => String(like.uid) !== uid)
    : [...likes, { uid: _wechatUid, name: getMomentActorName(), createdAt: Date.now() }]
  await db.moments.update(momentId, { likes: nextLikes })
  await renderMomentsList(momentsPage, wechatPage)
  if (!exists) {
    addRandomFriendLikes(momentId, momentsPage, wechatPage)
  }
}

async function toggleMomentPinned(momentId, momentsPage, wechatPage) {
  const moment = await db.moments.get(momentId)
  if (!moment) return
  if (!canAccessMomentInCurrentContext(moment)) return
  if (String(moment.charId) !== String(_wechatUid)) {
    window.toast && window.toast('只能置顶自己发布的动态')
    return
  }
  if (moment.pinned) {
    await db.moments.update(momentId, { pinned: false })
    await renderMomentsList(momentsPage, wechatPage)
    window.toast && window.toast('已取消置顶')
    return
  }
  const pinnedCount = await getScopedMoments({
    ownerUid: getCurrentMomentsOwnerUid(),
    charId: _wechatUid,
    pinned: true,
    limit: 5
  }).then(items => items.length)
  if (pinnedCount >= 4) {
    showMomentPinnedLimitModal()
    return
  }
  await db.moments.update(momentId, { pinned: true })
  await renderMomentsList(momentsPage, wechatPage)
  window.toast && window.toast('已置顶')
}

function showMomentPinnedLimitModal() {
  const sheet = wcMakeSheet(`
    <div class="sheet-title">置顶数量已达上限</div>
    <div class="moment-pin-limit-text">请取消一个现有置顶后再操作。</div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="moment-pin-limit-ok">我知道了</button>
    </div>
  `)
  const overlay = wcAttachSheet(sheet)
  const close = () => closeWcSheetCore(overlay, sheet)
  overlay.addEventListener('click', close)
  sheet.querySelector('#moment-pin-limit-ok').addEventListener('click', close)
}

async function deleteMoment(momentId, momentsPage, wechatPage) {
  const moment = await db.moments.get(momentId)
  if (!moment || !canAccessMomentInCurrentContext(moment)) return
  await db.moments.delete(momentId)
  await renderMomentsList(momentsPage, wechatPage)
  window.toast && window.toast('动态已删除')
}

function showMomentCommentSheet(momentId, momentsPage, wechatPage, options = {}) {
  if (!_wechatUid) { window.toast && window.toast('请先登录'); return }
  const replyTo = options.replyTo || null
  const sheet = wcMakeSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">${replyTo ? `回复 ${wcEscHtml(replyTo.name || '评论')}` : '评论'}</div>
    <div style="padding:0 16px 8px;display:flex;flex-direction:column;gap:10px">
      <textarea class="input-field" id="moment-comment-text" placeholder="${replyTo ? '写回复...' : '写评论...'}" style="min-height:86px"></textarea>
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-confirm-comment">发送</button>
    </div>
  `)
  wcShowSheet(sheet, async () => {
    const text = convertBracketEmoji(sheet.querySelector('#moment-comment-text').value.trim())
    if (!text) { window.toast && window.toast('请输入评论'); return false }
    const moment = await db.moments.get(momentId)
    if (!moment) return
    if (!canAccessMomentInCurrentContext(moment)) return false
    const comments = normalizeMomentComments(moment.comments)
    comments.push({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      uid: _wechatUid,
      name: getMomentActorName(),
      replyToId: replyTo?.id || '',
      replyToUid: replyTo?.uid,
      replyToName: replyTo?.name || '',
      text,
      createdAt: Date.now()
    })
    await db.moments.update(momentId, { comments })
    await renderMomentsList(momentsPage, wechatPage)
  })
  setTimeout(() => sheet.querySelector('#moment-comment-text')?.focus(), 80)
}

async function getMomentComment(momentId, commentId) {
  const moment = await db.moments.get(momentId)
  if (!moment) return null
  if (!canAccessMomentInCurrentContext(moment)) return null
  const comments = normalizeMomentComments(moment.comments)
  return comments.find(item => String(item.id) === String(commentId)) || null
}

async function deleteMomentComment(momentId, commentId, momentsPage, wechatPage) {
  const moment = await db.moments.get(momentId)
  if (!moment) return
  if (!canAccessMomentInCurrentContext(moment)) return
  const comments = normalizeMomentComments(moment.comments)
  const nextComments = comments.filter(comment => String(comment.id) !== String(commentId))
  if (nextComments.length === comments.length) return
  await db.moments.update(momentId, { comments: nextComments })
  await renderMomentsList(momentsPage, wechatPage)
  window.toast && window.toast('评论已删除')
}


// 发布朋友圈页面
function openPostMomentPage(momentsPage, wechatPage) {
  const old = document.getElementById('wechat-post-moment-page')
  if (old) old.remove()
  const postPage = document.createElement('div')
  postPage.id = 'wechat-post-moment-page'
  postPage.className = 'full-page wechat-post-moment-page'
  postPage._momentDraft = {
    images: [],
    location: '',
    mentions: [],
    mentionIds: [],
    visibility: '公开',
    visibilityGroups: []
  }
  postPage.innerHTML = `
    <div class="post-moment-topbar">
      <button class="post-moment-cancel" id="btn-post-moment-cancel" type="button">取消</button>
      <div class="post-moment-title">MY MOMENT</div>
      <button class="post-moment-submit" id="btn-post-moment-submit" type="button">发布</button>
    </div>
    <div class="post-moment-scroll">
      <textarea class="post-moment-textarea" id="post-moment-text" placeholder="这一刻的想法..."></textarea>
      <div class="post-moment-media-grid" id="post-moment-media-grid"></div>
      <div class="post-moment-options">
        <button class="post-moment-row" type="button" id="post-moment-location">
          <i class="fa-solid fa-location-dot"></i>
          <span>所在位置</span>
          <strong data-field="location"></strong>
          <i class="fa fa-angle-right"></i>
        </button>
        <button class="post-moment-row" type="button" id="post-moment-mentions">
          <i class="fa fa-at"></i>
          <span>提醒谁看</span>
          <strong data-field="mentions"></strong>
          <i class="fa fa-angle-right"></i>
        </button>
        <button class="post-moment-row" type="button" id="post-moment-visibility">
          <i class="fa-solid fa-circle-user"></i>
          <span>谁可以看</span>
          <strong data-field="visibility">公开</strong>
          <i class="fa fa-angle-right"></i>
        </button>
      </div>
    </div>
  `
  window.openPage(postPage)
  renderPostMomentImages(postPage)
  postPage.querySelector('#btn-post-moment-cancel').addEventListener('click', () => window.closePage('wechat-post-moment-page'))
  postPage.querySelector('#btn-post-moment-submit').addEventListener('click', () => publishMomentFromPage(postPage, momentsPage, wechatPage))
  postPage.querySelector('#post-moment-location').addEventListener('click', () => showMomentTextInput(postPage, '所在位置', '输入位置内容', 'location'))
  postPage.querySelector('#post-moment-mentions').addEventListener('click', () => showMomentMentionPicker(postPage))
  postPage.querySelector('#post-moment-visibility').addEventListener('click', () => showMomentVisibilitySheet(postPage))
}

function renderPostMomentImages(postPage) {
  const grid = postPage.querySelector('#post-moment-media-grid')
  if (!grid) return
  const draft = postPage._momentDraft
  const previews = draft.images.map((image, index) => {
    const item = normalizeMomentImageItem(image)
    return `
    <div class="post-moment-preview">
      <img src="${wcEscHtml(item.src)}" alt="图片${index + 1}">
      <button type="button" class="post-moment-remove-img" data-index="${index}" aria-label="移除图片">
        <i class="fa fa-times"></i>
      </button>
    </div>
  `
  }).join('')
  const add = draft.images.length < 9
    ? `<button class="post-moment-add-img" id="post-moment-add-img" type="button" aria-label="添加图片"><i class="fi fi-rr-plus"></i></button>`
    : ''
  grid.innerHTML = previews + add
  grid.querySelector('#post-moment-add-img')?.addEventListener('click', () => showMomentImageSourceSheet(postPage))
  grid.querySelectorAll('.post-moment-remove-img').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index, 10)
      if (Number.isInteger(index)) {
        draft.images.splice(index, 1)
        renderPostMomentImages(postPage)
      }
    })
  })
}

function showMomentImageSourceSheet(postPage) {
  const sheet = wcMakeSheet(`
    <div class="sheet-title">添加图片</div>
    <div class="moment-image-source-actions">
      <button class="moment-source-btn" id="moment-source-camera" type="button">
        <i class="fa fa-camera"></i><span>拍摄</span>
      </button>
      <button class="moment-source-btn" id="moment-source-album" type="button">
        <i class="fa fa-folder-open"></i><span>相册</span>
      </button>
    </div>
  `)
  wcShowSheetNoConfirm(sheet)
  sheet.querySelector('#moment-source-camera').addEventListener('click', () => {
    closeWcSheet(sheet)
    showMomentPhotoSimSheet(postPage)
  })
  sheet.querySelector('#moment-source-album').addEventListener('click', () => {
    closeWcSheet(sheet)
    window.showImagePicker(imageUrl => {
      if (!imageUrl) return
      showRealImageSendModal({
        src: imageUrl,
        onConfirm: ({ src, desc }) => {
          postPage._momentDraft.images.push({ src, desc })
          renderPostMomentImages(postPage)
        }
      })
    })
  })
}

function showMomentPhotoSimSheet(postPage) {
  const sheet = wcMakeSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">拍摄照片</div>
    <div style="padding:0 16px 8px">
      <textarea class="input-field" id="moment-photo-desc-input" rows="3" placeholder="描述照片内容（如：自拍、风景照…）"></textarea>
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-send-moment-photo-sim">发送</button>
    </div>
  `)
  wcShowSheet(sheet, async () => {
    const desc = sheet.querySelector('#moment-photo-desc-input').value.trim()
    if (!desc) { window.toast('请填写描述'); return false }
    const src = getRandomMomentPlaceholderSrc(postPage._momentDraft.images)
    postPage._momentDraft.images.push({ src, desc })
    renderPostMomentImages(postPage)
  })
}

function getRandomMomentPlaceholderSrc(existingImages = []) {
  const used = new Set(
    existingImages
      .map(image => normalizeMomentImageItem(image).src.match(/img\/blank_img([1-6])\.jpg$/)?.[1])
      .filter(Boolean)
  )
  const available = [1, 2, 3, 4, 5, 6].filter(index => !used.has(String(index)))
  const pool = available.length ? available : [1, 2, 3, 4, 5, 6]
  const index = pool[Math.floor(Math.random() * pool.length)]
  return `img/blank_img${index}.jpg`
}

function showMomentTextInput(postPage, title, placeholder, field) {
  const current = postPage._momentDraft[field] || ''
  const sheet = wcMakeSheet(`
    <div class="sheet-title">${wcEscHtml(title)}</div>
    <div style="padding:0 16px 8px">
      <input class="input-field" id="moment-text-field-input" value="${wcEscHtml(current)}" placeholder="${wcEscHtml(placeholder)}">
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-save-moment-text-field">完成</button>
    </div>
  `)
  wcShowSheet(sheet, async () => {
    const value = sheet.querySelector('#moment-text-field-input').value.trim()
    postPage._momentDraft[field] = value
    syncPostMomentMeta(postPage)
  })
  setTimeout(() => sheet.querySelector('#moment-text-field-input')?.focus(), 80)
}

async function showMomentMentionPicker(postPage) {
  const friends = await loadMomentMentionFriendItems()
  const selectedIds = new Set((postPage._momentDraft.mentionIds || []).map(id => String(id)))
  const sheet = wcMakeSheet(`
    <div class="sheet-title">提醒谁看</div>
    <div class="group-member-select moment-multi-select">
      ${friends.length ? friends.map(friend => `
        <div class="member-select-row${selectedIds.has(String(friend.id)) ? ' active' : ''}" data-id="${friend.id}" data-name="${wcEscHtml(friend.name)}">
          <div class="chat-avatar" style="width:36px;height:36px">
            ${friend.avatar ? `<img src="${wcEscHtml(friend.avatar)}">` : buildWechatInitialAvatarHTML(friend.name)}
          </div>
          <span style="flex:1;font-size:14px">${wcEscHtml(friend.name)}</span>
          <i class="fa ${selectedIds.has(String(friend.id)) ? 'fa-check-circle' : 'fa-circle-o'} member-check"></i>
        </div>
      `).join('') : '<div class="contact-group-empty">暂无好友</div>'}
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-save-moment-mentions">完成</button>
    </div>
  `)
  wcShowSheetNoConfirm(sheet)
  sheet.querySelectorAll('.member-select-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = String(row.dataset.id || '')
      const checkEl = row.querySelector('.member-check')
      if (selectedIds.has(id)) {
        selectedIds.delete(id)
        row.classList.remove('active')
        checkEl.className = 'fa fa-circle-o member-check'
      } else {
        selectedIds.add(id)
        row.classList.add('active')
        checkEl.className = 'fa fa-check-circle member-check'
      }
    })
  })
  sheet.querySelector('#btn-save-moment-mentions').addEventListener('click', () => {
    const selected = friends.filter(friend => selectedIds.has(String(friend.id)))
    postPage._momentDraft.mentionIds = selected.map(friend => friend.id)
    postPage._momentDraft.mentions = selected.map(friend => friend.name)
    syncPostMomentMeta(postPage)
    closeWcSheet(sheet)
  })
}

async function loadMomentMentionFriendItems() {
  if (!_wechatUid) return []
  const friends = await loadFriendCharacters()
  const rows = []
  for (const char of friends) {
    const chat = await db.chats
      .where('[ownerUid+charId]').equals([_wechatUid, char.id])
      .first()
    let time = 0
    if (chat) {
      const lastMsg = await db.messages.where('chatId').equals(chat.id).last()
      time = lastMsg?.createdAt || chat.createdAt || 0
    }
    rows.push({
      id: char.id,
      name: getWechatDisplayName(char),
      avatar: getWechatDisplayAvatar(char),
      time
    })
  }
  return rows.sort((a, b) => b.time - a.time || a.name.localeCompare(b.name, 'zh-CN'))
}

async function showMomentVisibilitySheet(postPage) {
  const groups = await getWechatChatGroups()
  const draft = postPage._momentDraft
  const selectedGroups = new Set((draft.visibilityGroups || []).map(String))
  const sheet = wcMakeSheet(`
    <div class="sheet-title">谁可以看</div>
    <div class="post-moment-privacy-list">
      <button class="post-moment-privacy-option${draft.visibility === '公开' ? ' active' : ''}" type="button" data-mode="public">
        <span>公开</span>
        <i class="fa fa-check"></i>
      </button>
      <button class="post-moment-privacy-option${draft.visibility === '选择分组' ? ' active' : ''}" type="button" data-mode="groups">
        <span>选择分组</span>
        <i class="fa fa-check"></i>
      </button>
      <div class="moment-visibility-groups" id="moment-visibility-groups" style="${draft.visibility === '选择分组' ? '' : 'display:none'}">
        ${groups.length ? groups.map(group => `
          <button class="contact-group-option moment-group-option${selectedGroups.has(group) ? ' active' : ''}" data-group="${wcEscHtml(group)}" type="button">
            <span>${wcEscHtml(group)}</span>
            <i class="fa fa-check"></i>
          </button>
        `).join('') : '<div class="contact-group-empty">暂无分组</div>'}
      </div>
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-save-moment-visibility">完成</button>
    </div>
  `)
  wcShowSheetNoConfirm(sheet)
  let mode = draft.visibility === '选择分组' ? 'groups' : 'public'
  const syncMode = nextMode => {
    mode = nextMode
    sheet.querySelectorAll('.post-moment-privacy-option[data-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === nextMode)
    })
    const groupList = sheet.querySelector('#moment-visibility-groups')
    if (groupList) groupList.style.display = nextMode === 'groups' ? '' : 'none'
  }
  sheet.querySelectorAll('.post-moment-privacy-option[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => syncMode(btn.dataset.mode || 'public'))
  })
  sheet.querySelectorAll('.moment-group-option[data-group]').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.group || ''
      if (selectedGroups.has(group)) selectedGroups.delete(group)
      else selectedGroups.add(group)
      btn.classList.toggle('active', selectedGroups.has(group))
    })
  })
  sheet.querySelector('#btn-save-moment-visibility').addEventListener('click', () => {
    if (mode === 'groups' && !selectedGroups.size) {
      window.toast && window.toast('请选择分组')
      return
    }
    draft.visibility = mode === 'groups' ? '选择分组' : '公开'
    draft.visibilityGroups = mode === 'groups' ? [...selectedGroups] : []
    syncPostMomentMeta(postPage)
    closeWcSheet(sheet)
  })
}

function syncPostMomentMeta(postPage) {
  const draft = postPage._momentDraft
  const setValue = (field, value) => {
    const el = postPage.querySelector(`[data-field="${field}"]`)
    if (el) el.textContent = value || ''
  }
  setValue('location', draft.location)
  setValue('mentions', normalizeMomentTextValue(draft.mentions))
  setValue('visibility', draft.visibility === '选择分组' ? '选择分组' : '公开')
}

async function showCharacterMomentPicker(momentsPage, wechatPage) {
  if (!_wechatUid) { window.toast && window.toast('请先登录'); return }
  const chars = (await db.characters.toArray())
    .filter(c => (c.type === 'char' || c.type === 'npc') && c.id !== _wechatUid)
  if (!chars.length) { window.toast && window.toast('暂无可发布动态的角色'); return }
  const displayChars = (await Promise.all(chars.map(c => getWechatDisplayCharacter(c.id)))).filter(Boolean)
  displayChars.sort((a, b) => getWechatDisplayName(a).localeCompare(getWechatDisplayName(b), 'zh-CN'))
  const selectedIds = new Set()
  const sheet = wcMakeSheet(`
    <div class="sheet-title">选择角色发布动态</div>
    <div class="group-member-select moment-multi-select moment-character-select">
      ${displayChars.map(char => {
        const name = getWechatDisplayName(char)
        const avatarUrl = getWechatDisplayAvatar(char)
        return `
          <button class="member-select-row" data-char-id="${char.id}" type="button">
            <div class="chat-avatar" style="width:36px;height:36px">
              ${avatarUrl ? `<img src="${wcEscHtml(avatarUrl)}">` : buildWechatInitialAvatarHTML(name)}
            </div>
            <span class="moment-character-name">${wcEscHtml(name)}</span>
            <i class="fa fa-circle-o member-check"></i>
          </button>
        `
      }).join('')}
    </div>
    <div class="sheet-actions moment-character-actions">
      <button class="btn-ghost btn-full" id="btn-cancel-character-moment" type="button">取消</button>
      <button class="btn-pill btn-full" id="btn-confirm-character-moment" type="button">发布（<span id="character-moment-count">0</span>）</button>
    </div>
  `)
  wcShowSheetNoConfirm(sheet)
  const countEl = sheet.querySelector('#character-moment-count')
  sheet.querySelectorAll('[data-char-id]').forEach(row => {
    row.addEventListener('click', () => {
      const charId = parseInt(row.dataset.charId, 10)
      const checkEl = row.querySelector('.member-check')
      if (selectedIds.has(charId)) {
        selectedIds.delete(charId)
        row.classList.remove('active')
        if (checkEl) checkEl.className = 'fa fa-circle-o member-check'
      } else {
        selectedIds.add(charId)
        row.classList.add('active')
        if (checkEl) checkEl.className = 'fa fa-check-circle member-check'
      }
      if (countEl) countEl.textContent = selectedIds.size
    })
  })
  sheet.querySelector('#btn-cancel-character-moment').addEventListener('click', () => closeWcSheet(sheet))
  sheet.querySelector('#btn-confirm-character-moment').addEventListener('click', async () => {
    if (!selectedIds.size) { window.toast && window.toast('请至少选择一个角色'); return }
    const ids = [...selectedIds]
    closeWcSheet(sheet)
    await publishAIMomentsForCharacters(ids, momentsPage, wechatPage)
  })
}

function setMomentsCharacterPublishing(momentsPage, isPublishing) {
  const loader = momentsPage?.querySelector('#moments-ai-loading')
  const btn = momentsPage?.querySelector('#btn-generate-character-moment')
  if (momentsPage) updateWechatMomentsState(momentsPage, { isPublishing: !!isPublishing })
  if (loader) loader.hidden = !isPublishing
  if (btn) btn.disabled = !!isPublishing
}

async function publishAIMomentsForCharacters(charIds, momentsPage, wechatPage) {
  const ids = Array.isArray(charIds) ? charIds.filter(Boolean) : []
  if (!ids.length) return
  setMomentsCharacterPublishing(momentsPage, true)
  let successCount = 0
  try {
    for (const charId of ids) {
      const ok = await publishAIMomentForCharacter(charId, momentsPage, wechatPage)
      if (ok) successCount += 1
    }
    if (successCount) {
      window.toast && window.toast(successCount === 1 ? '角色动态已发布' : `已发布 ${successCount} 条角色动态`)
    }
  } finally {
    setMomentsCharacterPublishing(momentsPage, false)
  }
}

async function publishAIMomentForCharacter(charId, momentsPage, wechatPage) {
  const ownerUid = getCurrentMomentsOwnerUid()
  if (!ownerUid) { window.toast && window.toast('请先登录'); return false }
  const char = await getWechatDisplayCharacter(charId, ownerUid)
  if (!char) { window.toast && window.toast('角色不存在'); return false }
  const friends = await getRelationMomentFriends(char, ownerUid)
  window.toast && window.toast(`${getWechatDisplayName(char)} 正在发布动态...`)
  try {
    const result = await generateCharacterMomentDraft(char, friends, ownerUid)
    const images = buildAIMomentImages(result)
    const content = convertBracketEmoji(result.content || result.text || '')
    const momentId = await db.moments.add({
      ownerUid,
      charId: char.id,
      content,
      images,
      location: '',
      mentions: [],
      mentionIds: [],
      visibility: '公开',
      visibilityGroups: [],
      createdAt: Date.now()
    })
    await applyAIMomentComments(momentId, result, friends)
    await generateMomentLikesFromCharacters(momentId, friends, momentsPage, wechatPage)
    if (momentsPage && document.body.contains(momentsPage)) {
      await renderMomentsList(momentsPage, wechatPage)
    }
    return true
  } catch (e) {
    console.error('角色发布朋友圈失败：', e)
    window.toast && window.toast('发布失败：' + (e.message || '未知错误'))
    return false
  }
}

async function getRelationMomentFriends(char, ownerUid = getCurrentMomentsOwnerUid()) {
  const relations = Array.isArray(char?.relations) ? char.relations : []
  const rows = []
  const seen = new Set()
  for (const rel of relations) {
    const id = parseInt(rel?.charId, 10)
    if (!id || seen.has(id) || String(id) === String(ownerUid) || id === char.id) continue
    seen.add(id)
    const target = await getWechatDisplayCharacter(id, ownerUid)
    if (!target || target.type === 'user') continue
    rows.push({
      char: target,
      id: target.id,
      name: getWechatDisplayName(target),
      relation: rel?.type ? rel.type + (rel.desc ? `（${rel.desc}）` : '') : '(未设定)',
      desc: target.description || '(未设定)'
    })
  }
  return rows
}

async function buildCharacterMomentPromptContext(char, friends, ownerUid = getCurrentMomentsOwnerUid()) {
  const charName = char.nick || char.name || getWechatDisplayName(char)
  const displayName = getWechatDisplayName(char)
  const profile = await getWechatContactMomentsProfileForOwner(ownerUid, char.id)
  const loreCtx = window.getLorebookContext ? await window.getLorebookContext(char.id, []) : ''
  const recentMoments = await getScopedMoments({ ownerUid, charId: char.id, limit: 5 })
  const recentMomentLines = recentMoments.map(m => `- ${String(m.content || '(无文字内容)').trim()}`)
  const chat = await db.chats
    .where('[ownerUid+charId]').equals([ownerUid, char.id])
    .first()
  const recentChatLines = []
  if (chat) {
    const msgs = await db.messages.where('chatId').equals(chat.id).sortBy('createdAt')
    msgs.slice(-30).forEach(m => {
      const who = m.role === 'user' ? (_wechatUser?.name || '用户') : charName
      recentChatLines.push(`${who}: ${getMsgActionText(m, charName)}`)
    })
  }
  const friendLines = friends.map(friend =>
    `- ${friend.name}（与${charName}的关系：${friend.relation}）：${friend.desc}`
  )
  const virtualTime = await getMomentVirtualTimeText(char.id)
  return {
    charName,
    displayName,
    profile,
    loreCtx,
    recentMomentLines,
    recentChatLines,
    friendLines,
    virtualTime
  }
}

async function generateCharacterMomentDraft(char, friends, ownerUid = getCurrentMomentsOwnerUid()) {
  const {
    charName,
    displayName,
    profile,
    loreCtx,
    recentMomentLines,
    recentChatLines,
    friendLines,
    virtualTime
  } = await buildCharacterMomentPromptContext(char, friends, ownerUid)
  const ownerUser = ownerUid ? await db.characters.get(ownerUid) : _wechatUser
  const userName = ownerUser?.name || _wechatUser?.name || '用户'
  const prompt = `你正在进行角色扮演。
【当前时间】
${virtualTime}

【你的信息】
名字：${charName}
微信昵称：${displayName}
个性签名：${String(profile?.bio || '').trim() || '(未设置)'}
设定：
${char.description || '(未设定)'}

【世界观】
${loreCtx || '(无特殊世界观，以现实生活逻辑为准)'}

【最近发过的朋友圈「避免重复」】
${recentMomentLines.length ? recentMomentLines.join('\n') : '- (暂无)'}

【最近的聊天「仅做灵感参考，不必直接关联」】
${recentChatLines.length ? recentChatLines.join('\n') : '(暂无)'}

【以下好友会看到这条朋友圈，请同时为他们生成评论】（这些好友只来自当前角色档案里添加过关系的角色）
${friendLines.length ? friendLines.join('\n') : '(暂无好友)'}

请以角色的身份发一条朋友圈动态，并为看到这条朋友圈的好友生成评论。要求：
1. 内容要符合角色的性格、身份和当前时间段
2. 像真人发朋友圈一样自然，可以是日常分享、心情感悟、吐槽、晒图文案、段子等
3. 长度适中，像真实朋友圈一样，一般1-3句话
4. 大部分朋友圈应该是纯文字；只有在晒美食、风景、自拍等必须借助图片表达的场景，才配图
5. 为角色好友列表中的每个人生成一条符合其性格的简短评论，2-25字，语气像真人随手评论；评论里的 name 必须与好友显示名完全一致
6. 绝对禁止生成用户（${userName}）的评论，只生成角色好友的评论

请严格以JSON格式返回，不要包含Markdown代码块标记：
{
  "content": "朋友圈文字",
  "images": 0,
  "image_desc": "",
  "comments": [
    { "name": "好友显示名", "text": "评论内容" }
  ]
}

images 字段表示配图数量（0-9），0表示纯文字朋友圈。建议大多数情况设为0。
image_desc 字段：当 images > 0 时，用一句话描述配图内容。`

  const raw = await window.callAI([{ role: 'user', content: prompt }], {
    temperature: await window.getAITemperaturePreset('wechatMoments'),
    responseFormat: 'json_object'
  })
  const parsed = extractAIJson(raw)
  if (!parsed || typeof parsed !== 'object') throw new Error('AI 返回格式异常')
  const content = convertBracketEmoji(parsed.content || parsed.text || '')
  if (!content) throw new Error('AI 未返回朋友圈内容')
  parsed.content = content
  return parsed
}

async function getMomentVirtualTimeText(charId) {
  const now = new Date()
  const chat = await db.chats
    .where('[ownerUid+charId]').equals([_wechatUid, charId])
    .first()
  if (chat) {
    const row = await db.config.get(`chatTimezone_${chat.id}`)
    const tz = row?.value
    if (tz?.enabled && tz.charTimezone) {
      return now.toLocaleString('zh-CN', {
        timeZone: tz.charTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  }
  return now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

function buildAIMomentImages(result) {
  const count = Math.min(9, Math.max(0, parseInt(result?.images, 10) || 0))
  const desc = String(result?.image_desc || result?.imageDesc || '').trim()
  const images = []
  for (let i = 0; i < count; i++) {
    images.push({
      src: getRandomMomentPlaceholderSrc(images),
      desc: count > 1 && desc ? `${desc}（第${i + 1}张）` : desc
    })
  }
  return images
}

async function applyAIMomentComments(momentId, result, friends) {
  const friendMap = new Map(friends.map(friend => [friend.name, friend]))
  const allowedIds = new Set(friends.map(friend => String(friend.id)))
  const rawComments = Array.isArray(result?.comments) ? result.comments : []
  const comments = []
  rawComments.forEach(item => {
    const name = String(item?.name || '').trim()
    const text = convertBracketEmoji(String(item?.text || '').trim())
    const friend = friendMap.get(name)
    if (!friend || !allowedIds.has(String(friend.id)) || !text) return
    comments.push({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      uid: friend.id,
      name: friend.name,
      text,
      createdAt: Date.now()
    })
  })
  if (comments.length) await db.moments.update(momentId, { comments })
}

async function generateMomentLikesFromCharacters(momentId, friends, momentsPage, wechatPage) {
  if (!friends.length) return
  const ratio = 0.5 + Math.random() * 0.5
  const likeCount = Math.max(1, Math.round(friends.length * ratio))
  const chosen = friends.slice().sort(() => Math.random() - 0.5).slice(0, likeCount)
  const likes = chosen.map(friend => ({
    uid: friend.id,
    name: friend.name,
    createdAt: Date.now()
  }))
  await db.moments.update(momentId, { likes })
  if (momentsPage && document.body.contains(momentsPage)) {
    await renderMomentsList(momentsPage, wechatPage)
  }
}

async function publishMomentFromPage(postPage, momentsPage, wechatPage) {
  if (!_wechatUid) { window.toast && window.toast('请先登录'); return }
  const ownerUid = getCurrentMomentsOwnerUid()
  if (!ownerUid) { window.toast && window.toast('请先登录'); return }
  const content = convertBracketEmoji(postPage.querySelector('#post-moment-text')?.value.trim() || '')
  const draft = postPage._momentDraft || {}
  const images = Array.isArray(draft.images) ? draft.images.map(normalizeMomentImageItem).filter(item => item.src) : []
  if (!content && !images.length) { window.toast && window.toast('请输入内容或添加图片'); return }
  const momentId = await db.moments.add({
    ownerUid,
    charId: _wechatUid,
    content,
    images,
    location: normalizeMomentTextValue(draft.location),
    mentions: Array.isArray(draft.mentions) ? draft.mentions.slice() : [],
    mentionIds: Array.isArray(draft.mentionIds) ? draft.mentionIds.slice() : [],
    visibility: draft.visibility || '公开',
    visibilityGroups: Array.isArray(draft.visibilityGroups) ? draft.visibilityGroups.slice() : [],
    createdAt: Date.now()
  })
  window.toast && window.toast('动态已发布')
  window.closePage('wechat-post-moment-page')
  await renderMomentsList(momentsPage, wechatPage)
  generateMomentLikes(momentId, draft, momentsPage, wechatPage)
  generateMomentComments(momentId, momentsPage, wechatPage)
}

async function getMomentVisibleFriends(moment) {
  const ownerUid = moment?.ownerUid || getCurrentMomentsOwnerUid()
  const allFriends = await loadMomentFriendCharacters(ownerUid)
  if (!allFriends.length) return []
  if (moment?.visibility === '选择分组' && Array.isArray(moment.visibilityGroups) && moment.visibilityGroups.length) {
    const groupSet = new Set(moment.visibilityGroups)
    const enriched = await enrichContactGroupNames(allFriends)
    return enriched.filter(c => groupSet.has(c._contactGroupName))
  }
  return allFriends
}

async function generateMomentLikes(momentId, draft, momentsPage, wechatPage) {
  const moment = await db.moments.get(momentId)
  const visibleFriends = await getMomentVisibleFriends(moment || draft)
  if (!visibleFriends.length) return

  const ratio = 0.5 + Math.random() * 0.5
  const likeCount = Math.max(1, Math.round(visibleFriends.length * ratio))
  const shuffled = visibleFriends.slice().sort(() => Math.random() - 0.5)
  const chosen = shuffled.slice(0, likeCount)

  for (const friend of chosen) {
    await new Promise(r => setTimeout(r, 2000))
    const fresh = await db.moments.get(momentId)
    if (!fresh) return
    const likes = normalizeMomentLikes(fresh.likes)
    if (likes.some(l => String(l.uid) === String(friend.id))) continue
    likes.push({ uid: friend.id, name: getWechatDisplayName(friend), createdAt: Date.now() })
    await db.moments.update(momentId, { likes })
    if (momentsPage && document.body.contains(momentsPage)) {
      await renderMomentsList(momentsPage, wechatPage)
    }
  }
}

async function addRandomFriendLikes(momentId, momentsPage, wechatPage) {
  const moment = await db.moments.get(momentId)
  if (!moment) return
  const visibleFriends = await getMomentVisibleFriends(moment)
  if (!visibleFriends.length) return
  const currentLikes = normalizeMomentLikes(moment.likes)
  const likedUids = new Set(currentLikes.map(l => String(l.uid)))
  const candidates = visibleFriends.filter(f => !likedUids.has(String(f.id)))
  if (!candidates.length) return
  const count = Math.min(1 + Math.floor(Math.random() * 2), candidates.length)
  const shuffled = candidates.sort(() => Math.random() - 0.5)
  const chosen = shuffled.slice(0, count)
  for (const friend of chosen) {
    await new Promise(r => setTimeout(r, 2000))
    const fresh = await db.moments.get(momentId)
    if (!fresh) return
    const likes = normalizeMomentLikes(fresh.likes)
    if (likes.some(l => String(l.uid) === String(friend.id))) continue
    likes.push({ uid: friend.id, name: getWechatDisplayName(friend), createdAt: Date.now() })
    await db.moments.update(momentId, { likes })
    if (momentsPage && document.body.contains(momentsPage)) {
      await renderMomentsList(momentsPage, wechatPage)
    }
  }
}

function buildMomentImagePromptParts(moment) {
  const images = Array.isArray(moment.images) ? moment.images.map(normalizeMomentImageItem).filter(i => i.src) : []
  const imageContentParts = []
  const imageTextParts = []
  images.forEach((img, idx) => {
    const isVisual = img.src.startsWith('data:') || img.src.startsWith('http://') || img.src.startsWith('https://')
    const desc = normalizeImageSupplementDesc(img.desc)
    if (isVisual) {
      imageContentParts.push({ type: 'image_url', image_url: { url: img.src } })
      if (desc) imageContentParts.push({ type: 'text', text: `第 ${idx + 1} 张图片的图片重点补充：${desc}` })
    } else {
      imageTextParts.push(`第 ${idx + 1} 张图片：${desc || '(无描述)'}`)
    }
  })
  const imageText = images.length
    ? `\n（附带${images.length}张图片，请查看后续 image_url。若某张图片后紧跟“第 N 张图片的图片重点补充”，该文字只补充紧前对应的 image_url。${imageTextParts.length ? '非真实图片说明：' + imageTextParts.join('；') : ''}）`
    : ''
  return { imageContentParts, imageText }
}

function buildExistingMomentCommentsText(comments) {
  if (!comments.length) return '- (暂无现有评论)'
  return comments.map(comment => {
    const replyText = comment.replyToName ? ` 回复 ${comment.replyToName}` : ''
    return `- ${comment.name}${replyText}：${comment.text}`
  }).join('\n')
}

function getRelationTextFromChar(char, targetId) {
  const rel = (char?.relations || []).find(r => String(r.charId) === String(targetId))
  return rel?.type ? rel.type + (rel.desc ? `（${rel.desc}）` : '') : ''
}

async function getMomentReplyRelationText(fromUid, toUid) {
  if (!fromUid || !toUid || String(fromUid) === String(toUid)) return ''
  const fromChar = await window.getCharacter(fromUid)
  const toChar = await window.getCharacter(toUid)
  const forward = getRelationTextFromChar(fromChar, toUid)
  if (forward) return forward
  const reverse = getRelationTextFromChar(toChar, fromUid)
  if (reverse) return `${toChar?.nick || toChar?.name || '对方'}视角：${reverse}`
  return ''
}

function parseAICommentArray(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(parsed) ? parsed : (parsed?.comments || parsed?.data || [])
  } catch {
    return []
  }
}

function findMomentReplyTarget(replyToName, comments) {
  const name = String(replyToName || '').trim()
  if (!name) return null
  return comments.find(comment => comment.name === name) || null
}

function pickRandomItems(items, count) {
  if (!Array.isArray(items) || !items.length || count <= 0) return []
  return items.slice().sort(() => Math.random() - 0.5).slice(0, Math.min(count, items.length))
}

async function appendGeneratedMomentComment(momentId, item, friendMap, momentsPage, wechatPage, options = {}) {
  const name = String(item?.name || '').trim()
  const rawText = String(item?.text || '').trim()
  if (!name || !rawText) return false
  const friend = friendMap.get(name)
  if (!friend) return false
  if (options.allowedNames && !options.allowedNames.has(name)) return false
  const text = convertBracketEmoji(rawText)
  if (!text) return false

  const fresh = await db.moments.get(momentId)
  if (!fresh) return false
  const comments = normalizeMomentComments(fresh.comments)
  const replyTarget = findMomentReplyTarget(item?.replyToName || item?.reply_to_name, comments)
  if ((item?.replyToName || item?.reply_to_name) && !replyTarget) return false
  if (replyTarget && options.requireReplyRelation) {
    const relationText = await getMomentReplyRelationText(friend.id, replyTarget.uid)
    if (!relationText) return false
  }
  if (!replyTarget && options.allowedNormalNames && !options.allowedNormalNames.has(name)) return false

  comments.push({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    uid: friend.id,
    name,
    replyToId: replyTarget?.id || '',
    replyToUid: replyTarget?.uid,
    replyToName: replyTarget?.name || '',
    text,
    createdAt: Date.now()
  })
  await db.moments.update(momentId, { comments })
  if (momentsPage && document.body.contains(momentsPage)) await renderMomentsList(momentsPage, wechatPage)
  return true
}

async function generateMomentComments(momentId, momentsPage, wechatPage) {
  const moment = await db.moments.get(momentId)
  if (!moment) return
  const ownerUid = moment.ownerUid || getCurrentMomentsOwnerUid()
  if (String(moment.charId) !== String(ownerUid)) {
    await generateCharacterMomentComments(momentId, moment, momentsPage, wechatPage)
    return
  }
  await generateUserMomentComments(momentId, moment, momentsPage, wechatPage)
}

async function generateUserMomentComments(momentId, moment, momentsPage, wechatPage) {
  const ownerUid = moment.ownerUid || getCurrentMomentsOwnerUid()
  const ownerUser = ownerUid ? await db.characters.get(ownerUid) : _wechatUser
  const userName = ownerUser?.name || _wechatUser?.name || '用户'
  const userNick = ownerUser?.nick || _wechatUser?.nick || ''
  const userDesc = ownerUser?.description || _wechatUser?.description || '(未设定)'
  const loreCtx = window.getLorebookContext ? await window.getLorebookContext(ownerUid, []) : ''
  const visibleFriends = await getMomentVisibleFriends(moment)
  if (!visibleFriends.length) return

  const friendRows = []
  const friendMap = new Map()
  for (const friend of visibleFriends) {
    const char = await window.getCharacter(friend.id)
    if (!char) continue
    const relText = getRelationTextFromChar(char, ownerUid) || '(未设定)'
    const name = getWechatDisplayName(friend)
    const charName = char.nick || char.name || name
    const desc = char.description || '(未设定)'
    let historyText = ''
    const chat = await db.chats.where('[ownerUid+charId]').equals([ownerUid, friend.id]).first()
    if (chat) {
      const msgs = await db.messages.where('chatId').equals(chat.id).sortBy('createdAt')
      const recent = msgs.slice(-30)
      if (recent.length) {
        const lines = recent.map(m => `${m.role === 'user' ? userName : charName}：${getMsgActionText(m, charName)}`)
        historyText = `\n  最近聊天记录：\n  ${lines.join('\n  ')}`
      }
    }
    friendRows.push({ friend, line: `- ${name}（与${userName}的关系：${relText}）：${desc}${historyText}` })
    friendMap.set(name, friend)
  }
  if (!friendRows.length) return

  const systemPrompt = `你正在进行角色扮演世界中的社交模拟。请严格基于以下角色设定和世界观来生成评论，确保每条评论都符合对应角色的人设。

【朋友圈发布者信息】
名字：${userName}
微信网名：${userNick || userName}
人设：${userDesc}

【世界观】
${loreCtx || '(无特殊世界观，以现实生活逻辑为准)'}

只返回JSON对象，不要任何其他文字。`

  const { imageContentParts, imageText } = buildMomentImagePromptParts(moment)
  try {
    const fresh = await db.moments.get(momentId)
    if (!fresh) return
    const existingComments = normalizeMomentComments(fresh.comments)
    const existingCommentsText = buildExistingMomentCommentsText(existingComments)
    const existingCommenterIds = new Set(existingComments.map(comment => String(comment.uid)).filter(Boolean))
    const replyPairLines = []
    const rowsWithReply = new Set()
    const rowsWithoutComment = []
    const rowsCommentedNoReply = []
    for (const row of friendRows) {
      let canReply = false
      for (const comment of existingComments) {
        if (!comment.uid || String(comment.uid) === String(row.friend.id)) continue
        const relationText = await getMomentReplyRelationText(row.friend.id, comment.uid)
        if (relationText) {
          canReply = true
          replyPairLines.push(`- ${getWechatDisplayName(row.friend)} 可回复 ${comment.name}（关系：${relationText}）`)
        }
      }
      if (canReply) rowsWithReply.add(row)
      else if (!existingCommenterIds.has(String(row.friend.id))) rowsWithoutComment.push(row)
      else rowsCommentedNoReply.push(row)
    }
    const randomNormalRows = pickRandomItems(rowsCommentedNoReply, 1 + Math.floor(Math.random() * 2))
    const readingRows = [...rowsWithReply, ...rowsWithoutComment, ...randomNormalRows]
    if (!readingRows.length) return
    const normalCandidateLines = [
      ...rowsWithoutComment.map(row => `- ${getWechatDisplayName(row.friend)}（还没有评论过，可选择普通评论）`),
      ...randomNormalRows.map(row => `- ${getWechatDisplayName(row.friend)}（已评论过但本次随机抽中，可再发一条普通评论；不要填写 replyToName）`)
    ]
    const allowedNames = new Set(readingRows.map(row => getWechatDisplayName(row.friend)))
    const allowedNormalNames = new Set([...rowsWithoutComment, ...randomNormalRows].map(row => getWechatDisplayName(row.friend)))
    const userPromptText = `${userName} 发了一条朋友圈：
"${moment.content || '(无文字内容)'}"${imageText}

【现有评论，必须先阅读】
${existingCommentsText}

以下是本次需要阅读的人设列表。不是每个人都需要输出评论；请只从这些人里面选择评论者：
${readingRows.map(row => row.line).join('\n')}

【允许回复的现有评论】
${replyPairLines.length ? replyPairLines.join('\n') : '- (没有可回复的现有评论；只能生成普通评论)'}

【允许普通评论的候选】
${normalCandidateLines.length ? normalCandidateLines.join('\n') : '- (没有普通评论候选；只能按上面的允许回复生成 replyToName)'}

要求：
1. 每条评论简短自然（2-20字）
2. 模拟真实微信朋友圈的随意评论语气，可以用语气词、缩写、表情符号，像日常刷朋友圈随手打的评论
3. 必须符合每个角色的人设、性格特点和与${userName}的关系
4. 可以选择普通评论，也可以回复现有评论；只有出现在【允许回复的现有评论】里的“评论者 可回复 被回复者”才允许输出 replyToName
5. 如果某个“评论者 回复 被回复者”双方没有角色档案关系，必须过滤掉，不要输出这条回复
6. 如果【允许回复的现有评论】不为空，优先生成对现有评论的回复，至少输出一条 replyToName
7. 不是每个阅读到的人都需要生成评论；没有出现在【允许普通评论的候选】或【允许回复的现有评论】里的名字不要输出
8. 禁止过多发送表情包；大多数评论应为纯文字，只有极少数非常符合人设时才可使用一个表情

返回JSON对象格式：
{"comments":[{"name":"好友名字","text":"评论内容","replyToName":"被回复者名字，可省略"}]}`

    const userContent = imageContentParts.length ? [{ type: 'text', text: userPromptText }, ...imageContentParts] : userPromptText
    const raw = await window.callAI([{ role: 'user', content: userContent }], {
      system: systemPrompt,
      temperature: await window.getAITemperaturePreset('wechatMoments'),
      responseFormat: 'json_object'
    })
    const arr = parseAICommentArray(raw)
    if (!Array.isArray(arr) || !arr.length) return
    for (const item of arr) {
      await new Promise(r => setTimeout(r, 2000))
      await appendGeneratedMomentComment(momentId, item, friendMap, momentsPage, wechatPage, {
        requireReplyRelation: true,
        allowedNames,
        allowedNormalNames
      })
    }
  } catch (e) {
    console.error('生成朋友圈评论失败：', e)
    window.toast && window.toast('生成评论失败：' + (e.message || '未知错误'))
  }
}

async function generateCharacterMomentComments(momentId, moment, momentsPage, wechatPage) {
  const ownerUid = moment.ownerUid || getCurrentMomentsOwnerUid()
  const char = await getWechatDisplayCharacter(moment.charId, ownerUid)
  if (!char) return
  const friends = await getRelationMomentFriends(char, ownerUid)
  if (!friends.length) return
  const friendMap = new Map(friends.map(friend => [friend.name, friend]))
  const {
    charName,
    displayName,
    profile,
    loreCtx,
    recentMomentLines,
    recentChatLines,
    friendLines,
    virtualTime
  } = await buildCharacterMomentPromptContext(char, friends, ownerUid)
  const { imageContentParts, imageText } = buildMomentImagePromptParts(moment)
  const BATCH_SIZE = 15
  try {
    for (let i = 0; i < friendLines.length; i += BATCH_SIZE) {
      const batchLines = friendLines.slice(i, i + BATCH_SIZE)
      const fresh = await db.moments.get(momentId)
      if (!fresh) return
      const existingCommentsText = buildExistingMomentCommentsText(normalizeMomentComments(fresh.comments))
      const prompt = `你正在进行角色扮演。
【当前时间】
${virtualTime}

【你的信息】
名字：${charName}
微信昵称：${displayName}
个性签名：${String(profile?.bio || '').trim() || '(未设置)'}
设定：
${char.description || '(未设定)'}

【世界观】
${loreCtx || '(无特殊世界观，以现实生活逻辑为准)'}

【最近发过的朋友圈「避免重复」】
${recentMomentLines.length ? recentMomentLines.join('\n') : '- (暂无)'}

【最近的聊天「仅做灵感参考，不必直接关联」】
${recentChatLines.length ? recentChatLines.join('\n') : '(暂无)'}

【以下好友会看到这条朋友圈，请为他们生成评论】（这些好友只来自当前角色档案里添加过关系的角色）
${batchLines.join('\n')}

${charName} 已经发了这条朋友圈：
"${moment.content || '(无文字内容)'}"${imageText}

【现有评论，必须先阅读】
${existingCommentsText}

请为这条朋友圈生成新的评论。要求：
1. 评论者只能来自上面的好友列表，name 必须与好友显示名完全一致
2. 每条评论简短自然（2-25字），符合评论者的人设、性格，以及他/她与${charName}的关系
3. 可以普通评论，也可以回复现有评论；回复时填写 replyToName，值必须与现有评论里的名字完全一致
4. 这里不额外检查“评论者”和“被回复者”之间是否有关系，但仍然只能使用上面好友列表内的评论者
5. 绝对禁止生成登录用户（${_wechatUser?.name || '用户'}）的评论
6. 如果已有评论不为空，优先生成对现有评论的回复，至少输出一条 replyToName
7. 禁止过多发送表情包；大多数评论应为纯文字，只有极少数非常符合人设时才可使用一个表情

请严格以JSON格式返回，不要包含Markdown代码块标记：
{"comments":[{"name":"好友显示名","text":"评论内容","replyToName":"被回复者名字，可省略"}]}`

      const userContent = imageContentParts.length ? [{ type: 'text', text: prompt }, ...imageContentParts] : prompt
      const raw = await window.callAI([{ role: 'user', content: userContent }], {
        temperature: await window.getAITemperaturePreset('wechatMoments'),
        responseFormat: 'json_object'
      })
      const arr = parseAICommentArray(raw)
      if (!Array.isArray(arr) || !arr.length) continue
      for (const item of arr) {
        await new Promise(r => setTimeout(r, 2000))
        await appendGeneratedMomentComment(momentId, item, friendMap, momentsPage, wechatPage)
      }
    }
  } catch (e) {
    console.error('生成角色朋友圈评论失败：', e)
    window.toast && window.toast('生成评论失败：' + (e.message || '未知错误'))
  }
}

const _bracketEmojiMap = {
  '微笑': '😊', '撇嘴': '😏', '色': '😍', '发呆': '😳', '得意': '😎',
  '流泪': '😢', '害羞': '😊', '闭嘴': '🤐', '睡': '😴', '大哭': '😭',
  '尴尬': '😅', '发怒': '😡', '调皮': '😜', '呲牙': '😁', '惊讶': '😲',
  '难过': '😞', '酷': '😎', '冷汗': '😰', '抓狂': '😤', '吐': '🤮',
  '偷笑': '🤭', '可爱': '🥰', '白眼': '🙄', '傲慢': '😤', '饥饿': '😋',
  '困': '😪', '惊恐': '😨', '流汗': '😓', '憨笑': '😄', '大兵': '🫡',
  '奋斗': '💪', '咒骂': '🤬', '疑问': '❓', '嘘': '🤫', '晕': '😵',
  '折磨': '😩', '衰': '😥', '骷髅': '💀', '敲打': '🔨', '再见': '👋',
  '擦汗': '😅', '抠鼻': '🤏', '鼓掌': '👏', '糗大了': '😳', '坏笑': '😈',
  '左哼哼': '😤', '右哼哼': '😤', '哈欠': '🥱', '鄙视': '😒', '委屈': '🥺',
  '快哭了': '🥺', '阴险': '😏', '亲亲': '😘', '吓': '😱', '可怜': '🥺',
  '菜刀': '🔪', '西瓜': '🍉', '啤酒': '🍺', '篮球': '🏀', '乒乓': '🏓',
  '咖啡': '☕', '饭': '🍚', '猪头': '🐷', '玫瑰': '🌹', '凋谢': '🥀',
  '示爱': '💗', '爱心': '❤️', '心碎': '💔', '蛋糕': '🎂', '闪电': '⚡',
  '炸弹': '💣', '刀': '🔪', '足球': '⚽', '瓢虫': '🐞', '便便': '💩',
  '月亮': '🌙', '太阳': '☀️', '彩虹': '🌈', '拥抱': '🤗', '强': '👍',
  '弱': '👎', '握手': '🤝', '胜利': '✌️', '抱拳': '🙏', '勾引': '😏',
  '拳头': '👊', '差劲': '👎', '爱你': '🥰', 'NO': '🙅', 'OK': '👌',
  '爱情': '💕', '飞吻': '😘', '跳跳': '🤸', '发抖': '🥶', '怄火': '😤',
  '转圈': '🔄', '磕头': '🙇', '跪了': '🧎', '回头': '🔙', '跳绳': '🤸', '挥手': '👋',
  '激动': '🤩', '街舞': '💃', '献吻': '💋', '左太极': '🥋', '右太极': '🥋',
  '嘿哈': '😆', '捂脸': '🤦', '奸笑': '😏', '机智': '🧐', '皱眉': '😟',
  '耶': '✌️', '鸡': '🐔', '蜡烛': '🕯️', '糖果': '🍬',
  '药': '💊', '手枪': '🔫', '茶': '🍵', '庆祝': '🎉', '礼物': '🎁',
  '烟花': '🎆', '猫咪': '🐱', '狗': '🐶', '叹气': '😮‍💨', '无奈': '🤷',
  '笑哭': '🤣', '笑脸': '😊', '哭笑不得': '😂', '泪奔': '😭', '无语': '😑',
  '思考': '🤔', '点赞': '👍', '赞': '👍', '比心': '🫶', '合十': '🙏',
  '加油': '💪', '天啊': '😱', '哇': '😮', '脸红': '😊', '破涕为笑': '😂',
  '苦涩': '😣', '裂开': '💔', '翻白眼': '🙄', '666': '👍', '让我看看': '👀',
  '叹号': '❗', '问号': '❓', '打脸': '🤦', '社会社会': '🤙', '旺柴': '🐕',
  '好的': '👌', '打call': '📣', '变形': '🤪', '仔细分析': '🧐', '加鸡腿': '🍗',
  '吃瓜': '🍉', '狗头': '🐶', '暗中观察': '👀', '哦吼': '😯',
  'emm': '🤔', 'emmm': '🤔', '害': '😊', '哈哈': '😄', '哈哈哈': '🤣',
  '呜呜': '😢', '嘻嘻': '😝', '嘻嘻嘻': '😝', '嗯嗯': '😊',
  '鲜花': '🌸', '花': '🌸', '火': '🔥', '星星': '⭐', '雪花': '❄️',
  '大笑': '😆', '苦笑': '😅', '感动': '🥹', '生气': '😠',
  '开心': '😄', '伤心': '😢', '高兴': '😃', '紧张': '😬', '期待': '🤩',
}

function convertBracketEmoji(text) {
  return text
    .replace(/\[([^\]]+)\]/g, (_, name) => _bracketEmojiMap[name] || '')
    .replace(/［([^］]+)］/g, (_, name) => _bracketEmojiMap[name] || '')
    .trim()
}

// ===== Tab4：我 =====
function renderCachedWechatMe(page, container) {
  if (!page?._wechatMeHTML || !container) return false
  renderMeTabPage(page, container, page._wechatMeHTML)
  return true
}

async function preloadWechatMe(page) {
  if (!page || !document.body.contains(page)) return
  const html = await buildMeTabStateHTML()
  if (!document.body.contains(page)) return
  page._wechatMeHTML = html
}

async function loadMeTab(page, container, options = {}) {
  const hasCachedMe = options.renderCache !== false ? renderCachedWechatMe(page, container) : !!page._wechatMeHTML
  if (!hasCachedMe && options.showLoading !== false) {
    container.innerHTML = '<div class="list-loading"><i class="fa fa-spinner fa-spin"></i></div>'
  }
  const token = (page._wechatMeLoadToken || 0) + 1
  page._wechatMeLoadToken = token
  const html = await buildMeTabStateHTML()
  if (page._wechatMeLoadToken !== token) return
  page._wechatMeHTML = html
  renderMeTabPage(page, container, html)
}

async function buildMeTabStateHTML() {
  if (isWechatRolePhoneMode()) return buildRolePhoneMeTabStateHTML()
  const user = _wechatUser
  const profile = await getWechatSelfProfile()
  const posts = _wechatUid ? await countScopedMoments(_wechatUid, _wechatUid) : 0
  const selfAvatar = profile.avatar || user?.avatar || ''
  return buildMeTabHTML(user, profile, posts, selfAvatar)
}

function renderMeTabPage(page, container, html) {
  container.innerHTML = html
  if (isWechatRolePhoneMode(page)) {
    container.querySelector('#btn-role-phone-view-moments')?.addEventListener('click', () => loadWechatRolePhoneMoments(page))
    container.querySelector('#role-phone-following-stat')?.addEventListener('click', () => loadWechatRolePhoneMoments(page))
    container.querySelector('#btn-role-phone-wallet')?.addEventListener('click', () => {
      window.openRolePhoneWalletPage?.(_wechatRolePhoneSession)
    })
    return
  }
  container.querySelector('#btn-me-edit-profile').addEventListener('click', () => showEditProfileStatsSheet(page))
  container.querySelector('#btn-me-view-profile').addEventListener('click', () => openWechatSelfProfilePage(page))
  container.querySelector('#btn-wallet-row').addEventListener('click', () => openWechatWalletPage())
  container.querySelector('#btn-favorites-row').addEventListener('click', () => openWechatFavoritesPage())
  container.querySelector('#btn-stickers-row').addEventListener('click', () => openStickerLibraryPage())
  container.querySelector('#btn-plugin-row').addEventListener('click', () => openThoughtPresetsPage())
  container.querySelector('#btn-beauty-row').addEventListener('click', () => openChatBeautyPresetsPage())
  container.querySelector('#btn-account-switch-row').addEventListener('click', () => openWechatAccountSwitchPage())
}

async function buildRolePhoneMeTabStateHTML() {
  const session = _wechatRolePhoneSession
  const charId = session?.charId || _wechatUid
  const ownerUid = session?.ownerUid
  const char = await getWechatDisplayCharacter(charId, ownerUid)
  if (!char) return '<div class="list-empty">角色不存在</div>'
  const momentsProfile = await getWechatContactMomentsProfileForOwner(ownerUid, charId)
  const stats = await getWechatContactProfileStatsForOwner(ownerUid, charId)
  const posts = await countScopedMoments(charId, ownerUid)
  const groupName = await getPrivateChatGroupNameForOwner(ownerUid, charId)
  return buildRolePhoneMeTabHTML(char, momentsProfile, stats, posts, groupName)
}

async function getWechatContactProfileStatsForOwner(ownerUid, charId) {
  const key = getWechatContactProfileStatsKey(ownerUid, charId)
  const row = await db.config.get(key)
  if (row?.value && Number.isFinite(parseInt(row.value.followers, 10)) && Number.isFinite(parseInt(row.value.following, 10))) {
    return {
      followers: parseInt(row.value.followers, 10),
      following: parseInt(row.value.following, 10)
    }
  }
  const value = {
    followers: 2 + Math.floor(Math.random() * 999),
    following: 2 + Math.floor(Math.random() * 999)
  }
  await db.config.put({ key, value })
  return value
}

function buildRolePhoneMeTabHTML(char, momentsProfile, stats, posts, groupName) {
  const name = getWechatDisplayName(char)
  const account = char?.identity?.account || '未设置'
  const avatar = buildCharacterAvatarHTML(char)
  const bio = String(momentsProfile?.bio || '').trim()
  const bioHtml = bio ? `<div class="me-bio">${wcEscHtml(bio.slice(0, 120))}</div>` : ''
  return `
    <div class="me-profile-page contact-profile-scroll">
      <div class="me-hero">
        <div class="me-hero-top">
          <div class="me-avatar">${avatar}</div>
          <div class="me-info-stack">
            <div class="me-name">${wcEscHtml(name)}</div>
            <div class="me-stats">
              <div class="me-stat"><strong>${posts}</strong><span>Posts</span></div>
              <div class="me-stat"><strong>${stats.followers}</strong><span>Followers</span></div>
              <button class="me-stat" id="role-phone-following-stat" type="button"><strong>${stats.following}</strong><span>Following</span></button>
            </div>
          </div>
        </div>
        <div class="me-wechat-id">@${wcEscHtml(account)}</div>
        ${bioHtml}
        <div class="me-actions">
          <button class="me-action-btn me-action-primary" id="btn-role-phone-view-moments" type="button">Following</button>
          <button class="me-action-btn" type="button">Message</button>
        </div>
      </div>
      <div class="me-menu contact-profile-menu">
        <button class="me-menu-row contact-group-row" id="btn-role-phone-wallet" type="button">
          <span class="me-menu-icon"><i class="fa-solid fa-credit-card"></i></span>
          <span class="me-menu-label">微信支付</span>
        </button>
        <button class="me-menu-row contact-group-row" type="button">
          <span class="me-menu-icon"><i class="fa-solid fa-cube"></i></span>
          <span class="me-menu-label">我的收藏</span>
        </button>
      </div>
    </div>
  `
}

// 我Tab的HTML
function buildMeTabHTML(user, profile, posts, selfAvatar) {
  const name = user?.nick || user?.name || '未知用户'
  const account = user?.identity?.account || '未设置'
  const bio = String(profile?.bio || '').trim()
  const avatar = buildWechatSelfAvatarHTML(selfAvatar, name)
  const followers = Number.isFinite(parseInt(profile?.followers, 10)) ? parseInt(profile.followers, 10) : 520
  const following = Number.isFinite(parseInt(profile?.following, 10)) ? parseInt(profile.following, 10) : 162
  const bioHtml = bio ? `<div class="me-bio">${wcEscHtml(bio)}</div>` : ''
  return `
    <div class="me-profile-page">
      <div class="me-hero">
        <div class="me-hero-top">
          <div class="me-avatar">${avatar}</div>
          <div class="me-info-stack">
            <div class="me-name">${wcEscHtml(name)}</div>
            <div class="me-stats">
              <div class="me-stat"><strong>${posts}</strong><span>Posts</span></div>
              <div class="me-stat"><strong>${followers}</strong><span>Followers</span></div>
              <div class="me-stat"><strong>${following}</strong><span>Following</span></div>
            </div>
          </div>
        </div>
        <div class="me-wechat-id">@${wcEscHtml(account)}</div>
        ${bioHtml}
        <div class="me-actions">
          <button class="me-action-btn me-action-primary" id="btn-me-edit-profile" type="button">Edit Profile</button>
          <button class="me-action-btn" id="btn-me-view-profile" type="button">View Profile</button>
        </div>
      </div>
      <div class="me-menu">
        ${buildMeMenuRow('btn-wallet-row', 'fa-solid fa-credit-card', '微信支付')}
        ${buildMeMenuRow('btn-favorites-row', 'fa-solid fa-cube', '我的收藏')}
        ${buildMeMenuRow('btn-stickers-row', 'fa-solid fa-icons', '表情')}
        ${buildMeMenuRow('btn-plugin-row', 'fa-solid fa-heart-circle-bolt', '插件')}
        ${buildMeMenuRow('btn-beauty-row', 'fa-solid fa-wand-sparkles', '美化')}
        <button class="me-menu-row me-switch-row" id="btn-account-switch-row" type="button">
          <span class="me-menu-label is-danger">切换账号</span>
        </button>
      </div>
    </div>
  `
}

function buildMeMenuRow(id, icon, label, danger = false, showArrow = true) {
  return `
    <button class="me-menu-row${danger ? ' is-danger-row' : ''}" id="${id}" type="button">
      <span class="me-menu-icon"><i class="${icon}"></i></span>
      <span class="me-menu-label${danger ? ' is-danger' : ''}">${label}</span>
      ${showArrow ? '<i class="fa fa-angle-right me-menu-arrow"></i>' : ''}
    </button>
  `
}

async function openWechatFavoritesPage() {
  if (!_wechatUid) {
    window.toast && window.toast('请先登录')
    return
  }
  const old = document.getElementById('wechat-favorites-page')
  if (old) old.remove()
  const page = document.createElement('div')
  page.id = 'wechat-favorites-page'
  page.className = 'full-page wechat-favorites-page'
  page.innerHTML = `
    <div class="page-header">
      <button class="header-back" id="btn-wfp-back"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">我的收藏</span>
      <span class="wfp-header-spacer"></span>
    </div>
    <div class="wfp-search-wrap">
      <div class="contacts-search-field">
        <i class="fi fi-rr-search contacts-search-icon"></i>
        <input class="contacts-search-input" id="wfp-search-input" placeholder="搜索收藏" />
      </div>
    </div>
    <div class="wfp-category-tabs">
      <button class="wfp-category-tab active" data-category="chat" type="button">聊天记录</button>
      <button class="wfp-category-tab" data-category="thought" type="button">心声</button>
    </div>
    <div class="wfp-list" id="wfp-list"></div>
  `
  page._wfpActiveCategory = 'chat'
  window.openPage(page)
  page.querySelector('#btn-wfp-back').addEventListener('click', () => window.closePage('wechat-favorites-page'))
  page.querySelector('#wfp-search-input').addEventListener('input', () => renderWechatFavoritesPage(page))
  page.querySelectorAll('.wfp-category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      page.querySelectorAll('.wfp-category-tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      page._wfpActiveCategory = tab.dataset.category
      renderWechatFavoritesPage(page)
    })
  })
  await renderWechatFavoritesPage(page)
}

async function renderWechatFavoritesPage(page) {
  const list = page?.querySelector('#wfp-list')
  if (!list) return
  const category = page._wfpActiveCategory || 'chat'
  const kw = (page.querySelector('#wfp-search-input')?.value || '').trim().toLowerCase()

  if (category === 'thought') {
    const allItems = (await getWechatFavorites()).filter(item => item.category === 'thought')
    const items = kw ? allItems.filter(item => matchWechatFavoriteSearch(item, kw)) : allItems
    page._wechatFavoritesItems = items
    list.innerHTML = items.length
      ? items.sort((a, b) => (b.favoritedAt || 0) - (a.favoritedAt || 0)).map(buildThoughtFavoriteRowHTML).join('')
      : buildWechatFavoritesEmptyHTML(kw)
    bindThoughtFavoriteRowActions(page)
    return
  }

  const allItems = (await getWechatFavorites())
    .filter(item => item.category !== 'thought')
    .map(item => ({ category: 'chat', ...item }))
  const items = kw ? allItems.filter(item => matchWechatFavoriteSearch(item, kw)) : allItems
  page._wechatFavoritesItems = items
  const groups = groupWechatFavoritesBySource(items)
  list.innerHTML = groups.length
    ? groups.map(buildWechatFavoriteGroupHTML).join('')
    : buildWechatFavoritesEmptyHTML(kw)
  bindWechatFavoriteRowActions(page)
}

function buildThoughtFavoriteRowHTML(item) {
  const time = formatWechatSmartTime(item.createdAt, { todayPrefix: true })
  const preview = (item.content || '').replace(/\s+/g, ' ').trim()
  const previewText = preview.length > 60 ? preview.slice(0, 60) + '...' : preview
  return `
    <div class="wfp-thought-item" data-id="${wcEscHtml(item.id)}" role="button" tabindex="0">
      <div class="wfp-thought-main">
        <div class="wfp-thought-meta">
          <span class="wfp-thought-source">${wcEscHtml(item.senderName || '角色')}</span>
          <span class="wfp-origin-time">${wcEscHtml(time)}</span>
        </div>
        <div class="wfp-thought-preview">${wcEscHtml(previewText || '心声')}</div>
      </div>
      <button class="wfp-delete" data-action="delete-thought-fav" type="button" aria-label="取消收藏">
        <i class="fa fa-trash"></i>
      </button>
    </div>
  `
}

function bindThoughtFavoriteRowActions(page) {
  page.querySelectorAll('.wfp-thought-item').forEach(row => {
    row.addEventListener('click', () => {
      const item = getWechatFavoriteItemFromPage(page, row.dataset.id)
      if (item) showThoughtFavoriteDetail(item)
    })
  })
  page.querySelectorAll('[data-action="delete-thought-fav"]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.preventDefault()
      e.stopPropagation()
      const id = btn.closest('.wfp-thought-item')?.dataset.id
      if (!id) return
      await deleteWechatFavorite(id)
      await renderWechatFavoritesPage(page)
      window.toast && window.toast('已取消收藏')
    })
  })
}

function showThoughtFavoriteDetail(item) {
  const renderedHtml = item.parsedData?.renderedHtml || wcEscHtml(item.content || '')
  const time = formatWechatSmartTime(item.createdAt, { todayPrefix: true })
  const sheet = wcMakeSheet(`
    <div class="sheet-title">${wcEscHtml(item.senderName || '角色')}的心声</div>
    <div class="wfp-thought-detail">
      <div class="wfp-thought-detail-time">${wcEscHtml(time)}</div>
      <div class="wfp-thought-detail-content thought-card-scroll">${renderedHtml}</div>
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="wfp-thought-detail-close" type="button">关闭</button>
    </div>
  `)
  wcShowSheetNoConfirm(sheet)
  sheet.querySelector('#wfp-thought-detail-close').addEventListener('click', () => closeWcSheetCore(sheet._wcOverlay, sheet))
}

function buildWechatFavoritesEmptyHTML(keyword = '') {
  return `
    <div class="wfp-empty">
      <i class="fa-solid fa-cube wfp-empty-icon"></i>
      <div class="wfp-empty-title">${keyword ? '未找到相关收藏' : '暂无收藏'}</div>
    </div>
  `
}

function matchWechatFavoriteSearch(item, keyword) {
  const haystack = [
    item.sourceTitle,
    item.senderName,
    item.content,
    getWechatFavoriteSummaryText(item)
  ].join('\n').toLowerCase()
  return haystack.includes(keyword)
}

function groupWechatFavoritesBySource(items) {
  const map = new Map()
  items.forEach(item => {
    const key = `${item.scope || 'chat'}:${item.sourceId || 0}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        scope: item.scope || 'chat',
        title: item.sourceTitle || (item.scope === 'group' ? '群聊' : '聊天'),
        items: []
      })
    }
    map.get(key).items.push(item)
  })
  return [...map.values()]
    .map(group => ({
      ...group,
      items: group.items.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
      latestAt: Math.max(...group.items.map(item => item.createdAt || 0))
    }))
    .sort((a, b) => (b.latestAt || 0) - (a.latestAt || 0))
}

function buildWechatFavoriteGroupHTML(group) {
  return `
    <section class="wfp-group">
      <div class="wfp-group-title">
        <span>${wcEscHtml(group.title)}</span>
        <span>${group.items.length}</span>
      </div>
      <div class="wfp-group-list">
        ${group.items.map(buildWechatFavoriteRowHTML).join('')}
      </div>
    </section>
  `
}

function buildWechatFavoriteRowHTML(item) {
  return `
    <div class="wfp-item" data-id="${wcEscHtml(item.id)}" role="button" tabindex="0">
      <div class="wfp-item-main">
        <div class="wfp-item-meta">
          <span class="wfp-item-source">${wcEscHtml(item.senderName || '未知')}</span>
          <span class="wfp-origin-time">${wcEscHtml(formatWechatSmartTime(item.createdAt, { todayPrefix: true }))}</span>
        </div>
        ${buildWechatFavoritePreviewHTML(item)}
      </div>
      <button class="wfp-delete" data-action="delete-favorite" type="button" aria-label="删除收藏">
        <i class="fa fa-trash"></i>
      </button>
    </div>
  `
}

function buildWechatFavoritePreviewHTML(item) {
  const type = item.parsedType || 'text'
  const data = item.parsedData || {}
  if (type === 'real-photo' || type === 'photo') {
    return `
      <div class="wfp-media-preview">
        ${item.previewImage ? `<img src="${wcEscHtml(item.previewImage)}" alt="收藏图片" loading="lazy">` : '<div class="wfp-media-placeholder"><i class="fa fa-image"></i></div>'}
        <div class="wfp-media-text">${wcEscHtml(type === 'photo' ? (data.desc || '照片') : '图片')}</div>
      </div>
    `
  }
  if (type === 'sticker') {
    return `
      <div class="wfp-media-preview">
        ${item.stickerImage || item.previewImage ? `<img src="${wcEscHtml(item.stickerImage || item.previewImage)}" alt="${wcEscHtml(data.name || '表情')}" loading="lazy">` : '<div class="wfp-media-placeholder"><i class="fa fa-smile-o"></i></div>'}
        <div class="wfp-media-text">表情：${wcEscHtml(data.name || '')}</div>
      </div>
    `
  }
  return `<div class="wfp-text-preview">${wcEscHtml(getWechatFavoriteSummaryText(item))}</div>`
}

function getWechatFavoriteSummaryText(item) {
  const data = item.parsedData || {}
  switch (item.parsedType) {
    case 'text': return data.text || item.content || ''
    case 'voice': return `语音：${data.text || ''}`
    case 'quote': return `${data.reply || ''}\n引用：${data.speaker ? `${data.speaker}：` : ''}${data.quoted || ''}`
    case 'transfer-recv': return `转账 ¥ ${data.amount || ''}${data.note ? `｜${data.note}` : ''}`
    case 'transfer-resp': return data.accepted ? '已接收转账' : '已退回转账'
    case 'location': return `位置：${data.place || ''}${data.dist ? `｜距你约 ${data.dist}` : ''}`
    case 'link': return buildLinkFallbackText(data)
    case 'recall': return `撤回消息：${data.recalled || ''}`
    default: return item.content || ''
  }
}

function bindWechatFavoriteRowActions(page) {
  page.querySelectorAll('.wfp-item').forEach(row => {
    row.addEventListener('click', () => {
      const item = getWechatFavoriteItemFromPage(page, row.dataset.id)
      if (item) showWechatFavoriteDetail(item)
    })
    row.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      const item = getWechatFavoriteItemFromPage(page, row.dataset.id)
      if (item) showWechatFavoriteDetail(item)
    })
  })
  page.querySelectorAll('[data-action="delete-favorite"]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.preventDefault()
      e.stopPropagation()
      const id = btn.closest('.wfp-item')?.dataset.id
      if (!id) return
      await deleteWechatFavorite(id)
      await renderWechatFavoritesPage(page)
      window.toast && window.toast('已删除')
    })
  })
}

function getWechatFavoriteItemFromPage(page, id) {
  return page?._wechatFavoritesItems?.find(item => item.id === id) || null
}

function showWechatFavoriteDetail(item) {
  const mediaHtml = buildWechatFavoriteDetailMediaHTML(item)
  const text = getWechatFavoriteSummaryText(item)
  const source = item.scope === 'group'
    ? `${item.sourceTitle || '群聊'} · ${item.senderName || '未知'}`
    : `${item.sourceTitle || '聊天'} · ${item.senderName || '未知'}`
  const sheet = wcMakeSheet(`
    <div class="sheet-title">收藏内容</div>
    <div class="wfp-detail">
      <div class="wfp-detail-meta">${wcEscHtml(source)}</div>
      <div class="wfp-detail-time">${wcEscHtml(formatWechatSmartTime(item.createdAt, { todayPrefix: true }))}</div>
      ${mediaHtml}
      <div class="wfp-detail-text">${wcEscHtml(text || item.content || '')}</div>
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="wfp-detail-close" type="button">关闭</button>
    </div>
  `)
  wcShowSheetNoConfirm(sheet)
  sheet.querySelector('#wfp-detail-close').addEventListener('click', () => closeWcSheetCore(sheet._wcOverlay, sheet))
}

function buildWechatFavoriteDetailMediaHTML(item) {
  if (item.parsedType !== 'real-photo' && item.parsedType !== 'photo' && item.parsedType !== 'sticker') return ''
  const src = item.previewImage || item.stickerImage || ''
  if (!src) return ''
  return `<div class="wfp-detail-media"><img src="${wcEscHtml(src)}" alt="收藏内容" loading="lazy"></div>`
}

async function deleteWechatFavorite(id) {
  const items = await getWechatFavorites()
  await saveWechatFavorites(items.filter(item => item.id !== id))
}

async function showEditProfileStatsSheet(wechatPage) {
  const profile = await getWechatSelfProfile()
  const posts = _wechatUid ? await countScopedMoments(_wechatUid, _wechatUid) : 0
  const followers = Number.isFinite(parseInt(profile.followers, 10)) ? parseInt(profile.followers, 10) : 520
  const following = Number.isFinite(parseInt(profile.following, 10)) ? parseInt(profile.following, 10) : 162
  const sheet = wcMakeSheet(`
    <div class="sheet-title">Edit Profile</div>
    <div class="me-stats-editor">
      <label class="me-profile-field">
        <span>Posts</span>
        <input class="input-field" value="${posts}" disabled>
      </label>
      <label class="me-profile-field">
        <span>Followers</span>
        <input class="input-field" id="me-followers-input" inputmode="numeric" value="${followers}">
      </label>
      <label class="me-profile-field">
        <span>Following</span>
        <input class="input-field" id="me-following-input" inputmode="numeric" value="${following}">
      </label>
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-save-me-stats">保存</button>
    </div>
  `)
  wcShowSheet(sheet, async () => {
    const nextFollowers = Math.max(0, parseInt(sheet.querySelector('#me-followers-input').value, 10) || 0)
    const nextFollowing = Math.max(0, parseInt(sheet.querySelector('#me-following-input').value, 10) || 0)
    await saveWechatSelfProfile({ followers: nextFollowers, following: nextFollowing })
    await loadMeTab(wechatPage, wechatPage.querySelector('#wechat-content'))
  })
}

async function openWechatSelfProfilePage(wechatPage) {
  const profile = await getWechatSelfProfile()
  const user = _wechatUser
  const name = user?.nick || user?.name || ''
  const account = user?.identity?.account || ''
  const avatar = profile.avatar || user?.avatar || ''
  const page = document.createElement('div')
  page.id = 'wechat-self-profile-page'
  page.className = 'full-page wechat-self-profile-page'
  page.innerHTML = buildWechatSelfProfilePageHTML(user, profile, avatar)
  window.openPage(page)

  page.querySelector('#btn-wsp-back').addEventListener('click', async () => {
    const ok = await saveWechatSelfProfilePage(page, wechatPage, true)
    if (ok) window.closePage('wechat-self-profile-page')
  })
  page.querySelector('#btn-wsp-save').addEventListener('click', async () => {
    await saveWechatSelfProfilePage(page, wechatPage, false)
  })
  page.querySelector('#wsp-avatar-button').addEventListener('click', () => {
    window.showImagePicker((result) => {
      const value = result || ''
      page.querySelector('#wsp-avatar-value').value = value
      page.querySelector('#wsp-avatar-button').innerHTML = buildWechatSelfAvatarHTML(value || avatar, name || account || '我')
    })
  })
}

function buildWechatSelfProfilePageHTML(user, profile, avatar) {
  const name = user?.nick || user?.name || ''
  const account = user?.identity?.account || ''
  const avatarHtml = buildWechatSelfAvatarHTML(avatar, name || account || '我')
  return `
    <div class="page-header">
      <button class="header-back" id="btn-wsp-back"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">View Profile</span>
      <button class="btn-icon" id="btn-wsp-save" title="保存"><i class="fa fa-check"></i></button>
    </div>
    <div class="wsp-scroll">
      <button class="wsp-avatar" id="wsp-avatar-button" type="button">${avatarHtml}</button>
      <input type="hidden" id="wsp-avatar-value" value="${wcEscHtml(profile.avatar || '')}">
      <label class="me-profile-field">
        <span>微信昵称</span>
        <input class="input-field" id="wsp-nick-input" value="${wcEscHtml(name)}" placeholder="微信昵称">
      </label>
      <label class="me-profile-field">
        <span>微信号</span>
        <input class="input-field" id="wsp-account-input" value="${wcEscHtml(account)}" placeholder="微信号">
      </label>
      <label class="me-profile-field">
        <span>个性签名</span>
        <textarea class="input-field" id="wsp-bio-input" rows="4" placeholder="输入你的个性签名…">${wcEscHtml(profile.bio || '')}</textarea>
      </label>
    </div>
  `
}

async function saveWechatSelfProfilePage(page, wechatPage, silent) {
  const nick = page.querySelector('#wsp-nick-input').value.trim()
  const account = page.querySelector('#wsp-account-input').value.trim()
  const bio = page.querySelector('#wsp-bio-input').value.trim()
  const avatar = page.querySelector('#wsp-avatar-value').value.trim()

  if (account && !/^[a-zA-Z0-9_\-\.!@#$%^&*()]+$/.test(account)) {
    window.toast('微信号只能包含英文字母、数字和英文字符')
    return false
  }
  if (account) {
    const users = await db.characters.where('type').equals('user').toArray()
    const duplicate = users.find(u => u.id !== _wechatUid && u.identity?.account === account)
    if (duplicate) {
      window.toast('该微信号已被其他用户使用')
      return false
    }
  }

  const currentIdentity = _wechatUser?.identity || {}
  await db.characters.update(_wechatUid, {
    nick,
    identity: { ...currentIdentity, account }
  })
  await saveWechatSelfProfile({ avatar, bio })
  if (window.refreshCharCache) await window.refreshCharCache(_wechatUid)
  _wechatUser = await db.characters.get(_wechatUid)
  notifyWechatOnlineIdentityChanged()
  await refreshWechatSelfSurfaces(wechatPage)
  if (!silent) window.toast('个人资料已保存')
  return true
}

async function refreshWechatSelfSurfaces(wechatPage) {
  if (wechatPage && document.body.contains(wechatPage)) {
    const activeTab = wechatPage.querySelector('.wechat-tab.active')?.dataset.tab
    if (activeTab === 'me') await loadMeTab(wechatPage, wechatPage.querySelector('#wechat-content'))
  }
  const chatWindow = document.getElementById('chat-window')
  if (chatWindow) {
    const groupId = parseInt(chatWindow.dataset.groupId)
    const chatId = parseInt(chatWindow.dataset.chatId)
    if (groupId) {
      const group = await getWechatAccessibleGroup(groupId)
      if (group) await loadGroupMessages(chatWindow, groupId, group, { force: true })
    } else if (chatId) {
      await refreshChat(chatWindow, { force: true })
    }
  }
}

async function openWechatAccountSwitchPage() {
  const old = document.getElementById('wechat-account-switch-page')
  if (old) old.remove()
  const page = document.createElement('div')
  page.id = 'wechat-account-switch-page'
  page.className = 'full-page wechat-account-switch-page'
  page._wechatSwitchAccounts = []
  page._wechatSwitchUsers = null
  page._wechatSwitchManaging = false
  page.innerHTML = buildWechatAccountSwitchPageHTML([])
  window.openPage(page)
  bindWechatAccountSwitchPageEvents(page)
  loadWechatSwitchAccounts(page)
}

function buildWechatAccountSwitchPageHTML(accounts) {
  return `
    <button class="was-back" id="btn-was-back" type="button" aria-label="返回">
      <i class="fa fa-angle-left"></i>
    </button>
    <button class="was-manage" id="btn-was-manage" type="button">管理</button>
    <div class="was-center">
      <div class="was-card-list" id="was-card-list">${buildWechatSwitchAccountListHTML(accounts, false)}</div>
    </div>
    ${buildWechatSwitchLoginModalHTML()}
  `
}

function buildWechatSwitchAccountListHTML(accounts, managing) {
  return `
    <button class="was-row was-add-row" id="was-add-account" type="button">
      <span class="was-plus-icon"><i class="fa-solid fa-plus"></i></span>
      <span class="was-row-main">
        <span class="was-row-name">切换账号</span>
      </span>
    </button>
    ${accounts.map(user => buildWechatSwitchAccountRowHTML(user, managing)).join('')}
  `
}

function buildWechatSwitchAccountRowHTML(user, managing = false) {
  const name = user?.nick || user?.name || '微信用户'
  const account = user?.identity?.account || '未设置微信号'
  const avatar = buildWechatSelfAvatarHTML(user?._switchAvatar || user?.avatar || '', name)
  const isCurrent = parseInt(user?.id) === parseInt(_wechatUid)
  return `
    <button class="was-row${isCurrent ? ' is-current' : ''}" data-switch-uid="${wcEscHtml(user.id)}" type="button">
      <span class="was-avatar">${avatar}</span>
      <span class="was-row-main">
        <span class="was-row-name">${wcEscHtml(name)}</span>
        <span class="was-row-account">@${wcEscHtml(account)}</span>
      </span>
      ${managing && !isCurrent
        ? '<span class="was-delete-mark" aria-hidden="true"><i class="fa fa-minus"></i></span>'
        : isCurrent ? '<i class="fa fa-check was-current-mark"></i>' : ''}
    </button>
  `
}

function buildWechatSwitchLoginModalHTML() {
  return `
    <div class="was-modal-overlay" id="was-login-modal" style="display:none">
      <div class="was-modal-box">
        <div class="wl-modal-title">切换账号</div>
        <div class="wl-modal-sub">输入微信号和微信密码</div>
        <input type="text" id="was-login-account" class="wl-modal-input" placeholder="微信号" autocomplete="off" autocorrect="off" autocapitalize="off">
        <input type="password" id="was-login-password" class="wl-modal-input" placeholder="微信密码" autocomplete="off">
        <div id="was-login-error" class="wl-recover-error" style="display:none"></div>
        <button class="was-recover-toggle" id="was-recover-toggle" type="button">找回账号</button>
        <div id="was-recover-list" class="was-recover-list" style="display:none"></div>
        <div class="wl-modal-btns">
          <button class="wl-modal-btn-cancel" id="was-login-cancel" type="button">取消</button>
          <button class="wl-modal-btn-ok" id="was-login-submit" type="button">登录</button>
        </div>
      </div>
    </div>
  `
}

function bindWechatAccountSwitchPageEvents(page) {
  page.querySelector('#btn-was-back').addEventListener('click', () => window.closePage('wechat-account-switch-page'))
  page.querySelector('#btn-was-manage').addEventListener('click', () => toggleWechatSwitchManageMode(page))
  bindWechatSwitchListEvents(page)
  page.querySelector('#was-login-cancel').addEventListener('click', () => hideWechatSwitchLoginModal(page))
  page.querySelector('#was-login-submit').addEventListener('click', () => submitWechatSwitchLogin(page))
  page.querySelector('#was-recover-toggle').addEventListener('click', () => toggleWechatSwitchRecoverList(page))
  page.querySelector('#was-login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitWechatSwitchLogin(page)
  })
}

function bindWechatSwitchListEvents(page) {
  page.querySelector('#was-add-account').addEventListener('click', () => showWechatSwitchLoginModal(page))
  page.querySelectorAll('[data-switch-uid]').forEach(row => {
    row.addEventListener('click', async () => {
      const uid = parseInt(row.dataset.switchUid)
      const user = page._wechatSwitchAccounts?.find(item => parseInt(item.id) === uid)
      if (!user) return
      if (page._wechatSwitchManaging) {
        if (uid === parseInt(_wechatUid)) return
        await confirmDeleteWechatSwitchAccount(page, user)
        return
      }
      if (uid === parseInt(_wechatUid)) {
        window.closePage('wechat-account-switch-page')
        return
      }
      await switchWechatAccountTo(user)
    })
  })
}

async function loadWechatSwitchAccounts(page) {
  const accounts = await getWechatSwitchAccounts()
  if (!page.isConnected) return
  page._wechatSwitchAccounts = accounts.map(user => ({
    ...user,
    _switchAvatar: user?.avatar || ''
  }))
  renderWechatSwitchAccountList(page)
}

async function ensureWechatSwitchUsersLoaded(page) {
  if (Array.isArray(page._wechatSwitchUsers)) return page._wechatSwitchUsers
  const users = await getWechatUserAccounts()
  if (page.isConnected) page._wechatSwitchUsers = users
  return users
}

function renderWechatSwitchAccountList(page) {
  const list = page.querySelector('#was-card-list')
  if (!list) return
  list.innerHTML = buildWechatSwitchAccountListHTML(page._wechatSwitchAccounts || [], !!page._wechatSwitchManaging)
  bindWechatSwitchListEvents(page)
}

function toggleWechatSwitchManageMode(page) {
  page._wechatSwitchManaging = !page._wechatSwitchManaging
  const manageBtn = page.querySelector('#btn-was-manage')
  if (manageBtn) manageBtn.textContent = page._wechatSwitchManaging ? '完成' : '管理'
  page.classList.toggle('is-managing', !!page._wechatSwitchManaging)
  renderWechatSwitchAccountList(page)
}

async function confirmDeleteWechatSwitchAccount(page, user) {
  const name = user?.nick || user?.name || user?.identity?.account || '这个账号'
  const ok = confirm(`确认删除“${name}”吗？\n\n删除后，这个账号会从可切换账号列表移除，相关绑定记录将不再显示；如需再次使用，需要重新输入账号和密码登录。`)
  if (!ok) return
  removeWechatSwitchAccount(user.id)
  page._wechatSwitchAccounts = (page._wechatSwitchAccounts || []).filter(item => parseInt(item.id) !== parseInt(user.id))
  renderWechatSwitchAccountList(page)
  window.toast && window.toast('已删除账号')
}

function showWechatSwitchLoginModal(page) {
  const modal = page.querySelector('#was-login-modal')
  page.querySelector('#was-login-account').value = ''
  page.querySelector('#was-login-password').value = ''
  page.querySelector('#was-login-error').style.display = 'none'
  page.querySelector('#was-recover-list').style.display = 'none'
  modal.style.display = 'flex'
  setTimeout(() => page.querySelector('#was-login-account')?.focus(), 0)
}

function hideWechatSwitchLoginModal(page) {
  page.querySelector('#was-login-modal').style.display = 'none'
}

async function submitWechatSwitchLogin(page) {
  const accountInput = page.querySelector('#was-login-account')
  const passwordInput = page.querySelector('#was-login-password')
  const errorEl = page.querySelector('#was-login-error')
  const submitBtn = page.querySelector('#was-login-submit')
  const account = (accountInput?.value || '').trim()
  const password = (passwordInput?.value || '').trim()
  errorEl.style.display = 'none'
  if (!account || !password) {
    errorEl.textContent = '请输入微信号和密码'
    errorEl.style.display = 'block'
    return
  }
  submitBtn.textContent = '登录中...'
  submitBtn.disabled = true
  try {
    const users = await ensureWechatSwitchUsersLoaded(page)
    const matched = users.find(user =>
      user.identity?.account === account && user.identity?.password === password
    )
    if (!matched) {
      errorEl.textContent = '微信号或密码错误'
      errorEl.style.display = 'block'
      submitBtn.textContent = '登录'
      submitBtn.disabled = false
      return
    }
    await switchWechatAccountTo(matched)
  } catch (e) {
    errorEl.textContent = '登录失败，请重试'
    errorEl.style.display = 'block'
    submitBtn.textContent = '登录'
    submitBtn.disabled = false
  }
}

function toggleWechatSwitchRecoverList(page) {
  const list = page.querySelector('#was-recover-list')
  if (list.style.display === 'block') {
    list.style.display = 'none'
    return
  }
  list.innerHTML = '<div class="was-recover-empty">加载中...</div>'
  list.style.display = 'block'
  renderWechatSwitchRecoverList(page)
}

async function renderWechatSwitchRecoverList(page) {
  const users = await ensureWechatSwitchUsersLoaded(page)
  if (!page.isConnected) return
  const knownIds = new Set(getWechatSwitchUidList())
  const available = users.filter(user => !knownIds.has(parseInt(user.id)))
  const list = page.querySelector('#was-recover-list')
  if (!list) return
  list.innerHTML = available.length
    ? available.map(user => {
        const name = user?.nick || user?.name || '微信用户'
        const account = user?.identity?.account || ''
        const password = user?.identity?.password || ''
        return `
          <button class="was-recover-row" data-recover-account="${wcEscHtml(account)}" data-recover-password="${wcEscHtml(password)}" type="button">
            <span>${wcEscHtml(name)}</span>
            <span>${account ? '@' + wcEscHtml(account) : '未设置微信号'}</span>
          </button>
        `
      }).join('')
    : '<div class="was-recover-empty">暂无可找回账号</div>'
  list.querySelectorAll('[data-recover-account]').forEach(row => {
    row.addEventListener('click', () => {
      page.querySelector('#was-login-account').value = row.dataset.recoverAccount || ''
      page.querySelector('#was-login-password').value = row.dataset.recoverPassword || ''
      page.querySelector('#was-login-password').focus()
    })
  })
}

async function switchWechatAccountTo(user) {
  setWechatSession(user)
  removeWechatPageNow('wechat-account-switch-page')
  removeWechatPageNow('wechat-login-page')
  removeWechatPageNow('wechat-page')
  removeWechatPageNow('chat-window')
  removeWechatPageNow('group-settings-page')
  removeWechatPageNow('group-admin-settings-page')
  const mainPage = buildWechatMainPage()
  window.openPage(mainPage)
  enterWechatMainPage(mainPage)
  window.toast && window.toast('已切换账号')
}

function removeWechatPageNow(id) {
  const page = document.getElementById(id)
  if (page) page.remove()
}

// 退出登录
function doLogout() {
  if (!confirm('确认退出微信登录？')) return
  clearWechatSession()
  window.closePage('wechat-page')
  window.toast('已退出登录')
}


// ===== 群聊：创建群聊弹窗 =====
async function showCreateGroupModal(wechatPage) {
  const rawChars = await db.characters.where('type').notEqual('user').toArray()
  const chars = (await Promise.all(rawChars.map(c => getWechatDisplayCharacter(c.id)))).filter(Boolean)
  const selected = new Set()
  const sheet = wcMakeSheet(buildCreateGroupHTML(chars))
  bindCreateGroupEvents(sheet, selected, wechatPage)
  wcShowSheetNoConfirm(sheet)
}

// 创建群聊HTML
function buildCreateGroupHTML(chars) {
  return `
    <div class="sheet-handle"></div>
    <div class="sheet-title">创建群聊</div>
    <div style="padding:0 16px 4px">
      <input class="input-field" id="group-name-input" placeholder="群聊名称">
    </div>
    <div class="group-member-select" id="group-member-select">
      ${chars.map(c => `
        <div class="member-select-row" data-id="${c.id}">
          <div class="chat-avatar" style="width:36px;height:36px">
            ${buildCharacterAvatarHTML(c)}
          </div>
          <span style="flex:1;font-size:14px">${wcEscHtml(getWechatDisplayName(c))}</span>
          <i class="fa fa-circle-o member-check"></i>
        </div>
      `).join('')}
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-confirm-group">创建（<span id="select-count">0</span>人）</button>
    </div>
  `
}


// 创建群聊事件绑定
function bindCreateGroupEvents(sheet, selected, wechatPage) {
  sheet.querySelectorAll('.member-select-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = parseInt(row.dataset.id)
      const checkEl = row.querySelector('.member-check')
      if (selected.has(id)) {
        selected.delete(id)
        checkEl.className = 'fa fa-circle-o member-check'
      } else {
        selected.add(id)
        checkEl.className = 'fa fa-check-circle member-check'
      }
      sheet.querySelector('#select-count').textContent = selected.size
    })
  })
  sheet.querySelector('#btn-confirm-group').addEventListener('click', async () => {
    if (selected.size < 1) { window.toast('至少选择1位成员'); return }
    await createGroup(sheet, selected, wechatPage)
  })
}

// 创建群聊
async function createGroup(sheet, selected, wechatPage) {
  const name = sheet.querySelector('#group-name-input').value.trim() || `群聊（${selected.size + 1}人）`
  await db.groupChats.add({
    name,
    ownerUid: _wechatUid,
    members: [...selected, _wechatUid],
    ownerId: _wechatUid,
    adminIds: [],
    avatar: '',
    createdAt: Date.now(),
    unread: 0
  })
  window.toast('群聊已创建')
  closeWcSheet(sheet)
  loadWechatTab(wechatPage, 'chats')
}


// 打开群聊窗口
async function openGroupChat(wechatPage, groupId) {
  const group = await normalizeGroupChat(await getWechatAccessibleGroup(groupId))
  if (!group) return
  removeCurrentChatWindowForPopup()
  const chatPage = document.createElement('div')
  chatPage.id = 'chat-window'
  chatPage.className = 'full-page chat-window-page'
  chatPage.dataset.groupId = groupId
  chatPage.innerHTML = buildGroupChatHTML(group)
  window.openPage(chatPage)
  loadGroupMessages(chatPage, groupId, group, { force: true, initialScrollToBottom: true })
  bindGroupChatEvents(chatPage, group)
}

// 群聊窗口HTML
function buildGroupChatHTML(group) {
  return `
    <div class="page-header chat-header">
      <button class="header-back" onclick="window.closeWechatChatWindow()">
        <i class="fa fa-angle-left"></i>
      </button>
      <div class="chat-header-info">
        <span class="chat-header-name">${wcEscHtml(group.name || '群聊')}</span>
        <span class="chat-header-sub">${group.members?.length || 0} Members</span>
      </div>
      <button class="btn-icon" id="btn-group-settings" type="button" aria-label="群聊设置"><i class="fa fa-ellipsis-h"></i></button>
    </div>
    <div class="chat-messages" id="chat-messages"></div>
    <div class="chat-input-area">
      ${buildQuoteComposerHTML()}
      <div class="group-mention-menu" id="group-mention-menu" style="display:none"></div>
      <div class="chat-input-bar">
        <button class="chat-reply-btn chat-action-reply" id="btn-chat-reply" type="button" aria-label="回复">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </button>
        <div class="chat-input-wrap">
          <textarea class="chat-input" id="chat-input" placeholder="发送消息..." rows="1"></textarea>
          <div class="chat-input-actions">
            <button class="chat-input-icon chat-action-voice" id="btn-chat-voice" type="button" aria-label="语音">${ICON_VOICE_SVG}</button>
            <button class="chat-input-icon chat-action-emoji" id="btn-chat-emoji" type="button" aria-label="表情">${ICON_EMOJI_SVG}</button>
            <button class="chat-input-icon chat-action-plus" id="btn-chat-plus" type="button" aria-label="更多">${ICON_PLUS_SVG}</button>
          </div>
        </div>
      </div>
      ${buildGroupPlusPanelHTML()}
      ${buildEmojiPanelHTML()}
    </div>
  `
}

// 群聊「+」附件菜单（镜像单聊，多一个红包；通话仅占位）
function buildGroupPlusPanelHTML() {
  return `
    <div class="chat-plus-panel" id="chat-plus-panel" style="display:none">
      <div class="plus-grid">
        <button class="plus-item" data-type="photo-sim">
          <div class="plus-icon"><i class="fa fa-camera"></i></div><span>拍照</span>
        </button>
        <button class="plus-item" data-type="photo-real">
          <div class="plus-icon"><i class="fa fa-image"></i></div><span>相册</span>
        </button>
        <button class="plus-item" data-type="transfer">
          <div class="plus-icon"><i class="fa fa-credit-card"></i></div><span>转账</span>
        </button>
        <button class="plus-item" data-type="redpacket">
          <div class="plus-icon"><i class="fa-solid fa-coins"></i></div><span>红包</span>
        </button>
        <button class="plus-item" data-type="location">
          <div class="plus-icon"><i class="fa-solid fa-location-dot"></i></div><span>位置</span>
        </button>
        <button class="plus-item" data-type="poll">
          <div class="plus-icon"><i class="fa-solid fa-square-poll-vertical"></i></div><span>投票</span>
        </button>
        <button class="plus-item" data-type="voice-call">
          <div class="plus-icon"><i class="fa-solid fa-phone"></i></div><span>语音通话</span>
        </button>
        <button class="plus-item" data-type="video-call">
          <div class="plus-icon"><i class="fa-solid fa-video"></i></div><span>视频通话</span>
        </button>
      </div>
    </div>`
}

// 群聊事件绑定
function bindGroupChatEvents(chatPage, group) {
  const input = chatPage.querySelector('#chat-input')
  bindQuoteComposer(chatPage)
  bindGroupMentionPicker(chatPage, group)

  // 仅发送，不触发 AI
  const send = () => sendGroupMessage(chatPage, group)

  // 魔法棒：如有文本先入库，再触发 AI 群回复
  const requestAIReply = async () => {
    if (input.value.trim().length > 0) {
      await sendGroupMessage(chatPage, group)
    }
    const groupId = parseInt(chatPage.dataset.groupId)
    startGroupAIReply(groupId, group, { allowMcp: true })
  }

  chatPage.querySelector('#btn-chat-reply').addEventListener('click', requestAIReply)
  chatPage.querySelector('#btn-group-settings').addEventListener('click', () => {
    openGroupSettings(parseInt(chatPage.dataset.groupId), chatPage, group)
  })
  input.addEventListener('keydown', e => {
    if (e.isComposing || e.keyCode === 229 || e.which === 229) return
    if (handleGroupMentionKeydown(chatPage, e)) return
    if (!isWanWanSendKeyEvent(e)) return
    e.preventDefault()
    send()
  })
  input.addEventListener('input', () => {
    input.style.height = 'auto'
    input.style.height = Math.min(input.scrollHeight, 120) + 'px'
  })

  // 「+」附件菜单 / 表情面板
  const plusBtn = chatPage.querySelector('#btn-chat-plus')
  const plusPanel = chatPage.querySelector('#chat-plus-panel')
  const emojiPanel = chatPage.querySelector('#chat-emoji-panel')
  const closeBothPanels = () => { plusPanel.style.display = 'none'; emojiPanel.style.display = 'none' }
  plusBtn.addEventListener('click', () => {
    const open = plusPanel.style.display !== 'none'
    emojiPanel.style.display = 'none'
    plusPanel.style.display = open ? 'none' : 'block'
    if (!open) input.blur()
  })
  // 语音
  chatPage.querySelector('#btn-chat-voice').addEventListener('click', () => {
    closeBothPanels()
    showVoiceInputSheet(chatPage)
  })
  // 表情
  chatPage.querySelector('#btn-chat-emoji').addEventListener('click', async () => {
    const isOpen = emojiPanel.style.display !== 'none'
    plusPanel.style.display = 'none'
    emojiPanel.style.display = isOpen ? 'none' : 'flex'
    if (!isOpen) { input.blur(); await renderEmojiPanel(chatPage) }
  })
  input.addEventListener('focus', () => closeBothPanels())
  chatPage.querySelectorAll('.plus-item').forEach(item => {
    item.addEventListener('click', () => {
      plusPanel.style.display = 'none'
      const t = item.dataset.type
      if (t === 'voice-call' || t === 'video-call') { window.toast?.('群聊暂不支持通话'); return }
      if (t === 'redpacket') { showGroupRedPacketSheet(chatPage, group); return }
      if (t === 'poll') { showGroupPollSheet(chatPage); return }
      handlePlusAction(chatPage, t)
    })
  })
}

function getGroupMentionQuery(input) {
  const cursor = input.selectionStart
  const before = input.value.slice(0, cursor)
  const match = before.match(/(^|[\s，。！？,.!?])@([^\s@]*)$/)
  if (!match) return null
  const at = before.lastIndexOf('@')
  return { start: at, end: cursor, query: match[2] || '' }
}

async function bindGroupMentionPicker(chatPage, group) {
  const input = chatPage.querySelector('#chat-input')
  const menu = chatPage.querySelector('#group-mention-menu')
  chatPage._groupMentions = []
  chatPage._groupMentionMembers = (await Promise.all(
    (group.members || []).filter(id => id !== _wechatUid).map(id => getWechatDisplayCharacter(id))
  )).filter(Boolean).map(char => ({
    charId: char.id,
    displayName: getWechatDisplayName(char),
    realName: char.name || char.nick || getWechatDisplayName(char),
    avatar: getWechatDisplayAvatar(char)
  }))

  const refresh = () => {
    pruneGroupMentions(input.value, chatPage._groupMentions)
    const mention = getGroupMentionQuery(input)
    if (!mention) {
      menu.style.display = 'none'
      chatPage._groupMentionState = null
      return
    }
    const query = mention.query.toLowerCase()
    const members = chatPage._groupMentionMembers.filter(member =>
      !query ||
      member.displayName.toLowerCase().includes(query) ||
      member.realName.toLowerCase().includes(query)
    )
    if (!members.length) {
      menu.style.display = 'none'
      chatPage._groupMentionState = null
      return
    }
    chatPage._groupMentionState = { ...mention, members, activeIndex: 0 }
    renderGroupMentionMenu(chatPage)
  }
  input.addEventListener('input', refresh)
  input.addEventListener('click', refresh)
  input.addEventListener('blur', () => setTimeout(() => {
    if (!menu.matches(':hover')) {
      menu.style.display = 'none'
      chatPage._groupMentionState = null
    }
  }, 120))
}

function pruneGroupMentions(content, mentions) {
  const available = new Map()
  for (const mention of mentions || []) {
    const token = `@${mention.displayName}`
    if (!available.has(token)) {
      let count = 0
      let from = 0
      while (true) {
        const index = String(content || '').indexOf(token, from)
        if (index < 0) break
        count++
        from = index + token.length
      }
      available.set(token, count)
    }
  }
  const used = new Map()
  for (let i = 0; i < (mentions || []).length;) {
    const token = `@${mentions[i].displayName}`
    const count = used.get(token) || 0
    if (count >= (available.get(token) || 0)) {
      mentions.splice(i, 1)
    } else {
      used.set(token, count + 1)
      i++
    }
  }
}

function renderGroupMentionMenu(chatPage) {
  const menu = chatPage.querySelector('#group-mention-menu')
  const state = chatPage._groupMentionState
  if (!menu || !state) return
  menu.innerHTML = state.members.map((member, index) => `
    <button class="group-mention-item${index === state.activeIndex ? ' active' : ''}" type="button" data-index="${index}">
      <span class="group-mention-avatar">${member.avatar
        ? `<img src="${wcEscHtml(member.avatar)}" alt="">`
        : buildWechatInitialAvatarHTML(member.displayName)}</span>
      <span class="group-mention-name">@${wcEscHtml(member.displayName)}</span>
      ${member.realName !== member.displayName ? `<span class="group-mention-real">${wcEscHtml(member.realName)}</span>` : ''}
    </button>
  `).join('')
  menu.style.display = 'block'
  menu.querySelectorAll('.group-mention-item').forEach(button => {
    button.addEventListener('mousedown', event => {
      event.preventDefault()
      selectGroupMention(chatPage, parseInt(button.dataset.index, 10))
    })
  })
}

function selectGroupMention(chatPage, index) {
  const input = chatPage.querySelector('#chat-input')
  const menu = chatPage.querySelector('#group-mention-menu')
  const state = chatPage._groupMentionState
  const member = state?.members?.[index]
  if (!member) return
  const inserted = `@${member.displayName} `
  input.value = input.value.slice(0, state.start) + inserted + input.value.slice(state.end)
  const cursor = state.start + inserted.length
  input.setSelectionRange(cursor, cursor)
  chatPage._groupMentions.push({ charId: member.charId, displayName: member.displayName })
  chatPage._groupMentionState = null
  menu.style.display = 'none'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.focus()
}

function handleGroupMentionKeydown(chatPage, event) {
  const state = chatPage._groupMentionState
  if (!state) return false
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const delta = event.key === 'ArrowDown' ? 1 : -1
    state.activeIndex = (state.activeIndex + delta + state.members.length) % state.members.length
    renderGroupMentionMenu(chatPage)
    return true
  }
  if (event.key === 'Enter' || event.key === 'Tab') {
    event.preventDefault()
    selectGroupMention(chatPage, state.activeIndex)
    return true
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    chatPage._groupMentionState = null
    chatPage.querySelector('#group-mention-menu').style.display = 'none'
    return true
  }
  return false
}

function getMessageMentions(content, selectedMentions) {
  const remaining = String(content || '')
  const counts = new Map()
  const mentions = []
  for (let i = 0; i < (selectedMentions || []).length; i++) {
    const mention = selectedMentions[i]
    const token = `@${mention.displayName}`
    const used = counts.get(token) || 0
    let from = 0
    let found = -1
    for (let i = 0; i <= used; i++) {
      found = remaining.indexOf(token, from)
      if (found < 0) break
      from = found + token.length
    }
    if (found >= 0) {
      counts.set(token, used + 1)
      mentions.push({ charId: mention.charId, displayName: mention.displayName })
      selectedMentions.splice(i, 1)
      i--
    }
  }
  return mentions
}

function bindWechatPatGesture(element, handler) {
  if (!element || element.dataset.wechatPatBound === '1') return
  element.dataset.wechatPatBound = '1'
  element.addEventListener('dblclick', e => {
    e.preventDefault()
    e.stopPropagation()
    handler()
  })
  let lastTapAt = 0
  element.addEventListener('touchend', e => {
    const now = Date.now()
    if (now - lastTapAt < 360) {
      e.preventDefault()
      e.stopPropagation()
      lastTapAt = 0
      handler()
      return
    }
    lastTapAt = now
  }, { passive: false })
}

function showWechatPatModal(options = {}) {
  if (document.querySelector('.wechat-pat-modal-body')) return
  const targetName = String(options.targetName || '对方').trim() || '对方'
  const sheet = wcMakeSheet(`
    <div class="sheet-title">拍一拍 ${wcEscHtml(targetName)}</div>
    <div class="wechat-pat-modal-body">
      <input class="input-field" id="wechat-pat-suffix" maxlength="40" placeholder="输入后缀，例如：的肩膀">
      <div class="wechat-pat-preview" id="wechat-pat-preview"></div>
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-send-wechat-pat">发送</button>
    </div>
  `)
  const input = sheet.querySelector('#wechat-pat-suffix')
  const preview = sheet.querySelector('#wechat-pat-preview')
  const actorName = getCurrentWechatDisplayName()
  const updatePreview = () => {
    const suffix = input.value.trim()
    preview.textContent = `${actorName} 拍了拍 ${targetName}${suffix ? ` ${suffix}` : ''}`
  }
  input.addEventListener('input', updatePreview)
  updatePreview()
  wcShowSheet(sheet, async () => {
    const suffix = input.value.trim()
    const text = `${actorName} 拍了拍 ${targetName}${suffix ? ` ${suffix}` : ''}`
    if (options.scope === 'group') {
      const groupId = parseInt(options.chatPage?.dataset.groupId)
      if (!groupId) return false
      await addGroupSystemMessage(groupId, text)
    } else {
      const chatId = parseInt(options.chatPage?.dataset.chatId)
      const charId = parseInt(options.targetId || options.chatPage?.dataset.charId)
      if (!chatId || !charId) return false
      await addPrivateMessageIdempotently({
        chatId,
        charId,
        role: 'user',
        content: `__SYS__${text}`,
        createdAt: Date.now()
      })
      clearPrivateReplyVersions(chatId)
    }
    await refreshChat(options.chatPage, { scrollToBottom: true })
  })
  setTimeout(() => input.focus(), 80)
}

async function addGroupSystemMessage(groupId, text) {
  return addGroupRow(groupId, _wechatUid, `__SYS__${text}`)
}

function getCurrentWechatDisplayName() {
  return getWechatDisplayName(_wechatUser) || '我'
}

async function refreshGroupUI(groupId, chatPage, groupRef, options = {}) {
  const latest = await normalizeGroupChat(await getWechatAccessibleGroup(groupId))
  if (!latest) return null
  if (groupRef) Object.assign(groupRef, latest)
  if (chatPage) {
    const name = chatPage.querySelector('.chat-header-name')
    const count = chatPage.querySelector('.chat-header-sub')
    if (name) name.textContent = latest.name || '群聊'
    if (count) count.textContent = `${latest.members.length} Members`
    if (options.reloadMessages) {
      await loadGroupMessages(chatPage, groupId, latest, { force: true, scrollToBottom: true })
    }
  }
  await refreshVisibleWechatChatList({ showLoading: false })
  return latest
}

async function openGroupSettings(groupId, chatPage, groupRef) {
  const group = await normalizeGroupChat(await getWechatAccessibleGroup(groupId))
  if (!group) return
  if (groupRef) Object.assign(groupRef, group)
  const page = document.createElement('div')
  page.id = 'group-settings-page'
  page.className = 'full-page group-settings-page'
  window.openPage(page)
  await renderGroupSettingsPage(page, groupId, chatPage, groupRef || group)
}

async function renderGroupSettingsPage(page, groupId, chatPage, groupRef) {
  const group = await normalizeGroupChat(await getWechatAccessibleGroup(groupId))
  if (!group) {
    window.closePage('group-settings-page')
    return
  }
  Object.assign(groupRef, group)
  const members = (await db.characters.bulkGet(group.members)).filter(Boolean)
  const role = getGroupMemberRole(group, _wechatUid)
  const canManage = canManageGroup(group)
  const isOwner = role === 'owner'
  const removeMode = !!page._groupRemoveMode
  const removeSelection = page._groupRemoveSelection instanceof Set ? page._groupRemoveSelection : new Set()
  page._groupRemoveSelection = removeSelection
  const hasRemovableMembers = members.some(member => canRemoveGroupMember(group, _wechatUid, member.id))
  const memberTiles = members.map(member => {
    const memberRole = getGroupMemberRole(group, member.id)
    const roleLabel = memberRole === 'owner' ? '群主' : (memberRole === 'admin' ? '管理员' : '')
    const removable = canRemoveGroupMember(group, _wechatUid, member.id)
    const selected = removeSelection.has(member.id)
    return `
      <button class="group-member-tile${removeMode ? ' is-removing' : ''}${selected ? ' is-selected' : ''}${removeMode && !removable ? ' is-locked' : ''}"
              data-member-id="${member.id}" data-removable="${removable ? '1' : '0'}" type="button">
        <span class="group-member-avatar">
          ${buildCharacterAvatarHTML(member)}
          ${roleLabel ? `<span class="group-member-role">${roleLabel}</span>` : ''}
          ${removeMode && removable ? `<span class="group-member-select-mark"><i class="fa fa-check"></i></span>` : ''}
        </span>
        <span class="group-member-name">${wcEscHtml(getWechatDisplayName(member))}</span>
      </button>`
  }).join('')
  const actionTiles = canManage && !removeMode ? `
      <button class="group-member-action" id="btn-add-group-members" type="button" aria-label="添加群成员">
        <span class="group-member-action-box"><i class="fa fa-plus"></i></span>
        <span class="group-member-name">添加</span>
      </button>
      ${hasRemovableMembers ? `
        <button class="group-member-action" id="btn-remove-group-members" type="button" aria-label="移除群成员">
          <span class="group-member-action-box"><i class="fa fa-minus"></i></span>
          <span class="group-member-name">移除</span>
        </button>` : ''}` : ''
  const adminSummary = group.adminIds.length ? `${group.adminIds.length} 人` : '未设置'
  page.innerHTML = `
    <div class="page-header">
      <button class="header-back" id="btn-group-settings-back" type="button"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">群聊设置</span>
      ${canManage ? '<button class="btn-icon" id="btn-save-group-settings" type="button" aria-label="保存"><i class="fa-solid fa-floppy-disk"></i></button>' : '<span class="group-settings-header-spacer"></span>'}
    </div>
    <div class="group-settings-scroll">
      <section class="group-settings-profile">
        <button class="group-settings-avatar${canManage ? '' : ' is-readonly'}" id="btn-group-avatar" type="button"${canManage ? '' : ' disabled'}>
          ${buildGroupAvatarHTML(group)}
          ${canManage ? '<span class="group-settings-avatar-edit"><i class="fa fa-camera"></i></span>' : ''}
        </button>
        <div class="group-settings-count">${group.members.length} Members</div>
      </section>
      <section class="group-settings-card">
        <label class="group-settings-field">
          <span>群聊名称</span>
          <input class="input-field" id="group-settings-name" maxlength="40" value="${wcEscHtml(group.name || '')}"${canManage ? '' : ' disabled'}>
        </label>
      </section>
      <section class="group-settings-card group-members-card">
        <div class="group-settings-section-head">
          <div>
            <div class="group-settings-section-title">群成员</div>
            <div class="group-settings-section-sub">${removeMode ? '选择需要移除的成员' : `${group.members.length} Members`}</div>
          </div>
        </div>
        <div class="group-members-grid">${memberTiles}${actionTiles}</div>
        ${removeMode ? `
          <div class="group-remove-actions">
            <button class="btn-ghost btn-pill" id="btn-cancel-remove-members" type="button">取消</button>
            <button class="btn-pill" id="btn-confirm-remove-members" type="button" disabled>移除（<span id="remove-member-count">${removeSelection.size}</span>）</button>
          </div>` : ''}
      </section>
      <section class="group-settings-card">
        <button class="group-settings-nav-row" id="btn-group-admins" type="button"${isOwner ? '' : ' disabled'}>
          <span>
            <strong>设置管理员</strong>
            <small>${isOwner ? '选择协助管理群聊的成员' : '仅群主可以设置管理员'}</small>
          </span>
          <span class="group-settings-nav-value">${adminSummary}${isOwner ? ' <i class="fa fa-angle-right"></i>' : ''}</span>
        </button>
      </section>
    </div>
  `
  bindGroupSettingsEvents(page, groupId, chatPage, groupRef, group)
}

function bindGroupSettingsEvents(page, groupId, chatPage, groupRef, group) {
  page.querySelector('#btn-group-settings-back')?.addEventListener('click', () => {
    window.closePage('group-settings-page')
  })
  page.querySelector('#btn-save-group-settings')?.addEventListener('click', async () => {
    const latest = await normalizeGroupChat(await getWechatAccessibleGroup(groupId))
    if (!canManageGroup(latest)) {
      window.toast?.('你已没有群管理权限')
      await renderGroupSettingsPage(page, groupId, chatPage, groupRef)
      return
    }
    const input = page.querySelector('#group-settings-name')
    const nextName = input?.value.trim() || ''
    if (!nextName) {
      window.toast?.('请输入群聊名称')
      input?.focus()
      return
    }
    if (nextName === group.name) {
      window.toast?.('已保存')
      return
    }
    await db.groupChats.update(groupId, { name: nextName })
    await addGroupSystemMessage(groupId, `${getCurrentWechatDisplayName()} 修改群名为“${nextName}”`)
    await refreshGroupUI(groupId, chatPage, groupRef, { reloadMessages: true })
    await renderGroupSettingsPage(page, groupId, chatPage, groupRef)
    window.toast?.('已保存')
  })
  page.querySelector('#btn-group-avatar')?.addEventListener('click', () => {
    if (!canManageGroup(group)) return
    if (!window.showImagePicker) {
      window.toast?.('当前环境不支持选择图片')
      return
    }
    window.showImagePicker(async avatar => {
      if (!avatar) return
      const latest = await normalizeGroupChat(await getWechatAccessibleGroup(groupId))
      if (!canManageGroup(latest)) {
        window.toast?.('你已没有群管理权限')
        await renderGroupSettingsPage(page, groupId, chatPage, groupRef)
        return
      }
      await db.groupChats.update(groupId, { avatar, avatarLabel: '' })
      await addGroupSystemMessage(groupId, `${getCurrentWechatDisplayName()} 修改了群头像`)
      await refreshGroupUI(groupId, chatPage, groupRef, { reloadMessages: true })
      await renderGroupSettingsPage(page, groupId, chatPage, groupRef)
    })
  })
  page.querySelector('#btn-add-group-members')?.addEventListener('click', () => {
    showAddGroupMembersSheet(page, groupId, chatPage, groupRef, group)
  })
  page.querySelector('#btn-remove-group-members')?.addEventListener('click', async () => {
    page._groupRemoveMode = true
    page._groupRemoveSelection = new Set()
    await renderGroupSettingsPage(page, groupId, chatPage, groupRef)
  })
  page.querySelectorAll('.group-member-tile.is-removing').forEach(tile => {
    tile.addEventListener('click', () => {
      if (tile.dataset.removable !== '1') return
      const memberId = parseInt(tile.dataset.memberId, 10)
      if (page._groupRemoveSelection.has(memberId)) {
        page._groupRemoveSelection.delete(memberId)
        tile.classList.remove('is-selected')
      } else {
        page._groupRemoveSelection.add(memberId)
        tile.classList.add('is-selected')
      }
      const count = page._groupRemoveSelection.size
      const countEl = page.querySelector('#remove-member-count')
      const confirmBtn = page.querySelector('#btn-confirm-remove-members')
      if (countEl) countEl.textContent = count
      if (confirmBtn) confirmBtn.disabled = count === 0
    })
  })
  page.querySelector('#btn-cancel-remove-members')?.addEventListener('click', async () => {
    page._groupRemoveMode = false
    page._groupRemoveSelection = new Set()
    await renderGroupSettingsPage(page, groupId, chatPage, groupRef)
  })
  page.querySelector('#btn-confirm-remove-members')?.addEventListener('click', async () => {
    const latest = await normalizeGroupChat(await getWechatAccessibleGroup(groupId))
    const selectedIds = [...page._groupRemoveSelection].filter(id => canRemoveGroupMember(latest, _wechatUid, id))
    if (!selectedIds.length) return
    const selectedMembers = (await db.characters.bulkGet(selectedIds)).filter(Boolean)
    const names = selectedMembers.map(getWechatDisplayName).join('、')
    if (!confirm(`确认将 ${names} 移出群聊？`)) return
    await db.groupChats.update(groupId, {
      members: latest.members.filter(id => !selectedIds.includes(id)),
      adminIds: latest.adminIds.filter(id => !selectedIds.includes(id))
    })
    await addGroupSystemMessage(groupId, `${getCurrentWechatDisplayName()} 将 ${names} 移出群聊`)
    page._groupRemoveMode = false
    page._groupRemoveSelection = new Set()
    await refreshGroupUI(groupId, chatPage, groupRef, { reloadMessages: true })
    await renderGroupSettingsPage(page, groupId, chatPage, groupRef)
  })
  page.querySelector('#btn-group-admins')?.addEventListener('click', () => {
    if (getGroupMemberRole(group, _wechatUid) === 'owner') {
      openGroupAdminSettings(groupId, page, chatPage, groupRef)
    }
  })
}

async function openGroupAdminSettings(groupId, settingsPage, chatPage, groupRef) {
  const group = await normalizeGroupChat(await getWechatAccessibleGroup(groupId))
  if (!group || getGroupMemberRole(group, _wechatUid) !== 'owner') return
  const members = (await db.characters.bulkGet(group.members.filter(id => id !== group.ownerId))).filter(Boolean)
  const selected = new Set(group.adminIds || [])
  const page = document.createElement('div')
  page.id = 'group-admin-settings-page'
  page.className = 'full-page group-admin-settings-page'
  page.innerHTML = `
    <div class="page-header">
      <button class="header-back" id="btn-group-admin-back" type="button"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">设置管理员</span>
      <button class="btn-icon" id="btn-save-group-admins" type="button" aria-label="保存"><i class="fa-solid fa-floppy-disk"></i></button>
    </div>
    <div class="group-admin-scroll">
      <div class="group-admin-hint">管理员可以修改群名称和头像、添加成员，并移除普通成员。</div>
      <div class="group-admin-list">
        ${members.length ? members.map(member => `
          <button class="group-admin-option${selected.has(member.id) ? ' is-selected' : ''}" data-admin-id="${member.id}" type="button">
            <span class="group-admin-option-avatar">${buildCharacterAvatarHTML(member)}</span>
            <span class="group-admin-option-name">${wcEscHtml(getWechatDisplayName(member))}</span>
            <span class="group-admin-option-check"><i class="fa fa-check"></i></span>
          </button>`).join('') : '<div class="group-settings-empty">暂无可设置的成员</div>'}
      </div>
    </div>
  `
  window.openPage(page)
  page.querySelector('#btn-group-admin-back').addEventListener('click', () => window.closePage('group-admin-settings-page'))
  page.querySelectorAll('[data-admin-id]').forEach(option => {
    option.addEventListener('click', () => {
      const memberId = parseInt(option.dataset.adminId, 10)
      if (selected.has(memberId)) {
        selected.delete(memberId)
        option.classList.remove('is-selected')
      } else {
        selected.add(memberId)
        option.classList.add('is-selected')
      }
    })
  })
  page.querySelector('#btn-save-group-admins').addEventListener('click', async () => {
    const latest = await normalizeGroupChat(await getWechatAccessibleGroup(groupId))
    if (getGroupMemberRole(latest, _wechatUid) !== 'owner') {
      window.toast?.('只有群主可以设置管理员')
      window.closePage('group-admin-settings-page')
      await renderGroupSettingsPage(settingsPage, groupId, chatPage, groupRef)
      return
    }
    const validIds = new Set(latest.members.filter(id => id !== latest.ownerId))
    const nextAdminIds = [...selected].filter(id => validIds.has(id))
    const previous = new Set(latest.adminIds || [])
    const addedIds = nextAdminIds.filter(id => !previous.has(id))
    const removedIds = [...previous].filter(id => !nextAdminIds.includes(id))
    await db.groupChats.update(groupId, { adminIds: nextAdminIds })
    const changedChars = (await db.characters.bulkGet([...addedIds, ...removedIds])).filter(Boolean)
    const nameMap = new Map(changedChars.map(member => [member.id, getWechatDisplayName(member)]))
    for (const id of addedIds) {
      await addGroupSystemMessage(groupId, `${getCurrentWechatDisplayName()} 将 ${nameMap.get(id) || '成员'} 设置为管理员`)
    }
    for (const id of removedIds) {
      await addGroupSystemMessage(groupId, `${getCurrentWechatDisplayName()} 取消了 ${nameMap.get(id) || '成员'} 的管理员身份`)
    }
    await refreshGroupUI(groupId, chatPage, groupRef, { reloadMessages: addedIds.length > 0 || removedIds.length > 0 })
    window.closePage('group-admin-settings-page')
    await renderGroupSettingsPage(settingsPage, groupId, chatPage, groupRef)
    window.toast?.('已保存')
  })
}

async function showAddGroupMembersSheet(settingsPage, groupId, chatPage, groupRef, group) {
  if (!canManageGroup(group)) return
  const rawChars = await db.characters.where('type').notEqual('user').toArray()
  const candidates = (await Promise.all(rawChars.map(char => getWechatDisplayCharacter(char.id))))
    .filter(char => char && !group.members.includes(char.id))
  const selected = new Set()
  const sheet = wcMakeSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">添加群成员</div>
    <div class="group-member-select">
      ${candidates.length ? candidates.map(char => `
        <button class="member-select-row" data-id="${char.id}" type="button">
          <div class="chat-avatar" style="width:36px;height:36px">${buildCharacterAvatarHTML(char)}</div>
          <span style="flex:1;font-size:14px">${wcEscHtml(getWechatDisplayName(char))}</span>
          <i class="fa fa-circle-o member-check"></i>
        </button>`).join('') : '<div class="group-settings-empty">没有可添加的成员</div>'}
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-confirm-add-members" type="button"${candidates.length ? '' : ' disabled'}>添加（<span id="add-member-count">0</span>）</button>
    </div>
  `)
  sheet._wcOverlay = wcAttachSheet(sheet)
  sheet.querySelectorAll('.member-select-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = parseInt(row.dataset.id, 10)
      const check = row.querySelector('.member-check')
      if (selected.has(id)) {
        selected.delete(id)
        check.className = 'fa fa-circle-o member-check'
      } else {
        selected.add(id)
        check.className = 'fa fa-check-circle member-check'
      }
      sheet.querySelector('#add-member-count').textContent = selected.size
    })
  })
  sheet.querySelector('#btn-confirm-add-members')?.addEventListener('click', async () => {
    if (!selected.size) {
      window.toast?.('请选择成员')
      return
    }
    const latest = await normalizeGroupChat(await getWechatAccessibleGroup(groupId))
    if (!canManageGroup(latest)) {
      closeWcSheet(sheet)
      window.toast?.('你已没有群管理权限')
      await renderGroupSettingsPage(settingsPage, groupId, chatPage, groupRef)
      return
    }
    const addedIds = [...selected].filter(id => !latest.members.includes(id))
    const members = [...latest.members, ...addedIds]
    await db.groupChats.update(groupId, { members })
    const addedChars = (await db.characters.bulkGet(addedIds)).filter(Boolean)
    const names = addedChars.map(getWechatDisplayName).join('、')
    await addGroupSystemMessage(groupId, `${getCurrentWechatDisplayName()} 邀请 ${names} 加入群聊`)
    closeWcSheet(sheet)
    await refreshGroupUI(groupId, chatPage, groupRef, { reloadMessages: true })
    await renderGroupSettingsPage(settingsPage, groupId, chatPage, groupRef)
  })
}


// 发送群消息：仅入库 + 刷新，不触发 AI（AI 只能由魔法棒触发）
// 换行 = 换一个气泡，且按节奏一条一条出现
async function sendGroupMessage(chatPage, group) {
  const groupId = parseInt(chatPage.dataset.groupId)
  const accessibleGroup = await getWechatAccessibleGroup(groupId)
  if (!accessibleGroup) return
  group = accessibleGroup
  const input = chatPage.querySelector('#chat-input')
  const lines = splitMessageLines(input.value)
  if (!lines.length) return
  const quoteState = chatPage._quoteState || null
  const selectedMentions = Array.isArray(chatPage._groupMentions) ? chatPage._groupMentions.slice() : []
  input.value = ''
  input.style.height = 'auto'
  chatPage._groupMentions = []
  chatPage._groupMentionState = null
  const mentionMenu = chatPage.querySelector('#group-mention-menu')
  if (mentionMenu) mentionMenu.style.display = 'none'
  const base = Date.now()
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) await _sleep(SEND_BUBBLE_GAP_MS)
    const content = i === 0 && quoteState ? buildQuotedReplyContent(chatPage, quoteState, lines[i]) : lines[i]
    const row = {
      groupId, senderId: _wechatUid, role: 'user',
      content, createdAt: base + i
    }
    const mentions = getMessageMentions(lines[i], selectedMentions)
    if (mentions.length) row.mentions = mentions
    await db.groupMessages.add(row)
    await loadGroupMessages(chatPage, groupId, group, { scrollToBottom: true })
  }
  if (quoteState) clearPendingQuote(chatPage)
}

// 群聊 AI 回复点火（点火即返回，与 DOM 解耦）
function startGroupAIReply(groupId, group, options = {}) {
  if (isAIReplyPending('group', groupId)) return
  const triggerUid = _wechatUid
  const triggerUser = _wechatUser
  if (!triggerUid || !isWechatGroupAccessible(group, triggerUid)) return
  const key = _aiKey('group', groupId)
  _pendingAIReplies.add(key)
  applyTypingUI('group', groupId, true)
  ;(async () => {
    try {
      await triggerGroupAIReplies(group, groupId, { uid: triggerUid, user: triggerUser }, options)
    } catch (e) {
      if (e?.code === 'WECHAT_GROUP_ACCOUNT_CHANGED') return
      const cw = _getVisibleChatWindow('group', groupId)
      if (cw) showApiErrorModal(e.message || String(e), e.diagnostic)
      else console.warn('[wechat] 群聊 AI 回复失败:', e)
    } finally {
      _pendingAIReplies.delete(key)
      applyTypingUI('group', groupId, false)
      const cw = _getVisibleChatWindow('group', groupId)
      if (cw && isGroupAIContextActive(group, triggerUid)) await loadGroupMessages(cw, groupId, group, { scrollToBottom: true })
    }
  })()
}

// ===== 群聊：导演模式 =====
// 一次调用扮演群里所有非用户角色，输出 {"script":[思维链, 动作...]}，逐条翻译成群消息。
// 完整对齐私聊四层防乱格式：json_object + 提示铁律 + 宽松解析 + 校验重试。

const GROUP_DIRECTOR_HISTORY_LIMIT = 30

function isGroupAIContextActive(group, uid) {
  return String(_wechatUid ?? '') === String(uid ?? '') && isWechatGroupAccessible(group, uid)
}

function assertGroupAIContextActive(group, uid) {
  if (isGroupAIContextActive(group, uid)) return
  const error = new Error('群聊生成期间微信账号已切换')
  error.code = 'WECHAT_GROUP_ACCOUNT_CHANGED'
  throw error
}

// 触发群导演（按当前可见窗口动态刷新，退出群聊不中断后台写入）
async function triggerGroupAIReplies(group, groupId, aiContext, options = {}) {
  const userUid = aiContext.uid
  assertGroupAIContextActive(group, userUid)
  const memberIds = (group.members || []).filter(id => String(id) !== String(userUid))
  const members = (await Promise.all(memberIds.map(id => window.getCharacter(id))))
    .filter(member => member && member.type !== 'user')
  if (!members.length) return
  const userChar = await window.getCharacter(userUid)

  const script = await generateGroupScript(groupId, group, members, userChar, userUid, options)
  assertGroupAIContextActive(group, userUid)
  const nameToId = buildGroupNameToId(members)
  let popupShown = false

  for (const action of script) {
    if (!action || typeof action !== 'object' || action.type === 'thought_chain') continue
    assertGroupAIContextActive(group, userUid)
    let added = null
    try {
      added = await applyDirectorAction(action, group, groupId, nameToId, members, aiContext)
    } catch (e) {
      if (e?.code === 'WECHAT_GROUP_ACCOUNT_CHANGED') throw e
      console.warn('[群聊导演] 动作执行失败:', action.type, e)
      continue
    }
    if (!added || !added.length) continue
    await _sleep(SEND_BUBBLE_GAP_MS)
    const last = added[added.length - 1]
    assertGroupAIContextActive(group, userUid)
    if (!popupShown && String(last.senderId) !== String(userUid) && !String(last.content).startsWith('__SYS__')
        && document.visibilityState === 'visible' && !_getVisibleChatWindow('group', groupId)) {
      popupShown = true
      await showGroupAIMessagePopupIfNeeded(groupId, group, last.senderId, last.content, last.createdAt)
    }
    const cw = _getVisibleChatWindow('group', groupId)
    if (cw) await loadGroupMessages(cw, groupId, group, { scrollToBottom: true })
  }
}

// 成员本名/昵称 → charId
function buildGroupNameToId(members) {
  const map = {}
  for (const c of members) {
    if (c.name) map[String(c.name).trim()] = c.id
    if (c.nick) map[String(c.nick).trim()] = c.id
  }
  return map
}

// 取最近群消息，按发言人本名标注，喂给导演（修正旧实现"把他人话当己出"的缺陷）
async function buildGroupDirectorHistory(groupId, members, userChar, userUid) {
  const idToName = {}
  members.forEach(c => { idToName[c.id] = c.name || c.nick || `角色${c.id}` })
  const userName = userChar?.name || userChar?.nick || '用户'
  const recent = await db.groupMessages.where('groupId').equals(groupId).reverse().limit(GROUP_DIRECTOR_HISTORY_LIMIT).toArray()
  recent.reverse()
  return recent.map(m => {
    const isUser = String(m.senderId) === String(userUid)
    const speaker = isUser ? userName : (idToName[m.senderId] || '某成员')
    let content = String(m.content || '')
    if (isUser && Array.isArray(m.mentions) && m.mentions.length) {
      const offsets = new Map()
      for (const mention of m.mentions) {
        const displayName = String(mention?.displayName || '').trim()
        const realName = idToName[mention?.charId]
        if (!displayName || !realName) continue
        const token = `@${displayName}`
        const from = offsets.get(token) || 0
        const index = content.indexOf(token, from)
        if (index < 0) continue
        content = content.slice(0, index) + `@${realName}` + content.slice(index + token.length)
        offsets.set(token, index + realName.length + 1)
      }
    }
    return { role: isUser ? 'user' : 'assistant', content: `${speaker}：${content}` }
  })
}

// 生成导演脚本（四层防乱格式）
async function generateGroupScript(groupId, group, members, userChar, userUid, options = {}) {
  assertGroupAIContextActive(group, userUid)
  const history = await buildGroupDirectorHistory(groupId, members, userChar, userUid)
  const mcp = await runWechatMcpPrefetch(options.allowMcp === true, {
    scope: 'group',
    conversationId: groupId
  }, history)
  const system = await buildGroupDirectorSystem(group, groupId, members, userChar, userUid)
  const baseMessages = history.length ? history : [{ role: 'user', content: '（群里还没有人说话，请让角色自然地开启话题。）' }]
  const messages = appendWechatTransientTimeNotice(baseMessages, mcp.noticeText)
  const opts = {
    system,
    responseFormat: 'json_object',
    temperature: await window.getAITemperaturePreset('wechatGroup')
  }

  try {
    let raw = await window.callAI(messages, opts)
    assertGroupAIContextActive(group, userUid)
    let script = normalizeDirectorScript(extractDirectorScript(raw))
    if (!script) {
      const retry = messages.concat({
        role: 'user',
        content: '系统纠错：上一条输出不是合法的 {"script":[...]} 对象，或第一个元素不是 thought_chain。请重新只输出一个合法 JSON 对象，对象外不要任何文字。'
      })
      raw = await window.callAI(retry, opts)
      assertGroupAIContextActive(group, userUid)
      script = normalizeDirectorScript(extractDirectorScript(raw))
    }
    if (!script) throw new Error('群聊导演返回格式异常，请重新点一次')
    return script
  } finally {
    await mcp.close()
  }
}

// 宽松解析：{script:[...]} / {actions:[...]} / 裸数组；容忍 ``` 围栏与前后缀文字
function extractDirectorScript(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  const tryParse = t => { try { return JSON.parse(t) } catch { return null } }
  let obj = tryParse(s)
  if (!obj) {
    const fenced = s.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i)
    if (fenced) obj = tryParse(fenced[1].trim())
  }
  if (!obj) {
    const firsts = ['{', '['].map(ch => s.indexOf(ch)).filter(i => i >= 0)
    const first = firsts.length ? Math.min(...firsts) : -1
    const last = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'))
    if (first >= 0 && last > first) obj = tryParse(s.slice(first, last + 1))
  }
  if (!obj) return null
  if (Array.isArray(obj)) return obj
  if (Array.isArray(obj.script)) return obj.script
  if (Array.isArray(obj.actions)) return obj.actions
  return null
}

// 校验：是数组、首元素 thought_chain、其余各项有 type；逐项丢弃非法项；不可用返回 null
function normalizeDirectorScript(arr) {
  if (!Array.isArray(arr) || !arr.length) return null
  if (!arr[0] || arr[0].type !== 'thought_chain') return null
  const cleaned = [arr[0]]
  for (const a of arr.slice(1)) {
    if (a && typeof a === 'object' && typeof a.type === 'string') cleaned.push(a)
  }
  return cleaned.length >= 2 ? cleaned : null
}

// 构建群聊导演 system 提示
async function buildGroupDirectorSystem(group, groupId, members, userChar, userUid) {
  const userNick = userChar?.nick || userChar?.name || '用户'
  const userName = userChar?.name || userNick
  const userPersona = userChar?.description || '（未设定）'
  const groupName = group.name || '群聊'

  const now = new Date()
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  const timeContextLine = `- **当前时间**：${timeStr}（${getTimeOfDay(now.getHours())}）`

  const idToName = {}
  members.forEach(c => { idToName[c.id] = c.name || c.nick || `角色${c.id}` })
  idToName[userUid] = userName
  const membersBlock = members.map(c => {
    const base = `- 本名【${c.name || c.nick || '未命名'}】｜群昵称【${c.nick || c.name || '未命名'}】：${c.description || '（无人设）'}`
    const rels = (c.relations || []).filter(r => r && r.type && idToName[r.charId])
    if (!rels.length) return base
    const relText = rels.map(r => `与${String(r.charId) === String(userUid) ? '你' : idToName[r.charId]}：${r.type}${r.desc ? `（${r.desc}）` : ''}`).join('；')
    return `${base}（${relText}）`
  }).join('\n') || '- （暂无其它成员）'

  let worldBookBlock = '（无）'
  try {
    const recent = await db.groupMessages.where('groupId').equals(groupId).reverse().limit(20).toArray()
    const lore = await getChatLorebookContext(`group_${groupId}`, null, recent.reverse())
    if (lore && lore.trim()) worldBookBlock = lore.trim()
  } catch (e) { console.warn('[群聊导演] 世界书读取失败', e) }

  const memoryBlock = '（暂无）'

  let stickerBlock = '当前群未挂载表情包，禁止使用 sticker 指令。'
  try {
    const names = Object.keys(await getMountedStickerMap(`group_${groupId}`))
    if (names.length) stickerBlock = names.join(' ｜ ')
  } catch {}

  let pollBlock = '（当前没有可投票项目）'
  try {
    const pollMessages = (await db.groupMessages.where('groupId').equals(groupId).toArray())
      .filter(message => String(message.content || '').startsWith('__POLL__'))
      .slice(-5)
    if (pollMessages.length) {
      pollBlock = pollMessages.map(message => {
        const poll = _safeJsonParse(String(message.content).slice(8), null)
        if (!poll || !Array.isArray(poll.options)) return ''
        const counts = poll.options.map((option, index) =>
          `${index}. ${option}（${getPollVoters(poll, index).length}票）`
        ).join('；')
        return `- 时间戳 ${message.createdAt}｜${poll.question || '投票'}｜${counts}`
      }).filter(Boolean).join('\n') || '（当前没有可投票项目）'
    }
  } catch {}

  return `# 【最高指令：群聊导演】

你正在导演一场线上微信【群聊】，要同时扮演群里【除用户以外】的每一位成员。你的任务不是逐个“答题”，而是导演出一场角色之间真正互相搭话、有来有回的群聊。

---

# 【输出格式（最高优先级，全程生效）】

⚠️ **每次回复必须且只能输出一个合法的 JSON 对象，对象外禁止出现任何文字（包括解释说明、markdown 代码块围栏等）。所有内容必须在这一次输出里一次给全，禁止留到下一轮再补。**

对象结构固定为 \`{"script":[ … ]}\`。\`"script"\` 是一个数组，按先后顺序存放本轮的全部动作：

- **数组第 1 个元素，必须是思维链对象。**它只用来帮你先想清楚，不会展示给用户。三个字段含义：\`潜台词\`=这轮对话真正的意图、关键信息，以及涉及到的人设或世界观设定；\`情绪\`=群里此刻的情绪基调；\`心声\`=每个要开口的角色、用第一人称写下的真实想法（键为角色本名）。
  \`{"type":"thought_chain","潜台词":"...","情绪":"...","心声":{"角色本名":"..."}}\`

- **从第 2 个元素起，才是各角色真正要发出的消息或动作**（文本、表情、红包等，每种写法见下方「可用指令清单」）。除非明显只需一人回应，**通常应包含 2 个及以上不同角色的发言**，让群聊真正你来我往。

- 数组里**每个对象都必须有 \`"type"\`**；除思维链外**每个对象都必须有 \`"name"\`**，且 \`"name"\` **只能填角色的本名**，必须与群成员名单里的本名完全一致，不能填昵称、不能填用户、不能填群名。

✅ 正确：
\`{"script":[{"type":"thought_chain","潜台词":"小北刚被催，估计不太爽","情绪":"轻松带点起哄","心声":{"小北":"来都来了"}},{"type":"text","name":"小北","message":"来啦来啦"},{"type":"text","name":"阿杰","message":"？这么快"}]}\`

❌ 错误：在 JSON 前后写“好的，我来回复：”之类的任何文字。
❌ 错误：直接输出数组，而不是 \`{"script":[…]}\` 这个对象。
❌ 错误：第 1 个元素不是思维链，或某条消息缺少 \`"name"\`。

---

# 【Part 1: 角色扮演核心规则】

1. **先思后行**：生成任何角色发言之前，**必须先完成 thought_chain 的构思**。
2. **【最高行为铁律：禁止总结】**：你的任何角色，在任何情况下，都**绝对禁止**对聊天内容进行任何形式的归纳、概括或总结。
3. **角色互动（最重要）**：你的核心是“导演”一场戏，角色之间**必须**互相回应、补充或反驳，形成自然的讨论。
4. **身份与称呼**：
   - 用户的身份是【${userNick}】，本名是【${userName}】。
   - 对话中你可以根据人设和关系，自由使用角色的【群昵称】或【本名】来称呼对方。
   - 历史消息中的 \`@角色本名\` 表示用户明确点名了该角色；被点名的角色应优先感知并按场景回应。
   - **严禁**生成 "name" 字段为 "${userNick}"（用户）或 "${groupName}"（群名）的消息。
5. **禁止出戏**：绝不能透露你是 AI 或模型；严禁发展线下剧情。

---

# 【Part 2: 人性化的“不完美”】

1. **间歇性“犯懒”**：不要每轮都回一大段。有时只回一个“嗯”“好哒”“？”，完全没问题。
2. **非正式用语**：大胆使用缩写、网络流行语。
3. **制造“手滑”事故**：可以偶尔故意“发错”消息然后秒撤回，模拟真人手误。

---

# 【Part 3: 导演策略与节奏控制】

0. **多人参与（重要）**：除非场景明显只需一个人回应，本轮 \`script\` **至少要有 2 个不同角色**开口，并且让他们**互相搭话**（接话、附和、调侃或反驳），不要只让一个人自说自话。
1. **并非人人发言**：不是每个角色每一轮都必须说话。
2. **创造“小团体”**：允许角色之间形成短暂的“两人对话”或“三人讨论”。
3. **主动创造事件**：让角色发表情包、分享图片、发起投票等。
4. **主动创造“群事件”**：改群名、换群头像、发红包等。
5. **制造戏剧性**：让角色“手滑”发错消息后**立即撤回**。

---

# 【跨聊天私信（悄悄话）指令】

- 当一个角色想对用户说私密话时，使用 "send_private_message" 指令。
- **【格式铁律】**："content" 字段**必须是一个【JSON 字符串数组】**。
- 示例：{"type":"send_private_message","name":"你的角色本名","recipient":"${userName}","content":["私信内容"]}

---

# 【Part 4: 上下文数据】

## 当前群聊信息
- **群名称**：${groupName}
${timeContextLine}

## 群成员列表、人设及社交背景
${membersBlock}

## 用户的角色
- **${userNick}**：${userPersona}

## 世界观
${worldBookBlock}

## 长期记忆
${memoryBlock}

## 可用表情包
${stickerBlock}

## 当前可参与的群投票
${pollBlock}

---

# 【Part 5: 可用指令清单】

### 思维链（必须是 script 数组的第一个元素）
- {"type":"thought_chain","潜台词":"...","情绪":"...","心声":{"角色本名":"..."}}

### 核心聊天
- **发文本** {"type":"text","name":"角色本名","message":"内容"}
- **发表情** {"type":"sticker","name":"角色本名","meaning":"表情含义"}
- **发图片** {"type":"ai_image","name":"角色本名","description":"中文描述","image_prompt":"英文关键词"}
- **发语音** {"type":"voice_message","name":"角色本名","content":"语音文字"}
- **引用回复** {"type":"quote_reply","name":"角色本名","target_timestamp":时间戳,"reply_content":"回复内容"}
- **发送后撤回** {"type":"send_and_recall","name":"角色本名","content":"内容"}

### 社交与互动
- **拍用户** {"type":"pat_user","name":"角色本名","suffix":"(可选)"}
- **共享位置** {"type":"location_share","name":"角色本名","content":"位置名"}

### 群组管理
- **改群名** {"type":"change_group_name","name":"角色本名","new_name":"新群名"}
- **改群头像** {"type":"change_group_avatar","name":"角色本名","avatar_name":"头像名"}

### 特殊功能
- **发私信** {"type":"send_private_message","name":"角色本名","recipient":"${userName}","content":["私信内容"]}
- **发拼手气红包** {"type":"red_packet","packetType":"lucky","name":"角色本名","amount":8.88,"count":5,"greeting":"祝福语"}
- **打开红包** {"type":"open_red_packet","name":"角色本名","packet_timestamp":红包时间戳}
- **发起投票** {"type":"poll","name":"角色本名","question":"问题","options":"选项A\\n选项B"}
- **参与投票** {"type":"vote_poll","name":"角色本名","poll_timestamp":投票消息时间戳,"option_index":0}
- **送礼物** {"type":"gift","name":"角色本名","itemName":"礼物名称","itemPrice":价格,"reason":"送礼原因","image_prompt":"英文关键词","recipients":["收礼人本名"]}

---

# 【Part 6: 互动指南】

- **红包互动**：抢红包后，你**必须**根据系统提示的结果，发表一句符合人设的评论。
- **金额铁律**：根据角色的经济状况决定红包金额。
- **投票互动**：角色可以按自身立场自主参与当前投票；不要代替用户投票，也不要让同一角色重复投票。

---

现在，请根据以上规则和下方的对话历史，继续导演这场群聊。`
}

// 往群里加一条消息，返回 {id, senderId, content, createdAt}
async function addGroupRow(groupId, senderId, content, extra, createdAt) {
  const ts = createdAt ?? Date.now()
  const row = { groupId, senderId, role: senderId === _wechatUid ? 'user' : 'assistant', content, createdAt: ts }
  if (extra && typeof extra === 'object') Object.assign(row, extra)
  const id = await db.groupMessages.add(row)
  return { id, senderId, content, createdAt: ts }
}

// 把一个导演动作翻译成群消息/副作用，返回新增消息数组（无可见消息返回 null）
async function applyDirectorAction(action, group, groupId, nameToId, members, aiContext) {
  assertGroupAIContextActive(group, aiContext.uid)
  const userUid = aiContext.uid
  const user = aiContext.user
  const type = action.type
  const name = String(action.name || '').trim()
  const senderId = nameToId[name]
  const charName = name || '群成员'
  const idToName = {}
  members.forEach(c => { idToName[c.id] = c.name || c.nick || `角色${c.id}` })
  const add = (content, extra) => {
    assertGroupAIContextActive(group, userUid)
    return addGroupRow(groupId, senderId, content, extra)
  }

  switch (type) {
    case 'text': {
      if (senderId == null) return null
      const msg = String(action.message ?? '').trim()
      return msg ? [await add(msg)] : null
    }
    case 'voice_message': {
      if (senderId == null) return null
      const t = String(action.content ?? '').trim()
      return t ? [await add(`[${charName}的语音：${t}]`)] : null
    }
    case 'ai_image': {
      if (senderId == null) return null
      // 群聊暂不接入图片生成：用中文描述渲染占位照片卡（避免 [SHOT:] 死等转圈）
      const desc = String(action.description || action.image_prompt || '').replace(/\[SHOT:[^\]]*\]/ig, '').trim()
      return desc ? [await add(`[${charName}发来的照片：${desc}]`)] : null
    }
    case 'sticker': {
      if (senderId == null) return null
      const meaning = String(action.meaning ?? '').trim()
      return [await add(`[${charName}的表情包：${meaning}]`)]
    }
    case 'quote_reply': {
      if (senderId == null) return null
      const reply = String(action.reply_content ?? '').trim()
      if (!reply) return null
      let speaker = '', quoted = ''
      const ts = parseInt(action.target_timestamp)
      if (ts) {
        const tgt = (await db.groupMessages.where('groupId').equals(groupId).toArray()).find(m => m.createdAt === ts)
        if (tgt) {
          speaker = String(tgt.senderId) === String(userUid) ? (user?.nick || user?.name || '我') : (idToName[tgt.senderId] || '某成员')
          quoted = String(tgt.content || '').replace(/^__\w+__/, '[特殊消息]').slice(0, 40)
        }
      }
      const content = speaker
        ? `[${charName}引用"${speaker}：${quoted}"并回复：${reply}]`
        : `[${charName}引用"${quoted || '…'}"并回复：${reply}]`
      return [await add(content)]
    }
    case 'send_and_recall': {
      if (senderId == null) return null
      const t = String(action.content ?? '').trim()
      if (!t) return null
      const r1 = await add(t)
      await _sleep(SEND_BUBBLE_GAP_MS)
      const r2 = await add(`[${charName}撤回了一条消息：${t}]`)
      return [r1, r2]
    }
    case 'pat_user': {
      const target = user?.nick || user?.name || '你'
      const suffix = String(action.suffix || '').trim()
      return [await addGroupRow(groupId, senderId ?? userUid, `__SYS__${charName} 拍了拍 ${target}${suffix ? ` ${suffix}` : ''}`)]
    }
    case 'location_share': {
      if (senderId == null) return null
      const place = String(action.content ?? '').trim()
      return place ? [await add(`[${charName}的位置：${place}]`)] : null
    }
    case 'change_group_name': {
      if (senderId == null || !canManageGroup(group, senderId)) return null
      const newName = String(action.new_name ?? '').trim()
      if (!newName) return null
      await db.groupChats.update(groupId, { name: newName })
      group.name = newName
      const cw = _getVisibleChatWindow('group', groupId)
      if (cw) { const h = cw.querySelector('.chat-header-name'); if (h) h.textContent = newName }
      await refreshVisibleWechatChatList({ showLoading: false })
      return [await addGroupRow(groupId, senderId ?? userUid, `__SYS__${charName} 修改群名为“${newName}”`)]
    }
    case 'change_group_avatar': {
      if (senderId == null || !canManageGroup(group, senderId)) return null
      const av = String(action.avatar_name ?? '').trim()
      await db.groupChats.update(groupId, { avatarLabel: av })
      group.avatarLabel = av
      await refreshVisibleWechatChatList({ showLoading: false })
      return [await addGroupRow(groupId, senderId ?? userUid, `__SYS__${charName} 修改了群头像${av ? `（${av}）` : ''}`)]
    }
    case 'send_private_message': {
      if (senderId == null) return null
      const arr = Array.isArray(action.content) ? action.content : [String(action.content || '')]
      await deliverPrivateMessagesFromGroup(senderId, arr, userUid)
      return null // 悄悄话：群里不留痕
    }
    case 'red_packet': {
      if (senderId == null) return null
      const total = Math.round((parseFloat(action.amount) || 0) * 100) / 100
      const count = Math.max(1, parseInt(action.count) || 1)
      if (total <= 0) return null
      const data = { total, count, greeting: String(action.greeting || '恭喜发财'), senderName: charName, senderId, shares: splitLuckyMoney(total, count), claims: [] }
      return [await add(`__REDPACKET__${JSON.stringify(data)}`)]
    }
    case 'open_red_packet': {
      if (senderId == null) return null
      return await aiOpenRedPacket(groupId, parseInt(action.packet_timestamp), senderId, charName)
    }
    case 'poll': {
      if (senderId == null) return null
      const options = String(action.options || '').split(/\n+/).map(s => s.trim()).filter(Boolean)
      if (!action.question || options.length < 2) return null
      return [await add(`__POLL__${JSON.stringify({ question: String(action.question), options, votes: {} })}`)]
    }
    case 'vote_poll': {
      if (senderId == null) return null
      const result = await castGroupPollVote(
        groupId,
        parseInt(action.poll_timestamp, 10),
        parseInt(action.option_index, 10),
        { id: senderId, name: charName },
        { toggle: false }
      )
      if (!result?.changed) return null
      return [await addGroupRow(groupId, senderId, `__SYS__${charName} 已参与投票`)]
    }
    case 'gift': {
      if (senderId == null) return null
      const data = {
        itemName: String(action.itemName || '礼物'),
        itemPrice: action.itemPrice || '',
        reason: String(action.reason || ''),
        recipients: Array.isArray(action.recipients) ? action.recipients : []
      }
      return [await add(`__GIFT__${JSON.stringify(data)}`)]
    }
    default:
      return null
  }
}

// 角色私信落到对应私聊会话（找不到则新建），bump 未读
async function deliverPrivateMessagesFromGroup(charId, contents, ownerUid = _wechatUid) {
  let chat = await db.chats.where('[ownerUid+charId]').equals([ownerUid, charId]).first()
  if (!chat) {
    const id = await db.chats.add({ charId, ownerUid, createdAt: Date.now(), unread: 0 })
    chat = await db.chats.get(id)
  }
  const base = Date.now()
  let n = 0
  for (const c of contents) {
    const t = String(c || '').trim()
    if (!t) continue
    await addPrivateMessageIdempotently({ chatId: chat.id, charId, role: 'assistant', content: t, createdAt: base + n })
    n++
  }
  if (n) await db.chats.update(chat.id, { unread: (chat.unread || 0) + n })
}

// ===== 拼手气红包 =====
// 双均匀随机：每份 ∈ [0.01, 剩余/剩余份数×2]，末份取余额；返回元（两位小数）数组，和=total
function splitLuckyMoney(total, count) {
  let remaining = Math.round((Number(total) || 0) * 100) // 分
  count = Math.max(1, parseInt(count) || 1)
  const res = []
  for (let i = 0; i < count; i++) {
    const rest = count - i
    if (rest === 1) { res.push(remaining); break }
    const max = Math.max(1, Math.floor((remaining / rest) * 2))
    let amt = Math.floor(Math.random() * max) + 1
    amt = Math.min(amt, remaining - (rest - 1)) // 给后面每份至少留 1 分
    res.push(amt)
    remaining -= amt
  }
  return res.map(c => Math.round(c) / 100)
}

// AI 抢红包：弹一份给该角色，更新红包消息，返回系统提示行
async function aiOpenRedPacket(groupId, packetTimestamp, charId, charName) {
  const msgs = await db.groupMessages.where('groupId').equals(groupId).toArray()
  const packets = msgs.filter(m => String(m.content).startsWith('__REDPACKET__'))
  let target = packets.find(m => m.createdAt === packetTimestamp) || packets.sort((a, b) => b.createdAt - a.createdAt)[0]
  if (!target) return null
  const data = _safeJsonParse(String(target.content).slice(13), null)
  if (!data) return null
  data.claims = data.claims || []
  data.shares = data.shares || []
  const count = data.count || data.shares.length
  if (data.claims.some(c => c.id === charId)) return null
  if (data.claims.length >= count) return null
  const share = data.shares[data.claims.length] ?? 0
  data.claims.push({ name: charName, id: charId, amount: share, at: Date.now() })
  await db.groupMessages.update(target.id, { content: `__REDPACKET__${JSON.stringify(data)}` })
  return [await addGroupRow(groupId, charId, `__SYS__${charName} 领取了${data.senderName || ''}的红包 ¥${share.toFixed(2)}`)]
}

// 用户发红包弹窗（扣真实零钱余额）
function showGroupRedPacketSheet(chatPage, group) {
  const sheet = wcMakeSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">发拼手气红包</div>
    <div style="padding:0 16px 8px;display:flex;flex-direction:column;gap:10px">
      <input class="input-field" id="rp-total" placeholder="总金额（元）" type="number" min="0.01" step="0.01">
      <input class="input-field" id="rp-count" placeholder="红包个数" type="number" min="1" step="1">
      <input class="input-field" id="rp-greeting" placeholder="恭喜发财，大吉大利">
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-send-rp">塞钱进红包</button>
    </div>
  `)
  wcShowSheet(sheet, async () => {
    const total = Math.round((parseFloat(sheet.querySelector('#rp-total').value) || 0) * 100) / 100
    const count = parseInt(sheet.querySelector('#rp-count').value) || 0
    const greeting = sheet.querySelector('#rp-greeting').value.trim() || '恭喜发财，大吉大利'
    if (total <= 0) { window.toast('请填写总金额'); return false }
    if (count < 1) { window.toast('红包个数至少 1 个'); return false }
    if (Math.round(total * 100) < count) { window.toast('每个红包至少 0.01 元'); return false }
    const wallet = await getWalletData()
    if (!wallet || wallet.wechatBalance === undefined) { window.toast('请先在微信支付中生成账户余额'); return false }
    if (wallet.wechatBalance < total) { window.toast('零钱余额不足'); return false }
    wallet.wechatBalance = Math.round((wallet.wechatBalance - total) * 100) / 100
    await saveWalletData(wallet)
    await db.finance.add({ charId: _wechatUid, amount: total, desc: `群红包（${count}个）`, type: 'expense', source: 'wechat', createdAt: Date.now() })
    const myName = _wechatUser?.nick || _wechatUser?.name || '我'
    const data = { total, count, greeting, senderName: myName, senderId: _wechatUid, shares: splitLuckyMoney(total, count), claims: [] }
    const groupId = parseInt(chatPage.dataset.groupId)
    await db.groupMessages.add({ groupId, senderId: _wechatUid, role: 'user', content: `__REDPACKET__${JSON.stringify(data)}`, createdAt: Date.now() })
    await refreshChat(chatPage, { scrollToBottom: true })
  })
}

// 用户发起投票
function showGroupPollSheet(chatPage) {
  const sheet = wcMakeSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">发起投票</div>
    <div style="padding:0 16px 8px;display:flex;flex-direction:column;gap:10px">
      <input class="input-field" id="poll-q" placeholder="投票问题">
      <textarea class="input-field" id="poll-opts" rows="4" placeholder="每行一个选项（至少 2 个）"></textarea>
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="btn-send-poll">发起</button>
    </div>
  `)
  wcShowSheet(sheet, async () => {
    const question = sheet.querySelector('#poll-q').value.trim()
    const options = sheet.querySelector('#poll-opts').value.split(/\n+/).map(s => s.trim()).filter(Boolean)
    if (!question) { window.toast('请填写投票问题'); return false }
    if (options.length < 2) { window.toast('至少填写 2 个选项'); return false }
    const groupId = parseInt(chatPage.dataset.groupId)
    await db.groupMessages.add({
      groupId, senderId: _wechatUid, role: 'user',
      content: `__POLL__${JSON.stringify({ question, options, votes: {} })}`,
      createdAt: Date.now()
    })
    await refreshChat(chatPage, { scrollToBottom: true })
  })
}

// 打开红包详情；领取必须在详情弹层中再次确认
window.openRedPacketModal = async function(scope, msgId) {
  const msg = await db.groupMessages.get(msgId)
  if (!msg) return
  if (!await getWechatAccessibleGroup(msg.groupId)) return
  const data = _safeJsonParse(String(msg.content).slice(13), null)
  if (!data) return
  data.claims = data.claims || []
  data.shares = data.shares || []
  const count = data.count || data.shares.length
  const mine = data.claims.find(c => c.id === _wechatUid)
  showRedPacketDetailModal(data, mine ? mine.amount : null, count, {
    msgId,
    canClaim: !mine && data.claims.length < count,
    onClaim: () => claimGroupRedPacket(msgId)
  })
}

async function claimGroupRedPacket(msgId) {
  const msg = await db.groupMessages.get(msgId)
  if (!msg) return null
  const group = await getWechatAccessibleGroup(msg.groupId)
  if (!group) return null
  const data = _safeJsonParse(String(msg.content).slice(13), null)
  if (!data) return null
  data.claims = Array.isArray(data.claims) ? data.claims : []
  data.shares = Array.isArray(data.shares) ? data.shares : []
  const count = data.count || data.shares.length
  const existing = data.claims.find(claim => claim.id === _wechatUid)
  if (existing) return existing.amount
  if (data.claims.length >= count) return null

  const share = Number(data.shares[data.claims.length] ?? 0)
  data.claims.push({
    name: _wechatUser?.nick || _wechatUser?.name || '我',
    id: _wechatUid,
    amount: share,
    at: Date.now()
  })
  await db.groupMessages.update(msgId, { content: `__REDPACKET__${JSON.stringify(data)}` })
  const wallet = await getWalletData()
  if (wallet && wallet.wechatBalance !== undefined) {
    wallet.wechatBalance = Math.round((wallet.wechatBalance + share) * 100) / 100
    await saveWalletData(wallet)
    await db.finance.add({
      charId: _wechatUid,
      amount: share,
      desc: `抢到${data.senderName || '群成员'}的红包`,
      type: 'income',
      source: 'wechat',
      createdAt: Date.now()
    })
  }
  await addGroupRow(
    msg.groupId,
    _wechatUid,
    `__SYS__${_wechatUser?.nick || _wechatUser?.name || '我'} 领取了${data.senderName || ''}的红包`
  )
  const cw = _getVisibleChatWindow('group', msg.groupId)
  if (cw) {
    await loadGroupMessages(cw, msg.groupId, group, { force: true, scrollToBottom: true })
  }
  return share
}

function showRedPacketDetailModal(data, myAmount, count, options = {}) {
  const claims = data.claims || []
  const done = claims.length >= count
  // 还能领取（自己没领且没领完）时暂不暴露明细；已领取或已领完才显示
  const revealClaims = myAmount != null || done
  // 已领完时标出手气最佳（金额最大者）
  let luckiestIdx = -1
  if (done && claims.length) {
    luckiestIdx = claims.reduce((best, c, i, a) => (c.amount > a[best].amount ? i : best), 0)
  }
  const mineHtml = myAmount != null
    ? `<div class="rp-detail-amount">¥${Number(myAmount).toFixed(2)}<span>已存入零钱</span></div>`
    : (done ? `<div class="rp-detail-done">手慢了，红包派完了</div>` : '')
  const claimButton = options.canClaim
    ? `<div class="sheet-actions"><button class="btn-pill btn-full" id="btn-confirm-rp-claim">确认领取</button></div>`
    : ''
  const listRows = claims.map((c, i) => `
    <div class="rp-detail-row">
      <div class="rp-detail-avatar">${buildWechatInitialAvatarHTML(c.name)}</div>
      <div class="rp-detail-info">
        <div class="rp-detail-name">${wcEscHtml(c.name)}${i === luckiestIdx ? '<span class="rp-detail-luck">手气最佳</span>' : ''}</div>
        <div class="rp-detail-time">${wcEscHtml(formatThoughtTime(c.at))}</div>
      </div>
      <div class="rp-detail-val">¥${Number(c.amount).toFixed(2)}</div>
    </div>`).join('') || '<div class="rp-detail-empty">还没有人领取</div>'
  const listHtml = revealClaims ? `<div class="rp-detail-list">${listRows}</div>` : ''
  const sheet = wcMakeSheet(`
    <div class="sheet-handle"></div>
    <div class="rp-detail-head">
      <div class="rp-detail-sender">${wcEscHtml(data.senderName || '群成员')}的红包</div>
      <div class="rp-detail-greeting">${wcEscHtml(data.greeting || '恭喜发财')}</div>
    </div>
    ${mineHtml}
    <div class="rp-detail-sub">已领取 ${claims.length}/${count} 个，共 ¥${Number(data.total || 0).toFixed(2)}</div>
    ${listHtml}
    ${claimButton}
  `)
  wcShowSheetNoConfirm(sheet)
  sheet.querySelector('#btn-confirm-rp-claim')?.addEventListener('click', async event => {
    const button = event.currentTarget
    button.disabled = true
    button.textContent = '领取中...'
    try {
      const amount = await options.onClaim?.()
      if (amount == null) {
        window.toast?.('红包已被领完')
        closeWcSheet(sheet)
        return
      }
      closeWcSheet(sheet)
      setTimeout(() => window.openRedPacketModal('group', options.msgId), 320)
    } catch (error) {
      button.disabled = false
      button.textContent = '确认领取'
      window.toast?.(error?.message || '领取失败，请重试')
    }
  })
}

function normalizePollVoter(voter) {
  if (voter && typeof voter === 'object') {
    const id = parseInt(voter.id, 10)
    return { id: Number.isFinite(id) ? id : null, name: String(voter.name || '').trim() || '群成员' }
  }
  return { id: null, name: String(voter || '').trim() }
}

function getPollVoters(data, optionIndex) {
  const raw = data?.votes?.[optionIndex]
  return Array.isArray(raw) ? raw.map(normalizePollVoter).filter(voter => voter.name) : []
}

function pollVoterMatches(voter, identity) {
  if (voter.id != null && identity.id != null) return voter.id === identity.id
  return voter.name === identity.name
}

async function castGroupPollVote(groupId, pollTimestamp, optionIndex, identity, options = {}) {
  if (!Number.isInteger(optionIndex) || optionIndex < 0) return null
  if (!await getWechatAccessibleGroup(groupId)) return null
  const messages = await db.groupMessages.where('groupId').equals(groupId).toArray()
  const polls = messages.filter(message => String(message.content || '').startsWith('__POLL__'))
  const msg = polls.find(message => message.createdAt === pollTimestamp)
    || polls.find(message => message.id === pollTimestamp)
  if (!msg) return null
  const data = _safeJsonParse(String(msg.content).slice(8), null)
  if (!data || !Array.isArray(data.options) || optionIndex >= data.options.length) return null
  data.votes = data.votes || {}
  let hadSelectedOption = false
  for (const key of Object.keys(data.votes)) {
    const voters = getPollVoters(data, key)
    const kept = voters.filter(voter => !pollVoterMatches(voter, identity))
    if (kept.length !== voters.length && parseInt(key, 10) === optionIndex) hadSelectedOption = true
    data.votes[key] = kept
  }
  if (options.toggle === false || !hadSelectedOption) {
    data.votes[optionIndex] = getPollVoters(data, optionIndex)
    data.votes[optionIndex].push({ id: identity.id, name: identity.name })
  }
  await db.groupMessages.update(msg.id, { content: `__POLL__${JSON.stringify(data)}` })
  return {
    msg,
    data,
    selected: options.toggle === false || !hadSelectedOption,
    changed: options.toggle === false ? !hadSelectedOption : true
  }
}

// 投票
window.voteGroupPoll = async function(msgId, idx) {
  const msg = await db.groupMessages.get(msgId)
  if (!msg) return
  if (!await getWechatAccessibleGroup(msg.groupId)) return
  await castGroupPollVote(msg.groupId, msg.id, idx, {
    id: _wechatUid,
    name: _wechatUser?.nick || _wechatUser?.name || '我'
  })
  const cw = _getVisibleChatWindow('group', msg.groupId)
  if (cw) { const g = await getWechatAccessibleGroup(msg.groupId); if (g) await loadGroupMessages(cw, msg.groupId, g, { force: true }) }
}

// ===== 群聊新消息类型渲染 =====
function renderRedPacketCard(data, msg) {
  const claims = Array.isArray(data?.claims) ? data.claims : []
  const count = data?.count || (Array.isArray(data?.shares) ? data.shares.length : 0)
  const done = count > 0 && claims.length >= count
  const mineClaimed = claims.some(c => c.id === _wechatUid)
  const sub = mineClaimed ? '你已领取' : (done ? '已被领完' : `已领取 ${claims.length}/${count}`)
  return `
    <div class="msg-card redpacket-card${done ? ' redpacket-done' : ''}${mineClaimed ? ' redpacket-claimed' : ''}" onclick="window.openRedPacketModal('group', ${msg.id})">
      <div class="redpacket-card-top">
        <div class="redpacket-icon"><i class="fa-solid fa-coins"></i></div>
        <div class="redpacket-card-text">
          <div class="redpacket-greeting">${wcEscHtml(data?.greeting || '恭喜发财，大吉大利')}</div>
          <div class="redpacket-sub">${wcEscHtml(sub)}</div>
        </div>
      </div>
      <div class="redpacket-card-foot">拼手气红包</div>
    </div>`
}

function renderPollCard(data, msg) {
  const options = Array.isArray(data?.options) ? data.options : []
  const votes = data?.votes || {}
  const total = options.reduce((sum, _option, index) => sum + getPollVoters(data, index).length, 0)
  const rows = options.map((opt, i) => {
    const voters = getPollVoters(data, i)
    const v = voters.length
    const pct = total ? Math.round((v / total) * 100) : 0
    const selected = voters.some(voter => pollVoterMatches(voter, {
      id: _wechatUid,
      name: _wechatUser?.nick || _wechatUser?.name || '我'
    }))
    return `<button class="poll-option${selected ? ' selected' : ''}" onclick="window.voteGroupPoll(${msg.id}, ${i})">
      <span class="poll-option-bar" style="width:${pct}%"></span>
      <span class="poll-option-text">${wcEscHtml(opt)}</span>
      <span class="poll-option-count">${v}</span>
    </button>`
  }).join('')
  return `
    <div class="msg-card poll-card">
      <div class="poll-q"><i class="fa-solid fa-square-poll-vertical"></i> ${wcEscHtml(data?.question || '投票')}</div>
      <div class="poll-options">${rows}</div>
      <div class="poll-foot">${total} 人已投</div>
    </div>`
}

function renderGiftCard(data, msg) {
  const recipients = Array.isArray(data?.recipients) ? data.recipients.join('、') : ''
  const price = data?.itemPrice !== '' && data?.itemPrice != null ? `<div class="gift-price">¥${wcEscHtml(String(data.itemPrice))}</div>` : ''
  return `
    <div class="msg-card gift-card">
      <div class="gift-icon"><i class="fa-solid fa-gift"></i></div>
      <div class="gift-info">
        <div class="gift-name">${wcEscHtml(data?.itemName || '礼物')}</div>
        ${price}
        ${recipients ? `<div class="gift-to">送给 ${wcEscHtml(recipients)}</div>` : ''}
        ${data?.reason ? `<div class="gift-reason">${wcEscHtml(data.reason)}</div>` : ''}
      </div>
    </div>`
}

function renderSystemNote(data) {
  return `<div class="msg-system-note">${wcEscHtml(data?.text || '')}</div>`
}


// 加载群消息
async function loadGroupMessages(page, groupId, group, options = {}) {
  if (!isWechatGroupAccessible(group)) return
  const [msgs, mcpTraces] = await Promise.all([
    db.groupMessages.where('groupId').equals(groupId).sortBy('createdAt'),
    getMcpToolTracesForConversation('group', groupId)
  ])
  const container = page.querySelector('#chat-messages')
  const charIds = [...new Set(msgs.map(m => m.senderId))]
  const chars = await Promise.all(charIds.map(id => getWechatDisplayCharacter(id)))
  const charMap = {}
  await Promise.all(chars.map(async c => {
    if (!c) return
    // 头像换成同一份 blob URL 引用，避免群聊里每条消息行都重复一份完整 base64 头像
    c.wechatAvatar = await getAvatarBlobUrl(`char:${c.id}`, getWechatDisplayAvatar(c))
    charMap[c.id] = c
  }))
  const selfAvatar = await getAvatarBlobUrl('self', await getWechatSelfAvatar())
  const selfName = _wechatUser?.nick || _wechatUser?.name || '我'
  renderGroupMessages(container, msgs, group, charMap, selfAvatar, selfName, {
    ...options,
    mcpTraces
  })
  if (isAIReplyPending('group', groupId)) applyTypingUI('group', groupId, true)
}

function renderGroupMessages(container, msgs, group, charMap, selfAvatar, selfName, options = {}) {
  if (!container) return
  bindChatScrollIntentTracker(container)
  const ids = msgs.map(m => m.id)
  const contentSignatures = msgs.map(m => `${m.id}:${String(m.content || '')}`)
  const mcpTraces = Array.isArray(options.mcpTraces) ? options.mcpTraces : []
  const traceSignature = mcpTraces.map(trace => `${trace.id}:${trace.status}:${trace.updatedAt || ''}`).join('|')
  const memberSignature = Object.keys(charMap || {}).sort().map(id => {
    const c = charMap[id]
    return `${id}:${getWechatDisplayName(c)}:${getWechatDisplayAvatar(c)}`
  }).join('|')
  const signature = `${memberSignature}|self:${selfName}:${selfAvatar}`
  const state = container._wechatGroupRenderState
  const canAppend = !options.force &&
    state &&
    state.signature === signature &&
    state.traceSignature === traceSignature &&
    state.ids.length <= ids.length &&
    state.ids.every((id, i) => id === ids[i]) &&
    Array.isArray(state.contentSignatures) &&
    state.contentSignatures.length <= contentSignatures.length &&
    state.contentSignatures.every((value, i) => value === contentSignatures[i]) &&
    container.querySelectorAll('.msg-row[data-id]').length === state.ids.length

  if (canAppend) {
    const newMsgs = msgs.slice(state.ids.length)
    const scrollRequestedAt = options.scrollToBottom && newMsgs.length
      ? createChatAutoScrollRequest(container)
      : null
    if (newMsgs.length) {
      const html = newMsgs.map(m => buildGroupMsgRowHTML(m, charMap[m.senderId], selfAvatar, selfName)).join('')
      container.insertAdjacentHTML('beforeend', html)
      newMsgs.forEach(m => {
        const row = container.querySelector(`.msg-row[data-id="${m.id}"]`)
        if (!row) return
        bindGroupMsgLongPress(row, group, charMap)
        watchMessageMediaForBottom(row, container, !!options.scrollToBottom, scrollRequestedAt)
      })
      container._wechatGroupRenderState = { ids, contentSignatures, traceSignature, signature }
    }
    refreshMsgMultiSelectBindings(container)
    if (scrollRequestedAt) scrollChatToBottom(container, { requestedAt: scrollRequestedAt })
    return
  }

  container.innerHTML = buildWechatRenderTimeline(msgs, mcpTraces).map(item =>
    item.kind === 'mcp-trace'
      ? buildMcpTraceRowHTML(item.value)
      : buildGroupMsgRowHTML(item.value, charMap[item.value.senderId], selfAvatar, selfName)
  ).join('')
  bindGroupMsgLongPress(container, group, charMap)
  bindMcpTraceInteractions(container)
  refreshMsgMultiSelectBindings(container)
  container._wechatGroupRenderState = { ids, contentSignatures, traceSignature, signature }
  const shouldScrollToBottom = !!(options.scrollToBottom || options.initialScrollToBottom)
  const scrollRequestedAt = shouldScrollToBottom ? createChatAutoScrollRequest(container) : null
  watchMessageMediaForBottom(container, container, shouldScrollToBottom, scrollRequestedAt)
  if (scrollRequestedAt) scrollChatToBottom(container, { requestedAt: scrollRequestedAt })
}

// 群消息单行HTML
function buildGroupMsgRowHTML(m, c, selfAvatar, selfName) {
  const isSelf = m.senderId === _wechatUid
  const memberName = getWechatDisplayName(c)
  const avatarHtml = isSelf
    ? buildWechatSelfAvatarHTML(selfAvatar, selfName)
    : (getWechatDisplayAvatar(c)
        ? `<img src="${wcEscHtml(getWechatDisplayAvatar(c))}" alt="${wcEscHtml(memberName)}">`
        : buildWechatInitialAvatarHTML(memberName))
  const avatarPart = `<div class="msg-avatar-wrap"><div class="msg-avatar">${avatarHtml}</div></div>`
  const senderName = !isSelf
    ? `<span class="msg-sender-name wechat-pat-target" data-sender-id="${m.senderId}" title="双击拍一拍">${wcEscHtml(memberName)}</span>` : ''
  const speakerName = isSelf ? selfName : memberName
  const parsed = parseMsgType(m.content, speakerName)
  if (parsed.type === 'status-update') return ''
  const bubbleHtml = renderBubbleHTML(m, isSelf, speakerName, {})
  if (!bubbleHtml) return ''
  if (parsed.type === 'transfer-resp' || parsed.type === 'recall' || parsed.type === 'call-record' || parsed.type === 'system-note') {
    return `
      <div class="msg-row msg-system" data-id="${m.id}">
        ${bubbleHtml}
      </div>`
  }
  return `
    <div class="msg-row ${isSelf ? 'msg-self' : 'msg-other'}" data-id="${m.id}">
      ${avatarPart}
      <div class="msg-group-wrap">
        ${senderName}
        ${bubbleHtml}
      </div>
    </div>
  `
}

function bindGroupMsgLongPress(container, group, charMap) {
  bindMessageActionTargets(container, () => ({ scope: 'group', group, charMap }))
  container.querySelectorAll('.msg-sender-name[data-sender-id]').forEach(nameEl => {
    bindWechatPatGesture(nameEl, () => {
      showWechatPatModal({
        scope: 'group',
        chatPage: nameEl.closest('.chat-window-page'),
        targetId: parseInt(nameEl.dataset.senderId),
        targetName: nameEl.textContent || '群成员'
      })
    })
  })
}


// ===== 加号菜单（顶部+号）=====
function showWechatAddMenu(page) {
  const sheet = wcMakeSheet(`
    <div class="sheet-handle"></div>
    <div class="wechat-add-menu">
      <button class="add-menu-item" id="menu-new-chat">
        <i class="fa-solid fa-message"></i><span>发起聊天</span>
      </button>
      <button class="add-menu-item" id="menu-add-friend">
        <i class="fa fa-user-plus"></i><span>添加好友</span>
      </button>
      <button class="add-menu-item" id="menu-new-group">
        <i class="fa fa-users"></i><span>创建群聊</span>
      </button>
    </div>
  `)
  wcShowSheetNoConfirm(sheet)
  sheet.querySelector('#menu-new-chat').addEventListener('click', () => {
    closeWcSheet(sheet)
    showStartChatModal(page)
  })
  sheet.querySelector('#menu-add-friend').addEventListener('click', () => {
    closeWcSheet(sheet)
    showAddFriendModal(page)
  })
  sheet.querySelector('#menu-new-group').addEventListener('click', () => {
    closeWcSheet(sheet)
    showCreateGroupModal(page)
  })
}

async function showStartChatModal(page) {
  const modal = wcMakeSheet(`
    <div class="sheet-title">发起聊天</div>
    <div class="start-chat-search">
      <i class="fi fi-rr-search"></i>
      <input id="start-chat-search-input" type="search" placeholder="搜索好友" autocomplete="off">
    </div>
    <div class="start-chat-list wc-scroll-area">
      <div class="list-loading"><i class="fa fa-spinner fa-spin"></i></div>
    </div>
  `)
  modal.classList.add('start-chat-modal')
  wcShowSheetNoConfirm(modal)

  const list = modal.querySelector('.start-chat-list')
  const input = modal.querySelector('#start-chat-search-input')
  const friends = await loadFriendCharacters()
  if (!document.body.contains(modal)) return

  const render = (keyword = '') => {
    const query = keyword.trim().toLowerCase()
    const filtered = query
      ? friends.filter(friend => {
          const text = [
            getWechatDisplayName(friend),
            friend.nick,
            friend.name,
            friend.identity?.account
          ].filter(Boolean).join(' ').toLowerCase()
          return text.includes(query)
        })
      : friends

    if (!friends.length) {
      list.innerHTML = '<div class="start-chat-empty">暂无好友</div>'
      return
    }
    if (!filtered.length) {
      list.innerHTML = '<div class="start-chat-empty">未找到匹配的好友</div>'
      return
    }

    list.innerHTML = filtered.map(friend => `
      <button class="start-chat-friend" type="button" data-char-id="${friend.id}">
        <span class="start-chat-avatar">${buildCharacterAvatarHTML(friend)}</span>
        <span class="start-chat-friend-info">
          <span class="start-chat-friend-name">${wcEscHtml(getWechatDisplayName(friend))}</span>
          ${friend.identity?.account
            ? `<span class="start-chat-friend-account">微信号：${wcEscHtml(friend.identity.account)}</span>`
            : ''}
        </span>
      </button>
    `).join('')

    list.querySelectorAll('.start-chat-friend').forEach(row => {
      row.addEventListener('click', () => {
        const charId = parseInt(row.dataset.charId, 10)
        closeWcSheet(modal)
        openPrivateChat(page, charId)
      })
    })
  }

  render()
  input.addEventListener('input', () => render(input.value))
}


// ===== 聊天设置页 =====
let _chatSettingsOpening = false
async function openChatSettings(chatId, charId, chatPage) {
  // 防止在页面还没出来时连点，打开多个设置页叠在一起造成闪烁
  if (_chatSettingsOpening) return
  _chatSettingsOpening = true
  try {
    // 这些读取互不依赖，一起并行读，比一个一个等快得多
    const [
      char, profile, memory, mounted, lorebooksRaw, appearance, stickerCats, mountedStickerIds,
      tzStored, statusDisplay, activeReplySettings, timeSettings, bilingualSettings, imageGenSettings,
      stickerImageInputEnabled, thoughtTemplateStored, thoughtPresets, chatBeautyStored, chatBeautyPresets,
      longMemorySettings, longMemoryCount, voiceIdStored, msgNotify
    ] = await Promise.all([
      window.getCharacter(charId),
      getWechatProfile(_wechatUid, charId),
      db.config.get(`chatMemory_${chatId}`),
      db.config.get(`chatLore_${chatId}`),
      db.config.get('lorebooks'),
      db.config.get(`chatAppearance_${chatId}`),
      getAllStickerCategories(),
      getMountedStickerCatIds(chatId),
      db.config.get(`chatTimezone_${chatId}`),
      getChatStatusDisplayConfig(chatId),
      getChatActiveReplySettings(chatId),
      getChatTimeSettings(chatId),
      getChatBilingualSettings(chatId),
      getChatImageGenSettings(chatId),
      getChatStickerImageInputEnabled(chatId),
      db.config.get(`chatThoughtTemplate_${chatId}`),
      getThoughtPresets(),
      db.config.get(`chatBeauty_${chatId}`),
      getChatBeautyPresets(),
      window.WanWanMemory?.getSettings
        ? window.WanWanMemory.getSettings(chatId)
        : Promise.resolve({ enabled: true, summarizeEvery: 30, injectLimit: 12, embeddingEnabled: false, decayStrength: 'medium' }),
      db.memories
        ? db.memories.where('chatId').equals(chatId).filter(m => m.ownerUid === _wechatUid && m.charId === charId).count()
        : Promise.resolve(0),
      db.config.get(`chatVoiceId_${chatId}`),
      getChatMsgNotifySettings(chatId)
    ])
    const memoryValue = typeof memory?.value === 'object' ? memory.value.historyLimit : memory?.value
    const historyLimit = clampWechatMemoryLimit(memoryValue)
    const settingsPage = document.createElement('div')
    settingsPage.id = 'chat-settings-page'
    settingsPage.className = 'full-page'
    settingsPage.dataset.charName = getWechatDisplayName(char)
    const lorebooks = lorebooksRaw?.value || []
    const mountedIds = normalizeChatLoreMountIds(mounted?.value, lorebooks, charId)
    if (!areChatLoreMountIdsEqual(mounted?.value, mountedIds)) {
      await db.config.put({ key: `chatLore_${chatId}`, value: mountedIds })
    }
    const appearanceValue = normalizeChatAppearance(appearance?.value)
    // 同时拉取每个分组下表情数量，便于在设置页显示
    const counts = await Promise.all(stickerCats.map(c => db.stickers.where('categoryId').equals(c.id).count()))
    const stickerCounts = {}
    stickerCats.forEach((c, i) => { stickerCounts[c.id] = counts[i] })
    const tzConfig = tzStored?.value || {}
    const thoughtTemplateRaw = thoughtTemplateStored ? thoughtTemplateStored.value || {} : { enabled: true }
    const chatBeautyRaw = chatBeautyStored?.value || {}
    const voiceId = voiceIdStored?.value || ''
    settingsPage.innerHTML = buildChatSettingsHTML(
      char, profile, historyLimit,
      lorebooks, mountedIds, appearanceValue,
      stickerCats, mountedStickerIds, stickerCounts, tzConfig, statusDisplay, timeSettings, thoughtTemplateRaw, thoughtPresets,
      activeReplySettings,
      bilingualSettings, imageGenSettings, stickerImageInputEnabled,
      chatBeautyRaw, chatBeautyPresets,
      longMemorySettings, longMemoryCount,
      null, // Token 预估最耗时（要把整段聊天记录、记忆、世界书都拼一遍），页面打开之后再补
      voiceId, msgNotify
    )
    window.openPage(settingsPage)
    bindChatSettingsEvents(settingsPage, chatId, charId, chatPage, char)
    estimateWechatPromptContext(chatId, charId, _wechatUid, historyLimit).then(estimate => {
      const slot = settingsPage.querySelector('.cs-token-estimate')
      if (slot && settingsPage.isConnected) slot.outerHTML = buildPromptContextEstimateHTML(estimate)
    }).catch(err => {
      console.warn('[wechat] Token 预估失败', err)
      const note = settingsPage.querySelector('.cs-token-estimate .cs-token-estimate-note')
      if (note) note.textContent = '预估失败，不影响使用。'
    })
  } finally {
    _chatSettingsOpening = false
  }
}

// 聊天设置HTML
function buildChatSettingsHTML(char, profile, historyLimit, lorebooks, mountedIds, appearance,
                               stickerCats, mountedStickerIds, stickerCounts, tzConfig, statusDisplay, timeSettings, thoughtTemplateRaw, thoughtPresets,
                               activeReplySettings,
                               bilingualSettings, imageGenSettings, stickerImageInputEnabled,
                               chatBeautyRaw, chatBeautyPresets,
                               longMemorySettings, longMemoryCount,
                               promptEstimate,
                               voiceId, msgNotify) {
  return `
    <div class="page-header">
      <button class="header-back" id="btn-cs-back"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">聊天设置</span>
      <button class="btn-icon" id="btn-cs-save" type="button" title="保存"><i class="fa-solid fa-floppy-disk"></i></button>
    </div>
    ${buildChatSettingsHeroHTML(char, profile)}
    <div class="cs-tab-bar" role="tablist" aria-label="聊天设置分类">
      <button class="cs-tab is-active" type="button" role="tab" aria-selected="true" data-tab="role">基础信息</button>
      <button class="cs-tab" type="button" role="tab" aria-selected="false" data-tab="appearance">外观</button>
      <button class="cs-tab" type="button" role="tab" aria-selected="false" data-tab="plugins">插件</button>
      <button class="cs-tab" type="button" role="tab" aria-selected="false" data-tab="memory">记忆</button>
    </div>
    <div class="cs-scroll">
      ${buildWechatProfileSectionHTML(char, profile)}
      ${buildActiveReplySectionHTML(activeReplySettings)}
      ${buildBilingualSectionHTML(bilingualSettings)}
      ${buildTimezoneSectionHTML(tzConfig)}
      ${buildLoreSectionHTML(lorebooks, mountedIds, char.id)}
      ${buildStickerSectionHTML(stickerCats, mountedStickerIds, stickerCounts)}
      ${buildVoiceIdSectionHTML(voiceId)}
      ${buildChatHistorySectionHTML()}
      ${buildChatBeautyPickerHTML(chatBeautyRaw, chatBeautyPresets)}
      ${buildChatBackgroundSectionHTML(appearance.backgroundImage)}
      ${buildAppearanceSectionHTML(appearance)}
      ${buildChatTimeSettingsSectionHTML(timeSettings)}
      ${buildStatusDisplaySectionHTML(statusDisplay)}
      ${buildMsgNotifySectionHTML(msgNotify)}
      ${buildStickerImageInputSectionHTML(stickerImageInputEnabled)}
      ${buildImageGenSectionHTML(imageGenSettings)}
      ${buildThoughtTemplatePickerHTML(thoughtTemplateRaw, thoughtPresets)}
      ${buildMemorySectionHTML(historyLimit)}
      ${buildLongMemorySectionHTML(char, longMemorySettings, longMemoryCount)}
      ${buildPromptContextEstimateHTML(promptEstimate)}
    </div>
  `
}

function buildActiveReplySectionHTML(rawSettings) {
  const cfg = normalizeChatActiveReplySettings(rawSettings)
  return `
    <div class="cs-section" data-cs-tab="role">
      <div class="cs-section-label">主动回复</div>
      <div class="cs-section-sub">对话静置超过设定间隔后，自动触发一次角色回复</div>
      <div class="cs-status-toggle-row">
        <span>启用主动回复</span>
        <label class="toggle-wrap">
          <input type="checkbox" id="cs-active-reply-enabled" ${cfg.enabled ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>
      <div id="cs-active-reply-fields" style="${cfg.enabled ? '' : 'display:none'}">
        <div class="cs-memory-row">
          <span>固定间隔（分钟）</span>
          <input class="input-field cs-memory-input" id="cs-active-reply-interval" type="number" min="1" step="1" value="${cfg.intervalMinutes}">
        </div>
        <div class="cs-status-toggle-row">
          <span>启用免打扰</span>
          <label class="toggle-wrap">
            <input type="checkbox" id="cs-active-reply-dnd-enabled" ${cfg.dndEnabled ? 'checked' : ''}>
            <div class="toggle-track"></div>
            <div class="toggle-thumb"></div>
          </label>
        </div>
        <div class="cs-memory-row" id="cs-active-reply-dnd-fields" style="${cfg.dndEnabled ? '' : 'display:none'}">
          <span>免打扰时段</span>
          <div style="display:flex;align-items:center;gap:8px">
            <input class="input-field cs-memory-input" id="cs-active-reply-dnd-start" type="time" value="${wcEscHtml(cfg.dndStart)}">
            <span style="color:var(--c-sub)">-</span>
            <input class="input-field cs-memory-input" id="cs-active-reply-dnd-end" type="time" value="${wcEscHtml(cfg.dndEnd)}">
          </div>
        </div>
      </div>
    </div>
  `
}

function buildChatSettingsHeroHTML(char, profile) {
  const name = (profile?.remark || '').trim() || char?.nick || char?.name || getWechatDisplayName(char)
  const avatar = profile?.avatar || char?.avatar || ''
  const avatarHtml = avatar
    ? `<img src="${wcEscHtml(avatar)}" alt="${wcEscHtml(name)}">`
    : `<div class="avatar-placeholder">${wcEscHtml((char?.name || name || '?')[0])}</div>`
  return `
    <div class="cs-profile-hero">
      <button class="cs-hero-avatar" id="btn-cs-hero-avatar" type="button" aria-label="设置微信头像">${avatarHtml}</button>
      <div class="cs-hero-name">${wcEscHtml(name)}</div>
    </div>
  `
}

function buildBilingualLanguageOptions(selectedCode) {
  return CHAT_BILINGUAL_LANGUAGES.map(lang =>
    `<option value="${lang.code}"${lang.code === selectedCode ? ' selected' : ''}>${lang.label}</option>`
  ).join('')
}

function buildBilingualSectionHTML(rawSettings) {
  const cfg = normalizeChatBilingualSettings(rawSettings)
  return `
    <div class="cs-section" data-cs-tab="role">
      <div class="cs-section-label">双语模式</div>
      <div class="cs-section-sub">开启后，角色文字和语音默认显示原文，点击气泡显示翻译</div>
      <div class="cs-status-toggle-row">
        <span>启用双语模式</span>
        <label class="toggle-wrap">
          <input type="checkbox" id="cs-bilingual-enabled" ${cfg.enabled ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>
      <div class="cs-bilingual-fields" id="cs-bilingual-fields" style="${cfg.enabled ? '' : 'display:none'}">
        <div class="cs-bilingual-row">
          <label for="cs-bilingual-source">原文语言</label>
          <select class="input-field" id="cs-bilingual-source">${buildBilingualLanguageOptions(cfg.sourceLang)}</select>
        </div>
        <div class="cs-bilingual-row">
          <label for="cs-bilingual-target">翻译语言</label>
          <select class="input-field" id="cs-bilingual-target">${buildBilingualLanguageOptions(cfg.targetLang)}</select>
        </div>
      </div>
    </div>
  `
}

function buildWechatProfileSectionHTML(char, profile) {
  return `
    <div class="cs-section" data-cs-tab="role">
      <div class="cs-section-label">备注设置</div>
      <div class="cs-section-sub">设置当前角色微信备注</div>
      <div class="cs-profile-fields">
        <input class="input-field" id="cs-profile-remark" placeholder="设置微信备注" value="${wcEscHtml(profile?.remark || '')}">
      </div>
      <input type="hidden" id="cs-profile-avatar-value" value="${wcEscHtml(profile?.avatar || '')}">
    </div>
  `
}

function buildStatusDisplaySectionHTML(statusDisplay) {
  const statusEnabled = !!statusDisplay?.enabled
  return `
    <div class="cs-section" data-cs-tab="plugins">
      <div class="cs-section-label">状态设置</div>
      <div class="cs-status-toggle-row">
        <span>显示角色状态</span>
        <label class="toggle-wrap">
          <input type="checkbox" id="cs-status-display-enabled" ${statusEnabled ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>
    </div>
  `
}

function buildMsgNotifySectionHTML(msgNotify) {
  const cfg = normalizeChatMsgNotifySettings(msgNotify)
  const modeRow = (value, name, meta) => `
    <label class="cs-preset-row">
      <input type="radio" name="cs-msg-notify-mode" value="${value}" ${cfg.mode === value ? 'checked' : ''}>
      <div class="cs-preset-info">
        <span class="cs-preset-name">${name}</span>
        <span class="cs-preset-meta">${meta}</span>
      </div>
    </label>`
  return `
    <div class="cs-section" data-cs-tab="plugins">
      <div class="cs-section-label">消息提醒</div>
      <div class="cs-section-sub">收到角色消息时，顶部横幅的提醒方式</div>
      <div class="cs-status-toggle-row">
        <span>启用消息提醒</span>
        <label class="toggle-wrap">
          <input type="checkbox" id="cs-msg-notify-enabled" ${cfg.enabled ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>
      <div class="cs-preset-picker" id="cs-msg-notify-fields" style="${cfg.enabled ? '' : 'display:none'}">
        <div class="cs-preset-list">
          ${modeRow('count', '显示消息数量', '默认，多条时显示「发来 N 条消息」')}
          ${modeRow('last', '仅最后一条', '只提醒本轮的最后一条消息')}
          ${modeRow('first', '仅第一条', '只提醒本轮的第一条消息')}
          ${modeRow('all', '接收所有消息', '每条消息都弹一次横幅')}
        </div>
      </div>
    </div>
  `
}

function buildStickerImageInputSectionHTML(enabled) {
  return `
    <div class="cs-section" data-cs-tab="plugins">
      <div class="cs-section-label">表情包图片输入</div>
      <div class="cs-section-sub">开启后，API 将读取当前聊天历史中的表情包图片；需要使用支持图片输入的模型。</div>
      <div class="cs-status-toggle-row">
        <span>启用表情包图片输入</span>
        <label class="toggle-wrap">
          <input type="checkbox" id="cs-sticker-image-input-enabled" ${enabled ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>
    </div>
  `
}

function buildImageGenSectionHTML(imageGenSettings) {
  const cfg = normalizeChatImageGenSettings(imageGenSettings)
  const hasReference = !!cfg.charReferenceImage
  return `
    <div class="cs-section" data-cs-tab="plugins">
      <div class="cs-section-label">生成图片</div>
      <div class="cs-section-sub">开启后，角色发送的照片将由 IMAGE API 自动生成真实图片</div>
      <div class="cs-status-toggle-row">
        <span>启用生成图片</span>
        <label class="toggle-wrap">
          <input type="checkbox" id="cs-image-gen-enabled" ${cfg.enabled ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>
      <div id="cs-image-gen-fields" style="${cfg.enabled ? '' : 'display:none'}">
        <div class="cs-section-sub" style="margin-top:8px">角色外貌描述（英文，用于每次生图时自动拼入，可为空）</div>
        <textarea class="input-field" id="cs-image-gen-prompt" rows="3" placeholder="short black hair, brown eyes, petite, school uniform">${wcEscHtml(cfg.charImagePrompt)}</textarea>
        <div class="cs-section-sub" style="margin-top:2px">角色参考图（用于支持 image editing 的 API 统一角色外貌）</div>
        <div class="cs-image-ref-preview${hasReference ? ' has-image' : ''}" id="cs-image-ref-preview">
          ${hasReference
            ? `<img src="${wcEscHtml(cfg.charReferenceImage)}" alt="角色参考图"><button class="cs-image-ref-delete" id="btn-cs-image-ref-delete" type="button" aria-label="删除参考图"><i class="fa fa-times"></i></button>`
            : '<span>暂无参考图</span>'}
        </div>
        <div class="cs-profile-actions">
          <button class="btn-ghost btn-sm" id="btn-cs-image-ref-upload" type="button">上传参考图</button>
          <button class="btn-ghost btn-sm" id="btn-cs-image-ref-generate" type="button"><i class="fa-solid fa-wand-magic-sparkles"></i> 生成参考图</button>
        </div>
        <input type="file" id="cs-image-ref-file" accept="image/*" style="display:none">
        <input type="hidden" id="cs-image-ref-value" value="${wcEscHtml(cfg.charReferenceImage)}">
      </div>
    </div>
  `
}

function buildChatTimeSettingsSectionHTML(timeSettings) {
  const timeConfig = normalizeChatTimeSettings(timeSettings)
  return `
    <div class="cs-section" data-cs-tab="appearance">
      <div class="cs-section-label">时间设置</div>
      <div class="cs-status-toggle-row">
        <span>时间戳显示</span>
        <label class="toggle-wrap">
          <input type="checkbox" id="cs-time-enabled" ${timeConfig.enabled ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>
      <div class="cs-time-mode-fields" id="cs-time-mode-fields" style="${timeConfig.enabled ? '' : 'display:none'}">
        <div class="cs-section-sub">时间戳模式</div>
        <div class="cs-segmented">
          ${buildTimeModeOption('center', '居中显示', timeConfig.mode)}
          ${buildTimeModeOption('beside', '气泡旁边', timeConfig.mode)}
          ${buildTimeModeOption('inside', '气泡内部', timeConfig.mode)}
        </div>
      </div>
      <div class="cs-status-toggle-row">
        <span>加强时间感知</span>
        <label class="toggle-wrap">
          <input type="checkbox" id="cs-time-awareness" ${timeConfig.awareness ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>
    </div>
  `
}

function buildTimeModeOption(value, label, currentMode) {
  return `
    <label class="cs-segmented-option">
      <input type="radio" name="cs-time-mode" value="${value}" ${currentMode === value ? 'checked' : ''}>
      <span>${label}</span>
    </label>`
}

function buildThoughtTemplatePickerHTML(templateRaw, presets) {
  const enabled = !!templateRaw?.enabled
  const currentPresetId = templateRaw?.presetId || ''
  const hasInline = !currentPresetId && (templateRaw?.regexPattern || templateRaw?.replacePattern)
  const presetRows = presets.map(p => `
    <label class="cs-preset-row">
      <input type="radio" name="cs-thought-preset" value="${p.id}" ${currentPresetId === p.id ? 'checked' : ''}>
      <div class="cs-preset-info">
        <span class="cs-preset-name">${wcEscHtml(p.name || '未命名')}</span>
        <span class="cs-preset-meta">${wcEscHtml((p.regexPattern || '').substring(0, 30))}</span>
      </div>
    </label>
  `).join('')
  return `
    <div class="cs-section" data-cs-tab="plugins">
      <div class="cs-section-label">心声</div>
      <div class="cs-section-sub">前往插件页面管理心声模版</div>
      <div class="cs-status-toggle-row">
        <span>启用心声</span>
        <label class="toggle-wrap">
          <input type="checkbox" id="cs-thought-template-enabled" ${enabled ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>
      <div class="cs-preset-picker" id="cs-preset-picker" style="${enabled ? '' : 'display:none'}">
        <div class="cs-preset-list">
          <label class="cs-preset-row">
            <input type="radio" name="cs-thought-preset" value="" ${!currentPresetId ? 'checked' : ''}>
            <div class="cs-preset-info">
              <span class="cs-preset-name">默认模板</span>
              <span class="cs-preset-meta">内置心声卡片样式</span>
            </div>
          </label>
          ${presetRows}
        </div>
        ${hasInline ? '<div class="cs-preset-inline-note">当前使用旧版自定义配置，选择预设后将替换</div>' : ''}
        <button class="cs-action-row" id="btn-manage-presets" type="button">
          <i class="fa fa-cog"></i><span>管理心声模板</span><i class="fa fa-angle-right" style="margin-left:auto"></i>
        </button>
      </div>
    </div>
  `
}

function buildChatBeautyPickerHTML(beautyRaw, presets) {
  const currentPresetId = beautyRaw?.presetId || ''
  const hasCurrentPreset = !currentPresetId || presets.some(p => p.id === currentPresetId)
  const presetRows = presets.map(p => `
    <label class="cs-preset-row">
      <input type="radio" name="cs-chat-beauty-preset" value="${p.id}" ${currentPresetId === p.id ? 'checked' : ''}>
      <div class="cs-preset-info">
        <span class="cs-preset-name">${wcEscHtml(p.name || '未命名')}</span>
        <span class="cs-preset-meta">${wcEscHtml(String(p.css || '').replace(/\s+/g, ' ').trim().substring(0, 30) || '空 CSS')}</span>
      </div>
    </label>
  `).join('')
  return `
    <div class="cs-section" data-cs-tab="appearance">
      <div class="cs-section-label">聊天美化</div>
      <div class="cs-section-sub">选择一个美化模板应用到此聊天。CSS 会自动限定在当前聊天窗口内。</div>
      <div class="cs-preset-picker" id="cs-chat-beauty-picker">
        <div class="cs-preset-list">
          <label class="cs-preset-row">
            <input type="radio" name="cs-chat-beauty-preset" value="" ${!hasCurrentPreset ? 'checked' : (!currentPresetId ? 'checked' : '')}>
            <div class="cs-preset-info">
              <span class="cs-preset-name">默认样式</span>
              <span class="cs-preset-meta">${hasCurrentPreset ? '不使用自定义美化' : '原模板已删除，保存后回到默认样式'}</span>
            </div>
          </label>
          ${presetRows || '<div class="cs-empty">暂无美化模板，请先创建</div>'}
        </div>
        <button class="cs-action-row" id="btn-manage-chat-beauty" type="button">
          <i class="fa-solid fa-wand-sparkles"></i><span>管理美化模板</span><i class="fa fa-angle-right" style="margin-left:auto"></i>
        </button>
      </div>
    </div>
  `
}

function buildMemorySectionHTML(historyLimit) {
  const limit = clampWechatMemoryLimit(historyLimit)
  return `
    <div class="cs-section" data-cs-tab="memory">
      <div class="cs-section-label">短期记忆</div>
      <div class="cs-section-sub">控制角色回复时会阅读这个聊天框最近多少个回合（聊天一来一回、一次通话、一次线下各算一回合）</div>
      <div class="cs-memory-row">
        <span>回复附带历史回合</span>
        <input class="input-field cs-memory-input" id="cs-history-limit" type="number"
               min="${WECHAT_MEMORY_MIN}" max="${WECHAT_MEMORY_MAX}" step="1" value="${limit}">
      </div>
      <input type="range" class="cs-slider" id="cs-history-limit-slider"
             min="${WECHAT_MEMORY_MIN}" max="${WECHAT_MEMORY_MAX}" step="1" value="${limit}">
    </div>
  `
}

function buildLongMemorySectionHTML(char, settings, count) {
  const cfg = settings || {}
  return `
    <div class="cs-section" data-cs-tab="memory">
      <div class="cs-section-label">长期记忆</div>
      <div class="cs-section-sub">绑定当前微信账号和当前角色；不同账号会拥有不同记忆</div>
      <div class="cs-memory-row">
        <span>当前角色</span>
        <span style="font-size:13px;color:var(--c-sub)">${wcEscHtml(char?.nick || char?.name || '未命名')}</span>
      </div>
      <div class="cs-memory-row">
        <span>绑定记忆</span>
        <span style="font-size:13px;color:var(--c-sub)">${count || 0} 条</span>
      </div>
      <div class="cs-status-toggle-row">
        <span>自动总结</span>
        <label class="toggle-wrap">
          <input type="checkbox" id="cs-long-memory-enabled" ${cfg.enabled !== false ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>
      <div class="cs-memory-row">
        <span>每多少条消息总结</span>
        <input class="input-field cs-memory-input" id="cs-long-memory-every" type="number" min="1" max="500" step="1" value="${cfg.summarizeEvery || 30}">
      </div>
      <div class="cs-memory-row">
        <span>回复前读取记忆</span>
        <input class="input-field cs-memory-input" id="cs-long-memory-limit" type="number" min="1" max="50" step="1" value="${cfg.injectLimit || 12}">
      </div>
      <div class="cs-status-toggle-row">
        <span>启用向量检索</span>
        <label class="toggle-wrap">
          <input type="checkbox" id="cs-long-memory-embedding" ${cfg.embeddingEnabled ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>
      <select class="input-field" id="cs-long-memory-decay">
        <option value="low" ${cfg.decayStrength === 'low' ? 'selected' : ''}>遗忘较慢</option>
        <option value="medium" ${!cfg.decayStrength || cfg.decayStrength === 'medium' ? 'selected' : ''}>遗忘适中</option>
        <option value="high" ${cfg.decayStrength === 'high' ? 'selected' : ''}>遗忘较快</option>
      </select>
      <button class="btn-ghost btn-full" id="btn-manual-long-memory" type="button" style="margin-top:6px">
        <i class="fa fa-wand-magic-sparkles"></i> 手动总结未总结内容
      </button>
      <button class="cs-action-row" id="btn-open-long-memory" type="button" style="margin-top:6px">
        <i class="fa fa-brain"></i><span>查看这个角色的记忆</span>
        <i class="fa fa-angle-right cs-arrow"></i>
      </button>
    </div>
  `
}

function buildTimezoneSectionHTML(tzConfig) {
  const { enabled = false, charLocation = '', charTimezone = 'Asia/Shanghai', userLocation = '', userTimezone = 'Asia/Shanghai' } = tzConfig || {}
  return `
    <div class="cs-section" data-cs-tab="role">
      <div class="cs-section-label">时区设置</div>
      <div class="cs-section-sub">为角色和用户设置不同时区，影响系统提示中的时间信息</div>
      <div class="cs-tz-toggle-row">
        <span style="font-size:14px;color:var(--c-text)">启用时区</span>
        <label class="toggle-wrap">
          <input type="checkbox" id="cs-tz-enabled" ${enabled ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>
      <div id="cs-tz-fields" style="${enabled ? '' : 'display:none'}">
        <div class="cs-tz-group">
          <div class="cs-tz-group-label">角色时区</div>
          <input type="text" class="input-field" id="cs-tz-char-location"
                 placeholder="所在地点（如：东京）" value="${wcEscHtml(charLocation)}">
          <select class="input-field" id="cs-tz-char-tz">${buildTimezoneOptions(charTimezone)}</select>
        </div>
        <div class="cs-tz-group">
          <div class="cs-tz-group-label">用户时区</div>
          <input type="text" class="input-field" id="cs-tz-user-location"
                 placeholder="所在地点（如：北京）" value="${wcEscHtml(userLocation)}">
          <select class="input-field" id="cs-tz-user-tz">${buildTimezoneOptions(userTimezone)}</select>
        </div>
      </div>
    </div>
  `
}

// 表情包分组挂载section
function buildStickerSectionHTML(stickerCats, mountedIds, counts) {
  const listHtml = stickerCats.length === 0
    ? '<div class="cs-empty">暂无表情包分组，请先在「我 → 我的表情包」中创建</div>'
    : stickerCats.map(c => `
        <label class="cs-lore-row">
          <input type="checkbox" class="cs-sticker-check" value="${c.id}" ${mountedIds.includes(c.id) ? 'checked' : ''}>
          <div class="cs-lore-info">
            <span class="cs-lore-name">${wcEscHtml(c.name)}</span>
            <span class="cs-lore-meta">${counts[c.id] || 0} 个表情包</span>
          </div>
        </label>
      `).join('')
  return `
    <div class="cs-section" data-cs-tab="role">
      <div class="cs-section-label">挂载表情包分组</div>
      <div class="cs-section-sub">仅作用于本会话；不同微信号或不同角色的会话相互独立。AI 角色仅能从已挂载分组中挑选表情包发送。</div>
      <div class="cs-lore-list" id="cs-sticker-list">${listHtml}</div>
      <button class="cs-action-row" id="btn-open-sticker-lib" style="margin-top:4px">
        <i class="fa fa-folder-open"></i><span>管理表情包库</span>
        <i class="fa fa-angle-right cs-arrow"></i>
      </button>
    </div>
  `
}

function buildChatBackgroundSectionHTML(backgroundImage) {
  const image = String(backgroundImage || '').trim()
  const previewStyle = image ? ` style="background-image:url(${wcEscHtml(JSON.stringify(image))})"` : ''
  return `
    <div class="cs-section" data-cs-tab="appearance">
      <div class="cs-section-label">聊天背景</div>
      <div class="cs-section-sub">仅作用于本会话</div>
      <button class="cs-bg-preview${image ? ' has-image' : ''}" id="cs-chat-bg-preview" type="button"${previewStyle}>
        <span>${image ? '更换背景' : '选择背景'}</span>
      </button>
      <div class="cs-profile-actions">
        <button class="btn-ghost btn-sm" id="btn-cs-chat-bg-pick" type="button">${image ? '更换背景' : '选择背景'}</button>
        <button class="btn-ghost btn-sm" id="btn-cs-chat-bg-reset" type="button">恢复默认</button>
      </div>
      <input type="hidden" id="cs-chat-bg-value" value="${wcEscHtml(image)}">
    </div>
  `
}

// 头像设置section（头像大小/圆角/显示）
function buildAppearanceSectionHTML(rawAppearance) {
  const appearance = normalizeChatAppearance(rawAppearance)
  return `
    <div class="cs-section" data-cs-tab="appearance">
      <div class="cs-section-label">头像设置</div>
      <div class="cs-section-sub">仅作用于本会话</div>
      <div class="cs-slider-row">
        <div class="cs-slider-head">
          <span>头像大小</span>
          <span class="cs-slider-value" id="cs-avatar-size-val">${appearance.avatarSize}px</span>
        </div>
        <input type="range" class="cs-slider" id="cs-avatar-size"
               min="30" max="50" step="1" value="${appearance.avatarSize}">
      </div>
      <div class="cs-slider-row">
        <div class="cs-slider-head">
          <span>头像圆角</span>
          <span class="cs-slider-value" id="cs-avatar-radius-val">${appearance.avatarRadius}px</span>
        </div>
        <input type="range" class="cs-slider" id="cs-avatar-radius"
               min="0" max="40" step="1" value="${appearance.avatarRadius}">
      </div>
      <div class="cs-status-toggle-row">
        <span>隐藏我方头像</span>
        <label class="toggle-wrap">
          <input type="checkbox" id="cs-hide-self-avatar" ${appearance.hideSelfAvatar ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>
      <div class="cs-status-toggle-row">
        <span>隐藏对方头像</span>
        <label class="toggle-wrap">
          <input type="checkbox" id="cs-hide-other-avatar" ${appearance.hideOtherAvatar ? 'checked' : ''}>
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>
    </div>
  `
}

function isLorebookBoundToCharacter(book, charId) {
  const targetId = String(charId)
  return book?.scope === 'personal'
    && (book.charIds || []).some(id => String(id) === targetId)
}

function normalizeChatLoreMountIds(rawIds, lorebooks, charId) {
  const personalBooks = new Map(
    (Array.isArray(lorebooks) ? lorebooks : [])
      .filter(book => book?.scope === 'personal' && book.id !== undefined && book.id !== null)
      .map(book => [String(book.id), book])
  )
  const normalized = []
  const seen = new Set()
  for (const rawId of Array.isArray(rawIds) ? rawIds : []) {
    if (rawId === undefined || rawId === null) continue
    const id = String(rawId).trim()
    const book = personalBooks.get(id)
    if (!id || id === 'NaN' || !book || seen.has(id) || isLorebookBoundToCharacter(book, charId)) continue
    seen.add(id)
    normalized.push(id)
  }
  return normalized
}

function areChatLoreMountIdsEqual(rawIds, normalizedIds) {
  if (!Array.isArray(rawIds) || rawIds.length !== normalizedIds.length) return false
  return rawIds.every((id, index) => typeof id === 'string' && id === normalizedIds[index])
}

// 世界书挂载section
function buildLoreSectionHTML(lorebooks, mountedIds, charId) {
  const personalBooks = lorebooks.filter(book => book.scope === 'personal')
  const mountedIdSet = new Set(mountedIds.map(String))
  const listHtml = personalBooks.length === 0
    ? '<div class="cs-empty">暂无单人世界书，请先在世界书页面创建</div>'
    : personalBooks.map(book => {
      const boundToCharacter = isLorebookBoundToCharacter(book, charId)
      const checked = boundToCharacter || mountedIdSet.has(String(book.id))
      return `
        <label class="cs-lore-row${boundToCharacter ? ' is-locked' : ''}">
          <input type="checkbox" class="cs-lore-check" value="${wcEscHtml(String(book.id))}"
                 ${checked ? 'checked' : ''} ${boundToCharacter ? 'disabled' : ''}>
          <span class="cs-lore-check-icon" aria-hidden="true">
            <i class="fa-regular fa-circle cs-lore-check-off"></i>
            <i class="fa-solid fa-circle-check cs-lore-check-on"></i>
          </span>
          <div class="cs-lore-info">
            <span class="cs-lore-name">${wcEscHtml(book.name)}</span>
            <span class="cs-lore-meta">${book.entries?.length || 0}条${boundToCharacter ? ' · 已绑定当前角色' : ''}</span>
          </div>
        </label>
      `
    }).join('')
  return `
    <div class="cs-section" data-cs-tab="role">
      <div class="cs-section-label">挂载局部世界书</div>
      <div class="cs-section-sub">仅显示单人世界书；已绑定当前角色的世界书会自动生效</div>
      <div class="cs-lore-list" id="cs-lore-list">${listHtml}</div>
    </div>
  `
}


// Voice ID section
function buildVoiceIdSectionHTML(voiceId) {
  return `
    <div class="cs-section" data-cs-tab="role">
      <div class="cs-section-label">Minimax 语音克隆</div>
      <div class="cs-section-sub">填入 Voice ID，角色语音消息将用 Minimax TTS 生成</div>
      <input class="input-field" id="cs-voice-id" placeholder="输入 Minimax Voice ID" value="${wcEscHtml(voiceId || '')}" style="margin:0 0 8px">
    </div>
    <div class="cs-section" data-cs-tab="role">
      <div class="cs-section-label">Fish Audio 音色</div>
      <div class="cs-section-sub">在「设置 → Fish Audio 语音配置」里把当前语音服务切到 Fish Audio 后生效</div>
      <input class="input-field" id="cs-fish-voice-id" placeholder="输入或在下方搜索选择 Fish 音色 ID" value="" style="margin:0 0 8px">
      <div class="cs-fish-row">
        <input class="input-field" id="cs-fish-search-input" placeholder="搜索音色名称，如：温柔 / 少年" style="margin:0">
        <button type="button" class="cs-fish-btn" id="cs-fish-search-btn">搜索</button>
      </div>
      <div class="cs-fish-row">
        <select class="input-field" id="cs-fish-lang" style="margin:0">
          <option value="">全部语言</option>
          <option value="zh" selected>中文</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
        <button type="button" class="cs-fish-btn" id="cs-fish-mine-btn">我的音色</button>
      </div>
      <div class="cs-fish-results" id="cs-fish-results"></div>
    </div>
  `
}

// 聊天记录section
function buildChatHistorySectionHTML() {
  return `
    <div class="cs-section" data-cs-tab="role">
      <div class="cs-section-label">聊天记录</div>
      <button class="cs-action-row" id="btn-search-chat">
        <i class="fa fa-magnifying-glass"></i><span>查找聊天记录</span>
        <i class="fa fa-angle-right cs-arrow"></i>
      </button>
      <button class="cs-action-row" id="btn-export-chat">
        <i class="fa fa-download"></i><span>导出聊天记录</span>
        <i class="fa fa-angle-right cs-arrow"></i>
      </button>
      <button class="cs-action-row" id="btn-import-chat">
        <i class="fa fa-upload"></i><span>导入聊天记录</span>
        <i class="fa fa-angle-right cs-arrow"></i>
      </button>
      <button class="cs-action-row cs-danger" id="btn-clear-chat">
        <i class="fa fa-trash"></i><span>清除聊天记录</span>
        <i class="fa fa-angle-right cs-arrow"></i>
      </button>
      <input type="file" id="chat-import-input" accept=".json" style="display:none">
    </div>
  `
}

// 绑定聊天设置事件
function bindChatSettingsEvents(settingsPage, chatId, charId, chatPage, char) {
  bindChatSettingsTabs(settingsPage)
  const initialAppearance = readChatSettingsAppearanceValue(settingsPage)
  settingsPage.dataset.csDirty = '0'
  settingsPage.dataset.csOriginalAvatarSize = String(initialAppearance.avatarSize)
  settingsPage.dataset.csOriginalAvatarRadius = String(initialAppearance.avatarRadius)
  settingsPage.dataset.csOriginalBackgroundImage = initialAppearance.backgroundImage
  settingsPage.dataset.csOriginalHideSelfAvatar = initialAppearance.hideSelfAvatar ? '1' : '0'
  settingsPage.dataset.csOriginalHideOtherAvatar = initialAppearance.hideOtherAvatar ? '1' : '0'

  settingsPage.querySelector('#btn-cs-back').addEventListener('click', () => {
    handleChatSettingsBack(settingsPage, chatId, charId, chatPage, char)
  })
  settingsPage.querySelector('#btn-cs-save').addEventListener('click', async () => {
    await saveChatSettingsPage(settingsPage, chatId, charId, chatPage, char)
  })
  bindWechatProfileEvents(settingsPage, chatId, charId, chatPage, char)
  bindActiveReplyEvents(settingsPage)
  bindBilingualEvents(settingsPage, chatId, chatPage)
  bindStatusDisplayEvents(settingsPage, chatId, charId, chatPage)
  bindImageGenEvents(settingsPage)
  bindMsgNotifyEvents(settingsPage)
  bindChatTimeSettingsEvents(settingsPage, chatId, chatPage)
  bindThoughtTemplatePickerEvents(settingsPage, chatId)
  bindChatBeautyPickerEvents(settingsPage, chatId, chatPage)
  bindMemoryEvents(settingsPage, chatId)
  bindLongMemoryEvents(settingsPage, chatId, charId)
  bindAppearanceEvents(settingsPage, chatId, chatPage)
  bindTimezoneEvents(settingsPage, chatId)
  bindStickerSettingEvents(settingsPage, chatId, chatPage)
  bindVoiceIdEvents(settingsPage, chatId)
  settingsPage.querySelector('#btn-search-chat')?.addEventListener('click', () => {
    if (settingsPage.dataset.csDirty === '1') {
      window.toast?.('设置有未保存的修改，请先保存或返回后再查找')
      return
    }
    openChatHistorySearch(chatPage, chatId, charId, settingsPage)
  })
  settingsPage.querySelector('#btn-export-chat').addEventListener('click', () => exportChat(chatId, charId, char))
  bindImportChat(settingsPage, chatId, chatPage)
  settingsPage.querySelector('#btn-clear-chat').addEventListener('click', () => clearChatConfirm(chatId, char, chatPage))
  bindChatSettingsDirtyTracking(settingsPage)
  setChatSettingsDirty(settingsPage, false)
}

function bindActiveReplyEvents(settingsPage) {
  const enabled = settingsPage.querySelector('#cs-active-reply-enabled')
  const fields = settingsPage.querySelector('#cs-active-reply-fields')
  const dndEnabled = settingsPage.querySelector('#cs-active-reply-dnd-enabled')
  const dndFields = settingsPage.querySelector('#cs-active-reply-dnd-fields')
  if (!enabled || !fields || !dndEnabled || !dndFields) return
  enabled.addEventListener('change', () => {
    fields.style.display = enabled.checked ? '' : 'none'
  })
  dndEnabled.addEventListener('change', () => {
    dndFields.style.display = dndEnabled.checked ? '' : 'none'
  })
}

function setChatSettingsDirty(settingsPage, dirty) {
  settingsPage.dataset.csDirty = dirty ? '1' : '0'
  const saveBtn = settingsPage.querySelector('#btn-cs-save')
  if (saveBtn) saveBtn.classList.toggle('is-dirty', !!dirty)
}

function markChatSettingsDirty(settingsPage) {
  setChatSettingsDirty(settingsPage, true)
}

function bindChatSettingsDirtyTracking(settingsPage) {
  const mark = () => markChatSettingsDirty(settingsPage)
  settingsPage.querySelectorAll('.cs-scroll input:not([type="file"]), .cs-scroll select, .cs-scroll textarea').forEach(el => {
    el.addEventListener('input', mark)
    el.addEventListener('change', mark)
  })
}

function bindMsgNotifyEvents(settingsPage) {
  settingsPage.querySelector('#cs-msg-notify-enabled')?.addEventListener('change', e => {
    const fields = settingsPage.querySelector('#cs-msg-notify-fields')
    if (fields) fields.style.display = e.target.checked ? '' : 'none'
    markChatSettingsDirty(settingsPage)
  })
}

function bindImageGenEvents(settingsPage) {
  settingsPage.querySelector('#cs-image-gen-enabled')?.addEventListener('change', e => {
    const fields = settingsPage.querySelector('#cs-image-gen-fields')
    if (fields) fields.style.display = e.target.checked ? '' : 'none'
    markChatSettingsDirty(settingsPage)
  })

  const fileInput = settingsPage.querySelector('#cs-image-ref-file')
  settingsPage.querySelector('#btn-cs-image-ref-upload')?.addEventListener('click', () => {
    fileInput?.click()
  })
  fileInput?.addEventListener('change', async e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type || !file.type.startsWith('image/')) {
      window.toast?.('请选择图片文件')
      e.target.value = ''
      return
    }
    try {
      const dataUrl = await readFileAsDataURL(file)
      updateImageReferencePreview(settingsPage, dataUrl)
      markChatSettingsDirty(settingsPage)
    } catch (err) {
      window.toast?.('读取图片失败：' + (err.message || String(err)))
    } finally {
      e.target.value = ''
    }
  })

  settingsPage.querySelector('#btn-cs-image-ref-generate')?.addEventListener('click', async () => {
    await generateChatReferenceImage(settingsPage)
  })
  settingsPage.querySelector('#cs-image-ref-preview')?.addEventListener('click', e => {
    const deleteBtn = e.target.closest('#btn-cs-image-ref-delete')
    if (!deleteBtn) return
    updateImageReferencePreview(settingsPage, '')
    markChatSettingsDirty(settingsPage)
  })
}

function readChatSettingsImageGenValue(settingsPage) {
  return normalizeChatImageGenSettings({
    enabled: !!settingsPage.querySelector('#cs-image-gen-enabled')?.checked,
    charImagePrompt: settingsPage.querySelector('#cs-image-gen-prompt')?.value.trim() || '',
    charReferenceImage: settingsPage.querySelector('#cs-image-ref-value')?.value.trim() || ''
  })
}

function updateImageReferencePreview(settingsPage, image) {
  const value = String(image || '').trim()
  const input = settingsPage.querySelector('#cs-image-ref-value')
  const preview = settingsPage.querySelector('#cs-image-ref-preview')
  if (input) input.value = value
  if (!preview) return
  preview.classList.toggle('has-image', !!value)
  preview.innerHTML = value
    ? `<img src="${wcEscHtml(value)}" alt="角色参考图"><button class="cs-image-ref-delete" id="btn-cs-image-ref-delete" type="button" aria-label="删除参考图"><i class="fa fa-times"></i></button>`
    : '<span>暂无参考图</span>'
}

function showImageReferenceNoPromptConfirm() {
  return new Promise(resolve => {
    const overlay = document.createElement('div')
    overlay.className = 'sheet-overlay'
    overlay.style.zIndex = '300'
    const modal = document.createElement('div')
    modal.className = 'center-modal'
    modal.style.zIndex = '301'
    modal.innerHTML = `
      <div class="sheet-title" style="text-align:center">外貌描述为空</div>
      <div style="padding:0 20px 16px;font-size:13px;color:var(--c-sub);line-height:1.7;text-align:center">
        未填写角色外貌描述，生成的参考图将完全随机，建议先填写外貌描述。
      </div>
      <div class="sheet-actions" style="display:flex;gap:10px;padding:0 20px 16px">
        <button class="btn-ghost btn-full" id="image-ref-prompt-cancel">取消</button>
        <button class="btn-pill btn-full" id="image-ref-prompt-continue">继续生成</button>
      </div>
    `
    const app = document.getElementById('app') || document.body
    app.appendChild(overlay)
    app.appendChild(modal)
    requestAnimationFrame(() => { overlay.classList.add('show'); modal.classList.add('show') })
    const close = (result) => {
      overlay.classList.remove('show')
      modal.classList.remove('show')
      setTimeout(() => { overlay.remove(); modal.remove() }, 300)
      resolve(result)
    }
    overlay.addEventListener('click', () => close(false))
    modal.querySelector('#image-ref-prompt-cancel').addEventListener('click', () => close(false))
    modal.querySelector('#image-ref-prompt-continue').addEventListener('click', () => close(true))
  })
}

async function normalizeGeneratedReferenceImage(image, cfg) {
  const blob = await generatedImageResultToBlob(image, cfg)
  return readFileAsDataURL(blob)
}

async function generateChatReferenceImage(settingsPage) {
  const btn = settingsPage.querySelector('#btn-cs-image-ref-generate')
  if (!btn || btn.classList.contains('is-loading')) return
  if (typeof loadImageGenConfig !== 'function' || typeof generateImageWithConfig !== 'function') {
    window.toast?.('图片生成接口不可用')
    return
  }

  const charPrompt = settingsPage.querySelector('#cs-image-gen-prompt')?.value.trim() || ''
  if (!charPrompt) {
    const confirmed = await showImageReferenceNoPromptConfirm()
    if (!confirmed) return
  }

  const oldHtml = btn.innerHTML
  btn.classList.add('is-loading')
  btn.disabled = true
  btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 生成中...'

  try {
    const cfg = await loadImageGenConfig()
    const prompt = 'A front-facing portrait photo, looking directly at camera, neutral background, studio lighting.'
      + (charPrompt ? ' Character: ' + charPrompt : '')
    const image = await generateImageWithConfig(cfg, prompt)
    const dataUrl = await normalizeGeneratedReferenceImage(image, cfg)
    updateImageReferencePreview(settingsPage, dataUrl)
    markChatSettingsDirty(settingsPage)
    window.toast?.('参考图已生成')
  } catch (e) {
    window.toast?.('生成参考图失败：' + (e.message || '请检查API设置'))
  } finally {
    btn.classList.remove('is-loading')
    btn.disabled = false
    btn.innerHTML = oldHtml
  }
}

function readChatSettingsLongMemoryValue(settingsPage) {
  return {
    enabled: !!settingsPage.querySelector('#cs-long-memory-enabled')?.checked,
    summarizeEvery: Math.max(1, parseInt(settingsPage.querySelector('#cs-long-memory-every')?.value || 30, 10) || 30),
    injectLimit: Math.max(1, parseInt(settingsPage.querySelector('#cs-long-memory-limit')?.value || 12, 10) || 12),
    embeddingEnabled: !!settingsPage.querySelector('#cs-long-memory-embedding')?.checked,
    decayStrength: settingsPage.querySelector('#cs-long-memory-decay')?.value || 'medium'
  }
}

function readChatSettingsTimeValue(settingsPage) {
  const enabled = settingsPage.querySelector('#cs-time-enabled')
  const modeInputs = [...settingsPage.querySelectorAll('input[name="cs-time-mode"]')]
  return normalizeChatTimeSettings({
    enabled: !!enabled?.checked,
    mode: (modeInputs.find(input => input.checked) || modeInputs[0])?.value,
    awareness: !!settingsPage.querySelector('#cs-time-awareness')?.checked
  })
}

function readChatSettingsActiveReplyValue(settingsPage) {
  return normalizeChatActiveReplySettings({
    enabled: !!settingsPage.querySelector('#cs-active-reply-enabled')?.checked,
    intervalMinutes: settingsPage.querySelector('#cs-active-reply-interval')?.value,
    dndEnabled: !!settingsPage.querySelector('#cs-active-reply-dnd-enabled')?.checked,
    dndStart: settingsPage.querySelector('#cs-active-reply-dnd-start')?.value,
    dndEnd: settingsPage.querySelector('#cs-active-reply-dnd-end')?.value
  })
}

function readChatSettingsAppearanceValue(settingsPage) {
  return normalizeChatAppearance({
    avatarSize: parseInt(settingsPage.querySelector('#cs-avatar-size')?.value || 34, 10) || 34,
    avatarRadius: parseInt(settingsPage.querySelector('#cs-avatar-radius')?.value || 4, 10) || 4,
    backgroundImage: settingsPage.querySelector('#cs-chat-bg-value')?.value.trim() || '',
    hideSelfAvatar: !!settingsPage.querySelector('#cs-hide-self-avatar')?.checked,
    hideOtherAvatar: !!settingsPage.querySelector('#cs-hide-other-avatar')?.checked
  })
}

function applyChatSettingsAppearancePreview(settingsPage, chatPage, value) {
  applyChatAppearanceValue(chatPage, value)
}

function restoreChatSettingsAppearancePreview(settingsPage, chatPage) {
  applyChatSettingsAppearancePreview(settingsPage, chatPage, {
    avatarSize: parseInt(settingsPage.dataset.csOriginalAvatarSize || 34, 10) || 34,
    avatarRadius: parseInt(settingsPage.dataset.csOriginalAvatarRadius || 4, 10) || 4,
    backgroundImage: settingsPage.dataset.csOriginalBackgroundImage || '',
    hideSelfAvatar: settingsPage.dataset.csOriginalHideSelfAvatar === '1',
    hideOtherAvatar: settingsPage.dataset.csOriginalHideOtherAvatar === '1'
  })
}

async function saveChatSettingsPage(settingsPage, chatId, charId, chatPage, char, options = {}) {
  if (settingsPage.dataset.csSaving === '1') return false
  settingsPage.dataset.csSaving = '1'
  const saveBtn = settingsPage.querySelector('#btn-cs-save')
  const oldSaveHtml = saveBtn?.innerHTML
  if (saveBtn) {
    saveBtn.disabled = true
    saveBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>'
  }
  try {
    const lorebooks = (await db.config.get('lorebooks'))?.value || []
    const checkedLoreIds = normalizeChatLoreMountIds(
      [...settingsPage.querySelectorAll('.cs-lore-check:checked:not(:disabled)')].map(el => el.value),
      lorebooks,
      charId
    )
    await db.config.put({ key: `chatLore_${chatId}`, value: checkedLoreIds })

    const oldProfile = await getWechatProfile(_wechatUid, charId)
    const oldAvatar = oldProfile.avatar || ''
    const avatar = settingsPage.querySelector('#cs-profile-avatar-value')?.value.trim() || ''
    const remark = settingsPage.querySelector('#cs-profile-remark')?.value.trim() || ''
    await db.config.put({
      key: getWechatProfileKey(_wechatUid, charId),
      value: {
        ...oldProfile,
        avatar,
        remark,
        avatarUpdatedAt: oldAvatar !== avatar ? Date.now() : (oldProfile.avatarUpdatedAt || null)
      }
    })

    await db.config.put({
      key: `chatBilingual_${chatId}`,
      value: normalizeChatBilingualSettings({
        enabled: !!settingsPage.querySelector('#cs-bilingual-enabled')?.checked,
        sourceLang: settingsPage.querySelector('#cs-bilingual-source')?.value,
        targetLang: settingsPage.querySelector('#cs-bilingual-target')?.value
      })
    })

    await db.config.put({
      key: `chatStatusDisplay_${chatId}`,
      value: { enabled: !!settingsPage.querySelector('#cs-status-display-enabled')?.checked }
    })

    await db.config.put({
      key: `chatMsgNotify_${chatId}`,
      value: normalizeChatMsgNotifySettings({
        enabled: !!settingsPage.querySelector('#cs-msg-notify-enabled')?.checked,
        mode: settingsPage.querySelector('input[name="cs-msg-notify-mode"]:checked')?.value
      })
    })

    await db.config.put({
      key: `chatStickerImageInput_${chatId}`,
      value: !!settingsPage.querySelector('#cs-sticker-image-input-enabled')?.checked
    })

    await db.config.put({ key: `chatImageGen_${chatId}`, value: readChatSettingsImageGenValue(settingsPage) })

    await db.config.put({ key: `chatTimeSettings_${chatId}`, value: readChatSettingsTimeValue(settingsPage) })
    await db.config.put({ key: `chatActiveReply_${chatId}`, value: readChatSettingsActiveReplyValue(settingsPage) })

    const selectedThought = settingsPage.querySelector('input[name="cs-thought-preset"]:checked')
    await db.config.put({
      key: `chatThoughtTemplate_${chatId}`,
      value: {
        enabled: !!settingsPage.querySelector('#cs-thought-template-enabled')?.checked,
        presetId: selectedThought?.value || null,
        promptSuffix: '',
        regexPattern: '',
        replacePattern: ''
      }
    })

    const selectedBeauty = settingsPage.querySelector('input[name="cs-chat-beauty-preset"]:checked')
    await db.config.put({ key: `chatBeauty_${chatId}`, value: { presetId: selectedBeauty?.value || '' } })

    const historyLimit = clampWechatMemoryLimit(settingsPage.querySelector('#cs-history-limit')?.value)
    const historyInput = settingsPage.querySelector('#cs-history-limit')
    const historySlider = settingsPage.querySelector('#cs-history-limit-slider')
    if (historyInput) historyInput.value = historyLimit
    if (historySlider) historySlider.value = historyLimit
    await db.config.put({ key: `chatMemory_${chatId}`, value: { historyLimit } })

    if (window.WanWanMemory?.saveSettings) {
      await window.WanWanMemory.saveSettings(chatId, readChatSettingsLongMemoryValue(settingsPage))
    }

    const tzToggle = settingsPage.querySelector('#cs-tz-enabled')
    await db.config.put({
      key: `chatTimezone_${chatId}`,
      value: {
        enabled: !!tzToggle?.checked,
        charLocation: settingsPage.querySelector('#cs-tz-char-location')?.value.trim() || '',
        charTimezone: settingsPage.querySelector('#cs-tz-char-tz')?.value || 'Asia/Shanghai',
        userLocation: settingsPage.querySelector('#cs-tz-user-location')?.value.trim() || '',
        userTimezone: settingsPage.querySelector('#cs-tz-user-tz')?.value || 'Asia/Shanghai',
      }
    })

    const checkedStickerIds = [...settingsPage.querySelectorAll('.cs-sticker-check:checked')].map(el => parseInt(el.value, 10))
    await setMountedStickerCatIds(chatId, checkedStickerIds)

    const appearanceValue = readChatSettingsAppearanceValue(settingsPage)
    await db.config.put({ key: `chatAppearance_${chatId}`, value: appearanceValue })

    const voiceId = settingsPage.querySelector('#cs-voice-id')?.value.trim() || ''
    await db.config.put({ key: `chatVoiceId_${chatId}`, value: voiceId })
    const fishVoiceEl = settingsPage.querySelector('#cs-fish-voice-id')
    if (fishVoiceEl && fishVoiceEl.dataset.loaded === '1') {
      await db.config.put({ key: `chatFishVoiceId_${chatId}`, value: fishVoiceEl.value.trim() })
    }

    settingsPage.dataset.csOriginalAvatarSize = String(appearanceValue.avatarSize)
    settingsPage.dataset.csOriginalAvatarRadius = String(appearanceValue.avatarRadius)
    settingsPage.dataset.csOriginalBackgroundImage = appearanceValue.backgroundImage
    settingsPage.dataset.csOriginalHideSelfAvatar = appearanceValue.hideSelfAvatar ? '1' : '0'
    settingsPage.dataset.csOriginalHideOtherAvatar = appearanceValue.hideOtherAvatar ? '1' : '0'
    applyChatSettingsAppearancePreview(settingsPage, chatPage, appearanceValue)
    if (chatPage && document.body.contains(chatPage)) {
      await applyChatBeauty(chatPage, chatId)
      applyChatSettingsAppearancePreview(settingsPage, chatPage, appearanceValue)
    }
    await refreshWechatDisplaySurfaces(chatPage, charId)
    setChatSettingsDirty(settingsPage, false)
    if (!options.silent) window.toast('聊天设置已保存')
    return true
  } catch (e) {
    window.toast('保存失败：' + (e.message || String(e)))
    return false
  } finally {
    settingsPage.dataset.csSaving = '0'
    if (saveBtn) {
      saveBtn.disabled = false
      saveBtn.innerHTML = oldSaveHtml
    }
  }
}

function handleChatSettingsBack(settingsPage, chatId, charId, chatPage, char) {
  if (settingsPage.dataset.csDirty !== '1') {
    window.closePage('chat-settings-page')
    return
  }
  showChatSettingsUnsavedConfirm({
    onDiscard: () => {
      restoreChatSettingsAppearancePreview(settingsPage, chatPage)
      window.closePage('chat-settings-page')
    },
    onSave: async () => {
      const ok = await saveChatSettingsPage(settingsPage, chatId, charId, chatPage, char, { silent: true })
      if (ok) window.closePage('chat-settings-page')
      return ok
    }
  })
}

function showChatSettingsUnsavedConfirm({ onDiscard, onSave }) {
  const sheet = wcMakeSheet(`
    <div class="sheet-title" style="text-align:center">保存更改？</div>
    <div style="padding:0 20px 16px;font-size:13px;color:var(--c-sub);line-height:1.7;text-align:center">
      有未保存的更改，是否保存后退出？
    </div>
    <div class="sheet-actions" style="display:flex;gap:10px">
      <button class="btn-ghost btn-full" id="cs-unsaved-discard" type="button">退出</button>
      <button class="btn-pill btn-full" id="cs-unsaved-save" type="button">保存</button>
    </div>
  `)
  sheet._wcOverlay = wcAttachSheet(sheet)
  sheet.querySelector('#cs-unsaved-discard').addEventListener('click', () => {
    closeWcSheet(sheet)
    onDiscard()
  })
  sheet.querySelector('#cs-unsaved-save').addEventListener('click', async () => {
    const btn = sheet.querySelector('#cs-unsaved-save')
    const oldHtml = btn.innerHTML
    btn.disabled = true
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 保存中'
    const ok = await onSave()
    if (ok) closeWcSheet(sheet)
    else {
      btn.disabled = false
      btn.innerHTML = oldHtml
    }
  })
}

function bindChatSettingsTabs(settingsPage) {
  const tabs = Array.from(settingsPage.querySelectorAll('.cs-tab'))
  const sections = Array.from(settingsPage.querySelectorAll('.cs-section[data-cs-tab]'))
  const activateTab = (tab) => {
    const activeTab = tab?.dataset.tab || 'role'
    tabs.forEach(item => {
      const active = item.dataset.tab === activeTab
      item.classList.toggle('is-active', active)
      item.setAttribute('aria-selected', active ? 'true' : 'false')
    })
    sections.forEach(section => {
      section.style.display = section.dataset.csTab === activeTab ? '' : 'none'
    })
  }
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activateTab(tab)
    })
  })
  activateTab(tabs.find(tab => tab.classList.contains('is-active')) || tabs[0])
}

function bindBilingualEvents(settingsPage, chatId, chatPage) {
  const enabled = settingsPage.querySelector('#cs-bilingual-enabled')
  const fields = settingsPage.querySelector('#cs-bilingual-fields')
  const source = settingsPage.querySelector('#cs-bilingual-source')
  const target = settingsPage.querySelector('#cs-bilingual-target')
  if (!enabled || !fields || !source || !target) return

  enabled.addEventListener('change', () => {
    fields.style.display = enabled.checked ? '' : 'none'
  })
}

function setProfileAvatarPreview(settingsPage, avatar) {
  const btn = settingsPage.querySelector('#btn-cs-hero-avatar')
  if (!btn) return
  const name = settingsPage.dataset.charName || '角色'
  btn.innerHTML = avatar
    ? `<img src="${wcEscHtml(avatar)}" alt="${wcEscHtml(name)}">`
    : buildWechatInitialAvatarHTML(name)
}

function showWechatProfileAvatarSheet(settingsPage, char) {
  const sheet = wcMakeSheet(`
    <div class="sheet-title" style="text-align:center">设置微信头像</div>
    <div class="sheet-actions cs-avatar-sheet-actions">
      <button class="btn-pill btn-full" id="cs-avatar-pick" type="button">
        <i class="fa fa-image"></i> 选择图片
      </button>
      <div class="cs-avatar-sheet-note">*此设置仅更改角色微信头像</div>
      <button class="btn-ghost btn-full" id="cs-avatar-restore" type="button">恢复档案头像</button>
      <button class="btn-ghost btn-full" id="cs-avatar-cancel" type="button">取消</button>
    </div>
  `)
  sheet._wcOverlay = wcAttachSheet(sheet)
  sheet.querySelector('#cs-avatar-cancel').addEventListener('click', () => closeWcSheet(sheet))
  sheet.querySelector('#cs-avatar-pick').addEventListener('click', () => {
    if (!window.showImagePicker) {
      window.toast?.('当前环境不支持选择图片')
      return
    }
    window.showImagePicker((result) => {
      const avatarInput = settingsPage.querySelector('#cs-profile-avatar-value')
      if (avatarInput) avatarInput.value = result || ''
      setProfileAvatarPreview(settingsPage, result || char?.avatar || '')
      markChatSettingsDirty(settingsPage)
      closeWcSheet(sheet)
    })
  })
  sheet.querySelector('#cs-avatar-restore').addEventListener('click', () => {
    const avatarInput = settingsPage.querySelector('#cs-profile-avatar-value')
    if (avatarInput) avatarInput.value = ''
    setProfileAvatarPreview(settingsPage, char?.avatar || '')
    markChatSettingsDirty(settingsPage)
    closeWcSheet(sheet)
  })
}

function bindWechatProfileEvents(settingsPage, chatId, charId, chatPage, char) {
  settingsPage.querySelector('#btn-cs-hero-avatar')?.addEventListener('click', () => {
    showWechatProfileAvatarSheet(settingsPage, char)
  })
}

function bindStatusDisplayEvents(settingsPage, chatId, charId, chatPage) {
  const toggle = settingsPage.querySelector('#cs-status-display-enabled')
  if (!toggle) return
}

function bindChatTimeSettingsEvents(settingsPage, chatId, chatPage) {
  const enabled = settingsPage.querySelector('#cs-time-enabled')
  const fields = settingsPage.querySelector('#cs-time-mode-fields')
  const awareness = settingsPage.querySelector('#cs-time-awareness')
  const modeInputs = [...settingsPage.querySelectorAll('input[name="cs-time-mode"]')]
  if (!enabled || !fields || !awareness || !modeInputs.length) return

  const syncFields = () => {
    fields.style.display = enabled.checked ? '' : 'none'
  }

  enabled.addEventListener('change', syncFields)
}



function bindThoughtTemplatePickerEvents(settingsPage, chatId) {
  const enabled = settingsPage.querySelector('#cs-thought-template-enabled')
  const picker = settingsPage.querySelector('#cs-preset-picker')
  if (!enabled || !picker) return
  enabled.addEventListener('change', () => {
    picker.style.display = enabled.checked ? '' : 'none'
  })
  const manageBtn = settingsPage.querySelector('#btn-manage-presets')
  if (manageBtn) {
    manageBtn.addEventListener('click', () => openThoughtPresetsPage())
  }
}

function bindChatBeautyPickerEvents(settingsPage, chatId, chatPage) {
  const manageBtn = settingsPage.querySelector('#btn-manage-chat-beauty')
  if (manageBtn) {
    manageBtn.addEventListener('click', () => openChatBeautyPresetsPage())
  }
}

function bindMemoryEvents(settingsPage, chatId) {
  const input = settingsPage.querySelector('#cs-history-limit')
  const slider = settingsPage.querySelector('#cs-history-limit-slider')
  const sync = (source) => {
    const value = clampWechatMemoryLimit(source.value)
    input.value = value
    slider.value = value
  }
  input.addEventListener('input', () => sync(input))
  slider.addEventListener('input', () => sync(slider))
}

function bindLongMemoryEvents(settingsPage, chatId, charId) {
  const manualBtn = settingsPage.querySelector('#btn-manual-long-memory')
  if (manualBtn) {
    manualBtn.addEventListener('click', async () => {
      if (!window.WanWanMemory?.summarizeNow) return
      const oldHtml = manualBtn.innerHTML
      manualBtn.disabled = true
      manualBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 总结中...'
      try {
        const result = await window.WanWanMemory.summarizeNow(chatId, charId, _wechatUid)
        if (result?.ok) {
          const suffix = result.embeddingFailed ? '，向量生成失败，已保存基础记忆' : ''
          window.toast(`已总结 ${result.messageCount} 条消息，生成 ${result.memoryCount} 条记忆${suffix}`)
          await refreshLongMemoryCountInSettings(settingsPage, chatId, charId)
        } else if (result?.reason) {
          window.toast(result.reason)
        }
      } catch (e) {
        window.toast('手动总结失败：' + (e.message || String(e)))
      } finally {
        manualBtn.disabled = false
        manualBtn.innerHTML = oldHtml
      }
    })
  }
  const openBtn = settingsPage.querySelector('#btn-open-long-memory')
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      if (window.showMemoryPage) {
        window.showMemoryPage({ ownerUid: _wechatUid, charId, chatId })
      }
    })
  }
}

async function refreshLongMemoryCountInSettings(settingsPage, chatId, charId) {
  if (!db.memories) return
  const count = await db.memories.where('chatId').equals(chatId)
    .filter(m => m.ownerUid === _wechatUid && m.charId === charId)
    .count()
  const rows = [...settingsPage.querySelectorAll('.cs-memory-row')]
  const row = rows.find(el => el.textContent.includes('绑定记忆'))
  const valueEl = row?.querySelector('span:last-child')
  if (valueEl) valueEl.textContent = `${count} 条`
}

async function refreshWechatDisplaySurfaces(chatPage, charId) {
  const displayChar = await getWechatDisplayCharacter(charId)
  if (chatPage && document.body.contains(chatPage)) {
    const headerName = chatPage.querySelector('.chat-header-name')
    if (headerName) {
      headerName.textContent = getWechatDisplayName(displayChar)
      headerName.dataset.origName = getWechatDisplayName(displayChar)
    }
    const chatId = parseInt(chatPage.dataset.chatId)
    if (chatId) await applyChatHeaderStatus(chatPage, chatId, charId)
    await refreshChat(chatPage, { force: true })
  }
  const wechatPage = document.getElementById('wechat-page')
  if (wechatPage) {
    const activeTab = wechatPage.querySelector('.wechat-tab.active')?.dataset.tab || 'chats'
    loadWechatTab(wechatPage, activeTab)
  }
}

function bindTimezoneEvents(settingsPage, chatId) {
  const toggle = settingsPage.querySelector('#cs-tz-enabled')
  const fields = settingsPage.querySelector('#cs-tz-fields')
  toggle.addEventListener('change', () => {
    fields.style.display = toggle.checked ? '' : 'none'
  })
}

// 表情包分组挂载：保存 + 跳转到管理页
function bindStickerSettingEvents(settingsPage, chatId, chatPage) {
  const openLibBtn = settingsPage.querySelector('#btn-open-sticker-lib')
  if (openLibBtn) {
    openLibBtn.addEventListener('click', () => openStickerLibraryPage())
  }
}

function updateChatBackgroundPreview(settingsPage, image) {
  const bgValue = String(image || '').trim()
  const input = settingsPage.querySelector('#cs-chat-bg-value')
  const preview = settingsPage.querySelector('#cs-chat-bg-preview')
  const pickBtn = settingsPage.querySelector('#btn-cs-chat-bg-pick')
  if (input) input.value = bgValue
  if (preview) {
    preview.style.backgroundImage = bgValue ? `url(${JSON.stringify(bgValue)})` : ''
    preview.classList.toggle('has-image', !!bgValue)
    const label = preview.querySelector('span')
    if (label) label.textContent = bgValue ? '更换背景' : '选择背景'
  }
  if (pickBtn) pickBtn.textContent = bgValue ? '更换背景' : '选择背景'
}

// 外观设置：背景/头像滑块/头像显示实时预览
function bindAppearanceEvents(settingsPage, chatId, chatPage) {
  const sizeInput   = settingsPage.querySelector('#cs-avatar-size')
  const sizeVal     = settingsPage.querySelector('#cs-avatar-size-val')
  const radiusInput = settingsPage.querySelector('#cs-avatar-radius')
  const radiusVal   = settingsPage.querySelector('#cs-avatar-radius-val')
  const bgPreview   = settingsPage.querySelector('#cs-chat-bg-preview')
  const bgPick      = settingsPage.querySelector('#btn-cs-chat-bg-pick')
  const bgReset     = settingsPage.querySelector('#btn-cs-chat-bg-reset')
  const hideSelf    = settingsPage.querySelector('#cs-hide-self-avatar')
  const hideOther   = settingsPage.querySelector('#cs-hide-other-avatar')
  const livePreview = () => {
    applyChatSettingsAppearancePreview(settingsPage, chatPage, readChatSettingsAppearanceValue(settingsPage))
  }
  const pickBackground = () => {
    if (!window.showImagePicker) {
      window.toast?.('当前环境不支持选择图片')
      return
    }
    window.showImagePicker((imageUrl) => {
      updateChatBackgroundPreview(settingsPage, imageUrl || '')
      livePreview()
      markChatSettingsDirty(settingsPage)
    })
  }
  sizeInput.addEventListener('input', () => {
    sizeVal.textContent = sizeInput.value + 'px'
    livePreview()
  })
  radiusInput.addEventListener('input', () => {
    radiusVal.textContent = radiusInput.value + 'px'
    livePreview()
  })
  if (bgPreview) bgPreview.addEventListener('click', pickBackground)
  if (bgPick) bgPick.addEventListener('click', pickBackground)
  if (bgReset) {
    bgReset.addEventListener('click', () => {
      updateChatBackgroundPreview(settingsPage, '')
      livePreview()
      markChatSettingsDirty(settingsPage)
    })
  }
  if (hideSelf) hideSelf.addEventListener('change', livePreview)
  if (hideOther) hideOther.addEventListener('change', livePreview)
}


// 导出聊天记录
async function exportChat(chatId, charId, char) {
  const msgs = await db.messages.where('chatId').equals(chatId).sortBy('createdAt')
  const data = { chatId, charId, charName: char?.name, exportedAt: Date.now(), messages: msgs }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `chat-${char?.name || charId}-${Date.now()}.json`
  a.click()
  window.toast('导出成功')
}

// 导入聊天记录
function bindImportChat(settingsPage, chatId, chatPage) {
  const importInput = settingsPage.querySelector('#chat-import-input')
  settingsPage.querySelector('#btn-import-chat').addEventListener('click', () => importInput.click())
  importInput.addEventListener('change', async e => {
    const file = e.target.files[0]
    if (!file) return
    await doImportChat(file, chatId, chatPage)
    importInput.value = ''
  })
}

// 执行导入
async function doImportChat(file, chatId, chatPage) {
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data.messages)) throw new Error('格式错误')
    const toImport = data.messages.map(m => {
      const message = { ...m, chatId, id: undefined }
      delete message.thoughtHtml
      delete message.thoughtRaw
      return message
    })
    await db.messages.bulkAdd(toImport)
    if (chatPage && document.body.contains(chatPage)) loadChatMessages(chatPage, chatId)
    window.toast(`已导入 ${toImport.length} 条消息`)
  } catch (err) {
    window.toast('导入失败：' + err.message)
  }
}


// 清除聊天记录确认
function clearChatConfirm(chatId, char, chatPage) {
  const sheet = wcMakeSheet(`
    <div class="sheet-handle"></div>
    <div style="padding:20px 20px 0;text-align:center">
      <div style="font-size:16px;font-weight:500;margin-bottom:8px">清除聊天记录</div>
      <div style="font-size:13px;color:var(--c-sub)">此操作不可恢复。你可以只清聊天记录，也可以同时清除此聊天绑定的长期记忆。</div>
    </div>
    <div style="padding:16px 20px;display:flex;flex-direction:column;gap:10px">
      <button class="btn-pill" id="sheet-confirm-chat">只清聊天记录</button>
      <button class="btn-pill" style="background:var(--c-red);color:#fff" id="sheet-confirm-all">聊天和长期记忆都清除</button>
      <button class="btn-ghost btn-pill" id="sheet-cancel">取消</button>
    </div>
  `)
  wcShowSheetNoConfirm(sheet)
  sheet.querySelector('#sheet-cancel').addEventListener('click', () => closeWcSheet(sheet))
  const clear = async (withMemory) => {
    await db.messages.where('chatId').equals(chatId).delete()
    if (db.mcpToolTraces) {
      await db.mcpToolTraces.where('[scope+conversationId]').equals(['chat', Number(chatId)]).delete()
    }
    if (withMemory && db.memories) {
      await db.memories.where('chatId').equals(chatId).delete()
      if (db.memoryRuns) await db.memoryRuns.where('chatId').equals(chatId).delete()
    }
    if (chatPage && document.body.contains(chatPage)) loadChatMessages(chatPage, chatId)
    window.toast(withMemory ? '聊天记录和长期记忆已清除' : '聊天记录已清除')
    closeWcSheet(sheet)
  }
  sheet.querySelector('#sheet-confirm-chat').addEventListener('click', () => clear(false))
  sheet.querySelector('#sheet-confirm-all').addEventListener('click', () => clear(true))
}


// ===== 心声模板预设管理（插件页） =====

function sanitizeTemplateFilenamePart(name) {
  const cleaned = String(name || '')
    .replace(/[\\/:*?"<>|\x00-\x1F]/g, '_')
    .replace(/[. ]+$/g, '')
    .trim()
  return cleaned || '未命名模板'
}

function getImportedTemplateName(filename, extension, prefix) {
  const escapedExtension = String(extension || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let name = String(filename || '').replace(new RegExp(escapedExtension + '$', 'i'), '')
  if (name.startsWith(prefix)) name = name.slice(prefix.length)
  return name.trim() || '未命名模板'
}

function downloadTemplateFile(content, filename, mimeType) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function exportThoughtPreset(preset) {
  const payload = {
    type: 'wanwan-thought-preset',
    version: 1,
    promptSuffix: String(preset?.promptSuffix || ''),
    regexPattern: String(preset?.regexPattern || ''),
    replacePattern: String(preset?.replacePattern || '')
  }
  const filename = `弯弯心声_${sanitizeTemplateFilenamePart(preset?.name)}.js`
  downloadTemplateFile(`export default ${JSON.stringify(payload, null, 2)};\n`, filename, 'application/javascript;charset=utf-8')
  window.toast('心声模板已导出')
}

function parseThoughtPresetModule(text) {
  const source = String(text || '').trim()
  if (!source) throw new Error('文件内容为空')
  const match = source.match(/^export\s+default\s+([\s\S]*?)\s*;?$/)
  if (!match) throw new Error('不是有效的弯弯心声文件')
  let payload
  try {
    payload = JSON.parse(match[1])
  } catch (error) {
    throw new Error('心声文件内容格式错误')
  }
  if (!payload || payload.type !== 'wanwan-thought-preset' || payload.version !== 1) {
    throw new Error('不支持的心声文件格式')
  }
  if (typeof payload.promptSuffix !== 'string' || typeof payload.regexPattern !== 'string' || typeof payload.replacePattern !== 'string') {
    throw new Error('心声文件缺少模板内容')
  }
  return payload
}

async function importThoughtPresetFile(file, page) {
  if (!/\.js$/i.test(file?.name || '')) throw new Error('请选择 JS 文件')
  const payload = parseThoughtPresetModule(await file.text())
  if (payload.regexPattern) {
    try {
      parseWechatRegexPattern(payload.regexPattern)
    } catch (error) {
      throw new Error('心声文件中的正则无效')
    }
  }
  const name = getImportedTemplateName(file.name, '.js', '弯弯心声_')
  await addThoughtPreset({
    name,
    promptSuffix: payload.promptSuffix,
    regexPattern: payload.regexPattern,
    replacePattern: payload.replacePattern
  })
  await renderPresetsList(page)
  window.toast(`已导入心声模板：${name}`)
}

async function openThoughtPresetsPage() {
  const page = document.createElement('div')
  page.id = 'thought-presets-page'
  page.className = 'full-page thought-presets-page'
  page.innerHTML = `
    <div class="page-header">
      <button class="header-back" id="btn-tp-back"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">HeartBeat</span>
      <div class="tp-header-actions">
        <button class="btn-icon tp-header-action" id="btn-tp-import" title="导入模板" aria-label="导入模板"><i class="fa fa-upload"></i></button>
        <button class="btn-icon tp-header-action" id="btn-tp-add" title="添加模板" aria-label="添加模板"><i class="fa fa-plus"></i></button>
      </div>
    </div>
    <input type="file" id="tp-import-input" hidden>
    <div class="tp-list" id="tp-list"></div>
  `
  window.openPage(page)
  page.querySelector('#btn-tp-back').addEventListener('click', () => window.closePage('thought-presets-page'))
  page.querySelector('#btn-tp-add').addEventListener('click', () => openPresetEditor(page))
  const importInput = page.querySelector('#tp-import-input')
  page.querySelector('#btn-tp-import').addEventListener('click', () => importInput.click())
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0]
    try {
      if (file) await importThoughtPresetFile(file, page)
    } catch (error) {
      window.toast('导入失败：' + (error?.message || '文件无效'))
    } finally {
      importInput.value = ''
    }
  })
  await renderPresetsList(page)
}

async function renderPresetsList(page) {
  const listEl = page.querySelector('#tp-list')
  const presets = await getThoughtPresets()
  if (!presets.length) {
    listEl.innerHTML = `
      <div class="tp-empty">
        <i class="fa fa-heart tp-empty-icon"></i>
        <div class="tp-empty-text">还没有心声模板</div>
        <div class="tp-empty-sub">创建模板后，可以在聊天设置中一键选用</div>
        <button class="btn-pill" id="btn-tp-create-first">创建第一个模板</button>
      </div>
    `
    listEl.querySelector('#btn-tp-create-first').addEventListener('click', () => openPresetEditor(page))
    return
  }
  listEl.innerHTML = `
    <div class="tp-list-card">
      ${presets.map(p => `
        <div class="tp-row" data-id="${p.id}">
          <div class="tp-row-icon"><i class="fa fa-heart"></i></div>
          <div class="tp-row-info">
            <div class="tp-row-name">${wcEscHtml(p.name || '未命名模板')}</div>
            <div class="tp-row-meta">${wcEscHtml(p.regexPattern || '无正则').substring(0, 40)}</div>
          </div>
          <div class="tp-row-actions">
            <button class="btn-icon tp-btn-edit" data-id="${p.id}" title="编辑"><i class="fa fa-pen"></i></button>
            <button class="btn-icon tp-btn-export" data-id="${p.id}" title="导出"><i class="fa fa-download"></i></button>
            <button class="btn-icon tp-btn-delete" data-id="${p.id}" title="删除"><i class="fa fa-trash"></i></button>
          </div>
        </div>
      `).join('')}
    </div>
  `
  listEl.querySelectorAll('.tp-btn-edit').forEach(btn => {
    btn.addEventListener('click', async () => {
      const presets = await getThoughtPresets()
      const preset = presets.find(p => p.id === btn.dataset.id)
      if (preset) openPresetEditor(page, preset)
    })
  })
  listEl.querySelectorAll('.tp-btn-export').forEach(btn => {
    btn.addEventListener('click', async () => {
      const presets = await getThoughtPresets()
      const preset = presets.find(p => p.id === btn.dataset.id)
      if (preset) exportThoughtPreset(preset)
    })
  })
  listEl.querySelectorAll('.tp-btn-delete').forEach(btn => {
    btn.addEventListener('click', () => confirmDeletePreset(page, btn.dataset.id))
  })
}

function confirmDeletePreset(page, presetId) {
  const sheet = wcMakeSheet(`
    <div class="sheet-handle"></div>
    <div style="padding:20px 20px 0;text-align:center">
      <div style="font-size:16px;font-weight:500;margin-bottom:8px">删除模板</div>
      <div style="font-size:13px;color:var(--c-sub)">删除后，使用此模板的聊天将回退到默认心声样式。</div>
    </div>
    <div style="padding:16px 20px;display:flex;gap:10px">
      <button class="btn-ghost btn-pill" style="flex:1" id="sheet-cancel">取消</button>
      <button class="btn-pill" style="flex:1;background:var(--c-red);color:#fff" id="sheet-confirm">删除</button>
    </div>
  `)
  wcShowSheetNoConfirm(sheet)
  sheet.querySelector('#sheet-cancel').addEventListener('click', () => closeWcSheet(sheet))
  sheet.querySelector('#sheet-confirm').addEventListener('click', async () => {
    await deleteThoughtPreset(presetId)
    closeWcSheet(sheet)
    window.toast('模板已删除')
    await renderPresetsList(page)
  })
}

function openPresetEditor(listPage, preset) {
  const isEdit = !!preset
  const page = document.createElement('div')
  page.id = 'thought-preset-editor'
  page.className = 'full-page thought-preset-editor'
  const cfg = preset || { name: '', promptSuffix: '', regexPattern: '', replacePattern: '' }
  page.innerHTML = `
    <div class="page-header">
      <button class="header-back" id="btn-tpe-back"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">${isEdit ? '编辑模板' : '新建模板'}</span>
    </div>
    <div class="tpe-scroll">
      <div class="cs-section">
        <label class="cs-field-label" for="tpe-name">模板名称</label>
        <input class="input-field" id="tpe-name" placeholder="例如：情绪分析模板" value="${wcEscHtml(cfg.name)}">
        <label class="cs-field-label" for="tpe-prompt">Prompt 部分</label>
        <textarea class="input-field cs-textarea" id="tpe-prompt" rows="4" placeholder="例如：thought 必须按「情绪：...｜想法：...」输出">${wcEscHtml(cfg.promptSuffix)}</textarea>
        <label class="cs-field-label" for="tpe-regex">Regex 部分</label>
        <input class="input-field" id="tpe-regex" placeholder="例如：情绪：(.+?)｜想法：([\\s\\S]+)" value="${wcEscHtml(cfg.regexPattern)}">
        <label class="cs-field-label" for="tpe-replace">正则替换部分</label>
        <textarea class="input-field cs-textarea" id="tpe-replace" rows="4" placeholder="<div class=&quot;thought-card&quot;><b>$1</b><p>$2</p></div>">${wcEscHtml(cfg.replacePattern)}</textarea>
        <label class="cs-field-label" for="tpe-test">测试文本</label>
        <textarea class="input-field cs-textarea" id="tpe-test" rows="3" placeholder="粘贴一段 thought 原文进行预览"></textarea>
        <div class="cs-template-preview-head">
          <span>预览</span>
          <span class="cs-template-status" id="tpe-preview-status">等待输入</span>
        </div>
        <div class="cs-template-preview" id="tpe-preview">请输入测试文本和正则</div>
        <button class="btn-pill btn-full" id="btn-tpe-save" type="button">${isEdit ? '保存修改' : '创建模板'}</button>
      </div>
    </div>
  `
  window.openPage(page)
  page.querySelector('#btn-tpe-back').addEventListener('click', () => window.closePage('thought-preset-editor'))
  ;['#tpe-test', '#tpe-regex', '#tpe-replace'].forEach(sel => {
    const el = page.querySelector(sel)
    if (el) el.addEventListener('input', () => updatePresetEditorPreview(page))
  })
  page.querySelector('#btn-tpe-save').addEventListener('click', async () => {
    const name = page.querySelector('#tpe-name').value.trim()
    const promptSuffix = page.querySelector('#tpe-prompt').value
    const regexPattern = page.querySelector('#tpe-regex').value
    const replacePattern = page.querySelector('#tpe-replace').value
    if (!name) { window.toast('请输入模板名称'); return }
    if (regexPattern) {
      try { parseWechatRegexPattern(regexPattern) }
      catch (e) { window.toast('正则无效，请检查'); return }
    }
    if (isEdit) {
      await updateThoughtPreset(preset.id, { name, promptSuffix, regexPattern, replacePattern })
      window.toast('模板已更新')
    } else {
      await addThoughtPreset({ name, promptSuffix, regexPattern, replacePattern })
      window.toast('模板已创建')
    }
    window.closePage('thought-preset-editor')
    await renderPresetsList(listPage)
  })
}

function updatePresetEditorPreview(page) {
  const testEl = page.querySelector('#tpe-test')
  const regexEl = page.querySelector('#tpe-regex')
  const replaceEl = page.querySelector('#tpe-replace')
  const statusEl = page.querySelector('#tpe-preview-status')
  const previewEl = page.querySelector('#tpe-preview')
  if (!testEl || !regexEl || !replaceEl || !statusEl || !previewEl) return
  const testText = testEl.value
  const regexPattern = regexEl.value
  const replacePattern = replaceEl.value
  if (!testText || !regexPattern) {
    statusEl.textContent = '等待输入'
    statusEl.className = 'cs-template-status'
    previewEl.textContent = '请输入测试文本和正则'
    return
  }
  try {
    const rendered = renderThoughtTemplateHtml(testText, {
      enabled: true, regexPattern, replacePattern
    })
    if (!rendered) {
      statusEl.textContent = '未匹配'
      statusEl.className = 'cs-template-status'
      previewEl.textContent = '正则未匹配到内容'
      return
    }
    statusEl.textContent = '匹配成功'
    statusEl.className = 'cs-template-status success'
    previewEl.innerHTML = rendered.thoughtHtml
  } catch (e) {
    statusEl.textContent = '正则错误'
    statusEl.className = 'cs-template-status error'
    previewEl.textContent = e.message || '正则错误'
  }
}

// ===== 聊天美化模板管理（我页） =====

function exportChatBeautyPreset(preset) {
  const filename = `弯弯美化_${sanitizeTemplateFilenamePart(preset?.name)}.css`
  downloadTemplateFile(String(preset?.css || ''), filename, 'text/css;charset=utf-8')
  window.toast('美化模板已导出')
}

async function importChatBeautyPresetFile(file, page) {
  if (!/\.css$/i.test(file?.name || '')) throw new Error('请选择 CSS 文件')
  const css = await file.text()
  if (!css.trim()) throw new Error('文件内容为空')
  const name = getImportedTemplateName(file.name, '.css', '弯弯美化_')
  await addChatBeautyPreset({ name, css })
  await renderChatBeautyPresetsList(page)
  window.toast(`已导入美化模板：${name}`)
}

async function openChatBeautyPresetsPage() {
  const page = document.createElement('div')
  page.id = 'chat-beauty-presets-page'
  page.className = 'full-page thought-presets-page chat-beauty-presets-page'
  page.innerHTML = `
    <div class="page-header">
      <button class="header-back" id="btn-cbp-back"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">美化</span>
      <div class="tp-header-actions">
        <button class="btn-icon tp-header-action" id="btn-cbp-import" title="导入模板" aria-label="导入模板"><i class="fa fa-upload"></i></button>
        <button class="btn-icon tp-header-action" id="btn-cbp-add" title="添加模板" aria-label="添加模板"><i class="fa fa-plus"></i></button>
      </div>
    </div>
    <input type="file" id="cbp-import-input" accept=".css" hidden>
    <div class="tp-list" id="cbp-list"></div>
  `
  window.openPage(page)
  page.querySelector('#btn-cbp-back').addEventListener('click', () => window.closePage('chat-beauty-presets-page'))
  page.querySelector('#btn-cbp-add').addEventListener('click', () => openChatBeautyEditor(page))
  const importInput = page.querySelector('#cbp-import-input')
  page.querySelector('#btn-cbp-import').addEventListener('click', () => importInput.click())
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0]
    try {
      if (file) await importChatBeautyPresetFile(file, page)
    } catch (error) {
      window.toast('导入失败：' + (error?.message || '文件无效'))
    } finally {
      importInput.value = ''
    }
  })
  await renderChatBeautyPresetsList(page)
}

async function renderChatBeautyPresetsList(page) {
  const listEl = page.querySelector('#cbp-list')
  const presets = await getChatBeautyPresets()
  if (!presets.length) {
    listEl.innerHTML = `
      <div class="tp-empty">
        <i class="fa-solid fa-wand-sparkles tp-empty-icon"></i>
        <div class="tp-empty-text">还没有美化模板</div>
        <div class="tp-empty-sub">创建模板后，可以在聊天设置中一键选用</div>
        <button class="btn-pill" id="btn-cbp-create-first">创建第一个模板</button>
      </div>
    `
    listEl.querySelector('#btn-cbp-create-first').addEventListener('click', () => openChatBeautyEditor(page))
    return
  }
  listEl.innerHTML = `
    <div class="tp-list-card">
      ${presets.map(p => `
        <div class="tp-row" data-id="${p.id}">
          <div class="tp-row-icon"><i class="fa-solid fa-wand-sparkles"></i></div>
          <div class="tp-row-info">
            <div class="tp-row-name">${wcEscHtml(p.name || '未命名模板')}</div>
            <div class="tp-row-meta">${wcEscHtml(String(p.css || '').replace(/\s+/g, ' ').trim() || '空 CSS').substring(0, 52)}</div>
          </div>
          <div class="tp-row-actions">
            <button class="btn-icon cbp-btn-edit" data-id="${p.id}" title="编辑"><i class="fa fa-pen"></i></button>
            <button class="btn-icon cbp-btn-export" data-id="${p.id}" title="导出"><i class="fa fa-download"></i></button>
            <button class="btn-icon cbp-btn-delete" data-id="${p.id}" title="删除"><i class="fa fa-trash"></i></button>
          </div>
        </div>
      `).join('')}
    </div>
  `
  listEl.querySelectorAll('.cbp-btn-edit').forEach(btn => {
    btn.addEventListener('click', async () => {
      const presets = await getChatBeautyPresets()
      const preset = presets.find(p => p.id === btn.dataset.id)
      if (preset) openChatBeautyEditor(page, preset)
    })
  })
  listEl.querySelectorAll('.cbp-btn-export').forEach(btn => {
    btn.addEventListener('click', async () => {
      const presets = await getChatBeautyPresets()
      const preset = presets.find(p => p.id === btn.dataset.id)
      if (preset) exportChatBeautyPreset(preset)
    })
  })
  listEl.querySelectorAll('.cbp-btn-delete').forEach(btn => {
    btn.addEventListener('click', () => confirmDeleteChatBeautyPreset(page, btn.dataset.id))
  })
}

function confirmDeleteChatBeautyPreset(page, presetId) {
  const sheet = wcMakeSheet(`
    <div class="sheet-handle"></div>
    <div style="padding:20px 20px 0;text-align:center">
      <div style="font-size:16px;font-weight:500;margin-bottom:8px">删除模板</div>
      <div style="font-size:13px;color:var(--c-sub)">删除后，使用此模板的聊天将回到默认样式。</div>
    </div>
    <div style="padding:16px 20px;display:flex;gap:10px">
      <button class="btn-ghost btn-pill" style="flex:1" id="sheet-cancel">取消</button>
      <button class="btn-pill" style="flex:1;background:var(--c-red);color:#fff" id="sheet-confirm">删除</button>
    </div>
  `)
  wcShowSheetNoConfirm(sheet)
  sheet.querySelector('#sheet-cancel').addEventListener('click', () => closeWcSheet(sheet))
  sheet.querySelector('#sheet-confirm').addEventListener('click', async () => {
    await deleteChatBeautyPreset(presetId)
    closeWcSheet(sheet)
    window.toast('模板已删除')
    await renderChatBeautyPresetsList(page)
    const chatPage = document.getElementById('chat-window')
    if (chatPage?.dataset.chatId) await applyChatBeauty(chatPage, parseInt(chatPage.dataset.chatId))
  })
}

function buildChatBeautyPreviewHTML() {
  const now = Date.now()
  const charName = '弯弯'
  const avatarHtml = '<span>弯</span>'
  const selfAvatarHtml = '<span>我</span>'
  const timeSettings = { enabled: true, mode: 'center' }
  const previewMsgs = [
    { id: 9001, role: 'assistant', content: '这是对方的普通消息', createdAt: now - 8 * 60 * 1000 },
    { id: 9002, role: 'assistant', content: `[${charName}引用"我：这是一段引用内容"并回复：我刚看到这句]`, createdAt: now - 7 * 60 * 1000 },
    { id: 9003, role: 'user', content: '这是我发送的消息', createdAt: now - 6 * 60 * 1000 },
    { id: 9004, role: 'assistant', content: `[${charName}撤回了一条消息：这条内容已经被撤回]`, createdAt: now - 5 * 60 * 1000 },
    { id: 9005, role: 'assistant', content: `[${charName}的语音：这是一段可以展开查看文字的语音消息]`, createdAt: now - 4 * 60 * 1000 },
    { id: 9006, role: 'assistant', content: `[${charName}的位置：预览地点；距你约2.4km]`, createdAt: now - 3 * 60 * 1000 },
    { id: 9007, role: 'assistant', content: `[${charName}的表情包：表情]`, createdAt: now - 2 * 60 * 1000 }
  ]
  const rows = [
    buildCenterTimestampHTML(now - 8 * 60 * 1000),
    ...previewMsgs.map(msg => buildMsgRowHTML(msg, charName, avatarHtml, selfAvatarHtml, {}, timeSettings)).filter(Boolean)
  ]
  return `
    <div class="chat-messages">${rows.join('')}</div>
    <div class="chat-input-area">
      <div class="quote-compose" style="display:none">
        <div class="quote-compose-line">
          <span class="quote-compose-name">弯弯</span>
          <span class="quote-compose-text">这是一条待引用的预览消息</span>
        </div>
        <button class="quote-compose-close" aria-label="取消引用">
          <i class="fa fa-times"></i>
        </button>
      </div>
      <div class="chat-input-bar">
        <button class="chat-reply-btn chat-action-reply" aria-label="回复"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
        <div class="chat-input-wrap">
          <textarea class="chat-input" rows="1" placeholder="发送消息..."></textarea>
          <div class="chat-input-actions">
            <button class="chat-input-icon chat-action-voice" aria-label="语音">${ICON_VOICE_SVG}</button>
            <button class="chat-input-icon chat-action-emoji" aria-label="表情">${ICON_EMOJI_SVG}</button>
            <button class="chat-input-icon chat-action-plus" aria-label="更多">${ICON_PLUS_SVG}</button>
          </div>
        </div>
      </div>
    </div>
  `
}

window.openChatBeautyCssPreview = function(css) {
  const existing = document.getElementById('chat-beauty-preview-page')
  if (existing) window.closePage('chat-beauty-preview-page')
  const page = document.createElement('div')
  page.id = 'chat-beauty-preview-page'
  page.className = 'full-page chat-window-page chat-beauty-preview-page'
  page.dataset.chatId = 'preview'
  page.dataset.beautyPreset = 'preview'
  setChatBeautyThemeIsolation(page, true)
  page.innerHTML = `
    <style id="cbe-preview-style">${scopeChatBeautyCss(css, '#chat-beauty-preview-page')}</style>
      <div class="page-header chat-header">
        <button class="header-back" id="btn-cbe-preview-back"><i class="fa fa-angle-left"></i></button>
        <div class="chat-header-info has-status">
          <span class="chat-header-name">聊天预览美化</span>
          <span class="chat-header-status"><span class="chat-status-dot"></span><span class="chat-status-text">Active Now</span></span>
        </div>
        <button class="btn-icon" id="btn-chat-settings"><i class="fa fa-ellipsis-h"></i></button>
      </div>
      ${buildChatBeautyPreviewHTML()}
  `
  window.openPage(page)
  page.querySelector('#btn-cbe-preview-back').addEventListener('click', () => window.closePage('chat-beauty-preview-page'))
  const input = page.querySelector('.chat-input')
  const plusBtn = page.querySelector('.chat-action-plus')
  if (input && plusBtn) {
    input.addEventListener('input', () => {
      const hasText = input.value.trim().length > 0
      plusBtn.classList.toggle('is-send', hasText)
      plusBtn.classList.toggle('chat-action-send', hasText)
      plusBtn.classList.toggle('chat-action-plus', !hasText)
      plusBtn.innerHTML = hasText ? '<i class="fa-solid fa-paper-plane"></i>' : ICON_PLUS_SVG
      plusBtn.setAttribute('aria-label', hasText ? '发送' : '更多')
    })
  }
}

function openChatBeautyPreviewPage(editorPage) {
  const css = editorPage.querySelector('#cbe-css')?.value || ''
  window.openChatBeautyCssPreview(css)
}

function openChatBeautyEditor(listPage, preset) {
  const isEdit = !!preset
  const page = document.createElement('div')
  page.id = 'chat-beauty-editor'
  page.className = 'full-page thought-preset-editor chat-beauty-editor'
  const cfg = preset || { name: '', css: '' }
  page.innerHTML = `
    <div class="page-header">
      <button class="header-back" id="btn-cbe-back"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">${isEdit ? '编辑美化' : '新建美化'}</span>
    </div>
    <div class="tpe-scroll">
      <div class="cs-section">
        <label class="cs-field-label" for="cbe-name">模板名称</label>
        <input class="input-field" id="cbe-name" placeholder="填入模版名称" value="${wcEscHtml(cfg.name)}">
        <div class="cs-template-preview-head">
          <span>CSS代码</span>
          <button class="tutorial-copy-btn" id="btn-cbe-copy-classes" type="button"><i class="fa-regular fa-clone"></i>复制类名</button>
        </div>
        <textarea class="input-field cs-textarea chat-beauty-css-input" id="cbe-css" rows="12" placeholder="${wcEscHtml(CHAT_BEAUTY_CLASS_HINT)}">${wcEscHtml(cfg.css || '')}</textarea>
        <button class="btn-ghost btn-full" id="btn-cbe-preview" type="button">展示预览</button>
        <button class="btn-pill btn-full" id="btn-cbe-save" type="button">${isEdit ? '保存修改' : '创建模板'}</button>
      </div>
    </div>
  `
  window.openPage(page)
  page.querySelector('#btn-cbe-back').addEventListener('click', () => window.closePage('chat-beauty-editor'))
  page.querySelector('#btn-cbe-copy-classes').addEventListener('click', () => {
    copyTextToClipboard(CHAT_BEAUTY_CLASS_TEXT)
      .then(() => window.toast('类名已复制'))
      .catch(() => window.toast('复制失败'))
  })
  page.querySelector('#btn-cbe-preview').addEventListener('click', () => openChatBeautyPreviewPage(page))
  page.querySelector('#btn-cbe-save').addEventListener('click', async () => {
    const name = page.querySelector('#cbe-name').value.trim()
    const css = page.querySelector('#cbe-css').value
    if (!name) { window.toast('请输入模板名称'); return }
    if (isEdit) {
      await updateChatBeautyPreset(preset.id, { name, css })
      window.toast('模板已更新')
    } else {
      await addChatBeautyPreset({ name, css })
      window.toast('模板已创建')
    }
    const chatPage = document.getElementById('chat-window')
    if (chatPage?.dataset.chatId) await applyChatBeauty(chatPage, parseInt(chatPage.dataset.chatId))
    window.closePage('chat-beauty-editor')
    await renderChatBeautyPresetsList(listPage)
  })
}

// ===== 表情包库（全局共享） =====
// 数据访问辅助
// 表情/分组排序：优先用 sortOrder，没有就按 id（旧数据保持原顺序）
function stickerOrderKey(x) {
  return Number.isFinite(x?.sortOrder) ? x.sortOrder : (Number(x?.id) || 0)
}
function sortByStickerOrder(list) {
  return (list || []).slice().sort((a, b) => stickerOrderKey(a) - stickerOrderKey(b) || (a.id - b.id))
}

async function getAllStickerCategories() {
  return sortByStickerOrder(await db.stickerCategories.orderBy('id').toArray())
}

async function getStickersInCategory(catId) {
  return sortByStickerOrder(await db.stickers.where('categoryId').equals(catId).toArray())
}

// 返回「放到该分组最前面 count 个」时的起始排序值
async function getStickerFrontStart(catId, count) {
  let min = 0
  let has = false
  await db.stickers.where('categoryId').equals(catId).each(s => {
    const k = stickerOrderKey(s)
    if (!has || k < min) { min = k; has = true }
  })
  return min - Math.max(1, count || 1)
}

// 把一个表情移到所在分组最前，返回新排序值
async function moveStickerToFront(stickerId) {
  const s = await db.stickers.get(stickerId)
  if (!s) throw new Error('表情不存在')
  const key = await getStickerFrontStart(s.categoryId, 1)
  await db.stickers.update(stickerId, { sortOrder: key })
  return key
}

// 按格子当前的显示顺序保存排序（只写有变化的，避免重写大量 base64 图片）
async function persistStickerOrder(container) {
  const ids = [...container.querySelectorAll('.sl-tile[data-id]')].map(el => parseInt(el.dataset.id))
  const keys = container._slKeys || (container._slKeys = {})
  for (let i = 0; i < ids.length; i++) {
    if (keys[ids[i]] === i) continue
    await db.stickers.update(ids[i], { sortOrder: i })
    keys[ids[i]] = i
  }
}

// 分组左移 / 右移 / 移到最前
async function moveStickerCategory(catId, action, page) {
  const cats = await getAllStickerCategories()
  const from = cats.findIndex(c => c.id === catId)
  if (from < 0) return
  let to = from
  if (action === 'left') to = from - 1
  else if (action === 'right') to = from + 1
  else if (action === 'front') to = 0
  if (to < 0 || to >= cats.length || to === from) {
    window.toast?.(action === 'right' ? '已经是最后一个了' : '已经是第一个了')
    return
  }
  const [moved] = cats.splice(from, 1)
  cats.splice(to, 0, moved)
  for (let i = 0; i < cats.length; i++) {
    if (stickerOrderKey(cats[i]) !== i) await db.stickerCategories.update(cats[i].id, { sortOrder: i })
  }
  if (page) await renderStickerLibraryPage(page)
}

async function getAllStickers() {
  return await db.stickers.toArray()
}

// 读取本会话挂载的表情包分组 id 列表
async function getMountedStickerCatIds(chatId) {
  const cfg = await db.config.get(`chatStickers_${chatId}`)
  return cfg?.value || []
}

async function setMountedStickerCatIds(chatId, ids) {
  await db.config.put({ key: `chatStickers_${chatId}`, value: ids })
}

// 构建本会话可用表情包：name → image map（按挂载分组）
async function getMountedStickerMap(chatId) {
  const ids = await getMountedStickerCatIds(chatId)
  if (!ids.length) return {}
  const stickers = await db.stickers.where('categoryId').anyOf(ids).toArray()
  const map = {}
  for (const s of stickers) {
    const name = String(s.name || '').trim()
    if (name) map[name] = s.image
  }
  return map
}

// 新增分组（确保不重名）
async function createStickerCategory(name) {
  const trimmed = (name || '').trim()
  if (!trimmed) throw new Error('分组名称不能为空')
  const all = await getAllStickerCategories()
  if (all.some(c => c.name === trimmed)) throw new Error('已存在同名分组')
  return await db.stickerCategories.add({ name: trimmed, createdAt: Date.now() })
}

// 从一个 URL 推断默认名称
function guessNameFromUrl(url) {
  try {
    const u = new URL(url)
    const last = u.pathname.split('/').filter(Boolean).pop() || ''
    return last.replace(/\.[a-z0-9]+$/i, '') || '表情'
  } catch {
    return '表情'
  }
}

// 一行解析为 { name, image } 或 null
function parseStickerLine(line) {
  const tokens = (line || '').split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return null
  const urlIdx = tokens.findIndex(t => /^https?:\/\/\S+/i.test(t))
  if (urlIdx === -1) return null
  const url = tokens[urlIdx]
  const name = tokens.filter((_, i) => i !== urlIdx).join(' ').trim() || guessNameFromUrl(url)
  return { name, image: url }
}

// 文件转 dataURL
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ===== 表情包库管理页 =====
async function openStickerLibraryPage() {
  const page = document.createElement('div')
  page.id = 'sticker-library-page'
  page.className = 'full-page sticker-library-page'
  page.innerHTML = `
    <div class="page-header">
      <button class="header-back" id="btn-sl-back"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">表情包</span>
      <button class="btn-icon" id="btn-sl-add-cat" title="添加分组">
        <i class="fa fa-folder-open"></i>
      </button>
      <button class="btn-icon" id="btn-sl-add-sticker" title="添加表情包">
        <i class="fa fa-plus"></i>
      </button>
    </div>
    <div class="sl-tabs" id="sl-tabs"></div>
    <div class="sl-content" id="sl-content"></div>
  `
  window.openPage(page)
    page.querySelector('#btn-sl-back').addEventListener('click', () => window.closePage('sticker-library-page'))
  // 排序模式：先点要移动的表情，再点要放在它前面的表情（点最后的「添加」格子 = 放到最后）
  page.querySelector('#btn-sl-add-cat').insertAdjacentHTML('beforebegin',
    '<button class="btn-icon" id="btn-sl-sort" title="排序"><i class="fa-solid fa-sort"></i></button>')
  page.querySelector('.page-header').insertAdjacentHTML('afterend',
    '<div class="sl-sort-hint" id="sl-sort-hint" style="display:none">排序模式：先点要移动的表情，再点要放在它前面的表情；点最后的“添加”格子＝放到最后。长按表情可“移到最前”，长按分组可调整分组顺序。</div>')
  page.querySelector('#btn-sl-sort').addEventListener('click', () => {
    const on = !page.classList.contains('sl-sorting')
    page.classList.toggle('sl-sorting', on)
    page._slPickId = null
    page.querySelectorAll('.sl-tile.sl-picked').forEach(t => t.classList.remove('sl-picked'))
    page.querySelector('#sl-sort-hint').style.display = on ? '' : 'none'
    page.querySelector('#btn-sl-sort').classList.toggle('active', on)
  })
  page.querySelector('#btn-sl-add-cat').addEventListener('click', () => promptAddStickerCategory(page))
  page.querySelector('#btn-sl-add-sticker').addEventListener('click', () => {
    const catId = parseInt(page.dataset.activeCat)
    openStickerImportDialog(catId || null, () => renderStickerLibraryPage(page))
  })
  await renderStickerLibraryPage(page)
}

async function renderStickerLibraryPage(page) {
  const tabsEl = page.querySelector('#sl-tabs')
  const contentEl = page.querySelector('#sl-content')
  const cats = await getAllStickerCategories()
  page.classList.toggle('sl-no-cats', cats.length === 0)
  if (!cats.length) {
    tabsEl.innerHTML = ''
    contentEl.innerHTML = `
      <div class="sl-empty">
        <i class="fa fa-smile-o sl-empty-icon"></i>
        <div class="sl-empty-text">还没有任何分组</div>
        <button class="btn-pill" id="btn-sl-create-first">创建第一个分组</button>
      </div>
    `
    contentEl.querySelector('#btn-sl-create-first').addEventListener('click', () => promptAddStickerCategory(page))
    page.dataset.activeCat = ''
    return
  }
  let activeId = parseInt(page.dataset.activeCat)
  if (!activeId || !cats.some(c => c.id === activeId)) {
    activeId = cats[0].id
    page.dataset.activeCat = activeId
  }
  tabsEl.innerHTML = cats.map(c => `
    <button class="sl-tab ${c.id === activeId ? 'active' : ''}" data-id="${c.id}">
      ${wcEscHtml(c.name)}
    </button>
  `).join('')
  tabsEl.querySelectorAll('.sl-tab').forEach(btn => {
    let pressTimer
    let menuShown = false
    const openMenu = () => {
      menuShown = true
      showCategoryMenu(parseInt(btn.dataset.id), btn, page)
    }
    btn.addEventListener('click', e => {
      if (menuShown) {
        menuShown = false
        e.preventDefault()
        e.stopPropagation()
        return
      }
      page.dataset.activeCat = btn.dataset.id
      renderStickerLibraryPage(page)
    })
    btn.addEventListener('contextmenu', e => {
      e.preventDefault()
      openMenu()
    })
    btn.addEventListener('touchstart', () => {
      pressTimer = setTimeout(openMenu, 600)
    })
    btn.addEventListener('touchend', () => clearTimeout(pressTimer))
    btn.addEventListener('touchcancel', () => clearTimeout(pressTimer))
    btn.addEventListener('touchmove', () => clearTimeout(pressTimer))
  })
  await renderStickerGrid(contentEl, activeId, page)
}

async function renderStickerGrid(container, catId, page) {
  const stickers = await getStickersInCategory(catId)
  container._slKeys = {}
  stickers.forEach(s => { container._slKeys[s.id] = stickerOrderKey(s) })
  if (page) page._slPickId = null
  const tiles = stickers.map(s => `
    <div class="sl-tile" data-id="${s.id}">
      <img src="${s.image}" alt="${wcEscHtml(s.name)}" loading="lazy">
      <span class="sl-tile-name">${wcEscHtml(s.name)}</span>
    </div>
  `).join('')
  container.innerHTML = `
    <div class="sl-grid">
      ${tiles}
      <button class="sl-tile sl-tile-add" id="sl-add-tile">
        <i class="fa fa-plus"></i>
        <span class="sl-tile-name">添加</span>
      </button>
    </div>
  `
    container.querySelector('#sl-add-tile').addEventListener('click', async () => {
    if (page?.classList.contains('sl-sorting') && page._slPickId) {
      // 排序模式下已选中某个表情：放到最后
      const picked = container.querySelector(`.sl-tile[data-id="${page._slPickId}"]`)
      page._slPickId = null
      if (picked) {
        picked.classList.remove('sl-picked')
        container.querySelector('.sl-grid').insertBefore(picked, container.querySelector('#sl-add-tile'))
        try { await persistStickerOrder(container) } catch (e) { window.toast('排序保存失败，请重试') }
      }
      return
    }
    openStickerImportDialog(catId, () => renderStickerLibraryPage(page))
  })
  container.querySelectorAll('.sl-tile[data-id]').forEach(tile => {
    let pressTimer
    let menuShown = false
    const openMenu = () => {
      menuShown = true
      showStickerMenu(parseInt(tile.dataset.id), tile, page)
    }
    tile.addEventListener('contextmenu', e => {
      e.preventDefault()
      openMenu()
    })
    tile.addEventListener('touchstart', () => {
      pressTimer = setTimeout(openMenu, 600)
    })
    tile.addEventListener('touchend', () => clearTimeout(pressTimer))
    tile.addEventListener('touchcancel', () => clearTimeout(pressTimer))
    tile.addEventListener('touchmove', () => clearTimeout(pressTimer))
    tile.addEventListener('click', e => {
      if (!menuShown) return
      menuShown = false
      e.preventDefault()
      e.stopPropagation()
    }, true)
    // 排序模式：点选 → 再点目标，把选中的插到目标前面
    tile.addEventListener('click', async e => {
      if (e.defaultPrevented || !page?.classList.contains('sl-sorting')) return
      const pickedId = page._slPickId
      if (!pickedId) { page._slPickId = tile.dataset.id; tile.classList.add('sl-picked'); return }
      const picked = container.querySelector(`.sl-tile[data-id="${pickedId}"]`)
      page._slPickId = null
      container.querySelectorAll('.sl-tile.sl-picked').forEach(t => t.classList.remove('sl-picked'))
      if (!picked || picked === tile) return
      tile.parentElement.insertBefore(picked, tile)
      try { await persistStickerOrder(container) } catch (err) { window.toast('排序保存失败，请重试') }
    })
  })
}

// 添加分组弹窗
function promptAddStickerCategory(page) {
  const sheet = wcMakeSheet(`
    <div class="sheet-title">新建分组</div>
    <div style="padding:0 20px 8px">
      <input class="input-field" id="cat-name-input" placeholder="分组名称（如：可爱、搞笑…）" maxlength="20">
    </div>
    <div class="sheet-actions">
      <button class="btn-ghost btn-pill" style="flex:1" id="cat-cancel">取消</button>
      <button class="btn-pill" style="flex:1" id="cat-confirm">创建</button>
    </div>
  `)
  wcShowSheetNoConfirm(sheet)
  setTimeout(() => sheet.querySelector('#cat-name-input').focus(), 80)
  sheet.querySelector('#cat-cancel').addEventListener('click', () => closeWcSheet(sheet))
  sheet.querySelector('#cat-confirm').addEventListener('click', async () => {
    const name = sheet.querySelector('#cat-name-input').value.trim()
    if (!name) { window.toast('请输入分组名称'); return }
    try {
      const newId = await createStickerCategory(name)
      closeWcSheet(sheet)
      window.toast('分组已创建')
      if (page) {
        page.dataset.activeCat = String(newId)
        await renderStickerLibraryPage(page)
      }
    } catch (e) {
      window.toast(e.message || '创建失败')
    }
  })
}

// 分组操作菜单：重命名/删除
function showCategoryMenu(catId, anchorEl, page) {
  const existing = document.getElementById('msg-menu')
  if (existing) existing.remove()
  const menu = document.createElement('div')
  menu.id = 'msg-menu'
  menu.className = 'msg-context-menu'
  menu.innerHTML = `
    <button data-action="left"><i class="fa fa-arrow-left"></i> 向前移一位</button>
    <button data-action="right"><i class="fa fa-arrow-right"></i> 向后移一位</button>
    <button data-action="front"><i class="fa fa-arrow-up"></i> 移到最前</button>
    <button data-action="rename"><i class="fa fa-pencil"></i> 重命名</button>
    <button data-action="delete"><i class="fa fa-trash"></i> 删除分组</button>
  `
  document.getElementById('app').appendChild(menu)
  positionMsgMenu(menu, anchorEl)
  menu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', async () => {
      menu.remove()
      const action = btn.dataset.action
      if (action === 'rename') promptRenameStickerCategory(catId, page)
      if (action === 'left' || action === 'right' || action === 'front') {
        try { await moveStickerCategory(catId, action, page) } catch (e) { window.toast('操作失败，请重试') }
      }
      if (action === 'delete') confirmDeleteStickerCategory(catId, page)
    })
  })
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 100)
}

function promptRenameStickerCategory(catId, page) {
  ;(async () => {
    const cat = await db.stickerCategories.get(catId)
    if (!cat) return
    const sheet = wcMakeSheet(`
      <div class="sheet-title">重命名分组</div>
      <div style="padding:0 20px 8px">
        <input class="input-field" id="cat-rename-input" value="${wcEscHtml(cat.name)}" maxlength="20">
      </div>
      <div class="sheet-actions">
        <button class="btn-ghost btn-pill" style="flex:1" id="cat-cancel">取消</button>
        <button class="btn-pill" style="flex:1" id="cat-confirm">保存</button>
      </div>
    `)
    wcShowSheetNoConfirm(sheet)
    setTimeout(() => sheet.querySelector('#cat-rename-input').focus(), 80)
    sheet.querySelector('#cat-cancel').addEventListener('click', () => closeWcSheet(sheet))
    sheet.querySelector('#cat-confirm').addEventListener('click', async () => {
      const name = sheet.querySelector('#cat-rename-input').value.trim()
      if (!name) { window.toast('名称不能为空'); return }
      const all = await getAllStickerCategories()
      if (all.some(c => c.id !== catId && c.name === name)) {
        window.toast('已存在同名分组'); return
      }
      await db.stickerCategories.update(catId, { name })
      closeWcSheet(sheet)
      window.toast('已重命名')
      if (page) await renderStickerLibraryPage(page)
    })
  })()
}

function confirmDeleteStickerCategory(catId, page) {
  ;(async () => {
    const cat = await db.stickerCategories.get(catId)
    if (!cat) return
    const count = await db.stickers.where('categoryId').equals(catId).count()
    const sheet = wcMakeSheet(`
      <div class="sheet-title">删除分组</div>
      <div style="padding:0 20px 8px;font-size:13px;color:var(--c-sub);text-align:center;line-height:1.7">
        将删除分组「${wcEscHtml(cat.name)}」及其下的 ${count} 个表情包，操作不可恢复。
      </div>
      <div class="sheet-actions">
        <button class="btn-ghost btn-pill" style="flex:1" id="del-cancel">取消</button>
        <button class="btn-pill" style="flex:1;background:var(--c-red);color:#fff" id="del-confirm">删除</button>
      </div>
    `)
    wcShowSheetNoConfirm(sheet)
    sheet.querySelector('#del-cancel').addEventListener('click', () => closeWcSheet(sheet))
    sheet.querySelector('#del-confirm').addEventListener('click', async () => {
      await db.stickers.where('categoryId').equals(catId).delete()
      await db.stickerCategories.delete(catId)
      closeWcSheet(sheet)
      window.toast('已删除')
      if (page) {
        if (parseInt(page.dataset.activeCat) === catId) page.dataset.activeCat = ''
        await renderStickerLibraryPage(page)
      }
    })
  })()
}

// 表情包操作菜单：重命名 / 移动 / 删除
function showStickerMenu(stickerId, anchorEl, page) {
  const existing = document.getElementById('msg-menu')
  if (existing) existing.remove()
  const menu = document.createElement('div')
  menu.id = 'msg-menu'
  menu.className = 'msg-context-menu'
  menu.innerHTML = `
    <button data-action="front"><i class="fa fa-arrow-up"></i> 移到最前</button>
    <button data-action="rename"><i class="fa fa-pencil"></i> 重命名</button>
    <button data-action="move"><i class="fa fa-folder-open"></i> 移动到</button>
    <button data-action="delete"><i class="fa fa-trash"></i> 删除</button>
  `
  document.getElementById('app').appendChild(menu)
  positionMsgMenu(menu, anchorEl)
  menu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', async () => {
      menu.remove()
      const action = btn.dataset.action
      if (action === 'rename') promptRenameSticker(stickerId, page)
      if (action === 'move') promptMoveSticker(stickerId, page)
      if (action === 'front') {
        try {
          const key = await moveStickerToFront(stickerId)
          const contentEl = page?.querySelector('#sl-content')
          const tile = page?.querySelector(`.sl-tile[data-id="${stickerId}"]`)
          if (tile?.parentElement) tile.parentElement.insertBefore(tile, tile.parentElement.firstElementChild)
          if (contentEl?._slKeys) contentEl._slKeys[stickerId] = key
          window.toast('已移到最前')
        } catch (e) {
          window.toast('操作失败，请重试')
        }
      }
      if (action === 'delete') {
        try {
          await db.stickers.delete(stickerId)
          window.toast('已删除')
          // 只移除对应瓦片，避免整页重渲染（iOS 上重建全部 base64 图片开销大）
          page?.querySelector(`.sl-tile[data-id="${stickerId}"]`)?.remove()
        } catch (e) {
          window.toast('删除失败，请刷新页面重试')
        }
      }
    })
  })
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 100)
}

function promptRenameSticker(stickerId, page) {
  ;(async () => {
    const s = await db.stickers.get(stickerId)
    if (!s) return
    const sheet = wcMakeSheet(`
      <div class="sheet-title">重命名表情包</div>
      <div style="padding:0 20px 8px">
        <input class="input-field" id="st-rename-input" value="${wcEscHtml(s.name)}" maxlength="20">
      </div>
      <div class="sheet-actions">
        <button class="btn-ghost btn-pill" style="flex:1" id="st-cancel">取消</button>
        <button class="btn-pill" style="flex:1" id="st-confirm">保存</button>
      </div>
    `)
    wcShowSheetNoConfirm(sheet)
    setTimeout(() => sheet.querySelector('#st-rename-input').focus(), 80)
    sheet.querySelector('#st-cancel').addEventListener('click', () => closeWcSheet(sheet))
    sheet.querySelector('#st-confirm').addEventListener('click', async () => {
      const name = sheet.querySelector('#st-rename-input').value.trim()
      if (!name) { window.toast('名称不能为空'); return }
      try {
        await db.stickers.update(stickerId, { name })
      } catch (e) {
        window.toast('重命名失败，请刷新页面重试')
        return
      }
      closeWcSheet(sheet)
      window.toast('已重命名')
      // 就地更新瓦片名称，避免整页重渲染
      const tile = page?.querySelector(`.sl-tile[data-id="${stickerId}"]`)
      if (tile) {
        const nameEl = tile.querySelector('.sl-tile-name')
        if (nameEl) nameEl.textContent = name
        const img = tile.querySelector('img')
        if (img) img.alt = name
      }
    })
  })()
}

function promptMoveSticker(stickerId, page) {
  ;(async () => {
    const cats = await getAllStickerCategories()
    if (cats.length <= 1) { window.toast('暂无其他分组可移动'); return }
    const s = await db.stickers.get(stickerId)
    if (!s) return
    const options = cats.map(c => `
      <label class="cs-lore-row">
        <input type="radio" name="move-cat" value="${c.id}" ${c.id === s.categoryId ? 'checked' : ''}>
        <div class="cs-lore-info">
          <span class="cs-lore-name">${wcEscHtml(c.name)}</span>
        </div>
      </label>
    `).join('')
    const sheet = wcMakeSheet(`
      <div class="sheet-title">移动到分组</div>
      <div style="padding:0 20px 8px;max-height:50vh;overflow-y:auto">
        ${options}
      </div>
      <div class="sheet-actions">
        <button class="btn-ghost btn-pill" style="flex:1" id="mv-cancel">取消</button>
        <button class="btn-pill" style="flex:1" id="mv-confirm">移动</button>
      </div>
    `)
    wcShowSheetNoConfirm(sheet)
    sheet.querySelector('#mv-cancel').addEventListener('click', () => closeWcSheet(sheet))
    sheet.querySelector('#mv-confirm').addEventListener('click', async () => {
      const checked = sheet.querySelector('input[name="move-cat"]:checked')
      if (!checked) return
      const newCatId = parseInt(checked.value)
      if (newCatId === s.categoryId) { closeWcSheet(sheet); return }
      try {
        const frontStart = await getStickerFrontStart(newCatId, 1)
        await db.stickers.update(stickerId, { categoryId: newCatId, sortOrder: frontStart })
      } catch (e) {
        window.toast('移动失败，请刷新页面重试')
        return
      }
      closeWcSheet(sheet)
      window.toast('已移动')
      // 该表情已不属于当前分组，直接移除瓦片，避免整页重渲染
      page?.querySelector(`.sl-tile[data-id="${stickerId}"]`)?.remove()
    })
  })()
}

// ===== 添加表情包导入弹窗 =====
// defaultCategoryId: 预选目标分组 id；onDone: 导入成功后回调
async function openStickerImportDialog(defaultCategoryId, onDone) {
  const cats = await getAllStickerCategories()
  if (!cats.length) {
    // 还没有分组，先引导创建
    window.toast('请先创建分组')
    promptAddStickerCategory(null)
    return
  }
  const targetId = (defaultCategoryId && cats.some(c => c.id === defaultCategoryId))
    ? defaultCategoryId : cats[0].id
  const sheet = wcMakeSheet(`
    <div class="sheet-title">添加表情包</div>
    <div style="padding:0 20px 8px;display:flex;flex-direction:column;gap:12px">
      <div class="si-field-label">导入到分组</div>
      <select class="input-field" id="si-cat-select">
        ${cats.map(c => `<option value="${c.id}" ${c.id === targetId ? 'selected' : ''}>${wcEscHtml(c.name)}</option>`).join('')}
      </select>
      <div class="si-source-row">
        <button class="si-src-btn" id="si-src-local">
          <i class="fa fa-folder-open"></i><span>从相册（多选）</span>
        </button>
        <button class="si-src-btn" id="si-src-url">
          <i class="fa fa-link"></i><span>粘贴URL</span>
        </button>
      </div>
      <textarea id="si-url-input" class="input-field" rows="4" placeholder="一行一组：每行可包含图片URL与名称（用空格分隔），例：&#10;开心 https://example.com/1.png&#10;https://example.com/2.png 大笑" style="display:none;min-height:96px;font-size:13px;line-height:1.6"></textarea>
      <input type="file" id="si-file-input" accept="image/*" multiple style="display:none">
      <div id="si-preview" class="si-preview" style="display:none"></div>
    </div>
    <div class="sheet-actions">
      <button class="btn-ghost btn-pill" style="flex:1" id="si-cancel">取消</button>
      <button class="btn-pill" style="flex:1" id="si-confirm" disabled>导入</button>
    </div>
  `)
  wcShowSheetNoConfirm(sheet)
  bindStickerImportDialog(sheet, onDone)
}

function bindStickerImportDialog(sheet, onDone) {
  const fileInput = sheet.querySelector('#si-file-input')
  const urlInput = sheet.querySelector('#si-url-input')
  const previewEl = sheet.querySelector('#si-preview')
  const confirmBtn = sheet.querySelector('#si-confirm')
  let pendingItems = []
  const refresh = () => renderStickerImportPreview(previewEl, pendingItems, () => {
    confirmBtn.disabled = pendingItems.length === 0
    if (!pendingItems.length) previewEl.style.display = 'none'
  })

  sheet.querySelector('#si-cancel').addEventListener('click', () => closeWcSheet(sheet))

  sheet.querySelector('#si-src-local').addEventListener('click', () => fileInput.click())
  fileInput.addEventListener('change', async e => {
    const files = [...(e.target.files || [])]
    if (!files.length) return
    for (const f of files) {
      try {
        const dataUrl = await readFileAsDataURL(f)
        pendingItems.push({ name: '', image: dataUrl })
      } catch {}
    }
    fileInput.value = ''
    previewEl.style.display = 'block'
    confirmBtn.disabled = pendingItems.length === 0
    refresh()
  })

  // 把当前 textarea 内容尝试解析到 pendingItems，返回新增数量
  const consumeUrlTextarea = () => {
    const lines = urlInput.value.split(/\r?\n/)
    let added = 0
    for (const line of lines) {
      const parsed = parseStickerLine(line)
      if (parsed) { pendingItems.push(parsed); added++ }
    }
    if (added > 0) {
      urlInput.value = ''
      previewEl.style.display = 'block'
      refresh()
    }
    return added
  }

  sheet.querySelector('#si-src-url').addEventListener('click', () => {
    urlInput.style.display = urlInput.style.display === 'none' ? 'block' : 'none'
    if (urlInput.style.display === 'block') urlInput.focus()
  })
  // 输入变化即放开"导入"按钮（避免必须先失焦才能确认）
  urlInput.addEventListener('input', () => {
    if (urlInput.value.trim() || pendingItems.length > 0) confirmBtn.disabled = false
  })
  // 失焦时即时解析，给用户即时反馈
  urlInput.addEventListener('blur', () => {
    if (!urlInput.value.trim()) return
    const added = consumeUrlTextarea()
    if (added > 0) window.toast(`已识别 ${added} 个表情包`)
    else window.toast('未识别到任何图片URL')
  })

  confirmBtn.addEventListener('click', async () => {
    // 先把 textarea 里的待解析内容也合并进来
    if (urlInput.value.trim()) consumeUrlTextarea()
    if (!pendingItems.length) {
      window.toast('请先选择图片或粘贴有效的图片URL')
      return
    }
    const catId = parseInt(sheet.querySelector('#si-cat-select').value)
    const now = Date.now()
    // 新导入的表情排在该分组最前面（同一批保持导入顺序）
    const frontStart = await getStickerFrontStart(catId, pendingItems.length)
    await db.stickers.bulkAdd(pendingItems.map((it, i) => ({
      categoryId: catId,
      name: String(it.name || '').trim().slice(0, 20),
      image: it.image,
      createdAt: now + i,
      sortOrder: frontStart + i
    })))
    closeWcSheet(sheet)
    window.toast(`已导入 ${pendingItems.length} 个表情包`)
    if (typeof onDone === 'function') onDone()
  })
}

function renderStickerImportPreview(container, items, afterChange) {
  if (!items.length) {
    container.innerHTML = ''
    if (afterChange) afterChange()
    return
  }
  container.innerHTML = items.map((it, i) => `
    <div class="si-row" data-i="${i}">
      <img src="${it.image}" class="si-thumb" alt="">
      <input class="input-field si-name-input" value="${wcEscHtml(it.name)}" maxlength="20">
      <button class="si-row-del" data-i="${i}" aria-label="删除"><i class="fa fa-times"></i></button>
    </div>
  `).join('')
  container.querySelectorAll('.si-name-input').forEach((inp, i) => {
    inp.addEventListener('input', () => { items[i].name = inp.value })
  })
  container.querySelectorAll('.si-row-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.i)
      items.splice(idx, 1)
      renderStickerImportPreview(container, items, afterChange)
    })
  })
  if (afterChange) afterChange()
}


// ===== Sheet工具函数 =====
// 微信内所有"sheet"统一渲染为居中弹窗（center-modal）
function wcMakeSheet(innerHtml) {
  const el = document.createElement('div')
  el.className = 'center-modal wc-center-modal'
  el.innerHTML = innerHtml
  return el
}

// 显示sheet（带确认按钮自动绑定）
function wcShowSheet(sheetEl, onConfirm) {
  const overlay = wcAttachSheet(sheetEl)
  const close = () => closeWcSheetCore(overlay, sheetEl)
  overlay.addEventListener('click', close)
  const confirmBtn = sheetEl.querySelector('.btn-pill')
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      const result = await onConfirm()
      if (result !== false) close()
    })
  }
}

// 显示sheet（无自动确认，由调用方自己绑定按钮）
function wcShowSheetNoConfirm(sheetEl) {
  const overlay = wcAttachSheet(sheetEl)
  overlay.addEventListener('click', () => closeWcSheetCore(overlay, sheetEl))
  sheetEl._wcOverlay = overlay
}

// 挂载sheet到DOM
function wcAttachSheet(sheetEl) {
  const overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '200'
  // 角色手机页面 z-index 为 360，弹层需要盖在其上
  if (isWechatRolePhoneMode()) {
    overlay.style.zIndex = '400'
    sheetEl.style.zIndex = '401'
  }
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(sheetEl)
  requestAnimationFrame(() => {
    overlay.classList.add('show')
    sheetEl.classList.add('show')
  })
  return overlay
}


// 关闭sheet（核心逻辑）
function closeWcSheetCore(overlay, sheetEl) {
  overlay.classList.remove('show')
  sheetEl.classList.remove('show')
  setTimeout(() => { overlay.remove(); sheetEl.remove() }, 300)
}

// 关闭sheet（封装）
function closeWcSheet(sheetEl) {
  const overlay = sheetEl._wcOverlay
  if (overlay) {
    closeWcSheetCore(overlay, sheetEl)
  } else {
    sheetEl.classList.remove('show')
    setTimeout(() => sheetEl.remove(), 300)
  }
}

// 中央错误弹窗（用于显示 AI / API 错误原因）
function showApiErrorModal(message, diagnostic) {
  const overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '300'
  const modal = document.createElement('div')
  modal.className = 'center-modal'
  modal.style.zIndex = '301'
  const diagText = String(diagnostic || '').trim()
  const diagHtml = diagText ? `
    <div style="padding:0 20px 12px">
      <pre id="api-err-diag" style="margin:0;padding:10px 12px;max-height:180px;overflow:auto;background:var(--c-bg,#f5f5f5);border:1px solid var(--c-border,#e0e0e0);border-radius:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:1.6;color:var(--c-sub);text-align:left;white-space:pre-wrap;word-break:break-all">${wcEscHtml(diagText)}</pre>
      <button class="btn-ghost" id="api-err-copy" style="margin-top:8px;width:100%;font-size:12px">复制诊断信息</button>
    </div>` : ''
  modal.innerHTML = `
    <div class="sheet-title" style="text-align:center">AI 回复失败</div>
    <div style="padding:0 20px 16px;font-size:13px;color:var(--c-sub);line-height:1.7;text-align:center;word-break:break-word;white-space:pre-wrap">${wcEscHtml(message || '未知错误')}</div>
    ${diagHtml}
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="api-err-ok">我知道了</button>
    </div>
  `
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(() => { overlay.classList.add('show'); modal.classList.add('show') })
  const close = () => {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(() => { overlay.remove(); modal.remove() }, 200)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#api-err-ok').addEventListener('click', close)
  const copyBtn = modal.querySelector('#api-err-copy')
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      let ok = false
      try {
        await navigator.clipboard.writeText(diagText)
        ok = true
      } catch (_) {
        try {
          const ta = document.createElement('textarea')
          ta.value = diagText
          ta.style.position = 'fixed'
          ta.style.opacity = '0'
          document.body.appendChild(ta)
          ta.select()
          ok = document.execCommand('copy')
          ta.remove()
        } catch (_) {}
      }
      window.toast(ok ? '已复制诊断信息' : '复制失败，请长按选择文本复制')
    })
  }
}

// ===== Voice ID 设置事件绑定 =====
function bindVoiceIdEvents(settingsPage, chatId) {
  // Voice ID 由聊天设置顶栏的统一保存按钮保存。
  const fishInput = settingsPage.querySelector('#cs-fish-voice-id')
  const resultsEl = settingsPage.querySelector('#cs-fish-results')
  if (!fishInput || !resultsEl) return

  db.config.get(`chatFishVoiceId_${chatId}`).then(r => {
    fishInput.value = r?.value || ''
    fishInput.dataset.loaded = '1'
  })

  const searchInput = settingsPage.querySelector('#cs-fish-search-input')
  const langSelect = settingsPage.querySelector('#cs-fish-lang')
  const searchBtn = settingsPage.querySelector('#cs-fish-search-btn')
  const mineBtn = settingsPage.querySelector('#cs-fish-mine-btn')
  const toast = (t) => window.toast && window.toast(t)
  const state = { self: false, title: '', language: '', page: 1, total: 0, loading: false, items: new Map() }
  let previewAudio = null
  let previewBtn = null

  function stopPreview() {
    if (previewAudio) { previewAudio.pause(); previewAudio = null }
    if (previewBtn) { previewBtn.textContent = '试听'; previewBtn = null }
  }

  function renderItems(items, append) {
    if (!append) resultsEl.innerHTML = ''
    items.forEach(it => {
      state.items.set(it._id, it)
      const langs = Array.isArray(it.languages) ? it.languages.join('/') : ''
      const author = it.author?.nickname || ''
      const meta = [langs, author].filter(Boolean).join(' · ')
      const hasSample = !!it.samples?.[0]?.audio
      const row = document.createElement('div')
      row.className = 'cs-fish-item' + (it._id === fishInput.value.trim() ? ' is-selected' : '')
      row.dataset.id = it._id
      row.innerHTML = `
        <div class="cs-fish-info">
          <div class="cs-fish-title">${wcEscHtml(it.title || '未命名')}</div>
          <div class="cs-fish-meta">${wcEscHtml(meta)}</div>
        </div>
        ${hasSample ? '<button type="button" class="cs-fish-btn cs-fish-play">试听</button>' : ''}
        <button type="button" class="cs-fish-btn cs-fish-pick">选用</button>
      `
      resultsEl.appendChild(row)
    })
    const oldMore = resultsEl.querySelector('.cs-fish-more')
    if (oldMore) oldMore.remove()
    if (state.items.size < state.total) {
      const more = document.createElement('button')
      more.type = 'button'
      more.className = 'cs-fish-btn cs-fish-more'
      more.textContent = '加载更多'
      resultsEl.appendChild(more)
    }
    if (!state.items.size) {
      resultsEl.innerHTML = '<div class="cs-fish-empty">没有找到音色</div>'
    }
  }

  async function loadVoices(reset) {
    if (state.loading) return
    state.loading = true
    if (reset) {
      state.page = 1
      state.items = new Map()
      resultsEl.innerHTML = '<div class="cs-fish-empty">加载中…</div>'
    } else {
      state.page += 1
    }
    try {
      const data = await fishListVoices({
        title: state.title, language: state.language, self: state.self, pageNumber: state.page, pageSize: 10
      })
      state.total = data.total || 0
      renderItems(data.items || [], !reset)
    } catch (e) {
      if (!reset) state.page -= 1
      resultsEl.innerHTML = `<div class="cs-fish-empty">${wcEscHtml(e.message || String(e))}</div>`
    } finally {
      state.loading = false
    }
  }

  function startSearch(self) {
    stopPreview()
    state.self = self
    state.title = self ? '' : (searchInput.value || '').trim()
    state.language = self ? '' : (langSelect.value || '')
    loadVoices(true)
  }

  searchBtn.addEventListener('click', () => startSearch(false))
  mineBtn.addEventListener('click', () => startSearch(true))
  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); startSearch(false) } })

  resultsEl.addEventListener('click', e => {
    const btn = e.target.closest('button')
    if (!btn) return
    if (btn.classList.contains('cs-fish-more')) { loadVoices(false); return }
    const row = btn.closest('.cs-fish-item')
    const item = row && state.items.get(row.dataset.id)
    if (!item) return
    if (btn.classList.contains('cs-fish-pick')) {
      fishInput.value = item._id
      resultsEl.querySelectorAll('.cs-fish-item').forEach(el => el.classList.toggle('is-selected', el === row))
      markChatSettingsDirty(settingsPage)
      toast('已填入音色，记得点右上角保存')
      return
    }
    if (btn.classList.contains('cs-fish-play')) {
      const wasThis = previewBtn === btn
      stopPreview()
      if (wasThis) return
      const url = item.samples?.[0]?.audio
      if (!url) return
      previewAudio = new Audio(url)
      previewBtn = btn
      btn.textContent = '停止'
      previewAudio.addEventListener('ended', stopPreview)
      previewAudio.addEventListener('error', () => { stopPreview(); toast('试听加载失败') })
      previewAudio.play().catch(() => { stopPreview(); toast('试听播放失败') })
    }
  })
}

// ===== Minimax TTS 调用 =====
async function getMinimaxConfig() {
  const results = await Promise.all([
    db.config.get('minimaxVersion'),
    db.config.get('minimaxGroupId'),
    db.config.get('minimaxApiKey'),
    db.config.get('minimaxModel')
  ])
  return {
    version: results[0]?.value || 'domestic',
    groupId: results[1]?.value || '',
    apiKey: results[2]?.value || '',
    model: results[3]?.value || ''
  }
}

async function callMinimaxTTS(text, voiceId) {
  const cfg = await getMinimaxConfig()
  if (!cfg.groupId || !cfg.apiKey) throw new Error('Minimax API 未配置，请在设置中填写 Group ID 和 API Key')
  if (!cfg.model) throw new Error('Minimax 语音模型未选择，请在设置中选择模型')
  if (!voiceId) throw new Error('Voice ID 未配置，请在聊天设置中填写')

  const host = cfg.version === 'international' ? 'https://api.minimaxi.chat' : 'https://api.minimax.chat'
  const url = `${host}/v1/t2a_v2?GroupId=${encodeURIComponent(cfg.groupId)}`

  const body = {
    model: cfg.model,
    text: text,
    stream: false,
    voice_setting: {
      voice_id: voiceId,
      speed: 1.0,
      vol: 1.0,
      pitch: 0
    },
    audio_setting: {
      sample_rate: 32000,
      bitrate: 128000,
      format: 'mp3'
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + cfg.apiKey
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    let detail = ''
    try {
      const j = await res.json()
      detail = j?.base_resp?.status_msg || j?.error?.message || j?.message || ''
    } catch (_) {}
    throw new Error('Minimax TTS HTTP ' + res.status + (detail ? '：' + detail.slice(0, 300) : ''))
  }

  const json = await res.json()
  if (json?.base_resp?.status_code !== 0 && json?.base_resp?.status_code !== undefined) {
    throw new Error('Minimax TTS 错误：' + (json.base_resp.status_msg || '未知错误'))
  }

  const audioHex = json?.data?.audio
  if (!audioHex) throw new Error('Minimax TTS 未返回音频数据')

  const bytes = new Uint8Array(audioHex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(audioHex.substr(i * 2, 2), 16)
  }
  const blob = new Blob([bytes], { type: 'audio/mpeg' })
  return URL.createObjectURL(blob)
}

// ===== Fish Audio TTS =====
async function getTTSProvider() {
  const r = await db.config.get('ttsProvider')
  return r?.value === 'fish' ? 'fish' : 'minimax'
}

// 按当前语音服务取该聊天的音色 ID（Minimax 和 Fish 的音色 ID 分开存）
async function getChatVoiceId(chatId) {
  const provider = await getTTSProvider()
  const r = await db.config.get(provider === 'fish' ? `chatFishVoiceId_${chatId}` : `chatVoiceId_${chatId}`)
  return r?.value || ''
}

async function getFishConfig() {
  const results = await Promise.all([
    db.config.get('fishBaseUrl'),
    db.config.get('fishApiKey'),
    db.config.get('fishModel')
  ])
  return {
    base: (results[0]?.value || 'https://api.fish.audio').replace(/\/+$/, ''),
    apiKey: results[1]?.value || '',
    model: results[2]?.value || ''
  }
}

async function fishRequest(cfg, path, init) {
  let res
  try {
    res = await fetch(cfg.base + path, init)
  } catch (e) {
    throw new Error('无法连接 Fish Audio：可能没开 VPN，或浏览器被跨域（CORS）拦截。' + (e.message ? '（' + e.message + '）' : ''))
  }
  if (!res.ok) {
    let detail = ''
    try {
      const j = await res.json()
      detail = j?.message || j?.error?.message || (Array.isArray(j) ? JSON.stringify(j[0]?.msg || j[0]) : '')
    } catch (_) {}
    const hint = res.status === 401 ? '（API Key 不对）' : res.status === 402 ? '（余额/额度不足）' : ''
    throw new Error('Fish Audio HTTP ' + res.status + hint + (detail ? '：' + String(detail).slice(0, 300) : ''))
  }
  return res
}

async function callFishTTS(text, voiceId) {
  const cfg = await getFishConfig()
  if (!cfg.apiKey) throw new Error('Fish Audio API Key 未配置，请在设置中填写')
  if (!cfg.model) throw new Error('Fish Audio 语音模型未选择，请在设置中选择模型')
  if (!voiceId) throw new Error('Fish 音色 ID 未配置，请在聊天设置中填写')

  console.info('[Fish TTS] 发送文字：', text)
  const res = await fishRequest(cfg, '/v1/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + cfg.apiKey,
      'model': cfg.model
    },
    body: JSON.stringify({
      text: text,
      reference_id: voiceId,
      format: 'mp3',
      mp3_bitrate: 128,
      latency: 'normal'
    })
  })
  const blob = await res.blob()
  if (!blob.size) throw new Error('Fish Audio 未返回音频数据')
  return URL.createObjectURL(new Blob([blob], { type: 'audio/mpeg' }))
}

// 角色在文字里用【中文语气】标语气；Fish 朗读前换成 [中文语气]（S2.1 的标签语法，不会被读出来），Minimax 不支持就直接去掉
function prepareTTSText(text, provider) {
  const s = String(text || '')
  if (provider === 'fish') return s.replace(/【([^】\n]{1,30})】/g, '[$1]')
  return s.replace(/【[^】\n]{0,30}】/g, '').replace(/[ \t]{2,}/g, ' ').trim()
}

// ===== 语音持久缓存 =====
// 以前同一句话每次打开都要重新向 Fish/Minimax 请求（通话记录里的朗读只在“本次打开期间”缓存在内存里）。
// 现在统一在 callTTS 里按“语音服务 + 音色 + 文字”缓存到浏览器自己的一个小数据库（独立于聊天数据库，
// 不会进聊天备份、不改表结构），最多留最近 300 句，满了删最旧的。
// 通话里实时朗读的每一句也会存进来，所以之后在通话记录里点朗读是直接播放，不再重新生成。
const TTS_CACHE_DB = 'wanwan_tts_cache'
const TTS_CACHE_STORE = 'audio'
const TTS_CACHE_MAX = 300
let _ttsCacheDbPromise = null

function ttsCacheOpen() {
  if (_ttsCacheDbPromise) return _ttsCacheDbPromise
  _ttsCacheDbPromise = new Promise(resolve => {
    try {
      const req = indexedDB.open(TTS_CACHE_DB, 1)
      req.onupgradeneeded = () => {
        const s = req.result.createObjectStore(TTS_CACHE_STORE, { keyPath: 'key' })
        s.createIndex('at', 'at')
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
      req.onblocked = () => resolve(null)
    } catch (_) { resolve(null) }
  })
  return _ttsCacheDbPromise
}

function ttsCacheKey(provider, voiceId, text) { return provider + '|' + voiceId + '|' + text }

async function ttsCacheGet(key) {
  const d = await ttsCacheOpen()
  if (!d) return null
  return new Promise(resolve => {
    try {
      const rq = d.transaction(TTS_CACHE_STORE).objectStore(TTS_CACHE_STORE).get(key)
      rq.onsuccess = () => resolve((rq.result && rq.result.blob) || null)
      rq.onerror = () => resolve(null)
    } catch (_) { resolve(null) }
  })
}

async function ttsCachePut(key, blob) {
  const d = await ttsCacheOpen()
  if (!d) return
  try {
    await new Promise(resolve => {
      const tx = d.transaction(TTS_CACHE_STORE, 'readwrite')
      tx.objectStore(TTS_CACHE_STORE).put({ key, blob, at: Date.now() })
      tx.oncomplete = resolve
      tx.onerror = resolve
      tx.onabort = resolve
    })
    await new Promise(resolve => {
      const tx = d.transaction(TTS_CACHE_STORE, 'readwrite')
      const st = tx.objectStore(TTS_CACHE_STORE)
      const cr = st.count()
      cr.onsuccess = () => {
        let over = cr.result - TTS_CACHE_MAX
        if (over <= 0) return
        const cur = st.index('at').openCursor()
        cur.onsuccess = () => {
          const c = cur.result
          if (c && over-- > 0) { c.delete(); c.continue() }
        }
      }
      tx.oncomplete = resolve
      tx.onerror = resolve
      tx.onabort = resolve
    })
  } catch (_) {}
}

// 统一入口：按当前语音服务生成语音，返回 blob 地址（先查本地缓存，没有才请求）
async function callTTS(text, voiceId) {
  const provider = await getTTSProvider()
  const prepared = prepareTTSText(text, provider)
  if (!prepared) throw new Error('没有可朗读的文字')
  const key = ttsCacheKey(provider, voiceId, prepared)
  const hit = await ttsCacheGet(key)
  if (hit && hit.size) return URL.createObjectURL(hit)
  const url = provider === 'fish' ? await callFishTTS(prepared, voiceId) : await callMinimaxTTS(prepared, voiceId)
  try {
    const blob = await (await fetch(url)).blob()
    if (blob.size) ttsCachePut(key, blob)
  } catch (_) {}
  return url
}

// 让角色在语音文字里写语气标签的提示词；只有当前语音服务是 Fish 时才加
// 想改成英文标签：把下面 TTS_TAG_EXAMPLES 换成 【whispering】【laughing】【sighing】 之类，并改"2-6 个字"那句
const TTS_TAG_EMOTION_HINTS = '开心：【带着笑意，语调上扬】；温柔：【轻柔缓慢，气息贴近】；难过：【气声，拖着尾音】；哽咽：【声音发颤，带着鼻音】；生气：【压低声音，克制地】；烦躁：【短促，不耐烦地叹气】；惊讶：【吸气，惊讶地】；紧张：【急促，声音发颤】；害羞：【小声，有点结巴】'
const TTS_TAG_EXAMPLES = '【轻声】【低声】【轻笑】【叹气】【撒娇】【害羞】【生气】【哽咽】【停顿】'
// 课表上下文（来自设置里导入的 ICS，只放今天，18:00 后加明天）
async function getScheduleContext() {
  try {
    if (window.ScheduleCtx && typeof window.ScheduleCtx.build === 'function') return await window.ScheduleCtx.build()
  } catch (_) {}
  return ''
}

// ===== 角色日程：角色在聊天里说过的安排（上班、执飞、开会……）=====
// 思路：角色回复时顺带输出 event（开始多久后、持续多久），代码换算成具体的开始/结束时间并存起来；
// 之后聊天、通话里都会带上这份日程，主动回复也会看它：忙的时候不打扰，到点还没报平安就提醒他。
// 相对时间不入库：只存换算后的具体时间；时长缺失或不合理的直接丢弃，不猜。
const CHAR_SCHEDULE_KEY = 'charSchedule'

async function charScheduleLoad() {
  try {
    const rec = await db.config.get(CHAR_SCHEDULE_KEY)
    const v = rec && rec.value
    return (v && Array.isArray(v.events)) ? v : { events: [] }
  } catch (_) { return { events: [] } }
}

async function charScheduleSave(data) {
  const cutoff = Date.now() - 3 * 86400000
  data.events = (data.events || []).filter(e => e && e.endAt > cutoff).slice(-60)
  try { await db.config.put({ key: CHAR_SCHEDULE_KEY, value: data }) } catch (e) { console.warn('[wechat] 保存角色日程失败', e) }
}

// upcoming 稍后 / active 进行中 / overdue 已过预计结束但没确认 / done 已结束
function charEventPhase(ev, now = Date.now()) {
  if (ev.status === 'done' || ev.status === 'cancelled') return 'done'
  if (now < ev.startAt) return 'upcoming'
  if (now < ev.endAt) return 'active'
  return 'overdue'
}

async function applyCharScheduleFromReply(chatId, charId, result) {
  try {
    if (!result) return
    const wantsDone = result.eventDone === true
    const ev = result.event
    if (!wantsDone && !ev) return
    const now = Date.now()
    const data = await charScheduleLoad()
    let changed = false
    if (wantsDone) {
      data.events.forEach(e => {
        if (String(e.chatId) !== String(chatId)) return
        const ph = charEventPhase(e, now)
        if (ph === 'active' || ph === 'overdue') { e.status = 'done'; e.doneAt = now; changed = true }
      })
    }
    if (ev && typeof ev === 'object') {
      const title = String(ev.title || '').trim().slice(0, 20)
      const startIn = ev.start_in_minutes == null ? 0 : Number(ev.start_in_minutes)
      const dur = Number(ev.duration_minutes)
      if (title && Number.isFinite(startIn) && startIn >= 0 && startIn <= 4320 && Number.isFinite(dur) && dur >= 5 && dur <= 4320) {
        const startAt = now + Math.round(startIn) * 60000
        const endAt = startAt + Math.round(dur) * 60000
        const same = data.events.find(e => String(e.chatId) === String(chatId) && e.title === title &&
          e.status !== 'done' && e.status !== 'cancelled' && Math.abs(e.startAt - startAt) < 60 * 60000)
        if (same) { same.startAt = startAt; same.endAt = endAt; same.sourceAt = now; delete same.notifiedAt }
        else data.events.push({
          id: 'ce_' + now + '_' + Math.random().toString(36).slice(2, 6),
          chatId, charId, title, sourceAt: now, startAt, endAt, status: 'active'
        })
        changed = true
      }
    }
    if (changed) await charScheduleSave(data)
  } catch (e) { console.warn('[wechat] 登记角色日程失败', e) }
}

async function getCharScheduleState(chatId) {
  const data = await charScheduleLoad()
  const now = Date.now()
  const mine = data.events.filter(e => String(e.chatId) === String(chatId))
  return {
    data,
    active: mine.find(e => charEventPhase(e, now) === 'active') || null,
    overdue: mine.filter(e => charEventPhase(e, now) === 'overdue' && now - e.endAt < 12 * 3600000)
      .sort((a, b) => b.endAt - a.endAt)[0] || null
  }
}

async function getCharScheduleContext(chatId, charName) {
  try {
    if (chatId == null) return ''
    const data = await charScheduleLoad()
    const now = Date.now()
    const list = data.events
      .filter(e => String(e.chatId) === String(chatId) && charEventPhase(e, now) !== 'done' &&
        e.endAt > now - 12 * 3600000 && e.startAt < now + 48 * 3600000)
      .sort((a, b) => a.startAt - b.startAt)
    if (!list.length) return ''
    const fmt = ts => formatWechatFullDateTime(ts)
    const span = ms => ms >= 3600000 ? `${(ms / 3600000).toFixed(1).replace(/\.0$/, '')}小时` : `${Math.max(1, Math.round(ms / 60000))}分钟`
    const lines = list.map(e => {
      const ph = charEventPhase(e, now)
      if (ph === 'upcoming') return `- 稍后：${e.title}，${fmt(e.startAt)} 开始，预计 ${fmt(e.endAt)} 结束`
      if (ph === 'active') return `- 进行中：${e.title}，${fmt(e.startAt)} 开始，预计 ${fmt(e.endAt)} 结束（已进行 ${span(now - e.startAt)}，还剩约 ${span(e.endAt - now)}）`
      return `- 已过预计结束时间：${e.title}，预计 ${fmt(e.endAt)} 结束，已超过 ${span(now - e.endAt)}，还没有确认结束${e.notifiedAt ? '（已提醒过一次）' : ''}`
    })
    return `【${charName || '你'}的日程（来自聊天里你自己说过的安排，必须和聊天内容保持一致）】\n现在：${fmt(now)}\n${lines.join('\n')}\n使用方式：\n- “进行中”的事就是你此刻真实的处境。按这件事的性质决定你能不能看手机、能回多少：比如飞行中、手术、开会时不能或很难回复；通勤、休息间隙可以简短回几句。如果选择回复，要符合处境，不要突然表现得很闲。\n- “已过预计结束时间”的事说明你应该已经忙完了：如果还没跟对方说过，这次就自然地说一声（落地平安、下班了、开完会了），并在 JSON 里写 "event_done": true。\n- 事情有变化（延误、提前结束、改期）以你在聊天里说的为准，并重新登记 event。\n- 不要凭空编造和这份日程矛盾的安排，也不要每句话都提日程。`
  } catch (e) { return '' }
}

// 主动回复“抽状态”的额外几项（概率都在这里，想调就改数字）
const IMPULSE_P = {
  dream: 0.5,       // 今天第一条消息：做梦并描述梦境
  wantMedia: 0.8,   // 起性欲想要时：发自拍 / 语音
  wantAsk: 0.3,     // 起性欲想要时：要求对方描述身体与着装状态
  askPhoto: 2 / 3   // 上面那 30% 里：再附加要求对方拍照
}
const IMPULSE_PHOTO_KINDS = ['自拍', '对镜拍（能看到身上穿着）', '拍内裤', '拍大腿', '拍锁骨和肩颈', '拍腰腹']

function buildImpulseExtras(pick, recent, hour) {
  const parts = []
  // 一天从凌晨 5 点算起；最后一条消息在今天之前，说明今天还没聊过
  const d = new Date()
  if (d.getHours() < 5) d.setDate(d.getDate() - 1)
  d.setHours(5, 0, 0, 0)
  const lastTs = Number(recent && recent[0] && recent[0].createdAt) || 0
  if (lastTs < d.getTime() && Math.random() < IMPULSE_P.dream) {
    parts.push('# 【今天的第一条消息：做了个梦】\n你今天还没和她说过话，刚睡醒（或刚午睡醒），脑子里还留着一个梦。把这个梦讲给她：具体说梦里的场景、发生了什么、哪些细节很荒诞或很真实，醒来后是什么感觉。梦要符合你的人设和你们的关系，可以和她有关，也可以只是你自己的梦、醒来后想起她。像真人讲梦一样，断断续续、带点没睡醒的口气，不要写成总结，也不要解释为什么要讲梦。')
  }
  if (pick === 'want') {
    const acts = []
    if (Math.random() < IMPULSE_P.wantMedia) {
      acts.push(Math.random() < 0.5
        ? '顺势给她发一张你的自拍（用照片消息格式，独占一行，再配一句话），让她看见此刻的你。'
        : '顺势给她发一条语音消息（用语音消息格式，独占一行），用说的比打字更贴近、更私密，可以压低声音、带点气息。')
    }
    if (Math.random() < IMPULSE_P.wantAsk) {
      acts.push('也想知道她此刻的状态：请她说说现在的身体和穿着——穿了什么、躺着还是坐着、身体有什么感觉。用你的口吻自然地问出来，别像审问。')
      if (Math.random() < IMPULSE_P.askPhoto) {
        const kind = IMPULSE_PHOTO_KINDS[Math.floor(Math.random() * IMPULSE_PHOTO_KINDS.length)]
        acts.push(`并且想看她：请她发一张${kind}给你看（撒娇、带点占有欲或半命令都可以，取决于你的性格）。`)
      }
    }
    if (acts.length) {
      parts.push('# 【此刻想亲近她：这次的做法】\n（仅适用于：你们是亲密关系、你和对方都是成年人设定、此刻情境允许。若和上下文冲突——对方在忙、心情不好、刚吵过架、不方便——就忽略这一段，不要硬来；她不愿意就尊重，顺着她的话转开。不要在消息里提到“抽到”“概率”“设定”这类词。）\n' + acts.map(a => '- ' + a).join('\n'))
    }
  }
  return parts.length ? '\n\n' + parts.join('\n\n') : ''
}

// 主动回复的“此刻心境”：不是纯随机，而是按上下文信号加权后再抽一个倾向，只作为参考交给模型
async function buildActiveReplyImpulse(chatId, idleMs) {
  try {
    const recent = await db.messages.where('chatId').equals(Number(chatId)).reverse().limit(12).toArray()
    const text = recent.map(m => String(m.content || '')).join('\n')
    const count = words => words.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0)
    const hours = Math.max(0, idleMs / 3600000)
    const hour = new Date().getHours()
    const warm = count(['想你', '抱', '亲', '爱你', '贴贴', '宝宝', '乖'])
    const intimate = count(['床', '摸', '身体', '想要', '做爱', '硬', '湿', '腰', '腿', '吻'])
    const fight = count(['生气', '别理我', '不想说', '吵架', '分手', '烦死'])
    const meal = [7, 8, 11, 12, 13, 17, 18, 19].includes(hour)
    const late = hour >= 23 || hour <= 4
    const weights = {
      miss: 1 + Math.min(hours / 1.5, 4) + warm * 0.5 - (fight ? 0.5 : 0),
      want: 0.4 + intimate * 0.9 + ((late || hour >= 21) ? 0.8 : 0) + (hours >= 3 ? 0.4 : 0) - (fight ? 1 : 0),
      care: 0.8 + (meal ? 0.8 : 0) + (late ? 0.6 : 0) + (fight ? 1 : 0),
      share: 1.2 + ((hour >= 9 && hour <= 18) ? 0.6 : 0)
    }
    const keys = Object.keys(weights)
    keys.forEach(k => { weights[k] = Math.max(0.05, weights[k]) })
    let r = Math.random() * keys.reduce((n, k) => n + weights[k], 0)
    let pick = keys[0]
    for (const k of keys) { r -= weights[k]; if (r <= 0) { pick = k; break } }
    const label = { miss: '想念', want: '想亲近、想要她', care: '惦记她的状态', share: '想分享点什么' }[pick]
    const guide = {
      miss: '你此刻心里最强的是想念。直接把想念和爱意说出来：具体想她的哪一点、想起和她在一起时的哪个细节；不要只是问“在干嘛”。',
      want: '你此刻身体有了反应、想亲近她。按你的人设和你们的关系，坦率说出你想要她、想碰她，具体到你想怎么做、想要什么感觉；不要只发一句很短的话。',
      care: '你此刻惦记她。要具体到她今天的安排、情绪或你们最近聊到的事；不要只是问“吃了吗”“早点睡”这类模板问候。',
      share: '你此刻想和她分享你这边刚发生的一件小事，或突然想到的东西；要具体、有画面，别泛泛而谈。'
    }[pick]
    const extra = buildImpulseExtras(pick, recent, hour)
    const hoursText = hours >= 1 ? `${hours.toFixed(1).replace(/\.0$/, '')} 小时` : `${Math.max(1, Math.round(hours * 60))} 分钟`
    return `# 【此刻的心境倾向】\n离上次聊天已经过去 ${hoursText}，现在是 ${hour} 点。结合你们最近的对话，你此刻心里更偏向：${label}。\n${guide}\n这只是倾向，不是命令：如果和当前上下文冲突（你正在忙、刚吵过架、对方心情不好、对话刚停在某个话题上），以上下文为准，自行调整。不要在消息里提到“倾向”“判断”这类词。${extra}`
  } catch (e) { return '' }
}

// 通用：点按钮读一段文字（通话记录用）。同一段文字同一音色在本次打开期间只生成一次
const _speakOnceCache = new Map()
let _speakOnceAudio = null
let _speakOnceBtn = null
function stopSpeakOnce() {
  if (_speakOnceAudio) { try { _speakOnceAudio.pause() } catch (_) {} _speakOnceAudio = null }
  if (_speakOnceBtn) { _speakOnceBtn.classList.remove('is-playing', 'is-loading'); _speakOnceBtn = null }
}
async function speakTextOnce(chatId, text, btn) {
  if (_speakOnceBtn === btn) { stopSpeakOnce(); return }
  stopSpeakOnce()
  const audio = new Audio()
  audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
  audio.play().catch(() => {})
  _speakOnceAudio = audio
  _speakOnceBtn = btn
  btn.classList.add('is-loading')
  try {
    const voiceId = await getChatVoiceId(chatId)
    if (!voiceId) { window.toast?.('这个角色还没设置音色 ID（聊天设置里填）'); stopSpeakOnce(); return }
    const key = voiceId + '|' + text
    let url = _speakOnceCache.get(key)
    if (!url) {
      url = await callTTS(text, voiceId)
      _speakOnceCache.set(key, url)
      if (_speakOnceCache.size > 20) {
        const oldest = _speakOnceCache.keys().next().value
        URL.revokeObjectURL(_speakOnceCache.get(oldest))
        _speakOnceCache.delete(oldest)
      }
    }
    if (_speakOnceBtn !== btn) return
    btn.classList.remove('is-loading')
    btn.classList.add('is-playing')
    audio.src = url
    audio.addEventListener('ended', () => { if (_speakOnceBtn === btn) stopSpeakOnce() })
    await audio.play()
  } catch (e) {
    stopSpeakOnce()
    window.toast?.('朗读失败：' + (e.message || e))
  }
}

async function isTTSTagEnabled() {
  return (await getTTSProvider()) === 'fish'
}
async function getTTSTagHint(kind, charName) {
  if (!(await isTTSTagEnabled())) return ''
  const rules = `- 标签用中文短语，2-10 个字，可参考：${TTS_TAG_EXAMPLES}。
- 想要听得出区别，就写得具体一点，按当时的情绪选：${TTS_TAG_EMOTION_HINTS}。
- 标签放在要影响的那句话前面；每句最多 1 个，整段话总共不超过 3 个，不要连续堆叠，没有明显语气变化就不写。
- 只用【】，不要用其他括号；标签里只写语气或情绪，不要写动作描写或长句。
- 标签只写在原文语言的部分，译文里不要写标签。`
  if (kind === 'chat') {
    return `# 【语音消息的语气标签】
发语音消息时，可以在语音文字里用【】标出语气或情绪，之后朗读会更有感情。例如：\`[${charName || '角色'}的语音：【轻声】我到家啦，【轻笑】今天好累]\`
${rules}

---`
  }
  if (kind === 'call') {
    return `【语气标签】
"speech" 里可以用【】标出语气或情绪，之后朗读会更有感情。例如：{"scene":"...","speech":"【轻笑】喂？怎么啦，【轻声】突然打电话过来"}
${rules}
- 标签写在 speech 字符串里即可，JSON 格式保持合法。`
  }
  return ''
}

// 搜索/拉取 Fish 音色。self=true 只拿自己账号下的音色
async function fishListVoices(opts) {
  const o = opts || {}
  const cfg = await getFishConfig()
  if (!cfg.apiKey) throw new Error('请先在设置里填写 Fish Audio API Key')
  const params = new URLSearchParams()
  params.set('page_size', String(o.pageSize || 10))
  params.set('page_number', String(o.pageNumber || 1))
  if (o.self) {
    params.set('self', 'true')
  } else {
    params.set('sort_by', 'score')
    if (o.title) params.set('title', o.title)
    if (o.language) params.set('language', o.language)
  }
  const res = await fishRequest(cfg, '/model?' + params.toString(), {
    headers: { 'Authorization': 'Bearer ' + cfg.apiKey }
  })
  return res.json()
}

// ===== 语音音频缓存 =====
var _voiceAudioPlayer = null

async function getVoiceAudioCache(msgId) {
  const msg = await db.messages.get(msgId)
  return msg?.voiceAudioData || null
}

async function saveVoiceAudioCache(msgId, audioDataUrl) {
  await updatePrivateMessageIdempotently(msgId, { voiceAudioData: audioDataUrl })
}

async function blobUrlToDataUrl(blobUrl) {
  const res = await fetch(blobUrl)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('读取音频数据失败'))
    reader.readAsDataURL(blob)
  })
}

// ===== 重写 toggleVoice：点击语音条时触发 TTS =====
// iPhone 只允许“被手指点触解锁过的 Audio 元素”在异步等待之后继续播放。
// 以前每次 new Audio() 再 play()，生成语音要等几秒，手势早失效，所以第一次生成完不会自己播，
// 得关掉再点一次（这时用缓存，不用等）。现在全程复用同一个 Audio 元素：点的瞬间先解锁，
// 生成完只换 src 再播放。
var _voiceSharedAudio = null
var _voicePlayingEl = null
var _voiceClickSeq = 0
const VOICE_SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='

function getVoiceSharedAudio() {
  if (!_voiceSharedAudio) {
    _voiceSharedAudio = new Audio()
    _voiceSharedAudio.preload = 'auto'
  }
  return _voiceSharedAudio
}

// 必须在点击事件里同步调用（前面不能有 await）
function unlockVoiceAudio() {
  try {
    const a = getVoiceSharedAudio()
    if (a._voiceUnlocked) return
    a.src = VOICE_SILENT_WAV
    const p = a.play()
    if (p && p.then) {
      p.then(() => {
        a._voiceUnlocked = true
        if (String(a.src).startsWith('data:audio/wav')) a.pause()
      }).catch(() => {})
    }
  } catch (_) {}
}

function stopVoiceAudio() {
  const a = _voiceSharedAudio
  if (a) {
    a.onended = null
    try { a.pause() } catch (_) {}
  }
  _voiceAudioPlayer = null
  if (_voicePlayingEl) {
    _voicePlayingEl.classList.remove('is-playing')
    _voicePlayingEl = null
  }
}

window.toggleVoice = async function(bubbleEl) {
  const voice = bubbleEl.closest('.voice-message')
  if (!voice) return
  const textEl = voice.querySelector('.voice-transcript-bubble')
  const translationEl = voice.querySelector('.wechat-translation-card')
  const isOpen = voice.classList.toggle('is-open')
  if (textEl) textEl.style.display = isOpen ? 'block' : 'none'
  if (translationEl) translationEl.style.display = isOpen ? 'block' : 'none'

  if (!isOpen) {
    stopVoiceAudio()
    return
  }
  unlockVoiceAudio()
  const seq = ++_voiceClickSeq

  const msgId = parseInt(voice.dataset.msgId)
  if (!msgId) return

  const msg = await db.messages.get(msgId)
  if (!msg || msg.role !== 'assistant') return

  const chatId = msg.chatId
  const voiceId = await getChatVoiceId(chatId)
  if (!voiceId) return

  const cached = msg.voiceAudioData
  if (cached) {
    playVoiceAudio(cached, voice)
    return
  }

  const parsed = parseMsgType(msg.content)
  if (parsed.type !== 'voice') return
  const bilingualSettings = await getChatBilingualSettings(chatId)
  const voiceText = getBilingualDisplayText(parsed.data.text, bilingualSettings).original
  if (!voiceText) return

  bubbleEl.classList.add('voice-loading')
  try {
    const blobUrl = await callTTS(voiceText, voiceId)
    const dataUrl = await blobUrlToDataUrl(blobUrl)
    URL.revokeObjectURL(blobUrl)
    await saveVoiceAudioCache(msgId, dataUrl)
    // 生成期间如果又关掉了，或者点了别的语音条，就不再自动播放
    if (voice.classList.contains('is-open') && seq === _voiceClickSeq) {
      playVoiceAudio(dataUrl, voice)
    }
  } catch (e) {
    showApiErrorModal('语音生成失败\n' + (e.message || String(e)))
  } finally {
    bubbleEl.classList.remove('voice-loading')
  }
}

function playVoiceAudio(src, voiceEl) {
  stopVoiceAudio()
  const a = getVoiceSharedAudio()
  _voiceAudioPlayer = a
  a.onended = () => {
    if (_voiceAudioPlayer === a) _voiceAudioPlayer = null
    if (voiceEl) voiceEl.classList.remove('is-playing')
    if (_voicePlayingEl === voiceEl) _voicePlayingEl = null
  }
  a.src = src
  _voicePlayingEl = voiceEl || null
  if (voiceEl) voiceEl.classList.add('is-playing')
  const p = a.play()
  if (p && p.catch) {
    p.catch(e => {
      console.warn('语音播放失败', e && (e.name || e.message))
      if (voiceEl) voiceEl.classList.remove('is-playing')
      if (_voicePlayingEl === voiceEl) _voicePlayingEl = null
      window.toast?.('语音播放失败，请再点一次')
    })
  }
}

// ===== AI 回复后自动生成语音 =====
async function autoGenerateVoiceIfNeeded(chatId, msgId, content) {
  const parsed = parseMsgType(content)
  if (parsed.type !== 'voice') return

  const voiceId = await getChatVoiceId(chatId)
  if (!voiceId) return

  const bilingualSettings = await getChatBilingualSettings(chatId)
  const voiceText = getBilingualDisplayText(parsed.data.text, bilingualSettings).original
  if (!voiceText) return

  try {
    const blobUrl = await callTTS(voiceText, voiceId)
    const dataUrl = await blobUrlToDataUrl(blobUrl)
    URL.revokeObjectURL(blobUrl)
    await saveVoiceAudioCache(msgId, dataUrl)
  } catch (e) {
    console.warn('语音自动生成失败', e && e.message)
  }
}

// HTML转义
function wcEscHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ===== 微信支付页面 =====

function getWalletDataKey(uid = _wechatUid) {
  return 'wechat_wallet_' + uid
}

async function getWalletData(uid = _wechatUid) {
  const row = await db.config.get(getWalletDataKey(uid))
  return row?.value || null
}

async function saveWalletData(data, uid = _wechatUid) {
  await db.config.put({ key: getWalletDataKey(uid), value: data })
}

async function openWechatWalletPage() {
  if (!_wechatUid) {
    window.toast && window.toast('请先登录')
    return
  }
  const old = document.getElementById('wechat-wallet-page')
  if (old) old.remove()

  const user = _wechatUser
  const walletData = await getWalletData()
  const hasBankCard = !!user?.identity?.bankCard

  const page = document.createElement('div')
  page.id = 'wechat-wallet-page'
  page.className = 'full-page wechat-wallet-page'
  page.innerHTML = buildWalletPageHTML(walletData, hasBankCard, user)
  window.openPage(page)
  bindWalletPageEvents(page)
  loadWalletBills(page)
}

function buildWalletPageHTML(walletData, hasBankCard, user) {
  const hasBalance = walletData && walletData.wechatBalance !== undefined
  const bankCard = user?.identity?.bankCard || ''
  const lastFour = bankCard ? bankCard.slice(-4) : ''

  let balanceHTML
  if (hasBalance) {
    balanceHTML = `<div class="wallet-balance-amount"><span class="wallet-currency">¥</span>${formatWalletAmount(walletData.wechatBalance)}</div>`
  } else {
    balanceHTML = `<div class="wallet-balance-placeholder">尚未生成余额</div>`
  }

  let savingCardNum = '', checkingCardNum = ''
  if (hasBalance && walletData.savingCardNumber) {
    savingCardNum = walletData.savingCardNumber
    checkingCardNum = walletData.checkingCardNumber || ''
  } else if (hasBankCard) {
    savingCardNum = bankCard
    checkingCardNum = bankCard
  }

  const showCardNumbers = hasBalance || hasBankCard

  const savingLast4 = savingCardNum ? savingCardNum.slice(-4) : '****'
  const checkingLast4 = checkingCardNum ? checkingCardNum.slice(-4) : '****'

  const savingBalanceText = hasBalance
    ? `<span class="wallet-card-balance">¥${formatWalletAmount(walletData.savingBalance)}</span>`
    : ''
  const checkingBalanceText = hasBalance
    ? `<span class="wallet-card-balance">¥${formatWalletAmount(walletData.checkingBalance)}</span>`
    : ''

  return `
    <div class="page-header">
      <button class="header-back" id="btn-wallet-back"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">微信支付</span>
      <span style="width:40px;flex-shrink:0"></span>
    </div>
    <div class="wallet-scroll">
      <div class="wallet-balance-card">
        <div class="wallet-balance-label"><i class="fa-solid fa-piggy-bank"></i> 零钱</div>
        ${balanceHTML}
        ${hasBalance ? `
          <div class="wallet-balance-actions">
            <button class="wallet-balance-btn wallet-btn-primary" id="btn-wallet-cash-in" type="button">转入</button>
            <button class="wallet-balance-btn wallet-btn-secondary" id="btn-wallet-cash-out" type="button">转出</button>
          </div>
        ` : ''}
      </div>

      <div class="wallet-section-title">银行卡</div>
      <div class="wallet-cards-list">
        <button class="wallet-card-row" id="btn-saving-card" type="button">
          <div class="wallet-card-icon saving"><i class="fa-solid fa-coins"></i></div>
          <div class="wallet-card-info">
            <div class="wallet-card-name">弯弯银行 <span class="wallet-card-type-tag saving">Saving</span></div>
            <div class="wallet-card-number">${showCardNumbers ? '**** **** ' + savingLast4 : ''}</div>
          </div>
          <i class="fa fa-angle-right wallet-card-arrow"></i>
        </button>
        <button class="wallet-card-row" id="btn-checking-card" type="button">
          <div class="wallet-card-icon checking"><i class="fa-solid fa-money-bill"></i></div>
          <div class="wallet-card-info">
            <div class="wallet-card-name">弯弯银行 <span class="wallet-card-type-tag checking">Checking</span></div>
            <div class="wallet-card-number">${showCardNumbers ? '**** **** ' + checkingLast4 : ''}</div>
          </div>
          <i class="fa fa-angle-right wallet-card-arrow"></i>
        </button>
      </div>

      <div class="wallet-generate-section">
        <button class="wallet-generate-btn" id="btn-generate-balance" type="button">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          ${hasBalance ? '重新生成余额' : '生成余额'}
        </button>
      </div>

      <div class="wallet-section-title">零钱账单</div>
      <div class="wallet-bills-list" id="wallet-bills-list">
        <div class="wallet-bills-loading">加载中...</div>
      </div>
    </div>
  `
}

function formatWalletAmount(num) {
  return Number(num).toFixed(2).replace(/\B(?=(\d{3})+\.)/g, ',')
}

function bindWalletPageEvents(page) {
  page.querySelector('#btn-wallet-back').addEventListener('click', () => window.closePage('wechat-wallet-page'))
  page.querySelector('#btn-saving-card').addEventListener('click', () => openBankDetailPage('saving'))
  page.querySelector('#btn-checking-card').addEventListener('click', () => openBankDetailPage('checking'))
  page.querySelector('#btn-generate-balance').addEventListener('click', () => generateWalletBalance(page))
  const cashInBtn = page.querySelector('#btn-wallet-cash-in')
  const cashOutBtn = page.querySelector('#btn-wallet-cash-out')
  if (cashInBtn) cashInBtn.addEventListener('click', () => showWalletBalanceTransferSheet('in'))
  if (cashOutBtn) cashOutBtn.addEventListener('click', () => showWalletBalanceTransferSheet('out'))
}

async function showWalletBalanceTransferSheet(direction) {
  const walletData = await getWalletData()
  if (!walletData || walletData.wechatBalance === undefined) {
    window.toast && window.toast('请先在微信支付中生成账户余额')
    return
  }

  const isIn = direction === 'in'
  const fromLabel = isIn ? 'CHECKING' : '零钱'
  const toLabel = isIn ? '零钱' : 'CHECKING'
  const fromBalance = isIn ? (walletData.checkingBalance || 0) : (walletData.wechatBalance || 0)

  const sheet = wcMakeSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-title">${isIn ? '转入零钱' : '转出零钱'}</div>
    <div class="bank-transfer-info">
      <div class="bank-transfer-direction">
        <span class="bank-transfer-from">${fromLabel}</span>
        <i class="fa-solid fa-arrow-right" style="color:#c0c0c0;margin:0 12px"></i>
        <span class="bank-transfer-to">${toLabel}</span>
      </div>
      <div class="bank-transfer-avail">可转金额：¥${formatWalletAmount(fromBalance)}</div>
    </div>
    <div class="bank-transfer-input-wrap">
      <span class="bank-transfer-yen">¥</span>
      <input type="number" class="bank-transfer-input" id="wallet-balance-transfer-amount" placeholder="请输入金额" step="0.01" min="0.01" max="${fromBalance}">
    </div>
    <div class="sheet-actions">
      <button class="btn-pill btn-full" id="wallet-balance-transfer-confirm">确认${isIn ? '转入' : '转出'}</button>
    </div>
  `)

  wcShowSheet(sheet, async () => {
    const input = sheet.querySelector('#wallet-balance-transfer-amount')
    const amount = parseFloat(input.value)
    if (!amount || amount <= 0) { window.toast && window.toast('请输入有效金额'); return false }
    if (amount > fromBalance) { window.toast && window.toast('余额不足'); return false }

    const wd = await getWalletData()
    if (!wd || wd.wechatBalance === undefined) {
      window.toast && window.toast('请先在微信支付中生成账户余额')
      return false
    }
    const freshFromBalance = isIn ? (wd.checkingBalance || 0) : (wd.wechatBalance || 0)
    if (amount > freshFromBalance) { window.toast && window.toast('余额不足'); return false }

    if (isIn) {
      wd.checkingBalance = Math.round(((wd.checkingBalance || 0) - amount) * 100) / 100
      wd.wechatBalance = Math.round(((wd.wechatBalance || 0) + amount) * 100) / 100
    } else {
      wd.wechatBalance = Math.round(((wd.wechatBalance || 0) - amount) * 100) / 100
      wd.checkingBalance = Math.round(((wd.checkingBalance || 0) + amount) * 100) / 100
    }
    await saveWalletData(wd)

    const desc = isIn ? 'CHECKING → 零钱 转入' : '零钱 → CHECKING 转出'
    await db.finance.add({ charId: _wechatUid, amount, desc, type: isIn ? 'income' : 'expense', source: 'wechat', createdAt: Date.now() })
    await db.finance.add({ charId: _wechatUid, amount, desc, type: isIn ? 'expense' : 'income', source: 'checking', createdAt: Date.now() })

    window.toast && window.toast('¥' + formatWalletAmount(amount) + (isIn ? ' 转入成功' : ' 转出成功'))
    window.closePage('wechat-wallet-page')
    await openWechatWalletPage()
  })
}

function showWalletNoDescConfirm() {
  return new Promise(resolve => {
    const overlay = document.createElement('div')
    overlay.className = 'sheet-overlay'
    overlay.style.zIndex = '300'
    const modal = document.createElement('div')
    modal.className = 'center-modal'
    modal.style.zIndex = '301'
    modal.innerHTML = `
      <div class="sheet-title" style="text-align:center">人设信息不完整</div>
      <div style="padding:0 20px 16px;font-size:13px;color:var(--c-sub);line-height:1.7;text-align:center">
        当前角色未填写人设描述，生成的余额可能与角色身份不符，建议先完善角色档案中的人设信息。
      </div>
      <div class="sheet-actions" style="display:flex;gap:10px;padding:0 20px 16px">
        <button class="btn-ghost btn-full" id="wallet-desc-cancel">取消</button>
        <button class="btn-pill btn-full" id="wallet-desc-continue">继续生成</button>
      </div>
    `
    const app = document.getElementById('app')
    app.appendChild(overlay)
    app.appendChild(modal)
    requestAnimationFrame(() => { overlay.classList.add('show'); modal.classList.add('show') })
    const close = (result) => {
      overlay.classList.remove('show')
      modal.classList.remove('show')
      setTimeout(() => { overlay.remove(); modal.remove() }, 300)
      resolve(result)
    }
    overlay.addEventListener('click', () => close(false))
    modal.querySelector('#wallet-desc-cancel').addEventListener('click', () => close(false))
    modal.querySelector('#wallet-desc-continue').addEventListener('click', () => close(true))
  })
}

function showWalletRegenConfirm() {
  return new Promise(resolve => {
    const overlay = document.createElement('div')
    overlay.className = 'sheet-overlay'
    overlay.style.zIndex = '300'
    const modal = document.createElement('div')
    modal.className = 'center-modal'
    modal.style.zIndex = '301'
    modal.innerHTML = `
      <div class="sheet-title" style="text-align:center">重新生成余额</div>
      <div style="padding:0 20px 16px;font-size:13px;color:var(--c-sub);line-height:1.7;text-align:center">
        重新生成将<strong>清空当前所有余额</strong>并重新计算，此操作不可撤销，是否继续？
      </div>
      <div class="sheet-actions" style="display:flex;gap:10px;padding:0 20px 16px">
        <button class="btn-ghost btn-full" id="wallet-regen-cancel">取消</button>
        <button class="btn-pill btn-full" id="wallet-regen-confirm" style="background:#e74c3c">确认重置</button>
      </div>
    `
    const app = document.getElementById('app')
    app.appendChild(overlay)
    app.appendChild(modal)
    requestAnimationFrame(() => { overlay.classList.add('show'); modal.classList.add('show') })
    const close = (result) => {
      overlay.classList.remove('show')
      modal.classList.remove('show')
      setTimeout(() => { overlay.remove(); modal.remove() }, 300)
      resolve(result)
    }
    overlay.addEventListener('click', () => close(false))
    modal.querySelector('#wallet-regen-cancel').addEventListener('click', () => close(false))
    modal.querySelector('#wallet-regen-confirm').addEventListener('click', () => close(true))
  })
}

async function loadWalletBills(page) {
  const listEl = page.querySelector('#wallet-bills-list')
  if (!listEl || !_wechatUid) return
  const allBills = await db.finance.where('charId').equals(_wechatUid).toArray()
  const bills = allBills.filter(b => b.source === 'wechat')
  bills.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  if (!bills.length) {
    listEl.innerHTML = '<div class="wallet-bills-empty">暂无账单</div>'
    return
  }
  listEl.innerHTML = bills.map(bill => {
    const isIncome = bill.type === 'income'
    const sign = isIncome ? '+' : '-'
    const amountClass = isIncome ? 'income' : 'expense'
    const icon = isIncome ? 'fa-arrow-down' : 'fa-arrow-up'
    const dateStr = bill.createdAt ? formatWalletBillDate(bill.createdAt) : ''
    return `
      <div class="wallet-bill-item" data-bill-id="${bill.id}">
        <div class="wallet-bill-inner">
          <div class="wallet-bill-icon ${amountClass}"><i class="fa ${icon}"></i></div>
          <div class="wallet-bill-main">
            <div class="wallet-bill-desc">${wcEscHtml(bill.desc || '转账')}</div>
            <div class="wallet-bill-date">${dateStr}</div>
          </div>
          <div class="wallet-bill-amount ${amountClass}">${sign}¥${formatWalletAmount(bill.amount)}</div>
        </div>
        <button class="wallet-bill-delete" data-bill-id="${bill.id}">删除</button>
      </div>
    `
  }).join('')

  // 左滑删除交互
  let currentSwiped = null
  const closeSwipe = (item) => {
    if (!item) return
    item.classList.remove('swiped')
    currentSwiped = null
  }
  listEl.querySelectorAll('.wallet-bill-item').forEach(item => {
    let startX = 0, startY = 0, dragging = false
    item.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      dragging = false
    }, { passive: true })
    item.addEventListener('touchmove', e => {
      const dx = e.touches[0].clientX - startX
      const dy = e.touches[0].clientY - startY
      if (!dragging && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) dragging = true
      if (!dragging) return
      if (dx < -10 && item !== currentSwiped) {
        closeSwipe(currentSwiped)
        item.classList.add('swiped')
        currentSwiped = item
      } else if (dx > 10 && item === currentSwiped) {
        closeSwipe(item)
      }
    }, { passive: true })
    item.addEventListener('touchend', () => { dragging = false })
  })
  listEl.addEventListener('click', e => {
    if (currentSwiped && !e.target.closest('.wallet-bill-delete')) {
      closeSwipe(currentSwiped)
    }
  })
  listEl.querySelectorAll('.wallet-bill-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      const billId = parseInt(btn.dataset.billId)
      await db.finance.delete(billId)
      await loadWalletBills(page)
    })
  })
}

function formatWalletBillDate(ts) {
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function generateWalletBalance(page) {
  const btn = page.querySelector('#btn-generate-balance')
  if (!btn || btn.classList.contains('is-loading')) return

  const user = _wechatUser
  if (!user) { window.toast('请先登录'); return }

  const desc = user.description || ''
  const name = user.nick || user.name || ''
  const role = user.role || ''
  const gender = user.gender || ''

  if (!desc.trim()) {
    const confirmed = await showWalletNoDescConfirm()
    if (!confirmed) return
  }

  const existingWalletData = await getWalletData()
  if (existingWalletData && existingWalletData.wechatBalance !== undefined) {
    const confirmed = await showWalletRegenConfirm()
    if (!confirmed) return
  }

  btn.classList.add('is-loading')
  btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> AI 分析中...'

  try {
    const prompt = `分析以下角色人设信息（背景、职业、经济状况、社会地位等），推断该角色各账户余额。

角色名：${name}
${gender ? '性别：' + gender : ''}
${role ? '角色定位：' + role : ''}
人设描述：${desc || '（未填写）'}

总资产参考标准：
- 极度贫困/流浪：50.00 ~ 200.00
- 贫困/拮据：200.00 ~ 800.00
- 普通学生：500.00 ~ 2000.00
- 普通打工人/工薪阶层：1000.00 ~ 5000.00
- 小康/普通白领：3000.00 ~ 20000.00
- 中产/高收入人群：10000.00 ~ 50000.00
- 富裕/富二代：50000.00 ~ 500000.00
- 顶级富豪/企业家：1000000.00 以上

分配规则：
1. 严格依据角色人设生成，禁止使用默认值或随机值
2. 角色有多重属性时（如"落魄富二代"），以当前实际经济状态为准
3. 性格节俭者总资产取区间上限，挥霍/大方者取区间下限
4. 古代/架空背景换算参考：1两银子 ≈ 500元人民币
5. 三账户分配逻辑：
   - 微信零钱：日常小额支付，金额最小，贫困角色可能仅剩少量零钱
   - Checking Account：日常消费流水账户，金额适中
   - Saving Account：长期储蓄，贫困/拮据角色可为 0.00
   - 总和须落在对应区间内

6. 只输出以下格式，数字保留两位小数，不包含任何其他文字或说明：
wechat:数字
checking:数字
saving:数字`

    const raw = await window.callAI([{ role: 'user', content: prompt }], {
      temperature: await window.getAITemperaturePreset('wechatWallet')
    })
    const text = (raw || '').trim()

    const wechatMatch = text.match(/wechat[:\s]*([0-9]+(?:\.[0-9]+)?)/)
    const checkingMatch = text.match(/checking[:\s]*([0-9]+(?:\.[0-9]+)?)/)
    const savingMatch = text.match(/saving[:\s]*([0-9]+(?:\.[0-9]+)?)/)

    if (!wechatMatch || !checkingMatch || !savingMatch) {
      window.toast('AI 返回格式异常，请重试')
      btn.classList.remove('is-loading')
      btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> 生成余额'
      return
    }

    const wechatBalance = parseFloat(wechatMatch[1])
    const checkingBalance = parseFloat(checkingMatch[1])
    const savingBalance = parseFloat(savingMatch[1])

    let bankCard = user.identity?.bankCard || ''
    let needsCardUpdate = false
    if (!bankCard) {
      bankCard = genBankCard()
      needsCardUpdate = true
    }

    const savingCardNumber = bankCard
    const checkingCardNumber = genBankCard()

    const walletData = {
      wechatBalance,
      checkingBalance,
      savingBalance,
      savingCardNumber,
      checkingCardNumber,
      generatedAt: Date.now()
    }
    await saveWalletData(walletData)

    if (needsCardUpdate) {
      const updatedIdentity = { ...(user.identity || {}), bankCard }
      await db.characters.update(_wechatUid, { identity: updatedIdentity })
      _wechatUser = await db.characters.get(_wechatUid)
    }

    const updatedUser = _wechatUser
    const updatedWallet = await getWalletData()
    const hasBankCard = !!updatedUser?.identity?.bankCard

    const scroll = page.querySelector('.wallet-scroll')
    if (scroll) {
      const tmpDiv = document.createElement('div')
      tmpDiv.innerHTML = buildWalletPageHTML(updatedWallet, hasBankCard, updatedUser)
      const newScroll = tmpDiv.querySelector('.wallet-scroll')
      if (newScroll) scroll.innerHTML = newScroll.innerHTML
      bindWalletScrollEvents(page)
    }

    window.toast('余额已生成')
  } catch (e) {
    window.toast('生成失败：' + (e.message || '请检查API设置'))
    btn.classList.remove('is-loading')
    btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> 生成余额'
  }
}

function bindWalletScrollEvents(page) {
  const savingBtn = page.querySelector('#btn-saving-card')
  const checkingBtn = page.querySelector('#btn-checking-card')
  const genBtn = page.querySelector('#btn-generate-balance')
  if (savingBtn) savingBtn.addEventListener('click', () => openBankDetailPage('saving'))
  if (checkingBtn) checkingBtn.addEventListener('click', () => openBankDetailPage('checking'))
  if (genBtn) genBtn.addEventListener('click', () => generateWalletBalance(page))
  const cashInBtn = page.querySelector('#btn-wallet-cash-in')
  const cashOutBtn = page.querySelector('#btn-wallet-cash-out')
  if (cashInBtn) cashInBtn.addEventListener('click', () => showWalletBalanceTransferSheet('in'))
  if (cashOutBtn) cashOutBtn.addEventListener('click', () => showWalletBalanceTransferSheet('out'))
  loadWalletBills(page)
}

async function openBankDetailPage(type) {
  if (!_wechatUid) return
  const user = _wechatUser
  const walletData = await getWalletData()
  const hasBalance = walletData && walletData.wechatBalance !== undefined
  const hasBankCard = !!user?.identity?.bankCard

  let cardNumber = ''
  let balance = null

  if (type === 'saving') {
    if (hasBalance) {
      cardNumber = walletData.savingCardNumber || ''
      balance = walletData.savingBalance
    } else if (hasBankCard) {
      cardNumber = user.identity.bankCard
    }
  } else {
    if (hasBalance) {
      cardNumber = walletData.checkingCardNumber || ''
      balance = walletData.checkingBalance
    } else if (hasBankCard) {
      cardNumber = user.identity.bankCard
    }
  }

  const pageId = 'wechat-bank-detail-page'
  const oldPage = document.getElementById(pageId)
  if (oldPage) oldPage.remove()

  const page = document.createElement('div')
  page.id = pageId
  page.className = 'full-page wechat-bank-detail-page'

  const typeName = type === 'saving' ? 'Saving Account' : 'Checking Account'
  const typeLabel = type === 'saving' ? 'SAVING' : 'CHECKING'

  const formattedCardNum = cardNumber
    ? '•••• •••• •••• ' + cardNumber.slice(-4)
    : '•••• •••• •••• ****'

  const fullCardDisplay = cardNumber
    ? cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')
    : '尚未生成'

  let balanceHTML
  if (balance !== null && balance !== undefined) {
    balanceHTML = `<div class="bank-detail-balance-value"><span class="bank-currency">¥</span>${formatWalletAmount(balance)}</div>`
  } else {
    balanceHTML = `<div class="bank-detail-balance-placeholder">尚未生成余额</div>`
  }

  const holderName = String(user?.name || '未命名').toUpperCase()
  const cardIcon = type === 'saving' ? 'fa-solid fa-coins' : 'fa-solid fa-money-bill'

  page.innerHTML = `
    <div class="page-header">
      <button class="header-back" id="btn-bank-detail-back"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">${typeName}</span>
      <span style="width:40px;flex-shrink:0"></span>
    </div>
    <div class="bank-detail-scroll">
      <div class="bank-card-visual ${type}">
        <div class="bank-card-top">
          <div class="bank-card-bank-name"><i class="${cardIcon}"></i> WanWan Bank</div>
          <div class="bank-card-type-badge">${typeLabel}</div>
        </div>
        <div class="bank-card-chip"></div>
        <div class="bank-card-number">${formattedCardNum}</div>
        <div class="bank-card-bottom">
          <div class="bank-card-holder">${wcEscHtml(holderName)}</div>
          <div class="bank-card-brand">UNIONPAY</div>
        </div>
      </div>

      <div class="bank-detail-balance-card">
        <div class="bank-detail-balance-label">账户余额</div>
        ${balanceHTML}
      </div>

      <div class="bank-detail-info">
        <div class="bank-info-row">
          <span class="bank-info-label">银行名称</span>
          <span class="bank-info-value">弯弯银行</span>
        </div>
        <div class="bank-info-row">
          <span class="bank-info-label">账户类型</span>
          <span class="bank-info-value">${typeName}</span>
        </div>
        <div class="bank-info-row">
          <span class="bank-info-label">卡号</span>
          <span class="bank-info-value">${fullCardDisplay}</span>
        </div>
      </div>
    </div>
  `

  window.openPage(page)
  page.querySelector('#btn-bank-detail-back').addEventListener('click', () => window.closePage(pageId))
}

// ===== 导出给 phone.js 的内部函数 =====
Object.defineProperty(window, '_wechatUser', { get() { return _wechatUser } })
document.addEventListener('callStateChange', (e) => {
  const { state, charId } = e.detail
  const chatPage = document.querySelector(`.chat-page[data-char-id="${charId}"]`)
  if (!chatPage) return
  const input = chatPage.querySelector('#chat-input')
  if (!input) return
  if (state !== 'idle') {
    input.disabled = true
    input.dataset.origPlaceholder = input.placeholder
    input.placeholder = '通话中，无法发送消息'
  } else {
    input.disabled = false
    input.placeholder = input.dataset.origPlaceholder || '输入消息...'
    delete input.dataset.origPlaceholder
  }
})

// ===== 语音通话 & 视频通话模块 =====
// ===== 模块状态 =====
let _callHistory = []
let _callSystemPrompt = ''
let _callState = 'idle'
let _callType = null
let _callAutoSpeak = true // 通话里角色说话是否自动朗读（默认开，记在 db.config.callAutoSpeak）
let _callStartTime = null
let _callTimerInterval = null
let _callChatId = null
let _callCharId = null
let _callAudioPlayer = null
let _callAudioBlobUrl = null
let _callPendingAudioBlobUrl = null
let _callAudioPlayRetryTimer = null
let _callTTSRetryTimer = null
let _callTTSRequestSeq = 0
let _callTTSCanceledRetrySeqs = new Set()
let _callAISending = false
let _callSessionId = 0 // 每次通话结束 +1，用来作废挂断前遗留的旧请求
const CALL_AI_TIMEOUT_MS = 45 * 1000
let _callInitiator = 'user'
let _realCameraStream = null
let _realCameraActive = false
let _realCameraFacingMode = 'user'
let _callRecognition = null
let _callRecognitionTimeout = null

// ===== 通话自动保存 / 闲置自动挂断 =====
// 通话内容原来只在点「挂断」时才写进数据库；现在每条消息都会存一份草稿（db.config 的 callDraft），
// 清后台/闪退后下次打开会自动补成通话记录。
const CALL_DRAFT_KEY = 'callDraft'
const CALL_IDLE_LIMIT_MS = 2 * 60 * 60 * 1000 // 超过这个时间没人说话，自动挂断（改这里的数字即可）
let _callLastActivity = 0
let _callIdleTimer = null
let _callResumeRecordId = null // 正在续接的通话记录 id（有值说明这是一次"回到通话"）
let _callResumeNote = ''       // 续接后第一次请求 AI 时附带的一句提示，回复成功后清空

async function saveCallDraft() {
  if (_callState === 'idle' || !_callChatId || !_callStartTime) return
  try {
    await db.config.put({
      key: CALL_DRAFT_KEY,
      value: {
        chatId: _callChatId,
        charId: _callCharId,
        ownerUid: window._wechatUid,
        type: _callType || 'voice',
        resumeRecordId: _callResumeRecordId || undefined,
        initiator: _callInitiator,
        startTime: _callStartTime,
        lastActivity: _callLastActivity || Date.now(),
        messages: _callHistory.map(m => ({
          role: m.role,
          content: m.content,
          scene: m.scene || undefined,
          speech: m.speech || undefined,
          timestamp: m.timestamp || Date.now()
        }))
      }
    })
  } catch (e) { console.warn('保存通话草稿失败', e) }
}

async function clearCallDraft() {
  try { await db.config.delete(CALL_DRAFT_KEY) } catch (_) {}
}

function stopCallIdleWatch() {
  if (_callIdleTimer) { clearInterval(_callIdleTimer); _callIdleTimer = null }
}

function checkCallIdle() {
  if (_callState !== 'connected' || !_callLastActivity) return
  if (_callAISending) return
  if (Date.now() - _callLastActivity < CALL_IDLE_LIMIT_MS) return
  stopCallIdleWatch()
  window.toast?.('太久没有说话，通话已自动挂断')
  // 通话时长只算到最后一次说话的时间
  endCall({ endAt: _callLastActivity })
}

function startCallIdleWatch() {
  if (_callIdleTimer) return
  _callIdleTimer = setInterval(checkCallIdle, 60 * 1000)
}

// 上次通话没正常挂断（清后台、闪退）→ 把草稿补成通话记录
async function recoverCallDraft() {
  if (_callState !== 'idle') return
  let draft = null
  try { draft = (await db.config.get(CALL_DRAFT_KEY))?.value } catch (_) { return }
  if (!draft || !draft.chatId || !draft.startTime) { if (draft) await clearCallDraft(); return }
  const msgs = Array.isArray(draft.messages) ? draft.messages : []
  const endAt = draft.lastActivity || draft.startTime
  const duration = Math.max(0, Math.floor((endAt - draft.startTime) / 1000))
  try {
        if (draft.resumeRecordId) {
      const merged = duration > 0 && msgs.length && await mergeResumedCall(draft.resumeRecordId, {
        chatId: draft.chatId, charId: draft.charId, type: draft.type || 'voice',
        initiator: draft.initiator || 'user', duration, messages: msgs, msgTime: endAt
      })
      if (merged) {
              triggerCallMemory(draft.chatId, draft.charId, draft.ownerUid, callRecordId)
      window.toast?.('上次没挂断的通话已自动保存')
        if (typeof refreshVisibleWechatChatList === 'function') refreshVisibleWechatChatList({ showLoading: false })
        await clearCallDraft()
        return
      }
    }
    const dup = await db.callRecords.where('chatId').equals(draft.chatId)
      .filter(r => r.createdAt === draft.startTime).count()
    if (!dup && duration > 0 && msgs.length) {
      const callRecordId = await db.callRecords.add({
        chatId: draft.chatId,
        charId: draft.charId,
        ownerUid: draft.ownerUid,
        type: draft.type || 'voice',
        initiator: draft.initiator || 'user',
        duration,
        messages: msgs,
        createdAt: draft.startTime,
        recovered: true
      })
      const mm = String(Math.floor(duration / 60)).padStart(2, '0')
      const ss = String(duration % 60).padStart(2, '0')
      const typeLabel = draft.type === 'video' ? '视频通话' : '语音通话'
      await addPrivateMessageIdempotently({
        chatId: draft.chatId,
        charId: draft.charId,
        role: draft.initiator === 'char' ? 'assistant' : 'user',
        content: `[${typeLabel} ${mm}:${ss}]`,
        callRecordId,
        createdAt: endAt
      })
      window.toast?.('上次没挂断的通话已自动保存')
      if (typeof refreshVisibleWechatChatList === 'function') refreshVisibleWechatChatList({ showLoading: false })
    }
    await clearCallDraft()
  } catch (e) { console.error('恢复通话草稿失败', e) }
}

// 回到前台时：先检查是不是闲置超时；页面被杀后重新打开时：补存草稿
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { saveCallDraft(); return }
  checkCallIdle()
  recoverCallDraft()
})
window.addEventListener('pagehide', () => { saveCallDraft() })
setTimeout(() => { if (typeof db !== 'undefined' && db?.config) recoverCallDraft() }, 3000)
let _callMinimized = false

const CALL_TTS_RETRY_DELAY_MS = 3000
const CALL_AUDIO_PLAY_RETRY_DELAY_MS = 3000
const CALL_AI_JSON_SCHEMA = {
  name: 'call_reply',
  schema: {
    type: 'object',
    properties: {
      scene: { type: 'string' },
      speech: { type: 'string' }
    },
    required: ['scene', 'speech'],
    additionalProperties: false
  }
}

// ===== Helper 引用 =====
function h() { return window._wechatCallHelpers || {} }

function callEscHtml(str) {
  const helpers = h()
  if (helpers.wcEscHtml) return helpers.wcEscHtml(str)
  return String(str ?? '').replace(/[&<>"']/g, s => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[s]))
}

function getCallInitial(name) {
  const text = String(name || '我').trim()
  return text ? Array.from(text)[0] : '我'
}

function buildCallAvatarHTML(src, name) {
  return src
    ? `<img src="${callEscHtml(src)}" alt="${callEscHtml(name)}">`
    : `<span>${callEscHtml(getCallInitial(name))}</span>`
}

function getCallUserBaseName(user) {
  return user?.nick || user?.name || '我'
}

async function getCallSelfProfileFor(uid) {
  if (!uid) return {}
  const row = await db.config.get(`wechatSelfProfile_${uid}`)
  return row?.value || {}
}

async function getCallDisplayFor(ownerUid, charId) {
  const helpers = h()
  const char = helpers.getWechatDisplayCharacter
    ? await helpers.getWechatDisplayCharacter(charId, ownerUid)
    : await window.getCharacter(charId)
  const profile = char?.wechatProfile || ((await db.config.get(`wechatProfile_${ownerUid}_${charId}`))?.value || {})
  const name = helpers.getWechatDisplayName?.(char) || (profile.remark || '').trim() || char?.nick || char?.name || '未知'
  const avatar = helpers.getWechatDisplayAvatar?.(char) || profile.avatar || char?.avatar || ''
  return { char, name, avatar }
}

// ===== System Prompt 共享构建函数 =====

function buildCallTimePart(tzConfig, charName, userName) {
  const now = new Date()
  if (tzConfig?.enabled && tzConfig.charTimezone && tzConfig.userTimezone) {
    const charTimeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tzConfig.charTimezone })
    const userTimeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tzConfig.userTimezone })
    const charLoc = tzConfig.charLocation || tzConfig.charTimezone
    const userLoc = tzConfig.userLocation || tzConfig.userTimezone
    return `现在是 ${charName}所在地（${charLoc}）${charTimeStr}，${userName}所在地（${userLoc}）${userTimeStr}`
  }
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `现在是 ${timeStr}`
}

function buildCallCharacterPart(char, charName, userName, loreCtx) {
  const status = char.status || ''
  const gender = char.gender ? `- **性别**：${char.gender}\n` : ''
  const role = char.role ? `- **身份**：${char.role}\n` : ''
  const persona = char.description || '(未设定，以普通人逻辑行事)'

  let part = `<char_settings>\n`
  part += `1. 你的角色名是：${charName}。我的称呼是：${userName}。${status ? `你的当前状态是：${status}。` : ''}\n`
  part += `2. 你的角色设定是：\n${gender}${role}\n${persona}\n`
  if (loreCtx) {
    part += `\n世界观设定：\n${loreCtx}\n`
  }
  part += `</char_settings>`
  return part
}

function buildCallUserPart(userName, userDesc, currentRelationText) {
  let part = `<user_settings>\n`
  if (userDesc && userDesc !== '(未设定)') {
    part += `3. 关于用户的人设：${userDesc}\n`
  }
  part += `与用户的关系：${currentRelationText}\n`
  part += `</user_settings>`
  return part
}

function buildCallMemoryPart(memoryCtx) {
  if (!memoryCtx) return ''
  return `<memoir>\n以下是你需要参考的长期记忆，请自然参考这些事实，不要机械复述：\n${memoryCtx}\n</memoir>`
}

function buildCallRecentHistoryPart(textHistory) {
  if (!textHistory || textHistory.length === 0) return ''
  const historyText = textHistory.map(m => m.content || '').filter(Boolean).join('\n')
  if (!historyText.trim()) return ''
  return `<recent_chat_context>\n这是通话前的文字聊天记录（仅供参考背景，请勿重复回复，基于此背景进行自然的实时通话）：\n${historyText}\n</recent_chat_context>`
}

function buildCallOutputFormat(callType) {
  const sceneDesc = callType === 'video'
    ? '当前画面和环境音的描写（描述用户在视频中看到的画面以及听到的环境音），20-80字'
    : '当前环境音的描写（描述用户在电话中听到的背景声音），10-50字'
  return `【输出格式】
⚠️ 每次回复必须且只能输出一个合法 JSON 对象，JSON 外禁止任何文字。

字段说明：
- "scene"：${sceneDesc}
- "speech"：你说的话（语音内容），自然口语，像真人通话一样

✅ 正确示例：{"scene":"房间里很安静，偶尔传来翻书的声音","speech":"喂？怎么啦，突然打电话过来"}
❌ 错误：好的，我来回复：{"scene":"...","speech":"..."}${window.ProseGuard && window.ProseGuard.isEnabled('wechat') ? '\n\n【文风】\n' + window.ProseGuard.styleRule({ short: true, prefix: '- ' }) : ''}`
}

// ===== 语音通话专属规则 =====

function buildVoiceCallRulesPart(charName, userName) {
  return `【重要规则】
1. 这是实时通话，请保持口语化，模拟真人的说话习惯，语气自然。
你需要描述环境音和你的语音内容。`
}

// ===== 视频通话专属规则 =====

function buildVideoCallRulesPart(charName, userName) {
  return `【重要规则】
1. 这是实时通话，请保持口语化，模拟真人的说话习惯，语气自然。
你需要同时描述画面/环境音和你的语音内容。
2. 描述画面/环境音时，请使用描述性语言，第三人称视角，客观平然。`
}

// ===== 双语模式规则 =====

function buildCallBilingualPart(bilingualSettings, callType, charName) {
  const helpers = h()
  const cfg = helpers.normalizeChatBilingualSettings?.(bilingualSettings)
  if (!cfg || !cfg.enabled) return ''

  const sourceLabel = helpers.getChatBilingualLangLabel?.(cfg.sourceLang) || cfg.sourceLang
  const targetLabel = helpers.getChatBilingualLangLabel?.(cfg.targetLang) || cfg.targetLang
  const exampleSrc = helpers.getChatBilingualExample?.(cfg.sourceLang) || "Of course, I'd love to."

  let part = `【双语模式】
当你的角色说外语时，**必须且只能使用${sourceLabel}**，禁止使用${sourceLabel}以外的其他外语（例如英语）——除非角色人设另有明确母语设定。你的声音回复**必须**严格遵循双语格式：
speech 字段中使用格式：{${sourceLabel}原文}「${targetLabel}翻译」
例如：${exampleSrc}「${targetLabel}翻译」
${targetLabel}翻译文本视为系统自翻译，不视为角色的原话。
当你的角色想要说中文时，需要根据你的角色设定自行判断对于中文的熟悉程度来造句，此时不需要附带翻译。
这条规则的优先级非常高，请务必遵守。`

  if (callType === 'voice') {
    part += `\n仅有语音内容（speech字段）需要翻译，环境音描写（scene字段）以中文输出。`
  } else {
    part += `\n仅有语音内容（speech字段）需要翻译，画面/环境音描写（scene字段）以中文输出。`
  }

  return part
}

// ===== 真实摄像头模式提示 =====

function buildRealCameraPart(charName, userName) {
  return `【真实摄像头模式】
${userName}已开启真实摄像头，你可以通过附带的图片看到${userName}的真实画面。请根据你看到的画面内容自然地融入对话中（比如评论对方的穿着、表情、动作、环境等），但不要每次都刻意提及，保持自然。如果图片模糊或看不清，也不必强行描述。`
}

// ===== 主构建函数：语音通话 =====

async function buildVoiceCallSystemPrompt(chatId, charId) {
  const helpers = h()
  const char = await window.getCharacter(charId)
  const charName = char?.nick || char?.name || ''
  const userName = window._wechatUser?.name || '用户'
  const userDesc = window._wechatUser?.description || '(未设定)'
  const currentRelationText = helpers.buildCurrentRelationText?.(char) || '(未设定)'

  const historyLimit = await helpers.getChatHistoryLimit?.(chatId) || 100
  const context = await helpers.buildWechatReplyContext?.(chatId, charId, historyLimit) || { textHistory: [], loreMessages: [] }
  const loreCtx = await helpers.getChatLorebookContext?.(chatId, charId, context.loreMessages) || ''
  const memoryCtx = window.WanWanMemory?.getMemoryContext
    ? await window.WanWanMemory.getMemoryContext(chatId, charId, window._wechatUid, context.loreMessages)
    : ''
  const bilingualSettings = await helpers.getChatBilingualSettings?.(chatId) || {}
  const tzStored = await db.config.get(`chatTimezone_${chatId}`)
  const tzConfig = tzStored?.value || {}

  const timePart = buildCallTimePart(tzConfig, charName, userName)

  let prompt = `你正在"微信"中扮演一个角色，正在与${userName}进行语音通话。请严格遵守以下规则：\n\n`
  prompt += `核心规则：\n`
  prompt += `A. 当前时间：${timePart}。你应知晓当前时间，但除非对话内容明确相关，否则不要主动提及或评论时间「例如，不要催促我睡觉」。\n\n`
  prompt += `角色和对话规则：\n`
  prompt += buildCallCharacterPart(char, charName, userName, loreCtx) + '\n\n'
  prompt += buildCallUserPart(userName, userDesc, currentRelationText) + '\n\n'
  prompt += buildCallMemoryPart(memoryCtx) + '\n\n'
  prompt += buildCallRecentHistoryPart(context.textHistory) + '\n\n'
  prompt += buildVoiceCallRulesPart(charName, userName) + '\n\n'

  const bilingualPart = buildCallBilingualPart(bilingualSettings, 'voice', charName)
  if (bilingualPart) prompt += bilingualPart + '\n\n'
  const ttsTagHintVoice = await getTTSTagHint('call', charName)
  if (ttsTagHintVoice) prompt += ttsTagHintVoice + '\n\n'
  const scheduleCtxVoice = await getScheduleContext()
  if (scheduleCtxVoice) prompt += scheduleCtxVoice + '\n\n'
  const charSchedVoice = await getCharScheduleContext(chatId, charName)
  if (charSchedVoice) prompt += charSchedVoice + '\n\n'

  prompt += buildCallOutputFormat('voice') + '\n'

  return prompt
}

// ===== 主构建函数：视频通话 =====

async function buildVideoCallSystemPrompt(chatId, charId) {
  const helpers = h()
  const char = await window.getCharacter(charId)
  const charName = char?.nick || char?.name || ''
  const userName = window._wechatUser?.name || '用户'
  const userDesc = window._wechatUser?.description || '(未设定)'
  const currentRelationText = helpers.buildCurrentRelationText?.(char) || '(未设定)'

  const historyLimit = await helpers.getChatHistoryLimit?.(chatId) || 100
  const context = await helpers.buildWechatReplyContext?.(chatId, charId, historyLimit) || { textHistory: [], loreMessages: [] }
  const loreCtx = await helpers.getChatLorebookContext?.(chatId, charId, context.loreMessages) || ''
  const memoryCtx = window.WanWanMemory?.getMemoryContext
    ? await window.WanWanMemory.getMemoryContext(chatId, charId, window._wechatUid, context.loreMessages)
    : ''
  const bilingualSettings = await helpers.getChatBilingualSettings?.(chatId) || {}
  const tzStored = await db.config.get(`chatTimezone_${chatId}`)
  const tzConfig = tzStored?.value || {}

  const timePart = buildCallTimePart(tzConfig, charName, userName)

  let prompt = `你正在"微信"中扮演一个角色，正在与${userName}进行视频通话。请严格遵守以下规则：\n\n`
  prompt += `核心规则：\n`
  prompt += `A. 当前时间：${timePart}。你应知晓当前时间，但除非对话内容明确相关，否则不要主动提及或评论时间「例如，不要催促我睡觉」。\n\n`
  prompt += `角色和对话规则：\n`
  prompt += buildCallCharacterPart(char, charName, userName, loreCtx) + '\n\n'
  prompt += buildCallUserPart(userName, userDesc, currentRelationText) + '\n\n'
  prompt += buildCallMemoryPart(memoryCtx) + '\n\n'
  prompt += buildCallRecentHistoryPart(context.textHistory) + '\n\n'
  prompt += buildVideoCallRulesPart(charName, userName) + '\n\n'

  const bilingualPart = buildCallBilingualPart(bilingualSettings, 'video', charName)
  if (bilingualPart) prompt += bilingualPart + '\n\n'
  const ttsTagHintVideo = await getTTSTagHint('call', charName)
  if (ttsTagHintVideo) prompt += ttsTagHintVideo + '\n\n'
  const scheduleCtxVideo = await getScheduleContext()
  if (scheduleCtxVideo) prompt += scheduleCtxVideo + '\n\n'
  const charSchedVideo = await getCharScheduleContext(chatId, charName)
  if (charSchedVideo) prompt += charSchedVideo + '\n\n'

  if (_realCameraActive) {
    prompt += buildRealCameraPart(charName, userName) + '\n\n'
  }

  prompt += buildCallOutputFormat('video') + '\n'

  return prompt
}

// ===== UI 构建 =====

function buildVoiceCallPageHTML(char) {
  const helpers = h()
  const name = helpers.getWechatDisplayName?.(char) || char?.name || ''
  const avatarUrl = helpers.getWechatDisplayAvatar?.(char)
  const avatarInner = avatarUrl
    ? `<img src="${avatarUrl}" alt="${helpers.wcEscHtml?.(name) || name}">`
    : helpers.buildWechatInitialAvatarHTML?.(name) || `<span>${name.charAt(0)}</span>`

  return `
    <div class="call-bg"></div>
    <div class="call-content">
      <button class="call-minimize-btn" id="btn-call-minimize" type="button">
        <i class="fa-solid fa-compress"></i>
      </button>
      <div class="call-top">
        <div class="call-avatar">${avatarInner}</div>
        <div class="call-name">${helpers.wcEscHtml?.(name) || name}</div>
        <div class="call-status" id="call-status">正在等待接听...</div>
      </div>
      <div class="call-conversation" id="call-conversation">
        <div class="call-messages" id="call-messages"></div>
      </div>
      <div class="call-controls">
        <button class="call-ctrl-btn call-mute" id="btn-call-mute" type="button">
          <i class="fa-solid fa-microphone"></i>
          <span>静音</span>
        </button>
        <button class="call-ctrl-btn call-hangup" id="btn-call-hangup" type="button">
          <i class="fa-solid fa-phone-slash"></i>
        </button>
        <button class="call-ctrl-btn call-speaker" id="btn-call-speaker" type="button">
          <i class="fa-solid fa-volume-high"></i>
          <span>扬声器</span>
        </button>
      </div>
      <div class="call-input-area" id="call-input-area">
        <button class="call-reply-btn" id="btn-call-reply" type="button">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </button>
        <input class="call-input" id="call-input" type="text" placeholder="说点什么..." autocomplete="off">
        <button class="call-send-btn" id="btn-call-send" type="button">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </div>
  `
}

function buildVideoCallPageHTML(char) {
  const helpers = h()
  const name = helpers.getWechatDisplayName?.(char) || char?.name || ''
  const avatarUrl = helpers.getWechatDisplayAvatar?.(char)
  const userAvatarUrl = window._wechatUser?.avatar || ''
  const userAvatarInner = userAvatarUrl
    ? `<img src="${userAvatarUrl}" alt="我">`
    : `<span>${(window._wechatUser?.name || '我').charAt(0)}</span>`

  return `
    <div class="call-bg video-bg"></div>
    <div class="call-content video-content">
      <button class="call-minimize-btn" id="btn-call-minimize" type="button">
        <i class="fa-solid fa-compress"></i>
      </button>
      <div class="call-video-header">
        <div class="call-name-overlay">${helpers.wcEscHtml?.(name) || name}</div>
        <div class="call-timer-overlay" id="call-status">正在等待接听...</div>
        <div class="call-pip" id="call-pip">
          <video id="call-pip-video" autoplay playsinline muted style="display:none"></video>
          <div class="call-pip-avatar" id="call-pip-avatar">${userAvatarInner}</div>
        </div>
      </div>
      <div class="call-video-main" id="call-conversation">
        <div class="call-messages" id="call-messages"></div>
      </div>
      <div class="call-controls">
        <button class="call-ctrl-btn call-flip" id="btn-call-flip" type="button">
          <i class="fa-solid fa-camera-rotate"></i>
          <span>翻转</span>
        </button>
        <button class="call-ctrl-btn call-mute" id="btn-call-mute" type="button">
          <i class="fa-solid fa-microphone"></i>
          <span>静音</span>
        </button>
        <button class="call-ctrl-btn call-hangup" id="btn-call-hangup" type="button">
          <i class="fa-solid fa-phone-slash"></i>
        </button>
        <button class="call-ctrl-btn call-camera" id="btn-call-camera" type="button">
          <i class="fa-solid fa-video"></i>
          <span>摄像头</span>
        </button>
      </div>
      <div class="call-input-area" id="call-input-area">
        <button class="call-reply-btn" id="btn-call-reply" type="button">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </button>
        <input class="call-input" id="call-input" type="text" placeholder="说点什么..." autocomplete="off">
        <button class="call-send-btn" id="btn-call-send" type="button">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </div>
  `
}

// ===== 通话生命周期 =====

async function startCall(chatId, charId, type, initiator = 'user') {
  if (_callState !== 'idle') return
  unlockCallAudioPlayback()

  _callChatId = chatId
  _callCharId = charId
  _callType = type
  _callState = 'connecting'
  _callHistory = []
  _callStartTime = null
  _callInitiator = initiator
  _realCameraActive = false
  _realCameraStream = null

  const helpers = h()
  const char = await helpers.getWechatDisplayCharacter?.(charId)
  if (!char) {
    window.toast?.('角色不存在')
    resetCallState()
    return
  }

  try {
    const autoCfg = await db.config.get('callAutoSpeak')
    _callAutoSpeak = autoCfg ? autoCfg.value !== false : true
  } catch (_) { _callAutoSpeak = true }

  const page = document.createElement('div')
  page.id = 'call-page'
  page.className = `full-page call-page ${type === 'video' ? 'video-call-page' : 'voice-call-page'}`
  page.dataset.chatId = chatId
  page.dataset.charId = charId
  page.innerHTML = type === 'video' ? buildVideoCallPageHTML(char) : buildVoiceCallPageHTML(char)

  window.openPage(page)
  bindCallEvents(page, type)
  try {
    const bootSession = _callSessionId
    _callSystemPrompt = ''
    showCallTypingIndicator(page) // 拨出后立刻出现三点，表示正在等对方
    updateCallStatus(page, '对方正在接听...')
    _callSystemPrompt = await withCallTimeout(
      type === 'video'
        ? buildVideoCallSystemPrompt(chatId, charId)
        : buildVoiceCallSystemPrompt(chatId, charId),
      20000, '准备通话资料超时'
    )
    if (bootSession !== _callSessionId) return // 已挂断，不再继续

    const userName = window._wechatUser?.name || '用户'
    const helpers = h()
    const charName = helpers.getWechatDisplayName?.(char) || char?.name || ''
    let initMsg
    if (initiator === 'char') {
      initMsg = type === 'video'
        ? `你（${charName}）发起了视频通话，${userName}接听了视频电话。`
        : `你（${charName}）发起了语音通话，${userName}接听了电话。`
    } else {
      initMsg = type === 'video'
        ? `${userName}发起了视频通话，你接听了视频电话。`
        : `${userName}发起了语音通话，你接听了电话。`
    }

    _callHistory.push({ role: 'user', content: initMsg })
    dispatchCallStateChange()
    await sendCallAIRequest(page)
  } catch (e) {
console.error('通话连接失败', e)
    page.querySelectorAll('.call-msg-typing').forEach(el => el.remove())
    updateCallStatus(page, '连接失败')
    window.toast?.('通话连接失败：' + (e.message || '未知错误'))
  }
}

function bindCallEvents(page, type) {
  page.addEventListener('pointerdown', retryPendingCallAudioPlayback)
  page.querySelector('#btn-call-hangup').addEventListener('click', () => endCall())
  page.querySelector('#btn-call-minimize')?.addEventListener('click', () => minimizeCall())
  // 点通话页任意位置（包括点输入框）都先解锁一次音频，这样回车发送后也能自动朗读
  page.addEventListener('touchend', unlockCallAudioPlayback, { passive: true })
  page.addEventListener('click', unlockCallAudioPlayback)

  // 自动朗读开关（右上角）
  const callContent = page.querySelector('.call-content')
  if (callContent && !page.querySelector('#btn-call-autospeak')) {
    const autoBtn = document.createElement('button')
    autoBtn.type = 'button'
    autoBtn.id = 'btn-call-autospeak'
    autoBtn.className = 'call-minimize-btn call-autospeak-btn'
    const paintAuto = () => {
      autoBtn.innerHTML = `<i class="fa-solid ${_callAutoSpeak ? 'fa-volume-high' : 'fa-volume-xmark'}"></i>`
      autoBtn.title = _callAutoSpeak ? '自动朗读：开' : '自动朗读：关'
    }
    paintAuto()
    autoBtn.addEventListener('click', async () => {
      _callAutoSpeak = !_callAutoSpeak
      paintAuto()
      try { await db.config.put({ key: 'callAutoSpeak', value: _callAutoSpeak }) } catch (_) {}
      if (!_callAutoSpeak) {
        cancelCallTTSRetry()
        stopCallAudio()
      }
      window.toast?.(_callAutoSpeak ? '自动朗读已开启' : '自动朗读已关闭，可点气泡旁的小喇叭')
    })
    callContent.appendChild(autoBtn)
  }

  page.querySelector('#btn-call-mute')?.addEventListener('click', function () {
    this.classList.toggle('active')
    const icon = this.querySelector('i')
    if (this.classList.contains('active')) {
      icon.className = 'fa-solid fa-microphone-slash'
    } else {
      icon.className = 'fa-solid fa-microphone'
    }
  })

  page.querySelector('#btn-call-speaker')?.addEventListener('click', function () {
    toggleCallSpeechRecognition(page, this)
  })

  page.querySelector('#btn-call-flip')?.addEventListener('click', function () {
    flipRealCamera(page)
  })

  page.querySelector('#btn-call-camera')?.addEventListener('click', function () {
    toggleRealCamera(page)
  })

  const input = page.querySelector('#call-input')
  const sendBtn = page.querySelector('#btn-call-send')
  const replyBtn = page.querySelector('#btn-call-reply')

  sendBtn.addEventListener('click', () => handleCallUserSend(page))
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCallUserSend(page)
    }
  })
  replyBtn.addEventListener('click', () => handleCallReply(page))
}

function handleCallUserSend(page) {
  if (_callState === 'idle') return
  const input = page.querySelector('#call-input')
  const text = input.value.trim()
  if (!text) return
  input.value = ''
  cancelCallTTSRetry()
  retryPendingCallAudioPlayback()

  _callHistory.push({ role: 'user', content: text })
  _callLastActivity = Date.now()
  saveCallDraft()

  appendCallUserBubble(page, text)

  // 发送后自动请求角色回复（魔法棒按钮保留，用于失败后重试）
  if (!_callAISending) sendCallAIRequest(page)
}

async function handleCallReply(page) {
  if (_callState === 'idle' || _callAISending) return
  if (_callHistory.length === 0 || _callHistory[_callHistory.length - 1].role !== 'user') {
    window.toast?.('请先发送消息')
    return
  }
  await sendCallAIRequest(page)
}

function appendCallUserBubble(page, text) {
  const container = page.querySelector('#call-messages')
  if (!container) return
  const helpers = h()
  const div = document.createElement('div')
  div.className = 'call-msg call-msg-user'
  div.innerHTML = `<span class="call-msg-text">${helpers.wcEscHtml?.(text) || text}</span>`
  container.appendChild(div)
  const conversation = page.querySelector('#call-conversation')
  if (conversation) conversation.scrollTop = conversation.scrollHeight
}
// 通话里“对方正在回复”的三点跳动占位（样式由 JS 自带，不用改 CSS 文件）
function ensureCallTypingStyle() {
  if (document.getElementById('call-typing-style')) return
  const style = document.createElement('style')
  style.id = 'call-typing-style'
  style.textContent = `
    .call-typing-dots { display: inline-flex; align-items: center; gap: 5px; min-height: 20px; }
    .call-typing-dots i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: 0.45; animation: call-typing-bounce 1.2s infinite ease-in-out; }
    .call-typing-dots i:nth-child(2) { animation-delay: 0.15s; }
    .call-typing-dots i:nth-child(3) { animation-delay: 0.3s; }
    @keyframes call-typing-bounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-4px); opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) { .call-typing-dots i { animation: none; opacity: 0.8; } }
  `
  document.head.appendChild(style)
}

function showCallTypingIndicator(page) {
  const container = page?.querySelector('#call-messages')
  if (!container) return null
  ensureCallTypingStyle()
  const el = document.createElement('div')
  el.className = 'call-msg call-msg-assistant call-msg-typing'
  el.innerHTML = '<span class="call-msg-text call-typing-dots"><i></i><i></i><i></i></span>'
  container.appendChild(el)
  const conversation = page.querySelector('#call-conversation')
  if (conversation) conversation.scrollTop = conversation.scrollHeight
  return el
}

function removeCallTypingIndicator(el) {
  if (el && el.parentNode) el.remove()
}


function withCallTimeout(promise, ms, msg) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(msg)), ms)
    Promise.resolve(promise).then(
      v => { clearTimeout(timer); resolve(v) },
      e => { clearTimeout(timer); reject(e) }
    )
  })
}

function callAIWithTimeout(messages, opts) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('对方响应超时（' + Math.round(CALL_AI_TIMEOUT_MS / 1000) + ' 秒）')), CALL_AI_TIMEOUT_MS)
    window.callAI(messages, opts).then(
      v => { clearTimeout(timer); resolve(v) },
      e => { clearTimeout(timer); reject(e) }
    )
  })
}

function clearCallRetryStatus(page) {
  const el = page.querySelector('#call-status')
  if (!el) return
  el.onclick = null
  el.style.cursor = ''
  el.style.textDecoration = ''
}

function showCallRetryStatus(page) {
  const el = page.querySelector('#call-status')
  if (!el) return
  el.textContent = '对方没有响应，点这里重试'
  el.style.cursor = 'pointer'
  el.style.textDecoration = 'underline'
  el.onclick = () => {
    if (_callState !== 'connecting') { clearCallRetryStatus(page); return }
    if (_callAISending) return
    sendCallAIRequest(page)
  }
}

async function sendCallAIRequest(page) {
  const mySession = _callSessionId
  if (!_callSystemPrompt) { window.toast?.('通话资料还在准备中，请稍候'); return }
  if (_callAISending) return
  _callAISending = true

  const statusEl = page.querySelector('#call-status')
  const prevStatus = statusEl?.textContent || ''
  let typingEl = null
  try {
    if (_callState === 'connecting') {
      clearCallRetryStatus(page)
      updateCallStatus(page, '对方正在接听...')
    }

    let messages = _callHistory.map(m => ({ role: m.role, content: m.content }))
    // 回到通话后的第一次请求：附带一句"刚才中断了"的提示（不写进通话记录）
    if (_callResumeNote) {
      const last = messages[messages.length - 1]
      if (last && last.role === 'user') {
        messages[messages.length - 1] = { role: 'user', content: String(last.content || '') + '\n' + _callResumeNote }
      } else {
        messages.push({ role: 'user', content: _callResumeNote })
      }
    }
    if (_realCameraActive && _callType === 'video') {
      const frame = await captureVideoFrame()
      if (frame) {
        const lastIdx = messages.length - 1
        const lastMsg = messages[lastIdx]
        messages[lastIdx] = {
          role: lastMsg.role,
          content: [
            { type: 'image_url', image_url: { url: frame } },
            { type: 'text', text: lastMsg.content }
          ]
        }
      }
    }
  typingEl = page.querySelector('.call-msg-typing') || showCallTypingIndicator(page)
    const raw = await callAIWithTimeout(messages, {
      system: _callSystemPrompt,
      responseFormat: 'json_object',
      responseJsonSchema: CALL_AI_JSON_SCHEMA,
      temperature: await window.getAITemperaturePreset('wechatCall')
    })
    removeCallTypingIndicator(typingEl)
    typingEl = null
    if (_callState === 'idle') return

    if (mySession !== _callSessionId) return // 旧通话遗留的请求，直接丢弃
    const parsed = extractCallJson(raw)
    if (window.ProseGuard && window.ProseGuard.isEnabled('wechat') && parsed.speech) {
      try {
        const pg = await window.ProseGuard.polishText(parsed.speech, { allow: 0, maxUnits: 2, protect: [/【[^】]*】/] })
        if (pg.fixed) parsed.speech = pg.text
      } catch (e) { console.warn('[call] 文风润色失败，使用原文', e) }
      if (_callState === 'idle') return
    }

    _callHistory.push({
      role: 'assistant',
      content: JSON.stringify(parsed),
      scene: parsed.scene,
      speech: parsed.speech,
      timestamp: Date.now()
    })
    _callResumeNote = ''
    if (_callState === 'connecting') {
      _callState = 'connected'
      _callStartTime = Date.now()
      startCallTimer(page)
    }
    _callLastActivity = Date.now()
    startCallIdleWatch()
    saveCallDraft()

    updateCallScene(page, parsed.scene)
    updateCallSpeech(page, parsed.speech)

    if (_callAutoSpeak) playCallTTS(parsed.speech)

  } catch (e) {
    console.error('通话 AI 请求失败', e)
    if (mySession !== _callSessionId || _callState === 'idle') return
    if (_callState === 'connecting') {
      showCallRetryStatus(page)
    }
    window.toast?.('通话出错：' + (e.message || '').slice(0, 100))
  } finally {
    removeCallTypingIndicator(typingEl)
    if (mySession === _callSessionId) _callAISending = false
  }
}

function extractCallJson(raw) {
  if (!raw) return { scene: '', speech: '' }
  try {
    let text = raw.trim()
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) text = fenceMatch[1].trim()
    const obj = JSON.parse(text)
    return {
      scene: String(obj.scene || ''),
      speech: String(obj.speech || '')
    }
  } catch (e) {
    const sceneMatch = raw.match(/"scene"\s*:\s*"((?:[^"\\]|\\.)*)"/s)
    const speechMatch = raw.match(/"speech"\s*:\s*"((?:[^"\\]|\\.)*)"/s)
    return {
      scene: sceneMatch ? sceneMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : '',
      speech: speechMatch ? speechMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : raw.slice(0, 200)
    }
  }
}

// ===== UI 更新 =====

function updateCallStatus(page, text) {
  const el = page.querySelector('#call-status')
  if (el) el.textContent = text
}

function updateCallScene(page, sceneText) {
  const container = page.querySelector('#call-messages')
  if (!container || !sceneText) return
  const helpers = h()
  const div = document.createElement('div')
  div.className = 'call-msg call-msg-scene'
  div.innerHTML = `<span class="call-msg-scene-text">${helpers.wcEscHtml?.(sceneText) || sceneText}</span>`
  container.appendChild(div)
  const conversation = page.querySelector('#call-conversation')
  if (conversation) conversation.scrollTop = conversation.scrollHeight
}

function updateCallSpeech(page, speechText) {
  if (!speechText) return
  const helpers = h()

  const container = page.querySelector('#call-messages')
  if (container) {
    const div = document.createElement('div')
    div.className = 'call-msg call-msg-assistant'
    const bilingualParsed = helpers.parseBilingualText?.(speechText)
    if (bilingualParsed?.translation) {
      div.innerHTML = `<span class="call-msg-text"><span class="call-msg-original">${helpers.wcEscHtml?.(bilingualParsed.original) || speechText}</span><span class="call-msg-translation">${helpers.wcEscHtml?.(bilingualParsed.translation) || bilingualParsed.translation}</span></span><button type="button" class="call-msg-speak" title="朗读"><i class="fa-solid fa-volume-high"></i></button>`
    } else {
      div.innerHTML = `<span class="call-msg-text">${helpers.wcEscHtml?.(speechText) || speechText}</span><button type="button" class="call-msg-speak" title="朗读"><i class="fa-solid fa-volume-high"></i></button>`
    }
    div.querySelector('.call-msg-speak')?.addEventListener('click', e => {
      e.stopPropagation()
      playCallTTS(speechText)
    })
    container.appendChild(div)
    const conversation = page.querySelector('#call-conversation')
    if (conversation) conversation.scrollTop = conversation.scrollHeight
  }

}

function startCallTimer(page) {
  if (_callTimerInterval) clearInterval(_callTimerInterval)
  _callTimerInterval = setInterval(() => {
    if (_callState !== 'connected' || !_callStartTime) return
    const elapsed = Math.floor((Date.now() - _callStartTime) / 1000)
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
    const ss = String(elapsed % 60).padStart(2, '0')
    updateCallStatus(page, `${mm}:${ss}`)
    const floatingText = document.querySelector('#call-floating-indicator .call-floating-text')
    if (floatingText) floatingText.textContent = `${mm}:${ss}`
  }, 1000)
}

function formatCallDuration() {
  if (!_callStartTime) return '00:00'
  const elapsed = Math.floor((Date.now() - _callStartTime) / 1000)
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

function getCallDurationSeconds() {
  if (!_callStartTime) return 0
  return Math.floor((Date.now() - _callStartTime) / 1000)
}

// ===== TTS =====

// iPhone 只允许“被触摸解锁过的音频元素”在没有手势时自动播放。回车发送不算触摸，
// 所以通话里全程复用同一个 Audio 元素：点屏幕时解锁一次，之后每条语音只换 src。
let _callSharedAudio = null
const CALL_SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='

function getCallSharedAudio() {
  if (!_callSharedAudio) {
    _callSharedAudio = new Audio()
    _callSharedAudio.preload = 'auto'
  }
  return _callSharedAudio
}

function unlockCallAudioPlayback() {
  const keepAliveAudio = document.getElementById('keepalive-audio')
  if (keepAliveAudio) {
    try {
      keepAliveAudio.volume = 0
      keepAliveAudio.play().catch(() => {})
    } catch (_) {}
  }
  try {
    const a = getCallSharedAudio()
    if (a._callUnlocked || _callAudioBlobUrl) return
    a.src = CALL_SILENT_WAV
    const p = a.play()
    if (p && p.then) {
      p.then(() => {
        a._callUnlocked = true
        if (String(a.src).startsWith('data:audio/wav')) a.pause()
      }).catch(() => {})
    }
  } catch (_) {}
}

function cancelCallTTSRetry() {
  _callTTSCanceledRetrySeqs.add(_callTTSRequestSeq)
  if (_callTTSRetryTimer) {
    clearTimeout(_callTTSRetryTimer)
    _callTTSRetryTimer = null
  }
}

function scheduleCallTTSRetry(speechText, requestSeq) {
  if (_callState === 'idle' || _callTTSCanceledRetrySeqs.has(requestSeq)) return
  if (_callTTSRetryTimer) clearTimeout(_callTTSRetryTimer)
  _callTTSRetryTimer = setTimeout(() => {
    _callTTSRetryTimer = null
    tryPlayCallTTS(speechText, requestSeq)
  }, CALL_TTS_RETRY_DELAY_MS)
}

function scheduleCallAudioPlayRetry() {
  if (_callState === 'idle' || !_callPendingAudioBlobUrl) return
  if (_callAudioPlayRetryTimer) clearTimeout(_callAudioPlayRetryTimer)
  _callAudioPlayRetryTimer = setTimeout(() => {
    _callAudioPlayRetryTimer = null
    retryPendingCallAudioPlayback()
  }, CALL_AUDIO_PLAY_RETRY_DELAY_MS)
}

function clearCallAudioPlayRetry() {
  if (_callAudioPlayRetryTimer) {
    clearTimeout(_callAudioPlayRetryTimer)
    _callAudioPlayRetryTimer = null
  }
}

async function playCallAudioBlob(blobUrl) {
  if (_callState === 'idle') {
    URL.revokeObjectURL(blobUrl)
    return
  }
  stopCallAudio()
  _callPendingAudioBlobUrl = null
  _callAudioBlobUrl = blobUrl
  const sharedAudio = getCallSharedAudio()
  _callAudioPlayer = sharedAudio
  sharedAudio.onended = () => {
    if (_callAudioPlayer === sharedAudio) _callAudioPlayer = null
    if (_callAudioBlobUrl === blobUrl) _callAudioBlobUrl = null
    URL.revokeObjectURL(blobUrl)
  }
  sharedAudio.src = blobUrl
  try {
    await sharedAudio.play()
    clearCallAudioPlayRetry()
  } catch (e) {
    console.warn('通话音频播放失败', e.name || e.message || e)
    if (_callAudioBlobUrl === blobUrl) _callAudioBlobUrl = null
    _callAudioPlayer = null
    _callPendingAudioBlobUrl = blobUrl
    scheduleCallAudioPlayRetry()
  }
}

function retryPendingCallAudioPlayback() {
  if (_callState === 'idle' || !_callPendingAudioBlobUrl) return
  const blobUrl = _callPendingAudioBlobUrl
  _callPendingAudioBlobUrl = null
  playCallAudioBlob(blobUrl)
}

async function playCallTTS(speechText) {
  if (!speechText) return
  cancelCallTTSRetry()
  const requestSeq = ++_callTTSRequestSeq
  await tryPlayCallTTS(speechText, requestSeq)
}

async function tryPlayCallTTS(speechText, requestSeq) {
  if (_callState === 'idle') return
  try {
    const helpers = h()
    if (typeof helpers.callTTS !== 'function' || typeof helpers.getChatVoiceId !== 'function') return
    const voiceId = await helpers.getChatVoiceId(_callChatId)
    if (_callState === 'idle') return
    if (!voiceId) return
    let ttsText = speechText
    const bilingualParsed = helpers.parseBilingualText?.(speechText)
    if (bilingualParsed?.original) {
      ttsText = bilingualParsed.original
    }

    const blobUrl = await helpers.callTTS(ttsText, voiceId)
    if (!blobUrl) throw new Error('语音合成未返回音频地址')
    if (_callState === 'idle') {
      URL.revokeObjectURL(blobUrl)
      return
    }

    await playCallAudioBlob(blobUrl)
  } catch (e) {
    console.warn('通话 TTS 失败', e.message)
    scheduleCallTTSRetry(speechText, requestSeq)
  }
}

function stopCallAudio() {
  clearCallAudioPlayRetry()
  if (_callAudioPlayer) {
    _callAudioPlayer.onended = null
    _callAudioPlayer.pause()
    _callAudioPlayer = null
  }
  if (_callAudioBlobUrl) {
    URL.revokeObjectURL(_callAudioBlobUrl)
    _callAudioBlobUrl = null
  }
  if (_callPendingAudioBlobUrl) {
    URL.revokeObjectURL(_callPendingAudioBlobUrl)
    _callPendingAudioBlobUrl = null
  }
}

// ===== 真实摄像头 =====

async function toggleRealCamera(page) {
  if (_realCameraActive) {
    stopRealCamera(page)
  } else {
    await startRealCamera(page)
  }
}

async function flipRealCamera(page) {
  if (!_realCameraActive) return
  _realCameraFacingMode = _realCameraFacingMode === 'user' ? 'environment' : 'user'
  if (_realCameraStream) {
    _realCameraStream.getTracks().forEach(t => t.stop())
  }
  try {
    _realCameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: _realCameraFacingMode, width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    })
    const videoEl = page.querySelector('#call-pip-video')
    if (videoEl) videoEl.srcObject = _realCameraStream
  } catch (e) {
    console.error('翻转摄像头失败', e)
    window.toast?.('翻转摄像头失败')
  }
}

async function startRealCamera(page) {
  try {
    _realCameraFacingMode = 'user'
    _realCameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: _realCameraFacingMode, width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    })
    _realCameraActive = true

    const videoEl = page.querySelector('#call-pip-video')
    const avatarEl = page.querySelector('#call-pip-avatar')
    if (videoEl) {
      videoEl.srcObject = _realCameraStream
      videoEl.style.display = 'block'
    }
    if (avatarEl) avatarEl.style.display = 'none'

    const cameraBtn = page.querySelector('#btn-call-camera')
    if (cameraBtn) cameraBtn.classList.add('active')

    _callSystemPrompt = await buildVideoCallSystemPrompt(_callChatId, _callCharId)
  } catch (e) {
    console.error('摄像头启动失败', e)
    window.toast?.('摄像头启动失败：' + (e.message || '权限被拒绝'))
  }
}

function stopRealCamera(page) {
  if (_realCameraStream) {
    _realCameraStream.getTracks().forEach(t => t.stop())
    _realCameraStream = null
  }
  _realCameraActive = false

  const videoEl = page.querySelector('#call-pip-video')
  const avatarEl = page.querySelector('#call-pip-avatar')
  if (videoEl) {
    videoEl.srcObject = null
    videoEl.style.display = 'none'
  }
  if (avatarEl) avatarEl.style.display = ''

  const cameraBtn = page.querySelector('#btn-call-camera')
  if (cameraBtn) cameraBtn.classList.remove('active')
}

async function captureVideoFrame() {
  const videoEl = document.querySelector('#call-pip-video')
  if (!videoEl || !_realCameraStream || videoEl.videoWidth === 0) return null
  try {
    const canvas = document.createElement('canvas')
    canvas.width = videoEl.videoWidth
    canvas.height = videoEl.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoEl, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.6)
  } catch (e) {
    console.warn('摄像头截图失败', e)
    return null
  }
}

// ===== 语音识别输入 =====

function toggleCallSpeechRecognition(page, btn) {
  if (_callRecognition) {
    stopCallSpeechRecognition()
    return
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    window.toast?.('当前浏览器不支持语音识别')
    return
  }
  const recognition = new SpeechRecognition()
  recognition.lang = 'zh-CN'
  recognition.interimResults = true
  recognition.continuous = true
  _callRecognition = recognition

  btn.classList.add('active')
  const input = page.querySelector('#call-input')

  let finalText = ''

  const resetSilenceTimer = () => {
    if (_callRecognitionTimeout) clearTimeout(_callRecognitionTimeout)
    _callRecognitionTimeout = setTimeout(() => stopCallSpeechRecognition(), 3000)
  }

  recognition.onresult = (e) => {
    resetSilenceTimer()
    let interim = ''
    for (let i = 0; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        finalText += e.results[i][0].transcript
      } else {
        interim += e.results[i][0].transcript
      }
    }
    if (input) input.value = finalText + interim
  }

  recognition.onerror = (e) => {
    if (e.error !== 'no-speech') console.warn('语音识别错误', e.error)
    stopCallSpeechRecognition()
  }

  recognition.onend = () => {
    stopCallSpeechRecognition()
  }

  recognition.start()
  resetSilenceTimer()
}

function stopCallSpeechRecognition() {
  if (_callRecognitionTimeout) {
    clearTimeout(_callRecognitionTimeout)
    _callRecognitionTimeout = null
  }
  if (_callRecognition) {
    try { _callRecognition.stop() } catch (_) {}
    _callRecognition = null
  }
  const btn = document.querySelector('#btn-call-speaker')
  if (btn) btn.classList.remove('active')
}

// ===== 缩小 / 浮窗 =====

function ensureFloatingIndicator() {
  let el = document.getElementById('call-floating-indicator')
  if (el) return el
  el = document.createElement('div')
  el.id = 'call-floating-indicator'
  el.className = 'call-floating-indicator'
  el.innerHTML = `
    <div class="call-floating-icon"><i class="fa-solid fa-phone"></i></div>
    <div class="call-floating-text">等待接听</div>
  `
  el.addEventListener('click', () => restoreCall())
  document.body.appendChild(el)
  return el
}

function minimizeCall() {
  if (_callState === 'idle' || _callMinimized) return
  _callMinimized = true

  const page = document.getElementById('call-page')
  if (page) page.classList.add('is-minimized')

  const indicator = ensureFloatingIndicator()
  const icon = indicator.querySelector('.call-floating-icon i')
  icon.className = _callType === 'video' ? 'fa-solid fa-video' : 'fa-solid fa-phone'
  indicator.classList.add('is-active')

  const textEl = indicator.querySelector('.call-floating-text')
  if (_callStartTime && textEl) {
    const elapsed = Math.floor((Date.now() - _callStartTime) / 1000)
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
    const ss = String(elapsed % 60).padStart(2, '0')
    textEl.textContent = `${mm}:${ss}`
  } else if (textEl) {
    textEl.textContent = '等待接听'
  }

  dispatchCallStateChange()
}

function restoreCall() {
  if (!_callMinimized) return
  _callMinimized = false

  const page = document.getElementById('call-page')
  if (page) page.classList.remove('is-minimized')

  const indicator = document.getElementById('call-floating-indicator')
  if (indicator) indicator.classList.remove('is-active')

  dispatchCallStateChange()
}

function hideFloatingIndicator() {
  const indicator = document.getElementById('call-floating-indicator')
  if (indicator) indicator.classList.remove('is-active')
}

function dispatchCallStateChange() {
  document.dispatchEvent(new CustomEvent('callStateChange', {
    detail: { state: _callState, charId: _callCharId, chatId: _callChatId, minimized: _callMinimized }
  }))
}
// 续接的通话：把新内容合并回原记录和聊天里原来那条通话消息
async function mergeResumedCall(recordId, info) {
  try {
    const old = await db.callRecords.get(recordId)
    if (!old) return false
        await db.callRecords.update(recordId, { duration: info.duration, messages: info.messages })
    triggerCallMemory(old.chatId, old.charId, old.ownerUid, recordId)
    const mm = String(Math.floor(info.duration / 60)).padStart(2, '0')
    const ss = String(info.duration % 60).padStart(2, '0')
    const typeLabel = info.type === 'video' ? '视频通话' : '语音通话'
    const content = `[${typeLabel} ${mm}:${ss}]`
    const linked = await db.messages.where('chatId').equals(info.chatId)
      .filter(m => Number(m.callRecordId) === Number(recordId)).first()
    if (linked) {
      await db.messages.update(linked.id, { content, createdAt: info.msgTime })
    } else {
      await addPrivateMessageIdempotently({
        chatId: info.chatId,
        charId: info.charId,
        role: info.initiator === 'char' ? 'assistant' : 'user',
        content,
        callRecordId: recordId,
        createdAt: info.msgTime
      })
    }
    return true
  } catch (e) {
    console.error('合并通话记录失败', e)
    return false
  }
}

// 点聊天里的通话气泡 → 打开这次通话的详情页（里面有「回到通话」按钮）
async function openCallRecordFromMessage(msgId) {
  const msg = await db.messages.get(msgId)
  if (!msg) return
  let record = null
  const linkedId = Number(msg.callRecordId)
  if (Number.isInteger(linkedId) && linkedId > 0) record = await db.callRecords.get(linkedId)
  if (!record) {
    // 老消息没有关联 id：按类型+时长+时间就近匹配
    const m = String(msg.content || '').match(/^\[(视频通话|语音通话)\s+(\d{2}):(\d{2})\]$/)
    if (m) {
      const type = m[1] === '视频通话' ? 'video' : 'voice'
      const dur = Number(m[2]) * 60 + Number(m[3])
      const rows = await db.callRecords.where('chatId').equals(msg.chatId).toArray()
      let bestDist = Infinity
      for (const r of rows) {
        if ((r.type === 'video' ? 'video' : 'voice') !== type || Number(r.duration) !== dur) continue
        const d = Math.abs((Number(msg.createdAt) || 0) - ((Number(r.createdAt) || 0) + dur * 1000))
        if (d < bestDist) { record = r; bestDist = d }
      }
    }
  }
  if (!record) { window.toast?.('没有找到这次通话的内容'); return }
  const display = await getCallDisplayFor(record.ownerUid || window._wechatUid, record.charId)
  openCallRecordDetail(record.id, display?.name || '', record.ownerUid)
}
window.openCallRecordFromMessage = openCallRecordFromMessage

// 回到通话：还原之前的对话和计时，接着原来的进度聊
async function resumeCall(recordId) {
  if (_callState !== 'idle') { window.toast?.('正在通话中'); return }
  let record = null
  try { record = await db.callRecords.get(recordId) } catch (_) {}
  if (!record || !Array.isArray(record.messages) || !record.messages.length) {
    window.toast?.('这条通话没有可续接的内容')
    return
  }
  unlockCallAudioPlayback()

  const chatId = record.chatId
  const charId = record.charId
  const type = record.type === 'video' ? 'video' : 'voice'
  _callChatId = chatId
  _callCharId = charId
  _callType = type
  _callState = 'connecting'
  _callStartTime = null
  _callInitiator = record.initiator || 'user'
  _realCameraActive = false
  _realCameraStream = null
  _callResumeRecordId = record.id
  _callHistory = record.messages.map(m => ({
    role: m.role,
    content: m.content,
    scene: m.scene || undefined,
    speech: m.speech || undefined,
    timestamp: m.timestamp || Date.now()
  }))

  const helpers = h()
  const char = await helpers.getWechatDisplayCharacter?.(charId)
  if (!char) {
    window.toast?.('角色不存在')
    resetCallState()
    return
  }
  try {
    const autoCfg = await db.config.get('callAutoSpeak')
    _callAutoSpeak = autoCfg ? autoCfg.value !== false : true
  } catch (_) { _callAutoSpeak = true }

  const page = document.createElement('div')
  page.id = 'call-page'
  page.className = `full-page call-page ${type === 'video' ? 'video-call-page' : 'voice-call-page'}`
  page.dataset.chatId = chatId
  page.dataset.charId = charId
  page.innerHTML = type === 'video' ? buildVideoCallPageHTML(char) : buildVoiceCallPageHTML(char)
  window.openPage(page)
  bindCallEvents(page, type)

  // 把之前的对话气泡重新画出来（第一条是"发起了通话"的开场白，不显示）
  _callHistory.forEach((m, i) => {
    if (m.role === 'user') {
      if (i === 0) return
      appendCallUserBubble(page, m.content || '')
    } else if (m.role === 'assistant') {
      let scene = m.scene || ''
      let speech = m.speech || ''
      if (!scene && !speech && m.content) {
        try {
          const p = JSON.parse(m.content)
          scene = p.scene || ''
          speech = p.speech || ''
        } catch (_) { speech = m.content }
      }
      if (scene) updateCallScene(page, scene)
      if (speech) updateCallSpeech(page, speech)
    }
  })

  try {
    _callSystemPrompt = type === 'video'
      ? await buildVideoCallSystemPrompt(chatId, charId)
      : await buildVoiceCallSystemPrompt(chatId, charId)
    const userName = window._wechatUser?.name || '用户'
    _callResumeNote = `（系统提示：刚才的${type === 'video' ? '视频通话' : '通话'}意外中断了，现在${userName}重新接通了。请像真人一样自然地接上刚才的话题，不要重新开场，不要重复说过的话。）`

    // 计时接着原来的时长走
    _callState = 'connected'
    _callStartTime = Date.now() - Math.max(0, Number(record.duration) || 0) * 1000
    _callLastActivity = Date.now()
    startCallTimer(page)
    startCallIdleWatch()
    updateCallStatus(page, formatCallDuration())
    dispatchCallStateChange()
    saveCallDraft()
    await sendCallAIRequest(page)
  } catch (e) {
    console.error('回到通话失败', e)
    updateCallStatus(page, '连接失败')
    window.toast?.('回到通话失败：' + (e.message || '未知错误'))
  }
}
window.resumeCall = resumeCall
// ===== 结束通话 =====

async function endCall(opts = {}) {
  const chatId = _callChatId
  const charId = _callCharId
  const type = _callType
  const initiator = _callInitiator
  const resumeId = _callResumeRecordId
  // opts.endAt：闲置自动挂断时，时长只算到最后一次说话
  const endAt = (opts && typeof opts.endAt === 'number' && _callStartTime) ? opts.endAt : null
  const duration = endAt ? Math.max(0, Math.floor((endAt - _callStartTime) / 1000)) : getCallDurationSeconds()
  const durationStr = endAt
    ? `${String(Math.floor(duration / 60)).padStart(2, '0')}:${String(duration % 60).padStart(2, '0')}`
    : formatCallDuration()
  stopCallIdleWatch()
  const history = [..._callHistory]
  const startTime = _callStartTime || Date.now()

  stopCallAudio()
  if (_callTimerInterval) {
    clearInterval(_callTimerInterval)
    _callTimerInterval = null
  }

  const page = document.getElementById('call-page')
  if (page) stopRealCamera(page)

  if (_callMinimized) {
    _callMinimized = false
    if (page) page.classList.remove('is-minimized')
  }
  hideFloatingIndicator()

  resetCallState()
  dispatchCallStateChange()
  window.closePage('call-page')

  if (chatId && duration > 0) {
    const savedMessages = history.map(m => ({
      role: m.role,
      content: m.content,
      scene: m.scene || undefined,
      speech: m.speech || undefined,
      timestamp: m.timestamp || Date.now()
    }))

    // 续接的通话：合并回原记录，不新增
    let merged = false
    if (resumeId) {
      merged = await mergeResumedCall(resumeId, {
        chatId, charId, type, initiator, duration, messages: savedMessages, msgTime: Date.now()
      })
      if (merged) {
        try {
          const cw = document.querySelector(`.chat-window-page[data-chat-id="${chatId}"]`)
          if (cw && typeof refreshChat === 'function') refreshChat(cw, { scrollToBottom: false })
        } catch (_) {}
      }
    }

    if (!merged) {
      let callRecordId = null
      try {
        callRecordId = await db.callRecords.add({
          chatId,
          charId,
          ownerUid: window._wechatUid,
          type: type || 'voice',
          initiator,
          duration,
          messages: savedMessages,
          createdAt: startTime
        })
      } catch (e) {
        console.error('保存通话记录失败', e)
      }
      triggerCallMemory(chatId, charId, window._wechatUid, callRecordId)
      try {
        const typeLabel = type === 'video' ? '视频通话' : '语音通话'
        const msgRole = initiator === 'char' ? 'assistant' : 'user'
        await addPrivateMessageIdempotently({
          chatId,
          charId,
          role: msgRole,
          content: `[${typeLabel} ${durationStr}]`,
          ...(callRecordId ? { callRecordId } : {}),
          createdAt: Date.now()
        })
      } catch (e) {
        console.error('保存通话消息失败', e)
      }
    }
  }
  await clearCallDraft()
}

function resetCallState() {
  _callSessionId++
  stopCallIdleWatch()
  _callLastActivity = 0
  _callResumeRecordId = null
  _callResumeNote = ''
  cancelCallTTSRetry()
  _callTTSCanceledRetrySeqs = new Set()
  _callHistory = []
  _callSystemPrompt = ''
  _callState = 'idle'
  _callType = null
  _callStartTime = null
  _callChatId = null
  _callCharId = null
  _callAISending = false
  _callInitiator = 'user'
  _realCameraActive = false
  _realCameraFacingMode = 'user'
  _realCameraStream = null
  _callMinimized = false
  stopCallSpeechRecognition()
}

async function openCallRecordsPage(charId, ownerUid) {
  ownerUid = ownerUid || window._wechatUid
  if (!ownerUid || !charId) return

  const existing = document.getElementById('call-records-page')
  if (existing) existing.remove()

  const allRecords = await db.callRecords
    .where('charId').equals(charId)
    .filter(r => r.ownerUid === ownerUid)
    .toArray()
  const records = allRecords.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

  const display = await getCallDisplayFor(ownerUid, charId)
  const charName = display.name || ''

  const page = document.createElement('div')
  page.id = 'call-records-page'
  page.className = 'full-page call-records-page'
  page.innerHTML = buildCallRecordsPageHTML(charName, records)
  window.openPage(page)

  page.querySelector('#btn-call-records-back').addEventListener('click', () => {
    window.closePage('call-records-page')
  })

  page.querySelectorAll('.call-record-item').forEach(item => {
    item.addEventListener('click', () => {
      const recordId = parseInt(item.dataset.recordId, 10)
      openCallRecordDetail(recordId, charName, ownerUid)
    })
  })
}

function buildCallRecordsPageHTML(charName, records) {
  let listHTML = ''
  if (records.length === 0) {
    listHTML = '<div class="call-records-empty">暂无通话记录</div>'
  } else {
    listHTML = records.map(r => {
      const typeIcon = r.type === 'video' ? 'fa-video' : 'fa-phone'
      const typeLabel = r.type === 'video' ? '视频通话' : '语音通话'
      const mm = String(Math.floor(r.duration / 60)).padStart(2, '0')
      const ss = String(r.duration % 60).padStart(2, '0')
      const time = new Date(r.createdAt).toLocaleString('zh-CN', {
        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
      return `
        <div class="call-record-item" data-record-id="${r.id}">
          <div class="call-record-icon"><i class="fa-solid ${typeIcon}"></i></div>
          <div class="call-record-info">
            <div class="call-record-type">${callEscHtml(typeLabel)}</div>
            <div class="call-record-meta">${callEscHtml(time)} · ${mm}:${ss}</div>
          </div>
          <i class="fa fa-angle-right call-record-arrow"></i>
        </div>
      `
    }).join('')
  }

  return `
    <div class="page-header">
      <button class="header-back" id="btn-call-records-back"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">${callEscHtml(charName || '通话记录')}</span>
      <span class="header-spacer"></span>
    </div>
    <div class="call-records-list">${listHTML}</div>
  `
}

async function openCallRecordDetail(recordId, charName, ownerUid) {
  const record = await db.callRecords.get(recordId)
  if (!record) return
  ownerUid = ownerUid || record.ownerUid || window._wechatUid

  const existing = document.getElementById('call-record-detail-page')
  if (existing) existing.remove()

  const page = document.createElement('div')
  page.id = 'call-record-detail-page'
  page.className = 'full-page call-record-detail-page'

  const typeLabel = record.type === 'video' ? '视频通话' : '语音通话'
  const mm = String(Math.floor(record.duration / 60)).padStart(2, '0')
  const ss = String(record.duration % 60).padStart(2, '0')
  const time = new Date(record.createdAt).toLocaleString('zh-CN', {
    year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const user = ownerUid ? await db.characters.get(ownerUid) : null
  const userName = getCallUserBaseName(user)
  let messagesHTML = ''
  const callSpeechList = []
  for (const m of (record.messages || [])) {
    if (m.role === 'user') {
      const content = m.content || ''
      messagesHTML += `<div class="call-detail-msg call-detail-user"><span class="call-detail-sender">${callEscHtml(userName)}</span><span class="call-detail-text">${callEscHtml(content)}</span></div>`
    } else if (m.role === 'assistant') {
      let scene = m.scene || ''
      let speech = m.speech || ''
      if (!scene && !speech && m.content) {
        try {
          const parsed = JSON.parse(m.content)
          scene = parsed.scene || ''
          speech = parsed.speech || ''
        } catch (_) {
          speech = m.content
        }
      }
      if (scene) {
        messagesHTML += `<div class="call-detail-msg call-detail-scene"><span class="call-detail-scene-text">${callEscHtml(scene)}</span></div>`
      }
      if (speech) {
        const bilingualParsed = parseBilingualText(speech)
        const speechHTML = bilingualParsed.translation
          ? `<span class="call-detail-original">${callEscHtml(bilingualParsed.original)}</span><span class="call-detail-translation">${callEscHtml(bilingualParsed.translation)}</span>`
          : callEscHtml(speech)
        callSpeechList.push(bilingualParsed.original || speech)
        messagesHTML += `<div class="call-detail-msg call-detail-assistant"><span class="call-detail-sender">${callEscHtml(charName || '角色')}</span><span class="call-detail-text">${speechHTML}</span><button type="button" class="call-detail-speak" data-idx="${callSpeechList.length - 1}" title="朗读"><i class="fa-solid fa-volume-high"></i></button></div>`
      }
    }
  }
  if (!messagesHTML) messagesHTML = '<div class="call-records-empty">暂无通话内容</div>'

  page.innerHTML = `
    <div class="page-header">
      <button class="header-back" id="btn-call-detail-back"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">${callEscHtml(typeLabel)}</span>
      <span class="header-spacer"></span>
    </div>
    <div class="call-detail-header">
      <div class="call-detail-time">${callEscHtml(time)}</div>
      <div class="call-detail-duration">${callEscHtml(typeLabel)} · ${mm}:${ss}</div>
    </div>
       ${(record.messages || []).length ? `<div style="padding:12px 16px 0;"><button type="button" id="btn-call-resume" style="width:100%;padding:12px 0;border:none;border-radius:10px;background:var(--accent-color,#07c160);color:#fff;font-size:16px;"><i class="fa-solid ${record.type === 'video' ? 'fa-video' : 'fa-phone'}"></i> 回到通话</button></div>` : ''}
    <div class="call-detail-messages">${messagesHTML}</div>
  `

  window.openPage(page)
  page.querySelector('#btn-call-detail-back').addEventListener('click', () => {
    stopSpeakOnce()
    window.closePage('call-record-detail-page')
  })
    page.querySelector('#btn-call-resume')?.addEventListener('click', () => {
    if (_callState !== 'idle') { window.toast?.('正在通话中'); return }
    stopSpeakOnce()
    window.closePage('call-record-detail-page')
    if (document.getElementById('call-records-page')) window.closePage('call-records-page')
    setTimeout(() => resumeCall(record.id), 350)
  })
  page.querySelectorAll('.call-detail-speak').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = callSpeechList[parseInt(btn.dataset.idx, 10)]
      if (text) speakTextOnce(record.chatId, text, btn)
    })
  })
}

// ===== 全局入口 =====

window.startVoiceCall = function (chatId, charId, initiator) {
  startCall(chatId, charId, 'voice', initiator || 'user')
}

window.startVideoCall = function (chatId, charId, initiator) {
  startCall(chatId, charId, 'video', initiator || 'user')
}

window.openCallRecordsPage = openCallRecordsPage

window.isCallActiveWith = function(charId) {
  return _callState !== 'idle' && _callCharId === charId
}

window.isCallActive = function() {
  return _callState !== 'idle'
}

const _onlineFriendCreationLocks = new Map()

function normalizeOnlineWxAccount(value) {
  return String(value || '').trim().toLowerCase()
}

function getOnlineRemoteIdentity(profile) {
  const userId = String(profile?.userId || profile?.fromUserId || '').trim()
  const wxAccount = String(profile?.wxAccount || profile?.fromWxAccount || '').trim()
  return {
    userId,
    wxAccount,
    normalizedWxAccount: normalizeOnlineWxAccount(wxAccount),
    key: userId ? `user:${userId}` : `wx:${normalizeOnlineWxAccount(wxAccount)}`
  }
}

async function getOrCreateOnlineFriend(profile) {
  const remote = getOnlineRemoteIdentity(profile)
  if (!remote.wxAccount) throw new Error('联机用户缺少微信号')
  if (_onlineFriendCreationLocks.has(remote.key)) {
    return _onlineFriendCreationLocks.get(remote.key)
  }
  const task = getOrCreateOnlineFriendUnlocked(profile, remote)
  _onlineFriendCreationLocks.set(remote.key, task)
  try {
    return await task
  } finally {
    if (_onlineFriendCreationLocks.get(remote.key) === task) {
      _onlineFriendCreationLocks.delete(remote.key)
    }
  }
}

async function getOrCreateOnlineFriendUnlocked(profile, remote) {
  const wxAccount = remote.wxAccount
  const all = await db.characters.toArray()
  const onlineFriends = all.filter(char => char.type === 'online_friend')
  let friend = remote.userId
    ? onlineFriends.find(char => String(char.onlineData?.userId || '').trim() === remote.userId)
    : null
  if (!friend) {
    friend = onlineFriends.find(char =>
      normalizeOnlineWxAccount(char.onlineData?.wxAccount) === remote.normalizedWxAccount ||
      normalizeOnlineWxAccount(char.identity?.account) === remote.normalizedWxAccount
    )
  }
  const patch = {
    type: 'online_friend',
    name: profile?.name || profile?.fromName || friend?.name || wxAccount,
    nick: profile?.name || profile?.fromName || friend?.nick || '',
    avatar: profile?.avatar || profile?.fromAvatar || friend?.avatar || '',
    identity: {
      ...(friend?.identity || {}),
      account: wxAccount
    },
    onlineData: {
      ...(friend?.onlineData || {}),
      userId: remote.userId || friend?.onlineData?.userId || '',
      wxAccount,
      profileVersion: profile?.profileVersion || friend?.onlineData?.profileVersion || 1
    }
  }
  if (friend) {
    await db.characters.update(friend.id, patch)
    return { ...friend, ...patch, id: friend.id }
  }
  const id = await db.characters.add(patch)
  return { ...patch, id }
}

function loadOnlineAvatarImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('头像图片无法读取'))
    image.src = source
  })
}

function onlineAvatarDataBytes(dataUrl) {
  const base64 = String(dataUrl || '').split(',')[1] || ''
  return Math.ceil(base64.length * 3 / 4)
}

async function compressOnlineAvatar(source) {
  const value = String(source || '').trim()
  if (!value || /^https?:\/\//i.test(value)) return value
  if (!/^data:image\//i.test(value)) return ''
  try {
    const image = await loadOnlineAvatarImage(value)
    const maxSide = 256
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || 1, image.naturalHeight || 1))
    let width = Math.max(1, Math.round((image.naturalWidth || 1) * scale))
    let height = Math.max(1, Math.round((image.naturalHeight || 1) * scale))
    let quality = 0.86
    let result = ''
    for (let attempt = 0; attempt < 8; attempt++) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return ''
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(image, 0, 0, width, height)
      result = canvas.toDataURL('image/jpeg', quality)
      if (onlineAvatarDataBytes(result) <= 100 * 1024) return result
      if (quality > 0.5) quality -= 0.12
      else {
        width = Math.max(64, Math.round(width * 0.8))
        height = Math.max(64, Math.round(height * 0.8))
      }
    }
    return onlineAvatarDataBytes(result) <= 100 * 1024 ? result : ''
  } catch (err) {
    console.warn('[弯弯联机] 头像压缩失败:', err)
    return ''
  }
}

function normalizeIncomingOnlineExtra(extra) {
  if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return {}
  const blocked = new Set([
    'id', 'chatId', 'charId', 'role', 'createdAt',
    'clientMessageId', 'serverMessageId', 'remoteWxAccount',
    'isOnlineMessage', 'onlineStatus'
  ])
  const clean = {}
  Object.keys(extra).forEach(key => {
    if (!blocked.has(key)) clean[key] = extra[key]
  })
  return clean
}

async function receiveOnlinePrivateMessage(data) {
  if (!_wechatUid || !data?.fromWxAccount || !data?.serverMessageId) return
  const exists = await db.messages.where('serverMessageId').equals(data.serverMessageId).first()
  if (exists) {
    window.WanWanOnline?.sendDelivered(data.serverMessageId)
    return
  }
  const friend = await getOrCreateOnlineFriend(data)
  const friendIds = await getFriendIds(_wechatUid)
  if (!friendIds.includes(friend.id)) {
    friendIds.push(friend.id)
    await saveFriendIds(_wechatUid, friendIds)
  }
  const chat = await ensurePrivateChatRecord(friend.id)
  const currentChat = document.getElementById('chat-window')
  const isCurrent = !!currentChat && parseInt(currentChat.dataset.chatId) === chat.id
  await db.messages.add({
    chatId: chat.id,
    charId: friend.id,
    role: 'char',
    content: String(data.content || ''),
    createdAt: data.serverCreatedAt || Date.now(),
    isOnlineMessage: true,
    serverMessageId: data.serverMessageId,
    remoteWxAccount: data.fromWxAccount,
    messageType: data.messageType || 'text',
    onlineStatus: 'delivered',
    ...normalizeIncomingOnlineExtra(data.extra)
  })
  await db.chats.update(chat.id, {
    updatedAt: Date.now(),
    unread: isCurrent ? 0 : (chat.unread || 0) + 1
  })
  if (isCurrent) {
    await refreshChat(currentChat, { scrollToBottom: true })
  } else {
    await refreshVisibleWechatChatList({ showLoading: false })
    if (window.sendWanWanNotification) {
      window.sendWanWanNotification(String(data.content || '收到一条联机消息').slice(0, 120), {
        title: data.fromName || data.fromWxAccount,
        tag: `wanwan-online-${data.serverMessageId}`
      })
    }
  }
  window.WanWanOnline?.sendDelivered(data.serverMessageId)
}

async function refreshOnlineMessage(messageId) {
  const message = await db.messages.get(messageId)
  if (!message) return
  const currentChat = document.getElementById('chat-window')
  if (currentChat && parseInt(currentChat.dataset.chatId) === message.chatId) {
    await refreshChat(currentChat, { force: true })
  }
  await refreshVisibleWechatChatList({ showLoading: false })
}

async function handleOnlineFriendEvent(type, data) {
  const account = data?.wxAccount || data?.fromWxAccount
  if (!account || !_wechatUid) return
  const friend = await getOrCreateOnlineFriend(data)
  if (type === 'friend_added' || type === 'friend_accepted') {
    const ids = await getFriendIds(_wechatUid)
    if (!ids.includes(friend.id)) {
      ids.push(friend.id)
      await saveFriendIds(_wechatUid, ids)
    }
    await ensurePrivateChatRecord(friend.id)
    await refreshVisibleWechatChatList({ showLoading: false })
  }
}

window.WanWanWechatOnline = {
  getIdentity: async function() {
    return _wechatUser ? {
      uid: _wechatUid,
      wxAccount: _wechatUser.identity?.account || '',
      name: _wechatUser.nick || _wechatUser.name || '',
      avatar: await compressOnlineAvatar(await getWechatSelfAvatar())
    } : null
  },
  receivePrivateMessage: receiveOnlinePrivateMessage,
  messageChanged: refreshOnlineMessage,
  handleFriendEvent: handleOnlineFriendEvent,
  getOrCreateOnlineFriend
}

Object.defineProperty(window, '_wechatUid', { get() { return _wechatUid } })
window._wechatCallHelpers = {
  getChatHistoryLimit,
  getChatActiveReplySettings,
  setChatActiveReplyEnabled,
  buildUnifiedChatTimeline,
  buildWechatReplyContext,
  estimateWechatPromptContext,
  buildPromptContextEstimateHTML,
  buildPromptContextEstimateSummary,
  countPromptTextChars,
  joinPromptEstimateParts,
  getChatLorebookContext,
  getChatBilingualSettings,
  buildCurrentRelationText,
  callMinimaxTTS,
  callTTS,
  getChatVoiceId,
  getTTSTagHint,
  isTTSTagEnabled,
  getScheduleContext,
  getCharScheduleContext,
  speakTextOnce,
  blobUrlToDataUrl,
  getTimeOfDay,
  getWechatDisplayCharacter,
  getWechatDisplayAvatar,
  getWechatDisplayName,
  wcEscHtml,
  normalizeChatBilingualSettings,
  getChatBilingualLangLabel,
  getChatBilingualExample,
  parseBilingualText,
  buildWechatInitialAvatarHTML,
  buildCharacterAvatarHTML
}
