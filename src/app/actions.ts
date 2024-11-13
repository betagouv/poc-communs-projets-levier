'use server'

import { spawn } from 'child_process';
import path from 'path';

export async function analyzeProject(description: string) {
  try {

    const scriptPath = path.join(process.cwd(), 'scripts', 'analyzer.py');
    console.log('Attempting to execute Python script at:', scriptPath);


    const result = await new Promise((resolve, reject) => {

      // Use python3 with shell: true and full path
      const pythonProcess = spawn('python3', [scriptPath], {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      let dataString = '';

      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`Error: ${data}`);
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Process exited with code ${code}`));
          return;
        }
        try {
          const jsonResult = JSON.parse(dataString);
          resolve(jsonResult);
        } catch (e) {
          reject(e);
        }
      });

      pythonProcess.stdin.write(description);
      pythonProcess.stdin.end();
    });

    return result;
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Analysis failed');
  }
} 