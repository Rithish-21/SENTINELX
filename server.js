import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],
}));

app.use(express.json());

// In-Memory Database
const USERS_DB = {
  'USR-84920': {
    user_id: 'USR-84920',
    name: 'Alex Vance',
    email: 'alex.vance@sentinelx.security',
    phone: '+1 (555) 948-2019',
    password: 'password123',
    role: 'VIP Chief Executive Officer',
    department: 'Executive Office',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    tier: 'VIP_EXECUTIVE',
    account_balance: '$1,450,000.00',
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  'USR-10294': {
    user_id: 'USR-10294',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@sentinelx.security',
    phone: '+1 (555) 102-9482',
    password: 'password123',
    role: 'Lead Treasury Officer',
    department: 'Corporate Treasury & Wire',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    tier: 'TREASURY_ADMIN',
    account_balance: '$8,920,500.00',
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  'USR-55912': {
    user_id: 'USR-55912',
    name: 'David Chen',
    email: 'david.chen@sentinelx.security',
    phone: '+1 (555) 559-1234',
    password: 'password123',
    role: 'Principal DevOps Architect',
    department: 'Infrastructure & Cloud Sec',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    tier: 'SYSTEM_ADMIN',
    account_balance: '$320,000.00',
    is_verified: true,
    created_at: new Date().toISOString(),
  },
};

const OTP_SESSIONS = new Map();
const ACTIVE_SESSIONS = new Map();
const USER_EVENTS = new Map();

let CURRENT_POLICY = {
  auto_freeze_high_value: true,
  high_value_threshold: 100000.0,
  quarantine_sim_swap_hours: 48,
  block_tor_nodes: true,
  enforce_fido2_stepup: true,
  dynamic_risk_multiplier: 1.0,
  zero_trust_device_isolation: true,
  geo_velocity_threshold_mph: 600.0,
};

// =========================================================================
// Graph Engine Logic
// =========================================================================

function evaluateRisk(userId, events) {
  if (!events || events.length === 0) {
    return {
      user_id: userId,
      risk_score: 0.0,
      attack_stage: 'SAFE',
      chain_detected: [],
      explainability_summary: 'System baseline nominal. No suspicious signals detected.',
      automated_actions: [],
      action_details: [],
      xai_breadcrumbs: [],
      timestamp: new Date().toISOString(),
      event_count: 0,
    };
  }

  const types = events.map((e) => e.event_type);
  const typesSet = new Set(types);

  const hasPhishing = typesSet.has('PHISHING_SMS_CLICKED');
  const hasSimSwap = typesSet.has('SIM_SWAP_DETECTED');
  const hasNewDevice = typesSet.has('NEW_DEVICE_LOGIN');
  const hasAbnormalTxn = typesSet.has('ABNORMAL_TRANSACTION');

  let riskScore = 15.0;
  let attackStage = 'RECON';
  let chain = [];
  let summary = '';
  let actions = [];

  if (hasPhishing && hasSimSwap && hasNewDevice && hasAbnormalTxn) {
    riskScore = 99.2;
    attackStage = 'CRITICAL_BREACH';
    chain = ['PHISHING_SMS_CLICKED', 'SIM_SWAP_DETECTED', 'NEW_DEVICE_LOGIN', 'ABNORMAL_TRANSACTION'];
    summary = 'CRITICAL BREACH IN PROGRESS: Multi-vector Account Takeover fully executed. Adversary intercepted SMS OTP via Telco SIM Swap, authenticated from an unregistered device, and attempted high-value unauthorized fund exfiltration ($250,000.00 Wire Transfer). Automated transaction freeze and emergency lockdown deployed.';
    actions = [
      'FREEZE_TRANSACTION',
      'EMERGENCY_ACCOUNT_LOCKDOWN',
      'REVOKE_ALL_TOKENS',
      'TRIGGER_BIOMETRIC_STEPUP',
      'BLOCK_DEVICE_IMEI',
      'NOTIFY_FRAUD_SOC',
      'DISPATCH_INCIDENT_TICKET',
    ];
  } else if (hasPhishing && hasSimSwap && hasNewDevice) {
    riskScore = 92.0;
    attackStage = 'ACTIVE_ATO';
    chain = ['PHISHING_SMS_CLICKED', 'SIM_SWAP_DETECTED', 'NEW_DEVICE_LOGIN'];
    summary = 'ACTIVE ATO DETECTED: High-confidence credential harvesting followed by SIM interception. Adversary successfully authenticated from an unknown IMEI/IP without user MFA approval. Active sessions revoked; Step-up biometric challenge enforced.';
    actions = [
      'REVOKE_ACTIVE_SESSIONS',
      'BLOCK_DEVICE_IMEI',
      'TRIGGER_BIOMETRIC_STEPUP',
      'TRIGGER_MFA_PUSH',
      'REQUIRE_STEPUP_AUTH',
    ];
  } else if (hasPhishing && hasSimSwap) {
    riskScore = 65.0;
    attackStage = 'COMPROMISED';
    chain = ['PHISHING_SMS_CLICKED', 'SIM_SWAP_DETECTED'];
    summary = 'COMPROMISE SUSPECTED: Phishing link interaction correlated with Telco carrier SIM Swap within 30-minute window. High probability of impending SMS 2FA interception.';
    actions = [
      'TRIGGER_BIOMETRIC_STEPUP',
      'FLAG_SIM_SUSPICIOUS',
      'ALERT_FRAUD_ANALYST',
      'TEMP_RESTRICT_TRANSFERS',
    ];
  } else if (events.length === 1) {
    const first = types[0];
    if (first === 'PHISHING_SMS_CLICKED') riskScore = 18.5;
    else if (first === 'SIM_SWAP_DETECTED') riskScore = 22.0;
    else if (first === 'NEW_DEVICE_LOGIN') riskScore = 15.0;
    else if (first === 'ABNORMAL_TRANSACTION') riskScore = 25.0;
    attackStage = 'RECON';
    chain = [first];
    summary = `RECONNAISSANCE / ANOMALY: Isolated suspicious event detected (${first}). Enhanced telemetry logging active.`;
    actions = ['LOG_TELEMETRY', 'ENHANCE_MONITORING', 'FLAG_SESSION_WATCHLIST'];
  } else {
    riskScore = Math.min(85.0, 20.0 * events.length);
    attackStage = 'COMPROMISED';
    chain = types;
    summary = `CORRELATED THREAT: ${events.length} anomalous events detected within 30-minute sliding window. Escalating surveillance.`;
    actions = ['TRIGGER_BIOMETRIC_STEPUP', 'ALERT_FRAUD_ANALYST', 'REQUIRE_STEPUP_AUTH'];
  }

  // Action Details
  const actionDetails = actions.map((act) => ({
    action_id: crypto.randomUUID().substring(0, 8),
    name: act.replace(/_/g, ' '),
    description: `Automated defense enforcement: ${act}`,
    status: riskScore > 60 ? 'EXECUTED' : 'ENFORCING',
    triggered_at: new Date().toISOString(),
    severity: ['FREEZE_TRANSACTION', 'EMERGENCY_ACCOUNT_LOCKDOWN', 'REVOKE_ALL_TOKENS'].includes(act)
      ? 'CRITICAL'
      : act.includes('BIOMETRIC')
      ? 'HIGH'
      : 'MEDIUM',
  }));

  // Breadcrumbs
  const xaiBreadcrumbs = events.map((e, idx) => {
    let delta = 20.0;
    if (idx === 0) delta = 18.5;
    else if (idx === 1) delta = 46.5;
    else if (idx === 2) delta = 27.0;
    else delta = 7.2;

    return {
      event_id: e.event_id,
      event_type: e.event_type,
      timestamp: e.timestamp,
      formatted_time: new Date(e.timestamp).toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      confidence_score: e.metadata?.confidence_score || 0.95,
      causal_link: `Vector Step ${idx + 1}: Correlated in temporal window`,
      risk_contribution: delta,
      forensic_details: `IP: ${e.metadata?.ip || '198.51.100.42'} | IMEI: ${e.metadata?.imei || '864293041234567'} | ${e.metadata?.details || ''}`,
      ip: e.metadata?.ip || '198.51.100.42',
      imei: e.metadata?.imei || '864293041234567',
    };
  });

  return {
    user_id: userId,
    risk_score: riskScore,
    attack_stage: attackStage,
    chain_detected: chain,
    explainability_summary: summary,
    automated_actions: actions,
    action_details: actionDetails,
    xai_breadcrumbs: xaiBreadcrumbs,
    timestamp: new Date().toISOString(),
    event_count: events.length,
  };
}

function getGraphPayload(userId) {
  const events = USER_EVENTS.get(userId) || [];
  const assessment = evaluateRisk(userId, events);

  const nodes = events.map((e, idx) => {
    const isAto = ['ACTIVE_ATO', 'CRITICAL_BREACH'].includes(assessment.attack_stage);
    const severity = isAto ? 'ATO_ATTACK' : assessment.attack_stage === 'COMPROMISED' ? (idx > 0 ? 'ATO_ATTACK' : 'ELEVATED') : 'SAFE';

    return {
      id: e.event_id,
      type: 'cyberAttackNode',
      position: { x: 80 + idx * 280, y: 160 + (idx % 2 === 1 ? 20 : -20) },
      data: {
        event_id: e.event_id,
        event_type: e.event_type,
        label: e.event_type.replace(/_/g, ' '),
        stage: `STAGE ${idx + 1}/${Math.max(1, events.length)}`,
        severity,
        timestamp: new Date(e.timestamp).toISOString().substring(11, 19) + ' UTC',
        risk_contribution: 20.0,
        cumulative_risk: assessment.risk_score,
        confidence_score: e.metadata?.confidence_score || 0.95,
        ip: e.metadata?.ip,
        imei: e.metadata?.imei,
        details: e.metadata?.details,
        is_critical: isAto || assessment.risk_score > 85,
      },
    };
  });

  const edges = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const isAto = ['ACTIVE_ATO', 'CRITICAL_BREACH'].includes(assessment.attack_stage);
    const edgeColor = isAto ? '#FF2E93' : assessment.attack_stage === 'COMPROMISED' ? '#F59E0B' : '#00D2D3';
    edges.push({
      id: `e-${nodes[i].id}-${nodes[i + 1].id}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      animated: true,
      style: {
        stroke: edgeColor,
        strokeWidth: isAto ? 3.5 : 2.5,
        filter: `drop-shadow(0 0 6px ${edgeColor})`,
      },
      label: 'Δt: 1s | Corr: 98%',
      data: { weight: 0.98, color: edgeColor },
    });
  }

  return {
    user_id: userId,
    nodes,
    edges,
    assessment,
  };
}

// =========================================================================
// API Endpoints
// =========================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'SentinelX Graph Defense & Auth Engine',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/users', (req, res) => {
  res.json(Object.values(USERS_DB));
});

app.post('/api/v1/auth/signup/send-otp', (req, res) => {
  const { name, channel, email, phone, password, role, department } = req.body;
  const destination = channel === 'email' ? email : phone;

  if (!destination) {
    return res.status(400).json({ detail: 'Contact destination is required.' });
  }

  const otpCode = `${Math.floor(100000 + Math.random() * 900000)}`;
  const otpSessionId = crypto.randomUUID();

  OTP_SESSIONS.set(otpSessionId, {
    otpCode,
    name,
    channel,
    email,
    phone,
    password,
    role: role || 'SOC Security Analyst',
    department: department || 'Cyber Threat Intelligence',
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  const channelName = channel === 'email' ? 'Email' : 'SMS';
  res.json({
    success: true,
    message: `A 6-digit verification OTP has been dispatched via ${channelName} to ${destination}.`,
    otp_session_id: otpSessionId,
    debug_otp: otpCode,
    channel,
    destination,
    expires_in_seconds: 300,
  });
});

app.post('/api/v1/auth/signup/verify-otp', (req, res) => {
  const { otp_session_id, otp_code } = req.body;
  const session = OTP_SESSIONS.get(otp_session_id);

  if (!session) {
    return res.status(400).json({ detail: 'Invalid or expired OTP session. Please request a new code.' });
  }

  if (Date.now() > session.expiresAt) {
    OTP_SESSIONS.delete(otp_session_id);
    return res.status(400).json({ detail: 'Verification OTP has expired. Please request a new code.' });
  }

  if (String(otp_code).trim() !== String(session.otpCode).trim()) {
    return res.status(400).json({ detail: 'Incorrect 6-digit OTP code entered. Please try again.' });
  }

  const randomId = `USR-${Math.floor(10000 + Math.random() * 90000)}`;
  const avatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  ];

  const newUser = {
    user_id: randomId,
    name: session.name,
    email: session.email,
    phone: session.phone,
    password: session.password,
    role: session.role,
    department: session.department,
    avatar: avatars[Math.floor(Math.random() * avatars.length)],
    tier: 'SOC_OPERATOR',
    account_balance: '$750,000.00',
    is_verified: true,
    created_at: new Date().toISOString(),
  };

  USERS_DB[randomId] = newUser;
  OTP_SESSIONS.delete(otp_session_id);

  const token = `sentinelx_token_${crypto.randomUUID()}`;
  ACTIVE_SESSIONS.set(token, randomId);

  res.json({
    success: true,
    message: `Account successfully verified! Welcome to SentinelX, ${newUser.name}.`,
    token,
    user: newUser,
  });
});

app.post('/api/v1/auth/signin', (req, res) => {
  const { identifier, password } = req.body;
  const idLower = (identifier || '').trim().toLowerCase();

  let matchedUser = null;
  for (const u of Object.values(USERS_DB)) {
    if (
      u.user_id.toLowerCase() === idLower ||
      (u.email && u.email.toLowerCase() === idLower) ||
      (u.phone && u.phone.replace(/[\s-]/g, '') === idLower.replace(/[\s-]/g, ''))
    ) {
      matchedUser = u;
      break;
    }
  }

  if (!matchedUser) {
    return res.status(401).json({ detail: 'User account not found with the provided identifier.' });
  }

  if (matchedUser.password && matchedUser.password !== password) {
    return res.status(401).json({ detail: 'Invalid password credentials. Please verify your input.' });
  }

  const token = `sentinelx_token_${crypto.randomUUID()}`;
  ACTIVE_SESSIONS.set(token, matchedUser.user_id);

  res.json({
    success: true,
    message: `Authenticated as ${matchedUser.name}.`,
    token,
    user: matchedUser,
  });
});

app.post('/api/v1/auth/logout', (req, res) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.replace('Bearer ', '').trim();
    ACTIVE_SESSIONS.delete(token);
  }
  res.json({ success: true, message: 'Session invalidated successfully.' });
});

app.get('/api/v1/auth/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.json(USERS_DB['USR-84920']);
  }
  const token = auth.replace('Bearer ', '').trim();
  const userId = ACTIVE_SESSIONS.get(token);
  res.json(USERS_DB[userId] || USERS_DB['USR-84920']);
});

app.get('/api/v1/analytics/metrics', (req, res) => {
  const totalUsers = Object.keys(USERS_DB).length;
  res.json({
    total_events_ingested: 14890 + totalUsers * 120,
    mttc_seconds: 1.2,
    prevented_loss_usd: 18450000.0,
    active_threat_chains: USER_EVENTS.size,
    quarantined_identities: 2,
    mitre_tactics_covered: [
      'T1566: Phishing / Smishing',
      'T1451: SIM Swap Interception',
      'T1078: Valid Accounts / Unknown Device',
      'T1534: Internal Unauthorized Exfiltration',
      'T1110: Credential Access / Bypass',
      'T1485: Zero-Trust Containment',
    ],
    recent_activity: [
      { id: 'EV-9921', type: 'AUTO_FREEZE', target: 'Offshore Cayman Escrow', amount: '$250,000.00', time: '2 mins ago', status: 'CONTAINED' },
      { id: 'EV-9920', type: 'SIM_SWAP_FLAG', target: 'USR-84920', carrier: 'Telco SS7 Bridge', time: '5 mins ago', status: 'QUARANTINED' },
      { id: 'EV-9919', type: 'AUTH_OTP_VERIFIED', target: 'New Operator Registration', channel: 'SMS OTP', time: '12 mins ago', status: 'VERIFIED' },
      { id: 'EV-9918', type: 'WEBAUTHN_STEPUP', target: 'USR-10294', method: 'FIDO2 TouchID', time: '18 mins ago', status: 'PASSED' },
    ],
  });
});

app.get('/api/v1/policies', (req, res) => {
  res.json(CURRENT_POLICY);
});

app.post('/api/v1/policies', (req, res) => {
  CURRENT_POLICY = { ...CURRENT_POLICY, ...req.body };
  res.json(CURRENT_POLICY);
});

app.post('/api/v1/ingest', (req, res) => {
  const { user_id, event_type, metadata } = req.body;
  const event = {
    event_id: crypto.randomUUID(),
    user_id,
    event_type,
    timestamp: new Date().toISOString(),
    metadata: metadata || {},
  };

  const userEvts = USER_EVENTS.get(user_id) || [];
  userEvts.push(event);
  USER_EVENTS.set(user_id, userEvts);

  const assessment = evaluateRisk(user_id, userEvts);
  res.json(assessment);
});

app.get('/api/v1/risk/:userId', (req, res) => {
  const payload = getGraphPayload(req.params.userId);
  res.json(payload);
});

app.post('/api/v1/simulate/ato-chain', async (req, res) => {
  const userId = req.body.user_id || 'USR-84920';
  USER_EVENTS.set(userId, []);

  const stages = [
    {
      event_type: 'PHISHING_SMS_CLICKED',
      metadata: { ip: '198.51.100.42', imei: '358920194820194', confidence_score: 0.94, details: "User clicked smishing link 'https://sec-bank-verify.net/auth'" },
    },
    {
      event_type: 'SIM_SWAP_DETECTED',
      metadata: { ip: '203.0.113.88', imei: '864293041234567', confidence_score: 0.98, details: 'Telco SS7 Carrier update: eSIM re-provisioned via external IVR' },
    },
    {
      event_type: 'NEW_DEVICE_LOGIN',
      metadata: { ip: '185.220.101.5', imei: '864293041234567', confidence_score: 0.99, details: "Unregistered Device 'Linux x86_64; Tor Exit Node' authenticated via SMS OTP" },
    },
    {
      event_type: 'ABNORMAL_TRANSACTION',
      metadata: { ip: '185.220.101.5', imei: '864293041234567', confidence_score: 0.995, amount: 250000.0, recipient: 'Offshore Cayman Escrow Ltd', details: 'Immediate SWIFT wire transfer of $250,000.00 to offshore unverified beneficiary' },
    },
  ];

  const evts = [];
  for (const st of stages) {
    evts.push({
      event_id: crypto.randomUUID(),
      user_id: userId,
      event_type: st.event_type,
      timestamp: new Date().toISOString(),
      metadata: st.metadata,
    });
  }
  USER_EVENTS.set(userId, evts);

  const payload = getGraphPayload(userId);
  res.json({
    status: 'SIMULATION_COMPLETED',
    user_id: userId,
    final_assessment: payload.assessment,
    graph: payload,
    stages_executed: 4,
  });
});

app.post('/api/v1/reset', (req, res) => {
  const userId = req.body?.user_id;
  if (userId) {
    USER_EVENTS.delete(userId);
  } else {
    USER_EVENTS.clear();
  }
  res.json({ status: 'RESET_SUCCESSFUL', user_id: userId || 'ALL', timestamp: new Date().toISOString() });
});

// =========================================================================
// Static Frontend Serving & SPA Fallback (Production)
// =========================================================================

const frontendDist = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendDist));

app.use((req, res) => {
  const indexPath = path.join(frontendDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('SentinelX Defense Engine API Online. Frontend compiling...');
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🛡️ SentinelX Production Server listening on http://0.0.0.0:${PORT}`);
});
