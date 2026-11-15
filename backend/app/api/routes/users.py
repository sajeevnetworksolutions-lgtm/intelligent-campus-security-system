from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.core.security import get_password_hash
from app.models.user import User
from app.models.security import AuditLog
from app.schemas.user import UserOut, UserCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["User Management"])

ADMIN_ROLES = ["Super Administrator"]

@router.get("", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Administrator", "Security Administrator"]))
):
    users = db.query(User).order_by(User.id.asc()).all()
    return users

@router.post("", response_model=UserOut)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN_ROLES))
):
    existing = db.query(User).filter(
        (User.username == payload.username) | (User.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        department=payload.department,
        is_active=payload.is_active,
        is_locked=payload.is_locked
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    audit = AuditLog(
        username=current_user.username,
        user_role=current_user.role,
        action="CREATE_USER",
        resource=f"USER:{user.username}"
    )
    db.add(audit)
    db.commit()
    return user

@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN_ROLES))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.email is not None:
        user.email = payload.email
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.role is not None:
        user.role = payload.role
    if payload.department is not None:
        user.department = payload.department
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.is_locked is not None:
        user.is_locked = payload.is_locked
        if not payload.is_locked:
            user.failed_login_count = 0
    if payload.password:
        user.hashed_password = get_password_hash(payload.password)

    db.commit()
    db.refresh(user)

    audit = AuditLog(
        username=current_user.username,
        user_role=current_user.role,
        action="UPDATE_USER",
        resource=f"USER:{user.username}"
    )
    db.add(audit)
    db.commit()
    return user

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN_ROLES))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own superadmin account")

    db.delete(user)
    db.commit()

    audit = AuditLog(
        username=current_user.username,
        user_role=current_user.role,
        action="DELETE_USER",
        resource=f"USER:{user.username}"
    )
    db.add(audit)
    db.commit()
    return {"message": f"User {user.username} deleted successfully"}
