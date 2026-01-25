import { useEffect, useRef, useState } from "react";
import GamePage from "./components/pages/GamePage";
import TitlePage from "./components/pages/TitlePage";
import { CurrentPage, usePage } from "./PageProvider";
import { useEnter } from "./hooks/useEnter";
import { main } from "./lib/render-start";

function App() {
	const { page } = usePage();
	const [ready, setReady] = useState(false);
	const [animationEnd, setAnimationEnd] = useState(false);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	function currentPage() {
		if (ready && animationEnd) {
			if (page === CurrentPage.Login) {
				return <TitlePage />;
			} else {
				return <GamePage />;
			}
		}
	}

	useEnter(() => {
		setReady(true);
	});

	useEffect(() => {
		if (canvasRef.current !== null) {
			main(canvasRef.current);
		}
	}, [canvasRef]);

	return (
		<div className="w-dvw h-dvh flex flex-col">
			<canvas  width="640" height="480"
				ref={canvasRef}
				className={`bg-primary/20 transition-all duration-1000 ease-in-out place-self-center w-dvw ${ready ? "h-[60dvh]" : "h-dvh"}`}
				onTransitionEnd={() => setAnimationEnd(true)}
			></canvas>
			{!ready && (
				<div className="absolute bottom-0 right-0 text-4xl p-4">
					Press Enter
				</div>
			)}
			<div
				className={`${animationEnd ? "opacity-100" : "opacity-0"} transition-all duration-1000 w-full grow`}
			>
				{currentPage()}
			</div>
		</div>
	);
}

export default App;
