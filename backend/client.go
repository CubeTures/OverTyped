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

	// calculating wpm
	raceStart time.Time
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
		if _, ok := msg.(RaceStartedMessage); ok {
			c.raceStart = time.Now()
		}
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
	c.log("started state Handler")

	// typing state
	idx := 0

	// status effect states
	var (
		powerups         [PowerupCount]bool
		usedPowerups     [PowerupCount]bool
		statusEffects    [PowerupCount]bool
		powerupsSelected bool = false

		// status effect counters
		wordsLeft [PowerupCount]int
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
				c.log("power ups selected: %+v", msg.PowerupIDs)
				if powerupsSelected && len(msg.PowerupIDs) != 2 {
					continue
				}
				powerupsSelected = true
				for _, id := range msg.PowerupIDs {
					powerups[id] = true
				}

			case *PowerupPurchaseMessage:
				c.log("HEREERE")
				pid := msg.PowerupID
				if !powerups[pid] || usedPowerups[pid] {
					c.log("DENIED")
					continue
				}
				usedPowerups[pid] = true
				if pid == byte(PowerupRearViewMirror) {
					c.log("received rear view mirror")
					statusEffects[pid] = true
					continue
				}
				c.log("send status effect to %d", msg.Affected)
				c.lobbyRead <- ClientLobbyApplyStatusEffect{
					affectedClientId: msg.Affected,
					powerupId:        msg.PowerupID,
					fromClientId:     c.id,
				}

			case *SubmissionMessage:
				if msg.Answer == uint32(idx) {
					idx++

					secSpentRacing := float32(time.Since(c.raceStart)) / float32(time.Second)
					wordsCompleted := countCharsWithSpaces(wordsEnglish, idx) / 5
					wpm := 60 * float32(wordsCompleted) / secSpentRacing

					c.lobbyRead <- ClientLobbyProgressUpdate{
						clientId: c.id,
						progress: float32(idx) / float32(len(c.words)),
						wpm:      int(wpm),
					}

					for statusEffect := range wordsLeft {
						if wordsLeft[statusEffect] == 0 {
							continue
						}
						wordsLeft[statusEffect]--
						if wordsLeft[statusEffect] == 0 {
							statusEffects[statusEffect] = false
							c.lobbyRead <- ClientLobbyStatusChanged{
								clientId:   c.id,
								powerupIds: getPowerups(statusEffects),
							}
						}
					}
				}

				if idx == len(c.words) {
					c.lobbyRead <- ClientLobbyFinished{
						clientId: c.id,
					}
				}
			}

		case msg := <-c.lobbyMsgWrite:
			switch msg := msg.(type) {
			case LobbyClientApplyStatusEffect:
				c.log("Recieved power up %d", msg.powerupId)
				if statusEffects[PowerupRearViewMirror] {
					c.lobbyRead <- ClientLobbyApplyStatusEffect{
						affectedClientId: msg.fromClientId,
						powerupId:        msg.powerupId,
						fromClientId:     c.id,
					}
					statusEffects[PowerupRearViewMirror] = false
					c.lobbyRead <- ClientLobbyStatusChanged{
						clientId:   c.id,
						powerupIds: getPowerups(statusEffects),
					}

					rearViewMirrorTimer.Stop()
					<-rearViewMirrorTimer.C // drain

					continue
				}
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
					c.words = RepeatCharsRange(c.words, powerupOffset, wordsIced)
					c.lobbyWrite <- UpdateWordsMessage{
						idx:   uint32(idx + 1),
						words: c.words,
					}
					wordsLeft[PowerupIcyRoads] = wordsIced

				case PowerupRearViewMirror:
					rearViewMirrorTimer.Stop()
					rearViewMirrorTimer.Reset(rearViewMirrorDuration * time.Second)

				case PowerupScrambler:
					c.words = ScrambleRange(c.words, powerupOffset, wordsScrambled)
					c.lobbyWrite <- UpdateWordsMessage{
						idx:   uint32(idx + 1),
						words: c.words,
					}
					wordsLeft[PowerupScrambler] = wordsScrambled

				case PowerupSpikeStrip:
					c.words = append(c.words, RandomWords(wordsEnglish, spikeStripWordsAdded)...)
					c.lobbyWrite <- UpdateWordsMessage{
						idx:   uint32(idx + 1),
						words: c.words,
					}
					wordsLeft[PowerupSpikeStrip] = spikeStripWordsAdded

				case PowerupStickShift:
					c.words = ObfuscateRange(c.words, powerupOffset, wordsStickShifted)
					c.lobbyWrite <- UpdateWordsMessage{
						idx:   uint32(idx + 1),
						words: c.words,
					}
					wordsLeft[PowerupStickShift] = wordsStickShifted

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
			c.log("closing state handler")
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
