// --- Global Elements for Shop Orders Page ---
const currentDateTimeSpan = document.getElementById('currentDateTime'); // Reused from main script

const orderStatusFilter = document.getElementById('orderStatusFilter');
const refreshOrdersBtn = document.getElementById('refreshOrdersBtn');
const ordersTableBody = document.getElementById('ordersTableBody');

const prevOrderPageBtn = document.getElementById('prevOrderPageBtn');
const nextOrderPageBtn = document.getElementById('nextOrderPageBtn');
const orderPageNumbersContainer = document.getElementById('orderPageNumbers');

let currentOrderPage = 1;
let totalOrderPages = 1;


// --- Utility Functions (Consistent with other scripts) ---
// Copy these utility functions from script.js or report_script.js to ensure they are available
function formatCurrency(amount) {
    return `₱${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
}

function formatTime(timeString) {
    // console.log("DEBUG: formatTime input timeString =", timeString); // Keep for debugging

    if (!timeString) {
        return "N/A";
    }

    let date = new Date();
    date.setSeconds(0);
    date.setMilliseconds(0);

    const ampmMatch = timeString.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
    if (ampmMatch) {
        let hours = parseInt(ampmMatch[1]);
        const minutes = parseInt(ampmMatch[2]);
        const ampm = ampmMatch[3].toUpperCase();

        if (ampm === 'PM' && hours < 12) {
            hours += 12;
        }
        if (ampm === 'AM' && hours === 12) {
            hours = 0;
        }

        date.setHours(hours);
        date.setMinutes(minutes);
    }
    else if (timeString.includes(':')) {
        const parts = timeString.split(':');
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const seconds = parseInt(parts[2] || '0');

        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
            console.error("DEBUG: Invalid numeric parts in timeString (24hr parse):", timeString);
            return "Invalid Time Value";
        }

        date.setHours(hours);
        date.setMinutes(minutes);
        date.setSeconds(seconds);
    }
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

function updateDateTime() { // Reused from main script
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    currentDateTimeSpan.textContent = `${date} — ${time}`;
    setTimeout(updateDateTime, 1000);
}


// --- Main Orders Logic ---

async function loadOrders(page = 1) {
    currentOrderPage = page;
    const statusFilter = orderStatusFilter.value;

    try {
        const response = await fetch(`/get-customer-orders?page=${currentOrderPage}&status=${statusFilter}`);
        if (response.ok) {
            const data = await response.json();
            const orders = data.orders;
            const pagination = data.pagination;

            ordersTableBody.innerHTML = ''; // Clear existing orders
            if (orders.length === 0) {
                const row = ordersTableBody.insertRow();
                row.innerHTML = `<td colspan="8" style="text-align: center;">No order requests found.</td>`;
            } else {
                orders.forEach(order => {
                    const row = ordersTableBody.insertRow();
                    // Store full order data on the row for easy access during actions
                    row.dataset.orderData = JSON.stringify(order);

                    // Build items list for Notes column or a popup
                    let itemsHtml = '<ul>';
                    order.items.forEach(item => {
                        itemsHtml += `<li>${item.pages} ${item.paperType} (${item.color}) @ ${formatCurrency(item.pricePerPage)} = ${formatCurrency(item.itemTotal)}</li>`;
                    });
                    itemsHtml += '</ul>';

                    row.innerHTML = `
                        <td>${order.requestId}</td>
                        <td>${formatDate(order.requestDate.split(' ')[0])} ${formatTime(order.requestDate.split(' ')[1])}</td>
                        <td>${order.customerName}</td>
                        <td>${order.fileName}</td>
                        <td class="url-column">${order.fileUrl ? `<a href="${order.fileUrl}" target="_blank" rel="noopener noreferrer" class="file-url-link">🔗 Link</a>` : 'N/A'}</td>
                        <td class="notes-column">${order.note || 'N/A'} ${itemsHtml}</td> <!-- Combine notes and items here -->
                        <td>${order.status}</td>
                        <td class="action-buttons">
                            ${order.status === 'Pending' ? `<button class="primary-btn" onclick="processOrder(${order.requestId})">Process</button>` : ''}
                            ${order.status === 'Pending' ? `<button class="danger-btn" onclick="rejectOrder(${order.requestId})">Reject</button>` : ''}
                            <button class="secondary-btn" onclick="viewOrderDetails(${order.requestId})">View</button>
                        </td>
                    `;
                });
            }

            // Update pagination controls
            totalOrderPages = pagination.totalPages;
            renderOrderPaginationControls();

        } else {
            console.error('Failed to load orders:', response.statusText);
            alert(`Error loading orders: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        alert('An error occurred while communicating with the server for orders.');
    }
}
//YAWA KA
function renderOrderPaginationControls() {
    orderPageNumbersContainer.innerHTML = '';

    for (let i = 1; i <= totalOrderPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.classList.add('page-number-btn');
        if (i === currentOrderPage) {
            pageBtn.classList.add('active');
        }
        pageBtn.addEventListener('click', () => loadOrders(i));
        orderPageNumbersContainer.appendChild(pageBtn);
    }

    if (currentOrderPage > 1) {
        prevOrderPageBtn.classList.remove('disabled');
        prevOrderPageBtn.disabled = false;
    } else {
        prevOrderPageBtn.classList.add('disabled');
        prevOrderPageBtn.disabled = true;
    }

    if (currentOrderPage < totalOrderPages) {
        nextOrderPageBtn.classList.remove('disabled');
        nextOrderPageBtn.disabled = false;
    } else {
        nextOrderPageBtn.classList.add('disabled');
        nextOrderPageBtn.disabled = true;
    }
}

// --- Order Actions (to be implemented on backend) ---
async function processOrder(requestId) {
    if (confirm(`Are you sure you want to process order request ID ${requestId}? This will create a new transaction.`)) {
        try {
            const response = await fetch(`/process-order/${requestId}`, { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                alert(data.message);
                loadOrders(currentOrderPage); // Reload current page to update status
                // Optionally, redirect to transaction page with pre-filled data
                // window.location.href = `/transaction?loadRequest=${requestId}`;
            } else {
                const errorData = await response.json();
                alert(`Error processing order: ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            console.error('Error processing order:', error);
            alert('An error occurred while communicating with the server.');
        }
    }
}

async function rejectOrder(requestId) {
    if (confirm(`Are you sure you want to reject order request ID ${requestId}?`)) {
        try {
            const response = await fetch(`/reject-order/${requestId}`, { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                alert(data.message);
                loadOrders(currentOrderPage); // Reload current page to update status
            } else {
                const errorData = await response.json();
                alert(`Error rejecting order: ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            console.error('Error rejecting order:', error);
            alert('An error occurred while communicating with the server.');
        }
    }
}

function viewOrderDetails(requestId) {
    // Find the order data from the currently loaded table rows
    const row = Array.from(ordersTableBody.querySelectorAll('tr')).find(r => JSON.parse(r.dataset.orderData).requestId === requestId);
    if (row) {
        const order = JSON.parse(row.dataset.orderData);
        let details = `Order ID: ${order.requestId}\n`;
        details += `Customer: ${order.customerName}\n`;
        details += `File: ${order.fileName}\n`;
        details += `URL: ${order.fileUrl || 'N/A'}\n`;
        details += `Notes: ${order.note || 'N/A'}\n`;
        details += `Status: ${order.status}\n`;
        details += `Request Date: ${order.requestDate}\n\n`;
        details += `Items:\n`;
        order.items.forEach(item => {
            details += `- ${item.pages} ${item.paperType} (${item.color}) @ ${formatCurrency(item.pricePerPage)} = ${formatCurrency(item.itemTotal)}\n`;
        });
        alert(details); // Simple alert for now, can be a modal later
    } else {
        alert("Order details not found.");
    }
}


// --- Event Listeners Setup ---
function setupOrdersEventListeners() {
    orderStatusFilter.addEventListener('change', () => loadOrders(1)); // Filter changes, go to page 1
    refreshOrdersBtn.addEventListener('click', () => loadOrders(1)); // Refresh, go to page 1

    prevOrderPageBtn.addEventListener('click', () => {
        if (currentOrderPage > 1) {
            loadOrders(currentOrderPage - 1);
        }
    });

    nextOrderPageBtn.addEventListener('click', () => {
        if (currentOrderPage < totalOrderPages) {
            loadOrders(currentOrderPage + 1);
        }
    });

    // Sidebar navigation buttons (consistent with other pages)
    document.getElementById('transactionNavBtn').addEventListener('click', () => {
        window.location.href = '/';
    });
    document.getElementById('reportNavBtn').addEventListener('click', () => {
        window.location.href = '/report';
    });
    document.getElementById('ordersNavBtn').addEventListener('click', () => {
        // Already on Orders page
    });
    document.getElementById('placeOrderNavBtn').addEventListener('click', () => {
        window.open('/customer-order', '_blank'); // Opens in a new tab
    });
    document.getElementById('resetRecordsBtn').addEventListener('click', () => {
        if (confirm("Are you sure you want to delete ALL sales records?\nThis action cannot be undone.")) {
            fetch('/reset-records', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    if (response.ok) {
                        window.location.reload();
                    }
                })
                .catch(error => console.error('Error resetting records:', error));
        }
    });
}