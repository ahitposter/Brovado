import React, { useState, useEffect } from "react";
import HoldingsList from "./components/HoldingsList/HoldingsList";
import Chat from "./components/Chat/Chat";
import "./App.css";
import { GetToken } from "./utils/Authentication";

function App() {
    const [selectedChatRoom, setSelectedChatRoom] = useState(null);
    const [ws, setWs] = useState(null);
    const [isWsReady, setIsWsReady] = useState(false);

    useEffect(() => {
        // TODO:
        // authenticate token, prompt login if necessary
        const token = GetToken();
        if (!token) {
            return;
        }
        const ws = new WebSocket(
            `wss://prod-api.kosetto.com?authorization=${token}`
        );
        setWs(ws);

        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ action: "ping" }));
            }
        }, 3000);
        ws.onopen = () => {
            setIsWsReady(true);
        };
        ws.onerror = (e) => {
            console.error("WebSocket error:", e);
        };
        ws.onclose = () => {
            console.log("WebSocket closed");
        };

        return () => {
            clearInterval(pingInterval);
            ws.close();
        };
    }, []);

    return (
        <div className="App">
            <div className="left-section">
                <HoldingsList
                    selectedChatRoom={selectedChatRoom}
                    setSelectedChatRoom={setSelectedChatRoom}
                />
            </div>
            <div className="right-section">
                {selectedChatRoom && ws && (
                    <Chat
                        selectedChatRoom={selectedChatRoom}
                        ws={ws}
                        isWsReady={isWsReady}
                    />
                )}
            </div>
        </div>
    );
}

export default App;