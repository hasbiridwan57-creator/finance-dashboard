import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), '../smart-money-tracker/data/paper_trade_ledger.jsonl');
  
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Ledger not found' }, { status: 404 });
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  const lines = data.trim().split('\n').map(line => JSON.parse(line));
  
  return NextResponse.json(lines.slice(-50)); // Last 50 trades
}
