// src/components/PunchInModal.jsx
import React, { useEffect, useState } from "react";
import API from "../api/client";

// small helpers from the previous version (public IP, webrtc local IPs, ip heuristics)
// (keep implementations same as earlier snippet)
async function fetchPublicIP() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    if (!res.ok) throw new Error("ipify error");
    const js = await res.json();
    return js.ip;
  } catch (err) {
    console.warn("fetchPublicIP failed:", err);
    return null;
  }
}

function getLocalIPs(timeout = 3000) {
  return new Promise((resolve) => {
    const ips = new Set();
    const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    if (!RTCPeerConnection) {
      resolve([]);
      return;
    }

    const pc = new RTCPeerConnection({ iceServers: [] });
    try { pc.createDataChannel(""); } catch (e) {}

    pc.onicecandidate = (evt) => {
      if (!evt || !evt.candidate) return;
      const parts = evt.candidate.candidate.split(" ");
      parts.forEach((p) => {
        const maybe = p.match(/(\d{1,3}\.){3}\d{1,3}/);
        if (maybe) ips.add(maybe[0]);
      });
    };

    pc.createOffer()
      .then((sdp) => pc.setLocalDescription(sdp))
      .catch((err) => console.warn("webrtc createOffer error", err));

    setTimeout(() => {
      try { pc.close && pc.close(); } catch (e) {}
      resolve(Array.from(ips));
    }, timeout);
  });
}

function isPrivateIP(ip) {
  if (!ip) return false;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  const m = ip.match(/^172\.(\d{1,3})\./);
  if (m) {
    const n = parseInt(m[1], 10);
    return n >= 16 && n <= 31;
  }
  return false;
}

function estimateGatewayFromLocalIP(ip) {
  if (!ip) return null;
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  parts[3] = "1";
  return parts.join(".");
}

export default function PunchInModal({
  buttonText = "Punch In",
  ssidPrefill = "",
  // new props:
  initialOpen = false, // if true -> modal opens on mount
  onClose = null, // callback when modal closes
}) {
  const [open, setOpen] = useState(Boolean(initialOpen));
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [note, setNote] = useState("");
  const [ssid, setSsid] = useState(ssidPrefill);
  const [ipInfo, setIpInfo] = useState({ publicIp: null, localIps: [] });
  const [gatewayEstimate, setGatewayEstimate] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // if initialOpen toggles to true after mount, open modal
    if (initialOpen) {
      openAndPrepare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOpen]);

  async function openAndPrepare() {
    setMessage("");
    setError("");
    setIpInfo({ publicIp: null, localIps: [] });
    setGatewayEstimate("");
    setLat("");
    setLng("");
    setOpen(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(String(pos.coords.latitude));
          setLng(String(pos.coords.longitude));
        },
        (err) => {
          console.warn("Geolocation denied or failed:", err);
        },
        { timeout: 10000 }
      );
    }

    try {
      const [pub, locals] = await Promise.all([fetchPublicIP(), getLocalIPs()]);
      setIpInfo({ publicIp: pub, localIps: locals || [] });
      const privateLocal = (locals || []).find((ip) => isPrivateIP(ip));
      const gateway = privateLocal ? estimateGatewayFromLocalIP(privateLocal) : pub || "";
      setGatewayEstimate(gateway);
    } catch (err) {
      console.warn("ip fetch error", err);
    }
  }

  async function sendPunchIn() {
    setLoading(true);
    setError("");
    setMessage("");

    const ipToSend = gatewayEstimate || ipInfo.publicIp || "";

    const payload = {
      latitude: lat ? parseFloat(lat) : undefined,
      longitude: lng ? parseFloat(lng) : undefined,
      ssid: ssid || "",
      note: note || "",
      ip: ipToSend || "",
    };

    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    try {
      const res = await API.post("/attendance/punch-in", payload);
      const data = res.data || {};
      setMessage(data.message || "Punch-in successful");
      setTimeout(() => {
        setOpen(false);
        if (typeof onClose === "function") onClose();
      }, 900);
    } catch (err) {
      console.error("punch-in error", err);
      if (err?.response?.data?.detail) setError(err.response.data.detail);
      else setError("Failed to punch in. Check console for details.");
    } finally {
      setLoading(false);
    }
  }

  // allow external toggling (still keep internal button for backwards compatibility)
  return (
    <>
      {/* Internal button (kept for compatibility; hidden if parent controls opening via other UI) */}
      <button
        onClick={openAndPrepare}
        className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm hidden"
        aria-hidden="true"
        id="punchin-internal-button"
      >
        {buttonText}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setOpen(false); if (typeof onClose === "function") onClose(); }} />

          <div className="relative z-10 w-full max-w-md bg-white/5 rounded-lg border border-white/8 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Punch In</h3>
              <button onClick={() => { setOpen(false); if (typeof onClose === "function") onClose(); }} className="text-gray-300 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-gray-300">Latitude</label>
                <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" className="w-full bg-white/5 rounded px-3 py-2 text-white text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-300">Longitude</label>
                <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude" className="w-full bg-white/5 rounded px-3 py-2 text-white text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-300">SSID (optional)</label>
                <input value={ssid} onChange={(e) => setSsid(e.target.value)} placeholder="WiFi SSID" className="w-full bg-white/5 rounded px-3 py-2 text-white text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-300">Note (optional)</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" className="w-full bg-white/5 rounded px-3 py-2 text-white text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-300">Estimated Gateway / IP</label>
                <div className="flex gap-2 items-center">
                  <input value={gatewayEstimate || ipInfo.publicIp || ""} onChange={(e) => setGatewayEstimate(e.target.value)} placeholder="Gateway or IP" className="flex-1 bg-white/5 rounded px-3 py-2 text-white text-sm" />
                  <button onClick={async () => {
                      setIpInfo({ publicIp: null, localIps: [] });
                      const pub = await fetchPublicIP();
                      const local = await getLocalIPs();
                      setIpInfo({ publicIp: pub, localIps: local });
                      const privateLocal = (local || []).find((ip) => isPrivateIP(ip));
                      const gateway = privateLocal ? estimateGatewayFromLocalIP(privateLocal) : pub || "";
                      setGatewayEstimate(gateway);
                    }} className="px-2 py-1 rounded bg-white/6 hover:bg-white/8 text-xs">Refresh IPs</button>
                </div>

                <div className="mt-2 text-xs text-gray-400">Public IP: <span className="text-gray-200">{ipInfo.publicIp || "—"}</span></div>
                <div className="mt-1 text-xs text-gray-400">Local IPs: <span className="text-gray-200">{(ipInfo.localIps || []).join(", ") || "—"}</span></div>
                <div className="mt-1 text-xs text-yellow-300">Note: browser cannot always read SSID/gateway; gateway here is an estimate.</div>
              </div>

              {message && <div className="text-sm text-green-300">{message}</div>}
              {error && <div className="text-sm text-red-300">{error}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { setOpen(false); if (typeof onClose === "function") onClose(); }} className="px-3 py-2 rounded bg-white/6 hover:bg-white/8 text-sm">Cancel</button>
                <button onClick={sendPunchIn} disabled={loading} className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-sm disabled:opacity-60">
                  {loading ? "Sending..." : "Send Punch-In"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
