import React, { useState, useEffect } from "react";
import axios from "axios";
import "./HoldingsList.css";
import { v4 as uuidv4 } from "uuid";
import {
    FormatToETH,
    GetToken,
    GetUserAddress,
    TrimQuotes,
} from "../../utils/helpers";
import {
    FaSearch,
    FaSortAmountDown,
    FaStar,
    FaSortAmountUp,
} from "react-icons/fa";

const HoldingsList = ({
    selectedChatRoom,
    setSelectedChatRoom,
    ws,
    holdings,
    setHoldings,
}) => {
    const [sortOption, setSortOption] = useState("lastMsg");
    const [favorites, setFavorites] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const toggleSearch = () => {
        setSearchTerm("");
        setShowSearch(!showSearch);
    };

    const toggleSortOption = () => {
        if (sortOption === "price") {
            setSortOption("lastMsg");
        } else {
            setSortOption("price");
        }
    };

    const toggleFavorite = (chatRoomId) => {
        setFavorites((prevFavorites) => {
            if (prevFavorites.includes(chatRoomId)) {
                return prevFavorites.filter((fav) => fav !== chatRoomId);
            } else {
                return [...prevFavorites, chatRoomId];
            }
        });
    };

    const myKey = holdings.find((n) => GetUserAddress() === n.chatRoomId);

    const sortedHoldings = () => {
        return holdings
            .filter((n) => {
                if (!searchTerm) {
                    return true;
                }
                return n.name.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .sort((a, b) => {
                return sortOption === "price"
                    ? parseFloat(b.price) - parseFloat(a.price)
                    : b.lastMessageTime - a.lastMessageTime;
            });
    };

    const timeSince = (lastMessageTime) => {
        const diff = Date.now() - lastMessageTime;
        const diffMinutes = Math.floor(diff / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d`;
        if (diffHours > 0) return `${diffHours}h`;
        return `${diffMinutes}m`;
    };

    useEffect(() => {
        axios
            .get(`https://prod-api.kosetto.com/portfolio/${GetUserAddress()}`, {
                headers: {
                    Authorization: GetToken(),
                },
            })
            .then((res) => {
                if (res.data.holdings?.length) {
                    // select my chatroom || first chatroom by default
                    const firstKey =
                        res.data.holdings.find(
                            (n) => GetUserAddress() === n.chatRoomId
                        ) || res.data.holdings[0];
                    firstKey.lastRead = Date.now();
                    setHoldings(res.data.holdings);
                    setSelectedChatRoom(firstKey.chatRoomId || ""); // Select the first chatroom by default
                }
            })
            .catch((err) => {
                console.error("Error fetching holdings:", err);
            });
    }, []);

    const isOnline = (lastOnline) => {
        const currentTime = Date.now();
        return currentTime - lastOnline <= 180000; // 3 minutes in milliseconds
    };

    const isUnread = (holding) => {
        return holding.lastMessageTime > holding.lastRead;
    };

    const autoMilady = () => {
        sortedHoldings().forEach((h) => {
            const clientMessageId = uuidv4();
            const payload = {
                action: "sendMessage",
                text: "AUTO MILADY!",
                imagePaths: [],
                chatRoomId: h.chatRoomId,
                clientMessageId,
            };
            ws.send(JSON.stringify(payload));
        });
        setTimeout(() => {
            axios
                .get(
                    `https://prod-api.kosetto.com/portfolio/${GetUserAddress()}`,
                    {
                        headers: {
                            Authorization: GetToken(),
                        },
                    }
                )
                .then((res) => {
                    setHoldings(res.data.holdings);
                });
        }, 1000);
    };

    const holdingItemContents = (holding) => {
        return (
            <>
                <div className="pfp">
                    <img
                        src={holding.pfpUrl}
                        alt={holding.name}
                        className="pfp image"
                    />
                    {isUnread(holding) ? (
                        <div className="pfp unread-indicator"></div>
                    ) : null}
                </div>
                <div className="user-info">
                    <div className="user-info user-details">
                        <span className={`user-info user-name`}>
                            {holding.name}
                        </span>
                        {holding.lastMessageTime ? (
                            <span className="user-info last-msg-time">
                                {timeSince(holding.lastMessageTime)}
                            </span>
                        ) : null}
                    </div>

                    <div
                        className={`user-info last-message ${
                            isUnread(holding) ? "unread" : ""
                        }`}
                        lang="de"
                    >
                        {`${holding.lastMessageName}: ${
                            holding.lastMessageText
                                ? TrimQuotes(holding.lastMessageText)
                                : "Sent an image"
                        }`}
                    </div>
                </div>
                <div className="key-info">
                    <div className="key-info price">{`${FormatToETH(
                        holding.price
                    )} ETH`}</div>
                    <div className="key-info holdings">
                        {`${holding.balance} key${
                            holding.balance > 1 ? "s" : ""
                        } held`}
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="holdings-list">
            <div className="holdings-header">
                {!showSearch ? (
                    <>
                        <button className="icon-button" onClick={toggleSearch}>
                            <FaSearch />
                        </button>
                        <button
                            className="icon-button"
                            onClick={toggleSortOption}
                        >
                            {sortOption === "lastMsg" ? (
                                <FaSortAmountDown />
                            ) : (
                                <FaSortAmountUp />
                            )}
                        </button>
                        <button className="icon-button">
                            <FaStar />
                        </button>
                    </>
                ) : (
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button onClick={toggleSearch}>Cancel</button>
                    </div>
                )}
            </div>
            <div className="section-title">Your Key</div>
            {myKey && (
                <div
                    onClick={() => setSelectedChatRoom(myKey.chatRoomId)}
                    className={`holding-item ${
                        selectedChatRoom === myKey.chatRoomId ? "active" : ""
                    }`}
                >
                    {holdingItemContents(myKey)}
                </div>
            )}
            <div className="section-title">Favorites</div>
            {sortedHoldings()
                .filter((h) => favorites.includes(h.chatRoomId))
                ?.map((holding, index) => (
                    <div
                        key={index}
                        onClick={() => setSelectedChatRoom(holding.chatRoomId)}
                        className={`holding-item ${
                            selectedChatRoom === holding.chatRoomId
                                ? "active"
                                : ""
                        }`}
                    >
                        <div
                            className="favorite-icon"
                            onClick={() => toggleFavorite(holding.chatRoomId)}
                        >
                            {favorites.includes(holding.chatRoomId) ? "★" : "☆"}
                        </div>
                        {holdingItemContents(holding)}
                    </div>
                ))}
            <div className="section-title">All</div>
            {sortedHoldings()
                .filter((holding) => {
                    return (
                        holding.chatRoomId !== myKey?.chatRoomId &&
                        !favorites.includes(holding.chatRoomId)
                    );
                })
                .map((holding, index) => (
                    <div
                        key={index}
                        onClick={() => setSelectedChatRoom(holding.chatRoomId)}
                        className={`holding-item ${
                            selectedChatRoom === holding.chatRoomId
                                ? "active"
                                : ""
                        }`}
                    >
                        <div
                            className="favorite-icon"
                            onClick={() => toggleFavorite(holding.chatRoomId)}
                        >
                            {favorites.includes(holding.chatRoomId) ? "★" : "☆"}
                        </div>
                        {holdingItemContents(holding)}
                    </div>
                ))}
        </div>
    );
};

export default HoldingsList;
