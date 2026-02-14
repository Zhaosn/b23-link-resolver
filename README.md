# B23 Link Resolver

Obsidian 插件，用于自动解析和转换 b23.tv 短链接为完整的 Bilibili 链接，并添加标题。

## 功能特性

- **自动解析**：粘贴包含 b23.tv 链接的文本时，插件会自动解析这些链接
- **智能识别**：支持识别并处理 Bilibili 的视频、直播、文章短链接
- **Markdown 格式**：将短链接转换为 `[标题](链接)` 格式的 Markdown 链接

## 支持的链接类型

- ✅ 视频链接 (`b23.tv/xxx` → `[视频标题](https://www.bilibili.com/video/BVxxx)`) 
- ✅ 直播链接 (`b23.tv/xxx` → `[直播标题](https://live.bilibili.com/xxx)`) 
- ✅ 文章链接 (`b23.tv/xxx` → `[文章标题](https://www.bilibili.com/read/xxx)`) 

## 安装方法

### 手动安装

1. 下载最新的发布版本 `main.js` 和 `manifest.json` 文件
2. 在 Obsidian 中打开您的 vault 文件夹
3. 导航到 `.obsidian/plugins/` 目录
4. 创建一个新文件夹 `b23-link-resolver`
5. 将下载的 `main.js` 和 `manifest.json` 文件复制到该文件夹中
6. 重启 Obsidian
7. 在 Obsidian 设置 → 插件 中启用 "B23 Link Resolver" 插件

## 使用方法

使用方法非常简单，只需正常复制粘贴包含 b23.tv 链接的文本即可：

1. 复制包含 b23.tv 链接的文本（例如从 B 站分享的链接）
2. 在 Obsidian 编辑器中粘贴
3. 插件会自动解析链接并转换为带有标题的 Markdown 格式
4. 解析完成后，您会看到 "b23.tv links automatically resolved" 的通知

### 示例

#### 输入
```
看看这个视频：b23.tv/abc123
```

#### 输出
```
看看这个视频：[视频标题](https://www.bilibili.com/video/BVxxx)
```

## 开发和构建

### 环境要求

- Node.js
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

这将启动一个监视模式的构建过程，当您修改代码时会自动重新构建。

### 构建生产版本

```bash
npm run build
```

## 工作原理

1. 插件注册一个粘贴事件监听器
2. 当检测到粘贴的文本包含 b23.tv 链接时，触发解析流程
3. 对于每个 b23.tv 链接，插件会：
   - 发送请求获取链接指向的页面内容
   - 根据页面内容识别链接类型（视频、直播、文章等）
   - 提取相应的标题和完整链接
   - 根据剪贴板内容长度，处理光标处向前的文本，将匹配的短链接替换为带有标题的 Markdown 链接
4. 最后，将处理后的文本更新到编辑器中

## 注意事项

- 插件需要网络连接来解析 b23.tv 链接
- 解析过程可能会有轻微延迟，具体取决于网络速度
- 对于无法识别的链接类型，插件会保留原始短链接并显示警告通知


## 许可证

本项目采用 MIT 许可证。您可以在遵守许可证条款的前提下自由使用、修改和分发本项目的代码。

## 贡献

欢迎提交问题和改进建议！