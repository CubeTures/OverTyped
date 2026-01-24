package main

import (
	"bytes"
	"encoding/binary"
	"fmt"
)

// ---- ServerMessage interface ----
type ServerMessage interface {
	Opcode() byte
	MarshalBinary() ([]byte, error)
}

// ---- Server opcode enum ----
type ServerOpcode byte

const (
	OpcodeHubGreeting         ServerOpcode = 0
	OpcodeLobbyGreeting       ServerOpcode = 1
	OpcodeNewRegisteredPlayer ServerOpcode = 2
	OpcodeRaceStarted         ServerOpcode = 3
	OpcodeProgressUpdate      ServerOpcode = 4
	OpcodePlayerFinished      ServerOpcode = 5
	OpcodeStatusChanged       ServerOpcode = 6
)

// ---- Helper types ----
type Player struct {
	ID   byte
	Name string
}

func (p Player) marshal(buf *bytes.Buffer) error {
	if len(p.Name) > 255 {
		return fmt.Errorf("player name too long")
	}

	buf.WriteByte(p.ID)
	buf.WriteByte(byte(len(p.Name)))
	buf.WriteString(p.Name)
	return nil
}

type Word struct {
	Text string
}

func (w Word) marshal(buf *bytes.Buffer) error {
	if len(w.Text) > 255 {
		return fmt.Errorf("word too long")
	}

	buf.WriteByte(byte(len(w.Text)))
	buf.WriteString(w.Text)
	return nil
}

// ---- Hub Greeting (Opcode 0) ----
type HubGreetingMessage struct{}

func (m HubGreetingMessage) Opcode() byte {
	return byte(OpcodeHubGreeting)
}

func (m HubGreetingMessage) MarshalBinary() ([]byte, error) {
	return []byte{m.Opcode()}, nil
}

// ---- Lobby Greeting (Opcode 1) ----
type LobbyGreetingMessage struct {
	PlayerID byte
	Players  []Player
	Words    []Word
}

func (m LobbyGreetingMessage) Opcode() byte {
	return byte(OpcodeLobbyGreeting)
}

func (m LobbyGreetingMessage) MarshalBinary() ([]byte, error) {
	var buf bytes.Buffer
	buf.WriteByte(m.Opcode())

	buf.WriteByte(m.PlayerID)
	buf.WriteByte(byte(len(m.Players)))

	for _, p := range m.Players {
		if err := p.marshal(&buf); err != nil {
			return nil, err
		}
	}

	if err := binary.Write(&buf, binary.BigEndian, uint32(len(m.Words))); err != nil {
		return nil, err
	}

	for _, w := range m.Words {
		if err := w.marshal(&buf); err != nil {
			return nil, err
		}
	}

	return buf.Bytes(), nil
}

// ---- New Registered Player (Opcode 2) ----
type NewRegisteredPlayerMessage struct {
	Player Player
}

func (m NewRegisteredPlayerMessage) Opcode() byte {
	return byte(OpcodeNewRegisteredPlayer)
}

func (m NewRegisteredPlayerMessage) MarshalBinary() ([]byte, error) {
	var buf bytes.Buffer
	buf.WriteByte(m.Opcode())

	if err := m.Player.marshal(&buf); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

// ---- Race Started (Opcode 3) ----
type RaceStartedMessage struct{}

func (m RaceStartedMessage) Opcode() byte {
	return byte(OpcodeRaceStarted)
}

func (m RaceStartedMessage) MarshalBinary() ([]byte, error) {
	return []byte{m.Opcode()}, nil
}

// ---- Progress Update (Opcode 4) ----
type ProgressUpdateMessage struct {
	PlayerID byte
	Progress uint32
}

func (m ProgressUpdateMessage) Opcode() byte {
	return byte(OpcodeProgressUpdate)
}

func (m ProgressUpdateMessage) MarshalBinary() ([]byte, error) {
	var buf bytes.Buffer
	buf.WriteByte(m.Opcode())
	buf.WriteByte(m.PlayerID)

	if err := binary.Write(&buf, binary.BigEndian, m.Progress); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

// ---- Player Finished (Opcode 5) ----
type PlayerFinishedMessage struct {
	PlayerID byte
}

func (m PlayerFinishedMessage) Opcode() byte {
	return byte(OpcodePlayerFinished)
}

func (m PlayerFinishedMessage) MarshalBinary() ([]byte, error) {
	return []byte{m.Opcode(), m.PlayerID}, nil
}

// ---- Status Changed (Opcode 6) ----
type StatusChangedMessage struct {
	PlayerID        byte
	StatusEffectIDs []uint16
}

func (m StatusChangedMessage) Opcode() byte {
	return byte(OpcodeStatusChanged)
}

func (m StatusChangedMessage) MarshalBinary() ([]byte, error) {
	var buf bytes.Buffer
	buf.WriteByte(m.Opcode())
	buf.WriteByte(m.PlayerID)

	if err := binary.Write(&buf, binary.BigEndian, uint16(len(m.StatusEffectIDs))); err != nil {
		return nil, err
	}

	for _, id := range m.StatusEffectIDs {
		if err := binary.Write(&buf, binary.BigEndian, id); err != nil {
			return nil, err
		}
	}

	return buf.Bytes(), nil
}
