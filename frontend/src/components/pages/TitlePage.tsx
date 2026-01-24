import { usePage } from "@/PageProvider";
import { useEffect, useRef, useState, type KeyboardEventHandler } from "react";
import { Input } from "../ui/input";

function TitlePage() {
	const { setName } = usePage();
	const [tempName, setTempName] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, [inputRef]);

	const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
		if (e.code === "Enter" && tempName !== "") {
			setName(tempName);
		}
	};

	return (
		<div className="w-full h-full flex flex-col justify-center items-center gap-4">
			<Input
				ref={inputRef}
				className="h-[--text-4xl] w-80 text-4xl! text-center"
				value={tempName}
				onChange={(e) => setTempName(e.target.value)}
				onKeyDown={handleKeyDown}
			></Input>
		</div>
	);
}

export default TitlePage;
