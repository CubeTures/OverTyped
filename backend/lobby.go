package main

import (
	"fmt"
	"log"
	"time"
)

type ClientId = byte

const ClientsPerLobby = 4
const LobbyWait uint16 = 30

type Lobby struct {
	id         int
	register   chan *Client
	unregister chan *Client

	lobbyRead chan ClientLobbyMessage

	clients map[ClientId]*Client

	open   bool
	done   chan struct{}
	closed bool

	hub *Hub

	words []string
}

func newLobby(id int, hub *Hub) *Lobby {
	l := &Lobby{
		id:         id,
		register:   make(chan *Client),
		unregister: make(chan *Client),

		lobbyRead: make(chan ClientLobbyMessage),

		clients: make(map[ClientId]*Client),

		open:   false,
		done:   make(chan struct{}),
		closed: false,

		hub: hub,
	}

	return l
}

func (l *Lobby) clientCount() int {
	return len(l.clients)
}

func (l *Lobby) run() {
	l.log("Running")
}

func (l *Lobby) log(format string, v ...any) {
	log.Printf("lobby %d: %s", l.id, fmt.Sprintf(format, v...))

	l.open = true

	var clientId byte = 0

	startGameTimer := time.NewTimer(time.Duration(LobbyWait) * time.Second)
	timerStart := time.Now()

startGameLoop:
	for {
		select {
		case client := <-l.register:
			if l.clientCount() == ClientsPerLobby {
				l.hub.registerClientQueue <- client
				continue
			}
			client.id = clientId
			clientId++

			remainingTime := uint16(time.Since(timerStart) / time.Second)

			l.registerClient(client, remainingTime)

		case <-startGameTimer.C:
			break startGameLoop

		case msg := <-l.lobbyRead:
			_, ok := msg.(ClientLobbySkipWait)
			if ok {
				break startGameLoop
			}

		case <-l.done:
			l.close()
			return
		}

	}

	l.open = false

	activePlayers := l.clientCount()

	l.log("wait over, starting game")

	// TODO: mayhaps add game timer

	for {
		select {

		case msg := <-l.lobbyRead:
			switch msg := msg.(type) {
			case ClientLobbySkipWait:

			case ClientLobbyProgressUpdate:
				l.broadcast(ProgressUpdateMessage{
					PlayerID: msg.clientId,
					Progress: uint32(msg.idx),
				})

			case ClientLobbyFinished:
				activePlayers--
				l.broadcast(PlayerFinishedMessage{
					PlayerID: msg.clientId,
				})
			}

		case <-l.unregister:
			activePlayers--

		case <-l.done:
			l.close()
			return

		}

		if activePlayers == 0 {
			close(l.done)
		}
	}
}

func (l *Lobby) registerClient(c *Client, timeRemaining uint16) {
	l.broadcast(NewRegisteredPlayerMessage{Player{ID: c.id, Name: c.name}})

	c.unregister = l.unregister
	c.lobbyRead = l.lobbyRead

	go c.readPump()

	c.lobbyWrite <- LobbyGreetingMessage{
		PlayerID:      c.id,
		TimeRemaining: timeRemaining,
		Players:       l.players(),
		Words:         l.words,
	}

	l.clients[c.id] = c

	if l.clientCount() == ClientsPerLobby {
		l.open = false
	}
}

func (l *Lobby) broadcast(msg ServerMessage) {
	for _, c := range l.clients {
		if !c.closed {
			c.lobbyWrite <- msg
		}
	}
}

func (l *Lobby) players() []Player {
	ps := make([]Player, 0, 4)
	for _, c := range l.clients {
		ps = append(ps, Player{ID: c.id, Name: c.name})
	}
	return ps
}

func (l *Lobby) close() {
	l.log("closing")
	for _, client := range l.clients {
		client.conn.Close()
	}
	l.closed = true
}
