import { WebSocketServer } from 'ws';

export function setupWebSockets(server) {
  const wss = new WebSocketServer({ noServer: true });

  // Map of active sockets: socket -> { uid, alias, matchedSocket, soundState, isBreathing }
  const clients = new Map();
  const matchmakingQueue = [];

  // Handle HTTP upgrade matching
  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  // Helper: broadcast system updates
  function broadcastPresence() {
    let onlineCount = clients.size;
    let breathersCount = 0;
    const soundCounts = { rain: 0, waves: 0, piano: 0, crickets: 0 };

    for (const data of clients.values()) {
      if (data.isBreathing) breathersCount++;
      if (data.soundState) {
        soundCounts[data.soundState] = (soundCounts[data.soundState] || 0) + 1;
      }
    }

    const payload = JSON.stringify({
      type: 'presence_update',
      onlineCount,
      breathersCount,
      soundCounts
    });

    for (const ws of clients.keys()) {
      if (ws.readyState === 1) {
        ws.send(payload);
      }
    }
  }

  wss.on('connection', (ws) => {
    // Register client
    clients.set(ws, {
      uid: null,
      alias: null,
      matchedSocket: null,
      soundState: null,
      isBreathing: false
    });

    // Send initial status
    broadcastPresence();

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        const clientData = clients.get(ws);
        if (!clientData) return;

        switch (data.type) {
          case 'init':
            clientData.uid = data.uid;
            clientData.alias = data.alias;
            broadcastPresence();
            break;

          case 'join_queue':
            // If already in queue, ignore
            if (matchmakingQueue.find(q => q.ws === ws)) return;

            // Try to match
            if (matchmakingQueue.length > 0) {
              const partner = matchmakingQueue.shift();
              const partnerData = clients.get(partner.ws);

              if (partnerData && partner.ws.readyState === 1) {
                // Connect them
                clientData.matchedSocket = partner.ws;
                partnerData.matchedSocket = ws;

                // Send match alerts
                ws.send(JSON.stringify({
                  type: 'match_found',
                  peerAlias: partnerData.alias || 'Cineva treaz'
                }));
                partner.ws.send(JSON.stringify({
                  type: 'match_found',
                  peerAlias: clientData.alias || 'Cineva treaz'
                }));
              } else {
                // Partner disconnected, retry matching
                matchmakingQueue.push({ ws, uid: clientData.uid, alias: clientData.alias });
                ws.send(JSON.stringify({ type: 'waiting_in_queue' }));
              }
            } else {
              matchmakingQueue.push({ ws, uid: clientData.uid, alias: clientData.alias });
              ws.send(JSON.stringify({ type: 'waiting_in_queue' }));
            }
            break;

          case 'leave_queue':
            const idx = matchmakingQueue.findIndex(q => q.ws === ws);
            if (idx !== -1) {
              matchmakingQueue.splice(idx, 1);
            }
            ws.send(JSON.stringify({ type: 'left_queue' }));
            break;

          case 'send_message':
            if (clientData.matchedSocket && clientData.matchedSocket.readyState === 1) {
              clientData.matchedSocket.send(JSON.stringify({
                type: 'chat_message',
                senderAlias: clientData.alias,
                text: data.text
              }));
            } else {
              ws.send(JSON.stringify({ type: 'peer_disconnected' }));
            }
            break;

          case 'leave_chat':
            if (clientData.matchedSocket) {
              const partnerWs = clientData.matchedSocket;
              const partnerData = clients.get(partnerWs);
              if (partnerData) {
                partnerData.matchedSocket = null;
                if (partnerWs.readyState === 1) {
                  partnerWs.send(JSON.stringify({ type: 'peer_disconnected' }));
                }
              }
              clientData.matchedSocket = null;
            }
            ws.send(JSON.stringify({ type: 'chat_left' }));
            break;

          case 'start_breathing':
            clientData.isBreathing = true;
            broadcastPresence();
            break;

          case 'stop_breathing':
            clientData.isBreathing = false;
            broadcastPresence();
            break;

          case 'update_sound':
            clientData.soundState = data.sound; // 'rain', 'waves', 'piano', 'crickets' or null
            broadcastPresence();
            break;

          default:
            console.log("Unknown socket action:", data.type);
        }
      } catch (err) {
        console.error("Socket error processing message:", err);
      }
    });

    ws.on('close', () => {
      const clientData = clients.get(ws);
      if (clientData) {
        // Remove from matchmaking queue
        const qIdx = matchmakingQueue.findIndex(q => q.ws === ws);
        if (qIdx !== -1) matchmakingQueue.splice(qIdx, 1);

        // Notify matched partner of disconnect
        if (clientData.matchedSocket) {
          const partnerWs = clientData.matchedSocket;
          const partnerData = clients.get(partnerWs);
          if (partnerData) {
            partnerData.matchedSocket = null;
            if (partnerWs.readyState === 1) {
              partnerWs.send(JSON.stringify({ type: 'peer_disconnected' }));
            }
          }
        }
      }
      clients.delete(ws);
      broadcastPresence();
    });
  });

  console.log("[WS] WebSocket Server attached successfully");
}
