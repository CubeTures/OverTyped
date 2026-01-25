import { Powerup } from "./comm";
import spike from "@/assets/spike.svg";
import shift from "@/assets/shift.svg";
import fog from "@/assets/fog.svg";
import snow from "@/assets/snow.svg";
import tire from "@/assets/tire.svg";
import scramble from "@/assets/scramble.svg";
import mirror from "@/assets/mirror.svg";

export const POWERUP_INFO = {
	[Powerup.SpikeStrip]: {
		name: "Spike Strip",
		icon: spike,
		action: "passive",
		description: "Add 5 additional words to opponent",
	},
	[Powerup.StickShift]: {
		name: "Stick Shift",
		action: "passive",
		icon: shift,
		description: "Add punctuation and special characters for 10 words",
	},
	[Powerup.Fog]: {
		name: "Fog",
		action: "passive",
		icon: fog,
		description: "Opponent only sees 1 word for 10 seconds",
	},
	[Powerup.IcyRoads]: {
		name: "Icy Roads",
		action: "passive",
		icon: snow,
		description: "Add additional characters to next 10 words",
	},
	[Powerup.TireBoot]: {
		name: "Tire Boot",
		action: "active",
		icon: tire,
		description: "Lock opponent ability for 10 seconds",
	},
	[Powerup.Scrambler]: {
		name: "Scrambler",
		action: "active",
		icon: scramble,
		description: "Scramble opponent's next 10 words",
	},
	[Powerup.RearViewMirror]: {
		name: "Rear View Mirror",
		action: "active",
		icon: mirror,
		description: "Reflect other skills back for 10 seconds",
	},
} satisfies Record<
	number,
	{
		name: string;
		action: "passive" | "active";
		icon: string;
		description: string;
	}
>;
