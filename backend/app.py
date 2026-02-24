from flask import Flask, request, jsonify, render_template
import sqlite3
from flask import send_file # Add this to your existing flask imports
from fpdf import FPDF
import io

app = Flask(__name__)

# --- DATABASE SETUP ---
def init_db():
    connection = sqlite3.connect('database.db')
    cursor = connection.cursor()
    
    # Table for Users
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    # Table for Daily Well-being (Reverted: NO notes column)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS checkins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            mood INTEGER,
            energy INTEGER,
            stress INTEGER,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    connection.commit()
    connection.close()

init_db()

# --- NAVIGATION ROUTES ---

@app.route('/')
def home():
    return render_template('index.html') 

@app.route('/signup')
def signup_page():
    return render_template('auth.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/zen')
def zen_zone():
    # This assumes zen.html is inside your 'templates' folder
    return render_template('zen.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/screening')
def screening_page():
    return render_template('screening.html')

@app.route('/articles')
def articles_page():
    return render_template('articles.html')

# --- API ROUTES ---

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        # Ensure the column is 'name', not 'first_name' to match your init_db
        cursor.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
                       (data.get('name'), data.get('email'), data.get('password')))
        conn.commit()
        conn.close()
        return jsonify({"message": "Account created successfully!"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"message": "Email already exists!"}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    # Looking for 'name' because that's what you used in init_db
    cursor.execute('SELECT id, name FROM users WHERE email = ? AND password = ?', (email, password))
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify({
            "message": "Login successful",
            "user_id": user[0],
            "first_name": user[1] # user[1] is the 'name' from your DB
        }), 200
        
    return jsonify({"error": "Invalid email or password"}), 401

@app.route('/api/checkin', methods=['POST'])
def checkin():
    data = request.json
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    # Reverted: No notes field in the INSERT statement
    cursor.execute('''
        INSERT INTO checkins (user_id, mood, energy, stress) 
        VALUES (?, ?, ?, ?)
    ''', (data.get('user_id'), data.get('mood'), data.get('energy'), data.get('stress')))
    conn.commit()
    conn.close()
    return jsonify({"message": "Check-in saved!"}), 201

@app.route('/api/history/<int:user_id>', methods=['GET'])
def get_history(user_id):
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT mood, energy, stress, date FROM checkins WHERE user_id = ? ORDER BY date DESC', (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        history.append({
            "mood": row[0],
            "energy": row[1],
            "stress": row[2],
            "date": row[3]
        })
    return jsonify(history)

@app.route('/api/delete_history/<int:user_id>', methods=['DELETE'])
def delete_history(user_id):
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM checkins WHERE user_id = ?', (user_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "History cleared!"}), 200
    except Exception as e:
        return jsonify({"message": "Error", "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
    
@app.route('/api/download_pdf/<int:user_id>')
def download_pdf(user_id):
    # 1. Fetch data from SQLite
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    # Get user name
    cursor.execute('SELECT name FROM users WHERE id = ?', (user_id,))
    user_name = cursor.fetchone()[0]
    # Get history
    cursor.execute('SELECT date, mood, energy, stress FROM checkins WHERE user_id = ? ORDER BY date DESC', (user_id,))
    rows = cursor.fetchall()
    conn.close()

    # 2. Create PDF Logic
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    
    # Header
    pdf.set_text_color(79, 127, 106) # Your MindNest Green
    pdf.cell(0, 10, f"MindNest Wellness Report: {user_name}", ln=True, align='C')
    pdf.ln(10)

    # Table Header
    pdf.set_font("Arial", 'B', 12)
    pdf.set_fill_color(230, 240, 236)
    pdf.cell(50, 10, " Date", border=1, fill=True)
    pdf.cell(40, 10, " Mood", border=1, fill=True)
    pdf.cell(40, 10, " Energy", border=1, fill=True)
    pdf.cell(40, 10, " Stress", border=1, fill=True, ln=True)

    # 3. Fill Table with Data
    pdf.set_font("Arial", size=12)
    pdf.set_text_color(0, 0, 0)
    for row in rows:
        # Format date string (taking just the YYYY-MM-DD part)
        clean_date = row[0][:10]
        pdf.cell(50, 10, f" {clean_date}", border=1)
        pdf.cell(40, 10, f" {row[1]}/5", border=1)
        pdf.cell(40, 10, f" {row[2]}/5", border=1)
        pdf.cell(40, 10, f" {row[3]}/5", border=1, ln=True)

    # 4. Stream file back to browser
    # We use io.BytesIO so we don't have to save a physical file on your computer
    pdf_output = pdf.output()
    return send_file(
        io.BytesIO(pdf_output),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"{user_name}_Wellness_Report.pdf"
    )