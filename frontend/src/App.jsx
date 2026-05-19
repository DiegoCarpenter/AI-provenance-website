import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWalletClient } from "wagmi";
import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import CONTRACT_ABI from "./ProvenanceRegistry.json";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);

const C = {
  bg: "#080B10",
  surface: "#0E1318",
  border: "#1C2333",
  gold: "#F0C040",
  goldDim: "#A07A1A",
  text: "#EDE8DC",
  muted: "#6B7280",
  mono: "'IBM Plex Mono', monospace",
  display: "'Syne', sans-serif",
};

const FAKE_HASH =
  "0xa3f5c2d1e4b7890123456789abcdef01fedcba9876543210deadbeef12345678";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const ABI = CONTRACT_ABI.abi;

const FEED_ITEMS = [
  { addr: "0x5b99...cc08", label: "ANALYSIS", time: "just now" },
  { addr: "0xbc97...e55e", label: "ANALYSIS", time: "4s ago" },
  { addr: "0xa2e1...4c01", label: "REPORT", time: "12s ago" },
  { addr: "0x3568...c5dd", label: "ANALYSIS", time: "31s ago" },
  { addr: "0x46b6...3bbb", label: "CODE", time: "1m ago" },
  { addr: "0xda95...0167", label: "ESSAY", time: "2m ago" },
  { addr: "0x75b0...79a0", label: "IMAGE PROMPT", time: "4m ago" },
  { addr: "0x5ce8...a780", label: "IMAGE PROMPT", time: "14m ago" },
];

function HashTicker() {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);
  const dir = useRef(1);

  useEffect(() => {
    const tick = setInterval(() => {
      if (dir.current === 1) {
        idx.current = Math.min(idx.current + 1, FAKE_HASH.length);
        setDisplayed(FAKE_HASH.slice(0, idx.current));
        if (idx.current === FAKE_HASH.length)
          setTimeout(() => {
            dir.current = -1;
          }, 2000);
      } else {
        idx.current = Math.max(idx.current - 1, 0);
        setDisplayed(FAKE_HASH.slice(0, idx.current));
        if (idx.current === 0)
          setTimeout(() => {
            dir.current = 1;
          }, 500);
      }
    }, 38);
    return () => clearInterval(tick);
  }, []);

  return (
    <div
      style={{
        fontFamily: C.mono,
        fontSize: "0.82rem",
        color: C.goldDim,
        background: "rgba(240,192,64,0.06)",
        border: "1px solid rgba(240,192,64,0.15)",
        borderRadius: "8px",
        padding: "0.6rem 1rem",
        display: "inline-block",
        minWidth: "520px",
        maxWidth: "90vw",
        wordBreak: "break-all",
        marginBottom: "1.75rem",
      }}
    >
      <span style={{ color: C.muted, marginRight: "0.5rem" }}>SHA-256 →</span>
      <span style={{ color: C.gold }}>{displayed}</span>
      <span style={{ animation: "blink 1s step-end infinite", color: C.gold }}>
        |
      </span>
    </div>
  );
}

function Seal() {
  return (
    <div
      style={{
        position: "relative",
        width: 96,
        height: 96,
        margin: "0 auto 1.5rem",
      }}
    >
      <svg
        width="96"
        height="96"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          animation: "spin 8s linear infinite",
        }}
      >
        <circle
          cx="48"
          cy="48"
          r="44"
          fill="none"
          stroke={C.gold}
          strokeWidth="1.5"
          strokeDasharray="8 6"
          opacity="0.6"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 60,
          height: 60,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(240,192,64,0.15) 0%, transparent 70%)",
          border: "1px solid rgba(240,192,64,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.75rem",
        }}
      >
        🔏
      </div>
    </div>
  );
}

function Nav() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2.5rem",
        height: "60px",
        background: "rgba(8,11,16,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <span
        style={{
          fontFamily: C.display,
          fontSize: "1.3rem",
          color: C.gold,
          letterSpacing: "0.15em",
        }}
      >
        DIEGO
      </span>
      <div style={{ display: "flex", gap: "2.5rem", alignItems: "center" }}>
        {["GENERATE", "VERIFY", "EXPLORE"].map((l) => (
          <span
            key={l}
            style={{
              fontFamily: C.mono,
              fontSize: "0.75rem",
              color: C.muted,
              letterSpacing: "0.12em",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.target.style.color = C.gold)}
            onMouseLeave={(e) => (e.target.style.color = C.muted)}
          >
            {l}
          </span>
        ))}
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const connected = mounted && account && chain;
            return (
              <div>
                {!connected ? (
                  <button
                    onClick={openConnectModal}
                    style={{
                      fontFamily: C.mono,
                      fontSize: "0.75rem",
                      letterSpacing: "0.1em",
                      padding: "0.45rem 1.1rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      background: "rgba(240,192,64,0.1)",
                      border: "1px solid rgba(240,192,64,0.4)",
                      color: C.gold,
                    }}
                  >
                    CONNECT WALLET
                  </button>
                ) : chain.unsupported ? (
                  <button
                    onClick={openChainModal}
                    style={{
                      fontFamily: C.mono,
                      fontSize: "0.75rem",
                      letterSpacing: "0.1em",
                      padding: "0.45rem 1.1rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.4)",
                      color: "#EF4444",
                    }}
                  >
                    WRONG NETWORK
                  </button>
                ) : (
                  <button
                    onClick={openAccountModal}
                    style={{
                      fontFamily: C.mono,
                      fontSize: "0.75rem",
                      letterSpacing: "0.1em",
                      padding: "0.45rem 1.1rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      background: "rgba(240,192,64,0.08)",
                      border: "1px solid rgba(240,192,64,0.25)",
                      color: C.gold,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#1D9E75",
                        display: "inline-block",
                      }}
                    />
                    {account.displayName}
                    <span style={{ color: C.muted, fontSize: "0.7rem" }}>
                      {account.displayBalance
                        ? `· ${account.displayBalance}`
                        : ""}
                    </span>
                  </button>
                )}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </nav>
  );
}

function StatsBar() {
  const [count, setCount] = useState(14880);
  useEffect(() => {
    const t = setInterval(
      () => setCount((c) => c + Math.floor(Math.random() * 2)),
      4000,
    );
    return () => clearInterval(t);
  }, []);
  const stats = [
    { value: count.toLocaleString(), label: "DOCUMENTS NOTARIZED" },
    { value: "0.049", label: "ETH BALANCE" },
    { value: "99.97%", label: "VERIFICATION RATE" },
  ];
  return (
    <div
      style={{
        display: "flex",
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        width: "100%",
      }}
    >
      {stats.map((s, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            padding: "1.5rem",
            textAlign: "center",
            borderRight: i < 2 ? `1px solid ${C.border}` : "none",
          }}
        >
          <div
            style={{
              fontFamily: C.mono,
              fontSize: "1.8rem",
              color: C.gold,
              marginBottom: "0.3rem",
            }}
          >
            {s.value}
          </div>
          <div
            style={{
              fontFamily: C.mono,
              fontSize: "0.65rem",
              color: C.muted,
              letterSpacing: "0.12em",
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: "✍️",
      title: "Generate",
      desc: "Prompt Claude to create any AI output — text, code, analysis, art descriptions.",
      tag: "Claude API",
    },
    {
      n: "02",
      icon: "🔐",
      title: "Notarize",
      desc: "SHA-256 hash is computed and written immutably to Ethereum. Costs ~0.001 ETH.",
      tag: "On-chain",
    },
    {
      n: "03",
      icon: "✅",
      title: "Verify",
      desc: "Anyone with the content can verify its origin, timestamp, and wallet signature.",
      tag: "Public",
    },
  ];
  return (
    <div style={{ width: "100%", padding: "4rem 2.5rem", background: C.bg }}>
      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          maxWidth: "900px",
          margin: "0 auto",
          flexWrap: "wrap",
        }}
      >
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              minWidth: "240px",
              background: i === 0 ? "rgba(240,192,64,0.08)" : C.surface,
              border: `1px solid ${i === 0 ? "rgba(240,192,64,0.3)" : C.border}`,
              borderRadius: "16px",
              padding: "1.75rem",
            }}
          >
            <div
              style={{
                fontFamily: C.mono,
                fontSize: "0.7rem",
                color: C.goldDim,
                marginBottom: "1rem",
              }}
            >
              {s.n} /
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "12px",
                fontSize: "1.4rem",
                background: "rgba(240,192,64,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
              }}
            >
              {s.icon}
            </div>
            <div
              style={{
                fontFamily: C.display,
                fontSize: "1.2rem",
                color: C.text,
                marginBottom: "0.6rem",
              }}
            >
              {s.title}
            </div>
            <div
              style={{
                fontFamily: "sans-serif",
                fontSize: "0.875rem",
                color: C.muted,
                lineHeight: 1.6,
                marginBottom: "1rem",
              }}
            >
              {s.desc}
            </div>
            <span
              style={{
                fontFamily: C.mono,
                fontSize: "0.7rem",
                color: C.goldDim,
                padding: "0.25rem 0.7rem",
                border: "1px solid rgba(240,192,64,0.25)",
                borderRadius: "20px",
              }}
            >
              {s.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveFeed() {
  const [items, setItems] = useState(FEED_ITEMS);
  useEffect(() => {
    const t = setInterval(() => {
      const labels = ["ESSAY", "CODE", "ANALYSIS", "REPORT", "IMAGE PROMPT"];
      const newItem = {
        addr:
          "0x" +
          Math.random().toString(16).slice(2, 6) +
          "..." +
          Math.random().toString(16).slice(2, 6),
        label: labels[Math.floor(Math.random() * labels.length)],
        time: "just now",
      };
      setItems((prev) => [newItem, ...prev.slice(0, 7)]);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ width: "100%", padding: "0 2.5rem 4rem", background: C.bg }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div
          style={{
            fontFamily: C.mono,
            fontSize: "0.7rem",
            color: C.muted,
            letterSpacing: "0.15em",
            textAlign: "center",
            marginBottom: "1.5rem",
          }}
        >
          — LIVE ACTIVITY —
        </div>
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "0.85rem 1.25rem",
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#1D9E75",
                display: "inline-block",
                animation: "pulse 2s infinite",
              }}
            />
            <span
              style={{
                fontFamily: C.mono,
                fontSize: "0.7rem",
                color: C.muted,
                letterSpacing: "0.12em",
              }}
            >
              BLOCKCHAIN EVENTS{" "}
              <span style={{ color: C.goldDim, opacity: 0.6 }}>(demo)</span>
            </span>
          </div>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1.25rem",
                borderBottom:
                  i < items.length - 1 ? `1px solid ${C.border}` : "none",
                opacity: i === 0 ? 1 : Math.max(0.3, 0.7 - i * 0.05),
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: C.gold,
                    display: "inline-block",
                    opacity: i === 0 ? 1 : 0.4,
                  }}
                />
                <span
                  style={{
                    fontFamily: C.mono,
                    fontSize: "0.8rem",
                    color: C.muted,
                  }}
                >
                  {item.addr}
                </span>
              </div>
              <div
                style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}
              >
                <span
                  style={{
                    fontFamily: C.mono,
                    fontSize: "0.7rem",
                    color: C.goldDim,
                    letterSpacing: "0.1em",
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontFamily: C.mono,
                    fontSize: "0.7rem",
                    color: C.muted,
                  }}
                >
                  {item.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TryIt({ isConnected }) {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [label, setLabel] = useState("essay");
  const [notarizing, setNotarizing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [notarizeError, setNotarizeError] = useState("");

  const { data: walletClient } = useWalletClient();

  async function hashText(text) {
    const encoded = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return (
      "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    );
  }

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setOutput("");
    setReceipt(null);
    setNotarizeError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setOutput(data.text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleNotarize() {
    if (!output || !walletClient) return;
    setNotarizing(true);
    setNotarizeError("");
    setReceipt(null);
    try {
      const hash = await hashText(output);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.notarize(hash, label);
      const txReceipt = await tx.wait();
      setReceipt({
        hash,
        txHash: txReceipt.hash,
        blockNumber: txReceipt.blockNumber,
        etherscanUrl: `https://sepolia.etherscan.io/tx/${txReceipt.hash}`,
      });
    } catch (err) {
      if (err.code === 4001) {
        setNotarizeError("Transaction rejected — you cancelled in MetaMask.");
      } else if (err.message?.includes("HashAlreadyRecorded")) {
        setNotarizeError("This content has already been notarized on-chain.");
      } else {
        setNotarizeError(err.message || "Transaction failed.");
      }
    } finally {
      setNotarizing(false);
    }
  }

  return (
    <div style={{ width: "100%", padding: "0 2.5rem 5rem", background: C.bg }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div
          style={{
            fontFamily: C.mono,
            fontSize: "0.7rem",
            color: C.muted,
            letterSpacing: "0.15em",
            textAlign: "center",
            marginBottom: "1.5rem",
          }}
        >
          — TRY IT NOW —
        </div>

        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              fontFamily: C.mono,
              fontSize: "0.7rem",
              color: C.goldDim,
              letterSpacing: "0.1em",
              marginBottom: "0.75rem",
            }}
          >
            YOUR PROMPT TO CLAUDE
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Write a short summary of blockchain provenance for AI content..."
            rows={4}
            style={{
              width: "100%",
              background: "rgba(0,0,0,0.3)",
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              padding: "0.85rem",
              color: C.text,
              fontFamily: C.mono,
              fontSize: "0.85rem",
              resize: "vertical",
              outline: "none",
              lineHeight: 1.6,
              boxSizing: "border-box",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1rem",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <span
              style={{ fontFamily: C.mono, fontSize: "0.7rem", color: C.muted }}
            >
              claude-sonnet-4-5 · SHA-256 · Ethereum Sepolia
            </span>
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              style={{
                fontFamily: C.mono,
                fontSize: "0.8rem",
                letterSpacing: "0.1em",
                padding: "0.7rem 1.5rem",
                background: "transparent",
                color: loading ? C.muted : C.text,
                border: `1px solid ${loading ? C.border : "rgba(237,232,220,0.3)"}`,
                borderRadius: "8px",
                cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "GENERATING..." : "GENERATE ↗"}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "1rem",
              padding: "1rem 1.25rem",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "12px",
              fontFamily: C.mono,
              fontSize: "0.8rem",
              color: "#EF4444",
            }}
          >
            ⚠ {error}
          </div>
        )}

        {output && (
          <div
            style={{
              background: C.surface,
              border: "1px solid rgba(240,192,64,0.25)",
              borderRadius: "16px",
              overflow: "hidden",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                padding: "0.75rem 1.25rem",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <span
                style={{
                  fontFamily: C.mono,
                  fontSize: "0.7rem",
                  color: C.goldDim,
                  letterSpacing: "0.1em",
                }}
              >
                CLAUDE OUTPUT
              </span>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                style={{
                  fontFamily: C.mono,
                  fontSize: "0.7rem",
                  color: C.gold,
                  background: "rgba(240,192,64,0.08)",
                  border: "1px solid rgba(240,192,64,0.25)",
                  borderRadius: "6px",
                  padding: "0.25rem 0.6rem",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {[
                  "essay",
                  "code",
                  "analysis",
                  "report",
                  "image prompt",
                  "other",
                ].map((l) => (
                  <option key={l} value={l} style={{ background: C.surface }}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                padding: "1.25rem",
                fontFamily: "sans-serif",
                fontSize: "0.9rem",
                color: C.text,
                lineHeight: 1.75,
                whiteSpace: "pre-wrap",
              }}
            >
              {output.replace(/##\s+/g, "").replace(/\*\*(.*?)\*\*/g, "$1")}
            </div>
            <div
              style={{
                padding: "0 1.25rem 1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <button
                onClick={handleNotarize}
                disabled={!isConnected || notarizing}
                style={{
                  fontFamily: C.mono,
                  fontSize: "0.78rem",
                  letterSpacing: "0.1em",
                  padding: "0.8rem 1.5rem",
                  borderRadius: "8px",
                  cursor:
                    isConnected && !notarizing ? "pointer" : "not-allowed",
                  background: isConnected
                    ? "rgba(240,192,64,0.12)"
                    : "transparent",
                  border: `1px solid ${isConnected ? "rgba(240,192,64,0.4)" : C.border}`,
                  color: isConnected ? C.gold : C.muted,
                  opacity: !isConnected || notarizing ? 0.6 : 1,
                }}
              >
                {notarizing
                  ? "WAITING FOR METAMASK..."
                  : isConnected
                    ? "NOTARIZE ON ETHEREUM ↗"
                    : "CONNECT WALLET TO NOTARIZE"}
              </button>
              {notarizeError && (
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "8px",
                    fontFamily: C.mono,
                    fontSize: "0.78rem",
                    color: "#EF4444",
                  }}
                >
                  ⚠ {notarizeError}
                </div>
              )}
            </div>
          </div>
        )}

        {receipt && (
          <div
            style={{
              background: "rgba(29,158,117,0.06)",
              border: "1px solid rgba(29,158,117,0.3)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "0.75rem 1.25rem",
                borderBottom: "1px solid rgba(29,158,117,0.2)",
                fontFamily: C.mono,
                fontSize: "0.7rem",
                color: "#1D9E75",
                letterSpacing: "0.1em",
              }}
            >
              ✓ NOTARIZED ON ETHEREUM
            </div>
            <div
              style={{
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {[
                { label: "CONTENT HASH", value: receipt.hash },
                { label: "TX HASH", value: receipt.txHash },
                { label: "BLOCK", value: `#${receipt.blockNumber}` },
              ].map((row) => (
                <div key={row.label}>
                  <div
                    style={{
                      fontFamily: C.mono,
                      fontSize: "0.65rem",
                      color: C.muted,
                      marginBottom: "0.2rem",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {row.label}
                  </div>
                  <div
                    style={{
                      fontFamily: C.mono,
                      fontSize: "0.78rem",
                      color: C.text,
                      wordBreak: "break-all",
                    }}
                  >
                    {row.value}
                  </div>
                </div>
              ))}
              <a
                href={receipt.etherscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: "0.5rem",
                  fontFamily: C.mono,
                  fontSize: "0.75rem",
                  letterSpacing: "0.1em",
                  padding: "0.65rem 1.25rem",
                  borderRadius: "8px",
                  background: "rgba(29,158,117,0.12)",
                  border: "1px solid rgba(29,158,117,0.3)",
                  color: "#1D9E75",
                  textDecoration: "none",
                }}
              >
                VIEW ON ETHERSCAN ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard({ address, isConnected }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadHistory() {
    if (!address) return;
    setLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(
        `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`,
      );
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const currentBlock = await provider.getBlockNumber();

      // Query in chunks of 9 blocks (Alchemy free tier limit)
      const chunkSize = 9;
      const totalBlocks = 500; // look back 500 blocks
      const fromBlock = Math.max(0, currentBlock - totalBlocks);

      let allEvents = [];
      for (let start = fromBlock; start < currentBlock; start += chunkSize) {
        const end = Math.min(start + chunkSize - 1, currentBlock);
        const filter = contract.filters.ContentNotarized(null, address);
        try {
          const chunk = await contract.queryFilter(filter, start, end);
          allEvents = [...allEvents, ...chunk];
        } catch (e) {
          // skip failed chunks
        }
      }

      const items = await Promise.all(
        allEvents.map(async (e) => {
          const block = await provider.getBlock(e.blockNumber);
          return {
            hash: e.args[0],
            label: e.args[3],
            timestamp: new Date(block.timestamp * 1000).toUTCString(),
            txHash: e.transactionHash,
            blockNumber: e.blockNumber,
          };
        }),
      );
      setHistory(items.reverse());
      setLoaded(true);
    } catch (err) {
      console.error("Dashboard error:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isConnected || !address) return;
    loadHistory();
  }, [address, isConnected]);

  if (!isConnected) return null;

  return (
    <div
      style={{ width: "100%", padding: "0 2.5rem 5rem", background: C.surface }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div
          style={{
            fontFamily: C.mono,
            fontSize: "0.7rem",
            color: C.muted,
            letterSpacing: "0.15em",
            textAlign: "center",
            padding: "4rem 0 1.5rem",
          }}
        >
          — YOUR HISTORY —
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            marginBottom: "0.5rem",
          }}
        >
          <div
            style={{ fontFamily: C.display, fontSize: "1.8rem", color: C.text }}
          >
            Your notarized content
          </div>
          <button
            onClick={loadHistory}
            style={{
              fontFamily: C.mono,
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              padding: "0.4rem 0.85rem",
              borderRadius: "8px",
              cursor: "pointer",
              background: "transparent",
              color: C.muted,
              border: `1px solid ${C.border}`,
            }}
          >
            REFRESH ↺
          </button>
        </div>
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: "0.9rem",
            color: C.muted,
            textAlign: "center",
            marginBottom: "2rem",
            lineHeight: 1.6,
          }}
        >
          Every piece of content you have stamped on Ethereum — pulled live from
          the blockchain.
        </div>

        {loading && (
          <div
            style={{
              textAlign: "center",
              fontFamily: C.mono,
              fontSize: "0.8rem",
              color: C.muted,
              padding: "2rem",
            }}
          >
            LOADING FROM BLOCKCHAIN...
          </div>
        )}

        {loaded && history.length === 0 && (
          <div
            style={{
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: "16px",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <div
              style={{ fontFamily: C.mono, fontSize: "0.8rem", color: C.muted }}
            >
              No records found for this wallet yet. Notarize something above to
              get started.
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div
            style={{
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 90px 1fr 110px",
                padding: "0.65rem 1.25rem",
                borderBottom: `1px solid ${C.border}`,
                background: "rgba(240,192,64,0.04)",
              }}
            >
              {["CONTENT HASH", "LABEL", "TIMESTAMP", "TX"].map((h) => (
                <div
                  key={h}
                  style={{
                    fontFamily: C.mono,
                    fontSize: "0.65rem",
                    color: C.muted,
                    letterSpacing: "0.1em",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
            {history.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 90px 1fr 110px",
                  padding: "0.85rem 1.25rem",
                  alignItems: "center",
                  borderBottom:
                    i < history.length - 1 ? `1px solid ${C.border}` : "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(240,192,64,0.03)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div
                  style={{
                    fontFamily: C.mono,
                    fontSize: "0.75rem",
                    color: C.text,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    paddingRight: "1rem",
                  }}
                >
                  {item.hash.slice(0, 18)}...{item.hash.slice(-6)}
                </div>
                <div
                  style={{
                    fontFamily: C.mono,
                    fontSize: "0.7rem",
                    color: C.goldDim,
                  }}
                >
                  {item.label || "—"}
                </div>
                <div
                  style={{
                    fontFamily: C.mono,
                    fontSize: "0.72rem",
                    color: C.muted,
                  }}
                >
                  {item.timestamp}
                </div>
                <a
                  href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: C.mono,
                    fontSize: "0.7rem",
                    color: "#1D9E75",
                    textDecoration: "none",
                    letterSpacing: "0.05em",
                  }}
                >
                  #{item.blockNumber} ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VerifyPortal() {
  const [input, setInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [verifyError, setVerifyError] = useState("");

  async function handleVerify() {
    if (!input.trim()) return;
    setChecking(true);
    setResult(null);
    setVerifyError("");
    try {
      const encoded = new TextEncoder().encode(input);
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash =
        "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      const provider = new ethers.JsonRpcProvider(
        `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`,
      );
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const [submitter, timestamp, label, exists] = await contract.verify(hash);
      if (!exists) {
        setResult({ found: false, hash });
      } else {
        const date = new Date(Number(timestamp) * 1000);
        setResult({
          found: true,
          hash,
          submitter,
          label,
          timestamp: date.toUTCString(),
          etherscanUrl: `https://sepolia.etherscan.io/address/${submitter}`,
        });
      }
    } catch (err) {
      setVerifyError(err.message || "Verification failed.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div style={{ width: "100%", padding: "0 2.5rem 5rem", background: C.bg }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div
          style={{
            fontFamily: C.mono,
            fontSize: "0.7rem",
            color: C.muted,
            letterSpacing: "0.15em",
            textAlign: "center",
            padding: "4rem 0 1.5rem",
          }}
        >
          — VERIFY CONTENT —
        </div>
        <div
          style={{
            fontFamily: C.display,
            fontSize: "1.8rem",
            color: C.text,
            textAlign: "center",
            marginBottom: "0.5rem",
          }}
        >
          Was this content notarized?
        </div>
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: "0.9rem",
            color: C.muted,
            textAlign: "center",
            marginBottom: "2rem",
            lineHeight: 1.6,
          }}
        >
          Paste any text below. No wallet needed — verification is free and
          public.
        </div>
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              fontFamily: C.mono,
              fontSize: "0.7rem",
              color: C.goldDim,
              letterSpacing: "0.1em",
              marginBottom: "0.75rem",
            }}
          >
            PASTE CONTENT TO VERIFY
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste the AI-generated text you want to verify..."
            rows={5}
            style={{
              width: "100%",
              background: "rgba(0,0,0,0.3)",
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              padding: "0.85rem",
              color: C.text,
              fontFamily: C.mono,
              fontSize: "0.85rem",
              resize: "vertical",
              outline: "none",
              lineHeight: 1.6,
              boxSizing: "border-box",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1rem",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <span
              style={{ fontFamily: C.mono, fontSize: "0.7rem", color: C.muted }}
            >
              Free · No wallet required · Reads from Sepolia
            </span>
            <button
              onClick={handleVerify}
              disabled={checking || !input.trim()}
              style={{
                fontFamily: C.mono,
                fontSize: "0.8rem",
                letterSpacing: "0.1em",
                padding: "0.7rem 1.5rem",
                background: "transparent",
                color: checking ? C.muted : C.text,
                border: `1px solid ${checking ? C.border : "rgba(237,232,220,0.3)"}`,
                borderRadius: "8px",
                cursor: checking || !input.trim() ? "not-allowed" : "pointer",
              }}
            >
              {checking ? "CHECKING..." : "VERIFY ↗"}
            </button>
          </div>
        </div>

        {verifyError && (
          <div
            style={{
              marginBottom: "1rem",
              padding: "1rem 1.25rem",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "12px",
              fontFamily: C.mono,
              fontSize: "0.8rem",
              color: "#EF4444",
            }}
          >
            ⚠ {verifyError}
          </div>
        )}

        {result && !result.found && (
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "16px",
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                fontFamily: C.mono,
                fontSize: "0.8rem",
                color: C.muted,
                marginBottom: "0.75rem",
                letterSpacing: "0.1em",
              }}
            >
              ✗ NO RECORD FOUND
            </div>
            <div
              style={{
                fontFamily: "sans-serif",
                fontSize: "0.9rem",
                color: C.muted,
                lineHeight: 1.6,
                marginBottom: "1rem",
              }}
            >
              This content has not been notarized on DIEGO. Either it was never
              submitted, or the text does not match exactly what was originally
              notarized.
            </div>
            <div
              style={{
                fontFamily: C.mono,
                fontSize: "0.7rem",
                color: C.muted,
                letterSpacing: "0.08em",
              }}
            >
              HASH CHECKED →{" "}
              <span style={{ color: C.goldDim, wordBreak: "break-all" }}>
                {result.hash}
              </span>
            </div>
          </div>
        )}

        {result && result.found && (
          <div
            style={{
              background: "rgba(29,158,117,0.06)",
              border: "1px solid rgba(29,158,117,0.3)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "0.75rem 1.25rem",
                borderBottom: "1px solid rgba(29,158,117,0.2)",
                fontFamily: C.mono,
                fontSize: "0.7rem",
                color: "#1D9E75",
                letterSpacing: "0.1em",
              }}
            >
              ✓ VERIFIED ON ETHEREUM
            </div>
            <div
              style={{
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
              }}
            >
              {[
                { label: "CONTENT HASH", value: result.hash },
                { label: "SUBMITTED BY", value: result.submitter },
                { label: "TIMESTAMP", value: result.timestamp },
                { label: "LABEL", value: result.label || "(none)" },
              ].map((row) => (
                <div key={row.label}>
                  <div
                    style={{
                      fontFamily: C.mono,
                      fontSize: "0.65rem",
                      color: C.muted,
                      marginBottom: "0.2rem",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {row.label}
                  </div>
                  <div
                    style={{
                      fontFamily: C.mono,
                      fontSize: "0.82rem",
                      color: C.text,
                      wordBreak: "break-all",
                    }}
                  >
                    {row.value}
                  </div>
                </div>
              ))}
              <a
                href={result.etherscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: "0.25rem",
                  fontFamily: C.mono,
                  fontSize: "0.75rem",
                  letterSpacing: "0.1em",
                  padding: "0.65rem 1.25rem",
                  borderRadius: "8px",
                  background: "rgba(29,158,117,0.12)",
                  border: "1px solid rgba(29,158,117,0.3)",
                  color: "#1D9E75",
                  textDecoration: "none",
                }}
              >
                VIEW SUBMITTER ON ETHERSCAN ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { address, isConnected } = useAccount();

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        overflowX: "hidden",
      }}
    >
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea::placeholder { color: #4B5563; }
        textarea:focus { border-color: rgba(240,192,64,0.3) !important; }
      `}</style>

      <Nav />

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "6rem 2rem 3rem",
          position: "relative",
          backgroundImage: `linear-gradient(rgba(240,192,64,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(240,192,64,0.03) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "400px",
            borderRadius: "50%",
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse, rgba(240,192,64,0.07) 0%, transparent 70%)",
          }}
        />
        <Seal />
        <div
          style={{
            fontFamily: C.mono,
            fontSize: "0.7rem",
            color: C.muted,
            letterSpacing: "0.2em",
            marginBottom: "1rem",
          }}
        >
          DECENTRALIZED IMMUTABLE EVIDENCE FOR GENERATED OUTPUT
        </div>
        <h1
          style={{
            fontFamily: C.display,
            fontSize: "clamp(3rem, 8vw, 5.5rem)",
            fontWeight: 800,
            lineHeight: 1.05,
            marginBottom: "0.5rem",
            color: C.text,
          }}
        >
          Prove what
          <br />
          <span style={{ color: C.gold }}>AI created.</span>
        </h1>
        <p
          style={{
            fontFamily: C.mono,
            fontSize: "0.8rem",
            color: C.muted,
            letterSpacing: "0.15em",
            marginBottom: "2rem",
          }}
        >
          HASH IT. STAMP IT. OWN IT FOREVER.
        </p>
        <HashTicker />
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            style={{
              fontFamily: C.mono,
              fontSize: "0.8rem",
              letterSpacing: "0.12em",
              padding: "0.85rem 2rem",
              borderRadius: "8px",
              background: "transparent",
              color: C.text,
              border: "1px solid rgba(237,232,220,0.3)",
              cursor: "pointer",
            }}
          >
            GENERATE + NOTARIZE ↗
          </button>
          <button
            style={{
              fontFamily: C.mono,
              fontSize: "0.8rem",
              letterSpacing: "0.12em",
              padding: "0.85rem 2rem",
              borderRadius: "8px",
              background: "transparent",
              color: C.muted,
              border: `1px solid ${C.border}`,
              cursor: "pointer",
            }}
          >
            VERIFY A HASH
          </button>
        </div>
        {!isConnected && (
          <div style={{ marginTop: "2rem" }}>
            <ConnectButton />
          </div>
        )}
        <div
          style={{
            marginTop: "4rem",
            fontFamily: C.mono,
            fontSize: "0.65rem",
            color: C.muted,
            letterSpacing: "0.1em",
          }}
        >
          — HOW IT WORKS ↓ —
        </div>
      </div>

      <StatsBar />
      <HowItWorks />
      <LiveFeed />
      <TryIt isConnected={isConnected} />
      <Dashboard address={address} isConnected={isConnected} />
      <VerifyPortal />

      <div
        style={{
          textAlign: "center",
          padding: "2rem",
          borderTop: `1px solid ${C.border}`,
          fontFamily: C.mono,
          fontSize: "0.65rem",
          color: C.muted,
          letterSpacing: "0.1em",
        }}
      >
        DEPLOYED ON ETHEREUM SEPOLIA · BUILT WITH SOLIDITY + REACT + CLAUDE API
      </div>
    </div>
  );
}
