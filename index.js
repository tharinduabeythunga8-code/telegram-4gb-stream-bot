const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const express = require('express');
const app = express();

// Render එකේ සෙට් කරපු variables
const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const botToken = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 8080;

const stringSession = new StringSession(""); // හිස් සෙෂන් එකක් පාවිච්චි කරන්නේ
const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
});

app.get('/', (res) => res.send('🚀 MTProto 4GB Stream Server is Online!'));

// 4GB Stream Endpoint එක
app.get('/download/:msgId/:fileName', async (req, res) => {
    try {
        const { msgId, fileName } = req.params;
        
        // අදාළ මැසේජ් එක ID එක හරහා ගන්නවා
        // මෙතනදී OWNER_ID එක චැනල් එකක් හෝ ඔයාගේ ID එක වෙන්න ඕනේ
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

        // Headers සෙට් කිරීම (ඩවුන්ලෝඩර් එකට සයිස් එක සහ නම කියා දීම)
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Length', fileSize);

        console.log(`📥 Streaming started for: ${fileName} (${fileSize} bytes)`);

        // GramJS හරහා ෆයිල් එක කැබලි (Chunks) විදිහට ඇදලා බ්‍රවුසර් එකට Pipe කිරීම
        // මේකෙන් තමයි 20MB සීමාව සම්පූර්ණයෙන්ම නැති වෙන්නේ
        const bufferSize = 512 * 1024; // 512KB chunks
        let offset = 0;

        while (offset < fileSize) {
            const chunk = await client.downloadMedia(media, {
                offset: offset,
                limit: bufferSize,
                workers: 4 // වේගය වැඩි කිරීමට Workers පාවිච්චි කරයි
            });

            if (!chunk || chunk.length === 0) break;

            res.write(chunk);
            offset += chunk.length;
        }

        res.end();
        console.log(`✅ Streaming finished successfully!`);

    } catch (error) {
        console.error(error);
        if (!res.headersSent) res.status(500).send("Streaming error.");
    }
});

// Client එක සහ සර්වර් එක පණ ගැන්වීම
(async () => {
    console.log("🤖 Connecting to Telegram MTProto...");
    await client.start({
        botToken: botToken,
    });
    console.log("✅ Logged in successfully as Bot!");

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})();