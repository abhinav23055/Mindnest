from flask import Flask, request, jsonify, render_template, send_file
from fpdf import FPDF
import sqlite3
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
    
    # Table for Daily Well-being
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

    # Table for Journal Entries
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS journal_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            content TEXT NOT NULL,
            mood TEXT DEFAULT 'Calm',
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

@app.route('/mental-state')
def mental_state():
    return render_template('mental-state-detector.html')

@app.route('/welcome')
def welcome():
    return render_template('welcome.html')

@app.route('/journal')
def journal_page():
    return render_template('journal.html')

# --- AUTH API ROUTES ---

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
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
    cursor.execute('SELECT id, name FROM users WHERE email = ? AND password = ?', (email, password))
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify({
            "message": "Login successful",
            "user_id": user[0],
            "first_name": user[1]
        }), 200
        
    return jsonify({"error": "Invalid email or password"}), 401

# --- CHECKIN API ROUTES ---

@app.route('/api/checkin', methods=['POST'])
def checkin():
    data = request.json
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
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

# --- PDF DOWNLOAD ROUTE ---

@app.route('/api/download_pdf/<int:user_id>')
def download_pdf(user_id):
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT name FROM users WHERE id = ?', (user_id,))
    user_name = cursor.fetchone()[0]
    cursor.execute('SELECT date, mood, energy, stress FROM checkins WHERE user_id = ? ORDER BY date DESC', (user_id,))
    rows = cursor.fetchall()
    conn.close()

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.set_text_color(79, 127, 106)
    pdf.cell(0, 10, f"MindNest Wellness Report: {user_name}", ln=True, align='C')
    pdf.ln(10)

    pdf.set_font("Arial", 'B', 12)
    pdf.set_fill_color(230, 240, 236)
    pdf.cell(50, 10, " Date", border=1, fill=True)
    pdf.cell(40, 10, " Mood", border=1, fill=True)
    pdf.cell(40, 10, " Energy", border=1, fill=True)
    pdf.cell(40, 10, " Stress", border=1, fill=True, ln=True)

    pdf.set_font("Arial", size=12)
    pdf.set_text_color(0, 0, 0)
    for row in rows:
        clean_date = row[0][:10]
        pdf.cell(50, 10, f" {clean_date}", border=1)
        pdf.cell(40, 10, f" {row[1]}/5", border=1)
        pdf.cell(40, 10, f" {row[2]}/5", border=1)
        pdf.cell(40, 10, f" {row[3]}/5", border=1, ln=True)

    pdf_output = pdf.output()
    return send_file(
        io.BytesIO(pdf_output),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"{user_name}_Wellness_Report.pdf"
    )

# --- JOURNAL API ROUTES ---

@app.route('/api/journal', methods=['POST'])
def save_journal():
    data = request.json
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO journal_entries (user_id, content, mood)
        VALUES (?, ?, ?)
    ''', (data.get('user_id'), data.get('content'), data.get('mood')))
    conn.commit()
    conn.close()
    return jsonify({"message": "Entry saved!"}), 201

@app.route('/api/journal/<int:user_id>', methods=['GET'])
def get_journal(user_id):
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, content, mood, timestamp FROM journal_entries WHERE user_id = ? ORDER BY timestamp DESC', (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return jsonify([{"id": r[0], "content": r[1], "mood": r[2], "timestamp": r[3]} for r in rows])

@app.route('/api/journal/update/<int:entry_id>', methods=['PUT'])
def update_journal(entry_id):
    data = request.json
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('UPDATE journal_entries SET content = ?, mood = ? WHERE id = ?',
                   (data.get('content'), data.get('mood'), entry_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Entry updated!"})

@app.route('/api/journal/delete/<int:entry_id>', methods=['DELETE'])
def delete_journal(entry_id):
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM journal_entries WHERE id = ?', (entry_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Entry deleted!"})

# --- RUN ---

if __name__ == '__main__':
    app.run(debug=True)