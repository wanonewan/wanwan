// ao3.js — 同人文站（AO3 风格）
// 依赖：db.js、main.js（openPage / closePage / toast）、settings.js（window.callAI）
// 生成格式：不用 JSON。第一段是几行「键：值」的元信息，每章用 ===第N章｜标题=== 分隔，
// 结尾用 ===NEXT=== 给出 3 条续写方向。这样正文里的引号、换行不会再把解析搞坏，
// 输出被截断时已经写完的章节也能保住。
;(function () {
  'use strict'

  const STORE_KEY = 'ao3Store'
  const FANDOMS = ['原创', '原耽', '动漫', '影视', '游戏', 'RPF']
  const RATINGS = [
    { id: 'g', name: '全年龄向' },
    { id: 't', name: '青少年及以上' },
    { id: 'm', name: '成熟向' },
    { id: 'e', name: '限制级' }
  ]
  // 归档警告只作为标签使用；不提供“未成年相关”这一项
  const WARNINGS = ['无归档警告适用', '详细描写暴力', '主要角色死亡', '非自愿性描写', '选择不使用归档警告']
  const CATS = ['无CP / Gen', '男男', '女女', '男女', '多人', '其他']
  const THEME_GROUPS = [
    { id: 'world', name: '世界观', options: ['校园', '现代都市', '古代', '穿越', '仙侠', '末日', '职场', '娱乐圈', '科幻', '悬疑', '西幻'] },
    { id: 'ending', name: '结局', options: ['HE', 'OE', 'BE', '开放结局', '未完待续'] },
    { id: 'tone', name: '基调', options: ['甜', '虐', '轻松', '沉重', '搞笑', '治愈', '刀糖并存'] },
    { id: 'arc', name: '关系走向', options: ['先婚后爱', '破镜重圆', '青梅竹马', '欢喜冤家', '陌生人', '上下级'] },
    { id: 'plot', name: '叙事元素', options: ['日常', '重生', '时间循环', '群像', '双强', '追妻火葬场', '养成'] }
  ]
  const WORDS = [800, 1200, 1500, 2000]
  const CHAPTER_COUNTS = [1, 2, 3]

  let store = null
  let busy = false
  const progressText = {}

  // ===== 小工具 =====
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  }
  function ratingName(id) { const r = RATINGS.find(x => x.id === id); return r ? r.name : '全年龄向' }
  function charName(c) { return (c && (c.nick || c.name)) || '角色' }
  function wordCount(text) { return String(text || '').replace(/\s/g, '').length }
  function workWords(w) { return (w.chapters || []).reduce((n, c) => n + wordCount(c.body), 0) }

  async function load() {
    if (store) return store
    let v = null
    try { v = (await db.config.get(STORE_KEY))?.value } catch (_) {}
    store = v && typeof v === 'object' ? v : {}
    if (!Array.isArray(store.works)) store.works = []
    if (!Array.isArray(store.bookmarks)) store.bookmarks = []
    if (!Array.isArray(store.kudos)) store.kudos = []
    if (typeof store.seq !== 'number') store.seq = 1
    if (!store.voices || typeof store.voices !== 'object') store.voices = {}
    // 上次生成到一半就被关掉的作品：标记为失败，可以重试
    store.works.forEach(w => {
      if (w.status === 'generating') { w.status = (w.chapters && w.chapters.length) ? 'ready' : 'failed'; w.failReason = '上次生成被中断，请重试' }
      w.continuing = false
      if (w.id >= store.seq) store.seq = w.id + 1
    })
    return store
  }
  async function persist() {
    try { await db.config.put({ key: STORE_KEY, value: store }) } catch (e) { console.warn('[ao3] 保存失败', e) }
  }
  function getWork(id) { return store.works.find(w => w.id === id) || null }

  // ===== 正文处理 =====
  function normalizeBody(text) {
    let s = String(text == null ? '' : text).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    if (/\\n/.test(s)) s = s.replace(/\\n/g, '\n').replace(/\\t/g, ' ')
    s = s.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n')
    if (s.indexOf('\n') < 0 && s.length > 180) s = s.replace(/([。！？…—”」』])\s*/g, '$1\n\n')
    return s.trim()
  }
  function bodyHTML(text) {
    let h = esc(normalizeBody(text))
    h = h.replace(/“([^”\n]*)”/g, '<span class="ao3-say">“$1”</span>')
    h = h.replace(/（([^）\n]*)）/g, '<span class="ao3-think">（$1）</span>')
    h = h.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    h = h.replace(/〔([^〕\n]*)〕/g, '<span class="ao3-env">〔$1〕</span>')
    return h
  }

  // 解析：元信息 + 章节 + 续写方向
  function parseGenerated(raw) {
    const text = String(raw == null ? '' : raw).replace(/\r\n/g, '\n').replace(/```[a-zA-Z]*\n?/g, '')
    const re = /^[ \t]*={3,}[ \t]*(.+?)[ \t]*={3,}[ \t]*$/gm
    const marks = []
    let m
    while ((m = re.exec(text))) marks.push({ head: m[1].trim(), start: m.index, end: re.lastIndex })
    const meta = { title: '', summary: '', relationship: '', tags: [] }
    const chapters = []
    let next = []
    const parseMetaLines = block => {
      block.split('\n').forEach(line => {
        const mm = line.match(/^\s*(标题|摘要|关系|标签)\s*[：:]\s*(.*)$/)
        if (!mm) return
        const v = mm[2].trim()
        if (mm[1] === '标题') meta.title = v.slice(0, 60)
        else if (mm[1] === '摘要') meta.summary = v.slice(0, 400)
        else if (mm[1] === '关系') meta.relationship = v.slice(0, 80)
        else meta.tags = v.split(/[、,，;；]/).map(t => t.trim()).filter(Boolean).slice(0, 12)
      })
    }
    if (!marks.length) {
      const plain = normalizeBody(text)
      return plain ? { meta, chapters: [{ title: '第 1 章', body: plain }], next } : null
    }
    marks.forEach((mk, i) => {
      const block = text.slice(mk.end, i + 1 < marks.length ? marks[i + 1].start : text.length)
      if (/^META$/i.test(mk.head) || /^元信息$/.test(mk.head)) {
        parseMetaLines(block)
      } else if (/^NEXT$/i.test(mk.head) || /^续写方向$/.test(mk.head)) {
        next = block.split('\n').map(l => l.replace(/^\s*(方向\s*[一二三123]\s*[：:.、]?|\d+\s*[.、：:)）]|[-·•*])\s*/, '').trim())
          .filter(Boolean).map(l => l.slice(0, 100)).slice(0, 3)
      } else {
        const cm = mk.head.match(/^第?\s*(\d+)\s*章\s*[｜|:：\-—]?\s*(.*)$/)
        const body = normalizeBody(block)
        if (cm && body) {
          const t = (cm[2] || '').trim()
          chapters.push({ no: Number(cm[1]), title: t ? ('第 ' + cm[1] + ' 章 · ' + t).slice(0, 50) : '第 ' + cm[1] + ' 章', body })
        }
      }
    })
    if (!chapters.length) {
      // 没有章节标记：把元信息之外的内容当作一章
      const firstChapterStart = marks.length ? marks[marks.length - 1].end : 0
      const rest = normalizeBody(text.slice(firstChapterStart))
      if (rest) chapters.push({ no: 1, title: '第 1 章', body: rest })
    }
    return chapters.length ? { meta, chapters, next } : null
  }

  // ===== 提示词 =====
  function userCenteredRule(userName, charNames) {
    return `【主角与关系中心（必须遵守）】\n用户角色「${userName}」是贯穿全文的主角和关系中心，所选角色（${charNames.join('、')}）每一位都必须与「${userName}」有具体的互动和各自的关系发展。多选角色的意思是“这些人和${userName}的故事”，不要擅自把角色之间配成 CP，也不要把${userName}写成路人或只在开头出现。每章都要承接${userName}的参与。无 CP 分类写以${userName}为中心的友情或群像。`
  }

  async function buildContext(work) {
    const user = await db.characters.get(work.ownerUid)
    const chars = []
    for (const id of work.charIds) {
      const c = await db.characters.get(id)
      if (c) chars.push(c)
    }
    const userName = (user && (user.nick || user.name)) || '用户'
    const charBlocks = chars.map(c => `【角色：${charName(c)}】\n${c.description || '（未设定）'}`).join('\n\n')
    let lore = ''
    try {
      if (window.getLorebookContext && chars[0]) {
        lore = await window.getLorebookContext(chars[0].id, [{ role: 'user', content: [work.prompt, work.fandom, (work.themeLines || []).join(' ')].join('\n') }]) || ''
      }
    } catch (_) {}
    return { user, userName, chars, charNames: chars.map(charName), charBlocks, lore }
  }

  // 文风规则：用正面写法 + 数量限制 + 对照例子（单纯写“禁止”几乎没用）
  function styleRule() {
    return '\n\n【文风要求（必须遵守，写作时随时对照）】\n' +
      '1. 想说什么就直接说。不要先否定一个没人提过的说法，再补一句纠正。像“他不是生气，而是害怕”“这不是A，是B”“与其说A，不如说B”“没有A，只有B”这类对比转折句，整篇最多出现 2 处，且只能出现在真正需要对比的地方。\n' +
      '   如果某处确实需要“否定再转折”，就写得有分量：被否定的必须是读者真会误会的东西，转折之后要展开动作、感官和感受，不要写成“不是A，就是B”“不是A，是B”这种短短两截就结束的句子。\n' +
      '   坏：他不是生气，而是害怕。 → 好：他的手指在杯沿上收紧，半天没松开。\n' +
      '   坏：这不是安慰，是承诺。 → 好：她说：“以后我都在。”\n' +
      '   坏：不是亲，就是贴着。 → 可以这样写（真需要时）：不是暧昧的亲吮，只是贴着，平静而有重量。鼻尖吸气，索取一种很久以来缺少的安心。\n' +
      '2. 不要写“怎么……怎么……”的排比句，也不要连续两句以上用同一种句式开头或收尾。句子长短、句式要有变化，像真人写的。\n' +
      '3. 情绪用动作、细节、对白来呈现，不要替读者总结感悟，不要段末升华。'
  }

  function systemPrompt(mode, ctx, work, chapN, per, startNo) {
    const themeText = (work.themeLines || []).length ? work.themeLines.join('；') : '不限（由你合理发挥）'
    const formatRule =
      '输出格式（严格遵守，不要用 JSON，不要用 Markdown 代码块，不要任何额外说明）：\n' +
      (mode === 'new'
        ? '===META===\n标题：作品标题（30字内）\n摘要：80～200字的摘要\n关系：关系标签，如“甲 / 乙”\n标签：3～8个附加标签，用顿号分隔\n'
        : '') +
      Array.from({ length: chapN }, (_, i) => `===第${startNo + i}章｜本章标题===\n（这一章的正文）`).join('\n') +
      '\n===NEXT===\n方向一：（20～40字的后续续写主旨）\n方向二：（与上一条不同）\n方向三：（与前两条不同）\n'
    return `你是一位同人小说作者，为「Archive of Our Own」风格的同人站供稿。所有出场人物都是成年人。\n` +
      formatRule +
      `\n正文要求：中文；每章约 ${per} 字（可上下浮动 15%）；含对话与场景；符合评级与归档警告；角色言行贴合各自设定；章节之间情节连贯。\n` +
      `排版：自然分段，段落之间空一行；台词放在中文引号“ ”里；心理活动放在（ ）里；强调用 *星号*；场景转换可用〔 〕。` +
      (mode === 'continue' ? `\n这是续写：紧接上一章的剧情，不要复述旧章；本次续写必须围绕用户选定的「生成方向」展开。\n【防止绕圈】用户会给你「前情概要」，里面写过的场景、对话和桥段都不要再写一遍；每一章都必须出现新的事件、冲突、信息或关系变化，让剧情真正向前推进。` : '') +
      `\n你在这一次回复里写完全部章节，不要拆成多次。\n` +
      userCenteredRule(ctx.userName, ctx.charNames) +
      styleRule() +
      (ctx.lore ? `\n\n【世界观参考】\n${ctx.lore}` : '') +
      `\n\n主题方向：${themeText}`
  }

  function userPrompt(mode, ctx, work, chapN, per, startNo, direction) {
    const head =
      `领域：${work.fandom}\n评级：${work.rating}\n归档警告：${work.warning}\n分类：${work.category}\n` +
      `登场：${[ctx.userName].concat(ctx.charNames).join('、')}\n每章字数：约 ${per} 字\n` +
      (work.prompt ? `创作备注：${work.prompt}\n` : '') +
      `\n【用户角色：${ctx.userName}】\n${(ctx.user && ctx.user.description) || '（未设定）'}\n\n${ctx.charBlocks}\n`
    if (mode === 'new') {
      return head + `\n请自行拟定标题、关系、标签与摘要，并一次性写出全部 ${chapN} 章，最后给出 3 条续写方向。按系统提示的格式输出。\n（写作提醒：直接陈述，少用“不是……而是……”对比句，不写“怎么……怎么……”排比。）`
    }
    const chaps = work.chapters || []
    const last = chaps[chaps.length - 1]
    let tail = last ? normalizeBody(last.body) : ''
    if (tail.length > 700) tail = '…' + tail.slice(-700)
    return `作品标题：${work.title}\n摘要：${work.summary || ''}\n关系：${work.relationship || ''}\n` + head +
      `\n【前情概要（按章节顺序，以下剧情都已经发生过，不要重复）】\n${buildRecap(chaps)}\n\n【上一章的结尾（只用来衔接场景和语气，不要复述）】\n${tail}\n\n` +
      `【本次选定的生成方向（必须作为续写主旨）】${direction}\n\n请从第 ${startNo} 章起，一次性续写 ${chapN} 章，最后给出 3 条新的续写方向。按系统提示的格式输出。\n（写作提醒：直接陈述，少用“不是……而是……”对比句，不写“怎么……怎么……”排比。）`
  }

  // ===== 前文概要：每章生成后补一份概要，续写时读「前情概要」而不是整章原文，避免忘事、剧情绕圈 =====
  const sumJobs = {}

  function parseSummaries(raw) {
    const out = {}
    const re = /===\s*(\d+)\s*===\s*([\s\S]*?)(?=\n\s*===\s*\d+\s*===|$)/g
    let m
    while ((m = re.exec(String(raw || '')))) {
      const t = m[2].trim()
      if (t) out[Number(m[1])] = t.slice(0, 400)
    }
    return out
  }

  // 给还没有概要的章节补算概要（只看前 upTo 章；不传则全部）。同一部作品的补算排队执行，不会撞车
  function ensureSummaries(work, upTo) {
    const run = async () => {
      const chaps = work.chapters || []
      const limit = typeof upTo === 'number' ? Math.min(upTo, chaps.length) : chaps.length
      const missing = []
      for (let i = 0; i < limit; i++) if (chaps[i] && !chaps[i].summary) missing.push(i)
      if (!missing.length || typeof window.callAI !== 'function') return
      for (let b = 0; b < missing.length; b += 4) {
        const batch = missing.slice(b, b + 4)
        const text = batch.map(i => `【第${i + 1}章｜${chaps[i].title}】\n${normalizeBody(chaps[i].body)}`).join('\n\n')
        let raw = ''
        try {
          raw = await window.callAI([{ role: 'user', content: `作品：${work.title}\n\n${text}\n\n请为上面每一章各写一份概要。` }], {
            system: '你是小说编辑，负责为每一章写「前情概要」，供作者以后续写时回顾。要求：中文；每章 100～180 字；只写客观发生了什么（按时间顺序的关键事件、重要的对话与决定、人物关系或心态的变化、留下的悬念与伏笔），不写评价和感想；保留人名。输出格式严格为：\n===章节号===\n概要文字\n（章节号用阿拉伯数字，每章一段，不要任何额外说明）',
            temperature: 0.3
          })
        } catch (e) { console.warn('[ao3] 概要生成失败', e); continue }
        const got = parseSummaries(raw)
        batch.forEach(i => { if (got[i + 1]) chaps[i].summary = got[i + 1] })
        await persist()
      }
    }
    const prev = sumJobs[work.id] || Promise.resolve()
    const p = prev.then(run, run)
    sumJobs[work.id] = p.catch(() => {})
    return p
  }

  // 续写时给模型看的「前情概要」：每章一段；缺概要的章节退回成开头一小段；章节很多时早期章节压短
  function buildRecap(chaps) {
    const n = chaps.length
    return chaps.map((c, i) => {
      let t = c.summary || (normalizeBody(c.body).replace(/\s+/g, ' ').slice(0, 160) + '…')
      if (n > 12 && i < n - 12) t = t.slice(0, 110)
      return `第${i + 1}章《${String(c.title || '').replace(/^第\s*\d+\s*章\s*[·・]?\s*/, '')}》：${t}`
    }).join('\n')
  }

  // ===== 套话句式检测与润色 =====
  // 只检查叙述，不检查台词（“ ”「 」『 』里的内容），人说话偶尔这么讲是正常的
  const CONTRAST_RES = [
    /(?:并不是|并非|不是|不只是|不仅仅是|不单单是|不光是)[^。！？!?\n]{1,40}?(?:而是|[，,；;：:—…\n]+\s*(?:这?是(?!否)|更是|只是|就是|才是|不过是|只不过是|仅仅是|倒是|反而是))/g,
    /(?:并不是|并非|不是)[^。！？!?\n]{1,30}[。！？!?]+\s*(?:而是|只是|就是|才是|这是|是(?![的否]))/g,
    /与其说[^。！？!?\n]{1,40}?[，,；;]\s*(?:倒)?不如说/g,
    /(?:没有|不再是)[^。！？!?\n，,；;]{1,25}[，,；;]\s*(?:(?:没有|不再是)[^。！？!?\n，,；;]{1,25}[，,；;]\s*)?(?:只有|只剩|有的只是)/g
  ]
  const WHY_RE = /怎么[^。！？!?\n]{1,18}?[，,；;、。]\s*(?:又|也|还|就)?怎么/g

  function maskQuotes(s) { return String(s || '').replace(/“[^”]*”|「[^」]*」|『[^』]*』/g, m => '　'.repeat(m.length)) }

  // 返回命中列表 [{ kind: 'contrast' | 'why', index }]
  function findHits(masked) {
    const out = []
    CONTRAST_RES.forEach(re => {
      re.lastIndex = 0
      let m
      while ((m = re.exec(masked))) {
        if (m[0].length === 0) { re.lastIndex++; continue }
        if (masked[m.index - 1] === '是') continue // “是不是”
        out.push({ kind: 'contrast', index: m.index })
      }
    })
    WHY_RE.lastIndex = 0
    let w
    while ((w = WHY_RE.exec(masked))) out.push({ kind: 'why', index: w.index })
    return out
  }

  function quotesOf(t) { return (String(t || '').match(/“[^”]*”/g) || []).join('|') }

  function parseNumbered(raw) {
    const out = {}
    const text = String(raw || '').replace(/```[a-zA-Z]*\n?/g, '')
    const re = /===\s*(\d+)\s*===\s*\n?([\s\S]*?)(?=\n\s*===\s*\d+\s*===|$)/g
    let m
    while ((m = re.exec(text))) { const t = m[2].trim(); if (t) out[Number(m[1])] = t }
    return out
  }

  // 找出需要处理的段落：怎么…怎么… 一律处理；对比转折每章保留第 1 处，其余处理
  function flagParas(paras) {
    const flagged = []
    let seen = 0
    paras.forEach((p, i) => {
      const hs = findHits(maskQuotes(p))
      const w = hs.filter(h => h.kind === 'why').length
      const c = hs.length - w
      let bad = w > 0
      if (c) { seen += c; if (seen > 1) bad = true }
      if (bad) flagged.push(i)
    })
    return flagged
  }

  // 改写结果是否合格；返回空字符串表示合格，否则返回原因
  function polishCheck(old, neu) {
    if (!neu) return '没返回'
    const ratio = neu.length / Math.max(1, old.length)
    // 很短的段落（如“不是疼，是空。”）本来就只有几个字，放宽长度限制
    if (old.length <= 40 ? (neu.length < 2 || ratio > 3.5) : (ratio < 0.5 || ratio > 1.6)) return '长度不合格'
    if (quotesOf(neu) !== quotesOf(old)) return '改了对白'
    if (findHits(maskQuotes(neu)).length >= findHits(maskQuotes(old)).length) return '句式没减少'
    return ''
  }

  const POLISH_SYS = '你是小说文字编辑。下面是若干段小说正文，每段含有生硬的“对比转折”句（如“不是……而是……”“不是……，是……”“不是……，就是……”“与其说……不如说……”“没有……只有……”）或“怎么……怎么……”排比句。请改写这些段落：\n①把有问题的句子改成直接陈述——只写真实的那一面，删掉被否定的那一半，必要时用一个具体的动作或细节代替（例：“不是亲，就是贴着”可改成“他的唇贴在她颈窝里，没有动，鼻尖轻轻吸了口气”；很短的“不是疼，是空。”可结合上文改成“胸口空落落的。”）；\n②不要用别的对比句或排比句来顶替；\n③除有问题的句子外，其余文字、人名、事实、对白（引号“ ”里的内容）一字不改；\n④保持原文的语气和人称。\n每段前面可能带有【上文】，只是帮你理解语境，不要输出；只输出【待改】那一段改写后的结果（不要带标签）。\n输出格式严格为：\n===编号===\n改写后的整段\n（每段一个编号，不要任何额外说明）'

  async function askRewrite(paras, idxs, strict) {
    const text = idxs.map((pi, k) => `===${k + 1}===\n` + (pi > 0 ? `【上文（只供参考，不要输出）】${paras[pi - 1].slice(-150)}\n` : '') + `【待改】${paras[pi]}`).join('\n\n')
    let raw = ''
    try {
      raw = await window.callAI([{ role: 'user', content: text }], {
        system: POLISH_SYS + (strict ? '\n⑤这些段落上一次没改成功。这次必须把有问题的句子彻底重写成直接陈述，可以结合上文把意思写具体，不要原样返回。' : ''),
        temperature: strict ? 0.8 : 0.6
      })
    } catch (e) { console.warn('[ao3] 润色调用失败', e); return {} }
    const got = parseNumbered(raw)
    const out = {}
    idxs.forEach((pi, k) => {
      if (got[k + 1]) out[pi] = got[k + 1].replace(/^【待改】\s*/, '').replace(/^【上文[^】]*】[^\n]*\n?/, '').trim()
    })
    return out
  }

  // 只把命中的段落发给 AI 改写，其余原样不动。第一轮 6 段一批；没改成的再单独加强重试一轮。
  // 改写不合格（改了台词、长度不对、句式没减少）就保留原文，并返回失败原因
  async function polishBody(body) {
    // 优先用共用的 prose-guard（能检出跨段落的句式）；没加载时用下面的旧逻辑
    if (window.ProseGuard && typeof window.callAI === 'function') {
      const r = await window.ProseGuard.polishText(normalizeBody(body), { allow: 1, maxUnits: 12 })
      return { body: r.text, fixed: r.fixed, failed: r.failed }
    }
    const paras = normalizeBody(body).split(/\n{2,}/)
    const flagged = flagParas(paras).slice(0, 12)
    if (!flagged.length || typeof window.callAI !== 'function') return { body: paras.join('\n\n'), fixed: 0, failed: [] }
    let fixed = 0
    let pending = flagged
    const lastWhy = {}
    for (let round = 0; round < 2 && pending.length; round++) {
      const size = round === 0 ? 6 : 3
      const next = []
      for (let b = 0; b < pending.length; b += size) {
        const batch = pending.slice(b, b + size)
        const got = await askRewrite(paras, batch, round === 1)
        batch.forEach(pi => {
          const why = polishCheck(paras[pi], got[pi])
          if (!why) { paras[pi] = got[pi]; fixed++ } else { next.push(pi); lastWhy[pi] = why }
        })
      }
      pending = next
    }
    return { body: paras.join('\n\n'), fixed, failed: pending.map(pi => lastWhy[pi]) }
  }

  // ===== 生成 =====
  async function generate(workId, mode, opts) {
    opts = opts || {}
    const work = getWork(workId)
    if (!work) return
    if (busy) { window.toast?.('正在生成，请稍候'); return }
    if (typeof window.callAI !== 'function') { window.toast?.('请先在设置里配置 API'); return }
    busy = true
    // rewrite：重写第 rewriteAt+1 章。写好之前旧章节原样保留，失败也不会丢；写好后这一章及之后的章节被新的一章取代
    const isRewrite = mode === 'rewrite'
    const rwAt = isRewrite ? Math.max(0, Math.min(parseInt(opts.rewriteAt, 10) || 0, (work.chapters || []).length - 1)) : -1
    const isContinue = mode === 'continue' || (isRewrite && rwAt > 0)
    const apiMode = isContinue ? 'continue' : 'new'
    const chapN = isRewrite ? 1 : (isContinue ? opts.chapN : work.chapterCount)
    const per = work.wordsPerChapter || 1500
    const startNo = isRewrite ? rwAt + 1 : (isContinue ? (work.chapters.length + 1) : 1)
    const promptWork = isRewrite ? Object.assign({}, work, { chapters: (work.chapters || []).slice(0, rwAt) }) : work
    if (isContinue || isRewrite) work.continuing = true
    else { work.status = 'generating'; work.failReason = '' }
    progressText[workId] = isRewrite ? `正在重写第 ${rwAt + 1} 章…` : '正在等待接口返回，较长的文章可能需要几分钟…'
    await persist()
    refreshReaderIfOpen(workId)
    refreshList()
    try {
      if (isContinue) {
        progressText[workId] = '正在整理前文概要…'
        refreshReaderIfOpen(workId, isRewrite ? rwAt : undefined)
        try { await ensureSummaries(work, isRewrite ? rwAt : undefined) } catch (e) { console.warn('[ao3] 补算概要失败，改用原文开头', e) }
        progressText[workId] = isRewrite ? `正在重写第 ${rwAt + 1} 章…` : '正在等待接口返回，较长的文章可能需要几分钟…'
        refreshReaderIfOpen(workId, isRewrite ? rwAt : undefined)
      }
      const ctx = await buildContext(work)
      const raw = await window.callAI([{ role: 'user', content: userPrompt(apiMode, ctx, promptWork, chapN, per, startNo, opts.direction) }], {
        system: systemPrompt(apiMode, ctx, promptWork, chapN, per, startNo),
        temperature: 0.85
      })
      const parsed = parseGenerated(raw)
      if (!parsed || !parsed.chapters.length) {
        window._lastAo3Raw = String(raw || '')
        throw new Error('模型返回内容无法解析，请重试')
      }
      const chaps = parsed.chapters.slice(0, chapN).map((c, i) => {
        const no = startNo + i
        let title = c.title
        if (!/^第\s*\d+\s*章/.test(title)) title = '第 ' + no + ' 章 · ' + title
        return { title: title.replace(/^第\s*\d+\s*章/, '第 ' + no + ' 章'), body: c.body }
      })
      let polished = 0
      if (store.polish !== false) {
        progressText[workId] = '正在润色套话句式…'
        refreshReaderIfOpen(workId, isRewrite ? rwAt : undefined)
        for (const c of chaps) {
          try { const r = await polishBody(c.body); c.body = r.body; polished += r.fixed } catch (e) { console.warn('[ao3] 润色失败，保留原文', e) }
        }
      }
      if ((isContinue || isRewrite) && opts.direction && chaps[0]) chaps[0].dir = opts.direction
      if (chaps.length) chaps[chaps.length - 1].nextDirs = parsed.next || []
      if (isRewrite) {
        work.chapters = (work.chapters || []).slice(0, rwAt).concat(chaps)
        work.continuing = false
      } else if (isContinue) {
        work.chapters = (work.chapters || []).concat(chaps)
        work.continuing = false
      } else {
        work.chapters = chaps
        work.title = parsed.meta.title || ((ctx.charNames.slice(0, 2).join('·') + ' · 同人') || '未命名作品')
        work.summary = parsed.meta.summary || (chaps[0].body.replace(/\s+/g, ' ').slice(0, 120) + '…')
        work.relationship = parsed.meta.relationship || ctx.charNames.map(n => n + ' / ' + ctx.userName).join('、')
        work.tags = parsed.meta.tags.length ? parsed.meta.tags : (work.themeLines || []).map(t => t.replace(/^[^：:]+[：:]/, '')).slice(0, 8)
        work.status = 'ready'
      }
      work.nextDirections = parsed.next || []
      work.words = workWords(work)
      work.failReason = ''
      await persist()
      ensureSummaries(work).catch(() => {}) // 后台给新章节补概要，不让你等
      window.toast?.((isRewrite ? `已重写第 ${rwAt + 1} 章` : isContinue ? `已续写 ${chaps.length} 章` : `已生成「${work.title}」`) + (polished ? `（润色 ${polished} 处）` : ''))
    } catch (e) {
      if (isContinue || isRewrite) work.continuing = false
      else work.status = 'failed'
      work.failReason = String((e && e.message) || '生成失败').slice(0, 120)
      await persist()
      window.toast?.(work.failReason)
    } finally {
      busy = false
      delete progressText[workId]
      refreshReaderIfOpen(workId, isRewrite ? rwAt : isContinue ? (work.chapters.length - 1) : 0)
      refreshList()
    }
  }

  // ===== 页面：主页 =====
  const ui = { tab: 'works', keyword: '', sort: 'date', onlyBookmarks: false, pick: { ownerUid: 0, chars: {}, themes: {} } }

  function symHTML(w) {
    const r = w.ratingId || 'g'
    const warn = w.warning || ''
    const wCls = /无归档/.test(warn) ? 'warn-n' : /不使用/.test(warn) ? 'warn-c' : 'warn-y'
    const wTxt = /无归档/.test(warn) ? '✓' : /不使用/.test(warn) ? '?' : '!'
    const cat = w.category || ''
    const short = /男男/.test(cat) ? 'M/M' : /女女/.test(cat) ? 'F/F' : /男女/.test(cat) ? 'F/M' : /多人/.test(cat) ? 'Multi' : /其他/.test(cat) ? 'Other' : 'Gen'
    return `<p class="ao3-required-tags"><span class="ao3-sym r-${r}" title="${esc(w.rating)}">${r.toUpperCase()}</span><span class="ao3-sym ${wCls}" title="${esc(warn)}">${wTxt}</span><span class="ao3-sym cat">${short}</span></p>`
  }

  function cardHTML(w) {
    const st = w.status || 'ready'
    const badge = st === 'generating' ? '<span class="ao3-badge busy">生成中</span>' : st === 'failed' ? '<span class="ao3-badge fail">生成失败</span>' : ''
    const tags = (w.tags || []).map(t => `<a class="tag">${esc(t)}</a>`).join(', ')
    const sum = w.summary || (st === 'generating' ? '正文与摘要生成中…' : st === 'failed' ? (w.failReason || '生成失败') : '（无摘要）')
    const date = new Date(w.ts).toLocaleDateString()
    return `<div class="ao3-blurb-wrap"><div class="ao3-blurb rating-${w.ratingId || 'g'}" data-id="${w.id}">
      <h4 class="ao3-heading-s"><a>${esc(w.title)}</a>${badge}</h4>
      <div class="ao3-byline">by ${esc(w.author)} · ${esc(date)}</div>
      ${symHTML(w)}
      <div class="ao3-fandom-head">fandom：<a>${esc(w.fandom)}</a></div>
      ${w.relationship ? `<div class="ao3-taglist"><b>relationships：</b><a class="tag">${esc(w.relationship)}</a></div>` : ''}
      ${tags ? `<div class="ao3-taglist"><b>tags：</b>${tags}</div>` : ''}
      <blockquote class="ao3-summary">${esc(sum)}</blockquote>
      <div class="ao3-stats">Words ${workWords(w)} · Chapters ${(w.chapters || []).length} · Kudos ${w.kudos || 0}${store.bookmarks.includes(w.id) ? ' · 已加书签' : ''}</div>
    </div><button type="button" class="ao3-blurb-del" data-del="${w.id}">删除</button></div>`
  }

  function filteredWorks() {
    const kw = ui.keyword.trim().toLowerCase()
    const list = store.works.filter(w => {
      if (ui.onlyBookmarks && !store.bookmarks.includes(w.id)) return false
      if (kw) {
        const hay = [w.title, w.author, w.summary, w.fandom, w.relationship, (w.tags || []).join(' '), (w.characters || []).join(' ')].join(' ').toLowerCase()
        if (hay.indexOf(kw) === -1) return false
      }
      return true
    })
    list.sort((a, b) => ui.sort === 'words' ? workWords(b) - workWords(a) : ui.sort === 'kudos' ? (b.kudos || 0) - (a.kudos || 0) : b.ts - a.ts)
    return list
  }

  function refreshList() {
    const box = document.getElementById('ao3-list')
    if (!box) return
    const list = filteredWorks()
    box.innerHTML = list.length ? list.map(cardHTML).join('') :
      '<div class="ao3-empty"><b>还没有作品</b><p>去「发布」页写一篇吧</p></div>'
    const head = document.getElementById('ao3-count')
    if (head) head.textContent = list.length + ' Works'
  }

  async function showAo3Page() {
    if (document.getElementById('ao3-page')) return
    await load()
    const page = document.createElement('div')
    page.id = 'ao3-page'
    page.className = 'full-page ao3-view'
    page.innerHTML = `
      <div class="ao3-topbar">
        <button class="ao3-back" id="ao3-back" type="button"><i class="fa fa-angle-left"></i></button>
        <div class="ao3-logo"><span class="ao3-logo-mark">AO3</span><span class="ao3-logo-text"><b>同人文站</b><i>An Archive of Our Own</i></span></div>
      </div>
      <div class="ao3-nav" id="ao3-nav">
        <button type="button" data-tab="works" class="active">作品</button>
        <button type="button" data-tab="post">发布</button>
      </div>
      <div class="ao3-main" id="ao3-main"></div>`
    page.querySelector('#ao3-back').addEventListener('click', () => window.closePage('ao3-page'))
    page.querySelector('#ao3-nav').addEventListener('click', e => {
      const b = e.target.closest('[data-tab]')
      if (!b) return
      ui.tab = b.dataset.tab
      renderMain(page)
    })
    window.openPage(page)
    renderMain(page)
  }

  async function renderMain(page) {
    page.querySelectorAll('#ao3-nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === ui.tab))
    const main = page.querySelector('#ao3-main')
    if (ui.tab === 'works') renderWorksTab(main)
    else await renderPostTab(main, page)
  }

  function renderWorksTab(main) {
    main.innerHTML = `
      <div class="ao3-filter">
        <input id="ao3-search" type="search" placeholder="搜索标题、标签、角色…" value="${esc(ui.keyword)}">
        <div class="ao3-fandoms">
          <button type="button" class="ao3-chip${ui.sort === 'date' ? ' on' : ''}" data-sort="date">最新</button>
          <button type="button" class="ao3-chip${ui.sort === 'words' ? ' on' : ''}" data-sort="words">字数</button>
          <button type="button" class="ao3-chip${ui.sort === 'kudos' ? ' on' : ''}" data-sort="kudos">点赞</button>
          <button type="button" class="ao3-chip${ui.onlyBookmarks ? ' on' : ''}" data-bm="1">只看书签</button>
        </div>
      </div>
      <h2 class="ao3-heading"><span id="ao3-count"></span></h2>
      <div id="ao3-list"></div>`
    main.querySelector('#ao3-search').addEventListener('input', e => { ui.keyword = e.target.value; refreshList() })
    main.querySelector('.ao3-fandoms').addEventListener('click', e => {
      const b = e.target.closest('button')
      if (!b) return
      if (b.dataset.sort) ui.sort = b.dataset.sort
      if (b.dataset.bm) ui.onlyBookmarks = !ui.onlyBookmarks
      renderWorksTab(main)
    })
    main.querySelector('#ao3-list').addEventListener('click', async e => {
      const del = e.target.closest('[data-del]')
      if (del) {
        e.stopPropagation()
        const id = Number(del.dataset.del)
        const w = getWork(id)
        if (!w) return
        if (!window.confirm('删除「' + w.title + '」？删除后无法恢复。')) return
        store.works = store.works.filter(x => x.id !== id)
        store.bookmarks = store.bookmarks.filter(x => x !== id)
        store.kudos = store.kudos.filter(x => x !== id)
        await persist()
        refreshList()
        return
      }
      const card = e.target.closest('.ao3-blurb')
      if (card) openReader(Number(card.dataset.id))
    })
    refreshList()
  }

  // ===== 发布页 =====
  async function loadFriends(ownerUid) {
    const cfg = await db.config.get(`friends_${ownerUid}`)
    const ids = Array.isArray(cfg?.value) ? cfg.value : []
    const rows = []
    for (const id of ids) {
      const c = await db.characters.get(parseInt(id, 10))
      if (c && c.type !== 'user') rows.push(c)
    }
    return rows
  }

  async function renderPostTab(main, page) {
    const users = (await db.characters.where('type').equals('user').toArray()).sort((a, b) => (b.id || 0) - (a.id || 0))
    if (!users.length) {
      main.innerHTML = '<div class="ao3-empty"><b>还没有微信账号</b><p>请先在微信里登录或创建 USER 角色</p></div>'
      return
    }
    if (!users.some(u => u.id === ui.pick.ownerUid)) { ui.pick.ownerUid = users[0].id; ui.pick.chars = {} }
    const friends = await loadFriends(ui.pick.ownerUid)
    const themeHTML = THEME_GROUPS.map(g => {
      const cur = ui.pick.themes[g.id] || ''
      return `<div class="ao3-theme-group"><b>${esc(g.name)}</b><div class="ao3-theme-opts">` +
        `<button type="button" class="ao3-chip${!cur ? ' on' : ''}" data-tg="${g.id}" data-tv="">不限</button>` +
        g.options.map(o => `<button type="button" class="ao3-chip${cur === o ? ' on' : ''}" data-tg="${g.id}" data-tv="${esc(o)}">${esc(o)}</button>`).join('') +
        `</div></div>`
    }).join('')
    main.innerHTML = `
      <div class="ao3-form-card">
        <h2>发布新作品</h2>
        <div class="ao3-notice">每次发布会调用一次 AI，一次性写完标题、摘要、全部章节和 3 个续写方向。章数越多越慢，建议先写 1 章。</div>
        ${users.length > 1 ? `<div class="ao3-field"><label>人设（微信账号）</label><select id="ao3-user" class="ao3-select">${users.map(u => `<option value="${u.id}"${u.id === ui.pick.ownerUid ? ' selected' : ''}>${esc(u.nick || u.name || '我')}</option>`).join('')}</select></div>` : ''}
        <div class="ao3-field"><label>选择角色（可多选）</label>
          <div class="ao3-char-list" id="ao3-chars">${friends.length ? friends.map(f => `<label class="ao3-char-item"><input type="checkbox" data-cid="${f.id}"${ui.pick.chars[f.id] ? ' checked' : ''}><span><b>${esc(charName(f))}</b></span></label>`).join('') : '<div class="ao3-char-empty">这个账号还没有好友</div>'}</div></div>
        <div class="ao3-field-row">
          <div class="ao3-field"><label>领域</label><select id="ao3-fandom" class="ao3-select">${FANDOMS.map(f => `<option>${f}</option>`).join('')}</select></div>
          <div class="ao3-field"><label>分类</label><select id="ao3-cat" class="ao3-select">${CATS.map(f => `<option>${f}</option>`).join('')}</select></div>
        </div>
        <div class="ao3-field-row">
          <div class="ao3-field"><label>评级</label><select id="ao3-rating" class="ao3-select">${RATINGS.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}</select></div>
          <div class="ao3-field"><label>归档警告</label><select id="ao3-warning" class="ao3-select">${WARNINGS.map(f => `<option>${f}</option>`).join('')}</select></div>
        </div>
        <div class="ao3-field-row">
          <div class="ao3-field"><label>章数</label><select id="ao3-chapters" class="ao3-select">${CHAPTER_COUNTS.map(n => `<option value="${n}">${n} 章</option>`).join('')}</select></div>
          <div class="ao3-field"><label>每章字数</label><select id="ao3-words" class="ao3-select">${WORDS.map(n => `<option value="${n}"${n === 1500 ? ' selected' : ''}>约 ${n} 字</option>`).join('')}</select></div>
        </div>
        <div class="ao3-field"><label>主题（每类最多选一个）</label><div id="ao3-themes">${themeHTML}</div></div>
        <div class="ao3-field"><label>创作备注 <em>可选</em></label><textarea id="ao3-prompt" class="ao3-textarea" placeholder="想写什么情节、什么场景、什么感觉都可以说"></textarea></div>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin:6px 0 12px"><input type="checkbox" id="ao3-polish"${store.polish !== false ? ' checked' : ''}><span>自动润色套话句式 <em style="opacity:.6;font-style:normal">（改掉“不是…而是…”“怎么…怎么…”，超标时才多花一点 token）</em></span></label>
        <button type="button" class="ao3-submit" id="ao3-publish">发布作品</button>
      </div>`
    const q = id => main.querySelector(id)
    q('#ao3-user')?.addEventListener('change', e => { ui.pick.ownerUid = Number(e.target.value); ui.pick.chars = {}; renderPostTab(main, page) })
    q('#ao3-chars').addEventListener('change', e => {
      const inp = e.target.closest('input[data-cid]')
      if (inp) ui.pick.chars[inp.dataset.cid] = !!inp.checked
    })
    q('#ao3-themes').addEventListener('click', e => {
      const b = e.target.closest('[data-tg]')
      if (!b) return
      if (b.dataset.tv) ui.pick.themes[b.dataset.tg] = b.dataset.tv
      else delete ui.pick.themes[b.dataset.tg]
      const keep = main.querySelector('#ao3-prompt').value
      q('#ao3-themes').innerHTML = THEME_GROUPS.map(g => {
        const cur = ui.pick.themes[g.id] || ''
        return `<div class="ao3-theme-group"><b>${esc(g.name)}</b><div class="ao3-theme-opts">` +
          `<button type="button" class="ao3-chip${!cur ? ' on' : ''}" data-tg="${g.id}" data-tv="">不限</button>` +
          g.options.map(o => `<button type="button" class="ao3-chip${cur === o ? ' on' : ''}" data-tg="${g.id}" data-tv="${esc(o)}">${esc(o)}</button>`).join('') +
          `</div></div>`
      }).join('')
      main.querySelector('#ao3-prompt').value = keep
    })
    q('#ao3-polish')?.addEventListener('change', e => { store.polish = !!e.target.checked; persist() })
    q('#ao3-publish').addEventListener('click', () => publish(main, page, users))
  }

  async function publish(main, page, users) {
    if (busy) { window.toast?.('正在生成，请稍候'); return }
    const charIds = Object.keys(ui.pick.chars).filter(k => ui.pick.chars[k]).map(Number)
    if (!charIds.length) { window.toast?.('请至少选择一个角色'); return }
    if (typeof window.callAI !== 'function') { window.toast?.('请先在设置里配置 API'); return }
    const user = users.find(u => u.id === ui.pick.ownerUid)
    const names = []
    for (const id of charIds) { const c = await db.characters.get(id); if (c) names.push(charName(c)) }
    const ratingId = main.querySelector('#ao3-rating').value
    const themeLines = THEME_GROUPS.filter(g => ui.pick.themes[g.id]).map(g => g.name + '：' + ui.pick.themes[g.id])
    const work = {
      id: store.seq++,
      title: '生成中…',
      author: (user && (user.nick || user.name)) || '我',
      ownerUid: ui.pick.ownerUid,
      charIds,
      fandom: main.querySelector('#ao3-fandom').value,
      category: main.querySelector('#ao3-cat').value,
      ratingId,
      rating: ratingName(ratingId),
      warning: main.querySelector('#ao3-warning').value,
      chapterCount: Number(main.querySelector('#ao3-chapters').value) || 1,
      wordsPerChapter: Number(main.querySelector('#ao3-words').value) || 1500,
      themeLines,
      prompt: (main.querySelector('#ao3-prompt').value || '').trim().slice(0, 500),
      characters: [(user && (user.nick || user.name)) || '我'].concat(names),
      tags: [], relationship: '', summary: '', chapters: [], nextDirections: [],
      status: 'generating', continuing: false, failReason: '', kudos: 0, ts: Date.now()
    }
    store.works.unshift(work)
    await persist()
    ui.tab = 'works'
    ui.pick.chars = {}
    ui.pick.themes = {}
    renderMain(page)
    window.toast?.('已提交，正在生成…')
    generate(work.id, 'new')
  }

  // ===== 阅读页 =====
  let readState = { id: null, ci: 0 }

  function openReader(id) {
    if (document.getElementById('ao3-read-page')) return
    const w = getWork(id)
    if (!w) return
    ttsStop(true)
    ttsInit()
    readState = { id, ci: 0 }
    if (w.status === 'ready') { w.hits = (w.hits || 0) + 1; persist() }
    const page = document.createElement('div')
    page.id = 'ao3-read-page'
    page.className = 'full-page ao3-read-view'
    page.innerHTML = `
      <div class="ao3-topbar">
        <button class="ao3-back" id="ao3-read-back" type="button"><i class="fa fa-angle-left"></i></button>
        <h1 class="ao3-read-title" id="ao3-read-title"></h1>
      </div>
      <div class="ao3-read-main" id="ao3-read-main"></div>
      <div class="ao3-read-actions" id="ao3-read-actions"></div>`
    page.querySelector('#ao3-read-back').addEventListener('click', () => { ttsStop(true); window.closePage('ao3-read-page'); refreshList() })
    ;['touchstart', 'wheel'].forEach(ev => page.querySelector('#ao3-read-main').addEventListener(ev, () => { tts.touchAt = Date.now() }, { passive: true }))
    window.openPage(page)
    renderReader()
  }

  function refreshReaderIfOpen(id, ci) {
    if (!document.getElementById('ao3-read-page') || readState.id !== id) return
    if (typeof ci === 'number') readState.ci = Math.max(0, ci)
    renderReader()
  }

  function renderReader() {
    const w = getWork(readState.id)
    const page = document.getElementById('ao3-read-page')
    if (!w || !page) return
    const st = w.status || 'ready'
    page.querySelector('#ao3-read-title').textContent = w.title
    const chaps = w.chapters || []
    if (readState.ci >= chaps.length) readState.ci = 0
    const cur = chaps[readState.ci]
    const tagList = (w.tags || []).map(t => `<a class="tag">${esc(t)}</a>`).join(', ')
    const metaRows = [
      ['Rating', w.rating], ['Archive Warning', w.warning], ['Category', w.category], ['Fandom', w.fandom],
      ['Relationship', w.relationship], ['Characters', (w.characters || []).join('、')]
    ].filter(r => r[1]).map(r => `<div class="meta-row"><dt>${r[0]}:</dt><dd>${esc(r[1])}</dd></div>`).join('') +
      (tagList ? `<div class="meta-row"><dt>Additional Tags:</dt><dd>${tagList}</dd></div>` : '') +
      ((w.themeLines || []).length ? `<div class="meta-row"><dt>Themes:</dt><dd>${esc(w.themeLines.join('、'))}</dd></div>` : '') +
      `<div class="meta-row"><dt>Stats:</dt><dd>${workWords(w)} words · ${chaps.length} chapters · ${w.kudos || 0} kudos · ${w.hits || 0} hits</dd></div>`
    let body = ''
    if (st === 'generating') {
      body = `<div class="ao3-generating"><div class="ao3-spinner"></div><b>正文生成中</b><p>${esc(progressText[w.id] || '请稍候…')}</p></div>`
    } else if (st === 'failed') {
      body = `<div class="ao3-generating"><b>生成失败</b><p>${esc(w.failReason || '请重试')}</p><button type="button" class="ao3-submit" id="ao3-retry" style="max-width:200px;margin-top:12px">重新生成</button></div>`
    } else {
      const nav = chaps.length > 1
        ? `<div class="ao3-chap-nav">${chaps.map((c, i) => `<button type="button" class="${i === readState.ci ? 'on' : ''}" data-ci="${i}">${esc(c.title.replace(/ · .*/, ''))}</button>`).join('')}</div>` : ''
      const banner = w.continuing ? `<div class="ao3-cont-banner"><div class="ao3-spinner small"></div><span>${esc(progressText[w.id] || '续写中…')}</span></div>` : ''
      const dirs = (!w.continuing && readState.ci === chaps.length - 1 && (w.nextDirections || []).length)
        ? `<div class="ao3-dir-hint"><b>后续可走的方向</b>${w.nextDirections.map((d, i) => `<span>方向${i + 1}：${esc(d)}</span>`).join('')}<em>点底栏「继续」选择方向并追加章节</em></div>` : ''
      body = nav + banner + ttsBarHTML() + `<div class="ao3-chapter"><h3>${esc(cur ? cur.title : '')}</h3><div class="ao3-chapter-body">${cur ? segHTML(segmentChapter(cur.body).segs) : ''}</div>${dirs}</div>`
    }
    page.querySelector('#ao3-read-main').innerHTML =
      `<div class="ao3-preface"><h2 class="title">${esc(w.title)}</h2><div class="byline">by ${esc(w.author)}</div>${symHTML(w)}<dl class="ao3-meta-dl">${metaRows}</dl>${w.summary ? `<blockquote class="ao3-summary"><b>Summary:</b> ${esc(w.summary)}</blockquote>` : ''}</div>` + body
    const canAct = st === 'ready' && !w.continuing
    const hasNext = st === 'ready' && readState.ci < (w.chapters || []).length - 1
    const liked = store.kudos.includes(w.id)
    const marked = store.bookmarks.includes(w.id)
    page.querySelector('#ao3-read-actions').innerHTML =
      `<button type="button" data-act="kudos" class="${liked ? 'on' : ''}"${canAct ? '' : ' disabled'}>${liked ? '已点赞' : '点赞'}</button>` +
      `<button type="button" data-act="bm" class="${marked ? 'on' : ''}"${canAct ? '' : ' disabled'}>${marked ? '已加书签' : '加书签'}</button>` +
      `<button type="button" data-act="cont"${canAct ? '' : ' disabled'}>${w.continuing ? '续写中…' : '继续'}</button>` +
      `<button type="button" data-act="chap"${canAct ? '' : ' disabled'}>本章管理</button>` +
      `<button type="button" data-act="next"${hasNext ? '' : ' disabled'}>${hasNext ? '下一章' : '已是末章'}</button>`
    const main = page.querySelector('#ao3-read-main')
    main.querySelector('.ao3-chap-nav')?.addEventListener('click', e => {
      const b = e.target.closest('[data-ci]')
      if (!b) return
      ttsStop(false)
      readState.ci = Number(b.dataset.ci) || 0
      renderReader()
      main.scrollTop = 0
    })
    main.querySelector('#ao3-retry')?.addEventListener('click', () => generate(w.id, 'new'))
    bindTtsUI(main)
    bindSelectionBar()
    page.querySelector('#ao3-read-actions').onclick = async e => {
      const b = e.target.closest('[data-act]')
      if (!b || b.disabled) return
      const act = b.dataset.act
      if (act === 'kudos') {
        const i = store.kudos.indexOf(w.id)
        if (i > -1) { store.kudos.splice(i, 1); w.kudos = Math.max(0, (w.kudos || 0) - 1) } else { store.kudos.push(w.id); w.kudos = (w.kudos || 0) + 1 }
        await persist(); renderReader()
      } else if (act === 'bm') {
        const i = store.bookmarks.indexOf(w.id)
        if (i > -1) store.bookmarks.splice(i, 1); else store.bookmarks.push(w.id)
        await persist(); renderReader()
      } else if (act === 'cont') {
        openContinuePad(w)
      } else if (act === 'chap') {
        openChapterPad(w)
      } else if (act === 'next') {
        if (readState.ci >= (w.chapters || []).length - 1) return
        ttsStop(false)
        readState.ci++
        renderReader()
        const m = document.getElementById('ao3-read-main')
        if (m) m.scrollTop = 0
        refreshList()
      }
    }
  }

  // ===== 朗读：旁白 + 每个角色各用一个音色，整章按顺序读，读到哪句高亮哪句 =====
  // 声音来源：旁白/你 在「朗读设置」里填音色 ID；角色默认用微信聊天设置里的音色。
  // 复用 wechat.js 通过 window._wechatCallHelpers 暴露的 callTTS / getChatVoiceId。
  const TTS_RATES = [1, 1.25, 1.5]
  // iPhone 只认「被点击解锁过」的 Audio 元素：点朗读时解锁一次，之后整章都复用它，只换 src
  const TTS_SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
  const tts = { playing: false, blocked: false, token: 0, plan: null, idx: 0, audio: null, rate: 1, wake: null, touchAt: 0 }

  function ttsSleep(ms) { return new Promise(r => setTimeout(r, ms)) }
  function ttsUniq(arr) { return Array.from(new Set(arr.map(x => String(x == null ? '' : x).trim()).filter(Boolean))) }

  // 单个片段的排版（和 bodyHTML 同样的标记规则）
  function inlineHTML(slice) {
    let h = esc(slice)
    h = h.replace(/“([^”\n]*)”/g, '<span class="ao3-say">“$1”</span>')
    h = h.replace(/（([^）\n]*)）/g, '<span class="ao3-think">（$1）</span>')
    h = h.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    h = h.replace(/〔([^〕\n]*)〕/g, '<span class="ao3-env">〔$1〕</span>')
    return h
  }

  // 把一段旁白切成句子级的小块（括号里不切），小块拼起来恰好等于原文
  function splitNarration(str) {
    const out = []
    let cur = '', depth = 0, n = 0
    for (let i = 0; i < str.length; i++) {
      const ch = str[i]
      cur += ch
      if (ch === '（' || ch === '〔' || ch === '(') depth++
      else if ((ch === '）' || ch === '〕' || ch === ')') && depth > 0) depth--
      if (/\S/.test(ch)) n++
      if (depth > 0) continue
      const end = /[。！？!?…]/.test(ch) || ch === '\n'
      if (end && !/[。！？!?…”）」』]/.test(str[i + 1] || '')) {
        if (ch === '\n' || n >= 45) { out.push(cur); cur = ''; n = 0 }
      } else if (n >= 110 && /[，、；,;]/.test(ch)) {
        out.push(cur); cur = ''; n = 0
      }
    }
    if (cur) out.push(cur)
    return out
  }

  function ttsCleanText(t) {
    const r = String(t || '').replace(/[“”「」『』（）〔〕()*]/g, '').replace(/\s+/g, ' ').trim()
    return /[\u4e00-\u9fa5A-Za-z0-9]/.test(r) ? r : ''
  }

  // 切分一章：对白（“…”）和旁白交替，片段首尾相接、拼起来等于整章正文
  function segmentChapter(body) {
    const s = normalizeBody(body)
    const segs = []
    const re = /“[^”\n]*”/g
    const pushNarr = str => { if (str) splitNarration(str).forEach(t => segs.push({ text: t, kind: 'narr' })) }
    let last = 0, m
    while ((m = re.exec(s))) {
      pushNarr(s.slice(last, m.index))
      segs.push({ text: m[0], kind: 'say' })
      last = re.lastIndex
    }
    pushNarr(s.slice(last))
    let pos = 0
    segs.forEach(sg => { sg.start = pos; pos += sg.text.length; sg.end = pos; sg.speak = ttsCleanText(sg.text) })
    return { s, segs }
  }

  function segHTML(segs) {
    return segs.map((sg, i) => sg.speak
      ? `<span class="ao3-seg" data-si="${i}">${inlineHTML(sg.text)}</span>`
      : inlineHTML(sg.text)).join('')
  }

  // 在一小段文字里找角色名；「对/向/给…某某」里的名字是听话的人，不算说话人
  function ttsFindRole(str, roles, fromEnd) {
    let best = null
    roles.forEach(r => r.names.forEach(n => {
      let idx = fromEnd ? str.lastIndexOf(n) : str.indexOf(n)
      while (idx >= 0) {
        if (!/[对向朝给跟和同与]/.test(str[idx - 1] || '')) {
          const dist = fromEnd ? str.length - (idx + n.length) : idx
          if (!best || dist < best.dist || (dist === best.dist && n.length > best.len)) best = { key: r.key, dist, len: n.length }
          break
        }
        idx = fromEnd ? (idx > 0 ? str.lastIndexOf(n, idx - 1) : -1) : str.indexOf(n, idx + 1)
      }
    }))
    return best
  }

  // 判断每句对白是谁说的：看引号前后的旁白里离得最近的角色名；没有名字就沿用上一个 / 两人轮流
  function assignSpeakers(s, segs, roles) {
    const hist = []
    let prev = null, prevEnd = -1
    const second = roles[1] ? roles[1].key : 'user'
    segs.forEach(sg => {
      if (sg.kind !== 'say') { sg.role = 'narrator'; return }
      const lineStart = s.lastIndexOf('\n', sg.start - 1) + 1
      let bs = Math.max(lineStart, sg.start - 40)
      if (prevEnd > bs) bs = prevEnd
      const before = s.slice(bs, sg.start)
      let le = s.indexOf('\n', sg.end)
      if (le < 0) le = s.length
      const nq = s.indexOf('“', sg.end)
      const after = s.slice(sg.end, Math.min(le, nq >= 0 ? nq : le, sg.end + 24))
      const a = ttsFindRole(after, roles, false)
      const b = ttsFindRole(before, roles, true)
      let key = null
      if (a && b) key = b.dist <= a.dist ? b.key : a.key
      else if (a || b) key = (a || b).key
      if (!key) {
        const sameLine = prev && prevEnd >= 0 && s.slice(prevEnd, sg.start).indexOf('\n') < 0
        if (sameLine) key = prev
        else if (!prev) key = second
        else {
          const other = hist.slice().reverse().find(k => k !== prev)
          key = other || (prev === 'user' ? second : 'user')
        }
      }
      if (hist[hist.length - 1] !== key) hist.push(key)
      prev = key
      prevEnd = sg.end
      sg.role = key
    })
  }

  async function ttsRoles(w) {
    const roles = []
    let user = null
    try { user = await db.characters.get(w.ownerUid) } catch (_) {}
    roles.push({
      key: 'user',
      label: (user && (user.nick || user.name)) || (w.characters && w.characters[0]) || '我',
      names: ttsUniq([user && user.nick, user && user.name, w.characters && w.characters[0]])
    })
    for (const id of (w.charIds || [])) {
      let c = null
      try { c = await db.characters.get(id) } catch (_) {}
      if (c) roles.push({ key: String(id), id, label: charName(c), names: ttsUniq([c.nick, c.name]) })
    }
    return roles
  }

  async function ttsResolveVoices(w, roles) {
    const H = window._wechatCallHelpers
    const saved = store.voices || {}
    const out = { narrator: String(saved.narrator || '').trim() }
    for (const r of roles) {
      let v = String(saved[r.key] || '').trim()
      if (!v && r.id) {
        try {
          const chat = await db.chats.where('[ownerUid+charId]').equals([w.ownerUid, r.id]).first()
          if (chat) v = String((await H.getChatVoiceId(chat.id)) || '').trim()
        } catch (_) {}
      }
      out[r.key] = v
    }
    out.any = out.narrator || roles.map(r => out[r.key]).find(Boolean) || ''
    return out
  }

  function ttsSegAudio(plan, i) {
    if (plan.cache.has(i)) return plan.cache.get(i)
    const sg = plan.segs[i]
    const voice = plan.voices[sg.role] || plan.voices.narrator || plan.voices.any
    const p = (async () => {
      const H = window._wechatCallHelpers
      for (let k = 0; k < 2; k++) {
        try { return await H.callTTS(sg.speak, voice) } catch (e) {
          if (k === 1) { console.warn('[ao3] 朗读合成失败', e); return null }
          await ttsSleep(700)
        }
      }
      return null
    })()
    plan.cache.set(i, p)
    p.then(u => { if (!u) plan.cache.delete(i) })
    return p
  }

  function ttsNextSpeakable(plan, i) {
    for (let k = i + 1; k < plan.segs.length; k++) if (plan.segs[k].speak) return k
    return -1
  }

  function ttsUnlock() {
    const ka = document.getElementById('keepalive-audio')
    if (ka) { try { ka.volume = 0; ka.play().catch(() => {}) } catch (_) {} }
    if (!tts.audio) { tts.audio = new Audio(); tts.audio.preload = 'auto' }
    const a = tts.audio
    if (a._unlocked) return
    try {
      a.src = TTS_SILENT_WAV
      const p = a.play()
      if (p && p.then) p.then(() => { a._unlocked = true; if (String(a.src).startsWith('data:audio/wav')) a.pause() }).catch(() => {})
    } catch (_) {}
  }

  function ttsPlayUrl(url, token) {
    return new Promise(resolve => {
      const a = tts.audio
      let done = false
      const fin = ok => {
        if (done) return
        done = true
        a.onended = null; a.onerror = null
        if (tts.wake === wake) tts.wake = null
        resolve(ok)
      }
      const wake = () => fin(false)
      tts.wake = wake
      a.onended = () => fin(true)
      a.onerror = () => fin(false)
      a.src = url
      a.defaultPlaybackRate = tts.rate
      a.playbackRate = tts.rate
      const p = a.play()
      if (p && p.catch) p.catch(() => { if (token === tts.token) tts.blocked = true; fin(false) })
    })
  }

  function ttsClearPlan() {
    const p = tts.plan
    tts.plan = null
    tts.idx = 0
    if (p) p.cache.forEach(pr => pr.then(u => { if (u) { try { URL.revokeObjectURL(u) } catch (_) {} } }).catch(() => {}))
  }

  function ttsMark(idx) {
    const main = document.getElementById('ao3-read-main')
    if (!main) return
    main.querySelectorAll('.ao3-seg.playing').forEach(x => x.classList.remove('playing'))
    if (idx < 0 || !tts.plan || tts.plan.ci !== readState.ci || tts.plan.wid !== readState.id) return
    const el = main.querySelector(`.ao3-seg[data-si="${idx}"]`)
    if (!el) return
    el.classList.add('playing')
    if (Date.now() - tts.touchAt < 4000) return // 你正在自己滑动时不抢滚动
    const mr = main.getBoundingClientRect(), er = el.getBoundingClientRect()
    if (er.top < mr.top + 70 || er.bottom > mr.bottom - 110) {
      main.scrollTo({ top: main.scrollTop + (er.top - mr.top) - mr.height * 0.35, behavior: 'smooth' })
    }
  }

  function ttsUpdateBar() {
    const bar = document.getElementById('ao3-tts-bar')
    if (!bar) return
    const btn = bar.querySelector('[data-tts="toggle"]')
    btn.classList.toggle('on', tts.playing)
    btn.innerHTML = tts.playing
      ? '<i class="fa-solid fa-pause"></i><span>暂停</span>'
      : '<i class="fa-solid fa-play"></i><span>朗读</span>'
    bar.querySelector('[data-tts="rate"]').textContent = tts.rate + 'x'
    const prog = bar.querySelector('.ao3-tts-prog')
    const p = tts.plan
    if (prog) {
      if (p && p.ci === readState.ci && p.wid === readState.id) {
        const total = p.segs.filter(s => s.speak).length
        const done = p.segs.slice(0, tts.idx).filter(s => s.speak).length
        prog.textContent = (tts.playing || done) ? `${Math.min(done + (tts.playing ? 1 : 0), total)}/${total}` : ''
      } else prog.textContent = ''
    }
  }

  function ttsStop(clear) {
    tts.token++
    tts.playing = false
    if (tts.wake) { try { tts.wake() } catch (_) {} }
    if (tts.audio) { try { tts.audio.pause() } catch (_) {} }
    if (clear) ttsClearPlan()
    ttsMark(-1)
    ttsUpdateBar()
  }

  // 准备当前章节的朗读计划（切句、判断说话人、取音色）；同一章同一正文会复用，暂停后可接着读
  async function ttsPrepare(w, fromIdx, token) {
    const cur = (w.chapters || [])[readState.ci]
    if (!cur) return false
    const reuse = !!(tts.plan && tts.plan.wid === w.id && tts.plan.ci === readState.ci && tts.plan.body === cur.body)
    if (!reuse) {
      ttsClearPlan()
      const { s, segs } = segmentChapter(cur.body)
      const roles = await ttsRoles(w)
      if (token !== tts.token) return false
      assignSpeakers(s, segs, roles)
      const voices = await ttsResolveVoices(w, roles)
      if (token !== tts.token) return false
      tts.plan = { wid: w.id, ci: readState.ci, body: cur.body, segs, roles, voices, cache: new Map() }
    }
    let idx = typeof fromIdx === 'number' ? fromIdx : (reuse ? tts.idx : 0)
    if (idx >= tts.plan.segs.length) idx = 0
    tts.idx = idx
    return true
  }

  async function ttsRun(token) {
    let finished = false
    try {
      while (token === tts.token) {
        if (!document.getElementById('ao3-read-page')) break
        const plan = tts.plan
        if (!plan) break
        if (tts.idx >= plan.segs.length) {
          const cw = getWork(plan.wid)
          if (store.voices.autoNext !== false && cw && readState.ci < (cw.chapters || []).length - 1) {
            readState.ci++
            renderReader()
            const m = document.getElementById('ao3-read-main')
            if (m) m.scrollTop = 0
            if (!(await ttsPrepare(cw, 0, token))) break
            continue
          }
          tts.idx = 0
          finished = true
          break
        }
        const sg = plan.segs[tts.idx]
        if (!sg.speak) { tts.idx++; continue }
        const cur = tts.idx
        ttsMark(cur)
        ttsUpdateBar()
        const url = await ttsSegAudio(plan, cur)
        if (token !== tts.token) return
        const next = ttsNextSpeakable(plan, cur)
        if (next >= 0) ttsSegAudio(plan, next) // 这句拿到了，再提前合成下一句
        if (!url) {
          if (!tts.warned) { tts.warned = true; window.toast?.('有的句子朗读失败，已跳过') }
          tts.idx++
          continue
        }
        await ttsPlayUrl(url, token)
        if (token !== tts.token) return
        if (tts.blocked) { window.toast?.('手机拦截了自动播放，请再点一次「朗读」'); break }
        tts.idx++
        await ttsSleep(/\n\s*$/.test(sg.text) ? 260 : 90)
      }
    } catch (e) {
      console.warn('[ao3] 朗读出错', e)
      window.toast?.('朗读出错：' + (e && e.message || e))
    } finally {
      if (token === tts.token) {
        ttsStop(false)
        if (finished) window.toast?.('朗读完毕')
      }
    }
  }

  async function ttsStart(w, fromIdx) {
    const H = window._wechatCallHelpers
    if (!H || typeof H.callTTS !== 'function' || typeof H.getChatVoiceId !== 'function') {
      window.toast?.('朗读功能还没就绪，请先打开一次微信再试')
      return
    }
    ttsUnlock() // 必须在点击手势里、其他 await 之前同步执行
    if (!w) return
    tts.token++
    const token = tts.token
    tts.playing = true
    tts.blocked = false
    tts.warned = false
    ttsUpdateBar()
    let ok = false
    try { ok = await ttsPrepare(w, fromIdx, token) } catch (e) { console.warn('[ao3] 朗读准备失败', e) }
    if (token !== tts.token) return
    if (!ok) { ttsStop(false); window.toast?.('这一章还没有内容可读'); return }
    if (!tts.plan.voices.any) {
      ttsStop(false)
      window.toast?.('还没有设置任何音色，请先在「朗读设置」里填')
      openTtsPad(w)
      return
    }
    ttsRun(token)
  }

  function ttsInit() {
    const r = store.voices && store.voices.rate
    tts.rate = TTS_RATES.includes(r) ? r : 1
  }

  function ttsBarHTML() {
    return `<div class="ao3-tts-bar" id="ao3-tts-bar">
      <button type="button" class="ao3-tts-main" data-tts="toggle"><i class="fa-solid fa-play"></i><span>朗读</span></button>
      <span class="ao3-tts-prog"></span>
      <button type="button" class="ao3-tts-mini" data-tts="rate">${tts.rate}x</button>
      <button type="button" class="ao3-tts-mini" data-tts="set" aria-label="朗读设置"><i class="fa-solid fa-sliders"></i></button>
    </div>`
  }

  function bindTtsUI(main) {
    main.querySelector('#ao3-tts-bar')?.addEventListener('click', e => {
      const b = e.target.closest('[data-tts]')
      if (!b) return
      const act = b.dataset.tts
      if (act === 'toggle') {
        if (tts.playing) ttsStop(false)
        else ttsStart(getWork(readState.id))
      } else if (act === 'rate') {
        tts.rate = TTS_RATES[(TTS_RATES.indexOf(tts.rate) + 1) % TTS_RATES.length]
        if (tts.audio) { tts.audio.defaultPlaybackRate = tts.rate; tts.audio.playbackRate = tts.rate }
        store.voices.rate = tts.rate
        persist()
        ttsUpdateBar()
      } else if (act === 'set') {
        openTtsPad(getWork(readState.id))
      }
    })
    // 朗读时点一句话，从这句开始读
    main.querySelector('.ao3-chapter-body')?.addEventListener('click', e => {
      if (!tts.playing) return
      const el = e.target.closest('.ao3-seg')
      if (!el) return
      const si = Number(el.dataset.si)
      if (!tts.plan || !tts.plan.segs[si] || !tts.plan.segs[si].speak) return
      ttsStop(false)
      ttsStart(getWork(readState.id), si)
    })
    ttsUpdateBar()
    if (tts.playing) ttsMark(tts.idx)
  }

  async function openTtsPad(w) {
    const page = document.getElementById('ao3-read-page')
    if (!page || !w || page.querySelector('.ao3-tts-pad')) return
    const roles = await ttsRoles(w)
    if (!document.getElementById('ao3-read-page') || page.querySelector('.ao3-tts-pad')) return
    const v = store.voices || {}
    const rows = [{ key: 'narrator', label: '旁白', ph: '填音色 ID' }].concat(roles.map(r => ({
      key: r.key,
      label: r.key === 'user' ? r.label + '（你）' : r.label,
      ph: r.key === 'user' ? '填音色 ID（留空用旁白的声音）' : '留空 = 用微信聊天设置里的音色'
    })))
    const bd = document.createElement('div')
    bd.className = 'ao3-continue-backdrop ao3-tts-pad show'
    bd.innerHTML = `
      <div class="ao3-continue-card">
        <h2>朗读设置</h2>
        <p class="ao3-continue-tip">给旁白和每个角色各指定一个音色 ID（和微信聊天设置里填的是同一种）。没有音色的角色会用旁白的声音；旁白也没填，就用任意一个已设置的音色。</p>
        ${rows.map(r => `<label class="ao3-continue-label">${esc(r.label)}</label><input class="ao3-input" data-vk="${esc(r.key)}" value="${esc(v[r.key] || '')}" placeholder="${esc(r.ph)}" autocomplete="off" autocapitalize="off" spellcheck="false">`).join('')}
        <label class="ao3-tts-check"><input type="checkbox" id="ao3-tts-next"${v.autoNext === false ? '' : ' checked'}><span>读完一章自动接着读下一章</span></label>
        <div class="ao3-continue-btns"><button type="button" class="ao3-btn-ghost" id="ao3-tts-cancel">取消</button><button type="button" class="ao3-submit ao3-continue-go" id="ao3-tts-save">保存</button></div>
      </div>`
    page.appendChild(bd)
    bd.addEventListener('click', e => { if (e.target === bd) bd.remove() })
    bd.querySelector('#ao3-tts-cancel').addEventListener('click', () => bd.remove())
    bd.querySelector('#ao3-tts-save').addEventListener('click', async () => {
      const nv = { rate: store.voices.rate }
      bd.querySelectorAll('[data-vk]').forEach(inp => {
        const val = inp.value.trim()
        if (val) nv[inp.dataset.vk] = val
      })
      nv.autoNext = bd.querySelector('#ao3-tts-next').checked
      store.voices = nv
      await persist()
      bd.remove()
      ttsStop(true) // 音色变了，下次点朗读按新设置重新来
      window.toast?.('已保存')
    })
  }

  // ===== 本章管理：重写这一章 / 删除这一章及之后的章节 =====
  // 章节之间剧情是接着写的，所以不能只抽掉中间的一章：重写和删除都会连带删掉它后面的章节。
  async function rollbackChapters(w, keep) {
    const removed = (w.chapters || []).length - keep
    if (keep < 1 || removed < 1) return
    ttsStop(true)
    w.chapters = w.chapters.slice(0, keep)
    const last = w.chapters[keep - 1]
    w.nextDirections = (last && last.nextDirs) || []
    w.words = workWords(w)
    await persist()
    readState.ci = keep - 1
    renderReader()
    const m = document.getElementById('ao3-read-main')
    if (m) m.scrollTop = 0
    refreshList()
    window.toast?.(`已删除 ${removed} 章`)
  }

  // ===== 选中文字 → 改写 / 手动修改 =====
  // 阅读页里选中正文，底部浮出工具栏；也可以在「本章管理 → 编辑本章全文」里直接改。
  // 编辑框里的文字选择在 iPhone 上比正文里稳定得多。
  let selBound = false
  let selCache = ''
  let selLock = 0
  let selTimer = null

  function ensureEditStyle() {
    if (document.getElementById('ao3-edit-style')) return
    const st = document.createElement('style')
    st.id = 'ao3-edit-style'
    st.textContent = '#ao3-read-page .ao3-chapter-body,#ao3-read-page .ao3-chapter-body *{-webkit-user-select:text!important;user-select:text!important;-webkit-touch-callout:default!important}' +
      '#ao3-sel-bar{position:absolute;left:10px;right:10px;z-index:60;display:none;align-items:center;gap:10px;padding:8px 10px;background:#fff;color:#2a2a2a;border:1px solid #bbb;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.25);font-size:13px}' +
      '#ao3-sel-bar button{background:#900;color:#fff;border:0;border-radius:6px;padding:7px 12px;font-size:13px}'
    document.head.appendChild(st)
  }

  function updateSelBar() {
    const page = document.getElementById('ao3-read-page')
    const bar = page && page.querySelector('#ao3-sel-bar')
    if (!page || !bar) return
    const hide = () => { if (Date.now() - selLock > 1500) bar.style.display = 'none' }
    const sel = window.getSelection && window.getSelection()
    const body = page.querySelector('.ao3-chapter-body')
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !body) { hide(); return }
    if (!body.contains(sel.getRangeAt(0).commonAncestorContainer)) { hide(); return }
    const t = sel.toString().trim()
    if (t.length < 2) { hide(); return }
    selCache = t
    const actions = page.querySelector('#ao3-read-actions')
    if (actions && actions.parentElement) {
      const par = actions.parentElement
      if (getComputedStyle(par).position === 'static') par.style.position = 'relative'
      bar.style.bottom = (par.clientHeight - actions.offsetTop + 6) + 'px'
    }
    bar.querySelector('.cnt').textContent = `已选 ${t.length} 字`
    bar.style.display = 'flex'
  }

  function bindSelectionBar() {
    ensureEditStyle()
    const page = document.getElementById('ao3-read-page')
    if (!page) return
    if (!page.querySelector('#ao3-sel-bar')) {
      const bar = document.createElement('div')
      bar.id = 'ao3-sel-bar'
      bar.innerHTML = '<span class="cnt" style="flex:1;opacity:.7"></span><button type="button" id="ao3-sel-edit">改写 / 修改选中</button>'
      bar.addEventListener('touchstart', () => { selLock = Date.now() }, { passive: true })
      bar.addEventListener('mousedown', e => e.preventDefault())
      bar.querySelector('#ao3-sel-edit').addEventListener('click', () => {
        const w = getWork(readState.id)
        const t = selCache
        try { window.getSelection().removeAllRanges() } catch (_) {}
        bar.style.display = 'none'
        if (w && t) openChapterEditor(w, readState.ci, t)
      })
      page.appendChild(bar)
    }
    if (!selBound) {
      selBound = true
      document.addEventListener('selectionchange', () => { clearTimeout(selTimer); selTimer = setTimeout(updateSelBar, 120) })
    }
  }

  // 在原文里找到选中的文字（容忍换行、粗体星号的差异）
  function locateRange(raw, sel) {
    const chars = Array.from(String(sel).replace(/\s+/g, ''))
    if (!chars.length) return []
    const re = new RegExp(chars.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s*]*'), 'g')
    const found = []
    let m
    while ((m = re.exec(raw)) && found.length < 3) {
      if (!m[0].length) { re.lastIndex++; continue }
      found.push([m.index, m.index + m[0].length])
    }
    return found
  }

  function openChapterEditor(w, ci, selText) {
    if (busy || w.continuing) { window.toast?.('正在生成，请稍候'); return }
    const page = document.getElementById('ao3-read-page')
    if (!page || page.querySelector('.ao3-ed-pad')) return
    const cur = (w.chapters || [])[ci]
    if (!cur) return
    const raw = normalizeBody(cur.body)
    let ls = { s: 0, e: 0 }
    if (selText) {
      const found = locateRange(raw, String(selText).slice(0, 3000))
      if (found.length === 1) ls = { s: found[0][0], e: found[0][1] }
      else if (found.length > 1) { window.toast?.('选中的这段在本章里出现了多次，请多选几个字再试'); return }
      else window.toast?.('没能在原文里定位到选中的文字，已打开整章编辑，请在框里自己选一下')
    }
    ttsStop(true)
    const titleShort = String(cur.title || '').replace(/ · .*/, '')
    const bd = document.createElement('div')
    bd.className = 'ao3-continue-backdrop ao3-ed-pad show'
    bd.innerHTML = `
      <div class="ao3-continue-card">
        <h2>${esc(titleShort)} · 编辑</h2>
        <p class="ao3-continue-tip">可以直接手动修改；也可以在下面文本框里选中一段文字，再点「AI 改写选中部分」。改完点「保存修改」才会生效。</p>
        <textarea id="ao3-ed-ta" class="ao3-textarea" style="height:240px;font-size:14px;line-height:1.6"></textarea>
        <p class="ao3-continue-tip" id="ao3-ed-st" style="margin:6px 0 0"></p>
        <input id="ao3-ed-ins" type="text" class="ao3-textarea" style="width:100%;box-sizing:border-box;height:auto;min-height:0;padding:8px;margin-top:8px" placeholder="想怎么改？留空 = 去掉套话句式，直接陈述">
        <button type="button" class="ao3-btn-ghost" id="ao3-ed-ai" style="width:100%;margin-top:8px">AI 改写选中部分</button>
        <div id="ao3-ed-prev" style="margin-top:8px;font-size:13px;line-height:1.6"></div>
        <div class="ao3-continue-btns" style="margin-top:10px"><button type="button" class="ao3-btn-ghost" id="ao3-ed-cancel" style="flex:1">取消</button><button type="button" class="ao3-submit" id="ao3-ed-save" style="flex:1">保存修改</button></div>
      </div>`
    page.appendChild(bd)
    const ta = bd.querySelector('#ao3-ed-ta')
    const st = bd.querySelector('#ao3-ed-st')
    const prev = bd.querySelector('#ao3-ed-prev')
    const aiBtn = bd.querySelector('#ao3-ed-ai')
    ta.value = raw
    const showSt = () => {
      const n = ls.e - ls.s
      st.textContent = n > 0 ? `当前选中 ${n} 字：${ta.value.slice(ls.s, ls.e).replace(/\s+/g, ' ').slice(0, 30)}${n > 30 ? '…' : ''}` : '还没有选中文字'
    }
    showSt()
    if (ls.e > ls.s) setTimeout(() => { try { ta.scrollTop = Math.max(0, ls.s / Math.max(1, raw.length) * ta.scrollHeight - 60) } catch (_) {} }, 50)
    const grab = () => { if (ta.selectionEnd > ta.selectionStart) { ls = { s: ta.selectionStart, e: ta.selectionEnd }; showSt() } }
    ;['select', 'keyup', 'touchend', 'mouseup', 'blur'].forEach(ev => ta.addEventListener(ev, grab))
    ta.addEventListener('input', () => { ls = { s: 0, e: 0 }; showSt(); prev.innerHTML = '' })
    bd.querySelector('#ao3-ed-cancel').addEventListener('click', () => {
      if (ta.value !== raw && !window.confirm('有未保存的修改，确定放弃吗？')) return
      bd.remove()
    })
    bd.querySelector('#ao3-ed-save').addEventListener('click', async () => {
      const nb = normalizeBody(ta.value)
      if (!nb.trim()) { window.toast?.('正文不能为空'); return }
      cur.body = nb
      w.words = workWords(w)
      await persist()
      const m = document.getElementById('ao3-read-main')
      const top = m ? m.scrollTop : 0
      bd.remove()
      renderReader()
      if (m) m.scrollTop = top
      refreshList()
      window.toast?.('已保存')
    })

    let working = false
    const run = async () => {
      if (working) return
      const { s, e } = ls
      if (e - s < 1) { window.toast?.('请先在文本框里选中一段文字'); return }
      if (typeof window.callAI !== 'function') { window.toast?.('请先在设置里配置 API'); return }
      working = true
      aiBtn.disabled = true
      aiBtn.textContent = '改写中…'
      prev.innerHTML = ''
      const full = ta.value
      const frag = full.slice(s, e)
      const ins = bd.querySelector('#ao3-ed-ins').value.trim() || '去掉“不是……而是……”“怎么……怎么……”这类套话句式，改成直接陈述，保持原意'
      let out = ''
      try {
        const rawOut = await window.callAI([{ role: 'user', content: `【上文】${full.slice(Math.max(0, s - 400), s)}\n【待改片段】${frag}\n【下文】${full.slice(e, e + 200)}\n【修改要求】${ins}` }], {
          system: '你是小说文字编辑。用户会给出小说的【上文】【待改片段】【下文】和【修改要求】。请只改写【待改片段】：\n①严格按【修改要求】改；没有特别要求的地方保持原意、人称、语气和人名；\n②只输出改写后的片段本身，不要标签、引号包裹、解释或代码块；\n③不要写出【上文】【下文】里的内容；\n④不要使用“不是……而是……”“不是……，是……”这类对比转折句，也不要“怎么……怎么……”排比；\n⑤长度与原片段大致相近，除非修改要求另有说明。',
          temperature: 0.8
        })
        out = String(rawOut || '').replace(/```[a-zA-Z]*\n?/g, '').replace(/^【待改片段】\s*/, '').split(/\n?【(?:下文|修改要求)】/)[0].trim()
      } catch (err) { console.warn('[ao3] 片段改写失败', err) }
      working = false
      aiBtn.disabled = false
      aiBtn.textContent = 'AI 改写选中部分'
      if (!out) { window.toast?.('改写失败，请再试一次'); return }
      prev.innerHTML = `<div style="opacity:.6">原文</div><div>${esc(frag)}</div><div style="opacity:.6;margin-top:6px">改写后</div><div style="color:#900">${esc(out)}</div>` +
        '<div class="ao3-continue-btns" style="margin-top:8px"><button type="button" class="ao3-btn-ghost" id="ao3-ed-no" style="flex:1">放弃</button><button type="button" class="ao3-btn-ghost" id="ao3-ed-again" style="flex:1">再来一次</button><button type="button" class="ao3-submit" id="ao3-ed-yes" style="flex:1">替换</button></div>'
      prev.querySelector('#ao3-ed-no').addEventListener('click', () => { prev.innerHTML = '' })
      prev.querySelector('#ao3-ed-again').addEventListener('click', run)
      prev.querySelector('#ao3-ed-yes').addEventListener('click', () => {
        let at = ta.value.slice(s, e) === frag ? s : ta.value.indexOf(frag)
        if (at < 0) { window.toast?.('原文已被改动，找不到要替换的位置，请重新选一下'); return }
        ta.value = ta.value.slice(0, at) + out + ta.value.slice(at + frag.length)
        ls = { s: at, e: at + out.length }
        showSt()
        prev.innerHTML = ''
        window.toast?.('已替换，记得点「保存修改」')
      })
    }
    aiBtn.addEventListener('click', () => { grab(); run() })
  }

  // ===== 全文自检：把所有章节里的套话句式找出来并润色 =====
  async function polishWholeWork(w, bd) {
    if (busy || w.continuing) { window.toast?.('正在生成，请稍候'); return }
    if (typeof window.callAI !== 'function') { window.toast?.('请先在设置里配置 API'); return }
    const chaps = w.chapters || []
    const plan = chaps.map(c => window.ProseGuard ? window.ProseGuard.count(normalizeBody(c.body), { allow: 1 }) : flagParas(normalizeBody(c.body).split(/\n{2,}/)).length)
    const paraTotal = plan.reduce((a, b) => a + Math.min(b, 12), 0)
    if (!paraTotal) { window.toast?.('检查完毕，没有发现需要修改的套话句式'); return }
    const calls = plan.reduce((a, b) => a + Math.ceil(Math.min(b, 12) / 6), 0)
    if (!window.confirm(`发现 ${plan.filter(n => n > 0).length} 章里共 ${paraTotal} 段含有套话句式，将调用 ${calls} 次 AI 修改（只改这些段落，其余原文不动）。确定吗？`)) return
    if (bd) bd.remove()
    busy = true
    ttsStop(true)
    let fixed = 0
    const failedWhy = []
    try {
      for (let i = 0; i < chaps.length; i++) {
        if (!plan[i]) continue
        window.toast?.(`正在润色第 ${i + 1}/${chaps.length} 章…`)
        try { const r = await polishBody(chaps[i].body); failedWhy.push(...r.failed); if (r.fixed) { chaps[i].body = r.body; fixed += r.fixed; await persist() } } catch (e) { console.warn('[ao3] 全文润色失败', e) }
      }
      w.words = workWords(w)
      await persist()
    } finally {
      busy = false
      renderReader()
      refreshList()
    }
    const cnt = {}
    failedWhy.forEach(x => { cnt[x] = (cnt[x] || 0) + 1 })
    const whyTxt = Object.keys(cnt).map(k => `${k}${cnt[k]}`).join('、')
    window.toast?.((fixed ? `已润色 ${fixed} 段` : '没能改成功') + (failedWhy.length ? `，另有 ${failedWhy.length} 段没改成（${whyTxt}），原文已保留，可用「编辑本章全文」手动处理` : '') + (plan.some(n => n > 12) ? '；部分章节还有剩余，可以再点一次' : ''))
  }

  function openChapterPad(w) {
    if (busy || w.continuing) { window.toast?.('正在生成，请稍候'); return }
    const page = document.getElementById('ao3-read-page')
    if (!page || page.querySelector('.ao3-chap-pad')) return
    const chaps = w.chapters || []
    const ci = Math.min(readState.ci, chaps.length - 1)
    const cur = chaps[ci]
    if (!cur) return
    const later = chaps.length - ci - 1
    let dir = ''
    for (let j = ci; j >= 0; j--) { if (chaps[j] && chaps[j].dir) { dir = chaps[j].dir; break } }
    const titleShort = String(cur.title || '').replace(/ · .*/, '')
    const bd = document.createElement('div')
    bd.className = 'ao3-continue-backdrop ao3-chap-pad show'
    bd.innerHTML = `
      <div class="ao3-continue-card">
        <h2>${esc(titleShort)} · 本章管理</h2>
        <p class="ao3-continue-tip">只改这一章，不会动前面的章节。${later ? `后面的 ${later} 章接在这一章后面写的，所以重写或删除这一章时会一起删掉。` : '这是最后一章。'}</p>
        <label class="ao3-continue-label">重写这一章</label>
        <textarea id="ao3-rw-dir" class="ao3-textarea" placeholder="想怎么改？可以留空，会承接上一章重新写一个不同的版本">${esc(dir)}</textarea>
        <button type="button" class="ao3-submit" id="ao3-rw-go" style="margin-top:8px">重写${esc(titleShort)}${later ? `（并删除后面 ${later} 章）` : ''}</button>
        <div class="ao3-pad-sep"></div>
        <label class="ao3-continue-label">手动编辑</label>
        <p class="ao3-continue-tip">整章放进文本框里自己改，也可以选中一段让 AI 只改那一段。</p>
        <button type="button" class="ao3-btn-ghost" id="ao3-edit-go" style="width:100%">编辑本章全文</button>
        <div class="ao3-pad-sep"></div>
        <label class="ao3-continue-label">自检全文套话句式</label>
        <p class="ao3-continue-tip">检查本篇所有章节里“不是…而是…”“怎么…怎么…”这类句式，只改写命中的段落。</p>
        <button type="button" class="ao3-btn-ghost" id="ao3-polish-go" style="width:100%">自检并润色全文</button>
        <div class="ao3-pad-sep"></div>
        <button type="button" class="ao3-pad-danger" id="ao3-chap-del"${ci === 0 ? ' disabled' : ''}>删除${esc(titleShort)}${later ? `及之后共 ${later + 1} 章` : ''}</button>
        <p class="ao3-continue-tip" style="margin-top:6px">${ci === 0 ? '第一章不能单独删除；想删掉整篇，请回到作品列表，点那篇作品右侧的「删除」。' : `删除后回到第 ${ci} 章，可以重新点「继续」往下写。`}</p>
        <div class="ao3-continue-btns"><button type="button" class="ao3-btn-ghost" id="ao3-chap-cancel" style="flex:1">取消</button></div>
      </div>`
    page.appendChild(bd)
    bd.addEventListener('click', e => { if (e.target === bd) bd.remove() })
    bd.querySelector('#ao3-chap-cancel').addEventListener('click', () => bd.remove())
    bd.querySelector('#ao3-rw-go').addEventListener('click', () => {
      if (later && !window.confirm(`重写${titleShort}会同时删除后面的 ${later} 章，确定吗？`)) return
      const direction = bd.querySelector('#ao3-rw-dir').value.trim().slice(0, 120) || '承接上一章，重新写出一个与原来不同的版本'
      bd.remove()
      ttsStop(true)
      generate(w.id, 'rewrite', { rewriteAt: ci, direction })
    })
    bd.querySelector('#ao3-edit-go').addEventListener('click', () => { bd.remove(); openChapterEditor(w, ci, null) })
    bd.querySelector('#ao3-polish-go').addEventListener('click', () => polishWholeWork(w, bd))
    bd.querySelector('#ao3-chap-del').addEventListener('click', () => {
      if (ci === 0) return
      if (!window.confirm(`删除${titleShort}${later ? `及之后共 ${later + 1} 章` : ''}？删除后无法恢复。`)) return
      bd.remove()
      rollbackChapters(w, ci)
    })
  }

  // ===== 续写弹窗 =====
  function openContinuePad(w) {
    if (busy) { window.toast?.('正在生成，请稍候'); return }
    const page = document.getElementById('ao3-read-page')
    if (!page || page.querySelector('.ao3-continue-backdrop')) return
    const dirs = (w.nextDirections || []).filter(Boolean)
    const bd = document.createElement('div')
    bd.className = 'ao3-continue-backdrop show'
    bd.innerHTML = `
      <div class="ao3-continue-card">
        <h2>继续写下去</h2>
        <p class="ao3-continue-tip">选一个方向，或者自己写。会调用一次 AI，在现有章节后面追加。</p>
        <div class="ao3-continue-dirs" id="ao3-dirs">${dirs.length ? dirs.map((d, i) => `<button type="button" class="ao3-dir-tag" data-dir="${esc(d)}"><b>方向 ${i + 1}</b><span>${esc(d)}</span></button>`).join('') : '<p class="ao3-dir-empty">还没有推荐方向，可以在下面自己填写。</p>'}</div>
        <label class="ao3-continue-label">续写主旨</label>
        <textarea id="ao3-dir-input" class="ao3-textarea" placeholder="选择上面的方向，或自己写一句话"></textarea>
        <label class="ao3-continue-label">追加章数</label>
        <select id="ao3-dir-chap" class="ao3-select">${CHAPTER_COUNTS.map(n => `<option value="${n}">${n} 章</option>`).join('')}</select>
        <div class="ao3-continue-btns"><button type="button" class="ao3-btn-ghost" id="ao3-dir-cancel">取消</button><button type="button" class="ao3-submit ao3-continue-go" id="ao3-dir-go">开始续写</button></div>
      </div>`
    page.appendChild(bd)
    const input = bd.querySelector('#ao3-dir-input')
    bd.addEventListener('click', e => { if (e.target === bd) bd.remove() })
    bd.querySelector('#ao3-dir-cancel').addEventListener('click', () => bd.remove())
    bd.querySelector('#ao3-dirs').addEventListener('click', e => {
      const b = e.target.closest('.ao3-dir-tag')
      if (!b) return
      const on = b.classList.contains('on')
      bd.querySelectorAll('.ao3-dir-tag').forEach(x => x.classList.remove('on'))
      if (on) { input.value = ''; return }
      b.classList.add('on')
      input.value = b.dataset.dir || ''
    })
    bd.querySelector('#ao3-dir-go').addEventListener('click', () => {
      const dir = input.value.trim()
      if (!dir) { window.toast?.('请选择或填写一个续写方向'); return }
      const n = Number(bd.querySelector('#ao3-dir-chap').value) || 1
      bd.remove()
      generate(w.id, 'continue', { direction: dir.slice(0, 120), chapN: n })
    })
  }

  window.showAo3Page = showAo3Page
})()
