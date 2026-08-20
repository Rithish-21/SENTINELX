import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
import random
import uuid

from fastapi import FastAPI, HTTPException, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models.schemas import (
    EventType,
    AttackStage,
    IngestEvent,
    RiskAssessment,
    GraphPayload,
    UserProfile,
    SendOtpRequest,
    VerifyOtpRequest,
    LoginRequest,
    AuthResponse,
    SecurityPolicyConfig,
    SocAnalyticsSummary,
)
from services.engine import engine, SentinelGraphEngine

app = FastAPI(
    title="SentinelX: AI Cyber Defense & Digital Trust Platform API",
    description="Real-time graph correlation, authentication, OTP verification, and account takeover containment engine.",
    version="2.0.0",
)

# Enable CORS for local Vite dev server and all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory User Database
USERS_DB: Dict[str, Dict] = {
    "USR-84920": {
        "user_id": "USR-84920",
        "name": "Alex Vance",
        "email": "alex.vance@sentinelx.security",
        "phone": "+1 (555) 948-2019",
        "password": "password123",
        "role": "VIP Chief Executive Officer",
        "department": "Executive Office",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "tier": "VIP_EXECUTIVE",
        "account_balance": "$1,450,000.00",
        "is_verified": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    "USR-10294": {
        "user_id": "USR-10294",
        "name": "Sarah Jenkins",
        "email": "sarah.jenkins@sentinelx.security",
        "phone": "+1 (555) 102-9482",
        "password": "password123",
        "role": "Lead Treasury Officer",
        "department": "Corporate Treasury & Wire",
        "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
        "tier": "TREASURY_ADMIN",
        "account_balance": "$8,920,500.00",
        "is_verified": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    "USR-55912": {
        "user_id": "USR-55912",
        "name": "David Chen",
        "email": "david.chen@sentinelx.security",
        "phone": "+1 (555) 559-1234",
        "password": "password123",
        "role": "Principal DevOps Architect",
        "department": "Infrastructure & Cloud Sec",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        "tier": "SYSTEM_ADMIN",
        "account_balance": "$320,000.00",
        "is_verified": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
}

# OTP Temporary In-Flight Store
OTP_SESSIONS: Dict[str, Dict] = {}

# Active Sessions / Tokens
ACTIVE_SESSIONS: Dict[str, str] = {}  # token -> user_id

# Global Security Policy
CURRENT_POLICY = SecurityPolicyConfig()


class ResetRequest(BaseModel):
    user_id: Optional[str] = None


class SimulateChainRequest(BaseModel):
    user_id: str = "USR-84920"
    step_delay_sec: float = 1.0
    auto_execute: bool = True


# =========================================================================
# Health & General
# =========================================================================

@app.get("/")
def root():
    return {
        "service": "SentinelX AI Cyber Defense Platform",
        "status": "ONLINE",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "SentinelX Graph Defense & Auth Engine",
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# =========================================================================
# Authentication & OTP Endpoints
# =========================================================================

@app.post("/api/v1/auth/signup/send-otp", response_model=AuthResponse)
def signup_send_otp(req: SendOtpRequest):
    """
    Initiates account registration by generating and dispatching a 6-digit OTP
    to either Email or Phone Number.
    """
    if req.channel == "email" and not req.email:
        raise HTTPException(status_code=400, detail="Email address is required for email verification.")
    if req.channel == "sms" and not req.phone:
        raise HTTPException(status_code=400, detail="Phone number is required for SMS verification.")

    destination = req.email if req.channel == "email" else req.phone

    # Check if user already exists
    for u in USERS_DB.values():
        if (req.email and u.get("email") == req.email) or (req.phone and u.get("phone") == req.phone):
            raise HTTPException(status_code=400, detail=f"An account with this {req.channel} already exists.")

    # Generate 6-digit OTP code
    otp_code = f"{random.randint(100000, 999999)}"
    otp_session_id = str(uuid.uuid4())
    expiry = datetime.now(timezone.utc) + timedelta(minutes=5)

    OTP_SESSIONS[otp_session_id] = {
        "otp_code": otp_code,
        "name": req.name,
        "channel": req.channel,
        "email": req.email,
        "phone": req.phone,
        "password": req.password,
        "role": req.role or "SOC Security Analyst",
        "department": req.department or "Cyber Threat Intelligence",
        "expires_at": expiry,
    }

    channel_name = "Email" if req.channel == "email" else "SMS"
    return AuthResponse(
        success=True,
        message=f"A 6-digit verification OTP has been dispatched via {channel_name} to {destination}.",
        otp_session_id=otp_session_id,
        debug_otp=otp_code,
        channel=req.channel,
        destination=destination,
        expires_in_seconds=300,
    )


@app.post("/api/v1/auth/signup/verify-otp", response_model=AuthResponse)
def signup_verify_otp(req: VerifyOtpRequest):
    """
    Verifies the 6-digit OTP, registers the new user in the database,
    and returns an authenticated session with a token.
    """
    session = OTP_SESSIONS.get(req.otp_session_id)
    if not session:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP session. Please request a new code.")

    if datetime.now(timezone.utc) > session["expires_at"]:
        del OTP_SESSIONS[req.otp_session_id]
        raise HTTPException(status_code=400, detail="Verification OTP has expired. Please request a new code.")

    if str(req.otp_code).strip() != str(session["otp_code"]).strip():
        raise HTTPException(status_code=400, detail="Incorrect 6-digit OTP code entered. Please try again.")

    # Create new User Profile
    random_id = f"USR-{random.randint(10000, 99999)}"
    avatar_options = [
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80",
    ]

    new_user = {
        "user_id": random_id,
        "name": session["name"],
        "email": session.get("email"),
        "phone": session.get("phone"),
        "password": session["password"],
        "role": session["role"],
        "department": session["department"],
        "avatar": random.choice(avatar_options),
        "tier": "SOC_OPERATOR",
        "account_balance": "$750,000.00",
        "is_verified": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    USERS_DB[random_id] = new_user
    del OTP_SESSIONS[req.otp_session_id]

    token = f"sentinelx_token_{uuid.uuid4()}"
    ACTIVE_SESSIONS[token] = random_id

    user_profile = UserProfile(**new_user)
    return AuthResponse(
        success=True,
        message=f"Account successfully verified! Welcome to SentinelX, {user_profile.name}.",
        token=token,
        user=user_profile,
    )


@app.post("/api/v1/auth/signin", response_model=AuthResponse)
def signin(req: LoginRequest):
    """
    Authenticates user by email, phone, or User ID with password.
    Supports quick demo logins as well.
    """
    identifier = req.identifier.strip().lower()
    matched_user = None

    for u in USERS_DB.values():
        if (
            u.get("user_id", "").lower() == identifier
            or (u.get("email") and u.get("email").lower() == identifier)
            or (u.get("phone") and u.get("phone").replace(" ", "").replace("-", "") == identifier.replace(" ", "").replace("-", ""))
        ):
            matched_user = u
            break

    if not matched_user:
        raise HTTPException(status_code=401, detail="User account not found with the provided identifier.")

    if matched_user.get("password") and matched_user.get("password") != req.password:
        raise HTTPException(status_code=401, detail="Invalid password credentials. Please verify your input.")

    token = f"sentinelx_token_{uuid.uuid4()}"
    ACTIVE_SESSIONS[token] = matched_user["user_id"]

    user_profile = UserProfile(**matched_user)
    return AuthResponse(
        success=True,
        message=f"Authenticated as {user_profile.name}.",
        token=token,
        user=user_profile,
    )


@app.post("/api/v1/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    """Logs out user and invalidates session token."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
        if token in ACTIVE_SESSIONS:
            del ACTIVE_SESSIONS[token]
    return {"success": True, "message": "Session invalidated successfully."}


@app.get("/api/v1/auth/me", response_model=UserProfile)
def get_me(authorization: Optional[str] = Header(None)):
    """Returns currently authenticated user profile."""
    if not authorization or not authorization.startswith("Bearer "):
        # Default to primary VIP user
        return UserProfile(**USERS_DB["USR-84920"])

    token = authorization.replace("Bearer ", "").strip()
    user_id = ACTIVE_SESSIONS.get(token)
    if not user_id or user_id not in USERS_DB:
        return UserProfile(**USERS_DB["USR-84920"])

    return UserProfile(**USERS_DB[user_id])


# =========================================================================
# SOC Analytics & Policy Endpoints
# =========================================================================

@app.get("/api/v1/users", response_model=List[UserProfile])
def get_users():
    """Returns available user profiles for SOC simulation and surveillance."""
    return [UserProfile(**u) for u in USERS_DB.values()]


@app.get("/api/v1/analytics/metrics", response_model=SocAnalyticsSummary)
def get_analytics():
    """Returns live SOC telemetry metrics and threat posture."""
    total_users = len(USERS_DB)
    return SocAnalyticsSummary(
        total_events_ingested=14890 + (total_users * 120),
        mttc_seconds=1.2,
        prevented_loss_usd=18450000.0,
        active_threat_chains=len(engine.user_graphs),
        quarantined_identities=max(1, len([u for u in engine.user_assessments.values() if u.risk_score > 85])),
        mitre_tactics_covered=[
            "T1566: Phishing / Smishing",
            "T1451: SIM Swap Interception",
            "T1078: Valid Accounts / Unknown Device",
            "T1534: Internal Unauthorized Exfiltration",
            "T1110: Credential Access / Bypass",
            "T1485: Data Wipe / Zero-Trust Containment",
        ],
        recent_activity=[
            {"id": "EV-9921", "type": "AUTO_FREEZE", "target": "Offshore Cayman Escrow", "amount": "$250,000.00", "time": "2 mins ago", "status": "CONTAINED"},
            {"id": "EV-9920", "type": "SIM_SWAP_FLAG", "target": "USR-84920", "carrier": "Telco SS7 Bridge", "time": "5 mins ago", "status": "QUARANTINED"},
            {"id": "EV-9919", "type": "AUTH_OTP_VERIFIED", "target": "New Operator Registration", "channel": "SMS OTP", "time": "12 mins ago", "status": "VERIFIED"},
            {"id": "EV-9918", "type": "WEBAUTHN_STEPUP", "target": "USR-10294", "method": "FIDO2 TouchID", "time": "18 mins ago", "status": "PASSED"},
        ]
    )


@app.get("/api/v1/policies", response_model=SecurityPolicyConfig)
def get_policies():
    """Returns current automated containment rules and security policies."""
    global CURRENT_POLICY
    return CURRENT_POLICY


@app.post("/api/v1/policies", response_model=SecurityPolicyConfig)
def update_policies(new_policy: SecurityPolicyConfig):
    """Updates security policies in real-time."""
    global CURRENT_POLICY
    CURRENT_POLICY = new_policy
    return CURRENT_POLICY


# =========================================================================
# Sentinel Graph Engine & Threat Ingestion Endpoints
# =========================================================================

@app.post("/api/v1/ingest", response_model=RiskAssessment)
def ingest_event(event: IngestEvent):
    """
    Ingests an anomalous telemetry event, updates the causal graph,
    and returns the updated deterministic RiskAssessment.
    """
    try:
        assessment = engine.ingest_event(event)
        return assessment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/risk/{user_id}", response_model=GraphPayload)
def get_risk_and_graph(user_id: str):
    """
    Fetches the latest RiskAssessment alongside the full node-link graph payload
    formatted for React Flow (@xyflow/react).
    """
    payload = engine.get_graph_payload(user_id)
    return payload


@app.post("/api/v1/simulate/ato-chain")
async def simulate_ato_chain(req: SimulateChainRequest):
    """
    Injects a complete 4-stage Account Takeover (ATO) attack chain with progressive delays:
    1. PHISHING_SMS_CLICKED
    2. SIM_SWAP_DETECTED
    3. NEW_DEVICE_LOGIN
    4. ABNORMAL_TRANSACTION ($250,000 wire)
    """
    user_id = req.user_id
    engine.reset_user(user_id)

    stages_data = [
        {
            "event_type": EventType.PHISHING_SMS_CLICKED,
            "metadata": {
                "ip": "198.51.100.42",
                "imei": "358920194820194",
                "confidence_score": 0.94,
                "details": "User clicked smishing link 'https://sec-bank-verify.net/auth'",
                "location": "Dallas, TX (Carrier IP)",
            },
        },
        {
            "event_type": EventType.SIM_SWAP_DETECTED,
            "metadata": {
                "ip": "203.0.113.88",
                "imei": "864293041234567",
                "confidence_score": 0.98,
                "details": "Telco SS7 Carrier update: eSIM re-provisioned via external IVR",
                "location": "Miami, FL (Mobile Switch)",
            },
        },
        {
            "event_type": EventType.NEW_DEVICE_LOGIN,
            "metadata": {
                "ip": "185.220.101.5",
                "imei": "864293041234567",
                "confidence_score": 0.99,
                "details": "Unregistered Device 'Linux x86_64; Tor Exit Node' authenticated via SMS OTP",
                "location": "Frankfurt, Germany (Anonymized VPN)",
            },
        },
        {
            "event_type": EventType.ABNORMAL_TRANSACTION,
            "metadata": {
                "ip": "185.220.101.5",
                "imei": "864293041234567",
                "confidence_score": 0.995,
                "amount": 250000.0,
                "recipient": "Offshore Cayman Escrow Ltd (ACC: #9948-2201)",
                "details": "Immediate SWIFT wire transfer of $250,000.00 to offshore unverified beneficiary",
                "location": "Frankfurt, Germany",
            },
        },
    ]

    assessments: List[RiskAssessment] = []

    for item in stages_data:
        event = IngestEvent(
            event_id=str(uuid.uuid4()),
            user_id=user_id,
            event_type=item["event_type"],
            timestamp=datetime.now(timezone.utc),
            metadata=item["metadata"],
        )
        assessment = engine.ingest_event(event)
        assessments.append(assessment)

        if req.step_delay_sec > 0 and item != stages_data[-1]:
            await asyncio.sleep(req.step_delay_sec)

    final_payload = engine.get_graph_payload(user_id)
    return {
        "status": "SIMULATION_COMPLETED",
        "user_id": user_id,
        "final_assessment": assessments[-1],
        "graph": final_payload,
        "stages_executed": len(assessments),
    }


@app.post("/api/v1/reset")
def reset_session(req: ResetRequest = ResetRequest()):
    """Clears graph and assessment state for the user or entire engine."""
    engine.reset_user(req.user_id)
    return {
        "status": "RESET_SUCCESSFUL",
        "user_id": req.user_id or "ALL",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
