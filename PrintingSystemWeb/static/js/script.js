// --- Global Elements ---
const currentDateTimeSpan = document.getElementById('currentDateTime');
const paperTypeSelect = document.getElementById('paperType');
const colorSelect = document.getElementById('color');
const pagesInput = document.getElementById('pages');
const pricePerPageInput = document.getElementById('pricePerPage');
const totalInput = document.getElementById('total');
const addItemBtn = document.getElementById('addItemBtn');
const itemsInTransactionTableBody = document.getElementById('itemsInTransactionTableBody');
const confirmTransactionBtn = document.getElementById('confirmTransactionBtn');
const recordTableBody = document.getElementById('recordTableBody'); // For the main record table

// Quick Sales Summary elements
const todayIncomeSpan = document.getElementById('todayIncome');
const todayDateSpan = document.getElementById('todayDate');
const monthIncomeSpan = document.getElementById('monthIncome');
const monthDateSpan = document.getElementById('monthDate');
const yearIncomeSpan = document.getElementById('yearIncome');
const yearDateSpan = document.getElementById('yearDate');

// Report Summary Details (renamed for clarity as these are on main summary)
const summaryTotalPagesSpan = document.getElementById('summaryTotalPages');
const summaryNumTransactionsSpan = document.getElementById('summaryNumTransactions');
const summaryTotalShortPagesSpan = document.getElementById('summaryTotalShortPages');
const summaryTotalLongPagesSpan = document.getElementById('summaryTotalLongPages');
const summaryTotalA4PagesSpan = document.getElementById('summaryTotalA4Pages');
const summaryTotalPhotoPaperPagesSpan = document.getElementById('summaryTotalPhotoPaperPages');
const summaryTotalBlackPagesSpan = document.getElementById('summaryTotalBlackPages');
const summaryTotalColoredPagesSpan = document.getElementById('summaryTotalColoredPages');

// --- Utility Functions ---
function formatCurrency(amount) {
    return `₱${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
}

function formatTime(timeString) {
    console.log("DEBUG: formatTime input timeString =", timeString); // Keep this debug line

    if (!timeString) {
        return "N/A";
    }

    let date = new Date(); // Start with a Date object (defaults to current date/time)
    date.setSeconds(0); // Clear seconds/milliseconds to ensure clean time
    date.setMilliseconds(0);

    // --- FIX: Robustly parse HH:MM AM/PM format using regex ---
    const ampmMatch = timeString.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
    if (ampmMatch) {
        let hours = parseInt(ampmMatch[1]);
        const minutes = parseInt(ampmMatch[2]);
        const ampm = ampmMatch[3].toUpperCase(); // Ensure AM/PM is uppercase for logic

        // Convert 12-hour to 24-hour format
        if (ampm === 'PM' && hours < 12) {
            hours += 12;
        }
        if (ampm === 'AM' && hours === 12) { // Midnight (12 AM is 0 hours in 24hr format)
            hours = 0;
        }

        date.setHours(hours);
        date.setMinutes(minutes);
        // Seconds are assumed to be 0 as not provided in "HH:MM AM/PM"
    }
    // --- Existing Robust parsing for 24hr format (e.g., "14:30:00" or "14:30") ---
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
        console.error("DEBUG: Unexpected timeString format encountered, no match for AM/PM or 24hr:", timeString);
        return "Unknown Format";
    }

    // Final check if the Date object is valid after all parsing attempts
    if (isNaN(date.getTime())) {
        console.error("DEBUG: Resulting Date object is Invalid after parsing. Original timeString:", timeString);
        return "Invalid Time Format";
    }

    const options = { hour: '2-digit', minute: '2-digit', hour12: true };
    return date.toLocaleTimeString(undefined, options);
}


// --- Main UI Logic ---

// 1. Update Date and Time
function updateDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    currentDateTimeSpan.textContent = `${date} — ${time}`;
    setTimeout(updateDateTime, 1000); // Update every second
}


// 2. Auto-calculate Total Price
function calculateTotal() {
    const pages = parseInt(pagesInput.value);
    const pricePerPage = parseFloat(pricePerPageInput.value);

    if (!isNaN(pages) && pages > 0 && !isNaN(pricePerPage) && pricePerPage > 0) {
        const total = pages * pricePerPage;
        totalInput.value = total.toFixed(2);
        // Enable Total field
        totalInput.disabled = false; // NEW LINE
        // Remove disabled styling if you have any
        totalInput.classList.remove('disabled'); // NEW LINE

        // Enable Add Item button
        addItemBtn.classList.remove('disabled');
        addItemBtn.disabled = false;
    } else {
        totalInput.value = '';
        // Disable Total field
        totalInput.disabled = true; // NEW LINE
        // Add disabled styling
        totalInput.classList.add('disabled'); // NEW LINE

        // Disable Add Item button
        addItemBtn.classList.add('disabled');
        addItemBtn.disabled = true;
    }
}


// 3. Add Item to "Items in Transaction" Table (Frontend Only)
//    This is for the temporary list before backend confirmation
function addItem() {
    let paperType = paperTypeSelect.value;
    let color = colorSelect.value;
    let pages = pagesInput.value;
    let pricePerPage = pricePerPageInput.value;
    let total = totalInput.value;

    if (!paperType || !color || !pages || !pricePerPage || !total) {
        alert("Please fill in all item details.");
        return;
    }

    const row = itemsInTransactionTableBody.insertRow();
    row.dataset.originalValues = JSON.stringify({ paperType, color, pages, pricePerPage, total }); // Store original values for edit

    row.innerHTML = `
        <td>${paperType}</td>
        <td>${color}</td>
        <td>${pages}</td>
        <td>${formatCurrency(pricePerPage)}</td>
        <td>${formatCurrency(total)}</td>
        <td class="action-buttons">
            <button class="info-btn" onclick="editItem(this)">Edit</button>
            <button class="danger-btn" onclick="deleteItem(this)">Delete</button>
        </td>
    `;

    // Clear inputs after adding
    paperTypeSelect.value = '';
    colorSelect.value = '';
    pagesInput.value = '';
    pricePerPageInput.value = '';
    totalInput.value = '';
    addItemBtn.classList.add('disabled');
    addItemBtn.disabled = true;
    addItemBtn.textContent = 'Add Item'; // Reset button text after update/add
    addItemBtn.classList.remove('info-btn'); // Reset button style
    addItemBtn.classList.add('primary-btn');
}

// 4. Edit Item in "Items in Transaction" Table (Frontend Only)
function editItem(button) {
    const row = button.closest('tr');
    const cells = row.querySelectorAll('td');

    // Populate input fields
    paperTypeSelect.value = cells[0].textContent;
    colorSelect.value = cells[1].textContent;
    pagesInput.value = cells[2].textContent;
    pricePerPageInput.value = parseFloat(cells[3].textContent.replace('₱', '').replace(/,/g, ''));

    // FIX: Parse the total, then format it to 2 decimal places before assigning
    const parsedTotal = parseFloat(cells[4].textContent.replace('₱', '').replace(/,/g, ''));
    totalInput.value = parsedTotal.toFixed(2); // <-- MODIFIED LINE

    // Store reference to the row being edited for update
    addItemBtn.dataset.editingRowIndex = row.rowIndex;
    addItemBtn.textContent = 'Update Item';
    addItemBtn.classList.remove('primary-btn');
    addItemBtn.classList.add('info-btn');
    addItemBtn.disabled = false;
    addItemBtn.classList.remove('disabled');

    row.remove(); // Remove the row after copying its content (it will be re-added/updated)
}


// 5. Delete Item from "Items in Transaction" Table (Frontend Only)
function deleteItem(button) {
    if (confirm("Are you sure you want to delete this item?")) {
        button.closest('tr').remove();
    }
}


// 6. Confirm Transaction (Will send data to Backend via Fetch API)
async function confirmTransaction() {
    const items = [];
    itemsInTransactionTableBody.querySelectorAll('tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        items.push({
            paperType: cells[0].textContent,
            color: cells[1].textContent,
            pages: parseInt(cells[2].textContent),
            pricePerPage: parseFloat(cells[3].textContent.replace('₱', '').replace(/,/g, '')),
            itemTotal: parseFloat(cells[4].textContent.replace('₱', '').replace(/,/g, ''))
        });
    });

    if (items.length === 0) {
        alert("Please add items to the transaction before confirming.");
        return;
    }

    // Here, you would send this 'items' data to your backend (C# ASP.NET Core)
    // using Fetch API or Axios.
    try {
        const response = await fetch('/confirm-transaction', { // Replace with your actual backend endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items: items })
        });

        if (response.ok) {
            const data = await response.json(); // Backend might return the saved transaction data or a confirmation
            alert(data.message || "Transaction confirmed successfully!");
            itemsInTransactionTableBody.innerHTML = ''; // Clear items table
            loadRecords(); // Reload records from backend
            updateSalesSummary(); // Refresh sales summary
        } else {
            const errorData = await response.json();
            alert(`Error confirming transaction: ${errorData.message || response.statusText}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while communicating with the server.');
    }
}


// 7. Load Records (From Backend via Fetch API)
async function loadRecords() {
    try {
        const response = await fetch('/get-records'); // Replace with your actual backend endpoint
        if (response.ok) {
            const records = await response.json();
            recordTableBody.innerHTML = ''; // Clear existing records
            records.forEach(record => {
                const row = recordTableBody.insertRow();
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
                // Attach right-click listener for delete (if desired later)
                // row.addEventListener('contextmenu', (e) => handleRecordRightClick(e, record.id));
            });
        } else {
            console.error('Failed to load records:', response.statusText);
        }
    } catch (error) {
        console.error('Error loading records:', error);
    }
}


// 8. Update Sales Summary (From Backend via Fetch API)
async function updateSalesSummary() {
    try {
        const response = await fetch('/get-sales-summary');
        if (response.ok) {
            const summary = await response.json();

            const today = new Date();
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            todayIncomeSpan.textContent = formatCurrency(summary.todayIncome);
            todayDateSpan.textContent = `(${today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })})`;

            monthIncomeSpan.textContent = formatCurrency(summary.monthIncome);
            monthDateSpan.textContent = `(${monthNames[today.getMonth()]} ${today.getFullYear()})`;

            yearIncomeSpan.textContent = formatCurrency(summary.yearIncome);
            yearDateSpan.textContent = `(${today.getFullYear()})`;

            // --- NEW: Populate new summary details ---
            summaryTotalPagesSpan.textContent = summary.totalPages;
            summaryNumTransactionsSpan.textContent = summary.numTransactions;
            summaryTotalShortPagesSpan.textContent = summary.totalShortPages;
            summaryTotalLongPagesSpan.textContent = summary.totalLongPages;
            summaryTotalA4PagesSpan.textContent = summary.totalA4Pages;
            summaryTotalPhotoPaperPagesSpan.textContent = summary.totalPhotoPaperPages;
            summaryTotalBlackPagesSpan.textContent = summary.totalBlackPages;
            summaryTotalColoredPagesSpan.textContent = summary.totalColoredPages;
            // --- END NEW ---

        } else {
            console.error('Failed to load sales summary:', response.statusText);
        }
    } catch (error) {
        console.error('Error loading sales summary:', error);
    }
}


// 9. Reset Records (Send to Backend)
async function resetRecords() {
    if (confirm("Are you sure you want to delete ALL sales records?\nThis action cannot be undone.")) {
        try {
            const response = await fetch('/reset-records', {
                method: 'POST'
            });

            if (response.ok) {
                alert("All records deleted successfully!");
                recordTableBody.innerHTML = ''; // Clear table
                updateSalesSummary(); // Update summary to zeros
            } else {
                const errorData = await response.json();
                alert(`Error resetting records: ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            console.error('Error resetting records:', error);
            alert('An error occurred while communicating with the server.');
        }
    }
}


// --- Event Listeners Setup ---
function setupEventListeners() {
    // Input field change listeners for auto-calculation and button enable/disable
    paperTypeSelect.addEventListener('change', calculateTotal);
    colorSelect.addEventListener('change', calculateTotal);
    pagesInput.addEventListener('input', calculateTotal);
    pricePerPageInput.addEventListener('input', calculateTotal);

    // Add Item Button
    addItemBtn.addEventListener('click', () => {
        // If button is 'Update Item', perform update logic
        if (addItemBtn.textContent === 'Update Item') {
            // In a real scenario, you'd likely update the row's content directly
            // For simplicity here, we re-add via addItem and remove the old row in editItem
            addItem();
            addItemBtn.textContent = 'Add Item';
            addItemBtn.classList.remove('info-btn'); // Remove yellow/orange
            addItemBtn.classList.add('primary-btn'); // Add green
        } else {
            addItem();
        }
    });

    // Confirm Transaction Button
    confirmTransactionBtn.addEventListener('click', confirmTransaction);

    // Sidebar navigation buttons (for navigation between index.html and report.html)
    document.getElementById('transactionNavBtn').addEventListener('click', () => {
        window.location.href = '/'; // Navigate to main transaction page
    });
    document.getElementById('reportNavBtn').addEventListener('click', () => {
        window.location.href = '/report'; // Navigate to report page
    });

    document.getElementById('ordersNavBtn').addEventListener('click', () => {
        window.location.href = '/shop-orders';
    });

    document.getElementById('placeOrderNavBtn').addEventListener('click', () => {
        window.open('/customer-order', '_blank'); // <--- MODIFIED LINE: Opens in a new tab
    });

    // Reset Button
    document.getElementById('resetRecordsBtn').addEventListener('click', resetRecords);
}

// --- Initial setup calls for JavaScript functions once the page loads ---
document.addEventListener('DOMContentLoaded', () => {
    updateDateTime(); // Start updating date/time
    loadRecords(); // Load existing records
    updateSalesSummary(); // Update initial sales summary
    setupEventListeners(); // Setup input validation and calculation
});