import { getElementSize } from "@/lib/sizingt";
import { useState, type RefObject } from "react";

export type WordStatus = "pending" | "correct" | "incorrect";

export function useTypingEngine(
	words: string[],
	caret: RefObject<HTMLDivElement | null>,
	container: RefObject<HTMLDivElement | null>,
	charSize: number
) {
	const [currentWord, setCurrentWord] = useState(0);
	const [input, setInput] = useState("");
	const [typedWords, setTypedWords] = useState(
		words.map((w) => ({ text: w, status: "pending" as WordStatus }))
	);

	const handleInput = (value: string) => {
		const typed = value.trim();
		const expected = words[currentWord];

		const caretPos = getElementSize(caret)!.x;
		const maxSize = getElementSize(container)!.width;

		// if at max capacity, only ignore if the next letter is correct or a space
		if (caretPos + charSize >= maxSize) {
			// console.log(
			// 	`${caretPos} + ${charSize} (${caretPos + charSize}) >= ${maxSize}`
			// );
			if (value.length <= input.length) {
				// console.log("backspace");
				// backspace
			} else if (value.length <= expected.length) {
				// console.log("still typing");
				// still typing correctly
			} else if (
				value.startsWith(expected) &&
				value.length === expected.length + 1 &&
				value[value.length - 1] === " "
			) {
				// console.log("submission");
				// submission
			} else {
				// console.log("don't wrap");
				return; // don't wrap div
			}
		}

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
