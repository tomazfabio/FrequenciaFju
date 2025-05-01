import os
import json
import logging
from datetime import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "frequencia-fju-secret-key")

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Initialize Firebase
try:
    # For production, use environment variables
    firebase_project_id = os.environ.get("FIREBASE_PROJECT_ID", "frequencia-fju")
    firebase_api_key = os.environ.get("FIREBASE_API_KEY", "your-api-key")
    firebase_app_id = os.environ.get("FIREBASE_APP_ID", "your-app-id")
    
    # Initialize Firebase Admin SDK
    if not firebase_admin._apps:
        # Create a JSON file with the service account credentials
        service_account_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
        if service_account_json:
            service_account_file = "firebase-credentials.json"
            with open(service_account_file, "w") as f:
                f.write(service_account_json)
            cred = credentials.Certificate(service_account_file)
            firebase_admin.initialize_app(cred)
        else:
            logging.error("Firebase service account not provided.")
            cred = None
    
    # Get Firestore client
    db = firestore.client()
    
except Exception as e:
    logging.error(f"Firebase initialization error: {e}")
    db = None

# Configuration
from config import ROLES, TRIBES, EVENTS

@app.route('/')
def index():
    # Clear any existing session
    session.clear()
    
    return render_template(
        'index.html',
        roles=ROLES,
        tribes=TRIBES,
        firebase_api_key=firebase_api_key,
        firebase_project_id=firebase_project_id,
        firebase_app_id=firebase_app_id
    )

@app.route('/login', methods=['POST'])
def login():
    # Simple role-based login (no authentication)
    role = request.form.get('role')
    tribe = request.form.get('tribe', None)
    
    # Validate role
    if role not in ROLES:
        return redirect(url_for('index'))
    
    # If role is tribe-specific, tribe must be selected
    if role in ['Coordenador da Tribo', 'Assistente da Tribo'] and tribe not in TRIBES:
        return redirect(url_for('index'))
    
    # Set session data
    session['role'] = role
    session['tribe'] = tribe
    session['logged_in'] = True
    
    return redirect(url_for('dashboard'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/dashboard')
def dashboard():
    if not session.get('logged_in'):
        return redirect(url_for('index'))
    
    return render_template(
        'dashboard.html',
        role=session.get('role'),
        tribe=session.get('tribe'),
        events=EVENTS
    )

@app.route('/attendance')
def attendance():
    if not session.get('logged_in'):
        return redirect(url_for('index'))
    
    event_type = request.args.get('event_type', EVENTS[0])
    
    return render_template(
        'attendance.html',
        role=session.get('role'),
        tribe=session.get('tribe'),
        events=EVENTS,
        selected_event=event_type
    )

@app.route('/reports')
def reports():
    if not session.get('logged_in'):
        return redirect(url_for('index'))
    
    return render_template(
        'reports.html',
        role=session.get('role'),
        tribe=session.get('tribe')
    )

@app.route('/api/attendance', methods=['POST'])
def save_attendance():
    if not session.get('logged_in') or not db:
        return jsonify({'success': False, 'error': 'Unauthorized or database not available'}), 401
    
    data = request.json
    names = data.get('names', [])
    event_type = data.get('event_type')
    date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
    
    if not names or not event_type:
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
    
    role = session.get('role')
    tribe = session.get('tribe')
    
    # For tribe-specific roles, ensure they can only add attendance for their tribe
    if role in ['Coordenador da Tribo', 'Assistente da Tribo'] and data.get('tribe') != tribe:
        return jsonify({'success': False, 'error': 'Unauthorized to add attendance for this tribe'}), 403
    
    # Process each name
    batch = db.batch()
    records_count = 0
    
    for name in names:
        if not name.strip():
            continue
        
        # Create attendance record
        attendance_ref = db.collection('attendance').document()
        attendance_data = {
            'name': name.strip(),
            'event': event_type,
            'date': date,
            'tribe': data.get('tribe', tribe),
            'registered_by_role': role,
            'timestamp': firestore.SERVER_TIMESTAMP
        }
        
        batch.set(attendance_ref, attendance_data)
        records_count += 1
    
    # Commit batch if there are records
    if records_count > 0:
        batch.commit()
        return jsonify({'success': True, 'records': records_count}), 200
    else:
        return jsonify({'success': False, 'error': 'No valid names provided'}), 400

@app.route('/api/attendance', methods=['GET'])
def get_attendance():
    if not session.get('logged_in') or not db:
        return jsonify({'success': False, 'error': 'Unauthorized or database not available'}), 401
    
    role = session.get('role')
    tribe = session.get('tribe')
    
    # Create query based on role permissions
    query = db.collection('attendance')
    
    # Filter by tribe for tribe-specific roles
    if role in ['Coordenador da Tribo', 'Assistente da Tribo'] and tribe:
        query = query.where('tribe', '==', tribe)
    
    # Apply additional filters if provided
    event_type = request.args.get('event_type')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if event_type:
        query = query.where('event', '==', event_type)
    
    if start_date:
        query = query.where('date', '>=', start_date)
    
    if end_date:
        query = query.where('date', '<=', end_date)
    
    # Execute query
    results = []
    try:
        docs = query.get()
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            results.append(data)
        
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        logging.error(f"Error fetching attendance: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/attendance/monthly-report', methods=['GET'])
def get_monthly_report():
    if not session.get('logged_in') or not db:
        return jsonify({'success': False, 'error': 'Unauthorized or database not available'}), 401
    
    month = request.args.get('month')
    year = request.args.get('year')
    
    if not month or not year:
        return jsonify({'success': False, 'error': 'Month and year are required'}), 400
    
    # Format start and end dates for the selected month
    start_date = f"{year}-{month.zfill(2)}-01"
    
    # Determine the last day of the month
    if month == '12':
        end_date = f"{int(year)+1}-01-01"
    else:
        end_date = f"{year}-{str(int(month)+1).zfill(2)}-01"
    
    # Create the query
    role = session.get('role')
    tribe = session.get('tribe')
    
    query = db.collection('attendance')
    
    # Filter by tribe for tribe-specific roles
    if role in ['Coordenador da Tribo', 'Assistente da Tribo'] and tribe:
        query = query.where('tribe', '==', tribe)
    
    # Date range
    query = query.where('date', '>=', start_date).where('date', '<', end_date)
    
    # Execute query
    report_data = []
    try:
        docs = query.get()
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            report_data.append(data)
        
        return jsonify({'success': True, 'data': report_data}), 200
    except Exception as e:
        logging.error(f"Error generating monthly report: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/attendance/stats', methods=['GET'])
def get_attendance_stats():
    if not session.get('logged_in') or not db:
        return jsonify({'success': False, 'error': 'Unauthorized or database not available'}), 401
    
    try:
        # Create the query based on role permissions
        role = session.get('role')
        tribe = session.get('tribe')
        
        query = db.collection('attendance')
        
        # Filter by tribe for tribe-specific roles
        if role in ['Coordenador da Tribo', 'Assistente da Tribo'] and tribe:
            query = query.where('tribe', '==', tribe)
        
        # Optional parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if start_date:
            query = query.where('date', '>=', start_date)
        
        if end_date:
            query = query.where('date', '<=', end_date)
        
        # Execute query
        docs = query.get()
        
        # Process data for charts
        attendance_by_event = {}
        attendance_by_youth = {}
        attendance_by_tribe = {}
        
        for doc in docs:
            data = doc.to_dict()
            event = data.get('event', 'Unknown')
            name = data.get('name', 'Unknown')
            doc_tribe = data.get('tribe', 'Unknown')
            
            # Count by event
            if event in attendance_by_event:
                attendance_by_event[event] += 1
            else:
                attendance_by_event[event] = 1
            
            # Count by youth
            if name in attendance_by_youth:
                attendance_by_youth[name] += 1
            else:
                attendance_by_youth[name] = 1
            
            # Count by tribe
            if doc_tribe in attendance_by_tribe:
                attendance_by_tribe[doc_tribe] += 1
            else:
                attendance_by_tribe[doc_tribe] = 1
        
        # Sort youth by attendance (descending)
        sorted_youth = sorted(attendance_by_youth.items(), key=lambda x: x[1], reverse=True)
        attendance_by_youth = dict(sorted_youth[:20])  # Top 20 for chart readability
        
        return jsonify({
            'success': True,
            'by_event': attendance_by_event,
            'by_youth': attendance_by_youth,
            'by_tribe': attendance_by_tribe
        }), 200
    
    except Exception as e:
        logging.error(f"Error generating attendance stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
