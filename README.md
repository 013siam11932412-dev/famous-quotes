# Famous Quotes Web Application

A web application built with **Python Flask**, **Plain Vanilla JavaScript (ES6+)**, **HTML5**, and **CSS3** that lets users explore, discover, and search across a curated dataset of **100 famous quotes** from renowned thinkers, leaders, and artists throughout history.

---

## Features

- 🎲 **Quote of the Moment (Random Quote Generator)**:
  - Prominently showcases a featured quote on page load.
  - "Random Quote" button with smooth animations to fetch fresh inspiration.
  - "Copy" button with instant clipboard integration and toast notification.
- 🔍 **Real-Time Keyword Search**:
  - Live, debounced search across quote text and author names.
  - Instant query match highlighting (`<mark>`).
  - One-click clear search button.
- 🏷️ **Multi-Criteria Filtering**:
  - Filter by **Category** (Philosophy, Science, Literature, Leadership, Inspiration, Wisdom, Humor, Art) via dropdown or quick-select pills.
  - Filter by **Author** via dropdown (populated dynamically).
  - Clickable category badges on any quote card to instantly filter by that category.
  - One-click "Reset Filters" to restore all quotes.
- 📱 **Responsive & Modern UI**:
  - Pure CSS Grid and Flexbox with glassmorphism card elevation and dark theme.
  - Zero heavy frontend frameworks or build steps.
- 🔥 **Dark Soul Mode (Kindle Bonfire)**:
  - Cinematic Dark Souls aesthetic with deep abyss styling and burnished ember borders.
  - "BONFIRE LIT" dramatic banner with Web Audio API synthesized bonfire ignition chime.
  - Ambient floating ember particle canvas animation.
  - Dedicated "Lordran Lore" collection featuring 20 curated quotes from Dark Souls characters.
  - Persistent theme settings in `localStorage`.
- 🧪 **Automated Testing Suite**:
  - 17 tests verifying API routes, query filtering, Dark Souls endpoints, and data integrity.

---

## Project Structure

```
famous-quotes/
├── app.py                 # Flask server & REST API endpoints
├── requirements.txt       # Python dependencies (Flask, pytest)
├── pytest.ini             # Pytest configuration
├── data/
│   ├── quotes.json        # Curated dataset of 100 quotes
│   └── darksoul_quotes.json # Curated dataset of 20 Dark Souls lore quotes
├── static/
│   ├── index.html         # Semantic HTML5 layout with Dark Soul overlay
│   ├── css/
│   │   └── style.css      # Responsive CSS styles & Dark Soul theme
│   └── js/
│       └── app.js         # Plain Vanilla JS frontend logic & Web Audio synthesizer
└── tests/
    └── test_app.py        # Pytest test suite (17 tests)
```

---

## Quick Start

### 1. Prerequisites
- Python 3.10+ installed

### 2. Set Up Virtual Environment & Dependencies
```powershell
# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 3. Run the Application
```powershell
.\.venv\Scripts\python app.py
```
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the single-page application |
| `GET` | `/api/quotes/random` | Returns a random quote (supports `?category=` & `?author=`) |
| `GET` | `/api/quotes` | Returns quotes filtered by `?q=`, `?author=`, and/or `?category=` |
| `GET` | `/api/quotes/<id>` | Returns single quote by ID |
| `GET` | `/api/categories` | Returns list of unique categories |
| `GET` | `/api/authors` | Returns list of unique authors |
| `GET` | `/api/darksoul/quotes` | Returns Dark Souls lore quotes (supports `?q=`) |
| `GET` | `/api/darksoul/random` | Returns random Dark Souls lore quote |

---

## Running Automated Tests

```powershell
.\.venv\Scripts\pytest -v
```
