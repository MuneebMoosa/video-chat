import { io } from "socket.io-client";
import { useState, useEffect, useRef } from "react";

const ChatArea = () => {
  const socketRef = useRef(null);
  const statusRef = useRef("connecting");

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
  statusRef.current = status;
}, [status]);

  useEffect(() => {
    socketRef.current = io("http://localhost:3000");

    socketRef.current.on("receive-message", (msg) => {
      if (statusRef.current !== "connected") return;
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current.on("user-count", (count) => {
      setCount(count);
    });

    socketRef.current.on("waiting", () => {
      setMessages([]);
      setStatus("waiting");
    });

    socketRef.current.on("matched", () => {
      setMessages([]);
      setStatus("connected");
    });

    socketRef.current.on("partner-disconnected", () => {
      setMessages([]);
      setStatus("waiting");
    });

    return () => {
      socketRef.current.disconnect(); 
    };
  }, []);

  const handleSend = () => {
    if (!message) return;
    socketRef.current.emit("user-message", message);
    setMessage("");
  };
  return (
    <div className="p-4">
      <div>
         <p className="inline-block px-3 py-1 border rounded text-sm font-semibold">
          🟢 {count} online
        </p>
        <p className="mb-2">
          {status === "waiting" && "🔍 Searching for stranger..."}
          {status === "connected" && "💬 Connected to stranger"}
        </p>
      </div>
      <h1 className="text-xl mb-4">Chat Here</h1>

      {/* Messages */}
      <div className="border h-60 overflow-y-auto p-2 mb-4">
        {messages.map((msg, index) => (
          <div 
          key={index} 
          className={`p-2 mb-2 rounded max-w-xs ${
              msg.id === socketRef.current?.id
                ? "bg-blue-500 text-white ml-auto"
                : "bg-gray-300 text-black"
            }`}
            >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-3 justify-center w-full">
        <form 
           onSubmit={(e) => {
              e.preventDefault(); 
              handleSend()
            }}
            className="flex gap-2 w-full max-w-lg">
           <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border px-2 py-1 flex-1"
          placeholder="Type message..."
        />

        <button
          type="submit"
          className="bg-blue-500 text-white px-3"
        >
          Send
        </button>
        </form>
      </div>
    </div>
  )
}

export default ChatArea