import React, { useState, useEffect } from "react";
import HoldingsList from "./components/HoldingsList/HoldingsList";
import Chat from "./components/Chat/Chat";
import "./App.css";
import { GetToken } from "./utils/helpers";
import ReconnectingWebSocket from "reconnecting-websocket";
import TopHeader from "./components/Header/Header";
import Header from "./components/Header/Header";
import Login from "./components/Login/Login";

function App() {
    const [selectedChatRoom, setSelectedChatRoom] = useState(null);
    const [ws, setWs] = useState(null);
    const [isWsReady, setIsWsReady] = useState(false);
    const [holdings, setHoldings] = useState([]);
    const [messages, setMessages] = useState([]);

    const [tokens, setTokens] = useState([]);
    const [selectedToken, setSelectedToken] = useState(null);

    useEffect(() => {
        const savedTokens = JSON.parse(localStorage.getItem("tokens")) || [];
        const storedToken = sessionStorage.getItem("selectedToken");
        const selected =
            storedToken && storedToken !== "null"
                ? storedToken
                : savedTokens?.[0];

        if (selected) {
            setTokens(savedTokens);
            setSelectedToken(selected);
            sessionStorage.setItem("selectedToken", selected);
        }
    }, []);

    const handleLogin = (newToken) => {
        const newTokens = [...tokens, newToken];
        localStorage.setItem("tokens", JSON.stringify(newTokens));
        sessionStorage.setItem("selectedToken", newToken);
        setTokens(newTokens);
        setSelectedToken(newToken);
    };

    const handleLogout = () => {
        const newTokens = tokens.filter((t) => t !== selectedToken);
        localStorage.setItem("tokens", JSON.stringify(newTokens));
        const newSelected = newTokens[0] || null;
        sessionStorage.setItem("selectedToken", newSelected);
        setTokens(newTokens);
        setSelectedToken(newSelected);
    };

    const handleSwitchUser = (token) => {
        setSelectedToken(token);
        sessionStorage.setItem("selectedToken", token);
    };

    useEffect(() => {
        // TODO:
        // authenticate token, prompt login if necessary
        const token = GetToken();
        if (!token) {
            return;
        }
        const ws = new ReconnectingWebSocket(
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
            setIsWsReady(false);
        };

        return () => {
            clearInterval(pingInterval);
            ws.close();
        };
    }, []);

    return (
        <div className="app-container">
            {selectedToken ? (
                <>
                    <Header
                        tokens={tokens}
                        selectedToken={selectedToken}
                        onSwitchUser={handleSwitchUser}
                        onLogout={handleLogout}
                    />
                    <div className="main-content">
                        <div className="left-section">
                            <HoldingsList
                                selectedChatRoom={selectedChatRoom}
                                setSelectedChatRoom={setSelectedChatRoom}
                                ws={ws}
                                holdings={holdings}
                                setHoldings={setHoldings}
                            />
                        </div>
                        <div className="right-section">
                            {selectedChatRoom && ws && (
                                <Chat
                                    selectedChatRoom={selectedChatRoom}
                                    ws={ws}
                                    isWsReady={isWsReady}
                                    messages={messages}
                                    setMessages={setMessages}
                                    holdings={holdings}
                                    setHoldings={setHoldings}
                                />
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <Login onLogin={handleLogin} />
            )}
        </div>
    );
}

export default App;
