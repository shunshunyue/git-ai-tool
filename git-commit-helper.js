#!/usr/bin/env node
import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'
import simpleGit from 'simple-git'
import { config } from './config.js'


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
  const apiKey = config.API_KEY;
  const apiModel = config.API_MODEL;
  const commitRule = config?.commitRule || `
      正确格式:<type>(<scope>):<subject>
       示例:docs:更新 README，添加开发者部分
       type
         feat:产品新功能:通常是能够让用户觉察到的变化，小到文案或样式修改
         fix:修复 bug
         docs:更新文档或注释
         style:代码格式调整，对逻辑无影响:比如为按照 eslint 或团队风格修改代码格式。注意不是 UI 变更
         test:单测相关变更
         refactor:重构:不影响现有功能或添加功能。比如文件、变量重命名，代码抽象为函数，消除魔法数字等
         chore:杂项 其他无法归类的变更，比如代码合并chore
         perf:性能提升变更
         ci:持续集成相关变更
         build:代码构建相关变更:比如修复部署时的构建问题、构建脚本 webpack 或 qulp 
         temp相关变更临时代码:不计入 CHANGELOG，比如必须部署到某种环境才能测试的变更
       scope:可选。变更范围(细粒度要合适，并在一个项目中保持一致):比如页面名、模块名、或组件名
       subject:此次变更的简短描述，必须采用现在时态，如果是英语则首字母不能大写，句尾不加句号`
  const prompt = `根据以下 git diff 内容生成一条符合此规则${commitRule}只有中文的简洁的 commit 信息,\n\n${diffContent}\n\n`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: apiModel });
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
    // console.log(chalk.yellow('Git diff 内容：\n'), chalk.white(diffContent));

    console.log(chalk.green('\n正在使用 AI 生成提交信息...\n'));
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