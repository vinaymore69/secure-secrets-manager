from pydantic_settings import BaseSettings
from typing import Literal

class Settings(BaseSettings):
    # App settings
    app_name: str = "Crypto Service"
    app_version: str = "1.0.0"
    api_key: str = "dev_secret_key_change_in_prod"
    
    # KMS settings
    kms_provider: Literal["mock", "aws", "gcp", "vault"] = "mock"
    kms_key_id: str = "dev-master-key"
    
    # Argon2 settings
    argon2_time_cost: int = 2
    argon2_memory_cost: int = 65536  # 64 MB
    argon2_parallelism: int = 4
    argon2_hash_len: int = 32
    argon2_salt_len: int = 16
    
    # AEAD settings
    aead_algorithm: str = "aes-256-gcm"
    dek_length: int = 32  # 256 bits
    nonce_length: int = 12  # 96 bits for GCM
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()