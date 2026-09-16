import json
import os
import pytest
from app import app, DATA_FILE

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_quotes_data_integrity():
    """Verify data/quotes.json exists, has 100 quotes, and all required fields."""
    assert os.path.exists(DATA_FILE), f"Dataset file not found at {DATA_FILE}"
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        quotes = json.load(f)

    assert len(quotes) == 100, f"Expected exactly 100 quotes, found {len(quotes)}"

    ids = set()
    for q in quotes:
        assert "id" in q and isinstance(q["id"], int)
        assert "quote" in q and isinstance(q["quote"], str) and q["quote"].strip()
        assert "author" in q and isinstance(q["author"], str) and q["author"].strip()
        assert "category" in q and isinstance(q["category"], str) and q["category"].strip()
        ids.add(q["id"])

    assert len(ids) == 100, "Quote IDs must all be unique"

def test_index_route(client):
    """Test that index page is served with 200 OK."""
    res = client.get("/")
    assert res.status_code == 200
    assert b"Words of Wisdom" in res.data or b"Famous Quotes" in res.data

def test_get_random_quote(client):
    """Test /api/quotes/random returns a valid quote."""
    res = client.get("/api/quotes/random")
    assert res.status_code == 200
    data = res.get_json()
    assert "quote" in data
    q = data["quote"]
    assert "quote" in q and "author" in q and "category" in q

def test_get_random_quote_filtered(client):
    """Test /api/quotes/random with category filter."""
    res = client.get("/api/quotes/random?category=Science")
    assert res.status_code == 200
    data = res.get_json()
    assert data["quote"]["category"].lower() == "science"

def test_get_random_quote_not_found(client):
    """Test /api/quotes/random with non-existent criteria returns 404."""
    res = client.get("/api/quotes/random?category=NonExistentCategoryXYZ")
    assert res.status_code == 404
    data = res.get_json()
    assert "error" in data

def test_get_all_quotes(client):
    """Test /api/quotes returns all 100 quotes by default."""
    res = client.get("/api/quotes")
    assert res.status_code == 200
    data = res.get_json()
    assert data["total"] == 100
    assert len(data["quotes"]) == 100

def test_search_by_author(client):
    """Test filtering quotes by author."""
    res = client.get("/api/quotes?author=Einstein")
    assert res.status_code == 200
    data = res.get_json()
    assert data["total"] > 0
    for q in data["quotes"]:
        assert "einstein" in q["author"].lower()

def test_search_by_category(client):
    """Test filtering quotes by category."""
    res = client.get("/api/quotes?category=Philosophy")
    assert res.status_code == 200
    data = res.get_json()
    assert data["total"] > 0
    for q in data["quotes"]:
        assert q["category"].lower() == "philosophy"

def test_search_by_query_keyword(client):
    """Test searching quotes by free-text keyword."""
    res = client.get("/api/quotes?q=wisdom")
    assert res.status_code == 200
    data = res.get_json()
    assert data["total"] > 0
    for q in data["quotes"]:
        match = "wisdom" in q["quote"].lower() or "wisdom" in q["author"].lower()
        assert match

def test_combined_search_filters(client):
    """Test combining author and category filters."""
    res = client.get("/api/quotes?author=Socrates&category=Philosophy")
    assert res.status_code == 200
    data = res.get_json()
    assert data["total"] > 0
    for q in data["quotes"]:
        assert "socrates" in q["author"].lower()
        assert q["category"].lower() == "philosophy"

def test_get_quote_by_id(client):
    """Test fetching quote by ID."""
    res = client.get("/api/quotes/1")
    assert res.status_code == 200
    data = res.get_json()
    assert data["quote"]["id"] == 1

def test_get_quote_by_invalid_id(client):
    """Test fetching non-existent quote ID returns 404."""
    res = client.get("/api/quotes/99999")
    assert res.status_code == 404

def test_get_categories(client):
    """Test /api/categories returns a non-empty list of categories."""
    res = client.get("/api/categories")
    assert res.status_code == 200
    data = res.get_json()
    assert "categories" in data
    assert len(data["categories"]) >= 5
    assert "Philosophy" in data["categories"]
    assert "Science" in data["categories"]

def test_get_authors(client):
    """Test /api/authors returns a non-empty list of authors."""
    res = client.get("/api/authors")
    assert res.status_code == 200
    data = res.get_json()
    assert "authors" in data
    assert len(data["authors"]) >= 10
    assert "Albert Einstein" in data["authors"]
