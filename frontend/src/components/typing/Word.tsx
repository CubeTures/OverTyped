import { Powerup } from "@/lib/comm";
import { usePage } from "@/PageProvider";
import { memo, useMemo } from "react";

type LetterStatus = "pending" | "correct" | "incorrect";

type Props = {
	word: string;
	isActive: boolean;
	status: LetterStatus;
	input: string;
	offsetY: number;
};

const Word = memo(function Word({ word, isActive, status, input, offsetY }: Props) {
	const { players, currentPlayer } = usePage();

	// Memoize letter states calculation - only recalculate when inputs change
	const letterStates = useMemo(() => {
		if (!isActive) {
			// If word is completed, show all letters as correct
			if (status === "correct") {
				return word.split("").map(() => "correct" as LetterStatus);
			}
			// If word is incorrect, show all letters as incorrect
			if (status === "incorrect") {
				return word.split("").map(() => "incorrect" as LetterStatus);
			}
			// Otherwise pending
			return word.split("").map(() => "pending" as LetterStatus);
		}

		return word.split("").map((char, i) => {
			if (i >= input.length) return "pending";
			return input[i] === char ? "correct" : "incorrect";
		});
	}, [input, isActive, word, status]);

	// Memoize letters array
	const letters = useMemo(() => word.split(""), [word]);

	// Memoize overflow characters
	const overflowChars = useMemo(() => {
		if (!isActive || input.length <= word.length) return null;
		return input.slice(word.length).split("");
	}, [isActive, input, word]);

	// Memoize shouldHide calculation
	const shouldHide = useMemo(() => {
		return (
			players[currentPlayer]?.statusEffects.findIndex(
				(a) => a === Powerup.Fog
			) !== -1 &&
			!isActive &&
			status === "pending"
		);
	}, [players, currentPlayer, isActive, status]);

	const className = "mx-[0.25em] relative transition-colors ";

	return (
		<div
			className={`${shouldHide ? "opacity-0" : ""} ${className}`}
			style={{ transform: `translateY(-${offsetY}px)` }}
		>
			{letters.map((char, i) => {
				const state = letterStates[i];

				let color = "";
				if (state === "correct") color = "text-foreground";
				if (state === "incorrect") color = "text-red-400";

				return (
					<span
						key={i}
						className={`whitespace-pre ${color}`}
					>
						{char}
					</span>
				);
			})}

			{overflowChars &&
				overflowChars.map((letter, i) => (
					<span
						className="text-red-800"
						key={`overflow-${i}`}
					>
						{letter === " " ? "\u00A0" : letter}
					</span>
				))}
		</div>
	);
});

export default Word;
