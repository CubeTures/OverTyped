package main

import (
	"fmt"
)

// ---- Opcode enum ----
type Opcode byte

const (
	OpcodeRegister        Opcode = 0
	OpcodeSubmission      Opcode = 1
	OpcodePowerupPurchase Opcode = 2
	OpcodeSkipWait        Opcode = 3
)

// ---- ClientMessage interface ----
type ClientMessage interface {
	Opcode() Opcode
	UnmarshalBinary([]byte) error
}

// ---- Register (Opcode 0) ----
type RegisterMessage struct {
	Name string
}

func (m *RegisterMessage) Opcode() Opcode {
	return OpcodeRegister
}

func (m *RegisterMessage) UnmarshalBinary(data []byte) error {
	if len(data) < 1 {
		return fmt.Errorf("register: data too short")
	}

	nameLen := int(data[0])
	if len(data) < 1+nameLen {
		return fmt.Errorf("register: invalid name length")
	}

	m.Name = string(data[1 : 1+nameLen])
	return nil
}

// ---- Submission of a letter (Opcode 1) ----
type SubmissionMessage struct {
	Answer byte
}

func (m *SubmissionMessage) Opcode() Opcode {
	return OpcodeSubmission
}

func (m *SubmissionMessage) UnmarshalBinary(data []byte) error {
	if len(data) != 1 {
		return fmt.Errorf("submission: expected 1 byte, got %d", len(data))
	}

	m.Answer = data[0]
	return nil
}

// ---- Powerup Purchase (Opcode 2) ----
type PowerupPurchaseMessage struct {
	PowerupID byte
	Affected  byte
}

func (m *PowerupPurchaseMessage) Opcode() Opcode {
	return OpcodePowerupPurchase
}

func (m *PowerupPurchaseMessage) UnmarshalBinary(data []byte) error {
	if len(data) != 2 {
		return fmt.Errorf("powerup purchase: expected 2 bytes, got %d", len(data))
	}

	m.PowerupID = data[0]
	m.Affected = data[1]
	return nil
}

// ---- Skip Wait (Opcode 3) ----
type SkipWaitMessage struct{}

func (m *SkipWaitMessage) Opcode() Opcode {
	return OpcodeSkipWait
}

func (m *SkipWaitMessage) UnmarshalBinary(data []byte) error {
	if len(data) != 0 {
		return fmt.Errorf("skip wait: expected no content, got %d bytes", len(data))
	}
	return nil
}

func ParseClientMessage(buf []byte) (ClientMessage, error) {
	if len(buf) < 1 {
		return nil, fmt.Errorf("empty client message")
	}

	op := buf[0]
	payload := buf[1:]

	var msg ClientMessage

	switch Opcode(op) {
	case OpcodeRegister:
		msg = &RegisterMessage{}

	case OpcodeSubmission:
		msg = &SubmissionMessage{}

	case OpcodePowerupPurchase:
		msg = &PowerupPurchaseMessage{}

	case OpcodeSkipWait:
		msg = &SkipWaitMessage{}

	default:
		return nil, fmt.Errorf("unknown client opcode: %d", op)
	}

	if err := msg.UnmarshalBinary(payload); err != nil {
		return nil, err
	}

	return msg, nil
}
