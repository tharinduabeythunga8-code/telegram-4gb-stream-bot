const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const express = require('express');
const app = express();

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH ? process.env.API_HASH.trim() : "";
const botToken = process.env.BOT_TOKEN ? process.env.BOT_TOKEN.trim() : "";
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('🚀 MTProto 4GB Stream Bot is Active!'));

const stringSession = new StringSession(""); 
const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
});

// Stream Endpoint
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

        const bufferSize = 512 * 1024;
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

// සර්වර් එක සහ බොට් ස්ටාර්ට් කිරීම
(async () => {
    try {
        console.log("🤖 Initializing Telegram Connection...");
        await client.connect();
        
        console.log("🔑 Authenticating via Bot Token...");
        // කිසිම කරදරයක් නැතුව කෙලින්ම සරලව ලොග් කරවන නිවැරදිම ක්‍රමය
        await client.start({
            botToken: () => Promise.resolve(botToken)
        });
        
        console.log("✅ Logged in successfully via MTProto!");

        app.listen(PORT, () => {
            console.log(`🚀 Web service running on port ${PORT}`);
        });

    } catch (err) {
        console.error("❌ Auth Error:", err.message);
    }
})();