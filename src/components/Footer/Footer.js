import React, { useState, useEffect, useRef } from "react";
import "./Footer.css";
import { TimeUntil } from "../../utils/helpers";
import Login from "../Login/Login";

const Footer = ({
    accounts,
    setAccounts,
    loggedInAccount,
    setLoggedInAccount,
    handleLogin,
    handleError,
}) => {
    const [submenuVisible, setSubmenuVisible] = useState(false);
    const submenuRef = useRef(null);
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

    const openTokenModal = () => {
        setSubmenuVisible(false);
        setIsTokenModalOpen(true);
    };

    const closeTokenModal = () => {
        setIsTokenModalOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (submenuRef.current && !submenuRef.current.contains(e.target)) {
                setSubmenuVisible(false);
            }
        };

        if (submenuVisible) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [submenuVisible]);

    const toggleSubmenu = () => {
        setSubmenuVisible(!submenuVisible);
    };

    const switchAccount = (account) => {
        setLoggedInAccount(account);
        setSubmenuVisible(false);
    };

    const logout = () => {
        const newUsers = accounts.filter(
            (u) => u.token !== loggedInAccount.token
        );
        setAccounts(newUsers);
        const user = newUsers?.[0];
        setLoggedInAccount(user);
        setSubmenuVisible(false);
    };

    return (
        <div className="footer">
            {isTokenModalOpen && (
                <Login
                    onClose={closeTokenModal}
                    handleLogin={handleLogin}
                    handleError={handleError}
                />
            )}

            <img
                className="profile-pic"
                src={loggedInAccount.twitterPfpUrl}
                alt="Profile"
                onClick={toggleSubmenu}
            />
            <div className="footer-user-details">
                <span className="user-name">{loggedInAccount.twitterName}</span>
                <span className="misc-info">
                    Expires in {TimeUntil(loggedInAccount.expires)}
                </span>
            </div>

            {submenuVisible && (
                <div className="submenu" ref={submenuRef}>
                    <div className="account-list">
                        {accounts.map((account, index) => (
                            <div
                                key={index}
                                className="account-item"
                                onClick={() => switchAccount(account)}
                            >
                                <img
                                    className="submenu-profile-pic"
                                    src={account.twitterPfpUrl}
                                    alt="Profile"
                                />
                                <div>
                                    <span className="submenu-user-name">
                                        {account.twitterName}
                                    </span>
                                    <span className="submenu-misc-info">
                                        Expires in {TimeUntil(account.expires)}{" "}
                                    </span>
                                </div>
                                {account.token === loggedInAccount.token && (
                                    <span className="checkmark">✓</span>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="submenu-actions">
                        <div className="action-item" onClick={logout}>
                            Log out
                        </div>
                        <div
                            className="action-item"
                            onClick={() => {
                                openTokenModal();
                            }}
                        >
                            Add account
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Footer;
