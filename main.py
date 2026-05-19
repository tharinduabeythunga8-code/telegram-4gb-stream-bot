import os
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from telethon import TelegramClient

# ⚠️ ඔයාගේ විස්තර ටික මෙතනට කෙලින්ම දෙන්න
API_ID = 36130475  # 👈 ඔයාගේ API ID එක (Number එකක් විදිහට)
API_HASH = "94fa20937754a3bbe85ade6441ecace4"  # 👈 ඔයාගේ API HASH එක
BOT_TOKEN = "8961189305:AAE2IByMuTjT-sNVV8PibBADswaPWZPNa3g"  # 👈 BotFather ගෙන් ගත්ත BOT TOKEN එක
OWNER_ID = "-1001816353852"  # 👈 ඔයාගේ ටෙලිග්‍රෑම් ID එක (හෝ චැනල් ID)

app = FastAPI()
client = TelegramClient('bot_session', API_ID, API_HASH)

@app.get("/")
def read_root():
    return {"status": "🚀 Pure Python MTProto 4GB Stream Server is Online!"}

# 4GB direct streaming logic
async def stream_generator(download_iter):
    async for chunk in download_iter:
        yield chunk

@app.get("/download/{msg_id}/{file_name}")
async def download_file(msg_id: int, file_name: str):
    try:
        # OWNER_ID එක string එකක් නම් integer එකක් බවට හරවයි
        peer = int(OWNER_ID) if OWNER_ID.isdigit() or OWNER_ID.startswith('-') else OWNER_ID
        
        # ටෙලිග්‍රෑම් එකෙන් මැසේජ් එක ගනියි
        msg = await client.get_messages(peer, ids=msg_id)
        
        if not msg or not msg.media:
            raise HTTPException(status_code=404, detail="Media not found")

        # ෆයිල් සයිස් එක ගනියි
        file_size = msg.document.size if msg.document else (msg.video.size if msg.video else None)
        if not file_size:
            raise HTTPException(status_code=400, detail="Invalid media type")

        # 4GB දක්වා Chunk වශයෙන් ස්ට්‍රීම් කිරීම පටන් ගනියි
        download_iter = client.iter_download_stream(msg.media, request_size=512 * 1024)

        headers = {
            "Content-Disposition": f'attachment; filename="{file_name}"',
            "Content-Length": str(file_size),
            "Content-Type": "application/octet-stream"
        }

        return StreamingResponse(stream_generator(download_iter), headers=headers)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# සර්වර් එක පණ ගැන්වීමට පෙර බොට් ලොග් කරවීම
@app.on_event("startup")
async def startup_event():
    print("🤖 Starting Telethon Client...")
    await client.start(bot_token=BOT_TOKEN)
    print("✅ 100% Successfully logged in as Bot via Telethon!")

if __name__ == "__main__":
    import uvicorn
    # Render එකට අවශ්‍ය Port එක සෙට් කිරීම
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)