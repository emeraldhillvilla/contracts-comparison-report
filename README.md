# 翡翠山项目物业竞标对比报告

对翡翠山 1-2 期别墅小区五家候选物业服务企业（碧桂园、万科、时代、雅居乐／雅生活、绿维）提交的合同与服务方案，逐项比对并给出评分与依据。

- **在线查看**：https://emeraldhillvilla.github.io/contracts-comparison-report/
- **PDF 版**：`files/翡翠山物业竞标对比报告.pdf`
- **官方公示与原始材料**：https://emeraldhillvilla.github.io/public-notice-and-competing-contracts/

## 对比维度

报价与能耗口径 · 品牌实力 · 整改投入的合同化程度 · 服务标准的可考核性 · 公共收益分成 · 智慧社区建设 · 签署完整性。

每条结论均标注出处（文件名称、页码、条款号），可逐条回溯核验。

## 说明

- 本报告由小区业主志愿者整理，**属于业主方的自主分析，不是官方文件**。
- 报告所引用的合同与服务方案，以山河社区居民委员会公示的附件原件为准。
- 如报告结论与正式文件或街镇办（社区居委会）口径不一致，**以后者为准**。
- 页面已设置 `noindex, nofollow`，不进入搜索引擎收录。

## 目录结构

```
index.html                            报告正文（含图表）
assets/charts.js                      图表配置与数据
assets/share-card.jpg                 分享卡片缩略图
_shared/js/echarts.min.js             图表库（本地引入）
files/翡翠山物业竞标对比报告.pdf       报告的 PDF 版本
```

## 部署

纯静态页面，由 GitHub Pages 发布：

- 发布分支 `main`，目录 `/`（根目录）
- `.nojekyll` 关闭 Jekyll 处理

## 更新方式

修改 `index.html` 或替换 `assets/`、`files/` 下的文件后：

```bash
git add -A
git commit -m "更新报告"
git push
```

推送后 1—2 分钟内自动重新发布。
