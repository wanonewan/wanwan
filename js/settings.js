// settings.js — 设置页完整功能（仿 Apple Settings 风格）
// 依赖：db.js, main.js 必须先加载

// ===== 设置页HTML模板 =====
var SETTINGS_HTML =
  '<div class="settings-scroll">' +
    '<div class="status-bar"></div>' +
    '<div class="settings-large-title" onclick="window.closePage(\'settings-page\')">' +
      '<span>设置</span>' +
    '</div>' +
    '<div class="setting-section account-card" id="account-card">' +
      '<div class="account-row clickable" id="row-account">' +
        '<div class="account-avatar" id="account-avatar">弯</div>' +
        '<div class="account-info">' +
          '<div class="account-name" id="account-name">弯弯</div>' +
          '<div class="account-sub" id="account-sub">Apple Account, iCloud, and more</div>' +
        '</div>' +
        '<i class="fa fa-angle-right row-chevron"></i>' +
      '</div>' +
    '</div>' +
    buildAboutSection() +
    buildNotifSection() +
    buildApiSection() +
    buildScheduleSection() +
    buildAppearanceSection() +
    buildOnlineSection() +
    buildDataSection() +
    '<div style="height:40px"></div>' +
  '</div>'

// ===== 关于本机区块HTML =====
function buildAboutSection() {
  return '<div class="setting-section" id="about-device-section">' +
    '<div class="list-row clickable" id="row-about-device">' +
      '<div class="row-icon-box"><i class="fa-solid fa-mobile-screen-button"></i></div>' +
      '<div class="row-body"><div class="row-label">关于本机</div></div>' +
      '<i class="fa fa-angle-right row-chevron"></i>' +
    '</div>' +
  '</div>'
}

// ===== 通知与保活区块HTML =====
function buildNotifSection() {
  return '<div class="setting-section">' +
    '<div class="list-row clickable" id="row-notification">' +
      '<div class="row-icon-box"><i class="fa fa-bell"></i></div>' +
      '<div class="row-body"><div class="row-label">通知</div></div>' +
      '<i class="fa fa-angle-right row-chevron"></i>' +
    '</div>' +
    '<div class="list-row" data-action="toggle">' +
      '<div class="row-icon-box"><i class="fa fa-bolt"></i></div>' +
      '<div class="row-body"><div class="row-label">强力保活</div></div>' +
      '<label class="toggle-wrap"><input type="checkbox" id="toggle-keepalive">' +
        '<div class="toggle-track"></div><div class="toggle-thumb"></div></label>' +
    '</div>' +
  '</div>'
}

// ===== API区块HTML（合并主副API） =====
function buildApiSection() {
  return '<div class="setting-section">' +
    '<div class="list-row clickable" id="row-api-config">' +
      '<div class="row-icon-box"><i class="fa fa-key"></i></div>' +
      '<div class="row-body"><div class="row-label">API 配置</div></div>' +
      '<span class="row-value" id="val-api-config">未配置</span>' +
      '<i class="fa fa-angle-right row-chevron"></i>' +
    '</div>' +
    '<div class="list-row clickable" id="row-minimax-config">' +
      '<div class="row-icon-box"><i class="fa-solid fa-microphone"></i></div>' +
      '<div class="row-body"><div class="row-label">Minimax 语音配置</div></div>' +
      '<span class="row-value" id="val-minimax-config">未配置</span>' +
      '<i class="fa fa-angle-right row-chevron"></i>' +
    '</div>' +
    '<div class="list-row clickable" id="row-fish-config">' +
      '<div class="row-icon-box"><i class="fa-solid fa-fish"></i></div>' +
      '<div class="row-body"><div class="row-label">Fish Audio 语音配置</div></div>' +
      '<span class="row-value" id="val-fish-config">未配置</span>' +
      '<i class="fa fa-angle-right row-chevron"></i>' +
    '</div>' +
    '<div class="list-row clickable" id="row-image-gen-config">' +
      '<div class="row-icon-box"><i class="fa-solid fa-image"></i></div>' +
      '<div class="row-body"><div class="row-label">IMAGE 图像配置</div></div>' +
      '<span class="row-value" id="val-image-gen-config">未配置</span>' +
      '<i class="fa fa-angle-right row-chevron"></i>' +
    '</div>' +
  '</div>'
}

// ===== Minimax语音配置 =====
var MINIMAX_MODELS = [
  'speech-2.8-hd', 'speech-2.8-turbo',
  'speech-2.6-hd', 'speech-2.6-turbo',
  'speech-02-hd', 'speech-02-turbo'
]

function openMinimaxConfigPage() {
  var modelOptions = MINIMAX_MODELS.map(function(m) {
    return '<option value="' + m + '">' + m + '</option>'
  }).join('')
  var html =
    '<div class="setting-section"><div class="api-form" id="minimax-form">' +
      '<label class="form-label">当前使用的语音服务</label>' +
      '<select class="input-field" id="tts-provider-select">' +
        '<option value="minimax">Minimax</option>' +
        '<option value="fish">Fish Audio</option>' +
      '</select>' +
      '<label class="form-label">API 版本</label>' +
      '<select class="input-field" id="minimax-version">' +
        '<option value="domestic">官方版（api.minimax.chat）</option>' +
        '<option value="international">国际版（api.minimaxi.chat）</option>' +
      '</select>' +
      '<label class="form-label">Group ID</label>' +
      '<input class="input-field" id="minimax-group-id" placeholder="输入 Group ID">' +
      '<label class="form-label">API Key</label>' +
      '<div class="input-with-toggle">' +
        '<input class="input-field" id="minimax-api-key" type="text" placeholder="输入 API Key">' +
        '<button class="btn-text-toggle" id="toggle-minimax-key-vis">隐藏</button>' +
      '</div>' +
      '<label class="form-label">语音模型</label>' +
      '<select class="input-field" id="minimax-model">' +
        '<option value="">选择模型...</option>' +
        modelOptions +
      '</select>' +
      '<div class="section-desc" style="padding:8px 0 0">' +
        '官方版适用于国内访问，国际版适用于海外访问。<br>' +
        'Group ID 和 API Key 可在 Minimax 开放平台获取。' +
      '</div>' +
      '<button class="btn-pill btn-full" id="btn-save-minimax">保存</button>' +
    '</div></div>'
  var page = buildSubPage('sub-minimax-config', 'Minimax 语音配置', html)
  openSubPage(page)
  initMinimaxConfigPage(page)
}

async function initMinimaxConfigPage(page) {
  var results = await Promise.all([
    db.config.get('minimaxVersion'),
    db.config.get('minimaxGroupId'),
    db.config.get('minimaxApiKey'),
    db.config.get('minimaxModel'),
    db.config.get('ttsProvider')
  ])
  var providerEl = page.querySelector('#tts-provider-select')
  if (providerEl) providerEl.value = (results[4] && results[4].value === 'fish') ? 'fish' : 'minimax'
  var versionEl = page.querySelector('#minimax-version')
  var groupIdEl = page.querySelector('#minimax-group-id')
  var apiKeyEl = page.querySelector('#minimax-api-key')
  var modelEl = page.querySelector('#minimax-model')
  if (versionEl && results[0]) versionEl.value = results[0].value || 'domestic'
  if (groupIdEl && results[1]) groupIdEl.value = results[1].value || ''
  if (apiKeyEl && results[2]) apiKeyEl.value = results[2].value || ''
  if (modelEl && results[3]) modelEl.value = results[3].value || ''
  bindKeyVisibilityText(page, 'toggle-minimax-key-vis', 'minimax-api-key')
  page.querySelector('#btn-save-minimax').addEventListener('click', async function() {
    var missing = findMissingSettingsFields([
      { el: versionEl, label: 'API 版本' },
      { el: groupIdEl, label: 'Group ID' },
      { el: apiKeyEl, label: 'API Key' },
      { el: modelEl, label: '语音模型' }
    ])
    if (showIncompleteSettingsSave(missing, 'Minimax 语音配置')) return
    try {
      await Promise.all([
        db.config.put({ key: 'minimaxVersion', value: versionEl.value }),
        db.config.put({ key: 'minimaxGroupId', value: groupIdEl.value.trim() }),
        db.config.put({ key: 'minimaxApiKey', value: apiKeyEl.value.trim() }),
        db.config.put({ key: 'minimaxModel', value: modelEl.value }),
        db.config.put({ key: 'ttsProvider', value: providerEl ? providerEl.value : 'minimax' })
      ])
      var settingsPage = document.getElementById('settings-page')
      if (settingsPage) await updateRowValues(settingsPage)
      window.toast('Minimax 语音配置已保存')
    } catch (error) {
      window.toast('Minimax 语音配置保存失败：' + (error.message || error))
    }
  })
}

// ===== 课表导入（ICS）=====
// 课表时间按下面这个时区的“墙上时间”理解（学校导出的 ICS 里是 +0800）。人在别的时区时改这里。
var SCHEDULE_TZ = 'Asia/Shanghai'
var SCHEDULE_TZ_OFFSET_HOURS = 8 // 仅用于把 ICS 里以 Z 结尾的 UTC 时间换算成课表时区
var SCHEDULE_KEY = 'userSchedule'
var SCHEDULE_WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
var ICS_DAY_CODES = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }
var ICS_DAY_NAMES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
var SCHEDULE_MAX_EVENTS = 800

function buildScheduleSection() {
  return '<div class="setting-section">' +
    '<div class="list-row clickable" id="row-schedule">' +
      '<div class="row-icon-box"><i class="fa-solid fa-calendar-days"></i></div>' +
      '<div class="row-body"><div class="row-label">课表导入</div></div>' +
      '<span class="row-value" id="val-schedule">未导入</span>' +
      '<i class="fa fa-angle-right row-chevron"></i>' +
    '</div>' +
  '</div>'
}

function schedDayMs(day) {
  var m = String(day).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN
}
function schedFmtDay(ms) { return new Date(ms).toISOString().slice(0, 10) }
function schedDow(ms) { return new Date(ms).getUTCDay() }
function schedAddDays(day, n) { return schedFmtDay(schedDayMs(day) + n * 86400000) }
function schedEsc(t) {
  return String(t == null ? '' : t).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  })
}

function icsSplitProp(line) {
  var inQuote = false
  for (var i = 0; i < line.length; i++) {
    var ch = line.charAt(i)
    if (ch === '"') inQuote = !inQuote
    else if (ch === ':' && !inQuote) return [line.slice(0, i), line.slice(i + 1)]
  }
  return null
}

function icsText(v) {
  return String(v || '').replace(/\\[nN]/g, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim()
}

function icsParseDT(v) {
  var m = String(v || '').trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/)
  if (!m) return null
  var y = +m[1], mo = +m[2], d = +m[3]
  var hh = m[4] ? +m[4] : 0, mi = m[5] ? +m[5] : 0
  if (m[7] === 'Z') {
    var ms = Date.UTC(y, mo - 1, d, hh, mi) + SCHEDULE_TZ_OFFSET_HOURS * 3600000
    var dt = new Date(ms)
    return {
      date: dt.toISOString().slice(0, 10),
      time: ('0' + dt.getUTCHours()).slice(-2) + ':' + ('0' + dt.getUTCMinutes()).slice(-2),
      allDay: false
    }
  }
  return {
    date: m[1] + '-' + m[2] + '-' + m[3],
    time: ('0' + hh).slice(-2) + ':' + ('0' + mi).slice(-2),
    allDay: !m[4]
  }
}

// 解析 ICS 文本（兼容只用 \r 换行的文件，比如 Outlook 导出的）
function parseICS(text) {
  var lines = String(text || '').replace(/\r\n|\r|\n/g, '\n').replace(/\n[ \t]/g, '').split('\n')
  var events = []
  var cur = null
  lines.forEach(function(raw) {
    var line = raw.trim()
    if (line === 'BEGIN:VEVENT') { cur = { exdates: {} }; return }
    if (line === 'END:VEVENT') { if (cur) events.push(cur); cur = null; return }
    if (!cur) return
    var kv = icsSplitProp(line)
    if (!kv) return
    var name = kv[0].split(';')[0].toUpperCase()
    var value = kv[1]
    if (name === 'SUMMARY') cur.summary = icsText(value)
    else if (name === 'LOCATION') cur.location = icsText(value)
    else if (name === 'UID') cur.uid = value.trim()
    else if (name === 'DTSTART') cur.dtstart = icsParseDT(value)
    else if (name === 'DTEND') cur.dtend = icsParseDT(value)
    else if (name === 'RRULE') {
      var rule = {}
      value.split(';').forEach(function(part) {
        var i = part.indexOf('=')
        if (i > 0) rule[part.slice(0, i).toUpperCase()] = part.slice(i + 1)
      })
      cur.rrule = rule
    } else if (name === 'EXDATE') {
      value.split(',').forEach(function(v) {
        var d = icsParseDT(v)
        if (d) cur.exdates[d.date] = true
      })
    }
  })
  return events
}

// 把一个（可能带重复规则的）事件展开成具体日期，和教程里“按具体日期存”的做法一致
function icsExpandEvent(ev) {
  var out = []
  var start = ev.dtstart
  var end = ev.dtend
  if (!start || start.allDay || !ev.summary) return out
  var endTime = end ? (end.date === start.date ? end.time : '23:59') : start.time
  if (endTime <= start.time) endTime = '23:59'
  var uid = ev.uid || (ev.summary + '|' + start.date + '|' + start.time)
  function push(day) {
    if (ev.exdates[day]) return
    out.push({ uid: uid, date: day, start: start.time, end: endTime, name: ev.summary, location: ev.location || '' })
  }
  var rule = ev.rrule
  var startMs = schedDayMs(start.date)
  if (!rule) { push(start.date); return out }

  var freq = rule.FREQ
  var interval = Math.max(1, parseInt(rule.INTERVAL || '1', 10) || 1)
  var count = rule.COUNT ? parseInt(rule.COUNT, 10) : 0
  var until = rule.UNTIL ? icsParseDT(rule.UNTIL) : null
  var untilMs = until ? schedDayMs(until.date) : 0
  var hardEnd = startMs + 2 * 366 * 86400000 // 既没有 COUNT 也没有 UNTIL 时最多展开两年
  function ok(ms) { return !(untilMs && ms > untilMs) && ms <= hardEnd }
  var n = 0

  if (freq === 'DAILY') {
    for (var ms = startMs; ok(ms) && (!count || n < count) && n < 800; ms += interval * 86400000) {
      push(schedFmtDay(ms)); n++
    }
  } else if (freq === 'WEEKLY') {
    var days = (rule.BYDAY ? rule.BYDAY.split(',') : [ICS_DAY_NAMES[schedDow(startMs)]])
      .map(function(d) { return ICS_DAY_CODES[d.replace(/^[+-]?\d+/, '')] })
      .filter(function(d) { return d !== undefined })
    days.sort(function(a, b) { return ((a + 6) % 7) - ((b + 6) % 7) })
    var weekStart = startMs - ((schedDow(startMs) + 6) % 7) * 86400000 // 周一
    for (var w = 0; w < 400; w++) {
      var wk = weekStart + w * interval * 7 * 86400000
      var stop = false
      for (var i = 0; i < days.length; i++) {
        var dms = wk + ((days[i] + 6) % 7) * 86400000
        if (dms < startMs) continue
        if (!ok(dms) || (count && n >= count)) { stop = true; break }
        push(schedFmtDay(dms)); n++
      }
      if (stop) break
    }
  } else {
    push(start.date) // 每月 / 每年等少见规则只取第一次
  }
  return out
}

function scheduleFromICSTexts(texts) {
  var all = []
  texts.forEach(function(t) {
    parseICS(t).forEach(function(ev) { icsExpandEvent(ev).forEach(function(e) { all.push(e) }) })
  })
  var seen = {}
  return all.filter(function(e) {
    var k = e.date + '|' + e.start + '|' + e.name
    if (seen[k]) return false
    seen[k] = true
    return true
  }).sort(function(a, b) { return (a.date + a.start).localeCompare(b.date + b.start) })
}

// 按课程名汇总，用来预览和展示
function scheduleSummarize(events) {
  var groups = {}
  var order = []
  events.forEach(function(e) {
    var g = groups[e.name]
    if (!g) { g = groups[e.name] = { name: e.name, dows: {}, times: {}, locs: {}, count: 0, first: e.date, last: e.date }; order.push(e.name) }
    g.count++
    g.dows[schedDow(schedDayMs(e.date))] = true
    g.times[e.start + '–' + e.end] = true
    if (e.location) g.locs[e.location] = true
    if (e.date < g.first) g.first = e.date
    if (e.date > g.last) g.last = e.date
  })
  return order.map(function(name) {
    var g = groups[name]
    return {
      name: g.name,
      weekdays: Object.keys(g.dows).map(Number).sort().map(function(d) { return '周' + SCHEDULE_WEEKDAYS[d] }).join('、'),
      times: Object.keys(g.times).join(' / '),
      locations: Object.keys(g.locs).join(' / '),
      count: g.count, first: g.first, last: g.last
    }
  })
}

function scheduleSummaryHTML(events) {
  var list = scheduleSummarize(events)
  if (!list.length) return '<div style="color:var(--c-hint);font-size:13px;padding:8px 0">没有读到课程</div>'
  return list.map(function(g) {
    return '<div style="padding:10px 0;border-top:1px solid var(--c-border)">' +
      '<div style="font-size:14px;font-weight:600;color:var(--c-text);word-break:break-word">' + schedEsc(g.name) + '</div>' +
      '<div style="font-size:12px;color:var(--c-sub);margin-top:3px">' + schedEsc(g.weekdays) + ' ' + schedEsc(g.times) +
        (g.locations ? ' · ' + schedEsc(g.locations) : '') + '</div>' +
      '<div style="font-size:12px;color:var(--c-hint);margin-top:2px">共 ' + g.count + ' 次 · ' + g.first + ' 至 ' + g.last + '</div>' +
    '</div>'
  }).join('')
}

async function scheduleLoad() {
  var rec = await db.config.get(SCHEDULE_KEY)
  var v = rec && rec.value
  return (v && Array.isArray(v.events)) ? v : { enabled: true, events: [] }
}
async function scheduleSave(data) {
  await db.config.put({ key: SCHEDULE_KEY, value: data })
}

function openSchedulePage() {
  var html =
    '<div class="setting-section"><div class="api-form">' +
      '<div class="section-desc" style="padding:0 0 10px">' +
        '从学校教务系统导出的课表 .ics 文件导入，可以一次选多个文件。导入后，聊天和通话时角色会知道你“按课表今天/明天有什么课”。课表只当作计划，角色不会断言你真的在教室。' +
      '</div>' +
      '<input type="file" id="sched-file" accept=".ics,.ICS,text/calendar" multiple style="display:none">' +
      '<button class="btn-pill btn-full" id="btn-sched-pick">选择 ICS 文件</button>' +
      '<div id="sched-preview"></div>' +
      '<button class="btn-pill btn-full" id="btn-sched-import" style="margin-top:10px;display:none">确认导入</button>' +
    '</div></div>' +
    '<div class="setting-section">' +
      '<div class="list-row" data-action="toggle">' +
        '<div class="row-icon-box"><i class="fa-solid fa-bell-concierge"></i></div>' +
        '<div class="row-body"><div class="row-label">让角色知道我的课表</div></div>' +
        '<label class="toggle-wrap"><input type="checkbox" id="toggle-sched">' +
          '<div class="toggle-track"></div><div class="toggle-thumb"></div></label>' +
      '</div>' +
    '</div>' +
    '<div class="setting-section"><div class="api-form">' +
      '<div class="form-label" id="sched-saved-title">已导入的课程</div>' +
      '<div id="sched-saved"></div>' +
      '<button class="btn-pill btn-full" id="btn-sched-clear" style="margin-top:10px;display:none">清空课表</button>' +
    '</div></div>'
  var page = buildSubPage('sub-schedule', '课表导入', html)
  openSubPage(page)
  initSchedulePage(page)
}

async function initSchedulePage(page) {
  var fileEl = page.querySelector('#sched-file')
  var previewEl = page.querySelector('#sched-preview')
  var importBtn = page.querySelector('#btn-sched-import')
  var savedEl = page.querySelector('#sched-saved')
  var clearBtn = page.querySelector('#btn-sched-clear')
  var toggle = page.querySelector('#toggle-sched')
  var pending = null

  async function refreshSaved() {
    var data = await scheduleLoad()
    toggle.checked = data.enabled !== false
    if (data.events.length) {
      savedEl.innerHTML = scheduleSummaryHTML(data.events)
      clearBtn.style.display = ''
    } else {
      savedEl.innerHTML = '<div style="color:var(--c-hint);font-size:13px;padding:6px 0">还没有导入课表</div>'
      clearBtn.style.display = 'none'
    }
    var settingsPage = document.getElementById('settings-page')
    if (settingsPage) updateRowValues(settingsPage)
  }
  await refreshSaved()

  page.querySelector('#btn-sched-pick').addEventListener('click', function() { fileEl.click() })

  fileEl.addEventListener('change', async function() {
    var files = Array.prototype.slice.call(fileEl.files || [])
    fileEl.value = ''
    if (!files.length) return
    try {
      var texts = await Promise.all(files.map(function(f) { return f.text() }))
      var events = scheduleFromICSTexts(texts)
      if (!events.length) {
        pending = null
        previewEl.innerHTML = '<div style="color:var(--c-hint);font-size:13px;padding:10px 0">没有读到课程。请确认选的是学校导出的 .ics 课表文件。</div>'
        importBtn.style.display = 'none'
        return
      }
      pending = events
      previewEl.innerHTML =
        '<div style="font-size:13px;color:var(--c-sub);padding:12px 0 2px">识别结果（共 ' + events.length + ' 节，确认无误再点下面的按钮）</div>' +
        scheduleSummaryHTML(events)
      importBtn.style.display = ''
    } catch (e) {
      window.toast('读取课表失败：' + (e.message || e))
    }
  })

  importBtn.addEventListener('click', async function() {
    if (!pending) return
    try {
      var data = await scheduleLoad()
      var newUids = {}
      pending.forEach(function(e) { newUids[e.uid] = true })
      // 同一门课（相同 UID）重新导入时，用新的覆盖旧的
      var kept = data.events.filter(function(e) { return !newUids[e.uid] })
      var merged = kept.concat(pending).sort(function(a, b) { return (a.date + a.start).localeCompare(b.date + b.start) })
      if (merged.length > SCHEDULE_MAX_EVENTS) merged = merged.slice(merged.length - SCHEDULE_MAX_EVENTS)
      data.events = merged
      data.importedAt = Date.now()
      await scheduleSave(data)
      var n = pending.length
      pending = null
      previewEl.innerHTML = ''
      importBtn.style.display = 'none'
      await refreshSaved()
      window.toast('已导入 ' + n + ' 节课')
    } catch (e) {
      window.toast('导入失败：' + (e.message || e))
    }
  })

  toggle.addEventListener('change', async function() {
    var data = await scheduleLoad()
    data.enabled = toggle.checked
    await scheduleSave(data)
  })

  clearBtn.addEventListener('click', async function() {
    if (!confirm('确定清空所有已导入的课表吗？')) return
    await scheduleSave({ enabled: toggle.checked, events: [] })
    await refreshSaved()
    window.toast('课表已清空')
  })
}

// ===== 注入聊天的课表上下文：每轮只放“今天”，18:00 以后再加“明天” =====
function scheduleNow() {
  var parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SCHEDULE_TZ, year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
  }).formatToParts(new Date())
  var o = {}
  parts.forEach(function(p) { o[p.type] = p.value })
  function p2(x) { return ('0' + x).slice(-2) }
  return { date: o.year + '-' + p2(o.month) + '-' + p2(o.day), time: p2(o.hour) + ':' + p2(o.minute) }
}

function scheduleLines(events, day, nowTime) {
  var list = events.filter(function(e) { return e.date === day }).sort(function(a, b) { return a.start.localeCompare(b.start) })
  if (!list.length) return '- 没有排课'
  return list.map(function(e) {
    var status = ''
    if (nowTime) status = nowTime < e.start ? '（稍后）' : (nowTime < e.end ? '（按计划正在进行）' : '（已结束）')
    return '- ' + e.start + '–' + e.end + ' ' + e.name + (e.location ? '｜' + e.location : '') + status
  }).join('\n')
}

window.ScheduleCtx = {
  build: async function() {
    try {
      var data = await scheduleLoad()
      if (data.enabled === false || !data.events.length) return ''
      var now = scheduleNow()
      var last = data.events.reduce(function(m, e) { return e.date > m ? e.date : m }, '')
      if (last < schedAddDays(now.date, -7)) return '' // 学期已经结束一周以上，不再注入
      var weekday = function(day) { return '周' + SCHEDULE_WEEKDAYS[schedDow(schedDayMs(day))] }
      var text = '【课表（用户导入的课程表，只是计划，不代表用户实际到课）】\n' +
        '今天 ' + now.date + '（' + weekday(now.date) + '），现在 ' + now.time + '：\n' +
        scheduleLines(data.events, now.date, now.time)
      if (Number(now.time.slice(0, 2)) >= 18) {
        var tomorrow = schedAddDays(now.date, 1)
        text += '\n明天 ' + tomorrow + '（' + weekday(tomorrow) + '）：\n' + scheduleLines(data.events, tomorrow, '')
      }
      text += '\n使用方式：只在话题合适时自然提及，不要每句话都说课表；用“按课表/按计划”的说法，不要断言用户此刻真的在教室或已经到课；如果用户说停课、请假或没去，以用户说的为准。'
      return text
    } catch (e) {
      return ''
    }
  }
}

// ===== Fish Audio 语音配置 =====
var FISH_DEFAULT_BASE = 'https://api.fish.audio'
var FISH_MODELS = [
  { value: 's2.1-pro-free', label: 's2.1-pro-free（免费体验）' },
  { value: 's2.1-pro', label: 's2.1-pro' },
  { value: 's2-pro', label: 's2-pro' }
]

function openFishConfigPage() {
  var modelOptions = FISH_MODELS.map(function(m) {
    return '<option value="' + m.value + '">' + m.label + '</option>'
  }).join('')
  var html =
    '<div class="setting-section"><div class="api-form" id="fish-form">' +
      '<label class="form-label">当前使用的语音服务</label>' +
      '<select class="input-field" id="tts-provider-select">' +
        '<option value="minimax">Minimax</option>' +
        '<option value="fish">Fish Audio</option>' +
      '</select>' +
      '<label class="form-label">站点（API 地址）</label>' +
      '<input class="input-field" id="fish-base-url" placeholder="' + FISH_DEFAULT_BASE + '">' +
      '<label class="form-label">API Key</label>' +
      '<div class="input-with-toggle">' +
        '<input class="input-field" id="fish-api-key" type="text" placeholder="输入 Fish Audio API Key">' +
        '<button class="btn-text-toggle" id="toggle-fish-key-vis">隐藏</button>' +
      '</div>' +
      '<label class="form-label">语音模型</label>' +
      '<select class="input-field" id="fish-model">' +
        '<option value="">选择模型...</option>' +
        modelOptions +
      '</select>' +
      '<div class="section-desc" style="padding:8px 0 0">' +
        '站点默认是官方地址 ' + FISH_DEFAULT_BASE + '，如果以后自己搭了转发地址可以改这里。<br>' +
        '音色 ID 在「聊天设置 → 语音克隆」里按角色设置，可以直接搜索音色。<br>' +
        '访问 Fish 需要开 VPN。' +
      '</div>' +
      '<button class="btn-pill btn-full" id="btn-save-fish">保存</button>' +
      '<button class="btn-pill btn-full" id="btn-test-fish" style="margin-top:10px">测试连接（查询余额）</button>' +
    '</div></div>'
  var page = buildSubPage('sub-fish-config', 'Fish Audio 语音配置', html)
  openSubPage(page)
  initFishConfigPage(page)
}

async function initFishConfigPage(page) {
  var results = await Promise.all([
    db.config.get('fishBaseUrl'),
    db.config.get('fishApiKey'),
    db.config.get('fishModel'),
    db.config.get('ttsProvider')
  ])
  var providerEl = page.querySelector('#tts-provider-select')
  var baseEl = page.querySelector('#fish-base-url')
  var apiKeyEl = page.querySelector('#fish-api-key')
  var modelEl = page.querySelector('#fish-model')
  if (providerEl) providerEl.value = (results[3] && results[3].value === 'fish') ? 'fish' : 'minimax'
  if (baseEl) baseEl.value = (results[0] && results[0].value) || FISH_DEFAULT_BASE
  if (apiKeyEl && results[1]) apiKeyEl.value = results[1].value || ''
  if (modelEl && results[2]) modelEl.value = results[2].value || ''
  bindKeyVisibilityText(page, 'toggle-fish-key-vis', 'fish-api-key')

  page.querySelector('#btn-save-fish').addEventListener('click', async function() {
    var missing = findMissingSettingsFields([
      { el: baseEl, label: '站点' },
      { el: apiKeyEl, label: 'API Key' },
      { el: modelEl, label: '语音模型' }
    ])
    if (showIncompleteSettingsSave(missing, 'Fish Audio 语音配置')) return
    try {
      await Promise.all([
        db.config.put({ key: 'fishBaseUrl', value: baseEl.value.trim().replace(/\/+$/, '') }),
        db.config.put({ key: 'fishApiKey', value: apiKeyEl.value.trim() }),
        db.config.put({ key: 'fishModel', value: modelEl.value }),
        db.config.put({ key: 'ttsProvider', value: providerEl ? providerEl.value : 'minimax' })
      ])
      var settingsPage = document.getElementById('settings-page')
      if (settingsPage) await updateRowValues(settingsPage)
      window.toast('Fish Audio 语音配置已保存')
    } catch (error) {
      window.toast('Fish Audio 语音配置保存失败：' + (error.message || error))
    }
  })

  // 测试连接：只查询余额，不会生成语音
  page.querySelector('#btn-test-fish').addEventListener('click', async function() {
    var base = (baseEl.value.trim() || FISH_DEFAULT_BASE).replace(/\/+$/, '')
    var key = apiKeyEl.value.trim()
    if (!key) { window.toast('请先填写 API Key'); return }
    window.toast('正在测试连接…')
    try {
      var res = await fetch(base + '/wallet/self/api-credit', {
        headers: { 'Authorization': 'Bearer ' + key }
      })
      if (!res.ok) {
        var detail = ''
        try { var j = await res.json(); detail = j.message || '' } catch (_) {}
        window.toast('连接失败 HTTP ' + res.status + (detail ? '：' + detail : ''))
        return
      }
      var data = await res.json()
      window.toast('连接成功，余额：' + (data.credit != null ? data.credit : '未知'))
    } catch (error) {
      window.toast('网络请求失败：可能没开 VPN，或浏览器被跨域（CORS）拦截')
    }
  })
}

function findMissingSettingsFields(fields) {
  return fields.filter(function(field) {
    return !field.el || !String(field.el.value == null ? '' : field.el.value).trim()
  })
}

function showIncompleteSettingsSave(missing, configName) {
  if (!missing.length) return false
  window.toast((configName || '配置') + '保存失败，请填写：' + missing.map(function(field) { return field.label }).join('、'))
  if (missing[0].el && missing[0].el.focus) missing[0].el.focus()
  return true
}

// ===== IMAGE 图像配置 =====
var IMAGE_GEN_MODELS = [
  'gpt-image-1',
  'gemini-2.5-flash-image',
  'imagen-4.0-generate-001'
]

var IMAGE_GEN_SIZES = [
  '1024x1024', '1024x1536', '1536x1024',
  '1792x1024', '1024x1792', '512x512'
]

function openImageGenConfigPage() {
  var modelOptions = IMAGE_GEN_MODELS.map(function(m) {
    return '<option value="' + settingsEscHtml(m) + '">' + settingsEscHtml(m) + '</option>'
  }).join('')
  var sizeOptions = IMAGE_GEN_SIZES.map(function(s) {
    return '<option value="' + settingsEscHtml(s) + '">' + settingsEscHtml(s) + '</option>'
  }).join('')
  var html =
    '<div class="setting-section"><div class="api-form" id="image-gen-form">' +
      '<label class="form-label">API URL</label>' +
      '<input class="input-field" id="image-gen-api-url" placeholder="https://api.openai.com/v1 或 .../chat/completions">' +
      '<label class="form-label">API Key</label>' +
      '<div class="input-with-toggle">' +
        '<input class="input-field" id="image-gen-api-key" type="text" placeholder="sk-...">' +
        '<button class="btn-text-toggle" id="toggle-image-gen-key-vis">隐藏</button>' +
      '</div>' +
      '<label class="form-label">图片模型</label>' +
      '<input class="input-field" id="image-gen-model-input" placeholder="手动输入模型名，例如 gpt-image-1">' +
      '<div class="model-row">' +
        '<select class="input-field" id="image-gen-model"><option value="">选择常用模型</option>' + modelOptions + '</select>' +
        '<button class="btn-ghost btn-sm" id="btn-load-image-gen-models">获取</button>' +
      '</div>' +
      '<label class="form-label">默认尺寸</label>' +
      '<select class="input-field" id="image-gen-size">' +
        sizeOptions +
      '</select>' +
      '<button class="btn-pill btn-full" id="btn-save-image-gen">保存</button>' +
    '</div></div>'
  var page = buildSubPage('sub-image-gen-config', 'IMAGE 图像配置', html)
  openSubPage(page)
  initImageGenConfigPage(page)
}

async function initImageGenConfigPage(page) {
  var cfg = await loadImageGenConfig(true)
  var urlEl = page.querySelector('#image-gen-api-url')
  var keyEl = page.querySelector('#image-gen-api-key')
  var modelInputEl = page.querySelector('#image-gen-model-input')
  var modelEl = page.querySelector('#image-gen-model')
  var sizeEl = page.querySelector('#image-gen-size')
  if (urlEl) urlEl.value = cfg.url || ''
  if (keyEl) keyEl.value = cfg.key || ''
  if (modelInputEl) modelInputEl.value = cfg.model || ''
  if (modelEl) {
    syncModelSelectOption(page, 'image-gen', cfg.model)
    modelEl.addEventListener('change', function() {
      if (modelEl.value && modelInputEl) modelInputEl.value = modelEl.value
    })
  }
  if (sizeEl) {
    if (cfg.size && !Array.prototype.some.call(sizeEl.options, function(opt) { return opt.value === cfg.size })) {
      var opt = document.createElement('option')
      opt.value = cfg.size
      opt.textContent = cfg.size
      sizeEl.appendChild(opt)
    }
    sizeEl.value = cfg.size || '1024x1024'
  }
  bindKeyVisibilityText(page, 'toggle-image-gen-key-vis', 'image-gen-api-key')
  page.querySelector('#btn-load-image-gen-models').addEventListener('click', function() { loadImageGenModelList(page) })
  page.querySelector('#btn-save-image-gen').addEventListener('click', function() { saveImageGenConfig(page) })
}

// ===== 字体 + 壁纸合并区块HTML =====
function buildAppearanceSection() {
  return '<div class="setting-section">' +
    '<div class="list-row" data-action="toggle">' +
      '<div class="row-icon-box"><i class="fa-solid fa-moon"></i></div>' +
      '<div class="row-body"><div class="row-label">暗夜模式</div></div>' +
      '<label class="toggle-wrap"><input type="checkbox" id="toggle-dark-mode">' +
        '<div class="toggle-track"></div><div class="toggle-thumb"></div></label>' +
    '</div>' +
    '<div class="list-row clickable" id="row-font">' +
      '<div class="row-icon-box"><i class="fa fa-font"></i></div>' +
      '<div class="row-body"><div class="row-label">字体</div></div>' +
      '<i class="fa fa-angle-right row-chevron"></i>' +
    '</div>' +
    '<div class="list-row clickable" id="row-wallpaper">' +
      '<div class="row-icon-box"><i class="fa-solid fa-panorama"></i></div>' +
      '<div class="row-body"><div class="row-label">壁纸</div></div>' +
      '<i class="fa fa-angle-right row-chevron"></i>' +
    '</div>' +
    '<div class="list-row clickable" id="row-floating-ball">' +
      '<div class="row-icon-box"><i class="fa-solid fa-crosshairs"></i></div>' +
      '<div class="row-body"><div class="row-label">悬浮球</div></div>' +
      '<i class="fa fa-angle-right row-chevron"></i>' +
    '</div>' +
  '</div>'
}

function applyDarkMode(enabled) {
  var root = document.documentElement
  root.classList.toggle('theme-dark', !!enabled)
  root.style.colorScheme = enabled ? 'dark' : 'light'
  var meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', enabled ? '#0f0f10' : '#ffffff')
}

async function initDarkModeSection(page) {
  var toggle = page.querySelector('#toggle-dark-mode')
  var cfg = await db.config.get('darkModeEnabled')
  var enabled = !!(cfg && cfg.value)
  applyDarkMode(enabled)
  if (toggle) {
    toggle.checked = enabled
    toggle.addEventListener('change', async function() {
      await db.config.put({ key: 'darkModeEnabled', value: toggle.checked })
      applyDarkMode(toggle.checked)
      window.toast(toggle.checked ? '已开启暗夜模式' : '已关闭暗夜模式')
    })
  }
}

// ===== 联机设置区块HTML =====
function buildOnlineSection() {
  return '<div class="setting-section">' +
    '<div class="list-row" data-action="toggle">' +
      '<div class="row-icon-box"><i class="fa-solid fa-users"></i></div>' +
      '<div class="row-body"><div class="row-label">启用联机</div></div>' +
      '<label class="toggle-wrap"><input type="checkbox" id="toggle-online">' +
        '<div class="toggle-track"></div><div class="toggle-thumb"></div></label>' +
    '</div>' +
    '<div class="list-row clickable" id="row-online-config">' +
      '<div class="row-icon-box"><i class="fa fa-server"></i></div>' +
      '<div class="row-body"><div class="row-label">联机配置</div></div>' +
      '<i class="fa fa-angle-right row-chevron"></i>' +
    '</div>' +
    '<div class="list-row">' +
      '<div class="row-icon-box"><i class="fa-solid fa-tower-broadcast"></i></div>' +
      '<div class="row-body"><div class="row-label">联机状态</div></div>' +
      '<span class="row-value" id="val-online-state">未启用</span>' +
    '</div>' +
  '</div>'
}

// ===== 数据管理区块HTML =====
function buildDataSection() {
  return '<div class="setting-section" id="data-section">' +
    '<div class="list-row clickable" id="row-data-manage">' +
      '<div class="row-icon-box"><i class="fa-solid fa-cloud-arrow-down"></i></div>' +
      '<div class="row-body"><div class="row-label">数据管理</div></div>' +
      '<i class="fa fa-angle-right row-chevron"></i>' +
    '</div>' +
  '</div>'
}

// ===== 设置页入口（由桌面Dock调用） =====
window.showSettingsPage = function() {
  var page = buildSettingsPage()
  window.openPage(page)
  loadSettingsValues(page)
}

// ===== 构建设置页DOM =====
function buildSettingsPage() {
  var page = document.createElement('div')
  page.id = 'settings-page'
  page.className = 'full-page'
  page.innerHTML = SETTINGS_HTML
  return page
}

// ===== 通用子页面构建器 =====
function buildSubPage(id, title, contentHTML) {
  var page = document.createElement('div')
  page.id = id
  page.className = 'full-page sub-page'
  page.innerHTML =
    '<div class="page-header">' +
      '<button class="header-back" onclick="window.closePage(\'' + id + '\')">' +
        '<i class="fa fa-angle-left"></i>' +
      '</button>' +
      '<span class="header-title">' + title + '</span>' +
    '</div>' +
    '<div class="settings-scroll">' + contentHTML + '</div>'
  return page
}

// ===== 打开子页面（从右滑入） =====
function openSubPage(pageEl) {
  pageEl.style.transform = 'translateX(100%)'
  document.getElementById('app').appendChild(pageEl)
  requestAnimationFrame(function() {
    pageEl.style.transition = 'transform 0.3s var(--ease)'
    pageEl.style.transform = 'translateX(0)'
  })
}

// ===== 通知子页面 =====
function openNotificationPage() {
  var html =
    '<div class="setting-section">' +
      '<div class="list-row" data-action="toggle">' +
        '<div class="row-icon-box"><i class="fa fa-bell"></i></div>' +
        '<div class="row-body"><div class="row-label">开启通知</div></div>' +
        '<label class="toggle-wrap"><input type="checkbox" id="toggle-notif">' +
          '<div class="toggle-track"></div><div class="toggle-thumb"></div></label>' +
      '</div>' +
      '<div class="list-row clickable" id="row-test-notification">' +
        '<div class="row-icon-box"><i class="fa-solid fa-mobile"></i></div>' +
        '<div class="row-body"><div class="row-label">测试通知</div></div>' +
      '</div>' +
    '</div>'
  var page = buildSubPage('sub-notification', '通知', html)
  openSubPage(page)
  initNotifSection(page)
}

// ===== 通知功能 =====
async function initNotifSection(page) {
  var toggle = page.querySelector('#toggle-notif')
  var testRow = page.querySelector('#row-test-notification')
  var updateStatus = async function() {
    if (!toggle) return
    if (!('Notification' in window)) {
      toggle.checked = false
      toggle.disabled = true
      return
    }
    var cfg = await db.config.get('notificationEnabled')
    toggle.checked = cfg ? cfg.value === true : Notification.permission === 'granted'
  }
  await updateStatus()
  if (toggle) toggle.addEventListener('change', async function() {
    if (toggle.checked) {
      var granted = false
      if (window.ensureWanWanNotificationPermission) {
        granted = await window.ensureWanWanNotificationPermission()
      } else if ('Notification' in window) {
        granted = (await Notification.requestPermission()) === 'granted'
      }
      if (!granted) {
        toggle.checked = false
        window.toast && window.toast('请在系统或浏览器设置中允许通知')
      }
    }
    await db.config.put({ key: 'notificationEnabled', value: toggle.checked })
    await updateStatus()
  })
  if (testRow) testRow.addEventListener('click', async function() {
    var cfg = await db.config.get('notificationEnabled')
    var enabled = cfg ? cfg.value === true : (
      'Notification' in window && Notification.permission === 'granted'
    )
    if (!enabled) {
      window.toast && window.toast('请先开启通知')
      return
    }

    var firstSent = false
    if (window.sendWanWanNotification) {
      firstSent = await window.sendWanWanNotification('淡淡的就会顺顺的…', { title: '弯弯' })
    } else if ('Notification' in window) {
      var permission = Notification.permission
      if (permission === 'default') permission = await Notification.requestPermission()
      if (permission === 'granted') {
        new Notification('弯弯', { body: '淡淡的就会顺顺的…', icon: 'img/wanwan.png' })
        firstSent = true
      }
    }
    await updateStatus()
    if (!firstSent) {
      window.toast && window.toast('请在系统或浏览器设置中允许通知')
      return
    }
    setTimeout(function() {
      if (window.sendWanWanNotification) {
        window.sendWanWanNotification('弯弯测试中…', { title: '弯弯' })
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('弯弯', { body: '弯弯测试中…', icon: 'img/wanwan.png' })
      }
    }, 5000)
  })
}

// ===== 保活状态 =====
var _keepAliveWorker = null
var _keepAliveAudio = null

async function initKeepAliveSection(page) {
  var toggle = page.querySelector('#toggle-keepalive')
  var cfg = await db.config.get('keepAliveEnabled')
  var enabled = cfg ? cfg.value : false
  toggle.checked = enabled
  if (enabled) startKeepAlive()
  toggle.addEventListener('change', async function() {
    if (toggle.checked) startKeepAlive()
    else stopKeepAlive()
    await db.config.put({ key: 'keepAliveEnabled', value: toggle.checked })

  })
}

// ===== 启动保活（Worker心跳 + 静音音频） =====
function startKeepAlive() {
  if (!_keepAliveWorker) {
    var code = "setInterval(function(){postMessage('ping')},5000)"
    var blob = new Blob([code], { type: 'application/javascript' })
    var blobUrl = URL.createObjectURL(blob)
    _keepAliveWorker = new Worker(blobUrl)
    URL.revokeObjectURL(blobUrl) // Worker 已持有引用，URL 可立即释放
    _keepAliveWorker.onmessage = function() {}
  }
  if (!_keepAliveAudio) {
    _keepAliveAudio = document.getElementById('keepalive-audio')
  }
  if (_keepAliveAudio) {
    _keepAliveAudio.volume = 0
    _keepAliveAudio.play().catch(function() {
      document.addEventListener('click', function _retry() {
        if (_keepAliveAudio) {
          _keepAliveAudio.volume = 0
          _keepAliveAudio.play().catch(function() {})
        }
        document.removeEventListener('click', _retry)
      }, { once: true })
    })
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: '弯弯',
        artist: '',
        album: '',
        artwork: [
          { src: 'img/wanwan.png', sizes: '512x512', type: 'image/png' }
        ]
      })
    }
  }
}

// ===== 停止保活 =====
function stopKeepAlive() {
  if (_keepAliveWorker) { _keepAliveWorker.terminate(); _keepAliveWorker = null }
  if (_keepAliveAudio) {
    _keepAliveAudio.pause()
    _keepAliveAudio.currentTime = 0
  }
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = null
  }
}

// ===== 启动时加载设置 =====
window.loadAndApplySettings = async function() {
  var rows = await Promise.all([
    db.config.get('keepAliveEnabled'),
    db.config.get('darkModeEnabled')
  ])
  applyDarkMode(!!(rows[1] && rows[1].value))
  if (rows[0] && rows[0].value) {
    document.addEventListener('click', function _initKA() {
      startKeepAlive()
      document.removeEventListener('click', _initKA)
    }, { once: true })
  }
}

// ===== 打开合并API配置子页面 =====
function openApiConfigPage() {
  var html =
    buildApiFormHTML('primary')
  var page = buildSubPage('sub-api-config', 'API 配置', html)
  openSubPage(page)
  initApiConfigPage(page)
}

// ===== 构建单个API表单HTML =====
function buildApiFormHTML(type) {
  var isPrimary = type === 'primary'
  var idPfx = isPrimary ? 'api' : 'sub-api'
  var presetSection = ''
  if (isPrimary) {
    presetSection =
      '<div class="preset-bar">' +
        '<select class="input-field preset-select" id="preset-select">' +
          '<option value="">选择预设...</option>' +
        '</select>' +
        '<button class="btn-ghost btn-sm" id="btn-save-preset">存预设</button>' +
        '<button class="btn-ghost btn-sm btn-text-danger" id="btn-del-preset">删除</button>' +
      '</div>'
  }
  var form = '<div class="setting-section' + (isPrimary ? ' custom-api-panel' : '') + '"' +
    (isPrimary ? ' id="custom-api-panel"' : '') + '><div class="api-form" id="api-form-' + type + '">' +
    presetSection +
    '<label class="form-label">Base URL</label>' +
    '<input class="input-field" id="' + idPfx + '-base-url" placeholder="https://api.openai.com/v1">' +
    '<label class="form-label">API Key</label>' +
    '<div class="input-with-toggle">' +
      '<input class="input-field" id="' + idPfx + '-key" type="text" placeholder="sk-...">' +
      '<button class="btn-text-toggle" id="toggle-' + idPfx + '-key-vis">隐藏</button>' +
    '</div>' +
    '<label class="form-label">模型</label>' +
    '<input class="input-field" id="' + idPfx + '-model-input" placeholder="手动输入模型名，例如 gpt-4o-mini">' +
    '<div class="model-row">' +
      '<select class="input-field" id="' + idPfx + '-model"><option value="">拉取后选择模型</option></select>' +
      '<button class="btn-ghost btn-sm" id="btn-load-' + type + '-models">获取</button>' +
    '</div>' +
    '<div class="api-test-row">' +
      (isPrimary
        ? '<button class="btn-ghost" id="btn-test-' + type + '-chat">连接测试</button>'
        : '<button class="btn-ghost" id="btn-test-' + type + '-embedding">向量测试</button>') +
    '</div>' +
    '<button class="btn-pill btn-full" id="btn-save-' + type + '-api">保存</button>' +
  '</div></div>'
  if (isPrimary) {
    form =
      form +
      '<div class="setting-section temperature-preset-section">' +
      '<div class="temperature-preset-header" id="btn-temperature-presets">' +
        '<span>温度预设</span>' +
        '<i class="fa fa-angle-down temperature-preset-chevron"></i>' +
      '</div>' +
      '<div class="temperature-preset-body" id="temperature-preset-body" style="display:none"></div>' +
    '</div>'
  }
  return form
}

// ===== 初始化合并API配置页 =====
function initApiConfigPage(page) {
  // 主API表单
  loadApiForm(page, '')
  page.querySelector('#btn-save-primary-api').addEventListener('click', function() { saveApiConfig(page, '') })
  page.querySelector('#btn-load-primary-models').addEventListener('click', function() { loadModelList(page, '') })
  page.querySelector('#btn-test-primary-chat').addEventListener('click', function() { testApiChat(page, '') })
  initTemperaturePresetSection(page)
  bindKeyVisibilityText(page, 'toggle-api-key-vis', 'api-key')
  // 预设功能
  initPresets(page)
}

// ===== 文字版显示/隐藏API Key =====
function bindKeyVisibilityText(page, btnId, inputId) {
  var btn = page.querySelector('#' + btnId)
  var input = page.querySelector('#' + inputId)
  if (!btn || !input) return
  btn.addEventListener('click', function() {
    var isVisible = input.type === 'text'
    input.type = isVisible ? 'password' : 'text'
    btn.textContent = isVisible ? '显示' : '隐藏'
  })
}

// ===== 预设功能 =====
async function initPresets(page) {
  var select = page.querySelector('#preset-select')
  var btnSave = page.querySelector('#btn-save-preset')
  var btnDel = page.querySelector('#btn-del-preset')
  if (!select) return
  await refreshPresetList(page)
  // 加载预设
  select.addEventListener('change', function() {
    if (!select.value) return
    loadPreset(page, select.value)
  })
  // 保存预设
  btnSave.addEventListener('click', function() {
    var missing = getApiFormMissingFields(page, '')
    if (showIncompleteSettingsSave(missing, '预设')) return
    showPresetNameDialog(page)
  })
  // 删除预设
  btnDel.addEventListener('click', async function() {
    if (!select.value) { window.toast('请先选择预设'); return }
    await deletePreset(select.value)
    await refreshPresetList(page)
    window.toast('预设已删除')
  })
}

// ===== 刷新预设下拉列表 =====
async function refreshPresetList(page) {
  var select = page.querySelector('#preset-select')
  if (!select) return
  var cfg = await db.config.get('apiPresets')
  var presets = (cfg && cfg.value) ? cfg.value : []
  select.innerHTML = '<option value="">选择预设...</option>'
  presets.forEach(function(p, i) {
    var opt = document.createElement('option')
    opt.value = i
    opt.textContent = p.name
    select.appendChild(opt)
  })
}

// ===== 加载预设到表单 =====
async function loadPreset(page, index) {
  var cfg = await db.config.get('apiPresets')
  var presets = (cfg && cfg.value) ? cfg.value : []
  var p = presets[index]
  if (!p) return
  var setVal = function(id, v) {
    var el = page.querySelector('#' + id)
    if (el) el.value = v || ''
  }
  setVal('api-base-url', p.url)
  setVal('api-key', p.key)
  setVal('api-model-input', p.model)
  syncModelSelectOption(page, 'api', p.model)
  window.toast('已加载预设：' + p.name)
}

function syncModelSelectOption(page, idPrefix, model) {
  var modelEl = page.querySelector('#' + idPrefix + '-model')
  if (modelEl && model) {
    var exists = false
    for (var i = 0; i < modelEl.options.length; i++) {
      if (modelEl.options[i].value === model) { exists = true; break }
    }
    if (!exists) {
      var opt = document.createElement('option')
      opt.value = model
      opt.textContent = model
      modelEl.appendChild(opt)
    }
    modelEl.value = model
  }
}

// ===== 弹出预设命名对话框 =====
function showPresetNameDialog(page) {
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay show'
  var modal = document.createElement('div')
  modal.className = 'img-picker-modal show'
  modal.innerHTML =
    '<div class="img-picker-title">保存预设</div>' +
    '<div class="img-picker-url-area">' +
      '<input class="input-field" id="preset-name-input" placeholder="输入预设名称">' +
    '</div>' +
    '<button class="btn-pill btn-full" id="btn-confirm-preset">确定</button>' +
    '<button class="img-picker-cancel" id="btn-cancel-preset">取消</button>'
  document.body.appendChild(overlay)
  document.body.appendChild(modal)
  var close = function() {
    overlay.remove(); modal.remove()
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#btn-cancel-preset').addEventListener('click', close)
  modal.querySelector('#btn-confirm-preset').addEventListener('click', async function() {
    var name = modal.querySelector('#preset-name-input').value.trim()
    if (!name) { window.toast('预设保存失败，请填写：预设名称'); return }
    var missing = getApiFormMissingFields(page, '')
    if (showIncompleteSettingsSave(missing, '预设')) { close(); return }
    try {
      await savePreset(page, name)
      close()
      await refreshPresetList(page)
      window.toast('预设已保存：' + name)
    } catch (error) {
      window.toast('预设保存失败：' + (error.message || error))
    }
  })
}

// ===== 保存当前表单为预设 =====
async function savePreset(page, name) {
  var get = function(id) { return (page.querySelector('#' + id) || {}).value || '' }
  var preset = {
    name: name,
    url: get('api-base-url'),
    key: get('api-key'),
    model: get('api-model-input')
  }
  var cfg = await db.config.get('apiPresets')
  var presets = (cfg && cfg.value) ? cfg.value : []
  presets.push(preset)
  await db.config.put({ key: 'apiPresets', value: presets })
}

// ===== 删除预设 =====
async function deletePreset(index) {
  var cfg = await db.config.get('apiPresets')
  var presets = (cfg && cfg.value) ? cfg.value : []
  presets.splice(index, 1)
  await db.config.put({ key: 'apiPresets', value: presets })
}

// ===== 联机配置子页面 =====
function openOnlineConfigPage() {
  var html =
    '<div class="setting-section"><div class="api-form" id="online-form">' +
      '<label class="form-label">服务器地址</label>' +
      '<input class="input-field" id="online-server" placeholder="wss://...">' +
      '<label class="form-label">用户 Token</label>' +
      '<input class="input-field" id="online-token" type="password" autocomplete="off" placeholder="Token">' +
      '<button class="btn-pill btn-full" id="btn-save-online">保存联机配置</button>' +
    '</div></div>'
  var page = buildSubPage('sub-online-config', '联机配置', html)
  openSubPage(page)
  initOnlineForm(page)
}

// ===== 联机表单初始化 =====
async function initOnlineForm(page) {
  var results = await Promise.all([
    db.config.get('onlineServer'),
    db.config.get('onlineToken')
  ])
  var serverEl = page.querySelector('#online-server')
  var tokenEl = page.querySelector('#online-token')
  if (serverEl && results[0]) serverEl.value = results[0].value || ''
  if (tokenEl && results[1]) tokenEl.value = results[1].value || ''
  page.querySelector('#btn-save-online').addEventListener('click', async function() {
    var server = serverEl ? serverEl.value.trim() : ''
    var token = tokenEl ? tokenEl.value.trim() : ''
    if (server && !/^wss?:\/\//i.test(server)) {
      window.toast('服务器地址必须以 ws:// 或 wss:// 开头')
      return
    }
    await Promise.all([
      db.config.put({ key: 'onlineServer', value: server }),
      db.config.put({ key: 'onlineToken',  value: token })
    ])
    if (window.WanWanOnline) await window.WanWanOnline.reconfigure()
    var settingsPage = document.getElementById('settings-page')
    if (settingsPage) await updateRowValues(settingsPage)
    window.toast('联机配置已保存')
  })
}

// ===== 联机开关 =====
async function initOnlineToggle(page) {
  var toggle = page.querySelector('#toggle-online')
  var cfg = await db.config.get('onlineEnabled')
  toggle.checked = cfg ? cfg.value : false
  toggle.addEventListener('change', async function() {
    await db.config.put({ key: 'onlineEnabled', value: toggle.checked })
    if (window.WanWanOnline) {
      if (toggle.checked) await window.WanWanOnline.reconfigure()
      else window.WanWanOnline.disconnect('disabled')
    }
    updateOnlineStateValue(page)
  })
}

var ONLINE_STATE_LABELS = {
  disabled: '未启用',
  unconfigured: '未配置',
  connecting: '连接中',
  authenticating: '认证中',
  waiting_account: '等待微信登录',
  ready: '已连接',
  reconnecting: '重连中',
  disconnected: '未连接',
  error: '连接失败'
}

function updateOnlineStateValue(page) {
  var valueEl = page && page.querySelector('#val-online-state')
  if (!valueEl) return
  var current = window.WanWanOnline ? window.WanWanOnline.getState() : 'disabled'
  valueEl.textContent = ONLINE_STATE_LABELS[current] || '未连接'
}

function bindOnlineStateValue(page) {
  updateOnlineStateValue(page)
  if (!window.WanWanOnline) return
  var unsubscribe = window.WanWanOnline.subscribe(function() {
    if (!document.body.contains(page)) {
      unsubscribe()
      return
    }
    updateOnlineStateValue(page)
  })
}

// ===== Account卡片初始化 =====
async function initAccountCard(page) {
  var results = await Promise.all([
    db.config.get('profileName'),
    db.config.get('profileSub'),
    db.config.get('profileAvatar')
  ])
  var name = results[0] ? results[0].value : '弯弯'
  var sub = results[1] ? results[1].value : 'Apple Account, iCloud, and more'
  var avatar = results[2] ? results[2].value : null
  var nameEl = page.querySelector('#account-name')
  var subEl = page.querySelector('#account-sub')
  var avatarEl = page.querySelector('#account-avatar')
  if (nameEl) nameEl.textContent = name
  if (subEl) subEl.textContent = sub
  applyAvatar(avatarEl, avatar, name)
  page.querySelector('#row-account').addEventListener('click', function() {
    openProfilePage(page)
  })
}

// ===== 应用头像 =====
function applyAvatar(el, avatarUrl, name) {
  if (!el) return
  if (avatarUrl) {
    el.textContent = ''
    el.style.backgroundImage = 'url(' + avatarUrl + ')'
    el.style.backgroundSize = 'cover'
    el.style.backgroundPosition = 'center'
  } else {
    el.style.backgroundImage = ''
    el.textContent = (name || '弯')[0]
  }
}

// ===== HTML属性转义 =====
function escapeAttr(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ===== 打开用户资料子页面 =====
async function openProfilePage(settingsPage) {
  var results = await Promise.all([
    db.config.get('profileName'),
    db.config.get('profileSub'),
    db.config.get('profileAvatar')
  ])
  var curName = results[0] ? results[0].value : '弯弯'
  var curSub = results[1] ? results[1].value : 'Apple Account, iCloud, and more'
  var curAvatar = results[2] ? results[2].value : null
  var html = buildProfileHTML(curName, curSub, curAvatar)
  var page = buildSubPage('sub-profile', '用户资料', html)
  openSubPage(page)
  initProfilePage(page, settingsPage, curAvatar, curName)
}

// ===== 用户资料页HTML =====
function buildProfileHTML(curName, curSub, curAvatar) {
  return '<div class="setting-section">' +
    '<div class="profile-avatar-section">' +
      '<div class="profile-avatar-large" id="profile-avatar-large">' +
        (curAvatar ? '' : (curName || '弯')[0]) +
      '</div>' +
      '<button class="btn-ghost btn-sm" id="btn-change-avatar">更换头像</button>' +
      '<button class="btn-ghost btn-sm btn-text-danger" id="btn-reset-avatar">恢复默认</button>' +
    '</div></div>' +
    '<div class="setting-section"><div class="api-form">' +
      '<label class="form-label">名字</label>' +
      '<input class="input-field" id="profile-name-input" value="' + escapeAttr(curName) + '" placeholder="输入名字">' +
      '<label class="form-label">副标题</label>' +
      '<input class="input-field" id="profile-sub-input" value="' + escapeAttr(curSub) + '" placeholder="输入副标题">' +
      '<button class="btn-pill btn-full" id="btn-save-profile">保存</button>' +
    '</div></div>'
}

// ===== 用户资料页事件绑定 =====
function initProfilePage(page, settingsPage, curAvatar, curName) {
  var avatarLarge = page.querySelector('#profile-avatar-large')
  if (curAvatar) {
    avatarLarge.style.backgroundImage = 'url(' + curAvatar + ')'
    avatarLarge.style.backgroundSize = 'cover'
    avatarLarge.style.backgroundPosition = 'center'
  }
  // 更换头像
  page.querySelector('#btn-change-avatar').addEventListener('click', function() {
    window.showImagePicker(async function(imageUrl) {
      try {
        await db.config.put({ key: 'profileAvatar', value: imageUrl })
        avatarLarge.textContent = ''
        avatarLarge.style.backgroundImage = 'url(' + imageUrl + ')'
        avatarLarge.style.backgroundSize = 'cover'
        avatarLarge.style.backgroundPosition = 'center'
        refreshAccountCard(settingsPage)
        window.toast('头像已更新')
      } catch (err) { window.toast('更换失败：' + err.message) }
    })
  })
  bindProfileResetAvatar(page, settingsPage, avatarLarge)
  bindProfileSave(page, settingsPage, avatarLarge)
}

// ===== 恢复默认头像 =====
function bindProfileResetAvatar(page, settingsPage, avatarLarge) {
  page.querySelector('#btn-reset-avatar').addEventListener('click', async function() {
    await db.config.delete('profileAvatar')
    var nameVal = page.querySelector('#profile-name-input').value || '弯弯'
    avatarLarge.style.backgroundImage = ''
    avatarLarge.textContent = nameVal[0]
    refreshAccountCard(settingsPage)
    window.toast('已恢复默认头像')
  })
}

// ===== 保存名字和副标题 =====
function bindProfileSave(page, settingsPage, avatarLarge) {
  page.querySelector('#btn-save-profile').addEventListener('click', async function() {
    var newName = page.querySelector('#profile-name-input').value.trim() || '弯弯'
    var newSub = page.querySelector('#profile-sub-input').value.trim() || 'Apple Account, iCloud, and more'
    await Promise.all([
      db.config.put({ key: 'profileName', value: newName }),
      db.config.put({ key: 'profileSub', value: newSub })
    ])
    var avatarCheck = await db.config.get('profileAvatar')
    if (!avatarCheck || !avatarCheck.value) {
      avatarLarge.textContent = newName[0]
    }
    refreshAccountCard(settingsPage)
    window.toast('资料已保存')
  })
}

// ===== 刷新Account卡片 =====
async function refreshAccountCard(settingsPage) {
  var results = await Promise.all([
    db.config.get('profileName'),
    db.config.get('profileSub'),
    db.config.get('profileAvatar')
  ])
  var name = results[0] ? results[0].value : '弯弯'
  var sub = results[1] ? results[1].value : 'Apple Account, iCloud, and more'
  var avatar = results[2] ? results[2].value : null
  var nameEl = settingsPage.querySelector('#account-name')
  var subEl = settingsPage.querySelector('#account-sub')
  var avatarEl = settingsPage.querySelector('#account-avatar')
  if (nameEl) nameEl.textContent = name
  if (subEl) subEl.textContent = sub
  applyAvatar(avatarEl, avatar, name)
}

// ===== 字体设置子页面 =====
function openFontPage() {
  var html =
    '<div class="setting-section">' +
      '<div class="section-title">当前字体</div>' +
      '<div class="font-preview-box" id="font-preview-box">' +
        '<div class="font-preview-text" id="font-preview-text">弯弯 — 预览文字 AaBbCc 123</div>' +
      '</div>' +
    '</div>' +
    buildFontAddSection() +
    '<div class="setting-section" id="font-list-section">' +
      '<div class="section-title">字体列表</div>' +
      '<div class="api-form">' +
        '<div class="preset-bar">' +
          '<select class="input-field preset-select" id="font-select"></select>' +
          '<button class="btn-ghost btn-sm btn-text-danger" id="btn-del-font">删除</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    buildFontSizeSection() +
    '<div style="height:40px"></div>'
  var page = buildSubPage('sub-font', '字体', html)
  openSubPage(page)
  initFontPage(page)
}

function buildFontAddSection() {
  return '<div class="setting-section">' +
    '<div class="section-title">添加字体</div>' +
    '<div class="api-form" id="font-add-form">' +
      '<div class="api-tab-bar font-source-tabs">' +
        '<button class="api-tab active" type="button" data-source="url">URL 导入</button>' +
        '<button class="api-tab" type="button" data-source="file">文件导入</button>' +
      '</div>' +
      '<label class="form-label">字体名称</label>' +
      '<input class="input-field" id="font-add-name" placeholder="设置字体预览名称">' +
      '<div id="font-url-fields">' +
        '<label class="form-label">字体 URL</label>' +
        '<input class="input-field" id="font-add-url" placeholder="Google Fonts CSS 或 .ttf/.otf/.woff/.woff2 地址">' +
      '</div>' +
      '<div id="font-file-fields" style="display:none">' +
        '<input type="file" id="font-add-file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" style="display:none">' +
        '<button class="font-file-picker" id="btn-pick-font-file" type="button">' +
          '<i class="fa-solid fa-upload"></i>' +
          '<span class="font-file-picker-text"><strong id="font-file-name">选择字体文件</strong><small>TTF、OTF、WOFF、WOFF2</small></span>' +
          '<i class="fa fa-angle-right"></i>' +
        '</button>' +
      '</div>' +
      '<div class="section-desc">字体会下载并保存到本地，保存后立即启用。URL 支持字体文件和包含 @font-face 的 CSS。</div>' +
      '<button class="btn-pill btn-full" id="btn-add-font">保存并启用</button>' +
    '</div>' +
  '</div>'
}

function buildFontSizeSection() {
  return '<div class="setting-section">' +
    '<div class="section-title">排版调整</div>' +
    '<div class="api-form">' +
      '<label class="form-label">字体大小</label>' +
      '<div class="temp-row">' +
        '<input type="range" id="font-size-slider" min="12" max="20" step="1" value="14">' +
        '<span class="temp-val" id="font-size-val">14px</span>' +
      '</div>' +
      '<label class="form-label">字间距</label>' +
      '<div class="temp-row">' +
        '<input type="range" id="font-spacing-slider" min="-0.05" max="0.2" step="0.01" value="0">' +
        '<span class="temp-val" id="font-spacing-val">0.00</span>' +
      '</div>' +
      '<button class="btn-pill btn-full" id="btn-save-font-style">保存排版</button>' +
    '</div>' +
  '</div>'
}

// ===== 字体页初始化 =====
async function initFontPage(page) {
  await renderFontList(page)
  await loadFontSliders(page)
  initFontPreview(page)
  bindFontAddEvents(page)
  bindFontSliderEvents(page)
}

var ACTIVE_FONT_ID_KEY = 'activeFontId'
var LEGACY_ACTIVE_FONT_KEY = 'activeFont'

function generateStoredFontId() {
  return 'font_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10)
}

function cloneStoredFont(font) {
  if (!font || typeof font !== 'object') return font
  return Object.assign({}, font)
}

function ensureStoredFontId(font) {
  if (!font || typeof font !== 'object') return font
  if (font.id) return font
  var next = cloneStoredFont(font)
  next.id = generateStoredFontId()
  return next
}

async function saveStoredFonts(fonts) {
  await db.config.put({ key: 'customFonts', value: fonts })
}

async function loadStoredFonts() {
  var cfg = await db.config.get('customFonts')
  var fonts = (cfg && Array.isArray(cfg.value)) ? cfg.value : []
  var changed = false
  fonts = fonts.map(function(font) {
    var next = ensureStoredFontId(font)
    if (next !== font) changed = true
    return next
  })
  if (changed) await saveStoredFonts(fonts)
  return fonts
}

function findStoredFontById(fonts, fontId) {
  if (!fontId) return null
  for (var i = 0; i < fonts.length; i++) {
    if (fonts[i] && fonts[i].id === fontId) return fonts[i]
  }
  return null
}

function isSameStoredFont(a, b) {
  if (!a || !b) return false
  if (a.id && b.id && a.id === b.id) return true
  if (a.dataUrl && b.dataUrl && a.dataUrl === b.dataUrl) return true
  if (a.cssText && b.cssText && a.cssText === b.cssText) return true
  if (a.name && b.name && a.name === b.name) {
    if ((a.sourceUrl || a.url) && (b.sourceUrl || b.url) && (a.sourceUrl || a.url) === (b.sourceUrl || b.url)) return true
    if (a.sourceFileName && b.sourceFileName && a.sourceFileName === b.sourceFileName) return true
    if (!a.dataUrl && !b.dataUrl && !a.cssText && !b.cssText && !(a.sourceUrl || a.url) && !(b.sourceUrl || b.url)) return true
  }
  return false
}

async function setActiveFontId(fontId) {
  if (fontId) {
    await db.transaction('rw', db.config, async function() {
      await db.config.put({ key: ACTIVE_FONT_ID_KEY, value: fontId })
      await db.config.delete(LEGACY_ACTIVE_FONT_KEY)
    })
    return
  }
  await db.transaction('rw', db.config, async function() {
    await db.config.delete(ACTIVE_FONT_ID_KEY)
    await db.config.delete(LEGACY_ACTIVE_FONT_KEY)
  })
}

async function resolveStoredActiveFont(options) {
  options = options || {}
  var fonts = options.fonts || await loadStoredFonts()
  var activeIdCfg = await db.config.get(ACTIVE_FONT_ID_KEY)
  var activeFontId = activeIdCfg && activeIdCfg.value ? String(activeIdCfg.value) : ''
  if (activeFontId) {
    var activeFont = findStoredFontById(fonts, activeFontId)
    if (activeFont) {
      return { fonts: fonts, activeFont: activeFont, activeFontId: activeFontId }
    }
    await setActiveFontId('')
    return { fonts: fonts, activeFont: null, activeFontId: '' }
  }
  var legacyCfg = await db.config.get(LEGACY_ACTIVE_FONT_KEY)
  var legacyFont = legacyCfg && legacyCfg.value ? ensureStoredFontId(legacyCfg.value) : null
  if (!legacyFont) return { fonts: fonts, activeFont: null, activeFontId: '' }
  var migratedFonts = fonts
  var matchedFont = null
  for (var i = 0; i < migratedFonts.length; i++) {
    if (isSameStoredFont(migratedFonts[i], legacyFont)) {
      matchedFont = migratedFonts[i]
      break
    }
  }
  if (!matchedFont) {
    matchedFont = legacyFont
    migratedFonts = migratedFonts.concat([matchedFont])
    await saveStoredFonts(migratedFonts)
  }
  await setActiveFontId(matchedFont.id)
  return { fonts: migratedFonts, activeFont: matchedFont, activeFontId: matchedFont.id }
}

// ===== 预览当前字体 =====
async function initFontPreview(page) {
  var previewText = page.querySelector('#font-preview-text')
  var state = await resolveStoredActiveFont()
  if (state.activeFont && state.activeFont.name) {
    previewText.style.fontFamily = '"' + state.activeFont.name + '", var(--font)'
  }
}

// ===== 添加字体事件 =====
function bindFontAddEvents(page) {
  var source = 'url'
  var selectedFile = null
  var nameEl = page.querySelector('#font-add-name')
  var urlEl = page.querySelector('#font-add-url')
  var fileEl = page.querySelector('#font-add-file')
  var fileNameEl = page.querySelector('#font-file-name')
  var sourceTabs = page.querySelectorAll('.font-source-tabs .api-tab')

  function setSource(nextSource) {
    source = nextSource
    sourceTabs.forEach(function(tab) {
      tab.classList.toggle('active', tab.dataset.source === source)
    })
    page.querySelector('#font-url-fields').style.display = source === 'url' ? '' : 'none'
    page.querySelector('#font-file-fields').style.display = source === 'file' ? '' : 'none'
  }

  sourceTabs.forEach(function(tab) {
    tab.addEventListener('click', function() { setSource(tab.dataset.source) })
  })
  page.querySelector('#btn-pick-font-file').addEventListener('click', function() {
    fileEl.click()
  })
  fileEl.addEventListener('change', function() {
    selectedFile = fileEl.files && fileEl.files[0] ? fileEl.files[0] : null
    if (!selectedFile) {
      fileNameEl.textContent = '选择字体文件'
      return
    }
    fileNameEl.textContent = selectedFile.name
    nameEl.value = selectedFile.name.replace(/\.(ttf|otf|woff2?)$/i, '')
  })

  page.querySelector('#btn-add-font').addEventListener('click', async function() {
    var btn = page.querySelector('#btn-add-font')
    var name = nameEl.value.trim()
    var url = urlEl.value.trim()
    if (!name) { window.toast('请输入字体名称'); return }
    if (source === 'url' && !url) { window.toast('请输入字体 URL'); return }
    if (source === 'file' && !selectedFile) { window.toast('请选择字体文件'); return }
    var fonts = await loadStoredFonts()
    // 检查重名
    for (var i = 0; i < fonts.length; i++) {
      if (String(fonts[i].name || '').toLowerCase() === name.toLowerCase()) {
        window.toast('已存在同名字体'); return
      }
    }
    btn.disabled = true
    btn.textContent = source === 'url' ? '正在下载并验证...' : '正在读取并验证...'
    try {
      var font = source === 'url'
        ? await downloadFontForStorage(name, url)
        : await readFontFileForStorage(name, selectedFile)
      font = ensureStoredFontId(font)
      fonts.push(font)
      await db.transaction('rw', db.config, async function() {
        await db.config.put({ key: 'customFonts', value: fonts })
        await db.config.put({ key: ACTIVE_FONT_ID_KEY, value: font.id })
        await db.config.delete(LEGACY_ACTIVE_FONT_KEY)
      })
      applyStoredFont(font)
      nameEl.value = ''
      urlEl.value = ''
      selectedFile = null
      fileEl.value = ''
      fileNameEl.textContent = '选择字体文件'
      await renderFontList(page)
      updateFontPreview(page)
      updateFontRowValue()
      window.toast('字体已保存并启用：' + name)
    } catch (err) {
      window.toast(formatFontImportError(err))
    } finally {
      btn.disabled = false
      btn.textContent = '保存并启用'
    }
  })
}

// ===== 渲染字体列表 =====
async function renderFontList(page) {
  var selectEl = page.querySelector('#font-select')
  if (!selectEl) return
  var state = await resolveStoredActiveFont()
  var fonts = state.fonts
  var activeFontId = state.activeFontId
  selectEl.innerHTML = '<option value="-1">系统默认</option>'
  fonts.forEach(function(f, i) {
    var opt = document.createElement('option')
    opt.value = i
    opt.textContent = f.name
    if (f.id === activeFontId) opt.selected = true
    selectEl.appendChild(opt)
  })
  if (!activeFontId) selectEl.value = '-1'
  // 切换字体
  selectEl.onchange = function() {
    var idx = parseInt(selectEl.value)
    applyFontByIndex(idx, fonts, page)
  }
  // 删除字体
  var btnDel = page.querySelector('#btn-del-font')
  if (btnDel) {
    btnDel.onclick = function() {
      var idx = parseInt(selectEl.value)
      if (idx < 0) { window.toast('默认字体不能删除'); return }
      deleteFont(idx, fonts, page)
    }
  }
}

// ===== 切换字体 =====
async function applyFontByIndex(idx, fonts, page) {
  if (idx < 0) {
    // 恢复默认
    await setActiveFontId('')
    removeFontStylesheet()
    document.documentElement.style.setProperty('--font-custom', '')
    document.documentElement.style.setProperty('--font',
      "-apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif")
  } else {
    var f = fonts[idx]
    if (!hasLocalFontData(f) && f.url) {
      try {
        f = await downloadFontForStorage(f.name, f.url)
        fonts[idx] = f
        await db.config.put({ key: 'customFonts', value: fonts })
      } catch (err) {
        window.toast('字体缓存失败，将尝试使用原链接')
      }
    }
    await setActiveFontId(f.id)
    applyStoredFont(f)
  }
  await renderFontList(page)
  updateFontPreview(page)
  updateFontRowValue()
  window.toast(idx < 0 ? '已切换为默认字体' : '已切换字体：' + fonts[idx].name)
}

// ===== 删除字体 =====
async function deleteFont(idx, fonts, page) {
  var state = await resolveStoredActiveFont({ fonts: fonts })
  var activeFontId = state.activeFontId
  var deleted = fonts[idx]
  fonts.splice(idx, 1)
  await saveStoredFonts(fonts)
  // 如果删除的是当前激活字体，恢复默认
  if (deleted.id === activeFontId) {
    await setActiveFontId('')
    removeFontStylesheet()
    document.documentElement.style.setProperty('--font-custom', '')
    document.documentElement.style.setProperty('--font',
      "-apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif")
    updateFontRowValue()
  }
  await renderFontList(page)
  window.toast('已删除字体：' + deleted.name)
}

// ===== 注入/移除字体CSS =====
function injectFontStylesheet(fontOrUrl, name) {
  removeFontStylesheet()
  var font = typeof fontOrUrl === 'object' ? fontOrUrl : null
  var url = font ? (font.sourceUrl || font.url || '') : fontOrUrl
  var fontName = font ? font.name : name
  if (font && font.type === 'css' && font.cssText) {
    var cssStyle = document.createElement('style')
    cssStyle.id = 'custom-font-link'
    cssStyle.textContent = aliasFontCss(font.cssText, font.name)
    document.head.appendChild(cssStyle)
    return
  }
  if (font && font.dataUrl) {
    var cachedStyle = document.createElement('style')
    cachedStyle.id = 'custom-font-link'
    cachedStyle.textContent =
      '@font-face{' +
        'font-family:"' + cssStringEscape(font.name || 'CustomFont') + '";' +
        'src:url("' + cssStringEscape(font.dataUrl) + '") format("' + cssStringEscape(font.format || guessFontFormat(url)) + '");' +
        'font-weight:400;' +
        'font-style:normal;' +
        'font-display:swap;' +
      '}'
    document.head.appendChild(cachedStyle)
    return
  }
  if (isDirectFontUrl(url)) {
    var style = document.createElement('style')
    style.id = 'custom-font-link'
    style.textContent =
      '@font-face{' +
        'font-family:"' + cssStringEscape(fontName || 'CustomFont') + '";' +
        'src:url("' + cssStringEscape(url) + '") format("' + guessFontFormat(url) + '");' +
        'font-weight:400;' +
        'font-style:normal;' +
        'font-display:swap;' +
      '}'
    document.head.appendChild(style)
    return
  }
  var link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  link.id = 'custom-font-link'
  document.head.appendChild(link)
}

async function downloadFontForStorage(name, url) {
  var normalizedUrl
  try {
    normalizedUrl = new URL(url, location.href)
  } catch (err) {
    throw new Error('URL 格式无效')
  }
  if (!/^https?:$/.test(normalizedUrl.protocol)) throw new Error('URL 仅支持 HTTP 或 HTTPS 地址')
  url = normalizedUrl.href
  if (isDirectFontUrl(url)) {
    var blob = await fetchFontBlob(url)
    var directFont = {
      id: generateStoredFontId(),
      name: name,
      type: 'file',
      sourceUrl: url,
      url: url,
      dataUrl: await blobToDataUrl(blob),
      mime: blob.type || guessFontMime(url),
      format: guessFontFormat(url),
      cachedAt: Date.now()
    }
    await validateStoredFont(directFont)
    return directFont
  }
  var cssText = await fetchText(url)
  if (!/@font-face\b/i.test(cssText)) throw new Error('URL 内容不是有效的字体 CSS')
  cssText = extractFontFaceCss(cssText)
  if (!cssText) throw new Error('URL 内容没有可用的 @font-face 规则')
  var embeddedUrls = extractEmbeddedFontDataUrls(cssText)
  for (var embeddedIndex = 0; embeddedIndex < embeddedUrls.length; embeddedIndex++) {
    await validateFontDataUrl(embeddedUrls[embeddedIndex])
  }
  var urls = extractCssFontUrls(cssText, url)
  if (!urls.length && !embeddedUrls.length) throw new Error('没有在CSS里找到字体文件')
  for (var i = 0; i < urls.length; i++) {
    var item = urls[i]
    var blob = await fetchFontBlob(item.absolute)
    var dataUrl = await blobToDataUrl(blob)
    await validateFontDataUrl(dataUrl)
    cssText = cssText.split(item.raw).join('url("' + dataUrl + '")')
  }
  var cssFont = {
    id: generateStoredFontId(),
    name: name,
    type: 'css',
    sourceUrl: url,
    url: url,
    cssText: cssText,
    cachedAt: Date.now()
  }
  await validateStoredFont(cssFont)
  return cssFont
}

async function readFontFileForStorage(name, file) {
  if (!file || !isSupportedFontFileName(file.name)) throw new Error('仅支持 TTF、OTF、WOFF、WOFF2 字体文件')
  if (!file.size) throw new Error('字体文件为空')
  var font = {
    id: generateStoredFontId(),
    name: name,
    type: 'file',
    sourceFileName: file.name,
    dataUrl: await blobToDataUrl(file),
    mime: file.type || guessFontMime(file.name),
    format: guessFontFormat(file.name),
    cachedAt: Date.now()
  }
  await validateStoredFont(font)
  return font
}

async function validateStoredFont(font) {
  if (typeof FontFace !== 'function' || !document.fonts) return
  var validationName = 'WanWanFontCheck_' + Date.now() + '_' + Math.random().toString(36).slice(2)
  if (font.type === 'file' && font.dataUrl) {
    await validateFontDataUrl(font.dataUrl, validationName)
    return
  }
  if (font.type === 'css' && font.cssText) {
    var style = document.createElement('style')
    style.textContent = aliasFontCss(font.cssText, validationName)
    document.head.appendChild(style)
    try {
      var rules = style.sheet && style.sheet.cssRules ? Array.prototype.slice.call(style.sheet.cssRules) : []
      var hasFontFaceRule = rules.some(function(rule) {
        return /^@font-face\b/i.test(String(rule.cssText || ''))
      })
      if (!hasFontFaceRule) throw new Error('字体 CSS 无法解析')
    } finally {
      style.remove()
    }
    return
  }
  throw new Error('字体数据无效')
}

async function validateFontDataUrl(dataUrl, validationName) {
  if (typeof FontFace !== 'function') return
  var face = new FontFace(
    validationName || ('WanWanFontFileCheck_' + Date.now() + '_' + Math.random().toString(36).slice(2)),
    'url("' + dataUrl + '")'
  )
  try {
    await face.load()
  } catch (err) {
    throw new Error('字体文件无效或已损坏')
  }
}

function applyStoredFont(font) {
  injectFontStylesheet(font)
  document.documentElement.style.setProperty('--font-custom', '"' + font.name + '"')
  document.documentElement.style.setProperty('--font',
    '"' + font.name + '", -apple-system, "PingFang SC", sans-serif')
}

function formatFontImportError(err) {
  var message = err && err.message ? err.message : String(err || '未知错误')
  var name = err && err.name ? err.name : ''
  if (name === 'QuotaExceededError' || /quota|storage|空间/i.test(message)) {
    return '字体保存失败：本地存储空间不足'
  }
  if (name === 'TypeError' && /请求|fetch|network|load/i.test(message)) {
    return '字体下载失败：网络错误或 URL 不允许跨域读取'
  }
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
    return '字体下载失败：网络错误或 URL 不允许跨域读取'
  }
  return '字体导入失败：' + message
}

function hasLocalFontData(font) {
  return !!(font && (font.dataUrl || font.cssText))
}

async function fetchText(url) {
  var res
  try {
    res = await fetch(url)
  } catch (err) {
    throw new TypeError('字体 URL 请求失败')
  }
  if (!res.ok) throw new Error('HTTP ' + res.status)
  var text = await res.text()
  if (!text.trim()) throw new Error('URL 返回内容为空')
  return text
}

async function fetchFontBlob(url) {
  var res
  try {
    res = await fetch(url)
  } catch (err) {
    throw new TypeError('字体文件请求失败')
  }
  if (!res.ok) throw new Error('HTTP ' + res.status)
  var blob = await res.blob()
  if (!blob.size) throw new Error('字体文件为空')
  return blob
}

function blobToDataUrl(blob) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader()
    reader.onload = function() { resolve(reader.result) }
    reader.onerror = function() { reject(reader.error || new Error('读取字体失败')) }
    reader.readAsDataURL(blob)
  })
}

function extractCssFontUrls(cssText, baseUrl) {
  var out = []
  var re = /url\((['"]?)([^'")]+)\1\)/g
  var m
  while ((m = re.exec(cssText))) {
    var href = m[2]
    if (/^data:/i.test(href)) continue
    out.push({
      raw: m[0],
      absolute: new URL(href, baseUrl).href
    })
  }
  return out
}

function extractEmbeddedFontDataUrls(cssText) {
  var out = []
  var re = /url\((['"]?)(data:[^'")]+)\1\)/gi
  var m
  while ((m = re.exec(String(cssText || '')))) out.push(m[2])
  return out
}

function extractFontFaceCss(cssText) {
  var blocks = String(cssText || '').match(/@font-face\s*{[^}]*}/gi)
  return blocks ? blocks.join('\n') : ''
}

function aliasFontCss(cssText, name) {
  if (!name) return cssText
  return cssText.replace(/font-family\s*:\s*(?:(['"])(.*?)\1|([^;}]+))\s*;/gi, function() {
    return 'font-family:"' + cssStringEscape(name) + '";'
  })
}

function isDirectFontUrl(url) {
  try {
    var path = new URL(url, location.href).pathname.toLowerCase()
    return /\.(ttf|otf|woff2?)$/.test(path)
  } catch (err) {
    return /\.(ttf|otf|woff2?)(?:[?#].*)?$/i.test(String(url || ''))
  }
}

function isSupportedFontFileName(name) {
  return /\.(ttf|otf|woff2?)$/i.test(String(name || ''))
}

function guessFontFormat(url) {
  var clean = String(url || '').split(/[?#]/)[0].toLowerCase()
  if (clean.endsWith('.woff2')) return 'woff2'
  if (clean.endsWith('.woff')) return 'woff'
  if (clean.endsWith('.otf')) return 'opentype'
  if (clean.endsWith('.eot')) return 'embedded-opentype'
  return 'truetype'
}

function guessFontMime(url) {
  var clean = String(url || '').split(/[?#]/)[0].toLowerCase()
  if (clean.endsWith('.woff2')) return 'font/woff2'
  if (clean.endsWith('.woff')) return 'font/woff'
  if (clean.endsWith('.otf')) return 'font/otf'
  if (clean.endsWith('.eot')) return 'application/vnd.ms-fontobject'
  return 'font/ttf'
}

function cssStringEscape(str) {
  return String(str || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\A ')
}

function removeFontStylesheet() {
  var old = document.getElementById('custom-font-link')
  if (old) old.remove()
}

// ===== 更新预览 =====
function updateFontPreview(page) {
  var previewText = page.querySelector('#font-preview-text')
  if (previewText) {
    previewText.style.fontFamily = 'var(--font)'
  }
}

// ===== 更新设置页字体行值 =====
async function updateFontRowValue() {
  var valEl = document.querySelector('#val-font')
  if (!valEl) return
  var state = await resolveStoredActiveFont()
  valEl.textContent = (state.activeFont && state.activeFont.name) ? state.activeFont.name : '默认'
}

// ===== 字体大小/字间距滑块 =====
async function loadFontSliders(page) {
  var sizeCfg = await db.config.get('fontSizeBody')
  var spacingCfg = await db.config.get('letterSpacingBody')
  var size = (sizeCfg && sizeCfg.value) ? sizeCfg.value : 14
  var spacing = (spacingCfg && spacingCfg.value != null) ? spacingCfg.value : 0
  var sizeSlider = page.querySelector('#font-size-slider')
  var sizeVal = page.querySelector('#font-size-val')
  var spacingSlider = page.querySelector('#font-spacing-slider')
  var spacingVal = page.querySelector('#font-spacing-val')
  if (sizeSlider) { sizeSlider.value = size; sizeVal.textContent = size + 'px' }
  if (spacingSlider) { spacingSlider.value = spacing; spacingVal.textContent = Number(spacing).toFixed(2) }
}

function bindFontSliderEvents(page) {
  var sizeSlider = page.querySelector('#font-size-slider')
  var sizeVal = page.querySelector('#font-size-val')
  var spacingSlider = page.querySelector('#font-spacing-slider')
  var spacingVal = page.querySelector('#font-spacing-val')
  var previewText = page.querySelector('#font-preview-text')
  sizeSlider.addEventListener('input', function() {
    sizeVal.textContent = sizeSlider.value + 'px'
    if (previewText) previewText.style.fontSize = sizeSlider.value + 'px'
  })
  spacingSlider.addEventListener('input', function() {
    var v = parseFloat(spacingSlider.value).toFixed(2)
    spacingVal.textContent = v
    if (previewText) previewText.style.letterSpacing = v + 'em'
  })
  page.querySelector('#btn-save-font-style').addEventListener('click', async function() {
    await Promise.all([
      db.config.put({ key: 'fontSizeBody', value: parseInt(sizeSlider.value) }),
      db.config.put({ key: 'letterSpacingBody', value: parseFloat(spacingSlider.value) })
    ])
    document.documentElement.style.setProperty('--font-size-body', sizeSlider.value + 'px')
    document.documentElement.style.setProperty('--letter-spacing-body', parseFloat(spacingSlider.value) + 'em')
    window.toast('排版设置已保存')
  })
}

// ===== 壁纸子页面 =====
function openWallpaperPage() {
  var html =
    '<div class="setting-section"><div class="wallpaper-preview-wrap">' +
      '<div class="wallpaper-preview" id="wallpaper-preview">' +
        '<span class="wallpaper-placeholder">当前壁纸预览</span>' +
      '</div>' +
    '</div></div>' +
    '<div class="setting-section">' +
      '<div class="list-row clickable" id="btn-import-wallpaper">' +
        '<div class="row-icon-box"><i class="fa fa-upload"></i></div>' +
        '<div class="row-body"><div class="row-label">选择壁纸</div><div class="row-sub">从本地文件或URL导入</div></div>' +
        '<i class="fa fa-angle-right row-chevron"></i>' +
      '</div>' +
    '</div>' +
    '<div class="setting-section">' +
      '<div class="list-row clickable" id="btn-restore-wallpaper">' +
        '<div class="row-icon-box"><i class="fa fa-undo"></i></div>' +
        '<div class="row-body"><div class="row-label">恢复默认</div><div class="row-sub">移除自定义壁纸，使用默认背景</div></div>' +
        '<i class="fa fa-angle-right row-chevron"></i>' +
      '</div>' +
    '</div>'
  var page = buildSubPage('sub-wallpaper', '壁纸', html)
  openSubPage(page)
  initWallpaperPage(page)
}

// ===== 壁纸页初始化 =====
async function initWallpaperPage(page) {
  var preview = page.querySelector('#wallpaper-preview')
  var cfg = await db.config.get('wallpaperData')
  if (cfg && cfg.value) {
    preview.style.backgroundImage = 'url(' + cfg.value + ')'
    preview.querySelector('.wallpaper-placeholder').style.display = 'none'
  }
  // 选择壁纸
  page.querySelector('#btn-import-wallpaper').addEventListener('click', function() {
    window.showImagePicker(async function(imageUrl) {
      try {
        await db.config.put({ key: 'wallpaperData', value: imageUrl })
        preview.style.backgroundImage = 'url(' + imageUrl + ')'
        preview.querySelector('.wallpaper-placeholder').style.display = 'none'
        window.setWallpaper(imageUrl)
        window.toast('壁纸已更新')
      } catch (err) { window.toast('设置失败：' + err.message) }
    })
  })
  // 恢复默认
  page.querySelector('#btn-restore-wallpaper').addEventListener('click', async function() {
    await db.config.delete('wallpaperData')
    preview.style.backgroundImage = ''
    preview.querySelector('.wallpaper-placeholder').style.display = ''
    window.setWallpaper(null)
    window.toast('已恢复默认壁纸')
  })
}

// ===== 全局悬浮球 =====
var FLOATING_BALL_CONFIG_KEY = 'floatingBallSettings'
var FLOATING_BALL_DEFAULT_IMAGE = 'img/floating-ball.png'
var FLOATING_BALL_CSS_TEMPLATE = '.global-floating-ball {\n  border-radius: 8px;\n  background: transparent;\n}'
var FLOATING_BALL_DEFAULTS = {
  enabled: false,
  apiConsoleEnabled: false,
  image: FLOATING_BALL_DEFAULT_IMAGE,
  size: 56,
  opacity: 0.65,
  xRatio: 1,
  yRatio: 0.5,
  customCss: ''
}
var _floatingBallConfig = null
var _floatingBallResizeBound = false

function normalizeFloatingBallConfig(value) {
  var raw = value && typeof value === 'object' ? value : {}
  var size = Math.max(36, Math.min(120, parseInt(raw.size, 10) || FLOATING_BALL_DEFAULTS.size))
  var opacity = parseFloat(raw.opacity)
  if (!isFinite(opacity)) opacity = FLOATING_BALL_DEFAULTS.opacity
  return {
    enabled: raw.enabled === true,
    apiConsoleEnabled: raw.apiConsoleEnabled === true,
    image: typeof raw.image === 'string' && raw.image.trim() ? raw.image : FLOATING_BALL_DEFAULT_IMAGE,
    size: size,
    opacity: Math.max(0.2, Math.min(1, opacity)),
    xRatio: Math.max(0, Math.min(1, isFinite(parseFloat(raw.xRatio)) ? parseFloat(raw.xRatio) : 1)),
    yRatio: Math.max(0, Math.min(1, isFinite(parseFloat(raw.yRatio)) ? parseFloat(raw.yRatio) : 0.5)),
    customCss: typeof raw.customCss === 'string' ? raw.customCss : ''
  }
}

async function loadFloatingBallConfig(force) {
  if (_floatingBallConfig && !force) return _floatingBallConfig
  var row = await db.config.get(FLOATING_BALL_CONFIG_KEY)
  _floatingBallConfig = normalizeFloatingBallConfig(row && row.value)
  return _floatingBallConfig
}

async function saveFloatingBallConfig(config) {
  _floatingBallConfig = normalizeFloatingBallConfig(config)
  await db.config.put({ key: FLOATING_BALL_CONFIG_KEY, value: _floatingBallConfig })
  return _floatingBallConfig
}

function getFloatingBallSafeTop() {
  var probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top, 0px)'
  document.body.appendChild(probe)
  var value = parseFloat(getComputedStyle(probe).paddingTop) || 0
  probe.remove()
  return value
}

function getFloatingBallBounds(size) {
  var app = document.getElementById('app')
  var width = app ? app.clientWidth : window.innerWidth
  var height = app ? app.clientHeight : window.innerHeight
  var safeTop = getFloatingBallSafeTop()
  return {
    minX: 0,
    maxX: Math.max(0, width - size),
    minY: safeTop,
    maxY: Math.max(safeTop, height - size)
  }
}

function positionFloatingBall(ball, config) {
  if (!ball) return
  var bounds = getFloatingBallBounds(config.size)
  var x = bounds.minX + config.xRatio * (bounds.maxX - bounds.minX)
  var y = bounds.minY + config.yRatio * (bounds.maxY - bounds.minY)
  ball.style.left = Math.round(x) + 'px'
  ball.style.top = Math.round(y) + 'px'
}

function getFloatingBallPixelPosition(ball) {
  if (!ball) return null
  return {
    left: parseFloat(ball.style.left) || 0,
    top: parseFloat(ball.style.top) || getFloatingBallSafeTop()
  }
}

function preserveFloatingBallPixelPosition(ball, config, position) {
  if (!ball || !position) return
  var bounds = getFloatingBallBounds(config.size)
  var left = Math.max(bounds.minX, Math.min(bounds.maxX, position.left))
  var top = Math.max(bounds.minY, Math.min(bounds.maxY, position.top))
  var xSpan = bounds.maxX - bounds.minX
  var ySpan = bounds.maxY - bounds.minY
  config.xRatio = xSpan > 0 ? (left - bounds.minX) / xSpan : 0
  config.yRatio = ySpan > 0 ? (top - bounds.minY) / ySpan : 0
  ball.style.left = Math.round(left) + 'px'
  ball.style.top = Math.round(top) + 'px'
}

function parseFloatingBallCustomCss(cssText) {
  var source = String(cssText || '').trim()
  if (!source) return ''
  var declarations = source
  if (source.indexOf('{') >= 0 || source.indexOf('}') >= 0) {
    var match = source.match(/^\s*\.global-floating-ball\s*\{([\s\S]*)\}\s*$/)
    if (!match || /[{}]/.test(match[1])) {
      throw new Error('仅支持 .global-floating-ball 这一类名')
    }
    declarations = match[1]
  }
  var parser = document.createElement('div').style
  parser.cssText = declarations
  if (!parser.length) throw new Error('没有识别到有效的 CSS 属性')
  var normalized = []
  for (var i = 0; i < parser.length; i++) {
    var property = parser[i]
    normalized.push(property + ': ' + parser.getPropertyValue(property) + ' !important;')
  }
  return normalized.join('\n')
}

function applyFloatingBallCustomCss(cssText) {
  var style = document.getElementById('floating-ball-custom-style')
  if (!cssText) {
    if (style) style.remove()
    return
  }
  var declarations = parseFloatingBallCustomCss(cssText)
  if (!style) {
    style = document.createElement('style')
    style.id = 'floating-ball-custom-style'
    document.head.appendChild(style)
  }
  style.textContent = '.global-floating-ball {\n' + declarations + '\n}'
}

function applyFloatingBallAppearance(ball, config) {
  if (!ball) return
  ball.style.setProperty('--floating-ball-size', config.size + 'px')
  ball.style.setProperty('--floating-ball-idle-opacity', config.opacity)
  var img = ball.querySelector('img')
  if (img) img.src = config.image
  positionFloatingBall(ball, config)
}

function removeFloatingBall() {
  closeFloatingBallPresetPopup()
  var ball = document.getElementById('global-floating-ball')
  if (ball) ball.remove()
}

async function renderFloatingBall() {
  var config = await loadFloatingBallConfig()
  try {
    applyFloatingBallCustomCss(config.customCss)
  } catch (err) {
    applyFloatingBallCustomCss('')
  }
  if (!config.enabled) {
    removeFloatingBall()
    return
  }
  var app = document.getElementById('app')
  if (!app) return
  var ball = document.getElementById('global-floating-ball')
  if (!ball) {
    ball = document.createElement('button')
    ball.id = 'global-floating-ball'
    ball.className = 'global-floating-ball'
    ball.type = 'button'
    ball.setAttribute('aria-label', '打开 API 预设快速切换')
    ball.innerHTML = '<img alt="">'
    app.appendChild(ball)
    bindFloatingBallDrag(ball)
  }
  applyFloatingBallAppearance(ball, config)
  if (!_floatingBallResizeBound) {
    _floatingBallResizeBound = true
    window.addEventListener('resize', function() {
      var current = document.getElementById('global-floating-ball')
      if (current && _floatingBallConfig) positionFloatingBall(current, _floatingBallConfig)
      closeFloatingBallPresetPopup()
    })
  }
}

function bindFloatingBallDrag(ball) {
  var state = null
  ball.addEventListener('pointerdown', function(event) {
    if (event.button != null && event.button !== 0) return
    var rect = ball.getBoundingClientRect()
    state = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top,
      dragged: false
    }
    ball.setPointerCapture(event.pointerId)
    ball.classList.add('is-active')
    closeFloatingBallPresetPopup()
    event.preventDefault()
  })
  ball.addEventListener('pointermove', function(event) {
    if (!state || event.pointerId !== state.pointerId) return
    var dx = event.clientX - state.startX
    var dy = event.clientY - state.startY
    if (!state.dragged && Math.hypot(dx, dy) >= 5) {
      state.dragged = true
      ball.classList.add('is-dragging')
    }
    if (!state.dragged) return
    var size = _floatingBallConfig ? _floatingBallConfig.size : ball.offsetWidth
    var bounds = getFloatingBallBounds(size)
    var left = Math.max(bounds.minX, Math.min(bounds.maxX, state.left + dx))
    var top = Math.max(bounds.minY, Math.min(bounds.maxY, state.top + dy))
    ball.style.left = Math.round(left) + 'px'
    ball.style.top = Math.round(top) + 'px'
    event.preventDefault()
  })
  var finish = async function(event) {
    if (!state || event.pointerId !== state.pointerId) return
    var dragged = state.dragged
    state = null
    ball.classList.remove('is-active', 'is-dragging')
    if (ball.hasPointerCapture(event.pointerId)) ball.releasePointerCapture(event.pointerId)
    if (dragged && _floatingBallConfig) {
      var bounds = getFloatingBallBounds(_floatingBallConfig.size)
      var left = parseFloat(ball.style.left) || bounds.minX
      var top = parseFloat(ball.style.top) || bounds.minY
      var xSpan = bounds.maxX - bounds.minX
      var ySpan = bounds.maxY - bounds.minY
      _floatingBallConfig.xRatio = xSpan > 0 ? (left - bounds.minX) / xSpan : 0
      _floatingBallConfig.yRatio = ySpan > 0 ? (top - bounds.minY) / ySpan : 0
      await saveFloatingBallConfig(_floatingBallConfig)
    } else if (!dragged) {
      openFloatingBallPresetPopup(ball)
    }
  }
  ball.addEventListener('pointerup', finish)
  ball.addEventListener('pointercancel', function(event) {
    if (!state || event.pointerId !== state.pointerId) return
    state = null
    ball.classList.remove('is-active', 'is-dragging')
  })
}

function closeFloatingBallPresetPopup() {
  var overlay = document.getElementById('floating-ball-popup-overlay')
  var popup = document.getElementById('floating-ball-preset-popup')
  if (overlay) overlay.remove()
  if (popup) popup.remove()
}

function returnToDesktopHome() {
  closeFloatingBallPresetPopup()
  var app = document.getElementById('app')
  if (!app) return
  Array.prototype.slice.call(app.children).forEach(function(node) {
    if (node && node.classList && node.classList.contains('full-page')) node.remove()
  })
  if (window.toast) window.toast('已返回主页')
}

function isMatchingApiPreset(preset, current) {
  return String(preset.url || '') === String(current.url || '') &&
    String(preset.key || '') === String(current.key || '') &&
    String(preset.model || '') === String(current.model || '')
}

async function openFloatingBallPresetPopup(ball) {
  closeFloatingBallPresetPopup()
  var app = document.getElementById('app')
  if (!app || !ball) return
  var activePages = Array.prototype.slice.call(app.querySelectorAll('.full-page:not(.is-closing)'))
  var activePage = activePages[activePages.length - 1]
  var showChatBeautyPreview = activePage && activePage.id === 'sub-chat-beauty-tutorial'
  var floatingBallConfig = await loadFloatingBallConfig()
  var showApiConsole = floatingBallConfig.apiConsoleEnabled === true
  var presetRow = await db.config.get('apiPresets')
  var presets = presetRow && Array.isArray(presetRow.value) ? presetRow.value : []
  var api = await loadApiConfig()
  var overlay = document.createElement('div')
  overlay.id = 'floating-ball-popup-overlay'
  overlay.className = 'floating-ball-popup-overlay'
  var popup = document.createElement('div')
  popup.id = 'floating-ball-preset-popup'
  popup.className = 'floating-ball-preset-popup'
  popup.setAttribute('role', 'dialog')
  popup.setAttribute('aria-label', 'API 预设快速切换')
  var contextLinks = []
  if (showChatBeautyPreview) {
    contextLinks.push('<button type="button" class="floating-ball-context-link" id="floating-ball-chat-beauty-preview"><span>展示预览</span></button>')
  }
  if (showApiConsole) {
    contextLinks.push('<button type="button" class="floating-ball-context-link" id="floating-ball-api-console"><span>API 控制台</span></button>')
  }
  var content = contextLinks.length
    ? contextLinks.join('') + '<div class="floating-ball-context-divider"></div>'
    : ''
  content +=
    '<div class="floating-ball-api-status">' +
      '<div><strong>主 API</strong><span>' +
        settingsEscHtml(api.primary.model || '尚未配置模型') +
      '</span></div>' +
    '</div>' +
    '<div class="floating-ball-popup-title">API 预设</div>'
  if (presets.length) {
    content += '<div class="floating-ball-preset-list">' + presets.map(function(preset, index) {
      var active = isMatchingApiPreset(preset, api.primary)
      return '<button type="button" class="floating-ball-preset-item' + (active ? ' is-current' : '') + '" data-preset-index="' + index + '">' +
        '<span>' + settingsEscHtml(preset.name || '未命名预设') + '</span>' +
        (active ? '<i class="fa-solid fa-check" aria-label="当前预设"></i>' : '') +
      '</button>'
    }).join('') + '</div>'
  } else {
    content += '<div class="floating-ball-preset-empty">尚未添加 API 预设</div>' +
      '<button type="button" class="floating-ball-config-link" id="floating-ball-open-api-config">前往 API 配置</button>'
  }
  content +=
    '<div class="floating-ball-popup-actions">' +
      '<button type="button" class="floating-ball-home-link" id="floating-ball-go-home">' +
        '<span>返回主页</span>' +
      '</button>' +
    '</div>'
  popup.innerHTML = content
  app.appendChild(overlay)
  app.appendChild(popup)
  overlay.addEventListener('click', closeFloatingBallPresetPopup)
  var previewLink = popup.querySelector('#floating-ball-chat-beauty-preview')
  if (previewLink) previewLink.addEventListener('click', function() {
    closeFloatingBallPresetPopup()
    var previewButton = activePage.querySelector('#btn-cbg-preview')
    if (previewButton) previewButton.click()
  })
  var apiConsoleLink = popup.querySelector('#floating-ball-api-console')
  if (apiConsoleLink) apiConsoleLink.addEventListener('click', function() {
    closeFloatingBallPresetPopup()
    openApiConsoleModal()
  })
  popup.querySelectorAll('[data-preset-index]').forEach(function(button) {
    button.addEventListener('click', async function() {
      var preset = presets[parseInt(button.getAttribute('data-preset-index'), 10)]
      if (!preset) return
      await applyFloatingBallApiPreset(preset)
      closeFloatingBallPresetPopup()
    })
  })
  var configLink = popup.querySelector('#floating-ball-open-api-config')
  if (configLink) configLink.addEventListener('click', function() {
    closeFloatingBallPresetPopup()
    openApiConfigPage()
  })
  var homeLink = popup.querySelector('#floating-ball-go-home')
  if (homeLink) homeLink.addEventListener('click', returnToDesktopHome)
  positionFloatingBallPopup(popup, ball)
}

function positionFloatingBallPopup(popup, ball) {
  var app = document.getElementById('app')
  var appRect = app.getBoundingClientRect()
  var ballRect = ball.getBoundingClientRect()
  var popupRect = popup.getBoundingClientRect()
  var margin = 10
  var safeTop = getFloatingBallSafeTop() + margin
  var left = ballRect.left + ballRect.width / 2 - popupRect.width / 2
  left = Math.max(margin, Math.min(appRect.width - popupRect.width - margin, left))
  var spaceBelow = appRect.height - ballRect.bottom
  var top = spaceBelow >= popupRect.height + margin
    ? ballRect.bottom + margin
    : ballRect.top - popupRect.height - margin
  top = Math.max(safeTop, Math.min(appRect.height - popupRect.height - margin, top))
  popup.style.left = Math.round(left) + 'px'
  popup.style.top = Math.round(top) + 'px'
}

async function applyFloatingBallApiPreset(preset) {
  await Promise.all([
    db.config.put({ key: 'apiBaseUrl', value: preset.url || '' }),
    db.config.put({ key: 'apiKey', value: preset.key || '' }),
    db.config.put({ key: 'apiModel', value: preset.model || '' })
  ])
  window._apiConfigCache = null
  var settingsPage = document.getElementById('settings-page')
  if (settingsPage) await updateRowValues(settingsPage)
  window.toast('已切换主 API：' + (preset.name || '未命名预设'))
}

function openFloatingBallPage() {
  var html =
    '<div class="setting-section">' +
      '<div class="list-row" data-action="toggle">' +
        '<div class="row-icon-box"><i class="fa-solid fa-power-off"></i></div>' +
        '<div class="row-body"><div class="row-label">开启悬浮球</div><div class="row-sub">在所有界面显示</div></div>' +
        '<label class="toggle-wrap"><input type="checkbox" id="toggle-floating-ball"><div class="toggle-track"></div><div class="toggle-thumb"></div></label>' +
      '</div>' +
      '<div class="list-row" data-action="toggle-api-console">' +
        '<div class="row-icon-box"><i class="fa-solid fa-terminal"></i></div>' +
        '<div class="row-body"><div class="row-label">显示 API 控制台</div><div class="row-sub">仅记录本次运行的最近50条记录</div></div>' +
        '<label class="toggle-wrap"><input type="checkbox" id="toggle-api-console"><div class="toggle-track"></div><div class="toggle-thumb"></div></label>' +
      '</div>' +
      '<div class="list-row clickable" id="btn-floating-ball-image">' +
        '<div class="row-icon-box"><i class="fa-solid fa-image"></i></div>' +
        '<div class="row-body"><div class="row-label">替换图片样式</div><div class="row-sub">从本地文件或 URL 导入</div></div>' +
        '<i class="fa fa-angle-right row-chevron"></i>' +
      '</div>' +
      '<div class="list-row clickable" id="btn-floating-ball-reset-image">' +
        '<div class="row-icon-box"><i class="fa fa-undo"></i></div>' +
        '<div class="row-body"><div class="row-label">恢复默认图片</div></div>' +
        '<i class="fa fa-angle-right row-chevron"></i>' +
      '</div>' +
    '</div>' +
    '<div class="setting-section"><div class="floating-ball-controls">' +
      '<label class="floating-ball-control"><span>大小</span><output id="floating-ball-size-value">56px</output>' +
        '<input type="range" id="floating-ball-size" min="36" max="120" step="1"></label>' +
      '<label class="floating-ball-control"><span>未激活状态透明度</span><output id="floating-ball-opacity-value">65%</output>' +
        '<input type="range" id="floating-ball-opacity" min="20" max="100" step="1"></label>' +
    '</div></div>' +
    '<div class="setting-section floating-ball-css-section">' +
      '<div class="floating-ball-css-header"><div class="row-label">自定义悬浮球 CSS</div>' +
        '<button class="btn-ghost btn-sm" id="btn-copy-floating-ball-class" type="button"><i class="fa-regular fa-copy"></i> 复制 CSS 模板</button></div>' +
      '<textarea class="input-field floating-ball-css-input" id="floating-ball-custom-css" spellcheck="false" ' +
        'placeholder=".global-floating-ball {&#10;  border-radius: 8px;&#10;  background: transparent;&#10;}"></textarea>' +
      '<div class="floating-ball-css-actions">' +
        '<button class="btn-ghost" id="btn-clear-floating-ball-css" type="button">清除 CSS</button>' +
        '<button class="btn-pill" id="btn-save-floating-ball-css" type="button">保存 CSS</button>' +
      '</div>' +
    '</div>'
  var page = buildSubPage('sub-floating-ball', '悬浮球', html)
  openSubPage(page)
  initFloatingBallPage(page)
}

async function initFloatingBallPage(page) {
  var config = Object.assign({}, await loadFloatingBallConfig())
  var toggle = page.querySelector('#toggle-floating-ball')
  var apiConsoleToggle = page.querySelector('#toggle-api-console')
  var size = page.querySelector('#floating-ball-size')
  var opacity = page.querySelector('#floating-ball-opacity')
  var sizeValue = page.querySelector('#floating-ball-size-value')
  var opacityValue = page.querySelector('#floating-ball-opacity-value')
  var cssInput = page.querySelector('#floating-ball-custom-css')
  var syncControls = function() {
    toggle.checked = config.enabled
    apiConsoleToggle.checked = config.apiConsoleEnabled
    size.value = config.size
    opacity.value = Math.round(config.opacity * 100)
    sizeValue.textContent = config.size + 'px'
    opacityValue.textContent = Math.round(config.opacity * 100) + '%'
    cssInput.value = config.customCss || ''
  }
  var persistAndRender = async function(position) {
    var ball = document.getElementById('global-floating-ball')
    if (ball && position) preserveFloatingBallPixelPosition(ball, config, position)
    config = Object.assign({}, await saveFloatingBallConfig(config))
    await renderFloatingBall()
    var settingsPage = document.getElementById('settings-page')
    if (settingsPage) await updateRowValues(settingsPage)
  }
  syncControls()
  toggle.addEventListener('change', async function() {
    var ball = document.getElementById('global-floating-ball')
    var position = getFloatingBallPixelPosition(ball)
    config.enabled = toggle.checked
    await persistAndRender(position)
    window.toast(toggle.checked ? '已开启悬浮球' : '已关闭悬浮球')
  })
  apiConsoleToggle.addEventListener('change', async function() {
    var ball = document.getElementById('global-floating-ball')
    var position = getFloatingBallPixelPosition(ball)
    config.apiConsoleEnabled = apiConsoleToggle.checked
    if (!config.apiConsoleEnabled) clearApiConsoleRecords()
    await persistAndRender(position)
    window.toast(config.apiConsoleEnabled ? '已开启 API 控制台' : '已关闭 API 控制台并清空记录')
  })
  page.querySelector('#btn-floating-ball-image').addEventListener('click', function() {
    window.showImagePicker(async function(imageUrl) {
      var ball = document.getElementById('global-floating-ball')
      var position = getFloatingBallPixelPosition(ball)
      config.image = imageUrl
      await persistAndRender(position)
      window.toast('悬浮球图片已更新')
    })
  })
  page.querySelector('#btn-floating-ball-reset-image').addEventListener('click', async function() {
    var ball = document.getElementById('global-floating-ball')
    var position = getFloatingBallPixelPosition(ball)
    config.image = FLOATING_BALL_DEFAULT_IMAGE
    await persistAndRender(position)
    window.toast('已恢复默认悬浮球图片')
  })
  size.addEventListener('input', function() {
    var ball = document.getElementById('global-floating-ball')
    var position = getFloatingBallPixelPosition(ball)
    config.size = parseInt(size.value, 10)
    sizeValue.textContent = config.size + 'px'
    preserveFloatingBallPixelPosition(ball, config, position)
    applyFloatingBallAppearance(ball, config)
  })
  size.addEventListener('change', function() {
    var ball = document.getElementById('global-floating-ball')
    persistAndRender(getFloatingBallPixelPosition(ball))
  })
  opacity.addEventListener('input', function() {
    var ball = document.getElementById('global-floating-ball')
    var position = getFloatingBallPixelPosition(ball)
    config.opacity = parseInt(opacity.value, 10) / 100
    opacityValue.textContent = opacity.value + '%'
    preserveFloatingBallPixelPosition(ball, config, position)
    applyFloatingBallAppearance(ball, config)
  })
  opacity.addEventListener('change', function() {
    var ball = document.getElementById('global-floating-ball')
    persistAndRender(getFloatingBallPixelPosition(ball))
  })
  page.querySelector('#btn-copy-floating-ball-class').addEventListener('click', async function() {
    try {
      await copyFloatingBallText(FLOATING_BALL_CSS_TEMPLATE)
      window.toast('悬浮球 CSS 模板已复制')
    } catch (err) {
      window.toast('复制失败，请手动复制')
    }
  })
  page.querySelector('#btn-save-floating-ball-css').addEventListener('click', async function() {
    try {
      parseFloatingBallCustomCss(cssInput.value)
      var ball = document.getElementById('global-floating-ball')
      var position = getFloatingBallPixelPosition(ball)
      config.customCss = cssInput.value.trim()
      await persistAndRender(position)
      window.toast('悬浮球 CSS 已保存')
    } catch (err) {
      window.toast('CSS 保存失败：' + err.message)
    }
  })
  page.querySelector('#btn-clear-floating-ball-css').addEventListener('click', async function() {
    var ball = document.getElementById('global-floating-ball')
    var position = getFloatingBallPixelPosition(ball)
    config.customCss = ''
    cssInput.value = ''
    applyFloatingBallCustomCss('')
    await persistAndRender(position)
    window.toast('已清除悬浮球 CSS')
  })
}

function copyFloatingBallText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text)
  }
  var textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
  document.body.appendChild(textarea)
  textarea.select()
  var copied = document.execCommand('copy')
  textarea.remove()
  return copied ? Promise.resolve() : Promise.reject(new Error('copy failed'))
}

// ===== API 调试控制台（仅内存、仅响应侧数据） =====
var API_CONSOLE_MAX_RECORDS = 50
var _apiConsoleRecords = []
var _apiConsoleListeners = []
var _apiConsoleModalUnsubscribe = null

function getApiConsoleRecords() {
  return _apiConsoleRecords.slice()
}

function notifyApiConsoleListeners() {
  _apiConsoleListeners.slice().forEach(function(listener) {
    try { listener(getApiConsoleRecords()) } catch (_) {}
  })
}

function subscribeApiConsole(listener) {
  if (typeof listener !== 'function') return function() {}
  _apiConsoleListeners.push(listener)
  return function() {
    _apiConsoleListeners = _apiConsoleListeners.filter(function(item) { return item !== listener })
  }
}

function clearApiConsoleRecords() {
  _apiConsoleRecords = []
  notifyApiConsoleListeners()
}

function addApiConsoleRecord(record) {
  if (!record || typeof record !== 'object') return
  _apiConsoleRecords.unshift(record)
  if (_apiConsoleRecords.length > API_CONSOLE_MAX_RECORDS) {
    _apiConsoleRecords.length = API_CONSOLE_MAX_RECORDS
  }
  notifyApiConsoleListeners()
}

function normalizeApiConsoleToken(value) {
  var number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

function readApiConsoleUsage(json) {
  var usage = json && json.usage && typeof json.usage === 'object' ? json.usage : {}
  var input = normalizeApiConsoleToken(usage.prompt_tokens)
  if (input == null) input = normalizeApiConsoleToken(usage.input_tokens)
  var output = normalizeApiConsoleToken(usage.completion_tokens)
  if (output == null) output = normalizeApiConsoleToken(usage.output_tokens)
  var total = normalizeApiConsoleToken(usage.total_tokens)
  if (total == null && input != null && output != null) total = input + output
  return { input: input, output: output, total: total }
}

function formatApiConsoleResponseValue(value) {
  if (typeof value === 'string') return value
  if (value == null) return ''
  try { return JSON.stringify(value, null, 2) } catch (_) { return String(value) }
}

var API_CONSOLE_SENSITIVE_KEYS = {
  messages: true,
  system: true,
  prompt: true,
  input: true,
  instructions: true,
  body: true,
  request: true,
  requestbody: true,
  request_body: true,
  authorization: true,
  headers: true,
  apikey: true,
  api_key: true
}

function sanitizeApiConsoleString(value, apiKey) {
  var text = String(value == null ? '' : value)
  if (apiKey) text = text.split(String(apiKey)).join('[已隐藏 API Key]')
  text = text.replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, 'Bearer [已隐藏]')
  if (/"(?:messages|system|prompt|input|instructions)"\s*:/i.test(text)) {
    return '[错误响应包含请求内容，已隐藏以保护提示词]'
  }
  return text
}

function sanitizeApiConsoleErrorValue(value, apiKey, depth) {
  if (depth > 8) return '[内容层级过深，已省略]'
  if (typeof value === 'string') return sanitizeApiConsoleString(value, apiKey)
  if (value == null || typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) {
    return value.map(function(item) { return sanitizeApiConsoleErrorValue(item, apiKey, depth + 1) })
  }
  if (typeof value !== 'object') return String(value)
  var clean = {}
  Object.keys(value).forEach(function(key) {
    var normalizedKey = String(key).toLowerCase().replace(/[-\s]/g, '_')
    var compactKey = normalizedKey.replace(/_/g, '')
    if (API_CONSOLE_SENSITIVE_KEYS[normalizedKey] || API_CONSOLE_SENSITIVE_KEYS[compactKey]) {
      clean[key] = '[已隐藏请求或鉴权内容]'
      return
    }
    clean[key] = sanitizeApiConsoleErrorValue(value[key], apiKey, depth + 1)
  })
  return clean
}

function buildApiConsoleErrorText(rawText, parsed, apiKey, fallback) {
  var safe
  if (parsed && typeof parsed === 'object') {
    safe = sanitizeApiConsoleErrorValue(parsed, apiKey, 0)
    try { return JSON.stringify(safe, null, 2) } catch (_) {}
  }
  var text = rawText || fallback || '未知错误'
  return sanitizeApiConsoleString(text, apiKey)
}

function formatApiConsoleTime(timestamp) {
  try {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    })
  } catch (_) {
    return ''
  }
}

function formatApiConsoleToken(value) {
  return value == null ? '接口未提供' : String(value)
}

function buildApiConsoleRecordHTML(record) {
  var stateLabel = record.ok ? '成功' : '失败'
  var statusText = record.status == null ? '无 HTTP 状态' : 'HTTP ' + record.status
  var detailTitle = record.ok ? 'API 模型返回真实数据' : 'API 真实报错信息'
  var detailText = record.ok ? record.content : record.error
  var reasoningHtml = record.ok && record.reasoning
    ? '<div class="api-console-detail-label">Reasoning Content</div><pre>' + settingsEscHtml(record.reasoning) + '</pre>'
    : ''
  return '<details class="api-console-record ' + (record.ok ? 'is-success' : 'is-error') + '">' +
    '<summary>' +
      '<span class="api-console-state">' + stateLabel + '</span>' +
      '<span class="api-console-source">' + settingsEscHtml(record.apiType || '文本生成 API') + '</span>' +
      '<span class="api-console-time">' + settingsEscHtml(formatApiConsoleTime(record.createdAt)) + '</span>' +
    '</summary>' +
    '<div class="api-console-record-body">' +
      '<div class="api-console-meta-grid">' +
        '<div><span>状态</span><strong>' + settingsEscHtml(statusText) + '</strong></div>' +
        '<div><span>耗时</span><strong>' + Math.max(0, Number(record.durationMs) || 0) + ' ms</strong></div>' +
        '<div class="api-console-meta-wide"><span>真实模型</span><strong>' + settingsEscHtml(record.model || '接口未提供') + '</strong></div>' +
        '<div><span>输入 Token</span><strong>' + settingsEscHtml(formatApiConsoleToken(record.tokens && record.tokens.input)) + '</strong></div>' +
        '<div><span>输出 Token</span><strong>' + settingsEscHtml(formatApiConsoleToken(record.tokens && record.tokens.output)) + '</strong></div>' +
        '<div class="api-console-meta-wide"><span>总 Token</span><strong>' + settingsEscHtml(formatApiConsoleToken(record.tokens && record.tokens.total)) + '</strong></div>' +
      '</div>' +
      '<div class="api-console-detail-label">' + detailTitle + '</div>' +
      '<pre>' + settingsEscHtml(detailText || (record.ok ? '（空内容）' : '未知错误')) + '</pre>' +
      reasoningHtml +
    '</div>' +
  '</details>'
}

function renderApiConsoleRecords(container) {
  if (!container) return
  var records = getApiConsoleRecords()
  container.innerHTML = records.length
    ? records.map(buildApiConsoleRecordHTML).join('')
    : '<div class="api-console-empty">暂无记录<br><span>开启后产生的文本生成 API 响应会显示在这里</span></div>'
}

function openApiConsoleModal() {
  if (_apiConsoleModalUnsubscribe) {
    _apiConsoleModalUnsubscribe()
    _apiConsoleModalUnsubscribe = null
  }
  var oldOverlay = document.getElementById('api-console-overlay')
  var oldModal = document.getElementById('api-console-modal')
  if (oldOverlay) oldOverlay.remove()
  if (oldModal) oldModal.remove()
  var app = document.getElementById('app')
  if (!app) return
  var overlay = document.createElement('div')
  overlay.id = 'api-console-overlay'
  overlay.className = 'api-console-overlay'
  var modal = document.createElement('div')
  modal.id = 'api-console-modal'
  modal.className = 'api-console-modal'
  modal.setAttribute('role', 'dialog')
  modal.setAttribute('aria-modal', 'true')
  modal.setAttribute('aria-label', 'API 控制台')
  modal.innerHTML =
    '<div class="api-console-header">' +
      '<div><div class="api-console-title">API 控制台</div><div class="api-console-subtitle">本次运行至多保留 50 条记录</div></div>' +
      '<button type="button" class="api-console-close" id="api-console-close" aria-label="关闭">×</button>' +
    '</div>' +
    '<div class="api-console-records" id="api-console-records"></div>' +
    '<div class="api-console-actions">' +
      '<button type="button" class="btn-ghost" id="api-console-clear">清空记录</button>' +
      '<button type="button" class="btn-pill" id="api-console-done">关闭</button>' +
    '</div>'
  app.appendChild(overlay)
  app.appendChild(modal)
  var recordsContainer = modal.querySelector('#api-console-records')
  renderApiConsoleRecords(recordsContainer)
  var unsubscribe = subscribeApiConsole(function() { renderApiConsoleRecords(recordsContainer) })
  _apiConsoleModalUnsubscribe = unsubscribe
  var close = function() {
    unsubscribe()
    if (_apiConsoleModalUnsubscribe === unsubscribe) _apiConsoleModalUnsubscribe = null
    overlay.remove()
    modal.remove()
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#api-console-close').addEventListener('click', close)
  modal.querySelector('#api-console-done').addEventListener('click', close)
  modal.querySelector('#api-console-clear').addEventListener('click', clearApiConsoleRecords)
}

// ===== 启动时加载壁纸和字体 =====
window.loadPersonalization = async function() {
  var darkCfg = await db.config.get('darkModeEnabled')
  applyDarkMode(!!(darkCfg && darkCfg.value))
  var cfg = await db.config.get('wallpaperData')
  if (cfg && cfg.value) window.setWallpaper(cfg.value)
  // 加载字体
  var fontState = await resolveStoredActiveFont()
  if (fontState.activeFont && fontState.activeFont.name) {
    var font = fontState.activeFont
    if (!hasLocalFontData(font) && font.url) {
      try {
        font = await downloadFontForStorage(font.name, font.url)
        font.id = font.id || fontState.activeFontId || generateStoredFontId()
        for (var i = 0; i < fontState.fonts.length; i++) {
          if (fontState.fonts[i] && fontState.fonts[i].id === font.id) {
            fontState.fonts[i] = font
            break
          }
        }
        await saveStoredFonts(fontState.fonts)
      } catch (err) {
        font = fontState.activeFont
      }
    }
    injectFontStylesheet(font)
    document.documentElement.style.setProperty('--font-custom', '"' + font.name + '"')
    document.documentElement.style.setProperty('--font',
      '"' + font.name + '", -apple-system, "PingFang SC", sans-serif')
  }
  // 加载字体大小和字间距
  var sizeCfg = await db.config.get('fontSizeBody')
  if (sizeCfg && sizeCfg.value) {
    document.documentElement.style.setProperty('--font-size-body', sizeCfg.value + 'px')
  }
  var spacingCfg = await db.config.get('letterSpacingBody')
  if (spacingCfg && spacingCfg.value != null) {
    document.documentElement.style.setProperty('--letter-spacing-body', spacingCfg.value + 'em')
  }
  await renderFloatingBall()
}

// ===== API配置内存缓存 =====
window._apiConfigCache = null
window._memoryApiConfigCache = null
window._gameApiConfigCache = null
window._imageGenConfigCache = null
window._aiTemperaturePresetCache = null
var _editsEndpointSupported = true

var AI_TEMPERATURE_PRESET_DEFINITIONS = [
  { key: 'wechatPrivate', label: '微信私聊', value: 0.35 },
  { key: 'wechatGroup', label: '微信群聊', value: 0.4 },
  { key: 'wechatCall', label: '微信通话', value: 0.4 },
  { key: 'wechatMoments', label: '微信朋友圈', value: 0.85 },
  { key: 'wechatWallet', label: '微信钱包余额', value: 0.2 },
  { key: 'phoneSnapshot', label: '查手机微信生成', value: 0.5 },
  { key: 'offlineMode', label: '线下模式', value: 0.55 },
  { key: 'summaryMode', label: '总结模式', value: 0.2 },
  { key: 'icityDiary', label: 'iCity日记', value: 0.9 },
  { key: 'insPost', label: 'INS发帖', value: 0.85 },
  { key: 'insComment', label: 'INS评论', value: 0.9 },
  { key: 'anywhereDoorHtml', label: '任意门HTML', value: 0.8 },
  { key: 'readenNovel', label: 'Readen小说攥写', value: 0.7 },
  { key: 'qianjiWorkEvaluation', label: '钱迹工作能力评估', value: 0.3 }
]

function normalizeTemperaturePresetValue(value, fallback) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return fallback
  var parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 2) return fallback
  return Math.round(parsed * 100) / 100
}

async function loadAITemperaturePresets() {
  if (window._aiTemperaturePresetCache) return window._aiTemperaturePresetCache
  var row = await db.config.get('apiTemperaturePresetsV1')
  var saved = row && row.value && typeof row.value === 'object' ? row.value : {}
  var normalized = {}
  AI_TEMPERATURE_PRESET_DEFINITIONS.forEach(function(definition) {
    normalized[definition.key] = normalizeTemperaturePresetValue(saved[definition.key], definition.value)
  })
  window._aiTemperaturePresetCache = normalized
  return normalized
}

window.getAITemperaturePreset = async function(key) {
  var definition = AI_TEMPERATURE_PRESET_DEFINITIONS.find(function(item) { return item.key === key })
  if (!definition) throw new Error('未知的温度预设：' + key)
  var presets = await loadAITemperaturePresets()
  return presets[key]
}

function formatTemperaturePresetValue(value) {
  return Number(value).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

function initTemperaturePresetSection(page) {
  var header = page.querySelector('#btn-temperature-presets')
  var body = page.querySelector('#temperature-preset-body')
  if (!header || !body) return
  var rendered = false
  var renderBody = async function() {
    var values = await loadAITemperaturePresets()
    body.innerHTML =
      '<div class="temperature-preset-list">' +
        AI_TEMPERATURE_PRESET_DEFINITIONS.map(function(definition) {
          var value = values[definition.key]
          return '<label class="temperature-preset-row">' +
            '<span class="temperature-preset-label">' + settingsEscHtml(definition.label) + '</span>' +
            '<span class="temperature-preset-control">' +
              '<input type="range" min="0" max="2" step="0.05" value="' + value + '" data-temperature-key="' + definition.key + '">' +
              '<span class="temperature-preset-value">' + formatTemperaturePresetValue(value) + '</span>' +
            '</span>' +
          '</label>'
        }).join('') +
      '</div>' +
      '<div class="temperature-preset-actions">' +
        '<button class="btn-pill btn-full" id="temperature-preset-save" type="button">保存</button>' +
      '</div>'
    body.querySelectorAll('[data-temperature-key]').forEach(function(input) {
      input.addEventListener('input', function() {
        input.parentElement.querySelector('.temperature-preset-value').textContent = formatTemperaturePresetValue(input.value)
      })
    })
    body.querySelector('#temperature-preset-save').addEventListener('click', async function() {
      var saveButton = body.querySelector('#temperature-preset-save')
      var next = {}
      body.querySelectorAll('[data-temperature-key]').forEach(function(input) {
        var definition = AI_TEMPERATURE_PRESET_DEFINITIONS.find(function(item) { return item.key === input.dataset.temperatureKey })
        next[input.dataset.temperatureKey] = normalizeTemperaturePresetValue(input.value, definition.value)
      })
      saveButton.disabled = true
      try {
        await db.config.put({ key: 'apiTemperaturePresetsV1', value: next })
        window._aiTemperaturePresetCache = null
        window.toast('温度预设已保存')
      } catch (error) {
        window.toast('温度预设保存失败：' + (error.message || error))
      } finally {
        saveButton.disabled = false
      }
    })
  }
  header.addEventListener('click', async function() {
    var expanded = body.style.display !== 'none'
    if (expanded) {
      body.style.display = 'none'
      header.classList.remove('expanded')
      return
    }
    if (!rendered) {
      rendered = true
      await renderBody()
    }
    body.style.display = ''
    header.classList.add('expanded')
  })
}

// ===== 读取API配置（带缓存） =====
async function loadApiConfig() {
  if (window._apiConfigCache) return window._apiConfigCache
  var keys = ['apiBaseUrl', 'apiKey', 'apiModel']
  var rows = await db.config.bulkGet(keys)
  var v = function(row) { return row ? row.value : null }
  window._apiConfigCache = {
    primary: { url: v(rows[0]), key: v(rows[1]), model: v(rows[2]) }
  }
  return window._apiConfigCache
}

// ===== 读取记忆专属 API 配置（带缓存） =====
window.loadMemoryApiConfig = async function(noCache) {
  if (!noCache && window._memoryApiConfigCache) return window._memoryApiConfigCache
  var rows = await db.config.bulkGet([
    'memoryApiBaseUrl', 'memoryApiKey', 'memoryApiModel'
  ])
  var v = function(row) { return row ? row.value : '' }
  var cfg = {
    url: normalizeApiBaseUrl(v(rows[0])),
    key: String(v(rows[1]) || '').trim(),
    model: String(v(rows[2]) || '').trim()
  }
  cfg.complete = !!(cfg.url && cfg.key && cfg.model)
  if (!noCache) window._memoryApiConfigCache = cfg
  return cfg
}

// ===== 读取 MCP 跑腿助理专属 API 配置（带缓存） =====
// 留空即回退主 API；跑腿助理只做「判断该不该调工具」和「把结果说成人话」，配便宜模型即可。
window.loadMcpApiConfig = async function(noCache) {
  if (!noCache && window._mcpApiConfigCache) return window._mcpApiConfigCache
  var rows = await db.config.bulkGet([
    'mcpApiBaseUrl', 'mcpApiKey', 'mcpApiModel'
  ])
  var v = function(row) { return row ? row.value : '' }
  var cfg = {
    url: normalizeApiBaseUrl(v(rows[0])),
    key: String(v(rows[1]) || '').trim(),
    model: String(v(rows[2]) || '').trim()
  }
  cfg.complete = !!(cfg.url && cfg.key && cfg.model)
  if (!noCache) window._mcpApiConfigCache = cfg
  return cfg
}

// ===== 读取游戏大厅专属 API 配置（带缓存） =====
async function loadGameApiConfig() {
  if (window._gameApiConfigCache) return window._gameApiConfigCache
  var rows = await db.config.bulkGet([
    'gameApiBaseUrl', 'gameApiKey', 'gameApiModel', 'gameApiTemperature'
  ])
  var v = function(row) { return row ? row.value : null }
  window._gameApiConfigCache = {
    url: normalizeApiBaseUrl(v(rows[0])),
    key: v(rows[1]) || '',
    model: v(rows[2]) || '',
    temp: v(rows[3]) == null ? 0.7 : v(rows[3])
  }
  return window._gameApiConfigCache
}
window.loadGameApiConfig = loadGameApiConfig

// ===== 读取IMAGE生成配置（带缓存） =====
async function loadImageGenConfig(noCache) {
  if (!noCache && window._imageGenConfigCache) return window._imageGenConfigCache
  var rows = await Promise.all([
    db.config.get('imageGenApiUrl'),
    db.config.get('imageGenApiKey'),
    db.config.get('imageGenModel'),
    db.config.get('imageGenSize')
  ])
  var v = function(row) { return row ? row.value : '' }
  var cfg = {
    url: normalizeApiBaseUrl(v(rows[0])),
    key: v(rows[1]) || '',
    model: v(rows[2]) || '',
    size: v(rows[3]) || '1024x1024'
  }
  if (!noCache) window._imageGenConfigCache = cfg
  return cfg
}

function getImageGenerationUrl(url) {
  var clean = normalizeApiBaseUrl(url)
  if (!clean) return ''
  if (/\/chat\/completions$/i.test(clean)) {
    return clean.replace(/\/chat\/completions$/i, '/images/generations')
  }
  if (/\/images\/generations$/i.test(clean)) return clean
  return clean + '/images/generations'
}

function getImageEditsUrl(url) {
  var clean = normalizeApiBaseUrl(url)
  if (!clean) return ''
  if (/\/chat\/completions$/i.test(clean)) {
    return clean.replace(/\/chat\/completions$/i, '/images/edits')
  }
  if (/\/images\/generations$/i.test(clean)) {
    return clean.replace(/\/images\/generations$/i, '/images/edits')
  }
  if (/\/images\/edits$/i.test(clean)) return clean
  return clean + '/images/edits'
}

function getImageModelsUrl(url) {
  var clean = normalizeApiBaseUrl(url)
  if (!clean) return ''
  if (/\/chat\/completions$/i.test(clean)) return clean.replace(/\/chat\/completions$/i, '/models')
  if (/\/images\/generations$/i.test(clean)) return clean.replace(/\/images\/generations$/i, '/models')
  if (/\/images\/edits$/i.test(clean)) return clean.replace(/\/images\/edits$/i, '/models')
  if (/\/models$/i.test(clean)) return clean
  return clean + '/models'
}

function parseModelList(json) {
  if (!json) return []
  if (Array.isArray(json.data)) {
    return json.data.map(function(m) { return m && m.id }).filter(Boolean)
  }
  if (Array.isArray(json.models)) {
    return json.models.map(function(m) {
      var name = m && (m.name || m.id)
      return name ? String(name).replace(/^models\//, '') : ''
    }).filter(Boolean)
  }
  return []
}

function renderImageGenModelOptions(page, models, placeholder) {
  var selectEl = page.querySelector('#image-gen-model')
  if (!selectEl) return
  selectEl.innerHTML = '<option value="">' + settingsEscHtml(placeholder || '选择常用模型') + '</option>' +
    models.map(function(m) {
      return '<option value="' + settingsEscHtml(m) + '">' + settingsEscHtml(m) + '</option>'
    }).join('')
  var inputEl = page.querySelector('#image-gen-model-input')
  if (inputEl && inputEl.value) syncModelSelectOption(page, 'image-gen', inputEl.value)
}

async function loadImageGenModelList(page) {
  var urlEl = page.querySelector('#image-gen-api-url')
  var keyEl = page.querySelector('#image-gen-api-key')
  if (!urlEl || !urlEl.value) { window.toast('请先填写 API URL'); return }
  try {
    var url = getImageModelsUrl(urlEl.value)
    var isGeminiApi = /generativelanguage\.googleapis\.com/i.test(url)
    var headers = isGeminiApi
      ? { 'x-goog-api-key': keyEl ? keyEl.value : '' }
      : { Authorization: 'Bearer ' + (keyEl ? keyEl.value : '') }
    var res = await fetch(url, { headers: headers })
    var json = await res.json()
    if (!res.ok) throw new Error((json && json.error && (json.error.message || json.error)) || ('HTTP ' + res.status))
    var models = parseModelList(json)
    renderImageGenModelOptions(page, models.length ? models : IMAGE_GEN_MODELS, models.length ? '拉取后选择模型' : '选择常用模型')
    window.toast(models.length ? ('已加载 ' + models.length + ' 个图片模型') : '未拉取到模型，已显示常用列表')
  } catch (e) {
    renderImageGenModelOptions(page, IMAGE_GEN_MODELS, '选择常用模型')
    window.toast('获取图片模型失败：' + e.message)
  }
}

function dataURLtoBlob(dataURL) {
  var parts = String(dataURL || '').split(',')
  if (parts.length < 2) throw new Error('参考图格式无效')
  var meta = parts[0]
  var data = parts.slice(1).join(',')
  var mimeMatch = meta.match(/^data:([^;]+);base64$/i)
  if (!mimeMatch) throw new Error('参考图必须是 base64 data URL')
  var binary = atob(data)
  var bytes = new Uint8Array(binary.length)
  for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeMatch[1] || 'image/png' })
}

function readImageGenFormConfig(page) {
  var get = function(id) { return ((page.querySelector('#' + id) || {}).value || '').trim() }
  return {
    url: normalizeApiBaseUrl(get('image-gen-api-url')),
    key: get('image-gen-api-key'),
    model: get('image-gen-model-input'),
    size: get('image-gen-size') || '1024x1024'
  }
}

async function saveImageGenConfig(page) {
  var cfg = readImageGenFormConfig(page)
  var missing = findMissingSettingsFields([
    { el: page.querySelector('#image-gen-api-url'), label: 'API URL' },
    { el: page.querySelector('#image-gen-api-key'), label: 'API Key' },
    { el: page.querySelector('#image-gen-model-input'), label: '图片模型' },
    { el: page.querySelector('#image-gen-size'), label: '默认尺寸' }
  ])
  if (showIncompleteSettingsSave(missing, 'IMAGE 图像配置')) return
  try {
    await Promise.all([
      db.config.put({ key: 'imageGenApiUrl', value: cfg.url }),
      db.config.put({ key: 'imageGenApiKey', value: cfg.key }),
      db.config.put({ key: 'imageGenModel', value: cfg.model }),
      db.config.put({ key: 'imageGenSize', value: cfg.size })
    ])
    window._imageGenConfigCache = null
    var settingsPage = document.getElementById('settings-page')
    if (settingsPage) await updateRowValues(settingsPage)
    window.toast('IMAGE 图像配置已保存')
  } catch (error) {
    window.toast('IMAGE 图像配置保存失败：' + (error.message || error))
  }
}

function validateImageGenConfig(cfg) {
  if (!cfg.url) throw new Error('请先填写 API URL')
  if (!cfg.key) throw new Error('请先填写 API Key')
  if (!cfg.model) throw new Error('请先选择或填写图片模型')
}

function parseImageGenerationResult(json) {
  var item = json && json.data && json.data[0]
  if (!item) return ''
  if (item.url) return item.url
  if (item.b64_json) return 'data:image/png;base64,' + item.b64_json
  return ''
}

async function generateImageWithConfig(cfg, prompt, opts) {
  opts = opts || {}
  validateImageGenConfig(cfg)
  if (!prompt) throw new Error('图片提示词为空')
  var model = opts.model || cfg.model || 'gpt-image-1'
  var n = opts.n || 1
  var size = opts.size || cfg.size || '1024x1024'
  if (opts.referenceImage && _editsEndpointSupported) {
    try {
      var form = new FormData()
      form.append('model', model)
      form.append('prompt', String(prompt))
      form.append('n', String(n))
      form.append('size', size)
      form.append('image', dataURLtoBlob(opts.referenceImage), 'reference.png')
      var editRes = await fetch(getImageEditsUrl(cfg.url), {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + cfg.key },
        body: form
      })
      if (editRes.ok) {
        var editJson = await readApiTestJsonResponse(editRes, '图片编辑失败')
        var editImage = parseImageGenerationResult(editJson)
        if (!editImage) throw new Error('图片编辑接口没有返回可用图片。')
        return editImage
      }
      var editText = ''
      try { editText = await editRes.text() } catch (e) {}
      _editsEndpointSupported = false
      console.warn('[ImageGen] images/edits endpoint failed; falling back to generations:', editRes.status, editText)
    } catch (e) {
      _editsEndpointSupported = false
      console.warn('[ImageGen] images/edits endpoint unavailable; falling back to generations:', e)
    }
  }
  var body = {
    model: model,
    prompt: String(prompt),
    n: n,
    size: size
  }
  if (opts.quality) body.quality = opts.quality
  if (opts.style) body.style = opts.style
  // 默认请求 b64_json：远程 URL 直链多数没有 CORS 头，浏览器下载必失败，
  // base64 直接落地可绕开。部分模型/网关不认这个参数（有的报错、有的直接空回，
  // 报错格式五花八门没法可靠匹配），所以首次任何失败都去掉该字段重试一次，
  // 重试仍失败才抛给调用方。
  var injectedResponseFormat = !opts.responseFormat
  body.response_format = opts.responseFormat || 'b64_json'
  var doGenerate = async function() {
    var res = await fetch(getImageGenerationUrl(cfg.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.key },
      body: JSON.stringify(body)
    })
    var json = await readApiTestJsonResponse(res, '图片生成失败')
    var image = parseImageGenerationResult(json)
    if (!image) throw new Error('图片生成接口没有返回可用图片。')
    return image
  }
  try {
    return await doGenerate()
  } catch (e) {
    if (!injectedResponseFormat) throw e
    delete body.response_format
    return await doGenerate()
  }
}

// 从 chat/completions 响应中提取文本内容（兼容 content 为字符串或多段数组的网关）
function extractChatCompletionText(json) {
  var msg = json && json.choices && json.choices[0] && json.choices[0].message
  if (!msg) return ''
  var content = msg.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content.map(function(part) {
      if (typeof part === 'string') return part
      if (part && typeof part.text === 'string') return part.text
      return ''
    }).join('')
  }
  return ''
}

// 记录最近一次 AI 响应的元数据（单一变量整体覆盖，不随轮数累积），供报错诊断使用
function recordAIResponseMeta(json, text) {
  try {
    var choice = json && json.choices && json.choices[0]
    var msg = choice && choice.message
    window._lastAIResponseMeta = {
      finishReason: (choice && choice.finish_reason) || '',
      model: (json && json.model) || '',
      hasReasoning: !!(msg && typeof msg.reasoning_content === 'string' && msg.reasoning_content.trim()),
      rawContentSnippet: String(text == null ? '' : text).slice(0, 2000),
      at: Date.now()
    }
  } catch (_) {}
}

function readAIResponseText(json) {
  var text = extractChatCompletionText(json)
  recordAIResponseMeta(json, text)
  return text
}

function getChatCompletionMessage(json) {
  return json && json.choices && json.choices[0] && json.choices[0].message
}

function isToolCallingUnsupportedError(error) {
  var status = Number(error && error.status)
  if (status && [400, 404, 422].indexOf(status) < 0) return false
  var detail = String(error && (error.detail || error.message) || '').toLowerCase()
  var toolWord = /(?:\btools?\b|tool_calls?|function calling|function_call)/
  var unsupportedWord = /(?:not support|unsupported|unknown parameter|unrecognized|not allowed|不支持|未知参数)/
  return toolWord.test(detail) && unsupportedWord.test(detail)
}

function parseToolCallArguments(raw) {
  if (raw == null || raw === '') return {}
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw
  try {
    var parsed = JSON.parse(String(raw))
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
  } catch (_) {}
  throw new Error('模型生成了无法解析的工具参数')
}

function stringifyToolFailure(error) {
  var message = String(error && error.message || error || '未知错误')
  return JSON.stringify({
    ok: false,
    error: message.slice(0, 2000),
    instruction: '工具调用失败，请基于现有信息继续回复，不要声称操作已经完成。'
  })
}

function getToolSession(opts) {
  var session = opts.toolSession
  if (!session || typeof session !== 'object') session = {}
  if (!session.cache || typeof session.cache !== 'object') session.cache = {}
  if (!Array.isArray(session.records)) session.records = []
  if (!Array.isArray(session.contextMessages)) session.contextMessages = []
  return session
}

async function notifyToolObserver(opts, event) {
  if (typeof opts.toolObserver !== 'function') return
  try {
    await opts.toolObserver(event)
  } catch (error) {
    console.warn('[AI tools] 工具观察事件处理失败:', error)
  }
}

function normalizeToolExecutorResult(value) {
  if (value && typeof value === 'object' && typeof value.modelContent === 'string') {
    return {
      modelContent: value.modelContent,
      traceData: value.traceData !== undefined ? value.traceData : value
    }
  }
  if (typeof value === 'string') return { modelContent: value, traceData: null }
  return {
    modelContent: JSON.stringify(value == null ? {} : value),
    traceData: value == null ? null : value
  }
}

async function isApiConsoleCaptureEnabled() {
  try {
    var config = await loadFloatingBallConfig()
    return config.apiConsoleEnabled === true
  } catch (_) {
    return false
  }
}

function getApiConsoleErrorMessage(parsed, rawText, fallback) {
  var detail = parsed && parsed.error && parsed.error.message
  if (!detail && parsed) detail = parsed.message || parsed.error
  return String(detail || rawText || fallback || '请求失败')
}

async function performTrackedChatCompletion(cfg, body, apiType, captureEnabled) {
  var startedAt = Date.now()
  var response
  try {
    response = await fetch(cfg.url + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.key },
      body: JSON.stringify(body)
    })
  } catch (networkError) {
    if (captureEnabled && await isApiConsoleCaptureEnabled()) {
      addApiConsoleRecord({
        id: 'api-' + startedAt + '-' + Math.random().toString(36).slice(2),
        createdAt: startedAt,
        ok: false,
        status: null,
        durationMs: Date.now() - startedAt,
        apiType: apiType,
        model: '',
        tokens: { input: null, output: null, total: null },
        content: '',
        reasoning: '',
        error: buildApiConsoleErrorText('', null, cfg.key, networkError && networkError.message)
      })
    }
    throw networkError
  }

  var rawText = ''
  var parsed = null
  var parseError = null
  try {
    rawText = await response.text()
  } catch (readError) {
    parseError = readError
  }
  if (!parseError && rawText) {
    try { parsed = JSON.parse(rawText) } catch (jsonError) { parseError = jsonError }
  } else if (!parseError) {
    parsed = {}
    if (response.ok) parseError = new Error('API 返回了空响应')
  }
  if (parseError && response.ok) {
    if (captureEnabled && await isApiConsoleCaptureEnabled()) {
      addApiConsoleRecord({
        id: 'api-' + startedAt + '-' + Math.random().toString(36).slice(2),
        createdAt: startedAt,
        ok: false,
        status: response.status,
        durationMs: Date.now() - startedAt,
        apiType: apiType,
        model: '',
        tokens: { input: null, output: null, total: null },
        content: '',
        reasoning: '',
        error: buildApiConsoleErrorText(rawText, null, cfg.key, parseError.message)
      })
    }
    var invalidJsonError = new Error('HTTP ' + response.status + '：API 返回了无法解析的 JSON')
    invalidJsonError.status = response.status
    invalidJsonError.detail = rawText || parseError.message || '无法解析响应'
    throw invalidJsonError
  }

  if (!response.ok) {
    var errorDetail = getApiConsoleErrorMessage(parsed, rawText, '请求失败')
    if (captureEnabled && await isApiConsoleCaptureEnabled()) {
      addApiConsoleRecord({
        id: 'api-' + startedAt + '-' + Math.random().toString(36).slice(2),
        createdAt: startedAt,
        ok: false,
        status: response.status,
        durationMs: Date.now() - startedAt,
        apiType: apiType,
        model: parsed && typeof parsed.model === 'string' ? parsed.model : '',
        tokens: readApiConsoleUsage(parsed),
        content: '',
        reasoning: '',
        error: buildApiConsoleErrorText(rawText, parsed, cfg.key, errorDetail)
      })
    }
    var httpError = new Error('HTTP ' + response.status + (errorDetail ? '：' + errorDetail.slice(0, 300) : ''))
    httpError.status = response.status
    httpError.detail = errorDetail
    throw httpError
  }

  if (captureEnabled && await isApiConsoleCaptureEnabled()) {
    var message = parsed && parsed.choices && parsed.choices[0] && parsed.choices[0].message
    addApiConsoleRecord({
      id: 'api-' + startedAt + '-' + Math.random().toString(36).slice(2),
      createdAt: startedAt,
      ok: true,
      status: response.status,
      durationMs: Date.now() - startedAt,
      apiType: apiType,
      model: parsed && typeof parsed.model === 'string' ? parsed.model : '',
      tokens: readApiConsoleUsage(parsed),
      content: formatApiConsoleResponseValue(message && message.content),
      reasoning: formatApiConsoleResponseValue(message && message.reasoning_content),
      error: ''
    })
  }
  return parsed
}

window.runTrackedChatCompletion = async function(cfg, body, apiType) {
  return await performTrackedChatCompletion(
    cfg,
    body,
    apiType || '文本生成 API',
    await isApiConsoleCaptureEnabled()
  )
}

// ===== 向单个API端点发请求 =====
// opts 可额外提供 tools、toolExecutor、toolObserver、maxToolCalls、toolSession。
async function fetchAI(cfg, messages, opts) {
  opts = opts || {}
  if (!cfg.url || !cfg.key) throw new Error('API未配置')
  var apiType = opts.apiConsoleType || '文本生成 API'
  var system = opts.system
  var temperature = opts.temperature
  function baseBody(activeMessages) {
    var body = {
      model: cfg.model || 'gpt-4o-mini',
      messages: system ? [{ role: 'system', content: system }].concat(activeMessages) : activeMessages
    }
    if (temperature != null) body.temperature = temperature
    var js = opts.responseJsonSchema
    if (js && js.name && js.schema) {
      body.response_format = {
        type: 'json_schema',
        json_schema: { name: js.name, strict: true, schema: js.schema }
      }
    } else if (opts.responseFormat === 'json_object') {
      body.response_format = { type: 'json_object' }
    }
    return body
  }
  var doFetch = function(b) {
    return window.runTrackedChatCompletion(cfg, b, apiType)
  }
  var originalMessages = Array.isArray(messages) ? messages.slice() : []
  var activeMessages = originalMessages.slice()
  var tools = Array.isArray(opts.tools) ? opts.tools.filter(Boolean) : []
  var toolsEnabled = tools.length > 0 && typeof opts.toolExecutor === 'function'
  var maxToolCalls = Math.max(1, Math.min(20, Number(opts.maxToolCalls) || 6))
  var toolCallCount = 0
  var toolLimitNotified = false
  var toolSession = getToolSession(opts)

  while (true) {
    var body = baseBody(activeMessages)
    if (toolsEnabled && toolCallCount < maxToolCalls) {
      body.tools = tools
      body.tool_choice = 'auto'
    }
    var json
    try {
      json = await doFetch(body)
    } catch (error) {
      if (toolsEnabled && toolCallCount === 0 && isToolCallingUnsupportedError(error)) {
        toolsEnabled = false
        activeMessages = originalMessages.slice()
        toolSession.unsupported = true
        continue
      }
      throw error
    }

    var assistantMessage = getChatCompletionMessage(json)
    var requestedCalls = assistantMessage && Array.isArray(assistantMessage.tool_calls)
      ? assistantMessage.tool_calls.filter(function(call) {
          return call && call.type === 'function' && call.function && call.function.name
        }).map(function(call, index) {
          return Object.assign({}, call, {
            id: String(call.id || ('tool-call-' + (toolCallCount + index + 1)))
          })
        })
      : []
    if (!requestedCalls.length || !toolsEnabled) return readAIResponseText(json)

    var assistantToolMessage = {
      role: 'assistant',
      content: assistantMessage.content == null ? null : assistantMessage.content,
      tool_calls: requestedCalls
    }
    activeMessages.push(assistantToolMessage)
    toolSession.contextMessages.push(assistantToolMessage)
    for (var i = 0; i < requestedCalls.length; i++) {
      var call = requestedCalls[i]
      var result
      var traceData = null
      var args = {}
      var parseError = null
      try { args = parseToolCallArguments(call.function.arguments) } catch (error) { parseError = error }
      var fingerprint = parseError ? '' : call.function.name + '\n' + JSON.stringify(args)
      await notifyToolObserver(opts, {
        phase: 'start',
        call: call,
        name: call.function.name,
        arguments: args,
        parseError: parseError ? String(parseError.message || parseError) : '',
        fingerprint: fingerprint
      })
      if (toolCallCount >= maxToolCalls) {
        toolLimitNotified = true
        result = JSON.stringify({
          ok: false,
          error: '本轮 MCP 工具调用次数已达到上限，请使用已有结果完成回复。'
        })
        await notifyToolObserver(opts, {
          phase: 'finish',
          status: 'error',
          call: call,
          name: call.function.name,
          arguments: args,
          result: result,
          error: '本轮 MCP 工具调用次数已达到上限',
          limit: true
        })
      } else {
        toolCallCount++
        try {
          if (parseError) throw parseError
          if (Object.prototype.hasOwnProperty.call(toolSession.cache, fingerprint)) {
            var cached = normalizeToolExecutorResult(toolSession.cache[fingerprint])
            result = cached.modelContent
            traceData = cached.traceData
            await notifyToolObserver(opts, {
              phase: 'finish',
              status: 'cached',
              call: call,
              name: call.function.name,
              arguments: args,
              result: result,
              traceData: traceData
            })
          } else {
            var executed = normalizeToolExecutorResult(await opts.toolExecutor(call.function.name, args, call))
            result = executed.modelContent
            traceData = executed.traceData
            toolSession.cache[fingerprint] = executed
            await notifyToolObserver(opts, {
              phase: 'finish',
              status: traceData && traceData.isError ? 'error' : 'success',
              call: call,
              name: call.function.name,
              arguments: args,
              result: result,
              traceData: traceData
            })
          }
          toolSession.records.push({
            name: call.function.name,
            arguments: args,
            result: result,
            traceData: traceData
          })
          toolSession.used = true
        } catch (error) {
          result = stringifyToolFailure(error)
          var failed = { modelContent: result, traceData: { error: String(error.message || error) } }
          if (fingerprint) toolSession.cache[fingerprint] = failed
          toolSession.used = true
          toolSession.records.push({
            name: call.function.name,
            arguments: args || {},
            result: result,
            traceData: failed.traceData
          })
          await notifyToolObserver(opts, {
            phase: 'finish',
            status: 'error',
            call: call,
            name: call.function.name,
            arguments: args,
            result: result,
            traceData: failed.traceData,
            error: String(error.message || error)
          })
        }
      }
      var toolMessage = {
        role: 'tool',
        tool_call_id: call.id,
        content: result
      }
      activeMessages.push(toolMessage)
      toolSession.contextMessages.push(toolMessage)
    }
    if (toolCallCount >= maxToolCalls) {
      if (!toolLimitNotified) {
        var limitCall = {
          id: 'tool-limit-' + maxToolCalls,
          type: 'function',
          function: { name: '__wanwan_tool_limit__', arguments: '{}' }
        }
        await notifyToolObserver(opts, {
          phase: 'start',
          call: limitCall,
          name: limitCall.function.name,
          arguments: {},
          limit: true
        })
        await notifyToolObserver(opts, {
          phase: 'finish',
          status: 'error',
          call: limitCall,
          name: limitCall.function.name,
          arguments: {},
          result: JSON.stringify({
            ok: false,
            error: '本轮 MCP 工具调用次数已达到上限，请使用已有结果完成回复。'
          }),
          error: '本轮 MCP 工具调用次数已达到上限',
          limit: true
        })
        var limitMessage = {
          role: 'system',
          content: '本轮工具调用次数已达到上限。请基于已有结果直接完成回复，不要描述调用限制或技术过程。'
        }
        activeMessages.push(limitMessage)
        toolSession.contextMessages.push(limitMessage)
        toolLimitNotified = true
      }
      toolsEnabled = false
    }
  }
}

// ===== API测试工具 =====
function readApiFormConfig(page, prefix) {
  var idPrefix = prefix ? 'sub-api' : 'api'
  var get = function(id) { return ((page.querySelector('#' + id) || {}).value || '').trim() }
  return {
    label: prefix ? '向量 API' : 'API',
    url: normalizeApiBaseUrl(get(idPrefix + '-base-url')),
    key: get(idPrefix + '-key'),
    model: get(idPrefix + '-model-input')
  }
}

function normalizeApiBaseUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '')
}

function validateApiTestConfig(cfg, needsModel) {
  if (!cfg.url) throw new Error('请先填写 Base URL')
  if (!cfg.key) throw new Error('请先填写 API Key')
  if (needsModel && !cfg.model) throw new Error('请先选择或填写模型')
}

function getApiTestHint(status, detail) {
  var text = String(detail || '').toLowerCase()
  if (status === 404) return '可能不支持这个接口，或 Base URL 填写不正确。'
  if (status === 401 || status === 403) return 'API Key 无效、权限不足，或当前账号没有访问权限。'
  if (text.includes('model') && (text.includes('not found') || text.includes('does not exist') || text.includes('unknown'))) {
    return '模型名可能不对，换一个模型后再试。'
  }
  if (text.includes('unsupported') || text.includes('not support')) return '当前服务商可能不支持这个接口。'
  return ''
}

async function readApiTestJsonResponse(res, fallback) {
  var text = ''
  var body = null
  try {
    text = await res.text()
    body = text ? JSON.parse(text) : {}
  } catch (e) {
    body = null
  }
  if (!res.ok) {
    var detail = body && (body.error && body.error.message || body.message || body.error)
    detail = detail || text || fallback || '请求失败'
    var err = new Error('HTTP ' + res.status + '：' + String(detail).slice(0, 300))
    err.status = res.status
    err.detail = String(detail)
    throw err
  }
  return body || {}
}

function withApiTestButtonBusy(btn, task) {
  if (!btn) return task()
  var oldText = btn.textContent
  btn.textContent = '测试中...'
  btn.disabled = true
  return Promise.resolve()
    .then(task)
    .finally(function() {
      btn.textContent = oldText
      btn.disabled = false
    })
}

async function testApiChat(page, prefix) {
  var btnId = prefix ? 'btn-test-secondary-chat' : 'btn-test-primary-chat'
  var btn = page.querySelector('#' + btnId)
  await withApiTestButtonBusy(btn, async function() {
    var cfg = readApiFormConfig(page, prefix)
    var titleBase = cfg.label + ' 连接测试'
    try {
      validateApiTestConfig(cfg, true)
      var json = await window.runTrackedChatCompletion(cfg, {
        model: cfg.model,
        messages: [{ role: 'user', content: '请只回复：连接成功' }]
      }, cfg.label + ' 连接测试')
      var reply = json && json.choices && json.choices[0] &&
        json.choices[0].message && json.choices[0].message.content
      if (!reply) throw new Error('接口已响应，但没有返回有效的聊天内容。')
      showApiTestModal(titleBase + '成功', true, '连接成功，模型已返回内容。', '模型回复：' + reply)
    } catch (e) {
      showApiTestModal(titleBase + '失败', false, e.message || '连接测试失败', getApiTestHint(e.status, e.detail || e.message))
    }
  })
}

function settingsEscHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function showApiTestModal(title, ok, message, detail) {
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '300'
  var modal = document.createElement('div')
  modal.className = 'center-modal'
  modal.style.zIndex = '301'
  var color = ok ? 'var(--c-accent)' : 'var(--c-red)'
  var detailHtml = detail
    ? '<div style="margin-top:8px;color:var(--c-hint);font-size:12px;line-height:1.6">' + settingsEscHtml(detail) + '</div>'
    : ''
  modal.innerHTML =
    '<div class="sheet-title" style="text-align:center;color:' + color + '">' + settingsEscHtml(title) + '</div>' +
    '<div style="padding:0 20px 16px;font-size:13px;color:var(--c-sub);line-height:1.7;text-align:center;word-break:break-word;white-space:pre-wrap">' +
      settingsEscHtml(message || '') + detailHtml +
    '</div>' +
    '<div class="sheet-actions">' +
      '<button class="btn-pill btn-full" id="api-test-ok">我知道了</button>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 200)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#api-test-ok').addEventListener('click', close)
}

// ===== 全局AI调用（主 API） =====
window.callAI = async function(messages, opts) {
  opts = opts || {}
  var cfg = await loadApiConfig()
  return await fetchAI(cfg.primary, messages, Object.assign({}, opts, { apiConsoleType: '主 API' }))
}

// ===== 记忆总结 AI 调用 =====
// 专属 API 只有在 URL、Key、模型均完整时启用；请求失败时不回退主 API。
window.callMemoryAI = async function(messages, opts) {
  opts = opts || {}
  var cfg = await window.loadMemoryApiConfig()
  if (cfg.complete) {
    return await fetchAI(cfg, messages, Object.assign({}, opts, { apiConsoleType: '记忆专属 API' }))
  }
  return await window.callAI(messages, opts)
}

// ===== MCP 跑腿助理 AI 调用 =====
// 专属 API 只有在 URL、Key、模型均完整时启用；留空则回退主 API（内置或自配均可）。
window.callMcpAI = async function(messages, opts) {
  opts = opts || {}
  var cfg = await window.loadMcpApiConfig()
  if (cfg.complete) {
    return await fetchAI(cfg, messages, Object.assign({}, opts, { apiConsoleType: 'MCP 专属 API' }))
  }
  return await window.callAI(messages, opts)
}

// ===== 游戏大厅 AI 调用 =====
// 专属 API 只有在 URL、Key、模型均完整时启用；请求失败时不回退主 API。
window.callGameAI = async function(messages, opts) {
  opts = opts || {}
  var gameCfg = await loadGameApiConfig()
  if (gameCfg.url && gameCfg.key && gameCfg.model) {
    return await fetchAI(gameCfg, messages, Object.assign({}, opts, { apiConsoleType: '游戏专属 API' }))
  }
  return await window.callAI(messages, opts)
}

// ===== 全局IMAGE生成调用 =====
window.generateImage = async function(prompt, opts) {
  opts = opts || {}
  var cfg = await loadImageGenConfig()
  return await generateImageWithConfig(cfg, prompt, opts)
}

// ===== 加载并填充API表单 =====
async function loadApiForm(page, prefix) {
  var keys = {
    baseUrl: prefix + 'apiBaseUrl',
    key: prefix + 'apiKey',
    model: prefix + 'apiModel'
  }
  var results = await Promise.all([
    db.config.get(keys.baseUrl), db.config.get(keys.key),
    db.config.get(keys.model)
  ])
  var idPrefix = prefix ? 'sub-api' : 'api'
  var setVal = function(id, v) {
    var el = page.querySelector('#' + id)
    if (el && v) el.value = v.value || v
  }
  setVal(idPrefix + '-base-url', results[0])
  setVal(idPrefix + '-key', results[1])
  var savedModel = results[2] && results[2].value ? results[2].value : ''
  setVal(idPrefix + '-model-input', savedModel)
  syncModelSelectOption(page, idPrefix, savedModel)
  var modelEl = page.querySelector('#' + idPrefix + '-model')
  var modelInputEl = page.querySelector('#' + idPrefix + '-model-input')
  if (modelEl && modelInputEl) {
    modelEl.addEventListener('change', function() {
      if (modelEl.value) modelInputEl.value = modelEl.value
    })
  }
}

// ===== 保存API配置 =====
function getApiFormMissingFields(page, prefix) {
  var idPrefix = prefix ? 'sub-api' : 'api'
  return findMissingSettingsFields([
    { el: page.querySelector('#' + idPrefix + '-base-url'), label: 'Base URL' },
    { el: page.querySelector('#' + idPrefix + '-key'), label: 'API Key' },
    { el: page.querySelector('#' + idPrefix + '-model-input'), label: '模型' }
  ])
}

async function saveApiConfig(page, prefix) {
  var idPrefix = prefix ? 'sub-api' : 'api'
  var get = function(id) { return ((page.querySelector('#' + id) || {}).value || '').trim() }
  var configName = prefix ? '向量 API 配置' : 'API 配置'
  var missing = getApiFormMissingFields(page, prefix)
  if (showIncompleteSettingsSave(missing, configName)) return
  try {
    await Promise.all([
      db.config.put({ key: prefix + 'apiBaseUrl',     value: get(idPrefix + '-base-url') }),
      db.config.put({ key: prefix + 'apiKey',         value: get(idPrefix + '-key') }),
      db.config.put({ key: prefix + 'apiModel',       value: get(idPrefix + '-model-input') })
    ])
    window._apiConfigCache = null
    // 同步刷新父级设置页右侧的模型显示
    var settingsPage = document.getElementById('settings-page')
    if (settingsPage) await updateRowValues(settingsPage)
    window.toast(configName + '已保存')
  } catch (error) {
    window.toast(configName + '保存失败：' + (error.message || error))
  }
}

// ===== 获取模型列表 =====
async function loadModelList(page, prefix) {
  var idPrefix = prefix ? 'sub-api' : 'api'
  var baseUrlEl = page.querySelector('#' + idPrefix + '-base-url')
  var keyEl = page.querySelector('#' + idPrefix + '-key')
  var selectEl = page.querySelector('#' + idPrefix + '-model')
  var inputEl = page.querySelector('#' + idPrefix + '-model-input')
  if (!baseUrlEl || !baseUrlEl.value) { window.toast('请先填写Base URL'); return }
  try {
    var res = await fetch(baseUrlEl.value + '/models', {
      headers: { Authorization: 'Bearer ' + (keyEl ? keyEl.value : '') }
    })
    var json = await res.json()
    var models = (json.data || []).map(function(m) { return m.id }).filter(Boolean)
    selectEl.innerHTML = '<option value="">拉取后选择模型</option>' +
      models.map(function(m) {
        return '<option value="' + settingsEscHtml(m) + '">' + settingsEscHtml(m) + '</option>'
      }).join('')
    if (inputEl && inputEl.value) syncModelSelectOption(page, idPrefix, inputEl.value)
    window.toast('已加载 ' + models.length + ' 个模型')
  } catch (e) { window.toast('获取模型失败：' + e.message) }
}

// ===== 加载设置页所有值并绑定事件 =====
async function loadSettingsValues(page) {
  await initAccountCard(page)
  await initDarkModeSection(page)
  await initKeepAliveSection(page)
  await initOnlineToggle(page)
  bindOnlineStateValue(page)
  await updateRowValues(page)
  page.querySelector('#row-about-device').addEventListener('click', function() {
    if (window.openAboutDevicePage) window.openAboutDevicePage()
  })
  page.querySelector('#row-notification').addEventListener('click', openNotificationPage)
  page.querySelector('#row-api-config').addEventListener('click', openApiConfigPage)
  page.querySelector('#row-minimax-config').addEventListener('click', openMinimaxConfigPage)
  page.querySelector('#row-fish-config').addEventListener('click', openFishConfigPage)
  var schedRow = page.querySelector('#row-schedule')
  if (schedRow) schedRow.addEventListener('click', openSchedulePage)
  page.querySelector('#row-image-gen-config').addEventListener('click', openImageGenConfigPage)
  page.querySelector('#row-font').addEventListener('click', openFontPage)
  page.querySelector('#row-wallpaper').addEventListener('click', openWallpaperPage)
  page.querySelector('#row-floating-ball').addEventListener('click', openFloatingBallPage)
  page.querySelector('#row-online-config').addEventListener('click', openOnlineConfigPage)
  if (window.injectDataButtons) window.injectDataButtons(page)
}

// ===== 更新主设置页各行右侧状态值 =====
async function updateRowValues(page) {
  var apiConfig = await loadApiConfig()
  var valApi = page.querySelector('#val-api-config')
  if (valApi) {
    valApi.textContent = apiConfig.primary.model || '未配置'
  }
  var onlineServer = await db.config.get('onlineServer')
  var valOnline = page.querySelector('#val-online')
  if (valOnline) {
    valOnline.textContent = (onlineServer && onlineServer.value) ? '已配置' : '未配置'
  }
  var ttsProviderCfg = await db.config.get('ttsProvider')
  var ttsActive = (ttsProviderCfg && ttsProviderCfg.value === 'fish') ? 'fish' : 'minimax'
  var minimaxModel = await db.config.get('minimaxModel')
  var valMinimax = page.querySelector('#val-minimax-config')
  if (valMinimax) {
    valMinimax.textContent = (minimaxModel && minimaxModel.value)
      ? minimaxModel.value + (ttsActive === 'minimax' ? ' · 使用中' : '')
      : '未配置'
  }
  var valSched = page.querySelector('#val-schedule')
  if (valSched) {
    try {
      var schedData = await scheduleLoad()
      valSched.textContent = schedData.events.length ? (schedData.events.length + ' 节') : '未导入'
    } catch (_) {}
  }
  var fishModelCfg = await db.config.get('fishModel')
  var valFish = page.querySelector('#val-fish-config')
  if (valFish) {
    valFish.textContent = (fishModelCfg && fishModelCfg.value)
      ? fishModelCfg.value + (ttsActive === 'fish' ? ' · 使用中' : '')
      : '未配置'
  }
  var imageGenModel = await db.config.get('imageGenModel')
  var valImageGen = page.querySelector('#val-image-gen-config')
  if (valImageGen) {
    valImageGen.textContent = (imageGenModel && imageGenModel.value) ? imageGenModel.value : '未配置'
  }
  var fontState = await resolveStoredActiveFont()
  var valFont = page.querySelector('#val-font')
  if (valFont) {
    valFont.textContent = (fontState.activeFont && fontState.activeFont.name) ? fontState.activeFont.name : '默认'
  }
  var floatingBallCfg = await loadFloatingBallConfig(true)
  var valFloatingBall = page.querySelector('#val-floating-ball')
  if (valFloatingBall) valFloatingBall.textContent = floatingBallCfg.enabled ? '已开启' : '已关闭'
}
