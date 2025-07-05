# PrintingSystemWeb/__init__.py

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os
from datetime import datetime # Import datetime for default values in models

app = Flask(__name__)

# --- Database Configuration ---
# Configure SQLite database file path. It will be created in your project root.
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False 

db = SQLAlchemy(app)

# --- Database Models ---
class TransactionHeader(db.Model):
    id = db.Column(db.String(50), primary_key=True) 
    transaction_date = db.Column(db.Date, nullable=False)
    transaction_time = db.Column(db.Time, nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)

    # Relationship to TransactionItem (lazy='joined' or lazy=True for common loading)
    # cascade="all, delete-orphan" makes sure items are deleted if header is.
    items = db.relationship('TransactionItem', backref='header', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"TransactionHeader('{self.id}', '{self.transaction_date}')"

    def to_dict(self): # Helper for jsonify
        return {
            'id': self.id,
            'date': self.transaction_date.strftime("%m/%d/%Y"),
            'time': self.transaction_time.strftime("%I:%M%p"),
            'total': float(self.total_amount)
        }

class TransactionItem(db.Model):
    item_id = db.Column(db.Integer, primary_key=True, autoincrement=True) # Auto-incrementing primary key
    # Foreign Key to TransactionHeader
    transaction_header_id = db.Column(db.String(50), db.ForeignKey('transaction_header.id'), nullable=False)
    
    paper_type = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(50), nullable=False)
    pages = db.Column(db.Integer, nullable=False)
    price_per_page = db.Column(db.Numeric(10, 2), nullable=False)
    item_total = db.Column(db.Numeric(10, 2), nullable=False)

    def __repr__(self):
        return f"TransactionItem('{self.item_id}', '{self.paper_type}', '{self.pages}')"

    def to_dict(self): # Helper for jsonify (for detailed report)
        return {
            'id': self.header.id, 
            'date': self.header.transaction_date.strftime("%m/%d/%Y"),
            'time': self.header.transaction_time.strftime("%I:%M%p"),
            'paperType': self.paper_type,
            'color': self.color,
            'pages': self.pages,
            'pricePerPage': float(self.price_per_page),
            'total': float(self.item_total)
        }

# --- NEW: Customer Order Request Models ---
class CustomerOrderRequest(db.Model):
    __tablename__ = 'customer_order_request' # Explicit table name
    request_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    customer_name = db.Column(db.String(100), nullable=False)
    file_name = db.Column(db.String(255), nullable=False) # Changed to nullable=False as per screenshot implies required
    file_url = db.Column(db.String(255), nullable=True)  # For URL
    note = db.Column(db.Text, nullable=True)
    request_date = db.Column(db.DateTime, default=datetime.now, nullable=False)
    status = db.Column(db.String(50), default='Pending', nullable=False) # e.g., Pending, Processed, Rejected

    items = db.relationship('CustomerOrderItem', backref='request', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'requestId': self.request_id,
            'customerName': self.customer_name,
            'fileName': self.file_name,
            'fileUrl': self.file_url,
            'note': self.note,
            'requestDate': self.request_date.strftime("%m/%d/%Y %I:%M%p"),
            'status': self.status,
            'items': [item.to_dict() for item in self.items]
        }

class CustomerOrderItem(db.Model):
    __tablename__ = 'customer_order_item' # Explicit table name
    item_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    request_header_id = db.Column(db.Integer, db.ForeignKey('customer_order_request.request_id'), nullable=False)
    
    paper_type = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(50), nullable=False)
    pages = db.Column(db.Integer, nullable=False)
    price_per_page = db.Column(db.Numeric(10, 2), nullable=False) # Price is still here, for customer's reference
    item_total = db.Column(db.Numeric(10, 2), nullable=False) # Total for this item

    def to_dict(self):
        return {
            'paperType': self.paper_type,
            'color': self.color,
            'pages': self.pages,
            'pricePerPage': float(self.price_per_page),
            'itemTotal': float(self.item_total)
        }
# --- END NEW MODELS ---

# --- Create Database Tables (Run once, or conditionally) ---
# This ensures tables are created when the application starts for the first time.
# In a production app, you'd use Flask-Migrate or similar for schema changes.
with app.app_context():
    db.create_all()

# --- Import views here to avoid circular imports ---
# This ensures routes are registered after 'app' and 'db' are defined.
# The 'views' module will then import 'app' and 'db' from this __init__.py
import PrintingSystemWeb.views