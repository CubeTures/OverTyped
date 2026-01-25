package main

import (
	"errors"
	"fmt"
	"log"
	"net"
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	id   byte
	name string

	conn *websocket.Conn

	hub *Hub

	lobbyWrite chan ServerMessage

	lobbyMsgWrite chan LobbyClientMessage
	lobbyRead     chan ClientLobbyMessage

	unregister chan *Client
	words      []string

	// room things
	done   bool
	closed bool
}

func (c *Client) readPump() {
	stateHandlerDone := make(chan struct{})
	msgs := make(chan ClientMessage)
	go c.stateHandler(stateHandlerDone, msgs)

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

		msgs <- clientMessage
	}

	c.log("unregistering")

	c.closed = true
	close(c.lobbyWrite)
	close(stateHandlerDone)

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

func (c *Client) stateHandler(done chan struct{}, msgs chan ClientMessage) {
	waitingForSpace := false

	// typing state
	wordlistIdx := 0     // index into word list
	wordIdx := 0 // index into current word

	// status effect states
	var (
		powerups         [PowerupCount]bool
		usedPowerups     [PowerupCount]bool
		statusEffects    [PowerupCount]bool
		powerupsSelected bool = false
	)

	// status effect timers
	// start really long, then stop them later to reset to actual duration
	fogTimer := time.NewTimer(time.Hour)
	tireBootTimer := time.NewTimer(time.Hour)
	rearViewMirrorTimer := time.NewTimer(time.Hour)

	for {
		select {

		case msg := <-msgs:
			switch msg := msg.(type) {
			case *RegisterMessage:

			case *SkipWaitMessage:
				c.lobbyRead <- ClientLobbySkipWait{}

			case *SelectPowerupsMessage:
				if powerupsSelected && len(msg.PowerupIDs) != 2 {
					continue
				}
				powerupsSelected = true
				for _, id := range msg.PowerupIDs {
					powerups[id] = true
				}

			case *PowerupPurchaseMessage:
				pid := msg.PowerupID
				if !powerups[pid] || usedPowerups[pid] {
					continue
				}
				usedPowerups[pid] = true
				c.lobbyRead <- ClientLobbyApplyStatusEffect{
					affectedClientId: msg.Affected,
					powerupId:        msg.PowerupID,
				}

			case *SubmissionMessage:
				answerCharacter := msg.Answer

				if answerCharacter == '\b' && wordIdx > 0 {
					wordIdx--
					continue
				}

				if waitingForSpace {
					if answerCharacter == ' ' {
						wordIdx = 0
						wordlistIdx++
						c.lobbyRead <- ClientLobbyProgressUpdate{
							clientId: c.id,
							idx:      wordlistIdx,
						}
						waitingForSpace = false
					}
					continue
				}

				// correct letter
				if answerCharacter == c.words[wordlistIdx][wordIdx] {
					wordIdx++

					// finished test
					if wordIdx == len(c.words[wordlistIdx]) && wordlistIdx == len(c.words) {
						c.lobbyRead <- ClientLobbyFinished{
							clientId: c.id,
						}
						continue
					}

					// finished word
					if wordIdx == len(c.words[wordlistIdx]) {
						waitingForSpace = true
					}
				}
			}

		case msg := <-c.lobbyMsgWrite:
			switch msg := msg.(type) {
			case LobbyClientApplyStatusEffect:
				statusEffects[msg.powerupId] = true
				c.lobbyRead <- ClientLobbyStatusChanged{
					clientId:   c.id,
					powerupIds: getPowerups(statusEffects),
				}

				switch PowerupId(msg.powerupId) {
				case PowerupCount:

				case PowerupFog:
					fogTimer.Stop()
					fogTimer.Reset(fogDuration * time.Second)
				case PowerupIcyRoads:
				case PowerupRearViewMirror:
					rearViewMirrorTimer.Stop()
					rearViewMirrorTimer.Reset(rearViewMirrorDuration * time.Second)
				case PowerupScrambler:
				case PowerupSpikeStrip:
				case PowerupStickShift:
				case PowerupTireBoot:
					tireBootTimer.Stop()
					tireBootTimer.Reset(tireBootDuration * time.Second)
				}
			}

		case <-fogTimer.C:
			statusEffects[PowerupFog] = false
			c.lobbyRead <- ClientLobbyStatusChanged{
				clientId:   c.id,
				powerupIds: getPowerups(statusEffects),
			}
		case <-tireBootTimer.C:
			statusEffects[PowerupTireBoot] = false
			c.lobbyRead <- ClientLobbyStatusChanged{
				clientId:   c.id,
				powerupIds: getPowerups(statusEffects),
			}
		case <-rearViewMirrorTimer.C:
			statusEffects[PowerupRearViewMirror] = false
			c.lobbyRead <- ClientLobbyStatusChanged{
				clientId:   c.id,
				powerupIds: getPowerups(statusEffects),
			}

		case <-done:
			return
		}
	}
}

func (c *Client) log(format string, v ...any) {
	log.Printf("client %d: %s", c.id, fmt.Sprintf(format, v...))
}

func getPowerups(statusEffects [PowerupCount]bool) []byte {
	pids := make([]byte, 0, PowerupCount)
	for i, t := range statusEffects {
		if t {
			pids = append(pids, byte(i))
		}
	}
	return pids
}
