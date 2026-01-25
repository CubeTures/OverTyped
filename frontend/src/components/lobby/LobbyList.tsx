import type { Player } from "@/lib/comm";
import { usePage } from "@/PageProvider";

function LobbyList() {
	const { players } = usePage();

	function orderPlayers(): Player[] {
		return Object.values(players).sort((a, b) => a.progress - b.progress);
	}

	return (
		<div className="absolute top-0 left-0 flex flex-col bg-muted m-4 rounded-l-xl">
			<div className="w-full p-4 bg-card text-center rounded-tl-xl">
				Speed
			</div>
			<div className="flex flex-col gap-4 p-4">
				{orderPlayers().map((player, i) => (
					<div
						key={player.id}
						className="flex items-center gap-2"
					>
						<span className="font-mono align-baseline">
							{i + 1}
						</span>
						{player.name}
					</div>
				))}
			</div>
		</div>
	);
}

export default LobbyList;
