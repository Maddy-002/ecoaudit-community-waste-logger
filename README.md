# EcoAudit - Community Waste Logger

EcoAudit is a smart community waste logging web application built for the CodeChef VITC Projects Department recruitment task.

The application allows users to log disposed waste by selecting a waste category and entering the weight in kilograms. To prevent fake or manual location entries, EcoAudit uses the browser's native Geolocation API to automatically capture the user's latitude and longitude during submission.

The submitted waste logs are stored in Firebase Firestore and displayed on a real-time audit dashboard. The dashboard also shows useful environmental metrics such as total waste logged, estimated CO₂ prevented, trees equivalent, verified location count, and a map visualization of waste log locations.

## Live Demo

Deployed Link:
https://zesty-daffodil-7b787d.netlify.app/

## GitHub Repository

Repository Link:
https://github.com/Maddy-002/ecoaudit-community-waste-logger

## Features

* Captcha-based access screen
* Waste category selection
* Weight entry in kilograms
* Automatic geolocation capture using browser Geolocation API
* Firebase Firestore data persistence
* Real-time waste log dashboard
* Total waste calculation
* CO₂ prevented estimate
* Trees equivalent estimate
* Verified location count
* Leaflet map visualization with location pins
* PDF export for audit report
* Responsive UI with animated live background
* Dark mode and light mode toggle

## Tech Stack

* HTML
* CSS
* JavaScript
* Firebase Firestore
* Leaflet.js
* html2pdf.js
* Netlify for deployment

## MVP Requirements Covered

### 1. Log a Waste Entry

Users can submit a waste entry by selecting a waste category and entering the weight in kilograms.

### 2. Validated Geolocation

The app does not use manual location input. It automatically captures the user's latitude and longitude using the browser Geolocation API when the waste log is submitted.

### 3. Audit Dashboard

The dashboard displays all submitted waste logs from the Firebase Firestore database, including category, weight, timestamp, and captured coordinates.

### 4. Live Totaling

The dashboard displays total waste logged and additional environmental metrics such as CO₂ prevented and trees equivalent.

### 5. Data Persistence

All waste log entries are stored in Firebase Firestore, so the data persists even after refreshing or reopening the application.

## Bonus Features Implemented

* Map visualization using Leaflet.js
* Graceful error handling when location permission is denied
* PDF export for audit report
* Captcha-based access screen
* Attractive animated UI background

## Project Structure

```text
ecoaudit-community-waste-logger/
├── index.html
├── style.css
├── app.js
└── README.md
```

## How to Run Locally

1. Clone the repository:

```bash
git clone https://github.com/Maddy-002/ecoaudit-community-waste-logger.git
```

2. Open the project folder:

```bash
cd ecoaudit-community-waste-logger
```

3. Open the folder in VS Code.

4. Right-click on `index.html`.

5. Click `Open with Live Server`.

Important: Run the project from `index.html`, not from `style.css` or `app.js`.

## How to Use

1. Open the deployed website.
2. Enter the captcha shown on the login screen.
3. Click `Access Dashboard`.
4. Select a waste category.
5. Enter the waste weight in kilograms.
6. Click `Verify & Save`.
7. Allow browser location permission.
8. The waste log will be saved and shown on the dashboard.
9. The map will show the submitted location as a pin.

## Location Permission Note

This application requires browser location permission to save a waste entry. If the user denies location permission, the app will not save the entry because geolocation validation is part of the anti-fraud requirement.

## Firebase Note

The application uses Firebase Firestore as the database. Firestore stores each waste log with the following fields:

```javascript
{
  category: "Plastic",
  weight: 5,
  latitude: 12.9716,
  longitude: 77.5946,
  accuracy: 20,
  createdAt: serverTimestamp()
}
```

## Future Improvements

* Add user authentication
* Add image upload as proof of disposal
* Add category-wise charts
* Add admin-only delete permissions
* Add advanced filtering by category and date
* Add export options for CSV and Excel

## Author

Maddy
GitHub: https://github.com/Maddy-002
