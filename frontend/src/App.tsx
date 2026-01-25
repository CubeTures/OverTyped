import { useEffect, useRef, useState } from "react";
import GamePage from "./components/pages/GamePage";
import TitlePage from "./components/pages/TitlePage";
import { CurrentPage, usePage } from "./PageProvider";
import { useEnter } from "./hooks/useEnter";
import { main } from "./lib/render-start";
import { incrementStage } from "./lib/draw-scene";
import BlinkingText from "./components/BlinkingText";

function App() {
	const { page } = usePage();
	const [visible, setVisible] = useState(false);
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

	useEffect(() => {
		// let the objs load
		setTimeout(() => {
			setVisible(true);
		}, 1000);
	}, []);

	useEnter(() => {
		setReady(true);
	});

	useEffect(() => {
		if (canvasRef.current !== null) {
			main(canvasRef.current);
		}
	}, [canvasRef]);

	useEffect(() => {
		if (ready) {
			incrementStage();
		}
	}, [ready]);

	return (
		<div className="w-dvw h-dvh flex flex-col">
			<canvas
				width="1920"
				height="1080"
				ref={canvasRef}
				className={`bg-primary/20 transition-all duration-1000 ease-in-out place-self-center ${ready ? "h-[60dvh]" : "h-dvh"} ${visible ? "w-dvw" : "w-0"}`}
				onTransitionEnd={() => setAnimationEnd(true)}
			></canvas>
			{!ready && visible && (
				<div className="absolute bottom-0 right-0 text-4xl p-4">
					<BlinkingText text="Press Enter" />
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
