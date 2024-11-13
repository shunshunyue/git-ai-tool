#!/usr/bin/env node
import simpleGit from 'simple-git';
import readline from 'readline';
import chalk from 'chalk';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from './config.js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 获取当前用户的 Git 配置
async function getGitUserName() {
  const git = simpleGit();
  try {
    const config = await git.raw(['config', 'user.name']);
    return config.trim(); // 去除多余的空格和换行
  } catch (error) {
    console.error(chalk.red('获取 Git 用户名失败，请确保已配置 user.name：'), error);
    process.exit(1);
  }
}


// 获取最近一周的时间范围
function getLastWeekRange() {
  const now = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);

  const formatDate = (date) => date.toISOString().split('T')[0]; // 格式化为 YYYY-MM-DD
  return {
    since: formatDate(oneWeekAgo),
    until: formatDate(now),
  };
}

// 获取时间范围内的 git log
async function getGitLogs(projectPath, since, until) {
  const git = simpleGit(projectPath); // 为每个项目创建一个 git 实例
  const author = await getGitUserName(); // 获取当前用户的用户名
  try {
    console.log(chalk.blue(`正在获取 ${projectPath} 项目从 ${since} 到 ${until} 的提交记录...\n`));

    const log = await git.log({
      '--since': since,
      '--until': until,
      '--author': author, // 只获取当前用户的提交记录
      format: {
        hash: '%h',
        date: '%ar',
        message: '%s',
        author_name: '%an',
      },
    });

    if (log.all.length === 0) {
      console.log(chalk.yellow(`在 ${projectPath} 项目中没有找到在该时间范围内的提交记录。\n`));
      return null;
    }

    // 格式化提交记录
    return log.all
      .map((commit) => `${commit.hash} - ${commit.author_name}: ${commit.message} (${commit.date})`)
      .join('\n');
  } catch (error) {
    console.error(chalk.red('获取提交记录时出错：'), error);
    return null;
  }
}

// 使用 Google Generative AI 生成周报
async function generateReport(commitLogs) {
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

// 询问时间范围或默认最近一周
async function askTimeRangeOrDefault() {
  return new Promise((resolve) => {
    rl.question(
      chalk.magenta('是否使用默认时间范围（最近一周）？(y/n): '),
      (answer) => {
        if (answer.toLowerCase() === 'y') {
          const { since, until } = getLastWeekRange();
          console.log(chalk.green(`使用最近一周的时间范围：${since} 到 ${until}`));
          resolve({ since, until });
        } else {
          rl.question(chalk.magenta('请输入开始日期 (YYYY-MM-DD)：'), (since) => {
            rl.question(chalk.magenta('请输入结束日期 (YYYY-MM-DD)：'), (until) => {
              resolve({ since, until });
            });
          });
        }
      }
    );
  });
}

// 获取项目路径
async function askForProjects() {
  return new Promise((resolve) => {
    rl.question(chalk.magenta('请输入多个项目的路径，使用逗号分隔：'), (input) => {
      const projectPaths = input.split(',').map((path) => path.trim());
      resolve(projectPaths);
    });
  });
}

// 主程序
async function main() {
  console.log(chalk.blue.bold('--- 多项目周报生成器 ---'));

  // 获取时间范围
  const { since, until } = await askTimeRangeOrDefault();

  // 获取项目路径
  const projectPaths = await askForProjects();

  let allCommitLogs = '';

  // 获取每个项目的提交记录
  for (let projectPath of projectPaths) {
    const commitLogs = await getGitLogs(projectPath, since, until);
    if (commitLogs) {
      allCommitLogs += `\n--- ${projectPath} 项目 ---\n` + commitLogs + '\n';
    }
  }

  if (allCommitLogs) {
    console.log(chalk.green('\n合并的提交记录：\n'), chalk.white(allCommitLogs));

    // 使用 Google Generative AI 生成周报
    console.log(chalk.green('\n正在生成周报...\n'));
    const report = await generateReport(allCommitLogs);
    if (report) {
      console.log(chalk.cyan.bold('生成的周报：\n'), chalk.green(report));

      rl.question(chalk.magenta('是否将周报保存为文件？(y/n): '), async (answer) => {
        if (answer.toLowerCase() === 'y') {
          const fs = await import('fs');
          fs.writeFileSync(`multi-project-report-${since}-to-${until}.md`, report, 'utf8');
          console.log(chalk.green.bold('\n周报已保存为文件！🎉'));
        } else {
          console.log(chalk.red('\n周报未保存。'));
        }
        rl.close();
      });
    }
  } else {
    rl.close();
  }
}

main();
