'use server'

import { spawn } from 'child_process';
import path from 'path';
import {AnalysisResult} from "@/app/page";

export interface CompetencesResult {
  projet: string;
  competences: Array<{
    competence: string;
    sous_competence: string;
    score: number;
  }>;
}

export async function analyzeProject(description: string, type: 'TE' | 'competences'): Promise<AnalysisResult | CompetencesResult> {
  return new Promise((resolve, reject) => {
    const escapedDescription = description.replace(/'/g, "'\\''");
    const pythonScript = path.join(process.cwd(), 'scripts', 'LLM_response.py');
    
    const pythonProcess = spawn('python3', [
      pythonScript,
      `'${escapedDescription}'`,
      '--type', type
    ]);

    let outputString = '';
    let errorString = '';
    
    pythonProcess.stdout.on('data', (data) => {
      outputString += data.toString();
      console.log('Python output:', data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
      console.error('Python error:', data.toString());
    });

    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      reject(error);
    });

    pythonProcess.on('close', (code) => {
      console.log('Python process exited with code:', code);
      console.log('Raw output:', outputString);
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}. Error: ${errorString}`));
        return;
      }
      try {
        const outputs = outputString.trim().split('\n').filter(line => line.trim());
        
        let jsonResult;
        if (type === 'TE') {
          jsonResult = JSON.parse(outputs[0]);
        } else {
          jsonResult = JSON.parse(outputs[outputs.length - 1]);
        }
        resolve(jsonResult);
      } catch (e) {
        console.error('JSON parse error:', e);
        console.error('Failed to parse:', outputString);
        reject(e);
      }
    });
  });
} 