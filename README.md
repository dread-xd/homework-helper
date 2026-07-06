# Homework Helper

> **⚠ Proof of Concept — For educational purposes only.**

A Chrome extension that auto-completes worksheet-style forms and assignments on any webpage. Detects text inputs, dropdowns, checkboxes, radio buttons, and textareas, then fills them with plausible answers based on label analysis.

## Features

- **Auto-fill** — Fills text fields, selects, checkboxes, radios, and textareas with one click.
- **Smart detection** — Reads labels, placeholders, and names to determine appropriate values.
- **Revert** — Restores the original state of all fields.
- **Stats** — Shows how many fields were filled/skipped.

## Installation

1. Clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `homework-helper` folder
5. Click the extension icon in the toolbar to open the popup

## Usage

1. Navigate to any page with a form or worksheet
2. Click the **Homework Helper** icon
3. Click **Auto-Fill This Page**
4. Review and adjust any fields as needed
5. Click **Revert Fill** to undo

## How it works

The content script (`content.js`) scans the DOM for all form elements. For each element, it:

1. Determines the associated label text (via `for` attribute, parent `<label>`, or closest container)
2. Matches the label against a dictionary of common worksheet keywords (`name`, `email`, `date`, `state`, etc.)
3. Picks a random plausible value and assigns it, triggering input/change events

## Project Structure

```
homework-helper/
├── manifest.json        # Chrome extension manifest (MV3)
├── content.js           # Content script — does the auto-fill
├── popup.html           # Popup UI
├── popup.js             # Popup logic
├── icons/               # Extension icons (16, 48, 128px)
└── README.md
```

## Disclaimer

This project is a **proof of concept** created for educational purposes. Do not use it to cheat on actual assignments or violate academic integrity policies.
