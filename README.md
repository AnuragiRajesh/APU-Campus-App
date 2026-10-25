# APU Student Hub

A no-login, mobile-first web app built for **Azim Premji University** students. Everything you need for your day — Oota menu, JANANI shuttle timings, cab sharing, and the official holiday calendar — in one place.

---

## Screenshots

| Shuttle Timings | Oota Menu |
|---|---|
| ![Shuttle](screenshoots/Screenshot%20From%202026-10-24%2022-29-44.png) | ![Oota Menu](screenshoots/Screenshot%20From%202026-10-24%2022-29-59.png) |

| Cab Share | Holiday Calendar |
|---|---|
| ![Cab Share](screenshoots/Screenshot%20From%202026-10-24%2022-30-05.png) | ![Holidays](screenshoots/Screenshot%20From%202026-10-24%2022-30-10.png) |

![Dark Mode](screenshoots/Screenshot%20From%202026-10-24%2022-30-27.png)

---

## Features

### 🚌 JANANI Shuttle — Default tab
- Shows the **next bus time** in large text with a countdown for both directions simultaneously
- **Station → Campus** and **Campus → Station** side by side
- Separate weekday and weekend schedules with the real APU timetable
- Past runs fade out, next run highlighted, "Soon" badge for the one after

### 🍽️ Oota (Food Menu)
- Collapsible accordion — tap to expand
- **Auto-selects the current meal** based on time of day (Breakfast / Lunch / Snack / Dinner)
- **🔴 LIVE badge** when a meal is currently being served
- Real official APU Oota menu for Oct 12–25 2026, exactly as per the printed schedule
- Diet tags on every dish — Veg 🟢 / Non-Veg 🔴 / Vegan 🌿
- Browse by day (Mon–Sun), defaults to today

### 💬 How's the Oota? (Comments)
- Collapsible section below the menu
- Students can post a star rating + comment during the meal window
- **Auto-deletes 2 hours after the meal ends** — no stale reviews
- Comments shared between users via JSONBin
- Use **Refresh comments** to load updates from other users on demand

### 🚖 Cab Share
- Post a cab request with destination, date, time, seats needed, and WhatsApp number
- **WhatsApp deep link** pre-fills a message so anyone can contact instantly
- Posts **auto-expire at departure time**
- Search/filter by destination
- Posts shared between users via JSONBin
- Use **Refresh** to load cab requests from other users on demand

### 📅 Holiday Calendar
- Official APU holiday list for Jan–Dec 2026
- Full monthly calendar with holiday highlights and tooltips
- Upcoming holidays list with days-remaining countdown

### ☕ Buy Me a Coffee
- Floating button (bottom-right)
- UPI QR code + copy-to-clipboard UPI ID
- Quick ₹20 / ₹50 / ₹100 payment deep links

### 🐛 Feedback
- Floating button (bottom-left)
- Bug report or feature request form
- Opens pre-filled email to the developer

---

## Tech Stack

| | Choice |
|---|---|
| Styling | Tailwind CSS (CDN) |
| Logic | Vanilla JavaScript |
| Storage | JSONBin for comments and cab-share posts; `localStorage` for theme preference |
| Fonts | Inter via Google Fonts |
| Hosting | Any static host — GitHub Pages, Netlify, university server |

---

## Project Structure

```
university-app/
├── index.html        — Single page, all four tabs
├── style.css         — Custom CSS (only things Tailwind can't do)
├── app.js            — All data and interactive logic
├── favicon.svg        — Browser tab icon
├── api/jsonbin.js     — Server-side JSONBin proxy for Vercel
└── screenshoots/     — App screenshots
```

---

## Running Locally

No build step needed. Start a local HTTP server (do not open `index.html` as a
`file://` URL, which can prevent browser API requests):

The JSONBin master key is used only by `api/jsonbin.js`; the browser calls this
same-origin API route and never receives the key.

```bash
# Install Vercel CLI if needed, then run the project locally
vercel dev
# then visit the URL shown by Vercel CLI
```

In Vercel, add `JSONBIN_MASTER_KEY` under **Project → Settings → Environment
Variables** for each required environment, then redeploy. Do not add the key to
`app.js`, `index.html`, or any other browser-delivered file. If the key was
previously exposed, rotate it in JSONBin and update the Vercel environment
variable.

---

## Meal Timings

| Meal | Opens | Closes | Comments deleted |
|---|---|---|---|
| Breakfast | 7:00 AM | 9:30 AM | 11:30 AM |
| Lunch | 12:00 PM | 2:20 PM | 4:20 PM |
| Snack | 4:30 PM | 6:15 PM | 8:15 PM |
| Dinner | 7:00 PM | 9:30 PM | 11:30 PM |

---

## Developer

Built by **Rajesh Anuragi** for APU students.  
UPI: `rajeshanuragi2003-1@oksbi`  
Email: `anuragi.rajesh24_ug@apu.edu.in`
