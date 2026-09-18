// "Proietta su un altro dispositivo": mirrors the 3D view onto a second
// device (a monitor/PC browser, or another phone running this app) on the
// same local network, using WebRTC peer-to-peer video. There is no signaling
// server: both sides gather only local-network ICE candidates (host +
// LAN-reflexive, no STUN/TURN needed) and the resulting SDP is exchanged
// manually as a short text code, moved between devices however the user
// likes (copy/paste, the OS share sheet, ...).

function encodeDescription(description) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(description))));
}

function decodeDescription(code) {
  return JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
}

// Waits for full ICE gathering so the local description's SDP carries every
// discovered candidate — this "paste a code" pairing has no channel to
// trickle candidates in afterwards. Times out and proceeds anyway so a
// device with no reachable network interface doesn't hang forever.
function waitForIceGathering(pc, timeoutMs = 4000) {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(finish, timeoutMs);
    function finish() {
      clearTimeout(timer);
      pc.removeEventListener("icegatheringstatechange", check);
      resolve();
    }
    function check() {
      if (pc.iceGatheringState === "complete") finish();
    }
    pc.addEventListener("icegatheringstatechange", check);
  });
}

export function isCastSupported() {
  return typeof RTCPeerConnection !== "undefined";
}

// The device showing the model: captures its own viewer canvas as a video
// stream and offers it to the receiving device.
export function createCastSender(canvas, { onStateChange } = {}) {
  const pc = new RTCPeerConnection();
  const stream = canvas.captureStream(24);
  for (const track of stream.getTracks()) pc.addTrack(track, stream);
  pc.onconnectionstatechange = () => onStateChange?.(pc.connectionState);

  return {
    async createOfferCode() {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceGathering(pc);
      return encodeDescription(pc.localDescription);
    },
    async applyAnswerCode(code) {
      await pc.setRemoteDescription(decodeDescription(code));
    },
    close() {
      stream.getTracks().forEach((track) => track.stop());
      pc.close();
    },
  };
}

// The device acting as the external monitor: accepts an offer and exposes
// the incoming stream via onTrack for a <video> element to display.
export function createCastReceiver({ onTrack, onStateChange } = {}) {
  const pc = new RTCPeerConnection();
  pc.ontrack = (event) => onTrack?.(event.streams[0]);
  pc.onconnectionstatechange = () => onStateChange?.(pc.connectionState);

  return {
    async createAnswerCode(offerCode) {
      await pc.setRemoteDescription(decodeDescription(offerCode));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitForIceGathering(pc);
      return encodeDescription(pc.localDescription);
    },
    close() {
      pc.close();
    },
  };
}
