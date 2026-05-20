let peerConfiguration = {
    iceServers:[
        {
            urls:[
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302'
            ]
        }
    ]
}


export const fetchUserMedia = async() => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

     return stream;
  } catch (err) {
    console.log("Error in getting media:" , err);
    throw err;
  }
}


export const createPeerConnection = () =>{

  const peerConnection = new RTCPeerConnection(peerConfiguration);

  return peerConnection;

}

export const createOffer = async (peerConnection) => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return offer;
};

export const handleOffer = async (peerConnection,offer) => {
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription( answer);
  return answer;
};

export const handleAnswer = async (peerConnection , answer) => {
   await peerConnection.setRemoteDescription(answer);
}


// return new Promise(async(resolve, reject)=>{
//         //RTCPeerConnection is the thing that creates the connection
//         //we can pass a config object, and that config object can contain stun servers
//         //which will fetch us ICE candidates
//         peerConnection = await new RTCPeerConnection(peerConfiguration)
//         remoteStream = new MediaStream()
//         remoteVideoEl.srcObject = remoteStream;


//         localStream.getTracks().forEach(track=>{
//             //add localtracks so that they can be sent once the connection is established
//             peerConnection.addTrack(track,localStream);
//         })

//         peerConnection.addEventListener("signalingstatechange", (event) => {
//             console.log(event);
//             console.log(peerConnection.signalingState)
//         });

//         peerConnection.addEventListener('icecandidate',e=>{
//             console.log('........Ice candidate found!......')
//             console.log(e)
//             if(e.candidate){
//                 socket.emit('sendIceCandidateToSignalingServer',{
//                     iceCandidate: e.candidate,
//                     iceUserName: userName,
//                     didIOffer,
//                 })    
//             }
//         })
        
//         peerConnection.addEventListener('track',e=>{
//             console.log("Got a track from the other peer!! How excting")
//             console.log(e)
//             e.streams[0].getTracks().forEach(track=>{
//                 remoteStream.addTrack(track,remoteStream);
//                 console.log("Here's an exciting moment... fingers cross")
//             })
//         })

//         if(offerObj){
//             //this won't be set when called from call();
//             //will be set when we call from answerOffer()
//             // console.log(peerConnection.signalingState) //should be stable because no setDesc has been run yet
//             await peerConnection.setRemoteDescription(offerObj.offer)
//             // console.log(peerConnection.signalingState) //should be have-remote-offer, because client2 has setRemoteDesc on the offer
//         }
//         resolve();
//     })
// }