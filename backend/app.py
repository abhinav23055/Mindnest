from flask import Flask, request, jsonify, render_template
import sqlite3

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
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = ? AND password = ?', 
                   (data.get('email'), data.get('password')))
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify({"message": "Login successful!", "user_id": user[0]}), 200
    else:
        return jsonify({"message": "Invalid email or password"}), 401

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