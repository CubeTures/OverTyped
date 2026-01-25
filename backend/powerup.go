package main

type PowerupId byte

const (
	PowerupSpikeStrip PowerupId = iota
	PowerupStickShift
	PowerupFog
	PowerupIcyRoads
	PowerupTireBoot
	PowerupScrambler
	PowerupRearViewMirror
	PowerupCount
)

const (
	fogDuration            = 10
	tireBootDuration       = 10
	rearViewMirrorDuration = 10
)
