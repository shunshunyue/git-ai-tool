import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './../../config.js';  // 假设你已在 config.js 中配置 API_KEY 和 API_MODEL
import chalk from 'chalk';

export async function generateReport(commitLogs) {
  console.log(chalk.blue.bold('正在生成周报.....'));

  const apiKey = config.API_KEY;
  const apiModel = config.API_MODEL;
  const prompt = `根据以下提交记录生成一份详细的只有中文的周报，适合团队分享：\n\n${commitLogs}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: apiModel });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error(chalk.red('生成报告时出错：'), error);
    return null;
  }
}