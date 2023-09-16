import React, { useState, useEffect } from "react";
import HoldingsList from "./components/HoldingsList/HoldingsList";
import Chat from "./components/Chat/Chat";
import "./App.css";
import { GetToken as GetCurrentToken } from "./utils/helpers";
import ReconnectingWebSocket from "reconnecting-websocket";
import Login from "./components/Login/Login";
import Footer from "./components/Footer/Footer";
import jwtDecode from "jwt-decode";
import axios from "axios";
import { GetSharesHeld } from "./utils/web3";

function App() {
    const [selectedChatRoom, setSelectedChatRoom] = useState(null);
    const [ws, setWs] = useState(null);
    const [isWsReady, setIsWsReady] = useState(false);
    const [holdings, setHoldings] = useState([]);
    const [messages, setMessages] = useState([]);
    const [accounts, setAccounts] = useState(null);
    const [loggedInAccount, setLoggedInAccount] = useState(null);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const tokens = JSON.parse(localStorage.getItem("tokens")) || [];
        const storedToken = localStorage.getItem("selectedToken");
        const selectedToken =
            storedToken && storedToken !== "null" ? storedToken : tokens?.[0];

        const fetchUserInfoPromises = tokens.map(async (token) => {
            try {
                if (token?.length === 0) {
                    return null;
                }
                const decoded = jwtDecode(token);
                const response = await axios.get(
                    `https://prod-api.kosetto.com/users/${decoded.address}`,
                    {
                        headers: {
                            Authorization: token,
                        },
                    }
                );
                let data = response.data;
                data.token = token;
                data.expires = decoded.exp * 1000;
                // v1: make sure they own my key
                const keysOwned = await GetSharesHeld(
                    "0x86cc6cfc2765e6eef4cdbff5e1e8b9d3a253bd81",
                    decoded.address
                );
                console.log("keysOwned", keysOwned);
                if (keysOwned == 0) {
                    return null;
                }
                return data;
            } catch (error) {
                console.error("User info fetch failed:", error);
                handleError("There was an issue logging you in");
            }
        });

        const loadUsers = async () => {
            Promise.allSettled(fetchUserInfoPromises).then((results) => {
                const users = results
                    .map((obj) => obj.value)
                    ?.filter((n) => n != null);
                const selectedUser = users.find(
                    (n) => n.token === selectedToken
                );
                if (selectedUser) {
                    setLoggedInAccount(selectedUser);
                    setAccounts(users);
                } else {
                    setIsLoading(false);
                }
            });
        };
        if (tokens.length > 0) {
            loadUsers();
        } else {
            setIsLoading(false);
        }
    }, []);

    const handleLogin = async (newToken) => {
        try {
            const decoded = jwtDecode(newToken);
            const response = await axios.get(
                `https://prod-api.kosetto.com/users/${decoded.address}`,
                {
                    headers: {
                        Authorization: newToken,
                    },
                }
            );
            let data = response.data;
            data.token = newToken;
            data.expires = decoded.exp * 1000;

            // v1: make sure they own my key
            const keysOwned = await GetSharesHeld(
                "0x86cc6cfc2765e6eef4cdbff5e1e8b9d3a253bd81",
                decoded.address
            );
            if (keysOwned == 0) {
                handleError("You do not have access");
                setIsLoading(false);
                return;
            }
            setLoggedInAccount(data);
            const newAccs = accounts || [];
            setAccounts([data, ...newAccs]);
        } catch (e) {
            console.error("error logging in", e);
            handleError("There was an issue logging you in");
        }
    };

    useEffect(() => {
        if (loggedInAccount) {
            sessionStorage.setItem("selectedToken", loggedInAccount.token);
            localStorage.setItem("selectedToken", loggedInAccount.token);
            setIsLoading(false);
        }
    }, [loggedInAccount]);

    useEffect(() => {
        if (accounts) {
            localStorage.setItem(
                "tokens",
                JSON.stringify(accounts.map((u) => u.token))
            );
        }
    }, [accounts]);

    useEffect(() => {
        // TODO:
        // authenticate token, prompt login if necessary
        const token = loggedInAccount?.token;
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
    }, [loggedInAccount]);

    const ErrorBar = ({ message, onClose }) => {
        useEffect(() => {
            const timer = setTimeout(() => {
                onClose();
            }, 3000); // 3 seconds

            return () => {
                clearTimeout(timer);
            };
        }, [onClose]);

        return <div className="error-bar">{message}</div>;
    };
    // Use this function to show an error
    const handleError = (message) => {
        setErrorMessage(message);
        setShowError(true);
    };

    // Use this function to hide the error bar
    const handleCloseError = () => {
        setShowError(false);
    };

    return (
        <div className="app-container">
            {showError && (
                <ErrorBar message={errorMessage} onClose={handleCloseError} />
            )}
            {isLoading ? (
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>
            ) : loggedInAccount ? (
                <>
                    <div className="left-section">
                        <HoldingsList
                            loggedInAccount={loggedInAccount}
                            selectedChatRoom={selectedChatRoom}
                            setSelectedChatRoom={setSelectedChatRoom}
                            ws={ws}
                            holdings={holdings}
                            setHoldings={setHoldings}
                        />
                        <Footer
                            accounts={accounts}
                            setAccounts={setAccounts}
                            loggedInAccount={loggedInAccount}
                            setLoggedInAccount={setLoggedInAccount}
                            handleAddAccount={handleLogin}
                        />
                    </div>
                    <div className="right-section">
                        {selectedChatRoom && ws && (
                            <Chat
                                loggedInAccount={loggedInAccount}
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
                </>
            ) : (
                <Login onLogin={handleLogin} />
            )}
        </div>
    );
}

export default App;
