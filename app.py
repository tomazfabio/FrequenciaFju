import os
import json
import logging
from datetime import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for, session

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "frequencia-fju-secret-key")

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# For production, use environment variables
firebase_project_id = os.environ.get("FIREBASE_PROJECT_ID", "frequencia-fju")
firebase_api_key = os.environ.get("FIREBASE_API_KEY", "your-api-key")
firebase_app_id = os.environ.get("FIREBASE_APP_ID", "your-app-id")

# Initialize a simple in-memory database for development purposes
attendance_db = []

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
    if not session.get('logged_in'):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
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
    records_count = 0
    selected_tribe = data.get('tribe', tribe)
    
    for name in names:
        if not name.strip():
            continue
        
        # Create attendance record with a unique ID
        import uuid
        record_id = str(uuid.uuid4())
        
        attendance_data = {
            'id': record_id,
            'name': name.strip(),
            'event': event_type,
            'date': date,
            'tribe': selected_tribe,
            'registered_by_role': role,
            'timestamp': datetime.now().isoformat()
        }
        
        attendance_db.append(attendance_data)
        records_count += 1
    
    # Return success response if there are records
    if records_count > 0:
        return jsonify({'success': True, 'records': records_count}), 200
    else:
        return jsonify({'success': False, 'error': 'No valid names provided'}), 400

@app.route('/api/attendance', methods=['GET'])
def get_attendance():
    if not session.get('logged_in'):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    role = session.get('role')
    tribe = session.get('tribe')
    
    # Apply filters based on role permissions
    results = []
    
    for record in attendance_db:
        # Filter by tribe for tribe-specific roles
        if role in ['Coordenador da Tribo', 'Assistente da Tribo'] and tribe and record.get('tribe') != tribe:
            continue
        
        # Apply additional filters if provided
        event_type = request.args.get('event_type')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if event_type and record.get('event') != event_type:
            continue
        
        if start_date and record.get('date') < start_date:
            continue
        
        if end_date and record.get('date') > end_date:
            continue
        
        # Add record to results
        results.append(record)
    
    return jsonify({'success': True, 'data': results}), 200

@app.route('/api/attendance/monthly-report', methods=['GET'])
def get_monthly_report():
    if not session.get('logged_in'):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
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
    
    # Apply filters
    role = session.get('role')
    tribe = session.get('tribe')
    
    # Filter records for the selected month
    report_data = []
    
    for record in attendance_db:
        # Only include records from the selected month
        if record.get('date') < start_date or record.get('date') >= end_date:
            continue
            
        # Filter by tribe for tribe-specific roles
        if role in ['Coordenador da Tribo', 'Assistente da Tribo'] and tribe and record.get('tribe') != tribe:
            continue
        
        # Add record to report
        report_data.append(record)
    
    return jsonify({'success': True, 'data': report_data}), 200

@app.route('/api/attendance/stats', methods=['GET'])
def get_attendance_stats():
    if not session.get('logged_in'):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        # Get filters
        role = session.get('role')
        tribe = session.get('tribe')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Process data for charts
        attendance_by_event = {}
        attendance_by_youth = {}
        attendance_by_tribe = {}
        
        # Filter and process records
        for record in attendance_db:
            # Apply tribe filter for tribe-specific roles
            if role in ['Coordenador da Tribo', 'Assistente da Tribo'] and tribe and record.get('tribe') != tribe:
                continue
            
            # Apply date filters if provided
            if start_date and record.get('date') < start_date:
                continue
                
            if end_date and record.get('date') > end_date:
                continue
            
            # Extract data
            event = record.get('event', 'Unknown')
            name = record.get('name', 'Unknown')
            record_tribe = record.get('tribe', 'Unknown')
            
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
            if record_tribe in attendance_by_tribe:
                attendance_by_tribe[record_tribe] += 1
            else:
                attendance_by_tribe[record_tribe] = 1
        
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
