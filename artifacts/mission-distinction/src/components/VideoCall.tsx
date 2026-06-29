import React, { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { Mic, MicOff, Video, VideoOff, Phone, Users, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  // Open Relay Project — free TURN servers, required on Indian mobile carrier NAT
  // (Jio, Airtel, BSNL use carrier-grade NAT; STUN alone cannot punch through).
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turns:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

interface Participant {
  socketId: string;
  name: string;
  stream: MediaStream | null;
}

interface Props {
  roomKey: string;
  title: string;
  onClose: () => void;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function RemoteVideo({ participant }: { participant: Participant }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);
  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center min-h-[140px]">
      {participant.stream ? (
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/30 flex items-center justify-center">
            <span className="text-white font-bold text-xl">{participant.name.charAt(0).toUpperCase()}</span>
          </div>
          <span className="text-white/50 text-xs">Connecting…</span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[11px] font-medium">
        {participant.name.split(" ")[0]}
      </div>
    </div>
  );
}

export default function VideoCall({ roomKey, title, onClose }: Props) {
  const { token } = useAuth();
  const [participants, setParticipants] = useState<Record<string, Participant>>({});
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [localStreamReady, setLocalStreamReady] = useState(false);
  const [status, setStatus] = useState<"connecting" | "live" | "error">("connecting");
  const [errorMsg, setErrorMsg] = useState("");
  const [callDuration, setCallDuration] = useState(0);

  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConns = useRef<Record<string, RTCPeerConnection>>({});
  const socketRef = useRef<Socket | null>(null);
  const pendingCandidates = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const startTimeRef = useRef<number>(Date.now());
  const mountedRef = useRef(true);

  useEffect(() => {
    const timer = setInterval(() => setCallDuration(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const createPeer = useCallback((socketId: string, name: string, socket: Socket): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConns.current[socketId] = pc;

    localStreamRef.current?.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit("call:ice", { to: socketId, candidate: candidate.toJSON() });
    };

    pc.ontrack = (ev) => {
      const stream = ev.streams[0];
      if (!stream) return;
      setParticipants(prev => ({
        ...prev,
        [socketId]: { socketId, name, stream },
      }));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        pc.close();
        delete peerConns.current[socketId];
        setParticipants(prev => { const n = { ...prev }; delete n[socketId]; return n; });
      }
    };

    return pc;
  }, []);

  const removePeer = useCallback((socketId: string) => {
    peerConns.current[socketId]?.close();
    delete peerConns.current[socketId];
    setParticipants(prev => { const n = { ...prev }; delete n[socketId]; return n; });
  }, []);

  const flushCandidates = useCallback(async (socketId: string, pc: RTCPeerConnection) => {
    for (const c of (pendingCandidates.current[socketId] ?? [])) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
    }
    delete pendingCandidates.current[socketId];
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!token) return;

    async function start() {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          if (mountedRef.current) setCamOn(false);
        } catch {
          if (mountedRef.current) { setStatus("error"); setErrorMsg("Could not access camera or microphone. Please allow permissions and try again."); }
          return;
        }
      }

      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.onloadedmetadata = () => {
          if (mountedRef.current) setLocalStreamReady(true);
        };
      }

      const socket = io(window.location.origin, {
        path: `${BASE}/api/socket.io/`,
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: false,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        if (!mountedRef.current) return;
        socket.emit("call:join", { roomKey });
        startTimeRef.current = Date.now();
        setCallDuration(0);
        setStatus("live");
      });

      socket.on("connect_error", () => {
        if (mountedRef.current) { setStatus("error"); setErrorMsg("Could not connect to call server. Please try again."); }
      });

      // List of people already in the call — we initiate offers to them
      socket.on("call:participants", async ({ participants: existing }: { participants: { socketId: string; name: string }[] }) => {
        if (!mountedRef.current) return;
        for (const p of existing) {
          setParticipants(prev => ({ ...prev, [p.socketId]: { socketId: p.socketId, name: p.name, stream: null } }));
          const pc = createPeer(p.socketId, p.name, socket);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("call:offer", { to: p.socketId, offer });
          } catch { removePeer(p.socketId); }
        }
      });

      // Someone new joined — they will send us an offer
      socket.on("call:user-joined", ({ name, socketId }: { userId: number; name: string; socketId: string }) => {
        if (!mountedRef.current) return;
        setParticipants(prev => ({ ...prev, [socketId]: prev[socketId] ?? { socketId, name, stream: null } }));
      });

      // We received an offer — send back an answer
      socket.on("call:offer", async ({ from, fromName, offer }: { from: string; fromId: number; fromName: string; offer: RTCSessionDescriptionInit }) => {
        if (!mountedRef.current) return;
        setParticipants(prev => ({ ...prev, [from]: prev[from] ?? { socketId: from, name: fromName, stream: null } }));
        const pc = createPeer(from, fromName, socket);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await flushCandidates(from, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("call:answer", { to: from, answer });
        } catch { removePeer(from); }
      });

      // We received an answer to our offer
      socket.on("call:answer", async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
        if (!mountedRef.current) return;
        const pc = peerConns.current[from];
        if (!pc) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await flushCandidates(from, pc);
        } catch {}
      });

      // ICE candidate relay
      socket.on("call:ice", async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
        if (!mountedRef.current) return;
        const pc = peerConns.current[from];
        if (!pc || !pc.remoteDescription) {
          pendingCandidates.current[from] = [...(pendingCandidates.current[from] ?? []), candidate];
          return;
        }
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      });

      // Peer left
      socket.on("call:user-left", ({ socketId }: { socketId: string }) => {
        if (mountedRef.current) removePeer(socketId);
      });
    }

    start().catch(() => {
      if (mountedRef.current) { setStatus("error"); setErrorMsg("Failed to start video call."); }
    });

    return () => {
      mountedRef.current = false;
      Object.values(peerConns.current).forEach(pc => pc.close());
      peerConns.current = {};
      pendingCandidates.current = {};
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      socketRef.current?.emit("call:leave", { roomKey });
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [token, roomKey, createPeer, removePeer, flushCandidates]);

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicOn(p => !p);
  };

  const toggleCam = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOn(p => !p);
    if (localVideoRef.current && localStreamRef.current) localVideoRef.current.srcObject = localStreamRef.current;
  };

  if (status === "error") {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-white font-semibold text-center max-w-xs">{errorMsg}</p>
        <Button variant="destructive" onClick={onClose}>Close</Button>
      </div>
    );
  }

  const allParticipants = Object.values(participants);
  const remoteCount = allParticipants.length;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none" style={{ touchAction: "none" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/70 backdrop-blur-sm shrink-0 safe-area-top">
        <div>
          <p className="text-white font-semibold text-sm leading-tight">{title}</p>
          <p className="text-white/50 text-xs mt-0.5">
            {status === "connecting"
              ? "Connecting…"
              : `${formatDuration(callDuration)} · ${remoteCount + 1} participant${remoteCount + 1 !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1">
          <Users size={12} className="text-white/70" />
          <span className="text-white/70 text-xs font-medium">{remoteCount + 1}</span>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative overflow-hidden bg-black isolate">
        {status === "connecting" ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-white/60 text-sm">Starting call…</p>
          </div>
        ) : remoteCount === 0 ? (
          /* Waiting for others */
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Users size={36} className="text-primary" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-base">Waiting for others…</p>
              <p className="text-white/40 text-sm mt-1">Share this study group with your batchmates to invite them</p>
            </div>
          </div>
        ) : (
          /* Remote video grid */
          <div
            className={`grid h-full gap-1 p-1 ${
              remoteCount === 1 ? "grid-cols-1" :
              remoteCount <= 4 ? "grid-cols-2" :
              "grid-cols-2 sm:grid-cols-3"
            }`}
          >
            {allParticipants.map(p => (
              <RemoteVideo key={p.socketId} participant={p} />
            ))}
          </div>
        )}

        {/* Local video — picture-in-picture */}
        {/* The video element is always in the DOM so the ref can receive srcObject,
            but we hide the container until the stream is actually rendering to prevent
            the native iOS video layer from punching through and showing the background. */}
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          style={{ display: "none" }}
        />
        <div
          className="absolute bottom-4 right-3 w-24 h-36 sm:w-32 sm:h-44 rounded-2xl overflow-hidden border-2 border-white/25 shadow-2xl bg-gray-900"
          style={{ transform: "translateZ(0)", WebkitTransform: "translateZ(0)" }}
        >
          {camOn && localStreamReady ? (
            <video
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
              ref={el => { if (el && localStreamRef.current) el.srcObject = localStreamRef.current; }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gray-800">
              {camOn ? (
                <Loader2 size={16} className="text-white/30 animate-spin" />
              ) : (
                <>
                  <VideoOff size={18} className="text-white/40" />
                  <span className="text-white/40 text-[10px]">Camera off</span>
                </>
              )}
            </div>
          )}
          <div className="absolute bottom-1.5 inset-x-0 text-center text-[10px] text-white/60 font-medium">You</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-5 py-6 bg-black/70 backdrop-blur-sm shrink-0">
        <button
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            micOn ? "bg-white/15 hover:bg-white/25 active:scale-95" : "bg-red-500 hover:bg-red-600 active:scale-95"
          }`}
          title={micOn ? "Mute" : "Unmute"}
        >
          {micOn ? <Mic size={22} className="text-white" /> : <MicOff size={22} className="text-white" />}
        </button>

        <button
          onClick={toggleCam}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            camOn ? "bg-white/15 hover:bg-white/25 active:scale-95" : "bg-red-500 hover:bg-red-600 active:scale-95"
          }`}
          title={camOn ? "Turn off camera" : "Turn on camera"}
        >
          {camOn ? <Video size={22} className="text-white" /> : <VideoOff size={22} className="text-white" />}
        </button>

        {/* End call */}
        <button
          onClick={onClose}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 flex items-center justify-center transition-all shadow-xl"
          title="End call"
        >
          <Phone size={26} className="text-white" style={{ transform: "rotate(135deg)" }} />
        </button>
      </div>
    </div>
  );
}
