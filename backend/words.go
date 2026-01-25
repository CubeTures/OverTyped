package main

import (
	"math/rand"
	"strings"
)

var wordsEnglish = []string{
	"the",
	"be",
	"of",
	"and",
	"a",
	"to",
	"in",
	"he",
	"have",
	"it",
	"that",
	"for",
	"they",
	"I",
	"with",
	"as",
	"not",
	"on",
	"she",
	"at",
	"by",
	"this",
	"we",
	"you",
	"do",
	"but",
	"from",
	"or",
	"which",
	"one",
	"would",
	"all",
	"will",
	"there",
	"say",
	"who",
	"make",
	"when",
	"can",
	"more",
	"if",
	"no",
	"man",
	"out",
	"other",
	"so",
	"what",
	"time",
	"up",
	"go",
	"about",
	"than",
	"into",
	"could",
	"state",
	"only",
	"new",
	"year",
	"some",
	"take",
	"come",
	"these",
	"know",
	"see",
	"use",
	"get",
	"like",
	"then",
	"first",
	"any",
	"work",
	"now",
	"may",
	"such",
	"give",
	"over",
	"think",
	"most",
	"even",
	"find",
	"day",
	"also",
	"after",
	"way",
	"many",
	"must",
	"look",
	"before",
	"great",
	"back",
	"through",
	"long",
	"where",
	"much",
	"should",
	"well",
	"people",
	"down",
	"own",
	"just",
	"because",
	"good",
	"each",
	"those",
	"feel",
	"seem",
	"how",
	"high",
	"too",
	"place",
	"little",
	"world",
	"very",
	"still",
	"nation",
	"hand",
	"old",
	"life",
	"tell",
	"write",
	"become",
	"here",
	"show",
	"house",
	"both",
	"between",
	"need",
	"mean",
	"call",
	"develop",
	"under",
	"last",
	"right",
	"move",
	"thing",
	"general",
	"school",
	"never",
	"same",
	"another",
	"begin",
	"while",
	"number",
	"part",
	"turn",
	"real",
	"leave",
	"might",
	"want",
	"point",
	"form",
	"off",
	"child",
	"few",
	"small",
	"since",
	"against",
	"ask",
	"late",
	"home",
	"interest",
	"large",
	"person",
	"end",
	"open",
	"public",
	"follow",
	"during",
	"present",
	"without",
	"again",
	"hold",
	"govern",
	"around",
	"possible",
	"head",
	"consider",
	"word",
	"program",
	"problem",
	"however",
	"lead",
	"system",
	"set",
	"order",
	"eye",
	"plan",
	"run",
	"keep",
	"face",
	"fact",
	"group",
	"play",
	"stand",
	"increase",
	"early",
	"course",
	"change",
	"help",
	"line",
}

func RandomWords(words []string, n int) []string {
	out := make([]string, n)
	for i := 0; i < n; i++ {
		out[i] = words[rand.Intn(len(words))]
	}
	return out

}

// ---- Obfuscation ----

func ObfuscateRange(words []string, offset, n int) []string {
	if offset < 0 || offset >= len(words) || n <= 0 {
		return words
	}

	end := offset + n
	if end > len(words) {
		end = len(words)
	}

	for i := offset; i < end; i++ {
		words[i] = obfuscateWord(words[i])
	}

	return words
}

var leetMap = map[rune][]rune{
	'a': {'@', '4'},
	'A': {'@', '4'},
	'e': {'3'},
	'E': {'3'},
	'i': {'1', '!'},
	'I': {'1', '!'},
	'o': {'0'},
	'O': {'0'},
	's': {'$', '5'},
	'S': {'$', '5'},
	't': {'+', '7'},
	'T': {'+', '7'},
}

var punctuation = []rune{'!', ',', '.', ':', ';'}

func obfuscateWord(s string) string {
	var b strings.Builder

	for _, r := range s {
		if repls, ok := leetMap[r]; ok && rand.Float64() < 0.3 {
			b.WriteRune(repls[rand.Intn(len(repls))])
			continue
		}

		if rand.Float64() < 0.1 {
			b.WriteRune('*')
		}

		b.WriteRune(r)
	}

	if rand.Float64() < 0.5 {
		b.WriteRune(punctuation[rand.Intn(len(punctuation))])
	}

	return b.String()
}

// ---- Scrambling ----

func ScrambleRange(words []string, offset, n int) []string {
	if offset < 0 || offset >= len(words) || n <= 0 {
		return words
	}

	end := offset + n
	if end > len(words) {
		end = len(words)
	}

	for i := offset; i < end; i++ {
		r := []rune(words[i])
		rand.Shuffle(len(r), func(a, b int) {
			r[a], r[b] = r[b], r[a]
		})
		words[i] = string(r)
	}

	return words
}

func RepeatCharsRange(words []string, offset, n int) []string {
	if offset < 0 || offset >= len(words) || n <= 0 {
		return words
	}

	end := min(offset + n, len(words))

	for i := offset; i < end; i++ {
		words[i] = repeatChars(words[i])
	}

	return words
}

func repeatChars(s string) string {
	var b strings.Builder

	for _, r := range s {
		repeat := rand.Intn(5) + 1 // 1..5
		for range repeat {
			b.WriteRune(r)
		}
	}

	return b.String()
}
