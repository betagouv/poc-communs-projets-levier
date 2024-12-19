"use server";

import { spawn } from "child_process";
import path from "path";

export async function analyzeProject<T>(description: string, type: "TE" | "competences"): Promise<T> {
  return new Promise((resolve, reject) => {
    const escapedDescription = description.replace(/'/g, "'\\''");
    const pythonScript = path.join(process.cwd(), "scripts", "LLM_response.py");

    const pythonProcess = spawn("python3", [pythonScript, `'${escapedDescription}'`, "--type", type]);

    let outputString = "";
    let errorString = "";

    pythonProcess.stdout.on("data", (data) => {
      outputString += data.toString();
      console.log("Python output:", data.toString());
    });

    pythonProcess.stderr.on("data", (data) => {
      errorString += data.toString();
      console.error("Python error:", data.toString());
    });

    pythonProcess.on("error", (error) => {
      console.error("Failed to start Python process:", error);
      reject(error);
    });

    pythonProcess.on("close", (code) => {
      console.log("Python process exited with code:", code);
      console.log("Raw output:", outputString);
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}. Error: ${errorString}`));
        return;
      }
      try {
        const outputs = outputString
          .trim()
          .split("\n")
          .filter((line) => line.trim());

        console.log("outputs", outputs);
        let jsonResult;
        if (type === "TE") {
          jsonResult = JSON.parse(outputs[0]);
        } else {
          jsonResult = JSON.parse(outputs[outputs.length - 1]);
        }
        resolve(jsonResult);
      } catch (e) {
        console.error("JSON parse error:", e);
        console.error("Failed to parse:", outputString);
        reject(e);
      }
    });
  });
}
