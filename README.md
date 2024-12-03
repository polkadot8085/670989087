from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options

def start_browser(headless=True):
    """Start a Selenium browser session."""
    options = Options()
    if headless:
        options.add_argument("--headless")  # Run in headless mode
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")

    service = Service(executable_path="path/to/chromedriver")  # Adjust path as needed
    driver = webdriver.Chrome(service=service, options=options)
    return driver

def navigate_and_extract(url, element_id=None):
    """Navigate to a URL and optionally extract element by ID."""
    driver = start_browser()
    driver.get(url)

    if element_id:
        try:
            element = driver.find_element(By.ID, element_id)
            return element.text
        except Exception as e:
            print(f"Error extracting element: {e}")
    else:
        return driver.page_source
    finally:
        driver.quit() это browsing.py


import sqlite3
from contextlib import closing

DB_FILE = "plugin_data.db"  # Path to the SQLite database file

def init_db():
    """
    Initialize the database with a sample table.
    """
    with sqlite3.connect(DB_FILE) as connection:
        cursor = connection.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        connection.commit()

def insert_record(data):
    """
    Insert a record into the database.
    :param data: Data to insert.
    """
    with sqlite3.connect(DB_FILE) as connection:
        cursor = connection.cursor()
        cursor.execute("INSERT INTO records (data) VALUES (?)", (data,))
        connection.commit()

def fetch_all_records():
    """
    Fetch all records from the database.
    :return: List of records.
    """
    with sqlite3.connect(DB_FILE) as connection:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM records")
        return cursor.fetchall()

def delete_record(record_id):
    """
    Delete a record by ID.
    :param record_id: ID of the record to delete.
    """
    with sqlite3.connect(DB_FILE) as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM records WHERE id = ?", (record_id,))
        connection.commit()
        driver.quit()  это database.py



from googleapiclient.discovery import build
from config.config import GOOGLE_API_KEY, GOOGLE_CSE_ID

def search_google(query, num_results=5):
    """
    Perform a Google Custom Search.
    :param query: Search query string.
    :param num_results: Number of search results to return.
    :return: List of search results with titles and links.
    """
    try:
        # Initialize the Google Custom Search API client
        service = build("customsearch", "v1", developerKey=GOOGLE_API_KEY)
        results = service.cse().list(q=query, cx=GOOGLE_CSE_ID, num=num_results).execute()

        # Extract relevant data from the results
        items = results.get("items", [])
        return [{"title": item["title"], "link": item["link"]} for item in items]
    except Exception as e:
        print(f"Google API Error: {e}")
        return []   google api.py



        from flask import Flask, jsonify, request
from api.google_api import search_google
from api.custom_ai import generate_response
from services.ssh_service import execute_ssh_command
from services.web_scraping import scrape_page
from services.browser_automation import navigate_and_extract
from data.database import init_db, insert_record, fetch_all_records

# Initialize the Flask app
app = Flask(__name__)

# Initialize the database
init_db()

@app.route("/")
def home():
    return jsonify({"status": "success", "message": "Plugin is running!"})

@app.route("/google_search", methods=["GET"])
def google_search():
    query = request.args.get("query")
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400
    results = search_google(query)
    return jsonify({"results": results})

@app.route("/ai_response", methods=["POST"])
def ai_response():
    data = request.json
    if not data or "prompt" not in data:
        return jsonify({"error": "Prompt is required"}), 400
    response = generate_response(data["prompt"])
    return jsonify({"response": response})

@app.route("/execute_ssh", methods=["POST"])
def execute_ssh():
    data = request.json
    required_fields = ["host", "username", "command"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    try:
        output = execute_ssh_command(
            host=data["host"],
            username=data["username"],
            command=data["command"],
            key_path=data.get("key_path"),
            password=data.get("password")
        )
        return jsonify({"output": output})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/scrape_page", methods=["GET"])
def scrape_page_route():
    url = request.args.get("url")
    if not url:
        return jsonify({"error": "URL parameter is required"}), 400
    title = scrape_page(url)
    return jsonify({"title": title})

@app.route("/browse", methods=["POST"])
def browse():
    data = request.json
    url = data.get("url")
    element_id = data.get("element_id")
    if not url:
        return jsonify({"error": "URL is required"}), 400
    content = navigate_and_extract(url, element_id)
    return jsonify({"content": content})

@app.route("/records", methods=["GET", "POST"])
def records():
    if request.method == "POST":
        data = request.json
        if not data or "info" not in data:
            return jsonify({"error": "Info is required"}), 400
        insert_record(data["info"])
        return jsonify({"message": "Record inserted successfully"})
    else:
        records = fetch_all_records()
        return jsonify({"records": records})

# Run the app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000) this is
main.py


def clean_text(text):
    """
    Remove unnecessary whitespace and convert text to lowercase.
    :param text: Input text.
    :return: Cleaned text.
    """
    return text.strip().lower()

def remove_special_characters(text):
    """
    Remove special characters from the input text.
    :param text: Input text.
    :return: Text without special characters.
    """
    import re
    return re.sub(r"[^a-zA-Z0-9\s]", "", text)

def tokenize_text(text):
    """
    Split text into a list of words (tokens).
    :param text: Input text.
    :return: List of tokens.
    """
    return text.split()

def preprocess_data(data):
    """
    Perform a complete preprocessing pipeline on the data.
    :param data: Raw input data.
    :return: Processed data.
    """
    cleaned = clean_text(data)
    no_specials = remove_special_characters(cleaned)
    tokens = tokenize_text(no_specials)
    return tokens
this is procesing.py


import paramiko

def execute_ssh_command(host, username, command, key_path=None, password=None):
    """
    Execute a command on a remote server via SSH.
    :param host: The remote server's hostname or IP.
    :param username: The SSH username.
    :param command: The command to execute.
    :param key_path: Path to the private SSH key file (optional).
    :param password: SSH password (optional).
    :return: The command's output.
    """
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        if key_path:
            client.connect(hostname=host, username=username, key_filename=key_path)
        elif password:
            client.connect(hostname=host, username=username, password=password)
        else:
            raise ValueError("Either key_path or password must be provided.")

        stdin, stdout, stderr = client.exec_command(command)
        output = stdout.read().decode()
        errors = stderr.read().decode()

        if errors:
            print(f"Errors: {errors}")
        return output
    except Exception as e:
        print(f"SSH command execution failed: {e}")
        return None
    finally:
        client.close()
this is ssh service.py



import os

def save_file(directory, filename, content):
    """
    Save content to a specified file.
    :param directory: Directory where the file will be saved.
    :param filename: Name of the file.
    :param content: Content to write into the file.
    """
    os.makedirs(directory, exist_ok=True)
    with open(os.path.join(directory, filename), "w") as file:
        file.write(content)

def read_file(filepath):
    """
    Read content from a file.
    :param filepath: Path to the file.
    :return: File content.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")
    with open(filepath, "r") as file:
        return file.read()

def delete_file(filepath):
    """
    Delete a file.
    :param filepath: Path to the file.
    """
    if os.path.exists(filepath):
        os.remove(filepath)
    else:
        raise FileNotFoundError(f"File not found: {filepath}")
this is storage.py



import logging
from datetime import datetime

def setup_logger(name="plugin_logger", log_file="plugin.log", level=logging.INFO):
    """
    Set up a logger to log messages to a file.
    :param name: Name of the logger.
    :param log_file: File to save the logs.
    :param level: Logging level.
    :return: Configured logger instance.
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    file_handler = logging.FileHandler(log_file)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    return logger

def timestamp():
    """
    Get the current timestamp.
    :return: Current timestamp as a string.
    """
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def validate_input(data, required_fields):
    """
    Validate if required fields are present in the input data.
    :param data: Dictionary of input data.
    :param required_fields: List of required keys.
    :return: Tuple (bool, missing_fields). True if valid, else False with missing fields.
    """
    missing_fields = [field for field in required_fields if field not in data]
    return (len(missing_fields) == 0, missing_fields)
this is utils.py

import requests
from bs4 import BeautifulSoup
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def scrape_page(url):
    """
    Scrape a webpage and return the title.
    :param url: URL of the page to scrape.
    :return: Page title or None if an error occurs.
    """
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Raise an HTTPError for bad responses
        soup = BeautifulSoup(response.text, "html.parser")
        return soup.title.string
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def extract_elements(url, tag, attribute=None):
    """
    Extract elements from a webpage by tag and optional attribute.
    :param url: URL of the page to scrape.
    :param tag: HTML tag to search for (e.g., 'a', 'div').
    :param attribute: Optional attribute to extract (e.g., 'href').
    :return: List of extracted elements or an empty list if an error occurs.
    """
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        if attribute:
            return [element[attribute] for element in soup.find_all(tag) if attribute in element.attrs]
        return [element.text for element in soup.find_all(tag)]
    except Exception as e:
        print(f"Error extracting elements: {e}")
        return []

def rate_limited_scrape(url):
    """
    Scrape a webpage with rate limiting.
    :param url: URL of the page to scrape.
    :return: Page title or None if an error occurs.
    """
    time.sleep(2)  # Wait 2 seconds between requests
    return scrape_page(url)

def scrape_dynamic_page(url):
    """
    Scrape a JavaScript-rendered webpage using Selenium.
    :param url: URL of the page to scrape.
    :return: Page content (HTML).
    """
    options = Options()
    options.add_argument("--headless")  # Run in headless mode
    driver = webdriver.Chrome(options=options)
    try:
        driver.get(url)
        content = driver.page_source
        return content
    except Exception as e:
        print(f"Error in dynamic scraping: {e}")
        return None
    finally:
        driver.quit()
this is web scarping

import requests
from bs4 import BeautifulSoup
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def scrape_page(url):
    """
    Scrape a webpage and return the title.
    :param url: URL of the page to scrape.
    :return: Page title or None if an error occurs.
    """
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Raise an HTTPError for bad responses
        soup = BeautifulSoup(response.text, "html.parser")
        return soup.title.string
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def extract_elements(url, tag, attribute=None):
    """
    Extract elements from a webpage by tag and optional attribute.
    :param url: URL of the page to scrape.
    :param tag: HTML tag to search for (e.g., 'a', 'div').
    :param attribute: Optional attribute to extract (e.g., 'href').
    :return: List of extracted elements or an empty list if an error occurs.
    """
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        if attribute:
            return [element[attribute] for element in soup.find_all(tag) if attribute in element.attrs]
        return [element.text for element in soup.find_all(tag)]
    except Exception as e:
        print(f"Error extracting elements: {e}")
        return []

def rate_limited_scrape(url):
    """
    Scrape a webpage with rate limiting.
    :param url: URL of the page to scrape.
    :return: Page title or None if an error occurs.
    """
    time.sleep(2)  # Wait 2 seconds between requests
    return scrape_page(url)

def scrape_dynamic_page(url):
    """
    Scrape a JavaScript-rendered webpage using Selenium.
    :param url: URL of the page to scrape.
    :return: Page content (HTML).
    """
    options = Options()
    options.add_argument("--headless")  # Run in headless mode
    driver = webdriver.Chrome(options=options)
    try:
        driver.get(url)
        content = driver.page_source
        return content
    except Exception as e:
        print(f"Error in dynamic scraping: {e}")
        return None
    finally:
        driver.quit()
docer. compose. yml

GOOGLE_API_KEY =  
GOOGLE_CSE_ID = 
OPENAI_API_KEY
nhis is config.py

FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire app directory into the container
COPY ./app /app

# Expose the default Flask port (if using Flask)
EXPOSE 5000

# Set the entry point to run the app
CMD ["python", "main.py"]    this is docerfile

еще есть requirments.txt
gitignore здесь они не нужны
