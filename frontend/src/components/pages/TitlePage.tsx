import { usePage } from "@/PageProvider";
import { useRef, useState, type KeyboardEventHandler } from "react";
import FadeTypewriter from "../FadeTypewriter";

function TitlePage() {
	const { setName } = usePage();
	const [tempName, setTempName] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
		if (e.code === "Enter" && tempName !== "") {
			setName(tempName);
		}
	};

	return (
		<div className="w-full h-full flex flex-col justify-center items-center gap-4">
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
		</div>
	);
}

export default TitlePage;
