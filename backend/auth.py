import hashlib
import hmac
import os
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "mindtrack-secret-key-change-later"
ALGORITHM = "HS256"

def hash_password(password):
    salt = os.urandom(16).hex()
    hashed = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{hashed}"

def verify_password(plain, hashed):
    salt, stored_hash = hashed.split(":")
    return hmac.compare_digest(
        hashlib.sha256((plain + salt).encode()).hexdigest(),
        stored_hash
    )

def create_token(user_id: int):
    expire = datetime.utcnow() + timedelta(days=7)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, ALGORITHM)

def decode_token(token: str):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return int(payload["sub"])