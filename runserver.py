# PrintingSystemWeb/runserver.py

# Import your app and db instances from your PrintingSystemWeb package
from PrintingSystemWeb import app, db 

if __name__ == '__main__':
    # Ensure database tables are created before the server starts
    with app.app_context():
        print("Ensuring database tables are created...")
        try:
            db.create_all()
            print("Database tables checked/created successfully.")
        except Exception as e:
            print(f"ERROR: Failed to create database tables: {e}")
            # Optionally, you might want to raise the exception or exit if DB creation is critical
            # raise e 
            
    # Run the Flask development server
    app.run(debug=True) # debug=True is good for development