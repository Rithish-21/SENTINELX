import pytest
from datetime import datetime, timezone, timedelta
import uuid

from models.schemas import EventType, AttackStage, IngestEvent
from services.engine import SentinelGraphEngine
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def clean_engine():
    engine = SentinelGraphEngine(window_minutes=30)
    return engine


def test_isolated_anomaly_scoring(clean_engine):
    """Single isolated anomaly must yield Base Risk 15-25% (Stage: RECON)."""
    user_id = "TEST-USER-001"
    event = IngestEvent(
        event_id=str(uuid.uuid4()),
        user_id=user_id,
        event_type=EventType.PHISHING_SMS_CLICKED,
        timestamp=datetime.now(timezone.utc),
        metadata={"confidence_score": 0.95, "ip": "1.2.3.4"},
    )
    assessment = clean_engine.ingest_event(event)

    assert 15.0 <= assessment.risk_score <= 25.0
    assert assessment.attack_stage == AttackStage.RECON
    assert assessment.chain_detected == [EventType.PHISHING_SMS_CLICKED.value]
    assert len(assessment.xai_breadcrumbs) == 1
    assert len(assessment.automated_actions) > 0


def test_two_chained_events_scoring(clean_engine):
    """PHISHING + SIM_SWAP must yield Base Risk 65% (Stage: COMPROMISED)."""
    user_id = "TEST-USER-002"
    now = datetime.now(timezone.utc)

    e1 = IngestEvent(
        event_id=str(uuid.uuid4()),
        user_id=user_id,
        event_type=EventType.PHISHING_SMS_CLICKED,
        timestamp=now,
        metadata={"details": "SMS phishing clicked"},
    )
    clean_engine.ingest_event(e1)

    e2 = IngestEvent(
        event_id=str(uuid.uuid4()),
        user_id=user_id,
        event_type=EventType.SIM_SWAP_DETECTED,
        timestamp=now + timedelta(seconds=120),
        metadata={"details": "SIM swap completed by telco"},
    )
    assessment2 = clean_engine.ingest_event(e2)

    assert assessment2.risk_score == 65.0
    assert assessment2.attack_stage == AttackStage.COMPROMISED
    assert len(assessment2.chain_detected) == 2
    assert "TRIGGER_BIOMETRIC_STEPUP" in assessment2.automated_actions


def test_three_chained_events_scoring_above_90_percent(clean_engine):
    """PHISHING + SIM_SWAP + NEW_DEVICE_LOGIN must yield Risk 92% (>90%) (Stage: ACTIVE_ATO)."""
    user_id = "TEST-USER-003"
    now = datetime.now(timezone.utc)

    e1 = IngestEvent(
        event_id=str(uuid.uuid4()),
        user_id=user_id,
        event_type=EventType.PHISHING_SMS_CLICKED,
        timestamp=now,
    )
    clean_engine.ingest_event(e1)

    e2 = IngestEvent(
        event_id=str(uuid.uuid4()),
        user_id=user_id,
        event_type=EventType.SIM_SWAP_DETECTED,
        timestamp=now + timedelta(seconds=180),
    )
    clean_engine.ingest_event(e2)

    e3 = IngestEvent(
        event_id=str(uuid.uuid4()),
        user_id=user_id,
        event_type=EventType.NEW_DEVICE_LOGIN,
        timestamp=now + timedelta(seconds=300),
        metadata={"ip": "185.220.101.5", "imei": "999888777"},
    )
    assessment3 = clean_engine.ingest_event(e3)

    # Core explicit assertion: risk scores > 90% upon the 3rd chained event
    assert assessment3.risk_score > 90.0, f"Expected risk > 90%, got {assessment3.risk_score}"
    assert assessment3.risk_score == 92.0
    assert assessment3.attack_stage == AttackStage.ACTIVE_ATO
    assert len(assessment3.chain_detected) == 3
    assert "REVOKE_ACTIVE_SESSIONS" in assessment3.automated_actions


def test_full_four_stage_ato_breach_and_containment(clean_engine):
    """Complete 4-stage chain yields 99.2% risk (Stage: CRITICAL_BREACH) with FREEZE_TRANSACTION action."""
    user_id = "TEST-USER-004"
    now = datetime.now(timezone.utc)

    events = [
        IngestEvent(
            event_id=f"e-{i}",
            user_id=user_id,
            event_type=etype,
            timestamp=now + timedelta(seconds=i * 60),
            metadata={"amount": 250000.0 if etype == EventType.ABNORMAL_TRANSACTION else None},
        )
        for i, etype in enumerate([
            EventType.PHISHING_SMS_CLICKED,
            EventType.SIM_SWAP_DETECTED,
            EventType.NEW_DEVICE_LOGIN,
            EventType.ABNORMAL_TRANSACTION,
        ])
    ]

    final_assessment = None
    for ev in events:
        final_assessment = clean_engine.ingest_event(ev)

    assert final_assessment is not None
    assert final_assessment.risk_score == 99.2
    assert final_assessment.attack_stage == AttackStage.CRITICAL_BREACH
    assert "FREEZE_TRANSACTION" in final_assessment.automated_actions
    assert "EMERGENCY_ACCOUNT_LOCKDOWN" in final_assessment.automated_actions
    assert len(final_assessment.xai_breadcrumbs) == 4

    # Test graph payload generation
    payload = clean_engine.get_graph_payload(user_id)
    assert len(payload.nodes) == 4
    assert len(payload.edges) == 3
    assert all(n.data.severity == "ATO_ATTACK" for n in payload.nodes)


def test_sliding_window_pruning(clean_engine):
    """Events outside the 30-minute window should be pruned."""
    user_id = "TEST-USER-005"
    old_time = datetime.now(timezone.utc) - timedelta(minutes=45)
    recent_time = datetime.now(timezone.utc)

    e_old = IngestEvent(
        event_id="old-evt",
        user_id=user_id,
        event_type=EventType.PHISHING_SMS_CLICKED,
        timestamp=old_time,
    )
    clean_engine.ingest_event(e_old)

    e_recent = IngestEvent(
        event_id="recent-evt",
        user_id=user_id,
        event_type=EventType.NEW_DEVICE_LOGIN,
        timestamp=recent_time,
    )
    assessment = clean_engine.ingest_event(e_recent)

    # Only 1 event remains because old event was >30m prior
    assert assessment.event_count == 1
    assert assessment.attack_stage == AttackStage.RECON
    assert assessment.risk_score == 15.0


def test_api_endpoints():
    """FastAPI TestClient integration verification for all required endpoints."""
    client = TestClient(app)

    # 1. Health check
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "HEALTHY"

    # 2. Reset session
    res_reset = client.post("/api/v1/reset", json={"user_id": "API-USER-001"})
    assert res_reset.status_code == 200

    # 3. Ingest event
    ingest_payload = {
        "event_id": str(uuid.uuid4()),
        "user_id": "API-USER-001",
        "event_type": "PHISHING_SMS_CLICKED",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": {"ip": "1.1.1.1", "confidence_score": 0.95},
    }
    res_ingest = client.post("/api/v1/ingest", json=ingest_payload)
    assert res_ingest.status_code == 200
    data = res_ingest.json()
    assert data["risk_score"] == 18.5
    assert data["attack_stage"] == "RECON"

    # 4. Get Risk and Graph payload
    res_graph = client.get("/api/v1/risk/API-USER-001")
    assert res_graph.status_code == 200
    g_data = res_graph.json()
    assert len(g_data["nodes"]) == 1
    assert g_data["assessment"]["user_id"] == "API-USER-001"

    # 5. Simulate ATO chain endpoint
    res_sim = client.post(
        "/api/v1/simulate/ato-chain",
        json={"user_id": "API-USER-001", "step_delay_sec": 0.0},
    )
    assert res_sim.status_code == 200
    sim_data = res_sim.json()
    assert sim_data["status"] == "SIMULATION_COMPLETED"
    assert sim_data["final_assessment"]["risk_score"] == 99.2
    assert sim_data["final_assessment"]["attack_stage"] == "CRITICAL_BREACH"
