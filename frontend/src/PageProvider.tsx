import React, { createContext, useContext, useEffect, useState } from "react";
import type {
	LobbyHello,
	NewPlayer,
	Player,
	Socket,
	StatusEffectId,
	StartGame,
	PlayerFinished,
	ProgressUpdate,
	PurchaseResult,
	PowerupId,
	UpdateWords,
	StatusChanged,
	Purchase,
} from "./lib/comm.ts";
import { connect as socketConnect } from "./lib/comm.ts";

export const CurrentPage = {
	Login: 0,
	Lobby: 1,
	Game: 2,
} as const;

export type CurrentPage = (typeof CurrentPage)[keyof typeof CurrentPage];

type PlayerMap = { [key: number]: Player };

export type PurchaseSuccess = {
	powerupId: PowerupId;
	success: boolean;
};

type PageContextType = {
	socket: Socket;
	page: CurrentPage;
	setPage: React.Dispatch<React.SetStateAction<CurrentPage>>;
	players: PlayerMap;
	currentPlayer: number;
	name: string;
	setName: React.Dispatch<React.SetStateAction<string>>;
	words: string[];
	powerups: PowerupId[];
	setPowerups: React.Dispatch<React.SetStateAction<PowerupId[]>>;
	purchaseSuccess: PurchaseSuccess;
};

const PageContext = createContext<PageContextType | undefined>(undefined);

function connect(
	setSocket: React.Dispatch<React.SetStateAction<Socket>>,
	setPlayers: React.Dispatch<React.SetStateAction<PlayerMap>>,
	setWords: React.Dispatch<React.SetStateAction<string[]>>,
	setPage: React.Dispatch<React.SetStateAction<CurrentPage>>,
	setPurchaseSuccess: React.Dispatch<React.SetStateAction<PurchaseSuccess>>,
	setCurrentPlayer: React.Dispatch<React.SetStateAction<number>>,
	setPowerups: React.Dispatch<React.SetStateAction<PowerupId[]>>
): (name: string) => Promise<void> {
	return async (name: string) => {
		const socket = await socketConnect();
		socket.event.onHubHello((_) => {
			console.log("received hub hello");
		});
		socket.event.onLobbyHello((m: LobbyHello) => {
			setPlayers((pm) =>
				m.players.reduce<PlayerMap>((a, c) => {
					return { [c.id]: c, ...a };
				}, pm)
			);
			setWords(m.words);
			setPage(CurrentPage.Lobby);
			setCurrentPlayer(m.playerId);
			setPowerups(m.powerups);
		});
		socket.event.onNewPlayer((m: NewPlayer) => {
			setPlayers((i) => {
				return { [m.id]: m as Player, ...i };
			});
		});
		socket.event.onPlayerFinished((m: PlayerFinished) => {
			setPlayers((i) => {
				i[m.id].finished = true;
				return { ...i };
			});
		});
		socket.event.onProgressUpdate((m: ProgressUpdate) => {
			setPlayers((i) => {
				i[m.playerId].progress = m.progress;
				return { ...i };
			});
		});
		socket.event.onStartGame((_: StartGame) => {
			setPage(CurrentPage.Game);
		});
		socket.event.onStatusChanged((m: StatusChanged) => {
			setPlayers((i) => {
				i[m.playerId].statusEffects = m.statusEffects;
				return {...i};
			});
		});
		socket.event.onPurchaseResult((m: PurchaseResult) => {
			setPurchaseSuccess({ powerupId: m.powerupId, success: m.success });
		});
		socket.event.onUpdateWords((m: UpdateWords) => {
			setWords((i) => {
				return i.slice(0, m.startIndex).concat(m.words);
			});
		});
		console.log(socket);
		socket.socket.addEventListener("open", (_) =>
			socket.sendRegister(name)
		);
		socket.socket.addEventListener("close", (_) =>
			setPage(CurrentPage.Login)
		);
		setSocket(socket);
	};
}

export function PageProvider({ children }: { children: React.ReactNode }) {
	const [page, setPage] = useState(CurrentPage.Login as CurrentPage);
	const [socket, setSocket] = useState(null as any);
	const [players, setPlayers] = useState({} as PlayerMap);
	const [words, setWords] = useState([] as string[]);
	const [name, setName] = useState("");
	const [purchaseSuccess, setPurchaseSucces] = useState(
		{} as PurchaseSuccess
	);
	const [powerups, setPowerups] = useState([] as PowerupId[]);
	const [currentPlayer, setCurrentPlayer] = useState(0);
	useEffect(() => {
		console.log("name: '" + name + "'");
		if (name === "") {
			console.log("empty name");
			return;
		}
		connect(
			setSocket,
			setPlayers,
			setWords,
			setPage,
			setPurchaseSucces,
			setCurrentPlayer,
			setPowerups
		)(name);
		return () => {};
	}, [name]);
	useEffect(() => {
		console.log("select effect: ", powerups);
		if (powerups === undefined || powerups.length !== 2) {
			console.log("abort select");
			return;
		}
		socket.sendSelect(powerups);
	}, [powerups]);
	return (
		<PageContext.Provider
			value={{
				socket,
				page,
				setPage,
				players,
				name,
				setName,
				words,
				purchaseSuccess,
				powerups,
				setPowerups,
				currentPlayer,
			}}
		>
			{children}
		</PageContext.Provider>
	);
}

export function usePage() {
	const ctx = useContext(PageContext);
	if (!ctx) throw new Error("usePage must be used within PageProvider");
	return ctx;
}
