from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import base64
from app.libs.aead import aead_helper
from app.libs.kms_mock import mock_kms
from app.config import settings
from app.middleware import verify_api_key

router = APIRouter(prefix="/crypto", tags=["Envelope Encryption"])

class GenerateDEKRequest(BaseModel):
    length: int = 32  # 256 bits

class GenerateDEKResponse(BaseModel):
    dek: str  # base64 encoded

class EncryptRequest(BaseModel):
    dek: str  # base64 encoded DEK
    plaintext: str  # base64 encoded plaintext
    aad: Optional[str] = None  # base64 encoded associated data

class EncryptResponse(BaseModel):
    ciphertext: str  # base64
    nonce: str  # base64
    tag: str  # base64
    algorithm: str

class DecryptRequest(BaseModel):
    dek: str  # base64
    ciphertext: str  # base64
    nonce: str  # base64
    tag: str  # base64
    aad: Optional[str] = None  # base64

class DecryptResponse(BaseModel):
    plaintext: str  # base64

class WrapDEKRequest(BaseModel):
    dek: str  # base64 encoded DEK
    kms_key_id: str = settings.kms_key_id

class WrapDEKResponse(BaseModel):
    encrypted_dek: str  # base64
    kms_key_id: str
    algorithm: str

class UnwrapDEKRequest(BaseModel):
    encrypted_dek: str  # base64
    kms_key_id: str = settings.kms_key_id

class UnwrapDEKResponse(BaseModel):
    dek: str  # base64

@router.post("/generate-dek", response_model=GenerateDEKResponse)
async def generate_dek(
    request: GenerateDEKRequest,
    _: bool = Depends(verify_api_key)
):
    """Generate a random Data Encryption Key"""
    try:
        dek = aead_helper.generate_key(request.length)
        return GenerateDEKResponse(dek=base64.b64encode(dek).decode('utf-8'))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/encrypt", response_model=EncryptResponse)
async def encrypt_data(
    request: EncryptRequest,
    _: bool = Depends(verify_api_key)
):
    """Encrypt plaintext using AES-GCM with provided DEK"""
    try:
        # Decode inputs
        dek = base64.b64decode(request.dek)
        plaintext = base64.b64decode(request.plaintext)
        aad = base64.b64decode(request.aad) if request.aad else None
        
        # Encrypt
        ciphertext, nonce, tag = aead_helper.encrypt(dek, plaintext, aad)
        
        return EncryptResponse(
            ciphertext=base64.b64encode(ciphertext).decode('utf-8'),
            nonce=base64.b64encode(nonce).decode('utf-8'),
            tag=base64.b64encode(tag).decode('utf-8'),
            algorithm="AES-256-GCM"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/decrypt", response_model=DecryptResponse)
async def decrypt_data(
    request: DecryptRequest,
    _: bool = Depends(verify_api_key)
):
    """Decrypt ciphertext using AES-GCM with provided DEK"""
    try:
        # Decode inputs
        dek = base64.b64decode(request.dek)
        ciphertext = base64.b64decode(request.ciphertext)
        nonce = base64.b64decode(request.nonce)
        tag = base64.b64decode(request.tag)
        aad = base64.b64decode(request.aad) if request.aad else None
        
        # Decrypt
        plaintext = aead_helper.decrypt(dek, ciphertext, nonce, tag, aad)
        
        return DecryptResponse(
            plaintext=base64.b64encode(plaintext).decode('utf-8')
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/wrap-dek", response_model=WrapDEKResponse)
async def wrap_dek(
    request: WrapDEKRequest,
    _: bool = Depends(verify_api_key)
):
    """Wrap (encrypt) a DEK using KMS master key"""
    try:
        # Decode DEK
        dek = base64.b64decode(request.dek)
        
        # Wrap using KMS
        result = mock_kms.wrap_key(request.kms_key_id, dek)
        
        return WrapDEKResponse(
            encrypted_dek=result["encrypted_key"],
            kms_key_id=result["key_id"],
            algorithm=result["algorithm"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/unwrap-dek", response_model=UnwrapDEKResponse)
async def unwrap_dek(
    request: UnwrapDEKRequest,
    _: bool = Depends(verify_api_key)
):
    """Unwrap (decrypt) a DEK using KMS master key"""
    try:
        # Unwrap using KMS
        dek = mock_kms.unwrap_key(request.kms_key_id, request.encrypted_dek)
        
        return UnwrapDEKResponse(
            dek=base64.b64encode(dek).decode('utf-8')
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))