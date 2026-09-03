import { createServer } from "node:http";
import { handleZkAdmsRequest } from "../zkteco-adms-handler.mjs";

const PORT = 80;

const server = createServer(async (req, res) => {
  console.log(`[Local ADMS] Incoming ${req.method} ${req.url} from ${req.socket.remoteAddress}`);
  const handled = await handleZkAdmsRequest(req, res);
  if (!handled) {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Local ZKTeco ADMS Server is running!`);
  console.log(`👉 Listening on: http://0.0.0.0:${PORT}`);
  console.log(`📡 Ready to receive punches from 192.168.20.201`);
});
