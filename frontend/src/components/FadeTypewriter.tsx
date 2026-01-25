import React, { useEffect, useState, type HTMLAttributes } from "react";

type FadeTypewriterProps = {
	text: string;
	speed?: number; // ms per letter
	onComplete?: () => void; // called when all letters are visible
} & HTMLAttributes<HTMLDivElement>;

export default function FadeTypewriter({
	text,
	speed = 50,
	onComplete,
	...rest
}: FadeTypewriterProps) {
	const [lettersVisible, setLettersVisible] = useState<number>(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setLettersVisible((prev) => {
				const next = prev + 1;

				if (next >= text.length) {
					clearInterval(interval);
					// Call onComplete once all letters are visible
					if (onComplete) setTimeout(() => onComplete(), speed * 10);
					return text.length;
				}
				return next;
			});
		}, speed);

		return () => clearInterval(interval);
	}, [text, speed, onComplete]);

	return (
		<p
			{...rest}
			style={{ display: "flex", flexWrap: "wrap" }}
		>
			{text.split("").map((char, i) => (
				<span
					key={i}
					style={{
						opacity: i < lettersVisible ? 1 : 0,
						transition: "opacity 0.3s ease-in",
						whiteSpace: char === " " ? "pre" : undefined,
					}}
				>
					{char}
				</span>
			))}
		</p>
	);
}
