import React, { useEffect, useState } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import "./HoldingsList.css";

const HoldingsList = ({ onSelectChatRoom, selectedChatRoom }) => {
    const [holdings, setHoldings] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("No token found.");
            return;
        }

        const decoded = jwt_decode(token);
        const address = decoded.address;

        axios
            .get(`https://prod-api.kosetto.com/portfolio/${address}`, {
                headers: {
                    Authorization: token,
                },
            })
            .then((res) => {
                setHoldings(res.data.holdings);
                onSelectChatRoom(res.data.holdings[0]?.chatRoomId || ""); // Select the first chatroom by default
            })
            .catch((err) => {
                console.error("Error fetching holdings:", err);
            });
    }, [onSelectChatRoom]);

    const isOnline = (lastOnline) => {
        const currentTime = Date.now();
        return currentTime - lastOnline <= 180000; // 3 minutes in milliseconds
    };

    return (
        <div className="holdings-list">
            {holdings.map((holding, index) => (
                <div
                    key={index}
                    onClick={() => onSelectChatRoom(holding.chatRoomId)}
                    className={`holding-item ${
                        selectedChatRoom === holding.chatRoomId ? "active" : ""
                    }`}
                >
                    <img src={holding.pfpUrl} alt={holding.name} />
                    <div className="info">
                        <div className="name">{holding.name}</div>
                        <div className="last-message">
                            {holding.lastMessageText}
                        </div>
                        <div
                            className={`online-indicator ${
                                isOnline(holding.lastOnline) ? "online" : ""
                            }`}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default HoldingsList;
