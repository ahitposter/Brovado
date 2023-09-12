import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";
import { GetUserAddress } from "../../utils/Authentication";
import { v4 as uuidv4 } from "uuid";

const Chat = ({ selectedChatRoom, ws, isWsReady }) => {
    const [messages, setMessages] = useState([]);
    const [messageContent, setMessageContent] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const messagesContainerRef = useRef(null);
    const secondLastMessageRef = useRef(null);

    const isInputDisabled = () => {
        const lastThreeMessages = messages.slice(-3);
        return (
            selectedChatRoom !== GetUserAddress() &&
            lastThreeMessages.every(
                (message) => message.sendingUserId === GetUserAddress()
            )
        );
    };

    const isLastMessageVisible = () => {
        if (secondLastMessageRef.current && messagesContainerRef.current) {
            const messageRect =
                secondLastMessageRef.current.getBoundingClientRect();
            const containerRect =
                messagesContainerRef.current.getBoundingClientRect();
            return (
                messageRect.bottom <= containerRect.bottom &&
                messageRect.top >= containerRect.top
            );
        }
        return false;
    };

    useEffect(() => {
        if (isLastMessageVisible()) {
            secondLastMessageRef.current?.scrollIntoView({
                behavior: "smooth",
            });
        }
    }, [messages]);

    useEffect(() => {
        if (!isLoading) {
            secondLastMessageRef.current?.scrollIntoView({
                behavior: "instant",
            });
        }
    }, [isLoading]);

    useEffect(() => {
        if (!isWsReady) {
            return;
        }
        setIsLoading(true);

        ws.send(
            JSON.stringify({
                action: "requestMessages",
                chatRoomId: selectedChatRoom,
                pageStart: null,
            })
        );

        ws.onmessage = (e) => {
            if (e.data instanceof Blob) {
                return;
            }
            const data = JSON.parse(e.data);
            if (data.type === "messages") {
                setMessages(data.messages.slice().reverse());
                setIsLoading(false);
            }
            if (data.type === "receivedMessage") {
                if (data.chatRoomId === selectedChatRoom) {
                    setMessages((prevMessages) => [...prevMessages, data]);
                }
            }
        };
    }, [selectedChatRoom, isWsReady]);

    const sendMessage = () => {
        const currentMessage = messageContent[selectedChatRoom] || "";
        if (!currentMessage) {
            return;
        }

        const clientMessageId = uuidv4();
        const payload = {
            action: "sendMessage",
            text: currentMessage,
            imagePaths: [],
            chatRoomId: selectedChatRoom,
            clientMessageId,
        };

        ws.send(JSON.stringify(payload));
        setMessageContent((prevState) => ({
            ...prevState,
            [selectedChatRoom]: "",
        }));
    };

    return (
        <div className="chat-container">
            {isLoading ? (
                <div className="loading">Loading...</div>
            ) : (
                <div className="messages" ref={messagesContainerRef}>
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            ref={
                                index === messages.length - 2
                                    ? secondLastMessageRef
                                    : null
                            }
                            className={`message ${
                                message.sendingUserId === GetUserAddress()
                                    ? "mine"
                                    : "others"
                            }`}
                        >
                            {message.sendingUserId !== GetUserAddress() && (
                                <img
                                    src={message.twitterPfpUrl}
                                    alt={message.twitterName}
                                />
                            )}
                            <div className="message-content">
                                <div className="message-text">
                                    {message.text}
                                </div>
                                <div className="message-time">
                                    {new Date(
                                        message.timestamp
                                    ).toLocaleTimeString()}
                                </div>
                            </div>
                            {message.sendingUserId === GetUserAddress() && (
                                <img
                                    src={message.twitterPfpUrl}
                                    alt={message.twitterName}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
            <div
                className={`message-input ${
                    isInputDisabled() ? "disabled" : ""
                }`}
            >
                <input
                    type="text"
                    value={
                        isInputDisabled()
                            ? "You may send a maximum of 3 messages before the key owner responds"
                            : messageContent[selectedChatRoom] || ""
                    }
                    onChange={(e) =>
                        setMessageContent((prevState) => ({
                            ...prevState,
                            [selectedChatRoom]: e.target.value,
                        }))
                    }
                    disabled={isInputDisabled()}
                />
                <button onClick={sendMessage} disabled={isInputDisabled()}>
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;