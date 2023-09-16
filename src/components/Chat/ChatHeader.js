import React, { useState, useEffect } from "react";
import "./ChatHeader.css";
import { FormatToETH, GetToken, GetUserAddress } from "../../utils/helpers";
import axios from "axios";
import { FT_CONTRACT, FT_CONTRACT_ADDRESS, web3 } from "../../utils/web3";

const ChatHeader = ({ visible, holding, selectedChatRoom }) => {
    const [ethBalance, setEthBalance] = useState(0);
    const [yourSharesHeld, setYourSharesHeld] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [userDetails, setUserDetails] = useState({});

    const loadEthBalance = async () => {
        const jsonRpcRequest = {
            jsonrpc: "2.0",
            method: "eth_getBalance",
            params: [selectedChatRoom, "latest"],
            id: 1,
        };
        try {
            const response = await web3.provider.request(jsonRpcRequest);
            setEthBalance(FormatToETH(response.result));
        } catch (error) {
            console.error("Failed to fetch data:", error);
        }
    };

    const loadSharesHeld = async () => {
        const data = FT_CONTRACT.methods
            .sharesBalance(GetUserAddress(), selectedChatRoom)
            .encodeABI();

        const jsonRpcRequest = {
            jsonrpc: "2.0",
            method: "eth_call",
            params: [
                {
                    to: FT_CONTRACT_ADDRESS,
                    data: data,
                },
                "latest",
            ],
            id: 1,
        };
        try {
            const response = await web3.provider.request(jsonRpcRequest);
            setYourSharesHeld(web3.utils.hexToNumber(response.result));
        } catch (error) {
            console.error("Failed to fetch data:", error);
        }
    };

    const loadUserInfo = async () => {
        try {
            const response = await axios.get(
                `https://prod-api.kosetto.com/users/${selectedChatRoom}`,
                {
                    headers: {
                        Authorization: GetToken(),
                    },
                }
            );
            setUserDetails(response.data);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        setEthBalance(0);
        setYourSharesHeld(0);
        setUserDetails({});
        const fetchData = async () => {
            await Promise.allSettled([
                loadEthBalance(),
                loadSharesHeld(),
                loadUserInfo(),
            ]);
            setIsLoading(false);
        };
        fetchData();
    }, [selectedChatRoom]);

    return (
        <>
            {visible ? (
                <>
                    {isLoading ? (
                        <div className="loading">Loading...</div>
                    ) : (
                        <div className="chat-header">
                            {/* Left Column */}
                            <div className="left-column">
                                {/* Top Left */}
                                <a
                                    href={`https://twitter.com/${userDetails.twitterUsername}`}
                                    target="_blank"
                                    className="twitter-link"
                                >
                                    {userDetails.twitterName}
                                </a>
                                {/* Middle Left */}
                                <div className="key-price">
                                    Key Price:{" "}
                                    {FormatToETH(userDetails.displayPrice)} ETH
                                </div>
                                {/* Bottom Left */}
                                <a
                                    href={`https://basescan.org/address/${userDetails.address}`}
                                    target="_blank"
                                    className="eth-link"
                                >
                                    User's Wallet Balance: {ethBalance} ETH
                                </a>
                            </div>

                            {/* Middle Column */}
                            <div className="middle-column">
                                {/* Top Middle */}
                                <div className="your-balance">
                                    You hold {holding.balance} key worth{" "}
                                    {FormatToETH(holding.balanceEthValue)} ETH
                                </div>
                                {/* Middle Middle */}
                                {yourSharesHeld ? (
                                    <div className="your-shares">
                                        This user holds {yourSharesHeld} of your
                                        keys.
                                    </div>
                                ) : null}
                            </div>

                            {/* Right Column */}
                            <div className="right-column">
                                {/* Top Right */}
                                <div className="shares-supply">
                                    Key Supply: {userDetails.shareSupply}
                                </div>
                                {/* Middle Right */}
                                <div className="user-keys">
                                    This user holds {holding.balance} keys
                                </div>
                                {/* Bottom Right */}
                                <div className="holders-count">
                                    {userDetails.holderCount} users hold this
                                    key
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : null}
        </>
    );
};

export default ChatHeader;
