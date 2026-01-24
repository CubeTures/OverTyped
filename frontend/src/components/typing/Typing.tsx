import { useEffect, useRef } from "react";
import { useTypingEngine } from "@/hooks/useTypingEngine";
import { useCaretPosition } from "@/hooks/useCaretPosition";
import Word from "./Word";

const TEST_STRING =
	"this is a type test make sure to type the fastest you possibly can to show that you are the fastest one to exist we know you think you are fast but are you really faster than the best find out now";

const words = TEST_STRING.split(" ");

export default function Typing() {
	const testRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const caretRef = useRef<HTMLDivElement>(null);

	const { input, currentWord, typedWords, handleInput } =
		useTypingEngine(words);

	useCaretPosition(testRef, caretRef, currentWord, input);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	return (
		<div className="grow max-w-5xl m-4 text-4xl relative font-mono">
			<div
				className="flex flex-wrap text-muted-foreground h-min"
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
				className="absolute w-0.75 h-(--text-4xl) bg-primary rounded-full pointer-events-none transition-all top-0 left-0"
				ref={caretRef}
			/>
		</div>
	);
}
