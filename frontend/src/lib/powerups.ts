import { Powerup, type PowerupId } from "./comm";
import spike from "@/assets/spike.svg";
import shift from "@/assets/shift.svg";
import fog from "@/assets/fog.svg";
import snow from "@/assets/snow.svg";
import tire from "@/assets/tire.svg";
import scramble from "@/assets/scramble.svg";
import mirror from "@/assets/mirror.svg";

export const POWERUP_INFO = {
	[Powerup.SpikeStrip]: {
		id: Powerup.SpikeStrip,
		name: "Spike Strip",
		icon: spike,
		description: "Add 5 additional words to opponent",
	},
	[Powerup.StickShift]: {
		id: Powerup.StickShift,
		name: "Stick Shift",
		icon: shift,
		description: "Add punctuation and special characters for 10 words",
	},
	[Powerup.Fog]: {
		id: Powerup.Fog,
		name: "Fog",
		icon: fog,
		description: "Opponent only sees 1 word for 10 seconds",
	},
	[Powerup.IcyRoads]: {
		id: Powerup.IcyRoads,
		name: "Icy Roads",
		icon: snow,
		description: "Add additional characters to next 10 words",
	},
	[Powerup.TireBoot]: {
		id: Powerup.TireBoot,
		name: "Tire Boot",
		icon: tire,
		description: "Lock opponent ability for 10 seconds",
	},
	[Powerup.Scrambler]: {
		id: Powerup.Scrambler,
		name: "Scrambler",
		icon: scramble,
		description: "Scramble opponent's next 10 words",
	},
	[Powerup.RearViewMirror]: {
		id: Powerup.RearViewMirror,
		name: "Rear View Mirror",
		icon: mirror,
		description: "Reflect other skills back for 10 seconds",
	},
} satisfies Record<
	number,
	{
		id: PowerupId;
		name: string;
		icon: string;
		description: string;
	}
>;
