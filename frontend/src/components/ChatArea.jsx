import { io } from "socket.io-client";
import { SkipForward, Camera, CameraOff, Mic , MicOff, MessageSquareText , Smile , SendHorizontal, Phone} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Sidepanel from "./Sidepanel";
import VideoArea from "./VideoArea";
import { addIceCandidate, createOffer, createPeerConnection, fetchUserMedia , handleIceCandidate , handleTrackEvent , handleOffer , handleAnswer } from "../utils/webrtc";
const ChatArea = () => {
  //camera mic on and off start
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  const handleCameraToggle = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];

    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;

    setCameraOn(videoTrack.enabled);
  };

  const handleMicToggle = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];

    if(!audioTrack) return;
    
    audioTrack.enabled = !audioTrack.enabled;

    setMicOn(audioTrack.enabled);
  }
  //camera mic on and off end

  // const handleDisconnect = () => {
  //   cleanupConnection();

  //   setMessages([]);
  //   setStatus("waiting");

  //   socketRef.current.disconnect();
  // }
  const socketRef = useRef(null);
  const statusRef = useRef("connecting");

  const handleSkip = () => {
    cleanupConnection();
    socketRef.current.emit("next-user");
    console.log('skipped!!!')
      
  }

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

const cleanupConnection = () => {
  console.log("cleaning old connection");

  // close peer connection
  if (peerConnectionRef.current) {
    peerConnectionRef.current.close();
    peerConnectionRef.current = null;
  }

  // clear stranger video
  if (strangerVideoRef.current) {
    strangerVideoRef.current.srcObject = null;
  }

  // clear pending data
  pendingCandidatesRef.current = [];
  pendingOfferRef.current = null;
};

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_BACKEND_URL);

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
      console.log("matched event");

      setMessages([]);
      setStatus("connected");
      cleanupConnection();
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
      cleanupConnection();
      setMessages([]);
      setStatus("waiting");
    });

    return () => {
      cleanupConnection();

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }

      socketRef.current.disconnect(); 
    };
  }, []);


  const handleSend = () => {
    if (!message) return;
    socketRef.current.emit("user-message", message);
    setMessage("");
  };
  
  return (
    
    <div className="">

      <nav className="flex justify-start w-full font-[var(--primary-font)] p-5">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl text-[var(--secondary-color)] font-bold tracking-wide"> Pulse Chat</h1>
          <div className="flex items-center gap-2 h-6 px-2 py-2 rounded-full text-sm font-semibold bg-[var(--ternary-color)] shadow-sm"> 
            <span className="w-2.5 h-2.5 bg-[var(--secondary-color)] rounded-full shadow-[var(--secondary-light)]"></span> 
            <span>{count} users online</span>
          </div>
        </div>
      </nav>

      <hr className="w-full border-t border-[var(--border-color)]" />

      <div className="flex h-[calc(100vh-88px)]"> 
         <Sidepanel/>
         <div className="flex flex-col flex-1 h-full">
          <div className="p-5">
            <VideoArea
              myVideoRef={myVideoRef}
              strangerVideoRef={strangerVideoRef}
              status={status}
            />

            <div className="rounded-xl border border-[var(--border-color)] flex flex-1 flex-col">
                <div className="flex gap-2 font-bold p-2 bg-[var(--secondary-bg)] border-b border-[var(--border-color)] rounded-t-xl ">
                  <MessageSquareText color="#c0c1ff"/>
                  <h1 className="text-xl">Live Chat</h1>
                </div>
                
                {/* Messages */}
                <div className="h-60 overflow-y-auto p-2 hide-scrollbar">
                  {messages.map((msg, index) => (
                    <div 
                    key={index} 
                    className={`p-2 mb-2  max-w-xs break-words whitespace-pre-wrap overflow-x-hidden ${
                        msg.id === socketRef.current?.id
                          ? "bg-[var(--secondary-color)] text-[var(--message-text)] ml-auto rounded-lg rounded-tr-none "
                          : "bg-[var(--my-msg)] rounded-lg rounded-tl-none"
                      }`}
                      >
                      {msg.text}
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="p-3 bg-[var(--secondary-bg)]  border-t rounded-b-xl  border-[var(--border-color)]">
                  <form 
                    onSubmit={(e) => {
                        e.preventDefault(); 
                        handleSend()
                      }}
                      className="flex gap-2 w-full ">
                    <button type="button" className="px-3 border-none rounded-lg ">
                      <Smile size={20} />
                    </button>
                    <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="border px-2 py-1 flex-1 rounded-lg outline-none bg-[var(--ternary-color)] border-[var(--border-color)]"
                    placeholder="Type message..."
                  />

                  <button
                    type="submit"
                    className="bg-[var(--btn-color)] text-white px-3 rounded-lg"
                  >
                    <SendHorizontal color="#1f1f27"/>
                  </button>
                  </form>
                </div>
            </div>
            </div>
            <div className="flex gap-4 justify-center items-center  bg-[var(--my-msg)] h-full">
                {/* Skip Button */}
                <button className="flex flex-col items-center justify-center gap-1 px-2 py-2 bg-[var(--btn-color)] text-[var(--secondary-bg)] rounded-xl  w-25 h-15 cursor-pointer"
                onClick={handleSkip}
                >
                  <SkipForward size={20} />
                  <span className="text-xs font-medium">
                    Skip
                  </span>
                </button>

                {/* Camera Button */}
                <button className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-white rounded-xl  w-25 h-15 cursor-pointer"
                onClick={handleCameraToggle}>
                  {cameraOn ? (
                      <Camera size={20} />
                    ) : (
                      <CameraOff size={20} />
                    )
                  }
                  <span className="text-xs font-medium">
                    Camera
                  </span>
                </button>

                {/* Mic Button */}
                <button className="flex flex-col items-center justify-center gap-1 px-2 py-2 text-white rounded-xl  w-25 h-15 cursor-pointer"
                onClick={handleMicToggle}>
                  {micOn ? (
                      <Mic size={20} />
                    ) : (
                      <MicOff size={20} />
                    )
                  }
                  <span className="text-xs font-medium">
                    Mic
                  </span>
                </button>
                {/* disconnect */}
                <button className="flex flex-col items-center justify-center gap-1 px-2 py-2 bg-[#690005] text-white rounded-xl  w-25 h-15 cursor-pointer"
                  // onClick={handleDisconnect}
                >
                  <Phone size={20}/>
                  <span className="text-xs font-medium">
                    End
                  </span>
                </button>
            </div>
         </div> 
         
      </div>
    </div>
  )
}

export default ChatArea