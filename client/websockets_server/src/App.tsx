import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [socket, setSocket] = useState<null | WebSocket>(null);
  const [latestMessage, setLatestMessage] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    // and the websocket is inbuild in the JS
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      console.log("connected");

      setSocket(socket);
    };

    socket.onmessage = (message) => {
      setLatestMessage(message.data);
    };
    return () => {
      socket.close();
    };
  }, []);
  return (
    <>
      <input
        type="text"
        onChange={(e) => {
          setMessage(e.target.value);
        }}
      />
      <button
        onClick={() => {
          socket?.send(message);
        }}
      >
        just send
      </button>
      <div>the message from the server is {latestMessage}</div>
    </>
  );
}

export default App;
