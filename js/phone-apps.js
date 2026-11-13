// phone-apps.js — 查手机「浏览器 / 备忘录 / 相册 / Game Center」内容生成与渲染
// 职责：四个 App 的快照持久化、API prompt 构建与调用、数据清洗、页面渲染（含未生成时的初始空状态页）。
// 依赖 phone-wechat.js 的共享函数（同为经典脚本，顶层函数全局可见）：
//   extractPhoneSnapshotJson / parsePhoneRelativeTime / formatPhoneSnapshotCurrentTime
//   loadPhoneSnapshotRelatedNpcs / buildPhoneSnapshotNpcBlock / buildPhoneSnapshotRelationText
//   buildPhoneSnapshotRecentMessagesBlock / getPhoneWechatSnapshot / getPhoneSnapshotTemperature
// 设计文档：prompt-local/查手机-四App-Prompt设计.md

function paEscHtml(str) {
  if (window._wechatCallHelpers?.wcEscHtml) return window._wechatCallHelpers.wcEscHtml(str)
  return String(str ?? '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]))
}

const PHONE_GEN_APP_LABELS = {
  browser: '浏览器',
  notes: '备忘录',
  photos: '相册',
  'game-center': 'Game Center',
  privacy: '隐私空间',
  mail: 'Mail',
  schedule: '日程'
}

window.PHONE_GEN_APP_LABELS = PHONE_GEN_APP_LABELS

// ===== 快照持久化 =====

function getPhoneAppSnapshotKey(appId, ownerUid, charId) {
  return `phoneAppSnapshot_${appId}_${ownerUid}_${charId}`
}

async function getPhoneAppSnapshot(appId, ownerUid, charId) {
  if (!window.db || !appId || !ownerUid || !charId) return null
  const row = await db.config.get(getPhoneAppSnapshotKey(appId, ownerUid, charId))
  const value = row?.value
  if (!value || typeof value !== 'object' || !value.data) return null
  return value
}

async function savePhoneAppSnapshot(appId, ownerUid, charId, snapshot) {
  await db.config.put({
    key: getPhoneAppSnapshotKey(appId, ownerUid, charId),
    value: snapshot
  })
}

async function clearPhoneAppSnapshot(appId, ownerUid, charId) {
  await db.config.delete(getPhoneAppSnapshotKey(appId, ownerUid, charId))
}

window.getPhoneAppSnapshot = getPhoneAppSnapshot
window.clearPhoneAppSnapshot = clearPhoneAppSnapshot

// ===== 共享：占位图（与朋友圈一致，desc 哈希 → img/blank_img1-6.jpg） =====

function phoneAppPlaceholderImg(desc, salt = '') {
  const raw = String(desc || '') + salt
  let seed = 0
  for (let i = 0; i < raw.length; i++) seed = ((seed * 31) + raw.charCodeAt(i)) >>> 0
  return `img/blank_img${(seed % 6) + 1}.jpg`
}

// ===== 共享：System Prompt =====

function buildPhoneBrowserSystemPrompt(char, user) {
  const charName = char?.nick || char?.name || '角色'
  const userName = user?.nick || user?.name || '用户'
  return `你是一个角色扮演世界的「手机内容生成器」。用户正在查看角色【${charName}】的手机浏览器，你需要一次性生成这部手机浏览器里的内容快照：搜索记录（含每次搜索对应的结果页）和书签收藏。

# 核心视角
- 这是【${charName}】的私人手机。浏览器记录是最私密的数字痕迹：人会把不敢问别人的问题、说不出口的心事、深夜的焦虑都交给搜索框。
- 生成的内容是"被偷看"的真实生活切片：必须包含 TA 不会告诉任何人的搜索——心事、秘密、健康焦虑、与【${userName}】有关的搜索（感情困惑、礼物挑选、对方提过的爱好等）、近期烦恼的解决办法。这是本功能最核心的乐趣，必须体现。
- 内容必须与角色人设、世界观、以及提供的「角色与用户的真实聊天记录」在时间线和事实上完全一致，可自然呼应近期剧情。

# 搜索记录规则
1. 生成 6-12 条搜索记录，按时间倒序，时间跨度约最近两周。
2. 搜索词必须像真人打进搜索框的原话：口语化、可以不通顺、可以带错字，多用「怎么办 / 为什么 / 多少钱 / 正常吗」这类真实句式；禁止书面化的完整句子。
3. 内容配比参考（依人设调整）：2-4 条私密心事类（含与【${userName}】相关的）、2-4 条生活琐事（外卖/路线/比价/天气）、1-3 条与职业身份或近期剧情相关、0-2 条娱乐八卦攻略类。
4. 每条搜索必须生成 3-5 条搜索结果：网页标题要像真实网页标题；站点名要有真实感（知乎/豆瓣/贴吧风格的常见或虚构站点）；摘要 2-3 句，像搜索引擎摘要那样可以在句中截断。
5. 结果内容要能"回答"这个搜索，且偶尔夹一条不太相关的结果，更像真实搜索页。
6. 若提供了「已生成的微信好友名单」，搜索内容可与这些人物、事件自然关联。

# 书签收藏规则
1. 生成 4-8 条书签，体现长期兴趣和生活习惯（追的连载/常用工具/攻略合集/收藏很久的文章）。
2. 书签比搜索记录更"体面"，是 TA 愿意留下的内容；但可以有 1 条暴露真实癖好的私藏。

# 输出格式
只输出一个 JSON 对象，不要输出任何其他文字、注释或 markdown 代码块标记。结构如下：

{
  "searches": [
    {
      "query": "搜索词",
      "time": "相对时间,如 昨天 23:41 / 3天前 14:02 / 周二 09:30",
      "results": [
        { "title": "网页标题", "site": "站点名", "snippet": "摘要,2-3句" }
      ]
    }
  ],
  "bookmarks": [
    { "title": "网页标题", "site": "站点名", "desc": "一句话说明这是什么/TA为什么收藏" }
  ]
}`
}

function buildPhoneNotesSystemPrompt(char, user) {
  const charName = char?.nick || char?.name || '角色'
  const userName = user?.nick || user?.name || '用户'
  return `你是一个角色扮演世界的「手机内容生成器」。用户正在查看角色【${charName}】的手机备忘录，你需要一次性生成这部手机的备忘录内容快照。

# 核心视角
- 备忘录是写给自己看的地方：没有人设包袱、没有社交表演，只有最真实的琐碎和心事。
- 生成的内容是"被偷看"的真实生活切片：必须包含只有自己看的真心话（可涉及对【${userName}】的心事、不会当面说的话）和暴露生活状态的清单待办。这是本功能最核心的乐趣，必须体现。
- 内容必须与角色人设、世界观、以及提供的「角色与用户的真实聊天记录」在时间线和事实上完全一致，可自然呼应近期剧情。

# 备忘录规则
1. 生成 5-10 条，类型混搭，至少覆盖以下 3 种：
   - 清单类：购物清单、待办事项（可含已完成项，行首用「✓ 」标记）
   - 工作/学习备忘：会议要点、灵感碎片、笔记片段
   - 日记式碎碎念：某天深夜的情绪、想不通的事
   - 心事类：关于【${userName}】或秘密的、绝不会给别人看的内容（0-2 条，克制而真实）
   - 信息类：账号备注、密码提示（用只有本人懂的暗语，不写明文）、地址、尺码、纪念日
2. 文字必须像真人随手记：可以不通顺、有缩写、有省略、偶尔有错字；短的可以只有几个字，长的像小作文。禁止工整书面语，禁止小说体。
3. title 可为空字符串（渲染时自动取正文首行）；content 里用 \\n 表示换行。
4. pinned 置顶 0-2 条（真人只置顶最常用的那条）。
5. 时间跨度可达数月，输出按时间倒序（置顶项也按真实时间写 time）。
6. 若提供了「已生成的微信好友名单」，备忘录里提到的人名应优先使用名单中的人物。

# 输出格式
只输出一个 JSON 对象，不要输出任何其他文字、注释或 markdown 代码块标记。结构如下：

{
  "notes": [
    {
      "title": "标题,可为空字符串",
      "time": "相对时间,如 昨天 22:14 / 3天前 / 2个月前 / 6月28日",
      "content": "正文,用 \\n 换行",
      "pinned": false
    }
  ]
}`
}

function buildPhonePhotosSystemPrompt(char, user) {
  const charName = char?.nick || char?.name || '角色'
  const userName = user?.nick || user?.name || '用户'
  return `你是一个角色扮演世界的「手机内容生成器」。用户正在查看角色【${charName}】的手机相册，你需要一次性生成这部手机的相册内容快照：3-5 个相册，每个相册若干张照片（照片以一句话文字描述呈现画面）。

# 核心视角
- 相册是生活的证据：拍什么、存什么截图，直接暴露一个人的生活轨迹和在意的东西。
- 生成的内容是"被偷看"的真实生活切片：必须包含截图类内容（聊天记录截图/订单/课表/转账页面等信息型画面）；可以出现与【${userName}】相关的照片（合照、随手拍、舍不得删的聊天截图），数量克制（全部相册加起来 0-3 张）反而更真实。这是本功能最核心的乐趣，必须体现。
- 内容必须与角色人设、世界观、以及提供的「角色与用户的真实聊天记录」在时间线和事实上完全一致：聊天里提过的旅行、美食、事件，相册里应有对应照片。

# 相册规则
1. 生成 3-5 个相册，命名贴人设与生活方式（如 自拍 / 美食日记 / 出去玩 / 截图 / 毛孩子 / 工作资料，依人设自拟）。必须包含一个截图类相册。
2. 每个相册 3-8 张照片。
3. desc 是一句话具体画面描述：谁在哪、在干什么、画面里有什么、光线构图氛围如何。像给看不见的人描述照片，禁止空泛（禁止「一张风景照」这种）。截图类照片则描述屏幕上的具体内容。
4. time 用相对时间，整体跨度可达数月；同一相册内时间要合理（旅行相册集中在几天内，日常相册分散）。
5. 若提供了「已生成的微信好友名单」，合照和截图里出现的人应优先使用名单中的人物。

# 输出格式
只输出一个 JSON 对象，不要输出任何其他文字、注释或 markdown 代码块标记。结构如下：

{
  "albums": [
    {
      "name": "相册名",
      "photos": [
        { "desc": "一句话具体画面描述", "time": "相对时间,如 3天前 / 上周六 / 2个月前 / 6月28日" }
      ]
    }
  ]
}`
}

function buildPhoneGameCenterSystemPrompt(char, user) {
  const charName = char?.nick || char?.name || '角色'
  return `你是一个角色扮演世界的「手机内容生成器」。用户正在查看角色【${charName}】的手机 Game Center，你需要一次性生成游戏中心内容快照：最近游玩的游戏、时长、成就与战绩。

# 核心视角
- 一个人的游戏库和游玩时长，是 TA 生活状态的心电图：玩什么暴露性格，什么时候玩暴露作息，时长变化暴露近期心境。
- 内容必须与角色人设、世界观、以及提供的「角色与用户的真实聊天记录」在时间线和事实上完全一致，可自然呼应近期剧情。

# 游戏画像推断（最重要的一步）
先依据人设判断角色属于哪类玩家，再决定生成什么：
1. 重度玩家（人设明确爱游戏/电竞/宅）：生成 2-5 款主流游戏（MOBA/FPS/开放世界/主机大作/独立游戏等），时长高，段位、胜率、成就细节丰富。
2. 休闲玩家（普通人，偶尔消遣）：生成 1-3 款轻度游戏（消除/种田经营/音游/挂机卡牌），时长零碎，成就解锁不多。
3. 几乎不玩（工作狂/长辈型/人设与游戏绝缘）：【绝对禁止硬塞主流游戏】。生成 1-2 款贴合其职业与身份的工具型/模拟型"游戏"，让游戏列表本身讲述这个人是谁：
   - 金融从业者/工作狂 → 股票基金模拟盘类（「模拟炒股大赛」「Invest Master」风格）
   - 医生 → 医院经营模拟；律师 → 推理文字游戏；教师 → 词汇解谜；厨师 → 料理模拟……以此类推
   - 也可以是象棋/围棋/数独/解谜这类"不像游戏的游戏"。
4. 游戏名可以用真实存在的常见游戏名，也可以用有真实感的虚构名；genre 用简短中文类型词（如 MOBA / 模拟经营 / 消除 / 音游 / 股票模拟）。

# 时长与数据规则（时长必须讲故事）
1. weeklyHours（本周时长）与 totalHours（累计时长）的对比要有叙事，并与近期剧情呼应：
   - 本周暴增 → 最近在逃避什么 / 放假了 / 心情低落爆肝
   - 累计很高但本周接近 0 → 最近太忙 / 在戒 / 生活被别的事占满
   - 常年稳定低时长 → 只在通勤或睡前玩一会儿
2. lastPlayed 要呼应角色作息（深夜党 / 通勤时段 / 午休）。
3. 每款游戏生成 2-5 条成就：已解锁的 unlocked 为 true 且带 time，未解锁的 unlocked 为 false 且 time 为 null；成就名要像真实游戏成就（有梗、有等级感）。
4. stats 为 2-4 行键值：段位/胜率/关卡进度/连胜/资产收益率等，按游戏类型自由发挥，数值必须与投入时长匹配。
5. 若提供了「已生成的微信好友名单」，成就或数据里可自然埋好友互动的彩蛋（如「与××组队达成」）。

# 输出格式
只输出一个 JSON 对象，不要输出任何其他文字、注释或 markdown 代码块标记。结构如下：

{
  "games": [
    {
      "name": "游戏名",
      "genre": "类型,如 MOBA / 模拟经营 / 消除 / 股票模拟",
      "weeklyHours": 数字(本周小时数,可带一位小数),
      "totalHours": 数字(累计小时数),
      "lastPlayed": "相对时间,如 昨天 23:50 / 3天前 12:30",
      "achievements": [
        { "title": "成就名", "desc": "达成条件一句话", "unlocked": true, "time": "相对时间或null" }
      ],
      "stats": [
        { "label": "段位", "value": "钻石II" }
      ]
    }
  ]
}`
}

function buildPhonePrivacySystemPrompt(char, user) {
  const charName = char?.nick || char?.name || '角色'
  const userName = user?.nick || user?.name || '用户'
  return `你是一个角色扮演世界的「手机内容生成器」。用户正在查看角色【${charName}】手机里的「隐私空间」——一个类似成人视频网站的私密应用，你需要一次性生成内容快照：观看记录和站内搜索记录。

# 核心视角
- 这是【${charName}】手机里最深处的隐私。没有人设包袱、没有道德表演，观看记录是一个人最诚实的欲望档案。
- 生成的内容是"被偷看"的真实生活切片：口味必须从人设推断（性格、压抑程度、感情状态、职业压力都会反映在看什么上）；必须包含 1-3 条与【${userName}】有关的痕迹（搜索与对方特征相关的关键词、看标题里出现对方发色/职业/声线/身材特征的视频），克制但一眼能认出来。这是本功能最核心的乐趣，必须体现。
- 内容必须与角色人设、作息、以及「角色与用户的真实聊天记录」在时间线上一致：观看时间暴露作息与心境（失眠的凌晨、对方没回消息的那晚、吵架后的深夜）。

# 观看记录规则
1. 生成 8-15 条观看记录，按时间倒序，时间跨度约最近一个月。
2. 标题要像真实成人视频网站上的标题：看到标题就能知道视频的类型、场景和看点。写法通常是「场景或关系设定 + 类型标签 + 看点」，长短参差，可中英混杂，常带 [4K]、中字、完整版、合集这类站内标注；关键词堆叠式也可以。用词以平台上常见的分类名和场景名为准。禁止文艺化、禁止含蓄隐喻，也不要写成日常视频的标题。所有出演者一律是成年人，不涉及未成年人，也不涉及胁迫或非自愿的内容。
3. progress（观看进度百分比 0-100）要讲故事：看完的（95-100）、只看了开头就关掉的（3-15，愧疚或被打断）、反复回看的经典（配合 watchCount 看过多次）。
4. duration 是视频总长（"12:34" 格式，3-40 分钟为主）；time 是最后观看的相对时间，深夜时段为主，要呼应角色作息与近期剧情。
5. channel（上传者/频道名）要有真实成人网站账号的感觉（英文/拼音/emoji 混杂皆可）。
6. 口味要有主线：大部分记录围绕 1-2 个从人设推断出的明显偏好，夹杂 1-2 条猎奇偏离；视频风格各异但能展现角色特色，偏好本身就在讲这个人是谁。
7. desc 是一句话视频内容简介（详情页展示用），客观概括场景和类型，语气平实，像站内的视频介绍。

# 站内搜索规则
1. 生成 4-8 条搜索关键词，按时间倒序。像真人打进搜索框的：短、直接、可以有错字、可以中英混杂。
2. 至少 1 条与【${userName}】的特征相关。

# 输出格式
只输出一个 JSON 对象，不要输出任何其他文字、注释或 markdown 代码块标记。结构如下：

{
  "videos": [
    {
      "title": "视频标题",
      "channel": "频道名",
      "duration": "12:34",
      "progress": 数字(0-100),
      "watchCount": 数字(看过几次,大多为1),
      "time": "最后观看的相对时间,如 昨天 01:23 / 3天前 23:50",
      "desc": "一句话内容简介"
    }
  ],
  "searches": [
    { "query": "搜索词", "time": "相对时间" }
  ]
}`
}

function buildPhoneMailSystemPrompt(char, user) {
  const charName = char?.nick || char?.name || '角色'
  return `你是一个角色扮演世界的「手机内容生成器」。用户正在查看角色【${charName}】的手机邮箱 App，你需要一次性生成收件箱内容快照：正常邮件与垃圾邮件混排。

# 核心视角
- 邮箱是一个人社会身份的横切面：工作往来、订阅通知、账单验证码、偶尔的私人信件，拼出 TA 在社会里的位置。
- 生成的内容是"被偷看"的真实生活切片：正式邮件暴露职业细节与社会关系；垃圾邮件必须精准踩中 TA 的兴趣与欲望（广告是被算法看穿的内心），这是本功能最核心的乐趣，必须体现。
- 内容必须与角色人设、世界观、以及「角色与用户的真实聊天记录」在时间线和事实上完全一致，可自然呼应近期剧情（聊天里提过的出差、购物、报名，邮箱里应有对应邮件）。

# 邮件规则
1. 生成 8-14 封邮件，按时间倒序，时间跨度约最近三周。
2. 类型配比（依人设调整）：3-5 封工作/学业往来（有具体事项、有称呼和落款）、1-3 封订阅/平台通知（订单、账单、行程、验证码）、0-2 封私人邮件、2-4 封垃圾邮件（spam 为 true）。
3. 垃圾邮件必须与人设兴趣挂钩：TA 爱游戏就是游戏充值优惠，焦虑脱发就是生发广告，缺钱就是贷款推广。标题浮夸（【限时】、全角感叹号、emoji），发件人地址可疑（乱码前缀、奇怪域名）。
4. sender（显示名）与 address（邮箱地址）要配套且有真实感：公司邮件用 名字@公司域名，平台通知用 no-reply@，垃圾邮件用可疑地址。
5. body 是完整正文：正式邮件有称呼、正文、落款；通知类像模板邮件；垃圾邮件语气夸张。用 \\n 表示换行。列表预览由前端从 body 截取，不要单独写预览字段。
6. unread（未读）要真实：真人不会读完所有邮件——账单、垃圾邮件常年未读；跟工作和自己利益相关的已读。未读 3-6 封。
7. 若提供了「已生成的微信好友名单」，同事/朋友的来信优先使用名单中的人物。
8. 0-2 封带附件：attachments 里写文件名和大小，如「排班表_0703.xlsx」「24KB」，文件名要与正文呼应。

# 输出格式
只输出一个 JSON 对象，不要输出任何其他文字、注释或 markdown 代码块标记。结构如下：

{
  "emails": [
    {
      "sender": "发件人显示名",
      "address": "发件人邮箱地址",
      "subject": "邮件主题",
      "body": "完整正文,用 \\n 换行",
      "time": "相对时间,如 昨天 09:14 / 3天前 / 周二 18:02",
      "unread": true,
      "spam": false,
      "attachments": [ { "name": "文件名.xlsx", "size": "24KB" } ]
    }
  ]
}`
}

const PHONE_GEN_APP_SYSTEM_BUILDERS = {
  browser: buildPhoneBrowserSystemPrompt,
  notes: buildPhoneNotesSystemPrompt,
  photos: buildPhonePhotosSystemPrompt,
  'game-center': buildPhoneGameCenterSystemPrompt,
  privacy: buildPhonePrivacySystemPrompt,
  mail: buildPhoneMailSystemPrompt,
  schedule: buildPhoneScheduleSystemPrompt
}

// ===== 共享：User Prompt（骨架与微信一致，只换任务句） =====

function buildPhoneAppWechatFriendsBlock(wechatData) {
  const friends = wechatData?.friends || []
  if (!friends.length) return '(无。人物可自行虚构，但要符合角色生活圈。)'
  return friends.map(f => `- ${f.name}（备注：${f.remark || f.name}｜关系：${f.relation || '未设定'}）`).join('\n')
}

async function buildPhoneAppUserPrompt(appId, char, user, npcs, loreCtx, recentMessagesText, wechatData) {
  const appLabel = PHONE_GEN_APP_LABELS[appId] || appId
  const charName = char?.name || '角色'
  const nickPart = char?.nick && char.nick !== char.name ? `（昵称：${char.nick}）` : ''
  return `请为下面这个角色生成 TA 的手机「${appLabel}」内容快照。

【当前时间】${formatPhoneSnapshotCurrentTime()}

【角色档案】(这是手机的主人)
名字：${charName}${nickPart}
性别：${char?.gender || '未知'}
身份：${char?.role || '(未设定)'}
人设：
${char?.description || '(未设定)'}

【用户档案】(正在查看这部手机的人,角色的聊天对象)
名字：${user?.nick || user?.name || '用户'}
${user?.gender ? `性别：${user.gender}` : ''}
${user?.role ? `身份：${user.role}` : ''}
人设：
${user?.description || '(未设定)'}

【角色与用户的关系】
${buildPhoneSnapshotRelationText(char, user?.id)}

【关联NPC列表】
${buildPhoneSnapshotNpcBlock(npcs)}

【已生成的微信好友名单】(这部手机微信里已生成的人物,内容涉及他人时优先引用这些名字,保持一部手机内的世界观一致)
${buildPhoneAppWechatFriendsBlock(wechatData)}

【世界书设定】(如有绑定)
${loreCtx || '(无)'}

【角色与用户的真实聊天记录】(用于:呼应近期剧情;禁止改写或重新生成这段对话)
${recentMessagesText}

请严格按 system 中定义的 JSON 结构输出。`
}

// ===== 日程 =====
function paDateKey(ts) {
  const d = new Date(ts)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function paFmtMonthDayTime(ts) {
  const d = new Date(ts)
  return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

function buildPhoneScheduleSystemPrompt(char, user) {
  const charName = char?.nick || char?.name || '角色'
  const userName = user?.nick || user?.name || '用户'
  return `你是一个角色扮演世界的「手机内容生成器」。用户正在查看角色【${charName}】手机里的「日程」应用，你需要一次性生成他未来 7 天（含今天）的排班与日程。

# 核心视角
- 这是【${charName}】自己的日程。按人设里的职业、作息和生活习惯推断真实的工作节奏（例如飞行员有航班号、起降地、出勤和休息；上班族有会议和通勤）。工作之外也要有生活：运动、吃饭、休息、见朋友等，但不要排满。
- 「聊天里已经确定的安排」是他亲口对${userName}说过的，必须原样出现在对应日期，时间保持一致，不得与之冲突；其余日期合理补充。
- 休息日也要生成（items 为空数组，off 为 true）。
- 不要替${userName}编造行程；与${userName}有关的内容只出现在 note 里，克制、一句话。
- 内容必须和「角色与用户的真实聊天记录」在时间线上一致。

# 规则
1. 生成 7 天，从【今天的日期】起，按日期升序。
2. 每天 0-6 条，按开始时间升序；时间用 24 小时制 HH:mm；跨天的事写成当天结束 23:59，并在 note 里说明。
3. title 简短具体（如“CZ3085 广州→北京”“例会”“健身”）；place 可选；note 可选，一句话。

# 输出格式
只输出一个 JSON 对象，不要输出任何其他文字、注释或 markdown 代码块标记：

{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "off": false,
      "items": [
        { "start": "HH:mm", "end": "HH:mm", "title": "标题", "place": "地点", "note": "备注" }
      ]
    }
  ]
}`
}

async function buildPhoneScheduleExtraBlock(charId) {
  let events = []
  try {
    const rec = await db.config.get('charSchedule')
    const now = Date.now()
    events = (rec?.value?.events || []).filter(e => String(e.charId) === String(charId) &&
      e.status !== 'cancelled' && e.endAt > now - 86400000 && e.startAt < now + 8 * 86400000)
      .sort((a, b) => a.startAt - b.startAt)
  } catch (_) {}
  const lines = events.length
    ? events.map(e => `- ${paFmtMonthDayTime(e.startAt)} 至 ${paFmtMonthDayTime(e.endAt)}：${e.title}${e.status === 'done' ? '（已结束）' : ''}`).join('\n')
    : '(暂无)'
  return `【今天的日期】${paDateKey(Date.now())}\n\n【聊天里已经确定的安排】(角色在和用户聊天时亲口说过的真实安排，必须原样出现在排班里，时间一致，不得冲突)\n${lines}\n\n`
}

function sanitizePhoneScheduleData(raw) {
  if (!raw || typeof raw !== 'object') return null
  const clean = v => String(v ?? '').trim()
  const hhmm = v => {
    const m = clean(v).match(/^(\d{1,2}):(\d{2})$/)
    if (!m) return ''
    const h = Number(m[1]); const mi = Number(m[2])
    if (h > 23 || mi > 59) return ''
    return String(h).padStart(2, '0') + ':' + m[2]
  }
  const days = (Array.isArray(raw.days) ? raw.days : []).map(d => {
    const date = clean(d?.date)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
    const items = (Array.isArray(d?.items) ? d.items : []).map(it => ({
      start: hhmm(it?.start),
      end: hhmm(it?.end),
      title: clean(it?.title).slice(0, 40),
      place: clean(it?.place).slice(0, 40),
      note: clean(it?.note).slice(0, 60)
    })).filter(it => it.title && it.start)
      .sort((a, b) => a.start.localeCompare(b.start)).slice(0, 8)
    return { date, off: d?.off === true && !items.length, items }
  }).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8)
  return { days }
}

// ===== 数据清洗 =====

function sanitizePhoneBrowserData(raw) {
  if (!raw || typeof raw !== 'object') return null
  const clean = v => String(v ?? '').trim()
  const searches = (Array.isArray(raw.searches) ? raw.searches : [])
    .map(s => ({
      query: clean(s?.query),
      time: clean(s?.time),
      results: (Array.isArray(s?.results) ? s.results : [])
        .map(r => ({
          title: clean(r?.title),
          site: clean(r?.site),
          snippet: clean(r?.snippet)
        }))
        .filter(r => r.title)
    }))
    .filter(s => s.query)
  const bookmarks = (Array.isArray(raw.bookmarks) ? raw.bookmarks : [])
    .map(b => ({
      title: clean(b?.title),
      site: clean(b?.site),
      desc: clean(b?.desc)
    }))
    .filter(b => b.title)
  return { searches, bookmarks }
}

function sanitizePhoneNotesData(raw) {
  if (!raw || typeof raw !== 'object') return null
  const clean = v => String(v ?? '').trim()
  const notes = (Array.isArray(raw.notes) ? raw.notes : [])
    .map(n => ({
      title: clean(n?.title),
      time: clean(n?.time),
      content: String(n?.content ?? '').replace(/\r\n/g, '\n').replace(/\\n/g, '\n').trim(),
      pinned: n?.pinned === true
    }))
    .filter(n => n.content || n.title)
  return { notes }
}

function sanitizePhonePhotosData(raw) {
  if (!raw || typeof raw !== 'object') return null
  const clean = v => String(v ?? '').trim()
  const albums = (Array.isArray(raw.albums) ? raw.albums : [])
    .map(a => ({
      name: clean(a?.name),
      photos: (Array.isArray(a?.photos) ? a.photos : [])
        .map(p => ({
          desc: clean(p?.desc),
          time: clean(p?.time)
        }))
        .filter(p => p.desc)
    }))
    .filter(a => a.name && a.photos.length)
  return { albums }
}

function sanitizePhoneGameCenterData(raw) {
  if (!raw || typeof raw !== 'object') return null
  const clean = v => String(v ?? '').trim()
  const toHours = v => {
    const n = parseFloat(v)
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : 0
  }
  const games = (Array.isArray(raw.games) ? raw.games : [])
    .map(g => ({
      name: clean(g?.name),
      genre: clean(g?.genre),
      weeklyHours: toHours(g?.weeklyHours),
      totalHours: toHours(g?.totalHours),
      lastPlayed: clean(g?.lastPlayed),
      achievements: (Array.isArray(g?.achievements) ? g.achievements : [])
        .map(a => ({
          title: clean(a?.title),
          desc: clean(a?.desc),
          unlocked: a?.unlocked === true,
          time: a?.time == null ? null : clean(a.time)
        }))
        .filter(a => a.title),
      stats: (Array.isArray(g?.stats) ? g.stats : [])
        .map(s => ({ label: clean(s?.label), value: clean(s?.value) }))
        .filter(s => s.label && s.value)
    }))
    .filter(g => g.name)
  return { games }
}

function sanitizePhonePrivacyData(raw) {
  if (!raw || typeof raw !== 'object') return null
  const clean = v => String(v ?? '').trim()
  const toPct = v => {
    const n = parseFloat(v)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.min(100, Math.round(n)))
  }
  const toCount = v => {
    const n = parseInt(v, 10)
    return Number.isFinite(n) && n > 0 ? n : 1
  }
  const videos = (Array.isArray(raw.videos) ? raw.videos : [])
    .map(v => ({
      title: clean(v?.title),
      channel: clean(v?.channel),
      duration: clean(v?.duration),
      progress: toPct(v?.progress),
      watchCount: toCount(v?.watchCount),
      time: clean(v?.time),
      desc: clean(v?.desc)
    }))
    .filter(v => v.title)
  const searches = (Array.isArray(raw.searches) ? raw.searches : [])
    .map(s => ({ query: clean(s?.query), time: clean(s?.time) }))
    .filter(s => s.query)
  return { videos, searches }
}

function sanitizePhoneMailData(raw) {
  if (!raw || typeof raw !== 'object') return null
  const clean = v => String(v ?? '').trim()
  const emails = (Array.isArray(raw.emails) ? raw.emails : [])
    .map(e => ({
      sender: clean(e?.sender),
      address: clean(e?.address),
      subject: clean(e?.subject),
      body: String(e?.body ?? '').replace(/\r\n/g, '\n').replace(/\\n/g, '\n').trim(),
      time: clean(e?.time),
      unread: e?.unread === true,
      spam: e?.spam === true,
      attachments: (Array.isArray(e?.attachments) ? e.attachments : [])
        .map(a => ({ name: clean(a?.name), size: clean(a?.size) }))
        .filter(a => a.name)
    }))
    .filter(e => e.subject || e.body)
  return { emails }
}

const PHONE_GEN_APP_SANITIZERS = {
  browser: sanitizePhoneBrowserData,
  notes: sanitizePhoneNotesData,
  photos: sanitizePhonePhotosData,
  'game-center': sanitizePhoneGameCenterData,
  privacy: sanitizePhonePrivacyData,
  mail: sanitizePhoneMailData,
  schedule: sanitizePhoneScheduleData
}

function phoneAppDataIsEmpty(appId, data) {
  if (!data) return true
  if (appId === 'browser') return !data.searches.length && !data.bookmarks.length
  if (appId === 'notes') return !data.notes.length
  if (appId === 'photos') return !data.albums.length
  if (appId === 'game-center') return !data.games.length
  if (appId === 'privacy') return !data.videos.length && !data.searches.length
  if (appId === 'mail') return !data.emails.length
  if (appId === 'schedule') return !data.days.length
  return true
}

// 为排序补 _ts（沿用微信的相对时间解析）
function stampPhoneAppTimes(appId, data, now = Date.now()) {
  const stamp = (item, fallbackIndex) => {
    const parsed = parsePhoneRelativeTime(item.time, now)
    item._ts = parsed != null ? parsed : now - fallbackIndex * 3600000
  }
  if (appId === 'browser') {
    data.searches.forEach((s, i) => stamp(s, i + 1))
    data.searches.sort((a, b) => (b._ts || 0) - (a._ts || 0))
  } else if (appId === 'notes') {
    data.notes.forEach((n, i) => stamp(n, i + 1))
    data.notes.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return (b._ts || 0) - (a._ts || 0)
    })
  } else if (appId === 'photos') {
    data.albums.forEach((album, ai) => {
      album.photos.forEach((p, i) => {
        const parsed = parsePhoneRelativeTime(p.time, now)
        p._ts = parsed != null ? parsed : now - (ai * 10 + i + 1) * 86400000
      })
    })
  } else if (appId === 'game-center') {
    data.games.forEach((g, i) => {
      const parsed = parsePhoneRelativeTime(g.lastPlayed, now)
      g._ts = parsed != null ? parsed : now - (i + 1) * 3600000
    })
    data.games.sort((a, b) => (b._ts || 0) - (a._ts || 0))
  } else if (appId === 'privacy') {
    data.videos.forEach((v, i) => stamp(v, i + 1))
    data.videos.sort((a, b) => (b._ts || 0) - (a._ts || 0))
    data.searches.forEach((s, i) => stamp(s, i + 1))
    data.searches.sort((a, b) => (b._ts || 0) - (a._ts || 0))
  } else if (appId === 'mail') {
    data.emails.forEach((e, i) => stamp(e, i + 1))
    data.emails.sort((a, b) => (b._ts || 0) - (a._ts || 0))
  }
}

// ===== 生成主流程（全量生成，已有快照直接覆盖） =====
// 宽容的 JSON 解析：处理代码块、前后多余的文字、字符串里的裸换行、
// 未转义的双引号、末尾多余的逗号、以及被截断的输出（会丢掉没写完的最后一项）
function repairPhoneJsonLoose(src) {
  let out = ''
  let inStr = false
  let esc = false
  const stack = []
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inStr) {
      if (esc) { out += c; esc = false; continue }
      if (c === '\\') { out += c; esc = true; continue }
      if (c === '"') {
        // 后面第一个非空白字符是 , } ] : 才算字符串结束，否则当作正文里的引号
        let j = i + 1
        while (j < src.length && /\s/.test(src[j])) j++
        const nx = src[j]
        if (nx === undefined || nx === ',' || nx === '}' || nx === ']' || nx === ':') {
          inStr = false
          out += c
        } else {
          out += '\\"'
        }
        continue
      }
      if (c === '\n') { out += '\\n'; continue }
      if (c === '\r') continue
      if (c === '\t') { out += '\\t'; continue }
      out += c
      continue
    }
    if (c === '"') { inStr = true; out += c; continue }
    if (c === '{' || c === '[') stack.push(c)
    else if (c === '}' || c === ']') stack.pop()
    out += c
  }
  if (inStr) out += '"'
  out = out.replace(/[,\s]+$/, '')
  while (stack.length) out += stack.pop() === '{' ? '}' : ']'
  return out.replace(/,\s*([}\]])/g, '$1')
}

function parsePhoneSnapshotJsonLoose(raw) {
  let text = String(raw == null ? '' : raw).replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  const start = text.indexOf('{')
  if (start < 0) return null
  const end = text.lastIndexOf('}')
  const body = end > start ? text.slice(start, end + 1) : text.slice(start)
  const tryParse = s => {
    try {
      const v = JSON.parse(s)
      return v && typeof v === 'object' ? v : null
    } catch (_) {
      return null
    }
  }
  return tryParse(body) ||
    tryParse(repairPhoneJsonLoose(body)) ||
    (end > start ? tryParse(repairPhoneJsonLoose(text.slice(start))) : null)
}

async function generatePhoneAppSnapshot(appId, ownerUid, charId) {
  if (typeof window.callAI !== 'function') throw new Error('请先在设置里配置 API')
  const buildSystem = PHONE_GEN_APP_SYSTEM_BUILDERS[appId]
  const sanitize = PHONE_GEN_APP_SANITIZERS[appId]
  if (!buildSystem || !sanitize) throw new Error('未知应用')
  const char = await db.characters.get(charId)
  if (!char) throw new Error('角色不存在')
  const user = await db.characters.get(ownerUid)
  if (!user) throw new Error('微信账号不存在')
  const charName = char.nick || char.name || '角色'
  const userName = user.nick || user.name || '用户'

  const npcs = await loadPhoneSnapshotRelatedNpcs(char, ownerUid)
  const recentBlock = await buildPhoneSnapshotRecentMessagesBlock(ownerUid, charId, charName, userName)
  const loreCtx = window.getLorebookContext
    ? await window.getLorebookContext(charId, recentBlock.loreMessages)
    : ''
  const wechatSnapshot = await getPhoneWechatSnapshot(ownerUid, charId)

  const system = buildSystem(char, user)
  let userPrompt = await buildPhoneAppUserPrompt(appId, char, user, npcs, loreCtx, recentBlock.text, wechatSnapshot?.data)
  if (appId === 'schedule') userPrompt = (await buildPhoneScheduleExtraBlock(charId)) + userPrompt
  const raw = await window.callAI([{ role: 'user', content: userPrompt }], {
    system,
    responseFormat: 'json_object',
    temperature: await getPhoneSnapshotTemperature()
  })
  let parsed = null
  try { parsed = extractPhoneSnapshotJson(raw) } catch (_) {}
  if (!parsed) parsed = parsePhoneSnapshotJsonLoose(raw)
  if (!parsed) {
    window._lastPhoneSnapshotRaw = String(raw || '')
    console.warn('[phone-apps] 返回格式异常，模型原始内容：', raw)
    const hint = String(raw || '').replace(/\s+/g, ' ').trim().slice(0, 60)
    throw new Error('AI 返回格式异常，请重试' + (hint ? `（模型返回开头：${hint}）` : '（模型没有返回内容）'))
  }
  const cleaned = sanitize(parsed)
  if (!cleaned || phoneAppDataIsEmpty(appId, cleaned)) throw new Error('生成结果为空，请重试')

  const now = Date.now()
  stampPhoneAppTimes(appId, cleaned, now)

  const snapshot = {
    version: 1,
    generatedAt: now,
    updatedAt: now,
    data: cleaned
  }
  await savePhoneAppSnapshot(appId, ownerUid, charId, snapshot)
  return snapshot
}

window.generatePhoneAppSnapshot = generatePhoneAppSnapshot

// ===== 页面公共辅助 =====

const PHONE_APP_PAGE_IDS = [
  'phone-app-browser-page',
  'phone-app-browser-search-page',
  'phone-app-notes-page',
  'phone-app-note-detail-page',
  'phone-app-photos-page',
  'phone-app-album-page',
  'phone-app-photo-viewer',
  'phone-app-gamecenter-page',
  'phone-app-game-detail-page',
  'phone-app-privacy-page',
  'phone-app-privacy-detail-page',
  'phone-app-mail-page',
  'phone-app-mail-detail-page',
  'phone-app-schedule-page'
]

function closePhoneAppSnapshotPages() {
  PHONE_APP_PAGE_IDS.forEach(id => document.getElementById(id)?.remove())
}

window.closePhoneAppSnapshotPages = closePhoneAppSnapshotPages

function createPhoneAppPage(id, title, extraClass = '') {
  document.getElementById(id)?.remove()
  const page = document.createElement('div')
  page.id = id
  page.className = `full-page phone-app-page ${extraClass}`.trim()
  page.innerHTML = `
    <div class="page-header">
      <button class="header-back" data-phone-app-back type="button"><i class="fa fa-angle-left"></i></button>
      <span class="header-title">${paEscHtml(title)}</span>
      <span style="width:40px;flex-shrink:0"></span>
    </div>
    <div class="phone-app-scroll"></div>
  `
  page.querySelector('[data-phone-app-back]').addEventListener('click', () => window.closePage(id))
  return page
}

function buildPhoneAppEmptyHTML(icon, title) {
  return `
    <div class="phone-app-empty">
      <i class="${paEscHtml(icon)}"></i>
      <div>${paEscHtml(title)}</div>
    </div>`
}

// ===== 浏览器页面 =====

async function openPhoneBrowserPage(context) {
  const snapshot = await getPhoneAppSnapshot('browser', context.ownerUid, context.charId)
  const data = snapshot?.data
  const page = createPhoneAppPage('phone-app-browser-page', '浏览器')
  const scroll = page.querySelector('.phone-app-scroll')

  const searchbar = `
    <div class="phone-browser-searchbar" aria-hidden="true">
      <i class="fa fa-magnifying-glass"></i>
      <span>搜索或输入网址</span>
    </div>`

  if (!data || (!data.searches.length && !data.bookmarks.length)) {
    scroll.innerHTML = searchbar + buildPhoneAppEmptyHTML('fa-regular fa-compass', '暂无浏览数据')
    window.openPage(page)
    return
  }

  const searchesHtml = data.searches.length ? `
    <div class="phone-app-section-title">搜索记录</div>
    <div class="phone-app-list">
      ${data.searches.map((s, i) => `
        <button class="phone-app-row" type="button" data-search-index="${i}">
          <span class="phone-app-row-icon"><i class="fa fa-clock-rotate-left"></i></span>
          <span class="phone-app-row-main">
            <span class="phone-app-row-title">${paEscHtml(s.query)}</span>
            <span class="phone-app-row-sub">${paEscHtml(s.time || '')}</span>
          </span>
          <i class="fa fa-angle-right phone-app-row-arrow"></i>
        </button>
      `).join('')}
    </div>` : ''

  const bookmarksHtml = data.bookmarks.length ? `
    <div class="phone-app-section-title">收藏</div>
    <div class="phone-app-list">
      ${data.bookmarks.map(b => `
        <div class="phone-app-row phone-app-row-static">
          <span class="phone-app-row-icon phone-browser-bookmark-icon"><i class="fa fa-star"></i></span>
          <span class="phone-app-row-main">
            <span class="phone-app-row-title">${paEscHtml(b.title)}</span>
            <span class="phone-app-row-sub">${paEscHtml(b.site)}${b.desc ? `｜${paEscHtml(b.desc)}` : ''}</span>
          </span>
        </div>
      `).join('')}
    </div>` : ''

  scroll.innerHTML = searchbar + searchesHtml + bookmarksHtml
  window.openPage(page)

  scroll.querySelectorAll('[data-search-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const search = data.searches[parseInt(btn.dataset.searchIndex, 10)]
      if (search) openPhoneBrowserSearchPage(search)
    })
  })
}

function openPhoneBrowserSearchPage(search) {
  const page = createPhoneAppPage('phone-app-browser-search-page', search.query)
  const scroll = page.querySelector('.phone-app-scroll')
  scroll.innerHTML = `
    <div class="phone-browser-searchbar phone-browser-searchbar-filled" aria-hidden="true">
      <i class="fa fa-magnifying-glass"></i>
      <span>${paEscHtml(search.query)}</span>
    </div>
    <div class="phone-browser-result-meta">找到约 ${(search.results.length * 128400).toLocaleString()} 条结果${search.time ? `｜搜索于 ${paEscHtml(search.time)}` : ''}</div>
    ${search.results.map(r => `
      <div class="phone-browser-result-card">
        <div class="phone-browser-result-site"><span class="phone-browser-result-favicon">${paEscHtml(Array.from(r.site || r.title)[0] || '?')}</span>${paEscHtml(r.site || '')}</div>
        <div class="phone-browser-result-title">${paEscHtml(r.title)}</div>
        <div class="phone-browser-result-snippet">${paEscHtml(r.snippet || '')}</div>
      </div>
    `).join('')}
  `
  window.openPage(page)
}

// ===== 备忘录页面 =====

function phoneNoteDisplayTitle(note) {
  if (note.title) return note.title
  const firstLine = String(note.content || '').split('\n').find(line => line.trim())
  return (firstLine || '新建备忘录').trim().slice(0, 30)
}

async function openPhoneNotesPage(context) {
  const snapshot = await getPhoneAppSnapshot('notes', context.ownerUid, context.charId)
  const notes = snapshot?.data?.notes || []
  const page = createPhoneAppPage('phone-app-notes-page', '备忘录')
  const scroll = page.querySelector('.phone-app-scroll')

  if (!notes.length) {
    scroll.innerHTML = buildPhoneAppEmptyHTML('fa-solid fa-pen-clip', '暂无备忘录')
    window.openPage(page)
    return
  }

  scroll.innerHTML = `
    <div class="phone-app-section-title">${notes.length} 个备忘录</div>
    <div class="phone-app-list">
      ${notes.map((note, i) => {
        const preview = String(note.content || '').split('\n').filter(l => l.trim())
        const previewText = (note.title ? preview[0] : preview[1]) || ''
        return `
          <button class="phone-app-row" type="button" data-note-index="${i}">
            <span class="phone-app-row-main">
              <span class="phone-app-row-title">${note.pinned ? '<i class="fa fa-thumbtack phone-note-pin"></i>' : ''}${paEscHtml(phoneNoteDisplayTitle(note))}</span>
              <span class="phone-app-row-sub"><span class="phone-note-time">${paEscHtml(note.time || '')}</span>${paEscHtml(String(previewText).slice(0, 40))}</span>
            </span>
            <i class="fa fa-angle-right phone-app-row-arrow"></i>
          </button>`
      }).join('')}
    </div>
  `
  window.openPage(page)

  scroll.querySelectorAll('[data-note-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const note = notes[parseInt(btn.dataset.noteIndex, 10)]
      if (note) openPhoneNoteDetailPage(note)
    })
  })
}

function openPhoneNoteDetailPage(note) {
  const page = createPhoneAppPage('phone-app-note-detail-page', '备忘录')
  const scroll = page.querySelector('.phone-app-scroll')
  scroll.innerHTML = `
    <div class="phone-note-detail">
      <div class="phone-note-detail-title">${paEscHtml(phoneNoteDisplayTitle(note))}</div>
      <div class="phone-note-detail-time">${paEscHtml(note.time || '')}</div>
      <div class="phone-note-detail-content">${paEscHtml(note.content || '')}</div>
    </div>
  `
  window.openPage(page)
}

// ===== 相册页面 =====

function collectPhonePhotos(albums) {
  const all = []
  albums.forEach((album, albumIndex) => {
    album.photos.forEach((photo, photoIndex) => {
      all.push({ ...photo, albumName: album.name, _salt: `${albumIndex}_${photoIndex}` })
    })
  })
  all.sort((a, b) => (b._ts || 0) - (a._ts || 0))
  return all
}

function buildPhonePhotoThumbHTML(photo) {
  const src = phoneAppPlaceholderImg(photo.desc, photo._salt)
  return `
    <button class="phone-photo-thumb" type="button" data-photo-desc="${paEscHtml(photo.desc)}" data-photo-time="${paEscHtml(photo.time || '')}" data-photo-src="${src}">
      <img src="${src}" alt="${paEscHtml(photo.desc)}" loading="lazy">
    </button>`
}

function bindPhonePhotoThumbs(scope) {
  scope.querySelectorAll('.phone-photo-thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      openPhonePhotoViewer(btn.dataset.photoSrc, btn.dataset.photoDesc, btn.dataset.photoTime)
    })
  })
}

async function openPhonePhotosPage(context) {
  const snapshot = await getPhoneAppSnapshot('photos', context.ownerUid, context.charId)
  const albums = snapshot?.data?.albums || []
  const page = createPhoneAppPage('phone-app-photos-page', '相册')
  const scroll = page.querySelector('.phone-app-scroll')

  if (!albums.length) {
    scroll.innerHTML = buildPhoneAppEmptyHTML('fa-solid fa-panorama', '暂无照片')
    window.openPage(page)
    return
  }

  const allPhotos = collectPhonePhotos(albums)
  scroll.innerHTML = `
    <div class="phone-app-section-title">我的相册</div>
    <div class="phone-album-strip">
      ${albums.map((album, i) => {
        const cover = album.photos[0]
        const src = phoneAppPlaceholderImg(cover?.desc, `${i}_0`)
        return `
          <button class="phone-album-card" type="button" data-album-index="${i}">
            <span class="phone-album-cover"><img src="${src}" alt="${paEscHtml(album.name)}" loading="lazy"></span>
            <span class="phone-album-name">${paEscHtml(album.name)}</span>
            <span class="phone-album-count">${album.photos.length}</span>
          </button>`
      }).join('')}
    </div>
    <div class="phone-app-section-title">最近项目</div>
    <div class="phone-photo-grid">
      ${allPhotos.map(buildPhonePhotoThumbHTML).join('')}
    </div>
  `
  window.openPage(page)

  scroll.querySelectorAll('[data-album-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const album = albums[parseInt(btn.dataset.albumIndex, 10)]
      if (album) openPhoneAlbumPage(album, parseInt(btn.dataset.albumIndex, 10))
    })
  })
  bindPhonePhotoThumbs(scroll)
}

function openPhoneAlbumPage(album, albumIndex) {
  const page = createPhoneAppPage('phone-app-album-page', album.name)
  const scroll = page.querySelector('.phone-app-scroll')
  const photos = album.photos
    .map((photo, photoIndex) => ({ ...photo, _salt: `${albumIndex}_${photoIndex}` }))
    .sort((a, b) => (b._ts || 0) - (a._ts || 0))
  scroll.innerHTML = `
    <div class="phone-app-section-title">${paEscHtml(album.name)}｜${album.photos.length} 张</div>
    <div class="phone-photo-grid">
      ${photos.map(buildPhonePhotoThumbHTML).join('')}
    </div>
  `
  window.openPage(page)
  bindPhonePhotoThumbs(scroll)
}

function openPhonePhotoViewer(src, desc, time) {
  document.getElementById('phone-app-photo-viewer')?.remove()
  const viewer = document.createElement('div')
  viewer.id = 'phone-app-photo-viewer'
  viewer.className = 'phone-photo-viewer'
  viewer.innerHTML = `
    <button class="phone-photo-viewer-close" type="button" aria-label="关闭"><i class="fa fa-xmark"></i></button>
    <div class="phone-photo-viewer-body">
      <img src="${paEscHtml(src)}" alt="${paEscHtml(desc)}">
    </div>
    <div class="phone-photo-viewer-caption">
      <div class="phone-photo-viewer-desc">${paEscHtml(desc || '')}</div>
      ${time ? `<div class="phone-photo-viewer-time">${paEscHtml(time)}</div>` : ''}
    </div>
  `
  document.body.appendChild(viewer)
  requestAnimationFrame(() => viewer.classList.add('show'))
  const close = () => {
    viewer.classList.remove('show')
    setTimeout(() => viewer.remove(), 220)
  }
  viewer.querySelector('.phone-photo-viewer-close').addEventListener('click', close)
  viewer.querySelector('.phone-photo-viewer-body').addEventListener('click', close)
}

// ===== Game Center 页面 =====

function formatPhoneGameHours(hours) {
  const n = Number(hours || 0)
  if (n >= 10) return `${Math.round(n)} 小时`
  return `${(Math.round(n * 10) / 10).toString().replace(/\.0$/, '')} 小时`
}

function buildPhoneGameIconHTML(game) {
  const initial = Array.from(String(game.name || '?').trim())[0] || '?'
  return `<span class="phone-game-icon">${paEscHtml(initial)}</span>`
}

async function openPhoneGameCenterPage(context) {
  const snapshot = await getPhoneAppSnapshot('game-center', context.ownerUid, context.charId)
  const games = snapshot?.data?.games || []
  const page = createPhoneAppPage('phone-app-gamecenter-page', 'Game Center')
  const scroll = page.querySelector('.phone-app-scroll')

  if (!games.length) {
    scroll.innerHTML = buildPhoneAppEmptyHTML('fa-solid fa-chess', '暂无游戏记录')
    window.openPage(page)
    return
  }

  scroll.innerHTML = `
    <div class="phone-app-section-title">最近游玩</div>
    <div class="phone-app-list">
      ${games.map((game, i) => `
        <button class="phone-app-row phone-game-row" type="button" data-game-index="${i}">
          ${buildPhoneGameIconHTML(game)}
          <span class="phone-app-row-main">
            <span class="phone-app-row-title">${paEscHtml(game.name)}${game.genre ? `<span class="phone-game-genre">${paEscHtml(game.genre)}</span>` : ''}</span>
            <span class="phone-app-row-sub">本周 ${formatPhoneGameHours(game.weeklyHours)}｜累计 ${formatPhoneGameHours(game.totalHours)}${game.lastPlayed ? `｜${paEscHtml(game.lastPlayed)}` : ''}</span>
          </span>
          <i class="fa fa-angle-right phone-app-row-arrow"></i>
        </button>
      `).join('')}
    </div>
  `
  window.openPage(page)

  scroll.querySelectorAll('[data-game-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const game = games[parseInt(btn.dataset.gameIndex, 10)]
      if (game) openPhoneGameDetailPage(game)
    })
  })
}

function openPhoneGameDetailPage(game) {
  const page = createPhoneAppPage('phone-app-game-detail-page', game.name)
  const scroll = page.querySelector('.phone-app-scroll')

  const achievementsHtml = game.achievements.length ? `
    <div class="phone-app-section-title">成就</div>
    <div class="phone-app-list">
      ${game.achievements.map(a => `
        <div class="phone-app-row phone-app-row-static phone-achievement-row${a.unlocked ? '' : ' is-locked'}">
          <span class="phone-app-row-icon phone-achievement-icon"><i class="fa fa-${a.unlocked ? 'trophy' : 'lock'}"></i></span>
          <span class="phone-app-row-main">
            <span class="phone-app-row-title">${paEscHtml(a.title)}</span>
            <span class="phone-app-row-sub">${paEscHtml(a.desc || '')}${a.unlocked && a.time ? `｜${paEscHtml(a.time)}` : ''}</span>
          </span>
          ${a.unlocked ? '<i class="fa fa-check phone-achievement-check"></i>' : ''}
        </div>
      `).join('')}
    </div>` : ''

  const statsHtml = game.stats.length ? `
    <div class="phone-app-section-title">战绩数据</div>
    <div class="phone-game-stats">
      ${game.stats.map(s => `
        <div class="phone-game-stat-row">
          <span class="phone-game-stat-label">${paEscHtml(s.label)}</span>
          <span class="phone-game-stat-value">${paEscHtml(s.value)}</span>
        </div>
      `).join('')}
    </div>` : ''

  scroll.innerHTML = `
    <div class="phone-game-hero">
      ${buildPhoneGameIconHTML(game)}
      <div class="phone-game-hero-main">
        <div class="phone-game-hero-name">${paEscHtml(game.name)}</div>
        ${game.genre ? `<div class="phone-game-hero-genre">${paEscHtml(game.genre)}</div>` : ''}
      </div>
    </div>
    <div class="phone-game-hours">
      <div class="phone-game-hours-card">
        <div class="phone-game-hours-value">${formatPhoneGameHours(game.weeklyHours)}</div>
        <div class="phone-game-hours-label">本周</div>
      </div>
      <div class="phone-game-hours-card">
        <div class="phone-game-hours-value">${formatPhoneGameHours(game.totalHours)}</div>
        <div class="phone-game-hours-label">累计</div>
      </div>
      <div class="phone-game-hours-card">
        <div class="phone-game-hours-value phone-game-hours-last">${paEscHtml(game.lastPlayed || '—')}</div>
        <div class="phone-game-hours-label">最后游玩</div>
      </div>
    </div>
    ${achievementsHtml}
    ${statsHtml}
  `
  window.openPage(page)
}

// ===== 隐私空间页面 =====

function buildPhonePrivacyLogoHTML() {
  return `
    <div class="phone-ph-logo" aria-hidden="true">
      <span class="phone-ph-logo-text">隐私</span><span class="phone-ph-logo-block">空间</span>
    </div>`
}

function buildPhonePrivacyVideoCardHTML(video, index) {
  const src = phoneAppPlaceholderImg(video.desc || video.title, `ph_${index}`)
  return `
    <button class="phone-ph-card" type="button" data-video-index="${index}">
      <span class="phone-ph-thumb">
        <img src="${src}" alt="" loading="lazy">
        ${video.duration ? `<span class="phone-ph-duration">${paEscHtml(video.duration)}</span>` : ''}
        <span class="phone-ph-progress"><span style="width:${video.progress}%"></span></span>
      </span>
      <span class="phone-ph-card-main">
        <span class="phone-ph-card-title">${paEscHtml(video.title)}</span>
        <span class="phone-ph-card-channel">${paEscHtml(video.channel || '')}</span>
        <span class="phone-ph-card-meta">${paEscHtml(video.time || '')}${video.watchCount > 1 ? `｜看过 ${video.watchCount} 次` : ''}</span>
      </span>
    </button>`
}

async function openPhonePrivacyPage(context) {
  const snapshot = await getPhoneAppSnapshot('privacy', context.ownerUid, context.charId)
  const data = snapshot?.data
  const videos = data?.videos || []
  const searches = data?.searches || []
  const page = createPhoneAppPage('phone-app-privacy-page', '隐私空间')
  const scroll = page.querySelector('.phone-app-scroll')

  const videosHtml = videos.length
    ? `<div class="phone-ph-card-list">${videos.map(buildPhonePrivacyVideoCardHTML).join('')}</div>`
    : buildPhoneAppEmptyHTML('fa-regular fa-eye-slash', '暂无观看数据')

  const searchesHtml = searches.length
    ? `
      <div class="phone-app-list">
        ${searches.map(s => `
          <div class="phone-app-row phone-app-row-static">
            <span class="phone-app-row-icon"><i class="fa fa-clock-rotate-left"></i></span>
            <span class="phone-app-row-main">
              <span class="phone-app-row-title">${paEscHtml(s.query)}</span>
              <span class="phone-app-row-sub">${paEscHtml(s.time || '')}</span>
            </span>
          </div>
        `).join('')}
      </div>`
    : buildPhoneAppEmptyHTML('fa-regular fa-eye-slash', '暂无搜索记录')

  scroll.innerHTML = `
    ${buildPhonePrivacyLogoHTML()}
    <div class="phone-ph-tabs">
      <button class="phone-ph-tab is-active" type="button" data-ph-tab="videos">观看记录</button>
      <button class="phone-ph-tab" type="button" data-ph-tab="searches">搜索记录</button>
    </div>
    <div class="phone-ph-panel" data-ph-panel="videos">${videosHtml}</div>
    <div class="phone-ph-panel" data-ph-panel="searches" hidden>${searchesHtml}</div>
  `
  window.openPage(page)

  scroll.querySelectorAll('[data-ph-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      scroll.querySelectorAll('[data-ph-tab]').forEach(t => t.classList.toggle('is-active', t === tab))
      scroll.querySelectorAll('[data-ph-panel]').forEach(p => {
        p.hidden = p.dataset.phPanel !== tab.dataset.phTab
      })
    })
  })

  scroll.querySelectorAll('[data-video-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const video = videos[parseInt(btn.dataset.videoIndex, 10)]
      if (video) openPhonePrivacyDetailPage(video, parseInt(btn.dataset.videoIndex, 10))
    })
  })
}

function openPhonePrivacyDetailPage(video, index) {
  const page = createPhoneAppPage('phone-app-privacy-detail-page', '隐私空间')
  const scroll = page.querySelector('.phone-app-scroll')
  const src = phoneAppPlaceholderImg(video.desc || video.title, `ph_${index}`)
  const rows = [
    ['频道', video.channel],
    ['时长', video.duration],
    ['观看进度', `${video.progress}%`],
    ['观看次数', `${video.watchCount} 次`],
    ['最后观看', video.time]
  ].filter(r => r[1])
  scroll.innerHTML = `
    <div class="phone-ph-detail-thumb">
      <img src="${src}" alt="">
      ${video.duration ? `<span class="phone-ph-duration">${paEscHtml(video.duration)}</span>` : ''}
      <span class="phone-ph-progress"><span style="width:${video.progress}%"></span></span>
    </div>
    <div class="phone-ph-detail-title">${paEscHtml(video.title)}</div>
    ${video.desc ? `<div class="phone-ph-detail-desc">${paEscHtml(video.desc)}</div>` : ''}
    <div class="phone-game-stats">
      ${rows.map(r => `
        <div class="phone-game-stat-row">
          <span class="phone-game-stat-label">${paEscHtml(r[0])}</span>
          <span class="phone-game-stat-value">${paEscHtml(String(r[1]))}</span>
        </div>
      `).join('')}
    </div>
  `
  window.openPage(page)
}

// ===== Mail 页面 =====

const PHONE_MAIL_AVATAR_SHADES = ['#2e2e2e', '#535353', '#767676', '#9a9a9a']

function buildPhoneMailAvatarHTML(sender) {
  const initial = Array.from(String(sender || '?').trim())[0] || '?'
  const raw = String(sender || '?')
  let seed = 0
  for (let i = 0; i < raw.length; i++) seed = ((seed * 31) + raw.charCodeAt(i)) >>> 0
  const bg = PHONE_MAIL_AVATAR_SHADES[seed % PHONE_MAIL_AVATAR_SHADES.length]
  return `<span class="phone-mail-avatar" style="background:${bg}">${paEscHtml(initial)}</span>`
}

function phoneMailPreviewText(email) {
  const firstLine = String(email.body || '').split('\n').find(l => l.trim()) || ''
  return firstLine.trim().slice(0, 60)
}

async function openPhoneMailPage(context) {
  const snapshot = await getPhoneAppSnapshot('mail', context.ownerUid, context.charId)
  const emails = snapshot?.data?.emails || []
  const page = createPhoneAppPage('phone-app-mail-page', 'Mail')
  const scroll = page.querySelector('.phone-app-scroll')

  const searchbar = `
    <div class="phone-browser-searchbar" aria-hidden="true">
      <i class="fa fa-magnifying-glass"></i>
      <span>在邮件中搜索</span>
    </div>`

  if (!emails.length) {
    scroll.innerHTML = searchbar + buildPhoneAppEmptyHTML('fa-regular fa-envelope-open', '暂无邮件')
    window.openPage(page)
    return
  }

  scroll.innerHTML = `
    ${searchbar}
    <div class="phone-app-section-title">收件箱</div>
    <div class="phone-mail-list">
      ${emails.map((email, i) => `
        <button class="phone-mail-row${email.unread ? ' is-unread' : ''}" type="button" data-mail-index="${i}">
          ${buildPhoneMailAvatarHTML(email.sender)}
          <span class="phone-mail-row-main">
            <span class="phone-mail-row-top">
              <span class="phone-mail-sender">${paEscHtml(email.sender || email.address || '(未知发件人)')}</span>
              <span class="phone-mail-time">${paEscHtml(email.time || '')}</span>
            </span>
            <span class="phone-mail-subject">${paEscHtml(email.subject || '(无主题)')}${email.spam ? '<span class="phone-mail-spam-tag">垃圾邮件</span>' : ''}</span>
            <span class="phone-mail-preview">${paEscHtml(phoneMailPreviewText(email))}</span>
          </span>
        </button>
      `).join('')}
    </div>
  `
  window.openPage(page)

  scroll.querySelectorAll('[data-mail-index]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const email = emails[parseInt(btn.dataset.mailIndex, 10)]
      if (!email) return
      if (email.unread) {
        email.unread = false
        btn.classList.remove('is-unread')
        snapshot.updatedAt = Date.now()
        try { await savePhoneAppSnapshot('mail', context.ownerUid, context.charId, snapshot) } catch (e) { console.warn('mail snapshot save failed', e) }
      }
      openPhoneMailDetailPage(email)
    })
  })
}

function openPhoneMailDetailPage(email) {
  const page = createPhoneAppPage('phone-app-mail-detail-page', 'Mail')
  const scroll = page.querySelector('.phone-app-scroll')
  const attachmentsHtml = email.attachments.length ? `
    <div class="phone-mail-attachments">
      ${email.attachments.map(a => `
        <span class="phone-mail-attachment">
          <i class="fa fa-paperclip"></i>${paEscHtml(a.name)}${a.size ? `<span class="phone-mail-attachment-size">${paEscHtml(a.size)}</span>` : ''}
        </span>
      `).join('')}
    </div>` : ''
  scroll.innerHTML = `
    <div class="phone-mail-detail-subject">${paEscHtml(email.subject || '(无主题)')}${email.spam ? '<span class="phone-mail-spam-tag">垃圾邮件</span>' : ''}</div>
    <div class="phone-mail-detail-sender">
      ${buildPhoneMailAvatarHTML(email.sender)}
      <span class="phone-mail-detail-sender-main">
        <span class="phone-mail-detail-sender-name">${paEscHtml(email.sender || '(未知发件人)')}</span>
        <span class="phone-mail-detail-sender-address">${paEscHtml(email.address || '')}</span>
      </span>
      <span class="phone-mail-detail-time">${paEscHtml(email.time || '')}</span>
    </div>
    <div class="phone-mail-detail-body">${paEscHtml(email.body || '')}</div>
    ${attachmentsHtml}
  `
  window.openPage(page)
}

// ===== 主屏入口分发 =====

// ===== 日程页面 =====

async function renderPhoneSchedulePage(scroll, context) {
  const snapshot = await getPhoneAppSnapshot('schedule', context.ownerUid, context.charId)
  const days = snapshot?.data?.days || []
  let real = []
  try {
    const rec = await db.config.get('charSchedule')
    real = (rec?.value?.events || []).filter(e => String(e.charId) === String(context.charId) &&
      e.status !== 'cancelled' && e.endAt > Date.now() - 86400000)
      .sort((a, b) => a.startAt - b.startAt)
  } catch (_) {}
  const phaseLabel = e => {
    const now = Date.now()
    if (e.status === 'done') return '已结束'
    if (now < e.startAt) return '稍后'
    if (now < e.endAt) return '进行中'
    return '待确认'
  }
  const weekday = date => '周' + '日一二三四五六'[new Date(date + 'T00:00:00').getDay()]
  const todayKey = paDateKey(Date.now())

  const realHTML = real.length
    ? real.map(e => `
        <div class="phone-sch-item">
          <div class="phone-sch-time">${paEscHtml(paFmtMonthDayTime(e.startAt))}<br>${paEscHtml(paFmtMonthDayTime(e.endAt))}</div>
          <div class="phone-sch-main">
            <div class="phone-sch-title">${paEscHtml(e.title)}<span class="phone-sch-tag">${phaseLabel(e)}</span></div>
          </div>
        </div>`).join('')
    : '<div class="phone-sch-empty">聊天里还没有他提过的安排</div>'

  const daysHTML = days.length
    ? days.map(d => `
        <div class="phone-sch-card${d.date === todayKey ? ' is-today' : ''}">
          <div class="phone-sch-date"><span>${paEscHtml(d.date.slice(5))} ${weekday(d.date)}${d.date === todayKey ? '（今天）' : ''}</span>${d.off ? '<span class="phone-sch-tag">休息</span>' : ''}</div>
          ${d.items.map(it => `
            <div class="phone-sch-item">
              <div class="phone-sch-time">${paEscHtml(it.start)}${it.end ? ' – ' + paEscHtml(it.end) : ''}</div>
              <div class="phone-sch-main">
                <div class="phone-sch-title">${paEscHtml(it.title)}</div>
                ${(it.place || it.note) ? `<div class="phone-sch-sub">${paEscHtml([it.place, it.note].filter(Boolean).join('｜'))}</div>` : ''}
              </div>
            </div>`).join('')}
        </div>`).join('')
    : '<div class="phone-sch-empty">还没有生成排班表</div>'

  scroll.innerHTML = `
    <div class="phone-app-section-title">聊天里提到的安排</div>
    <div class="phone-sch-card">${realHTML}</div>
    <div class="phone-app-section-title">排班表（模拟，会参考上面的安排）</div>
    ${daysHTML}
    <button class="phone-sch-gen" type="button">${days.length ? '重新生成排班表' : '生成排班表'}</button>
    <div class="phone-sch-hint">点击会调用一次 AI；重新生成会覆盖现有的排班表，不会影响聊天里提到的安排。</div>
  `
  const btn = scroll.querySelector('.phone-sch-gen')
  btn.addEventListener('click', async () => {
    if (btn.disabled) return
    btn.disabled = true
    const old = btn.textContent
    btn.textContent = '生成中…'
    try {
      await generatePhoneAppSnapshot('schedule', context.ownerUid, context.charId)
      await renderPhoneSchedulePage(scroll, context)
    } catch (e) {
      window.toast?.(e.message || '生成失败，请重试')
      btn.disabled = false
      btn.textContent = old
    }
  })
}

async function openPhoneSchedulePage(context) {
  const page = createPhoneAppPage('phone-app-schedule-page', '日程')
  await renderPhoneSchedulePage(page.querySelector('.phone-app-scroll'), context)
  window.openPage(page)
}

const PHONE_GEN_APP_OPENERS = {
  browser: openPhoneBrowserPage,
  notes: openPhoneNotesPage,
  photos: openPhonePhotosPage,
  'game-center': openPhoneGameCenterPage,
  privacy: openPhonePrivacyPage,
  mail: openPhoneMailPage,
  schedule: openPhoneSchedulePage
}

async function openPhoneAppPage(appId, context) {
  const opener = PHONE_GEN_APP_OPENERS[appId]
  if (!opener || !context?.ownerUid || !context?.charId) return
  await opener(context)
}

window.openPhoneAppPage = openPhoneAppPage
