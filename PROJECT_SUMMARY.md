# Bloom Budget: Detailed Project Summary

## Overview

This project is a **single-page budget tracker and expense planner** built as a **static frontend application** with a small **local data-refresh pipeline** for currency conversion.

The application lets a user:

- set a monthly income target
- set a savings target
- record transactions
- plan upcoming expenses
- track spending by category
- review a weekly planning outlook
- switch between **ZMW** and **USD**
- convert amounts using the latest **Bank of Zambia USD/ZMW exchange rate**

The app is intentionally lightweight and does not require a database, backend server, build tool, npm install, or framework runtime.

## What Was Built

The project currently consists of these main files:

- `index.html`
- `styles.css`
- `script.js`
- `data/exchange-rate.generated.js`
- `tools/fetch_boz_rate.py`
- `tools/run_rate_pipeline.ps1`

## Core Product Idea

The goal of this build was not just to make a budget UI, but to make a **usable budgeting tool for mixed-currency tracking**.

The app is centered around the fact that a user may:

- plan in **kwacha**
- receive or spend money in **dollars**
- still want one coherent dashboard

To support that, the system was built around:

- a **base currency** of `ZMW`
- **input currency selection** for targets, transactions, and plans
- a **display currency selection** for summaries and visual reporting
- a locally refreshed **Bank of Zambia rate file**

This means the app stores the original entered amount and currency, then converts values for totals and visual summaries.

## Application Structure

### 1. Hero / Top Panel

The top section is a large dashboard hero with two main purposes:

- give the page a premium visual identity
- put the most important controls and exchange-rate information at the top

It contains:

- monthly income target input
- income currency selector
- savings target input
- savings currency selector
- display currency selector
- save button
- circular “budget pressure” progress ring
- “left to spend” figure
- “planned soon” figure
- Bank of Zambia exchange-rate card

### 2. Summary Cards

The second layer of the page shows four summary cards:

- net balance
- savings progress
- upcoming bills
- smart nudge

These cards are meant to give fast high-level guidance without making the user read a full ledger.

### 3. Transaction Section

This section allows the user to add:

- a label
- amount
- currency
- type (`income` or `expense`)
- category
- date

Transactions are then displayed as a list, with:

- the original amount and original currency
- metadata like category, type, and date
- a converted display amount when the display currency differs from the entry currency
- delete controls for each item

### 4. Expense Planner Section

This section is for upcoming planned expenses rather than completed transactions.

Each planned item contains:

- name
- amount
- currency
- due date
- priority (`high`, `medium`, `low`)

This section helps the user map future obligations rather than only reviewing the past.

### 5. Category Budget Grid

The app includes built-in category budgets defined in kwacha:

- Housing
- Food
- Transport
- Lifestyle
- Utilities
- Other

Each category card shows:

- amount spent
- total category budget
- progress bar
- percentage used

### 6. Weekly Planner

Planned expenses are grouped into weekly buckets so the user can see:

- what is due in each week
- how much that week is likely to cost
- which planned items make up the week total

## How the App Was Built

## Frontend Approach

The frontend was built in **plain HTML, CSS, and JavaScript**.

No framework was used. This was intentional because:

- the app can open directly from `index.html`
- there is no dependency installation step
- the project stays easy to move, copy, and run locally
- the local generated exchange-rate file can be loaded with a simple `<script>` tag

## HTML Structure

The HTML is organized into:

- one main page shell
- a hero section
- a dashboard body
- forms for transactions and plans
- reusable `<template>` elements for rendering transaction and plan rows

Using templates keeps the JavaScript simpler because list items are cloned from predefined markup instead of being manually assembled with large string blocks.

## CSS Styling System

The styling was designed to make the page feel **warm, calm, polished, and premium**, instead of looking like a generic admin dashboard.

### Visual Direction

The design language uses:

- soft warm neutrals
- copper/orange accents
- muted sage and gold support colors
- frosted translucent cards
- serif headings with sans-serif body text
- soft shadow depth
- rounded corners
- layered backgrounds

### Color Palette

The color system is defined with CSS variables at the top of `styles.css`.

Some of the key roles are:

- `--panel`: soft translucent card background
- `--panel-strong`: denser card background
- `--line`: subtle border color
- `--text`: primary body text
- `--muted`: secondary helper text
- `--accent`: main orange/copper accent
- `--accent-deep`: darker accent for emphasis
- `--sage`: green support tone
- `--gold`: gold support tone
- `--ink`: cooler dark tone used on the rate card

This makes the page visually consistent and keeps future restyling easier.

### Typography

The app uses a mixed typography strategy:

- **serif-style headings** for elegance and visual identity
- **clean sans-serif body text** for readability

Specifically:

- headings use `Palatino Linotype`, `Book Antiqua`, `Georgia`
- body text uses `Aptos`, `Segoe UI Variable Text`, `Trebuchet MS`
- code snippets use `Cascadia Code`, `Consolas`

This gives the app a more editorial, intentional feel than default system-only typography.

### Layout

The layout is built with **CSS Grid** and a few flexible card stacks.

Key layout patterns:

- hero uses a two-column grid
- summary cards use a four-column grid
- content area uses a two-column grid
- forms use grid layouts with responsive collapse
- smaller screens collapse into single-column stacking

### Glass / Frosted UI Treatment

The project uses:

- translucent backgrounds
- backdrop blur
- soft borders
- deep but diffused shadows

This creates a light glassmorphism-inspired interface without making the page feel overly glossy or noisy.

### Background Styling

The page background is not flat.

It uses:

- layered radial gradients
- a warm base gradient
- blurred ambient shapes placed behind the content

This gives the dashboard atmosphere and depth.

### Motion

The UI includes a subtle `rise-in` animation.

It is used to:

- animate the hero in
- bring cards in with a slight upward motion

The motion is intentionally restrained so the page feels polished rather than busy.

### Buttons and Inputs

Inputs were styled with:

- rounded corners
- soft panel backgrounds
- subtle border transitions
- lift-on-focus behavior

Buttons were styled in three variants:

- `primary-btn` for main actions
- `secondary-btn` for softer alternate actions
- `ghost-btn` for neutral controls

The buttons also have slight hover lift to make interaction feel more tactile.

## JavaScript Architecture

The JavaScript is organized around a small state-driven flow.

### State Model

The state contains:

- `incomeTarget`
- `savingsTarget`
- `transactions`
- `plans`
- `preferences`

The key structure is:

- targets are stored as `{ amount, currency }`
- transactions store original amount, original currency, date, category, and type
- plans store original amount, original currency, due date, and priority
- preferences currently store the display currency

### Base Currency Model

The app uses:

- `ZMW` as the **base calculation currency**

This means:

- totals are normalized into kwacha
- category budgets are defined in kwacha
- overall comparisons stay consistent
- values are converted to the selected display currency only at render time

This is a good design because it avoids mixing currencies inconsistently in budget math.

### DOM Binding

The app collects key DOM nodes once in an `elements` object and then uses that object throughout the script.

That helps keep the code structured and avoids repeated DOM queries.

### App Boot Sequence

When the page loads, the app:

1. normalizes the exchange-rate file from `window.BOZ_EXCHANGE_RATE`
2. loads saved app state from `localStorage`
3. populates the UI controls
4. sets default dates
5. binds event listeners
6. renders the full dashboard

### Local Storage

The app persists data using:

- `localStorage`

The current storage key is:

- `bloom-budget-state-v2`

There is also a migration path from the earlier key:

- `bloom-budget-state`

That migration maps old single-currency data into the new dual-currency format by assuming legacy values were in `ZMW`.

### Rendering Strategy

The script follows a simple manual render loop:

- calculate metrics
- render exchange-rate card
- render summary cards
- render transaction list
- render plan list
- render category budgets
- render weekly planner

This keeps the app understandable and avoids framework overhead.

## Currency Conversion System

The conversion system is one of the most important pieces of the build.

### Supported Currencies

The app currently supports:

- `ZMW`
- `USD`

### Conversion Rules

The logic uses:

- `ZMW` as the base currency
- Bank of Zambia `midRate` for conversion

If the exchange-rate file is missing:

- the app still loads
- the UI warns that the rate file is missing
- conversion-dependent values fall back safely instead of crashing

### Formatting

Currency display is customized using:

- `K` for ZMW
- `$` for USD

It does not rely on browser-localized symbol formatting alone. Instead, it uses a controlled formatter so values display consistently in the UI.

### Rate Card

The exchange-rate card shows:

- 1 USD to ZMW headline
- buying rate
- mid-rate
- selling rate
- effective time
- fetched time

This makes the conversion source visible and understandable to the user.

## Metrics and Business Logic

The app calculates:

- total income
- total expenses
- actual savings
- net balance
- upcoming plan totals
- category spend totals
- high-priority upcoming bill count
- budget pressure ratio

### Smart Nudge Logic

The “Smart nudge” card changes its message based on the current budget situation.

Examples:

- no rate file loaded
- no income target set
- upcoming bills are tight
- savings gap
- on steady ground

This turns the dashboard into more than a ledger by adding lightweight guidance.

### Weekly Grouping

Planned expenses are grouped by week using a Monday-to-Sunday bucket calculation.

That produces weekly range cards such as:

- `7 Apr to 13 Apr`
- `14 Apr to 20 Apr`

This is useful because upcoming obligations are often easier to reason about by week than as a flat list.

## Bank of Zambia Integration

## Why a Local Pipeline Was Used

The app is a local static page, usually opened from `file://`.

If the browser itself tried to fetch the BoZ endpoint directly, it could run into:

- CORS issues
- offline limitations
- reliability issues from loading external data on every page load

So instead of browser-side scraping, the project uses a **local refresh pipeline**.

### Data Source

The exchange rate comes from the Bank of Zambia endpoint:

- `https://www.boz.zm/api/v1/views/boz_zmw_usd_daily_exchange_rates`

This endpoint returns rows containing:

- `buying`
- `mid_rate`
- `selling`
- `time`

### Python Fetch Script

`tools/fetch_boz_rate.py` does the following:

1. requests the BoZ USD/ZMW endpoint
2. parses the JSON payload
3. extracts the timestamp from the HTML `<time>` snippet in the payload
4. converts the buy, mid, and sell values to numbers
5. sorts the rows by the effective timestamp
6. selects the latest row
7. writes a generated JavaScript file

### Why It Outputs JavaScript Instead of JSON

The generated output is:

- `data/exchange-rate.generated.js`

This file defines:

- `window.BOZ_EXCHANGE_RATE`

This was done intentionally because:

- static `index.html` can load a JS file directly with a `<script>` tag
- JSON `fetch()` calls can be awkward or blocked when opening the app directly from disk

So the generated JS file is the cleanest solution for a no-build, no-server local app.

### PowerShell Pipeline Wrapper

`tools/run_rate_pipeline.ps1` was added so rate refresh is simple for the user.

It:

- looks for a usable Python interpreter
- runs the Python fetch script
- rewrites `data/exchange-rate.generated.js`
- prints status output

This gives the project a repeatable refresh workflow without requiring the user to remember the Python command.

## Current Generated Exchange-Rate File

The generated file stores:

- pair
- source
- endpoint
- fetched timestamp
- effective timestamp
- effective date
- buying rate
- mid-rate
- selling rate

This data is then consumed immediately by the frontend on page load.

## User Experience Design Decisions

Several UX choices were made deliberately:

### Empty Initial State

The app now starts empty instead of shipping with demo data.

That avoids confusion between:

- real personal data
- fake sample entries

### Clear Data Button

A “Clear all data” button was included so the user can reset the local budget state quickly.

### Original vs Converted Amount Display

List items show:

- the original entered currency amount
- a secondary converted display when needed

This is important because users often want to preserve the original recorded amount rather than only seeing the converted version.

### Responsive Layout

The app was designed to work on:

- desktop
- tablet
- mobile

The CSS collapses larger grids into single-column layouts on smaller widths.

## Technical Characteristics

This project is:

- static
- dependency-light
- framework-free
- local-first
- persistent via `localStorage`
- refreshable via a local BoZ rate pipeline

It does **not** currently include:

- a backend
- user accounts
- cloud sync
- charts library
- database
- authentication
- recurring transactions
- editable category-budget configuration UI

## How to Run the Project

### Open the App

Open:

- `index.html`

You can double-click it in File Explorer or run:

```powershell
start index.html
```

### Refresh the Exchange Rate

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\run_rate_pipeline.ps1
```

That will regenerate:

- `data/exchange-rate.generated.js`

## In Short

What you have built is:

- a polished static **budget tracker**
- an **expense planner**
- a **dual-currency budgeting interface**
- a **Bank of Zambia-powered exchange-rate workflow**
- a **responsive glass-style dashboard**
- a **local-first tool** with persistent data and no dependency on a server

It combines:

- thoughtful visual design
- practical budget tracking
- real exchange-rate integration
- simple local execution

The result is not just a pretty page. It is a working personal finance dashboard with a clear data model, a refreshable rate source, and a usable budgeting workflow.
