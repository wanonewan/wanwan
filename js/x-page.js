// x-page.js — 仿 X (Twitter) 页面
// 在原作者外壳上补了「论坛」逻辑：
//   1) 用户发帖（昵称 / 匿名）→ 一次请求生成 8-12 条评论（昵称模式下好友角色可能认出你）
//   2) 让角色发帖 → 一次请求生成该帖 + 8-12 条评论
//   3) 生成 4-8 条路人帖，每条 4-8 条评论
// 所有帖子存在 db.config（键 wanwan_x_forum_用户id），新生成的不会覆盖旧的。
// AI 输出不用 JSON，用「标记§字段§字段」逐行格式，解析更稳。

var X_SESSION_UID_KEY = 'wanwan_x_uid'
var X_PROFILE_PREFIX = 'wanwan_x_profile_'
var X_FORUM_PREFIX = 'wanwan_x_forum_'

var xForumData = null      // 当前账号的论坛数据 { uid, posts, accounts, seeded }
var xCurrentUser = null
var xGenBusy = 0           // 角色发帖 / 路人帖 正在生成的任务数
var xFeedTab = 'foryou'
var xComposeAnon = false

var X_TOPICS = [
  '生活吐槽', '经验分享', '寻求帮助（求推荐/求建议）', '记录生活（日常碎碎念）',
  '职场或学校吐槽', '美食探店或做饭翻车', '追剧/游戏/追星', '情感树洞',
  '搞笑段子', '随手拍配文', '购物避雷', '熬夜失眠碎碎念',
  '旅行见闻', '养猫养狗日常', '学习打卡', '冷知识科普'
]

window.showXPage = async function() {
  var user = await getXSessionUser()
  if (!user) {
    showXLoginPage()
    return
  }
  await renderXPage(user)
}

/* ============================================================
   主页（信息流）
   ============================================================ */
async function renderXPage(user) {
  xCurrentUser = user
  await loadXForum(user)

  var existing = document.getElementById('x-page')
  if (existing) existing.remove()

  var page = document.createElement('div')
  page.id = 'x-page'
  page.className = 'full-page'
  page.dataset.xUid = user.id

  page.innerHTML =
    '<div class="x-topbar">' +
      '<div class="x-topbar-main">' +
        '<div class="x-topbar-avatar">' + getXAvatarHTML(user) + '</div>' +
        '<div class="x-topbar-logo">' +
          '<svg viewBox="0 0 24 24"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>' +
        '</div>' +
        '<div class="x-topbar-actions">' +
          '<button class="x-topbar-gen" type="button" aria-label="生成内容"><i class="fa-solid fa-wand-magic-sparkles"></i></button>' +
          '<button class="x-topbar-right" type="button" aria-label="个人主页"><i class="fa-solid fa-circle-user"></i></button>' +
        '</div>' +
      '</div>' +
      '<div class="x-tabs">' +
        '<div class="x-tab active" data-tab="foryou">' +
          '为你推荐' +
          '<span class="x-tab-arrow"><svg viewBox="0 0 24 24"><g><path d="M3.543 8.96l1.414-1.42L12 14.59l7.043-7.05 1.414 1.42L12 17.41 3.543 8.96z"></path></g></svg></span>' +
        '</div>' +
        '<div class="x-tab" data-tab="following">正在跟隨</div>' +
      '</div>' +
    '</div>' +

    '<div class="x-feed"></div>' +

    '<button class="x-fab" onclick="showXCompose()">' +
      '<i class="fi fi-rr-plus"></i>' +
    '</button>' +

    '<div class="x-bottombar">' +
      buildXBottomBar() +
    '</div>'

  if (window.openPage) {
    window.openPage(page)
  } else {
    var app = document.getElementById('app') || document.body
    app.appendChild(page)
  }

  xFeedTab = 'foryou'
  renderXFeed(page)

  var avatar = page.querySelector('.x-topbar-avatar')
  if (avatar) {
    avatar.setAttribute('role', 'button')
    avatar.setAttribute('aria-label', '退出 X')
    avatar.addEventListener('click', closeXPage)
  }

  var accountBtn = page.querySelector('.x-topbar-right')
  if (accountBtn) {
    accountBtn.addEventListener('click', function(e) {
      e.preventDefault()
      e.stopPropagation()
      showXProfilePage(user)
    })
  }

  var genBtn = page.querySelector('.x-topbar-gen')
  if (genBtn) {
    genBtn.addEventListener('click', function(e) {
      e.preventDefault()
      e.stopPropagation()
      showXGenMenu()
    })
  }

  // 标签：为你推荐 = 全部；正在跟隨 = 我和角色发的
  page.querySelectorAll('.x-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      page.querySelectorAll('.x-tab').forEach(function(t) { t.classList.remove('active') })
      tab.classList.add('active')
      xFeedTab = tab.dataset.tab || 'foryou'
      renderXFeed(page)
      var feed = page.querySelector('.x-feed')
      if (feed) feed.scrollTop = 0
    })
  })

  // 信息流点击（点赞 / 更多 / 进详情）
  var feedEl = page.querySelector('.x-feed')
  feedEl.addEventListener('click', function(e) {
    var postEl = e.target.closest('.x-post')
    if (!postEl) return
    var id = postEl.dataset.id
    if (e.target.closest('.x-post-action.like')) {
      e.stopPropagation()
      toggleXLike(id, null, e.target.closest('.x-post-action.like'))
      return
    }
    if (e.target.closest('.x-post-more')) {
      e.stopPropagation()
      showXPostMenu(id)
      return
    }
    if (e.target.closest('.x-post-action') && !e.target.closest('.x-post-action.comment')) {
      e.stopPropagation()
      return
    }
    openXPostDetail(id)
  })

  bindXEdgeSwipe(page, closeXPage)

  // 底栏点击
  var items = page.querySelectorAll('.x-bottombar-item')
  items.forEach(function(item) {
    item.addEventListener('click', function() {
      items.forEach(function(i) { i.classList.remove('active') })
      item.classList.add('active')
    })
  })
}

// 返回手势 — 从左边缘右滑关闭
function bindXEdgeSwipe(page, closeFn) {
  var startX = 0
  var startY = 0
  var tracking = false
  page.addEventListener('touchstart', function(e) {
    var t = e.touches[0]
    if (t.clientX < 25) {
      startX = t.clientX
      startY = t.clientY
      tracking = true
    }
  }, { passive: true })
  page.addEventListener('touchend', function(e) {
    if (!tracking) return
    tracking = false
    var t = e.changedTouches[0]
    var dx = t.clientX - startX
    var dy = Math.abs(t.clientY - startY)
    if (dx > 80 && dy < 100) {
      closeFn()
    }
  }, { passive: true })
}

function renderXFeed(page) {
  page = page || document.getElementById('x-page')
  if (!page || !xForumData) return
  var feed = page.querySelector('.x-feed')
  if (!feed) return

  var posts = xForumData.posts.slice().sort(function(a, b) { return b.ts - a.ts })
  if (xFeedTab === 'following') {
    posts = posts.filter(function(p) { return p.kind === 'user' || p.kind === 'char' })
  }

  var html = ''
  if (xGenBusy > 0) {
    html += '<div class="x-gen-tip"><i class="fa fa-spinner fa-spin"></i> 正在生成内容…</div>'
  }
  if (posts.length) {
    html += posts.map(function(p) { return buildXPostFromData(p) }).join('')
  } else {
    html += '<div class="x-feed-empty">' +
      (xFeedTab === 'following' ? '还没有你或角色发的帖子' : '这里还没有帖子') +
      '<span>点右下角 + 发帖，或点右上角 ✦ 生成内容</span></div>'
  }

  var top = feed.scrollTop
  feed.innerHTML = html
  feed.scrollTop = top
}

/* ============================================================
   论坛数据（存取）
   ============================================================ */
async function loadXForum(user) {
  var key = X_FORUM_PREFIX + user.id
  var raw = null
  try {
    if (window.db && db.config) {
      var row = await db.config.get(key)
      raw = row && row.value
    }
  } catch (e) {}
  if (!raw) {
    try {
      var ls = localStorage.getItem(key)
      raw = ls ? JSON.parse(ls) : null
    } catch (e2) {}
  }
  var data = raw && typeof raw === 'object' ? raw : {}
  data.uid = user.id
  data.posts = Array.isArray(data.posts) ? data.posts : []
  data.accounts = data.accounts && typeof data.accounts === 'object' ? data.accounts : {}
  data.posts.forEach(function(p) {
    p.pending = false          // 上次没生成完就退出的，清掉“生成中”状态
    if (!Array.isArray(p.comments)) p.comments = []
  })
  if (!data.seeded) {
    data.seeded = true
    data.posts.push({
      id: xNewId('p'),
      kind: 'npc',
      authorId: null,
      name: '弯弯协会',
      handle: 'Wanwan_Offical',
      avatar: 'img/wanwan.png',
      verified: true,
      content: '产品上线请多多关注。#AI #Wanwan',
      ts: Date.now() - 2 * 3600 * 1000,
      anon: false,
      views: 286000,
      likes: 3654,
      retweets: 203,
      baseComments: 847,
      liked: false,
      comments: []
    })
    await saveXForum(data)
  }
  xForumData = data
  return data
}

async function saveXForum(data) {
  data = data || xForumData
  if (!data || data.uid == null) return
  var key = X_FORUM_PREFIX + data.uid
  try {
    if (window.db && db.config) {
      await db.config.put({ key: key, value: data })
      return
    }
  } catch (e) {}
  try { localStorage.setItem(key, JSON.stringify(data)) } catch (e2) {}
}

function findXPost(id, data) {
  data = data || xForumData
  if (!data) return null
  for (var i = 0; i < data.posts.length; i++) {
    if (data.posts[i].id === id) return data.posts[i]
  }
  return null
}

function xNewId(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function xRand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function xGenStats() {
  var views = Math.round(Math.exp(Math.log(400) + Math.random() * (Math.log(30000) - Math.log(400))))
  var likes = Math.max(2, Math.round(views * (0.01 + Math.random() * 0.05)))
  var retweets = Math.max(0, Math.round(likes * (0.04 + Math.random() * 0.16)))
  return { views: views, likes: likes, retweets: retweets }
}

function xSkewLikes() {
  return Math.floor(Math.pow(Math.random(), 3) * 400)
}

function xCleanHandle(h) {
  var s = stripXAt(h).replace(/[^A-Za-z0-9_]/g, '').slice(0, 15)
  return s || ('user' + xRand(1000, 99999))
}

function xCleanName(n, fallback) {
  var s = String(n || '').replace(/[\r\n]/g, ' ').trim().slice(0, 14)
  return s || fallback || '路人'
}

function xCleanText(t) {
  return String(t || '')
    .replace(/\\n/g, '\n')
    .replace(/^["“「]+|["”」]+$/g, '')
    .trim()
    .slice(0, 600)
}

function xToast(msg) {
  if (window.toast) window.toast(msg)
}

/* ============================================================
   帖子 / 评论 的渲染
   ============================================================ */
function xTimeLabel(ts) {
  var diff = Math.max(0, Date.now() - ts)
  var m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return m + '分钟'
  var h = Math.floor(m / 60)
  if (h < 24) return h + '小时'
  var d = new Date(ts)
  var now = new Date()
  if (d.getFullYear() === now.getFullYear()) return (d.getMonth() + 1) + '月' + d.getDate() + '日'
  return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'
}

function xFullTime(ts) {
  var d = new Date(ts)
  var hm = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2)
  return hm + ' · ' + d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'
}

function xAvatarColor(name) {
  var seed = 0
  var s = String(name || '?')
  for (var i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) % 360
  return 'hsl(' + seed + ', 52%, 46%)'
}

function xAvatarHTML(item) {
  if (item.anon) {
    return '<span class="x-avatar-anon"><svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="4"></circle><path d="M4 21c1.2-4.6 4.6-6.8 8-6.8s6.8 2.2 8 6.8z"></path></svg></span>'
  }
  if (item.avatar) return '<img src="' + xEscape(item.avatar) + '" alt="">'
  var name = item.name || '?'
  return '<span class="x-avatar-placeholder" style="background:' + xAvatarColor(name) + '">' + xEscape(name.slice(0, 1)) + '</span>'
}

function buildXPostFromData(p, opts) {
  opts = opts || {}
  return buildXPost({
    id: p.id,
    avatarHTML: xAvatarHTML(p),
    name: p.name,
    verified: !!p.verified,
    handle: '@' + stripXAt(p.handle),
    mine: p.kind === 'user' && p.anon,
    time: xTimeLabel(p.ts),
    content: p.content,
    comments: (p.comments ? p.comments.length : 0) + (p.baseComments || 0),
    retweets: p.retweets || 0,
    likes: (p.likes || 0) + (p.liked ? 1 : 0),
    views: p.views || 0,
    liked: !!p.liked,
    pending: !!p.pending,
    detail: !!opts.detail
  })
}

function buildXComment(c) {
  var count = (c.likes || 0) + (c.liked ? 1 : 0)
  return '<div class="x-post x-comment" data-cid="' + xEscape(c.id) + '">' +
    '<div class="x-post-avatar">' + xAvatarHTML(c) + '</div>' +
    '<div class="x-post-body">' +
      '<div class="x-post-header">' +
        '<span class="x-post-name">' + xEscape(c.name) + '</span>' +
        '<span class="x-post-handle">@' + xEscape(stripXAt(c.handle)) + '</span>' +
        '<span class="x-post-dot">·</span>' +
        '<span class="x-post-time">' + xEscape(xTimeLabel(c.ts)) + '</span>' +
      '</div>' +
      '<div class="x-post-content">' + formatXContent(c.content) + '</div>' +
      '<div class="x-post-actions x-comment-actions">' +
        '<button class="x-post-action like' + (c.liked ? ' liked' : '') + '" type="button">' + getXHeartSvg(!!c.liked) + '<span>' + formatXNumber(count) + '</span></button>' +
      '</div>' +
    '</div>' +
  '</div>'
}

/* ============================================================
   点赞 / 删除 / 详情页
   ============================================================ */
function toggleXLike(postId, commentId, btn) {
  var data = xForumData
  var post = findXPost(postId)
  if (!post) return
  var target = post
  if (commentId) {
    target = (post.comments || []).filter(function(c) { return c.id === commentId })[0]
    if (!target) return
  }
  target.liked = !target.liked
  var count = (target.likes || 0) + (target.liked ? 1 : 0)
  if (btn) {
    btn.classList.toggle('liked', !!target.liked)
    btn.innerHTML = getXHeartSvg(!!target.liked) + '<span>' + formatXNumber(count) + '</span>'
  }
  saveXForum(data)
  if (!commentId) renderXFeed()
}

function showXPostMenu(id) {
  xOpenSheet({
    items: [{
      label: '删除这条帖子',
      icon: 'fa-regular fa-trash-can',
      danger: true,
      onClick: function() { deleteXPost(id) }
    }]
  })
}

function deleteXPost(id) {
  var data = xForumData
  if (!data) return
  data.posts = data.posts.filter(function(p) { return p.id !== id })
  saveXForum(data)
  var detail = document.getElementById('x-post-detail')
  if (detail && detail.dataset.postId === id) closeXDetail()
  renderXFeed()
  xToast('已删除')
}

function openXPostDetail(id) {
  var post = findXPost(id)
  if (!post) return
  var existing = document.getElementById('x-post-detail')
  if (existing) existing.remove()

  var page = document.createElement('div')
  page.id = 'x-post-detail'
  page.className = 'full-page x-detail-page'
  page.dataset.postId = id
  page.innerHTML =
    '<div class="x-detail-header">' +
      '<button class="x-detail-back" type="button" aria-label="返回"><i class="fa-solid fa-arrow-left"></i></button>' +
      '<div class="x-detail-title">帖子</div>' +
    '</div>' +
    '<div class="x-detail-scroll"></div>'

  if (window.openPage) {
    window.openPage(page)
  } else {
    var app = document.getElementById('app') || document.body
    app.appendChild(page)
  }

  renderXDetail(page)

  page.querySelector('.x-detail-back').addEventListener('click', function(e) {
    e.stopPropagation()
    closeXDetail()
  })
  bindXEdgeSwipe(page, closeXDetail)

  page.querySelector('.x-detail-scroll').addEventListener('click', function(e) {
    var pid = page.dataset.postId
    var commentEl = e.target.closest('.x-comment')
    if (commentEl) {
      var likeBtn = e.target.closest('.x-post-action.like')
      if (likeBtn) {
        e.stopPropagation()
        toggleXLike(pid, commentEl.dataset.cid, likeBtn)
      }
      return
    }
    if (e.target.closest('.x-post-action.like')) {
      e.stopPropagation()
      toggleXLike(pid, null, e.target.closest('.x-post-action.like'))
      return
    }
    if (e.target.closest('.x-post-more')) {
      e.stopPropagation()
      showXPostMenu(pid)
    }
  })
}

function renderXDetail(page) {
  page = page || document.getElementById('x-post-detail')
  if (!page) return
  var post = findXPost(page.dataset.postId)
  var scroll = page.querySelector('.x-detail-scroll')
  if (!post || !scroll) return
  var comments = (post.comments || []).slice().sort(function(a, b) { return a.ts - b.ts })

  var title
  if (post.pending) title = '<i class="fa fa-spinner fa-spin"></i> 网友正在评论…'
  else if (comments.length) title = comments.length + ' 条回复'
  else title = '暂无回复'

  var top = scroll.scrollTop
  scroll.innerHTML =
    buildXPostFromData(post, { detail: true }) +
    '<div class="x-detail-meta">' + xEscape(xFullTime(post.ts)) + ' · <b>' + formatXNumber(post.views || 0) + '</b> 次查看</div>' +
    '<div class="x-detail-replies-title">' + title + '</div>' +
    comments.map(buildXComment).join('')
  scroll.scrollTop = top
}

function closeXDetail() {
  var page = document.getElementById('x-post-detail')
  if (!page) return
  if (window.closePage) {
    window.closePage('x-post-detail')
  } else {
    page.remove()
  }
  renderXFeed()
}

// 生成完成后，刷新信息流和（若打开的话）对应的详情页
function refreshXViews(data, postId) {
  if (xForumData !== data) return
  renderXFeed()
  var detail = document.getElementById('x-post-detail')
  if (detail && (!postId || detail.dataset.postId === postId)) renderXDetail(detail)
}

/* ============================================================
   底部弹出菜单 / 错误弹窗
   ============================================================ */
function xCloseSheet() {
  var mask = document.getElementById('x-sheet-mask')
  if (mask) mask.remove()
}

// opts: { title, items:[{label, icon, danger, onClick}], bodyHTML, cancel }
function xOpenSheet(opts) {
  xCloseSheet()
  var mask = document.createElement('div')
  mask.id = 'x-sheet-mask'
  mask.className = 'x-sheet-mask'
  var itemsHTML = (opts.items || []).map(function(it, i) {
    return '<button type="button" class="x-sheet-item' + (it.danger ? ' danger' : '') + '" data-i="' + i + '">' +
      (it.icon ? '<i class="' + xEscape(it.icon) + '"></i>' : '') +
      '<span>' + xEscape(it.label) + '</span></button>'
  }).join('')
  mask.innerHTML =
    '<div class="x-sheet">' +
      '<div class="x-sheet-grip"></div>' +
      (opts.title ? '<div class="x-sheet-title">' + xEscape(opts.title) + '</div>' : '') +
      (opts.bodyHTML || '') +
      itemsHTML +
      '<button type="button" class="x-sheet-item x-sheet-cancel">取消</button>' +
    '</div>'
  document.body.appendChild(mask)
  requestAnimationFrame(function() { mask.classList.add('show') })

  mask.addEventListener('click', function(e) {
    if (e.target === mask || e.target.closest('.x-sheet-cancel')) {
      xCloseSheet()
      return
    }
    var btn = e.target.closest('.x-sheet-item[data-i]')
    if (btn) {
      var it = (opts.items || [])[parseInt(btn.dataset.i, 10)]
      xCloseSheet()
      if (it && it.onClick) it.onClick()
    }
  })
  return mask
}

function xShowError(title, err, raw) {
  var msg = (err && err.message) || String(err || '未知错误')
  var detail = msg
  var rawText = raw || (err && err.rawOutput) || ''
  if (rawText) detail += '\n\n【模型原始输出】\n' + rawText
  var short = msg.length > 60 ? msg.slice(0, 60) + '…' : msg
  var mask = document.createElement('div')
  mask.className = 'x-err-mask'
  mask.innerHTML =
    '<div class="x-err-card">' +
      '<div class="x-err-title">' + xEscape(title) + '</div>' +
      '<div class="x-err-msg">' + xEscape(short) + '</div>' +
      (detail.length > short.length ? '<button type="button" class="x-err-more">查看更多</button><pre class="x-err-detail" hidden>' + xEscape(detail) + '</pre>' : '') +
      '<button type="button" class="x-err-ok">我已知晓</button>' +
    '</div>'
  document.body.appendChild(mask)
  var more = mask.querySelector('.x-err-more')
  if (more) {
    more.addEventListener('click', function() {
      var pre = mask.querySelector('.x-err-detail')
      pre.hidden = !pre.hidden
      more.textContent = pre.hidden ? '查看更多' : '收起'
    })
  }
  mask.querySelector('.x-err-ok').addEventListener('click', function() { mask.remove() })
}

/* ============================================================
   AI 调用与输出解析
   ============================================================ */
async function callXAI(system, userText) {
  if (!window.callAI) throw new Error('未找到 AI 调用接口（window.callAI）')
  var raw = await window.callAI(
    [{ role: 'user', content: userText }],
    { system: system, temperature: 1.0 }
  )
  if (raw && typeof raw === 'object') raw = raw.content || raw.text || JSON.stringify(raw)
  return String(raw || '')
}

// mode: 'replies'（只有评论）/ 'charpost'（P 只含正文）/ 'npcposts'（P 含网名@用户名正文）
function parseXOutput(raw, mode) {
  var out = { accounts: {}, posts: [], loose: [] }
  var cur = null
  String(raw || '').replace(/```[a-zA-Z]*/g, '').split(/\r?\n/).forEach(function(line) {
    line = line.trim().replace(/^(?:[-*•·]|\d+[.、)）])\s*/, '')
    var m = line.match(/^([PCFA])\s*§(.*)$/)
    if (!m) return
    var tag = m[1]
    var parts = m[2].split('§').map(function(s) { return s.trim() })

    if (tag === 'A') {
      if (parts.length >= 3) {
        out.accounts[parts[0]] = { name: xCleanName(parts[1]), handle: xCleanHandle(parts[2]) }
      }
      return
    }
    if (tag === 'P') {
      var post = null
      if (mode === 'charpost') {
        post = { content: xCleanText(parts.join('§')), comments: [] }
      } else if (parts.length >= 3) {
        post = {
          name: xCleanName(parts[0]),
          handle: xCleanHandle(parts[1]),
          content: xCleanText(parts.slice(2).join('§')),
          comments: []
        }
      }
      if (post && post.content) {
        out.posts.push(post)
        cur = post
      } else {
        cur = null
      }
      return
    }
    var target = cur ? cur.comments : out.loose
    if (tag === 'C' && parts.length >= 3) {
      var text = xCleanText(parts.slice(2).join('§'))
      if (text) target.push({ kind: 'npc', name: xCleanName(parts[0]), handle: xCleanHandle(parts[1]), content: text })
    } else if (tag === 'F' && parts.length >= 2) {
      var ftext = xCleanText(parts.slice(1).join('§'))
      if (ftext) target.push({ kind: 'char', charId: parts[0], content: ftext })
    }
  })
  return out
}

function xFormatError(msg, raw) {
  var e = new Error(msg)
  e.rawOutput = raw
  return e
}

// 把解析出的评论变成存储用的评论对象
function buildXComments(list, startTs, charMap, accounts, maxComments, maxChars) {
  var out = []
  var charCount = 0
  list.forEach(function(c) {
    if (out.length >= maxComments) return
    if (c.kind === 'char') {
      var ch = charMap[String(c.charId)]
      if (!ch || charCount >= maxChars) return
      charCount++
      var acc = accounts[String(ch.id)]
      out.push({
        id: xNewId('c'), kind: 'char', authorId: ch.id,
        name: acc.name, handle: acc.handle, avatar: ch.avatar,
        content: c.content, likes: xRand(0, 60), liked: false
      })
    } else {
      out.push({
        id: xNewId('c'), kind: 'npc', authorId: null,
        name: c.name, handle: c.handle, avatar: '',
        content: c.content, likes: xSkewLikes(), liked: false
      })
    }
  })
  var now = Date.now()
  var span = Math.max(now - startTs, 20000)
  var times = out.map(function() { return startTs + Math.floor(Math.random() * span) })
  times.sort(function(a, b) { return a - b })
  out.forEach(function(c, i) { c.ts = Math.min(times[i], now) })
  return out
}

// 给涉及到的角色确定 X 账号：已有就沿用，没有就用 A 行，再没有就兜底
function ensureXAccounts(data, chars, parsedAccounts) {
  var map = {}
  chars.forEach(function(ch) {
    var key = String(ch.id)
    if (!data.accounts[key]) {
      var pa = parsedAccounts[key]
      data.accounts[key] = pa || { name: ch.charName, handle: 'user' + ch.id }
    }
    map[key] = data.accounts[key]
  })
  return map
}

/* ============================================================
   角色数据（好友列表 / 人设 / 最近聊天）
   ============================================================ */
function xResolvePlaceholders(text, userName, charName) {
  return String(text || '')
    .replace(/\{\{\s*(?:user|用户)\s*\}\}/gi, userName || '她')
    .replace(/\{\{\s*(?:char|角色)\s*\}\}/gi, charName || '我')
}

async function loadXFriendChars(user) {
  var out = []
  try {
    var cfg = await db.config.get('friends_' + user.id)
    var ids = Array.isArray(cfg && cfg.value) ? cfg.value : []
    var userName = getXUserName(user)
    for (var i = 0; i < ids.length; i++) {
      var cid = parseInt(ids[i], 10)
      if (!Number.isFinite(cid)) continue
      var ch = await db.characters.get(cid)
      if (!ch || ch.type === 'user') continue
      var prow = await db.config.get('wechatProfile_' + user.id + '_' + ch.id)
      var profile = (prow && prow.value) || {}
      var charName = String(ch.nick || ch.name || '').trim() || '我'
      out.push({
        id: ch.id,
        name: String(profile.remark || '').trim() || charName,
        charName: charName,
        avatar: profile.avatar || ch.avatar || '',
        persona: xResolvePlaceholders(ch.description, userName, charName).trim(),
        role: String(ch.role || '').trim()
      })
    }
  } catch (e) {
    console.warn('[x-page] 读取好友角色失败：', e)
  }
  return out
}

async function loadXRecentChat(user, charId, limit, budget) {
  try {
    var chat = await db.chats.where('[ownerUid+charId]').equals([user.id, charId]).first()
    if (!chat) return ''
    var msgs = await db.messages.where('chatId').equals(chat.id).toArray()
    var userName = getXUserName(user)
    var charName = ''
    var ch = await db.characters.get(charId)
    charName = String((ch && (ch.nick || ch.name)) || '我')
    msgs = msgs
      .filter(function(m) {
        var t = typeof m.content === 'string' ? m.content : ''
        return t && t.indexOf('__') !== 0 && t.indexOf('[系统') !== 0
      })
      .sort(function(a, b) { return xTs(a.createdAt) - xTs(b.createdAt) })
    var lines = []
    var used = 0
    for (var i = msgs.length - 1; i >= 0 && lines.length < limit; i--) {
      var text = xResolvePlaceholders(msgs[i].content, userName, charName).replace(/\s+/g, ' ').trim().slice(0, 120)
      if (!text) continue
      var line = (msgs[i].role === 'user' ? userName : charName) + '：' + text
      if (used + line.length > budget) break
      used += line.length
      lines.unshift(line)
    }
    return lines.join('\n')
  } catch (e) {
    return ''
  }
}

function xTs(v) {
  if (typeof v === 'number') return v
  var t = new Date(v).getTime()
  return Number.isFinite(t) ? t : 0
}

/* ============================================================
   操作 1：用户发帖 → 一次请求生成 8-12 条评论
   ============================================================ */
async function publishXPost(user, text, anon) {
  var data = xForumData
  var profile = await getXProfile(user)
  var post = {
    id: xNewId('p'),
    kind: 'user',
    authorId: user.id,
    name: anon ? '匿名用户' : getXProfileName(user, profile),
    handle: anon ? 'anonymous' : stripXAt(getXProfileHandle(user, profile)),
    avatar: anon ? '' : (profile.avatar || user.avatar || ''),
    verified: false,
    anon: !!anon,
    content: text,
    ts: Date.now(),
    views: 1,
    likes: 0,
    retweets: 0,
    baseComments: 0,
    liked: false,
    pending: true,
    comments: []
  }
  data.posts.push(post)
  await saveXForum(data)
  renderXFeed()
  var feed = document.querySelector('#x-page .x-feed')
  if (feed) feed.scrollTop = 0
  generateXUserPostReplies(user, data, post.id)
}

async function generateXUserPostReplies(user, data, postId) {
  var post = findXPost(postId, data)
  if (!post) return
  try {
    var n = xRand(8, 12)
    var cands = []
    if (!post.anon) {
      var friends = await loadXFriendChars(user)
      friends.sort(function() { return Math.random() - 0.5 })
      cands = friends.slice(0, 3)
    }

    var system =
      '你在模拟大型中文社交平台 X（推特）的评论区，扮演一大群互不相识的路人网友。\n' +
      '请为下面这条帖子写 ' + n + ' 条路人评论。每条来自不同网友：网名 2-8 字，@用户名为英文数字下划线；' +
      '语气各异：赞同、玩梗、抬杠、追问、共鸣、跑题、无意义水评、偶尔复读或小广告；长短不一（5-60 字），口语化，' +
      '不要 AI 腔，不要客套，不要全用同一种句式。评论紧扣帖子内容，但允许个别跑题。路人不认识发帖人。\n'

    if (cands.length) {
      var uName = getXUserName(user)
      var profile = await getXProfile(user)
      system +=
        '\n【可能参与评论的好友角色】\n' +
        '下面的角色是发帖人「' + uName + '」的好友，他们认得出这个 X 账号（' + getXProfileName(user, profile) + ' @' + stripXAt(getXProfileHandle(user, profile)) + '）就是 ' + uName + ' 本人。' +
        '是否评论、怎么评论由各自性格决定（调侃、装作不认识、暗示、直接点破都可以），只有符合性格时才出现，最多 2 位，也可以一位都不出现。' +
        '角色评论的格式：F§角色id§评论内容。如果某角色没有 X 账号，请在输出最前面补一行：A§角色id§网名§@用户名。\n'
      cands.forEach(function(ch) {
        var acc = data.accounts[String(ch.id)]
        system += '- [id=' + ch.id + '] ' + ch.charName + '｜X 账号：' + (acc ? acc.name + ' @' + acc.handle : '无') + '｜设定：' + ch.persona.slice(0, 350).replace(/\s+/g, ' ') + '\n'
      })
    }

    system +=
      '\n【输出格式】不要 JSON、不要 markdown、不要任何解释；每条评论单独一行、内容不换行：\n' +
      'C§网名§@用户名§评论内容\n'

    var userText = '发帖人：' + (post.anon ? '匿名用户' : post.name + ' @' + post.handle) + '\n帖子内容：' + post.content
    var raw = await callXAI(system, userText)
    var parsed = parseXOutput(raw, 'replies')
    if (!parsed.loose.length) throw xFormatError('模型返回的内容无法识别为评论', raw)

    var charMap = {}
    cands.forEach(function(ch) { charMap[String(ch.id)] = ch })
    var accounts = ensureXAccounts(data, cands, parsed.accounts)
    post.comments = buildXComments(parsed.loose, post.ts, charMap, accounts, n + 3, 2)

    var st = xGenStats()
    post.views = st.views
    post.likes = st.likes
    post.retweets = st.retweets
  } catch (e) {
    console.warn('[x-page] 生成评论失败：', e)
    xShowError('评论生成失败', e)
  } finally {
    post.pending = false
    await saveXForum(data)
    refreshXViews(data, postId)
  }
}

/* ============================================================
   操作 2：让角色发帖（一次请求：帖子 + 8-12 条评论）
   ============================================================ */
function showXGenMenu() {
  xOpenSheet({
    items: [
      { label: '让角色发帖', icon: 'fa-solid fa-user-pen', onClick: showXCharPicker },
      { label: '生成路人帖子', icon: 'fa-solid fa-users', onClick: function() { runXNpcPosts() } }
    ]
  })
}

async function showXCharPicker() {
  if (xGenBusy > 0) { xToast('正在生成中，请稍后'); return }
  var user = xCurrentUser
  if (!user) return
  var chars = await loadXFriendChars(user)
  if (!chars.length) { xToast('还没有好友角色，先在微信里加好友'); return }

  var sel = {}
  var rows = chars.map(function(c) {
    return '<button type="button" class="x-pick-row" data-id="' + xEscape(c.id) + '">' +
      '<span class="x-pick-avatar">' + xAvatarHTML({ avatar: c.avatar, name: c.name }) + '</span>' +
      '<span class="x-pick-name">' + xEscape(c.name) + '</span>' +
      '<i class="fa-regular fa-circle"></i>' +
    '</button>'
  }).join('')
  var mask = xOpenSheet({
    title: '选择发帖的角色',
    bodyHTML: '<div class="x-pick-list">' + rows + '</div>' +
      '<button type="button" class="x-sheet-confirm" disabled>让选中的角色发帖</button>'
  })
  var confirmBtn = mask.querySelector('.x-sheet-confirm')
  mask.querySelector('.x-pick-list').addEventListener('click', function(e) {
    var row = e.target.closest('.x-pick-row')
    if (!row) return
    var id = row.dataset.id
    if (sel[id]) delete sel[id]
    else sel[id] = true
    var on = !!sel[id]
    row.classList.toggle('on', on)
    row.querySelector('i').className = on ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'
    var count = Object.keys(sel).length
    confirmBtn.disabled = count === 0
    confirmBtn.textContent = count ? '让选中的 ' + count + ' 位角色发帖' : '让选中的角色发帖'
  })
  confirmBtn.addEventListener('click', function(e) {
    e.stopPropagation()
    var picked = chars.filter(function(c) { return sel[String(c.id)] })
    xCloseSheet()
    if (picked.length) runXCharPosts(user, picked)
  })
}

async function runXCharPosts(user, picked) {
  var data = xForumData
  xGenBusy++
  renderXFeed()
  xToast('正在让 ' + picked.length + ' 位角色发帖…')
  try {
    for (var i = 0; i < picked.length; i++) {
      try {
        await generateXCharPost(user, data, picked[i])
      } catch (e) {
        console.warn('[x-page] 角色发帖失败：', e)
        xShowError(picked[i].name + ' 发帖失败', e)
      }
    }
  } finally {
    xGenBusy--
    await saveXForum(data)
    refreshXViews(data)
  }
}

async function generateXCharPost(user, data, ch) {
  var n = xRand(8, 12)
  var userName = getXUserName(user)
  var acc = data.accounts[String(ch.id)]
  var recent = await loadXRecentChat(user, ch.id, 10, 700)

  var system =
    '你正在扮演角色「' + ch.charName + '」，在公开社交平台 X（推特）上发帖。\n\n' +
    '【角色设定】\n' + (ch.persona.slice(0, 1800) || '（暂无额外设定）') +
    (ch.role ? '\n身份：' + ch.role : '') + '\n\n' +
    '【任务】\n' +
    '1. 以你自己的 X 账号发 1 条帖子（20-120 字），内容自然：日常、心情、吐槽、碎碎念、对最近发生的事的感想都可以，口吻完全符合你的人设。' +
    '这是公开平台，读者大多是不认识你的网友：不要写私密对话的细节，不要公开「' + userName + '」的真名和隐私（想暗戳戳地提也可以）。\n' +
    '2. 然后模拟帖子发出后评论区的 ' + n + ' 条路人网友评论：互不相识，网名（2-8 字）和 @用户名（英文数字下划线）各不相同，' +
    '语气各异（赞同、玩梗、抬杠、提问、跑题、水评、偶尔小广告），5-60 字，不要 AI 腔。路人不知道你的现实身份。\n\n' +
    (acc
      ? '你的 X 账号是「' + acc.name + '」@' + acc.handle + '，保持不变。\n'
      : '你还没有 X 账号：请先取一个符合人设的网名和 @用户名，在输出第一行写：A§' + ch.id + '§网名§@用户名\n') +
    '\n【输出格式】不要 JSON、不要 markdown、不要解释；每条内容单行（需要换行时写 \\n）：\n' +
    (acc ? '' : 'A§' + ch.id + '§网名§@用户名\n') +
    'P§帖子正文\n' +
    'C§网名§@用户名§评论内容\n' +
    '（C 行共 ' + n + ' 行）'

  var userText = recent
    ? '（你和「' + userName + '」最近的聊天，仅供你参考心情和话题）\n' + recent
    : '（最近没怎么聊天，自由发挥）'

  var raw = await callXAI(system, userText)
  var parsed = parseXOutput(raw, 'charpost')
  if (!parsed.posts.length) throw xFormatError('模型返回的内容里没有找到帖子', raw)

  var accounts = ensureXAccounts(data, [ch], parsed.accounts)
  var account = accounts[String(ch.id)]
  var item = parsed.posts[0]
  var st = xGenStats()
  var post = {
    id: xNewId('p'),
    kind: 'char',
    authorId: ch.id,
    name: account.name,
    handle: account.handle,
    avatar: ch.avatar,
    verified: false,
    anon: false,
    content: item.content,
    ts: Date.now(),
    views: st.views,
    likes: st.likes,
    retweets: st.retweets,
    baseComments: 0,
    liked: false,
    pending: false,
    comments: []
  }
  post.comments = buildXComments(item.comments, post.ts - 1000, {}, accounts, n + 3, 0)
  data.posts.push(post)
  await saveXForum(data)
  refreshXViews(data)
  xToast(account.name + ' 发了一条帖子')
}

/* ============================================================
   操作 3：生成 4-8 条路人帖，每条 4-8 条评论
   ============================================================ */
async function runXNpcPosts() {
  if (xGenBusy > 0) { xToast('正在生成中，请稍后'); return }
  var data = xForumData
  if (!data) return
  xGenBusy++
  renderXFeed()
  xToast('正在生成路人帖子…')
  try {
    await generateXNpcPosts(data)
  } catch (e) {
    console.warn('[x-page] 路人帖子生成失败：', e)
    xShowError('路人帖子生成失败', e)
  } finally {
    xGenBusy--
    await saveXForum(data)
    refreshXViews(data)
  }
}

async function generateXNpcPosts(data) {
  var n = xRand(4, 8)
  var topics = X_TOPICS.slice().sort(function() { return Math.random() - 0.5 }).slice(0, n)
  var counts = []
  for (var i = 0; i < n; i++) counts.push(xRand(4, 8))

  var system =
    '你在模拟大型中文社交平台 X（推特）。请生成 ' + n + ' 条互不相关的普通网友发的帖子，并为每条帖子写评论区的评论。\n\n' +
    '【帖子主题】每条各用一个，对应如下：\n' +
    topics.map(function(t, i) { return '帖子' + (i + 1) + '：' + t }).join('\n') + '\n\n' +
    '【要求】发帖人的网名（2-8 字）和 @用户名（英文数字下划线）各不相同，身份各异（学生、打工人、宝妈、程序员、考研党、游戏玩家、外卖骑手等，自行安排）。' +
    '帖子 15-140 字，口语化，有真实生活质感，像真人随手发的，不要 AI 腔，不要全是正能量，可以有口癖和错别字。' +
    '评论 5-60 字，语气各异（赞同、玩梗、抬杠、追问、共鸣、跑题、水评），网友之间互不相识，不要客套。\n' +
    '各帖评论条数：' + counts.map(function(c, i) { return '帖子' + (i + 1) + ' ' + c + ' 条' }).join('；') + '\n\n' +
    '【输出格式】不要 JSON、不要 markdown、不要解释；每条内容单行（需要换行时写 \\n）。每个帖子先一行 P，再跟它的评论 C 行：\n' +
    'P§网名§@用户名§帖子正文\n' +
    'C§网名§@用户名§评论内容'

  var raw = await callXAI(system, '现在开始生成。')
  var parsed = parseXOutput(raw, 'npcposts')
  if (!parsed.posts.length) throw xFormatError('模型返回的内容里没有找到帖子', raw)

  var now = Date.now()
  var offsets = parsed.posts.map(function() { return xRand(2, 120) * 60000 }).sort(function(a, b) { return b - a })
  parsed.posts.forEach(function(item, idx) {
    var st = xGenStats()
    var post = {
      id: xNewId('p'),
      kind: 'npc',
      authorId: null,
      name: item.name,
      handle: item.handle,
      avatar: '',
      verified: false,
      anon: false,
      content: item.content,
      ts: now - offsets[idx],
      views: st.views,
      likes: st.likes,
      retweets: st.retweets,
      baseComments: 0,
      liked: false,
      pending: false,
      comments: []
    }
    post.comments = buildXComments(item.comments, post.ts, {}, {}, 10, 0)
    data.posts.push(post)
  })
  await saveXForum(data)
  refreshXViews(data)
  xToast('来了 ' + parsed.posts.length + ' 条路人帖子')
}

/* ============================================================
   个人主页
   ============================================================ */
async function showXProfilePage(user) {
  var existing = document.getElementById('x-profile-page')
  if (existing) existing.remove()
  var profile = await getXProfile(user)

  var page = document.createElement('div')
  page.id = 'x-profile-page'
  page.className = 'full-page x-profile-page'

  var name = getXProfileName(user, profile)
  var handle = getXProfileHandle(user, profile)
  var following = normalizeXCount(profile.following)
  var followers = normalizeXCount(profile.followers)
  page.innerHTML =
    '<div class="x-profile-cover"' + (profile.backgroundImage ? ' style="background-image:url(' + xEscape(profile.backgroundImage) + ')"' : '') + '>' +
      '<button class="x-profile-circle-btn x-profile-back" type="button" aria-label="返回"><i class="fa-solid fa-arrow-left"></i></button>' +
      '<button class="x-profile-circle-btn x-profile-switch" type="button" aria-label="切换账号"><i class="fa-solid fa-right-left"></i></button>' +
      '<button class="x-profile-circle-btn x-profile-edit" type="button" aria-label="编辑个人资料"><i class="fa-solid fa-pen"></i></button>' +
    '</div>' +
    '<div class="x-profile-main">' +
      '<div class="x-profile-avatar">' + getXProfileAvatarHTML(user, profile) + '</div>' +
      '<div class="x-profile-name">' + xEscape(name) + '</div>' +
      '<div class="x-profile-handle">' + xEscape(handle) + '</div>' +
      '<div class="x-profile-joined">' +
        '<i class="fa-regular fa-calendar"></i>' +
        '<span>' + xEscape(getXJoinText(user, profile)) + '</span>' +
        '<i class="fa-solid fa-angle-right"></i>' +
      '</div>' +
      '<div class="x-profile-stats">' +
        '<span><strong>' + xEscape(following) + '</strong> 跟隨中</span>' +
        '<span><strong>' + xEscape(followers) + '</strong> 跟隨者</span>' +
      '</div>' +
    '</div>'

  if (window.openPage) {
    window.openPage(page)
  } else {
    var app = document.getElementById('app') || document.body
    app.appendChild(page)
  }

  page.querySelector('.x-profile-back').addEventListener('click', function(e) {
    e.preventDefault()
    e.stopPropagation()
    closeXProfilePage()
  })

  page.querySelector('.x-profile-edit').addEventListener('click', function(e) {
    e.preventDefault()
    e.stopPropagation()
    showXProfileEditPage(user)
  })

  page.querySelector('.x-profile-switch').addEventListener('click', function(e) {
    e.preventDefault()
    e.stopPropagation()
    showXLoginPage({ replaceExisting: true, returnToProfile: true })
  })
}

async function showXProfileEditPage(user) {
  var existing = document.getElementById('x-profile-edit-page')
  if (existing) existing.remove()
  var profile = await getXProfile(user)

  var page = document.createElement('div')
  page.id = 'x-profile-edit-page'
  page.className = 'full-page x-profile-edit-page'
  page.innerHTML =
    '<div class="x-profile-edit-header">' +
      '<button class="x-profile-edit-back" type="button" aria-label="返回"><i class="fa-solid fa-chevron-left"></i></button>' +
      '<div class="x-profile-edit-title">编辑个人资料</div>' +
      '<button class="x-profile-edit-save" type="button">保存</button>' +
    '</div>' +
    '<div class="x-profile-edit-scroll">' +
      '<button class="x-profile-edit-cover" id="x-edit-cover" type="button"' + (profile.backgroundImage ? ' style="background-image:url(' + xEscape(profile.backgroundImage) + ')"' : '') + '>' +
        '<span><i class="fa-solid fa-image"></i> 背景图</span>' +
      '</button>' +
      '<button class="x-profile-edit-avatar" id="x-edit-avatar" type="button">' + getXProfileAvatarHTML(user, profile) + '</button>' +
      '<input type="hidden" id="x-edit-cover-value" value="' + xEscape(profile.backgroundImage || '') + '">' +
      '<input type="hidden" id="x-edit-avatar-value" value="' + xEscape(profile.avatar || '') + '">' +
      '<label class="x-profile-edit-field">昵称<input id="x-edit-name" class="input-field" value="' + xEscape(profile.name || getXUserName(user)) + '" placeholder="昵称"></label>' +
      '<label class="x-profile-edit-field">用户名<input id="x-edit-handle" class="input-field" value="' + xEscape(stripXAt(profile.handle || getXUserHandle(user))) + '" placeholder="用户名"></label>' +
      '<div class="x-profile-edit-grid">' +
        '<label class="x-profile-edit-field">加入年份<input id="x-edit-join-year" class="input-field" inputmode="numeric" maxlength="4" value="' + xEscape(profile.joinYear) + '"></label>' +
        '<label class="x-profile-edit-field">加入月份<input id="x-edit-join-month" class="input-field" inputmode="numeric" maxlength="2" value="' + xEscape(profile.joinMonth) + '"></label>' +
      '</div>' +
      '<div class="x-profile-edit-grid">' +
        '<label class="x-profile-edit-field">追随中<input id="x-edit-following" class="input-field" inputmode="numeric" value="' + xEscape(normalizeXCount(profile.following)) + '"></label>' +
        '<label class="x-profile-edit-field">跟随者<input id="x-edit-followers" class="input-field" inputmode="numeric" value="' + xEscape(normalizeXCount(profile.followers)) + '"></label>' +
      '</div>' +
    '</div>'

  if (window.openPage) {
    window.openPage(page)
  } else {
    var app = document.getElementById('app') || document.body
    app.appendChild(page)
  }

  page.querySelector('.x-profile-edit-back').addEventListener('click', function() {
    closeXProfileEditPage()
  })
  page.querySelector('#x-edit-cover').addEventListener('click', function() {
    pickXImage(function(imageUrl) {
      page.querySelector('#x-edit-cover-value').value = imageUrl || ''
      page.querySelector('#x-edit-cover').style.backgroundImage = imageUrl ? 'url(' + imageUrl + ')' : ''
    })
  })
  page.querySelector('#x-edit-avatar').addEventListener('click', function() {
    pickXImage(function(imageUrl) {
      page.querySelector('#x-edit-avatar-value').value = imageUrl || ''
      page.querySelector('#x-edit-avatar').innerHTML = imageUrl ? '<img src="' + xEscape(imageUrl) + '" alt="">' : getXAvatarHTML(user)
    })
  })
  page.querySelector('.x-profile-edit-save').addEventListener('click', async function() {
    var next = {
      backgroundImage: page.querySelector('#x-edit-cover-value').value.trim(),
      avatar: page.querySelector('#x-edit-avatar-value').value.trim(),
      name: page.querySelector('#x-edit-name').value.trim() || getXUserName(user),
      handle: stripXAt(page.querySelector('#x-edit-handle').value.trim()) || stripXAt(getXUserHandle(user)),
      joinYear: normalizeXJoinYear(page.querySelector('#x-edit-join-year').value, user),
      joinMonth: normalizeXJoinMonth(page.querySelector('#x-edit-join-month').value, user),
      following: normalizeXCount(page.querySelector('#x-edit-following').value),
      followers: normalizeXCount(page.querySelector('#x-edit-followers').value)
    }
    await saveXProfile(user, next)
    closeXProfileEditPage(true)
    var profilePage = document.getElementById('x-profile-page')
    if (profilePage) profilePage.remove()
    showXProfilePage(user)
  })
}

/* ============================================================
   发帖页（昵称 / 匿名）
   ============================================================ */
window.showXCompose = function() {
  var existing = document.getElementById('x-compose')
  if (existing) existing.remove()

  getXSessionUser().then(function(user) {
    renderXCompose(user)
  })
}

async function renderXCompose(user) {
  xComposeAnon = false
  var profile = await getXProfile(user)
  var nickName = getXProfileName(user, profile)
  var nickHandle = stripXAt(getXProfileHandle(user, profile))
  var nickAvatarHTML = getXProfileAvatarHTML(user, profile)

  var page = document.createElement('div')
  page.id = 'x-compose'
  page.className = 'full-page x-compose-page'

  page.innerHTML =
    '<div class="x-compose-header">' +
      '<button class="x-compose-cancel">取消</button>' +
      '<button class="x-compose-publish">发布</button>' +
    '</div>' +
    '<div class="x-compose-mode">' +
      '<button type="button" class="x-mode-btn active" data-mode="nick"><i class="fa-solid fa-at"></i> 昵称发布</button>' +
      '<button type="button" class="x-mode-btn" data-mode="anon"><i class="fa-solid fa-user-secret"></i> 匿名发布</button>' +
    '</div>' +
    '<div class="x-compose-hint"></div>' +
    '<div class="x-compose-body">' +
      '<div class="x-compose-avatar">' + nickAvatarHTML + '</div>' +
      '<div class="x-compose-input" contenteditable="true" data-placeholder="有什么新鲜事？"></div>' +
    '</div>' +
    '<div class="x-compose-footer">' +
      '<div class="x-compose-tools">' +
        '<button class="x-compose-tool"><i class="fa-solid fa-image"></i></button>' +
        '<button class="x-compose-tool"><i class="fa-solid fa-camera"></i></button>' +
        '<button class="x-compose-tool x-tool-hash"><i class="fa-solid fa-hashtag"></i></button>' +
      '</div>' +
    '</div>'

  if (window.openPage) {
    window.openPage(page)
  } else {
    var app = document.getElementById('app') || document.body
    app.appendChild(page)
  }

  var input = page.querySelector('.x-compose-input')
  var publishBtn = page.querySelector('.x-compose-publish')
  var hint = page.querySelector('.x-compose-hint')
  var avatarBox = page.querySelector('.x-compose-avatar')

  function syncMode() {
    page.querySelectorAll('.x-mode-btn').forEach(function(b) {
      b.classList.toggle('active', (b.dataset.mode === 'anon') === xComposeAnon)
    })
    if (xComposeAnon) {
      avatarBox.innerHTML = xAvatarHTML({ anon: true })
      hint.textContent = '完全匿名：路人和你的好友角色都不知道是你发的。'
    } else {
      avatarBox.innerHTML = nickAvatarHTML
      hint.textContent = '以「' + nickName + '」@' + nickHandle + ' 发布。你的好友角色认得出这是你，路人不认识你。'
    }
  }
  function syncPublish() {
    publishBtn.classList.toggle('ready', input.innerText.trim().length > 0)
  }
  syncMode()

  page.querySelectorAll('.x-mode-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      xComposeAnon = btn.dataset.mode === 'anon'
      syncMode()
    })
  })

  input.addEventListener('input', syncPublish)
  input.addEventListener('paste', function(e) {
    e.preventDefault()
    var text = (e.clipboardData || window.clipboardData).getData('text') || ''
    document.execCommand('insertText', false, text)
  })

  page.querySelector('.x-tool-hash').addEventListener('click', function() {
    input.focus()
    document.execCommand('insertText', false, '#')
  })

  page.querySelector('.x-compose-cancel').addEventListener('click', function(e) {
    e.stopPropagation()
    closeXCompose()
  })

  publishBtn.addEventListener('click', function(e) {
    e.stopPropagation()
    var text = input.innerText.replace(/\u00a0/g, ' ').trim()
    if (!text) { xToast('先写点什么'); return }
    if (text.length > 500) { xToast('最多 500 字'); return }
    var anon = xComposeAnon
    closeXCompose()
    publishXPost(user, text, anon)
  })
}

/* ============================================================
   登录页
   ============================================================ */
function showXLoginPage(options) {
  options = options || {}
  var existing = document.getElementById('x-login-page')
  if (existing) existing.remove()
  if (options.replaceExisting) {
    var xPage = document.getElementById('x-page')
    if (xPage) xPage.remove()
    var profilePage = document.getElementById('x-profile-page')
    if (profilePage) profilePage.remove()
    var editPage = document.getElementById('x-profile-edit-page')
    if (editPage) editPage.remove()
    var detailPage = document.getElementById('x-post-detail')
    if (detailPage) detailPage.remove()
  }

  var page = document.createElement('div')
  page.id = 'x-login-page'
  page.className = 'full-page x-login-page'
  if (options.returnToProfile) page.dataset.returnToProfile = '1'
  page.innerHTML =
    '<button class="x-login-close" type="button" aria-label="返回"><i class="fa fa-angle-left"></i></button>' +
    '<div class="x-login-shell">' +
      '<div class="x-login-logo"><svg viewBox="0 0 24 24"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg></div>' +
      '<div class="x-login-title">登录 X</div>' +
      '<div class="x-login-subtitle">选择微信账号继续</div>' +
      '<button class="x-login-wechat" id="x-login-wechat" type="button">' +
        getXWeChatSvg() +
        '<span>通过微信登录</span>' +
      '</button>' +
      '<div class="x-login-users" id="x-login-users" hidden></div>' +
    '</div>'

  if (window.openPage) {
    window.openPage(page)
  } else {
    var app = document.getElementById('app') || document.body
    app.appendChild(page)
  }

  page.querySelector('.x-login-close').addEventListener('click', function() {
    closeXLoginPage()
  })
  page.querySelector('#x-login-wechat').addEventListener('click', function() {
    renderXLoginUsers(page)
  })
}

async function renderXLoginUsers(page) {
  var list = page.querySelector('#x-login-users')
  if (!list) return
  list.hidden = false
  list.innerHTML = '<div class="x-login-loading"><i class="fa fa-spinner fa-spin"></i></div>'
  var users = await getXUserList()
  if (!users.length) {
    list.innerHTML =
      '<div class="x-login-empty">' +
        '<div>暂无 USER 账号</div>' +
        '<span>请先在角色档案里创建 USER 类型角色</span>' +
      '</div>'
    return
  }
  list.innerHTML = users.map(function(user) {
    var name = getXUserName(user)
    var account = user.identity && user.identity.account ? '@' + user.identity.account : '微信用户'
    return '<button class="x-login-user" type="button" data-uid="' + xEscape(user.id) + '">' +
      '<span class="x-login-user-avatar">' + getXAvatarHTML(user) + '</span>' +
      '<span class="x-login-user-main">' +
        '<span class="x-login-user-name">' + xEscape(name) + '</span>' +
        '<span class="x-login-user-account">' + xEscape(account) + '</span>' +
      '</span>' +
      '<i class="fa fa-angle-right"></i>' +
    '</button>'
  }).join('')

  list.querySelectorAll('.x-login-user').forEach(function(row) {
    row.addEventListener('click', async function() {
      var uid = parseInt(row.dataset.uid)
      var user = users.find(function(item) { return parseInt(item.id) === uid })
      if (!user) return
      setXSessionUser(user)
      var returnToProfile = page.dataset.returnToProfile === '1'
      closeXLoginPage(true)
      await renderXPage(user)
      if (returnToProfile) showXProfilePage(user)
    })
  })
}

function closeXLoginPage(immediate) {
  var page = document.getElementById('x-login-page')
  if (!page) return
  if (immediate) {
    page.remove()
  } else if (window.closePage) {
    window.closePage('x-login-page')
  } else {
    page.remove()
  }
}

window.closeXCompose = function() {
  var page = document.getElementById('x-compose')
  if (!page) return
  if (window.closePage) {
    window.closePage('x-compose')
  } else {
    page.remove()
  }
}

function closeXProfilePage() {
  var page = document.getElementById('x-profile-page')
  if (!page) return
  if (window.closePage) {
    window.closePage('x-profile-page')
  } else {
    page.remove()
  }
}

function closeXProfileEditPage(immediate) {
  var page = document.getElementById('x-profile-edit-page')
  if (!page) return
  if (immediate) {
    page.remove()
  } else if (window.closePage) {
    window.closePage('x-profile-edit-page')
  } else {
    page.remove()
  }
}

function closeXPage() {
  var page = document.getElementById('x-page')
  if (!page) return
  if (window.closePage) {
    window.closePage('x-page')
  } else {
    page.remove()
  }
}

/* ============================================================
   账号 / 资料（原作者代码，未改动）
   ============================================================ */
async function getXUserList() {
  if (!window.db || !db.characters) return []
  try {
    return await db.characters.where('type').equals('user').toArray()
  } catch (e) {
    return (await db.characters.toArray()).filter(function(user) { return user.type === 'user' })
  }
}

async function getXSessionUser() {
  var stored = localStorage.getItem(X_SESSION_UID_KEY)
  if (!stored) return null
  var uid = parseInt(stored)
  if (!Number.isFinite(uid)) {
    localStorage.removeItem(X_SESSION_UID_KEY)
    return null
  }
  var user = window.getCharacter ? await window.getCharacter(uid) : await db.characters.get(uid)
  if (!user || user.type !== 'user') {
    localStorage.removeItem(X_SESSION_UID_KEY)
    return null
  }
  return user
}

function setXSessionUser(user) {
  if (!user || user.type !== 'user') return
  localStorage.setItem(X_SESSION_UID_KEY, user.id)
}

function getXUserName(user) {
  return (user && (user.nick || user.name)) || '微信用户'
}

function getXUserHandle(user) {
  var account = user && user.identity && user.identity.account
  account = account ? String(account).replace(/^@+/, '') : ''
  return '@' + (account || getXUserName(user).replace(/\s+/g, '_') || 'User')
}

async function getXProfile(user) {
  var fallback = getXDefaultProfile(user)
  if (!user || user.id == null) return fallback
  var key = X_PROFILE_PREFIX + user.id
  try {
    if (window.db && db.config) {
      var row = await db.config.get(key)
      return normalizeXProfile(user, row && row.value)
    }
  } catch (e) {}
  try {
    var raw = localStorage.getItem(key)
    return normalizeXProfile(user, raw ? JSON.parse(raw) : null)
  } catch (e2) {
    return fallback
  }
}

async function saveXProfile(user, profile) {
  if (!user || user.id == null) return
  var normalized = normalizeXProfile(user, profile)
  var key = X_PROFILE_PREFIX + user.id
  try {
    if (window.db && db.config) {
      await db.config.put({ key: key, value: normalized })
      return
    }
  } catch (e) {}
  localStorage.setItem(key, JSON.stringify(normalized))
}

function getXDefaultProfile(user) {
  var join = getXDefaultJoinParts(user)
  return {
    backgroundImage: '',
    avatar: '',
    name: getXUserName(user),
    handle: stripXAt(getXUserHandle(user)),
    joinYear: join.year,
    joinMonth: join.month,
    following: '0',
    followers: '0'
  }
}

function normalizeXProfile(user, profile) {
  var base = getXDefaultProfile(user)
  if (!profile || typeof profile !== 'object') return base
  return {
    backgroundImage: profile.backgroundImage || '',
    avatar: profile.avatar || '',
    name: String(profile.name || base.name),
    handle: stripXAt(profile.handle || base.handle),
    joinYear: normalizeXJoinYear(profile.joinYear || base.joinYear, user),
    joinMonth: normalizeXJoinMonth(profile.joinMonth || base.joinMonth, user),
    following: normalizeXCount(profile.following),
    followers: normalizeXCount(profile.followers)
  }
}

function getXProfileName(user, profile) {
  return (profile && profile.name) || getXUserName(user)
}

function getXProfileHandle(user, profile) {
  var handle = profile && profile.handle ? profile.handle : getXUserHandle(user)
  return '@' + stripXAt(handle)
}

function getXProfileAvatarHTML(user, profile) {
  var name = getXProfileName(user, profile)
  var avatar = profile && profile.avatar ? profile.avatar : (user && user.avatar)
  if (avatar) return '<img src="' + xEscape(avatar) + '" alt="' + xEscape(name) + '">'
  return buildXDefaultAvatarHTML(name)
}

function stripXAt(value) {
  return String(value == null ? '' : value).trim().replace(/^@+/, '')
}

function normalizeXCount(value) {
  var str = String(value == null || value === '' ? '0' : value).trim()
  if (/^\d+$/.test(str)) return String(parseInt(str, 10))
  return str.replace(/[<>"'&]/g, '').slice(0, 12) || '0'
}

function pickXImage(callback) {
  if (window.showImagePicker) {
    window.showImagePicker(callback)
  } else if (window.toast) {
    window.toast('当前环境不支持选择图片')
  }
}

function getXDefaultJoinParts(user) {
  var ts = user && (user.createdAt || user.updatedAt || user.idCreatedAt)
  var date = ts ? new Date(ts) : new Date(2026, 2, 1)
  if (isNaN(date.getTime())) date = new Date(2026, 2, 1)
  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1)
  }
}

function normalizeXJoinYear(value, user) {
  var fallback = getXDefaultJoinParts(user).year
  var year = parseInt(String(value == null ? '' : value).replace(/\D/g, ''), 10)
  if (!Number.isFinite(year) || year < 1900 || year > 2999) return fallback
  return String(year)
}

function normalizeXJoinMonth(value, user) {
  var fallback = getXDefaultJoinParts(user).month
  var month = parseInt(String(value == null ? '' : value).replace(/\D/g, ''), 10)
  if (!Number.isFinite(month) || month < 1 || month > 12) return fallback
  return String(month)
}

function getXJoinText(user, profile) {
  var year = normalizeXJoinYear(profile && profile.joinYear, user)
  var month = normalizeXJoinMonth(profile && profile.joinMonth, user)
  return '於 ' + year + '年' + month + '月加入'
}

function getXAvatarHTML(user) {
  var name = getXUserName(user)
  if (user && user.avatar) return '<img src="' + xEscape(user.avatar) + '" alt="' + xEscape(name) + '">'
  return buildXDefaultAvatarHTML(name)
}

function buildXDefaultAvatarHTML(name) {
  return '<span class="x-avatar-placeholder">' + xEscape((name || '我').slice(0, 1)) + '</span>'
}

function getXWeChatSvg() {
  return '<svg class="x-login-wechat-svg" viewBox="0 0 576 512" aria-hidden="true"><path d="M385.2 167.6c6.4 0 12.6.3 18.8 1.1C387.4 90.3 303.3 32 207.7 32 100.5 32 13 104.8 13 197.4c0 53.4 29.3 97.5 77.9 131.6l-19.3 58.6 68.1-34.1c24.4 4.8 43.8 9.7 68.2 9.7 6.2 0 12.1-.3 18.3-.8-3.9-12.9-6.2-26.6-6.2-40.8-.1-84.9 72.9-154 165.2-154zM280.7 114.7c14.5 0 24.2 9.7 24.2 24.4 0 14.5-9.7 24.2-24.2 24.2-14.8 0-29.3-9.7-29.3-24.2.1-14.7 14.6-24.4 29.3-24.4zm-136.4 48.6c-14.5 0-29.3-9.7-29.3-24.2 0-14.8 14.8-24.4 29.3-24.4 14.8 0 24.4 9.7 24.4 24.4 0 14.6-9.6 24.2-24.4 24.2zM563 319.4c0-77.9-77.9-141.3-165.4-141.3-92.7 0-165.4 63.4-165.4 141.3s72.8 141.3 165.4 141.3c19.3 0 38.9-5.1 58.6-9.9l53.4 29.3-14.8-48.6C534 402.1 563 363.2 563 319.4zM343.9 294.9c-9.7 0-19.3-9.7-19.3-19.4 0-9.9 9.7-19.6 19.3-19.6 14.8 0 24.4 9.7 24.4 19.6 0 9.7-9.6 19.4-24.4 19.4zm107.1 0c-9.7 0-19.3-9.7-19.3-19.4 0-9.9 9.7-19.6 19.3-19.6 14.8 0 24.4 9.7 24.4 19.6.1 9.7-9.5 19.4-24.4 19.4z"></path></svg>'
}

function xEscape(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, function(ch) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
  })
}

function formatXNumber(n) {
  if (typeof n === 'string') return n
  if (!n) return ''
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  return String(n)
}

function formatXContent(str) {
  return xEscape(str)
    .replace(/(#[A-Za-z0-9_\u4e00-\u9fa5]+)/g, '<span class="x-hashtag">$1</span>')
    .replace(/(^|[^A-Za-z0-9_&])(@[A-Za-z0-9_]+)/g, '$1<span class="x-hashtag">$2</span>')
    .replace(/\n/g, '<br>')
}

function getXHeartSvg(solid) {
  return solid
    ? '<svg viewBox="0 0 24 24"><g><path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g></svg>'
    : '<svg viewBox="0 0 24 24"><g><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g></svg>'
}

// data: { id, avatarHTML | avatar, name, verified, handle, mine, time, content,
//         comments, retweets, likes, views, liked, pending, detail }
function buildXPost(data) {
  var contentHTML = formatXContent(data.content)
  var avatarHTML = data.avatarHTML
    ? data.avatarHTML
    : (data.avatar
      ? '<img src="' + xEscape(data.avatar) + '" alt="">'
      : buildXDefaultAvatarHTML(data.name || ''))

  return '<div class="x-post' + (data.detail ? ' is-detail' : '') + '"' + (data.id ? ' data-id="' + xEscape(data.id) + '"' : '') + '>' +
    '<div class="x-post-avatar">' + avatarHTML + '</div>' +
    '<div class="x-post-body">' +
      '<div class="x-post-header">' +
        '<span class="x-post-name">' + xEscape(data.name) + '</span>' +
        (data.mine ? '<span class="x-badge-mine">我</span>' : '') +
        (data.verified ?
          '<span class="x-post-verified"><svg viewBox="0 0 24 24"><g><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"></path></g></svg></span>' : '') +
        '<span class="x-post-handle">' + xEscape(data.handle) + '</span>' +
        '<span class="x-post-dot">·</span>' +
        '<span class="x-post-time">' + xEscape(data.time) + '</span>' +
        '<span class="x-post-more"><svg viewBox="0 0 24 24"><g><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"></path></g></svg></span>' +
      '</div>' +
      '<div class="x-post-content">' + contentHTML + '</div>' +
      (data.pending ? '<div class="x-post-pending"><i class="fa fa-spinner fa-spin"></i> 网友正在围观…</div>' : '') +
      '<div class="x-post-actions">' +
        '<button class="x-post-action comment"><svg viewBox="0 0 24 24"><g><path d="M1.751 10c0-4.42 3.584-8.005 8.005-8.005h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.005zm8.005-6.005c-3.317 0-6.005 2.69-6.005 6.005 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></g></svg><span>' + formatXNumber(data.comments) + '</span></button>' +
        '<button class="x-post-action retweet"><svg viewBox="0 0 24 24"><g><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.791-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.791 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></g></svg><span>' + formatXNumber(data.retweets) + '</span></button>' +
        '<button class="x-post-action like' + (data.liked ? ' liked' : '') + '">' + getXHeartSvg(!!data.liked) + '<span>' + formatXNumber(data.likes) + '</span></button>' +
        '<button class="x-post-action views"><svg viewBox="0 0 24 24"><g><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10H6v10H4zm9.248 0v-7h2v7h-2z"></path></g></svg><span>' + formatXNumber(data.views) + '</span></button>' +
        '<button class="x-post-action bookmark"><svg viewBox="0 0 24 24"><g><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z"></path></g></svg></button>' +
        '<button class="x-post-action share"><svg viewBox="0 0 24 24"><g><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.29 3.3-1.42-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"></path></g></svg></button>' +
      '</div>' +
    '</div>' +
  '</div>'
}

function buildXBottomBar() {
  var items = [
    {
      id: 'home',
      active: true,
      defaultSvg: '<svg viewBox="0 0 24 24"><g><path d="M21.591 7.146L12.52 1.157c-.316-.21-.724-.21-1.04 0l-9.071 5.99c-.26.173-.409.456-.409.757v13.183c0 .502.418.913.929.913h6.638c.511 0 .929-.41.929-.913v-7.075h3.008v7.075c0 .502.418.913.929.913h6.638c.511 0 .929-.41.929-.913V7.904c0-.301-.158-.584-.408-.758zM20 20l-4.5.01v-7.09c0-.5-.418-.91-.929-.91H9.43c-.511 0-.929.41-.929.91L8.5 20H4V8.773l8-5.27 8 5.271V20z"></path></g></svg>',
      activeSvg: '<svg viewBox="0 0 24 24"><g><path d="M21.591 7.146L12.52 1.157c-.316-.21-.724-.21-1.04 0l-9.071 5.99c-.26.173-.409.456-.409.757v13.183c0 .502.418.913.929.913H9.14c.511 0 .929-.41.929-.913v-7.075h3.862v7.075c0 .502.418.913.929.913h6.141c.511 0 .929-.41.929-.913V7.904c0-.301-.158-.584-.408-.758z"></path></g></svg>'
    },
    {
      id: 'search',
      active: false,
      defaultSvg: '<svg viewBox="0 0 24 24"><g><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z"></path></g></svg>',
      activeSvg: '<svg viewBox="0 0 24 24"><g><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z" stroke="currentColor" stroke-width="1.5"></path></g></svg>'
    },
    {
      id: 'notifications',
      active: false,
      defaultSvg: '<svg viewBox="0 0 24 24"><g><path d="M19.993 9.042C19.48 5.017 16.054 2 11.996 2s-7.49 3.021-7.999 7.051L2.866 18H7.1c.463 2.282 2.481 4 4.9 4s4.435-1.718 4.9-4h4.236l-1.143-8.958zM12 20c-1.306 0-2.417-.835-2.829-2h5.658c-.412 1.165-1.523 2-2.829 2zm-6.866-4l.847-6.698C6.364 6.272 8.941 4 11.996 4s5.627 2.268 6.013 5.295L18.858 16H5.134z"></path></g></svg>',
      activeSvg: '<svg viewBox="0 0 24 24"><g><path d="M11.996 2c-4.062 0-7.49 3.021-7.999 7.051L2.866 18H7.1c.463 2.282 2.481 4 4.9 4s4.435-1.718 4.9-4h4.236l-1.143-8.958C19.48 5.017 16.054 2 11.996 2zM9.171 18h5.658c-.412 1.165-1.523 2-2.829 2s-2.417-.835-2.829-2z"></path></g></svg>'
    },
    {
      id: 'messages',
      active: false,
      defaultSvg: '<svg viewBox="0 0 24 24"><g><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 5.333 8-5.333V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 5.334-8-5.334V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z"></path></g></svg>',
      activeSvg: '<svg viewBox="0 0 24 24"><g><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 5.333 8-5.333V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 5.334-8-5.334V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z" stroke="currentColor" stroke-width="1"></path></g></svg>'
    }
  ]

  return items.map(function(item) {
    return '<div class="x-bottombar-item' + (item.active ? ' active' : '') + '" data-tab="' + item.id + '">' +
      '<span class="icon-default">' + item.defaultSvg + '</span>' +
      '<span class="icon-active">' + item.activeSvg + '</span>' +
    '</div>'
  }).join('')
}
