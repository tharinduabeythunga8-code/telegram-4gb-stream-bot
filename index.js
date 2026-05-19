const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const express = require('express');
const app = express();

// ⚠️ ඔයාගේ ඇත්තම විස්තර ටික මෙතනට කෙලින්ම දෙන්න
const apiId = 36130475; // 👈 ඔයාගේ API ID එක
const apiHash = "94fa20937754a3bbe85ade6441ecace4"; // 👈 ඔයාගේ API HASH එක
const botToken = "8961189305:AAE2IByMuTjT-sNVV8PibBADswaPWZPNa3g"; // 👈 BotFather ගෙන් ගත්ත BOT TOKEN එක
const OWNER_ID = "6435171356"; // 👈 ඔයාගේ ටෙලිග්‍රෑම් ID එක

const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('🚀 MTProto Direct Stream Server is Online!'));

const stringSession = new StringSession(""); 
const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
});

// Stream Endpoint
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

// 🔥 GramJS බග් එක බයිපාස් කර බොට් ලොග් කරවන සුපිරිම ක්‍රමය
(async () => {
    try {
        console.log("🤖 Connecting to Telegram Core...");
        await client.connect(); 
        
        console.log("🔑 Injecting Raw Bot Authorization via RPC...");
        
        // GramJS .start() එකේ බග් එක සම්පූර්ණයෙන්ම බයිපාස් කර ටෙලිග්‍රෑම් සර්වර් එකටම කෙලින්ම Auth එක දීම
        await client.invoke(
            new Api.auth.ImportBotAuthorization({
                flags: 0,
                apiId: apiId,
                apiHash: apiHash,
                botToken: botToken.trim()
            })
        );
        
        console.log("✅ [SUCCESS] 100% Logged in as Bot via Raw Session!");

        app.listen(PORT, () => {
            console.log(`🚀 Service actively running on port ${PORT}`);
        });

    } catch (err) {
        console.error("❌ RPC Auth Failed:", err.message);
    }
})();