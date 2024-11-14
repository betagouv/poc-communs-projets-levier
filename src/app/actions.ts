'use server'

import { spawn } from 'child_process';
import path from 'path';
import {AnalysisResult} from "@/app/page";

export async function analyzeProject(description: string): Promise<AnalysisResult> {
  return new Promise((resolve, reject) => {
    // Escape single quotes and wrap the description in single quotes
    const escapedDescription = description.replace(/'/g, "'\\''");
    const pythonScript = path.join(process.cwd(), 'scripts', 'LLM_response.py');
    
    const pythonProcess = spawn('python3', [
      pythonScript,
      `'${escapedDescription}'`  // Wrap in quotes to handle spaces and special characters
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
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}. Error: ${errorString}`));
        return;
      }
      try {
        const jsonResult = JSON.parse(outputString);
        resolve(jsonResult);
      } catch (e) {
        reject(e);
      }
    });
  });
} 