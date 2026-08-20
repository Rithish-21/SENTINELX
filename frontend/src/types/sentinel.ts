export type EventType =
  | 'PHISHING_SMS_CLICKED'
  | 'SIM_SWAP_DETECTED'
  | 'NEW_DEVICE_LOGIN'
  | 'ABNORMAL_TRANSACTION';

export type AttackStage =
  | 'SAFE'
  | 'RECON'
  | 'COMPROMISED'
  | 'ACTIVE_ATO'
  | 'CRITICAL_BREACH';

export type NodeSeverity = 'SAFE' | 'ELEVATED' | 'ATO_ATTACK';

export interface EventMetadata {
  ip?: string;
  imei?: string;
  confidence_score?: number;
  details?: string;
  location?: string;
  device_name?: string;
  amount?: number;
  recipient?: string;
}

export interface IngestEventPayload {
  event_id?: string;
  user_id: string;
  event_type: EventType;
  timestamp?: string;
  metadata?: EventMetadata;
}

export interface XAIBreadcrumb {
  event_id: string;
  event_type: EventType;
  timestamp: string;
  formatted_time: string;
  confidence_score: number;
  causal_link: string;
  risk_contribution: number;
  forensic_details: string;
  ip?: string;
  imei?: string;
}

export interface AutomatedAction {
  action_id: string;
  name: string;
  description: string;
  status: 'EXECUTED' | 'ENFORCING' | 'PENDING';
  triggered_at: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RiskAssessment {
  user_id: string;
  risk_score: number;
  attack_stage: AttackStage;
  chain_detected: string[];
  explainability_summary: string;
  automated_actions: string[];
  action_details: AutomatedAction[];
  xai_breadcrumbs: XAIBreadcrumb[];
  timestamp: string;
  event_count: number;
}

export interface GraphNodeData extends Record<string, unknown> {
  event_id: string;
  event_type: EventType;
  label: string;
  stage: string;
  severity: NodeSeverity;
  timestamp: string;
  risk_contribution: number;
  cumulative_risk: number;
  confidence_score: number;
  ip?: string;
  imei?: string;
  details?: string;
  is_critical?: boolean;
}

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: GraphNodeData;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: Record<string, any>;
  label?: string;
  data?: Record<string, any>;
}

export interface GraphPayload {
  user_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  assessment: RiskAssessment;
}

export interface UserProfile {
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  department: string;
  avatar: string;
  tier: string;
  account_balance: string;
  is_verified?: boolean;
  created_at?: string;
}

export interface SendOtpPayload {
  name: string;
  channel: 'email' | 'sms';
  email?: string;
  phone?: string;
  password: string;
  role?: string;
  department?: string;
}

export interface VerifyOtpPayload {
  otp_session_id: string;
  otp_code: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: UserProfile;
  otp_session_id?: string;
  debug_otp?: string;
  channel?: string;
  destination?: string;
  expires_in_seconds?: number;
}

export interface SecurityPolicyConfig {
  auto_freeze_high_value: boolean;
  high_value_threshold: number;
  quarantine_sim_swap_hours: number;
  block_tor_nodes: boolean;
  enforce_fido2_stepup: boolean;
  dynamic_risk_multiplier: number;
  zero_trust_device_isolation: boolean;
  geo_velocity_threshold_mph: number;
}

export interface SocAnalyticsSummary {
  total_events_ingested: number;
  mttc_seconds: number;
  prevented_loss_usd: number;
  active_threat_chains: number;
  quarantined_identities: number;
  mitre_tactics_covered: string[];
  recent_activity: Array<{
    id: string;
    type: string;
    target: string;
    amount?: string;
    carrier?: string;
    channel?: string;
    method?: string;
    time: string;
    status: string;
  }>;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'CRITICAL' | 'SUCCESS';
  category: string;
  action: string;
  actor: string;
  ip: string;
  imei?: string;
  details: string;
}
