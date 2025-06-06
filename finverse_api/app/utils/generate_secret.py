import secrets
import base64
import hashlib

def generate_hs256_secret():
    # Sinh ra 256-bit (32 bytes) ngẫu nhiên
    key = secrets.token_bytes(32)
    return base64.urlsafe_b64encode(key).decode()

def derive_refresh_key(secret_key: str):
    """
    Sinh REFRESH_SECRET_KEY từ SECRET_KEY theo cách cố định nhưng riêng biệt,
    tránh trùng lặp khóa với access token.
    """
    base = secret_key.encode()
    derived = hashlib.sha256(b"refresh" + base).digest()
    return base64.urlsafe_b64encode(derived).decode()

if __name__ == "__main__":
    print("🔐 Generating secure JWT keys...")
    access_key = generate_hs256_secret()
    refresh_key = derive_refresh_key(access_key)

    print(f"\n✅ Use the following keys in your .env or settings:")
    print(f"SECRET_KEY = \"{access_key}\"")
    print(f"REFRESH_SECRET_KEY = \"{refresh_key}\"")
