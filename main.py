import os
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from telethon import TelegramClient

# ⚙️ ඔයා ලබාදුන් නිවැරදි විස්තර සහ අලුත් චැනල් ID එක ඇතුලත් කර ඇත
API_ID = 36130475  
API_HASH = "94fa20937754a3bbe85ade6441ecace4"  
BOT_TOKEN = "8961189305:AAE2IByMuTjT-sNVV8PibBADswaPWZPNa3g"  
OWNER_ID = "-1003949193683"  # 👈 ඔයාගේ අලුත්ම චැනල් ID එක

app = FastAPI()
client = TelegramClient('bot_session', API_ID, API_HASH)

@app.get("/")
def read_root():
    return {"status": "🚀 Pure Python MTProto 4GB Stream Server is Online!"}

@app.head("/")
async def head_root():
    return None

# Chunk වශයෙන් ස්ට්‍රීම් කරන generator එක
async def stream_generator(download_iter):
    async for chunk in download_iter:
        yield chunk

@app.get("/download/{msg_id}/{file_name}")
async def download_file(msg_id: int, file_name: str):
    try:
        peer = int(OWNER_ID) if OWNER_ID.isdigit() or OWNER_ID.startswith('-') else OWNER_ID
        
        # ටෙලිග්‍රෑම් එකෙන් මැසේජ් එක කියවීම
        msg = await client.get_messages(peer, ids=msg_id)
        
        if not msg or not msg.media:
            raise HTTPException(status_code=404, detail="Media not found")

        # ෆයිල් සයිස් එක චෙක් කිරීම
        file_size = msg.document.size if msg.document else (msg.video.size if msg.video else None)
        if not file_size:
            raise HTTPException(status_code=400, detail="Invalid media type")

        # Telethon නිවැරදි ස්ට්‍රීඩින් මෙතඩ් එක
        download_iter = client.iter_download(msg.media, request_size=512 * 1024)

        headers = {
            "Content-Disposition": f'attachment; filename="{file_name}"',
            "Content-Length": str(file_size),
            "Content-Type": "application/octet-stream"
        }

        return StreamingResponse(stream_generator(download_iter), headers=headers)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# බොට් සර්වර් එකට ලොග් කරවීම සහ චැනල් එක Cache කරවීම (Strict Integer Fix)
@app.on_event("startup")
async def startup_event():
    try:
        print("🤖 Starting Telethon Client...")
        await client.start(bot_token=BOT_TOKEN)
        print("✅ 100% Successfully logged in as Bot via Telethon!")
        
        # ටෙලිග්‍රෑම් එකට String අඳුරගන්න බැරි නිසා කෙලින්ම Integer එකක් බවට හරවනවා
        channel_id_int = int(OWNER_ID)
        
        print(f"🔄 Trying to resolve channel entity for ID: {channel_id_int}")
        await client.get_entity(channel_id_int)
        print("📁 [SUCCESS] Channel Entity cached and ready for streaming!")
        
    except Exception as e:
        print(f"⚠️ Startup Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)