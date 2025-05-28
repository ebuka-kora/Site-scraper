// frontend/src/App.js
import React, { useState } from "react";
import axios from "axios";
import "./App.css";
import Footer from "./components/Footer";



function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showDownload, setShowDownload] = useState(false);

  const handleScrape = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setShowDownload(false);

    try {
      const res = await axios.post("http://localhost:5000/api/scrape", { url });
      setResult(res.data);
      setShowDownload(true);
    } catch (err) {
      setError(err.response?.data?.error || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/download");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "scraped_site.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Download failed.");
    }
  };

  return (
    <div className="app">
      <h1>Welcome to EasyWebScrape</h1>
      <h4>Welcome to EasyWebScrape, a powerful and user-friendly web scraping tool designed to help you effortlessly extract and download complete website content. Simply enter any URL, and our scraper fetches not only the page’s HTML text but also all linked assets — including images, CSS stylesheets, JavaScript files, videos, and gifs.
<br/>
Features include:<br/>

* Clean, intuitive interface for easy URL input and scraping<br/>
* Real-time progress feedback and error notifications<br/>
* Downloadable ZIP archive containing all scraped content<br/>
* Support for complex modern web pages with dynamic content<br/>

Try EasyWebScrape today and unlock the full potential of web data extraction without hassle!<br/>

</h4>
      <input
        type="text"
        placeholder="Enter website URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      /><br/>
      <div className="button-container">
  <button onClick={handleScrape} disabled={!url || loading}>
    {loading ? "Scraping..." : "Scrape"}
  </button>
</div>


      {loading && <p>Scraping in progress. Please wait...</p>}
      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result">
          <h2>{result.title}</h2>
          <p>{result.content.slice(0, 300)}...</p>
        </div>
      )}

      {showDownload && (
       <div className="button-container">
         <button onClick={handleDownload} className="download-btn">
          Download ZIP
        </button></div>
      )}

      <Footer />
    </div>
  );

}

export default App;
