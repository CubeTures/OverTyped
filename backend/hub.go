package main

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var lId int = 0

type Hub struct {
	registerClientQueue chan *Client

	lobby *Lobby
}

func NewHub() *Hub {
	return &Hub{
		registerClientQueue: make(chan *Client),
	}
}

func (h *Hub) Run() {
	log.Println("Hub Started")

	for client := range h.registerClientQueue {
		log.Println("Client Recieved in Hub")

		if h.lobby == nil || !h.lobby.open {
			h.lobby = newLobby(lId, h)
			go h.lobby.run()
			lId++
		}

		h.lobby.register <- client
	}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func (h *Hub) ServeWs(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		w.WriteHeader(http.StatusUpgradeRequired)
		log.Printf("upgrading error: %s\n", err)
		return
	}

	log.Println("New WS Connection")

	c := &Client{
		conn: conn,

		lobbyWrite:    make(chan ServerMessage),
		lobbyMsgWrite: make(chan LobbyClientMessage),
	}

	_, message, err := c.conn.ReadMessage()

	if err != nil {
		c.log("error reading message from websocket: %+v", err.Error())
		return
	}

	clientMessage, err := ParseClientMessage(message)

	if err != nil {
		c.log("error parsing client message: %+v", err)
		return
	}

	if registerMessage, ok := clientMessage.(*RegisterMessage); ok {
		c.name = registerMessage.Name
	} else {
		c.log("incorret first message received from client, expected %d, got %d",
			OpcodeRegister, clientMessage.Opcode())
		return
	}

	log.Println("Register Message Recieved")

	go c.writePump()

	c.lobbyWrite <- HubGreetingMessage{}

	h.registerClientQueue <- c
}
