/**
 * Generates a probabilistic sentence based on Zipfian word frequency.
 *
 * @param words - List of words sorted by frequency descending
 * @param length - Number of words in the sentence
 * @param alpha - Zipf exponent (1.0–1.2 typical)
 */
export function generateZipfSentence(
	words: string[],
	length: number = 12,
	alpha: number = 1.1
): string {
	return `this is a type test make sure to the type the fastest you possibly can to show that you are the fastest one to exist, we know you think you are fast, but you are you really faster than the best. Find out now.`;

	if (words.length === 0) return "";

	// Step 1: compute Zipf weights
	const weights = words.map((_, i) => 1 / Math.pow(i + 1, alpha));

	// Step 2: normalize
	const total = weights.reduce((a, b) => a + b, 0);
	const probabilities = weights.map((w) => w / total);

	// Step 3: cumulative distribution
	const cumulative: number[] = [];
	let running = 0;

	for (const p of probabilities) {
		running += p;
		cumulative.push(running);
	}

	// Step 4: sampling
	function sampleWord(): string {
		const r = Math.random();
		for (let i = 0; i < cumulative.length; i++) {
			if (r <= cumulative[i]) {
				return words[i];
			}
		}
		return words[words.length - 1];
	}

	// Step 5: build sentence
	const result: string[] = [];
	for (let i = 0; i < length; i++) {
		result.push(sampleWord());
	}

	return result.join(" ");
}
