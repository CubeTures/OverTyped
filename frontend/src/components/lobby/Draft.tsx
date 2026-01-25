import { motion, type Variants } from "framer-motion";
import { usePage } from "@/PageProvider";
import { POWERUP_INFO } from "@/lib/powerups";
import { useEffect, useRef, useState } from "react";
import type { PowerupId } from "@/lib/comm";
import active from "@/assets/active.svg";

const container: Variants = {
	hidden: {},
	show: {
		transition: {
			staggerChildren: 0.08,
		},
	},
};

const card: Variants = {
	hidden: {
		opacity: 0,
		y: 40,
		scale: 0.95,
	},

	show: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: {
			type: "spring",
			stiffness: 260,
			damping: 22,
		},
	},

	fade: {
		opacity: 0,
		transition: {
			duration: 0.25,
			ease: "easeOut",
		},
	},
};

function Draft() {
	const { powerups, setPowerups } = usePage();

	const [choices] = useState<PowerupId[]>([...powerups]);
	const [chosen, setChosen] = useState<PowerupId[]>([]);
	const [past, setPast] = useState(false);

	const chosenRef = useRef<PowerupId[]>([]);
	const done = chosen.length === 2;

	// keep ref in sync with state
	useEffect(() => {
		chosenRef.current = chosen;
	}, [chosen]);

	function selectPowerup(id: PowerupId) {
		if (chosen.length === 1) {
			setPowerups([...chosen, id]);
			setTimeout(() => setPast(true), 1500);
		}

		setChosen((prev) => prev.concat(id));
	}

	function ranOutOfTime(finalChosen: PowerupId[]) {
		if (finalChosen.length !== 2) {
			setPowerups([...finalChosen, ...powerups].slice(0, 2));
		}
	}

	useEffect(() => {
		return () => {
			ranOutOfTime(chosenRef.current);
		};
	}, []);

	return (
		<div className="w-full h-full grow flex flex-col gap-4 pt-4">
			<h2
				className={`
					w-full text-center text-3xl
					transition-opacity duration-300
					${done ? "opacity-0 pointer-events-none" : "opacity-100"}
				`}
			>
				Select 2
			</h2>

			<motion.div
				className="grow grid grid-cols-4 gap-4 px-4"
				variants={container}
				initial="hidden"
				animate="show"
			>
				{choices.map((pow) => {
					const isChosen = chosen.includes(pow);
					const fadeAway = (done && !isChosen) || past;

					return (
						<motion.div
							key={pow}
							variants={card}
							animate={fadeAway ? "fade" : undefined}
							className={`
								w-full grow flex justify-center items-end
								${fadeAway ? " pointer-events-none" : ""}
							`}
						>
							<button
								className={`
									h-full flex flex-col justify-start p-4 max-w-50
									bg-card rounded-t-xl border border-b-0
									transition-all duration-200
									${chosen.length < 2 ? "cursor-pointer" : ""}
									${isChosen ? "border-primary" : "border-black/0"}
								`}
								disabled={chosen.length >= 2}
								onClick={() => selectPowerup(pow)}
							>
								<div className="font-bold text-center w-full">
									{POWERUP_INFO[pow].name}
								</div>

								<div className="w-full px-10 py-4 relative">
									<img
										src={POWERUP_INFO[pow].icon}
										className="w-full h-content"
									/>
								</div>

								<p className="text-center">
									{POWERUP_INFO[pow].description}
								</p>
							</button>
						</motion.div>
					);
				})}
			</motion.div>
		</div>
	);
}

export default Draft;
