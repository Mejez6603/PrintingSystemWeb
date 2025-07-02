// --- Global Elements for Report Page ---
const reportDateFromInput = document.getElementById('reportDateFrom');
const reportDateToInput = document.getElementById('reportDateTo');
const generateReportBtn = document.getElementById('generateReportBtn');
const reportTableBody = document.getElementById('reportTableBody');

// Quick Date Buttons
const todayReportBtn = document.getElementById('todayReportBtn');
const thisWeekReportBtn = document.getElementById('thisWeekReportBtn');
const thisMonthReportBtn = document.getElementById('thisMonthReportBtn');
const thisYearReportBtn = document.getElementById('thisYearReportBtn');

// Report Summary Details
const reportTotalSalesSpan = document.getElementById('reportTotalSales');
const reportTotalPagesSpan = document.getElementById('reportTotalPages');
const reportNumTransactionsSpan = document.getElementById('reportNumTransactions');
const reportTotalShortPagesSpan = document.getElementById('reportTotalShortPages');
const reportTotalLongPagesSpan = document.getElementById('reportTotalLongPages');
const reportTotalA4PagesSpan = document.getElementById('reportTotalA4Pages');
const reportTotalPhotoPaperPagesSpan = document.getElementById('reportTotalPhotoPaperPages');
const reportTotalBlackPagesSpan = document.getElementById('reportTotalBlackPages');
const reportTotalColoredPagesSpan = document.getElementById('reportTotalColoredPages');

const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn'); // Placeholder (should be removed from HTML)

// Pagination elements
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageNumbersContainer = document.getElementById('pageNumbers');

let currentPage = 1; // Current page number, starts at 1
let totalPages = 1;  // Total pages available


// --- Utility Functions (consistent with script.js) ---
function formatCurrency(amount) {
    return `₱${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
}

function formatTime(timeString) {
    console.log("DEBUG: formatTime input timeString =", timeString); // Keep for debugging

    if (!timeString) {
        return "N/A"; // Handle empty or null timeString
    }

    let date = new Date(); // Start with a fresh Date object
    date.setSeconds(0);    // Clear seconds/milliseconds for clean time
    date.setMilliseconds(0);

    // Robust parsing for HH:MM AM/PM format (e.g., "09:13PM")
    const ampmMatch = timeString.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
    if (ampmMatch) {
        let hours = parseInt(ampmMatch[1]);
        const minutes = parseInt(ampmMatch[2]);
        const ampm = ampmMatch[3].toUpperCase();

        if (ampm === 'PM' && hours < 12) {
            hours += 12;
        }
        if (ampm === 'AM' && hours === 12) { // Midnight (12 AM is 0 hours)
            hours = 0;
        }

        date.setHours(hours);
        date.setMinutes(minutes);
    }
    // Robust parsing for 24hr format (e.g., "14:30:00" or "14:30")
    else if (timeString.includes(':')) {
        const parts = timeString.split(':');
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const seconds = parseInt(parts[2] || '0'); // Seconds might be optional, default to 0

        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
            console.error("DEBUG: Invalid numeric parts in timeString (24hr parse):", timeString);
            return "Invalid Time Value";
        }

        date.setHours(hours);
        date.setMinutes(minutes);
        date.setSeconds(seconds);
    }
    // Fallback for completely unexpected formats
    else {
        console.error("DEBUG: Unexpected timeString format encountered:", timeString);
        return "Unknown Format";
    }

    if (isNaN(date.getTime())) {
        console.error("DEBUG: Resulting Date object is Invalid after parsing. Original timeString:", timeString);
        return "Invalid Time Format";
    }

    const options = { hour: '2-digit', minute: '2-digit', hour12: true };
    return date.toLocaleTimeString(undefined, options);
}

// --- Report Generation Logic ---
async function generateReport(page = 1) { // Default page to 1
    currentPage = page; // Update global current page

    const fromDate = reportDateFromInput.value; // ISO-MM-DD format from input type="date"
    const toDate = reportDateToInput.value;   // ISO-MM-DD format from input type="date"

    if (!fromDate || !toDate) {
        alert("Please select both 'Date From' and 'Date To'.");
        return;
    }

    // Validate date range order
    const fromDateTime = new Date(fromDate);
    const toDateTime = new Date(toDate);

    if (fromDateTime > toDateTime) {
        alert("Error: 'Date From' cannot be after 'Date To'. Please select a valid date range.");
        return;
    }

    // Convert ISO-MM-DD to MM/DD/YYYY for backend helper
    const fromDateFormatted = fromDateTime.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const toDateFormatted = toDateTime.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

    try {
        const response = await fetch(`/get-detailed-report?fromDate=${fromDateFormatted}&toDate=${toDateFormatted}&page=${currentPage}`);

        if (response.ok) {
            const data = await response.json();
            const records = data.records;
            const summary = data.summary;
            const pagination = data.pagination; // Get pagination metadata

            // Populate report table
            reportTableBody.innerHTML = '';
            records.forEach(record => {
                const row = reportTableBody.insertRow();
                row.innerHTML = `
                    <td>${record.id}</td>
                    <td>${formatDate(record.date)}</td>
                    <td>${formatTime(record.time)}</td>
                    <td>${record.paperType}</td>
                    <td>${record.color}</td>
                    <td>${record.pages}</td>
                    <td>${formatCurrency(record.pricePerPage)}</td>
                    <td>${formatCurrency(record.total)}</td>
                `;
            });

            // Populate summary statistics
            reportTotalSalesSpan.textContent = formatCurrency(summary.totalSales);
            reportTotalPagesSpan.textContent = summary.totalPages;
            reportNumTransactionsSpan.textContent = summary.numTransactions;
            reportTotalShortPagesSpan.textContent = summary.totalShortPages;
            reportTotalLongPagesSpan.textContent = summary.totalLongPages;
            reportTotalA4PagesSpan.textContent = summary.totalA4Pages;
            reportTotalPhotoPaperPagesSpan.textContent = summary.totalPhotoPaperPages;
            reportTotalBlackPagesSpan.textContent = summary.totalBlackPages;
            reportTotalColoredPagesSpan.textContent = summary.totalColoredPages;

            // Update pagination controls
            totalPages = pagination.totalPages;
            renderPaginationControls();

        } else {
            console.error('Failed to generate report:', response.statusText);
            alert(`Error generating report: ${response.statusText}`);
            // Clear table and summary if report generation fails
            reportTableBody.innerHTML = '';
            reportTotalSalesSpan.textContent = '₱0.00';
            reportTotalPagesSpan.textContent = '0';
            reportNumTransactionsSpan.textContent = '0';
            reportTotalShortPagesSpan.textContent = '0';
            reportTotalLongPagesSpan.textContent = '0';
            reportTotalA4PagesSpan.textContent = '0';
            reportTotalPhotoPaperPagesSpan.textContent = '0';
            reportTotalBlackPagesSpan.textContent = '0';
            reportTotalColoredPagesSpan.textContent = '0';
            renderPaginationControls(); // Clear pagination controls
        }
    } catch (error) {
        console.error('Error fetching detailed report:', error);
        alert('An error occurred while communicating with the server for the report.');
        // Clear table and summary on network error
        reportTableBody.innerHTML = '';
        reportTotalSalesSpan.textContent = '₱0.00';
        reportTotalPagesSpan.textContent = '0';
        reportNumTransactionsSpan.textContent = '0';
        reportTotalShortPagesSpan.textContent = '0';
        reportTotalLongPagesSpan.textContent = '0';
        reportTotalA4PagesSpan.textContent = '0';
        reportTotalPhotoPaperPagesSpan.textContent = '0';
        reportTotalBlackPagesSpan.textContent = '0';
        reportTotalColoredPagesSpan.textContent = '0';
        renderPaginationControls(); // Clear pagination controls
    }
}

function renderPaginationControls() {
    pageNumbersContainer.innerHTML = ''; // Clear existing page numbers

    // Render page number buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.classList.add('page-number-btn');
        if (i === currentPage) {
            pageBtn.classList.add('active'); // Highlight current page
        }
        pageBtn.addEventListener('click', () => generateReport(i)); // Click to go to that page
        pageNumbersContainer.appendChild(pageBtn);
    }

    // Enable/disable Previous/Next buttons
    if (currentPage > 1) {
        prevPageBtn.classList.remove('disabled');
        prevPageBtn.disabled = false;
    } else {
        prevPageBtn.classList.add('disabled');
        prevPageBtn.disabled = true;
    }

    if (currentPage < totalPages) {
        nextPageBtn.classList.remove('disabled');
        nextPageBtn.disabled = false;
    } else {
        nextPageBtn.classList.add('disabled');
        nextPageBtn.disabled = true;
    }
}

// --- NEW POSITION FOR exportToCsv (defined before DOMContentLoaded) ---
async function exportToCsv() {
    console.log("DEBUG: exportToCsv function called."); // Debugging line

    const fromDate = reportDateFromInput.value;
    const toDate = reportDateToInput.value;

    if (!fromDate || !toDate) {
        alert("Please select both 'Date From' and 'Date To'.");
        return;
    }

    const fromDateFormatted = new Date(fromDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const toDateFormatted = new Date(toDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

    try {
        console.log("DEBUG: Fetching detailed report for export...");
        const response = await fetch(`/get-detailed-report?fromDate=${fromDateFormatted}&toDate=${toDateFormatted}`);

        if (response.ok) {
            const data = await response.json();
            const records = data.records; // These records are already dicts from item.to_dict()

            if (records.length === 0) {
                alert("No data to export for the selected date range.");
                console.log("DEBUG: No records found for export.");
                return;
            }

            console.log("DEBUG: Records received for export:", records);

            // Construct CSV content with headers
            let csvContent = "ID,Date,Time,Paper Type,Color,Pages,Price/Page,Total\n";

            try { // Add try-catch around CSV construction
                records.forEach(record => {
                    // Ensure date and time are formatted for CSV consistency
                    const formattedDate = formatDate(record.date);
                    const formattedTime = formatTime(record.time); // Use updated formatTime!
                    const formattedPricePerPage = parseFloat(record.pricePerPage).toFixed(2); // Ensure 2 decimal places
                    const formattedTotal = parseFloat(record.total).toFixed(2); // Ensure 2 decimal places

                    const row = [
                        record.id,
                        formattedDate,
                        formattedTime,
                        record.paperType,
                        record.color,
                        record.pages,
                        formattedPricePerPage, // Use formatted values
                        formattedTotal // Use formatted values
                    ];
                    csvContent += row.map(e => `"${e}"`).join(",") + "\n"; // Quote fields
                });
                console.log("DEBUG: CSV content constructed.");
                console.log("DEBUG: Generated CSV content preview:", csvContent.substring(0, 500) + "..."); // Preview first 500 chars

                // Create a Blob and trigger download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `sales_report_${fromDate.replace(/-/g, '')}_to_${toDate.replace(/-/g, '')}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                console.log("DEBUG: Attempting link click for download...");
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url); // Clean up URL object

                alert("Report exported successfully as CSV!");
                console.log("DEBUG: Export process completed.");

            } catch (csvError) {
                console.error('ERROR: CSV construction or download failed:', csvError);
                alert('An error occurred during CSV file generation or download. See console for details.');
            }

        } else {
            console.error('Failed to generate report from backend:', response.statusText);
            alert(`Error generating report: ${response.statusText}`);
        }
    } catch (networkError) {
        console.error('ERROR: Network or Fetch operation failed:', networkError);
        alert('An error occurred while communicating with the server for the report.');
    }
}
// --- END NEW POSITION FOR exportToCsv ---

// --- Quick Date Range Setters ---
function setDateRange(startDate, endDate) {
    reportDateFromInput.value = startDate.toISOString().split('T')[0];
    reportDateToInput.value = endDate.toISOString().split('T')[0];
    generateReport();
}

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // Sunday - Saturday : 0 - 6
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday (0) to be last week's Sunday if today is Monday
    return new Date(d.setDate(diff));
}

function getEndOfWeek(date) {
    const d = new Date(getStartOfWeek(date));
    d.setDate(d.getDate() + 6);
    return d;
}


// --- Event Listeners Setup ---
function setupReportEventListeners() {
    generateReportBtn.addEventListener('click', () => generateReport(1));

    todayReportBtn.addEventListener('click', () => {
        const today = new Date();
        setDateRange(today, today);
    });

    thisWeekReportBtn.addEventListener('click', () => {
        const today = new Date();
        const startOfWeek = getStartOfWeek(today);
        const endOfWeek = getEndOfWeek(today);
        setDateRange(startOfWeek, endOfWeek);
    });

    thisMonthReportBtn.addEventListener('click', () => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setDateRange(startOfMonth, endOfMonth);
    });

    thisYearReportBtn.addEventListener('click', () => {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31);
        setDateRange(startOfYear, endOfYear);
    });

    exportCsvBtn.addEventListener('click', exportToCsv); // Event listener for the export button

    // NEW: Add event listeners for Previous and Next buttons
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            generateReport(currentPage - 1);
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            generateReport(currentPage + 1);
        }
    });

    // Sidebar navigation buttons
    document.getElementById('transactionNavBtn').addEventListener('click', () => {
        window.location.href = '/'; // Navigate to main transaction page
    });
    document.getElementById('reportNavBtn').addEventListener('click', () => {
        // Already on Report page
    });
    document.getElementById('resetRecordsBtn').addEventListener('click', () => {
        if (confirm("Are you sure you want to delete ALL sales records?\nThis action cannot be undone.")) {
            fetch('/reset-records', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    if (response.ok) {
                        window.location.reload(); // Reloads the report page
                    }
                })
                .catch(error => console.error('Error resetting records:', error));
        }
    });
}

// --- Add this block to the very end of report_script.js ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: --- report_script.js - FILE LOADED & PARSED ---"); // Debug line
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reportDateFrom').value = today;
    document.getElementById('reportDateTo').value = today;
    generateReport(); // Generate initial report for today
    setupReportEventListeners(); // Setup all event listeners for the report page
    console.log("DEBUG: DOMContentLoaded event fired in report_script.js."); // Debug line
});