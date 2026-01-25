import { useEffect, useRef, useState } from "react";
import { useTypingEngine } from "@/hooks/useTypingEngine";
import { useCaretPosition } from "@/hooks/useCaretPosition";
import Word from "./Word";
import { useMonoCharSize } from "@/hooks/useFontLetterSize";
import { usePage } from "@/PageProvider";
import { POWERUP_INFO } from "@/lib/powerups";
import { getTargetPlayer } from "@/lib/target";
import type { PowerupId } from "@/lib/comm";
import first from "@/assets/first.svg";
import last from "@/assets/last.svg";
import close from "@/assets/close.svg";
import updown from "@/assets/up-down.svg";
import leftright from "@/assets/left-right.svg";

const targets = { first: first, last: last, closest: close } as const;

interface Props {
	words: string[];
}

export default function Typing({ words }: Props) {
	const testRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const caretRef = useRef<HTMLDivElement>(null);
	const writingDivRef = useRef<HTMLDivElement>(null);
	const [line, setLine] = useState(0);
	const [usedPowerups, setUsedPowerups] = useState<number[]>([]);
	const [selectedPowerup, setSelectedPowerup] = useState(0);
	const [selectedTarget, setSelectedTarget] = useState(0);

	const { socket, powerups, players, currentPlayer } = usePage();

	const usedPowerupsRef = useRef<number[]>([]);
	const selectedPowerupRef = useRef(0);
	const selectedTargetRef = useRef(0);
	const powerupsRef = useRef(powerups);
	const playersRef = useRef(players);
	const currentPlayerRef = useRef(currentPlayer);

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

		const onKeyDown = (e: KeyboardEvent) => {
			const used = usedPowerupsRef.current;

			switch (e.code) {
				case "ArrowRight":
					if (used.length !== 0) break;
					setSelectedPowerup((p) =>
						Math.min(p + 1, powerupsRef.current.length - 1)
					);
					break;

				case "ArrowLeft":
					if (used.length !== 0) break;
					setSelectedPowerup((p) => Math.max(p - 1, 0));
					break;

				case "ArrowUp":
					setSelectedTarget((t) =>
						Math.min(t + 1, Object.keys(targets).length - 1)
					);
					break;

				case "ArrowDown":
					setSelectedTarget((t) => Math.max(t - 1, 0));
					break;

				case "Enter": {
					const sel = selectedPowerupRef.current;
					const targetIndex = selectedTargetRef.current;
					const powerups = powerupsRef.current;
					const players = playersRef.current;
					const currentPlayer = currentPlayerRef.current;

					if (used.includes(sel)) break;

					const target = getTargetPlayer(
						Object.values(players),
						currentPlayer,
						Object.keys(targets)[targetIndex] as any
					);

					if (target === undefined) return;

					socket.sendPurchase({
						powerupId: POWERUP_INFO[powerups[sel]].id,
						targetPlayer: target,
					});

					setUsedPowerups((prev) => [...prev, sel]);
					setSelectedPowerup((p) => 1 - p);
					break;
				}
			}
		};

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, []);

	function refocus() {
		inputRef.current?.focus();
	}

	useEffect(() => {
		usedPowerupsRef.current = usedPowerups;
	}, [usedPowerups]);

	useEffect(() => {
		selectedPowerupRef.current = selectedPowerup;
	}, [selectedPowerup]);

	useEffect(() => {
		selectedTargetRef.current = selectedTarget;
	}, [selectedTarget]);

	useEffect(() => {
		powerupsRef.current = powerups;
	}, [powerups]);

	useEffect(() => {
		playersRef.current = players;
	}, [players]);

	useEffect(() => {
		currentPlayerRef.current = currentPlayer;
	}, [currentPlayer]);

	return (
		<button
			className="w-full h-full flex justify-center items-center flex-col relative"
			onClick={refocus}
		>
			<div className="absolute font-mono top-6 text-[#a0a0a0] flex bg-[#1c1c1c] px-8 h-10 text-lg rounded-lg items-center justify-center">
				<div className="flex gap-10">
					{powerups.map((p, i) => (
						<div
							key={i}
							className={`transition-all text-foreground hover:text-foreground cursor-pointer text-nowrap items-center flex gap-2 ${selectedPowerup === i ? "" : "brightness-60 hover:brightness-100"} ${usedPowerups.includes(i) ? "brightness-20! hover:brightness-20!" : ""}`}
							onClick={() => {
								if (!usedPowerups.includes(i)) {
									setSelectedPowerup(i);
								}
							}}
						>
							<img
								src={POWERUP_INFO[p].icon}
								className="size-5"
							/>
							<p>{POWERUP_INFO[p].name}</p>
						</div>
					))}
				</div>
				<img
					src={leftright}
					className="size-5 ml-6"
				/>
				<div className="h-[60%] mx-2 w-2 bg-background rounded-lg"></div>
				<img
					src={updown}
					className="size-5 mr-6"
				/>
				<div className="flex gap-10">
					{Object.entries(targets).map(([t, ico], i) => (
						<div
							key={i}
							className={`transition-colors text-foreground hover:text-foreground hover:brightness-100 cursor-pointer flex items-center text-nowrap gap-1 ${selectedTarget === i ? "brightness-100" : "brightness-50"}`}
							onClick={() => setSelectedTarget(i)}
						>
							<img
								src={ico}
								className="size-5"
							/>
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
							offsetY={line > 2 ? 36 * (line - 2) : 0}
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
