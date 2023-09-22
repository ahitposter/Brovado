import React, { useState, useEffect } from "react";
import "./ChatHeader.css";
import { FormatToETH } from "../../utils/helpers";
import axios from "axios";
import { GetSharesHeld, web3 } from "../../utils/web3";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faEthereum } from "@fortawesome/free-brands-svg-icons";
import {
    faUsers,
    faKey,
    faWallet,
    faUser,
    faDollarSign,
    faCoins,
    faHandshake,
} from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "@material-ui/core";

const ChatHeader = ({
    loggedInAccount,
    visible,
    holding,
    selectedChatRoom,
}) => {
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
        try {
            const shares = await GetSharesHeld(
                loggedInAccount.address,
                selectedChatRoom
            );
            setYourSharesHeld(shares);
        } catch (error) {
            console.error("Failed to load held keys:", error);
        }
    };

    const loadUserInfo = async () => {
        try {
            const response = await axios.get(
                `https://prod-api.kosetto.com/users/${selectedChatRoom}`,
                {
                    headers: {
                        Authorization: loggedInAccount.token,
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
                            <div className="header-top">
                                <div className="header-left">
                                    <a
                                        href={`https://twitter.com/${userDetails.twitterUsername}`}
                                        target="_blank"
                                        className="twitter-link"
                                    >
                                        {userDetails.twitterName}
                                    </a>
                                    {yourSharesHeld > 0 && (
                                        <Tooltip title="your shares held by this user">
                                            <div className="info-item">
                                                <FontAwesomeIcon
                                                    icon={faHandshake}
                                                />
                                                <span>{yourSharesHeld}</span>
                                            </div>
                                        </Tooltip>
                                    )}
                                </div>
                                <div className="header-right">
                                    {/* <Tooltip title="key price">
                                        <div className="info-item">
                                            <FontAwesomeIcon icon={faKey} />
                                            {FormatToETH(
                                                userDetails.displayPrice
                                            )}{" "}
                                            ETH
                                        </div>
                                    </Tooltip> */}
                                    <Tooltip title="your balance">
                                        <div className="info-item">
                                            <FontAwesomeIcon icon={faKey} />
                                            <span>
                                                {holding.balance} (
                                                {FormatToETH(
                                                    holding.balanceEthValue
                                                )}{" "}
                                                ETH)
                                            </span>
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>

                            <div className="header-bottom">
                                <div className="header-left">
                                    <Tooltip title="user's wallet balance">
                                        <div className="info-item">
                                            <FontAwesomeIcon icon={faWallet} />
                                            <a
                                                href={`https://basescan.org/address/${userDetails.address}`}
                                                target="_blank"
                                                className="eth-link"
                                                style={{ color: "#007aff" }}
                                            >
                                                {ethBalance} ETH
                                            </a>
                                        </div>
                                    </Tooltip>
                                    <Tooltip title="total key supply">
                                        <div className="info-item">
                                            <FontAwesomeIcon icon={faCoins} />
                                            <span>
                                                {userDetails.shareSupply}
                                            </span>
                                        </div>
                                    </Tooltip>
                                </div>
                                <div className="header-right">
                                    <Tooltip title="keys held by user">
                                        <div className="info-item">
                                            <FontAwesomeIcon icon={faUser} />
                                            <span>
                                                {userDetails.holdingCount}
                                            </span>
                                        </div>
                                    </Tooltip>
                                    <Tooltip title="users holding this key">
                                        <div className="info-item">
                                            <FontAwesomeIcon icon={faUsers} />
                                            <span>
                                                {userDetails.holderCount}
                                            </span>
                                        </div>
                                    </Tooltip>
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
