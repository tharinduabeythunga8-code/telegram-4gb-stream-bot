const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const express = require('express');
const app = express();

// ටෝකන් සහ අයිඩී ටික කෙලින්ම process.env හරහා ස්ථීරවම තහවුරු කරගන්නවා
const apiId = Number(process.env.API_ID);
const apiHash = String(process.env.API_HASH).trim();
const botToken = String(process.env.BOT_TOKEN).trim();
const PORT = process.env.PORT || 8080;

// variables ටික හරියට තියෙනවද කියලා සර්වර් ලොග් එකේ චෙක් කරගන්න ප්‍රින්ට් එකක්
console.log(`🔍 Checking configuration: API_ID=${apiId ? 'OK' : 'MISSING'}, API_HASH=${apiHash ? 'OK' : 'MISSING'}, BOT_TOKEN=${botToken ? 'OK' : 'MISSING'}`);

const stringSession = new StringSession(""); 
const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
});

app.get('/', (req, res) => res.send('🚀 MTProto 4GB Stream Server is Online!'));

// 4GB Stream Endpoint
app.get('/download/:msgId/:fileName', async (req, res) => {
    try {
        const { msgId, fileName } = req.params;
        const peer = process.env.OWNER_ID; 
        
        const messages = await client.getMessages(peer, { ids: [parseInt(msgId)] });
        
        if (!messages || messages.length === 0 || !messages[0].media) {
            return res.status(404).send("File not found.");
        }

        const media = messages[0].media;
        let document = media.document;

        if (!document && media.video) document = media.video;
        if (!document) return res.status(400).send("No downloadable media found.");

        const fileSize = document.size;

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
        console.error("Streaming error details:", error);
        if (!res.headersSent) res.status(500).send("Streaming error.");
    }
});

// Client එක සහ සර්වර් එක පණ ගැන්වීම
(async () => {
    try {
        console.log("🤖 Connecting to Telegram MTProto using Token...");
        // මෙතනදී අපි ටෝකන් එක කෙලින්ම පාස් කරනවා string එකක් විදිහට තහවුරු කරලා
        await client.start({
            botToken: async () => botToken,
        });
        console.log("✅ Logged in successfully as Bot!");

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error("❌ Failed to start Telegram Client:", err.message);
    }
})();