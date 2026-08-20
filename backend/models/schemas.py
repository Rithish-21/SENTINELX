from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import uuid


class EventType(str, Enum):
    PHISHING_SMS_CLICKED = "PHISHING_SMS_CLICKED"
    SIM_SWAP_DETECTED = "SIM_SWAP_DETECTED"
    NEW_DEVICE_LOGIN = "NEW_DEVICE_LOGIN"
    ABNORMAL_TRANSACTION = "ABNORMAL_TRANSACTION"


class AttackStage(str, Enum):
    SAFE = "SAFE"
    RECON = "RECON"
    COMPROMISED = "COMPROMISED"
    ACTIVE_ATO = "ACTIVE_ATO"
    CRITICAL_BREACH = "CRITICAL_BREACH"


class EventMetadata(BaseModel):
    ip: Optional[str] = "192.168.1.100"
    imei: Optional[str] = "864293041234567"
    confidence_score: Optional[float] = Field(default=0.95, ge=0.0, le=1.0)
    details: Optional[str] = "Anomaly telemetry event recorded"
    location: Optional[str] = "San Francisco, CA"
    device_name: Optional[str] = "Unknown Android Device"
    amount: Optional[float] = None
    recipient: Optional[str] = None


class IngestEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    event_type: EventType
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict[str, Any] = Field(default_factory=dict)


class XAIBreadcrumb(BaseModel):
    event_id: str
    event_type: EventType
    timestamp: datetime
    formatted_time: str
    confidence_score: float
    causal_link: str
    risk_contribution: float
    forensic_details: str
    ip: Optional[str] = None
    imei: Optional[str] = None


class AutomatedAction(BaseModel):
    action_id: str
    name: str
    description: str
    status: str = "EXECUTED"  # EXECUTED, ENFORCING, PENDING
    triggered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    severity: str = "CRITICAL"  # LOW, MEDIUM, HIGH, CRITICAL


class RiskAssessment(BaseModel):
    user_id: str
    risk_score: float = Field(ge=0.0, le=100.0)
    attack_stage: AttackStage
    chain_detected: List[str] = Field(default_factory=list)
    explainability_summary: str
    automated_actions: List[str] = Field(default_factory=list)
    action_details: List[AutomatedAction] = Field(default_factory=list)
    xai_breadcrumbs: List[XAIBreadcrumb] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    event_count: int = 0


class GraphNodeData(BaseModel):
    event_id: str
    event_type: EventType
    label: str
    stage: str
    severity: str  # SAFE, ELEVATED, ATO_ATTACK
    timestamp: str
    risk_contribution: float
    cumulative_risk: float
    confidence_score: float
    ip: Optional[str] = None
    imei: Optional[str] = None
    details: Optional[str] = None
    is_critical: bool = False


class GraphNode(BaseModel):
    id: str
    type: str = "cyberAttackNode"
    position: Dict[str, float]
    data: GraphNodeData


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    animated: bool = True
    style: Optional[Dict[str, Any]] = None
    label: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class GraphPayload(BaseModel):
    user_id: str
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    assessment: RiskAssessment


# =========================================================================
# Authentication & User Management Schemas
# =========================================================================

class UserProfile(BaseModel):
    user_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str = "SOC Security Analyst"
    department: str = "Cyber Threat Intelligence"
    avatar: str = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
    tier: str = "VIP_EXECUTIVE"
    account_balance: str = "$1,250,000.00"
    is_verified: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SendOtpRequest(BaseModel):
    name: str
    channel: str = "email"  # 'email' or 'sms'
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str
    role: Optional[str] = "SOC Security Analyst"
    department: Optional[str] = "Cyber Threat Intelligence"


class VerifyOtpRequest(BaseModel):
    otp_session_id: str
    otp_code: str


class LoginRequest(BaseModel):
    identifier: str  # email or phone or user_id
    password: str


class AuthResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
    user: Optional[UserProfile] = None
    otp_session_id: Optional[str] = None
    debug_otp: Optional[str] = None  # Returned for HUD notification & easy verification
    channel: Optional[str] = None
    destination: Optional[str] = None
    expires_in_seconds: Optional[int] = 300


# =========================================================================
# Security Policy & Analytics Schemas
# =========================================================================

class SecurityPolicyConfig(BaseModel):
    auto_freeze_high_value: bool = True
    high_value_threshold: float = 100000.0
    quarantine_sim_swap_hours: int = 48
    block_tor_nodes: bool = True
    enforce_fido2_stepup: bool = True
    dynamic_risk_multiplier: float = 1.0
    zero_trust_device_isolation: bool = True
    geo_velocity_threshold_mph: float = 600.0


class SocAnalyticsSummary(BaseModel):
    total_events_ingested: int = 14890
    mttc_seconds: float = 1.2
    prevented_loss_usd: float = 18450000.0
    active_threat_chains: int = 1
    quarantined_identities: int = 3
    mitre_tactics_covered: List[str] = [
        "T1566: Phishing",
        "T1451: SIM Swap Interception",
        "T1078: Valid Accounts / New Device",
        "T1534: Internal Exfiltration",
        "T1110: Credential Access",
    ]
    recent_activity: List[Dict[str, Any]] = []
