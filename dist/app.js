"use strict";
var ReceiptRing;
(function (ReceiptRing) {
    var Config;
    (function (Config) {
        Config.CATEGORIES = [
            {
                name: "Groceries",
                color: "#43d6a3",
                keywords: [
                    "apple",
                    "banana",
                    "bread",
                    "milk",
                    "eggs",
                    "yogurt",
                    "cheese",
                    "produce",
                    "market",
                    "grocery",
                    "organic",
                    "cereal",
                    "rice",
                    "pasta",
                    "flour",
                    "sugar",
                    "butter",
                    "juice",
                    "chicken",
                    "beef",
                    "fish",
                    "lettuce",
                    "tomato",
                    "avocado",
                    "potato",
                    "onion",
                    "snack",
                    "chips",
                    "sauce",
                    "water"
                ]
            },
            {
                name: "Dining",
                color: "#ff6d5f",
                keywords: [
                    "coffee",
                    "latte",
                    "burger",
                    "pizza",
                    "taco",
                    "restaurant",
                    "cafe",
                    "deli",
                    "sandwich",
                    "salad",
                    "tea",
                    "bowl",
                    "espresso",
                    "grill",
                    "bar",
                    "bakery",
                    "donut",
                    "sushi",
                    "noodle",
                    "meal",
                    "combo",
                    "takeout"
                ]
            },
            {
                name: "Home",
                color: "#f8bd45",
                keywords: [
                    "detergent",
                    "soap",
                    "towel",
                    "paper",
                    "cleaner",
                    "trash",
                    "storage",
                    "kitchen",
                    "home",
                    "batteries",
                    "foil",
                    "tissue",
                    "napkin",
                    "laundry",
                    "dish",
                    "sponge",
                    "wipes",
                    "bulb",
                    "decor",
                    "hardware",
                    "garden"
                ]
            },
            {
                name: "Health",
                color: "#b58cff",
                keywords: [
                    "vitamin",
                    "pharmacy",
                    "medicine",
                    "rx",
                    "bandage",
                    "wellness",
                    "protein",
                    "toothpaste",
                    "shampoo",
                    "ibuprofen",
                    "acetaminophen",
                    "allergy",
                    "first aid",
                    "mouthwash",
                    "deodorant",
                    "supplement",
                    "clinic"
                ]
            },
            {
                name: "Transport",
                color: "#5ca8ff",
                keywords: [
                    "fuel",
                    "gas",
                    "gasoline",
                    "parking",
                    "uber",
                    "lyft",
                    "transit",
                    "metro",
                    "toll",
                    "car wash",
                    "bus",
                    "train",
                    "taxi",
                    "airfare",
                    "rideshare",
                    "oil change"
                ]
            },
            {
                name: "Personal",
                color: "#ff89c2",
                keywords: [
                    "shirt",
                    "socks",
                    "cosmetic",
                    "lotion",
                    "beauty",
                    "skincare",
                    "hair",
                    "gift",
                    "jeans",
                    "shoes",
                    "jacket",
                    "makeup",
                    "perfume",
                    "razor",
                    "clothing"
                ]
            },
            {
                name: "Entertainment",
                color: "#96dc5c",
                keywords: [
                    "movie",
                    "book",
                    "game",
                    "ticket",
                    "music",
                    "stream",
                    "toy",
                    "concert",
                    "theater",
                    "museum",
                    "bowling",
                    "arcade",
                    "subscription"
                ]
            },
            {
                name: "Other",
                color: "#a5a097",
                keywords: []
            }
        ];
    })(Config = ReceiptRing.Config || (ReceiptRing.Config = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var Config;
    (function (Config) {
        Config.SAMPLE_RECEIPT = `FRESH MARKET
Organic bananas        3.49
Sourdough bread        5.25
Greek yogurt           6.99
Paper towels           8.79
Vitamins              13.49
Cold brew coffee       4.75
Reusable storage bags  7.20
Subtotal              49.96
Tax                    3.74
Total                 53.70`;
    })(Config = ReceiptRing.Config || (ReceiptRing.Config = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var Services;
    (function (Services) {
        class IdService {
            create() {
                return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            }
        }
        Services.IdService = IdService;
    })(Services = ReceiptRing.Services || (ReceiptRing.Services = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var Services;
    (function (Services) {
        class CurrencyFormatService {
            constructor() {
                this.formatter = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD"
                });
            }
            format(value) {
                return this.formatter.format(Number(value) || 0);
            }
        }
        Services.CurrencyFormatService = CurrencyFormatService;
    })(Services = ReceiptRing.Services || (ReceiptRing.Services = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var Services;
    (function (Services) {
        class CategoryRuleStorageService {
            constructor(storageKey) {
                this.storageKey = storageKey;
            }
            getCategoryFor(label) {
                const normalizedLabel = this.normalizeLabel(label);
                return this.loadRules()[normalizedLabel]?.category ?? null;
            }
            saveRule(label, category) {
                const normalizedLabel = this.normalizeLabel(label);
                if (!normalizedLabel)
                    return;
                const rules = this.loadRules();
                rules[normalizedLabel] = {
                    normalizedLabel,
                    category,
                    createdAt: new Date().toISOString()
                };
                try {
                    localStorage.setItem(this.storageKey, JSON.stringify(rules));
                }
                catch {
                }
            }
            normalizeLabel(label) {
                return label
                    .toLowerCase()
                    .replace(/&/g, " and ")
                    .replace(/[^a-z0-9\s]/g, " ")
                    .replace(/\b(\d+(\.\d+)?|oz|lb|lbs|ct|pk|pkg|ea|each|small|medium|large)\b/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();
            }
            loadRules() {
                try {
                    const rawRules = localStorage.getItem(this.storageKey);
                    const parsed = rawRules ? JSON.parse(rawRules) : {};
                    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
                        ? parsed
                        : {};
                }
                catch {
                    return {};
                }
            }
        }
        Services.CategoryRuleStorageService = CategoryRuleStorageService;
    })(Services = ReceiptRing.Services || (ReceiptRing.Services = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var Services;
    (function (Services) {
        class CategorizationService {
            constructor(categories, ruleStorageService) {
                this.categories = categories;
                this.ruleStorageService = ruleStorageService;
                this.promptThreshold = 0.66;
            }
            categorize(label) {
                const savedCategory = this.ruleStorageService.getCategoryFor(label);
                if (savedCategory) {
                    return {
                        category: savedCategory,
                        confidence: 1,
                        source: "saved-rule",
                        matchedTerms: [],
                        shouldPrompt: false
                    };
                }
                const normalizedLabel = this.ruleStorageService.normalizeLabel(label);
                const tokens = this.getTokens(normalizedLabel);
                const scoredCategories = this.categories
                    .filter((category) => category.name !== "Other")
                    .map((category) => this.scoreCategory(category, normalizedLabel, tokens))
                    .sort((left, right) => right.score - left.score);
                const bestMatch = scoredCategories[0];
                const runnerUp = scoredCategories[1];
                if (!bestMatch || bestMatch.score <= 0) {
                    return this.createUncertainResult("Other", 0.18);
                }
                const margin = bestMatch.score - (runnerUp?.score ?? 0);
                const confidence = Math.min(0.96, 0.48 + bestMatch.score * 0.095 + margin * 0.055);
                if (confidence < this.promptThreshold) {
                    return this.createUncertainResult(bestMatch.category.name, confidence, bestMatch.matchedTerms);
                }
                return {
                    category: bestMatch.category.name,
                    confidence,
                    source: "keyword-match",
                    matchedTerms: bestMatch.matchedTerms,
                    shouldPrompt: false
                };
            }
            scoreCategory(category, normalizedLabel, tokens) {
                const matchedTerms = [];
                let score = 0;
                category.keywords.forEach((keyword) => {
                    const normalizedKeyword = this.ruleStorageService.normalizeLabel(keyword);
                    if (!normalizedKeyword)
                        return;
                    const keywordTokens = this.getTokens(normalizedKeyword);
                    const isPhrase = keywordTokens.length > 1;
                    if (isPhrase && normalizedLabel.includes(normalizedKeyword)) {
                        score += 4.5;
                        matchedTerms.push(keyword);
                        return;
                    }
                    if (!isPhrase && tokens.includes(keywordTokens[0])) {
                        score += 3;
                        matchedTerms.push(keyword);
                        return;
                    }
                    const overlap = keywordTokens.filter((token) => tokens.includes(token)).length;
                    if (overlap > 0) {
                        score += overlap * 1.25;
                        matchedTerms.push(keyword);
                    }
                });
                return { category, score, matchedTerms };
            }
            createUncertainResult(category, confidence, matchedTerms = []) {
                return {
                    category,
                    confidence,
                    source: "uncertain",
                    matchedTerms,
                    shouldPrompt: true
                };
            }
            getTokens(value) {
                const stopWords = new Set(["and", "the", "with", "for", "fresh", "organic", "item"]);
                return value
                    .split(" ")
                    .map((token) => token.trim())
                    .map((token) => this.stemToken(token))
                    .filter((token) => token.length > 1 && !stopWords.has(token));
            }
            stemToken(token) {
                if (token.endsWith("ies") && token.length > 4) {
                    return `${token.slice(0, -3)}y`;
                }
                if (token.endsWith("es") && token.length > 3) {
                    return token.slice(0, -2);
                }
                if (token.endsWith("s") && token.length > 3) {
                    return token.slice(0, -1);
                }
                return token;
            }
        }
        Services.CategorizationService = CategorizationService;
    })(Services = ReceiptRing.Services || (ReceiptRing.Services = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var Services;
    (function (Services) {
        class ReceiptParserService {
            constructor(categorizationService, idService) {
                this.categorizationService = categorizationService;
                this.idService = idService;
                this.ignoredLabel = /^(total|subtotal|tax|cash|change|visa|mastercard|amex|debit|credit|balance|auth|approval|receipt)\b/i;
                this.amountPattern = /(?:^|\s)(-?\$?\s*\d+(?:,\d{3})*[,.]\d{2}|-?\$\s*\d+)\s*$/;
            }
            parse(text) {
                return text
                    .split(/\n+/)
                    .map((line) => line.replace(/\s+/g, " ").trim())
                    .filter(Boolean)
                    .map((line) => this.parseLine(line))
                    .filter((item) => item !== null);
            }
            parseLine(line) {
                const match = line.match(this.amountPattern);
                if (!match || match.index === undefined)
                    return null;
                const amount = this.parseAmount(match[1]);
                const label = line
                    .slice(0, match.index)
                    .replace(/[*#@]/g, "")
                    .replace(/\b\d{4,}\b/g, "")
                    .trim();
                if (!label || this.ignoredLabel.test(label) || !Number.isFinite(amount) || amount === 0) {
                    return null;
                }
                const categorization = this.categorizationService.categorize(label);
                return {
                    id: this.idService.create(),
                    label: this.toTitleCase(label),
                    amount: Number(amount.toFixed(2)),
                    category: categorization.category,
                    categorizationConfidence: categorization.confidence,
                    categorizationSource: categorization.source,
                    needsCategoryReview: categorization.shouldPrompt
                };
            }
            toTitleCase(value) {
                return value
                    .toLowerCase()
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");
            }
            parseAmount(value) {
                const compactValue = value.replace(/[$\s]/g, "");
                const normalizedValue = compactValue.includes(".") || !compactValue.includes(",")
                    ? compactValue.replace(/,/g, "")
                    : compactValue.replace(",", ".");
                return Number(normalizedValue);
            }
        }
        Services.ReceiptParserService = ReceiptParserService;
    })(Services = ReceiptRing.Services || (ReceiptRing.Services = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var Services;
    (function (Services) {
        class SplitCalculatorService {
            calculate(people, lines, assignments, tax) {
                const itemCents = new Map();
                people.forEach((person) => itemCents.set(person.id, 0));
                let unallocatedCents = 0;
                lines
                    .filter((line) => !line.ignored)
                    .forEach((line) => {
                    const lineAssignments = assignments.filter((assignment) => assignment.lineId === line.id);
                    if (lineAssignments.length === 0)
                        return;
                    const shares = this.getLineShares(line, lineAssignments);
                    let allocated = 0;
                    shares.forEach((cents, personId) => {
                        itemCents.set(personId, (itemCents.get(personId) ?? 0) + cents);
                        allocated += cents;
                    });
                    unallocatedCents += this.toCents(line.amount) - allocated;
                });
                const orderedPeople = [...people];
                const weights = orderedPeople.map((person) => itemCents.get(person.id) ?? 0);
                const taxShares = this.distributeProportionally(this.toCents(tax), weights);
                const totals = orderedPeople.map((person, index) => {
                    const itemTotal = weights[index];
                    const allocatedTax = taxShares[index];
                    return {
                        personId: person.id,
                        personName: person.name,
                        itemTotal: this.toAmount(itemTotal),
                        allocatedTax: this.toAmount(allocatedTax),
                        finalTotal: this.toAmount(itemTotal + allocatedTax)
                    };
                });
                return { totals, unallocated: this.toAmount(unallocatedCents) };
            }
            getUnassignedCount(lines, assignments) {
                return lines.filter((line) => !line.ignored && !assignments.some((assignment) => assignment.lineId === line.id)).length;
            }
            getLineShares(line, assignments) {
                const shares = new Map();
                if (assignments.length === 0)
                    return shares;
                const lineCents = this.toCents(line.amount);
                if (assignments.every((assignment) => assignment.mode === "equal")) {
                    const even = this.distributeEvenly(lineCents, assignments.length);
                    assignments.forEach((assignment, index) => shares.set(assignment.personId, even[index]));
                    return shares;
                }
                const equalCount = assignments.filter((assignment) => assignment.mode === "equal").length;
                const equalShares = equalCount > 0 ? this.distributeEvenly(lineCents, assignments.length) : [];
                let equalIndex = 0;
                assignments.forEach((assignment) => {
                    if (assignment.mode === "percentage") {
                        shares.set(assignment.personId, Math.round(lineCents * (assignment.value / 100)));
                    }
                    else if (assignment.mode === "amount") {
                        shares.set(assignment.personId, this.toCents(assignment.value));
                    }
                    else {
                        shares.set(assignment.personId, equalShares[equalIndex]);
                        equalIndex += 1;
                    }
                });
                return shares;
            }
            distributeEvenly(totalCents, count) {
                if (count <= 0)
                    return [];
                const base = Math.trunc(totalCents / count);
                let remainder = totalCents - base * count;
                const step = remainder < 0 ? -1 : 1;
                return Array.from({ length: count }, () => {
                    if (remainder === 0)
                        return base;
                    remainder -= step;
                    return base + step;
                });
            }
            distributeProportionally(totalCents, weights) {
                const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
                if (weightSum === 0 || totalCents === 0)
                    return weights.map(() => 0);
                const exact = weights.map((weight) => (weight / weightSum) * totalCents);
                const result = exact.map((value) => Math.trunc(value));
                let remainder = totalCents - result.reduce((sum, value) => sum + value, 0);
                const step = remainder < 0 ? -1 : 1;
                const byFraction = exact
                    .map((value, index) => ({ index, fraction: Math.abs(value - result[index]) }))
                    .sort((left, right) => right.fraction - left.fraction);
                for (const { index } of byFraction) {
                    if (remainder === 0)
                        break;
                    result[index] += step;
                    remainder -= step;
                }
                return result;
            }
            toCents(value) {
                return Number.isFinite(value) ? Math.round(value * 100) : 0;
            }
            toAmount(cents) {
                return cents / 100;
            }
        }
        Services.SplitCalculatorService = SplitCalculatorService;
    })(Services = ReceiptRing.Services || (ReceiptRing.Services = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var Services;
    (function (Services) {
        class StorageService {
            constructor(storageKey) {
                this.storageKey = storageKey;
            }
            load() {
                try {
                    const rawValue = localStorage.getItem(this.storageKey);
                    const parsed = rawValue ? JSON.parse(rawValue) : [];
                    return Array.isArray(parsed) ? parsed : [];
                }
                catch {
                    return [];
                }
            }
            save(items) {
                try {
                    localStorage.setItem(this.storageKey, JSON.stringify(items));
                }
                catch {
                }
            }
        }
        Services.StorageService = StorageService;
    })(Services = ReceiptRing.Services || (ReceiptRing.Services = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var Services;
    (function (Services) {
        class ImagePreviewService {
            show(file, image, container) {
                const reader = new FileReader();
                reader.onload = () => {
                    image.src = String(reader.result);
                    container.classList.remove("hidden");
                };
                reader.readAsDataURL(file);
            }
            clear(input, image, container) {
                input.value = "";
                image.removeAttribute("src");
                container.classList.add("hidden");
            }
        }
        Services.ImagePreviewService = ImagePreviewService;
    })(Services = ReceiptRing.Services || (ReceiptRing.Services = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var Services;
    (function (Services) {
        const MAX_DIMENSION = 1600;
        const JPEG_QUALITY = 0.82;
        class ReceiptImageService {
            async toStorableDataUrl(file) {
                try {
                    const source = await this.decode(file);
                    const scale = Math.min(1, MAX_DIMENSION / Math.max(source.width, source.height));
                    const canvas = document.createElement("canvas");
                    canvas.width = Math.max(1, Math.round(source.width * scale));
                    canvas.height = Math.max(1, Math.round(source.height * scale));
                    const context = canvas.getContext("2d");
                    if (!context)
                        return null;
                    context.drawImage(source, 0, 0, canvas.width, canvas.height);
                    if ("close" in source) {
                        source.close();
                    }
                    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
                }
                catch (error) {
                    console.error("Could not prepare the receipt image for saving:", error);
                    return null;
                }
            }
            async decode(file) {
                if (typeof createImageBitmap === "function") {
                    return createImageBitmap(file, { imageOrientation: "from-image" });
                }
                const url = URL.createObjectURL(file);
                try {
                    return await new Promise((resolve, reject) => {
                        const image = new Image();
                        image.onload = () => resolve(image);
                        image.onerror = () => reject(new Error("Could not decode the image."));
                        image.src = url;
                    });
                }
                finally {
                    URL.revokeObjectURL(url);
                }
            }
        }
        Services.ReceiptImageService = ReceiptImageService;
    })(Services = ReceiptRing.Services || (ReceiptRing.Services = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var Services;
    (function (Services) {
        class GeminiService {
            async loadConfig() {
                try {
                    const response = await fetch("/api/gemini-config", { credentials: "same-origin" });
                    if (response.ok) {
                        const config = (await response.json());
                        return {
                            model: config.GEMINI_MODEL || "",
                            hasServerKey: Boolean(config.hasServerKey),
                            hasUserKey: Boolean(config.hasUserKey)
                        };
                    }
                }
                catch {
                }
                return { model: "", hasServerKey: false, hasUserKey: false };
            }
            async saveApiKey(apiKey) {
                const response = await fetch("/api/gemini-key", {
                    method: "PUT",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ apiKey })
                });
                if (!response.ok) {
                    const body = (await response.json().catch(() => ({})));
                    throw new Error(body.error || "Could not save the key.");
                }
            }
            async clearApiKey() {
                const response = await fetch("/api/gemini-key", {
                    method: "DELETE",
                    credentials: "same-origin"
                });
                if (!response.ok) {
                    const body = (await response.json().catch(() => ({})));
                    throw new Error(body.error || "Could not clear the key.");
                }
            }
            fileToBase64(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const result = reader.result;
                        const base64 = result.split(",")[1];
                        resolve(base64);
                    };
                    reader.onerror = (error) => reject(error);
                    reader.readAsDataURL(file);
                });
            }
            async parseReceiptImage(file, model) {
                const base64Data = await this.fileToBase64(file);
                const proxyResponse = await fetch("/api/gemini/parse", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ model, mimeType: file.type, imageBase64: base64Data })
                });
                if (!proxyResponse.ok) {
                    const errText = await proxyResponse.text();
                    throw new Error(`Receipt parsing failed (${proxyResponse.status}): ${errText}`);
                }
                return this.extractParsedJson(await proxyResponse.json());
            }
            extractParsedJson(json) {
                const textResult = json?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!textResult) {
                    console.error("Gemini response structure:", JSON.stringify(json, null, 2));
                    throw new Error("No response text returned from Gemini.");
                }
                let cleanedText = "";
                try {
                    cleanedText = textResult.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
                    return JSON.parse(cleanedText);
                }
                catch (e) {
                    console.error("Failed to parse Gemini JSON output.");
                    console.error("Raw text:", textResult);
                    console.error("Cleaned text:", cleanedText);
                    console.error("Parse error:", e instanceof Error ? e.message : String(e));
                    const errorMsg = e instanceof Error ? e.message : "Unknown error";
                    throw new Error(`Failed to parse receipt JSON from Gemini: ${errorMsg}. Check browser console for details.`);
                }
            }
        }
        Services.GeminiService = GeminiService;
    })(Services = ReceiptRing.Services || (ReceiptRing.Services = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var Services;
    (function (Services) {
        class ReceiptApiService {
            imageUrl(receiptId) {
                return `/api/receipts/${encodeURIComponent(receiptId)}/image`;
            }
            async save(payload) {
                const response = await fetch("/api/receipts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(`Save failed (${response.status}): ${message}`);
                }
                return (await response.json());
            }
            async list() {
                const response = await fetch("/api/receipts");
                if (!response.ok) {
                    throw new Error(`Could not load history (${response.status}).`);
                }
                return (await response.json());
            }
            async remove(id) {
                const response = await fetch(`/api/receipts/${encodeURIComponent(id)}`, {
                    method: "DELETE"
                });
                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(`Delete failed (${response.status}): ${message}`);
                }
            }
            async updateLineFood(receiptId, lineId, isFood) {
                const response = await fetch(`/api/receipts/${encodeURIComponent(receiptId)}/lines/${encodeURIComponent(lineId)}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isFood })
                });
                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(`Update failed (${response.status}): ${message}`);
                }
            }
            async getFoodSummary(month) {
                const url = month
                    ? `/api/receipts/food-summary?month=${encodeURIComponent(month)}`
                    : "/api/receipts/food-summary";
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Could not load food summary (${response.status}).`);
                }
                return (await response.json());
            }
            async linkTransactionToReceipt(receiptId, bankTransactionId) {
                const response = await fetch(`/api/receipts/${encodeURIComponent(receiptId)}/link-transaction`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bankTransactionId })
                });
                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(`Link failed (${response.status}): ${message}`);
                }
            }
            async unlinkTransactionFromReceipt(receiptId) {
                const response = await fetch(`/api/receipts/${encodeURIComponent(receiptId)}/link-transaction`, {
                    method: "DELETE"
                });
                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(`Unlink failed (${response.status}): ${message}`);
                }
            }
        }
        Services.ReceiptApiService = ReceiptApiService;
    })(Services = ReceiptRing.Services || (ReceiptRing.Services = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var Services;
    (function (Services) {
        class AuthApiService {
            async request(path, init) {
                return fetch(path, { credentials: "same-origin", ...init });
            }
            async parseError(response) {
                try {
                    const data = (await response.json());
                    return data.error ?? `Request failed (${response.status}).`;
                }
                catch {
                    return `Request failed (${response.status}).`;
                }
            }
            async me() {
                const response = await this.request("/api/auth/me");
                if (!response.ok)
                    throw new Error(await this.parseError(response));
                return (await response.json());
            }
            async login(email, password) {
                const response = await this.request("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });
                if (!response.ok)
                    throw new Error(await this.parseError(response));
                return (await response.json());
            }
            async register(email, password, name) {
                const response = await this.request("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password, name })
                });
                if (!response.ok)
                    throw new Error(await this.parseError(response));
                return (await response.json());
            }
            async logout() {
                await this.request("/api/auth/logout", { method: "POST" });
            }
        }
        Services.AuthApiService = AuthApiService;
    })(Services = ReceiptRing.Services || (ReceiptRing.Services = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var Services;
    (function (Services) {
        class BankApiService {
            async request(path, init) {
                return fetch(path, { credentials: "same-origin", ...init });
            }
            async parseError(response) {
                try {
                    const data = (await response.json());
                    return data.error ?? `Request failed (${response.status}).`;
                }
                catch {
                    return `Request failed (${response.status}).`;
                }
            }
            async createLinkToken() {
                const response = await this.request("/api/plaid/link-token");
                if (!response.ok)
                    throw new Error(await this.parseError(response));
                return (await response.json());
            }
            async exchange(publicToken, metadata) {
                const response = await this.request("/api/plaid/exchange", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ publicToken, metadata })
                });
                if (!response.ok)
                    throw new Error(await this.parseError(response));
                return (await response.json());
            }
            async sync() {
                const response = await this.request("/api/plaid/sync", { method: "POST" });
                if (!response.ok)
                    throw new Error(await this.parseError(response));
                return (await response.json());
            }
            async listConnections() {
                const response = await this.request("/api/plaid/connections");
                if (!response.ok)
                    throw new Error(await this.parseError(response));
                return (await response.json());
            }
            async removeConnection(id) {
                const response = await this.request(`/api/plaid/connections/${encodeURIComponent(id)}`, {
                    method: "DELETE"
                });
                if (!response.ok)
                    throw new Error(await this.parseError(response));
            }
            async listTransactions() {
                const response = await this.request("/api/transactions");
                if (!response.ok)
                    throw new Error(await this.parseError(response));
                return (await response.json());
            }
        }
        Services.BankApiService = BankApiService;
    })(Services = ReceiptRing.Services || (ReceiptRing.Services = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var Services;
    (function (Services) {
        class PeopleApiService {
            async list() {
                const response = await fetch("/api/people");
                if (!response.ok) {
                    throw new Error(`Could not load people (${response.status}).`);
                }
                return (await response.json());
            }
            async add(name) {
                const response = await fetch("/api/people", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name })
                });
                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(`Add failed (${response.status}): ${message}`);
                }
                return (await response.json());
            }
            async delete(id) {
                const response = await fetch(`/api/people/${encodeURIComponent(id)}`, {
                    method: "DELETE"
                });
                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(`Delete failed (${response.status}): ${message}`);
                }
            }
            async search(query) {
                const response = await fetch(`/api/people/search?q=${encodeURIComponent(query)}`);
                if (!response.ok) {
                    throw new Error(`Search failed (${response.status}).`);
                }
                return (await response.json());
            }
        }
        Services.PeopleApiService = PeopleApiService;
    })(Services = ReceiptRing.Services || (ReceiptRing.Services = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var Services;
    (function (Services) {
        const FALLBACK_COLORS = ["#7cc4ff", "#f0a6ca", "#c3b1e1", "#ffd6a5", "#9ee7c0", "#e8998d"];
        const CATEGORY_ALIASES = {
            dining: "Dining",
            restaurants: "Dining",
            bar: "Dining",
            coffee: "Dining",
            groceries: "Groceries",
            grocery: "Groceries",
            supermarket: "Groceries",
            transport: "Transport",
            transportation: "Transport",
            fuel: "Transport",
            gas: "Transport",
            travel: "Transport",
            entertainment: "Entertainment",
            health: "Health",
            healthcare: "Health",
            medical: "Health",
            home: "Home",
            utilities: "Home",
            shopping: "Personal",
            clothing: "Personal",
            personal: "Personal",
            general: "Other"
        };
        class SpendingAggregatorService {
            constructor(categories) {
                this.colorByName = new Map();
                for (const category of categories) {
                    this.colorByName.set(category.name, category.color);
                }
            }
            aggregate(receipts, transactions) {
                const byMonth = new Map();
                const add = (dateStr, rawCategory, amount) => {
                    if (!(amount > 0))
                        return;
                    const month = this.monthKey(dateStr);
                    if (!month)
                        return;
                    const category = this.normalize(rawCategory);
                    const bucket = byMonth.get(month) ?? new Map();
                    bucket.set(category, (bucket.get(category) ?? 0) + amount);
                    byMonth.set(month, bucket);
                };
                for (const receipt of receipts) {
                    add(receipt.createdAt, receipt.category, receipt.total ?? 0);
                }
                for (const txn of transactions) {
                    add(txn.date, txn.category, txn.amount < 0 ? -txn.amount : 0);
                }
                return [...byMonth.entries()]
                    .map(([month, bucket]) => ({
                    month,
                    total: [...bucket.values()].reduce((sum, value) => sum + value, 0),
                    categories: [...bucket.entries()]
                        .map(([category, amount]) => ({ category, amount, color: this.color(category) }))
                        .sort((a, b) => b.amount - a.amount)
                }))
                    .sort((a, b) => (a.month < b.month ? 1 : -1));
            }
            monthKey(dateStr) {
                if (typeof dateStr === "string" && /^\d{4}-\d{2}(-\d{2})?$/.test(dateStr)) {
                    return dateStr.slice(0, 7);
                }
                const date = new Date(dateStr);
                if (Number.isNaN(date.getTime()))
                    return null;
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            }
            normalize(raw) {
                if (!raw)
                    return "Other";
                const key = raw.trim().toLowerCase();
                if (CATEGORY_ALIASES[key])
                    return CATEGORY_ALIASES[key];
                return key.charAt(0).toUpperCase() + key.slice(1);
            }
            color(name) {
                const known = this.colorByName.get(name);
                if (known)
                    return known;
                let hash = 0;
                for (let i = 0; i < name.length; i += 1) {
                    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
                }
                return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
            }
        }
        Services.SpendingAggregatorService = SpendingAggregatorService;
    })(Services = ReceiptRing.Services || (ReceiptRing.Services = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var UI;
    (function (UI) {
        class DomRegistryFactory {
            create() {
                return {
                    sampleButton: this.getElement("#sampleButton", HTMLButtonElement),
                    receiptImage: this.getElement("#receiptImage", HTMLInputElement),
                    dropzone: this.getElement("#dropzone", HTMLElement),
                    receiptPreviewWrap: this.getElement("#receiptPreviewWrap", HTMLElement),
                    receiptPreview: this.getElement("#receiptPreview", HTMLImageElement),
                    clearImageButton: this.getElement("#clearImageButton", HTMLButtonElement),
                    ocrStatus: this.getElement("#ocrStatus", HTMLElement),
                    ocrStatusText: this.getElement("#ocrStatusText", HTMLElement),
                    ocrProgressBar: this.getElement("#ocrProgressBar", HTMLElement),
                    receiptText: this.getElement("#receiptText", HTMLTextAreaElement),
                    openCameraButton: this.getElement("#openCameraButton", HTMLButtonElement),
                    cameraModal: this.getElement("#cameraModal", HTMLElement),
                    cameraVideo: this.getElement("#cameraVideo", HTMLVideoElement),
                    cameraCanvas: this.getElement("#cameraCanvas", HTMLCanvasElement),
                    closeCameraButton: this.getElement("#closeCameraButton", HTMLButtonElement),
                    capturePhotoButton: this.getElement("#capturePhotoButton", HTMLButtonElement),
                    parseButton: this.getElement("#parseButton", HTMLButtonElement),
                    clearButton: this.getElement("#clearButton", HTMLButtonElement),
                    receiptLinesList: this.getElement("#receiptLinesList", HTMLElement),
                    emptyState: this.getElement("#emptyState", HTMLElement),
                    unassignedCount: this.getElement("#unassignedCount", HTMLElement),
                    storeNameInput: this.getElement("#storeNameInput", HTMLInputElement),
                    receiptCategory: this.getElement("#receiptCategory", HTMLSelectElement),
                    personNameInput: this.getElement("#personNameInput", HTMLInputElement),
                    addPersonButton: this.getElement("#addPersonButton", HTMLButtonElement),
                    peopleList: this.getElement("#peopleList", HTMLElement),
                    taxInput: this.getElement("#taxInput", HTMLInputElement),
                    splitTotalsList: this.getElement("#splitTotalsList", HTMLElement),
                    saveReceiptButton: this.getElement("#saveReceiptButton", HTMLButtonElement),
                    saveStatus: this.getElement("#saveStatus", HTMLElement),
                    itemCount: this.getElement("#itemCount", HTMLElement),
                    receiptTotal: this.getElement("#receiptTotal", HTMLElement),
                    tabButtons: Array.from(document.querySelectorAll(".tab-button")).filter((element) => element instanceof HTMLButtonElement),
                    receiptsView: this.getElement("#receiptsView", HTMLElement),
                    historyView: this.getElement("#historyView", HTMLElement),
                    budgetingView: this.getElement("#budgetingView", HTMLElement),
                    historyList: this.getElement("#historyList", HTMLElement),
                    historyEmpty: this.getElement("#historyEmpty", HTMLElement),
                    refreshHistoryButton: this.getElement("#refreshHistoryButton", HTMLButtonElement),
                    categoryPrompt: this.getElement("#categoryPrompt", HTMLElement),
                    categoryPromptItem: this.getElement("#categoryPromptItem", HTMLElement),
                    categoryPromptSelect: this.getElement("#categoryPromptSelect", HTMLSelectElement),
                    categoryPromptRemember: this.getElement("#categoryPromptRemember", HTMLInputElement),
                    categoryPromptSkip: this.getElement("#categoryPromptSkip", HTMLButtonElement),
                    categoryPromptSave: this.getElement("#categoryPromptSave", HTMLButtonElement),
                    settingsButton: this.getElement("#settingsButton", HTMLButtonElement),
                    settingsModal: this.getElement("#settingsModal", HTMLElement),
                    geminiApiKey: this.getElement("#geminiApiKey", HTMLInputElement),
                    geminiModel: this.getElement("#geminiModel", HTMLSelectElement),
                    geminiKeyStatus: this.getElement("#geminiKeyStatus", HTMLElement),
                    removeKeyButton: this.getElement("#removeKeyButton", HTMLButtonElement),
                    closeSettingsButton: this.getElement("#closeSettingsButton", HTMLButtonElement),
                    saveSettingsButton: this.getElement("#saveSettingsButton", HTMLButtonElement),
                    authOverlay: this.getElement("#authOverlay", HTMLElement),
                    authForm: this.getElement("#authForm", HTMLFormElement),
                    authTitle: this.getElement("#authTitle", HTMLElement),
                    authNameField: this.getElement("#authNameField", HTMLElement),
                    authName: this.getElement("#authName", HTMLInputElement),
                    authEmail: this.getElement("#authEmail", HTMLInputElement),
                    authPassword: this.getElement("#authPassword", HTMLInputElement),
                    authSubmit: this.getElement("#authSubmit", HTMLButtonElement),
                    authError: this.getElement("#authError", HTMLElement),
                    authSwitchText: this.getElement("#authSwitchText", HTMLElement),
                    authToggle: this.getElement("#authToggle", HTMLButtonElement),
                    logoutButton: this.getElement("#logoutButton", HTMLButtonElement),
                    monthlyTrend: this.getElement("#monthlyTrend", HTMLElement),
                    budgetMonth: this.getElement("#budgetMonth", HTMLSelectElement),
                    budgetRing: this.getElement("#budgetRing", HTMLElement),
                    budgetLegend: this.getElement("#budgetLegend", HTMLElement),
                    connectBankButton: this.getElement("#connectBankButton", HTMLButtonElement),
                    refreshTransactionsButton: this.getElement("#refreshTransactionsButton", HTMLButtonElement),
                    bankStatus: this.getElement("#bankStatus", HTMLElement),
                    bankConnections: this.getElement("#bankConnections", HTMLElement),
                    transactionsList: this.getElement("#transactionsList", HTMLElement),
                    transactionsEmpty: this.getElement("#transactionsEmpty", HTMLElement),
                    addRentEntryButton: this.getElement("#addRentEntryButton", HTMLButtonElement),
                    rentEntriesList: this.getElement("#rentEntriesList", HTMLElement),
                    rentEntryModal: this.getElement("#rentEntryModal", HTMLElement),
                    rentEntryDate: this.getElement("#rentEntryDate", HTMLInputElement),
                    rentEntryAmount: this.getElement("#rentEntryAmount", HTMLInputElement),
                    rentEntryProperty: this.getElement("#rentEntryProperty", HTMLInputElement),
                    rentEntryPhoto: this.getElement("#rentEntryPhoto", HTMLInputElement),
                    rentEntryCancelButton: this.getElement("#rentEntryCancelButton", HTMLButtonElement),
                    rentEntrySaveButton: this.getElement("#rentEntrySaveButton", HTMLButtonElement),
                    receiptLinkModal: this.getElement("#receiptLinkModal", HTMLElement),
                    receiptLinkList: this.getElement("#receiptLinkList", HTMLElement),
                    receiptLinkCancelButton: this.getElement("#receiptLinkCancelButton", HTMLButtonElement),
                    educationFoodTotal: this.getElement("#educationFoodTotal", HTMLElement),
                    educationRentTotal: this.getElement("#educationRentTotal", HTMLElement),
                    educationExpensesTotal: this.getElement("#educationExpensesTotal", HTMLElement),
                    foodSection: this.getElement("#foodSection", HTMLElement),
                    foodItemsList: this.getElement("#foodItemsList", HTMLElement),
                    foodEmpty: this.getElement("#foodEmpty", HTMLElement),
                    rentSection: this.getElement("#rentSection", HTMLElement),
                    rentEmpty: this.getElement("#rentEmpty", HTMLElement)
                };
            }
            getElement(selector, constructorReference) {
                const element = document.querySelector(selector);
                if (!(element instanceof constructorReference)) {
                    throw new Error(`Missing expected element: ${selector}`);
                }
                return element;
            }
        }
        UI.DomRegistryFactory = DomRegistryFactory;
    })(UI = ReceiptRing.UI || (ReceiptRing.UI = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var UI;
    (function (UI) {
        class AuthView {
            constructor(elements, authApi) {
                this.elements = elements;
                this.authApi = authApi;
                this.mode = "login";
                this.onAuthenticated = null;
            }
            init() {
                this.elements.authForm.addEventListener("submit", (event) => {
                    event.preventDefault();
                    void this.submit();
                });
                this.elements.authToggle.addEventListener("click", () => {
                    this.setMode(this.mode === "login" ? "register" : "login");
                });
                this.setMode("login");
            }
            show() {
                this.elements.authOverlay.classList.remove("hidden");
            }
            hide() {
                this.elements.authOverlay.classList.add("hidden");
            }
            setMode(mode) {
                this.mode = mode;
                const registering = mode === "register";
                this.elements.authTitle.textContent = registering ? "Create account" : "Log in";
                this.elements.authSubmit.textContent = registering ? "Sign up" : "Log in";
                this.elements.authSwitchText.textContent = registering
                    ? "Already have an account?"
                    : "Need an account?";
                this.elements.authToggle.textContent = registering ? "Log in" : "Sign up";
                this.elements.authNameField.classList.toggle("hidden", !registering);
                this.elements.authPassword.setAttribute("autocomplete", registering ? "new-password" : "current-password");
                this.setError("");
            }
            setError(message) {
                this.elements.authError.textContent = message;
                this.elements.authError.classList.toggle("hidden", message === "");
            }
            async submit() {
                const email = this.elements.authEmail.value.trim();
                const password = this.elements.authPassword.value;
                const name = this.elements.authName.value.trim() || null;
                this.setError("");
                this.elements.authSubmit.disabled = true;
                try {
                    const user = this.mode === "register"
                        ? await this.authApi.register(email, password, name)
                        : await this.authApi.login(email, password);
                    this.elements.authForm.reset();
                    this.onAuthenticated?.(user);
                }
                catch (error) {
                    this.setError(error instanceof Error ? error.message : "Something went wrong.");
                }
                finally {
                    this.elements.authSubmit.disabled = false;
                }
            }
        }
        UI.AuthView = AuthView;
    })(UI = ReceiptRing.UI || (ReceiptRing.UI = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var UI;
    (function (UI) {
        const SVG_NS = "http://www.w3.org/2000/svg";
        class BudgetRingView {
            constructor(currencyFormatService) {
                this.currencyFormatService = currencyFormatService;
            }
            render(ringEl, legendEl, month) {
                ringEl.replaceChildren();
                legendEl.replaceChildren();
                if (!month || month.total <= 0) {
                    const empty = document.createElement("p");
                    empty.className = "budget-ring-empty";
                    empty.textContent = "No spending recorded for this month.";
                    ringEl.append(empty);
                    return;
                }
                ringEl.append(this.buildSvg(month));
                legendEl.append(this.buildLegend(month));
            }
            buildSvg(month) {
                const size = 220;
                const stroke = 30;
                const radius = (size - stroke) / 2;
                const cx = size / 2;
                const cy = size / 2;
                const circumference = 2 * Math.PI * radius;
                const svg = document.createElementNS(SVG_NS, "svg");
                svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
                svg.setAttribute("width", String(size));
                svg.setAttribute("height", String(size));
                svg.setAttribute("class", "budget-ring-svg");
                svg.setAttribute("role", "img");
                svg.setAttribute("aria-label", `Spending by category, total ${this.currencyFormatService.format(month.total)}`);
                const track = document.createElementNS(SVG_NS, "circle");
                track.setAttribute("cx", String(cx));
                track.setAttribute("cy", String(cy));
                track.setAttribute("r", String(radius));
                track.setAttribute("fill", "none");
                track.setAttribute("stroke", "rgba(255,255,255,0.07)");
                track.setAttribute("stroke-width", String(stroke));
                svg.append(track);
                let offset = 0;
                for (const slice of month.categories) {
                    const fraction = slice.amount / month.total;
                    const segment = document.createElementNS(SVG_NS, "circle");
                    segment.setAttribute("cx", String(cx));
                    segment.setAttribute("cy", String(cy));
                    segment.setAttribute("r", String(radius));
                    segment.setAttribute("fill", "none");
                    segment.setAttribute("stroke", slice.color);
                    segment.setAttribute("stroke-width", String(stroke));
                    segment.setAttribute("stroke-dasharray", `${fraction * circumference} ${circumference}`);
                    segment.setAttribute("stroke-dashoffset", String(-offset * circumference));
                    segment.setAttribute("transform", `rotate(-90 ${cx} ${cy})`);
                    const title = document.createElementNS(SVG_NS, "title");
                    title.textContent = `${slice.category}: ${this.currencyFormatService.format(slice.amount)}`;
                    segment.append(title);
                    svg.append(segment);
                    offset += fraction;
                }
                const totalText = document.createElementNS(SVG_NS, "text");
                totalText.setAttribute("x", String(cx));
                totalText.setAttribute("y", String(cy - 2));
                totalText.setAttribute("text-anchor", "middle");
                totalText.setAttribute("class", "budget-ring-total");
                totalText.textContent = this.currencyFormatService.format(month.total);
                svg.append(totalText);
                const caption = document.createElementNS(SVG_NS, "text");
                caption.setAttribute("x", String(cx));
                caption.setAttribute("y", String(cy + 18));
                caption.setAttribute("text-anchor", "middle");
                caption.setAttribute("class", "budget-ring-caption");
                caption.textContent = "spent";
                svg.append(caption);
                return svg;
            }
            buildLegend(month) {
                const list = document.createElement("ul");
                list.className = "budget-legend-list";
                for (const slice of month.categories) {
                    const item = document.createElement("li");
                    item.className = "budget-legend-item";
                    const swatch = document.createElement("span");
                    swatch.className = "budget-legend-swatch";
                    swatch.style.backgroundColor = slice.color;
                    const label = document.createElement("span");
                    label.className = "budget-legend-label";
                    label.textContent = slice.category;
                    const value = document.createElement("span");
                    value.className = "budget-legend-value";
                    const percent = Math.round((slice.amount / month.total) * 100);
                    value.textContent = `${this.currencyFormatService.format(slice.amount)} · ${percent}%`;
                    item.append(swatch, label, value);
                    list.append(item);
                }
                return list;
            }
        }
        UI.BudgetRingView = BudgetRingView;
    })(UI = ReceiptRing.UI || (ReceiptRing.UI = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var UI;
    (function (UI) {
        class MonthlyTrendView {
            constructor(currencyFormatService) {
                this.currencyFormatService = currencyFormatService;
            }
            render(container, months, selectedMonth, onSelect) {
                const hadFocus = container.contains(document.activeElement);
                container.replaceChildren();
                if (months.length === 0) {
                    const empty = document.createElement("p");
                    empty.className = "budget-ring-empty";
                    empty.textContent = "No spending recorded yet.";
                    container.append(empty);
                    return;
                }
                const chronological = [...months].reverse();
                const max = Math.max(...chronological.map((entry) => entry.total));
                const chart = document.createElement("div");
                chart.className = "trend-chart";
                let selectedBar = null;
                for (const entry of chronological) {
                    const bar = this.buildBar(entry, max, entry.month === selectedMonth, onSelect);
                    if (entry.month === selectedMonth)
                        selectedBar = bar;
                    chart.append(bar);
                }
                container.append(chart);
                if (hadFocus && selectedBar) {
                    selectedBar.focus();
                }
            }
            buildBar(entry, max, isSelected, onSelect) {
                const column = document.createElement("button");
                column.type = "button";
                column.className = "trend-bar-col";
                column.classList.toggle("is-selected", isSelected);
                column.setAttribute("aria-pressed", String(isSelected));
                column.setAttribute("aria-label", `${this.monthLabel(entry.month, true)}: ${this.currencyFormatService.format(entry.total)}`);
                column.addEventListener("click", () => onSelect(entry.month));
                const value = document.createElement("span");
                value.className = "trend-bar-value";
                value.textContent = this.currencyFormatService.format(entry.total);
                const track = document.createElement("span");
                track.className = "trend-bar-track";
                const fill = document.createElement("span");
                fill.className = "trend-bar-fill";
                const percent = max > 0 ? Math.round((entry.total / max) * 100) : 0;
                fill.style.height = `${percent}%`;
                track.append(fill);
                const label = document.createElement("span");
                label.className = "trend-bar-label";
                label.textContent = this.monthLabel(entry.month, false);
                column.append(value, track, label);
                return column;
            }
            monthLabel(key, includeYear) {
                const [year, month] = key.split("-").map(Number);
                if (!year || !month)
                    return key;
                return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
                    month: "short",
                    ...(includeYear ? { year: "numeric" } : {})
                });
            }
        }
        UI.MonthlyTrendView = MonthlyTrendView;
    })(UI = ReceiptRing.UI || (ReceiptRing.UI = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var UI;
    (function (UI) {
        const MODE_LABELS = {
            equal: "Split evenly",
            percentage: "Split by percentage",
            amount: "Split by custom amount"
        };
        class SplitWorkspaceView {
            constructor(currencyFormatService, receiptApiService) {
                this.currencyFormatService = currencyFormatService;
                this.receiptApiService = receiptApiService;
                this.panelListeners = null;
            }
            renderLines(container, lines, assignments, people, lineModes, handlers) {
                const openLineIds = new Set();
                container
                    .querySelectorAll("details.assign-dropdown[open]")
                    .forEach((dropdown) => {
                    if (dropdown.dataset.lineId)
                        openLineIds.add(dropdown.dataset.lineId);
                });
                this.panelListeners?.abort();
                this.panelListeners = new AbortController();
                container.innerHTML = "";
                lines.forEach((line) => {
                    const row = document.createElement("div");
                    row.className = "table-row";
                    row.classList.toggle("is-ignored", line.ignored);
                    const name = document.createElement("span");
                    name.className = "line-label";
                    name.textContent = line.label;
                    const foodCheck = document.createElement("button");
                    foodCheck.className = "line-food-check";
                    foodCheck.type = "button";
                    foodCheck.setAttribute("aria-label", line.isFood ? "Mark as non-food" : "Mark as food");
                    foodCheck.setAttribute("aria-pressed", String(line.isFood ?? false));
                    foodCheck.innerHTML = this.getFoodCheckIcon(line.isFood ?? false);
                    foodCheck.addEventListener("click", () => handlers.onLineFood(line.id, !(line.isFood ?? false)));
                    const assignCell = document.createElement("div");
                    assignCell.className = "assign-cell";
                    const dropdown = this.buildAssignDropdown(line, assignments, people, lineModes, handlers);
                    assignCell.append(dropdown);
                    const amount = document.createElement("span");
                    amount.className = "amount-cell";
                    amount.textContent = this.currencyFormatService.format(line.amount);
                    const ignore = document.createElement("button");
                    ignore.className = "icon-button delete-row";
                    ignore.type = "button";
                    ignore.textContent = line.ignored ? "+" : "x";
                    ignore.setAttribute("aria-label", line.ignored ? "Restore line" : "Ignore line");
                    ignore.addEventListener("click", () => handlers.onLineIgnore(line.id));
                    row.append(name, foodCheck, assignCell, amount, ignore);
                    container.append(row);
                    if (openLineIds.has(line.id)) {
                        dropdown.open = true;
                    }
                });
            }
            buildAssignDropdown(line, assignments, people, lineModes, handlers) {
                const lineAssignments = assignments.filter((assignment) => assignment.lineId === line.id);
                const mode = lineModes.get(line.id) ?? "equal";
                const details = document.createElement("details");
                details.className = "assign-dropdown";
                details.dataset.lineId = line.id;
                const summary = document.createElement("summary");
                summary.className = "assign-summary";
                summary.textContent = this.getAssignmentSummary(lineAssignments, people);
                details.append(summary);
                const panel = document.createElement("div");
                panel.className = "assign-panel-pop";
                const reposition = () => {
                    if (!details.isConnected) {
                        this.teardownPanelPositioning(reposition);
                        return;
                    }
                    this.positionPanel(summary, panel);
                };
                details.addEventListener("toggle", () => {
                    if (details.open) {
                        this.closeOtherDropdowns(details);
                        this.positionPanel(summary, panel);
                        const signal = this.panelListeners?.signal;
                        window.addEventListener("scroll", reposition, { capture: true, signal });
                        window.addEventListener("resize", reposition, { signal });
                    }
                    else {
                        this.teardownPanelPositioning(reposition);
                        this.resetPanelPosition(panel);
                    }
                });
                if (people.length === 0) {
                    const hint = document.createElement("p");
                    hint.className = "assign-hint";
                    hint.textContent = "Add people first, then assign them here.";
                    panel.append(hint);
                    details.append(panel);
                    return details;
                }
                const modeSelect = document.createElement("select");
                modeSelect.className = "table-select assign-mode";
                Object.keys(MODE_LABELS).forEach((value) => {
                    const option = document.createElement("option");
                    option.value = value;
                    option.textContent = MODE_LABELS[value];
                    modeSelect.append(option);
                });
                modeSelect.value = mode;
                modeSelect.addEventListener("change", () => handlers.onLineModeChange(line.id, modeSelect.value));
                panel.append(modeSelect);
                people.forEach((person) => {
                    const assignment = lineAssignments.find((candidate) => candidate.personId === person.id);
                    const personRow = document.createElement("label");
                    personRow.className = "assign-person-row";
                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.checked = Boolean(assignment);
                    checkbox.addEventListener("change", () => handlers.onAssignToggle(line.id, person.id));
                    const personName = document.createElement("span");
                    personName.className = "assign-person-name";
                    personName.textContent = person.name;
                    personRow.append(checkbox, personName);
                    if (mode !== "equal") {
                        const valueInput = document.createElement("input");
                        valueInput.type = "number";
                        valueInput.min = "0";
                        valueInput.step = "0.01";
                        valueInput.className = "table-input assign-value";
                        valueInput.placeholder = mode === "percentage" ? "%" : "$";
                        valueInput.value = assignment ? String(assignment.value) : "";
                        valueInput.disabled = !assignment;
                        valueInput.addEventListener("input", () => handlers.onAssignValueChange(line.id, person.id, Number(valueInput.value)));
                        personRow.append(valueInput);
                    }
                    panel.append(personRow);
                });
                details.append(panel);
                return details;
            }
            renderPeople(container, people, handlers) {
                container.innerHTML = "";
                people.forEach((person) => {
                    const row = document.createElement("div");
                    row.className = "person-chip";
                    const label = document.createElement("span");
                    label.textContent = person.name;
                    const remove = document.createElement("button");
                    remove.type = "button";
                    remove.textContent = "x";
                    remove.setAttribute("aria-label", `Remove ${person.name}`);
                    remove.addEventListener("click", () => handlers.onPersonDelete(person.id));
                    row.append(label, remove);
                    container.append(row);
                });
            }
            renderTotals(container, summary) {
                container.innerHTML = "";
                summary.totals.forEach((total) => {
                    const row = document.createElement("div");
                    row.className = "split-total-row";
                    const name = document.createElement("strong");
                    name.textContent = total.personName;
                    const items = document.createElement("span");
                    items.textContent = `Items ${this.currencyFormatService.format(total.itemTotal)}`;
                    const tax = document.createElement("span");
                    tax.textContent = `Tax ${this.currencyFormatService.format(total.allocatedTax)}`;
                    const final = document.createElement("b");
                    final.textContent = this.currencyFormatService.format(total.finalTotal);
                    row.append(name, items, tax, final);
                    container.append(row);
                });
                if (Math.abs(summary.unallocated) >= 0.01) {
                    const row = document.createElement("div");
                    row.className = "split-total-row is-unallocated";
                    const name = document.createElement("strong");
                    name.textContent = "Unallocated";
                    const detail = document.createElement("span");
                    detail.textContent = "Not covered by the amounts entered";
                    const spacer = document.createElement("span");
                    const value = document.createElement("b");
                    value.textContent = this.currencyFormatService.format(summary.unallocated);
                    row.append(name, detail, spacer, value);
                    container.append(row);
                }
            }
            renderHistory(container, receipts, onDelete, onLineFood) {
                container.innerHTML = "";
                receipts.forEach((receipt) => {
                    const card = document.createElement("details");
                    card.className = "history-card";
                    const summary = document.createElement("summary");
                    summary.className = "history-summary";
                    const heading = document.createElement("div");
                    heading.className = "history-heading";
                    const title = document.createElement("strong");
                    title.textContent = receipt.storeName || "Untitled receipt";
                    const meta = document.createElement("span");
                    meta.className = "history-meta";
                    const when = new Date(receipt.createdAt).toLocaleDateString();
                    meta.textContent = `${receipt.category} · ${when}`;
                    heading.append(title, meta);
                    const total = document.createElement("b");
                    total.className = "history-total";
                    total.textContent = this.currencyFormatService.format(Number(receipt.total ?? 0));
                    summary.append(heading, total);
                    card.append(summary);
                    const body = document.createElement("div");
                    body.className = "history-body";
                    if (receipt.hasImage) {
                        const figure = document.createElement("a");
                        figure.className = "history-image";
                        figure.href = this.receiptApiService.imageUrl(receipt.id);
                        figure.target = "_blank";
                        figure.rel = "noopener";
                        figure.title = "Open the full-size receipt photo";
                        const photo = document.createElement("img");
                        photo.src = figure.href;
                        photo.loading = "lazy";
                        photo.alt = `Photo of the receipt from ${receipt.storeName || "an unknown store"}`;
                        figure.append(photo);
                        body.append(figure);
                    }
                    if (receipt.lines.length > 0) {
                        const linesWrap = document.createElement("div");
                        linesWrap.className = "history-lines";
                        receipt.lines.forEach((line) => {
                            const lineRow = document.createElement("div");
                            lineRow.className = "history-line";
                            const names = line.assignments
                                .map((assignment) => assignment.personName)
                                .filter((value) => Boolean(value));
                            const label = document.createElement("span");
                            label.textContent = line.label;
                            const foodCheck = document.createElement("button");
                            foodCheck.className = "line-food-check";
                            foodCheck.type = "button";
                            foodCheck.setAttribute("aria-label", line.isFood ? "Mark as non-food" : "Mark as food");
                            foodCheck.setAttribute("aria-pressed", String(line.isFood ?? false));
                            foodCheck.innerHTML = this.getFoodCheckIcon(line.isFood ?? false);
                            if (onLineFood) {
                                foodCheck.addEventListener("click", () => onLineFood(receipt.id, line.id, !(line.isFood ?? false)));
                            }
                            else {
                                foodCheck.disabled = true;
                            }
                            const peopleSpan = document.createElement("span");
                            peopleSpan.className = "history-line-people";
                            peopleSpan.textContent = names.length ? names.join(", ") : "Unassigned";
                            const amountEl = document.createElement("b");
                            amountEl.textContent = this.currencyFormatService.format(Number(line.amount));
                            lineRow.append(label, foodCheck, peopleSpan, amountEl);
                            linesWrap.append(lineRow);
                        });
                        body.append(linesWrap);
                    }
                    if (receipt.people.length > 0) {
                        const peopleWrap = document.createElement("div");
                        peopleWrap.className = "history-people";
                        peopleWrap.textContent = `People: ${receipt.people.map((person) => person.name).join(", ")}`;
                        body.append(peopleWrap);
                    }
                    if (onDelete) {
                        const actions = document.createElement("div");
                        actions.className = "history-actions";
                        const deleteButton = document.createElement("button");
                        deleteButton.type = "button";
                        deleteButton.className = "btn btn-danger btn-small";
                        deleteButton.textContent = "Delete receipt";
                        deleteButton.addEventListener("click", () => onDelete(receipt));
                        actions.append(deleteButton);
                        body.append(actions);
                    }
                    card.append(body);
                    container.append(card);
                });
            }
            positionPanel(summary, panel) {
                const margin = 8;
                const summaryRect = summary.getBoundingClientRect();
                panel.style.position = "fixed";
                panel.style.maxHeight = "";
                panel.style.width = `${Math.max(230, summaryRect.width)}px`;
                const panelHeight = panel.scrollHeight;
                const viewportHeight = window.innerHeight;
                const viewportWidth = window.innerWidth;
                const spaceBelow = viewportHeight - summaryRect.bottom - margin;
                const spaceAbove = summaryRect.top - margin;
                let top;
                if (panelHeight <= spaceBelow || spaceBelow >= spaceAbove) {
                    top = summaryRect.bottom + margin;
                    panel.style.maxHeight = `${Math.max(0, spaceBelow)}px`;
                }
                else {
                    panel.style.maxHeight = `${Math.max(0, spaceAbove)}px`;
                    top = Math.max(margin, summaryRect.top - margin - Math.min(panelHeight, spaceAbove));
                }
                const panelWidth = panel.getBoundingClientRect().width;
                const left = Math.max(margin, Math.min(summaryRect.left, viewportWidth - margin - panelWidth));
                panel.style.top = `${top}px`;
                panel.style.left = `${left}px`;
                panel.style.overflowY = "auto";
            }
            resetPanelPosition(panel) {
                panel.style.position = "";
                panel.style.top = "";
                panel.style.left = "";
                panel.style.width = "";
                panel.style.maxHeight = "";
                panel.style.overflowY = "";
            }
            teardownPanelPositioning(reposition) {
                window.removeEventListener("scroll", reposition, true);
                window.removeEventListener("resize", reposition);
            }
            closeOtherDropdowns(current) {
                document
                    .querySelectorAll("details.assign-dropdown[open]")
                    .forEach((dropdown) => {
                    if (dropdown !== current) {
                        dropdown.open = false;
                    }
                });
            }
            getAssignmentSummary(lineAssignments, people) {
                const names = lineAssignments
                    .map((assignment) => people.find((person) => person.id === assignment.personId)?.name)
                    .filter((name) => Boolean(name));
                return names.length > 0 ? names.join(", ") : "Assign ▾";
            }
            getFoodCheckIcon(isFood) {
                const strokeWidth = isFood ? "0" : "1.6";
                const fill = isFood ? "currentColor" : "none";
                return `<svg viewBox="0 0 24 24" fill="${fill}" xmlns="http://www.w3.org/2000/svg" class="food-check-icon">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="${strokeWidth}"/>
      </svg>`;
            }
        }
        UI.SplitWorkspaceView = SplitWorkspaceView;
    })(UI = ReceiptRing.UI || (ReceiptRing.UI = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var UI;
    (function (UI) {
        class CategoryPromptView {
            constructor(categories, elements) {
                this.categories = categories;
                this.elements = elements;
                this.activeResolve = null;
                this.renderOptions();
                this.bindEvents();
            }
            prompt(item) {
                this.activeResolve?.(null);
                this.activeResolve = null;
                this.elements.categoryPromptItem.textContent = item.label;
                this.elements.categoryPromptSelect.value = item.category;
                this.elements.categoryPromptRemember.checked = false;
                this.elements.categoryPrompt.classList.remove("hidden");
                this.elements.categoryPromptSelect.focus();
                return new Promise((resolve) => {
                    this.activeResolve = resolve;
                });
            }
            renderOptions() {
                this.elements.categoryPromptSelect.innerHTML = "";
                this.categories.forEach((category) => {
                    const option = document.createElement("option");
                    option.value = category.name;
                    option.textContent = category.name;
                    this.elements.categoryPromptSelect.append(option);
                });
            }
            bindEvents() {
                this.elements.categoryPromptSave.addEventListener("click", () => this.resolvePrompt());
                this.elements.categoryPromptSkip.addEventListener("click", () => this.closePrompt(null));
                document.addEventListener("keydown", (event) => {
                    if (this.activeResolve === null)
                        return;
                    if (event.key === "Escape") {
                        this.closePrompt(null);
                        return;
                    }
                    if (event.key === "Tab") {
                        this.keepFocusInDialog(event);
                    }
                });
                this.elements.categoryPrompt.addEventListener("click", (event) => {
                    if (event.target === this.elements.categoryPrompt) {
                        this.closePrompt(null);
                    }
                });
            }
            keepFocusInDialog(event) {
                const focusable = this.elements.categoryPrompt.querySelectorAll("select, input, button, [href], textarea, [tabindex]:not([tabindex='-1'])");
                if (focusable.length === 0)
                    return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                const active = document.activeElement;
                if (event.shiftKey && (active === first || !this.elements.categoryPrompt.contains(active))) {
                    event.preventDefault();
                    last.focus();
                }
                else if (!event.shiftKey && (active === last || !this.elements.categoryPrompt.contains(active))) {
                    event.preventDefault();
                    first.focus();
                }
            }
            resolvePrompt() {
                this.closePrompt({
                    category: this.elements.categoryPromptSelect.value,
                    remember: this.elements.categoryPromptRemember.checked
                });
            }
            closePrompt(result) {
                this.elements.categoryPrompt.classList.add("hidden");
                const resolve = this.activeResolve;
                this.activeResolve = null;
                resolve?.(result);
            }
        }
        UI.CategoryPromptView = CategoryPromptView;
    })(UI = ReceiptRing.UI || (ReceiptRing.UI = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    var App;
    (function (App) {
        class AppController {
            constructor(elements, parserService, categorizationService, categoryRuleStorageService, storageService, currencyFormatService, imagePreviewService, receiptImageService, geminiService, categoryPromptView, splitWorkspaceView, splitCalculatorService, idService, receiptApiService, bankApiService, spendingAggregatorService, budgetRingView, monthlyTrendView, peopleApiService, rentEntryApiService, rentEntriesView) {
                this.elements = elements;
                this.parserService = parserService;
                this.categorizationService = categorizationService;
                this.categoryRuleStorageService = categoryRuleStorageService;
                this.storageService = storageService;
                this.currencyFormatService = currencyFormatService;
                this.imagePreviewService = imagePreviewService;
                this.receiptImageService = receiptImageService;
                this.geminiService = geminiService;
                this.categoryPromptView = categoryPromptView;
                this.splitWorkspaceView = splitWorkspaceView;
                this.splitCalculatorService = splitCalculatorService;
                this.idService = idService;
                this.receiptApiService = receiptApiService;
                this.bankApiService = bankApiService;
                this.spendingAggregatorService = spendingAggregatorService;
                this.budgetRingView = budgetRingView;
                this.monthlyTrendView = monthlyTrendView;
                this.peopleApiService = peopleApiService;
                this.rentEntryApiService = rentEntryApiService;
                this.rentEntriesView = rentEntriesView;
                this.receiptLines = [];
                this.people = [];
                this.assignments = [];
                this.lineModes = new Map();
                this.foodFlags = new Map();
                this.receiptCategory = "Groceries";
                this.cameraStream = null;
                this.isPromptingForCategories = false;
                this.reviewTimer = null;
                this.bankTransactions = [];
                this.bankConnections = [];
                this.monthlySpend = [];
                this.selectedMonth = null;
                this.serverHasGeminiKey = false;
                this.userHasGeminiKey = false;
                this.receiptImage = null;
                this.rentEntries = [];
                this.editingRentEntryId = null;
                this.linkedReceipts = new Map();
                this.linkingTransactionId = null;
                this.items = this.storageService.load();
            }
            start() {
                this.bindEvents();
                this.render();
                void this.initGeminiSettings();
                void this.loadPeople();
            }
            bindEvents() {
                this.elements.sampleButton.addEventListener("click", () => this.loadSample());
                this.elements.dropzone.addEventListener("click", (event) => {
                    if (event.target === this.elements.receiptImage)
                        return;
                    event.preventDefault();
                    this.elements.receiptImage.click();
                });
                this.elements.receiptImage.addEventListener("change", () => this.handleImageInput());
                this.elements.clearImageButton.addEventListener("click", () => this.clearImage());
                this.elements.parseButton.addEventListener("click", () => this.itemizeReceiptText());
                this.elements.clearButton.addEventListener("click", () => this.clearReceipt());
                this.elements.openCameraButton.addEventListener("click", () => void this.openCamera());
                this.elements.closeCameraButton.addEventListener("click", () => this.closeCamera());
                this.elements.capturePhotoButton.addEventListener("click", () => void this.captureCameraPhoto());
                this.elements.addPersonButton.addEventListener("click", () => this.addPerson());
                this.elements.personNameInput.addEventListener("keydown", (event) => {
                    if (event.key === "Enter")
                        this.addPerson();
                });
                this.elements.taxInput.addEventListener("input", () => this.renderTotals());
                this.elements.receiptCategory.addEventListener("change", () => {
                    this.receiptCategory = this.elements.receiptCategory.value;
                });
                this.elements.settingsButton.addEventListener("click", () => this.openSettings());
                this.elements.closeSettingsButton.addEventListener("click", () => this.closeSettings());
                this.elements.saveSettingsButton.addEventListener("click", () => void this.saveSettings());
                this.elements.removeKeyButton.addEventListener("click", () => void this.removeGeminiKey());
                this.elements.saveReceiptButton.addEventListener("click", () => void this.saveReceipt());
                this.elements.refreshHistoryButton.addEventListener("click", () => void this.loadHistory());
                this.elements.connectBankButton.addEventListener("click", () => void this.connectBank());
                this.elements.refreshTransactionsButton.addEventListener("click", () => void this.refreshTransactions());
                this.elements.budgetMonth.addEventListener("change", () => {
                    this.selectMonth(this.elements.budgetMonth.value || null);
                });
                this.elements.addRentEntryButton.addEventListener("click", () => this.openRentEntryForm());
                this.elements.rentEntryCancelButton.addEventListener("click", () => this.closeRentEntryModal());
                this.elements.rentEntrySaveButton.addEventListener("click", () => void this.saveRentEntry());
                this.elements.rentEntriesList.addEventListener("click", (event) => {
                    const target = event.target;
                    if (target.textContent === "Edit") {
                        const entryId = target.dataset.entryId;
                        const entry = this.rentEntries.find((e) => e.id === entryId);
                        if (entry)
                            this.openRentEntryForm(entry);
                    }
                    else if (target.textContent === "Delete") {
                        const entryId = target.dataset.entryId;
                        const entry = this.rentEntries.find((e) => e.id === entryId);
                        if (entry)
                            void this.deleteRentEntry(entry);
                    }
                });
                this.elements.receiptLinkCancelButton.addEventListener("click", () => this.closeReceiptLinkModal());
                this.elements.receiptLinkList.addEventListener("click", (event) => {
                    const target = event.target;
                    const button = target.closest(".receipt-link-item");
                    if (button instanceof HTMLElement && button.dataset.receiptId) {
                        void this.selectReceiptForLink(button.dataset.receiptId);
                    }
                });
                this.elements.tabButtons.forEach((button) => {
                    button.addEventListener("click", () => this.switchTab(button.dataset.tab));
                });
                ["dragenter", "dragover"].forEach((eventName) => {
                    this.elements.dropzone.addEventListener(eventName, (event) => {
                        event.preventDefault();
                        this.elements.dropzone.classList.add("is-dragging");
                    });
                });
                ["dragleave", "drop"].forEach((eventName) => {
                    this.elements.dropzone.addEventListener(eventName, (event) => {
                        event.preventDefault();
                        this.elements.dropzone.classList.remove("is-dragging");
                    });
                });
                this.elements.dropzone.addEventListener("drop", (event) => this.handleImageDrop(event));
            }
            switchTab(tab) {
                this.elements.tabButtons.forEach((button) => {
                    button.classList.toggle("is-active", button.dataset.tab === tab);
                });
                this.elements.receiptsView.classList.toggle("hidden", tab !== "receipts");
                this.elements.historyView.classList.toggle("hidden", tab !== "history");
                this.elements.budgetingView.classList.toggle("hidden", tab !== "budgeting");
                if (tab === "history") {
                    void this.loadHistory();
                }
                if (tab === "budgeting") {
                    void this.loadBudgeting();
                }
            }
            loadSample() {
                this.elements.receiptText.value = ReceiptRing.Config.SAMPLE_RECEIPT;
                this.setItemsFromParse(this.parserService.parse(ReceiptRing.Config.SAMPLE_RECEIPT));
                this.render();
                void this.reviewAmbiguousItems();
            }
            handleImageInput() {
                const file = this.elements.receiptImage.files?.[0];
                this.elements.receiptImage.value = "";
                if (file) {
                    this.processReceiptImage(file);
                }
            }
            handleImageDrop(event) {
                const file = event.dataTransfer?.files?.[0];
                if (file) {
                    this.processReceiptImage(file);
                }
            }
            clearImage() {
                this.imagePreviewService.clear(this.elements.receiptImage, this.elements.receiptPreview, this.elements.receiptPreviewWrap);
                this.receiptLines = [];
                this.assignments = [];
                this.lineModes.clear();
                this.receiptImage = null;
                this.hideOcrStatus();
            }
            setItemsFromParse(items) {
                this.items = items;
                this.receiptLines = this.items.map((item) => ({
                    id: item.id,
                    label: item.label,
                    amount: item.amount,
                    confidence: item.categorizationConfidence * 100,
                    ignored: false
                }));
                this.assignments = [];
                this.lineModes.clear();
                this.foodFlags.clear();
            }
            itemizeReceiptText() {
                this.setItemsFromParse(this.parserService.parse(this.elements.receiptText.value));
                this.render();
            }
            clearReceipt() {
                this.elements.receiptText.value = "";
                this.elements.storeNameInput.value = "";
                this.items = [];
                this.clearImage();
                this.setSaveStatus("");
                this.render();
            }
            render() {
                this.storageService.save(this.items);
                this.renderWorkspace();
                this.renderTotals();
            }
            renderWorkspace() {
                this.elements.emptyState.classList.toggle("hidden", this.receiptLines.length > 0);
                this.elements.itemCount.textContent = `${this.receiptLines.length} ${this.receiptLines.length === 1 ? "line" : "lines"}`;
                const handlers = {
                    onLineIgnore: (lineId) => this.toggleIgnoredLine(lineId),
                    onPersonDelete: (personId) => this.deletePerson(personId),
                    onAssignToggle: (lineId, personId) => this.toggleAssignment(lineId, personId),
                    onLineModeChange: (lineId, mode) => this.setLineMode(lineId, mode),
                    onAssignValueChange: (lineId, personId, value) => this.setAssignmentValue(lineId, personId, value),
                    onLineFood: (lineId, isFood) => this.toggleLineFood(lineId, isFood)
                };
                this.splitWorkspaceView.renderLines(this.elements.receiptLinesList, this.receiptLines, this.assignments, this.people, this.lineModes, handlers);
                this.splitWorkspaceView.renderPeople(this.elements.peopleList, this.people, handlers);
            }
            renderTotals() {
                const unassignedCount = this.splitCalculatorService.getUnassignedCount(this.receiptLines, this.assignments);
                this.elements.unassignedCount.textContent = `${unassignedCount} unassigned`;
                this.elements.unassignedCount.classList.toggle("is-warning", unassignedCount > 0);
                this.splitWorkspaceView.renderTotals(this.elements.splitTotalsList, this.splitCalculatorService.calculate(this.people, this.receiptLines, this.assignments, this.getTaxAmount()));
                const itemSum = this.getSubtotal();
                const grandTotal = itemSum + this.getTaxAmount();
                this.elements.receiptTotal.textContent = this.currencyFormatService.format(grandTotal);
            }
            async extractAndItemizeReceipt(file) {
                const model = localStorage.getItem("gemini_model") || "gemini-3.7-flash";
                if (!this.userHasGeminiKey && !this.serverHasGeminiKey) {
                    this.setOcrStatus("Please add your Gemini API key in Settings first.", 1);
                    this.openSettings();
                    return;
                }
                this.setOcrStatus("Analyzing receipt with Gemini...", 0.15);
                this.elements.parseButton.setAttribute("disabled", "true");
                try {
                    const result = await this.geminiService.parseReceiptImage(file, model);
                    console.log("Gemini parsed receipt output:", result);
                    const storeName = result.storeName || "";
                    const subtotal = typeof result.subtotal === "number" ? result.subtotal : null;
                    const tax = typeof result.tax === "number" ? result.tax : null;
                    const total = typeof result.total === "number" ? result.total : null;
                    this.elements.storeNameInput.value = storeName;
                    this.elements.taxInput.value = String(tax ?? 0);
                    let formattedText = `Store: ${storeName}\n\nItems:\n`;
                    const purchaseItems = [];
                    if (Array.isArray(result.items)) {
                        result.items.forEach((item) => {
                            const label = this.toTitleCase(item.name || "Unknown Item");
                            const price = typeof item.price === "number" ? item.price : Number(item.price) || 0;
                            const discount = typeof item.discount === "number" ? item.discount : Number(item.discount) || 0;
                            const finalAmount = Math.max(0, price - discount);
                            const lowConfidence = !!item.lowConfidence;
                            let itemLabel = label;
                            if (discount > 0.01) {
                                itemLabel += ` (was $${price.toFixed(2)}, ${discount > 0 ? "-" : ""}$${Math.abs(discount).toFixed(2)} discount)`;
                                formattedText += `- ${itemLabel}: $${finalAmount.toFixed(2)}${lowConfidence ? " (low confidence)" : ""}\n`;
                            }
                            else {
                                formattedText += `- ${label}: $${finalAmount.toFixed(2)}${lowConfidence ? " (low confidence)" : ""}\n`;
                            }
                            const categorization = this.categorizationService.categorize(label);
                            purchaseItems.push({
                                id: this.idService.create(),
                                label: itemLabel,
                                amount: Number(finalAmount.toFixed(2)),
                                category: categorization.category,
                                categorizationConfidence: lowConfidence ? 0.3 : categorization.confidence,
                                categorizationSource: categorization.source,
                                needsCategoryReview: lowConfidence || categorization.shouldPrompt
                            });
                        });
                    }
                    formattedText += `\nSubtotal: $${(subtotal ?? 0).toFixed(2)}\nTax: $${(tax ?? 0).toFixed(2)}\nTotal: $${(total ?? 0).toFixed(2)}`;
                    this.elements.receiptText.value = formattedText;
                    this.setItemsFromParse(purchaseItems);
                    this.setSaveStatus("");
                    this.render();
                    this.setOcrStatus(`Found ${this.receiptLines.length} lines via Gemini`, 1);
                    window.setTimeout(() => this.hideOcrStatus(), 1600);
                }
                catch (error) {
                    console.error("Gemini receipt parsing failed:", error);
                    const message = error instanceof Error ? error.message : "Could not extract text from this receipt.";
                    this.setOcrStatus(message, 1);
                }
                finally {
                    this.elements.parseButton.removeAttribute("disabled");
                }
            }
            async initGeminiSettings() {
                const config = await this.geminiService.loadConfig();
                this.serverHasGeminiKey = config.hasServerKey;
                this.userHasGeminiKey = config.hasUserKey;
                if (config.model) {
                    localStorage.setItem("gemini_model", config.model);
                }
                this.elements.geminiModel.value = localStorage.getItem("gemini_model") || "gemini-3.7-flash";
            }
            openSettings() {
                this.elements.geminiApiKey.value = "";
                this.elements.geminiModel.value = localStorage.getItem("gemini_model") || "gemini-3.7-flash";
                this.renderGeminiKeyStatus();
                this.elements.settingsModal.classList.remove("hidden");
            }
            closeSettings() {
                this.elements.settingsModal.classList.add("hidden");
            }
            renderGeminiKeyStatus(message, isError = false) {
                const status = this.elements.geminiKeyStatus;
                if (message) {
                    status.textContent = message;
                    status.classList.toggle("is-active", !isError);
                    this.elements.removeKeyButton.classList.toggle("hidden", !this.userHasGeminiKey);
                    return;
                }
                if (this.userHasGeminiKey) {
                    status.textContent = "Using your saved personal key.";
                    status.classList.add("is-active");
                }
                else if (this.serverHasGeminiKey) {
                    status.textContent = "Using the shared server key. Add a key to use your own.";
                    status.classList.remove("is-active");
                }
                else {
                    status.textContent = "No key configured yet. Add one to parse receipts.";
                    status.classList.remove("is-active");
                }
                this.elements.removeKeyButton.classList.toggle("hidden", !this.userHasGeminiKey);
            }
            async saveSettings() {
                const key = this.elements.geminiApiKey.value.trim();
                localStorage.setItem("gemini_model", this.elements.geminiModel.value);
                if (!key) {
                    this.closeSettings();
                    return;
                }
                this.elements.saveSettingsButton.setAttribute("disabled", "true");
                try {
                    await this.geminiService.saveApiKey(key);
                    this.userHasGeminiKey = true;
                    this.elements.geminiApiKey.value = "";
                    this.closeSettings();
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : "Could not save the key.";
                    this.renderGeminiKeyStatus(message, true);
                }
                finally {
                    this.elements.saveSettingsButton.removeAttribute("disabled");
                }
            }
            async removeGeminiKey() {
                this.elements.removeKeyButton.setAttribute("disabled", "true");
                try {
                    await this.geminiService.clearApiKey();
                    this.userHasGeminiKey = false;
                    this.elements.geminiApiKey.value = "";
                    this.renderGeminiKeyStatus();
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : "Could not clear the key.";
                    this.renderGeminiKeyStatus(message, true);
                }
                finally {
                    this.elements.removeKeyButton.removeAttribute("disabled");
                }
            }
            toTitleCase(value) {
                return value
                    .toLowerCase()
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");
            }
            setOcrStatus(label, progress) {
                this.elements.ocrStatus.classList.remove("hidden");
                this.elements.ocrStatusText.textContent = label;
                this.elements.ocrProgressBar.style.width = `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`;
            }
            hideOcrStatus() {
                this.elements.ocrStatus.classList.add("hidden");
                this.elements.ocrProgressBar.style.width = "0%";
            }
            async openCamera() {
                if (!navigator.mediaDevices?.getUserMedia) {
                    this.setOcrStatus("Camera is not available here. Opening file upload instead.", 1);
                    this.elements.receiptImage.click();
                    return;
                }
                try {
                    this.cameraStream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            facingMode: { ideal: "environment" },
                            width: { ideal: 1920 },
                            height: { ideal: 2560 }
                        },
                        audio: false
                    });
                    this.elements.cameraVideo.srcObject = this.cameraStream;
                    this.elements.cameraModal.classList.remove("hidden");
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : "Camera permission was denied.";
                    this.setOcrStatus(`Camera unavailable: ${message}. Opening file upload instead.`, 1);
                    this.elements.receiptImage.click();
                }
            }
            closeCamera() {
                this.cameraStream?.getTracks().forEach((track) => track.stop());
                this.cameraStream = null;
                this.elements.cameraVideo.srcObject = null;
                this.elements.cameraModal.classList.add("hidden");
            }
            async captureCameraPhoto() {
                const video = this.elements.cameraVideo;
                const canvas = this.elements.cameraCanvas;
                const context = canvas.getContext("2d");
                if (!context || video.videoWidth === 0 || video.videoHeight === 0)
                    return;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
                if (!blob)
                    return;
                const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: "image/jpeg" });
                this.closeCamera();
                this.processReceiptImage(file);
            }
            processReceiptImage(file) {
                this.imagePreviewService.show(file, this.elements.receiptPreview, this.elements.receiptPreviewWrap);
                this.setOcrStatus(`Loaded ${file.name || "receipt image"}`, 0.02);
                this.receiptImage = this.receiptImageService.toStorableDataUrl(file);
                void this.extractAndItemizeReceipt(file);
            }
            async loadPeople() {
                try {
                    const people = await this.peopleApiService.list();
                    this.people = people;
                    this.render();
                }
                catch (error) {
                    console.error("Failed to load people:", error);
                }
            }
            addPerson() {
                const name = this.elements.personNameInput.value.trim();
                if (!name)
                    return;
                if (this.people.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
                    window.alert("This person is already in the list.");
                    return;
                }
                this.elements.addPersonButton.setAttribute("disabled", "true");
                void (async () => {
                    try {
                        const person = await this.peopleApiService.add(name);
                        this.people = [...this.people, person];
                        this.elements.personNameInput.value = "";
                        this.render();
                    }
                    catch (error) {
                        const message = error instanceof Error ? error.message : "Could not add person.";
                        window.alert(message);
                    }
                    finally {
                        this.elements.addPersonButton.removeAttribute("disabled");
                    }
                })();
            }
            deletePerson(personId) {
                void (async () => {
                    try {
                        await this.peopleApiService.delete(personId);
                        this.people = this.people.filter((person) => person.id !== personId);
                        this.assignments = this.assignments.filter((assignment) => assignment.personId !== personId);
                        this.render();
                    }
                    catch (error) {
                        const message = error instanceof Error ? error.message : "Could not delete person.";
                        window.alert(message);
                    }
                })();
            }
            toggleIgnoredLine(lineId) {
                this.receiptLines = this.receiptLines.map((line) => line.id === lineId ? { ...line, ignored: !line.ignored } : line);
                this.assignments = this.assignments.filter((assignment) => assignment.lineId !== lineId);
                this.render();
            }
            toggleAssignment(lineId, personId) {
                const existing = this.assignments.find((assignment) => assignment.lineId === lineId && assignment.personId === personId);
                if (existing) {
                    this.assignments = this.assignments.filter((assignment) => assignment !== existing);
                }
                else {
                    this.assignments = [
                        ...this.assignments,
                        {
                            id: this.idService.create(),
                            lineId,
                            personId,
                            mode: this.lineModes.get(lineId) ?? "equal",
                            value: 0
                        }
                    ];
                }
                this.render();
            }
            setLineMode(lineId, mode) {
                this.lineModes.set(lineId, mode);
                this.assignments = this.assignments.map((assignment) => assignment.lineId === lineId
                    ? { ...assignment, mode, value: mode === "equal" ? 0 : assignment.value }
                    : assignment);
                this.render();
            }
            setAssignmentValue(lineId, personId, value) {
                this.assignments = this.assignments.map((assignment) => assignment.lineId === lineId && assignment.personId === personId
                    ? { ...assignment, value: Number.isFinite(value) ? value : 0 }
                    : assignment);
                this.renderTotals();
            }
            toggleLineFood(lineId, isFood) {
                this.foodFlags.set(lineId, isFood);
                this.receiptLines = this.receiptLines.map((line) => line.id === lineId ? { ...line, isFood } : line);
                this.render();
            }
            async updateLineFood(receiptId, lineId, isFood) {
                try {
                    await this.receiptApiService.updateLineFood(receiptId, lineId, isFood);
                    await this.loadHistory();
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : "Could not update line.";
                    window.alert(`Failed to update food flag. ${message}`);
                }
            }
            getSubtotal() {
                return this.receiptLines.filter((line) => !line.ignored).reduce((sum, line) => sum + line.amount, 0);
            }
            getTaxAmount() {
                const value = Number(this.elements.taxInput.value);
                return Number.isFinite(value) ? value : 0;
            }
            setSaveStatus(message, isError = false) {
                this.elements.saveStatus.textContent = message;
                this.elements.saveStatus.classList.toggle("is-error", isError);
            }
            async saveReceipt() {
                if (this.receiptLines.length === 0) {
                    this.setSaveStatus("Add receipt lines before saving.", true);
                    return;
                }
                this.elements.saveReceiptButton.setAttribute("disabled", "true");
                this.setSaveStatus("Saving...");
                const imageDataUrl = this.receiptImage ? await this.receiptImage : null;
                const subtotal = this.getSubtotal();
                const tax = this.getTaxAmount();
                const payload = {
                    storeName: this.elements.storeNameInput.value.trim() || null,
                    category: this.receiptCategory,
                    subtotal,
                    tax,
                    total: subtotal + tax,
                    people: this.people.map((person) => ({ clientId: person.id })),
                    lines: this.receiptLines.map((line) => ({
                        clientId: line.id,
                        label: line.label,
                        amount: line.amount,
                        ignored: line.ignored,
                        isFood: this.foodFlags.get(line.id) ?? false
                    })),
                    assignments: this.assignments.map((assignment) => ({
                        lineClientId: assignment.lineId,
                        personClientId: assignment.personId,
                        mode: assignment.mode,
                        value: assignment.value
                    })),
                    imageDataUrl
                };
                try {
                    await this.receiptApiService.save(payload);
                    this.setSaveStatus(imageDataUrl ? "Saved to history with the receipt photo." : "Saved to history.");
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : "Could not save receipt.";
                    this.setSaveStatus(message, true);
                }
                finally {
                    this.elements.saveReceiptButton.removeAttribute("disabled");
                }
            }
            async loadHistory() {
                try {
                    const receipts = await this.receiptApiService.list();
                    this.elements.historyEmpty.classList.toggle("hidden", receipts.length > 0);
                    this.splitWorkspaceView.renderHistory(this.elements.historyList, receipts, (receipt) => void this.deleteReceipt(receipt), (receiptId, lineId, isFood) => void this.updateLineFood(receiptId, lineId, isFood));
                }
                catch (error) {
                    this.elements.historyEmpty.classList.remove("hidden");
                    const title = document.createElement("strong");
                    title.textContent = "Couldn't load history";
                    const detail = document.createElement("span");
                    detail.textContent = error instanceof Error ? error.message : "Is the server running?";
                    this.elements.historyEmpty.replaceChildren(title, detail);
                    this.splitWorkspaceView.renderHistory(this.elements.historyList, []);
                }
            }
            async deleteReceipt(receipt) {
                const label = receipt.storeName || "this receipt";
                if (!window.confirm(`Delete ${label}? This can't be undone.`)) {
                    return;
                }
                try {
                    await this.receiptApiService.remove(receipt.id);
                    await this.loadHistory();
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : "Please try again.";
                    window.alert(`Couldn't delete receipt. ${message}`);
                }
            }
            setBankStatus(message) {
                this.elements.bankStatus.textContent = message;
            }
            async connectBank() {
                try {
                    this.setBankStatus("Opening Plaid…");
                    if (typeof Plaid === "undefined") {
                        this.setBankStatus("Plaid Link failed to load. Check your connection.");
                        return;
                    }
                    const { linkToken } = await this.bankApiService.createLinkToken();
                    if (!linkToken) {
                        this.setBankStatus("Set PLAID_CLIENT_ID and PLAID_SECRET in .env to connect a bank.");
                        return;
                    }
                    const handler = Plaid.create({
                        token: linkToken,
                        onSuccess: (publicToken, metadata) => void this.handleLinkSuccess(publicToken, metadata),
                        onExit: (error) => this.setBankStatus(error ? "Bank connection failed." : "")
                    });
                    handler.open();
                }
                catch (error) {
                    this.setBankStatus(error instanceof Error ? error.message : "Could not start Plaid.");
                }
            }
            async handleLinkSuccess(publicToken, metadata) {
                try {
                    this.setBankStatus("Linking account…");
                    const result = await this.bankApiService.exchange(publicToken, metadata);
                    const bank = result.institutionName ?? "bank";
                    this.setBankStatus(result.replaced ? `Reconnected ${bank}, replacing the earlier link. Syncing…` : `Connected ${bank}. Syncing…`);
                    const sync = await this.bankApiService.sync();
                    if (sync.pending && sync.imported === 0) {
                        this.setBankStatus("Connected. Your bank is still preparing transactions — reopen Budgeting in a minute.");
                    }
                    else {
                        this.setBankStatus(this.describeSync(sync));
                    }
                    await this.loadBudgeting({ sync: false });
                }
                catch (error) {
                    this.setBankStatus(error instanceof Error ? error.message : "Bank linking failed.");
                }
            }
            describeSync(result) {
                const imported = `Imported ${result.imported} transaction${result.imported === 1 ? "" : "s"}.`;
                const errors = result.errors ?? [];
                if (errors.length === 0)
                    return imported;
                const details = errors
                    .map((error) => `${error.institutionName ?? "A bank"}: ${error.message}`)
                    .join(" ");
                const hint = errors.some((error) => error.reconnectRequired)
                    ? " Use Connect bank to reconnect it — that replaces the old link instead of duplicating it."
                    : "";
                return `${imported} ${details}${hint}`;
            }
            async refreshTransactions() {
                this.elements.refreshTransactionsButton.setAttribute("disabled", "true");
                try {
                    this.setBankStatus("Refreshing…");
                    const sync = await this.bankApiService.sync();
                    if (sync.pending && sync.imported === 0 && (sync.errors ?? []).length === 0) {
                        this.setBankStatus("Your bank is still preparing transactions — try again in a minute.");
                    }
                    else {
                        this.setBankStatus(this.describeSync(sync));
                    }
                    await this.loadBudgeting({ sync: false });
                }
                catch (error) {
                    this.setBankStatus(error instanceof Error ? error.message : "Could not refresh transactions.");
                }
                finally {
                    this.elements.refreshTransactionsButton.removeAttribute("disabled");
                }
            }
            async loadBudgeting(options = {}) {
                if (options.sync !== false) {
                    try {
                        await this.bankApiService.sync();
                    }
                    catch {
                    }
                }
                let receipts = [];
                try {
                    receipts = await this.receiptApiService.list();
                }
                catch {
                    receipts = [];
                }
                try {
                    this.bankTransactions = await this.bankApiService.listTransactions();
                }
                catch {
                    this.bankTransactions = [];
                }
                try {
                    this.bankConnections = await this.bankApiService.listConnections();
                }
                catch {
                    this.bankConnections = [];
                }
                this.monthlySpend = this.spendingAggregatorService.aggregate(receipts, this.bankTransactions);
                this.populateMonths();
                this.renderConnections();
                this.renderRentEntries();
                this.renderTransactions();
                this.renderTrend();
                this.renderRing();
            }
            populateMonths() {
                const select = this.elements.budgetMonth;
                const previous = this.selectedMonth;
                select.replaceChildren();
                for (const entry of this.monthlySpend) {
                    const option = document.createElement("option");
                    option.value = entry.month;
                    option.textContent = this.formatMonthLabel(entry.month);
                    select.append(option);
                }
                if (this.monthlySpend.length === 0) {
                    this.selectedMonth = null;
                    return;
                }
                this.selectedMonth = this.monthlySpend.some((entry) => entry.month === previous)
                    ? previous
                    : this.monthlySpend[0].month;
                select.value = this.selectedMonth ?? "";
            }
            renderConnections() {
                const container = this.elements.bankConnections;
                container.replaceChildren();
                if (this.bankConnections.length === 0)
                    return;
                for (const connection of this.bankConnections) {
                    const row = document.createElement("div");
                    row.className = "bank-connection-row";
                    const main = document.createElement("div");
                    main.className = "bank-connection-main";
                    const name = document.createElement("span");
                    name.className = "bank-connection-name";
                    name.textContent = connection.institutionName ?? "Linked bank";
                    const meta = document.createElement("span");
                    meta.className = "bank-connection-meta";
                    const accounts = `${connection.accounts} account${connection.accounts === 1 ? "" : "s"}`;
                    const transactions = `${connection.transactions} transaction${connection.transactions === 1 ? "" : "s"}`;
                    meta.textContent = `${accounts} · ${transactions}`;
                    main.append(name, meta);
                    const remove = document.createElement("button");
                    remove.type = "button";
                    remove.className = "btn btn-ghost btn-small";
                    remove.textContent = "Remove";
                    remove.addEventListener("click", () => void this.removeConnection(connection));
                    row.append(main, remove);
                    container.append(row);
                }
            }
            async removeConnection(connection) {
                const label = connection.institutionName ?? "this bank";
                if (!window.confirm(`Remove ${label}? Its ${connection.transactions} imported transaction${connection.transactions === 1 ? "" : "s"} will be deleted. Saved receipts are not affected.`)) {
                    return;
                }
                try {
                    this.setBankStatus("Removing…");
                    await this.bankApiService.removeConnection(connection.id);
                    this.setBankStatus(`Removed ${label}.`);
                    await this.loadBudgeting({ sync: false });
                }
                catch (error) {
                    this.setBankStatus(error instanceof Error ? error.message : "Could not remove the bank.");
                }
            }
            renderRing() {
                const month = this.monthlySpend.find((entry) => entry.month === this.selectedMonth) ?? null;
                this.budgetRingView.render(this.elements.budgetRing, this.elements.budgetLegend, month);
            }
            renderTrend() {
                this.monthlyTrendView.render(this.elements.monthlyTrend, this.monthlySpend, this.selectedMonth, (month) => this.selectMonth(month));
            }
            selectMonth(month) {
                this.selectedMonth = month;
                this.elements.budgetMonth.value = month ?? "";
                this.renderTrend();
                this.renderRing();
                this.renderRentEntries();
                this.renderTransactions();
            }
            formatMonthLabel(key) {
                const [year, month] = key.split("-").map(Number);
                if (!year || !month)
                    return key;
                return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric"
                });
            }
            formatTransactionDate(value) {
                const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
                if (!match)
                    return new Date(value).toLocaleDateString();
                const [, year, month, day] = match;
                return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString();
            }
            renderTransactions() {
                const list = this.elements.transactionsList;
                const transactions = this.selectedMonth
                    ? this.bankTransactions.filter((txn) => this.spendingAggregatorService.monthKey(txn.date) === this.selectedMonth)
                    : this.bankTransactions;
                this.elements.transactionsEmpty.classList.toggle("hidden", transactions.length > 0);
                this.setTransactionsEmptyMessage(transactions.length === 0);
                list.replaceChildren();
                for (const txn of transactions.slice(0, 100)) {
                    const row = document.createElement("div");
                    row.className = "transaction-row";
                    row.dataset.transactionId = txn.id;
                    row.style.cursor = "pointer";
                    const main = document.createElement("div");
                    main.className = "transaction-main";
                    const desc = document.createElement("span");
                    desc.className = "transaction-desc";
                    desc.textContent = txn.description ?? "Transaction";
                    const meta = document.createElement("span");
                    meta.className = "transaction-meta";
                    const date = this.formatTransactionDate(txn.date);
                    meta.textContent = txn.category ? `${date} · ${txn.category}` : date;
                    main.append(desc, meta);
                    const linkedReceiptId = this.linkedReceipts.get(txn.id);
                    if (linkedReceiptId) {
                        const linkIcon = document.createElement("span");
                        linkIcon.className = "transaction-link-icon";
                        linkIcon.setAttribute("aria-label", "Receipt linked");
                        linkIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.5 3.5a4 4 0 0 1 4 4v3h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h2v-3a4 4 0 0 1 4-4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10.5 11h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>`;
                        main.append(linkIcon);
                    }
                    const amount = document.createElement("span");
                    amount.className = "transaction-amount";
                    amount.textContent = this.currencyFormatService.format(txn.amount);
                    row.addEventListener("dragover", (event) => {
                        event.preventDefault();
                        row.classList.add("is-drag-over");
                    });
                    row.addEventListener("dragleave", () => {
                        row.classList.remove("is-drag-over");
                    });
                    row.addEventListener("drop", (event) => {
                        event.preventDefault();
                        row.classList.remove("is-drag-over");
                        const receiptId = event.dataTransfer?.getData("text/plain");
                        if (receiptId) {
                            void this.linkReceiptToTransaction(receiptId, txn.id);
                        }
                    });
                    row.addEventListener("click", () => this.openReceiptLinkModal(txn.id));
                    row.append(main, amount);
                    list.append(row);
                }
            }
            setTransactionsEmptyMessage(isEmpty) {
                if (!isEmpty)
                    return;
                const heading = this.elements.transactionsEmpty.querySelector("strong");
                const detail = this.elements.transactionsEmpty.querySelector("span");
                const hasAnyTransactions = this.bankTransactions.length > 0;
                if (heading) {
                    heading.textContent = hasAnyTransactions ? "No transactions this month" : "No transactions yet";
                }
                if (detail) {
                    detail.textContent = hasAnyTransactions
                        ? "Pick another month to see its activity."
                        : "Connect a bank to import read-only transactions.";
                }
            }
            scheduleCategoryReview() {
                if (this.reviewTimer !== null) {
                    window.clearTimeout(this.reviewTimer);
                }
                this.reviewTimer = window.setTimeout(() => {
                    this.reviewTimer = null;
                    void this.reviewAmbiguousItems();
                }, 650);
            }
            async reviewAmbiguousItems() {
                if (this.isPromptingForCategories)
                    return;
                this.isPromptingForCategories = true;
                try {
                    let item = this.items.find((candidate) => candidate.needsCategoryReview);
                    while (item) {
                        const result = await this.categoryPromptView.prompt(item);
                        if (result) {
                            this.applyPromptResult(item.id, result);
                        }
                        else {
                            this.markItemReviewed(item.id);
                        }
                        this.render();
                        item = this.items.find((candidate) => candidate.needsCategoryReview);
                    }
                }
                finally {
                    this.isPromptingForCategories = false;
                }
            }
            applyPromptResult(id, result) {
                const item = this.items.find((candidate) => candidate.id === id);
                if (!item)
                    return;
                if (result.remember) {
                    this.categoryRuleStorageService.saveRule(item.label, result.category);
                }
                this.items = this.items.map((candidate) => candidate.id === id
                    ? {
                        ...candidate,
                        category: result.category,
                        categorizationConfidence: 1,
                        categorizationSource: result.remember ? "saved-rule" : "keyword-match",
                        needsCategoryReview: false
                    }
                    : candidate);
            }
            markItemReviewed(id) {
                this.items = this.items.map((candidate) => candidate.id === id ? { ...candidate, needsCategoryReview: false } : candidate);
            }
            renderRentEntries() {
                void (async () => {
                    try {
                        if (!this.selectedMonth) {
                            this.rentEntriesView.render(this.elements.rentEntriesList, []);
                            return;
                        }
                        this.rentEntries = await this.rentEntryApiService.list(this.selectedMonth);
                        this.rentEntriesView.render(this.elements.rentEntriesList, this.rentEntries);
                    }
                    catch (error) {
                        console.error("Failed to load rent entries:", error);
                        this.rentEntriesView.render(this.elements.rentEntriesList, []);
                    }
                })();
            }
            openRentEntryForm(entry) {
                this.editingRentEntryId = entry?.id ?? null;
                this.rentEntriesView.renderForm(this.elements.rentEntryModal, entry);
                this.elements.rentEntryModal.classList.remove("hidden");
            }
            closeRentEntryModal() {
                this.editingRentEntryId = null;
                this.elements.rentEntryModal.classList.add("hidden");
            }
            async saveRentEntry() {
                const date = this.elements.rentEntryDate.value.trim();
                const amount = Number(this.elements.rentEntryAmount.value);
                const propertyName = this.elements.rentEntryProperty.value.trim();
                const photoFile = this.elements.rentEntryPhoto.files?.[0];
                if (!date || !amount || amount <= 0) {
                    window.alert("Please fill in the date and amount.");
                    return;
                }
                this.elements.rentEntrySaveButton.setAttribute("disabled", "true");
                try {
                    const dateObj = new Date(date);
                    const year = dateObj.getFullYear();
                    const month = dateObj.getMonth() + 1;
                    let photoDataUrl;
                    if (photoFile) {
                        photoDataUrl = await this.fileToDataUrl(photoFile);
                    }
                    const payload = {
                        year,
                        month,
                        amount,
                        propertyName: propertyName || undefined,
                        date,
                        photoDataUrl
                    };
                    if (this.editingRentEntryId) {
                        await this.rentEntryApiService.update(this.editingRentEntryId, {
                            amount,
                            propertyName: propertyName || undefined,
                            date,
                            photoUrl: photoDataUrl
                        });
                    }
                    else {
                        await this.rentEntryApiService.create(payload);
                    }
                    window.alert(this.editingRentEntryId ? "Rent entry updated." : "Rent entry saved.");
                    this.closeRentEntryModal();
                    void this.renderRentEntries();
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : "Could not save rent entry.";
                    if (message.includes("already exists")) {
                        window.alert("A rent entry already exists for this month. Please edit the existing entry.");
                    }
                    else {
                        window.alert(message);
                    }
                }
                finally {
                    this.elements.rentEntrySaveButton.removeAttribute("disabled");
                }
            }
            async deleteRentEntry(entry) {
                const label = this.formatTransactionDate(entry.date);
                if (!window.confirm(`Delete rent entry for ${label}? This can't be undone.`)) {
                    return;
                }
                try {
                    await this.rentEntryApiService.delete(entry.id);
                    window.alert("Rent entry deleted.");
                    void this.renderRentEntries();
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : "Could not delete rent entry.";
                    window.alert(`Failed to delete rent entry. ${message}`);
                }
            }
            fileToDataUrl(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        resolve(reader.result);
                    };
                    reader.onerror = () => {
                        reject(new Error("Could not read file."));
                    };
                    reader.readAsDataURL(file);
                });
            }
        }
        App.AppController = AppController;
    })(App = ReceiptRing.App || (ReceiptRing.App = {}));
})(ReceiptRing || (ReceiptRing = {}));
var ReceiptRing;
(function (ReceiptRing) {
    const categories = ReceiptRing.Config.CATEGORIES;
    const idService = new ReceiptRing.Services.IdService();
    const currencyFormatService = new ReceiptRing.Services.CurrencyFormatService();
    const categoryRuleStorageService = new ReceiptRing.Services.CategoryRuleStorageService("receipt-ring-category-rules");
    const categorizationService = new ReceiptRing.Services.CategorizationService(categories, categoryRuleStorageService);
    const parserService = new ReceiptRing.Services.ReceiptParserService(categorizationService, idService);
    const storageService = new ReceiptRing.Services.StorageService("receipt-ring-items");
    const splitCalculatorService = new ReceiptRing.Services.SplitCalculatorService();
    const imagePreviewService = new ReceiptRing.Services.ImagePreviewService();
    const receiptImageService = new ReceiptRing.Services.ReceiptImageService();
    const geminiService = new ReceiptRing.Services.GeminiService();
    const receiptApiService = new ReceiptRing.Services.ReceiptApiService();
    const authApiService = new ReceiptRing.Services.AuthApiService();
    const bankApiService = new ReceiptRing.Services.BankApiService();
    const peopleApiService = new ReceiptRing.Services.PeopleApiService();
    const spendingAggregatorService = new ReceiptRing.Services.SpendingAggregatorService(categories);
    const rentEntryApiService = new ReceiptRing.Services.RentEntryApiService();
    const elements = new ReceiptRing.UI.DomRegistryFactory().create();
    const categoryPromptView = new ReceiptRing.UI.CategoryPromptView(categories, elements);
    const splitWorkspaceView = new ReceiptRing.UI.SplitWorkspaceView(currencyFormatService, receiptApiService);
    const budgetRingView = new ReceiptRing.UI.BudgetRingView(currencyFormatService);
    const monthlyTrendView = new ReceiptRing.UI.MonthlyTrendView(currencyFormatService);
    const rentEntriesView = new ReceiptRing.UI.RentEntriesView(currencyFormatService);
    const authView = new ReceiptRing.UI.AuthView(elements, authApiService);
    const controller = new ReceiptRing.App.AppController(elements, parserService, categorizationService, categoryRuleStorageService, storageService, currencyFormatService, imagePreviewService, receiptImageService, geminiService, categoryPromptView, splitWorkspaceView, splitCalculatorService, idService, receiptApiService, bankApiService, spendingAggregatorService, budgetRingView, monthlyTrendView, peopleApiService, rentEntryApiService, rentEntriesView);
    let started = false;
    const startApp = () => {
        if (started)
            return;
        started = true;
        controller.start();
    };
    authView.init();
    authView.onAuthenticated = () => {
        authView.hide();
        startApp();
    };
    elements.logoutButton.addEventListener("click", () => {
        void authApiService.logout().finally(() => window.location.reload());
    });
    void (async () => {
        try {
            await authApiService.me();
            authView.hide();
            startApp();
        }
        catch {
            authView.show();
        }
    })();
})(ReceiptRing || (ReceiptRing = {}));
