# HNG Stage 1 - String Analyzer Service

This is a Node.js and Express RESTful API built for the HNG Internship (Stage 1). The service analyzes input strings, computes their properties (like length, palindrome status, word count, etc.), and stores these properties in an in-memory database.

It provides a full suite of **C**reate, **R**ead, and **D**elete (CRD) endpoints, along with advanced filtering capabilities, including a basic natural language query parser.

## Features

* **POST /strings**: Analyzes and stores a new string.
* **GET /strings/:value**: Retrieves a specific string's analysis.
* **DELETE /strings/:value**: Deletes a string's analysis from memory.
* **GET /strings**: Retrieves all strings with query-based filtering.
* **GET /strings/filter-by-natural-language**: A heuristic-based parser for natural language queries.
* **In-Memory Storage**: Uses a JavaScript `Map` for fast, non-persistent data storage.
* **Input Validation**: Includes robust error handling for bad requests, conflicts, and unprocessable data.

---

## 1. Setup and Installation

Follow these steps to get the project running on your local machine.

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/chiefEbube/stage-one.git
    ```

2.  **Navigate to the Project Directory**:
    ```bash
    cd stage-one
    ```

3.  **Install Dependencies**:
    This project uses `npm` to manage all required packages.
    ```bash
    npm install
    ```

---

## 2. List of Dependencies

This project relies on the following `npm` packages:

* **[express](https://www.npmjs.com/package/express)**: The web application framework for Node.js.
* **[cors](https://www.npmjs.com/package/cors)**: Middleware to enable Cross-Origin Resource Sharing (CORS).

---

## 4. Running the Application Locally

Once you have installed the dependencies, you can start the server with:

```bash
npm start
````

The server will start and listen for connections. You will see a message in your console:
`Server is running on port 3000` (or your chosen port).

-----

## 5\. API Documentation

### 1\. Create/Analyze String

Analyzes a new string, computes its properties, and stores it.

  * **Endpoint**: `POST /strings`
  * **Request Body**:
    ```json
    {
      "value": "A new string to analyze"
    }
    ```
  * **Success Response (201 Created)**:
    ```json
    {
      "id": "a1b2c3d4...",
      "value": "A new string to analyze",
      "properties": {
        "length": 23,
        "is_palindrome": false,
        "unique_characters": 12,
        "word_count": 5,
        "sha256_hash": "a1b2c3d4...",
        "character_frequency_map": {
          "A": 1,
          " ": 4,
          "n": 2,
          // ... etc
        }
      },
      "created_at": "2025-10-21T03:30:00.123Z"
    }
    ```
  * **Error Responses**:
      * `400 Bad Request`: If the request body is missing or the `value` field is not provided.
      * `422 Unprocessable Entity`: If `value` is not a string (e.g., a number).
      * `409 Conflict`: If the exact string `value` has already been analyzed and stored.

### 2\. Get Specific String

Retrieves the analysis data for a single, specific string.

  * **Endpoint**: `GET /strings/:value`
  * **Example URL**: `http://localhost:3000/strings/hello%20world`
  * **Success Response (200 OK)**:
    ```json
    {
      "id": "b94d27b9934d3e08...",
      "value": "hello world",
      "properties": { /* ... */ },
      "created_at": "2025-10-21T03:32:00.456Z"
    }
    ```
  * **Error Response**:
      * `404 Not Found`: If the requested string does not exist in the database.

### 3\. Delete String

Deletes a string's analysis data from the store.

  * **Endpoint**: `DELETE /strings/:value`
  * **Example URL**: `http://localhost:3000/strings/hello%20world`
  * **Success Response (204 No Content)**:
      * An empty response body.
  * **Error Response**:
      * `404 Not Found`: If the string to be deleted does not exist.

### 4\. Get All Strings with Filtering

Retrieves an array of all analyzed strings, with the option to filter based on properties.

  * **Endpoint**: `GET /strings`
  * **Query Parameters (All Optional)**:
      * `is_palindrome`: `true` or `false`
      * `min_length`: integer (e.g., `5`)
      * `max_length`: integer (e.g., `20`)
      * `word_count`: integer (e.g., `2`)
      * `contains_character`: string (e.g., `a`)
  * **Example URL**: `http://localhost:3000/strings?is_palindrome=true&min_length=5`
  * **Success Response (200 OK)**:
    ```json
    {
      "data": [
        {
          "id": "f2f111b1f0e44a47...",
          "value": "racecar",
          "properties": { /* ... */ },
          "created_at": "2025-10-21T03:35:00.789Z"
        }
      ],
      "count": 1,
      "filters_applied": {
        "is_palindrome": "true",
        "min_length": "5"
      }
    }
    ```

### 5\. Natural Language Filtering

Retrieves an array of strings by parsing a natural language query.

  * **Endpoint**: `GET /strings/filter-by-natural-language`
  * **Query Parameter (Required)**:
      * `query`: A URL-encoded string (e.g., `all%20palindromic%20strings`)
  * **Example URL**: `http://localhost:3000/strings/filter-by-natural-language?query=strings%20longer%20than%2010%20characters`
  * **Success Response (200 OK)**:
    ```json
    {
      "data": [ /* ... array of matching strings ... */ ],
      "count": 1,
      "interpreted_query": {
        "original": "strings longer than 10 characters",
        "parsed_filters": {
          "min_length": 11
        }
      }
    }
    ```
  * **Error Responses**:
      * `400 Bad Request`: If the `query` parameter is missing.
      * `400 Bad Request`: If the query cannot be parsed by any known heuristics.