import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";
import {
    GetUserAddress,
    TrimQuotes,
    ConvertUrlsToLinks,
} from "../../utils/helpers";
import { v4 as uuidv4 } from "uuid";
import { FaImage } from "react-icons/fa";

const Chat = ({
    selectedChatRoom,
    ws,
    isWsReady,
    messages,
    setMessages,
    holdings,
    setHoldings,
}) => {
    const [messageContent, setMessageContent] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const messagesContainerRef = useRef(null);
    const secondLastMessageRef = useRef(null);
    const [showZoomedImage, setShowZoomedImage] = useState(null);
    const [replyingTo, setReplyingTo] = useState({});
    const [nextPageStart, setNextPageStart] = useState(null);
    const [loadedImagesCount, setLoadedImagesCount] = useState(0);
    const [showSpinner, setShowSpinner] = useState(false);
    const [attachedImages, setAttachedImages] = useState({});
    const [dragging, setDragging] = useState(false);

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const imagePromises = files.map((file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
            });
        });

        Promise.all(imagePromises).then((images) => {
            setAttachedImages((prev) => ({
                ...prev,
                [selectedChatRoom]: [
                    ...(prev[selectedChatRoom] || []),
                    ...images,
                ],
            }));
        });
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        handleImageUpload({ target: { files: e.dataTransfer.files } });
    };

    const handlePaste = (e) => {
        const { items } = e.clipboardData;
        const files = [];
        for (let index in items) {
            const item = items[index];
            if (item.kind === "file") {
                files.push(item.getAsFile());
            }
        }
        handleImageUpload({ target: { files } });
    };

    const removeImage = (index) => {
        setAttachedImages((prev) => {
            const newImages = [...prev[selectedChatRoom]];
            newImages.splice(index, 1);
            return { ...prev, [selectedChatRoom]: newImages };
        });
    };

    const handleImageLoad = () => {
        setLoadedImagesCount((prevCount) => prevCount + 1);
    };

    const totalImages = messages.reduce(
        (acc, message) =>
            acc + (message.imageUrls ? message.imageUrls.length : 0),
        0
    );

    useEffect(() => {
        if (loadedImagesCount === totalImages && totalImages > 0) {
            setIsLoading(false);
        }
    }, [loadedImagesCount, totalImages]);

    const handleReply = (message) => {
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
        const lastThreeMessages = messages.slice(0, 3);
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
                messageRect.top >= containerRect.top &&
                messageRect.bottom <= containerRect.bottom
            );
        }
        return false;
    };

    useEffect(() => {
        if (messagesContainerRef.current) {
            let lastPageStart = null;
            const handleScroll = (e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.target;
                const atTop = scrollTop <= -(scrollHeight - clientHeight) + 5;

                if (atTop && nextPageStart && nextPageStart !== lastPageStart) {
                    lastPageStart = nextPageStart;
                    setIsLoading(true);
                    ws.send(
                        JSON.stringify({
                            action: "requestMessages",
                            chatRoomId: selectedChatRoom,
                            pageStart: nextPageStart,
                        })
                    );
                }
            };

            messagesContainerRef.current.addEventListener(
                "scroll",
                handleScroll
            );

            return () => {
                if (messagesContainerRef.current) {
                    messagesContainerRef.current.removeEventListener(
                        "scroll",
                        handleScroll
                    );
                }
            };
        }
    }, [messages]);

    useEffect(() => {
        if (!isWsReady) {
            return;
        }

        setMessages([]);
        setLoadedImagesCount(0);
        setIsLoading(true);
        setNextPageStart(null);

        ws.send(
            JSON.stringify({
                action: "requestMessages",
                chatRoomId: selectedChatRoom,
            })
        );

        console.log("requesting 2");
        updateLastRead(selectedChatRoom);

        ws.onmessage = (e) => {
            if (e.data instanceof Blob) {
                return;
            }
            const data = JSON.parse(e.data);
            if (data.type === "messages") {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    ...data.messages.slice(),
                ]);
                setNextPageStart(data.nextPageStart);
                // only set isloading flase if there were no images to load
                const newImages = data.messages.reduce(
                    (acc, message) =>
                        acc +
                        (message.imageUrls ? message.imageUrls.length : 0),
                    0
                );
                if (newImages == 0) {
                    setIsLoading(false);
                }
            }
            if (data.type === "receivedMessage") {
                if (data.chatRoomId === selectedChatRoom) {
                    setMessages((prevMessages) => [data, ...prevMessages]);
                    if (isLastMessageVisible()) {
                        setTimeout(() => {
                            secondLastMessageRef.current?.scrollIntoView({
                                behavior: "smooth",
                            });
                        }, 0);
                    } else {
                        resetScrollPos();
                    }
                }
                updateHoldings(data);
            }
            if (data.type === "chatMessageResponse") {
                setShowSpinner(false);
            }
        };
    }, [selectedChatRoom, isWsReady]);

    const updateLastRead = (chatRoomId) => {
        let shallow = [...holdings];
        const idx = shallow.findIndex((n) => n.chatRoomId === chatRoomId);
        if (idx === -1) {
            return;
        }
        const holding = shallow[idx];
        holding.lastRead = Date.now();
        shallow[idx] = holding;
        setHoldings(shallow);
    };

    const updateHoldings = (message) => {
        let shallow = [...holdings];
        const idx = shallow.findIndex(
            (n) => n.chatRoomId === message.chatRoomId
        );
        if (idx === -1) {
            return;
        }
        const holding = shallow[idx];
        holding.lastMessageName = message.twitterName;
        holding.lastMessageText = message.text;
        holding.lastMessageTime = message.timestamp;
        if (message.chatRoomId === selectedChatRoom) {
            holding.lastRead = Date.now();
        }

        shallow[idx] = holding;
        setHoldings(shallow);
    };

    const resetScrollPos = () => {
        if (messagesContainerRef.current) {
            const oldScrollTop = messagesContainerRef.current.scrollTop;
            const oldScrollHeight = messagesContainerRef.current.scrollHeight;

            setTimeout(() => {
                const newScrollHeight =
                    messagesContainerRef.current.scrollHeight;
                const heightDifference = newScrollHeight - oldScrollHeight;
                messagesContainerRef.current.scrollTop =
                    oldScrollTop - heightDifference;
            }, 0);
        }
    };

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
            replyingToMessageId: replyingTo[selectedChatRoom]?.messageId,
            clientMessageId,
        };

        ws.send(JSON.stringify(payload));
        setMessageContent((prevState) => ({
            ...prevState,
            [selectedChatRoom]: "",
        }));
        handleCancelReply();
        setShowSpinner(true);
    };

    const ReplyCard = ({ message, isMyMessage }) => {
        return (
            <div className="reply-card">
                <img
                    className="reply-card-img"
                    src={message.twitterPfpUrl}
                    alt={message.twitterName}
                />
                <div className="reply-content">
                    <span className="reply-name">{message.twitterName}</span>
                    <span
                        className="reply-text"
                        dangerouslySetInnerHTML={{
                            __html: ConvertUrlsToLinks(
                                TrimQuotes(message.text),
                                message.sendingUserId === GetUserAddress()
                            ),
                        }}
                    />
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

    return (
        <div className="chat-container">
            {messages.length == 0 && isLoading && (
                <div className="loading">Loading...</div>
            )}
            <div className="messages" ref={messagesContainerRef}>
                {messages.map((message, index) => (
                    <div
                        key={index}
                        ref={index === 2 ? secondLastMessageRef : null}
                        className={`message ${
                            message.sendingUserId === GetUserAddress()
                                ? "mine"
                                : "others"
                        }`}
                    >
                        {message.sendingUserId !== GetUserAddress() && (
                            <img
                                className="message-pfp"
                                src={message.twitterPfpUrl}
                                alt={message.twitterName}
                            />
                        )}
                        <div className="message-content">
                            <div className="message-sender-reply">
                                <span className="message-sender">
                                    {TrimQuotes(message.twitterName)}
                                </span>
                                {selectedChatRoom === GetUserAddress() &&
                                    message.sendingUserId !==
                                        GetUserAddress() && (
                                        <img
                                            className="reply-arrow"
                                            src={`${process.env.PUBLIC_URL}/replyArrow.svg`}
                                            alt="Reply"
                                            onClick={() =>
                                                !isInputDisabled() &&
                                                handleReply(message)
                                            }
                                        />
                                    )}
                            </div>

                            {message.replyingToMessage && (
                                <ReplyCard
                                    message={message.replyingToMessage}
                                    isMyMessage={
                                        message.sendingUserId ===
                                        GetUserAddress()
                                    }
                                />
                            )}
                            <div
                                className="message-text"
                                dangerouslySetInnerHTML={{
                                    __html: ConvertUrlsToLinks(
                                        TrimQuotes(message.text),
                                        message.sendingUserId ===
                                            GetUserAddress()
                                    ),
                                }}
                            />
                            {message.imageUrls &&
                                message.imageUrls.map((url, idx) => (
                                    <div
                                        key={idx}
                                        className="image-card"
                                        onClick={() => setShowZoomedImage(url)}
                                    >
                                        <img
                                            className="chat-image"
                                            src={url}
                                            alt="Message Attachment"
                                            onLoad={handleImageLoad}
                                        />
                                    </div>
                                ))}
                            <div className="message-time">
                                {new Date(
                                    message.timestamp
                                ).toLocaleTimeString()}
                            </div>
                        </div>
                        {message.sendingUserId === GetUserAddress() && (
                            <img
                                className="message-pfp"
                                src={message.twitterPfpUrl}
                                alt={message.twitterName}
                            />
                        )}
                    </div>
                ))}
                {showZoomedImage && (
                    <div
                        className="zoomed-image-overlay"
                        onClick={() => {
                            setShowZoomedImage(null);
                        }}
                    >
                        <img
                            className="zoomed-image"
                            src={showZoomedImage}
                            alt="Zoomed"
                        />
                    </div>
                )}
                {messages.length > 0 && isLoading && (
                    <div className="loading">Loading...</div>
                )}
            </div>

            {messages.length > 0 ? (
                <div className="input-area">
                    <div className="reply-and-image-container">
                        {replyingTo[selectedChatRoom] && (
                            <ReplyCardWithClose
                                message={replyingTo[selectedChatRoom]}
                            />
                        )}
                        {attachedImages[selectedChatRoom]?.length ? (
                            <div className="image-preview-container">
                                {attachedImages[selectedChatRoom]?.map(
                                    (image, index) => (
                                        <div
                                            key={index}
                                            className="image-preview"
                                        >
                                            <img
                                                src={image}
                                                alt={`Attachment ${index}`}
                                            />
                                            <div
                                                className="remove-image-icon"
                                                onClick={() =>
                                                    removeImage(index)
                                                }
                                            >
                                                X
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : null}
                    </div>
                    <div
                        className={`message-input ${
                            isInputDisabled() ? "disabled" : ""
                        }`}
                    >
                        <textarea
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onPaste={handlePaste}
                            className={`input-textarea ${
                                dragging ? "dragging" : ""
                            }`}
                            rows="2"
                            placeholder={
                                replyingTo[selectedChatRoom]
                                    ? "Reply..."
                                    : "Write something..."
                            }
                            value={
                                isInputDisabled()
                                    ? "You can send up to three messages at a time. Please wait for the host to respond before sending more."
                                    : messageContent[selectedChatRoom] || ""
                            }
                            onChange={(e) =>
                                setMessageContent((prevState) => ({
                                    ...prevState,
                                    [selectedChatRoom]: e.target.value,
                                }))
                            }
                            disabled={isInputDisabled()}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                        />
                        {!isInputDisabled() &&
                            (showSpinner ? (
                                <div className="spinner" />
                            ) : (
                                // <div
                                //     className="send-icon"
                                //     onClick={sendMessage}
                                //     // disabled={isInputDisabled}
                                // />
                                <div className="button-group">
                                    <button
                                        className="sendButton"
                                        onClick={sendMessage}
                                        disabled={isInputDisabled()}
                                    >
                                        Send
                                    </button>
                                    <input
                                        type="file"
                                        id="imageInput"
                                        style={{ display: "none" }}
                                        onChange={handleImageUpload}
                                        multiple
                                        accept="image/*"
                                    />
                                    <button
                                        className="addImageButton"
                                        disabled={isInputDisabled()}
                                        onClick={() =>
                                            document
                                                .getElementById("imageInput")
                                                .click()
                                        }
                                    >
                                        {!isInputDisabled() && <FaImage />}
                                    </button>
                                </div>
                            ))}
                        {/* </div> */}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default Chat;
