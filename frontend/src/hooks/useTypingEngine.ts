import { getElementSize } from "@/lib/sizingt";
import { getTypedCharacter as getTypedCharacters } from "@/lib/typedCharacter";
import { usePage } from "@/PageProvider";
import { useState, type RefObject } from "react";

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

	const handleInput = (value: string) => {
		const typed = value.trim();
		const expected = words[currentWord];

		const caretPos = getElementSize(caret)!.x;
		const maxSize = getElementSize(container)!.width;

		const isSubmission =
			value.startsWith(expected) &&
			value.length === expected.length + 1 &&
			value[value.length - 1] === " ";
		const isBackspace = value.length <= input.length;
		const isStillTyping = value.length <= expected.length;
		if (
			caretPos + charSize >= maxSize &&
			!(isBackspace || isSubmission || isStillTyping)
		) {
			return; // don't wrap div
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

		const sendChars = getTypedCharacters(value, input, expected);
		sendChars?.map((char) => socket.sendSubmit(char));

		if (value.endsWith(" ") && typed === expected) {
			setTypedWords((prev) => {
				const next = [...prev];
				next[currentWord] = {
					...next[currentWord],
					status: typed === expected ? "correct" : "incorrect",
				};
				return next;
			});

			socket.sendSubmit(" ");
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
