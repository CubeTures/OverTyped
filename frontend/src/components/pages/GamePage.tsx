import { CurrentPage, usePage } from "@/PageProvider";
import LobbyList from "../lobby/LobbyList";
import Typing from "../typing/Typing";
import Draft from "../lobby/Draft";
import { useEffect, useState } from "react";
import { setPlayerCount } from "@/lib/draw-scene";
import Countdown from "../lobby/Countdown";

function GamePage() {
	const { page, words, players } = usePage();
	const [draftOver, setDraftOver] = useState(false);

	useEffect(() => {
		setPlayerCount(Object.keys(players).length - 1);
	}, [players]);

	useEffect(() => {
		console.log("DRAFT OVER?", draftOver);
	}, [draftOver]);

	return (
		<>
			<LobbyList />
			{page === CurrentPage.Game ? (
				<Typing words={words} />
			) : (
				<>
					<Countdown
						draftOver={draftOver}
						setDraftOver={setDraftOver}
					/>
					<Draft
						draftOver={draftOver}
						setDraftOver={setDraftOver}
					/>
				</>
			)}
		</>
	);
}

export default GamePage;
