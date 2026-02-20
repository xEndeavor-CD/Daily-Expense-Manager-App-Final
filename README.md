# 💰 DEMS — Daily Expense Management System

> Full-stack personal expense tracker built with HTML · Bootstrap 5 · Chart.js · PHP · MySQL · XAMPP

---

## 📁 Complete File Map (25 files)

```
DEMS/
│
├── frontend/                        ← All HTML pages (open in browser)
│   ├── login.html                   01  Login & Register
│   ├── dashboard.html               02  Dashboard – stat cards + pie chart
│   ├── add-expense.html             03  Add new expense form
│   ├── expense-list.html            04  View / search / edit / delete expenses
│   ├── reports.html                 05  Bar chart + Pie chart + Monthly bars
│   └── settings.html                06  Profile · Password · Notifications · Export
│
├── backend/
│   ├── api/
│   │   ├── auth.php                 07  Login · Register · Logout · Session check
│   │   ├── expenses.php             08  GET · POST · PUT · DELETE expenses + summary
│   │   ├── categories.php           09  List all categories
│   │   └── settings.php             10  Profile · Password · Notifications · CSV · Delete
│   ├── config/
│   │   ├── database.php             11  ★ DB credentials (edit this!)
│   │   └── database.example.php     12  Template safe to commit to Git
│   ├── includes/
│   │   ├── session.php              13  Session helpers & auth guard
│   │   └── cors.php                 14  CORS headers
│   └── database.sql                 15  ★ Run this first in phpMyAdmin!
│
├── assets/
│   ├── css/
│   │   └── style.css                16  Complete custom stylesheet
│   └── js/
│       ├── api.js                   17  Central fetch() wrapper + helpers
│       ├── auth.js                  18  Login · Register · Logout · Guard
│       ├── dashboard.js             19  Stat cards + Chart.js Pie
│       ├── add-expense.js           20  Add form logic
│       ├── expense-list.js          21  Table · Search · Edit modal · Delete modal
│       ├── reports.js               22  Bar chart · Pie chart · Monthly bars
│       └── settings.js              23  All settings + CSV export
│
├── .gitignore                       24
└── README.md                        25
```

---

## 🛠️ STEP-BY-STEP SETUP & DEPLOYMENT GUIDE

---

### ✅ STEP 1 — Install Required Tools

| Tool        | Download                      | Notes                  |
| ----------- | ----------------------------- | ---------------------- |
| **XAMPP**   | https://www.apachefriends.org | Choose your OS version |
| **Git**     | https://git-scm.com/downloads | Windows: use Git Bash  |
| **VS Code** | https://code.visualstudio.com | Recommended editor     |
| **Browser** | Chrome or Firefox             | Built-in DevTools      |

---

### ✅ STEP 2 — Download / Clone this Project

**Option A – Download ZIP (easiest):**

1. Go to your GitHub repo → Click green **Code** button → **Download ZIP**
2. Extract to your Desktop or Documents

**Option B – Git Clone:**

```bash
git clone https://github.com/YOUR_USERNAME/DEMS.git
```

---

### ✅ STEP 3 — Place Files in XAMPP

Copy the entire `DEMS` folder into XAMPP's web server root:

| Operating System | Paste folder here                  |
| ---------------- | ---------------------------------- |
| **Windows**      | `C:\xampp\htdocs\DEMS\`            |
| **macOS**        | `/Applications/XAMPP/htdocs/DEMS/` |
| **Linux**        | `/opt/lampp/htdocs/DEMS/`          |

Your structure should look like:

```
htdocs/
└── DEMS/
    ├── frontend/
    ├── backend/
    ├── assets/
    └── README.md
```

---

### ✅ STEP 4 — Start XAMPP Servers

1. Open **XAMPP Control Panel**
2. Click **Start** next to **Apache**
3. Click **Start** next to **MySQL**
4. Both should show green **Running** status

> ⚠️ If Apache port 80 is blocked (Skype, IIS), change it to 8080 in XAMPP → Apache → Config → httpd.conf → `Listen 80` → `Listen 8080`

---

### ✅ STEP 5 — Create the Database

1. Open browser → go to: **http://localhost/phpmyadmin**
2. In the left sidebar, click **New** (or use an existing database)
3. Click the **SQL** tab at the top
4. Open `DEMS/backend/database.sql` in VS Code — **Select All → Copy**
5. Paste into the phpMyAdmin SQL box
6. Click **Go** (blue button)

✅ You should see: `dems_db` in the left sidebar with 4 tables:

- `users`
- `categories`
- `expenses`
- `user_settings`

---

### ✅ STEP 6 — Configure Database Credentials

Open `DEMS/backend/config/database.php` in VS Code:

```php
define('DB_HOST', 'localhost');   // ← leave as localhost
define('DB_USER', 'root');        // ← default XAMPP username
define('DB_PASS', '');            // ← default XAMPP password = empty
define('DB_NAME', 'dems_db');     // ← must match what you created
```

> 💡 If you set a MySQL root password via phpMyAdmin, enter it in `DB_PASS`.

**Save the file.**

---

### ✅ STEP 7 — Open the App in Browser

Navigate to:

```
http://localhost/DEMS/frontend/login.html
```

**Demo credentials (pre-loaded by database.sql):**

```
Email:    john@example.com
Password: demo1234
```

---

### ✅ STEP 8 — Set Up GitHub Version Control

```bash
# Open terminal / Git Bash inside your DEMS folder
cd C:\xampp\htdocs\DEMS          # Windows
cd /Applications/XAMPP/htdocs/DEMS  # macOS

# Initialize Git repository
git init

# Stage all files
git add .

# First commit
git commit -m "Initial commit: DEMS full project"

# Create main branch
git branch -M main

# Add your GitHub remote (create repo at github.com first)
git remote add origin https://github.com/YOUR_USERNAME/DEMS.git

# Push to GitHub
git push -u origin main
```

> 🔒 `database.php` is in `.gitignore` — your credentials won't be pushed.
> Teammates should copy `database.example.php` → `database.php` and fill their own credentials.

---

### ✅ STEP 9 — Day-to-Day Git Workflow

```bash
# Check what files changed
git status

# Stage changed files
git add .

# Commit with a message
git commit -m "feat: add expense search filter"

# Push to GitHub
git push

# Pull latest from GitHub (team collaboration)
git pull

# View commit history
git log --oneline
```

---

## 🔑 App Features & Pages

| Page         | URL                           | Features                                     |
| ------------ | ----------------------------- | -------------------------------------------- |
| Login        | `/frontend/login.html`        | Login + Register + Demo mode                 |
| Dashboard    | `/frontend/dashboard.html`    | Stats + Chart.js Pie + Recent transactions   |
| Add Expense  | `/frontend/add-expense.html`  | Form with category, date, amount             |
| Expense List | `/frontend/expense-list.html` | Search, Edit modal, Delete confirm           |
| Reports      | `/frontend/reports.html`      | Bar chart + Pie chart + Monthly bars         |
| Settings     | `/frontend/settings.html`     | Profile, Password, Notifications, CSV export |

---

## 🚨 Troubleshooting

| Problem                 | Solution                                                      |
| ----------------------- | ------------------------------------------------------------- |
| Page shows blank / 404  | Check XAMPP Apache is running                                 |
| "DB connection failed"  | Check `database.php` credentials                              |
| phpMyAdmin not loading  | Start MySQL in XAMPP Control Panel                            |
| Charts not showing      | Open browser DevTools → Console tab for errors                |
| Login redirects in loop | Clear browser cookies/cache (Ctrl+Shift+Delete)               |
| CORS errors             | Always access via `http://localhost/...` not `file://`        |
| Port 80 blocked         | Change XAMPP Apache to port 8080, use `http://localhost:8080` |
| Session not persisting  | Ensure `session.php` is included before any output            |

---

## 📦 External Libraries (CDN — no install needed)

| Library            | Version | Purpose                    |
| ------------------ | ------- | -------------------------- |
| Bootstrap CSS + JS | 5.3.3   | Layout, components, modals |
| Bootstrap Icons    | 1.11.3  | All sidebar/UI icons       |
| Chart.js           | 4.4.4   | Pie chart + Bar chart      |

All loaded via CDN — **no npm, no build tools, no node_modules.**

---

## 👥 Team Collaboration Tips

1. Each member clones the repo and sets their own `database.php`
2. Use `git pull` before starting work each day
3. Work on separate feature branches: `git checkout -b feature/expense-filters`
4. Open a Pull Request on GitHub for code review before merging to `main`

---

© 2026 ExpenseTracker · Built with Bootstrap 5 + Chart.js + PHP + MySQL
