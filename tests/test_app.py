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

def test_index_has_theme_toggle(client):
    """Test that index page includes the dark/light theme toggle switch."""
    res = client.get("/")
    assert res.status_code == 200
    assert b'id="theme-toggle"' in res.data

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

def test_darksoul_quotes_data_integrity():
    """Verify data/darksoul_quotes.json exists, contains valid Dark Souls quotes."""
    from app import DARK_SOUL_DATA_FILE
    assert os.path.exists(DARK_SOUL_DATA_FILE)
    with open(DARK_SOUL_DATA_FILE, "r", encoding="utf-8") as f:
        ds_quotes = json.load(f)
    assert len(ds_quotes) >= 15
    for q in ds_quotes:
        assert "quote" in q and q["quote"].strip()
        assert "author" in q and q["author"].strip()
        assert "lore" in q

def test_get_darksoul_quotes(client):
    """Test /api/darksoul/quotes returns quotes and supports search."""
    res = client.get("/api/darksoul/quotes")
    assert res.status_code == 200
    data = res.get_json()
    assert data["total"] >= 15
    assert len(data["quotes"]) >= 15

    # Search query
    res_search = client.get("/api/darksoul/quotes?q=sun")
    assert res_search.status_code == 200
    search_data = res_search.get_json()
    assert search_data["total"] > 0
    assert any("Solaire" in q["author"] for q in search_data["quotes"])

def test_get_darksoul_random(client):
    """Test /api/darksoul/random returns a random quote."""
    res = client.get("/api/darksoul/random")
    assert res.status_code == 200
    data = res.get_json()
    assert "quote" in data
    assert "quote" in data["quote"]
    assert "author" in data["quote"]

def test_export_quotes_csv_all(client):
    """Test /api/quotes/export returns all quotes as CSV."""
    res = client.get("/api/quotes/export")
    assert res.status_code == 200
    assert "text/csv" in res.content_type
    assert "attachment; filename=" in res.headers.get("Content-Disposition", "")
    content = res.data.decode("utf-8-sig")
    lines = [line.strip() for line in content.splitlines() if line.strip()]
    # Header + 100 quote rows
    assert lines[0] == "ID,Quote,Author,Category"
    assert len(lines) == 101

def test_export_quotes_csv_filtered(client):
    """Test /api/quotes/export with query filters."""
    res = client.get("/api/quotes/export?category=Science&author=Einstein")
    assert res.status_code == 200
    content = res.data.decode("utf-8-sig")
    lines = [line.strip() for line in content.splitlines() if line.strip()]
    assert lines[0] == "ID,Quote,Author,Category"
    assert len(lines) > 1
    for line in lines[1:]:
        assert "Einstein" in line
        assert "Science" in line


