## Challenges Faced
### Task 2
- Handling database errors and ensuring proper saving of puzzles and scores.
- Debugging SQL schema mismatches and ensuring leaderboard data is consistent.
- Fixing issues with frontend-backend communication and handling form submissions correctly.
## Methodoligies 
### Task 1 
- **Core Mechanics:** Grid-based movement with collision detection; conditional box pushing; move history for undo.
- **Win Detection & Timing:** Automatically detects level completion; tracks elapsed time and triggers a win modal.
- **UI & Controls:** Dynamic rendering of the board using CSS classes; keyboard controls for movement, undo, and restart.
### Task 2 
- **User Authentication:** Registration and login system for players and admins; role-based access controls for admin-only features.
- **Admin Puzzle Management:** Admin-only interface to create puzzles.
- **Latest Puzzle Gameplay:** Dedicated page fetches and plays the newest puzzle; standard gameplay features like timer, move count, win modal, and score submission.
- **Role-Based Access:** Users have roles (anonymous, player, admin); admin tools visible only to admins.
- **Leaderboard:** Global leaderboard showing top scores per user (lowest moves, then time); auto-refreshes after submissions; integrated with both original and latest puzzles.
### Task 3 
- **Multiplayer Gameplay:** Four players compete by tapping assigned keys; live scoring updates in real time.
- **Leader Highlighting:** Player(s) with the highest score dynamically highlighted with visual effects.
- **UI & Controls:** Timer counts down from 15 seconds; start/restart buttons control the game; smooth score updates and feedback.
- **Tie Handling:** Supports multiple leaders in case of ties; winner announced clearly at the end of the round.
