# 奶蛙快跑

奶蛙像素二维跑酷，手机触控和电脑键盘均可操作。游戏、图片和音效全部为静态文件，可完整部署到 GitHub Pages，无需数据库和个人电脑持续运行。

## 功能

- 空格 / 上方向键 / W 跳跃，下方向键 / S 按住下蹲，P 暂停。
- 手机独立跳跃、下蹲按钮，切后台自动暂停。
- 逐渐加速，有速度上限；按游玩时长计分。
- 个人最高分和最近 30 局保存在当前浏览器 localStorage；无排行榜、云端 API、昵称或地理位置采集。
- 换设备、换域名或清除浏览器数据不会保留成绩；存储受限时仍可玩，页面会提示成绩仅暂存。

## 发布与检查

修改 public/play 后运行：

```sh
node --check public/play/game.js
node scripts/check-game.mjs
node scripts/build-pages.mjs
```

将 docs 一同提交到 main，GitHub Pages 选择 Deploy from a branch → main → /docs。只发布 docs 中的游戏静态文件。仓库其余目录为早期开发模板，不参与 Pages 部署。

## 素材

- 奶蛙像素动画：[Maple498/nai-wa-codex-pet](https://github.com/Maple498/nai-wa-codex-pet)，CC BY 4.0；使用裁帧、缩放与下蹲变形，完整授权位于 assets/NAIWA-LICENSE.md。
- [Kenney Pixel Platformer](https://kenney.nl/assets/pixel-platformer)、[Digital Audio](https://kenney.nl/assets/digital-audio)，CC0，附授权文本。
- 奶蛙为网络迷因二创，非官方游戏；动画授权不代表授予原型角色的一切权利。

## 在线游玩

[打开奶蛙快跑](https://menglvxinianhua.github.io/naiwa-run/)


## 新玩法与手机适配

- 跳起收集石头上方的星星，蹲下收集飞鸟下方的星星；每颗 +25 分。
- 每收集 5 颗星获得一次护盾，最多保留一个；抵挡撞击后短暂无敌。
- 每连续躲过 5 个障碍 +50 分；护盾被消耗时连续计数重置。
- 每 30 秒在晨光、落日和夜跑场景间切换。
- 手机图形按钮无可选择文字，屏蔽长按菜单；画布等比例显示，速度按可见距离适配。
- 新机制检查：node scripts/check-runner.mjs。

