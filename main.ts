import { Plugin, Notice, requestUrl } from 'obsidian';

export default class B23LinkResolverPlugin extends Plugin {
  async onload() {
    console.log('Loading b23.tv link resolver plugin');

    // 注册粘贴事件监听器
    this.registerDomEvent(document, 'paste', async (evt: ClipboardEvent) => {
      try {
        // 获取粘贴板内容
        const clipboardText = evt.clipboardData?.getData('text');
        if (!clipboardText || !clipboardText.includes('b23.tv')) {
          return; // 没有b23.tv链接，直接返回
        }

        // 等待粘贴完成
        setTimeout(async () => {
          try {
            // 解析所有b23.tv链接
            const { text: processedText, modified } = await this.processB23Links(clipboardText);

            // 只有当链接被成功修改时，才更新编辑器内容
            if (modified) {
              // 将处理后的文本粘贴到编辑器
              const editor = this.app.workspace.activeEditor?.editor;
              if (editor) {
                // 获取当前光标位置
                const cursor = editor.getCursor();
                // 计算粘贴文本的长度
                const pasteLength = clipboardText.length;
                // 获取粘贴的文本范围
                const start = { line: cursor.line, ch: Math.max(0, cursor.ch - pasteLength) };
                const end = cursor;
                // 替换粘贴的文本
                editor.replaceRange(processedText, start, end);
                new Notice('b23.tv links automatically resolved');
              }
            }
          } catch (error) {
            console.error('Failed to resolve b23.tv links:', error);
            // 处理失败时，不做任何操作，保留原始粘贴的文本
          }
        }, 0);
      } catch (error) {
        console.error('Failed to handle paste event:', error);
        // 事件处理失败时，不做任何操作，保留原始粘贴的文本
      }
    });
  }

  onunload() {
    console.log('Unloading b23.tv link resolver plugin');
    new Notice('b23.tv link resolver plugin unloaded');
  }

  /**
   * 处理文本中的所有b23.tv链接
   * @param text 原始文本
   * @returns 处理后的文本
   */
  private async processB23Links(text: string): Promise<{ text: string; modified: boolean }> {
    // 匹配b23.tv链接的正则表达式（支持带协议和不带协议的形式）
    const b23Regex = /(https?:\/\/)?b23\.tv\/[a-zA-Z0-9]+/g;
    const matches = text.match(b23Regex);

    if (!matches) {
      return { text, modified: false };
    }

    let processedText = text;
    let modified = false;

    // 逐个解析匹配到的链接
    for (const shortLink of matches) {
      // 确保链接有协议前缀
      const fullShortLink = shortLink.startsWith('http') ? shortLink : `https://${shortLink}`;
      let response = null;
      let linkInfo = null;
      
      try {
        // 只发送一次请求获取页面内容
        response = await requestUrl({
          url: fullShortLink,
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
      } catch (error) {
        console.error('Error requesting link:', error);
        continue;
      }
      
      if (!response) {
        continue;
      }
      
      // 按照顺序检查链接类型：视频 -> 直播 -> 文章 -> 音乐
      linkInfo = this.processVideoLink(fullShortLink, response.text);
      if (!linkInfo) {
        linkInfo = this.processLiveLink(fullShortLink, response.text);
      }
      if (!linkInfo) {
        linkInfo = this.processArticleLink(fullShortLink, response.text);
      }
      if (!linkInfo) {
        linkInfo = this.processMusicLink(fullShortLink, response.text);
      }
      
      // 根据链接类型获取标题和格式化链接
      let formattedLink;
      if (linkInfo) {
        // 是已知类型的链接，使用处理后的链接和标题
        formattedLink = `[${linkInfo.title}](${linkInfo.link})`;
        modified = true;
      } else {
        // 未知类型的链接，使用原始短链接
        formattedLink = shortLink;
        new Notice('this b23.tv link is not a known type');
      }
      
      processedText = processedText.replace(shortLink, formattedLink);
    }

    return { text: processedText, modified };
  }

  /**
   * 检查是否为视频链接并处理
   * @param url 原始链接
   * @param pageContent 页面内容
   * @returns 处理后的链接和标题，如果不是视频链接则返回null
   */
  private processVideoLink(url: string, pageContent: string): { link: string; title: string } | null {
    // 检查页面内容是否包含视频特征
    if (pageContent.includes('og:type" content="video')) {
      // 提取视频标题
      const titleMatch = pageContent.match(/(?<=property="og:title" content=").*?(?=_哔哩哔哩_bilibili)/);
      if (titleMatch && titleMatch[0]) {
        // 提取视频链接
        const linkMatch = pageContent.match(/https?:\/\/www\.bilibili\.com\/video\/BV[a-zA-Z0-9]+/);
        if (linkMatch && linkMatch[0]) {
          return {
            link: linkMatch[0],
            title: titleMatch[0]
          };
        }
      }
    }
    return null;
  }

  /**
   * 检查是否为直播链接并处理
   * @param url 原始链接
   * @param pageContent 页面内容
   * @returns 处理后的链接和标题，如果不是直播链接则返回null
   */
  private processLiveLink(url: string, pageContent: string): { link: string; title: string } | null {
    // 检查页面内容是否包含"Bilibili Live Room"
    if (pageContent.includes('Bilibili Live Room')) {
      // 提取room_id
      const roomIdMatch = pageContent.match(/(?<="room_id":)(\d+)(?=,)/);
      if (roomIdMatch && roomIdMatch[1]) {
        const roomId = roomIdMatch[1];
        const fixedLink = `https://live.bilibili.com/${roomId}`;
        
        // 提取标题
        const titleMatch = pageContent.match(/(?<=<title id="link-app-title">)(.*?)(?= - 哔哩哔哩直播，二次元弹幕直播平台)/);
        const title = titleMatch && titleMatch[1] ? titleMatch[1] : `直播房间 ${roomId}`;
        
        return { link: fixedLink, title };
      }
    }
    return null;
  }

  /**
   * 检查是否为文章链接并处理
   * @param url 原始链接
   * @param pageContent 页面内容
   * @returns 处理后的链接和标题，如果不是文章链接则返回null
   */
  private processArticleLink(url: string, pageContent: string): { link: string; title: string } | null {
    // 旧文章处理逻辑
    if (pageContent.includes('read/cv')) {
      // 提取文章标题
      const titleMatch = pageContent.match(/(?<=property=\"og:title\" content=\").*?(?=">)/);
      if (titleMatch && titleMatch[0]) {
        // 提取文章链接
        const linkMatch = pageContent.match(/https?:\/\/www\.bilibili\.com\/read\/.+?(?=">)/);
        if (linkMatch && linkMatch[0]) {
          return {
            link: linkMatch[0],
            title: titleMatch[0]
          };
        }
      }
    }

    // 新文章处理逻辑（可能文集里的文章链接会变成opus的）
    const cvMatch = pageContent.match(/(?<="opus-module-copyright__right">)cv.*?(?=<\/div>)/);
    if (cvMatch && cvMatch[0]) {
      const cvId = cvMatch[0].trim();
      const link = `https://www.bilibili.com/read/${cvId}`;
      
      // 提取标题
      const titleMatch = pageContent.match(/(?<=<title>).*?(?= - 哔哩哔哩<\/title>)/);
      if (titleMatch && titleMatch[0]) {
        return {
          link: link,
          title: titleMatch[0]
        };
      }
    }
    return null;
  }

  /**
   * 检查是否为音乐链接并处理
   * @param url 原始链接
   * @param pageContent 页面内容
   * @returns 处理后的链接和标题，如果不是音乐链接则返回null
   */
  private processMusicLink(url: string, pageContent: string): { link: string; title: string } | null {
    // 音乐处理逻辑框架（暂时不做具体实现）
    return null;
  }

}