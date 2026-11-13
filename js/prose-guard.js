/* prose-guard.js —— 文风守卫（共用）
 * 作用：1) styleRule()：生成写进提示词的文风规则；
 *       2) polishText()：检测“不是…而是…”“怎么…怎么…”等套话句式，只把命中的行发给 AI 改写，其余原样不动。
 * 用法：window.ProseGuard.styleRule({ prefix: '- ', unit: '一条回复', max: 1 })
 *       const r = await window.ProseGuard.polishText(text, { allow: 1, maxUnits: 6, protect: [/<status>[\s\S]*?<\/status>/i] })
 *       r = { text, fixed, failed: [原因…], units }
 * 所有调用方都在运行时才读取 window.ProseGuard，所以这个文件放在 index.html 的任何位置都行。
 */
(function () {
  if (window.ProseGuard) return

  const CONTRAST_RES = [
    /(?:并不是|并非|不是|不只是|不仅仅是|不单单是|不光是)[^。！？!?\n]{1,40}?(?:而是|[，,；;：:—…\n]+\s*(?:这?是(?!否)|更是|只是|就是|才是|不过是|只不过是|仅仅是|倒是|反而是))/g,
    /(?:并不是|并非|不是)[^。！？!?\n]{1,30}[。！？!?]+\s*(?:而是|只是|就是|才是|这是|是(?![的否]))/g,
    /与其说[^。！？!?\n]{1,40}?[，,；;]\s*(?:倒)?不如说/g,
    /(?:没有|不再是)[^。！？!?\n，,；;]{1,25}[，,；;]\s*(?:(?:没有|不再是)[^。！？!?\n，,；;]{1,25}[，,；;]\s*)?(?:只有|只剩|有的只是)/g
  ]
  const WHY_RE = /怎么[^。！？!?\n]{1,18}?[，,；;、。]\s*(?:又|也|还|就)?怎么/g

  // ---------- 开关（按场景分开存，默认开） ----------
  function flagKey(scope) { return 'wanwan_prose_guard_off_' + (scope || 'all') }
  function isEnabled(scope) {
    try { return localStorage.getItem(flagKey(scope)) !== '1' } catch (_) { return true }
  }
  function setEnabled(scope, on) {
    try { on ? localStorage.removeItem(flagKey(scope)) : localStorage.setItem(flagKey(scope), '1') } catch (_) {}
  }

  // ---------- 提示词规则 ----------
  function styleRule(o) {
    o = o || {}
    const p = o.prefix === undefined ? '- ' : o.prefix
    if (o.short) {
      return p + '说话直接，不要先否定一个没人提过的说法再纠正（少用“不是……而是……”“不是……，是……”这类对比句），也不要用“怎么……怎么……”排比。'
    }
    const unit = o.unit || '整篇'
    const max = o.max === undefined ? 2 : o.max
    const lines = [
      p + `想说什么就直接说。不要先否定一个没人提过的说法，再补一句纠正。像“不是A，而是B”“不是A，是B”“不是A，就是B”“与其说A，不如说B”“没有A，只有B”这类对比转折句，${unit}最多出现 ${max} 处，且只能出现在真正需要对比的地方。`,
      p + '如果确实需要“否定再转折”，就写得有分量：被否定的必须是读者真会误会的东西，转折之后要展开动作、感官和感受，不要写成短短两截就结束的句子。',
      p + '不要写“怎么……怎么……”排比，也不要连续两句以上用同一种句式开头或收尾；句子长短、句式要有变化，像真人写的。',
      p + '情绪用动作、细节、对白呈现，不替读者总结感悟，不在段末升华。'
    ]
    return lines.join('\n')
  }

  // ---------- 检测 ----------
  function maskQuotes(s) {
    return String(s || '').replace(/“[^”]*”|「[^」]*」|『[^』]*』/g, m => '　'.repeat(m.length))
  }

  // 把台词和 protect 里的区域（如 <status> 状态栏）都遮住，只检查叙述；长度不变，下标和原文一一对应
  function mask(text, protect) {
    let s = maskQuotes(text)
    if (protect && protect.length) {
      const arr = s.split('')
      protect.forEach(re => {
        if (!re) return
        let r
        try { r = new RegExp(re.source, (re.flags || '').replace(/[gy]/g, '') + 'g') } catch (_) { return }
        let m
        while ((m = r.exec(text))) {
          if (!m[0].length) { r.lastIndex++; continue }
          for (let i = m.index; i < m.index + m[0].length && i < arr.length; i++) arr[i] = '　'
        }
      })
      s = arr.join('')
    }
    return s
  }

  // 返回 [{ kind: 'contrast' | 'why', index, end }]，按位置排序、重叠的合并
  function findHits(masked) {
    const raw = []
    CONTRAST_RES.forEach(re => {
      re.lastIndex = 0
      let m
      while ((m = re.exec(masked))) {
        if (!m[0].length) { re.lastIndex++; continue }
        if (masked[m.index - 1] === '是') continue // “是不是”
        raw.push({ kind: 'contrast', index: m.index, end: m.index + m[0].length })
      }
    })
    WHY_RE.lastIndex = 0
    let w
    while ((w = WHY_RE.exec(masked))) raw.push({ kind: 'why', index: w.index, end: w.index + w[0].length })
    raw.sort((a, b) => a.index - b.index)
    const out = []
    raw.forEach(h => {
      const last = out[out.length - 1]
      if (last && h.index < last.end) {
        if (h.kind === 'why') last.kind = 'why'
        last.end = Math.max(last.end, h.end)
      } else out.push({ ...h })
    })
    return out
  }

  function norm(o) {
    o = o || {}
    return {
      allow: o.allow === undefined ? 1 : o.allow,   // 对比转折句保留几处（怎么…怎么… 一律处理）
      maxUnits: o.maxUnits || 12,
      protect: o.protect || [],
      callAI: o.callAI
    }
  }

  // 找出需要改写的“行”（命中句所在的整行；跨段的命中会把相邻两行合成一块）
  function planUnits(text, o) {
    const masked = mask(text, o.protect)
    const hits = findHits(masked)
    let seen = 0
    const bad = []
    hits.forEach(h => {
      if (h.kind === 'why') bad.push(h)
      else { seen++; if (seen > o.allow) bad.push(h) }
    })
    const spans = []
    bad.forEach(h => {
      const s = text.lastIndexOf('\n', h.index - 1) + 1
      let e = text.indexOf('\n', h.end)
      if (e < 0) e = text.length
      const last = spans[spans.length - 1]
      if (last && s <= last.e) last.e = Math.max(last.e, e)
      else spans.push({ s, e })
    })
    return spans
  }

  function count(text, o) { return planUnits(String(text || ''), norm(o)).length }

  // ---------- 改写 ----------
  function quotesOf(t) { return (String(t || '').match(/“[^”]*”/g) || []).join('|') }

  function check(old, neu, o) {
    if (!neu) return '没返回'
    const ratio = neu.length / Math.max(1, old.length)
    if (old.length <= 40 ? (neu.length < 2 || ratio > 3.5) : (ratio < 0.5 || ratio > 1.6)) return '长度不合格'
    if (quotesOf(neu) !== quotesOf(old)) return '改了对白'
    if (/<\/?status>/i.test(neu) && !/<\/?status>/i.test(old)) return '多出了状态栏'
    if (findHits(mask(neu, o.protect)).length >= findHits(mask(old, o.protect)).length) return '句式没减少'
    return ''
  }

  function parseNumbered(raw) {
    const out = {}
    const text = String(raw || '').replace(/```[a-zA-Z]*\n?/g, '')
    const re = /===\s*(\d+)\s*===\s*\n?([\s\S]*?)(?=\n\s*===\s*\d+\s*===|$)/g
    let m
    while ((m = re.exec(text))) {
      const t = m[2].trim().replace(/^【待改】\s*/, '').replace(/^【上文[^】]*】[^\n]*\n?/, '').trim()
      if (t) out[Number(m[1])] = t
    }
    return out
  }

  const SYS = '你是小说文字编辑。下面是若干个小说片段（每个可能有一行或几行），其中含有生硬的“对比转折”句（如“不是……而是……”“不是……，是……”“不是……，就是……”“与其说……不如说……”“没有……只有……”）或“怎么……怎么……”排比句。请改写这些片段：\n①把有问题的句子改成直接陈述——只写真实的那一面，删掉被否定的那一半，必要时用一个具体的动作或细节代替（例：“不是亲，就是贴着”可改成“他的唇贴在她颈窝里，没有动，鼻尖轻轻吸了口气”；很短的“不是疼，是空。”可结合上文改成“胸口空落落的。”）；\n②不要用别的对比句或排比句来顶替；\n③除有问题的句子外，其余文字、人名、事实、对白（引号“ ”里的内容，包括其中的【语气】标签）一字不改，保持原有的换行结构；\n④保持原文的语气和人称。\n每个片段前面可能带有【上文】，只是帮你理解语境，不要输出；只输出【待改】那一块改写后的结果（不要带标签）。\n输出格式严格为：\n===编号===\n改写后的片段\n（每个片段一个编号，不要任何额外说明）'

  async function ask(callAI, batch, text, strict) {
    const body = batch.map((u, k) => {
      const ctx = text.slice(Math.max(0, u.s - 150), u.s).trim()
      return `===${k + 1}===\n` + (ctx ? `【上文（只供参考，不要输出）】${ctx.replace(/\n/g, ' ')}\n` : '') + `【待改】${u.old}`
    }).join('\n\n')
    try {
      const raw = await callAI([{ role: 'user', content: body }], {
        system: SYS + (strict ? '\n⑤这些片段上一次没改成功。这次必须把有问题的句子彻底重写成直接陈述，可以结合上文把意思写具体，不要原样返回。' : ''),
        temperature: strict ? 0.8 : 0.6
      })
      return parseNumbered(raw)
    } catch (e) {
      console.warn('[ProseGuard] 改写调用失败', e)
      return {}
    }
  }

  async function polishText(text, opts) {
    text = String(text || '')
    const o = norm(opts)
    const callAI = o.callAI || window.callAI
    const spans = planUnits(text, o).slice(0, o.maxUnits)
    if (!spans.length || typeof callAI !== 'function') return { text, fixed: 0, failed: [], units: spans.length }
    const units = spans.map(sp => ({ s: sp.s, e: sp.e, old: text.slice(sp.s, sp.e), neu: null, why: '' }))
    let pending = units
    for (let round = 0; round < 2 && pending.length; round++) {
      const size = round === 0 ? 6 : 3
      const next = []
      for (let b = 0; b < pending.length; b += size) {
        const batch = pending.slice(b, b + size)
        const got = await ask(callAI, batch, text, round === 1)
        batch.forEach((u, k) => {
          const why = check(u.old, got[k + 1], o)
          if (!why) { u.neu = got[k + 1]; u.why = '' } else { u.why = why; next.push(u) }
        })
      }
      pending = next
    }
    let out = text
    let fixed = 0
    for (let i = units.length - 1; i >= 0; i--) {
      const u = units[i]
      if (u.neu != null) { out = out.slice(0, u.s) + u.neu + out.slice(u.e); fixed++ }
    }
    return { text: out, fixed, failed: pending.map(u => u.why), units: units.length }
  }

  window.ProseGuard = { styleRule, polishText, count, findHits, maskQuotes, isEnabled, setEnabled }
})()
