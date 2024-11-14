'use server'

import { spawn } from 'child_process';
import path from 'path';

export async function analyzeProject(description: string) {
  try {
    // Get absolute path to the Python script
    const scriptPath = path.join(process.cwd(), 'scripts', 'LLM_response.py');
    console.log('Attempting to execute Python script at:', scriptPath);

    const result = await new Promise((resolve, reject) => {
      // Use python3 with shell: true and full path
      const pythonProcess = spawn('python3', [scriptPath, description], {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let dataString = '';
      let errorString = '';

      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
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
    console.error('Error in analyzeProject:', error);
  }
} 