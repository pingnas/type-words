# TypeWords - 英语打字练习应用

基于 [TypeWords](https://github.com/zyronon/TypeWords/tree/a9b81d3164aa2e336c5f6370e2299b8dd6c876ba) 修改和优化。

一个功能强大的英语学习打字练习工具，支持单词和文章练习，内置多种词典和经典文章，帮助你在打字的同时提升英语水平。

## 修改内容

- 删除广告
- 删除动态加载远程脚本,因为它会获取用户隐私调接口等(如果发现没删干净可以提pr或者issues)。
- 添加`github pages`适配

## 本地开发

```bash
npm install

npm run dev
```

## 自动部署 GitHub Pages

1. `fork` 本仓库 或者 新建个仓库，名字必须叫 `type-words`
2. 如果需要换名，需要全局搜索 `type-words` 替换为你的仓库名
3. 仓库 `Settings > Pages > Source > GitHub Actions > Save` 设置显示`GitHub Pages`
4. 去 `Actions` 运行一次 `deploy-pages.yml`
5. 部署完成后访问：`https://你的用户名.github.io/type-words/`

