import React, { useState, useEffect, useCallback } from 'react';
import { Header, type DashboardTab } from './components/Header';
import { AttackSimulatorPanel } from './components/AttackSimulatorPanel';
import { AttackGraph } from './components/AttackGraph';
import { ThreatIntelPanel } from './components/ThreatIntelPanel';
import { CriticalContainmentBanner } from './components/CriticalContainmentBanner';
import { AuthModal } from './components/auth/AuthModal';
import { SocAnalyticsPanel } from './components/dashboard/SocAnalyticsPanel';
import { IdentityAccessPanel } from './components/dashboard/IdentityAccessPanel';
import { AuditLogPanel } from './components/dashboard/AuditLogPanel';
import { SecurityPoliciesPanel } from './components/dashboard/SecurityPoliciesPanel';
import { sentinelApi } from './api/sentinel';
import { useAuth } from './context/AuthContext';
import type {
  EventType,
  AttackStage,
  RiskAssessment,
  UserProfile,
  SocAnalyticsSummary,
} from './types/sentinel';
import type { Node, Edge } from '@xyflow/react';

export const App: React.FC = () => {
  const { user, isAuthModalOpen, closeAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<DashboardTab>('graph');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('USR-84920');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [analytics, setAnalytics] = useState<SocAnalyticsSummary | null>(null);
  const [riskScore, setRiskScore] = useState<number>(0);
  const [attackStage, setAttackStage] = useState<AttackStage>('SAFE');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);
  const [activeEvents, setActiveEvents] = useState<string[]>([]);
  const [hudMessage, setHudMessage] = useState<string | null>(null);

  // Trigger temporary HUD toast message
  const showHudToast = (msg: string) => {
    setHudMessage(msg);
    setTimeout(() => {
      setHudMessage(null);
    }, 4000);
  };

  // Sync current user id with AuthContext user
  useEffect(() => {
    if (user?.user_id) {
      setCurrentUserId(user.user_id);
    }
  }, [user]);

  // 1. Initial Load & Health Check
  useEffect(() => {
    const init = async () => {
      const isHealthy = await sentinelApi.checkHealth();
      setIsBackendConnected(isHealthy);

      const userList = await sentinelApi.getUsers();
      setUsers(userList);
      if (userList.length > 0 && !user) {
        setCurrentUserId(userList[0].user_id);
      }

      const analyticsData = await sentinelApi.getAnalytics();
      setAnalytics(analyticsData);
    };
    init();

    // Periodic Health Check
    const healthInterval = setInterval(async () => {
      const healthy = await sentinelApi.checkHealth();
      setIsBackendConnected(healthy);
    }, 4000);

    return () => clearInterval(healthInterval);
  }, [user]);

  // 2. Fetch Graph & Assessment for Current User
  const refreshGraphState = useCallback(async (userId: string) => {
    try {
      const payload = await sentinelApi.getRiskAndGraph(userId);
      setNodes(payload.nodes as unknown as Node[]);
      setEdges(payload.edges as unknown as Edge[]);
      setAssessment(payload.assessment);
      setRiskScore(payload.assessment.risk_score);
      setAttackStage(payload.assessment.attack_stage);
      setActiveEvents(payload.assessment.chain_detected || []);

      if (payload.assessment.risk_score <= 85) {
        setIsBannerDismissed(false);
      }
    } catch (err) {
      console.error('Error refreshing graph state:', err);
    }
  }, []);

  useEffect(() => {
    if (currentUserId) {
      refreshGraphState(currentUserId);
    }
  }, [currentUserId, refreshGraphState]);

  // 3. Trigger Step Event
  const handleTriggerEvent = async (
    eventType: EventType,
    customMeta?: Record<string, any>
  ) => {
    try {
      showHudToast(`Ingesting anomalous vector: ${eventType}...`);
      await sentinelApi.ingestEvent({
        user_id: currentUserId,
        event_type: eventType,
        metadata: customMeta,
      });
      await refreshGraphState(currentUserId);
    } catch (err) {
      console.error('Error ingesting event:', err);
      showHudToast(`Failed to ingest event: ${String(err)}`);
    }
  };

  // 4. Run Full 4-Stage ATO Simulation
  const handleRunFullSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setIsBannerDismissed(false);
    showHudToast('Initializing 4-Stage ATO Simulation Protocol...');

    try {
      // Step 1
      showHudToast('[01/04] Injecting PHISHING_SMS_CLICKED...');
      await sentinelApi.ingestEvent({
        user_id: currentUserId,
        event_type: 'PHISHING_SMS_CLICKED',
        metadata: {
          ip: '198.51.100.42',
          imei: '358920194820194',
          confidence_score: 0.94,
          details: "Clicked 'https://sec-bank-verify.net/auth'",
        },
      });
      await refreshGraphState(currentUserId);
      await new Promise((r) => setTimeout(r, 1000));

      // Step 2
      showHudToast('[02/04] Injecting SIM_SWAP_DETECTED...');
      await sentinelApi.ingestEvent({
        user_id: currentUserId,
        event_type: 'SIM_SWAP_DETECTED',
        metadata: {
          ip: '203.0.113.88',
          imei: '864293041234567',
          confidence_score: 0.98,
          details: 'Telco SS7 Carrier update: eSIM re-provisioned',
        },
      });
      await refreshGraphState(currentUserId);
      await new Promise((r) => setTimeout(r, 1000));

      // Step 3
      showHudToast('[03/04] Injecting NEW_DEVICE_LOGIN...');
      await sentinelApi.ingestEvent({
        user_id: currentUserId,
        event_type: 'NEW_DEVICE_LOGIN',
        metadata: {
          ip: '185.220.101.5',
          imei: '864293041234567',
          confidence_score: 0.99,
          details: "Unregistered Device 'Linux x86_64; Tor Exit Node'",
        },
      });
      await refreshGraphState(currentUserId);
      await new Promise((r) => setTimeout(r, 1000));

      // Step 4
      showHudToast('[04/04] Injecting ABNORMAL_TRANSACTION ($250k Wire)...');
      await sentinelApi.ingestEvent({
        user_id: currentUserId,
        event_type: 'ABNORMAL_TRANSACTION',
        metadata: {
          ip: '185.220.101.5',
          imei: '864293041234567',
          confidence_score: 0.995,
          amount: 250000.0,
          recipient: 'Offshore Cayman Escrow Ltd',
          details: 'SWIFT wire transfer of $250,000.00 to offshore escrow',
        },
      });
      await refreshGraphState(currentUserId);
      showHudToast('CRITICAL CONTAINMENT DEPLOYED - AUTOMATED TRANSACTION FREEZE ENGAGED');
    } catch (err) {
      console.error('Simulation error:', err);
      showHudToast('Simulation interrupted by network error.');
    } finally {
      setIsSimulating(false);
    }
  };

  // 5. Reset Session
  const handleReset = async () => {
    try {
      showHudToast(`Resetting session telemetry for ${currentUserId}...`);
      await sentinelApi.resetSession(currentUserId);
      await refreshGraphState(currentUserId);
      setIsBannerDismissed(false);
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  // 6. Manual Override
  const handleManualOverride = () => {
    alert(
      `[SECURITY OVERRIDE AUTHORIZATION]\nOperator manual override granted for ${currentUserId}. Incident ticket dispatched to SecOps.`
    );
    setIsBannerDismissed(true);
  };

  const showContainmentBanner = riskScore > 85 && !isBannerDismissed;

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 flex flex-col font-sans selection:bg-[#00D2D3]/30 selection:text-[#00D2D3]">
      {/* Top Header */}
      <Header
        attackStage={attackStage}
        riskScore={riskScore}
        isBackendConnected={isBackendConnected}
        nodeCount={nodes.length}
        onReset={handleReset}
        isSimulating={isSimulating}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Critical Containment Alert Banner */}
      <CriticalContainmentBanner
        isVisible={showContainmentBanner}
        riskScore={riskScore}
        onDismiss={() => setIsBannerDismissed(true)}
        onManualOverride={handleManualOverride}
      />

      {/* Temporary HUD Toast Notification */}
      {hudMessage && (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#111C33]/95 border border-[#00D2D3] text-[#00D2D3] font-mono text-xs font-bold shadow-cyan-glow-lg backdrop-blur-md animate-bounce flex items-center gap-2">
          <span>⚡</span>
          <span>{hudMessage}</span>
        </div>
      )}

      {/* Auth Modal / Sign In / Sign Up / OTP Verification */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        availableUsers={users}
      />

      {/* Dynamic View Tab Body */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6">
        {/* VIEW 1: THREAT GRAPH COMMAND CENTER */}
        {activeTab === 'graph' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Panel 1 (Left 3 cols): Attack Chain Simulator */}
            <section className="lg:col-span-3 flex flex-col">
              <AttackSimulatorPanel
                currentUserId={currentUserId}
                users={users}
                onSelectUser={setCurrentUserId}
                onTriggerEvent={handleTriggerEvent}
                onRunFullSimulation={handleRunFullSimulation}
                onReset={handleReset}
                isSimulating={isSimulating}
                activeEvents={activeEvents}
              />
            </section>

            {/* Panel 2 (Center 6 cols): Real-Time Attack Graph */}
            <section className="lg:col-span-6 flex flex-col min-h-[580px]">
              <AttackGraph
                nodes={nodes}
                edges={edges}
                attackStage={attackStage}
                riskScore={riskScore}
              />
            </section>

            {/* Panel 3 (Right 3 cols): Threat Intelligence & Containment Hub */}
            <section className="lg:col-span-3 flex flex-col">
              <ThreatIntelPanel
                assessment={assessment}
                riskScore={riskScore}
                attackStage={attackStage}
              />
            </section>
          </div>
        )}

        {/* VIEW 2: SOC ANALYTICS & TELEMETRY */}
        {activeTab === 'analytics' && (
          <SocAnalyticsPanel
            analytics={analytics}
            assessment={assessment}
            riskScore={riskScore}
          />
        )}

        {/* VIEW 3: ZERO-TRUST IDENTITY & DEVICES */}
        {activeTab === 'identity' && (
          <IdentityAccessPanel
            users={users}
            currentUserId={currentUserId}
            onSelectUser={setCurrentUserId}
          />
        )}

        {/* VIEW 4: LIVE FORENSIC AUDIT LOGS */}
        {activeTab === 'audit' && <AuditLogPanel />}

        {/* VIEW 5: SECURITY POLICIES & AUTOMATION */}
        {activeTab === 'policies' && (
          <SecurityPoliciesPanel onNotify={showHudToast} />
        )}
      </main>
    </div>
  );
};

export default App;
