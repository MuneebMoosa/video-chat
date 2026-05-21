import { io } from "socket.io-client";
import { useState, useEffect, useRef } from "react";
import VideoArea from "./VideoArea";
import { addIceCandidate, createOffer, createPeerConnection, fetchUserMedia , handleIceCandidate , handleTrackEvent , handleOffer , handleAnswer } from "../utils/webrtc";
const ChatArea = () => {
  const socketRef = useRef(null);
  const statusRef = useRef("connecting");


  // video start
  const myVideoRef = useRef(null)
  const strangerVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const pendingCandidatesRef = useRef([]);
  const pendingOfferRef = useRef(null)
  useEffect(() => {
    const startCamera = async () => {
       console.log(
        "starting camera"
      );
      const stream = await fetchUserMedia();
      console.log("camera ready");
       console.log( "local audio tracks:", stream.getAudioTracks() );
      localStreamRef.current = stream;
      if (myVideoRef.current){
        myVideoRef.current.srcObject = localStreamRef.current;
      }
    };

    startCamera();
  }, []);
  // video ends

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

    socketRef.current.on("matched", async (data) => {
      console.log(
      "matched event"
    );

      setMessages([]);
      setStatus("connected");
      const peerConnection = createPeerConnection();

     if (!localStreamRef.current) {
        console.log("waiting for stream...");

        const stream = await fetchUserMedia();
        
        localStreamRef.current = stream;

        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }
      }

      console.log("stream:",localStreamRef.current);
      
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current);
      });

      peerConnectionRef.current = peerConnection;

      handleIceCandidate(peerConnection, socketRef.current);
      handleTrackEvent(peerConnection, strangerVideoRef);
      
      if (pendingOfferRef.current) {
        console.log("processing saved offer");

        const answer = await handleOffer(
          peerConnection, pendingOfferRef.current
        );

        for (const candidate of pendingCandidatesRef.current) {
          await addIceCandidate(peerConnection, candidate);
        }

        pendingCandidatesRef.current = [];

        socketRef.current.emit("answer", answer);

        pendingOfferRef.current = null;
      }

      console.log("peer saved");

      handleIceCandidate(peerConnection, socketRef.current); // ice candidate creation

      handleTrackEvent(peerConnection,strangerVideoRef); // attach stranger video
      if(data.initiator == true){
        const offer = await createOffer(peerConnection);
        socketRef.current.emit("offer" , offer)
      }
      
    });
    socketRef.current.on("offer" ,  async (offer) => {
      const peerConnection = peerConnectionRef.current;

      if (!peerConnection) {
        console.log("saving offer for later");
        pendingOfferRef.current = offer;
        return;
      }

      const answer = await handleOffer(peerConnection , offer);

      for (const candidate of pendingCandidatesRef.current) {
        await addIceCandidate(peerConnection, candidate);
      }

      pendingCandidatesRef.current = [];

      socketRef.current.emit("answer", answer)
    })

    socketRef.current.on("answer" ,  async (answer) => {
      const peerConnection = peerConnectionRef.current;
      await handleAnswer(peerConnection , answer);
    })

    socketRef.current.on("ice-candidate" , async (candidate) => {
       const peerConnection = peerConnectionRef.current;
        if (!peerConnection) {
          console.log( "quewing candidate" );

          pendingCandidatesRef.current.push(candidate);

          return;
      }
      if ( !peerConnection .remoteDescription ) {
        console.log(
          "queueing candidate - remote description not ready"
        );

        pendingCandidatesRef
          .current
          .push(candidate);

        return;
      }
       await addIceCandidate(peerConnection , candidate);
    } )

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
    <div className="p-5">
      <div className="flex justify-center w-full">
          <p className="inline-block px-3 py-1 border rounded text-sm font-semibold">
        🟢 {count} online
          </p>
      </div>
        
      <div>
        <p className="mb-2">
          {status === "waiting" && "🔍 Searching for stranger..."}
          {status === "connected" && "💬 Connected to stranger"}
        </p>
      </div>

      {/* VideoArea start*/}
         <VideoArea
           myVideoRef={myVideoRef}
           strangerVideoRef={strangerVideoRef}
         />
      {/* VideoArea ends*/}
      
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