import React from "react";

interface FadingTextProps {
	text: string;
	durationMs?: number;
}

export default function FadingText({
	text,
	durationMs = 2000,
}: FadingTextProps) {
	return (
		<span
			style={{
				animation: `fade ${durationMs}ms ease-in-out infinite`,
			}}
		>
			{text}

			<style>
				{`
					@keyframes fade {
						0% {
							opacity: 0;
						}
						50% {
							opacity: 1;
						}
						100% {
							opacity: 0;
						}
					}
				`}
			</style>
		</span>
	);
}
