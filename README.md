# 出海澳洲

面向中国企业的赴澳经营简报，纯静态网站。

- `index.html`：页面本身
- `news.json`：“赛道动态”栏目的数据，每日自动更新。每条包含 sector（energy / ecom / minerals / agri / ev / infra）、kind（政策 / 新闻）、title、source、url、date、added
- `fonts/`：自托管字体（Noto Serif SC 900、IBM Plex Mono），不依赖境外字体服务

部署：Cloudflare Pages 连接本仓库，构建命令留空，输出目录填 `/`。
