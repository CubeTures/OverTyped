import { useState } from "react";

export type WordStatus = "pending" | "correct" | "incorrect";

export function useTypingEngine(words: string[]) {
	const [currentWord, setCurrentWord] = useState(0);
	const [input, setInput] = useState("");
	const [typedWords, setTypedWords] = useState(
		words.map((w) => ({ text: w, status: "pending" as WordStatus }))
	);

	const handleInput = (value: string) => {
		const typed = value.trim();
		const expected = words[currentWord];

		let incorrect = 0;
		for (let i = 0; i < value.length; i++) {
			if (
				incorrect > 0 ||
				i >= expected.length ||
				value[i] !== expected[i]
			) {
				incorrect += 1;
			}
		}

		if (incorrect >= 10) {
			return; // can't type any more
		}

		if (value.endsWith(" ") && typed === expected) {
			setTypedWords((prev) => {
				const next = [...prev];
				next[currentWord] = {
					...next[currentWord],
					status: typed === expected ? "correct" : "incorrect",
				};
				return next;
			});

			setCurrentWord((w) => w + 1);
			setInput("");
			return;
		}

		setInput(value);
	};

	return {
		input,
		currentWord,
		typedWords,
		setInput,
		handleInput,
	};
}
