# Retro Car Driving Game

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- A 2D top-down low-graphics retro car driving game
- Manual transmission system with gears 1-5 and neutral
- Clutch mechanic: must press clutch before shifting gears
- RPM gauge that rises/falls based on engine load and gear
- Speedometer showing current speed
- Gear indicator (N, 1, 2, 3, 4, 5)
- Simple road/track environment with pixel-art aesthetic
- Car movement controlled via keyboard (WASD or arrow keys)
- Clutch key (e.g. C or Left Shift)
- Gear up/down keys (e.g. E/Q or X/Z)
- Engine stall if clutch released too fast at wrong RPM
- High score system (distance traveled or time)
- Game states: idle, playing, stalled, game over

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: store high scores (player name, distance/time)
2. Frontend: Canvas-based 2D game
   - Game loop with requestAnimationFrame
   - Car physics: acceleration, braking, gear/RPM simulation
   - Manual clutch logic: clutch must be engaged to shift; releasing clutch at wrong RPM stalls engine
   - HUD: speedometer, RPM dial, gear indicator, distance
   - Simple road rendering with scrolling lane markings
   - Keyboard input handler for gas (W/Up), brake (S/Down), steer (A/D), clutch (Shift/C), gear up (E), gear down (Q)
   - Landing screen with instructions and high scores table
   - Game over / stall screen
