# UFC Fight Predictor: Web Application Design Blueprint

This document contains the complete technical specification, UI/UX design tokens, and API communication structure for the UFC Fight Prediction Web Application. You can import this directly into **Lovable**, **Replit**, or **v0** to generate the frontend, and run the backend inside your local workspace.

---

## 1. UI/UX Design System (Aesthetic Tokens)

To create a premium, high-end "Vegas Sportsbook" atmosphere, use this styling system:

### Harmonized Color Palette (HSL/HEX)
*   **Background:** `#0B0C10` (Deep obsidian black)
*   **Card Surfaces:** `#1F2833` / `rgba(31, 40, 51, 0.45)` (Semianthracite glass)
*   **Red Corner Accent:** `#EF4444` (Vibrant neon red glow)
*   **Blue Corner Accent:** `#3B82F6` (Electric cyan blue glow)
*   **Gold (Highlight / Title):** `#E5A93B` (Vegas gold accent)
*   **Text Primary:** `#F3F4F6` (Cool off-white)
*   **Text Secondary:** `#9CA3AF` (Muted silver)

### Typography
*   **Headers:** `Space Grotesk` or `Outfit` (Bold, geometric, clean)
*   **Body & Stats:** `Inter` (Highly readable digital UI font)

### UI Design Style (Glassmorphism)
All cards and inputs should look like floating panes of glass over the obsidian background:
```css
background: rgba(31, 40, 51, 0.45);
backdrop-filter: blur(16px) saturate(120%);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 16px;
box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
```

---

## 2. Dashboard Layout Architecture

The app is divided into three key panels on a single responsive screen:

```
+--------------------------------------------------------------+
| [UFC Predictor Logo]                     Model Status: 68%   |
+--------------------------------------------------------------+
|  RED CORNER (Input)           vs          BLUE CORNER (Input)|
|  [Select Fighter R]                       [Select Fighter B] |
|  [R Betting Odds: -150]                   [B Betting Odds: +130]
+--------------------------------------------------------------+
|                         PREDICT BUTTON                       |
+--------------------------------------------------------------+
|                       [Radial Chart]                         |
|                     CONOR        HOLLOWAY                    |
|                      52%    vs     48%                       |
+--------------------------------------------------------------+
|                   METHOD OF VICTORY (SIM)                    |
|  KO/TKO [==== 19.6%]               KO/TKO [====== 24.8%]     |
|  SUB    [          ]               SUB    [          ]       |
|  DEC    [===== 29.5%]              DEC    [===== 26.0%]      |
+--------------------------------------------------------------+
|                   H2H FIGHTER PROFILES                       |
|  5.32 <----------------- SLpM -----------------> 6.91        |
|  74.0" <-------------- Reach -----------------> 69.0"        |
|  37 <------------------- Age ------------------> 34          |
+--------------------------------------------------------------+
```

---

## 3. FastAPI Backend API Specification

This is the exact API contract your Python backend will run and your frontend (Lovable/Replit) will query.

### Endpoint 1: Get All Fighter Names
*   **URL:** `/api/fighters`
*   **Method:** `GET`
*   **Response:**
```json
{
  "fighters": [
    "Conor McGregor",
    "Max Holloway",
    "Jon Jones",
    "Dustin Poirier"
  ]
}
```

### Endpoint 2: Get Individual Stats (For H2H Visuals)
*   **URL:** `/api/fighters/{name}`
*   **Method:** `GET`
*   **Response:**
```json
{
  "name": "Conor McGregor",
  "wins": 10,
  "losses": 4,
  "ko_wins": 8,
  "sub_wins": 0,
  "dec_wins": 2,
  "slpm": 5.32,
  "td_rate": 0.67,
  "reach": 187.96,
  "age": 37
}
```

### Endpoint 3: Run Prediction & Simulation
*   **URL:** `/api/predict`
*   **Method:** `POST`
*   **Request Body:**
```json
{
  "R_fighter": "Conor McGregor",
  "B_fighter": "Max Holloway",
  "R_odds": -150,
  "B_odds": 130,
  "rounds": 3
}
```
*   **Response Body:**
```json
{
  "R_fighter": "Conor McGregor",
  "B_fighter": "Max Holloway",
  "p_Red": 0.52,
  "p_Blue": 0.48,
  "simulation": {
    "R_KO": 0.1962,
    "R_Sub": 0.0000,
    "R_Dec": 0.2956,
    "B_KO": 0.2482,
    "B_Sub": 0.0000,
    "B_Dec": 0.2600,
    "avg_rounds": 2.50
  }
}
```

---

## 4. Frontend Interactive Features (Micro-Animations)
To make the dashboard feel alive (WOW effect):
1.  **Corner Selection Glow:** When you select Conor in the Red corner, the left side of the dashboard should pulse with a subtle Red neon glow (`box-shadow: 0 0 15px rgba(239, 68, 68, 0.3)`). Selecting Max Holloway in the Blue corner pulses the right side with a Cyan glow.
2.  **Predict Button Loading:** While the 10,000 Monte Carlo simulations run (about 1 second), show a spinning digital octagon loader on the button.
3.  **Radial Chart Spin-up:** The main win percentage donut chart should animate and spin up from 0% to the predicted value (e.g. 52%) on load.
