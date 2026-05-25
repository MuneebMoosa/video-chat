  import React from 'react'
  
  const VideoArea = ({myVideoRef,strangerVideoRef}) => {
    return (
      <div>
      {/* videochatarea start  */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[50vh] mb-5">

        {/* Your Video */}
        <div className="relative bg-black rounded-xl overflow-hidden border">
          <video
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            ref={myVideoRef}
          />

          <p className="absolute bottom-3 left-3 bg-black/50 text-white px-2 py-1 rounded-lg">
            You
          </p>
        </div>

        {/* Stranger Video */}
          <div className="relative bg-black rounded-xl overflow-hidden border">
            <video
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              ref={strangerVideoRef}
            />

            <p className="absolute bottom-3 left-3 bg-black/50 text-white px-2 py-1 rounded-lg">
              Stranger
            </p>
          </div>

         
      </div>
       {/* videochatarea ends  */}
      </div>
    )
  }
  
  export default VideoArea
  
  