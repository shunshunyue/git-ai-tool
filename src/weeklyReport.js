#!/usr/bin/env node
import readline from 'readline';
import chalk from 'chalk';
import { createVCS } from './core/vcsFactory.js'; // 引入工厂函数
import { generateReport } from './core/reportGenerator.js'; // 假设生成报告的函数在这个文件中

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 获取时间范围或默认最近一周
async function askTimeRangeOrDefault() {
  return new Promise((resolve) => {
    rl.question(
      chalk.magenta('是否使用默认时间范围（最近一周）？(y/n): '),
      (answer) => {
        if (answer.toLowerCase() === 'y') {
          const since = new Date();
          since.setDate(since.getDate() - 7); // 默认是最近一周
          const until = new Date();
          resolve({ since: since.toISOString().split('T')[0], until: until.toISOString().split('T')[0] });
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

// 获取多个项目路径，如果没有输入则使用当前路径
async function askForProjectPaths() {
  return new Promise((resolve) => {
    rl.question(chalk.magenta('请输入多个项目路径，使用逗号分隔（默认为当前路径）：'), (input) => {
      const projectPaths = input.trim() ? input.split(',').map((path) => path.trim()) : [process.cwd()];
      resolve(projectPaths);
    });
  });
}

// 获取版本控制类型
async function askForVCS() {
  return new Promise((resolve) => {
    rl.question(chalk.magenta('请输入版本控制系统类型 (git/svn): '), (input) => {
      resolve(input.trim().toLowerCase());
    });
  });
}

// 主程序
async function main() {
  console.log(chalk.blue.bold('--- 多项目周报生成器 ---'));

  // 获取时间范围
  const { since, until } = await askTimeRangeOrDefault();

  // 获取项目路径
  const projectPaths = await askForProjectPaths();

  // 获取版本控制类型
  const vcsType = await askForVCS();

  let allCommitLogs = '';

  // 循环处理每个项目路径
  for (let projectPath of projectPaths) {
    try {
      // 创建对应的 VCS 实例
      const vcs = createVCS(vcsType, projectPath);

      // 获取提交记录
      const logs = await vcs.getLogs(since, until);
      if (logs) {
        allCommitLogs += `\n--- ${projectPath} 项目 ---\n` + logs + '\n';
      }
    } catch (error) {
      console.error(chalk.red(`处理项目 ${projectPath} 时出错：`), error);
    }
  }

  if (allCommitLogs) {
    console.log(chalk.green('\n合并的提交记录：\n'), chalk.white(allCommitLogs));

    // 使用 Google Generative AI 生成周报
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
    console.log(chalk.yellow('未能获取到任何提交记录。'));
    rl.close();
  }
}

main();
