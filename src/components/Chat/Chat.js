import React, { useState, useEffect } from "react";
import "./Chat.css";

const Chat = ({ chatRoomId }) => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    let websocket;

    useEffect(() => {
        setIsLoading(true); // Set loading state

        // Initialize WebSocket connection
        websocket = new WebSocket(
            `wss://prod-api.kosetto.com?authorization=${localStorage.getItem(
                "token"
            )}`
        );

        websocket.onopen = () => {
            // Request initial messages
            websocket.send(
                JSON.stringify({
                    action: "requestMessages",
                    chatRoomId,
                    pageStart: null,
                })
            );

            // Set up a ping interval every 3 seconds
            const pingInterval = setInterval(() => {
                websocket.send(JSON.stringify({ action: "ping" }));
            }, 3000);

            // Clear the ping interval when WebSocket closes
            websocket.onclose = () => {
                clearInterval(pingInterval);
            };
        };

        websocket.onmessage = (event) => {
            const parsedData = JSON.parse(event.data);
            if (parsedData.type === "messages") {
                setMessages(parsedData.messages);
                setIsLoading(false); // Remove loading state
            } else if (parsedData.type === "receivedMessage") {
                setMessages((prevMessages) => [...prevMessages, parsedData]);
            }
        };

        return () => {
            websocket.close(); // Close the WebSocket when the component unmounts
        };
    }, [chatRoomId]);

    return (
        <div className="chat-container">
            {isLoading ? (
                <div className="loading-icon">Loading...</div>
            ) : (
                messages.map((message, index) => (
                    <div
                        key={index}
                        className={`message ${
                            message.sendingUserId === "yourUserId"
                                ? "self"
                                : "other"
                        }`}
                    >
                        <img
                            src={message.twitterPfpUrl}
                            alt={message.twitterName}
                        />
                        <div className="name">{message.twitterName}</div>
                        <div className="text">{message.text}</div>
                        {/* Add timestamp conversion here */}
                    </div>
                ))
            )}
            <div className="send-message-box">
                <input type="text" placeholder="Type a message" />
                <button
                    onClick={() => {
                        /* Add send message logic here */
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;
