  import React from 'react'
  
  const VideoArea = ({myVideoRef,strangerVideoRef,status}) => {
    return (
      <div>
      {/* videochatarea start  */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[40vh] mb-5">

        {/* Your Video */}
        <div className="relative bg-black rounded-xl overflow-hidden">
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
          <div className="relative bg-black rounded-xl overflow-hidden">
            {status === "waiting" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 text-white">
              
              {/* Spinner */}
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>

              <p className="mt-4 text-lg font-medium">
                Searching for stranger...
              </p>
            </div>
          )}
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
  
  