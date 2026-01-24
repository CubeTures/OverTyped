package main

type ClientLobbyMessage interface {
	clientLobbyMessage()
}

type ClientLobbySkipWait struct {
}

func (ClientLobbySkipWait) clientLobbyMessage() {}

type ClientLobbyProgressUpdate struct {
	clientId byte
	idx      int
}

func (ClientLobbyProgressUpdate) clientLobbyMessage() {}

type ClientLobbyFinished struct {
	clientId byte
}

func (ClientLobbyFinished) clientLobbyMessage() {}
