const { Telegraf } = require('telegraf');
const express = require('express');
const axios = require('axios');
const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 8080;

// Render එක ලයිව් තියාගන්න සහ සර්වර් එක චෙක් කරන්න මූලික පිටුව
app.get('/', (req, res) => res.send('🚀 4GB File Stream & Downloader Server is Running Safely!'));

// Bot සෙටප් එක
const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => ctx.reply('Welcome! Send me any Telegram File, and I will give you a Direct Download Link.'));

// යූසර් කෙනෙක් ෆයිල් එකක් (Document/Video/Audio) එවපුවම ක්‍රියාත්මක වන කොටස
bot.on(['video', 'document', 'audio', 'photo'], async (ctx) => {
    try {
        const message = ctx.message;
        const fileType = message.video || message.document || message.audio || (message.photo && message.photo[message.photo.length - 1]);
        
        if (!fileType) return ctx.reply('Unsupported file format.');

        const fileId = fileType.file_id;
        const fileName = fileType.file_name || `file_${Date.now()}`;
        
        // Render එකේ දැනට තියෙන ඔයාගේ සර්වර් URL එක (https://my-4gb-stream-bot.onrender.com)
        const serverUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
        const downloadLink = `${serverUrl}/download/${fileId}/${encodeURIComponent(fileName)}`;

        ctx.reply(`✅ Here is your Direct Download Link:\n\n🔗 ${downloadLink}`, {
            reply_to_message_id: ctx.message.message_id
        });
    } catch (error) {
        console.error(error);
        ctx.reply('❌ Error generating link.');
    }
});

// බ්‍රවුසර් එකෙන් හෝ ඩවුන්ලෝඩර් එකකින් ලින්ක් එක ඔබපුවම ෆයිල් එක stream/download වෙන තැන
app.get('/download/:fileId/:fileName', async (req, res) => {
    try {
        const { fileId, fileName } = req.params;
        
        // Telegram සර්වර් එකෙන් ෆයිල් එක තියෙන ඇත්තම පාත් එක ගන්නවා
        const fileInfo = await bot.telegram.getFile(fileId);
        const telegramFilePath = fileInfo.file_path;
        const directTelegramUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${telegramFilePath}`;

        // Header සෙටප් එක (බ්‍රවුසර් එකට මේක ඩවුන්ලෝඩ් කරන්න කියලා අණ දීම)
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        // ෆයිල් එක බෆර් නොකර කෙලින්ම යූසර්ට Stream (Pipe) කිරීම (4GB වෙනකන් ඔරොත්තු දෙන්නේ මේ නිසා)
        const response = await axios({
            method: 'get',
            url: directTelegramUrl,
            responseType: 'stream'
        });

        response.data.pipe(res);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error streaming file from Telegram.');
    }
});

// සර්වර් එක සහ බොට් එක පණ ගැන්වීම
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    bot.launch().then(() => console.log('🤖 Telegram Bot is actively listening!'));
});

// ආරක්ෂිතව බොට්ව නවත්වන්න
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));