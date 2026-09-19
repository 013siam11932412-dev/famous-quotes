import csv
import io
import json
import os
import random
from flask import Flask, jsonify, request, Response, send_from_directory

app = Flask(__name__, static_folder="static", static_url_path="")

# Load quotes dataset
DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "quotes.json")
DARK_SOUL_DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "darksoul_quotes.json")

def load_quotes():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def load_darksoul_quotes():
    if not os.path.exists(DARK_SOUL_DATA_FILE):
        return []
    with open(DARK_SOUL_DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

QUOTES = load_quotes()
DARK_SOUL_QUOTES = load_darksoul_quotes()

@app.route("/")
def index():
    """Serve frontend index.html."""
    return send_from_directory(app.static_folder, "index.html")

@app.route("/api/quotes/random", methods=["GET"])
def get_random_quote():
    """Return a single random quote, optionally filtered by category or author."""
    category = request.args.get("category", "").strip().lower()
    author = request.args.get("author", "").strip().lower()

    filtered = QUOTES
    if category:
        filtered = [q for q in filtered if q.get("category", "").lower() == category]
    if author:
        filtered = [q for q in filtered if author in q.get("author", "").lower()]

    if not filtered:
        return jsonify({"error": "No quotes found matching criteria"}), 404

    return jsonify({"quote": random.choice(filtered)})

@app.route("/api/quotes", methods=["GET"])
def get_quotes():
    """
    Search and filter quotes.
    Query params:
    - q: search in quote text and author
    - author: filter by author name
    - category: filter by category
    """
    query = request.args.get("q", "").strip().lower()
    author = request.args.get("author", "").strip().lower()
    category = request.args.get("category", "").strip().lower()

    results = QUOTES

    if category:
        results = [q for q in results if q.get("category", "").lower() == category]

    if author:
        results = [q for q in results if author in q.get("author", "").lower()]

    if query:
        results = [
            q for q in results
            if query in q.get("quote", "").lower() or query in q.get("author", "").lower()
        ]

    return jsonify({
        "total": len(results),
        "quotes": results
    })

@app.route("/api/quotes/export", methods=["GET"])
def export_quotes():
    """
    Export filtered quotes as a downloadable CSV file.
    Query params:
    - q: search in quote text and author
    - author: filter by author name
    - category: filter by category
    """
    query = request.args.get("q", "").strip().lower()
    author = request.args.get("author", "").strip().lower()
    category = request.args.get("category", "").strip().lower()

    results = QUOTES

    if category:
        results = [q for q in results if q.get("category", "").lower() == category]

    if author:
        results = [q for q in results if author in q.get("author", "").lower()]

    if query:
        results = [
            q for q in results
            if query in q.get("quote", "").lower() or query in q.get("author", "").lower()
        ]

    output = io.StringIO()
    # Write UTF-8 BOM for spreadsheet compatibility
    output.write("\ufeff")
    writer = csv.writer(output)
    writer.writerow(["ID", "Quote", "Author", "Category"])
    for q in results:
        writer.writerow([q.get("id", ""), q.get("quote", ""), q.get("author", ""), q.get("category", "")])

    csv_data = output.getvalue()
    filename = f"famous_quotes_{len(results)}_quotes.csv"
    return Response(
        csv_data,
        mimetype="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

@app.route("/api/quotes/<int:quote_id>", methods=["GET"])
def get_quote_by_id(quote_id):
    """Return a single quote by ID."""
    for q in QUOTES:
        if q.get("id") == quote_id:
            return jsonify({"quote": q})
    return jsonify({"error": "Quote not found"}), 404

@app.route("/api/categories", methods=["GET"])
def get_categories():
    """Return a sorted list of unique categories."""
    categories = sorted(list({q.get("category") for q in QUOTES if q.get("category")}))
    return jsonify({"categories": categories})

@app.route("/api/authors", methods=["GET"])
def get_authors():
    """Return a sorted list of unique authors."""
    authors = sorted(list({q.get("author") for q in QUOTES if q.get("author")}))
    return jsonify({"authors": authors})

@app.route("/api/darksoul/quotes", methods=["GET"])
def get_darksoul_quotes():
    """Return Dark Souls lore quotes with search and filter capabilities."""
    query = request.args.get("q", "").strip().lower()
    results = DARK_SOUL_QUOTES
    if query:
        results = [
            q for q in results
            if query in q.get("quote", "").lower() or query in q.get("author", "").lower() or query in q.get("lore", "").lower()
        ]
    return jsonify({
        "total": len(results),
        "quotes": results
    })

@app.route("/api/darksoul/random", methods=["GET"])
def get_random_darksoul_quote():
    """Return a random Dark Souls quote."""
    if not DARK_SOUL_QUOTES:
        return jsonify({"error": "No Dark Souls quotes found"}), 404
    return jsonify({"quote": random.choice(DARK_SOUL_QUOTES)})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
