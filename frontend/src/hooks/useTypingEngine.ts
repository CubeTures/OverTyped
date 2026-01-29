import { getElementSize } from "@/lib/sizingt";
import { getTypedCharacter as getTypedCharacters } from "@/lib/typedCharacter";
import { usePage } from "@/PageProvider";
import { useEffect, useRef, useState, type RefObject } from "react";

export type WordStatus = "pending" | "correct" | "incorrect";

export function useTypingEngine(
	words: string[],
	caret: RefObject<HTMLDivElement | null>,
	container: RefObject<HTMLDivElement | null>,
	charSize: number
) {
	const { socket } = usePage();
	const [currentWord, setCurrentWord] = useState(0);
	const [input, setInput] = useState("");
	const [typedWords, setTypedWords] = useState(
		words.map((w) => ({ text: w, status: "pending" as WordStatus }))
	);
	useEffect(() => {
		let news = typedWords.map((v, i) => {
			if (v.status !== "pending") {
				return v;
			}
			return { text: words[i], status: "pending" as WordStatus };
		});
		if (words.length > typedWords.length) {
			news = news.concat(
				words
					.slice(typedWords.length)
					.map((w) => ({ text: w, status: "pending" as WordStatus }))
			);
		}
		setTypedWords(news);
		return;
	}, [words]);

	// Cache container width to avoid repeated DOM measurements
	const containerWidthRef = useRef<number | null>(null);

	const handleInput = (value: string) => {
		const typed = value.trim();
		const expected = words[currentWord];

		// Only measure if we need to check wrapping
		const isSubmission =
			value.startsWith(expected) &&
			value.length === expected.length + 1 &&
			value[value.length - 1] === " ";
		const isBackspace = value.length <= input.length;
		const isStillTyping = value.length <= expected.length;

		// Check wrapping only when necessary
		if (!(isBackspace || isSubmission || isStillTyping)) {
			// Cache container width - only recalculate if container might have resized
			if (containerWidthRef.current === null && container.current) {
				containerWidthRef.current = container.current.getBoundingClientRect().width;
			}
			const maxSize = containerWidthRef.current ?? 0;

			// Only measure caret position if we need to check wrapping
			const caretPos = getElementSize(caret)?.x ?? 0;
			if (caretPos + charSize >= maxSize) {
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

		// const sendChars = getTypedCharacters(value, input, expected);
		// sendChars?.map((char) => socket.sendSubmit(char));

		const isLastWord = currentWord === words.length - 1;
		if ((value.endsWith(" ") && typed === expected) || (isLastWord && typed === expected && value === expected)) {
			setTypedWords((prev) => {
				const next = [...prev];
				next[currentWord] = {
					...next[currentWord],
					status: typed === expected ? "correct" : "incorrect",
				};
				return next;
			});

			socket.sendSubmit(currentWord);
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
