from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.libs.argon2_helper import argon2_helper
from app.middleware import verify_api_key

router = APIRouter(prefix="/crypto", tags=["Authentication Crypto"])

class HashPasswordRequest(BaseModel):
    password: str

class HashPasswordResponse(BaseModel):
    hash: str

class VerifyPasswordRequest(BaseModel):
    hash: str
    password: str

class VerifyPasswordResponse(BaseModel):
    valid: bool
    needs_rehash: bool

@router.post("/hash-password", response_model=HashPasswordResponse)
async def hash_password(
    request: HashPasswordRequest,
    _: bool = Depends(verify_api_key)
):
    """Hash a password using Argon2id"""
    try:
        hash_string = argon2_helper.hash_password(request.password)
        return HashPasswordResponse(hash=hash_string)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify-password", response_model=VerifyPasswordResponse)
async def verify_password(
    request: VerifyPasswordRequest,
    _: bool = Depends(verify_api_key)
):
    """Verify a password against an Argon2 hash"""
    try:
        result = argon2_helper.verify_password(request.hash, request.password)
        return VerifyPasswordResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))