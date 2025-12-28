const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const promptEl = document.getElementById("prompt");
const startBtn = document.getElementById("startBtn");

let round = 0;
let target = 0;
let simonSays = true;

let roundStart = 0;
let holdStart = null;

let responseTime = 2000;
const holdTime = 600;
const graceTime = 1500;

let gameActive = false;

// Resize canvas
function resize() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}

// Count fingers
function countFingers(lm) {
  let count = 0;

  const fingers = [
    [8, 6],
    [12, 10],
    [16, 14],
    [20, 18]
  ];

  for (const [tip, joint] of fingers) {
    if (lm[tip].y < lm[joint].y) count++;
  }

  // Thumb
  if (lm[4].x > lm[3].x) count++;

  return count;
}

// Start round
function startRound() {
  round++;
  target = Math.floor(Math.random() * 6);
  simonSays = Math.random() < 0.65;

  roundStart = Date.now();
  holdStart = null;
  gameActive = true;

  promptEl.textContent = simonSays
    ? `Simon says show ${target}`
    : `Show ${target}`;
}

// End game
function endGame(reason) {
  gameActive = false;
  promptEl.textContent = `Game Over (${reason}) | Round ${round}`;
}

// Next round
function nextRound() {
  gameActive = false;
  responseTime = Math.max(900, responseTime - 100);
  promptEl.textContent = "Correct!";
  setTimeout(startRound, 800);
}

// Check input
function checkInput(fingers) {
  if (!gameActive) return;

  const now = Date.now();

  // Grace period
  if (now - roundStart < graceTime) return;

  // Simon did NOT say
  if (!simonSays) {
    // If player messes up
    if (fingers === target) {
      endGame("Simon didn't say");
      return;
    }

    // If player survives long enough → next round
    if (now - roundStart > graceTime + responseTime) {
      nextRound();
    }
    return;
  }

  // Simon DID say
  if (fingers === target) {
    if (!holdStart) holdStart = now;
    if (now - holdStart >= holdTime) {
      nextRound();
    }
  } else {
    holdStart = null;
    if (now - roundStart > graceTime + responseTime) {
      endGame("Too slow");
    }
  }
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

  if (!results.multiHandLandmarks.length) return;

  const lm = results.multiHandLandmarks[0];
  drawConnectors(ctx, lm, HAND_CONNECTIONS, { lineWidth: 3 });
  drawLandmarks(ctx, lm, { radius: 4 });

  const fingers = countFingers(lm);
  checkInput(fingers);
});

// Camera
const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 1280,
  height: 720,
});

camera.start();

// Start button
startBtn.onclick = () => {
  round = 0;
  responseTime = 2000;
  startRound();
};
