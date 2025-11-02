import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from typing import Tuple, Optional

class AEADHelper:
    """
    Authenticated Encryption with Associated Data helper
    Uses AES-256-GCM
    """
    
    @staticmethod
    def generate_key(length: int = 32) -> bytes:
        """Generate a random key of specified length"""
        if length not in [16, 24, 32]:  # AES-128, 192, 256
            raise ValueError("Key length must be 16, 24, or 32 bytes")
        return os.urandom(length)
    
    @staticmethod
    def generate_nonce(length: int = 12) -> bytes:
        """Generate a random nonce (96 bits recommended for GCM)"""
        return os.urandom(length)
    
    @staticmethod
    def encrypt(
        key: bytes,
        plaintext: bytes,
        associated_data: Optional[bytes] = None,
        nonce: Optional[bytes] = None
    ) -> Tuple[bytes, bytes, bytes]:
        """
        Encrypt plaintext using AES-GCM
        Returns: (ciphertext, nonce, tag)
        Note: AESGCM automatically appends tag to ciphertext
        """
        if len(key) not in [16, 24, 32]:
            raise ValueError("Invalid key length")
        
        if nonce is None:
            nonce = AEADHelper.generate_nonce()
        
        aesgcm = AESGCM(key)
        ciphertext_with_tag = aesgcm.encrypt(nonce, plaintext, associated_data)
        
        # AESGCM appends 16-byte tag to ciphertext
        ciphertext = ciphertext_with_tag[:-16]
        tag = ciphertext_with_tag[-16:]
        
        return ciphertext, nonce, tag
    
    @staticmethod
    def decrypt(
        key: bytes,
        ciphertext: bytes,
        nonce: bytes,
        tag: bytes,
        associated_data: Optional[bytes] = None
    ) -> bytes:
        """
        Decrypt ciphertext using AES-GCM
        Returns: plaintext
        Raises: cryptography.exceptions.InvalidTag if authentication fails
        """
        if len(key) not in [16, 24, 32]:
            raise ValueError("Invalid key length")
        
        aesgcm = AESGCM(key)
        ciphertext_with_tag = ciphertext + tag
        
        plaintext = aesgcm.decrypt(nonce, ciphertext_with_tag, associated_data)
        return plaintext

# Singleton instance
aead_helper = AEADHelper()