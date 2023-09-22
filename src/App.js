import React, { useState, useEffect } from "react";
import HoldingsList from "./components/HoldingsList/HoldingsList";
import Chat from "./components/Chat/Chat";
import "./App.css";
import ReconnectingWebSocket from "reconnecting-websocket";
import Login from "./components/Login/Login";
import Footer from "./components/Footer/Footer";
import jwtDecode from "jwt-decode";
import axios from "axios";
import { GetSharesHeld } from "./utils/web3";
import ErrorBoundary from "./components/Errors/ErrorBoundary";
import {
    EthereumClient,
    w3mConnectors,
    w3mProvider,
} from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { base } from "wagmi/chains";
import { useSwipeable } from "react-swipeable";

const chains = [base];
const projectId = "796d520f6d8700dbea3779865fab8dc0";
const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
const wagmiConfig = createConfig({
    autoConnect: true,
    connectors: w3mConnectors({ projectId, chains }),
    publicClient,
});
const ethereumClient = new EthereumClient(wagmiConfig, chains);

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
    const [showRight, setShowRight] = useState(false);

    const BETA = false;

    useEffect(() => {
        const statusBarTheme = document.querySelector("meta[name=theme-color]");
        if (showRight) {
            document.body.classList.add("show-right");
            statusBarTheme?.setAttribute("content", "#ffffff");
        } else {
            document.body.classList.remove("show-right");
            statusBarTheme?.setAttribute("content", "#f2f2f2");
        }
    }, [showRight]);

    const handlers = useSwipeable({
        onSwipedLeft: () => setShowRight(true),
        onSwipedRight: () => setShowRight(false),
        preventDefaultTouchmoveEvent: true,
        trackMouse: false,
    });

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
                data.address = decoded.address;
                data.expires = decoded.exp * 1000;
                if (BETA) {
                    // v1: make sure they own my key
                    const keysOwned = await GetSharesHeld(
                        "0x86cc6cfc2765e6eef4cdbff5e1e8b9d3a253bd81",
                        decoded.address
                    );
                    data.keysOwned = keysOwned;
                }
                return data;
            } catch (error) {
                console.error("User info fetch failed:", error);
                handleError("There was an issue logging you in");
            }
        });

        const loadUsers = async () => {
            Promise.allSettled(fetchUserInfoPromises).then((results) => {
                const uniqueAddresses = new Set();
                const users = results
                    .map((obj) => obj.value)
                    ?.filter((n) => {
                        if (n == null) {
                            return false;
                        }
                        if (!uniqueAddresses.has(n.address)) {
                            uniqueAddresses.add(n.address);
                            return true;
                        }
                        return false;
                    });

                const oneUserHasKey = users?.some((n) => n.keysOwned > 0);
                let selectedUser;
                if ((BETA && oneUserHasKey) || !BETA) {
                    selectedUser = users.find((n) => n.token === selectedToken);
                }
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
            data.address = decoded.address;
            data.expires = decoded.exp * 1000;

            const newAccs = accounts || [];
            // v1: make sure they own my key
            // if they already have another account that has logged in then allow it
            if (BETA) {
                const keysOwned = await GetSharesHeld(
                    "0x86cc6cfc2765e6eef4cdbff5e1e8b9d3a253bd81",
                    decoded.address
                );
                data.keysOwned = keysOwned;
                const oneUserHasKey = newAccs?.some((n) => n.keysOwned > 0);
                if (keysOwned == 0 && !oneUserHasKey) {
                    handleError("You do not have access");
                    setIsLoading(false);
                    return;
                }
            }

            if (newAccs.some((n) => n.address === decoded.address)) {
                handleError("This account is already signed in");
                return;
            }

            setLoggedInAccount(data);
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
        <ErrorBoundary handleError={handleError}>
            <WagmiConfig config={wagmiConfig}>
                <div className="app-container">
                    {showError && (
                        <ErrorBar
                            message={errorMessage}
                            onClose={handleCloseError}
                        />
                    )}
                    {isLoading ? (
                        <div className="spinner-container">
                            <div className="spinner"></div>
                        </div>
                    ) : loggedInAccount ? (
                        <>
                            <div className="left-section" {...handlers}>
                                <HoldingsList
                                    loggedInAccount={loggedInAccount}
                                    selectedChatRoom={selectedChatRoom}
                                    setSelectedChatRoom={setSelectedChatRoom}
                                    chatRoomClicked={() => setShowRight(true)}
                                    ws={ws}
                                    holdings={holdings}
                                    setHoldings={setHoldings}
                                    handleError={handleError}
                                />
                                <Footer
                                    accounts={accounts}
                                    setAccounts={setAccounts}
                                    loggedInAccount={loggedInAccount}
                                    setLoggedInAccount={setLoggedInAccount}
                                    handleLogin={handleLogin}
                                    handleError={handleError}
                                />
                            </div>
                            <div className="right-section" {...handlers}>
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
                                        handleError={handleError}
                                    />
                                )}
                            </div>
                        </>
                    ) : (
                        <Login
                            handleLogin={handleLogin}
                            handleError={handleError}
                        />
                    )}
                </div>
            </WagmiConfig>
            <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
        </ErrorBoundary>
    );
}

export default App;
