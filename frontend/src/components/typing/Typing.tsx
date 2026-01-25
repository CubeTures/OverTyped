import { useEffect, useRef, useState } from "react";
import { useTypingEngine } from "@/hooks/useTypingEngine";
import { useCaretPosition } from "@/hooks/useCaretPosition";
import Word from "./Word";
import { useMonoCharSize } from "@/hooks/useFontLetterSize";

interface Props {
	words: string[];
}

export default function Typing({ words }: Props) {
	const testRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const caretRef = useRef<HTMLDivElement>(null);
	const writingDivRef = useRef<HTMLDivElement>(null);
	const [line, setLine] = useState(0);

	const charSize = useMonoCharSize("font-4xl");
	const { input, currentWord, typedWords, handleInput } = useTypingEngine(
		words,
		caretRef,
		writingDivRef,
		charSize.width
	);
	useCaretPosition(testRef, caretRef, currentWord, input, (_line) => {
		if (_line !== line && _line !== 0) {
			setLine(_line);
		}
	});

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	function refocus() {
		inputRef.current?.focus();
	}

	return (
		<button
			className="w-full h-full flex justify-center items-center"
			onClick={refocus}
		>
			<div
				className="grow max-w-5xl m-4 text-4xl relative font-mono h-[calc(var(--text-4xl)*3+(var(--spacing))*4)] pt-1"
				ref={writingDivRef}
			>
				<div
					className="flex flex-wrap text-muted-foreground h-full items-start top-0 overflow-hidden"
					ref={testRef}
					onClick={() => inputRef.current?.focus()}
				>
					{typedWords.map((w, i) => (
						<Word
							key={i}
							word={w.text}
							status={w.status}
							isActive={i === currentWord}
							input={input}
							offsetY={line > 2 ? 40 * (line - 2) : 0}
						/>
					))}
				</div>

				<input
					ref={inputRef}
					value={input}
					onChange={(e) => handleInput(e.target.value)}
					className="opacity-0 absolute pointer-events-none"
					spellCheck={false}
				/>

				<div
					className="absolute w-0.75 h-(--text-4xl) bg-primary rounded-full pointer-events-none transition-all top-10 left-0"
					ref={caretRef}
				/>
			</div>
		</button>
	);
}
