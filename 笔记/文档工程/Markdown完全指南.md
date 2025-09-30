---
tags:
  - 知识领域/文档工程
  - Markdown
  - 写作指南
---

# Markdown完全指南

## 基础语法

### 标题
```markdown
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题
```

### 段落和换行
```markdown
这是一个段落。

这是另一个段落（空行分隔）。

这是一行
这是另一行（两个空格+回车强制换行）
```

### 文本样式
```markdown
*斜体文本* 或 _斜体文本_
**粗体文本** 或 __粗体文本__
***粗斜体文本*** 或 ___粗斜体文本___
~~删除线~~
==高亮文本==
```

### 引用
```markdown
> 这是一级引用
>> 这是二级引用
>>> 这是三级引用
```

### 列表
```markdown
#### 无序列表
- 项目1
- 项目2
  - 子项目2.1
  - 子项目2.2
- 项目3

#### 有序列表
1. 第一项
2. 第二项
   1. 子项2.1
   2. 子项2.2
3. 第三项

#### 任务列表
- [x] 已完成任务
- [ ] 未完成任务
```

### 链接
```markdown
#### 内联链接
[链接文本](https://www.example.com)
[链接文本](https://www.example.com "悬停提示")

#### 参考式链接
[链接文本][reference-id]
[reference-id]: https://www.example.com "悬停提示"

#### 自动链接
<https://www.example.com>
<email@example.com>
```

### 图片
```markdown
#### 基础图片
![替代文本](图片URL)
![替代文本](图片URL "悬停提示")

#### 指定大小（VitePress扩展）
![替代文本](图片URL =100x50)
![替代文本](图片URL =100x)
![替代文本](图片URL =x50)
```

### 代码
```markdown
#### 行内代码
`console.log("Hello World")`

#### 代码块
```javascript
function greet(name) {
    return `Hello, ${name}!`;
}
```

#### 语法高亮
```python
def hello_world():
    print("Hello, World!")
```
```

## 高级语法

### 表格
```markdown
| 表头1 | 表头2 | 表头3 |
|-------|-------|-------|
| 单元格1 | 单元格2 | 单元格3 |
| 单元格4 | 单元格5 | 单元格6 |

#### 对齐方式
| 左对齐 | 居中对齐 | 右对齐 |
|:-------|:--------:|-------:|
| 内容1 | 内容2 | 内容3 |
| 内容4 | 内容5 | 内容6 |
```

### 分割线
```markdown
---
***
___
```

### 脚注
```markdown
这是一个脚注引用[^1]

[^1]: 这是脚注内容
```

### 定义列表
```markdown
术语1
: 定义1
: 定义1的补充

术语2
: 定义2
```

## VitePress扩展功能

### 自定义容器（Admonitions）
```markdown
::: info
这是一个信息提示框
:::

::: tip
这是一个提示框
:::

::: warning
这是一个警告框
:::

::: danger
这是一个危险提示框
:::

::: details
这是一个可折叠的详情框
:::

::: info 自定义标题
带自定义标题的信息框
:::
```

### 代码块增强
```markdown
#### 行高亮
```js{1,3-5}
function hello() {
    console.log("Line 1");  // 高亮
    console.log("Line 2");
    console.log("Line 3");  // 高亮
    console.log("Line 4");  // 高亮
    console.log("Line 5");  // 高亮
}
```

#### 焦点高亮
```js /console\.log/
function hello() {
    console.log("Hello");  // 匹配的行会高亮
    console.log("World");  // 匹配的行会高亮
}
```
```

### Emoji表情
```markdown
直接使用Emoji字符：😀 🎉 ❤️

使用简写格式：
:smile: 😄
:heart: ❤️
:star: ⭐
```

### 目录（TOC）
```markdown
[[toc]]
```

### 自定义属性
```markdown
# 标题 {#custom-id}

[链接](#custom-id)
```

### 数学公式（需要配置KaTeX）
```markdown
行内公式：$E = mc^2$

块级公式：
$$
\frac{d}{dx}\left( \int_{0}^{x} f(u)\,du\right)=f(x)
$$
```

## 实用技巧

### 转义字符
```markdown
\* 不是斜体
\` 不是代码
\[ 不是链接
```

### HTML嵌入
```markdown
<kbd>Ctrl</kbd> + <kbd>C</kbd>

<mark>高亮文本</mark>

<sub>下标</sub> <sup>上标</sup>

<details>
<summary>点击展开</summary>
这里是详细内容
</details>
```

### 注释
```markdown
<!-- 这是一个注释，不会在最终页面显示 -->
```

### Vue组件（VitePress特有）
```markdown
<!-- 使用VitePress组件 -->
<VCard title="卡片标题">
  这是卡片内容
</VCard>

<!-- 自定义组件 -->
<MyComponent />
```

## 最佳实践

### 1. 文件结构
```
笔记/
├── category1/
│   ├── article1.md
│   └── assets/
│       └── image1.jpg
└── category2/
    └── article2.md
```

### 2. Frontmatter格式
```yaml
---
title: 文章标题
description: 文章描述
tags:
  - 标签1
  - 标签2
date: 2025-09-25
author: 作者名
---

# 文章内容
```

### 3. 图片管理
```markdown
<!-- 公共图片 -->
![公共图片](/images/common.jpg)

<!-- 笔记专用图片 -->
![专用图片](./assets/specific.jpg)
```

### 4. 链接策略
```markdown
<!-- 内部链接 -->
[[其他笔记]]  # 双链语法（如果支持）
[其他笔记](../category/note.md)

<!-- 外部链接 -->
[示例网站](https://example.com)
```

## 常用快捷键

### VS Code
- `Ctrl+B`：粗体
- `Ctrl+I`：斜体
- `Ctrl+K`：插入链接
- `Ctrl+Shift+]`：标题升级
- `Ctrl+Shift+[`：标题降级
- `Ctrl+Shift+L`：插入列表

### Typora
- `Ctrl+T`：插入表格
- `Ctrl+K`：插入链接
- `Ctrl+Shift+I`：插入图片

## 调试技巧

### 1. 语法检查
- 使用VS Code的Markdownlint插件
- 检查链接是否有效
- 验证图片路径

### 2. 预览技巧
- 实时预览（VS Code插件）
- 使用 `pnpm docs:dev` 本地预览
- 检查移动端适配

### 3. 常见问题
- 图片不显示：检查路径是否正确
- 链接失效：检查URL格式
- 样式异常：检查语法是否正确

## 参考资源

- [Markdown官方文档](https://www.markdownguide.org/)
- [VitePress文档](https://vitepress.dev/)
- [CommonMark规范](https://spec.commonmark.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

---

*这个指南涵盖了你在VitePress项目中需要的所有Markdown语法和技巧。*