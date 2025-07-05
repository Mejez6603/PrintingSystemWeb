# PrintingSystemWeb/views.py

from flask import render_template, request, jsonify
from PrintingSystemWeb import app, db, TransactionHeader, TransactionItem, CustomerOrderRequest, CustomerOrderItem
from datetime import datetime, timedelta, timezone
import csv
import os


# --- Helper functions (adapted from your sales_report.py) ---
def generate_daily_sales_report(target_date):
    """Calculates total sales for a specific date (datetime.date object)."""
    total = db.session.query(db.func.sum(TransactionItem.item_total)).join(TransactionHeader).filter(
        TransactionHeader.transaction_date == target_date
    ).scalar() or 0.0
    return float(total)

def generate_monthly_sales_report(target_month_year):
    """Calculates total sales for a specific month (MM/YYYY string)."""
    month, year = map(int, target_month_year.split('/'))
    start_date = datetime(year, month, 1).date()
    if month == 12:
        end_date = datetime(year + 1, 1, 1).date() - timedelta(days=1)
    else:
        end_date = datetime(year, month + 1, 1).date() - timedelta(days=1)

    total = db.session.query(db.func.sum(TransactionItem.item_total)).join(TransactionHeader).filter(
        TransactionHeader.transaction_date >= start_date,
        TransactionHeader.transaction_date <= end_date
    ).scalar() or 0.0
    return float(total)

def filter_records_by_date(from_date_str, to_date_str):
    """
    Retrieves all TransactionItems between two dates (MM/DD/YYYY strings).
    Returns a SQLAlchemy query object (not yet executed) for pagination.
    """
    from_dt = datetime.strptime(from_date_str, "%m/%d/%Y").date()
    to_dt = datetime.strptime(to_date_str, "%m/%d/%Y").date()

    query = TransactionItem.query.join(TransactionHeader).filter(
        TransactionHeader.transaction_date >= from_dt,
        TransactionHeader.transaction_date <= to_dt
    ).order_by(
        TransactionHeader.transaction_date.desc(),
        TransactionHeader.transaction_time.desc()
    )
    return query


# --- Web Routes (API Endpoints for your Frontend) ---

# Home Route (Serves the main transaction HTML page)
@app.route('/')
@app.route('/home')
def index():
    return render_template('index.html')


# Route for the Sales Report HTML page
@app.route('/report')
def report_page():
    return render_template('report.html')

# NEW: Route for the Shop Orders HTML page (to view customer requests)
@app.route('/shop-orders')
def shop_orders_page():
    # This will render a new HTML file you'll create later
    return render_template('shop_orders.html')

# API to confirm a transaction and save to DB
@app.route('/confirm-transaction', methods=['POST'])
def confirm_transaction_api():
    data = request.get_json()
    items_data = data.get('items', [])

    if not items_data:
        return jsonify({'message': 'No items provided for transaction'}), 400

    try:
        now_utc = datetime.now(timezone.utc) # NEW: Use timezone.utc
        transaction_id = f"TRX-{now_utc.strftime('%Y%m%d-%H%M%S')}"
        
        total_transaction_amount = sum(item['itemTotal'] for item in items_data)

        header = TransactionHeader(
            id=transaction_id,
            transaction_date=now_utc.date(), # Store date part from UTC
            transaction_time=now_utc.time(), # Store time part from UTC
            total_amount=total_transaction_amount
        )
        db.session.add(header)
        db.session.flush()

        for item_data in items_data:
            item = TransactionItem(
                transaction_header_id=transaction_id,
                paper_type=item_data['paperType'],
                color=item_data['color'],
                pages=item_data['pages'],
                price_per_page=item_data['pricePerPage'],
                item_total=item_data['itemTotal']
            )
            db.session.add(item)
        
        db.session.commit()
        return jsonify({'message': 'Transaction confirmed and saved!', 'transactionId': transaction_id}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to confirm transaction: {str(e)}'}), 500

# NEW: Customer Order Page Route
@app.route('/customer-order')
def customer_order_page():
    return render_template('customer_order.html')

# NEW: API to submit a customer order request
@app.route('/submit-customer-order', methods=['POST'])
def submit_customer_order_api():
    data = request.get_json()
    print(f"DEBUG: Received customer order data: {data}") # NEW DEBUG
    customer_name = data.get('customerName')
    file_name = data.get('fileName')
    file_url = data.get('fileUrl')
    note = data.get('note')
    print(f"DEBUG: Extracted fileName: '{file_name}', fileUrl: '{file_url}', note: '{note}'") # NEW DEBUG
    items_data = data.get('items', [])

    if not customer_name or not file_name or not items_data:
        return jsonify({'message': 'Missing required customer info or items.'}), 400

    try:
        # Create CustomerOrderRequest header
        order_request = CustomerOrderRequest(
            customer_name=customer_name,
            file_name=file_name,
            file_url=file_url,
            note=note,
            request_date=datetime.now(), # Use current datetime for request_date
            status='Pending' # Default status
        )
        db.session.add(order_request)
        db.session.flush() # Flush to get request_id before adding items

        # Create CustomerOrderItems
        for item_data in items_data:
            item = CustomerOrderItem(
                request_header_id=order_request.request_id, # Link to the new request
                paper_type=item_data['paperType'],
                color=item_data['color'],
                pages=item_data['pages'],
                price_per_page=item_data['pricePerPage'],
                item_total=item_data['itemTotal']
            )
            db.session.add(item)

        db.session.commit()
        return jsonify({'message': 'Order request submitted successfully!', 'requestId': order_request.request_id}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to submit order request: {str(e)}'}), 500


# API to get all records for the main record table
@app.route('/get-records', methods=['GET'])
def get_records_api():
    all_items = TransactionItem.query.join(TransactionHeader).order_by(
        TransactionHeader.transaction_date.desc(),
        TransactionHeader.transaction_time.desc()
    ).all()
    
    return jsonify([item.to_dict() for item in all_items]), 200


# API to get quick sales summary (for index.html)
@app.route('/get-sales-summary', methods=['GET'])
def get_sales_summary_api():
    today = datetime.now().date()
    this_month_start = today.replace(day=1)
    this_year_start = today.replace(month=1, day=1)

    today_income = generate_daily_sales_report(today)
    month_income = generate_monthly_sales_report(today.strftime("%m/%Y"))
    year_income = sum(generate_monthly_sales_report(f"{m:02}/{today.year}") for m in range(1, 13))

    # --- Fetch all items to calculate detailed summaries ---
    all_items_in_db = TransactionItem.query.all()

    total_pages = 0
    num_transactions = set()
    total_short_pages = 0
    total_long_pages = 0
    total_a4_pages = 0
    total_photopaper_pages = 0
    total_black_pages = 0
    total_colored_pages = 0

    for item in all_items_in_db:
        total_pages += item.pages
        num_transactions.add(item.transaction_header_id)

        if item.paper_type.lower() == 'short':
            total_short_pages += item.pages
        elif item.paper_type.lower() == 'long':
            total_long_pages += item.pages
        elif item.paper_type.lower() == 'a4':
            total_a4_pages += item.pages
        elif item.paper_type.lower() == 'photopaper':
            total_photopaper_pages += item.pages
        
        if item.color.lower() == 'black':
            total_black_pages += item.pages
        elif item.color.lower() == 'colored':
            total_colored_pages += item.pages
    
    return jsonify({
        'todayIncome': float(today_income),
        'monthIncome': float(month_income),
        'yearIncome': float(year_income),
        'totalPages': total_pages,
        'numTransactions': len(num_transactions),
        'totalShortPages': total_short_pages,
        'totalLongPages': total_long_pages,
        'totalA4Pages': total_a4_pages,
        'totalPhotoPaperPages': total_photopaper_pages,
        'totalBlackPages': total_black_pages,
        'totalColoredPages': total_colored_pages
    }), 200

# API for detailed sales report (for report.html)
@app.route('/get-detailed-report', methods=['GET'])
def get_detailed_report_api():
    from_date_str = request.args.get('fromDate')
    to_date_str = request.args.get('toDate')
    page = request.args.get('page', 1, type=int) # Get page number, default to 1
    per_page = 10 # Define items per page

    if not from_date_str or not to_date_str:
        return jsonify({'message': 'Missing date parameters'}), 400

    base_query = filter_records_by_date(from_date_str, to_date_str)

    pagination = base_query.paginate(page=page, per_page=per_page, error_out=False)
    
    paginated_records = [item.to_dict() for item in pagination.items]

    all_records_for_summary = base_query.all() # Get all records without pagination for summary
    
    total_sales = 0.0
    total_pages = 0
    unique_transaction_ids = set()
    total_short_pages = 0
    total_long_pages = 0
    total_a4_pages = 0
    total_photopaper_pages = 0
    total_black_pages = 0
    total_colored_pages = 0

    for record in all_records_for_summary:
        total_sales += float(record.item_total)
        pages = record.pages
        total_pages += pages
        unique_transaction_ids.add(record.transaction_header_id)

        if record.paper_type.lower() == 'short':
            total_short_pages += pages
        elif record.paper_type.lower() == 'long':
            total_long_pages += pages
        elif record.paper_type.lower() == 'a4':
            total_a4_pages += pages
        elif record.paper_type.lower() == 'photopaper':
            total_photopaper_pages += pages
        
        if record.color.lower() == 'black':
            total_black_pages += pages
        elif record.color.lower() == 'colored':
            total_colored_pages += pages
    
    summary_stats = {
        'totalSales': total_sales,
        'totalPages': total_pages,
        'numTransactions': len(unique_transaction_ids),
        'totalShortPages': total_short_pages,
        'totalLongPages': total_long_pages,
        'totalA4Pages': total_a4_pages,
        'totalPhotoPaperPages': total_photopaper_pages,
        'totalBlackPages': total_black_pages,
        'totalColoredPages': total_colored_pages
    }

    return jsonify({
        'records': paginated_records,
        'summary': summary_stats,
        'pagination': {
            'currentPage': pagination.page,
            'totalPages': pagination.pages,
            'totalItems': pagination.total,
            'perPage': pagination.per_page
        }
    }), 200


# API to reset records
@app.route('/reset-records', methods=['POST'])
def reset_records_api():
    try:
        db.session.query(TransactionItem).delete()
        db.session.query(TransactionHeader).delete()
        db.session.commit()
        return jsonify({'message': 'All records deleted successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to reset records: {str(e)}'}), 500


# API to migrate data from old records.csv (Run Once)
@app.route('/migrate-data')
def migrate_data():
    base_proj_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    old_csv_path = os.path.join(base_proj_dir, "database", "records.csv")

    if not os.path.exists(old_csv_path):
        return jsonify({'message': f'Error: records.csv not found at {old_csv_path}. Please place it there for migration.'}), 404

    try:
        with open(old_csv_path, 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            next(reader) # Skip header

            transactions_by_id = {}
            for row in reader:
                if len(row) < 8:
                    print(f"Skipping malformed row during migration: {row}")
                    continue

                trans_id = row[0]
                if trans_id not in transactions_by_id:
                    transactions_by_id[trans_id] = {
                        'date_str': row[1],
                        'time_str': row[2],
                        'items': []
                    }
                transactions_by_id[trans_id]['items'].append(row)

            migrated_transaction_count = 0
            for trans_id, trans_data in transactions_by_id.items():
                existing_header = TransactionHeader.query.get(trans_id)
                if existing_header:
                    print(f"Skipping existing transaction header {trans_id}")
                    continue

                total_header_amount = 0.0
                for item_row in trans_data['items']:
                    try:
                        total_header_amount += float(item_row[7])
                    except ValueError: pass
                
                header = TransactionHeader(
                    id=trans_id,
                    transaction_date=datetime.strptime(trans_data['date_str'], "%m/%d/%Y").date(),
                    transaction_time=datetime.strptime(trans_data['time_str'], "%I:%M%p").time(),
                    total_amount=total_header_amount
                )
                db.session.add(header)

                for item_row in trans_data['items']:
                    item = TransactionItem(
                        transaction_header_id=trans_id,
                        paper_type=item_row[3],
                        color=item_row[4],
                        pages=int(item_row[5]),
                        price_per_page=float(item_row[6]),
                        item_total=float(item_row[7])
                    )
                    db.session.add(item)
                migrated_transaction_count += 1
            
            db.session.commit()
            return jsonify({'message': f'Successfully migrated {migrated_transaction_count} new transactions.'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Migration failed: {str(e)}'}), 500

@app.route('/get-customer-orders', methods=['GET'])
def get_customer_orders_api():
    status_filter = request.args.get('status', 'All')
    page = request.args.get('page', 1, type=int)
    per_page = 10 # Define items per page for orders list

    query = CustomerOrderRequest.query.order_by(CustomerOrderRequest.request_date.desc())

    if status_filter != 'All':
        query = query.filter_by(status=status_filter)
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    orders_data = [order.to_dict() for order in pagination.items]
    print(f"DEBUG: Orders data being sent to frontend: {orders_data}")
    return jsonify({
        'orders': orders_data,
        'pagination': {
            'currentPage': pagination.page,
            'totalPages': pagination.pages,
            'totalItems': pagination.total,
            'perPage': pagination.per_page
        }
    }), 200

# API to process a customer order request
@app.route('/process-order/<int:request_id>', methods=['POST'])
def process_order_api(request_id):
    try:
        order_request = CustomerOrderRequest.query.get(request_id)
        if not order_request:
            return jsonify({'message': 'Order request not found.'}), 404

        if order_request.status == 'Processed':
            return jsonify({'message': 'Order already processed.'}), 400
        
        # Create a new TransactionHeader from the CustomerOrderRequest
        now_utc = datetime.now(timezone.utc) # NEW: Use timezone.utc
        transaction_id = f"TRX-{now_utc.strftime('%Y%m%d-%H%M%S')}-{order_request.request_id}"
        
        total_transaction_amount = sum(item.item_total for item in order_request.items)

        header = TransactionHeader(
            id=transaction_id,
            transaction_date=now_utc.date(),
            transaction_time=now_utc.time(),
            total_amount=total_transaction_amount
        )
        db.session.add(header)
        db.session.flush() # Ensure header ID is available for items

        # Create TransactionItems from CustomerOrderItems
        for order_item in order_request.items:
            transaction_item = TransactionItem(
                transaction_header_id=transaction_id,
                paper_type=order_item.paper_type,
                color=order_item.color,
                pages=order_item.pages,
                price_per_page=order_item.price_per_page,
                item_total=order_item.item_total
            )
            db.session.add(transaction_item)
        
        # Update status of CustomerOrderRequest
        order_request.status = 'Processed'
        db.session.commit()

        return jsonify({'message': f'Order request {request_id} processed successfully! Transaction {transaction_id} created.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to process order request {request_id}: {str(e)}'}), 500

# API to reject a customer order request
@app.route('/reject-order/<int:request_id>', methods=['POST'])
def reject_order_api(request_id):
    try:
        order_request = CustomerOrderRequest.query.get(request_id)
        if not order_request:
            return jsonify({'message': 'Order request not found.'}), 404

        if order_request.status == 'Rejected':
            return jsonify({'message': 'Order already rejected.'}), 400

        order_request.status = 'Rejected'
        db.session.commit()
        return jsonify({'message': f'Order request {request_id} rejected successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to reject order request {request_id}: {str(e)}'}), 500

@app.route('/debug-input-test')
def debug_input_test_page():
    return render_template('debug_input_test.html')