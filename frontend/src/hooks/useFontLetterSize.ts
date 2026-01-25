import { useLayoutEffect, useState } from "react";

type CharSize = {
	width: number;
	height: number;
};

export function useMonoCharSize(className: string) {
	const [size, setSize] = useState<CharSize>({ width: 0, height: 0 });

	useLayoutEffect(() => {
		// create offscreen container
		const container = document.createElement("div");
		container.className = className;

		container.style.position = "absolute";
		container.style.top = "-10000px";
		container.style.left = "-10000px";
		container.style.visibility = "hidden";
		container.style.whiteSpace = "pre";

		// create glyph
		const span = document.createElement("span");
		span.textContent = "M";

		container.appendChild(span);
		document.body.appendChild(container);

		const rect = span.getBoundingClientRect();

		setSize({
			width: rect.width,
			height: rect.height,
		});

		document.body.removeChild(container);
	}, [className]);

	return size;
}
