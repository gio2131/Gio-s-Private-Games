import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";

async function startServer() {
    const app = express();
    const server = createServer(app);
    const wss = new WebSocketServer({ noServer: true });
    const PORT = 3000;

    // Handle WebSocket upgrades explicitly
    server.on("upgrade", (request, socket, head) => {
        const { pathname } = new URL(request.url || "", `http://${request.headers.host}`);
        if (pathname === "/ws") {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit("connection", ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    // Active users: { ws: WebSocket, username: string }
    const activeUsers = new Map<WebSocket, string>();

    wss.on("connection", (ws) => {
        ws.on("message", (data) => {
            try {
                const message = JSON.parse(data.toString());

                if (message.type === "join") {
                    const username = message.username.trim();
                    const isTaken = Array.from(activeUsers.values()).some(
                        (u) => u.toLowerCase() === username.toLowerCase()
                    );

                    if (isTaken) {
                        ws.send(JSON.stringify({ type: "error", message: "Username already taken" }));
                    } else if (username.length < 2) {
                        ws.send(JSON.stringify({ type: "error", message: "Username too short" }));
                    } else {
                        activeUsers.set(ws, username);
                        ws.send(JSON.stringify({ type: "join_success", username }));
                        
                        // Broadcast join
                        broadcast({
                            type: "system",
                            text: `${username} joined the chat`,
                            timestamp: Date.now()
                        });
                        
                        // Update user count
                        broadcastUserCount();
                    }
                } else if (message.type === "chat") {
                    const username = activeUsers.get(ws);
                    if (username && message.text.trim()) {
                        broadcast({
                            type: "message",
                            username,
                            text: message.text.trim(),
                            timestamp: Date.now()
                        });
                    }
                }
            } catch (e) {
                console.error("WS Message error:", e);
            }
        });

        ws.on("close", () => {
            const username = activeUsers.get(ws);
            if (username) {
                activeUsers.delete(ws);
                broadcast({
                    type: "system",
                    text: `${username} left the chat`,
                    timestamp: Date.now()
                });
                broadcastUserCount();
            }
        });
    });

    function broadcast(data: any) {
        const payload = JSON.stringify(data);
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
            }
        });
    }

    function broadcastUserCount() {
        broadcast({
            type: "user_count",
            count: activeUsers.size
        });
    }

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
            root: process.cwd(),
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
