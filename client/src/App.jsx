import { useState, useEffect, useCallback } from "react";
import Terminal from "./components/terminal";
import FileTree from "./components/tree";
import socket from "./socket";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

import "./App.css";

function App() {
  const [fileTree, setFileTree] = useState({});
  const [selectedFile, setSelectedFile] = useState("");
  const [code, setCode] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [passkey, setPasskey] = useState("");
  const [isFolderLoaded, setIsFolderLoaded] = useState(false);

  const isSaved = selectedFileContent === code;

  const getFileTree = async () => {
    const response = await fetch("http://localhost:9000/files");
    const result = await response.json();
    setFileTree(result.tree);
  };

  const getFileContents = useCallback(async () => {
    if (!selectedFile) return;
    const response = await fetch(
      `http://localhost:9000/files/content?path=${selectedFile}`
    );
    const result = await response.json();
    setSelectedFileContent(result.content);
  }, [selectedFile]);

  const saveFileContents = useCallback(async () => {
    if (!selectedFile || isSaved) return;
    await fetch("http://localhost:9000/files/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: selectedFile,
        content: code,
      }),
    });
  }, [selectedFile, code, isSaved]);

  useEffect(() => {
    setCode(selectedFileContent);
  }, [selectedFileContent]);

  useEffect(() => {
    if (selectedFile) getFileContents();
  }, [getFileContents, selectedFile]);

  useEffect(() => {
    socket.on("file:refresh", getFileTree);
    return () => {
      socket.off("file:refresh", getFileTree);
    };
  }, []);

  useEffect(() => {
    if (code && !isSaved) {
      const timer = setTimeout(saveFileContents, 5000); // Save after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [code, saveFileContents, isSaved]);

  const submitPasskey = async () => {
    const response = await fetch("http://localhost:9000/passkey", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ passkey }),
    });

    if (response.ok) {
      setIsFolderLoaded(true);
      getFileTree();
    } else {
      alert("Invalid passkey or error loading folder");
    }
  };

  return (
    <div className="playground-container">
      {!isFolderLoaded ? (
        <div className="passkey-container">
          <h2>Enter Passkey to Access Folder</h2>
          <input
            type="text"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
            placeholder="Enter passkey"
          />
          <button onClick={submitPasskey}>Submit</button>
        </div>
      ) : (
        <>
          <div className="editor-container">
            <div className="files">
              <FileTree
                onSelect={(path) => {
                  setSelectedFile(path);
                }}
                tree={fileTree}
              />
            </div>
            <div className="editor">
              {selectedFile && (
                <p>
                  {selectedFile.replaceAll("/", " > ")}{" "}
                  {isSaved ? "saved" : "unsaved"}
                </p>
              )}
              <AceEditor
                value={code}
                onChange={(value) => setCode(value)}
              />
            </div>
          </div>
          <div className="terminal-container">
            <Terminal />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
