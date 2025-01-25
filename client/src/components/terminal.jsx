import { Terminal as XTerminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";
import socket from "../socket";
import "@xterm/xterm/css/xterm.css";

const Terminal = () => {
  const terminalRef = useRef();
  const isRendered = useRef(false); // Avoid initializing multiple terminals

  useEffect(() => {
    if (isRendered.current) {
      return;
    }
    isRendered.current = true;

    const term = new XTerminal({
      rows: 20,
    });
    term.open(terminalRef.current);

    term.onData((data) => {
      socket.emit("terminal:write", data); // Send terminal input to server
    });

    function onTerminalData(data) {
      term.write(data); // Write server data to terminal
    }

    socket.on("terminal:data", onTerminalData); // Listen for server output

    // Cleanup socket listener when the component unmounts
    return () => {
      socket.off("terminal:data", onTerminalData);
    };
  }, []);

  return <div ref={terminalRef} id="terminal" />;
};

export default Terminal;
