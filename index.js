const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const express = require('express');
const app = express();

// Render එකේ Environment Variables වලින් අගයන් ගැනීම
const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH ? process.env.API_HASH.trim() : "";
const botToken = process.env.BOT_TOKEN ? process.env.BOT_TOKEN.trim() : "";
const PORT = process.env.PORT || 8080;

console.log(`🔍 Checking variables: API_ID=${apiId ? 'OK' : 'MISSING'}, API_HASH=${apiHash ? 'OK' : 'MISSING'}, BOT_TOKEN=${botToken ? 'OK' : 'MISSING'}`);

// හිස් සෙෂන් එකක් ආරම්භ කිරීම
const stringSession = new StringSession(""); 
const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
});

// මුල් පිටුව (Render එකට Port එක බයින්ඩ් කර තබා ගැනීමට)
app.get('/', (req, res) => {
    res.send('🚀 MTProto 4GB Stream Server is Active and Running!');
});

// 4GB Direct Stream Endpoint
app.get('/download/:msgId/:fileName', async (req, res) => {
    try {
        const { msgId, fileName } = req.params;
        const peer = process.env.OWNER_ID; 
        
        const messages = await client.getMessages(peer, { ids: [parseInt(msgId)] });
        
        if (!messages || messages.length === 0 || !messages[0].media) {
            return res.status(404).send("File not found on Telegram.");
        }

        const media = messages[0].media;
        let document = media.document;

        if (!document && media.video) document = media.video;
        if (!document) return res.status(400).send("No downloadable media found.");

        const fileSize = document.size;

        // බ්‍රවුසර් එකට Headers එකතු කිරීම
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Length', fileSize);

        console.log(`📥 Streaming started for: ${fileName}`);

        const bufferSize = 512 * 1024; // 512KB chunks
        let offset = 0;

        while (offset < fileSize) {
            const chunk = await client.downloadMedia(media, {
                offset: offset,
                limit: bufferSize,
                workers: 4
            });

            if (!chunk || chunk.length === 0) break;

            res.write(chunk);
            offset += chunk.length;
        }

        res.end();
        console.log(`✅ Streaming finished successfully!`);

    } catch (error) {
        console.error("Streaming error:", error);
        if (!res.headersSent) res.status(500).send("Streaming server error.");
    }
});

// GramJS Client එක පණ ගැන්වීමේ නිවැරදි ක්‍රමය
(async () => {
    try {
        console.log("🤖 Connecting to Telegram MTProto...");
        
        // GramJS වලට බෝට් ටෝකන් එක කෙලින්ම String එකක් විදිහට දීම (Function එකක් නැතුව)
        await client.start({
            botToken: botToken
        });
        
        console.log("✅ Logged in successfully as Bot!");

        // බෝට් ලොග් වුණාට පස්සේ විතරක් සර්වර් එක Port එකට බයින්ඩ් කිරීම
        app.listen(PORT, () => {
            console.log(`🚀 Server web service actively running on port ${PORT}`);
        });

    } catch (err) {
        console.error("❌ Failed to start Telegram Client:", err.message);
    }
})();