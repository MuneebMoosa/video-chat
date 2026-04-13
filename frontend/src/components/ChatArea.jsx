import { io } from "socket.io-client";
import { useState , useEffect } from "react";
const socket = io("http://localhost:3000");
const ChatArea = () => {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        socket.on('receive-message' , (msg) => {
          setMessages((prev) => [...prev, msg]);
        });
        return () => socket.off("receive-message");      
    }, [])
    const handleSend = () => {
      if (!message) return;
      socket.emit('user-message' , message);
      setMessage("");
    };
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Chat Here</h1>

      {/* Messages */}
      <div className="border h-60 overflow-y-auto p-2 mb-4">
        {messages.map((msg, index) => (
          <div 
          key={index} 
          className={`p-2 mb-2 rounded max-w-xs ${
              msg.id === socket.id
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