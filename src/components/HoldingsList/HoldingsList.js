import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./HoldingsList.css";
import { v4 as uuidv4 } from "uuid";
import { FormatToETH, TimeSince, NormalizeMessage } from "../../utils/helpers";
import {
    FaSearch,
    FaSortAmountDown,
    FaStar,
    FaSort,
    FaSortAmountUp,
} from "react-icons/fa";

const HoldingsList = ({
    loggedInAccount,
    selectedChatRoom,
    setSelectedChatRoom,
    ws,
    holdings,
    setHoldings,
}) => {
    const [sortDirection, setSortDirection] = useState(
        () => localStorage.getItem("sortDirection") || "desc"
    );
    const [sortType, setSortType] = useState(
        () => localStorage.getItem("sortType") || "lastMessageTime"
    );
    const [favorites, setFavorites] = useState(() => {
        const savedFavorites = localStorage.getItem("favorites");
        return savedFavorites ? JSON.parse(savedFavorites) : [];
    });
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showSortOptions, setShowSortOptions] = useState(false);
    const sortIconRef = useRef(null);
    const sortOptionsRef = useRef(null);

    useEffect(() => {
        localStorage.setItem("sortDirection", sortDirection);
        localStorage.setItem("sortType", sortType);
        localStorage.setItem("favorites", JSON.stringify(favorites));
    }, [sortDirection, sortType, favorites]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                sortOptionsRef.current &&
                !sortOptionsRef.current.contains(e.target)
            ) {
                setShowSortOptions(false);
            }
        };

        if (showSortOptions) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showSortOptions]);

    const toggleSortOptions = () => {
        setShowSortOptions(!showSortOptions);
    };

    const handleSortSelection = (type) => {
        setSortType(type);
        setShowSortOptions(false);
    };

    const toggleSearch = () => {
        setSearchTerm("");
        setShowSearch(!showSearch);
    };

    const toggleSortDirection = () => {
        if (sortDirection === "desc") {
            setSortDirection("asc");
        } else {
            setSortDirection("desc");
        }
    };

    const toggleFavorite = (e, chatRoomId) => {
        e.stopPropagation();
        setFavorites((prevFavorites) => {
            if (prevFavorites.includes(chatRoomId)) {
                return prevFavorites.filter((fav) => fav !== chatRoomId);
            } else {
                return [...prevFavorites, chatRoomId];
            }
        });
    };

    const myKey = holdings.find(
        (n) => loggedInAccount.address === n.chatRoomId
    );

    const sortedHoldings = () => {
        return holdings
            .filter((n) => {
                if (!searchTerm) {
                    return true;
                }
                return n.name.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .sort((a, b) => {
                const aVal = parseFloat(a[sortType]) || 0;
                const bVal = parseFloat(b[sortType]) || 0;
                return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
            });
    };

    const favoriteHoldings = sortedHoldings().filter(
        (holding) =>
            holding.chatRoomId !== myKey?.chatRoomId &&
            favorites.includes(holding.chatRoomId)
    );
    const allHoldings = sortedHoldings().filter(
        (holding) =>
            holding.chatRoomId !== myKey?.chatRoomId &&
            !favorites.includes(holding.chatRoomId)
    );

    useEffect(() => {
        if (!loggedInAccount) {
            return;
        }
        axios
            .get(
                `https://prod-api.kosetto.com/portfolio/${loggedInAccount.address}`,
                {
                    headers: {
                        Authorization: loggedInAccount.token,
                    },
                }
            )
            .then((res) => {
                if (res.data.holdings?.length) {
                    // select my chatroom || first chatroom by default
                    const firstKey =
                        res.data.holdings.find(
                            (n) => loggedInAccount.address === n.chatRoomId
                        ) || res.data.holdings[0];
                    firstKey.lastRead = Date.now();
                    setHoldings(res.data.holdings);
                    setSelectedChatRoom(firstKey.chatRoomId || ""); // Select the first chatroom by default
                }
            })
            .catch((err) => {
                console.error("Error fetching holdings:", err);
            });
    }, [loggedInAccount]);

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
                    `https://prod-api.kosetto.com/portfolio/${loggedInAccount.address}`,
                    {
                        headers: {
                            Authorization: loggedInAccount.token,
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
                                {TimeSince(holding.lastMessageTime)}
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
                                ? NormalizeMessage(holding.lastMessageText)
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
                            onClick={toggleSortDirection}
                        >
                            {sortDirection === "desc" ? (
                                <FaSortAmountDown />
                            ) : (
                                <FaSortAmountUp />
                            )}
                        </button>
                        <div
                            className="icon-button"
                            ref={sortIconRef}
                            onClick={toggleSortOptions}
                        >
                            <FaSort />
                        </div>
                        {showSortOptions && (
                            <div
                                className="sort-options"
                                ref={sortOptionsRef}
                                style={{
                                    top:
                                        sortIconRef.current.offsetTop +
                                        sortIconRef.current.offsetHeight,
                                }}
                            >
                                <div
                                    onClick={() =>
                                        handleSortSelection("lastMessageTime")
                                    }
                                    className={
                                        sortType === "lastMessageTime"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Sort by Last Message
                                </div>
                                <div
                                    onClick={() => handleSortSelection("price")}
                                    className={
                                        sortType === "price" ? "selected" : ""
                                    }
                                >
                                    Sort by Key Price
                                </div>
                                <div
                                    onClick={() =>
                                        handleSortSelection("balanceEthValue")
                                    }
                                    className={
                                        sortType === "balanceEthValue"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Sort by Holdings Value
                                </div>
                            </div>
                        )}
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
            {favoriteHoldings.length ? (
                <div className="section-title">Favorites</div>
            ) : null}
            {favoriteHoldings?.map((holding, index) => (
                <div
                    key={index}
                    onClick={() => setSelectedChatRoom(holding.chatRoomId)}
                    className={`holding-item ${
                        selectedChatRoom === holding.chatRoomId ? "active" : ""
                    }`}
                >
                    <div
                        className="favorite-icon"
                        onClick={(e) => toggleFavorite(e, holding.chatRoomId)}
                    >
                        {favorites.includes(holding.chatRoomId) ? "★" : "☆"}
                    </div>
                    {holdingItemContents(holding)}
                </div>
            ))}
            {allHoldings.length ? (
                <div className="section-title">All</div>
            ) : null}
            {allHoldings?.map((holding, index) => (
                <div
                    key={index}
                    onClick={() => setSelectedChatRoom(holding.chatRoomId)}
                    className={`holding-item ${
                        selectedChatRoom === holding.chatRoomId ? "active" : ""
                    }`}
                >
                    <div
                        className="favorite-icon"
                        onClick={(e) => toggleFavorite(e, holding.chatRoomId)}
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
