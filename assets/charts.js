/* 翡翠山项目物业竞标对比报告图表 */
(function () {
  var style = getComputedStyle(document.documentElement);
  function cssVar(name, fallback) {
    var v = style.getPropertyValue(name).trim();
    return v || fallback;
  }
  var accent = cssVar('--accent', '#0e7a55');
  var accent2 = cssVar('--accent2', '#b3802a');
  var ink = cssVar('--ink', '#1f2a26');
  var muted = cssVar('--muted', '#5d6f66');
  var rule = cssVar('--rule', '#dce5df');
  var danger = '#b3402e';
  var ok = '#1e7e46';
  var CN_FONT = '"Noto Sans CJK SC","WenQuanYi Micro Hei","Microsoft YaHei","PingFang SC",sans-serif';

  var companies = ['碧桂园服务', '万科物业', '时代邻里', '雅生活', '绿维物业'];
  /* 企业品牌色板（与对比表表头一致，高区分度：蓝/红/橙/绿/紫） */
  var coColors = ['#1d5fbf', '#c8102e', '#e8890c', '#2e9e5b', '#7b5ea7'];

  function baseTooltip() {
    return {
      trigger: 'item',
      appendToBody: true,
      textStyle: { fontFamily: CN_FONT, fontSize: 12.5 },
      backgroundColor: 'rgba(255,255,255,0.97)',
      borderColor: rule,
      extraCssText: 'box-shadow:0 4px 16px rgba(0,0,0,0.12);border-radius:8px;max-width:320px;white-space:normal;'
    };
  }

  function baseAxis(extra) {
    return Object.assign({
      axisLine: { lineStyle: { color: rule } },
      axisTick: { show: false },
      axisLabel: { color: muted, fontFamily: CN_FONT, fontSize: 12 },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    }, extra || {});
  }

  /* 通用横向柱状图（支持按好坏排序：opts.sort='asc' 越小越上 / 'desc' 越大越上，null 排最后） */
  function mkBar(domId, data, unit, noteMap, labelMap, colorFn, opts) {
    var el = document.getElementById(domId);
    if (!el) return;
    var mobile = window.innerWidth < 700;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    var yData = companies.slice();
    var d = data.slice();
    if (opts && opts.sort) {
      var idx = d.map(function (_, i) { return i; });
      idx.sort(function (a, b) {
        var na = (d[a] === null || d[a] === undefined);
        var nb = (d[b] === null || d[b] === undefined);
        if (na && nb) return a - b;
        if (na) return 1;
        if (nb) return -1;
        return opts.sort === 'asc' ? d[a] - d[b] : d[b] - d[a];
      });
      yData = idx.map(function (i) { return companies[i]; });
      d = idx.map(function (i) { return data[i]; });
    }
    chart.setOption({
      animation: false,
      tooltip: Object.assign(baseTooltip(), {
        formatter: function (p) {
          var note = noteMap && noteMap[p.name] ? '<br/><span style="color:#888;font-size:12px">' + noteMap[p.name] + '</span>' : '';
          var v = (p.value === null || p.value === undefined) ? '未提供' : p.value + ' ' + unit;
          return '<b>' + p.name + '</b><br/>' + v + note;
        }
      }),
      grid: { left: 8, right: (mobile ? 72 : 90), top: 26, bottom: 8, containLabel: true },
      xAxis: baseAxis({ type: 'value', splitLine: { lineStyle: { color: rule, type: 'dashed' } } }),
      yAxis: baseAxis({
        type: 'category', inverse: true, data: yData,
        splitLine: { show: false },
        axisLabel: (opts && opts.nullMark) ? {
          color: ink, fontFamily: CN_FONT, fontSize: (mobile ? 12 : 13), fontWeight: 600,
          formatter: function (val) {
            var i = yData.indexOf(val);
            return (d[i] === null) ? '{mark|✗ }' + val : val;
          },
          rich: { mark: { color: danger, fontFamily: CN_FONT, fontWeight: 900, fontSize: (mobile ? 12 : 13) } }
        } : { color: ink, fontFamily: CN_FONT, fontSize: (mobile ? 12 : 13), fontWeight: 600 }
      }),
      series: [{
        type: 'bar',
        barWidth: 22,
        data: d.map(function (v, i) {
          var col = v === null ? 'rgba(93,111,102,0.18)' : (colorFn ? colorFn(yData[i], v, i) : coColors[companies.indexOf(yData[i])]);
          return {
            value: v,
            itemStyle: { color: col, borderRadius: [0, 6, 6, 0] },
            label: {
              show: true, position: 'right', fontFamily: CN_FONT, fontSize: (mobile ? 11 : 12), fontWeight: 700,
              color: v === null ? muted : ink,
              formatter: function () {
                if (v === null) return (opts && opts.nullLabel) ? opts.nullLabel : '未提供 / 未约定';
                if (labelMap && labelMap[yData[i]]) return labelMap[yData[i]];
                return v + ' ' + unit;
              }
            }
          };
        })
      }]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  }

  /* 图1 业主车辆月停车费：已改为 HTML 状态条（.park-strip），不再用横向柱状图表达（避免"柱子越长越像最优"误导） */

  /* 图2 物业费真实持有成本（堆叠柱：实心=名义物业费，虚线/浅色=能耗折算 0.5 元/㎡/月） */
  (function () {
    var el = document.getElementById('chart-price');
    if (!el) return;
    var mobile = window.innerWidth < 700;
    var chart = echarts.init(el, null, { renderer: 'svg' });

    /* 排序：含能耗的两家在上（时代 2.8、碧桂园 2.88），不含能耗的三家在下（绿维 3.0、万科 3.7、雅生活 3.8） */
    var order = ['时代邻里', '碧桂园服务', '绿维物业', '万科物业', '雅生活'];
    var base = { '时代邻里': 2.8, '碧桂园服务': 2.88, '绿维物业': 2.5, '万科物业': 3.2, '雅生活': 3.8 };
    var energy = { '时代邻里': 0, '碧桂园服务': 0, '绿维物业': 0.5, '万科物业': 0.5, '雅生活': 0 };
    var note = {
      '时代邻里': '含公共能耗：附件三第一种"物业费已包含公共能耗分摊费用"〔时代合同 p17·附件三；p7·第十二条〕',
      '碧桂园服务': '合同明写"含公共能耗费用"〔碧桂园合同 p5·第三条〕',
      '绿维物业': '合同明写"不含公共能耗费"，能耗按 0.5 元/㎡/月折算〔绿维汇编 p7·第九条〕',
      '万科物业': '不含公共能耗，成本构成 11 项无公共水电费，能耗按 0.5 元/㎡/月折算〔万科合同 p9·第十七条〕',
      '雅生活': '意向价 3.8 元（住宅），能耗口径矛盾：方案"全额承担" vs 合同"分摊水电费"〔雅生活报名 p205；p212 vs p20〕'
    };
    function segColor(n) {
      if (n === '时代邻里' || n === '碧桂园服务') return ok;
      if (n === '雅生活') return accent2;
      return danger;
    }
    var baseData = order.map(function (n) { return base[n]; });
    var energyData = order.map(function (n) { return energy[n]; });

    chart.setOption({
      animation: false,
      tooltip: Object.assign(baseTooltip(), {
        formatter: function (p) {
          var n = order[p.dataIndex];
          var total = base[n] + energy[n];
          var t = (total % 1 === 0) ? total : total.toFixed(2);
          var seg = energy[n] > 0 ? '<br/>能耗折算：＋' + energy[n] + ' 元/㎡/月' : '';
          return '<b>' + n + '</b><br/>真实持有成本：<b>' + t + '</b> 元/㎡/月<br/>名义物业费：' + base[n] + ' 元/㎡/月' + seg + '<br/><span style="color:#888;font-size:12px">' + note[n] + '</span>';
        }
      }),
      grid: { left: 8, right: (mobile ? 82 : 118), top: 26, bottom: 8, containLabel: true },
      xAxis: baseAxis({ type: 'value', splitLine: { lineStyle: { color: rule, type: 'dashed' } } }),
      yAxis: baseAxis({
        type: 'category', inverse: true, data: order, splitLine: { show: false },
        axisLabel: { color: ink, fontFamily: CN_FONT, fontSize: (mobile ? 12 : 13), fontWeight: 600 }
      }),
      series: [
        {
          name: '名义物业费', type: 'bar', stack: 'cost', barWidth: 20,
          data: baseData.map(function (v, i) {
            return { value: v, itemStyle: { color: segColor(order[i]) } };
          }),
          emphasis: { disabled: true }
        },
        {
          name: '能耗折算', type: 'bar', stack: 'cost', barWidth: 20,
          data: energyData.map(function (v, i) {
            return {
              value: v,
              itemStyle: { color: 'rgba(179,64,46,0.28)', borderColor: danger, borderWidth: 1, borderType: 'dashed', borderRadius: [0, 6, 6, 0] },
              label: {
                show: true, position: 'right', fontFamily: CN_FONT, fontSize: (mobile ? 11 : 12), fontWeight: 700, color: ink,
                formatter: function (p) {
                  var n = order[p.dataIndex];
                  var total = base[n] + energy[n];
                  var t = (total % 1 === 0) ? total : total.toFixed(2);
                  if (energy[n] > 0) return t + '（' + base[n] + '＋0.5 能耗）';
                  if (n === '雅生活') return t + '（意向价，能耗存疑）';
                  return t + '（含能耗）';
                }
              }
            };
          }),
          emphasis: { disabled: true }
        }
      ]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  })();

  /* 图3 公共收益分配（区分"可支配"与"定向"） */
  mkBar('chart-revenue', [80, 70, 70, 70, null], '%', {
    '碧桂园服务': '物业提 20% 成本，剩余定向用于小区维修更新改造（80% 为推算值，业主不可支配）〔碧桂园合同 p7·第十三条〕',
    '万科物业': '物业提 30% 成本，70% 归业主（可支配），每季度公示〔万科合同 p11·第二十七条〕',
    '时代邻里': '合同口径 70% 归业主；但方案写"30% 归业主、70% 归物业"，方向相反需澄清〔时代合同 p10 vs 时代方案 p53〕',
    '绿维物业': '未约定比例，"其余部分补充物业服务费"〔绿维汇编 p9·第十九条〕',
    '雅生活': '正本 70% 归业主；方案"全额上缴"、夹带模板"50% 归乙方"，三种口径矛盾〔雅生活报名 p18/p212/p194〕'
  }, {
    '碧桂园服务': '80%（定向用于小区）'
  }, null, { sort: 'desc' });

  /* 图4 前期投入（堆叠柱：实心=150 万保底写进合同，虚线=250 万达标反哺） */
  (function () {
    var el = document.getElementById('chart-invest');
    if (!el) return;
    var mobile = window.innerWidth < 700;
    var chart = echarts.init(el, null, { renderer: 'svg' });

    var order = ['碧桂园服务', '万科物业', '时代邻里', '绿维物业', '雅生活'];
    var base = { '碧桂园服务': 150, '万科物业': 0, '时代邻里': 0, '绿维物业': 0, '雅生活': 0 };
    var extra = { '碧桂园服务': 250, '万科物业': 0, '时代邻里': 0, '绿维物业': 0, '雅生活': 0 };
    var note = {
      '碧桂园服务': '保底 150 万写进合同＋收缴率达标最高反哺 250 万〔碧桂园合同 p18·附件三〕',
      '万科物业': '无偿整改＋设备投入（闸机 6 台等）均未写金额；智慧社区 10 万/年为持续订阅费，不算前期投入〔万科合同 p32-33·附件七〕',
      '时代邻里': '承诺自有资金无偿投入但未写金额〔时代合同 p10·第二十三条 13 款〕',
      '绿维物业': '合同未提及（意向函有改造承诺但无金额）〔绿维汇编 p103〕',
      '雅生活': '未提及'
    };
    var baseData = order.map(function (n) { return base[n]; });
    var extraData = order.map(function (n) { return extra[n]; });

    chart.setOption({
      animation: false,
      tooltip: Object.assign(baseTooltip(), {
        formatter: function (p) {
          var n = order[p.dataIndex];
          var total = base[n] + extra[n];
          if (total === 0) return '<b>' + n + '</b><br/>未约定前期投入金额<br/><span style="color:#888;font-size:12px">' + note[n] + '</span>';
          return '<b>' + n + '</b><br/>总投入：<b>' + total + '</b> 万元<br/>保底（写进合同）：' + base[n] + ' 万元<br/>达标反哺：' + extra[n] + ' 万元<br/><span style="color:#888;font-size:12px">' + note[n] + '</span>';
        }
      }),
      grid: { left: 8, right: (mobile ? 82 : 118), top: 26, bottom: 8, containLabel: true },
      xAxis: baseAxis({ type: 'value', splitLine: { lineStyle: { color: rule, type: 'dashed' } } }),
      yAxis: baseAxis({
        type: 'category', inverse: true, data: order, splitLine: { show: false },
        axisLabel: { color: ink, fontFamily: CN_FONT, fontSize: (mobile ? 12 : 13), fontWeight: 600 }
      }),
      series: [
        {
          name: '保底投入', type: 'bar', stack: 'invest', barWidth: 20,
          data: baseData.map(function (v, i) {
            return { value: v, itemStyle: { color: v > 0 ? ok : 'rgba(93,111,102,0.18)' } };
          }),
          emphasis: { disabled: true }
        },
        {
          name: '达标反哺', type: 'bar', stack: 'invest', barWidth: 20,
          data: extraData.map(function (v, i) {
            return {
              value: v,
              itemStyle: { color: 'rgba(30,126,70,0.28)', borderColor: ok, borderWidth: 1, borderType: 'dashed', borderRadius: [0, 6, 6, 0] },
              label: {
                show: true, position: 'right', fontFamily: CN_FONT, fontSize: (mobile ? 11 : 12), fontWeight: 700, color: ink,
                formatter: function (p) {
                  var n = order[p.dataIndex];
                  var total = base[n] + extra[n];
                  if (total === 0) return '未约定 / 未写金额';
                  return total + '（' + base[n] + ' 保底＋' + extra[n] + ' 反哺）';
                }
              }
            };
          }),
          emphasis: { disabled: true }
        }
      ]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  })();

  /* 图5 人员编制 */
  mkBar('chart-staff', [53, null, 48, null, null], '人', {
    '碧桂园服务': '53 人＋逐岗任职要求〔碧桂园合同 p17·附件二；p19·附件四〕',
    '万科物业': '未提供本项目人员编制',
    '时代邻里': '42+6 人（负责人 1/环境绿化 15/工程 3/客服 3/秩序 20/后勤 5–6）〔时代方案 p52〕',
    '绿维物业': '未提供本项目人员编制',
    '雅生活': '未提供总人数（管家配比 1:40-50 户）〔雅生活报名 p207〕'
  }, null, null, { sort: 'desc' });

  /* 图11 八维能力雷达图 */
  (function () {
    var el = document.getElementById('chart-radar');
    if (!el) return;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    var dims = ['物业费性价比', '品牌和实力', '整改投入', '服务标准', '合同规范性', '公共收益透明度', '智慧社区', '签署完整性'];  /* 按权重降序：20/15/15/15/15/10/5/5 */
    var scores = {
      '万科物业': [5, 8, 6, 9, 9, 9, 10, 8],
      '碧桂园服务': [8, 8, 10, 8, 8, 6, 9, 4],  /* ②品牌 8；⑤合同 8、⑦智慧 9 */
      '时代邻里': [9, 5, 5, 2, 7, 6, 7, 5],
      '雅生活': [1, 7, 2, 6, 3, 3, 6, 4],  /* ②品牌 7：上市百强但母公司雅居乐清盘呈请 */
      '绿维物业': [7, 1, 2, 2, 3, 1, 2, 2]  /* ②品牌 1：仅第三方认证、无别墅业绩 */
    };
    var order = ['碧桂园服务', '万科物业', '时代邻里', '雅生活', '绿维物业'];  /* 按排名：碧1 万2 时3 雅4 绿5 */
    chart.setOption({
      animation: false,
      color: ['#1d5fbf', '#c8102e', '#e8890c', '#2e9e5b', '#7b5ea7'],
      tooltip: Object.assign(baseTooltip(), { trigger: 'item' }),
      legend: {
        bottom: 0, icon: 'roundRect', itemWidth: 14, itemHeight: 8,
        textStyle: { fontFamily: CN_FONT, fontSize: 12, color: ink }
      },
      radar: {
        indicator: dims.map(function (d) { return { name: d, max: 10 }; }),
        radius: '62%', center: ['50%', '50%'],
        axisName: { color: ink, fontFamily: CN_FONT, fontSize: 12 },
        splitLine: { lineStyle: { color: rule } },
        splitArea: { show: false },
        axisLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'radar',
        symbolSize: 3,
        data: order.map(function (name) {
          return {
            name: name,
            value: scores[name],
            lineStyle: { width: 2.5 }  /* 纯线条，不填色，更清晰 */
          };
        })
      }]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  })();

  /* 图6 业主逾期违约金（日利率 %） */
  mkBar('chart-penalty', [0.1, 0.05, 0.05, 0.1, 0.05], '%', {
    '碧桂园服务': '日 0.1%（年化约 36.5%）〔碧桂园合同 p12·第二十八条〕',
    '万科物业': '日 0.05%（万分之五，年化约 18%）〔万科合同 p9·第十九条〕',
    '时代邻里': '日 0.05%（0.5‰，年化约 18%）〔时代合同 p8·第十六条〕',
    '绿维物业': '日 0.05%（万分之五）〔绿维汇编 p7·第十一条〕',
    '雅生活': '日 0.1%（1‰，年化约 36.5%，与碧桂园并列最高）〔雅生活报名 p20·第二十五条〕'
  }, {
    '碧桂园服务': '0.1%（年化 36.5%）',
    '万科物业': '0.05%（年化 18%）',
    '时代邻里': '0.05%（0.5‰，年化约 18%）',
    '绿维物业': '0.05%（年化 18%）',
    '雅生活': '0.1%（1‰，年化约 36.5%）'
  }, function (name, v) { return v >= 0.1 ? danger : ok; }, { sort: 'asc' });

  /* 图7 常规报修/诉求响应时间（分钟） */
  mkBar('chart-response', [null, 20, 15, 30, 15], '分钟', {
    '碧桂园服务': '只写"规定时限内响应"，未给分钟数〔碧桂园合同 p27·附件六〕',
    '万科物业': '合同 20 分钟响应；紧急 3 分钟响应、15–30 分钟到场〔万科合同 p19·附件四〕',
    '时代邻里': '报修 15 分钟到场；管家 20 分钟响应〔时代方案 p40〕',
    '绿维物业': '报修 15 分钟到场、投诉 24 小时闭环〔绿维汇编 p516〕',
    '雅生活': '一般诉求 30 分钟响应；另承诺突发事件 2 分钟到场、紧急 15 分钟〔雅生活报名 p212〕'
  }, null, function (name, v) { return v === null ? muted : (v <= 15 ? ok : (v <= 20 ? accent2 : danger)); }, { sort: 'asc' });

  /* 图8 公共收益公示频率（次/年） */
  mkBar('chart-disclosure', [2, 4, 4, null, 4], '次/年', {
    '碧桂园服务': '每半年 1 次；另有专有账户＋年度预决算公示〔碧桂园合同 p7·第十三条〕',
    '万科物业': '每季度 1 次；另有每月数字化服务报告〔万科合同 p11·第二十七条；p19·附件四〕',
    '时代邻里': '每季度 1 次，退场全额转出〔时代合同 p10·第二十二条〕',
    '绿维物业': '意向函承诺每季度 1 次；合同仅"公布年度计划"〔绿维汇编 p103·意向函〕',
    '雅生活': '方案只写"定期公示"，未给频率〔雅生活报名 p212〕'
  }, null, function (name, v) { return v === null ? muted : (v >= 4 ? ok : accent2); }, { sort: 'desc' });

  /* 图9 18 项承诺状态热力总览 */
  (function () {
    var el = document.getElementById('chart-heatmap');
    if (!el) return;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    var dims = ['①物业费', '②收费模式', '③公共收益', '④账目公示', '⑤前期投入', '⑥人员编制',
      '⑦响应速度', '⑧服务频次', '⑨免费增值', '⑩满意度考核', '⑪违约金', '⑫期限续约',
      '⑬单方解约', '⑭维修边界', '⑮空置房', '⑯调价机制', '⑰装修保证金', '⑱签署盖章'];
    /* 值：2=有利 1=中性/有保留 0=需要注意 -1=未约定；列序同 companies */
    var M = [
      [2, 0, 2, 0, 0],   /* ①物业费 */
      [1, 1, 1, 1, 1],  /* ②收费模式（雅生活已勾选包干制，p14·第六条） */
      [0, 2, 0, 0, 0],   /* ③公共收益 */
      [2, 1, 1, 0, 0],   /* ④账目公示 */
      [2, 0, 1, -1, 0],  /* ⑤前期投入 */
      [2, -1, 2, -1, -1],/* ⑥人员编制 */
      [0, 2, 1, 2, 0],   /* ⑦响应速度：时代仅方案、绿维业绩合同，均未写进本项目合同 */
      [2, 2, 1, 1, 1],   /* ⑧服务频次 */
      [2, 1, 1, 0, 1],   /* ⑨免费增值：时代免费停车仅方案、绿维免费维修仅意向函 */
      [1, 1, 2, 1, 1],   /* ⑩满意度考核 */
      [0, 2, 2, 0, 2],   /* ⑪违约金：0.05%有利(万/时/绿)、0.1%注意(碧/雅) */
      [0, 1, 1, -1, 0],  /* ⑫期限续约 */
      [2, 0, 1, 0, 1],   /* ⑬单方解约 */
      [1, 0, 0, 0, 1],   /* ⑭维修边界 */
      [0, 1, 0, 0, 1],   /* ⑮空置房 */
      [2, 2, 2, -1, 0],  /* ⑯调价机制 */
      [2, 1, 2, 0, 1],   /* ⑰装修保证金 */
      [0, 2, 0, 0, -1]   /* ⑱签署盖章 */
    ];
    var labelMap = { '2': '有利', '1': '中性', '0': '注意', '-1': '未约定' };
    var data = [];
    M.forEach(function (row, yi) {
      row.forEach(function (v, xi) { data.push([xi, yi, v]); });
    });
    chart.setOption({
      animation: false,
      tooltip: Object.assign(baseTooltip(), {
        formatter: function (p) {
          return '<b>' + companies[p.value[0]] + '</b> · ' + dims[p.value[1]] + '<br/>状态：' + labelMap[String(p.value[2])] + '<br/><span style="color:#888;font-size:12px">依据见下方 18 项对比表第 ' + (p.value[1] + 1) + ' 行</span>';
        }
      }),
      grid: { left: 8, right: 16, top: 30, bottom: 8, containLabel: true },
      xAxis: baseAxis({
        type: 'category', data: companies, position: 'top',
        splitLine: { show: false }, splitArea: { show: false },
        axisLabel: { color: ink, fontFamily: CN_FONT, fontSize: 12.5, fontWeight: 700, interval: 0 }
      }),
      yAxis: baseAxis({
        type: 'category', data: dims, inverse: true,
        splitLine: { show: false }, splitArea: { show: false },
        axisLabel: { color: ink, fontFamily: CN_FONT, fontSize: 12, interval: 0 }
      }),
      visualMap: {
        type: 'piecewise', show: false,
        pieces: [
          { value: 2, color: 'rgba(30,126,70,0.85)' },
          { value: 1, color: 'rgba(30,126,70,0.3)' },
          { value: 0, color: 'rgba(179,64,46,0.75)' },
          { value: -1, color: 'rgba(93,111,102,0.22)' }
        ]
      },
      series: [{
        type: 'heatmap',
        data: data,
        label: {
          show: true, fontFamily: CN_FONT, fontSize: 10.5, fontWeight: 700,
          formatter: function (p) { return labelMap[String(p.value[2])]; },
          color: ink
        },
        itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 3 },
        emphasis: { disabled: true }
      }]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  })();

  /* 图12 综合得分（按排名降序） */
  (function () {
    var el = document.getElementById('chart-total');
    if (!el) return;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    var order = ['碧桂园服务', '万科物业', '时代邻里', '雅生活', '绿维物业'];  /* 排名：碧1 万2 时3 雅4 绿5 */
    var vals = { '碧桂园服务': 7.95, '万科物业': 7.60, '时代邻里': 5.85, '雅生活': 3.70, '绿维物业': 2.90 };

    chart.setOption({
      animation: false,
      tooltip: Object.assign(baseTooltip(), {
        formatter: function (p) {
          return '<b>' + p.name + '</b><br/>综合得分：' + p.value.toFixed(2) + ' 分';
        }
      }),
      grid: { left: 8, right: 20, top: 26, bottom: 8, containLabel: true },
      xAxis: baseAxis({ type: 'value', max: 10, splitNumber: 5 }),
      yAxis: baseAxis({
        type: 'category', inverse: true, data: order,
        splitLine: { show: false },
        axisLabel: { color: ink, fontFamily: CN_FONT, fontSize: 13, fontWeight: 600 }
      }),
      series: [{
        type: 'bar', barWidth: 22,
        data: order.map(function (name) {
          var v = vals[name];
          return {
            value: v,
            itemStyle: { color: coColors[companies.indexOf(name)], borderRadius: [0, 6, 6, 0] },
            label: { show: true, position: 'right', fontFamily: CN_FONT, fontSize: 12.5, fontWeight: 700, color: ink, formatter: v.toFixed(2) + ' 分' }
          };
        })
      }]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  })();

  /* 图10 六家物业费对比（含现物业金迪；独立数组，不影响图2） */
  (function () {
    var el = document.getElementById('chart-price6');
    if (!el) return;
    var mobile = window.innerWidth < 700;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    var names = ['金迪（现物业）', '碧桂园服务', '万科物业', '时代邻里', '雅生活', '绿维物业'];
    var vals = [3.8, 2.88, 3.2, 2.8, 3.8, 2.5];
    var labels = ['3.8 元（不含能耗 ✗）', '2.88 元（含能耗 ✓）', '3.2 元（不含能耗 ✗）', '2.8 元（含能耗 ✓）', '3.8 元（意向价，能耗存疑 ?）', '2.5 元（不含能耗 ✗）'];
    var cols = ['#6b7280', ok, danger, ok, accent2, danger];  /* 金迪灰＝现物业；其余按能耗口径：含=绿、不含=红、意向=琥珀 */
    chart.setOption({
      animation: false,
      tooltip: Object.assign(baseTooltip(), {
        formatter: function (p) {
          return '<b>' + p.name + '</b><br/>' + p.value + ' 元/㎡/月';
        }
      }),
      grid: { left: 8, right: (mobile ? 84 : 108), top: 26, bottom: 8, containLabel: true },
      xAxis: baseAxis({ type: 'value', splitLine: { lineStyle: { color: rule, type: 'dashed' } } }),
      yAxis: baseAxis({
        type: 'category', inverse: true, data: names,
        splitLine: { show: false },
        axisLabel: { color: ink, fontFamily: CN_FONT, fontSize: (mobile ? 12 : 13), fontWeight: 600 }
      }),
      series: [{
        type: 'bar', barWidth: 22,
        data: names.map(function (n, i) {
          return {
            value: vals[i],
            itemStyle: { color: cols[i], borderRadius: [0, 6, 6, 0] },
            label: { show: true, position: 'right', fontFamily: CN_FONT, fontSize: (mobile ? 11 : 12), fontWeight: 700, color: ink, formatter: labels[i] }
          };
        })
      }]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  })();
})();
