const express = require('express')
const cors = require('cors')
const crypto = require('crypto')

const app = express()

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3000;

const stringDb = new Map();

function getSHA256(input) {
    return crypto.createHash('sha256').update(input).digest('hex')
}

function isPalindrome(input) {
    const cleanString = input.toLowerCase().replace(/[^a-z0-9]/g, '')
    const reversedString = cleanString.split('').reverse().join('')
    return cleanString === reversedString
}

function getWordCount(input) {
    const words = input.trim().split(/\s+/)
    return words.filter(word => word.length > 0).length;
}

function getUniqueChars(input) {
    return new Set(input.toLowerCase()).size
    // need to trim?
}


function getCharFrequency(input) {
    const freqMap = {}
    for (const char of input) {
        freqMap[char] = (freqMap[char] || 0) + 1
    }

    return freqMap
}

function analyzeString(value) {
    const hash = getSHA256(value)

    return {
        length: value.length,
        is_palindrome: isPalindrome(value),
        unique_characters: getUniqueChars(value),
        word_count: getWordCount(value),
        sha256_hash: hash,
        character_frequency_map: getCharFrequency(value)
    }
}

function applyFilters(allStrings, filters) {
    let results = allStrings;

    const {
        is_palindrome,
        min_length,
        max_length,
        word_count,
        contains_character
    } = filters;

    if (is_palindrome !== undefined) {
        const wantsPalindrome = String(is_palindrome) === 'true';
        results = results.filter(item => item.properties.is_palindrome === wantsPalindrome);
    }

    if (min_length !== undefined) {
        const min = parseInt(min_length, 10);
        if (!isNaN(min)) {
            results = results.filter(item => item.properties.length >= min);
        }
    }

    if (max_length !== undefined) {
        const max = parseInt(max_length, 10);
        if (!isNaN(max)) {
            results = results.filter(item => item.properties.length <= max);
        }
    }

    if (word_count !== undefined) {
        const count = parseInt(word_count, 10);
        if (!isNaN(count)) {
            results = results.filter(item => item.properties.word_count === count);
        }
    }

    if (contains_character !== undefined && typeof contains_character === 'string') {
        results = results.filter(item => item.properties.character_frequency_map[contains_character] > 0);
    }

    return results;
}

function parseNaturalLanguageQuery(query) {
    const normalizedQuery = query.toLowerCase()
    const filters = {}

    if (normalizedQuery.includes("palindromic") || normalizedQuery.includes("palindrome")) {
        filters.is_palindrome = true
    }

    if (normalizedQuery.includes("single word")) {
        filters.word_count = 1
    }

    const lengthMatch = normalizedQuery.match(/longer than (\d+)/)
    if (lengthMatch && lengthMatch[1]) {
        filters.min_length = parseInt(lengthMatch[1], 10) + 1
    }

    if (normalizedQuery.includes("first vowel")) {
        filters.contains_character = 'a';
    }

    const charMatch = normalizedQuery.match(/containing the letter ([a-z])/)
    if (charMatch && charMatch[1]) {
        filters.contains_character = charMatch[1]
    }

    const simpleCharMatch = normalizedQuery.match(/containing ([a-z])/)
    if (simpleCharMatch && simpleCharMatch[1] && !filters.contains_character) {
        filters.contains_character = simpleCharMatch[1]
    }

    return filters
}

app.post('/strings', (req, res) => {
    if (!req.body) {
        return res.status(400).json({ error: "Bad request: No request body provided" })
    }

    const { value } = req.body

    if (!value) {
        return res.status(400).json({ error: "Bad request: Missing value field" })
    }

    if (typeof value !== 'string') {
        return res.status(422).json({ error: 'Unprocessable entity: "value" must be a string' })
    }

    if (stringDb.has(value)) {
        return res.status(409).json({ error: "Conflict: String already exists" })
    }

    const properties = analyzeString(value)

    const analysisResult = {
        id: properties.sha256_hash,
        value: value,
        properties: properties,
        created_at: new Date().toISOString()
    }

    stringDb.set(value, analysisResult)

    res.status(201).json(analysisResult)
})

app.get('/strings/filter-by-natural-language', (req, res) => {
    const { query } = req.query

    if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Bad Request: Missing or invalid query parameter' })
    }

    const parsedFilters = parseNaturalLanguageQuery(query);

    if (Object.keys(parsedFilters).length === 0) {
        return res.status(400).json({ error: 'Bad request: Unable to parse natural language query' })
    }

    const allStrings = Array.from(stringDb.values())

    const results = applyFilters(allStrings, parsedFilters)

    res.status(200).json({
        data: results,
        count: results.length,
        interpreted_query: {
            original: query,
            parsed_filters: parsedFilters
        }
    })
})


app.get('/strings/:value', (req, res) => {
    const { value } = req.params

    if (stringDb.has(value)) {
        const analysisResult = stringDb.get(value)
        res.status(200).json(analysisResult)
    } else {
        res.status(404).json({ error: "Not found: String does not exist." })
    }
})

app.delete('/strings/:value', (req, res) => {
    const { value } = req.params

    if (stringDb.has(value)) {
        stringDb.delete(value)
        res.status(204).send()
    } else {
        res.status(404).json({ error: "Not found: String does not exist." })
    }
})

app.get('/strings', (req, res) => {
    const allStrings = Array.from(stringDb.values());
    const filters = req.query;

    const results = applyFilters(allStrings, filters);

    res.status(200).json({
        data: results,
        count: results.length,
        filters_applied: filters
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});