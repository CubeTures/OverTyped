import { useVisible } from "@/hooks/useVisible";
import { usePage } from "@/PageProvider";
import { useEffect, useState } from "react";

function Countdown({
	draftOver,
	setDraftOver,
}: {
	draftOver: boolean;
	setDraftOver: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const { time } = usePage();
	const [timer, setTimer] = useState(time);
    const visible = useVisible();

	useEffect(() => {
		setTimer(time);
	}, [time]);

	useEffect(() => {
		const interval = setInterval(() => {
			setTimer((t) => {
				if (t <= 1) {
					clearInterval(interval);
					setDraftOver(true);
					return 0;
				}
				return t - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [setDraftOver]);

	return (
		<div className="absolute w-full grow flex justify-center items-center text-center -z-10">
			<h2 className={`text-[30dvh] font-bold ${visible ? "text-muted" : "text-background"} transition-colors duration-9000`}>{timer}</h2>
		</div>
	);
}

export default Countdown;
