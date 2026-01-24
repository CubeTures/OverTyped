export const Powerup = {} as const;

export type PowerupId = (typeof Powerup)[keyof typeof Powerup];

export const StatusEffect = {} as const;

export type StatusEffectId = (typeof StatusEffect)[keyof typeof StatusEffect];

export const ClientOp = {
	Register: 0,
	Submit: 1,
	SkipWait: 3,
} as const;

export type RegisterMessage = {
	opcode: typeof ClientOp.Register;
	name: string;
};

export type SubmitMessage = {
	opcode: typeof ClientOp.Submit;
	key: string;
};

export type SkipWaitMessage = {
	opcode: typeof ClientOp.SkipWait;
};

export type ClientMessage = RegisterMessage | SubmitMessage | SkipWaitMessage;

export const ServerOp = {
	HubHello: 0,
	LobbyHello: 1,
	NewPlayer: 2,
	StartGame: 3,
	ProgressUpdate: 4,
	PlayerFinished: 5,
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
};

export type ServerMessage =
	| HubHello
	| LobbyHello
	| NewPlayer
	| StartGame
	| ProgressUpdate
	| PlayerFinished;

const textDecoder = new TextDecoder("utf-8");
const textEncoder = new TextEncoder();

function serializeClientMessage(payload: ClientMessage): ArrayBuffer {
	let buffer, view;
	const { opcode } = payload;
	switch (opcode) {
		case ClientOp.Register:
			// payload: { opcode: 0, name: string }
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
			// payload: { opcode: 1, answer: number }
			buffer = new ArrayBuffer(1 + 4); // opcode + answer
			view = new DataView(buffer);
			view.setUint8(0, opcode);
			const encodedKey = textEncoder.encode(payload.key);
			view.setUint8(1, encodedKey[0]);
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

// Helper: parses status effect IDs
function parseStatusEffects(
	view: DataView,
	count: number,
	offset: number
): [StatusEffectId[], number] {
	const arr = [];
	for (let i = 0; i < count; i++) {
		arr.push(view.getUint16(offset, false)); // big-endian
		offset += 2;
	}
	return [arr as StatusEffectId[], offset];
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
			const numPlayers = view.getUint8(offset++);
			const players = [];
			for (let i = 0; i < numPlayers; i++) {
				let parsed;
				[parsed, offset] = parsePlayer(view, offset);
				players.push(parsed);
			}
			const numWords = view.getUint32(offset);
			offset += 4;
			const words = [];
			for (let i = 0; i < numWords; i++) {
				let parsed;
				[parsed, offset] = parseWord(view, offset);
				words.push(parsed);
			}
			return { players, opcode, words, timeLeft, playerId };
		}

		case ServerOp.NewPlayer: {
			let player;
			[player, offset] = parsePlayer(view, offset);
			return { ...player, opcode };
		}

		case ServerOp.PlayerFinished: {
			const playerId = view.getUint8(offset++);
			return { opcode, id: playerId };
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

		default:
			throw new Error("Unknown opcode: " + opcode);
	}
}

/*
// Example usage:
ws.onmessage = function(e) {
    const msg = parseServerMessage(e.data); // e.data is ArrayBuffer
    console.log(msg);
    // ... process msg
};
*/

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
		OnStartGame: (arg0: (arg0: StartGame) => void) => void;
	};
	sendRegister: (name: string) => void;
	sendSubmit: (key: string) => void;
	sendSkip: () => void;
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
			OnStartGame: (handler: (arg0: StartGame) => void) =>
				callIfOpCode(handler, ServerOp.StartGame),
			onProgressUpdate: (handler: (arg0: ProgressUpdate) => void) =>
				callIfOpCode(handler, ServerOp.ProgressUpdate),
			onPlayerFinished: (handler: (arg0: PlayerFinished) => void) =>
				callIfOpCode(handler, ServerOp.PlayerFinished),
		},
		sendRegister: (name: string) => {
			socket.send(
				serializeClientMessage({ opcode: ClientOp.Register, name })
			);
		},
		sendSubmit: (key: string) => {
			socket.send(
				serializeClientMessage({ opcode: ClientOp.Submit, key })
			);
		},
		sendSkip: () => {
			socket.send(serializeClientMessage({ opcode: ClientOp.SkipWait }));
		},
	};
}

export async function connect(): Promise<Socket> {
	// const proto = (window.location.protocol == "http:") ? "ws://" : "wss://"
	// return await connect_raw(`${proto}${window.location.host}/ws\?name=${name}`)
	return await connect_raw("ws://127.0.0.1:8080/ws");
}
