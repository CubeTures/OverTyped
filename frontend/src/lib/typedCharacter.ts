const BACKSPACE = "\x08";

export function getTypedCharacter(
	value: string,
	input: string,
	expected: string
): string[] | undefined {
	const isBackspace = value.length <= input.length;
	const isWipe = isBackspace && value.length === 0;

	if (isWipe) {
		let chars: string[] = [];
		for (let i = 0; i < input.length && i < expected.length; i++) {
			if (input[i] === expected[i]) {
				chars.push(BACKSPACE);
			}
		}
		return chars;
	}

	let testAgainst = isBackspace ? input : value;
	let typedChar =
		testAgainst.length > 0
			? testAgainst[testAgainst.length - 1]
			: undefined;
	let expectedChar =
		testAgainst.length === 0 || testAgainst.length > expected.length
			? undefined
			: expected[testAgainst.length - 1];

	if (
		typedChar !== undefined &&
		expectedChar !== undefined &&
		typedChar === expectedChar
	) {
		const send = isBackspace ? BACKSPACE : typedChar;
		return [send];
	}
}
