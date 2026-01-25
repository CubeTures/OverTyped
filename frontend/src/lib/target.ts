import type { Player } from "./comm";

export function getTargetPlayer(
	players: Player[],
	currentPlayerId: number,
	strategy: "first" | "last" | "closest"
): number | undefined {
	const currentPlayer = players.find((p) => p.id === currentPlayerId)!;
	let target = players[0];
	let diff = Math.abs(target.progress - currentPlayer.progress);

	for (const player of players) {
		if (player.id === currentPlayer.id) continue;
		if (target.id === currentPlayer.id) {
			target = player;
			diff = Math.abs(player.progress - currentPlayer.progress);
		} else {
			if (strategy === "first") {
				if (player.progress > target.progress) {
					target = player;
				}
			} else if (strategy === "last") {
				if (player.progress < target.progress) {
					target = player;
				}
			} else if (strategy === "closest") {
				const d = Math.abs(player.progress - currentPlayer.progress);
				if (d < diff) {
					diff = d;
				}
			}
		}
	}

	if (target.id !== currentPlayer.id) {
		return target.id;
	} else {
		return undefined;
	}
}
