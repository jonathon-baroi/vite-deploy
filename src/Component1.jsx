import React, { useState, useRef, useEffect } from "react";
import YouTube from "react-youtube";

const Component1 = () => {
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ"); // Default video ID
  const [inputUrl, setInputUrl] = useState(""); // To store the user's video URL input
  const [timestamps, setTimestamps] = useState([]);
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [status, setStatus] = useState("Stopped"); // "Playing" or "Stopped"
  const youtubePlayerRef = useRef(null);
  const intervalRef = useRef(null); // To track the polling interval
  const [savedVideoUrl, setSavedVideoUrl] = useState(""); // Save the video URL

  const emotions = ["Neutral", "Happy", "Sad", "Angry", "Excited"];
  const genders = ["Unspecified", "Male", "Female", "Other"];

  const handleVideoReady = (event) => {
    youtubePlayerRef.current = event.target;
  };

  const handleAddTimestamp = () => {
    if (!youtubePlayerRef.current) return;
    const time = parseFloat(youtubePlayerRef.current.getCurrentTime().toFixed(2));
    setTimestamps([
      ...timestamps,
      {
        id: Date.now(),
        start: time,
        end: time + 10.0,
        emotion: "Neutral",
        gender: "Unspecified",
      },
    ]);
  };

  const handleEditTimestamp = (id, field, value) => {
    setTimestamps((prev) =>
      prev.map((ts) =>
        ts.id === id
          ? {
              ...ts,
              [field]:
                field === "start" || field === "end"
                  ? Math.max(0, parseFloat(value) || 0)
                  : value,
            }
          : ts
      )
    );
  };

  const handlePlayTimestamp = (id) => {
    const ts = timestamps.find((ts) => ts.id === id);
    if (ts && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(ts.start, true);
      setCurrentTimestamp(ts);
      setStatus("Playing");
      youtubePlayerRef.current.playVideo();

      // Start polling the playhead position
      clearInterval(intervalRef.current); // Clear any previous intervals
      intervalRef.current = setInterval(() => {
        if (youtubePlayerRef.current) {
          const currentTime = youtubePlayerRef.current.getCurrentTime();
          if (currentTime >= ts.end) {
            youtubePlayerRef.current.pauseVideo();
            setStatus("Stopped");
            setCurrentTimestamp(null);
            clearInterval(intervalRef.current); // Stop polling
          }
        }
      }, 100); // Check every 100ms
    }
  };

  const handleDownloadTimestamps = () => {
    const data = JSON.stringify(
      {
        videoUrl: savedVideoUrl,
        timestamps,
      },
      null,
      2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = url;
    link.download = "timestamps.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  

  const handleUploadTimestamps = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.videoUrl) {
            const videoIdMatch = data.videoUrl.match(
              /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
            );
            if (videoIdMatch) {
              setVideoId(videoIdMatch[1]);
              setSavedVideoUrl(data.videoUrl); // Save the loaded video URL
            } else {
              alert("Invalid video URL in the file");
            }
          }
          setTimestamps(data.timestamps || []);
        } catch (error) {
          alert("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    }
  };
  

  const handleLoadVideo = () => {
    const videoIdMatch = inputUrl.match(
      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (videoIdMatch) {
      setVideoId(videoIdMatch[1]);
      setSavedVideoUrl(inputUrl); // Save the URL when loaded
      setTimestamps([]); // Clear timestamps when a new video is loaded
      setInputUrl("");
    } else {
      alert("Invalid YouTube URL");
    }
  };
  

  useEffect(() => {
    // Cleanup interval on component unmount
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1>YouTube Timestamp Player</h1>
      <div>
        <strong>Current Video URL:</strong> {savedVideoUrl || "None"}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter YouTube URL"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          style={{ padding: "10px", width: "60%" }}
        />
        <button
          onClick={handleLoadVideo}
          style={{
            padding: "10px 20px",
            marginLeft: "10px",
            backgroundColor: "#4285f4",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Load Video
        </button>
      </div>
      <YouTube
        videoId={videoId}
        opts={{
          height: "390",
          width: "640",
          playerVars: { autoplay: 0 },
        }}
        onReady={handleVideoReady}
      />
      <div style={{ marginBottom: "10px" }}>
        <button
          style={{
            margin: "10px 5px",
            padding: "10px 20px",
            backgroundColor: "#4285f4",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
          onClick={handleAddTimestamp}
        >
          Add Timestamp
        </button>
        <button
          style={{
            margin: "10px 5px",
            padding: "10px 20px",
            backgroundColor: "#34a853",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
          onClick={handleDownloadTimestamps}
        >
          Download Timestamps
        </button>
        <input
          type="file"
          accept=".json"
          onChange={handleUploadTimestamps}
          style={{ margin: "10px 5px" }}
        />
      </div>
      <div>
        <h2>Timestamps</h2>
        {timestamps.length === 0 && <p>No timestamps added yet.</p>}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {timestamps.map((ts) => (
            <li
              key={ts.id}
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: "15px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                backgroundColor:
                  currentTimestamp?.id === ts.id ? "#f0f8ff" : "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <label>
                  Start:
                  <input
                    type="number"
                    step="0.01"
                    value={ts.start}
                    onChange={(e) =>
                      handleEditTimestamp(ts.id, "start", e.target.value)
                    }
                    style={{ marginLeft: "5px", width: "70px" }}
                  />
                </label>
                <label>
                  End:
                  <input
                    type="number"
                    step="0.01"
                    value={ts.end}
                    onChange={(e) =>
                      handleEditTimestamp(ts.id, "end", e.target.value)
                    }
                    style={{ marginLeft: "5px", width: "70px" }}
                  />
                </label>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <label>
                  Emotion:
                  <select
                    value={ts.emotion}
                    onChange={(e) =>
                      handleEditTimestamp(ts.id, "emotion", e.target.value)
                    }
                    style={{ marginLeft: "5px" }}
                  >
                    {emotions.map((emotion) => (
                      <option key={emotion} value={emotion}>
                        {emotion}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Gender:
                  <select
                    value={ts.gender}
                    onChange={(e) =>
                      handleEditTimestamp(ts.id, "gender", e.target.value)
                    }
                    style={{ marginLeft: "5px" }}
                  >
                    {genders.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                style={{
                  marginTop: "10px",
                  padding: "5px 10px",
                  backgroundColor: "#34a853",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => handlePlayTimestamp(ts.id)}
              >
                Play
              </button>
            </li>
          ))}
        </ul>
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            backgroundColor: status === "Playing" ? "#34a853" : "#f44336",
            color: "white",
            textAlign: "center",
            borderRadius: "5px",
          }}
        >
          {status === "Playing"
            ? `Playing timestamp: ${currentTimestamp?.start.toFixed(2)}s - ${currentTimestamp?.end.toFixed(2)}s`
            : "Video stopped"}
        </div>
      </div>
    </div>
  );
};

export default Component1;
