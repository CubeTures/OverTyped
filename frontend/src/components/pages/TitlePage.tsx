import { CurrentPage, usePage } from "@/PageProvider";
import { useEffect, useRef, useState, type KeyboardEventHandler } from "react";
import FadeTypewriter from "../FadeTypewriter";
import { Spinner } from "@/components/ui/spinner";

function TitlePage() {
	const { page, setName } = usePage();
	const [tempName, setTempName] = useState("");
	const [loading, setLoading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
		if (e.code === "Enter" && tempName !== "") {
			setName(tempName);
			setLoading(true);
		}
	};

	useEffect(() => {
		if (page === CurrentPage.Lobby) {
			setLoading(false);
		}
	}, [page]);

	function refocus() {
		inputRef.current?.focus();
	}

	return (
		<button
			className="w-full h-full flex flex-col justify-center items-center gap-4 relative"
			onClick={refocus}
		>
			<div
				className={`absolute w-full h-full inset-0 backdrop-blur-md bg-background/50 ${loading ? "opacity-100" : "opacity-0"} flex justify-center items-center`}
			>
				<Spinner />
			</div>
			<FadeTypewriter
				className="text-xl"
				text="What do they call you?"
				speed={25}
				onComplete={() => inputRef.current?.focus()}
			/>
			<input
				ref={inputRef}
				className="h-[--text-4xl] w-80 text-4xl text-center outline-none ring-0 focus:outline-none focus:ring-0 border-none bg-transparent"
				value={tempName}
				onChange={(e) => setTempName(e.target.value)}
				onKeyDown={handleKeyDown}
			></input>
		</button>
	);
}

export default TitlePage;
