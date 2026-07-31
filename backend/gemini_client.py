import requests

from config import GEMINI_API_KEY

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


def query_market_price(product_name):
    prompt = (
        f'Pesquise o preço de mercado no Brasil para o produto: "{product_name}". '
        "Informe uma faixa de preço aproximada (mínimo e máximo) e cite as fontes."
    )

    response = requests.post(
        GEMINI_URL,
        headers={
            "x-goog-api-key": GEMINI_API_KEY,
            "Content-Type": "application/json"
        },
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "tools": [{"google_search": {}}]
        },
        timeout=30
    )
    response.raise_for_status()
    data = response.json()

    candidate = data["candidates"][0]
    text = candidate["content"]["parts"][0]["text"]

    metadata = candidate.get("groundingMetadata", {})
    sources = [
        {
            "title": chunk.get("web", {}).get("title"),
            "url": chunk.get("web", {}).get("uri")
        }
        for chunk in metadata.get("groundingChunks", [])
    ]

    return {"response": text, "sources": sources}