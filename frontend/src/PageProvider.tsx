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
} from "./lib/comm.ts";
import { connect as socketConnect } from "./lib/comm.ts";

export const CurrentPage = {
	Login: 0,
	Lobby: 1,
	Game: 2,
} as const;

export type CurrentPage = (typeof CurrentPage)[keyof typeof CurrentPage];

type PlayerMap = { [key: number]: Player };

type PageContextType = {
	socket: Socket;
	page: CurrentPage;
	setPage: React.Dispatch<React.SetStateAction<CurrentPage>>;
	players: PlayerMap;
	progress: number;
	statusEffects: StatusEffectId[];
	name: string;
	setName: React.Dispatch<React.SetStateAction<string>>;
	words: string[];
};

const PageContext = createContext<PageContextType | undefined>(undefined);

function connect(
	setSocket: React.Dispatch<React.SetStateAction<Socket>>,
	setPlayers: React.Dispatch<React.SetStateAction<PlayerMap>>,
	setProgress: React.Dispatch<React.SetStateAction<number>>,
	setStatusEffects: React.Dispatch<React.SetStateAction<StatusEffectId[]>>,
	setWords: React.Dispatch<React.SetStateAction<string[]>>,
	setPage: React.Dispatch<React.SetStateAction<CurrentPage>>
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
		});
		socket.event.onNewPlayer((m: NewPlayer) => {
			setPlayers((i) => {
				return { [m.id]: m as Player, ...i };
			});
		});
		socket.event.onPlayerFinished((m: PlayerFinished) => {
			setPlayers((i) => {
				i[m.id].finished = true;
				return i;
			});
		});
		socket.event.onProgressUpdate((m: ProgressUpdate) => {
			setPlayers((i) => {
				i[m.playerId].progress = m.progress;
				return i;
			});
		});
		socket.event.OnStartGame((_: StartGame) => {
			setPage(CurrentPage.Game);
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
	const [progress, setProgress] = useState(0);
	const [statusEffects, setStatusEffects] = useState([] as StatusEffectId[]);
	const [words, setWords] = useState([] as string[]);
	const [name, setName] = useState("");
	useEffect(() => {
		console.log("name: '" + name + "'");
		if (name === "") {
			console.log("empty name");
			return;
		}
		connect(
			setSocket,
			setPlayers,
			setProgress,
			setStatusEffects,
			setWords,
			setPage
		)(name);
		return () => {};
	}, [name]);
	return (
		<PageContext.Provider
			value={{
				socket,
				page,
				setPage,
				players,
				statusEffects,
				progress,
				name,
				setName,
				words,
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
