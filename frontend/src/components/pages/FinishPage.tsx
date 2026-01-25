import { AnimationContext } from "@/App";
import { CurrentPage, usePage } from "@/PageProvider";
import { useContext } from "react";

function FinishPage() {
	const { setName, setPlayers } = usePage();
	const { setReady, setAnimationEnd } = useContext(AnimationContext);

	function reset() {
		console.log("here");
		setReady(false);
		setAnimationEnd(false);
		setPlayers({});
		setName("");
	}

	return (
		<div>
			<h2>Finish</h2>
			<button
				className="border border-primary"
				onClick={reset}
			>
				Move on
			</button>
		</div>
	);
}

export default FinishPage;
