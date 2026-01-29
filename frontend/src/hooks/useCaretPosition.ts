import { type RefObject, useEffect, useRef } from "react";

// Cache for overflow text measurer to avoid creating/destroying DOM elements
let measurerCache: HTMLSpanElement | null = null;

function getMeasurer(): HTMLSpanElement {
	if (!measurerCache) {
		measurerCache = document.createElement("span");
		measurerCache.style.position = "absolute";
		measurerCache.style.visibility = "hidden";
		measurerCache.style.whiteSpace = "pre";
		measurerCache.style.pointerEvents = "none";
		measurerCache.style.top = "-9999px";
		document.body.appendChild(measurerCache);
	}
	return measurerCache;
}

export function useCaretPosition(
	testRef: RefObject<HTMLDivElement | null>,
	caretRef: RefObject<HTMLDivElement | null>,
	currentWord: number,
	input: string,
	onNewLine?: (line: number) => void
) {
	const logicalLineRef = useRef(1);
	const prevCaretYRef = useRef<number | null>(null);
	const rafIdRef = useRef<number | null>(null);
	const containerRectRef = useRef<DOMRect | null>(null);
	const lineHeightRef = useRef<number | null>(null);

	useEffect(() => {
		// Cancel any pending animation frame
		if (rafIdRef.current !== null) {
			cancelAnimationFrame(rafIdRef.current);
		}

		// Schedule position update on next frame to batch DOM reads/writes
		rafIdRef.current = requestAnimationFrame(() => {
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

			// Cache container rect - only recalculate if container might have moved
			if (!containerRectRef.current) {
				containerRectRef.current = testDiv.getBoundingClientRect();
			}
			const containerRect = containerRectRef.current;

			// Cache line height
			if (lineHeightRef.current === null) {
				lineHeightRef.current =
					parseFloat(getComputedStyle(testDiv).lineHeight) || 20;
			}

			let x = 0;
			let y = 0;

			// Get line height for vertical alignment adjustments
			const lineHeight = lineHeightRef.current ?? 36;

			if (typedLength <= wordLength) {
				const idx = Math.max(typedLength - 1, 0);
				const target = letterSpans[idx];
				if (!target) return;

				const rect = target.getBoundingClientRect();
				x =
					rect.left -
					containerRect.left +
					(typedLength === 0 ? 0 : target.offsetWidth);
				// Add line height to move cursor down one line
				y = rect.top - containerRect.top - 3 * lineHeight + 2;
			} else {
				const lastLetter = letterSpans[wordLength - 1];
				if (!lastLetter) return;

				const lastRect = lastLetter.getBoundingClientRect();

				// Use cached measurer for overflow characters
				const measurer = getMeasurer();
				measurer.style.font = getComputedStyle(lastLetter).font;
				measurer.textContent = input.slice(wordLength);

				const overflowWidth = measurer.getBoundingClientRect().width;

				x =
					lastRect.left -
					containerRect.left +
					lastLetter.offsetWidth +
					overflowWidth;
				y = lastRect.top - containerRect.top - 3 * lineHeight + 2;
			}

			// Use transform instead of left/top for better performance
			// y already includes the +4 offset from the original calculation
			caret.style.transform = `translate(${x}px, ${y}px)`;

			// Determine current line (based on vertical position)
			const prevY = prevCaretYRef.current;

			if (prevY !== null && lineHeightRef.current !== null) {
				// moved down by >= ~1 line → new logical line
				if (y - prevY > lineHeightRef.current * 0.6) {
					logicalLineRef.current += 1;
					onNewLine?.(logicalLineRef.current);
				}
			}

			prevCaretYRef.current = y;
			rafIdRef.current = null;
		});

		return () => {
			if (rafIdRef.current !== null) {
				cancelAnimationFrame(rafIdRef.current);
				rafIdRef.current = null;
			}
		};
	}, [currentWord, input, onNewLine, caretRef, testRef]);

	// Reset cached values when word changes
	useEffect(() => {
		containerRectRef.current = null;
	}, [currentWord]);
}
