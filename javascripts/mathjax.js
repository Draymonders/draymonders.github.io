window.MathJax = {
  tex: {
    inlineMath: [["\\(", "\\)"], ["$", "$"]],
    displayMath: [["\\[", "\\]"], ["$$", "$$"]],
    processEscapes: true,
    processEnvironments: true
  },
  options: {
    // 移除 ignoreHtmlClass 配置，允许 MathJax 扫描全文（默认会跳过 code/pre 标签）
    // 保留 processHtmlClass 以支持 arithmatex 生成的内容
    processHtmlClass: "arithmatex"
  }
};
