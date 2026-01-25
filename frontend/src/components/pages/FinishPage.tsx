import { AnimationContext } from "@/App";
import { CurrentPage, usePage } from "@/PageProvider";
import { useContext } from "react";
import { setStage } from "@/lib/draw-scene";
import { Button } from "../ui/button";

function FinishPage() {
	const { setName, players, setPlayers, currentPlayer } = usePage();
	const { visible, setVisible, setReady, setAnimationEnd } =
		useContext(AnimationContext);

	function reset() {
		setVisible(false);
		setTimeout(() => {
			setReady(false);
			setAnimationEnd(false);
			setPlayers({});
			setName("");
			setStage(0);
			setTimeout(() => {
				setVisible(true);
			}, 500);
		}, 1500);
	}

	function placeName(place: number): string {
		switch (place) {
			case 1:
				return "1st";
			case 2:
				return "2nd";
			case 3:
				return "3rd";
			case 4:
				return "4th";
			default:
				return "???";
		}
	}

	return (
		<div
			className={`w-full h-full flex flex-col justify-center items-center gap-4 ${visible ? "opacity-100" : "opacity-0"}`}
		>
			<h2 className="text-2xl font-bold">Finished {placeName(players[currentPlayer].place)} Place</h2>
			<p className="text-lg">Average WPM: {players[currentPlayer].wpm}</p>
			<Button
				className="border border-primary"
				onClick={reset}
			>
				Type Some More
			</Button>
		</div>
	);
}

export default FinishPage;
