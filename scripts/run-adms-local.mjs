import { createServer } from "node:http";
import { handleZkAdmsRequest } from "../zkteco-adms-handler.mjs";

function makeServer(port) {
  const server = createServer(async (req, res) => {
    console.log(`[Local ADMS :${port}] Incoming ${req.method} ${req.url} from ${req.socket.remoteAddress}`);
    try {
      const handled = await handleZkAdmsRequest(req, res);
      if (!handled) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK");
      }
    } catch (err) {
      console.error(`[Local ADMS :${port}] Error:`, err);
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK");
    }
  });

  server.on("error", (err) => {
    console.warn(`[Local ADMS] Could not listen on port ${port}:`, err.message);
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 ZKTeco ADMS Server listening on http://0.0.0.0:${port}`);
  });

  return server;
}

makeServer(80);
makeServer(8080);

console.log("📡 Ready for punches on both port 80 and port 8080!");
