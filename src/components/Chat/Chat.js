import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";
import { GetUserAddress, TrimQuotes } from "../../utils/helpers";
import { v4 as uuidv4 } from "uuid";

const Chat = ({ selectedChatRoom, ws, isWsReady }) => {
    const [messages, setMessages] = useState([]);
    const [messageContent, setMessageContent] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const messagesContainerRef = useRef(null);
    const secondLastMessageRef = useRef(null);
    const [showZoomedImage, setShowZoomedImage] = useState(null);
    const chatAreaRef = useRef(null);
    const [replyingTo, setReplyingTo] = useState({});

    const handleReply = (message) => {
        console.log(replyingTo);
        setReplyingTo((prevState) => ({
            ...prevState,
            [selectedChatRoom]: message,
        }));
    };

    const handleCancelReply = () => {
        setReplyingTo((prevState) => ({
            ...prevState,
            [selectedChatRoom]: null,
        }));
    };

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

    // Inside useEffect that handles scrolling
    useEffect(() => {
        if (isLastMessageVisible()) {
            setTimeout(() => {
                secondLastMessageRef.current?.scrollIntoView({
                    behavior: "smooth",
                });
            }, 100); // 100ms delay
        }
    }, [messages]);

    useEffect(() => {
        if (!isLoading) {
            setTimeout(() => {
                secondLastMessageRef.current?.scrollIntoView({
                    behavior: "instant",
                });
            }, 100); // 100ms delay
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

        console.log(replyingTo);

        const clientMessageId = uuidv4();
        const payload = {
            action: "sendMessage",
            text: currentMessage,
            imagePaths: [],
            chatRoomId: selectedChatRoom,
            replyingToMessageId: replyingTo[selectedChatRoom]?.messageId,
            clientMessageId,
        };

        ws.send(JSON.stringify(payload));
        setMessageContent((prevState) => ({
            ...prevState,
            [selectedChatRoom]: "",
        }));
        handleCancelReply();
    };

    const ReplyCard = ({ message }) => {
        return (
            <div className="reply-card">
                <img
                    className="reply-card-img"
                    src={message.twitterPfpUrl}
                    alt={message.twitterName}
                />
                <div className="reply-content">
                    <span className="reply-name">{message.twitterName}</span>
                    <span className="reply-text">
                        {TrimQuotes(message.text)}
                    </span>
                </div>
            </div>
        );
    };

    const ReplyCardWithClose = ({ message }) => {
        return (
            <div className="reply-card-input">
                <img
                    className="reply-card-img"
                    src={message.twitterPfpUrl}
                    alt={message.twitterName}
                />
                <div className="reply-content">
                    <div className="reply-card-first-line">
                        <span className="reply-name">
                            {message.twitterName}
                        </span>
                        <button
                            className="cancel-reply-button"
                            onClick={handleCancelReply}
                        >
                            X
                        </button>
                    </div>
                    <span className="reply-text">
                        {TrimQuotes(message.text)}
                    </span>
                </div>
            </div>
        );
    };

    const ImageCard = ({ imageUrl }) => {
        const handleImageLoad = () => {
            if (isLastMessageVisible()) {
                secondLastMessageRef.current?.scrollIntoView({
                    behavior: "smooth",
                });
            }
        };

        return (
            <div
                className="image-card"
                onClick={() => setShowZoomedImage(imageUrl)}
            >
                <img
                    className="chat-image"
                    src={imageUrl}
                    alt="Message Attachment"
                    onLoad={handleImageLoad}
                />
            </div>
        );
    };

    const closeZoomedImage = () => {
        setShowZoomedImage(null);
        setTimeout(() => {
            secondLastMessageRef.current?.scrollIntoView({
                behavior: "instant",
            });
        }, 100); // 100ms delay
    };

    return (
        <div className="chat-container" ref={chatAreaRef}>
            {isLoading ? (
                <div className="loading">Loading...</div>
            ) : (
                <>
                    {showZoomedImage ? (
                        <div
                            className="zoomed-image-overlay"
                            onClick={closeZoomedImage}
                        >
                            <img
                                className="zoomed-image"
                                src={showZoomedImage}
                                alt="Zoomed"
                            />
                        </div>
                    ) : (
                        <>
                            <div
                                className="messages"
                                ref={messagesContainerRef}
                            >
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        ref={
                                            index === messages.length - 2
                                                ? secondLastMessageRef
                                                : null
                                        }
                                        className={`message ${
                                            message.sendingUserId ===
                                            GetUserAddress()
                                                ? "mine"
                                                : "others"
                                        }`}
                                    >
                                        {message.sendingUserId !==
                                            GetUserAddress() && (
                                            <img
                                                className="message-pfp"
                                                src={message.twitterPfpUrl}
                                                alt={message.twitterName}
                                            />
                                        )}
                                        <div className="message-content">
                                            <div className="message-sender-reply">
                                                <span className="message-sender">
                                                    {TrimQuotes(
                                                        message.twitterName
                                                    )}
                                                </span>
                                                {selectedChatRoom ===
                                                    GetUserAddress() &&
                                                    message.sendingUserId !==
                                                        GetUserAddress() && (
                                                        <img
                                                            className="reply-arrow"
                                                            src={`${process.env.PUBLIC_URL}/replyArrow.svg`}
                                                            alt="Reply"
                                                            onClick={() =>
                                                                !isInputDisabled() &&
                                                                handleReply(
                                                                    message
                                                                )
                                                            }
                                                        />
                                                    )}
                                            </div>

                                            {message.replyingToMessage && (
                                                <ReplyCard
                                                    message={
                                                        message.replyingToMessage
                                                    }
                                                />
                                            )}
                                            <div className="message-text">
                                                {TrimQuotes(message.text)}
                                            </div>
                                            {message.imageUrls &&
                                                message.imageUrls.map(
                                                    (url, idx) => (
                                                        <ImageCard
                                                            key={idx}
                                                            imageUrl={url}
                                                        />
                                                    )
                                                )}
                                            <div className="message-time">
                                                {new Date(
                                                    message.timestamp
                                                ).toLocaleTimeString()}
                                            </div>
                                        </div>
                                        {message.sendingUserId ===
                                            GetUserAddress() && (
                                            <img
                                                className="message-pfp"
                                                src={message.twitterPfpUrl}
                                                alt={message.twitterName}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="input-area">
                                {replyingTo[selectedChatRoom] && (
                                    <ReplyCardWithClose
                                        message={replyingTo[selectedChatRoom]}
                                    />
                                )}
                                <div
                                    className={`message-input ${
                                        isInputDisabled() ? "disabled" : ""
                                    }`}
                                >
                                    <textarea
                                        rows="2"
                                        placeholder={
                                            replyingTo[selectedChatRoom]
                                                ? "Reply..."
                                                : "Write something..."
                                        }
                                        value={
                                            isInputDisabled()
                                                ? "You may send a maximum of 3 messages before the key owner responds"
                                                : messageContent[
                                                      selectedChatRoom
                                                  ] || ""
                                        }
                                        onChange={(e) =>
                                            setMessageContent((prevState) => ({
                                                ...prevState,
                                                [selectedChatRoom]:
                                                    e.target.value,
                                            }))
                                        }
                                        disabled={isInputDisabled()}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" &&
                                                !e.shiftKey
                                            ) {
                                                e.preventDefault();
                                                sendMessage();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={isInputDisabled()}
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default Chat;
