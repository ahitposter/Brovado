// TokenModal.js
import React, { useState } from "react";

const TokenModal = ({ onClose, onAddToken }) => {
    const [token, setToken] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (token) {
            onAddToken(token);
            onClose();
        }
    };

    return (
        <div className="token-modal-backdrop">
            <div className="token-modal-container">
                <h2>Please Enter New Token</h2>
                <form className="token-modal-form" onSubmit={handleSubmit}>
                    <input
                        className="token-modal-input"
                        placeholder="Enter token"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                    />
                    <div className="modal-actions">
                        <button className="modal-actions-button" type="submit">
                            Add
                        </button>
                        <button
                            className="modal-actions-button"
                            type="button"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TokenModal;
