const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const numberEl = document.getElementById("number");
const statusEl = document.getElementById("status");

function resize() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}

// Count fingers using landmarks
function countFingers(lm) {
  let count = 0;

  // Index, middle, ring, pinky
  const fingers = [
    [8, 6],
    [12, 10],
    [16, 14],
    [20, 18]
  ];

  for (const [tip, joint] of fingers) {
    if (lm[tip].y < lm[joint].y) count++;
  }

  // Thumb (x direction)
  if (lm[4].x > lm[3].x) count++;

  return count;
}

// MediaPipe Hands
const hands = new Hands({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6,
});

hands.onResults((results) => {
  if (!video.videoWidth) return;
  resize();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (!results.multiHandLandmarks.length) {
    numberEl.textContent = "–";
    statusEl.textContent = "Show your hand";
    return;
  }

  const lm = results.multiHandLandmarks[0];

  drawConnectors(ctx, lm, HAND_CONNECTIONS, { lineWidth: 3 });
  drawLandmarks(ctx, lm, { radius: 4 });

  const fingersUp = countFingers(lm);
  numberEl.textContent = fingersUp;
  statusEl.textContent = "Fingers detected";
});

// Start camera
const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 1280,
  height: 720,
});

camera.start();
