import { usePage } from "@/PageProvider";
import Typing from "../typing/Typing";

function GamePage() {
	const { words } = usePage();

	return (
		<div className="w-full h-full flex justify-center items-center">
			<Typing words={words.slice(0, 30)} />
		</div>
	);
}

export default GamePage;
