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
		<div className="absolute top-0 left-0 flex flex-col bg-card/30 m-4 rounded-l-xl">
			<div className="w-full p-4 bg-card/80 text-center rounded-tl-xl">
				Speed
			</div>
			<Reorder.Group
				axis="y"
				values={orderedPlayers.map((p) => p.id)}
				onReorder={() => {}}
				className="flex flex-col"
			>
				{orderedPlayers.map((player, i) => (
					<Reorder.Item
						key={player.id}
						value={player.id}
						className="flex bg-muted/50 gap-2 p-4 last:rounded-bl-xl"
					>
						<motion.span
							layout
							className="font-mono text-sm"
						>
							{i + 1}
						</motion.span>
						<motion.span layout>{player.name}</motion.span>
					</Reorder.Item>
				))}
			</Reorder.Group>
		</div>
	);
}

export default LobbyList;
