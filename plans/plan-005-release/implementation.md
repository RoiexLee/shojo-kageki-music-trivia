# plan-005 实现纪要：本地交付文档与生产预览

- 实现者：orchestrator
- 日期：2026-10-26
- 基线：`fa791ca`（plan-004 已通过独立实现评阅并提交）

## 实际改动

- 重写根 `README.md`，给出真实 Node/ffmpeg 前置、安装、资源生成与 verify、开发服务器、生产预览、故障排查、玩法矩阵、曲库扩充和版权边界。
- 更新 `tools/prepare-audio/README.md`，记录歌词 JSON、8 行阈值、LRC 指纹和 `--verify` 覆盖。
- 更新 `plans/README.md`，列出 plan-001 至 plan-005 的流水线状态和提交链。
- 未新增或修改 `music/`，未提交 `apps/web/public/assets/`、`dist/` 或 node_modules。

## 自测与生产证据

- `npm test`：web 29、shared 8、prepare-audio 26，共 63 项通过。
- `npm run build`：TypeScript 与 Vite 构建通过。
- `npm run assets -- --verify`：10 首 × 5 片段、封面、歌词结构与 LRC 指纹通过。
- `npm run preview --workspace apps/web -- --host 127.0.0.1 --port 4173 --strictPort` 启动成功；生产预览首页、歌词简单模式和混合困难模式均在内置浏览器打开并完成。
- 生产资源 HTTP HEAD：官方主题图、manifest、MP3、封面和歌词均为 200；结算页复制成绩和 PNG 下载已验证。

## 偏差与限制

- README 推荐 Node 20.19+ 或 22.12+，因为当前 Vite 版本的实际 engine 要求高于根 package 的宽松声明。
- 本计划不扩充歌曲，不人工试听校准默认 72 秒副歌起点；这些由后续曲库维护承担。
- 生产预览证据覆盖了完整功能流程，细致桌面/手机视觉证据和全矩阵整局已记录在 plan-004 纪要。
