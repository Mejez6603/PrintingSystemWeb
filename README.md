# Printing Shop Transaction System (Web)

## Overview

This is a simple, web-based application developed using **Python (Flask)** for the backend, **HTML, CSS, and JavaScript** for the frontend, and **SQLite** as its database. It's designed to help small printing businesses manage their daily transactions, track sales, and generate essential reports through a user-friendly web interface.

The system aims to provide a modern, organized, and accessible solution for digital record-keeping and basic business insights.

## Features

  * **User-Friendly Web Interface:** Access the system via any modern web browser.
  * **Intuitive Transaction Entry:**
      * Input fields for Paper Type (Short, Long, A4, PhotoPaper), Color (Black, Colored), Pages, Price/Page.
      * Automatic calculation/suggestion of "Total" price.
      * Ability to **manually override** the auto-calculated "Total" price.
      * Add multiple items to a temporary "Items in Transaction" list before confirming.
      * Edit and delete individual items from the temporary list directly on the page.
  * **Robust Transaction Management:**
      * Confirm transactions to save all associated items permanently to a SQLite database.
      * Auto-generates unique Transaction IDs for each confirmed sale.
      * View a live "Record" table of all past transactions.
  * **Comprehensive Sales Reporting:**
      * Dedicated "Sales Report" page with date range filtering (custom dates, Today, This Week, This Month, This Year).
      * **Pagination:** Displays 10 items per page for better readability of long reports.
      * Detailed aggregate statistics: Total Sales, Total Pages, Total Transactions, and specific page counts by Paper Type and Color.
      * Export the currently displayed report data as a **CSV file**.
  * **Quick Sales Summary (Main Page):**
      * Provides an immediate overview of Today's, This Month's, and This Year's income.
      * Includes detailed breakdowns of total pages, transactions, and pages by paper type and color for all records.
  * **Database Integration:** Utilizes SQLite for reliable and persistent data storage on the server-side.
  * **Data Migration Tool:** Includes a one-time endpoint to migrate historical data from an old `records.csv` file into the new SQLite database.
  * **Reset Functionality:** A "Reset Records" button allows clearing all stored transaction data from the database (with confirmation).

## Technologies Used

  * **Backend:**
      * **Python 3.x:** The core programming language.
      * **Flask:** A lightweight and flexible web framework.
      * **Flask-SQLAlchemy:** An extension for Flask that simplifies database interactions with SQLAlchemy.
      * **SQLAlchemy:** Python SQL Toolkit and Object Relational Mapper (ORM) for database abstraction.
      * **SQLite:** A file-based SQL database, used for local data storage.
  * **Frontend:**
      * **HTML5:** For structuring web pages.
      * **CSS3:** For styling and visual design (including a custom dark theme).
      * **JavaScript (ES6+):** For client-side interactivity, dynamic content updates, and API communication.

## Getting Started

### Prerequisites

  * **Python 3.x:** Ensure you have Python 3.6 or higher installed on your system. You can download it from [python.org](https://www.python.org/downloads/).
  * **Git:** Required to clone the repository. Download from [git-scm.com](https://git-scm.com/downloads).
  * **Visual Studio Community 2022:** With the "Python development" workload (including "Python web support") installed.

### Setup (for Development)

1.  **Clone the Repository:**
    Open your terminal or command prompt and run:

    ```bash
    git clone https://github.com/Mejez6603/Printing-System-Web.git
    cd Printing-System-Web
    ```

    (Note: Replace `Printing-System-Web` if your repository name is different)

2.  **Create and Activate Virtual Environment (in Visual Studio):**

      * Open the `PrintingSystemWeb.sln` file in Visual Studio.
      * In **Solution Explorer**, right-click on **"Python Environments"**.
      * Select **"Add Environment..."**.
      * Choose **"Virtual environment"**, keep the default name (e.g., `env`), select your Python 3.x interpreter, and click **"Create"**. This will create the `env` folder and set it as your project's default environment.

3.  **Install Dependencies:**

      * In **Solution Explorer**, right-click on your newly created virtual environment (e.g., `env (Python 3.13)`).
      * Select **"Manage Python Packages..."**.
      * In the package manager window, search for and install:
          * `Flask`
          * `SQLAlchemy`
          * `Flask-SQLAlchemy`
      * Alternatively, use the Visual Studio **Terminal** (View \> Terminal) and run:
        ```bash
        .\env\Scripts\python.exe -m pip install Flask SQLAlchemy Flask-SQLAlchemy
        ```
        (Replace `env` with `venv` if that's your virtual environment folder name).

4.  **Prepare Assets:**

      * Ensure your `logo.png` image file is located in `PrintingSystemWeb/static/images/logo.png`. Create the `images` folder inside `static` if it doesn't exist.
      * The `site.db` SQLite database file will be automatically created in your project's root (`PrintingSystemWeb/site.db`) on the first successful run of the application.

### Running the Application (Development Mode)

1.  **Start the Server:**

      * In Visual Studio, ensure your `PrintingSystemWeb` project is selected in Solution Explorer.
      * Press **`F5`** (or click the green "Play" button in the toolbar).
      * A console window will open, indicating that the Flask server is running (e.g., `* Running on http://127.0.0.1:5000`).
      * Your default web browser should automatically open to `http://localhost:5000/`. If not, manually navigate there.

2.  **Migrate Historical Data (Optional - Run Once):**

      * If you have an old `records.csv` file from your desktop application and want to import its data into the new database:
          * Place your `records.csv` file in the `database/` folder of your *original desktop application project* (e.g., `C:/Users/YourUser/PycharmProjects/PythonProject/PrintingSystem/database/records.csv`).
          * While your Flask app is running, open your web browser and navigate to:
            `http://localhost:5000/migrate-data`
          * You should see a success message in JSON format. This will populate your `site.db`.

## Usage

### 1\. Main Transaction Screen (`/`)

  * **Transaction Input:** Fill in item details (Paper Type, Color, Pages, Price/Page).
      * "Total" will auto-calculate based on "Pages" and "Price/Page".
      * The "Total" field starts disabled and becomes editable only when valid numbers are entered in "Pages" and "Price/Page". You can then manually override the calculated "Total".
  * **Add Item:** Click "Add Item" to add the item to the "Items in Transaction" table.
  * **Edit/Delete Item (Before Confirming):**
      * Click "Edit" next to an item to populate its details back into the input fields for modification.
      * Click "Delete" to remove an item from the temporary list.
  * **Confirm Transaction:** Click "Confirm Transaction" to save all items in the temporary list as a new sale in the database.
  * **Record Table:** Displays all confirmed transactions from the database.
  * **Quick Sales Summary:** Provides real-time totals and breakdowns (income, pages, transactions by type/color) for today, this month, and this year.

### 2\. Sales Report Page (`/report`)

  * **Access:** Click the "Report" button in the sidebar.
  * **Filter Data:** Select "Date From" and "Date To" using the date pickers.
      * The system will validate that "Date From" is not after "Date To".
      * Click "Generate Report" or use the quick date buttons ("Today", "This Week", "This Month", "This Year").
  * **View Paginated Report:** The table displays 10 items per page. Use the "Previous", "Next", and page number buttons to navigate.
  * **Detailed Summary:** View comprehensive aggregate statistics for the selected date range.
  * **Export as CSV:** Click "Export as CSV" to download the report data for the selected date range as a CSV file.

### 3\. Reset Records

  * Click the "Reset Records" button in the sidebar.
  * A confirmation prompt will appear. If confirmed, all transaction data in the database will be permanently deleted.

## Project Structure

```
PrintingSystemWeb/
├── env/                      # Python Virtual Environment (ignored by Git)
├── PrintingSystemWeb/        # Main Python package for Flask app
│   ├── __init__.py           # Flask app and SQLAlchemy DB initialization, model definitions
│   └── views.py              # Web routes (API endpoints) and business logic
├── static/                   # Static assets served directly by Flask
│   ├── css/
│   │   └── style.css         # Global CSS for dark theme and layout
│   ├── js/
│   │   ├── script.js         # JavaScript for main transaction page interactivity
│   │   └── report_script.js  # JavaScript for sales report page interactivity
│   └── images/
│       └── logo.png          # Application logo
├── templates/                # HTML templates rendered by Flask
│   ├── index.html            # Main transaction page
│   └── report.html           # Sales report page
├── runserver.py              # Script to run the Flask development server
├── requirements.txt          # Lists Python package dependencies
├── site.db                   # SQLite Database file (ignored by Git)
├── .gitignore                # Specifies files/folders to ignore in Git
├── README.md                 # This file!
├── LICENSE                   # Project license details
├── SECURITY.md               # Security vulnerability reporting policy
└── CODE_OF_CONDUCT.md        # Community code of conduct
```

## Changelog

### v1.0.0 - Initial Web Release (YYYY-MM-DD)

  * **Platform Migration:** Re-architected from desktop Tkinter application to a web application.
  * **Backend:** Implemented with Python Flask and SQLAlchemy for database management.
  * **Database:** Switched from flat CSV files to SQLite (`site.db`).
  * **Frontend:** Rebuilt UI with HTML, CSS, and JavaScript for browser access.
  * **Core Functionality:**
      * Transaction input, item management, and confirmation.
      * Quick sales summary on main page.
      * Detailed sales report with date filtering.
      * Reset records functionality.
  * **New Web-Specific Features:**
      * RESTful API endpoints for frontend-backend communication.
      * Data migration route (`/migrate-data`) from old CSV to new database.
      * **Pagination on Sales Report (10 items/page).**
      * Export report to CSV.
      * Responsive design principles applied via CSS.
  * **Design:** Custom dark theme implemented with CSS.

-----

## Troubleshooting

### Common Issues and Solutions

  * **"This site can't be reached" / `localhost` refused to connect.**
      * **Reason:** The Flask server is not running, or your browser is trying to connect to the wrong port.
      * **Solution:** Ensure your Flask app is running (`F5` in VS) and navigate your browser to `http://localhost:5000/`.
  * **`site.db` file is not created.**
      * **Reason:** The database creation command (`db.create_all()`) might not be executing or is failing.
      * **Solution:** Ensure your `runserver.py` is correctly configured to call `db.create_all()` within an `app.app_context()` block. Check the Visual Studio Output window for errors during server startup.
  * **JavaScript functionality (auto-total, add item, etc.) doesn't work.**
      * **Reason:** JavaScript file not loaded, or a JavaScript error is stopping execution.
      * **Solution:**
        1.  Open browser DevTools (F12) -\> **Console tab**. Look for red error messages.
        2.  Check **Network tab** for `script.js` (or `report_script.js`) returning `404 Not Found`. Verify file paths (`static/js/script.js`).
        3.  Ensure `document.addEventListener('DOMContentLoaded', ...)` is correctly placed at the very end of your `script.js` (and `report_script.js`).
  * **`pip` or `python` command not found in Visual Studio Terminal.**
      * **Reason:** Virtual environment not activated or not correctly configured.
      * **Solution:** In Visual Studio Solution Explorer, right-click "Python Environments" -\> "Manage Python Packages..." to visually install packages. This is the most reliable method.
  * **"Invalid Time Format" in reports.**
      * **Reason:** JavaScript's `formatTime` function is failing to parse the time string from the backend.
      * **Solution:** Ensure the `formatTime` function in both `script.js` and `report_script.js` is updated with the robust parsing logic (using regex for AM/PM and 24hr formats).
  * **"No data to export" alert on report export.**
      * **Reason:** The date range selected has no matching records in the database.
      * **Solution:** Check your selected date range. Ensure you have migrated data (`http://localhost:5000/migrate-data`) or added new transactions.
  * **"Date From cannot be after Date To" alert.**
      * **Reason:** The selected "Date From" is a later date than "Date To".
      * **Solution:** Adjust your date selection to a valid range.

## Acknowledgments

  * Special thanks to the open-source community for developing Python, Flask, SQLAlchemy, and all the supporting libraries.
  * Nooby
  * Doc
  * Firelink
  * SBBC PC
  * To my dog and cat

## License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

-----
