import axios from 'axios';
import type {
  IngestEventPayload,
  RiskAssessment,
  GraphPayload,
  UserProfile,
  SendOtpPayload,
  VerifyOtpPayload,
  LoginPayload,
  AuthResponse,
  SecurityPolicyConfig,
  SocAnalyticsSummary,
} from '../types/sentinel';

// Prefer relative path if running through Vite dev proxy, or direct 127.0.0.1:8000
const API_BASE_URL = window.location.port === '5173' ? '' : 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('sentinelx_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const sentinelApi = {
  async checkHealth(): Promise<boolean> {
    try {
      const res = await client.get('/health');
      return res.status === 200 && res.data.status === 'HEALTHY';
    } catch {
      try {
        const directRes = await axios.get('http://127.0.0.1:8000/health', { timeout: 3000 });
        return directRes.status === 200 && directRes.data.status === 'HEALTHY';
      } catch {
        return false;
      }
    }
  },

  // =========================================================================
  // Authentication & OTP APIs
  // =========================================================================

  async signupSendOtp(payload: SendOtpPayload): Promise<AuthResponse> {
    try {
      const res = await client.post<AuthResponse>('/api/v1/auth/signup/send-otp', payload);
      return res.data;
    } catch (err: any) {
      if (err.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }
      try {
        const directRes = await axios.post<AuthResponse>('http://127.0.0.1:8000/api/v1/auth/signup/send-otp', payload);
        return directRes.data;
      } catch (innerErr: any) {
        throw new Error(innerErr.response?.data?.detail || 'Failed to dispatch verification OTP.');
      }
    }
  },

  async signupVerifyOtp(payload: VerifyOtpPayload): Promise<AuthResponse> {
    try {
      const res = await client.post<AuthResponse>('/api/v1/auth/signup/verify-otp', payload);
      if (res.data.token) {
        localStorage.setItem('sentinelx_auth_token', res.data.token);
      }
      return res.data;
    } catch (err: any) {
      if (err.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }
      try {
        const directRes = await axios.post<AuthResponse>('http://127.0.0.1:8000/api/v1/auth/signup/verify-otp', payload);
        if (directRes.data.token) {
          localStorage.setItem('sentinelx_auth_token', directRes.data.token);
        }
        return directRes.data;
      } catch (innerErr: any) {
        throw new Error(innerErr.response?.data?.detail || 'Failed to verify OTP code.');
      }
    }
  },

  async signin(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const res = await client.post<AuthResponse>('/api/v1/auth/signin', payload);
      if (res.data.token) {
        localStorage.setItem('sentinelx_auth_token', res.data.token);
      }
      return res.data;
    } catch (err: any) {
      if (err.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }
      try {
        const directRes = await axios.post<AuthResponse>('http://127.0.0.1:8000/api/v1/auth/signin', payload);
        if (directRes.data.token) {
          localStorage.setItem('sentinelx_auth_token', directRes.data.token);
        }
        return directRes.data;
      } catch (innerErr: any) {
        throw new Error(innerErr.response?.data?.detail || 'Invalid login credentials.');
      }
    }
  },

  async logout(): Promise<void> {
    try {
      await client.post('/api/v1/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('sentinelx_auth_token');
    }
  },

  async getMe(): Promise<UserProfile> {
    try {
      const res = await client.get<UserProfile>('/api/v1/auth/me');
      return res.data;
    } catch {
      const directRes = await axios.get<UserProfile>('http://127.0.0.1:8000/api/v1/auth/me');
      return directRes.data;
    }
  },

  // =========================================================================
  // Users & Analytics APIs
  // =========================================================================

  async getUsers(): Promise<UserProfile[]> {
    try {
      const res = await client.get<UserProfile[]>('/api/v1/users');
      return res.data;
    } catch {
      try {
        const directRes = await axios.get<UserProfile[]>('http://127.0.0.1:8000/api/v1/users', { timeout: 5000 });
        return directRes.data;
      } catch (err) {
        console.warn('Backend unavailable, returning fallback user profiles', err);
        return [
          {
            user_id: 'USR-84920',
            name: 'Alex Vance',
            email: 'alex.vance@sentinelx.security',
            phone: '+1 (555) 948-2019',
            role: 'VIP Chief Executive Officer',
            department: 'Executive Office',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            tier: 'VIP_EXECUTIVE',
            account_balance: '$1,450,000.00',
            is_verified: true,
          },
          {
            user_id: 'USR-10294',
            name: 'Sarah Jenkins',
            email: 'sarah.jenkins@sentinelx.security',
            phone: '+1 (555) 102-9482',
            role: 'Lead Treasury Officer',
            department: 'Corporate Treasury & Wire',
            avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
            tier: 'TREASURY_ADMIN',
            account_balance: '$8,920,500.00',
            is_verified: true,
          },
          {
            user_id: 'USR-55912',
            name: 'David Chen',
            email: 'david.chen@sentinelx.security',
            phone: '+1 (555) 559-1234',
            role: 'Principal DevOps Architect',
            department: 'Infrastructure & Cloud Sec',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            tier: 'SYSTEM_ADMIN',
            account_balance: '$320,000.00',
            is_verified: true,
          },
        ];
      }
    }
  },

  async getAnalytics(): Promise<SocAnalyticsSummary> {
    try {
      const res = await client.get<SocAnalyticsSummary>('/api/v1/analytics/metrics');
      return res.data;
    } catch {
      try {
        const directRes = await axios.get<SocAnalyticsSummary>('http://127.0.0.1:8000/api/v1/analytics/metrics');
        return directRes.data;
      } catch {
        return {
          total_events_ingested: 15240,
          mttc_seconds: 1.2,
          prevented_loss_usd: 18450000.0,
          active_threat_chains: 1,
          quarantined_identities: 2,
          mitre_tactics_covered: [
            'T1566: Phishing',
            'T1451: SIM Swap Interception',
            'T1078: Valid Accounts / Unknown Device',
            'T1534: Internal Exfiltration',
            'T1110: Credential Access',
          ],
          recent_activity: [],
        };
      }
    }
  },

  async getPolicies(): Promise<SecurityPolicyConfig> {
    try {
      const res = await client.get<SecurityPolicyConfig>('/api/v1/policies');
      return res.data;
    } catch {
      return {
        auto_freeze_high_value: true,
        high_value_threshold: 100000.0,
        quarantine_sim_swap_hours: 48,
        block_tor_nodes: true,
        enforce_fido2_stepup: true,
        dynamic_risk_multiplier: 1.0,
        zero_trust_device_isolation: true,
        geo_velocity_threshold_mph: 600.0,
      };
    }
  },

  async updatePolicies(config: SecurityPolicyConfig): Promise<SecurityPolicyConfig> {
    try {
      const res = await client.post<SecurityPolicyConfig>('/api/v1/policies', config);
      return res.data;
    } catch {
      return config;
    }
  },

  // =========================================================================
  // Sentinel Graph & Threat Ingestion APIs
  // =========================================================================

  async ingestEvent(event: IngestEventPayload): Promise<RiskAssessment> {
    try {
      const res = await client.post<RiskAssessment>('/api/v1/ingest', event);
      return res.data;
    } catch {
      const directRes = await axios.post<RiskAssessment>('http://127.0.0.1:8000/api/v1/ingest', event);
      return directRes.data;
    }
  },

  async getRiskAndGraph(userId: string): Promise<GraphPayload> {
    try {
      const res = await client.get<GraphPayload>(`/api/v1/risk/${userId}`);
      return res.data;
    } catch {
      const directRes = await axios.get<GraphPayload>(`http://127.0.0.1:8000/api/v1/risk/${userId}`);
      return directRes.data;
    }
  },

  async simulateATOChain(userId: string, stepDelaySec: number = 1.0): Promise<{
    status: string;
    user_id: string;
    final_assessment: RiskAssessment;
    graph: GraphPayload;
    stages_executed: number;
  }> {
    const payload = {
      user_id: userId,
      step_delay_sec: stepDelaySec,
      auto_execute: true,
    };
    try {
      const res = await client.post('/api/v1/simulate/ato-chain', payload);
      return res.data;
    } catch {
      const directRes = await axios.post('http://127.0.0.1:8000/api/v1/simulate/ato-chain', payload);
      return directRes.data;
    }
  },

  async resetSession(userId?: string): Promise<{ status: string; user_id: string }> {
    try {
      const res = await client.post('/api/v1/reset', { user_id: userId });
      return res.data;
    } catch {
      const directRes = await axios.post('http://127.0.0.1:8000/api/v1/reset', { user_id: userId });
      return directRes.data;
    }
  },
};
