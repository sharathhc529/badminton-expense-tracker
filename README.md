# 🏸 ShuttleLedger - Badminton Expense & Attendance Tracker

A full-featured, mobile-first cloud web application designed for badminton clubs and groups to automate court booking splits, daily 6-7 AM game RSVP polls, ad-hoc equipment expenses, attendance calendars, and real-time ledger settlement balances.

---

## ✨ Key Features & Capabilities

1. **📱 100% Online & WhatsApp Shareable**:
   - Share the hosted GitHub Pages link directly in your group WhatsApp chat.
   - Any player can open it on their mobile browser, sign in with Google, answer polls, check balances, or mark attendance in real time.

2. **📊 Weighted Attendance-Based Court Booking Distribution**:
   - Monthly court fee is dynamically split **only** among members who attended sessions during that month.
   - **Proportional Share Formula**: If User 1 attended 2 days and User 2 attended 3 days, costs are calculated as:
     $$\text{Cost Per Session} = \frac{\text{Monthly Court Booking Fee}}{\text{Total Attended Player-Days}}$$
     $$\text{User 1 Share} = 2 \times \text{Cost Per Session}$$
     $$\text{User 2 Share} = 3 \times \text{Cost Per Session}$$
   - Non-attendees pay ₹0!

3. **🗳 Daily Game RSVP Poll (6:00 AM - 7:00 AM Mon-Fri)**:
   - Single-tap **"🏸 Yes, I'm Playing!"** or **"❌ Not Joining"**.
   - Voting "Yes" automatically adds the player into the day's attendance sheet on the calendar.
   - Support for adding outside drop-in / guest players.

4. **📅 Interactive Attendance Calendar**:
   - Full monthly grid with slot support.
   - Click any date to view and update player attendance.
   - Monthly stats (Total sessions, total player-days, top attendee).

5. **💰 Balances, Advances & Settlement Ledger**:
   - Real-time ledger for every player: Total Paid, Total Split Share, Net Balance.
   - Visual status badges: `+₹1,500 (In Advance)` vs `-₹450 (Pending Due)` vs `Cleared (₹0)`.
   - "Clear / Settle" payment recorder with payment method (UPI / GPay / Cash) and celebration animations.

6. **📜 Immutable Audit & Activity Trail**:
   - Every transaction, attendance change, expense creation, and settlement records:
     - Actor name, Google email & avatar
     - Exact timestamp
     - Event category & human-readable description

7. **📊 Google Sheets Sync & 1-Click CSV Export**:
   - 1-click downloads for Balances, Expenses, Attendance, and Audit logs.
   - Real-time webhook integration with Google Apps Script.

8. **🔐 Google Sign-In & Realtime Cloud Sync**:
   - Google Sign-In with Firebase Auth.
   - Real-time Firestore synchronisation across all devices.

---

## 🚀 Quick Start & Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build
```

---

## 🌐 Deploy to GitHub Pages

This repository is pre-configured with a GitHub Actions workflow (`.github/workflows/deploy.yml`).

### How to Push to your GitHub Account (`sharathhc529@gmail.com`):

```bash
# 1. Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit: ShuttleLedger Badminton Expense & Attendance Tracker"

# 2. Create a new repository on GitHub (e.g. 'badminton-expense-tracker') under your account

# 3. Link remote and push
git branch -M main
git remote add origin https://github.com/sharathchandrahc/badminton-expense-tracker.git
git push -u origin main
```

### Enable GitHub Pages:
1. Go to your GitHub repository -> **Settings** -> **Pages**.
2. Under **Build and deployment** -> **Source**, select **GitHub Actions**.
3. Your app will automatically build and deploy to: `https://sharathchandrahc.github.io/badminton-expense-tracker/`.
4. Share this link on WhatsApp with all players!

---

## ⚙️ Google Sign-In & Firebase Configuration (Optional)

ShuttleLedger includes a built-in offline-resilient demo provider so you can use all features right away.

To enable live multi-user cloud synchronization:
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Authentication** -> **Sign-in method** -> **Google**.
3. Enable **Cloud Firestore Database**.
4. In the app, click the **Cloud DB** button on the top right navigation bar and paste your Firebase `apiKey` and `projectId`.

---

## 🛠 Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS v4 + Lucide Icons + Canvas Confetti
- **Date Handling**: Date-fns
- **Authentication & Backend**: Firebase Auth (Google OAuth) + Cloud Firestore
- **CI/CD**: GitHub Actions (GitHub Pages deployment)
