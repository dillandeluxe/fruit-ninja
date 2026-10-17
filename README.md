# 🍉 Webcam Fruit Ninja (Virtual Camera Game)

A high-performance, real-time computer vision game inspired by Fruit Ninja. Slice flying fruits using your bare hands tracked directly through your webcam with Google MediaPipe AI, and broadcast your gameplay live as a **Virtual Webcam** into **Zoom**, **Discord**, **Google Meet**, and **Microsoft Teams**!

---

## ⚡ Features

- **🦾 Bare-Hand AI Vision Tracking**: Powered by Google MediaPipe Tasks Vision (`numHands: 4`, WASM + GPU accelerated). No controllers or wearables needed—just wave your hands in front of the webcam!
- **⚔️ 2-Player Versus Duel Mode**:
  - Automatically detects when **two players** are in frame (Left Side: Player 1 / Crimson Samurai, Right Side: Player 2 / Azure Ninja).
  - 60-second head-to-head showdown with dynamic score tug-of-war bar, contested center fruit tossups, and foul penalties for slicing bombs!
- **⚔️ Dual-Wielding Support**: Each player can raise both hands to slice with dual glowing katanas simultaneously (up to 4 hands tracked at 60 FPS).
- **✨ Juicy Blade Trails & Splines**: Smooth Catmull-Rom spline curves with glowing neon auras, dynamic blade thickness scaled by swing velocity, and spark particles.
- **🍉 Realistic Vector Fruit Physics**: Parabolic gravity trajectory, dynamic angular tumbling, and clean 2-half splitting with visible fruit pulp cross-sections (Watermelon, Apple, Orange, Banana, Strawberry, Pineapple, and Dragonfruit).
- **💥 Screen Splatters & Screen Shake**: Slicing fruits stamps dripping juice decals directly onto your camera lens that slowly slide and fade.
- **💣 Bombs & Hazards**: Black cast-iron bombs with sizzling spark fuses. Slicing triggers a screen-shaking explosion.
- **🔥 Combos & Scores**: Slice 3+ fruits in a single swipe to trigger explosive combos (*3x COMBO!*, *4x MEGA!*, *5x BLITZ!*).
- **🔊 Procedural Web Audio Engine**: Zero external audio downloads needed—features procedurally synthesized blade whooshes, snappy melon slicing snaps, juicy squishes, bomb explosions, and combo chimes.
- **📹 Virtual Camera & Streamer Ready**:
  - One-click **OBS Studio** Virtual Camera integration.
  - Dedicated **Clean Stream Mode** (URL: `http://localhost:5173/?stream=true`) that strips away UI menus so it looks like a clean video filter in meetings.
  - Video background filters: Natural, Vibrant, Cyberpunk Neon, Comic.
  - Horizontal camera mirror toggle for natural selfie-view reflection.
- **🖱️ Mouse / Touch Fallback**: Automatic seamless fallback to mouse or touchscreen controls if camera permissions are unavailable.

---

## 🚀 Quick Start

### 1. Start the Dev Server
From the project directory:
```bash
npm run dev
```
Open **`http://localhost:5173`** in Google Chrome, Brave, Arc, or Safari.

### 2. Allow Camera Access
When prompted, click **Allow** for webcam permissions. Stand 1.5–3 feet back so your hands are clearly visible in the camera frame.

### 3. Start Slicing!
- Swipe your index finger or whole hand across the screen to slice fruits.
- Make deliberate, swift swipes! Slow movements won't cut, just like a real ninja blade.

---

## 🎮 Game Modes

1. **Classic Dojo**:
   - 3 Strikes (missed fruits count as an X mark).
   - Bombs are lethal (instant Game Over).
   - Speed and fruit density increase as score rises.
2. **Zen Sanctuary**:
   - 90-second countdown timer.
   - Zero bombs and zero strikes—pure slicing flow state.
3. **Meeting Filter**:
   - Infinite casual slicing designed to play while chatting in meetings.
   - Bombs deduct 10 points instead of ending the session.
   - Minimalist score overlay.
4. **⚔️ 2-Player Duel**:
   - 60-second head-to-head battle between two people standing on the left and right sides of the webcam!
   - Real-time score tug-of-war bar and showdown match statistics.

---

## 🎥 Virtual Webcam Setup (Zoom, Discord, Meet)

Follow these steps to make your friends or colleagues see you playing Fruit Ninja live on your video feed:

### Method: OBS Studio Virtual Camera (Recommended & Free)
1. Download and open [OBS Studio](https://obsproject.com) (free for macOS, Windows, Linux).
2. In the **Sources** dock at the bottom of OBS, click **`+`**:
   - **Option A (Browser Source)**: Choose **Browser**, enter URL `http://localhost:5173/?stream=true`, and set width to `1280` and height to `720`.
   - **Option B (Window Capture)**: Choose **Window Capture** and select your browser tab running the game.
3. In the bottom-right **Controls** dock of OBS, click **"Start Virtual Camera"**.
4. Open your meeting app:
   - **Zoom**: Settings > Video > Camera > Select **OBS Virtual Camera**.
   - **Discord**: Settings > Voice & Video > Camera > Select **OBS Virtual Camera**.
   - **Google Meet**: Settings > Video > Camera > Select **OBS Virtual Camera**.
   - **Teams / FaceTime**: Select **OBS Virtual Camera**.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| **S** | Toggle Clean Stream View (Broadcaster overlay) |
| **M** | Toggle Mute Audio |
| **R** or **Space** | Restart / Play Again |
| **Esc** | Close any open modal dialog |

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Computer Vision**: Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`, up to 4 hands)
- **Graphics**: High-performance HTML5 2D Canvas rendering at 60 FPS
- **Audio**: Procedural Web Audio API synthesizer
- **Icons**: Lucide React
