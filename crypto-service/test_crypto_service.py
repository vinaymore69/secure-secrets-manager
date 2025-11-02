import requests
import base64
import json

BASE_URL = "http://localhost:8000"
API_KEY = "dev_secret_key_change_in_prod"
HEADERS = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

def test_password_hashing():
    print("\n=== Testing Password Hashing ===")
    
    # Hash password
    response = requests.post(
        f"{BASE_URL}/crypto/hash-password",
        headers=HEADERS,
        json={"password": "MySecurePassword123!"}
    )
    print(f"Hash Response: {response.status_code}")
    hash_result = response.json()
    print(f"Hash: {hash_result['hash'][:50]}...")
    
    # Verify correct password
    response = requests.post(
        f"{BASE_URL}/crypto/verify-password",
        headers=HEADERS,
        json={
            "hash": hash_result['hash'],
            "password": "MySecurePassword123!"
        }
    )
    verify_result = response.json()
    print(f"Verify Correct Password: {verify_result}")
    assert verify_result['valid'] == True
    
    # Verify incorrect password
    response = requests.post(
        f"{BASE_URL}/crypto/verify-password",
        headers=HEADERS,
        json={
            "hash": hash_result['hash'],
            "password": "WrongPassword"
        }
    )
    verify_result = response.json()
    print(f"Verify Wrong Password: {verify_result}")
    assert verify_result['valid'] == False

def test_envelope_encryption():
    print("\n=== Testing Envelope Encryption ===")
    
    # Generate DEK
    response = requests.post(
        f"{BASE_URL}/crypto/generate-dek",
        headers=HEADERS,
        json={"length": 32}
    )
    dek_result = response.json()
    dek = dek_result['dek']
    print(f"Generated DEK: {dek[:20]}...")
    
    # Encrypt data
    plaintext = "This is my secret data!"
    plaintext_b64 = base64.b64encode(plaintext.encode()).decode()
    
    response = requests.post(
        f"{BASE_URL}/crypto/encrypt",
        headers=HEADERS,
        json={
            "dek": dek,
            "plaintext": plaintext_b64
        }
    )
    encrypt_result = response.json()
    print(f"Encryption successful: {encrypt_result['algorithm']}")
    
    # Decrypt data
    response = requests.post(
        f"{BASE_URL}/crypto/decrypt",
        headers=HEADERS,
        json={
            "dek": dek,
            "ciphertext": encrypt_result['ciphertext'],
            "nonce": encrypt_result['nonce'],
            "tag": encrypt_result['tag']
        }
    )
    decrypt_result = response.json()
    decrypted = base64.b64decode(decrypt_result['plaintext']).decode()
    print(f"Decrypted: {decrypted}")
    assert decrypted == plaintext
    
    # Wrap DEK
    response = requests.post(
        f"{BASE_URL}/crypto/wrap-dek",
        headers=HEADERS,
        json={
            "dek": dek,
            "kms_key_id": "dev-master-key"
        }
    )
    wrap_result = response.json()
    print(f"DEK Wrapped: {wrap_result['encrypted_dek'][:20]}...")
    
    # Unwrap DEK
    response = requests.post(
        f"{BASE_URL}/crypto/unwrap-dek",
        headers=HEADERS,
        json={
            "encrypted_dek": wrap_result['encrypted_dek'],
            "kms_key_id": "dev-master-key"
        }
    )
    unwrap_result = response.json()
    print(f"DEK Unwrapped: {unwrap_result['dek'][:20]}...")
    assert unwrap_result['dek'] == dek

if __name__ == "__main__":
    try:
        test_password_hashing()
        test_envelope_encryption()
        print("\n✅ All tests passed!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")