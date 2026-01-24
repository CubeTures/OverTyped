import { type RefObject, useLayoutEffect } from "react";

export function useCaretPosition(
	testRef: RefObject<HTMLDivElement | null>,
	caretRef: RefObject<HTMLDivElement | null>,
	currentWord: number,
	input: string
) {
	useLayoutEffect(() => {
		const caret = caretRef.current;
		const testDiv = testRef.current;
		if (!caret || !testDiv) return;

		const wordDiv = testDiv.children[currentWord] as
			| HTMLElement
			| undefined;
		if (!wordDiv) return;

		const letterSpans = Array.from(wordDiv.children) as HTMLElement[];

		const wordLength = letterSpans.length;
		const typedLength = input.length;

		const containerRect = testDiv.getBoundingClientRect();

		// Case 1 — caret is still inside the word
		if (typedLength <= wordLength) {
			const idx = Math.max(typedLength - 1, 0);
			const target = letterSpans[idx];
			if (!target) return;

			const rect = target.getBoundingClientRect();

			const x =
				rect.left -
				containerRect.left +
				(typedLength === 0 ? 0 : target.offsetWidth);

			const y = rect.top - containerRect.top;

			caret.style.left = `${x}px`;
			caret.style.top = `${y}px`;
			caret.style.animation = "none";
			return;
		}

		// Case 2 — overflow letters
		const lastLetter = letterSpans[wordLength - 1];
		if (!lastLetter) return;

		const lastRect = lastLetter.getBoundingClientRect();

		let overflowWidth = 0;

		// measure overflow characters precisely
		const measurer = document.createElement("span");
		measurer.style.position = "absolute";
		measurer.style.visibility = "hidden";
		measurer.style.whiteSpace = "pre";
		measurer.style.font = getComputedStyle(lastLetter).font;

		measurer.textContent = input.slice(wordLength);
		document.body.appendChild(measurer);

		overflowWidth = measurer.getBoundingClientRect().width;

		document.body.removeChild(measurer);

		const x =
			lastRect.left -
			containerRect.left +
			lastLetter.offsetWidth +
			overflowWidth;

		const y = lastRect.top - containerRect.top;

		caret.style.left = `${x}px`;
		caret.style.top = `${y}px`;
		caret.style.animation = "none";
	}, [currentWord, input]);
}
