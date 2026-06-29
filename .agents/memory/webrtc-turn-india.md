---
name: WebRTC TURN servers for India
description: Indian mobile carriers use carrier-grade NAT; STUN alone cannot punch through — TURN servers required for WebRTC video calls to work on Jio/Airtel/BSNL.
---

## Rule
Always include TURN servers alongside STUN in `RTCPeerConnection` `iceServers`. STUN alone will work only on home broadband or Wi-Fi with a simple NAT; it fails on symmetric/carrier-grade NAT used by every major Indian mobile carrier.

**Why:** Jio, Airtel, and BSNL use CGNAT (carrier-grade NAT) on their 4G/5G networks. STUN can discover a public IP but cannot punch through symmetric NAT. TURN acts as a relay, guaranteeing connectivity regardless of NAT type.

**How to apply:** Use the Open Relay Project (completely free, no account, no API key):

```ts
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
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
```

These credentials are publicly documented by the Open Relay Project — they are not secret.
