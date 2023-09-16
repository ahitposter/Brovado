import React, { useState, useEffect, useRef } from "react";
import "./Header.css";

const Header = ({ tokens, selectedToken, onSwitchUser, onLogout }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="top-header">
            <div className="profile-section" ref={menuRef}>
                <img
                    className="profile-picture"
                    src="https://pbs.twimg.com/profile_images/1677846494429446144/ovwOugxk.jpg"
                    alt="Profile"
                    onClick={() => setShowMenu(!showMenu)}
                />
                {showMenu && (
                    <div className="profile-menu">
                        <div className="details-section">
                            <span>123</span>
                            <span>abc</span>
                        </div>
                        <div className="add-button-section">
                            <button
                                onClick={() => {
                                    /* Add New User Logic */
                                }}
                            >
                                Add New User
                            </button>
                        </div>
                        <div className="users-list">
                            {tokens.map((token, index) => (
                                <div
                                    key={index}
                                    onClick={() => onSwitchUser(token)}
                                >
                                    <img
                                        src="https://pbs.twimg.com/profile_images/1677846494429446144/ovwOugxk.jpg"
                                        alt="User"
                                    />
                                    <span>123</span>
                                    <span>abc</span>
                                </div>
                            ))}
                        </div>
                        <div className="logout-button-section">
                            <button onClick={onLogout}>Logout</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Header;
