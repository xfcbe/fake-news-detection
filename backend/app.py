from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import firestore
from newspaper import Article
import bcrypt
import jwt
import datetime
import uuid
import pickle

users = {}
sessions = {}
history = []

app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = "SUPER_SECRET_KEY"

# Firebase Initialization
db = firestore.Client.from_service_account_json("firebase_service_account.json")

# Load ML model + vectorizer
model = pickle.load(open("model.pkl", "rb"))
vectorizer = pickle.load(open("vectorizer.pkl", "rb"))




# ------------- Helper Functions -----------------

def create_token(email):
    return jwt.encode(
        {"email": email, "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)},
        app.config['SECRET_KEY'],
        algorithm="HS256"
    )

def verify_token(request):
    auth = request.headers.get("Authorization")
    if not auth:
        return None

    token = auth.replace("Bearer ", "")

    try:
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        return decoded["email"]
    except:
        return None

def scrape_url(url):
    article = Article(url)
    article.download()
    article.parse()
    return article.title, article.text


# ------------- AUTHENTICATION -----------------

@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.json
    fullName = data.get("fullName")
    email = data.get("email")
    password = data.get("password")

    
    user_ref = db.collection("users").document(email)
    if user_ref.get().exists:
        return jsonify({"message": "User already exists"}), 400

    
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    # Save user
    user_ref.set({
        "fullName": fullName,
        "email": email,
        "passwordHash": hashed,
        "createdAt": firestore.SERVER_TIMESTAMP
    })

    token = create_token(email)

    return jsonify({
        "message": "Signup successful",
        "token": token,
        "user": {"email": email, "fullName": fullName}
    })


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user_ref = db.collection("users").document(email)
    user = user_ref.get()

    if not user.exists:
        return jsonify({"message": "Invalid credentials"}), 401

    user_data = user.to_dict()

    
    if not bcrypt.checkpw(password.encode(), user_data["passwordHash"].encode()):
        return jsonify({"message": "Invalid credentials"}), 401

    token = create_token(email)

    return jsonify({
        "message": "Login OK",
        "token": token,
        "user": {"email": email, "fullName": user_data["fullName"]}
    })


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logged out"})


# ------------- ANALYSIS -----------------

@app.route("/api/analyze", methods=["POST"])
def analyze():
    email = verify_token(request)
    if not email:
        return jsonify({"message": "Unauthorized"}), 401

    data = request.json
    content = data.get("content")
    type = data.get("type")  # text or link

    # Scrape URL
    if type == "link":
        title, text = scrape_url(content)
    else:
        words = content.split()
        seb=" "
        first_ten_words = words[:7]
        title = seb.join(first_ten_words)
        text = content

    # ML prediction
    vect = vectorizer.transform([text])
    pred = model.predict(vect)[0]
    label = "REAL" if pred == 1 else "FAKE" # To be used later
    confidence = model.predict_proba(vect)[0]
    credibility = round(max(confidence) * 100, 2)

    item_id = str(uuid.uuid4())

    # Save history
    db.collection("history").document(item_id).set({
        "id": item_id,
        "userId": email,
        "credibility": credibility,
        "content": {
            "title": title,
            "body": text
        },
        "source": "URL" if type == "link" else "TEXT",
        "analyzedAt": firestore.SERVER_TIMESTAMP
    })

    return jsonify({
        "id": item_id,
        "credibility": credibility,
        "content": {"title": title, "body": text},
        "source": "URL" if type == "link" else "TEXT"
    })


# ------------- HISTORY -----------------

@app.route('/api/history', methods=['GET'])
def get_history():
    email = verify_token(request)
    if not email:
        return jsonify({"message": "Unauthorized"}), 401

    # Get all items belonging to this user
    docs = db.collection("history").where("userId", "==", email).order_by("analyzedAt", direction=firestore.Query.DESCENDING).stream()

    history = []
    for d in docs:
        item = d.to_dict()
        history.append({
            "id": item.get("id"),
            "credibility": item.get("credibility"),
            "source": item.get("source"),
            "content": item.get("content"),
            "analyzed": item.get("analyzedAt"),
        })

    return jsonify({"history": history})




@app.route("/api/history/<id>", methods=["GET"])
def get_item(id):
    email = verify_token(request)
    if not email:
        return jsonify({"message": "Unauthorized"}), 401

    ref = db.collection("history").document(id)
    doc = ref.get()

    if not doc.exists:
        return jsonify({"message": "Not found"}), 404

    item = doc.to_dict()

    if item["userId"] != email:
        return jsonify({"message": "Forbidden"}), 403

    return jsonify(item)



@app.route("/api/history/<id>", methods=["DELETE"])
def delete_item(id):
    email = verify_token(request)
    if not email:
        return jsonify({"message": "Unauthorized"}), 401

    ref = db.collection("history").document(id)
    doc = ref.get()

    if not doc.exists:
        return jsonify({"message": "Not found"}), 404

    item = doc.to_dict()
    if item["userId"] != email:
        return jsonify({"message": "Forbidden"}), 403

    ref.delete()
    return jsonify({"message": "Deleted"})



if __name__ == "__main__":
    app.run(port=8000, debug=True)
