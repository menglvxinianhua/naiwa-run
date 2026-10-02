# 奶蛙快跑

奶蛙像素二维跑酷，手机触控和电脑键盘均可操作。

## 功能
- 空格 / 上方向键 / W 跳跃，下方向键 / S 按住下蹲，P 暂停。
- 手机独立跳跃、下蹲按钮；切后台自动暂停。
- 逐渐加速，有速度上限；按游玩时长计分。
- 托管 D1 保存昵称、最高分和历史，排行榜展示各玩家最高分前 20 名。
- HttpOnly Cookie 识别当前浏览器；不采集地理位置，换设备不自动同步。
- 云端不可用时仍可练习；提交失败可重试。

## 运行
需要 Node.js 22.13 或更新。

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_rare_brood.sql
npm run dev
```

仅初始化空的本地数据库时执行上述迁移。生产部署通过 Sites 托管 Worker 和 D1，不需要个人电脑保持开机。GitHub 仅存源码；GitHub Pages 的纯静态托管不能独立提供本项目云端成绩 API。

## 检查
```sh
node scripts/check-game.mjs
node --check public/play/game.js
npx tsc --noEmit
```

娱乐排行榜验证服务器计时与单局提交，不是强防作弊竞技榜。

## 素材
- 奶蛙像素动画：[Maple498/nai-wa-codex-pet](https://github.com/Maple498/nai-wa-codex-pet)，CC BY 4.0；游戏使用裁帧、缩放和下蹲变形。完整授权保存在 public/play/assets/NAIWA-LICENSE.md。
- [Kenney Pixel Platformer](https://kenney.nl/assets/pixel-platformer)、[Digital Audio](https://kenney.nl/assets/digital-audio)，CC0，附授权文本。
- 奶蛙形象为网络迷因二创，非官方游戏。上述动画授权不代表授予原型角色的一切权利。

## 验证

构建、类型检查、物理逻辑及本地成绩 API 检查通过。API 检查涵盖昵称校验、跨站提交拦截、时间校验、成绩保存、重复提交和历史读取。

```sh
node scripts/check-api.mjs http://127.0.0.1:5173
```

下蹲使用低头抱肚、收腿姿势，含 85 毫秒下沉、120 毫秒起身过渡。浏览器视觉与真机测试仍需补充；可选 WebMCP 只读工具尚未在支持的浏览器验证。

## 部署状态

源码托管于 GitHub。公网游戏与云端排行榜尚未部署成功；当前 Sites 项目访问返回 NOT_FOUND，需要恢复对应账号的项目访问后发布。仓库内不包含玩家数据或登录凭据。
