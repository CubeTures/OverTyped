import { useEffect, useState } from "react";
import GamePage from "./components/pages/GamePage";
import TitlePage from "./components/pages/TitlePage";
import { CurrentPage, usePage } from "./PageProvider";
import { useEnter } from "./hooks/useEnter";

function App() {
	const { page } = usePage();
	const [ready, setReady] = useState(false);
	const [animationEnd, setAnimationEnd] = useState(false);

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

	return (
		<div className="bg-muted w-dvw h-dvh flex flex-col">
			<canvas
				className={`bg-red-400 transition-all duration-1000 ease-in-out place-self-center w-dvw ${ready ? "h-[60dvh]" : "h-dvh"}`}
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
