from argon2 import PasswordHasher, Type
from argon2.exceptions import VerifyMismatchError, InvalidHash
from app.config import settings
import secrets

class Argon2Helper:
    def __init__(self):
        self.hasher = PasswordHasher(
            time_cost=settings.argon2_time_cost,
            memory_cost=settings.argon2_memory_cost,
            parallelism=settings.argon2_parallelism,
            hash_len=settings.argon2_hash_len,
            salt_len=settings.argon2_salt_len,
            type=Type.ID  # Argon2id
        )
    
    def hash_password(self, password: str) -> str:
        """
        Hash a password using Argon2id
        Returns: Argon2 hash string (contains salt and parameters)
        """
        if not password:
            raise ValueError("Password cannot be empty")
        
        return self.hasher.hash(password)
    
    def verify_password(self, hash_string: str, password: str) -> dict:
        """
        Verify a password against an Argon2 hash
        Returns: {valid: bool, needs_rehash: bool}
        """
        try:
            self.hasher.verify(hash_string, password)
            needs_rehash = self.hasher.check_needs_rehash(hash_string)
            return {
                "valid": True,
                "needs_rehash": needs_rehash
            }
        except VerifyMismatchError:
            return {
                "valid": False,
                "needs_rehash": False
            }
        except InvalidHash:
            raise ValueError("Invalid hash format")

# Singleton instance
argon2_helper = Argon2Helper()