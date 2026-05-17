
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
