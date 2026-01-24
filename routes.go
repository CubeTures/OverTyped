package server

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func Serve() {
	mux := routes()
	port := os.Getenv("LR_PORT")
	if port == "" {
		port = "8080"
	}
	addr := fmt.Sprintf("0.0.0.0:%s", port)
	log.Printf("listening and serving on %s", addr)
	http.ListenAndServe(addr, mux)
}

func routes() *http.ServeMux {
	mux := http.NewServeMux()

	fileServer := http.FileServer(http.Dir("../frontend/dist/"))
	mux.Handle("/", fileServer)

	// // hub := gamelogic.NewHub()
	// // go hub.Run()
	//
	// mux.HandleFunc("/ws", hub.ServeWs)

	return mux
}
