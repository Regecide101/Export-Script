// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  CHATGPT ULTIMATE EXPORTER v1.0                                           ║
// ║  One script to extract them all 🔥                                        ║
// ║                                                                           ║
// ║  Exports: Markdown, HTML, JSON + Downloads ALL Images                     ║
// ║  https://github.com/Regecide101/Export-Script                             ║
// ╚═══════════════════════════════════════════════════════════════════════════╝
//
// HOW TO USE:
// 1. Open a ChatGPT conversation
// 2. Scroll to the TOP (Ctrl+Home) to load all messages
// 3. Open DevTools (F12) → Console
// 4. Paste this entire script
// 5. Press Enter
// 6. Watch the magic happen ✨
//
// Your data. Your conversations. Your right to have them.

(async function() {
    'use strict';
    
    console.log('🚀 ChatGPT Ultimate Exporter v1.0');
    console.log('================================');
    
    // ========== CHECK WE'RE ON CHATGPT ==========
    if (!location.hostname.includes('chatgpt.com') && !location.hostname.includes('chat.openai.com')) {
        alert('❌ Please run this on a ChatGPT conversation page!');
        return;
    }
    
    // ========== FIND ALL MESSAGES ==========
    const articles = document.querySelectorAll('main article');
    if (articles.length === 0) {
        alert('❌ No messages found!\n\nMake sure you:\n1. Are on a conversation page\n2. Have scrolled to load all messages');
        return;
    }
    
    // ========== GET TITLE ==========
    let title = document.title.replace(' | ChatGPT', '').replace('ChatGPT - ', '').trim() || 'ChatGPT_Export';
    const safeName = title.substring(0, 50).replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    const prefix = `ChatGPT_${safeName}_${timestamp}`;
    
    console.log(`📝 Title: "${title}"`);
    console.log(`📊 Messages: ${articles.length}`);
    
    // ========== COLLECT MESSAGES ==========
    const messages = [];
    const allImages = [];
    let stats = { images: 0, links: 0, codeBlocks: 0 };
    
    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const isUser = article.querySelector('[data-message-author-role="user"]') !== null;
        const role = isUser ? 'user' : 'assistant';
        
        // Get content
        let contentEl = article.querySelector('.markdown, .prose, [class*="markdown"]');
        if (!contentEl) {
            contentEl = article.querySelector('[data-message-author-role]')?.parentElement || article;
        }
        
        // Get text content
        let text = article.innerText || '';
        text = text.replace(/^(You said:|ChatGPT said:)\s*/i, '').trim();
        
        // Get HTML
        const html = contentEl.innerHTML || '';
        
        // Find images in this message
        const imgs = article.querySelectorAll('img');
        imgs.forEach((img, idx) => {
            const src = img.src;
            if (src && (src.includes('chatgpt.com') || src.includes('oaiusercontent.com') || src.includes('openai.com'))) {
                allImages.push({
                    src: src,
                    messageIndex: i + 1,
                    imageIndex: allImages.length + 1,
                    alt: img.alt || ''
                });
                stats.images++;
            }
        });
        
        // Count other elements
        stats.links += article.querySelectorAll('a[href]').length;
        stats.codeBlocks += article.querySelectorAll('pre').length;
        
        messages.push({
            index: i + 1,
            role: role,
            content: text,
            html: html
        });
    }
    
    console.log(`🖼️ Images: ${stats.images}`);
    console.log(`🔗 Links: ${stats.links}`);
    console.log(`💻 Code blocks: ${stats.codeBlocks}`);
    
    // ========== HELPER: ESCAPE HTML ==========
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ========== HELPER: DOWNLOAD ==========
    function downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
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
    
    // ========== BUILD MARKDOWN ==========
    console.log('\n📄 Generating Markdown...');
    let mdContent = `# ${title}\n\n`;
    mdContent += `**Extracted:** ${new Date().toLocaleString()}\n`;
    mdContent += `**Messages:** ${messages.length}\n`;
    mdContent += `**Images:** ${stats.images}\n\n---\n\n`;
    
    messages.forEach(msg => {
        const roleIcon = msg.role === 'user' ? '👤 USER' : '🤖 ASSISTANT';
        mdContent += `## [${msg.index}] ${roleIcon}\n\n${msg.content}\n\n---\n\n`;
    });
    
    // ========== BUILD HTML ==========
    console.log('🌐 Generating HTML...');
    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #1a1a1a; color: #e0e0e0; }
        h1 { color: #fff; border-bottom: 2px solid #444; padding-bottom: 10px; }
        .meta { color: #888; font-size: 14px; margin-bottom: 30px; }
        .message { margin: 20px 0; padding: 15px; border-radius: 10px; border-left: 4px solid; }
        .user { background: #1e3a5f; border-left-color: #4a9eff; }
        .assistant { background: #2d2d2d; border-left-color: #10a37f; }
        .role { font-weight: bold; margin-bottom: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .user .role { color: #4a9eff; }
        .assistant .role { color: #10a37f; }
        .content { line-height: 1.6; }
        .content img { max-width: 100%; border-radius: 8px; margin: 10px 0; }
        .content pre { background: #0d0d0d; padding: 15px; border-radius: 8px; overflow-x: auto; }
        .content code { background: #333; padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', 'Monaco', monospace; }
        .content pre code { background: none; padding: 0; }
        .content a { color: #4a9eff; }
        .content blockquote { border-left: 3px solid #444; margin: 10px 0; padding-left: 15px; color: #aaa; }
        hr { border: none; border-top: 1px solid #333; margin: 30px 0; }
    </style>
</head>
<body>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">
        <strong>Extracted:</strong> ${new Date().toLocaleString()}<br>
        <strong>Messages:</strong> ${messages.length}<br>
        <strong>Images:</strong> ${stats.images}
    </div>
`;
    
    messages.forEach(msg => {
        const roleLabel = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
        htmlContent += `    <div class="message ${msg.role}">
        <div class="role">[${msg.index}] ${roleLabel}</div>
        <div class="content">${msg.html || escapeHtml(msg.content)}</div>
    </div>\n`;
    });
    
    htmlContent += `</body>\n</html>`;
    
    // ========== BUILD JSON ==========
    console.log('📊 Generating JSON...');
    const jsonData = {
        title: title,
        extracted: new Date().toISOString(),
        message_count: messages.length,
        stats: stats,
        images: allImages.map(img => ({
            messageIndex: img.messageIndex,
            filename: `image_${String(img.imageIndex).padStart(3, '0')}.png`,
            alt: img.alt
        })),
        messages: messages.map(msg => ({
            index: msg.index,
            role: msg.role,
            content: msg.content
        }))
    };
    
    // ========== DOWNLOAD TEXT FILES ==========
    console.log('\n📥 Downloading files...');
    downloadFile(mdContent, `${prefix}.md`, 'text/markdown');
    await new Promise(r => setTimeout(r, 300));
    downloadFile(htmlContent, `${prefix}.html`, 'text/html');
    await new Promise(r => setTimeout(r, 300));
    downloadFile(JSON.stringify(jsonData, null, 2), `${prefix}.json`, 'application/json');
    
    // ========== DOWNLOAD IMAGES ==========
    if (allImages.length > 0) {
        console.log(`\n🖼️ Downloading ${allImages.length} images...`);
        
        let imgSuccess = 0;
        let imgFailed = 0;
        
        for (let i = 0; i < allImages.length; i++) {
            const img = allImages[i];
            const num = String(img.imageIndex).padStart(3, '0');
            
            try {
                const response = await fetch(img.src, { 
                    credentials: 'include',
                    mode: 'cors'
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const blob = await response.blob();
                
                // Determine extension
                let ext = 'png';
                const type = blob.type;
                if (type.includes('jpeg') || type.includes('jpg')) ext = 'jpg';
                else if (type.includes('gif')) ext = 'gif';
                else if (type.includes('webp')) ext = 'webp';
                
                // Download
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `${prefix}_image_${num}.${ext}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
                
                console.log(`   ✅ image_${num}.${ext}`);
                imgSuccess++;
                
                await new Promise(r => setTimeout(r, 200));
                
            } catch (e) {
                console.log(`   ❌ image_${num} - ${e.message}`);
                imgFailed++;
            }
        }
        
        console.log(`\n🖼️ Images: ${imgSuccess} downloaded, ${imgFailed} failed`);
    }
    
    // ========== DONE ==========
    const summary = `
╔═══════════════════════════════════════╗
║  🎉 EXPORT COMPLETE!                  ║
╠═══════════════════════════════════════╣
║  📝 Messages: ${String(messages.length).padEnd(22)}║
║  🖼️ Images: ${String(stats.images).padEnd(24)}║
║  🔗 Links: ${String(stats.links).padEnd(25)}║
║  💻 Code blocks: ${String(stats.codeBlocks).padEnd(19)}║
╠═══════════════════════════════════════╣
║  📁 Files downloaded:                 ║
║     • ${prefix}.md
║     • ${prefix}.html
║     • ${prefix}.json
║     • ${stats.images} images
╚═══════════════════════════════════════╝

Your data. Your conversations. Your right.
    `.trim();
    
    console.log('\n' + summary);
    alert(`🎉 EXPORT COMPLETE!\n\n📝 ${messages.length} messages\n🖼️ ${stats.images} images\n\nCheck your Downloads folder!`);
})();
