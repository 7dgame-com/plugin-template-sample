module.exports = {
  // 单个参数箭头函数是否显示小括号 (always:始终显示;avoid:省略括号)
  arrowParens: "always",
  // 开始标签的右尖括号是否跟随在最后一行属性末尾
  bracketSameLine: false,
  // 对象字面量的括号之间打印空格
  bracketSpacing: true,
  // 是否格式化一些文件中被嵌入的代码片段的风格
  embeddedLanguageFormatting: "auto",
  // 指定 HTML 文件的空格敏感度
  htmlWhitespaceSensitivity: "css",
  // 当文件已经被 Prettier 格式化之后，是否会在文件顶部插入一个特殊的 @format 标记
  insertPragma: false,
  // 在 JSX 中使用单引号替代双引号
  jsxSingleQuote: false,
  // 每行最多字符数量，超出换行
  printWidth: 80,
  // 超出打印宽度时的换行策略
  proseWrap: "preserve",
  // 对象属性是否使用引号
  quoteProps: "as-needed",
  // 是否只格式化在文件顶部包含特定注释的文件
  requirePragma: false,
  // 结尾添加分号
  semi: true,
  // 使用单引号
  singleQuote: false,
  // 缩进空格数
  tabWidth: 2,
  // 元素末尾是否加逗号
  trailingComma: "es5",
  // 指定缩进方式，空格或tab
  useTabs: false,
  // vue 文件中是否缩进 <style> 和 <script> 标签
  vueIndentScriptAndStyle: false,
  // 行尾换行符
  endOfLine: "auto",
  overrides: [
    {
      files: "*.html",
      options: {
        parser: "html",
      },
    },
  ],
};
