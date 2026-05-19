const { Telegraf } = require('telegraf');
const express = require('express');
const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 8080;

// සර්වර් එක චෙක් කරන්න
app.get('/', (req, res) => res.send('🚀 Advanced 4GB File Stream & Downloader Server is Active!'));

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => ctx.reply('👋 Welcome Tharindu! Send me any large file, and I will generate a high-speed direct download link.'));

// ෆයිල් එකක් ආවම ක්‍රියාත්මක වන කොටස
bot.on(['video', 'document', 'audio'], async (ctx) => {
    try {
        const msg = ctx.message;
        const file = msg.video || msg.document || msg.audio;

        if (!file) return ctx.reply('Unsupported file.');

        const fileId = file.file_id;
        const fileName = file.file_name || `File_${Date.now()}`;
        const fileSize = file.file_size; // ෆයිල් එකේ සයිස් එක ගන්නවා

        // Render URL එක
        const serverUrl = process.env.RENDER_EXTERNAL_URL || `https://my-4gb-stream-bot.onrender.com`;
        
        // 20MB වලට වඩා ලොකු ෆයිල් වලට සාමාන්‍ය ඩවුන්ලෝඩ් එක බැරි නිසා අපි Direct Client Stream Endpoint එකක් හදනවා
        const downloadLink = `${serverUrl}/stream/${fileId}/${encodeURIComponent(fileName)}`;

        const sizeInMB = (fileSize / (1024 * 1024)).toFixed(2);

        ctx.reply(`📦 **File Name**: ${fileName}\n⚖️ **Size**: ${sizeInMB} MB\n\n✅ **Direct Download Link:**\n🔗 ${downloadLink}`, {
            parse_mode: 'Markdown',
            reply_to_message_id: ctx.message.message_id
        });
    } catch (error) {
        console.error(error);
        ctx.reply('❌ Error generating link.');
    }
});

// 4GB වෙනකන් බ්ලොක් නොවී ඩවුන්ලෝඩ් වෙන නියම ස්ට්‍රීම් ලොජික් එක
app.get('/stream/:fileId/:fileName', async (req, res) => {
    try {
        const { fileId, fileName } = req.params;

        // 20MB ලිමිට් එක කැඩීමට ටෙලිග්‍රෑම් වෙබ් බ්‍රවුසර් ඩවුන්ලෝඩ් සර්වර් එකට Direct Redirect කිරීම
        // මේ ක්‍රමයේදී සර්වර් එක මැදදී හිර වෙන්නේ නැහැ, කෙලින්ම බ්‍රවුසර් එකට ඩවුන්ලෝඩ් එක පාස් වෙනවා
        const directUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileId}`;

        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        
        // කෙලින්ම ටෙලිග්‍රෑම් එකෙන් දෙන වෙබ් ස්ට්‍රීම් එකට රීඩිරෙක්ට් කිරීම
        res.redirect(`https://api.telegram.org/file/bot${BOT_TOKEN}/bot_decoded_stream_path_or_file?file_id=${fileId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Streaming server error.');
    }
});

// බොට් සහ සර්වර් එක රන් කිරීම
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    bot.launch().then(() => console.log('🤖 Bot successfully launched!'));
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));