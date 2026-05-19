const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const express = require('express');
const app = express();

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH ? process.env.API_HASH.trim() : "";
const botToken = process.env.BOT_TOKEN ? process.env.BOT_TOKEN.trim() : "";
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('🚀 Pure MTProto 4GB Stream Server is Active!'));

const stringSession = new StringSession(""); 
const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
});

// 4GB Direct Stream Endpoint
app.get('/download/:msgId/:fileName', async (req, res) => {
    try {
        const { msgId, fileName } = req.params;
        const peer = process.env.OWNER_ID; 
        
        const messages = await client.getMessages(peer, { ids: [parseInt(msgId)] });
        
        if (!messages || messages.length === 0 || !messages[0].media) {
            return res.status(404).send("File not found.");
        }

        const media = messages[0].media;
        let document = media.document || media.video;
        if (!document) return res.status(400).send("No media found.");

        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Length', document.size);

        const bufferSize = 512 * 1024; // 512KB Chunks
        let offset = 0;

        while (offset < document.size) {
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
    } catch (error) {
        console.error(error);
        if (!res.headersSent) res.status(500).send("Streaming error.");
    }
});

// 🌟 GramJS වල සර්වර් එකක් ඇතුලේ බොට් කෙනෙක් 100% ක්‍රෑෂ් නොවී ස්ටාර්ට් කරන නිවැරදිම ක්‍රමය
(async () => {
    try {
        console.log("🤖 Connecting to Telegram Core via MTProto...");
        
        // GramJS වලට ටර්මිනල් එකෙන් Input ඉල්ලන්න ඉඩ නොදී, 
        // බොට් ටෝකන් එකෙන් විතරක් ලොග් වෙන්න කියලා මෙන්න මේ විදිහට Object එකක් පාස් කරන්න ඕනේ
        await client.start({
            botToken: botToken,
            forceSMS: false,
            password: async () => "",
            phoneCode: async () => "",
            onError: (err) => console.log("GramJS Inner Error:", err.message)
        });
        
        console.log("✅ 100% Successfully logged in as Bot via MTProto!");

        app.listen(PORT, () => {
            console.log(`🚀 Web stream service actively running on port ${PORT}`);
        });

    } catch (err) {
        console.error("❌ Auth Failed:", err.message);
    }
})();