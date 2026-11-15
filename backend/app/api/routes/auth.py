from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.models.security import AuditLog
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.user import UserOut
from app.detection.engine import UserBehaviorAnalyticsEngine

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    uba = UserBehaviorAnalyticsEngine(db)
    user = db.query(User).filter(User.username == payload.username).first()
    
    if not user:
        # Track failed attempt for unknown user or brute-force probe
        uba.evaluate_login_attempt(
            username=payload.username,
            ip_address=payload.ip_address or "127.0.0.1",
            is_success=False,
            user_agent=payload.user_agent or "Web Browser"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is locked due to excessive failed attempts. Contact Security Administrator."
        )

    if not verify_password(payload.password, user.hashed_password):
        user.failed_login_count += 1
        if user.failed_login_count >= 5:
            user.is_locked = True
        db.commit()

        uba.evaluate_login_attempt(
            username=payload.username,
            ip_address=payload.ip_address or "127.0.0.1",
            is_success=False,
            user_agent=payload.user_agent or "Web Browser"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    # Successful login
    user.failed_login_count = 0
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    # Behavioral analytics check
    uba.evaluate_login_attempt(
        username=payload.username,
        ip_address=payload.ip_address or "127.0.0.1",
        is_success=True,
        user_agent=payload.user_agent or "Web Browser"
    )

    # Audit log
    audit = AuditLog(
        username=user.username,
        user_role=user.role,
        action="LOGIN_SUCCESS",
        resource="AUTH_SERVICE",
        ip_address=payload.ip_address or "127.0.0.1"
    )
    db.add(audit)
    db.commit()

    token = create_access_token(subject=user.username, role=user.role)
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        role=user.role,
        full_name=user.full_name,
        department=user.department
    )

@router.post("/register", response_model=UserOut)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        (User.username == payload.username) | (User.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    # Safeguard role assignment: public registration defaults to Student or Faculty
    assigned_role = payload.role if payload.role in ["Faculty", "Student"] else "Student"

    user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=assigned_role,
        department=payload.department or "Computer Science & Engineering"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    audit = AuditLog(
        username=user.username,
        user_role=user.role,
        action="USER_REGISTRATION",
        resource="USER_SERVICE",
        details_json=f'{{"role": "{assigned_role}"}}'
    )
    db.add(audit)
    db.commit()

    return user

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    audit = AuditLog(
        username=current_user.username,
        user_role=current_user.role,
        action="LOGOUT",
        resource="AUTH_SERVICE"
    )
    db.add(audit)
    db.commit()
    return {"message": "Logged out successfully"}
