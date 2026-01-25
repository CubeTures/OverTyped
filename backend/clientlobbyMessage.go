package main

type ClientLobbyMessage interface {
	clientLobbyMessage()
}

type ClientLobbySkipWait struct {
}

func (ClientLobbySkipWait) clientLobbyMessage() {}

type ClientLobbyProgressUpdate struct {
	clientId byte
	progress float32
	wpm      int
}

func (ClientLobbyProgressUpdate) clientLobbyMessage() {}

type ClientLobbyFinished struct {
	clientId byte
}

func (ClientLobbyFinished) clientLobbyMessage() {}

type ClientLobbyApplyStatusEffect struct {
	fromClientId     byte
	affectedClientId byte
	powerupId        byte
}

func (ClientLobbyApplyStatusEffect) clientLobbyMessage() {}

type ClientLobbyStatusChanged struct {
	clientId   byte
	powerupIds []byte
}

func (ClientLobbyStatusChanged) clientLobbyMessage() {}

type LobbyClientMessage interface {
	lobbyClientMessage()
}

type LobbyClientApplyStatusEffect struct {
	fromClientId byte
	powerupId    byte
}

func (LobbyClientApplyStatusEffect) lobbyClientMessage() {}
