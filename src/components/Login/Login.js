import React, { useState, useEffect } from "react";
import "./Login.css";
import { Web3Button } from "@web3modal/react";
import { useAccount } from "wagmi";
import { useSignMessage } from "wagmi";
import axios from "axios";
import { API_HOST, isValidJWT } from "../../utils/helpers";

const Login = ({ handleLogin, handleError, onClose }) => {
    const { address, isConnected } = useAccount();
    const [token, setToken] = useState("");
    const {
        data: signMessageData,
        error: signMessageError,
        signMessage,
        variables,
    } = useSignMessage();
    const [isUsingJWT, setIsUsingJWT] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleJWTSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(false);
        if (!isValidJWT(token)) {
            handleError("Not a valid JWT token");
            return;
        }
        handleLogin(token);
        onClose?.();
    };

    useEffect(() => {
        if (signMessageError) {
            setIsLoading(false);
            console.error(signMessageError);
            handleError("There was an error signing you in");
        }
    }, [signMessageError]);

    useEffect(() => {
        (async () => {
            if (variables?.message && signMessageData) {
                try {
                    const authPayload = {
                        message: variables?.message,
                        signature: signMessageData,
                    };
                    const authResp = await axios.post(
                        `${API_HOST}/api/v1/siwe/authenticate`,
                        authPayload
                    );

                    const signaturePayload = {
                        address: address,
                    };
                    const signatureResp = await axios.post(
                        "https://prod-api.kosetto.com/signature",
                        signaturePayload,
                        {
                            headers: {
                                Authorization: authResp?.data?.token,
                            },
                        }
                    );
                    handleLogin(signatureResp?.data?.token);
                    onClose?.();
                } catch (error) {
                    handleError("There was an error signing you in");
                    console.error(error);
                    setIsLoading(false);
                }
            }
        })();
    }, [signMessageData, variables?.message]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const initResponse = await axios.get(
                `${API_HOST}/api/v1/siwe/init/${address}`
            );

            // https://eips.ethereum.org/EIPS/eip-4361
            const message = `${
                window.location.hostname
            } wants you to sign in with your Ethereum account:
${address}

By signing this message, you are proving you own this wallet and allowing Brovado to authenticate you with FriendTech.

URI: ${window.location.href}
Version: 1
Chain ID: 8453
Nonce: ${initResponse.data.nonce}
Issued At: ${new Date().toISOString()}`;

            signMessage({ message });
        } catch (error) {
            handleError("There was an error signing you in");
            console.error(error);
        }
    };

    return (
        <div className="login-page" onClick={() => onClose?.()}>
            <div
                className="login-container"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="login-header">
                    <h2 className="login-container-h2">
                        {isUsingJWT
                            ? "Sign in with your FriendTech JWT token"
                            : "Sign in with your FriendTech wallet"}
                    </h2>
                    <div className="tooltip">
                        ?
                        <span className="tooltiptext">
                            By signing into Brovado, you are granting this
                            <br />
                            website access to authenticate against FriendTech
                            <br />
                            APIs. This includes interacting with the chat as
                            <br />
                            well as loading your profile information.
                            <br />
                            <br />
                            This does not expose any access to your FriendTech
                            <br />
                            wallet nor does it allow Brovado to execute any
                            <br />
                            on-chain actions on your behalf.
                            <br />
                            <br />
                            Brovado is never storing or logging your FriendTech
                            <br />
                            token.
                            <br />
                        </span>
                    </div>
                </div>
                {isLoading ? (
                    <div className="spinner" />
                ) : (
                    <>
                        <form
                            className="login-container-form"
                            onSubmit={
                                isUsingJWT ? handleJWTSubmit : handleSubmit
                            }
                        >
                            {isUsingJWT ? (
                                <>
                                    <input
                                        className="login-container-input"
                                        placeholder="Paste your FriendTech JWT token"
                                        value={token}
                                        onChange={(e) =>
                                            setToken(e.target.value)
                                        }
                                        type="password"
                                    />

                                    <div className="login-buttons-container-jwt">
                                        <button
                                            className="login-button"
                                            type="submit"
                                        >
                                            Sign In
                                        </button>
                                        <button
                                            className="login-button cancel"
                                            onClick={() => setIsUsingJWT(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="login-buttons-container">
                                    <Web3Button className="login-button" />
                                    {isConnected && (
                                        <button
                                            className="login-button"
                                            type="submit"
                                        >
                                            Sign In
                                        </button>
                                    )}
                                </div>
                            )}
                        </form>
                        {!isUsingJWT && (
                            <div
                                className="alternative-login"
                                onClick={() => setIsUsingJWT(true)}
                            >
                                Don't want to sign in with your wallet?
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;
