from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: str
    department: Optional[str] = "Computer Science & Engineering"
    is_active: Optional[bool] = True
    is_locked: Optional[bool] = False

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None
    is_locked: Optional[bool] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

