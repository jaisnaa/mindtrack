from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import SessionLocal, User, JournalEntry, CheckIn, create_tables
from auth import hash_password, verify_password, create_token, decode_token
import json
from groq import Groq
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()
GROQ_KEY = os.getenv("GROQ_API_KEY")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)
create_tables()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ✅ FIXED: Header(None) + proper null checks
def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "").strip()
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ─────────────────────────────────────────────
# SENTIMENT  (Groq)
# ─────────────────────────────────────────────
def analyze_sentiment(text: str):
    try:
        client = Groq(api_key=GROQ_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile", max_tokens=20,
            messages=[
                {"role": "system", "content": 'You are a sentiment analyzer. Reply with ONLY a JSON object like: {"label": "Positive", "score": 92} — label must be exactly Positive, Negative, or Neutral. score is 0-100. No extra text.'},
                {"role": "user",   "content": f"Analyze the sentiment of this text: {text}"}
            ]
        )
        raw = response.choices[0].message.content.strip()
        print("GROQ SENTIMENT RAW:", raw)
        result = json.loads(raw)
        label = result.get("label", "Neutral")
        score = float(result.get("score", 50))
        print(f"SENTIMENT → {label} {score}%")
        return {"label": label, "score": score}
    except Exception as e:
        print(f"SENTIMENT ERROR: {e}")
        return {"label": "Neutral", "score": 50.0}

# ─────────────────────────────────────────────
# SUGGESTIONS  (Groq)
# ─────────────────────────────────────────────
def get_suggestions(sleep: int, stress: int, energy: int):
    try:
        client = Groq(api_key=GROQ_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile", max_tokens=300,
            messages=[
                {"role": "system", "content": "You are a mental wellness coach. Give short, practical, warm suggestions."},
                {"role": "user",   "content": f"""A user has these wellness scores today:
- Sleep quality: {sleep}/10
- Stress level: {stress}/10
- Energy level: {energy}/10
Give exactly 3 short, practical, personalized suggestions. Format as a numbered list. Keep each under 2 sentences. Be warm."""}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"GROQ SUGGESTIONS ERROR: {e}")
        return "1. Take a few deep breaths and drink some water.\n2. Step outside for 10 minutes.\n3. Be kind to yourself today."

# ─────────────────────────────────────────────
# PYDANTIC MODELS
# ─────────────────────────────────────────────
class AuthInput(BaseModel):
    email: str
    password: str

class JournalInput(BaseModel):
    content: str

class CheckInInput(BaseModel):
    sleep_score: int
    stress_score: int
    energy_score: int

class ChatInput(BaseModel):
    message: str
    history: list = []

# ─────────────────────────────────────────────
# AUTH ROUTES
# ─────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "MindTrack API running"}

@app.post("/register")
def register(data: AuthInput, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, "Email already registered")
    user = User(email=data.email, password_hash=hash_password(data.password))
    db.add(user); db.commit(); db.refresh(user)
    return {"token": create_token(user.id)}

@app.post("/login")
def login(data: AuthInput, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    return {"token": create_token(user.id)}

# ─────────────────────────────────────────────
# JOURNAL ROUTES
# ─────────────────────────────────────────────
@app.post("/entry")
def create_entry(data: JournalInput, user=Depends(get_current_user), db: Session = Depends(get_db)):
    sentiment = analyze_sentiment(data.content)
    entry = JournalEntry(
        user_id=user.id, content=data.content,
        sentiment_score=sentiment["score"], sentiment_label=sentiment["label"]
    )
    db.add(entry); db.commit(); db.refresh(entry)
    return entry

@app.get("/entries")
def get_entries(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(JournalEntry).filter(JournalEntry.user_id == user.id).all()

# ─────────────────────────────────────────────
# CHECK-IN ROUTES
# ─────────────────────────────────────────────
@app.post("/checkin")
def create_checkin(data: CheckInInput, user=Depends(get_current_user), db: Session = Depends(get_db)):
    checkin = CheckIn(user_id=user.id, **data.model_dump())
    db.add(checkin); db.commit(); db.refresh(checkin)
    suggestions = get_suggestions(data.sleep_score, data.stress_score, data.energy_score)
    return {"checkin": checkin, "suggestions": suggestions}

# ─────────────────────────────────────────────
# CHAT
# ─────────────────────────────────────────────
@app.post("/chat")
def chat(data: ChatInput, user=Depends(get_current_user)):
    try:
        client = Groq(api_key=GROQ_KEY)
        messages = [{"role": "system", "content": "You are MindTrack's wellness companion. You are warm, empathetic, and supportive. Help users with their mental health and wellbeing. Keep responses concise and caring. Never replace professional help but always be a supportive presence."}]
        for msg in data.history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": data.message})
        response = client.chat.completions.create(model="llama-3.3-70b-versatile", max_tokens=500, messages=messages)
        return {"reply": response.choices[0].message.content}
    except Exception as e:
        print(f"GROQ CHAT ERROR: {e}")
        return {"reply": "I'm here for you. Sometimes I have trouble connecting — please try again in a moment."}

# ─────────────────────────────────────────────
# MOOD ALERT
# ─────────────────────────────────────────────
@app.get("/mood-alert")
def mood_alert(user=Depends(get_current_user), db: Session = Depends(get_db)):
    two_weeks_ago = datetime.utcnow() - timedelta(days=14)
    checkins = db.query(CheckIn).filter(CheckIn.user_id == user.id, CheckIn.date >= two_weeks_ago).all()
    if len(checkins) < 3:
        return {"level": "green", "message": "Keep checking in daily!"}
    avg_stress = sum(c.stress_score for c in checkins) / len(checkins)
    avg_energy = sum(c.energy_score for c in checkins) / len(checkins)
    avg_sleep  = sum(c.sleep_score  for c in checkins) / len(checkins)
    score = (avg_sleep + (10 - avg_stress) + avg_energy) / 3
    if score < 4:
        return {"level": "red",    "message": "You've been struggling lately. Please consider talking to someone you trust."}
    elif score < 6:
        return {"level": "yellow", "message": "Your mood has been a bit low. Remember to take care of yourself."}
    return {"level": "green", "message": "You're doing well! Keep it up."}

# ─────────────────────────────────────────────
# DASHBOARD ENDPOINTS
# ─────────────────────────────────────────────
@app.get("/dashboard/stats")
def dashboard_stats(user=Depends(get_current_user), db: Session = Depends(get_db)):
    total_entries  = db.query(JournalEntry).filter(JournalEntry.user_id == user.id).count()
    total_checkins = db.query(CheckIn).filter(CheckIn.user_id == user.id).count()

    # streak
    all_checkins = db.query(CheckIn).filter(CheckIn.user_id == user.id).order_by(CheckIn.date.desc()).all()
    streak = 0
    if all_checkins:
        check_dates = sorted(
            set(c.date.date() if hasattr(c.date, "date") else c.date for c in all_checkins),
            reverse=True
        )
        expected = datetime.utcnow().date()
        for d in check_dates:
            if d == expected:
                streak += 1
                expected -= timedelta(days=1)
            elif d < expected:
                break

    # week check-ins
    week_ago = datetime.utcnow() - timedelta(days=7)
    week_checkins = db.query(CheckIn).filter(CheckIn.user_id == user.id, CheckIn.date >= week_ago).count()

    # avg sentiment last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent = db.query(JournalEntry).filter(JournalEntry.user_id == user.id, JournalEntry.created_at >= seven_days_ago).all()
    if recent:
        pos = sum(1 for e in recent if e.sentiment_label == "Positive")
        neg = sum(1 for e in recent if e.sentiment_label == "Negative")
        avg_sentiment = f"😊 Positive ({pos}/{len(recent)})" if pos >= neg else f"😞 Negative ({neg}/{len(recent)})"
    else:
        avg_sentiment = "No entries yet"

    return {
        "streak": streak,
        "total_entries": total_entries,
        "total_checkins": total_checkins,
        "avg_sentiment": avg_sentiment,
        "week_checkins": week_checkins,
    }

@app.get("/dashboard/checkins")
def dashboard_checkins(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(CheckIn).filter(CheckIn.user_id == user.id).order_by(CheckIn.date.desc()).limit(30).all()

@app.get("/dashboard/quote")
def dashboard_quote(user=Depends(get_current_user)):
    try:
        client = Groq(api_key=GROQ_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile", max_tokens=80,
            messages=[
                {"role": "system", "content": 'You are a wellness quote generator. Reply with ONLY a JSON object like: {"quote": "your quote here", "author": "Author Name"} — a short, uplifting mental wellness quote. No extra text.'},
                {"role": "user",   "content": "Give me one short motivational mental wellness quote."}
            ]
        )
        raw = response.choices[0].message.content.strip()
        result = json.loads(raw)
        return result
    except Exception as e:
        print(f"QUOTE ERROR: {e}")
        return {"quote": "You don't have to be perfect to be worthy of love and care.", "author": "MindTrack"}