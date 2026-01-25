import type { Player } from "@/lib/comm";
import { usePage } from "@/PageProvider";
import { Reorder, motion } from "framer-motion";

function LobbyList() {
	const { players, currentPlayer } = usePage();

	const orderedPlayers: Player[] = Object.values(players).sort((a, b) => {
		if (a.progress === b.progress) {
			return a.id - b.id;
		} else {
			return b.progress - a.progress;
		}
	});

	return (
		<div className="absolute top-0 left-0 flex flex-col bg-card m-4 rounded-md font-mono w-3xs">
			<div className="w-full p-4 text-center rounded-md">Speed</div>
			<Reorder.Group
				axis="y"
				values={orderedPlayers.map((p) => p.id)}
				onReorder={() => {}}
				className="flex flex-col p-1 pb-2"
			>
				{orderedPlayers.map((player, i) => (
					<Reorder.Item
						key={player.id}
						value={player.id}
						className="flex items-center gap-4"
					>
						<motion.span
							layout
							className="font-mono align-baseline pl-3"
						>
							{i + 1}
						</motion.span>
						<div
							className={`flex justify-between rounded-lg w-full h-full py-1 px-4 mr-1 ${player.id == currentPlayer ? "bg-muted" : ""}`}
						>
							<div>{player.name}</div>
							{player.wpm > 0 && <div>{player.wpm} WPM</div>}
						</div>
					</Reorder.Item>
				))}
			</Reorder.Group>
		</div>
	);
}

export default LobbyList;
