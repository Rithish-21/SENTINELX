# SentinelX | AI Cyber Defense & Digital Trust Platform

SentinelX is a real-time graph correlation and autonomous Account Takeover (ATO) containment platform. It provides deterministic causal graph analysis, zero-trust perimeter enforcement, two-factor identity verification (Email & SMS OTP), real-time SOC telemetry analytics, live forensic audit logging, and automated threat containment policies.

---

## 🌟 Key Capabilities
- **Deterministic Causal Graph Engine**: Correlates multi-vector attack chains (Phishing, SIM Swap, New Device Login, Abnormal Exfiltration) using MITRE ATT&CK heuristics.
- **Two-Factor Identity Verification**: Registration and authentication supporting 6-digit OTP delivery to both Email and Mobile Phone (SMS).
- **Executive SOC Telemetry**: Real-time MTTC (Mean Time to Containment), prevented loss metrics, and MITRE ATT&CK coverage matrices.
- **Zero-Trust Identity & Access Center**: Device hardware fingerprinting, active session revocation, and WebAuthn FIDO2 step-up challenges.
- **Live Forensics Audit Log**: Streaming terminal console with keyword search, severity filtering, and JSON/CSV data export.
- **Automated Containment Policies**: Real-time rule toggles for transaction auto-freezing (>$100k), SIM-swap 48h quarantine, and Tor exit node blocking.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Full-Stack Application
Runs both the Python FastAPI engine (`http://127.0.0.1:8000`) and the Vite React frontend (`http://localhost:5173`) concurrently:
```bash
npm start
# or
npm run dev
```

### 3. Open Dashboard
Visit [http://localhost:5173](http://localhost:5173) in your browser.
