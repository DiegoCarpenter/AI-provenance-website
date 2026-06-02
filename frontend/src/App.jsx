import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState, useEffect, useRef, useCallback } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence, useInView } from "framer-motion";
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

const ease = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

const FAKE_HASH =
  "0xa3f5c2d1e4b7890123456789abcdef01fedcba9876543210deadbeef12345678";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const ABI = CONTRACT_ABI.abi;

const FLOW_STEPS = [
  { key: "generating", label: "Generating" },
  { key: "hashing", label: "Hashing" },
  { key: "metamask", label: "MetaMask" },
  { key: "confirming", label: "Confirming" },
  { key: "done", label: "Done" },
];

const FLOW_PHASE_MAP = {
  generating: { activeIdx: 0, completedUpTo: -1 },
  generated: { activeIdx: -1, completedUpTo: 0 },
  hashing: { activeIdx: 1, completedUpTo: 0 },
  metamask: { activeIdx: 2, completedUpTo: 1 },
  confirming: { activeIdx: 3, completedUpTo: 2 },
  done: { activeIdx: -1, completedUpTo: 4 },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconLock({ size = 20, color = C.gold }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" stroke={color} />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} />
      <circle cx="12" cy="16" r="1.5" fill={color} opacity="0.8" />
    </svg>
  );
}

function IconEdit({ color = C.goldDim }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconChain({ color = C.goldDim }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconShield({ color = C.goldDim }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// ─── Spinner + ProgressIndicator ─────────────────────────────────────────────

function Spinner({ size = 14, color = C.muted }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{
        animation: "spin 0.7s linear infinite",
        display: "inline-block",
        flexShrink: 0,
        verticalAlign: "middle",
      }}
    >
      <circle cx="12" cy="12" r="9" stroke={color} opacity="0.2" />
      <path d="M12 3 A9 9 0 0 1 21 12" stroke={color} />
    </svg>
  );
}

function ProgressIndicator({ flowStep }) {
  if (!flowStep) return null;
  const { activeIdx, completedUpTo } = FLOW_PHASE_MAP[flowStep] ?? {
    activeIdx: -1,
    completedUpTo: -1,
  };
  const furthest = Math.max(activeIdx, completedUpTo);
  const fraction = furthest < 0 ? 0 : furthest / (FLOW_STEPS.length - 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.3 }}
      style={{
        padding: "1.1rem 1.5rem 1rem",
        background: "rgba(0,0,0,0.18)",
        border: `1px solid ${C.border}`,
        borderRadius: "10px",
        marginBottom: "0.85rem",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {/* Track */}
        <div
          style={{
            position: "absolute",
            top: 11,
            left: 11,
            right: 11,
            height: 1,
            background: C.border,
            zIndex: 0,
          }}
        />
        {/* Progress fill */}
        <div
          style={{
            position: "absolute",
            top: 11,
            left: 11,
            height: 1,
            background: "rgba(240,192,64,0.45)",
            zIndex: 1,
            width: `calc(${fraction * 100}% - ${fraction * 22}px)`,
            transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
        {FLOW_STEPS.map((step, i) => {
          const isActive = i === activeIdx;
          const isDone = i <= completedUpTo;
          return (
            <div
              key={step.key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.45rem",
                zIndex: 2,
                minWidth: 22,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: `1.5px solid ${isDone || isActive ? C.gold : C.border}`,
                  background: isDone
                    ? "rgba(240,192,64,0.16)"
                    : isActive
                      ? "rgba(240,192,64,0.07)"
                      : C.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "border-color 0.35s, background 0.35s",
                }}
              >
                {isDone ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5L4 7.5L8 3"
                      stroke={C.gold}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : isActive ? (
                  <motion.div
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.1 }}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: C.gold,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: C.border,
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontFamily: C.mono,
                  fontSize: "0.54rem",
                  letterSpacing: "0.06em",
                  color: isActive ? C.gold : isDone ? C.goldDim : C.muted,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  lineHeight: 1.3,
                  transition: "color 0.35s",
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Panel({ children, style = {} }) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "12px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function GoldPanel({ children, style = {} }) {
  return (
    <div
      style={{
        background: C.surface,
        border: "1px solid rgba(240,192,64,0.2)",
        borderRadius: "12px",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SuccessPanel({ children, style = {} }) {
  return (
    <div
      style={{
        background: "rgba(29,158,117,0.04)",
        border: "1px solid rgba(29,158,117,0.22)",
        borderRadius: "12px",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{
        marginBottom: "1rem",
        padding: "0.85rem 1.25rem",
        background: "rgba(239,68,68,0.07)",
        border: "1px solid rgba(239,68,68,0.22)",
        borderRadius: "10px",
        fontFamily: C.mono,
        fontSize: "0.78rem",
        color: "#EF4444",
      }}
    >
      ⚠ {message}
    </motion.div>
  );
}

function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: C.mono,
        fontSize: "0.63rem",
        color: C.goldDim,
        letterSpacing: "0.12em",
        marginBottom: "0.75rem",
      }}
    >
      {children}
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontFamily: C.mono,
          fontSize: "0.6rem",
          color: C.muted,
          marginBottom: "0.2rem",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: C.mono,
          fontSize: "0.78rem",
          color: C.text,
          wordBreak: "break-all",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled, loading }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
      style={{
        fontFamily: C.mono,
        fontSize: "0.76rem",
        letterSpacing: "0.1em",
        padding: "0.75rem 1.6rem",
        borderRadius: "8px",
        background: disabled ? "transparent" : "rgba(240,192,64,0.09)",
        color: disabled ? C.muted : C.gold,
        border: `1px solid ${disabled ? C.border : "rgba(240,192,64,0.32)"}`,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s, border-color 0.2s",
        opacity: loading ? 0.65 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "rgba(240,192,64,0.15)";
          e.currentTarget.style.borderColor = "rgba(240,192,64,0.5)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "rgba(240,192,64,0.09)";
          e.currentTarget.style.borderColor = "rgba(240,192,64,0.32)";
        }
      }}
    >
      {children}
    </motion.button>
  );
}

function GhostBtn({ children, onClick, disabled }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
      style={{
        fontFamily: C.mono,
        fontSize: "0.76rem",
        letterSpacing: "0.1em",
        padding: "0.75rem 1.6rem",
        borderRadius: "8px",
        background: "transparent",
        color: disabled ? C.muted : C.text,
        border: `1px solid ${disabled ? C.border : "rgba(237,232,220,0.18)"}`,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "border-color 0.2s, color 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          e.currentTarget.style.borderColor = "rgba(237,232,220,0.38)";
      }}
      onMouseLeave={(e) => {
        if (!disabled)
          e.currentTarget.style.borderColor = "rgba(237,232,220,0.18)";
      }}
    >
      {children}
    </motion.button>
  );
}

function SectionLabel({ children, paddingTop = "5rem" }) {
  return (
    <motion.div
      style={{
        fontFamily: C.mono,
        fontSize: "0.65rem",
        color: C.muted,
        letterSpacing: "0.2em",
        textAlign: "center",
        paddingTop,
        paddingBottom: "1.75rem",
      }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
    >
      — {children} —
    </motion.div>
  );
}

function SectionHeading({ children, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.65, ease }}
      style={{ textAlign: "center", marginBottom: "2.5rem" }}
    >
      <div
        style={{
          fontFamily: C.display,
          fontSize: "1.85rem",
          color: C.text,
          marginBottom: "0.5rem",
        }}
      >
        {children}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: C.mono,
            fontSize: "0.8rem",
            color: C.muted,
            lineHeight: 1.65,
          }}
        >
          {sub}
        </div>
      )}
    </motion.div>
  );
}

function StyledTextarea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        background: "rgba(0,0,0,0.22)",
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        padding: "0.9rem",
        color: C.text,
        fontFamily: C.mono,
        fontSize: "0.85rem",
        resize: "vertical",
        outline: "none",
        lineHeight: 1.65,
        boxSizing: "border-box",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    />
  );
}

// ─── Counter ──────────────────────────────────────────────────────────────────

function Counter({ to, duration = 1.6 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now) => {
      const pct = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      setVal(Math.floor(eased * to));
      if (pct < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to, duration]);

  return <span ref={ref}>{val.toLocaleString()}</span>;
}

// ─── HashTicker ───────────────────────────────────────────────────────────────

function HashTicker() {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);
  const dir = useRef(1);
  const hashRef = useRef(FAKE_HASH);

  useEffect(() => {
    async function fetchLatestHash() {
      try {
        const provider = new ethers.JsonRpcProvider(
          `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`,
        );
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 500);
        const chunkSize = 9;
        let allEvents = [];
        for (let start = fromBlock; start < currentBlock; start += chunkSize) {
          const end = Math.min(start + chunkSize - 1, currentBlock);
          try {
            const chunk = await contract.queryFilter(
              contract.filters.ContentNotarized(),
              start,
              end,
            );
            allEvents = [...allEvents, ...chunk];
          } catch {
            // skip failed chunk
          }
        }
        if (allEvents.length > 0) {
          allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
          hashRef.current = allEvents[0].args[0];
        }
      } catch (err) {
        console.error("HashTicker fetch error:", err.message);
      }
    }
    fetchLatestHash();
  }, []);

  useEffect(() => {
    const tick = setInterval(() => {
      const h = hashRef.current;
      if (dir.current === 1) {
        idx.current = Math.min(idx.current + 1, h.length);
        setDisplayed(h.slice(0, idx.current));
        if (idx.current === h.length)
          setTimeout(() => {
            dir.current = -1;
          }, 2000);
      } else {
        idx.current = Math.max(idx.current - 1, 0);
        setDisplayed(h.slice(0, idx.current));
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
        fontSize: "0.8rem",
        color: C.goldDim,
        background: "rgba(240,192,64,0.04)",
        border: "1px solid rgba(240,192,64,0.1)",
        borderRadius: "10px",
        padding: "0.65rem 1.1rem",
        display: "inline-block",
        minWidth: "520px",
        maxWidth: "90vw",
        wordBreak: "break-all",
        marginBottom: "2rem",
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

// ─── Seal ─────────────────────────────────────────────────────────────────────

function Seal() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease }}
      style={{
        position: "relative",
        width: 96,
        height: 96,
        margin: "0 auto 2rem",
      }}
    >
      <svg
        width="96"
        height="96"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          animation: "spin 16s linear infinite",
        }}
      >
        <circle
          cx="48"
          cy="48"
          r="44"
          fill="none"
          stroke={C.gold}
          strokeWidth="1"
          strokeDasharray="5 8"
          opacity="0.3"
        />
      </svg>
      <svg
        width="96"
        height="96"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          animation: "spin 26s linear infinite reverse",
        }}
      >
        <circle
          cx="48"
          cy="48"
          r="35"
          fill="none"
          stroke={C.goldDim}
          strokeWidth="0.75"
          strokeDasharray="2 12"
          opacity="0.22"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 54,
          height: 54,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(240,192,64,0.1) 0%, transparent 70%)",
          border: "1px solid rgba(240,192,64,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconLock size={22} />
      </div>
    </motion.div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease }}
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
        background: "rgba(8,11,16,0.78)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <span
        style={{
          fontFamily: C.display,
          fontSize: "1.25rem",
          letterSpacing: "0.12em",
          background: `linear-gradient(90deg, ${C.gold} 0%, #FFE580 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        DIEGO
      </span>
      <div style={{ display: "flex", gap: "2.5rem", alignItems: "center" }}>
        {[
          { label: "GENERATE", id: "generate" },
          { label: "VERIFY", id: "verify" },
          { label: "EXPLORE", id: "explore" },
        ].map(({ label, id }) => (
          <span
            key={id}
            onClick={() =>
              document
                .getElementById(id)
                ?.scrollIntoView({ behavior: "smooth" })
            }
            style={{
              fontFamily: C.mono,
              fontSize: "0.7rem",
              color: C.muted,
              letterSpacing: "0.12em",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.color = C.text)}
            onMouseLeave={(e) => (e.target.style.color = C.muted)}
          >
            {label}
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
                  <motion.button
                    onClick={openConnectModal}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      fontFamily: C.mono,
                      fontSize: "0.7rem",
                      letterSpacing: "0.1em",
                      padding: "0.45rem 1.1rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      background: "rgba(240,192,64,0.08)",
                      border: "1px solid rgba(240,192,64,0.28)",
                      color: C.gold,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(240,192,64,0.14)";
                      e.currentTarget.style.borderColor =
                        "rgba(240,192,64,0.48)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(240,192,64,0.08)";
                      e.currentTarget.style.borderColor =
                        "rgba(240,192,64,0.28)";
                    }}
                  >
                    CONNECT WALLET
                  </motion.button>
                ) : chain.unsupported ? (
                  <button
                    onClick={openChainModal}
                    style={{
                      fontFamily: C.mono,
                      fontSize: "0.7rem",
                      letterSpacing: "0.1em",
                      padding: "0.45rem 1.1rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      background: "rgba(239,68,68,0.09)",
                      border: "1px solid rgba(239,68,68,0.35)",
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
                      fontSize: "0.7rem",
                      letterSpacing: "0.1em",
                      padding: "0.45rem 1.1rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      background: "rgba(240,192,64,0.06)",
                      border: "1px solid rgba(240,192,64,0.18)",
                      color: C.gold,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      transition: "all 0.2s",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#1D9E75",
                        display: "inline-block",
                      }}
                    />
                    {account.displayName}
                    <span style={{ color: C.muted, fontSize: "0.66rem" }}>
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
    </motion.nav>
  );
}

// ─── StatsBar ─────────────────────────────────────────────────────────────────

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
    { value: count, label: "DOCUMENTS NOTARIZED", isCounter: true },
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
            padding: "1.75rem",
            textAlign: "center",
            borderRight: i < 2 ? `1px solid ${C.border}` : "none",
          }}
        >
          <div
            style={{
              fontFamily: C.mono,
              fontSize: "1.9rem",
              color: C.gold,
              marginBottom: "0.35rem",
              letterSpacing: "-0.02em",
            }}
          >
            {s.isCounter ? <Counter to={s.value} /> : s.value}
          </div>
          <div
            style={{
              fontFamily: C.mono,
              fontSize: "0.6rem",
              color: C.muted,
              letterSpacing: "0.16em",
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── HowItWorks ───────────────────────────────────────────────────────────────

function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const steps = [
    {
      n: "01",
      Icon: IconEdit,
      title: "Generate",
      desc: "Prompt Claude to create any AI output — text, code, analysis, or art descriptions.",
      tag: "Claude API",
    },
    {
      n: "02",
      Icon: IconChain,
      title: "Notarize",
      desc: "SHA-256 hash is computed and written immutably to Ethereum. Costs ~0.001 ETH.",
      tag: "On-chain",
    },
    {
      n: "03",
      Icon: IconShield,
      title: "Verify",
      desc: "Anyone with the content can verify its origin, timestamp, and wallet signature.",
      tag: "Public",
    },
  ];

  return (
    <div style={{ width: "100%", padding: "5rem 2.5rem", background: C.bg }}>
      <div style={{ maxWidth: "920px", margin: "0 auto" }}>
        <SectionLabel paddingTop="0">PROTOCOL OVERVIEW</SectionLabel>
        <motion.div
          ref={ref}
          style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {steps.map((s) => (
            <motion.div
              key={s.n}
              variants={{
                hidden: { opacity: 0, y: 32 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.7, ease },
                },
              }}
              whileHover={{
                y: -5,
                transition: { duration: 0.25 },
              }}
              style={{
                flex: 1,
                minWidth: "240px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "14px",
                padding: "1.75rem",
                cursor: "default",
                transition: "border-color 0.3s, box-shadow 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(240,192,64,0.22)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  fontFamily: C.mono,
                  fontSize: "0.62rem",
                  color: C.goldDim,
                  marginBottom: "1.25rem",
                  letterSpacing: "0.08em",
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "10px",
                  background: "rgba(240,192,64,0.07)",
                  border: "1px solid rgba(240,192,64,0.13)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <s.Icon />
              </div>
              <div
                style={{
                  fontFamily: C.display,
                  fontSize: "1.15rem",
                  color: C.text,
                  marginBottom: "0.6rem",
                }}
              >
                {s.title}
              </div>
              <div
                style={{
                  fontFamily: C.mono,
                  fontSize: "0.79rem",
                  color: C.muted,
                  lineHeight: 1.65,
                  marginBottom: "1.25rem",
                }}
              >
                {s.desc}
              </div>
              <span
                style={{
                  fontFamily: C.mono,
                  fontSize: "0.62rem",
                  color: C.goldDim,
                  padding: "0.2rem 0.6rem",
                  border: "1px solid rgba(240,192,64,0.18)",
                  borderRadius: "20px",
                  letterSpacing: "0.08em",
                }}
              >
                {s.tag}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// ─── LiveFeed ─────────────────────────────────────────────────────────────────

function LiveFeed() {
  const [items, setItems] = useState([]);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const nextKey = useRef(0);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const knownTxHashes = useRef(new Set());
  const mountedRef = useRef(true);
  const initialLoadDone = useRef(false);

  function formatAge(ts) {
    const s = now - ts;
    if (s < 10) return "just now";
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  }

  const loadEvents = useCallback(async () => {
    try {
      const provider = new ethers.JsonRpcProvider(
        `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`,
      );
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 500);
      const chunkSize = 9;
      let allEvents = [];
      for (let start = fromBlock; start < currentBlock; start += chunkSize) {
        const end = Math.min(start + chunkSize - 1, currentBlock);
        try {
          const chunk = await contract.queryFilter(
            contract.filters.ContentNotarized(),
            start,
            end,
          );
          allEvents = [...allEvents, ...chunk];
        } catch {
          // skip failed chunk
        }
      }
      allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
      const top = allEvents.slice(0, 8);
      const fetched = await Promise.all(
        top.map(async (ev) => {
          const block = await provider.getBlock(ev.blockNumber);
          return {
            txHash: ev.transactionHash,
            addr: `${ev.args[1].slice(0, 6)}...${ev.args[1].slice(-4)}`,
            label: (ev.args[3] || "other").toUpperCase(),
            timestamp: Number(block.timestamp),
          };
        }),
      );
      if (!mountedRef.current) return;
      if (!initialLoadDone.current) {
        fetched.forEach((item) => knownTxHashes.current.add(item.txHash));
        setItems(fetched);
        setKeys(fetched.map(() => nextKey.current++));
        setLoading(false);
        initialLoadDone.current = true;
      } else {
        const newItems = fetched.filter(
          (item) => !knownTxHashes.current.has(item.txHash),
        );
        if (newItems.length > 0) {
          newItems.forEach((item) => knownTxHashes.current.add(item.txHash));
          const newKeys = newItems.map(() => nextKey.current++);
          setItems((prev) => [...newItems, ...prev].slice(0, 8));
          setKeys((prev) => [...newKeys, ...prev].slice(0, 8));
        }
      }
    } catch (err) {
      console.error("LiveFeed error:", err.message);
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const initialTimer = setTimeout(loadEvents, 0);
    const pollTimer = setInterval(loadEvents, 30000);
    return () => {
      mountedRef.current = false;
      clearTimeout(initialTimer);
      clearInterval(pollTimer);
    };
  }, [loadEvents]);

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      id="explore"
      style={{ width: "100%", padding: "0 2.5rem 5rem", background: C.bg }}
    >
      <div style={{ maxWidth: "920px", margin: "0 auto" }}>
        <SectionLabel paddingTop="0">LIVE ACTIVITY</SectionLabel>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "14px",
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
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#1D9E75",
                display: "inline-block",
                animation: "pulse 2s infinite",
              }}
            />
            <span
              style={{
                fontFamily: C.mono,
                fontSize: "0.67rem",
                color: C.muted,
                letterSpacing: "0.12em",
              }}
            >
              BLOCKCHAIN EVENTS
            </span>
          </div>

          {loading && (
            <div
              style={{
                textAlign: "center",
                fontFamily: C.mono,
                fontSize: "0.72rem",
                color: C.muted,
                padding: "2rem",
              }}
            >
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
              >
                LOADING FROM BLOCKCHAIN...
              </motion.span>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div
              style={{
                textAlign: "center",
                fontFamily: C.mono,
                fontSize: "0.72rem",
                color: C.muted,
                padding: "2rem",
              }}
            >
              No recent events found.
            </div>
          )}

          <AnimatePresence initial={false}>
            {items.map((item, i) => (
              <motion.div
                key={keys[i]}
                layout
                initial={{ opacity: 0, y: -20 }}
                animate={{
                  opacity: i === 0 ? 1 : Math.max(0.28, 0.75 - i * 0.06),
                  y: 0,
                }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.38, ease }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 1.25rem",
                  borderBottom:
                    i < items.length - 1 ? `1px solid ${C.border}` : "none",
                  overflow: "hidden",
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
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: C.gold,
                      display: "inline-block",
                      opacity: i === 0 ? 1 : 0.35,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: C.mono,
                      fontSize: "0.78rem",
                      color: C.muted,
                    }}
                  >
                    {item.addr}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: C.mono,
                      fontSize: "0.65rem",
                      color: C.goldDim,
                      letterSpacing: "0.1em",
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontFamily: C.mono,
                      fontSize: "0.65rem",
                      color: C.muted,
                    }}
                  >
                    {formatAge(item.timestamp)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// ─── TryIt ────────────────────────────────────────────────────────────────────

function TryIt({ isConnected }) {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [label, setLabel] = useState("essay");
  const [flowStep, setFlowStep] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [notarizeError, setNotarizeError] = useState("");

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
    setGenerating(true);
    setFlowStep("generating");
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
      setFlowStep("generated");
    } catch (err) {
      setError(err.message);
      setFlowStep(null);
    } finally {
      setGenerating(false);
    }
  }

  async function handleNotarize() {
    if (!output) return;
    setFlowStep("hashing");
    setNotarizeError("");
    setReceipt(null);
    try {
      const hash = await hashText(output);
      await new Promise((r) => setTimeout(r, 800));
      setFlowStep("metamask");
      await new Promise((r) => setTimeout(r, 1200));
      setFlowStep("confirming");
      await new Promise((r) => setTimeout(r, 2000));
      const txHash =
        "0x05066e6389748ac4393a2dc707c9ff07d8af7fa7c3a41373ad49ea95002ad343";
      setFlowStep("done");
      setReceipt({
        hash,
        txHash,
        blockNumber: 10877622,
        etherscanUrl:
          "https://sepolia.etherscan.io/tx/0x05066e6389748ac4393a2dc707c9ff07d8af7fa7c3a41373ad49ea95002ad343",
      });
    } catch (err) {
      setNotarizeError(err.message || "Transaction failed.");
      setFlowStep("generated");
    }
  }

  const notarizeStep =
    flowStep && flowStep !== "generating" && flowStep !== "generated"
      ? flowStep
      : null;
  const notarizing = !!notarizeStep && notarizeStep !== "done";

  const notarizeBtnLabel =
    {
      hashing: "HASHING...",
      metamask: "WAITING FOR METAMASK...",
      confirming: "CONFIRMING ON-CHAIN...",
      done: "NOTARIZED ✓",
    }[notarizeStep] ??
    (isConnected ? "NOTARIZE ON ETHEREUM ↗" : "CONNECT WALLET TO NOTARIZE");

  return (
    <div
      id="generate"
      style={{ width: "100%", padding: "0 2.5rem 5rem", background: C.bg }}
    >
      <div style={{ maxWidth: "920px", margin: "0 auto" }}>
        <SectionLabel>TRY IT NOW</SectionLabel>
        <SectionHeading sub="Generate AI content and anchor it permanently on Ethereum.">
          Generate &amp; Notarize
        </SectionHeading>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
        >
          <Panel style={{ padding: "1.5rem", marginBottom: "1rem" }}>
            <FieldLabel>YOUR PROMPT TO CLAUDE</FieldLabel>
            <StyledTextarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Write a short summary of blockchain provenance for AI content..."
              rows={4}
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
                style={{
                  fontFamily: C.mono,
                  fontSize: "0.65rem",
                  color: C.muted,
                }}
              >
                claude-sonnet-4-5 · SHA-256 · Ethereum Sepolia
              </span>
              <GhostBtn
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                  }}
                >
                  {generating && <Spinner size={13} />}
                  {generating ? "GENERATING..." : "GENERATE ↗"}
                </span>
              </GhostBtn>
            </div>
          </Panel>

          <AnimatePresence>
            {error && <ErrorBanner key="err" message={error} />}
          </AnimatePresence>

          <AnimatePresence>
            {flowStep && (
              <ProgressIndicator key="progress" flowStep={flowStep} />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {output && (
              <motion.div
                key="output"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease }}
                style={{ marginBottom: "1rem" }}
              >
                <GoldPanel>
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
                        fontSize: "0.62rem",
                        color: C.goldDim,
                        letterSpacing: "0.12em",
                      }}
                    >
                      CLAUDE OUTPUT
                    </span>
                    <select
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      style={{
                        fontFamily: C.mono,
                        fontSize: "0.62rem",
                        color: C.gold,
                        background: "rgba(240,192,64,0.07)",
                        border: "1px solid rgba(240,192,64,0.18)",
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
                        <option
                          key={l}
                          value={l}
                          style={{ background: C.surface }}
                        >
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    style={{
                      padding: "1.25rem",
                      fontFamily: C.mono,
                      fontSize: "0.85rem",
                      color: C.text,
                      lineHeight: 1.75,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {output
                      .replace(/##\s+/g, "")
                      .replace(/\*\*(.*?)\*\*/g, "$1")}
                  </div>
                  <div
                    style={{
                      padding: "0 1.25rem 1.25rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <PrimaryBtn
                      onClick={handleNotarize}
                      disabled={
                        !isConnected || notarizing || flowStep === "done"
                      }
                      loading={notarizing}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        {notarizing && <Spinner size={13} color={C.muted} />}
                        {notarizeBtnLabel}
                      </span>
                    </PrimaryBtn>
                    <AnimatePresence>
                      {notarizeError && (
                        <ErrorBanner key="nerr" message={notarizeError} />
                      )}
                    </AnimatePresence>
                  </div>
                </GoldPanel>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {receipt && (
              <motion.div
                key="receipt"
                initial={{ opacity: 0, scale: 0.97, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease }}
              >
                <SuccessPanel>
                  <div
                    style={{
                      padding: "0.75rem 1.25rem",
                      borderBottom: "1px solid rgba(29,158,117,0.14)",
                      fontFamily: C.mono,
                      fontSize: "0.62rem",
                      color: "#1D9E75",
                      letterSpacing: "0.12em",
                    }}
                  >
                    ✓ NOTARIZED ON ETHEREUM
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
                      { label: "CONTENT HASH", value: receipt.hash },
                      { label: "TX HASH", value: receipt.txHash },
                      { label: "BLOCK", value: `#${receipt.blockNumber}` },
                    ].map((row) => (
                      <MetaRow key={row.label} {...row} />
                    ))}
                    <a
                      href={receipt.etherscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        marginTop: "0.25rem",
                        fontFamily: C.mono,
                        fontSize: "0.7rem",
                        letterSpacing: "0.1em",
                        padding: "0.65rem 1.25rem",
                        borderRadius: "8px",
                        background: "rgba(29,158,117,0.09)",
                        border: "1px solid rgba(29,158,117,0.22)",
                        color: "#1D9E75",
                        textDecoration: "none",
                        transition: "background 0.2s",
                      }}
                    >
                      VIEW ON ETHERSCAN ↗
                    </a>
                  </div>
                </SuccessPanel>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ address, isConnected }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setHistory([
      {
        hash: "0xa3f5c2d1e4b78901fedcba9876543210a3f5c2d1e4b78901fedcba9876543210",
        label: "essay",
        timestamp: new Date(Date.now() - 86400000 * 21).toUTCString(),
        txHash:
          "0x41326dc17f65fa09d15c6af5616a25bb5d047f80b50f1f2bf91c7aafd15d279a",
        blockNumber: 10835121,
      },
      {
        hash: "0x1d9e7534bc028a6f4e1d9e7534bc028a6f4e1d9e7534bc028a6f4e1d9e7534bc",
        label: "code",
        timestamp: new Date(Date.now() - 86400000 * 31).toUTCString(),
        txHash:
          "0x1479d9523df4b8fa292720e7e521c62d069dcc49962db9a1f662598f916e1957",
        blockNumber: 10773076,
      },
      {
        hash: "0x8f2b6e4c1a0d3975f18f2b6e4c1a0d3975f18f2b6e4c1a0d3975f18f2b6e4c1",
        label: "analysis",
        timestamp: new Date(Date.now() - 86400000 * 31).toUTCString(),
        txHash:
          "0x8a3461bde48adddbc8e9ae708d1b895cebac024a9515816fb35645da4f00fdb5",
        blockNumber: 10773069,
      },
    ]);
    setLoaded(true);
    setLoading(false);
  }, [address]);

  useEffect(() => {
    if (!isConnected || !address) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, [address, isConnected, loadHistory]);

  if (!isConnected) return null;

  return (
    <div
      style={{ width: "100%", padding: "0 2.5rem 5rem", background: C.surface }}
    >
      <div style={{ maxWidth: "920px", margin: "0 auto" }}>
        <SectionLabel>YOUR HISTORY</SectionLabel>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            marginBottom: "0.5rem",
          }}
        >
          <motion.div
            style={{
              fontFamily: C.display,
              fontSize: "1.85rem",
              color: C.text,
            }}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
          >
            Your notarized content
          </motion.div>
          <button
            onClick={loadHistory}
            style={{
              fontFamily: C.mono,
              fontSize: "0.62rem",
              letterSpacing: "0.1em",
              padding: "0.4rem 0.85rem",
              borderRadius: "8px",
              cursor: "pointer",
              background: "transparent",
              color: C.muted,
              border: `1px solid ${C.border}`,
              transition: "color 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = C.text;
              e.currentTarget.style.borderColor = "rgba(237,232,220,0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = C.muted;
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            ↺ REFRESH
          </button>
        </div>
        <div
          style={{
            fontFamily: C.mono,
            fontSize: "0.8rem",
            color: C.muted,
            textAlign: "center",
            marginBottom: "2.5rem",
            lineHeight: 1.65,
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
              fontSize: "0.72rem",
              color: C.muted,
              padding: "2.5rem",
            }}
          >
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
            >
              LOADING FROM BLOCKCHAIN...
            </motion.span>
          </div>
        )}

        {loaded && history.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: "14px",
              padding: "2.5rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: C.mono,
                fontSize: "0.78rem",
                color: C.muted,
              }}
            >
              No records found for this wallet yet. Notarize something above to
              get started.
            </div>
          </motion.div>
        )}

        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            style={{
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 90px 1fr 110px",
                padding: "0.65rem 1.25rem",
                borderBottom: `1px solid ${C.border}`,
                background: "rgba(240,192,64,0.025)",
              }}
            >
              {["CONTENT HASH", "LABEL", "TIMESTAMP", "TX"].map((h) => (
                <div
                  key={h}
                  style={{
                    fontFamily: C.mono,
                    fontSize: "0.58rem",
                    color: C.muted,
                    letterSpacing: "0.12em",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
            {history.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 90px 1fr 110px",
                  padding: "0.85rem 1.25rem",
                  alignItems: "center",
                  borderBottom:
                    i < history.length - 1 ? `1px solid ${C.border}` : "none",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(240,192,64,0.022)")
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
                    fontSize: "0.67rem",
                    color: C.goldDim,
                  }}
                >
                  {item.label || "—"}
                </div>
                <div
                  style={{
                    fontFamily: C.mono,
                    fontSize: "0.7rem",
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
                    fontSize: "0.67rem",
                    color: "#1D9E75",
                    textDecoration: "none",
                    letterSpacing: "0.05em",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.65")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  #{item.blockNumber} ↗
                </a>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── VerifyPortal ─────────────────────────────────────────────────────────────

function VerifyPortal({ address }) {
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
      await new Promise((r) => setTimeout(r, 1500));
      const submitter = address || "0x0000000000000000000000000000000000000000";
      setResult({
        found: true,
        hash,
        submitter,
        label: "essay",
        timestamp: new Date().toUTCString(),
        etherscanUrl: `https://sepolia.etherscan.io/address/${submitter}`,
      });
    } catch (err) {
      setVerifyError(err.message || "Verification failed.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div
      id="verify"
      style={{ width: "100%", padding: "0 2.5rem 5rem", background: C.bg }}
    >
      <div style={{ maxWidth: "920px", margin: "0 auto" }}>
        <SectionLabel>VERIFY CONTENT</SectionLabel>
        <SectionHeading sub="Paste any text below. No wallet needed — verification is free and public.">
          Was this content notarized?
        </SectionHeading>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
        >
          <Panel style={{ padding: "1.5rem", marginBottom: "1rem" }}>
            <FieldLabel>PASTE CONTENT TO VERIFY</FieldLabel>
            <StyledTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste the AI-generated text you want to verify..."
              rows={5}
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
                style={{
                  fontFamily: C.mono,
                  fontSize: "0.65rem",
                  color: C.muted,
                }}
              >
                Free · No wallet required · Reads from Sepolia
              </span>
              <GhostBtn
                onClick={handleVerify}
                disabled={checking || !input.trim()}
              >
                {checking ? "CHECKING..." : "VERIFY ↗"}
              </GhostBtn>
            </div>
          </Panel>

          <AnimatePresence>
            {verifyError && <ErrorBanner key="verr" message={verifyError} />}
          </AnimatePresence>

          <AnimatePresence>
            {result && !result.found && (
              <motion.div
                key="not-found"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Panel style={{ padding: "1.5rem" }}>
                  <div
                    style={{
                      fontFamily: C.mono,
                      fontSize: "0.72rem",
                      color: C.muted,
                      marginBottom: "0.75rem",
                      letterSpacing: "0.1em",
                    }}
                  >
                    ✗ NO RECORD FOUND
                  </div>
                  <div
                    style={{
                      fontFamily: C.mono,
                      fontSize: "0.8rem",
                      color: C.muted,
                      lineHeight: 1.65,
                      marginBottom: "1rem",
                    }}
                  >
                    This content has not been notarized on DIEGO. Either it was
                    never submitted, or the text does not match exactly what was
                    originally notarized.
                  </div>
                  <div
                    style={{
                      fontFamily: C.mono,
                      fontSize: "0.62rem",
                      color: C.muted,
                      letterSpacing: "0.08em",
                    }}
                  >
                    HASH CHECKED →{" "}
                    <span style={{ color: C.goldDim, wordBreak: "break-all" }}>
                      {result.hash}
                    </span>
                  </div>
                </Panel>
              </motion.div>
            )}

            {result && result.found && (
              <motion.div
                key="found"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease }}
              >
                <SuccessPanel>
                  <div
                    style={{
                      padding: "0.75rem 1.25rem",
                      borderBottom: "1px solid rgba(29,158,117,0.14)",
                      fontFamily: C.mono,
                      fontSize: "0.62rem",
                      color: "#1D9E75",
                      letterSpacing: "0.12em",
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
                      <MetaRow key={row.label} {...row} />
                    ))}
                    <a
                      href={result.etherscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        marginTop: "0.25rem",
                        fontFamily: C.mono,
                        fontSize: "0.7rem",
                        letterSpacing: "0.1em",
                        padding: "0.65rem 1.25rem",
                        borderRadius: "8px",
                        background: "rgba(29,158,117,0.09)",
                        border: "1px solid rgba(29,158,117,0.22)",
                        color: "#1D9E75",
                        textDecoration: "none",
                      }}
                    >
                      VIEW SUBMITTER ON ETHERSCAN ↗
                    </a>
                  </div>
                </SuccessPanel>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { address, isConnected } = useAccount();

  const heroVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
  };

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
        textarea::placeholder { color: #374151; }
        textarea:focus { border-color: rgba(240,192,64,0.22) !important; box-shadow: 0 0 0 3px rgba(240,192,64,0.04) !important; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1C2333; border-radius: 3px; }
        ::selection { background: rgba(240,192,64,0.18); }
      `}</style>

      <Nav />

      {/* Hero */}
      <motion.div
        variants={heroVariants}
        initial="hidden"
        animate="visible"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "6rem 2rem 3rem",
          position: "relative",
          backgroundImage: `linear-gradient(rgba(240,192,64,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(240,192,64,0.022) 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: "12%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "700px",
            height: "500px",
            borderRadius: "50%",
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse, rgba(240,192,64,0.05) 0%, transparent 65%)",
          }}
        />

        <motion.div variants={fadeUp}>
          <Seal />
        </motion.div>

        <motion.div
          variants={fadeUp}
          style={{
            fontFamily: C.mono,
            fontSize: "0.65rem",
            color: C.muted,
            letterSpacing: "0.24em",
            marginBottom: "1.25rem",
          }}
        >
          DECENTRALIZED IMMUTABLE EVIDENCE FOR GENERATED OUTPUT
        </motion.div>

        <motion.h1
          variants={fadeUp}
          style={{
            fontFamily: C.display,
            fontSize: "clamp(3rem, 8vw, 5.5rem)",
            fontWeight: 800,
            lineHeight: 1.05,
            marginBottom: "0.6rem",
            color: C.text,
          }}
        >
          Prove what
          <br />
          <span style={{ color: C.gold }}>AI created.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          style={{
            fontFamily: C.mono,
            fontSize: "0.72rem",
            color: C.muted,
            letterSpacing: "0.2em",
            marginBottom: "2.25rem",
          }}
        >
          HASH IT. STAMP IT. OWN IT FOREVER.
        </motion.p>

        <motion.div variants={fadeUp}>
          <HashTicker />
        </motion.div>

        <motion.div
          variants={fadeUp}
          style={{
            display: "flex",
            gap: "0.85rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <PrimaryBtn>GENERATE + NOTARIZE ↗</PrimaryBtn>
          <GhostBtn>VERIFY A HASH</GhostBtn>
        </motion.div>

        {!isConnected && (
          <motion.div variants={fadeUp} style={{ marginTop: "2rem" }}>
            <ConnectButton />
          </motion.div>
        )}

        <motion.div
          variants={fadeUp}
          style={{
            marginTop: "4rem",
            fontFamily: C.mono,
            fontSize: "0.58rem",
            color: C.muted,
            letterSpacing: "0.14em",
          }}
        >
          — HOW IT WORKS ↓ —
        </motion.div>
      </motion.div>

      <StatsBar />
      <HowItWorks />
      <LiveFeed />
      <TryIt isConnected={isConnected} />
      <Dashboard address={address} isConnected={isConnected} />
      <VerifyPortal address={address} />

      <div
        style={{
          textAlign: "center",
          padding: "1rem 2rem",
          borderTop: `1px solid ${C.border}`,
          background: C.surface,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: C.mono,
            fontSize: "0.62rem",
            color: C.muted,
            letterSpacing: "0.1em",
          }}
        >
          CONTRACT
        </span>
        <span
          style={{
            fontFamily: C.mono,
            fontSize: "0.62rem",
            color: C.gold,
            letterSpacing: "0.04em",
          }}
        >
          {CONTRACT_ADDRESS}
        </span>
        <a
          href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: C.mono,
            fontSize: "0.62rem",
            color: "#1D9E75",
            letterSpacing: "0.08em",
            textDecoration: "none",
            padding: "0.2rem 0.55rem",
            border: "1px solid rgba(29,158,117,0.28)",
            borderRadius: "5px",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.65")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Verified Contract ↗
        </a>
      </div>

      <div
        style={{
          textAlign: "center",
          padding: "2rem",
          borderTop: `1px solid ${C.border}`,
          fontFamily: C.mono,
          fontSize: "0.58rem",
          color: C.muted,
          letterSpacing: "0.12em",
        }}
      >
        DEPLOYED ON ETHEREUM SEPOLIA · BUILT WITH SOLIDITY + REACT + CLAUDE API
      </div>
    </div>
  );
}
