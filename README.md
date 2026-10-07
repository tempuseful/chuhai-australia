# 出海国别简报

面向中国企业的出海国别简报，纯静态网站，Cloudflare Pages 部署（构建命令留空，输出目录 `/`）。

## 结构

- `index.html`：门户首页（由 build.py 生成）
- `<国家>/index.html`：各国页面（由 build.py 生成），目前有 `australia/`、`uae/`
- `content/<国家>.html`：该国正文；`content/<国家>.json`：名称、导航、行情带、贸易图数据、动态分类、首页卡片
- `src/`：共用样式、脚本和动态栏目片段
- `build.py`：改了 `content/` 或 `src/` 后运行 `python3 build.py`，再提交生成的文件
- `news.json`：澳大利亚的动态数据（保留在根目录，供每日定时任务写入）；其他国家在 `<国家>/news.json`
- `functions/_middleware.js`：中国大陆 IP 请求任何 `news.json` 时只返回 `cn: true` 的条目
- `fonts/`：自托管字体

## 动态条目字段

sector（各国 `content/<国家>.json` 里 `sect` 的键）、kind（政策 / 新闻）、title、source、url、date、added、cn（来源在中国大陆能否访问）
