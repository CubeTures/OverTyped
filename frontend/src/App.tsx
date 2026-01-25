import { createContext, useEffect, useRef, useState } from "react";
import GamePage from "./components/pages/GamePage";
import TitlePage from "./components/pages/TitlePage";
import { CurrentPage, usePage } from "./PageProvider";
import { useEnter } from "./hooks/useEnter";
import { main } from "./lib/render-start";
import { setStage } from "./lib/draw-scene";
import BlinkingText from "./components/BlinkingText";
import FinishPage from "./components/pages/FinishPage";
import PixelSnow from "@/components/PixelSnow";

export const AnimationContext = createContext({});

function App() {
	const { page, players, currentPlayer } = usePage();
	const [visible, setVisible] = useState(false);
	const [ready, setReady] = useState(false);
	const [animationEnd, setAnimationEnd] = useState(false);
	const [particles, setParticles] = useState({
		direction: 145,
		speed: 1.25,
		density: 0.05,
	});
	const canvasRef = useRef<HTMLCanvasElement>(null);

	function currentPage() {
		if (ready && animationEnd) {
			if (players[currentPlayer]?.finished === true) {
				return <FinishPage />;
			} else if (page === CurrentPage.Login) {
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
		setParticles({ direction: 100, speed: 1, density: 0.05 });
	});

	useEffect(() => {
		if (canvasRef.current !== null) {
			main(canvasRef.current);
		}
	}, [canvasRef]);

	useEffect(() => {
		if (ready) {
			setStage(1);
		}
	}, [ready]);

	useEffect(() => {
		if (page == CurrentPage.Game) {
			setParticles({ direction: 200, speed: 4, density: 0.1 });
			setStage(2);
		}
	}, [page]);

	return (
		<AnimationContext.Provider
			value={{ visible, setVisible, setReady, setAnimationEnd, setParticles }}
		>
			<div className="w-dvw h-dvh flex flex-col">
				<div
					className={`bg-primary/20 transition-all duration-1000 ease-in-out place-self-center relative ${ready ? "h-[60dvh]" : "h-dvh"} ${visible ? "w-dvw" : "w-0"}`}
					onTransitionEnd={() => setAnimationEnd(true)}
				>
					{/* <PixelSnow
						color="#ffffff"
						flakeSize={0.01}
						minFlakeSize={1.25}
						pixelResolution={400}
						speed={particles.speed}
						density={particles.density}
						direction={particles.direction}
						brightness={1}
						depthFade={8}
						farPlane={20}
						gamma={0.4545}
						variant="square"
						className={`absolute z-100 w-full h-full ${animationEnd ? "opacity-100" : "opacity-0"} transition-opacity duration-5000`}
					/> */}
					<canvas
						width="640"
						height="480"
						className="w-full h-full"
						ref={canvasRef}
					></canvas>
				</div>

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
		</AnimationContext.Provider>
	);
}

export default App;
