import React, { useState } from "react";
import HoldingsList from "./HoldingsList/HoldingsList";
import Chat from "./Chat/Chat";
import "./App.css";

function App() {
    const [selectedChatRoom, setSelectedChatRoom] = useState(null);

    return (
        <div className="App">
            <div className="left-section">
                <HoldingsList
                    onSelectChatRoom={setSelectedChatRoom}
                    selectedChatRoom={selectedChatRoom}
                />
            </div>
            <div className="right-section">
                {selectedChatRoom && <Chat chatRoomId={selectedChatRoom} />}
            </div>
        </div>
    );
}

export default App;
