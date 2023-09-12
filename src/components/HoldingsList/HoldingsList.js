import React, { useState, useEffect } from "react";
import axios from "axios";
import "./HoldingsList.css";
import { GetToken, GetUserAddress, TrimQuotes } from "../../utils/helpers";

const HoldingsList = ({ selectedChatRoom, setSelectedChatRoom }) => {
    const [holdings, setHoldings] = useState([]);
    const [sortOption, setSortOption] = useState("lastMsg");

    useEffect(() => {
        let sortedHoldings = [...holdings];
        if (sortOption === "price") {
            sortedHoldings.sort((a, b) => {
                return parseFloat(b.price) - parseFloat(a.price);
            });
        } else if (sortOption === "lastMsg") {
            sortedHoldings.sort((a, b) => {
                return b.lastMessageTime - a.lastMessageTime;
            });
        }
        setHoldings(sortedHoldings);
    }, [sortOption]);

    const timeSince = (lastMessageTime) => {
        const diff = Date.now() - lastMessageTime;
        const diffMinutes = Math.floor(diff / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d`;
        if (diffHours > 0) return `${diffHours}h`;
        return `${diffMinutes}m`;
    };

    const formatToEth = (value) => {
        return (value / 1e18).toFixed(5);
    };

    useEffect(() => {
        axios
            .get(`https://prod-api.kosetto.com/portfolio/${GetUserAddress()}`, {
                headers: {
                    Authorization: GetToken(),
                },
            })
            .then((res) => {
                setHoldings(res.data.holdings);
                setSelectedChatRoom(res.data.holdings[0]?.chatRoomId || ""); // Select the first chatroom by default
            })
            .catch((err) => {
                console.error("Error fetching holdings:", err);
            });
    }, [setSelectedChatRoom]);

    const isOnline = (lastOnline) => {
        const currentTime = Date.now();
        return currentTime - lastOnline <= 180000; // 3 minutes in milliseconds
    };

    return (
        <div className="holdings-list">
            <div className="holdings-header">
                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="sort-dropdown"
                >
                    <option value="price">Sort by Price</option>
                    <option value="lastMsg">Sort by Last Message</option>
                </select>
            </div>
            {holdings.map((holding, index) => (
                <div
                    key={index}
                    onClick={() => setSelectedChatRoom(holding.chatRoomId)}
                    className={`holding-item ${
                        selectedChatRoom === holding.chatRoomId ? "active" : ""
                    }`}
                >
                    <div className="pfp">
                        <img
                            src={holding.pfpUrl}
                            alt={holding.name}
                            className="pfp image"
                        />
                        <div
                            className={`pfp online-indicator ${
                                isOnline(holding.lastOnline) ? "online" : ""
                            }`}
                        ></div>
                    </div>
                    <div className="user-info">
                        <div className="user-info user-details">
                            <span className="user-info user-name">
                                {holding.name}
                            </span>
                            <span className="user-info last-msg-time">{`${timeSince(
                                holding.lastMessageTime
                            )}`}</span>
                        </div>
                        <div className="user-info last-message">
                            {`${holding.lastMessageName}: ${TrimQuotes(
                                holding.lastMessageText
                            ).substring(0, 50)}${
                                holding.lastMessageText?.length > 50
                                    ? "..."
                                    : ""
                            }`}
                        </div>
                    </div>
                    <div className="key-info">
                        <div className="key-info price">{`${formatToEth(
                            holding.balanceEthValue
                        )} ETH`}</div>
                        <div className="key-info holdings">
                            {`${holding.balance} keys, ${formatToEth(
                                holding.price
                            )} ETH`}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default HoldingsList;
