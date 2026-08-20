from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple
import networkx as nx
import uuid

from models.schemas import (
    EventType,
    AttackStage,
    IngestEvent,
    RiskAssessment,
    XAIBreadcrumb,
    AutomatedAction,
    GraphNode,
    GraphNodeData,
    GraphEdge,
    GraphPayload,
)


class SentinelGraphEngine:
    """
    Deterministic Graph-based Attack Chain Correlation Engine.
    Maintains user session subgraphs, sliding temporal windows, 
    and applies graph path heuristics to detect multi-stage Account Takeover (ATO).
    """

    def __init__(self, window_minutes: int = 30):
        self.window_minutes = window_minutes
        self.user_graphs: Dict[str, nx.DiGraph] = {}
        self.user_assessments: Dict[str, RiskAssessment] = {}

    def _get_or_create_graph(self, user_id: str) -> nx.DiGraph:
        if user_id not in self.user_graphs:
            self.user_graphs[user_id] = nx.DiGraph(user_id=user_id)
        return self.user_graphs[user_id]

    def reset_user(self, user_id: Optional[str] = None):
        """Clears session state for a specific user or all users."""
        if user_id:
            if user_id in self.user_graphs:
                del self.user_graphs[user_id]
            if user_id in self.user_assessments:
                del self.user_assessments[user_id]
        else:
            self.user_graphs.clear()
            self.user_assessments.clear()

    def _prune_expired_events(self, G: nx.DiGraph, latest_timestamp: datetime):
        """Prunes events older than sliding window relative to the latest event."""
        cutoff_time = latest_timestamp - timedelta(minutes=self.window_minutes)
        nodes_to_remove = []
        for node, data in G.nodes(data=True):
            node_ts = data.get("timestamp")
            if node_ts and node_ts < cutoff_time:
                nodes_to_remove.append(node)
        
        for node in nodes_to_remove:
            G.remove_node(node)

    def ingest_event(self, event: IngestEvent) -> RiskAssessment:
        """
        Ingests a new telemetry event, updates the directed causal graph,
        evaluates attack stage and deterministic risk score, and outputs XAI breadcrumbs.
        """
        G = self._get_or_create_graph(event.user_id)
        
        # Ensure timestamp is UTC aware
        ts = event.timestamp
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        else:
            ts = ts.astimezone(timezone.utc)

        # 1. Prune expired events outside sliding 30-minute window
        self._prune_expired_events(G, ts)

        # 2. Add event node to DiGraph
        metadata = event.metadata or {}
        confidence = float(metadata.get("confidence_score", 0.95))
        ip = metadata.get("ip", "192.168.1.100")
        imei = metadata.get("imei", "864293041234567")
        details = metadata.get("details", f"Telemetry for {event.event_type.value}")

        G.add_node(
            event.event_id,
            event_id=event.event_id,
            user_id=event.user_id,
            event_type=event.event_type,
            timestamp=ts,
            confidence_score=confidence,
            ip=ip,
            imei=imei,
            details=details,
            metadata=metadata,
        )

        # 3. Create causal directed edges with previous active events in chronological order
        sorted_nodes = sorted(
            G.nodes(data=True),
            key=lambda x: x[1].get("timestamp", datetime.min.replace(tzinfo=timezone.utc))
        )

        node_ids = [n[0] for n in sorted_nodes]
        for i in range(len(node_ids) - 1):
            src_id = node_ids[i]
            tgt_id = node_ids[i + 1]
            if not G.has_edge(src_id, tgt_id):
                src_data = G.nodes[src_id]
                tgt_data = G.nodes[tgt_id]
                time_delta_sec = (tgt_data["timestamp"] - src_data["timestamp"]).total_seconds()
                correlation_weight = self._compute_edge_correlation(
                    src_data["event_type"], tgt_data["event_type"], time_delta_sec
                )
                G.add_edge(
                    src_id,
                    tgt_id,
                    weight=correlation_weight,
                    time_delta=time_delta_sec,
                    label=f"Δt: {int(time_delta_sec)}s | Corr: {int(correlation_weight * 100)}%"
                )

        # 4. Deterministic Correlation & Stage Assessment
        assessment = self._evaluate_risk(event.user_id, G, sorted_nodes)
        self.user_assessments[event.user_id] = assessment
        return assessment

    def _compute_edge_correlation(self, src_type: EventType, tgt_type: EventType, time_delta_sec: float) -> float:
        """Computes causal link correlation weight based on MITRE ATT&CK ATO tactics."""
        # Standard ATO Chain: PHISHING -> SIM_SWAP -> NEW_DEVICE -> ABNORMAL_TXN
        chain_order = {
            EventType.PHISHING_SMS_CLICKED: 1,
            EventType.SIM_SWAP_DETECTED: 2,
            EventType.NEW_DEVICE_LOGIN: 3,
            EventType.ABNORMAL_TRANSACTION: 4,
        }
        
        src_rank = chain_order.get(src_type, 0)
        tgt_rank = chain_order.get(tgt_type, 0)

        base_corr = 0.5
        if tgt_rank == src_rank + 1:
            base_corr = 0.98  # Exact direct sequential vector progression
        elif tgt_rank > src_rank:
            base_corr = 0.85  # Forward vector progression
        else:
            base_corr = 0.40  # Out of order or concurrent

        # Temporal decay penalty if delta exceeds 15 mins (900s)
        decay = max(0.0, min(1.0, 1.0 - (time_delta_sec / 1800.0)))
        return round(base_corr * (0.8 + 0.2 * decay), 3)

    def _evaluate_risk(self, user_id: str, G: nx.DiGraph, sorted_nodes: List[Tuple[str, dict]]) -> RiskAssessment:
        """
        Applies deterministic correlation logic matching exact prompt specifications:
        - Single isolated anomaly: Base Risk 15-25% (Stage: RECON)
        - PHISHING + SIM_SWAP: Base Risk 65% (Stage: COMPROMISED)
        - PHISHING + SIM_SWAP + NEW_DEVICE_LOGIN: Base Risk 92% (Stage: ACTIVE_ATO)
        - PHISHING + SIM_SWAP + NEW_DEVICE + ABNORMAL_TRANSACTION: Risk 99.2% (Stage: CRITICAL_BREACH)
        """
        if not sorted_nodes:
            return RiskAssessment(
                user_id=user_id,
                risk_score=0.0,
                attack_stage=AttackStage.SAFE,
                chain_detected=[],
                explainability_summary="System baseline nominal. No suspicious signals detected.",
                automated_actions=[],
                action_details=[],
                xai_breadcrumbs=[],
                event_count=0,
            )

        event_types_present = [data["event_type"] for _, data in sorted_nodes]
        event_types_set = set(event_types_present)
        event_count = len(sorted_nodes)

        has_phishing = EventType.PHISHING_SMS_CLICKED in event_types_set
        has_sim_swap = EventType.SIM_SWAP_DETECTED in event_types_set
        has_new_device = EventType.NEW_DEVICE_LOGIN in event_types_set
        has_abnormal_txn = EventType.ABNORMAL_TRANSACTION in event_types_set

        # Determine Stage, Base Score, Chain & Actions
        if has_phishing and has_sim_swap and has_new_device and has_abnormal_txn:
            risk_score = 99.2
            attack_stage = AttackStage.CRITICAL_BREACH
            chain = [
                EventType.PHISHING_SMS_CLICKED.value,
                EventType.SIM_SWAP_DETECTED.value,
                EventType.NEW_DEVICE_LOGIN.value,
                EventType.ABNORMAL_TRANSACTION.value,
            ]
            summary = (
                "CRITICAL BREACH IN PROGRESS: Multi-vector Account Takeover fully executed. "
                "Adversary intercepted SMS OTP via Telco SIM Swap, authenticated from an unregistered device, "
                "and attempted high-value unauthorized fund exfiltration ($250,000.00 Wire Transfer). "
                "Automated transaction freeze and emergency lockdown deployed."
            )
            actions = [
                "FREEZE_TRANSACTION",
                "EMERGENCY_ACCOUNT_LOCKDOWN",
                "REVOKE_ALL_TOKENS",
                "TRIGGER_BIOMETRIC_STEPUP",
                "BLOCK_DEVICE_IMEI",
                "NOTIFY_FRAUD_SOC",
                "DISPATCH_INCIDENT_TICKET",
            ]

        elif has_phishing and has_sim_swap and has_new_device:
            risk_score = 92.0
            attack_stage = AttackStage.ACTIVE_ATO
            chain = [
                EventType.PHISHING_SMS_CLICKED.value,
                EventType.SIM_SWAP_DETECTED.value,
                EventType.NEW_DEVICE_LOGIN.value,
            ]
            summary = (
                "ACTIVE ATO DETECTED: High-confidence credential harvesting followed by SIM interception. "
                "Adversary successfully authenticated from an unknown IMEI/IP without user MFA approval. "
                "Active sessions revoked; Step-up biometric challenge enforced."
            )
            actions = [
                "REVOKE_ACTIVE_SESSIONS",
                "BLOCK_DEVICE_IMEI",
                "TRIGGER_BIOMETRIC_STEPUP",
                "TRIGGER_MFA_PUSH",
                "REQUIRE_STEPUP_AUTH",
            ]

        elif has_phishing and has_sim_swap:
            risk_score = 65.0
            attack_stage = AttackStage.COMPROMISED
            chain = [
                EventType.PHISHING_SMS_CLICKED.value,
                EventType.SIM_SWAP_DETECTED.value,
            ]
            summary = (
                "COMPROMISE SUSPECTED: Phishing link interaction correlated with Telco carrier SIM Swap "
                "within 30-minute window. High probability of impending SMS 2FA interception."
            )
            actions = [
                "TRIGGER_BIOMETRIC_STEPUP",
                "FLAG_SIM_SUSPICIOUS",
                "ALERT_FRAUD_ANALYST",
                "TEMP_RESTRICT_TRANSFERS",
            ]

        elif event_count == 1:
            first_type = event_types_present[0]
            if first_type == EventType.PHISHING_SMS_CLICKED:
                risk_score = 18.5
            elif first_type == EventType.SIM_SWAP_DETECTED:
                risk_score = 22.0
            elif first_type == EventType.NEW_DEVICE_LOGIN:
                risk_score = 15.0
            elif first_type == EventType.ABNORMAL_TRANSACTION:
                risk_score = 25.0
            else:
                risk_score = 15.0

            attack_stage = AttackStage.RECON
            chain = [first_type.value]
            summary = f"RECONNAISSANCE / ANOMALY: Isolated suspicious event detected ({first_type.value}). Enhanced telemetry logging active."
            actions = ["LOG_TELEMETRY", "ENHANCE_MONITORING", "FLAG_SESSION_WATCHLIST"]

        else:
            # Other 2 or 3 event permutations
            if has_new_device and has_abnormal_txn:
                risk_score = 88.5
                attack_stage = AttackStage.ACTIVE_ATO
            elif has_sim_swap and has_new_device:
                risk_score = 82.0
                attack_stage = AttackStage.ACTIVE_ATO
            elif has_phishing and has_new_device:
                risk_score = 55.0
                attack_stage = AttackStage.COMPROMISED
            elif has_phishing and has_abnormal_txn:
                risk_score = 70.0
                attack_stage = AttackStage.COMPROMISED
            else:
                risk_score = min(85.0, 20.0 * event_count)
                attack_stage = AttackStage.COMPROMISED

            chain = [e.value for e in event_types_present]
            summary = f"CORRELATED THREAT: {event_count} anomalous events detected within 30-minute sliding window. Escalating surveillance."
            actions = ["TRIGGER_BIOMETRIC_STEPUP", "ALERT_FRAUD_ANALYST", "REQUIRE_STEPUP_AUTH"]

        # Build XAI Forensic Breadcrumbs
        xai_breadcrumbs: List[XAIBreadcrumb] = []
        cumulative = 0.0
        for i, (n_id, data) in enumerate(sorted_nodes):
            e_type = data["event_type"]
            e_ts = data["timestamp"]
            conf = data.get("confidence_score", 0.95)
            ip_val = data.get("ip", "192.168.1.100")
            imei_val = data.get("imei", "864293041234567")

            # Calculate individual risk delta
            if i == 0:
                delta = 18.5 if e_type == EventType.PHISHING_SMS_CLICKED else 20.0
                causal = "Root Ingress: Initial anomalous interaction recorded."
            elif i == 1:
                delta = (65.0 - 18.5) if has_phishing and has_sim_swap else 25.0
                causal = "Vector Correlation: Second vector triggered within temporal correlation window."
            elif i == 2:
                delta = (92.0 - 65.0) if has_phishing and has_sim_swap and has_new_device else 20.0
                causal = "Critical Multi-Factor Convergence: New device authenticated bypassing normal trust baseline."
            else:
                delta = (99.2 - 92.0)
                causal = "Terminal Impact: Unauthorized transaction attempt triggered on compromised identity."

            cumulative += delta
            formatted_time = e_ts.strftime("%Y-%m-%d %H:%M:%S UTC")

            xai_breadcrumbs.append(
                XAIBreadcrumb(
                    event_id=n_id,
                    event_type=e_type,
                    timestamp=e_ts,
                    formatted_time=formatted_time,
                    confidence_score=conf,
                    causal_link=causal,
                    risk_contribution=round(delta, 1),
                    forensic_details=f"IP: {ip_val} | IMEI: {imei_val} | Telemetry: {data.get('details', '')}",
                    ip=ip_val,
                    imei=imei_val,
                )
            )

        # Build Action Details
        action_details: List[AutomatedAction] = []
        for act in actions:
            severity = "CRITICAL" if act in ["FREEZE_TRANSACTION", "EMERGENCY_ACCOUNT_LOCKDOWN", "REVOKE_ALL_TOKENS"] else "HIGH" if "BIOMETRIC" in act or "SESSIONS" in act else "MEDIUM"
            name_formatted = act.replace("_", " ").title()
            desc = self._get_action_description(act)
            action_details.append(
                AutomatedAction(
                    action_id=str(uuid.uuid4())[:8],
                    name=name_formatted,
                    description=desc,
                    status="EXECUTED" if risk_score > 60 else "ENFORCING",
                    triggered_at=datetime.now(timezone.utc),
                    severity=severity,
                )
            )

        return RiskAssessment(
            user_id=user_id,
            risk_score=risk_score,
            attack_stage=attack_stage,
            chain_detected=chain,
            explainability_summary=summary,
            automated_actions=actions,
            action_details=action_details,
            xai_breadcrumbs=xai_breadcrumbs,
            timestamp=datetime.now(timezone.utc),
            event_count=event_count,
        )

    def _get_action_description(self, action_key: str) -> str:
        desc_map = {
            "FREEZE_TRANSACTION": "Outbound fund transfers and wire routing halted across ACH and SWIFT gateways.",
            "EMERGENCY_ACCOUNT_LOCKDOWN": "Identity locked in digital vault; credential invalidation issued globally.",
            "REVOKE_ALL_TOKENS": "OAuth 2.0 JWTs, refresh tokens, and mobile session tokens purged from Redis session store.",
            "TRIGGER_BIOMETRIC_STEPUP": "Enforced FIDO2 WebAuthn / FaceID biometric re-verification on trusted device.",
            "BLOCK_DEVICE_IMEI": "Hardware IMEI blacklisted across edge firewall and API gateway.",
            "NOTIFY_FRAUD_SOC": "High-priority P1 incident alert dispatched to Level-3 SOC fraud operations.",
            "DISPATCH_INCIDENT_TICKET": "Jira SecOps ticket and audit trail created with full forensic payload.",
            "REVOKE_ACTIVE_SESSIONS": "Active browser and mobile TCP sessions terminated via TLS disconnect.",
            "TRIGGER_MFA_PUSH": "Out-of-band push notification sent to registered fallback authenticator.",
            "REQUIRE_STEPUP_AUTH": "Step-up challenge required for any privileged account operation.",
            "FLAG_SIM_SUSPICIOUS": "Carrier SS7/Diameter signaling query sent to mobile network operator.",
            "ALERT_FRAUD_ANALYST": "Automated telemetry alert routed to fraud surveillance queue.",
            "TEMP_RESTRICT_TRANSFERS": "Daily transfer limit reduced to $0.00 pending customer verification.",
            "LOG_TELEMETRY": "High-resolution telemetry logging enabled for user session.",
            "ENHANCE_MONITORING": "Dynamic risk threshold lowered for next 24 hours.",
            "FLAG_SESSION_WATCHLIST": "Session tagged for behavioral biometrics and anomaly tracking.",
        }
        return desc_map.get(action_key, f"Automated defense enforcement: {action_key}")

    def get_graph_payload(self, user_id: str) -> GraphPayload:
        """
        Generates nodes and edges ready for rendering in @xyflow/react.
        Applies aesthetic horizontal positioning and dynamic node colors:
        - Cyan / Green: Ingested & Verified Safe (or low risk baseline)
        - Amber: Elevated Threat Alert (Recon / moderate anomaly)
        - Pulsing Neon Red: Correlated ATO Attack Node
        """
        G = self._get_or_create_graph(user_id)
        assessment = self.user_assessments.get(
            user_id,
            RiskAssessment(
                user_id=user_id,
                risk_score=0.0,
                attack_stage=AttackStage.SAFE,
                chain_detected=[],
                explainability_summary="Baseline nominal. No active events.",
                automated_actions=[],
                action_details=[],
                xai_breadcrumbs=[],
                event_count=0,
            )
        )

        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []

        sorted_nodes = sorted(
            G.nodes(data=True),
            key=lambda x: x[1].get("timestamp", datetime.min.replace(tzinfo=timezone.utc))
        )

        total_nodes = len(sorted_nodes)
        
        # Determine overall chain state
        is_ato_chain = assessment.attack_stage in [AttackStage.ACTIVE_ATO, AttackStage.CRITICAL_BREACH]
        is_compromised = assessment.attack_stage == AttackStage.COMPROMISED

        base_x = 80
        spacing_x = 280
        base_y = 160

        for idx, (node_id, data) in enumerate(sorted_nodes):
            e_type = data.get("event_type", EventType.PHISHING_SMS_CLICKED)
            e_ts = data.get("timestamp", datetime.now(timezone.utc))
            formatted_time = e_ts.strftime("%H:%M:%S UTC")
            conf = data.get("confidence_score", 0.95)

            # Node Severity Coloring
            if is_ato_chain:
                severity = "ATO_ATTACK"  # Pulsing Neon Red (#FF2E93)
                is_crit = True
            elif is_compromised:
                severity = "ATO_ATTACK" if idx > 0 else "ELEVATED"  # Correlated threat
                is_crit = False
            elif assessment.attack_stage == AttackStage.RECON:
                severity = "ELEVATED"  # Amber (#F59E0B)
                is_crit = False
            else:
                severity = "SAFE"  # Cyan / Green (#00D2D3)
                is_crit = False

            # Risk contribution
            crumb = next((b for b in assessment.xai_breadcrumbs if b.event_id == node_id), None)
            contrib = crumb.risk_contribution if crumb else 20.0
            
            # Position: Layout nodes in a clean flow with slight dynamic vertical offset for aesthetic HUD look
            x_pos = base_x + (idx * spacing_x)
            y_pos = base_y + (20 if idx % 2 == 1 else -20)

            node_data = GraphNodeData(
                event_id=node_id,
                event_type=e_type,
                label=e_type.value.replace("_", " "),
                stage=f"STAGE {idx + 1}/{max(1, total_nodes)}",
                severity=severity,
                timestamp=formatted_time,
                risk_contribution=contrib,
                cumulative_risk=assessment.risk_score,
                confidence_score=conf,
                ip=data.get("ip"),
                imei=data.get("imei"),
                details=data.get("details"),
                is_critical=is_crit or (assessment.risk_score > 85),
            )

            nodes.append(
                GraphNode(
                    id=node_id,
                    type="cyberAttackNode",
                    position={"x": float(x_pos), "y": float(y_pos)},
                    data=node_data,
                )
            )

        # Generate Edges
        for u, v, edge_data in G.edges(data=True):
            edge_id = f"e-{u}-{v}"
            corr_weight = edge_data.get("weight", 0.8)
            label = edge_data.get("label", f"Corr: {int(corr_weight * 100)}%")

            # Edge styling based on threat severity
            if is_ato_chain:
                edge_color = "#FF2E93"  # Neon Alert Magenta
                stroke_width = 3.5
            elif is_compromised:
                edge_color = "#F59E0B"  # Threat Amber
                stroke_width = 2.5
            else:
                edge_color = "#00D2D3"  # Cyber Cyan
                stroke_width = 2.0

            edges.append(
                GraphEdge(
                    id=edge_id,
                    source=u,
                    target=v,
                    animated=True,
                    style={
                        "stroke": edge_color,
                        "strokeWidth": stroke_width,
                        "filter": f"drop-shadow(0 0 6px {edge_color})",
                    },
                    label=label,
                    data={"weight": corr_weight, "color": edge_color},
                )
            )

        return GraphPayload(
            user_id=user_id,
            nodes=nodes,
            edges=edges,
            assessment=assessment,
        )


# Global singleton engine instance
engine = SentinelGraphEngine(window_minutes=30)
