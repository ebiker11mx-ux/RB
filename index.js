// server/index.js
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
  });

  const rooms = new Map(); // roomId -> { players: Set<socketId>, state: {} }
  const MAX_PLAYERS = 2;

  function findOrCreateRoom() {
    for (const [roomId, room] of rooms) {
        if (room.players.size < MAX_PLAYERS) return roomId;
          }
            const roomId = Math.random().toString(36).slice(2, 8);
              rooms.set(roomId, { players: new Set(), state: { winner: null } });
                return roomId;
                }

                io.on("connection", (socket) => {
                  const roomId = findOrCreateRoom();
                    socket.join(roomId);
                      const room = rooms.get(roomId);
                        room.players.add(socket.id);

                          io.to(roomId).emit("room-info", {
                              roomId,
                                  players: Array.from(room.players)
                                    });

                                      socket.on("player-update", (payload) => {
                                          // payload: { pos:{x,y,z}, vel:{x,y,z}, checkpoint:number, name:string }
                                              socket.to(roomId).emit("player-update", { id: socket.id, ...payload });
                                                });

                                                  socket.on("win", (data) => {
                                                      if (!rooms.get(roomId).state.winner) {
                                                            rooms.get(roomId).state.winner = socket.id;
                                                                  io.to(roomId).emit("game-over", { winner: socket.id, name: data?.name || "Player" });
                                                                      }
                                                                        });

                                                                          socket.on("reset", () => {
                                                                              rooms.get(roomId).state.winner = null;
                                                                                  io.to(roomId).emit("reset");
                                                                                    });

                                                                                      socket.on("disconnect", () => {
                                                                                          const room = rooms.get(roomId);
                                                                                              if (room) {
                                                                                                    room.players.delete(socket.id);
                                                                                                          io.to(roomId).emit("room-info", {
                                                                                                                  roomId,
                                                                                                                          players: Array.from(room.players)
                                                                                                                                });
                                                                                                                                      if (room.players.size === 0) rooms.delete(roomId);
                                                                                                                                          }
                                                                                                                                            });
                                                                                                                                            });

                                                                                                                                            const PORT = process.env.PORT || 3001;
                                                                                                                                            server.listen(PORT, () => console.log("Server listening on", PORT));