import simpleGit from 'simple-git';
import readline from 'readline';
import chalk from 'chalk';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai'

const git = simpleGit();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
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


// 获取时间范围内的 git log
async function getGitLogs(since, until) {
  try {
    console.log(chalk.blue(`正在获取从 ${since} 到 ${until} 的提交记录...\n`));

    // 正确使用 `--since` 和 `--until`
    const log = await git.log({
      '--since': since,
      '--until': until,
      format: {
        hash: '%h',
        date: '%ar',
        message: '%s',
        author_name: '%an',
      },
    });

    if (log.all.length === 0) {
      console.log(chalk.yellow('在指定时间范围内没有任何提交记录。\n'));
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
  const apiKey = process.env.API_KEY;
  const prompt = `根据以下提交记录生成一份详细的只有中文的周报，适合团队分享：\n\n${commitLogs}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error(chalk.red('生成报告时出错：'), error);
    return null;
  }
}

// 询问时间范围
async function askTimeRange() {
  return new Promise((resolve) => {
    rl.question(chalk.magenta('请输入开始日期 (YYYY-MM-DD)：'), (since) => {
      rl.question(chalk.magenta('请输入结束日期 (YYYY-MM-DD)：'), (until) => {
        resolve({ since, until });
      });
    });
  });
}

// 主程序
async function main() {
  console.log(chalk.blue.bold('--- 周报生成器 ---'));

  // 获取时间范围
  const { since, until } = await askTimeRangeOrDefault();

  // 获取提交记录
  const commitLogs = await getGitLogs(since, until);
  if (commitLogs) {
    console.log(chalk.green('\n提交记录：\n'), chalk.white(commitLogs));

    // 使用 Google Generative AI 生成周报
    console.log(chalk.green('\n正在生成周报...\n'));
    const report = await generateReport(commitLogs);
    if (report) {
      console.log(chalk.cyan.bold('生成的周报：\n'), chalk.green(report));

      rl.question(chalk.magenta('是否将周报保存为文件？(y/n): '), async (answer) => {
        if (answer.toLowerCase() === 'y') {
          const fs = await import('fs');
          fs.writeFileSync(`report-${since}-to-${until}.txt`, report, 'utf8');
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
