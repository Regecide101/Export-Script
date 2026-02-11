// Universal AI Chat Exporter v1.1
// Works with: ChatGPT, Claude, Gemini, Grok, Google AI Studio, Perplexity, and more!
// Your data. Your conversations. Your right to have them.

(function() {
    'use strict';
    
    // ========== PLATFORM DETECTION ==========
    const PLATFORMS = {
        chatgpt: {
            name: 'ChatGPT',
            match: () => location.hostname.includes('chat.openai.com') || location.hostname.includes('chatgpt.com'),
            getTitle: () => document.title.replace(' | ChatGPT', '').replace('ChatGPT - ', '') || 'ChatGPT_Export',
            getMessages: () => {
                const articles = document.querySelectorAll('main article');
                return Array.from(articles).map(article => {
                    const isUser = article.querySelector('[data-message-author-role="user"]') !== null;
                    return {
                        role: isUser ? 'user' : 'assistant',
                        content: article.innerText.replace(/^(You said:|ChatGPT said:)\s*/i, '').trim(),
                        html: article.innerHTML
                    };
                });
            }
        },
        claude: {
            name: 'Claude',
            match: () => location.hostname.includes('claude.ai'),
            getTitle: () => {
                const title = document.querySelector('[data-testid="chat-title"]')?.textContent 
                    || document.title.replace(' - Claude', '') || 'Claude_Export';
                return title;
            },
            getMessages: () => {
                const messages = document.querySelectorAll('[data-testid="user-message"], [data-testid="assistant-message"]');
                if (messages.length === 0) {
                    const turns = document.querySelectorAll('.font-user-message, .font-claude-message');
                    return Array.from(turns).map(el => ({
                        role: el.classList.contains('font-user-message') ? 'user' : 'assistant',
                        content: el.innerText.trim(),
                        html: el.innerHTML
                    }));
                }
                return Array.from(messages).map(msg => ({
                    role: msg.dataset.testid.includes('user') ? 'user' : 'assistant',
                    content: msg.innerText.trim(),
                    html: msg.innerHTML
                }));
            }
        },
        gemini: {
            name: 'Gemini',
            match: () => location.hostname.includes('gemini.google.com'),
            getTitle: () => {
                const title = document.querySelector('.conversation-title')?.textContent 
                    || document.title.replace(' - Gemini', '').replace('Gemini', '').trim() || 'Gemini_Export';
                return title;
            },
            getMessages: () => {
                // Gemini has user queries and model responses
                const containers = document.querySelectorAll('.conversation-container > div, [class*="query-content"], [class*="response-content"], .query-text, .model-response');
                const messages = [];
                
                // Try multiple selectors
                const userQueries = document.querySelectorAll('.query-text, [class*="query-content"], [data-message-author="user"]');
                const modelResponses = document.querySelectorAll('.model-response-text, [class*="response-content"], [class*="model-response"], .markdown');
                
                // Fallback: get all message-like elements
                if (userQueries.length === 0 && modelResponses.length === 0) {
                    const allMessages = document.querySelectorAll('message-content, .message-content, [class*="message"]');
                    return Array.from(allMessages).map((el, i) => ({
                        role: i % 2 === 0 ? 'user' : 'assistant',
                        content: el.innerText.trim()
                    }));
                }
                
                // Interleave user and assistant
                const maxLen = Math.max(userQueries.length, modelResponses.length);
                for (let i = 0; i < maxLen; i++) {
                    if (userQueries[i]) {
                        messages.push({
                            role: 'user',
                            content: userQueries[i].innerText.trim()
                        });
                    }
                    if (modelResponses[i]) {
                        messages.push({
                            role: 'assistant',
                            content: modelResponses[i].innerText.trim()
                        });
                    }
                }
                return messages;
            }
        },
        // Grok and Google AI Studio removed - too fussy with their DOM
        perplexity: {
            name: 'Perplexity',
            match: () => location.hostname.includes('perplexity.ai'),
            getTitle: () => document.title.replace(' - Perplexity', '') || 'Perplexity_Export',
            getMessages: () => {
                const messages = [];
                const queries = document.querySelectorAll('[class*="query"], [class*="Question"]');
                const answers = document.querySelectorAll('[class*="answer"], [class*="Answer"], .prose');
                
                queries.forEach((q, i) => {
                    messages.push({ role: 'user', content: q.innerText.trim() });
                    if (answers[i]) {
                        messages.push({ role: 'assistant', content: answers[i].innerText.trim() });
                    }
                });
                return messages;
            }
        },
        poe: {
            name: 'Poe',
            match: () => location.hostname.includes('poe.com'),
            getTitle: () => document.title.replace(' - Poe', '') || 'Poe_Export',
            getMessages: () => {
                const messages = document.querySelectorAll('[class*="Message_row"], [class*="message"]');
                return Array.from(messages).map(msg => ({
                    role: msg.querySelector('[class*="human"]') || msg.classList.toString().includes('human') ? 'user' : 'assistant',
                    content: msg.innerText.trim()
                }));
            }
        },
        copilot: {
            name: 'Microsoft Copilot',
            match: () => location.hostname.includes('copilot.microsoft.com') || location.hostname.includes('bing.com'),
            getTitle: () => 'Copilot_Export',
            getMessages: () => {
                const messages = document.querySelectorAll('[class*="message"], [class*="Message"]');
                return Array.from(messages).map((msg, i) => ({
                    role: msg.classList.toString().includes('user') || i % 2 === 0 ? 'user' : 'assistant',
                    content: msg.innerText.trim()
                }));
            }
        },
        // Generic fallback
        generic: {
            name: 'Unknown Platform',
            match: () => true,
            getTitle: () => document.title || 'Chat_Export',
            getMessages: () => {
                const selectors = [
                    '[data-role="user"], [data-role="assistant"]',
                    '.user-message, .assistant-message, .ai-message',
                    '[class*="user-message"], [class*="assistant-message"]',
                    '[class*="human"], [class*="bot"]',
                    '.message, .chat-message',
                    '[class*="Message"], [class*="message"]'
                ];
                for (const selector of selectors) {
                    const msgs = document.querySelectorAll(selector);
                    if (msgs.length > 1) {
                        return Array.from(msgs).map((msg, i) => ({
                            role: msg.dataset?.role || (msg.className.toLowerCase().includes('user') || msg.className.toLowerCase().includes('human') ? 'user' : 'assistant'),
                            content: msg.innerText.trim()
                        }));
                    }
                }
                return [];
            }
        }
    };
    
    // ========== DETECT PLATFORM ==========
    let platform = null;
    for (const [key, p] of Object.entries(PLATFORMS)) {
        if (key !== 'generic' && p.match()) {
            platform = p;
            console.log(`🎯 Matched platform: ${key}`);
            break;
        }
    }
    if (!platform) platform = PLATFORMS.generic;
    
    console.log(`🔍 Detected platform: ${platform.name}`);
    console.log(`📍 URL: ${location.href}`);
    
    // ========== SAFE MARKDOWN CONVERTER (no innerHTML) ==========
    function textToMarkdown(text) {
        // Simple text-based conversion without DOM manipulation
        if (!text) return '';
        return text
            .replace(/\*\*(.*?)\*\*/g, '**$1**')  // Keep bold
            .replace(/\*(.*?)\*/g, '*$1*')        // Keep italic
            .replace(/`(.*?)`/g, '`$1`')          // Keep code
            .trim();
    }
    
    // ========== EXTRACT MESSAGES ==========
    let messages = [];
    try {
        messages = platform.getMessages();
    } catch (e) {
        console.error('Error extracting messages:', e);
    }
    
    // Filter out empty messages
    messages = messages.filter(m => m.content && m.content.length > 0);
    
    if (messages.length === 0) {
        const debugInfo = `Platform: ${platform.name}\nURL: ${location.href}\nHostname: ${location.hostname}`;
        console.log('Debug info:', debugInfo);
        alert(`❌ No messages found on ${platform.name}!\n\n${debugInfo}\n\nTry scrolling to load messages, or this might be a new UI version.`);
        return;
    }
    
    const title = platform.getTitle() || 'Chat_Export';
    const safeName = title.substring(0, 50).replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    
    console.log(`📝 Extracting "${title}" - ${messages.length} messages from ${platform.name}...`);
    
    // ========== BUILD MARKDOWN (safe, no innerHTML) ==========
    let mdContent = `# ${title}\n\n`;
    mdContent += `**Platform:** ${platform.name}\n`;
    mdContent += `**Extracted:** ${new Date().toLocaleString()}\n`;
    mdContent += `**Messages:** ${messages.length}\n\n---\n\n`;
    
    messages.forEach((msg, i) => {
        const roleIcon = msg.role === 'user' ? '👤 USER' : '🤖 ASSISTANT';
        mdContent += `## [${i + 1}] ${roleIcon}\n\n${msg.content}\n\n---\n\n`;
    });
    
    // ========== BUILD HTML (safe, escaped) ==========
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(title)}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #1a1a1a; color: #e0e0e0; }
        h1 { color: #fff; border-bottom: 2px solid #444; padding-bottom: 10px; }
        .meta { color: #888; font-size: 14px; margin-bottom: 30px; }
        .message { margin: 20px 0; padding: 15px; border-radius: 10px; border-left: 4px solid; white-space: pre-wrap; }
        .user { background: #1e3a5f; border-left-color: #4a9eff; }
        .assistant { background: #2d2d2d; border-left-color: #10a37f; }
        .role { font-weight: bold; margin-bottom: 10px; font-size: 12px; text-transform: uppercase; }
        .user .role { color: #4a9eff; }
        .assistant .role { color: #10a37f; }
        .content { line-height: 1.6; }
    </style>
</head>
<body>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">
        <strong>Platform:</strong> ${escapeHtml(platform.name)}<br>
        <strong>Extracted:</strong> ${new Date().toLocaleString()}<br>
        <strong>Messages:</strong> ${messages.length}
    </div>
`;
    
    messages.forEach((msg, i) => {
        const roleLabel = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
        htmlContent += `    <div class="message ${msg.role}">
        <div class="role">[${i + 1}] ${roleLabel}</div>
        <div class="content">${escapeHtml(msg.content)}</div>
    </div>\n`;
    });
    htmlContent += `</body></html>`;
    
    // ========== BUILD JSON ==========
    const jsonData = {
        platform: platform.name,
        title: title,
        url: location.href,
        extracted: new Date().toISOString(),
        message_count: messages.length,
        messages: messages.map((msg, i) => ({
            index: i + 1,
            role: msg.role,
            content: msg.content
        }))
    };
    
    // ========== DOWNLOAD ==========
    function download(content, filename, type) {
        const blob = new Blob([typeof content === 'string' ? content : JSON.stringify(content, null, 2)], { type });
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
    
    const prefix = `${platform.name}_${safeName}_${timestamp}`;
    
    download(mdContent, `${prefix}.md`, 'text/markdown');
    setTimeout(() => download(htmlContent, `${prefix}.html`, 'text/html'), 500);
    setTimeout(() => download(jsonData, `${prefix}.json`, 'application/json'), 1000);
    
    setTimeout(() => {
        alert(`✅ ${platform.name} EXPORT COMPLETE!\n\n📊 ${messages.length} messages exported\n\n📁 Files:\n- ${prefix}.md\n- ${prefix}.html\n- ${prefix}.json`);
    }, 1500);
})();
