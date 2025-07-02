# PrintingSystemWeb/__init__.py

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)

# --- Database Configuration ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False 

db = SQLAlchemy(app)

# --- Database Models ---
class TransactionHeader(db.Model):
    id = db.Column(db.String(50), primary_key=True) 
    transaction_date = db.Column(db.Date, nullable=False)
    transaction_time = db.Column(db.Time, nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)

    items = db.relationship('TransactionItem', backref='header', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"TransactionHeader('{self.id}', '{self.transaction_date}')"

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.transaction_date.strftime("%m/%d/%Y"),
            'time': self.transaction_time.strftime("%I:%M%p"),
            'total': float(self.total_amount)
        }

class TransactionItem(db.Model):
    item_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    transaction_header_id = db.Column(db.String(50), db.ForeignKey('transaction_header.id'), nullable=False)
    
    paper_type = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(50), nullable=False)
    pages = db.Column(db.Integer, nullable=False)
    price_per_page = db.Column(db.Numeric(10, 2), nullable=False)
    item_total = db.Column(db.Numeric(10, 2), nullable=False)

    def __repr__(self):
        return f"TransactionItem('{self.item_id}', '{self.paper_type}', '{self.pages}')"

    def to_dict(self):
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

# --- Create Database Tables (Run once, or conditionally) ---
with app.app_context():
    db.create_all()

# --- Import views here to avoid circular imports ---
import PrintingSystemWeb.views