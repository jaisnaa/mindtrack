import requests, os
from dotenv import load_dotenv
load_dotenv()

key = os.getenv("HUGGINGFACE_API_KEY")
print("Key found:", key[:15] if key else "NOT FOUND")

url = "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english"
r = requests.post(url, headers={"Authorization": f"Bearer {key}"}, json={"inputs": "I feel so happy today!"})
print("Status:", r.status_code)
print("Response:", r.json())