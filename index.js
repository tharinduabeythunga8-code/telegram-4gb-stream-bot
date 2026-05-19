const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const express = require('express');
const app = express();

// ⚠️ මෙතනට ඔයාගේ ඇත්තම විස්තර ටික " " ඇතුලේ කෙලින්ම ඇතුලත් කරන්න!
const apiId = 36130475; // 👈 ඔයාගේ API ID එක (Number එකක් විදිහට)
const apiHash = "94fa20937754a3bbe85ade6441ecace4"; // 👈 ඔයාගේ API HASH එක
const botToken = "8961189305:AAE2IByMuTjT-sNVV8PibBADswaPWZPNa3g"; // 👈 BotFather ගෙන් ගත්ත BOT TOKEN එක
const OWNER_ID = "6435171356"; // 👈 ඔයාගේ ටෙලිග්‍රෑම් ID එක (files තියෙන චැනල්/චැට් එකේ)

const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('🚀 Pure Hardcoded MTProto Stream Server is Online!'));

const stringSession = new StringSession(""); 
const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
});

// 4GB Direct Stream Endpoint
app.get('/download/:msgId/:fileName', async (req, res) => {
    try {
        const { msgId, fileName } = req.params;
        const peer = OWNER_ID; 
        
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

// සර්වර් එක පණ ගැන්වීම
(async () => {
    try {
        console.log("🤖 Connecting to Telegram Core via Hardcoded Credentials...");
        await client.connect(); 
        
        console.log("🔑 Logging in with Bot Token directly...");
        // කිසිම වැරදීමක් වෙන්න ඉඩක් නැති නිල GramJS ලොගින් මෙතඩ් එක
        await client.start({
            botToken: botToken
        });
        
        console.log("✅ 100% Successfully logged in as Bot!");

        app.listen(PORT, () => {
            console.log(`🚀 Web stream service actively running on port ${PORT}`);
        });

    } catch (err) {
        console.error("❌ Auth Failed:", err.message);
    }
})();