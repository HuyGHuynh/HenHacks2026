import React, { useEffect, useRef, useState } from "react";

// Add pulse animation for reading indicator
const pulseAnimation = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.9; }
  }
`;

// Inject animation styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = pulseAnimation;
  document.head.appendChild(styleSheet);
}

const FOOD_DATA = [
  { name: "Apple", status: "fresh", freshness: 88, days: "~6 days", confidence: 97 },
  { name: "Bread Loaf", status: "warning", freshness: 38, days: "Today", confidence: 91 },
  { name: "Strawberries", status: "spoiled", freshness: 5, days: "Expired", confidence: 95 },
  { name: "Carrots", status: "fresh", freshness: 72, days: "~4 days", confidence: 89 },
  { name: "Milk", status: "warning", freshness: 42, days: "Tomorrow", confidence: 93 },
  { name: "Avocado", status: "fresh", freshness: 90, days: "~3 days", confidence: 96 },
  { name: "Lemons", status: "fresh", freshness: 95, days: "~10 days", confidence: 98 },
];

const INITIAL_NOTIFICATIONS = [
  { id: "n1", icon: "", iconClass: "notif-bank", title: "City Food Bank alerted", sub: "2 items available for pickup · 0.4 mi away", time: "2m ago" },
  { id: "n2", icon: "", iconClass: "notif-neighbor", title: "Neighbor Sarah M. notified", sub: "Claimed: Bread loaf · Expires today", time: "15m ago" },
  { id: "n3", icon: "", iconClass: "notif-bank", title: "Sunshine Shelter alerted", sub: "Produce bundle accepted · Pickup scheduled", time: "1h ago" },
  { id: "n4", icon: "", iconClass: "notif-alert", title: "Spoilage detected", sub: "Strawberries - composting recommended", time: "3h ago" },
  { id: "n5", icon: "", iconClass: "notif-neighbor", title: "3 neighbors in your network", sub: "Tap to manage sharing preferences", time: "Settings" },
];

const RECIPE_DATABASE = [
  {
    emoji: "",
    title: "Herb & Egg Frittata",
    description: "A golden, fluffy frittata loaded with pantry vegetables and herbs.",
    time: "22 min",
    servings: "3-4",
    difficulty: "Easy",
    calories: "310",
    badges: ["Vegetarian", "Gluten-Free"],
    usedIngredients: ["Eggs", "Spinach", "Onion", "Cheese"],
    extraIngredients: ["Olive oil", "Salt", "Pepper", "Fresh herbs"],
    steps: [
      "Whisk eggs with salt, pepper, and a splash of milk.",
      "Saute onion until soft, then add spinach until wilted.",
      "Pour in eggs, top with cheese, and bake until set.",
      "Rest briefly, slice, and serve warm.",
    ],
  },
  {
    emoji: "",
    title: "One-Pot Tomato Rice",
    description: "Savory tomato rice with garlic and vegetables, all cooked in one pot.",
    time: "30 min",
    servings: "4",
    difficulty: "Easy",
    calories: "380",
    badges: ["Vegan", "Gluten-Free"],
    usedIngredients: ["Tomatoes", "Rice", "Garlic", "Onion", "Carrots"],
    extraIngredients: ["Cumin", "Paprika", "Vegetable stock", "Olive oil"],
    steps: [
      "Dice vegetables and mince garlic.",
      "Cook onion and carrots until softened.",
      "Add garlic, spices, tomatoes, and rice.",
      "Pour in stock, cover, simmer, and fluff before serving.",
    ],
  },
  {
    emoji: "",
    title: "Roasted Veggie Bowl",
    description: "Roasted vegetables over grains with a bright lemon-garlic dressing.",
    time: "35 min",
    servings: "2",
    difficulty: "Easy",
    calories: "420",
    badges: ["Vegan"],
    usedIngredients: ["Carrots", "Potatoes", "Spinach", "Lemon", "Garlic"],
    extraIngredients: ["Olive oil", "Cumin", "Salt", "Pepper", "Rice"],
    steps: [
      "Roast chopped carrots and potatoes until golden.",
      "Whisk lemon, garlic, olive oil, and salt.",
      "Serve over grains with spinach and dressing.",
    ],
  },
  {
    emoji: "",
    title: "Quick Garlic Pasta",
    description: "Silky pasta with garlic, olive oil, chili, and a finishing shower of cheese.",
    time: "20 min",
    servings: "2",
    difficulty: "Easy",
    calories: "490",
    badges: ["Vegetarian"],
    usedIngredients: ["Pasta", "Garlic", "Cheese"],
    extraIngredients: ["Olive oil", "Chili flakes", "Salt", "Parsley"],
    steps: [
      "Cook pasta and reserve some pasta water.",
      "Slowly cook sliced garlic in olive oil.",
      "Toss pasta with garlic oil, chili, cheese, and pasta water.",
    ],
  },
  {
    emoji: "",
    title: "Lemon Herb Chicken",
    description: "Pan-seared chicken with lemon, garlic, herbs, and wilted greens.",
    time: "28 min",
    servings: "2",
    difficulty: "Medium",
    calories: "520",
    badges: ["Gluten-Free"],
    usedIngredients: ["Chicken", "Lemon", "Garlic", "Spinach"],
    extraIngredients: ["Olive oil", "Thyme", "Salt", "Pepper", "Butter"],
    steps: [
      "Season and marinate chicken with lemon, garlic, and herbs.",
      "Sear until cooked through and golden.",
      "Use the pan juices to wilt spinach and serve together.",
    ],
  },
  {
    emoji: "",
    title: "Potato & Egg Hash",
    description: "Crispy potatoes with caramelized onion and soft eggs in one pan.",
    time: "25 min",
    servings: "2",
    difficulty: "Easy",
    calories: "440",
    badges: ["Vegetarian", "Gluten-Free"],
    usedIngredients: ["Potatoes", "Eggs", "Onion", "Garlic"],
    extraIngredients: ["Olive oil", "Paprika", "Salt", "Fresh herbs"],
    steps: [
      "Par-cook diced potatoes.",
      "Cook onion and garlic until soft.",
      "Brown potatoes, crack eggs on top, cover, and cook until set.",
    ],
  },
];

const SOCIAL_POSTS = [
  {
    id: 1,
    type: "giving",
    author: "Tom K.",
    initials: "T",
    location: "0.2 mi away",
    time: "3 min ago",
    text: "Fresh garden broccoli and kale. Picked this morning and free to a good home.",
    items: ["Broccoli", "Kale", "Courgettes"],
    images: ["🥦", "🥬", "🥒"],
    qty: "~2 kg total",
    expiry: "Best used today",
    likes: 4,
    comments: [
      { author: "Maria L.", initials: "M", text: "I can take the broccoli after 4pm if that works.", time: "1 min ago" },
    ],
  },
  {
    id: 2,
    type: "wanting",
    author: "Amy C.",
    initials: "A",
    location: "0.5 mi away",
    time: "9 min ago",
    text: "Looking for any spare eggs or milk this week. Anything helps.",
    items: ["Eggs", "Milk", "Yoghurt"],
    images: ["🥚", "🥛", "🍶"],
    qty: "Any amount",
    expiry: null,
    likes: 11,
    comments: [
      { author: "James R.", initials: "J", text: "I have eggs and cheddar going spare. Happy to drop off.", time: "5 min ago" },
    ],
  },
  {
    id: 3,
    type: "giving",
    author: "Maria L.",
    initials: "M",
    location: "0.3 mi away",
    time: "22 min ago",
    text: "Extra sourdough loaf from this weekend. Needs to go today.",
    items: ["Sourdough Bread"],
    images: ["🍞"],
    qty: "1 whole loaf",
    expiry: "Today by 7pm",
    likes: 7,
    comments: [],
  },
  {
    id: 4,
    type: "giving",
    author: "Priya S.",
    initials: "P",
    location: "0.6 mi away",
    time: "2h ago",
    text: "Cooked a large pot of vegan dal and packed extra portions.",
    items: ["Red Lentil Dal", "Basmati Rice"],
    images: ["🍲", "🍚"],
    qty: "4 portions",
    expiry: "Use by tomorrow",
    likes: 22,
    comments: [],
  },
];

const PAGE = (() => {
  if (window.location.pathname.endsWith("/login.html") || window.location.pathname === "/login.html") {
    return "login";
  }
  if (window.location.pathname.endsWith("/dashboard.html") || window.location.pathname === "/dashboard.html") {
    return "overview";
  }
  if (window.location.pathname.endsWith("/recipe.html") || window.location.pathname === "/recipe.html") {
    return "recipe";
  }
  if (window.location.pathname.endsWith("/social.html") || window.location.pathname === "/social.html") {
    return "social";
  }
  return "detection";
})();

function App() {
  // Shared posts state for recipe help requests to create community posts
  // Load from localStorage or use default SOCIAL_POSTS
  const [posts, setPosts] = useState(() => {
    try {
      const savedPosts = localStorage.getItem('communityPosts');
      if (savedPosts) {
        const parsed = JSON.parse(savedPosts);
        console.log('Loaded posts from localStorage:', parsed.length, 'posts');
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load posts from localStorage:', error);
    }
    console.log('Using default SOCIAL_POSTS');
    return SOCIAL_POSTS.map((post) => ({
      ...post,
      liked: false,
      claimed: false,
      commentsOpen: false,
      commentDraft: "",
    }));
  });

  // Save posts to localStorage whenever they change
  useEffect(() => {
    console.log('Saving posts to localStorage:', posts.length, 'posts');
    try {
      localStorage.setItem('communityPosts', JSON.stringify(posts));
    } catch (error) {
      console.error('Failed to save posts to localStorage:', error);
    }
  }, [posts]);

  const addPost = (newPost) => {
    console.log('addPost called with:', newPost);
    setPosts((current) => {
      const updated = [newPost, ...current];
      console.log('Updated posts:', updated);
      return updated;
    });
  };

  if (PAGE === "login") {
    return <LoginPage />;
  }
  if (PAGE === "overview") {
    return <OverviewDashboardPage />;
  }
  if (PAGE === "recipe") {
    return <RecipePage addPost={addPost} />;
  }
  if (PAGE === "social") {
    return <SocialPage posts={posts} setPosts={setPosts} />;
  }
  return <DetectionPage addPost={addPost} setPosts={setPosts} />;
}

function DetectionPage({ addPost, setPosts }) {
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
  const [lastResultsCount, setLastResultsCount] = useState(0);
  const [autoTTSEnabled, setAutoTTSEnabled] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Auto-TTS function for new results
  const autoSpeakResult = async (result) => {
    if (!autoTTSEnabled || isAutoPlaying) return;
    
    setIsAutoPlaying(true);
    
    // Construct the text to be spoken
    const textToSpeak = `New detection: ${result.name}. ` +
      `Quality: ${result.quality}. ` +
      `Quantity: ${result.quantity}. ` +
      `Condition: ${result.condition}. ` +
      `Safe to eat: ${result.safe || 'Unknown'}. ` +
      `Community ready: ${result.community || 'Not specified'}.`;
    
    try {
      // Call ElevenLabs API through backend
      const response = await fetch('http://localhost:5000/api/text-to-speech', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ text: textToSpeak })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.audio_data) {
          // Convert base64 audio data to blob and play
          const audioBlob = new Blob([
            Uint8Array.from(atob(data.audio_data), c => c.charCodeAt(0))
          ], { type: data.content_type });
          
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          audio.onended = () => {
            setIsAutoPlaying(false);
            URL.revokeObjectURL(audioUrl);
          };
          
          audio.onerror = () => {
            setIsAutoPlaying(false);
            URL.revokeObjectURL(audioUrl);
          };
          
          await audio.play();
        } else {
          setIsAutoPlaying(false);
        }
      } else {
        setIsAutoPlaying(false);
      }
      
    } catch (error) {
      setIsAutoPlaying(false);
    }
  };

  // Dynamic API URL detection for deployment
  const getApiUrl = () => {
    // If we're on DigitalOcean (bytemequickly.tech), use same domain
    if (window.location.hostname === 'bytemequickly.tech') {
      return `${window.location.protocol}//${window.location.hostname}`;
    }
    // For local development, use localhost:5000
    return 'http://localhost:5000';
  };

  // Handle community sharing
  const handleCommunityShare = (result, shared) => {
    if (shared) {
      // Create a community post with the detection data
      const newPost = {
        id: Date.now(),
        type: "giving",  // User is offering this item
        author: "Sarah M.",
        initials: "S",
        location: "Your location",
        time: "Just now",
        text: `Sharing ${result.name} detected by AI camera. ${result.quality} quality, ${result.condition} condition.`,
        items: [result.name],
        images: ["🎥"],  // Camera emoji to indicate AI detection
        qty: result.quantity || "See details",
        expiry: null,
        likes: 0,
        comments: [],
        liked: false,
        claimed: false,
        commentsOpen: false,
        commentDraft: "",
        // Add detection metadata for reference
        detectionData: {
          quality: result.quality,
          quantity: result.quantity,
          condition: result.condition,
          safe: result.safe,
          confidence: result.confidence,
          timestamp: result.timestamp
        }
      };
      
      // Add the post to community feed
      addPost(newPost);
      
      addNotification(
        "",
        "notif-neighbor",
        "Posted to Community",
        `"${result.name}" shared with local food banks and neighbors`,
        "Just now"
      );
    } else {
      addNotification(
        "",
        "notif-alert",
        "Item saved to database",
        `"${result.name}" saved to your personal database`,
        "Just now"
      );
    }
  };

  // Monitor for new results and show notifications + auto-TTS
  useEffect(() => {
    if (geminiResults.length > lastResultsCount && lastResultsCount > 0) {
      const newCount = geminiResults.length - lastResultsCount;
      const latestResult = geminiResults[geminiResults.length - 1];
      
      addNotification(
        "",
        "notif-alert",
        "New detection results",
        `${newCount} new food item${newCount > 1 ? 's' : ''} detected`,
        "Just now"
      );
      
      // Auto-TTS for the latest result if enabled
      if (autoTTSEnabled && latestResult) {
        setTimeout(() => autoSpeakResult(latestResult), 500); // Small delay after notification
      }
    }
    setLastResultsCount(geminiResults.length);
  }, [geminiResults.length, lastResultsCount, autoTTSEnabled]);

  // Fetch Gemini results from API
  const fetchGeminiResults = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/gemini-results`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGeminiResults(data.results);
        } else {
          console.warn('API returned unsuccessful response:', data.error);
        }
      } else {
        console.error('Failed to fetch results:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Network error fetching Gemini results:', error);
      // Add user notification for network errors
      addNotification(
        "",
        "notif-alert",
        "Connection Error",
        "Failed to fetch latest results. Check connection.",
        "Just now"
      );
    }
  };

  // Add test detection
  const addTestDetection = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/test-detection`, {
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
    // Poll for new results every 4 seconds
    const interval = setInterval(fetchGeminiResults, 4000);
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
        ? { kind: "good-alert", icon: "", text: `3 food banks + 2 neighbors notified about your ${food.name}!` }
        : food.status === "warning"
          ? { kind: "good-alert", icon: "", text: `${food.name} expiring soon - City Food Bank alerted for urgent pickup.` }
          : { kind: "bad-alert", icon: "", text: `${food.name} is spoiled. Consider composting to reduce methane emissions.` };
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
    // If camera is live, use real image analysis
    if (cameraLive) {
      captureSnapshot();
    } else {
      // Fall back to demo data if no camera
      const randomFood = FOOD_DATA[Math.floor(Math.random() * FOOD_DATA.length)];
      startScan(randomFood, 2800);
    }
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

  const captureSnapshot = async () => {
    if (!videoRef.current || !cameraLive) {
      window.alert("Please start the camera first!");
      return;
    }

    try {
      setScanning(true);  // Set scanning state
      setStatusLabel("Analyzing image...");

      // Create canvas to capture video frame
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setStatusLabel("Failed to capture image");
          setScanning(false);
          return;
        }

        // Prepare form data
        const formData = new FormData();
        formData.append('image', blob, 'snapshot.jpg');

        try {
          // Send to backend API
          const response = await fetch(`${getApiUrl()}/api/analyze-image`, {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              // Update the gemini results with new detections
              setGeminiResults(prev => [...prev, ...data.results]);
              setStatusLabel(`Found ${data.count} food items!`);

              // Add success notification
              addNotification(
                "",
                "notif-alert",
                "Food analyzed!",
                `Detected ${data.count} food items`,
                "Just now"
              );

              // If we found items, simulate the detection result for UI
              if (data.results.length > 0) {
                const firstResult = data.results[0];
                const mockFood = {
                  name: firstResult.name,
                  status: firstResult.quality.toLowerCase().includes('fresh') ? 'fresh' :
                    firstResult.quality.toLowerCase().includes('poor') ? 'spoiled' : 'warning',
                  freshness: 85,
                  days: firstResult.condition,
                  confidence: Math.round(firstResult.confidence * 100)
                };
                setLastResult(mockFood);
              }
            } else {
              setStatusLabel(`Analysis failed: ${data.error}`);
            }
          } else {
            setStatusLabel("Failed to analyze image");
          }
        } catch (error) {
          console.error('Error analyzing snapshot:', error);
          setStatusLabel("Network error during analysis");
        } finally {
          setScanning(false);  // Always reset scanning state
        }
      }, 'image/jpeg', 0.8);

    } catch (error) {
      console.error('Error capturing snapshot:', error);
      setStatusLabel("Failed to capture snapshot");
      setScanning(false);
    }
  };

  const handleLogout = () => {
    window.location.href = "./login.html";
  };

  const handleGoToDashboard = () => {
    window.location.href = "./dashboard.html";
  };

  const handleGoToCommunity = () => {
    window.location.href = "./social.html";
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
      addNotification("", "notif-bank", "Urgent pickup scheduled", `${item.name} reserved for same-day pickup`, "Just now");
      return;
    }
    addNotification("", "notif-bank", "Food bank alerted", "Item claimed for pickup · Pending confirmation", "Just now");
  };

  const handleSecondaryAction = (item) => {
    if (item.actions.secondary) {
      return;
    }
    if (item.status === "fresh") {
      updateResultAction(item.id, "secondary", "Shared!");
      addNotification("", "notif-neighbor", "Neighbor notified", "Sarah M. has been alerted", "Just now");
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
          <button className="btn-header-link" onClick={handleGoToDashboard} type="button">
            Dashboard
          </button>
          <button className="btn-header-link" onClick={handleGoToCommunity} type="button">
            Community
          </button>
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
              <div className="badge-item">{lastResult ? lastResult.name : "Apple"}</div>
              <div className={`badge-status ${lastResult?.status || "fresh"}`}>
                {lastResult
                  ? lastResult.status === "fresh"
                    ? `Fresh - ${lastResult.days} left`
                    : lastResult.status === "warning"
                      ? `Use soon - ${lastResult.days}`
                      : `Spoiled - ${lastResult.days}`
                  : "Fresh - 6 days left"}
              </div>
            </div>
          </div>

          <div className={`alert-banner ${alertState ? `${alertState.kind} show` : ""}`.trim()}>
            <span>{alertState?.icon || ""}</span>
            <div className="alert-text">{alertState?.text || "Alerting nearby food banks and neighbors..."}</div>
          </div>

          <div className="camera-controls">
            <button className={`btn-primary ${scanning ? "scanning" : ""}`.trim()} onClick={handleStartScan} type="button">
              {scanning ? "Analyzing..." : cameraLive ? "Analyze Food" : results.length ? "Scan Again" : "Start Scan"}
            </button>
            <button className="btn-secondary" onClick={handleDemoScan} type="button">
              Demo
            </button>
            <button className="btn-secondary" onClick={handleOpenCamera} type="button">
              Camera
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
              {/* Auto-TTS Settings - Always visible at top */}
              <div className="auto-tts-settings">
                <div className="settings-header">
                  <span className="settings-label">Voice Assistant</span>
                  <button
                    className="auto-tts-btn"
                    onClick={() => setAutoTTSEnabled(!autoTTSEnabled)}
                    disabled={isAutoPlaying}
                    title={isAutoPlaying ? "Auto-speech in progress..." : autoTTSEnabled ? "Disable automatic voice reading" : "Enable automatic voice reading for new results"}
                    style={{
                      fontSize: '16px',
                      background: autoTTSEnabled ? '#28a745' : 'transparent',
                      border: '2px solid ' + (autoTTSEnabled ? '#28a745' : '#ccc'),
                      borderRadius: '8px',
                      cursor: isAutoPlaying ? 'not-allowed' : 'pointer',
                      padding: '8px 12px',
                      color: autoTTSEnabled ? 'white' : '#666',
                      transition: 'all 0.2s ease',
                      opacity: isAutoPlaying ? 0.7 : 1,
                      fontWeight: 'bold'
                    }}
                  >
                    {autoTTSEnabled ? (isAutoPlaying ? 'Auto-Reading...' : 'Auto-Read ON') : 'Auto-Read OFF'}
                  </button>
                </div>
                {autoTTSEnabled && (
                  <div className="settings-note" style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    New detection results will be automatically read aloud using AI voice
                  </div>
                )}
              </div>
              
              {/* Gemini Detection Results */}
              {geminiResults.length > 0 && (
                <div className="gemini-section">
                  <div className="section-header">
                    <h3>AI Detection Results ({geminiResults.length})</h3>
                    <div className="header-controls">
                      <button
                        className="refresh-btn"
                        onClick={fetchGeminiResults}
                        title="Refresh results"
                        style={{ fontSize: '16px', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        🔄
                      </button>
                    </div>
                  </div>
                  {geminiResults.slice().reverse().map((result, index) => (
                    <GeminiResultCard
                      key={result.id}
                      result={result}
                      onCommunityShare={handleCommunityShare}
                      autoTTSEnabled={autoTTSEnabled}
                      isAutoPlaying={isAutoPlaying}
                    />
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
                  <span>AI detection results will appear here</span>
                  <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                    Use the camera or upload images to analyze food items.
                    Results refresh automatically every 4 seconds.
                  </p>
                  {autoTTSEnabled && (
                    <p style={{ fontSize: '12px', color: '#28a745', marginTop: '8px', fontWeight: 'bold' }}>
                      🔊 Auto-voice reading is enabled - new results will be read aloud automatically!
                    </p>
                  )}
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

function GeminiResultCard({ result, onCommunityShare, autoTTSEnabled, isAutoPlaying }) {
  const safeToEat = result.safe?.toLowerCase().includes('yes');
  const communityShare = result.community?.toLowerCase().includes('yes');
  const [isShared, setIsShared] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Show visual indicator if this is the latest result and auto-TTS is playing
  const isLatestAndAutoPlaying = isAutoPlaying && result.id === result.id; // Will be true for current result

  // Text-to-speech function with improved female voice fallback
  const speakResult = async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    // Construct the text to be spoken
    const textToSpeak = `Detection result: ${result.name}. ` +
      `Quality: ${result.quality}. ` +
      `Quantity: ${result.quantity}. ` +
      `Condition: ${result.condition}. ` +
      `Safe to eat: ${result.safe || 'Unknown'}. ` +
      `Community ready: ${result.community || 'Not specified'}.`;
    
    // Function to use browser TTS with female voice
    const useBrowserTTS = () => {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.9;
      utterance.pitch = 1.2;  // Higher pitch for more feminine sound
      
      // Wait for voices to load if they haven't already
      const setVoiceAndSpeak = () => {
        const voices = speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice => {
          const name = voice.name.toLowerCase();
          return name.includes('female') || 
                 name.includes('woman') ||
                 name.includes('zira') ||
                 name.includes('hazel') ||
                 name.includes('susan') ||
                 name.includes('cortana') ||
                 name.includes('siri') ||
                 (voice.lang.includes('en') && name.includes('2')); // Often female voices are numbered #2
        });
        
        if (femaleVoice) {
          utterance.voice = femaleVoice;
          console.log('Using female voice:', femaleVoice.name);
        } else {
          console.log('No female voice found, using default with higher pitch');
        }
        
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => {
          console.error('Speech synthesis error');
          setIsPlaying(false);
        };
        
        speechSynthesis.speak(utterance);
      };
      
      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
      } else {
        setVoiceAndSpeak();
      }
    };
    
    try {
      // Try ElevenLabs API first
      const response = await fetch('http://localhost:5000/api/text-to-speech', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ text: textToSpeak })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.audio_data) {
          // Convert base64 audio data to blob and play
          const audioBlob = new Blob([
            Uint8Array.from(atob(data.audio_data), c => c.charCodeAt(0))
          ], { type: data.content_type });
          
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          audio.onended = () => {
            setIsPlaying(false);
            URL.revokeObjectURL(audioUrl);
          };
          
          audio.onerror = () => {
            setIsPlaying(false);
            URL.revokeObjectURL(audioUrl);
            console.error('Error playing ElevenLabs audio');
            // Fallback to browser TTS if audio playback fails
            useBrowserTTS();
          };
          
          await audio.play();
        } else {
          throw new Error(data.error || 'Failed to generate audio');
        }
      } else {
        // Fallback to browser TTS if ElevenLabs fails
        useBrowserTTS();
      }
      
    } catch (error) {
      // Always use browser TTS as fallback  
      useBrowserTTS();
    }
  };

  const handleCommunityShareClick = () => {
    if (isShared) return;

    if (communityShare) {
      // Show confirmation dialog for community sharing
      const confirmed = window.confirm(
        `Share "${result.name}" with the community hub?\n\n` +
        `This will make it available to local food banks and neighbors. ` +
        `The item will still be saved to your database regardless of your choice.`
      );

      if (confirmed) {
        setIsShared(true);
        onCommunityShare && onCommunityShare(result, true);
      } else {
        onCommunityShare && onCommunityShare(result, false);
      }
    }
  };

  return (
    <div className="gemini-result-card">
      <div className="result-header">
        <div className="result-title">
          <h4>{result.name}</h4>
          <div className="confidence-badge">
            {Math.round((result.confidence || 0) * 100)}% confidence
          </div>
        </div>
        <div className="result-actions">
          <button
            className="speaker-btn"
            onClick={speakResult}
            disabled={isPlaying || isAutoPlaying}
            title={isAutoPlaying ? "Auto-speech playing..." : isPlaying ? "Playing audio..." : autoTTSEnabled ? "Manual speech (Auto-speech enabled)" : "Read result aloud"}
            style={{
              background: autoTTSEnabled ? '#e8f5e8' : 'none',
              border: autoTTSEnabled ? '1px solid #28a745' : '1px solid #ddd',
              fontSize: '20px',
              cursor: (isPlaying || isAutoPlaying) ? 'not-allowed' : 'pointer',
              padding: '4px',
              borderRadius: '4px',
              marginRight: '8px',
              opacity: (isPlaying || isAutoPlaying) ? 0.6 : 1,
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            {isAutoPlaying ? '🔊' : isPlaying ? '🔊' : autoTTSEnabled ? '🔈✨' : '🔈'}
            {autoTTSEnabled && (
              <span 
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  fontSize: '8px',
                  color: '#28a745'
                }}
              >
                ⚙️
              </span>
            )}
          </button>
          <div className="timestamp">
            {new Date(result.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="result-details">
        <div className="detail-row">
          <span className="label"><strong>Quality:</strong></span>
          <span className="value quality">{result.quality}</span>
        </div>

        <div className="detail-row">
          <span className="label"><strong>Quantity:</strong></span>
          <span className="value">{result.quantity}</span>
        </div>

        <div className="detail-row">
          <span className="label"><strong>Condition:</strong></span>
          <span className="value">{result.condition}</span>
        </div>

        <div className="detail-row">
          <span className="label"><strong>Safe to Eat:</strong></span>
          <span className={`value safety ${safeToEat ? 'safe' : 'unsafe'}`}>
            {safeToEat ? '✅' : '⚠️'} {result.safe || 'Unknown'}
          </span>
        </div>

        <div className="detail-row">
          <span className="label"><strong>Community Ready:</strong></span>
          <span className={`value community ${communityShare ? 'shareable' : 'not-shareable'}`}>
            {communityShare ? '🤝' : '❌'} {result.community || 'Not specified'}
          </span>
        </div>
      </div>

      {communityShare && !isShared && (
        <div className="community-actions">
          <button
            className="community-share-btn"
            onClick={handleCommunityShareClick}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🤝 Share with Community
          </button>
        </div>
      )}

      {isShared && (
        <div className="community-shared" style={{ marginTop: '12px', color: '#28a745', fontSize: '14px' }}>
          ✅ Shared with community hub!
        </div>
      )}
    </div>
  );
}

function ResultCard({ item, onFreshPrimary, onSecondary, onSpoiledPrimary }) {
  const tagClass = item.status === "fresh" ? "tag-fresh" : item.status === "warning" ? "tag-warn" : "tag-spoiled";
  const tagText = item.status === "fresh" ? "Fresh" : item.status === "warning" ? "Expiring" : "Spoiled";
  const fillClass = item.status === "fresh" ? "fill-fresh" : item.status === "warning" ? "fill-warn" : "fill-spoiled";

  return (
    <div className="result-card">
      <div className="result-header">
        <div className="result-name">{item.name}</div>
        <div className={`freshness-tag ${tagClass}`}>{tagText}</div>
      </div>
      <div className="result-meta">
        <div className="meta-item">
          <strong>Expires</strong><span>{item.days}</span>
        </div>
        <div className="meta-item">
          <strong>Confidence</strong><span>{item.confidence}%</span>
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
      window.location.href = "./dashboard.html";
    }, 1500);
    return () => clearTimeout(timeout);
  }, [success]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    setLoading(true);

    window.setTimeout(() => {
      setLoading(false);
      setSuccess(true);
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

function OverviewDashboardPage() {
  const [counts, setCounts] = useState({
    donated: 0,
    co2: 0,
    families: 0,
    diverted: 0,
    freshness: 0,
  });

  useEffect(() => {
    const targets = { donated: 47, co2: 12, families: 8, diverted: 3, freshness: 82 };
    const timers = Object.entries(targets).map(([key, target], index) =>
      window.setTimeout(() => {
        let current = 0;
        const step = Math.ceil(target / 40);
        const timer = window.setInterval(() => {
          current = Math.min(current + step, target);
          setCounts((state) => ({ ...state, [key]: current }));
          if (current >= target) {
            window.clearInterval(timer);
          }
        }, key === "freshness" ? 20 : 35);
      }, index === 4 ? 800 : 0),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
  const donated = [18, 24, 31, 28, 38, 47];
  const wasted = [12, 9, 7, 6, 5, 3];
  const maxVal = Math.max(...donated, ...wasted);
  const circumference = 314;
  const ringOffset = circumference - (counts.freshness / 100) * circumference;

  return (
    <>
      <nav className="dash-nav">
        <a className="logo" href="./dashboard.html">
          Fresh<em>Loop</em>
        </a>
        <div className="dash-nav-right">
          <a className="dash-nav-link" href="./index.html">Detect</a>
          <a className="dash-nav-link" href="./recipe.html">Recipes</a>
          <a className="dash-nav-link" href="./social.html">Community</a>
          <a className="btn-logout" href="./login.html">
            Logout
          </a>
          <div className="dash-nav-avatar" title="Sarah M.">
            S
          </div>
        </div>
      </nav>

      <div className="dash-wrap">
        <section className="dash-hero">
          <div>
            <div className="dash-hero-greeting">Good morning, Sarah 🌿</div>
            <h1 className="dash-hero-title">
              Your <em>impact</em> this
              <br />
              month is growing.
            </h1>
            <p className="dash-hero-sub">
              You&apos;ve helped divert food from landfill, fed neighbours, and contributed to a healthier community.
              Here&apos;s your full picture.
            </p>
          </div>
          <div className="dash-hero-date">
            <strong>{today}</strong>
            <span>Week 9 of 52</span>
            <span>Spring harvest season</span>
          </div>
        </section>

        <section className="dash-cta-grid">
          <a className="dash-cta-card detect" href="./index.html">
            <div className="dash-cta-icon">🔬</div>
            <div className="dash-cta-label">AI Detection</div>
            <div className="dash-cta-title">
              Scan Food
              <br />
              for Spoilage
            </div>
            <div className="dash-cta-desc">
              Point your camera at any food item. Our model detects freshness in seconds and alerts local food banks
              if it&apos;s still good.
            </div>
            <div className="dash-cta-arrow">→</div>
          </a>

          <a className="dash-cta-card recipes" href="./recipe.html">
            <div className="dash-cta-icon">👨‍🍳</div>
            <div className="dash-cta-label">Smart Kitchen</div>
            <div className="dash-cta-title">
              Recipe
              <br />
              Recommender
            </div>
            <div className="dash-cta-desc">
              Tell us what&apos;s in your fridge or pantry. We&apos;ll suggest recipes to use ingredients before they
              expire.
            </div>
            <div className="dash-cta-arrow">→</div>
          </a>

          <a className="dash-cta-card recipes" href="./social.html">
            <div className="dash-cta-icon">🌍</div>
            <div className="dash-cta-label">Neighbourhood</div>
            <div className="dash-cta-title">
              Community
              <br />
              Board
            </div>
            <div className="dash-cta-desc">
              Post extra food, claim nearby offers, and coordinate handoffs with neighbors and local partners.
            </div>
            <div className="dash-cta-arrow">→</div>
          </a>
        </section>

        <section className="dash-stats-grid">
          <StatSummaryCard color="green" label="Items Donated" value={counts.donated} delta="+12 from last month" />
          <StatSummaryCard color="sage" label="CO2 Prevented" value={counts.co2} unit="kg" delta="Equiv. to 48 km driven" />
          <StatSummaryCard color="forest" label="Families Helped" value={counts.families} delta="3 new connections" />
          <StatSummaryCard color="amber" label="Waste Diverted" value={counts.diverted} unit="kg" delta="Down 18% - great work!" down />
        </section>

        <section className="dash-section-grid">
          <div className="dash-panel">
            <div className="dash-panel-header">
              <div className="dash-panel-title">Donations vs. Waste</div>
              <button className="dash-panel-action" type="button">
                Last 6 months
              </button>
            </div>

            <div className="dash-chart-wrap">
              <div className="dash-chart-bars">
                {months.map((month, index) => (
                  <div className="dash-chart-col" key={month}>
                    <div className="dash-chart-stack">
                      <div
                        className="dash-chart-bar donated"
                        style={{ height: `${(donated[index] / maxVal) * 130}px` }}
                        title={`Donated: ${donated[index]} items`}
                      />
                      <div
                        className="dash-chart-bar wasted"
                        style={{ height: `${(wasted[index] / maxVal) * 130}px` }}
                        title={`Wasted: ${wasted[index]} items`}
                      />
                    </div>
                    <div className="dash-chart-month">{month}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dash-chart-legend">
              <div className="dash-legend-item">
                <div className="dash-legend-dot donated" />
                Donated
              </div>
              <div className="dash-legend-item">
                <div className="dash-legend-dot wasted" />
                Wasted
              </div>
            </div>
          </div>

          <div className="dash-panel">
            <div className="dash-panel-header">
              <div className="dash-panel-title">Recent Donations</div>
              <button className="dash-panel-action" type="button">
                View all
              </button>
            </div>
            {[
              ["🥦", "Broccoli + Spinach", "→ City Food Bank", "1.2 kg", "2h ago"],
              ["🍞", "Bread Loaf", "→ Neighbour Sarah K.", "0.5 kg", "Yesterday"],
              ["🍎", "Apples × 6", "→ Sunshine Shelter", "0.9 kg", "2 days ago"],
              ["🥕", "Carrots + Potatoes", "→ City Food Bank", "2.1 kg", "4 days ago"],
              ["🍋", "Lemons × 4", "→ Neighbour Tom K.", "0.3 kg", "1 week ago"],
            ].map(([emoji, name, to, qty, time], index) => (
              <div className="dash-donation-item" key={`${name}-${index}`}>
                <div className="dash-donation-emoji">{emoji}</div>
                <div className="dash-donation-info">
                  <div className="dash-donation-name">{name}</div>
                  <div className="dash-donation-to">{to}</div>
                </div>
                <div className="dash-donation-meta">
                  <div className="dash-donation-qty">{qty}</div>
                  <div className="dash-donation-time">{time}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="dash-bottom-grid">
          <div className="dash-panel">
            <div className="dash-panel-header">
              <div className="dash-panel-title">Freshness Score</div>
            </div>
            <div className="dash-ring-wrap">
              <svg className="dash-ring-svg" height="130" viewBox="0 0 130 130" width="130">
                <defs>
                  <linearGradient id="dashRingGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#3aab6e" />
                    <stop offset="100%" stopColor="#2e8c5a" />
                  </linearGradient>
                </defs>
                <circle className="dash-ring-track" cx="65" cy="65" r="50" />
                <circle
                  className="dash-ring-fill"
                  cx="65"
                  cy="65"
                  r="50"
                  style={{ strokeDashoffset: ringOffset }}
                />
              </svg>
              <div className="dash-ring-label">
                <span className="dash-ring-num">{counts.freshness}</span>
                <span className="dash-ring-sub">/ 100</span>
              </div>
            </div>
            <div className="dash-center-copy">
              Your household food freshness
              <br />
              is <strong>excellent</strong> this week. Keep it up!
            </div>
          </div>

          <div className="dash-panel">
            <div className="dash-panel-header">
              <div className="dash-panel-title">Your Network</div>
              <button className="dash-panel-action" type="button">
                Manage
              </button>
            </div>
            {[
              ["C", "City Food Bank", "0.4 mi · Open now", "24 items", "linear-gradient(135deg,#3a6e3a,#5a9e5a)"],
              ["S", "Sunshine Shelter", "1.2 mi · All produce", "11 items", "linear-gradient(135deg,#5a7e3a,#7aae5a)"],
              ["S", "Sarah K.", "Neighbour · 3 doors down", "8 items", "linear-gradient(135deg,#7aaa5a,#aaca7a)"],
              ["T", "Tom K.", "Neighbour · Next block", "4 items", "linear-gradient(135deg,#2e8c5a,#3aab6e)"],
            ].map(([avatar, name, role, items, background]) => (
              <div className="dash-community-row" key={name}>
                <div className="dash-community-avatar" style={{ background }}>
                  {avatar}
                </div>
                <div className="dash-community-info">
                  <div className="dash-community-name">{name}</div>
                  <div className="dash-community-role">{role}</div>
                </div>
                <div className="dash-community-items">{items}</div>
              </div>
            ))}
          </div>

          <div className="dash-panel">
            <div className="dash-panel-header">
              <div className="dash-panel-title">Fresh Tips</div>
            </div>
            {[
              ["❄️", "Store berries unwashed", "moisture accelerates mould. Rinse only just before eating."],
              ["🧅", "Keep onions away from potatoes", "they release gases that cause each other to spoil faster."],
              ["🌿", "Herb bouquet trick", "stand fresh herbs in a glass of water like flowers; they'll last 2x longer."],
              ["📅", "FIFO method", "place newer groceries behind older ones so you reach for what expires first."],
            ].map(([icon, title, text]) => (
              <div className="dash-tip-item" key={title}>
                <div className="dash-tip-icon">{icon}</div>
                <div className="dash-tip-text">
                  <strong>{title}</strong> - {text}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function StatSummaryCard({ color, label, value, unit, delta, down = false }) {
  return (
    <div className={`dash-summary-card ${color}`}>
      <div className="dash-summary-label">{label}</div>
      <div className="dash-summary-value">
        {value}
        {unit ? <span className="dash-summary-unit">{unit}</span> : null}
      </div>
      <div className={`dash-summary-delta ${down ? "down" : ""}`.trim()}>
        <span>{down ? "↓" : "↑"}</span>
        {delta}
      </div>
    </div>
  );
}

function RecipePage({ addPost }) {
  console.log('RecipePage rendered, addPost:', !!addPost);
  
  const [tags, setTags] = useState(["chicken", "broccoli", "rice", "garlic", "olive oil"]);
  const [inputValue, setInputValue] = useState("");
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [saved, setSaved] = useState([]);
  const [autoReadEnabled, setAutoReadEnabled] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpIngredient, setHelpIngredient] = useState(null);
  const [helpMessage, setHelpMessage] = useState('');
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);

  const quickAdd = ["Eggs", "Chicken", "Tomatoes", "Garlic", "Onion", "Pasta", "Rice", "Spinach", "Carrots", "Cheese", "Potatoes", "Lemon"];
  const filterOptions = ["Vegetarian", "Vegan", "Gluten-Free", "Quick"];

  const normalizeTag = (value) => {
    const trimmed = value.trim().replace(/,$/, "");
    if (!trimmed) {
      return "";
    }
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  const addTag = (value) => {
    const next = normalizeTag(value);
    if (!next || tags.includes(next)) {
      return;
    }
    setTags((current) => [...current, next]);
    setInputValue("");
  };

  const toggleFilter = (value) => {
    setFilters((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const generateRecipes = async () => {
    if (!tags.length) {
      return;
    }
    setLoading(true);
    
    try {
      // Call Gemini-powered recipe suggestion API
      console.log('Calling AI recipe API with ingredients:', tags);
      const response = await fetch('http://localhost:5000/api/suggest-recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ingredients: tags
        })
      });

      console.log('API Response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);
        
        if (data.success && data.suggested_dishes) {
          console.log('Using AI-generated recipes:', data.suggested_dishes.length, 'recipes');
          
          // Parse the raw response to extract details for each dish
          const rawLines = data.raw_response.split('\n').filter(line => line.trim());
          
          // Transform API response to match our UI structure
          const apiRecipes = data.suggested_dishes.map((dishName, index) => {
            // Try to find the corresponding description in raw_response
            const dishLine = rawLines.find(line => line.includes(dishName));
            const description = dishLine ? 
              dishLine.split(':').slice(1).join(':').trim() : 
              'AI-generated recipe suggestion based on your ingredients';
            
            return {
              id: `api-${index}`,
              emoji: "",
              title: dishName,
              description: description,
              time: "25-30 min", // Default for AI recipes
              servings: "2-4",
              difficulty: "Medium",
              calories: "350",
              badges: ["AI-Generated", "Fresh Ingredients"],
              usedIngredients: tags, // The ingredients we searched with
              extraIngredients: [], // Will be filled when getting detailed recipe
              steps: ['Click "View Recipe" for detailed AI-generated cooking instructions'],
              score: 10, // API recipes get high priority
              matchedCount: tags.length,
              isAIGenerated: true
            };
          });

          // Apply filters to API results
          const filteredRecipes = apiRecipes.filter(recipe => {
            if (!filters.length) return true;
            return filters.every((filter) => {
              if (filter === "Quick") {
                return parseInt(recipe.time, 10) < 30;
              }
              return recipe.badges.some((badge) => 
                badge.toLowerCase().includes(filter.toLowerCase())
              );
            });
          });

          setResults(filteredRecipes.slice(0, 3));
        } else {
          console.warn('API response missing success or suggested_dishes:', data);
          // Fallback to local recipes if API fails
          generateLocalRecipes();
        }
      } else {
        console.error('API call failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        // Fallback to local recipes if API call fails
        console.warn('Falling back to local recipes');
        generateLocalRecipes();
      }
    } catch (error) {
      console.error('Network error calling recipe API:', error);
      // Fallback to local recipes
      console.warn('Falling back to local recipes due to network error');
      generateLocalRecipes();
    }
    
    setLoading(false);
  };

  // Fallback function using local recipes
  const generateLocalRecipes = () => {
    const scored = RECIPE_DATABASE.map((recipe) => {
      const matches = recipe.usedIngredients.filter((ingredient) =>
        tags.some(
          (tag) =>
            tag.toLowerCase().includes(ingredient.toLowerCase()) ||
            ingredient.toLowerCase().includes(tag.toLowerCase()),
        ),
      );
      const filterOk =
        !filters.length ||
        filters.every((filter) =>
          filter === "Quick"
            ? parseInt(recipe.time, 10) < 30
            : recipe.badges.some((badge) => badge.toLowerCase().includes(filter.toLowerCase())),
        );
      return { ...recipe, score: matches.length + (filterOk ? 0 : -5), matchedCount: matches.length };
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    setResults(scored);
  };

  const handleInputKeyDown = (event) => {
    if ((event.key === "Enter" || event.key === ",") && inputValue.trim()) {
      event.preventDefault();
      addTag(inputValue);
    }
    if (event.key === "Backspace" && !inputValue && tags.length) {
      setTags((current) => current.slice(0, -1));
    }
  };

  const toggleSaved = (title) => {
    setSaved((current) => (current.includes(title) ? current.filter((item) => item !== title) : [...current, title]));
  };

  // Text-to-Speech using ElevenLabs API
  const speakText = async (text) => {
    if (!text || isReading) return;
    
    setIsReading(true);
    try {
      const response = await fetch('http://localhost:5000/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        // Parse the JSON response which contains base64-encoded audio
        const data = await response.json();
        
        if (data.success && data.audio_data) {
          // Decode base64 audio data to binary
          const binaryString = atob(data.audio_data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // Create blob with explicit MIME type for MP3
          const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            setIsReading(false);
          };
          
          audio.onerror = (e) => {
            console.error('Audio playback error:', e);
            console.error('Audio source:', audioUrl);
            URL.revokeObjectURL(audioUrl);
            setIsReading(false);
          };
          
          // Play with error handling
          try {
            await audio.play();
          } catch (playError) {
            console.error('Play error:', playError);
            setIsReading(false);
          }
        } else {
          console.error('Invalid TTS response:', data);
          setIsReading(false);
        }
      } else {
        const errorText = await response.text();
        console.error('TTS API failed:', response.status, errorText);
        setIsReading(false);
      }
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      setIsReading(false);
    }
  };

  // Click-to-read helper for important text
  const makeReadable = (text, label = '') => {
    return {
      onClick: (e) => {
        e.stopPropagation(); // Prevent event bubbling
        const readText = label ? `${label}: ${text}` : text;
        speakText(readText);
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.backgroundColor = '#f0f8ff';
        e.currentTarget.style.transition = 'background-color 0.2s';
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.backgroundColor = '';
      },
      style: { 
        cursor: 'pointer',
        position: 'relative'
      },
      title: `🔊 Click to read aloud: "${label || 'text'}"`
    };
  };

  // Auto-read recipe when results are generated
  useEffect(() => {
    if (autoReadEnabled && results.length > 0) {
      // Just read the recipe names when results are generated
      const recipeNames = results.map((recipe, index) => 
        `Recipe ${index + 1}: ${recipe.title.replace(/\*\*/g, '')}`
      ).join('. ');
      
      speakText(`I found ${results.length} recipe${results.length > 1 ? 's' : ''} for you. ${recipeNames}. Click on any recipe to hear more details.`);
    }
  }, [results, autoReadEnabled]);

  // Function to read all recipe names
  const readAllRecipeNames = () => {
    if (results.length === 0) return;
    
    const recipeNames = results.map((recipe, index) => {
      const cleanTitle = recipe.title.replace(/\*\*/g, '');
      return `Recipe ${index + 1}: ${cleanTitle}. Cook time: ${recipe.time}. Difficulty: ${recipe.difficulty}.`;
    }).join(' ');
    
    speakText(`Here are your ${results.length} recipe options. ${recipeNames}`);
  };

  // Function to read cooking instructions only
  const readCookingInstructions = (recipe) => {
    if (!recipe || !recipe.steps) return;
    
    const instructions = recipe.steps.map((step, idx) => {
      const cleanStep = step.replace(/<[^>]*>/g, '').replace(/\*\*/g, '');
      return `Step ${idx + 1}: ${cleanStep}`;
    }).join('. ');
    
    speakText(`Cooking instructions for ${recipe.title.replace(/\*\*/g, '')}. ${instructions}`);
  };

  // Open help modal for ingredient
  const openHelpModal = (ingredient) => {
    setHelpIngredient(ingredient);
    setHelpMessage('');
    setShowHelpModal(true);
  };

  // Generate AI help message
  const generateHelpMessage = async () => {
    if (!helpIngredient) return;
    
    setIsGeneratingMessage(true);
    try {
      const ingredientName = `${helpIngredient.quantity} ${helpIngredient.unit} ${helpIngredient.name}`.trim();
      
      // Call Gemini-powered community help API
      const response = await fetch('http://localhost:5000/api/generate-help-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipe_name: selectedRecipe?.title?.replace(/\*\*/g, '') || 'my recipe',
          need_ingredient: ingredientName,
          have_ingredients: tags
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.message) {
          setHelpMessage(data.message);
        } else {
          // Fallback message
          const message = `Hi! I'm making ${selectedRecipe?.title?.replace(/\*\*/g, '') || 'a recipe'} and I need ${ingredientName}. I already have ${tags.join(', ')}. Could anyone help me out? Thanks!`;
          setHelpMessage(message);
        }
      } else {
        // Fallback message
        const message = `Hi! I need ${ingredientName} for my recipe. Can anyone help?`;
        setHelpMessage(message);
      }
    } catch (error) {
      console.error('Error generating help message:', error);
      const ingredientName = `${helpIngredient.quantity} ${helpIngredient.unit} ${helpIngredient.name}`.trim();
      const message = `Hi! I need ${ingredientName} for my recipe. Can anyone help?`;
      setHelpMessage(message);
    }
    setIsGeneratingMessage(false);
  };

  // Send help request (placeholder - could integrate with messaging/social features)
  const sendHelpRequest = async () => {
    if (!helpMessage.trim()) return;
    
    try {
      const ingredientName = `${helpIngredient.quantity} ${helpIngredient.unit} ${helpIngredient.name}`.trim();
      
      // Post to community help API
      const response = await fetch('http://localhost:5000/api/post-help-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipe_name: selectedRecipe?.title?.replace(/\*\*/g, '') || 'my recipe',
          need_ingredient: ingredientName,
          have_ingredients: tags,
          message: helpMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Create a new community post
        const newPost = {
          id: Date.now(),
          type: "wanting",
          author: "You",
          initials: "Y",
          location: "Your location",
          time: "Just now",
          text: helpMessage,
          items: [ingredientName],
          images: ["🔍"],
          qty: helpIngredient.quantity || "Any amount",
          expiry: null,
          likes: 0,
          comments: [],
          liked: false,
          claimed: false,
          commentsOpen: false,
          commentDraft: "",
        };
        
        console.log('Created new post:', newPost);
        console.log('addPost function exists:', !!addPost);
        
        // Add post to community feed
        if (addPost) {
          addPost(newPost);
          console.log('Post added to community feed');
        } else {
          console.error('addPost function is not available');
        }
        
        // Copy to clipboard and show success
        navigator.clipboard.writeText(helpMessage).then(() => {
          alert('✅ Help request posted to community feed! Message copied to clipboard.');
          setShowHelpModal(false);
        }).catch(err => {
          console.error('Failed to copy message:', err);
          alert('✅ Help request posted to community feed!\n\n' + helpMessage);
          setShowHelpModal(false);
        });
      } else {
        // Still copy to clipboard even if API fails
        navigator.clipboard.writeText(helpMessage).then(() => {
          alert('Message copied to clipboard! Share it with your community.');
          setShowHelpModal(false);
        }).catch(err => {
          alert('Message ready: ' + helpMessage);
          setShowHelpModal(false);
        });
      }
    } catch (error) {
      console.error('Error sending help request:', error);
      // Fallback: just copy to clipboard
      navigator.clipboard.writeText(helpMessage).then(() => {
        alert('Message copied to clipboard! Share it with your friends or community.');
        setShowHelpModal(false);
      }).catch(err => {
        alert('Message ready: ' + helpMessage);
        setShowHelpModal(false);
      });
    }
  };

  // Auto-read recipe details when modal opens
  useEffect(() => {
    if (autoReadEnabled && selectedRecipe) {
      const ingredientsList = getFormattedIngredients(selectedRecipe)
        .map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`)
        .join(', ');
      
      const recipeDetails = `${selectedRecipe.title}. Cook time: ${selectedRecipe.time}. Servings: ${selectedRecipe.servings}. Ingredients: ${ingredientsList}. Now reading cooking steps.`;
      
      speakText(recipeDetails);
    }
  }, [selectedRecipe, autoReadEnabled]);

  // Get detected ingredients from localStorage or API
  const getDetectedIngredients = () => {
    try {
      // Try to get from localStorage first (from detection page)
      const storedResults = localStorage.getItem('geminiResults');
      if (storedResults) {
        const results = JSON.parse(storedResults);
        return results.map(result => result.name).filter(name => name);
      }
      return [];
    } catch (error) {
      console.error('Error getting detected ingredients:', error);
      return [];
    }
  };

  // Load detected ingredients into tags
  const loadDetectedIngredients = () => {
    const detectedIngredients = getDetectedIngredients();
    const normalizedIngredients = detectedIngredients
      .map(name => normalizeTag(name))
      .filter(name => name && !tags.includes(name));
    
    if (normalizedIngredients.length > 0) {
      setTags(prev => [...prev, ...normalizedIngredients]);
    }
  };

  // Format recipe instructions with better highlighting
  const formatRecipeStep = (step) => {
    if (!step) return '';
    
    // Important cooking action words to highlight
    const actionWords = [
      'Season', 'Sear', 'Cook', 'Add', 'Heat', 'Sauté', 'Simmer', 'Boil', 'Fry', 'Bake', 'Roast', 'Grill',
      'Chop', 'Dice', 'Slice', 'Mince', 'Mix', 'Stir', 'Whisk', 'Blend', 'Combine', 'Toss', 'Fold',
      'Pour', 'Drain', 'Remove', 'Set aside', 'Serve', 'Garnish', 'Rest', 'Cool', 'Chill', 'Freeze',
      'Preheat', 'Reduce', 'Increase', 'Lower', 'Raise', 'Cover', 'Uncover', 'Scrape'
    ];
    
    // Convert markdown bold (**text**) to HTML
    let formatted = step.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Make the first action word bold if it's at the beginning
    const firstWord = formatted.split(/[\s:]/)[0];
    if (actionWords.some(action => action.toLowerCase() === firstWord.toLowerCase())) {
      formatted = formatted.replace(firstWord, `<strong>${firstWord}</strong>`);
    }
    
    // Highlight temperature and time references
    formatted = formatted.replace(/(\d+)°([CF])/g, '<span style="background: #fff3cd; padding: 1px 3px; border-radius: 3px; font-weight: bold;">$1°$2</span>');
    formatted = formatted.replace(/(\d+-?\d*)\s?(minutes?|mins?|hours?|hrs?)/gi, '<span style="background: #d4edda; padding: 1px 3px; border-radius: 3px; font-weight: bold;">$1 $2</span>');
    
    // Highlight measurements
    formatted = formatted.replace(/(\d+\/?\d*)\s?(cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|lbs?|pounds?)/gi, '<span style="background: #cce5ff; padding: 1px 3px; border-radius: 3px; font-weight: bold;">$1 $2</span>');
    
    return formatted;
  };

  // Parse ingredient string into structured components
  const parseIngredient = (ingredientText, isAvailable = false) => {
    if (!ingredientText) return null;
    
    // Remove markdown and clean up
    let cleaned = ingredientText.replace(/\*\*(.*?)\*\*/g, '$1').trim();
    
    // Check if this ingredient matches user's tags
    const matchesUserTags = isIngredientInUserTags(cleaned, tags);
    
    // Extract quantity pattern (numbers, fractions, ranges)
    const quantityMatch = cleaned.match(/^([\d\/.\-–]+(?:\s*to\s*[\d\/.\-–]+)?)(\s*)/);
    let quantity = '';
    let remainder = cleaned;
    
    if (quantityMatch) {
      quantity = quantityMatch[1];
      remainder = cleaned.substring(quantityMatch[0].length);
    }
    
    // Extract unit (cups, tbsp, lbs, etc.)
    const unitMatch = remainder.match(/^([a-zA-Z]+(?:\s+[a-zA-Z]+)?)(\s*)/);
    let unit = '';
    
    if (unitMatch) {
      unit = unitMatch[1];
      remainder = remainder.substring(unitMatch[0].length);
    }
    
    // Extract ingredient name (everything before parentheses or preparation notes)
    const nameMatch = remainder.match(/^([^(,]+)/);
    let name = nameMatch ? nameMatch[1].trim() : remainder;
    
    // Extract preparation notes (in parentheses or after commas)
    const prepMatch = remainder.match(/\(([^)]+)\)|,\s*(.+)$/);
    let preparation = prepMatch ? (prepMatch[1] || prepMatch[2]) : '';
    
    return {
      quantity: quantity.trim(),
      unit: unit.trim(),
      name: name.trim(),
      preparation: preparation.trim(),
      original: ingredientText,
      matchesUserTags: matchesUserTags,
      isAvailable: matchesUserTags
    };
  };

  // Format dish title by converting markdown to HTML bold
  const formatDishTitle = (title) => {
    if (!title) return '';
    // Convert **text** to <strong>text</strong>
    return title.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  // Get all ingredients with better parsing
  const getFormattedIngredients = (recipe) => {
    if (!recipe) return [];
    
    const allIngredients = [...(recipe.usedIngredients || []), ...(recipe.extraIngredients || [])];
    const uniqueIngredients = [...new Set(allIngredients)];
    
    return uniqueIngredients.map((ingredient, index) => {
      const parsed = parseIngredient(ingredient);
      
      // Check if ingredient is in user's input tags
      const isFromUserInput = isIngredientInUserTags(ingredient, tags);
      
      return {
        ...parsed,
        isFromUserInput: isFromUserInput,
        id: `ingredient-${index}`
      };
    }).filter(ing => ing.name); // Only include ingredients with actual names
  };

  // Fetch detailed recipe when user clicks "View Recipe"
  // Validate if an ingredient matches user's input tags
  const isIngredientInUserTags = (ingredient, userTags) => {
    const cleanIngredient = ingredient.toLowerCase()
      .replace(/\*\*/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
    
    return userTags.some(tag => {
      const cleanTag = tag.toLowerCase().trim();
      // Check if tag is contained in ingredient or vice versa
      return cleanIngredient.includes(cleanTag) || cleanTag.includes(cleanIngredient);
    });
  };

  const fetchRecipeDetails = async (recipe) => {
    console.log('fetchRecipeDetails called with recipe:', recipe);
    
    // Check if we need to fetch detailed recipe
    const needsDetails = recipe.isAIGenerated && (
      !recipe.hasDetailedRecipe || 
      !recipe.detailedSteps || 
      recipe.detailedSteps.length === 0 ||
      recipe.steps.length === 1 // Only has placeholder text
    );
    
    console.log('Needs details fetch:', needsDetails);
    
    if (needsDetails) {
      try {
        console.log('Fetching detailed recipe for:', recipe.title);
        const response = await fetch('http://localhost:5000/api/get-recipe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            dish_name: recipe.title,
            ingredients: tags
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Detailed recipe response:', data);
          
          if (data.success && data.recipe) {
            // Parse the markdown-formatted recipe
            const recipeText = data.recipe;
            
            // Extract ingredients section with better parsing
            const ingredientsMatch = recipeText.match(/### INGREDIENTS NEEDED:(.*?)(?=###|---|\n\n[A-Z])/s);
            let ingredients = [];
            let availableIngredients = [];
            let additionalIngredients = [];
            
            if (ingredientsMatch) {
              const parsedIngredients = ingredientsMatch[1]
                .split('\n')
                .filter(line => line.trim().startsWith('*'))
                .map(line => {
                  // Clean up the line: remove *, markdown, and extra spaces
                  let cleaned = line.replace(/^\s*\*\s*/, '').trim();
                  // Remove markdown bold formatting but keep the content
                  cleaned = cleaned.replace(/\*\*(.*?)\*\*:\s*/, '$1: ');
                  return cleaned;
                })
                .filter(ing => ing && ing.length > 0);
              
              // Categorize ingredients based on user's input tags
              parsedIngredients.forEach(ingredient => {
                if (isIngredientInUserTags(ingredient, tags)) {
                  availableIngredients.push(ingredient);
                } else {
                  additionalIngredients.push(ingredient);
                }
              });
              
              ingredients = parsedIngredients;
              console.log('Ingredient validation:', {
                total: ingredients.length,
                available: availableIngredients.length,
                additional: additionalIngredients.length
              });
            }
            
            // Extract cooking steps
            const stepsMatch = recipeText.match(/### COOKING STEPS:(.*?)(?=###|\n\n[A-Z]|$)/s);
            let steps = [];
            if (stepsMatch) {
              steps = stepsMatch[1]
                .split(/\d+\.\s*/)
                .filter(step => step.trim())
                .map(step => step.replace(/^\*\*(.*?)\*\*:/, '$1:').trim())
                .filter(step => step);
            }
            
            // Update recipe with detailed information
            const updatedRecipe = {
              ...recipe,
              steps: steps.length > 0 ? steps : recipe.steps,
              detailedSteps: steps,
              extraIngredients: ingredients,
              availableIngredients: availableIngredients,
              additionalIngredients: additionalIngredients,
              hasDetailedRecipe: true,
              ingredientMatchPercentage: ingredients.length > 0 ? 
                Math.round((availableIngredients.length / ingredients.length) * 100) : 100
            };
            
            console.log('Updated recipe with details:', updatedRecipe);
            setSelectedRecipe(updatedRecipe);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching detailed recipe:', error);
      }
    }
    // Fallback to original recipe data
    setSelectedRecipe(recipe);
  };

  const detectedIngredients = getDetectedIngredients();

  return (
    <>
      <nav className="rec-nav">
        <a className="logo" href="./dashboard.html">
          Fresh<em>Loop</em>
        </a>
        
        {/* Reading Status Indicator */}
        {isReading && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            background: 'linear-gradient(45deg, #4CAF50, #45a049)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999,
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            <span style={{ fontSize: '20px' }}>🔊</span>
            <span style={{ fontWeight: 'bold' }}>Reading aloud...</span>
          </div>
        )}
        
        <div className="rec-nav-right">
          <a className="rec-nav-link" href="./dashboard.html">Dashboard</a>
          <a className="rec-nav-link" href="./index.html">Detect</a>
          <a className="rec-nav-link active" href="./recipe.html">Recipes</a>
          <a className="rec-nav-link" href="./social.html">Community</a>
          
          {/* Settings Gear Button */}
          <button
            className="rec-settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px 12px',
              color: '#333',
              position: 'relative'
            }}
            title="Voice Assistant Settings"
          >
            ⚙️
          </button>
          
          {/* Settings Dropdown */}
          {showSettings && (
            <div
              style={{
                position: 'absolute',
                top: '60px',
                right: '220px',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: '280px'
              }}
            >
              <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '14px' }}>
                Voice Assistant Settings
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  <input
                    type="checkbox"
                    checked={autoReadEnabled}
                    onChange={(e) => setAutoReadEnabled(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  Auto-read recipes aloud
                </label>
              </div>
              
              {isReading && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px',
                  background: '#e8f5e8',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#155724'
                }}>
                  🔊 Currently reading...
                </div>
              )}
              
              <div style={{
                marginTop: '12px',
                fontSize: '11px',
                color: '#6c757d',
                borderTop: '1px solid #eee',
                paddingTop: '8px'
              }}>
                <strong>Auto-read:</strong> Recipes will be read aloud automatically when generated or opened.<br/>
                <strong>Click-to-read:</strong> Click on any recipe title, ingredient, or instruction to hear it read aloud.
              </div>
            </div>
          )}
          
          <a className="btn-logout" href="./login.html">Logout</a>
          <div className="dash-nav-avatar">S</div>
        </div>
      </nav>

      <div className="rec-page">
        <section className="rec-header">
          <div className="rec-eyebrow">Smart Kitchen · Zero Waste</div>
          <h1 className="rec-title">
            What can you <em>cook</em>
            <br />
            with what you have?
          </h1>
          <p className="rec-sub">
            Add the ingredients in your fridge or pantry. We&apos;ll generate three recipes so nothing goes to waste.
          </p>
        </section>

        <section className="rec-input-zone">
          {/* Detected Ingredients Section */}
          {detectedIngredients.length > 0 && (
            <div className="detected-ingredients-section" style={{
              background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
              border: '1px solid #28a745',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px'
            }}>
              <div className="detected-ingredients-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{
                  fontWeight: 'bold',
                  color: '#155724',
                  fontSize: '14px'
                }}>
                  Detected Ingredients ({detectedIngredients.length})
                </span>
                <button
                  onClick={loadDetectedIngredients}
                  style={{
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                  title="Add all detected ingredients to recipe search"
                >
                  Add All
                </button>
              </div>
              <div className="detected-ingredients-list" style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px'
              }}>
                {detectedIngredients.map((ingredient, index) => (
                  <button
                    key={index}
                    onClick={() => addTag(ingredient)}
                    disabled={tags.includes(normalizeTag(ingredient))}
                    style={{
                      background: tags.includes(normalizeTag(ingredient)) ? '#6c757d' : '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      cursor: tags.includes(normalizeTag(ingredient)) ? 'not-allowed' : 'pointer',
                      opacity: tags.includes(normalizeTag(ingredient)) ? 0.6 : 1
                    }}
                    title={tags.includes(normalizeTag(ingredient)) ? "Already added" : `Add ${ingredient} to recipe search`}
                  >
                    {tags.includes(normalizeTag(ingredient)) ? 'Added' : 'Add'} {ingredient}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rec-zone-label">Your Ingredients</div>
          <div className="rec-tag-field">
            {tags.map((tag) => (
              <span className="rec-tag" key={tag}>
                {tag}
                <button className="rec-tag-remove" onClick={() => setTags((current) => current.filter((item) => item !== tag))} type="button">
                  ×
                </button>
              </span>
            ))}
            <input
              className="rec-tag-input"
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Type an ingredient and press Enter..."
              value={inputValue}
            />
          </div>

          <div className="rec-quick-add">
            <span className="rec-quick-label">Quick add:</span>
            {quickAdd.map((item) => (
              <button className="rec-quick-chip" key={item} onClick={() => addTag(item)} type="button">
                {item}
              </button>
            ))}
          </div>

          <div className="rec-filters">
            <span className="rec-filters-label">Dietary:</span>
            {filterOptions.map((filter) => (
              <button
                className={`rec-filter-toggle ${filters.includes(filter) ? "active" : ""}`.trim()}
                key={filter}
                onClick={() => toggleFilter(filter)}
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>

          <button className={`rec-generate ${loading ? "loading" : ""}`.trim()} disabled={loading} onClick={generateRecipes} type="button">
            <span className="rec-btn-icon"></span>
            <span className="rec-btn-text">Generate Recipes</span>
            <span className="spinner" />
          </button>
        </section>

        {!results.length ? (
          <section className="rec-empty-state">
            <span className="rec-empty-illustration">🥘</span>
            <div className="rec-empty-title">Your recipes will appear here</div>
            <p className="rec-empty-sub">Add at least one ingredient and generate suggestions.</p>
          </section>
        ) : (
          <section className="rec-results">
            <div className="rec-results-header">
              <div className="rec-results-title">
                Three <em>recipes</em> for you
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className="rec-results-count">Based on {tags.length} ingredient{tags.length > 1 ? "s" : ""}</div>
                {/* Read All Recipe Names Button */}
                <button
                  onClick={readAllRecipeNames}
                  disabled={isReading}
                  style={{
                    background: isReading ? '#6c757d' : 'linear-gradient(45deg, #2196F3, #1976D2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    cursor: isReading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Read all recipe names aloud"
                >
                  🔊 Read Recipe Names
                </button>
              </div>
            </div>

            <div className="rec-grid">
              {results.map((recipe, index) => (
                <div className="rec-card" key={recipe.title}>
                  <div className={`rec-card-band band-${index + 1}`} />
                  <div className="rec-card-body">
                    <span className="rec-card-emoji">{recipe.emoji}</span>
                    <div className="rec-card-badges">
                      {recipe.badges.map((badge, badgeIndex) => (
                        <span className={`rec-card-badge ${badgeIndex === 0 ? "highlight" : ""}`.trim()} key={badge}>
                          {badge}
                        </span>
                      ))}
                      <span className="rec-card-badge">Uses {recipe.matchedCount} of your items</span>
                      {recipe.isAIGenerated && (
                        <span className="rec-card-badge ai-badge" style={{
                          background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '11px'
                        }}>
                          AI Generated
                        </span>
                      )}
                    </div>
                    {/* Ingredient Match Indicator */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      marginBottom: '8px',
                      background: '#f8f9fa',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      <span style={{ color: '#28a745' }}>✓ {recipe.matchedCount} ingredient{recipe.matchedCount !== 1 ? 's' : ''} you have</span>
                      <span style={{ color: '#6c757d' }}>•</span>
                      <span style={{ color: '#6c757d', fontSize: '11px' }}>View recipe for full list</span>
                    </div>
                    <div 
                      className="rec-card-title" 
                      dangerouslySetInnerHTML={{ __html: formatDishTitle(recipe.title) }}
                      {...makeReadable(recipe.title.replace(/\*\*/g, ''), 'Recipe')}
                    />
                    <div 
                      className="rec-card-desc"
                      {...makeReadable(recipe.description, 'Description')}
                    >
                      {recipe.description}
                    </div>
                    <div className="rec-card-ingredients">
                      {recipe.usedIngredients.map((ingredient) => {
                        const matched = tags.some(
                          (tag) =>
                            tag.toLowerCase().includes(ingredient.toLowerCase()) ||
                            ingredient.toLowerCase().includes(tag.toLowerCase()),
                        );
                        return (
                          <span className={`rec-ing-pill ${matched ? "used" : "extra"}`.trim()} key={ingredient}>
                            {ingredient}
                          </span>
                        );
                      })}
                    </div>
                    <div className="rec-card-stats">
                      <div><strong>{recipe.time}</strong><span>Cook time</span></div>
                      <div><strong>{recipe.servings}</strong><span>Servings</span></div>
                      <div><strong>{recipe.calories}</strong><span>Calories</span></div>
                    </div>
                    <div className="rec-card-actions">
                      <button className="rec-primary-btn" onClick={() => fetchRecipeDetails(recipe)} type="button">
                        View Recipe
                      </button>
                      <button className={`rec-secondary-btn ${saved.includes(recipe.title) ? "saved" : ""}`.trim()} onClick={() => toggleSaved(recipe.title)} type="button">
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div
        aria-hidden={!selectedRecipe}
        className={`rec-modal-backdrop ${selectedRecipe ? "open" : ""}`.trim()}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setSelectedRecipe(null);
          }
        }}
      >
        {selectedRecipe ? (
          <div className="rec-modal">
            <div className="rec-modal-inner">
              <div className="rec-modal-header">
                <div>
                  <span className="rec-modal-emoji">{selectedRecipe.emoji}</span>
                  <div 
                    className="rec-modal-title" 
                    dangerouslySetInnerHTML={{ __html: formatDishTitle(selectedRecipe.title) }}
                    {...makeReadable(selectedRecipe.title.replace(/\*\*/g, ''), 'Recipe title')}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* Read Recipe Names Button */}
                  <button
                    onClick={() => {
                      const recipeTitle = selectedRecipe.title.replace(/\*\*/g, '');
                      speakText(`Recipe: ${recipeTitle}`);
                    }}
                    disabled={isReading}
                    style={{
                      background: isReading ? '#6c757d' : 'linear-gradient(45deg, #2196F3, #1976D2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      cursor: isReading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Read recipe name aloud"
                  >
                    🔊 Name
                  </button>
                  
                  {/* Read Cooking Instructions Button */}
                  <button
                    onClick={() => readCookingInstructions(selectedRecipe)}
                    disabled={isReading}
                    style={{
                      background: isReading ? '#6c757d' : 'linear-gradient(45deg, #FF9800, #F57C00)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      cursor: isReading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Read cooking instructions aloud"
                  >
                    🔊 Instructions
                  </button>
                  
                  {/* Read Full Recipe Button */}
                  <button
                    onClick={() => {
                      const fullRecipe = `
                        ${selectedRecipe.title.replace(/\*\*/g, '')}. 
                        Cook time: ${selectedRecipe.time}. 
                        Servings: ${selectedRecipe.servings}. 
                        Difficulty: ${selectedRecipe.difficulty}.
                        Ingredients needed: ${getFormattedIngredients(selectedRecipe).map(ing => 
                          `${ing.quantity} ${ing.unit} ${ing.name}${ing.preparation ? ', ' + ing.preparation : ''}`
                        ).join(', ')}.
                        Cooking instructions: ${selectedRecipe.steps.map((step, idx) => 
                          `Step ${idx + 1}: ${step.replace(/<[^>]*>/g, '').replace(/\*\*/g, '')}`
                        ).join('. ')}.
                      `.replace(/\s+/g, ' ').trim();
                      speakText(fullRecipe);
                    }}
                    disabled={isReading}
                    style={{
                      background: isReading ? '#6c757d' : 'linear-gradient(45deg, #4CAF50, #45a049)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      cursor: isReading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Read entire recipe aloud"
                  >
                    🔊 Full Recipe
                  </button>
                  <button className="rec-modal-close" onClick={() => setSelectedRecipe(null)} type="button">
                    Close
                  </button>
                </div>
              </div>
              <div className="rec-modal-stats">
                <div><strong>{selectedRecipe.time}</strong><span>Cook time</span></div>
                <div><strong>{selectedRecipe.servings}</strong><span>Servings</span></div>
                <div><strong>{selectedRecipe.calories} cal</strong><span>Per serving</span></div>
                <div><strong>{selectedRecipe.difficulty}</strong><span>Difficulty</span></div>
              </div>
              <div className="rec-modal-section">Ingredients</div>
              {(() => {
                const ingredients = getFormattedIngredients(selectedRecipe);
                console.log('Formatted ingredients for display:', ingredients);
                console.log('Selected recipe data:', {
                  usedIngredients: selectedRecipe.usedIngredients,
                  extraIngredients: selectedRecipe.extraIngredients,
                  steps: selectedRecipe.steps?.length
                });
                
                const userHas = ingredients.filter(ing => ing.isFromUserInput).length;
                const total = ingredients.length;
                const matchPercentage = total > 0 ? Math.round((userHas / total) * 100) : 0;
                
                return (
                  <div style={{
                    padding: '10px 15px',
                    marginBottom: '10px',
                    background: matchPercentage === 100 ? '#d4edda' : matchPercentage >= 50 ? '#fff8e1' : '#f8d7da',
                    border: `2px solid ${matchPercentage === 100 ? '#28a745' : matchPercentage >= 50 ? '#ff9800' : '#dc3545'}`,
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                      You have <span style={{ color: '#28a745', fontSize: '16px' }}>{userHas}</span> of <span style={{ fontSize: '16px' }}>{total}</span> ingredients
                    </div>
                    <div style={{
                      padding: '5px 12px',
                      borderRadius: '15px',
                      background: matchPercentage === 100 ? '#28a745' : matchPercentage >= 50 ? '#ff9800' : '#dc3545',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '13px'
                    }}>
                      {matchPercentage}% Match
                    </div>
                  </div>
                );
              })()}
              <div className="rec-modal-ingredients">
                {getFormattedIngredients(selectedRecipe).map((ingredient) => (
                  <div 
                    className={`rec-ingredient-item ${ingredient.isFromUserInput ? 'user-provided' : 'additional'}`}
                    key={ingredient.id}
                    {...makeReadable(`${ingredient.quantity} ${ingredient.unit} ${ingredient.name}${ingredient.preparation ? ', ' + ingredient.preparation : ''}`, 'Ingredient')}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '8px 12px',
                      margin: '4px 0',
                      backgroundColor: ingredient.isFromUserInput ? '#d4edda' : '#fff8e1',
                      border: `2px solid ${ingredient.isFromUserInput ? '#28a745' : '#ff9800'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ flex: '0 0 80px', fontWeight: 'bold', color: '#6c757d' }}>
                      {ingredient.quantity} {ingredient.unit}
                    </div>
                    <div style={{ flex: '1' }}>
                      <div style={{ fontWeight: '600', color: '#212529' }}>
                        {ingredient.name}
                      </div>
                      {ingredient.preparation && (
                        <div style={{ fontSize: '12px', color: '#6c757d', fontStyle: 'italic' }}>
                          {ingredient.preparation}
                        </div>
                      )}
                    </div>
                    <div style={{ 
                      flex: '0 0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <div style={{ 
                        fontSize: '10px', 
                        padding: '3px 8px', 
                        borderRadius: '12px',
                        backgroundColor: ingredient.isFromUserInput ? '#28a745' : '#ff9800',
                        color: 'white',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {ingredient.isFromUserInput ? '✓ You Have' : '+ Need'}
                      </div>
                      {!ingredient.isFromUserInput && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openHelpModal(ingredient);
                          }}
                          style={{
                            background: 'linear-gradient(45deg, #dc3545, #c82333)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'linear-gradient(45deg, #c82333, #bd2130)';
                            e.target.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'linear-gradient(45deg, #dc3545, #c82333)';
                            e.target.style.transform = 'scale(1)';
                          }}
                          title="Request help for this ingredient"
                        >
                          🆘 Send Help
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="rec-modal-section">Instructions</div>
              <div className="rec-modal-steps">
                {(() => {
                  console.log('Rendering steps, count:', selectedRecipe.steps?.length);
                  console.log('Steps data:', selectedRecipe.steps);
                  return selectedRecipe.steps.map((step, index) => (
                    <div className="rec-step" key={`${selectedRecipe.title}-${index}`}>
                      <div className="rec-step-num">{index + 1}</div>
                      <div 
                        className="rec-step-text" 
                        dangerouslySetInnerHTML={{ __html: formatRecipeStep(step) }}
                        {...makeReadable(step.replace(/<[^>]*>/g, '').replace(/\*\*/g, ''), `Step ${index + 1}`)}
                      />
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Help Request Modal */}
      {showHelpModal && helpIngredient && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => setShowHelpModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              animation: 'slideIn 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '15px'
            }}>
              <h3 style={{ margin: 0, color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
                🆘 Request Help
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f0f0f0';
                  e.target.style.color = '#333';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'none';
                  e.target.style.color = '#666';
                }}
              >
                ×
              </button>
            </div>

            {/* Ingredient Info */}
            <div style={{
              background: '#fff8e1',
              border: '2px solid #ff9800',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}>
                You need:
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                {helpIngredient.quantity} {helpIngredient.unit} {helpIngredient.name}
                {helpIngredient.preparation && (
                  <span style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                    {' '}({helpIngredient.preparation})
                  </span>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333',
                fontSize: '14px'
              }}>
                Your Message:
              </label>
              <textarea
                value={helpMessage}
                onChange={(e) => setHelpMessage(e.target.value)}
                placeholder="Type your help request message here..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e0e0e0',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={generateHelpMessage}
                disabled={isGeneratingMessage}
                style={{
                  flex: '1',
                  minWidth: '150px',
                  background: isGeneratingMessage 
                    ? '#6c757d' 
                    : 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: isGeneratingMessage ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isGeneratingMessage) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {isGeneratingMessage ? (
                  <>
                    <span className="spinner" style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Generating...
                  </>
                ) : (
                  <>
                    ✨ AI Generate Message
                  </>
                )}
              </button>

              <button
                onClick={sendHelpRequest}
                disabled={!helpMessage.trim()}
                style={{
                  flex: '1',
                  minWidth: '150px',
                  background: !helpMessage.trim()
                    ? '#6c757d'
                    : 'linear-gradient(45deg, #4CAF50, #45a049)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: !helpMessage.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (helpMessage.trim()) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                📤 Send Help Request
              </button>
            </div>

            {/* Helper Text */}
            <div style={{
              marginTop: '15px',
              fontSize: '12px',
              color: '#666',
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              Your message will be copied to clipboard to share with friends or community
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SocialPage({ posts, setPosts }) {
  console.log('SocialPage rendered with posts:', posts?.length, 'posts');
  
  const [postType, setPostType] = useState("giving");
  const [feedFilter, setFeedFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [compose, setCompose] = useState({ text: "", items: "", qty: "", expiry: "" });
  const [toast, setToast] = useState("");
  const [matches, setMatches] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [showMatches, setShowMatches] = useState(false);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timer = window.setTimeout(() => setToast(""), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!filterOpen) return undefined;
    
    const handleClickOutside = (event) => {
      if (!event.target.closest('.soc-filter-dropdown')) {
        setFilterOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [filterOpen]);

  const visiblePosts = posts.filter((post) => {
    if (feedFilter === "all") return true;
    if (feedFilter === "expiring") return Boolean(post.expiry);
    if (feedFilter === "nearby") return post.location.includes("0.");
    return post.type === feedFilter;
  });

  const updatePost = (id, updater) => {
    setPosts((current) => current.map((post) => (post.id === id ? updater(post) : post)));
  };

  const submitPost = () => {
    if (!compose.text.trim()) {
      return;
    }
    const nextItems = compose.items
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const newPost = {
      id: Date.now(),
      type: postType,
      author: "Sarah M.",
      initials: "S",
      location: "Your location",
      time: "Just now",
      text: compose.text.trim(),
      items: nextItems.length ? nextItems : ["Food"],
      images: ["🥬", "🥕", "🍞"].slice(0, Math.max(1, Math.min(3, nextItems.length || 1))),
      qty: compose.qty.trim() || "Amount TBD",
      expiry: compose.expiry.trim() || null,
      likes: 0,
      comments: [],
      liked: false,
      claimed: false,
      commentsOpen: false,
      commentDraft: "",
    };
    setPosts((current) => [newPost, ...current]);
    setCompose({ text: "", items: "", qty: "", expiry: "" });
    setFeedFilter("all");
    setToast(postType === "giving" ? "Posted! Nearby neighbors can see it now." : "Request posted to the community board.");
  };

  const findMatches = async () => {
    setMatchLoading(true);
    try {
      // Transform frontend posts to backend format
      const transformedPosts = posts.map(post => ({
        _id: String(post.id),
        user_id: post.author,
        type: post.type === 'giving' ? 'offer' : 'request',
        ingredients: post.items.map(item => ({
          name: item.toLowerCase(),
          normalized_name: item.toLowerCase(),
          quantity: null,
          unit: null
        })),
        location: {
          lat: 0,
          lng: 0,
          description: post.location || 'Unknown'
        },
        original_text: post.text,
        status: 'active',
        created_at: new Date().toISOString()
      }));

      // Send posts to backend for matching
      const response = await fetch('http://localhost:5000/api/match-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: transformedPosts })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMatches(data);
        setShowMatches(true);
        setToast(`Found ${data.stats.total_matches} ingredient matches!`);
      } else {
        setToast('Failed to find matches. Try again.');
      }
    } catch (error) {
      console.error('Error finding matches:', error);
      setToast('Error connecting to matching service.');
    } finally {
      setMatchLoading(false);
    }
  };

  return (
    <>
      <nav className="soc-nav">
        <a className="logo" href="./dashboard.html">
          Fresh<em>Loop</em>
        </a>
        <div className="soc-nav-right">
          <a className="soc-nav-link" href="./dashboard.html">Dashboard</a>
          <a className="soc-nav-link" href="./index.html">Detect</a>
          <a className="soc-nav-link" href="./recipe.html">Recipes</a>
          <a className="soc-nav-link active" href="./social.html">Community</a>
          <a className="btn-logout" href="./login.html">Logout</a>
          <div className="dash-nav-avatar" title="Sarah M.">S</div>
        </div>
      </nav>

      <div className="soc-layout">
        <aside className="soc-sidebar-left">
          <div className="soc-profile-card">
            <div className="soc-profile-avatar">S</div>
            <div className="soc-profile-name">Sarah M.</div>
            <div className="soc-profile-loc">Wilmington, DE · 0.3 mi radius</div>
            <div className="soc-profile-stats">
              <div><strong>47</strong><span>Given</span></div>
              <div><strong>12</strong><span>Received</span></div>
              <div><strong>4.9</strong><span>Rating</span></div>
            </div>
          </div>

          <div className="soc-sidebar-section">
            <div className="soc-sidebar-title">Active Neighbors</div>
            {[
              ["T", "Tom K.", "0.2 mi away"],
              ["M", "Maria L.", "0.3 mi away"],
              ["J", "James R.", "0.4 mi away"],
              ["A", "Amy C.", "0.5 mi away"],
            ].map(([initial, name, dist], index) => (
              <div className="soc-nearby-row" key={name}>
                <div className={`soc-nearby-avatar avatar-${index + 1}`}>{initial}</div>
                <div className="soc-nearby-info">
                  <div className="soc-nearby-name">{name}</div>
                  <div className="soc-nearby-dist">{dist}</div>
                </div>
                <div className={`soc-nearby-dot ${index === 2 ? "amber" : "green"}`} />
              </div>
            ))}
          </div>
        </aside>

        <main className="soc-feed">
          <div className="soc-compose-box">
            <div className="soc-compose-tabs">
              <button className={`soc-compose-tab ${postType === "giving" ? "active giving" : ""}`.trim()} onClick={() => setPostType("giving")} type="button">
                I&apos;m Giving Away
              </button>
              <button className={`soc-compose-tab ${postType === "wanting" ? "active wanting" : ""}`.trim()} onClick={() => setPostType("wanting")} type="button">
                I&apos;m Looking For
              </button>
            </div>
            <textarea
              className="soc-compose-textarea"
              onChange={(event) => setCompose((current) => ({ ...current, text: event.target.value }))}
              placeholder={
                postType === "giving"
                  ? "I have extra spinach and carrots from the garden."
                  : "Looking for spare eggs or bread this week."
              }
              value={compose.text}
            />
            <div className="soc-compose-meta">
              <input
                className="soc-compose-input"
                onChange={(event) => setCompose((current) => ({ ...current, items: event.target.value }))}
                placeholder="Items (comma-separated)"
                value={compose.items}
              />
              <input
                className="soc-compose-input short"
                onChange={(event) => setCompose((current) => ({ ...current, qty: event.target.value }))}
                placeholder="Quantity"
                value={compose.qty}
              />
              <input
                className="soc-compose-input short"
                onChange={(event) => setCompose((current) => ({ ...current, expiry: event.target.value }))}
                placeholder="Best by"
                value={compose.expiry}
              />
            </div>
            <div className="soc-compose-footer">
              <div className="soc-compose-hints">
                <span>📍</span>
                <span>📷</span>
                <span>⏰</span>
              </div>
              <button className={`soc-post-btn ${postType === "wanting" ? "wanting" : ""}`.trim()} onClick={submitPost} type="button">
                Post
              </button>
            </div>
          </div>

          <div className="soc-filter-dropdown">
            <button 
              className="soc-filter-btn" 
              onClick={() => setFilterOpen(!filterOpen)}
              type="button"
            >
              <span>Filter: {feedFilter === "all" ? "All Posts" : feedFilter === "giving" ? "Giving" : feedFilter === "wanting" ? "Looking For" : feedFilter === "expiring" ? "Expiring Soon" : "Nearby"}</span>
              <span className="soc-filter-arrow">{filterOpen ? "▲" : "▼"}</span>
            </button>
            {filterOpen && (
              <div className="soc-filter-menu">
                <button 
                  className={`soc-filter-option ${feedFilter === "all" ? "active" : ""}`}
                  onClick={() => { setFeedFilter("all"); setFilterOpen(false); }}
                  type="button"
                >
                  All Posts
                </button>
                <button 
                  className={`soc-filter-option ${feedFilter === "giving" ? "active" : ""}`}
                  onClick={() => { setFeedFilter("giving"); setFilterOpen(false); }}
                  type="button"
                >
                  Giving
                </button>
                <button 
                  className={`soc-filter-option ${feedFilter === "wanting" ? "active" : ""}`}
                  onClick={() => { setFeedFilter("wanting"); setFilterOpen(false); }}
                  type="button"
                >
                  Looking For
                </button>
                <button 
                  className={`soc-filter-option ${feedFilter === "expiring" ? "active" : ""}`}
                  onClick={() => { setFeedFilter("expiring"); setFilterOpen(false); }}
                  type="button"
                >
                  Expiring Soon
                </button>
                <button 
                  className={`soc-filter-option ${feedFilter === "nearby" ? "active" : ""}`}
                  onClick={() => { setFeedFilter("nearby"); setFilterOpen(false); }}
                  type="button"
                >
                  Nearby
                </button>
              </div>
            )}
          </div>

          {visiblePosts.map((post) => (
            <div className={`soc-post-card ${post.type}`.trim()} key={post.id}>
              <div className="soc-post-header">
                <div className="soc-post-avatar">{post.initials}</div>
                <div className="soc-post-author-info">
                  <div className="soc-post-author-row">
                    <div className="soc-post-author">{post.author}</div>
                    <span className={`soc-post-badge ${post.type}`.trim()}>
                      {post.type === "giving" ? "Giving Away" : "Looking For"}
                    </span>
                  </div>
                  <div className="soc-post-meta">{post.location}</div>
                </div>
                <div className="soc-post-time">{post.time}</div>
              </div>
              <div className="soc-post-body">{post.text}</div>
              <div className="soc-food-items">
                {post.items.map((item) => (
                  <span className={`soc-food-pill ${post.type}`.trim()} key={`${post.id}-${item}`}>{item}</span>
                ))}
              </div>
              <div className="soc-post-images">
                {post.images.map((item, index) => (
                  <div className="soc-post-img" key={`${post.id}-${index}`}>{item}</div>
                ))}
              </div>
              <div className="soc-post-info-row">
                <div>{post.qty}</div>
                {post.expiry ? <div>{post.expiry}</div> : null}
              </div>
              <div className="soc-post-actions">
                <button
                  className={`soc-action-btn ${post.claimed ? "done" : ""}`.trim()}
                  onClick={() => {
                    if (post.claimed) return;
                    updatePost(post.id, (current) => ({ ...current, claimed: true }));
                    setToast(post.type === "giving" ? `Claimed ${post.author}'s post.` : `You offered help to ${post.author}.`);
                  }}
                  type="button"
                >
                  {post.type === "giving" ? (post.claimed ? "Claimed" : "I'll Take It") : (post.claimed ? "Offered" : "I Can Help")}
                </button>
                <button
                  className={`soc-action-btn ${post.liked ? "liked" : ""}`.trim()}
                  onClick={() =>
                    updatePost(post.id, (current) => ({
                      ...current,
                      liked: !current.liked,
                      likes: current.likes + (current.liked ? -1 : 1),
                    }))
                  }
                  type="button"
                >
                  ♥ {post.likes}
                </button>
                <button
                  className="soc-action-btn"
                  onClick={() => updatePost(post.id, (current) => ({ ...current, commentsOpen: !current.commentsOpen }))}
                  type="button"
                >
                  💬 {post.comments.length}
                </button>
                <button className="soc-action-btn" onClick={() => setToast("Link copied to clipboard.")} type="button">
                  Share
                </button>
              </div>

              {post.commentsOpen ? (
                <div className="soc-comments">
                  {post.comments.map((comment, index) => (
                    <div className="soc-comment-item" key={`${post.id}-${index}`}>
                      <div className="soc-comment-avatar">{comment.initials}</div>
                      <div className="soc-comment-bubble">
                        <div className="soc-comment-author">{comment.author}</div>
                        <div className="soc-comment-text">{comment.text}</div>
                        <div className="soc-comment-time">{comment.time}</div>
                      </div>
                    </div>
                  ))}
                  <div className="soc-comment-input-row">
                    <input
                      className="soc-comment-input"
                      onChange={(event) => updatePost(post.id, (current) => ({ ...current, commentDraft: event.target.value }))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && post.commentDraft.trim()) {
                          updatePost(post.id, (current) => ({
                            ...current,
                            commentDraft: "",
                            comments: [
                              ...current.comments,
                              { author: "Sarah M.", initials: "S", text: current.commentDraft.trim(), time: "Just now" },
                            ],
                          }));
                        }
                      }}
                      placeholder="Add a comment..."
                      value={post.commentDraft}
                    />
                    <button
                      className="soc-comment-send"
                      onClick={() => {
                        if (!post.commentDraft.trim()) return;
                        updatePost(post.id, (current) => ({
                          ...current,
                          commentDraft: "",
                          comments: [
                            ...current.comments,
                            { author: "Sarah M.", initials: "S", text: current.commentDraft.trim(), time: "Just now" },
                          ],
                        }));
                      }}
                      type="button"
                    >
                      →
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </main>

        <aside className="soc-sidebar-right">
          <div className="soc-widget">
            <div className="soc-widget-title">Community Impact</div>
            {[
              ["Items shared", "78%"],
              ["CO2 saved", "55%"],
              ["Families fed", "65%"],
              ["Posts today", "42%"],
            ].map(([label, width]) => (
              <div className="soc-impact-row" key={label}>
                <span>{label}</span>
                <div className="soc-impact-bar-wrap">
                  <div className="soc-impact-bar" style={{ width }} />
                </div>
              </div>
            ))}
          </div>

          <div className="soc-widget">
            <div className="soc-widget-title">🤖 AI Ingredient Matching</div>
            <div style={{ padding: '12px 0' }}>
              <button
                className="soc-post-btn"
                onClick={findMatches}
                disabled={matchLoading}
                type="button"
                style={{ 
                  width: '100%', 
                  padding: '12px',
                  fontSize: '14px',
                  opacity: matchLoading ? 0.6 : 1,
                  cursor: matchLoading ? 'wait' : 'pointer'
                }}
              >
                {matchLoading ? '🔄 Finding Matches...' : '🔍 Find Ingredient Matches'}
              </button>
              
              {matches && matches.stats && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '12px', 
                  background: '#f0f9f0', 
                  borderRadius: '8px',
                  fontSize: '13px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#2a5e2a' }}>
                    Match Results
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>✓ Requests: {matches.stats.total_requests}</div>
                    <div>✓ Offers: {matches.stats.total_offers}</div>
                    <div style={{ fontWeight: 'bold', color: '#3a6e3a' }}>
                      🎯 Total Matches: {matches.stats.total_matches}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMatches(!showMatches)}
                    type="button"
                    style={{
                      marginTop: '10px',
                      padding: '8px',
                      width: '100%',
                      background: '#3a6e3a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {showMatches ? 'Hide Details' : 'View Details'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="soc-widget">
            <div className="soc-widget-title">Quick Links</div>
            <div className="soc-link-list">
              <a href="./dashboard.html">Dashboard</a>
              <a href="./index.html">Detection</a>
              <a href="./recipe.html">Recipes</a>
              <a href="./login.html">Logout</a>
            </div>
          </div>
        </aside>
      </div>

      {showMatches && matches && matches.matches && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowMatches(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #3a6e3a',
              paddingBottom: '12px'
            }}>
              <h2 style={{ margin: 0, color: '#2a5e2a' }}>🤖 AI Ingredient Matches</h2>
              <button
                onClick={() => setShowMatches(false)}
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px', padding: '12px', background: '#f0f9f0', borderRadius: '8px' }}>
              <strong>Summary:</strong> Found {matches.stats.total_matches} matches from {matches.stats.total_requests} requests and {matches.stats.total_offers} offers
            </div>

            {Object.entries(matches.matches).map(([requestId, matchList]) => {
              if (!matchList || matchList.length === 0) return null;
              
              const firstMatch = matchList[0];
              return (
                <div 
                  key={requestId}
                  style={{
                    marginBottom: '24px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '16px',
                    background: '#fafafa'
                  }}
                >
                  <div style={{ 
                    marginBottom: '12px', 
                    paddingBottom: '12px', 
                    borderBottom: '1px solid #ddd'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#e85d3d', marginBottom: '4px' }}>
                      🔍 Request from: {firstMatch.request.user_id}
                    </div>
                    <div style={{ color: '#666', fontSize: '14px' }}>
                      Looking for: {firstMatch.request.ingredients}
                    </div>
                  </div>

                  <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#2a5e2a' }}>
                    Matches Found ({matchList.length}):
                  </div>

                  {matchList.map((match, idx) => (
                    <div 
                      key={idx}
                      style={{
                        background: 'white',
                        padding: '12px',
                        marginBottom: '12px',
                        borderRadius: '6px',
                        border: '1px solid #e0e0e0'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', color: '#3a6e3a' }}>
                          👤 {match.offer.user_id}
                        </div>
                        <div style={{
                          background: match.match_score >= 90 ? '#4caf50' : match.match_score >= 75 ? '#ff9800' : '#ffc107',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {match.match_score}% Match
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '6px' }}>
                        <strong>Offering:</strong> {match.offer.ingredients}
                      </div>
                      
                      {match.offer.location && match.offer.location.description && (
                        <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>
                          📍 {match.offer.location.description}
                        </div>
                      )}
                      
                      <div style={{ fontSize: '13px', color: '#555', marginTop: '8px', padding: '8px', background: '#f9f9f9', borderRadius: '4px' }}>
                        <strong>Matched Items:</strong> {match.matched_ingredients.join(', ')}
                      </div>
                      
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '8px', fontStyle: 'italic' }}>
                        💡 {match.reason}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={`soc-toast ${toast ? "show" : ""}`.trim()}>{toast}</div>
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
