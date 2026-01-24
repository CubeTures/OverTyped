import { useEffect, useState } from "react";

type LetterStatus = "pending" | "correct" | "incorrect";

type Props = {
	word: string;
	isActive: boolean;
	status: LetterStatus;
	input: string;
};

function Word({ word, isActive, status, input }: Props) {
	const [letterStates, setLetterStates] = useState<LetterStatus[]>([]);
	const letters = word.split("");

	let className = "mx-[0.25em] relative transition-colors ";
	if (status === "correct") {
		className += "text-green-400";
	} else if (status === "incorrect") {
		className +=
			"underline decoration-red-400 decoration-[3px] underline-offset-[3px]";
	}

	useEffect(() => {
		if (!isActive) return;

		const next = word.split("").map((char, i) => {
			if (i >= input.length) return "pending";
			return input[i] === char ? "correct" : "incorrect";
		});

		setLetterStates(next);
	}, [input, isActive, word]);

	return (
		<div className={className}>
			{letters.map((char, i) => {
				const state = letterStates[i];

				let color = "";
				if (status !== "correct") {
					if (state === "correct") color = "text-foreground";
					if (state === "incorrect") color = "text-red-400";
				}

				return (
					<span
						key={i}
						className={`whitespace-pre ${color}`}
					>
						{char}
					</span>
				);
			})}

			{isActive &&
				input.length > word.length &&
				input
					.slice(word.length)
					.split("")
					.map((letter, i) => (
						<span
							className="text-red-800"
							key={i}
						>
							{letter === " " ? "\u00A0" : letter}
						</span>
					))}
		</div>
	);
}

export default Word;
