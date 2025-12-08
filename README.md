
# 🎸 Kessoku Beat - Bocchi Rhythm Game

  

> "If I play the guitar enough, maybe even I can shine..." --- Bocchi

  

A modern, modular, and stylized web **Rhythm Game** inspired by the anime **Bocchi the Rock!**.

Built entirely with **Vanilla JavaScript**, focusing on clean

architecture, performance, and visual polish.

  

![Project Status](https://img.shields.io/badge/Status-Version_4.0.0-pink)

![Tech](https://img.shields.io/badge/Tech-HTML5_|_CSS3_|_ES6+-blue)

![Backend](https://img.shields.io/badge/Backend-Firebase-orange)

![License](https://img.shields.io/badge/License-MIT-green)
  

------------------------------------------------------------------------

  

## ✨ Features

### 🆕 New in v4.0.0 (Economy Update)
- **Kessoku Shop:** Earn Yen by playing and spend it on cosmetic upgrades.
- **Cloud Save:** Login with Google to save your inventory, money, and high scores.
- **Customization:** Buy and equip new Note Skins (Osu!, Guitar Pick) and Lane Skins (Starry Floor, Cyber Grid).
- **Visual Juice:** Added particle explosions, lane beams, and screen effects for maximum impact.

### 🆕 New in v3.0.0 (Kessoku Assemble Update)
- **Character System:** Choose your favorite member of Kessoku Band! Each character has unique voice lines, backgrounds, and gameplay buffs:
  - **🎸 Hitori Gotoh:** *Fever Boost* (Gauge fills 50% faster).
  - **🥁 Nijika Ijichi:** *Safety Net* (First 3 misses don't break combo/HP).
  - **🌿 Ryo Yamada:** *Score Boost* (Passive +10% score multiplier).
  - **✨ Ikuyo Kita:** *Extended Fever* (Fever mode lasts 15s instead of 8s).
- **Dynamic Theming:** The entire game UI (lanes, notes, text, glow) changes color based on the selected character.
- **HP System:** Added a Life Bar. Missing notes depletes HP, hitting notes recovers it. Reaching 0% results in Game Over.
- **Cinematic Intro:** New stylish song introduction sequence before gameplay starts.

### 🆕 New in v2.0.0 (The "Overdrive" Update)
- **Fever System (Kessoku Charge):** Fill the gauge and press `SPACE` to double your score with a flashy "Kita-Aura" cut-in animation.
- **Modifiers System:**
  - **Speed Up:** Increases note scroll speed by 30%.
  - **Sudden Death:** Miss a single note and it's Game Over.
  - **Auto Play:** Watch the CPU play the chart perfectly (Score not saved).
- **Visual Overhaul:** Dynamic stage lighting (Lane Beams) and reactive Combo Aura that intensifies as you play.
- **Custom Keybinds:** Remap your keys in the Options menu to fit your playstyle.
- **Hold Note Mechanics:** Fully implemented hold/release logic with visual trails.

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
- **Online Leaderboard (Arcade Mode):** Integrated with **Firebase Firestore** to save and display global high scores.


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

-  **Fever:** Press **SPACE** when the bar is full.

  

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
├── assets/             # Images, Audio files, and Charts (JSON)
├── src/
│   ├── css/            # Modular styles
│   └── js/             # Modular logic
│       ├── firebase.js     # Firestore connection
│       ├── audioEngine.js  # Web Audio API wrapper
│       ├── noteSpawner.js  # Game logic & pooling
│       ├── router.js       # SPA Router
│       └── screens/        # Individual screen logic
└── index.html          # Entry point

  

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
