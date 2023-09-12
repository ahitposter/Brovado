import React, { useState, useEffect } from "react";
import axios from "axios";
import "./HoldingsList.css";
import { GetToken, GetUserAddress } from "../../utils/Authentication";

const HoldingsList = ({ selectedChatRoom, setSelectedChatRoom }) => {
    const [holdings, setHoldings] = useState([]);

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
            {holdings.map((holding, index) => (
                <div
                    key={index}
                    onClick={() => setSelectedChatRoom(holding.chatRoomId)}
                    className={`holding-item ${
                        selectedChatRoom === holding.chatRoomId ? "active" : ""
                    }`}
                >
                    <div className="pfp-and-status">
                        <img src={holding.pfpUrl} alt={holding.name} />
                        <div
                            className={`online-indicator ${
                                isOnline(holding.lastOnline) ? "online" : ""
                            }`}
                        ></div>
                    </div>
                    <div className="info">
                        <div className="name">{holding.name}</div>
                        <div className="last-message">
                            {holding.lastMessageText}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default HoldingsList;
