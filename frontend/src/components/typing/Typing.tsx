import { useEffect, useRef, useState } from "react";
import { useTypingEngine } from "@/hooks/useTypingEngine";
import { useCaretPosition } from "@/hooks/useCaretPosition";
import Word from "./Word";
import { useMonoCharSize } from "@/hooks/useFontLetterSize";
import { usePage } from "@/PageProvider";

const Powerups = [
	"spike strip",
	"stick shift",
	"fog",
	"icy roads",
	"tire boot",
	"scrambler",
	"rear view mirror",
];

const targets = ["first", "last", "closest"];

interface Props {
	words: string[];
}

export default function Typing({ words }: Props) {
	const testRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const caretRef = useRef<HTMLDivElement>(null);
	const writingDivRef = useRef<HTMLDivElement>(null);
	const [line, setLine] = useState(0);
	const [selectedPowerup, setSelectedPowerup] = useState(0);
	const [selectedTarget, setSelectedTarget] = useState(0);

	const charSize = useMonoCharSize("font-4xl");
	const { input, currentWord, typedWords, handleInput } = useTypingEngine(
		words,
		caretRef,
		writingDivRef,
		charSize.width
	);

	// const { powerups } = usePage()
	const powerups = [1, 2];

	useCaretPosition(testRef, caretRef, currentWord, input, (_line) => {
		if (_line !== line && _line !== 0) {
			setLine(_line);
		}
	});

	useEffect(() => {
		inputRef.current?.focus();

		const onKeyDown = (e: KeyboardEvent) => {
			switch (e.code) {
				case "ArrowRight":
					setSelectedPowerup((p) =>
						Math.min(p + 1, powerups.length - 1)
					);
					break;
				case "ArrowLeft":
					setSelectedPowerup((p) => Math.max(p - 1, 0));
					break;
				case "ArrowUp":
					setSelectedTarget((t) =>
						Math.min(t + 1, targets.length - 1)
					);
					break;
				case "ArrowDown":
					setSelectedTarget((t) => Math.max(t - 1, 0));
					break;
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, []);

	function refocus() {
		inputRef.current?.focus();
	}

	return (
		<button
			className="w-full h-full flex justify-center items-center flex-col relative"
			onClick={refocus}
		>
			<div className="absolute font-mono top-[theme(spacing.6)] text-[#a0a0a0] flex bg-[#1c1c1c] px-8 h-10 text-lg rounded-lg items-center justify-center">
				<div className="flex gap-10">
					{powerups.map((p, i) => (
						<div
							key={i}
							className={`transition-colors hover:text-foreground cursor-pointer ${selectedPowerup === i ? "text-foreground" : ""}`}
							onClick={() => setSelectedPowerup(i)}
						>
							{Powerups[p]}
						</div>
					))}
				</div>
				<div className="h-[60%] mx-10 w-2 bg-background rounded-lg"></div>
				<div className="flex gap-10">
					{targets.map((t, i) => (
						<div
							key={i}
							className={`transition-colors hover:text-foreground cursor-pointer ${selectedTarget === i ? "text-foreground" : ""}`}
							onClick={() => setSelectedTarget(i)}
						>
							{t}
						</div>
					))}
				</div>
			</div>
			<div
				className="max-w-5xl m-4 text-3xl relative font-mono h-[calc(var(--text-3xl)*3+(var(--spacing))*4)] pt-1"
				ref={writingDivRef}
			>
				<div
					className="flex flex-wrap text-[#a0a0a0] h-full items-start top-0 overflow-hidden"
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
