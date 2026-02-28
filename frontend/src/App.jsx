import { useEffect, useRef, useState } from "react";

const FOOD_DATA = [
  { emoji: "🍎", name: "Apple", status: "fresh", freshness: 88, days: "~6 days", confidence: 97 },
  { emoji: "🍞", name: "Bread Loaf", status: "warning", freshness: 38, days: "Today", confidence: 91 },
  { emoji: "🍓", name: "Strawberries", status: "spoiled", freshness: 5, days: "Expired", confidence: 95 },
  { emoji: "🥕", name: "Carrots", status: "fresh", freshness: 72, days: "~4 days", confidence: 89 },
  { emoji: "🥛", name: "Milk", status: "warning", freshness: 42, days: "Tomorrow", confidence: 93 },
  { emoji: "🥑", name: "Avocado", status: "fresh", freshness: 90, days: "~3 days", confidence: 96 },
  { emoji: "🍋", name: "Lemons", status: "fresh", freshness: 95, days: "~10 days", confidence: 98 },
];

const INITIAL_NOTIFICATIONS = [
  { id: "n1", icon: "🏦", iconClass: "notif-bank", title: "City Food Bank alerted", sub: "2 items available for pickup · 0.4 mi away", time: "2m ago" },
  { id: "n2", icon: "👋", iconClass: "notif-neighbor", title: "Neighbor Sarah M. notified", sub: "Claimed: Bread loaf · Expires today", time: "15m ago" },
  { id: "n3", icon: "🏦", iconClass: "notif-bank", title: "Sunshine Shelter alerted", sub: "Produce bundle accepted · Pickup scheduled", time: "1h ago" },
  { id: "n4", icon: "⚠️", iconClass: "notif-alert", title: "Spoilage detected", sub: "Strawberries - composting recommended", time: "3h ago" },
  { id: "n5", icon: "👋", iconClass: "notif-neighbor", title: "3 neighbors in your network", sub: "Tap to manage sharing preferences", time: "Settings" },
];

const PAGE = window.location.pathname.endsWith("/login.html") || window.location.pathname === "/login.html" ? "login" : "dashboard";

function App() {
  return PAGE === "login" ? <LoginPage /> : <DashboardPage />;
}

function DashboardPage() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimeoutRef = useRef(null);
  const alertTimeoutRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [cameraLive, setCameraLive] = useState(false);
  const [statusLabel, setStatusLabel] = useState("Camera Ready");
  const [demoIndex, setDemoIndex] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [results, setResults] = useState([]);
  const [geminiResults, setGeminiResults] = useState([]);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState("results");
  const [alertState, setAlertState] = useState(null);

  // Fetch Gemini results from API
  const fetchGeminiResults = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/gemini-results');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGeminiResults(data.results);
        }
      }
    } catch (error) {
      console.error('Error fetching Gemini results:', error);
    }
  };

  // Add test detection
  const addTestDetection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/test-detection', {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGeminiResults(prev => [...prev, data.result]);
        }
      }
    } catch (error) {
      console.error('Error adding test detection:', error);
    }
  };

  // Fetch results on component mount and set up polling
  useEffect(() => {
    fetchGeminiResults();
    // Poll for new results every 30 seconds
    const interval = setInterval(fetchGeminiResults, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const finishScan = (food) => {
    setScanning(false);
    setLastResult(food);
    const result = {
      ...food,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      actions: {},
    };
    setResults((current) => [result, ...current]);
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    const nextAlert =
      food.status === "fresh"
        ? { kind: "good-alert", icon: "📦", text: `3 food banks + 2 neighbors notified about your ${food.name}!` }
        : food.status === "warning"
          ? { kind: "good-alert", icon: "⚡", text: `${food.name} expiring soon - City Food Bank alerted for urgent pickup.` }
          : { kind: "bad-alert", icon: "♻️", text: `${food.name} is spoiled. Consider composting to reduce methane emissions.` };
    setTimeout(() => setAlertState(nextAlert), 600);
    alertTimeoutRef.current = window.setTimeout(() => setAlertState(null), 5000);
  };

  const startScan = (food, duration) => {
    if (scanning) {
      return;
    }
    setScanning(true);
    setAlertState(null);
    setLastResult(null);
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    scanTimeoutRef.current = window.setTimeout(() => finishScan(food), duration);
  };

  const handleStartScan = () => {
    const randomFood = FOOD_DATA[Math.floor(Math.random() * FOOD_DATA.length)];
    startScan(randomFood, 2800);
  };

  const handleDemoScan = () => {
    const food = FOOD_DATA[demoIndex % FOOD_DATA.length];
    setDemoIndex((current) => current + 1);
    startScan(food, 2400);
  };

  const handleOpenCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      window.alert("Camera is not available in this browser. Try the Demo button instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraLive(true);
      setStatusLabel("Live Camera");
    } catch {
      window.alert("Camera access denied. Try the Demo button instead!");
    }
  };

  const handleLogout = () => {
    window.location.href = "./login.html";
  };

  const updateResultAction = (id, action, value) => {
    setResults((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              actions: {
                ...item.actions,
                [action]: value,
              },
            }
          : item,
      ),
    );
  };

  const addNotification = (icon, iconClass, title, sub, time) => {
    setNotifications((current) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        icon,
        iconClass,
        title,
        sub,
        time,
      },
      ...current,
    ]);
  };

  const handlePrimaryAction = (item) => {
    if (item.actions.primary) {
      return;
    }
    const label = item.status === "warning" ? "Scheduled" : "Sent!";
    updateResultAction(item.id, "primary", label);
    if (item.status === "warning") {
      addNotification("🏦", "notif-bank", "Urgent pickup scheduled", `${item.name} reserved for same-day pickup`, "Just now");
      return;
    }
    addNotification("🏦", "notif-bank", "Food bank alerted", "Item claimed for pickup · Pending confirmation", "Just now");
  };

  const handleSecondaryAction = (item) => {
    if (item.actions.secondary) {
      return;
    }
    if (item.status === "fresh") {
      updateResultAction(item.id, "secondary", "Shared!");
      addNotification("👋", "notif-neighbor", "Neighbor notified", "Sarah M. has been alerted", "Just now");
      return;
    }
    if (item.status === "warning") {
      updateResultAction(item.id, "secondary", "Scheduled");
      return;
    }
    updateResultAction(item.id, "secondary", "Done");
  };

  const handleSpoiledPrimary = (item) => {
    if (item.actions.primary) {
      return;
    }
    updateResultAction(item.id, "primary", "Logged");
  };

  return (
    <>
      <header>
        <div className="logo">
          Fresh<span>Loop</span>
        </div>
        <div className="header-actions">
          <div className="status-pill">
            <div className="status-dot" />
            <span>{statusLabel}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </header>

      <main>
        <div className="camera-section">
          <div className="section-label">Detection View</div>

          <div className="camera-container">
            <video ref={videoRef} className="camera-feed" autoPlay playsInline style={{ display: cameraLive ? "block" : "none" }} />

            {!cameraLive && (
              <div className="camera-placeholder">
                <div className="camera-icon-wrap">
                  <CameraIcon />
                </div>
                <p>Place food in front of camera</p>
              </div>
            )}

            <div className={`scan-overlay ${scanning ? "active" : ""}`}>
              <div className="scan-line" />
              <div className="corner corner-tl" />
              <div className="corner corner-tr" />
              <div className="corner corner-bl" />
              <div className="corner corner-br" />
            </div>

            <div
              className={`detection-badge ${lastResult ? `show ${lastResult.status}` : ""}`.trim()}
              aria-hidden={!lastResult}
            >
              <div className="badge-item">{lastResult ? `${lastResult.emoji} ${lastResult.name}` : "🍎 Apple"}</div>
              <div className={`badge-status ${lastResult?.status || "fresh"}`}>
                {lastResult
                  ? lastResult.status === "fresh"
                    ? `✓ Fresh - ${lastResult.days} left`
                    : lastResult.status === "warning"
                      ? `⚠ Use soon - ${lastResult.days}`
                      : `✕ Spoiled - ${lastResult.days}`
                  : "✓ Fresh - 6 days left"}
              </div>
            </div>
          </div>

          <div className={`alert-banner ${alertState ? `${alertState.kind} show` : ""}`.trim()}>
            <span>{alertState?.icon || "📦"}</span>
            <div className="alert-text">{alertState?.text || "Alerting nearby food banks and neighbors..."}</div>
          </div>

          <div className="camera-controls">
            <button className={`btn-primary ${scanning ? "scanning" : ""}`.trim()} onClick={handleStartScan} type="button">
              {scanning ? "⟳ Scanning..." : results.length ? "▶ Scan Again" : "▶ Start Scan"}
            </button>
            <button className="btn-secondary" onClick={handleDemoScan} type="button">
              Demo
            </button>
            <button className="btn-secondary" onClick={handleOpenCamera} type="button">
              📷 Camera
            </button>
          </div>
        </div>

        <div className="right-panel">
          <div className="panel-tabs">
            <button className={`tab ${activeTab === "results" ? "active" : ""}`.trim()} onClick={() => setActiveTab("results")} type="button">
              Results
            </button>
            <button className={`tab ${activeTab === "alerts" ? "active" : ""}`.trim()} onClick={() => setActiveTab("alerts")} type="button">
              Alerts
            </button>
            <button className={`tab ${activeTab === "stats" ? "active" : ""}`.trim()} onClick={() => setActiveTab("stats")} type="button">
              Impact
            </button>
          </div>

          {activeTab === "results" && (
            <div className="panel-content">
              {/* Gemini Detection Results */}
              {geminiResults.length > 0 && (
                <div className="gemini-section">
                  <div className="section-header">
                    <h3>🔬 Gemini Vision Analysis</h3>
                    <button 
                      className="refresh-btn" 
                      onClick={fetchGeminiResults}
                      title="Refresh results"
                    >
                      🔄
                    </button>
                  </div>
                  {geminiResults.slice().reverse().map((result, index) => (
                    <GeminiResultCard key={result.id} result={result} />
                  ))}
                </div>
              )}

              {/* Original Demo Results */}
              {results.length > 0 && (
                <div className="demo-section">
                  <h4>📱 Demo Results</h4>
                  {results.map((item) => (
                    <ResultCard
                      item={item}
                      key={item.id}
                      onFreshPrimary={handlePrimaryAction}
                      onSecondary={handleSecondaryAction}
                      onSpoiledPrimary={handleSpoiledPrimary}
                    />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!results.length && !geminiResults.length && (
                <div className="empty-state">
                  <span className="big">🌿</span>
                  <span>Scan food to see results here</span>
                  <button 
                    className="test-btn"
                    onClick={addTestDetection}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    🧪 Add Test Detection
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "alerts" && (
            <div className="panel-content">
              {notifications.map((notification) => (
                <div className="notification-item" key={notification.id}>
                  <div className={`notif-icon ${notification.iconClass}`}>{notification.icon}</div>
                  <div className="notif-body">
                    <div className="notif-title">{notification.title}</div>
                    <div className="notif-sub">{notification.sub}</div>
                  </div>
                  <div className="notif-time">{notification.time}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "stats" && (
            <div className="panel-content">
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-value stat-good">47</div>
                  <div className="stat-label">Items saved this month</div>
                  <MiniChart bars={["30%", "50%", "40%", "70%", "60%", "85%", "100%"]} color="rgba(46,140,90,0.3)" endColor="var(--good)" />
                </div>
                <div className="stat-card">
                  <div className="stat-value stat-accent">12.4</div>
                  <div className="stat-label">kg CO2 prevented</div>
                  <MiniChart bars={["20%", "45%", "35%", "65%", "55%", "80%", "95%"]} color="rgba(58,110,58,0.3)" endColor="var(--moss)" />
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: "var(--leaf)" }}>
                    8
                  </div>
                  <div className="stat-label">Neighbors helped</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value stat-warn">3</div>
                  <div className="stat-label">Food banks served</div>
                </div>
              </div>

              <div className="section-label network-label">Your network</div>
              <div className="network-list">
                <NetworkItem title="City Food Bank" sub="0.4 mi · Open 9AM-6PM" status="● Active" statusClass="network-good" />
                <NetworkItem title="Sunshine Shelter" sub="1.2 mi · Accepts all produce" status="● Active" statusClass="network-good" />
                <NetworkItem title="3 Neighbors nearby" sub="Sarah M., Tom K., + 1 more" status="● Sharing On" statusClass="network-accent" />
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function GeminiResultCard({ result }) {
  const safeToEat = result.safe_to_eat?.toLowerCase().includes('yes');
  const communityShare = result.community_share?.toLowerCase().includes('yes');

  return (
    <div className="gemini-result-card">
      <div className="result-header">
        <div className="result-title">
          <h4>🍎 {result.name}</h4>
          <div className="confidence-badge">
            {(result.confidence * 100).toFixed(0)}% confidence
          </div>
        </div>
        <div className="timestamp">
          {new Date(result.timestamp).toLocaleTimeString()}
        </div>
      </div>
      
      <div className="result-details">
        <div className="detail-row">
          <span className="label">Quality:</span>
          <span className="value quality">{result.quality}</span>
        </div>
        
        <div className="detail-row">
          <span className="label">Quantity:</span>
          <span className="value">{result.quantity}</span>
        </div>
        
        <div className="detail-row">
          <span className="label">Condition:</span>
          <span className="value">{result.condition}</span>
        </div>
        
        <div className="detail-row">
          <span className="label">Safe to Eat:</span>
          <span className={`value safety ${safeToEat ? 'safe' : 'unsafe'}`}>
            {safeToEat ? '✅' : '⚠️'} {result.safe_to_eat}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="label">Community Share:</span>
          <span className={`value community ${communityShare ? 'shareable' : 'not-shareable'}`}>
            {communityShare ? '🤝' : '❌'} {result.community_share}
          </span>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ item, onFreshPrimary, onSecondary, onSpoiledPrimary }) {
  const tagClass = item.status === "fresh" ? "tag-fresh" : item.status === "warning" ? "tag-warn" : "tag-spoiled";
  const tagText = item.status === "fresh" ? "✓ Fresh" : item.status === "warning" ? "⚠ Expiring" : "✕ Spoiled";
  const fillClass = item.status === "fresh" ? "fill-fresh" : item.status === "warning" ? "fill-warn" : "fill-spoiled";

  return (
    <div className="result-card">
      <div className="result-header">
        <div className="result-name">{`${item.emoji} ${item.name}`}</div>
        <div className={`freshness-tag ${tagClass}`}>{tagText}</div>
      </div>
      <div className="result-meta">
        <div className="meta-item">
          Expires<span>{item.days}</span>
        </div>
        <div className="meta-item">
          Confidence<span>{item.confidence}%</span>
        </div>
      </div>
      <div className="freshness-bar">
        <div className={`freshness-fill ${fillClass}`} style={{ width: `${item.freshness}%` }} />
      </div>
      <div className="action-row">
        {item.status === "spoiled" ? (
          <>
            <button className="action-btn" onClick={() => onSpoiledPrimary(item)} type="button" disabled={Boolean(item.actions.primary)}>
              {item.actions.primary ? `✓ ${item.actions.primary}` : "♻️ Compost"}
            </button>
            <button className="action-btn" onClick={() => onSecondary(item)} type="button" disabled={Boolean(item.actions.secondary)}>
              {item.actions.secondary ? `✓ ${item.actions.secondary}` : "📋 Log"}
            </button>
          </>
        ) : (
          <>
            <button className="action-btn primary-action" onClick={() => onFreshPrimary(item)} type="button" disabled={Boolean(item.actions.primary)}>
              {item.actions.primary ? `✓ ${item.actions.primary}` : "🏦 Alert Banks"}
            </button>
            <button className="action-btn" onClick={() => onSecondary(item)} type="button" disabled={Boolean(item.actions.secondary)}>
              {item.actions.secondary
                ? `✓ ${item.actions.secondary}`
                : item.status === "warning"
                  ? "📅 Schedule"
                  : "👋 Share"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MiniChart({ bars, color, endColor }) {
  return (
    <div className="mini-chart">
      {bars.map((height, index) => (
        <div
          className="bar"
          key={`${height}-${index}`}
          style={{ height, background: index === bars.length - 1 ? endColor : color }}
        />
      ))}
    </div>
  );
}

function NetworkItem({ title, sub, status, statusClass }) {
  return (
    <div className="network-item">
      <div>
        <div className="network-title">{title}</div>
        <div className="network-sub">{sub}</div>
      </div>
      <div className={`network-status ${statusClass}`}>{status}</div>
    </div>
  );
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!success) {
      return undefined;
    }
    const timeout = window.setTimeout(() => {
      window.location.href = "./index.html";
    }, 1500);
    return () => clearTimeout(timeout);
  }, [success]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    window.setTimeout(() => {
      if (email.trim() === "demo@freshloop.com" && password === "password") {
        setLoading(false);
        setSuccess(true);
        return;
      }
      setLoading(false);
      setPassword("");
      setError("Invalid email or password. Try demo@freshloop.com / password");
    }, 1600);
  };

  return (
    <>
      <div className="bg-wrap">
        <Leaf className="leaf leaf-1" variant="one" />
        <Leaf className="leaf leaf-2" variant="two" />
        <Leaf className="leaf leaf-3" variant="three" />
        <Leaf className="leaf leaf-4" variant="four" />
        <Leaf className="leaf leaf-5" variant="five" />
      </div>

      <div className={`success-overlay ${success ? "show" : ""}`.trim()}>
        <div className="success-icon">
          <CheckIcon />
        </div>
        <div className="success-msg">Welcome back!</div>
        <div className="success-sub">Redirecting to your dashboard...</div>
      </div>

      <div className="page">
        <div className="brand-panel">
          <div className="logo">
            Fresh<em>Loop</em>
          </div>

          <div className="brand-center">
            <div className="brand-eyebrow">Food Waste Intelligence</div>
            <h1 className="brand-headline">
              Less waste.
              <br />
              More <em>good</em>
              <br />
              in the world.
            </h1>
            <p className="brand-sub">
              Scan your food, detect spoilage before it happens, and automatically connect surplus to neighbours and food
              banks who need it most.
            </p>

            <div className="stats-row">
              <div className="stat-item">
                <div className="stat-num">47k</div>
                <div className="stat-lbl">Items Rescued</div>
              </div>
              <div className="stat-item">
                <div className="stat-num">2.1t</div>
                <div className="stat-lbl">CO2 Prevented</div>
              </div>
              <div className="stat-item">
                <div className="stat-num">830</div>
                <div className="stat-lbl">Families Helped</div>
              </div>
            </div>
          </div>

          <div className="brand-footer">
            <div className="badge">
              <div className="badge-dot" />
              AI-Powered Detection
            </div>
            <div className="badge">
              <div className="badge-dot" />
              Local Food Banks
            </div>
            <div className="badge">
              <div className="badge-dot" />
              Zero Waste Goal
            </div>
          </div>

          <div className="deco-circle" />
        </div>

        <div className="form-panel">
          <div className="form-card">
            <div className="form-header">
              <h2 className="form-title">
                Sign <em>in</em>
              </h2>
              <p className="form-sub">
                New to FreshLoop? <a href="#">Create a free account</a>
              </p>
            </div>

            <div className={`error-msg ${error ? "show" : ""}`.trim()}>
              <ErrorIcon />
              <span>{error || "Invalid email or password."}</span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <div className="field">
                  <label htmlFor="email">Email address</label>
                  <div className="input-wrap">
                    <span className="input-icon">
                      <MailIcon />
                    </span>
                    <input
                      autoComplete="email"
                      id="email"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      type="email"
                      value={email}
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrap">
                    <span className="input-icon">
                      <LockIcon />
                    </span>
                    <input
                      autoComplete="current-password"
                      id="password"
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={password}
                    />
                    <button
                      aria-label="Toggle password visibility"
                      className="input-suffix"
                      onClick={() => setShowPassword((current) => !current)}
                      type="button"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <label className="checkbox-wrap">
                  <input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a className="forgot-link" href="#">
                  Forgot password?
                </a>
              </div>

              <button className={`btn-submit ${loading ? "loading" : ""}`.trim()} disabled={loading} type="submit">
                <span className="btn-text">Sign In</span>
                <div className="spinner" />
              </button>
            </form>

            <div className="divider">or continue with</div>

            <div className="social-row">
              <button className="btn-social" type="button">
                <GoogleIcon />
                Google
              </button>
              <button className="btn-social" type="button">
                <GitHubIcon />
                GitHub
              </button>
            </div>

            <div className="signup-row">
              By signing in you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CameraIcon() {
  return (
    <svg fill="none" height="32" stroke="rgba(58,110,58,0.5)" strokeWidth="1.5" viewBox="0 0 24 24" width="32">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg fill="none" height="32" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="32">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg fill="none" height="15" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="15">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg fill="none" height="15" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="15">
      <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg fill="none" height="15" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="15">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg fill="none" height="15" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="15">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" x2="23" y1="1" y2="23" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg height="16" viewBox="0 0 24 24" width="16">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function Leaf({ className, variant }) {
  const commonProps = { className, "aria-hidden": "true" };

  if (variant === "one") {
    return (
      <div {...commonProps}>
        <svg fill="none" viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 155 C50 155 5 110 5 65 C5 20 50 5 50 5 C50 5 95 20 95 65 C95 110 50 155 50 155Z" fill="#3a6e3a" />
          <path d="M50 155 L50 5" stroke="#2a5e2a" strokeWidth="2" />
          <path d="M50 60 C35 50 20 45 10 40" stroke="#2a5e2a" strokeWidth="1.2" />
          <path d="M50 80 C65 70 80 65 90 58" stroke="#2a5e2a" strokeWidth="1.2" />
          <path d="M50 100 C38 92 28 88 18 82" stroke="#2a5e2a" strokeWidth="1.2" />
        </svg>
      </div>
    );
  }

  if (variant === "two") {
    return (
      <div {...commonProps}>
        <svg fill="none" viewBox="0 0 80 130" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 125 C40 125 4 90 4 52 C4 14 40 4 40 4 C40 4 76 14 76 52 C76 90 40 125 40 125Z" fill="#5a9e5a" />
          <path d="M40 125 L40 4" stroke="#3a7e3a" strokeWidth="1.5" />
          <path d="M40 48 C28 40 16 36 8 32" stroke="#3a7e3a" strokeWidth="1" />
          <path d="M40 65 C52 56 64 52 72 46" stroke="#3a7e3a" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  if (variant === "three") {
    return (
      <div {...commonProps}>
        <svg fill="none" viewBox="0 0 60 100">
          <path d="M30 96 C30 96 3 70 3 40 C3 10 30 3 30 3 C30 3 57 10 57 40 C57 70 30 96 30 96Z" fill="#7db87d" />
          <path d="M30 96 L30 3" stroke="#5a9e5a" strokeWidth="1.2" />
        </svg>
      </div>
    );
  }

  if (variant === "four") {
    return (
      <div {...commonProps}>
        <svg fill="none" viewBox="0 0 50 80">
          <path d="M25 76 C25 76 3 58 3 32 C3 8 25 3 25 3 C25 3 47 8 47 32 C47 58 25 76 25 76Z" fill="#a8d8a8" />
          <path d="M25 76 L25 3" stroke="#7db87d" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  return (
    <div {...commonProps}>
      <svg fill="none" viewBox="0 0 70 110">
        <path d="M35 106 C35 106 4 80 4 46 C4 12 35 4 35 4 C35 4 66 12 66 46 C66 80 35 106 35 106Z" fill="#3aab6e" />
        <path d="M35 106 L35 4" stroke="#2a8b5a" strokeWidth="1.2" />
        <path d="M35 42 C25 35 15 31 7 28" stroke="#2a8b5a" strokeWidth="0.9" />
        <path d="M35 60 C45 52 55 48 63 44" stroke="#2a8b5a" strokeWidth="0.9" />
      </svg>
    </div>
  );
}

export default App;
