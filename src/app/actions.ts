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
          const classificationResult = JSON.parse(outputs[0]);
          console.log("Classification Result:", classificationResult);
          if (outputs.length > 1) {
            const questionsResult = JSON.parse(outputs[1]);
            console.log("Questions Result:", questionsResult);
            classificationResult.questions = questionsResult;
          }
          jsonResult = classificationResult;
          console.log("Final Result:", jsonResult);
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

export async function generateQuestions(description: string, classificationResult: LeviersResult): Promise<Questions> {
  return new Promise((resolve, reject) => {
    const escapedDescription = description.replace(/'/g, "'\\''");
    // Stringify and properly escape the classification
    const classification = JSON.stringify(classificationResult);
    
    // Log the values for debugging
    console.log("Classification being sent:", classification);
    
    const pythonScript = path.join(process.cwd(), "scripts", "LLM_response.py");

    const pythonProcess = spawn("python3", [
      pythonScript, 
      `'${escapedDescription}'`, 
      "--type", 
      "questions",
      "--classification",
      classification  // Remove the quotes, let Python handle it
    ]);

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

        console.log("Parsing outputs:", outputs);
        const jsonResult = JSON.parse(outputs[0]); // Changed from outputs[1] to outputs[0]
        console.log("Parsed questions:", jsonResult);
        resolve(jsonResult);
      } catch (e) {
        console.error("JSON parse error:", e);
        console.error("Failed to parse:", outputString);
        reject(e);
      }
    });
  });
}

export async function generateResume(
  description: string, 
  answers: Record<string, "oui" | "non">  // Now contains full questions as keys
): Promise<string> {
  return new Promise((resolve, reject) => {
    const escapedDescription = description.replace(/'/g, "'\\''");
    
    // Format answers to include full questions
    const formattedAnswers = Object.entries(answers).reduce((acc, [question, answer]) => ({
      ...acc,
      [question]: answer
    }), {});
    
    const answersJson = JSON.stringify(formattedAnswers);
    console.log("Sending answers to Python:", answersJson);
    
    const pythonScript = path.join(process.cwd(), "scripts", "LLM_response.py");

    const pythonProcess = spawn("python3", [
      pythonScript, 
      `'${escapedDescription}'`,
      "--type",
      "resume",
      "--answers",
      answersJson
    ]);

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
      resolve(outputString.trim());
    });
  });
}
