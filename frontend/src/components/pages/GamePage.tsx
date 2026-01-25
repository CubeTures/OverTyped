import { CurrentPage, usePage } from "@/PageProvider";
import Typing from "../typing/Typing";
import LobbyList from "../lobby/LobbyList";

function GamePage() {
	const { page, words } = usePage();

	return (
		<>
			<LobbyList />
			{page === CurrentPage.Game ? (
				<Typing words={words.slice(0, 30)} />
			) : (
				<div className="w-full grow">Loading Lobby</div>
			)}
		</>
	);
}

export default GamePage;
