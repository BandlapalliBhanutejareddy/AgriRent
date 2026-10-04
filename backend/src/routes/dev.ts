import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const REPORTS_FILE = path.join(__dirname, '../../live_fix_reports.json');

router.post('/report-issue', async (req: Request, res: Response) => {
  try {
    const report = {
      timestamp: new Date().toISOString(),
      screen: req.body.screen || 'Unknown Screen',
      role: req.body.role || 'Unknown Role',
      route: req.body.route || '/',
      issue: req.body.issue || '',
      user: req.body.user || null,
      context: req.body.context || {},
      status: 'RECEIVED'
    };

    console.log('\n==================================================');
    console.log('📱 PHONE LIVE FIX ISSUE RECEIVED:');
    console.log(`SCREEN: ${report.screen}`);
    console.log(`ROLE:   ${report.role}`);
    console.log(`ROUTE:  ${report.route}`);
    console.log(`ISSUE:  ${report.issue}`);
    console.log('==================================================\n');

    let reports: any[] = [];
    if (fs.existsSync(REPORTS_FILE)) {
      try {
        reports = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8'));
      } catch (_) {
        reports = [];
      }
    }
    reports.unshift(report);
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf8');

    res.json({
      success: true,
      message: 'Issue report received by live fix system',
      report
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/latest-issue', (req: Request, res: Response) => {
  if (fs.existsSync(REPORTS_FILE)) {
    try {
      const reports = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8'));
      return res.json({ success: true, latest: reports[0] || null });
    } catch (_) {}
  }
  res.json({ success: true, latest: null });
});

export default router;
