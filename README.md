
# 🎸 Kessoku Beat - Bocchi Rhythm Game

  

> "If I play the guitar enough, maybe even I can shine..." --- Bocchi

  

A modern, modular, and stylized web **Rhythm Game** inspired by the anime **Bocchi the Rock!**.

Built entirely with **Vanilla JavaScript**, focusing on clean

architecture, performance, and visual polish.

  

![Project Status](https://img.shields.io/badge/Status-Version_v1.2.0-pink)

![Tech](https://img.shields.io/badge/Tech-HTML5_%7C_CSS3_%7C_ES6+-blue)

![License](https://img.shields.io/badge/License-MIT-green)

  

------------------------------------------------------------------------

  

## ✨ Features

### 🆕 New in v1.2.0
- **Overhauled Results Screen:** Complete visual redesign with glassmorphism UI.
- **Ranking System:** Calculates accuracy (SS, S, A, B, C) and displays dynamic character stickers based on performance.
- **Fixed Scoring Logic:** "Max Combo" is now tracked correctly even if the combo breaks at the end. Accuracy is calculated based on note hits (weighted) rather than total score.

### 🆕 New in v1.1.0
- **Enhanced Visual Feedback:** New explosive animations for "PERFECT" hits and a shaking effect for "MISS". The Combo counter now pulses on every hit.
- **Refined Gameplay Feel:** Adjusted hit windows (250ms) and "Perfect" timing (80ms) to make the game feel more responsive, fair, and fun.
- **Smart Game Loop:** The game now correctly detects the end of the song (or the last note) to trigger the Results screen automatically.

### 🚀 Core Features
- **Custom Rhythm Engine:** Precise timing system based on `AudioContext` (not frame-dependent) for accurate gameplay.
- **JSON Chart System:** Songs and note patterns are loaded via external JSON files.
- **In-Game Chart Editor:** Create your own charts while playing! (Press `E` in the selection screen).
- **Performance Optimized:**
  - **Object Pooling:** Recycles DOM elements to ensure smooth 60/144 FPS without garbage collection stutters.
  - **Low Spec Mode:** Disables 3D perspective and heavy glow effects for older hardware.
  - **GPU Acceleration:** Uses `translate3d` for smooth note movement.
- **Reactive UI:** SPA (Single Page Application) architecture with cinematic transitions and glassmorphism.
- **Dynamic Audio:** Independent volume control (BGM/SFX) and interactive sound effects.

  

------------------------------------------------------------------------

  

## 🎮 Controls

  

### **Menu**

  

- Use the mouse.

  

### **Selection**

  

- Choose a track.

- Press **E** to open the **Chart Editor**.

  

### **Gameplay**

  

- Press **D, F, J, K** as notes cross the hit line.

-  **D / F** → Left notes\

-  **J / K** → Right notes

  

------------------------------------------------------------------------

  

## 🛠️ Installation & Setup

  

This project uses **ES Modules**, so it **won't run** by double-clicking `index.html`.\

A local server is required.

  

### **Option 1: VS Code (Recommended)**

  

1. Install the **Live Server** extension.\

2. Right-click `index.html`.\

3. Click **Open with Live Server**.

  

### **Option 2: Python**

  

``` bash

python  -m  http.server

```

  

Then open **http://localhost:8000** in your browser.

  

------------------------------------------------------------------------

  

## 📂 Project Architecture

  

kessoku-beat/

│

├── assets/ # Images, audio files, and charts (JSON)

├── src/

│ ├── css/ # Modular styles

│ └── js/ # Modular logic

│ ├── audioEngine.js # Web Audio API wrapper

│ ├── noteSpawner.js # Note pooling and logic

│ ├── router.js # SPA Router

│ ├── storage.js # LocalStorage wrapper

│ └── screens/ # Individual screen logic

└── index.html # Entry point

  

------------------------------------------------------------------------

  

## 🎵 How to Add New Songs

  

1. Put the `.mp3` in **assets/audio/** and the cover in **assets/images/**.\

2. Create an empty chart file in **assets/charts/** (e.g., `song4.json`).\

3. Add the song to **songList** in `src/js/screens/select.js`.\

4. Open the game → select the song → press **E**.\

5. Record notes, export the chart via Console (`F12`) and paste into your JSON file.

  

------------------------------------------------------------------------

  

## ⚠️ Disclaimer

  

This is a **Fan Game** made for educational and portfolio purposes.

All music, characters, and assets belong to their respective owners

(**Aki Hamaji / Houbunsha / Aniplex**).

  

------------------------------------------------------------------------

  

Developed with 🩷 and Social Anxiety.
