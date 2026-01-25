export const Powerup = {
	SpikeStrip: 0,
	StickShift: 1,
	Fog: 2,
	IcyRoads: 3,
	TireBoot: 4,
	Scrambler: 5,
	RearViewMirror: 6,
} as const;

export type PowerupId = (typeof Powerup)[keyof typeof Powerup];

export const StatusEffect = Powerup;

export type StatusEffectId = (typeof StatusEffect)[keyof typeof StatusEffect];

export type Purchase = {
	powerupId: PowerupId;
	targetPlayer: number;
};

export const ClientOp = {
	Register: 0,
	Submit: 1,
	PurchasePowerup: 2,
	SkipWait: 3,
	SelectPowerup: 4,
} as const;

export type RegisterMessage = {
	opcode: typeof ClientOp.Register;
	name: string;
};

export type SubmitMessage = {
	opcode: typeof ClientOp.Submit;
	idx: number;
};

export type SkipWaitMessage = {
	opcode: typeof ClientOp.SkipWait;
};

export type PurchasePowerupMessage = {
	opcode: typeof ClientOp.PurchasePowerup;
} & Purchase;

export type SelectPowerupMessage = {
	opcode: typeof ClientOp.SelectPowerup;
	selectedPowerups: number[];
};

export type ClientMessage =
	| RegisterMessage
	| SubmitMessage
	| SkipWaitMessage
	| PurchasePowerupMessage
	| SelectPowerupMessage;

export const ServerOp = {
	HubHello: 0,
	LobbyHello: 1,
	NewPlayer: 2,
	StartGame: 3,
	ProgressUpdate: 4,
	PlayerFinished: 5,
	StatusChanged: 6,
	PurchaseResult: 7,
	UpdateWords: 8,
} as const;

export type Player = {
	id: number;
	name: string;
	statusEffects: StatusEffectId[];
	finished: boolean;
	progress: number;
};

export type HubHello = {
	opcode: typeof ServerOp.HubHello;
};

export type LobbyHello = {
	opcode: typeof ServerOp.LobbyHello;
	playerId: number;
	timeLeft: number;
	players: Player[];
	words: string[];
	powerups: PowerupId[];
};

export type NewPlayer = {
	opcode: typeof ServerOp.NewPlayer;
} & Player;

export type StartGame = {
	opcode: typeof ServerOp.StartGame;
};

export type ProgressUpdate = {
	opcode: typeof ServerOp.ProgressUpdate;
	playerId: number;
	progress: number;
};

export type PlayerFinished = {
	opcode: typeof ServerOp.PlayerFinished;
	id: number;
	place: number;
};

export type StatusChanged = {
	opcode: typeof ServerOp.StatusChanged;
	playerId: number;
	statusEffects: StatusEffectId[];
};

export type PurchaseResult = {
	opcode: typeof ServerOp.PurchaseResult;
	powerupId: PowerupId;
	success: boolean;
};

export type UpdateWords = {
	opcode: typeof ServerOp.UpdateWords;
	startIndex: number;
	words: string[];
};

export type ServerMessage =
	| HubHello
	| LobbyHello
	| NewPlayer
	| StartGame
	| ProgressUpdate
	| PlayerFinished
	| StatusChanged
	| PurchaseResult
	| UpdateWords;

const textDecoder = new TextDecoder("utf-8");
const textEncoder = new TextEncoder();

function serializeClientMessage(payload: ClientMessage): ArrayBuffer {
	let buffer, view;
	const { opcode } = payload;
	switch (opcode) {
		case ClientOp.Register:
			const nameEncoded = textEncoder.encode(payload.name);
			if (nameEncoded.length > 255) throw new Error("Name too long");
			buffer = new ArrayBuffer(1 + 1 + nameEncoded.length); // opcode + nameLen + name
			view = new DataView(buffer);
			view.setUint8(0, opcode);
			view.setUint8(1, nameEncoded.length);
			for (let i = 0; i < nameEncoded.length; i++) {
				view.setUint8(2 + i, nameEncoded[i]);
			}
			return buffer;

		case ClientOp.Submit:
			buffer = new ArrayBuffer(1 + 4); // opcode + answer
			view = new DataView(buffer);
			view.setUint8(0, opcode);
			view.setUint32(1, payload.idx);
			return buffer;

		case ClientOp.SkipWait:
			buffer = new ArrayBuffer(1);
			view = new DataView(buffer);
			view.setUint8(0, opcode);
			return buffer;

		default:
			throw new Error("Unknown opcode: " + opcode);
	}
}

// Helper: parse len char[] combo
function parseWord(view: DataView, offset: number): [string, number] {
	const wordLen = view.getUint8(offset++);
	const wordBytes = new Uint8Array(
		view.buffer,
		view.byteOffset + offset,
		wordLen
	);
	const word = textDecoder.decode(wordBytes);
	return [word, offset + wordLen];
}

// Helper: parses a player from a DataView at the given offset
function parsePlayer(view: DataView, offset: number): [Player, number] {
	const playerId = view.getUint8(offset++);
	let name;
	[name, offset] = parseWord(view, offset);
	return [
		{ id: playerId, name, statusEffects: [], finished: false, progress: 0 },
		offset,
	];
}

function parseEffectId(view: DataView, offset: number): [PowerupId, number] {
	return parseU8(view, offset) as [PowerupId, number];
}

function parseU8(view: DataView, offset: number): [number, number] {
	return [view.getUint8(offset), 1];
}

function parseU32(view: DataView, offset: number): [number, number] {
	return [view.getUint32(offset), 4];
}

function parseList<T>(
	view: DataView,
	offset: number,
	parser: (arg0: DataView, arg1: number) => [T, number],
	counter: (arg0: DataView, arg1: number) => [number, number] = parseU8
): [T[], number] {
	const arr = [] as T[];
	let count;
	[count, offset] = counter(view, offset);
	let item;
	for (let i = 0; i < count; i++) {
		[item, offset] = parser(view, offset);
		arr.push(item);
	}
	return [arr, offset];
}

function parseServerMessage(buffer: ArrayBuffer): ServerMessage {
	const view = new DataView(buffer);
	let offset = 0;

	const opcode = view.getUint8(offset++);

	switch (opcode) {
		case ServerOp.HubHello:
			// No content
			return { opcode };

		case ServerOp.LobbyHello: {
			const playerId = view.getUint8(offset++);
			const timeLeft = view.getUint16(offset);
			offset += 2;
			let players;
			[players, offset] = parseList(view, offset, parsePlayer);
			let words;
			[words, offset] = parseList(view, offset, parseWord, parseU32);
			let powerups;
			[powerups, offset] = parseList(view, offset, parseEffectId);
			return { players, opcode, words, timeLeft, playerId, powerups };
		}

		case ServerOp.NewPlayer: {
			let player;
			[player, offset] = parsePlayer(view, offset);
			return { ...player, opcode };
		}

		case ServerOp.PlayerFinished: {
			const playerId = view.getUint8(offset++);
			const place = view.getUint8(offset++);
			return { opcode, id: playerId, place };
		}

		case ServerOp.ProgressUpdate: {
			const playerId = view.getUint8(offset++);
			const progress = view.getUint32(offset, false);
			offset += 4;
			return { opcode, playerId, progress };
		}

		case ServerOp.StartGame: {
			return { opcode };
		}

		case ServerOp.StatusChanged: {
			const playerId = view.getUint8(offset++);
			let statusEffects;
			[statusEffects, offset] = parseList(view, offset, parseEffectId);
			return { opcode, statusEffects, playerId };
		}

		case ServerOp.PurchaseResult: {
			const powerupId = view.getUint8(offset++) as PowerupId;
			const success = view.getUint8(offset++) === 1;
			return { opcode, powerupId, success };
		}

		case ServerOp.UpdateWords: {
			const startIndex = view.getUint32(offset);
			offset += 4;
			let words;
			[words, offset] = parseList(view, offset, parseWord);
			return { opcode, startIndex, words };
		}

		default:
			throw new Error("Unknown opcode: " + opcode);
	}
}

export type Socket = {
	socket: WebSocket;
	lowlevel: {
		onMessage: (arg0: (arg0: ServerMessage) => void) => void;
		send: (arg0: ClientMessage) => void;
	};
	event: {
		onHubHello: (arg0: (arg0: HubHello) => void) => void;
		onLobbyHello: (arg0: (arg0: LobbyHello) => void) => void;
		onNewPlayer: (arg0: (arg0: NewPlayer) => void) => void;
		onProgressUpdate: (arg0: (arg0: ProgressUpdate) => void) => void;
		onPlayerFinished: (arg0: (arg0: PlayerFinished) => void) => void;
		onStartGame: (arg0: (arg0: StartGame) => void) => void;
		onStatusChanged: (arg0: (arg0: StatusChanged) => void) => void;
		onPurchaseResult: (arg0: (arg0: PurchaseResult) => void) => void;
		onUpdateWords: (arg0: (arg0: UpdateWords) => void) => void;
	};
	sendRegister: (name: string) => void;
	sendSubmit: (idx: number) => void;
	sendSkip: () => void;
	sendSelect: (arg0: PowerupId[]) => void;
	sendPurchase: (arg0: Purchase) => void;
};

async function connect_raw(url: string): Promise<Socket> {
	const socket = new WebSocket(url);
	socket.binaryType = "arraybuffer";

	socket.addEventListener("message", (event) => {
		console.log(parseServerMessage(event.data));
	});

	function callIfOpCode<T extends ServerMessage>(
		handler: (arg0: T) => void,
		code: (typeof ServerOp)[keyof typeof ServerOp]
	) {
		socket.addEventListener("message", (event: MessageEvent<any>) => {
			const message = parseServerMessage(event.data);
			if (message.opcode != code) return;
			handler(message as T);
		});
	}

	return {
		socket,
		lowlevel: {
			onMessage: (handler: (arg0: ServerMessage) => void) => {
				socket.addEventListener("message", (event: MessageEvent<any>) =>
					handler(parseServerMessage(event.data))
				);
			},
			send: (message: ClientMessage) => {
				socket.send(serializeClientMessage(message));
			},
		},
		event: {
			onHubHello: (handler: (arg0: HubHello) => void) =>
				callIfOpCode(handler, ServerOp.HubHello),
			onLobbyHello: (handler: (arg0: LobbyHello) => void) =>
				callIfOpCode(handler, ServerOp.LobbyHello),
			onNewPlayer: (handler: (arg0: NewPlayer) => void) =>
				callIfOpCode(handler, ServerOp.NewPlayer),
			onStartGame: (handler: (arg0: StartGame) => void) =>
				callIfOpCode(handler, ServerOp.StartGame),
			onProgressUpdate: (handler: (arg0: ProgressUpdate) => void) =>
				callIfOpCode(handler, ServerOp.ProgressUpdate),
			onPlayerFinished: (handler: (arg0: PlayerFinished) => void) =>
				callIfOpCode(handler, ServerOp.PlayerFinished),
			onStatusChanged: (handler: (arg0: StatusChanged) => void) =>
				callIfOpCode(handler, ServerOp.StatusChanged),
			onPurchaseResult: (handler: (arg0: PurchaseResult) => void) =>
				callIfOpCode(handler, ServerOp.PurchaseResult),
			onUpdateWords: (handler: (arg0: UpdateWords) => void) =>
				callIfOpCode(handler, ServerOp.UpdateWords),
		},
		sendRegister: (name: string) => {
			socket.send(
				serializeClientMessage({ opcode: ClientOp.Register, name })
			);
		},
		sendSubmit: (idx: number) => {
			socket.send(
				serializeClientMessage({ opcode: ClientOp.Submit, idx })
			);
		},
		sendSkip: () => {
			socket.send(serializeClientMessage({ opcode: ClientOp.SkipWait }));
		},
		sendSelect: (selectedPowerups: PowerupId[]) => {
			socket.send(
				serializeClientMessage({
					opcode: ClientOp.SelectPowerup,
					selectedPowerups,
				})
			);
		},
		sendPurchase: (purchase: Purchase) => {
			socket.send(
				serializeClientMessage({
					opcode: ClientOp.PurchasePowerup,
					...purchase,
				})
			);
		},
	};
}

export async function connect(): Promise<Socket> {
	// const proto = (window.location.protocol == "http:") ? "ws://" : "wss://"
	// return await connect_raw(`${proto}${window.location.host}/ws\?name=${name}`)
	return await connect_raw("ws://127.0.0.1:8080/ws");
}
