import { type RefObject, useLayoutEffect, useRef, useState } from "react";

export function useCaretPosition(
	testRef: RefObject<HTMLDivElement | null>,
	caretRef: RefObject<HTMLDivElement | null>,
	currentWord: number,
	input: string,
	onNewLine?: (line: number) => void
) {
	const logicalLineRef = useRef(1);
	const prevCaretYRef = useRef<number | null>(null);

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

		let x = 0;
		let y = 0;

		if (typedLength <= wordLength) {
			const idx = Math.max(typedLength - 1, 0);
			const target = letterSpans[idx];
			if (!target) return;

			const rect = target.getBoundingClientRect();
			x =
				rect.left -
				containerRect.left +
				(typedLength === 0 ? 0 : target.offsetWidth);
			y = rect.top - containerRect.top + 4;
		} else {
			const lastLetter = letterSpans[wordLength - 1];
			if (!lastLetter) return;

			const lastRect = lastLetter.getBoundingClientRect();

			// measure overflow characters precisely
			const measurer = document.createElement("span");
			measurer.style.position = "absolute";
			measurer.style.visibility = "hidden";
			measurer.style.whiteSpace = "pre";
			measurer.style.font = getComputedStyle(lastLetter).font;

			measurer.textContent = input.slice(wordLength);
			document.body.appendChild(measurer);

			const overflowWidth = measurer.getBoundingClientRect().width;
			document.body.removeChild(measurer);

			x =
				lastRect.left -
				containerRect.left +
				lastLetter.offsetWidth +
				overflowWidth;
			y = lastRect.top - containerRect.top + 4;
		}

		// Update caret position
		caret.style.left = `${x}px`;
		caret.style.top = `${y}px`;
		caret.style.animation = "none";

		// Determine current line (based on vertical position)
		const prevY = prevCaretYRef.current;

		if (prevY !== null) {
			const lineHeight =
				parseFloat(getComputedStyle(testDiv).lineHeight) || 20;

			// moved down by >= ~1 line → new logical line
			if (y - prevY > lineHeight * 0.6) {
				logicalLineRef.current += 1;
				onNewLine?.(logicalLineRef.current);
			}
		}

		prevCaretYRef.current = y;
	}, [currentWord, input, onNewLine]);
}
