import os
import base64
from typing import Dict
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

class MockKMS:
    """
    Mock KMS for development
    In production, replace with AWS KMS, GCP KMS, or HashiCorp Vault
    """
    
    def __init__(self):
        # In-memory storage of master keys
        # In production, these would be in actual KMS
        self.master_keys: Dict[str, bytes] = {}
        
        # Initialize default dev key
        self._initialize_dev_key()
    
    def _initialize_dev_key(self):
        """Create a default master key for development"""
        key_id = "dev-master-key"
        # In real KMS, this would be a 256-bit key stored securely
        # For dev, we generate a consistent key (NOT FOR PRODUCTION!)
        self.master_keys[key_id] = os.urandom(32)
    
    def wrap_key(self, key_id: str, plaintext_key: bytes) -> Dict:
        """
        Wrap (encrypt) a data encryption key with a master key
        Returns: {encrypted_key: base64, key_id: str, algorithm: str}
        """
        if key_id not in self.master_keys:
            raise ValueError(f"KMS key not found: {key_id}")
        
        master_key = self.master_keys[key_id]
        aesgcm = AESGCM(master_key)
        
        # Generate nonce for this wrap operation
        nonce = os.urandom(12)
        
        # Encrypt the DEK with the master key
        ciphertext = aesgcm.encrypt(nonce, plaintext_key, None)
        
        # Combine nonce + ciphertext for storage
        wrapped_key = nonce + ciphertext
        
        return {
            "encrypted_key": base64.b64encode(wrapped_key).decode('utf-8'),
            "key_id": key_id,
            "algorithm": "AES-256-GCM"
        }
    
    def unwrap_key(self, key_id: str, encrypted_key: str) -> bytes:
        """
        Unwrap (decrypt) a data encryption key using a master key
        Returns: plaintext_key (bytes)
        """
        if key_id not in self.master_keys:
            raise ValueError(f"KMS key not found: {key_id}")
        
        master_key = self.master_keys[key_id]
        aesgcm = AESGCM(master_key)
        
        # Decode the wrapped key
        wrapped_key = base64.b64decode(encrypted_key)
        
        # Extract nonce (first 12 bytes) and ciphertext
        nonce = wrapped_key[:12]
        ciphertext = wrapped_key[12:]
        
        # Decrypt to get the original DEK
        plaintext_key = aesgcm.decrypt(nonce, ciphertext, None)
        
        return plaintext_key
    
    def create_key(self, key_id: str) -> Dict:
        """Create a new master key"""
        if key_id in self.master_keys:
            raise ValueError(f"Key already exists: {key_id}")
        
        self.master_keys[key_id] = os.urandom(32)
        
        return {
            "key_id": key_id,
            "created": True,
            "algorithm": "AES-256"
        }

# Singleton instance
mock_kms = MockKMS()