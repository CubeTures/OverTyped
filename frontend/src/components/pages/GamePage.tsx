import { CurrentPage, usePage } from "@/PageProvider";
import LobbyList from "../lobby/LobbyList";
import Typing from "../typing/Typing";
import Draft from "../lobby/Draft";

function GamePage() {
	const { page, words } = usePage();

	return (
		<>
			<LobbyList />
			{page === CurrentPage.Game ? (
				<Typing words={words.slice(0, 30)} />
			) : (
				<Draft />
			)}
		</>
	);
}

export default GamePage;
