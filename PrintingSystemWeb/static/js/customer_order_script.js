// --- Global Elements ---
const currentDateTimeSpan = document.getElementById('currentDateTime');

// Customer Info Fields
const customerNameInput = document.getElementById('customerName');
const fileNameInput = document.getElementById('fileName'); // Still the problematic input
const fileUrlInput = document.getElementById('fileUrl');
const noteInput = document.getElementById('note');

// Printing Item Input Fields (reused IDs from script.js)
const paperTypeSelect = document.getElementById('paperType');
const colorSelect = document.getElementById('color');
const pagesInput = document.getElementById('pages');
const pricePerPageInput = document.getElementById('pricePerPage');
const totalInput = document.getElementById('total');
const addItemBtn = document.getElementById('addItemBtn');
const itemsInTransactionTableBody = document.getElementById('itemsInTransactionTableBody');

// Submit Button
const submitOrderBtn = document.getElementById('submitOrderBtn');


// --- NEW DEBUGGING FOCUS: Explicitly test and log fileNameInput.value on input event ---
fileNameInput.addEventListener('input', () => {
    const rawValue = fileNameInput.value;
    const trimmedValue = rawValue.trim();
    console.log("DEBUG INPUT EVENT: fileNameInput value changed!");
    console.log("  Raw value:", `"${rawValue}"`, "Length:", rawValue.length);
    console.log("  Trimmed value:", `"${trimmedValue}"`, "Length:", trimmedValue.length);

    // This part tries to force the HTML value attribute, as a workaround
    if (fileNameInput.getAttribute('value') !== rawValue) {
        fileNameInput.setAttribute('value', rawValue);
        console.log("DEBUG INPUT EVENT: Forced HTML 'value' attribute to:", `"${rawValue}"`);
    }

    // Call calculateTotal for general input field behavior
    calculateTotal();
});
// --- END NEW DEBUGGING FOCUS ---


// --- Utility Functions (consistent) ---
function formatCurrency(amount) {
    return `₱${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function updateDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    currentDateTimeSpan.textContent = `${date} — ${time}`;
    setTimeout(updateDateTime, 1000);
}

// --- Printing Item Logic (adapted) ---
function getAutomatedPricePerPage(paperType, color, pages) {
    let price = 0;
    const pType = paperType ? paperType.toLowerCase() : '';
    const col = color ? color.toLowerCase() : '';
    if (pType && col) {
        if (pType === 'short') { price = (col === 'black') ? 1.00 : 2.00; }
        else if (pType === 'long') { price = (col === 'black') ? 1.50 : 3.00; }
        else if (pType === 'a4') { price = (col === 'black') ? 1.20 : 2.50; }
        else if (pType === 'photopaper') { price = (col === 'black') ? 5.00 : 8.00; }
    }
    return price;
}

function calculateTotal() {
    const paperType = paperTypeSelect.value;
    const color = colorSelect.value;
    const pages = parseInt(pagesInput.value);
    const automatedPricePerPage = getAutomatedPricePerPage(paperType, color, pages);

    if (automatedPricePerPage > 0 && !isNaN(pages) && pages > 0) {
        pricePerPageInput.value = automatedPricePerPage.toFixed(2);
        pricePerPageInput.disabled = false;
        pricePerPageInput.classList.remove('disabled');
    } else {
        pricePerPageInput.value = '';
        pricePerPageInput.disabled = true;
        pricePerPageInput.classList.add('disabled');
    }

    if (!isNaN(pages) && pages > 0 && automatedPricePerPage > 0) {
        const total = pages * automatedPricePerPage;
        totalInput.value = total.toFixed(2);
        addItemBtn.classList.remove('disabled');
        addItemBtn.disabled = false;
    } else {
        totalInput.value = '';
        addItemBtn.classList.add('disabled');
        addItemBtn.disabled = true;
    }
}

function addItem() {
    let customerName = customerNameInput.value.trim();
    let fileName = fileNameInput.value.trim();
    let fileUrl = fileUrlInput.value.trim();
    let note = noteInput.value.trim();
    let paperType = paperTypeSelect.value;
    let color = colorSelect.value;
    let pages = pagesInput.value;
    let pricePerPage = pricePerPageInput.value;
    let total = totalInput.value;

    if (!paperType || !color || !pages || !pricePerPage || !total) {
        alert("Please fill in all printing item details.");
        return;
    }

    const row = itemsInTransactionTableBody.insertRow();
    row.dataset.originalValues = JSON.stringify({ customerName, fileName, fileUrl, note, paperType, color, pages, pricePerPage, total });

    row.innerHTML = `
        <td>${customerName}</td>
        <td class="file-name-column">${fileName}</td>
        <td class="url-column">
            ${fileUrl ? `<a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="file-url-link">🔗 Link</a>` : 'N/A'}
        </td>
        <td class="notes-column">${note || 'N/A'}</td>
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

    fileNameInput.value = ''; // Clear file name
    fileUrlInput.value = '';
    noteInput.value = '';

    paperTypeSelect.value = '';
    colorSelect.value = '';
    pagesInput.value = '';
    pricePerPageInput.value = '';
    totalInput.value = '';

    addItemBtn.classList.add('disabled');
    addItemBtn.disabled = true;
    addItemBtn.textContent = 'Add Item';
    addItemBtn.classList.remove('info-btn');
    addItemBtn.classList.add('primary-btn');
}

function editItem(button) {
    const row = button.closest('tr');
    const values = JSON.parse(row.dataset.originalValues);

    customerNameInput.value = values.customerName;
    fileNameInput.value = values.fileName;
    fileUrlInput.value = values.fileUrl;
    noteInput.value = values.note;

    paperTypeSelect.value = values.paperType;
    colorSelect.value = values.color;
    pagesInput.value = values.pages;

    pricePerPageInput.value = parseFloat(values.pricePerPage).toFixed(2);
    pricePerPageInput.disabled = true;
    pricePerPageInput.classList.add('disabled');

    const parsedTotal = parseFloat(values.total);
    totalInput.value = parsedTotal.toFixed(2);

    addItemBtn.dataset.editingRowIndex = row.rowIndex;
    addItemBtn.textContent = 'Update Item';
    addItemBtn.classList.remove('primary-btn');
    addItemBtn.classList.add('info-btn');
    addItemBtn.disabled = false;
    addItemBtn.classList.remove('disabled');

    row.remove();
}

function deleteItem(button) {
    if (confirm("Are you sure you want to delete this item?")) {
        button.closest('tr').remove();
    }
}

// --- Submit Customer Order Logic ---
async function submitOrderRequest() {
    // --- Get CURRENT customer info field values from inputs ---
    // Make variables optional, default to 'N/A' if empty after trim
    const customerName = customerNameInput.value.trim() || 'N/A'; // MODIFIED: Optional, defaults to 'N/A'
    const fileName = fileNameInput.value.trim() || 'N/A';         // MODIFIED: Optional, defaults to 'N/A'
    const fileUrl = fileUrlInput.value.trim() || 'N/A';           // MODIFIED: Optional, defaults to 'N/A'
    const note = noteInput.value.trim() || 'N/A';                 // MODIFIED: Optional, defaults to 'N/A'

    // --- In-depth Debugging (keep for your reference, or remove if confident) ---
    console.log("DEBUG: Submit Order Validation Check - File Name Diagnostics:");
    console.log("  1. customerNameInput element:", customerNameInput);
    console.log("  2. customerNameInput.value (raw):", `"${customerNameInput.value}"`);
    console.log("  3. customerNameInput.value.length (raw):", customerNameInput.value.length);

    console.log("  4. fileNameInput element:", fileNameInput);
    console.log("  5. fileNameInput.value (raw):", `"${fileNameInput.value}"`);
    console.log("  6. fileNameInput.value.length (raw):", fileNameInput.value.length);

    console.log("  7. Customer Name (processed):", `"${customerName}"`); // Now it will be 'N/A' if empty
    console.log("  8. File Name (processed):", `"${fileName}"`);         // Now it will be 'N/A' if empty
    console.log("  9. File Name (processed) length:", fileName.length);
    // --- End In-depth Debugging ---


    // --- Validation Logic (MODIFIED: Removed checks for customerName and fileName) ---
    // if (!customerName || !fileName) { // OLD validation
    //     alert("Please enter your Name and File Name/Description.");
    //     return;
    // }
    // No explicit return here, as per your request to submit without restriction on these fields

    const requestedItems = [];
    itemsInTransactionTableBody.querySelectorAll('tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        requestedItems.push({
            paperType: cells[4].textContent,
            color: cells[5].textContent,
            pages: parseInt(cells[6].textContent),
            pricePerPage: parseFloat(cells[7].textContent.replace('₱', '').replace(/,/g, '')),
            itemTotal: parseFloat(cells[8].textContent.replace('₱', '').replace(/,/g, ''))
        });
    });

    if (requestedItems.length === 0) {
        alert("Please add at least one printing item to your request.");
        return;
    }

    // --- Send Data to Backend ---
    try {
        const response = await fetch('/submit-customer-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customerName: customerName,
                fileName: fileName,
                fileUrl: fileUrl,
                note: note,
                items: requestedItems
            })
        });

        if (response.ok) {
            const data = await response.json();
            alert(data.message || "Your order request has been submitted successfully!");
            // Clear form after successful submission
            customerNameInput.value = ''; // This will remain empty if user wants
            fileNameInput.value = '';
            fileUrlInput.value = '';
            noteInput.value = '';
            itemsInTransactionTableBody.innerHTML = ''; // Clear requested items table
        } else {
            const errorData = await response.json();
            alert(`Error submitting order: ${errorData.message || response.statusText}`);
        }
    } catch (error) {
        console.error('Error submitting order:', error);
        alert('An error occurred while communicating with the server to submit your order.');
    }
}

// --- Event Listeners Setup ---
function setupCustomerOrderEventListeners() {
    paperTypeSelect.addEventListener('change', calculateTotal);
    colorSelect.addEventListener('change', calculateTotal);
    pagesInput.addEventListener('input', calculateTotal);

    addItemBtn.addEventListener('click', addItem);
    submitOrderBtn.addEventListener('click', submitOrderRequest);
}
function getAutomatedPricePerPage(paperType, color, pages) {
    let price = 0;
    const pType = paperType ? paperType.toLowerCase() : '';
    const col = color ? color.toLowerCase() : '';
    if (pType && col) {
        if (pType === 'short') { price = (col === 'black') ? 1.00 : 2.00; }
        else if (pType === 'long') { price = (col === 'black') ? 1.50 : 3.00; }
        else if (pType === 'a4') { price = (col === 'black') ? 1.20 : 2.50; }
        else if (pType === 'photopaper') { price = (col === 'black') ? 5.00 : 8.00; }
    }
    return price;
}
document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    setupCustomerOrderEventListeners();
});