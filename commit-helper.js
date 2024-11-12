import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'
import simpleGit from 'simple-git'

const git = simpleGit();
import readline from 'readline'; // 改为 import

import chalk from 'chalk'; // 改为 import
dotenv.config()

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});


// 执行 git add .
async function stageChanges() {
  try {
    console.log(chalk.blue('正在将所有更改添加到暂存区 (git add .)...'));
    await git.add('.');
    console.log(chalk.green('所有更改已成功添加到暂存区。'));
  } catch (error) {
    console.error(chalk.red('添加更改到暂存区时出错：'), error);
    process.exit(1);
  }
}





async function generateCommitMessage(diffContent) {
  const apiKey = process.env.API_KEY;
  const prompt = `根据以下 git diff 内容生成一条只有中文的简洁的 commit 信息：\n\n${diffContent}\n\n`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent(prompt);
    return result.response.text()
  } catch (error) {
    console.error('Error generating commit message:', error);
    return null;
  }
}


// 获取 git diff 内容
async function getGitDiff() {
  try {
    const diff = await git.diff(['--cached']);
    return diff;
  } catch (error) {
    console.error('Error fetching git diff:', error);
    return null;
  }
}

// 主程序
async function main() {
  console.log(chalk.blue.bold('--- Git Commit Helper ---'));
  // 自动执行 git add .
  await stageChanges();

  console.log(chalk.green('正在获取暂存区的修改内容...\n'));

  const diffContent = await getGitDiff();
  if (diffContent) {
    console.log(chalk.yellow('Git diff 内容：\n'), chalk.white(diffContent));

    console.log(chalk.green('\n正在使用 OpenAI 生成提交信息...\n'));
    const commitMessage = await generateCommitMessage(diffContent);
    if (commitMessage) {
      console.log(chalk.cyan.bold('生成的提交信息：\n'), chalk.green(commitMessage));

      // 使用 readline 提示用户
      rl.question(chalk.magenta('是否使用此提交信息？(y/n): '), async (answer) => {
        if (answer.toLowerCase() === 'y') {
          await git.commit(commitMessage);
          console.log(chalk.green.bold('\n提交成功！🎉'));
        } else {
          console.log(chalk.red('\n提交已取消。'));
        }
        rl.close(); // 关闭 readline 接口
      });
    }
  } else {
    console.error(chalk.red('没有获取到任何修改内容。'));
    rl.close(); // 关闭 readline 接口，即使出错也不遗留资源
  }
}

main()