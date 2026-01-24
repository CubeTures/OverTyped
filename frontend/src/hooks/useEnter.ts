import { useEffect } from "react";

export function useEnter(callback: () => void) {
    function begin() {
		document.addEventListener("keydown", (e) => {
			if (e.code === "Enter") {
				callback();
			}
		});
	}

	useEffect(() => {
		begin();
	}, []);
}