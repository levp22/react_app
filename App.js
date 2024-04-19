
import React, { useState } from 'react';
import './App.css';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { Document, Packer, Paragraph } from 'docx';

function App() {
  const [selectedType, setSelectedType] = useState("playlist");
  const [selectedGPT, setSelectedGPT] = useState("3.5");
  const [selectedSource, setSelectedSource] = useState("youtube");
  const [blurb, setBlurb] = useState("");
  const [blurb2, setBlurb2] = useState("");
  const [responseBlurb, setResponseBlurb] = useState('');
  const [isDownloadable, setIsDownloadable] = useState(false);

  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
  };
  const handleGPTChange = (event) => {
    setSelectedGPT(event.target.value);
  };
  const handleSourceChange = (event) => {
    setSelectedSource(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsDownloadable(false); // Reset download state before new submission

    try {
      // Assuming your backend expects 'type' as 0 for playlist, 1 for video
      const type = selectedType === "video" ? 1 : 0;
      const GPT = selectedGPT === "4" ? 1 : 0;
      const source = selectedSource === "podcast" ? 1 : 0;
      const payload = {GPT, source, type, link: blurb, title: blurb2 };
      
      // Replace 'YOUR_BACKEND_ENDPOINT' with your actual backend endpoint
      const response = await fetch('http://127.0.0.1:5000/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      const data = await response.json();
      setResponseBlurb(data['Return String']); // Adjust according to your actual response structure
      setIsDownloadable(true);
    } catch (error) {
      console.error('Submission failed:', error);
      // Optionally handle submission error here
    }
  };

  
  const downloadBlurb = () => {
    const zip = new JSZip();
  
    const docsPromises = responseBlurb.map((blurbText, index) => {
      // Split the blurbText by line breaks to handle formatting
      const lines = blurbText.split('\n');
      const doc = new Document({
        sections: [
          {
            // Create a new Paragraph for each line to maintain line breaks
            children: lines.map(line => new Paragraph(line)),
          },
        ],
      });
  
      return Packer.toBlob(doc).then(blob => {
        zip.file(`Document_${index + 1}.docx`, blob);
      });
    });
  
    Promise.all(docsPromises).then(() => {
      zip.generateAsync({ type: 'blob' }).then(content => {
        saveAs(content, 'playlists.zip');
      });
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <form onSubmit={handleSubmit}>
          <label>
            Select which Source you would like:
            <select onChange={handleSourceChange} value={selectedSource}>
              <option value="youtube">Youtube</option>
              <option value="podcast">Podcast</option>
            </select>
          </label>
          <label>
            Select whether you would like to send in a playlist or video link:
            <select onChange={handleTypeChange} value={selectedType}>
              <option value="playlist">Playlist</option>
              <option value="video">Video</option>
            </select>
          </label>
          <label>
            Select which GPT you would like:
            <select onChange={handleGPTChange} value={selectedGPT}>
              <option value="3.5">3.5</option>
              <option value="4">4</option>
            </select>
          </label>
          <input
            type="text"
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
            placeholder="Enter your link"
          />
          <input
            type="text"
            value={blurb2}
            onChange={(e) => setBlurb2(e.target.value)}
            placeholder="Enter your title"
          />
          <button type="submit">Submit Blurb</button>
        </form>
        {isDownloadable && <button onClick={downloadBlurb}>Download as DOCX</button>}
      </header>
    </div>
  );
}

export default App;
