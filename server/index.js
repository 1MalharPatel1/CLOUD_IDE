const http = require("http");
const express = require("express");
const { Server: SocketServer } = require("socket.io");
const fs = require("fs/promises");
const path = require("path");
const chokidar = require("chokidar");
const cors = require("cors");
const pty = require("node-pty");

const BASE_USER_DIR = path.resolve(__dirname, "./user");

const app = express();
const server = http.createServer(app);
const io = new SocketServer({ cors: "*" });

app.use(cors());
app.use(express.json());
io.attach(server);

const userSessions = new Map();

async function generateFileTree(directory) {
  const tree = {};

  async function buildTree(currentDir, currentTree) {
    const files = await fs.readdir(currentDir);

    for (const file of files) {
      if (file === ".bash_history" || file === ".restricted_bashrc") continue;
      const filePath = path.join(currentDir, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        currentTree[file] = {};
        await buildTree(filePath, currentTree[file]);
      } else {
        currentTree[file] = null;
      }
    }
  }

  await buildTree(directory, tree);
  return tree;
}

app.post("/passkey", async (req, res) => {
  const { passkey } = req.body;

  if (!passkey || typeof passkey !== "string") {
    return res.status(400).json({ error: "Invalid passkey" });
  }

  const sanitizedPasskey = passkey.trim().replace(/[^\w-]/g, "_");
  const userDir = path.join(BASE_USER_DIR, sanitizedPasskey);

  try {
    await fs.mkdir(userDir, { recursive: true });
    userSessions.set(req.ip, userDir);
    res.json({ success: true });
  } catch (error) {
    console.error("Error creating user folder:", error);
    res.status(500).json({ error: "Failed to create folder" });
  }
});

app.use((req, res, next) => {
  const userDir = userSessions.get(req.ip);

  if (!userDir) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  req.userDir = userDir;
  next();
});

app.get("/files", async (req, res) => {
  const fileTree = await generateFileTree(req.userDir);
  res.json({ tree: fileTree });
});

app.get("/files/content", async (req, res) => {
  const filePath = path.resolve(req.userDir, `.${req.query.path}`);
  if (!filePath.startsWith(req.userDir)) {
    return res.status(403).json({ error: "Access denied" });
  }

  const content = await fs.readFile(filePath, "utf-8");
  res.json({ content });
});

app.post("/files/save", async (req, res) => {
  const { path: filePath, content } = req.body;
  const absolutePath = path.resolve(req.userDir, `.${filePath}`);

  if (!absolutePath.startsWith(req.userDir)) {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    await fs.writeFile(absolutePath, content, "utf-8");
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to save file:", error);
    res.status(500).json({ error: "Failed to save file" });
  }
});

// Terminal handling
io.on("connection", (socket) => {
  const userDir = userSessions.get(socket.handshake.address);

  if (!userDir) {
    socket.emit("terminal:data", "Unauthorized access.");
    return;
  }

  const shell = pty.spawn("bash", [], {
    name: "xterm-256color",
    cwd: userDir,
    env: process.env,
  });

  shell.on("data", (data) => {
    socket.emit("terminal:data", data);
  });

  socket.on("terminal:write", (data) => {
    shell.write(data);
  });

  socket.on("disconnect", () => {
    shell.kill();
  });
});

server.listen(9000, "0.0.0.0", () => {
  console.log("🐳 Server running on port 9000");
});
