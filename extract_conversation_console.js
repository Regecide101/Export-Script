// ChatGPT Conversation Extractor v3.1 - TRIPLE EXPORT
// Exports HTML, Markdown, AND JSON - Downloads all three files

(function() {
    const articles = document.querySelectorAll('main article');
    if (articles.length === 0) {
        alert('No messages found!');
        return;
    }
    
    let title = document.title.replace(' | ChatGPT', '').replace('ChatGPT - ', '') || 'Untitled';
    const safeName = title.substring(0, 50).replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    
    console.log(`Extracting "${title}" - ${articles.length} messages in 3 formats...`);
    
    // ========== HTML TO MARKDOWN CONVERTER ==========
    function htmlToMarkdown(element) {
        function processNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent;
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return '';
            
            const tag = node.tagName.toLowerCase();
            const children = Array.from(node.childNodes).map(processNode).join('');
            
            switch(tag) {
                case 'h1': return `# ${children}\n\n`;
                case 'h2': return `## ${children}\n\n`;
                case 'h3': return `### ${children}\n\n`;
                case 'h4': return `#### ${children}\n\n`;
                case 'h5': return `##### ${children}\n\n`;
                case 'h6': return `###### ${children}\n\n`;
                case 'strong': case 'b': return `**${children}**`;
                case 'em': case 'i': return `*${children}*`;
                case 'u': return `<u>${children}</u>`;
                case 's': case 'strike': case 'del': return `~~${children}~~`;
                case 'code': 
                    if (node.parentElement?.tagName.toLowerCase() === 'pre') return children;
                    return `\`${children}\``;
                case 'pre':
                    const codeEl = node.querySelector('code');
                    const lang = codeEl?.className?.match(/language-(\w+)/)?.[1] || '';
                    const code = codeEl?.textContent || node.textContent;
                    return `\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
                case 'a':
                    const href = node.getAttribute('href') || '';
                    if (href && href !== children) return `[${children}](${href})`;
                    return children || href;
                case 'img':
                    const src = node.getAttribute('src') || '';
                    const alt = node.getAttribute('alt') || 'image';
                    return src.startsWith('data:') ? `![${alt}](embedded-image)` : `![${alt}](${src})`;
                case 'ul': case 'ol': return `\n${children}\n`;
                case 'li': 
                    const parent = node.parentElement?.tagName.toLowerCase();
                    const prefix = parent === 'ol' 
                        ? `${Array.from(node.parentElement.children).indexOf(node) + 1}. ` : '- ';
                    return `${prefix}${children.trim()}\n`;
                case 'p': return `${children}\n\n`;
                case 'div': return `${children}\n`;
                case 'br': return '\n';
                case 'hr': return '\n---\n\n';
                case 'blockquote': 
                    return children.split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
                case 'table': return `\n${children}\n`;
                case 'thead': case 'tbody': return children;
                case 'tr': 
                    const cells = Array.from(node.querySelectorAll('th, td'))
                        .map(c => processNode(c).trim()).join(' | ');
                    const isHeader = node.querySelector('th');
                    if (isHeader) {
                        const divider = Array.from(node.querySelectorAll('th')).map(() => '---').join(' | ');
                        return `| ${cells} |\n| ${divider} |\n`;
                    }
                    return `| ${cells} |\n`;
                case 'th': case 'td': return children;
                case 'script': case 'style': case 'svg': case 'button': return '';
                default: return children;
            }
        }
        return processNode(element).trim();
    }
    
    // ========== EXTRACT ALL MESSAGES ==========
    const messages = [];
    let stats = { empty: 0, images: 0, links: 0, codeBlocks: 0 };
    
    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const isUser = article.querySelector('[data-message-author-role="user"]') !== null;
        const role = isUser ? 'user' : 'assistant';
        
        // Get content element
        let contentEl = article.querySelector('.markdown, .prose, [class*="markdown"]');
        if (!contentEl) {
            contentEl = article.querySelector('[data-message-author-role]')?.parentElement || article;
        }
        
        // Count media
        stats.images += article.querySelectorAll('img').length;
        stats.links += article.querySelectorAll('a[href]').length;
        stats.codeBlocks += article.querySelectorAll('pre').length;
        
        // Get HTML (clean it up a bit)
        let html = contentEl.innerHTML || '';
        
        // Get Markdown
        let markdown = htmlToMarkdown(contentEl);
        markdown = markdown.replace(/^(You said:|ChatGPT said:)\s*/i, '');
        
        // Get plain text as fallback
        let text = article.innerText || article.textContent || '';
        text = text.replace(/^(You said:|ChatGPT said:)\s*/i, '').trim();
        
        if (markdown.length === 0) markdown = text;
        if (markdown.length === 0) {
            stats.empty++;
            markdown = '*[MESSAGE CONTENT NOT AVAILABLE]*';
            text = '[MESSAGE CONTENT NOT AVAILABLE]';
        }
        
        // Extract images
        const images = Array.from(article.querySelectorAll('img')).map(img => ({
            src: img.getAttribute('src') || '',
            alt: img.getAttribute('alt') || ''
        })).filter(img => img.src && !img.src.startsWith('data:'));
        
        // Extract links
        const links = Array.from(article.querySelectorAll('a[href]')).map(a => ({
            href: a.getAttribute('href') || '',
            text: a.textContent || ''
        })).filter(link => link.href);
        
        messages.push({
            index: i + 1,
            role: role,
            content: text,
            markdown: markdown,
            html: html,
            images: images,
            links: links,
            timestamp: null // ChatGPT doesn't expose this easily
        });
    }
    
    // ========== BUILD MARKDOWN FILE ==========
    let mdContent = `# ${title}\n\n`;
    mdContent += `**Extracted:** ${new Date().toLocaleString()}\n`;
    mdContent += `**Messages:** ${articles.length}\n`;
    mdContent += `**Format:** Full fidelity Markdown\n\n---\n\n`;
    
    messages.forEach(msg => {
        const roleIcon = msg.role === 'user' ? '👤 USER' : '🤖 ASSISTANT';
        mdContent += `## [${msg.index}] ${roleIcon}\n\n`;
        mdContent += msg.markdown;
        mdContent += `\n\n---\n\n`;
    });
    
    // ========== BUILD HTML FILE ==========
    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background: #1a1a1a;
            color: #e0e0e0;
        }
        h1 { color: #fff; border-bottom: 2px solid #444; padding-bottom: 10px; }
        .meta { color: #888; font-size: 14px; margin-bottom: 30px; }
        .message { 
            margin: 20px 0; 
            padding: 15px; 
            border-radius: 10px;
            border-left: 4px solid;
        }
        .user { 
            background: #1e3a5f; 
            border-left-color: #4a9eff;
        }
        .assistant { 
            background: #2d2d2d; 
            border-left-color: #10a37f;
        }
        .role { 
            font-weight: bold; 
            margin-bottom: 10px; 
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .user .role { color: #4a9eff; }
        .assistant .role { color: #10a37f; }
        .content { line-height: 1.6; }
        .content img { max-width: 100%; border-radius: 8px; margin: 10px 0; }
        .content pre { 
            background: #0d0d0d; 
            padding: 15px; 
            border-radius: 8px; 
            overflow-x: auto;
        }
        .content code { 
            background: #333; 
            padding: 2px 6px; 
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', monospace;
        }
        .content pre code { background: none; padding: 0; }
        .content a { color: #4a9eff; }
        .content blockquote {
            border-left: 3px solid #444;
            margin: 10px 0;
            padding-left: 15px;
            color: #aaa;
        }
        hr { border: none; border-top: 1px solid #333; margin: 30px 0; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="meta">
        <strong>Extracted:</strong> ${new Date().toLocaleString()}<br>
        <strong>Messages:</strong> ${articles.length}
    </div>
`;
    
    messages.forEach(msg => {
        const roleLabel = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
        htmlContent += `    <div class="message ${msg.role}">
        <div class="role">[${msg.index}] ${roleLabel}</div>
        <div class="content">${msg.html || msg.content}</div>
    </div>\n`;
    });
    
    htmlContent += `</body>\n</html>`;
    
    // ========== BUILD JSON FILE ==========
    const jsonData = {
        title: title,
        extracted: new Date().toISOString(),
        message_count: messages.length,
        stats: stats,
        messages: messages.map(msg => ({
            index: msg.index,
            role: msg.role,
            content: msg.content,
            images: msg.images,
            links: msg.links
        }))
    };
    const jsonContent = JSON.stringify(jsonData, null, 2);
    
    // ========== DOWNLOAD ALL THREE ==========
    function download(content, filename, type) {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`✅ Downloaded: ${filename}`);
    }
    
    // Small delay between downloads to prevent browser blocking
    download(mdContent, `ChatGPT_${safeName}_${timestamp}.md`, 'text/markdown');
    
    setTimeout(() => {
        download(htmlContent, `ChatGPT_${safeName}_${timestamp}.html`, 'text/html');
    }, 500);
    
    setTimeout(() => {
        download(jsonContent, `ChatGPT_${safeName}_${timestamp}.json`, 'application/json');
    }, 1000);
    
    // Stats
    const statsMsg = `📊 Stats:
- Messages: ${articles.length}
- Empty: ${stats.empty}
- Images: ${stats.images}
- Links: ${stats.links}
- Code blocks: ${stats.codeBlocks}

📁 Files downloaded:
- .md (Markdown - readable archive)
- .html (Web page - styled view)
- .json (Structured data - training/API)`;
    
    console.log(`✅ TRIPLE EXPORT COMPLETE!\n${statsMsg}`);
    
    setTimeout(() => {
        alert(`✅ TRIPLE EXPORT COMPLETE!\n\n${statsMsg}`);
    }, 1500);
})();
