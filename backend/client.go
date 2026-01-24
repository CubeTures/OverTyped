package main

import (
	"errors"
	"fmt"
	"log"
	"net"

	"github.com/gorilla/websocket"
)

type Client struct {
	id   byte
	name string

	conn *websocket.Conn

	hub *Hub

	lobbyWrite chan ServerMessage
	lobbyRead  chan ClientLobbyMessage

	unregister chan *Client

	// room things
	done   bool
	closed bool
}

func (c *Client) readPump() {
	for {
		_, message, err := c.conn.ReadMessage()

		if err != nil {
			c.closed = true
			if websocket.IsCloseError(err,
				websocket.CloseNormalClosure,
				websocket.CloseGoingAway,
				websocket.CloseAbnormalClosure,
			) || errors.Is(err, net.ErrClosed) {
				c.log("Tried to read, websocket closed")
				break
			}
			c.log("error reading message from websocket: %+v", err.Error())
			break
		}

		if c.closed {
			continue
		}

		clientMessage, err := ParseClientMessage(message)

		if err != nil {
			c.log("error parsing client message: %+v", err)
			continue
		}

		c.log("received client message: %d %T",
			clientMessage.Opcode(), clientMessage)

	}

	c.log("unregistering")

	c.closed = true
	close(c.lobbyWrite)

	c.unregister <- c
}

func (c *Client) writePump() {
	for msg := range c.lobbyWrite {
		binaryMsg, err := msg.MarshalBinary()
		if err != nil {
			c.log("error marshaing binary: %+v", err)
			continue
		}

		c.log("sending message: %d", msg.Opcode())

		err = c.conn.WriteMessage(websocket.BinaryMessage, binaryMsg)

		if err != nil {
			if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
				c.log("Tried to write, websocket closed")
				break
			}
			c.log("error writing server message to json %v", err)
			return
		}
	}

	if !c.closed {
		c.conn.WriteMessage(websocket.CloseMessage, []byte{})
	}
	c.log("writePump closed")
}

func (c *Client) log(format string, v ...any) {
	log.Printf("client %d: %s", c.id, fmt.Sprintf(format, v...))
}
