import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../core/application/base.controller.js';
import { BiometricService, biometricService } from './zkteco.service.js';

export class BiometricController extends BaseController {
  constructor(private service: BiometricService = biometricService) {
    super();
  }

  /**
   * Handles GET and POST /iclock/cdata
   */
  handleCdata = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sn = (req.query.SN || req.query.sn || '') as string;
      const table = ((req.query.table || '') as string).toUpperCase();

      // 1. GET /iclock/cdata: Handshake & Config
      if (req.method === 'GET') {
        console.log(`[ZKTeco ADMS] Handshake from Device SN: ${sn || 'Unknown'}`);
        if (sn) {
          await this.service.recordDeviceActivity(sn);
        }

        const configResponse = this.service.getConfigResponse(sn);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Length', Buffer.byteLength(configResponse));
        return res.status(200).send(configResponse);
      }

      // 2. POST /iclock/cdata: Attendance Punch Ingestion
      if (req.method === 'POST') {
        const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        console.log(`[ZKTeco ADMS] Data received from SN: ${sn}, Table: ${table || 'ATTLOG'}`);

        if (table === 'ATTLOG' || !table) {
          const punches = this.service.parseAttLogLines(rawBody, sn);
          console.log(`[ZKTeco ADMS] Found ${punches.length} punch records to process.`);

          // Immediately acknowledge device to prevent timeouts and retransmissions
          res.setHeader('Content-Type', 'text/plain');
          res.status(200).send(`OK: ${punches.length}\r\n`);

          // Process punches asynchronously in background
          (async () => {
            for (const punch of punches) {
              await this.service.processPunchRecord(punch);
            }
          })().catch((err) => {
            console.error('[ZKTeco ADMS] Background punch processing error:', err);
          });
          return;
        }

        // Other tables (e.g. OPERLOG, USER)
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send('OK\r\n');
      }

      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send('OK\r\n');
    } catch (err) {
      next(err);
    }
  };

  /**
   * Handles GET /iclock/getrequest: Heartbeat & Command Polling
   */
  handleGetRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sn = (req.query.SN || req.query.sn || '') as string;
      console.log(`[ZKTeco ADMS] Heartbeat getrequest from SN: ${sn || 'Unknown'}`);

      const responseText = await this.service.handleHeartbeatAndCommands(sn);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(responseText);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Handles POST /iclock/devicecmd: Command Execution Acknowledgment
   */
  handleDeviceCmd = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sn = (req.query.SN || req.query.sn || '') as string;
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      await this.service.handleCommandAck(sn, rawBody);
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send('OK\r\n');
    } catch (err) {
      next(err);
    }
  };
}

export const biometricController = new BiometricController();
