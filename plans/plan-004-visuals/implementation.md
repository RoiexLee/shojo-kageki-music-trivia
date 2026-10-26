# plan-004 实现纪要：舞台视觉、官方素材与浏览器验收

- 实现者：orchestrator
- 日期：2026-10-26
- 基线：`99f8ecb`（plan-003 已通过独立实现评阅并提交）

## 实际改动

- 新增 `apps/web/public/theme/logo.png`、`cast.png`、`stage.png`，均来自官方站点，来源及本地用途写入 `NOTICE.md` 与调研报告。
- 新增 `Brand`、`Footer`、`Arrow` 小组件；首页改为舞台节目单布局，接入官方 logo/九人横幅、模式选择、难度说明和加载/错误状态。
- 重做 `styles.css`：集中定义深酒红、象牙白、香槟金、玫红及反馈颜色；桌面双栏 hero、移动单栏；答题选项完整换行、焦点轮廓、44px 级控件、减少动态效果。
- 答题页补充暂停/继续、从头重放、真实媒体状态、失败片段提示/重试、换题停止、焦点移到题号；结算页展示模式/难度、seed、最佳成绩、封面墙和完整歌名。
- 新增 `core/share.ts` 纯函数和测试；结算页复制文字成绩、Canvas PNG 下载，失败时显示恢复提示，不上传数据、不含二维码占位。
- 音频队列增加暂停/继续状态并添加实际位置保持测试。
- 文档补充官方素材直链、参考玩法差异、LRC 产物与 verify 说明。

## 设计证据与有意偏差

Image Gen 概念证据为仓库外 `C:/Users/roiexlee/.codex/generated_images/01a176b0-36eb-7890-93fa-2fd1572bf888/exec-869bbd07-16ad-4a9d-825f-8c78bb37f8d8.png`，已在实现前查看。实现保留其信息顺序和布局：顶部 logo、左侧大标题、右侧视觉、四种模式、难度与开始操作；颜色 token、类型层级和空间也按概念落地。概念中的 AI 角色/帷幕图没有作为产品素材，改用查证的官方九人横幅与官方 logo，属于明确的版权与真实性偏差；没有声称像素级一致。

视觉走查记录：

1. 文案：桌面和手机均显示“听见旋律，再赴舞台。”、四模式和真实曲库数量；概念主标题及操作层级保持。
2. 布局：1280×900 为双栏 hero、四按钮一行和水平设置条；375×812 自动切单栏、模式二列、答案一列。
3. 字体层级：标题使用衬线 fallback，控制和说明使用系统无衬线；答题/结算标题及按钮具备独立字号。
4. 色彩：页面实际为深酒红 #170f18、金色 #d6b579、玫红 #bb3451、象牙白 #f6ecdc；语义成功/错误色集中 token。
5. 媒体：官方 logo、九人横幅和舞台背景文件本地加载；生产预览的 manifest、MP3、封面、歌词均返回 HTTP 200。
6. 响应式：375px 真实浏览器 `document.documentElement.clientWidth=360`、`scrollWidth=360`，无横向溢出；长曲名在答题和结算中使用 `overflow-wrap:anywhere`。
7. 动效与可访问性：`prefers-reduced-motion` 禁止动画；按钮焦点采用金色可见轮廓，题号标题获得焦点，选项使用 pressed/disabled 和 live status。

## 自测与浏览器证据

- `npm test`：web 29、shared 8、prepare-audio 26，共 63 项全绿。
- `npm run build`：TypeScript 与 Vite 构建通过；产物包含 theme 图片和 lyrics 资源。
- `npm run assets -- --verify`：10 首 × 5 片段、封面、歌词结构和 LRC 指纹通过。
- 开发预览：`http://localhost:5176/?seed=42`；生产预览：`http://127.0.0.1:4173/?seed=42`。
- 内置浏览器新页完成四模式 × 三难度各 10 题到“本场谢幕”；混合困难实际验证选满 3 项、确认与错选答案反馈；日志无新 error/warn。
- 生产预览资源 HEAD：`theme/cast.png`、`theme/logo.png`、`assets/manifest.json`、`assets/audio/star-divine/intro-10.mp3`、`assets/covers/star-divine.jpg`、`assets/lyrics/star-divine.json` 全部 HTTP 200。
- 手机浏览器：375×812 视口，首页和歌词题面截图无横向溢出；桌面浏览器：1280×900 视口首页截图正常。
- 结算页点击“复制成绩”显示成功状态；“下载成绩图”实际下载 `starlight-mix-42.png`。

## 与计划偏差及剩余风险

- 计划列出的暂停/重放已实现；没有增加外部图标或动画依赖。
- 浏览器自动播放是否被系统策略拦截取决于浏览器环境；页面保留点击播放和重试入口。
- 当前评分、歌词抽取和资源结构只覆盖本地提供的 10 首歌曲；未人工试听校准每首 `chorusStartSec`，计划 005 文档会继续说明该限制。
- 主题图片版权仍属于原权利方，仓库只适合本地学习，禁止公开分发。
