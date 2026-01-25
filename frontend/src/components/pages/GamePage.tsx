import { CurrentPage, usePage } from "@/PageProvider";
import LobbyList from "../lobby/LobbyList";
import Typing from "../typing/Typing";
import Draft from "../lobby/Draft";
import { useEffect } from "react";
import { setPlayerCount } from "@/lib/draw-scene";

function GamePage() {
	const { page, words, players } = usePage();

	useEffect(() => {
		setPlayerCount(Object.keys(players).length - 1);
	}, [players]);

	return (
		<>
			<LobbyList />
			{page === CurrentPage.Game ? <Typing words={words} /> : <Draft />}
		</>
	);
}

export default GamePage;
